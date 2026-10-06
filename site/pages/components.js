import { html } from '../../src/index.js';
import { router } from '../router.js';
import { docs, groups } from '../data/docs.js';
import { code, pager } from '../ui/page.js';

export default () => html`
  <style>
    .component-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--vn-space-4);
      margin-block: var(--vn-space-3) var(--vn-space-6);
    }
    .component-grid a {
      color: inherit;
      text-decoration: none;
    }
    .component-grid vn-card {
      block-size: 100%;
    }
    .component-grid small {
      display: block;
      margin-block-start: var(--vn-space-1);
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      line-height: 1.6;
    }
    .component-grid code {
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-xs);
    }
  </style>
  <h1>组件</h1>
  <p class="lead">第一批十二件，加上天气背景。全部用主题令牌，昼夜自动切换；表单组件直接放进原生 &lt;form&gt;。</p>
  ${code(`import 'vunio/components';   // 注册全部组件`)}
  ${groups.map(
    (group) => html`
      <h2>${group.title}</h2>
      <div class="component-grid">
        ${group.items.map(
          (slug) => html`
            <a href=${router.href(`/components/${slug}`)}>
              <vn-card interactive padding="sm">
                <span slot="title">${docs[slug].name}</span>
                <code slot="extra">${slug === 'toast' ? 'toast()' : docs[slug].tag}</code>
                <small>${docs[slug].intro}</small>
              </vn-card>
            </a>
          `,
        )}
      </div>
    `,
  )}
  ${pager(['/effects', '风花雪月'], ['/components/button', '按钮'])}
`;
