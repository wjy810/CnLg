// 示例组件：诗笺。演示 共享 store / repeat 带 key 的列表 / when 条件渲染 / 组件内部 signal。
import { VunioElement, html, css, signal, repeat, when } from '../src/index.js';
import {
  THEMES,
  addPoem,
  onlyFavorites,
  removePoem,
  reverse,
  shuffle,
  stats,
  toggleFavorite,
  visible,
} from './stores/poems.js';

const palette = css`
  :host {
    --_ink: #2b2a27;
    --_paper: #f6efe2;
    --_muted: #8b847a;
    --_line: rgba(43, 42, 39, 0.16);
    --_accent: #b5352a;
  }
  [data-theme='风'] {
    --_c: #5f8a7a;
  }
  [data-theme='花'] {
    --_c: #c4626f;
  }
  [data-theme='雪'] {
    --_c: #4f6b85;
  }
  [data-theme='月'] {
    --_c: #b08d4a;
  }
`;

export class DemoAnthology extends VunioElement {
  static tag = 'demo-anthology';

  static styles = [
    palette,
    css`
      :host {
        display: block;
        color: var(--_ink);
      }
      button {
        font: inherit;
        cursor: pointer;
      }
      .compose {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 14px;
      }
      .draft {
        flex: 1 1 220px;
        min-inline-size: 0;
        padding: 8px 2px;
        border: 0;
        border-block-end: 1px solid rgba(43, 42, 39, 0.25);
        background: transparent;
        font: inherit;
        font-size: 16px;
        color: inherit;
        outline: none;
        transition: border-color 0.3s;
      }
      .draft:focus {
        border-block-end-color: var(--_ink);
      }
      .draft::placeholder {
        color: #b8b0a3;
      }
      .themes {
        display: flex;
        gap: 6px;
      }
      .chip {
        inline-size: 32px;
        block-size: 32px;
        padding: 0;
        border: 1px solid var(--_line);
        border-radius: 50%;
        background: transparent;
        color: var(--_muted);
        transition:
          background-color 0.2s,
          color 0.2s,
          border-color 0.2s;
      }
      .chip:hover {
        border-color: var(--_c);
        color: var(--_c);
      }
      .chip[aria-pressed='true'] {
        border-color: var(--_c);
        background: var(--_c);
        color: var(--_paper);
      }
      .submit {
        padding: 6px 20px;
        border: 0;
        border-radius: 2px;
        background: var(--_ink);
        color: var(--_paper);
        letter-spacing: 0.3em;
      }
      .submit:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 18px;
        margin-block: 16px 6px;
        padding-block-end: 10px;
        border-block-end: 1px solid var(--_line);
        font-size: 14px;
        color: var(--_muted);
      }
      .link {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        text-decoration: underline;
        text-decoration-color: var(--_line);
        text-underline-offset: 4px;
      }
      .link:hover {
        color: var(--_ink);
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
      .toggle input {
        margin: 0;
        accent-color: var(--_accent);
      }
      .moves {
        margin-inline-start: auto;
        font-size: 12px;
      }
      .moves b {
        color: var(--_accent);
      }
      .list {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .row {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 12px;
        padding: 12px 2px;
        border-block-end: 1px dashed var(--_line);
        /* 新插入或被移动的行会重新播放：直观看到 repeat 只动了哪些节点 */
        animation: ink-in 0.9s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes ink-in {
        from {
          opacity: 0;
          filter: blur(3px);
          background-color: rgba(181, 53, 42, 0.14);
        }
      }
      .theme {
        display: grid;
        place-items: center;
        inline-size: 26px;
        block-size: 26px;
        border-radius: 50%;
        background: var(--_c);
        color: var(--_paper);
        font-size: 13px;
      }
      .text {
        font-size: 17px;
        line-height: 1.6;
        letter-spacing: 0.08em;
      }
      .fav {
        inline-size: 28px;
        block-size: 28px;
        padding: 0;
        border: 1px solid rgba(181, 53, 42, 0.5);
        border-radius: 3px;
        background: transparent;
        color: var(--_accent);
        font-size: 13px;
        transition:
          background-color 0.2s,
          color 0.2s;
      }
      .fav[aria-pressed='true'] {
        border-color: var(--_accent);
        background: var(--_accent);
        color: var(--_paper);
      }
      .remove {
        inline-size: 28px;
        block-size: 28px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--_muted);
        font-size: 18px;
        line-height: 1;
      }
      .remove:hover {
        background: rgba(43, 42, 39, 0.06);
        color: var(--_ink);
      }
      .empty {
        margin: 20px 0 0;
        color: var(--_muted);
        letter-spacing: 0.1em;
      }
    `,
  ];

