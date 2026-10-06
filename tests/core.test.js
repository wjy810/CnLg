// VunioElement / VunioFormElement 的浏览器测试（Playwright + node:test）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();

test('属性：attribute 与属性双向同步、默认值、类型转换', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const el = document.createElement('t-basic');
    document.body.append(el);
    const defaults = { label: el.label, size: el.size, count: el.count, open: el.open, maxLength: el.maxLength };

    el.label = '风';
    el.count = 3;
    el.open = true;
    el.maxLength = 20;
    const attrs = {
      label: el.getAttribute('label'),
      count: el.getAttribute('count'),
      open: el.hasAttribute('open'),
      maxLength: el.getAttribute('max-length'),
    };

    el.setAttribute('size', 'lg');
    el.setAttribute('count', 'abc');
    el.setAttribute('open', 'false');
    el.open = false;
    el.label = null;
    await el.updateComplete;
    return {
      defaults,
      attrs,
      size: el.size,
      count: el.count,
      open: el.open,
      hasLabel: el.hasAttribute('label'),
      text: el.refs.size.textContent,
    };
  });

  assert.deepEqual(result.defaults, { label: '', size: 'md', count: 1, open: false, maxLength: 10 });
  assert.deepEqual(result.attrs, { label: '风', count: '3', open: true, maxLength: '20' });
  assert.equal(result.size, 'lg');
  assert.equal(result.count, 1, '非数字回退默认值');
  assert.equal(result.open, false);
  assert.equal(result.hasLabel, false, '赋值 null 移除 attribute');
  assert.equal(result.text, 'lg');
});

test('属性：非法枚举值回退默认值并只警告一次', async (t) => {
  const { page, warnings } = await open(t);
  const size = await page.evaluate(() => {
    const el = document.createElement('t-basic');
    el.setAttribute('size', 'huge');
    document.body.append(el);
    el.size;
    el.size;
    return el.size;
  });
  assert.equal(size, 'md');
  assert.equal(warnings.filter((w) => w.includes('size="huge"')).length, 1);
});

test('属性：Array 属性不进 attribute，每个实例默认值独立', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const a = document.createElement('t-basic');
    const b = document.createElement('t-basic');
    document.body.append(a, b);
    a.items.push('x');
    a.items = ['风', '花'];
    await a.updateComplete;
    return { attrs: a.getAttributeNames(), text: a.refs.items.textContent, b: b.items };
  });
  assert.deepEqual(result.attrs, []);
  assert.equal(result.text, '风,花');
  assert.deepEqual(result.b, []);
});

test('render 只执行一次；refs 可用；同类组件共享样式表', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const a = document.createElement('t-basic');
    const b = document.createElement('t-basic');
    document.body.append(a, b);
    a.remove();
    document.body.append(a);
    return {
      renders: a.renders,
      refs: Object.keys(a.refs).sort(),
      sharedSheets: a.root.adoptedStyleSheets.every((s, i) => s === b.root.adoptedStyleSheets[i]),
      sheetCount: a.root.adoptedStyleSheets.length,
      color: getComputedStyle(a).color,
    };
  });
  assert.equal(result.renders, 1);
  assert.deepEqual(result.refs, ['items', 'label', 'size']);
  assert.equal(result.sharedSheets, true);
  assert.equal(result.sheetCount, 2, '基础样式 + 组件样式');
  assert.equal(result.color, 'rgb(1, 2, 3)');
});

test('update：挂载时完整更新一次，之后同一微任务内的修改合并', async (t) => {
  const { page } = await open(t);
  const updates = await page.evaluate(async () => {
    const el = document.createElement('t-basic');
    el.setAttribute('label', '雪');
    document.body.append(el);
    el.label = '月';
    el.size = 'sm';
    el.count = 5;
    await el.updateComplete;
    return el.updates;
  });
  assert.equal(updates.length, 2);
  assert.equal(updates[0].initial, true);
  assert.deepEqual(updates[1], { initial: false, keys: ['count', 'label', 'size'] });
});

