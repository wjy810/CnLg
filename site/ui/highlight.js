// 极简代码高亮：只区分注释、字符串、关键字、数字（JS）与标签、属性、字符串（HTML）

const escape = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const JS = new RegExp(
  [
    String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(\x60(?:\\[\s\S]|[^\x60\\])*\x60|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")`,
    String.raw`\b(import|from|export|const|let|var|function|return|class|extends|static|new|if|else|for|of|in|await|async|this|true|false|null|undefined|default|get|set)\b`,
    String.raw`\b(\d+(?:\.\d+)?)\b`,
  ].join('|'),
  'g',
);
const JS_KINDS = [null, 'comment', 'string', 'keyword', 'number'];

const HTML = new RegExp(
  [
    String.raw`(<!--[\s\S]*?-->)`,
    String.raw`(<\/?[a-zA-Z][\w-]*)`,
    String.raw`(\s[@.?]?[a-zA-Z_:][\w:.-]*)(?==)`,
    String.raw`("[^"]*"|'[^']*')`,
    String.raw`(\/?>)`,
  ].join('|'),
  'g',
);
const HTML_KINDS = [null, 'comment', 'tag', 'attr', 'string', 'tag'];

function run(code, regex, kinds) {
  let out = '';
  let last = 0;
  for (const match of code.matchAll(regex)) {
    out += escape(code.slice(last, match.index));
    const group = match.findIndex((value, i) => i > 0 && value !== undefined);
    const kind = kinds[group];
    out += kind ? `<span class="tok-${kind}">${escape(match[0])}</span>` : escape(match[0]);
    last = match.index + match[0].length;
  }
  return out + escape(code.slice(last));
}

/** 返回带 <span class="tok-*"> 的 HTML（已转义） */
export function highlight(code, lang = 'html') {
  return lang === 'js' ? run(code, JS, JS_KINDS) : run(code, HTML, HTML_KINDS);
}

/** 去掉公共缩进和首尾空行 */
export function dedent(text) {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}
