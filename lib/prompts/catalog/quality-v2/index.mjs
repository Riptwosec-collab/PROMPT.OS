import { CORE_QUALITY_METADATA } from './metadata-core.mjs';
import { RESEARCHED_QUALITY_METADATA_A } from './metadata-researched-a.mjs';
import { RESEARCHED_QUALITY_METADATA_B } from './metadata-researched-b.mjs';
import { NEW_PROMPT_QUALITY_METADATA } from './new-prompts.mjs';
import {
  thaiHelpForVariable,
  thaiLabelForVariable,
  thaiPlaceholderForVariable,
} from './variable-labels.mjs';

const THAI_TEXT_RE = /[ก-๙]/;

const EXAMPLE_TEXT_VALUES = Object.freeze({
  topic: 'วิเคราะห์สาเหตุที่ผู้ใช้ VLAN 50 เข้า Internet ไม่ได้หลังเปลี่ยน uplink',
  objectives: 'หาสาเหตุจากหลักฐาน แยก failure domain และเสนอขั้นตอนตรวจสอบถัดไป',
  claim: 'ระบบใหม่ช่วยลดเวลาแก้ incident ลง 30%',
  article: 'บริษัทประกาศปรับกระบวนการบริการลูกค้าและรายงานผลลัพธ์หลังใช้งาน 3 เดือน',
  paper: 'งานวิจัยศึกษาผลของ automation ต่อเวลาแก้ incident โดยเปรียบเทียบก่อนและหลังใช้งาน',
  sources: 'Source A: รายงานเหตุการณ์ภายใน\nSource B: เอกสาร vendor\nSource C: ผลทดสอบจากระบบจริง',
  technology: 'Next.js 16 + Cloudflare Workers',
  code: 'async function loadData() { return fetch("/api/data").then(r => r.json()); }',
  expected_behavior: 'ผู้ใช้กด Save แล้วข้อมูลยังอยู่หลัง refresh และไม่สร้างรายการซ้ำ',
  actual_behavior: 'กด Save แล้วหน้าจอเปลี่ยน แต่ refresh แล้วข้อมูลหาย',
  error: 'TypeError: Cannot read properties of undefined at saveResult()',
  test_framework: 'Node test runner',
  optimization_goal: 'ลด latency โดยไม่เปลี่ยนผลลัพธ์หรือ public API',
  requirement: 'รองรับ mobile, keyboard navigation และเก็บข้อมูลแบบ local-first',
  application: 'Prompt management web application สำหรับทีม IT',
  requirements: 'ต้องใช้งานบนมือถือได้, ไม่ทำข้อมูลเดิมหาย, มี rollback path',
  system: 'ระบบ Prompt.OS บน Next.js และ Cloudflare Workers',
  content: 'สรุป incident พร้อมหลักฐาน root cause และ next action สำหรับทีม IT',
  schema: 'users(id, email), runs(id, prompt_id, status, output, created_at)',
  columns: 'date, team, tickets_opened, tickets_resolved, sla_minutes',
  text: 'ผู้ใช้แจ้งว่าเชื่อมต่อ Wi‑Fi ได้แต่เปิดเว็บไซต์ภายนอกไม่ได้หลัง 10:30',
  input: 'Ticket INC-1042: VPN เชื่อมต่อสำเร็จแต่เข้า subnet 10.20.0.0/16 ไม่ได้',
  categories: 'Network, Security, Application, Access',
  question: 'หลักฐานใดสนับสนุน root cause และควรตรวจอะไรต่อเป็นลำดับแรก',
  audience: 'IT support และ network engineer',
  primary_keyword: 'network troubleshooting',
  secondary_keywords: 'VLAN, routing, packet loss',
  platform: 'LinkedIn',
  transcript: '09:05 ทีมแจ้งระบบช้า\n09:12 พบ packet loss\n09:20 เปลี่ยนเส้นทางและอาการกลับปกติ',
  subject: 'Cisco CCNA network fundamentals',
  level: 'พื้นฐาน',
  goal: 'เข้าใจแนวคิดและสามารถนำไปตรวจปัญหาในงานจริงได้',
  difficulty: 'Intermediate',
  question_types: 'Multiple choice, troubleshooting scenario',
  context: 'Production environment มีผู้ใช้หลายสาขาและต้องลด downtime ให้ต่ำที่สุด',
  incident: 'ผู้ใช้ VLAN 50 เข้า Internet ไม่ได้ แต่ยัง ping default gateway ได้',
  logs: 'Gi1/0/10 connected vlan 50\nVlan50 up up\n0 input errors\nDefault route present',
  symptoms: 'เข้า internal service ได้ แต่ Internet timeout และ DNS query ไม่ตอบ',
  show_output: 'show ip int brief: Vlan50 up/up\nshow ip route: default via 10.0.0.1',
  environment: 'Cisco Catalyst access/core, 802.1Q trunk, DHCP และ upstream firewall',
  traffic_flow: 'Client VLAN50 -> Core SVI -> Firewall -> Internet',
  acl_or_rules: 'permit ip 10.50.0.0/24 any\ndeny ip any any log',
  vpn_type: 'Site-to-Site IPsec',
  alert: 'Multiple failed sign-ins followed by successful login from a new location',
  evidence: 'Sign-in logs, source IP, device ID, timestamp และ MFA result',
  email_content: 'บัญชีของคุณจะถูกระงับ กรุณายืนยันรหัสผ่านผ่านลิงก์นี้ภายใน 24 ชั่วโมง',
  headers: 'From: security@example.test\nReply-To: verify@other-domain.test\nSPF: fail',
  pipeline: 'build-and-deploy / test step fails after dependency update',
  recent_changes: 'อัปเดต dependency และเปลี่ยน environment variable เมื่อ 30 นาทีที่ผ่านมา',
  change_summary: 'เพิ่ม History และ Saved Results โดยคง API execution เดิม',
  test_evidence: 'Unit tests ผ่าน 283 tests และ production build ผ่าน',
  deployment_plan: 'Deploy ผ่าน CI หลัง merge และตรวจ health endpoint ก่อนเปิด traffic เต็ม',
  rollback_plan: 'Rollback ไป previous worker version และคง IndexedDB schema แบบ backward-readable',
  request: 'GET /api/runs?status=failed&limit=20',
  response: 'HTTP 500 {"error":"database timeout"}',
  query: 'SELECT status, COUNT(*) FROM runs GROUP BY status ORDER BY COUNT(*) DESC;',
  execution_context: 'PostgreSQL production replica, ตาราง runs ประมาณ 2 ล้านแถว',
  data_description: 'ข้อมูลรายวันของจำนวน ticket, SLA, team และ resolution time',
  sample_data: '2026-10-01,Network,42,39,28\n2026-10-02,Network,51,44,35',
  metric: 'SLA resolution time เพิ่มจาก 28 เป็น 35 นาที',
  time_range: 'ย้อนหลัง 30 วัน เทียบกับ 30 วันก่อนหน้า',
  data: 'Week1: 120 runs / 8 failed\nWeek2: 145 runs / 5 failed\nWeek3: 168 runs / 4 failed',
  evaluation_criteria: 'ความถูกต้อง, ความเสี่ยง, effort, rollback complexity',
  options: 'Option A: incremental rollout\nOption B: big-bang migration',
  constraints: 'ห้าม downtime เกิน 5 นาที และต้อง rollback ได้โดยไม่สูญเสียข้อมูล',
  timeline: '10:02 alert เริ่ม\n10:07 ยืนยันผลกระทบ\n10:15 isolate service\n10:31 service recovered',
  impact: 'ผู้ใช้ประมาณ 120 คนเข้า application ไม่ได้ 29 นาที',
  actions: 'ตรวจ root cause, เพิ่ม regression test, ปรับ alert และอัปเดต runbook',
  destination: 'เชียงใหม่ ประเทศไทย',
  dates: '2026-11-14 ถึง 2026-11-16',
  preferences: 'เดินทางไม่เร่งรีบ เน้นอาหารท้องถิ่นและที่เที่ยวธรรมชาติ งบปานกลาง',
  company: 'บริษัทจดทะเบียนตัวอย่างในอุตสาหกรรม consumer technology',
  research_goal: 'สรุปธุรกิจ ตัวขับเคลื่อนรายได้ ความเสี่ยง และประเด็นที่ต้องติดตามจากข้อมูลที่ให้มา',
  certification: 'Cisco CCNA',
  current_level: 'เข้าใจ VLAN และ basic routing แต่ยังไม่มั่นใจ STP/OSPF troubleshooting',
  exam_date: '2026-12-15',
  time_available: 'วันละ 60 นาที สัปดาห์ละ 5 วัน',
});

