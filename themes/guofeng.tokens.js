/**
 * 古风主题：纸、墨、印、四时（docs/design/guofeng.md）。
 *
 * 修改后运行 `npm run build:theme`，会重新生成 themes/guofeng.css、guofeng-fonts.css
 * 和设计文档中的表格。测试会检查生成结果是否最新、契约是否完整、对比度是否达标。
 *
 * 色值参考中国传统色，并为屏幕显示和 WCAG 对比度做了校准。
 */
import { defineTheme, ref as c, svgUrl } from './base.js';

/** 原色：有名字的传统色。组件不直接使用，只通过下面的语义令牌引用。 */
const palette = {
  // 纸
  juanbai: { name: '绢白', hex: '#FBF8F2', note: '最亮的纸面：卡片、浮层' },
  xuanzhi: { name: '宣纸', hex: '#F4EEE2', note: '页面底色' },
  chabai: { name: '茶白', hex: '#EAE2D2', note: '凹陷面：输入框、悬停' },
  xiangse: { name: '缃色', hex: '#DCD1BC', note: '装饰线、分隔' },
  // 墨（墨分五色：焦、浓、重、淡、清）
  qingmo: { name: '清墨', hex: '#8A8276', note: '控件边框、次要图形' },
  danmo: { name: '淡墨', hex: '#6B645B', note: '次要文字' },
  zhongmo: { name: '重墨', hex: '#47423C', note: '强调的次要文字' },
  nongmo: { name: '浓墨', hex: '#2A2724', note: '正文' },
  jiaomo: { name: '焦墨', hex: '#1A1816', note: '最深的墨' },
  // 印与彩
  zhusha: { name: '朱砂', hex: '#B0382B', note: '印章、强调、主操作' },
  yanzhi: { name: '胭脂', hex: '#9A2A30', note: '危险、错误' },
  taoyao: { name: '桃夭', hex: '#E8A3AB', note: '花：装饰' },
  haitang: { name: '海棠', hex: '#C25565', note: '花：深' },
  zhuqing: { name: '竹青', hex: '#5E8A6E', note: '风：装饰' },
  qingci: { name: '青瓷', hex: '#3A6B57', note: '成功' },
  nijin: { name: '泥金', hex: '#7D5B1D', note: '提醒' },
  dailan: { name: '黛蓝', hex: '#3B5166', note: '信息' },
  yuebai: { name: '月白', hex: '#D6E3E8', note: '月：装饰' },
  shuang: { name: '霜', hex: '#EEF2F4', note: '雪：装饰' },
  // 夜
  xuanqing: { name: '玄青', hex: '#14171D', note: '夜：页面底色' },
  yese: { name: '夜色', hex: '#1C2028', note: '夜：卡片' },
  daihei: { name: '黛黑', hex: '#252A34', note: '夜：凹陷面' },
  yinhui: { name: '银灰', hex: '#A6A094', note: '夜：次要文字' },
  yueguang: { name: '月光', hex: '#ECE6D9', note: '夜：正文' },
  dan: { name: '丹', hex: '#E87A66', note: '夜：强调文字' },
  feise: { name: '绯', hex: '#F08A8E', note: '夜：危险' },
  bise: { name: '碧', hex: '#7FBFA5', note: '夜：成功' },
  jin: { name: '金', hex: '#D9B36A', note: '夜：提醒' },
  bilan: { name: '碧蓝', hex: '#8FB2D1', note: '夜：信息' },
};

/** 纸纹：低透明度的分形噪声 */
const paper = (tint, alpha) => {
  const [r, g, b] = tint.split(' ');
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${(alpha * 2).toFixed(3)} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );
};

