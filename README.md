# Edu Team Day 정적 자료 사이트

이 저장소는 교육팀의 워크숍과 읽기 자료를 한 GitHub Pages 사이트에서 제공합니다. 홈에서 다섯 개의 대표 자료를 바로 열 수 있고, 각 워크숍은 안내 페이지에서 내용을 확인한 뒤 슬라이드와 실습 자료를 열 수 있습니다. 별도의 빌드나 패키지 설치는 필요하지 않습니다.

- 사이트: `https://upstageai.github.io/eduteam-ai-edu-day/`
- 배포 후 읽기 자료 경로: `https://upstageai.github.io/eduteam-ai-edu-day/reading-list/`
- 배포 기준: `main` 브랜치의 저장소 루트

## 자료 추가하는 법

자료를 손으로 등록할 필요는 없습니다. **주소나 말만 주고 코딩 에이전트에게 스킬 이름을 대면 됩니다.** 손대야 할 파일이 읽기 자료는 일곱 군데라, 그 순서를 `.claude/skills/`에 적어 두었습니다.

| 넣고 싶은 것 | 하는 말 |
|---|---|
| 바깥 글을 한국어로 싣고 싶다 | `<주소>` 이거 읽을거리에 넣어줘 (`add-reading`) |
| 용어나 저장소 링크를 남기고 싶다 | `<말>` 쪽지로 붙여줘 (`add-note`) |

스킬 이름을 대지 않아도 됩니다. 링크를 던지며 "읽을거리에 넣어줘"라고만 해도 `add-reading`이, "메모해줘"라고 하면 `add-note`가 붙습니다.

### 읽을거리 추가

원문의 저작권 표기를 먼저 살펴봅니다. **재배포를 허용하는 표기가 없으면 전문 번역을 싣지 않고** 한국어 요약과 원문 링크로 가거나, 저자에게 허락을 구하도록 알립니다. 원문 안의 사진은 글쓴이가 찍은 것이 아닐 수 있어 권리자를 따로 짚습니다.

그다음 번역 페이지와 이미지 출처 기록을 만들고, 문서에 메타데이터를 선언하고, 홈과 Reading List의 카드, `assets/portal.js`, 테스트 네 벌의 목록을 맞춘 뒤 로컬과 배포본 양쪽에서 검사합니다.

### 쪽지 추가

`notes.md` 맨 아래에 블록을 하나 붙입니다. 갈래를 링크 유무로 추측하지 않고, 그 쪽지의 본체가 저장소인지 찾아갈 곳인지 알아 둘 말인지로 고릅니다.

```text
## Design Diagram
kind: repo
전체 구조 설명할 때 보여 주기 좋은 저장소
https://github.com/cathrynlavery/diagram-design
```

`repo`와 `link`는 초록 모서리, `term`은 빨간 모서리로 표시되고, 적지 않으면 `term`입니다. 쪽지는 모두 같은 크기의 정사각형이고 마우스를 올리면 벽에서 살짝 떠오릅니다. 맨 아래에 새로 적으면 목록 맨 앞에 나옵니다.

## 로컬 실행

저장소 루트에서 정적 파일 서버를 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 다음 주소를 엽니다.

- 홈 포털: `http://localhost:8000/`
- Reading List: `http://localhost:8000/reading-list/`
- Google Apps Script 튜토리얼: `http://localhost:8000/gas-tutorial/`
- Oh-my-claude-code 사용기: `http://localhost:8000/omc-intro/`

서버를 종료하려면 실행 중인 터미널에서 `Ctrl-C`를 누릅니다. HTML 파일을 직접 열어도 기본 링크는 작동하지만, 사이트와 같은 조건에서 확인하려면 로컬 서버를 사용하는 편이 안전합니다.

## 자료 구조

