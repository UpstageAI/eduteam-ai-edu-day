/**
 * 04_verify.js
 * Verifies that the workspace has been organised correctly by the solution script.
 * Read-only: this file does NOT move or modify any files.
 *
 * Dependencies:
 *   - Helpers from src/02_helpers.js (same GAS project)
 *
 * Run verify() after running solution() to see your score.
 */

/**
 * Expected file counts per destination folder.
 * Keys are paths relative to GAS_Tutorial_Workspace root.
 * Total: 72 files.
 */
var EXPECTED_COUNTS = {
  'Projects/Hackathon': 10,
  'Projects/SeSAC':      8,
  'Projects/SSAFY':      9,
  'Projects/KDT':        8,
  'Projects/BootCamp':   6,
  'External':            8,
  'Duplicates':          6,
  'Unsorted':           17
};

// Messy source folders that should be empty after a correct solution run.
var MESSY_FOLDERS = [
  '프로젝트',
  '프로젝트/Hackathon_stuff',
  '프로젝트/Hackathon_stuff/old',
  '프로젝트/Hackathon_stuff/old/really_old',
  '프로젝트/sesac',
  '프로젝트/SSAFY_2024_backup',
  'Shared',
  'Shared/Miscellaneous',
  'Shared/Downloads',
  'Shared/temp',
  'Shared/temp/do_not_delete',
  'Archive_2024',
  'Archive_2024/Q1',
  'Archive_2024/Q2',
  'New Folder',
  'New Folder/New Folder (1)',
  'New Folder/New Folder (1)/New Folder (2)',
  '_IMPORTANT',
  'Meeting Notes',
  'Meeting Notes/January'
];

// =============================================================================
// Main entry point
// =============================================================================

/**
 * Verifies the organised workspace against expected file counts.
 * Uses partial credit: each correctly placed file counts toward the score.
 */
