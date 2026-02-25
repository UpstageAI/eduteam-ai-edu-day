/**
 * 01_setup.js
 * Creates a deliberately chaotic folder structure in Google Drive with 72 files
 * scattered across wrong folders. Run this once to set up the tutorial workspace.
 *
 * Dependencies:
 *   - FILE_MANIFEST from config/file_manifest.js (same GAS project)
 *   - Helpers from src/02_helpers.js (same GAS project)
 *
 * Estimated execution time: ~70 seconds for 72 files (well within 6-min limit)
 */

var WORKSPACE_ROOT_NAME = 'GAS_Tutorial_Workspace';

/**
 * Main setup function. Creates the messy workspace folder structure and
 * populates it with 72 files placed in deliberately wrong locations.
 */
function setup() {
  var startTime = new Date();
  Logger.log('=== GAS Tutorial Setup ===');
  Logger.log('Start time: ' + startTime.toLocaleTimeString());

  // -------------------------------------------------------------------------
  // Phase 1: Idempotency guard
  // -------------------------------------------------------------------------
  var existingFolders = DriveApp.getFoldersByName(WORKSPACE_ROOT_NAME);
  if (existingFolders.hasNext()) {
    Logger.log('ERROR: "' + WORKSPACE_ROOT_NAME + '" already exists in Drive.');
    Logger.log('Please run reset() first to remove the existing workspace, then try again.');
    return;
  }

  // -------------------------------------------------------------------------
  // Phase 2: Create root folder
  // -------------------------------------------------------------------------
  Logger.log('Creating root folder: ' + WORKSPACE_ROOT_NAME);
  var rootFolder = DriveApp.createFolder(WORKSPACE_ROOT_NAME);
  Logger.log('Root folder created. ID: ' + rootFolder.getId());

  // -------------------------------------------------------------------------
  // Phase 3: Create messy folder skeleton
  //
  // GAS_Tutorial_Workspace/
  // ├── 프로젝트/
  // │   ├── Hackathon_stuff/
  // │   │   └── old/
  // │   │       └── really_old/
  // │   ├── sesac/
  // │   └── SSAFY_2024_backup/
  // ├── Shared/
  // │   ├── Miscellaneous/
  // │   ├── Downloads/
  // │   └── temp/
  // │       └── do_not_delete/
  // ├── Archive_2024/
  // │   ├── Q1/
  // │   └── Q2/
  // ├── New Folder/
  // │   └── New Folder (1)/
  // │       └── New Folder (2)/
  // ├── _IMPORTANT/
  // └── Meeting Notes/
  //     └── January/
  // -------------------------------------------------------------------------
  Logger.log('Building folder skeleton...');
  var folders = _buildFolderSkeleton(rootFolder);
  Logger.log('Folder skeleton complete. ' + Object.keys(folders).length + ' folders created.');

  // -------------------------------------------------------------------------
  // Phase 4: Create files from FILE_MANIFEST
  // -------------------------------------------------------------------------
  Logger.log('Creating files from FILE_MANIFEST...');
  var manifest = FILE_MANIFEST;
  var total = manifest.length;
  var created = 0;
  var errors = 0;

  for (var i = 0; i < manifest.length; i++) {
    var entry = manifest[i];
    try {
      var targetFolder = _resolveFolder(folders, entry.placedIn);
      _createFile(entry, targetFolder);
      created++;
    } catch (e) {
      Logger.log('ERROR creating file #' + entry.id + ' "' + entry.name + '": ' + e.message);
      errors++;
    }

    // Log progress every 10 files
    if ((i + 1) % 10 === 0 || i === total - 1) {
      var elapsed = Math.round((new Date() - startTime) / 1000);
      Logger.log('Progress: ' + (i + 1) + '/' + total + ' files processed (' + elapsed + 's elapsed)');
    }
  }

  // -------------------------------------------------------------------------
  // Phase 6: Completion summary
  // -------------------------------------------------------------------------
  var totalElapsed = Math.round((new Date() - startTime) / 1000);
  Logger.log('');
  Logger.log('=== Setup Complete ===');
  Logger.log('Files created: ' + created + '/' + total);
  if (errors > 0) {
    Logger.log('Errors: ' + errors);
  }
  Logger.log('Total time: ' + totalElapsed + 's');
  Logger.log('Workspace: ' + rootFolder.getUrl());
  Logger.log('');
  Logger.log('Your messy workspace is ready! Open Google Drive and navigate to:');
  Logger.log('"' + WORKSPACE_ROOT_NAME + '" to see the chaos.');
  Logger.log('When ready to start the tutorial, run the solution() function in 03_solution.js');
}

// =============================================================================
// Private helpers
// =============================================================================

/**
 * Builds the full messy folder skeleton under rootFolder.
 * Returns a flat map of path -> Folder object for quick lookup.
 *
 * @param {Folder} rootFolder
 * @return {Object} map of "Shared/Miscellaneous" -> Folder
 */
