import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'md:max-w-xl',
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-[#05070E]/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full ${maxWidthClass} max-h-[88dvh] flex flex-col rounded-t-2xl md:rounded-2xl border border-[#05070E]/15 dark:border-white/15 bg-[#FAF9F5] dark:bg-[#0A1226] text-[#05070E] dark:text-white shadow-2xl overflow-hidden`}
      >
        <div className="md:hidden pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-[#05070E]/15 dark:bg-white/20" />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-3 md:pt-5 pb-3.5 border-b border-[#05070E]/10 dark:border-white/10 shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#05070E] dark:text-white leading-snug truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="w-11 h-11 -mr-2 -mt-1 inline-flex items-center justify-center rounded-lg text-[#5E5E6E] dark:text-[#A4A4B5] hover:text-[#05070E] dark:hover:text-white hover:bg-[#FBF7F0] dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain ${!footer ? 'pb-safe' : ''}`}>
          {children}
        </div>

        {footer && (
          <div className="px-4 sm:px-6 py-3.5 pb-safe border-t border-[#05070E]/10 dark:border-white/10 bg-[#FBF7F0] dark:bg-[#05070E]/60 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
