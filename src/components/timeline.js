import { VunioElement, html, css, when } from '../core/index.js';

/**
 * <vn-timeline> 时间线：按时间排列的事件。
 *
 * @slot - <vn-timeline-item>
 */
export class VnTimeline extends VunioElement {
  static tag = 'vn-timeline';

  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }

  mounted() {
    this.internals.role = 'list';
  }
}

/**
 * <vn-timeline-item> 时间线上的一件事：左侧一个圆点或一方小印，右侧是时间和内容。
 *
 * @attr {string} time - 时间
 * @attr {string} seal - 小印上的字（一到两个字）；不写时是圆点
 * @attr {'default'|'accent'|'success'|'warning'|'danger'|'info'} type - 颜色，默认 default
 * @slot - 内容
 * @csspart marker - 圆点或小印
 * @csspart time - 时间
 * @csspart content - 内容
 */
export class VnTimelineItem extends VunioElement {
  static tag = 'vn-timeline-item';

  static props = {
    time: String,
    seal: String,
    type: { type: String, default: 'default', values: ['default', 'accent', 'success', 'warning', 'danger', 'info'] },
  };

  static styles = css`
    :host {
      position: relative;
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      column-gap: var(--vn-space-3);
      padding-block-end: var(--vn-space-5);
      color: var(--vn-fg);
      --_color: var(--vn-fg-muted);
      --_ink: var(--vn-bg);
    }
    :host([type='accent']) {
      --_color: var(--vn-accent);
      --_ink: var(--vn-on-accent);
    }
    :host([type='success']) {
      --_color: var(--vn-success);
    }
    :host([type='warning']) {
      --_color: var(--vn-warning);
    }
    :host([type='danger']) {
      --_color: var(--vn-danger);
    }
    :host([type='info']) {
      --_color: var(--vn-info);
    }
    /* 竖线：连到下一项；最后一项没有 */
    :host::before {
      content: '';
      position: absolute;
      inset-block: 18px 0;
      inset-inline-start: 13.5px;
      inline-size: 1px;
      background: var(--vn-line-strong);
    }
    :host(:last-child)::before {
      display: none;
    }
    :host(:last-child) {
      padding-block-end: 0;
    }
    .marker {
      display: grid;
      place-items: center;
      block-size: 1.75em;
    }
    .dot {
      inline-size: 11px;
      block-size: 11px;
      border: 2px solid var(--_color);
      border-radius: var(--vn-radius-full);
      background: var(--vn-bg);
    }
    .seal {
      display: grid;
      place-items: center;
      inline-size: 26px;
      block-size: 26px;
      border-radius: var(--vn-radius-sm);
      background: var(--_color);
      color: var(--_ink);
      font-family: var(--vn-font-display);
      font-size: 14px;
      line-height: 1;
      -webkit-mask: var(--vn-mask-stamp);
      mask: var(--vn-mask-stamp);
    }
    .time {
      display: block;
      color: var(--vn-fg-muted);
      font-size: var(--vn-font-size-sm);
      letter-spacing: var(--vn-tracking-wide);
      line-height: 1.75;
    }
    .content {
      line-height: var(--vn-leading-normal);
    }
  `;

  render() {
    return html`
      <span class="marker" part="marker" aria-hidden="true">
        ${when(
          () => this.seal,
          () => html`<span class="seal">${() => this.seal}</span>`,
          () => html`<span class="dot"></span>`,
        )}
      </span>
      <div>
        ${when(
          () => this.time,
          () => html`<span class="time" part="time">${() => this.time}</span>`,
        )}
        <div class="content" part="content"><slot></slot></div>
      </div>
    `;
  }

  mounted() {
    this.internals.role = 'listitem';
  }
}

VnTimeline.define();
VnTimelineItem.define();
