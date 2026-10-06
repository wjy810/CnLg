/**
 * 主题契约与共享尺度（docs/rfc/0006-theme-contract.md）。
 *
 * 每套主题是 themes/<名字>.tokens.js，默认导出 defineTheme({...})。
 * `npm run build:theme` 为每套主题生成 themes/<名字>.css 和 <名字>-fonts.css，
 * 并检查它是否完整提供了契约、两种模式是否都满足对比度规则。
 */

/** 两种模式 */
export const MODES = {
  day: { label: '昼', colorScheme: 'light' },
  night: { label: '夜', colorScheme: 'dark' },
};

/** 每种模式都必须提供的颜色（名字描述用途，不描述风格） */
export const CONTRACT_COLORS = [
  // 面
  'bg',
  'surface',
  'surface-sunken',
  // 字
  'fg',
  'fg-strong',
  'fg-muted',
  'fg-subtle',
  // 线
  'line',
  'line-strong',
  // 主操作与强调
  'primary',
  'on-primary',
  'accent',
  'on-accent',
  'accent-fg',
  'accent-wash',
  // 状态
  'success',
  'warning',
  'danger',
  'info',
  // 交互
  'focus',
  'selection',
  'overlay',
  // 器物：立轴的轴杆与轴头、框体与饰件
  'frame',
  'trim',
  // 意象：效果与天气里画出来的东西
  'blossom',
  'blossom-deep',
  'snow',
  'wind',
  'moon',
  'night-sky',
];

/** 每套主题必须提供的尺度（与模式无关） */
export const CONTRACT_SCALES = {
  font: ['display', 'body', 'quote', 'mono'],
  radius: ['none', 'sm', 'md', 'lg', 'full'],
  ease: ['standard', 'enter', 'move', 'spring'],
  duration: ['instant', 'fast', 'normal', 'slow', 'slower'],
};

/** 形状：用作 mask-image */
export const CONTRACT_MASKS = ['stroke', 'stamp'];

