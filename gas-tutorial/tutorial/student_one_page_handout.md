# GAS 실습 1페이지 핸드아웃 (학생용)

> 목표: LLM과 함께 자동화를 단계적으로 해결하기

---

## 오늘의 핵심 루프

**관찰 → 요청 → 실행 → 검증 → 재질문**

한 번에 완벽한 코드보다, 작은 성공을 반복하는 것이 중요합니다.

---

## 60분 실습 흐름

- Stage 1: 시트 정규화
- Stage 2: 트랙별 폴더/문서 생성
- Stage 3: Drive 구조 트리 탐색
- Stage 4: 최종 capstone 정리 + verify

---

## Stage 1 (Beginner)

프롬프트: `tutorial/llm_prompt.md`의 Prompt 1

실행:
```text
runBeginnerNormalizationPractice()
```

성공 기준:
- `NormalizedApplicants` 시트 생성
- 이메일 매칭 실패 행 note 확인

---

## Stage 2 (Intermediate)

프롬프트: Prompt 2

실행:
```text
runDriveFolderGenerationPractice()                      // 미리보기
runDriveFolderGenerationPractice({ dryRun: false })     // 실제 생성
```

성공 기준:
- `Applicants_By_Track` 폴더 생성
- 트랙별 폴더 + `Name.docx` 생성

---

## Stage 3 (Advanced Prep)

프롬프트: Prompt 3

실행:
```text
inspectWorkspaceTree()
// 필요하면
inspectDriveTreeByName('GAS_Tutorial_Workspace', 6, true)
```

성공 기준:
- 구조를 보고 정리 규칙을 설명 가능

---

## Stage 4 (Capstone)

프롬프트: Prompt 4

실행:
```text
solution()   // 또는 생성된 메인 함수
verify()
```

성공 기준:
- verify 점수 향상
- 실패 시 로그 기반 재질문

---

## 재질문 템플릿 (복붙)

```text
[에러 메시지]
...

[현재 코드]
...

[요청]
- GAS 환경에서 동작하도록 수정해줘
- 수정 이유를 3줄로 설명해줘
- 전체 수정 코드를 다시 출력해줘
```

---

## 실수 방지 체크

- Node.js 코드(`require`, `fs`) 나오면 다시 요청
- dry-run 먼저 실행하고 실제 실행
- 개인정보(이름/이메일/전화/URL)는 마스킹 후 LLM 공유

