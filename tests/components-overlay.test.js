// 浮层类组件：modal / toast（docs/rfc/0004-components.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

/** 减少动态效果下动画时长为 0，开关是即时的 */
async function mount(t, markup) {
  const ctx = await open(t, { path: PAGE, reducedMotion: 'reduce' });
  await ctx.page.evaluate(async (markup) => {
    await import('/src/components/index.js');
    document.body.insertAdjacentHTML('beforeend', markup);
    window.events = [];
    for (const type of ['vn-open', 'vn-close']) {
      document.addEventListener(type, (e) => window.events.push([type, e.detail?.returnValue ?? null]));
    }
    await new Promise((r) => requestAnimationFrame(r));
  }, markup);
  return ctx;
}

const MODAL = `<button id="opener">打开</button>
  <vn-modal id="m" heading="水调歌头"><p>明月几时有</p><button slot="footer" id="ok">好</button></vn-modal>`;

const modalState = (page) =>
  page.evaluate(() => {
    const el = document.getElementById('m');
    const dialog = el.root.querySelector('dialog');
    return { open: el.open, dialogOpen: dialog.open, events: window.events };
  });

test('vn-modal：show() 打开模态 dialog，标题关联，焦点进入弹窗', async (t) => {
  const { page } = await mount(t, MODAL);
  await page.locator('#opener').focus();
  await page.evaluate(() => document.getElementById('m').show());
  await page.waitForTimeout(50);
  const info = await page.evaluate(() => {
    const el = document.getElementById('m');
    const dialog = el.root.querySelector('dialog');
    return {
      modal: dialog.matches(':modal'),
      labelledBy: el.root.getElementById(dialog.getAttribute('aria-labelledby')).textContent,
      attr: el.hasAttribute('open'),
      focusInside: el.root.activeElement !== null || document.activeElement.closest('vn-modal') !== null,
      footer: getComputedStyle(el.root.querySelector('.footer')).display,
    };
  });
  assert.deepEqual(info, { modal: true, labelledBy: '水调歌头', attr: true, focusInside: true, footer: 'flex' });
  assert.deepEqual((await modalState(page)).events, [['vn-open', null]]);
});

test('vn-modal：Esc、点遮罩、关闭按钮、close(值) 都会关闭，并给出原因；焦点回到打开前的位置', async (t) => {
  const { page } = await mount(t, MODAL);
  const cycle = async (closeAction) => {
    await page.locator('#opener').focus();
    await page.evaluate(() => document.getElementById('m').show());
    await page.waitForTimeout(50);
    await closeAction();
    await page.waitForTimeout(80);
  };
  await cycle(() => page.keyboard.press('Escape'));
  await cycle(() => page.mouse.click(5, 5));
  await cycle(() => page.locator('#m .close').click());
  await cycle(() => page.evaluate(() => document.getElementById('m').close('ok')));
  const state = await modalState(page);
  assert.equal(state.dialogOpen, false);
  assert.deepEqual(
    state.events.filter(([type]) => type === 'vn-close').map(([, value]) => value),
    ['esc', 'backdrop', 'close-button', 'ok'],
  );
  assert.equal(await page.evaluate(() => document.activeElement.id), 'opener');
});

test('vn-modal：persistent 时 Esc 和遮罩不关闭', async (t) => {
  const { page } = await mount(t, MODAL.replace('<vn-modal id="m"', '<vn-modal id="m" persistent'));
  await page.evaluate(() => document.getElementById('m').show());
  await page.waitForTimeout(50);
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
  await page.waitForTimeout(80);
  assert.equal((await modalState(page)).dialogOpen, true);
  await page.evaluate(() => document.getElementById('m').close());
  await page.waitForTimeout(80);
  assert.equal((await modalState(page)).dialogOpen, false);
});

