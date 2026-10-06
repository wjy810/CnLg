import { html } from '../../src/index.js';
import { code, demo, link, pager } from '../ui/page.js';

export default () => html`
  <h1>快速开始</h1>
  <p class="lead">不需要构建工具：几个 ES 模块和一个主题文件，就能在任何页面里用上 Vunio。</p>

  <h2>引入</h2>
  <p>把仓库中的 <code>src/</code> 和 <code>themes/</code> 放进项目，用 import map 把 <code>vunio</code> 指向源码：</p>
  ${code(
    `<script type="importmap">
  {
    "imports": {
      "vunio": "/vunio/src/index.js",
      "vunio/components": "/vunio/src/components/index.js"
    }
  }
</script>
<link rel="stylesheet" href="/vunio/themes/guofeng.css" />
<link rel="stylesheet" href="/vunio/themes/guofeng-fonts.css" /> <!-- 可选：网络字体 -->`,
    'html',
  )}
  <p>ES 模块不能用 <code>file://</code> 打开，开发时起一个本地服务器即可，例如仓库自带的 <code>npm run dev</code>。</p>

  <h2>使用组件</h2>
  <p>注册全部组件，然后像普通 HTML 一样写：</p>
  ${demo({
    html: `<form style="display: grid; gap: 4px; max-width: 360px">
  <vn-input name="line" label="名句" placeholder="明月几时有" required></vn-input>
  <vn-checkbox name="public" checked>公开</vn-checkbox>
  <vn-button type="submit" variant="cinnabar" effect="blossom">题诗</vn-button>
</form>`,
    js: `import 'vunio/components';`,
    setup(stage) {
      stage.querySelector('form').addEventListener('submit', (e) => e.preventDefault());
    },
  })}

  <h2>主题</h2>
  <p>在 <code>&lt;html&gt;</code> 上写 <code>data-theme</code>：<code>day</code>（昼）、<code>night</code>（夜）或 <code>auto</code>（跟随系统）。任何元素加上 <code>data-theme</code> 都可以局部换主题。</p>
  ${code(`<html data-theme="auto">`, 'html')}

  <h2>写第一个组件</h2>
  <p>一个组件就是一个文件：声明属性、写出结构，会变的地方用 signal 或函数绑定。</p>
  ${code(`import { VunioElement, html, css, signal } from 'vunio';

export class PoemLike extends VunioElement {
  static tag = 'poem-like';

  static props = {
    label: { type: String, default: '赞' },
  };

  static styles = css\`
    button { font: inherit; color: var(--vn-accent-fg); }
  \`;

  count = signal(0);

  render() {
    return html\`
      <button @click=\${() => this.count.value++}>
        \${() => this.label} · \${this.count}
      </button>\`;
  }
}

PoemLike.define();`)}
  <p>接下来读一读 ${link('/reactivity', '响应式')} 和 ${link('/templates', '模板')}，或直接看 ${link('/components', '组件')}。</p>

  ${pager(['/', '首页'], ['/reactivity', '响应式'])}
`;
