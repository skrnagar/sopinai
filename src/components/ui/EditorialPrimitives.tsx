import React, { useMemo, useState } from 'react';
import { Check, Copy, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import {
  CodeLanguage,
  detectCodeLanguage,
  getLanguageDisplayName,
} from '../../utils/syntaxHighlight';
import { HighlightedCode, copyTextToClipboard } from './HighlightedCode';

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  kicker,
  title,
  description,
  align = 'left',
  dark = false,
  className = '',
}) => {
  return (
    <div
      className={`${align === 'center' ? 'mx-auto text-center max-w-3xl' : 'max-w-3xl'} ${className}`}
    >
      {kicker && (
        <p
          className={`text-sm font-medium tracking-tight mb-3 ${
            dark ? 'text-[#965BFF]' : 'text-[#6252E8] dark:text-[#965BFF]'
          }`}
        >
          {kicker}
        </p>
      )}
      <h2
        className={`font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15] text-balance ${
          dark ? 'text-[#FFFFFF]' : 'text-[#101014] dark:text-[#FFFFFF]'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base sm:text-lg leading-relaxed ${
            dark ? 'text-[#B5B5C5]' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};

interface StatusTextProps {
  items: string[];
  accentLast?: boolean;
  dark?: boolean;
  className?: string;
}

/**
 * Unboxed typographic metadata line with subtle dot separators (Zero-Pill discipline).
 */
export const StatusText: React.FC<StatusTextProps> = ({
  items,
  accentLast = false,
  dark = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium ${
        dark ? 'text-[#9A9AB0]' : 'text-[#5E5E6E] dark:text-[#9A9AB0]'
      } ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item}-${idx}`}>
            {idx > 0 && <span aria-hidden="true">·</span>}
            <span
              className={
                accentLast && isLast
                  ? dark
                    ? 'text-[#B894FF]'
                    : 'text-[#6252E8] dark:text-[#B894FF]'
                  : undefined
              }
            >
              {item}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  label?: string;
  language?: CodeLanguage;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  label,
  language,
  showLineNumbers = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const detectedLanguage = useMemo(
    () => language ?? detectCodeLanguage(label, code),
    [language, label, code]
  );
  const languageName = getLanguageDisplayName(detectedLanguage);
  const displayLabel = label || 'Specification';
  const showLanguageTag =
    detectedLanguage !== 'text' &&
    !displayLabel.toLowerCase().includes(languageName.toLowerCase());

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div
      className={`w-full min-w-0 max-w-full flex flex-col rounded-xl border border-[#101014]/15 dark:border-white/10 bg-[#0D1021] text-[#E4E6F0] shadow-[0_1px_2px_rgba(16,16,20,0.12)] overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-[#14172C]">
        <div className="flex items-center gap-2 min-w-0 font-mono text-xs truncate">
          <span className="text-[#D4D6E6] truncate">{displayLabel}</span>
          {showLanguageTag && (
            <>
              <span className="text-[#5C6382] shrink-0" aria-hidden="true">
                ·
              </span>
              <span className="text-[#9CDCFE] shrink-0">{languageName}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C5C8DC] hover:text-white transition-colors px-2.5 min-h-[40px] sm:min-h-[32px] rounded-md hover:bg-white/10 whitespace-nowrap shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4EC9B0]" aria-hidden="true" />
              <span className="text-[#4EC9B0]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="flex-1 p-4 overflow-x-auto text-[13px] font-mono">
        <HighlightedCode
          code={code}
          language={detectedLanguage}
          surface="dark"
          showLineNumbers={showLineNumbers}
        />
      </pre>
    </div>
  );
};

interface StateDisplayProps {
  mode: 'loading' | 'empty' | 'error';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateDisplay: React.FC<StateDisplayProps> = ({
  mode,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      role={mode === 'error' ? 'alert' : 'status'}
      className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/60 p-8 sm:p-10 text-center max-w-xl mx-auto"
    >
      <div className="w-10 h-10 rounded-lg border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] mx-auto flex items-center justify-center mb-4">
        {mode === 'loading' && (
          <RefreshCw className="w-5 h-5 text-[#6252E8] animate-spin" aria-hidden="true" />
        )}
        {mode === 'empty' && (
          <Inbox className="w-5 h-5 text-[#5E5E6E] dark:text-[#A4A4B5]" aria-hidden="true" />
        )}
        {mode === 'error' && (
          <AlertCircle className="w-5 h-5 text-[#965BFF]" aria-hidden="true" />
        )}
      </div>
      <h3 className="font-display text-lg font-semibold text-[#101014] dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#A4A4B5] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center px-5 min-h-[44px] text-sm font-medium rounded-lg bg-[#6252E8] text-white hover:bg-[#5344d4] transition-colors whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
