// 响应式内核测试（纯逻辑，在 Node 中运行）。对应 docs/rfc/0001-signals.md 第 9 节。
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { batch, computed, createScope, effect, isSignal, signal, untrack } from '../src/core/signals.js';

/** 捕获 effect 中通过 reportError 报告的错误 */
function captureErrors(t) {
  const errors = [];
  const original = globalThis.reportError;
  globalThis.reportError = (error) => errors.push(error);
  t.after(() => {
    globalThis.reportError = original;
  });
  return errors;
}

const observerCount = (s) => s._observers?.size ?? 0;

describe('signal', () => {
  test('读写、peek、get/set 别名', () => {
    const s = signal(1);
    assert.equal(s.value, 1);
    s.value = 2;
    assert.equal(s.peek(), 2);
    s.set(3);
    assert.equal(s.get(), 3);
    assert.equal(isSignal(s), true);
    assert.equal(isSignal(3), false);
  });

  test('相等的值不触发；equals 可自定义，false 表示总是触发', () => {
    const plain = signal(1);
    const custom = signal({ id: 1 }, { equals: (a, b) => a.id === b.id });
    const always = signal(1, { equals: false });
    const runs = { plain: 0, custom: 0, always: 0 };
    effect(() => void (plain.value, runs.plain++));
    effect(() => void (custom.value, runs.custom++));
    effect(() => void (always.value, runs.always++));
    plain.value = 1;
    custom.value = { id: 1 };
    always.value = 1;
    assert.deepEqual(runs, { plain: 1, custom: 1, always: 2 });
  });
});

describe('computed', () => {
  test('惰性求值并缓存', () => {
    const s = signal(1);
    let runs = 0;
    const c = computed(() => {
      runs++;
      return s.value * 2;
    });
    assert.equal(runs, 0, '创建时不计算');
    assert.equal(c.value, 2);
    assert.equal(c.value, 2);
    assert.equal(runs, 1, '依赖不变时用缓存');
    s.value = 2;
    assert.equal(runs, 1, '没人读就不重算');
    assert.equal(c.value, 4);
    assert.equal(runs, 2);
  });

  test('链式依赖，结果相等时下游不运行', () => {
    const s = signal(1);
    const parity = computed(() => s.value % 2);
    const label = computed(() => (parity.value ? '奇' : '偶'));
    let runs = 0;
    effect(() => {
      label.value;
      runs++;
    });
    s.value = 3; // 仍是奇数
    assert.equal(runs, 1);
    s.value = 4;
    assert.equal(runs, 2);
    assert.equal(label.value, '偶');
  });

  test('动态依赖：分支切换后不再订阅旧分支', () => {
    const useA = signal(true);
    const a = signal('a');
    const b = signal('b');
    const c = computed(() => (useA.value ? a.value : b.value));
    let runs = 0;
    effect(() => {
      c.value;
      runs++;
    });
    assert.equal(observerCount(b), 0);
    useA.value = false;
    assert.equal(observerCount(a), 0, '旧分支已退订');
    assert.equal(observerCount(b), 1);
    a.value = 'x';
    assert.equal(runs, 2, '旧分支变化不再触发');
  });

  test('错误被缓存，依赖变化后恢复', () => {
    const s = signal(0);
    let runs = 0;
    const c = computed(() => {
      runs++;
      if (s.value === 0) throw new Error('除数为零');
      return 10 / s.value;
    });
    assert.throws(() => c.value, /除数为零/);
    assert.throws(() => c.value, /除数为零/);
    assert.equal(runs, 1, '错误也会缓存');
    s.value = 2;
    assert.equal(c.value, 5);
  });

  test('循环依赖抛出错误', () => {
    /** @type {any} */
    let b = null;
    const a = computed(() => b.value + 1);
    b = computed(() => a.value + 1);
    assert.throws(() => a.value, /循环依赖/);
  });

  test('只读，且不能在其中写入 signal', () => {
    const s = signal(1);
    const c = computed(() => s.value);
    assert.throws(() => {
      c.value = 2;
    }, /只读/);
    const bad = computed(() => {
      s.value = 5;
      return 1;
    });
    assert.throws(() => bad.value, /不能在 computed 中修改 signal/);
  });

  test('没有下游时不被上游引用（防泄漏）', () => {
    const s = signal(1);
    const c = computed(() => s.value + 1);
    const dispose = effect(() => void c.value);
    assert.equal(observerCount(s), 1);
    dispose();
    assert.equal(observerCount(s), 0);
    assert.equal(observerCount(c), 0);
    s.value = 5;
    assert.equal(c.value, 6, '不订阅时读取仍然正确');
  });
});

