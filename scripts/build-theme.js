/**
 * 根据 themes/guofeng.tokens.js 生成主题 CSS，并刷新设计文档中的表格。
 *
 *   npm run build:theme            生成
 *   node scripts/build-theme.js --check   只检查：生成结果是否最新、对比度是否达标（测试用）
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { easeNotes, contrastRules, palette, scales, themes } from '../themes/guofeng.tokens.js';

const ROOT = new URL('..', import.meta.url);
export const CSS_PATH = fileURLToPath(new URL('themes/guofeng.css', ROOT));
export const DOC_PATH = fileURLToPath(new URL('docs/design/guofeng.md', ROOT));

// ───────────────────────── 颜色 ─────────────────────────

const isRef = (value) => typeof value === 'object' && value !== null && 'ref' in value;

function resolveHex(value) {
  if (isRef(value)) {
    const entry = palette[value.ref];
    if (!entry) throw new Error(`未知的原色：${value.ref}`);
    return entry.hex;
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  throw new Error(`对比度检查只支持不透明的十六进制颜色，收到：${value}`);
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** 每个主题、每条规则的对比度结果 */
export function checkContrast() {
  const results = [];
  for (const [themeKey, theme] of Object.entries(themes)) {
    for (const [fg, bg, min, usage] of contrastRules) {
      const fgHex = resolveHex(theme.colors[fg]);
      const bgHex = resolveHex(theme.colors[bg]);
      const ratio = contrast(fgHex, bgHex);
      results.push({ theme: themeKey, label: theme.label, fg, bg, fgHex, bgHex, min, usage, ratio, pass: ratio >= min });
    }
  }
  return results;
}

// ───────────────────────── 纹理 ─────────────────────────

const svgUrl = (svg) =>
  `url("data:image/svg+xml,${svg
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/\s+/g, ' ')}")`;

/** 纸纹：低透明度的分形噪声 */
const paperTexture = ({ tint, alpha }) => {
  const [r, g, b] = tint.split(' ');
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${(alpha * 2).toFixed(3)} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );
};

/** 印泥斑驳：用作 mask，大部分不透明，少量缺口 */
const sealMask = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -6 4.7'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
);

/** 笔触：中间粗、两端尖，横向拉伸使用 */
const brushMask = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'><path d='M0 4.6C18 3.1 58 2.4 100 2.9S172 3.3 200 4.3C176 5.7 122 6.1 88 5.8S24 5.5 0 4.6Z'/></svg>`,
);

// ───────────────────────── CSS ─────────────────────────

const colorValue = (value) => (isRef(value) ? `var(--vn-color-${value.ref})` : value);

function themeBlock(theme, indent) {
  const pad = ' '.repeat(indent);
  const lines = [`${pad}color-scheme: ${theme.colorScheme};`];
  for (const [name, value] of Object.entries(theme.colors)) lines.push(`${pad}--vn-${name}: ${colorValue(value)};`);
  for (const [level, value] of Object.entries(theme.shadows)) lines.push(`${pad}--vn-shadow-${level}: ${value};`);
  lines.push(`${pad}--vn-texture-paper: ${paperTexture(theme.texture)};`);
  return lines.join('\n');
}

