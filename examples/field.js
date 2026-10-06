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
      color: #2b2a27;
    }
    label {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: 13px;
      letter-spacing: 0.2em;
      color: #8b847a;
    }
    input {
      inline-size: 100%;
      padding: 6px 2px;
      border: 0;
      border-block-end: 1px solid rgba(43, 42, 39, 0.25);
      background: transparent;
      font: inherit;
      font-size: 17px;
      color: inherit;
      outline: none;
      transition: border-color 0.3s;
    }
    input:focus {
      border-block-end-color: #2b2a27;
    }
    input::placeholder {
      color: #b8b0a3;
    }
    .error {
      min-block-size: 1.4em;
      font-size: 12px;
      color: #b5352a;
    }
    :host(:state(user-invalid)) input {
      border-block-end-color: #b5352a;
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
