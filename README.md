# Vunio

基于 **Web Components** 的风格化组件框架。不依赖 React / Vue，组件就是浏览器原生的自定义元素，可以直接写在 HTML 里，也能放进任何框架中使用。

```html
<demo-seal text="风花雪月"></demo-seal>
```

- **一次渲染，精确更新**：没有虚拟 DOM。数据变化时，只更新用到它的那一个文字节点或属性。
- **资源有主**：事件、计时器、动画、订阅都归组件所有，组件移除时自动释放。
- **零依赖、零构建**：直接用浏览器的 ES 模块运行。

> 当前进度：核心基类、响应式内核、响应式模板、古风与赛博两套主题（主题契约）、点击效果与天气、25 个组件、路由与文档站已完成；CI 覆盖三种浏览器引擎。详见 [路线图](docs/ROADMAP.md)。

## 快速开始

ES 模块不能用 `file://` 直接打开，需要一个本地服务器（开发脚本需要 Node 22+）：

```bash
npm install          # 只安装开发工具（Playwright、TypeScript、esbuild），框架本身零依赖
npm run dev          # 文档站   http://localhost:5173/site/
                     # 组件示例 http://localhost:5173/examples/
                     # 组件     http://localhost:5173/examples/components.html
                     # 设计系统 http://localhost:5173/examples/theme.html
npm test             # 测试（signals、主题检查在 Node 中运行，其余在浏览器中运行）
npm run check        # 提交前：类型检查 + 体积预算 + 全部测试（CI 跑的就是这些）
npm run build:theme  # 修改主题令牌后重新生成 CSS 和文档表格
npm run build:docs   # 修改组件 JSDoc 后重新生成文档站的 API 数据
npm run size         # 各入口打包压缩后的体积
npm run bench        # 性能基准
```

页面里引入主题：

```html
<html data-mode="auto">   <!-- day | night | auto（跟随系统） -->
<link rel="stylesheet" href="themes/guofeng.css" />
<link rel="stylesheet" href="themes/guofeng-fonts.css" />  <!-- 可选：网络字体 -->
```

## 写一个组件

> 纯 HTML 中没有打包工具时，把 `'vunio'` 换成相对路径（如 `'../src/index.js'`），或用 import map 映射。

```js
import { VunioElement, html, css, signal } from 'vunio';

export class DemoCounter extends VunioElement {
  static tag = 'demo-counter';

  // ① 属性：和 HTML attribute 自动同步，本身就是响应式的
  static props = {
    label: { type: String, default: '次数' },
    step: { type: Number, default: 1 },
  };

  // ② 样式：在 Shadow DOM 里，不会影响页面，也不会被页面影响
  static styles = css`
    button { font: inherit; }
  `;

  // ③ 内部状态：signal
  count = signal(0);

  // ④ 结构：只渲染一次；signal 和 () => 函数是“活的”，会自动更新
  render() {
    return html`
      <button @click=${this.increment}>
        ${() => this.label}：${this.count}
      </button>
    `;
  }

  // ⑤ 行为：事件处理函数里的 this 就是组件
  increment() {
    this.count.value += this.step;
  }
}

DemoCounter.define();
```

```html
<demo-counter label="点击" step="2"></demo-counter>
```

完整示例见 [`examples/`](examples/)：印章（属性 / 模板 / 动画）、题字输入框（表单）、水墨钟（自动清理）、诗笺（共享状态 / 列表 / 条件）、风花雪月（天气与点击效果）。

## 响应式

```js
import { signal, computed, effect, batch } from 'vunio';

const count = signal(0);                         // 可写的值
const double = computed(() => count.value * 2);  // 派生值：惰性、缓存
effect(() => console.log(double.value));         // 副作用：依赖变化时同步重新运行
batch(() => { count.value = 1; count.value = 2; }); // 合并写入，effect 只运行一次
```

- 菱形依赖无毛刺；computed 没有下游时自动退订上游，不会泄漏。
- 数组 / 对象按引用比较，修改时整体替换：`list.value = [...list.value, x]`。
- 组件里用 `this.effect(fn)`（写在 `mounted()` 中），组件移除时自动释放。

**共享状态**就是模块里的 signal，不需要额外的库：

```js
// stores/poems.js
export const poems = signal([]);
export const favorites = computed(() => poems.value.filter((p) => p.favorite));
export function addPoem(poem) {
  poems.value = [...poems.value, poem];
}
```

