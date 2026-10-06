import { VunioElement, html, css } from '../core/index.js';

/**
 * <vn-loading> 加载：一滴墨入水，涟漪一圈圈散开。
 *
 * @attr {'sm'|'md'|'lg'} size - 尺寸，默认 md
 * @attr {string} label - 文字（也是读屏文字），默认“加载中”
 * @attr {boolean} quiet - 不显示文字（读屏仍会读）
 * @csspart drop - 墨滴
 */
export class VnLoading extends VunioElement {
  static tag = 'vn-loading';

  static props = {
    size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] },
    label: { type: String, default: '加载中' },
    quiet: Boolean,
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--vn-space-3);
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
      --_s: 28px;
    }
    :host([size='sm']) {
      --_s: 18px;
    }
    :host([size='lg']) {
      --_s: 44px;
      font-size: var(--vn-font-size-md);
    }
    .drop {
      position: relative;
      flex: none;
      inline-size: var(--_s);
      block-size: var(--_s);
    }
    .drop::before {
      content: '';
      position: absolute;
      inset: 36%;
      border-radius: 50%;
      background: var(--vn-fg);
      animation: drip 1.8s ease-in-out infinite;
    }
    .drop i {
      position: absolute;
      inset: 0;
      border: 2px solid var(--vn-fg);
      border-radius: 50%;
      opacity: 0;
      animation: ripple 1.8s var(--vn-ease-enter) infinite;
    }
    .drop i:nth-child(2) {
      animation-delay: 0.6s;
    }
    .drop i:nth-child(3) {
      animation-delay: 1.2s;
    }
    @keyframes ripple {
      from {
        transform: scale(0.3);
        opacity: 0.8;
      }
      70% {
        opacity: 0.25;
      }
      to {
        transform: scale(1);
        opacity: 0;
      }
    }
    @keyframes drip {
      0%,
      100% {
        transform: scale(0.82);
      }
      50% {
        transform: scale(1);
      }
    }
    .text {
      margin-inline-end: calc(-1 * var(--vn-tracking-wider));
    }
    /* 减少动态效果：只留一滴静止的墨和一圈淡淡的水纹 */
    @media (prefers-reduced-motion: reduce) {
      .drop::before,
      .drop i {
        animation: none;
      }
      .drop i:first-child {
        opacity: 0.3;
        transform: scale(0.75);
      }
    }
    :host([quiet]) .text {
      display: none;
    }
  `;

  render() {
    return html`
      <span class="drop" part="drop" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="text" aria-hidden="true">${() => this.label}</span>
    `;
  }

  mounted() {
    this.internals.role = 'status';
    this.effect(() => {
      this.internals.ariaLabel = this.label;
    });
  }
}

VnLoading.define();
