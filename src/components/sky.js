import { VunioElement, html, css, when } from '../core/index.js';
import { WEATHERS, WeatherField } from '../effects/weather.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

/**
 * <vn-sky> 天气背景：雪、花、风，可选一轮月亮。铺满最近的定位祖先，不响应指针。
 *
 * @attr {'snow'|'blossom'|'wind'|'none'} weather - 天气，默认 snow
 * @attr {number} density - 粒子密度倍数 0–3，默认 1
 * @attr {number} wind - 横向风力 -1（向左）… 1（向右），默认 0
 * @attr {boolean} moon - 显示月亮
 * @attr {boolean} fixed - 固定铺满视口
 * @csspart canvas - 粒子画布
 * @csspart moon - 月亮
 */
export class VnSky extends VunioElement {
  static tag = 'vn-sky';

  static props = {
    weather: { type: String, default: 'snow', values: WEATHERS },
    density: { type: Number, default: 1 },
    wind: { type: Number, default: 0 },
    moon: Boolean,
    fixed: Boolean,
  };

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      pointer-events: none;
      contain: strict;
    }
    :host([fixed]) {
      position: fixed;
    }
    canvas {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
    }
    .moon {
      position: absolute;
      inset-block-start: 12%;
      inset-inline-end: 10%;
      inline-size: clamp(44px, 10vmin, 112px);
      aspect-ratio: 1;
      border-radius: 50%;
      background:
        radial-gradient(circle at 30% 62%, color-mix(in srgb, var(--vn-fg-muted) 7%, transparent) 0 9%, transparent 10%),
        radial-gradient(circle at 62% 34%, color-mix(in srgb, var(--vn-fg-muted) 6%, transparent) 0 12%, transparent 13%),
        radial-gradient(circle at 40% 36%, var(--vn-moon), color-mix(in srgb, var(--vn-moon) 85%, var(--vn-fg-muted)));
      animation: rise var(--vn-duration-slow) var(--vn-ease-enter) both;
    }
    /* 光晕用渐变画：大范围 box-shadow 在合成层上会被裁出方形边缘 */
    .moon::before {
      content: '';
      position: absolute;
      inset: -140%;
      z-index: -1;
      border-radius: 50%;
      background: radial-gradient(
        closest-side,
        color-mix(in srgb, var(--vn-moon) 42%, transparent) 30%,
        color-mix(in srgb, var(--vn-moon) 14%, transparent) 55%,
        transparent
      );
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
  `;

  #field = new WeatherField();
  #frames = 0;
  #visible = true;
  #loop = null;
  #colors = null;
  #colorAge = 0;

  render() {
    return html`
      ${when(
        () => this.moon,
        () => html`<div class="moon" part="moon"></div>`,
      )}
      <canvas data-ref="canvas" part="canvas" aria-hidden="true"></canvas>
    `;
  }

  mounted() {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext('2d');
    const field = this.#field;
    this.#colors = null;

    const draw = () => {
      if (this.#colorAge >= 500 || !this.#colors) {
        this.#colors = this.#readColors();
        this.#colorAge = 0;
      }
      field.draw(ctx, this.#colors);
      this.#frames++;
    };

    this.#loop = this.loop((dt) => {
      this.#colorAge += dt;
      field.step(dt / 1000);
      draw();
    });

    const sync = () => {
      const active = this.#visible && field.kind !== 'none' && field.width > 0 && !this.prefersReducedMotion;
      if (active) {
        this.#loop.resume();
      } else {
        this.#loop.pause();
        // 静止时也画一帧：减少动态效果时显示静止的天气，none 时清空
        if (field.width > 0) draw();
      }
    };

    this.#loop.pause();

    this.observeResize(this, (entry) => {
      const { width, height } = entry.contentRect;
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      field.configure({ width, height });
      sync();
    });

    this.observeIntersection(this, (entry) => {
      this.#visible = entry.isIntersecting;
      sync();
    });

    this.effect(() => {
      field.configure({
        kind: this.weather,
        density: clamp(this.density, 0, 3),
        wind: clamp(this.wind, -1, 1),
      });
      sync();
    });
  }

  /** 调试与测试用：当前状态 */
  get stats() {
    return {
      kind: this.#field.kind,
      particles: this.#field.particles.length,
      frames: this.#frames,
      running: Boolean(this.#loop?.running),
    };
  }

  #readColors() {
    const style = getComputedStyle(this);
    const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return {
      snow: token('--vn-snow', '#dfe6ea'),
      blossom: token('--vn-blossom', '#e8a3ab'),
      blossomDeep: token('--vn-blossom-deep', '#c25565'),
      wind: token('--vn-wind', '#5e8a6e'),
    };
  }
}

VnSky.define();