test('vn-modal：用 open 属性声明式控制', async (t) => {
  const { page } = await mount(t, MODAL);
  await page.evaluate(() => document.getElementById('m').setAttribute('open', ''));
  await page.waitForTimeout(50);
  assert.equal((await modalState(page)).dialogOpen, true);
  await page.evaluate(() => document.getElementById('m').removeAttribute('open'));
  await page.waitForTimeout(80);
  assert.equal((await modalState(page)).dialogOpen, false);
});

test('vn-modal：浏览器不支持 ::backdrop 动画时（Firefox）照常打开、关闭', async (t) => {
  const { page } = await mount(t, MODAL);
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (options?.pseudoElement === '::backdrop') throw new DOMException("'::backdrop' 不是有效的伪元素", 'SyntaxError');
      return animate.call(this, keyframes, options);
    };
  });
  await page.evaluate(() => document.getElementById('m').show());
  await page.waitForTimeout(50);
  assert.equal((await modalState(page)).dialogOpen, true);
  await page.evaluate(() => document.getElementById('m').close('done'));
  await page.waitForTimeout(80);
  const state = await modalState(page);
  assert.equal(state.dialogOpen, false);
  assert.deepEqual(state.events, [['vn-open', null], ['vn-close', 'done']]);
});

test('toast()：显示消息与对应印章，error 用 role=alert，到时自动关闭，可手动关闭', async (t) => {
  const { page } = await mount(t, '');
  const shown = await page.evaluate(async () => {
    const { toast } = await import('/src/components/index.js');
    window.t1 = toast('已收藏', { type: 'success', duration: 120 });
    window.t2 = toast('纸破了', { type: 'error', duration: 0 });
    toast('未知类型', { type: 'whatever', duration: 0 });
    await new Promise((r) => requestAnimationFrame(r));
    const toaster = document.querySelector('vn-toaster');
    return [...toaster.root.querySelectorAll('.toast')].map((el) => ({
      role: el.getAttribute('role'),
      seal: el.querySelector('.seal').textContent,
      text: el.querySelector('.message').textContent,
    }));
  });
  assert.deepEqual(shown, [
    { role: 'status', seal: '成', text: '已收藏' },
    { role: 'alert', seal: '误', text: '纸破了' },
    { role: 'status', seal: '讯', text: '未知类型' },
  ]);
  await page.waitForTimeout(300);
  const afterTimeout = await page.evaluate(() => [...document.querySelector('vn-toaster').root.querySelectorAll('.message')].map((m) => m.textContent));
  assert.deepEqual(afterTimeout, ['纸破了', '未知类型'], '成功消息 120ms 后自动关闭');
  await page.evaluate(() => window.t2.close());
  await page.waitForTimeout(100);
  const left = await page.evaluate(() => [...document.querySelector('vn-toaster').root.querySelectorAll('.message')].map((m) => m.textContent));
  assert.deepEqual(left, ['未知类型']);
  assert.equal(await page.evaluate(() => document.querySelectorAll('vn-toaster').length), 1, '只有一个容器');
});

test('toast()：弹窗打开时仍显示在最上层（顶层 popover，排在弹窗之后）', async (t) => {
  const { page } = await mount(t, MODAL);
  await page.evaluate(() => document.getElementById('m').show());
  await page.waitForTimeout(50);
  const state = await page.evaluate(async () => {
    const { toast } = await import('/src/components/index.js');
    toast('在弹窗之上', { duration: 0 });
    await new Promise((r) => requestAnimationFrame(r));
    const toaster = document.querySelector('vn-toaster');
    return { popover: toaster.matches(':popover-open'), dialog: document.getElementById('m').root.querySelector('dialog').matches(':modal') };
  });
  // 注：模态弹窗会让弹窗以外的内容不可交互（浏览器规定），此时消息可见但点不到，到时自动关闭
  assert.deepEqual(state, { popover: true, dialog: true });
});

