// 古风主题：生成结果、对比度、主题切换（docs/design/guofeng.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkContrast, contrast } from '../scripts/build-theme.js';
import { contrastRules, themes } from '../themes/guofeng.tokens.js';
import { useBrowser } from './helpers/browser.js';

const run = promisify(execFile);
const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

test('对比度计算正确（黑白为 21:1）', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('两套主题的所有对比度规则都达标（WCAG AA）', () => {
  const results = checkContrast();
  assert.equal(results.length, contrastRules.length * Object.keys(themes).length);
  const failures = results.filter((r) => !r.pass).map((r) => `${r.label} ${r.usage} ${r.ratio.toFixed(2)}`);
  assert.deepEqual(failures, []);
});

test('昼夜两套主题定义了同样的语义令牌', () => {
  assert.deepEqual(Object.keys(themes.night.colors), Object.keys(themes.day.colors));
});

test('themes/guofeng.css 与设计文档中的表格是最新的', async () => {
  const { stdout } = await run(process.execPath, ['scripts/build-theme.js', '--check']);
  assert.match(stdout, /主题检查通过/);
});

const tokens = (page, selector, names) =>
  page.evaluate(
    ([sel, list]) => {
      const style = getComputedStyle(document.querySelector(sel));
      return Object.fromEntries(list.map((n) => [n, style.getPropertyValue(n).trim()]));
    },
    [selector, names],
  );

test('浏览器：默认为昼，data-theme="night" 切换为夜，局部主题只影响子树', async (t) => {
  const { page } = await open(t, { path: PAGE });
  const day = await tokens(page, 'html', ['--vn-bg', '--vn-fg', 'color-scheme']);
  assert.deepEqual(day, { '--vn-bg': '#F4EEE2', '--vn-fg': '#2A2724', 'color-scheme': 'light' });
  const island = await page.evaluate(() => getComputedStyle(document.getElementById('island-text')).color);
  assert.equal(island, 'rgb(236, 230, 217)', '夜间小岛里的文字是月光色');
  await page.evaluate(() => (document.documentElement.dataset.theme = 'night'));
  const night = await tokens(page, 'html', ['--vn-bg', 'color-scheme']);
  assert.deepEqual(night, { '--vn-bg': '#14171D', 'color-scheme': 'dark' });
});

test('浏览器：data-theme="auto" 跟随系统', async (t) => {
  const { page } = await open(t, { path: PAGE, colorScheme: 'dark' });
  await page.evaluate(() => (document.documentElement.dataset.theme = 'auto'));
  assert.equal((await tokens(page, 'html', ['--vn-bg']))['--vn-bg'], '#14171D');
  await page.emulateMedia({ colorScheme: 'light' });
  assert.equal((await tokens(page, 'html', ['--vn-bg']))['--vn-bg'], '#F4EEE2');
});

test('浏览器：主题变量穿过 Shadow DOM，组件无需代码即可换主题', async (t) => {
  const { page } = await open(t, { path: PAGE });
  const color = () =>
    page.evaluate(() => {
      const el = document.querySelector('t-themed') ?? document.body.appendChild(document.createElement('t-themed'));
      return getComputedStyle(el.root.querySelector('p')).color;
    });
  assert.equal(await color(), 'rgb(176, 56, 43)', '昼：朱砂');
  await page.evaluate(() => (document.documentElement.dataset.theme = 'night'));
  await page.waitForTimeout(400);
  assert.equal(await color(), 'rgb(232, 122, 102)', '夜：丹');
});

test('浏览器：减少动态效果时所有时长变为 1ms', async (t) => {
  const { page } = await open(t, { path: PAGE, reducedMotion: 'reduce' });
  const durations = await tokens(page, 'html', ['--vn-duration-fast', '--vn-duration-ink']);
  assert.deepEqual(durations, { '--vn-duration-fast': '1ms', '--vn-duration-ink': '1ms' });
});
