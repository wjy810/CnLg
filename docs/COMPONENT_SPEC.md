# Vunio 组件规范

这份文档是写 Vunio 组件的唯一标准，人和 AI 都按它来。
**用 AI 生成组件时，把整份文档连同你的需求一起发过去**（文末有可直接复制的提示词）。

相关设计：[RFC 0001 响应式内核](rfc/0001-signals.md) · [RFC 0002 响应式模板](rfc/0002-templates.md) · [古风设计系统](design/guofeng.md)

---

## 1. 产出物

一个组件 = **一个 ES 模块文件**，只导出一个继承 `VunioElement`（表单控件继承 `VunioFormElement`）的类，文件末尾调用 `define()`。

不要产出：完整的 HTML 页面、`<script>` 标签里的代码、依赖全局变量的函数、需要外部 CSS 才能工作的结构。

## 2. 标准骨架

```js
import { VunioElement, html, css, signal, when } from '../core/index.js'; // 组件放在 src/components/ 下

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

  /** 组件内部状态：用 signal，不用普通字段 */
  pressed = signal(false);

  render() {
    return html`
      <button
        class="surface"
        part="surface"
        ?disabled=${() => this.disabled}
        aria-pressed=${() => String(this.pressed.value)}
        @click=${this.handleClick}
      >
        <slot name="icon"></slot>
        <slot></slot>
      </button>
      ${when(this.pressed, () => html`<span class="hint">已选</span>`)}
    `;
  }

  mounted() {
    // 宿主自身的状态不在模板里，用 effect 同步
    this.effect(() => this.setState('cinnabar', this.variant === 'cinnabar'));
  }

  handleClick() {
    this.pressed.value = !this.pressed.value;
    this.emit('vn-example-select', { value: this.variant });
  }
}

VnExample.define();
```

## 3. 模板速查

| 位置 | 写法 | 普通值 | signal | 函数 |
|---|---|---|---|---|
| 内容 | `<p>${v}</p>` | 显示 | 响应式 | 响应式 |
| 属性 | `title=${v}`、`class="a ${v}"` | 设置 | 响应式 | 响应式 |
| 布尔属性 | `?disabled=${v}` | 真则添加 | 响应式 | 响应式 |
| DOM 属性 | `.value=${v}` | 赋值 | 响应式 | **原样赋值**（要响应式请传 signal / `computed`） |
| 事件 | `@click=${fn}` | — | — | 监听函数，`this` 是组件 |

- **读属性要包成函数**：`${() => this.label}`。直接写 `${this.label}` 只会渲染一次当时的值。
- signal 可以直接放：`${this.count}`；要加工就用函数：`${() => this.count.value * 2}`。
- 条件：`when(条件, () => html`…`, () => html`…`)`。列表：`repeat(items, (i) => i.id, (i) => html`…`)`。
- `class` 可传对象 `{ active: true }` 或数组；`style` 可传对象 `{ color: 'red', '--size': '4px' }`。
- 属性值 `null` / `undefined` 会移除属性；`false` 会变成字符串 `"false"`（`aria-*` 需要），要移除请用 `?attr`。

## 4. 必须遵守（MUST）

**结构**
- 标签名 `vn-` 开头，全小写、短横线分隔；类名 `Vn` + 大驼峰（`vn-date-picker` → `VnDatePicker`）。
- `render()` 只执行一次，返回 `html`…``。会变化的地方用 signal 或函数绑定，**不要**在 `render()` 里读值后写死。
- 需要命令式操作的**静态**元素用 `data-ref="名字"` 标记，通过 `this.refs.名字` 访问（条件分支、列表里的元素不在 refs 中）。
- 文案、数量等可变内容一律做成属性或插槽，不要写死在模板里。

**属性与状态**
- 所有对外配置都在 `static props` 里声明；有固定选项的用 `values` 列出。
- 布尔属性默认值必须是 `false`（HTML 语义：有 attribute 即为 true）。需要“默认开启”时，换成反义词，如 `no-animation`。
- 数组/对象用 `{ type: Array, default: () => [] }`，不要放进 attribute；修改时整体替换（`list = [...list, x]`），不要 `push`。
- 组件内部会变化的状态用 `signal()`；派生值用 `computed()`。
- 跨组件共享的状态放在 store 模块（导出 signal 和修改函数），组件只调用修改函数，不直接给 store 的 signal 赋值。

