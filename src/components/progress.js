import { VunioElement, html, css, computed } from '../core/index.js';

/**
 * <vn-progress> 进度：一道逐渐写满的线。没有 value 时是不确定进度，一小段来回游走。
 * 线的形状来自主题（--vn-mask-stroke）：古风是笔触，赛博是分段的灯条。
 *
 * @attr {number} value - 当前值；不写为不确定进度
 * @attr {number} max - 最大值，默认 1
 * @attr {string} label - 读屏名称（也显示在上方），默认“进度”
 * @attr {boolean} quiet - 不显示文字（读屏仍会读）
 * @csspart track - 轨道
 * @csspart fill - 已完成的部分
 */
export class VnProgress extends VunioElement {
  static tag = 'vn-progress';

  static props = {
    value: { type: Number, default: NaN },
    max: { type: Number, default: 1 },
    label: { type: String, default: '进度' },
    quiet: Boolean,
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wide);
    }
    .head {
      display: flex;
      justify-content: space-between;
      margin-block-end: var(--vn-space-1);
    }
    :host([quiet]) .head {
      display: none;
    }
    .percent {
      font-variant-numeric: tabular-nums;
    }
    .track {
      position: relative;
      block-size: 8px;
    }
    .track::before,
    .fill {
      content: '';
      position: absolute;
      inset: 0;
      -webkit-mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
    }
    .track::before {
      background: var(--vn-line-strong);
      opacity: 0.45;
    }
    .fill {
      background: var(--vn-accent);
      clip-path: inset(0 calc(100% - var(--_pct, 0%)) 0 0);
      transition: clip-path var(--vn-duration-slow) var(--vn-ease-standard);
    }
    :host(:state(indeterminate)) .fill {
      animation: wander 1.6s var(--vn-ease-move) infinite alternate;
    }
    @keyframes wander {
      from {
        clip-path: inset(0 72% 0 0);
      }
      to {
        clip-path: inset(0 0 0 72%);
      }
    }
    /* 减少动态效果：不确定进度显示为静止的半满 */
    @media (prefers-reduced-motion: reduce) {
      :host(:state(indeterminate)) .fill {
        animation: none;
        clip-path: inset(0 50% 0 0);
      }
    }
  `;

  /** 0–1 之间的比例；不确定进度时为 null */
  ratio = computed(() => {
    const { value, max } = this;
    if (Number.isNaN(value) || !(max > 0)) return null;
    return Math.min(1, Math.max(0, value / max));
  });

  render() {
    const percent = () => (this.ratio.value === null ? '' : `${Math.round(this.ratio.value * 100)}%`);
    return html`
      <div class="head" aria-hidden="true">
        <span>${() => this.label}</span>
        <span class="percent">${percent}</span>
      </div>
      <div class="track" part="track">
        <span class="fill" part="fill" style=${() => ({ '--_pct': `${(this.ratio.value ?? 0) * 100}%` })}></span>
      </div>
    `;
  }

  mounted() {
    this.internals.role = 'progressbar';
    this.internals.ariaValueMin = '0';
    this.internals.ariaValueMax = '100';
    this.effect(() => {
      const ratio = this.ratio.value;
      this.setState('indeterminate', ratio === null);
      this.internals.ariaLabel = this.label;
      this.internals.ariaValueNow = ratio === null ? null : String(Math.round(ratio * 100));
    });
  }
}

VnProgress.define();
