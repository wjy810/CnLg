// 外观 store：主题（古风 / 赛博）与昼夜（昼 / 夜 / 随）。选择会记在 localStorage 里。
// 页面头部的内联脚本会在首次渲染前应用保存的选择（见 site/index.html），这里负责之后的切换。
import { signal, computed, effect } from '../../src/index.js';

export const THEMES = [
  ['guofeng', '古风'],
  ['cyber', '赛博'],
];

export const MODES = [
  ['day', '昼'],
  ['night', '夜'],
  ['auto', '随'],
];

const read = (key, list, fallback) => {
  try {
    const saved = new URLSearchParams(location.search).get(key.replace('vunio-', '')) || localStorage.getItem(key);
    return list.some(([value]) => value === saved) ? saved : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式等情况下无法保存，忽略
  }
};

/** 当前主题（风格） */
export const theme = signal(read('vunio-theme', THEMES, 'guofeng'));

/** 用户选择的昼夜模式 */
export const mode = signal(read('vunio-mode', MODES, 'auto'));

const media = matchMedia('(prefers-color-scheme: dark)');
const prefersDark = signal(media.matches);
media.addEventListener('change', (event) => (prefersDark.value = event.matches));

/** 实际生效的模式 */
export const resolvedMode = computed(() => (mode.value === 'auto' ? (prefersDark.value ? 'night' : 'day') : mode.value));

export function setMode(value) {
  mode.value = value;
}

export function setTheme(value) {
  theme.value = value;
}

// 应用到页面并记住选择（全局 effect，随页面存在）
effect(() => {
  document.documentElement.dataset.mode = mode.value;
  save('vunio-mode', mode.value);
});

effect(() => {
  const name = theme.value;
  document.documentElement.dataset.vnTheme = name;
  // 换掉 <link id="vn-theme"> 与 <link id="vn-theme-fonts"> 的文件名
  for (const [id, file] of [['vn-theme', `${name}.css`], ['vn-theme-fonts', `${name}-fonts.css`]]) {
    const link = document.getElementById(id);
    if (link) link.setAttribute('href', link.getAttribute('href').replace(/[^/]+\.css$/, file));
  }
  save('vunio-theme', name);
});
