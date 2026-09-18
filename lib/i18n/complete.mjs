import { normalizeLanguage, translate as baseTranslate } from './runtime.mjs';

const EXTRA_THAI_TEXT = Object.freeze({
  HOME: 'หน้าแรก',
  LIBRARY: 'คลังพรอมต์',
  WORKSPACES: 'พื้นที่ทำงาน',
  'EVALUATION LAB': 'ห้องทดสอบพรอมต์',
  'AI IMPROVE': 'ปรับปรุงพรอมต์ด้วย AI',
  'CLOUD & BACKUPS': 'คลาวด์และข้อมูลสำรอง',
  SETTINGS: 'การตั้งค่า',
  'V5 CONTROL PLANE': 'ศูนย์ควบคุม V5',
  ACTIVE_MODULE: 'โมดูลที่ใช้งาน',
  COMMAND: 'คำสั่ง',
  'CLOUD LIVE': 'คลาวด์ออนไลน์',
  SYNCING: 'กำลังซิงก์',
  OFFLINE: 'ออฟไลน์',
  'SYNC ERROR': 'ซิงก์ผิดพลาด',
  RECOVERING: 'กำลังกู้คืน',
  'NOT SYNCED': 'ยังไม่ได้ซิงก์',
  'V5 PREVIEW': 'ตัวอย่าง V5',
  'V5 MODULE': 'โมดูล V5',
  'This module is staged behind the V5 rollout plan. The existing prompt library remains available from Library while this module is completed.': 'โมดูลนี้อยู่ระหว่างการเปิดใช้งานตามแผน V5 ระหว่างนี้ยังสามารถใช้คลังพรอมต์เดิมได้จากหน้า คลังพรอมต์',
  'Language switcher': 'ตัวเลือกภาษา',

  'Mission Control': 'ศูนย์ควบคุม',
  'Neo Mission Control': 'ศูนย์ควบคุม Neo',
  'Command your prompt workspace.': 'ควบคุมพื้นที่ทำงานพรอมต์ของคุณ',
  'Jump back into recent work, discover focused packs, and move through Prompt.OS from one command surface.': 'กลับไปทำงานล่าสุด ค้นพบชุดพรอมต์ที่ตรงเป้าหมาย และใช้งาน Prompt.OS จากหน้าควบคุมเดียว',
  'AI Usage Pulse': 'ภาพรวมการใช้งาน AI',
  Runs: 'จำนวนรัน',
  Copies: 'จำนวนคัดลอก',
  'Featured Prompt Packs': 'ชุดพรอมต์แนะนำ',
  Activity: 'กิจกรรม',
  'Search anything': 'ค้นหาทุกอย่าง',
  'Search prompts, commands, workflows': 'ค้นหาพรอมต์ คำสั่ง และเวิร์กโฟลว์',
  Create: 'สร้าง',
  More: 'เพิ่มเติม',
  CREATE: 'สร้าง',
  ACTIVITY: 'กิจกรรม',
  MORE: 'เพิ่มเติม',
  'New Workflow': 'เวิร์กโฟลว์ใหม่',
  'Import Prompt': 'นำเข้าพรอมต์',
  Close: 'ปิด',
  Dismiss: 'ปิดการแจ้งเตือน',
  'No matching commands': 'ไม่พบคำสั่งที่ตรงกัน',
  'Choose an action': 'เลือกการดำเนินการ',
  Unavailable: 'ยังไม่พร้อมใช้งาน',
  'Open full Library': 'เปิดคลังพรอมต์ทั้งหมด',
  'Command Palette': 'แผงคำสั่ง',
  'Esc to close': 'กด Esc เพื่อปิด',
  Notifications: 'การแจ้งเตือน',
  'Recent real activity': 'กิจกรรมจริงล่าสุด',
  'Recorded prompt activity': 'กิจกรรมพรอมต์ที่บันทึกไว้',
  'Reference-only collections': 'คอลเลกชันที่อ้างอิงพรอมต์เท่านั้น',
  'Cloud / Sync': 'คลาวด์ / ซิงก์',
  'Live status': 'สถานะปัจจุบัน',
  'Recorded recent use': 'การใช้งานล่าสุดที่บันทึกไว้',
  'Computed from your prompt records': 'คำนวณจากข้อมูลพรอมต์ของคุณ',
  'Recently Added': 'เพิ่มล่าสุด',
  'Has Variables': 'มีตัวแปร',
  'Control plane': 'ศูนย์ควบคุม',
  'Expand sidebar': 'ขยายแถบด้านข้าง',
  'Collapse sidebar': 'ย่อแถบด้านข้าง',
  navigation: 'การนำทาง',
  command: 'คำสั่ง',
  prompt: 'พรอมต์',
  '/ 100 average': '/ 100 ค่าเฉลี่ย',

  'Deep Research Assistant': 'ผู้ช่วยวิจัยเชิงลึก',
  'AI Fact Checker': 'ผู้ตรวจสอบข้อเท็จจริงด้วย AI',
  'Article Analyzer': 'ตัววิเคราะห์บทความ',
  'Research Paper Analyzer': 'ตัววิเคราะห์งานวิจัย',
  'Source Comparator': 'ตัวเปรียบเทียบแหล่งข้อมูล',
  'Professional Code Reviewer': 'ผู้ตรวจสอบโค้ดระดับมืออาชีพ',
  'Bug Hunter': 'นักล่าบั๊ก',
  'Unit Test Generator': 'ตัวสร้าง Unit Test',
  'Code Optimizer': 'ตัวปรับปรุงประสิทธิภาพโค้ด',
  'Time Complexity Analyzer': 'ตัววิเคราะห์ Time Complexity',
  'Regex Generator': 'ตัวสร้าง Regex',
  'Docker Generator': 'ตัวสร้าง Docker',
  'REST API Designer': 'ผู้ออกแบบ REST API',
  'Database Schema Designer': 'ผู้ออกแบบโครงสร้างฐานข้อมูล',
  'JSON Data Extractor': 'ตัวดึงข้อมูล JSON',
  'Table Data Extractor': 'ตัวดึงข้อมูลเป็นตาราง',
  'Sentiment Analyzer': 'ตัววิเคราะห์ความรู้สึก',
  'AI Data Classifier': 'ตัวจำแนกข้อมูลด้วย AI',
  'Image Object Analyzer': 'ตัววิเคราะห์วัตถุในภาพ',
  'Image to JSON': 'แปลงภาพเป็น JSON',
  'Video Q&A': 'ถาม-ตอบจากวิดีโอ',
  'Audio Transcriber': 'ตัวถอดเสียง',
  'Blog Generator': 'ตัวสร้างบทความบล็อก',
  'SEO Content Writer': 'นักเขียนคอนเทนต์ SEO',
  'Social Content Generator': 'ตัวสร้างคอนเทนต์โซเชียล',
  'Meeting Summarizer': 'ตัวสรุปการประชุม',
  'Action Item Extractor': 'ตัวดึงรายการงานที่ต้องทำ',
  'Presentation Builder': 'ตัวสร้างโครงงานนำเสนอ',
  'Personal AI Tutor': 'ติวเตอร์ AI ส่วนตัว',
  'Quiz Generator': 'ตัวสร้างแบบทดสอบ',

  'Research a topic systematically with evidence, competing viewpoints, limitations, and uncertainty.': 'วิจัยหัวข้ออย่างเป็นระบบ พร้อมหลักฐาน มุมมองที่แตกต่าง ข้อจำกัด และความไม่แน่นอน',
  'Analyze claims, evidence, missing context, and uncertainty.': 'วิเคราะห์ข้อกล่าวอ้าง หลักฐาน บริบทที่ขาดหาย และความไม่แน่นอน',
  'Analyze the arguments, evidence, assumptions, bias, and missing information in an article.': 'วิเคราะห์ข้อโต้แย้ง หลักฐาน สมมติฐาน อคติ และข้อมูลที่ขาดหายของบทความ',
  'Analyze academic papers, methodology, data, findings, and limitations.': 'วิเคราะห์งานวิชาการ ระเบียบวิธี ข้อมูล ผลการศึกษา และข้อจำกัด',
  'Compare multiple information sources and identify agreements, disagreements, and reliability indicators.': 'เปรียบเทียบหลายแหล่งข้อมูล พร้อมหาจุดที่ตรงกัน ขัดแย้งกัน และสัญญาณความน่าเชื่อถือ',
  'Review source code for bugs, security risks, performance, architecture, and maintainability.': 'ตรวจโค้ดเพื่อหาบั๊ก ความเสี่ยงด้านความปลอดภัย ประสิทธิภาพ สถาปัตยกรรม และความง่ายต่อการดูแล',
  'Diagnose software bugs and identify their root causes.': 'วิเคราะห์บั๊กของซอฟต์แวร์และหาสาเหตุราก',
  'Generate comprehensive unit tests including normal cases, edge cases, failures, and regressions.': 'สร้าง Unit Test ครอบคลุมกรณีปกติ ขอบเขต ข้อผิดพลาด และการถดถอย',
  'Optimize source code for performance, efficiency, and maintainability.': 'ปรับโค้ดให้มีประสิทธิภาพ ใช้ทรัพยากรดี และดูแลต่อได้ง่าย',
  'Analyze Big-O time and space complexity.': 'วิเคราะห์ความซับซ้อนด้านเวลาและหน่วยความจำแบบ Big-O',
  'Convert natural-language requirements into regular expressions.': 'แปลงความต้องการภาษาธรรมชาติเป็น Regular Expression',
  'Generate a production-ready Docker setup.': 'สร้างชุดตั้งค่า Docker ที่พร้อมใช้งานจริงใน Production',
  'Design production-ready REST APIs.': 'ออกแบบ REST API ที่พร้อมใช้งานจริงใน Production',
  'Design relational database schemas and SQL tables.': 'ออกแบบโครงสร้างฐานข้อมูลเชิงสัมพันธ์และตาราง SQL',
  'Extract structured information and return valid JSON.': 'ดึงข้อมูลแบบมีโครงสร้างและส่งคืน JSON ที่ถูกต้อง',
  'Convert unstructured content into structured tables.': 'แปลงข้อมูลที่ไม่มีโครงสร้างให้เป็นตารางที่มีโครงสร้าง',
  'Analyze sentiment, emotion, intent, and urgency from text.': 'วิเคราะห์ความรู้สึก อารมณ์ เจตนา และระดับความเร่งด่วนจากข้อความ',
  'Classify content into predefined categories and return structured JSON.': 'จำแนกข้อมูลตามหมวดที่กำหนดและส่งคืน JSON แบบมีโครงสร้าง',
  'Analyze objects, environments, text, and important details in images.': 'วิเคราะห์วัตถุ สภาพแวดล้อม ข้อความ และรายละเอียดสำคัญในภาพ',
  'Extract structured information from an image and return JSON.': 'ดึงข้อมูลแบบมีโครงสร้างจากภาพและส่งคืน JSON',
  'Analyze a video and answer questions with timestamp-based evidence.': 'วิเคราะห์วิดีโอและตอบคำถามโดยอ้างอิงหลักฐานตามเวลา',
  'Transcribe audio with speaker separation and timestamps.': 'ถอดเสียงโดยแยกผู้พูดและใส่เวลา',
  'Generate structured long-form blog content.': 'สร้างบทความบล็อกแบบยาวที่มีโครงสร้างชัดเจน',
  'Generate SEO-focused articles, metadata, structure, and FAQs.': 'สร้างบทความเน้น SEO พร้อม Metadata โครงสร้าง และ FAQ',
  'Generate social media content for different platforms and audiences.': 'สร้างคอนเทนต์โซเชียลสำหรับหลายแพลตฟอร์มและกลุ่มเป้าหมาย',
  'Summarize meetings, decisions, risks, and next steps.': 'สรุปการประชุม การตัดสินใจ ความเสี่ยง และขั้นตอนถัดไป',
  'Extract actionable tasks from meetings, documents, or notes.': 'ดึงงานที่นำไปปฏิบัติได้จากการประชุม เอกสาร หรือบันทึก',
  'Generate structured presentation outlines with speaker notes.': 'สร้างโครงงานนำเสนออย่างเป็นระบบพร้อม Speaker Notes',
  'Teach a subject interactively using explanations, examples, questions, and exercises.': 'สอนแบบโต้ตอบด้วยคำอธิบาย ตัวอย่าง คำถาม และแบบฝึกหัด',
  'Generate quizzes with answers and explanations.': 'สร้างแบบทดสอบพร้อมเฉลยและคำอธิบาย',

  'Structured research report with evidence, uncertainty, conclusion, and sources to verify': 'รายงานวิจัยแบบมีโครงสร้าง พร้อมหลักฐาน ความไม่แน่นอน ข้อสรุป และแหล่งข้อมูลที่ควรตรวจสอบ',
  'Structured fact-check report': 'รายงานตรวจสอบข้อเท็จจริงแบบมีโครงสร้าง',
  'Numbered article analysis': 'บทวิเคราะห์บทความแบบลำดับข้อ',
  'Structured academic paper analysis plus plain-language explanation': 'บทวิเคราะห์งานวิชาการแบบมีโครงสร้าง พร้อมคำอธิบายภาษาง่าย',
  'Source comparison table/report': 'ตารางหรือรายงานเปรียบเทียบแหล่งข้อมูล',
  'Issue-by-issue code review plus improved code': 'รีวิวโค้ดแยกตามประเด็น พร้อมโค้ดที่ปรับปรุงแล้ว',
  'Root-cause diagnostic report': 'รายงานวิเคราะห์สาเหตุราก',
  'Unit test suite with explanations': 'ชุด Unit Test พร้อมคำอธิบาย',
  'Optimization report plus improved code': 'รายงานการปรับประสิทธิภาพ พร้อมโค้ดที่ปรับแล้ว',
  'Big-O complexity report': 'รายงานความซับซ้อนแบบ Big-O',
  'Regex, explanation, examples, and escaped form': 'Regex พร้อมคำอธิบาย ตัวอย่าง และรูปแบบที่ Escape แล้ว',
  'Dockerfile / .dockerignore / compose / environment and run instructions': 'Dockerfile / .dockerignore / compose / environment และวิธีรัน',
  'REST API specification with example requests and responses': 'ข้อกำหนด REST API พร้อมตัวอย่าง Request และ Response',
  'Relational schema design plus SQL CREATE TABLE statements': 'แบบโครงสร้างฐานข้อมูลเชิงสัมพันธ์ พร้อมคำสั่ง SQL CREATE TABLE',
  'Valid JSON only': 'JSON ที่ถูกต้องเท่านั้น',
  Table: 'ตาราง',
  'Structured sentiment analysis': 'การวิเคราะห์ความรู้สึกแบบมีโครงสร้าง',
  'Structured visual analysis': 'การวิเคราะห์ภาพแบบมีโครงสร้าง',
  'Answer with timestamp-based evidence': 'คำตอบพร้อมหลักฐานอ้างอิงตามเวลา',
  'Timestamped speaker-separated transcript': 'บทถอดเสียงแยกผู้พูดพร้อมเวลา',
  'Long-form blog article': 'บทความบล็อกแบบยาว',
  'SEO article package with metadata, structure, FAQ, and links': 'ชุดบทความ SEO พร้อม Metadata โครงสร้าง FAQ และลิงก์',
  'Multiple social media posts': 'โพสต์โซเชียลหลายรายการ',
  'Structured meeting summary': 'สรุปการประชุมแบบมีโครงสร้าง',
  'Action-item table': 'ตารางรายการงานที่ต้องทำ',
  'Presentation outline with slide-by-slide speaker notes': 'โครงงานนำเสนอพร้อม Speaker Notes แยกตามสไลด์',
  'Interactive tutoring response with question and exercise': 'บทเรียนแบบโต้ตอบพร้อมคำถามและแบบฝึกหัด',
  'Quiz with answers and explanations': 'แบบทดสอบพร้อมเฉลยและคำอธิบาย',
});

