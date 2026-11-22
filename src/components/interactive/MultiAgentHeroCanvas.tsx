import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  Code2,
  Database,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Wrench,
} from 'lucide-react';
import { WORKFLOW_SCENARIOS } from '../../data/sopinData';
import { CodeBlock, StatusText } from '../ui/EditorialPrimitives';

interface CollaborationStep {
  nodeIndex: number;
  activeActor: 'orchestrator' | 'context' | 'tools' | 'verifier';
  activeBus: 'a2a' | 'context' | 'gateway' | 'mcp' | 'policy';
  channelLabel: string;
}

const COLLAB_MAP: CollaborationStep[] = [
  { nodeIndex: 0, activeActor: 'orchestrator', activeBus: 'a2a', channelLabel: 'Intake -> Task Decomposition' },
  { nodeIndex: 1, activeActor: 'context', activeBus: 'context', channelLabel: 'Orchestrator <-> SOPIN Context' },
  { nodeIndex: 2, activeActor: 'orchestrator', activeBus: 'gateway', channelLabel: 'Orchestrator <-> Model Gateway' },
  { nodeIndex: 3, activeActor: 'tools', activeBus: 'mcp', channelLabel: 'Execution Agent -> MCP Sandbox' },
  { nodeIndex: 4, activeActor: 'verifier', activeBus: 'policy', channelLabel: 'Verifier <-> Assertion Harness' },
  { nodeIndex: 5, activeActor: 'verifier', activeBus: 'a2a', channelLabel: 'Verifier -> Human Sign-Off Gate' },
];

