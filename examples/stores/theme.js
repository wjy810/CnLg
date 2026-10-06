// 昼夜模式 store：昼 / 夜 / 跟随系统。选择会记在 localStorage 里。
import { signal, computed, effect } from '../../src/index.js';

export const MODES = [
  ['day', '昼'],
  ['night', '夜'],
  ['auto', '随'],
];

const KEY = 'vunio-mode';
const read = () => {
  try {
    const saved = localStorage.getItem(KEY);
    return MODES.some(([value]) => value === saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
};

/** 用户选择的模式 */
export const mode = signal(read());

const media = matchMedia('(prefers-color-scheme: dark)');
const prefersDark = signal(media.matches);
media.addEventListener('change', (event) => (prefersDark.value = event.matches));

/** 实际生效的模式 */
export const resolvedMode = computed(() => (mode.value === 'auto' ? (prefersDark.value ? 'night' : 'day') : mode.value));

export function setMode(value) {
  mode.value = value;
}

// 应用到页面并记住选择（全局 effect，随页面存在）
effect(() => {
  document.documentElement.dataset.mode = mode.value;
  try {
    localStorage.setItem(KEY, mode.value);
  } catch {
    // 隐私模式等情况下无法保存，忽略
  }
});
