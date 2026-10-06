# RFC 0002：响应式模板

- 状态：已实现
- 依赖：[RFC 0001 Signals](0001-signals.md)

## 1. 背景

M0 的 `html` 只是拼接字符串，结构写在 `render()` 里，数据同步写在 `update()` 里，两处要手动对应。列表、条件渲染都要自己操作 DOM。

目标：**在模板里直接写出“这里显示什么”**，数据变化时框架只更新受影响的那个节点。

**非目标**：虚拟 DOM、编译器 / 构建步骤、JSX、服务端渲染（M8 再议）。

## 2. 写法一览

```js
render() {
  return html`
    <button
      class="btn ${() => this.variant}"
      ?disabled=${() => this.disabled}
      .title=${this.tip}
      @click=${this.handleClick}
    >
      已点 ${this.count} 次
    </button>

    ${when(() => this.count.value > 3, () => html`<p>够了</p>`, () => html`<p>继续</p>`)}

    <ul>
      ${repeat(this.poems, (p) => p.id, (p) => html`<li>${p.title}</li>`)}
    </ul>
  `;
}
```

## 3. 绑定位置与值

| 位置 | 写法 | 普通值 | signal | 函数 |
|---|---|---|---|---|
| 内容 | `<p>${v}</p>` | 显示 | **响应式** | **响应式**（作为表达式求值） |
| 属性 | `title=${v}` / `class="a ${v} b"` | `setAttribute` | **响应式** | **响应式** |
| 布尔属性 | `?disabled=${v}` | 真则添加，假则移除 | **响应式** | **响应式** |
| DOM 属性 | `.value=${v}` | `el.value = v` | **响应式** | 原样赋值（函数也可能就是要传的值） |
| 事件 | `@click=${fn}` | 绑定监听 | — | 监听函数，`this` 指向组件 |

**规则只有一条：signal 和函数是“活的”，其他值是“死的”。** 例外是 `.prop` 和 `@event`，因为这两个位置本来就可能需要传函数；要让 `.prop` 响应式，传 signal 或 `computed`。

### 3.1 内容位置的值
| 值 | 结果 |
|---|---|
| `null` / `undefined` / `false` / `''` | 什么都不显示 |
| 字符串、数字 | 文本节点（用 `textContent`，永远不会被当作 HTML） |
| `html``…`` ` | 嵌套模板；与上次是同一个模板时原地更新，不重建 |
| 数组 / 可迭代对象 | 依次渲染，按位置复用 |
| `repeat(...)` | 带 key 的列表 |
| DOM 节点 | 直接插入 |
| `unsafeHTML(str)` | 作为 HTML 解析插入（只用于可信内容） |

### 3.2 属性位置的值
- `null` / `undefined` → 移除属性；`false` → 字符串 `"false"`（`aria-*` 需要它）。要“假则移除”请用 `?attr`。
- `class` 接受对象 `{ active: true, dim: false }` 或数组 `['a', cond && 'b']`。
- `style` 接受对象 `{ color: 'red', '--size': '12px' }`。

## 4. 指令

| 指令 | 作用 |
|---|---|
| `when(cond, then, otherwise?)` | 条件渲染。只在条件的**真假**变化时切换分支，切换时释放旧分支的全部订阅 |
| `repeat(items, key, template)` | 带 key 的列表。`items` 可以是数组、signal 或函数 |
| `unsafeHTML(str)` | 插入原始 HTML |

还有一个 `svg` 标签，用于单独写 SVG 片段（`svg``<circle r="4" />`` `），`<svg>` 里面直接写就不需要它。

## 5. 全局 `render`

模板也可以脱离组件使用：

```js
import { html, render, signal } from 'vunio';
const name = signal('李白');
render(html`<p>你好，${name}</p>`, document.body);
```

返回一个作用域，`dispose()` 后停止所有绑定。对同一个容器再次 `render` 会原地更新。

## 6. 实现

### 6.1 编译（每个模板只做一次）
`html` 的 `strings` 数组在同一处代码每次调用时是同一个对象，以它为键缓存编译结果。

1. **扫描**：逐字符扫描 `strings`，用一个小状态机判断每个插值处于什么上下文：文本、标签内、属性值（双引号 / 单引号 / 无引号）、注释、`<style>` / `<script>` / `<textarea>` / `<title>` 内部。
2. **打标记**：
   - 文本位置 → 写入注释 `<!--vn:-->`；
   - 属性位置 → 把整个属性从 HTML 中删除，在元素上加一个 `data-vn` 标记，记下属性名（保留原始大小写，SVG 的 `viewBox` 需要）、前缀类型、静态片段；
   - 注释内 → 忽略；其他位置 → 抛出错误并说明正确写法。
