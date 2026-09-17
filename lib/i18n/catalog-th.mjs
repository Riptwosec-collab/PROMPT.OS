import { normalizeLanguage } from './runtime.mjs';
import { translateComplete } from './complete.mjs';

const CATALOG_THAI_TEXT = Object.freeze({
  English: 'อังกฤษ',
  Thai: 'ไทย',
  'Multi-language': 'หลายภาษา',
  'Output language': 'ภาษาผลลัพธ์',
  EXECUTABLE: 'พร้อมใช้งาน',
  EXAMPLE_INPUT: 'วิธีใช้พรอมต์',

  'Prompt Library': 'คลังพรอมต์',
  'Search prompts': 'ค้นหาพรอมต์',
  Favorites: 'รายการโปรด',
  Recent: 'ล่าสุด',
  'Has Variables': 'มีตัวแปร',
  Category: 'หมวดหมู่',
  Difficulty: 'ระดับความยาก',
  Source: 'แหล่งที่มา',
  All: 'ทั้งหมด',
  Yes: 'ใช่',
  No: 'ไม่',
  Overview: 'ภาพรวม',
  Inputs: 'ข้อมูลเข้า',
  Preview: 'ตัวอย่าง',
  'Prompt Variables': 'ตัวแปรของพรอมต์',
  'Required fields are marked with *.': 'ช่องที่จำเป็นจะแสดงเครื่องหมาย *',
  'Rendered Prompt': 'พรอมต์หลังแทนค่า',
  'Prompt Health': 'สุขภาพพรอมต์',
  'LOCAL SCORE': 'คะแนนในเครื่อง',
  Structure: 'โครงสร้าง',
  Context: 'บริบท',
  Variables: 'ตัวแปร',
  Constraints: 'ข้อจำกัด',
  'Output Format': 'รูปแบบผลลัพธ์',
  Reliability: 'ความน่าเชื่อถือ',
  Findings: 'ข้อค้นพบ',
  'No variables required': 'ไม่ต้องกรอกตัวแปร',
  optional: 'ไม่บังคับ',
  Required: 'จำเป็น',
  'Execution is not enabled for this V5 preview yet.': 'ยังไม่ได้เปิดการรันสำหรับตัวอย่าง V5 นี้',
  'Run Prompt': 'รันพรอมต์',
  Improve: 'ปรับปรุง',
  Copy: 'คัดลอก',
  Favorite: 'รายการโปรด',
  Pin: 'ปักหมุด',
  'Prompt Packs': 'ชุดพรอมต์',
  'Curated workflows': 'เวิร์กโฟลว์ที่คัดสรร',
  Open: 'เปิด',
  'Add all to Workspace': 'เพิ่มทั้งหมดไปยังพื้นที่ทำงาน',
  Workspace: 'พื้นที่ทำงาน',
  'All Prompts': 'พรอมต์ทั้งหมด',
  'Smart Collections': 'คอลเลกชันอัจฉริยะ',
  Pinned: 'ปักหมุดแล้ว',
  'Recently Used': 'ใช้ล่าสุด',
  'Most Used': 'ใช้บ่อยที่สุด',
  'Recently Added': 'เพิ่มล่าสุด',
  Folders: 'โฟลเดอร์',
  'No folders yet': 'ยังไม่มีโฟลเดอร์',
  'Continue Working': 'ทำงานต่อ',
  'No matching prompts': 'ไม่พบพรอมต์ที่ตรงกัน',

  TOPIC: 'หัวข้อ',
  OBJECTIVES: 'วัตถุประสงค์',
  CLAIM: 'ข้อกล่าวอ้าง',
  ARTICLE: 'บทความ',
  PAPER: 'งานวิจัย',
  SOURCES: 'แหล่งข้อมูล',
  TECHNOLOGY: 'เทคโนโลยี',
  CODE: 'โค้ด',
  EXPECTED_BEHAVIOR: 'พฤติกรรมที่คาดหวัง',
  ACTUAL_BEHAVIOR: 'พฤติกรรมที่เกิดขึ้นจริง',
  ERROR: 'ข้อผิดพลาด',
  TEST_FRAMEWORK: 'เฟรมเวิร์กทดสอบ',
  OPTIMIZATION_GOAL: 'เป้าหมายการปรับประสิทธิภาพ',
  REQUIREMENT: 'ความต้องการ',
  LANGUAGE: 'ภาษา',
  APPLICATION: 'แอปพลิเคชัน',
  REQUIREMENTS: 'ข้อกำหนด',
  SYSTEM: 'ระบบ',
  CONTENT: 'เนื้อหา',
  SCHEMA: 'โครงสร้างข้อมูล',
  COLUMNS: 'คอลัมน์',
  TEXT: 'ข้อความ',
  INPUT: 'ข้อมูลเข้า',
  CATEGORIES: 'หมวดหมู่',
  QUESTION: 'คำถาม',
  AUDIENCE: 'กลุ่มเป้าหมาย',
  TONE: 'โทน',
  LENGTH: 'ความยาว',
  PRIMARY_KEYWORD: 'คีย์เวิร์ดหลัก',
  SECONDARY_KEYWORDS: 'คีย์เวิร์ดรอง',
  COUNT: 'จำนวน',
  PLATFORM: 'แพลตฟอร์ม',
  TRANSCRIPT: 'บทถอดเสียง',
  SLIDES: 'จำนวนสไลด์',
  SUBJECT: 'วิชา',
  LEVEL: 'ระดับ',
  GOAL: 'เป้าหมาย',
  DIFFICULTY: 'ระดับความยาก',
  QUESTION_TYPES: 'ประเภทคำถาม',

  ANALYSIS: 'วิเคราะห์',
  DEEP_RESEARCH: 'วิจัยเชิงลึก',
  FACT_CHECK: 'ตรวจสอบข้อเท็จจริง',
  VERIFY: 'ตรวจสอบ',
  ACADEMIC: 'วิชาการ',
  SOURCE: 'แหล่งข้อมูล',
  COMPARE: 'เปรียบเทียบ',
  REVIEW: 'รีวิว',
  DEBUG: 'ดีบัก',
  SECURITY: 'ความปลอดภัย',
  BUG: 'บั๊ก',
  TROUBLESHOOTING: 'แก้ปัญหา',
  TEST: 'ทดสอบ',
  UNIT_TEST: 'Unit Test',
  OPTIMIZATION: 'ปรับประสิทธิภาพ',
  PERFORMANCE: 'ประสิทธิภาพ',
  BIG_O: 'Big-O',
  ALGORITHM: 'อัลกอริทึม',
  REGEX: 'Regex',
  VALIDATION: 'ตรวจสอบความถูกต้อง',
  DOCKER: 'Docker',
  DEPLOYMENT: 'ดีพลอย',
  API: 'API',
  REST: 'REST',
  BACKEND: 'แบ็กเอนด์',
  SQL: 'SQL',
  SCHEMA_TAG: 'สคีมา',
  JSON: 'JSON',
  EXTRACTION: 'ดึงข้อมูล',
  TABLE: 'ตาราง',
  SENTIMENT: 'ความรู้สึก',
  NLP: 'NLP',
  CLASSIFICATION: 'จำแนกประเภท',
  OBJECT: 'วัตถุ',
  QA: 'ถาม-ตอบ',
  MULTIMODAL: 'มัลติโหมด',
  TRANSCRIPTION: 'ถอดเสียง',
  DIARIZATION: 'แยกผู้พูด',
  BLOG: 'บล็อก',
  CONTENT_TAG: 'คอนเทนต์',
  SEO: 'SEO',
  SOCIAL: 'โซเชียล',
  MEETING: 'การประชุม',
  SUMMARY: 'สรุป',
  TASK_TAG: 'งาน',
  ACTION: 'งานที่ต้องทำ',
  PRESENTATION: 'งานนำเสนอ',
  SLIDES_TAG: 'สไลด์',
  TUTOR: 'ติวเตอร์',
  LEARNING: 'การเรียนรู้',
  QUIZ: 'แบบทดสอบ',

  DEEP_RESEARCH_ASSISTANT: 'ผู้ช่วยวิจัยเชิงลึก',
  FACT_CHECKER: 'ผู้ตรวจสอบข้อเท็จจริงด้วย AI',
  ARTICLE_ANALYZER: 'ตัววิเคราะห์บทความ',
  PAPER_ANALYZER: 'ตัววิเคราะห์งานวิจัย',
  SOURCE_COMPARATOR: 'ตัวเปรียบเทียบแหล่งข้อมูล',
  CODE_REVIEWER: 'ผู้ตรวจสอบโค้ดระดับมืออาชีพ',
  BUG_HUNTER: 'นักล่าบั๊ก',
  UNIT_TEST_GENERATOR: 'ตัวสร้าง Unit Test',
  CODE_OPTIMIZER: 'ตัวปรับปรุงประสิทธิภาพโค้ด',
  TIME_COMPLEXITY_ANALYZER: 'ตัววิเคราะห์ Time Complexity',
  REGEX_GENERATOR: 'ตัวสร้าง Regex',
  DOCKER_GENERATOR: 'ตัวสร้าง Docker',
  API_DESIGNER: 'ผู้ออกแบบ REST API',
  DATABASE_SCHEMA_DESIGNER: 'ผู้ออกแบบโครงสร้างฐานข้อมูล',
  JSON_EXTRACTOR: 'ตัวดึงข้อมูล JSON',
  TABLE_EXTRACTOR: 'ตัวดึงข้อมูลเป็นตาราง',
  SENTIMENT_ANALYZER: 'ตัววิเคราะห์ความรู้สึก',
  DATA_CLASSIFIER: 'ตัวจำแนกข้อมูลด้วย AI',
  IMAGE_OBJECT_ANALYZER: 'ตัววิเคราะห์วัตถุในภาพ',
  IMAGE_TO_JSON: 'แปลงภาพเป็น JSON',
  VIDEO_QA: 'ถาม-ตอบจากวิดีโอ',
  AUDIO_TRANSCRIBER: 'ตัวถอดเสียง',
  BLOG_GENERATOR: 'ตัวสร้างบทความบล็อก',
  SEO_CONTENT_WRITER: 'นักเขียนคอนเทนต์ SEO',
  SOCIAL_CONTENT_GENERATOR: 'ตัวสร้างคอนเทนต์โซเชียล',
  MEETING_SUMMARIZER: 'ตัวสรุปการประชุม',
  ACTION_ITEM_EXTRACTOR: 'ตัวดึงรายการงานที่ต้องทำ',
  PRESENTATION_BUILDER: 'ตัวสร้างโครงงานนำเสนอ',
  PERSONAL_TUTOR: 'ติวเตอร์ AI ส่วนตัว',
  QUIZ_GENERATOR: 'ตัวสร้างแบบทดสอบ',
});

