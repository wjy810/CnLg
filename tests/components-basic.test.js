// 展示类组件：button / heading / card / stack / divider / loading（docs/rfc/0004-components.md）
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

test('vn-button：墨晕在按钮内，其他效果在按钮外层，none 不产生粒子', async (t) => {
  const { page } = await mount(
    t,
    '<vn-button id="a">落笔</vn-button><vn-button id="b" effect="blossom">赏花</vn-button><vn-button id="c" effect="none">无</vn-button>',
  );
  // 统计“加入过”的粒子，而不是还在的：点击较慢的浏览器里，墨晕可能在统计前就已经播完并移除
  await page.evaluate(() => {
    window.added = {};
    for (const [id, ref] of [['a', 'wash'], ['b', 'fx'], ['c', 'wash'], ['c', 'fx']]) {
      const key = `${id}.${ref}`;
      window.added[key] = 0;
      new MutationObserver((records) => {
        for (const r of records) for (const n of r.addedNodes) if (n.dataset?.vnBurst !== undefined) window.added[key]++;
      }).observe(document.getElementById(id).refs[ref], { childList: true });
    }
  });
  await page.locator('#a').click();
  await page.locator('#b').click();
  await page.locator('#c').click();
  const counts = await page.evaluate(() => ({
    inkWash: window.added['a.wash'],
    blossomFx: window.added['b.fx'],
    noneWash: window.added['c.wash'],
    noneFx: window.added['c.fx'],
  }));
  assert.deepEqual(counts, { inkWash: 1, blossomFx: 12, noneWash: 0, noneFx: 0 });
});

test('vn-button：disabled / loading 禁止点击，loading 显示墨圈并标记 aria-busy', async (t) => {
  const { page } = await mount(t, '<vn-button id="d" disabled>封</vn-button><vn-button id="l" loading>研</vn-button>');
  const state = await page.evaluate(() => {
    const d = document.getElementById('d');
    const l = document.getElementById('l');
    const inner = (el) => el.root.querySelector('button');
    return {
      disabled: inner(d).disabled,
      loadingDisabled: inner(l).disabled,
      busy: inner(l).getAttribute('aria-busy'),
      spinner: !!l.root.querySelector('.spinner'),
    };
  });
  assert.deepEqual(state, { disabled: true, loadingDisabled: true, busy: 'true', spinner: true });
  const clicks = await page.evaluate(() => {
    let n = 0;
    document.addEventListener('click', () => n++);
    document.getElementById('d').root.querySelector('button').click();
    return n;
  });
  assert.equal(clicks, 0);
});

test('vn-button：type=submit 提交表单，type=reset 重置；默认 type=button 不提交；fieldset 禁用', async (t) => {
  const { page } = await mount(
    t,
    `<form id="f"><fieldset id="fs"><input name="poet" value="李白" />
      <vn-button id="plain">普通</vn-button>
      <vn-button id="submit" type="submit">提交</vn-button>
      <vn-button id="reset" type="reset">重置</vn-button></fieldset></form>`,
  );
  await page.evaluate(() => {
    window.submits = 0;
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      window.submits++;
    });
  });
  await page.locator('#plain').click();
  assert.equal(await page.evaluate(() => window.submits), 0, '默认不提交');
  await page.locator('#submit').click();
  assert.equal(await page.evaluate(() => window.submits), 1);
  await page.locator('input').fill('杜甫');
  await page.locator('#reset').click();
  assert.equal(await page.locator('input').inputValue(), '李白');
  const disabled = await page.evaluate(async () => {
    document.getElementById('fs').disabled = true;
    await new Promise((r) => setTimeout(r));
    return document.getElementById('submit').root.querySelector('button').disabled;
  });
  assert.equal(disabled, true);
});

test('vn-button：键盘触发时墨晕从中心发出', async (t) => {
  const { page } = await mount(t, '<vn-button id="k">落笔</vn-button>');
  await page.locator('#k').focus();
  await page.keyboard.press('Enter');
  const center = await page.evaluate(() => {
    const el = document.getElementById('k');
    const ink = el.refs.wash.querySelector('[data-vn-burst]');
    const rect = el.refs.button.getBoundingClientRect();
    const r = parseFloat(ink.style.width) / 2;
    return { x: parseFloat(ink.style.left) + r, y: parseFloat(ink.style.top) + r, w: rect.width / 2, h: rect.height / 2 };
  });
  assert.ok(Math.abs(center.x - center.w) < 1 && Math.abs(center.y - center.h) < 1);
});

