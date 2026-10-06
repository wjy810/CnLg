// 响应式模板的浏览器测试。对应 docs/rfc/0002-templates.md 第 10 节。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser } from './helpers/browser.js';

const open = useBrowser();

test('内容绑定：普通值、signal、函数；空值清空，0 正常显示', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    const name = signal('李白');
    const count = signal(0);
    render(html`<p>${'诗人：'}${name}，第 ${() => count.value + 1} 首${null}${false}${''}</p>`, host);
    const first = host.querySelector('p').textContent;
    const textNode = [...host.querySelector('p').childNodes].find((n) => n.data === '李白');
    name.value = '杜甫';
    count.value = 4;
    return {
      first,
      second: host.querySelector('p').textContent,
      sameNode: textNode.data === '杜甫',
    };
  });
  assert.deepEqual(result, { first: '诗人：李白，第 1 首', second: '诗人：杜甫，第 5 首', sameNode: true });
});

test('安全：字符串中的 HTML 以文本显示', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render } = window.vunio;
    const host = document.createElement('div');
    const evil = '<img src=x onerror="window.hacked=1"><script>window.hacked=1</script>';
    render(html`<p title=${evil}>${evil}</p>`, host);
    return { text: host.querySelector('p').textContent, images: host.querySelectorAll('img').length };
  });
  assert.equal(result.images, 0);
  assert.match(result.text, /<img src=x/);
});

test('属性绑定：多段插值、null 移除、false 保留、class / style 对象、响应式', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    const size = signal('md');
    const active = signal(true);
    const label = signal(null);
    render(
      html`<button
        class="btn btn-${size} ${() => (active.value ? 'on' : '')}"
        aria-label=${label}
        aria-pressed=${false}
        data-list=${['a', 'b']}
      ></button>
      <i class=${{ seal: true, dim: false }} style=${{ color: 'red', '--size': '4px', fontSize: '12px' }}></i>
      <b class=${['x', false, 'y']}></b>`,
      host,
    );
    const button = host.querySelector('button');
    const before = {
      class: button.getAttribute('class'),
      hasLabel: button.hasAttribute('aria-label'),
      pressed: button.getAttribute('aria-pressed'),
      list: button.getAttribute('data-list'),
      iClass: host.querySelector('i').getAttribute('class'),
      iStyle: host.querySelector('i').getAttribute('style'),
      bClass: host.querySelector('b').getAttribute('class'),
    };
    size.value = 'lg';
    active.value = false;
    label.value = '提交';
    return { before, after: { class: button.getAttribute('class'), label: button.getAttribute('aria-label') } };
  });
  assert.deepEqual(result.before, {
    class: 'btn btn-md on',
    hasLabel: false,
    pressed: 'false',
    list: 'a,b',
    iClass: 'seal',
    iStyle: 'color: red; --size: 4px; font-size: 12px',
    bClass: 'x y',
  });
  assert.deepEqual(result.after, { class: 'btn btn-lg ', label: '提交' });
});

test('布尔属性与 DOM 属性绑定', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    const off = signal(true);
    const text = signal('明月');
    render(html`<input ?disabled=${off} .value=${text} ?hidden=${() => !off.value} />`, host);
    const input = host.querySelector('input');
    const before = { disabled: input.disabled, value: input.value, hidden: input.hidden };
    off.value = false;
    text.value = '清风';
    return { before, after: { disabled: input.disabled, value: input.value, hidden: input.hidden } };
  });
  assert.deepEqual(result.before, { disabled: true, value: '明月', hidden: false });
  assert.deepEqual(result.after, { disabled: false, value: '清风', hidden: true });
});

test('DOM 属性：函数原样传入，不被当作响应式表达式', async (t) => {
  const { page } = await open(t);
  const same = await page.evaluate(() => {
    const { html, render } = window.vunio;
    const host = document.createElement('div');
    const fn = () => 'x';
    render(html`<div .formatter=${fn}></div>`, host);
    return host.querySelector('div').formatter === fn;
  });
  assert.equal(same, true);
});

test('事件绑定：this 指向 host，重新渲染时替换处理函数但不重复绑定', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render } = window.vunio;
    const host = document.createElement('div');
    const owner = { name: '组件', log: [] };
    const view = (handler) => html`<button @click=${handler}>点</button>`;
    render(
      view(function (event) {
        this.log.push(`a:${this.name}:${event.type}`);
      }),
      host,
      { host: owner },
    );
    const button = host.querySelector('button');
    button.click();
    render(
      view(function () {
        this.log.push('b');
      }),
      host,
      { host: owner },
    );
    button.click();
    return { log: owner.log, sameButton: host.querySelector('button') === button };
  });
  assert.deepEqual(result, { log: ['a:组件:click', 'b'], sameButton: true });
});