设计细节见 [RFC 0001](docs/rfc/0001-signals.md)。

## 模板

| 位置 | 写法 | 普通值 | signal | 函数 |
|---|---|---|---|---|
| 内容 | `<p>${v}</p>` | 显示 | 响应式 | 响应式 |
| 属性 | `title=${v}`、`class="a ${v}"` | 设置 | 响应式 | 响应式 |
| 布尔属性 | `?disabled=${v}` | 真则添加 | 响应式 | 响应式 |
| DOM 属性 | `.value=${v}` | 赋值 | 响应式 | 原样赋值 |
| 事件 | `@click=${fn}` | — | — | 监听函数，`this` 是组件 |

```js
html`
  ${when(() => this.open, () => html`<p>展开</p>`, () => html`<p>收起</p>`)}
  <ul>${repeat(this.items, (i) => i.id, (i) => html`<li>${i.name}</li>`)}</ul>
`;
```

- `repeat` 带 key 复用节点，重排时移动次数最少（最长递增子序列）。
- `when` 只在真假变化时切换分支，旧分支的订阅随之释放。
- 插值永远以文本写入，不会被当作 HTML，天然防 XSS（`unsafeHTML()` 除外）。
- 模板写错位置（比如在 `<textarea>` 里插值）会给出中文错误和改法。

设计细节见 [RFC 0002](docs/rfc/0002-templates.md)。

## 主题：古风与赛博

组件只描述结构和行为，风格全部来自主题。换一个 CSS 文件，同一套组件就换了一种气质：

```html
<link rel="stylesheet" href="themes/guofeng.css" />   <!-- 古风：宣纸、墨分五色、一点朱砂（默认昼） -->
<link rel="stylesheet" href="themes/cyber.css" />     <!-- 赛博：霓虹、硬边、扫描线（默认夜） -->
<html data-mode="auto">                               <!-- 昼夜：day | night | auto -->
```

- **主题契约**：每套主题都提供同一份变量，名字描述用途而不是风格（`--vn-font-display`、`--vn-ease-enter`、`--vn-mask-stamp`……）。
  构建脚本检查每套主题是否完整，组件源码是否只用了契约里的变量。见 [RFC 0006](docs/rfc/0006-theme-contract.md)。
- **对比度**：两套主题 × 昼夜两种模式，每种 24 组颜色搭配全部满足 WCAG AA，由测试保证；axe 审计覆盖两套主题。
- **令牌是数据**：`themes/*.tokens.js` 是唯一来源，CSS、字体样式表和设计文档的表格都由它生成。
- **效果也随主题**：按钮不写 `effect` 时，古风按下是墨晕，赛博按下是故障。
- **减少动态效果**：用户开启后，主题把所有动效时长变为 1ms。

设计说明见 [古风](docs/design/guofeng.md)、[赛博](docs/design/cyber.md)；文档站右上角可以现场切换。

## 组件

```html
<script type="module">import 'vunio/components';</script>

<vn-heading level="1" seal="雅" sub="苏轼">水调歌头</vn-heading>
<vn-card variant="frame">
  <span slot="title">题诗</span>
  <form>
    <vn-input name="line" label="名句" required maxlength="20"></vn-input>
    <vn-select name="season" label="时节"><option value="autumn">秋</option></vn-select>
    <vn-checkbox name="public" checked>公开</vn-checkbox>
    <vn-button type="submit" variant="cinnabar" effect="blossom">落笔</vn-button>
  </form>
</vn-card>
```