3. **解析**：结果放进 `<template>` 由浏览器解析一次。
4. **定位**：用 TreeWalker 遍历，把每个绑定换算成“第几个节点”。如果找到的标记数量不对（例如 HTML 结构错误导致解析器丢弃了节点），抛出错误。

### 6.2 实例化（每次渲染）
1. `importNode` 克隆模板内容；
2. 同样的 TreeWalker 顺序找到每个绑定节点，创建对应的绑定对象（Part）；
3. 把值交给各个 Part，然后一次性插入文档。

### 6.3 Part
| Part | 负责 |
|---|---|
| ChildPart | 一段内容，用一对注释节点圈定范围，管理文本 / 模板 / 列表 / 节点之间的切换 |
| AttributePart | 一个属性，可能有多段插值，任一段是响应式时整体放进一个 effect |
| BooleanAttributePart | `?attr` |
| PropertyPart | `.prop` |
| EventPart | `@event`，只注册一次监听，换函数时只换引用 |

值与上次**引用相同**时直接跳过。值是 signal 或函数时创建一个 effect，effect 只负责“取值”，取到的值在 `untrack` 中提交，避免提交过程中的读取被误认为依赖。

### 6.4 作用域
每段动态内容（嵌套模板、列表的每一项、条件分支）都有自己的作用域，作用域的父级是所在模板实例的作用域，而**不是**负责取值的那个 effect。这样 effect 重新运行时不会误删仍然有效的内容；内容被替换或删除时，释放它的作用域就释放了其中所有订阅。

### 6.5 列表 diff
- **无 key（数组）**：按位置复用，多出的删除，不足的追加。
- **有 key（`repeat`）**：
  1. 新列表中不存在的旧 key → 释放并删除；
  2. 对仍存在的项，计算它们旧位置序列的**最长递增子序列**，这些项不用动；
  3. 从后往前遍历新列表：新项创建插入，不在子序列中的旧项移动，item 或位置变化的项原地更新。
     行模板函数本身换了（例如 `repeat` 写在函数绑定里，外层重新求值时产生了新闭包）时，所有仍存在的行都用新模板原地更新，不会留着旧闭包。
  4. 行模板在这一行自己的作用域里运行（其中创建的 effect 归这一行所有，行删除时释放）；某一行模板出错时报告错误并保留这一行原来的内容，其余行照常协调。

  移动次数是理论最少值。例如 `A B C D → D A B C` 只移动 D 一次。重复的 key 会在控制台警告并按新项处理。

## 7. 安全
所有插值都通过 `textContent`、`setAttribute`、属性赋值写入，**不经过 HTML 解析**。唯一的例外是显式调用 `unsafeHTML`。

## 8. 限制
- 不支持在标签名、属性名中插值（`<${tag}>`、`data-${k}=`）。
- 不支持在 `<style>`、`<script>`、`<textarea>`、`<title>` 内插值：样式写在 `static styles`；`<textarea>` 用 `.value=${v}`。
- 自定义元素不能自闭合：写 `<vn-icon></vn-icon>`，不要写 `<vn-icon />`（这是 HTML 解析规则）。
- `data-ref` 只对模板中静态存在的元素有效；条件分支里的元素请在分支内用事件或查询获取。

## 9. 与组件集成
- `render()` 返回 `html`…`` 时走响应式模板；返回字符串时按旧方式写入（兼容 M0）。
- 事件处理函数中的 `this` 是组件，所以 `@click=${this.handleClick}` 不需要 `bind`。
- `update(changed)` 仍然可用，适合画布绘制这类命令式的工作。

## 10. 测试计划
浏览器测试（`tests/template.test.js`）：

- 五种绑定位置 × 普通值 / signal / 函数
- 属性多段插值、`null` 移除、`false` 保留、`class` / `style` 对象
- 嵌套模板：同模板原地更新（节点不变），不同模板替换
- 无 key 数组；`repeat` 的增、删、重排保留节点身份，并统计 DOM 移动次数
- `when` 切换后旧分支的订阅被释放（signal 的订阅者数量归零）
- `unsafeHTML`、`svg`、SVG 属性大小写
- XSS：字符串里的 `<script>` 以文本显示
- 错误提示：`<textarea>` 内插值、标签内插值
- 组件：模板读取属性自动更新；移出页面后全局 signal 不再持有组件；移回后补上期间的变化
- 表格：`<tbody>` 中的 `repeat`
