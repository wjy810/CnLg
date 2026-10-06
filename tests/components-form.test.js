// 表单类组件：input / checkbox / switch / select（docs/rfc/0004-components.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

async function mount(t, markup, options = {}) {
  const ctx = await open(t, { path: PAGE, ...options });
  await ctx.page.evaluate(async (markup) => {
    await import('/src/components/index.js');
    document.body.insertAdjacentHTML('beforeend', `<form id="f" style="padding: 40px">${markup}<button id="native-submit">提交</button></form>`);
    window.formData = () => Object.fromEntries(new FormData(document.getElementById('f')));
    await new Promise((r) => requestAnimationFrame(r));
  }, markup);
  return ctx;
}

const message = (page, selector) =>
  page.evaluate((s) => document.querySelector(s).root.querySelector('.message').textContent.replace(/\s+/g, ' ').trim(), selector);

test('vn-input：进入 FormData；程序赋值同步到界面；reset 恢复默认值', async (t) => {
  const { page } = await mount(t, '<vn-input name="title" label="题目" value="水调歌头"></vn-input>');
  assert.deepEqual(await page.evaluate(() => window.formData()), { title: '水调歌头' });
  await page.locator('vn-input input').fill('赤壁赋');
  assert.deepEqual(await page.evaluate(() => window.formData()), { title: '赤壁赋' });
  const synced = await page.evaluate(() => {
    const el = document.querySelector('vn-input');
    el.value = '念奴娇';
    return el.root.querySelector('input').value;
  });
  assert.equal(synced, '念奴娇');
  await page.evaluate(() => document.getElementById('f').reset());
  assert.equal(await page.locator('vn-input input').inputValue(), '水调歌头');
});

test('vn-input：校验信息为中文，只在交互后显示', async (t) => {
  const { page } = await mount(
    t,
    `<vn-input id="req" name="a" label="必填" required hint="帮助"></vn-input>
     <vn-input id="len" name="b" minlength="5" maxlength="10"></vn-input>
     <vn-input id="mail" name="c" type="email"></vn-input>
     <vn-input id="pat" name="d" pattern="[0-9]+"></vn-input>`,
  );
  assert.equal(await message(page, '#req'), '帮助', '未交互前显示帮助文字');
  await page.locator('#req input').focus();
  await page.locator('#len input').focus();
  assert.equal(await message(page, '#req'), '此项为必填');
  await page.locator('#len input').fill('明月');
  await page.locator('#mail input').fill('libai');
  await page.locator('#pat input').fill('abc');
  await page.locator('#native-submit').focus();
  assert.equal(await message(page, '#len'), '至少需要 5 个字 2 / 10');
  assert.equal(await message(page, '#mail'), '请输入有效的邮箱地址');
  assert.equal(await message(page, '#pat'), '格式不正确');
  await page.locator('#mail input').fill('libai@tang.cn');
  assert.equal(await message(page, '#mail'), '');
  const star = await page.evaluate(() => !!document.getElementById('req').root.querySelector('.required'));
  assert.equal(star, true, '必填项显示星号');
});

test('vn-input：clearable 清空并派发 input / change；fieldset 禁用时不提交', async (t) => {
  const { page } = await mount(t, '<fieldset id="fs"><vn-input name="a" value="风" clearable></vn-input></fieldset>');
  const events = await page.evaluate(() => {
    const el = document.querySelector('vn-input');
    const log = [];
    el.addEventListener('input', () => log.push('input'));
    el.addEventListener('change', () => log.push('change'));
    el.root.querySelector('.clear').click();
    return { log, value: el.value, clearGone: !el.root.querySelector('.clear') };
  });
  assert.deepEqual(events, { log: ['input', 'change'], value: '', clearGone: true });
  const disabled = await page.evaluate(async () => {
    document.querySelector('vn-input').value = '花';
    document.getElementById('fs').disabled = true;
    await new Promise((r) => setTimeout(r));
    return { data: window.formData(), input: document.querySelector('vn-input').root.querySelector('input').disabled };
  });
  assert.deepEqual(disabled, { data: {}, input: true });
});

for (const tag of ['vn-checkbox', 'vn-switch']) {
  test(`${tag}：点击和空格切换；选中时提交 value；reset 恢复默认；required 校验`, async (t) => {
    const { page } = await mount(
      t,
      `<${tag} id="a" name="agree" required>同意</${tag}><${tag} id="b" name="notify" value="yes" checked>提醒</${tag}>`,
    );
    const role = tag === 'vn-checkbox' ? 'checkbox' : 'switch';
    const control = (id) => page.locator(`#${id}`).locator(`[role=${role}]`);
    assert.deepEqual(await page.evaluate(() => window.formData()), { notify: 'yes' });
    assert.equal(await control('a').getAttribute('aria-checked'), 'false');
    assert.equal(await page.evaluate(() => document.getElementById('a').checkValidity()), false);

    await control('a').click();
    await control('b').focus();
    await page.keyboard.press(' ');
    assert.equal(await control('a').getAttribute('aria-checked'), 'true');
    assert.deepEqual(await page.evaluate(() => window.formData()), { agree: 'on' });
    assert.equal(await page.evaluate(() => document.getElementById('a').checkValidity()), true);

    await page.evaluate(() => document.getElementById('f').reset());
    assert.deepEqual(await page.evaluate(() => window.formData()), { notify: 'yes' });
    assert.equal(await page.evaluate(() => document.getElementById('b').hasAttribute('checked')), true);
  });
}