test('生命周期：移除后自动清理，重新插入后恢复', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const { life } = window.fx;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.createElement('t-life');
    document.body.append(el);
    await wait(100);
    document.body.click();
    const running = { ...life };
    const fade = el.fade;

    el.remove();
    const framesAtRemove = life.frames;
    await wait(100);
    document.body.click();
    const stopped = { ...life, frameDelta: life.frames - framesAtRemove, fadeState: fade.playState };

    document.body.append(el);
    await wait(100);
    const resumed = { ...life };
    return { running, stopped, resumed };
  });

  assert.equal(result.running.mounted, 1);
  assert.equal(result.running.timeouts, 1);
  assert.equal(result.running.clicks, 1);
  assert.ok(result.running.frames > 2, 'loop 在运行');
  assert.ok(result.running.resizes >= 1, 'ResizeObserver 生效');

  assert.equal(result.stopped.unmounted, 1);
  assert.equal(result.stopped.cleanups, 1);
  assert.equal(result.stopped.clicks, 1, '事件已解绑');
  assert.equal(result.stopped.frameDelta, 0, 'loop 已停止');
  assert.equal(result.stopped.fadeState, 'idle', '动画已取消');

  assert.equal(result.resumed.mounted, 2);
  assert.equal(result.resumed.timeouts, 2);
  assert.ok(result.resumed.frames > result.stopped.frames, 'loop 重新运行');
});

test('生命周期：未触发的 timeout 在移除时被取消', async (t) => {
  const { page } = await open(t);
  const timeouts = await page.evaluate(async () => {
    const el = document.createElement('t-life');
    document.body.append(el);
    el.remove();
    await new Promise((r) => setTimeout(r, 80));
    return window.fx.life.timeouts;
  });
  assert.equal(timeouts, 0);
});

test('on() 等工具在挂载前调用会给出明确错误', async (t) => {
  const { page } = await open(t);
  const message = await page.evaluate(() => {
    const el = document.createElement('t-basic');
    try {
      el.on(document, 'click', () => {});
    } catch (error) {
      return error.message;
    }
  });
  assert.match(message, /<t-basic>\.on\(\) 只能在组件挂载期间调用/);
});

test('升级前设置的属性不会丢失', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const el = document.getElementById('late');
    el.label = '早到的值';
    el.items = ['a'];
    window.fx.TLate.define();
    return { attr: el.getAttribute('label'), text: el.refs.label.textContent, items: el.items };
  });
  assert.deepEqual(result, { attr: '早到的值', text: '早到的值', items: ['a'] });
});

test('升级前设置的表单 value 不会丢失', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const el = document.getElementById('late-field');
    el.value = '早到的诗';
    window.fx.TLateField.define();
    return {
      own: Object.hasOwn(el, 'value'),
      data: Object.fromEntries(new FormData(document.getElementById('late-form'))),
      input: el.refs.input.value,
    };
  });
  assert.deepEqual(result, { own: false, data: { late: '早到的诗' }, input: '早到的诗' });
});

test('emit：事件冒泡、穿透 Shadow DOM、可取消', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const el = document.createElement('t-basic');
    el.label = '花';
    document.body.append(el);
    let detail;
    document.addEventListener('t-fire', (e) => {
      detail = e.detail;
      e.preventDefault();
    }, { once: true });
    const notPrevented = el.fire();
    return { detail, notPrevented };
  });
  assert.deepEqual(result, { detail: { from: '花' }, notPrevented: false });
});

test('watchSlot：根据插槽内容切换 :state(has-xxx)', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const el = document.createElement('t-slot');
    document.body.append(el);
    const before = getComputedStyle(el.refs.title).display;
    const title = document.createElement('span');
    title.slot = 'title';
    title.textContent = '题';
    el.append(title);
    await new Promise((r) => setTimeout(r, 0));
    const after = getComputedStyle(el.refs.title).display;
    title.remove();
    await new Promise((r) => setTimeout(r, 0));
    return { before, after, removed: getComputedStyle(el.refs.title).display, calls: el.calls };
  });
  assert.equal(result.before, 'none');
  assert.equal(result.after, 'block');
  assert.equal(result.removed, 'none');
  assert.deepEqual(result.calls.at(0), false);
  assert.deepEqual(result.calls.at(-1), false);
  assert.ok(result.calls.includes(true));
});

