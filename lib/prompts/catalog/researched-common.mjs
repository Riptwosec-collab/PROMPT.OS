export const RESEARCHED_CATALOG_VERSION = '2026-09-16-ai-library-v4-researched-50';

const CREATED_AT = '2026-09-16T13:20:00.000Z';
const UPDATED_AT = CREATED_AT;

const TOP_20 = new Set([
  'INCIDENT_TRIAGE_COORDINATOR', 'NETWORK_TROUBLESHOOTER', 'THREAT_MODEL_BUILDER',
  'CLOUD_ARCHITECTURE_REVIEWER', 'WORKFLOW_AUTOMATION_DESIGNER', 'PROMPT_EVALUATION_TEST_BUILDER',
  'CODEBASE_ONBOARDING_GUIDE', 'DATABASE_MIGRATION_PLANNER', 'KPI_VARIANCE_INVESTIGATOR',
  'CUSTOMER_FEEDBACK_SYNTHESIZER', 'DECISION_MEMO_BUILDER', 'RUNBOOK_GENERATOR',
  'API_INTEGRATION_PLANNER', 'PROJECT_RISK_REGISTER', 'RESEARCH_QUESTION_REFINER',
  'LITERATURE_SYNTHESIS_MATRIX', 'FINANCIAL_VARIANCE_NARRATIVE', 'TRANSLATION_QA_REVIEWER',
  'DOCUMENT_CHANGE_IMPACT_ANALYZER', 'PROMPT_VARIABLE_SCHEMA_DESIGNER',
]);

const CATEGORY_THAI = Object.freeze({
  Research: 'วิจัย',
  'Software Engineering': 'วิศวกรรมซอฟต์แวร์',
  'API Development': 'พัฒนา API',
  DevOps: 'DevOps',
  Networking: 'เครือข่าย',
  Cybersecurity: 'ความปลอดภัยไซเบอร์',
  Cloud: 'คลาวด์',
  Database: 'ฐานข้อมูล',
  'Data Analysis': 'วิเคราะห์ข้อมูล',
  'Data Science': 'วิทยาการข้อมูล',
  Automation: 'ระบบอัตโนมัติ',
  Productivity: 'เพิ่มประสิทธิภาพการทำงาน',
  'Decision Support': 'สนับสนุนการตัดสินใจ',
  'Project Management': 'บริหารโครงการ',
  'Product Management': 'บริหารผลิตภัณฑ์',
  Business: 'ธุรกิจ',
  Finance: 'การเงิน',
  Education: 'การศึกษา',
  Career: 'อาชีพ',
  'Content Creation': 'สร้างคอนเทนต์',
  SEO: 'SEO',
  Translation: 'การแปล',
  'Document Analysis': 'วิเคราะห์เอกสาร',
  'Video Analysis': 'วิเคราะห์วิดีโอ',
  Travel: 'ท่องเที่ยว',
  'Prompt Engineering': 'วิศวกรรมพรอมต์',
});

function collectionsFor(category, name) {
  const collections = ['AI Prompt Library'];
  if (TOP_20.has(name)) collections.push('Popular AI Prompts');
  if (category === 'Research') collections.push('Research Toolkit');
  if (['Software Engineering', 'API Development', 'DevOps', 'Networking', 'Cybersecurity', 'Cloud', 'Database', 'Automation', 'Prompt Engineering'].includes(category)) collections.push('Developer Toolkit');
  if (['Data Analysis', 'Data Science', 'Finance'].includes(category)) collections.push('Data & Analysis');
  if (['Video Analysis', 'Document Analysis'].includes(category)) collections.push('Multimodal AI');
  if (['Content Creation', 'SEO', 'Translation'].includes(category)) collections.push('Content Creator');
  if (['Productivity', 'Decision Support', 'Project Management', 'Product Management', 'Business', 'Career', 'Travel'].includes(category)) collections.push('Productivity');
  if (category === 'Education') collections.push('Learning');
  return [...new Set(collections)];
}

