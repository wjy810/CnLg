# RFC 0007：第二批组件

- 状态：已实现
- 依赖：[RFC 0004 第一批组件](0004-components.md) · [RFC 0006 主题契约](0006-theme-contract.md) · [组件规范](../COMPONENT_SPEC.md)

## 1. 目标

第一批 12 个组件够搭一个表单和一张卡片，还不够搭一个网站。这一批补齐**导航、选择、反馈、叙事**四类最常用的组件，
让文档站、博客、后台这类站点不必再手写结构。

共同要求（在 RFC 0004 第 1 节之外）：

- **只用契约变量**：每个组件在古风、赛博两套主题、昼夜两种模式下都要成立，测试与 axe 审计覆盖全部组合。
- **键盘与读屏照 WAI-ARIA APG**：每个组件写明遵循的模式，测试覆盖其中的每一个按键。
- **复合组件用子元素表达结构**：`<vn-tabs>` 里放 `<vn-tab-panel>`，而不是传一个数组。HTML 里写得出来，服务端也渲染得出来。
- **跨 Shadow DOM 的读屏关联**：ARIA 的 id 引用不能穿过 Shadow DOM。需要“描述”关系的组件（提示）把文字写在被描述元素的
  `aria-description` 上；需要“控制 / 标签”关系的组件，把相关的元素放在同一个 Shadow 根里。

## 2. 组件一览

### 导航

#### `vn-tabs` · `vn-tab-panel` 标签页

```html
<vn-tabs value="spring" label="四时">
  <vn-tab-panel name="spring" label="春">春眠不觉晓</vn-tab-panel>
  <vn-tab-panel name="autumn" label="秋">停车坐爱枫林晚</vn-tab-panel>
</vn-tabs>
```

| 成员 | 说明 |
|---|---|
| `value` | 当前标签的 `name`；默认第一个 |
| `label` | 标签列表的读屏名称 |
| `vn-tab-panel[name, label, disabled]` | 一页内容；`label` 是标签上的文字 |
| 事件 `vn-change` | `detail.value` |

APG「Tabs（自动激活）」：← → 切换并激活、Home / End、Tab 进入面板。标签列表、标签、面板（`tablist` / `tab` / `tabpanel`）
在 `vn-tabs` 自己的 Shadow 根里，面板内容通过具名插槽投进来，所以 `aria-controls` / `aria-labelledby` 都在同一棵树内。
当前标签下面有一道 `--vn-mask-stroke` 的线，切换时滑过去（`--vn-ease-move`）。

#### `vn-breadcrumb` · `vn-breadcrumb-item` 面包屑

```html
<vn-breadcrumb>
  <vn-breadcrumb-item href="/">首页</vn-breadcrumb-item>
  <vn-breadcrumb-item href="/poems">诗集</vn-breadcrumb-item>
  <vn-breadcrumb-item>静夜思</vn-breadcrumb-item>
</vn-breadcrumb>
```

`nav[aria-label=面包屑]` + 列表。最后一项是当前页：不是链接，带 `aria-current="page"`。分隔符由每一项自己画（第一项除外），可用
`separator` 属性换成别的字符（默认 `/`）。

#### `vn-pagination` 分页

```html
<vn-pagination total="230" page-size="10" page="3"></vn-pagination>
```

| 成员 | 说明 |
|---|---|
| `total` · `page-size` · `page` | 总条数 · 每页条数（默认 10）· 当前页（从 1 开始） |
| `siblings` | 当前页两侧显示的页码数，默认 1；其余折叠为 `…` |
| 事件 `vn-change` | `detail.page` |

`nav[aria-label=分页]`；当前页 `aria-current="page"`；上一页 / 下一页在两端时禁用。页码是按钮，不是链接（需要链接时监听 `vn-change` 自己跳转）。

### 选择

#### `vn-radio-group` · `vn-radio` 单选（表单控件）

```html
<vn-radio-group name="season" label="时节" value="autumn" required>
  <vn-radio value="spring">春</vn-radio>
  <vn-radio value="autumn">秋</vn-radio>
  <vn-radio value="winter" disabled>冬</vn-radio>
</vn-radio-group>
```

值在组上（`VunioFormElement`）：进 `FormData`、`reset` 回到初始值、`required` 校验、`<fieldset disabled>`。
APG「Radio Group」：组内只有一个可聚焦的选项（roving tabindex），↑ ↓ ← → 移动并选中，跳过禁用项。
外观：古风是一枚圆印，选中时朱砂一点落下；赛博是方框里亮起一格。`direction="row"` 横排。

