import { VunioElement, html, css, signal, unsafeHTML } from '../../src/index.js';
import { dedent, highlight } from './highlight.js';

/**
 * <site-code> 代码块：高亮 + 复制按钮。
 * 代码通过 .code 属性传入，没有时取元素自身的文字。
 *
 * @attr {'html'|'js'} syntax - 代码语言，默认 html（不用 lang：它是 HTML 的全局属性，表示人类语言）
 */
export class SiteCode extends VunioElement {
  static tag = 'site-code';

  static props = {
    syntax: { type: String, default: 'html', values: ['html', 'js'] },
    code: { type: String, attribute: false },
  };

  static styles = css`
    :host {
      display: block;
      margin-block: var(--vn-space-4);
    }
    .wrap {
      position: relative;
    }
    pre {
      margin: 0;
      padding: var(--vn-space-4) var(--vn-space-5);
      overflow-x: auto;
      border-inline-start: 2px solid var(--vn-accent);
      border-radius: 0 var(--vn-radius-md) var(--vn-radius-md) 0;
      background: var(--vn-surface-sunken);
      color: var(--vn-fg);
      font: 13px / 1.7 var(--vn-font-mono);
      tab-size: 2;
    }
    .copy {
      position: absolute;
      inset-block-start: var(--vn-space-2);
      inset-inline-end: var(--vn-space-2);
      padding: 2px var(--vn-space-2);
      border: var(--vn-border-thin) solid var(--vn-line-strong);
      border-radius: var(--vn-radius-sm);
      background: var(--vn-surface);
      color: var(--vn-fg-muted);
      font: inherit;
      font-family: var(--vn-font-body);
      font-size: var(--vn-font-size-xs);
      cursor: pointer;
      opacity: 0;
      transition: opacity var(--vn-duration-fast) var(--vn-ease-standard);
    }
    .wrap:hover .copy,
    .copy:focus-visible,
    .copy[data-copied] {
      opacity: 1;
    }
    .tok-comment {
      color: var(--vn-fg-muted);
      font-style: italic;
    }
    .tok-string {
      color: var(--vn-success);
    }
    .tok-keyword {
      color: var(--vn-accent-fg);
    }
    .tok-number {
      color: var(--vn-warning);
    }
    .tok-tag {
      color: var(--vn-info);
    }
    .tok-attr {
      color: var(--vn-warning);
    }
  `;

  copied = signal(false);

  get source() {
    return dedent(this.code || this.textContent || '');
  }

  render() {
    return html`
      <div class="wrap">
        <pre part="pre" tabindex="0" aria-label="代码"><code>${() => unsafeHTML(highlight(this.source, this.syntax))}</code></pre>
        <button class="copy" type="button" data-copied=${() => (this.copied.value ? '' : null)} @click=${this.copy}>
          ${() => (this.copied.value ? '已复制' : '复制')}
        </button>
      </div>
    `;
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.source);
    } catch {
      // 剪贴板不可用（非安全上下文等）：选中文字，方便手动复制
      const range = document.createRange();
      range.selectNodeContents(this.root.querySelector('code'));
      const selection = this.root.getSelection?.() ?? document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    this.copied.value = true;
    this.timeout(() => (this.copied.value = false), 1600);
  }
}

SiteCode.define();
