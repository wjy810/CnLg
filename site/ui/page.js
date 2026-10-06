// 页面里常用的小片段
import { html } from '../../src/index.js';
import { router } from '../router.js';
import './code.js';
import './demo.js';

/** 代码块 */
export const code = (source, syntax = 'js') => html`<site-code syntax=${syntax} .code=${source}></site-code>`;

/** 现场演示 */
export const demo = (value) => html`<site-demo .demo=${value}></site-demo>`;

/** 站内链接 */
export const link = (to, text) => html`<a href=${router.href(to)}>${text}</a>`;

/** 上一页 / 下一页 */
export const pager = (prev, next) => html`
  <nav class="pager" aria-label="翻页">
    ${prev ? html`<a class="prev" href=${router.href(prev[0])}><small>上一页</small>${prev[1]}</a>` : html`<span></span>`}
    ${next ? html`<a class="next" href=${router.href(next[0])}><small>下一页</small>${next[1]}</a>` : null}
  </nav>
`;
