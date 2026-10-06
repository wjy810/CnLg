// 浏览器测试的公共部分：启动静态服务器和浏览器，打开测试页并收集错误
// 默认用 Chromium；BROWSER=firefox 或 BROWSER=webkit 换浏览器（CI 三种都跑）
import { after, before } from 'node:test';
import assert from 'node:assert/strict';
import * as playwright from 'playwright';
import { serve } from '../../scripts/serve.js';

export const BROWSER = process.env.BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(BROWSER)) throw new Error(`未知的 BROWSER：${BROWSER}`);

/**
 * 注册 before / after 钩子，返回 open(t, options) 用于在每个测试中打开新页面。
 * 测试结束时断言页面没有未处理的错误（options.allowErrors 为 true 时跳过）。
 */
export function useBrowser() {
  let server;
  let baseURL;
  let browser;

  before(async () => {
    ({ server, url: baseURL } = await serve(0));
    browser = await playwright[BROWSER].launch();
  });

  after(async () => {
    await browser?.close();
    server?.close();
  });

  return async function open(t, { reducedMotion, colorScheme, allowErrors = false, path = 'tests/fixtures/index.html' } = {}) {
    const page = await browser.newPage();
    if (reducedMotion || colorScheme) await page.emulateMedia({ reducedMotion, colorScheme });
    const errors = [];
    const warnings = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto(`${baseURL}/${path}`);
    // 测试夹具页会在准备好后设置 window.ready；其他页面（如文档站）由测试自己等待
    if (path.startsWith('tests/fixtures/')) await page.waitForFunction(() => window.ready === true);
    t.after(async () => {
      await page.close();
      if (!allowErrors) assert.deepEqual(errors, [], '页面不应有错误');
    });
    return { page, warnings, errors };
  };
}
