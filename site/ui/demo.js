import { VunioElement, html, css, unsafeHTML, computed } from '../../src/index.js';
import './code.js';

/**
 * <site-demo> 现场演示：上面是运行效果，下面是源码。
 * 通过 .demo 传入 { title?, html, js?, setup?(stage) }。
 */
export class SiteDemo extends VunioElement {
  static tag = 'site-demo';

  static props = {
    demo: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      margin-block: var(--vn-space-5) var(--vn-space-7);
    }
    .title {
      margin: 0 0 var(--vn-space-3);
      color: var(--vn-fg);
      font-size: var(--vn-font-size-md);
      font-weight: var(--vn-weight-medium);
      letter-spacing: var(--vn-tracking-wide);
    }
    .stage {
      position: relative;
      padding: var(--vn-space-6) var(--vn-space-5);
      border-radius: var(--vn-radius-md) var(--vn-radius-md) 0 0;
      background: var(--vn-surface);
      box-shadow: inset 0 0 0 1px var(--vn-line);
      color: var(--vn-fg);
      font-family: var(--vn-font-body);
      line-height: var(--vn-leading-normal);
    }
    site-code {
      margin-block-start: 0;
    }
  `;

  render() {
    const demo = computed(() => this.demo ?? { html: '' });
    const source = computed(() => [demo.value.html, demo.value.js ? `<script type="module">\n${demo.value.js}\n</script>` : '']
      .filter(Boolean)
      .join('\n\n'));
    return html`
      ${() => (demo.value.title ? html`<h3 class="title">${demo.value.title}</h3>` : null)}
      <div class="stage" data-ref="stage" part="stage">${() => unsafeHTML(demo.value.html)}</div>
      <site-code .code=${source}></site-code>
    `;
  }

  mounted() {
    // 演示内容写入后再绑定行为
    this.effect(() => {
      const setup = this.demo?.setup;
      if (setup) queueMicrotask(() => this.isConnected && setup(this.refs.stage));
    });
  }
}

SiteDemo.define();
