// 由 scripts/build-docs.js 根据组件源码的 JSDoc 生成，请勿手改。
export const api = {
  "vn-button": {
    "file": "src/components/button.js",
    "tag": "vn-button",
    "summary": "按钮。默认墨色；朱砂色只给一个视图里最重要的操作。",
    "attrs": [
      {
        "name": "variant",
        "type": "'ink'|'cinnabar'|'moon'|'text'",
        "description": "墨 · 朱砂 · 月白（描边）· 素（文字），默认 ink"
      },
      {
        "name": "size",
        "type": "'sm'|'md'|'lg'",
        "description": "尺寸，默认 md"
      },
      {
        "name": "effect",
        "type": "string",
        "description": "点击效果：auto（默认，由主题的 --vn-effect 决定：古风墨晕、赛博故障）、ink、blossom、snow、wind、glitch、spark、none，或 registerBurst 注册的名字"
      },
      {
        "name": "type",
        "type": "'button'|'submit'|'reset'",
        "description": "在表单中的作用，默认 button"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      },
      {
        "name": "loading",
        "type": "boolean",
        "description": "加载中：禁止点击并显示墨圈"
      },
      {
        "name": "block",
        "type": "boolean",
        "description": "占满一行"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "文字"
      },
      {
        "name": "prefix",
        "description": "前置图标"
      },
      {
        "name": "suffix",
        "description": "后置图标"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "button",
        "description": "内部的原生按钮"
      }
    ],
    "cssprops": []
  },
  "vn-card": {
    "file": "src/components/card.js",
    "tag": "vn-card",
    "summary": "卡片：一张纸、一幅古籍边框，或只是一块留白。",
    "attrs": [
      {
        "name": "variant",
        "type": "'paper'|'frame'|'plain'",
        "description": "纸片 · 古籍双线框 · 无底，默认 paper"
      },
      {
        "name": "padding",
        "type": "'sm'|'md'|'lg'",
        "description": "内边距，默认 md"
      },
      {
        "name": "interactive",
        "type": "boolean",
        "description": "悬停时浮起"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "标题"
      },
      {
        "name": "extra",
        "description": "右上角的操作"
      },
      {
        "name": "",
        "description": "正文"
      },
      {
        "name": "footer",
        "description": "底部操作"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "card",
        "description": "卡片容器"
      }
    ],
    "cssprops": []
  },
  "vn-checkbox": {
    "file": "src/components/checkbox.js",
    "tag": "vn-checkbox",
    "summary": "复选框。勾是一笔朱批，选中时一笔画出。",
    "attrs": [
      {
        "name": "checked",
        "type": "boolean",
        "description": "是否选中"
      },
      {
        "name": "value",
        "type": "string",
        "description": "选中时提交的值，默认 on"
      },
      {
        "name": "name",
        "type": "string",
        "description": "表单字段名"
      },
      {
        "name": "required",
        "type": "boolean",
        "description": "必须勾选"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "标签文字"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "切换时"
      },
      {
        "name": "change",
        "description": "切换时"
      }
    ],
    "parts": [
      {
        "name": "control",
        "description": "可聚焦的整体（role=checkbox）"
      },
      {
        "name": "box",
        "description": "方框"
      }
    ],
    "cssprops": []
  },
  "vn-divider": {
    "file": "src/components/divider.js",
    "tag": "vn-divider",
    "summary": "分隔线。默认是一道两头尖的笔触，可以在中间写字。",
    "attrs": [
      {
        "name": "variant",
        "type": "'brush'|'line'|'dashed'",
        "description": "笔触 · 细线 · 虚线，默认 brush"
      },
      {
        "name": "vertical",
        "type": "boolean",
        "description": "竖向"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "居中的文字"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "line",
        "description": "线"
      }
    ],
    "cssprops": []
  },
  "vn-heading": {
    "file": "src/components/heading.js",
    "tag": "vn-heading",
    "summary": "标题。1–3 级用毛笔字，可盖一方朱印、可竖排。",
    "attrs": [
      {
        "name": "level",
        "type": "number",
        "description": "层级 1–6，默认 2"
      },
      {
        "name": "seal",
        "type": "string",
        "description": "印章文字，如 \"雅\""
      },
      {
        "name": "sub",
        "type": "string",
        "description": "副标题"
      },
      {
        "name": "vertical",
        "type": "boolean",
        "description": "竖排（从右往左）"
      },
      {
        "name": "plain",
        "type": "boolean",
        "description": "不用毛笔字"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "标题文字"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "heading",
        "description": "标题"
      },
      {
        "name": "seal",
        "description": "印章"
      },
      {
        "name": "sub",
        "description": "副标题"
      }
    ],
    "cssprops": []
  },
  "vn-input": {
    "file": "src/components/input.js",
    "tag": "vn-input",
    "summary": "输入框：信笺式下划线，聚焦时一道笔触从中间展开。",
    "attrs": [
      {
        "name": "label",
        "type": "string",
        "description": "标签"
      },
      {
        "name": "placeholder",
        "type": "string",
        "description": "占位文字"
      },
      {
        "name": "hint",
        "type": "string",
        "description": "帮助文字（出错时被错误信息替换）"
      },
      {
        "name": "type",
        "type": "'text'|'password'|'email'|'url'|'tel'|'search'|'number'",
        "description": "类型，默认 text"
      },
      {
        "name": "name",
        "type": "string",
        "description": "表单字段名"
      },
      {
        "name": "value",
        "type": "string",
        "description": "默认值"
      },
      {
        "name": "required",
        "type": "boolean",
        "description": "必填"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      },
      {
        "name": "readonly",
        "type": "boolean",
        "description": "只读"
      },
      {
        "name": "minlength",
        "type": "number",
        "description": "最少字数"
      },
      {
        "name": "maxlength",
        "type": "number",
        "description": "最多字数（显示字数统计）"
      },
      {
        "name": "pattern",
        "type": "string",
        "description": "正则"
      },
      {
        "name": "clearable",
        "type": "boolean",
        "description": "显示清除按钮"
      },
      {
        "name": "autocomplete",
        "type": "string",
        "description": "透传"
      },
      {
        "name": "inputmode",
        "type": "string",
        "description": "透传"
      }
    ],
    "slots": [
      {
        "name": "prefix",
        "description": "前置内容"
      },
      {
        "name": "suffix",
        "description": "后置内容"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "输入时"
      },
      {
        "name": "change",
        "description": "提交修改时"
      }
    ],
    "parts": [
      {
        "name": "input",
        "description": "内部的原生 input"
      },
      {
        "name": "label",
        "description": "标签"
      },
      {
        "name": "message",
        "description": "提示 / 错误"
      }
    ],
    "cssprops": []
  },
  "vn-loading": {
    "file": "src/components/loading.js",
    "tag": "vn-loading",
    "summary": "加载：一滴墨入水，涟漪一圈圈散开。",
    "attrs": [
      {
        "name": "size",
        "type": "'sm'|'md'|'lg'",
        "description": "尺寸，默认 md"
      },
      {
        "name": "label",
        "type": "string",
        "description": "文字（也是读屏文字），默认“加载中”"
      },
      {
        "name": "quiet",
        "type": "boolean",
        "description": "不显示文字（读屏仍会读）"
      }
    ],
    "slots": [],
    "events": [],
    "parts": [
      {
        "name": "drop",
        "description": "墨滴"
      }
    ],
    "cssprops": []
  },
  "vn-modal": {
    "file": "src/components/modal.js",
    "tag": "vn-modal",
    "summary": "弹窗：一幅立轴，打开时从中间向上下展开。基于原生 <dialog>。",
    "attrs": [
      {
        "name": "heading",
        "type": "string",
        "description": "标题"
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "是否打开"
      },
      {
        "name": "persistent",
        "type": "boolean",
        "description": "点遮罩、按 Esc 不关闭"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "正文"
      },
      {
        "name": "footer",
        "description": "底部操作"
      }
    ],
    "events": [
      {
        "name": "vn-open",
        "description": "打开后"
      },
      {
        "name": "vn-close",
        "description": "关闭后，detail.returnValue 为关闭原因：'esc' | 'backdrop' | 'close-button' | 传给 close() 的值"
      }
    ],
    "parts": [
      {
        "name": "dialog",
        "description": "原生 dialog"
      },
      {
        "name": "paper",
        "description": "纸面"
      },
      {
        "name": "heading",
        "description": "标题"
      },
      {
        "name": "body",
        "description": "正文"
      },
      {
        "name": "footer",
        "description": "底部"
      }
    ],
    "cssprops": []
  },
  "vn-select": {
    "file": "src/components/select.js",
    "tag": "vn-select",
    "summary": "下拉选择。选项写成原生 <option>，面板放在顶层，不会被祖先裁掉。",
    "attrs": [
      {
        "name": "label",
        "type": "string",
        "description": "标签"
      },
      {
        "name": "placeholder",
        "type": "string",
        "description": "未选择时的文字，默认“请选择”"
      },
      {
        "name": "hint",
        "type": "string",
        "description": "帮助文字"
      },
      {
        "name": "name",
        "type": "string",
        "description": "表单字段名"
      },
      {
        "name": "value",
        "type": "string",
        "description": "默认值（也可以在 <option> 上写 selected）"
      },
      {
        "name": "required",
        "type": "boolean",
        "description": "必选"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "<option> 列表（不直接显示）"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "选择时"
      },
      {
        "name": "change",
        "description": "选择时"
      }
    ],
    "parts": [
      {
        "name": "trigger",
        "description": "触发按钮（role=combobox）"
      },
      {
        "name": "panel",
        "description": "选项面板（role=listbox）"
      },
      {
        "name": "option",
        "description": "选项"
      }
    ],
    "cssprops": []
  },
  "vn-sky": {
    "file": "src/components/sky.js",
    "tag": "vn-sky",
    "summary": "天气背景：雪、花、风、雨，可选一轮月亮。铺满最近的定位祖先，不响应指针。",
    "attrs": [
      {
        "name": "weather",
        "type": "'snow'|'blossom'|'wind'|'rain'|'none'",
        "description": "天气，默认 snow"
      },
      {
        "name": "density",
        "type": "number",
        "description": "粒子密度倍数 0–3，默认 1"
      },
      {
        "name": "wind",
        "type": "number",
        "description": "横向风力 -1（向左）… 1（向右），默认 0"
      },
      {
        "name": "moon",
        "type": "boolean",
        "description": "显示月亮"
      },
      {
        "name": "fixed",
        "type": "boolean",
        "description": "固定铺满视口"
      }
    ],
    "slots": [],
    "events": [],
    "parts": [
      {
        "name": "canvas",
        "description": "粒子画布"
      },
      {
        "name": "moon",
        "description": "月亮"
      }
    ],
    "cssprops": []
  },
  "vn-stack": {
    "file": "src/components/stack.js",
    "tag": "vn-stack",
    "summary": "布局：纵向或横向排列子元素，间距取自主题。",
    "attrs": [
      {
        "name": "direction",
        "type": "'column'|'row'",
        "description": "方向，默认 column"
      },
      {
        "name": "gap",
        "type": "number",
        "description": "间距 0–9（对应 --vn-space-*），默认 4"
      },
      {
        "name": "align",
        "type": "'start'|'center'|'end'|'stretch'|'baseline'",
        "description": "交叉轴对齐，默认 stretch"
      },
      {
        "name": "justify",
        "type": "'start'|'center'|'end'|'between'|'around'",
        "description": "主轴对齐，默认 start"
      },
      {
        "name": "wrap",
        "type": "boolean",
        "description": "换行"
      },
      {
        "name": "inline",
        "type": "boolean",
        "description": "行内"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "子元素"
      }
    ],
    "events": [],
    "parts": [],
    "cssprops": []
  },
  "vn-switch": {
    "file": "src/components/switch.js",
    "tag": "vn-switch",
    "summary": "开关。滑块是一枚玉璧；variant=\"moon\" 时关为日、开为月。",
    "attrs": [
      {
        "name": "checked",
        "type": "boolean",
        "description": "是否打开"
      },
      {
        "name": "variant",
        "type": "'default'|'moon'",
        "description": "外观，默认 default"
      },
      {
        "name": "value",
        "type": "string",
        "description": "打开时提交的值，默认 on"
      },
      {
        "name": "name",
        "type": "string",
        "description": "表单字段名"
      },
      {
        "name": "required",
        "type": "boolean",
        "description": "必须打开"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "标签文字"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "切换时"
      },
      {
        "name": "change",
        "description": "切换时"
      }
    ],
    "parts": [
      {
        "name": "control",
        "description": "可聚焦的整体（role=switch）"
      },
      {
        "name": "track",
        "description": "轨道"
      },
      {
        "name": "thumb",
        "description": "滑块"
      }
    ],
    "cssprops": []
  },
  "vn-toaster": {
    "file": "src/components/toast.js",
    "tag": "vn-toaster",
    "summary": "消息容器。一般不直接使用，而是调用 toast()。放在顶层（Popover API），因此也会显示在打开的弹窗之上。",
    "attrs": [],
    "slots": [],
    "events": [],
    "parts": [],
    "cssprops": []
  }
};
