import { VunioFormElement, html, css, signal, computed, repeat } from '../core/index.js';
import { fieldStyles } from './shared.js';

const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/**
 * <vn-select> 下拉选择。选项写成原生 <option>，面板放在顶层，不会被祖先裁掉。
 *
 * @attr {string} label - 标签
 * @attr {string} placeholder - 未选择时的文字，默认“请选择”
 * @attr {string} hint - 帮助文字
 * @attr {string} name - 表单字段名
 * @attr {string} value - 默认值（也可以在 <option> 上写 selected）
 * @attr {boolean} required - 必选
 * @attr {boolean} disabled - 禁用
 * @slot - <option> 列表（不直接显示）
 * @fires input - 选择时
 * @fires change - 选择时
 * @csspart trigger - 触发按钮（role=combobox）
 * @csspart panel - 选项面板（role=listbox）
 * @csspart option - 选项
 */
export class VnSelect extends VunioFormElement {
  static tag = 'vn-select';

  static props = {
    label: String,
    placeholder: { type: String, default: '请选择' },
    hint: String,
  };

  static styles = [
    fieldStyles,
    css`
      .trigger {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: space-between;
        gap: var(--vn-space-2);
        min-block-size: 40px;
        padding: 6px 2px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: var(--vn-font-size-lg);
        text-align: start;
        cursor: pointer;
        outline: none;
      }
      .trigger:disabled {
        cursor: not-allowed;
      }
      .value[data-placeholder] {
        color: var(--vn-fg-muted);
      }
      .chevron {
        flex: none;
        inline-size: 12px;
        block-size: 12px;
        fill: none;
        stroke: var(--vn-fg-muted);
        stroke-width: 1.6;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform var(--vn-duration-normal) var(--vn-ease-brush);
      }
      :host(:state(open)) .chevron {
        transform: rotate(180deg);
      }
      .control:has(.trigger:focus-visible) {
        outline: var(--vn-focus-ring);
        outline-offset: var(--vn-focus-offset);
      }

      .panel {
        box-sizing: border-box;
        margin: 0;
        padding: var(--vn-space-1);
        overflow: auto;
        max-block-size: 280px;
        border: var(--vn-border-thin) solid var(--vn-line);
        border-radius: var(--vn-radius-md);
        background: var(--vn-surface);
        color: var(--vn-fg);
        box-shadow: var(--vn-shadow-2);
        font-family: var(--vn-font-serif);
        z-index: var(--vn-z-dropdown);
      }
      /* 不支持 Popover API 时的退路：相对字段绝对定位 */
      .panel:not([popover]) {
        position: absolute;
        inset-block-start: calc(100% + 4px);
        inset-inline: 0;
      }
      :host(:not(:state(open))) .panel {
        display: none;
      }
      :host(:state(open)) .panel {
        animation: unroll var(--vn-duration-normal) var(--vn-ease-ink);
      }
      @keyframes unroll {
        from {
          clip-path: inset(0 0 100% 0);
          opacity: 0.4;
        }
        to {
          clip-path: inset(0 0 0 0);
          opacity: 1;
        }
      }
      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--vn-space-3);
        padding: var(--vn-space-2) var(--vn-space-3);
        border-radius: var(--vn-radius-sm);
        cursor: pointer;
        letter-spacing: var(--vn-tracking-wide);
      }
      .option[data-active] {
        background: var(--vn-surface-sunken);
      }
      .option[aria-selected='true'] {
        color: var(--vn-accent-fg);
      }
      .option[aria-selected='true']::after {
        content: '';
        inline-size: 6px;
        block-size: 6px;
        border-radius: 50%;
        background: var(--vn-accent);
      }
      .option[aria-disabled='true'] {
        color: var(--vn-fg-subtle);
        cursor: not-allowed;
      }
      .empty {
        padding: var(--vn-space-2) var(--vn-space-3);
        color: var(--vn-fg-muted);
      }
      .field {
        position: relative;
      }
    `,
  ];

  /** @type {import('../core/index.js').Signal<{ value: string, label: string, disabled: boolean, selected: boolean }[]>} */
  options = signal([]);
  open = signal(false);
  active = signal(-1);
  #selected = computed(() => this.options.value.find((o) => o.value === this.value) ?? null);
  #typeahead = { text: '', time: 0 };
  #closeListeners = [];

  render() {
    return html`
      <div class="field" part="field">
        <span class="label" id="label" part="label" ?hidden=${() => !this.label}>${() => this.label}</span>
        <span class="control">
          <button
            class="trigger"
            part="trigger"
            data-ref="trigger"
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-controls="listbox"
            aria-labelledby="label value"
            aria-describedby="message"
            aria-expanded=${() => String(this.open.value)}
            aria-activedescendant=${() => (this.open.value && this.active.value >= 0 ? `option-${this.active.value}` : null)}
            aria-required=${() => (this.required ? 'true' : null)}
            aria-invalid=${() => String(this.userInvalid)}
            ?disabled=${() => this.isDisabled}
            @click=${this.toggleOpen}
            @keydown=${this.handleKey}
          >
            <span class="value" id="value" data-placeholder=${() => (this.#selected.value ? null : '')}>
              ${() => this.#selected.value?.label ?? this.placeholder}
            </span>
            <svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
          </button>
          <span class="underline" aria-hidden="true"></span>
        </span>
        <div
          class="panel"
          part="panel"
          data-ref="panel"
          id="listbox"
          role="listbox"
          aria-labelledby="label"
          popover=${supportsPopover ? 'manual' : null}
          @pointerdown=${(e) => e.preventDefault()}
        >
          ${repeat(
            this.options,
            (o) => o.value,
            (o, i) => html`
              <div
                class="option"
                part="option"
                role="option"
                id=${`option-${i}`}
                aria-selected=${() => String(this.value === o.value)}
                aria-disabled=${o.disabled ? 'true' : null}
                data-active=${() => (this.active.value === i ? '' : null)}
                @pointermove=${() => (this.active.value = i)}
                @click=${() => this.choose(i)}
              >
                ${o.label}
              </div>
            `,
          )}
          ${() => (this.options.value.length ? null : html`<div class="empty">没有选项</div>`)}
        </div>
        <span class="message" id="message" part="message">${() => (this.userInvalid ? this.validationMessage : this.hint)}</span>
      </div>
    `;
  }