| 组件 | 说明 |
|---|---|
| `vn-button` | 墨 / 朱砂 / 月白 / 素四种；点击效果随主题（墨晕 / 故障），可选落花、飞雪、风叶、电火花；可提交、重置表单 |
| `vn-heading` | 1–3 级用展示字体（古风为毛笔字）；可盖印、加副标题、竖排 |
| `vn-card` | 纸片 / 古籍双线框 / 留白；标题、操作、底部插槽 |
| `vn-stack` | 纵横排列，间距取自主题 |
| `vn-divider` | 两头尖的笔触线，可在中间写字；也可竖向 |
| `vn-loading` | 墨滴入水的涟漪 |
| `vn-input` | 信笺式下划线，聚焦时笔触展开；中文校验信息；字数统计、清除 |
| `vn-select` | 原生 `<option>` 写选项；面板在顶层不被裁切；完整键盘与读屏支持 |
| `vn-checkbox` | 朱批勾一笔画出 |
| `vn-switch` | 玉璧滑块；`variant="moon"` 时为日月 |
| `vn-modal` | 基于原生 `<dialog>` 的立轴，打开时向上下展开 |
| `toast()` | 带小印的消息：讯 · 成 · 慎 · 误 |
| `confirm()` | 确认框：`await confirm({ heading, message, danger })` 返回 true / false |
| `vn-sky` | 风、花、雪、雨天气背景，可加一轮月亮 |
| `vn-tag` | 标签：六种颜色，可移除 |
| `vn-progress` | 进度：主题的线条逐渐写满；不确定进度来回游走 |
| `vn-breadcrumb` | 面包屑：最后一项是当前页 |
| `vn-tabs` | 标签页：方向键切换，当前标签下的线滑过去 |
| `vn-pagination` | 分页：长列表折叠为省略号 |
| `vn-textarea` | 多行输入：与输入框相同的校验与字数统计，可随内容长高 |
| `vn-radio-group` | 单选：Tab 只停在选中项，方向键移动并选中 |
| `vn-slider` | 滑块：拖、点、方向键 / PageUp / Home / End |
| `vn-tooltip` | 提示：悬停或聚焦时显示，文字同时给读屏 |
| `vn-drawer` | 抽屉：从任一边缘滑出，行为与弹窗一致 |
| `vn-collapse` | 折叠面板：原生 details，可设为手风琴 |
| `vn-timeline` | 时间线：圆点或小印 |

所有表单组件直接放进原生 `<form>`，支持 `FormData`、`reset`、`<fieldset disabled>` 和校验；键盘与读屏遵循 WAI-ARIA APG。完整 API 见 [RFC 0004](docs/rfc/0004-components.md)、[RFC 0007](docs/rfc/0007-components-2.md) 与文档站，效果见 `examples/components.html`。

## 效果

```js
import { burst, registerBurst } from 'vunio';
burst('blossom', layer, { x, y, animate: this.animate.bind(this) });
// 古风：墨晕 ink · 落花 blossom · 飞雪 snow · 风叶 wind　赛博：故障 glitch · 电火花 spark
registerBurst('heart', { layer: 'fx', run(layer, ctx) { /* … */ } }); // 之后 <vn-button effect="heart">
```

```html
<section style="position: relative">
  <vn-sky weather="blossom" moon></vn-sky>   <!-- snow | blossom | wind | rain | none -->
</section>
```

颜色来自主题；开启“减少动态效果”时粒子不播放；`<vn-sky>` 离开视口自动暂停、按 DPR 绘制。设计见 [RFC 0003](docs/rfc/0003-effects.md)。

## 路由

```js
import { createRouter, html, render } from 'vunio';

const router = createRouter({
  routes: [
    { path: '/', view: () => html`<h1>首页</h1>` },
    { path: '/poems/:id', title: (p) => `第 ${p.id} 首`, view: ({ params }) => html`<h1>${params.id}</h1>` },
    { path: '/guide/*', load: () => import('./guide.js') },
  ],
});
router.start();
render(html`<main>${router.outlet()}</main>`, document.body);
```

当前路由是一个 signal；默认 hash 模式，放在静态托管上就能用。换页后设置标题、恢复滚动、把焦点移到新页面的主标题。
搜索、筛选、翻页用 `router.setQuery({ q, page })`：只改查询参数，不滚动、不抢焦点。设计见 [RFC 0005](docs/rfc/0005-router.md)。

## 示例应用：诗笺

`examples/app/` 是一个用 Vunio 写成的完整小应用：诗作列表（搜索、标签筛选、分页，条件都在地址栏里）、详情（标签页）、新建与修改（表单）、
收藏、设置（主题、昼夜、字号）。数据存在 localStorage。它只用到框架公开的 API，可以当作项目的起点来读。

```
examples/app/
  index.html    页面骨架与样式
  app.js        布局 + 路由出口
  router.js     路由表（页面按需加载）
  store.js      数据：signal + computed + 写操作函数，自动存进 localStorage
  pages/        列表、详情、新建 / 修改、收藏、设置
```

## 文档站

