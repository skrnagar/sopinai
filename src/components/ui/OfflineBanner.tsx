import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineBannerProps {
  hasBottomBar?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ hasBottomBar = false }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-3 sm:inset-x-auto sm:right-5 sm:max-w-sm z-40 rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-[#0A1226] text-white px-4 py-3 shadow-xl flex items-center gap-3 ${
        hasBottomBar ? 'bottom-[76px] mb-safe lg:bottom-5' : 'bottom-4 mb-safe'
      }`}
    >
      <WifiOff className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-semibold">Offline mode active</p>
        <p className="text-[11px] text-[#C5C5D6] leading-snug">
          Local workspace edits and cached documentation remain available.
        </p>
      </div>
    </div>
  );
};
