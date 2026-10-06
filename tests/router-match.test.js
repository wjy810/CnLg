// 路径匹配（Node）：docs/rfc/0005-router.md 第 2.1 节
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, findRoute, matchPath, parseLocation } from '../src/router/match.js';

const table = (patterns) => patterns.map((path, index) => ({ compiled: compile(path), def: path, index }));

test('静态、参数、通配符', () => {
  assert.deepEqual(matchPath(compile('/components'), '/components'), {});
  assert.equal(matchPath(compile('/components'), '/components/button'), null);
  assert.deepEqual(matchPath(compile('/components/:name'), '/components/button'), { name: 'button' });
  assert.equal(matchPath(compile('/components/:name'), '/components'), null);
  assert.deepEqual(matchPath(compile('/docs/*'), '/docs/a/b'), { '*': 'a/b' });
  assert.deepEqual(matchPath(compile('/docs/*'), '/docs'), { '*': '' });
  assert.deepEqual(matchPath(compile('/'), '/'), {});
});

test('末尾斜杠忽略、参数解码', () => {
  assert.deepEqual(matchPath(compile('/a/:x/'), '/a/%E6%9C%88/'), { x: '月' });
  assert.deepEqual(matchPath(compile('/诗/:x'), '/%E8%AF%97/1'), { x: '1' });
});

test('按具体程度选择，与书写顺序无关', () => {
  const routes = table(['/*', '/components/*', '/components/:name', '/components/button', '/', '/a']);
  assert.equal(findRoute(routes, '/components/button').def, '/components/button');
  assert.equal(findRoute(routes, '/components/card').def, '/components/:name');
  assert.equal(findRoute(routes, '/components/a/b').def, '/components/*');
  assert.equal(findRoute(routes, '/').def, '/');
  assert.equal(findRoute(routes, '/a').def, '/a', '精确匹配优先于通配');
  assert.equal(findRoute(routes, '/zzz').def, '/*');
  assert.equal(findRoute(table(['/x']), '/y'), null);
});

test('通配符只能放在最后', () => {
  assert.throws(() => compile('/a/*/b'), /通配符 \* 只能放在最后/);
});

test('解析地址：路径、查询串、锚点', () => {
  assert.deepEqual(parseLocation('/search/?q=%E6%9C%88&q=%E9%A3%8E&page=2#top'), {
    path: '/search',
    query: { q: '风', page: '2' },
    hash: 'top',
    search: '?q=%E6%9C%88&q=%E9%A3%8E&page=2',
  });
  assert.deepEqual(parseLocation(''), { path: '/', query: {}, hash: '', search: '' });
});
