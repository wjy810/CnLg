# RFC 0004：第一批组件

- 状态：已实现
- 依赖：[组件规范](../COMPONENT_SPEC.md) · [古风设计系统](../design/guofeng.md) · [RFC 0003 效果](0003-effects.md)

```js
import 'vunio/components';   // 注册全部组件
```

## 1. 设计取舍（全部组件共同遵守）

- **安静为本**：默认外观克制；朱砂色只给主操作（`variant="cinnabar"`）和错误；毛笔字只在 `vn-heading` 的 1–3 级出现。
- **原生优先**：能用原生元素就用（`<button>`、`<input>`、`<dialog>`），键盘和读屏行为跟原生一致。
- **表单即表单**：输入类组件继承 `VunioFormElement`，直接放进 `<form>`，值进 `FormData`，支持 `reset` 和 `<fieldset disabled>`。
- **效果是点缀**：按钮默认只有墨晕；落花、飞雪、风叶要显式打开。

## 2. 组件一览

### `vn-button` 按钮

| 属性 | 值 | 默认 | 说明 |
|---|---|---|---|
| `variant` | `ink` · `cinnabar` · `moon` · `text` | `ink` | 墨（主要）· 朱砂（最重要的那一个）· 月白（描边）· 素（文字） |
| `size` | `sm` · `md` · `lg` | `md` | 高 32 / 40 / 48 |
| `effect` | `ink` · `blossom` · `snow` · `wind` · `none` | `ink` | 点击效果 |
| `type` | `button` · `submit` · `reset` | `button` | 在表单中的作用。默认 `button`，避免误提交 |
| `disabled` · `loading` · `block` | 布尔 | | 禁用 · 加载中（禁止点击并显示墨圈）· 占满一行 |

插槽：默认（文字）、`prefix`、`suffix`（图标）。CSS Part：`button`。

### `vn-heading` 标题

| 属性 | 值 | 默认 | 说明 |
|---|---|---|---|
| `level` | 1–6 | 2 | 语义层级（`role="heading"` + `aria-level`）；1–3 级用毛笔字 |
| `seal` | 文字 | | 标题旁盖一方朱印，如 `seal="雅"` |
| `sub` | 文字 | | 副标题 |
| `vertical` | 布尔 | | 竖排（从右往左） |
| `plain` | 布尔 | | 不用毛笔字 |

### `vn-card` 卡片

| 属性 | 值 | 默认 | 说明 |
|---|---|---|---|
| `variant` | `paper` · `frame` · `plain` | `paper` | 纸片（浅阴影）· 古籍双线框 · 无底 |
| `padding` | `sm` · `md` · `lg` | `md` | 内边距 |
| `interactive` | 布尔 | | 悬停时浮起 |

插槽：`title`、`extra`（右上角操作）、默认、`footer`。没有内容的插槽区域自动隐藏。

### `vn-stack` 布局

| 属性 | 值 | 默认 |
|---|---|---|
| `direction` | `column` · `row` | `column` |
| `gap` | 0–9（对应 `--vn-space-*`） | 4 |
| `align` | `start` · `center` · `end` · `stretch` · `baseline` | `stretch` |
| `justify` | `start` · `center` · `end` · `between` · `around` | `start` |
| `wrap` · `inline` | 布尔 | |

### `vn-divider` 分隔线

| 属性 | 值 | 默认 | 说明 |
|---|---|---|---|
| `variant` | `brush` · `line` · `dashed` | `brush` | 笔触（两头尖）· 细线 · 虚线 |
| `vertical` | 布尔 | | 竖向 |

默认插槽：居中的文字，如 `<vn-divider>春</vn-divider>`。`role="separator"`。

### `vn-loading` 加载

| 属性 | 值 | 默认 | 说明 |
|---|---|---|---|
| `size` | `sm` · `md` · `lg` | `md` | |
| `label` | 文字 | `加载中` | 读屏文字，也显示在旁边 |
| `quiet` | 布尔 | | 不显示文字（读屏仍会读） |

