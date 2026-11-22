import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SOPIN_EMBLEM_PATH } from '../brand/SopinLogo';

interface ArchitectureNode {
  id: 'studio' | 'context' | 'decisions' | 'graph' | 'runtime';
  code: string;
  label: string;
  sublabel: string;
  description: string;
  x: number;
  y: number;
  pathToCore: string;
}

const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'studio',
    code: '01',
    label: 'Studio',
    sublabel: 'Agent authoring',
    description: '1:1 visual and typed SDK specs compiled into versioned agent blueprints.',
    x: 112,
    y: 92,
    pathToCore: 'M 152 114 C 194 138, 224 164, 248 188',
  },
  {
    id: 'context',
    code: '02',
    label: 'Context',
    sublabel: 'Scoped memory',
    description: 'Isolated working state, episodic history, and checksum-grounded corpora.',
    x: 428,
    y: 92,
    pathToCore: 'M 388 114 C 346 138, 316 164, 292 188',
  },
  {
    id: 'decisions',
    code: '03',
    label: 'Decisions',
    sublabel: 'Deterministic logic',
    description: 'Executable rules, hit-policy tables, and scorecards invoked inside Flow.',
    x: 84,
    y: 256,
    pathToCore: 'M 142 248 C 184 242, 214 232, 240 220',
  },
  {
    id: 'graph',
    code: '04',
    label: 'Graph',
    sublabel: 'Multi-agent state',
    description: 'Cyclic planner-verifier graphs with max-step bounds and signed A2A handoffs.',
    x: 456,
    y: 256,
    pathToCore: 'M 398 248 C 356 242, 326 232, 300 220',
  },
  {
    id: 'runtime',
    code: '05',
    label: 'Runtime',
    sublabel: 'Governed execution',
    description: 'Ephemeral isolated sandboxes with egress allowlists and durable checkpoints.',
    x: 270,
    y: 356,
    pathToCore: 'M 270 330 L 270 250',
  },
];

const CROSS_LINKS = [
  'M 164 92 L 376 92',
  'M 104 120 L 88 228',
  'M 436 120 L 452 228',
  'M 120 282 C 158 326, 200 348, 224 354',
  'M 420 282 C 382 326, 340 348, 316 354',
];

