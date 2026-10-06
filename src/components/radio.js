import { VunioElement, VunioFormElement, html, css, signal, when } from '../core/index.js';

/**
 * <vn-radio-group> 单选：一组 <vn-radio> 中选一个。值在组上，直接放进 <form>。
 * 键盘遵循 WAI-ARIA APG「Radio Group」：组内只有一个可聚焦的选项，方向键移动并选中。
 *
 * @attr {string} label - 标签（也是读屏名称）
 * @attr {string} hint - 帮助文字（出错时被错误信息替换）
 * @attr {string} name - 表单字段名
 * @attr {string} value - 默认选中的值
 * @attr {boolean} required - 必选
 * @attr {boolean} disabled - 禁用
 * @attr {'column'|'row'} direction - 排列方向，默认 column
 * @slot - <vn-radio>
 * @fires input - 选中项变化时
 * @fires change - 选中项变化时
 * @csspart label - 标签
 * @csspart options - 选项容器
 * @csspart message - 提示 / 错误
 */
export class VnRadioGroup extends VunioFormElement {
  static tag = 'vn-radio-group';
  /** 焦点由组自己管理（落在选中项上），不委托给 Shadow DOM */
  static shadowOptions = { mode: 'open' };

  static props = {
    label: String,
    hint: String,
    direction: { type: String, default: 'column', values: ['column', 'row'] },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
    }
    .group {
      display: grid;
      gap: var(--vn-space-2);
    }
    .label {
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
    }
    .required {
      color: var(--vn-danger);
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: var(--vn-space-2);
    }
    :host([direction='row']) .options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--vn-space-2) var(--vn-space-5);
    }
    .message {
      min-block-size: 1.5em;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-xs);
    }
    :host(:state(user-invalid)) .message {
      color: var(--vn-danger);
    }
  `;

  /** 组内的选项 */
  radios = signal(/** @type {VnRadio[]} */ ([]));

  render() {
    return html`
      <div
        class="group"
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="message"
        aria-required=${() => (this.required ? 'true' : null)}
        aria-invalid=${() => String(this.userInvalid)}
        aria-disabled=${() => (this.isDisabled ? 'true' : null)}
      >
        <span class="label" id="label" part="label" ?hidden=${() => !this.label}>
          ${() => this.label}${when(
            () => this.required,
            () => html`<span class="required" aria-hidden="true"> *</span>`,
          )}
        </span>
        <div class="options" part="options"><slot @slotchange=${this.collect}></slot></div>
        <span class="message" id="message" part="message">${() => (this.userInvalid ? this.validationMessage : this.hint)}</span>
      </div>
    `;
  }

  mounted() {
    this.collect();
    this.on(this, 'click', (event) => {
      const radio = /** @type {Element} */ (event.target).closest?.('vn-radio');
      if (radio instanceof VnRadio && radio.parentElement === this) this.select(radio);
    });
    this.on(this, 'keydown', this.handleKeydown);
    // 选中状态与可聚焦的那一项
    this.effect(() => {
      const radios = this.radios.value;
      const value = this.value;
      const groupDisabled = this.isDisabled;
      const enabled = radios.filter((r) => !r.disabled && !groupDisabled);
      const checked = radios.find((r) => r.value === value) ?? null;
      const focusable = checked && enabled.includes(checked) ? checked : enabled[0] ?? null;
      for (const radio of radios) {
        radio.setChecked(radio === checked);
        radio.setDisabled(groupDisabled || radio.disabled);
        radio.tabIndex = radio === focusable ? 0 : -1;
      }
    });
  }

  collect() {
    const slot = this.root.querySelector('slot');
    if (!slot) return;
    this.radios.value = slot.assignedElements().filter((el) => el instanceof VnRadio);
  }

  /** 选中某一项（禁用项不可选） */
  select(radio, { focus = false } = {}) {
    if (this.isDisabled || radio.disabled) return;
    if (focus) radio.focus();
    if (radio.value === this.value) return;
    this.value = radio.value;
    this.emit('input');
    this.emit('change');
  }

  handleKeydown(event) {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const radio = /** @type {Element} */ (event.target).closest?.('vn-radio');
    if (!(radio instanceof VnRadio)) return;
    if (event.key === ' ') {
      event.preventDefault();
      this.select(radio);
      return;
    }
    const step = keys[event.key];
    if (!step || this.isDisabled) return;
    event.preventDefault();
    const enabled = this.radios.peek().filter((r) => !r.disabled);
    if (!enabled.length) return;
    const index = enabled.indexOf(radio);
    const next = enabled[(index + step + enabled.length) % enabled.length];
    this.select(next, { focus: true });
  }

  formValue() {
    return this.value === '' ? null : this.value;
  }

  validate() {
    if (this.required && this.value === '') return { flags: { valueMissing: true }, message: '请选择一项' };
    return null;
  }

  get validationAnchor() {
    return this.radios.peek().find((r) => r.tabIndex === 0);
  }
}

/**
 * <vn-radio> 单选中的一项，放在 <vn-radio-group> 里。
 *
 * @attr {string} value - 选中时组的值
 * @attr {boolean} disabled - 禁用
 * @slot - 文字
 * @csspart control - 圆点
 * @csspart label - 文字
 */
export class VnRadio extends VunioElement {
  static tag = 'vn-radio';

  static props = {
    value: String,
    disabled: Boolean,
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--vn-space-2);
      color: var(--vn-fg);
      cursor: pointer;
      user-select: none;
      outline: none;
    }
    :host(:state(disabled)) {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .control {
      display: grid;
      place-items: center;
      flex: none;
      inline-size: 18px;
      block-size: 18px;
      border: 1.5px solid var(--vn-line-strong);
      border-radius: var(--vn-radius-full);
      transition: border-color var(--vn-duration-fast) var(--vn-ease-standard);
    }
    :host(:hover:not(:state(disabled))) .control {
      border-color: var(--vn-fg-muted);
    }
    :host(:state(checked)) .control {
      border-color: var(--vn-accent);
    }
    /* 选中时一点落下 */
    .dot {
      inline-size: 8px;
      block-size: 8px;
      border-radius: inherit;
      background: var(--vn-accent);
      transform: scale(0);
      transition: transform var(--vn-duration-normal) var(--vn-ease-spring);
    }
    :host(:state(checked)) .dot {
      transform: scale(1);
    }
    :host(:focus-visible) .control {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
    }
  `;

  #checked = signal(false);
  #disabled = signal(false);

  get checked() {
    return this.#checked.value;
  }

  /** 由 <vn-radio-group> 调用 */
  setChecked(checked) {
    this.#checked.value = checked;
  }

  /** 由 <vn-radio-group> 调用：自身或整组禁用 */
  setDisabled(disabled) {
    this.#disabled.value = disabled;
  }

  render() {
    return html`
      <span class="control" part="control" aria-hidden="true"><span class="dot"></span></span>
      <span class="label" part="label"><slot></slot></span>
    `;
  }

  mounted() {
    this.internals.role = 'radio';
    this.effect(() => {
      const checked = this.#checked.value;
      const disabled = this.#disabled.value || this.disabled;
      this.internals.ariaChecked = String(checked);
      this.internals.ariaDisabled = disabled ? 'true' : null;
      this.setState('checked', checked);
      this.setState('disabled', disabled);
    });
  }
}

// 先注册选项：页面里已有的组升级时，选项已经是 VnRadio
VnRadio.define();
VnRadioGroup.define();