#### `vn-textarea` 多行输入（表单控件）

与 `vn-input` 相同的标签、提示、校验、字数统计；`rows`（默认 3）；`autosize` 时随内容长高（`field-sizing: content`，不支持时用 JS 计算）。

#### `vn-slider` 滑块（表单控件）

```html
<vn-slider name="volume" label="音量" min="0" max="100" step="5" value="40"></vn-slider>
```

`role="slider"` + `aria-valuenow / min / max / valuetext`。键盘：← ↓ 减、→ ↑ 加、PageUp / PageDown 十步、Home / End。
指针：在轨道上按下即跳到该处，拖动时用指针捕获。轨道是一道 `--vn-mask-stroke`，已选部分填强调色；滑块在古风里是一枚玉璧，在赛博里是一块发光的方片（都来自变量）。
事件：`input`（拖动中）与 `change`（松手 / 键盘），与原生 `<input type=range>` 一致。

### 反馈

#### `vn-tooltip` 提示

```html
<vn-tooltip content="收入诗笺"><vn-button>藏</vn-button></vn-tooltip>
```

悬停 300ms 或聚焦时显示，Esc、移开、失焦时隐藏；`placement="top|bottom|left|right"`（默认 top，空间不够时翻到对侧）。
浮层放在顶层（Popover API），不会被裁切。文字同时写在被包裹元素的 `aria-description` 上（见第 1 节），读屏用户聚焦时就能听到。
提示只放补充信息：触屏设备没有悬停，必要的信息不能只写在提示里。

#### `vn-tag` 标签

```html
<vn-tag>五言</vn-tag> <vn-tag type="accent">名篇</vn-tag> <vn-tag closable>李白</vn-tag>
```

`type`：`default` · `accent` · `success` · `warning` · `danger` · `info`。`closable` 时末尾有关闭按钮（`aria-label="移除 标签文字"`），点击派发可取消的 `vn-close`，没被取消就移除自己。

#### `vn-progress` 进度

```html
<vn-progress value="0.6" label="研墨"></vn-progress>
<vn-progress label="加载中"></vn-progress>   <!-- 没有 value：不确定进度 -->
```

`role="progressbar"`，`value` 为 0–1。确定进度时是一道逐渐写满的笔触（古风）/ 分段亮起的灯条（赛博），都来自 `--vn-mask-stroke`；
不确定时一小段来回游走，减少动态效果时改为静止的半满。

#### `vn-drawer` 抽屉

```html
<vn-drawer heading="目录" placement="right" id="toc">…</vn-drawer>
```

与 `vn-modal` 相同的成员（`heading`、`open`、`persistent`、`show()`、`close()`、`vn-open` / `vn-close`），只是从边缘滑出：
`placement="left|right|top|bottom"`。两者共用一个基于 `<dialog>` 的基类，焦点、Esc、遮罩、返回原焦点的行为完全一致。

### 叙事

#### `vn-collapse` · `vn-collapse-item` 折叠面板

```html
<vn-collapse accordion>
  <vn-collapse-item heading="作者" open>李白，字太白</vn-collapse-item>
  <vn-collapse-item heading="出处">《李太白集》</vn-collapse-item>
</vn-collapse>
```

每一项是原生 `<details>` / `<summary>`（键盘、读屏、页内查找都由浏览器负责）。`accordion` 时同一时间只展开一项。
展开收起有高度动画，减少动态效果时直接切换。事件 `vn-toggle`（`detail.open`）。

#### `vn-timeline` · `vn-timeline-item` 时间线

```html
<vn-timeline>
  <vn-timeline-item time="开元十八年" seal="游">初入长安</vn-timeline-item>
  <vn-timeline-item time="天宝元年" seal="仕" type="accent">供奉翰林</vn-timeline-item>
</vn-timeline>
```

列表语义（`list` / `listitem`）。左侧一道竖线，每一项一个圆点或一方小印（`seal`，用 `--vn-mask-stamp`）；`type` 同 `vn-tag`。

## 3. 测试计划

- 每个组件：属性 → 外观与读屏属性、APG 中列出的每一个按键、事件、表单行为（表单控件）、移除后无残留。
- 两套主题：整个浏览器测试集在 `THEME=cyber` 下再跑一遍（CI 已有）；axe 审计的组件页包含全部新组件。
- 文档站：每个组件一页，API 表格由 JSDoc 生成。