function _buildFolderSkeleton(rootFolder) {
  var folders = {};

  // Helper to create a subfolder and register it in the map
  function mkDir(parent, name, pathKey) {
    var f = parent.createFolder(name);
    folders[pathKey] = f;
    return f;
  }

  // 프로젝트/
  var projects = mkDir(rootFolder, '프로젝트', '프로젝트');
  var hackathonStuff = mkDir(projects, 'Hackathon_stuff', '프로젝트/Hackathon_stuff');
  var old_ = mkDir(hackathonStuff, 'old', '프로젝트/Hackathon_stuff/old');
  mkDir(old_, 'really_old', '프로젝트/Hackathon_stuff/old/really_old');
  mkDir(projects, 'sesac', '프로젝트/sesac');
  mkDir(projects, 'SSAFY_2024_backup', '프로젝트/SSAFY_2024_backup');

  // Shared/
  var shared = mkDir(rootFolder, 'Shared', 'Shared');
  mkDir(shared, 'Miscellaneous', 'Shared/Miscellaneous');
  mkDir(shared, 'Downloads', 'Shared/Downloads');
  var temp = mkDir(shared, 'temp', 'Shared/temp');
  mkDir(temp, 'do_not_delete', 'Shared/temp/do_not_delete');

  // Archive_2024/
  var archive = mkDir(rootFolder, 'Archive_2024', 'Archive_2024');
  mkDir(archive, 'Q1', 'Archive_2024/Q1');
  mkDir(archive, 'Q2', 'Archive_2024/Q2');

  // New Folder/
  var newFolder = mkDir(rootFolder, 'New Folder', 'New Folder');
  var newFolder1 = mkDir(newFolder, 'New Folder (1)', 'New Folder/New Folder (1)');
  mkDir(newFolder1, 'New Folder (2)', 'New Folder/New Folder (1)/New Folder (2)');

  // _IMPORTANT/
  mkDir(rootFolder, '_IMPORTANT', '_IMPORTANT');

  // Meeting Notes/
  var meetingNotes = mkDir(rootFolder, 'Meeting Notes', 'Meeting Notes');
  mkDir(meetingNotes, 'January', 'Meeting Notes/January');

  return folders;
}

/**
 * Resolves a folder path string like "Shared/Miscellaneous" to the
 * corresponding Folder object from the skeleton map.
 * Falls back to the root-level folder if the path isn't found.
 *
 * @param {Object} folders  flat map built by _buildFolderSkeleton
 * @param {string} path     slash-delimited path (matches manifest placedIn)
 * @return {Folder}
 */
function _resolveFolder(folders, path) {
  if (!path) {
    throw new Error('placedIn path is empty');
  }
  var folder = folders[path];
  if (!folder) {
    // Log a warning and fall back to the first path segment (top-level folder)
    var topLevel = path.split('/')[0];
    folder = folders[topLevel];
    if (!folder) {
      throw new Error('Cannot resolve folder path: "' + path + '"');
    }
    Logger.log('WARN: Path "' + path + '" not in skeleton, falling back to "' + topLevel + '"');
  }
  return folder;
}

/**
 * Creates a single file in targetFolder based on its manifest entry type.
 * Google-native files (Doc/Sheet/Slides) are created in Drive root then moved.
 * Blob files (PDF/DOCX/XLSX) are created directly in the target folder.
 *
 * @param {Object} entry        manifest entry
 * @param {Folder} targetFolder resolved Folder object
 */
function _createFile(entry, targetFolder) {
  var name = entry.name;
  var type = entry.type;

  switch (type) {
    case 'DOCUMENT': {
      var doc = DocumentApp.create(name);
      doc.getBody().appendParagraph(name);
      doc.saveAndClose();
      var docFile = DriveApp.getFileById(doc.getId());
      docFile.moveTo(targetFolder);
      break;
    }

    case 'SPREADSHEET': {
      var ss = SpreadsheetApp.create(name);
      ss.getActiveSheet().getRange('A1').setValue(name);
      SpreadsheetApp.flush();
      var ssFile = DriveApp.getFileById(ss.getId());
      ssFile.moveTo(targetFolder);
      break;
    }

    case 'PRESENTATION': {
      var pres = SlidesApp.create(name);
      // Add title text to first slide
      var slide = pres.getSlides()[0];
      var titleShape = slide.getPlaceholders()[0];
      if (titleShape) {
        titleShape.asShape().getText().setText(name);
      }
      pres.saveAndClose();
      var presFile = DriveApp.getFileById(pres.getId());
      presFile.moveTo(targetFolder);
      break;
    }

    case 'PDF': {
      var pdfBlob = Utilities.newBlob('placeholder: ' + name, MimeType.PDF, name + '.pdf');
      targetFolder.createFile(pdfBlob);
      break;
    }

    case 'DOCX': {
      var docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      var docxBlob = Utilities.newBlob('placeholder: ' + name, docxMime, name + '.docx');
      targetFolder.createFile(docxBlob);
      break;
    }

    case 'XLSX': {
      var xlsxMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      var xlsxBlob = Utilities.newBlob('placeholder: ' + name, xlsxMime, name + '.xlsx');
      targetFolder.createFile(xlsxBlob);
      break;
    }

    default:
      throw new Error('Unknown file type: "' + type + '"');
  }
}
