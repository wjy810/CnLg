// 文档站：每个页面都能打开且没有错误；窄屏目录；API 数据与源码一致
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { useBrowser } from './helpers/browser.js';
import { docs } from '../site/data/docs.js';

const run = promisify(execFile);
const open = useBrowser();

const ROUTES = [
  ['/', 'Vunio'],
  ['/start', '快速开始'],
  ['/reactivity', '响应式'],
  ['/templates', '模板'],
  ['/authoring', '组件开发'],
  ['/router', '路由'],
  ['/design', '设计系统'],
  ['/effects', '风花雪月'],
  ['/components', '组件'],
  ...Object.entries(docs).map(([slug, doc]) => [`/components/${slug}`, doc.name]),
  ['/nowhere', '此页不存在'],
];

test('site/data/api.js 与组件源码的 JSDoc 一致', async () => {
  const { stdout } = await run(process.execPath, ['scripts/build-docs.js', '--check']);
  assert.match(stdout, /文档数据检查通过/);
});

test('每个页面都能打开，标题正确，没有错误，没有横向溢出', async (t) => {
  const { page } = await open(t, { path: 'site/' });
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet] h1'));
  for (const [route, heading] of ROUTES) {
    await page.evaluate((r) => (location.hash = `#${r}`), route);
    await page.waitForFunction((h) => document.querySelector('[data-vn-outlet] h1')?.textContent.trim() === h, heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `${route} 横向溢出`);
  }
});

test('组件页的现场演示可以交互（弹窗、消息）', async (t) => {
  const { page } = await open(t, { path: 'site/#/components/modal', reducedMotion: 'reduce' });
  const demo = page.locator('site-demo').first();
  await demo.locator('#open').click();
  await page.waitForTimeout(50);
  assert.equal(await demo.evaluate((el) => el.refs.stage.querySelector('vn-modal').open), true);
  await page.evaluate(() => (location.hash = '#/components/toast'));
  await page.locator('site-demo [data-type="success"]').click();
  await page.waitForFunction(() => document.querySelector('vn-toaster')?.root.textContent.includes('已存入诗笺'));
});

test('窄屏：目录收进抽屉，点链接后自动收起', async (t) => {
  const { page } = await open(t, { path: 'site/#/start' });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet] h1'));
  const sidebar = page.locator('#sidebar');
  assert.equal(await sidebar.isVisible() && (await sidebar.boundingBox()).x >= 0, false, '默认收起');
  await page.locator('.menu').click();
  await page.waitForTimeout(400);
  assert.equal((await sidebar.boundingBox()).x, 0, '展开');
  assert.equal(await page.locator('.menu').getAttribute('aria-expanded'), 'true');
  await sidebar.locator('a', { hasText: '模板' }).click();
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet] h1')?.textContent.trim() === '模板');
  assert.equal(await page.locator('.menu').getAttribute('aria-expanded'), 'false', '换页后收起');
});

test('导航高亮当前页（aria-current）', async (t) => {
  const { page } = await open(t, { path: 'site/#/components/select' });
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet] h1'));
  const current = await page.evaluate(() => [...document.querySelectorAll('[aria-current="page"]')].map((a) => a.textContent.trim()));
  assert.deepEqual(current, ['组件', '下拉选择']);
});