```text
index.html                                      # 다섯 개의 대표 자료를 보여 주는 홈 포털
assets/
  site.css                                      # 홈·워크숍이 함께 쓰는 스타일
  portal.js                                     # 추가 자료를 찾는 선택적 GitHub 탐색 기능
  drawer.js                                     # 목록을 훑을 때 문서를 부드럽게 올리는 스크립트
  notes.js                                      # notes.md를 읽어 메모 쪽지를 붙이는 스크립트
notes.md                                        # 짧은 말과 링크 메모, 갈래는 kind로 밝힘
reading-list/
  index.html                                    # 읽기 자료 목록
  assets/                                       # 읽기 화면의 스타일과 기능
  externalization-llm-agents/                   # LLM 에이전트 외재화 자료
    index.html
  forward-deployed-engineer/
    index.html                                  # Latent Space 글의 한국어 전문 번역
  what-is-a-harness/
    index.html                                  # Earendil 글의 한국어 전문 번역
externalization-llm-agents/
  index.html                                    # 기존 공유 URL을 위한 호환 리다이렉트
gas-tutorial/
  index.html                                    # 60분 실습 안내와 자료 링크
  slides-gas-tutorial/dist/presentation.html    # 원본 슬라이드
omc-intro/
  index.html                                    # Oh-my-claude-code 사용기 안내
  slides-omc-intro/dist/
    presentation.html                           # 원본 슬라이드
    presentation.pdf                            # 원본 PDF
```

새 읽기 자료는 `reading-list/<자료명>/` 아래에 둡니다. 루트에는 슬라이드처럼 독립적으로 운영하는 자료만 추가합니다. 모든 내부 링크와 정적 파일 경로에는 상대 경로를 사용합니다.

## Reading List 구성

Reading List에는 다음 자료가 있습니다.

