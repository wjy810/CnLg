/**
 * 属性系统：把 static props 声明变成 getter/setter，并和 HTML attribute 同步。
 *
 * 规则：
 * - String / Number / Boolean 属性以 attribute 为唯一真相：
 *   读属性 = 读 attribute，写属性 = 写 attribute。
 * - Object / Array（或 attribute: false）只存在 JS 属性上，不出现在 HTML 里。
 * - 驼峰属性名对应短横线 attribute：maxLength ↔ max-length。
 * - Boolean 遵循 HTML 习惯：只看有没有这个 attribute，disabled="false" 也算 true。
 */

/** 实例上存放非 attribute 属性值的位置 */
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

function defineAccessor(proto, def) {
  // 组件自己写了同名 getter/setter 时，尊重组件的实现
  if (Object.getOwnPropertyDescriptor(proto, def.name)) return;
  const { name, attribute } = def;

  Object.defineProperty(proto, name, {
    configurable: true,
    enumerable: true,
    get() {
      if (attribute) return parse(def, this.getAttribute(attribute), this.localName);
      const store = this[STORE];
      if (!store.has(name)) store.set(name, defaultOf(def));
      return store.get(name);
    },
    set(value) {
      if (attribute) {
        // 写 attribute 后由 attributeChangedCallback 触发更新
        if (def.type === Boolean) this.toggleAttribute(attribute, Boolean(value));
        else if (value == null) this.removeAttribute(attribute);
        else this.setAttribute(attribute, String(value));
        return;
      }
      const store = this[STORE];
      const old = store.get(name);
      store.set(name, value);
      if (!Object.is(old, value)) this.requestUpdate(name);
    },
  });
}

/**
 * 组件类（含父类）合并后的属性定义。首次调用时在原型上生成访问器。
 * @returns {{ defs: Map<string, object>, byAttr: Map<string, string> }}
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

  const byAttr = new Map();
  for (const def of defs.values()) if (def.attribute) byAttr.set(def.attribute, def.name);

  result = { defs, byAttr };
  cache.set(cls, result);
  return result;
}
