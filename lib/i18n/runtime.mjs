export const DEFAULT_LANGUAGE = 'th';
export const LANGUAGE_STORAGE_KEY = 'prompt-os-language';
export const SUPPORTED_LANGUAGES = Object.freeze(['th', 'en']);

const THAI_TEXT = Object.freeze({
  'Prompt Library': 'คลังพรอมต์',
  Dashboard: 'แดชบอร์ด',
  Favorites: 'รายการโปรด',
  Pinned: 'ปักหมุด',
  Trash: 'ถังขยะ',
  'New Prompt': 'พรอมต์ใหม่',
  'Search prompts...': 'ค้นหาพรอมต์...',
  'Cloud Sync': 'ซิงก์คลาวด์',
  'Send Magic Link': 'ส่งลิงก์เข้าสู่ระบบ',
  'Push to Cloud': 'อัปโหลดขึ้นคลาวด์',
  'Pull from Cloud': 'ดึงข้อมูลจากคลาวด์',
  'Sign Out': 'ออกจากระบบ',
  'Replace the local database with the cloud copy?': 'แทนที่ฐานข้อมูลในเครื่องด้วยข้อมูลจากคลาวด์หรือไม่?',
  'Run #{{number}}': 'รัน #{{number}}',

  'BOOTING_PROMPT.OS...': 'กำลังเริ่มระบบ PROMPT.OS...',
  'Return to Vault': 'กลับไปคลังพรอมต์',
  'SEARCH_PROMPTS_RESULTS_NOTES...': 'ค้นหาพรอมต์ ผลลัพธ์ และบันทึก...',
  'IMPORT: MERGE': 'นำเข้า: รวมข้อมูล',
  'IMPORT: KEEP BOTH': 'นำเข้า: เก็บทั้งคู่',
  'IMPORT: REPLACE': 'นำเข้า: แทนที่',
  'Export Backup': 'ส่งออกข้อมูลสำรอง',
  'Import Backup': 'นำเข้าข้อมูลสำรอง',
  '+ ADD_RECORD': '+ เพิ่มพรอมต์',
  'ADD_RECORD': 'เพิ่มพรอมต์',
  'SAVING...': 'กำลังบันทึก...',
  SAVE_ERROR: 'บันทึกไม่สำเร็จ',
  SAVED: 'บันทึกแล้ว',

  TYPE: 'ประเภท',
  CATEGORY: 'หมวดหมู่',
  STATUS: 'สถานะ',
  SORT: 'เรียงตาม',
  ALL: 'ทั้งหมด',
  TEXT: 'ข้อความ',
  IMAGE: 'รูปภาพ',
  '★ FAVORITE': '★ รายการโปรด',
  '⌖ PINNED': '⌖ ปักหมุด',
  FAVORITE: 'รายการโปรด',
  PINNED: 'ปักหมุด',
  RECENT: 'ล่าสุด',
  RUNS: 'จำนวนรัน',
  RESULTS: 'ผลลัพธ์',
  COPIES: 'จำนวนคัดลอก',
  RATING: 'คะแนน',
  GRID: 'ตาราง',
  LIST: 'รายการ',
  COMPACT: 'กระชับ',
  'NO_PROMPTS_MATCH_FILTERS': 'ไม่พบพรอมต์ที่ตรงกับตัวกรอง',

  COPY: 'คัดลอก',
  COPIED: 'คัดลอกแล้ว',
  EDIT: 'แก้ไข',
  DELETE: 'ลบ',
  TRASH: 'ถังขยะ',
  RESTORE: 'กู้คืน',
  DELETE_FOREVER: 'ลบถาวร',
  'Delete forever? This cannot be undone.': 'ลบถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
  'Move this prompt to Trash?': 'ย้ายพรอมต์นี้ไปถังขยะหรือไม่?',
  'Replace the current database with this backup?': 'แทนที่ฐานข้อมูลปัจจุบันด้วยไฟล์สำรองนี้หรือไม่?',
  CORRUPTED_OR_UNSUPPORTED_FILE: 'ไฟล์เสียหายหรือไม่รองรับ',

  SYSTEM_OVERVIEW: 'ภาพรวมระบบ',
  'Prompt Operations Dashboard': 'แดชบอร์ดการทำงานของพรอมต์',
  PROMPTS: 'พรอมต์',
  FAVORITES: 'รายการโปรด',
  'AVG RATING': 'คะแนนเฉลี่ย',
  TOP_PROMPTS: 'พรอมต์ที่ใช้งานสูงสุด',
  RECENTLY_UPDATED: 'อัปเดตล่าสุด',
  CATEGORY_DISTRIBUTION: 'สัดส่วนตามหมวดหมู่',
  RESULT_STATUS: 'สถานะผลลัพธ์',
  NO_DATA: 'ไม่มีข้อมูล',

  RECOVERY_ZONE: 'พื้นที่กู้คืน',
  TRASH_IS_EMPTY: 'ถังขยะว่าง',

  PROMPT: 'พรอมต์',
  BUILDER: 'ตัวสร้างพรอมต์',
  ANALYTICS: 'สถิติ',
  HEALTH: 'คุณภาพ',
  PROMPT_SOURCE: 'ต้นฉบับพรอมต์',
  COPY_RENDERED: 'คัดลอกพรอมต์ที่แทนค่าตัวแปรแล้ว',
  COPIED_RENDERED: 'คัดลอกแล้ว',
  PROMPT_HEALTH: 'ตรวจคุณภาพพรอมต์',
  VARIABLES: 'ตัวแปร',
  'Use {{variable}} inside the prompt to create reusable fields.': 'ใช้ {{variable}} ในพรอมต์เพื่อสร้างช่องข้อมูลที่นำกลับมาใช้ซ้ำได้',
  RENDERED_PREVIEW: 'ตัวอย่างหลังแทนค่าตัวแปร',
  'Task is explicit': 'ระบุงานชัดเจน',
  'Role or perspective defined': 'กำหนดบทบาทหรือมุมมอง',
  'Output format defined': 'กำหนดรูปแบบผลลัพธ์',
  'Constraints included': 'ระบุข้อจำกัด',
  'Context provided': 'ให้บริบทเพียงพอ',
  'Has variables/examples': 'มีตัวแปรหรือตัวอย่าง',

  ROLE: 'บทบาท',
  CONTEXT: 'บริบท',
  TASK: 'งาน',
  REQUIREMENTS: 'ข้อกำหนด',
  CONSTRAINTS: 'ข้อจำกัด',
  'OUTPUT FORMAT': 'รูปแบบผลลัพธ์',
  'COMPILE_TO_PROMPT + NEW_VERSION': 'สร้างพรอมต์ + เวอร์ชันใหม่',

  VERSION_HISTORY: 'ประวัติเวอร์ชัน',
  VERSION_DIFF: 'เปรียบเทียบเวอร์ชัน',
  VERSIONS: 'เวอร์ชัน',
  VERSION: 'เวอร์ชัน',
  BASE: 'ต้นฉบับ',
  COMPARE: 'เปรียบเทียบ',
  'No note': 'ไม่มีบันทึก',

  RUN_HISTORY: 'ประวัติการรัน',
  HISTORY: 'ประวัติ',
  META: 'ข้อมูลรัน',
  STREAMING: 'กำลังสตรีม',
  '● LIVE': '● สด',
  '★ BEST': '★ ดีที่สุด',
  'Streaming response...': 'กำลังรับผลลัพธ์...',
  RETRY: 'รันซ้ำ',
  MARK_BEST: 'ทำเครื่องหมายว่าดีที่สุด',
  'Awaiting first token...': 'กำลังรอข้อมูลชุดแรก...',
  AWAITING_EXECUTION: 'รอการรัน',
  'Optional: paste a manual result; leave blank to execute the selected provider': 'ไม่บังคับ: วางผลลัพธ์ด้วยตนเอง หรือเว้นว่างเพื่อรันด้วยผู้ให้บริการที่เลือก',
  'STREAMING...': 'กำลังสตรีม...',
  EXECUTE_RUN: 'รันพรอมต์',
  'COMPARE:': 'เปรียบเทียบ:',
  OFF: 'ปิด',
  RUN_METADATA: 'ข้อมูลการรัน',
  Running: 'กำลังทำงาน',
  Excellent: 'ยอดเยี่ยม',
  Good: 'ดี',
  Average: 'ปานกลาง',
  'Needs Improvement': 'ควรปรับปรุง',
  Failed: 'ล้มเหลว',
  Ready: 'พร้อม',
  PROVIDER: 'ผู้ให้บริการ',
  MODEL: 'โมเดล',
  PROMPT_VER: 'เวอร์ชันพรอมต์',
  LATENCY: 'เวลาแฝง',
  TOKENS: 'โทเคน',
  COST: 'ค่าใช้จ่าย',
  TIMESTAMP: 'เวลา',
  NOTES_LOG: 'บันทึก',
  'MODEL NAME': 'ชื่อโมเดล',
  'OpenAI requests use the secure /api/ai/run server route. Sign in via CLOUD first; API keys are never stored in this browser UI.': 'คำขอ OpenAI ใช้เส้นทางเซิร์ฟเวอร์ /api/ai/run ที่ปลอดภัย กรุณาเข้าสู่ระบบผ่านคลาวด์ก่อน และระบบจะไม่เก็บ API key ไว้ในเบราว์เซอร์',

  EDIT_PROTOCOL_ENTRY: 'แก้ไขพรอมต์',
  NEW_PROTOCOL_ENTRY: 'สร้างพรอมต์ใหม่',
  TITLE: 'ชื่อ',
  DESCRIPTION: 'คำอธิบาย',
  'DATA_PAYLOAD (PROMPT)': 'เนื้อหาพรอมต์',
  'TAGS (COMMA SEPARATED)': 'แท็ก (คั่นด้วยเครื่องหมายจุลภาค)',
  'COLLECTIONS (COMMA SEPARATED)': 'คอลเลกชัน (คั่นด้วยเครื่องหมายจุลภาค)',
  'PREVIEW TYPE': 'ประเภทตัวอย่าง',
  'TEXT / CODE': 'ข้อความ / โค้ด',
  'IMAGE RENDER': 'รูปภาพ',
  EXAMPLE_CODE_OUTPUT: 'ตัวอย่างผลลัพธ์โค้ด',
  IMAGE_URL_SOURCE: 'URL รูปภาพ',
  'UPDATE_PROTOCOL + VERSION': 'อัปเดตพรอมต์ + สร้างเวอร์ชัน',
  SAVE_PROTOCOL: 'บันทึกพรอมต์',

  CLOUD_ON: 'คลาวด์: เชื่อมต่อแล้ว',
  CLOUD: 'คลาวด์',
  LOCAL: 'ในเครื่อง',
  SUPABASE_SYNC: 'ซิงก์ Supabase',
  'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable cloud sync.': 'ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY เพื่อเปิดใช้การซิงก์คลาวด์',
  EMAIL: 'อีเมล',
  SEND_MAGIC_LINK: 'ส่งลิงก์เข้าสู่ระบบ',
  PUSH_CLOUD: 'อัปโหลดขึ้นคลาวด์',
  PULL_CLOUD: 'ดึงข้อมูลจากคลาวด์',
  SIGN_OUT: 'ออกจากระบบ',
  IDLE: 'พร้อมใช้งาน',
  LOCAL_ONLY: 'ใช้งานเฉพาะในเครื่อง',
  NO_CLOUD_BACKUP: 'ไม่พบข้อมูลสำรองบนคลาวด์',
  MAGIC_LINK: 'ลิงก์เข้าสู่ระบบ',
  PUSH: 'อัปโหลด',
  PULL: 'ดาวน์โหลด',
  SIGN_OUT_STATUS: 'ออกจากระบบ',

  Local: 'ในเครื่อง',
  'Simulated Model': 'โมเดลจำลอง',
  'Local Simulation': 'จำลองในเครื่อง',
  'OpenAI Backend': 'OpenAI ผ่านเซิร์ฟเวอร์',
});