const TAG_ALIASES = Object.freeze({
  SCHEMA: 'สคีมา',
  CONTENT: 'คอนเทนต์',
  TASK: 'งาน',
  SLIDES: 'สไลด์',
});

function interpolate(template, params = {}) {
  return String(template).replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : full
  ));
}

function translateUsageGuideToThai(source) {
  if (!source.startsWith('HOW TO USE PROMPT\n')) return null;
  const variables = [...new Set([...source.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((match) => match[1]))];
  const required = variables.length
    ? variables.map((name) => `{{${name}}}`).join(', ')
    : 'รูปภาพ วิดีโอ เสียง เอกสาร หรือไฟล์ต้นฉบับที่พรอมต์ต้องใช้';

  return [
    'วิธีใช้พรอมต์',
    `1. กรอกหรือแนบข้อมูลที่จำเป็น: ${required}.`,
    '2. เลือกภาษาของผลลัพธ์ โดยค่าเริ่มต้นเป็นภาษาไทย',
    '3. ตรวจตัวอย่างพรอมต์หลังแทนค่าตัวแปร และตรวจว่าไม่มีช่องที่จำเป็นเว้นว่าง',
    '4. กดรันพรอมต์ หากข้อมูลสำคัญยังขาด ระบบจะถามเฉพาะข้อมูลที่ขาดแทนการเดาเอง',
  ].join('\n');
}

export function translateCatalogThai(language, text, params = {}) {
  const lang = normalizeLanguage(language);
  const source = String(text ?? '');

  if (lang === 'en') {
    if (source === 'EXAMPLE_INPUT') return 'HOW TO USE PROMPT';
    return interpolate(source, params);
  }

  const usageGuide = translateUsageGuideToThai(source);
  if (usageGuide) return usageGuide;

  let match = source.match(/^SYNCED (\d+)s AGO$/);
  if (match) return `ซิงก์แล้วเมื่อ ${match[1]} วินาทีก่อน`;
  match = source.match(/^SYNCED (\d+)m AGO$/);
  if (match) return `ซิงก์แล้วเมื่อ ${match[1]} นาทีก่อน`;
  match = source.match(/^SYNCED (\d+)h AGO$/);
  if (match) return `ซิงก์แล้วเมื่อ ${match[1]} ชั่วโมงก่อน`;

  if (Object.prototype.hasOwnProperty.call(CATALOG_THAI_TEXT, source)) {
    return interpolate(CATALOG_THAI_TEXT[source], params);
  }
  if (Object.prototype.hasOwnProperty.call(TAG_ALIASES, source)) {
    return interpolate(TAG_ALIASES[source], params);
  }

  return translateComplete(lang, source, params);
}

export function getCatalogThaiDictionary() {
  return CATALOG_THAI_TEXT;
}
