/**
 * 06_sheet_practice.js
 * Beginner practice: normalize applicant spreadsheet data and match emails.
 *
 * Assumed sheets:
 *   - Sheet1: 이름, 나이, 지원트랙, 지원동기 (+ optional 연락처)
 *   - Sheet2: 이름, 이메일
 *
 * Output sheet:
 *   - 정규화_지원자_목록
 */

var PRACTICE_SHEET1_NAME = 'Sheet1';
var PRACTICE_SHEET2_NAME = 'Sheet2';
var PRACTICE_OUTPUT_SHEET_NAME = '정규화_지원자_목록';

/**
 * Optional helper for instructors: create sample data in Sheet1/Sheet2.
 * If target sheets already contain data, pass true to force overwrite.
 *
 * @param {boolean=} forceOverwrite
 */
function createBeginnerPracticeSampleData(forceOverwrite) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('ERROR: 이 스크립트는 Google 스프레드시트에 연결된 프로젝트에서 실행하세요.');
    return;
  }

  var sheet1 = _getOrCreateSheet_(ss, PRACTICE_SHEET1_NAME);
  var sheet2 = _getOrCreateSheet_(ss, PRACTICE_SHEET2_NAME);

  var shouldOverwrite = (forceOverwrite === true);
  if (!shouldOverwrite && (_sheetHasData_(sheet1) || _sheetHasData_(sheet2))) {
    Logger.log('중단: Sheet1 또는 Sheet2에 이미 데이터가 있습니다.');
    Logger.log('Run createBeginnerPracticeSampleData(true) to overwrite intentionally.');
    return;
  }

  sheet1.clearContents();
  sheet2.clearContents();

  var sheet1Rows = [
    ['이름', '나이', '지원트랙', '지원동기', '연락처'],
    // --- SeSAC (10명) ---
    ['김민지', 24, 'SeSAC', '실무 중심의 백엔드 개발 경험을 쌓고 싶습니다.', '010 1234 5678'],
    ['정서윤', 23, 'SeSAC', '프론트엔드 개발자가 되고 싶습니다.', '010-5555-6666'],
    ['오  현우', 26, 'SeSAC', '클라우드 인프라에 관심이 많습니다.', '010.1111.2222'],
    ['문채원', 22, 'SeSAC', '디자인과 개발을 함께 하고 싶습니다.', '+82-10-3333-4444'],
    ['배준혁', 28, 'SeSAC', '데이터 분석 직무로 전환하고 싶습니다.', '01055556666'],
    ['신유나', 25, 'SeSAC', '스타트업 취업을 목표로 실습 경험을 쌓고 싶습니다.', '010-7777-8888'],
    ['조민서', 27, 'SeSAC', '풀스택 개발자로 성장하고 싶습니다.', '010 9999 0000'],
    ['유승민', 24, 'SeSAC', '앱 개발에 관심이 있어 지원합니다.', '+82-10-2222-3333'],
    ['나  은비', 21, 'SeSAC', 'UX 리서치와 프론트엔드를 함께 배우고 싶습니다.', '010-4444-5555'],
    ['홍석진', 29, 'SeSAC', 'DevOps 엔지니어를 목표로 하고 있습니다.', '01066667777'],
    // --- SSAFY (10명) ---
    ['이  준', 27, 'SSAFY', '소프트웨어 분야로 커리어 전환을 하고 싶습니다.', '010-9999-0000'],
    ['한지호', 28, 'SSAFY', '삼성 SW 역량 강화를 위해 지원합니다.', '010 7777 8888'],
    ['서다은', 24, 'SSAFY', '임베디드 시스템 개발을 배우고 싶습니다.', '010-1234-0000'],
    ['장우진', 26, 'SSAFY', '알고리즘 역량을 집중적으로 키우고 싶습니다.', '+82-10-5678-1234'],
    ['권수빈', 23, 'SSAFY', '삼성 입사를 목표로 SW 역량을 쌓고 싶습니다.', '010.8888.9999'],
    ['안도현', 30, 'SSAFY', '체계적인 교육과정에서 배우고 싶습니다.', '01012340000'],
    ['윤지현', 25, 'SSAFY', '백엔드 아키텍처에 관심이 있습니다.', '010-2345-6789'],
    ['김태  윤', 27, 'SSAFY', 'IoT와 소프트웨어 융합 분야를 공부하고 싶습니다.', '010 3456 7890'],
    ['이소정', 22, 'SSAFY', '웹 개발 기초부터 탄탄히 다지고 싶습니다.', '+82-10-4567-8901'],
    ['박건우', 29, 'SSAFY', '팀 프로젝트 경험을 통해 협업 능력을 기르고 싶습니다.', '010-5678-9012'],
    // --- KDT (10명) ---
    ['박소라', 22, 'KDT', '멘토링과 함께 포트폴리오 프로젝트를 진행하고 싶습니다.', '+82-10-7777-1212'],
    ['강예진', 25, 'KDT', 'AI/ML 분야에 관심이 있습니다.', '+82-10-1111-2222'],
    ['임서준', 23, 'KDT', '데이터 사이언스 직무를 목표로 하고 있습니다.', '010 6789 0123'],
    ['최  유진', 26, 'KDT', '실무 프로젝트 중심의 교육을 원합니다.', '010-7890-1234'],
    ['허민재', 28, 'KDT', '머신러닝 엔지니어가 되고 싶습니다.', '01089012345'],
    ['백서연', 24, 'KDT', '국비지원으로 개발을 시작하고 싶습니다.', '010.9012.3456'],
    ['류지훈', 27, 'KDT', '컴퓨터 비전 분야를 공부하고 싶습니다.', '+82-10-0123-4567'],
    ['황수아', 21, 'KDT', '비전공자로서 IT 분야에 도전하고 싶습니다.', '010-1357-2468'],
    ['전승현', 30, 'KDT', 'NLP와 자연어 처리에 관심이 있습니다.', '010 2468 1357'],
    ['고은채', 25, 'KDT', '포트폴리오를 만들어서 취업하고 싶습니다.', '010-3579-4680'],
    // --- Hackathon (10명) ---
    ['최하나', 29, 'Hackathon', '실제 문제를 해결하는 것을 즐깁니다.', '010.3333.4444'],
    ['송민호', 30, 'Hackathon', '창업 아이디어를 실현하고 싶습니다.', '010-3456-7890'],
    ['양하린', 22, 'Hackathon', '빠르게 프로토타입을 만드는 경험을 하고 싶습니다.', '010 4680 3579'],
    ['구  본혁', 27, 'Hackathon', '팀원들과 함께 문제를 해결하는 경험이 좋습니다.', '+82-10-5791-3680'],
    ['오세영', 24, 'Hackathon', '사회적 문제를 기술로 해결하고 싶습니다.', '01068024579'],
    ['차지원', 26, 'Hackathon', '새로운 기술을 빠르게 배우고 적용하는 걸 좋아합니다.', '010-7913-5802'],
    ['주현  성', 28, 'Hackathon', '공공데이터 활용 서비스를 만들고 싶습니다.', '010.8024.6913'],
    ['탁예슬', 23, 'Hackathon', '해커톤 수상 경력을 쌓고 싶습니다.', '010 9135 7024'],
    ['방시우', 25, 'Hackathon', '기획부터 개발까지 전과정을 경험하고 싶습니다.', '+82-10-0246-8135'],
    ['피승아', 21, 'Hackathon', 'AI를 활용한 서비스 아이디어가 있습니다.', '010-1358-0246'],
    // --- BootCamp (10명) ---
    ['윤다빈', 26, 'BootCamp', '코딩 기초를 탄탄히 다지고 싶습니다.', '01044445555'],
    ['임하늘', 21, 'BootCamp', '비전공자이지만 개발을 시작하고 싶습니다.', '01098765432'],
    ['성준영', 24, 'BootCamp', '단기간에 집중적으로 코딩을 배우고 싶습니다.', '010-2469-1358'],
    ['노  하은', 22, 'BootCamp', '웹 개발 기초부터 배우고 싶습니다.', '010 3570 2469'],
    ['도경민', 28, 'BootCamp', '직장인인데 퇴근 후 개발을 배우고 싶습니다.', '+82-10-4681-3570'],
    ['마예린', 25, 'BootCamp', '디자이너에서 개발자로 전직하고 싶습니다.', '010.5792.4681'],
    ['석우람', 27, 'BootCamp', 'Python 기초부터 시작하고 싶습니다.', '01068035792'],
    ['봉지수', 23, 'BootCamp', '부트캠프에서 동료를 만들고 싶습니다.', '010-7914-6803'],
    ['감민혁', 30, 'BootCamp', '창업을 위해 기본적인 개발 역량을 쌓고 싶습니다.', '010 8025 7914'],
    ['표수진', 26, 'BootCamp', '데이터 분석을 위한 프로그래밍을 배우고 싶습니다.', '+82-10-9136-8025']
  ];

  // Sheet2: 이메일 목록 (일부 지원자는 의도적으로 누락 — 매칭 실패 테스트용)
  // 누락: 송민호, 안도현, 허민재, 오세영, 도경민, 감민혁, 홍석진, 전승현
  var sheet2Rows = [
    ['이름', '이메일'],
    ['김민지', 'minji.kim@example.com'],
    ['정서윤', 'seoyun.jung@example.com'],
    ['오현우', 'hyunwoo.oh@example.com'],
    ['문채원', 'chaewon.moon@example.com'],
    ['배준혁', 'junhyuk.bae@example.com'],
    ['신유나', 'yuna.shin@example.com'],
    ['조민서', 'minseo.jo@example.com'],
    ['유승민', 'seungmin.yu@example.com'],
    ['나은비', 'eunbi.na@example.com'],
    ['이준', 'joon.lee@example.com'],
    ['한지호', 'jiho.han@example.com'],
    ['서다은', 'daeun.seo@example.com'],
    ['장우진', 'woojin.jang@example.com'],
    ['권수빈', 'subin.kwon@example.com'],
    ['윤지현', 'jihyun.yoon@example.com'],
    ['김태윤', 'taeyoon.kim@example.com'],
    ['이소정', 'sojeong.lee@example.com'],
    ['박건우', 'gunwoo.park@example.com'],
    ['박소라', 'sora.park@example.com'],
    ['강예진', 'yejin.kang@example.com'],
    ['임서준', 'seojun.lim@example.com'],
    ['최유진', 'yujin.choi@example.com'],
    ['백서연', 'seoyeon.baek@example.com'],
    ['류지훈', 'jihoon.ryu@example.com'],
    ['황수아', 'sua.hwang@example.com'],
    ['고은채', 'eunchae.go@example.com'],
    ['최하나', 'hana.choi@example.com'],
    ['양하린', 'harin.yang@example.com'],
    ['구본혁', 'bonhyuk.gu@example.com'],
    ['차지원', 'jiwon.cha@example.com'],
    ['주현성', 'hyunsung.ju@example.com'],
    ['탁예슬', 'yeseul.tak@example.com'],
    ['방시우', 'siwoo.bang@example.com'],
    ['피승아', 'seunga.pi@example.com'],
    ['윤다빈', 'dabin.yoon@example.com'],
    ['임하늘', 'haneul.lim@example.com'],
    ['성준영', 'junyoung.sung@example.com'],
    ['노하은', 'haeun.no@example.com'],
    ['마예린', 'yerin.ma@example.com'],
    ['석우람', 'woolam.seok@example.com'],
    ['봉지수', 'jisoo.bong@example.com'],
    ['표수진', 'sujin.pyo@example.com']
  ];

  sheet1.getRange(1, 1, sheet1Rows.length, sheet1Rows[0].length).setValues(sheet1Rows);
  sheet2.getRange(1, 1, sheet2Rows.length, sheet2Rows[0].length).setValues(sheet2Rows);

  Logger.log('샘플 데이터 생성 완료: Sheet1 + Sheet2');
}

