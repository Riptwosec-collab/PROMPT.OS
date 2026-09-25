export const THAI_VARIABLE_LABELS = Object.freeze({
  language: 'ภาษาผลลัพธ์',
  tone: 'โทนภาษา',
  topic: 'หัวข้อ',
  objectives: 'เป้าหมายการวิจัย',
  claim: 'ข้อกล่าวอ้าง',
  article: 'บทความ',
  paper: 'งานวิจัย',
  sources: 'แหล่งข้อมูล',
  technology: 'Technology / Framework',
  code: 'โค้ด',
  expected_behavior: 'พฤติกรรมที่คาดหวัง',
  actual_behavior: 'พฤติกรรมที่เกิดจริง',
  error: 'Error / Stack trace',
  test_framework: 'Testing framework',
  optimization_goal: 'เป้าหมายการปรับปรุง',
  requirement: 'Requirement',
  application: 'Application',
  requirements: 'ข้อกำหนด',
  system: 'ระบบ',
  content: 'เนื้อหา',
  schema: 'Schema',
  columns: 'คอลัมน์',
  text: 'ข้อความ',
  input: 'ข้อมูลนำเข้า',
  categories: 'หมวดหมู่ที่อนุญาต',
  question: 'คำถาม',
  audience: 'กลุ่มเป้าหมาย',
  length: 'ความยาวเป้าหมาย',
  primary_keyword: 'Keyword หลัก',
  secondary_keywords: 'Keyword รอง',
  count: 'จำนวน',
  platform: 'แพลตฟอร์ม',
  transcript: 'Transcript / ข้อความถอดเสียง',
  slides: 'จำนวนสไลด์',
  subject: 'หัวข้อเรียน',
  level: 'ระดับปัจจุบัน',
  goal: 'เป้าหมาย',
  difficulty: 'ระดับความยาก',
  question_types: 'รูปแบบคำถาม',
  context: 'บริบท',
  incident: 'อาการ / Incident',
  logs: 'Log / หลักฐาน',
  symptoms: 'อาการที่พบ',
  show_output: 'ผลลัพธ์ show command',
  environment: 'สภาพแวดล้อม',
  traffic_flow: 'Traffic flow',
  acl_or_rules: 'ACL / Rules',
  vpn_type: 'ประเภท VPN',
  alert: 'Security alert',
  evidence: 'หลักฐาน',
  email_content: 'เนื้อหาอีเมล',
  headers: 'Email headers',
  pipeline: 'Pipeline / Job ที่ล้มเหลว',
  recent_changes: 'การเปลี่ยนแปลงล่าสุด',
  change_summary: 'สรุปการเปลี่ยนแปลง',
  test_evidence: 'หลักฐานการทดสอบ',
  deployment_plan: 'แผน Deploy',
  rollback_plan: 'แผน Rollback',
  request: 'Request',
  response: 'Response',
  query: 'SQL Query',
  execution_context: 'Execution context',
  data_description: 'คำอธิบายข้อมูล',
  sample_data: 'ตัวอย่างข้อมูล',
  metric: 'Metric / KPI',
  time_range: 'ช่วงเวลา',
  data: 'ข้อมูล',
  evaluation_criteria: 'เกณฑ์ประเมิน',
  options: 'ตัวเลือก',
  constraints: 'ข้อจำกัด',
  timeline: 'Timeline',
  impact: 'ผลกระทบ',
  actions: 'Actions',
  destination: 'จุดหมาย',
  dates: 'วันเดินทาง',
  preferences: 'ความชอบ',
  company: 'บริษัท',
  research_goal: 'เป้าหมายการวิจัย',
  certification: 'Certification',
  current_level: 'ระดับปัจจุบัน',
  exam_date: 'วันสอบ',
  time_available: 'เวลาที่มี',
});

function humanize(name = '') {
  return String(name).replace(/_/g, ' ').trim();
}

export function thaiLabelForVariable(name = '') {
  return THAI_VARIABLE_LABELS[name] || `ข้อมูล: ${humanize(name)}`;
}

export function thaiHelpForVariable(name = '', explicitGuide = '') {
  if (String(explicitGuide || '').trim()) return String(explicitGuide).trim();
  if (name === 'language') return 'เลือกภาษาที่ต้องการให้ AI ใช้ตอบผลลัพธ์';
  if (name === 'tone') return 'เลือกโทนภาษาที่เหมาะกับงานและผู้รับ';
  return `กรอก ${thaiLabelForVariable(name)} ให้ครบและตรงกับงานที่ต้องการ`;
}

export function thaiPlaceholderForVariable(name = '') {
  if (name === 'logs' || name === 'show_output') return 'วาง log หรือ output ที่เกี่ยวข้องโดยไม่ตัดบรรทัดสำคัญ';
  if (name === 'code') return 'วางโค้ดส่วนที่ต้องการวิเคราะห์';
  if (name === 'sources') return 'วางแหล่งข้อมูล ลิงก์ หรือข้อความอ้างอิงที่มีอยู่จริง';
  if (name === 'topic') return 'เช่น Zero Trust, VLAN trunk, customer churn';
  return '';
}
