/**
 * Vunio 响应式内核（设计见 docs/rfc/0001-signals.md）
 *
 *   signal    可写的值
 *   computed  派生值：惰性求值、缓存、无人订阅时自动退订上游
 *   effect    副作用：依赖变化后同步重新运行（最外层 batch 结束时）
 *   createScope  作用域：收集 effect，可暂停 / 恢复 / 释放
 *
 * 算法：推拉结合 + 版本号。写入时只向下“标记”，读取或执行 effect 前
 * 再沿依赖逐个比较版本号，确认真的变了才重新计算，因此没有毛刺。
 */

const NOTIFIED = 1 << 0; // 已入队（effect）/ 已向下标记（computed）
const OUTDATED = 1 << 1; // computed 可能过期
const RUNNING = 1 << 2; // 计算 / 执行中，用于检测循环
const TRACKING = 1 << 3; // computed 正在订阅上游
const HAS_ERROR = 1 << 4; // computed 缓存的是错误
const PAUSED = 1 << 5;
const DISPOSED = 1 << 6;
const FORCE = 1 << 7; // 恢复时必须重新运行（暂停时执行过清理函数）

const MAX_ITERATIONS = 100;

/** 所有者按创建顺序编号：同一轮里先运行先创建的 effect（外层先于内层） */
let nextOwnerId = 0;

/** @type {Computed | Effect | null} 正在收集依赖的节点 */
let evalContext = null;
/** @type {Owner | null} 新建 effect / 作用域的归属 */
let currentOwner = null;
let batchDepth = 0;
/** @type {Effect[]} */
let queue = [];
let globalVersion = 0;

function report(error) {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
  else console.error(error);
}

/** 运行清理函数：出错时报告，不打断其余的清理 */
function cleanupSafely(fn) {
  try {
    untrack(fn);
  } catch (error) {
    report(error);
  }
}

// ───────────────────────── signal ─────────────────────────

/**
 * @template T
 */
export class Signal {
  /**
   * @param {T} value
   * @param {{ equals?: ((a: T, b: T) => boolean) | false }} [options]
   */
  constructor(value, options) {
    /** @type {any} */
    this._value = value;
    this._version = 0;
    /** @type {Set<Computed | Effect> | null} */
    this._observers = null;
    this._equals = options?.equals ?? Object.is;
  }

  /** @returns {T} */
  get value() {
    evalContext?._depend(this);
    return this._value;
  }

  set value(value) {
    if (evalContext instanceof Computed) {
      throw new Error('[Vunio] 不能在 computed 中修改 signal：派生值不应有副作用');
    }
    if (this._equals !== false && this._equals(this._value, value)) return;
    this._value = value;
    this._version++;
    globalVersion++;
    batchDepth++;
    try {
      if (this._observers) for (const node of this._observers) node._notify();
    } finally {
      endBatch();
    }
  }

  /** 读取但不建立依赖 */
  peek() {
    return this._value;
  }

  /** TC39 Signals 风格的别名 */
  get() {
    return this.value;
  }

  set(value) {
    this.value = value;
  }

  toString() {
    return String(this.value);
  }

  toJSON() {
    return this.value;
  }

  /** @returns {boolean} 值是否可用（computed 会在这里按需重算） */
  _refresh() {
    return true;
  }

  _subscribe(node) {
    (this._observers ??= new Set()).add(node);
  }

  _unsubscribe(node) {
    this._observers?.delete(node);
  }
}

// ───────────────────────── computed ─────────────────────────

/**
 * @template T
 * @extends {Signal<T>}
 */
export class Computed extends Signal {
  /**
   * @param {() => T} fn
   * @param {{ equals?: ((a: T, b: T) => boolean) | false }} [options]
   */
  constructor(fn, options) {
    super(undefined, options);
    this._fn = fn;
    this._flags = OUTDATED;
    this._globalVersion = globalVersion - 1;
    /** @type {Map<Signal, number>} 上游 → 上次看到的版本号 */
    this._sources = new Map();
    /** @type {Map<Signal, number> | null} */
    this._newSources = null;
  }

