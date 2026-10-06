/**
 * 样式管理：每段 CSS 只解析一次，同类组件的所有实例共享同一份 CSSStyleSheet。
 */
import { css } from './template.js';

/** 所有组件自动带上的基础样式 */
export const baseStyles = css`
  :host {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  :host([hidden]) {
    display: none !important;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }
  [hidden] {
    display: none !important;
  }
  :focus-visible {
    outline: var(--vn-focus-ring, 2px solid currentColor);
    outline-offset: var(--vn-focus-offset, 3px);
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 1ms !important;
    }
  }
`;

const textCache = new Map();
const classCache = new WeakMap();

/** CSS 文本 → CSSStyleSheet（按文本缓存） */
export function toSheet(input) {
  if (input instanceof CSSStyleSheet) return input;
  const text = String(input);
  let sheet = textCache.get(text);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    textCache.set(text, sheet);
  }
  return sheet;
}

function flatten(input, out) {
  if (input == null || input === '') return out;
  if (Array.isArray(input)) for (const item of input) flatten(item, out);
  else out.push(input);
  return out;
}

/**
 * 某个组件类最终使用的样式表：基础样式 + static styles。
 * static styles 可以是字符串、CSSStyleSheet 或它们的（嵌套）数组，
 * 想继承父类样式就写 `static styles = [super.styles, css`...`]`。
 */
export function stylesFor(cls) {
  let sheets = classCache.get(cls);
  if (!sheets) {
    sheets = [...new Set([baseStyles, ...flatten(cls.styles, [])].map(toSheet))];
    classCache.set(cls, sheets);
  }
  return sheets;
}