  /** 输入框里的草稿 */
  draft = signal('');
  /** 选中的主题 */
  theme = signal('花');
  /** 上一次操作中被插入（新建或移动）的行数 */
  moves = signal(-1);

  render() {
    return html`
      <form class="compose" @submit=${this.submit}>
        <input
          class="draft"
          placeholder="题一句诗……"
          aria-label="诗句"
          .value=${this.draft}
          @input=${(e) => (this.draft.value = e.target.value)}
        />
        <div class="themes" role="group" aria-label="主题">
          ${THEMES.map(
            (t) => html`<button
              type="button"
              class="chip"
              data-theme=${t}
              aria-pressed=${() => String(this.theme.value === t)}
              @click=${() => (this.theme.value = t)}
            >
              ${t}
            </button>`,
          )}
        </div>
        <button class="submit" ?disabled=${() => !this.draft.value.trim()}>题</button>
      </form>

      <div class="toolbar">
        <button type="button" class="link" @click=${shuffle}>打乱</button>
        <button type="button" class="link" @click=${reverse}>倒序</button>
        <label class="toggle">
          <input type="checkbox" .checked=${onlyFavorites} @change=${(e) => (onlyFavorites.value = e.target.checked)} />
          只看收藏
        </label>
        <span class="moves" aria-live="polite">
          ${() => (this.moves.value < 0 ? '' : html`本次只插入或移动了 <b>${this.moves.value}</b> 行，其余 DOM 原地未动`)}
        </span>
      </div>

      <ol class="list" data-ref="list">
        ${repeat(
          visible,
          (p) => p.id,
          (p) => html`
            <li class="row">
              <span class="theme" data-theme=${p.theme} aria-hidden="true">${p.theme}</span>
              <span class="text">${p.text}</span>
              <button
                type="button"
                class="fav"
                aria-pressed=${String(p.favorite)}
                aria-label=${p.favorite ? '取消收藏' : '收藏'}
                @click=${() => toggleFavorite(p.id)}
              >
                藏
              </button>
              <button type="button" class="remove" aria-label="删除" @click=${() => removePoem(p.id)}>×</button>
            </li>
          `,
        )}
      </ol>

      ${when(
        () => visible.value.length === 0,
        () => html`<p class="empty">${() => (onlyFavorites.value ? '还没有收藏的句子。' : '此处空空，题一句吧。')}</p>`,
      )}
    `;
  }

  mounted() {
    // 统计每次列表变化中真正被插入的 <li>（新建或移动），用来展示 repeat 的最少移动
    this.observeMutation(
      this.refs.list,
      (records) => {
        let count = 0;
        for (const record of records) for (const node of record.addedNodes) if (node.nodeName === 'LI') count++;
        this.moves.value = count;
      },
      { childList: true },
    );
  }

  submit(event) {
    event.preventDefault();
    const text = this.draft.value.trim();
    if (!text) return;
    addPoem(text, this.theme.value);
    this.draft.value = '';
  }
}

/** 另一个组件读取同一个 store：数据变化时两边同时更新 */
export class DemoPoemStats extends VunioElement {
  static tag = 'demo-poem-stats';

  static styles = css`
    :host {
      font-size: 13px;
      letter-spacing: 0.1em;
      color: #8b847a;
    }
    b {
      font-weight: 600;
      color: #b5352a;
    }
  `;

  render() {
    return html`共 <b>${() => stats.value.total}</b> 句 · 藏 <b>${() => stats.value.favorites}</b>`;
  }
}

DemoAnthology.define();
DemoPoemStats.define();
