// 第二批 · 表单组件：textarea / radio-group / slider（docs/rfc/0007-components-2.md）
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
    host.style.cssText = 'padding: 40px; width: 400px';
    host.innerHTML = markup;
    document.body.append(host);
    window.events = [];
    for (const type of ['input', 'change']) host.addEventListener(type, (e) => window.events.push(`${e.target.id}:${type}`));
    await new Promise((r) => requestAnimationFrame(r));
  }, markup);
  return ctx;
}

const formData = (page) => page.evaluate(() => [...new FormData(document.getElementById('f')).entries()]);

test('vn-textarea：输入进 FormData；字数统计；校验信息为中文；reset 恢复默认值', async (t) => {
  const { page } = await mount(t, '<form id="f"><vn-textarea id="ta" name="note" label="批注" value="床前" maxlength="10" minlength="3" required></vn-textarea></form>');
  const ta = page.locator('#ta textarea');
  await ta.fill('床前明月光，疑是地上霜');
  const state = await page.evaluate(() => {
    const el = document.getElementById('ta');
    return { count: el.root.querySelector('.count').textContent, rows: el.refs.textarea.rows, valid: el.checkValidity() };
  });
  assert.deepEqual(state, { count: '10 / 10', rows: 3, valid: true }, 'maxlength 由原生 textarea 截断');
  assert.deepEqual(await formData(page), [['note', '床前明月光，疑是地上']]);
  await ta.fill('床');
  await ta.blur();
  const message = await page.evaluate(() => document.getElementById('ta').root.querySelector('.message').textContent.trim());
  assert.match(message, /至少需要 3 个字/);
  await page.evaluate(() => document.getElementById('f').reset());
  assert.deepEqual(await formData(page), [['note', '床前']]);
});

test('vn-textarea：autosize 时随内容长高', async (t) => {
  const { page } = await mount(t, '<vn-textarea id="ta" autosize rows="2"></vn-textarea>');
  const height = () => page.evaluate(() => document.getElementById('ta').refs.textarea.getBoundingClientRect().height);
  const before = await height();
  await page.locator('#ta textarea').fill('一\n二\n三\n四\n五\n六');
  assert.ok((await height()) > before * 1.8, '六行比两行高得多');
});

const RADIOS = `<form id="f">
  <vn-radio-group id="g" name="season" label="时节" value="autumn" required>
    <vn-radio id="r1" value="spring">春</vn-radio>
    <vn-radio id="r2" value="summer" disabled>夏</vn-radio>
    <vn-radio id="r3" value="autumn">秋</vn-radio>
    <vn-radio id="r4" value="winter">冬</vn-radio>
  </vn-radio-group>
</form>`;

const radioState = (page) =>
  page.evaluate(() => {
    const radios = [...document.querySelectorAll('vn-radio')];
    return {
      value: document.getElementById('g').value,
      checked: radios.map((r) => r.internals.ariaChecked),
      tabbable: radios.filter((r) => r.tabIndex === 0).map((r) => r.id),
      focused: document.activeElement?.id || null,
    };
  });

test('vn-radio-group：radiogroup + radio；只有选中项可以 Tab 到；方向键移动并选中，跳过禁用项、首尾循环', async (t) => {
  const { page } = await mount(t, RADIOS);
  const roles = await page.evaluate(() => ({
    group: document.getElementById('g').root.querySelector('[role=radiogroup]').getAttribute('aria-labelledby'),
    radio: document.getElementById('r1').internals.role,
    disabled: document.getElementById('r2').internals.ariaDisabled,
  }));
  assert.deepEqual(roles, { group: 'label', radio: 'radio', disabled: 'true' });
  assert.deepEqual(await radioState(page), { value: 'autumn', checked: ['false', 'false', 'true', 'false'], tabbable: ['r3'], focused: null });

  await page.keyboard.press('Tab');
  assert.equal((await radioState(page)).focused, 'r3', 'Tab 落在选中项上');
  await page.keyboard.press('ArrowDown');
  assert.deepEqual(await radioState(page), { value: 'winter', checked: ['false', 'false', 'false', 'true'], tabbable: ['r4'], focused: 'r4' });
  await page.keyboard.press('ArrowRight');
  assert.equal((await radioState(page)).value, 'spring', '末尾循环到开头');
  await page.keyboard.press('ArrowDown');
  assert.equal((await radioState(page)).value, 'autumn', '跳过禁用的“夏”');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  assert.equal((await radioState(page)).value, 'winter', '开头循环到末尾');
  assert.deepEqual(await formData(page), [['season', 'winter']]);
  const events = await page.evaluate(() => window.events.filter((e) => e.startsWith('g:')).length);
  assert.equal(events, 10, '每次选中派发 input + change');
});

