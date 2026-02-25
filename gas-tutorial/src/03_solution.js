/**
 * 03_solution.js
 * Reference solution — organizes the chaotic workspace into a clean structure.
 *
 * Dependencies:
 *   - Helpers from src/02_helpers.js (same GAS project)
 *
 * Target structure:
 *   GAS_Tutorial_Workspace/
 *   ├── Projects/
 *   │   ├── Hackathon/  (10 files)
 *   │   ├── SeSAC/      (8 files)
 *   │   ├── SSAFY/      (9 files)
 *   │   ├── KDT/        (8 files)
 *   │   └── BootCamp/   (6 files)
 *   ├── External/       (8 files)
 *   ├── Duplicates/     (6 files)
 *   └── Unsorted/       (17 files)
 */

/**
 * Main entry point. Runs all five phases in sequence and prints a final report.
 * Safe to run multiple times — already-moved files are skipped (idempotent).
 */
function solution() {
  var startTime = new Date();
  Logger.log('=== Organizing Workspace ===');
  Logger.log('Start time: ' + startTime.toLocaleTimeString());

  // -------------------------------------------------------------------------
  // Phase 1: DISCOVER
  // -------------------------------------------------------------------------
  var root = findWorkspaceRoot_();
  if (!root) {
    Logger.log('ERROR: Workspace root "' + ROOT_FOLDER_NAME + '" not found. Run setup() first.');
    return;
  }

  var allFiles = getAllFilesRecursive_(root, '');
  Logger.log('Found ' + allFiles.length + ' files across all folders.');

  // -------------------------------------------------------------------------
  // Phase 2: PARSE
  // -------------------------------------------------------------------------
  var parsed = [];
  for (var i = 0; i < allFiles.length; i++) {
    var entry = allFiles[i];
    var info = parseFileName_(entry.file.getName());
    parsed.push({
      file: entry.file,
      parsedInfo: info,
      currentPath: entry.path,
      currentFolder: entry.folder
    });
  }

  // -------------------------------------------------------------------------
  // Phase 3: PLAN
  // -------------------------------------------------------------------------

  // Create the target folder tree.
  var projectsFolder = getOrCreateFolder_(root, 'Projects');
  var targetFolders = {
    Hackathon: getOrCreateFolder_(projectsFolder, 'Hackathon'),
    SeSAC:     getOrCreateFolder_(projectsFolder, 'SeSAC'),
    SSAFY:     getOrCreateFolder_(projectsFolder, 'SSAFY'),
    KDT:       getOrCreateFolder_(projectsFolder, 'KDT'),
    BootCamp:  getOrCreateFolder_(projectsFolder, 'BootCamp'),
    External:   getOrCreateFolder_(root, 'External'),
    Duplicates: getOrCreateFolder_(root, 'Duplicates'),
    Unsorted:   getOrCreateFolder_(root, 'Unsorted')
  };

  // Duplicate detection: key = baseName + "|" + mimeType
  // Process order matters — first occurrence wins, subsequent become Duplicates.
  var seen = {};
  var movePlan = [];

  for (var j = 0; j < parsed.length; j++) {
    var item = parsed[j];
    var info = item.parsedInfo;
    var file = item.file;
    var targetFolder;
    var action;
    var reason;

    if (info.isMalformed) {
      // Malformed name — cannot reliably classify.
      targetFolder = targetFolders.Unsorted;
      action = 'unsorted';
      reason = 'Malformed: ' + info.malformedReason;

    } else if (info.isExternal) {
      // [Ext] tag takes priority over project tag.
      targetFolder = targetFolders.External;
      action = 'external';
      reason = 'Has [Ext] tag';

    } else if (info.project) {
      // Valid project tag — check for duplicates before routing.
      var dupKey = info.baseName + '|' + file.getMimeType();
      if (seen[dupKey]) {
        targetFolder = targetFolders.Duplicates;
        action = 'duplicate';
        reason = 'Duplicate of already-processed file with same name and type';
      } else {
        seen[dupKey] = true;
        targetFolder = targetFolders[info.project];
        if (!targetFolder) {
          // Project name unrecognised — treat as unsorted.
          targetFolder = targetFolders.Unsorted;
          action = 'unsorted';
          reason = 'Unrecognised project: ' + info.project;
        } else {
          action = 'project';
          reason = 'Project: ' + info.project;
        }
      }

    } else {
      // No project, not external, not malformed — truly unclassified.
      targetFolder = targetFolders.Unsorted;
      action = 'unsorted';
      reason = 'No recognised project tag';
    }

    movePlan.push({
      file: file,
      from: item.currentPath,
      to: targetFolder,
      toName: targetFolder.getName(),
      action: action,
      reason: reason
    });
  }

  // -------------------------------------------------------------------------
  // Phase 4: EXECUTE
  // -------------------------------------------------------------------------
  var moved = 0;
  var skipped = 0;
  var errors = 0;
  var errorLog = [];

  Logger.log('Executing ' + movePlan.length + ' planned moves...');

  for (var k = 0; k < movePlan.length; k++) {
    var plan = movePlan[k];

    try {
      // Idempotency: skip if the file is already in the target folder.
      var currentParents = plan.file.getParents();
      var alreadyThere = false;
      while (currentParents.hasNext()) {
        if (currentParents.next().getId() === plan.to.getId()) {
          alreadyThere = true;
          break;
        }
      }

      if (alreadyThere) {
        skipped++;
      } else {
        plan.file.moveTo(plan.to);
        logAction_('Moved', plan.file.getName() + ' → ' + plan.toName + ' (' + plan.reason + ')');
        moved++;
      }
    } catch (e) {
      var errMsg = 'ERROR moving "' + plan.file.getName() + '": ' + e.message;
      Logger.log(errMsg);
      errorLog.push(errMsg);
      errors++;
    }

    // Progress every 10 files.
    if ((k + 1) % 10 === 0 || k === movePlan.length - 1) {
      var elapsed = Math.round((new Date() - startTime) / 1000);
      Logger.log('Progress: ' + (k + 1) + '/' + movePlan.length + ' (' + elapsed + 's elapsed)');
    }
  }

  // -------------------------------------------------------------------------
  // Phase 5: REPORT
  // -------------------------------------------------------------------------
  var totalTime = Math.round((new Date() - startTime) / 1000);

  // Count files per destination.
  var counts = { project: {}, external: 0, duplicate: 0, unsorted: 0 };
  for (var m = 0; m < movePlan.length; m++) {
    var p = movePlan[m];
    if (p.action === 'project') {
      counts.project[p.toName] = (counts.project[p.toName] || 0) + 1;
    } else if (p.action === 'external') {
      counts.external++;
    } else if (p.action === 'duplicate') {
      counts.duplicate++;
    } else {
      counts.unsorted++;
    }
  }

  Logger.log('');
  Logger.log('=== Organization Complete ===');
  Logger.log('Files moved:   ' + moved);
  Logger.log('Files skipped (already in place): ' + skipped);
  if (errors > 0) {
    Logger.log('Errors:        ' + errors);
    for (var e = 0; e < errorLog.length; e++) {
      Logger.log('  ' + errorLog[e]);
    }
  }
  Logger.log('');
  Logger.log('--- Breakdown ---');
  Logger.log('Projects/');
  var projectNames = PROJECT_NAMES;
  for (var n = 0; n < projectNames.length; n++) {
    var pName = projectNames[n];
    Logger.log('  ' + pName + ': ' + (counts.project[pName] || 0) + ' files');
  }
  Logger.log('External/:   ' + counts.external + ' files');
  Logger.log('Duplicates/: ' + counts.duplicate + ' files');
  Logger.log('Unsorted/:   ' + counts.unsorted + ' files');
  Logger.log('');
  Logger.log('Total time: ' + totalTime + 's');
  Logger.log('Workspace:  ' + root.getUrl());
}
