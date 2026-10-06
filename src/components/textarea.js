import { VunioFormElement, html, css, computed, when } from '../core/index.js';
import { fieldStyles, validateText } from './shared.js';

const supportsFieldSizing = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

/**
 * <vn-textarea> 多行输入：与输入框相同的标签、提示、校验与字数统计。
 *
 * @attr {string} label - 标签
 * @attr {string} placeholder - 占位文字
 * @attr {string} hint - 帮助文字（出错时被错误信息替换）
 * @attr {string} name - 表单字段名
 * @attr {string} value - 默认值
 * @attr {number} rows - 可见行数，默认 3
 * @attr {boolean} autosize - 随内容长高
 * @attr {boolean} required - 必填
 * @attr {boolean} disabled - 禁用
 * @attr {boolean} readonly - 只读
 * @attr {number} minlength - 最少字数
 * @attr {number} maxlength - 最多字数（显示字数统计）
 * @fires input - 输入时
 * @fires change - 提交修改时
 * @csspart textarea - 内部的原生 textarea
 * @csspart label - 标签
 * @csspart message - 提示 / 错误
 */
export class VnTextarea extends VunioFormElement {
  static tag = 'vn-textarea';

  static props = {
    label: String,
    placeholder: String,
    hint: String,
    rows: { type: Number, default: 3 },
    autosize: Boolean,
    readonly: Boolean,
    minlength: Number,
    maxlength: Number,
  };

  static styles = [
    fieldStyles,
    css`
      .control {
        align-items: stretch;
      }
      textarea {
        flex: 1;
        min-inline-size: 0;
        padding: 8px 2px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: var(--vn-font-size-md);
        line-height: var(--vn-leading-normal);
        resize: vertical;
        outline: none;
      }
      textarea::placeholder {
        color: var(--vn-fg-muted);
      }
      :host([autosize]) textarea {
        field-sizing: content;
        resize: none;
        overflow: hidden;
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
          <textarea
            data-ref="textarea"
            part="textarea"
            rows=${() => this.rows || 3}
            placeholder=${() => this.placeholder || null}
            .value=${computed(() => this.value)}
            ?required=${() => this.required}
            ?readonly=${() => this.readonly}
            ?disabled=${() => this.isDisabled}
            minlength=${() => this.minlength || null}
            maxlength=${() => this.maxlength || null}
            aria-invalid=${() => String(this.userInvalid)}
            aria-describedby="message"
            @input=${this.handleInput}
            @change=${() => this.emit('change')}
          ></textarea>
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

  mounted() {
    // 不支持 field-sizing 的浏览器：按内容高度手动撑开
    if (supportsFieldSizing) return;
    this.effect(() => {
      this.value;
      if (!this.autosize) return;
      const textarea = this.refs.textarea;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }

  handleInput(event) {
    this.value = event.target.value;
  }

  validate() {
    return validateText(this.value, this);
  }

  get validationAnchor() {
    return this.refs.textarea;
  }
}

VnTextarea.define();
