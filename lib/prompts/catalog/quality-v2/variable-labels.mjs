export const THAI_VARIABLE_LABELS = Object.freeze({
  language: 'ภาษาผลลัพธ์',
  tone: 'โทนภาษา',
  topic: 'หัวข้อ',
  goal: 'เป้าหมาย',
  context: 'บริบท',
  content: 'เนื้อหา',
  article: 'บทความ',
  paper: 'งานวิจัย',
  code: 'โค้ด',
  transcript: 'Transcript / ข้อความถอดเสียง',
  sources: 'แหล่งข้อมูล',
  schema: 'Schema',
  requirements: 'ข้อกำหนด',
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
  expected_behavior: 'พฤติกรรมที่คาดหวัง',
  query: 'SQL Query',
  execution_context: 'Execution context',
  data_description: 'คำอธิบายข้อมูล',
  sample_data: 'ตัวอย่างข้อมูล',
  metric: 'Metric / KPI',
  time_range: 'ช่วงเวลา',
  data: 'ข้อมูล',
  question: 'คำถาม',
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
  return THAI_VARIABLE_LABELS[name] || humanize(name);
}

export function thaiHelpForVariable(name = '', explicitGuide = '') {
  if (String(explicitGuide || '').trim()) return String(explicitGuide).trim();
  if (name === 'language') return 'เลือกภาษาที่ต้องการให้ AI ใช้ตอบผลลัพธ์';
  if (name === 'tone') return 'เลือกโทนภาษาที่เหมาะกับงานและผู้รับ';
  return `กรอกข้อมูลสำหรับ ${thaiLabelForVariable(name)} ให้ครบและตรงกับงานที่ต้องการ`;
}

export function thaiPlaceholderForVariable(name = '') {
  if (name === 'logs' || name === 'show_output') return 'วาง log หรือ output ที่เกี่ยวข้องโดยไม่ตัดบรรทัดสำคัญ';
  if (name === 'code') return 'วางโค้ดส่วนที่ต้องการวิเคราะห์';
  if (name === 'sources') return 'วางแหล่งข้อมูล ลิงก์ หรือข้อความอ้างอิงที่มีอยู่จริง';
  if (name === 'topic') return 'เช่น Zero Trust, VLAN trunk, customer churn';
  return '';
}
