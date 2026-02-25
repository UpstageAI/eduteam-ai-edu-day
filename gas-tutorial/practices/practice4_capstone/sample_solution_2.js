function organizeGasTutorialWorkspace() {
    var CONFIG = {
        rootFolderName: "GAS_Tutorial_Workspace",
        managedFolders: {
            projects: "Projects",
            external: "External",
            duplicates: "Duplicates",
            unsorted: "Unsorted"
        },
        projectTags: ["Hackathon", "SeSAC", "SSAFY", "KDT", "BootCamp"],
        extTag: "Ext",
        copyPrefix: "Copy of",
        dryRun: false,
        // 안정화 옵션
        throttleEvery: 15,     // N개 처리마다 잠깐 쉬기
        throttleMs: 250,       // 쉬는 시간
        moveRetry: 5,          // Drive 오류 재시도 횟수
        moveBaseSleepMs: 300   // 재시도 기본 sleep
    };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast("Drive 정리 시작… (로그 확인)", "GAS", 5);

    // 1) 루트 폴더 찾기
    var rootIt = DriveApp.getFoldersByName(CONFIG.rootFolderName);
    if (!rootIt.hasNext()) throw new Error('루트 폴더를 찾을 수 없습니다: "' + CONFIG.rootFolderName + '"');
    var root = rootIt.next();

    // 2) 관리 폴더 준비
    var folderProjects = getOrCreateSubfolder_(root, CONFIG.managedFolders.projects);
    var folderExternal = getOrCreateSubfolder_(root, CONFIG.managedFolders.external);
    var folderDuplicates = getOrCreateSubfolder_(root, CONFIG.managedFolders.duplicates);
    var folderUnsorted = getOrCreateSubfolder_(root, CONFIG.managedFolders.unsorted);

    var managedIds = {};
    managedIds[folderProjects.getId()] = true;
    managedIds[folderExternal.getId()] = true;
    managedIds[folderDuplicates.getId()] = true;
    managedIds[folderUnsorted.getId()] = true;

    // 캐시 (DriveApp.getFolderById / getFileById 반복 호출 줄이기)
    var folderCacheById = {};
    folderCacheById[root.getId()] = root;
    folderCacheById[folderProjects.getId()] = folderProjects;
    folderCacheById[folderExternal.getId()] = folderExternal;
    folderCacheById[folderDuplicates.getId()] = folderDuplicates;
    folderCacheById[folderUnsorted.getId()] = folderUnsorted;

    var projectFolderCache = {}; // 프로젝트명 -> folder

    // 3) 전체 파일 수집(관리 폴더 제외)
    var files = [];
    var statsScan = { folderCount: 0, fileCount: 0 };
    collectFilesRecursively_(root, "/" + root.getName(), managedIds, files, statsScan);

    Logger.log("=== 스캔 결과 ===");
    Logger.log("폴더(관리폴더 제외) 탐색 수: " + statsScan.folderCount);
    Logger.log("파일 탐색 수: " + files.length);

    // 4) 중복 판별(같은 이름 + 같은 타입)
    var firstByKey = {};
    var isDuplicate = {};
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var key = makeDupKey_(f.name, f.mimeType);
        if (!firstByKey[key]) firstByKey[key] = f.id;
        else isDuplicate[f.id] = true;
    }

    // 5) 이동
    var summary = {
        moved: {
            Projects: 0,
            External: 0,
            Duplicates: 0,
            Unsorted: 0,
            ProjectBreakdown: {}
        },
        skipped: {
            alreadyInPlace: 0,
            noWorkspaceParent: 0,
            moveFailed: 0
        }
    };

    for (var j = 0; j < files.length; j++) {
        if (CONFIG.throttleEvery > 0 && j > 0 && (j % CONFIG.throttleEvery === 0)) {
            Utilities.sleep(CONFIG.throttleMs);
        }

        var item = files[j];
        if (!item.workspaceParentId) {
            summary.skipped.noWorkspaceParent++;
            Logger.log("[SKIP] 워크스페이스 부모 없음: " + item.name + " (" + item.id + ")");
            continue;
        }

        var srcParent = folderCacheById[item.workspaceParentId] || (folderCacheById[item.workspaceParentId] = DriveApp.getFolderById(item.workspaceParentId));

        // 대상 폴더 결정
        var targetFolder = null;
        var targetLabel = "";
        var projectName = "";

        if (isDuplicate[item.id]) {
            targetFolder = folderDuplicates;
            targetLabel = "Duplicates";
        } else if (startsWithIgnoreCase_(item.name, CONFIG.copyPrefix)) {
            targetFolder = folderUnsorted;
            targetLabel = "Unsorted";
        } else {
            var tags = parseTags_(item.name);

            if (hasTag_(tags, CONFIG.extTag)) {
                targetFolder = folderExternal;
                targetLabel = "External";
            } else {
                projectName = findFirstProjectTag_(tags, CONFIG.projectTags);
                if (projectName) {
                    var pFolder = projectFolderCache[projectName];
                    if (!pFolder) {
                        pFolder = getOrCreateSubfolder_(folderProjects, projectName);
                        projectFolderCache[projectName] = pFolder;
                    }
                    targetFolder = pFolder;
                    targetLabel = "Projects";
                } else {
                    targetFolder = folderUnsorted;
                    targetLabel = "Unsorted";
                }
            }
        }

        // 멱등성: 이미 목적지면 스킵
        if (item.workspaceParentId === targetFolder.getId()) {
            summary.skipped.alreadyInPlace++;
            Logger.log("[SKIP] 이미 정리됨: " + targetLabel + " / " + item.name);
            continue;
        }

        if (CONFIG.dryRun) {
            Logger.log("[DRYRUN] " + item.name + " -> " + targetLabel + (projectName ? ("/" + projectName) : ""));
            continue;
        }

        // 파일 객체 가져오기(실패 가능하니 재시도 감싸기)
        var fileObj = null;
        try {
            fileObj = withRetry_(function () {
                return DriveApp.getFileById(item.id);
            }, CONFIG.moveRetry, CONFIG.moveBaseSleepMs);
        } catch (e0) {
            summary.skipped.moveFailed++;
            Logger.log("[FAIL] getFileById 실패: " + item.name + " (" + item.id + ") / " + e0);
            continue;
        }

        // 이동(Drive 오류 재시도 + remove 실패는 경고만)
        try {
            withRetry_(function () {
                moveFileBetweenFoldersSafe_(fileObj, srcParent, targetFolder);
                return true;
            }, CONFIG.moveRetry, CONFIG.moveBaseSleepMs);
        } catch (e1) {
            summary.skipped.moveFailed++;
            Logger.log("[FAIL] 이동 실패: " + item.name + " -> " + targetLabel + " / " + e1);
            continue;
        }

        if (targetLabel === "External") summary.moved.External++;
        else if (targetLabel === "Duplicates") summary.moved.Duplicates++;
        else if (targetLabel === "Unsorted") summary.moved.Unsorted++;
        else if (targetLabel === "Projects") {
            summary.moved.Projects++;
            if (projectName) summary.moved.ProjectBreakdown[projectName] = (summary.moved.ProjectBreakdown[projectName] || 0) + 1;
        }

        Logger.log("[MOVE] " + item.name + " -> " + targetLabel + (projectName ? ("/" + projectName) : ""));
    }

    // 요약 로그
    Logger.log("=== 정리 요약 ===");
    Logger.log("Moved -> Projects: " + summary.moved.Projects);
    Logger.log("Moved -> External: " + summary.moved.External);
    Logger.log("Moved -> Duplicates: " + summary.moved.Duplicates);
    Logger.log("Moved -> Unsorted: " + summary.moved.Unsorted);
    Logger.log("Skipped -> alreadyInPlace: " + summary.skipped.alreadyInPlace);
    Logger.log("Skipped -> noWorkspaceParent: " + summary.skipped.noWorkspaceParent);
    Logger.log("Skipped -> moveFailed: " + summary.skipped.moveFailed);

    var projects = Object.keys(summary.moved.ProjectBreakdown).sort();
    if (projects.length > 0) {
        Logger.log("--- Projects 세부 ---");
        for (var k = 0; k < projects.length; k++) {
            var pn = projects[k];
            Logger.log(pn + ": " + summary.moved.ProjectBreakdown[pn]);
        }
    }

    ss.toast(
        (CONFIG.dryRun ? "[DRYRUN] " : "") +
        "완료: Projects " + summary.moved.Projects +
        ", External " + summary.moved.External +
        ", Duplicates " + summary.moved.Duplicates +
        ", Unsorted " + summary.moved.Unsorted +
        ", 실패 " + summary.skipped.moveFailed,
        "GAS",
        8
    );
}

