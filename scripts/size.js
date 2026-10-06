// 体积报告：每个入口打包 + 压缩后的大小（gzip / brotli）。
//   node scripts/size.js           打印表格
//   node scripts/size.js --check   超出预算时退出码为 1（CI 用）
import { build } from 'esbuild';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, sep } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

// 预算按 gzip 计，单位 KB。超出说明有东西意外变大了，确认后再调整预算。
// own: true 时不计入 core，只看这个模块自己增加了多少。
export const ENTRIES = [
  { name: 'vunio/core（Signals · 模板 · 组件基类）', entry: 'src/core/index.js', budget: 11 },
  { name: 'vunio/router（不含 core）', entry: 'src/router/index.js', own: true, budget: 3 },
  { name: 'vunio/effects（不含 core）', entry: 'src/effects/index.js', own: true, budget: 4.5 },
  { name: 'vunio（以上全部）', entry: 'src/index.js', budget: 17.5 },
  { name: 'vunio/components（13 个组件，含 core）', entry: 'src/components/index.js', budget: 27 },
];

const coreDir = resolve(root, 'src/core') + sep;

/** 把 src/core 之外对 core 的引用标为外部依赖 */
const excludeCore = {
  name: 'exclude-core',
  setup(b) {
    b.onResolve({ filter: /^\./ }, (args) => {
      const target = resolve(args.resolveDir, args.path);
      const from = args.importer ? dirname(args.importer) + sep : '';
      if (target.startsWith(coreDir) && !from.startsWith(coreDir)) return { path: args.path, external: true };
    });
  },
};

const kb = (bytes) => (bytes / 1024).toFixed(1);

export async function measure({ entry, own }) {
  const result = await build({
    entryPoints: [entry],
    absWorkingDir: root,
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    write: false,
    legalComments: 'none',
    plugins: own ? [excludeCore] : [],
  });
  const code = result.outputFiles[0].contents;
  return {
    min: code.length,
    gzip: gzipSync(code, { level: 9 }).length,
    brotli: brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const over = [];
  console.log('| 入口 | 压缩后 | gzip | brotli | 预算 (gzip) |\n|---|---:|---:|---:|---:|');
  for (const item of ENTRIES) {
    const size = await measure(item);
    const flag = size.gzip / 1024 > item.budget ? ' ⚠' : '';
    if (flag) over.push(item.name);
    console.log(`| ${item.name} | ${kb(size.min)} KB | ${kb(size.gzip)} KB | ${kb(size.brotli)} KB | ${item.budget} KB${flag} |`);
  }
  if (check && over.length) {
    console.error(`\n超出体积预算：${over.join('、')}`);
    process.exit(1);
  }
}
