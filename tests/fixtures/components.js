// 测试用组件：覆盖 VunioElement / VunioFormElement 的每个能力
import { VunioElement, VunioFormElement, html, css } from '../../src/index.js';

export class TBasic extends VunioElement {
  static tag = 't-basic';
  static props = {
    label: String,
    size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] },
    count: { type: Number, default: 1 },
    open: Boolean,
    maxLength: { type: Number, default: 10 },
    items: { type: Array, default: () => [] },
  };
  static styles = css`
    :host {
      display: block;
      color: rgb(1, 2, 3);
    }
  `;

  renders = 0;
  updates = [];

  render() {
    this.renders++;
    return html`<span data-ref="label"></span><b data-ref="size"></b><i data-ref="items"></i><slot></slot>`;
  }

  update(changed) {
    this.updates.push({ initial: changed.initial, keys: [...changed].sort() });
    if (changed.has('label')) this.refs.label.textContent = this.label;
    if (changed.has('size')) this.refs.size.textContent = this.size;
    if (changed.has('items')) this.refs.items.textContent = this.items.join(',');
  }

  fire() {
    return this.emit('t-fire', { from: this.label });
  }
}

/** 升级前就被赋值的组件（测试里再注册） */
export class TLate extends VunioElement {
  static tag = 't-late';
  static props = { label: String, items: { type: Array, default: () => [] } };

  render() {
    return html`<span data-ref="label"></span>`;
  }

  update(changed) {
    if (changed.has('label')) this.refs.label.textContent = this.label;
  }
}

export const life = { mounted: 0, unmounted: 0, clicks: 0, frames: 0, timeouts: 0, resizes: 0, cleanups: 0 };

export class TLife extends VunioElement {
  static tag = 't-life';

  render() {
    return html`<div data-ref="box" style="width: 10px; height: 10px"></div>`;
  }

  mounted() {
    life.mounted++;
    this.on(document, 'click', () => life.clicks++);
    this.timeout(() => life.timeouts++, 30);
    this.loop(() => {
      life.frames++;
    });
    this.observeResize(this.refs.box, () => life.resizes++);
    this.onCleanup(() => life.cleanups++);
    this.fade = this.animate(this.refs.box, [{ opacity: 0 }, { opacity: 1 }], 5000);
  }

  unmounted() {
    life.unmounted++;
  }
}

export class TSlot extends VunioElement {
  static tag = 't-slot';
  static styles = css`
    .title {
      display: none;
    }
    :host(:state(has-title)) .title {
      display: block;
    }
  `;

  calls = [];

  render() {
    return html`<div class="title" data-ref="title"><slot name="title"></slot></div><slot></slot>`;
  }

  mounted() {
    this.watchSlot('title', (has) => this.calls.push(has));
  }
}

export class TField extends VunioFormElement {
  static tag = 't-field';
  static props = { minLength: { type: Number, default: 0 } };

  render() {
    return html`<input data-ref="input" /><span data-ref="error"></span>`;
  }

  mounted() {
    this.on(this.refs.input, 'input', () => {
      this.value = this.refs.input.value;
    });
  }

  update(changed) {
    if (changed.has('value') && this.refs.input.value !== this.value) this.refs.input.value = this.value;
    if (changed.has('disabled')) this.refs.input.disabled = this.isDisabled;
    if (changed.has('validity')) {
      this.refs.error.textContent = this.hasState('user-invalid') ? this.validationMessage : '';
    }
  }

  validate() {
    const base = super.validate();
    if (base) return base;
    if (this.minLength && this.value.length < this.minLength) {
      return { flags: { tooShort: true }, message: `至少 ${this.minLength} 个字` };
    }
    return null;
  }

  get validationAnchor() {
    return this.refs.input;
  }
}

/** 升级前就被设置 value 的表单组件（测试里再注册） */
export class TLateField extends TField {
  static tag = 't-late-field';
}

for (const cls of [TBasic, TLife, TSlot, TField]) cls.define();