  /** @returns {T} */
  get value() {
    if (this._flags & RUNNING) throw new Error('[Vunio] computed 存在循环依赖');
    const context = evalContext;
    this._refresh();
    context?._depend(this);
    if (this._flags & HAS_ERROR) throw this._value;
    return this._value;
  }

  set value(_) {
    throw new Error('[Vunio] computed 是只读的');
  }

  peek() {
    return untrack(() => this.value);
  }

  _depend(source) {
    if (!this._newSources.has(source)) this._newSources.set(source, source._version);
  }

  _isSubscribed() {
    return Boolean(this._flags & TRACKING);
  }

  _notify() {
    if (this._flags & NOTIFIED) return;
    this._flags |= OUTDATED | NOTIFIED;
    if (this._observers) for (const node of this._observers) node._notify();
  }

  _refresh() {
    this._flags &= ~NOTIFIED;
    if (this._flags & RUNNING) return false;
    // 正在订阅上游且没被标记过期 → 缓存一定是新的
    if ((this._flags & (OUTDATED | TRACKING)) === TRACKING) return true;
    this._flags &= ~OUTDATED;
    // 自上次检查以来没有任何 signal 被写过
    if (this._globalVersion === globalVersion) return true;
    this._globalVersion = globalVersion;

    this._flags |= RUNNING;
    if (this._version > 0 && !needsToRecompute(this)) {
      this._flags &= ~RUNNING;
      return true;
    }

    const prevContext = evalContext;
    this._newSources = new Map();
    evalContext = this;
    try {
      const value = this._fn();
      if (this._flags & HAS_ERROR || this._version === 0 || this._equals === false || !this._equals(this._value, value)) {
        this._value = value;
        this._flags &= ~HAS_ERROR;
        this._version++;
      }
    } catch (error) {
      this._value = error;
      this._flags |= HAS_ERROR;
      this._version++;
    } finally {
      evalContext = prevContext;
      finishTracking(this);
      this._flags &= ~RUNNING;
    }
    return true;
  }

  _subscribe(node) {
    if (!this._observers?.size) {
      // 第一个下游到来：开始订阅上游，并假定缓存可能过期
      this._flags |= OUTDATED | TRACKING;
      for (const source of this._sources.keys()) source._subscribe(this);
    }
    super._subscribe(node);
  }

  _unsubscribe(node) {
    super._unsubscribe(node);
    if (this._flags & TRACKING && !this._observers?.size) {
      // 最后一个下游离开：退订上游，避免被上游长期引用
      this._flags &= ~TRACKING;
      for (const source of this._sources.keys()) source._unsubscribe(this);
    }
  }
}

// ───────────────────────── 所有权 ─────────────────────────

class Owner {
  /** @param {Owner | null} [owner] 不传则归属当前所有者，传 null 表示独立的根 */
  constructor(owner) {
    this._id = nextOwnerId++;
    this._flags = 0;
    /** @type {Set<Owner> | null} */
    this._children = null;
    /** @type {Owner | null} */
    this._owner = null;
    const parent = owner === undefined ? currentOwner : owner;
    if (parent) {
      (parent._children ??= new Set()).add(this);
      this._owner = parent;
      if (parent._flags & PAUSED) this._flags |= PAUSED | FORCE;
      if (parent._flags & DISPOSED) this._flags |= DISPOSED;
    }
  }

  get paused() {
    return Boolean(this._flags & PAUSED);
  }

  get disposed() {
    return Boolean(this._flags & DISPOSED);
  }

  /** 暂停：退订上游但保留状态 */
  pause() {
    if (this._flags & (PAUSED | DISPOSED)) return;
    this._flags |= PAUSED;
    this._onPause();
    if (this._children) for (const child of [...this._children]) child.pause();
  }

  /** 恢复：只重新运行暂停期间依赖变化过的 effect */
  resume() {
    if (!(this._flags & PAUSED) || this._flags & DISPOSED) return;
    this._flags &= ~PAUSED;
    batchDepth++;
    try {
      this._onResume();
      if (this._children) for (const child of [...this._children]) child.resume();
    } finally {
      endBatch();
    }
  }