/* ----------------- 안전 이동/재시도 유틸 ----------------- */

function moveFileBetweenFoldersSafe_(file, srcParent, targetFolder) {
    // addFile이 먼저 (removeFile 실패해도 최소한 목적지에 들어가도록)
    targetFolder.addFile(file);

    // srcParent에서 제거 시도(실패하면 경고만)
    try {
        if (srcParent.getId() !== targetFolder.getId()) srcParent.removeFile(file);
    } catch (e) {
        Logger.log("[WARN] removeFile 실패(무시): " + file.getName() + " / " + e);
    }
}

function withRetry_(fn, maxTry, baseSleepMs) {
    var lastErr = null;
    for (var t = 1; t <= maxTry; t++) {
        try {
            return fn();
        } catch (e) {
            lastErr = e;
            // Drive 서비스 오류는 짧은 sleep 후 재시도하면 통과하는 경우가 많음
            var wait = baseSleepMs * t; // 선형 백오프(원하면 지수로 바꿔도 됨)
            Utilities.sleep(wait);
        }
    }
    throw lastErr;
}

/* ----------------- 기존 헬퍼들(그대로) ----------------- */

function collectFilesRecursively_(folder, currentPath, excludedFolderIds, outFiles, statsScan) {
    var subIt = folder.getFolders();
    while (subIt.hasNext()) {
        var sub = subIt.next();
        var subId = sub.getId();
        if (excludedFolderIds[subId]) continue;

        statsScan.folderCount++;
        collectFilesRecursively_(sub, currentPath + "/" + sub.getName(), excludedFolderIds, outFiles, statsScan);
    }

    var fileIt = folder.getFiles();
    while (fileIt.hasNext()) {
        var f = fileIt.next();
        statsScan.fileCount++;

        outFiles.push({
            id: f.getId(),
            name: f.getName(),
            mimeType: f.getMimeType(),
            path: currentPath + "/" + f.getName(),
            workspaceParentId: folder.getId()
        });
    }
}

