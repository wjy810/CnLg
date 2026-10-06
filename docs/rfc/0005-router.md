# RFC 0005：路由与文档站

- 状态：已实现
- 依赖：[RFC 0001 Signals](0001-signals.md) · [RFC 0002 模板](0002-templates.md)

## 1. 目标

- 一个小而完整的客户端路由：当前路由就是一个 signal，页面用模板渲染，切换时只更新变化的部分。
- 支持静态托管：默认 hash 模式（`#/components/button`），不需要服务器配合；也支持 history 模式。
- 用 Vunio 自己搭一个文档站，检验整个框架。

**非目标**：嵌套路由的布局系统、数据预取、服务端渲染。

## 2. API

```js
import { createRouter, html } from 'vunio';

const router = createRouter({
  mode: 'hash',                       // 'hash'（默认）| 'history'
  base: '',                           // history 模式下的路径前缀
  routes: [
    { path: '/', title: 'Vunio', view: () => html`<home-page></home-page>` },
    { path: '/components/:name', title: (p) => `${p.name} · 组件`, view: ({ params }) => html`…${params.name}…` },
    { path: '/guide/*', load: () => import('./guide.js') },   // 懒加载：模块的 default 导出是 view
  ],
  notFound: () => html`<p>此页不存在</p>`,
});

router.start();                       // 开始监听地址变化（history 模式下还会接管站内链接）

router.route.value;                   // { path, params, query, hash, def }，是响应式的
router.navigate('/components/button');
router.navigate('/search?q=月', { replace: true });
router.href('/components/button');    // 按模式生成链接：'#/components/button'
router.isActive('/components', { exact: false });   // 响应式，给导航高亮用

html`<main>${router.outlet()}</main>`;  // 渲染当前路由的视图
router.stop();
```

### 2.1 路径匹配

| 写法 | 匹配 | 参数 |
|---|---|---|
| `/components` | 只匹配 `/components` | — |
| `/components/:name` | `/components/button` | `{ name: 'button' }` |
| `/docs/*` | `/docs/a/b` | `{ '*': 'a/b' }` |

- 末尾斜杠忽略，`/a/` 等于 `/a`；参数自动 `decodeURIComponent`。
- 多条规则都能匹配时，按**具体程度**选择：静态段 > 参数段 > 通配符，与书写顺序无关。
- 查询串解析为 `query` 对象（重复的键取最后一个）。

### 2.2 视图

- `view(ctx)` 返回模板，`ctx = { params, query, path }`。
- `load()` 返回模块，用模块的 `default`（函数）作为 view。加载期间 `outlet()` 显示 `loading`（可配置，默认 `<vn-loading>`）；加载失败显示错误。同一模块只加载一次。
- `title` 可以是字符串或 `(params) => string`，切换后设置 `document.title`。

### 2.3 导航行为

- `navigate()` 写入历史记录，`replace: true` 时替换。
- history 模式下 `start()` 会接管站内 `<a>` 的点击：同源、无 `target`、无 `download`、未按修饰键、链接在 `base` 之下。
- 新页面滚动到顶部；地址带 `#锚点`（history 模式）时滚动到对应元素；前进 / 后退时恢复之前的滚动位置。
- hash 模式下，不以 `#/` 开头的 hash（如 `<a href="#section">`）是页内锚点：滚动并聚焦到该元素，地址栏还原为当前路由，不产生新的历史记录。
- 切换后把焦点移到页面的主标题（`outlet()` 容器内第一个 `h1` 或 `[role=heading]`），读屏用户能感知到页面变了。

## 3. 文档站

`site/` 是一个用 Vunio 写成的单页应用：

- 布局：顶部（字标、导航、昼夜切换）、左侧目录、正文、页脚；窄屏时目录收进抽屉。
- 页面：首页（`vn-sky` 落花与月）、快速开始、响应式、模板、组件开发、设计系统、每个组件一页、404。
- **组件 API 来自源码**：`scripts/build-docs.js` 读取 `src/components/*.js` 头部 JSDoc 的 `@attr` / `@slot` / `@fires` / `@csspart`，生成 `site/data/api.js`。测试会检查它是否最新，文档不会和代码脱节。
- 每个组件页有现场演示，演示下方是可复制的源码。

## 4. 测试计划

- 匹配（Node）：静态 / 参数 / 通配符、具体程度排序、末尾斜杠、解码、查询串。
- 路由（浏览器）：hash 与 history 两种模式的导航、前进后退、链接接管（含修饰键和外链不接管）、懒加载与加载中状态、404、标题、`isActive`、焦点移动。
- 文档站：每个页面都能打开且没有控制台错误；`site/data/api.js` 是最新的。
