import { VunioElement, html, css, when } from '../core/index.js';

const SIZES = { 1: '4xl', 2: '3xl', 3: '2xl', 4: 'xl', 5: 'lg', 6: 'md' };

/**
 * <vn-heading> 标题。1–3 级用毛笔字，可盖一方朱印、可竖排。
 *
 * @attr {number} level - 层级 1–6，默认 2
 * @attr {string} seal - 印章文字，如 "雅"
 * @attr {string} sub - 副标题
 * @attr {boolean} vertical - 竖排（从右往左）
 * @attr {boolean} plain - 不用毛笔字
 * @slot - 标题文字
 * @csspart heading - 标题
 * @csspart seal - 印章
 * @csspart sub - 副标题
 */
export class VnHeading extends VunioElement {
  static tag = 'vn-heading';

  static props = {
    level: { type: Number, default: 2 },
    seal: String,
    sub: String,
    vertical: Boolean,
    plain: Boolean,
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
    }
    :host([vertical]) .wrap {
      writing-mode: vertical-rl;
    }
    /* 印章紧跟标题文字（竖排时在标题下方） */
    .row {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--vn-space-3);
    }
    .title {
      margin: 0;
      font-family: var(--_font);
      font-size: var(--_size);
      font-weight: var(--_weight);
      line-height: var(--vn-leading-tight);
      letter-spacing: var(--vn-tracking-wide);
      text-wrap: balance;
    }
    .sub {
      display: block;
      margin-block-start: var(--vn-space-2);
      color: var(--vn-fg-muted);
      font-family: var(--vn-font-serif);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wider);
    }
    :host([vertical]) .sub {
      margin-block-start: 0;
      margin-inline-start: var(--vn-space-3);
    }
    .seal {
      flex: none;
      display: grid;
      place-items: center;
      inline-size: max(22px, calc(var(--_size) * 0.6));
      aspect-ratio: 1;
      margin-block-start: 0.2em;
      border-radius: var(--vn-radius-sm);
      background: var(--vn-accent);
      color: var(--vn-on-accent);
      box-shadow:
        inset 0 0 0 2px var(--vn-accent),
        inset 0 0 0 3px var(--vn-on-accent);
      font: 700 max(11px, calc(var(--_size) * 0.24)) / 1.05 var(--vn-font-serif);
      transform: rotate(-3deg);
      -webkit-mask: var(--vn-mask-seal);
      mask: var(--vn-mask-seal);
    }
    .seal span {
      writing-mode: vertical-rl;
      inline-size: 2.1em;
      text-align: center;
    }
  `;

  render() {
    const level = () => Math.min(6, Math.max(1, Math.round(this.level) || 2));
    const brush = () => level() <= 3 && !this.plain;
    return html`
      <div
        class="wrap"
        style=${() => ({
          '--_size': `var(--vn-font-size-${SIZES[level()]})`,
          '--_font': brush() ? 'var(--vn-font-brush)' : 'var(--vn-font-serif)',
          '--_weight': brush() ? 'var(--vn-weight-regular)' : 'var(--vn-weight-medium)',
        })}
      >
        <div class="row">
          <div class="title" part="heading" role="heading" aria-level=${level}>
            <slot></slot>
          </div>
          ${when(
            () => this.seal,
            () => html`<span class="seal" part="seal" role="img" aria-label=${() => `印章：${this.seal}`}><span>${() => this.seal}</span></span>`,
          )}
        </div>
        ${when(
          () => this.sub,
          () => html`<span class="sub" part="sub">${() => this.sub}</span>`,
        )}
      </div>
    `;
  }
}

VnHeading.define();
