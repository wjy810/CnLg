/**
 * VunioFormElement —— 表单控件的基类（输入框、下拉框、复选框、开关……）。
 *
 * 继承它的组件可以直接放进原生 <form>：
 * - 提交时出现在 FormData 里（name + formValue()）
 * - 支持 required、自定义校验、form.reset()、<fieldset disabled>、浏览器自动恢复
 * - 用户离开控件或提交失败后，带上 :state(user-invalid)，用它来显示错误样式
 *
 * value 的语义和原生 <input> 一致：
 * - value attribute 是默认值，value 属性是当前值；
 * - 用户（或代码）改过 value 属性之后，attribute 不再影响当前值；
 * - form.reset() 时回到 attribute 里的默认值。
 *
 * value、touched、userInvalid、isDisabled、validationMessage 都是响应式的，
 * 可以直接在模板里用：${() => (this.userInvalid ? this.validationMessage : '')}
 */
import { VunioElement } from './element.js';
import { batch, signal, untrack } from './signals.js';

export class VunioFormElement extends VunioElement {
  static formAssociated = true;
  /** @type {ShadowRootInit} */
  static shadowOptions = { mode: 'open', delegatesFocus: true };
  static props = {
    name: String,
    disabled: Boolean,
    required: Boolean,
  };

  static get observedAttributes() {
    return [...new Set([...super.observedAttributes, 'value'])];
  }

  #value = signal('');
  #dirty = false;
  #ready = false;
  #touched = signal(false);
  #formDisabled = signal(false);
  #userInvalid = signal(false);
  /** 每次重新校验时 +1，让 validity / validationMessage 可以被追踪 */
  #validityVersion = signal(0);
  #customMessage = '';

  connectedCallback() {
    super.connectedCallback();
    this.#ready = true;
    this.on(this, 'focusout', (event) => {
      if (event.relatedTarget !== this && !this.contains(event.relatedTarget)) this.#touch();
    });
    this.on(this, 'invalid', () => this.#touch());
    this.syncForm();
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (attr === 'value') {
      if (!this.#dirty) this.#setValue(newValue ?? '');
      return;
    }
    super.attributeChangedCallback(attr, oldValue, newValue);
    // required 等约束可能变了
    if (this.#ready) this.#syncValidity();
  }

  // ───────────────────────── 值 ─────────────────────────

  get value() {
    return this.#value.value;
  }

  set value(value) {
    this.#dirty = true;
    this.#setValue(value == null ? '' : String(value));
  }

  /** 禁用状态：自身 disabled 或所在 <fieldset disabled> */
  get isDisabled() {
    return Boolean(/** @type {any} */ (this).disabled) || this.#formDisabled.value;
  }

  /** 用户是否已经离开过这个控件（或提交过表单） */
  get touched() {
    return this.#touched.value;
  }

  /** 交互过且当前无效：用它决定是否显示错误 */
  get userInvalid() {
    return this.#userInvalid.value;
  }

  // ───────────────────────── 子类可以覆盖的部分 ─────────────────────────

  /** 提交到表单的值。返回 null 表示不提交（例如未勾选的复选框）。 */
  formValue() {
    return this.value;
  }

  /** 是否为空（用于 required 校验） */
  isEmpty() {
    return this.value === '';
  }

  /**
   * 校验当前值。返回 null 表示有效，否则返回 { flags, message }，
   * flags 是 ValidityState 的字段，例如 { valueMissing: true }。
   */
  validate() {
    if (this.hasAttribute('required') && this.isEmpty()) return { flags: { valueMissing: true }, message: '此项为必填' };
    return null;
  }

  /** 浏览器校验气泡指向的元素（通常是内部的 input） */
  get validationAnchor() {
    return undefined;
  }

  /** form.reset() 时恢复默认值 */
  resetValue() {
    this.#setValue(this.getAttribute('value') ?? '');
  }

  /** 把当前值和校验结果同步给表单。子类改了影响提交值的内部状态后调用。 */
  syncForm() {
    if (!this.#ready) return;
    untrack(() => this.internals.setFormValue(this.formValue()));
    this.#syncValidity();
  }

  // ───────────────────────── 原生表单控件的 API ─────────────────────────

  get form() {
    return this.internals.form;
  }

  get labels() {
    return this.internals.labels;
  }

  get validity() {
    this.#validityVersion.value;
    return this.internals.validity;
  }

  get validationMessage() {
    this.#validityVersion.value;
    return this.internals.validationMessage;
  }

  get willValidate() {
    return this.internals.willValidate;
  }

  checkValidity() {
    return this.internals.checkValidity();
  }

  reportValidity() {
    return this.internals.reportValidity();
  }

  /** 自定义错误信息，传空字符串清除 */
  setCustomValidity(message) {
    this.#customMessage = message ? String(message) : '';
    this.#syncValidity();
  }

  // ───────────────────────── 表单回调（浏览器调用） ─────────────────────────

  formResetCallback() {
    this.resetValue();
    this.#dirty = false;
    this.#touched.value = false;
    this.syncForm();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled.value = disabled;
    this.internals.ariaDisabled = disabled ? 'true' : null;
    this.requestUpdate('disabled');
  }

  formStateRestoreCallback(state) {
    if (typeof state === 'string') this.value = state;
  }

  // ───────────────────────── 内部 ─────────────────────────

  #setValue(value) {
    if (value === this.#value.peek()) return;
    batch(() => {
      this.#value.value = value;
      this.syncForm();
    });
    this.requestUpdate('value');
  }

  #touch() {
    if (this.#touched.peek()) return;
    this.#touched.value = true;
    this.#syncValidity();
  }

  #syncValidity() {
    if (!this.#ready) return;
    untrack(() => {
      const result = this.#customMessage
        ? { flags: { customError: true }, message: this.#customMessage }
        : this.validate();
      if (result) this.internals.setValidity(result.flags, result.message || '无效的值', this.validationAnchor);
      else this.internals.setValidity({});

      const userInvalid = this.#touched.peek() && !this.internals.validity.valid;
      this.setState('user-invalid', userInvalid);
      batch(() => {
        this.#userInvalid.value = userInvalid;
        this.#validityVersion.value = this.#validityVersion.peek() + 1;
      });
    });
    // 兼容 update(changed) 写法
    this.requestUpdate('validity');
  }
}