export default defineTheme({
  name: 'guofeng',
  label: '古风',
  description: '纸、墨、印、四时。宣纸底色，墨分五色，一点朱砂。',
  defaultMode: 'day',
  fontImport: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600;700&display=swap',
  fontNote: '马善政毛笔楷书：标题；思源宋体：正文。',
  palette,

  modes: {
    day: {
      colors: {
        bg: c('xuanzhi'),
        surface: c('juanbai'),
        'surface-sunken': c('chabai'),
        fg: c('nongmo'),
        'fg-strong': c('jiaomo'),
        'fg-muted': c('danmo'),
        'fg-subtle': '#8C8478',
        line: 'rgba(42, 39, 36, 0.14)',
        'line-strong': c('qingmo'),
        primary: c('nongmo'),
        'on-primary': '#F7F1E6',
        accent: c('zhusha'),
        'on-accent': '#FBF5EC',
        'accent-fg': c('zhusha'),
        'accent-wash': 'rgba(176, 56, 43, 0.1)',
        success: c('qingci'),
        warning: c('nijin'),
        danger: c('yanzhi'),
        info: c('dailan'),
        focus: c('zhusha'),
        selection: 'rgba(176, 56, 43, 0.18)',
        overlay: 'rgba(26, 24, 22, 0.42)',
        frame: '#5A3E2B',
        trim: '#A88443',
        blossom: c('taoyao'),
        'blossom-deep': c('haitang'),
        snow: '#AFC0CB',
        wind: c('zhuqing'),
        moon: c('yuebai'),
        'night-sky': '#2C3A4B',
      },
      shadows: {
        1: '0 1px 2px rgba(70, 48, 26, 0.08)',
        2: '0 8px 20px -10px rgba(70, 48, 26, 0.28)',
        3: '0 22px 48px -18px rgba(70, 48, 26, 0.38)',
      },
      texture: paper('0.36 0.27 0.18', 0.055),
    },
    night: {
      colors: {
        bg: c('xuanqing'),
        surface: c('yese'),
        'surface-sunken': c('daihei'),
        fg: c('yueguang'),
        'fg-strong': '#F7F2E8',
        'fg-muted': c('yinhui'),
        'fg-subtle': '#6F6C66',
        line: 'rgba(236, 230, 217, 0.13)',
        'line-strong': '#7A766F',
        primary: c('yueguang'),
        'on-primary': c('xuanqing'),
        accent: '#B8473A',
        'on-accent': '#FFF4EC',
        'accent-fg': c('dan'),
        'accent-wash': 'rgba(232, 122, 102, 0.14)',
        success: c('bise'),
        warning: c('jin'),
        danger: c('feise'),
        info: c('bilan'),
        focus: c('dan'),
        selection: 'rgba(232, 122, 102, 0.28)',
        overlay: 'rgba(5, 6, 8, 0.6)',
        frame: '#6E4D36',
        trim: '#C9A15A',
        blossom: '#E39AA4',
        'blossom-deep': '#D46F7E',
        snow: c('shuang'),
        wind: '#8DB49A',
        moon: '#F3EBD3',
        'night-sky': '#0B0E13',
      },
      shadows: {
        1: '0 1px 2px rgba(0, 0, 0, 0.4)',
        2: '0 10px 24px -10px rgba(0, 0, 0, 0.6)',
        3: '0 24px 56px -16px rgba(0, 0, 0, 0.7)',
      },
      texture: paper('0.93 0.9 0.85', 0.03),
    },
  },

  scales: {
    font: {
      display: "'Ma Shan Zheng', 'STXingkai', 'Xingkai SC', 'STKaiti', 'KaiTi', serif",
      body: "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', 'SimSun', serif",
      quote: "'Kaiti SC', 'STKaiti', 'KaiTi', 'BiauKai', serif",
      mono: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace",
    },
    radius: { none: '0', sm: '2px', md: '4px', lg: '8px', full: '999px' },
    ease: {
      standard: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
      move: 'cubic-bezier(0.45, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.36, 0.64, 1)',
    },
    duration: { instant: '100ms', fast: '180ms', normal: '320ms', slow: '600ms', slower: '900ms' },
  },

  easeNotes: {
    standard: '运笔：起笔利落，收笔稳。用于大多数状态过渡',
    enter: '墨晕：落墨即散，越散越慢。用于点击反馈、展开、出现',
    move: '风过：缓起缓落。用于位移、滑动、切换',
    spring: '落花：轻轻越过再回落。用于完成、庆祝，少用',
  },

  masks: {
    /** 笔触：中间粗、两端尖，横向拉伸使用 */
    stroke: svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'><path d='M0 4.6C18 3.1 58 2.4 100 2.9S172 3.3 200 4.3C176 5.7 122 6.1 88 5.8S24 5.5 0 4.6Z'/></svg>`,
    ),
    /** 印泥斑驳：大部分不透明，少量缺口 */
    stamp: svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -6 4.7'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
    ),
  },

  effect: 'ink',
});
