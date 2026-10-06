# 古风设计系统

- 状态：已实现（`themes/guofeng.css`）
- 令牌来源：`themes/guofeng.tokens.js`。本文中的表格由 `npm run build:theme` 生成，请勿手改。
- 展示页：`examples/theme.html`

## 1. 理念：纸、墨、印、四时

古风不是把按钮画成卷轴、到处贴云纹。它来自书画里的几条老规矩：

| 规矩 | 在界面里的意思 |
|---|---|
| **留白** | 内容少而疏。间距宁大勿小，一屏只说一件事 |
| **墨分五色** | 层次靠墨色深浅（焦、浓、重、淡、清），而不是靠更多颜色 |
| **一点朱** | 朱砂是全局唯一的强调色。同一视野里通常只有一处朱红：主操作、印章或错误 |
| **笔意** | 毛笔字、笔触线条只用在标题和少量点缀上；正文、按钮、表单保持安静 |
| **四时** | 风、花、雪、月四种意象色只用于装饰和效果，不承担信息 |

由此得出三条硬规则：

1. 组件只用**语义令牌**（`--vn-fg`、`--vn-accent`……），不直接用原色，更不写死色值。
2. 每个视图区域最多一个朱砂色的主操作。
3. 毛笔字体只用于 ≥ 28px 的标题，不用于正文、按钮、标签。

## 2. 色彩

### 2.1 原色

有名字的传统色。色值为屏幕显示和对比度做过校准，不追求考据上的精确。

<!-- palette:start -->
| 色名 | 色值 | 变量 | 用途 |
|---|---|---|---|
| <span style="color:#FBF8F2">■</span> 绢白 | `#FBF8F2` | `--vn-color-juanbai` | 最亮的纸面：卡片、浮层 |
| <span style="color:#F4EEE2">■</span> 宣纸 | `#F4EEE2` | `--vn-color-xuanzhi` | 页面底色 |
| <span style="color:#EAE2D2">■</span> 茶白 | `#EAE2D2` | `--vn-color-chabai` | 凹陷面：输入框、悬停 |
| <span style="color:#DCD1BC">■</span> 缃色 | `#DCD1BC` | `--vn-color-xiangse` | 装饰线、分隔 |
| <span style="color:#8A8276">■</span> 清墨 | `#8A8276` | `--vn-color-qingmo` | 控件边框、次要图形 |
| <span style="color:#6B645B">■</span> 淡墨 | `#6B645B` | `--vn-color-danmo` | 次要文字 |
| <span style="color:#47423C">■</span> 重墨 | `#47423C` | `--vn-color-zhongmo` | 强调的次要文字 |
| <span style="color:#2A2724">■</span> 浓墨 | `#2A2724` | `--vn-color-nongmo` | 正文 |
| <span style="color:#1A1816">■</span> 焦墨 | `#1A1816` | `--vn-color-jiaomo` | 最深的墨 |
| <span style="color:#B0382B">■</span> 朱砂 | `#B0382B` | `--vn-color-zhusha` | 印章、强调、主操作 |
| <span style="color:#9A2A30">■</span> 胭脂 | `#9A2A30` | `--vn-color-yanzhi` | 危险、错误 |
| <span style="color:#E8A3AB">■</span> 桃夭 | `#E8A3AB` | `--vn-color-taoyao` | 花：装饰 |
| <span style="color:#C25565">■</span> 海棠 | `#C25565` | `--vn-color-haitang` | 花：深 |
| <span style="color:#5E8A6E">■</span> 竹青 | `#5E8A6E` | `--vn-color-zhuqing` | 风：装饰 |
| <span style="color:#3A6B57">■</span> 青瓷 | `#3A6B57` | `--vn-color-qingci` | 成功 |
| <span style="color:#8A6420">■</span> 泥金 | `#8A6420` | `--vn-color-nijin` | 提醒 |
| <span style="color:#3B5166">■</span> 黛蓝 | `#3B5166` | `--vn-color-dailan` | 信息 |
| <span style="color:#D6E3E8">■</span> 月白 | `#D6E3E8` | `--vn-color-yuebai` | 月：装饰 |
| <span style="color:#EEF2F4">■</span> 霜 | `#EEF2F4` | `--vn-color-shuang` | 雪：装饰 |
| <span style="color:#14171D">■</span> 玄青 | `#14171D` | `--vn-color-xuanqing` | 夜：页面底色 |
| <span style="color:#1C2028">■</span> 夜色 | `#1C2028` | `--vn-color-yese` | 夜：卡片 |
| <span style="color:#252A34">■</span> 黛黑 | `#252A34` | `--vn-color-daihei` | 夜：凹陷面 |
| <span style="color:#A6A094">■</span> 银灰 | `#A6A094` | `--vn-color-yinhui` | 夜：次要文字 |
| <span style="color:#ECE6D9">■</span> 月光 | `#ECE6D9` | `--vn-color-yueguang` | 夜：正文 |
| <span style="color:#E87A66">■</span> 丹 | `#E87A66` | `--vn-color-dan` | 夜：强调文字 |
| <span style="color:#F08A8E">■</span> 绯 | `#F08A8E` | `--vn-color-feise` | 夜：危险 |
| <span style="color:#7FBFA5">■</span> 碧 | `#7FBFA5` | `--vn-color-bise` | 夜：成功 |
| <span style="color:#D9B36A">■</span> 金 | `#D9B36A` | `--vn-color-jin` | 夜：提醒 |
| <span style="color:#8FB2D1">■</span> 碧蓝 | `#8FB2D1` | `--vn-color-bilan` | 夜：信息 |
<!-- palette:end -->

