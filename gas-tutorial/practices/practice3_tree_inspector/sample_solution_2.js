/**
 * Drive 폴더 트리를 시트에 트리 형태로 덤프
 * - 루트 폴더명으로 검색: "GAS_Tutorial_Workspace"
 * - 하위 폴더/파일 전체 탐색(재귀)
 * - 들여쓰기로 깊이 표현
 * - 폴더/파일 타입 표시
 * - 전체 경로 표시
 * - 마지막에 요약(폴더/파일 개수)
 *
 * 실행: dumpDriveTreeToSheet()
 *
 * 주의:
 * - 폴더/파일이 많으면 실행 시간이 길어질 수 있음(Apps Script 실행 제한).
 * - 동일 이름의 폴더가 여러 개면 "첫 번째" 폴더를 사용합니다.
 */
function dumpDriveTreeToSheet() {
    var ROOT_FOLDER_NAME = "GAS_Tutorial_Workspace";
    var OUTPUT_SHEET_NAME = "Drive_Tree";
    var INDENT_UNIT = "  "; // 들여쓰기 단위(스페이스 2칸)

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var out = ss.getSheetByName(OUTPUT_SHEET_NAME);
    if (!out) out = ss.insertSheet(OUTPUT_SHEET_NAME);
    out.clearContents();

    // 1) 폴더 이름으로 루트 폴더 찾기
    var rootIt = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    if (!rootIt.hasNext()) {
        out.getRange(1, 1).setValue('루트 폴더를 찾을 수 없습니다: "' + ROOT_FOLDER_NAME + '"');
        return;
    }
    var rootFolder = rootIt.next(); // 동일 이름 여러개면 첫 번째

    // 헤더
    var rows = [];
    rows.push(["트리(들여쓰기)", "타입", "이름", "전체 경로", "ID"]);
    rows.push(["[ROOT]", "FOLDER", rootFolder.getName(), "/" + rootFolder.getName(), rootFolder.getId()]);

    var stats = {
        folderCount: 1, // root 포함
        fileCount: 0
    };

    // 2) 하위 폴더/파일 전체 탐색
    traverseFolder_(rootFolder, 1, "/" + rootFolder.getName(), INDENT_UNIT, rows, stats);

    // 시트에 쓰기
    out.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    out.setFrozenRows(1);
    out.getRange(1, 1, 1, rows[0].length).setFontWeight("bold");
    out.autoResizeColumns(1, rows[0].length);

    // 6) 마지막 요약
    var summaryStart = rows.length + 2;
    out.getRange(summaryStart, 1).setValue("요약");
    out.getRange(summaryStart, 1).setFontWeight("bold");
    out.getRange(summaryStart + 1, 1).setValue("폴더 수(루트 포함)");
    out.getRange(summaryStart + 1, 2).setValue(stats.folderCount);
    out.getRange(summaryStart + 2, 1).setValue("파일 수");
    out.getRange(summaryStart + 2, 2).setValue(stats.fileCount);

    Logger.log("=== Drive Tree Dump 완료 ===");
    Logger.log("Root: " + ROOT_FOLDER_NAME);
    Logger.log("Folders: " + stats.folderCount);
    Logger.log("Files: " + stats.fileCount);

    ss.toast("완료: 폴더 " + stats.folderCount + "개, 파일 " + stats.fileCount + "개", "GAS", 6);
}

/**
 * 폴더 재귀 탐색
 * @param {Folder} folder
 * @param {number} depth
 * @param {string} parentPath
 * @param {string} indentUnit
 * @param {Array} rows
 * @param {Object} stats
 */
function traverseFolder_(folder, depth, parentPath, indentUnit, rows, stats) {
    // 하위 폴더 먼저
    var subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
        var sub = subFolders.next();
        var name = sub.getName();
        var path = parentPath + "/" + name;
        var indent = repeat_(indentUnit, depth);

        rows.push([indent + "📁 " + name, "FOLDER", name, path, sub.getId()]);
        stats.folderCount++;

        traverseFolder_(sub, depth + 1, path, indentUnit, rows, stats);
    }

    // 하위 파일
    var files = folder.getFiles();
    while (files.hasNext()) {
        var f = files.next();
        var fname = f.getName();
        var fpath = parentPath + "/" + fname;
        var findent = repeat_(indentUnit, depth);

        rows.push([findent + "📄 " + fname, "FILE", fname, fpath, f.getId()]);
        stats.fileCount++;
    }
}

/** 문자열 반복 */
function repeat_(str, times) {
    var out = "";
    for (var i = 0; i < times; i++) out += str;
    return out;
}