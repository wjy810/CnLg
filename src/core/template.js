/**
 * Vunio 响应式模板（设计见 docs/rfc/0002-templates.md）
 *
 *   html`<p class=${cls} ?hidden=${flag} .value=${v} @click=${fn}>${content}</p>`
 *
 * 每个模板只编译一次（以 strings 数组为键缓存）：扫描插值所处的 HTML 上下文、
 * 打标记、交给浏览器解析成 <template>，再记下每个绑定是第几个节点。
 * 渲染时克隆 <template>，为每个绑定创建 Part；值是 signal 或函数时，
 * Part 用一个 effect 取值，只更新它自己负责的那一个节点或属性。
 */
import { computed, createEffect, createScope, isSignal, untrack } from './signals.js';

// ───────────────────────── 模板值 ─────────────────────────

export class TemplateResult {
  /**
   * @param {TemplateStringsArray} strings
   * @param {unknown[]} values
   * @param {'html' | 'svg'} kind
   */
  constructor(strings, values, kind) {
    this.strings = strings;
    this.values = values;
    this.kind = kind;
  }
}

/** HTML 模板 */
export function html(strings, ...values) {
  return new TemplateResult(strings, values, 'html');
}

/** SVG 片段模板（写在 <svg> 内部的内容不需要它） */
export function svg(strings, ...values) {
  return new TemplateResult(strings, values, 'svg');
}

