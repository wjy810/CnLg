import { VunioElement, html, css, signal, computed, repeat } from '../core/index.js';

/**
 * <vn-tabs> 标签页：一组 <vn-tab-panel>，一次显示一页。
 * 键盘遵循 WAI-ARIA APG「Tabs（自动激活）」：← → 切换并显示，Home / End 到两端，Tab 进入面板。
 * 标签、面板都在自己的 Shadow 根里（面板内容通过手动分配的插槽投进来），读屏关联完整。
 *
 * @attr {string} value - 当前页的 name；默认第一个可用的页
 * @attr {string} label - 标签列表的读屏名称
 * @slot - <vn-tab-panel>
 * @fires vn-change - 切换后，detail.value 为新页的 name
 * @csspart tablist - 标签列表
 * @csspart tab - 每个标签
 * @csspart indicator - 当前标签下的线
 * @csspart panel - 面板
 */
export class VnTabs extends VunioElement {
  static tag = 'vn-tabs';
  /** @type {ShadowRootInit} */
  static shadowOptions = { mode: 'open', slotAssignment: 'manual' };

  static props = {
    value: String,
    label: String,
  };

  static styles = css`
    :host {
      display: block;
      color: var(--vn-fg);
    }
    .tablist {
      position: relative;
      display: flex;
      gap: var(--vn-space-1);
      overflow-x: auto;
      border-block-end: var(--vn-border-thin) solid var(--vn-line);
      scrollbar-width: none;
    }
    .tab {
      flex: none;
      padding: var(--vn-space-2) var(--vn-space-4);
      border: 0;
      background: none;
      color: var(--vn-fg-muted);
      font: inherit;
      letter-spacing: var(--vn-tracking-wide);
      cursor: pointer;
      transition: color var(--vn-duration-fast) var(--vn-ease-standard);
    }
    .tab:hover:not(:disabled) {
      color: var(--vn-fg);
    }
    .tab[aria-selected='true'] {
      color: var(--vn-fg);
      font-weight: var(--vn-weight-medium);
    }
    .tab:disabled {
      color: var(--vn-fg-subtle);
      cursor: not-allowed;
    }
    .tab:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: -4px;
    }
    /* 当前标签下的一道线，切换时滑过去 */
    .indicator {
      position: absolute;
      inset-block-end: -1px;
      inset-inline-start: 0;
      block-size: 5px;
      inline-size: var(--_w, 0);
      translate: var(--_x, 0) 0;
      background: var(--vn-accent);
      -webkit-mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      mask: var(--vn-mask-stroke) center / 100% 100% no-repeat;
      pointer-events: none;
    }
    /* 第一次定位不播动画，之后切换时才滑过去 */
    :host(:state(settled)) .indicator {
      transition:
        translate var(--vn-duration-normal) var(--vn-ease-move),
        inline-size var(--vn-duration-normal) var(--vn-ease-move);
    }
    .panel {
      padding-block: var(--vn-space-4);
      outline: none;
    }
    .panel:focus-visible {
      outline: var(--vn-focus-ring);
      outline-offset: 2px;
    }
  `;

  /** 子元素中的面板 */
  panels = signal(/** @type {VnTabPanel[]} */ ([]));

  /** 当前显示的面板 */
  current = computed(() => {
    const panels = this.panels.value;
    const enabled = panels.filter((p) => !p.disabled);
    return enabled.find((p) => p.name === this.value) ?? enabled[0] ?? null;
  });

