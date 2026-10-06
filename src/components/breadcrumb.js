import { VunioElement, html, css, signal, when } from '../core/index.js';

/**
 * <vn-breadcrumb> 面包屑：当前页在网站中的位置。最后一项是当前页。
 *
 * @attr {string} label - 读屏名称，默认“面包屑”
 * @attr {string} separator - 分隔符，默认 /
 * @slot - <vn-breadcrumb-item>
 * @csspart list - 列表
 */
export class VnBreadcrumb extends VunioElement {
  static tag = 'vn-breadcrumb';

  static props = {
    label: { type: String, default: '面包屑' },
    separator: { type: String, default: '/' },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wide);
    }
    .list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--vn-space-1) 0;
      margin: 0;
      padding: 0;
    }
  `;

  render() {
    return html`
      <nav aria-label=${() => this.label}>
        <div class="list" part="list" role="list"><slot @slotchange=${this.markCurrent}></slot></div>
      </nav>
    `;
  }

  /** 最后一项是当前页 */
  markCurrent() {
    const items = this.root
      .querySelector('slot')
      .assignedElements()
      .filter((el) => el instanceof VnBreadcrumbItem);
    items.forEach((item, i) => item.setPosition(i === 0, i === items.length - 1));
  }
}

/**
 * <vn-breadcrumb-item> 面包屑中的一项。
 *
 * @attr {string} href - 链接地址；当前页（最后一项）不显示为链接
 * @slot - 文字
 * @csspart link - 链接
 * @csspart current - 当前页的文字
 * @csspart separator - 分隔符
 */
export class VnBreadcrumbItem extends VunioElement {
  static tag = 'vn-breadcrumb-item';

  static props = {
    href: String,
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }
    .sep {
      margin-inline: var(--vn-space-2);
      color: var(--vn-fg-subtle);
    }
    a {
      color: var(--vn-fg-muted);
      text-decoration: none;
      transition: color var(--vn-duration-fast) var(--vn-ease-standard);
    }
    a:hover {
      color: var(--vn-accent-fg);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    a:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
      border-radius: var(--vn-radius-sm);
    }
    .current {
      color: var(--vn-fg);
    }
  `;

  #first = signal(false);
  #last = signal(false);

  /** 由 <vn-breadcrumb> 调用 */
  setPosition(first, last) {
    this.#first.value = first;
    this.#last.value = last;
  }

  render() {
    const separator = () => this.closest('vn-breadcrumb')?.separator || '/';
    return html`
      ${when(
        () => !this.#first.value,
        () => html`<span class="sep" part="separator" aria-hidden="true">${separator}</span>`,
      )}
      ${when(
        () => this.href && !this.#last.value,
        () => html`<a part="link" href=${() => this.href}><slot></slot></a>`,
        () => html`<span class=${() => (this.#last.value ? 'current' : '')} part="current" aria-current=${() => (this.#last.value ? 'page' : null)}><slot></slot></span>`,
      )}
    `;
  }

  mounted() {
    this.internals.role = 'listitem';
  }
}

VnBreadcrumbItem.define();
VnBreadcrumb.define();