test('表单：值进入 FormData，reset 恢复默认值', async (t) => {
  const { page } = await open(t);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<form id="f"><t-field name="poet" value="李白"></t-field><t-field name="empty"></t-field></form>',
    );
  });
  const field = page.locator('t-field[name=poet]');
  const initial = await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById('f'))));
  assert.deepEqual(initial, { poet: '李白', empty: '' });

  await field.locator('input').fill('杜甫');
  const typed = await page.evaluate(() => {
    const el = document.querySelector('t-field[name=poet]');
    el.setAttribute('value', '王维'); // 用户改过后，默认值不再影响当前值
    return { data: Object.fromEntries(new FormData(document.getElementById('f'))), value: el.value };
  });
  assert.deepEqual(typed, { data: { poet: '杜甫', empty: '' }, value: '杜甫' });

  const reset = await page.evaluate(async () => {
    const form = document.getElementById('f');
    form.reset();
    const el = document.querySelector('t-field[name=poet]');
    await el.updateComplete;
    return { data: Object.fromEntries(new FormData(form)), input: el.refs.input.value };
  });
  assert.deepEqual(reset, { data: { poet: '王维', empty: '' }, input: '王维' });
});

test('表单：required、自定义校验、错误只在交互后显示', async (t) => {
  const { page } = await open(t);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<form id="f"><t-field name="poem" required min-length="5"></t-field><button>提交</button></form>',
    );
  });
  const read = () =>
    page.evaluate(async () => {
      const el = document.querySelector('t-field');
      await el.updateComplete;
      return {
        valid: el.checkValidity(),
        message: el.validationMessage,
        userInvalid: el.hasState('user-invalid'),
        error: el.refs.error.textContent,
      };
    });

  const untouched = await read();
  assert.equal(untouched.valid, false);
  assert.equal(untouched.message, '此项为必填');
  assert.equal(untouched.error, '', '没交互前不显示错误');

  await page.locator('t-field input').fill('明月');
  await page.locator('button').focus(); // 离开控件
  const short = await read();
  assert.equal(short.userInvalid, true);
  assert.equal(short.error, '至少 5 个字');

  await page.locator('t-field input').fill('明月几时有');
  const ok = await read();
  assert.deepEqual(ok, { valid: true, message: '', userInvalid: false, error: '' });

  const custom = await page.evaluate(() => {
    const el = document.querySelector('t-field');
    el.setCustomValidity('此句已被占用');
    const r = { valid: el.checkValidity(), message: el.validationMessage, customError: el.validity.customError };
    el.setCustomValidity('');
    return { ...r, after: el.checkValidity() };
  });
  assert.deepEqual(custom, { valid: false, message: '此句已被占用', customError: true, after: true });
});

test('表单：提交失败会把控件标记为 touched', async (t) => {
  const { page } = await open(t);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<form id="f"><t-field name="a" required></t-field></form>');
  });
  const result = await page.evaluate(async () => {
    const el = document.querySelector('t-field');
    document.getElementById('f').checkValidity();
    await el.updateComplete;
    return { touched: el.touched, error: el.refs.error.textContent };
  });
  assert.deepEqual(result, { touched: true, error: '此项为必填' });
});

test('表单：<fieldset disabled> 中不提交，isDisabled 为 true', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<form id="f"><fieldset><t-field name="a" value="1"></t-field></fieldset></form>',
    );
    const form = document.getElementById('f');
    const el = form.querySelector('t-field');
    form.querySelector('fieldset').disabled = true;
    await el.updateComplete;
    return {
      data: Object.fromEntries(new FormData(form)),
      isDisabled: el.isDisabled,
      inputDisabled: el.refs.input.disabled,
      matchesDisabled: el.matches(':disabled'),
    };
  });
  assert.deepEqual(result, { data: {}, isDisabled: true, inputDisabled: true, matchesDisabled: true });
});

