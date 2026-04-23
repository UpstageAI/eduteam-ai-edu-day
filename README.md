# Edu Team Day (GitHub Pages 운영 가이드)

이 저장소는 **GitHub Pages 1개 사이트**를 사용하고, 그 안에서 **여러 폴더 경로**로 슬라이드를 운영합니다.

- Pages 루트: `https://upstageai.github.io/eduteam-ai-edu-day/`
- 폴더별 페이지 예시: `https://upstageai.github.io/eduteam-ai-edu-day/gas-tutorial/`

---

## README for Agents

이 섹션은 Coding Agent(예: Claude Code, Codex, Gemini)가 이 저장소에서 작업할 때 **그대로 따라 하면 되는 결정론적 지침**입니다. 사람 독자는 아래 일반 가이드를 참고하세요.

### Repo 역할 (한 줄 요약)

`https://upstageai.github.io/eduteam-ai-edu-day/<folder>/` 경로로 여러 HTML 슬라이드를 노출하는 **정적 포털**. 각 `<folder>/`는 하나의 발표 자료를 담는 단위.

### Invariants (반드시 지킬 것)

- **기본 브랜치는 `main`**. Pages가 `main` + `/ (root)`로 배포되므로, `main`에 푸시해야 반영됨.
- **각 발표 자료는 반드시 루트의 별도 폴더**에 둔다. 기존 폴더를 수정할 때는 폴더 이름을 유지한다 (URL이 공유된 상태).
- **폴더 진입점은 `<folder>/index.html`**. 리다이렉트 방식이 표준 (`gas-tutorial/index.html` 참고).
- **상대경로만 사용**. `/eduteam-ai-edu-day/...` 같은 절대경로는 쓰지 않는다 (로컬/Pages에서 동시 동작 필요).
- `.omc/`, `.omx/`, `node_modules/`, `.DS_Store`는 커밋하지 않는다.
- PDF/PPTX는 같은 폴더 안에 함께 두어 Agent가 원본과 변환본을 쉽게 찾게 한다.

### Canonical 폴더 구조

```text
<folder>/
  index.html                             # 진입점 — slides/dist/presentation.html로 리다이렉트
  slides-<folder>/
    dist/
      presentation.html                  # 빌드된 단일 HTML (필수)
      presentation.pdf                   # PDF 버전 (권장)
```

### Playbook: 새 발표 자료 추가

1. 소스 슬라이드 HTML을 준비 (로컬에서 렌더 확인 완료).
2. 이 저장소 루트에 폴더 생성: `<folder>/slides-<folder>/dist/`.
3. `presentation.html`(+ 있으면 `presentation.pdf`) 복사.
4. `<folder>/index.html` 생성 — 아래 템플릿을 그대로 사용하고 `<folder>` 토큰만 치환.

   ```html
   <!doctype html>
   <html lang="ko">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title><folder> Presentation</title>
       <meta http-equiv="refresh" content="0; url=./slides-<folder>/dist/presentation.html" />
       <script>
         window.location.replace('./slides-<folder>/dist/presentation.html');
       </script>
     </head>
     <body>
       <p>Redirecting to <a href="./slides-<folder>/dist/presentation.html">presentation.html</a>...</p>
     </body>
   </html>
   ```

5. 스테이징은 **폴더 단위로만** 한다: `git add <folder>/` (와일드카드 `.`, `-A` 금지).
6. 커밋 메시지 스타일: `Add <folder> slides` 또는 `Update <folder> ...` (짧은 명령형, 영문).
7. `git push origin main` 후 1~3분 뒤 Pages URL 접속 검증.

### PDF 생성 (HTML → PDF)

`dist/presentation.html`의 슬라이드 크기(`--slide-w` / `--slide-h`)를 확인 후, 임시 복사본에서 `@page { size: ... }`를 맞추고 Chrome 헤드리스로 렌더:

```bash
# 슬라이드 크기 예: 960x540
SRC=./slides-<folder>/dist/presentation.html
DST=./slides-<folder>/dist/presentation.pdf

cp "$SRC" /tmp/print.html
sed -i '' 's/@page { size: landscape; margin: 0; }/@page { size: 960px 540px; margin: 0; }/' /tmp/print.html

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$DST" --print-to-pdf-no-header \
  --virtual-time-budget=10000 "file:///tmp/print.html"
```

### 검증 체크리스트 (푸시 전)

- [ ] `<folder>/index.html` 존재하고 리다이렉트 URL이 실제 파일을 가리키는가
- [ ] `<folder>/slides-<folder>/dist/presentation.html` 존재
- [ ] `git status`에 의도한 파일만 스테이지됨 (`.omc/`, `.omx/` 등 미포함)
- [ ] 로컬에서 `open <folder>/index.html` — 슬라이드가 정상 표시됨
- [ ] 내부 링크/이미지 경로가 전부 상대경로

### 자동 연동

루트 `index.html`은 GitHub API로 `main` 브랜치 트리를 스캔해 `<folder>/index.html`과 `.pptx`를 **자동으로 카드로 렌더**합니다. 푸시만 하면 포털 목록에 반영되므로, 목록 파일을 수동 수정할 필요 없음.

### 자주 실패하는 지점

| 증상 | 원인 | 해결 |
|------|------|------|
| 배포 후 404 | Pages 빌드 중 | 1~3분 대기 후 재시도 |
| 진입은 되는데 빈 화면 | `index.html` 리다이렉트 경로 오타 | 브라우저 DevTools → Network에서 404 확인 |
| CSS/이미지 깨짐 | 절대경로 사용 | 상대경로(`./`)로 수정 |
| 목록에 안 나타남 | `main`에 푸시 안 됨 or `<folder>/index.html` 없음 | 확인 후 재푸시 |

---

## 핵심 개념

- 한 저장소에서 Pages 설정은 보통 1개입니다. (브랜치/폴더 소스 1개)
- 대신 `/<폴더명>/` 형태로 여러 페이지를 함께 운영할 수 있습니다.
- 즉, "사이트는 하나"지만 "경로는 여러 개"를 가질 수 있습니다.

---

## 새 폴더로 HTML 슬라이드 올리는 방법

아래 순서대로 진행하세요.

### 1) 폴더 생성
예: `my-workshop/`

### 2) 슬라이드 HTML 배치
예시 구조:

```text
my-workshop/
  index.html
  slides/
    presentation.html
```

> 권장: `my-workshop/index.html`에서 실제 슬라이드 파일로 리다이렉트하면 URL이 깔끔해집니다.

### 3) (선택) index.html 리다이렉트 예시

```html
<!doctype html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=./slides/presentation.html" />
    <script>location.replace('./slides/presentation.html');</script>
  </head>
  <body>Redirecting...</body>
</html>
```

### 4) 변경사항 커밋

```bash
git add my-workshop
git commit -m "Add my-workshop slides"
```

### 5) main 브랜치로 푸시

```bash
git push origin main
```

### 6) Pages 설정 확인 (최초 1회)
GitHub 저장소에서:
- **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**

### 7) 접속 URL

- 폴더 진입점: `https://upstageai.github.io/eduteam-ai-edu-day/my-workshop/`
- 직접 파일: `https://upstageai.github.io/eduteam-ai-edu-day/my-workshop/slides/presentation.html`

---

## 현재 운영 중인 경로

- `gas-tutorial/` — `gas-tutorial/slides-gas-tutorial/dist/presentation.html`
- `omc-intro/` — `omc-intro/slides-omc-intro/dist/presentation.html`

---

## 자주 발생하는 문제

1. **404 발생**
   - Pages 배포가 아직 안 끝났을 수 있습니다 (1~3분 대기)
   - 브랜치/폴더 설정이 `main` + `/ (root)`인지 확인

2. **스타일/정적 파일 누락**
   - 상대경로(`./`) 기준이 맞는지 확인
   - 파일이 실제 커밋/푸시 되었는지 확인

3. **폴더 링크는 보이는데 내용이 안 열림**
   - 해당 폴더에 `index.html`이 있는지 확인

