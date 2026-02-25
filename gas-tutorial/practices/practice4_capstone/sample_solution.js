/**
 * 02_helpers.js
 * Shared utility functions for the GAS Tutorial project.
 *
 * Dependencies: none (this file has no external dependencies)
 * Used by: 01_setup.js, 03_solution.js, 04_verify.js
 */

var ROOT_FOLDER_NAME = 'GAS_Tutorial_Workspace';
var PROJECT_NAMES = ['Hackathon', 'SeSAC', 'SSAFY', 'KDT', 'BootCamp'];
var YEARS = ['2024', '2025'];
var STATUSES = ['Draft', 'Final', 'Review', 'Archive'];

// =============================================================================
// Folder helpers
// =============================================================================

/**
 * Finds the workspace root folder by name.
 * @return {Folder|null} The root folder, or null if not found.
 */
function findWorkspaceRoot_() {
  var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return null;
}

/**
 * Gets or creates a child folder by name inside parent. Idempotent.
 * If multiple children with the same name exist, returns the first one.
 * @param {Folder} parent
 * @param {string} name
 * @return {Folder}
 */
function getOrCreateFolder_(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parent.createFolder(name);
}

/**
 * Creates a nested folder path from root. Idempotent.
 * e.g., ensureFolderPath_(root, "Projects/Hackathon") creates both
 * "Projects" under root and "Hackathon" under "Projects".
 * @param {Folder} root
 * @param {string} path Slash-delimited path (e.g. "Projects/Hackathon")
 * @return {Folder} The deepest folder in the path
 */
function ensureFolderPath_(root, path) {
  var parts = path.split('/');
  var current = root;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i].trim();
    if (part === '') continue;
    current = getOrCreateFolder_(current, part);
  }
  return current;
}

// =============================================================================
// File helpers
// =============================================================================

/**
 * Recursively collects all files under a folder, including subfolders.
 * @param {Folder} folder The folder to search.
 * @param {string} currentPath The slash-delimited path accumulated so far.
 * @return {Array<{file: File, path: string, folder: Folder}>}
 */
function getAllFilesRecursive_(folder, currentPath) {
  var results = [];
  var prefix = currentPath ? currentPath + '/' : '';

  // Collect files in this folder
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    results.push({
      file: file,
      path: prefix + file.getName(),
      folder: folder
    });
  }

  // Recurse into subfolders
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var sub = subfolders.next();
    var subPath = prefix + sub.getName();
    var subResults = getAllFilesRecursive_(sub, subPath);
    for (var i = 0; i < subResults.length; i++) {
      results.push(subResults[i]);
    }
  }

  return results;
}

// =============================================================================
// File name parser
// =============================================================================

/**
 * Parses a file name to extract bracket tags and classify the file.
 *
 * Rules:
 *   - Strips a leading "Copy of " prefix before parsing.
 *   - Finds all [Tag] patterns with regex /\[([^\]]+)\]/g.
 *   - Classifies each tag as: project, year, status, or "Ext".
 *   - Project matching is case-insensitive.
 *   - baseName is the name with all [Tag] tokens removed, trimmed.
 *
 * Malformed conditions (sets isMalformed = true):
 *   - More than one recognised project tag found.
 *   - More than one recognised year tag found.
 *   - More than one recognised status tag found.
 *   - Conflicting [Ext] with a status tag (e.g. [Review][Ext]).
 *   - No recognised project tag at all.
 *
 * @param {string} name The file name (extension included or not).
 * @return {{
 *   project: string|null,
 *   year: string|null,
 *   status: string|null,
 *   isExternal: boolean,
 *   baseName: string,
 *   allTags: string[],
 *   isMalformed: boolean,
 *   malformedReason: string|null
 * }}
 */