  mounted() {
    this.#readOptions();
    this.observeMutation(this, () => this.#readOptions(), {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    // 选中项变化时滚动到可见
    this.effect(() => {
      const index = this.active.value;
      if (!this.open.value || index < 0) return;
      this.root.getElementById(`option-${index}`)?.scrollIntoView({ block: 'nearest' });
    });
  }

  unmounted() {
    this.open.value = false;
    this.setState('open', false);
    this.#closeListeners = [];
  }

  /** 当前选中的选项 */
  get selectedOption() {
    return this.#selected.value;
  }

  show() {
    if (this.isDisabled || this.open.peek()) return;
    const options = this.options.peek();
    const selected = options.findIndex((o) => o.value === this.value);
    this.active.value = selected >= 0 ? selected : this.#nextEnabled(-1, 1);
    this.open.value = true;
    this.setState('open', true);
    const panel = this.refs.panel;
    if (supportsPopover) panel.showPopover();
    this.#position();
    const reposition = () => this.#position();
    this.#closeListeners = [
      this.on(window, 'resize', reposition),
      this.on(window, 'scroll', reposition, { capture: true, passive: true }),
      this.on(document, 'pointerdown', (event) => {
        if (!event.composedPath().includes(this)) this.close();
      }),
    ];
  }

  close() {
    if (!this.open.peek()) return;
    this.open.value = false;
    this.setState('open', false);
    if (supportsPopover && this.refs.panel.matches(':popover-open')) this.refs.panel.hidePopover();
    for (const off of this.#closeListeners) off();
    this.#closeListeners = [];
  }

  toggleOpen() {
    if (this.open.peek()) this.close();
    else this.show();
  }

  /** 选择第 index 个选项 */
  choose(index) {
    const option = this.options.peek()[index];
    if (!option || option.disabled) return;
    const changed = option.value !== this.value;
    this.value = option.value;
    this.close();
    this.refs.trigger.focus();
    if (changed) {
      this.emit('input');
      this.emit('change');
    }
  }

  handleKey(event) {
    const open = this.open.peek();
    const options = this.options.peek();
    // 按了方向键等非字符键：首字跳转重新开始计算
    if (event.key.length !== 1) this.#typeahead.text = '';
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) return this.show();
        this.active.value = this.#nextEnabled(this.active.peek(), event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      case 'Home':
      case 'End':
        if (!open) return;
        event.preventDefault();
        this.active.value = event.key === 'Home' ? this.#nextEnabled(-1, 1) : this.#nextEnabled(options.length, -1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open && this.active.peek() >= 0) this.choose(this.active.peek());
        else if (!open) this.show();
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        return;
      case 'Tab':
        this.close();
        return;
    }
    // 输入首字跳转
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = performance.now();
      const state = this.#typeahead;
      state.text = now - state.time < 600 ? state.text + event.key : event.key;
      state.time = now;
      const query = state.text.toLowerCase();
      const start = open ? this.active.peek() : options.findIndex((o) => o.value === this.value);
      for (let step = 1; step <= options.length; step++) {
        const i = (start + step + options.length) % options.length;
        if (!options[i].disabled && options[i].label.toLowerCase().startsWith(query)) {
          if (open) this.active.value = i;
          else this.choose(i);
          break;
        }
      }
    }
  }

  validate() {
    if (this.required && !this.value) return { flags: { valueMissing: true }, message: '请选择一项' };
    return null;
  }

  resetValue() {
    this.value = this.getAttribute('value') ?? this.options.peek().find((o) => o.selected)?.value ?? '';
  }

  get validationAnchor() {
    return this.refs.trigger;
  }

  #nextEnabled(from, step) {
    const options = this.options.peek();
    for (let i = from + step; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return i;
    return from >= 0 && from < options.length ? from : -1;
  }

  #readOptions() {
    const options = [...this.querySelectorAll('option')].map((o) => ({
      value: o.value,
      label: o.label || o.textContent.trim(),
      disabled: o.disabled,
      selected: o.hasAttribute('selected'),
    }));
    this.options.value = options;
    // 没有写 value 时，用带 selected 的选项作为初始值
    if (!this.hasAttribute('value') && this.value === '') {
      const preset = options.find((o) => o.selected);
      if (preset) this.value = preset.value;
    }
  }

  #position() {
    const panel = this.refs.panel;
    if (!supportsPopover) return;
    const rect = this.refs.trigger.closest('.control').getBoundingClientRect();
    const gap = 4;
    const height = panel.offsetHeight;
    const below = window.innerHeight - rect.bottom - gap;
    const top = below < height && rect.top > height ? rect.top - gap - height : rect.bottom + gap;
    Object.assign(panel.style, {
      position: 'fixed',
      inset: 'auto',
      top: `${Math.max(gap, top)}px`,
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`,
    });
  }
}

VnSelect.define();
