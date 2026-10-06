# 更新记录

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
1.0 之前，次版本号的变化可能包含不兼容的改动，会在这里写明迁移方法。

## [未发布] 0.1.0

第一个版本：框架核心、古风设计系统、第一批组件、路由与文档站。

### 核心

- `VunioElement` 基类：属性与 attribute 双向同步并且是响应式的；`render()` 返回模板，只渲染一次，之后精确更新。
  事件、计时器、动画、观察器、`effect` 都归组件所有，移出页面时自动释放，移回时补上期间错过的变化。
- `VunioFormElement`：表单关联（`ElementInternals`），中文校验信息，只在交互过后显示错误。
- Signals：`signal`、`computed`、`effect`、`batch`、`untrack`、`createScope`。菱形依赖无毛刺，computed 无人订阅时自动退订，
  effect 互相触发超过 100 次时报错而不是卡死页面。
- 响应式模板 `html`：文字、属性（多段插值、class / style 对象）、`?布尔`、`.DOM属性`、`@事件` 五种绑定；
  `when`、`repeat`（带 key，按最长递增子序列最少移动）、`unsafeHTML`、`svg`。没有虚拟 DOM，插值天然防 XSS。

### 主题（RFC 0006）

- 主题契约：每套主题都提供同一份变量，名字描述用途；构建脚本检查主题是否完整、组件是否只用契约变量。
- 第二套主题**赛博**（`themes/cyber.css`）：霓虹、硬边、扫描线，默认为夜。组件源码不变，测试在两套主题下都通过。
- 点击效果随主题：`<vn-button>` 的 `effect` 默认 `auto`，读取 `--vn-effect`（古风 `ink`，赛博 `glitch`）。
- 新效果：`glitch` 故障、`spark` 电火花；`registerBurst()` 注册自己的效果；`<vn-sky weather="rain">`。

**迁移**（相对开发中的早期提交）

| 旧 | 新 |
|---|---|
| `data-theme="day\|night\|auto"`、存储键 `vunio-theme` | `data-mode="…"`、存储键 `vunio-mode`（`vunio-theme` 现在存主题名） |
| `--vn-font-brush` / `-serif` / `-kai` | `--vn-font-display` / `-body` / `-quote` |
| `--vn-ease-brush` / `-ink` / `-wind` / `-petal` | `--vn-ease-standard` / `-enter` / `-move` / `-spring` |
| `--vn-duration-ink` | `--vn-duration-slower` |
| `--vn-mask-brush` / `--vn-mask-seal` / `--vn-texture-paper` | `--vn-mask-stroke` / `--vn-mask-stamp` / `--vn-texture` |
| `--vn-wood` / `--vn-gilt` | `--vn-frame` / `--vn-trim` |
| `themes/guofeng.tokens.js` 的命名导出 | 默认导出 `defineTheme({...})`；契约与对比度规则在 `themes/base.js` |

### 设计系统

- 古风主题令牌（纸、墨、朱砂、黛青、泥金……）是唯一来源，生成 CSS 和文档表格。
- 昼 / 夜 / 跟随系统三种主题，所有文字配色经测试满足 WCAG AA 对比度。
- 开启“减少动态效果”时，所有动效时长变为 1ms，粒子效果改为静止或省略。

### 效果

- `burst()`：墨晕、落花、飞雪、风叶四种点击效果。
- `<vn-sky>`：画布绘制的风、花、雪与月，离开视口自动暂停，高清屏不发虚。

### 组件

按钮、标题、卡片、布局、分隔线、加载、输入框、下拉选择、复选框、开关、弹窗、消息，以及天气背景 `<vn-sky>`。
全部可以直接放进 `<form>`、可用键盘操作，并通过 axe 无障碍检查。

### 路由与文档站

- `createRouter`：hash / history 两种模式，按具体程度匹配，懒加载，标题、滚动恢复，切换后焦点移到主标题。
- 文档站用 Vunio 自身写成；组件 API 表格由源码 JSDoc 生成，测试保证不会过期。

### 质量

- 测试：signals 与主题检查在 Node 中运行，其余在真实浏览器中运行；CI 覆盖 Chromium、Firefox、WebKit。
- 体积预算：`npm run size`，core 约 10 KB（gzip），超出预算时 CI 失败。
- 性能基准：`npm run bench`，参照 js-framework-benchmark。
- 修复（核心审查）：
  - 同一轮里 effect 按创建顺序运行，外层先于它创建的内层：``when(user, () => html`${() => user.value.name}`)`` 在 `user` 变为 `null` 时不再报错。
  - 清理函数出错时只报告错误，effect、作用域和组件的其余资源照常运行 / 释放；effect 在自己运行途中被释放或暂停时，这次的清理函数立即执行。
  - effect 互相触发超过上限后，图中其他 effect 不再永久失效。
  - 函数或 `when` 返回的 `repeat(list, …)` 现在跟踪 `list` 的变化；行模板里创建的 effect 归这一行所有；某一行模板出错不再打乱整个列表。
  - 组件在 `render()` / `update()` 中把自己移出页面时，模板绑定正确暂停，不再调用 `mounted()`；`loop()` 在 tick 里暂停再恢复不再开出第二条帧循环。
  - Boolean 属性写 `default: true` 时给出警告（布尔 attribute 无法表达“默认为真”）。
- 修复：删除列表行时不再创建 `Range`。Range 在被回收前一直是“活的”，大量删除时会变成 O(n²)；
  清空 1,000 行从 197ms 降到 5ms，创建 10,000 行从 5.4s 降到 0.6s。