### 2.2 语义令牌

组件只用这些。昼、夜两套主题给同一个名字不同的值。

<!-- semantic:start -->
| 变量 | 昼 | 夜 |
|---|---|---|
| `--vn-bg` | 宣纸 `#F4EEE2` | 玄青 `#14171D` |
| `--vn-surface` | 绢白 `#FBF8F2` | 夜色 `#1C2028` |
| `--vn-surface-sunken` | 茶白 `#EAE2D2` | 黛黑 `#252A34` |
| `--vn-fg` | 浓墨 `#2A2724` | 月光 `#ECE6D9` |
| `--vn-fg-strong` | 焦墨 `#1A1816` | `#F7F2E8` |
| `--vn-fg-muted` | 淡墨 `#6B645B` | 银灰 `#A6A094` |
| `--vn-fg-subtle` | `#8C8478` | `#6F6C66` |
| `--vn-line` | `rgba(42, 39, 36, 0.14)` | `rgba(236, 230, 217, 0.13)` |
| `--vn-line-strong` | 清墨 `#8A8276` | `#7A766F` |
| `--vn-primary` | 浓墨 `#2A2724` | 月光 `#ECE6D9` |
| `--vn-on-primary` | `#F7F1E6` | 玄青 `#14171D` |
| `--vn-accent` | 朱砂 `#B0382B` | `#B8473A` |
| `--vn-on-accent` | `#FBF5EC` | `#FFF4EC` |
| `--vn-accent-fg` | 朱砂 `#B0382B` | 丹 `#E87A66` |
| `--vn-accent-wash` | `rgba(176, 56, 43, 0.1)` | `rgba(232, 122, 102, 0.14)` |
| `--vn-success` | 青瓷 `#3A6B57` | 碧 `#7FBFA5` |
| `--vn-warning` | 泥金 `#8A6420` | 金 `#D9B36A` |
| `--vn-danger` | 胭脂 `#9A2A30` | 绯 `#F08A8E` |
| `--vn-info` | 黛蓝 `#3B5166` | 碧蓝 `#8FB2D1` |
| `--vn-focus` | 朱砂 `#B0382B` | 丹 `#E87A66` |
| `--vn-selection` | `rgba(176, 56, 43, 0.18)` | `rgba(232, 122, 102, 0.28)` |
| `--vn-overlay` | `rgba(26, 24, 22, 0.42)` | `rgba(5, 6, 8, 0.6)` |
| `--vn-wind` | 竹青 `#5E8A6E` | `#8DB49A` |
| `--vn-blossom` | 桃夭 `#E8A3AB` | `#E39AA4` |
| `--vn-blossom-deep` | 海棠 `#C25565` | `#D46F7E` |
| `--vn-snow` | `#C9D4DC` | 霜 `#EEF2F4` |
| `--vn-moon` | 月白 `#D6E3E8` | `#F3EBD3` |
<!-- semantic:end -->

使用约定：

- `fg` 正文，`fg-muted` 次要文字和占位符，`fg-subtle` 只用于禁用态和装饰（不承载必须读到的信息）。
- `line` 是装饰性分隔线（不要求对比度）；控件边框必须用 `line-strong`。
- `accent` 是朱砂色块（配 `on-accent` 文字）；朱砂色的**文字**用 `accent-fg`。夜间两者不同：深底上的文字需要更亮的“丹”。
- `wind` / `blossom` / `snow` / `moon` 是风花雪月的意象色，只给效果和插画用。

### 2.3 对比度

所有组合都满足 WCAG 2.1 AA：正文 ≥ 4.5，图形、控件边框、焦点框 ≥ 3。测试会在任何一项不达标时失败。

<!-- contrast:start -->
**昼**

| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |
|---|---|---|---|---|
| 正文 | `fg` / `bg` | 12.85 | ≥ 4.5 | ✅ |
| 卡片上的正文 | `fg` / `surface` | 14.01 | ≥ 4.5 | ✅ |
| 输入框中的文字 | `fg` / `surface-sunken` | 11.53 | ≥ 4.5 | ✅ |
| 次要文字 | `fg-muted` / `bg` | 5.05 | ≥ 4.5 | ✅ |
| 卡片上的次要文字 | `fg-muted` / `surface` | 5.50 | ≥ 4.5 | ✅ |
| 占位文字 | `fg-muted` / `surface-sunken` | 4.53 | ≥ 4.5 | ✅ |
| 弱化图形、禁用态 | `fg-subtle` / `bg` | 3.20 | ≥ 3 | ✅ |
| 控件边框 | `line-strong` / `bg` | 3.28 | ≥ 3 | ✅ |
| 卡片上的控件边框 | `line-strong` / `surface` | 3.58 | ≥ 3 | ✅ |
| 墨色按钮文字 | `on-primary` / `primary` | 13.21 | ≥ 4.5 | ✅ |
| 朱砂按钮文字 | `on-accent` / `accent` | 5.62 | ≥ 4.5 | ✅ |
| 强调文字、链接 | `accent-fg` / `bg` | 5.27 | ≥ 4.5 | ✅ |
| 卡片上的强调文字 | `accent-fg` / `surface` | 5.75 | ≥ 4.5 | ✅ |
| 成功提示 | `success` / `bg` | 5.31 | ≥ 4.5 | ✅ |
| 提醒 | `warning` / `bg` | 4.63 | ≥ 4.5 | ✅ |
| 错误提示 | `danger` / `bg` | 6.61 | ≥ 4.5 | ✅ |
| 卡片上的错误提示 | `danger` / `surface` | 7.21 | ≥ 4.5 | ✅ |
| 信息 | `info` / `bg` | 7.11 | ≥ 4.5 | ✅ |
| 焦点框 | `focus` / `bg` | 5.27 | ≥ 3 | ✅ |

**夜**

| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |
|---|---|---|---|---|
| 正文 | `fg` / `bg` | 14.43 | ≥ 4.5 | ✅ |
| 卡片上的正文 | `fg` / `surface` | 13.13 | ≥ 4.5 | ✅ |
| 输入框中的文字 | `fg` / `surface-sunken` | 11.57 | ≥ 4.5 | ✅ |
| 次要文字 | `fg-muted` / `bg` | 6.90 | ≥ 4.5 | ✅ |
| 卡片上的次要文字 | `fg-muted` / `surface` | 6.28 | ≥ 4.5 | ✅ |
| 占位文字 | `fg-muted` / `surface-sunken` | 5.53 | ≥ 4.5 | ✅ |
| 弱化图形、禁用态 | `fg-subtle` / `bg` | 3.43 | ≥ 3 | ✅ |
| 控件边框 | `line-strong` / `bg` | 3.97 | ≥ 3 | ✅ |
| 卡片上的控件边框 | `line-strong` / `surface` | 3.61 | ≥ 3 | ✅ |
| 墨色按钮文字 | `on-primary` / `primary` | 14.43 | ≥ 4.5 | ✅ |
| 朱砂按钮文字 | `on-accent` / `accent` | 4.85 | ≥ 4.5 | ✅ |
| 强调文字、链接 | `accent-fg` / `bg` | 6.33 | ≥ 4.5 | ✅ |
| 卡片上的强调文字 | `accent-fg` / `surface` | 5.76 | ≥ 4.5 | ✅ |
| 成功提示 | `success` / `bg` | 8.46 | ≥ 4.5 | ✅ |
| 提醒 | `warning` / `bg` | 9.07 | ≥ 4.5 | ✅ |
| 错误提示 | `danger` / `bg` | 7.46 | ≥ 4.5 | ✅ |
| 卡片上的错误提示 | `danger` / `surface` | 6.79 | ≥ 4.5 | ✅ |
| 信息 | `info` / `bg` | 8.08 | ≥ 4.5 | ✅ |
| 焦点框 | `focus` / `bg` | 6.33 | ≥ 3 | ✅ |
<!-- contrast:end -->

## 3. 字体

| 变量 | 字体 | 用途 |
|---|---|---|
| `--vn-font-brush` | 马善政毛笔楷书 → 系统行楷 / 楷体 | 大标题、印章外的书法点缀 |
| `--vn-font-kai` | 系统楷体 | 引文、诗句、副标题 |
| `--vn-font-serif` | 思源宋体 → 系统宋体 | 正文、按钮、表单：全站默认 |
| `--vn-font-mono` | 等宽 | 代码 |

`themes/guofeng-fonts.css` 从 Google Fonts 加载马善政楷书和思源宋体，是可选的。正式项目建议自托管字体文件，并按需子集化。

**字号**（`--vn-font-size-*`）：`xs 12` `sm 14` `md 16` `lg 18` `xl 22` `2xl 28` `3xl 36` `4xl 48` `5xl 64`。正文 16，中文宋体在屏幕上不宜更小。

