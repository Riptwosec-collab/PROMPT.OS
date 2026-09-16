import fs from 'node:fs';

const path = 'components/PromptOS.jsx';
let source = fs.readFileSync(path, 'utf8');

const importAnchor = "import { AI_PROMPT_COLLECTIONS, AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION, getVariableInputKind, mergePromptCatalog } from '../lib/prompts/ai-prompt-library.mjs';\n";
if (!source.includes(importAnchor)) throw new Error('Missing catalog import anchor');
source = source.replace(importAnchor, `${importAnchor}import { renderPromptVariables } from '../lib/prompts/render.mjs';\n`);

const localRenderer = `function renderPromptVariables(prompt, values = {}) {\n  return String(prompt || '').replace(/{{\\s*([a-zA-Z0-9_.-]+)\\s*}}/g, (full, key) => values[key] ?? full);\n}\n\n`;
if (!source.includes(localRenderer)) throw new Error('Missing local renderPromptVariables implementation');
source = source.replace(localRenderer, '');

fs.writeFileSync(path, source);
