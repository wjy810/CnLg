import { VunioElement, html, css, signal, repeat } from '../core/index.js';

const SEALS = { info: '讯', success: '成', warning: '慎', error: '误' };
const COLORS = { info: 'var(--vn-info)', success: 'var(--vn-success)', warning: 'var(--vn-warning)', error: 'var(--vn-danger)' };

let nextId = 1;

/**
 * <vn-toaster> 消息容器。一般不直接使用，而是调用 toast()。
 * 放在顶层（Popover API），因此也会显示在打开的弹窗之上。
 */
export class VnToaster extends VunioElement {
  static tag = 'vn-toaster';

  static styles = css`
    :host {
      position: fixed;
      inset: var(--vn-space-5) 0 auto 0;
      z-index: var(--vn-z-toast);
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      inline-size: auto;
      block-size: auto;
      pointer-events: none;
    }
    .stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--vn-space-3);
      padding-inline: 16px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--vn-space-3);
      max-inline-size: min(440px, 100%);
      padding: var(--vn-space-3) var(--vn-space-3) var(--vn-space-3) var(--vn-space-3);
      border-radius: var(--vn-radius-md);
      background: var(--vn-surface);
      color: var(--vn-fg);
      box-shadow:
        inset 0 0 0 1px var(--vn-line),
        var(--vn-shadow-2);
      font-family: var(--vn-font-serif);
      font-size: var(--vn-font-size-md);
      letter-spacing: var(--vn-tracking-wide);
      pointer-events: auto;
      animation: drop-in var(--vn-duration-slow) var(--vn-ease-ink);
    }
    @keyframes drop-in {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
    .seal {
      display: grid;
      place-items: center;
      flex: none;
      inline-size: 26px;
      block-size: 26px;
      border-radius: var(--vn-radius-sm);
      background: var(--_c);
      color: var(--vn-surface);
      font-size: 14px;
      font-weight: var(--vn-weight-bold);
      transform: rotate(-3deg);
      -webkit-mask: var(--vn-mask-seal);
      mask: var(--vn-mask-seal);
    }
    .message {
      flex: 1;
      line-height: 1.5;
    }
    .close {
      flex: none;
      inline-size: 26px;
      block-size: 26px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--vn-fg-muted);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }
    .close:hover {
      background: var(--vn-surface-sunken);
      color: var(--vn-fg);
    }
  `;

  /** @type {import('../core/index.js').Signal<{ id: number, message: string, type: string, duration: number }[]>} */
  items = signal([]);
  #timers = new Map();

  render() {
    return html`
      <div class="stack" aria-live="polite">
        ${repeat(
          this.items,
          (t) => t.id,
          (t) => html`
            <div
              class="toast"
              part="toast"
              data-id=${t.id}
              role=${t.type === 'error' ? 'alert' : 'status'}
              style=${{ '--_c': COLORS[t.type] }}
              @pointerenter=${() => this.#pause(t.id)}
              @pointerleave=${() => this.#resume(t.id)}
            >
              <span class="seal" aria-hidden="true">${SEALS[t.type]}</span>
              <span class="message">${t.message}</span>
              <button class="close" type="button" aria-label="关闭" @click=${() => this.dismiss(t.id)}>×</button>
            </div>
          `,
        )}
      </div>
    `;
  }

  /** 添加一条消息，返回 id */
  add(message, { type = 'info', duration = 3000 } = {}) {
    const id = nextId++;
    const kind = SEALS[type] ? type : 'info';
    this.items.value = [...this.items.peek(), { id, message: String(message), type: kind, duration }];
    // 每次都重新放到顶层最上面，盖过之后打开的弹窗
    if (typeof this.showPopover === 'function') {
      if (!this.hasAttribute('popover')) this.setAttribute('popover', 'manual');
      if (this.matches(':popover-open')) this.hidePopover();
      this.showPopover();
    }
    if (duration > 0) this.#schedule(id, duration);
    return id;
  }

  /** 关闭一条消息（淡出后移除） */
  dismiss(id) {
    this.#timers.get(id)?.cancel?.();
    this.#timers.delete(id);
    const element = this.root.querySelector(`[data-id="${id}"]`);
    const remove = () => {
      this.items.value = this.items.peek().filter((t) => t.id !== id);
    };
    if (!element || !this.isConnected) return remove();
    this.animate(element, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], {
      duration: 220,
      easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
      fill: 'forwards',
    }).finished.then(remove, remove);
  }

  #schedule(id, ms) {
    const startedAt = performance.now();
    const cancel = this.timeout(() => this.dismiss(id), ms);
    this.#timers.set(id, { cancel, startedAt, remaining: ms });
  }

  #pause(id) {
    const timer = this.#timers.get(id);
    if (!timer?.cancel) return;
    timer.cancel();
    timer.remaining -= performance.now() - timer.startedAt;
    timer.cancel = null;
  }

  #resume(id) {
    const timer = this.#timers.get(id);
    if (!timer || timer.cancel) return;
    this.#schedule(id, Math.max(800, timer.remaining));
  }
}

VnToaster.define();

/**
 * 显示一条消息
 * @param {string} message
 * @param {{ type?: 'info' | 'success' | 'warning' | 'error', duration?: number }} [options] duration 为 0 时不自动关闭
 * @returns {{ id: number, close(): void }}
 */
export function toast(message, options) {
  let toaster = document.querySelector('vn-toaster');
  if (!toaster) {
    toaster = document.createElement('vn-toaster');
    document.body.append(toaster);
  }
  const host = /** @type {VnToaster} */ (toaster);
  const id = host.add(message, options);
  return { id, close: () => host.dismiss(id) };
}