class UnsafeHTML {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

/** 作为 HTML 插入，不转义。只用于你完全信任的内容。 */
export const unsafeHTML = (value) => new UnsafeHTML(String(value ?? ''));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** 转义 HTML 特殊字符 */
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** CSS 模板，只做字符串拼接（方便编辑器高亮） */
export function css(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += String(values[i]) + strings[i + 1];
  return out;
}

// ───────────────────────── 指令 ─────────────────────────

class RepeatDirective {
  constructor(items, key, template) {
    this.items = items;
    this.key = key;
    this.template = template;
  }
}

/**
 * 带 key 的列表。增删、重排时复用 DOM，移动次数最少。
 * @template T
 * @param {T[] | Iterable<T> | import('./signals.js').Signal<T[]> | (() => T[])} items
 * @param {(item: T, index: number) => unknown} key
 * @param {(item: T, index: number) => unknown} template
 */
export function repeat(items, key, template) {
  if (typeof key !== 'function' || typeof template !== 'function') {
    throw new TypeError('[Vunio] repeat(items, key, template)：key 和 template 都必须是函数');
  }
  return new RepeatDirective(items, key, template);
}

/**
 * 条件渲染。只在条件的真假变化时切换分支，旧分支的订阅随之释放。
 * @param {unknown} condition 值、signal 或函数
 * @param {() => unknown} then
 * @param {() => unknown} [otherwise]
 */
export function when(condition, then, otherwise) {
  const truthy = computed(() => Boolean(read(condition)));
  return () => (truthy.value ? untrack(then) : otherwise ? untrack(otherwise) : null);
}

// ───────────────────────── 编译 ─────────────────────────

const CHILD_MARKER = 'vn:';
const ELEMENT_MARKER = 'data-vn';
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

const PART_CHILD = 0;
const PART_ATTRIBUTE = 1;
const PART_BOOLEAN = 2;
const PART_PROPERTY = 3;
const PART_EVENT = 4;
const PART_NONE = 5;

const S_TEXT = 0;
const S_TAG_NAME = 1;
const S_IN_TAG = 2;
const S_ATTR_NAME = 3;
const S_AFTER_ATTR_NAME = 4;
const S_BEFORE_VALUE = 5;
const S_VALUE_UNQUOTED = 6;
const S_VALUE_DOUBLE = 7;
const S_VALUE_SINGLE = 8;
const S_COMMENT = 9;
const S_RAW = 10;
const S_CLOSE_TAG = 11;

const isSpace = (c) => c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f';

function templateError(strings, message) {
  const source = strings.join('${…}').replace(/\s+/g, ' ').trim();
  const snippet = source.length > 120 ? `${source.slice(0, 117)}...` : source;
  return new Error(`[Vunio] ${message}\n模板：${snippet}`);
}

/**
 * 扫描模板字符串，生成带标记的 HTML 和绑定描述
 * @param {readonly string[]} strings
 */
function compile(strings) {
  let out = '';
  /** @type {any[]} */
  const parts = [];
  let state = S_TEXT;
  let tagName = '';
  let rawTag = '';
  let attrName = '';
  let attrStart = 0;
  let valueStart = 0;
  /** @type {{ name: string, statics: string[], holes: number[] } | null} */
  let attr = null;
  let elementIndex = -1;
  let markedCount = 0;
  let childCount = 0;

  const fail = (message) => templateError(strings, message);

  const finishAttribute = () => {
    out = out.slice(0, attrStart);
    if (elementIndex < 0) {
      elementIndex = markedCount++;
      out += ` ${ELEMENT_MARKER}`;
    }
    const { name, statics, holes } = attr;
    const prefix = name[0];
    const whole = statics.length === 2 && statics[0] === '' && statics[1] === '';
    if (prefix === '@' || prefix === '.' || prefix === '?') {
      if (!whole) throw fail(`绑定 ${name} 必须独占整个属性值，例如 ${name}=\${value}`);
      const type = prefix === '@' ? PART_EVENT : prefix === '.' ? PART_PROPERTY : PART_BOOLEAN;
      parts.push({ type, element: elementIndex, name: name.slice(1), holes });
    } else {
      parts.push({ type: PART_ATTRIBUTE, element: elementIndex, name, statics, holes });
    }
    attr = null;
  };

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      switch (state) {
        case S_TEXT:
          if (c === '<') {
            if (s.startsWith('!--', k + 1)) {
              state = S_COMMENT;
              out += '<!--';
              k += 3;
              break;
            }
            const next = s[k + 1];
            if (next === '/') {
              state = S_CLOSE_TAG;
            } else if (next && /[a-zA-Z]/.test(next)) {
              state = S_TAG_NAME;
              tagName = '';
              elementIndex = -1;
            }
          }
          out += c;
          break;

        case S_TAG_NAME:
          if (isSpace(c) || c === '/' || c === '>') {
            state = S_IN_TAG;
            k--;
          } else {
            tagName += c.toLowerCase();
            out += c;
          }
          break;

        case S_IN_TAG:
          if (c === '>') {
            out += c;
            if (RAW_TEXT.has(tagName)) {
              state = S_RAW;
              rawTag = tagName;
            } else {
              state = S_TEXT;
            }
          } else if (isSpace(c) || c === '/') {
            out += c;
          } else {
            state = S_ATTR_NAME;
            attrStart = out.length;
            attrName = c;
            out += c;
          }
          break;

        case S_ATTR_NAME:
          if (c === '=') {
            state = S_BEFORE_VALUE;
            out += c;
          } else if (isSpace(c)) {
            state = S_AFTER_ATTR_NAME;
            out += c;
          } else if (c === '>' || c === '/') {
            state = S_IN_TAG;
            k--;
          } else {
            attrName += c;
            out += c;
          }
          break;

        case S_AFTER_ATTR_NAME:
          if (c === '=') {
            state = S_BEFORE_VALUE;
            out += c;
          } else if (isSpace(c)) {
            out += c;
          } else {
            state = S_IN_TAG;
            k--;
          }
          break;

        case S_BEFORE_VALUE:
          if (isSpace(c)) {
            out += c;
          } else if (c === '"' || c === "'") {
            state = c === '"' ? S_VALUE_DOUBLE : S_VALUE_SINGLE;
            out += c;
            valueStart = out.length;
          } else if (c === '>') {
            state = S_IN_TAG;
            k--;
          } else {
            state = S_VALUE_UNQUOTED;
            valueStart = out.length;
            out += c;
          }
          break;

        case S_VALUE_DOUBLE:
        case S_VALUE_SINGLE:
          if (c === (state === S_VALUE_DOUBLE ? '"' : "'")) {
            if (attr) finishAttribute();
            else out += c;
            state = S_IN_TAG;
          } else if (attr) {
            attr.statics[attr.statics.length - 1] += c;
          } else {
            out += c;
          }
          break;

        case S_VALUE_UNQUOTED:
          if (isSpace(c) || c === '>') {
            if (attr) finishAttribute();
            state = S_IN_TAG;
            k--;
          } else if (attr) {
            attr.statics[attr.statics.length - 1] += c;
          } else {
            out += c;
          }
          break;

        case S_COMMENT:
          out += c;
          if (c === '>' && out.endsWith('-->')) state = S_TEXT;
          break;

        case S_RAW:
          if (c === '<' && s.slice(k + 1, k + 2 + rawTag.length).toLowerCase() === `/${rawTag}`) {
            state = S_CLOSE_TAG;
          }
          out += c;
          break;

        case S_CLOSE_TAG:
          out += c;
          if (c === '>') state = S_TEXT;
          break;
      }
    }