/**
 * Main beginner exercise function.
 * - Normalizes text fields
 * - Normalizes phone numbers (if phone column exists)
 * - Matches emails from Sheet2 by name
 * - Writes final table to NormalizedApplicants
 */
function runBeginnerNormalizationPractice() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('ERROR: 이 스크립트는 Google 스프레드시트에 연결된 프로젝트에서 실행하세요.');
    return;
  }

  var sheet1 = ss.getSheetByName(PRACTICE_SHEET1_NAME);
  var sheet2 = ss.getSheetByName(PRACTICE_SHEET2_NAME);

  if (!sheet1 || !sheet2) {
    Logger.log('ERROR: Sheet1 and Sheet2 are required.');
    Logger.log('Expected: Sheet1(name, age, applied track/role, application motivation), Sheet2(name, email).');
    return;
  }

  var data1 = sheet1.getDataRange().getValues();
  var data2 = sheet2.getDataRange().getValues();

  if (data1.length < 2 || data2.length < 2) {
    Logger.log('ERROR: Both sheets need a header row + at least one data row.');
    return;
  }

  var header1 = _buildHeaderIndex_(data1[0]);
  var header2 = _buildHeaderIndex_(data2[0]);

  var sheet1NameKey = _findHeaderKey_(header1, ['이름', 'name']);
  var sheet1AgeKey = _findHeaderKey_(header1, ['나이', 'age']);
  var sheet1TrackKey = _findHeaderKey_(header1, ['지원트랙', '지원역할', 'applied track/role', 'track', 'role']);
  var sheet1MotivationKey = _findHeaderKey_(header1, ['지원동기', 'application motivation', 'motivation']);
  var sheet1PhoneKey = _findHeaderKey_(header1, ['연락처', '전화번호', 'phone', 'phone number']);

  var sheet2NameKey = _findHeaderKey_(header2, ['이름', 'name']);
  var sheet2EmailKey = _findHeaderKey_(header2, ['이메일', 'email']);

  if (!sheet1NameKey || !sheet1AgeKey || !sheet1TrackKey || !sheet1MotivationKey || !sheet2NameKey || !sheet2EmailKey) {
    Logger.log('ERROR: Required headers are missing.');
    Logger.log('Sheet1 required: name, age, applied track/role, application motivation');
    Logger.log('Sheet2 required: name, email');
    return;
  }

  var emailMap = {};
  var duplicateNameInSheet2 = 0;
  for (var i = 1; i < data2.length; i++) {
    var row2 = data2[i];
    var rawName2 = row2[header2[sheet2NameKey]];
    var rawEmail2 = row2[header2[sheet2EmailKey]];

    var normalizedName2 = _normalizeName_(rawName2);
    var normalizedEmail2 = _normalizeEmail_(rawEmail2);

    if (!normalizedName2) continue;

    if (!emailMap[normalizedName2]) {
      emailMap[normalizedName2] = normalizedEmail2;
    } else if (emailMap[normalizedName2] !== normalizedEmail2) {
      duplicateNameInSheet2++;
      Logger.log('WARN: Sheet2 duplicate name with different email: ' + normalizedName2 +
                 ' (' + emailMap[normalizedName2] + ' vs ' + normalizedEmail2 + ')');
    }
  }

  var outputRows = [];
  outputRows.push([
    '이름',
    '나이',
    '지원트랙',
    '이메일',
    '지원동기',
    '연락처_정규화',
    '비고'
  ]);

  var matchedCount = 0;
  var unmatchedCount = 0;
  var phoneNormalizedCount = 0;

  for (var j = 1; j < data1.length; j++) {
    var row1 = data1[j];

    var rawName1 = row1[header1[sheet1NameKey]];
    var rawAge1 = row1[header1[sheet1AgeKey]];
    var rawTrack1 = row1[header1[sheet1TrackKey]];
    var rawMotivation1 = row1[header1[sheet1MotivationKey]];
    var rawPhone1 = sheet1PhoneKey ? row1[header1[sheet1PhoneKey]] : '';

    var name = _normalizeName_(rawName1);
    if (!name) continue;

    var age = String(rawAge1 === null ? '' : rawAge1).trim();
    var track = _normalizeSpaces_(rawTrack1);
    var motivation = _normalizeSpaces_(rawMotivation1);
    var normalizedPhone = _normalizePhone_(rawPhone1);

    if (normalizedPhone) {
      phoneNormalizedCount++;
    }

    var email = emailMap[name] || '';
    var note = '';

    if (email) {
      matchedCount++;
    } else {
      unmatchedCount++;
      note = 'Sheet2에서 이메일을 찾을 수 없음';
    }

    outputRows.push([name, age, track, email, motivation, normalizedPhone, note]);
  }

  var outputSheet = _getOrCreateSheet_(ss, PRACTICE_OUTPUT_SHEET_NAME);
  outputSheet.clearContents();
  outputSheet.getRange(1, 1, outputRows.length, outputRows[0].length).setValues(outputRows);

  Logger.log('=== 정규화 실습 완료 ===');
  Logger.log('출력 시트: ' + PRACTICE_OUTPUT_SHEET_NAME);
  Logger.log('처리된 지원자 수: ' + (outputRows.length - 1));
  Logger.log('이메일 매칭 성공: ' + matchedCount);
  Logger.log('이메일 없음: ' + unmatchedCount);
  Logger.log('Sheet2 중복 이름 충돌: ' + duplicateNameInSheet2);
  Logger.log('연락처 정규화 완료 (비어있지 않은 항목): ' + phoneNormalizedCount);
}