function usageGuides(variableConfig) {
  const entries = Object.entries(variableConfig);
  const required = entries.filter(([name, cfg]) => name !== 'language' && cfg.required);
  const optional = entries.filter(([name, cfg]) => name !== 'language' && !cfg.required);
  const requiredEn = required.length ? required.map(([name, cfg]) => `${cfg.label || name} ({{${name}}})`).join(', ') : 'no additional required text fields';
  const requiredTh = required.length ? required.map(([name, cfg]) => `${cfg.labelTh || cfg.label || name} ({{${name}}})`).join(', ') : 'ไม่มีช่องข้อความบังคับเพิ่มเติม';
  const optionalEn = optional.length ? optional.map(([name, cfg]) => `${cfg.label || name} ({{${name}}})`).join(', ') : 'none';
  const optionalTh = optional.length ? optional.map(([name, cfg]) => `${cfg.labelTh || cfg.label || name} ({{${name}}})`).join(', ') : 'ไม่มี';

  return {
    en: [
      'HOW TO USE PROMPT',
      `1. Fill the required input: ${requiredEn}.`,
      `2. Add optional context when useful: ${optionalEn}.`,
      '3. Choose the output language. Thai is selected by default.',
      '4. Run the prompt and verify high-impact conclusions against the supplied source data before acting.',
    ].join('\n'),
    th: [
      'วิธีใช้พรอมต์',
      `1. กรอกข้อมูลที่จำเป็น: ${requiredTh}`,
      `2. เพิ่มข้อมูลเสริมเมื่อมี: ${optionalTh}`,
      '3. เลือกภาษาผลลัพธ์ โดยค่าเริ่มต้นเป็นภาษาไทย',
      '4. กดรันพรอมต์ และตรวจสอบข้อสรุปสำคัญกับข้อมูลต้นทางก่อนนำไปใช้จริง',
    ].join('\n'),
  };
}

function executablePrompt(rawPrompt, variableConfig) {
  const required = Object.entries(variableConfig)
    .filter(([name, cfg]) => name !== 'language' && cfg.required)
    .map(([name]) => `- {{${name}}}`);

  return `You are executing a reusable production prompt template.\n\nOUTPUT LANGUAGE\nRespond in {{language}}. Keep code, commands, identifiers, JSON keys, product names, and technical terms in their original form when translating them would reduce accuracy.\n\nINPUT VALIDATION\nRequired inputs for this template:\n${required.length ? required.join('\n') : '- No additional text fields are required.'}\n\nBefore doing the task, check whether any required field is blank or still displayed as an unresolved placeholder token. If any required input is missing, do not guess. Ask the user only for the missing input(s), then stop.\n\nRELIABILITY RULES\n- Do not invent facts, sources, measurements, dates, code behavior, or file contents.\n- Clearly distinguish provided information from assumptions or inference.\n- Follow the requested output format exactly when one is specified.\n- Preserve important names, numbers, code, URLs, and quoted source material accurately.\n- If the task depends on an image, video, audio file, document, source text, or code that was not actually provided, ask for it instead of pretending to analyze it.\n\nTASK\n${rawPrompt}\n\nFINAL CHECK\nBefore answering, verify that every requested section is present and that no required input was silently fabricated.`;
}

export function buildResearchedPrompt(spec) {
  const variableConfig = Object.fromEntries((spec.v || []).map(([name, type, label, labelTh, required, defaultValue, options]) => {
    const value = name === 'language' ? 'Thai' : defaultValue;
    const config = { type, required: Boolean(required), defaultValue: value, label, labelTh };
    if (Array.isArray(options) && options.length) {
      config.options = name === 'language' ? ['Thai', ...options.filter((item) => item !== 'Thai')] : options;
    }
    return [name, config];
  }));

  const variables = Object.fromEntries(Object.entries(variableConfig).map(([name, config]) => [name, config.defaultValue ?? '']));
  const usage = usageGuides(variableConfig);

  return Object.freeze({
    id: `ai-lib-${String(spec.n).toLowerCase().replace(/_/g, '-')}`,
    name: spec.n,
    displayTitle: spec.en,
    displayTitleTh: spec.th,
    title: spec.en,
    description: spec.de,
    descriptionTh: spec.dt,
    usageGuideEn: usage.en,
    usageGuideTh: usage.th,
    useCase: spec.u,
    whenToUse: spec.w,
    category: spec.c,
    categoryTh: CATEGORY_THAI[spec.c] || spec.c,
    subcategory: spec.s || '',
    promptType: String(spec.c || 'text').toLowerCase(),
    type: 'text',
    prompt: executablePrompt(spec.p, variableConfig),
    variables,
    variableConfig,
    tags: [...new Set([...(spec.t || []), spec.n, 'EXECUTABLE'])],
    collections: collectionsFor(spec.c, spec.n),
    language: 'Multi-language',
    outputFormat: spec.f || 'Structured response',
    compatibleModels: Array.isArray(spec.m) && spec.m.length ? spec.m : ['GPT', 'Claude', 'Gemini'],
    exampleInput: spec.x || usage.en,
    exampleOutput: spec.o || '',
    sourceType: spec.st || 'Original Synthesis',
    sourceInspiration: Array.isArray(spec.r) ? spec.r : [],
    difficulty: spec.d || 'Intermediate',
    estimatedValue: spec.e || 'High',
    whyAdd: spec.y || '',
    catalogManaged: true,
    catalogVersion: RESEARCHED_CATALOG_VERSION,
    version: '2.0.0',
    status: 'published',
    runs: 0,
    results: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  });
}
