# 赛博设计系统

- 状态：已实现（`themes/cyber.css`）
- 令牌来源：`themes/cyber.tokens.js`。本文中的表格由 `npm run build:theme` 生成，请勿手改。
- 契约：与古风主题提供同一份变量（[RFC 0006](../rfc/0006-theme-contract.md)），组件源码一行不改。

## 1. 理念：霓虹、硬边、故障

深夜的城市。屏幕是唯一的光源，信息用灯管写在黑暗里。

| 规矩 | 在界面里的意思 |
|---|---|
| **暗面** | 默认是夜。底色接近纯黑但带一点蓝，卡片比底色略亮，靠亮度分层，不靠投影 |
| **两根灯管** | 电青是主操作和焦点，品红是唯一的强调。其余颜色只承担状态 |
| **硬边** | 圆角几乎为零；分隔线是分段的数字线；印记是像素化的方块 |
| **辉光代替投影** | 浮起的东西不投下阴影，而是发光：一圈细描边加一团同色的柔光 |
| **偶尔失真** | 按下按钮时信号失真一下（故障），完成时迸出电火花。失真是反馈，不是装饰，不要常驻 |

硬规则与古风相同：组件只用语义令牌；一个视图里最多一个品红色的主操作；展示字体（Orbitron / 庆科黄油体）只用于标题。

## 2. 色彩

### 2.1 原色

<!-- palette:start -->
| 色名 | 色值 | 变量 | 用途 |
|---|---|---|---|
| <span style="color:#0A0B12">■</span> 虚无 | `#0A0B12` | `--vn-color-xuwu` | 夜：页面底色 |
| <span style="color:#12141F">■</span> 墨夜 | `#12141F` | `--vn-color-moye` | 夜：卡片、浮层 |
| <span style="color:#1A1D2C">■</span> 深渊 | `#1A1D2C` | `--vn-color-shenyuan` | 夜：凹陷面、输入框 |
| <span style="color:#2A3048">■</span> 钢铁 | `#2A3048` | `--vn-color-gangtie` | 框体 |
| <span style="color:#E6E8F2">■</span> 光白 | `#E6E8F2` | `--vn-color-guangbai` | 夜：正文 |
| <span style="color:#9AA0B8">■</span> 星灰 | `#9AA0B8` | `--vn-color-xinghui` | 夜：次要文字 |
| <span style="color:#00E5FF">■</span> 电青 | `#00E5FF` | `--vn-color-dianqing` | 主操作、焦点、灯管 |
| <span style="color:#FF2E88">■</span> 霓虹品红 | `#FF2E88` | `--vn-color-meihong` | 强调色块 |
| <span style="color:#FF5CA8">■</span> 荧粉 | `#FF5CA8` | `--vn-color-fenhong` | 夜：强调文字 |
| <span style="color:#F5E400">■</span> 酸黄 | `#F5E400` | `--vn-color-suanhuang` | 夜：提醒 |
| <span style="color:#2BFF88">■</span> 荧绿 | `#2BFF88` | `--vn-color-yinglv` | 夜：成功 |
| <span style="color:#FF4D5E">■</span> 警红 | `#FF4D5E` | `--vn-color-jinghong` | 夜：错误 |
| <span style="color:#4DB8FF">■</span> 天蓝 | `#4DB8FF` | `--vn-color-tianlan` | 夜：信息 |
| <span style="color:#EEF1F7">■</span> 冷白 | `#EEF1F7` | `--vn-color-lengbai` | 昼：页面底色 |
| <span style="color:#FFFFFF">■</span> 画白 | `#FFFFFF` | `--vn-color-huabai` | 昼：卡片 |
| <span style="color:#E2E6F0">■</span> 银灰 | `#E2E6F0` | `--vn-color-yinhui` | 昼：凹陷面 |
| <span style="color:#0B0D17">■</span> 碳黑 | `#0B0D17` | `--vn-color-tanhei` | 昼：正文、主按钮 |
| <span style="color:#C00060">■</span> 深品红 | `#C00060` | `--vn-color-shenpin` | 昼：强调文字 |
<!-- palette:end -->

