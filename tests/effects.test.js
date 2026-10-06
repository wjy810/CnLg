// 风花雪月效果的浏览器测试（docs/rfc/0003-effects.md 第 4 节）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();
const PAGE = 'tests/fixtures/theme.html';

async function setup(page) {
  await page.evaluate(async () => {
    await import('/src/components/index.js');
    const layer = document.createElement('div');
    layer.id = 'layer';
    layer.style.cssText = 'position: relative; width: 200px; height: 60px; margin: 40px;';
    document.body.append(layer);
  });
}

test('burst：四种效果都生成粒子，结束后全部移除，颜色来自主题', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  const result = await page.evaluate(async () => {
    const { burst } = window.vunio;
    const layer = document.getElementById('layer');
    const counts = {};
    const done = [];
    for (const kind of ['ink', 'blossom', 'snow', 'wind']) {
      const before = layer.childElementCount;
      done.push(burst(kind, layer, { x: 50, y: 30 }));
      counts[kind] = layer.childElementCount - before;
    }
    const petal = layer.querySelector('[data-vn-burst][style*="clip-path"]');
    const petalColor = petal.style.background;
    document.getAnimations().forEach((a) => a.finish());
    await Promise.all(done);
    return { counts, left: layer.childElementCount, petalColor };
  });
  assert.equal(result.counts.ink, 1);
  assert.equal(result.counts.blossom, 12);
  assert.equal(result.counts.snow, 16);
  assert.equal(result.counts.wind, 10, '7 片叶子 + 3 道风痕');
  assert.equal(result.left, 0);
  assert.match(result.petalColor, /var\(--vn-blossom/, '花瓣颜色引用主题令牌');
});

test('burst：使用传入的 animate，取消时同样移除节点；未知效果抛错', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  const result = await page.evaluate(async () => {
    const { burst } = window.vunio;
    const layer = document.getElementById('layer');
    let calls = 0;
    const animations = [];
    const promise = burst('snow', layer, {
      count: 3,
      animate: (el, keyframes, timing) => {
        calls++;
        const a = el.animate(keyframes, timing);
        animations.push(a);
        return a;
      },
    });
    animations.forEach((a) => a.cancel());
    await promise;
    let error = '';
    try {
      burst('fire', layer);
    } catch (e) {
      error = e.message;
    }
    return { calls, left: layer.childElementCount, error };
  });
  assert.deepEqual(result, { calls: 3, left: 0, error: '[Vunio] 未知的效果 "fire"，可选：ink | blossom | snow | wind | glitch | spark' });
});

test('burst：减少动态效果时粒子效果不播放，墨晕只做轻微反馈', async (t) => {
  const { page } = await open(t, { path: PAGE, reducedMotion: 'reduce' });
  await setup(page);
  const counts = await page.evaluate(() => {
    const { burst } = window.vunio;
    const layer = document.getElementById('layer');
    const out = {};
    for (const kind of ['blossom', 'snow', 'wind', 'ink']) {
      const before = layer.childElementCount;
      burst(kind, layer);
      out[kind] = layer.childElementCount - before;
    }
    out.inkDuration = layer.querySelector('[data-vn-burst]').getAnimations()[0].effect.getTiming().duration;
    return out;
  });
  assert.deepEqual(counts, { blossom: 0, snow: 0, wind: 0, ink: 1, inkDuration: 240 });
});

