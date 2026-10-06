// 第二批 · 导航与叙事：tabs / pagination / collapse（docs/rfc/0007-components-2.md）
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
    host.style.cssText = 'padding: 40px; width: 560px';
    host.innerHTML = markup;
    document.body.append(host);
    window.events = [];
    for (const type of ['vn-change', 'vn-toggle']) {
      host.addEventListener(type, (e) => window.events.push(`${e.target.id}:${type}:${JSON.stringify(e.detail)}`));
    }
    await new Promise((r) => requestAnimationFrame(r));
  }, markup);
  return ctx;
}

const TABS = `<vn-tabs id="tabs" label="四时" value="autumn">
  <vn-tab-panel name="spring" label="春">春眠不觉晓</vn-tab-panel>
  <vn-tab-panel name="summer" label="夏" disabled>接天莲叶无穷碧</vn-tab-panel>
  <vn-tab-panel name="autumn" label="秋">停车坐爱枫林晚</vn-tab-panel>
  <vn-tab-panel name="winter" label="冬">千山鸟飞绝</vn-tab-panel>
</vn-tabs>`;

const tabsState = (page) =>
  page.evaluate(() => {
    const el = document.getElementById('tabs');
    const tabs = [...el.root.querySelectorAll('[role=tab]')];
    const panels = [...el.root.querySelectorAll('[role=tabpanel]')];
    const shown = panels.find((p) => !p.hidden);
    return {
      value: el.value,
      selected: tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
      tabbable: tabs.filter((t) => t.tabIndex === 0).length,
      focused: el.root.activeElement?.textContent.trim() ?? null,
      shown: shown?.querySelector('slot').assignedElements()[0]?.textContent ?? null,
      events: window.events.splice(0),
    };
  });

test('vn-tabs：tablist / tab / tabpanel 互相关联；面板内容投进来；只有当前标签可 Tab 到', async (t) => {
  const { page } = await mount(t, TABS);
  const links = await page.evaluate(() => {
    const el = document.getElementById('tabs');
    const tab = el.root.querySelector('[role=tab]');
    const panel = el.root.getElementById(tab.getAttribute('aria-controls'));
    return {
      tablist: el.root.querySelector('[role=tablist]').getAttribute('aria-label'),
      panelRole: panel.getAttribute('role'),
      back: panel.getAttribute('aria-labelledby') === tab.id,
      disabled: el.root.querySelectorAll('[role=tab]')[1].disabled,
    };
  });
  assert.deepEqual(links, { tablist: '四时', panelRole: 'tabpanel', back: true, disabled: true });
  assert.deepEqual(await tabsState(page), { value: 'autumn', selected: 2, tabbable: 1, focused: null, shown: '停车坐爱枫林晚', events: [] });
  const indicator = await page.evaluate(() => {
    const el = document.getElementById('tabs');
    const tab = el.root.querySelectorAll('[role=tab]')[2];
    return [el.refs.indicator.offsetWidth, tab.offsetWidth];
  });
  assert.equal(indicator[0], indicator[1], '下划线和当前标签一样宽');
});

test('vn-tabs：← → 切换并显示（跳过禁用、首尾循环），Home / End；点击切换；派发 vn-change', async (t) => {
  const { page } = await mount(t, TABS);
  await page.locator('#tabs').getByRole('tab', { name: '秋' }).focus();
  await page.keyboard.press('ArrowRight');
  let s = await tabsState(page);
  assert.deepEqual([s.value, s.focused, s.shown, s.events], ['winter', '冬', '千山鸟飞绝', ['tabs:vn-change:{"value":"winter"}']]);
  await page.keyboard.press('ArrowRight');
  assert.equal((await tabsState(page)).value, 'spring', '末尾循环到开头');
  await page.keyboard.press('ArrowRight');
  assert.equal((await tabsState(page)).value, 'autumn', '跳过禁用的“夏”');
  await page.keyboard.press('Home');
  assert.equal((await tabsState(page)).focused, '春');
  await page.keyboard.press('End');
  assert.equal((await tabsState(page)).focused, '冬');
  await page.locator('#tabs').getByRole('tab', { name: '春' }).click();
  s = await tabsState(page);
  assert.deepEqual([s.value, s.shown], ['spring', '春眠不觉晓']);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.getElementById('tabs').root.activeElement?.getAttribute('role')), 'tabpanel', 'Tab 进入面板');
});

test('vn-tabs：增删面板时标签随之更新；value 指向不存在或禁用的页时显示第一个可用页', async (t) => {
  const { page } = await mount(t, TABS);
  await page.evaluate(() => {
    const panel = Object.assign(document.createElement('vn-tab-panel'), { name: 'moon', label: '月', textContent: '举头望明月' });
    document.getElementById('tabs').append(panel);
  });
  await page.waitForTimeout(20);
  const labels = await page.evaluate(() => [...document.getElementById('tabs').root.querySelectorAll('[role=tab]')].map((t) => t.textContent.trim()));
  assert.deepEqual(labels, ['春', '夏', '秋', '冬', '月']);
  await page.evaluate(() => (document.getElementById('tabs').value = 'moon'));
  assert.equal((await tabsState(page)).shown, '举头望明月');
  await page.evaluate(() => (document.getElementById('tabs').value = 'summer'));
  assert.equal((await tabsState(page)).shown, '春眠不觉晓');
});

