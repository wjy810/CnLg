# Vunio

基于 **Web Components** 的风格化组件框架。不依赖 React / Vue，组件就是浏览器原生的自定义元素，可以直接写在 HTML 里，也能放进任何框架中使用。

```html
<demo-seal text="风花雪月"></demo-seal>
```

> 当前进度：**核心基类已完成**（`VunioElement` / `VunioFormElement`）。
> 下一步：古风主题变量 → 风花雪月效果模块 → 第一批古风组件。

## 快速开始

ES 模块不能用 `file://` 直接打开，需要一个本地服务器：

```bash
npm install          # 只安装测试用的 Playwright
npm run dev          # http://localhost:5173/examples/
npm test             # 浏览器测试
```

## 写一个组件

> 纯 HTML 中没有打包工具时，把 `'vunio'` 换成相对路径（如 `'../src/index.js'`），或用 import map 映射。

```js
import { VunioElement, html, css } from 'vunio';

export class DemoSeal extends VunioElement {
  static tag = 'demo-seal';

  // ① 属性：自动和 HTML attribute 同步
  static props = {
    text: { type: String, default: '印' },
    tone: { type: String, default: 'cinnabar', values: ['cinnabar', 'ink'] },
    size: { type: Number, default: 72 },
  };

  // ② 样式：在 Shadow DOM 里，不会影响页面，也不会被页面影响
  static styles = css`
    :host { display: inline-block; --_color: #b5352a; }
    :host(:state(ink)) { --_color: #2b2a27; }
    .seal { background: var(--_color); }
  `;

  // ③ 结构：只渲染一次，用 data-ref 标记要操作的元素
  render() {
    return html`<button class="seal" data-ref="seal"><span data-ref="chars"></span></button>`;
  }

  // ④ 同步：属性变化时调用，只改变化的部分
  update(changed) {
    if (changed.has('text')) this.refs.chars.textContent = this.text;
    if (changed.has('tone')) this.setState('ink', this.tone === 'ink');
    if (changed.has('size')) this.refs.seal.style.setProperty('--_size', `${this.size}px`);
  }

  // ⑤ 行为：事件、动画在这里绑定，组件移除时自动清理
  mounted() {
    this.on(this.refs.seal, 'click', () => {
      this.animate(this.refs.seal, [{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 400);
      this.emit('vn-stamp', { text: this.text });
    });
  }
}

DemoSeal.define();
```

完整示例见 [`examples/`](examples/)：印章（属性/事件/动画）、题字输入框（表单关联）、水墨钟（自动清理）。

## 生命周期

```
constructor          创建 Shadow DOM，挂上共享样式
   ↓
connectedCallback    首次：render() → 收集 refs
   ↓                 每次：update(全部) → mounted()
属性变化              同一微任务内合并 → update(changed)
   ↓
disconnectedCallback 自动解绑事件、停止 loop/timeout/observer/动画 → unmounted()
```

| 钩子 | 什么时候调用 | 写什么 |
|---|---|---|
| `render()` | 首次挂载，只一次 | 返回 Shadow DOM 结构（`html```） |
| `update(changed)` | 挂载时一次（`changed.has()` 全为 true），之后每次属性变化 | 把属性同步到 DOM |
| `mounted()` | 每次插入文档 | `this.on()` 绑定事件、启动 `loop()` |
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
- 不要声明与属性同名的类字段（`label = ''`），会遮住生成的 getter/setter。

## 基类工具（自动清理）

| 方法 | 说明 |
|---|---|
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
| `updateComplete` | 等待挂起的更新完成 |

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
- 交互过且无效时带上 `:state(user-invalid)`，用它显示错误样式，避免一进页面就满屏报错
- 子类可覆盖：`formValue()`、`isEmpty()`、`validate()`、`validationAnchor`、`resetValue()`

## 目录

```
src/
  index.js               入口
  core/index.js          核心入口（组件从这里导入）
  core/element.js        VunioElement 基类
  core/form-element.js   VunioFormElement 表单基类
  core/props.js          属性 ↔ attribute
  core/styles.js         共享样式表
  core/template.js       html`` / css``
examples/                示例组件和演示页
tests/                   浏览器测试（Playwright）
docs/COMPONENT_SPEC.md   组件规范（也是给 AI 的提示词）
```

## 浏览器支持

依赖 Custom Elements、Shadow DOM、`adoptedStyleSheets`、`ElementInternals`、`:state()`：
Chrome / Edge 125+、Safari 17.4+、Firefox 126+。

## 用 AI 生成组件

把 [`docs/COMPONENT_SPEC.md`](docs/COMPONENT_SPEC.md) 发给 Gemini / Claude，再描述你要的组件，
得到的会是符合 Vunio 规范、可复用的组件，而不是一次性的 HTML 页面。
