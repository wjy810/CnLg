import { VunioElement, html, css, signal } from '../core/index.js';

const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const GAP = 8;

/** 真正获得焦点的元素：自定义元素用 delegatesFocus 时是它 Shadow DOM 里第一个可聚焦元素 */
function focusTarget(element) {
  const root = element.shadowRoot;
  if (root?.delegatesFocus) return root.querySelector(FOCUSABLE) ?? element;
  return element;
}

/**
 * <vn-tooltip> 提示：悬停或聚焦时在旁边显示一句补充说明。
 * 浮层放在顶层（Popover API），不会被裁切；文字同时写在被包裹元素的 aria-description 上，读屏用户聚焦时就能听到。
 * 提示只放补充信息：触屏设备没有悬停，必要的信息不能只写在提示里。
 *
 * @attr {string} content - 提示文字
 * @attr {'top'|'bottom'|'left'|'right'} placement - 位置，默认 top；空间不够时翻到对侧
 * @attr {number} delay - 悬停多久后显示（毫秒），默认 300
 * @attr {boolean} disabled - 不显示
 * @slot - 被提示的元素（一个）
 * @csspart bubble - 提示浮层
 */
export class VnTooltip extends VunioElement {
  static tag = 'vn-tooltip';

  static props = {
    content: String,
    placement: { type: String, default: 'top', values: ['top', 'bottom', 'left', 'right'] },
    delay: { type: Number, default: 300 },
    disabled: Boolean,
  };

  static styles = css`
    :host {
      display: inline-block;
    }
    .bubble {
      position: fixed;
      inset: auto;
      margin: 0;
      max-inline-size: min(280px, calc(100vw - 16px));
      padding: var(--vn-space-1) var(--vn-space-3);
      border: 0;
      border-radius: var(--vn-radius-sm);
      background: var(--vn-fg);
      color: var(--vn-bg);
      box-shadow: var(--vn-shadow-2);
      font-family: var(--vn-font-body);
      font-size: var(--vn-font-size-sm);
      line-height: 1.6;
      letter-spacing: var(--vn-tracking-wide);
      pointer-events: none;
      z-index: var(--vn-z-toast);
    }
    :host(:not(:state(open))) .bubble {
      display: none;
    }
    :host(:state(open)) .bubble {
      animation: appear var(--vn-duration-fast) var(--vn-ease-enter);
    }
    @keyframes appear {
      from {
        opacity: 0;
        translate: var(--_from, 0 4px);
      }
    }
  `;

  /** 被提示的元素 */
  trigger = signal(/** @type {Element | null} */ (null));

  #cancel = null;
  #described = null;

  render() {
    return html`
      <slot @slotchange=${this.collect}></slot>
      <div class="bubble" part="bubble" data-ref="bubble" popover=${supportsPopover ? 'manual' : null} aria-hidden="true">
        ${() => this.content}
      </div>
    `;
  }

  mounted() {
    this.collect();
    // 被包裹的自定义元素在提示之后才连接、渲染，等它渲染出内部的按钮再找一次
    this.timeout(() => this.collect(), 0);
    this.on(this, 'pointerenter', () => this.#schedule(true, this.delay));
    this.on(this, 'pointerleave', () => this.#schedule(false, 100));
    this.on(this, 'focusin', () => this.#schedule(true, 0));
    this.on(this, 'focusout', () => this.#schedule(false, 0));
    this.on(document, 'keydown', (event) => {
      if (event.key === 'Escape' && this.hasState('open')) this.hide();
    });
    // 把提示文字写到真正获得焦点的元素上
    this.effect(() => {
      const trigger = this.trigger.value;
      const text = this.disabled ? '' : this.content;
      const target = trigger ? focusTarget(trigger) : null;
      if (this.#described && this.#described !== target) this.#described.removeAttribute('aria-description');
      this.#described = target;
      if (!target) return;
      if (text) target.setAttribute('aria-description', text);
      else target.removeAttribute('aria-description');
    });
  }

  unmounted() {
    this.#described?.removeAttribute('aria-description');
    this.#described = null;
  }

  collect() {
    const slot = this.root.querySelector('slot');
    // 先清空再赋值：同一个元素也要重新计算真正获得焦点的目标
    this.trigger.value = null;
    this.trigger.value = slot?.assignedElements()[0] ?? null;
  }

  /** 显示 */
  show() {
    if (this.disabled || !this.content || this.hasState('open')) return;
    this.setState('open', true);
    if (supportsPopover) this.refs.bubble.showPopover();
    this.#position();
  }

  /** 隐藏 */
  hide() {
    this.#cancel?.();
    if (!this.hasState('open')) return;
    this.setState('open', false);
    if (supportsPopover && this.refs.bubble.matches(':popover-open')) this.refs.bubble.hidePopover();
  }

  #schedule(open, delay) {
    this.#cancel?.();
    this.#cancel = this.timeout(() => (open ? this.show() : this.hide()), delay);
  }

  #position() {
    const bubble = this.refs.bubble;
    const trigger = this.trigger.peek() ?? this;
    const rect = trigger.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = bubble;
    const room = {
      top: rect.top - GAP,
      bottom: window.innerHeight - rect.bottom - GAP,
      left: rect.left - GAP,
      right: window.innerWidth - rect.right - GAP,
    };
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    let side = this.placement;
    const needed = side === 'top' || side === 'bottom' ? height : width;
    if (room[side] < needed && room[opposite[side]] > room[side]) side = opposite[side];
    const clampX = (x) => Math.min(window.innerWidth - width - GAP, Math.max(GAP, x));
    const clampY = (y) => Math.min(window.innerHeight - height - GAP, Math.max(GAP, y));
    const position = {
      top: [clampX(rect.left + rect.width / 2 - width / 2), rect.top - GAP - height],
      bottom: [clampX(rect.left + rect.width / 2 - width / 2), rect.bottom + GAP],
      left: [rect.left - GAP - width, clampY(rect.top + rect.height / 2 - height / 2)],
      right: [rect.right + GAP, clampY(rect.top + rect.height / 2 - height / 2)],
    }[side];
    const from = { top: '0 4px', bottom: '0 -4px', left: '4px 0', right: '-4px 0' }[side];
    Object.assign(bubble.style, { left: `${position[0]}px`, top: `${position[1]}px` });
    bubble.style.setProperty('--_from', from);
    bubble.dataset.side = side;
  }
}

VnTooltip.define();
