# RFC 0001：响应式内核（Signals）

- 状态：已实现
- 相关：[RFC 0002 响应式模板](0002-templates.md)

## 1. 背景

M0 的组件靠 `update(changed)` 手动把属性同步到 DOM，只有声明过的属性会触发更新。组件内部状态、跨组件共享状态、派生数据都没有统一的方式表达。

我们需要一个响应式内核，它要满足：

- 写组件时**声明“什么依赖什么”**，而不是手动安排“什么时候更新什么”；
- 精确到值：只有真正用到某个数据的地方才更新；
- 和 M0 的生命周期、自动清理无缝结合，不能引入新的泄漏途径；
- 足够小（目标 300 行以内），零依赖。
  > 实现结果：约 385 行代码（不含注释），超出目标，主要多在第 4 节的暂停 / 恢复所有权上。这部分是防止组件移出页面后泄漏的关键，保留。

**非目标**：深层响应式（自动追踪对象内部属性的修改）、异步调度器、时间旅行调试。

## 2. API

```js
import { signal, computed, effect, batch, untrack, createScope, isSignal } from 'vunio';

const count = signal(0);              // 可写的值
count.value;                          // 读（会被追踪）
count.value = 1;                      // 写
count.peek();                         // 读，但不追踪

const double = computed(() => count.value * 2);  // 派生值，只读
double.value;

const dispose = effect(() => {        // 副作用：立即运行，依赖变化时重新运行
  document.title = `点了 ${count.value} 次`;
  return () => {};                    // 可选：下次运行前 / 释放时调用的清理函数
});
dispose();                            // 停止

batch(() => {                         // 合并多次写入，effect 只运行一次
  a.value = 1;
  b.value = 2;
});

untrack(() => count.value);           // 在追踪环境里读值但不建立依赖

const scope = createScope();          // 作用域：收集其中创建的 effect
scope.run(() => effect(() => {}));
scope.pause();                        // 暂停：退订，但保留状态
scope.resume();                       // 恢复：补上暂停期间错过的变化
scope.dispose();                      // 释放：其中所有 effect 停止
```

选项：`signal(value, { equals })`、`computed(fn, { equals })`。`equals` 默认 `Object.is`，传 `false` 表示每次写入都视为变化。