export const HeroComputationalVisual: React.FC = () => {
  const [activeId, setActiveId] = useState<ArchitectureNode['id'] | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const activeNode = ARCHITECTURE_NODES.find((node) => node.id === activeId) ?? null;

  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#05070E]/15 bg-[#070C17] shadow-[0_24px_60px_-18px_rgba(8,13,24,0.34)]"
        style={{
          backgroundImage:
            'radial-gradient(64% 62% at 50% 44%, rgba(37, 99, 235, 0.24) 0%, rgba(16, 29, 53, 0.72) 52%, rgba(7, 12, 23, 0.98) 100%)',
        }}
      >
        {/* Subtle engineered coordinate grid */}
        <div className="sopin-grid-dark relative">
          <svg
            viewBox="0 0 540 404"
            role="img"
            aria-label="SOPIN connected platform topology uniting Studio, Context, Decisions, Graph, and Runtime"
            className="w-full h-auto block"
          >
            <defs>
              <linearGradient id="hero-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EFF6FF" />
                <stop offset="55%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>

              <linearGradient id="hero-conduit-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
              </linearGradient>

              <radialGradient id="hero-nexus-aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#2563EB" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#070C17" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Concentric precision geometry */}
            <circle cx="270" cy="206" r="144" fill="url(#hero-nexus-aura)" />
            <circle
              cx="270"
              cy="206"
              r="142"
              fill="none"
              stroke="rgba(147, 197, 253, 0.12)"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
            <circle
              cx="270"
              cy="206"
              r="94"
              fill="none"
              stroke="rgba(96, 165, 250, 0.18)"
              strokeWidth="1"
            />

            {/* Orthogonal architectural crosshairs */}
            <line
              x1="40"
              y1="206"
              x2="500"
              y2="206"
              stroke="rgba(147, 197, 253, 0.08)"
              strokeWidth="1"
            />
            <line
              x1="270"
              y1="30"
              x2="270"
              y2="378"
              stroke="rgba(147, 197, 253, 0.08)"
              strokeWidth="1"
            />

            {/* Perimeter inter-agent coordination links */}
            {CROSS_LINKS.map((d, idx) => (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="rgba(148, 163, 184, 0.18)"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            ))}

            {/* Node-to-Core conduits + restrained signal animation */}
            {ARCHITECTURE_NODES.map((node, index) => {
              const isHighlighted = activeId === null || activeId === node.id;
              return (
                <g key={node.id}>
                  <path
                    d={node.pathToCore}
                    fill="none"
                    stroke={
                      activeId === node.id
                        ? 'url(#hero-conduit-active)'
                        : isHighlighted
                        ? 'rgba(96, 165, 250, 0.42)'
                        : 'rgba(148, 163, 184, 0.14)'
                    }
                    strokeWidth={activeId === node.id ? '2' : '1.35'}
                  />

                  {!shouldReduceMotion && isHighlighted && (
                    <motion.path
                      d={node.pathToCore}
                      fill="none"
                      stroke="#BFDBFE"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="10 96"
                      initial={{ strokeDashoffset: 106 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.8 + index * 0.25,
                        ease: 'linear',
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Central SOPIN Engineering Nexus */}
            <g transform="translate(270, 206)">
              <circle
                r="42"
                fill="#0B1325"
                stroke="rgba(96, 165, 250, 0.48)"
                strokeWidth="1.25"
              />
              <circle
                r="34"
                fill="rgba(37, 99, 235, 0.14)"
                stroke="rgba(191, 219, 254, 0.2)"
                strokeWidth="1"
              />
              <g transform="translate(-20, -19.5) scale(0.098)">
                <path
                  d={SOPIN_EMBLEM_PATH}
                  fill="url(#hero-core-grad)"
                  fillRule="evenodd"
                />
              </g>
            </g>

            {/* Interactive Platform Architecture Vertices */}
            {ARCHITECTURE_NODES.map((node) => {
              const isSelected = activeId === node.id;
              const isDimmed = activeId !== null && !isSelected;
              const cardWidth = 122;
              const cardHeight = 48;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - cardWidth / 2}, ${node.y - cardHeight / 2})`}
                  className="cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${node.label}: ${node.sublabel}`}
                  onMouseEnter={() => setActiveId(node.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(node.id)}
                  onBlur={() => setActiveId(null)}
                  onClick={() => setActiveId(isSelected ? null : node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveId(isSelected ? null : node.id);
                    }
                  }}
                >
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="10"
                    fill={isSelected ? '#132444' : '#0B1325'}
                    fillOpacity={isDimmed ? '0.68' : '0.94'}
                    stroke={
                      isSelected
                        ? '#60A5FA'
                        : isDimmed
                        ? 'rgba(148, 163, 184, 0.18)'
                        : 'rgba(147, 197, 253, 0.28)'
                    }
                    strokeWidth={isSelected ? '1.5' : '1'}
                  />
                  <text
                    x="12"
                    y="20"
                    fill={isSelected ? '#93C5FD' : '#60A5FA'}
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="9.5"
                    fontWeight="600"
                    opacity={isDimmed ? 0.55 : 1}
                  >
                    {node.code}
                  </text>
                  <text
                    x="30"
                    y="20"
                    fill="#F8FAFC"
                    fontFamily="'Outfit', sans-serif"
                    fontSize="12"
                    fontWeight="600"
                    opacity={isDimmed ? 0.65 : 1}
                  >
                    {node.label}
                  </text>
                  <text
                    x="12"
                    y="36"
                    fill="#94A3B8"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontSize="10"
                    fontWeight="500"
                    opacity={isDimmed ? 0.55 : 1}
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Crisp Architectural Footer Strip inside the Artwork */}
        <div className="border-t border-white/10 bg-[#050A14]/90 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-[#60A5FA] tracking-wide uppercase">
              {activeNode ? `SOPIN ${activeNode.label}` : 'Unified Execution Architecture'}
            </p>
            <p className="mt-0.5 text-xs text-[#CBD5E1] truncate">
              {activeNode
                ? activeNode.description
                : 'Select any node to inspect how authoring, context, decisions, and runtime connect.'}
            </p>
          </div>
          {activeNode && (
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="text-[11px] font-medium text-[#93C5FD] hover:text-white shrink-0 whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