function combineMetadataMaps(...maps) {
  const combined = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map || {})) {
      if (Object.hasOwn(combined, key)) throw new Error(`Duplicate Quality V2 metadata key: ${key}`);
      combined[key] = value;
    }
  }
  return Object.freeze(combined);
}

function normalizeThaiExample(value = '') {
  const example = String(value || '').trim();
  if (!example || THAI_TEXT_RE.test(example)) return example;
  return `ตัวอย่าง:\n${example}`;
}

function normalizeThaiLabel(value = '') {
  const label = String(value || '').trim();
  if (!label || THAI_TEXT_RE.test(label)) return label;
  return `ข้อมูล: ${label}`;
}

function hasValue(value) {
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
}

function configuredDefault(field = {}) {
  if (Object.hasOwn(field, 'default') && hasValue(field.default)) return structuredClone(field.default);
  if (Object.hasOwn(field, 'defaultValue') && hasValue(field.defaultValue)) return structuredClone(field.defaultValue);
  return undefined;
}

function exampleValue(name, field = {}) {
  const explicitDefault = configuredDefault(field);
  if (explicitDefault !== undefined) return explicitDefault;

  const options = Array.isArray(field.options) ? field.options.map((value) => String(value)) : [];
  if (field.type === 'multi-select') return options.length ? [options[0]] : [];
  if (['select', 'language', 'tone'].includes(field.type)) {
    if (name === 'language' && options.includes('Thai')) return 'Thai';
    return options[0] || (name === 'language' ? 'Thai' : 'Default');
  }
  if (field.type === 'number') return '3';
  if (field.type === 'boolean' || field.type === 'toggle') return true;
  if (field.type === 'date') return '2026-10-03';
  if (field.type === 'url') return 'https://example.com/source';
  if (field.type === 'file') return { name: 'example-input.txt' };

  return EXAMPLE_TEXT_VALUES[name] || `ตัวอย่างข้อมูลสำหรับ ${thaiLabelForVariable(name)}`;
}

