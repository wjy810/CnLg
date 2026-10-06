// 诗作列表：搜索、按标签筛选、分页。条件都写在地址栏里（?q=&tag=&page=），可以分享、可以后退。
import { html, computed, repeat } from '../../../src/index.js';
import { router } from '../router.js';
import { poems, allTags, searchPoems } from '../store.js';
import { styles, poemCard, empty } from '../ui.js';

const PAGE_SIZE = 6;

export default ({ query }) => {
  const q = query.q ?? '';
  const tags = query.tag ? query.tag.split(',') : [];
  const results = computed(() => searchPoems(poems.value, { q, tags }));
  const pages = computed(() => Math.max(1, Math.ceil(results.value.length / PAGE_SIZE)));
  const page = computed(() => Math.min(pages.value, Math.max(1, Number(query.page) || 1)));
  const visible = computed(() => results.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    router.setQuery({ tag: next.join(','), page: null });
  };

  return html`
    ${styles}
    <style>
      .filters {
        display: grid;
        gap: var(--vn-space-3);
        margin-block-end: var(--vn-space-5);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--vn-space-2);
      }
      .chip {
        padding: 2px var(--vn-space-3);
        border: var(--vn-border-thin) solid var(--vn-line-strong);
        border-radius: var(--vn-radius-full);
        background: none;
        color: var(--vn-fg-muted);
        font: inherit;
        font-size: var(--vn-font-size-sm);
        cursor: pointer;
      }
      .chip[aria-pressed='true'] {
        border-color: var(--vn-accent-fg);
        color: var(--vn-accent-fg);
      }
      .chip:focus-visible {
        outline: var(--vn-focus-ring);
        outline-offset: 2px;
      }
      .count {
        color: var(--vn-fg-muted);
        font-size: var(--vn-font-size-sm);
      }
      .pager {
        margin-block-start: var(--vn-space-6);
      }
    </style>
    <div class="page-head">
      <h1>诗作</h1>
      <span class="count" role="status">${() => `共 ${results.value.length} 首`}</span>
    </div>
    <div class="filters">
      <vn-input
        type="search"
        label="搜索"
        placeholder="标题、作者、诗句"
        .value=${q}
        @input=${(e) => router.setQuery({ q: e.target.value, page: null })}
      ></vn-input>
      <div class="chips" role="group" aria-label="按标签筛选">
        ${repeat(
          allTags,
          (tag) => tag,
          (tag) => html`<button type="button" class="chip" aria-pressed=${String(tags.includes(tag))} @click=${() => toggleTag(tag)}>${tag}</button>`,
        )}
      </div>
    </div>
    ${() =>
      results.value.length
        ? html`
            <div class="grid">${repeat(visible, (poem) => poem.id, poemCard)}</div>
            <vn-pagination
              class="pager"
              total=${() => results.value.length}
              page-size=${PAGE_SIZE}
              page=${() => page.value}
              @vn-change=${(e) => router.setQuery({ page: e.detail.page }, { scroll: true })}
            ></vn-pagination>
          `
        : empty('没有找到相关的诗作', html`<vn-button variant="moon" @click=${() => router.setQuery({ q: null, tag: null, page: null })}>清除条件</vn-button>`)}
  `;
};