  /** 释放：停止并清理，不可恢复 */
  dispose() {
    if (this._flags & DISPOSED) return;
    this._flags |= DISPOSED;
    this._disposeChildren();
    this._onDispose();
    this._owner?._children?.delete(this);
    this._owner = null;
  }

  _disposeChildren() {
    const children = this._children;
    if (!children?.size) return;
    this._children = null;
    for (const child of [...children].reverse()) {
      child._owner = null;
      child.dispose();
    }
  }

  _onPause() {}

  _onResume() {}

  _onDispose() {}
}

/** 作用域：收集其中创建的 effect 和子作用域 */
export class Scope extends Owner {
  /** @type {(() => void)[] | null} */
  _cleanups = null;

  /**
   * 在作用域内执行 fn，其间创建的 effect / 作用域都归它所有
   * @template T
   * @param {() => T} fn
   * @returns {T}
   */
  run(fn) {
    const prevOwner = currentOwner;
    currentOwner = this;
    try {
      return fn();
    } finally {
      currentOwner = prevOwner;
    }
  }

  /** 注册释放时执行的函数 */
  onDispose(fn) {
    if (this._flags & DISPOSED) cleanupSafely(fn);
    else (this._cleanups ??= []).push(fn);
  }

  _onDispose() {
    const cleanups = this._cleanups;
    this._cleanups = null;
    if (cleanups) for (const fn of cleanups.reverse()) cleanupSafely(fn);
  }
}

// ───────────────────────── effect ─────────────────────────

class Effect extends Owner {
  /**
   * @param {() => (void | (() => void))} fn
   * @param {Owner | null} [owner]
   */
  constructor(fn, owner) {
    super(owner);
    this._fn = fn;
    /** @type {Map<Signal, number>} */
    this._sources = new Map();
    /** @type {Map<Signal, number> | null} */
    this._newSources = null;
    /** @type {(() => void) | null} */
    this._cleanup = null;
  }

  _depend(source) {
    if (!this._newSources.has(source)) this._newSources.set(source, source._version);
  }

  _isSubscribed() {
    return !(this._flags & (PAUSED | DISPOSED));
  }

  _notify() {
    if (this._flags & NOTIFIED) return;
    this._flags |= NOTIFIED;
    queue.push(this);
  }

  _run() {
    if (this._flags & (RUNNING | DISPOSED)) return;
    this._flags = (this._flags | RUNNING) & ~FORCE;
    this._teardown();

    const prevContext = evalContext;
    const prevOwner = currentOwner;
    this._newSources = new Map();
    evalContext = this;
    currentOwner = this;
    batchDepth++;
    try {
      const result = this._fn();
      if (typeof result === 'function') {
        if (this._flags & (PAUSED | DISPOSED)) {
          // 运行途中被暂停或释放：这次的副作用不能留着
          cleanupSafely(result);
          if (!(this._flags & DISPOSED)) this._flags |= FORCE;
        } else {
          this._cleanup = result;
        }
      }
    } finally {
      evalContext = prevContext;
      currentOwner = prevOwner;
      finishTracking(this);
      this._flags &= ~RUNNING;
      endBatch();
    }
  }

  /** 运行清理函数，并释放上一次运行中创建的子 effect */
  _teardown() {
    const cleanup = this._cleanup;
    this._cleanup = null;
    if (cleanup) cleanupSafely(cleanup);
    this._disposeChildren();
  }

  _onPause() {
    for (const source of this._sources.keys()) source._unsubscribe(this);
    if (this._cleanup) {
      const cleanup = this._cleanup;
      this._cleanup = null;
      cleanupSafely(cleanup);
      this._flags |= FORCE;
    }
  }

  _onResume() {
    if (this._flags & FORCE || needsToRecompute(this)) {
      // 重新运行会重新收集并订阅依赖
      this._sources = new Map();
      runSafely(this);
    } else {
      for (const source of this._sources.keys()) source._subscribe(this);
    }
  }

