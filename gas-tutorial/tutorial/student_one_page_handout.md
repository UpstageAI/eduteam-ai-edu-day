# GAS 실습 1페이지 핸드아웃 (학생용)

> 목표: LLM과 호흡을 맞추며 업무 자동화 과제를 단계별로 해결하기

---

## 오늘의 핵심 루프

**관찰 → 요청 → 실행 → 검증 → 재질문**

단번에 완벽한 코드를 얻으려 하기보다, 작은 성공을 빠르게 반복하며 완성해 나가는 것이 핵심입니다.

---

## 60분 실습 흐름

- Stage 1: 스프레드시트 데이터 정규화 및 이메일 매칭
- Stage 2: 트랙별 폴더 및 지원자 문서 자동 생성
- Stage 3: Drive 폴더 구조 트리 탐색
- Stage 4: 최종 Capstone 파일 자동 분류 및 `verify()` 검증

---

## Stage 1 (Beginner)

프롬프트: `tutorial/llm_prompt.md`의 Prompt 1

실행:
```text
runBeginnerNormalizationPractice()
```

성공 기준:
- `NormalizedApplicants` 시트가 새로 생성됨
- 이메일 매칭에 실패한 행의 표시(note) 확인

---

## Stage 2 (Intermediate)

프롬프트: Prompt 2

실행:
```text
runDriveFolderGenerationPractice()                      // 미리보기 (dry-run)
runDriveFolderGenerationPractice({ dryRun: false })     // 실제 폴더·문서 생성
```

성공 기준:
- `Applicants_By_Track` 루트 폴더 생성
- 트랙별 하위 폴더와 지원자별 `Name.docx` 문서 생성

---

## Stage 3 (Advanced Prep)

프롬프트: Prompt 3

실행:
```text
inspectWorkspaceTree()
// 더 자세한 탐색이 필요하면
inspectDriveTreeByName('GAS_Tutorial_Workspace', 6, true)
```

성공 기준:
- 출력된 트리 구조를 보고 파일 분류 규칙을 스스로 설명할 수 있음

---

## Stage 4 (Capstone)

프롬프트: Prompt 4

실행:
```text
solution()   // 또는 AI가 생성한 메인 함수
verify()
```

성공 기준:
- `verify()` 실행 시 분류 점수 향상 (목표: 72/72)
- 실패하거나 누락된 항목이 있으면 실행 로그를 바탕으로 AI에게 재질문

---

## 재질문 템플릿 (복사해서 사용)

```text
[에러 메시지]
...

[현재 코드]
...

[요청]
- GAS 환경에서 정상 동작하도록 수정해 줘
- 무엇이 문제였는지 수정 이유를 3줄로 설명해 줘
- 바로 붙여넣을 수 있게 전체 수정 코드를 다시 출력해 줘
```

---

## 실수 방지 체크리스트

- Node.js 전용 문법(`require`, `fs` 등)이 포함된 코드가 나오면 GAS 전용 문법으로 다시 요청하기
- 파일을 생성하거나 이동할 때는 `dryRun`(미리보기)으로 먼저 확인한 뒤 실제 실행하기
- 민감한 개인정보(실제 이름, 이메일, 전화번호, 비공개 URL 등)는 반드시 마스킹한 뒤 LLM에 공유하기

