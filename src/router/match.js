/**
 * 路径匹配（纯函数，设计见 docs/rfc/0005-router.md）
 *
 *   /components          静态
 *   /components/:name    参数
 *   /docs/*              通配（匹配剩余的零个或多个段）
 */

const RANK = { static: 3, param: 2, wild: 1 };

const segmentsOf = (path) => path.split('/').filter(Boolean);

function decode(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * 编译路径模式
 * @param {string} pattern
 */
export function compile(pattern) {
  const parts = segmentsOf(pattern).map((segment, i, all) => {
    if (segment === '*') {
      if (i !== all.length - 1) throw new Error(`[Vunio] 路由 "${pattern}"：通配符 * 只能放在最后`);
      return { type: 'wild' };
    }
    if (segment.startsWith(':')) return { type: 'param', name: segment.slice(1) };
    return { type: 'static', value: decode(segment) };
  });
  return { pattern, parts, rank: parts.map((p) => RANK[p.type]) };
}

/**
 * 用编译后的模式匹配路径，返回参数对象或 null
 * @param {ReturnType<typeof compile>} compiled
 * @param {string} path
 */
export function matchPath(compiled, path) {
  const segments = segmentsOf(path);
  /** @type {Record<string, string>} */
  const params = {};
  const { parts } = compiled;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === 'wild') {
      params['*'] = segments.slice(i).map(decode).join('/');
      return params;
    }
    const segment = segments[i];
    if (segment === undefined) return null;
    if (part.type === 'static') {
      if (decode(segment) !== part.value) return null;
    } else {
      params[part.name] = decode(segment);
    }
  }
  return segments.length === parts.length ? params : null;
}

/** 模式在这一段“没有内容”：比通配（匹配了空）更具体，比参数宽松 */
const MISSING = 1.5;

/** 比较具体程度：逐段比较（静态 > 参数 > 无 > 通配）。返回负数表示 a 更具体 */
function compareRank(a, b) {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const x = a[i] ?? MISSING;
    const y = b[i] ?? MISSING;
    if (x !== y) return y - x;
  }
  return 0;
}

/**
 * 在路由表中找到最具体的匹配
 * @template T
 * @param {{ compiled: ReturnType<typeof compile>, def: T, index: number }[]} table
 * @param {string} path
 * @returns {{ def: T, params: Record<string, string> } | null}
 */
export function findRoute(table, path) {
  let best = null;
  for (const entry of table) {
    const params = matchPath(entry.compiled, path);
    if (!params) continue;
    if (!best || compareRank(entry.compiled.rank, best.entry.compiled.rank) < 0) best = { entry, params };
  }
  return best ? { def: best.entry.def, params: best.params } : null;
}

/**
 * 解析 "/a/b?x=1#h" 形式的地址
 * @param {string} raw
 */
export function parseLocation(raw) {
  const hashIndex = raw.indexOf('#');
  const hash = hashIndex >= 0 ? raw.slice(hashIndex + 1) : '';
  const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const queryIndex = beforeHash.indexOf('?');
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';
  const query = Object.fromEntries(new URLSearchParams(search));
  const path = `/${segmentsOf(pathname).join('/')}`;
  return { path, query, hash: decode(hash), search: search ? `?${search}` : '' };
}
