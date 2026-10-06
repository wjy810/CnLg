// 无障碍自动审计（axe-core）：文档站与组件页，昼夜两套主题，以及下拉 / 弹窗打开时
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const axeSource = await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

async function audit(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ['violations'] });
    return result.violations.map((v) => `${v.id}（${v.impact}）：${v.nodes.map((n) => n.target.join(' >>> ')).slice(0, 3).join('，')}`);
  });
}

async function visit(t, path, theme) {
  const { page } = await open(t, { path });
  await page.evaluate((theme) => localStorage.setItem('vunio-theme', theme), theme);
  await page.reload();
  await page.waitForTimeout(800);
  return page;
}

const PAGES = ['site/#/', 'site/#/start', 'site/#/components/input', 'site/#/design', 'examples/components.html', 'examples/'];

for (const theme of ['day', 'night']) {
  for (const path of PAGES) {
    test(`${path}（${theme === 'day' ? '昼' : '夜'}）没有无障碍问题`, async (t) => {
      const page = await visit(t, path, theme);
      assert.deepEqual(await audit(page), []);
    });
  }
}

test('下拉面板展开、弹窗打开时没有无障碍问题', async (t) => {
  const page = await visit(t, 'examples/components.html', 'day');
  await page.locator('vn-select [role=combobox]').click();
  assert.deepEqual(await audit(page), [], '下拉展开');
  await page.keyboard.press('Escape');
  await page.locator('#open-modal').click();
  await page.waitForTimeout(900);
  assert.deepEqual(await audit(page), [], '弹窗打开');
});
