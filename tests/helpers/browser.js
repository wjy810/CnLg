// 浏览器测试的公共部分：启动静态服务器和 Chromium，打开测试页并收集错误
import { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serve } from '../../scripts/serve.js';

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
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
    server?.close();
  });

  return async function open(t, { reducedMotion, allowErrors = false } = {}) {
    const page = await browser.newPage();
    if (reducedMotion) await page.emulateMedia({ reducedMotion });
    const errors = [];
    const warnings = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto(`${baseURL}/tests/fixtures/index.html`);
    await page.waitForFunction(() => window.ready === true);
    t.after(async () => {
      await page.close();
      if (!allowErrors) assert.deepEqual(errors, [], '页面不应有错误');
    });
    return { page, warnings, errors };
  };
}