// =============================================================================
// Private helpers
// =============================================================================

function _getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  return ss.insertSheet(name);
}

function _sheetHasData_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return false;
  if (values.length === 1 && values[0].length === 1 && String(values[0][0]).trim() === '') return false;
  return true;
}

function _buildHeaderIndex_(headerRow) {
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    var key = String(headerRow[i]).trim().toLowerCase();
    if (!key) continue;
    map[key] = i;
  }
  return map;
}

function _findHeaderKey_(headerMap, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var key = String(candidates[i]).trim().toLowerCase();
    if (headerMap[key] !== undefined) {
      return key;
    }
  }
  return null;
}

function _normalizeName_(value) {
  return _normalizeSpaces_(value);
}

function _normalizeEmail_(value) {
  return String(value === null ? '' : value).trim().toLowerCase();
}

function _normalizeSpaces_(value) {
  return String(value === null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes various phone formats to a readable Korean style.
 * Examples:
 *   010 1234 5678   -> 010-1234-5678
 *   +82-10-7777-1212 -> 010-7777-1212
 *   02 123 4567     -> 02-123-4567
 */
function _normalizePhone_(value) {
  var raw = String(value === null ? '' : value).trim();
  if (!raw) return '';

  var digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // +82 country code handling (82 + 10xxxxxxxx -> 010xxxxxxxx)
  if (digits.indexOf('82') === 0) {
    digits = '0' + digits.substring(2);
  }

  if (digits.length === 11) {
    return digits.substring(0, 3) + '-' + digits.substring(3, 7) + '-' + digits.substring(7);
  }

  if (digits.length === 10 && digits.indexOf('02') === 0) {
    return digits.substring(0, 2) + '-' + digits.substring(2, 6) + '-' + digits.substring(6);
  }

  if (digits.length === 10) {
    return digits.substring(0, 3) + '-' + digits.substring(3, 6) + '-' + digits.substring(6);
  }

  if (digits.length === 9 && digits.indexOf('02') === 0) {
    return digits.substring(0, 2) + '-' + digits.substring(2, 5) + '-' + digits.substring(5);
  }

  return digits;
}
