# RFC 0006：主题契约与第二套主题

- 状态：已实现
- 依赖：[古风设计系统](../design/guofeng.md) · [RFC 0003 效果](0003-effects.md) · [RFC 0004 组件](0004-components.md)

## 1. 问题

设计原则第 4 条是“设计即变量”：组件只描述结构和行为，风格由主题决定。到 M7 为止这句话只被一套主题检验过，
而且变量名本身带着古风：`--vn-font-brush`、`--vn-ease-ink`、`--vn-mask-seal`、`--vn-wood`。
如果另一套主题要提供 `--vn-ease-ink`，名字就在撒谎；如果组件里还藏着只对古风成立的假设，现在不暴露，
等第二批组件写完再暴露，就要返工二十多个组件。

所以在做第二批组件之前，先把“主题需要提供什么、组件可以依赖什么”写成契约，并用一套风格截然相反的主题——
**赛博（霓虹、硬边、故障）**——验证它。

## 2. 目标与非目标

**目标**

1. 契约：一份所有主题都必须提供的变量清单，名字描述**用途**而不是**风格**。组件、效果、文档站只能使用契约里的变量。
2. 换主题只需换一个 CSS 文件；第二套主题不修改任何组件源码。
3. 每套主题都有昼、夜两种模式，都满足同一份 WCAG AA 对比度规则。
4. 点击效果随主题变化：古风默认墨晕，赛博默认故障。
5. 构建脚本检查每套主题是否完整提供契约，测试在两套主题下都运行。

**非目标**

- 同一页面同时使用两套主题（局部切换昼夜仍然支持）。需要并排对比时用 `<iframe>`。
- 运行时生成主题、主题编辑器。
- 改变组件结构来迁就某个主题。主题能改的是变量，以及组件公开的 `::part()`（见 §6）。

## 3. 两个维度：风格与模式

| | 是什么 | 怎么选 |
|---|---|---|
| **主题（风格）** | 古风、赛博……一整套颜色、字体、形状、动效、效果 | 引入哪个 CSS 文件：`themes/guofeng.css` / `themes/cyber.css` |
| **模式** | 昼 / 夜 / 跟随系统 | `<html data-mode="day | night | auto">`，任意元素上也可以写，只影响子树 |

此前昼夜写在 `data-theme` 上。“主题”从此专指风格，属性改名为 **`data-mode`**，本地存储的键从 `vunio-theme` 改为 `vunio-mode`。
1.0 之前不保留旧名（见 CHANGELOG 的迁移表）。

每套主题声明自己的默认模式：古风默认昼，赛博默认夜。没有写 `data-mode` 时使用默认模式。

## 4. 契约

### 4.1 颜色（每种模式各一套）

| 分组 | 变量 | 用途 |
|---|---|---|
| 面 | `bg` `surface` `surface-sunken` | 页面、卡片与浮层、输入框与悬停 |
| 字 | `fg` `fg-strong` `fg-muted` `fg-subtle` | 正文、标题、次要、弱化 |
| 线 | `line` `line-strong` | 装饰分隔、控件边界 |
| 主操作 | `primary` `on-primary` | 默认按钮 |
| 强调 | `accent` `on-accent` `accent-fg` `accent-wash` | 一个视图里最重要的那一个操作、强调文字、浅底 |
| 状态 | `success` `warning` `danger` `info` | |
| 交互 | `focus` `selection` `overlay` | 焦点框、选中文字、遮罩 |
| 器物 | `frame` `trim` | 立轴的轴杆与轴头、框体与饰件 |
| 意象 | `blossom` `blossom-deep` `snow` `wind` `moon` `night-sky` | 效果与天气里画出来的“东西”的颜色 |

“意象”变量的名字是**画的是什么**，不是什么风格：赛博主题也要回答“花瓣在霓虹里是什么颜色”。

### 4.2 其他按模式变化的变量

- `--vn-shadow-1/2/3`：层次。古风是纸的投影，赛博是霓虹的辉光。
- `--vn-texture`：页面底纹（`background-image`）。古风是纸纹，赛博是扫描线。

### 4.3 与模式无关、但每套主题不同的变量

| 分组 | 变量 | 说明 |
|---|---|---|
| 字体 | `font-display` `font-body` `font-quote` `font-mono` | 标题与展示、正文、引文、代码 |
| 圆角 | `radius-none/sm/md/lg/full` | |
| 缓动 | `ease-standard` `ease-enter` `ease-move` `ease-spring` | 状态过渡、出现与展开、位移、越过再回落 |
| 时长 | `duration-instant/fast/normal/slow/slower` | 减少动态效果时全部为 1ms |
| 形状 | `mask-stroke` `mask-stamp` | 用作 `mask-image`：横向拉伸的线条（分隔线、下划线、按钮底纹）、印记的质感（印章、徽记） |
| 效果 | `effect` | 按钮默认的点击效果名，如 `ink`、`glitch` |
| 焦点 | `focus-ring` `focus-offset` | |

### 4.4 共享尺度

字号、行高、字距、字重、间距、线宽、层级、行宽由 `themes/base.js` 统一提供，主题可以覆盖个别值，
但通常不需要——它们决定的是排版的节奏，不是风格。

### 4.5 改名对照

