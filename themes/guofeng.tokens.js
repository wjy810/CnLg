/**
 * 古风主题的设计令牌（唯一来源）。
 *
 * 修改后运行 `npm run build:theme`，会重新生成：
 *   themes/guofeng.css                CSS 变量
 *   docs/design/guofeng.md 中的对比度表
 * 测试会检查生成结果是否最新，以及所有对比度要求是否满足。
 *
 * 色值参考中国传统色，并为屏幕显示和 WCAG 对比度做了校准。
 */

/** 原色：有名字的传统色。组件不直接使用，只通过下面的语义令牌引用。 */
export const palette = {
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

const c = (key) => ({ ref: key });

/**
 * 语义令牌。组件只用这些。
 * 值可以是 { ref: 原色名 } 或直接的 CSS 颜色（半透明色）。
 */
export const themes = {
  day: {
    label: '昼',
    colorScheme: 'light',
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
      wind: c('zhuqing'),
      blossom: c('taoyao'),
      'blossom-deep': c('haitang'),
      snow: '#AFC0CB',
      moon: c('yuebai'),
      'night-sky': '#2C3A4B',
      wood: '#5A3E2B',
      gilt: '#A88443',
    },
    shadows: {
      1: '0 1px 2px rgba(70, 48, 26, 0.08)',
      2: '0 8px 20px -10px rgba(70, 48, 26, 0.28)',
      3: '0 22px 48px -18px rgba(70, 48, 26, 0.38)',
    },
    texture: { tint: '0.36 0.27 0.18', alpha: 0.055 },
  },
  night: {
    label: '夜',
    colorScheme: 'dark',
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
      wind: '#8DB49A',
      blossom: '#E39AA4',
      'blossom-deep': '#D46F7E',
      snow: c('shuang'),
      moon: '#F3EBD3',
      'night-sky': '#0B0E13',
      wood: '#6E4D36',
      gilt: '#C9A15A',
    },
    shadows: {
      1: '0 1px 2px rgba(0, 0, 0, 0.4)',
      2: '0 10px 24px -10px rgba(0, 0, 0, 0.6)',
      3: '0 24px 56px -16px rgba(0, 0, 0, 0.7)',
    },
    texture: { tint: '0.93 0.9 0.85', alpha: 0.03 },
  },
};

/**
 * 对比度要求（WCAG 2.1 AA）：每个主题都要满足。
 * 4.5：正文与可读文字；3：大字、图形与控件边界、焦点框。
 */
export const contrastRules = [
  ['fg', 'bg', 4.5, '正文'],
  ['fg', 'surface', 4.5, '卡片上的正文'],
  ['fg', 'surface-sunken', 4.5, '输入框中的文字'],
  ['fg-muted', 'bg', 4.5, '次要文字'],
  ['fg-muted', 'surface', 4.5, '卡片上的次要文字'],
  ['fg-muted', 'surface-sunken', 4.5, '占位文字'],
  ['fg-subtle', 'bg', 3, '弱化图形、禁用态'],
  ['line-strong', 'bg', 3, '控件边框'],
  ['line-strong', 'surface', 3, '卡片上的控件边框'],
  ['on-primary', 'primary', 4.5, '墨色按钮文字'],
  ['on-accent', 'accent', 4.5, '朱砂按钮文字'],
  ['accent-fg', 'bg', 4.5, '强调文字、链接'],
  ['accent-fg', 'surface', 4.5, '卡片上的强调文字'],
  ['success', 'bg', 4.5, '成功提示'],
  ['warning', 'bg', 4.5, '提醒'],
  ['danger', 'bg', 4.5, '错误提示'],
  ['danger', 'surface', 4.5, '卡片上的错误提示'],
  ['info', 'bg', 4.5, '信息'],
  ['success', 'surface-sunken', 4.5, '凹陷面上的成功色（如代码高亮）'],
  ['warning', 'surface-sunken', 4.5, '凹陷面上的提醒色'],
  ['danger', 'surface-sunken', 4.5, '凹陷面上的错误提示'],
  ['info', 'surface-sunken', 4.5, '凹陷面上的信息色'],
  ['accent-fg', 'surface-sunken', 4.5, '凹陷面上的强调文字'],
  ['focus', 'bg', 3, '焦点框'],
];

/** 与主题无关的尺度 */
export const scales = {
  font: {
    brush: "'Ma Shan Zheng', 'STXingkai', 'Xingkai SC', 'STKaiti', 'KaiTi', serif",
    kai: "'Kaiti SC', 'STKaiti', 'KaiTi', 'BiauKai', serif",
    serif: "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', 'SimSun', serif",
    mono: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace",
  },
  'font-size': {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '36px',
    '4xl': '48px',
    '5xl': '64px',
  },
  leading: { tight: '1.3', normal: '1.75', loose: '2' },
  tracking: { normal: '0', wide: '0.08em', wider: '0.2em', widest: '0.35em' },
  weight: { regular: '400', medium: '600', bold: '700' },
  space: { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px', 9: '96px' },
  radius: { none: '0', sm: '2px', md: '4px', lg: '8px', full: '999px' },
  border: { thin: '1px', thick: '2px' },
  ease: {
    ink: 'cubic-bezier(0.16, 1, 0.3, 1)',
    brush: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    wind: 'cubic-bezier(0.45, 0, 0.2, 1)',
    petal: 'cubic-bezier(0.34, 1.36, 0.64, 1)',
  },
  duration: { instant: '100ms', fast: '180ms', normal: '320ms', slow: '600ms', ink: '900ms' },
  z: { dropdown: '1000', sticky: '1050', overlay: '1100', modal: '1110', toast: '1200' },
  measure: { narrow: '22em', normal: '34em', wide: '48em' },
};

/** 动效名称的含义（写进文档） */
export const easeNotes = {
  ink: '墨晕：落墨即散，越散越慢。用于点击反馈、展开、出现',
  brush: '运笔：起笔利落，收笔稳。用于大多数状态过渡',
  wind: '风过：缓起缓落。用于位移、滑动、切换',
  petal: '落花：轻轻越过再回落。用于完成、庆祝，少用',
};
