import React, { useMemo } from 'react';
import {
  CodeLanguage,
  TokenType,
  detectCodeLanguage,
  tokenizeCodeLines,
} from '../../utils/syntaxHighlight';

const DARK_TOKEN_CLASSES: Record<TokenType, string> = {
  comment: 'text-[#7CA668] italic',
  control: 'text-[#C586C0]',
  keyword: 'text-[#569CD6]',
  type: 'text-[#4EC9B0]',
  function: 'text-[#DCDCAA]',
  string: 'text-[#CE9178]',
  number: 'text-[#B5CEA8]',
  boolean: 'text-[#569CD6]',
  property: 'text-[#9CDCFE]',
  decorator: 'text-[#D7BA7D]',
  operator: 'text-[#D4D4D8]',
  punctuation: 'text-[#9CA3B8]',
  plain: 'text-[#E4E6F0]',
};

const AUTO_TOKEN_CLASSES: Record<TokenType, string> = {
  comment: 'text-[#007000] dark:text-[#7CA668] italic',
  control: 'text-[#A000C8] dark:text-[#C586C0]',
  keyword: 'text-[#0000DF] dark:text-[#569CD6]',
  type: 'text-[#1B6E85] dark:text-[#4EC9B0]',
  function: 'text-[#6E531A] dark:text-[#DCDCAA]',
  string: 'text-[#A31515] dark:text-[#CE9178]',
  number: 'text-[#098658] dark:text-[#B5CEA8]',
  boolean: 'text-[#0000DF] dark:text-[#569CD6]',
  property: 'text-[#0451A5] dark:text-[#9CDCFE]',
  decorator: 'text-[#795E26] dark:text-[#D7BA7D]',
  operator: 'text-[#383A42] dark:text-[#D4D4D8]',
  punctuation: 'text-[#5E5E6E] dark:text-[#9CA3B8]',
  plain: 'text-[#05070E] dark:text-[#E4E6F0]',
};

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for iframe permissions
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

interface HighlightedCodeProps {
  code: string;
  language?: CodeLanguage;
  label?: string;
  surface?: 'dark' | 'auto';
  showLineNumbers?: boolean;
  wrap?: boolean;
  className?: string;
}

export const HighlightedCode: React.FC<HighlightedCodeProps> = ({
  code,
  language,
  label,
  surface = 'dark',
  showLineNumbers = false,
  wrap = false,
  className = '',
}) => {
  const resolvedLanguage = useMemo(
    () => language ?? detectCodeLanguage(label, code),
    [language, label, code]
  );

  const lines = useMemo(
    () => tokenizeCodeLines(code, resolvedLanguage),
    [code, resolvedLanguage]
  );

  const palette = surface === 'auto' ? AUTO_TOKEN_CLASSES : DARK_TOKEN_CLASSES;
  const gutterColor =
    surface === 'auto'
      ? 'text-[#7A7A8C] dark:text-[#636B88]'
      : 'text-[#636B88]';

  return (
    <code
      data-language={resolvedLanguage}
      className={`${showLineNumbers ? 'table w-full' : 'block'} font-mono ${
        wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
      } ${className}`}
    >
      {lines.map((lineTokens, lineIdx) => (
        <span key={lineIdx} className={showLineNumbers ? 'table-row' : 'block leading-[1.6]'}>
          {showLineNumbers && (
            <span
              aria-hidden="true"
              className={`table-cell select-none pr-4 text-right tabular-nums text-[11px] leading-[1.6] align-top w-8 ${gutterColor}`}
            >
              {lineIdx + 1}
            </span>
          )}
          <span className={showLineNumbers ? 'table-cell leading-[1.6]' : undefined}>
            {lineTokens.length === 0 ? (
              <span className="inline-block h-[1em]" aria-hidden="true" />
            ) : (
              lineTokens.map((tok, tokIdx) => (
                <span key={tokIdx} className={palette[tok.type]}>
                  {tok.value}
                </span>
              ))
            )}
          </span>
        </span>
      ))}
    </code>
  );
};
