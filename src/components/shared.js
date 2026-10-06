// 组件共用的样式片段
import { css } from '../core/index.js';

/** 表单字段：标签、信笺式下划线（聚焦时笔触展开）、提示 / 错误 */
export const fieldStyles = css`
  :host {
    display: block;
    color: var(--vn-fg);
  }
  .field {
    display: grid;
    gap: 6px;
  }
  .label {
    color: var(--vn-fg-muted);
    font-size: var(--vn-font-size-sm);
    letter-spacing: var(--vn-tracking-wider);
  }
  .required {
    color: var(--vn-danger);
  }
  .control {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--vn-space-2);
    min-block-size: 40px;
    border-block-end: var(--vn-border-thin) solid var(--vn-line-strong);
    transition: border-color var(--vn-duration-normal) var(--vn-ease-standard);
  }
  .control:hover {
    border-block-end-color: var(--vn-fg-muted);
  }
  /* 聚焦时一道笔触从中间展开 */
  .underline {
    position: absolute;
    inset-inline: 0;
    inset-block-end: -3px;
    block-size: 5px;
    background: var(--vn-fg);
    -webkit-mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
    mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
    transform: scaleX(0);
    transition: transform var(--vn-duration-normal) var(--vn-ease-enter);
    pointer-events: none;
  }
  .control:focus-within .underline,
  :host(:state(open)) .underline {
    transform: scaleX(1);
  }
  :host(:state(user-invalid)) .control {
    border-block-end-color: var(--vn-danger);
  }
  :host(:state(user-invalid)) .underline {
    background: var(--vn-danger);
  }
  :host(:disabled) .field {
    opacity: 0.5;
  }
  .message {
    display: flex;
    justify-content: space-between;
    gap: var(--vn-space-3);
    min-block-size: 1.5em;
    color: var(--vn-fg-muted);
    font-size: var(--vn-font-size-xs);
  }
  :host(:state(user-invalid)) .message {
    color: var(--vn-danger);
  }
  .count {
    margin-inline-start: auto;
    font-variant-numeric: tabular-nums;
  }
`;

/**
 * 文字类控件共用的校验：必填、字数（按字符计，一个汉字算一个）、正则。
 * @returns {{ flags: Partial<ValidityState>, message: string } | null}
 */
export function validateText(value, { required, minlength, maxlength, pattern }) {
  if (value === '') return required ? { flags: { valueMissing: true }, message: '此项为必填' } : null;
  const length = [...value].length;
  if (minlength && length < minlength) return { flags: { tooShort: true }, message: `至少需要 ${minlength} 个字` };
  if (maxlength && length > maxlength) return { flags: { tooLong: true }, message: `最多 ${maxlength} 个字` };
  if (pattern) {
    try {
      if (!new RegExp(`^(?:${pattern})$`, 'u').test(value)) return { flags: { patternMismatch: true }, message: '格式不正确' };
    } catch {
      // 无效的正则：与原生一致，忽略
    }
  }
  return null;
}
