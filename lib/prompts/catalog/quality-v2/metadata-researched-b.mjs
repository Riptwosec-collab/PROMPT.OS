function q(purposeTh, useCasesTh, expectedOutputTh, exampleInputTh) {
  return Object.freeze({ purposeTh, useCasesTh, expectedOutputTh, exampleInputTh });
}

export const RESEARCHED_PROMPT_QUALITY_V2_METADATA_B = Object.freeze({
  KPI_VARIANCE_INVESTIGATOR: q(
    'ช่วยตรวจการเปลี่ยนแปลงของ KPI จากข้อมูลตามช่วงเวลาและ segment โดยแยก movement ที่ยืนยันได้จากสมมติฐานเรื่อง driver และระบุข้อมูลที่ต้องตรวจเพิ่ม',
    ['วิเคราะห์ KPI ขึ้น/ลงผิดปกติ', 'ทำ weekly/monthly business review', 'หา segment ที่มี contribution สูง'],
    ['movement summary', 'segment/driver evidence', 'hypotheses และ next analyses'],
    'ตัวอย่าง: KPI = ticket backlog, ช่วง = 8 สัปดาห์ล่าสุด, ข้อมูลแยกตาม site/team/category และมี staffing change ในสัปดาห์ที่ 5',
  ),
  EXPERIMENT_ANALYSIS_PLANNER: q(
    'ช่วยวางแผนวิเคราะห์ experiment จาก hypothesis, metrics และ design โดยตรวจ sample, guardrails, segmentation, statistical assumptions และวิธีตีความผลโดยไม่บังคับให้มี winner',
    ['เตรียม A/B test analysis', 'review experiment design ก่อนอ่านผล', 'กำหนด guardrail metrics'],
    ['analysis plan', 'metric/segment/statistical checks', 'interpretation rules และ limitations'],
    'ตัวอย่าง: ทดลอง onboarding A/B ต้องการวัด activation rate โดยมี guardrail เป็น support tickets และ cancellation',
  ),
  FEATURE_LEAKAGE_AUDITOR: q(
    'ช่วยตรวจ feature leakage ในงาน machine learning จาก feature definitions, labels และ timing โดยหา fields ที่ใช้ข้อมูลอนาคตหรือ proxy ของ target',
    ['review ML dataset ก่อน training', 'ตรวจ suspiciously high validation score', 'ป้องกัน temporal/data leakage'],
    ['potential leakage features', 'เหตุผลและ leakage path', 'safer feature alternatives และ validation checks'],
    'ตัวอย่าง: ทำนาย churn ภายใน 30 วัน แต่ feature มี cancellation_reason และ account_closed_at ต้องการตรวจ leakage',
  ),
  WORKFLOW_AUTOMATION_DESIGNER: q(
    'ช่วยออกแบบ workflow automation จาก trigger, systems, decisions และ actions โดยระบุ retries, idempotency, failure path และ manual fallback ก่อน implement',
    ['ออกแบบ automation ข้ามระบบ', 'ลดงาน manual ซ้ำ', 'เตรียม workflow spec สำหรับ developer'],
    ['trigger/action flow', 'state/error/idempotency rules', 'manual fallback และ observability needs'],
    'ตัวอย่าง: เมื่อ ticket P1 ถูกเปิด ให้แจ้ง Slack, สร้าง incident record และ escalate หากไม่มี owner ภายใน 10 นาที',
  ),
  WEBHOOK_EVENT_FLOW_DESIGNER: q(
    'ช่วยออกแบบ webhook event flow ที่ปลอดภัยและทนต่อ duplicate/out-of-order delivery โดยครอบคลุม verification, idempotency, retries และ state transition',
    ['ออกแบบ payment webhook', 'เชื่อม event จาก SaaS', 'ป้องกัน webhook processing ซ้ำ'],
    ['event contract', 'verification/idempotency flow', 'retry/error/state-transition behavior'],
    'ตัวอย่าง: payment.completed อาจส่งซ้ำ ต้อง verify signature และเปลี่ยน order เป็น paid เฉพาะเมื่อยอดตรงกับฐานข้อมูล',
  ),
  API_ERROR_TROUBLESHOOTER: q(
    'ช่วยไล่สาเหตุ API error จาก request, response, logs และ expected behavior โดยจำแนกปัญหา auth, validation, contract, transport หรือ upstream อย่างเป็นขั้น',
    ['debug 4xx/5xx', 'ตรวจ integration failure', 'หา contract mismatch ระหว่าง client/server'],
    ['failure layer', 'evidence-backed causes', 'minimal verification/fix steps'],
    'ตัวอย่าง: POST /payments ได้ 400 หลัง deploy โดย request body และ response error แนบมาครบ พร้อม expected schema',
  ),
  SOP_BUILDER: q(
    'ช่วยสร้าง Standard Operating Procedure จากงานและนโยบายที่กำหนด ให้มี scope, prerequisites, steps, checks, exceptions และ escalation ที่คนอื่นทำตามได้จริง',
    ['ทำ SOP งาน Helpdesk', 'มาตรฐาน recurring operation', 'เตรียมเอกสาร handover'],
    ['scope/prerequisites', 'step-by-step procedure', 'quality checks/exceptions/escalation'],
    'ตัวอย่าง: SOP รับแจ้ง Incident P1 ตั้งแต่เปิด ticket, แจ้งทีม, เก็บ evidence จนถึง handoff ให้ Tier 2',
  ),
  DECISION_MEMO_BUILDER: q(
    'ช่วยเขียน decision memo จาก options, evidence, constraints และ decision criteria โดยแสดง trade-off/unknowns และไม่แต่งข้อเท็จจริงให้ตัวเลือกใดชนะ',
    ['ตัดสินใจซื้อเครื่องมือ', 'เลือก architecture', 'สรุปทางเลือกให้ผู้บริหาร'],
    ['decision context', 'comparison by criteria', 'recommendation เฉพาะเมื่อ evidence รองรับพร้อม risks/unknowns'],
    'ตัวอย่าง: เปรียบเทียบ PRTG กับ Zabbix สำหรับ 500 devices โดยมีข้อจำกัดงบ ทีม 3 คน และต้องรองรับ SNMP/Syslog',
  ),
  PROJECT_RISK_REGISTER: q(
    'ช่วยสร้าง risk register จาก project context โดยแยก risk, cause, impact, likelihood, mitigation, trigger และ owner เฉพาะเมื่อมีข้อมูลจริง',
    ['เริ่ม project planning', 'review delivery risks', 'เตรียม steering meeting'],
    ['risk register', 'mitigation/trigger', 'unknown ownership or missing evidence'],
    'ตัวอย่าง: โครงการย้าย network core ภายใน 8 สัปดาห์ มี vendor dependency, maintenance window จำกัด และทีมต้องดู production พร้อมกัน',
  ),
  PROJECT_STATUS_REPORTER: q(
    'ช่วยเปลี่ยนข้อมูล progress, blockers, risks และ milestones เป็น status report ที่กระชับและตรวจสอบย้อนกลับได้ โดยไม่สร้างเปอร์เซ็นต์ความคืบหน้าที่ไม่ได้ให้มา',
    ['weekly status report', 'รายงานผู้บริหาร', 'สรุป project handoff'],
    ['overall status จาก evidence', 'completed/in-progress/blockers', 'next milestones/risks'],
    'ตัวอย่าง: Completed = UAT 12/15 cases, Blocked = vendor firewall rule, Next = retry UAT วันศุกร์, Risk = go-live window จำกัด',
  ),
  REQUIREMENTS_TO_USER_STORIES: q(
    'ช่วยแปลง requirements เป็น user stories พร้อม acceptance criteria, dependencies และ open questions โดยรักษาขอบเขตจากต้นฉบับและไม่เพิ่ม feature ที่ไม่ได้ขอ',
    ['แตก requirement เป็น backlog', 'เตรียม sprint planning', 'ทำ acceptance criteria ให้ testable'],
    ['user stories', 'acceptance criteria', 'dependencies/ambiguities/open questions'],
    'ตัวอย่าง: ระบบต้องให้ผู้ใช้บันทึก Prompt เป็น Favorite และ filter เฉพาะ Favorite ได้ทั้ง desktop/mobile',
  ),
  CUSTOMER_FEEDBACK_SYNTHESIZER: q(
    'ช่วยสังเคราะห์ feedback หลายรายการเป็น themes, pain points, requests และ evidence frequency โดยไม่ตีความเสียงส่วนน้อยเป็นเสียงส่วนใหญ่โดยไม่มีข้อมูล',
    ['สรุป survey/feedback', 'หา recurring product pain points', 'เตรียม insight สำหรับ roadmap'],
    ['themes พร้อมตัวอย่าง evidence', 'frequency/segment เมื่อคำนวณได้', 'contradictions และ unknowns'],
    'ตัวอย่าง: feedback ลูกค้า 40 รายจาก support tickets ต้องการจัดกลุ่มเรื่อง login, performance, search และ mobile usability',
  ),
  SALES_DISCOVERY_PREP: q(
    'ช่วยเตรียม discovery meeting จาก account/context และเป้าหมาย โดยสร้างคำถามเพื่อเข้าใจ pain, process, impact, stakeholders และ decision criteria โดยไม่แต่งข้อมูลลูกค้า',
    ['เตรียม sales call', 'วางคำถาม discovery', 'หา information gaps ก่อน meeting'],
    ['known facts vs unknowns', 'discovery questions', 'hypotheses ที่ต้องยืนยันและ follow-up topics'],
    'ตัวอย่าง: Prospect = โรงงานหลายสาขา, สนใจ network monitoring, รู้เพียงว่าทีม IT มี 4 คนและมีปัญหา alert เยอะ',
  ),
  FINANCIAL_VARIANCE_NARRATIVE: q(
    'ช่วยอธิบาย financial variance จาก actual/budget/prior-period data โดยแยก driver ที่คำนวณได้จาก management explanation ที่ยังต้องยืนยัน และไม่แต่งเหตุผลธุรกิจ',
    ['monthly finance review', 'อธิบาย budget variance', 'ทำ narrative สำหรับ management report'],
    ['variance summary', 'quantified drivers', 'unexplained variance และ questions for validation'],
    'ตัวอย่าง: Revenue actual 12.5M vs budget 11.8M, gross margin ลด 2pp พร้อมข้อมูล volume/price/product mix ที่มี',
  ),
  STUDY_PLAN_GENERATOR: q(
    'ช่วยสร้างแผนเรียนจากหัวข้อ ระดับปัจจุบัน เป้าหมาย และเวลาที่มี โดยเรียง prerequisite, practice และ milestones ให้ทำตามได้จริง',
    ['เตรียมสอบ certification', 'เรียน skill ใหม่', 'จัดตาราง self-study'],
    ['topic roadmap', 'weekly practice schedule', 'milestones และ readiness checks'],
    'ตัวอย่าง: เป้าหมาย = CCNA, ระดับ = เข้าใจ VLAN เบื้องต้น, เวลา = 8 ชั่วโมง/สัปดาห์, ระยะเวลา = 12 สัปดาห์',
  ),
  MISCONCEPTION_DIAGNOSER: q(
    'ช่วยหาความเข้าใจผิดจากคำตอบ/คำอธิบายของผู้เรียน โดยระบุ concept gap และสร้างคำอธิบาย/แบบฝึกหัดแก้จุดนั้นแทนการบอกเพียงว่าผิด',
    ['ตรวจความเข้าใจหลังเรียน', 'แก้ misconception technical concept', 'สร้าง remedial exercise'],
    ['misconception ที่ตรวจพบ', 'correct mental model', 'targeted explanation/exercise/check question'],
    'ตัวอย่าง: ผู้เรียนบอกว่า “Trunk port อยู่ได้แค่ VLAN เดียวแต่ใช้ tag เพื่อส่งหลาย subnet” ให้ช่วยวิเคราะห์ว่าผิดตรงไหน',
  ),
  INTERVIEW_PREP_COACH: q(
    'ช่วยเตรียมสัมภาษณ์ตาม role, level และ job requirements โดยสร้างคำถามฝึก กรอบตอบ และ feedback criteria โดยไม่สร้างประสบการณ์ปลอมให้ผู้สมัคร',
    ['เตรียม technical interview', 'ฝึก behavioral questions', 'หา skill gaps จาก JD'],
    ['question set', 'answer framework/rubric', 'practice plan และ gaps ที่ควรทบทวน'],
    'ตัวอย่าง: Role = Network Engineer Junior, JD เน้น VLAN, OSPF, Cisco ISE, troubleshooting และ communication',
  ),
  CONTENT_REPURPOSING_PLANNER: q(
    'ช่วยวางแผนแปลง source content หนึ่งชิ้นเป็นหลาย format/channel โดยรักษา facts/message เดิมและปรับ structure/tone ตาม audience',
    ['แปลง webinar เป็น social posts', 'แปลงบทความเป็น newsletter', 'วาง content distribution plan'],
    ['channel-by-channel plan', 'key message per format', 'reuse boundaries และ CTA suggestions'],
    'ตัวอย่าง: Source = บทความ 1,500 คำเรื่อง Cybersecurity Awareness ต้องการ LinkedIn 3 โพสต์และ email newsletter 1 ฉบับ',
  ),
  SEO_CONTENT_REFRESH_AUDITOR: q(
    'ช่วย audit เนื้อหา SEO เดิมจาก content, target query และข้อมูล performance ที่ผู้ใช้มี เพื่อหา outdated sections, intent gaps, structure และ refresh priorities โดยไม่อ้าง ranking ที่ไม่ได้ให้',
    ['refresh evergreen article', 'ตรวจ search-intent drift', 'วาง update plan ก่อน rewrite'],
    ['content gaps/outdated claims', 'structure/metadata/internal-topic opportunities', 'prioritized refresh plan'],
    'ตัวอย่าง: บทความ “Best Network Monitoring Tools 2024” ต้องอัปเดตสำหรับ 2026 พร้อม query intent และ Search Console data ที่มี',
  ),
  TRANSLATION_QA_REVIEWER: q(
    'ช่วยตรวจคุณภาพคำแปลเทียบ source/target โดยดู meaning, omissions, terminology, tone, numbers และ formatting พร้อมเสนอแก้เฉพาะจุดที่มีปัญหา',
    ['review Thai-English translation', 'ตรวจ technical terminology', 'QA เอกสารก่อนเผยแพร่'],
    ['issue list by severity', 'source-target evidence', 'corrected wording และ consistency notes'],
    'ตัวอย่าง: Source ภาษาอังกฤษและคำแปลไทยของคู่มือ Cisco พร้อม glossary ที่กำหนดว่า VLAN/Trunk ให้คงภาษาอังกฤษ',
  ),
  DOCUMENT_CHANGE_IMPACT_ANALYZER: q(
    'ช่วยเปรียบเทียบเอกสารเวอร์ชันก่อน/หลังเพื่อหา change, affected requirements/processes/dependencies และสิ่งที่ต้องสื่อสาร โดยไม่ถือว่าทุก text diff มี business impact เท่ากัน',
    ['review policy change', 'ดูผลกระทบ requirement update', 'เตรียม change communication'],
    ['material changes', 'impacted areas/stakeholders', 'actions/questions ที่ต้องตามต่อ'],
    'ตัวอย่าง: เปรียบเทียบ SLA version 3 กับ version 4 ที่เปลี่ยน response time และ escalation path สำหรับ P1/P2',
  ),
  VIDEO_CHAPTER_GENERATOR: q(
    'ช่วยสร้าง chapter titles และ timestamps จาก transcript/video evidence ให้แบ่งตาม topic transition จริง และรักษาคำศัพท์/ชื่อสำคัญจากต้นฉบับ',
    ['สร้าง YouTube chapters', 'แบ่ง training video', 'ทำ navigation สำหรับ recording ยาว'],
    ['timestamped chapters', 'concise chapter titles', 'uncertain transitions ที่ต้องตรวจ'],
    'ตัวอย่าง: Transcript training 45 นาทีเรื่อง VLAN, Trunk, STP และ troubleshooting พร้อม timestamp ของแต่ละช่วง',
  ),
  TRAVEL_ITINERARY_OPTIMIZER: q(
    'ช่วยปรับ itinerary ที่มีอยู่ให้เดินทางสมเหตุผลขึ้นตาม location, time windows, preferences และ constraints พร้อม fallback โดยไม่แต่งเวลาเปิดหรือระยะทางที่ไม่ได้ให้',
    ['จัดลำดับสถานที่เที่ยว', 'ลด backtracking', 'สร้าง fallback เมื่อกิจกรรมใช้เวลานานกว่าคาด'],
    ['optimized day plan', 'geographic/time rationale', 'fallback options และข้อมูลที่ต้องตรวจสด'],
    'ตัวอย่าง: ระยอง 2 วัน มีสถานที่ A/B/C/D พร้อมพิกัด เวลาเปิด และอยากหลีกเลี่ยงขับรถย้อนเส้นทาง',
  ),
  PROMPT_EVALUATION_TEST_BUILDER: q(
    'ช่วยสร้างชุด evaluation cases และ rubric สำหรับ prompt โดยครอบคลุม normal, edge, adversarial และ missing-input scenarios เพื่อวัดคุณภาพอย่างทำซ้ำได้',
    ['สร้าง regression suite สำหรับ prompt', 'เปรียบเทียบ prompt versions', 'ทดสอบ structured output reliability'],
    ['test cases', 'expected properties/rubric', 'failure modes และ scoring guidance'],
    'ตัวอย่าง: Prompt สำหรับ network troubleshooting ต้องไม่เดา root cause เมื่อไม่มี logs และต้องขอเฉพาะข้อมูลที่ขาด',
  ),
  PROMPT_VARIABLE_SCHEMA_DESIGNER: q(
    'ช่วยออกแบบ variable schema สำหรับ reusable prompt จาก template/use cases โดยกำหนด key, type, required/default/options และ validation ที่ตรงกับ placeholders จริง',
    ['สร้าง prompt template ใหม่', 'ปรับ free-text prompt ให้เป็น reusable form', 'ตรวจ variable design ก่อนทำ UI'],
    ['variable schema', 'required/default/options rationale', 'placeholder mapping และ validation cases'],
    'ตัวอย่าง: Prompt วิเคราะห์ incident ต้องรับ incident, logs, environment optional และ output language ที่ default เป็น Thai',
  ),
});
