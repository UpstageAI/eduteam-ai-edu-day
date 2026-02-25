/**
 * 07_drive_generation_practice.js
 * Intermediate practice: create Drive folders and applicant docs by track.
 *
 * Input priority:
 *   1) NormalizedApplicants sheet (from 06_sheet_practice.js)
 *   2) Sheet1 fallback
 *
 * Behavior:
 *   - Group applicants by applied track/role
 *   - Create root folder + track folders
 *   - Create one document per applicant named "Name.docx"
 *   - Write applicant motivation inside the document
 *   - Skip existing same-name docs (no overwrite)
 *   - Support dry-run preview mode
 */

var APPLICANT_DRIVE_ROOT_NAME = '트랙별_지원자';

/**
 * Main intermediate practice function.
 *
 * @param {{dryRun?: boolean}=} options
 *        - dryRun: true  -> preview only (default)
 *        - dryRun: false -> actually create docs
 */
function runDriveFolderGenerationPractice(options) {
  var opts = options || {};
  var dryRun = (opts.dryRun !== false);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('ERROR: 이 스크립트는 Google 스프레드시트에 연결된 프로젝트에서 실행하세요.');
    return;
  }

  var applicants = _readApplicantsForDrive_(ss);
  if (applicants.length === 0) {
    Logger.log('ERROR: 지원자 데이터를 찾을 수 없습니다.');
    Logger.log('runBeginnerNormalizationPractice()를 먼저 실행하거나 Sheet1 데이터를 준비하세요.');
    return;
  }

  var rootResolution = _resolveRootFolder_(APPLICANT_DRIVE_ROOT_NAME, !dryRun);
  if (rootResolution.status === 'ambiguous' || rootResolution.status === 'error') {
    Logger.log('ERROR: 루트 폴더를 확인할 수 없습니다.');
    return;
  }

  var rootFolder = rootResolution.folder;
  if (!rootFolder && !dryRun) {
    Logger.log('ERROR: Could not resolve/create root folder in commit mode.');
    return;
  }

  if (!rootFolder && dryRun && rootResolution.status === 'missing') {
    Logger.log('[미리보기] 루트 폴더 생성 예정: ' + APPLICANT_DRIVE_ROOT_NAME);
  }

  var createdDocs = 0;
  var skippedExisting = 0;
  var skippedRows = 0;
  var trackCreateCounts = {};
  var trackExistingCounts = {};

  for (var i = 0; i < applicants.length; i++) {
    var item = applicants[i];

    if (!item.name || !item.track) {
      skippedRows++;
      Logger.log('SKIP 행 #' + item.rowNumber + ': 이름 또는 트랙 누락');
      continue;
    }

    var safeTrackName = _sanitizeFolderName_(item.track);
    var trackFolder = null;
    if (rootFolder) {
      trackFolder = _getOrCreateChildFolder_(rootFolder, safeTrackName, !dryRun);
      if (!trackFolder) {
        skippedRows++;
        Logger.log('SKIP 행 #' + item.rowNumber + ': 트랙 폴더가 모호합니다 "' + safeTrackName + '"');
        continue;
      }
    }

    if (!trackFolder && dryRun) {
      Logger.log('[미리보기] 트랙 폴더 생성 예정: ' + APPLICANT_DRIVE_ROOT_NAME + '/' + safeTrackName);
    }
    var safeFileBase = _sanitizeFileName_(item.name);
    if (!safeFileBase) {
      skippedRows++;
      Logger.log('SKIP 행 #' + item.rowNumber + ': 파일 생성에 유효하지 않은 이름');
      continue;
    }
    var docName = safeFileBase + '.docx';

    var hasExisting = false;
    if (trackFolder) {
      var existing = trackFolder.getFilesByName(docName);
      hasExisting = existing.hasNext();
    }

    if (hasExisting) {
      skippedExisting++;
      trackExistingCounts[safeTrackName] = (trackExistingCounts[safeTrackName] || 0) + 1;
      Logger.log('SKIP 기존 파일: ' + safeTrackName + '/' + docName);
    } else {
      if (dryRun) {
        trackCreateCounts[safeTrackName] = (trackCreateCounts[safeTrackName] || 0) + 1;
        Logger.log('[미리보기] 생성 예정: ' + safeTrackName + '/' + docName);
      } else {
        var doc = DocumentApp.create(docName);
        _rewriteApplicantDoc_(doc, item);

        var docFile = DriveApp.getFileById(doc.getId());
        docFile.moveTo(trackFolder);

        createdDocs++;
        trackCreateCounts[safeTrackName] = (trackCreateCounts[safeTrackName] || 0) + 1;
        Logger.log('생성 완료: ' + safeTrackName + '/' + docName);
      }
    }
  }

  Logger.log('');
  Logger.log('=== Drive 폴더 생성 실습 완료 ===');
  Logger.log('모드: ' + (dryRun ? '미리보기 (실제 생성 안 함)' : '실행 (파일 생성)'));
  Logger.log('루트 폴더: ' + (rootFolder ? rootFolder.getName() : APPLICANT_DRIVE_ROOT_NAME + ' (will be created)'));
  Logger.log('생성된 문서: ' + createdDocs);
  Logger.log('건너뛴 기존 문서: ' + skippedExisting);
  Logger.log('건너뛴 행: ' + skippedRows);
  Logger.log('트랙별 요약:');

  var trackNames = _mergeTrackNames_(trackCreateCounts, trackExistingCounts);
  for (var t = 0; t < trackNames.length; t++) {
    var track = trackNames[t];
    var createdOrPlanned = trackCreateCounts[track] || 0;
    var existing = trackExistingCounts[track] || 0;
    Logger.log('  - ' + track + ': ' + (dryRun ? '생성 예정 ' : '생성 완료 ') + createdOrPlanned +
               ', 기존 건너뜀 ' + existing);
  }
}

