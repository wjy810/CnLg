// 组件文档：分组、介绍与演示。API 表格来自 site/data/api.js（由源码 JSDoc 生成）。
// 本文件是纯数据（可在 Node 中导入），演示需要的模块在 setup 里按需加载。

export const groups = [
  { title: '基础', items: ['button', 'heading', 'card', 'stack', 'divider', 'tag'] },
  { title: '导航', items: ['tabs', 'breadcrumb', 'pagination'] },
  { title: '表单', items: ['input', 'textarea', 'select', 'radio', 'slider', 'checkbox', 'switch'] },
  { title: '反馈', items: ['loading', 'progress', 'modal', 'toast'] },
  { title: '叙事', items: ['collapse', 'timeline'] },
  { title: '效果', items: ['sky'] },
];

/** slug → 文档 */
export const docs = {
  button: {
    tag: 'vn-button',
    name: '按钮',
    intro: '默认是墨色。朱砂色（强调色）只留给一个视图里最重要的那一个操作。点击效果默认随主题：古风墨晕散开，赛博信号故障；也可以指定落花、飞雪、风叶、电火花。',
    demos: [
      {
        title: '四种外观',
        html: `<vn-stack direction="row" gap="3" wrap align="center">
  <vn-button>落笔</vn-button>
  <vn-button variant="cinnabar">题诗</vn-button>
  <vn-button variant="moon">听雪</vn-button>
  <vn-button variant="text">随风</vn-button>
</vn-stack>`,
      },
      {
        title: '点击效果',
        html: `<vn-stack direction="row" gap="3" wrap>
  <vn-button variant="moon" effect="ink">墨晕</vn-button>
  <vn-button variant="cinnabar" effect="blossom">落花</vn-button>
  <vn-button variant="moon" effect="snow">飞雪</vn-button>
  <vn-button variant="moon" effect="wind">风叶</vn-button>
  <vn-button variant="moon" effect="glitch">故障</vn-button>
  <vn-button variant="moon" effect="spark">电火花</vn-button>
</vn-stack>`,
      },
      {
        title: '尺寸与状态',
        html: `<vn-stack direction="row" gap="3" wrap align="center">
  <vn-button size="sm">小</vn-button>
  <vn-button>中</vn-button>
  <vn-button size="lg">大</vn-button>
  <vn-button loading>研墨</vn-button>
  <vn-button disabled>封笔</vn-button>
</vn-stack>`,
      },
    ],
  },
  heading: {
    tag: 'vn-heading',
    name: '标题',
    intro: '1–3 级用毛笔字，4–6 级用宋体。可以在标题旁盖一方朱印，也可以竖排。',
    demos: [
      {
        title: '层级、副标题与印章',
        html: `<vn-stack gap="4">
  <vn-heading level="1" seal="雅">风花雪月</vn-heading>
  <vn-heading level="2" sub="苏轼 · 宋">水调歌头</vn-heading>
  <vn-heading level="4">四级标题用宋体</vn-heading>
</vn-stack>`,
      },
      {
        title: '竖排',
        html: `<vn-heading level="2" vertical seal="月" sub="张九龄">海上生明月</vn-heading>`,
      },
    ],
  },
  card: {
    tag: 'vn-card',
    name: '卡片',
    intro: '一张纸、一幅古籍双线框，或只是一块留白。标题、操作、底部都是插槽，没有内容时自动隐藏。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="5" wrap align="stretch">
  <vn-card interactive style="flex: 1 1 220px">
    <span slot="title">纸片</span>
    <vn-button slot="extra" size="sm" variant="text">更多</vn-button>
    人面不知何处去，桃花依旧笑春风。
    <vn-button slot="footer" size="sm" variant="moon">收藏</vn-button>
  </vn-card>
  <vn-card variant="frame" style="flex: 1 1 220px">
    <span slot="title">古籍双线框</span>
    忽如一夜春风来，千树万树梨花开。
  </vn-card>
</vn-stack>`,
      },
    ],
  },
  stack: {
    tag: 'vn-stack',
    name: '布局',
    intro: '纵向或横向排列子元素，间距取自主题的 --vn-space-*，不用再写一堆 flex 样式。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="3" justify="between" align="center">
  <vn-heading level="4">诗笺</vn-heading>
  <vn-stack direction="row" gap="2">
    <vn-button size="sm" variant="moon">取消</vn-button>
    <vn-button size="sm" variant="cinnabar">保存</vn-button>
  </vn-stack>
</vn-stack>`,
      },
    ],
  },
  divider: {
    tag: 'vn-divider',
    name: '分隔线',
    intro: '默认是一道两头尖的笔触，可以在中间写字；也有细线、虚线和竖向的写法。',
    demos: [
      {
        html: `<vn-divider>春</vn-divider>
<vn-divider></vn-divider>
<vn-divider variant="dashed">夏</vn-divider>
<p>行内<vn-divider vertical></vn-divider>竖向<vn-divider vertical></vn-divider>分隔</p>`,
      },
    ],
  },
  loading: {
    tag: 'vn-loading',
    name: '加载',
    intro: '一滴墨入水，涟漪一圈圈散开。文字同时是读屏文字；开启“减少动态效果”时只留一滴静止的墨。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="7" wrap align="center">
  <vn-loading size="sm"></vn-loading>
  <vn-loading label="研墨中"></vn-loading>
  <vn-loading size="lg" quiet></vn-loading>
</vn-stack>`,
      },
    ],
  },
  tag: {
    tag: 'vn-tag',
    name: '标签',
    intro: '一小块带边框的文字，标注类别、状态或关键词。颜色有六种；closable 时可以移除，移除前派发可以取消的 vn-close。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="2" wrap align="center">
  <vn-tag>五言</vn-tag>
  <vn-tag type="accent">名篇</vn-tag>
  <vn-tag type="success">已读</vn-tag>
  <vn-tag type="warning">待考</vn-tag>
  <vn-tag type="danger">残缺</vn-tag>
  <vn-tag type="info">注释</vn-tag>
  <vn-tag closable>李白</vn-tag>
  <vn-tag size="sm">小</vn-tag>
</vn-stack>`,
      },
    ],
  },
  tabs: {
    tag: 'vn-tabs',
    name: '标签页',
    intro: '一组 <vn-tab-panel>，一次显示一页。← → 切换，Home / End 到两端，Tab 进入面板；当前标签下的线随切换滑过去。',
    demos: [
      {
        html: `<vn-tabs label="四时" value="autumn">
  <vn-tab-panel name="spring" label="春">春眠不觉晓，处处闻啼鸟。</vn-tab-panel>
  <vn-tab-panel name="summer" label="夏">接天莲叶无穷碧，映日荷花别样红。</vn-tab-panel>
  <vn-tab-panel name="autumn" label="秋">停车坐爱枫林晚，霜叶红于二月花。</vn-tab-panel>
  <vn-tab-panel name="winter" label="冬" disabled>（未完）</vn-tab-panel>
</vn-tabs>`,
      },
    ],
  },
  pagination: {
    tag: 'vn-pagination',
    name: '分页',
    intro: '上一页、页码、下一页。页数多时只显示首尾和当前页两侧，其余折叠为省略号。页码是按钮；需要链接跳转时监听 vn-change。',
    demos: [
      {
        html: `<vn-stack gap="4">
  <vn-pagination total="56" page="2"></vn-pagination>
  <vn-pagination total="520" page="17" siblings="2"></vn-pagination>
</vn-stack>`,
      },
    ],
  },
  breadcrumb: {
    tag: 'vn-breadcrumb',
    name: '面包屑',
    intro: '当前页在网站中的位置。最后一项是当前页：不是链接，读屏会读出“当前页”。分隔符可以换。',
    demos: [
      {
        html: `<vn-breadcrumb>
  <vn-breadcrumb-item href="#/">首页</vn-breadcrumb-item>
  <vn-breadcrumb-item href="#/components">组件</vn-breadcrumb-item>
  <vn-breadcrumb-item>面包屑</vn-breadcrumb-item>
</vn-breadcrumb>
<vn-breadcrumb separator="›">
  <vn-breadcrumb-item href="#/">唐诗</vn-breadcrumb-item>
  <vn-breadcrumb-item href="#/">李白</vn-breadcrumb-item>
  <vn-breadcrumb-item>静夜思</vn-breadcrumb-item>
</vn-breadcrumb>`,
      },
    ],
  },
  progress: {
    tag: 'vn-progress',
    name: '进度',
    intro: '一道逐渐写满的线：古风是笔触，赛博是分段的灯条，形状都来自主题。不写 value 时是不确定进度；开启“减少动态效果”时静止为半满。',
    demos: [
      {
        html: `<vn-stack gap="5" style="max-width: 420px">
  <vn-progress value="0.35" label="研墨"></vn-progress>
  <vn-progress value="72" max="100" label="誊抄"></vn-progress>
  <vn-progress label="装裱中"></vn-progress>
</vn-stack>`,
      },
    ],
  },
  collapse: {
    tag: 'vn-collapse',
    name: '折叠面板',
    intro: '每一项都是原生 <details>：键盘、读屏、页内查找都由浏览器负责。accordion 时同一时间只展开一项；展开收起有高度动画。',
    demos: [
      {
        html: `<vn-collapse accordion>
  <vn-collapse-item heading="作者" open>李白，字太白，号青莲居士，唐代浪漫主义诗人。</vn-collapse-item>
  <vn-collapse-item heading="出处">《李太白集》卷六。</vn-collapse-item>
  <vn-collapse-item heading="注释">床：一说井栏，一说坐具。</vn-collapse-item>
</vn-collapse>`,
      },
    ],
  },
  timeline: {
    tag: 'vn-timeline',
    name: '时间线',
    intro: '按时间排列的事件。每一项左侧是一个圆点，或者一方小印；颜色与标签相同。',
    demos: [
      {
        html: `<vn-timeline>
  <vn-timeline-item time="开元十三年" seal="出">仗剑去国，辞亲远游</vn-timeline-item>
  <vn-timeline-item time="开元十八年">初入长安，未得任用</vn-timeline-item>
  <vn-timeline-item time="天宝元年" seal="仕" type="accent">奉诏入京，供奉翰林</vn-timeline-item>
  <vn-timeline-item time="天宝三载" type="info">赐金放还，与杜甫相识</vn-timeline-item>
</vn-timeline>`,
      },
    ],
  },
  input: {
    tag: 'vn-input',
    name: '输入框',
    intro: '信笺式的下划线，聚焦时一道笔触从中间展开。直接放进 <form>，校验信息是中文，只在离开输入框或提交失败后出现。',
    demos: [
      {
        html: `<form style="display: grid; gap: 4px; max-width: 360px">
  <vn-input name="title" label="题目" value="水调歌头" required clearable></vn-input>
  <vn-input name="line" label="名句" placeholder="明月几时有" hint="五到二十字" minlength="5" maxlength="20" required></vn-input>
  <vn-input name="mail" type="email" label="邮箱" placeholder="libai@tang.cn"></vn-input>
</form>`,
      },
    ],
  },
  textarea: {
    tag: 'vn-textarea',
    name: '多行输入',
    intro: '与输入框相同的标签、提示、校验和字数统计。autosize 时随内容长高，不出现滚动条。',
    demos: [
      {
        html: `<form style="max-width: 420px">
  <vn-textarea name="note" label="读后感" placeholder="写下你的读后感" hint="不超过一百字" maxlength="100" autosize required></vn-textarea>
</form>`,
      },
    ],
  },
  radio: {
    tag: 'vn-radio-group',
    name: '单选',
    intro: '一组里选一个。值在组上，直接放进 <form>；Tab 只停在选中的那一项，方向键移动并选中，跳过禁用项。',
    demos: [
      {
        html: `<vn-stack gap="5">
  <vn-radio-group name="form" label="体裁" value="ci">
    <vn-radio value="shi">诗</vn-radio>
    <vn-radio value="ci">词</vn-radio>
    <vn-radio value="qu">曲</vn-radio>
    <vn-radio value="fu" disabled>赋（缺）</vn-radio>
  </vn-radio-group>
  <vn-radio-group name="season" label="时节" direction="row" required hint="必选">
    <vn-radio value="spring">春</vn-radio>
    <vn-radio value="summer">夏</vn-radio>
    <vn-radio value="autumn">秋</vn-radio>
    <vn-radio value="winter">冬</vn-radio>
  </vn-radio-group>
</vn-stack>`,
      },
    ],
  },
  slider: {
    tag: 'vn-slider',
    name: '滑块',
    intro: '在一段范围里取一个数。可以拖、可以点轨道、也可以用方向键 / PageUp / Home / End。拖动中派发 input，松手派发 change，与原生 range 一致。',
    demos: [
      {
        html: `<vn-stack gap="5" style="max-width: 420px">
  <vn-slider name="ink" label="墨色浓淡" value="60" unit="%"></vn-slider>
  <vn-slider name="speed" label="风速" min="0" max="1" step="0.1" value="0.3" hint="0 无风，1 疾风"></vn-slider>
</vn-stack>`,
      },
    ],
  },
  select: {
    tag: 'vn-select',
    name: '下拉选择',
    intro: '选项写成原生 <option>。面板放在页面顶层，不会被 overflow: hidden 的祖先裁掉；方向键、Home / End、首字母跳转、Esc 都可用。',
    demos: [
      {
        html: `<vn-select name="season" label="时节" style="max-width: 280px">
  <option value="spring">春</option>
  <option value="summer" disabled>夏</option>
  <option value="autumn" selected>秋</option>
  <option value="winter">冬</option>
</vn-select>`,
      },
    ],
  },
  checkbox: {
    tag: 'vn-checkbox',
    name: '复选框',
    intro: '勾是一笔朱批，选中时一笔画出。空格键切换；选中时提交 value（默认 on）。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="6" wrap>
  <vn-checkbox name="agree">愿以诗会友</vn-checkbox>
  <vn-checkbox name="public" checked>公开</vn-checkbox>
  <vn-checkbox disabled>不可选</vn-checkbox>
</vn-stack>`,
      },
    ],
  },
  switch: {
    tag: 'vn-switch',
    name: '开关',
    intro: '滑块是一枚玉璧。variant="moon" 时关为日、开为一弯新月，适合做昼夜切换。',
    demos: [
      {
        html: `<vn-stack direction="row" gap="6" wrap>
  <vn-switch checked>提醒</vn-switch>
  <vn-switch variant="moon">日月</vn-switch>
  <vn-switch disabled>不可用</vn-switch>
</vn-stack>`,
      },
    ],
  },
  modal: {
    tag: 'vn-modal',
    name: '弹窗',
    intro: '基于原生 <dialog>：背景不可操作、焦点留在弹窗内、关闭后焦点回到原处。外观是一幅立轴，打开时从中间向上下展开。',
    demos: [
      {
        html: `<vn-button variant="moon" id="open">展开立轴</vn-button>
<vn-modal id="poem" heading="水调歌头">
  明月几时有？把酒问青天。不知天上宫阙，今夕是何年。
  <vn-button slot="footer" variant="cinnabar" id="close">合上</vn-button>
</vn-modal>`,
        js: `open.addEventListener('click', () => poem.show());
close.addEventListener('click', () => poem.close('done'));
poem.addEventListener('vn-close', (e) => console.log(e.detail.returnValue));`,
        setup(stage) {
          const poem = stage.querySelector('#poem');
          stage.querySelector('#open').addEventListener('click', () => poem.show());
          stage.querySelector('#close').addEventListener('click', () => poem.close('done'));
        },
      },
    ],
  },
  toast: {
    tag: 'vn-toaster',
    name: '消息',
    intro: '调用 toast() 显示一条带小印的消息：讯 · 成 · 慎 · 误。默认 3 秒后消失，鼠标悬停时暂停计时。',
    usage: `import { toast } from 'vunio/components';

toast('已存入诗笺', { type: 'success' });
const saving = toast('正在保存…', { duration: 0 }); // 0：不自动关闭
saving.close();`,
    options: [
      { name: 'type', type: "'info'|'success'|'warning'|'error'", description: '类型，默认 info；error 使用 role="alert"' },
      { name: 'duration', type: 'number', description: '自动关闭的毫秒数，默认 3000；0 为不自动关闭' },
    ],
    demos: [
      {
        html: `<vn-stack direction="row" gap="3" wrap>
  <vn-button variant="moon" size="sm" data-type="info">讯</vn-button>
  <vn-button variant="moon" size="sm" data-type="success">成</vn-button>
  <vn-button variant="moon" size="sm" data-type="warning">慎</vn-button>
  <vn-button variant="moon" size="sm" data-type="error">误</vn-button>
</vn-stack>`,
        js: `for (const button of document.querySelectorAll('[data-type]')) {
  button.addEventListener('click', () => toast('一封来自远方的信', { type: button.dataset.type }));
}`,
        async setup(stage) {
          const { toast } = await import('../../src/components/index.js');
          const text = { info: '新诗一首待读', success: '已存入诗笺', warning: '墨将尽，请研墨', error: '纸破了，未能保存' };
          for (const button of stage.querySelectorAll('[data-type]')) {
            button.addEventListener('click', () => toast(text[button.dataset.type], { type: button.dataset.type }));
          }
        },
      },
    ],
  },
  sky: {
    tag: 'vn-sky',
    name: '天气',
    intro: '画布绘制的风、花、雪、雨，可以加一轮月亮。铺满最近的定位祖先、不响应指针；离开视口自动暂停，开启“减少动态效果”时只画静止的一帧。',
    demos: [
      {
        html: `<div style="position: relative; height: 220px; border-radius: 4px; overflow: hidden">
  <vn-sky weather="blossom" moon></vn-sky>
</div>`,
      },
      {
        title: '风、雪与雨',
        html: `<vn-stack direction="row" gap="4" wrap>
  <div style="position: relative; height: 160px; flex: 1 1 200px"><vn-sky weather="wind" wind="0.6"></vn-sky></div>
  <div style="position: relative; height: 160px; flex: 1 1 200px"><vn-sky weather="snow" density="2"></vn-sky></div>
  <div style="position: relative; height: 160px; flex: 1 1 200px"><vn-sky weather="rain" wind="0.3"></vn-sky></div>
</vn-stack>`,
      },
    ],
  },
};
