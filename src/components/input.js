import { VunioFormElement, html, css, computed, when } from '../core/index.js';
import { fieldStyles, validateText } from './shared.js';

const TYPE_MESSAGES = {
  email: '请输入有效的邮箱地址',
  url: '请输入有效的网址',
};

/** 用离屏 input 判断类型是否匹配（不依赖界面上 input 的更新时机） */
const probes = {};
function typeMismatch(type, value) {
  if (!TYPE_MESSAGES[type]) return false;
  const probe = (probes[type] ??= Object.assign(document.createElement('input'), { type }));
  probe.value = value;
  return probe.validity.typeMismatch;
}

/**
 * <vn-input> 输入框：信笺式下划线，聚焦时一道笔触从中间展开。
 *
 * @attr {string} label - 标签
 * @attr {string} placeholder - 占位文字
 * @attr {string} hint - 帮助文字（出错时被错误信息替换）
 * @attr {'text'|'password'|'email'|'url'|'tel'|'search'|'number'} type - 类型，默认 text
 * @attr {string} name - 表单字段名
 * @attr {string} value - 默认值
 * @attr {boolean} required - 必填
 * @attr {boolean} disabled - 禁用
 * @attr {boolean} readonly - 只读
 * @attr {number} minlength - 最少字数
 * @attr {number} maxlength - 最多字数（显示字数统计）
 * @attr {string} pattern - 正则
 * @attr {boolean} clearable - 显示清除按钮
 * @attr {string} autocomplete - 透传
 * @attr {string} inputmode - 透传
 * @slot prefix - 前置内容
 * @slot suffix - 后置内容
 * @fires input - 输入时
 * @fires change - 提交修改时
 * @csspart input - 内部的原生 input
 * @csspart label - 标签
 * @csspart message - 提示 / 错误
 */
export class VnInput extends VunioFormElement {
  static tag = 'vn-input';

  static props = {
    label: String,
    placeholder: String,
    hint: String,
    type: { type: String, default: 'text', values: ['text', 'password', 'email', 'url', 'tel', 'search', 'number'] },
    readonly: Boolean,
    minlength: Number,
    maxlength: Number,
    pattern: String,
    clearable: Boolean,
    autocomplete: String,
    inputmode: String,
  };

  static styles = [
    fieldStyles,
    css`
      input {
        flex: 1;
        min-inline-size: 0;
        padding: 6px 2px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: var(--vn-font-size-lg);
        outline: none;
      }
      input::placeholder {
        color: var(--vn-fg-muted);
      }
      .clear {
        display: grid;
        place-items: center;
        inline-size: 24px;
        block-size: 24px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--vn-fg-muted);
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
      }
      .clear:hover {
        background: var(--vn-surface-sunken);
        color: var(--vn-fg);
      }
      ::slotted([slot='prefix']),
      ::slotted([slot='suffix']) {
        color: var(--vn-fg-muted);
      }
    `,
  ];

  render() {
    return html`
      <label class="field" part="field">
        <span class="label" part="label" ?hidden=${() => !this.label}>
          ${() => this.label}${when(
            () => this.required,
            () => html`<span class="required" aria-hidden="true"> *</span>`,
          )}
        </span>
        <span class="control">
          <slot name="prefix"></slot>
          <input
            data-ref="input"
            part="input"
            type=${() => this.type}
            placeholder=${() => this.placeholder || null}
            .value=${computed(() => this.value)}
            ?required=${() => this.required}
            ?readonly=${() => this.readonly}
            ?disabled=${() => this.isDisabled}
            minlength=${() => this.minlength || null}
            maxlength=${() => this.maxlength || null}
            pattern=${() => this.pattern || null}
            autocomplete=${() => this.autocomplete || null}
            inputmode=${() => this.inputmode || null}
            aria-invalid=${() => String(this.userInvalid)}
            aria-describedby="message"
            @input=${this.handleInput}
            @change=${() => this.emit('change')}
          />
          ${when(
            () => this.clearable && this.value && !this.isDisabled && !this.readonly,
            () => html`<button class="clear" type="button" aria-label="清除" @click=${this.clear}>×</button>`,
          )}
          <slot name="suffix"></slot>
          <span class="underline" aria-hidden="true"></span>
        </span>
        <span class="message" id="message" part="message">
          <span>${() => (this.userInvalid ? this.validationMessage : this.hint)}</span>
          ${when(
            () => this.maxlength > 0,
            () => html`<span class="count">${() => `${[...this.value].length} / ${this.maxlength}`}</span>`,
          )}
        </span>
      </label>
    `;
  }

  handleInput(event) {
    this.value = event.target.value;
  }

  /** 清空并聚焦 */
  clear() {
    this.value = '';
    this.emit('input');
    this.emit('change');
    this.refs.input.focus();
  }

  validate() {
    const value = this.value;
    const text = validateText(value, this);
    if (text || value === '') return text;
    if (this.type === 'number' && Number.isNaN(Number(value))) {
      return { flags: { badInput: true }, message: '请输入数字' };
    }
    if (typeMismatch(this.type, value)) return { flags: { typeMismatch: true }, message: TYPE_MESSAGES[this.type] };
    return null;
  }

  get validationAnchor() {
    return this.refs.input;
  }
}

VnInput.define();
