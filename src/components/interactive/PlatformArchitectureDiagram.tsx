import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { RoutePath } from '../../types/navigation';

interface PlatformArchitectureDiagramProps {
  onNavigate?: (path: RoutePath) => void;
}

interface ArchNode {
  id: string;
  layer: string;
  name: string;
  role: string;
  summary: string;
  href: RoutePath;
}

const ARCH_LAYERS: {
  tier: string;
  subtitle: string;
  nodes: ArchNode[];
}[] = [
  {
    tier: '01 · Authoring & Design Layer',
    subtitle: 'Unified blueprint creation',
    nodes: [
      {
        id: 'studio',
        layer: 'Authoring',
        name: 'SOPIN Studio',
        role: 'Visual, NL & Code Spec Workbench',
        summary: 'Bridges plain-language specs, visual DAGs, cyclic graphs, and typed SDK definitions in one shared blueprint.',
        href: '/studio',
      },
    ],
  },
  {
    tier: '02 · Orchestration, Context & Deterministic Logic',
    subtitle: 'Control flow, state & business rules',
    nodes: [
      {
        id: 'flow',
        layer: 'Workflows',
        name: 'SOPIN Flow',
        role: 'Deterministic DAG & Checkpoints',
        summary: 'Orchestrates branching pipelines, Decision Nodes, retries, and pause-and-resume human approval gates.',
        href: '/flow',
      },
      {
        id: 'graph',
        layer: 'Multi-Agent',
        name: 'SOPIN Graph',
        role: 'Cyclic State & A2A Handoffs',
        summary: 'Coordinates planner, researcher, and verifier loops with typed reducers and hard maxSteps limits.',
        href: '/graph',
      },
      {
        id: 'context',
        layer: 'Memory',
        name: 'SOPIN Context',
        role: 'Three-Tier Scoped Memory & RAG',
        summary: 'Separates working run state, episodic history, and grounded knowledge corpora with SHA-256 citations.',
        href: '/context',
      },
      {
        id: 'decisions',
        layer: 'Rules Engine',
        name: 'SOPIN Decisions',
        role: 'Rules, Tables, Chains & Scorecards',
        summary: 'Evaluates pricing, eligibility, SLA, and routing policies deterministically with zero LLM variance.',
        href: '/decisions',
      },
    ],
  },
  {
    tier: '03 · Routing & Sandboxed Execution Plane',
    subtitle: 'Models, tools & isolated compute',
    nodes: [
      {
        id: 'gateway',
        layer: 'Inference & Tools',
        name: 'SOPIN Gateway',
        role: 'Model, Multimodal, ML & MCP Router',
        summary: 'Provides failover routing across frontier LLMs, custom ML endpoints, schema locks, and PII redaction.',
        href: '/gateway',
      },
      {
        id: 'runtime',
        layer: 'Execution',
        name: 'SOPIN Runtime',
        role: 'Ephemeral Sandboxes & Checkpoints',
        summary: 'Runs MCP tool servers and code inside isolated read-only containers with explicit egress allowlists.',
        href: '/runtime',
      },
    ],
  },
  {
    tier: '04 · Verification, Telemetry & Enterprise Governance',
    subtitle: 'Accountable oversight & control',
    nodes: [
      {
        id: 'observe',
        layer: 'Telemetry',
        name: 'SOPIN Observe',
        role: 'Execution Spans & State Diffs',
        summary: 'Correlates triggers, Context lookups, Decisions traces, and Gateway calls across full trace waterfalls.',
        href: '/observe',
      },
      {
        id: 'evaluate',
        layer: 'Quality Gates',
        name: 'SOPIN Evaluate',
        role: 'Regression Suites & Benchmarks',
        summary: 'Validates prompts, models, and indexes against golden datasets before workflow promotion.',
        href: '/evaluate',
      },
      {
        id: 'control',
        layer: 'Governance',
        name: 'SOPIN Control',
        role: 'RBAC, Budgets & Approval Queues',
        summary: 'Enforces out-of-band tool permissions, spend caps, and human sign-off queues across workspaces.',
        href: '/control',
      },
    ],
  },
];

export const PlatformArchitectureDiagram: React.FC<PlatformArchitectureDiagramProps> = ({
  onNavigate,
}) => {
  const [selectedId, setSelectedId] = useState<string>('flow');

  const allNodes = ARCH_LAYERS.flatMap((l) => l.nodes);
  const selectedNode = allNodes.find((n) => n.id === selectedId) ?? allNodes[0];

  return (
    <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18] overflow-hidden shadow-[0_1px_3px_rgba(17,24,39,0.05)]">
      {/* Architectural Diagram Grid */}
      <div className="p-5 sm:p-8 space-y-5 sopin-grid-light dark:sopin-grid-dark">
        {ARCH_LAYERS.map((tier, tierIdx) => (
          <div key={tier.tier} className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                {tier.tier}
              </span>
              <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{tier.subtitle}</span>
            </div>

            <div
              className={`grid gap-3 ${
                tier.nodes.length === 1
                  ? 'grid-cols-1'
                  : tier.nodes.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : tier.nodes.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {tier.nodes.map((node) => {
                const active = node.id === selectedId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={`text-left rounded-xl border p-4 transition-all min-h-[76px] ${
                      active
                        ? 'border-[#2563EB] bg-[#2563EB]/[0.06] dark:bg-[#101D35] ring-1 ring-[#2563EB]'
                        : 'border-[#E5E7EB] dark:border-white/10 bg-[#FBF7F0] dark:bg-[#101D35]/50 hover:border-[#2563EB]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                        {node.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#667085] dark:text-[#94A3B8]">
                        {node.layer}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085] dark:text-[#CBD5E1] leading-snug">
                      {node.role}
                    </p>
                  </button>
                );
              })}
            </div>

            {tierIdx < ARCH_LAYERS.length - 1 && (
              <div className="flex justify-center pt-1" aria-hidden="true">
                <div className="flex items-center gap-6">
                  <span className="h-4 w-px bg-[#2563EB]/35" />
                  <span className="font-mono text-[10px] text-[#667085] dark:text-[#94A3B8]">
                    typed contract boundary
                  </span>
                  <span className="h-4 w-px bg-[#2563EB]/35" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Layer Inspection Bar */}
      <div className="px-5 sm:px-8 py-5 border-t border-[#E5E7EB] dark:border-white/10 bg-[#FBF7F0] dark:bg-[#101D35]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-xs text-[#2563EB] dark:text-[#60A5FA]">
            <span>{selectedNode.name}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedNode.role}</span>
          </div>
          <p className="text-sm text-[#111827] dark:text-[#E2E8F0] leading-relaxed">
            {selectedNode.summary}
          </p>
        </div>

        {onNavigate && (
          <a
            href={selectedNode.href}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(selectedNode.href);
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explore {selectedNode.name}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
};
