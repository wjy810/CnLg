// 基于原生 <dialog> 的浮层（vn-modal、vn-drawer）共用的行为与样式
import { VunioElement, css } from '../core/index.js';

/** 读取主题时长令牌（毫秒） */
export function tokenDuration(element, name, fallback) {
  const raw = getComputedStyle(element).getPropertyValue(`--vn-duration-${name}`).trim();
  const value = parseFloat(raw);
  if (!raw || Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

/** 标题行、关闭按钮、正文、底部 */
export const dialogStyles = css`
  :host {
    display: contents;
  }
  dialog {
    max-inline-size: none;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--vn-fg);
  }
  dialog::backdrop {
    background: var(--vn-overlay);
    backdrop-filter: blur(2px);
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

/**
 * 模态浮层的基类：背景不可操作、焦点留在浮层内、关闭后焦点回到打开前的位置（这些由原生 <dialog> 负责），
 * 外加 open 属性与方法同步、Esc / 遮罩 / 关闭按钮的关闭原因、打开与关闭的动画。
 *
 * 子类在 render() 里放一个 data-ref="dialog" 的 <dialog>，绑定
 * @cancel=${this.handleCancel} @click=${this.handleBackdrop} @close=${this.handleNativeClose}，
 * 并实现 enterAnimations() / exitAnimations()，返回 Animation 数组。
 */
export class DialogElement extends VunioElement {
  static props = {
    heading: String,
    open: Boolean,
    persistent: Boolean,
  };

  #returnValue = undefined;
  /** @type {Animation[] | null} */
  #transition = null;

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

  /** 打开时的动画（子类实现） */
  enterAnimations() {
    return [];
  }

  /** 关闭时的动画（子类实现）；全部结束后才真正关闭 dialog */
  exitAnimations() {
    return [];
  }

  /** 遮罩淡入淡出。Firefox 的 Element.animate 不支持 ::backdrop（会抛错），此时遮罩直接出现 / 消失 */
  animateBackdrop(keyframes, timing) {
    try {
      return this.animate(this.refs.dialog, keyframes, { ...timing, pseudoElement: '::backdrop' });
    } catch {
      return null;
    }
  }

  #openDialog() {
    const dialog = this.refs.dialog;
    this.#transition?.forEach((a) => a.cancel());
    if (!dialog.open) dialog.showModal();
    this.#transition = this.enterAnimations().filter(Boolean);
    this.emit('vn-open');
  }

  #closeDialog() {
    const dialog = this.refs.dialog;
    if (!dialog.open) return;
    this.#transition?.forEach((a) => a.cancel());
    const animations = this.exitAnimations().filter(Boolean);
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