**样式**
- 样式只写在 `static styles` 里；选择器都在 Shadow DOM 内，用 `:host` 设置宿主。
- 颜色、字体、间距、圆角、阴影、动效**只用主题的语义令牌** `var(--vn-*)`，不写死色值，也不用原色 `--vn-color-*`（完整变量表见 [古风设计系统](design/guofeng.md)）。常用的：
  - 颜色：`--vn-bg` `--vn-surface` `--vn-surface-sunken` `--vn-fg` `--vn-fg-muted` `--vn-line` `--vn-line-strong`
    `--vn-primary`/`--vn-on-primary` `--vn-accent`/`--vn-on-accent` `--vn-accent-fg` `--vn-danger` `--vn-success`
  - 尺度：`--vn-space-1…9` `--vn-radius-sm|md|lg|full` `--vn-font-size-xs…5xl` `--vn-tracking-wider` `--vn-shadow-1|2|3`
  - 动效：`--vn-duration-fast|normal|ink` 配 `--vn-ease-standard|ink|wind|petal`
  - 纹理：`--vn-mask-stamp`（印章）、`--vn-mask-stroke`（笔触线）
- 控件边框用 `--vn-line-strong`（对比度 ≥ 3），`--vn-line` 只用于装饰分隔线；朱砂色文字用 `--vn-accent-fg`，不要用 `--vn-accent`。
- 毛笔字体 `--vn-font-display` 只用于 ≥ 28px 的标题；同一视图区域最多一个朱砂色的主操作。
  组件私有变量用 `--_名字` 前缀；允许外部定制的用 `--vn-组件名-*` 并在注释 `@cssprop` 中说明。
- 状态样式用自定义状态：`this.setState('open', true)` + `:host(:state(open))`。
- 给关键元素加 `part="名字"`，让使用者可以用 `::part()` 微调。

**副作用与资源**
- 依赖数据的副作用用 `this.effect(fn)`，写在 `mounted()` 里；组件移除时自动释放。
- 事件、计时器、动画帧、Observer、动画**只能**用基类工具创建：
  模板里的 `@event`，或 `this.on` / `this.timeout` / `this.loop` / `this.observeResize` /
  `this.observeIntersection` / `this.observeMutation` / `this.animate`；其他资源用 `this.onCleanup` 注册释放。
- 自定义事件用 `this.emit('vn-组件名-动作', detail)`。
  与原生语义相同的事件用原生名：`input`、`change`（注意 `change` 不会穿出 Shadow DOM，需要在宿主上重新 `emit('change')`）。

**无障碍**
- 能点击的东西必须是 `<button>`（或带 `internals.role` + 键盘支持的宿主）。
- 键盘可完整操作：Tab 可达，Enter / Space 触发，Esc 关闭浮层，方向键在列表中移动。
- 不要去掉焦点样式；基类已提供 `:focus-visible` 样式。
- 纯装饰元素加 `aria-hidden="true"`。

**动效**
- 动画用 `this.animate()`，它会自动尊重“减少动态效果”设置。
- 点击效果用 `burst(kind, layer, { x, y, animate: this.animate.bind(this) })`（`ink` 墨晕 / `blossom` 落花 / `snow` 飞雪 / `wind` 风叶）。
  墨晕放在裁切的层里，其余三种放在不裁切的层里；不要自己再写粒子。
- 粒子、画布等持续动画：`this.prefersReducedMotion` 为 true 时不启动；
  离开视口时用 `observeIntersection` 暂停（`loop()` 返回的 `pause()` / `resume()`）。
- 每帧变化的东西（指针角度、粒子位置）直接在 `loop()` 里改 DOM / 画布，不要每帧写 signal。
- 画布要按 `devicePixelRatio` 缩放，否则高清屏发虚。

**表单控件**（继承 `VunioFormElement`）
- 内部输入变化时赋值 `this.value = ...`，基类会同步到表单。
- `value`、`userInvalid`、`validationMessage`、`isDisabled` 都是响应式的，直接写进模板：
  `${() => (this.userInvalid ? this.validationMessage : '')}`。
- 内部 `<input>` 的值用 `.value=${computed(() => this.value)}` 绑定。
- 覆盖 `validationAnchor` 返回内部输入元素；需要额外校验时覆盖 `validate()`。
- 禁用判断用 `this.isDisabled`（包含 `<fieldset disabled>`）。

