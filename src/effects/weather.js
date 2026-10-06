/**
 * 天气粒子：雪、花、风（设计见 docs/rfc/0003-effects.md）
 *
 * 只有数据和绘制，不涉及 DOM 和动画循环，可在 Node 中测试。
 * 每种天气是一组纯函数：spawn 生成、step 推进、draw 绘制。
 */

export const WEATHERS = ['snow', 'blossom', 'wind', 'none'];

const TAU = Math.PI * 2;
const MAX_PARTICLES = 260;
const rand = (min, max) => min + Math.random() * (max - min);

/** 粒子数：面积 / 9000 × 密度，最多 260 */
export function particleCount(width, height, density = 1) {
  if (width <= 0 || height <= 0 || density <= 0) return 0;
  return Math.min(MAX_PARTICLES, Math.round(((width * height) / 9000) * density));
}

/** 樱花瓣（以中心为原点，约 12 × 14） */
const PETAL_PATH = 'M0 -4.8L-1.3 -6.5C-4.2 -6.7 -6 -3.6 -5.5 -0.1C-5 3.6 -2.1 6.4 0 7C2.1 6.4 5 3.6 5.5 -0.1C6 -3.6 4.2 -6.7 1.3 -6.5Z';
let petalPath = null;

const kinds = {
  snow: {
    spawn(p, w, h, scatter) {
      p.depth = Math.random(); // 0 远 … 1 近
      p.r = 0.8 + p.depth * 2.4;
      p.x = rand(0, w);
      p.y = scatter ? rand(0, h) : rand(-24, -4);
      p.vy = 16 + p.depth * 44;
      p.phase = rand(0, TAU);
      p.sway = rand(6, 18);
      p.alpha = 0.35 + p.depth * 0.6;
    },
    step(p, dt, env) {
      p.phase += dt * 0.9;
      p.y += p.vy * dt;
      p.x += (Math.sin(p.phase) * p.sway * 0.6 + env.wind * 40 * (0.4 + p.depth)) * dt;
    },
    draw(ctx, p, colors) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = colors.snow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    },
  },

  blossom: {
    spawn(p, w, h, scatter) {
      p.depth = Math.random();
      p.size = 0.45 + p.depth * 0.55;
      p.x = rand(-20, w);
      p.y = scatter ? rand(0, h) : rand(-30, -8);
      p.vy = 22 + p.depth * 34;
      p.vx = rand(6, 18);
      p.angle = rand(0, TAU);
      p.spin = rand(-1.6, 1.6);
      p.flip = rand(0, TAU);
      p.flipSpeed = rand(1.2, 3);
      p.deep = Math.random() < 0.3;
      p.alpha = 0.55 + p.depth * 0.4;
    },
    step(p, dt, env) {
      p.angle += p.spin * dt;
      p.flip += p.flipSpeed * dt;
      p.y += p.vy * dt;
      p.x += (p.vx + env.wind * 50 + Math.sin(p.flip * 0.5) * 10) * dt;
    },
    draw(ctx, p, colors) {
      petalPath ??= new Path2D(PETAL_PATH);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      // 横向缩放模拟花瓣翻面
      ctx.scale(p.size * (0.25 + 0.75 * Math.abs(Math.cos(p.flip))), p.size);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.deep ? colors.blossomDeep : colors.blossom;
      ctx.fill(petalPath);
      ctx.restore();
    },
  },

  wind: {
    spawn(p, w, h, scatter) {
      p.streak = Math.random() < 0.22;
      p.depth = Math.random();
      p.x = scatter ? rand(0, w) : rand(-60, -20);
      p.y = rand(0, h);
      p.vx = (p.streak ? 220 : 90) + p.depth * 120;
      p.phase = rand(0, TAU);
      p.bob = rand(8, 22);
      p.length = p.streak ? rand(40, 90) : 6 + p.depth * 6;
      p.angle = rand(-0.4, 0.4);
      p.spin = rand(-3, 3);
      p.alpha = p.streak ? 0.12 + p.depth * 0.18 : 0.45 + p.depth * 0.45;
    },
    step(p, dt, env) {
      const push = env.gust * (1 + Math.max(0, env.wind));
      p.phase += dt * 2;
      p.x += p.vx * push * dt;
      p.y += Math.sin(p.phase) * p.bob * dt;
      if (!p.streak) p.angle += p.spin * dt;
    },
    draw(ctx, p, colors) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.alpha;
      if (p.streak) {
        ctx.strokeStyle = colors.wind;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.length / 2, 0);
        ctx.quadraticCurveTo(0, -3, p.length / 2, 0);
        ctx.stroke();
      } else {
        // 两头尖的竹叶
        const half = p.length;
        const width = half * 0.26;
        ctx.rotate(p.angle);
        ctx.fillStyle = colors.wind;
        ctx.beginPath();
        ctx.moveTo(-half, 0);
        ctx.quadraticCurveTo(0, -width, half, 0);
        ctx.quadraticCurveTo(0, width, -half, 0);
        ctx.fill();
      }
      ctx.restore();
    },
  },
};

/** 一片天气：保存粒子并负责推进、绘制 */
export class WeatherField {
  constructor() {
    /** @type {'snow' | 'blossom' | 'wind' | 'none'} */
    this.kind = 'none';
    this.width = 0;
    this.height = 0;
    this.density = 1;
    this.wind = 0;
    this.time = 0;
    /** @type {any[]} */
    this.particles = [];
  }

  /** 更新配置；天气种类变了就重新生成，数量变了就增减 */
  configure({ kind = this.kind, width = this.width, height = this.height, density = this.density, wind = this.wind } = {}) {
    const kindChanged = kind !== this.kind;
    Object.assign(this, { kind, width, height, density, wind });
    const behavior = kinds[kind];
    if (!behavior) {
      this.particles = [];
      return;
    }
    if (kindChanged) this.particles = [];
    const target = particleCount(width, height, density);
    while (this.particles.length < target) {
      const p = {};
      behavior.spawn(p, width, height, true);
      this.particles.push(p);
    }
    this.particles.length = target;
  }

  /** 推进 dt 秒；出界的粒子从另一侧重新出现 */
  step(dt) {
    const behavior = kinds[this.kind];
    if (!behavior) return;
    this.time += dt;
    // 阵风：缓慢起伏，偶尔明显加速
    const gust = 1 + 0.7 * Math.max(0, Math.sin(this.time * 0.35)) ** 3;
    const env = { wind: this.wind, gust };
    const { width: w, height: h } = this;
    for (const p of this.particles) {
      behavior.step(p, dt, env);
      if (this.kind === 'wind') {
        if (p.x > w + 80) behavior.spawn(p, w, h, false);
      } else if (p.y > h + 24) {
        behavior.spawn(p, w, h, false);
      } else if (p.x > w + 30) {
        p.x = -20;
      } else if (p.x < -30) {
        p.x = w + 20;
      }
    }
  }

  /** 清空画布并绘制所有粒子 */
  draw(ctx, colors) {
    ctx.clearRect(0, 0, this.width, this.height);
    const behavior = kinds[this.kind];
    if (!behavior) return;
    for (const p of this.particles) behavior.draw(ctx, p, colors);
    ctx.globalAlpha = 1;
  }
}
