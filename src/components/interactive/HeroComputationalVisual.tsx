import React from 'react';
import { motion } from 'motion/react';
import { SOPIN_EMBLEM_PATH } from '../brand/SopinLogo';

const RADIAL_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * Open, unboxed animated SOPIN emblem for the Hero section — no container box,
 * no border card, just the geometric emblem and orbital animation over the page canvas.
 */
export const HeroComputationalVisual: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="relative w-full min-h-[300px] sm:min-h-[380px] lg:min-h-[420px] flex items-center justify-center select-none pointer-events-none"
    >
      {/* Outer counter-rotating geometric ring */}
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        className="w-[300px] h-[300px] sm:w-[370px] sm:h-[370px] lg:w-[420px] lg:h-[420px] text-[#2563EB]/25"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 96, ease: 'linear' }}
      >
        <circle
          cx="50"
          cy="50"
          r="47.5"
          stroke="currentColor"
          strokeWidth="0.45"
          strokeDasharray="1.8 2.8"
        />
        <circle
          cx="50"
          cy="50"
          r="39"
          stroke="currentColor"
          strokeWidth="0.35"
          strokeOpacity="0.65"
        />
        {RADIAL_ANGLES.map((angle) => (
          <path
            key={angle}
            d="M 35.5 4 L 39.2 26 A 10.8 10.8 0 0 0 60.8 26 L 64.5 4 L 53.5 4 L 53.5 24.5 A 3.5 3.5 0 0 1 46.5 24.5 L 46.5 4 Z"
            stroke="currentColor"
            strokeWidth="0.55"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </motion.svg>

      {/* Centered official SOPIN radial emblem with gentle rotation */}
      <motion.svg
        viewBox="-8 -12 420 410"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute w-[150px] h-[150px] sm:w-[190px] sm:h-[190px] lg:w-[215px] lg:h-[215px] text-[#111827]"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 120, ease: 'linear' }}
      >
        <path fill="currentColor" fillRule="evenodd" d={SOPIN_EMBLEM_PATH} />
      </motion.svg>
    </div>
  );
};
