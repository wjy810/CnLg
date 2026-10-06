import { VunioFormElement, html, css, computed, when } from '../core/index.js';

/**
 * <vn-slider> 滑块：在一段范围里取一个数。轨道是主题的线条（--vn-mask-stroke），已选部分填强调色。
 * 键盘遵循 WAI-ARIA APG「Slider」；事件与原生 <input type=range> 一致：拖动中 input，松手 change。
 *
 * @attr {string} label - 标签（也是读屏名称）
 * @attr {string} hint - 帮助文字
 * @attr {string} name - 表单字段名
 * @attr {number} value - 默认值；不写时取范围的中点
 * @attr {number} min - 最小值，默认 0
 * @attr {number} max - 最大值，默认 100
 * @attr {number} step - 步长，默认 1
 * @attr {string} unit - 显示在数值后面的单位，如 %
 * @attr {boolean} disabled - 禁用
 * @fires input - 值变化时（拖动中也会触发）
 * @fires change - 松手或按键后
 * @csspart track - 轨道
 * @csspart fill - 已选部分
 * @csspart thumb - 滑块（role=slider）
 */
export class VnSlider extends VunioFormElement {
  static tag = 'vn-slider';

  static props = {
    label: String,
    hint: String,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    unit: String,
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
      touch-action: none;
    }
    .head {
      display: flex;
      justify-content: space-between;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
    }
    .output {
      color: var(--vn-fg);
      font-variant-numeric: tabular-nums;
      letter-spacing: normal;
    }
    .track {
      position: relative;
      block-size: 32px;
      cursor: pointer;
    }
    .rail,
    .fill {
      position: absolute;
      inset-inline: 0;
      inset-block-start: 50%;
      block-size: 6px;
      translate: 0 -50%;
      -webkit-mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
    }
    .rail {
      background: var(--vn-line-strong);
    }
    .fill {
      background: var(--vn-accent);
      clip-path: inset(0 calc(100% - var(--_pct)) 0 0);
    }
    .thumb {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--_pct);
      inline-size: 18px;
      block-size: 18px;
      translate: -50% -50%;
      border: 2px solid var(--vn-accent);
      border-radius: var(--vn-radius-full);
      background: var(--vn-surface);
      box-shadow: var(--vn-shadow-1);
      transition: scale var(--vn-duration-fast) var(--vn-ease-standard);
      outline: none;
    }
    .thumb::after {
      content: '';
      position: absolute;
      inset: 4px;
      border-radius: inherit;
      background: var(--vn-accent);
      opacity: 0.25;
    }
    .track:hover .thumb,
    :host(:state(dragging)) .thumb {
      scale: 1.15;
    }
    .thumb:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 3px;
    }
    :host(:disabled) .track {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .message {
      min-block-size: 1.5em;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-xs);
    }
  `;

  /** 当前数值（已按范围与步长修正） */
  number = computed(() => this.snap(this.value === '' ? this.min + (this.max - this.min) / 2 : Number(this.value)));

  /** 0–1 的位置 */
  ratio = computed(() => (this.max > this.min ? (this.number.value - this.min) / (this.max - this.min) : 0));

  render() {
    const text = () => `${this.number.value}${this.unit || ''}`;
    return html`
      <div class="head">
        <span class="label" id="label" ?hidden=${() => !this.label}>${() => this.label}</span>
        <span class="output" aria-hidden="true">${text}</span>
      </div>
      <div class="track" part="track" data-ref="track" style=${() => ({ '--_pct': `${this.ratio.value * 100}%` })} @pointerdown=${this.handlePointerDown}>
        <span class="rail"></span>
        <span class="fill" part="fill"></span>
        <span
          class="thumb"
          part="thumb"
          data-ref="thumb"
          role="slider"
          tabindex=${() => (this.isDisabled ? null : '0')}
          aria-labelledby=${() => (this.label ? 'label' : null)}
          aria-valuemin=${() => String(this.min)}
          aria-valuemax=${() => String(this.max)}
          aria-valuenow=${() => String(this.number.value)}
          aria-valuetext=${() => (this.unit ? text() : null)}
          aria-disabled=${() => (this.isDisabled ? 'true' : null)}
          aria-describedby=${() => (this.hint ? 'message' : null)}
          @keydown=${this.handleKeydown}
        ></span>
      </div>
      ${when(
        () => this.hint,
        () => html`<span class="message" id="message">${() => this.hint}</span>`,
      )}
    `;
  }

  /** 按范围与步长修正 */
  snap(value) {
    const { min, max } = this;
    const step = this.step > 0 ? this.step : 1;
    if (!Number.isFinite(value)) value = min;
    const snapped = Math.round((value - min) / step) * step + min;
    // 去掉浮点误差（0.1 + 0.2 之类）
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))));
  }

  /** 设为新值；变化时派发 input，commit 为 true 时再派发 change */
  #set(value, commit) {
    const next = this.snap(value);
    if (next !== this.number.peek()) {
      this.value = String(next);
      this.emit('input');
      if (commit) this.emit('change');
    }
    return next;
  }

  handleKeydown(event) {
    if (this.isDisabled) return;
    const step = this.step > 0 ? this.step : 1;
    const big = Math.max(step, (this.max - this.min) / 10);
    const current = this.number.peek();
    const next = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: this.min,
      End: this.max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.#set(next, true);
  }

  handlePointerDown(event) {
    if (this.isDisabled || event.button !== 0) return;
    const track = this.refs.track;
    const start = this.number.peek();
    const fromPointer = (e) => {
      const rect = track.getBoundingClientRect();
      const ratio = rect.width ? (e.clientX - rect.left) / rect.width : 0;
      return this.min + Math.min(1, Math.max(0, ratio)) * (this.max - this.min);
    };
    event.preventDefault();
    this.refs.thumb.focus();
    track.setPointerCapture?.(event.pointerId);
    this.setState('dragging', true);
    this.#set(fromPointer(event), false);
    const offMove = this.on(track, 'pointermove', (e) => this.#set(fromPointer(e), false));
    const finish = () => {
      offMove();
      offUp();
      offCancel();
      this.setState('dragging', false);
      if (this.number.peek() !== start) this.emit('change');
    };
    const offUp = this.on(track, 'pointerup', finish);
    const offCancel = this.on(track, 'pointercancel', finish);
  }

  formValue() {
    return String(this.number.peek());
  }

  isEmpty() {
    return false;
  }

  get validationAnchor() {
    return this.refs.thumb;
  }
}

VnSlider.define();
