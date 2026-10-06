// 示例组件：题字输入框。演示 VunioFormElement 的表单关联与校验。
import { VunioFormElement, html, css } from '../src/index.js';

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
        <span class="label" data-ref="label"></span>
        <input data-ref="input" part="input" />
      </label>
      <div class="error" data-ref="error" aria-live="polite"></div>
    `;
  }

  update(changed) {
    const { label, input, error } = this.refs;
    if (changed.has('label')) label.textContent = this.label;
    if (changed.has('placeholder')) input.placeholder = this.placeholder;
    if (changed.has('value') && input.value !== this.value) input.value = this.value;
    if (changed.has('disabled')) input.disabled = this.isDisabled;
    if (changed.has('required')) input.required = this.required;
    if (changed.has('validity')) {
      const show = this.hasState('user-invalid');
      error.textContent = show ? this.validationMessage : '';
      input.setAttribute('aria-invalid', String(show));
    }
  }

  mounted() {
    this.on(this.refs.input, 'input', () => {
      this.value = this.refs.input.value;
    });
    // change 事件不会穿出 Shadow DOM，需要在宿主上重新派发
    this.on(this.refs.input, 'change', () => this.emit('change'));
  }

  get validationAnchor() {
    return this.refs.input;
  }
}

DemoField.define();
