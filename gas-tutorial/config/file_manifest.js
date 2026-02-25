// =============================================================================
// FILE MANIFEST — GAS Tutorial Workspace
// Data layer: 72-file manifest + folder structure definitions
// =============================================================================

var FILE_MANIFEST = [
  // ---------------------------------------------------------------------------
  // Well-tagged files in wrong folders (01–25)
  // ---------------------------------------------------------------------------
  {
    id: 1,
    name: '[Hackathon][2024][Final] team_alpha_pitch_deck',
    type: 'PRESENTATION',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024', 'Final']
  },
  {
    id: 2,
    name: '[Hackathon][2024][Draft] project_proposal_v1',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Archive_2024/Q2',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024', 'Draft']
  },
  {
    id: 3,
    name: '[Hackathon][2024] participant_roster',
    type: 'SPREADSHEET',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024']
  },
  {
    id: 4,
    name: '[Hackathon][2025][Draft] sponsorship_outreach_list',
    type: 'SPREADSHEET',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2025', 'Draft']
  },
  {
    id: 5,
    name: '[Hackathon][2025][Final] winner_announcement',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Meeting Notes/January',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2025', 'Final']
  },
  {
    id: 6,
    name: '[SeSAC][2024][Final] curriculum_v3',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: '프로젝트/Hackathon_stuff/old',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2024', 'Final']
  },
  {
    id: 7,
    name: '[SeSAC][2024][Draft] curriculum_outline',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: 'Shared/temp',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2024', 'Draft']
  },
  {
    id: 8,
    name: '[SeSAC][2024] student_attendance_tracker',
    type: 'SPREADSHEET',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: 'New Folder/New Folder (1)',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2024']
  },
  {
    id: 9,
    name: '[SeSAC][2025][Draft] 커리큘럼_초안_v2',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: 'Archive_2024/Q1',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2025', 'Draft']
  },
  {
    id: 10,
    name: '[SeSAC][2025][Review] instructor_feedback_form',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: '프로젝트/SSAFY_2024_backup',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2025', 'Review']
  },
  {
    id: 11,
    name: '[SSAFY][2024][Final] graduation_ceremony_slides',
    type: 'PRESENTATION',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'Shared/Downloads',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2024', 'Final']
  },
  {
    id: 12,
    name: '[SSAFY][2024][Draft] mentoring_schedule',
    type: 'SPREADSHEET',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: '프로젝트/Hackathon_stuff',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2024', 'Draft']
  },
  {
    id: 13,
    name: '[SSAFY][2024] project_evaluation_rubric',
    type: 'SPREADSHEET',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'Meeting Notes',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2024']
  },
  {
    id: 14,
    name: '[SSAFY][2025][Draft] admission_criteria_2025',
    type: 'DOCUMENT',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2025', 'Draft']
  },
  {
    id: 15,
    name: '[SSAFY][2025][Final] 최종_프레젠테이션_가이드',
    type: 'PRESENTATION',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'Shared/temp/do_not_delete',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2025', 'Final']
  },
  {
    id: 16,
    name: '[KDT][2024][Final] completion_certificates_list',
    type: 'SPREADSHEET',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2024', 'Final']
  },
  {
    id: 17,
    name: '[KDT][2024][Draft] module_3_exercises',
    type: 'DOCUMENT',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: 'New Folder/New Folder (1)/New Folder (2)',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2024', 'Draft']
  },
  {
    id: 18,
    name: '[KDT][2025][Draft] python_basics_handout',
    type: 'DOCUMENT',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: 'Archive_2024/Q1',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2025', 'Draft']
  },
  {
    id: 19,
    name: '[KDT][2025][Review] capstone_project_guidelines',
    type: 'DOCUMENT',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2025', 'Review']
  },
  {
    id: 20,
    name: '[KDT][2024] quarterly_progress_report',
    type: 'SPREADSHEET',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: 'Meeting Notes/January',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2024']
  },
  {
    id: 21,
    name: '[BootCamp][2024][Final] demo_day_schedule',
    type: 'DOCUMENT',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: 'Shared/Downloads',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2024', 'Final']
  },
  {
    id: 22,
    name: '[BootCamp][2024][Draft] week1_onboarding_checklist',
    type: 'DOCUMENT',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: '프로젝트/Hackathon_stuff/old/really_old',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2024', 'Draft']
  },
  {
    id: 23,
    name: '[BootCamp][2025][Draft] marketing_brochure_copy',
    type: 'DOCUMENT',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: 'Shared/temp',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2025', 'Draft']
  },
  {
    id: 24,
    name: '[BootCamp][2025][Final] alumni_network_contacts',
    type: 'SPREADSHEET',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: '프로젝트/SSAFY_2024_backup',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2025', 'Final']
  },
  {
    id: 25,
    name: '[BootCamp][2024] budget_allocation_breakdown',
    type: 'SPREADSHEET',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: 'New Folder',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2024']
  },

  // ---------------------------------------------------------------------------
  // [Ext] tagged files (26–33)
  // ---------------------------------------------------------------------------
  {
    id: 26,
    name: '[Hackathon][Ext][2024] venue_contract_signed',
    type: 'PDF',
    correctProject: 'Hackathon',
    correctFolder: 'External',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', 'Ext', '2024']
  },
  {
    id: 27,
    name: '[SeSAC][Ext][2025] government_funding_approval',
    type: 'PDF',
    correctProject: 'SeSAC',
    correctFolder: 'External',
    placedIn: 'Archive_2024/Q2',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', 'Ext', '2025']
  },
  {
    id: 28,
    name: '[SSAFY][Ext][2024] partner_company_MOU',
    type: 'PDF',
    correctProject: 'SSAFY',
    correctFolder: 'External',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', 'Ext', '2024']
  },
  {
    id: 29,
    name: '[KDT][Ext][2024] NCS_framework_reference',
    type: 'PDF',
    correctProject: 'KDT',
    correctFolder: 'External',
    placedIn: 'Shared/Downloads',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', 'Ext', '2024']
  },
  {
    id: 30,
    name: '[BootCamp][Ext][2025] 외부강사_계약서',
    type: 'PDF',
    correctProject: 'BootCamp',
    correctFolder: 'External',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', 'Ext', '2025']
  },
  {
    id: 31,
    name: '[Ext] industry_trends_report_2024',
    type: 'PDF',
    correctProject: null,
    correctFolder: 'External',
    placedIn: 'Shared/temp/do_not_delete',
    duplicate: false,
    duplicateOf: null,
    tags: ['Ext']
  },
  {
    id: 32,
    name: '[Hackathon][Ext] judge_scoring_template',
    type: 'XLSX',
    correctProject: 'Hackathon',
    correctFolder: 'External',
    placedIn: 'New Folder/New Folder (1)',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', 'Ext']
  },
  {
    id: 33,
    name: '[SeSAC][Ext] classroom_rental_invoice',
    type: 'DOCX',
    correctProject: 'SeSAC',
    correctFolder: 'External',
    placedIn: 'Meeting Notes',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', 'Ext']
  },

  // ---------------------------------------------------------------------------
  // Deliberate duplicates (34–39)
  // ---------------------------------------------------------------------------
  {
    id: 34,
    name: '[Hackathon][2024][Final] team_alpha_pitch_deck',
    type: 'PRESENTATION',
    correctProject: 'Hackathon',
    correctFolder: 'Duplicates',
    placedIn: '_IMPORTANT',
    duplicate: true,
    duplicateOf: 1,
    tags: ['Hackathon', '2024', 'Final']
  },
  {
    id: 35,
    name: '[Hackathon][2024] participant_roster',
    type: 'SPREADSHEET',
    correctProject: 'Hackathon',
    correctFolder: 'Duplicates',
    placedIn: 'Shared/Downloads',
    duplicate: true,
    duplicateOf: 3,
    tags: ['Hackathon', '2024']
  },
  {
    id: 36,
    name: '[SeSAC][2024][Final] curriculum_v3',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Duplicates',
    placedIn: 'Shared/Miscellaneous',
    duplicate: true,
    duplicateOf: 6,
    tags: ['SeSAC', '2024', 'Final']
  },
  {
    id: 37,
    name: '[SSAFY][2024][Final] graduation_ceremony_slides',
    type: 'PRESENTATION',
    correctProject: 'SSAFY',
    correctFolder: 'Duplicates',
    placedIn: '프로젝트/SSAFY_2024_backup',
    duplicate: true,
    duplicateOf: 11,
    tags: ['SSAFY', '2024', 'Final']
  },
  {
    id: 38,
    name: '[KDT][2024][Final] completion_certificates_list',
    type: 'SPREADSHEET',
    correctProject: 'KDT',
    correctFolder: 'Duplicates',
    placedIn: 'Archive_2024/Q2',
    duplicate: true,
    duplicateOf: 16,
    tags: ['KDT', '2024', 'Final']
  },
  {
    id: 39,
    name: '[BootCamp][2024][Final] demo_day_schedule',
    type: 'DOCUMENT',
    correctProject: 'BootCamp',
    correctFolder: 'Duplicates',
    placedIn: '프로젝트/Hackathon_stuff',
    duplicate: true,
    duplicateOf: 21,
    tags: ['BootCamp', '2024', 'Final']
  },

  // ---------------------------------------------------------------------------
  // No tags / malformed (40–51)
  // ---------------------------------------------------------------------------
  {
    id: 40,
    name: 'meeting_notes_jan15',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Meeting Notes/January',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 41,
    name: 'budget_summary',
    type: 'SPREADSHEET',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 42,
    name: 'random_ideas_brainstorm',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Shared/temp',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 43,
    name: '회의록_2024_12_03',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 44,
    name: 'presentation_final_FINAL_v3',
    type: 'PRESENTATION',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'New Folder',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 45,
    name: 'todo_list',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 46,
    name: '[Hackathon [Draft] broken_bracket_pitch',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Shared/Downloads',
    duplicate: false,
    duplicateOf: null,
    tags: [],
    malformed: true,
    malformedReason: 'Unclosed bracket in tag'
  },
  {
    id: 47,
    name: '[2024][Draft] orphan_no_project_tag',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Archive_2024/Q1',
    duplicate: false,
    duplicateOf: null,
    tags: ['2024', 'Draft'],
    malformed: true,
    malformedReason: 'Missing project tag'
  },
  {
    id: 48,
    name: '[SeSAC] [SSAFY] [2024] cross_project_notes',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Shared/temp/do_not_delete',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', 'SSAFY', '2024'],
    malformed: true,
    malformedReason: 'Multiple project tags'
  },
  {
    id: 49,
    name: 'Copy of [KDT][2024] quarterly_progress_report',
    type: 'SPREADSHEET',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: '프로젝트/Hackathon_stuff/old',
    duplicate: false,
    duplicateOf: null,
    tags: [],
    malformed: true,
    malformedReason: '"Copy of" prefix before tags'
  },
  {
    id: 50,
    name: 'Untitled document',
    type: 'DOCUMENT',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'New Folder/New Folder (1)/New Folder (2)',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },
  {
    id: 51,
    name: '제목없는_스프레드시트',
    type: 'SPREADSHEET',
    correctProject: null,
    correctFolder: 'Unsorted',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: []
  },

  // ---------------------------------------------------------------------------
  // Conflicting / unusual tags (52–60)
  // ---------------------------------------------------------------------------
  {
    id: 52,
    name: '[SSAFY][Draft][Final] confused_status_document',
    type: 'DOCUMENT',
    correctProject: 'SSAFY',
    correctFolder: 'Unsorted',
    placedIn: '프로젝트/Hackathon_stuff',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', 'Draft', 'Final'],
    malformed: true,
    malformedReason: 'Conflicting status tags (Draft + Final)'
  },
  {
    id: 53,
    name: '[Hackathon][2024][2025] multi_year_planning',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Unsorted',
    placedIn: 'Archive_2024/Q2',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024', '2025'],
    malformed: true,
    malformedReason: 'Multiple year tags'
  },
  {
    id: 54,
    name: '[KDT][Archive][2024] deprecated_syllabus',
    type: 'DOCUMENT',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', 'Archive', '2024']
  },
  {
    id: 55,
    name: '[BootCamp][Review][Ext] external_audit_feedback',
    type: 'PDF',
    correctProject: 'BootCamp',
    correctFolder: 'Unsorted',
    placedIn: 'Meeting Notes/January',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', 'Review', 'Ext'],
    malformed: true,
    malformedReason: 'Conflicting classification (Review + Ext)'
  },
  {
    id: 56,
    name: '[SeSAC][2025][Final][Draft] versioning_nightmare',
    type: 'SPREADSHEET',
    correctProject: 'SeSAC',
    correctFolder: 'Unsorted',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2025', 'Final', 'Draft'],
    malformed: true,
    malformedReason: 'Conflicting status tags (Final + Draft)'
  },
  {
    id: 57,
    name: '[Hackathon][Final] 해커톤_최종_발표자료_진짜최종',
    type: 'PRESENTATION',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Shared/temp',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', 'Final']
  },
  {
    id: 58,
    name: '[SSAFY][2025] placeholder_will_update_later',
    type: 'DOCUMENT',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'New Folder',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2025']
  },
  {
    id: 59,
    name: '[KDT][2025][Final] final_capstone_showcase',
    type: 'PRESENTATION',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2025', 'Final']
  },
  {
    id: 60,
    name: '[BootCamp][2024][Draft][Review] needs_both_review_edit',
    type: 'DOCUMENT',
    correctProject: 'BootCamp',
    correctFolder: 'Unsorted',
    placedIn: 'Archive_2024/Q1',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2024', 'Draft', 'Review'],
    malformed: true,
    malformedReason: 'Conflicting status tags (Draft + Review)'
  },

  // ---------------------------------------------------------------------------
  // Same-name different-format pairs (61–66)
  // ---------------------------------------------------------------------------
  {
    id: 61,
    name: '[Hackathon][2024] team_roster',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Shared/Miscellaneous',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024'],
    note: 'Same name as id:62, different type'
  },
  {
    id: 62,
    name: '[Hackathon][2024] team_roster',
    type: 'SPREADSHEET',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: '프로젝트/SSAFY_2024_backup',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024'],
    note: 'Same name as id:61, different type'
  },
  {
    id: 63,
    name: '[SeSAC][2025] budget_plan',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: 'Shared/Downloads',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2025'],
    note: 'Same name as id:64, different type'
  },
  {
    id: 64,
    name: '[SeSAC][2025] budget_plan',
    type: 'SPREADSHEET',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: '_IMPORTANT',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2025'],
    note: 'Same name as id:63, different type'
  },
  {
    id: 65,
    name: '[SSAFY][2024] interview_questions',
    type: 'DOCUMENT',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'Meeting Notes',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2024'],
    note: 'Same name as id:66, different type'
  },
  {
    id: 66,
    name: '[SSAFY][2024] interview_questions',
    type: 'PRESENTATION',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: 'New Folder/New Folder (1)',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2024'],
    note: 'Same name as id:65, different type'
  },

  // ---------------------------------------------------------------------------
  // Additional chaos (67–72)
  // ---------------------------------------------------------------------------
  {
    id: 67,
    name: '[SeSAC][2024][Final] 수료증_양식',
    type: 'DOCUMENT',
    correctProject: 'SeSAC',
    correctFolder: 'Projects/SeSAC',
    placedIn: '프로젝트/Hackathon_stuff/old/really_old',
    duplicate: false,
    duplicateOf: null,
    tags: ['SeSAC', '2024', 'Final']
  },
  {
    id: 68,
    name: '[Hackathon][2025][Review] sponsor_pitch_feedback',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'Shared/temp/do_not_delete',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2025', 'Review']
  },
  {
    id: 69,
    name: '[SSAFY][2025][Draft] 면접가이드_수정중',
    type: 'DOCUMENT',
    correctProject: 'SSAFY',
    correctFolder: 'Projects/SSAFY',
    placedIn: '프로젝트/sesac',
    duplicate: false,
    duplicateOf: null,
    tags: ['SSAFY', '2025', 'Draft']
  },
  {
    id: 70,
    name: '[KDT][2024] instructor_bios',
    type: 'PRESENTATION',
    correctProject: 'KDT',
    correctFolder: 'Projects/KDT',
    placedIn: 'Archive_2024/Q2',
    duplicate: false,
    duplicateOf: null,
    tags: ['KDT', '2024']
  },
  {
    id: 71,
    name: '[BootCamp][2025][Final] graduation_photo_slideshow',
    type: 'PRESENTATION',
    correctProject: 'BootCamp',
    correctFolder: 'Projects/BootCamp',
    placedIn: 'Meeting Notes/January',
    duplicate: false,
    duplicateOf: null,
    tags: ['BootCamp', '2025', 'Final']
  },
  {
    id: 72,
    name: '[Hackathon][2024][Draft] logistics_coordination_doc',
    type: 'DOCUMENT',
    correctProject: 'Hackathon',
    correctFolder: 'Projects/Hackathon',
    placedIn: 'New Folder/New Folder (1)/New Folder (2)',
    duplicate: false,
    duplicateOf: null,
    tags: ['Hackathon', '2024', 'Draft']
  }
];