视觉：一滴墨入水，涟漪一圈圈散开。`role="status"`。

### `vn-input` 输入框（表单控件）

| 属性 | 说明 |
|---|---|
| `label` · `placeholder` · `hint` | 标签 · 占位 · 帮助文字 |
| `type` | `text` · `password` · `email` · `url` · `tel` · `search` · `number` |
| `name` · `value` · `required` · `disabled` · `readonly` | 同原生 |
| `minlength` · `maxlength` · `pattern` | 校验；有 `maxlength` 时显示字数 |
| `clearable` | 有内容时显示清除按钮 |
| `autocomplete` · `inputmode` | 透传给内部 input |

插槽：`prefix`、`suffix`。事件：`input`、`change`。外观：信笺式下划线，聚焦时一道笔触从中间展开；错误时变为胭脂色并显示中文提示。

### `vn-checkbox` 复选框 · `vn-switch` 开关（表单控件）

| 属性 | 说明 |
|---|---|
| `checked` | 当前是否选中（反映为 attribute） |
| `value` | 选中时提交的值，默认 `on` |
| `name` · `required` · `disabled` | 同原生 |
| `variant="moon"` | 仅开关：关为日、开为月 |

默认插槽是标签文字。复选框的勾是朱批笔画，选中时一笔画出。键盘：空格切换。事件：`input`、`change`。

### `vn-select` 下拉选择（表单控件）

```html
<vn-select label="时节" name="season" placeholder="请选择">
  <option value="spring">春</option>
  <option value="summer" disabled>夏</option>
</vn-select>
```

| 属性 | 说明 |
|---|---|
| `label` · `placeholder` · `hint` · `name` · `value` · `required` · `disabled` | 同输入框 |

选项写成原生 `<option>`，增删改选项会自动同步。面板放在顶层（Popover API），不会被 `overflow: hidden` 的祖先裁掉。
键盘：↑ ↓ 移动、Home / End、Enter / 空格选择、Esc 关闭、输入首字跳转。读屏：`combobox` + `listbox`。

### `vn-modal` 弹窗

```html
<vn-modal heading="水调歌头" id="poem">
  明月几时有？把酒问青天。
  <vn-button slot="footer" onclick="poem.close()">合上</vn-button>
</vn-modal>
```

| 成员 | 说明 |
|---|---|
| `heading` | 标题 |
| `open` | 是否打开（attribute 与方法同步） |
| `persistent` | 点遮罩、按 Esc 不关闭 |
| `show()` · `close(returnValue?)` | 打开 · 关闭 |
| 事件 `vn-open` · `vn-close` | `vn-close` 的 `detail.returnValue` 是关闭原因：`'esc'`、`'backdrop'`、`'close-button'` 或传入的值 |

基于原生 `<dialog>`：背景不可操作、焦点留在弹窗内、关闭后焦点回到打开前的位置。外观是一幅立轴：上下两根轴杆，打开时从中间向上下展开。

### `toast()` 消息

```js
import { toast } from 'vunio/components';
toast('已收藏', { type: 'success' });
const t = toast('正在保存…', { duration: 0 });   // 0 表示不自动关闭
t.close();
```

| 选项 | 值 | 默认 |
|---|---|---|
| `type` | `info` · `success` · `warning` · `error` | `info` |
| `duration` | 毫秒，0 为不自动关闭 | 3000 |

每条消息左侧有一方小印：讯 · 成 · 慎 · 误。鼠标悬停时暂停计时。`error` 用 `role="alert"`，其余用 `role="status"`。

消息放在顶层（Popover API），弹窗打开时也显示在弹窗之上。限制：模态弹窗会让弹窗以外的内容不可交互（浏览器规定），所以这时消息看得见但点不到关闭按钮、悬停也不会暂停计时，只能等它自动关闭；需要用户操作的提示请放进弹窗里。

## 3. 测试计划

每个组件一组浏览器测试，覆盖：属性 → 外观状态、键盘操作、读屏属性（role / aria-*）、表单行为（FormData / reset / fieldset disabled / 校验）、事件、移除后无残留。