export const MultiAgentHeroCanvas: React.FC = () => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'collaboration' | 'sdk'>('collaboration');
  const [isPlaying, setIsPlaying] = useState(true);

  const scenario = WORKFLOW_SCENARIOS[scenarioIdx];
  const activeStep = COLLAB_MAP[stepIdx] ?? COLLAB_MAP[0];
  const activeNode = scenario.nodes[activeStep.nodeIndex] ?? scenario.nodes[0];

  useEffect(() => {
    if (!isPlaying || viewMode !== 'collaboration') return;
    const id = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % COLLAB_MAP.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [isPlaying, viewMode]);

  const selectScenario = (index: number) => {
    setScenarioIdx(index);
    setStepIdx(0);
  };

  const actors: {
    id: CollaborationStep['activeActor'];
    role: string;
    subtitle: string;
    targetNodeIndex: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'orchestrator',
      role: 'Planner Agent',
      subtitle: 'SOPIN Flow · Gateway',
      targetNodeIndex: 0,
      icon: Bot,
    },
    {
      id: 'context',
      role: 'Context Agent',
      subtitle: 'SOPIN Context · Index',
      targetNodeIndex: 1,
      icon: Database,
    },
    {
      id: 'tools',
      role: 'Execution Agent',
      subtitle: 'SOPIN Runtime · MCP',
      targetNodeIndex: 3,
      icon: Wrench,
    },
    {
      id: 'verifier',
      role: 'Governance Agent',
      subtitle: 'Evaluate · Control',
      targetNodeIndex: 4,
      icon: ShieldCheck,
    },
  ];

  const infrastructure = [
    { id: 'context', label: 'Knowledge & Memory', spec: 'Scoped Provenance' },
    { id: 'gateway', label: 'Model Gateway', spec: 'Typed Schemas' },
    { id: 'mcp', label: 'MCP Tool Sandbox', spec: 'Least-Privilege' },
    { id: 'policy', label: 'Policy & Approvals', spec: 'Human Gates' },
  ];

  return (
    <div className="h-full w-full min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#0A1226] text-white flex flex-col overflow-hidden shadow-2xl">
      {/* Top Studio Header */}
      <div className="px-3.5 sm:px-5 py-3 border-b border-white/10 bg-white/[0.025] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar max-w-full">
          {WORKFLOW_SCENARIOS.map((item, idx) => {
            const active = idx === scenarioIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectScenario(idx)}
                className={`relative min-h-[38px] sm:min-h-[32px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'text-white' : 'text-[#B5B5C5] hover:text-white hover:bg-white/10'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="hero-collab-scenario"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#2563EB]"
                  />
                )}
                <span className="relative z-10">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('collaboration')}
            className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'collaboration'
                ? 'bg-[#FFFFFF] text-[#111827]'
                : 'text-[#B5B5C5] hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Agents</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setViewMode('sdk');
            }}
            className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'sdk' ? 'bg-[#FFFFFF] text-[#111827]' : 'text-[#B5B5C5] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SDK</span>
          </button>
        </div>
      </div>

      {/* Deterministic Step Progress Bar */}
      <div className="h-0.5 w-full bg-white/10 overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
          initial={false}
          animate={{ scaleX: (stepIdx + 1) / COLLAB_MAP.length }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
        />
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4 sopin-grid-dark min-w-0">
        {/* Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <StatusText
              items={[scenario.domain, activeStep.channelLabel]}
              dark
              accentLast
            />
          </div>

          {viewMode === 'collaboration' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[34px] px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx((prev) => (prev + 1) % COLLAB_MAP.length);
                }}
                className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[34px] px-3 rounded-lg bg-[#FFFFFF] text-[#111827] hover:bg-[#F7F8FA] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <SkipForward className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                <span className="tabular-nums">
                  {stepIdx + 1}/{COLLAB_MAP.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx(0);
                }}
                aria-label="Reset collaboration trace"
                className="min-h-[40px] min-w-[40px] sm:min-h-[34px] sm:min-w-[34px] inline-flex items-center justify-center rounded-lg border border-white/15 text-[#C5C5D6] hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'collaboration' ? (
            <motion.div
              key={`collab-${scenario.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 min-w-0"
            >
              {/* Row 1: Four Collaborating Agents */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {actors.map((actor) => {
                  const Icon = actor.icon;
                  const isActive = activeStep.activeActor === actor.id;
                  return (
                    <button
                      key={actor.id}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setStepIdx(actor.targetNodeIndex);
                      }}
                      className={`relative text-left rounded-xl p-3 border transition-colors ${
                        isActive
                          ? 'border-[#60A5FA] bg-[#2563EB]/25'
                          : 'border-white/10 bg-[#05070E]/75 hover:border-white/25'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="hero-collab-actor"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-xl ring-1 ring-[#60A5FA] pointer-events-none"
                        />
                      )}
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white/[0.06] text-[#7EC8FF]'
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="font-mono text-[10px] text-[#9A9AB0]">A2A</span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-white relative z-10">
                        {actor.role}
                      </div>
                      <div className="text-[11px] text-[#9A9AB0] truncate relative z-10">
                        {actor.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Animated Multi-Agent Signal Conduit */}
              <div className="relative py-1" aria-hidden="true">
                <svg
                  viewBox="0 0 600 44"
                  fill="none"
                  className="w-full h-9 overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Base horizontal protocol bus */}
                  <line
                    x1="75"
                    y1="22"
                    x2="525"
                    y2="22"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1.5"
                  />
                  {/* Vertical stubs to 4 agents (top) & 4 platform systems (bottom) */}
                  {[75, 225, 375, 525].map((x, i) => {
                    const actorMatch = actors[i]?.id === activeStep.activeActor;
                    const busMatch = infrastructure[i]?.id === activeStep.activeBus;
                    return (
                      <g key={x}>
                        <line
                          x1={x}
                          y1="0"
                          x2={x}
                          y2="22"
                          stroke={actorMatch ? '#60A5FA' : 'rgba(255,255,255,0.14)'}
                          strokeWidth={actorMatch ? '2' : '1.25'}
                        />
                        <line
                          x1={x}
                          y1="22"
                          x2={x}
                          y2="44"
                          stroke={busMatch ? '#2563EB' : 'rgba(255,255,255,0.14)'}
                          strokeWidth={busMatch ? '2' : '1.25'}
                        />
                        <circle
                          cx={x}
                          cy="22"
                          r={actorMatch || busMatch ? '4' : '2.5'}
                          fill={actorMatch || busMatch ? '#60A5FA' : 'rgba(255,255,255,0.35)'}
                        />
                      </g>
                    );
                  })}

                  {/* Animated signal pulse moving along the A2A/MCP bus */}
                  <motion.circle
                    cy="22"
                    r="4"
                    fill="#FFFFFF"
                    animate={{ cx: [75, 525, 75] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                  />
                </svg>
              </div>

              {/* Row 2: Shared Tools, Knowledge & Governance Substrates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {infrastructure.map((infra, idx) => {
                  const isBusActive = activeStep.activeBus === infra.id;
                  return (
                    <div
                      key={infra.id}
                      className={`rounded-xl p-2.5 border transition-colors ${
                        isBusActive
                          ? 'border-[#2563EB] bg-[#2563EB]/15'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-[#9A9AB0] tabular-nums">
                        0{idx + 1} · Substrate
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-white truncate">
                        {infra.label}
                      </div>
                      <div className="text-[11px] text-[#7EC8FF] truncate">
                        {infra.spec}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 3: 6-Stage Step Selector + Live Payload Inspector */}
              <div className="rounded-xl border border-white/12 bg-[#05070E]/90 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/10">
                  {scenario.nodes.map((node, idx) => {
                    const selected = idx === stepIdx;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIdx(idx);
                        }}
                        className={`px-2.5 py-1 rounded-md font-mono text-[11px] tabular-nums transition-colors ${
                          selected
                            ? 'bg-[#2563EB] text-white'
                            : idx < stepIdx
                            ? 'bg-white/10 text-[#E8E8F2]'
                            : 'text-[#9A9AB0] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {node.stage}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${scenario.id}-${activeNode.id}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-[#60A5FA]">
                          {activeNode.stage} · {activeNode.module}
                        </span>
                        <h3 className="font-display text-base font-semibold text-white">
                          {activeNode.title}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-[#B5B5C5]">
                        {activeNode.protocol}
                      </span>
                    </div>

                    <p className="text-xs text-[#C5C5D6] leading-relaxed">
                      {activeNode.summary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5 min-w-0">
                        <div className="text-[11px] font-medium text-[#9A9AB0] mb-1">
                          Input Contract
                        </div>
                        <code className="block font-mono text-[11px] text-[#E8E8F2] break-words">
                          {activeNode.inputSample}
                        </code>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5 min-w-0">
                        <div className="text-[11px] font-medium text-[#9A9AB0] mb-1">
                          Output Artifact
                        </div>
                        <code className="block font-mono text-[11px] text-[#E8E8F2] break-words">
                          {activeNode.outputSample}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#C5C5D6]">
                      <ShieldCheck className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
                      <span>{activeNode.policyCheck}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`sdk-${scenario.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-center min-w-0"
            >
              <CodeBlock
                code={scenario.sdkSnippet}
                label={`@sopin/sdk · ${scenario.id}.ts`}
              />
              <p className="mt-3 text-xs text-[#A4A4B5]">
                Every multi-agent collaboration topology compiles directly to typed SDK definitions for deterministic version control.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
