/**
 * Vunio 路由（设计见 docs/rfc/0005-router.md）
 *
 *   const router = createRouter({ routes, mode: 'hash' });
 *   router.start();
 *   html`<main>${router.outlet()}</main>`
 */
import { computed, createScope, effect, signal, untrack } from '../core/signals.js';
import { html } from '../core/template.js';
import { compile, findRoute, parseLocation } from './match.js';

export { compile, matchPath, findRoute, parseLocation } from './match.js';

/**
 * @typedef {{ params: Record<string, string>, query: Record<string, string>, path: string }} RouteContext
 * @typedef {{
 *   path: string,
 *   view?: (ctx: RouteContext) => unknown,
 *   load?: () => Promise<{ default: (ctx: RouteContext) => unknown }>,
 *   title?: string | ((params: Record<string, string>) => string),
 *   [key: string]: unknown,
 * }} RouteDef
 * @typedef {{ path: string, query: Record<string, string>, hash: string, search: string,
 *   params: Record<string, string>, def: RouteDef | null }} Route
 */

/**
 * 创建路由
 * @param {{
 *   routes: RouteDef[],
 *   mode?: 'hash' | 'history',
 *   base?: string,
 *   notFound?: (ctx: RouteContext) => unknown,
 *   loading?: () => unknown,
 *   error?: (error: unknown) => unknown,
 *   title?: string,
 * }} options
 */
