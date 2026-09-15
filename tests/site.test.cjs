const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'),'utf8');
const publicEntries = ['index.html','gas-tutorial/index.html','omc-intro/index.html','reading-list/index.html','reading-list/externalization-llm-agents/index.html','reading-list/forward-deployed-engineer/index.html'];

test('actual home markup matches the progressive catalog contract', () => {
  assert.match(home,/<script src="\.\/assets\/portal\.js" defer>/);
  assert.deepEqual([...home.matchAll(/data-resource-key="([^"]+)"/g)].map(m=>m[1]),['gas-tutorial','omc-intro','reading-list/externalization-llm-agents','reading-list/forward-deployed-engineer']);
  for (const id of ['pages','resources','catalog-controls','catalog-search','catalog-count','catalog-empty','catalog-reset','catalog-feedback']) assert.match(home,new RegExp(`id="${id}"`));
  assert.match(home,/id="catalog-controls"[^>]*hidden/);
  assert.match(home,/data-category-filter="all" aria-pressed="true"/);
  assert.equal((home.match(/data-category="workshop"/g)||[]).length,2);
  assert.equal((home.match(/data-category="reading"/g)||[]).length,2);
  for (const selector of ['hero-art','card-visual','collection-feature','learning-principle','intro-strip']) {
    assert.doesNotMatch(home,new RegExp(`class="[^"]*\\b${selector}\\b`),`${selector} should not return to the editorial home`);
  }
  assert.equal((home.match(/<img\b/g)||[]).length,0,'the home catalog should not add decorative or thumbnail images');
  assert.doesNotMatch(home,/<script>/);
});

test('catalog rows retain complete editorial content without visual cards', () => {
  const cards=[...home.matchAll(/<article class="learning-card"[\s\S]*?<\/article>/g)].map(match=>match[0]);
  assert.equal(cards.length,4);
  for (const card of cards) {
    for (const className of ['card-content','card-label','type-label','card-description','card-bottom']) {
      assert.match(card,new RegExp(`class="[^"]*\\b${className}\\b`));
    }
    assert.match(card,/<h3><a href="[^"]+">/);
  }
  const readingHome=fs.readFileSync(path.join(root,'reading-list/index.html'),'utf8');
  assert.doesNotMatch(readingHome,/class="[^"]*\bcard-art\b/);
  assert.equal((readingHome.match(/data-resource="/g)||[]).length,2);
});

test('all portal and landing links/assets/fragments resolve under the repo root', () => {
  for (const filename of publicEntries) {
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

test('the public page family shares branding, keyboard entry and responsive styles', () => {
  for (const filename of publicEntries) {
    const html=fs.readFileSync(path.join(root,filename),'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,filename);
    assert.match(html,/<html lang="ko">/);
    assert.match(html,/<main[^>]*id="content"[^>]*tabindex="-1"/);
    assert.match(html,/class="site-header"/);
    assert.match(html,/class="site-footer"/);
    assert.match(html,/assets\/site\.css/);
    assert.match(html,/assets\/favicon\.svg/);
    assert.match(html,/href="[^"#]*reading-list\/"/);
    assert.doesNotMatch(html,/<script[^>]*src="https?:/);
  }
});

test('shared stylesheet includes workshop, editorial responsive and print contracts', () => {
  const css=fs.readFileSync(path.join(root,'assets/site.css'),'utf8');
  for (const selector of ['.workshop-layout','.lesson-item','.home-hero','.catalog-controls','.learning-card']) assert.ok(css.includes(selector),selector);
  assert.match(css,/@media\s*\(max-width:\s*760px\)/);
  assert.match(css,/@media\s*\(max-width:\s*370px\)/);
  assert.match(css,/@media print/);
  assert.doesNotMatch(css,/@import/);
});
