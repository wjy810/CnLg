import { html } from '../../src/index.js';
import { code, pager } from '../ui/page.js';

const TOOLS = [
  ['effect(fn)', '响应式副作用，组件移除时自动释放'],
  ['on(target, type, handler)', '绑定事件，移除时自动解绑；handler 里 this 是组件'],
  ['timeout(fn, ms)', 'setTimeout，移除时自动取消'],
  ['loop((dt, now) => {})', '每帧回调，返回 { pause, resume, stop }'],
  ['observeResize / observeIntersection / observeMutation', '对应的 Observer，移除时自动断开'],
  ['animate(el, keyframes, options)', 'Web Animations，移除时自动取消；减少动态效果时直接到终点'],
  ['emit(type, detail)', '派发事件（冒泡、穿透 Shadow DOM、可取消）'],
  ['setState(name, on)', '自定义状态，CSS 中用 :host(:state(name))'],
  ['watchSlot(name)', '插槽有内容时设置 :state(has-name)'],
];

export default () => html`
  <h1>组件开发</h1>
  <p class="lead">每个组件都继承 VunioElement。只需要写四个钩子，其余（样式隔离、属性同步、资源回收）由基类负责。</p>

  <h2>生命周期</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>钩子</th><th>何时调用</th><th>写什么</th></tr></thead>
      <tbody>
        <tr><td><code>render()</code></td><td>首次挂载，只一次</td><td>返回 <code>html\`…\`</code></td></tr>
        <tr><td><code>mounted()</code></td><td>每次插入文档</td><td><code>this.effect()</code>、<code>this.loop()</code>、<code>this.on()</code></td></tr>
        <tr><td><code>update(changed)</code></td><td>挂载时一次，之后每次属性变化</td><td>可选：画布绘制等命令式工作</td></tr>
        <tr><td><code>unmounted()</code></td><td>每次移出文档</td><td>一般不用写</td></tr>
      </tbody>
    </table>
  </div>

  <h2>属性</h2>
  ${code(`static props = {
  label: String,                                                     // 简写
  size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] }, // 枚举：写错回退默认值并警告
  count: { type: Number, default: 0 },
  open: Boolean,                                                     // 有 attribute 即为 true
  items: { type: Array, default: () => [] },                         // 只在 JS 属性上
};`)}
  <p>String / Number / Boolean 以 attribute 为唯一真相：<code>el.size = 'lg'</code> 等于 <code>el.setAttribute('size', 'lg')</code>。每个属性都由 signal 承载，可以直接用在模板、computed 和 effect 里。</p>

  <h2>自动回收的工具</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>方法</th><th>说明</th></tr></thead>
      <tbody>${TOOLS.map(([name, text]) => html`<tr><td><code>${name}</code></td><td>${text}</td></tr>`)}</tbody>
    </table>
  </div>

  <h2>表单控件</h2>
  <p>继承 <code>VunioFormElement</code> 的组件可以直接放进 <code>&lt;form&gt;</code>：值进入 FormData，支持 reset、<code>&lt;fieldset disabled&gt;</code> 和校验。<code>value</code>、<code>userInvalid</code>、<code>validationMessage</code> 都是响应式的。</p>
  ${code(`class PoemField extends VunioFormElement {
  static tag = 'poem-field';
  render() {
    return html\`
      <input .value=\${computed(() => this.value)} @input=\${(e) => (this.value = e.target.value)} />
      <small>\${() => (this.userInvalid ? this.validationMessage : '')}</small>\`;
  }
}`)}

  <h2>组件规范</h2>
  <p>Vunio 有一份写组件的规范（docs/COMPONENT_SPEC.md）：标准骨架、必须与禁止、自查清单，文末还有一段可以直接发给 AI 的提示词。人和 AI 按同一份规范写，得到的就是可复用的组件。</p>
  <blockquote>颜色只用主题令牌；资源只用基类工具创建；会变的地方用 signal 或函数绑定。</blockquote>

  ${pager(['/templates', '模板'], ['/router', '路由'])}
`;
