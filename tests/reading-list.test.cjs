const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const baseline = require('./externalization-baseline.json');
test('existing externalization articles and all figures remain intact', () => {
  const folder = fs.existsSync(path.join(root, 'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist'))
    ? 'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist'
    : 'externalization-llm-agents/slides-externalization-llm-agents/dist';
  for (const [name, hash] of Object.entries(baseline)) {
    let content = fs.readFileSync(path.join(root, folder, name));
    if (name.endsWith('.html')) content = Buffer.from(content.toString().match(/<article\b[\s\S]*?<\/article>/)[0]);
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), hash, name);
  }
});

function filesBelow(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? filesBelow(file) : [file];
  });
}
const readingFiles = () => filesBelow(path.join(root, 'reading-list')).filter(file => file.endsWith('.html'));
test('collection and both resources exist as static, Korean-first HTML', () => {
  for (const name of ['index.html','externalization-llm-agents/index.html','forward-deployed-engineer/index.html']) {
    const html = fs.readFileSync(path.join(root, 'reading-list', name), 'utf8');
    assert.match(html, /<html lang="ko">/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, name);
    assert.match(html, /<main\b[^>]*id="content"/);
    assert.match(html, /<meta name="viewport"/);
  }
});

test('every local document link, image, stylesheet, script and fragment resolves', () => {
  const files = [...readingFiles(), ...filesBelow(path.join(root, 'externalization-llm-agents')).filter(file => file.endsWith('.html'))];
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `duplicate IDs: ${file}`);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const reference = match[1];
      if (/^(https?:|mailto:|data:)/.test(reference)) continue;
      assert.ok(!reference.startsWith('/'), `absolute local URL: ${reference}`);
      const url = new URL(reference, 'https://example.test/' + path.relative(root,file));
      let destination = path.join(root, decodeURIComponent(url.pathname));
      if (url.pathname.endsWith('/')) destination = path.join(destination,'index.html');
      assert.ok(fs.existsSync(destination), `${path.relative(root,file)} => ${reference}`);
      if (url.hash) {
        const fragment = decodeURIComponent(url.hash.slice(1));
        const target = fs.readFileSync(destination,'utf8');
        assert.ok(target.includes(`id="${fragment}"`), `missing fragment ${reference} in ${file}`);
      }
    }
  }
});

test('legacy URLs redirect to canonical documents and preserve query and fragment', () => {
  const vm = require('node:vm');
  for (const name of ['index.html','slides-externalization-llm-agents/dist/presentation.html','slides-externalization-llm-agents/dist/eli5.html']) {
    const html = fs.readFileSync(path.join(root, 'externalization-llm-agents', name), 'utf8');
    const target = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)[1];
    for (const prefix of ['/', '/eduteam-ai-edu-day/']) {
      const url = new URL('https://example.test' + prefix + 'externalization-llm-agents/' + name + '?from=bookmark#s3');
      let redirected;
      vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
        URL,
        window: { location: { href:url.href,search:url.search,hash:url.hash,replace:value=>{redirected=new URL(value);} } }
      });
      assert.equal(redirected.pathname,new URL(target,url).pathname);
      assert.ok(redirected.pathname.startsWith(prefix+'reading-list/'));
      assert.equal(redirected.hash,'#s3');
      assert.equal(redirected.search,'?from=bookmark');
    }
  }
});

test('all three article images are local unmodified originals with source provenance', () => {
  const folder = path.join(root,'reading-list/forward-deployed-engineer');
  const { images } = JSON.parse(fs.readFileSync(path.join(folder,'images/sources.json')));
  const html = fs.readFileSync(path.join(folder,'index.html'),'utf8');
  assert.equal(images.length,3);
  for (const asset of images) {
    assert.equal(asset.modified,false);
    assert.match(asset.original_url,/^https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\//);
    assert.equal(asset.source_page,'https://www.latent.space/p/forward-deployed-engineer-best-practices');
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,asset.file))).digest('hex'),asset.sha256);
    assert.ok(html.includes(`src="./${asset.file}"`));
    assert.ok(html.includes(`width="${asset.width}" height="${asset.height}"`));
  }
  assert.match(html,/전문 번역이 아닙니다/);
});

test('reader HTML has progressive controls, accessible navigation and no added remote runtime', () => {
  for (const file of readingFiles()) {
    const html=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(html,/<script[^>]*src="https?:/);
    assert.doesNotMatch(html,/@import/);
    if (html.includes('data-reader>')) {
      assert.match(html,/data-reader-control hidden/);
      assert.match(html,/aria-label="글 목차"/);
      assert.match(html,/data-reading-id="(?:externalization-llm-agents|forward-deployed-engineer)"/);
    }
  }
});

test('legacy embedded figure URLs retain the same original image bytes', () => {
  for (const [name,hash] of Object.entries(baseline).filter(([name]) => name.startsWith('figures/'))) {
    const image = fs.readFileSync(path.join(root,'externalization-llm-agents/slides-externalization-llm-agents/dist',name));
    assert.equal(crypto.createHash('sha256').update(image).digest('hex'),hash,name);
  }
});

test('legacy reader styles begin with a valid root rule after removing font imports', () => {
  for (const name of ['eli5.html','presentation.html']) {
    const html=fs.readFileSync(path.join(root,'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist',name),'utf8');
    assert.match(html,/<style>\s*:root\s*\{/);
    assert.doesNotMatch(html,/fonts\.googleapis\.com/);
  }
});
