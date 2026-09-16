'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
} from '../lib/i18n/runtime.mjs';
import { translateCatalogThai } from '../lib/i18n/prompt-os.mjs';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'PRE', 'CODE', 'TEXTAREA']);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'];

function shouldSkipElement(element) {
  if (!element || element.nodeType !== 1) return false;
  if (SKIP_TAGS.has(element.tagName)) return true;
  return Boolean(element.closest?.('[data-i18n-skip="true"], [data-i18n-control="true"]'));
}

function splitWhitespace(text) {
  const match = String(text ?? '').match(/^(\s*)([\s\S]*?)(\s*)$/);
  return match ? { before: match[1], core: match[2], after: match[3] } : { before: '', core: String(text ?? ''), after: '' };
}

export default function LanguageRuntime({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const languageRef = useRef(DEFAULT_LANGUAGE);
  const textMemoryRef = useRef(new WeakMap());
  const attrMemoryRef = useRef(new WeakMap());

  useEffect(() => {
    const saved = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    setLanguage(saved);
  }, []);

  useEffect(() => {
    languageRef.current = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;

    const textMemory = textMemoryRef.current;
    const attrMemory = attrMemoryRef.current;

    const translateTextNode = (node) => {
      if (!node || node.nodeType !== 3 || shouldSkipElement(node.parentElement)) return;
      const current = node.nodeValue ?? '';
      const remembered = textMemory.get(node);
      const source = remembered && current === remembered.rendered ? remembered.source : current;
      const { before, core, after } = splitWhitespace(source);
      if (!core) return;
      const rendered = `${before}${translateCatalogThai(language, core)}${after}`;
      textMemory.set(node, { source, rendered });
      if (current !== rendered) node.nodeValue = rendered;
    };

    const translateAttributes = (element) => {
      if (!element || element.nodeType !== 1 || shouldSkipElement(element)) return;
      let memory = attrMemory.get(element);
      if (!memory) {
        memory = {};
        attrMemory.set(element, memory);
      }

      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        if (!element.hasAttribute(attribute)) continue;
        const current = element.getAttribute(attribute) || '';
        const remembered = memory[attribute];
        const source = remembered && current === remembered.rendered ? remembered.source : current;
        const rendered = translateCatalogThai(language, source);
        memory[attribute] = { source, rendered };
        if (current !== rendered) element.setAttribute(attribute, rendered);
      }
    };

    const translateTree = (root) => {
      if (!root) return;
      if (root.nodeType === 3) {
        translateTextNode(root);
        return;
      }
      if (root.nodeType !== 1 || shouldSkipElement(root)) return;
      translateAttributes(root);
      for (const child of root.childNodes) translateTree(child);
    };

    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateTextNode(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) translateTree(node);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const nativeConfirm = window.confirm.bind(window);
    const nativeAlert = window.alert.bind(window);
    window.confirm = (message) => nativeConfirm(translateCatalogThai(languageRef.current, message));
    window.alert = (message) => nativeAlert(translateCatalogThai(languageRef.current, message));

    return () => {
      observer.disconnect();
      window.confirm = nativeConfirm;
      window.alert = nativeAlert;
    };
  }, [language]);

  return (
    <>
      {children}
      <div
        data-i18n-control="true"
        className="fixed bottom-4 right-4 z-[250] flex items-center gap-1 rounded-xl border border-cyan-700/60 bg-[#02060d]/95 p-1 font-mono text-[10px] shadow-[0_0_30px_rgba(6,182,212,0.18)] backdrop-blur-xl"
        aria-label={language === 'th' ? 'ตัวเลือกภาษา' : 'Language switcher'}
      >
        <button
          type="button"
          onClick={() => setLanguage('th')}
          className={`rounded-lg px-3 py-2 transition-all ${language === 'th' ? 'bg-cyan-400 text-black shadow-[0_0_14px_rgba(34,211,238,0.4)]' : 'text-cyan-600 hover:bg-cyan-950/60 hover:text-cyan-300'}`}
          aria-pressed={language === 'th'}
          title="ภาษาไทย"
        >
          TH
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`rounded-lg px-3 py-2 transition-all ${language === 'en' ? 'bg-cyan-400 text-black shadow-[0_0_14px_rgba(34,211,238,0.4)]' : 'text-cyan-600 hover:bg-cyan-950/60 hover:text-cyan-300'}`}
          aria-pressed={language === 'en'}
          title="English"
        >
          EN
        </button>
      </div>
    </>
  );
}