`site/` 是用 Vunio 自己写成的文档站：首页、指南、设计系统，以及每个组件的现场演示和 API 表。组件的 API 表由源码头部的 JSDoc 生成（`npm run build:docs`），测试会检查它和源码一致。

## 生命周期

```
constructor          创建 Shadow DOM，挂上共享样式
   ↓
connectedCallback    首次：render() → 模板绑定进入“渲染作用域”
   ↓                 再次：恢复渲染作用域，补上离开期间错过的变化
   ↓                 每次：update(全部) → mounted()
属性变化              模板绑定立即更新；同一微任务内合并调用一次 update(changed)
   ↓
disconnectedCallback 暂停渲染作用域（不再被全局状态引用）、释放 this.effect、
                     解绑事件、停止 loop/timeout/observer/动画 → unmounted()
```

| 钩子 | 什么时候调用 | 写什么 |
|---|---|---|
| `render()` | 首次挂载，只一次 | 返回 `html`…`` |
| `mounted()` | 每次插入文档 | `this.effect()`、`this.loop()`、`this.on()` |
| `update(changed)` | 挂载时一次，之后每次属性变化 | 可选：画布绘制等命令式工作 |
| `unmounted()` | 每次移出文档 | 一般不用写，资源已自动清理 |

## 属性

```js
static props = {
  label: String,                                                  // 简写
  size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] }, // 枚举，写错回退默认值并警告
  count: { type: Number, default: 0 },
  open: Boolean,                                                  // 有 attribute 即为 true
  maxLength: Number,                                              // ↔ max-length
  items: { type: Array, default: () => [] },                      // 只在 JS 属性上
};
```

- `String` / `Number` / `Boolean`：**attribute 是唯一真相**。`el.size = 'lg'` 等于 `el.setAttribute('size', 'lg')`。
- `Array` / `Object`（或 `attribute: false`）：只存在 JS 属性上，重新赋值才会触发更新。
- 未指定 `default` 时：String → `''`，Number → `0`，Boolean → `false`，其他 → `null`。
- 每个属性由 signal 承载：在模板中写 `${() => this.label}`，在 computed / effect 中直接读 `this.label`。
- 不要声明与属性同名的类字段（`label = ''`），会遮住生成的 getter/setter。

## 基类工具（自动清理）

| 方法 | 说明 |
|---|---|
| `effect(fn)` | 响应式副作用，移除时自动释放 |
| `on(target, type, handler, options?)` | 绑定事件，移除时自动解绑；`handler` 里 `this` 是组件 |
| `timeout(fn, ms)` | setTimeout，移除时自动取消 |
| `loop((dt, now) => {})` | 每帧回调，返回 `{ pause, resume, stop }`；回调返回 `false` 停止 |
| `observeResize / observeIntersection / observeMutation` | 对应的 Observer，移除时自动断开 |
| `animate(el, keyframes, options)` | Web Animations，移除时自动取消；“减少动态效果”时直接到终点 |
| `onCleanup(fn)` | 注册任意清理函数 |
| `emit(type, detail)` | 派发事件（冒泡、穿透 Shadow DOM、可取消），返回是否未被取消 |
| `setState(name, on)` / `hasState(name)` | 自定义状态，CSS 用 `:host(:state(name))` |
| `watchSlot(name, callback?)` | 监听插槽有无内容，自动设置 `:state(has-name)` |
| `refs` / `$()` / `$$()` | 访问 Shadow DOM 里的元素 |
| `internals` | `ElementInternals`，用于 ARIA（`internals.role`）和表单 |
| `prefersReducedMotion` | 用户是否开启“减少动态效果” |
| `updateComplete` | 等待挂起的 `update()` 完成 |

## 表单控件：`VunioFormElement`

继承它的组件能直接放进原生 `<form>`：

```html
<form>
  <demo-field name="title" label="题目" value="水调歌头" required></demo-field>
  <button>提交</button>
</form>
```

- `name` / `disabled` / `required` 已内置，`value` 语义和原生 `<input>` 一致（attribute 是默认值）
- 提交时进入 `FormData`；支持 `form.reset()`、`<fieldset disabled>`、`checkValidity()`、`setCustomValidity()`
- `value`、`userInvalid`、`validationMessage`、`isDisabled` 都是响应式的，错误提示直接写进模板：
  `${() => (this.userInvalid ? this.validationMessage : '')}`