test('escapeHTML 转义特殊字符', async (t) => {
  const { page } = await open(t);
  const out = await page.evaluate(() => window.vunio.escapeHTML(`<a href="x" title='y'>&</a>`));
  assert.equal(out, '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
});

test('减少动态效果：animate() 直接跳到结束状态', async (t) => {
  const { page } = await open(t, { reducedMotion: 'reduce' });
  const result = await page.evaluate(async () => {
    const el = document.createElement('t-life');
    document.body.append(el);
    await el.fade.finished;
    return { reduced: el.prefersReducedMotion, duration: el.fade.effect.getTiming().duration };
  });
  assert.deepEqual(result, { reduced: true, duration: 0 });
});

test('移出页面时某个清理函数出错：其余资源照常释放，unmounted 照常调用', async (t) => {
  const { page } = await open(t, { allowErrors: true });
  const result = await page.evaluate(async () => {
    const { VunioElement, html, signal } = window.vunio;
    const g = signal(0);
    const stats = { clicks: 0, runs: 0, timeouts: 0, unmounted: 0 };
    class TBadCleanup extends VunioElement {
      static tag = 't-bad-cleanup';
      render() {
        return html`<p>${() => g.value}</p>`;
      }
      mounted() {
        this.effect(() => () => {
          throw new Error('cleanup');
        });
        this.effect(() => (g.value, stats.runs++));
        this.on(document, 'click', () => stats.clicks++);
        this.timeout(() => stats.timeouts++, 10);
        this.onCleanup(() => {
          throw new Error('onCleanup');
        });
      }
      unmounted() {
        stats.unmounted++;
      }
    }
    TBadCleanup.define();
    const el = document.body.appendChild(document.createElement('t-bad-cleanup'));
    el.remove();
    const runs = stats.runs;
    g.value = 1;
    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((r) => setTimeout(r, 40));
    return { ...stats, runs: stats.runs - runs, observers: g._observers?.size ?? 0 };
  });
  assert.deepEqual(result, { clicks: 0, runs: 0, timeouts: 0, unmounted: 1, observers: 0 });
});

test('在 render() / update() 中把自己移出页面：模板绑定暂停，不运行 mounted，不报错', async (t) => {
  const { page, errors } = await open(t, { allowErrors: true });
  const result = await page.evaluate(() => {
    const { VunioElement, html, signal } = window.vunio;
    const g = signal(0);
    let mounted = 0;
    class TLeaveInRender extends VunioElement {
      static tag = 't-leave-in-render';
      render() {
        this.remove();
        return html`<p>${() => g.value}</p>`;
      }
      mounted() {
        mounted++;
      }
    }
    class TLeaveInUpdate extends VunioElement {
      static tag = 't-leave-in-update';
      update() {
        this.remove();
      }
      mounted() {
        mounted++;
      }
    }
    TLeaveInRender.define();
    TLeaveInUpdate.define();
    const a = document.body.appendChild(document.createElement('t-leave-in-render'));
    document.body.appendChild(document.createElement('t-leave-in-update'));
    g.value = 42;
    const detachedText = a.root.textContent;
    const observers = g._observers?.size ?? 0;
    const mountedWhileDetached = mounted;
    document.body.append(a);
    return { detachedText, observers, mountedWhileDetached, mounted, reconnectedText: a.root.textContent };
  });
  assert.deepEqual(result, { detachedText: '0', observers: 0, mountedWhileDetached: 0, mounted: 1, reconnectedText: '42' });
  assert.deepEqual(errors, []);
});

test('loop()：在 tick 里暂停再恢复，不会开出第二条帧循环', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const { VunioElement } = window.vunio;
    let ticks = 0;
    let handle;
    class TLoop extends VunioElement {
      static tag = 't-loop-twice';
      mounted() {
        handle = this.loop(() => {
          ticks++;
          if (ticks === 1) {
            handle.pause();
            handle.resume();
          }
        });
      }
    }
    TLoop.define();
    document.body.appendChild(document.createElement('t-loop-twice'));
    let frames = 0;
    await new Promise((resolve) => {
      const count = () => (++frames === 20 ? resolve() : requestAnimationFrame(count));
      requestAnimationFrame(count);
    });
    const perFrame = ticks / frames;
    handle.stop();
    const stoppedAt = ticks;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { perFrame, afterStop: ticks - stoppedAt };
  });
  assert.ok(result.perFrame <= 1.1, `每帧 tick 次数 ${result.perFrame}`);
  assert.equal(result.afterStop, 0);
});
