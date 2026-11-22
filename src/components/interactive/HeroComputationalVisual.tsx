import React from 'react';

/**
 * Square hero visual replacing the animated SOPIN emblem.
 */
export const HeroComputationalVisual: React.FC = () => {
  return (
    <div className="relative w-full flex items-center justify-center bg-transparent">
      <div className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] aspect-square rounded-2xl overflow-hidden border border-[#05070E]/10 shadow-[0_12px_36px_rgba(5,7,14,0.12)]">
        <img
          src="/assets/aistudio/sap-announcement-notext_c162c7be.jpg"
          alt="SOPIN intelligence beyond limits artwork"
          className="w-full h-full object-cover object-[70%_center] block"
        />
      </div>
    </div>
  );
};
