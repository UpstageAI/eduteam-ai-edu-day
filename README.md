# Edu Team Day (GitHub Pages 운영 가이드)

이 저장소는 **GitHub Pages 1개 사이트**를 사용하고, 그 안에서 **여러 폴더 경로**로 슬라이드를 운영합니다.

- Pages 루트: `https://upstageai.github.io/eduteam-ai-edu-day/`
- 폴더별 페이지 예시: `https://upstageai.github.io/eduteam-ai-edu-day/gas-tutorial/`

---

## README for Agents

Deterministic instructions for Coding Agents (Claude Code, Codex, Gemini, etc.) working in this repo. Human readers can skip to the Korean guide below.

### Repo role

A static portal that exposes multiple HTML slide decks under `https://upstageai.github.io/eduteam-ai-edu-day/<folder>/`. Each `<folder>/` is one deck.

### Invariants

- Default branch is `main`. Pages deploys from `main` + `/ (root)` (legacy `build_type=branch`). Always push to `main`.
- Each deck lives in its own root-level `<folder>/`. Never rename an existing folder (its URL is shared).
- Folder entry point is `<folder>/index.html` — a redirect to the actual slide HTML (see `gas-tutorial/index.html`).
- Use **relative paths only**. Never hardcode `/eduteam-ai-edu-day/...` (must work both locally and on Pages).
- Do **not** commit `.omc/`, `.omx/`, `node_modules/`, `.DS_Store`.
- Keep PDF/PPTX next to the source HTML so both originals and exports are discoverable.
- Avoid rapid back-to-back pushes to `main` — the legacy Pages pipeline can deadlock if a deploy is cancelled mid-flight. Wait for the previous build to finish (`gh api repos/UpstageAI/eduteam-ai-edu-day/pages/builds/latest`) before pushing again.

### Canonical layout

```text
<folder>/
  index.html                           # entry — redirects to slides/dist/presentation.html
  slides-<folder>/
    dist/
      presentation.html                # built single-file HTML (required)
      presentation.pdf                 # PDF export (recommended)
```

### Playbook: add a new deck

1. Prepare the slide HTML locally and verify it renders.
2. Create `<folder>/slides-<folder>/dist/` at the repo root.
3. Copy `presentation.html` (and `presentation.pdf` if available).
4. Create `<folder>/index.html` from this template (replace `<folder>` only):

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

5. Stage only the new folder: `git add <folder>/` (never `git add .` or `-A`).
6. Commit message style: `Add <folder> slides` or `Update <folder> ...` (short, imperative, English).
7. `git push origin main`, then wait 1–3 min for Pages to rebuild and verify the URL.

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

### Pre-push checklist

- [ ] `<folder>/index.html` exists and redirects to a real file
- [ ] `<folder>/slides-<folder>/dist/presentation.html` exists
- [ ] `git status` shows only intended files (no `.omc/`, `.omx/`)
- [ ] `open <folder>/index.html` works locally
- [ ] All internal links/images use relative paths

### Auto-listing

The root `index.html` scans the `main` branch tree via the GitHub API and renders cards for every `<folder>/index.html` and `.pptx`. Just push — no manual list edit needed.

### Common failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 after deploy | Pages still building | wait 1–3 min, retry |
| Page loads but blank | wrong redirect path in `index.html` | check DevTools → Network for 404 |
| CSS/images broken | absolute paths used | switch to relative (`./`) |
| Missing from portal list | not pushed to `main` or `<folder>/index.html` missing | check and re-push |
| Pages stuck at `updating_pages` and times out | a previous deploy was cancelled mid-flight, or `build_type` was changed | revert to `build_type=legacy` (`gh api --method PUT repos/UpstageAI/eduteam-ai-edu-day/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'`), remove any custom `.github/workflows/pages.yml`, and push a clean commit |

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

