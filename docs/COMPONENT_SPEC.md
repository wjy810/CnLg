# Vunio 组件规范

这份文档是写 Vunio 组件的唯一标准，人和 AI 都按它来。
**用 AI 生成组件时，把整份文档连同你的需求一起发过去**（文末有可直接复制的提示词）。

---

## 1. 产出物

一个组件 = **一个 ES 模块文件**，只导出一个继承 `VunioElement`（表单控件继承 `VunioFormElement`）的类，文件末尾调用 `define()`。

不要产出：完整的 HTML 页面、`<script>` 标签里的代码、依赖全局变量的函数、需要外部 CSS 才能工作的结构。

## 2. 标准骨架

```js
import { VunioElement, html, css } from '../core/index.js'; // 组件放在 src/components/ 下

/**
 * <vn-example> 一句话说明组件是什么。
 *
 * @attr {'ink'|'cinnabar'} variant - 外观
 * @attr {boolean} disabled - 禁用
 * @slot - 默认插槽：内容
 * @slot icon - 图标
 * @fires vn-example-select - 选中时，detail: { value }
 * @csspart surface - 主体容器
 * @cssprop --vn-example-gap - 内部间距
 */
export class VnExample extends VunioElement {
  static tag = 'vn-example';

  static props = {
    variant: { type: String, default: 'ink', values: ['ink', 'cinnabar'] },
    disabled: Boolean,
  };

  static styles = css`
    :host {
      display: inline-block;
    }
    .surface {
      color: var(--vn-fg);
    }
    :host(:state(cinnabar)) .surface {
      background: var(--vn-accent);
    }
  `;

  render() {
    return html`
      <div class="surface" part="surface" data-ref="surface">
        <slot name="icon"></slot>
        <slot></slot>
      </div>
    `;
  }

  update(changed) {
    if (changed.has('variant')) this.setState('cinnabar', this.variant === 'cinnabar');
    if (changed.has('disabled')) this.refs.surface.toggleAttribute('inert', this.disabled);
  }

  mounted() {
    this.on(this.refs.surface, 'click', this.handleClick);
  }

  handleClick() {
    if (this.disabled) return;
    this.emit('vn-example-select', { value: this.variant });
  }
}

VnExample.define();
```

## 3. 必须遵守（MUST）

**结构**
- 标签名 `vn-` 开头，全小写、短横线分隔；类名 `Vn` + 大驼峰（`vn-date-picker` → `VnDatePicker`）。
- `render()` 只返回结构，**不读写状态、不绑定事件**；它只执行一次。
- 需要操作的元素用 `data-ref="名字"` 标记，通过 `this.refs.名字` 访问。
- 所有属性 → DOM 的同步写在 `update(changed)` 里，用 `changed.has('属性名')` 判断，只改变化的部分。
- 文案、数量等可变内容一律做成属性或插槽，不要写死在模板里。

**属性**
- 所有对外配置都在 `static props` 里声明；有固定选项的用 `values` 列出。
- 布尔属性默认值必须是 `false`（HTML 语义：有 attribute 即为 true）。需要“默认开启”时，换成反义词，如 `no-animation`。
- 数组/对象用 `{ type: Array, default: () => [] }`，不要放进 attribute。

**样式**
- 样式只写在 `static styles` 里；选择器都在 Shadow DOM 内，用 `:host` 设置宿主。
- 颜色、字体、圆角、阴影、动效曲线**只用主题变量** `var(--vn-*)`，不写死色值（变量表见 `themes/`）。
  组件私有变量用 `--_名字` 前缀；允许外部定制的用 `--vn-组件名-*` 并在注释 `@cssprop` 中说明。
- 状态样式用自定义状态：`this.setState('open', true)` + `:host(:state(open))`。
- 给关键元素加 `part="名字"`，让使用者可以用 `::part()` 微调。

**事件与资源**
- 事件、计时器、动画帧、Observer、动画**只能**用基类工具创建：
  `this.on` / `this.timeout` / `this.loop` / `this.observeResize` / `this.observeIntersection` /
  `this.observeMutation` / `this.animate`，其他资源用 `this.onCleanup` 注册释放。
- 自定义事件用 `this.emit('vn-组件名-动作', detail)`。
  与原生语义相同的事件用原生名：`input`、`change`（注意 `change` 不会穿出 Shadow DOM，需要在宿主上重新 `emit('change')`）。

