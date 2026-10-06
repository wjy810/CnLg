import { html, signal, computed, effect, batch } from '../../src/index.js';
import { code, link, pager } from '../ui/page.js';

function liveCounter() {
  const count = signal(0);
  const double = computed(() => count.value * 2);
  const log = signal([]);
  const dispose = effect(() => {
    const value = count.value;
    log.value = [`effect：count = ${value}`, ...log.peek()].slice(0, 3);
  });
  return html`
    <div class="live">
      <vn-button size="sm" @click=${() => count.value++}>加一</vn-button>
      <vn-button size="sm" variant="moon" @click=${() => batch(() => ((count.value += 1), (count.value += 1)))}>batch 加二</vn-button>
      <vn-button size="sm" variant="text" @click=${() => dispose()}>停止 effect</vn-button>
      <span>count = <b>${count}</b>，double = <b>${double}</b></span>
    </div>
    <p style="color: var(--vn-fg-muted); font-size: var(--vn-font-size-sm)">${() => log.value.join(' · ')}</p>
  `;
}

export default () => html`
  <h1>响应式</h1>
  <p class="lead">Vunio 的状态由 signal 承载：写下“什么依赖什么”，框架负责在变化时只更新受影响的地方。</p>

  <h2>四个原语</h2>
  ${code(`import { signal, computed, effect, batch } from 'vunio';

const count = signal(0);                          // 可写的值
const double = computed(() => count.value * 2);   // 派生值：惰性求值、结果缓存
const stop = effect(() => {                       // 副作用：依赖变化时同步重新运行
  document.title = \`点了 \${count.value} 次\`;
});

batch(() => {                                     // 合并多次写入，effect 只运行一次
  count.value = 1;
  count.value = 2;
});
stop();                                           // 释放 effect`)}
  ${liveCounter()}

  <h2>语义</h2>
  <ul>
    <li><b>无毛刺</b>：一个值变化，依赖它的 effect 只运行一次，且看到的都是最新值。</li>
    <li><b>相等剪枝</b>：computed 的结果与上次相等时，下游不会被当作变化。</li>
    <li><b>不可变更新</b>：数组、对象按引用比较，<code>list.value.push(x)</code> 不会触发更新，请写 <code>list.value = [...list.value, x]</code>。</li>
    <li><b>不会卡死</b>：循环依赖、effect 互相触发超过 100 轮时抛出中文错误。</li>
  </ul>

  <h2>在组件中</h2>
  <p>组件的属性本身就是 signal；内部状态用 <code>signal()</code>，派生值用 <code>computed()</code>；副作用写在 <code>mounted()</code> 里的 <code>this.effect()</code>，组件移除时自动释放。</p>
  ${code(`class PoemCount extends VunioElement {
  static props = { max: { type: Number, default: 4 } };
  lines = signal([]);
  full = computed(() => this.lines.value.length >= this.max);

  mounted() {
    this.effect(() => this.setState('full', this.full.value));
  }
}`)}

  <h2>共享状态</h2>
  <p>不需要额外的状态库：store 就是模块里的 signal。写操作封装成函数导出，组件只调用函数。</p>
  ${code(`// stores/poems.js
export const poems = signal([]);
export const favorites = computed(() => poems.value.filter((p) => p.favorite));

export function addPoem(poem) {
  poems.value = [...poems.value, poem];
}`)}

  <h2>作用域与回收</h2>
  <p>每个 effect 都有主人。组件移出页面时，模板的订阅暂停（全局 signal 不再引用组件，可以被回收）；移回时只重跑期间依赖变过的部分，DOM 不重建。细节见 RFC 0001。</p>

  ${pager(['/start', '快速开始'], ['/templates', '模板'])}
`;
