import { html } from '../../src/index.js';
import guofeng from '../../themes/guofeng.tokens.js';
import { code, pager } from '../ui/page.js';

const { palette, scales } = guofeng;

const GROUPS = [
  ['纸', ['juanbai', 'xuanzhi', 'chabai', 'xiangse']],
  ['墨分五色', ['qingmo', 'danmo', 'zhongmo', 'nongmo', 'jiaomo']],
  ['印与彩', ['zhusha', 'yanzhi', 'taoyao', 'haitang', 'zhuqing', 'qingci', 'nijin', 'dailan', 'yuebai']],
];

const SEMANTIC = ['bg', 'surface', 'surface-sunken', 'fg', 'fg-muted', 'line-strong', 'primary', 'accent', 'accent-fg', 'success', 'warning', 'danger', 'info'];

export default () => html`
  <style>
    .swatches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
      gap: var(--vn-space-3);
      margin-block: var(--vn-space-3) var(--vn-space-5);
    }
    .swatch i {
      display: block;
      block-size: 48px;
      border-radius: var(--vn-radius-md);
      box-shadow: inset 0 0 0 1px var(--vn-line);
    }
    .swatch span {
      display: flex;
      justify-content: space-between;
      margin-block-start: 6px;
      font-size: var(--vn-font-size-xs);
    }
    .swatch code {
      color: var(--vn-fg-muted);
    }
  </style>
  <h1>设计系统</h1>
  <p class="lead">纸、墨、印、四时。组件只使用语义令牌，切换 <code>data-mode</code> 时，连同 Shadow DOM 里的组件一起换昼夜。</p>

  <h2>理念</h2>
  <ul>
    <li><b>留白</b>：间距宁大勿小，一屏只说一件事。</li>
    <li><b>墨分五色</b>：层次靠墨色深浅，而不是更多颜色。</li>
    <li><b>一点朱</b>：朱砂是唯一的强调色，一个视图里通常只有一处。</li>
    <li><b>笔意</b>：毛笔字、笔触只用在标题和少量点缀上。</li>
    <li><b>四时</b>：风花雪月的意象色只用于装饰和效果。</li>
  </ul>

  <h2>传统色</h2>
  ${GROUPS.map(
    ([title, keys]) => html`
      <h3>${title}</h3>
      <div class="swatches">
        ${keys.map((key) => html`<div class="swatch"><i style=${{ background: palette[key].hex }}></i><span>${palette[key].name}<code>${palette[key].hex}</code></span></div>`)}
      </div>
    `,
  )}

  <h2>语义令牌</h2>
  <p>下面的色块用的是 <code>var(--vn-*)</code>，切换右上角的昼 / 夜就能看到它们怎样变化。</p>
  <div class="swatches">
    ${SEMANTIC.map((name) => html`<div class="swatch"><i style=${{ background: `var(--vn-${name})` }}></i><span><code>--vn-${name}</code></span></div>`)}
  </div>

  <h2>尺度</h2>
  <p>间距以 4px 为单位（<code>--vn-space-1</code> … <code>-9</code>），字号从 ${scales['font-size'].xs} 到 ${scales['font-size']['5xl']}，正文 ${scales['font-size'].md}、行高 ${scales.leading.normal}。动效曲线有四条，各有含义：墨晕、运笔、风过、落花。</p>
  ${code(`.my-panel {
  padding: var(--vn-space-5);
  border-radius: var(--vn-radius-md);
  background: var(--vn-surface);
  color: var(--vn-fg);
  box-shadow: var(--vn-shadow-2);
  transition: transform var(--vn-duration-normal) var(--vn-ease-standard);
}`, 'js')}

  <h2>无障碍</h2>
  <p>昼夜两种模式的全部颜色搭配都满足 WCAG 2.1 AA（正文 ≥ 4.5，图形与控件边框 ≥ 3），由测试保证。开启“减少动态效果”时，主题把所有动效时长变为 1ms。</p>
  <p>完整的色板、令牌和对比度表见 <a href="../examples/theme.html">设计系统展示页</a>。</p>

  ${pager(['/router', '路由'], ['/effects', '风花雪月'])}
`;
