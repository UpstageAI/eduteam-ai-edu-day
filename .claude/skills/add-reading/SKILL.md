---
name: add-reading
description: Reading List에 바깥 글을 한국어로 실어 넣는다. 주소 하나만 받아 저작권을 확인하고, 번역 페이지와 카드와 메타데이터를 만들고, 테스트까지 통과시킨다. "이 글 읽을거리에 넣어줘", "Reading List에 추가", 링크만 던져 주는 요청에 발동한다.
---

# 읽을거리 추가

주소를 받아 `reading-list/<슬러그>/`를 만들고 홈과 Reading List에 카드를 다는 일이다. **저작권 확인이 1단계고, 이걸 건너뛰면 나머지가 다 무의미하다.**

## 1. 저작권 확인

원문 페이지에서 라이선스 표기를 찾는다. 찾은 결과에 따라 셋 중 하나로 간다.

| 원문 상태 | 실을 수 있는 것 |
|---|---|
| CC 라이선스 등 재배포 허용 표기가 있다 | 전문 번역. 라이선스 이름과 링크를 출처 줄에 적는다 |
| 표기가 없다 | **전문 번역 안 된다.** 한국어 요약 + 원문 링크로 싣거나, 저자에게 허락을 구한다 |
| 저자에게 허락을 받았다 | 전문 번역. `images/sources.json`에 허락 경위와 날짜를 적는다 |

이 저장소는 회사 조직 계정으로 공개 배포된다. 애매하면 요약으로 가고, 사용자에게 저자한테 물어볼 것을 권한다. 연락처는 대개 원문 페이지에 있다.

**원문 안의 사진은 따로 본다.** 글쓴이가 찍지 않은 사진은 글쓴이가 권리를 넘겨줄 수 없다. 저자 허락에 이미지가 포함되는지 명시적으로 확인하고, 아니면 사진을 빼거나 자유 이용이 허락된 다른 사진으로 갈음한다. Wikimedia Commons의 CC BY 사진이 대안이 된다.

## 2. 원문 확보

```bash
curl -sL "<주소>" -o /tmp/src.html
```

본문과 함께 **인라인 링크의 href를 뽑아 둔다.** 번역문에서도 같은 자리에 링크를 살린다.

## 3. 번역

- 문체는 원문 성격을 따른다. 독자에게 말 거는 편지·에세이는 합쇼체(`reading-list/what-is-a-harness/`), 3인칭 분석글은 해라체(`reading-list/forward-deployed-engineer/`)를 쓴다. 한 문서 안에서는 섞지 않는다.
- 문단을 합치거나 쪼개지 않는다. `data-source-paragraph="01"`을 순서대로 붙여 원문과 대조할 수 있게 한다.
- 고유명사와 제품명은 원어를 남긴다. 정착된 음차가 있으면 그것을 쓴다(harness → 하네스).
- **번역이 까다로운 기술 용어는 평이한 한국어로 풀되 첫 등장에 괄호로 원어를 적는다.** 낯선 입력(out-of-distribution), 보정 오차(ECE) 같은 식이다. 한국어로만 풀면 독자가 영문 문서에서 같은 개념을 만났을 때 이어 붙일 고리가 없고, 음차만 던지면 비전문가가 멈춘다. 이후에는 한국어만 쓰고, 한 문단에 괄호가 셋 이상 몰리면 그 문단에서 가장 중요한 것만 남긴다.
- 다 쓰면 `/better-writing`으로 마무리한다. HTML 소스의 줄바꿈을 "문단 안 하드 줄바꿈"으로 잡는 것은 오탐이니 붙이지 않는다.

## 4. 페이지 작성

`reading-list/forward-deployed-engineer/index.html`을 골격으로 복사해 쓴다. 빠뜨리기 쉬운 것들이다.

- `?v=` 버전 문자열은 `index.html`에 지금 쓰이는 값과 맞춘다.
- 돌아가기 링크는 `<p class="back"><a href="../../">` 하나만 둔다. breadcrumb는 없다.
- 제목은 `<h1 class="reader-title">`, 가운데 정렬은 공용 스타일이 한다.
- 맨 끝에 `<p id="original" class="source-link">`로 출처·저자·날짜·번역 범위를 적는다.
- 사진은 `images/`에 두고 `figure.source-figure` + `figcaption`으로 촬영자와 라이선스를 밝힌다. `images/sources.json`에 원본 URL, SHA-256, 가공 내역, 허락 경위를 기록한다.

## 5. 문서의 자기 선언

head에 여섯 줄을 넣는다. 카드는 이 선언을 되풀이할 뿐이고, 어긋나면 테스트가 실패한다.

```html
<meta name="resource:key"      content="reading-list/<슬러그>">
<meta name="resource:kind"     content="읽을거리">
<meta name="resource:format"   content="아티클">
<meta name="resource:category" content="reading">
<meta name="resource:title"    content="<제목>">
<meta name="resource:summary"  content="<한 문장>">
```

`resource:key`는 자기 폴더 경로와 같아야 한다. `format`은 아티클·논문·리서치·슬라이드·실습 중 하나를 쓴다.

## 6. 등록할 곳 일곱 군데

| 파일 | 할 일 |
|---|---|
| `index.html` | 카드 한 장. `data-resource-key`, `data-category="reading"` |
| `reading-list/index.html` | 같은 카드. `data-resource="<슬러그>"` |
| `assets/portal.js` | `curatedKeys`에 `reading-list/<슬러그>` 추가 |
| `tests/site.test.cjs` | `shellEntries`, 키 목록 `deepEqual`, 행 개수, `detailPages`(`'../../'`) |
| `tests/site.browser.js` | 정적 행 개수 두 곳 |
| `tests/reading-list.test.cjs` | 파일 목록 |
| `tests/reading-list.browser.js` | `[data-resource]` 개수 |

카드의 종류·형식·제목·설명은 5단계의 선언과 **글자 하나까지 같아야 한다.**

## 7. 검증

```bash
node --test tests/*.test.cjs                     # 전부 통과해야 한다
chromux launch pdfbox --headless
CHROMUX_PROFILE=pdfbox chromux open --background pdf http://127.0.0.1:8765/
for f in site reading-list calm-ui; do
  CHROMUX_PROFILE=pdfbox chromux run pdf --file tests/$f.browser.js --arg base=http://127.0.0.1:8765/
done
```

push한 뒤에는 같은 세 벌을 `--arg base=https://upstageai.github.io/eduteam-ai-edu-day/`로 한 번 더 돌린다. 로컬에서만 통과하고 실제 네트워크에서 깨지는 경우가 있다.
