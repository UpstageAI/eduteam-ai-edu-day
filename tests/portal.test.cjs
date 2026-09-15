const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'assets', 'portal.js');
const source = fs.readFileSync(scriptPath, 'utf8');

function dataName(attribute) {
  return attribute.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

class Element {
  constructor(tagName, id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.className = '';
    this._text = '';
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener() {}
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1));
    const dataMatch = selector.match(/^\[data-([a-z-]+)\]$/);
    if (dataMatch) return Object.hasOwn(this.dataset, dataName(`data-${dataMatch[1]}`));
    return this.tagName === selector.toUpperCase();
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  set innerHTML(_) { throw new Error('Portal rendering must not assign innerHTML'); }
}

function staticCard(key) {
  const card = new Element('article');
  card.className = 'learning-card';
  card.dataset.resourceKey = key;
  return card;
}

function fixture(fetchImpl = async () => { throw new Error('offline'); }) {
  const body = new Element('body');
  const pages = new Element('div', 'pages');
  const staticCards = [
    staticCard('gas-tutorial'),
    staticCard('omc-intro'),
    staticCard('reading-list/externalization-llm-agents'),
    staticCard('reading-list/forward-deployed-engineer'),
  ];
  staticCards.forEach(card => pages.appendChild(card));
  body.appendChild(pages);
  const document = {
    body,
    createElement: tagName => new Element(tagName),
    querySelector: selector => body.matches(selector) ? body : body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector),
  };
  const window = { location: { href: 'https://upstageai.github.io/eduteam-ai-edu-day/index.html' } };
  vm.runInContext(source, vm.createContext({
    AbortController, URL, clearTimeout, document, fetch: fetchImpl, setTimeout, window,
  }));
  return { pages, portal: window.EduDayPortal, staticCards };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
const childByClass = (element, className) => element.children.find(child => child.className.split(/\s+/).includes(className));

function assertDynamicRow(card, expectedTitle) {
  assert.equal(card.className, 'learning-card');
  const content = childByClass(card, 'card-content');
  const bottom = childByClass(card, 'card-bottom');
  assert.ok(content && bottom);
  assert.equal(card.children.indexOf(bottom), card.children.indexOf(content) + 1);
  assert.deepEqual(content.children.map(child => child.className), [
    'type-label', 'format-label', 'resource-title', 'card-description'
  ]);
  assert.equal(content.children[2].tagName, 'H2');
  assert.equal(content.children[2].textContent, expectedTitle);
  assert.equal(content.children[2].children.length, 0);
  assert.ok(bottom.querySelector('.text-link'));
  for (const link of bottom.querySelectorAll('.text-link')) {
    const label = link.querySelector('.action-label');
    assert.ok(label, 'dynamic actions separate their visual label from the fixed hit area');
    assert.equal(label.textContent, link.textContent);
  }
}

test('portal runtime only discovers additions and preserves four static rows', () => {
  const state = fixture();
  assert.equal(state.pages.children.length, 4);
  state.staticCards.forEach((card,index) => assert.equal(state.pages.children[index],card));
  assert.doesNotMatch(source, /catalog-(?:controls|search|count|empty|reset|feedback)|data-category-filter|data-card-status|localStorage/);
  assert.doesNotMatch(source, /\.innerHTML\s*=|replaceChildren/);
});

test('tree discovery appends unknown root pages and PPTX without curated, nested or duplicate entries', () => {
  const { portal } = fixture();
  const items = portal.discover([
    { type: 'blob', path: 'gas-tutorial/index.html' },
    { type: 'blob', path: 'reading-list/index.html' },
    { type: 'blob', path: 'externalization-llm-agents/index.html' },
    { type: 'blob', path: 'nested/extra/index.html' },
    { type: 'blob', path: 'new-deck/index.html' },
    { type: 'blob', path: 'new-deck/index.html' },
    { type: 'blob', path: 'decks/team update.pptx' },
    { type: 'blob', path: 'decks/team update.pptx' },
  ]);
  assert.deepEqual(Array.from(items,item=>item.path),['new-deck','decks/team update.pptx']);
  assert.equal(items[1].href,'./decks/team%20update.pptx');
});

test('successful discovery appends complete text rows after the static rows', async () => {
  const tree = [
    { type:'blob',path:'gas-tutorial/index.html' },
    { type:'blob',path:'new <deck>/index.html' },
    { type:'blob',path:'slides/team update.pptx' },
  ];
  const state=fixture(async()=>({ok:true,json:async()=>({tree})}));
  await flush(); await flush();
  assert.equal(state.pages.children.length,6);
  state.staticCards.forEach((card,index)=>assert.equal(state.pages.children[index],card));
  assertDynamicRow(state.pages.children[4],'new <deck>');
  assertDynamicRow(state.pages.children[5],'team update.pptx');
});

test('API failure leaves every static row readable', async () => {
  const state=fixture(async()=>{throw new Error('offline');});
  await flush(); await flush();
  assert.equal(state.pages.children.length,4);
  state.staticCards.forEach((card,index)=>assert.equal(state.pages.children[index],card));
});

test('relative and Office URLs retain a Pages project prefix', () => {
  const { portal }=fixture();
  assert.equal(portal.toRepoHref('reading-list/forward-deployed-engineer',true),'./reading-list/forward-deployed-engineer/');
  assert.equal(portal.toRepoHref('decks/team update.pptx'),'./decks/team%20update.pptx');
  assert.match(portal.toOfficeViewerUrl('./decks/team%20update.pptx'),/src=https%3A%2F%2Fupstageai\.github\.io%2Feduteam-ai-edu-day%2Fdecks%2Fteam%2520update\.pptx$/);
});

test('dynamic titles and CTA links use safe text and attributes', () => {
  const { portal }=fixture();
  const malicious='<img src=x onerror=alert(1)>';
  const row=portal.createCard({kind:'page',path:'safe',name:malicious,label:'페이지',description:'설명',category:'workshop',href:'./safe/'});
  assertDynamicRow(row,malicious);
  const link=childByClass(row,'card-bottom').querySelector('.text-link');
  assert.equal(link.attributes.href,'./safe/');
  assert.match(link.attributes['aria-label'],/safe|자료|열기/);
});