**行高**：正文 `--vn-leading-normal`（1.75），中文正文需要比西文更松；标题用 `tight`（1.3）。

**字距**：短标签、按钮、小标题用 `--vn-tracking-wider`（0.2em），字与字之间留出呼吸；正文保持 0。

**行宽**：`--vn-measure-normal`（34em）约每行 30 多字，是中文舒适阅读的上限。

## 4. 间距与形状

**间距**以 4px 为基本单位：`1=4` `2=8` `3=12` `4=16` `5=24` `6=32` `7=48` `8=64` `9=96`。组件内部用 1–4，组件之间用 5–7，区块之间用 8–9。

**圆角**偏方：`sm 2px`（按钮、输入框）、`md 4px`（卡片、印章）、`lg 8px`（浮层）、`full`（圆形开关、头像）。

**边框**：常规 1px。古籍式的**双线框**（外粗内细）只用于卡片的 `frame` 变体，不要层层套用。

## 5. 层次

纸张叠放的感觉：阴影带暖褐色，偏下、偏软，而不是冷灰色的悬浮。

| 变量 | 用途 |
|---|---|
| `--vn-shadow-1` | 贴在纸上：按钮按下、轻微的分层 |
| `--vn-shadow-2` | 浮起的纸片：卡片悬停、下拉面板 |
| `--vn-shadow-3` | 展开的卷轴：弹窗 |

夜间阴影换成纯黑并加重，因为深底上暖色阴影看不出来。

## 6. 动效

动效模仿书画里的动作，每条曲线有自己的“意思”：

<!-- ease:start -->
| 变量 | 曲线 | 含义与用途 |
|---|---|---|
| `--vn-ease-ink` | `cubic-bezier(0.16, 1, 0.3, 1)` | 墨晕：落墨即散，越散越慢。用于点击反馈、展开、出现 |
| `--vn-ease-brush` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | 运笔：起笔利落，收笔稳。用于大多数状态过渡 |
| `--vn-ease-wind` | `cubic-bezier(0.45, 0, 0.2, 1)` | 风过：缓起缓落。用于位移、滑动、切换 |
| `--vn-ease-petal` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | 落花：轻轻越过再回落。用于完成、庆祝，少用 |
<!-- ease:end -->

**时长**：`instant 100ms`（悬停）、`fast 180ms`（小状态）、`normal 320ms`（展开收起）、`slow 600ms`（大面积过渡）、`ink 900ms`（墨晕、落花等效果）。

**原则**：

- 反馈要快，效果可以慢：点击后的状态变化不超过 `fast`，墨晕可以 `ink`。
- 一次只动一处，不要让整页一起动。
- 用户开启“减少动态效果”时，主题把所有 `--vn-duration-*` 变为 1ms。组件的 CSS 过渡自动生效；JS 动画由 `this.animate()` 处理；粒子类效果不启动。

## 7. 纹理

| 变量 | 是什么 | 怎么用 |
|---|---|---|
| `--vn-texture-paper` | 宣纸纤维噪声（随主题变化） | `background-image`，页面已默认带上 |
| `--vn-mask-seal` | 印泥斑驳 | `mask: var(--vn-mask-seal)`，用于印章 |
| `--vn-mask-brush` | 两头尖的笔触 | `mask: var(--vn-mask-brush) center / 100% 100% no-repeat`，用于分隔线、输入框下划线 |

纹理都是内联 SVG，不发网络请求。

## 8. 主题切换

```html
<html data-theme="night">   <!-- 夜 -->
<html data-theme="auto">    <!-- 跟随系统 -->
<section data-theme="night">…</section>   <!-- 局部：页面是昼，这一块是夜 -->
```

语义令牌是 CSS 变量，会自动穿过 Shadow DOM，所以组件不需要任何代码就能跟随主题。

**定制**：覆盖语义令牌即可。

```css
:root {
  --vn-accent: #1f5f8b;        /* 把朱砂换成靛蓝 */
  --vn-on-accent: #f4f8fb;
  --vn-accent-fg: #1f5f8b;
}
```

改完色值后请检查对比度：在 `themes/guofeng.tokens.js` 里修改并运行 `npm run build:theme`，脚本会指出不达标的组合。

## 9. 命名规则

- 原色：`--vn-color-拼音`，例如 `--vn-color-zhusha`。只在主题文件内部引用。
- 语义色：`--vn-用途`，例如 `--vn-fg-muted`。成对出现的用 `on-` 前缀：`--vn-accent` / `--vn-on-accent`。
- 尺度：`--vn-类别-级别`，例如 `--vn-space-4`、`--vn-font-size-lg`、`--vn-duration-fast`。
- 组件私有：`--_名字`；组件对外开放的定制点：`--vn-组件名-属性`。
