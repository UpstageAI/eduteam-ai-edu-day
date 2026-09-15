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
    this.hidden = false;
    this.value = '';
    this.focused = false;
    this.listeners = new Map();
    this._text = '';
  }

  get textContent() {
    return this._text + this.children.map(child => child.textContent).join('');
  }

  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) || []) listener({ target: this });
  }

  click() {
    this.dispatch('click');
  }

  focus() {
    this.focused = true;
  }

  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    const dataMatch = selector.match(/^\[data-([a-z-]+)\]$/);
    if (dataMatch) return Object.hasOwn(this.dataset, dataName(`data-${dataMatch[1]}`));
    return this.tagName === selector.toUpperCase();
  }

  querySelectorAll(selector) {
    const matches = [];
    for (const child of this.children) {
      if (child.matches(selector)) matches.push(child);
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  set innerHTML(_) {
    throw new Error('Portal rendering must not assign innerHTML');
  }
}

function card(key, category, text, search = text) {
  const node = new Element('article');
  node.className = 'learning-card';
  node.dataset.resourceKey = key;
  node.dataset.category = category;
  node.dataset.search = search;
  const title = new Element('h3');
  title.textContent = text;
  node.appendChild(title);
  const status = new Element('span');
  status.dataset.cardStatus = '';
  status.hidden = true;
  node.appendChild(status);
  return node;
}

function fixture(fetchImpl = async () => { throw new Error('offline'); }, stored = {}) {
  const body = new Element('body');
  const controls = new Element('div', 'catalog-controls');
  controls.hidden = true;
  const filters = ['all', 'workshop', 'reading'].map(category => {
    const button = new Element('button');
    button.dataset.categoryFilter = category;
    button.setAttribute('aria-pressed', String(category === 'all'));
    controls.appendChild(button);
    return button;
  });
  const search = new Element('input', 'catalog-search');
  controls.appendChild(search);
  const reset = new Element('button', 'catalog-reset');
  controls.appendChild(reset);
  body.appendChild(controls);

  const count = new Element('p', 'catalog-count');
  body.appendChild(count);
  const empty = new Element('div', 'catalog-empty');
  empty.hidden = true;
  body.appendChild(empty);
  const feedback = new Element('p', 'catalog-feedback');
  feedback.hidden = true;
  body.appendChild(feedback);

  const pages = new Element('main', 'pages');
  const staticCards = [
    card('gas-tutorial', 'workshop', 'Google Apps Script 워크숍', 'gas apps script automation'),
    card('omc-intro', 'workshop', 'Oh-my-claude-code 사용기', 'omc claude code agent'),
    card('reading-list/externalization-llm-agents', 'reading', 'LLM 에이전트의 외재화', 'memory skill protocol harness'),
    card('reading-list/forward-deployed-engineer', 'reading', 'FDE 현장의 배움을 제품으로', 'forward deployed engineer product'),
  ];
  staticCards.forEach(node => pages.appendChild(node));
  body.appendChild(pages);

  const document = {
    body,
    createElement: tagName => new Element(tagName),
    querySelector: selector => body.matches(selector) ? body : body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector),
  };
  const windowListeners = new Map();
  const window = {
    location: { href: 'https://upstageai.github.io/eduteam-ai-edu-day/index.html' },
    localStorage: {
      getItem: key => Object.hasOwn(stored, key) ? stored[key] : null,
    },
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) || [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    },
    dispatch(type) {
      for (const listener of windowListeners.get(type) || []) listener();
    },
  };
  const context = vm.createContext({
    AbortController,
    URL,
    clearTimeout,
    document,
    fetch: fetchImpl,
    setTimeout,
    window,
  });
  vm.runInContext(source, context);
  return { controls, count, empty, feedback, filters, pages, portal: window.EduDayPortal, reset, search, staticCards, window };
}

function directChild(element, tagName) {
  return element.children.find(child => child.tagName === tagName.toUpperCase());
}

function flush() {
  return new Promise(resolve => setImmediate(resolve));
}

test('catalog progressively enhances without replacing the four static cards', () => {
  const state = fixture();

  assert.equal(state.controls.hidden, false);
  assert.equal(state.count.textContent, '4개의 학습 자료');
  assert.equal(state.pages.children.length, 4);
  state.staticCards.forEach((node, index) => assert.equal(state.pages.children[index], node));
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /replaceChildren/);
});

test('title and keyword search combines with category filters and reset', () => {
  const state = fixture();
  state.filters[2].click();
  assert.deepEqual(state.staticCards.map(node => node.hidden), [true, true, false, false]);
  assert.equal(state.count.textContent, '2개의 학습 자료');

  state.search.value = 'protocol';
  state.search.dispatch('input');
  assert.deepEqual(state.staticCards.map(node => node.hidden), [true, true, false, true]);
  assert.equal(state.count.textContent, '1개의 학습 자료');

  state.search.value = 'not present';
  state.search.dispatch('input');
  assert.equal(state.empty.hidden, false);
  assert.equal(state.count.textContent, '0개의 학습 자료');

  state.reset.click();
  assert.equal(state.search.value, '');
  assert.equal(state.search.focused, true);
  assert.deepEqual(state.staticCards.map(node => node.hidden), [false, false, false, false]);
  assert.equal(state.filters[0].attributes['aria-pressed'], 'true');
});