test('vn-tooltip：悬停一段时间后显示在上方，移开隐藏；聚焦立即显示，Esc 隐藏', async (t) => {
  const { page } = await mount(t, '<div style="padding: 120px"><vn-tooltip id="tip" content="收入诗笺" delay="150"><button id="b">藏</button></vn-tooltip></div>');
  const state = () =>
    page.evaluate(() => {
      const tip = document.getElementById('tip');
      const bubble = tip.refs.bubble;
      const b = document.getElementById('b').getBoundingClientRect();
      const r = bubble.getBoundingClientRect();
      return { open: tip.hasState('open'), above: r.bottom <= b.top, centered: Math.abs(r.left + r.width / 2 - (b.left + b.width / 2)) < 1 };
    });
  await page.locator('#b').hover();
  await page.waitForTimeout(60);
  assert.equal((await state()).open, false, '延迟之前不显示');
  await page.waitForTimeout(200);
  assert.deepEqual(await state(), { open: true, above: true, centered: true });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  assert.equal((await state()).open, false);
  await page.locator('#b').focus();
  await page.waitForTimeout(30);
  assert.equal((await state()).open, true, '聚焦时立即显示');
  await page.keyboard.press('Escape');
  assert.equal((await state()).open, false);
});

test('vn-tooltip：文字写在真正获得焦点的元素的 aria-description 上（包括 vn-button 内部的按钮），移除后清理', async (t) => {
  const { page } = await mount(t, '<vn-tooltip id="a" content="一"><button id="plain">甲</button></vn-tooltip><vn-tooltip id="c" content="二"><vn-button id="vb">乙</vn-button></vn-tooltip>');
  await page.waitForTimeout(30);
  const read = () =>
    page.evaluate(() => ({
      plain: document.getElementById('plain').getAttribute('aria-description'),
      inner: document.getElementById('vb').root.querySelector('button').getAttribute('aria-description'),
      host: document.getElementById('vb').getAttribute('aria-description'),
    }));
  assert.deepEqual(await read(), { plain: '一', inner: '二', host: null });
  await page.evaluate(() => {
    document.getElementById('a').content = '一一';
    document.getElementById('c').disabled = true;
  });
  assert.deepEqual(await read(), { plain: '一一', inner: null, host: null });
  await page.evaluate(() => {
    const plain = document.getElementById('plain');
    document.getElementById('a').replaceWith(plain);
  });
  assert.equal((await read()).plain, null);
});

const DRAWER = `<button id="opener">打开</button>
  <vn-drawer id="d" heading="目录" placement="left"><p>一、静夜思</p><button slot="footer" id="ok">好</button></vn-drawer>`;

test('vn-drawer：从边缘滑出的模态 dialog；Esc、遮罩、关闭按钮都能关闭；焦点回到原处', async (t) => {
  const { page } = await mount(t, DRAWER);
  await page.locator('#opener').focus();
  await page.evaluate(() => document.getElementById('d').show());
  await page.waitForTimeout(50);
  const info = await page.evaluate(() => {
    const d = document.getElementById('d');
    const dialog = d.root.querySelector('dialog');
    const r = dialog.getBoundingClientRect();
    return {
      modal: dialog.matches(':modal'),
      label: d.root.getElementById(dialog.getAttribute('aria-labelledby')).textContent,
      left: Math.round(r.left),
      fullHeight: Math.round(r.height) === innerHeight,
      footer: getComputedStyle(d.root.querySelector('.footer')).display,
      events: window.events,
    };
  });
  assert.deepEqual(info, { modal: true, label: '目录', left: 0, fullHeight: true, footer: 'flex', events: [['vn-open', null]] });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(50);
  const closed = await page.evaluate(() => ({
    open: document.getElementById('d').root.querySelector('dialog').open,
    focus: document.activeElement.id,
    last: window.events.at(-1),
  }));
  assert.deepEqual(closed, { open: false, focus: 'opener', last: ['vn-close', 'esc'] });
  await page.evaluate(() => document.getElementById('d').show());
  await page.waitForTimeout(50);
  await page.mouse.click(700, 300);
  await page.waitForTimeout(50);
  assert.deepEqual(await page.evaluate(() => window.events.at(-1)), ['vn-close', 'backdrop']);
});