与 [TC39 Signals 提案](https://github.com/tc39/proposal-signals) 对照：`.get()` / `.set()` 作为 `.value` 的别名提供，`signal` ↔ `Signal.State`，`computed` ↔ `Signal.Computed`。将来浏览器原生支持时可以替换底层实现，组件代码不用改。

## 3. 语义

### 3.1 读写与相等
- 写入时用 `equals` 比较新旧值，相等则什么都不发生。
- 数组 / 对象按引用比较：`list.value.push(x)` **不会**触发更新，要写成 `list.value = [...list.value, x]`。这是有意为之：不可变更新让变化可追踪、可比较，也让 `repeat` 的 diff 有意义。

### 3.2 computed：惰性 + 缓存
- 创建时不计算，第一次读取时才计算；之后在依赖不变时直接返回缓存。
- 计算结果与上次相等时，下游**不会**被视为变化（剪枝）。
- 计算中抛出的错误会被缓存，读取时重新抛出；依赖变化后会重新尝试。
- 在 computed 中写 signal 会抛错：派生值不应有副作用。

### 3.3 effect：同步执行
- 创建时立即运行一次。
- 依赖变化后**同步**重新运行（在最外层 `batch` 结束时）。选择同步而不是微任务：写完值立刻就能读到更新后的 DOM，测试和调试都更直观；需要合并时显式用 `batch`。
- 每次运行都会重新收集依赖，所以条件分支里的依赖会随分支切换。

### 3.4 无毛刺（glitch-free）

```js
const a = signal(1);
const b = computed(() => a.value * 2);
const c = computed(() => a.value + 1);
effect(() => log(b.value + c.value));
a.value = 2; // effect 只运行一次，看到的是 b=4, c=3，不会出现 b=4, c=2 的中间状态
```

### 3.5 错误与循环
- effect 抛出的错误通过 `reportError` 报告（浏览器会派发到 `window.onerror`），不影响其他 effect 继续执行。
- computed 读取自身（直接或间接）时抛出 `循环依赖` 错误。
- effect 写入的值又触发自己或彼此，连续超过 100 轮时抛错停止，避免页面卡死。

## 4. 所有权与生命周期

这是 Vunio 与通用 signals 库最大的不同：**每个 effect 都有主人**。

```
组件
 ├── 渲染作用域（模板里的绑定）          移出页面时暂停，移回时恢复
 │    ├── effect：文字绑定
 │    └── 分支作用域（when 的当前分支）  切换分支时释放
 │         └── effect：分支里的绑定
 └── 连接作用域（mounted 里创建的 effect）  移出页面时释放，下次挂载重新创建
```

- **归属**：effect 创建时属于“当前所有者”（正在运行的作用域或 effect）。
- **嵌套**：effect 重新运行前，会先释放上一次运行中创建的子 effect。
- **暂停**：退订所有上游，但保留“上次看到的版本号”。被暂停的东西不被任何 signal 引用，可以被垃圾回收，所以移出页面的组件不会因为订阅了全局状态而泄漏。
- **恢复**：逐个比较上游版本号，只有确实变化过的 effect 才重新运行，其余直接重新订阅。组件在页面中移动位置时几乎没有开销。
- **释放**：停止并清理，不可恢复。

## 5. 与组件集成

- **属性即 signal**：`static props` 声明的属性在内部由 signal 承载，`this.label` 在 computed、effect、模板中读取时自动建立依赖。attribute 变化同时更新 signal 和 `update(changed)`，旧写法继续有效。
- **`this.effect(fn)`**：在连接作用域里创建 effect，移出页面时自动释放。`mounted()` 本身也在连接作用域里运行，直接调用 `effect()` 效果相同。
- **渲染作用域**：`render()` 产生的模板绑定属于渲染作用域，移出页面时暂停、移回时恢复。
- `render`、`update`、`mounted` 都在 `untrack` 中执行：组件即使在别的 effect 里被创建，也不会把依赖泄漏给外层。

## 6. 状态管理

不需要额外的库。共享状态就是放在模块里的 signal：

```js
// stores/poems.js
import { signal, computed } from 'vunio';

export const poems = signal([]);
export const favorites = computed(() => poems.value.filter((p) => p.favorite));

export function addPoem(poem) {
  poems.value = [...poems.value, poem];
}
```

任何组件读取 `favorites.value`，都会在数据变化时精确更新。约定：**写操作封装成函数导出**，组件不直接给 store 的 signal 赋值，便于追踪数据从哪里改变。

## 7. 算法

推拉结合（push-pull），配合版本号：

1. **推**：signal 写入时，版本号 +1、全局版本号 +1，沿订阅关系向下标记：computed 标为“可能过期”，effect 放入队列。这一步不计算任何东西。
2. **拉**：批次结束时依次检查队列中的 effect。检查方法是逐个比较它上次看到的上游版本号；上游是 computed 时先让它按同样的方法检查自己。只有版本号确实变了才重新运行。
3. **全局版本号捷径**：computed 记录上次检查时的全局版本号，没有任何 signal 被写过时直接返回缓存。
4. **订阅随用随取**：computed 只在有下游订阅时才订阅上游；最后一个下游离开时退订。没人订阅的 computed 读取时用版本号判断是否需要重算。

标志位：`NOTIFIED`（已入队 / 已标记）、`OUTDATED`（可能过期）、`RUNNING`（计算中，用于检测循环）、`TRACKING`（computed 正在订阅上游）、`HAS_ERROR`、`PAUSED`、`DISPOSED`、`FORCE`（恢复时必须重跑）。

## 8. 取舍记录

| 决策 | 选择 | 放弃的方案 | 理由 |
|---|---|---|---|
| 读写语法 | `.value`（另提供 `.get()`/`.set()`） | 函数调用 `count()` | 模板里 `${count}` 传 signal 本身，`${() => ...}` 传表达式，两者能区分；`.value` 与 Vue / Preact 一致，上手快 |
| effect 时机 | 同步 + 显式 `batch` | 微任务调度 | 可预测、易测试；组件的 `update(changed)` 已经是微任务合并，两种需求都覆盖 |
| 深层响应式 | 不做 | Proxy 追踪对象内部 | 实现和心智负担都大；不可变更新更利于 diff 和调试 |
| 所有权 | 内建作用域 + 暂停 / 恢复 | 只有 dispose | 组件可以被移动；只能 dispose 的话移动一次就要重建全部绑定，DOM 状态（焦点、滚动位置）会丢 |

## 9. 测试计划

纯逻辑，在 Node 中用 `node:test` 运行（`tests/signals.test.js`）：

- signal：读写、`peek`、`equals`（默认 / 自定义 / `false`）、`.get()`/`.set()`
- computed：惰性、缓存、链式、相等剪枝、动态依赖、错误缓存与恢复、循环检测、只读、禁止在其中写入
- effect：立即运行、重新运行、清理函数、释放、`batch`（含嵌套）、互相触发、无限循环保护、错误不影响其他 effect
- 菱形依赖无毛刺
- `untrack`
- 作用域：归属、嵌套 effect 在父级重跑时释放、`dispose` 级联
- 暂停 / 恢复：暂停后不运行且不被上游引用；恢复时只重跑变化过的；未变化不重跑；暂停期间创建的 effect 在恢复时才运行
- 无订阅的 computed 不被上游引用（防泄漏）
