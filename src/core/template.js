/**
 * 模板工具：html`` 自动转义插值，css`` 只做拼接（方便编辑器高亮）。
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** 转义 HTML 特殊字符 */
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** 已确认安全、不再转义的 HTML 片段 */
export class SafeHTML {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function toHTML(value) {
  if (value == null || value === false) return '';
  if (value instanceof SafeHTML) return value.value;
  if (Array.isArray(value)) return value.map(toHTML).join('');
  return escapeHTML(value);
}

/**
 * HTML 模板。插值默认转义，嵌套的 html`` 和数组会原样拼接。
 * @example html`<span title="${title}">${items.map((i) => html`<b>${i}</b>`)}</span>`
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += toHTML(values[i]) + strings[i + 1];
  return new SafeHTML(out);
}

/** 跳过转义，直接插入 HTML。只用于你完全信任的内容。 */
export const unsafeHTML = (value) => new SafeHTML(String(value));

/** CSS 模板，只做字符串拼接 */
export function css(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += String(values[i]) + strings[i + 1];
  return out;
}
