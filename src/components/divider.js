import { VunioElement, html, css } from '../core/index.js';

/**
 * <vn-divider> 分隔线。默认是一道两头尖的笔触，可以在中间写字。
 *
 * @attr {'brush'|'line'|'dashed'} variant - 笔触 · 细线 · 虚线，默认 brush
 * @attr {boolean} vertical - 竖向
 * @slot - 居中的文字
 * @csspart line - 线
 */
export class VnDivider extends VunioElement {
  static tag = 'vn-divider';

  static props = {
    variant: { type: String, default: 'brush', values: ['brush', 'line', 'dashed'] },
    vertical: Boolean,
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--vn-space-3);
      margin-block: var(--vn-space-5);
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
    }
    .line {
      flex: 1;
      block-size: 6px;
      background: var(--vn-fg-subtle);
      -webkit-mask: var(--vn-mask-brush) center / 100% 100% no-repeat;
      mask: var(--vn-mask-brush) center / 100% 100% no-repeat;
    }
    :host([variant='line']) .line {
      block-size: 1px;
      background: var(--vn-line);
      -webkit-mask: none;
      mask: none;
    }
    :host([variant='dashed']) .line {
      block-size: 0;
      border-block-start: 1px dashed var(--vn-line-strong);
      background: none;
      -webkit-mask: none;
      mask: none;
    }
    .label {
      flex: none;
      margin-inline-end: calc(-1 * var(--vn-tracking-wider));
    }
    /* 没有文字时只有一道线 */
    :host(:not(:state(has-default))) .label,
    :host(:not(:state(has-default))) .line + .label + .line {
      display: none;
    }
    :host([vertical]) {
      display: inline-flex;
      align-self: stretch;
      flex-direction: column;
      min-block-size: 1em;
      margin-block: 0;
      margin-inline: var(--vn-space-3);
    }
    :host([vertical]) .line {
      flex: 1;
      inline-size: 1px;
      block-size: auto;
      border: 0;
      background: var(--vn-line-strong);
      -webkit-mask: none;
      mask: none;
    }
  `;

  render() {
    return html`
      <span class="line" part="line"></span>
      <span class="label"><slot></slot></span>
      <span class="line" part="line"></span>
    `;
  }

  mounted() {
    this.internals.role = 'separator';
    this.effect(() => {
      this.internals.ariaOrientation = this.vertical ? 'vertical' : 'horizontal';
    });
    this.watchSlot('');
  }
}

VnDivider.define();
