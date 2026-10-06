/**
 * 为 themes/ 下的每套主题（*.tokens.js）生成 CSS 与字体样式表，并刷新设计文档中的表格。
 *
 *   npm run build:theme                    生成
 *   node scripts/build-theme.js --check    只检查（测试与 CI 用）：
 *     生成结果是否最新、契约是否完整、对比度是否达标、代码是否只使用契约变量
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { MODES, SCALE_GROUPS, contractVariables, contrastRules, missingContract } from '../themes/base.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const THEMES_DIR = join(ROOT, 'themes');

/** 读取所有主题，按名字排序（古风在前） */
export async function loadThemes() {
  const files = (await readdir(THEMES_DIR)).filter((f) => f.endsWith('.tokens.js')).sort();
  const themes = [];
  for (const file of files) themes.push((await import(join(THEMES_DIR, file))).default);
  return themes.sort((a, b) => (a.name === 'guofeng' ? -1 : b.name === 'guofeng' ? 1 : a.name.localeCompare(b.name)));
}

export const paths = (theme) => ({
  css: join(THEMES_DIR, `${theme.name}.css`),
  fonts: join(THEMES_DIR, `${theme.name}-fonts.css`),
  doc: join(ROOT, 'docs', 'design', `${theme.name}.md`),
});

/** 模式按“默认模式在前”排列 */
const modeOrder = (theme) => [theme.defaultMode, ...Object.keys(MODES).filter((m) => m !== theme.defaultMode)];

// ───────────────────────── 颜色 ─────────────────────────

const isRef = (value) => typeof value === 'object' && value !== null && 'ref' in value;

