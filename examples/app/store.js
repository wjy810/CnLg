// 诗笺的数据：诗作列表存在 localStorage 里。写操作都封装成函数，页面不直接给 signal 赋值。
import { signal, computed, effect } from '../../src/index.js';
import { SEED } from './seed.js';

const KEY = 'vunio-app-poems';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // 没有存过或数据损坏：用示例数据
  }
  return SEED.map((poem) => ({ ...poem }));
}

/** 全部诗作，新的在前 */
export const poems = signal(load());

// 任何修改都写回 localStorage
effect(() => {
  const value = poems.value;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // 隐私模式等情况下无法保存，忽略
  }
});

/** 所有标签，按出现次数排序 */
export const allTags = computed(() => {
  const counts = new Map();
  for (const poem of poems.value) for (const tag of poem.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
});

export const favoriteCount = computed(() => poems.value.filter((p) => p.favorite).length);

/** 按 id 查找 */
export const findPoem = (id) => poems.value.find((p) => p.id === id) ?? null;

/** 搜索：标题、作者、正文、标签里出现关键字，且包含所有选中的标签 */
export function searchPoems(list, { q = '', tags = [] } = {}) {
  const keyword = q.trim();
  return list.filter(
    (poem) =>
      tags.every((tag) => poem.tags.includes(tag)) &&
      (!keyword || [poem.title, poem.author, poem.text, ...poem.tags].some((field) => field.includes(keyword))),
  );
}

const nextId = () => Math.max(0, ...poems.peek().map((p) => p.id)) + 1;

/** 新增，返回新诗的 id */
export function addPoem(fields) {
  const id = nextId();
  poems.value = [{ ...fields, id, favorite: false }, ...poems.value];
  return id;
}

export function updatePoem(id, fields) {
  poems.value = poems.value.map((p) => (p.id === id ? { ...p, ...fields, id } : p));
}

export function removePoem(id) {
  poems.value = poems.value.filter((p) => p.id !== id);
}

export function toggleFavorite(id) {
  poems.value = poems.value.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p));
}

/** 恢复示例数据 */
export function resetPoems() {
  poems.value = SEED.map((poem) => ({ ...poem }));
}

/** 正文字号（设置页可调），存在 localStorage */
export const fontScale = signal(Number(localStorage.getItem('vunio-app-font')) || 1);
effect(() => {
  document.documentElement.style.setProperty('--app-poem-scale', String(fontScale.value));
  try {
    localStorage.setItem('vunio-app-font', String(fontScale.value));
  } catch {
    // 忽略
  }
});
