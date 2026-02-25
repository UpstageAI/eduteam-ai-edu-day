/**
 * 05_reset.js
 * Removes the GAS Tutorial workspace so students or instructors can start fresh.
 * Safe to run multiple times. Does not affect any other Drive content.
 *
 * Functions:
 *   resetWorkspace()    — Moves the workspace folder to Drive trash (recoverable).
 *   permanentDelete()   — Warns that trashed files auto-delete after 30 days.
 *
 * Note: The reset() alias in 02_helpers.js calls the same trash logic.
 */

// =============================================================================
// Public entry points
// =============================================================================

/**
 * Moves the GAS_Tutorial_Workspace folder to Drive trash.
 * Files remain recoverable from the Drive trash for up to 30 days.
 * Idempotent: safe to run even if the workspace does not exist.
 *
 * After running this, call setup() to create a fresh workspace.
 */
function resetWorkspace() {
  Logger.log('=== Reset Workspace ===');

  var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var count = 0;

  while (folders.hasNext()) {
    var folder = folders.next();
    var url = folder.getUrl();
    folder.setTrashed(true);
    count++;
    Logger.log('Trashed folder: ' + folder.getName() + ' (' + url + ')');
  }

  Logger.log('');
  if (count > 0) {
    Logger.log('Done. ' + count + ' workspace folder(s) moved to trash.');
    Logger.log('Files are recoverable from Drive trash for up to 30 days.');
    Logger.log('');
    Logger.log('Next step: run setup() to create a fresh workspace.');
  } else {
    Logger.log('No workspace named "' + ROOT_FOLDER_NAME + '" found. Nothing to reset.');
    Logger.log('Run setup() to create a new workspace.');
  }
}

/**
 * Informs the user that trashed files will be permanently deleted automatically
 * after 30 days by Google Drive. No additional action is needed.
 *
 * If you need to free up quota immediately, you can empty the Drive trash
 * manually at https://drive.google.com (right-click trash -> "Empty trash").
 *
 * Important: permanent deletion CANNOT be undone.
 */
function permanentDelete() {
  Logger.log('=== Permanent Delete Info ===');
  Logger.log('');
  Logger.log('Google Drive automatically purges trashed files after 30 days.');
  Logger.log('There is no GAS API to permanently delete files programmatically');
  Logger.log('without the Drive advanced service and special permissions.');
  Logger.log('');
  Logger.log('To permanently delete the workspace immediately:');
  Logger.log('  1. Run resetWorkspace() to move the folder to trash (if not done yet).');
  Logger.log('  2. Open https://drive.google.com in your browser.');
  Logger.log('  3. Click "Trash" in the left sidebar.');
  Logger.log('  4. Locate "' + ROOT_FOLDER_NAME + '", right-click -> "Delete forever".');
  Logger.log('     OR click "Empty trash" to remove everything at once.');
  Logger.log('');
  Logger.log('WARNING: Permanent deletion cannot be undone.');
}
