/**
 * VunioElement —— Vunio 所有组件的基类。
 *
 * 生命周期（顺序固定）：
 *
 *   constructor            创建 internals、Shadow DOM，挂上共享样式（不读 attribute、不碰子元素）
 *   connectedCallback      首次：render() 写入 Shadow DOM，收集 data-ref
 *                          每次：update(全部) → mounted()
 *   属性 / attribute 变化  同一微任务内合并，统一调用一次 update(changed)
 *   disconnectedCallback   自动解绑 on() 事件，停止 loop / timeout / observe* / animate，
 *                          执行 onCleanup 注册的函数，然后调用 unmounted()
 *
 * 组件只需要写四个钩子：render / update / mounted / unmounted。
 */
import { STORE, propsOf } from './props.js';
import { stylesFor } from './styles.js';

const reducedMotion =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/**
 * update() 收到的变更集合。首次更新时 has() 对任何名字都返回 true，
 * 所以 `if (changed.has('label'))` 这种写法首次也会执行。
 */
class Changes extends Set {
  constructor(initial, names) {
    super(names);
    /** 是否为挂载时的完整更新 */
    this.initial = initial;
  }

  has(name) {
    return this.initial || super.has(name);
  }
}

export class VunioElement extends HTMLElement {
  /** 自定义元素标签名，例如 'vn-button' */
  static tag = '';

  /**
   * 属性声明。
   * @example
   * static props = {
   *   label: String,
   *   size: { type: String, default: 'md', values: ['sm', 'md', 'lg'] },
   *   count: { type: Number, default: 0 },
   *   disabled: Boolean,
   *   items: { type: Array, default: () => [] },   // 只存在 JS 属性上
   * };
   */
  static props = {};

  /** 组件样式：字符串、CSSStyleSheet 或它们的数组 */
  static styles = '';

  /** @type {ShadowRootInit} attachShadow 的参数 */
  static shadowOptions = { mode: 'open' };

  static get observedAttributes() {
    return [...propsOf(this).byAttr.keys()];
  }

  /** 注册为自定义元素（重复注册会被忽略） */
  static define(tag = this.tag) {
    if (!tag) throw new Error(`[Vunio] ${this.name} 缺少 static tag`);
    const existing = customElements.get(tag);
    if (existing) {
      if (existing !== this) console.warn(`[Vunio] <${tag}> 已被另一个类注册，忽略 ${this.name}`);
      return this;
    }
    customElements.define(tag, this);
    return this;
  }

  /** @type {ElementInternals} 表单、ARIA、自定义状态都通过它 */
  internals;

  /** @type {ShadowRoot} 组件的 Shadow DOM 根 */
  root;

  /** @type {Record<string, any>} render() 里带 data-ref="名字" 的元素（HTMLElement 或 SVGElement） */
  refs = {};

  #rendered = false;
  /** @type {{ controller: AbortController, cleanups: Set<() => void>, animations: Set<Animation> } | null} */
  #conn = null;
  #changed = new Set();
  /** @type {Promise<void> | null} */
  #pending = null;

  constructor() {
    super();
    this[STORE] = new Map();
    this.internals = this.attachInternals();
    // 已有声明式 Shadow DOM（服务端渲染）时直接复用
    const cls = /** @type {typeof VunioElement} */ (this.constructor);
    this.root = this.internals.shadowRoot ?? this.attachShadow({ ...cls.shadowOptions });
    this.root.adoptedStyleSheets = stylesFor(cls);
  }

  // ───────────────────────── 生命周期 ─────────────────────────

