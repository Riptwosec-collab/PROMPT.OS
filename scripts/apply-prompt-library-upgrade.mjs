import fs from 'node:fs';

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(search, replacement);
}

function replaceRegexOnce(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Missing regex patch anchor: ${label}`);
  return source.replace(pattern, replacement);
}

const promptPath = 'components/PromptOS.jsx';
let source = fs.readFileSync(promptPath, 'utf8');

source = replaceOnce(
  source,
  "import { streamAiRun } from '../lib/ai/run-stream.mjs';\n",
  "import { streamAiRun } from '../lib/ai/run-stream.mjs';\nimport { AI_PROMPT_COLLECTIONS, AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION, getVariableInputKind, mergePromptCatalog } from '../lib/prompts/ai-prompt-library.mjs';\nimport { confirmDestructiveAction } from '../lib/ui/confirm-delete.mjs';\n",
  'PromptOS catalog imports',
);

source = replaceOnce(source, 'const SCHEMA_VERSION = 3;', 'const SCHEMA_VERSION = 4;', 'schema version');
source = replaceOnce(
  source,
  "const DEFAULT_COLLECTIONS = ['General', 'Coding', 'Image', 'Work'];",
  "const DEFAULT_COLLECTIONS = [...new Set(['General', 'Coding', 'Image', 'Work', ...AI_PROMPT_COLLECTIONS])];",
  'default collections',
);

source = replaceOnce(
  source,
  `function nextVersion(current = '1.0') {\n  const parts = String(current).split('.');\n  const major = Number(parts[0]) || 1;\n  const minor = Number(parts[1]) || 0;\n  return \`${'${major}.${minor + 1}'}\`;\n}`,
  `function nextVersion(current = '1.0') {\n  const parts = String(current).split('.');\n  const major = Number(parts[0]) || 1;\n  const minor = Number(parts[1]) || 0;\n  if (parts.length >= 3) return \`${'${major}.${minor + 1}.0'}\`;\n  return \`${'${major}.${minor + 1}'}\`;\n}`,
  'semantic version bump',
);

source = replaceOnce(
  source,
  `  return {\n    id: prompt.id ?? Date.now() + index,\n    title: prompt.title || 'UNTITLED_PROMPT',`,
  `  return {\n    id: prompt.id ?? Date.now() + index,\n    name: prompt.name || prompt.title || 'UNTITLED_PROMPT',\n    displayTitle: prompt.displayTitle || prompt.title || prompt.name || 'UNTITLED_PROMPT',\n    subcategory: prompt.subcategory || '',\n    promptType: prompt.promptType || prompt.type || 'text',\n    language: prompt.language || 'Multi-language',\n    outputFormat: prompt.outputFormat || '',\n    compatibleModels: Array.isArray(prompt.compatibleModels) ? prompt.compatibleModels : [],\n    exampleInput: prompt.exampleInput || '',\n    exampleOutput: prompt.exampleOutput || '',\n    sourceType: prompt.sourceType || '',\n    variableConfig: prompt.variableConfig && typeof prompt.variableConfig === 'object' ? prompt.variableConfig : {},\n    title: prompt.title || prompt.displayTitle || prompt.name || 'UNTITLED_PROMPT',`,
  'prompt metadata preservation',
);

source = replaceRegexOnce(
  source,
  /function normalizeDatabase\(raw\) \{[\s\S]*?\n\}\n\nfunction loadDatabase/,
  `function applyPromptCatalog(prompts = [], catalogVersion = null) {\n  const upgraded = prompts.map(upgradePrompt);\n  if (catalogVersion === PROMPT_CATALOG_VERSION) return upgraded;\n  return mergePromptCatalog(upgraded, AI_PROMPT_LIBRARY).map(upgradePrompt);\n}\n\nfunction normalizeDatabase(raw) {\n  if (Array.isArray(raw)) {\n    return {\n      schemaVersion: SCHEMA_VERSION,\n      catalogVersion: PROMPT_CATALOG_VERSION,\n      collections: DEFAULT_COLLECTIONS,\n      prompts: applyPromptCatalog(raw),\n    };\n  }\n\n  if (raw && typeof raw === 'object' && Array.isArray(raw.prompts)) {\n    const prompts = applyPromptCatalog(raw.prompts, raw.catalogVersion);\n    return {\n      schemaVersion: SCHEMA_VERSION,\n      catalogVersion: PROMPT_CATALOG_VERSION,\n      collections: Array.from(new Set([...(raw.collections || []), ...DEFAULT_COLLECTIONS, ...prompts.flatMap((prompt) => prompt.collections || [])])),\n      prompts,\n    };\n  }\n\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    catalogVersion: PROMPT_CATALOG_VERSION,\n    collections: DEFAULT_COLLECTIONS,\n    prompts: applyPromptCatalog(DEFAULT_PROMPTS),\n  };\n}\n\nfunction loadDatabase`,
  'database normalization and one-time catalog migration',
);

source = replaceOnce(
  source,
  `  return {\n    schemaVersion: SCHEMA_VERSION,\n    exportedAt: nowIso(),`,
  `  return {\n    schemaVersion: SCHEMA_VERSION,\n    catalogVersion: PROMPT_CATALOG_VERSION,\n    exportedAt: nowIso(),`,
  'serialized catalog version',
);

source = replaceOnce(
  source,
  `      const searchable = [\n        prompt.title,\n        prompt.description,\n        prompt.prompt,\n        prompt.category,`,
  `      const searchable = [\n        prompt.title,\n        prompt.name,\n        prompt.displayTitle,\n        prompt.description,\n        prompt.prompt,\n        prompt.category,\n        prompt.subcategory,\n        prompt.outputFormat,\n        ...(prompt.compatibleModels || []),`,
  'catalog-aware search metadata',
);

source = replaceOnce(
  source,
  "    if (!window.confirm(`Move ${prompt.title} to Trash?`)) return;",
  "    if (!confirmDestructiveAction(window.confirm, `Move ${prompt.title} to Trash?`, `Confirm again: move ${prompt.title} to Trash?`)) return;",
  'two-step soft delete',
);

source = replaceOnce(
  source,
  "    if (!window.confirm(`Delete ${prompt?.title || 'this prompt'} forever? This cannot be undone.`)) return;",
  "    if (!confirmDestructiveAction(window.confirm, `Delete ${prompt?.title || 'this prompt'} forever? This cannot be undone.`, `FINAL CONFIRMATION: permanently delete ${prompt?.title || 'this prompt'}?`)) return;",
  'two-step permanent delete',
);

source = replaceOnce(
  source,
  '<PromptDetail prompt={activePrompt} onUpdate={updatePrompt} />',
  '<PromptDetail prompt={activePrompt} onUpdate={updatePrompt} onEdit={(item) => openEditModal(item)} />',
  'prompt detail edit action wiring',
);

source = replaceOnce(source, 'function PromptDetail({ prompt, onUpdate }) {', 'function PromptDetail({ prompt, onUpdate, onEdit }) {', 'prompt detail signature');

source = replaceOnce(
  source,
  `  const renderedPrompt = useMemo(() => renderPromptVariables(prompt.prompt, prompt.variables), [prompt.prompt, prompt.variables]);\n\n  const update = (updates) => onUpdate({ ...prompt, ...updates, updatedAt: nowIso() });`,
  `  const renderedPrompt = useMemo(() => renderPromptVariables(prompt.prompt, prompt.variables), [prompt.prompt, prompt.variables]);\n  const [copiedPrompt, setCopiedPrompt] = useState(false);\n\n  const update = (updates) => onUpdate({ ...prompt, ...updates, updatedAt: nowIso() });\n  const copyPrompt = async () => {\n    await navigator.clipboard.writeText(renderedPrompt);\n    setCopiedPrompt(true);\n    update({ copyCount: (prompt.copyCount || 0) + 1 });\n    setTimeout(() => setCopiedPrompt(false), 1400);\n  };`,
  'prompt detail copy action',
);

source = replaceOnce(
  source,
  `<div className="flex gap-2 items-center flex-wrap"><Badge>{prompt.type.toUpperCase()}</Badge><Badge>v{prompt.version}</Badge>{prompt.pinned && <Badge>PINNED</Badge>}{prompt.favorite && <Badge>FAVORITE</Badge>}</div>`,
  `<div className="flex gap-2 items-center flex-wrap"><Badge>{prompt.type.toUpperCase()}</Badge><Badge>{prompt.category}</Badge><Badge>{prompt.status}</Badge><Badge>v{prompt.version}</Badge>{prompt.pinned && <Badge>PINNED</Badge>}{prompt.favorite && <Badge>FAVORITE</Badge>}</div>`,
  'prompt detail badges',
);

source = replaceOnce(
  source,
  `<p className="text-sm text-cyan-700 mt-1">{prompt.description}</p>`,
  `<p className="text-sm text-cyan-700 mt-1">{prompt.description}</p>\n            <div className="flex flex-wrap gap-1.5 mt-2">{prompt.tags?.map((tag) => <span key={tag} className="text-[9px] font-mono text-cyan-500 border border-cyan-900/50 px-2 py-0.5">{tag}</span>)}</div>\n            {!!prompt.compatibleModels?.length && <p className="text-[10px] font-mono text-cyan-800 mt-2">COMPATIBLE_MODELS: {prompt.compatibleModels.join(' / ')}</p>}`,
  'prompt detail tags and model compatibility',
);

source = replaceOnce(
  source,
  `<div className="flex flex-wrap gap-2 text-[10px] font-mono text-cyan-700"><span>RUNS {prompt.runs || 0}</span><span>COPIES {prompt.copyCount || 0}</span><span>RESULTS {prompt.results?.length || 0}</span><span>HEALTH {health.score}/{health.max}</span></div>`,
  `<div className="flex flex-col lg:items-end gap-3">\n            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-cyan-700"><span>RUNS {prompt.runs || 0}</span><span>COPIES {prompt.copyCount || 0}</span><span>RESULTS {prompt.results?.length || 0}</span><span>HEALTH {health.score}/{health.max}</span></div>\n            <div className="flex flex-wrap gap-2">\n              <button onClick={copyPrompt} className="px-4 py-2 bg-cyan-500 text-black border border-cyan-300 text-[10px] font-mono font-bold tracking-widest hover:bg-cyan-300">{copiedPrompt ? 'COPIED' : 'COPY PROMPT'}</button>\n              <button onClick={() => onEdit?.(prompt)} className="px-4 py-2 border border-amber-700 text-amber-400 text-[10px] font-mono hover:border-amber-400">EDIT</button>\n              <button onClick={() => update({ favorite: !prompt.favorite })} className={\`px-4 py-2 border text-[10px] font-mono ${'${prompt.favorite ? \'border-amber-400 text-amber-300 bg-amber-950/20\' : \'border-cyan-900 text-cyan-600 hover:border-cyan-500\'}'}\`}>FAVORITE</button>\n            </div>\n          </div>`,
  'prompt detail primary actions',
);

source = replaceOnce(
  source,
  `        <div className="space-y-5">\n          <Panel title={\`PROMPT_HEALTH ${'${health.score}/${health.max}'}\`}>`,
  `        <div className="space-y-5">\n          <Panel title="PROMPT_METADATA">\n            <div className="space-y-2 text-[10px] font-mono">\n              <MetaRow label="CATEGORY" value={prompt.category || '-'} />\n              <MetaRow label="STATUS" value={prompt.status || '-'} />\n              <MetaRow label="LANGUAGE" value={prompt.language || '-'} />\n              <MetaRow label="OUTPUT_FORMAT" value={prompt.outputFormat || '-'} />\n              <MetaRow label="COMPATIBLE_MODELS" value={(prompt.compatibleModels || []).join(' / ') || '-'} />\n              <MetaRow label="SOURCE_TYPE" value={prompt.sourceType || '-'} />\n            </div>\n            {!!prompt.exampleInput && <div className="mt-3"><p className="text-[9px] text-cyan-700">EXAMPLE_INPUT</p><p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{prompt.exampleInput}</p></div>}\n            {!!prompt.exampleOutput && <div className="mt-3"><p className="text-[9px] text-cyan-700">EXAMPLE_OUTPUT</p><p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{prompt.exampleOutput}</p></div>}\n          </Panel>\n          <Panel title={\`PROMPT_HEALTH ${'${health.score}/${health.max}'}\`}>`,
  'prompt metadata panel',
);

source = replaceRegexOnce(
  source,
  /          <Panel title=\{`VARIABLES \$\{variables\.length\}`\}>[\s\S]*?          <\/Panel>/,
  `          <Panel title={\`VARIABLES ${'${variables.length}'}\`}>\n            {variables.length === 0 ? <p className="text-xs text-gray-600">Use {'{{variable}}'} inside the prompt to create reusable fields.</p> : <div className="space-y-3">{variables.map((key) => <VariableInput key={key} name={key} value={prompt.variables?.[key] || ''} onChange={(value) => onUpdate({ variables: { ...(prompt.variables || {}), [key]: value } })} />)}</div>}\n          </Panel>`,
  'smart variable inputs',
);

source = replaceOnce(
  source,
  `function BuilderTab({ prompt, onUpdate }) {`,
  `function VariableInput({ name, value, onChange }) {\n  const kind = getVariableInputKind(name);\n  const sharedClass = 'w-full mt-1 bg-black border border-cyan-900 text-cyan-300 p-2 text-xs outline-none focus:border-cyan-500';\n  const label = <span className="text-[10px] font-mono text-cyan-700">{name.toUpperCase()}</span>;\n\n  if (kind === 'textarea') return <label className="block">{label}<textarea rows="4" value={value} onChange={(event) => onChange(event.target.value)} className={\`${'${sharedClass}'} resize-y\`} /></label>;\n  if (kind === 'number') return <label className="block">{label}<input type="number" min="1" value={value} onChange={(event) => onChange(event.target.value)} className={sharedClass} /></label>;\n  if (kind === 'language') return <label className="block">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={sharedClass}><option value="">AUTO</option><option>English</option><option>Thai</option><option>Multi-language</option></select></label>;\n  if (kind === 'tone') return <label className="block">{label}<input list="prompt-tone-options" value={value} onChange={(event) => onChange(event.target.value)} className={sharedClass} /><datalist id="prompt-tone-options"><option value="Professional" /><option value="Friendly" /><option value="Formal" /><option value="Casual" /><option value="Persuasive" /><option value="Neutral" /></datalist></label>;\n  return <label className="block">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className={sharedClass} /></label>;\n}\n\nfunction BuilderTab({ prompt, onUpdate }) {`,
  'VariableInput component',
);

fs.writeFileSync(promptPath, source);

const i18nPath = 'lib/i18n/runtime.mjs';
let i18n = fs.readFileSync(i18nPath, 'utf8');

i18n = replaceOnce(
  i18n,
  "  COPY: 'คัดลอก',\n",
  "  COPY: 'คัดลอก',\n  'COPY PROMPT': 'คัดลอกพรอมต์',\n  PROMPT_METADATA: 'ข้อมูลพรอมต์',\n  LANGUAGE: 'ภาษา',\n  OUTPUT_FORMAT: 'รูปแบบผลลัพธ์',\n  COMPATIBLE_MODELS: 'โมเดลที่รองรับ',\n  SOURCE_TYPE: 'แหล่งที่มา',\n  EXAMPLE_INPUT: 'ตัวอย่างข้อมูลเข้า',\n  EXAMPLE_OUTPUT: 'ตัวอย่างผลลัพธ์',\n  published: 'เผยแพร่แล้ว',\n",
  'i18n prompt metadata labels',
);

i18n = replaceOnce(
  i18n,
  "  Work: 'งาน',\n  'Image Generation': 'สร้างรูปภาพ',\n",
  "  Work: 'งาน',\n  Research: 'วิจัย',\n  DevOps: 'เดฟออปส์',\n  Database: 'ฐานข้อมูล',\n  Data: 'ข้อมูล',\n  Vision: 'วิชัน',\n  Video: 'วิดีโอ',\n  Audio: 'เสียง',\n  Writing: 'การเขียน',\n  Marketing: 'การตลาด',\n  Productivity: 'ประสิทธิภาพงาน',\n  Education: 'การศึกษา',\n  'AI Prompt Library': 'คลังพรอมต์ AI',\n  'Popular AI Prompts': 'พรอมต์ AI ยอดนิยม',\n  'Research Toolkit': 'ชุดเครื่องมือวิจัย',\n  'Developer Toolkit': 'ชุดเครื่องมือนักพัฒนา',\n  'Data & Analysis': 'ข้อมูลและการวิเคราะห์',\n  'Multimodal AI': 'AI มัลติโหมด',\n  'Content Creator': 'เครื่องมือสร้างคอนเทนต์',\n  Learning: 'การเรียนรู้',\n  'Image Generation': 'สร้างรูปภาพ',\n",
  'i18n catalog categories and collections',
);

i18n = replaceOnce(
  i18n,
  "  CODING: 'เขียนโค้ด',\n  'IMAGE GENERATION': 'สร้างรูปภาพ',\n  WORK: 'งาน',\n",
  "  CODING: 'เขียนโค้ด',\n  RESEARCH: 'วิจัย',\n  DEVOPS: 'เดฟออปส์',\n  DATABASE: 'ฐานข้อมูล',\n  DATA: 'ข้อมูล',\n  VISION: 'วิชัน',\n  VIDEO: 'วิดีโอ',\n  AUDIO: 'เสียง',\n  WRITING: 'การเขียน',\n  MARKETING: 'การตลาด',\n  PRODUCTIVITY: 'ประสิทธิภาพงาน',\n  EDUCATION: 'การศึกษา',\n  'IMAGE GENERATION': 'สร้างรูปภาพ',\n  WORK: 'งาน',\n",
  'i18n uppercase catalog categories',
);

i18n = replaceOnce(
  i18n,
  "  [/^Move (.+) to Trash\\?$/, (_, name) => `ย้าย ${name} ไปถังขยะหรือไม่?`],\n  [/^Delete (.+) forever\\? This cannot be undone\\.$/, (_, name) => `ลบ ${name} ถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`],\n",
  "  [/^Move (.+) to Trash\\?$/, (_, name) => `ย้าย ${name} ไปถังขยะหรือไม่?`],\n  [/^Confirm again: move (.+) to Trash\\?$/, (_, name) => `ยืนยันอีกครั้ง: ย้าย ${name} ไปถังขยะหรือไม่?`],\n  [/^Delete (.+) forever\\? This cannot be undone\\.$/, (_, name) => `ลบ ${name} ถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`],\n  [/^FINAL CONFIRMATION: permanently delete (.+)\\?$/, (_, name) => `ยืนยันครั้งสุดท้าย: ลบ ${name} ถาวรหรือไม่?`],\n",
  'i18n second delete confirmations',
);

fs.writeFileSync(i18nPath, i18n);
