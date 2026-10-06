/**
 * 属性系统：把 static props 声明变成 getter/setter，并和 HTML attribute 同步。
 *
 * 规则：
 * - String / Number / Boolean 属性以 attribute 为唯一真相：
 *   写属性 = 写 attribute；attribute 变化时同步到内部的 signal。
 * - Object / Array（或 attribute: false）只存在 JS 属性上，不出现在 HTML 里。
 * - 驼峰属性名对应短横线 attribute：maxLength ↔ max-length。
 * - Boolean 遵循 HTML 习惯：只看有没有这个 attribute，disabled="false" 也算 true。
 * - 每个属性由一个 signal 承载，所以在 computed / effect / 模板中读取会自动建立依赖。
 */
import { signal } from './signals.js';

/** 实例上存放属性 signal 的位置 */
export const STORE = Symbol('vunio.props');

const cache = new WeakMap();
const warned = new Set();

const toKebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function normalize(name, input) {
  const opt = typeof input === 'function' ? { type: input } : { ...input };
  const type = opt.type ?? String;
  const rich = type === Object || type === Array;
  let attribute = null;
  if (opt.attribute !== false && !rich) {
    attribute = typeof opt.attribute === 'string' ? opt.attribute : toKebab(name);
  }
  if (type === Boolean && attribute && opt.default === true) {
    // 布尔 attribute 只看有没有，无法表达“默认为真”：没有这个 attribute 时永远是 false
    console.warn(`[Vunio] 属性 ${name} 是 Boolean，default: true 不会生效。请改用反义的名字（如 open → closed），默认为 false。`);
  }
  return Object.freeze({
    name,
    type,
    attribute,
    default: opt.default,
    values: opt.values ? Object.freeze([...opt.values]) : null,
  });
}

/** 属性的默认值。default 是函数时每次调用生成新值（适合数组/对象）。 */
export function defaultOf(def) {
  const d = def.default;
  if (typeof d === 'function') return d();
  if (d !== undefined) return d;
  if (def.type === Boolean) return false;
  if (def.type === Number) return 0;
  if (def.type === String) return '';
  return null;
}

function parse(def, raw, tag) {
  if (def.type === Boolean) return raw !== null;
  if (raw === null) return defaultOf(def);
  if (def.type === Number) {
    const n = raw.trim() === '' ? NaN : Number(raw);
    return Number.isNaN(n) ? defaultOf(def) : n;
  }
  if (def.values && !def.values.includes(raw)) {
    const key = `${tag}|${def.attribute}|${raw}`;
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(
        `[Vunio] <${tag}> 的 ${def.attribute}="${raw}" 无效，可选值：${def.values.join(' | ')}，已使用默认值。`,
      );
    }
    return defaultOf(def);
  }
  return raw;
}

/** 属性对应的 signal（首次访问时按当前 attribute 创建） */
function propSignal(element, def) {
  const store = element[STORE];
  let state = store.get(def.name);
  if (!state) {
    const initial = def.attribute
      ? parse(def, element.getAttribute(def.attribute), element.localName)
      : defaultOf(def);
    state = signal(initial);
    store.set(def.name, state);
  }
  return state;
}

/** attribute 变化时调用：把新值同步到属性的 signal */
export function syncAttribute(element, def, raw) {
  const state = element[STORE].get(def.name);
  if (state) state.value = parse(def, raw, element.localName);
}

function defineAccessor(proto, def) {
  // 组件自己写了同名 getter/setter 时，尊重组件的实现
  if (Object.getOwnPropertyDescriptor(proto, def.name)) return;
  const { name, attribute } = def;

  Object.defineProperty(proto, name, {
    configurable: true,
    enumerable: true,
    get() {
      return propSignal(this, def).value;
    },
    set(value) {
      if (attribute) {
        // 写 attribute 后由 attributeChangedCallback 同步 signal 并触发 update
        if (def.type === Boolean) this.toggleAttribute(attribute, Boolean(value));
        else if (value == null) this.removeAttribute(attribute);
        else this.setAttribute(attribute, String(value));
        return;
      }
      const state = propSignal(this, def);
      if (Object.is(state.peek(), value)) return;
      state.value = value;
      this.requestUpdate(name);
    },
  });
}

/**
 * 组件类（含父类）合并后的属性定义。首次调用时在原型上生成访问器。
 * @returns {{ defs: Map<string, any>, byAttr: Map<string, any> }}
 */
export function propsOf(cls) {
  let result = cache.get(cls);
  if (result) return result;

  const parent = Object.getPrototypeOf(cls);
  const inherited = parent && 'props' in parent ? propsOf(parent) : null;
  const defs = new Map(inherited?.defs);

  if (Object.hasOwn(cls, 'props')) {
    for (const [name, input] of Object.entries(cls.props ?? {})) {
      const def = normalize(name, input);
      defs.set(name, def);
      defineAccessor(cls.prototype, def);
    }
  }

  /** @type {Map<string, object>} attribute 名 → 属性定义 */
  const byAttr = new Map();
  for (const def of defs.values()) if (def.attribute) byAttr.set(def.attribute, def);

  result = { defs, byAttr };
  cache.set(cls, result);
  return result;
}
