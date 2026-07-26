import React, { useRef, useCallback } from 'react';
import './code-highlight.css';

/**
 * Lightweight JavaScript syntax highlighter with line numbers.
 *
 * Uses a regex-based tokenizer (zero dependencies) that handles:
 * - keywords (const, let, var, function, return, if, else, for, while, etc.)
 * - strings (single/double/backtick)
 * - numbers
 * - single-line comments (//) and multi-line (/* *\/)
 * - built-in globals (Math, console, NaN, Infinity, etc.)
 * - helpers object methods (ma, ema, stddev, ref, hhv, llv)
 *
 * The component renders a highlighted <pre> layer behind a transparent
 * <textarea> so the user edits naturally while seeing colours.
 */

// ─── Tokenizer ──────────────────────────────────────────────

const KW = new Set([
  'const','let','var','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','typeof','instanceof','in','of',
  'true','false','null','undefined','void','delete','throw','try','catch',
  'finally','class','extends','import','export','default','from','async',
  'await','yield','this','super','with','debugger','static','get','set',
]);

const BUILTIN = new Set([
  'Math','console','NaN','Infinity','Array','Object','Number','String',
  'Boolean','Date','RegExp','Error','Map','Set','Promise','JSON',
  'parseInt','parseFloat','isNaN','isFinite','encodeURI','decodeURI',
  'setTimeout','setInterval','clearTimeout','clearInterval',
]);

const HELPERS = new Set(['ma','ema','stddev','ref','hhv','llv']);

type Token = { type: string; text: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      let j = i + 1;
      while (j < len && (src[j] === ' ' || src[j] === '\t' || src[j] === '\n' || src[j] === '\r')) j++;
      tokens.push({ type: 'ws', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // Single-line comment
    if (ch === '/' && i + 1 < len && src[i + 1] === '/') {
      let j = i + 2;
      while (j < len && src[j] !== '\n') j++;
      tokens.push({ type: 'comment', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // Multi-line comment
    if (ch === '/' && i + 1 < len && src[i + 1] === '*') {
      let j = i + 2;
      while (j + 1 < len && !(src[j] === '*' && src[j + 1] === '/')) j++;
      j += 2; // include closing */
      tokens.push({ type: 'comment', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // String — single quote
    if (ch === "'") {
      let j = i + 1;
      while (j < len && src[j] !== "'") { if (src[j] === '\\') j++; j++; }
      j++; // closing quote
      tokens.push({ type: 'string', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // String — double quote
    if (ch === '"') {
      let j = i + 1;
      while (j < len && src[j] !== '"') { if (src[j] === '\\') j++; j++; }
      j++;
      tokens.push({ type: 'string', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // String — backtick (template literal, simplified — no ${} awareness)
    if (ch === '`') {
      let j = i + 1;
      while (j < len && src[j] !== '`') { if (src[j] === '\\') j++; j++; }
      j++;
      tokens.push({ type: 'string', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (ch >= '0' && ch <= '9') {
      let j = i;
      if (src[j] === '0' && j + 1 < len && (src[j + 1] === 'x' || src[j + 1] === 'X')) {
        j += 2;
        while (j < len && /[0-9a-fA-F]/.test(src[j])) j++;
      } else {
        while (j < len && (src[j] >= '0' && src[j] <= '9' || src[j] === '.')) j++;
        if (j < len && (src[j] === 'e' || src[j] === 'E')) {
          j++;
          if (j < len && (src[j] === '+' || src[j] === '-')) j++;
          while (j < len && src[j] >= '0' && src[j] <= '9') j++;
        }
      }
      tokens.push({ type: 'number', text: src.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier / keyword
    if (ch === '_' || ch === '$' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      let j = i + 1;
      while (j < len && (src[j] === '_' || src[j] === '$' || (src[j] >= 'a' && src[j] <= 'z') || (src[j] >= 'A' && src[j] <= 'Z') || (src[j] >= '0' && src[j] <= '9'))) j++;
      const word = src.slice(i, j);
      if (KW.has(word)) tokens.push({ type: 'keyword', text: word });
      else if (BUILTIN.has(word)) tokens.push({ type: 'builtin', text: word });
      else if (HELPERS.has(word)) tokens.push({ type: 'helper', text: word });
      else tokens.push({ type: 'ident', text: word });
      i = j;
      continue;
    }

    // Punctuation / operators
    tokens.push({ type: 'punct', text: ch });
    i++;
  }

  return tokens;
}

// ─── Color scheme (One Dark–inspired) ──────────────────────

const COLORS: Record<string, string> = {
  keyword: '#c678dd',   // purple
  builtin: '#e5c07b',   // yellow
  helper:  '#61afef',   // blue (like function calls)
  string:  '#98c379',   // green
  number:  '#d19a66',   // orange
  comment: '#5c6370',   // dim gray
  ident:   '#abb2bf',   // light gray
  punct:   '#abb2bf',   // light gray
  ws:      '',           // no color needed
};

function renderHighlighted(src: string): string {
  const tokens = tokenize(src);
  let html = '';
  for (const t of tokens) {
    const escaped = t.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (COLORS[t.type]) {
      html += `<span style="color:${COLORS[t.type]}">${escaped}</span>`;
    } else {
      html += escaped;
    }
  }
  return html;
}

// ─── React Component ───────────────────────────────────────

interface CodeHighlightProps {
  value: string;
  onChange: (v: string) => void;
  minLines?: number;
  readOnly?: boolean;
  className?: string;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({
  value,
  onChange,
  minLines = 18,
  readOnly = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumsRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea ↔ highlighted pre ↔ line numbers
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    const ln = lineNumsRef.current;
    if (ta) {
      if (pre) { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; }
      if (ln) ln.scrollTop = ta.scrollTop;
    }
  }, []);

  // Handle tab key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  const lineCount = value.split('\n').length;
  const visibleLines = Math.max(lineCount, minLines);

  const lineNums = [];
  for (let i = 1; i <= visibleLines; i++) lineNums.push(i);

  return (
    <div className={`ch-editor${readOnly ? ' ch-editor-readonly' : ''} ${className}`}>
      <div className="ch-line-nums" ref={lineNumsRef}>
        {lineNums.map((n) => <div key={n} className="ch-ln">{n}</div>)}
      </div>
      <div className="ch-code-area">
        <pre className="ch-highlight" ref={preRef} aria-hidden="true">
          <code dangerouslySetInnerHTML={{ __html: renderHighlighted(value) + '\n' }} />
        </pre>
        <textarea
          ref={textareaRef}
          className="ch-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          readOnly={readOnly}
          rows={visibleLines}
        />
      </div>
    </div>
  );
};

export default CodeHighlight;
