# Edu Team Day (GitHub Pages 운영 가이드)

이 저장소는 **GitHub Pages 1개 사이트**를 사용하고, 그 안에서 **여러 폴더 경로**로 슬라이드를 운영합니다.

- Pages 루트: `https://upstageai.github.io/eduteam-ai-edu-day/`
- 폴더별 페이지 예시: `https://upstageai.github.io/eduteam-ai-edu-day/gas-tutorial/`

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

- `gas-tutorial/`
- `gas-tutorial/slides-gas-tutorial/dist/presentation.html`

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

