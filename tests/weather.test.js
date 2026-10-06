// 天气粒子的纯逻辑测试（Node）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WeatherField, particleCount } from '../src/effects/weather.js';

test('粒子数随面积与密度变化，且有上限', () => {
  assert.equal(particleCount(0, 100), 0);
  assert.equal(particleCount(900, 100, 1), 10);
  assert.equal(particleCount(900, 100, 2), 20);
  assert.equal(particleCount(900, 100, 0), 0);
  assert.equal(particleCount(4000, 4000, 3), 260);
});

test('切换天气重新生成，尺寸变化时增减粒子', () => {
  const field = new WeatherField();
  field.configure({ kind: 'snow', width: 900, height: 300 });
  assert.equal(field.particles.length, 30);
  const first = field.particles[0];
  field.configure({ width: 900, height: 600 });
  assert.equal(field.particles.length, 60);
  assert.equal(field.particles[0], first, '尺寸变化保留已有粒子');
  field.configure({ kind: 'blossom' });
  assert.notEqual(field.particles[0], first, '换天气重新生成');
  field.configure({ kind: 'none' });
  assert.equal(field.particles.length, 0);
});

for (const kind of ['snow', 'blossom', 'wind', 'rain']) {
  test(`${kind}：推进后粒子移动，长时间后仍都在可视范围附近`, () => {
    const field = new WeatherField();
    field.configure({ kind, width: 600, height: 400, density: 1.5 });
    const before = field.particles.map((p) => [p.x, p.y]);
    field.step(0.1);
    assert.ok(field.particles.some((p, i) => p.x !== before[i][0] || p.y !== before[i][1]), '粒子在移动');
    for (let i = 0; i < 2000; i++) field.step(1 / 30);
    for (const p of field.particles) {
      assert.ok(p.x > -120 && p.x < 720, `x 越界：${p.x}`);
      assert.ok(p.y > -60 && p.y < 460, `y 越界：${p.y}`);
    }
  });
}