    if (i === strings.length - 1) break;

    // 处理第 i 个插值
    switch (state) {
      case S_TEXT:
        out += `<!--${CHILD_MARKER}-->`;
        parts.push({ type: PART_CHILD, index: childCount++, holes: [i] });
        break;
      case S_BEFORE_VALUE:
        attr = { name: attrName, statics: ['', ''], holes: [i] };
        state = S_VALUE_UNQUOTED;
        break;
      case S_VALUE_DOUBLE:
      case S_VALUE_SINGLE:
      case S_VALUE_UNQUOTED:
        if (!attr) attr = { name: attrName, statics: [out.slice(valueStart)], holes: [] };
        attr.holes.push(i);
        attr.statics.push('');
        break;
      case S_COMMENT:
        parts.push({ type: PART_NONE, holes: [i] });
        break;
      case S_RAW:
        throw fail(
          rawTag === 'textarea'
            ? '<textarea> 内部不支持插值，请改用 <textarea .value=${value}></textarea>'
            : `<${rawTag}> 内部不支持插值${rawTag === 'style' ? '，样式请写在组件的 static styles 里' : ''}`,
        );
      default:
        throw fail('不支持在标签名、属性名或元素位置插值，插值只能出现在内容或属性值中');
    }
  }

  if (state !== S_TEXT || attr) throw fail('模板结束时还有未闭合的标签或属性');
  return { markup: out, parts, markedCount, childCount };
}

/** @type {WeakMap<readonly string[], { html?: Template, svg?: Template }>} */
const templateCache = new WeakMap();

/**
 * @typedef {{ element: HTMLTemplateElement, parts: any[] }} Template
 */

/** @returns {Template} */
function getTemplate(result) {
  let entry = templateCache.get(result.strings);
  if (!entry) templateCache.set(result.strings, (entry = {}));
  return (entry[result.kind] ??= prepare(result.strings, result.kind));
}