- **LLM 에이전트 외재화**: 기존 `externalization-llm-agents` 자료를 Reading List 안에서 읽을 수 있도록 정리했습니다.
- **Forward-Deployed Engineer 실무 가이드**: [Latent Space 원문](https://www.latent.space/p/forward-deployed-engineer-best-practices)의 한국어 전문 번역과 원문 이미지를 제공합니다. 원문의 57개 본문 문단과 8개 소제목, 부제와 이미지 설명을 순서대로 옮겼습니다. 이미지는 원문에서 첫 문단 앞, 12번째 문단 뒤, 28번째 문단 뒤에 나온 위치에 배치했습니다.
- **하네스란 무엇인가**: [Earendil 원문](https://earendil.com/posts/what-is-a-harness/)의 한국어 전문 번역입니다. 저자에게 직접 허락을 받아 실었고, 본문 끝에서 원문으로 연결합니다. 원문에 실린 등반 사진은 저자가 아니라 Tom Frost가 찍은 것으로, 저자가 사진까지 함께 써도 된다고 알려와 그대로 실었습니다. 촬영자 표기와 링크는 원문과 같이 사진 설명에 남겼고, `images/sources.json`에 원본 URL과 체크섬, 허락 경위와 날짜를 기록했습니다.

기존에 공유된 `/externalization-llm-agents/` 주소는 삭제하지 않고 새 위치로 연결합니다. 북마크와 문서에 남은 링크를 그대로 사용할 수 있습니다.

## 홈 포털과 워크숍 안내

루트 `index.html`에는 아래 다섯 자료가 정적 목록으로 들어 있습니다.

- Google Apps Script로 시작하는 업무 자동화
- Oh-my-claude-code 사용기
- LLM 에이전트의 외재화
- FDE의 부상과 제대로 일하는 방법
- 하네스란 무엇인가

홈과 Reading List는 상단의 `Upstage Education`·`GitHub` 링크와 자료 목록만 보여 줍니다. 각 항목은 제목, 짧은 요약과 이동 링크를 담은 네모난 문서이고, 분류와 형식은 문서 위쪽에 붙은 파일 탭(예: 워크숍 · 실습)에 적고, 탭 테두리만 워크숍은 연한 초록, 읽을거리는 연한 보라로 칠합니다. 문서는 서랍 속 서류철처럼 16px씩 뒤로 겹쳐 쌓이고, 이동 링크는 오른쪽에 있습니다. 작은 화면에서는 같은 순서로 줄을 바꾸며 가로 스크롤을 만들지 않습니다.

소개 문구, 중복 메뉴, 푸터, 검색·필터·자료 수·목록의 읽음 표시는 두지 않습니다. 워크숍 안내와 글은 별도 스크롤 패널 없이 본문 흐름으로 읽습니다. 링크와 버튼에는 150ms의 색상 전환을 적용합니다. 마우스로 목록을 훑으면 `assets/drawer.js`가 포인터 위치를 부드럽게 따라가며, 가까운 문서일수록 최대 12px까지 조금 더 올라옵니다. 키보드로 링크를 선택해도 같은 방식으로 움직입니다. 문서의 어느 곳을 눌러도 해당 자료가 열리고, 지원하는 브라우저에서는 문서 제목이 새 페이지의 제목 자리로 자연스럽게 옮겨 갑니다. 문서의 쌓임 순서와 클릭 영역은 바뀌지 않습니다. 터치 화면, 동작 줄이기 설정, JavaScript를 끈 환경에서는 움직이지 않고 모든 내용과 링크를 그대로 쓸 수 있습니다.

`assets/portal.js`는 저장소에서 아직 목록에 없는 루트 자료와 PPTX 파일을 찾아 같은 행 형식으로 덧붙입니다. JavaScript를 끄거나 GitHub API 호출에 실패해도 다섯 자료와 모든 기본 링크를 사용할 수 있습니다. Reading List 목록은 JavaScript 없이 작동합니다.

`gas-tutorial/`과 `omc-intro/`는 더 이상 슬라이드로 바로 보내는 리다이렉트가 아닙니다. 두 폴더의 `index.html`은 발표 내용과 자료 형식을 먼저 설명하고, 원본 슬라이드·PDF·프롬프트·참고 코드로 이동할 수 있는 워크숍 안내 페이지입니다. 공통 화면 요소는 `assets/site.css`를 사용하며 Reading List와 같은 색상과 타이포그래피를 따릅니다.

JavaScript를 사용할 수 있으면 GitHub의 `main` 브랜치 트리를 조회해 다음 항목도 추가합니다.

- 루트 바로 아래의 `<폴더>/index.html`
- 저장소 안의 `.pptx` 파일

Reading List의 세 글은 홈 목록에서도 바로 열 수 있습니다. 자동 탐색은 이미 등록된 글과 기존 `externalization-llm-agents/` 호환 주소를 중복으로 추가하지 않습니다.

## 자료 메타데이터

자료는 각자 자기 폴더에 문서와 이미지를 함께 담고 있으므로, 그 문서가 자기 정보를 직접 선언합니다. 각 `index.html`의 head에 `resource:key`, `resource:kind`, `resource:format`, `resource:category`, `resource:title`, `resource:summary` 여섯 개를 적습니다.

홈과 Reading List의 카드는 이 선언을 되풀이하는 목록일 뿐입니다. 둘이 어긋나면 `tests/site.test.cjs`가 실패하므로, 자료를 추가하거나 제목을 고칠 때는 문서의 선언을 먼저 바꾸고 카드를 맞추면 됩니다.

## 자료 편집

손으로 고칠 때를 위한 설명입니다. 자료를 새로 넣는 일은 위의 `add-reading`과 `add-note`가 같은 순서를 그대로 밟습니다.

### 슬라이드 추가

슬라이드는 기존 폴더 형식을 유지합니다.

```text
<폴더>/
  index.html
  slides-<폴더>/
    dist/
      presentation.html
      presentation.pdf                 # 선택 사항
```

`<폴더>/index.html`에서는 실제 슬라이드 HTML을 상대 경로로 연결합니다. 폴더 이름은 공유 URL이 되므로 운영 중인 폴더는 이름을 바꾸지 않습니다.

### 검사 명령

```bash
# 포털, 워크숍, 링크, 원문 보존, 이미지 체크섬, 리다이렉트 검사
node --test tests/*.test.cjs
node --check assets/portal.js

# 변경 파일 확인
git status --short
git diff --check
git diff -- index.html README.md tests/portal.test.cjs
```

이 저장소에는 빌드나 의존성 설치 단계가 없습니다. HTML, CSS, JavaScript를 수정한 뒤 로컬 서버와 Node.js 기본 테스트 러너로 검사합니다.

## 배포 전 확인 사항

- 홈, Reading List, 수정한 자료를 로컬 서버에서 엽니다.
- 이미지와 링크가 상대 경로를 사용하는지 살펴봅니다.
- `node --test tests/*.test.cjs`가 통과하는지 검사합니다.
- `.omc/`, `.omx/`, `node_modules/`, `.DS_Store`를 커밋하지 않습니다.
- `git status --short`로 의도한 파일만 포함됐는지 점검합니다.

GitHub Pages는 `main` 브랜치와 저장소 루트를 사용합니다. 배포가 끝나기 전에 연속으로 푸시하면 이전 배포가 취소될 수 있으므로, 직전 배포가 끝난 뒤 다음 변경을 푸시합니다.

### 원본 자료와 이미지 보존

기존 워크숍의 슬라이드 HTML과 OMC PDF는 안내 페이지에서 연결만 하며 파일 내용은 수정하지 않습니다. 회귀 테스트는 해당 파일의 SHA-256 체크섬을 확인합니다. 외재화 읽기 자료 두 편은 글과 그림은 그대로 두고, 자체 스타일만 배치 용도로 줄여 사이트와 같은 글꼴·색·단 너비를 따르게 했습니다. 카드와 표는 얇은 테두리로만 그리고 이모지는 뺐습니다. 읽기 자료의 원문 그림, 기존 외재화 자료 URL과 그림 URL도 그대로 유지합니다.

Latent.Space 자료의 원본 이미지 3개는 `reading-list/forward-deployed-engineer/images/`에 있습니다. `images/sources.json`에는 원문 URL, 원본 이미지 URL, 크기, SHA-256 체크섬을 기록했습니다. 이미지는 자르거나 다시 그리지 않았으며, 본문에서 출처와 원본 크기 링크를 제공합니다. 출처 표시는 별도의 이용 허가를 뜻하지 않습니다. 이미지 저작권은 해당 권리자에게 있습니다.

### 브라우저 검증

Chrome과 `chromux`가 설치된 환경에서는 아래 명령으로 홈 목록의 행 배치·이동 링크·반응형 화면을 먼저 확인하고, 이어서 글·원문 이미지·리다이렉트·JavaScript 비활성화·인쇄 화면을 검증할 수 있습니다. 읽기 화면은 별도 스크립트나 브라우저 저장소에 의존하지 않습니다.

```bash
chromux open site-test http://127.0.0.1:8000/
chromux run site-test --file tests/site.browser.js --arg base=http://127.0.0.1:8000/
chromux close site-test

chromux open reading-list-test http://127.0.0.1:8000/reading-list/
chromux run reading-list-test --file tests/reading-list.browser.js --arg base=http://127.0.0.1:8000/
chromux close reading-list-test

# 글자 대비, 가로 필드 순서, 오른쪽 이동 링크, 세로 흐름 확인
chromux open calm-ui-test http://127.0.0.1:8000/
chromux run calm-ui-test --file tests/calm-ui.browser.js --arg base=http://127.0.0.1:8000/
chromux close calm-ui-test
```

이전 주소로 연결된 그림도 깨지지 않도록 기존 `externalization-llm-agents/` 경로에 원본 그림의 호환용 사본을 유지합니다. 새 콘텐츠를 추가할 때는 `reading-list/` 아래를 사용합니다.

## 기존 슬라이드 운영 참고

배포 시에는 의도한 경로만 명시해 스테이징합니다. `git add .`이나 `git add -A`로 로컬 작업 파일을 함께 추가하지 않습니다. PDF와 PPTX는 원본 HTML 옆에 둡니다.

### PDF generation (HTML → PDF)

Read the slide size from `dist/presentation.html` (`--slide-w` / `--slide-h`), patch `@page { size: ... }` in a temp copy, then render with headless Chrome:

```bash
# Example slide size: 960x540
SRC=./slides-<folder>/dist/presentation.html
DST=./slides-<folder>/dist/presentation.pdf

cp "$SRC" /tmp/print.html
sed -i '' 's/@page { size: landscape; margin: 0; }/@page { size: 960px 540px; margin: 0; }/' /tmp/print.html

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$DST" --print-to-pdf-no-header \
  --virtual-time-budget=10000 "file:///tmp/print.html"
```

### Pages 배포 상태 확인

```bash
gh api repos/UpstageAI/eduteam-ai-edu-day/pages/builds/latest
```

기존 사이트는 브랜치 기반 Pages 배포를 사용합니다. 사용자 승인 없이 배포 방식을 바꾸거나 별도 Pages 워크플로를 추가하지 않습니다. 배포가 멈추면 먼저 직전 작업의 완료 여부와 저장소의 Pages 설정을 확인합니다.

정적 검사와 브라우저 검증을 마친 변경만 기존 `main` 브랜치에 게시합니다. 배포 후에는 Pages 빌드 상태와 실제 사이트의 화면·링크를 모두 살펴봅니다.