  connectedCallback() {
    this.#conn = { controller: new AbortController(), cleanups: new Set(), animations: new Set() };

    if (!this.#rendered) {
      this.#upgradeProps();
      this.#guard('render', () => {
        if (!this.root.hasChildNodes()) {
          const out = this.render();
          if (out != null) this.root.innerHTML = String(out);
        }
        this.collectRefs();
      });
      this.#rendered = true;
    }

    this.#changed.clear();
    this.#guard('update', () => this.update(new Changes(true, propsOf(this.constructor).defs.keys())));
    this.#guard('mounted', () => this.mounted());
  }

  disconnectedCallback() {
    const conn = this.#conn;
    if (!conn) return;
    this.#conn = null;
    conn.controller.abort();
    for (const animation of conn.animations) animation.cancel();
    for (const cleanup of [...conn.cleanups].reverse()) this.#guard('cleanup', cleanup);
    this.#guard('unmounted', () => this.unmounted());
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (oldValue === newValue) return;
    const name = propsOf(this.constructor).byAttr.get(attr);
    if (name) this.requestUpdate(name);
  }

  // ───────────────────────── 组件要写的钩子 ─────────────────────────

  /**
   * 返回 Shadow DOM 的初始结构（只调用一次）。
   * 用 data-ref="名字" 标记需要操作的元素，之后通过 this.refs.名字 访问。
   * @returns {string | import('./template.js').SafeHTML | null}
   */
  render() {
    return '<slot></slot>';
  }

  /**
   * 把属性同步到 DOM。挂载时调用一次（changed.has(任何名字) 都为 true），
   * 之后每次属性变化调用，changed 里是变化的属性名。
   * @param {Set<string> & { initial: boolean }} changed
   */
  update(changed) {}

  /** 挂载（每次插入文档）后调用：在这里用 this.on() 绑定事件、启动 loop 等 */
  mounted() {}

  /** 移除后调用。on / loop / timeout / observe* / animate 已经自动清理，这里只处理额外的资源。 */
  unmounted() {}

  // ───────────────────────── 更新调度 ─────────────────────────

  /** 标记某个属性变化，在微任务中合并调用 update()。组件未挂载时忽略（挂载时会完整更新）。 */
  requestUpdate(name) {
    if (!this.#rendered || !this.#conn) return this.updateComplete;
    if (name) this.#changed.add(name);
    if (!this.#pending) {
      this.#pending = Promise.resolve().then(() => {
        this.#pending = null;
        if (!this.#conn) return void this.#changed.clear();
        const changed = new Changes(false, this.#changed);
        this.#changed = new Set();
        this.#guard('update', () => this.update(changed));
      });
    }
    return this.#pending;
  }

  /** 等待所有待处理的更新完成（包括 update 中又触发的更新） */
  get updateComplete() {
    return (async () => {
      while (this.#pending) await this.#pending;
    })();
  }

  // ───────────────────────── 自动清理的工具 ─────────────────────────

  /**
   * 绑定事件，组件移除时自动解绑。handler 里的 this 指向组件。
   * @returns {() => void} 手动解绑
   */
  on(target, type, handler, options) {
    const conn = this.#require('on');
    const opts = typeof options === 'boolean' ? { capture: options } : { ...options };
    opts.signal = opts.signal ? AbortSignal.any([opts.signal, conn.controller.signal]) : conn.controller.signal;
    const listener = typeof handler === 'function' ? handler.bind(this) : handler;
    target.addEventListener(type, listener, opts);
    return () => target.removeEventListener(type, listener, opts);
  }

  /**
   * 注册一个在组件移除时执行的清理函数。
   * @returns {() => void} 取消注册
   */
  onCleanup(fn) {
    const conn = this.#require('onCleanup');
    conn.cleanups.add(fn);
    return () => conn.cleanups.delete(fn);
  }

  /**
   * setTimeout，组件移除时自动取消。
   * @returns {() => void} 取消
   */
  timeout(fn, ms = 0) {
    const conn = this.#require('timeout');
    const cancel = () => {
      clearTimeout(id);
      conn.cleanups.delete(cancel);
    };
    const id = setTimeout(() => {
      conn.cleanups.delete(cancel);
      fn.call(this);
    }, ms);
    conn.cleanups.add(cancel);
    return cancel;
  }

  /**
   * 每帧调用 tick(dt, now)，组件移除时自动停止。tick 返回 false 也会停止。
   * dt 是距上一帧的毫秒数，最大 64ms，避免切回标签页时画面跳变。
   * @returns {{ pause(): void, resume(): void, stop(): void, readonly running: boolean }}
   */
  loop(tick) {
    const conn = this.#require('loop');
    let id = 0;
    let last = 0;
    let running = false;
    let stopped = false;

    const frame = (now) => {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      if (tick.call(this, dt, now) === false) return handle.stop();
      if (running) id = requestAnimationFrame(frame);
    };

    const handle = {
      get running() {
        return running;
      },
      pause() {
        if (!running) return;
        running = false;
        cancelAnimationFrame(id);
      },
      resume() {
        if (running || stopped) return;
        running = true;
        last = 0;
        id = requestAnimationFrame(frame);
      },
      stop() {
        stopped = true;
        handle.pause();
        conn.cleanups.delete(handle.stop);
      },
    };

    conn.cleanups.add(handle.stop);
    handle.resume();
    return handle;
  }

  /** ResizeObserver，组件移除时自动断开。callback(最新的 entry, 全部 entries) */
  observeResize(target, callback, options) {
    const conn = this.#require('observeResize');
    const observer = new ResizeObserver((entries) => callback.call(this, entries.at(-1), entries));
    observer.observe(target, options);
    conn.cleanups.add(() => observer.disconnect());
    return observer;
  }

  /** IntersectionObserver，组件移除时自动断开。callback(最新的 entry, 全部 entries) */
  observeIntersection(target, callback, options) {
    const conn = this.#require('observeIntersection');
    const observer = new IntersectionObserver((entries) => callback.call(this, entries.at(-1), entries), options);
    observer.observe(target);
    conn.cleanups.add(() => observer.disconnect());
    return observer;
  }

  /** MutationObserver，组件移除时自动断开。callback(records) */
  observeMutation(target, callback, options) {
    const conn = this.#require('observeMutation');
    const observer = new MutationObserver((records) => callback.call(this, records));
    observer.observe(target, options);
    conn.cleanups.add(() => observer.disconnect());
    return observer;
  }

  /**
   * Web Animations API 的封装：组件移除时自动取消；
   * 用户开启“减少动态效果”时时长为 0，直接跳到结束状态。
   * @returns {Animation}
   */
  animate(element, keyframes, options) {
    const conn = this.#require('animate');
    const timing = typeof options === 'number' ? { duration: options } : { ...options };
    if (this.prefersReducedMotion) Object.assign(timing, { duration: 0, delay: 0, endDelay: 0, iterations: 1 });
    const animation = element.animate(keyframes, timing);
    conn.animations.add(animation);
    const forget = () => conn.animations.delete(animation);
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
    return animation;
  }

  // ───────────────────────── 其他工具 ─────────────────────────

  /**
   * 从组件派发事件（冒泡、穿透 Shadow DOM、可取消）。
   * @returns {boolean} 没有被 preventDefault() 时为 true
   */
  emit(type, detail, options) {
    return this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable: true, ...options }),
    );
  }

  /** 设置自定义状态，CSS 中用 :host(:state(名字)) 匹配 */
  setState(name, on = true) {
    const states = this.internals.states;
    if (!states) return;
    try {
      if (on) states.add(name);
      else states.delete(name);
    } catch {
      // 旧版 Chromium 只接受 --name 形式
      if (on) states.add(`--${name}`);
      else states.delete(`--${name}`);
    }
  }

  hasState(name) {
    const states = this.internals.states;
    return Boolean(states && (states.has(name) || states.has(`--${name}`)));
  }

  /**
   * 监听插槽是否有内容，并自动设置 :state(has-插槽名)（默认插槽为 has-default）。
   * 在 mounted() 中调用。
   * @param {string} [name] 插槽名，留空为默认插槽
   * @param {(hasContent: boolean, slot: HTMLSlotElement) => void} [callback]
   */
  watchSlot(name = '', callback) {
    const slot = this.#slot(name);
    if (!slot) throw new Error(`[Vunio] <${this.localName}> 中找不到插槽 "${name || '默认'}"`);
    const check = () => {
      const has = slotHasContent(slot);
      this.setState(`has-${name || 'default'}`, has);
      callback?.call(this, has, slot);
    };
    this.on(slot, 'slotchange', check);
    check();
  }

  /** 插槽当前是否有内容（忽略空白文本） */
  hasSlotted(name = '') {
    const slot = this.#slot(name);
    return Boolean(slot && slotHasContent(slot));
  }

  /** 重新收集 data-ref（组件在 render 之后自己改了结构时调用） */
  collectRefs() {
    /** @type {Record<string, any>} */
    const refs = {};
    for (const el of this.root.querySelectorAll('[data-ref]')) refs[el.getAttribute('data-ref')] = el;
    this.refs = refs;
    return refs;
  }

  /** Shadow DOM 内查询 */
  $(selector) {
    return this.root.querySelector(selector);
  }

  $$(selector) {
    return [...this.root.querySelectorAll(selector)];
  }

  /** 用户是否开启了“减少动态效果” */
  get prefersReducedMotion() {
    return Boolean(reducedMotion?.matches);
  }

  // ───────────────────────── 内部 ─────────────────────────

  #require(method) {
    if (!this.#conn) {
      throw new Error(`[Vunio] <${this.localName}>.${method}() 只能在组件挂载期间调用（update / mounted 及之后）`);
    }
    return this.#conn;
  }

  #slot(name) {
    return this.root.querySelector(name ? `slot[name="${CSS.escape(name)}"]` : 'slot:not([name])');
  }

  /**
   * 元素升级前就被设置的属性（el.label = 'x' 写在 define 之前）会变成实例自身的属性，
   * 遮住原型上的 setter。这里把它们删掉，再通过 setter 重新赋值一次。
   */
  #upgradeProps() {
    const proto = Object.getPrototypeOf(this);
    for (const key of Object.keys(this)) {
      if (!hasSetter(proto, key)) continue;
      const value = this[key];
      delete this[key];
      this[key] = value;
    }
  }

  #guard(phase, fn) {
    try {
      fn();
    } catch (error) {
      console.error(`[Vunio] <${this.localName}> ${phase} 出错：`, error);
    }
  }
}

function hasSetter(proto, key) {
  for (let p = proto; p && p !== HTMLElement.prototype; p = Object.getPrototypeOf(p)) {
    const descriptor = Object.getOwnPropertyDescriptor(p, key);
    if (descriptor) return Boolean(descriptor.set);
  }
  return false;
}

function slotHasContent(slot) {
  return slot
    .assignedNodes({ flatten: true })
    .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
}