/** 共享尺度：排版节奏、间距、层级。主题可以覆盖个别值，通常不需要 */
export const baseScales = {
  'font-size': {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '36px',
    '4xl': '48px',
    '5xl': '64px',
  },
  leading: { tight: '1.3', normal: '1.75', loose: '2' },
  tracking: { normal: '0', wide: '0.08em', wider: '0.2em', widest: '0.35em' },
  weight: { regular: '400', medium: '600', bold: '700' },
  space: { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px', 9: '96px' },
  border: { thin: '1px', thick: '2px' },
  z: { dropdown: '1000', sticky: '1050', overlay: '1100', modal: '1110', toast: '1200' },
  measure: { narrow: '22em', normal: '34em', wide: '48em' },
};

/** CSS 中尺度的输出顺序与标题 */
export const SCALE_GROUPS = [
  ['font', '字体'],
  ['font-size', '字号'],
  ['leading', '行高'],
  ['tracking', '字距'],
  ['weight', '字重'],
  ['space', '间距'],
  ['radius', '圆角'],
  ['border', '线宽'],
  ['ease', '缓动'],
  ['duration', '时长'],
  ['z', '层级'],
  ['measure', '行宽'],
];

/**
 * 对比度要求（WCAG 2.1 AA）：每套主题的每种模式都要满足。
 * 4.5：正文与可读文字；3：大字、图形与控件边界、焦点框。
 */
export const contrastRules = [
  ['fg', 'bg', 4.5, '正文'],
  ['fg', 'surface', 4.5, '卡片上的正文'],
  ['fg', 'surface-sunken', 4.5, '输入框中的文字'],
  ['fg-muted', 'bg', 4.5, '次要文字'],
  ['fg-muted', 'surface', 4.5, '卡片上的次要文字'],
  ['fg-muted', 'surface-sunken', 4.5, '占位文字'],
  ['fg-subtle', 'bg', 3, '弱化图形、禁用态'],
  ['line-strong', 'bg', 3, '控件边框'],
  ['line-strong', 'surface', 3, '卡片上的控件边框'],
  ['on-primary', 'primary', 4.5, '主按钮文字'],
  ['on-accent', 'accent', 4.5, '强调按钮文字'],
  ['accent-fg', 'bg', 4.5, '强调文字、链接'],
  ['accent-fg', 'surface', 4.5, '卡片上的强调文字'],
  ['success', 'bg', 4.5, '成功提示'],
  ['warning', 'bg', 4.5, '提醒'],
  ['danger', 'bg', 4.5, '错误提示'],
  ['danger', 'surface', 4.5, '卡片上的错误提示'],
  ['info', 'bg', 4.5, '信息'],
  ['success', 'surface-sunken', 4.5, '凹陷面上的成功色（如代码高亮）'],
  ['warning', 'surface-sunken', 4.5, '凹陷面上的提醒色'],
  ['danger', 'surface-sunken', 4.5, '凹陷面上的错误提示'],
  ['info', 'surface-sunken', 4.5, '凹陷面上的信息色'],
  ['accent-fg', 'surface-sunken', 4.5, '凹陷面上的强调文字'],
  ['focus', 'bg', 3, '焦点框'],
];

/** 引用原色：{ ref: 'zhusha' } 生成 var(--vn-color-zhusha)，对比度检查时解析为色值 */
export const ref = (key) => ({ ref: key });

/** 把 SVG 源码写成可放进 CSS 的 data URL */
export const svgUrl = (svg) =>
  `url("data:image/svg+xml,${svg
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/\s+/g, ' ')}")`;

/**
 * 声明一套主题。
 *
 * @param {object} def
 * @param {string} def.name           文件名与标识，如 'guofeng'
 * @param {string} def.label          显示名，如 '古风'
 * @param {string} def.description    一句话介绍
 * @param {'day'|'night'} def.defaultMode  没有 data-mode 时使用的模式
 * @param {string} [def.fontImport]   网络字体的样式表地址（生成 <名字>-fonts.css）
 * @param {string} [def.fontNote]     写进字体文件头部的说明
 * @param {Record<string, {name: string, hex: string, note?: string}>} def.palette  有名字的原色
 * @param {Record<'day'|'night', {colors: object, shadows: object, texture: string, vars?: Record<string, string>}>} def.modes
 *   vars：主题私有、随模式变化的变量（名字不用 --vn- 开头），给 css 里的 ::part() 调整使用
 * @param {object} def.scales         font / radius / ease / duration，以及可选的共享尺度覆盖
 * @param {Record<string, string>} def.masks   stroke / stamp
 * @param {string} def.effect         按钮默认的点击效果
 * @param {Record<string, string>} [def.easeNotes]  缓动的含义（写进设计文档）
 * @param {string} [def.css]          额外的 CSS，例如 ::part() 调整
 */
export function defineTheme(def) {
  const scales = { ...baseScales };
  for (const [group, values] of Object.entries(def.scales ?? {})) scales[group] = { ...scales[group], ...values };
  return { easeNotes: {}, css: '', ...def, scales };
}

/** 列出主题缺少的契约项；为空表示完整 */
export function missingContract(theme) {
  const missing = [];
  if (!MODES[theme.defaultMode]) missing.push(`defaultMode 必须是 day 或 night，收到 ${theme.defaultMode}`);
  for (const mode of Object.keys(MODES)) {
    const def = theme.modes?.[mode];
    if (!def) {
      missing.push(`模式 ${mode}`);
      continue;
    }
    for (const name of CONTRACT_COLORS) if (!(name in (def.colors ?? {}))) missing.push(`${mode}.colors.${name}`);
    for (const level of [1, 2, 3]) if (!def.shadows?.[level]) missing.push(`${mode}.shadows.${level}`);
    if (!def.texture) missing.push(`${mode}.texture`);
    for (const name of Object.keys(def.colors ?? {})) if (!CONTRACT_COLORS.includes(name)) missing.push(`${mode}.colors.${name} 不在契约中`);
    for (const name of Object.keys(def.vars ?? {})) if (!/^--(?!vn-)[a-z0-9-]+$/.test(name)) missing.push(`${mode}.vars.${name} 应以 -- 开头且不用 --vn- 前缀`);
  }
  for (const [group, keys] of Object.entries(CONTRACT_SCALES)) {
    for (const key of keys) if (!theme.scales?.[group]?.[key]) missing.push(`scales.${group}.${key}`);
  }
  for (const name of CONTRACT_MASKS) if (!theme.masks?.[name]) missing.push(`masks.${name}`);
  if (!theme.effect) missing.push('effect');
  return missing;
}

/** 契约中所有变量名（不含 --vn- 前缀以外的私有变量），用于检查组件只使用契约 */
export function contractVariables() {
  const names = new Set(['focus', 'focus-ring', 'focus-offset', 'texture', 'effect']);
  for (const name of CONTRACT_COLORS) names.add(name);
  for (const level of [1, 2, 3]) names.add(`shadow-${level}`);
  for (const [group, keys] of Object.entries(CONTRACT_SCALES)) for (const key of keys) names.add(`${group}-${key}`);
  for (const [group, values] of Object.entries(baseScales)) for (const key of Object.keys(values)) names.add(`${group}-${key}`);
  for (const name of CONTRACT_MASKS) names.add(`mask-${name}`);
  return new Set([...names].map((name) => `--vn-${name}`));
}