test('vn-checkbox：禁用时不能切换且不可聚焦', async (t) => {
  const { page } = await mount(t, '<vn-checkbox id="d" disabled>禁</vn-checkbox>');
  const result = await page.evaluate(() => {
    const el = document.getElementById('d');
    const control = el.root.querySelector('[role=checkbox]');
    control.click();
    return { checked: el.checked, tabindex: control.getAttribute('tabindex'), ariaDisabled: control.getAttribute('aria-disabled') };
  });
  assert.deepEqual(result, { checked: false, tabindex: '-1', ariaDisabled: 'true' });
});

const SELECT = `<vn-select id="s" name="season" label="时节" required>
  <option value="spring">春</option>
  <option value="summer" disabled>夏</option>
  <option value="autumn">秋</option>
  <option value="winter">冬</option>
</vn-select>`;

const selectState = (page) =>
  page.evaluate(() => {
    const el = document.getElementById('s');
    const trigger = el.root.querySelector('[role=combobox]');
    return {
      value: el.value,
      expanded: trigger.getAttribute('aria-expanded'),
      active: trigger.getAttribute('aria-activedescendant'),
      label: el.root.querySelector('.value').textContent.trim(),
      panelVisible: getComputedStyle(el.root.querySelector('[role=listbox]')).display !== 'none',
    };
  });

test('vn-select：键盘打开、跳过禁用项、Enter 选择、Esc 关闭', async (t) => {
  const { page } = await mount(t, SELECT);
  assert.deepEqual(await selectState(page), { value: '', expanded: 'false', active: null, label: '请选择', panelVisible: false });
  await page.locator('#s [role=combobox]').focus();
  await page.keyboard.press('ArrowDown');
  assert.deepEqual(await selectState(page), { value: '', expanded: 'true', active: 'option-0', label: '请选择', panelVisible: true });
  await page.keyboard.press('ArrowDown');
  assert.equal((await selectState(page)).active, 'option-2', '跳过禁用的“夏”');
  await page.keyboard.press('End');
  assert.equal((await selectState(page)).active, 'option-3');
  await page.keyboard.press('Enter');
  assert.deepEqual(await selectState(page), { value: 'winter', expanded: 'false', active: null, label: '冬', panelVisible: false });
  assert.deepEqual(await page.evaluate(() => window.formData()), { season: 'winter' });
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  assert.equal((await selectState(page)).expanded, 'false');
  assert.equal((await selectState(page)).value, 'winter', 'Esc 不改变选择');
});

test('vn-select：鼠标选择、点击外部关闭、首字跳转、选项变化自动同步', async (t) => {
  const { page } = await mount(t, SELECT);
  await page.locator('#s [role=combobox]').click();
  await page.locator('#s [role=option]', { hasText: '秋' }).click();
  assert.equal((await selectState(page)).value, 'autumn');
  await page.locator('#s [role=combobox]').click();
  await page.mouse.click(5, 5);
  assert.equal((await selectState(page)).expanded, 'false', '点击外部关闭');
  await page.locator('#s [role=option]', { hasText: '夏' }).click({ force: true }).catch(() => {});
  assert.equal((await selectState(page)).value, 'autumn', '禁用项不能选');
  const labels = await page.evaluate(async () => {
    const el = document.getElementById('s');
    el.insertAdjacentHTML('beforeend', '<option value="leap">闰</option>');
    el.querySelector('option[value="spring"]').textContent = '初春';
    await new Promise((r) => setTimeout(r));
    return el.options.value.map((o) => o.label);
  });
  assert.deepEqual(labels, ['初春', '夏', '秋', '冬', '闰']);
});

test('vn-select：输入首字母跳转（关闭时直接选择，打开时移动高亮）', async (t) => {
  const { page } = await mount(
    t,
    `<vn-select id="s" name="poet"><option value="li">Li Bai</option><option value="du">Du Fu</option><option value="wang">Wang Wei</option></vn-select>`,
  );
  await page.locator('#s [role=combobox]').focus();
  await page.keyboard.press('w');
  assert.equal((await selectState(page)).value, 'wang');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('d');
  assert.equal((await selectState(page)).active, 'option-1');
  await page.keyboard.press('Enter');
  assert.equal((await selectState(page)).value, 'du');
});

test('vn-select：带 selected 的选项作为初始值；required 校验；reset', async (t) => {
  const { page } = await mount(
    t,
    `<vn-select id="s" name="season" required><option value="a">甲</option><option value="b" selected>乙</option></vn-select>`,
  );
  assert.deepEqual(await page.evaluate(() => window.formData()), { season: 'b' });
  await page.evaluate(() => (document.getElementById('s').value = 'a'));
  await page.evaluate(() => document.getElementById('f').reset());
  assert.deepEqual(await page.evaluate(() => window.formData()), { season: 'b' });
  const empty = await page.evaluate(() => {
    const el = document.getElementById('s');
    el.value = '';
    return { valid: el.checkValidity(), message: el.validationMessage };
  });
  assert.deepEqual(empty, { valid: false, message: '请选择一项' });
});

test('vn-select：面板在顶层，不被 overflow: hidden 的祖先裁掉', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await page.evaluate(async () => {
    await import('/src/components/index.js');
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div style="overflow: hidden; height: 80px; padding: 10px"><vn-select id="s"><option value="1">一</option><option value="2">二</option><option value="3">三</option></vn-select></div>`,
    );
    await new Promise((r) => requestAnimationFrame(r));
  });
  await page.locator('#s [role=combobox]').click();
  const visible = await page.locator('#s [role=option]', { hasText: '三' }).isVisible();
  const box = await page.locator('#s [role=option]', { hasText: '三' }).boundingBox();
  assert.equal(visible, true);
  assert.ok(box.y > 90, '选项在被裁切区域之外仍可见');
  await page.locator('#s [role=option]', { hasText: '三' }).click();
  assert.equal(await page.evaluate(() => document.getElementById('s').value), '3');
});
