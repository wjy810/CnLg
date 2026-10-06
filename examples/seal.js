// 示例组件：印章。演示 属性 / 枚举 / 响应式模板 / 自定义状态 / 事件 / 动画。
import { VunioElement, html, css } from '../src/index.js';

/** 字越多，字号越小 */
const fontScale = (text) => {
  const count = [...text].length;
  return count === 1 ? 0.56 : count === 2 ? 0.4 : 0.34;
};

export class DemoSeal extends VunioElement {
  static tag = 'demo-seal';

  static props = {
    text: { type: String, default: '印' },
    tone: { type: String, default: 'cinnabar', values: ['cinnabar', 'ink'] },
    size: { type: Number, default: 72 },
  };

  static styles = css`
    :host {
      display: inline-block;
      --_color: var(--vn-accent);
      --_paper: var(--vn-on-accent);
    }
    :host(:state(ink)) {
      --_color: var(--vn-primary);
      --_paper: var(--vn-on-primary);
    }
    .seal {
      inline-size: var(--_size);
      block-size: var(--_size);
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--vn-radius-md);
      background: var(--_color);
      color: var(--_paper);
      box-shadow:
        inset 0 0 0 calc(var(--_size) * 0.05) var(--_color),
        inset 0 0 0 calc(var(--_size) * 0.075) var(--_paper);
      font: 700 var(--_font) / 1.02 var(--vn-font-body);
      cursor: pointer;
      transform: rotate(-2deg);
      -webkit-mask: var(--vn-mask-stamp);
      mask: var(--vn-mask-stamp);
    }
    .chars {
      writing-mode: vertical-rl;
      inline-size: 2.1em;
      text-align: center;
    }
  `;

  render() {
    return html`
      <button
        class="seal"
        part="seal"
        data-ref="seal"
        aria-label=${() => `印章：${this.text}`}
        style=${() => ({ '--_size': `${this.size}px`, '--_font': `calc(var(--_size) * ${fontScale(this.text)})` })}
        @click=${this.stamp}
      >
        <span class="chars">${() => this.text}</span>
      </button>
    `;
  }

  mounted() {
    // 宿主自身的状态不在模板里，用 effect 同步
    this.effect(() => this.setState('ink', this.tone === 'ink'));
  }

  /** 盖章：落下动画 + 派发 vn-stamp 事件 */
  stamp() {
    this.animate(
      this.refs.seal,
      [
        { transform: 'scale(1.4) rotate(-8deg)', opacity: 0 },
        { transform: 'scale(0.94) rotate(-2deg)', opacity: 1, offset: 0.65 },
        { transform: 'scale(1) rotate(-2deg)', opacity: 1 },
      ],
      { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    this.emit('vn-stamp', { text: this.text });
  }
}

DemoSeal.define();
