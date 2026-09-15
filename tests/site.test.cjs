const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'),'utf8');
const shellEntries = [
  'index.html',
  'gas-tutorial/index.html',
  'omc-intro/index.html',
  'reading-list/index.html',
  'reading-list/externalization-llm-agents/index.html',
  'reading-list/forward-deployed-engineer/index.html',
  'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/eli5.html',
  'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html',
];

function cards(html, attribute) {
  return [...html.matchAll(new RegExp(`<article class="learning-card"[^>]*${attribute}="[^"]+"[\\s\\S]*?<\\/article>`, 'g'))]
    .map(match => match[0]);
}

function assertRowContract(card) {
  const content = card.match(/<div class="card-content">([\s\S]*?)<\/div>\s*<div class="card-bottom">/);
  assert.ok(content, 'card-bottom must follow card-content');
  const fields = content[1];
  const positions = [
    fields.indexOf('class="type-label'),
    fields.indexOf('class="format-label'),
    fields.indexOf('<h2 class="resource-title"'),
    fields.indexOf('class="card-description"'),
  ];
  assert.ok(positions.every(position => position >= 0), 'row requires category, format, title and summary');
  assert.deepEqual([...positions].sort((a,b)=>a-b), positions, 'row field order is stable');
  assert.doesNotMatch(fields, /<h2[^>]*>\s*<a\b/, 'resource title stays plain text');
  assert.match(card, /<div class="card-bottom">[\s\S]*?<a class="text-link" href="[^"]+"[^>]*>/);
}

test('home is a minimal progressively discovered four-row catalog', () => {
  assert.match(home,/<script src="\.\/assets\/portal\.js(?:\?[^" ]+)?" defer>/);
  assert.match(home,/<main[^>]*id="content"[^>]*tabindex="-1"/);
  assert.match(home,/id="resources"/);
  assert.match(home,/<h1[^>]*class="visually-hidden"/);
  assert.deepEqual([...home.matchAll(/data-resource-key="([^"]+)"/g)].map(match=>match[1]),[
    'gas-tutorial','omc-intro','reading-list/externalization-llm-agents','reading-list/forward-deployed-engineer'
  ]);
  for (const removed of ['catalog-controls','catalog-search','catalog-count','catalog-empty','catalog-reset','catalog-feedback','home-hero','hero-content','home-lede']) {
    assert.doesNotMatch(home,new RegExp(`(?:id|class)="[^"]*\\b${removed}\\b`),`${removed} must stay removed`);
  }
  const rows=cards(home,'data-resource-key');
  assert.equal(rows.length,4);
  rows.forEach(assertRowContract);
  assert.doesNotMatch(home,/<img\b/);
  assert.doesNotMatch(home,/<script>/);
});

test('Reading List is the same minimal two-row catalog without catalogue runtime', () => {
  const html=fs.readFileSync(path.join(root,'reading-list/index.html'),'utf8');
  assert.deepEqual([...html.matchAll(/data-resource="([^"]+)"/g)].map(match=>match[1]),[
    'externalization-llm-agents','forward-deployed-engineer'
  ]);
  assert.match(html,/<h1[^>]*class="visually-hidden"/);
  for (const removed of ['collection-hero','collection-toolbar','resource-search','result-count','empty-state','reset-filters','read-state']) {
    assert.doesNotMatch(html,new RegExp(`(?:id|class|data-[a-z-]+)="[^"]*\\b${removed}\\b`),`${removed} must stay removed`);
  }
  assert.doesNotMatch(html,/reading-list\.js/);
  const rows=cards(html,'data-resource');
  assert.equal(rows.length,2);
  rows.forEach(assertRowContract);
});

test('all portal and landing links, assets and fragments resolve under the repo root', () => {
  for (const filename of shellEntries) {
    const html=fs.readFileSync(path.join(root,filename),'utf8');
    for (const [,value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(value)) continue;
      assert.ok(!value.startsWith('/'),`absolute local path in ${filename}: ${value}`);
      const url = new URL(value,'https://example.test/'+filename);
      let target = path.join(root,decodeURIComponent(url.pathname));
      if (url.pathname.endsWith('/')) target=path.join(target,'index.html');
      assert.ok(fs.existsSync(target),`${filename} => ${value}`);
      if (url.hash) assert.ok(fs.readFileSync(target,'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`missing anchor ${filename} => ${value}`);
    }
  }
});

test('all eight public shells use the two-link header and no footer', () => {
  for (const filename of shellEntries) {
    const html=fs.readFileSync(path.join(root,filename),'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,filename);
    assert.match(html,/<html lang="ko">/);
    assert.match(html,/<main[^>]*id="content"[^>]*tabindex="-1"/);
    const header=html.match(/<header class="site-header">([\s\S]*?)<\/header>/);
    assert.ok(header,filename);
    const links=[...header[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)];
    assert.equal(links.length,2,`${filename} header links`);
    assert.match(links[0][0],/class="brand"/);
    assert.match(links[1][1],/^https:\/\/github\.com\/UpstageAI\/eduteam-ai-edu-day$/);
    assert.match(links[1][0],/target="_blank"/);
    assert.match(links[1][0],/rel="noopener noreferrer"/);
    assert.doesNotMatch(html,/class="site-footer"/,filename);
    assert.match(html,/assets\/site\.css/);
    assert.match(html,/assets\/favicon\.svg/);
    assert.doesNotMatch(html,/<script[^>]*src="https?:/);
  }
});

test('shared stylesheet retains minimal rows, vertical detail layouts and responsive print rules', () => {
  const css=fs.readFileSync(path.join(root,'assets/site.css'),'utf8');
  for (const selector of ['.workshop-layout','.lesson-item','.learning-grid','.learning-card','.card-content','.card-bottom']) assert.ok(css.includes(selector),selector);
  assert.match(css,/@media\s*\(max-width:\s*760px\)/);
  assert.match(css,/@media print/);
  assert.doesNotMatch(css,/@import/);
});
