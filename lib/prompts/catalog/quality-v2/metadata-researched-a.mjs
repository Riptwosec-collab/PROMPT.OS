function q(purposeTh, useCasesTh, expectedOutputTh, exampleInputTh) {
  return Object.freeze({ purposeTh, useCasesTh, expectedOutputTh, exampleInputTh });
}

export const RESEARCHED_PROMPT_QUALITY_V2_METADATA_A = Object.freeze({
  RESEARCH_QUESTION_REFINER: q(
    'ช่วยเปลี่ยนหัวข้อกว้างหรือคำถามที่คลุมเครือให้เป็น research question ที่เจาะจง ตรวจสอบได้ และสอดคล้องกับบริบท/ข้อจำกัดที่ผู้ใช้ให้มา',
    ['เตรียมหัวข้อก่อนทำวิจัย', 'ลด scope ที่กว้างเกินไป', 'สร้างคำถามย่อยสำหรับค้นหลักฐาน'],
    ['คำถามวิจัยที่ปรับแล้ว', 'ขอบเขตและนิยามสำคัญ', 'คำถามย่อยและเหตุผลของการปรับ'],
    'ตัวอย่าง: หัวข้อ = ผลกระทบของ AI ต่อ Helpdesk, บริบท = องค์กรขนาดกลางในไทย, ต้องการคำถามที่วัดผลได้',
  ),
  LITERATURE_SYNTHESIS_MATRIX: q(
    'ช่วยสังเคราะห์หลาย paper/source ลงเป็น matrix เพื่อเห็น methodology, findings, limitations และจุดที่งานต่าง ๆ สนับสนุนหรือขัดแย้งกัน',
    ['ทำ literature review', 'เปรียบเทียบ paper หลายฉบับ', 'หา pattern ก่อนเขียนบทสรุป'],
    ['ตาราง synthesis matrix', 'themes ที่พบร่วมกัน', 'ความขัดแย้ง ช่องว่าง และข้อจำกัดของหลักฐาน'],
    'ตัวอย่าง: แนบสรุป paper 5 ฉบับเรื่อง Zero Trust และต้องการเทียบ methodology, sample, findings และ limitations',
  ),
  CLAIM_EVIDENCE_MAP_BUILDER: q(
    'ช่วยจับคู่ claim กับ evidence ที่รองรับ/คัดค้าน พร้อมแยก assumption และส่วนที่ยังไม่มีหลักฐาน เพื่อลดการสรุปเกินข้อมูล',
    ['ตรวจ argument ในรายงาน', 'เตรียม evidence map', 'ทบทวนความแข็งแรงของข้อสรุป'],
    ['รายการ claim', 'evidence สนับสนุน/คัดค้านต่อ claim', 'assumptions และ evidence gaps'],
    'ตัวอย่าง: Claim = การเปลี่ยน Wi-Fi controller ทำให้ incident ลดลง 30% พร้อมแนบข้อมูล incident ก่อนและหลังเปลี่ยน',
  ),
  RESEARCH_GAP_FINDER: q(
    'ช่วยหา research gap จากชุดแหล่งข้อมูลที่ให้ โดยแยกสิ่งที่ถูกศึกษาแล้ว ความขัดแย้ง และคำถามที่ยังไม่มี evidence เพียงพอ',
    ['หา thesis/research opportunity', 'ตรวจว่าหัวข้อใหม่จริงหรือไม่', 'สร้างคำถามต่อยอดจาก literature'],
    ['หัวข้อที่มีหลักฐานเพียงพอแล้ว', 'ช่องว่าง/ความขัดแย้ง', 'คำถามวิจัยต่อยอดที่มีเหตุผล'],
    'ตัวอย่าง: Sources = งานวิจัยเรื่อง employee adoption ของ MFA 8 ฉบับ ต้องการหาช่องว่างสำหรับองค์กรในเอเชียตะวันออกเฉียงใต้',
  ),
  CODEBASE_ONBOARDING_GUIDE: q(
    'ช่วยอ่านโครงสร้าง codebase แล้วสร้างคู่มือ onboarding ที่ชี้ entry points, data flow, dependencies และลำดับไฟล์ที่ควรอ่าน โดยยึดเฉพาะ code ที่มีให้',
    ['รับช่วงโปรเจกต์ใหม่', 'เตรียม developer onboarding', 'ทำความเข้าใจระบบก่อนแก้ feature'],
    ['แผนที่ codebase', 'เส้นทาง request/data flow', 'ลำดับการอ่านไฟล์และคำถามที่ยังต้องตรวจ'],
    'ตัวอย่าง: แนบ tree ของ Next.js repo พร้อม package.json และไฟล์ app/page.jsx เพื่อทำ onboarding guide สำหรับ developer ใหม่',
  ),
  REFACTOR_PLAN_BUILDER: q(
    'ช่วยวางแผน refactor จาก code, pain points และ constraints โดยแบ่งเป็นขั้นเล็กที่ตรวจสอบ behavior ได้ และระบุ regression risks ก่อนลงมือแก้',
    ['ลด technical debt', 'แยก module ใหญ่', 'เตรียม refactor โดยไม่หยุด production'],
    ['ปัญหาโครงสร้างปัจจุบัน', 'แผน refactor แบบเป็นขั้น', 'tests/risks/rollback points ต่อขั้น'],
    'ตัวอย่าง: Code = component 1,200 บรรทัด, เป้าหมาย = แยก state/domain/UI โดยห้ามเปลี่ยน behavior ภายนอก',
  ),
  SOFTWARE_MIGRATION_PLANNER: q(
    'ช่วยวาง migration ระหว่าง framework/version/platform โดยระบุ compatibility, dependencies, data/state migration, rollout และ rollback จากข้อเท็จจริงที่ให้มา',
    ['อัปเกรด framework major version', 'ย้าย hosting/runtime', 'เปลี่ยน library สำคัญแบบลด downtime'],
    ['inventory และ incompatibilities', 'migration phases', 'verification/rollback checklist'],
    'ตัวอย่าง: ย้าย Next.js 15 ไป 16 และ Node.js 20 ไป 22 โดยต้องคง Cloudflare Workers deployment เดิม',
  ),
  ARCHITECTURE_DECISION_RECORD: q(
    'ช่วยเปลี่ยนบริบทการตัดสินใจทางสถาปัตยกรรมเป็น ADR ที่บันทึก problem, options, trade-offs, decision และ consequences โดยไม่แต่งเหตุผลที่ผู้ใช้ไม่ได้ให้',
    ['บันทึก architectural decision', 'เปรียบเทียบ technology options', 'เก็บเหตุผลให้ทีมย้อนหลังได้'],
    ['Context', 'Options และ trade-offs', 'Decision/consequences/open questions'],
    'ตัวอย่าง: ต้องเลือกระหว่าง IndexedDB กับ LocalStorage สำหรับ Run History ที่ต้องเก็บ output ขนาดใหญ่และทำงาน offline',
  ),
  DEPENDENCY_UPGRADE_PLANNER: q(
    'ช่วยวิเคราะห์ dependency upgrade จากเวอร์ชันปัจจุบัน/เป้าหมายและ changelog ที่ผู้ใช้มี เพื่อวางลำดับ upgrade, compatibility checks และ regression tests',
    ['อัปเกรด package หลายตัว', 'ลด risk จาก breaking changes', 'เตรียม dependency maintenance sprint'],
    ['dependency impact map', 'ลำดับการอัปเกรด', 'tests และ rollback checkpoints'],
    'ตัวอย่าง: Next.js 16.2 → 16.3, React 19.2 → 19.3 และ Wrangler 4.x พร้อมรายการ release notes ที่เกี่ยวข้อง',
  ),
  API_INTEGRATION_PLANNER: q(
    'ช่วยออกแบบแผนเชื่อมต่อ API ภายนอกจาก requirements และ API contract โดยครอบคลุม auth, request/response mapping, retries, errors, rate limits และ observability',
    ['เชื่อม third-party API', 'เตรียม integration spec', 'ทบทวน failure handling ก่อน coding'],
    ['integration flow', 'data/auth/error contracts', 'test cases และ operational considerations'],
    'ตัวอย่าง: เชื่อม payment API ที่ใช้ Bearer token, webhook ยืนยันสถานะ และมี rate limit 100 requests/minute',
  ),
  CI_CD_PIPELINE_REVIEWER: q(
    'ช่วย review การออกแบบ CI/CD pipeline เพื่อหา missing gates, unsafe deploy behavior, secret exposure, flaky steps และ rollback gaps โดยไม่สมมติสถานะ pipeline ที่ไม่ได้ให้',
    ['review workflow ก่อนใช้ production', 'ตรวจ deployment safety', 'ลด duplicated/fragile CI steps'],
    ['pipeline findings ตาม severity', 'missing controls/tests', 'ข้อเสนอปรับ flow และ rollback'],
    'ตัวอย่าง: แนบ GitHub Actions workflow ที่ทำ test → build → deploy Cloudflare และต้องการตรวจว่า production gate ปลอดภัยหรือไม่',
  ),
  INCIDENT_TRIAGE_COORDINATOR: q(
    'ช่วยจัดระเบียบ incident จาก symptoms, impact และ evidence ให้เป็นสถานะปัจจุบัน สิ่งที่ยืนยันแล้ว สมมติฐาน owners และ next checks โดยไม่เดา root cause',
    ['เปิด incident bridge', 'จัด handoff ระหว่างทีม', 'ทำสถานะ incident ให้ทุกคนเข้าใจตรงกัน'],
    ['impact/status summary', 'facts vs hypotheses', 'next actions/owners เฉพาะที่มีข้อมูล'],
    'ตัวอย่าง: ผู้ใช้ 3 สาขาเข้า SAP ไม่ได้ ตั้งแต่ 09:10 มี ping gateway ปกติแต่ application timeout พร้อมแนบ log ที่มี',
  ),
  INCIDENT_POSTMORTEM_BUILDER: q(
    'ช่วยสร้าง postmortem จาก timeline/evidence ที่เกิดขึ้นจริง โดยแยก root cause, contributing factors, impact และ corrective actions และไม่แต่ง timeline ที่ไม่มีหลักฐาน',
    ['เขียน postmortem หลัง outage', 'สรุป lessons learned', 'สร้าง follow-up actions จากเหตุการณ์'],
    ['factual timeline', 'impact/root cause/contributing factors', 'corrective actions และ unanswered questions'],
    'ตัวอย่าง: Timeline = 09:00 alarm, 09:12 route flapped, 09:25 rollback, 09:31 service recovered พร้อม incident evidence',
  ),
  RUNBOOK_GENERATOR: q(
    'ช่วยเปลี่ยนขั้นตอนปฏิบัติงานและเงื่อนไขของระบบเป็น runbook ที่มี prerequisites, checks, commands/actions, expected results, escalation และ rollback อย่างชัดเจน',
    ['สร้าง NOC runbook', 'มาตรฐาน troubleshooting procedure', 'ทำขั้นตอน recurring operation ให้ส่งต่อได้'],
    ['prerequisites', 'step-by-step procedure พร้อม expected result', 'escalation/rollback criteria'],
    'ตัวอย่าง: สร้าง runbook ตรวจ MPLS link down สำหรับ Cisco router โดยเริ่มจาก show interface, routing และ provider handoff',
  ),
  OBSERVABILITY_PLAN_DESIGNER: q(
    'ช่วยออกแบบ observability plan จากระบบและ SLO โดยกำหนด metrics, logs, traces, alerts และ dashboards ที่ผูกกับ failure modes จริง ไม่สร้าง telemetry สมมติ',
    ['ออกแบบ monitoring ระบบใหม่', 'ลด blind spot ใน production', 'จัด alert ให้สัมพันธ์กับ SLO'],
    ['signals ที่ต้องเก็บ', 'alert conditions และ rationale', 'dashboard/tracing/logging plan'],
    'ตัวอย่าง: ระบบ Next.js API บน Cloudflare ต้องติดตาม availability, error rate, latency และ upstream API failures',
  ),
  NETWORK_TROUBLESHOOTER: q(
    'ช่วยทำ structured fault isolation จาก incident และ network evidence โดยไล่ failure domain อย่างเป็นขั้น และหลีกเลี่ยงการเปลี่ยน config จนกว่าหลักฐานจะรองรับ',
    ['วิเคราะห์ link/VLAN/routing incident', 'จัดลำดับ show commands', 'แยก Layer 1/2/3 failure domain'],
    ['evidence summary', 'failure domain/hypotheses', 'next diagnostic commands และ safe actions'],
    'ตัวอย่าง: Incident = client VLAN 50 ใช้งานไม่ได้, Logs = show int trunk, show spanning-tree vlan 50 และ show ip route',
  ),
  NETWORK_CHANGE_RISK_REVIEWER: q(
    'ช่วย review network change plan ก่อนดำเนินการ โดยตรวจ blast radius, dependencies, validation, maintenance window และ rollback จาก topology/config ที่ให้มา',
    ['review change VLAN/routing/ACL', 'เตรียม CAB', 'ลดความเสี่ยงจาก network maintenance'],
    ['risk register', 'pre/post checks', 'rollback triggers และ missing information'],
    'ตัวอย่าง: Change = เปลี่ยน STP root สำหรับ VLAN 50/51, มี switches 6 ตัว และต้อง rollback ได้ภายใน 10 นาที',
  ),
  THREAT_MODEL_BUILDER: q(
    'ช่วยสร้าง threat model จาก architecture และ trust boundaries โดยระบุ assets, attack surfaces, threats และ mitigations แบบ defensive และแยกสิ่งที่ยังต้องยืนยัน',
    ['review security design', 'เตรียม architecture security review', 'หา trust-boundary risks ก่อน release'],
    ['assets/trust boundaries', 'threat scenarios และ severity factors', 'mitigations/verification questions'],
    'ตัวอย่าง: ระบบ web app มี browser → Next.js API → Supabase และ third-party payment webhook ต้องการ threat model ก่อน production',
  ),
  API_SECURITY_ASSESSOR: q(
    'ช่วยประเมิน API security จาก contract/config/code ที่ผู้ใช้ให้ โดยตรวจ authn/authz, input validation, data exposure, rate limiting และ common abuse cases ในเชิง defensive',
    ['security review API ก่อน release', 'ตรวจ authorization boundary', 'หา input/data exposure risk'],
    ['findings ตาม severity', 'evidence และ impact', 'defensive remediation/verification steps'],
    'ตัวอย่าง: API GET /orders/:id ใช้ JWT และต้องตรวจว่า user อ่าน order ของคนอื่นไม่ได้ พร้อมแนบ route code',
  ),
  IAM_LEAST_PRIVILEGE_REVIEWER: q(
    'ช่วย review IAM role/policy เพื่อหาสิทธิ์ที่กว้างเกินหน้าที่และเสนอ scope ที่แคบลงโดยยังรักษา use case ที่ระบุ',
    ['review cloud IAM policy', 'ลด privilege ของ service account', 'เตรียม least-privilege remediation'],
    ['required vs excessive permissions', 'risk ของ wildcard/resource scope', 'proposed least-privilege changes และ validation'],
    'ตัวอย่าง: service account ต้องอ่าน objects ใน bucket reports เท่านั้น แต่ policy ปัจจุบันให้ storage:* ทุก bucket',
  ),
  CLOUD_ARCHITECTURE_REVIEWER: q(
    'ช่วย review cloud architecture ด้าน reliability, security, scalability, cost drivers และ operability โดยอิง diagram/config ที่ให้และไม่แต่ง usage metrics',
    ['architecture review ก่อน scale', 'ตรวจ single point of failure', 'หา operational/security gaps'],
    ['architecture findings', 'risks/trade-offs', 'prioritized improvements และข้อมูลที่ยังต้องวัด'],
    'ตัวอย่าง: Architecture = Cloudflare Workers → API → Supabase พร้อม static assets และ external OpenAI API ต้องการ review reliability/security',
  ),
  SQL_PERFORMANCE_DIAGNOSTIC: q(
    'ช่วยวิเคราะห์ SQL performance จาก query, schema และ execution evidence เช่น EXPLAIN โดยแยก bottleneck ที่เห็นจริงจาก optimization hypothesis',
    ['วิเคราะห์ slow query', 'อ่าน execution plan', 'ตรวจ index/query shape ก่อนแก้ production'],
    ['bottlenecks จาก evidence', 'index/query rewrite candidates', 'measurement plan เพื่อ verify improvement'],
    'ตัวอย่าง: Query ใช้ JOIN orders/customers และช้า 4 วินาที พร้อมแนบ schema กับ EXPLAIN ANALYZE',
  ),
  DATABASE_MIGRATION_PLANNER: q(
    'ช่วยวาง schema/data migration ให้มี compatibility, ordering, backfill, validation และ rollback โดยคำนึงถึง production traffic และ dependency',
    ['เพิ่ม/เปลี่ยน schema ใน production', 'ทำ zero/low-downtime migration', 'วาง backfill และ rollback'],
    ['migration sequence', 'compatibility/backfill checks', 'validation/rollback plan'],
    'ตัวอย่าง: ต้องเปลี่ยน user_id จาก nullable เป็น required โดยมีข้อมูลเก่าบางแถวเป็น null และห้าม downtime ยาว',
  ),
  DATA_QUALITY_RULE_DESIGNER: q(
    'ช่วยออกแบบกฎตรวจคุณภาพข้อมูลจาก schema, grain และ business rules เพื่อจับ missingness, duplicates, range/type/referential errors พร้อม severity/action ที่ชัดเจน',
    ['สร้าง validation rules สำหรับ pipeline', 'กำหนด data contract', 'เตรียม quality checks ก่อน dashboard'],
    ['รายการ rule พร้อมเงื่อนไข', 'severity และ rationale', 'ตัวอย่าง valid/invalid และ remediation'],
    'ตัวอย่าง: ตาราง orders หนึ่งแถวต่อ order, order_id ต้อง unique, amount >= 0 และ customer_id ต้องอ้างถึง customers ที่มีอยู่',
  ),
  EXPLORATORY_DATA_ANALYSIS_PLANNER: q(
    'ช่วยวาง EDA plan จาก dataset description และเป้าหมาย โดยกำหนด grain, dimensions, distributions, missingness, outliers, relationships และ checks ก่อนสรุปผล',
    ['เริ่มวิเคราะห์ dataset ใหม่', 'วาง notebook analysis', 'ตรวจ data ก่อนสร้าง model/dashboard'],
    ['EDA checklist', 'metrics/segments/plots ที่ควรตรวจ', 'data risks และ questions ที่ต้องตอบ'],
    'ตัวอย่าง: Dataset = ticket helpdesk 12 เดือน, Goal = หา driver ของ resolution time และ backlog growth',
  ),
});
