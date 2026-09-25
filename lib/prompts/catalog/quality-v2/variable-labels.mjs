const LABELS = {
  language: ['ภาษาผลลัพธ์', 'เลือกภาษาที่ต้องการให้ AI ตอบ', 'เลือกภาษา'],
  topic: ['หัวข้อ', 'กรอกหัวข้อที่ต้องการให้วิเคราะห์หรือสร้างเนื้อหา', 'ตัวอย่าง: Zero Trust Network'],
  context: ['บริบท', 'ใส่ข้อมูลแวดล้อมที่ช่วยให้คำตอบตรงกับงานจริงมากขึ้น', 'อธิบายบริบทที่เกี่ยวข้อง'],
  goal: ['เป้าหมาย', 'ระบุผลลัพธ์ที่ต้องการให้ชัดเจน', 'ตัวอย่าง: หา root cause และ next action'],
  requirements: ['Requirements', 'วางข้อกำหนด เงื่อนไข หรือ acceptance criteria ที่ต้องยึดตาม', 'วาง requirements ที่นี่'],
  code: ['โค้ด', 'วางโค้ดที่ต้องการให้ตรวจ วิเคราะห์ หรือแก้ไข', 'วาง source code ที่นี่'],
  logs: ['Log / หลักฐาน', 'วาง log, error message หรือ show command ที่เกี่ยวข้องโดยไม่ตัดบรรทัดสำคัญ', 'วาง log หรือ command output ที่นี่'],
  sources: ['แหล่งข้อมูล', 'วางแหล่งข้อมูลหรือข้อความอ้างอิงที่ต้องใช้ในการวิเคราะห์', 'วาง source/link/ข้อความอ้างอิง'],
  data: ['ข้อมูล', 'วางข้อมูลที่ต้องการให้วิเคราะห์ โดยเก็บชื่อคอลัมน์และหน่วยให้ครบ', 'วางข้อมูลหรือตัวอย่างข้อมูล'],
  schema: ['Schema', 'วางโครงสร้างข้อมูล ตาราง หรือ field ที่เกี่ยวข้อง', 'วาง schema ที่นี่'],
  content: ['เนื้อหา', 'วางเนื้อหาต้นฉบับที่ต้องการให้ประมวลผล', 'วางเนื้อหาที่นี่'],
  article: ['บทความ', 'วางบทความฉบับเต็มหรือส่วนที่ต้องการวิเคราะห์', 'วางบทความที่นี่'],
  paper: ['งานวิจัย', 'วางเนื้อหาหรือส่วนสำคัญของ paper ที่ต้องการวิเคราะห์', 'วาง paper/abstract/methodology ที่นี่'],
  transcript: ['Transcript', 'วางข้อความถอดเสียงที่ต้องการสรุปหรือวิเคราะห์', 'วาง transcript ที่นี่'],
  tone: ['โทนภาษา', 'เลือกโทนของผลลัพธ์ให้เหมาะกับผู้รับสาร', 'เลือกโทน'],
  count: ['จำนวน', 'ระบุจำนวนรายการที่ต้องการ', 'ตัวอย่าง: 10'],
  slides: ['จำนวนสไลด์', 'ระบุจำนวนสไลด์ที่ต้องการ', 'ตัวอย่าง: 8'],
};

export const THAI_VARIABLE_LABELS = Object.freeze(
  Object.fromEntries(Object.entries(LABELS).map(([key, [labelTh, helpTh, placeholderTh]]) => [key, Object.freeze({ labelTh, helpTh, placeholderTh })])),
);

function humanize(name = '') {
  return String(name).replace(/[_-]+/g, ' ').trim();
}

export function thaiVariableMetadata(name = '') {
  const key = String(name).trim();
  const known = THAI_VARIABLE_LABELS[key];
  if (known) return { ...known };
  const label = humanize(key) || 'ข้อมูล';
  return {
    labelTh: label,
    helpTh: `กรอก ${label} ที่จำเป็นสำหรับพรอมต์นี้ให้ครบถ้วน`,
    placeholderTh: `กรอก ${label}`,
  };
}
