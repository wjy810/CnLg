/**
 * Vunio —— 基于 Web Components 的风格化组件框架
 *
 *   import { VunioElement, html, signal, burst } from 'vunio';   核心 + 效果（无副作用）
 *   import 'vunio/components';                                   注册全部组件
 */
export * from './core/index.js';
export * from './effects/index.js';
export * from './router/index.js';

export const version = '0.1.0';
