// 示例 store：共享状态就是模块里的 signal。写操作封装成函数导出，组件不直接给 signal 赋值。
import { signal, computed } from '../../src/index.js';

export const THEMES = ['风', '花', '雪', '月'];

let nextId = 5;

export const poems = signal([
  { id: 1, theme: '花', text: '人面不知何处去，桃花依旧笑春风', favorite: true },
  { id: 2, theme: '雪', text: '忽如一夜春风来，千树万树梨花开', favorite: false },
  { id: 3, theme: '风', text: '解落三秋叶，能开二月花', favorite: false },
  { id: 4, theme: '月', text: '海上生明月，天涯共此时', favorite: true },
]);

export const onlyFavorites = signal(false);

/** 当前显示的诗句 */
export const visible = computed(() => (onlyFavorites.value ? poems.value.filter((p) => p.favorite) : poems.value));

export const stats = computed(() => ({
  total: poems.value.length,
  favorites: poems.value.filter((p) => p.favorite).length,
}));

export function addPoem(text, theme) {
  poems.value = [{ id: nextId++, theme, text, favorite: false }, ...poems.value];
}

export function toggleFavorite(id) {
  poems.value = poems.value.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p));
}

export function removePoem(id) {
  poems.value = poems.value.filter((p) => p.id !== id);
}

export function reverse() {
  poems.value = [...poems.value].reverse();
}

/** 打乱顺序（保证和原来不同） */
export function shuffle() {
  const list = poems.value;
  if (list.length < 2) return;
  let next;
  do {
    next = [...list];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
  } while (next.every((p, i) => p === list[i]));
  poems.value = next;
}
