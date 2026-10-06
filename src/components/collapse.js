import { VunioElement, html, css } from '../core/index.js';

/**
 * <vn-collapse> 折叠面板：一组 <vn-collapse-item>。accordion 时同一时间只展开一项。
 *
 * @attr {boolean} accordion - 手风琴：展开一项时收起其他项
 * @slot - <vn-collapse-item>
 */
export class VnCollapse extends VunioElement {
  static tag = 'vn-collapse';

  static props = {
    accordion: Boolean,
  };

  static styles = css`
    :host {
      display: block;
      border-block-start: var(--vn-border-thin) solid var(--vn-line);
    }
  `;

  render() {
    return html`<slot></slot>`;
  }

  mounted() {
    this.on(this, 'vn-toggle', (event) => {
      const item = event.target;
      if (!this.accordion || !(item instanceof VnCollapseItem) || item.parentElement !== this || !event.detail.open) return;
      for (const other of this.children) if (other !== item && other instanceof VnCollapseItem && other.open) other.hide();
    });
  }
}

/**
 * <vn-collapse-item> 折叠面板中的一项：原生 <details> / <summary>，键盘、读屏、页内查找都由浏览器负责。
 *
 * @attr {string} heading - 标题
 * @attr {boolean} open - 是否展开
 * @slot - 内容
 * @slot heading - 标题（代替 heading 属性，可以放图标等）
 * @fires vn-toggle - 展开或收起后，detail.open
 * @csspart summary - 标题行
 * @csspart content - 内容
 */
export class VnCollapseItem extends VunioElement {
  static tag = 'vn-collapse-item';

  static props = {
    heading: String,
    open: Boolean,
  };

  static styles = css`
    :host {
      display: block;
      border-block-end: var(--vn-border-thin) solid var(--vn-line);
      color: var(--vn-fg);
    }
    summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--vn-space-3);
      padding: var(--vn-space-3) var(--vn-space-1);
      font-weight: var(--vn-weight-medium);
      letter-spacing: var(--vn-tracking-wide);
      list-style: none;
      cursor: pointer;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary:hover {
      color: var(--vn-accent-fg);
    }
    summary:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
    }
    /* 折角：收起时朝右，展开时朝下 */
    .chevron {
      flex: none;
      inline-size: 8px;
      block-size: 8px;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: -45deg;
      transition: rotate var(--vn-duration-normal) var(--vn-ease-standard);
    }
    details[open] .chevron {
      rotate: 45deg;
    }
    .content {
      overflow: hidden;
    }
    .inner {
      padding: 0 var(--vn-space-1) var(--vn-space-4);
      color: var(--vn-fg-muted);
      line-height: var(--vn-leading-normal);
    }
  `;

  #animation = null;
  /** 下一次展开是否播动画：用户点击或调用 show() 时为 true；初次渲染、页内查找自动展开时不播 */
  #animateNext = false;

  render() {
    return html`
      <details data-ref="details" ?open=${() => this.open} @toggle=${this.handleToggle}>
        <summary part="summary" @click=${this.handleSummaryClick}>
          <span><slot name="heading">${() => this.heading}</slot></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="content" part="content" data-ref="content"><div class="inner"><slot></slot></div></div>
      </details>
    `;
  }

  /** 展开 */
  show() {
    if (!this.open) this.#animateNext = true;
    this.open = true;
  }

  /** 收起（带动画） */
  hide() {
    this.#collapse();
  }

  /** 切换 */
  toggle() {
    if (this.refs.details.open) this.#collapse();
    else this.show();
  }

  handleSummaryClick(event) {
    // 收起时先播动画再真正关闭；展开交给浏览器，在 toggle 事件里播动画
    if (this.refs.details.open) {
      event.preventDefault();
      this.#collapse();
    } else {
      this.#animateNext = true;
    }
  }

  handleToggle() {
    const open = this.refs.details.open;
    if (open !== this.open) this.open = open;
    if (open && this.#animateNext) this.#expand();
    this.#animateNext = false;
    this.emit('vn-toggle', { open }, { cancelable: false });
  }

  #expand() {
    const content = this.refs.content;
    this.#animation?.cancel();
    this.#animation = this.animate(content, [{ blockSize: '0px', opacity: 0 }, { blockSize: `${content.scrollHeight}px`, opacity: 1 }], {
      duration: this.#duration(),
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });
  }

  #collapse() {
    const details = this.refs.details;
    if (!details.open) return;
    const content = this.refs.content;
    this.#animation?.cancel();
    const animation = this.animate(content, [{ blockSize: `${content.offsetHeight}px`, opacity: 1 }, { blockSize: '0px', opacity: 0 }], {
      duration: this.#duration(),
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });
    this.#animation = animation;
    animation.finished.then(
      () => {
        if (this.#animation !== animation) return;
        this.#animation = null;
        this.open = false;
      },
      () => {},
    );
  }

  #duration() {
    const raw = getComputedStyle(this).getPropertyValue('--vn-duration-normal').trim();
    const value = parseFloat(raw);
    if (!raw || Number.isNaN(value)) return 320;
    return raw.endsWith('ms') ? value : value * 1000;
  }
}

VnCollapseItem.define();
VnCollapse.define();