## 5. 禁止（MUST NOT）

| 禁止 | 原因 | 正确做法 |
|---|---|---|
| `document.getElementById` / 全局 `id` | 页面放两个组件就冲突 | `this.refs.名字` |
| 模块级可变状态（`let isHovering`） | 所有实例共享同一份状态 | 实例字段 `isHovering = signal(false)` |
| 在 `render()` 里 `${this.label}` 期待它更新 | 只渲染一次当时的值 | `${() => this.label}` |
| 写 `body`、`html`、`button` 等全局选择器 | 污染整个网站 | `:host` 和 Shadow DOM 内选择器 |
| `!important`（基类以外） | 使用者无法覆盖 | 用自定义状态和 `part` |
| 直接 `addEventListener` / `setInterval` / `requestAnimationFrame` | 组件移除后泄漏 | `@event` 或基类工具 |
| 在 `update()` 或模板函数里创建 effect | 每次更新都多一个，越积越多 | 在 `mounted()` 里用 `this.effect()` |
| 在 computed 里修改 signal | 派生值不应有副作用（会抛错） | 放到 effect 或事件处理里 |
| `list.value.push(x)` | 引用没变，不会触发更新 | `list.value = [...list.value, x]` |
| `onclick="..."` 内联事件 | 依赖全局函数 | `@click=${fn}` |
| `innerHTML` / `unsafeHTML` 插入用户数据 | XSS | 普通插值，自动以文本显示 |
| 运行时加载 CDN（Tailwind、图标库、字体） | 组件不可移植 | 图标内联 SVG；字体由主题提供 |
| 写死色值 `#00f3ff` | 换主题要改几十处 | `var(--vn-*)` |
| 在 `constructor` 里读 attribute 或子元素 | 规范禁止，`createElement` 时会报错 | 放到模板 / `mounted` |
| `outline: none` 且没有替代焦点样式 | 键盘用户看不到焦点 | 保留基类 `:focus-visible` |
| 声明与属性同名的类字段 | 遮住生成的 getter/setter | 只在 `static props` 声明 |
| 在 `<textarea>` / `<style>` 内插值、`<${tag}>` 动态标签名 | 模板不支持（会抛错） | `.value=${v}`、`static styles`、`when` 切换模板 |

## 6. 自查清单

- [ ] 同一页面放 3 个实例，互不干扰
- [ ] 改 attribute / 属性后界面立即更新，不需要手动刷新
- [ ] 移除组件后，没有残留的事件、计时器、动画帧、订阅
- [ ] 只用键盘就能完成所有操作
- [ ] 开启系统“减少动态效果”后没有大幅动画
- [ ] 页面切换 `data-mode="night"` 后，组件在夜间主题下同样好看、可读
- [ ] 所有文案都能通过属性或插槽修改
- [ ] 控制台没有错误和警告
- [ ] 文件头部的 JSDoc 写清了 `@attr` / `@slot` / `@fires` / `@csspart` / `@cssprop`

## 7. 给 AI 的提示词（复制使用）

```
你是 Vunio 组件库的开发者。Vunio 基于原生 Web Components，组件继承 VunioElement
（表单控件继承 VunioFormElement），用 html`` 响应式模板和 signal 管理状态。
请严格按照下面的《Vunio 组件规范》实现组件。

要求：
1. 只输出一个 ES 模块文件（组件类 + 末尾 define()），不要输出 HTML 页面。
2. 文件头部用 JSDoc 写清 @attr / @slot / @fires / @csspart / @cssprop。
3. 遵守规范中的全部 MUST 和 MUST NOT，颜色、字体只用 var(--vn-*) 主题变量。
4. 会变化的内容在模板中用 signal 或 () => 函数绑定。
5. 代码之后，附一段 3 行以内的使用示例 HTML。
6. 最后逐条对照“自查清单”说明是否满足。

《Vunio 组件规范》：
<在这里粘贴整份 COMPONENT_SPEC.md>

我要的组件：
<描述组件，例如：vn-button，古风按钮，variant 有 ink（墨）/ cinnabar（朱砂）/ moon（月白），
点击时有墨晕散开的效果，支持 disabled、loading、size（sm/md/lg）>
```