| 旧 | 新 |
|---|---|
| `data-theme="day|night|auto"` | `data-mode="day|night|auto"` |
| `--vn-font-brush` / `--vn-font-serif` / `--vn-font-kai` | `--vn-font-display` / `--vn-font-body` / `--vn-font-quote` |
| `--vn-ease-brush` / `--vn-ease-ink` / `--vn-ease-wind` / `--vn-ease-petal` | `--vn-ease-standard` / `--vn-ease-enter` / `--vn-ease-move` / `--vn-ease-spring` |
| `--vn-duration-ink` | `--vn-duration-slower` |
| `--vn-mask-brush` / `--vn-mask-seal` | `--vn-mask-stroke` / `--vn-mask-stamp` |
| `--vn-texture-paper` | `--vn-texture` |
| `--vn-wood` / `--vn-gilt` | `--vn-frame` / `--vn-trim` |

古风设计文档继续用“墨晕”“运笔”描述古风主题**如何取值**，但变量名只描述用途。

## 5. 效果随主题变化

效果是 JS，主题是 CSS，所以效果的**实现**放在 `vunio/effects`，主题只**选择**：

- `burst()` 增加两种效果：**`glitch` 故障**（按钮被横向切成几条，错位、分出红青两色后复原）和 **`spark` 电火花**（几道折线火花从点击处迸出）。
- `<vn-button effect>` 的默认值从 `ink` 改为 `auto`：点击时读取 `--vn-effect`，古风为 `ink`，赛博为 `glitch`。写明 `effect="blossom"` 时不受主题影响。
- `registerBurst(name, { layer, run })` 让使用者加入自己的效果；`layer` 指明粒子放在裁切的“晕层”（`'wash'`）还是不裁切的“飞层”（`'fx'`）。
- `<vn-sky>` 增加 `weather="rain"`（斜落的雨丝，颜色取 `--vn-snow`）。古风里是春雨，赛博里是霓虹雨。

减少动态效果时：`glitch` 只做一次很短的错位，`spark` 不生成粒子。

## 6. 组件可以依赖什么

- 组件样式只能使用契约变量，构建脚本会扫描 `src/` 里所有 `var(--vn-…)`，出现契约之外的名字时报错。
- 主题 CSS 除了变量，可以用 `::part()` 调整组件公开的部件（部件名写在每个组件的 JSDoc 里，属于公开 API）。
  这是给“变量表达不了的形状”留的出口，例如赛博主题给卡片加上切角的边框。主题不能依赖组件内部的类名。
- 组件里与风格强相关、但仍然合理的结构（例如弹窗上下的“轴杆”）保留：它在古风里是木轴，在赛博里是两道霓虹灯管，
  由 `frame` / `trim` 决定。
- 组件属性的取值保留 Vunio 自己的名字（如按钮的 `variant="ink | cinnabar | moon | text"`）。它们表示**角色**——主操作、强调、描边、文字——
  在赛博主题里 `cinnabar` 就是品红。
- 主题需要随模式变化、又不属于契约的值（例如赛博标题的辉光只在夜里出现），写在 `modes.<模式>.vars` 里，名字不用 `--vn-` 前缀，
  只给主题自己的 `::part()` 调整使用。

## 7. 主题文件

```js
// themes/cyber.tokens.js
import { defineTheme } from './base.js';

export default defineTheme({
  name: 'cyber',
  label: '赛博',
  defaultMode: 'night',
  fontImport: 'https://fonts.googleapis.com/css2?family=…',   // 可选的网络字体
  palette: { neon: { name: '霓虹青', hex: '#00E5FF' }, … },
  modes: {
    night: { colors: { bg: c('void'), … }, shadows: { … }, texture: … },
    day: { … },
  },
  fonts: { display: "'Orbitron', 'ZCOOL QingKe HuangYou', sans-serif", … },
  ease: { … }, duration: { … }, radius: { … },
  masks: { stroke: svg`…`, stamp: svg`…` },
  effect: 'glitch',
  css: `/* ::part() 调整 */`,
});
```

`npm run build:theme` 为 `themes/` 下的每个 `*.tokens.js` 生成 `<name>.css` 与 `<name>-fonts.css`，并刷新对应设计文档里的表格。
构建会检查：契约变量是否齐全；两种模式是否都满足对比度规则（规则清单在 `base.js`，所有主题共用）。

## 8. 测试计划

- Node：每套主题都提供全部契约变量；两种模式的对比度达标；生成的 CSS 是最新的；`src/` 只使用契约变量。
- 浏览器：测试夹具可以通过 `?theme=cyber` 换主题；`THEME=cyber npm test` 在赛博主题下运行整个浏览器测试集，CI 在 Chromium 中跑这一组。
- 无障碍：axe 审计覆盖两套主题 × 两种模式。
- 效果：`glitch` / `spark` 结束后不留节点；`effect="auto"` 随 `--vn-effect` 变化；`registerBurst` 注册的效果可以被按钮使用。

## 9. 迁移

使用者需要做的事（写进 CHANGELOG）：

1. `data-theme` → `data-mode`；本地存储的键 `vunio-theme` → `vunio-mode`。
2. 自己写的样式里，按 §4.5 的对照表替换变量名。
3. `<vn-button>` 不写 `effect` 时，点击效果由主题决定（古风仍是墨晕，行为不变）。
