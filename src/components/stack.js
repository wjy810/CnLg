import { VunioElement, css } from '../core/index.js';

const GAPS = Array.from({ length: 10 }, (_, i) => `:host([gap='${i}']) { gap: var(--vn-space-${i}); }`).join('\n');

/**
 * <vn-stack> 布局：纵向或横向排列子元素，间距取自主题。
 *
 * @attr {'column'|'row'} direction - 方向，默认 column
 * @attr {number} gap - 间距 0–9（对应 --vn-space-*），默认 4
 * @attr {'start'|'center'|'end'|'stretch'|'baseline'} align - 交叉轴对齐，默认 stretch
 * @attr {'start'|'center'|'end'|'between'|'around'} justify - 主轴对齐，默认 start
 * @attr {boolean} wrap - 换行
 * @attr {boolean} inline - 行内
 * @slot - 子元素
 */
export class VnStack extends VunioElement {
  static tag = 'vn-stack';

  static props = {
    direction: { type: String, default: 'column', values: ['column', 'row'] },
    gap: { type: Number, default: 4 },
    align: { type: String, default: 'stretch', values: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { type: String, default: 'start', values: ['start', 'center', 'end', 'between', 'around'] },
    wrap: Boolean,
    inline: Boolean,
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: var(--vn-space-4);
      min-inline-size: 0;
    }
    :host([inline]) {
      display: inline-flex;
    }
    :host([direction='row']) {
      flex-direction: row;
    }
    :host([wrap]) {
      flex-wrap: wrap;
    }
    :host([align='start']) {
      align-items: flex-start;
    }
    :host([align='center']) {
      align-items: center;
    }
    :host([align='end']) {
      align-items: flex-end;
    }
    :host([align='baseline']) {
      align-items: baseline;
    }
    :host([justify='center']) {
      justify-content: center;
    }
    :host([justify='end']) {
      justify-content: flex-end;
    }
    :host([justify='between']) {
      justify-content: space-between;
    }
    :host([justify='around']) {
      justify-content: space-around;
    }
    ${GAPS}
  `;
}

VnStack.define();
