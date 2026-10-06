import { VunioElement, html, css, when } from '../core/index.js';

/**
 * <vn-tag> 标签：一小块带边框的文字，用来标注类别、状态、关键词。
 *
 * @attr {'default'|'accent'|'success'|'warning'|'danger'|'info'} type - 颜色，默认 default
 * @attr {'sm'|'md'} size - 尺寸，默认 md
 * @attr {boolean} closable - 末尾显示关闭按钮
 * @slot - 文字
 * @fires vn-close - 点关闭按钮时（可取消；没被取消就移除自己）
 * @csspart tag - 标签本体
 * @csspart close - 关闭按钮
 */
export class VnTag extends VunioElement {
  static tag = 'vn-tag';

  static props = {
    type: { type: String, default: 'default', values: ['default', 'accent', 'success', 'warning', 'danger', 'info'] },
    size: { type: String, default: 'md', values: ['sm', 'md'] },
    closable: Boolean,
  };

  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      --_color: var(--vn-fg-muted);
      --_border: var(--vn-line-strong);
      --_bg: transparent;
    }
    :host([type='accent']) {
      --_color: var(--vn-accent-fg);
      --_border: var(--vn-accent-fg);
      --_bg: var(--vn-accent-wash);
    }
    :host([type='success']) {
      --_color: var(--vn-success);
    }
    :host([type='warning']) {
      --_color: var(--vn-warning);
    }
    :host([type='danger']) {
      --_color: var(--vn-danger);
    }
    :host([type='info']) {
      --_color: var(--vn-info);
    }
    :host([type='success']),
    :host([type='warning']),
    :host([type='danger']),
    :host([type='info']) {
      --_border: var(--_color);
      --_bg: color-mix(in srgb, var(--_color) 8%, transparent);
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: var(--vn-space-1);
      padding: 1px var(--vn-space-2);
      border: var(--vn-border-thin) solid var(--_border);
      border-radius: var(--vn-radius-sm);
      background: var(--_bg);
      color: var(--_color);
      font-size: var(--vn-font-size-sm);
      line-height: 1.6;
      letter-spacing: var(--vn-tracking-wide);
      white-space: nowrap;
    }
    :host([size='sm']) .tag {
      padding: 0 6px;
      font-size: var(--vn-font-size-xs);
    }
    .close {
      display: grid;
      place-items: center;
      inline-size: 1.2em;
      block-size: 1.2em;
      margin-inline-end: -4px;
      padding: 0;
      border: 0;
      border-radius: var(--vn-radius-sm);
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      cursor: pointer;
    }
    .close:hover {
      background: color-mix(in srgb, currentColor 14%, transparent);
    }
    .close:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 1px;
    }
  `;

  render() {
    return html`
      <span class="tag" part="tag">
        <slot></slot>
        ${when(
          () => this.closable,
          () => html`<button class="close" part="close" type="button" aria-label=${() => `移除 ${this.textContent.trim()}`} @click=${this.dismiss}>×</button>`,
        )}
      </span>
    `;
  }

  /** 关闭：派发可取消的 vn-close，没被取消就移除自己 */
  dismiss() {
    if (this.emit('vn-close')) this.remove();
  }
}

VnTag.define();
