import { renderVariableValues } from '../variables/runtime.mjs';

export function renderPromptVariables(prompt, values = {}) {
  return renderVariableValues(prompt, values, {});
}
