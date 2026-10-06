/**
 * 赛博主题：霓虹、硬边、故障（docs/design/cyber.md）。
 *
 * 与古风用同一套组件、同一份契约（docs/rfc/0006-theme-contract.md），只换变量与少量 ::part() 调整。
 * 修改后运行 `npm run build:theme`。
 */
import { defineTheme, ref as c, svgUrl } from './base.js';

/** 原色：有名字的霓虹色与暗面。组件不直接使用，只通过语义令牌引用。 */
const palette = {
  // 暗面
  xuwu: { name: '虚无', hex: '#0A0B12', note: '夜：页面底色' },
  moye: { name: '墨夜', hex: '#12141F', note: '夜：卡片、浮层' },
  shenyuan: { name: '深渊', hex: '#1A1D2C', note: '夜：凹陷面、输入框' },
  gangtie: { name: '钢铁', hex: '#2A3048', note: '框体' },
  // 光
  guangbai: { name: '光白', hex: '#E6E8F2', note: '夜：正文' },
  xinghui: { name: '星灰', hex: '#9AA0B8', note: '夜：次要文字' },
  // 霓虹
  dianqing: { name: '电青', hex: '#00E5FF', note: '主操作、焦点、灯管' },
  meihong: { name: '霓虹品红', hex: '#FF2E88', note: '强调色块' },
  fenhong: { name: '荧粉', hex: '#FF5CA8', note: '夜：强调文字' },
  suanhuang: { name: '酸黄', hex: '#F5E400', note: '夜：提醒' },
  yinglv: { name: '荧绿', hex: '#2BFF88', note: '夜：成功' },
  jinghong: { name: '警红', hex: '#FF4D5E', note: '夜：错误' },
  tianlan: { name: '天蓝', hex: '#4DB8FF', note: '夜：信息' },
  // 昼
  lengbai: { name: '冷白', hex: '#EEF1F7', note: '昼：页面底色' },
  huabai: { name: '画白', hex: '#FFFFFF', note: '昼：卡片' },
  yinhui: { name: '银灰', hex: '#E2E6F0', note: '昼：凹陷面' },
  tanhei: { name: '碳黑', hex: '#0B0D17', note: '昼：正文、主按钮' },
  shenpin: { name: '深品红', hex: '#C00060', note: '昼：强调文字' },
};

