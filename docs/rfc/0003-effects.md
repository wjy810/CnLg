# RFC 0003：风花雪月效果

- 状态：已实现
- 依赖：[古风设计系统](../design/guofeng.md)

## 1. 目标

给组件提供两类“有意境”的动效：

1. **点击效果（burst）**：一次性的，从一个点发出，结束后自动清理。墨晕、落花、飞雪、风叶。
2. **天气背景（`<vn-sky>`）**：持续的画布粒子：雪、花、风，可选一轮月亮。

要求：

- 颜色全部来自主题令牌，昼夜自动切换；
- 尊重“减少动态效果”；不可见时不消耗资源；高清屏不发虚；
- 组件移除时立即停止，不留下任何节点、计时器或动画帧。

**非目标**：物理引擎、WebGL、可配置到每个粒子的复杂系统。效果是点缀，不是主角（见设计系统“一点朱”“笔意”原则）。

## 2. 点击效果

```js
import { burst } from 'vunio';

burst('blossom', layer, { x, y });                       // 在 layer 内 (x, y) 处落花
burst('ink', layer, { x, y, animate: this.animate.bind(this) });  // 组件里推荐这样写
```

| 参数 | 说明 |
|---|---|
| `kind` | `'ink'` 墨晕 · `'blossom'` 落花 · `'snow'` 飞雪 · `'wind'` 风叶 |
| `layer` | 粒子插入的容器，需要是定位元素（`position: relative/absolute`） |
| `x`, `y` | 相对 `layer` 左上角的坐标；省略时为中心 |
| `count` | 粒子数，有默认值 |
| `animate` | `(el, keyframes, timing) => Animation`。组件传 `this.animate.bind(this)`，移除组件时动画随之取消 |

返回一个 Promise，所有粒子动画结束（或被取消）并移除节点后完成。

| 效果 | 形态 | 颜色令牌 | 时长 | 适合 |
|---|---|---|---|---|
| 墨晕 | 一团从点击处晕开的墨，边缘柔和 | `--vn-burst-ink`（默认 `currentColor`） | `--vn-duration-slower` | 按钮按下的通用反馈 |
| 落花 | 十余片花瓣迸出后翻飞飘落 | `--vn-blossom` / `--vn-blossom-deep` | 1.4–2.2s | 完成、收藏、点赞 |
| 飞雪 | 细小雪粒轻轻散开后缓缓下坠 | `--vn-snow` | 1.6–2.6s | 安静的确认 |
| 风叶 | 几片竹叶被风横着吹走，带几道风痕 | `--vn-wind` | 0.9–1.4s | 发送、提交、前进 |
| 故障 | 一道闪光加几条色带错位闪烁，像信号受了干扰 | `--vn-burst-ink`、`--vn-accent`、`--vn-info` | 0.2–0.4s | 赛博主题的默认按下反馈 |
| 电火花 | 几道细光迸出，带几粒像素碎屑 | `--vn-accent-fg`、`--vn-info` | 0.3–0.65s | 完成、解锁、连接成功 |

- **墨晕**、**故障**需要容器裁切（`overflow: hidden`），其余需要不裁切的容器，粒子会飞出按钮边界。组件通常准备两层：裁切的“晕层”和不裁切的“飞层”，`burstLayer(name)` 返回 `'wash'` 或 `'fx'`。
- **减少动态效果**：落花、飞雪、风叶、电火花不生成粒子；墨晕、故障只做一次很淡的闪烁（保留“按下了”的反馈）。
- **注册表**（[RFC 0006](0006-theme-contract.md) 加入）：效果都登记在注册表里，`registerBurst(name, { layer, reducedMotion, run })` 加入自己的效果，`<vn-button effect="name">` 即可使用。
  `run(layer, ctx)` 拿到 `x`、`y`、`width`、`height`、`reduced` 以及 `particle(styles)`、`play(el, keyframes, timing)` 两个工具，返回各粒子的 Promise。
- **随主题变化**：`<vn-button>` 不写 `effect` 时读取主题变量 `--vn-effect`（古风 `ink`，赛博 `glitch`）。

花瓣用 `clip-path: path()` 画出带缺口的樱花瓣形状，竹叶用两端尖的圆角矩形；颜色写成 `var(--vn-*)`，所以粒子插入后自动取当前主题的颜色。

## 3. 天气背景 `<vn-sky>`

```html
<section style="position: relative">
  <vn-sky weather="blossom" moon></vn-sky>
  …内容…
</section>
```

| 属性 | 默认 | 说明 |
|---|---|---|
| `weather` | `snow` | `snow` · `blossom` · `wind` · `rain` · `none` |
| `density` | `1` | 粒子密度倍数（0–3） |
| `wind` | `0` | 横向风力（-1 向左 … 1 向右） |
| `moon` | — | 显示一轮月亮（昼间淡，夜间亮） |
| `fixed` | — | 铺满视口并固定（默认铺满最近的定位祖先） |

实现：

- 一张 `<canvas>`，按 `devicePixelRatio`（最多 2）缩放；`ResizeObserver` 跟随尺寸变化。
- 粒子数 = 面积 / 9000 × 密度，最多 260 个。每种天气是一组纯函数：`spawn`（生成）、`step`（推进）、`draw`（绘制），放在 `src/effects/weather.js`，可以脱离组件单独测试。
- **雪**：大小决定远近，大的落得快、更不透明（视差）；左右轻摆。
- **花**：花瓣绕自身旋转，并用横向缩放模拟翻面；随风斜落。
- **风**：竹叶横向疾行、上下起伏，偶尔有阵风让整体加速，并夹着几道淡淡的风痕。
- **雨**：细长的雨丝快速斜落，越近越粗、越亮；`wind` 改变倾斜角度。颜色用 `--vn-snow`（古风里是春雨，赛博里是霓虹雨）。
- **月**：DOM 元素，径向渐变加光晕，颜色 `--vn-moon`。
- 颜色从组件的计算样式读取 `--vn-snow` 等令牌，每 500ms 刷新一次，以便跟上主题切换（包括祖先元素上的局部主题）。

资源策略：

| 情况 | 行为 |
|---|---|
| 不在视口中（`IntersectionObserver`） | 暂停动画循环 |
| 标签页在后台 | 浏览器本身会停掉 rAF；恢复时 `dt` 被限制在 64ms，画面不跳 |
| 减少动态效果 | 只画一帧静止画面，不启动循环 |
| 组件移除 | 基类自动停止循环、断开所有 Observer |
| `weather="none"` | 清空画布，不启动循环 |

## 4. 测试计划

- `burst`：每种效果都生成粒子，动画结束后节点全部移除；未知效果名抛错；减少动态效果时不生成粒子（墨晕、故障只闪一下）；传入的 `animate` 被调用；`registerBurst` 注册的效果可以被按钮使用。
- `weather.js`：粒子数随面积和密度变化且有上限；推进后粒子会移动，出界后回到另一侧。
- `<vn-sky>`：画布尺寸 = CSS 尺寸 × DPR；循环在运行；移出视口后暂停、移回后恢复；移除组件后不再绘制；减少动态效果时只画一帧；切换 `weather` 立即生效。