**无障碍**
- 能点击的东西必须是 `<button>`（或带 `internals.role` + 键盘支持的宿主）。
- 键盘可完整操作：Tab 可达，Enter / Space 触发，Esc 关闭浮层，方向键在列表中移动。
- 不要去掉焦点样式；基类已提供 `:focus-visible` 样式。
- 纯装饰元素加 `aria-hidden="true"`。

**动效**
- 动画用 `this.animate()`，它会自动尊重“减少动态效果”设置。
- 粒子、画布等持续动画：`this.prefersReducedMotion` 为 true 时不启动；
  离开视口时用 `observeIntersection` 暂停（`loop()` 返回的 `pause()` / `resume()`）。
- 画布要按 `devicePixelRatio` 缩放，否则高清屏发虚。

**表单控件**（继承 `VunioFormElement`）
- 内部输入变化时赋值 `this.value = ...`，基类会同步到表单并触发 `update`。
- `update` 中处理 `changed.has('validity')` 来显示错误；只在 `:state(user-invalid)` 时显示。
- 覆盖 `validationAnchor` 返回内部输入元素；需要额外校验时覆盖 `validate()`。
- 禁用判断用 `this.isDisabled`（包含 `<fieldset disabled>`）。

## 4. 禁止（MUST NOT）

| 禁止 | 原因 | 正确做法 |
|---|---|---|
| `document.getElementById` / 全局 `id` | 页面放两个组件就冲突 | `this.refs.名字` |
| 模块级可变状态（`let isHovering`） | 所有实例共享同一份状态 | 实例字段 `this.#hovering` |
| 写 `body`、`html`、`button` 等全局选择器 | 污染整个网站 | `:host` 和 Shadow DOM 内选择器 |
| `!important`（基类以外） | 使用者无法覆盖 | 用自定义状态和 `part` |
| 直接 `addEventListener` / `setInterval` / `requestAnimationFrame` | 组件移除后泄漏 | 基类工具 |
| `onclick="..."` 内联事件 | 依赖全局函数 | `this.on()` |
| `innerHTML` 插入用户数据 | XSS | `textContent` 或 `html``` 自动转义 |
| 运行时加载 CDN（Tailwind、图标库、字体） | 组件不可移植 | 图标内联 SVG；字体由主题提供 |
| 写死色值 `#00f3ff` | 换主题要改几十处 | `var(--vn-*)` |
| 在 `constructor` 里读 attribute 或子元素 | 规范禁止，`createElement` 时会报错 | 放到 `update` / `mounted` |
| `outline: none` 且没有替代焦点样式 | 键盘用户看不到焦点 | 保留基类 `:focus-visible` |
| 声明与属性同名的类字段 | 遮住生成的 getter/setter | 只在 `static props` 声明 |

## 5. 自查清单

- [ ] 同一页面放 3 个实例，互不干扰
- [ ] 移除组件后，没有残留的事件、计时器、动画帧
- [ ] 只用键盘就能完成所有操作
- [ ] 开启系统“减少动态效果”后没有大幅动画
- [ ] 切换主题变量后，组件颜色随之改变
- [ ] 所有文案都能通过属性或插槽修改
- [ ] 控制台没有错误和警告
- [ ] 文件头部的 JSDoc 写清了 `@attr` / `@slot` / `@fires` / `@csspart` / `@cssprop`

## 6. 给 AI 的提示词（复制使用）

```
你是 Vunio 组件库的开发者。Vunio 基于原生 Web Components，组件继承 VunioElement
（表单控件继承 VunioFormElement）。请严格按照下面的《Vunio 组件规范》实现组件。

要求：
1. 只输出一个 ES 模块文件（组件类 + 末尾 define()），不要输出 HTML 页面。
2. 文件头部用 JSDoc 写清 @attr / @slot / @fires / @csspart / @cssprop。
3. 遵守规范中的全部 MUST 和 MUST NOT，颜色、字体只用 var(--vn-*) 主题变量。
4. 代码之后，附一段 3 行以内的使用示例 HTML。
5. 最后逐条对照“自查清单”说明是否满足。

《Vunio 组件规范》：
<在这里粘贴整份 COMPONENT_SPEC.md>

我要的组件：
<描述组件，例如：vn-button，古风按钮，variant 有 ink（墨）/ cinnabar（朱砂）/ moon（月白），
点击时有墨晕散开的效果，支持 disabled、loading、size（sm/md/lg）>
```