const THAI_PATTERNS = Object.freeze([
  [/^Trash \((\d+)\)$/, (_, count) => `ถังขยะ (${count})`],
  [/^Run #(\d+|---)$/, (_, number) => `รัน #${number}`],
  [/^RUN #(\d+)$/, (_, number) => `รัน #${number}`],
  [/^RUN (\d+)$/, (_, count) => `รัน ${count}`],
  [/^COPY (\d+)$/, (_, count) => `คัดลอก ${count}`],
  [/^RUNS (\d+)$/, (_, count) => `รัน ${count}`],
  [/^COPIES (\d+)$/, (_, count) => `คัดลอก ${count}`],
  [/^RESULTS (\d+)$/, (_, count) => `ผลลัพธ์ ${count}`],
  [/^VERSIONS (\d+)$/, (_, count) => `เวอร์ชัน ${count}`],
  [/^VARIABLES (\d+)$/, (_, count) => `ตัวแปร ${count}`],
  [/^PROMPT_HEALTH (\d+)\/(\d+)$/, (_, score, max) => `คุณภาพพรอมต์ ${score}/${max}`],
  [/^HEALTH (\d+)\/(\d+)$/, (_, score, max) => `คุณภาพ ${score}/${max}`],
  [/^(\d+) chars$/, (_, count) => `${count} ตัวอักษร`],
  [/^Deleted (.+)$/, (_, date) => `ลบเมื่อ ${date}`],
  [/^PUSH\.\.\.$/, () => 'กำลังอัปโหลด...'],
  [/^PULL\.\.\.$/, () => 'กำลังดาวน์โหลด...'],
  [/^MAGIC_LINK\.\.\.$/, () => 'กำลังส่งลิงก์เข้าสู่ระบบ...'],
  [/^SIGN_OUT\.\.\.$/, () => 'กำลังออกจากระบบ...'],
  [/^PUSH_OK$/, () => 'อัปโหลดขึ้นคลาวด์แล้ว'],
  [/^PULL_OK$/, () => 'ดึงข้อมูลจากคลาวด์แล้ว'],
  [/^MAGIC_LINK_OK$/, () => 'ส่งลิงก์เข้าสู่ระบบแล้ว'],
  [/^SIGN_OUT_OK$/, () => 'ออกจากระบบแล้ว'],
]);

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}

function interpolate(template, params = {}) {
  return String(template).replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : full
  ));
}

export function translate(language, text, params = {}) {
  const lang = normalizeLanguage(language);
  const source = String(text ?? '');
  if (lang === 'en') return interpolate(source, params);

  const direct = Object.prototype.hasOwnProperty.call(THAI_TEXT, source) ? THAI_TEXT[source] : null;
  if (direct != null) return interpolate(direct, params);

  const rendered = interpolate(source, params);
  for (const [pattern, replacer] of THAI_PATTERNS) {
    if (pattern.test(rendered)) return rendered.replace(pattern, replacer);
  }
  return rendered;
}

export function hasTranslation(text) {
  const source = String(text ?? '');
  if (Object.prototype.hasOwnProperty.call(THAI_TEXT, source)) return true;
  return THAI_PATTERNS.some(([pattern]) => pattern.test(source));
}

export function getThaiDictionary() {
  return THAI_TEXT;
}