function prepare(strings, kind) {
  const { markup, parts, markedCount, childCount } = compile(strings);
  const element = document.createElement('template');
  if (kind === 'svg') {
    element.innerHTML = `<svg>${markup}</svg>`;
    const wrapper = element.content.firstChild;
    wrapper.replaceWith(...wrapper.childNodes);
  } else {
    element.innerHTML = markup;
  }

  const elementNodes = [];
  const childNodes = [];
  const walker = document.createTreeWalker(element.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  for (let index = 0; walker.nextNode(); index++) {
    const node = walker.currentNode;
    if (node instanceof Element) {
      if (node.hasAttribute(ELEMENT_MARKER)) {
        node.removeAttribute(ELEMENT_MARKER);
        elementNodes.push(index);
      }
    } else if (/** @type {Comment} */ (node).data === CHILD_MARKER) {
      childNodes.push(index);
    }
  }

  if (elementNodes.length !== markedCount || childNodes.length !== childCount) {
    throw templateError(
      strings,
      'HTML 解析结果与模板不符，插值位置丢失。请检查标签是否正确闭合，以及 <p>、<table> 等元素的嵌套是否合法',
    );
  }

  const resolved = [];
  for (const part of parts) {
    if (part.type === PART_NONE) continue;
    const node = part.type === PART_CHILD ? childNodes[part.index] : elementNodes[part.element];
    resolved.push({ ...part, node });
  }
  resolved.sort((a, b) => a.node - b.node);
  return { element, parts: resolved };
}

// ───────────────────────── 工具 ─────────────────────────

const isReactive = (value) => isSignal(value) || typeof value === 'function';

/** signal 取 .value，函数调用求值，其他原样返回 */
function read(value) {
  if (isSignal(value)) return value.value;
  if (typeof value === 'function') return value();
  return value;
}

/** 连续解开：函数返回 signal、signal 里装着函数等情况 */
function readDeep(value) {
  let result = read(value);
  for (let depth = 0; isReactive(result) && depth < 8; depth++) result = read(result);
  return result;
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

function stringifyAttribute(name, value) {
  if (name === 'class') {
    if (Array.isArray(value)) return value.filter(Boolean).join(' ');
    if (isPlainObject(value)) return Object.keys(value).filter((key) => value[key]).join(' ');
  }
  if (name === 'style' && isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, v]) => v != null && v !== false && v !== '')
      .map(([key, v]) => `${key.startsWith('--') ? key : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${v}`)
      .join('; ');
  }
  return String(value);
}

const marker = () => document.createComment('');

/** 删除 start 与 end 之间的节点（不含两端） */
function removeBetween(start, end) {
  if (start.nextSibling === end) return;
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  range.deleteContents();
}

/** 把 start…end（含两端）移动到 anchor 之前 */
function moveRange(start, end, anchor) {
  const parent = anchor.parentNode;
  let node = start;
  for (;;) {
    const next = node.nextSibling;
    parent.insertBefore(node, anchor);
    if (node === end) break;
    node = next;
  }
}

/** 最长递增子序列（忽略 -1），返回位于子序列中的下标集合 */
function longestIncreasingSubsequence(values) {
  const tails = [];
  const prev = new Array(values.length).fill(-1);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value < 0) continue;
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (values[tails[mid]] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    tails[lo] = i;
  }
  const result = new Set();
  for (let i = tails.length ? tails[tails.length - 1] : -1; i >= 0; i = prev[i]) result.add(i);
  return result;
}

// ───────────────────────── Part ─────────────────────────

const EMPTY = 0;
const TEXT = 1;
const NODE = 2;
const RAW_HTML = 3;
const INSTANCE = 4;
const LIST = 5;
const KEYED = 6;

const UNSET = Symbol('unset');

/** 一段动态内容，用一对注释节点圈定范围 */
class ChildPart {
  /**
   * @param {Comment} start
   * @param {Comment} end
   * @param {{ host?: unknown }} context
   * @param {import('./signals.js').Scope} scope
   * @param {number} [hole]
   */
  constructor(start, end, context, scope, hole = -1) {
    this.start = start;
    this.end = end;
    this.context = context;
    this.scope = scope;
    this.hole = hole;
    this.raw = UNSET;
    this.binding = null;
    this.kind = EMPTY;
    /** @type {any} */
    this.content = null;
    /** @type {import('./signals.js').Scope | null} */
    this.contentScope = null;
  }

  setValues(values) {
    this.setValue(values[this.hole]);
  }