export function buildCSS() {
  const out = [];
  out.push(`/*
 * Vunio 古风主题：昼 / 夜
 * 由 scripts/build-theme.js 根据 themes/guofeng.tokens.js 生成，请勿手改。
 *
 * 用法：
 *   <link rel="stylesheet" href="themes/guofeng.css" />
 *   <link rel="stylesheet" href="themes/guofeng-fonts.css" />   可选：网络字体
 *   <html data-theme="night">   夜
 *   <html data-theme="auto">    跟随系统
 *   任意元素加 data-theme 可以局部切换主题
 */
`);

  const root = [];
  root.push('  /* 原色（组件不要直接使用） */');
  for (const [key, { name, hex }] of Object.entries(palette)) root.push(`  --vn-color-${key}: ${hex}; /* ${name} */`);
  const groups = [
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
  for (const [group, title] of groups) {
    root.push('', `  /* ${title} */`);
    for (const [key, value] of Object.entries(scales[group])) root.push(`  --vn-${group}-${key}: ${value};`);
  }
  root.push('', '  /* 焦点 */', '  --vn-focus-ring: 2px solid var(--vn-focus);', '  --vn-focus-offset: 3px;');
  root.push('', '  /* 纹理（用作 mask-image） */', `  --vn-mask-seal: ${sealMask};`, `  --vn-mask-brush: ${brushMask};`);
  out.push(`:root {\n${root.join('\n')}\n}\n`);

  out.push(`/* 昼（默认） */\n:root,\n[data-theme='day'] {\n${themeBlock(themes.day, 2)}\n}\n`);
  out.push(`/* 夜 */\n[data-theme='night'] {\n${themeBlock(themes.night, 2)}\n}\n`);
  out.push(`/* 跟随系统 */\n@media (prefers-color-scheme: dark) {\n  [data-theme='auto'] {\n${themeBlock(themes.night, 4)}\n  }\n}\n`);

  const durations = Object.keys(scales.duration)
    .map((key) => `    --vn-duration-${key}: 1ms;`)
    .join('\n');
  out.push(`/* 减少动态效果：所有时长归零，组件无需单独处理 CSS 过渡 */\n@media (prefers-reduced-motion: reduce) {\n  :root {\n${durations}\n  }\n}\n`);

  out.push(`/* 页面基础样式（:where 优先级为 0，可随意覆盖） */
:where(html) {
  background-color: var(--vn-bg);
  background-image: var(--vn-texture-paper);
  color: var(--vn-fg);
  font-family: var(--vn-font-serif);
  line-height: var(--vn-leading-normal);
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}
:where([data-theme]:not(html)) {
  background-color: var(--vn-bg);
  color: var(--vn-fg);
}
::selection {
  background-color: var(--vn-selection);
}
`);
  return out.join('\n');
}

// ───────────────────────── 文档表格 ─────────────────────────

function paletteTable() {
  const rows = Object.entries(palette).map(
    ([key, { name, hex, note }]) => `| <span style="color:${hex}">■</span> ${name} | \`${hex}\` | \`--vn-color-${key}\` | ${note} |`,
  );
  return ['| 色名 | 色值 | 变量 | 用途 |', '|---|---|---|---|', ...rows].join('\n');
}

function semanticTable() {
  const show = (value) => (isRef(value) ? `${palette[value.ref].name} \`${palette[value.ref].hex}\`` : `\`${value}\``);
  const rows = Object.keys(themes.day.colors).map(
    (name) => `| \`--vn-${name}\` | ${show(themes.day.colors[name])} | ${show(themes.night.colors[name])} |`,
  );
  return ['| 变量 | 昼 | 夜 |', '|---|---|---|', ...rows].join('\n');
}

function easeTable() {
  const rows = Object.entries(scales.ease).map(([key, value]) => `| \`--vn-ease-${key}\` | \`${value}\` | ${easeNotes[key]} |`);
  return ['| 变量 | 曲线 | 含义与用途 |', '|---|---|---|', ...rows].join('\n');
}

function contrastTable() {
  const results = checkContrast();
  const sections = [];
  for (const [themeKey, theme] of Object.entries(themes)) {
    const rows = results
      .filter((r) => r.theme === themeKey)
      .map((r) => `| ${r.usage} | \`${r.fg}\` / \`${r.bg}\` | ${r.ratio.toFixed(2)} | ≥ ${r.min} | ${r.pass ? '✅' : '❌'} |`);
    sections.push(`**${theme.label}**\n\n| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |\n|---|---|---|---|---|\n${rows.join('\n')}`);
  }
  return sections.join('\n\n');
}

const TABLES = { palette: paletteTable, semantic: semanticTable, ease: easeTable, contrast: contrastTable };

/** 用最新表格替换文档中 <!-- 名字:start --> … <!-- 名字:end --> 之间的内容 */
export function refreshDoc(doc) {
  let out = doc;
  for (const [name, build] of Object.entries(TABLES)) {
    const pattern = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
    if (!pattern.test(out)) throw new Error(`设计文档缺少 <!-- ${name}:start --> 标记`);
    out = out.replace(pattern, `$1\n${build()}\n$2`);
  }
  return out;
}

// ───────────────────────── 入口 ─────────────────────────

async function main() {
  const check = process.argv.includes('--check');
  const css = buildCSS();
  const doc = refreshDoc(await readFile(DOC_PATH, 'utf8'));
  const failures = checkContrast().filter((r) => !r.pass);

  if (check) {
    const problems = [];
    if ((await readFile(CSS_PATH, 'utf8').catch(() => '')) !== css) problems.push('themes/guofeng.css 不是最新');
    if ((await readFile(DOC_PATH, 'utf8')) !== doc) problems.push('docs/design/guofeng.md 中的表格不是最新');
    for (const f of failures) problems.push(`对比度不足：${f.label} ${f.usage} ${f.ratio.toFixed(2)} < ${f.min}`);
    if (problems.length) {
      console.error(`${problems.join('\n')}\n请运行 npm run build:theme`);
      process.exit(1);
    }
    console.log('主题检查通过');
    return;
  }

  await writeFile(CSS_PATH, css);
  await writeFile(DOC_PATH, doc);
  console.log(`已生成 ${CSS_PATH}`);
  for (const f of failures) console.warn(`⚠ 对比度不足：${f.label} ${f.usage} ${f.ratio.toFixed(2)} < ${f.min}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
