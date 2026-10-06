import { html, css } from '../core/index.js';
import { DialogElement, dialogStyles, tokenDuration } from './dialog-base.js';

/**
 * <vn-modal> 弹窗：一幅立轴，打开时从中间向上下展开。基于原生 <dialog>。
 *
 * @attr {string} heading - 标题
 * @attr {boolean} open - 是否打开
 * @attr {boolean} persistent - 点遮罩、按 Esc 不关闭
 * @slot - 正文
 * @slot footer - 底部操作
 * @fires vn-open - 打开后
 * @fires vn-close - 关闭后，detail.returnValue 为关闭原因：'esc' | 'backdrop' | 'close-button' | 传给 close() 的值
 * @csspart dialog - 原生 dialog
 * @csspart paper - 纸面
 * @csspart heading - 标题
 * @csspart body - 正文
 * @csspart footer - 底部
 */
export class VnModal extends DialogElement {
  static tag = 'vn-modal';

  static styles = [
    dialogStyles,
    css`
      dialog {
        inline-size: min(560px, calc(100vw - 32px));
        max-block-size: calc(100dvh - 32px);
        overflow: visible;
      }
      .scroll {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      /* 轴杆：木色，两端鎏金轴头 */
      .rod {
        position: relative;
        z-index: 1;
        inline-size: calc(100% + 20px);
        block-size: 12px;
        border-radius: 6px;
        background: linear-gradient(
          color-mix(in srgb, var(--vn-frame) 70%, white),
          var(--vn-frame) 45%,
          color-mix(in srgb, var(--vn-frame) 75%, black)
        );
        box-shadow: var(--vn-shadow-1);
      }
      .rod::before,
      .rod::after {
        content: '';
        position: absolute;
        inset-block-start: -3px;
        inline-size: 12px;
        block-size: 18px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--vn-trim) 75%, black),
          color-mix(in srgb, var(--vn-trim) 70%, white) 45%,
          var(--vn-trim)
        );
      }
      .rod::before {
        inset-inline-start: -8px;
      }
      .rod::after {
        inset-inline-end: -8px;
      }
      .paper {
        box-sizing: border-box;
        inline-size: 100%;
        max-block-size: calc(100dvh - 32px - 24px);
        margin-block: -4px;
        padding: var(--vn-space-6) var(--vn-space-6) var(--vn-space-5);
        overflow: auto;
        background-color: var(--vn-surface);
        background-image: var(--vn-texture);
        box-shadow: var(--vn-shadow-3);
      }
    `,
  ];

  render() {
    return html`
      <dialog
        part="dialog"
        data-ref="dialog"
        aria-labelledby="heading"
        @cancel=${this.handleCancel}
        @click=${this.handleBackdrop}
        @close=${this.handleNativeClose}
      >
        <div class="scroll">
          <span class="rod" data-ref="rodTop" aria-hidden="true"></span>
          <div class="paper" part="paper" data-ref="paper">
            <header class="header">
              <h2 class="heading" id="heading" part="heading">${() => this.heading}</h2>
              <button class="close" type="button" aria-label="关闭" @click=${() => this.close('close-button')}>×</button>
            </header>
            <div class="body" part="body"><slot></slot></div>
            <footer class="footer" part="footer"><slot name="footer"></slot></footer>
          </div>
          <span class="rod" data-ref="rodBottom" aria-hidden="true"></span>
        </div>
      </dialog>
    `;
  }

  enterAnimations() {
    const { dialog, paper, rodTop, rodBottom } = this.refs;
    const half = paper.offsetHeight / 2;
    const timing = { duration: tokenDuration(this, 'slow', 600) + 100, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
    return [
      this.animate(paper, [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], timing),
      this.animate(rodTop, [{ transform: `translateY(${half}px)` }, { transform: 'none' }], timing),
      this.animate(rodBottom, [{ transform: `translateY(${-half}px)` }, { transform: 'none' }], timing),
      this.animate(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: timing.duration / 2 }),
      this.animateBackdrop([{ opacity: 0 }, { opacity: 1 }], { duration: timing.duration / 2 }),
    ];
  }

  exitAnimations() {
    const { dialog, paper, rodTop, rodBottom } = this.refs;
    const half = paper.offsetHeight / 2;
    const timing = { duration: tokenDuration(this, 'normal', 320), easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' };
    return [
      this.animate(paper, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(50% 0 50% 0)' }], timing),
      this.animate(rodTop, [{ transform: 'none' }, { transform: `translateY(${half}px)` }], timing),
      this.animate(rodBottom, [{ transform: 'none' }, { transform: `translateY(${-half}px)` }], timing),
      this.animate(dialog, [{ opacity: 1 }, { opacity: 0 }], timing),
      this.animateBackdrop([{ opacity: 1 }, { opacity: 0 }], timing),
    ];
  }
}

VnModal.define();