function resolveHex(theme, value) {
  if (isRef(value)) {
    const entry = theme.palette[value.ref];
    if (!entry) throw new Error(`${theme.name}：未知的原色 ${value.ref}`);
    return entry.hex;
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  throw new Error(`${theme.name}：对比度检查只支持不透明的十六进制颜色，收到 ${value}`);
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

/** 一套主题每种模式、每条规则的对比度结果 */
export function checkContrast(theme) {
  const results = [];
  for (const mode of modeOrder(theme)) {
    const colors = theme.modes[mode].colors;
    for (const [fg, bg, min, usage] of contrastRules) {
      const fgHex = resolveHex(theme, colors[fg]);
      const bgHex = resolveHex(theme, colors[bg]);
      const ratio = contrast(fgHex, bgHex);
      results.push({ mode, label: MODES[mode].label, fg, bg, fgHex, bgHex, min, usage, ratio, pass: ratio >= min });
    }
  }
  return results;
}

// ───────────────────────── CSS ─────────────────────────

const colorValue = (value) => (isRef(value) ? `var(--vn-color-${value.ref})` : value);

function modeBlock(theme, mode, indent) {
  const pad = ' '.repeat(indent);
  const def = theme.modes[mode];
  const lines = [`${pad}color-scheme: ${MODES[mode].colorScheme};`];
  for (const [name, value] of Object.entries(def.colors)) lines.push(`${pad}--vn-${name}: ${colorValue(value)};`);
  for (const [level, value] of Object.entries(def.shadows)) lines.push(`${pad}--vn-shadow-${level}: ${value};`);
  lines.push(`${pad}--vn-texture: ${def.texture};`);
  return lines.join('\n');
}

export function buildCSS(theme) {
  const [main, other] = modeOrder(theme);
  const out = [];
  out.push(`/*
 * Vunio ${theme.label}主题。${theme.description}
 * 由 scripts/build-theme.js 根据 themes/${theme.name}.tokens.js 生成，请勿手改。
 *
 * 用法：
 *   <link rel="stylesheet" href="themes/${theme.name}.css" />
 *   <link rel="stylesheet" href="themes/${theme.name}-fonts.css" />   可选：网络字体
 *   <html data-mode="${other}">   ${MODES[other].label}（默认为${MODES[main].label}）
 *   <html data-mode="auto">    跟随系统
 *   任意元素加 data-mode 可以局部切换昼夜
 */
`);

  const root = ['  /* 原色（组件不要直接使用） */'];
  for (const [key, { name, hex }] of Object.entries(theme.palette)) root.push(`  --vn-color-${key}: ${hex}; /* ${name} */`);
  for (const [group, title] of SCALE_GROUPS) {
    root.push('', `  /* ${title} */`);
    for (const [key, value] of Object.entries(theme.scales[group])) root.push(`  --vn-${group}-${key}: ${value};`);
  }
  root.push('', '  /* 焦点 */', '  --vn-focus-ring: 2px solid var(--vn-focus);', '  --vn-focus-offset: 3px;');
  root.push('', '  /* 形状（用作 mask-image） */');
  for (const [name, value] of Object.entries(theme.masks)) root.push(`  --vn-mask-${name}: ${value};`);
  root.push('', '  /* 按钮默认的点击效果 */', `  --vn-effect: ${theme.effect};`);
  out.push(`:root {\n${root.join('\n')}\n}\n`);

  out.push(`/* ${MODES[main].label}（默认） */\n:root,\n[data-mode='${main}'] {\n${modeBlock(theme, main, 2)}\n}\n`);
  out.push(`/* ${MODES[other].label} */\n[data-mode='${other}'] {\n${modeBlock(theme, other, 2)}\n}\n`);
  out.push(
    `/* 跟随系统 */\n@media (prefers-color-scheme: ${MODES[other].colorScheme}) {\n  [data-mode='auto'] {\n${modeBlock(theme, other, 4)}\n  }\n}\n`,
  );

  const durations = Object.keys(theme.scales.duration)
    .map((key) => `    --vn-duration-${key}: 1ms;`)
    .join('\n');
  out.push(`/* 减少动态效果：所有时长归零，组件无需单独处理 CSS 过渡 */\n@media (prefers-reduced-motion: reduce) {\n  :root {\n${durations}\n  }\n}\n`);

  out.push(`/* 页面基础样式（:where 优先级为 0，可随意覆盖） */
:where(html) {
  background-color: var(--vn-bg);
  background-image: var(--vn-texture);
  color: var(--vn-fg);
  font-family: var(--vn-font-body);
  line-height: var(--vn-leading-normal);
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}
:where([data-mode]:not(html)) {
  background-color: var(--vn-bg);
  color: var(--vn-fg);
}
::selection {
  background-color: var(--vn-selection);
}
`);
  if (theme.css.trim()) out.push(`/* 主题对组件部件的调整（::part） */\n${theme.css.trim()}\n`);
  return out.join('\n');
}

export function buildFonts(theme) {
  if (!theme.fontImport) return null;
  return `/*
 * ${theme.label}主题的网络字体（可选）。
 * ${theme.fontNote ?? ''}
 * 正式项目建议自托管字体文件并按需子集化，再删掉这个文件。
 */
@import url('${theme.fontImport}');
`;
}

// ───────────────────────── 文档表格 ─────────────────────────

function paletteTable(theme) {
  const rows = Object.entries(theme.palette).map(
    ([key, { name, hex, note }]) => `| <span style="color:${hex}">■</span> ${name} | \`${hex}\` | \`--vn-color-${key}\` | ${note ?? ''} |`,
  );
  return ['| 色名 | 色值 | 变量 | 用途 |', '|---|---|---|---|', ...rows].join('\n');
}

function semanticTable(theme) {
  const modes = modeOrder(theme);
  const show = (value) => (isRef(value) ? `${theme.palette[value.ref].name} \`${theme.palette[value.ref].hex}\`` : `\`${value}\``);
  const rows = Object.keys(theme.modes[modes[0]].colors).map(
    (name) => `| \`--vn-${name}\` | ${modes.map((m) => show(theme.modes[m].colors[name])).join(' | ')} |`,
  );
  return [`| 变量 | ${modes.map((m) => MODES[m].label).join(' | ')} |`, '|---|---|---|', ...rows].join('\n');
}

function easeTable(theme) {
  const rows = Object.entries(theme.scales.ease).map(
    ([key, value]) => `| \`--vn-ease-${key}\` | \`${value}\` | ${theme.easeNotes[key] ?? ''} |`,
  );
  return ['| 变量 | 曲线 | 含义与用途 |', '|---|---|---|', ...rows].join('\n');
}

function contrastTable(theme) {
  const results = checkContrast(theme);
  return modeOrder(theme)
    .map((mode) => {
      const rows = results
        .filter((r) => r.mode === mode)
        .map((r) => `| ${r.usage} | \`${r.fg}\` / \`${r.bg}\` | ${r.ratio.toFixed(2)} | ≥ ${r.min} | ${r.pass ? '✅' : '❌'} |`);
      return `**${MODES[mode].label}**\n\n| 用途 | 前景 / 背景 | 对比度 | 要求 | 结果 |\n|---|---|---|---|---|\n${rows.join('\n')}`;
    })
    .join('\n\n');
}

const TABLES = { palette: paletteTable, semantic: semanticTable, ease: easeTable, contrast: contrastTable };

/** 用最新表格替换文档中 <!-- 名字:start --> … <!-- 名字:end --> 之间的内容 */
export function refreshDoc(theme, doc) {
  let out = doc;
  for (const [name, build] of Object.entries(TABLES)) {
    const pattern = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
    if (!pattern.test(out)) throw new Error(`docs/design/${theme.name}.md 缺少 <!-- ${name}:start --> 标记`);
    out = out.replace(pattern, () => `<!-- ${name}:start -->\n${build(theme)}\n<!-- ${name}:end -->`);
  }
  return out;
}

// ───────────────────────── 契约使用检查 ─────────────────────────

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(path)));
    else if (/\.(js|html|css)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/**
 * 代码只能使用契约变量，或者自己声明的私有变量（如组件内的 --vn-burst-ink）。
 * 原色 --vn-color-* 只允许出现在 src 以外（例如展示色板的页面）。
 * @returns {Promise<string[]>} 问题列表
 */
export async function checkUsage(dirs = ['src', 'site', 'examples']) {
  const contract = contractVariables();
  const files = (await Promise.all(dirs.map((d) => listFiles(join(ROOT, d))))).flat();
  const sources = await Promise.all(files.map(async (file) => [relative(ROOT, file), await readFile(file, 'utf8')]));
  const declared = new Set();
  for (const [, text] of sources) for (const m of text.matchAll(/(--vn-[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  const problems = [];
  for (const [file, text] of sources) {
    for (const m of text.matchAll(/--vn-[a-z0-9-]*[a-z0-9]/g)) {
      const name = m[0];
      if (contract.has(name) || declared.has(name)) continue;
      // 拼出来的名字（`--vn-space-${gap}`、'--vn-duration-' + key）或文档里的 --vn-space-*：契约中有这一组即可
      const rest = text.slice(m.index + name.length, m.index + name.length + 3);
      if (/^-(\$\{|['"`*])/.test(rest) && [...contract].some((c) => c.startsWith(`${name}-`))) continue;
      if (name.startsWith('--vn-color-') && !file.startsWith('src')) continue;
      problems.push(`${file}：${name} 不在主题契约中`);
    }
  }
  return [...new Set(problems)];
}

// ───────────────────────── 入口 ─────────────────────────

async function main() {
  const check = process.argv.includes('--check');
  const problems = [];
  const writes = [];

  for (const theme of await loadThemes()) {
    const missing = missingContract(theme);
    if (missing.length) {
      for (const item of missing) problems.push(`${theme.name} 缺少契约项：${item}`);
      continue;
    }
    const p = paths(theme);
    const outputs = [[p.css, buildCSS(theme)]];
    const fonts = buildFonts(theme);
    if (fonts) outputs.push([p.fonts, fonts]);
    const doc = await readFile(p.doc, 'utf8').catch(() => null);
    if (doc === null) problems.push(`缺少设计文档 ${relative(ROOT, p.doc)}`);
    else outputs.push([p.doc, refreshDoc(theme, doc)]);

    for (const f of checkContrast(theme).filter((r) => !r.pass)) {
      problems.push(`对比度不足：${theme.label}·${f.label} ${f.usage} ${f.ratio.toFixed(2)} < ${f.min}`);
    }
    for (const [path, content] of outputs) {
      if ((await readFile(path, 'utf8').catch(() => '')) === content) continue;
      if (check) problems.push(`${relative(ROOT, path)} 不是最新`);
      else writes.push([path, content]);
    }
  }
  problems.push(...(await checkUsage()));

  for (const [path, content] of writes) {
    await writeFile(path, content);
    console.log(`已生成 ${relative(ROOT, path)}`);
  }
  if (problems.length) {
    console.error(problems.join('\n') + (check ? '\n请运行 npm run build:theme' : ''));
    process.exit(1);
  }
  if (check) console.log('主题检查通过');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