const EXTRA_THAI_PATTERNS = Object.freeze([
  [/^REV (.+)$/, (_, value) => `รีวิชัน ${value}`],
  [/^(\d+) PENDING$/, (_, count) => `รอซิงก์ ${count} รายการ`],
  [/^SYNCED (.+)$/, (_, value) => `ซิงก์แล้ว ${value}`],
  [/^(\d+) prompt refs$/, (_, count) => `${count} การอ้างอิงพรอมต์`],
  [/^(\d+) analyzed$/, (_, count) => `วิเคราะห์แล้ว ${count} รายการ`],
  [/^last used (.+)$/, (_, value) => `ใช้ล่าสุด ${value}`],
]);

function interpolate(template, params = {}) {
  return String(template).replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : full
  ));
}

export function translateComplete(language, text, params = {}) {
  const lang = normalizeLanguage(language);
  const source = String(text ?? '');
  if (lang === 'en') return interpolate(source, params);

  const base = baseTranslate(lang, source, params);
  if (base !== interpolate(source, params)) return base;

  if (Object.prototype.hasOwnProperty.call(EXTRA_THAI_TEXT, source)) {
    return interpolate(EXTRA_THAI_TEXT[source], params);
  }

  const rendered = interpolate(source, params);
  for (const [pattern, replacer] of EXTRA_THAI_PATTERNS) {
    if (pattern.test(rendered)) return rendered.replace(pattern, replacer);
  }
  return rendered;
}

export function hasCompleteTranslation(text) {
  const source = String(text ?? '');
  if (baseTranslate('th', source) !== source) return true;
  if (Object.prototype.hasOwnProperty.call(EXTRA_THAI_TEXT, source)) return true;
  return EXTRA_THAI_PATTERNS.some(([pattern]) => pattern.test(source));
}

export function getSupplementalThaiDictionary() {
  return EXTRA_THAI_TEXT;
}