function verify() {
  Logger.log('=== GAS Tutorial Verifier ===');
  Logger.log('');

  // -------------------------------------------------------------------------
  // Step 1: Find workspace root
  // -------------------------------------------------------------------------
  var root = findWorkspaceRoot_();
  if (!root) {
    Logger.log('ERROR: Workspace "' + ROOT_FOLDER_NAME + '" not found in Drive.');
    Logger.log('Please run setup() first, then solution(), then verify().');
    return;
  }
  Logger.log('Workspace found: ' + root.getName());
  Logger.log('');

  // -------------------------------------------------------------------------
  // Step 2: Count files in each expected folder (with partial credit)
  // -------------------------------------------------------------------------
  var totalExpected = 0;
  var totalCorrect = 0;
  var perfect = [];
  var partial = [];
  var missing = [];

  var folderPaths = Object.keys(EXPECTED_COUNTS);
  for (var i = 0; i < folderPaths.length; i++) {
    var folderPath = folderPaths[i];
    var expected = EXPECTED_COUNTS[folderPath];
    totalExpected += expected;

    var actual = _countFilesInPath_(root, folderPath);
    var credit = Math.min(actual, expected);
    totalCorrect += credit;

    var entry = { path: folderPath, expected: expected, actual: actual, credit: credit };

    if (actual === expected) {
      perfect.push(entry);
    } else if (actual > 0) {
      partial.push(entry);
    } else {
      missing.push(entry);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Check messy folders for leftover files
  // -------------------------------------------------------------------------
  var messyLeftovers = [];
  var totalLeftovers = 0;
  for (var j = 0; j < MESSY_FOLDERS.length; j++) {
    var messyPath = MESSY_FOLDERS[j];
    var leftoverCount = _countFilesInPath_(root, messyPath);
    if (leftoverCount > 0) {
      messyLeftovers.push({ path: messyPath, count: leftoverCount });
      totalLeftovers += leftoverCount;
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Print results
  // -------------------------------------------------------------------------
  Logger.log('--- Results by Folder ---');
  Logger.log('');

  if (perfect.length > 0) {
    Logger.log('PERFECT (' + perfect.length + ' folder(s)):');
    for (var p = 0; p < perfect.length; p++) {
      Logger.log('  [OK] ' + perfect[p].path +
                 ' — ' + perfect[p].actual + '/' + perfect[p].expected + ' files');
    }
    Logger.log('');
  }

  if (partial.length > 0) {
    Logger.log('PARTIAL (' + partial.length + ' folder(s)):');
    for (var r = 0; r < partial.length; r++) {
      var diff = partial[r].actual - partial[r].expected;
      var diffStr = diff > 0 ? '+' + diff + ' extra' : diff + ' missing';
      Logger.log('  [~] ' + partial[r].path +
                 ' — ' + partial[r].actual + '/' + partial[r].expected + ' files' +
                 ' (' + diffStr + ', credit: ' + partial[r].credit + ')');
    }
    Logger.log('');
  }

  if (missing.length > 0) {
    Logger.log('EMPTY (' + missing.length + ' folder(s)):');
    for (var m = 0; m < missing.length; m++) {
      Logger.log('  [X] ' + missing[m].path +
                 ' — 0/' + missing[m].expected + ' files');
    }
    Logger.log('');
  }

  if (messyLeftovers.length > 0) {
    Logger.log('FILES STILL IN MESSY FOLDERS (' + totalLeftovers + ' total):');
    for (var k = 0; k < messyLeftovers.length; k++) {
      Logger.log('  [!!] ' + messyLeftovers[k].path +
                 ' — ' + messyLeftovers[k].count + ' file(s) not yet moved');
    }
    Logger.log('');
  } else {
    Logger.log('Messy folders: all clear, no leftover files.');
    Logger.log('');
  }

  // -------------------------------------------------------------------------
  // Step 5: Final score with partial credit
  // -------------------------------------------------------------------------
  var pct = totalExpected > 0 ? Math.round(totalCorrect / totalExpected * 100) : 0;
  var scoreLabel = _scoreLabel_(totalCorrect, totalExpected);

  Logger.log('=== Score: ' + totalCorrect + ' / ' + totalExpected +
             ' files correctly placed (' + pct + '%) ===');
  Logger.log(scoreLabel);

  if (totalCorrect === totalExpected && messyLeftovers.length === 0) {
    Logger.log('');
    Logger.log('Perfect! All files are in the right place. Great work!');
  } else if (totalCorrect === totalExpected) {
    Logger.log('');
    Logger.log('All files are in the correct destination folders!');
    Logger.log('Bonus: clean up ' + totalLeftovers + ' leftover(s) in the messy folders for a perfect score.');
  } else {
    Logger.log('');
    Logger.log('Tip: Check the folders marked [~] or [X] above.');
    Logger.log('Re-run your solution to fix any remaining issues, then verify() again.');
  }
}

// =============================================================================
// Private helpers
// =============================================================================

/**
 * Counts the direct (non-recursive) files inside a folder identified by
 * a slash-delimited path relative to root.
 * Returns 0 if the folder does not exist.
 *
 * @param {Folder} root The workspace root folder.
 * @param {string} path Slash-delimited relative path, e.g. "Projects/Hackathon".
 * @return {number}
 */
function _countFilesInPath_(root, path) {
  try {
    var parts = path.split('/');
    var current = root;

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part === '') continue;
      var children = current.getFoldersByName(part);
      if (!children.hasNext()) {
        return 0;
      }
      current = children.next();
    }

    var count = 0;
    var files = current.getFiles();
    while (files.hasNext()) {
      files.next();
      count++;
    }
    return count;
  } catch (e) {
    // Drive service errors (folder deleted, permission denied, rate limit)
    Logger.log('WARN: Could not access path "' + path + '": ' + e.message);
    return 0;
  }
}

/**
 * Returns a human-readable performance label based on the score ratio.
 * Uses partial credit — every correctly placed file counts.
 *
 * @param {number} correct
 * @param {number} total
 * @return {string}
 */
function _scoreLabel_(correct, total) {
  if (total === 0) return '';
  var pct = correct / total;
  if (pct === 1)    return 'Grade: S  — Perfect!';
  if (pct >= 0.95)  return 'Grade: A+ — Outstanding!';
  if (pct >= 0.85)  return 'Grade: A  — Excellent!';
  if (pct >= 0.7)   return 'Grade: B+ — Great work!';
  if (pct >= 0.5)   return 'Grade: B  — Good progress!';
  if (pct >= 0.3)   return 'Grade: C  — Keep going!';
  return                    'Grade: D  — Getting started — you\'ve got this!';
}
