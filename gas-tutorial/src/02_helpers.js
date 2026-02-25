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
