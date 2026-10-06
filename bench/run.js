// 运行性能基准：npm run bench（Chromium，每项取中位数）
import { chromium } from 'playwright';
import { serve } from '../scripts/serve.js';

const RUNS = Number(process.env.RUNS ?? 7);
const CASES = [
  ['create1k', '创建 1,000 行', ['clear']],
  ['replace1k', '替换全部 1,000 行', ['create1k']],
  ['update10th', '每 10 行更新一行', ['create1k']],
  ['select', '选中一行（高亮）', ['create1k']],
  ['swap', '交换两行', ['create1k']],
  ['remove', '删除一行', ['create1k']],
  ['create10k', '创建 10,000 行', ['clear']],
  ['append1k', '向 1,000 行追加 1,000 行', ['create1k']],
  ['clear', '清空 1,000 行', ['create1k']],
  ['signalChain', '1000 层 computed 链 × 100 次更新', []],
  ['signalFanout', '1 个 signal → 1000 个 effect × 100 次', []],
];

const { server, url } = await serve(0);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${url}/bench/`);
await page.waitForFunction(() => window.ready === true);
const version = browser.version();

const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
const rows = [];
for (const [name, label, setup] of CASES) {
  const times = [];
  for (let i = 0; i < RUNS + 1; i++) {
    for (const step of setup) await page.evaluate((s) => window.bench[s](), step);
    const time = await page.evaluate((n) => window.bench[n](), name);
    if (i > 0) times.push(time); // 第一次是预热
  }
  rows.push([label, median(times).toFixed(1)]);
}
await browser.close();
server.close();

console.log(`\nVunio 性能基准（Chromium ${version}，${RUNS} 次取中位数，单位 ms）\n`);
console.log('| 操作 | 耗时 (ms) |\n|---|---:|');
for (const [label, ms] of rows) console.log(`| ${label} | ${ms} |`);