export function createRouter(options) {
  const {
    routes,
    mode = 'hash',
    base = '',
    notFound = () => html`<p>此页不存在。</p>`,
    loading = () => html`<vn-loading></vn-loading>`,
    error = (e) => html`<p>页面加载失败：${String(/** @type {any} */ (e)?.message ?? e)}</p>`,
    title: defaultTitle,
  } = options;
  if (mode !== 'hash' && mode !== 'history') throw new Error(`[Vunio] 未知的路由模式 "${mode}"`);

  const table = routes.map((def, index) => ({ compiled: compile(def.path), def, index }));
  /** @type {import('../core/signals.js').Signal<ReturnType<typeof parseLocation>> | undefined} */
  let location;
  location = signal(readLocation());
  const loads = new Map();
  const loadTick = signal(0);
  let scope = null;
  let pendingScroll = null;
  /** 用户导航后要把焦点移到新页面的主标题（首次打开页面时不移动） */
  let pendingFocus = false;
  let previousRestoration = null;

  /** @type {import('../core/signals.js').Computed<Route>} */
  const route = computed(() => {
    const loc = location.value;
    const found = findRoute(table, loc.path);
    return { ...loc, params: found?.params ?? {}, def: found?.def ?? null };
  });

  /** hash 模式下不以 #/ 开头的 hash（如 #section）是页内锚点，不是路由 */
  function isAnchorHash(hash) {
    return mode === 'hash' && hash.length > 1 && !hash.startsWith('#/');
  }

  function readLocation() {
    if (mode === 'hash') {
      const raw = window.location.hash;
      if (isAnchorHash(raw)) return location?.peek() ?? parseLocation('/');
      return parseLocation(raw.slice(1) || '/');
    }
    let path = window.location.pathname;
    if (base && path.startsWith(base)) path = path.slice(base.length);
    return parseLocation(`${path}${window.location.search}${window.location.hash}`);
  }

  /** 生成链接地址 */
  function href(to) {
    return mode === 'hash' ? `#${to}` : `${base}${to}`;
  }

  /** 跳转。replace 为 true 时替换当前历史记录 */
  function navigate(to, { replace = false } = {}) {
    const url = href(to);
    // 记下离开前的滚动位置，后退时恢复
    history.replaceState({ ...history.state, vnScroll: [window.scrollX, window.scrollY] }, '');
    if (replace) history.replaceState({ vnScroll: null }, '', url);
    else history.pushState({ vnScroll: null }, '', url);
    pendingScroll = 'top';
    pendingFocus = true;
    location.value = readLocation();
  }

  /** 滚动到页内锚点，并把地址栏还原为当前路由 */
  function jumpToAnchor(hash) {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    const current = location.peek();
    history.replaceState(history.state, '', href(`${current.path}${current.search}`));
    if (!target) return;
    target.scrollIntoView();
    if (!target.hasAttribute('tabindex') && !target.matches('a[href], button, input, select, textarea')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }

  function sync(event) {
    if (isAnchorHash(window.location.hash)) return jumpToAnchor(window.location.hash);
    const next = readLocation();
    const current = location.peek();
    if (next.path === current.path && next.search === current.search && next.hash === current.hash) return;
    const saved = event?.state?.vnScroll;
    pendingScroll = Array.isArray(saved) ? saved : 'top';
    pendingFocus = true;
    location.value = next;
  }

  /** 接管站内链接：同源、无 target / download、未按修饰键 */
  function handleClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.composedPath().find((node) => node instanceof HTMLAnchorElement);
    if (!anchor || !anchor.href || anchor.hasAttribute('download')) return;
    if (anchor.target && anchor.target !== '_self') return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (mode === 'hash') {
      if (url.pathname !== window.location.pathname || !url.hash) return;
      event.preventDefault();
      if (isAnchorHash(url.hash)) jumpToAnchor(url.hash);
      else navigate(decodeURI(url.hash.slice(1)));
    } else {
      if (base && !url.pathname.startsWith(base)) return;
      event.preventDefault();
      navigate(`${url.pathname.slice(base.length) || '/'}${url.search}${url.hash}`);
    }
  }

  function viewFor(def) {
    if (def.view) return def.view;
    if (!def.load) return null;
    let entry = loads.get(def);
    if (!entry) {
      entry = { status: 'loading', view: null, error: null };
      loads.set(def, entry);
      def.load().then(
        (mod) => {
          entry.status = 'loaded';
          entry.view = mod.default;
          loadTick.value++;
        },
        (e) => {
          entry.status = 'error';
          entry.error = e;
          loadTick.value++;
        },
      );
    }
    if (entry.status === 'loaded') return entry.view;
    if (entry.status === 'error') return () => error(entry.error);
    return () => loading();
  }

  /** 当前路由的视图，放进模板：${router.outlet()} */
  function outlet() {
    return html`<div data-vn-outlet>${() => {
      loadTick.value;
      const r = route.value;
      const ctx = { params: r.params, query: r.query, path: r.path };
      if (!r.def) return untrack(() => notFound(ctx));
      const view = viewFor(r.def);
      return view ? untrack(() => view(ctx)) : null;
    }}</div>`;
  }

  /** 当前路径是否在 path 之下（exact 时要求完全相同）；响应式 */
  function isActive(path, { exact = false } = {}) {
    const current = route.value.path;
    if (exact || path === '/') return current === path;
    return current === path || current.startsWith(`${path}/`);
  }

  /** 页面切换后：设置标题、滚动、把焦点移到主标题 */
  function afterNavigate(r) {
    const titleOf = r.def?.title;
    const value = typeof titleOf === 'function' ? titleOf(r.params) : titleOf;
    if (value || defaultTitle) document.title = value || defaultTitle;

    const scroll = pendingScroll;
    pendingScroll = null;
    requestAnimationFrame(() => {
      if (Array.isArray(scroll)) window.scrollTo(scroll[0], scroll[1]);
      else if (scroll === 'top') {
        const anchor = mode === 'history' && r.hash ? document.getElementById(r.hash) : null;
        if (anchor) anchor.scrollIntoView();
        else window.scrollTo(0, 0);
      }
      if (!pendingFocus) return;
      // 懒加载的页面还没出来时先不动，加载完成后会再次调用
      /** @type {HTMLElement | null} */
      const heading = document.querySelector('[data-vn-outlet]')?.querySelector('h1, [role="heading"]');
      if (!heading) return;
      pendingFocus = false;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    });
  }

  function start() {
    if (scope) return router;
    scope = createScope(null);
    previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    document.addEventListener('click', handleClick);
    location.value = readLocation();
    scope.run(() =>
      effect(() => {
        const r = route.value;
        loadTick.value;
        untrack(() => afterNavigate(r));
      }),
    );
    return router;
  }

  function stop() {
    if (!scope) return;
    scope.dispose();
    scope = null;
    history.scrollRestoration = previousRestoration ?? 'auto';
    window.removeEventListener('popstate', sync);
    window.removeEventListener('hashchange', sync);
    document.removeEventListener('click', handleClick);
  }

  const router = { route, navigate, href, isActive, outlet, start, stop, mode, base };
  return router;
}
