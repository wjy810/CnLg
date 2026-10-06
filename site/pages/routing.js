import { html } from '../../src/index.js';
import { router } from '../router.js';
import { code, pager } from '../ui/page.js';

export default () => html`
  <h1>路由</h1>
  <p class="lead">当前路由是一个 signal，页面用模板渲染。默认 hash 模式，放在任何静态托管上都能用；这个文档站就是用它写成的。</p>

  <h2>定义路由</h2>
  ${code(`import { createRouter, html } from 'vunio';

const router = createRouter({
  mode: 'hash',                                  // 或 'history'（配合 base）
  routes: [
    { path: '/', title: '首页', view: () => html\`<h1>首页</h1>\` },
    { path: '/poems/:id', title: (p) => \`第 \${p.id} 首\`, view: ({ params }) => html\`…\` },
    { path: '/guide/*', load: () => import('./guide.js') },   // 懒加载
  ],
  notFound: () => html\`<h1>此页不存在</h1>\`,
});

router.start();
render(html\`<main>\${router.outlet()}</main>\`, document.body);`)}

  <h2>匹配规则</h2>
  <ul>
    <li><code>/components</code> 静态段，<code>/components/:name</code> 参数，<code>/docs/*</code> 通配剩余部分。</li>
    <li>多条规则都能匹配时，选最具体的：静态 &gt; 参数 &gt; 通配，和书写顺序无关。</li>
    <li>参数自动解码，查询串解析为 <code>query</code> 对象。</li>
  </ul>

  <h2>导航</h2>
  ${code(`router.navigate('/poems/7');
router.navigate('/search?q=月', { replace: true });
router.href('/poems/7');                         // '#/poems/7'
router.isActive('/components');                  // 响应式，用于导航高亮
router.route.value;                              // { path, params, query, hash, def }`)}
  <p>当前地址：<code>${() => router.route.value.path}</code>。</p>
  <ul>
    <li>换页后设置标题、滚动到顶部，并把焦点移到新页面的主标题，读屏用户能感知到页面变化。</li>
    <li>前进 / 后退恢复之前的滚动位置。</li>
    <li>站内链接自动接管；按住修饰键、<code>target="_blank"</code>、下载链接和站外链接保持浏览器默认行为。</li>
  </ul>

  ${pager(['/authoring', '组件开发'], ['/design', '设计系统'])}
`;
