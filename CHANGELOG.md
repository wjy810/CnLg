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
- 修复：删除列表行时不再创建 `Range`。Range 在被回收前一直是“活的”，大量删除时会变成 O(n²)；
  清空 1,000 行从 197ms 降到 5ms，创建 10,000 行从 5.4s 降到 0.6s。
