import { html } from '../../src/index.js';
import { api } from '../data/api.js';
import { docs, groups } from '../data/docs.js';
import { code, demo, pager } from '../ui/page.js';

const ORDER = groups.flatMap((g) => g.items);

const table = (title, rows, columns) =>
  rows.length
    ? html`
        <h3>${title}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>${columns.map(([label]) => html`<th>${label}</th>`)}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => html`<tr>${columns.map(([, render]) => html`<td>${render(row)}</td>`)}</tr>`)}
            </tbody>
          </table>
        </div>
      `
    : null;

const name = (row) => html`<code>${row.name || '（默认）'}</code>`;
const description = (row) => row.description;

export default ({ params }) => {
  const doc = docs[params.slug];
  if (!doc) {
    return html`<h1>没有这个组件</h1><p>“${params.slug}” 不在组件列表中。</p>`;
  }
  const info = api[doc.tag] ?? { attrs: [], slots: [], events: [], parts: [], cssprops: [] };
  const index = ORDER.indexOf(params.slug);
  const prev = ORDER[index - 1];
  const next = ORDER[index + 1];
  // 函数形式的 API（toast()、confirm()）：没有属性表，用选项表
  const fn = doc.fn;

  return html`
    <h1>${doc.name}</h1>
    <p class="lead"><code>${fn ?? `<${doc.tag}>`}</code> · ${doc.intro}</p>

    ${doc.usage ? code(doc.usage) : null}
    <h2>演示</h2>
    ${doc.demos.map(demo)}

    <h2>API</h2>
    ${doc.options ? table('选项', doc.options, [['选项', name], ['类型', (r) => html`<code>${r.type}</code>`], ['说明', description]]) : null}
    ${fn
      ? null
      : html`
          ${table('属性', info.attrs, [['属性', name], ['类型', (r) => html`<code>${r.type}</code>`], ['说明', description]])}
          ${table('插槽', info.slots, [['插槽', name], ['说明', description]])}
          ${table('事件', info.events, [['事件', name], ['说明', description]])}
          ${table('CSS Part', info.parts, [['名称', name], ['说明', description]])}
          ${table('CSS 变量', info.cssprops, [['变量', name], ['说明', description]])}
          <p style="color: var(--vn-fg-muted); font-size: var(--vn-font-size-sm)">API 表格由 <code>${info.file}</code> 头部的 JSDoc 生成。</p>
        `}

    ${pager(
      prev ? [`/components/${prev}`, docs[prev].name] : ['/components', '组件总览'],
      next ? [`/components/${next}`, docs[next].name] : null,
    )}
  `;
};
