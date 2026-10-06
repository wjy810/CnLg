import { VunioFormElement } from '../core/index.js';

/**
 * 复选框、开关共用的基类：checked 状态、表单值、键盘操作。
 *
 * - checked attribute 反映当前状态；第一次挂载时的状态是“默认状态”，form.reset() 时恢复
 * - 选中时提交 value（默认 "on"），未选中不提交
 * - 子类在 render() 中把 @click=${this.toggle}、@keydown=${this.handleKey} 绑到可聚焦的元素上
 */
export class ToggleElement extends VunioFormElement {
  static props = {
    checked: Boolean,
  };

  #defaultChecked = null;

  connectedCallback() {
    this.#defaultChecked ??= this.hasAttribute('checked');
    super.connectedCallback();
  }

  mounted() {
    // checked 变化时同步表单值与校验
    this.effect(() => {
      this.checked;
      this.syncForm();
    });
  }

  formValue() {
    return this.checked ? this.value || 'on' : null;
  }

  isEmpty() {
    return !(this.checked);
  }

  validate() {
    if (this.required && this.isEmpty()) {
      return { flags: { valueMissing: true }, message: '请勾选此项' };
    }
    return null;
  }

  resetValue() {
    this.checked = this.#defaultChecked;
  }

  formStateRestoreCallback(state) {
    this.checked = state != null;
  }

  /** 切换并派发 input / change */
  toggle() {
    if (this.isDisabled || this.readonly) return;
    this.checked = !(this.checked);
    this.emit('input');
    this.emit('change');
  }

  handleKey(event) {
    // 与原生复选框一致：空格切换
    if (event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }
}
