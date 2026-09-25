function m(purposeTh, useCasesTh, expectedOutputTh, exampleInputTh) {
  return Object.freeze({
    purposeTh,
    useCasesTh: Object.freeze(useCasesTh),
    inputGuideTh: Object.freeze({}),
    expectedOutputTh: Object.freeze(expectedOutputTh),
    exampleInputTh,
  });
}

export const RESEARCHED_QUALITY_METADATA_A = Object.freeze({
  RESEARCH_QUESTION_REFINER: m(
    'ช่วยเปลี่ยนหัวข้อกว้างให้เป็นคำถามวิจัยที่ตอบได้จริง พร้อมกำหนด scope หลักฐานที่ต้องใช้ และจุดที่ยังคลุมเครือ',
    ['เตรียม proposal', 'ตั้งคำถามก่อนทำ literature review', 'ลดหัวข้อวิจัยที่กว้างเกินไป'],
    ['Refined objective และ research questions', 'Scope/exclusions และ evidence needed', 'Risks/ambiguities'],
    'ตัวอย่าง: หัวข้อ AI copilot ในงาน IT Helpdesk เป้าหมายคือวัดผลต่อ resolution time และคุณภาพงาน',
  ),
  LITERATURE_SYNTHESIS_MATRIX: m(
    'ช่วยจัดงานวิจัยหลายชิ้นเป็น matrix ที่เทียบ method, sample, findings และ limitations ได้โดยไม่ทำให้ความแตกต่างของแต่ละงานหายไป',
    ['สังเคราะห์ paper หลายชิ้น', 'หา pattern/contradiction ระหว่างงาน', 'เตรียม literature review'],
    ['Study matrix', 'Cross-study themes และ contradictions', 'Evidence gaps และคำถามติดตาม'],
    'ตัวอย่าง: วาง abstract จาก 5 งานเรื่อง remote work productivity แล้วเปรียบเทียบวิธีวิจัยและผลลัพธ์',
  ),
  CLAIM_EVIDENCE_MAP_BUILDER: m(
    'ช่วยเชื่อมแต่ละ claim กับหลักฐานสนับสนุน หลักฐานโต้แย้ง สมมติฐาน และระดับความมั่นใจจากข้อมูลที่ให้มาเท่านั้น',
    ['ตรวจ proposal', 'audit รายงานที่มี claim จำนวนมาก', 'หา claim ที่ยังไม่มีหลักฐาน'],
    ['Claim-evidence table', 'Weak/unsupported claims', 'Assumptions และ verification priorities'],
    'ตัวอย่าง: วางข้อความ proposal ที่มี claim เรื่องตลาดและผลการทดลอง แล้วขอ audit ก่อน executive review',
  ),
  RESEARCH_GAP_FINDER: m(
    'ช่วยหาช่องว่างจากเอกสารที่ให้มาโดยแยกให้ชัดระหว่าง “ยังไม่พบในชุดนี้” กับ “ยังไม่มีงานในสาขา” เพื่อลดการอ้าง novelty เกินหลักฐาน',
    ['หา thesis direction', 'วาง R&D question', 'สำรวจ contradiction หรือ population gap'],
    ['Established knowledge', 'Candidate gaps และเหตุผล', 'Testable questions กับ uncertainty'],
    'ตัวอย่าง: วาง summary งานวิจัย 10 ชิ้นเรื่อง LLM-assisted network operations เพื่อหาประเด็น thesis',
  ),
  CODEBASE_ONBOARDING_GUIDE: m(
    'ช่วยสร้างแผนทำความเข้าใจ repository ที่ไม่คุ้นเคยจากหลักฐานที่มี เช่น modules, entry points, build/test flow และพื้นที่เสี่ยง',
    ['Onboard developer ใหม่', 'รับช่วง repository', 'เตรียม handoff codebase'],
    ['Architecture/module map', 'Build/test/data flow ที่พบจริง', 'First-day checklist และ open questions'],
    'ตัวอย่าง: วาง README, tree และไฟล์ entry point ของ Next.js repo แล้วสร้าง onboarding guide สำหรับ developer ใหม่',
  ),
  REFACTOR_PLAN_BUILDER: m(
    'ช่วยเปลี่ยนปัญหาโค้ดที่ซับซ้อนเป็นแผน refactor แบบทีละขั้น โดยรักษา behavior เดิมและกำหนด verification ก่อนเปลี่ยนโครงสร้าง',
    ['ลด technical debt', 'แยกโมดูลใหญ่', 'วาง refactor ก่อนลงมือแก้โค้ด'],
    ['Current risks', 'Refactor sequence และ boundaries', 'Tests/verification และ rollback points'],
    'ตัวอย่าง: โมดูล React หนึ่งไฟล์ 1,500 บรรทัด มี state และ API logic ปะปน ต้องการแยกโดยไม่เปลี่ยน behavior',
  ),
  SOFTWARE_MIGRATION_PLANNER: m(
    'ช่วยวาง migration จากเทคโนโลยีหรือ architecture เดิมไปใหม่โดยแยก compatibility, data, rollout, test และ rollback risk อย่างเป็นขั้นตอน',
    ['Framework migration', 'Runtime/version upgrade', 'ย้าย service หรือ architecture'],
    ['Migration phases', 'Compatibility/dependency risks', 'Verification และ rollback plan'],
    'ตัวอย่าง: ย้าย Node.js service จาก CommonJS ไป ESM โดยต้องไม่หยุด production และต้องรักษา API เดิม',
  ),
  ARCHITECTURE_DECISION_RECORD: m(
    'ช่วยเขียน Architecture Decision Record ที่เก็บ context, decision, alternatives, trade-offs และ consequences เพื่อให้เหตุผลของระบบตรวจย้อนหลังได้',
    ['บันทึก technical decision', 'เปรียบเทียบทางเลือกก่อนเลือก architecture', 'เก็บ rationale ให้ทีมในอนาคต'],
    ['Context/constraints', 'Decision และ alternatives', 'Consequences และ follow-up'],
    'ตัวอย่าง: ตัดสินใจใช้ IndexedDB เป็น local source of truth แทน LocalStorage สำหรับ Run History',
  ),
  DEPENDENCY_UPGRADE_PLANNER: m(
    'ช่วยวางแผนอัปเกรด dependency โดยตรวจ breaking changes, compatibility, test surface และ rollback ก่อนเปลี่ยน production',
    ['อัปเกรด framework', 'อัปเดต package สำคัญ', 'ลดความเสี่ยงจาก dependency change'],
    ['Dependency impact map', 'Upgrade sequence', 'Tests, rollout และ rollback checks'],
    'ตัวอย่าง: อัปเกรด Next.js และ React major version ใน production app ที่ deploy บน Cloudflare Workers',
  ),
  API_INTEGRATION_PLANNER: m(
    'ช่วยออกแบบการเชื่อม API ก่อน implement โดยชี้ auth, contract, retries, idempotency, errors, rate limits และ observability ที่ต้องตัดสินใจ',
    ['เชื่อม third-party API', 'วาง integration contract', 'เตรียม implementation checklist'],
    ['Request/response contract', 'Failure/retry/idempotency strategy', 'Security และ test plan'],
    'ตัวอย่าง: เชื่อม payment API กับ order service โดยต้องป้องกัน duplicate charge และตรวจ ownership ของ order',
  ),
  CI_CD_PIPELINE_REVIEWER: m(
    'ช่วย review โครงสร้าง CI/CD pipeline ว่ามี build, test, artifact, deploy gate, secrets และ rollback ที่เหมาะสม โดยอิง config ที่ให้มา',
    ['Review workflow ก่อนใช้ production', 'ตรวจ deployment gates', 'หา security/reliability gap ใน pipeline'],
    ['Pipeline stage review', 'Risk/gap list', 'Recommended checks และ safe rollout changes'],
    'ตัวอย่าง: วาง GitHub Actions workflow ที่ build OpenNext และ Wrangler dry-run เพื่อ review ก่อนเปิด auto deploy',
  ),
  INCIDENT_TRIAGE_COORDINATOR: m(
    'ช่วยจัด incident triage จาก evidence ที่มี แยก impact, timeline, owners, hypotheses และ next checks โดยไม่สรุป root cause ก่อนหลักฐานพอ',
    ['เหตุการณ์ production outage', 'ประสานหลายทีมตอน incident', 'จัดลำดับข้อมูลที่ต้องตรวจต่อ'],
    ['Impact/current state', 'Evidence และ hypotheses', 'Owners, priorities และ next checks'],
    'ตัวอย่าง: Service login ช้าหลัง deploy 10 นาที มี error rate สูงขึ้น แต่ database CPU ปกติ',
  ),
  INCIDENT_POSTMORTEM_BUILDER: m(
    'ช่วยสร้าง postmortem จาก timeline และ evidence จริง โดยแยก root/contributing factors ออกจากสิ่งที่ยังไม่ทราบ และสร้าง follow-up ที่ตรวจติดตามได้',
    ['เขียน postmortem หลัง outage', 'สรุป lessons learned', 'สร้าง corrective actions'],
    ['Factual timeline และ impact', 'Contributing/root factors พร้อม evidence', 'Action items และ unanswered questions'],
    'ตัวอย่าง: วาง incident timeline, impact, logs และ corrective actions ของ outage 45 นาที',
  ),
  RUNBOOK_GENERATOR: m(
    'ช่วยแปลงงาน operational ที่ทำซ้ำให้เป็น runbook ที่มี prerequisites, checks, steps, expected results, stop conditions และ escalation',
    ['ทำ NOC runbook', 'มาตรฐานงาน Helpdesk', 'เตรียมขั้นตอน recovery ที่ทำซ้ำได้'],
    ['Prerequisites', 'Step-by-step commands/actions', 'Verification, rollback และ escalation'],
    'ตัวอย่าง: สร้าง runbook ตรวจสอบ switch uplink down โดยเริ่มจาก show interface และไม่เปลี่ยน config จนมีหลักฐาน',
  ),
  OBSERVABILITY_PLAN_DESIGNER: m(
    'ช่วยออกแบบ observability จาก user/system goals ไปสู่ metrics, logs, traces, dashboards และ alert conditions ที่ตรวจสอบได้จริง',
    ['วาง monitoring service ใหม่', 'ลด alert noise', 'กำหนด SLI/SLO และ telemetry'],
    ['Signals/SLIs', 'Dashboard/alert plan', 'Logging/tracing coverage และ gaps'],
    'ตัวอย่าง: Web API ต้องการตรวจ latency p95, error rate, dependency failures และ deploy correlation',
  ),
  NETWORK_TROUBLESHOOTER: m(
    'ช่วยแยก failure domain ของปัญหาเครือข่ายจาก incident และ logs แบบเป็นขั้นตอน โดยหลีกเลี่ยงการเปลี่ยน config ก่อนมีหลักฐานรองรับ',
    ['Link/VLAN/Trunk issue', 'Routing หรือ reachability problem', 'Packet loss และ interface errors'],
    ['Observed evidence', 'Failure domain และ hypotheses', 'Safe verification commands และ next action'],
    'ตัวอย่าง: Incident: client VLAN 50 ออก internet ไม่ได้\nLogs: show interfaces trunk, show ip route และ ACL output',
  ),
  NETWORK_CHANGE_RISK_REVIEWER: m(
    'ช่วย review network change plan ก่อนทำจริง โดยหาผลกระทบ dependency, blast radius, pre-check, rollback และ validation ที่ขาด',
    ['VLAN/routing change', 'Firewall/network maintenance', 'Peer review ก่อน change window'],
    ['Risk/blast-radius review', 'Pre/post checks', 'Rollback triggers และ missing evidence'],
    'ตัวอย่าง: Change เพิ่ม VLAN 55 ผ่าน trunk และ SVI บน distribution switch พร้อม maintenance window 30 นาที',
  ),
  THREAT_MODEL_BUILDER: m(
    'ช่วยสร้าง threat model จาก architecture และ trust boundaries ที่ให้มา โดยระบุ assets, entry points, threats, controls และ residual risks อย่างเป็นระบบ',
    ['Review design ก่อน launch', 'Security architecture review', 'หา trust-boundary gap'],
    ['Assets/trust boundaries', 'Threat scenarios', 'Mitigations และ residual risk'],
    'ตัวอย่าง: Web app ใช้ browser, Next.js API, Supabase Auth และ third-party payment provider',
  ),
  API_SECURITY_ASSESSOR: m(
    'ช่วยตรวจ API contract และ implementation context เพื่อหาความเสี่ยงด้าน authentication, authorization, validation, data exposure และ abuse controls',
    ['Security review endpoint', 'ตรวจ API ก่อน production', 'หา auth/ownership/validation gap'],
    ['Security findings พร้อม severity', 'Evidence/affected flow', 'Mitigation และ verification steps'],
    'ตัวอย่าง: POST /payments รับ orderId และ amount จาก client แล้วส่งต่อ payment provider',
  ),
  IAM_LEAST_PRIVILEGE_REVIEWER: m(
    'ช่วย review role/policy ตามหลัก least privilege โดยชี้ permission ที่กว้างเกิน requirement, missing separation และ validation ที่ควรทำ',
    ['Review cloud IAM', 'ลด privilege ของ service account', 'ตรวจ role ก่อน production'],
    ['Required vs granted permissions', 'Excess/missing privileges', 'Safer policy recommendations'],
    'ตัวอย่าง: Service account มี wildcard resource access แต่ใช้งานจริงเฉพาะอ่าน object ใน bucket เดียว',
  ),
  CLOUD_ARCHITECTURE_REVIEWER: m(
    'ช่วย review cloud architecture ด้าน reliability, security, scalability, cost drivers และ operational readiness จากข้อมูลที่ให้มา โดยไม่สร้าง metric/cost ที่ไม่มีหลักฐาน',
    ['Review architecture ก่อน launch', 'หา single point of failure', 'ตรวจ security/operations ของ cloud design'],
    ['Architecture risks', 'Reliability/security observations', 'Prioritized verification and improvement plan'],
    'ตัวอย่าง: Next.js Worker + Supabase + object storage + external AI API สำหรับ production SaaS',
  ),
  SQL_PERFORMANCE_DIAGNOSTIC: m(
    'ช่วยวิเคราะห์ SQL performance จาก query, schema และ execution evidence โดยแยกสิ่งที่วัดได้จริงออกจาก hypothesis เรื่อง index/join/cardinality',
    ['Query ช้า', 'High DB load', 'Review execution plan ก่อนเพิ่ม index'],
    ['Observed bottlenecks', 'Query/index hypotheses', 'Measurements และ validation steps'],
    'ตัวอย่าง: Query join orders กับ payments ใช้เวลา 8s พร้อม EXPLAIN และ table schema',
  ),
  DATABASE_MIGRATION_PLANNER: m(
    'ช่วยวาง database migration ที่คำนึงถึง schema/data compatibility, lock/downtime, backfill, validation และ rollback โดยไม่สมมติ behavior ของ DB ที่ไม่ได้ระบุ',
    ['เพิ่ม/เปลี่ยน column production', 'Data backfill', 'Zero/low-downtime schema migration'],
    ['Migration phases', 'Lock/data/compatibility risks', 'Validation และ rollback plan'],
    'ตัวอย่าง: เปลี่ยน status column ให้ใช้ enum ใหม่บนตารางที่มีหลายล้าน rows โดยต้องลด downtime',
  ),
  DATA_QUALITY_RULE_DESIGNER: m(
    'ช่วยออกแบบกฎตรวจ data quality จาก business meaning และ data grain โดยครอบคลุม completeness, uniqueness, validity, consistency และ freshness',
    ['สร้าง validation rules', 'เตรียม data contract', 'กำหนด quality checks สำหรับ pipeline'],
    ['Data-quality dimensions', 'Concrete validation rules', 'Failure handling และ ownership suggestions'],
    'ตัวอย่าง: ตาราง orders ต้องมี order_id ไม่ซ้ำ, amount ไม่ติดลบ และ paid_at ต้องมีเมื่อ status=paid',
  ),
  EXPLORATORY_DATA_ANALYSIS_PLANNER: m(
    'ช่วยวาง EDA plan ก่อนวิเคราะห์ข้อมูล โดยระบุ grain, distributions, missingness, outliers, segments และ questions ที่ต้องตอบ ไม่สร้างผลลัพธ์ที่ยังไม่ได้คำนวณ',
    ['เริ่มวิเคราะห์ dataset ใหม่', 'เตรียม notebook EDA', 'หา data risks ก่อน modeling'],
    ['EDA checklist', 'Metrics/plots to compute', 'Segment and anomaly questions'],
    'ตัวอย่าง: Dataset ticket helpdesk มี created_at, resolved_at, category, site และ SLA status ต้องการหา driver ของ resolution time',
  ),
});
