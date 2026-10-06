// 示例应用「诗笺」的端到端测试（examples/app）：路由、全局状态、表单、组件一起工作
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();

async function app(t, hash = '/') {
  const ctx = await open(t, { path: `examples/app/#${hash}` });
  await ctx.page.waitForSelector('[data-vn-outlet] h1, [data-vn-outlet] vn-heading');
  return ctx;
}

const titles = (page) => page.$$eval('.poem-card h2', (els) => els.map((el) => el.textContent.trim()));

test('列表：每页 6 首；边输入边搜索，地址栏同步，焦点留在搜索框；按标签筛选；翻页', async (t) => {
  const { page } = await app(t);
  assert.equal((await titles(page)).length, 6);
  assert.match(await page.textContent('.count'), /共 18 首/);

  const search = page.locator('vn-input input');
  await search.pressSequentially('明月');
  await page.waitForTimeout(50);
  assert.deepEqual(await titles(page), ['静夜思', '水调歌头·明月几时有']);
  assert.equal(await page.evaluate(() => decodeURIComponent(location.hash)), '#/?q=明月');
  assert.equal(await page.evaluate(() => document.activeElement.localName), 'vn-input', '输入时焦点没有被抢走');

  await search.fill('');
  await page.getByRole('button', { name: '山', exact: true }).click();
  assert.deepEqual(await titles(page), ['山行', '鹿柴', '题西林壁', '望庐山瀑布']);
  await page.getByRole('button', { name: '山', exact: true }).click();

  await page.locator('vn-pagination').getByRole('button', { name: '第 3 页' }).click();
  await page.waitForTimeout(50);
  assert.deepEqual(await titles(page), ['游子吟', '望庐山瀑布', '早发白帝城', '江南春', '元日', '清明']);
  assert.match(await page.evaluate(() => location.hash), /page=3/);
});

test('列表：没有结果时显示空状态，“清除条件”恢复全部', async (t) => {
  const { page } = await app(t, '/?q=不存在的诗');
  assert.match(await page.textContent('.empty'), /没有找到/);
  await page.getByRole('button', { name: '清除条件' }).click();
  assert.equal((await titles(page)).length, 6);
});

test('收藏：卡片上的 ☆ 切换收藏，导航上的数字随之变化；收藏页列出；刷新后仍在', async (t) => {
  const { page } = await app(t);
  await page.getByRole('button', { name: '收藏《春晓》' }).click();
  await page.getByRole('button', { name: '收藏《江雪》' }).click();
  assert.equal(await page.textContent('.nav vn-tag'), '2');
  assert.equal(await page.getAttribute('.poem-card:nth-child(2) .fav', 'aria-pressed'), 'true');
  await page.getByRole('link', { name: /收藏/ }).click();
  await page.waitForSelector('h1:text("收藏")');
  assert.deepEqual(await titles(page), ['春晓', '江雪']);
  await page.reload();
  await page.waitForSelector('.poem-card');
  assert.deepEqual(await titles(page), ['春晓', '江雪']);
});

test('新建：填写表单后收入诗笺，跳到这首诗；必填项没填时提示', async (t) => {
  const { page } = await app(t, '/new');
  await page.getByRole('button', { name: '收入诗笺' }).click();
  assert.match(await page.evaluate(() => document.querySelector('vn-input[name=title]').validationMessage), /必填/);
  assert.match(await page.evaluate(() => location.hash), /#\/new/, '没填完不跳转');

  await page.locator('vn-input[name=title] input').fill('登高');
  await page.locator('vn-input[name=author] input').fill('杜甫');
  await page.locator('vn-radio[value=诗]').click();
  await page.locator('vn-input[name=tags] input').fill('秋，登高 重阳');
  await page.locator('vn-textarea[name=text] textarea').fill('风急天高猿啸哀，渚清沙白鸟飞回。\n无边落木萧萧下，不尽长江滚滚来。');
  await page.getByRole('button', { name: '收入诗笺' }).click();
  await page.waitForSelector('vn-heading');
  assert.equal(await page.evaluate(() => location.hash), '#/poem/19');
  assert.equal((await page.textContent('vn-heading')).trim(), '登高');
  const tags = await page.$$eval('.tags vn-tag', (els) => els.map((el) => el.textContent));
  assert.deepEqual(tags, ['秋', '登高', '重阳']);
  await page.getByRole('link', { name: '诗作' }).first().click();
  await page.waitForSelector('.poem-card');
  assert.equal((await titles(page))[0], '登高', '新诗在最前');
});

test('修改与删除：保存修改；删除前确认，取消则保留，确认后回到列表', async (t) => {
  const { page } = await app(t, '/poem/2');
  await page.locator('vn-button', { hasText: '修改' }).click();
  await page.waitForSelector('form.editor');
  await page.locator('vn-input[name=title] input').fill('春晓（孟浩然）');
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForSelector('vn-heading');
  assert.equal((await page.textContent('vn-heading')).trim(), '春晓（孟浩然）');

  await page.locator('vn-button', { hasText: '删除' }).click();
  await page.waitForSelector('vn-modal');
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await page.waitForSelector('vn-modal', { state: 'detached' });
  assert.equal(await page.evaluate(() => location.hash), '#/poem/2', '取消后还在这首诗');

  await page.locator('vn-button', { hasText: '删除' }).click();
  await page.locator('vn-modal vn-button', { hasText: '删除' }).click();
  await page.waitForSelector('.poem-card');
  assert.equal(await page.evaluate(() => location.hash), '#/');
  assert.ok(!(await titles(page)).some((title) => title.startsWith('春晓')));
  assert.match(await page.textContent('.count'), /共 17 首/);
});

test('设置：切换主题换掉样式表；正文字号随滑块变化', async (t) => {
  const { page } = await app(t, '/settings');
  await page.locator('vn-radio[value=cyber]').click();
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--vn-effect').trim() === 'glitch');
  assert.match(await page.getAttribute('#vn-theme', 'href'), /cyber\.css$/);
  await page.locator('vn-slider [role=slider]').focus();
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--app-poem-scale')), '1.6');
});
