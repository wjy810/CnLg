import { html, css } from '../core/index.js';
import { DialogElement, dialogStyles, tokenDuration } from './dialog-base.js';

const OFFSCREEN = {
  right: 'translateX(100%)',
  left: 'translateX(-100%)',
  top: 'translateY(-100%)',
  bottom: 'translateY(100%)',
};

/**
 * <vn-drawer> 抽屉：从页面边缘滑出的面板，像拉开一扇纸门。与 <vn-modal> 共用基于 <dialog> 的行为：
 * 背景不可操作、焦点留在抽屉内、Esc / 点遮罩关闭、关闭后焦点回到原处。
 *
 * @attr {string} heading - 标题
 * @attr {'right'|'left'|'top'|'bottom'} placement - 从哪一边滑出，默认 right
 * @attr {boolean} open - 是否打开
 * @attr {boolean} persistent - 点遮罩、按 Esc 不关闭
 * @slot - 正文
 * @slot footer - 底部操作
 * @fires vn-open - 打开后
 * @fires vn-close - 关闭后，detail.returnValue 为关闭原因：'esc' | 'backdrop' | 'close-button' | 传给 close() 的值
 * @cssprop --vn-drawer-size - 左右抽屉的宽度、上下抽屉的高度，默认 min(420px, 90vw) / min(360px, 80vh)
 * @csspart dialog - 原生 dialog
 * @csspart panel - 面板
 * @csspart heading - 标题
 * @csspart body - 正文
 * @csspart footer - 底部
 */
export class VnDrawer extends DialogElement {
  static tag = 'vn-drawer';

  static props = {
    placement: { type: String, default: 'right', values: ['right', 'left', 'top', 'bottom'] },
  };

  static styles = [
    dialogStyles,
    css`
      dialog {
        position: fixed;
        inset: 0 0 0 auto;
        inline-size: var(--vn-drawer-size, min(420px, 90vw));
        block-size: 100dvh;
        max-block-size: none;
        margin: 0;
      }
      :host([placement='left']) dialog {
        inset: 0 auto 0 0;
      }
      :host([placement='top']) dialog,
      :host([placement='bottom']) dialog {
        inline-size: 100vw;
        block-size: var(--vn-drawer-size, min(360px, 80vh));
      }
      :host([placement='top']) dialog {
        inset: 0 0 auto 0;
      }
      :host([placement='bottom']) dialog {
        inset: auto 0 0 0;
      }
      .panel {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        block-size: 100%;
        padding: var(--vn-space-6) var(--vn-space-6) var(--vn-space-5);
        overflow: auto;
        background-color: var(--vn-surface);
        background-image: var(--vn-texture);
        box-shadow: var(--vn-shadow-3);
      }
      /* 靠页面内侧的一道边：纸门的门框 */
      :host(:not([placement])) .panel,
      :host([placement='right']) .panel {
        border-inline-start: 3px solid var(--vn-frame);
      }
      :host([placement='left']) .panel {
        border-inline-end: 3px solid var(--vn-frame);
      }
      :host([placement='top']) .panel {
        border-block-end: 3px solid var(--vn-frame);
      }
      :host([placement='bottom']) .panel {
        border-block-start: 3px solid var(--vn-frame);
      }
      .body {
        flex: 1;
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
        <div class="panel" part="panel" data-ref="panel">
          <header class="header">
            <h2 class="heading" id="heading" part="heading">${() => this.heading}</h2>
            <button class="close" type="button" aria-label="关闭" @click=${() => this.close('close-button')}>×</button>
          </header>
          <div class="body" part="body"><slot></slot></div>
          <footer class="footer" part="footer"><slot name="footer"></slot></footer>
        </div>
      </dialog>
    `;
  }

  enterAnimations() {
    const timing = { duration: tokenDuration(this, 'slow', 600), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
    return [
      this.animate(this.refs.dialog, [{ transform: OFFSCREEN[this.placement] }, { transform: 'none' }], timing),
      this.animateBackdrop([{ opacity: 0 }, { opacity: 1 }], timing),
    ];
  }

  exitAnimations() {
    const timing = { duration: tokenDuration(this, 'normal', 320), easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' };
    return [
      this.animate(this.refs.dialog, [{ transform: 'none' }, { transform: OFFSCREEN[this.placement] }], timing),
      this.animateBackdrop([{ opacity: 1 }, { opacity: 0 }], timing),
    ];
  }
}

VnDrawer.define();