const sky = (page, attrs = '') =>
  page.evaluate(async (attrs) => {
    await import('/src/components/index.js');
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div id="stage" style="position: relative; width: 300px; height: 180px"><vn-sky ${attrs}></vn-sky></div>`,
    );
    await new Promise((r) => setTimeout(r, 200));
  }, attrs);

const stats = (page) => page.evaluate(() => document.querySelector('vn-sky').stats);

test('vn-sky：画布按 DPR 缩放，循环运行，粒子数随密度变化', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await page.evaluate(() => Object.defineProperty(window, 'devicePixelRatio', { value: 2 }));
  await sky(page, 'weather="blossom" density="2" moon');
  const s1 = await stats(page);
  const canvas = await page.evaluate(() => {
    const c = document.querySelector('vn-sky').root.querySelector('canvas');
    return [c.width, c.height];
  });
  assert.deepEqual(canvas, [600, 360]);
  assert.equal(s1.kind, 'blossom');
  assert.equal(s1.particles, 12, '300×180/9000×2');
  assert.equal(s1.running, true);
  await page.waitForTimeout(200);
  assert.ok((await stats(page)).frames > s1.frames, '持续绘制');
  assert.equal(await page.evaluate(() => !!document.querySelector('vn-sky').root.querySelector('.moon')), true);
});

test('vn-sky：切换天气立即生效；none 时停止', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await sky(page);
  await page.evaluate(() => document.querySelector('vn-sky').setAttribute('weather', 'wind'));
  assert.equal((await stats(page)).kind, 'wind');
  await page.evaluate(() => document.querySelector('vn-sky').setAttribute('weather', 'none'));
  const s = await stats(page);
  assert.deepEqual([s.kind, s.particles, s.running], ['none', 0, false]);
});

test('vn-sky：离开视口时暂停，回来后恢复；移除后不再绘制', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await sky(page);
  assert.equal((await stats(page)).running, true);
  await page.evaluate(async () => {
    document.getElementById('stage').style.marginTop = '5000px';
    await new Promise((r) => setTimeout(r, 300));
  });
  assert.equal((await stats(page)).running, false, '不在视口中');
  await page.evaluate(async () => {
    document.getElementById('stage').scrollIntoView();
    await new Promise((r) => setTimeout(r, 300));
  });
  assert.equal((await stats(page)).running, true, '回到视口');
  const frames = await page.evaluate(async () => {
    const el = document.querySelector('vn-sky');
    window.removedSky = el;
    el.remove();
    const before = el.stats.frames;
    await new Promise((r) => setTimeout(r, 200));
    return [before, el.stats.frames, el.stats.running];
  });
  assert.equal(frames[0], frames[1], '移除后不再绘制');
  assert.equal(frames[2], false);
});

test('vn-sky：减少动态效果时只画一帧静止画面', async (t) => {
  const { page } = await open(t, { path: PAGE, reducedMotion: 'reduce' });
  await sky(page, 'weather="snow"');
  const first = await stats(page);
  await page.waitForTimeout(200);
  const later = await stats(page);
  assert.equal(first.running, false);
  assert.ok(first.frames >= 1, '画了静止的一帧');
  assert.equal(later.frames, first.frames, '之后不再重绘');
});

test('burst：赛博的故障与电火花生成粒子，结束后全部移除；减少动态效果时故障只闪一下', async (t) => {
  const { page } = await open(t, { path: PAGE });
  await setup(page);
  const result = await page.evaluate(async () => {
    const { burst, burstLayer } = window.vunio;
    const layer = document.getElementById('layer');
    const counts = {};
    const done = [];
    for (const kind of ['glitch', 'spark']) {
      const before = layer.childElementCount;
      done.push(burst(kind, layer, { x: 50, y: 30 }));
      counts[kind] = layer.childElementCount - before;
    }
    document.getAnimations().forEach((a) => a.finish());
    await Promise.all(done);
    return { counts, left: layer.childElementCount, layers: [burstLayer('glitch'), burstLayer('spark'), burstLayer('ink')] };
  });
  assert.deepEqual(result.counts, { glitch: 6, spark: 12 }, '故障：1 道闪光 + 5 条色带；电火花：8 道光 + 4 粒碎屑');
  assert.equal(result.left, 0);
  assert.deepEqual(result.layers, ['wash', 'fx', 'wash']);

  const { page: reduced } = await open(t, { path: PAGE, reducedMotion: 'reduce' });
  await setup(reduced);
  const counts = await reduced.evaluate(() => {
    const { burst } = window.vunio;
    const layer = document.getElementById('layer');
    burst('glitch', layer);
    const glitch = layer.childElementCount;
    burst('spark', layer);
    return { glitch, spark: layer.childElementCount - glitch };
  });
  assert.deepEqual(counts, { glitch: 1, spark: 0 });
});

test('vn-button：不写 effect 时由主题的 --vn-effect 决定；registerBurst 注册的效果可以直接使用', async (t) => {
  const { page, warnings } = await open(t, { path: PAGE, theme: 'guofeng' });
  await setup(page);
  const result = await page.evaluate(async () => {
    const { registerBurst } = window.vunio;
    registerBurst('dot', {
      layer: 'fx',
      run: (layer, ctx) => [ctx.play(ctx.particle({ left: `${ctx.x}px`, top: `${ctx.y}px`, width: '4px', height: '4px' }), [{ opacity: 1 }, { opacity: 0 }], { duration: 50 })],
    });
    document.body.insertAdjacentHTML(
      'beforeend',
      '<vn-button id="auto">默认</vn-button><vn-button id="themed" style="--vn-effect: spark">主题</vn-button><vn-button id="dot" effect="dot">自定义</vn-button><vn-button id="bad" effect="nope">未注册</vn-button>',
    );
    await new Promise((r) => requestAnimationFrame(r));
    const el = (id) => document.getElementById(id);
    const added = (id, ref) => {
      const before = el(id).refs[ref].childElementCount;
      el(id).refs.button.click();
      return el(id).refs[ref].childElementCount - before;
    };
    return {
      effects: ['auto', 'themed', 'dot'].map((id) => el(id).resolvedEffect),
      autoWash: added('auto', 'wash'),
      themedFx: added('themed', 'fx'),
      dotFx: added('dot', 'fx'),
      bad: (el('bad').refs.button.click(), el('bad').refs.fx.childElementCount + el('bad').refs.wash.childElementCount),
    };
  });
  assert.deepEqual(result.effects, ['ink', 'spark', 'dot']);
  assert.deepEqual([result.autoWash, result.themedFx, result.dotFx, result.bad], [1, 12, 1, 0]);
  assert.equal(warnings.filter((w) => w.includes('effect="nope"')).length, 1);
});
