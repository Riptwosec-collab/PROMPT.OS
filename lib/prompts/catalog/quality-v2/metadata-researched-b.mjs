function m(purposeTh, useCasesTh, expectedOutputTh, exampleInputTh) {
  return Object.freeze({
    purposeTh,
    useCasesTh: Object.freeze(useCasesTh),
    inputGuideTh: Object.freeze({}),
    expectedOutputTh: Object.freeze(expectedOutputTh),
    exampleInputTh,
  });
}

export const RESEARCHED_QUALITY_METADATA_B = Object.freeze({
  KPI_VARIANCE_INVESTIGATOR: m(
    'ช่วยวิเคราะห์การเปลี่ยนแปลงของ KPI จากข้อมูลจริง โดยแยก movement, segment drivers, seasonality และ hypothesis ที่ยังต้องพิสูจน์',
    ['KPI ลดลงผิดปกติ', 'หา segment ที่เป็น driver', 'เตรียมคำถามสำหรับ root-cause analysis'],
    ['Verified KPI movement', 'Segment/driver analysis', 'Evidence, hypotheses และ next checks'],
    'ตัวอย่าง: Conversion rate ลดจาก 4.2% เป็น 3.5% หลัง release โดยมีข้อมูลแยก channel/device/region',
  ),
  EXPERIMENT_ANALYSIS_PLANNER: m(
    'ช่วยวางวิธีวิเคราะห์ experiment จาก hypothesis, metrics, segments และ statistical risks ก่อนสรุปผล เพื่อหลีกเลี่ยงการเลือก metric หลังเห็นข้อมูล',
    ['A/B test analysis plan', 'กำหนด primary/guardrail metrics', 'ตรวจ bias และ segmentation risk'],
    ['Hypothesis/metric plan', 'Statistical checks', 'Decision criteria และ caveats'],
    'ตัวอย่าง: A/B test checkout ใหม่ ต้องการวัด conversion พร้อม guardrail เรื่อง refund และ latency',
  ),
  FEATURE_LEAKAGE_AUDITOR: m(
    'ช่วยตรวจ data leakage ใน ML features โดยพิจารณาเวลา แหล่งข้อมูล target leakage และข้อมูลที่ไม่ควรมี ณ เวลาทำนาย',
    ['Model performance สูงผิดปกติ', 'Review feature set ก่อน train', 'ตรวจ temporal leakage'],
    ['Leakage candidates', 'Why each leaks future/target information', 'Safer feature alternatives และ validation'],
    'ตัวอย่าง: Predict churn โดย feature มี cancel_date และ refund_status ซึ่งเกิดหลัง label window',
  ),
  WORKFLOW_AUTOMATION_DESIGNER: m(
    'ช่วยออกแบบ workflow automation จาก trigger, states, approvals, retries, idempotency และ failure handling โดยไม่ข้าม human gate ที่จำเป็น',
    ['Automate back-office workflow', 'ออกแบบ approval flow', 'ลด manual repetitive steps'],
    ['Trigger/state model', 'Automation steps and gates', 'Failure/retry/idempotency handling'],
    'ตัวอย่าง: เมื่อ ticket priority P1 ถูกเปิด ให้แจ้ง Slack, assign on-call และสร้าง escalation ถ้าไม่มี ack ภายใน SLA',
  ),
  WEBHOOK_EVENT_FLOW_DESIGNER: m(
    'ช่วยออกแบบ event/webhook flow ให้รองรับ verification, ordering, retries, deduplication และ replay โดยเน้น contract ระหว่าง producer/consumer',
    ['Payment webhook', 'Git provider events', 'Event-driven integration'],
    ['Event contract', 'Verification/idempotency strategy', 'Retry/replay/error flow'],
    'ตัวอย่าง: Payment provider ส่ง paid/refunded events ซึ่งอาจ retry และมาถึงซ้ำ ต้องไม่เปลี่ยน order ซ้ำ',
  ),
  API_ERROR_TROUBLESHOOTER: m(
    'ช่วยไล่ API failure จาก request/response/error/context โดยแยก DNS/TLS/auth/validation/application/downstream layers และไม่เดาสาเหตุโดยไม่มีหลักฐาน',
    ['4xx/5xx error', 'API timeout', 'Unexpected response contract'],
    ['Observed request/response evidence', 'Likely failure layer', 'Safe tests และ next action'],
    'ตัวอย่าง: POST /orders ได้ 401 หลัง rotate token พร้อม request headers และ server log ที่เกี่ยวข้อง',
  ),
  SOP_BUILDER: m(
    'ช่วยเขียน Standard Operating Procedure จากกระบวนการจริง โดยกำหนด prerequisites, roles, steps, acceptance checks และ escalation ให้ทำซ้ำได้',
    ['งาน Helpdesk มาตรฐาน', 'ขั้นตอน onboarding', 'กระบวนการ operational ที่ต้อง audit ได้'],
    ['Purpose/scope', 'Step-by-step SOP', 'Checks, exceptions และ escalation'],
    'ตัวอย่าง: SOP สำหรับเตรียม notebook พนักงานใหม่ ตั้งแต่ asset check ถึง Entra/Intune enrollment',
  ),
  DECISION_MEMO_BUILDER: m(
    'ช่วยสร้าง decision memo ที่แยก decision, context, evidence, options, trade-offs และ unresolved risks เพื่อให้ผู้ตัดสินใจเห็นเหตุผลอย่างกระชับ',
    ['เสนอซื้อ tooling', 'เลือก architecture/vendor', 'สรุปทางเลือกให้ management'],
    ['Decision statement', 'Options/evidence/trade-offs', 'Recommendation rationale และ unresolved risks'],
    'ตัวอย่าง: เปรียบเทียบ monitoring tool 3 ตัวสำหรับ network/server โดยมี budget และ integration constraints',
  ),
  PROJECT_RISK_REGISTER: m(
    'ช่วยสร้าง risk register จาก project context โดยแยก risk, likelihood, impact, trigger, mitigation, owner และ residual risk โดยไม่สร้าง owner ที่ไม่ได้ระบุ',
    ['Project kickoff', 'Change program', 'ติดตาม delivery risks'],
    ['Risk register table', 'Triggers/mitigations', 'Unowned/unknown risks'],
    'ตัวอย่าง: โครงการ migrate Wi-Fi controller มี deadline, vendor dependency และ maintenance windows หลาย site',
  ),
  PROJECT_STATUS_REPORTER: m(
    'ช่วยแปลงข้อมูลสถานะโครงการเป็น executive update ที่แยก progress, milestone, blockers, risks และ decisions needed โดยไม่สร้างความคืบหน้าที่ไม่ได้รายงาน',
    ['Weekly project update', 'Steering committee report', 'สรุปสถานะหลาย workstream'],
    ['Overall status backed by evidence', 'Progress/blockers/risks', 'Decisions and next milestones'],
    'ตัวอย่าง: Workstream network เสร็จ 70%, security test รอ vendor, go-live ยังเป็นวันที่เดิมแต่มี risk สูงขึ้น',
  ),
  REQUIREMENTS_TO_USER_STORIES: m(
    'ช่วยแปลง requirements เป็น user stories และ acceptance criteria ที่ทดสอบได้ พร้อมชี้ ambiguity, dependency และ non-functional constraints',
    ['แตก PRD เป็น backlog', 'เตรียม sprint refinement', 'ทำ acceptance criteria ก่อน implement'],
    ['User stories', 'Acceptance criteria', 'Dependencies/ambiguities/non-functional requirements'],
    'ตัวอย่าง: ระบบต้องให้ Helpdesk บันทึก ticket, assign engineer, track SLA และ export Excel',
  ),
  CUSTOMER_FEEDBACK_SYNTHESIZER: m(
    'ช่วยสังเคราะห์ feedback หลายรายการเป็น themes, frequency, severity และ evidence โดยไม่ตีความข้อความหนึ่งให้แทนผู้ใช้ทั้งหมด',
    ['สรุป survey/comments', 'หา recurring pain points', 'เตรียม product insight'],
    ['Feedback themes', 'Representative evidence', 'Frequency/severity signals และ open questions'],
    'ตัวอย่าง: วาง feedback 50 รายการจากลูกค้าเรื่อง onboarding และค้นหาปัญหาที่เกิดซ้ำ',
  ),
  SALES_DISCOVERY_PREP: m(
    'ช่วยเตรียม sales discovery จากข้อมูล account ที่มี โดยสร้าง hypotheses และคำถาม ไม่แกล้งรู้ข้อมูลลูกค้าที่ไม่ได้ให้มา',
    ['เตรียม discovery call', 'วางคำถามก่อน meeting', 'หา business/technical risks ที่ควรถาม'],
    ['Known facts vs hypotheses', 'Discovery questions', 'Risks, stakeholders และ desired outcomes'],
    'ตัวอย่าง: Account เป็นโรงงานหลาย site ใช้ Microsoft 365 และมี project network refresh แต่ยังไม่ทราบ budget/timeline',
  ),
  FINANCIAL_VARIANCE_NARRATIVE: m(
    'ช่วยอธิบาย variance ทางการเงินจากตัวเลขที่ให้มาโดยแยก amount, percentage, drivers และสิ่งที่ยังต้องตรวจ ไม่สร้างเหตุผลจากตัวเลขเพียงอย่างเดียว',
    ['Budget vs actual', 'Monthly finance commentary', 'อธิบาย cost/revenue variance'],
    ['Variance summary', 'Evidence-backed drivers', 'Unknowns and verification questions'],
    'ตัวอย่าง: Cloud cost เดือนนี้ 185,000 บาท เทียบ budget 150,000 บาท พร้อม breakdown by service',
  ),
  STUDY_PLAN_GENERATOR: m(
    'ช่วยสร้างแผนเรียนจากเป้าหมาย ระดับ เวลา และ deadline โดยแบ่ง topic, practice, review และ milestones ให้ทำตามได้จริง',
    ['เตรียมสอบ certification', 'เรียน skill ใหม่', 'จัดเวลา self-study'],
    ['Study phases', 'Weekly topics/practice', 'Milestones และ readiness checks'],
    'ตัวอย่าง: เป้าหมาย CCNA ภายใน 12 สัปดาห์ มีเวลา 8 ชั่วโมงต่อสัปดาห์และพื้นฐาน network ระดับเริ่มต้น',
  ),
  MISCONCEPTION_DIAGNOSER: m(
    'ช่วยวิเคราะห์คำตอบหรือเหตุผลของผู้เรียนเพื่อหา misconception ที่เฉพาะเจาะจง แล้วอธิบายแนวคิดที่ถูกพร้อมคำถามตรวจความเข้าใจ',
    ['แก้ความเข้าใจผิดหลัง quiz', 'ติว concept ยาก', 'หาว่าผู้เรียนพลาดตรง reasoning ขั้นไหน'],
    ['Detected misconception', 'Correct concept/explanation', 'Check question or exercise'],
    'ตัวอย่าง: ผู้เรียนคิดว่า access port สามารถส่งหลาย VLAN แบบ tagged ได้เหมือน trunk port',
  ),
  INTERVIEW_PREP_COACH: m(
    'ช่วยเตรียม interview ตาม role และประสบการณ์จริง โดยสร้างคำถาม ฝึกตอบ และ feedback โดยไม่แต่งประสบการณ์ที่ผู้สมัครไม่มี',
    ['เตรียม technical interview', 'ฝึก behavioral questions', 'สร้าง mock interview ตาม job description'],
    ['Question set', 'Answer structure based on real experience', 'Gaps and practice priorities'],
    'ตัวอย่าง: Role Network Engineer, ประสบการณ์ Helpdesk/IT Support และทำ VLAN, Cisco, Entra/Intune ในงานปัจจุบัน',
  ),
  CONTENT_REPURPOSING_PLANNER: m(
    'ช่วยแตก content ต้นฉบับเป็นหลาย format/platform โดยรักษา message หลักและปรับความยาว/โทนให้เหมาะกับแต่ละช่องทาง',
    ['Blog → LinkedIn/X', 'Webinar → posts/email', 'รายงาน → executive summary'],
    ['Repurposing map', 'Platform-specific angles', 'Content reuse checklist'],
    'ตัวอย่าง: บทความยาวเรื่อง Zero Trust ต้องการแตกเป็น LinkedIn 3 โพสต์, email และ short script',
  ),
  SEO_CONTENT_REFRESH_AUDITOR: m(
    'ช่วย audit เนื้อหา SEO เดิมจาก content และข้อมูลที่ให้มาเพื่อหา outdated sections, intent mismatch, coverage gaps และ refresh priorities โดยไม่อ้าง ranking ที่ไม่ได้ให้',
    ['อัปเดตบทความเก่า', 'Review SEO content ก่อน rewrite', 'หา content gap ตาม keyword intent'],
    ['Refresh audit', 'Priority sections and gaps', 'Metadata/internal-link/FAQ suggestions'],
    'ตัวอย่าง: บทความ Cisco VLAN ปี 2023 พร้อม target keywords และข้อมูล Search Console ที่ผู้ใช้แนบ',
  ),
  TRANSLATION_QA_REVIEWER: m(
    'ช่วย review งานแปลเทียบ source/target เพื่อหาความหมายตกหล่น terminology inconsistency tone และ formatting issues โดยรักษาชื่อ ตัวเลข และ technical terms',
    ['QA เอกสารแปล', 'ตรวจ Thai/English technical content', 'Review localization ก่อน publish'],
    ['Meaning/terminology issues', 'Severity and corrected wording', 'Consistency/style notes'],
    'ตัวอย่าง: Source English คู่มือ Cisco กับฉบับแปลไทย ต้องการตรวจ technical terms และค่าตัวเลขไม่ให้ผิด',
  ),
  DOCUMENT_CHANGE_IMPACT_ANALYZER: m(
    'ช่วยเปรียบเทียบเอกสารสองเวอร์ชันแล้วอธิบาย change, affected requirements, downstream impact และคำถามที่ต้องยืนยัน โดยไม่ถือว่าการเปลี่ยนคำทุกจุดมี impact เท่ากัน',
    ['Compare policy versions', 'Review PRD/spec changes', 'ประเมิน impact ก่อน implement'],
    ['Change summary', 'Affected requirements/flows', 'Risk and follow-up questions'],
    'ตัวอย่าง: เปรียบเทียบ network change procedure v2 กับ v3 ที่เพิ่ม approval และ rollback requirements',
  ),
  VIDEO_CHAPTER_GENERATOR: m(
    'ช่วยแบ่งวิดีโอหรือ transcript เป็น chapters จากหัวข้อที่เปลี่ยนจริง พร้อม title และ timestamp โดยไม่สร้างช่วงเวลาที่ไม่มีข้อมูล',
    ['ทำ YouTube chapters', 'แบ่ง training recording', 'สร้าง navigation จาก transcript'],
    ['Chapter titles', 'Start timestamps', 'Short chapter summaries'],
    'ตัวอย่าง: Transcript พร้อม timestamps ของ training 45 นาทีเรื่อง VLAN, STP และ troubleshooting',
  ),
  TRAVEL_ITINERARY_OPTIMIZER: m(
    'ช่วยปรับ itinerary ที่มีอยู่ให้สมเหตุสมผลด้านภูมิศาสตร์ เวลา opening constraints และ fallback โดยไม่อ้างเวลาหรือระยะทางสดถ้าไม่ได้ให้ข้อมูล',
    ['ลดการเดินทางย้อนเส้น', 'จัดลำดับสถานที่ตามเวลา', 'เพิ่ม fallback สำหรับแผนเที่ยว'],
    ['Optimized itinerary', 'Reasoning for grouping/order', 'Constraint conflicts and fallback options'],
    'ตัวอย่าง: ระยอง 2 วัน มีรายชื่อ 10 จุด เวลาเปิดปิด และโรงแรม ต้องการจัดเส้นทางไม่ย้อน',
  ),
  PROMPT_EVALUATION_TEST_BUILDER: m(
    'ช่วยสร้างชุด test cases และ evaluation rubric สำหรับ prompt โดยครอบคลุม normal, edge, adversarial และ missing-input scenarios',
    ['ทดสอบ prompt ก่อน publish', 'สร้าง regression eval', 'เปรียบเทียบ prompt versions'],
    ['Evaluation cases', 'Expected properties/rubric', 'Failure conditions and scoring guidance'],
    'ตัวอย่าง: Prompt network troubleshooter ต้องไม่เดา root cause เมื่อ logs ไม่พอ และต้องขอเฉพาะ input ที่ขาด',
  ),
  PROMPT_VARIABLE_SCHEMA_DESIGNER: m(
    'ช่วยออกแบบ variable schema ของ reusable prompt ให้ชนิดข้อมูล required/default/options สอดคล้องกับ template และใช้งานใน UI ได้จริง',
    ['แปลง prompt เป็น template', 'ออกแบบ form variables', 'ตรวจ placeholder/config consistency'],
    ['Variable definitions', 'Required/default/options guidance', 'Template mapping and validation rules'],
    'ตัวอย่าง: Prompt วิเคราะห์ incident ต้องมี incident textarea, logs textarea, environment optional และ language select',
  ),
});