test('vn-heading：role=heading 与层级；1–3 级毛笔字；印章与副标题；层级越界被修正', async (t) => {
  const { page } = await mount(
    t,
    `<vn-heading id="h1" level="1" seal="雅" sub="副">题</vn-heading>
     <vn-heading id="h4" level="4">题</vn-heading>
     <vn-heading id="hp" level="2" plain>题</vn-heading>
     <vn-heading id="h9" level="9">题</vn-heading>`,
  );
  const info = await page.evaluate(() => {
    const read = (id) => {
      const el = document.getElementById(id);
      const title = el.root.querySelector('[role=heading]');
      return {
        level: title.getAttribute('aria-level'),
        font: getComputedStyle(title).fontFamily.includes('Ma Shan Zheng'),
        seal: el.root.querySelector('.seal')?.getAttribute('aria-label') ?? null,
        sub: el.root.querySelector('.sub')?.textContent ?? null,
      };
    };
    return { h1: read('h1'), h4: read('h4'), hp: read('hp'), h9: read('h9') };
  });
  assert.deepEqual(info.h1, { level: '1', font: true, seal: '印章：雅', sub: '副' });
  assert.deepEqual(info.h4, { level: '4', font: false, seal: null, sub: null });
  assert.equal(info.hp.font, false, 'plain 不用毛笔字');
  assert.equal(info.h9.level, '6');
});

test('vn-card：没有内容的标题、底部区域隐藏；有内容时显示', async (t) => {
  const { page } = await mount(
    t,
    `<vn-card id="empty">正文</vn-card>
     <vn-card id="full" variant="frame"><span slot="title">题</span>正文<button slot="footer">好</button></vn-card>`,
  );
  const shown = await page.evaluate(() => {
    const display = (id, cls) => getComputedStyle(document.getElementById(id).root.querySelector(cls)).display;
    return {
      emptyHeader: display('empty', '.header'),
      emptyFooter: display('empty', '.footer'),
      fullHeader: display('full', '.header'),
      fullFooter: display('full', '.footer'),
      frameBorder: getComputedStyle(document.getElementById('full').root.querySelector('.card')).borderTopWidth,
    };
  });
  assert.deepEqual(shown, { emptyHeader: 'none', emptyFooter: 'none', fullHeader: 'flex', fullFooter: 'flex', frameBorder: '2px' });
});

test('vn-stack：方向、间距、对齐映射到 flex', async (t) => {
  const { page } = await mount(t, '<vn-stack id="s" direction="row" gap="3" justify="between" align="center" wrap><i>a</i><i>b</i></vn-stack>');
  const style = await page.evaluate(() => {
    const s = getComputedStyle(document.getElementById('s'));
    return [s.flexDirection, s.columnGap, s.justifyContent, s.alignItems, s.flexWrap];
  });
  assert.deepEqual(style, ['row', '12px', 'space-between', 'center', 'wrap']);
});

test('vn-divider：role=separator、方向；无文字时只有一道线', async (t) => {
  const { page } = await mount(t, '<vn-divider id="a">春</vn-divider><vn-divider id="b"></vn-divider><vn-divider id="v" vertical></vn-divider>');
  const info = await page.evaluate(() => {
    const el = (id) => document.getElementById(id);
    const visibleLines = (id) => [...el(id).root.querySelectorAll('.line')].filter((l) => getComputedStyle(l).display !== 'none').length;
    return {
      role: el('a').internals.role,
      orientation: el('v').internals.ariaOrientation,
      withLabel: visibleLines('a'),
      withoutLabel: visibleLines('b'),
    };
  });
  assert.deepEqual(info, { role: 'separator', orientation: 'vertical', withLabel: 2, withoutLabel: 1 });
});

test('vn-loading：role=status 与读屏文字；quiet 时不显示文字', async (t) => {
  const { page } = await mount(t, '<vn-loading id="a" label="研墨中"></vn-loading><vn-loading id="q" quiet></vn-loading>');
  const info = await page.evaluate(() => {
    const a = document.getElementById('a');
    const q = document.getElementById('q');
    return {
      role: a.internals.role,
      label: a.internals.ariaLabel,
      quietLabel: q.internals.ariaLabel,
      quietText: getComputedStyle(q.root.querySelector('.text')).display,
    };
  });
  assert.deepEqual(info, { role: 'status', label: '研墨中', quietLabel: '加载中', quietText: 'none' });
});

test('组件移除后不留下效果粒子和动画', async (t) => {
  const { page } = await mount(t, '<vn-button id="x" effect="blossom">花</vn-button>');
  await page.locator('#x').click();
  const left = await page.evaluate(async () => {
    const el = document.getElementById('x');
    el.remove();
    await new Promise((r) => setTimeout(r, 50));
    return el.refs.fx.querySelectorAll('[data-vn-burst]').length;
  });
  assert.equal(left, 0, '移除组件时粒子动画被取消，节点随之删除');
});
