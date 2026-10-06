// 页面共用的小片段
import { html } from '../../src/index.js';
import { router } from './router.js';
import { toggleFavorite } from './store.js';

/** 页面共用样式（放在 main 里，作用于整个应用） */
export const styles = html`
  <style>
    .page-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--vn-space-3);
      margin-block-end: var(--vn-space-5);
    }
    .page-head h1 {
      margin: 0;
      font: 400 var(--vn-font-size-3xl) / var(--vn-leading-tight) var(--vn-font-display);
      letter-spacing: var(--vn-tracking-wide);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--vn-space-4);
    }
    .poem-card h2 {
      margin: 0;
      font-size: var(--vn-font-size-lg);
      font-weight: var(--vn-weight-medium);
      letter-spacing: var(--vn-tracking-wide);
    }
    .poem-card h2 a {
      color: inherit;
      text-decoration: none;
    }
    .poem-card h2 a:hover {
      color: var(--vn-accent-fg);
    }
    .poem-card .meta {
      margin: var(--vn-space-1) 0 var(--vn-space-3);
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
    }
    .poem-card .excerpt {
      margin: 0;
      font-family: var(--vn-font-quote);
      line-height: var(--vn-leading-normal);
    }
    .fav {
      padding: 2px 6px;
      border: 0;
      border-radius: var(--vn-radius-sm);
      background: none;
      color: var(--vn-fg-muted);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }
    .fav[aria-pressed='true'] {
      color: var(--vn-accent-fg);
    }
    .fav:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
    }
    .empty {
      padding: var(--vn-space-8) 0;
      color: var(--vn-fg-muted);
      text-align: center;
    }
    .empty p {
      margin: 0 0 var(--vn-space-4);
      font-family: var(--vn-font-quote);
      font-size: var(--vn-font-size-lg);
    }
  </style>
`;

/** 收藏按钮：☆ / ★ */
export const favoriteButton = (poem) => html`
  <button
    type="button"
    class="fav"
    aria-pressed=${String(poem.favorite)}
    aria-label=${`收藏《${poem.title}》`}
    @click=${() => toggleFavorite(poem.id)}
  >
    ${poem.favorite ? '★' : '☆'}
  </button>
`;

/** 列表中的一张诗笺 */
export const poemCard = (poem) => html`
  <vn-card class="poem-card" interactive>
    <h2 slot="title"><a href=${router.href(`/poem/${poem.id}`)}>${poem.title}</a></h2>
    <span slot="extra">${favoriteButton(poem)}</span>
    <div class="meta">${poem.author} · ${poem.dynasty} · ${poem.form}</div>
    <p class="excerpt">${poem.text.split('\n')[0]}</p>
  </vn-card>
`;

/** 空状态 */
export const empty = (text, action = null) => html`
  <div class="empty">
    <p>${text}</p>
    ${action}
  </div>
`;
