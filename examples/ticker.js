// 示例组件：水墨钟。演示 loop() 动画循环在组件移除时自动停止。
import { VunioElement, html, css } from '../src/index.js';

/** 当前正在运行的 loop 数量（演示用） */
export const stats = { running: 0 };

const report = () => window.dispatchEvent(new CustomEvent('ticker-stats', { detail: { ...stats } }));

export class DemoTicker extends VunioElement {
  static tag = 'demo-ticker';

  static styles = css`
    :host {
      display: inline-grid;
      place-items: center;
      inline-size: 88px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, var(--vn-surface) 55%, var(--vn-surface-sunken) 100%);
      box-shadow: inset 0 0 0 1px var(--vn-line);
      position: relative;
    }
    .hand {
      position: absolute;
      inset-block-start: 10px;
      inset-inline-start: calc(50% - 1.5px);
      inline-size: 3px;
      block-size: calc(50% - 10px);
      border-radius: 3px;
      background: linear-gradient(var(--vn-fg), transparent);
      transform-origin: 50% 100%;
    }
    .dot {
      inline-size: 8px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--vn-accent);
    }
  `;

  render() {
    return html`<span class="hand" data-ref="hand"></span><span class="dot"></span>`;
  }

  mounted() {
    let angle = 0;
    stats.running++;
    report();
    this.loop((dt) => {
      angle = (angle + dt * 0.12) % 360;
      this.refs.hand.style.transform = `rotate(${angle}deg)`;
    });
    this.onCleanup(() => {
      stats.running--;
      report();
    });
  }
}

DemoTicker.define();
