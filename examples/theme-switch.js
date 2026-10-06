// 示例组件：昼 / 夜 / 随 切换。只用主题变量，所以自己也跟着主题变。
import { VunioElement, html, css } from '../src/index.js';
import { MODES, mode, setMode } from './stores/theme.js';

export class DemoThemeSwitch extends VunioElement {
  static tag = 'demo-theme-switch';

  static styles = css`
    :host {
      display: inline-flex;
    }
    .group {
      display: inline-flex;
      padding: 2px;
      border: var(--vn-border-thin) solid var(--vn-line-strong);
      border-radius: var(--vn-radius-sm);
    }
    button {
      min-inline-size: 36px;
      padding: var(--vn-space-1) var(--vn-space-2);
      border: 0;
      border-radius: 1px;
      background: transparent;
      color: var(--vn-fg-muted);
      font: inherit;
      font-size: var(--vn-font-size-sm);
      cursor: pointer;
      transition:
        background-color var(--vn-duration-fast) var(--vn-ease-standard),
        color var(--vn-duration-fast) var(--vn-ease-standard);
    }
    button:hover {
      color: var(--vn-fg);
    }
    button[aria-pressed='true'] {
      background: var(--vn-primary);
      color: var(--vn-on-primary);
    }
  `;

  render() {
    return html`
      <div class="group" role="group" aria-label="主题">
        ${MODES.map(
          ([value, label]) => html`
            <button
              type="button"
              aria-pressed=${() => String(mode.value === value)}
              title=${value === 'auto' ? '跟随系统' : `${label}间主题`}
              @click=${() => setMode(value)}
            >
              ${label}
            </button>
          `,
        )}
      </div>
    `;
  }
}

DemoThemeSwitch.define();
