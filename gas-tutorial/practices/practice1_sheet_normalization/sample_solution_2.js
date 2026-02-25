/**
 * Sheet1 데이터를 정리하고 Sheet2에서 이메일을 매칭해 새 시트(Cleaned)에 저장
 * 요구사항:
 * 1) 이름 공백 정리
 * 2) 연락처를 010-1234-5678 형식(가능한 경우)으로 통일
 * 3) Sheet2에서 이름으로 이메일 매칭
 * 4) 새 시트에 저장
 * 5) 이메일 못 찾은 사람 표시
 * 6) 처리 로그 출력
 */
function cleanSpreadsheetData() {
    const SHEET1_NAME = "Sheet1";
    const SHEET2_NAME = "Sheet2";
    const OUTPUT_SHEET_NAME = "Cleaned";

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet1 = ss.getSheetByName(SHEET1_NAME);
    const sheet2 = ss.getSheetByName(SHEET2_NAME);

    if (!sheet1 || !sheet2) {
        throw new Error(`시트를 찾을 수 없습니다. (Sheet1: ${!!sheet1}, Sheet2: ${!!sheet2})`);
    }

    const s1 = sheet1.getDataRange().getValues();
    const s2 = sheet2.getDataRange().getValues();

    if (s1.length < 2) {
        ss.toast("Sheet1에 처리할 데이터가 없습니다(헤더 제외).", "GAS", 5);
        return;
    }
    if (s2.length < 2) {
        ss.toast("Sheet2에 이메일 매칭용 데이터가 없습니다(헤더 제외).", "GAS", 5);
    }

    // --- 컬럼 인덱스 찾기(헤더 기반, 공백 무시) ---
    const h1 = s1[0];
    const h2 = s2[0];

    const idx1 = {
        name: findColumnIndex_(h1, "이름", 0),
        age: findColumnIndex_(h1, "나이", 1),
        track: findColumnIndex_(h1, "지원트랙", 2),
        motive: findColumnIndex_(h1, "지원동기", 3),
        phone: findColumnIndex_(h1, "연락처", 4),
    };

    const idx2 = {
        name: findColumnIndex_(h2, "이름", 0),
        email: findColumnIndex_(h2, "이메일", 1),
    };

    // --- Sheet2: 이름(정리) -> 이메일 맵 생성 ---
    const emailMap = {};
    const duplicateNames = [];
    for (let r = 1; r < s2.length; r++) {
        const rawName = s2[r][idx2.name];
        const name = normalizeName_(rawName);
        if (!name) continue;

        const email = String(s2[r][idx2.email] ?? "").trim();
        if (!email) continue;

        if (emailMap[name] && emailMap[name] !== email) {
            duplicateNames.push(name);
            continue; // 이미 들어있으면 첫 값 유지(원하면 여기서 덮어쓰기 로직으로 변경 가능)
        }
        emailMap[name] = email;
    }

    // --- Sheet1 처리 ---
    let processed = 0;
    let matched = 0;
    let missing = 0;

    const output = [];
    output.push(["이름(정리됨)", "나이", "지원트랙", "지원동기", "연락처(정리됨)", "이메일", "이메일매칭상태"]);

    for (let r = 1; r < s1.length; r++) {
        const row = s1[r];

        const cleanName = normalizeName_(row[idx1.name]);
        if (!cleanName) continue; // 이름이 없으면 스킵 (원하면 빈 줄도 포함하도록 변경 가능)

        const age = row[idx1.age];
        const track = row[idx1.track];
        const motive = row[idx1.motive];

        const phoneResult = normalizePhone_(row[idx1.phone]);
        const email = emailMap[cleanName] || "";
        const emailStatus = email ? "MATCHED" : "NOT_FOUND";

        processed++;
        if (email) matched++;
        else missing++;

        output.push([cleanName, age, track, motive, phoneResult, email, emailStatus]);
    }

    // --- 출력 시트 생성/초기화 후 저장 ---
    let outSheet = ss.getSheetByName(OUTPUT_SHEET_NAME);
    if (outSheet) {
        outSheet.clearContents();
    } else {
        outSheet = ss.insertSheet(OUTPUT_SHEET_NAME);
    }

    outSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
    outSheet.setFrozenRows(1);
    outSheet.getRange(1, 1, 1, output[0].length).setFontWeight("bold");
    // 연락처 컬럼은 텍스트로(앞자리 0 보존)
    outSheet.getRange(2, 5, Math.max(output.length - 1, 1), 1).setNumberFormat("@");
    outSheet.autoResizeColumns(1, output[0].length);

    // --- 로그 ---
    Logger.log("=== 정리 작업 결과 ===");
    Logger.log(`처리 인원: ${processed}명`);
    Logger.log(`이메일 매칭: ${matched}명`);
    Logger.log(`이메일 미매칭: ${missing}명`);
    if (duplicateNames.length > 0) {
        Logger.log(`Sheet2 중복 이름 감지(첫 값 유지): ${[...new Set(duplicateNames)].join(", ")}`);
    }

    ss.toast(`완료: ${processed}명 처리 (매칭 ${matched} / 미매칭 ${missing})`, "GAS", 6);
}

/** 헤더에서 target 컬럼 인덱스를 찾고, 없으면 fallbackIndex 사용 */
function findColumnIndex_(headers, target, fallbackIndex) {
    const norm = (v) => String(v ?? "").replace(/\s+/g, "").trim();
    const t = norm(target);
    for (let i = 0; i < headers.length; i++) {
        if (norm(headers[i]) === t) return i;
    }
    return fallbackIndex;
}

/** 이름 공백 제거(예: "이  준" -> "이준") */
function normalizeName_(name) {
    return String(name ?? "").replace(/\s+/g, "").trim();
}

/**
 * 연락처 정규화:
 * - 숫자만 추출
 * - +82 포함 시 010 형태로 변환(가능한 경우)
 * - 11자리면 000-0000-0000 형태로 하이픈 삽입
 * - 그 외는 원문(trim) 반환
 */
function normalizePhone_(phone) {
    const raw = String(phone ?? "").trim();
    if (!raw) return "";

    let digits = raw.replace(/\D/g, "");
    if (!digits) return raw;

    // +82 / 82 로 시작하는 케이스: 82 + 10xxxxxxxx -> 010xxxxxxxx 로
    if (digits.startsWith("82")) {
        digits = digits.slice(2); // remove country code
        if (digits.startsWith("10")) digits = "0" + digits;
    }

    // 10자리면서 10으로 시작하면(앞 0이 빠진 케이스) 0을 붙여 11자리로
    if (digits.length === 10 && digits.startsWith("10")) {
        digits = "0" + digits;
    }

    // 11자리면 3-4-4로 포맷
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    return raw; // 처리 불가한 길이는 원문 유지
}