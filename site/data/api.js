// 由 scripts/build-docs.js 根据组件源码的 JSDoc 生成，请勿手改。
export const api = {
  "vn-breadcrumb": {
    "file": "src/components/breadcrumb.js",
    "tag": "vn-breadcrumb",
    "summary": "面包屑：当前页在网站中的位置。最后一项是当前页。",
    "attrs": [
      {
        "name": "label",
        "type": "string",
        "description": "读屏名称，默认“面包屑”"
      },
      {
        "name": "separator",
        "type": "string",
        "description": "分隔符，默认 /"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "<vn-breadcrumb-item>"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "list",
        "description": "列表"
      }
    ],
    "cssprops": []
  },
  "vn-breadcrumb-item": {
    "file": "src/components/breadcrumb.js",
    "tag": "vn-breadcrumb-item",
    "summary": "面包屑中的一项。",
    "attrs": [
      {
        "name": "href",
        "type": "string",
        "description": "链接地址；当前页（最后一项）不显示为链接"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "文字"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "link",
        "description": "链接"
      },
      {
        "name": "current",
        "description": "当前页的文字"
      },
      {
        "name": "separator",
        "description": "分隔符"
      }
    ],
    "cssprops": []
  },
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
  "vn-collapse": {
    "file": "src/components/collapse.js",
    "tag": "vn-collapse",
    "summary": "折叠面板：一组 <vn-collapse-item>。accordion 时同一时间只展开一项。",
    "attrs": [
      {
        "name": "accordion",
        "type": "boolean",
        "description": "手风琴：展开一项时收起其他项"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "<vn-collapse-item>"
      }
    ],
    "events": [],
    "parts": [],
    "cssprops": []
  },
  "vn-collapse-item": {
    "file": "src/components/collapse.js",
    "tag": "vn-collapse-item",
    "summary": "折叠面板中的一项：原生 <details> / <summary>，键盘、读屏、页内查找都由浏览器负责。",
    "attrs": [
      {
        "name": "heading",
        "type": "string",
        "description": "标题"
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "是否展开"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "内容"
      },
      {
        "name": "heading",
        "description": "标题（代替 heading 属性，可以放图标等）"
      }
    ],
    "events": [
      {
        "name": "vn-toggle",
        "description": "展开或收起后，detail.open"
      }
    ],
    "parts": [
      {
        "name": "summary",
        "description": "标题行"
      },
      {
        "name": "content",
        "description": "内容"
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
  "vn-pagination": {
    "file": "src/components/pagination.js",
    "tag": "vn-pagination",
    "summary": "分页：上一页、页码、下一页。页数多时折叠为省略号。",
    "attrs": [
      {
        "name": "total",
        "type": "number",
        "description": "总条数"
      },
      {
        "name": "page-size",
        "type": "number",
        "description": "每页条数，默认 10"
      },
      {
        "name": "page",
        "type": "number",
        "description": "当前页（从 1 开始），默认 1"
      },
      {
        "name": "siblings",
        "type": "number",
        "description": "当前页两侧显示的页码数，默认 1"
      },
      {
        "name": "label",
        "type": "string",
        "description": "读屏名称，默认“分页”"
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "vn-change",
        "description": "换页后，detail.page 为新页码"
      }
    ],
    "parts": [
      {
        "name": "list",
        "description": "列表"
      },
      {
        "name": "page",
        "description": "页码按钮"
      },
      {
        "name": "prev",
        "description": "上一页"
      },
      {
        "name": "next",
        "description": "下一页"
      }
    ],
    "cssprops": []
  },
  "vn-progress": {
    "file": "src/components/progress.js",
    "tag": "vn-progress",
    "summary": "进度：一道逐渐写满的线。没有 value 时是不确定进度，一小段来回游走。线的形状来自主题（--vn-mask-stroke）：古风是笔触，赛博是分段的灯条。",
    "attrs": [
      {
        "name": "value",
        "type": "number",
        "description": "当前值；不写为不确定进度"
      },
      {
        "name": "max",
        "type": "number",
        "description": "最大值，默认 1"
      },
      {
        "name": "label",
        "type": "string",
        "description": "读屏名称（也显示在上方），默认“进度”"
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
        "name": "track",
        "description": "轨道"
      },
      {
        "name": "fill",
        "description": "已完成的部分"
      }
    ],
    "cssprops": []
  },
  "vn-radio-group": {
    "file": "src/components/radio.js",
    "tag": "vn-radio-group",
    "summary": "单选：一组 <vn-radio> 中选一个。值在组上，直接放进 <form>。键盘遵循 WAI-ARIA APG「Radio Group」：组内只有一个可聚焦的选项，方向键移动并选中。",
    "attrs": [
      {
        "name": "label",
        "type": "string",
        "description": "标签（也是读屏名称）"
      },
      {
        "name": "hint",
        "type": "string",
        "description": "帮助文字（出错时被错误信息替换）"
      },
      {
        "name": "name",
        "type": "string",
        "description": "表单字段名"
      },
      {
        "name": "value",
        "type": "string",
        "description": "默认选中的值"
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
      },
      {
        "name": "direction",
        "type": "'column'|'row'",
        "description": "排列方向，默认 column"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "<vn-radio>"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "选中项变化时"
      },
      {
        "name": "change",
        "description": "选中项变化时"
      }
    ],
    "parts": [
      {
        "name": "label",
        "description": "标签"
      },
      {
        "name": "options",
        "description": "选项容器"
      },
      {
        "name": "message",
        "description": "提示 / 错误"
      }
    ],
    "cssprops": []
  },
  "vn-radio": {
    "file": "src/components/radio.js",
    "tag": "vn-radio",
    "summary": "单选中的一项，放在 <vn-radio-group> 里。",
    "attrs": [
      {
        "name": "value",
        "type": "string",
        "description": "选中时组的值"
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
        "description": "文字"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "control",
        "description": "圆点"
      },
      {
        "name": "label",
        "description": "文字"
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
  "vn-slider": {
    "file": "src/components/slider.js",
    "tag": "vn-slider",
    "summary": "滑块：在一段范围里取一个数。轨道是主题的线条（--vn-mask-stroke），已选部分填强调色。键盘遵循 WAI-ARIA APG「Slider」；事件与原生 <input type=range> 一致：拖动中 input，松手 change。",
    "attrs": [
      {
        "name": "label",
        "type": "string",
        "description": "标签（也是读屏名称）"
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
        "type": "number",
        "description": "默认值；不写时取范围的中点"
      },
      {
        "name": "min",
        "type": "number",
        "description": "最小值，默认 0"
      },
      {
        "name": "max",
        "type": "number",
        "description": "最大值，默认 100"
      },
      {
        "name": "step",
        "type": "number",
        "description": "步长，默认 1"
      },
      {
        "name": "unit",
        "type": "string",
        "description": "显示在数值后面的单位，如 %"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "禁用"
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "input",
        "description": "值变化时（拖动中也会触发）"
      },
      {
        "name": "change",
        "description": "松手或按键后"
      }
    ],
    "parts": [
      {
        "name": "track",
        "description": "轨道"
      },
      {
        "name": "fill",
        "description": "已选部分"
      },
      {
        "name": "thumb",
        "description": "滑块（role=slider）"
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
  "vn-tabs": {
    "file": "src/components/tabs.js",
    "tag": "vn-tabs",
    "summary": "标签页：一组 <vn-tab-panel>，一次显示一页。键盘遵循 WAI-ARIA APG「Tabs（自动激活）」：← → 切换并显示，Home / End 到两端，Tab 进入面板。标签、面板都在自己的 Shadow 根里（面板内容通过手动分配的插槽投进来），读屏关联完整。",
    "attrs": [
      {
        "name": "value",
        "type": "string",
        "description": "当前页的 name；默认第一个可用的页"
      },
      {
        "name": "label",
        "type": "string",
        "description": "标签列表的读屏名称"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "<vn-tab-panel>"
      }
    ],
    "events": [
      {
        "name": "vn-change",
        "description": "切换后，detail.value 为新页的 name"
      }
    ],
    "parts": [
      {
        "name": "tablist",
        "description": "标签列表"
      },
      {
        "name": "tab",
        "description": "每个标签"
      },
      {
        "name": "indicator",
        "description": "当前标签下的线"
      },
      {
        "name": "panel",
        "description": "面板"
      }
    ],
    "cssprops": []
  },
  "vn-tab-panel": {
    "file": "src/components/tabs.js",
    "tag": "vn-tab-panel",
    "summary": "标签页中的一页，放在 <vn-tabs> 里。",
    "attrs": [
      {
        "name": "name",
        "type": "string",
        "description": "页的名字（<vn-tabs value> 用它选择）"
      },
      {
        "name": "label",
        "type": "string",
        "description": "标签上的文字"
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
        "description": "内容"
      }
    ],
    "events": [],
    "parts": [],
    "cssprops": []
  },
  "vn-tag": {
    "file": "src/components/tag.js",
    "tag": "vn-tag",
    "summary": "标签：一小块带边框的文字，用来标注类别、状态、关键词。",
    "attrs": [
      {
        "name": "type",
        "type": "'default'|'accent'|'success'|'warning'|'danger'|'info'",
        "description": "颜色，默认 default"
      },
      {
        "name": "size",
        "type": "'sm'|'md'",
        "description": "尺寸，默认 md"
      },
      {
        "name": "closable",
        "type": "boolean",
        "description": "末尾显示关闭按钮"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "文字"
      }
    ],
    "events": [
      {
        "name": "vn-close",
        "description": "点关闭按钮时（可取消；没被取消就移除自己）"
      }
    ],
    "parts": [
      {
        "name": "tag",
        "description": "标签本体"
      },
      {
        "name": "close",
        "description": "关闭按钮"
      }
    ],
    "cssprops": []
  },
  "vn-textarea": {
    "file": "src/components/textarea.js",
    "tag": "vn-textarea",
    "summary": "多行输入：与输入框相同的标签、提示、校验与字数统计。",
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
        "name": "rows",
        "type": "number",
        "description": "可见行数，默认 3"
      },
      {
        "name": "autosize",
        "type": "boolean",
        "description": "随内容长高"
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
      }
    ],
    "slots": [],
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
        "name": "textarea",
        "description": "内部的原生 textarea"
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
  "vn-timeline": {
    "file": "src/components/timeline.js",
    "tag": "vn-timeline",
    "summary": "时间线：按时间排列的事件。",
    "attrs": [],
    "slots": [
      {
        "name": "",
        "description": "<vn-timeline-item>"
      }
    ],
    "events": [],
    "parts": [],
    "cssprops": []
  },
  "vn-timeline-item": {
    "file": "src/components/timeline.js",
    "tag": "vn-timeline-item",
    "summary": "时间线上的一件事：左侧一个圆点或一方小印，右侧是时间和内容。",
    "attrs": [
      {
        "name": "time",
        "type": "string",
        "description": "时间"
      },
      {
        "name": "seal",
        "type": "string",
        "description": "小印上的字（一到两个字）；不写时是圆点"
      },
      {
        "name": "type",
        "type": "'default'|'accent'|'success'|'warning'|'danger'|'info'",
        "description": "颜色，默认 default"
      }
    ],
    "slots": [
      {
        "name": "",
        "description": "内容"
      }
    ],
    "events": [],
    "parts": [
      {
        "name": "marker",
        "description": "圆点或小印"
      },
      {
        "name": "time",
        "description": "时间"
      },
      {
        "name": "content",
        "description": "内容"
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
