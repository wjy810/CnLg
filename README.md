# Vunio

基于 **Web Components** 的风格化组件框架。不依赖 React / Vue，组件就是浏览器原生的自定义元素，可以直接写在 HTML 里，也能放进任何框架中使用。

```html
<demo-seal text="风花雪月"></demo-seal>
```

- **一次渲染，精确更新**：没有虚拟 DOM。数据变化时，只更新用到它的那一个文字节点或属性。
- **资源有主**：事件、计时器、动画、订阅都归组件所有，组件移除时自动释放。
- **零依赖、零构建**：直接用浏览器的 ES 模块运行。

> 当前进度：核心基类、响应式内核、响应式模板已完成。下一步：古风设计系统。详见 [路线图](docs/ROADMAP.md)。

## 快速开始

ES 模块不能用 `file://` 直接打开，需要一个本地服务器：

```bash
npm install          # 只安装测试用的 Playwright
npm run dev          # http://localhost:5173/examples/
npm test             # 测试（signals 在 Node 中运行，其余在浏览器中运行）
```

## 写一个组件

> 纯 HTML 中没有打包工具时，把 `'vunio'` 换成相对路径（如 `'../src/index.js'`），或用 import map 映射。

```js
import { VunioElement, html, css, signal } from 'vunio';

export class DemoCounter extends VunioElement {
  static tag = 'demo-counter';

  // ① 属性：和 HTML attribute 自动同步，本身就是响应式的
  static props = {
    label: { type: String, default: '次数' },
    step: { type: Number, default: 1 },
  };

  // ② 样式：在 Shadow DOM 里，不会影响页面，也不会被页面影响
  static styles = css`
    button { font: inherit; }
  `;

  // ③ 内部状态：signal
  count = signal(0);

  // ④ 结构：只渲染一次；signal 和 () => 函数是“活的”，会自动更新
  render() {
    return html`
      <button @click=${this.increment}>
        ${() => this.label}：${this.count}
      </button>
    `;
  }

  // ⑤ 行为：事件处理函数里的 this 就是组件
  increment() {
    this.count.value += this.step;
  }
}

DemoCounter.define();
```

```html
<demo-counter label="点击" step="2"></demo-counter>
```

完整示例见 [`examples/`](examples/)：印章（属性 / 模板 / 动画）、题字输入框（表单）、水墨钟（自动清理）、诗笺（共享状态 / 列表 / 条件）。

## 响应式

```js
import { signal, computed, effect, batch } from 'vunio';

const count = signal(0);                         // 可写的值
const double = computed(() => count.value * 2);  // 派生值：惰性、缓存
effect(() => console.log(double.value));         // 副作用：依赖变化时同步重新运行
batch(() => { count.value = 1; count.value = 2; }); // 合并写入，effect 只运行一次
```

- 菱形依赖无毛刺；computed 没有下游时自动退订上游，不会泄漏。
- 数组 / 对象按引用比较，修改时整体替换：`list.value = [...list.value, x]`。
- 组件里用 `this.effect(fn)`（写在 `mounted()` 中），组件移除时自动释放。

**共享状态**就是模块里的 signal，不需要额外的库：

```js
// stores/poems.js
export const poems = signal([]);
export const favorites = computed(() => poems.value.filter((p) => p.favorite));
export function addPoem(poem) {
  poems.value = [...poems.value, poem];
}
```

设计细节见 [RFC 0001](docs/rfc/0001-signals.md)。

## 模板

| 位置 | 写法 | 普通值 | signal | 函数 |
|---|---|---|---|---|
| 内容 | `<p>${v}</p>` | 显示 | 响应式 | 响应式 |
| 属性 | `title=${v}`、`class="a ${v}"` | 设置 | 响应式 | 响应式 |
| 布尔属性 | `?disabled=${v}` | 真则添加 | 响应式 | 响应式 |
| DOM 属性 | `.value=${v}` | 赋值 | 响应式 | 原样赋值 |
| 事件 | `@click=${fn}` | — | — | 监听函数，`this` 是组件 |

```js
html`
  ${when(() => this.open, () => html`<p>展开</p>`, () => html`<p>收起</p>`)}
  <ul>${repeat(this.items, (i) => i.id, (i) => html`<li>${i.name}</li>`)}</ul>
`;
```

- `repeat` 带 key 复用节点，重排时移动次数最少（最长递增子序列）。
- `when` 只在真假变化时切换分支，旧分支的订阅随之释放。
- 插值永远以文本写入，不会被当作 HTML，天然防 XSS（`unsafeHTML()` 除外）。
- 模板写错位置（比如在 `<textarea>` 里插值）会给出中文错误和改法。

设计细节见 [RFC 0002](docs/rfc/0002-templates.md)。

## 生命周期

```
constructor          创建 Shadow DOM，挂上共享样式
   ↓
connectedCallback    首次：render() → 模板绑定进入“渲染作用域”
   ↓                 再次：恢复渲染作用域，补上离开期间错过的变化
   ↓                 每次：update(全部) → mounted()
属性变化              模板绑定立即更新；同一微任务内合并调用一次 update(changed)
   ↓
disconnectedCallback 暂停渲染作用域（不再被全局状态引用）、释放 this.effect、
                     解绑事件、停止 loop/timeout/observer/动画 → unmounted()
```