// =============================================================================
// Private helpers
// =============================================================================

function _readApplicantsForDrive_(ss) {
  var normalized = ss.getSheetByName('NormalizedApplicants');
  if (normalized) {
    return _readApplicantsFromSheet_(normalized, {
      name: ['이름', 'name'],
      age: ['나이', 'age'],
      track: ['지원트랙', 'applied_track_role', 'applied track/role', 'track', 'role'],
      motivation: ['지원동기', 'application_motivation', 'application motivation', 'motivation'],
      email: ['이메일', 'email'],
      phone: ['연락처_정규화', 'phone_normalized', 'phone', 'phone number']
    });
  }

  var sheet1 = ss.getSheetByName('Sheet1');
  if (!sheet1) return [];

  return _readApplicantsFromSheet_(sheet1, {
    name: ['이름', 'name'],
    age: ['나이', 'age'],
    track: ['지원트랙', '지원역할', 'applied track/role', 'track', 'role'],
    motivation: ['지원동기', 'application motivation', 'motivation'],
    email: ['이메일', 'email'],
    phone: ['연락처', '전화번호', 'phone', 'phone number']
  });
}

function _readApplicantsFromSheet_(sheet, aliases) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headerMap = {};
  for (var i = 0; i < values[0].length; i++) {
    var k = String(values[0][i]).trim().toLowerCase();
    if (!k) continue;
    headerMap[k] = i;
  }

  var nameKey = _pickHeaderKey_(headerMap, aliases.name);
  var trackKey = _pickHeaderKey_(headerMap, aliases.track);
  var motivationKey = _pickHeaderKey_(headerMap, aliases.motivation);
  var ageKey = _pickHeaderKey_(headerMap, aliases.age);
  var emailKey = _pickHeaderKey_(headerMap, aliases.email);
  var phoneKey = _pickHeaderKey_(headerMap, aliases.phone);

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var name = nameKey ? _cleanCell_(row[headerMap[nameKey]]) : '';
    var track = trackKey ? _cleanCell_(row[headerMap[trackKey]]) : '';
    var motivation = motivationKey ? _cleanCell_(row[headerMap[motivationKey]]) : '';
    var age = ageKey ? _cleanCell_(row[headerMap[ageKey]]) : '';
    var email = emailKey ? _cleanCell_(row[headerMap[emailKey]]) : '';
    var phone = phoneKey ? _cleanCell_(row[headerMap[phoneKey]]) : '';

    if (!name && !track && !motivation) continue;

    rows.push({
      rowNumber: r + 1,
      name: name,
      track: track,
      motivation: motivation,
      age: age,
      email: email,
      phone: phone
    });
  }

  return rows;
}

