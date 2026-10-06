import { VunioElement, html, css } from '../core/index.js';

/** 读取主题时长令牌（毫秒） */
function duration(element, name, fallback) {
  const raw = getComputedStyle(element).getPropertyValue(`--vn-duration-${name}`).trim();
  const value = parseFloat(raw);
  if (!raw || Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

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
export class VnModal extends VunioElement {
  static tag = 'vn-modal';

  static props = {
    heading: String,
    open: Boolean,
    persistent: Boolean,
  };

  static styles = css`
    :host {
      display: contents;
    }
    dialog {
      inline-size: min(560px, calc(100vw - 32px));
      max-inline-size: none;
      max-block-size: calc(100dvh - 32px);
      padding: 0;
      overflow: visible;
      border: 0;
      background: transparent;
      color: var(--vn-fg);
    }
    dialog::backdrop {
      background: var(--vn-overlay);
      backdrop-filter: blur(2px);
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
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--vn-space-4);
      margin-block-end: var(--vn-space-4);
    }
    .heading {
      margin: 0;
      font-size: var(--vn-font-size-xl);
      font-weight: var(--vn-weight-medium);
      letter-spacing: var(--vn-tracking-wider);
      line-height: var(--vn-leading-tight);
    }
    .close {
      flex: none;
      inline-size: 32px;
      block-size: 32px;
      margin: -6px -10px 0 0;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--vn-fg-muted);
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
    }
    .close:hover {
      background: var(--vn-surface-sunken);
      color: var(--vn-fg);
    }
    .body {
      line-height: var(--vn-leading-normal);
    }
    .footer {
      display: none;
    }
    :host(:state(has-footer)) .footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--vn-space-3);
      margin-block-start: var(--vn-space-6);
    }
  `;

  #returnValue = undefined;
  #transition = null;

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

  mounted() {
    this.watchSlot('footer');
    this.effect(() => {
      if (this.open) this.#openDialog();
      else this.#closeDialog();
    });
  }

  unmounted() {
    this.#transition = null;
  }

  /** 打开 */
  show() {
    this.#returnValue = undefined;
    this.open = true;
  }

  /** 关闭，returnValue 会出现在 vn-close 事件的 detail 中 */
  close(returnValue) {
    this.#returnValue = returnValue;
    this.open = false;
  }

  handleCancel(event) {
    // 自己处理关闭（带动画）；persistent 时不关闭
    event.preventDefault();
    if (!this.persistent) this.close('esc');
  }

  handleBackdrop(event) {
    // 点在 dialog 自身（内容以外的遮罩区域）上
    if (event.target === this.refs.dialog && !this.persistent) this.close('backdrop');
  }

  handleNativeClose() {
    // 例如 <form method="dialog"> 直接关闭了 dialog
    if (this.open) {
      this.#returnValue ??= this.refs.dialog.returnValue || undefined;
      this.open = false;
      this.emit('vn-close', { returnValue: this.#returnValue });
    }
  }

  #openDialog() {
    const { dialog, paper, rodTop, rodBottom } = this.refs;
    this.#transition?.forEach((a) => a.cancel());
    if (!dialog.open) dialog.showModal();
    const half = paper.offsetHeight / 2;
    const timing = { duration: duration(this, 'slow', 600) + 100, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
    this.#transition = [
      this.animate(paper, [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], timing),
      this.animate(rodTop, [{ transform: `translateY(${half}px)` }, { transform: 'none' }], timing),
      this.animate(rodBottom, [{ transform: `translateY(${-half}px)` }, { transform: 'none' }], timing),
      this.animate(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: timing.duration / 2 }),
      this.#animateBackdrop([{ opacity: 0 }, { opacity: 1 }], { duration: timing.duration / 2 }),
    ].filter(Boolean);
    this.emit('vn-open');
  }

  /** 遮罩淡入淡出。Firefox 的 Element.animate 不支持 ::backdrop（会抛错），此时遮罩直接出现 / 消失 */
  #animateBackdrop(keyframes, timing) {
    try {
      return this.animate(this.refs.dialog, keyframes, { ...timing, pseudoElement: '::backdrop' });
    } catch {
      return null;
    }
  }

  #closeDialog() {
    const { dialog, paper, rodTop, rodBottom } = this.refs;
    if (!dialog.open) return;
    this.#transition?.forEach((a) => a.cancel());
    const half = paper.offsetHeight / 2;
    const timing = { duration: duration(this, 'normal', 320), easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' };
    const animations = [
      this.animate(paper, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(50% 0 50% 0)' }], timing),
      this.animate(rodTop, [{ transform: 'none' }, { transform: `translateY(${half}px)` }], timing),
      this.animate(rodBottom, [{ transform: 'none' }, { transform: `translateY(${-half}px)` }], timing),
      this.animate(dialog, [{ opacity: 1 }, { opacity: 0 }], timing),
      this.#animateBackdrop([{ opacity: 1 }, { opacity: 0 }], timing),
    ].filter(Boolean);
    this.#transition = animations;
    const returnValue = this.#returnValue;
    Promise.all(animations.map((a) => a.finished)).then(
      () => {
        if (this.#transition !== animations) return;
        animations.forEach((a) => a.cancel());
        this.#transition = null;
        dialog.close();
        this.emit('vn-close', { returnValue });
      },
      () => {
        // 被取消（例如关闭途中又打开了）：什么都不做
      },
    );
  }
}

VnModal.define();
