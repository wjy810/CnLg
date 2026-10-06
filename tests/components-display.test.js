// 第二批 · 展示类组件：tag / progress / breadcrumb / timeline（docs/rfc/0007-components-2.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

async function mount(t, markup, options = {}) {
  const ctx = await open(t, { path: PAGE, ...options });
  await ctx.page.evaluate(async (markup) => {
    await import('/src/components/index.js');
    const host = document.createElement('div');
    host.id = 'host';
    host.style.padding = '40px';
    host.innerHTML = markup;
    document.body.append(host);
    await new Promise((r) => requestAnimationFrame(r));
  }, markup);
  return ctx;
}

test('vn-tag：颜色来自主题；closable 的关闭按钮有读屏名称，点了移除自己，vn-close 可以阻止', async (t) => {
  const { page } = await mount(t, '<vn-tag id="a" type="danger">误</vn-tag><vn-tag id="b" closable>李白</vn-tag><vn-tag id="c" closable>杜甫</vn-tag>');
  const info = await page.evaluate(() => {
    const color = (id) => getComputedStyle(document.getElementById(id).root.querySelector('.tag')).color;
    const danger = getComputedStyle(document.documentElement).getPropertyValue('--vn-danger').trim();
    const probe = document.body.appendChild(Object.assign(document.createElement('span'), { style: `color: ${danger}` }));
    return { danger: color('a') === getComputedStyle(probe).color, label: document.getElementById('b').root.querySelector('.close').getAttribute('aria-label') };
  });
  assert.deepEqual(info, { danger: true, label: '移除 李白' });
  await page.evaluate(() => document.getElementById('c').addEventListener('vn-close', (e) => e.preventDefault()));
  await page.locator('#b').getByRole('button').click();
  await page.locator('#c').getByRole('button').click();
  const left = await page.evaluate(() => [...document.querySelectorAll('vn-tag')].map((el) => el.id));
  assert.deepEqual(left, ['a', 'c']);
});

test('vn-progress：role=progressbar 与百分比；没有 value 时是不确定进度', async (t) => {
  const { page } = await mount(t, '<vn-progress id="p" value="0.25" label="研墨"></vn-progress><vn-progress id="q"></vn-progress>');
  const read = () =>
    page.evaluate(() => {
      const info = (id) => {
        const el = document.getElementById(id);
        return {
          role: el.internals.role,
          now: el.internals.ariaValueNow,
          label: el.internals.ariaLabel,
          indeterminate: el.hasState('indeterminate'),
          text: el.root.querySelector('.percent').textContent,
        };
      };
      return { p: info('p'), q: info('q') };
    });
  assert.deepEqual(await read(), {
    p: { role: 'progressbar', now: '25', label: '研墨', indeterminate: false, text: '25%' },
    q: { role: 'progressbar', now: null, label: '进度', indeterminate: true, text: '' },
  });
  await page.evaluate(() => {
    document.getElementById('p').value = 2; // 超出 max 按 100% 算
    document.getElementById('q').setAttribute('value', '0.5');
  });
  const after = await read();
  assert.equal(after.p.now, '100');
  assert.deepEqual([after.q.now, after.q.indeterminate], ['50', false]);
});

test('vn-breadcrumb：nav + 列表；最后一项是当前页，不是链接；增删项时自动更新', async (t) => {
  const { page } = await mount(
    t,
    `<vn-breadcrumb id="b" separator="›">
      <vn-breadcrumb-item href="/">首页</vn-breadcrumb-item>
      <vn-breadcrumb-item href="/poems">诗集</vn-breadcrumb-item>
      <vn-breadcrumb-item href="/poems/1">静夜思</vn-breadcrumb-item>
    </vn-breadcrumb>`,
  );
  const read = () =>
    page.evaluate(() => {
      const b = document.getElementById('b');
      const items = [...b.querySelectorAll('vn-breadcrumb-item')];
      return {
        nav: b.root.querySelector('nav').getAttribute('aria-label'),
        role: items[0].internals.role,
        links: items.map((i) => i.root.querySelector('a')?.getAttribute('href') ?? null),
        current: items.map((i) => i.root.querySelector('[aria-current]')?.getAttribute('aria-current') ?? null),
        separators: items.map((i) => i.root.querySelector('.sep')?.textContent ?? null),
      };
    });
  assert.deepEqual(await read(), {
    nav: '面包屑',
    role: 'listitem',
    links: ['/', '/poems', null],
    current: [null, null, 'page'],
    separators: [null, '›', '›'],
  });
  await page.evaluate(() => document.querySelector('vn-breadcrumb-item:last-child').remove());
  await page.waitForTimeout(20);
  const after = await read();
  assert.deepEqual(after.links, ['/', null]);
  assert.deepEqual(after.current, [null, 'page']);
});

test('vn-timeline：列表语义；有 seal 时是小印，否则是圆点；最后一项没有连线', async (t) => {
  const { page } = await mount(
    t,
    `<vn-timeline id="tl">
      <vn-timeline-item time="开元十八年" seal="游">初入长安</vn-timeline-item>
      <vn-timeline-item time="天宝元年" type="accent">供奉翰林</vn-timeline-item>
    </vn-timeline>`,
  );
  const info = await page.evaluate(() => {
    const tl = document.getElementById('tl');
    const [a, b] = tl.querySelectorAll('vn-timeline-item');
    return {
      roles: [tl.internals.role, a.internals.role],
      markers: [a.root.querySelector('.seal')?.textContent, b.root.querySelector('.dot') ? 'dot' : null],
      time: a.root.querySelector('.time').textContent,
      lines: [getComputedStyle(a, '::before').display, getComputedStyle(b, '::before').display],
    };
  });
  assert.deepEqual(info, { roles: ['list', 'listitem'], markers: ['游', 'dot'], time: '开元十八年', lines: ['block', 'none'] });
});

test('vn-loading：减少动态效果时墨滴静止', async (t) => {
  const { page } = await mount(t, '<vn-loading id="l"></vn-loading>', { reducedMotion: 'reduce' });
  const animations = await page.evaluate(() => document.getElementById('l').root.getAnimations().length);
  assert.equal(animations, 0);
});
