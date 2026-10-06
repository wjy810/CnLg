// 设置：主题、昼夜、正文字号、恢复示例数据
import { html } from '../../../src/index.js';
import { confirm, toast } from '../../../src/components/index.js';
import { THEMES, MODES, theme, mode, setTheme, setMode } from '../../stores/theme.js';
import { fontScale, resetPoems } from '../store.js';
import { styles } from '../ui.js';

export default () => {
  const reset = async () => {
    const ok = await confirm({ heading: '恢复示例数据？', message: '你新建、修改、收藏的内容都会丢失。', confirmText: '恢复', danger: true });
    if (!ok) return;
    resetPoems();
    toast('已恢复示例数据', { type: 'success' });
  };

  return html`
    ${styles}
    <style>
      .settings {
        display: grid;
        gap: var(--vn-space-6);
        max-inline-size: 520px;
      }
      .preview {
        margin: var(--vn-space-2) 0 0;
        font-family: var(--vn-font-quote);
        font-size: calc(var(--vn-font-size-xl) * var(--app-poem-scale, 1));
      }
    </style>
    <div class="page-head"><h1>设置</h1></div>
    <div class="settings">
      <vn-radio-group label="主题" .value=${theme} direction="row" @change=${(e) => setTheme(e.target.value)}>
        ${THEMES.map(([value, label]) => html`<vn-radio value=${value}>${label}</vn-radio>`)}
      </vn-radio-group>
      <vn-radio-group label="昼夜" .value=${mode} direction="row" @change=${(e) => setMode(e.target.value)}>
        ${MODES.map(([value, label]) => html`<vn-radio value=${value}>${value === 'auto' ? '跟随系统' : label}</vn-radio>`)}
      </vn-radio-group>
      <div>
        <vn-slider label="正文字号" min="0.8" max="1.6" step="0.1" .value=${fontScale} unit=" 倍" @input=${(e) => (fontScale.value = Number(e.target.value))}></vn-slider>
        <p class="preview">床前明月光，疑是地上霜。</p>
      </div>
      <vn-divider></vn-divider>
      <div>
        <vn-button variant="moon" @click=${reset}>恢复示例数据</vn-button>
      </div>
    </div>
  `;
};
