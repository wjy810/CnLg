// 文档站的路由。页面按需加载：首屏只加载首页。
import { createRouter, html } from '../src/index.js';
import { docs } from './data/docs.js';

const page = (load) => () => load();

export const router = createRouter({
  mode: 'hash',
  title: 'Vunio',
  routes: [
    { path: '/', title: 'Vunio · 古风 Web Components 框架', load: page(() => import('./pages/home.js')) },
    { path: '/start', title: '快速开始 · Vunio', load: page(() => import('./pages/start.js')) },
    { path: '/reactivity', title: '响应式 · Vunio', load: page(() => import('./pages/reactivity.js')) },
    { path: '/templates', title: '模板 · Vunio', load: page(() => import('./pages/templates.js')) },
    { path: '/authoring', title: '组件开发 · Vunio', load: page(() => import('./pages/authoring.js')) },
    { path: '/router', title: '路由 · Vunio', load: page(() => import('./pages/routing.js')) },
    { path: '/design', title: '设计系统 · Vunio', load: page(() => import('./pages/design.js')) },
    { path: '/effects', title: '风花雪月 · Vunio', load: page(() => import('./pages/effects.js')) },
    { path: '/components', title: '组件 · Vunio', load: page(() => import('./pages/components.js')) },
    {
      path: '/components/:slug',
      title: ({ slug }) => `${docs[slug]?.name ?? '组件'} · Vunio`,
      load: page(() => import('./pages/component.js')),
    },
  ],
  notFound: () => html`
    <h1>此页不存在</h1>
    <p>山重水复疑无路。回到<a href="#/">首页</a>看看。</p>
  `,
});
