import { html } from '../../src/index.js';
import { router } from '../router.js';
import { code } from '../ui/page.js';

const FEATURES = [
  ['原生组件', '组件就是浏览器的自定义元素，写在 HTML 里就能用，也能放进 React、Vue。没有虚拟 DOM，没有构建步骤。'],
  ['精确更新', '由 signal 驱动：数据变了，只改用到它的那一个文字节点或属性。列表重排时，DOM 移动次数最少。'],
  ['资源有主', '事件、计时器、动画、订阅都归组件所有，组件移除时自动释放。泄漏是写不出来的。'],
  ['纸墨朱印', '宣纸、浓墨、朱砂的设计系统，昼夜两套主题，全部颜色搭配满足无障碍对比度。'],
  ['风花雪月', '墨晕、落花、飞雪、风叶的点击效果，和画布绘制的天气背景，并尊重“减少动态效果”。'],
  ['给 AI 的规范', '一份组件规范，人和 AI 按同一标准写组件，得到的是可复用的组件，而不是一次性的 HTML。'],
];

const SAMPLE = `import { VunioElement, html, css, signal } from 'vunio';

export class PoemLike extends VunioElement {
  static tag = 'poem-like';
  static props = { label: { type: String, default: '赞' } };
  static styles = css\`button { font: inherit; }\`;

  count = signal(0);

  render() {
    return html\`
      <button @click=\${() => this.count.value++}>
        \${() => this.label} · \${this.count}
      </button>\`;
  }
}

PoemLike.define();`;

export default () => html`
  <style>
    .home-hero {
      position: relative;
      display: grid;
      place-items: center;
      min-block-size: min(78vh, 640px);
      padding: var(--vn-space-9) 16px var(--vn-space-8);
      overflow: hidden;
      text-align: center;
      background: radial-gradient(ellipse at 50% 120%, var(--vn-surface-sunken), transparent 60%);
    }
    .home-hero-inner {
      position: relative;
      max-inline-size: 720px;
    }
    .doc .home-title {
      margin: 0;
      font: 400 clamp(72px, 16vw, 132px) / 1 var(--vn-font-brush);
      letter-spacing: var(--vn-tracking-wide);
    }
    .home-tagline {
      margin: var(--vn-space-4) 0 0;
      font-size: var(--vn-font-size-xl);
      letter-spacing: var(--vn-tracking-widest);
    }
    .home-lede {
      margin: var(--vn-space-4) auto 0;
      max-inline-size: 34em;
      color: var(--vn-fg-muted);
    }
    .home-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--vn-space-3);
      margin-block-start: var(--vn-space-6);
    }
    .home-section {
      max-inline-size: 1100px;
      margin-inline: auto;
      padding: var(--vn-space-8) 24px;
    }
    .home-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--vn-space-5);
    }
    .home-grid vn-card {
      color: var(--vn-fg-muted);
      line-height: var(--vn-leading-normal);
    }
    .home-code {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
      gap: var(--vn-space-7);
      align-items: center;
    }
    .home-code h2 {
      margin: 0 0 var(--vn-space-3);
      font: 400 var(--vn-font-size-2xl) / 1.3 var(--vn-font-brush);
      letter-spacing: var(--vn-tracking-wide);
    }
    .home-code p {
      color: var(--vn-fg-muted);
    }
    @media (max-width: 760px) {
      .home-code {
        grid-template-columns: minmax(0, 1fr);
      }
      .home-tagline {
        font-size: var(--vn-font-size-lg);
        letter-spacing: var(--vn-tracking-wider);
      }
    }
  </style>

  <section class="home-hero">
    <vn-sky weather="blossom" moon density="0.7" wind="0.2"></vn-sky>
    <div class="home-hero-inner">
      <h1 class="home-title">Vunio</h1>
      <p class="home-tagline">一个古风的 Web Components 框架</p>
      <p class="home-lede">
        不依赖 React / Vue，组件就是浏览器原生的自定义元素。精确更新、资源自动回收，自带一套纸墨朱印的设计系统，和风花雪月的动效。
      </p>
      <div class="home-actions">
        <vn-button variant="cinnabar" size="lg" @click=${() => router.navigate('/start')}>快速开始</vn-button>
        <vn-button variant="moon" size="lg" @click=${() => router.navigate('/components')}>看组件</vn-button>
      </div>
    </div>
  </section>

  <section class="home-section">
    <div class="home-grid">
      ${FEATURES.map(([title, text]) => html`<vn-card><span slot="title">${title}</span>${text}</vn-card>`)}
    </div>
  </section>

  <section class="home-section home-code">
    <div>
      <h2>一个组件，一个文件</h2>
      <p>声明属性，写出结构；signal 和 <code>() =&gt;</code> 函数绑定的地方会自动更新。事件、样式、清理都有固定的写法。</p>
      <p><a href=${router.href('/start')}>从快速开始读起 →</a></p>
    </div>
    ${code(SAMPLE)}
  </section>
`;
