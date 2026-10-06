// 示例组件：题字输入框。演示 VunioFormElement 的表单关联，以及纯模板写法的校验提示。
import { VunioFormElement, html, css, computed } from '../src/index.js';

export class DemoField extends VunioFormElement {
  static tag = 'demo-field';

  static props = {
    label: String,
    placeholder: String,
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
    }
    label {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
      color: var(--vn-fg-muted);
    }
    input {
      inline-size: 100%;
      padding: 6px 2px;
      border: 0;
      border-block-end: var(--vn-border-thin) solid var(--vn-line-strong);
      background: transparent;
      font: inherit;
      font-size: var(--vn-font-size-lg);
      color: inherit;
      outline: none;
      transition: border-color var(--vn-duration-normal) var(--vn-ease-standard);
    }
    input:focus {
      border-block-end-color: var(--vn-fg);
    }
    input::placeholder {
      color: var(--vn-fg-muted);
    }
    .error {
      min-block-size: 1.4em;
      font-size: var(--vn-font-size-xs);
      color: var(--vn-danger);
    }
    :host(:state(user-invalid)) input {
      border-block-end-color: var(--vn-danger);
    }
    :host(:disabled) {
      opacity: 0.5;
    }
  `;

  render() {
    return html`
      <label>
        <span class="label">${() => this.label}</span>
        <input
          part="input"
          data-ref="input"
          placeholder=${() => this.placeholder}
          .value=${computed(() => this.value)}
          ?required=${() => this.required}
          ?disabled=${() => this.isDisabled}
          aria-invalid=${() => String(this.userInvalid)}
          @input=${this.handleInput}
          @change=${() => this.emit('change')}
        />
      </label>
      <div class="error" aria-live="polite">${() => (this.userInvalid ? this.validationMessage : '')}</div>
    `;
  }

  handleInput(event) {
    this.value = event.target.value;
  }

  get validationAnchor() {
    return this.refs.input;
  }
}

DemoField.define();
