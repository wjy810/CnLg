import { VunioElement, html, css, signal, when } from '../core/index.js';
import { burst } from '../effects/burst.js';

/**
 * <vn-button> 按钮。默认墨色；朱砂色只给一个视图里最重要的操作。
 *
 * @attr {'ink'|'cinnabar'|'moon'|'text'} variant - 墨 · 朱砂 · 月白（描边）· 素（文字），默认 ink
 * @attr {'sm'|'md'|'lg'} size - 尺寸，默认 md
 * @attr {'ink'|'blossom'|'snow'|'wind'|'none'} effect - 点击效果，默认 ink（墨晕）
 * @attr {'button'|'submit'|'reset'} type - 在表单中的作用，默认 button
 * @attr {boolean} disabled - 禁用
 * @attr {boolean} loading - 加载中：禁止点击并显示墨圈
 * @attr {boolean} block - 占满一行
 * @slot - 文字
 * @slot prefix - 前置图标
 * @slot suffix - 后置图标
 * @csspart button - 内部的原生按钮
 */
export class VnButton extends VunioElement {
  static tag = 'vn-button';
  static formAssociated = true;
  /** @type {ShadowRootInit} */
  static shadowOptions = { mode: 'open', delegatesFocus: true };

  static props = {
    variant: { type: String, default: 'ink', values: ['ink', 'cinnabar', 'moon', 'text'] },
    size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] },
    effect: { type: String, default: 'ink', values: ['ink', 'blossom', 'snow', 'wind', 'none'] },
    type: { type: String, default: 'button', values: ['button', 'submit', 'reset'] },
    disabled: Boolean,
    loading: Boolean,
    block: Boolean,
  };

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
      vertical-align: middle;
      --_h: 40px;
      --_px: var(--vn-space-5);
      --_fs: var(--vn-font-size-md);
      /* 墨（默认） */
      --_bg: var(--vn-primary);
      --_fg: var(--vn-on-primary);
      --_hover: var(--vn-fg-strong);
      --_border: transparent;
      --_frame: color-mix(in srgb, var(--vn-on-primary) 30%, transparent);
    }
    :host([size='sm']) {
      --_h: 32px;
      --_px: var(--vn-space-3);
      --_fs: var(--vn-font-size-sm);
    }
    :host([size='lg']) {
      --_h: 48px;
      --_px: var(--vn-space-6);
      --_fs: var(--vn-font-size-lg);
    }
    :host([block]) {
      display: block;
    }
    :host([variant='cinnabar']) {
      --_bg: var(--vn-accent);
      --_fg: var(--vn-on-accent);
      --_hover: color-mix(in srgb, var(--vn-accent) 86%, var(--vn-fg-strong));
      --_frame: color-mix(in srgb, var(--vn-on-accent) 36%, transparent);
    }
    :host([variant='moon']) {
      --_bg: transparent;
      --_fg: var(--vn-fg);
      --_hover: var(--vn-surface-sunken);
      --_border: var(--vn-line-strong);
      --_frame: transparent;
    }
    :host([variant='text']) {
      --_bg: transparent;
      --_fg: var(--vn-fg);
      --_hover: transparent;
      --_frame: transparent;
      --_px: var(--vn-space-2);
    }

    button {
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--vn-space-2);
      inline-size: 100%;
      min-block-size: var(--_h);
      padding: 0 var(--_px);
      overflow: hidden;
      border: var(--vn-border-thin) solid var(--_border);
      border-radius: var(--vn-radius-sm);
      background: var(--_bg);
      color: var(--_fg);
      font: inherit;
      font-family: var(--vn-font-body);
      font-size: var(--_fs);
      line-height: 1;
      letter-spacing: var(--vn-tracking-wider);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      transition:
        background-color var(--vn-duration-fast) var(--vn-ease-standard),
        border-color var(--vn-duration-fast) var(--vn-ease-standard),
        color var(--vn-duration-fast) var(--vn-ease-standard),
        transform var(--vn-duration-instant) var(--vn-ease-standard);
    }
    /* 古籍边栏：距边 3px 的一道细线 */
    button::before {
      content: '';
      position: absolute;
      inset: 3px;
      border: var(--vn-border-thin) solid var(--_frame);
      border-radius: 1px;
      pointer-events: none;
    }
    button:hover:not(:disabled) {
      background: var(--_hover);
    }
    :host([variant='moon']) button:hover:not(:disabled) {
      border-color: var(--vn-fg);
    }
    button:active:not(:disabled) {
      transform: translateY(1px);
    }
    button:disabled {
      cursor: not-allowed;
    }
    :host([disabled]) button,
    :host(:disabled) button {
      opacity: 0.45;
    }

    /* 素：悬停时一道笔触从中间展开 */
    :host([variant='text']) button::after {
      content: '';
      position: absolute;
      inset-inline: var(--_px);
      inset-block-end: 6px;
      block-size: 4px;
      background: currentColor;
      -webkit-mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      transform: scaleX(0);
      transition: transform var(--vn-duration-normal) var(--vn-ease-enter);
    }
    :host([variant='text']) button:hover:not(:disabled)::after {
      transform: scaleX(1);
    }

    .label {
      /* 抵消最后一个字后面的字距，让文字真正居中 */
      margin-inline-end: calc(-1 * var(--vn-tracking-wider));
      white-space: nowrap;
    }
    :host([loading]) .label {
      opacity: 0.6;
    }
    .wash {
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      --vn-burst-ink: currentColor;
    }
    .fx {
      position: absolute;
      inset: 0;
      overflow: visible;
      pointer-events: none;
    }
    .spinner {
      inline-size: 1em;
      block-size: 1em;
      border: 1.5px solid currentColor;
      border-inline-end-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(1turn);
      }
    }
  `;

  #fieldsetDisabled = signal(false);

  render() {
    return html`
      <button
        part="button"
        data-ref="button"
        type="button"
        ?disabled=${() => this.disabled || this.loading || this.#fieldsetDisabled.value}
        aria-busy=${() => (this.loading ? 'true' : null)}
        @click=${this.handleClick}
      >
        <span class="wash" data-ref="wash" aria-hidden="true"></span>
        ${when(
          () => this.loading,
          () => html`<span class="spinner" aria-hidden="true"></span>`,
        )}
        <slot name="prefix"></slot>
        <span class="label"><slot></slot></span>
        <slot name="suffix"></slot>
      </button>
      <span class="fx" data-ref="fx" aria-hidden="true"></span>
    `;
  }

  /** <fieldset disabled> 中也要禁用 */
  formDisabledCallback(disabled) {
    this.#fieldsetDisabled.value = disabled;
  }

  handleClick(event) {
    const effect = this.effect;
    if (effect !== 'none') {
      const rect = this.refs.button.getBoundingClientRect();
      // 键盘触发（detail 为 0）时从中心发出
      const fromPointer = event.detail > 0;
      burst(effect, effect === 'ink' ? this.refs.wash : this.refs.fx, {
        x: fromPointer ? event.clientX - rect.left : rect.width / 2,
        y: fromPointer ? event.clientY - rect.top : rect.height / 2,
        animate: this.animate.bind(this),
      });
    }
    // 用原型上的方法：表单里若有 id/name 为 reset、submit 的控件，form.reset 会被它“覆盖”
    const form = this.internals.form;
    if (!form) return;
    if (this.type === 'submit') HTMLFormElement.prototype.requestSubmit.call(form);
    else if (this.type === 'reset') HTMLFormElement.prototype.reset.call(form);
  }
}

VnButton.define();