  _onDispose() {
    for (const source of this._sources.keys()) source._unsubscribe(this);
    this._sources.clear();
    const cleanup = this._cleanup;
    this._cleanup = null;
    if (cleanup) cleanupSafely(cleanup);
  }
}

// ───────────────────────── 内部函数 ─────────────────────────

/** 上游中是否有版本号变化（上游是 computed 时先让它自检） */
function needsToRecompute(target) {
  for (const [source, version] of target._sources) {
    if (source._version !== version || !source._refresh() || source._version !== version) return true;
  }
  return false;
}

/** 用本次运行收集到的依赖替换旧依赖，并调整订阅 */
function finishTracking(node) {
  const prev = node._sources;
  const next = node._newSources;
  node._newSources = null;
  node._sources = next;
  if (!node._isSubscribed()) return;
  for (const source of prev.keys()) if (!next.has(source)) source._unsubscribe(node);
  for (const source of next.keys()) if (!prev.has(source)) source._subscribe(node);
}

function runSafely(effect) {
  try {
    effect._run();
  } catch (error) {
    report(error);
  }
}

function endBatch() {
  if (batchDepth > 1) {
    batchDepth--;
    return;
  }
  let iterations = 0;
  try {
    while (queue.length) {
      if (++iterations > MAX_ITERATIONS) {
        const dropped = queue;
        queue = [];
        for (const effect of dropped) {
          effect._flags &= ~NOTIFIED;
          // 让中间的 computed 也清掉“已标记”，否则它们以后不会再向下通知
          for (const source of effect._sources.keys()) source._refresh();
        }
        throw new Error(`[Vunio] effect 互相触发超过 ${MAX_ITERATIONS} 轮，可能存在循环依赖`);
      }
      const effects = queue;
      queue = [];
      if (effects.length > 1) effects.sort((a, b) => a._id - b._id);
      for (const effect of effects) {
        effect._flags &= ~NOTIFIED;
        if (effect._flags & (PAUSED | DISPOSED)) continue;
        if (effect._flags & FORCE || needsToRecompute(effect)) runSafely(effect);
      }
    }
  } finally {
    batchDepth--;
  }
}

// ───────────────────────── 公开 API ─────────────────────────

/**
 * 创建可写的值
 * @template T
 * @param {T} value
 * @param {{ equals?: ((a: T, b: T) => boolean) | false }} [options]
 * @returns {Signal<T>}
 */
export function signal(value, options) {
  return new Signal(value, options);
}

/**
 * 创建派生值
 * @template T
 * @param {() => T} fn
 * @param {{ equals?: ((a: T, b: T) => boolean) | false }} [options]
 * @returns {Computed<T>}
 */
export function computed(fn, options) {
  return new Computed(fn, options);
}

/**
 * 创建副作用：立即运行，依赖变化时重新运行。
 * fn 可以返回清理函数，在下次运行前和释放时调用。
 * @param {() => (void | (() => void))} fn
 * @returns {() => void} 释放函数
 */
export function effect(fn) {
  return createEffect(fn).dispose;
}

/**
 * 内部使用：创建归属指定所有者的 effect
 * @param {() => (void | (() => void))} fn
 * @param {Owner | null} [owner]
 */
export function createEffect(fn, owner) {
  const node = new Effect(fn, owner);
  node.dispose = node.dispose.bind(node);
  if (!(node._flags & (PAUSED | DISPOSED))) runSafely(node);
  return node;
}

/**
 * 创建作用域
 * @param {Scope | null} [parent] 不传则归属当前所有者，传 null 表示独立的根
 * @returns {Scope}
 */
export function createScope(parent) {
  return new Scope(parent);
}

/**
 * 合并多次写入：fn 结束后 effect 才统一运行
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function batch(fn) {
  batchDepth++;
  try {
    return fn();
  } finally {
    endBatch();
  }
}

/**
 * 执行 fn，其中的读取不建立依赖
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
  const prevContext = evalContext;
  evalContext = null;
  try {
    return fn();
  } finally {
    evalContext = prevContext;
  }
}

/** @returns {value is Signal<any>} */
export function isSignal(value) {
  return value instanceof Signal;
}