function buildExampleValues(variableConfig = {}) {
  return Object.fromEntries(
    Object.entries(variableConfig || {}).map(([name, field = {}]) => [name, exampleValue(name, field)]),
  );
}

export const QUALITY_V2_METADATA = combineMetadataMaps(
  CORE_QUALITY_METADATA,
  RESEARCHED_QUALITY_METADATA_A,
  RESEARCHED_QUALITY_METADATA_B,
  NEW_PROMPT_QUALITY_METADATA,
);

export function enrichBuiltInPrompt(prompt = {}, metadataMap = QUALITY_V2_METADATA) {
  const metadata = metadataMap?.[prompt.name] || metadataMap?.[prompt.id] || {};
  const inputGuideTh = metadata.inputGuideTh || prompt.inputGuideTh || {};
  const variableConfig = Object.fromEntries(
    Object.entries(prompt.variableConfig || {}).map(([name, field = {}]) => [name, {
      ...field,
      labelTh: normalizeThaiLabel(field.labelTh || thaiLabelForVariable(name)),
      helpTh: field.helpTh || inputGuideTh?.[name] || thaiHelpForVariable(name),
      placeholderTh: field.placeholderTh ?? thaiPlaceholderForVariable(name),
    }]),
  );

  const exampleInputTh = normalizeThaiExample(metadata.exampleInputTh ?? prompt.exampleInputTh ?? '');
  const exampleValues = structuredClone(metadata.exampleValues ?? prompt.exampleValues ?? buildExampleValues(variableConfig));

  return {
    ...prompt,
    ...metadata,
    exampleInputTh,
    exampleValues,
    inputGuideTh,
    variableConfig,
  };
}

export function enrichBuiltInCatalog(prompts = [], metadataMap = QUALITY_V2_METADATA) {
  return (Array.isArray(prompts) ? prompts : []).map((prompt) => {
    if (!(prompt?.catalogManaged === true || String(prompt?.id || '').startsWith('ai-lib-'))) return prompt;
    return enrichBuiltInPrompt(prompt, metadataMap);
  });
}