function _pickHeaderKey_(headerMap, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var key = String(candidates[i]).trim().toLowerCase();
    if (headerMap[key] !== undefined) {
      return key;
    }
  }
  return null;
}

function _cleanCell_(value) {
  return String(value === null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
}

function _sanitizeFolderName_(name) {
  var cleaned = _cleanCell_(name)
    .replace(/[\\/:*?"<>|#%]/g, '_')
    .replace(/\.+$/g, '');

  if (!cleaned) return 'Unspecified_Track';
  return cleaned;
}

function _sanitizeFileName_(name) {
  var cleaned = _cleanCell_(name)
    .replace(/[\\/:*?"<>|#%]/g, '_')
    .replace(/\.+$/g, '');

  if (!cleaned) return '';
  return cleaned;
}

function _rewriteApplicantDoc_(doc, applicant) {
  var body = doc.getBody();
  body.clear();
  body.appendParagraph('지원자 프로필').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('이름: ' + applicant.name);
  body.appendParagraph('지원 트랙: ' + applicant.track);
  if (applicant.age) {
    body.appendParagraph('나이: ' + applicant.age);
  }
  if (applicant.email) {
    body.appendParagraph('이메일: ' + applicant.email);
  }
  if (applicant.phone) {
    body.appendParagraph('연락처: ' + applicant.phone);
  }

  body.appendParagraph('');
  body.appendParagraph('지원 동기').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(applicant.motivation || '(지원 동기가 입력되지 않았습니다)');

  doc.saveAndClose();
}

function _resolveRootFolder_(name, allowCreate) {
  var scriptProps = PropertiesService.getScriptProperties();
  var pinnedId = scriptProps.getProperty('APPLICANT_DRIVE_ROOT_ID');
  if (pinnedId) {
    try {
      return { status: 'ok', folder: DriveApp.getFolderById(pinnedId) };
    } catch (e) {
      Logger.log('WARN: APPLICANT_DRIVE_ROOT_ID is set but invalid: ' + e.message);
      return { status: 'error', folder: null };
    }
  }

  var existing = DriveApp.getFoldersByName(name);
  var matches = [];
  while (existing.hasNext()) {
    matches.push(existing.next());
  }

  if (matches.length > 1) {
    Logger.log('ERROR: Multiple folders found with name "' + name + '".');
    Logger.log('Set Script Property APPLICANT_DRIVE_ROOT_ID to pin one folder.');
    return { status: 'ambiguous', folder: null };
  }

  if (matches.length === 1) {
    return { status: 'ok', folder: matches[0] };
  }

  if (allowCreate) {
    return { status: 'created', folder: DriveApp.createFolder(name) };
  }

  return { status: 'missing', folder: null };
}

function _getOrCreateChildFolder_(parent, name, allowCreate) {
  var existing = parent.getFoldersByName(name);
  var matches = [];
  while (existing.hasNext()) {
    matches.push(existing.next());
  }

  if (matches.length > 1) {
    Logger.log('ERROR: Multiple child folders named "' + name + '" under "' + parent.getName() + '".');
    return null;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  if (allowCreate) {
    return parent.createFolder(name);
  }

  return null;
}

function _mergeTrackNames_(a, b) {
  var map = {};
  var keysA = Object.keys(a);
  var keysB = Object.keys(b);

  for (var i = 0; i < keysA.length; i++) {
    map[keysA[i]] = true;
  }
  for (var j = 0; j < keysB.length; j++) {
    map[keysB[j]] = true;
  }

  return Object.keys(map).sort();
}
