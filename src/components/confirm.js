import { VnModal } from './modal.js';
import './button.js';

/**
 * 确认框：基于 <vn-modal>，返回 Promise<boolean>。确认为 true，取消、Esc、点遮罩为 false。
 * 焦点先落在“取消”上，误按回车不会执行危险操作。
 *
 *   if (await confirm({ heading: '删除这首诗？', message: '删除后不能恢复。', confirmText: '删除', danger: true })) …
 *
 * @param {{ heading?: string, message?: string, confirmText?: string, cancelText?: string, danger?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export function confirm({ heading = '确认', message = '', confirmText = '确定', cancelText = '取消', danger = false } = {}) {
  const modal = /** @type {VnModal} */ (document.createElement('vn-modal'));
  modal.heading = heading;
  const body = document.createElement('p');
  body.style.margin = '0';
  body.textContent = message;
  const cancel = Object.assign(document.createElement('vn-button'), { variant: 'moon', textContent: cancelText });
  const ok = Object.assign(document.createElement('vn-button'), { variant: danger ? 'cinnabar' : 'ink', textContent: confirmText });
  cancel.slot = ok.slot = 'footer';
  cancel.addEventListener('click', () => modal.close('cancel'));
  ok.addEventListener('click', () => modal.close('confirm'));
  modal.append(body, cancel, ok);
  document.body.append(modal);

  return new Promise((resolve) => {
    modal.addEventListener(
      'vn-close',
      (event) => {
        resolve(/** @type {CustomEvent} */ (event).detail.returnValue === 'confirm');
        modal.remove();
      },
      { once: true },
    );
    modal.show();
    cancel.focus();
  });
}
