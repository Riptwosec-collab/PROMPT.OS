'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight } from 'prism-react-renderer';

export function safeHref(href = '') {
  if (!href) return '';
  try {
    const url = new URL(href, 'https://prompt-os.local');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
    return href;
  } catch {
    return '';
  }
}

function MarkdownCode({ className = '', children, ...props }) {
  const match = /language-([\w-]+)/.exec(className || '');
  const code = String(children ?? '').replace(/\n$/, '');
  if (!match) {
    return <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[0.92em] text-cyan-100" {...props}>{children}</code>;
  }
  const language = match[1];
  return (
    <Highlight code={code} language={language}>
      {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${highlightClassName} overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6`} style={style}>
          {tokens.map((line, index) => (
            <div key={index} {...getLineProps({ line })}>
              {line.map((token, tokenIndex) => <span key={tokenIndex} {...getTokenProps({ token })} />)}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default function RunResult({ output = '', mode = 'markdown', onModeChange }) {
  if (mode === 'raw') {
    return (
      <div className="min-h-0" data-run-result-mode="raw">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-200">{output}</pre>
      </div>
    );
  }

  return (
    <div className="run-result-markdown min-h-0 text-sm leading-7 text-slate-200" data-run-result-mode="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeHref}
        components={{
          a({ href = '', children, ...props }) {
            const safe = safeHref(href);
            if (!safe) return <span>{children}</span>;
            const external = /^https?:/i.test(safe);
            return (
              <a
                href={safe}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer noopener' : undefined}
                className="text-cyan-200 underline decoration-cyan-300/30 underline-offset-4"
                {...props}
              >
                {children}
              </a>
            );
          },
          code: MarkdownCode,
        }}
      >
        {output}
      </ReactMarkdown>
      <span className="sr-only">{typeof onModeChange === 'function' ? 'Markdown result view' : 'Result view'}</span>
    </div>
  );
}
