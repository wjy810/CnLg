import { VunioElement, html, css, computed, repeat } from '../core/index.js';

/**
 * 页码列表：首页、末页、当前页两侧各 siblings 个，其余折叠成省略号。
 * @returns {(number | 'start-gap' | 'end-gap')[]}
 */
export function pageItems(page, pages, siblings = 1) {
  const total = siblings * 2 + 5; // 首、尾、当前、两侧、两个省略号
  if (pages <= total) return Array.from({ length: pages }, (_, i) => i + 1);
  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, pages - 1);
  const showLeftGap = left > 3;
  const showRightGap = right < pages - 2;
  if (!showLeftGap) {
    const count = siblings * 2 + 3;
    return [...Array.from({ length: count }, (_, i) => i + 1), 'end-gap', pages];
  }
  if (!showRightGap) {
    const count = siblings * 2 + 3;
    return [1, 'start-gap', ...Array.from({ length: count }, (_, i) => pages - count + 1 + i)];
  }
  return [1, 'start-gap', ...Array.from({ length: right - left + 1 }, (_, i) => left + i), 'end-gap', pages];
}

/**
 * <vn-pagination> 分页：上一页、页码、下一页。页数多时折叠为省略号。
 *
 * @attr {number} total - 总条数
 * @attr {number} page-size - 每页条数，默认 10
 * @attr {number} page - 当前页（从 1 开始），默认 1
 * @attr {number} siblings - 当前页两侧显示的页码数，默认 1
 * @attr {string} label - 读屏名称，默认“分页”
 * @fires vn-change - 换页后，detail.page 为新页码
 * @csspart list - 列表
 * @csspart page - 页码按钮
 * @csspart prev - 上一页
 * @csspart next - 下一页
 */
export class VnPagination extends VunioElement {
  static tag = 'vn-pagination';

  static props = {
    total: Number,
    pageSize: { type: Number, default: 10 },
    page: { type: Number, default: 1 },
    siblings: { type: Number, default: 1 },
    label: { type: String, default: '分页' },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
    }
    .list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--vn-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    button {
      min-inline-size: 36px;
      block-size: 36px;
      padding: 0 var(--vn-space-2);
      border: var(--vn-border-thin) solid transparent;
      border-radius: var(--vn-radius-sm);
      background: none;
      color: var(--vn-fg);
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        border-color var(--vn-duration-fast) var(--vn-ease-standard),
        color var(--vn-duration-fast) var(--vn-ease-standard);
    }
    button:hover:not(:disabled) {
      border-color: var(--vn-line-strong);
    }
    button[aria-current='page'] {
      border-color: var(--vn-accent-fg);
      color: var(--vn-accent-fg);
      font-weight: var(--vn-weight-medium);
    }
    button:disabled {
      color: var(--vn-fg-subtle);
      cursor: not-allowed;
    }
    button:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
    }
    .gap {
      min-inline-size: 24px;
      color: var(--vn-fg-muted);
      text-align: center;
    }
  `;

  /** 总页数（至少 1） */
  pages = computed(() => Math.max(1, Math.ceil((this.total || 0) / (this.pageSize > 0 ? this.pageSize : 10))));

  /** 修正到有效范围的当前页 */
  current = computed(() => Math.min(this.pages.value, Math.max(1, Math.round(this.page) || 1)));

  items = computed(() => pageItems(this.current.value, this.pages.value, Math.max(0, this.siblings)));

  render() {
    return html`
      <nav aria-label=${() => this.label}>
        <ul class="list" part="list" role="list">
          <li>
            <button type="button" part="prev" aria-label="上一页" ?disabled=${() => this.current.value <= 1} @click=${() => this.go(this.current.value - 1)}>‹</button>
          </li>
          ${repeat(
            this.items,
            (item) => item,
            (item) =>
              typeof item === 'number'
                ? html`<li>
                    <button
                      type="button"
                      part="page"
                      aria-label=${`第 ${item} 页`}
                      aria-current=${() => (this.current.value === item ? 'page' : null)}
                      @click=${() => this.go(item)}
                    >
                      ${item}
                    </button>
                  </li>`
                : html`<li class="gap" aria-hidden="true">…</li>`,
          )}
          <li>
            <button type="button" part="next" aria-label="下一页" ?disabled=${() => this.current.value >= this.pages.value} @click=${() => this.go(this.current.value + 1)}>›</button>
          </li>
        </ul>
      </nav>
    `;
  }

  /** 跳到某一页 */
  go(page) {
    const next = Math.min(this.pages.peek(), Math.max(1, page));
    if (next === this.current.peek()) return;
    this.page = next;
    this.emit('vn-change', { page: next });
  }
}

VnPagination.define();
