# GAS Tutorial: Progressive LLM-Powered Automation (Google Apps Script)

A hands-on class where students use LLMs (ChatGPT/Claude) to generate Google Apps Script code and solve automation problems step-by-step.

> Core design: start easy (Sheets normalization) → move to Drive generation → inspect chaotic folders → finish with the advanced organizer challenge.

---

## Learning Goal

Students do not need to hand-write JavaScript from scratch.
They learn how to:

1. break a problem into smaller tasks,
2. ask an LLM with clear constraints,
3. run and verify each step,
4. refine prompts based on logs/errors.

---

## Progressive Class Flow

### Stage 1 (Beginner): Spreadsheet normalization + sheet matching
- Input:
  - Sheet1: name, age, applied track/role, application motivation (optional phone)
  - Sheet2: name, email
- Goal:
  - normalize inconsistent data (e.g., phone format, spacing)
  - match emails by name
  - produce a clean output sheet
- Script: `src/06_sheet_practice.js`

### Stage 2 (Intermediate): Drive folder/document generation
- Goal:
  - group applicants by track
  - create track folders
  - create one file per applicant named `Name.docx`
  - write motivation into each document
  - run safely in `dryRun` preview mode first
- Script: `src/07_drive_generation_practice.js`

### Stage 3 (Advanced Prep): Chaotic folder inspection (tree-style)
- Goal:
  - run `setup()` to generate the capstone workspace
  - inspect unknown Drive structures before solving
  - learn “discover first, then automate”
  - use safe default tree logs (folder-only first)
- Script: `src/08_tree_inspector.js`

### Stage 4 (Capstone): 72-file chaotic folder organizer
- Existing advanced challenge preserved
- Scripts:
  - setup: `src/01_setup.js`
  - solution reference: `src/03_solution.js`
  - verify: `src/04_verify.js`
  - reset: `src/05_reset.js`

---

## Repository Structure

```
gas-tutorial/
├── Makefile
├── README.md
├── .clasp.json.example
├── .claspignore
├── .gitignore
├── practices/                          ← 학생용: 프롬프트 + 참고 코드
│   ├── practice1_sheet_normalization/
│   │   ├── prompt.md
│   │   └── sample_solution.js
│   ├── practice2_drive_generation/
│   │   ├── prompt.md
│   │   └── sample_solution.js
│   ├── practice3_tree_inspector/
│   │   ├── prompt.md
│   │   └── sample_solution.js
│   └── practice4_capstone/
│       ├── prompt.md
│       └── sample_solution.js
├── src/                                ← GAS 배포용 (clasp push)
│   ├── 01_setup.js
│   ├── 02_helpers.js
│   ├── 03_solution.js
│   ├── 04_verify.js
│   ├── 05_reset.js
│   ├── 06_sheet_practice.js
│   ├── 07_drive_generation_practice.js
│   ├── 08_tree_inspector.js
│   └── appsscript.json
├── config/
│   └── file_manifest.js
├── assets/
│   └── a4-print.css
├── tools/
│   └── export_handout_pdf.sh
├── tutorial/
│   ├── 00_prerequisites.md
│   ├── 01_what_is_gas.md
│   ├── 02_what_can_gas_do.md
│   ├── 03_exercise_and_llm_guide.md
│   ├── 04_clasp_setup.md
│   ├── llm_prompt.md
│   ├── print_export_guide.md
│   ├── student_one_page_handout.md
│   ├── student_one_page_handout_bilingual.md
│   └── student_handout_a4_print_template.md
└── instructor/
    ├── answer_key.md
    ├── teaching_notes.md
    ├── live_session_script.md
    └── one_page_cheat_sheet.md
```

---

## Quick Start (Instructor)

1. Create an Apps Script project.
2. Copy the files from `config/` and `src/` into script tabs.
3. For beginner/intermediate class flow, connect the script to a Google Spreadsheet.
4. Use `tutorial/03_exercise_and_llm_guide.md` + `tutorial/llm_prompt.md` for step-by-step prompting.
5. For capstone challenge, run `setup()` then guide students through tree inspection + organizer implementation.
6. Export printable handout PDF with `make handout-pdf` (see `tutorial/print_export_guide.md`).

---

## Using `clasp` (Recommended: No More Copy-Paste)

Instead of manually copying each `.js` file into the Apps Script editor, use Google's official CLI tool [`clasp`](https://github.com/google/clasp):

```bash
# Install
npm install -g @google/clasp

# Login with Google account
clasp login

# Connect to your Apps Script project
cp .clasp.json.example .clasp.json
# Edit .clasp.json — paste your scriptId (from the Apps Script editor URL)

# Push all src/ files to GAS in one command
clasp push

# Open the editor to verify (replace YOUR_SCRIPT_ID)
# https://script.google.com/d/YOUR_SCRIPT_ID/edit
```

See `tutorial/04_clasp_setup.md` for the full setup guide (Korean).

---

## Why This Version Is More Realistic

In real work, people rarely write one perfect mega-prompt first try.
This tutorial trains a practical loop:

- inspect current state,
- solve one small sub-problem,
- verify output,
- ask the LLM again with better context.

That is the core skill students should take away.

---

## License

MIT License.
