import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 animate-pulse"
      role="status"
      aria-label="Loading page content"
    >
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-28 rounded bg-[#101014]/10 dark:bg-white/10" />
        <div className="h-10 w-3/4 rounded-lg bg-[#101014]/10 dark:bg-white/10" />
        <div className="h-5 w-full rounded bg-[#101014]/8 dark:bg-white/8" />
        <div className="h-5 w-2/3 rounded bg-[#101014]/8 dark:bg-white/8" />
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-44 rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/50 p-5"
          >
            <div className="h-4 w-20 rounded bg-[#101014]/10 dark:bg-white/10" />
            <div className="mt-4 h-6 w-2/3 rounded bg-[#101014]/10 dark:bg-white/10" />
            <div className="mt-3 h-4 w-full rounded bg-[#101014]/8 dark:bg-white/8" />
            <div className="mt-2 h-4 w-4/5 rounded bg-[#101014]/8 dark:bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
};
