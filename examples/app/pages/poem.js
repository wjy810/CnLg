// 一首诗：原文、标签、注释、同一作者的其他作品
import { html, computed, repeat, when } from '../../../src/index.js';
import { confirm, toast } from '../../../src/components/index.js';
import { router } from '../router.js';
import { poems, removePoem, toggleFavorite } from '../store.js';
import { styles, poemCard, empty } from '../ui.js';

export default ({ params }) => {
  const id = Number(params.id);
  const poem = computed(() => poems.value.find((p) => p.id === id) ?? null);
  const sameAuthor = computed(() => poems.value.filter((p) => p.author === poem.value?.author && p.id !== id));

  const remove = async () => {
    const title = poem.peek().title;
    const ok = await confirm({ heading: `删除《${title}》？`, message: '删除后不能恢复。', confirmText: '删除', danger: true });
    if (!ok) return;
    removePoem(id);
    toast(`已删除《${title}》`, { type: 'success' });
    router.navigate('/');
  };

  return html`
    ${styles}
    <style>
      .poem-text {
        margin: var(--vn-space-6) 0;
        font-family: var(--vn-font-quote);
        font-size: calc(var(--vn-font-size-xl) * var(--app-poem-scale, 1));
        line-height: 2;
        letter-spacing: var(--vn-tracking-wide);
        white-space: pre-line;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--vn-space-2);
        margin-block-end: var(--vn-space-5);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--vn-space-3);
        margin-block-end: var(--vn-space-7);
      }
      .notes {
        margin: 0;
        line-height: var(--vn-leading-normal);
      }
    </style>
    ${() =>
      poem.value
        ? html`
            <vn-breadcrumb>
              <vn-breadcrumb-item href=${router.href('/')}>诗作</vn-breadcrumb-item>
              <vn-breadcrumb-item>${() => poem.value.title}</vn-breadcrumb-item>
            </vn-breadcrumb>
            <vn-heading level="1" seal=${() => poem.value.form} sub=${() => `${poem.value.author} · ${poem.value.dynasty}`} style="margin-block-start: var(--vn-space-5)">
              ${() => poem.value.title}
            </vn-heading>
            <p class="poem-text">${() => poem.value.text}</p>
            <div class="tags">${repeat(() => poem.value.tags, (tag) => tag, (tag) => html`<vn-tag>${tag}</vn-tag>`)}</div>
            <div class="actions">
              <vn-button variant=${() => (poem.value.favorite ? 'cinnabar' : 'moon')} effect="blossom" aria-pressed=${() => String(poem.value.favorite)} @click=${() => toggleFavorite(id)}>
                ${() => (poem.value.favorite ? '已收藏' : '收藏')}
              </vn-button>
              <vn-button variant="moon" @click=${() => router.navigate(`/poem/${id}/edit`)}>修改</vn-button>
              <vn-button variant="text" @click=${remove}>删除</vn-button>
            </div>
            <vn-tabs label="更多">
              <vn-tab-panel name="notes" label="注释">
                ${when(
                  () => poem.value.notes,
                  () => html`<p class="notes">${() => poem.value.notes}</p>`,
                  () => empty('暂无注释'),
                )}
              </vn-tab-panel>
              <vn-tab-panel name="author" label=${() => `${poem.value.author}的其他作品`}>
                ${when(
                  () => sameAuthor.value.length,
                  () => html`<div class="grid">${repeat(sameAuthor, (p) => p.id, poemCard)}</div>`,
                  () => empty('诗笺里还没有这位作者的其他作品'),
                )}
              </vn-tab-panel>
            </vn-tabs>
          `
        : html`
            <h1>找不到这首诗</h1>
            ${empty('它可能已经被删除了', html`<a href=${router.href('/')}>回到诗作列表</a>`)}
          `}
  `;
};
