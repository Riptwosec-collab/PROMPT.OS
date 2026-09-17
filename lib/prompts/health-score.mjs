const MAX = Object.freeze({
  structure: 20,
  context: 15,
  variables: 15,
  constraints: 15,
  outputFormat: 15,
  reliability: 20,
});

function textOf(prompt = {}) {
  return String(prompt.prompt || prompt.template || '');
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function category(score, max, reason) {
  return { score: Math.max(0, Math.min(max, score)), max, reason };
}

export function scorePromptHealth(prompt = {}) {
  const text = textOf(prompt);
  const lower = text.toLowerCase();
  const findings = [];

  let structureScore = 0;
  if (text.length >= 120) structureScore += 6;
  if (text.includes('\n')) structureScore += 4;
  if (/^\s*[-*]|\n\s*[-*]|\n\s*\d+[.)]/m.test(text)) structureScore += 5;
  if (hasAny(text, [/role\s*:/i, /context\s*:/i, /task\s*:/i, /output\s*format\s*:/i])) structureScore += 5;
  if (structureScore < 12) findings.push('Add clearer sections or step structure.');

  let contextScore = 0;
  if (hasAny(text, [/context\s*:/i, /background\s*:/i, /audience/i, /goal/i, /objective/i])) contextScore += 8;
  if (text.length >= 220) contextScore += 4;
  if (hasAny(text, [/for a .*audience/i, /given .*context/i, /based on/i])) contextScore += 3;
  if (contextScore < 8) findings.push('Add explicit context, audience, or objective.');

  const placeholders = new Set([...text.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((match) => match[1]));
  const configKeys = Object.keys(prompt.variableConfig || {});
  let variableScore = 0;
  if (placeholders.size > 0) variableScore += 6;
  if (configKeys.length > 0) variableScore += 5;
  if (placeholders.size > 0 && [...placeholders].every((name) => configKeys.includes(name))) variableScore += 4;
  if (placeholders.size === 0 && configKeys.length === 0) findings.push('Add variables where reusable inputs would improve the prompt.');
  else if (variableScore < 11) findings.push('Align placeholders with explicit variable configuration.');

  let constraintsScore = 0;
  if (hasAny(text, [/constraints?\s*:/i, /must\b/i, /do not\b/i, /never\b/i, /only\b/i])) constraintsScore += 8;
  if (countMatches(lower, /\b(?:must|should|do not|never|only)\b/g) >= 2) constraintsScore += 4;
  if (/[-*]\s+/.test(text)) constraintsScore += 3;
  if (constraintsScore < 8) findings.push('Add explicit constraints or boundaries.');

  let outputScore = 0;
  if (hasAny(text, [/output\s*format\s*:/i, /return\b/i, /respond\b/i, /format\b/i])) outputScore += 8;
  if (hasAny(text, [/json/i, /table/i, /summary/i, /findings/i, /next steps/i, /sections?/i])) outputScore += 4;
  if (prompt.exampleOutput || prompt.outputFormat) outputScore += 3;
  if (outputScore < 8) findings.push('Specify the expected output format.');

  let reliabilityScore = 0;
  if (hasAny(text, [/do not invent/i, /do not fabricate/i, /uncertain/i, /uncertainty/i, /missing/i])) reliabilityScore += 8;
  if (hasAny(text, [/assumptions?/i, /evidence/i, /sources?/i, /verify/i])) reliabilityScore += 6;
  if (hasAny(text, [/ask .*missing/i, /if .*missing/i, /insufficient/i])) reliabilityScore += 6;
  if (reliabilityScore < 10) findings.push('Add missing-data, uncertainty, or anti-fabrication rules.');

  const categories = {
    structure: category(structureScore, MAX.structure, 'Prompt organization and readable structure.'),
    context: category(contextScore, MAX.context, 'Goal, audience, and background context.'),
    variables: category(variableScore, MAX.variables, 'Reusable inputs and variable schema coverage.'),
    constraints: category(constraintsScore, MAX.constraints, 'Explicit boundaries and requirements.'),
    outputFormat: category(outputScore, MAX.outputFormat, 'Expected response shape and examples.'),
    reliability: category(reliabilityScore, MAX.reliability, 'Uncertainty, evidence, and missing-data safeguards.'),
  };

  const total = Object.values(categories).reduce((sum, item) => sum + item.score, 0);
  return { total, categories, findings };
}
