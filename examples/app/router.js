// 诗笺的路由：每个页面一个模块，按需加载
import { createRouter, html } from '../../src/index.js';
import { findPoem } from './store.js';

const poemTitle = ({ id }) => `${findPoem(Number(id))?.title ?? '诗'} · 诗笺`;

export const router = createRouter({
  mode: 'hash',
  title: '诗笺',
  routes: [
    { path: '/', title: '诗笺', load: () => import('./pages/list.js') },
    { path: '/poem/:id', title: poemTitle, load: () => import('./pages/poem.js') },
    { path: '/poem/:id/edit', title: '修改 · 诗笺', load: () => import('./pages/edit.js') },
    { path: '/new', title: '新建 · 诗笺', load: () => import('./pages/edit.js') },
    { path: '/favorites', title: '收藏 · 诗笺', load: () => import('./pages/favorites.js') },
    { path: '/settings', title: '设置 · 诗笺', load: () => import('./pages/settings.js') },
  ],
  notFound: () => html`
    <h1>此页不存在</h1>
    <p>山重水复疑无路。<a href="#/">回到诗笺</a></p>
  `,
});
