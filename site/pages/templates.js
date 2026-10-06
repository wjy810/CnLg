import { html, signal, repeat, when } from '../../src/index.js';
import { code, pager } from '../ui/page.js';

function liveList() {
  const seasons = signal(['春', '夏', '秋', '冬'].map((name, id) => ({ id, name })));
  const showHint = signal(true);
  const shuffle = () => (seasons.value = [...seasons.value].sort(() => Math.random() - 0.5));
  return html`
    <div class="live" style="flex-direction: column; align-items: stretch">
      <vn-stack direction="row" gap="2" wrap>
        <vn-button size="sm" @click=${shuffle}>打乱</vn-button>
        <vn-button size="sm" variant="moon" @click=${() => (seasons.value = [...seasons.value].reverse())}>倒序</vn-button>
        <vn-switch ?checked=${showHint} @change=${(e) => (showHint.value = e.currentTarget.checked)}>显示说明</vn-switch>
      </vn-stack>
      <vn-stack direction="row" gap="3">
        ${repeat(seasons, (s) => s.id, (s) => html`<vn-card padding="sm" style="flex: 1; text-align: center">${s.name}</vn-card>`)}
      </vn-stack>
      ${when(showHint, () => html`<p style="margin: 0; color: var(--vn-fg-muted)">四张卡片按 id 复用：重排时只移动必要的节点。</p>`)}
    </div>
  `;
}

export default () => html`
  <h1>模板</h1>
  <p class="lead">在模板里直接写出“这里显示什么”。模板只编译一次，之后每个绑定只更新它自己负责的那一个节点。</p>

  <h2>绑定位置</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>位置</th><th>写法</th><th>signal / 函数</th></tr>
      </thead>
      <tbody>
        <tr><td>内容</td><td><code>&lt;p&gt;\${v}&lt;/p&gt;</code></td><td>响应式</td></tr>
        <tr><td>属性</td><td><code>title=\${v}</code>、<code>class="a \${v}"</code></td><td>响应式</td></tr>
        <tr><td>布尔属性</td><td><code>?disabled=\${v}</code></td><td>响应式</td></tr>
        <tr><td>DOM 属性</td><td><code>.value=\${v}</code></td><td>signal 响应式；函数原样赋值</td></tr>
        <tr><td>事件</td><td><code>@click=\${fn}</code></td><td>监听函数，<code>this</code> 是组件</td></tr>
      </tbody>
    </table>
  </div>
  <p>规则只有一条：<b>signal 和函数是“活的”，其他值是“死的”</b>。在组件里读属性要包成函数：<code>\${() =&gt; this.label}</code>。</p>

  <h2>条件与列表</h2>
  ${code(`html\`
  \${when(() => this.open, () => html\`<p>展开</p>\`, () => html\`<p>收起</p>\`)}
  <ul>\${repeat(this.items, (i) => i.id, (i) => html\`<li>\${i.name}</li>\`)}</ul>
\``)}
  ${liveList()}

  <h2>class 与 style</h2>
  ${code(`html\`<b class=\${{ active: on, dim: false }} style=\${{ color: 'red', '--size': '4px' }}></b>\``)}

  <h2>安全</h2>
  <p>插值永远以文本写入，不会被当作 HTML，天然防 XSS。只有显式调用 <code>unsafeHTML()</code> 时才按 HTML 插入。</p>

  <h2>写错时的提示</h2>
  <p>在 <code>&lt;textarea&gt;</code> 内、标签名或属性名中插值会立即报错，并告诉你正确写法，比如 “&lt;textarea&gt; 内部不支持插值，请改用 &lt;textarea .value=\${value}&gt;”。</p>

  ${pager(['/reactivity', '响应式'], ['/authoring', '组件开发'])}
`;
