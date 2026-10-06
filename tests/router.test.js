// 路由的浏览器测试（docs/rfc/0005-router.md 第 4 节）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

/** 在页面中创建路由并渲染到 #app；routes 中的 view 都输出 <h1>名字</h1> */
async function setup(page, { mode = 'hash', base = '', extra = '' } = {}) {
  await page.evaluate(
    async ({ mode, base, extra }) => {
      const { createRouter, html, render } = window.vunio;
      await import('/src/components/index.js');
      document.body.insertAdjacentHTML('beforeend', `<div id="app"></div>${extra}`);
      let resolveSlow;
      window.slowLoaded = new Promise((r) => (resolveSlow = r));
      window.router = createRouter({
        mode,
        base,
        title: '默认标题',
        routes: [
          { path: '/', title: '首页', view: () => html`<h1>首页</h1>` },
          { path: '/poems/:id', title: (p) => `诗 ${p.id}`, view: ({ params, query }) => html`<h1>诗 ${params.id}</h1> <p class="q">${query.mode ?? ''}</p>` },
          { path: '/poems/featured', view: () => html`<h1>精选</h1>` },
          {
            path: '/slow',
            load: () => window.slowLoaded.then(() => ({ default: () => html`<h1>慢页面</h1>` })),
          },
          { path: '/broken', load: () => Promise.reject(new Error('坏了')) },
        ],
        notFound: ({ path }) => html`<h1>找不到 ${path}</h1>`,
        loading: () => html`<p class="loading">加载中</p>`,
      });
      window.resolveSlow = resolveSlow;
      render(html`<nav><a id="link-poem" href=${window.router.href('/poems/7')}>七</a></nav>${window.router.outlet()}`, document.getElementById('app'));
      window.router.start();
      await new Promise((r) => requestAnimationFrame(r));
    },
    { mode, base, extra },
  );
}

const view = (page) => page.evaluate(() => document.querySelector('[data-vn-outlet]').textContent.replace(/\s+/g, ' ').trim());
const tick = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test('hash 模式：初始路由、navigate、参数与查询串、标题、前进后退', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  assert.equal(await view(page), '首页');
  assert.equal(await page.title(), '首页');

  await page.evaluate(() => window.router.navigate('/poems/42?mode=read'));
  await tick(page);
  assert.equal(await view(page), '诗 42 read');
  assert.equal(await page.title(), '诗 42');
  assert.match(page.url(), /#\/poems\/42\?mode=read$/);

  await page.evaluate(() => window.router.navigate('/poems/featured'));
  assert.equal(await view(page), '精选', '静态段优先于参数');

  await page.goBack();
  await tick(page);
  assert.equal(await view(page), '诗 42 read');
  await page.goBack();
  await tick(page);
  assert.equal(await view(page), '首页');
  await page.goForward();
  await tick(page);
  assert.equal(await view(page), '诗 42 read');
});

test('hash 模式：站内链接被接管；直接改 hash 也会更新', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  await page.locator('#link-poem').click();
  await tick(page);
  assert.equal(await view(page), '诗 7');
  await page.evaluate(() => (window.location.hash = '#/nowhere'));
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet]').textContent.includes('找不到'));
  assert.equal(await view(page), '找不到 /nowhere');
  assert.equal(await page.title(), '默认标题');
});

test('懒加载：先显示加载中，完成后显示页面；失败显示错误', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  await page.evaluate(() => window.router.navigate('/slow'));
  assert.equal(await view(page), '加载中');
  await page.evaluate(() => window.resolveSlow());
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet]').textContent.includes('慢页面'));
  await page.evaluate(() => window.router.navigate('/broken'));
  await page.waitForFunction(() => document.querySelector('[data-vn-outlet]').textContent.includes('失败'));
  assert.equal(await view(page), '页面加载失败：坏了');
});

test('导航后焦点移到新页面的主标题；首次打开时不移动焦点', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BODY');
  await page.evaluate(() => window.router.navigate('/poems/1'));
  await tick(page);
  assert.equal(await page.evaluate(() => document.activeElement.textContent), '诗 1');
  await page.evaluate(() => window.router.navigate('/slow'));
  await page.evaluate(() => window.resolveSlow());
  await page.waitForFunction(() => document.activeElement?.textContent === '慢页面');
});

test('isActive 是响应式的', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  const states = await page.evaluate(async () => {
    const { effect } = window.vunio;
    const log = [];
    effect(() => log.push([window.router.isActive('/poems'), window.router.isActive('/', { exact: true })]));
    window.router.navigate('/poems/3');
    window.router.navigate('/');
    return log;
  });
  assert.deepEqual(states, [
    [false, true],
    [true, false],
    [false, true],
  ]);
});

test('前进后退恢复滚动位置，新页面回到顶部', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page, { extra: '<div style="height: 4000px"></div>' });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.evaluate(() => window.router.navigate('/poems/1'));
  await tick(page);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.goBack();
  await tick(page);
  assert.equal(await page.evaluate(() => window.scrollY), 1200);
});

test('history 模式：带 base 的路径、链接接管；外链、新窗口、修饰键不接管', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page, {
    mode: 'history',
    base: '/app',
    extra: `<a id="internal" href="/app/poems/9">内</a>
      <a id="outside" href="/other/page">外</a>
      <a id="external" href="https://example.com/">站外</a>
      <a id="blank" href="/app/poems/1" target="_blank">新窗口</a>`,
  });
  assert.equal(await view(page), '找不到 /tests/fixtures/theme.html', '页面路径不在 base 下');
  await page.evaluate(() => window.router.navigate('/'));
  assert.equal(new URL(page.url()).pathname, '/app/');
  assert.equal(await view(page), '首页');

  await page.locator('#internal').click();
  assert.equal(new URL(page.url()).pathname, '/app/poems/9');
  assert.equal(await view(page), '诗 9');

  const prevented = await page.evaluate(() => {
    const result = {};
    window.addEventListener('click', (e) => {
      result[e.target.id + (e.ctrlKey ? '+ctrl' : '')] = e.defaultPrevented;
      e.preventDefault(); // 测试中阻止真正跳转
    });
    for (const id of ['outside', 'external', 'blank']) document.getElementById(id).click();
    document.getElementById('internal').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    return result;
  });
  assert.deepEqual(prevented, { outside: false, external: false, blank: false, 'internal+ctrl': false });
});

test('stop() 之后不再响应地址变化', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  await page.evaluate(() => window.router.stop());
  await page.evaluate(() => (window.location.hash = '#/poems/5'));
  await page.waitForTimeout(100);
  assert.equal(await view(page), '首页');
});

test('hash 模式：#section 这样的页内锚点不改变路由，只滚动过去', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page, { extra: '<div style="height: 3000px"></div><h2 id="section">锚点</h2><div style="height: 2000px"></div><a id="jump" href="#section">去锚点</a>' });
  await page.evaluate(() => window.router.navigate('/poems/3'));
  await tick(page);
  await page.evaluate(() => document.getElementById('jump').click());
  await tick(page);
  const state = await page.evaluate(() => ({
    view: document.querySelector('[data-vn-outlet]').textContent.replace(/\s+/g, ' ').trim(),
    hash: location.hash,
    nearAnchor: Math.abs(document.getElementById('section').getBoundingClientRect().top) < 5,
    focused: document.activeElement.id,
  }));
  assert.deepEqual(state, { view: '诗 3', hash: '#/poems/3', nearAnchor: true, focused: 'section' });
  // 手动改成锚点 hash 也一样
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => (location.hash = '#section'));
  await page.waitForFunction(() => location.hash === '#/poems/3');
  assert.equal(await view(page), '诗 3');
});