/** 像素失真的印记：24×24 的方块上，随机（固定种子）挖掉一些 2×2 的像素 */
const pixelStamp = () => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let holes = '';
  for (let y = 0; y < 24; y += 2) for (let x = 0; x < 24; x += 2) if (random() < 0.12) holes += `M${x} ${y}h2v2h-2z`;
  return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path fill-rule='evenodd' d='M0 0h24v24H0z${holes}'/></svg>`);
};

export default defineTheme({
  name: 'cyber',
  label: '赛博',
  description: '霓虹、硬边、故障。深夜的城市，电青与品红的灯管，信号偶尔失真。',
  defaultMode: 'night',
  fontImport:
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=ZCOOL+QingKe+HuangYou&family=Chakra+Petch:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&family=Share+Tech+Mono&display=swap',
  fontNote: 'Orbitron + 站酷庆科黄油体：标题；Chakra Petch + 思源黑体：正文；Share Tech Mono：引文。',
  palette,

  modes: {
    night: {
      colors: {
        bg: c('xuwu'),
        surface: c('moye'),
        'surface-sunken': c('shenyuan'),
        fg: c('guangbai'),
        'fg-strong': '#FFFFFF',
        'fg-muted': c('xinghui'),
        'fg-subtle': '#5F6580',
        line: 'rgba(0, 229, 255, 0.16)',
        'line-strong': '#3E7C8C',
        primary: c('dianqing'),
        'on-primary': '#04060B',
        accent: c('meihong'),
        'on-accent': c('xuwu'),
        'accent-fg': c('fenhong'),
        'accent-wash': 'rgba(255, 46, 136, 0.14)',
        success: c('yinglv'),
        warning: c('suanhuang'),
        danger: c('jinghong'),
        info: c('tianlan'),
        focus: c('dianqing'),
        selection: 'rgba(0, 229, 255, 0.28)',
        overlay: 'rgba(2, 3, 8, 0.72)',
        frame: c('gangtie'),
        trim: c('dianqing'),
        blossom: c('fenhong'),
        'blossom-deep': c('meihong'),
        snow: '#9EF3FF',
        wind: '#7CFFCB',
        moon: '#FFD6F0',
        'night-sky': '#05060A',
      },
      shadows: {
        1: '0 0 0 1px rgba(0, 229, 255, 0.18)',
        2: '0 0 0 1px rgba(0, 229, 255, 0.28), 0 8px 24px -8px rgba(0, 229, 255, 0.35)',
        3: '0 0 0 1px rgba(255, 46, 136, 0.35), 0 24px 60px -16px rgba(255, 46, 136, 0.45)',
      },
      vars: { '--cyber-glow': 'rgba(255, 92, 168, 0.35)' },
      // 扫描线
      texture: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='6' height='6'><rect width='6' height='1' fill='rgb(0,229,255)' fill-opacity='0.05'/></svg>`),
    },
    day: {
      colors: {
        bg: c('lengbai'),
        surface: c('huabai'),
        'surface-sunken': c('yinhui'),
        fg: c('tanhei'),
        'fg-strong': '#000000',
        'fg-muted': '#4A5068',
        'fg-subtle': '#7A8099',
        line: 'rgba(11, 13, 23, 0.12)',
        'line-strong': '#6B7590',
        primary: c('tanhei'),
        'on-primary': c('dianqing'),
        accent: '#D4006A',
        'on-accent': '#FFFFFF',
        'accent-fg': c('shenpin'),
        'accent-wash': 'rgba(212, 0, 106, 0.08)',
        success: '#006B43',
        warning: '#725A00',
        danger: '#C8102E',
        info: '#0057B8',
        focus: '#0080A0',
        selection: 'rgba(0, 200, 230, 0.25)',
        overlay: 'rgba(11, 13, 23, 0.55)',
        frame: '#1B2033',
        trim: '#00B8D4',
        blossom: c('fenhong'),
        'blossom-deep': '#D4006A',
        snow: '#7FA3B8',
        wind: '#00A86B',
        moon: '#E9D7FF',
        'night-sky': '#121628',
      },
      shadows: {
        1: '0 1px 0 rgba(11, 13, 23, 0.08)',
        2: '0 0 0 1px rgba(11, 13, 23, 0.08), 0 10px 24px -12px rgba(0, 144, 168, 0.35)',
        3: '0 0 0 1px rgba(212, 0, 106, 0.2), 0 24px 56px -18px rgba(212, 0, 106, 0.35)',
      },
      vars: { '--cyber-glow': 'transparent' },
      // 蓝图网格
      texture: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M32 0H0V32' fill='none' stroke='rgb(11,13,23)' stroke-opacity='0.05'/></svg>`),
    },
  },

  scales: {
    font: {
      display: "'Orbitron', 'ZCOOL QingKe HuangYou', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      body: "'Chakra Petch', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      quote: "'Share Tech Mono', 'Noto Sans SC', ui-monospace, monospace",
      mono: "'Share Tech Mono', ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace",
    },
    radius: { none: '0', sm: '0', md: '2px', lg: '4px', full: '999px' },
    ease: {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      move: 'cubic-bezier(0.6, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
    },
    duration: { instant: '60ms', fast: '120ms', normal: '220ms', slow: '420ms', slower: '640ms' },
    tracking: { wide: '0.06em', wider: '0.14em', widest: '0.28em' },
  },

  easeNotes: {
    standard: '切换：利落，没有拖尾。用于大多数状态过渡',
    enter: '点亮：一瞬间亮起，随即稳定。用于出现、展开、点击反馈',
    move: '冲刺：加速冲出，急停。用于位移、滑动',
    spring: '电压不稳：过冲后回弹。用于完成、庆祝，少用',
  },

  masks: {
    /** 分段的数字线：一长三短 */
    stroke: svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'><path d='M0 2.5H128V5.5H0ZM134 2.5H164V5.5H134ZM170 2.5H184V5.5H170ZM190 2.5H200V5.5H190Z'/></svg>`,
    ),
    stamp: pixelStamp(),
  },

  effect: 'glitch',

  css: `
/* 卡片：左上、右下两个霓虹折角 */
vn-card:not([variant='plain'])::part(card) {
  background-image:
    linear-gradient(135deg, var(--vn-accent) 0 6px, transparent 6px),
    linear-gradient(315deg, var(--vn-trim) 0 6px, transparent 6px);
  background-position: top left, bottom right;
  background-size: 14px 14px;
  background-repeat: no-repeat;
}
/* 标题：夜里一圈淡淡的辉光（昼间 --cyber-glow 为透明） */
vn-heading::part(heading) {
  text-shadow: 0 0 18px var(--cyber-glow);
}
`,
});