test('嵌套模板：同一模板原地更新，不同模板替换', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    const mode = signal('poem');
    const title = signal('静夜思');
    const poem = (t) => html`<article>${t}</article>`;
    const empty = () => html`<p>暂无</p>`;
    render(html`<main>${() => (mode.value === 'poem' ? poem(title.value) : empty())}</main>`, host);
    const article = host.querySelector('article');
    title.value = '春晓';
    const updatedInPlace = host.querySelector('article') === article && article.textContent === '春晓';
    mode.value = 'empty';
    return { updatedInPlace, replaced: host.querySelector('main').innerHTML.includes('<p>暂无</p>'), hasArticle: !!host.querySelector('article') };
  });
  assert.deepEqual(result, { updatedInPlace: true, replaced: true, hasArticle: false });
});

test('无 key 数组：按位置复用', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('ul');
    const items = signal(['风', '花', '雪']);
    render(html`${() => items.value.map((i) => html`<li>${i}</li>`)}`, host);
    const first = host.querySelector('li');
    items.value = ['月', '花'];
    const afterShrink = [...host.querySelectorAll('li')].map((li) => li.textContent);
    items.value = ['月', '花', '雪', '风'];
    return {
      afterShrink,
      afterGrow: [...host.querySelectorAll('li')].map((li) => li.textContent),
      reused: host.querySelector('li') === first,
    };
  });
  assert.deepEqual(result, { afterShrink: ['月', '花'], afterGrow: ['月', '花', '雪', '风'], reused: true });
});

test('repeat：增删、重排保留节点身份，移动次数最少', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const { html, render, signal, repeat } = window.vunio;
    const host = document.createElement('ul');
    document.body.append(host);
    const list = signal(['A', 'B', 'C', 'D'].map((id) => ({ id })));
    render(html`${repeat(list, (i) => i.id, (i) => html`<li>${i.id}</li>`)}`, host);
    const nodes = Object.fromEntries([...host.querySelectorAll('li')].map((li) => [li.textContent, li]));
    const text = () => [...host.querySelectorAll('li')].map((li) => li.textContent).join('');

    // 统计 <li> 被插入（新建或移动）的次数
    const moved = async (change) => {
      let count = 0;
      const observer = new MutationObserver((records) => {
        for (const r of records) for (const n of r.addedNodes) if (n.nodeName === 'LI') count++;
      });
      observer.observe(host, { childList: true });
      change();
      await Promise.resolve();
      observer.takeRecords().forEach((r) => r.addedNodes.forEach((n) => n.nodeName === 'LI' && count++));
      observer.disconnect();
      return count;
    };

    const byId = (ids) => ids.split('').map((id) => list.value.find((i) => i.id === id) ?? { id });
    const rotate = await moved(() => (list.value = byId('DABC')));
    const afterRotate = text();
    const identity = ['A', 'B', 'C', 'D'].every((id) => [...host.querySelectorAll('li')].includes(nodes[id]));
    const reverse = await moved(() => (list.value = byId('CBAD')));
    const afterReverse = text();
    const insert = await moved(() => (list.value = byId('CBXAD')));
    const afterInsert = text();
    list.value = byId('XD');
    const afterRemove = text();
    host.remove();
    return { rotate, afterRotate, identity, reverse, afterReverse, insert, afterInsert, afterRemove, stillSame: host.querySelector('li:last-child') === nodes.D };
  });
  assert.equal(result.afterRotate, 'DABC');
  assert.equal(result.rotate, 1, 'ABCD → DABC 只移动 D');
  assert.equal(result.identity, true);
  assert.equal(result.afterReverse, 'CBAD');
  assert.equal(result.reverse, 3, 'DABC → CBAD 完全逆序，最长递增子序列长度为 1，至少移动 3 项');
  assert.equal(result.afterInsert, 'CBXAD');
  assert.equal(result.insert, 1, '插入只新增一项');
  assert.equal(result.afterRemove, 'XD');
  assert.equal(result.stillSame, true);
});

test('repeat：重复 key 时警告并仍然渲染', async (t) => {
  const { page, warnings } = await open(t);
  const text = await page.evaluate(() => {
    const { html, render, repeat } = window.vunio;
    const host = document.createElement('ul');
    render(html`${repeat([1, 1, 2], (i) => i, (i) => html`<li>${i}</li>`)}`, host);
    return host.textContent;
  });
  assert.equal(text, '112');
  assert.equal(warnings.filter((w) => w.includes('重复的 key')).length, 1);
});