  setValue(value) {
    if (value === this.raw) return;
    this.raw = value;
    this.binding?.dispose();
    this.binding = null;

    if (isReactive(value)) {
      this.binding = createEffect(() => {
        const resolved = readDeep(value);
        untrack(() => this.commit(resolved));
      }, this.scope);
    } else if (value instanceof RepeatDirective && isReactive(value.items)) {
      this.binding = createEffect(() => {
        const items = readDeep(value.items);
        untrack(() => this.commitRepeat(value, items));
      }, this.scope);
    } else {
      this.commit(value);
    }
  }

  commit(value) {
    if (value == null || value === false || value === '') return this.clear();
    if (value instanceof TemplateResult) return this.commitTemplate(value);
    if (value instanceof RepeatDirective) return this.commitRepeat(value, readDeep(value.items));
    if (value instanceof UnsafeHTML) return this.commitHTML(value.value);
    if (value instanceof Node) return this.commitNode(value);
    if (typeof value === 'object' && typeof value[Symbol.iterator] === 'function') return this.commitList(value);
    return this.commitText(String(value));
  }

  commitText(text) {
    if (this.kind === TEXT) {
      if (this.content.data !== text) this.content.data = text;
      return;
    }
    this.clear();
    const node = document.createTextNode(text);
    this.end.before(node);
    this.kind = TEXT;
    this.content = node;
  }

  commitNode(node) {
    if (this.kind === NODE && this.content === node) return;
    this.clear();
    this.end.before(node);
    this.kind = NODE;
    this.content = node;
  }

  commitHTML(markup) {
    if (this.kind === RAW_HTML && this.content === markup) return;
    this.clear();
    const template = document.createElement('template');
    template.innerHTML = markup;
    this.end.before(template.content);
    this.kind = RAW_HTML;
    this.content = markup;
  }

  commitTemplate(result) {
    const template = getTemplate(result);
    if (this.kind === INSTANCE && this.content.template === template) {
      this.content.update(result.values);
      return;
    }
    this.clear();
    const scope = createScope(this.scope);
    const instance = scope.run(() => {
      const created = new TemplateInstance(template, this.context, scope);
      created.update(result.values);
      return created;
    });
    this.end.before(instance.fragment);
    this.kind = INSTANCE;
    this.content = instance;
    this.contentScope = scope;
  }

  /** 无 key 列表：按位置复用 */
  commitList(iterable) {
    const values = Array.from(iterable);
    if (this.kind !== LIST) {
      this.clear();
      this.kind = LIST;
      this.content = [];
      this.contentScope = createScope(this.scope);
    }
    /** @type {ChildPart[]} */
    const items = this.content;
    for (let i = 0; i < values.length; i++) {
      let item = items[i];
      if (!item) {
        const start = marker();
        const end = marker();
        this.end.before(start, end);
        item = new ChildPart(start, end, this.context, this.contentScope);
        items.push(item);
      }
      item.setValue(values[i]);
    }
    while (items.length > values.length) items.pop().remove();
  }

