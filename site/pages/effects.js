import { html } from '../../src/index.js';
import '../../examples/seasons.js';
import { code, pager } from '../ui/page.js';

export default () => html`
  <h1>风花雪月</h1>
  <p class="lead">两类效果：一次性的点击效果，和持续的天气背景。颜色来自主题，开启“减少动态效果”时粒子不再播放。</p>

  <h2>试一试</h2>
  <demo-seasons></demo-seasons>

  <h2>点击效果</h2>
  ${code(`import { burst } from 'vunio';

// 在组件里：传入 this.animate，组件移除时动画随之取消
burst('blossom', layer, { x, y, animate: this.animate.bind(this) });`)}
  <div class="table-wrap">
    <table>
      <thead><tr><th>效果</th><th>形态</th><th>适合</th></tr></thead>
      <tbody>
        <tr><td><code>ink</code> 墨晕</td><td>一团从点击处晕开的墨</td><td>按钮按下的通用反馈</td></tr>
        <tr><td><code>blossom</code> 落花</td><td>花瓣迸出后翻飞飘落</td><td>完成、收藏、点赞</td></tr>
        <tr><td><code>snow</code> 飞雪</td><td>雪粒散开后缓缓下坠</td><td>安静的确认</td></tr>
        <tr><td><code>wind</code> 风叶</td><td>竹叶被风横着吹走</td><td>发送、提交、前进</td></tr>
        <tr><td><code>glitch</code> 故障</td><td>几道色带错位闪烁，像信号受了干扰</td><td>赛博主题的默认按下反馈</td></tr>
        <tr><td><code>spark</code> 电火花</td><td>细光从点击处迸出，带几粒像素碎屑</td><td>完成、解锁、连接成功</td></tr>
      </tbody>
    </table>
  </div>
  <p>
    按钮上直接写 <code>effect="blossom"</code> 即可，不需要自己调用。不写 <code>effect</code> 时由主题决定：
    主题变量 <code>--vn-effect</code> 在古风里是 <code>ink</code>，在赛博里是 <code>glitch</code>。
  </p>

  <h3>自己的效果</h3>
  ${code(`import { registerBurst } from 'vunio';

registerBurst('heart', {
  layer: 'fx',              // 'fx'：可以飞出按钮；'wash'：裁切在按钮内
  run(layer, ctx) {         // ctx：x、y、width、height、reduced，以及 particle / play 两个工具
    const el = ctx.particle({ left: \`\${ctx.x}px\`, top: \`\${ctx.y}px\`, color: 'var(--vn-accent-fg)' });
    el.textContent = '♥';
    return [ctx.play(el, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40px)', opacity: 0 }], { duration: 600 })];
  },
});

// <vn-button effect="heart">喜欢</vn-button>`)}
  <p>默认在“减少动态效果”时跳过；写 <code>reducedMotion: 'run'</code> 则照常调用，由 <code>ctx.reduced</code> 自行降级。</p>

  <h2>天气背景</h2>
  ${code(`<section style="position: relative">
  <vn-sky weather="blossom" moon></vn-sky>   <!-- snow | blossom | wind | rain | none -->
</section>`, 'html')}
  <p>画布按设备像素比绘制，离开视口自动暂停，组件移除时立即停止。</p>

  ${pager(['/design', '设计系统'], ['/components', '组件'])}
`;
