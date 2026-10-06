// 新建 / 修改一首诗。表单组件直接放进原生 <form>，提交时读 FormData。
import { html } from '../../../src/index.js';
import { toast } from '../../../src/components/index.js';
import { router } from '../router.js';
import { addPoem, findPoem, updatePoem } from '../store.js';
import { styles, empty } from '../ui.js';

const DYNASTIES = ['先秦', '汉', '魏晋', '唐', '五代', '宋', '元', '明', '清', '近现代'];
const FORMS = ['诗', '词', '曲', '赋'];

/** 标签输入：逗号、顿号或空格分隔 */
const parseTags = (text) => [...new Set(text.split(/[,，、\s]+/).map((t) => t.trim()).filter(Boolean))];

export default ({ params }) => {
  const editing = params.id !== undefined;
  const poem = editing ? findPoem(Number(params.id)) : null;
  if (editing && !poem) {
    return html`${styles}
      <h1>找不到这首诗</h1>
      ${empty('它可能已经被删除了', html`<a href=${router.href('/')}>回到诗作列表</a>`)}`;
  }

  const submit = (event) => {
    event.preventDefault();
    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const fields = {
      title: String(data.title).trim(),
      author: String(data.author).trim(),
      dynasty: String(data.dynasty),
      form: String(data.form),
      tags: parseTags(String(data.tags ?? '')),
      text: String(data.text).trim(),
      notes: String(data.notes ?? '').trim(),
    };
    if (editing) {
      updatePoem(poem.id, fields);
      toast(`已保存《${fields.title}》`, { type: 'success' });
      router.navigate(`/poem/${poem.id}`);
    } else {
      const id = addPoem(fields);
      toast(`已收入《${fields.title}》`, { type: 'success' });
      router.navigate(`/poem/${id}`);
    }
  };

  return html`
    ${styles}
    <style>
      .editor {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--vn-space-2) var(--vn-space-5);
        max-inline-size: 720px;
      }
      .editor .wide {
        grid-column: 1 / -1;
      }
      .editor .buttons {
        display: flex;
        gap: var(--vn-space-3);
        margin-block-start: var(--vn-space-4);
      }
    </style>
    <div class="page-head"><h1>${editing ? `修改《${poem.title}》` : '新建'}</h1></div>
    <form class="editor" novalidate @submit=${submit}>
      <vn-input name="title" label="题目" value=${poem?.title ?? ''} required maxlength="30"></vn-input>
      <vn-input name="author" label="作者" value=${poem?.author ?? ''} required maxlength="20"></vn-input>
      <vn-select name="dynasty" label="朝代" value=${poem?.dynasty ?? '唐'}>
        ${DYNASTIES.map((d) => html`<option value=${d}>${d}</option>`)}
      </vn-select>
      <vn-radio-group name="form" label="体裁" value=${poem?.form ?? '诗'} direction="row">
        ${FORMS.map((f) => html`<vn-radio value=${f}>${f}</vn-radio>`)}
      </vn-radio-group>
      <vn-input class="wide" name="tags" label="标签" value=${poem?.tags.join('，') ?? ''} hint="用逗号或空格分隔，例如：月，思乡"></vn-input>
      <vn-textarea class="wide" name="text" label="正文" value=${poem?.text ?? ''} rows="4" autosize required hint="每句一行"></vn-textarea>
      <vn-textarea class="wide" name="notes" label="注释" value=${poem?.notes ?? ''} rows="2" autosize maxlength="300"></vn-textarea>
      <div class="buttons wide">
        <vn-button type="submit" variant="cinnabar" effect="blossom">${editing ? '保存' : '收入诗笺'}</vn-button>
        <vn-button variant="moon" @click=${() => history.back()}>取消</vn-button>
      </div>
    </form>
  `;
};