  render() {
    return html`
      <div class="tablist" part="tablist" role="tablist" aria-label=${() => this.label || null} data-ref="tablist" @keydown=${this.handleKeydown}>
        ${repeat(
          this.panels,
          (panel) => panel,
          (panel, i) => html`
            <button
              type="button"
              class="tab"
              part="tab"
              role="tab"
              id=${`tab-${i}`}
              aria-controls=${`panel-${i}`}
              aria-selected=${() => String(this.current.value === panel)}
              tabindex=${() => (this.current.value === panel ? '0' : '-1')}
              ?disabled=${() => panel.disabled}
              @click=${() => this.select(panel)}
            >
              ${() => panel.label}
            </button>
          `,
        )}
        <span class="indicator" part="indicator" data-ref="indicator" aria-hidden="true"></span>
      </div>
      ${repeat(
        this.panels,
        (panel) => panel,
        (panel, i) => html`
          <div class="panel" part="panel" role="tabpanel" id=${`panel-${i}`} aria-labelledby=${`tab-${i}`} tabindex="0" ?hidden=${() => this.current.value !== panel}>
            <slot data-index=${i}></slot>
          </div>
        `,
      )}
    `;
  }

  mounted() {
    this.collect();
    this.observeMutation(this, () => this.collect(), { childList: true });
    // 分配插槽、测量下划线都放在微任务里：组件可能是在别的 effect 里渲染的（例如路由页面），
    // 那时插槽和标签要等这一轮更新结束才出现；而插槽必须已经在 Shadow 树里，assign() 才生效
    this.effect(() => {
      const panels = this.panels.value;
      queueMicrotask(() => {
        for (const slot of this.root.querySelectorAll('slot[data-index]')) {
          const panel = panels[Number(/** @type {HTMLElement} */ (slot).dataset.index)];
          if (panel && !slot.assignedNodes().includes(panel)) /** @type {HTMLSlotElement} */ (slot).assign(panel);
        }
      });
    });
    this.effect(() => {
      this.current.value;
      this.panels.value;
      queueMicrotask(() => this.#moveIndicator());
    });
    // 标签尺寸变化（字体加载、窗口变化）时重新测量
    this.observeResize(this.refs.tablist, () => this.#moveIndicator());
  }

  collect() {
    this.panels.value = [...this.children].filter((el) => el instanceof VnTabPanel);
  }

  /** 切换到某一页 */
  select(panel) {
    if (!panel || panel.disabled || this.current.peek() === panel) return;
    this.value = panel.name;
    this.emit('vn-change', { value: panel.name });
  }

  handleKeydown(event) {
    const tabs = [...this.root.querySelectorAll('[role=tab]')];
    const index = tabs.indexOf(/** @type {Element} */ (event.target));
    if (index < 0) return;
    const panels = this.panels.peek();
    const enabled = panels.filter((p) => !p.disabled);
    if (!enabled.length) return;
    const position = enabled.indexOf(panels[index]);
    const target = {
      ArrowRight: enabled[(position + 1) % enabled.length],
      ArrowLeft: enabled[(position - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled.at(-1),
    }[event.key];
    if (!target) return;
    event.preventDefault();
    this.select(target);
    tabs[panels.indexOf(target)]?.focus();
  }

  #moveIndicator() {
    const current = this.current.peek();
    const index = this.panels.peek().indexOf(current);
    const tab = /** @type {HTMLElement | undefined} */ (this.root.querySelectorAll('[role=tab]')[index]);
    const indicator = this.refs.indicator;
    if (!indicator) return;
    indicator.style.setProperty('--_x', tab ? `${tab.offsetLeft}px` : '0');
    indicator.style.setProperty('--_w', tab ? `${tab.offsetWidth}px` : '0');
    if (tab && !this.hasState('settled')) {
      // 第一次定位：先让位置生效，再打开过渡，之后的切换才滑过去
      void getComputedStyle(indicator).inlineSize;
      this.setState('settled', true);
    }
  }
}

/**
 * <vn-tab-panel> 标签页中的一页，放在 <vn-tabs> 里。
 *
 * @attr {string} name - 页的名字（<vn-tabs value> 用它选择）
 * @attr {string} label - 标签上的文字
 * @attr {boolean} disabled - 禁用
 * @slot - 内容
 */
export class VnTabPanel extends VunioElement {
  static tag = 'vn-tab-panel';

  static props = {
    name: String,
    label: String,
    disabled: Boolean,
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

VnTabPanel.define();
VnTabs.define();
