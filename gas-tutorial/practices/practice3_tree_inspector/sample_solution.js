/**
 * 08_tree_inspector.js
 * Advanced-prep utility: inspect a chaotic Drive folder structure
 * and output the result to a Google Sheet (visual tree).
 *
 * Usage:
 *   inspectWorkspaceTree();
 *   inspectDriveTreeByName('GAS_Tutorial_Workspace');
 */

var TREE_OUTPUT_SHEET_NAME = '폴더_구조';
var TREE_DEFAULT_MAX_DEPTH = 6;

/**
 * Quick entry point for the tutorial workspace.
 */
function inspectWorkspaceTree() {
  var rootName = (typeof ROOT_FOLDER_NAME !== 'undefined') ? ROOT_FOLDER_NAME : 'GAS_Tutorial_Workspace';
  inspectDriveTreeByName(rootName);
}

/**
 * Inspects a Drive folder by name and writes the tree to a sheet.
 *
 * @param {string} folderName Target folder name
 * @param {number=} maxDepth  Maximum recursion depth (default 6)
 */
function inspectDriveTreeByName(folderName, maxDepth) {
  if (!folderName) {
    Logger.log('ERROR: folderName is required');
    return;
  }

  var folders = DriveApp.getFoldersByName(folderName);
  var matches = [];
  while (folders.hasNext()) {
    matches.push(folders.next());
  }

  if (matches.length === 0) {
    Logger.log('ERROR: 폴더를 찾을 수 없습니다: ' + folderName);
    return;
  }

  if (matches.length > 1) {
    Logger.log('ERROR: 같은 이름의 폴더가 여러 개 있습니다: "' + folderName + '"');
    Logger.log('inspectDriveTreeById(folderId)를 사용하세요.');
    return;
  }

  var root = matches[0];
  _writeTreeToSheet_(root, maxDepth);
}

/**
 * Inspects a Drive folder by ID and writes the tree to a sheet.
 *
 * @param {string} folderId  Target folder ID
 * @param {number=} maxDepth Maximum recursion depth
 */
function inspectDriveTreeById(folderId, maxDepth) {
  if (!folderId) {
    Logger.log('ERROR: folderId is required');
    return;
  }

  var root;
  try {
    root = DriveApp.getFolderById(folderId);
  } catch (e) {
    Logger.log('ERROR: 폴더에 접근할 수 없습니다: ' + folderId + ' (' + e.message + ')');
    return;
  }

  _writeTreeToSheet_(root, maxDepth);
}

// =============================================================================
// Core: collect tree data and write to sheet
// =============================================================================

function _writeTreeToSheet_(rootFolder, maxDepth) {
  var depth = (typeof maxDepth === 'number' && maxDepth >= 0) ? maxDepth : TREE_DEFAULT_MAX_DEPTH;

  var rows = [];
  var stats = { folders: 0, files: 0 };

  // Root row
  rows.push({
    depth: 0,
    name: rootFolder.getName(),
    type: '폴더',
    path: rootFolder.getName()
  });

  _collectTree_(rootFolder, rootFolder.getName(), 0, depth, rows, stats);

  // Write to sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('ERROR: 이 스크립트는 Google 스프레드시트에 연결된 프로젝트에서 실행하세요.');
    return;
  }

  var sheet = _getOrCreateInspectorSheet_(ss, TREE_OUTPUT_SHEET_NAME);
  sheet.clearContents();
  sheet.clearFormats();

  // Header
  var header = ['트리 구조', '유형', '전체 경로'];
  var outputRows = [header];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var indent = '';
    for (var d = 0; d < row.depth; d++) {
      indent += '    ';
    }
    var icon = (row.type === '폴더') ? '📁 ' : '📄 ';
    outputRows.push([
      indent + icon + row.name,
      row.type,
      row.path
    ]);
  }

  sheet.getRange(1, 1, outputRows.length, 3).setValues(outputRows);

  // Format header
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');

  // Format folder rows with light background
  for (var r = 0; r < rows.length; r++) {
    if (rows[r].type === '폴더') {
      sheet.getRange(r + 2, 1, 1, 3).setBackground('#E8F0FE');
    }
  }

  // Auto-resize columns
  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(2);
  sheet.autoResizeColumn(3);

  // Set monospace font for tree column so indentation aligns
  sheet.getRange(2, 1, rows.length, 1).setFontFamily('Courier New');

  // Summary row
  var summaryRow = outputRows.length + 2;
  sheet.getRange(summaryRow, 1).setValue('=== 요약 ===').setFontWeight('bold');
  sheet.getRange(summaryRow + 1, 1).setValue('폴더 수: ' + stats.folders);
  sheet.getRange(summaryRow + 2, 1).setValue('파일 수: ' + stats.files);
  sheet.getRange(summaryRow + 3, 1).setValue('전체 항목: ' + rows.length);

  Logger.log('=== 폴더 구조 시트 생성 완료 ===');
  Logger.log('시트 이름: ' + TREE_OUTPUT_SHEET_NAME);
  Logger.log('폴더 수: ' + stats.folders);
  Logger.log('파일 수: ' + stats.files);
  Logger.log('전체 행: ' + rows.length);
}

function _collectTree_(folder, currentPath, currentDepth, maxDepth, rows, stats) {
  stats.folders++;

  if (currentDepth >= maxDepth) {
    rows.push({
      depth: currentDepth + 1,
      name: '... (최대 깊이 도달)',
      type: '-',
      path: currentPath + '/...'
    });
    return;
  }

  var childFolders = _folderIteratorToSortedArray_(folder.getFolders());
  var childFiles = _fileIteratorToSortedArray_(folder.getFiles());

  // Folders first
  for (var i = 0; i < childFolders.length; i++) {
    var sub = childFolders[i];
    var subPath = currentPath + '/' + sub.getName();
    rows.push({
      depth: currentDepth + 1,
      name: sub.getName(),
      type: '폴더',
      path: subPath
    });
    _collectTree_(sub, subPath, currentDepth + 1, maxDepth, rows, stats);
  }

  // Then files
  for (var j = 0; j < childFiles.length; j++) {
    var file = childFiles[j];
    stats.files++;
    rows.push({
      depth: currentDepth + 1,
      name: file.getName(),
      type: '파일',
      path: currentPath + '/' + file.getName()
    });
  }
}

// =============================================================================
// Helpers
// =============================================================================

function _getOrCreateInspectorSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  return ss.insertSheet(name);
}

function _folderIteratorToSortedArray_(folders) {
  var arr = [];
  while (folders.hasNext()) {
    arr.push(folders.next());
  }
  arr.sort(function(a, b) {
    var an = a.getName().toLowerCase();
    var bn = b.getName().toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });
  return arr;
}

function _fileIteratorToSortedArray_(files) {
  var arr = [];
  while (files.hasNext()) {
    arr.push(files.next());
  }
  arr.sort(function(a, b) {
    var an = a.getName().toLowerCase();
    var bn = b.getName().toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });
  return arr;
}