function parseFileName_(name) {
  // Strip "Copy of " prefix (case-sensitive as Drive produces it)
  var cleaned = name.replace(/^Copy of /, '');

  // Extract all [Tag] tokens
  var tagPattern = /\[([^\]]+)\]/g;
  var allTags = [];
  var match;
  while ((match = tagPattern.exec(cleaned)) !== null) {
    allTags.push(match[1]);
  }

  // baseName: remove all [Tag] tokens and trim
  var baseName = cleaned.replace(/\[[^\]]*\]/g, '').trim();

  // Classify tags
  var projects = [];
  var years = [];
  var statuses = [];
  var isExternal = false;

  for (var i = 0; i < allTags.length; i++) {
    var tag = allTags[i];
    var tagLower = tag.toLowerCase();

    // Check "Ext" (external)
    if (tagLower === 'ext') {
      isExternal = true;
      continue;
    }

    // Check project (case-insensitive)
    var matchedProject = null;
    for (var p = 0; p < PROJECT_NAMES.length; p++) {
      if (PROJECT_NAMES[p].toLowerCase() === tagLower) {
        matchedProject = PROJECT_NAMES[p]; // use canonical casing
        break;
      }
    }
    if (matchedProject) {
      projects.push(matchedProject);
      continue;
    }

    // Check year (exact match)
    var isYear = false;
    for (var y = 0; y < YEARS.length; y++) {
      if (YEARS[y] === tag) {
        isYear = true;
        break;
      }
    }
    if (isYear) {
      years.push(tag);
      continue;
    }

    // Check status (case-insensitive)
    var matchedStatus = null;
    for (var s = 0; s < STATUSES.length; s++) {
      if (STATUSES[s].toLowerCase() === tagLower) {
        matchedStatus = STATUSES[s];
        break;
      }
    }
    if (matchedStatus) {
      statuses.push(matchedStatus);
      continue;
    }

    // Unrecognised tag — ignored but preserved in allTags
  }

  // Detect malformed conditions
  var isMalformed = false;
  var malformedReason = null;

  // "Copy of " prefix indicates a Drive-generated copy — treat as malformed
  var hasCopyOfPrefix = /^Copy of /i.test(name);
  if (hasCopyOfPrefix) {
    isMalformed = true;
    malformedReason = '"Copy of" prefix detected';
  } else if (projects.length > 1) {
    isMalformed = true;
    malformedReason = 'Multiple project tags: [' + projects.join('], [') + ']';
  } else if (years.length > 1) {
    isMalformed = true;
    malformedReason = 'Multiple year tags: [' + years.join('], [') + ']';
  } else if (statuses.length > 1) {
    isMalformed = true;
    malformedReason = 'Conflicting status tags: [' + statuses.join('], [') + ']';
  } else if (isExternal && statuses.length > 0) {
    isMalformed = true;
    malformedReason = 'Conflicting [Ext] with status tag [' + statuses[0] + ']';
  } else if (projects.length === 0 && !isExternal) {
    isMalformed = true;
    malformedReason = 'No recognised project tag found';
  }

  return {
    project: projects.length === 1 ? projects[0] : null,
    year: years.length === 1 ? years[0] : null,
    status: statuses.length === 1 ? statuses[0] : null,
    isExternal: isExternal,
    baseName: baseName,
    allTags: allTags,
    isMalformed: isMalformed,
    malformedReason: malformedReason
  };
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Logs an action with a timestamp prefix.
 * @param {string} action Short verb describing the action (e.g. "MOVED").
 * @param {string} details Freeform detail string.
 */
function logAction_(action, details) {
  var ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  Logger.log('[' + ts + '] ' + action + ': ' + details);
}

// =============================================================================
// Reset (instructor utility — also exposed from 05_reset.js)
// =============================================================================

/**
 * Trashes the workspace folder for a clean retry.
 * Idempotent: safe to run if workspace does not exist.
 * Files can be recovered from Drive trash within 30 days.
 */
function reset() {
  var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var count = 0;
  while (folders.hasNext()) {
    folders.next().setTrashed(true);
    count++;
  }
  if (count > 0) {
    Logger.log('Trashed ' + count + ' workspace folder(s) named "' + ROOT_FOLDER_NAME + '".');
    Logger.log('Run setup() to create a fresh workspace.');
  } else {
    Logger.log('No workspace found. Nothing to reset.');
  }
}
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