test('reading completion labels reuse reader storage keys and refresh on pageshow', () => {
  const key = 'edu-reading-list:v1:complete:externalization-llm-agents';
  const stored = { [key]: 'true' };
  const state = fixture(undefined, stored);
  const externalizationStatus = state.staticCards[2].querySelector('[data-card-status]');
  const workshopStatus = state.staticCards[0].querySelector('[data-card-status]');

  assert.equal(externalizationStatus.hidden, false);
  assert.equal(externalizationStatus.textContent, '✓ 읽음');
  assert.equal(workshopStatus.hidden, true);

  stored[key] = 'false';
  state.window.dispatch('pageshow');
  assert.equal(externalizationStatus.textContent, '아직 읽지 않음');
  assert.equal(externalizationStatus.dataset.complete, 'false');
});

test('storage errors hide optional status without breaking the catalog', () => {
  const state = fixture();
  state.window.localStorage.getItem = () => { throw new Error('denied'); };

  assert.doesNotThrow(() => state.portal.refreshReadStatus());
  assert.equal(state.staticCards[2].querySelector('[data-card-status]').hidden, true);
  assert.equal(state.pages.children.length, 4);
});

test('tree discovery appends unknown root pages and PPTX without leaking curated or nested pages', () => {
  const state = fixture();
  const items = state.portal.discover([
    { type: 'blob', path: 'gas-tutorial/index.html' },
    { type: 'blob', path: 'omc-intro/index.html' },
    { type: 'blob', path: 'reading-list/index.html' },
    { type: 'blob', path: 'externalization-llm-agents/index.html' },
    { type: 'blob', path: 'reading-list/externalization-llm-agents/index.html' },
    { type: 'blob', path: 'reading-list/forward-deployed-engineer/index.html' },
    { type: 'blob', path: 'nested/extra/index.html' },
    { type: 'blob', path: 'new-deck/index.html' },
    { type: 'blob', path: 'decks/team update.pptx' },
  ]);

  assert.deepEqual(Array.from(items, item => item.path), ['new-deck', 'decks/team update.pptx']);
  assert.equal(items[1].href, './decks/team%20update.pptx');
});

test('successful discovery appends safe dynamic cards after static artwork', async () => {
  const tree = [
    { type: 'blob', path: 'gas-tutorial/index.html' },
    { type: 'blob', path: 'new <deck>/index.html' },
    { type: 'blob', path: 'slides/team update.pptx' },
  ];
  const state = fixture(async () => ({ ok: true, json: async () => ({ tree }) }));
  await flush();
  await flush();

  assert.equal(state.pages.children.length, 6);
  state.staticCards.forEach((node, index) => assert.equal(state.pages.children[index], node));
  const dynamicPage = state.pages.children[4];
  const content = directChild(dynamicPage, 'div');
  const heading = directChild(content, 'h3');
  const link = directChild(heading, 'a');
  assert.equal(dynamicPage.className, 'learning-card');
  assert.equal(content.className, 'card-content');
  assert.equal(link.textContent, 'new <deck>');
  assert.equal(link.attributes.href, './new%20%3Cdeck%3E/');
  assert.equal(state.feedback.hidden, false);
});

test('offline API failure leaves the static catalog readable', async () => {
  const state = fixture(async () => { throw new Error('offline'); });
  await flush();

  assert.equal(state.pages.children.length, 4);
  assert.equal(state.controls.hidden, false);
  assert.equal(state.feedback.hidden, true);
});

test('relative and Office URLs retain a Pages project prefix', () => {
  const { portal } = fixture();

  assert.equal(portal.toRepoHref('reading-list/forward-deployed-engineer', true), './reading-list/forward-deployed-engineer/');
  assert.equal(portal.toRepoHref('decks/team update.pptx'), './decks/team%20update.pptx');
  assert.match(
    portal.toOfficeViewerUrl('./decks/team%20update.pptx'),
    /src=https%3A%2F%2Fupstageai\.github\.io%2Feduteam-ai-edu-day%2Fdecks%2Fteam%2520update\.pptx$/,
  );
});

test('dynamic API names use textContent and safe attributes', () => {
  const { portal } = fixture();
  const maliciousName = '<img src=x onerror=alert(1)>';
  const dynamic = portal.createCard({
    kind: 'page',
    path: 'safe',
    name: maliciousName,
    label: '페이지',
    description: '설명',
    category: 'workshop',
    href: './safe/',
  });
  const content = directChild(dynamic, 'div');
  const heading = directChild(content, 'h3');
  const link = directChild(heading, 'a');

  assert.equal(link.textContent, maliciousName);
  assert.equal(link.children.length, 0);
  assert.equal(link.attributes.href, './safe/');
});