| 钩子 | 什么时候调用 | 写什么 |
|---|---|---|
| `render()` | 首次挂载，只一次 | 返回 `html`…`` |
| `mounted()` | 每次插入文档 | `this.effect()`、`this.loop()`、`this.on()` |
| `update(changed)` | 挂载时一次，之后每次属性变化 | 可选：画布绘制等命令式工作 |
| `unmounted()` | 每次移出文档 | 一般不用写，资源已自动清理 |

## 属性

```js
static props = {
  label: String,                                                  // 简写
  size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] }, // 枚举，写错回退默认值并警告
  count: { type: Number, default: 0 },
  open: Boolean,                                                  // 有 attribute 即为 true
  maxLength: Number,                                              // ↔ max-length
  items: { type: Array, default: () => [] },                      // 只在 JS 属性上
};
```

- `String` / `Number` / `Boolean`：**attribute 是唯一真相**。`el.size = 'lg'` 等于 `el.setAttribute('size', 'lg')`。
- `Array` / `Object`（或 `attribute: false`）：只存在 JS 属性上，重新赋值才会触发更新。
- 未指定 `default` 时：String → `''`，Number → `0`，Boolean → `false`，其他 → `null`。
- 每个属性由 signal 承载：在模板中写 `${() => this.label}`，在 computed / effect 中直接读 `this.label`。
- 不要声明与属性同名的类字段（`label = ''`），会遮住生成的 getter/setter。

## 基类工具（自动清理）

| 方法 | 说明 |
|---|---|
| `effect(fn)` | 响应式副作用，移除时自动释放 |
| `on(target, type, handler, options?)` | 绑定事件，移除时自动解绑；`handler` 里 `this` 是组件 |
| `timeout(fn, ms)` | setTimeout，移除时自动取消 |
| `loop((dt, now) => {})` | 每帧回调，返回 `{ pause, resume, stop }`；回调返回 `false` 停止 |
| `observeResize / observeIntersection / observeMutation` | 对应的 Observer，移除时自动断开 |
| `animate(el, keyframes, options)` | Web Animations，移除时自动取消；“减少动态效果”时直接到终点 |
| `onCleanup(fn)` | 注册任意清理函数 |
| `emit(type, detail)` | 派发事件（冒泡、穿透 Shadow DOM、可取消），返回是否未被取消 |
| `setState(name, on)` / `hasState(name)` | 自定义状态，CSS 用 `:host(:state(name))` |
| `watchSlot(name, callback?)` | 监听插槽有无内容，自动设置 `:state(has-name)` |
| `refs` / `$()` / `$$()` | 访问 Shadow DOM 里的元素 |
| `internals` | `ElementInternals`，用于 ARIA（`internals.role`）和表单 |
| `prefersReducedMotion` | 用户是否开启“减少动态效果” |
| `updateComplete` | 等待挂起的 `update()` 完成 |

## 表单控件：`VunioFormElement`

继承它的组件能直接放进原生 `<form>`：

```html
<form>
  <demo-field name="title" label="题目" value="水调歌头" required></demo-field>
  <button>提交</button>
</form>
```

- `name` / `disabled` / `required` 已内置，`value` 语义和原生 `<input>` 一致（attribute 是默认值）
- 提交时进入 `FormData`；支持 `form.reset()`、`<fieldset disabled>`、`checkValidity()`、`setCustomValidity()`
- `value`、`userInvalid`、`validationMessage`、`isDisabled` 都是响应式的，错误提示直接写进模板：
  `${() => (this.userInvalid ? this.validationMessage : '')}`
- 交互过且无效时带上 `:state(user-invalid)`，避免一进页面就满屏报错
- 子类可覆盖：`formValue()`、`isEmpty()`、`validate()`、`validationAnchor`、`resetValue()`

## 目录

```
src/
  index.js               入口
  core/index.js          核心入口（组件从这里导入）
  core/element.js        VunioElement 基类
  core/form-element.js   VunioFormElement 表单基类
  core/signals.js        响应式内核
  core/template.js       响应式模板：html / svg / when / repeat / render
  core/props.js          属性 ↔ attribute ↔ signal
  core/styles.js         共享样式表
examples/                示例组件、store 和演示页
tests/                   测试（signals 在 Node 中，其余在浏览器中）
docs/
  ROADMAP.md             设计原则、里程碑、验收标准
  COMPONENT_SPEC.md      组件规范（也是给 AI 的提示词）
  rfc/                   设计文档
```

## 浏览器支持

依赖 Custom Elements、Shadow DOM、`adoptedStyleSheets`、`ElementInternals`、`:state()`：
Chrome / Edge 125+、Safari 17.4+、Firefox 126+。目前测试只在 Chromium 中运行。

## 用 AI 生成组件

把 [`docs/COMPONENT_SPEC.md`](docs/COMPONENT_SPEC.md) 发给 Gemini / Claude，再描述你要的组件，
得到的会是符合 Vunio 规范、可复用的组件，而不是一次性的 HTML 页面。
