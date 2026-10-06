// 主题：契约、对比度、生成结果、昼夜切换（docs/rfc/0006-theme-contract.md、docs/design/guofeng.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkContrast, contrast, loadThemes } from '../scripts/build-theme.js';
import { MODES, contrastRules, defineTheme, missingContract } from '../themes/base.js';
import { useBrowser } from './helpers/browser.js';

const run = promisify(execFile);
const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';
const themes = await loadThemes();

test('对比度计算正确（黑白为 21:1）', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('契约检查能指出缺少的项', () => {
  const missing = missingContract(defineTheme({ name: 'x', defaultMode: 'day', modes: { day: { colors: { bg: '#fff', extra: '#000' } } } }));
  for (const item of ['day.colors.fg', 'day.shadows.1', 'day.texture', 'day.colors.extra 不在契约中', '模式 night', 'scales.font.display', 'masks.stroke', 'effect']) {
    assert.ok(missing.includes(item), `应报告 ${item}`);
  }
});

for (const theme of themes) {
  test(`${theme.label}：完整提供主题契约`, () => {
    assert.deepEqual(missingContract(theme), []);
  });

  test(`${theme.label}：昼夜两种模式的所有对比度规则都达标（WCAG AA）`, () => {
    const results = checkContrast(theme);
    assert.equal(results.length, contrastRules.length * Object.keys(MODES).length);
    const failures = results.filter((r) => !r.pass).map((r) => `${r.label} ${r.usage} ${r.ratio.toFixed(2)}`);
    assert.deepEqual(failures, []);
  });
}

test('主题 CSS、设计文档表格是最新的，代码只使用契约变量', async () => {
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

test('浏览器：古风默认为昼，data-mode="night" 切换为夜，局部切换只影响子树', async (t) => {
  const { page } = await open(t, { theme: 'guofeng', path: PAGE });
  const day = await tokens(page, 'html', ['--vn-bg', '--vn-fg', 'color-scheme']);
  assert.deepEqual(day, { '--vn-bg': '#F4EEE2', '--vn-fg': '#2A2724', 'color-scheme': 'light' });
  const island = await page.evaluate(() => getComputedStyle(document.getElementById('island-text')).color);
  assert.equal(island, 'rgb(236, 230, 217)', '夜间小岛里的文字是月光色');
  await page.evaluate(() => (document.documentElement.dataset.mode = 'night'));
  const night = await tokens(page, 'html', ['--vn-bg', 'color-scheme']);
  assert.deepEqual(night, { '--vn-bg': '#14171D', 'color-scheme': 'dark' });
});

test('浏览器：data-mode="auto" 跟随系统', async (t) => {
  const { page } = await open(t, { theme: 'guofeng', path: PAGE, colorScheme: 'dark' });
  await page.evaluate(() => (document.documentElement.dataset.mode = 'auto'));
  assert.equal((await tokens(page, 'html', ['--vn-bg']))['--vn-bg'], '#14171D');
  await page.emulateMedia({ colorScheme: 'light' });
  assert.equal((await tokens(page, 'html', ['--vn-bg']))['--vn-bg'], '#F4EEE2');
});

test('浏览器：主题变量穿过 Shadow DOM，组件无需代码即可换主题', async (t) => {
  const { page } = await open(t, { theme: 'guofeng', path: PAGE });
  const color = () =>
    page.evaluate(() => {
      const el = document.querySelector('t-themed') ?? document.body.appendChild(document.createElement('t-themed'));
      return getComputedStyle(el.root.querySelector('p')).color;
    });
  assert.equal(await color(), 'rgb(176, 56, 43)', '昼：朱砂');
  await page.evaluate(() => (document.documentElement.dataset.mode = 'night'));
  await page.waitForTimeout(400);
  assert.equal(await color(), 'rgb(232, 122, 102)', '夜：丹');
});

test('浏览器：减少动态效果时所有时长变为 1ms', async (t) => {
  const { page } = await open(t, { theme: 'guofeng', path: PAGE, reducedMotion: 'reduce' });
  const durations = await tokens(page, 'html', ['--vn-duration-fast', '--vn-duration-slower']);
  assert.deepEqual(durations, { '--vn-duration-fast': '1ms', '--vn-duration-slower': '1ms' });
});

test('浏览器：赛博主题默认为夜，data-mode="day" 切换为昼，组件随之变化', async (t) => {
  const { page } = await open(t, { theme: 'cyber', path: PAGE });
  await page.evaluate(() => document.documentElement.removeAttribute('data-mode'));
  const night = await tokens(page, 'html', ['--vn-bg', '--vn-effect', '--vn-radius-sm', 'color-scheme']);
  assert.deepEqual(night, { '--vn-bg': '#0A0B12', '--vn-effect': 'glitch', '--vn-radius-sm': '0', 'color-scheme': 'dark' });
  const color = () =>
    page.evaluate(() => {
      const el = document.querySelector('t-themed') ?? document.body.appendChild(document.createElement('t-themed'));
      return getComputedStyle(el.root.querySelector('p')).color;
    });
  assert.equal(await color(), 'rgb(255, 92, 168)', '夜：荧粉');
  await page.evaluate(() => (document.documentElement.dataset.mode = 'day'));
  await page.waitForTimeout(300);
  assert.equal((await tokens(page, 'html', ['--vn-bg']))['--vn-bg'], '#EEF1F7');
  assert.equal(await color(), 'rgb(192, 0, 96)', '昼：深品红');
});