### 2.2 语义令牌

默认模式是**夜**。`<html data-mode="day">` 切换为昼（实验室般的冷白与蓝图网格），`data-mode="auto"` 跟随系统。

<!-- semantic:start -->
| 变量 | 夜 | 昼 |
|---|---|---|
| `--vn-bg` | 虚无 `#0A0B12` | 冷白 `#EEF1F7` |
| `--vn-surface` | 墨夜 `#12141F` | 画白 `#FFFFFF` |
| `--vn-surface-sunken` | 深渊 `#1A1D2C` | 银灰 `#E2E6F0` |
| `--vn-fg` | 光白 `#E6E8F2` | 碳黑 `#0B0D17` |
| `--vn-fg-strong` | `#FFFFFF` | `#000000` |
| `--vn-fg-muted` | 星灰 `#9AA0B8` | `#4A5068` |
| `--vn-fg-subtle` | `#5F6580` | `#7A8099` |
| `--vn-line` | `rgba(0, 229, 255, 0.16)` | `rgba(11, 13, 23, 0.12)` |
| `--vn-line-strong` | `#3E7C8C` | `#6B7590` |
| `--vn-primary` | 电青 `#00E5FF` | 碳黑 `#0B0D17` |
| `--vn-on-primary` | `#04060B` | 电青 `#00E5FF` |
| `--vn-accent` | 霓虹品红 `#FF2E88` | `#D4006A` |
| `--vn-on-accent` | 虚无 `#0A0B12` | `#FFFFFF` |
| `--vn-accent-fg` | 荧粉 `#FF5CA8` | 深品红 `#C00060` |
| `--vn-accent-wash` | `rgba(255, 46, 136, 0.14)` | `rgba(212, 0, 106, 0.08)` |
| `--vn-success` | 荧绿 `#2BFF88` | `#006B43` |
| `--vn-warning` | 酸黄 `#F5E400` | `#725A00` |
| `--vn-danger` | 警红 `#FF4D5E` | `#C8102E` |
| `--vn-info` | 天蓝 `#4DB8FF` | `#0057B8` |
| `--vn-focus` | 电青 `#00E5FF` | `#0080A0` |
| `--vn-selection` | `rgba(0, 229, 255, 0.28)` | `rgba(0, 200, 230, 0.25)` |
| `--vn-overlay` | `rgba(2, 3, 8, 0.72)` | `rgba(11, 13, 23, 0.55)` |
| `--vn-frame` | 钢铁 `#2A3048` | `#1B2033` |
| `--vn-trim` | 电青 `#00E5FF` | `#00B8D4` |
| `--vn-blossom` | 荧粉 `#FF5CA8` | 荧粉 `#FF5CA8` |
| `--vn-blossom-deep` | 霓虹品红 `#FF2E88` | `#D4006A` |
| `--vn-snow` | `#9EF3FF` | `#7FA3B8` |
| `--vn-wind` | `#7CFFCB` | `#00A86B` |
| `--vn-moon` | `#FFD6F0` | `#E9D7FF` |
| `--vn-night-sky` | `#05060A` | `#121628` |
<!-- semantic:end -->

- 夜间的强调色块（`accent`，品红）上用**深色**文字（`on-accent`），这是霓虹招牌的写法，对比度也更高。
- 昼间的主按钮是碳黑底、电青字（`primary` / `on-primary`）。
- `frame` / `trim` 在弹窗上是钢铁的框和电青的灯管：同一个“立轴”结构，在这里读作一块 HUD 面板。
- 意象色（`blossom`、`snow`、`wind`、`moon`）给效果和天气用：花瓣是荧粉，雪与雨是冰青。

### 2.3 对比度

<!-- contrast:start -->
**夜**

| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |
|---|---|---|---|---|
| 正文 | `fg` / `bg` | 16.07 | ≥ 4.5 | ✅ |
| 卡片上的正文 | `fg` / `surface` | 15.01 | ≥ 4.5 | ✅ |
| 输入框中的文字 | `fg` / `surface-sunken` | 13.69 | ≥ 4.5 | ✅ |
| 次要文字 | `fg-muted` / `bg` | 7.57 | ≥ 4.5 | ✅ |
| 卡片上的次要文字 | `fg-muted` / `surface` | 7.07 | ≥ 4.5 | ✅ |
| 占位文字 | `fg-muted` / `surface-sunken` | 6.44 | ≥ 4.5 | ✅ |
| 弱化图形、禁用态 | `fg-subtle` / `bg` | 3.42 | ≥ 3 | ✅ |
| 控件边框 | `line-strong` / `bg` | 4.18 | ≥ 3 | ✅ |
| 卡片上的控件边框 | `line-strong` / `surface` | 3.90 | ≥ 3 | ✅ |
| 主按钮文字 | `on-primary` / `primary` | 13.18 | ≥ 4.5 | ✅ |
| 强调按钮文字 | `on-accent` / `accent` | 5.61 | ≥ 4.5 | ✅ |
| 强调文字、链接 | `accent-fg` / `bg` | 6.87 | ≥ 4.5 | ✅ |
| 卡片上的强调文字 | `accent-fg` / `surface` | 6.41 | ≥ 4.5 | ✅ |
| 成功提示 | `success` / `bg` | 14.74 | ≥ 4.5 | ✅ |
| 提醒 | `warning` / `bg` | 14.94 | ≥ 4.5 | ✅ |
| 错误提示 | `danger` / `bg` | 6.05 | ≥ 4.5 | ✅ |
| 卡片上的错误提示 | `danger` / `surface` | 5.65 | ≥ 4.5 | ✅ |
| 信息 | `info` / `bg` | 8.99 | ≥ 4.5 | ✅ |
| 凹陷面上的成功色（如代码高亮） | `success` / `surface-sunken` | 12.55 | ≥ 4.5 | ✅ |
| 凹陷面上的提醒色 | `warning` / `surface-sunken` | 12.72 | ≥ 4.5 | ✅ |
| 凹陷面上的错误提示 | `danger` / `surface-sunken` | 5.16 | ≥ 4.5 | ✅ |
| 凹陷面上的信息色 | `info` / `surface-sunken` | 7.66 | ≥ 4.5 | ✅ |
| 凹陷面上的强调文字 | `accent-fg` / `surface-sunken` | 5.85 | ≥ 4.5 | ✅ |
| 焦点框 | `focus` / `bg` | 12.76 | ≥ 3 | ✅ |

**昼**

| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |
|---|---|---|---|---|
| 正文 | `fg` / `bg` | 17.12 | ≥ 4.5 | ✅ |
| 卡片上的正文 | `fg` / `surface` | 19.37 | ≥ 4.5 | ✅ |
| 输入框中的文字 | `fg` / `surface-sunken` | 15.51 | ≥ 4.5 | ✅ |
| 次要文字 | `fg-muted` / `bg` | 7.03 | ≥ 4.5 | ✅ |
| 卡片上的次要文字 | `fg-muted` / `surface` | 7.96 | ≥ 4.5 | ✅ |
| 占位文字 | `fg-muted` / `surface-sunken` | 6.37 | ≥ 4.5 | ✅ |
| 弱化图形、禁用态 | `fg-subtle` / `bg` | 3.45 | ≥ 3 | ✅ |
| 控件边框 | `line-strong` / `bg` | 4.06 | ≥ 3 | ✅ |
| 卡片上的控件边框 | `line-strong` / `surface` | 4.59 | ≥ 3 | ✅ |
| 主按钮文字 | `on-primary` / `primary` | 12.59 | ≥ 4.5 | ✅ |
| 强调按钮文字 | `on-accent` / `accent` | 5.24 | ≥ 4.5 | ✅ |
| 强调文字、链接 | `accent-fg` / `bg` | 5.44 | ≥ 4.5 | ✅ |
| 卡片上的强调文字 | `accent-fg` / `surface` | 6.16 | ≥ 4.5 | ✅ |
| 成功提示 | `success` / `bg` | 5.83 | ≥ 4.5 | ✅ |
| 提醒 | `warning` / `bg` | 5.84 | ≥ 4.5 | ✅ |
| 错误提示 | `danger` / `bg` | 5.20 | ≥ 4.5 | ✅ |
| 卡片上的错误提示 | `danger` / `surface` | 5.88 | ≥ 4.5 | ✅ |
| 信息 | `info` / `bg` | 6.07 | ≥ 4.5 | ✅ |
| 凹陷面上的成功色（如代码高亮） | `success` / `surface-sunken` | 5.28 | ≥ 4.5 | ✅ |
| 凹陷面上的提醒色 | `warning` / `surface-sunken` | 5.29 | ≥ 4.5 | ✅ |
| 凹陷面上的错误提示 | `danger` / `surface-sunken` | 4.71 | ≥ 4.5 | ✅ |
| 凹陷面上的信息色 | `info` / `surface-sunken` | 5.50 | ≥ 4.5 | ✅ |
| 凹陷面上的强调文字 | `accent-fg` / `surface-sunken` | 4.93 | ≥ 4.5 | ✅ |
| 焦点框 | `focus` / `bg` | 4.04 | ≥ 3 | ✅ |
<!-- contrast:end -->

## 3. 字体

| 变量 | 字体 | 用途 |
|---|---|---|
| `--vn-font-display` | Orbitron（拉丁）→ 站酷庆科黄油体（中文） | 标题 |
| `--vn-font-body` | Chakra Petch（拉丁）→ 思源黑体（中文） | 正文、按钮、表单 |
| `--vn-font-quote` | Share Tech Mono → 思源黑体 | 引文、副标题 |
| `--vn-font-mono` | Share Tech Mono | 代码 |

`themes/cyber-fonts.css` 从 Google Fonts 加载这些字体，是可选的；没有它时退回系统黑体与等宽字体，仍然成立。

## 4. 形状与层次

- 圆角：`sm` 为 0，`md` 2px，`lg` 4px。圆形元素（开关的滑块）仍用 `full`。
- 层次：`shadow-1/2/3` 是逐级增强的辉光，第三级换成品红，只给弹窗这样的顶层。
- 卡片的左上、右下有两个霓虹折角（主题通过 `vn-card::part(card)` 加上，`plain` 变体除外）。

## 5. 动效

<!-- ease:start -->
| 变量 | 曲线 | 含义与用途 |
|---|---|---|
| `--vn-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 切换：利落，没有拖尾。用于大多数状态过渡 |
| `--vn-ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | 点亮：一瞬间亮起，随即稳定。用于出现、展开、点击反馈 |
| `--vn-ease-move` | `cubic-bezier(0.6, 0, 0.2, 1)` | 冲刺：加速冲出，急停。用于位移、滑动 |
| `--vn-ease-spring` | `cubic-bezier(0.3, 1.6, 0.5, 1)` | 电压不稳：过冲后回弹。用于完成、庆祝，少用 |
<!-- ease:end -->

**时长**比古风短：`instant 60ms`、`fast 120ms`、`normal 220ms`、`slow 420ms`、`slower 640ms`。电子设备的反馈是即时的。

**点击效果**：`--vn-effect: glitch`。不写 `effect` 的 `<vn-button>` 在赛博主题下按下时故障一下；`effect="spark"` 迸出电火花。
减少动态效果时，故障只剩一次很短的闪烁，电火花不播放。

## 6. 纹理

| 变量 | 夜 | 昼 |
|---|---|---|
| `--vn-texture` | 每 6px 一道极淡的电青扫描线 | 32px 的蓝图网格 |
| `--vn-mask-stroke` | 一长三短的分段数字线 | 同左 |
| `--vn-mask-stamp` | 随机缺了若干像素的方块（固定种子，每次构建相同） | 同左 |
