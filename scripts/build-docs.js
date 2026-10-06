/**
 * 从组件源码头部的 JSDoc 生成文档站使用的 API 数据（site/data/api.js）。
 *
 *   npm run build:docs              生成
 *   node scripts/build-docs.js --check   只检查是否最新（测试用）
 *
 * 识别的标签：@attr {类型} 名字 - 说明 · @slot 名字 - 说明 · @fires 事件 - 说明
 *            @csspart 名字 - 说明 · @cssprop 名字 - 说明
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url);
const COMPONENTS = new URL('src/components/', ROOT);
export const API_PATH = fileURLToPath(new URL('site/data/api.js', ROOT));

/** 解析一段 JSDoc 注释 */
export function parseDoc(comment) {
  const lines = comment
    .replace(/^\/\*\*|\*\/$/g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\* ?/, '').trimEnd());
  const tagLine = lines.findIndex((line) => /^<[a-z][\w-]*>/.test(line.trim()));
  if (tagLine < 0) return null;
  const tagMatch = lines[tagLine].trim().match(/^<([a-z][\w-]*)>\s*(.*)/);
  const summary = [tagMatch[2]];
  const doc = { tag: tagMatch[1], summary: '', attrs: [], slots: [], events: [], parts: [], cssprops: [] };
  let inBody = true;
  for (const line of lines.slice(tagLine + 1)) {
    const tag = line.match(/^@(\w+)\s+(.*)$/);
    if (!tag) {
      if (inBody && line.trim()) summary.push(line.trim());
      continue;
    }
    inBody = false;
    const [, kind, rest] = tag;
    if (kind === 'attr') {
      const m = rest.match(/^\{(.+?)\}\s+(\S+)\s*(?:-\s*(.*))?$/);
      if (m) doc.attrs.push({ name: m[2], type: m[1], description: m[3] ?? '' });
    } else if (kind === 'slot') {
      const m = rest.match(/^(?:(\S+)\s+)?-\s*(.*)$/) ?? [null, rest, ''];
      doc.slots.push({ name: m[1] ?? '', description: m[2] ?? '' });
    } else if (['fires', 'csspart', 'cssprop'].includes(kind)) {
      const m = rest.match(/^(\S+)\s*(?:-\s*(.*))?$/);
      const key = { fires: 'events', csspart: 'parts', cssprop: 'cssprops' }[kind];
      if (m) doc[key].push({ name: m[1], description: m[2] ?? '' });
    }
  }
  doc.summary = summary.join('');
  return doc;
}

/** 读取所有组件文件，返回 { 标签名: 文档 } */
export async function collect() {
  const files = (await readdir(COMPONENTS)).filter((f) => f.endsWith('.js')).sort();
  const api = {};
  for (const file of files) {
    const source = await readFile(new URL(file, COMPONENTS), 'utf8');
    for (const match of source.matchAll(/\/\*\*[\s\S]*?\*\/\s*export class \w+/g)) {
      const comment = match[0].slice(0, match[0].lastIndexOf('*/') + 2);
      const doc = parseDoc(comment.slice(comment.lastIndexOf('/**')));
      if (doc) api[doc.tag] = { file: `src/components/${file}`, ...doc };
    }
  }
  return api;
}

export async function build() {
  const api = await collect();
  return `// 由 scripts/build-docs.js 根据组件源码的 JSDoc 生成，请勿手改。\nexport const api = ${JSON.stringify(api, null, 2)};\n`;
}

async function main() {
  const output = await build();
  if (process.argv.includes('--check')) {
    const current = await readFile(API_PATH, 'utf8').catch(() => '');
    if (current !== output) {
      console.error('site/data/api.js 不是最新，请运行 npm run build:docs');
      process.exit(1);
    }
    console.log('文档数据检查通过');
    return;
  }
  await writeFile(API_PATH, output);
  console.log(`已生成 ${API_PATH}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