test('pageItems：页数少时全部列出，多时首尾 + 当前页两侧，其余折叠', async (t) => {
  // 组件模块依赖 DOM，在浏览器中计算
  const { page } = await mount(t, '');
  const result = await page.evaluate(async () => {
    const { pageItems } = await import('/src/components/pagination.js');
    return {
      few: pageItems(3, 5),
      start: pageItems(2, 20),
      middle: pageItems(10, 20),
      end: pageItems(19, 20),
      wide: pageItems(10, 20, 2),
    };
  });
  assert.deepEqual(result, {
    few: [1, 2, 3, 4, 5],
    start: [1, 2, 3, 4, 5, 'end-gap', 20],
    middle: [1, 'start-gap', 9, 10, 11, 'end-gap', 20],
    end: [1, 'start-gap', 16, 17, 18, 19, 20],
    wide: [1, 'start-gap', 8, 9, 10, 11, 12, 'end-gap', 20],
  });
});

test('vn-pagination：nav + 当前页 aria-current；两端禁用上一页 / 下一页；点击换页并派发 vn-change；越界的 page 被修正', async (t) => {
  const { page } = await mount(t, '<vn-pagination id="p" total="200" page="1"></vn-pagination>');
  const read = () =>
    page.evaluate(() => {
      const el = document.getElementById('p');
      const buttons = [...el.root.querySelectorAll('li')].map((li) => li.textContent.trim());
      return {
        label: el.root.querySelector('nav').getAttribute('aria-label'),
        buttons,
        current: el.root.querySelector('[aria-current=page]')?.textContent.trim(),
        prev: el.root.querySelector('[part=prev]').disabled,
        next: el.root.querySelector('[part=next]').disabled,
        events: window.events.splice(0),
      };
    });
  assert.deepEqual(await read(), {
    label: '分页',
    buttons: ['‹', '1', '2', '3', '4', '5', '…', '20', '›'],
    current: '1',
    prev: true,
    next: false,
    events: [],
  });
  await page.locator('#p').getByRole('button', { name: '第 5 页' }).click();
  let s = await read();
  assert.deepEqual([s.current, s.buttons.join(' '), s.events], ['5', '‹ 1 … 4 5 6 … 20 ›', ['p:vn-change:{"page":5}']]);
  await page.locator('#p').getByRole('button', { name: '下一页' }).click();
  assert.equal((await read()).current, '6');
  await page.evaluate(() => (document.getElementById('p').page = 99));
  s = await read();
  assert.deepEqual([s.current, s.next], ['20', true]);
});

const COLLAPSE = `<vn-collapse id="c" accordion>
  <vn-collapse-item id="a" heading="作者" open>李白，字太白</vn-collapse-item>
  <vn-collapse-item id="b" heading="出处">《李太白集》</vn-collapse-item>
</vn-collapse>`;

const collapseState = (page) =>
  page.evaluate(() => ({
    open: ['a', 'b'].map((id) => document.getElementById(id).open),
    details: ['a', 'b'].map((id) => document.getElementById(id).refs.details.open),
    events: window.events.splice(0),
  }));

test('vn-collapse：原生 details / summary；点击展开，accordion 收起其他项；初次渲染不播动画', async (t) => {
  const { page } = await mount(t, COLLAPSE, { reducedMotion: 'reduce' });
  const initial = await page.evaluate(() => ({
    summary: document.getElementById('a').root.querySelector('summary') !== null,
    animations: document.getElementById('a').root.getAnimations().length,
  }));
  assert.deepEqual(initial, { summary: true, animations: 0 });
  await page.waitForTimeout(30);
  await page.evaluate(() => (window.events = []));
  await page.locator('#b summary').click();
  await page.waitForTimeout(60);
  const s = await collapseState(page);
  assert.deepEqual([s.open, s.details], [[false, true], [false, true]]);
  assert.ok(s.events.includes('b:vn-toggle:{"open":true}') && s.events.includes('a:vn-toggle:{"open":false}'), s.events.join(' '));
});

test('vn-collapse：键盘 Enter 收起时先播动画再关闭；show() / hide() / toggle()', async (t) => {
  const { page } = await mount(t, COLLAPSE.replace(' accordion', ''));
  await page.locator('#a summary').focus();
  await page.keyboard.press('Enter');
  const during = await page.evaluate(() => ({ details: document.getElementById('a').refs.details.open, animations: document.getElementById('a').root.getAnimations().length }));
  assert.deepEqual(during, { details: true, animations: 1 }, '收起动画播放期间 details 仍然打开');
  await page.waitForTimeout(500);
  assert.deepEqual((await collapseState(page)).details, [false, false]);
  await page.evaluate(() => {
    document.getElementById('a').show();
    document.getElementById('b').toggle();
  });
  await page.waitForTimeout(500);
  assert.deepEqual((await collapseState(page)).details, [true, true], '不是 accordion 时可以同时展开');
});
