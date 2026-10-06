// 示例组件：风花雪月。演示 <vn-sky> 天气背景与 burst 点击效果。
import { VunioElement, html, css, signal, burst } from '../src/index.js';
import '../src/components/index.js';

const WEATHER = [
  ['wind', '风'],
  ['blossom', '花'],
  ['snow', '雪'],
  ['none', '无'],
];

const EFFECTS = [
  ['ink', '墨晕'],
  ['blossom', '落花'],
  ['snow', '飞雪'],
  ['wind', '风叶'],
];

export class DemoSeasons extends VunioElement {
  static tag = 'demo-seasons';

  static styles = css`
    :host {
      display: block;
    }
    .stage {
      position: relative;
      block-size: 280px;
      overflow: hidden;
      border-radius: var(--vn-radius-md);
      background: var(--vn-surface);
      box-shadow:
        inset 0 0 0 1px var(--vn-line),
        var(--vn-shadow-1);
      cursor: pointer;
      user-select: none;
    }
    .glyph {
      position: absolute;
      inset-block-end: var(--vn-space-4);
      inset-inline-start: var(--vn-space-5);
      font: 400 96px / 1 var(--vn-font-brush);
      color: var(--vn-fg);
      opacity: 0.08;
      pointer-events: none;
    }
    .hint {
      position: absolute;
      inset-block-start: var(--vn-space-4);
      inset-inline-start: var(--vn-space-5);
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
      pointer-events: none;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--vn-space-3) var(--vn-space-6);
      margin-block-start: var(--vn-space-4);
      font-size: var(--vn-font-size-sm);
      color: var(--vn-fg-muted);
    }
    .group {
      display: inline-flex;
      align-items: center;
      gap: var(--vn-space-2);
    }
    button {
      padding: 2px var(--vn-space-3);
      border: var(--vn-border-thin) solid var(--vn-line-strong);
      border-radius: var(--vn-radius-sm);
      background: transparent;
      color: var(--vn-fg-muted);
      font: inherit;
      cursor: pointer;
      transition:
        background-color var(--vn-duration-fast) var(--vn-ease-brush),
        color var(--vn-duration-fast) var(--vn-ease-brush);
    }
    button:hover {
      color: var(--vn-fg);
    }
    button[aria-pressed='true'] {
      border-color: var(--vn-primary);
      background: var(--vn-primary);
      color: var(--vn-on-primary);
    }
  `;

  weather = signal('blossom');
  moon = signal(true);
  effect = signal('blossom');

  render() {
    const glyph = () => (this.weather.value === 'none' ? (this.moon.value ? '月' : '') : WEATHER.find(([k]) => k === this.weather.value)[1]);
    return html`
      <div class="stage" data-ref="stage" @click=${this.handleClick}>
        <vn-sky weather=${this.weather} ?moon=${this.moon} wind=${() => (this.weather.value === 'wind' ? 0.6 : 0.15)}></vn-sky>
        <span class="glyph" aria-hidden="true">${glyph}</span>
        <span class="hint">点击画面 · ${() => EFFECTS.find(([k]) => k === this.effect.value)[1]}</span>
      </div>
      <div class="controls">
        <span class="group" role="group" aria-label="天气">
          天气
          ${WEATHER.map(([value, label]) => this.#choice(this.weather, value, label))}
          <button type="button" aria-pressed=${() => String(this.moon.value)} @click=${() => (this.moon.value = !this.moon.value)}>
            月
          </button>
        </span>
        <span class="group" role="group" aria-label="点击效果">
          点击效果 ${EFFECTS.map(([value, label]) => this.#choice(this.effect, value, label))}
        </span>
      </div>
    `;
  }

  #choice(state, value, label) {
    return html`<button type="button" aria-pressed=${() => String(state.value === value)} @click=${() => (state.value = value)}>
      ${label}
    </button>`;
  }

  handleClick(event) {
    const stage = this.refs.stage;
    const rect = stage.getBoundingClientRect();
    burst(this.effect.value, stage, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      animate: this.animate.bind(this),
    });
  }
}

DemoSeasons.define();