describe('effect', () => {
  test('立即运行，依赖变化时重新运行，清理函数在重跑前和释放时调用', () => {
    const s = signal(1);
    const log = [];
    const dispose = effect(() => {
      log.push(`run ${s.value}`);
      return () => log.push('cleanup');
    });
    s.value = 2;
    dispose();
    s.value = 3;
    assert.deepEqual(log, ['run 1', 'cleanup', 'run 2', 'cleanup']);
  });

  test('batch 合并多次写入（含嵌套）', () => {
    const a = signal(1);
    const b = signal(1);
    let runs = 0;
    effect(() => {
      a.value + b.value;
      runs++;
    });
    const result = batch(() => {
      a.value = 2;
      batch(() => {
        b.value = 2;
      });
      assert.equal(runs, 1, '内层 batch 结束时还不运行');
      return 'ok';
    });
    assert.equal(result, 'ok');
    assert.equal(runs, 2);
  });

  test('菱形依赖无毛刺：只运行一次且看到一致的值', () => {
    const a = signal(1);
    const b = computed(() => a.value * 2);
    const c = computed(() => a.value + 1);
    const seen = [];
    effect(() => seen.push([b.value, c.value]));
    a.value = 2;
    assert.deepEqual(seen, [
      [2, 2],
      [4, 3],
    ]);
  });

  test('effect 写入其他 signal 会触发下游', () => {
    const source = signal(1);
    const mirror = signal(0);
    const log = [];
    effect(() => {
      mirror.value = source.value * 10;
    });
    effect(() => log.push(mirror.value));
    source.value = 2;
    assert.deepEqual(log, [10, 20]);
  });

  test('互相触发超过上限时报错，而不是卡死', (t) => {
    captureErrors(t);
    const s = signal(0);
    effect(() => {
      s.value = s.value + 1;
    });
    assert.throws(() => {
      s.value = 10;
    }, /互相触发超过 100 轮/);
    // 保护触发后状态是干净的：其他 effect 仍正常工作
    const other = signal(1);
    const log = [];
    effect(() => log.push(other.value));
    other.value = 2;
    assert.deepEqual(log, [1, 2]);
  });

  test('一个 effect 出错不影响其他 effect', (t) => {
    const errors = captureErrors(t);
    const s = signal(1);
    const log = [];
    effect(() => {
      if (s.value === 2) throw new Error('坏了');
    });
    effect(() => log.push(s.value));
    s.value = 2;
    assert.deepEqual(log, [1, 2]);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /坏了/);
  });

  test('untrack 中的读取不建立依赖', () => {
    const tracked = signal(1);
    const ignored = signal(1);
    let runs = 0;
    effect(() => {
      tracked.value;
      untrack(() => ignored.value);
      runs++;
    });
    ignored.value = 2;
    assert.equal(runs, 1);
    tracked.value = 2;
    assert.equal(runs, 2);
  });

  test('嵌套 effect 在父级重跑时被释放', () => {
    const outer = signal(1);
    const inner = signal(1);
    const log = [];
    effect(() => {
      const o = outer.value;
      effect(() => log.push(`${o}-${inner.value}`));
    });
    outer.value = 2;
    inner.value = 2;
    assert.deepEqual(log, ['1-1', '2-1', '2-2'], '旧的内层 effect 已释放，不会输出 1-2');
  });
});

describe('作用域', () => {
  test('run 中创建的 effect 归作用域所有，dispose 级联释放', () => {
    const s = signal(1);
    const scope = createScope(null);
    const child = scope.run(() => createScope());
    let runs = 0;
    child.run(() => effect(() => void (s.value, runs++)));
    scope.dispose();
    s.value = 2;
    assert.equal(runs, 1);
    assert.equal(child.disposed, true);
    assert.equal(observerCount(s), 0);
  });

  test('onDispose 在释放时调用', () => {
    const scope = createScope(null);
    const log = [];
    scope.onDispose(() => log.push('a'));
    scope.onDispose(() => log.push('b'));
    scope.dispose();
    assert.deepEqual(log, ['b', 'a']);
  });

  test('暂停后不运行且不被上游引用；恢复时补上变化', () => {
    const s = signal(1);
    const c = computed(() => s.value * 2);
    const log = [];
    const scope = createScope(null);
    scope.run(() => effect(() => log.push(c.value)));
    scope.pause();
    assert.equal(observerCount(s), 0, '暂停后上游不再引用');
    assert.equal(observerCount(c), 0);
    s.value = 2;
    s.value = 3;
    assert.deepEqual(log, [2]);
    scope.resume();
    assert.deepEqual(log, [2, 6], '恢复时只运行一次，拿到最新值');
    s.value = 4;
    assert.deepEqual(log, [2, 6, 8], '恢复后重新订阅');
  });

  test('恢复时依赖没变的 effect 不重跑', () => {
    const changed = signal(1);
    const unchanged = signal(1);
    const runs = { a: 0, b: 0 };
    const scope = createScope(null);
    scope.run(() => {
      effect(() => void (changed.value, runs.a++));
      effect(() => void (unchanged.value, runs.b++));
    });
    scope.pause();
    changed.value = 2;
    scope.resume();
    assert.deepEqual(runs, { a: 2, b: 1 });
    unchanged.value = 2;
    assert.equal(runs.b, 2, '没重跑的 effect 也重新订阅了');
  });

  test('暂停时执行清理函数，恢复时重新运行', () => {
    const log = [];
    const scope = createScope(null);
    scope.run(() =>
      effect(() => {
        log.push('start');
        return () => log.push('stop');
      }),
    );
    scope.pause();
    scope.resume();
    assert.deepEqual(log, ['start', 'stop', 'start']);
  });

  test('暂停期间创建的 effect 等恢复后才运行', () => {
    const scope = createScope(null);
    scope.pause();
    let runs = 0;
    scope.run(() => effect(() => void runs++));
    assert.equal(runs, 0);
    scope.resume();
    assert.equal(runs, 1);
  });
});
