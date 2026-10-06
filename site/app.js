// 文档站入口：布局 + 路由。整站用 Vunio 自己写成。
import { html, render, signal, effect } from '../src/index.js';
import '../src/components/index.js';
import '../examples/theme-switch.js';
import '../examples/stores/theme.js';
import { router } from './router.js';
import { docs, groups } from './data/docs.js';

const NAV = [
  {
    title: '开始',
    items: [
      ['/', '首页'],
      ['/start', '快速开始'],
    ],
  },
  {
    title: '核心',
    items: [
      ['/reactivity', '响应式'],
      ['/templates', '模板'],
      ['/authoring', '组件开发'],
      ['/router', '路由'],
    ],
  },
  {
    title: '设计',
    items: [
      ['/design', '设计系统'],
      ['/effects', '风花雪月'],
    ],
  },
  ...groups.map((group, i) => ({
    title: i === 0 ? `组件 · ${group.title}` : group.title,
    items: [...(i === 0 ? [['/components', '总览']] : []), ...group.items.map((slug) => [`/components/${slug}`, docs[slug].name])],
  })),
];

const menuOpen = signal(false);

// 换页后收起窄屏目录
effect(() => {
  router.route.value;
  menuOpen.value = false;
});

const isHome = () => router.route.value.path === '/';

const navLink = ([to, text]) => html`
  <a href=${router.href(to)} aria-current=${() => (router.isActive(to, { exact: true }) ? 'page' : null)}>${text}</a>
`;

const layout = html`
  <a class="skip" href="#main" @click=${(e) => (e.preventDefault(), document.getElementById('main').focus())}>跳到正文</a>
  <header class="topbar">
    <button
      class="menu"
      type="button"
      aria-label="目录"
      aria-controls="sidebar"
      aria-expanded=${() => String(menuOpen.value)}
      @click=${() => (menuOpen.value = !menuOpen.value)}
    >
      <span></span><span></span><span></span>
    </button>
    <a class="brand" href=${router.href('/')}>Vunio</a>
    <nav class="top-links" aria-label="主导航">
      <a href=${router.href('/start')} aria-current=${() => (router.isActive('/start') ? 'page' : null)}>指南</a>
      <a href=${router.href('/components')} aria-current=${() => (router.isActive('/components') ? 'page' : null)}>组件</a>
      <a href=${router.href('/design')} aria-current=${() => (router.isActive('/design') ? 'page' : null)}>设计</a>
    </nav>
    <demo-theme-switch></demo-theme-switch>
  </header>

  <div class=${() => (isHome() ? 'layout home' : 'layout')}>
    <aside class="sidebar" id="sidebar" data-open=${() => (menuOpen.value ? '' : null)}>
      <nav aria-label="目录">
        ${NAV.map(
          (section) => html`
            <section>
              <h2>${section.title}</h2>
              ${section.items.map(navLink)}
            </section>
          `,
        )}
      </nav>
    </aside>
    <div class="scrim" ?hidden=${() => !menuOpen.value} @click=${() => (menuOpen.value = false)}></div>
    <main id="main" class="doc" tabindex="-1">${router.outlet()}</main>
  </div>

  <footer class="footer">
    <p>Vunio · 纸、墨、印、四时 · 以 Vunio 自身写成</p>
  </footer>
`;

render(layout, document.getElementById('app'));
router.start();
