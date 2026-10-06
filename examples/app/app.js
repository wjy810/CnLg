// 诗笺：用 Vunio 写成的小应用。布局 + 路由。
import { html, render } from '../../src/index.js';
import '../../src/components/index.js';
import '../stores/theme.js';
import { router } from './router.js';
import { favoriteCount } from './store.js';

const link = (to, text, exact = false) => html`
  <a href=${router.href(to)} aria-current=${() => (router.isActive(to, { exact }) ? 'page' : null)}>${text}</a>
`;

render(
  html`
    <a class="skip" href="#main">跳到正文</a>
    <header class="topbar">
      <a class="brand" href=${router.href('/')}>诗笺</a>
      <nav class="nav" aria-label="主导航">
        ${link('/', '诗作', true)} ${link('/favorites', html`收藏 <vn-tag size="sm">${() => favoriteCount.value}</vn-tag>`)}
        ${link('/new', '新建')} ${link('/settings', '设置')}
      </nav>
    </header>
    <main id="main" tabindex="-1">${router.outlet()}</main>
    <footer class="footer">诗笺 · 一个用 Vunio 写成的示例应用 · 数据只保存在这台设备上</footer>
  `,
  document.getElementById('app'),
);
router.start();