- 交互过且无效时带上 `:state(user-invalid)`，避免一进页面就满屏报错
- 子类可覆盖：`formValue()`、`isEmpty()`、`validate()`、`validationAnchor`、`resetValue()`

## 目录

```
src/
  index.js               入口
  core/index.js          核心入口（组件从这里导入）
  core/element.js        VunioElement 基类
  core/form-element.js   VunioFormElement 表单基类
  core/signals.js        响应式内核
  core/template.js       响应式模板：html / svg / when / repeat / render
  core/props.js          属性 ↔ attribute ↔ signal
  core/styles.js         共享样式表
  effects/               点击效果 burst、天气粒子
  router/                路由
  components/            组件（import 'vunio/components' 注册全部）
site/                    文档站（用 Vunio 写成）
themes/
  base.js                主题契约、共享尺度、对比度规则、defineTheme
  guofeng.tokens.js      古风主题令牌（唯一来源）
  cyber.tokens.js        赛博主题令牌
  *.css / *-fonts.css    生成的主题 CSS 与可选的网络字体
scripts/
  serve.js               本地服务器
  build-theme.js         生成各主题的 CSS、刷新文档表格，检查契约与对比度
  build-docs.js          从组件 JSDoc 生成文档站 API 数据
  size.js                体积报告与预算
bench/                   性能基准（npm run bench）
.github/workflows/ci.yml CI：类型检查、体积预算、测试
examples/                示例组件、store、组件示例页、设计系统展示页
tests/                   测试（signals、主题检查在 Node 中，其余在浏览器中）
docs/
  ROADMAP.md             设计原则、里程碑、验收标准
  COMPONENT_SPEC.md      组件规范（也是给 AI 的提示词）
  rfc/                   框架设计文档
  design/                古风、赛博两套设计系统
```

## 性能与体积

`npm run bench` 参照 [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) 的操作集，
每项计入脚本、样式计算和布局的时间，7 次取中位数（无头 Chromium 141，云端容器；绝对值随机器变化，适合用来比较改动前后）：

| 操作 | 耗时 (ms) |
|---|---:|
| 创建 1,000 行 | 67.2 |
| 替换全部 1,000 行 | 53.2 |
| 每 10 行更新一行 | 9.2 |
| 选中一行（高亮） | 0.5 |
| 交换两行 | 3.0 |
| 删除一行 | 3.3 |
| 创建 10,000 行 | 580.9 |
| 向 1,000 行追加 1,000 行 | 50.2 |
| 清空 1,000 行 | 5.6 |
| 1000 层 computed 链 × 100 次更新 | 12.8 |
| 1 个 signal → 1000 个 effect × 100 次 | 9.4 |

“选中一行”只改一个 signal：每行的 `class` 绑定重新求值，但只有新旧两行真正写入 DOM；“交换两行”按最长递增子序列计算，只移动这两行的节点。

`npm run size` 用 esbuild 打包压缩每个入口；CI 中超出预算会失败：

| 入口 | 压缩后 | gzip | brotli |
|---|---:|---:|---:|
| `vunio/core`（Signals · 模板 · 组件基类） | 29.7 KB | 10.5 KB | 9.6 KB |
| `vunio/router`（不含 core） | 5.4 KB | 2.5 KB | 2.2 KB |
| `vunio/effects`（不含 core，六种点击效果 + 四种天气） | 10.8 KB | 4.0 KB | 3.6 KB |
| `vunio`（以上全部） | 45.9 KB | 16.5 KB | 14.8 KB |
| `vunio/components`（25 个组件，含 core） | 130.3 KB | 35.1 KB | 29.1 KB |

## 浏览器支持

依赖 Custom Elements、Shadow DOM、`adoptedStyleSheets`、`ElementInternals`、`:state()`：
Chrome / Edge 125+、Safari 17.4+、Firefox 126+。CI 在 Chromium、Firefox、WebKit 三种引擎中运行全部测试。
Firefox 不支持对 `::backdrop` 做 Web Animations，弹窗的遮罩在 Firefox 中没有淡入淡出。

## 用 AI 生成组件

把 [`docs/COMPONENT_SPEC.md`](docs/COMPONENT_SPEC.md) 发给 Gemini / Claude，再描述你要的组件，
得到的会是符合 Vunio 规范、可复用的组件，而不是一次性的 HTML 页面。
