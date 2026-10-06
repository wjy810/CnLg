// 示例组件：印章。演示 属性 / 枚举 / 自定义状态 / 事件 / 动画。
import { VunioElement, html, css } from '../src/index.js';

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -6 4.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

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
      --_color: #b5352a;
      --_paper: #f6efe2;
    }
    :host(:state(ink)) {
      --_color: #2b2a27;
    }
    .seal {
      inline-size: var(--_size);
      block-size: var(--_size);
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: var(--_color);
      color: var(--_paper);
      box-shadow:
        inset 0 0 0 calc(var(--_size) * 0.05) var(--_color),
        inset 0 0 0 calc(var(--_size) * 0.075) var(--_paper);
      font: 700 var(--_font) / 1.02 'Noto Serif SC', 'Songti SC', 'STSong', serif;
      cursor: pointer;
      transform: rotate(-2deg);
      -webkit-mask: ${NOISE};
      mask: ${NOISE};
    }
    .chars {
      writing-mode: vertical-rl;
      inline-size: 2.1em;
      text-align: center;
    }
  `;

  render() {
    return html`<button class="seal" data-ref="seal" part="seal"><span class="chars" data-ref="chars"></span></button>`;
  }

  update(changed) {
    const { seal, chars } = this.refs;
    if (changed.has('text')) {
      const count = [...this.text].length;
      chars.textContent = this.text;
      seal.setAttribute('aria-label', `印章：${this.text}`);
      seal.style.setProperty('--_font', `calc(var(--_size) * ${count === 1 ? 0.56 : count === 2 ? 0.4 : 0.34})`);
    }
    if (changed.has('tone')) this.setState('ink', this.tone === 'ink');
    if (changed.has('size')) seal.style.setProperty('--_size', `${this.size}px`);
  }

  mounted() {
    this.on(this.refs.seal, 'click', this.stamp);
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
