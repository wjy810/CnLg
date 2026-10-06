// 收藏的诗作
import { html, computed, repeat } from '../../../src/index.js';
import { router } from '../router.js';
import { poems } from '../store.js';
import { styles, poemCard, empty } from '../ui.js';

export default () => {
  const favorites = computed(() => poems.value.filter((p) => p.favorite));
  return html`
    ${styles}
    <div class="page-head"><h1>收藏</h1></div>
    ${() =>
      favorites.value.length
        ? html`<div class="grid">${repeat(favorites, (p) => p.id, poemCard)}</div>`
        : empty('还没有收藏。读到喜欢的，点一下 ☆。', html`<vn-button variant="moon" @click=${() => router.navigate('/')}>去看看</vn-button>`)}
  `;
};
