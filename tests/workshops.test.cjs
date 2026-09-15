const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const gasPath = path.join(root, 'gas-tutorial', 'index.html');
const omcPath = path.join(root, 'omc-intro', 'index.html');
const gas = fs.readFileSync(gasPath, 'utf8');
const omc = fs.readFileSync(omcPath, 'utf8');

function count(source, pattern) {
  return Array.from(source.matchAll(pattern)).length;
}

function localLinks(source) {
  return Array.from(source.matchAll(/<a\b[^>]*href="([^"]+)"/g), (match) => match[1])
    .filter((href) => href.startsWith('./') || href.startsWith('../'));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('workshop entries are semantic landing pages instead of redirects', () => {
  for (const source of [gas, omc]) {
    assert.equal(count(source, /<h1(?:\s|>)/g), 1, 'each page should have one h1');
    assert.match(source, /<main id="content" class="container" tabindex="-1">/);
    assert.match(source, /<a class="skip-link" href="#content">본문으로 건너뛰기<\/a>/);
    assert.doesNotMatch(source, /http-equiv="refresh"|location\.replace|window\.location/);
    assert.match(source, /\.\.\/reading-list\/assets\/reading-list\.css/);
    assert.match(source, /\.\.\/assets\/site\.css/);
  }
});

test('workshop headers keep the shared navigation and brand', () => {
  for (const source of [gas, omc]) {
    assert.match(source, /class="site-header"/);
    assert.match(source, /class="brand-mark"[^>]*>e\.<\/span>/);
    assert.match(source, /class="brand-copy">Upstage Education[\s\S]*?AI Edu Day<\/span>/);
    assert.match(source, /href="\.\.\/#resources"[^>]*>학습 자료<\/a>/);
    assert.match(source, /href="\.\.\/reading-list\/">Reading List<\/a>/);
    assert.match(source, /href="https:\/\/github\.com\/UpstageAI\/eduteam-ai-edu-day"/);
  }
});

test('GAS entry describes the repository-backed 60-minute, 36-slide, four-stage workshop', () => {
  assert.match(gas, /Google Apps Script 업무 자동화 실습/);
  assert.match(gas, /<span class="pill">60분<\/span>/);
  assert.match(gas, /<span class="pill">36장<\/span>/);
  assert.equal(count(gas, /class="lesson-item"/g), 4);
  assert.match(gas, /시트 정규화와 이메일 매칭/);
  assert.match(gas, /Drive 폴더와 문서 생성/);
  assert.match(gas, /Drive 디렉터리 구조 확인/);
  assert.match(gas, /72개 파일 정리 Capstone/);
  assert.match(gas, /href="\.\/slides-gas-tutorial\/dist\/presentation\.html">슬라이드 열기<\/a>/);

  for (let stage = 1; stage <= 4; stage += 1) {
    assert.match(gas, new RegExp(`practices/practice${stage}_[^\"]+/prompt\\.md\" download`));
    assert.match(gas, new RegExp(`practices/practice${stage}_[^\"]+/sample_solution\\.js`));
  }
  assert.match(gas, /href="\.\/tutorial\/student_one_page_handout\.md" download>핸드아웃 내려받기 \(\.md\)<\/a>/);
});

test('OMC entry uses the source title and preserves both presentation formats', () => {
  assert.match(omc, /<title>Oh-my-claude-code 사용기 · AI Edu Day<\/title>/);
  assert.match(omc, /<span class="pill">20장<\/span>/);
  assert.equal(count(omc, /class="lesson-item"/g), 4);
  assert.match(omc, /Harness Engineering/);
  assert.match(omc, /Oh-my-Claude-Code/);
  assert.match(omc, /OMC 활용 경험/);
  assert.match(omc, /Skill 시스템/);
  assert.match(omc, /href="\.\/slides-omc-intro\/dist\/presentation\.html">슬라이드 열기<\/a>/);
  assert.match(omc, /href="\.\/slides-omc-intro\/dist\/presentation\.pdf" download>원본 PDF 내려받기<\/a>/);
  assert.doesNotMatch(omc, /Oh My Codex/i);
});

test('every local workshop link resolves to an existing file or directory', () => {
  for (const [entryPath, source] of [[gasPath, gas], [omcPath, omc]]) {
    for (const href of localLinks(source)) {
      const target = href.split('#')[0].split('?')[0];
      assert.ok(fs.existsSync(path.resolve(path.dirname(entryPath), target)), `${href} from ${path.relative(root, entryPath)} should resolve`);
    }
  }
});

test('original workshop slide and PDF bytes remain unchanged', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'workshop-baseline.json'), 'utf8'));

  for (const [relativePath, expectedHash] of Object.entries(baseline)) {
    assert.equal(sha256(path.join(root, relativePath)), expectedHash, `${relativePath} should remain byte-identical`);
  }
});