  /** 带 key 的列表：删除 → 最长递增子序列 → 从后往前插入 / 移动 / 更新 */
  commitRepeat(directive, itemsValue) {
    const items = itemsValue == null ? [] : Array.from(itemsValue);
    if (this.kind !== KEYED) {
      this.clear();
      this.kind = KEYED;
      this.content = { rows: new Map(), order: [], warned: false };
      this.contentScope = createScope(this.scope);
    }
    const state = this.content;
    const { rows } = state;

    const keys = new Array(items.length);
    const seen = new Set();
    for (let i = 0; i < items.length; i++) {
      let key = directive.key(items[i], i);
      if (seen.has(key)) {
        if (!state.warned) {
          state.warned = true;
          console.warn(`[Vunio] repeat 中出现重复的 key：${String(key)}。重复项会被当作新项渲染。`);
        }
        key = Symbol('duplicate');
      }
      seen.add(key);
      keys[i] = key;
    }

    // 1. 删除不再存在的项
    for (const row of state.order) {
      if (!seen.has(row.key)) {
        row.scope.dispose();
        const range = document.createRange();
        range.setStartBefore(row.part.start);
        range.setEndAfter(row.part.end);
        range.deleteContents();
        rows.delete(row.key);
      }
    }

    // 2. 仍存在的项在旧列表中的位置；最长递增子序列里的项不用移动
    const oldIndex = new Map();
    state.order.forEach((row, i) => oldIndex.set(row.key, i));
    const sources = keys.map((key) => (rows.has(key) ? oldIndex.get(key) : -1));
    const stable = longestIncreasingSubsequence(sources);

    // 3. 从后往前：新建 / 移动 / 更新
    const order = new Array(items.length);
    let anchor = this.end;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      let row = rows.get(keys[i]);
      if (!row) {
        const start = marker();
        const end = marker();
        anchor.before(start, end);
        const scope = createScope(this.contentScope);
        row = { key: keys[i], item, index: i, scope, part: new ChildPart(start, end, this.context, scope) };
        rows.set(keys[i], row);
        const rendered = untrack(() => directive.template(item, i));
        row.part.setValue(rendered);
      } else {
        if (!stable.has(i)) moveRange(row.part.start, row.part.end, anchor);
        if (row.item !== item || row.index !== i) {
          row.item = item;
          row.index = i;
          const rendered = untrack(() => directive.template(item, i));
          row.part.setValue(rendered);
        }
      }
      order[i] = row;
      anchor = row.part.start;
    }
    state.order = order;
  }

  /** 释放内容的订阅并删除节点（保留两端的注释） */
  clear() {
    if (this.kind === EMPTY) return;
    this.contentScope?.dispose();
    this.contentScope = null;
    removeBetween(this.start, this.end);
    this.kind = EMPTY;
    this.content = null;
  }

  /** 彻底移除（列表项被删除时） */
  remove() {
    this.binding?.dispose();
    this.binding = null;
    this.clear();
    this.start.remove();
    this.end.remove();
  }
}

class AttributePart {
  constructor(element, name, statics, holes, scope) {
    this.element = element;
    this.name = name;
    this.statics = statics;
    this.holes = holes;
    this.scope = scope;
    this.raws = null;
    this.binding = null;
    this.last = UNSET;
  }

  setValues(values) {
    const raws = this.holes.map((i) => values[i]);
    if (this.raws && raws.every((value, i) => value === this.raws[i])) return;
    this.raws = raws;
    this.binding?.dispose();
    this.binding = null;
    if (raws.some(isReactive)) {
      this.binding = createEffect(() => {
        const resolved = raws.map(readDeep);
        untrack(() => this.commit(resolved));
      }, this.scope);
    } else {
      this.commit(raws);
    }
  }

  commit(values) {
    const { statics, name } = this;
    let value;
    if (statics.length === 2 && statics[0] === '' && statics[1] === '') {
      value = values[0] == null ? null : stringifyAttribute(name, values[0]);
    } else {
      value = statics[0];
      for (let i = 0; i < values.length; i++) {
        value += (values[i] == null ? '' : stringifyAttribute(name, values[i])) + statics[i + 1];
      }
    }
    if (value === this.last) return;
    this.last = value;
    if (value === null) this.element.removeAttribute(name);
    else this.element.setAttribute(name, value);
  }
}

class BooleanAttributePart {
  constructor(element, name, hole, scope) {
    this.element = element;
    this.name = name;
    this.hole = hole;
    this.scope = scope;
    this.raw = UNSET;
    this.binding = null;
  }

  setValues(values) {
    const value = values[this.hole];
    if (value === this.raw) return;
    this.raw = value;
    this.binding?.dispose();
    this.binding = null;
    if (isReactive(value)) {
      this.binding = createEffect(() => {
        const on = Boolean(readDeep(value));
        untrack(() => this.element.toggleAttribute(this.name, on));
      }, this.scope);
    } else {
      this.element.toggleAttribute(this.name, Boolean(value));
    }
  }
}

