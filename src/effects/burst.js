/**
 * 点击效果：墨晕、落花、飞雪、风叶（设计见 docs/rfc/0003-effects.md）
 *
 *   burst('blossom', layer, { x, y, animate: this.animate.bind(this) })
 *
 * 粒子是插入 layer 的绝对定位 <span>，颜色写成 var(--vn-*)，因此自动取当前主题的颜色。
 * 每个粒子动画结束或被取消时移除自身。
 */

const reducedMotion =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export const BURSTS = ['ink', 'blossom', 'snow', 'wind'];

const rand = (min, max) => min + Math.random() * (max - min);

/** 樱花瓣：顶部带缺口，12 × 14 */
const PETAL = "path('M6 2.2L4.7 0.5C1.8 0.3 0 3.4 0.5 6.9C1 10.6 3.9 13.4 6 14C8.1 13.4 11 10.6 11.5 6.9C12 3.4 10.2 0.3 7.3 0.5Z')";

/** 读取主题里的时长令牌（如 900ms），读不到时用默认值 */
function tokenDuration(layer, name, fallback) {
  const raw = getComputedStyle(layer).getPropertyValue(`--vn-duration-${name}`).trim();
  const value = parseFloat(raw);
  if (!raw || Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

function particle(layer, styles) {
  const el = document.createElement('span');
  el.setAttribute('aria-hidden', 'true');
  el.dataset.vnBurst = '';
  Object.assign(el.style, { position: 'absolute', pointerEvents: 'none', willChange: 'transform, opacity' }, styles);
  layer.append(el);
  return el;
}

/** 播放动画，结束或被取消后移除节点 */
function play(el, keyframes, timing, animate) {
  const animation = animate(el, keyframes, { fill: 'both', ...timing });
  return animation.finished.then(
    () => el.remove(),
    () => el.remove(),
  );
}

function ink(layer, { x, y, width, height, animate }) {
  // 按钮这样的小容器：晕满整个容器；大画面：最多晕开 140px，像一滴墨而不是整片变暗
  const radius = Math.min(Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * 1.1, 140);
  const size = radius * 2;
  const el = particle(layer, {
    left: `${x - radius}px`,
    top: `${y - radius}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background:
      'radial-gradient(closest-side, var(--vn-burst-ink, currentColor) 30%, color-mix(in srgb, var(--vn-burst-ink, currentColor) 55%, transparent) 70%, transparent)',
    filter: 'blur(2px)',
  });
  if (reducedMotion?.matches) {
    // 保留“按下了”的反馈，但不晕开
    return [play(el, [{ opacity: 0 }, { opacity: 0.12 }, { opacity: 0 }], { duration: 240 }, animate)];
  }
  return [
    play(
      el,
      [
        { transform: 'scale(0)', opacity: 0.34 },
        { transform: 'scale(0.55)', opacity: 0.24, offset: 0.3 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration: tokenDuration(layer, 'ink', 900), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      animate,
    ),
  ];
}

function blossom(layer, { x, y, count = 12, animate }) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const scale = rand(0.7, 1.15);
    const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05); // 主要向上迸出
    const distance = rand(28, 72);
    const bx = Math.cos(angle) * distance;
    const by = Math.sin(angle) * distance;
    const sway = rand(-34, 34);
    const fall = rand(70, 130);
    const r0 = rand(0, 360);
    const spin = rand(180, 520) * (Math.random() < 0.5 ? -1 : 1);
    const el = particle(layer, {
      left: `${x - 6}px`,
      top: `${y - 7}px`,
      width: '12px',
      height: '14px',
      background:
        Math.random() < 0.35
          ? 'var(--vn-blossom-deep)'
          : 'radial-gradient(circle at 50% 85%, var(--vn-blossom-deep), var(--vn-blossom) 70%)',
      clipPath: PETAL,
    });
    jobs.push(
      play(
        el,
        [
          { transform: `translate(0, 0) rotate(${r0}deg) rotateY(0deg) scale(${scale * 0.3})`, opacity: 0 },
          {
            transform: `translate(${bx}px, ${by}px) rotate(${r0 + spin * 0.15}deg) rotateY(70deg) scale(${scale})`,
            opacity: 1,
            offset: 0.18,
            easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
          },
          {
            transform: `translate(${bx + sway}px, ${by + fall * 0.5}px) rotate(${r0 + spin * 0.55}deg) rotateY(220deg) scale(${scale})`,
            opacity: 0.95,
            offset: 0.58,
            easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
          },
          {
            transform: `translate(${bx - sway * 0.4}px, ${by + fall}px) rotate(${r0 + spin}deg) rotateY(360deg) scale(${scale * 0.9})`,
            opacity: 0,
          },
        ],
        { duration: rand(1400, 2200), delay: rand(0, 90), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        animate,
      ),
    );
  }
  return jobs;
}

function snow(layer, { x, y, count = 16, animate }) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const size = rand(2, 5);
    const angle = rand(0, Math.PI * 2);
    const distance = rand(14, 46);
    const bx = Math.cos(angle) * distance;
    const by = Math.sin(angle) * distance * 0.6 - 8;
    const fall = rand(36, 84);
    const sway = rand(-16, 16);
    const el = particle(layer, {
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'var(--vn-snow)',
      boxShadow: '0 0 4px var(--vn-snow), 0 0 0 0.5px color-mix(in srgb, var(--vn-info) 35%, transparent)',
    });
    jobs.push(
      play(
        el,
        [
          { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
          { transform: `translate(${bx}px, ${by}px) scale(1)`, opacity: 0.95, offset: 0.22, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
          { transform: `translate(${bx + sway}px, ${by + fall * 0.55}px) scale(1)`, opacity: 0.85, offset: 0.62, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
          { transform: `translate(${bx - sway * 0.5}px, ${by + fall}px) scale(0.8)`, opacity: 0 },
        ],
        { duration: rand(1600, 2600), delay: rand(0, 120), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        animate,
      ),
    );
  }
  return jobs;
}

function wind(layer, { x, y, count = 7, direction = 1, animate }) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const length = rand(11, 17);
    const dx = rand(90, 170) * direction;
    const dy = rand(-34, 18);
    const lift = rand(8, 18);
    const r0 = rand(-30, 30) + (direction < 0 ? 180 : 0);
    const turn = rand(120, 300) * direction;
    const el = particle(layer, {
      left: `${x - length / 2}px`,
      top: `${y - 2.5}px`,
      width: `${length}px`,
      height: '5px',
      borderRadius: '100% 0',
      background: 'var(--vn-wind)',
    });
    jobs.push(
      play(
        el,
        [
          { transform: `translate(0, 0) rotate(${r0}deg) scale(0.5)`, opacity: 0 },
          { transform: `translate(${dx * 0.25}px, ${dy * 0.5 - lift}px) rotate(${r0 + turn * 0.25}deg) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx * 0.65}px, ${dy - lift * 0.4}px) rotate(${r0 + turn * 0.6}deg) scale(1)`, opacity: 0.9, offset: 0.6 },
          { transform: `translate(${dx}px, ${dy + lift * 0.6}px) rotate(${r0 + turn}deg) scale(0.9)`, opacity: 0 },
        ],
        { duration: rand(900, 1400), delay: rand(0, 120), easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
        animate,
      ),
    );
  }
  // 风痕：几道很淡的横线一掠而过
  for (let i = 0; i < 3; i++) {
    const length = rand(36, 64);
    const el = particle(layer, {
      left: `${x - length / 2}px`,
      top: `${y + rand(-14, 14)}px`,
      width: `${length}px`,
      height: '1.5px',
      borderRadius: '2px',
      background: `linear-gradient(${direction > 0 ? 90 : 270}deg, transparent, var(--vn-wind), transparent)`,
      transformOrigin: direction > 0 ? 'left center' : 'right center',
    });
    jobs.push(
      play(
        el,
        [
          { transform: 'translateX(0) scaleX(0.3)', opacity: 0 },
          { transform: `translateX(${50 * direction}px) scaleX(1)`, opacity: 0.6, offset: 0.4 },
          { transform: `translateX(${130 * direction}px) scaleX(0.5)`, opacity: 0 },
        ],
        { duration: rand(600, 850), delay: rand(0, 160), easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
        animate,
      ),
    );
  }
  return jobs;
}

const EFFECTS = { ink, blossom, snow, wind };

/**
 * 在 layer 中播放一次点击效果
 * @param {'ink' | 'blossom' | 'snow' | 'wind'} kind
 * @param {HTMLElement} layer 定位元素
 * @param {{ x?: number, y?: number, count?: number, direction?: 1 | -1,
 *   animate?: (el: Element, keyframes: Keyframe[], timing: KeyframeAnimationOptions) => Animation }} [options]
 * @returns {Promise<void>} 所有粒子结束并移除后完成
 */
export function burst(kind, layer, options = {}) {
  const effect = EFFECTS[kind];
  if (!effect) throw new Error(`[Vunio] 未知的效果 "${kind}"，可选：${BURSTS.join(' | ')}`);
  // 粒子效果在“减少动态效果”时完全不播放；墨晕保留一次轻微反馈
  if (kind !== 'ink' && reducedMotion?.matches) return Promise.resolve();

  const { width, height } = layer.getBoundingClientRect();
  const animate = options.animate ?? ((el, keyframes, timing) => el.animate(keyframes, timing));
  const jobs = effect(layer, {
    ...options,
    x: options.x ?? width / 2,
    y: options.y ?? height / 2,
    width,
    height,
    animate,
  });
  return Promise.all(jobs).then(() => undefined);
}
