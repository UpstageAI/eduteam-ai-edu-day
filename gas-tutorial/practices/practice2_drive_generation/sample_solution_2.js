/**
 * Cleaned 시트 기반으로:
 * 1) Drive에 "트랙별_지원자" 폴더 생성(또는 기존 사용)
 * 2) 지원트랙별 하위 폴더 생성(또는 기존 사용)
 * 3) 지원자마다 Google Docs 문서 생성 후 트랙 폴더로 이동
 * 4) 문서 내용에 이름/트랙/지원동기 작성
 * 5) 같은 이름 파일이 이미 있으면 스킵 + 로그
 * 6) 트랙별 생성 개수 요약 로그
 *
 * 실행: createApplicantDocsFromCleaned()
 */
function createApplicantDocsFromCleaned() {
    const CONFIG = {
        cleanedSheetName: "Cleaned",
        rootFolderName: "트랙별_지원자",
        outputDocExt: "", // Google Docs는 확장자 필요 없음
        dryRun: false,    // true면 실제 생성 없이 로그만
        unknownTrackName: "Unknown"
    };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.cleanedSheetName);
    if (!sheet) throw new Error(`시트를 찾을 수 없습니다: ${CONFIG.cleanedSheetName}`);

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
        ss.toast("Cleaned 시트에 데이터가 없습니다(헤더 제외).", "GAS", 5);
        return;
    }

    // 헤더 기반 컬럼 인덱스 찾기 (헤더 명이 조금 달라도 대응)
    const header = values[0];
    const idx = {
        name: findColumnIndex_(header, ["이름(정리됨)", "이름"], 0),
        track: findColumnIndex_(header, ["지원트랙", "트랙"], 2),
        motive: findColumnIndex_(header, ["지원동기"], 3),
    };

    const rootFolder = getOrCreateFolderInMyDrive_(CONFIG.rootFolderName);

    // trackName -> Folder 캐시
    const trackFolderCache = {};

    // 요약 집계
    const createdByTrack = {};
    const skippedByTrack = {};
    let totalTarget = 0;
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalNoNameSkipped = 0;

    for (let r = 1; r < values.length; r++) {
        const row = values[r];

        const name = normalizeName_(row[idx.name]);
        if (!name) {
            totalNoNameSkipped++;
            Logger.log(`[SKIP] 이름 없음 - row=${r + 1}`);
            continue;
        }

        const track = normalizeTrack_(row[idx.track]) || CONFIG.unknownTrackName;
        const motive = String(row[idx.motive] ?? "").trim();

        totalTarget++;

        // 트랙 폴더 준비
        const trackFolder =
            trackFolderCache[track] ||
            (trackFolderCache[track] = getOrCreateSubfolder_(rootFolder, track));

        // 파일명: "이름" (Google Docs)
        const docName = sanitizeFileName_(name);

        // 같은 이름 파일(문서)이 이미 있으면 스킵
        if (fileExistsInFolder_(trackFolder, docName)) {
            totalSkipped++;
            skippedByTrack[track] = (skippedByTrack[track] || 0) + 1;
            Logger.log(`[SKIP] 이미 존재: ${track}/${docName}`);
            continue;
        }

        if (CONFIG.dryRun) {
            totalCreated++;
            createdByTrack[track] = (createdByTrack[track] || 0) + 1;
            Logger.log(`[DRYRUN] 생성 예정: ${track}/${docName}`);
            continue;
        }

        // Google Docs 생성 (기본은 내 드라이브 루트에 생김 -> 트랙 폴더로 이동)
        const doc = DocumentApp.create(docName);
        const body = doc.getBody();

        body.appendParagraph(`이름: ${name}`);
        body.appendParagraph(`지원트랙: ${track}`);
        body.appendParagraph("");
        body.appendParagraph("지원동기:");
        body.appendParagraph(motive || "(없음)");

        doc.saveAndClose();

        // 생성된 문서를 트랙 폴더로 이동
        const file = DriveApp.getFileById(doc.getId());
        moveFileToFolder_(file, trackFolder);

        totalCreated++;
        createdByTrack[track] = (createdByTrack[track] || 0) + 1;

        Logger.log(`[OK] 생성 완료: ${track}/${docName}`);
    }

    // 요약 로그
    Logger.log("=== 생성 요약 ===");
    Logger.log(`처리 대상(이름 있는 행): ${totalTarget}명`);
    Logger.log(`생성: ${totalCreated}개`);
    Logger.log(`건너뜀(동일 이름 파일 존재): ${totalSkipped}개`);
    Logger.log(`건너뜀(이름 없음): ${totalNoNameSkipped}개`);
    Logger.log("--- 트랙별 생성/스킵 ---");

    const allTracks = Object.keys({ ...createdByTrack, ...skippedByTrack }).sort();
    allTracks.forEach(t => {
        const c = createdByTrack[t] || 0;
        const s = skippedByTrack[t] || 0;
        Logger.log(`${t}: 생성 ${c} / 스킵 ${s}`);
    });

    ss.toast(`완료: 생성 ${totalCreated}, 스킵 ${totalSkipped} (로그 확인)`, "GAS", 6);
}

/* ---------------- Helpers ---------------- */

function normalizeName_(name) {
    // "이  준" -> "이준"
    return String(name ?? "").replace(/\s+/g, "").trim();
}

function normalizeTrack_(track) {
    return String(track ?? "").trim();
}

function sanitizeFileName_(name) {
    // Windows 금지 문자 제거: \ / : * ? " < > |
    return String(name).replace(/[\\\/:\*\?"<>\|]/g, "_").trim();
}

/**
 * headers: 1행(헤더)
 * candidates: 찾고 싶은 헤더명 후보들
 * fallbackIndex: 못 찾으면 이 인덱스를 사용
 */
function findColumnIndex_(headers, candidates, fallbackIndex) {
    const norm = v => String(v ?? "").replace(/\s+/g, "").trim();
    const headerNorm = headers.map(norm);

    for (const c of candidates) {
        const target = norm(c);
        const idx = headerNorm.indexOf(target);
        if (idx !== -1) return idx;
    }
    return fallbackIndex;
}

function getOrCreateFolderInMyDrive_(folderName) {
    // 같은 이름 폴더가 여러 개면 첫 번째 사용
    const it = DriveApp.getFoldersByName(folderName);
    if (it.hasNext()) return it.next();
    return DriveApp.createFolder(folderName);
}

function getOrCreateSubfolder_(parentFolder, subfolderName) {
    const it = parentFolder.getFoldersByName(subfolderName);
    if (it.hasNext()) return it.next();
    return parentFolder.createFolder(subfolderName);
}

/**
 * 같은 이름의 파일이 폴더에 존재하는지 확인
 * - Google Docs도 "파일 이름"으로 검색 가능
 */
function fileExistsInFolder_(folder, fileName) {
    const it = folder.getFilesByName(fileName);
    return it.hasNext();
}

/**
 * 파일을 특정 폴더로 "이동" (폴더 add 후 다른 부모에서 remove)
 */
function moveFileToFolder_(file, targetFolder) {
    targetFolder.addFile(file);

    // 다른 부모 폴더들에서 제거(대개 "내 드라이브" 루트)
    const parents = file.getParents();
    while (parents.hasNext()) {
        const p = parents.next();
        if (p.getId() !== targetFolder.getId()) {
            p.removeFile(file);
        }
    }
}