class PropertyPart {
  constructor(element, name, hole, scope) {
    this.element = element;
    this.name = name;
    this.hole = hole;
    this.scope = scope;
    this.raw = UNSET;
    this.binding = null;
  }

  setValues(values) {
    const value = values[this.hole];
    if (value === this.raw) return;
    this.raw = value;
    this.binding?.dispose();
    this.binding = null;
    // 只有 signal 是响应式的：函数可能本身就是要传的值
    if (isSignal(value)) {
      this.binding = createEffect(() => {
        const resolved = value.value;
        untrack(() => this.commit(resolved));
      }, this.scope);
    } else {
      this.commit(value);
    }
  }

  commit(value) {
    if (!Object.is(this.element[this.name], value)) this.element[this.name] = value;
  }
}

class EventPart {
  constructor(element, name, hole, context) {
    this.element = element;
    this.name = name;
    this.hole = hole;
    this.context = context;
    this.handler = null;
    this.listening = false;
  }

  setValues(values) {
    this.handler = values[this.hole];
    if (!this.listening && this.handler != null) {
      this.element.addEventListener(this.name, this);
      this.listening = true;
    }
  }

  handleEvent(event) {
    const handler = this.handler;
    if (typeof handler === 'function') handler.call(this.context.host ?? this.element, event);
    else if (handler && typeof handler.handleEvent === 'function') handler.handleEvent(event);
  }
}

class TemplateInstance {
  /**
   * @param {Template} template
   * @param {{ host?: unknown }} context
   * @param {import('./signals.js').Scope} scope
   */
  constructor(template, context, scope) {
    this.template = template;
    this.fragment = document.importNode(template.element.content, true);
    this.parts = [];

    const walker = document.createTreeWalker(this.fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
    let index = -1;
    let node = null;
    for (const def of template.parts) {
      while (index < def.node) {
        node = walker.nextNode();
        index++;
      }
      this.parts.push(createPart(def, node, context, scope));
    }
  }

  update(values) {
    for (const part of this.parts) part.setValues(values);
  }
}

function createPart(def, node, context, scope) {
  const hole = def.holes[0];
  switch (def.type) {
    case PART_CHILD: {
      const start = marker();
      node.before(start);
      node.data = '';
      return new ChildPart(start, node, context, scope, hole);
    }
    case PART_ATTRIBUTE:
      return new AttributePart(node, def.name, def.statics, def.holes, scope);
    case PART_BOOLEAN:
      return new BooleanAttributePart(node, def.name, hole, scope);
    case PART_PROPERTY:
      return new PropertyPart(node, def.name, hole, scope);
    case PART_EVENT:
      return new EventPart(node, def.name, hole, context);
  }
  throw new Error(`[Vunio] 未知的绑定类型：${def.type}`);
}

// ───────────────────────── render ─────────────────────────

/** @type {WeakMap<Node, { scope: import('./signals.js').Scope, part: ChildPart }>} */
const roots = new WeakMap();

/**
 * 把模板（或任何内容位置能接受的值）渲染进容器。
 * 对同一容器再次调用会原地更新。返回的作用域 dispose() 后停止所有绑定并清空内容。
 * @param {unknown} value
 * @param {Element | DocumentFragment} container
 * @param {{ host?: unknown }} [options] host：事件处理函数中的 this
 */
export function render(value, container, options = {}) {
  let root = roots.get(container);
  if (!root || root.scope.disposed) {
    const scope = createScope(null);
    const start = marker();
    const end = marker();
    container.append(start, end);
    const part = new ChildPart(start, end, { host: options.host }, scope);
    root = { scope, part };
    roots.set(container, root);
    scope.onDispose(() => {
      part.clear();
      start.remove();
      end.remove();
      roots.delete(container);
    });
  }
  const { scope, part } = root;
  untrack(() => scope.run(() => part.setValue(value)));
  return scope;
}