test('vn-radio-group：点击选中，禁用项点不中；必选校验；reset 恢复；fieldset 禁用', async (t) => {
  const { page } = await mount(t, RADIOS.replace('value="autumn" ', '') + '<fieldset id="fs"></fieldset>');
  assert.deepEqual((await radioState(page)).tabbable, ['r1'], '没有选中项时第一项可 Tab 到');
  const invalid = await page.evaluate(() => {
    const form = document.getElementById('f');
    const ok = form.checkValidity();
    return { ok, message: document.getElementById('g').validationMessage };
  });
  assert.deepEqual(invalid, { ok: false, message: '请选择一项' });
  await page.locator('#r2').click({ force: true });
  assert.equal((await radioState(page)).value, '');
  await page.locator('#r4').click();
  assert.equal((await radioState(page)).value, 'winter');
  assert.equal(await page.evaluate(() => document.getElementById('f').checkValidity()), true);
  await page.evaluate(() => document.getElementById('f').reset());
  assert.equal((await radioState(page)).value, '');
  await page.evaluate(() => {
    const fs = document.getElementById('fs');
    fs.append(document.getElementById('g'));
    document.getElementById('f').append(fs);
    fs.disabled = true;
  });
  await page.locator('#r1').click({ force: true });
  const disabled = await radioState(page);
  assert.deepEqual([disabled.value, disabled.tabbable], ['', []]);
});

const sliderState = (page) =>
  page.evaluate(() => {
    const el = document.getElementById('s');
    const thumb = el.refs.thumb;
    return {
      value: el.value,
      now: thumb.getAttribute('aria-valuenow'),
      text: thumb.getAttribute('aria-valuetext'),
      events: window.events.splice(0).join(' '),
    };
  });

test('vn-slider：role=slider；方向键、PageUp/PageDown、Home/End；每次按键派发 input + change', async (t) => {
  const { page } = await mount(t, '<form id="f"><vn-slider id="s" name="volume" label="音量" min="0" max="50" step="5" unit="%"></vn-slider></form>');
  const roles = await page.evaluate(() => {
    const thumb = document.getElementById('s').refs.thumb;
    return ['role', 'aria-valuemin', 'aria-valuemax', 'aria-labelledby'].map((n) => thumb.getAttribute(n));
  });
  assert.deepEqual(roles, ['slider', '0', '50', 'label']);
  assert.deepEqual(await sliderState(page), { value: '', now: '25', text: '25%', events: '' }, '没有 value 时取中点');
  assert.deepEqual(await formData(page), [['volume', '25']]);
  await page.locator('#s [role=slider]').focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await sliderState(page), { value: '30', now: '30', text: '30%', events: 's:input s:change' });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  assert.equal((await sliderState(page)).now, '20');
  await page.keyboard.press('PageUp');
  assert.equal((await sliderState(page)).now, '25', 'PageUp 走范围的十分之一（不小于一步）');
  await page.keyboard.press('End');
  assert.equal((await sliderState(page)).now, '50');
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await sliderState(page), { value: '50', now: '50', text: '50%', events: '' }, '到头不再变化，也不派发事件');
  await page.keyboard.press('Home');
  assert.equal((await sliderState(page)).now, '0');
});

test('vn-slider：点在轨道上跳到该处，拖动中派发 input，松手派发一次 change；小数步长没有浮点误差', async (t) => {
  const { page } = await mount(t, '<vn-slider id="s" min="0" max="1" step="0.1" value="0.3"></vn-slider>');
  const box = await page.locator('#s .track').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, y, { steps: 4 });
  await page.mouse.up();
  const state = await sliderState(page);
  assert.equal(state.now, '0.9');
  assert.match(state.events, /^(s:input )+s:change$/);
  await page.evaluate(() => (document.getElementById('s').value = '0.30000000000000004'));
  assert.equal((await sliderState(page)).now, '0.3');
});
