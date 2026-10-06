import { VunioElement, html, css } from '../core/index.js';

/**
 * <vn-card> 卡片：一张纸、一幅古籍边框，或只是一块留白。
 *
 * @attr {'paper'|'frame'|'plain'} variant - 纸片 · 古籍双线框 · 无底，默认 paper
 * @attr {'sm'|'md'|'lg'} padding - 内边距，默认 md
 * @attr {boolean} interactive - 悬停时浮起
 * @slot title - 标题
 * @slot extra - 右上角的操作
 * @slot - 正文
 * @slot footer - 底部操作
 * @csspart card - 卡片容器
 */
export class VnCard extends VunioElement {
  static tag = 'vn-card';

  static props = {
    variant: { type: String, default: 'paper', values: ['paper', 'frame', 'plain'] },
    padding: { type: String, default: 'md', values: ['sm', 'md', 'lg'] },
    interactive: Boolean,
  };

  static styles = css`
    :host {
      display: block;
      --_pad: var(--vn-space-5);
    }
    :host([padding='sm']) {
      --_pad: var(--vn-space-4);
    }
    :host([padding='lg']) {
      --_pad: var(--vn-space-6);
    }
    .card {
      position: relative;
      block-size: 100%;
      padding: var(--_pad);
      border-radius: var(--vn-radius-md);
      background: var(--vn-surface);
      color: var(--vn-fg);
      box-shadow:
        inset 0 0 0 1px var(--vn-line),
        var(--vn-shadow-1);
      transition:
        box-shadow var(--vn-duration-normal) var(--vn-ease-brush),
        transform var(--vn-duration-normal) var(--vn-ease-brush);
    }
    :host([interactive]) .card:hover {
      box-shadow:
        inset 0 0 0 1px var(--vn-line),
        var(--vn-shadow-2);
      transform: translateY(-2px);
    }
    /* 古籍双线框：外粗内细 */
    :host([variant='frame']) .card {
      padding: calc(var(--_pad) + 4px);
      border: 2px solid var(--vn-line-strong);
      border-radius: var(--vn-radius-sm);
      box-shadow: none;
    }
    :host([variant='frame']) .card::before {
      content: '';
      position: absolute;
      inset: 4px;
      border: 1px solid var(--vn-line-strong);
      pointer-events: none;
    }
    :host([variant='plain']) .card {
      background: transparent;
      box-shadow: none;
    }
    .header,
    .footer {
      display: none;
    }
    :host(:state(has-title)) .header,
    :host(:state(has-extra)) .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--vn-space-3);
      margin-block-end: var(--vn-space-3);
    }
    ::slotted([slot='title']) {
      margin: 0;
      font-size: var(--vn-font-size-lg);
      font-weight: var(--vn-weight-medium);
      letter-spacing: var(--vn-tracking-wide);
    }
    :host(:state(has-footer)) .footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--vn-space-3);
      margin-block-start: var(--vn-space-4);
      padding-block-start: var(--vn-space-4);
      border-block-start: var(--vn-border-thin) dashed var(--vn-line);
    }
  `;

  render() {
    return html`
      <div class="card" part="card">
        <div class="header"><slot name="title"></slot><slot name="extra"></slot></div>
        <slot></slot>
        <div class="footer"><slot name="footer"></slot></div>
      </div>
    `;
  }

  mounted() {
    this.watchSlot('title');
    this.watchSlot('extra');
    this.watchSlot('footer');
  }
}

VnCard.define();