function getOrCreateSubfolder_(parentFolder, name) {
    var it = parentFolder.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parentFolder.createFolder(name);
}

function parseTags_(fileName) {
    var tags = [];
    var re = /\[([^\]]+)\]/g;
    var m;
    while ((m = re.exec(fileName)) !== null) {
        tags.push(String(m[1] || "").trim());
    }
    return tags;
}

function hasTag_(tags, tagName) {
    var t = String(tagName || "").toLowerCase();
    for (var i = 0; i < tags.length; i++) {
        if (String(tags[i]).toLowerCase() === t) return true;
    }
    return false;
}

function findFirstProjectTag_(tags, projectTags) {
    var map = {};
    for (var i = 0; i < projectTags.length; i++) {
        map[String(projectTags[i]).toLowerCase()] = projectTags[i];
    }
    for (var j = 0; j < tags.length; j++) {
        var key = String(tags[j]).toLowerCase();
        if (map[key]) return map[key];
    }
    return "";
}

function startsWithIgnoreCase_(text, prefix) {
    var a = String(text || "").toLowerCase();
    var b = String(prefix || "").toLowerCase();
    return a.indexOf(b) === 0;
}

function makeDupKey_(name, mimeType) {
    return String(name || "").trim().toLowerCase() + "||" + String(mimeType || "").trim().toLowerCase();
}