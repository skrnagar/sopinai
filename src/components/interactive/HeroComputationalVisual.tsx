import React, { useState } from 'react';
import { motion } from 'motion/react';

const HERO_NODES = [
  {
    id: 'studio',
    label: 'SOPIN Studio',
    role: 'Intent & Spec Authoring',
    detail: 'Compiles visual graphs, natural language, and TypeScript SDK contracts into typed blueprints.',
    cx: 120,
    cy: 112,
  },
  {
    id: 'context',
    label: 'SOPIN Context',
    role: 'Scoped Retrieval & Memory',
    detail: 'Hydrates working state and SHA-256 checksum-verified corpus passages within tenant ACLs.',
    cx: 360,
    cy: 86,
  },
  {
    id: 'gateway',
    label: 'SOPIN Gateway',
    role: 'Model, ML & MCP Router',
    detail: 'Routes across LLMs and custom ML endpoints with pre-inference PII redaction and schema locks.',
    cx: 240,
    cy: 204,
  },
  {
    id: 'runtime',
    label: 'SOPIN Runtime',
    role: 'Sandboxed Execution & Decisions',
    detail: 'Executes bounded Flow/Graph steps and deterministic rule tables inside ephemeral sandboxes.',
    cx: 128,
    cy: 304,
  },
  {
    id: 'control',
    label: 'Verify & Control',
    role: 'Observe · Evaluate · Govern',
    detail: 'Captures span waterfalls, validates regression assertions, and enforces human approval gates.',
    cx: 362,
    cy: 298,
  },
] as const;

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 4],
];

export const HeroComputationalVisual: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(2);
  const activeNode = HERO_NODES[activeIndex];

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[430px] rounded-2xl border border-[#1E293B] bg-[#080D18] text-white overflow-hidden shadow-[0_24px_60px_-15px_rgba(8,13,24,0.45)] flex flex-col justify-between">
      {/* Subtle Neo-Blue atmospheric corner illumination inspired by SOPIN brand palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(65% 65% at 88% 92%, rgba(59, 130, 246, 0.34) 0%, rgba(29, 78, 216, 0.14) 48%, transparent 80%), radial-gradient(45% 45% at 10% 8%, rgba(37, 99, 235, 0.14) 0%, transparent 72%)',
        }}
      />

      {/* Minimal Top Bar */}
      <div className="relative z-10 px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#101D35]/60 backdrop-blur-sm">
        <span className="font-mono text-xs text-[#93C5FD] tracking-tight">
          sopin.execution.topology
        </span>
        <span className="font-mono text-[11px] text-[#94A3B8]">
          Deterministic &amp; Agentic Core
        </span>
      </div>

      {/* Central Abstract Computational Geometry + Connected Nodes */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-3 py-4">
        <svg
          viewBox="0 0 480 370"
          className="w-full max-w-[480px] h-auto select-none"
          role="img"
          aria-label="Interactive SOPIN unified execution topology"
        >
          <defs>
            <radialGradient id="sopin-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sopin-edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Subtle Concentric Orbital Architecture */}
          <circle
            cx="240"
            cy="204"
            r="148"
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <circle
            cx="240"
            cy="204"
            r="96"
            fill="none"
            stroke="rgba(59, 130, 246, 0.18)"
            strokeWidth="1"
          />

          {/* Ambient glow behind active node */}
          <motion.circle
            animate={{ cx: activeNode.cx, cy: activeNode.cy }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            r="58"
            fill="url(#sopin-node-glow)"
          />

          {/* Edges */}
          {EDGES.map(([aIdx, bIdx]) => {
            const a = HERO_NODES[aIdx];
            const b = HERO_NODES[bIdx];
            const highlighted = aIdx === activeIndex || bIdx === activeIndex;
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke={highlighted ? '#60A5FA' : 'url(#sopin-edge-grad)'}
                strokeWidth={highlighted ? 1.8 : 1.1}
                strokeOpacity={highlighted ? 0.95 : 0.45}
              />
            );
          })}

          {/* Interactive Nodes */}
          {HERO_NODES.map((node, idx) => {
            const isSelected = idx === activeIndex;
            const isCenter = idx === 2;
            const boxW = isCenter ? 132 : 124;
            const boxH = 44;
            return (
              <g
                key={node.id}
                transform={`translate(${node.cx - boxW / 2}, ${node.cy - boxH / 2})`}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}: ${node.role}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  width={boxW}
                  height={boxH}
                  rx="10"
                  fill={isSelected ? '#101D35' : '#0B1325'}
                  stroke={isSelected ? '#60A5FA' : 'rgba(148, 163, 184, 0.28)'}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <text
                  x="12"
                  y="19"
                  fill={isSelected ? '#FFFFFF' : '#E2E8F0'}
                  fontSize="11.5"
                  fontWeight="600"
                  fontFamily="Outfit, system-ui, sans-serif"
                >
                  {node.label}
                </text>
                <text
                  x="12"
                  y="33"
                  fill={isSelected ? '#93C5FD' : '#94A3B8'}
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.id.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Selected Layer Inspector */}
      <div className="relative z-10 px-5 py-4 border-t border-white/10 bg-[#101D35]/75 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-sm font-semibold text-white">
            {activeNode.label} · {activeNode.role}
          </span>
          <span className="font-mono text-[11px] text-[#60A5FA]">
            0{activeIndex + 1} / 05
          </span>
        </div>
        <p className="mt-1 text-xs text-[#CBD5E1] leading-relaxed">
          {activeNode.detail}
        </p>
      </div>
    </div>
  );
};
