import { html, css } from '../core/index.js';
import { ToggleElement } from './toggle.js';

/**
 * <vn-switch> 开关。滑块是一枚玉璧；variant="moon" 时关为日、开为月。
 *
 * @attr {boolean} checked - 是否打开
 * @attr {'default'|'moon'} variant - 外观，默认 default
 * @attr {string} value - 打开时提交的值，默认 on
 * @attr {string} name - 表单字段名
 * @attr {boolean} required - 必须打开
 * @attr {boolean} disabled - 禁用
 * @slot - 标签文字
 * @fires input - 切换时
 * @fires change - 切换时
 * @csspart control - 可聚焦的整体（role=switch）
 * @csspart track - 轨道
 * @csspart thumb - 滑块
 */
export class VnSwitch extends ToggleElement {
  static tag = 'vn-switch';

  static props = {
    variant: { type: String, default: 'default', values: ['default', 'moon'] },
  };

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
    .track {
      position: relative;
      flex: none;
      inline-size: 42px;
      block-size: 24px;
      border: 1.5px solid var(--vn-line-strong);
      border-radius: var(--vn-radius-full);
      background: var(--vn-surface-sunken);
      transition:
        background-color var(--vn-duration-normal) var(--vn-ease-brush),
        border-color var(--vn-duration-normal) var(--vn-ease-brush);
    }
    .thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 17px;
      block-size: 17px;
      border-radius: 50%;
      /* 玉璧：中间有孔 */
      background: radial-gradient(circle, transparent 0 22%, var(--vn-surface) 25%);
      box-shadow:
        0 0 0 1px var(--vn-line-strong),
        var(--vn-shadow-1);
      transition:
        transform var(--vn-duration-normal) var(--vn-ease-wind),
        background var(--vn-duration-normal) var(--vn-ease-brush),
        box-shadow var(--vn-duration-normal) var(--vn-ease-brush);
    }
    :host([checked]) .track {
      border-color: var(--vn-accent);
      background: var(--vn-accent);
    }
    :host([checked]) .thumb {
      transform: translateX(18px);
      box-shadow: var(--vn-shadow-1);
    }
    .control:hover .track {
      border-color: var(--vn-fg-muted);
    }
    :host([checked]) .control:hover .track {
      border-color: var(--vn-accent);
    }

    /* 日月：关为日（泥金），开为一弯新月，轨道成夜色 */
    :host([variant='moon']) .thumb {
      background: var(--vn-warning);
      box-shadow: 0 0 6px color-mix(in srgb, var(--vn-warning) 60%, transparent);
    }
    :host([variant='moon'][checked]) .track {
      border-color: transparent;
      background: var(--vn-night-sky);
    }
    :host([variant='moon'][checked]) .thumb {
      background: transparent;
      box-shadow: inset -5px -2px 0 0 var(--vn-moon);
    }

    :host(:state(user-invalid)) .track {
      border-color: var(--vn-danger);
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
        role="switch"
        tabindex=${() => (this.isDisabled ? '-1' : '0')}
        aria-checked=${() => String(this.checked)}
        aria-disabled=${() => (this.isDisabled ? 'true' : null)}
        aria-required=${() => (this.required ? 'true' : null)}
        @click=${this.toggle}
        @keydown=${this.handleKey}
      >
        <span class="track" part="track"><span class="thumb" part="thumb"></span></span>
        <span class="label"><slot></slot></span>
      </div>
    `;
  }
}

VnSwitch.define();