test('repeat：在 <tbody> 中渲染行', async (t) => {
  const { page } = await open(t);
  const rows = await page.evaluate(() => {
    const { html, render, repeat } = window.vunio;
    const host = document.createElement('div');
    const poems = [{ id: 1, t: '静夜思' }, { id: 2, t: '春晓' }];
    render(html`<table><tbody>${repeat(poems, (p) => p.id, (p) => html`<tr><td>${p.t}</td></tr>`)}</tbody></table>`, host);
    return [...host.querySelectorAll('tbody > tr')].map((tr) => tr.textContent);
  });
  assert.deepEqual(rows, ['静夜思', '春晓']);
});

test('when：只在真假变化时切换，旧分支的订阅被释放', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal, when } = window.vunio;
    const host = document.createElement('div');
    const count = signal(1);
    const inner = signal('内');
    render(html`${when(() => count.value > 0, () => html`<b>${inner}</b>`, () => html`<i>无</i>`)}`, host);
    const b = host.querySelector('b');
    const observersWhileShown = inner._observers?.size ?? 0;
    count.value = 2; // 仍为真
    const sameBranch = host.querySelector('b') === b;
    count.value = 0;
    return {
      observersWhileShown,
      sameBranch,
      otherwise: host.innerHTML.includes('<i>无</i>'),
      observersAfter: inner._observers?.size ?? 0,
    };
  });
  assert.deepEqual(result, { observersWhileShown: 1, sameBranch: true, otherwise: true, observersAfter: 0 });
});

test('unsafeHTML、svg 片段、SVG 属性大小写、注释中的插值被忽略', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, svg, render, unsafeHTML, signal } = window.vunio;
    const host = document.createElement('div');
    const r = signal(4);
    render(
      html`<div class="raw">${unsafeHTML('<em>斜</em>')}</div>
        <svg viewBox=${'0 0 10 10'}>${svg`<circle r=${r} />`}</svg>
        <!-- ${'被忽略'} -->`,
      host,
    );
    const circle = host.querySelector('circle');
    r.value = 6;
    return {
      raw: host.querySelector('.raw').innerHTML.includes('<em>斜</em>'),
      viewBox: host.querySelector('svg').getAttribute('viewBox'),
      circleNS: circle.namespaceURI,
      r: circle.getAttribute('r'),
    };
  });
  assert.deepEqual(result, { raw: true, viewBox: '0 0 10 10', circleNS: 'http://www.w3.org/2000/svg', r: '6' });
});

test('错误提示：<textarea> 内插值、元素位置插值', async (t) => {
  const { page } = await open(t);
  const messages = await page.evaluate(() => {
    const { html, render } = window.vunio;
    const tryRender = (result) => {
      try {
        render(result, document.createElement('div'));
      } catch (error) {
        return error.message;
      }
    };
    return [tryRender(html`<textarea>${'x'}</textarea>`), tryRender(html`<div ${'x'}></div>`), tryRender(html`<p @click="a ${() => {}}"></p>`)];
  });
  assert.match(messages[0], /<textarea> 内部不支持插值，请改用 <textarea \.value=\$\{value\}>/);
  assert.match(messages[1], /不支持在标签名、属性名或元素位置插值/);
  assert.match(messages[2], /必须独占整个属性值/);
});

test('全局 render：重复渲染原地更新，dispose 停止绑定并清空', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    const name = signal('甲');
    const view = (n) => html`<p>${n}</p>`;
    render(view('一'), host);
    const p = host.querySelector('p');
    const scope = render(view(name), host);
    const same = host.querySelector('p') === p && p.textContent === '甲';
    scope.dispose();
    return { same, empty: host.childNodes.length, observers: name._observers?.size ?? 0 };
  });
  assert.deepEqual(result, { same: true, empty: 0, observers: 0 });
});

test('组件：模板读取属性与 signal，事件中 this 是组件', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { VunioElement, html, signal } = window.vunio;
    class TCounter extends VunioElement {
      static tag = 't-counter';
      static props = { label: { type: String, default: '次数' } };
      count = signal(0);
      render() {
        return html`<button @click=${this.increment}>${() => this.label}：${this.count}</button>`;
      }
      increment() {
        this.count.value++;
      }
    }
    TCounter.define();
    const el = document.createElement('t-counter');
    document.body.append(el);
    const button = el.root.querySelector('button');
    const initial = button.textContent;
    button.click();
    button.click();
    el.setAttribute('label', '点击'); // 同步更新，不需要等待
    return { initial, after: button.textContent };
  });
  assert.deepEqual(result, { initial: '次数：0', after: '点击：2' });
});

