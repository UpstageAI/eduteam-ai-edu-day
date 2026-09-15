const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'reading-list/forward-deployed-engineer/index.html'),'utf8');
// Paragraph boundaries follow the full English text supplied in the conversation.
const sectionCounts = {
  introduction:5, misunderstandings:5, 'project-frontline':9, 'fdes-today':4,
  'nouns-and-verbs':9, product:4, fork:3, kepler:10, moat:8,
};

test('full translation contains all 57 source paragraphs and eight original section headings', () => {
  const paragraphs = [...html.matchAll(/<p data-source-paragraph="(\d+)">([\s\S]*?)<\/p>/g)];
  assert.equal(paragraphs.length,57);
  assert.deepEqual(paragraphs.map(p=>Number(p[1])),Array.from({length:57},(_,i)=>i+1));
  assert.equal((html.match(/<h2 id="heading-/g)||[]).length,8);
  for (const [section,count] of Object.entries(sectionCounts)) {
    const body=html.match(new RegExp(`<section id="${section}"[^>]*>([\\s\\S]*?)</section>`))[1];
    assert.equal((body.match(/data-source-paragraph=/g)||[]).length,count,section);
  }
});

test('each original image occupies its exact source-relative position', () => {
  const flow=[...html.matchAll(/data-source-(paragraph|image)="(\d+)"/g)].map(m=>`${m[1]}:${Number(m[2])}`);
  for (const [image,previous,next] of [[1,null,1],[2,12,13],[3,28,29]]) {
    const index=flow.indexOf(`image:${image}`);
    assert.ok(index>=0);
    if(previous===null)assert.equal(index,0);
    else assert.equal(flow[index-1],`paragraph:${previous}`);
    assert.equal(flow[index+1],`paragraph:${next}`);
  }
});

test('title, supplied date, translated subtitle, captions and complete final bio are preserved', () => {
  assert.match(html,/<h1[^>]*>포워드 디플로이드 엔지니어의 부상과 제대로 일하는 방법<\/h1>/);
  assert.match(html,/<time datetime="2026-09-13">2026\. 09\. 13\.<\/time>/);
  assert.match(html,/<p class="reader-subtitle">[^<]*Project Frontline[^<]*<\/p>/);
  assert.match(html,/FDE와 컨설팅의 차이\. 도식: Vinoo Ganesh\./);
  assert.match(html,/아프가니스탄 바그람 비행장에 현장 배치되어 일하던 나\./);
  assert.match(html,/명칭은 표면에 드러난 모습이고, 그 아래에는 운영 모델이 있다\./);
  const final=html.match(/data-source-paragraph="57">([\s\S]*?)<\/p>/)[1];
  for(const name of ['Vinoo Ganesh','Kepler','Palantir','Spark','Project Frontline','Citadel','LinkedIn']) assert.ok(final.includes(name),name);
  assert.match(final,/https:\/\/www\.linkedin\.com\/in\/vinoo-ganesh\//);
});

test('quantitative case details and key technical vocabulary are not omitted', () => {
  for(const term of ['250명','롱테일','2013년','1970년 1월 1일','10분','230만','5MB','14TB','Cassandra','KYC','AML','20%','80%','org_id','여섯 사람','4년','CSV','Parquet','S3','Windows','2일','17시간','2시간','vinoo.groovy','10만 명','14개월','2011년','6주','세 번째','한 분기','한 달에 네 번','열 번째']) assert.ok(html.includes(term),term);
});

test('FDE listings describe a full translation, not the old summary', () => {
  for(const filename of ['index.html','reading-list/index.html']) {
    const source=fs.readFileSync(path.join(root,filename),'utf8');
    const card=source.match(/<article[^>]*data-(?:resource-key="reading-list\/forward-deployed-engineer"|resource="forward-deployed-engineer")[\s\S]*?<\/article>/)[0];
    assert.match(card,/전문 번역/);
    assert.doesNotMatch(card,/요약|약 3분/);
  }
  assert.doesNotMatch(html,/핵심 요약|한국어 요약|팀 토론을 위한 질문|class="editorial-note"|class="source-gallery"/);
});
