'use client';

import React from 'react';
import { validatePromptVariables } from '../../lib/variables/validate-variables.mjs';

function labelFor(name, field = {}) {
  return field.labelTh || field.label || name;
}

function normalizeOptions(field = {}) {
  const options = Array.isArray(field.options) ? field.options : [];
  if (field.type === 'language' && options.length === 0) return ['Thai', 'English'];
  return options;
}

function placeholderFor(field = {}) {
  return field.placeholderTh || field.placeholder || '';
}

export default function PromptVariableForm({ variableConfig = {}, values = {}, onChange, errors = {} }) {
  const fields = Object.entries(variableConfig || {});
  const validation = validatePromptVariables(variableConfig, values);
  const mergedErrors = { ...validation.errors, ...errors };

  const setValue = (name, value) => onChange?.({ ...values, [name]: value });

  if (fields.length === 0) {
    return <p className="text-xs text-slate-500">No variables required / ไม่ต้องกรอกตัวแปร</p>;
  }

  return (
    <div className="space-y-4" data-variable-form>
      {fields.map(([name, field = {}]) => {
        const type = field.type || 'text';
        const value = values?.[name] ?? field.defaultValue ?? field.default ?? (type === 'multi-select' ? [] : type === 'boolean' ? false : '');
        const error = mergedErrors[name];
        const help = field.helpTh || field.help || '';
        const helpId = help ? `variable-${name}-help` : null;
        const errorId = error ? `variable-${name}-error` : null;
        const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
        const common = {
          id: `variable-${name}`,
          name,
          'aria-invalid': Boolean(error),
          'aria-describedby': describedBy,
        };

        return (
          <label key={name} htmlFor={`variable-${name}`} className="block">
            <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-200">
              {labelFor(name, field)}
              {field.required ? <span className="text-rose-300" aria-label="required">*</span> : <span className="text-slate-600">optional</span>}
            </span>
            {help ? <span id={helpId} className="mb-1.5 block text-[11px] leading-5 text-slate-500">{help}</span> : null}
            <VariableControl type={type} field={field} value={value} setValue={(next) => setValue(name, next)} common={common} />
            {error ? <span id={errorId} className="mt-1 block text-[11px] text-rose-300">{error}</span> : null}
          </label>
        );
      })}
    </div>
  );
}

function VariableControl({ type, field, value, setValue, common }) {
  const base = 'w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10';
  const options = normalizeOptions(field);
  const placeholder = placeholderFor(field);

  if (type === 'textarea' || type === 'code') {
    return <textarea {...common} value={value || ''} rows={type === 'code' ? 8 : 5} spellCheck={type === 'code' ? false : undefined} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} className={`${base} resize-y ${type === 'code' ? 'font-mono text-xs' : ''}`} />;
  }

  if (type === 'number') {
    return <input {...common} type="number" value={value ?? ''} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} className={base} />;
  }

  if (type === 'select' || type === 'language') {
    return (
      <select {...common} value={value || ''} onChange={(event) => setValue(event.target.value)} className={base}>
        {!field.required ? <option value="">—</option> : null}
        {options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}
      </select>
    );
  }

  if (type === 'multi-select') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <select {...common} multiple value={selected} onChange={(event) => setValue([...event.target.selectedOptions].map((option) => option.value))} className={`${base} min-h-28`}>
        {options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}
      </select>
    );
  }

  if (type === 'boolean') {
    return (
      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-slate-300">
        <input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} />
        {Boolean(value) ? 'True' : 'False'}
      </span>
    );
  }

  if (type === 'date') {
    return <input {...common} type="date" value={value || ''} onChange={(event) => setValue(event.target.value)} className={base} />;
  }

  if (type === 'url') {
    return <input {...common} type="url" value={value || ''} placeholder={placeholder || 'https://'} onChange={(event) => setValue(event.target.value)} className={base} />;
  }

  if (type === 'file') {
    return <input {...common} type="file" onChange={(event) => setValue(event.target.files?.[0] || null)} className={`${base} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-slate-200`} />;
  }

  return <input {...common} type="text" value={value || ''} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} className={base} />;
}