// =============================================================================
// FOLDER STRUCTURE
// =============================================================================

/**
 * The messy source structure students will encounter.
 * Keys are folder names; values are nested child objects (empty object = leaf).
 */
var FOLDER_STRUCTURE = {
  messy: {
    'GAS_Tutorial_Workspace': {
      '프로젝트': {
        'Hackathon_stuff': {
          'old': {
            'really_old': {}
          }
        },
        'sesac': {},
        'SSAFY_2024_backup': {}
      },
      'Shared': {
        'Miscellaneous': {},
        'Downloads': {},
        'temp': {
          'do_not_delete': {}
        }
      },
      'Archive_2024': {
        'Q1': {},
        'Q2': {}
      },
      'New Folder': {
        'New Folder (1)': {
          'New Folder (2)': {}
        }
      },
      '_IMPORTANT': {},
      'Meeting Notes': {
        'January': {}
      }
    }
  },

  /**
   * The clean target structure students must produce.
   */
  clean: {
    'GAS_Tutorial_Workspace': {
      'Projects': {
        'Hackathon': {},
        'SeSAC': {},
        'SSAFY': {},
        'KDT': {},
        'BootCamp': {}
      },
      'External': {},
      'Duplicates': {},
      'Unsorted': {}
    }
  }
};

// Note: PROJECT_NAMES is defined in src/02_helpers.js (shared across all files)
