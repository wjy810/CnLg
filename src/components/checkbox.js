import { html, css } from '../core/index.js';
import { ToggleElement } from './toggle.js';

/**
 * <vn-checkbox> 复选框。勾是一笔朱批，选中时一笔画出。
 *
 * @attr {boolean} checked - 是否选中
 * @attr {string} value - 选中时提交的值，默认 on
 * @attr {string} name - 表单字段名
 * @attr {boolean} required - 必须勾选
 * @attr {boolean} disabled - 禁用
 * @slot - 标签文字
 * @fires input - 切换时
 * @fires change - 切换时
 * @csspart control - 可聚焦的整体（role=checkbox）
 * @csspart box - 方框
 */
export class VnCheckbox extends ToggleElement {
  static tag = 'vn-checkbox';

  static styles = css`
    :host {
      display: inline-block;
      color: var(--vn-fg);
    }
    .control {
      display: inline-flex;
      align-items: center;
      gap: var(--vn-space-2);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }
    .box {
      display: grid;
      place-items: center;
      flex: none;
      inline-size: 18px;
      block-size: 18px;
      border: 1.5px solid var(--vn-line-strong);
      border-radius: var(--vn-radius-sm);
      background: var(--vn-surface);
      transition: border-color var(--vn-duration-fast) var(--vn-ease-brush);
    }
    .control:hover .box {
      border-color: var(--vn-fg-muted);
    }
    :host([checked]) .box {
      border-color: var(--vn-accent-fg);
    }
    :host(:state(user-invalid)) .box {
      border-color: var(--vn-danger);
    }
    svg {
      inline-size: 20px;
      block-size: 20px;
      overflow: visible;
    }
    .tick {
      fill: none;
      stroke: var(--vn-accent-fg);
      stroke-width: 2.6;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      transition: stroke-dashoffset var(--vn-duration-normal) var(--vn-ease-brush);
    }
    :host([checked]) .tick {
      stroke-dashoffset: 0;
    }
    :host(:disabled) .control {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  render() {
    return html`
      <div
        class="control"
        part="control"
        role="checkbox"
        tabindex=${() => (this.isDisabled ? '-1' : '0')}
        aria-checked=${() => String(this.checked)}
        aria-disabled=${() => (this.isDisabled ? 'true' : null)}
        aria-required=${() => (this.required ? 'true' : null)}
        aria-invalid=${() => String(this.userInvalid)}
        @click=${this.toggle}
        @keydown=${this.handleKey}
      >
        <span class="box" part="box">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path class="tick" d="M4.5 10.5 8.6 14.4 15.8 5.2" /></svg>
        </span>
        <span class="label"><slot></slot></span>
      </div>
    `;
  }
}

VnCheckbox.define();