test('组件：移出页面后不被全局状态引用，移回时补上变化且 DOM 不重建', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(() => {
    const { VunioElement, html, signal, computed } = window.vunio;
    const store = signal('春');
    const upper = computed(() => `【${store.value}】`);
    let effectRuns = 0;
    class TStore extends VunioElement {
      static tag = 't-store';
      render() {
        return html`<p>${upper}</p>`;
      }
      mounted() {
        this.effect(() => {
          store.value;
          effectRuns++;
        });
      }
    }
    TStore.define();
    const el = document.createElement('t-store');
    document.body.append(el);
    const p = el.root.querySelector('p');
    const observersMounted = store._observers?.size ?? 0;

    el.remove();
    const observersRemoved = store._observers?.size ?? 0;
    store.value = '夏';
    const textWhileRemoved = p.textContent;
    const runsWhileRemoved = effectRuns;

    document.body.append(el);
    const textBack = p.textContent;
    store.value = '秋';
    return {
      observersMounted,
      observersRemoved,
      textWhileRemoved,
      runsWhileRemoved,
      textBack,
      textLater: p.textContent,
      sameNode: el.root.querySelector('p') === p,
      effectRuns,
    };
  });
  assert.equal(result.observersMounted, 2, '模板（经 computed）和 effect 各一个');
  assert.equal(result.observersRemoved, 0, '移出后全局 signal 不再引用组件');
  assert.equal(result.textWhileRemoved, '【春】', '离开期间不更新');
  assert.equal(result.runsWhileRemoved, 1);
  assert.equal(result.textBack, '【夏】', '移回时补上变化');
  assert.equal(result.textLater, '【秋】');
  assert.equal(result.sameNode, true);
  assert.equal(result.effectRuns, 3, 'mounted 中的 effect 随连接重建：1（首次）+1（重新挂载）+1（秋）');
});

test('组件：computed 依赖属性，update(changed) 旧写法继续工作', async (t) => {
  const { page } = await open(t);
  const result = await page.evaluate(async () => {
    const { VunioElement, html, computed } = window.vunio;
    class TMixed extends VunioElement {
      static tag = 't-mixed';
      static props = { count: { type: Number, default: 1 } };
      double = computed(() => this.count * 2);
      updates = 0;
      render() {
        return html`<span data-ref="out">${this.double}</span><i data-ref="legacy"></i>`;
      }
      update(changed) {
        this.updates++;
        if (changed.has('count')) this.refs.legacy.textContent = String(this.count);
      }
    }
    TMixed.define();
    const el = document.createElement('t-mixed');
    document.body.append(el);
    el.count = 5;
    const reactive = el.refs.out.textContent;
    await el.updateComplete;
    return { reactive, legacy: el.refs.legacy.textContent, updates: el.updates };
  });
  assert.deepEqual(result, { reactive: '10', legacy: '5', updates: 2 });
});

test('输入框 .value 绑定：用户输入不被覆盖', async (t) => {
  const { page } = await open(t);
  await page.evaluate(() => {
    const { html, render, signal } = window.vunio;
    const host = document.createElement('div');
    document.body.append(host);
    window.text = signal('');
    render(html`<input .value=${window.text} @input=${(e) => (window.text.value = e.target.value)} />`, host);
  });
  await page.locator('input').pressSequentially('床前明月光');
  const value = await page.evaluate(() => ({ signal: window.text.value, input: document.querySelector('input').value }));
  assert.deepEqual(value, { signal: '床前明月光', input: '床前明月光' });
});

test('表单组件：纯模板写法，错误提示随交互响应式出现', async (t) => {
  const { page } = await open(t);
  await page.evaluate(() => {
    const { VunioFormElement, html, computed } = window.vunio;
    class TReactiveField extends VunioFormElement {
      static tag = 't-reactive-field';
      render() {
        return html`
          <input
            .value=${computed(() => this.value)}
            ?disabled=${() => this.isDisabled}
            @input=${(e) => (this.value = e.target.value)}
          />
          <span class="error">${() => (this.userInvalid ? this.validationMessage : '')}</span>
        `;
      }
    }
    TReactiveField.define();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<form><fieldset><t-reactive-field name="a" required></t-reactive-field></fieldset><button>提交</button></form>',
    );
  });
  const error = () => page.evaluate(() => document.querySelector('t-reactive-field').root.querySelector('.error').textContent);
  assert.equal(await error(), '', '未交互时不显示');
  await page.locator('t-reactive-field input').focus();
  await page.locator('button').focus();
  assert.equal(await error(), '此项为必填');
  await page.locator('t-reactive-field input').fill('月');
  assert.equal(await error(), '');
  const state = await page.evaluate(() => {
    const el = document.querySelector('t-reactive-field');
    document.querySelector('fieldset').disabled = true;
    const disabledInput = el.root.querySelector('input').disabled;
    el.form.reset();
    return { disabledInput, input: el.root.querySelector('input').value, data: [...new FormData(el.form)].length };
  });
  assert.deepEqual(state, { disabledInput: true, input: '', data: 0 });
});
