import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Cpu, Database, Layers, ShieldCheck } from 'lucide-react';
import { RoutePath } from '../../types/navigation';
import { CodeBlock, StatusText } from '../ui/EditorialPrimitives';

interface StackLayer {
  id: string;
  order: string;
  name: string;
  modules: string;
  status: string;
  headline: string;
  description: string;
  highlights: string[];
  route: RoutePath;
  sectionId?: string;
  codeLabel: string;
  code: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STACK_LAYERS: StackLayer[] = [
  {
    id: 'authoring',
    order: 'Layer 01',
    name: 'Authoring & Blueprints',
    modules: 'SOPIN Studio · SDK',
    status: 'Core Architecture',
    headline: 'Visual graphs and typed TypeScript stay 1:1 synchronized.',
    description:
      'Design workflows via natural language intent, visual DAGs, cyclic state graphs, or code-first SDK definitions. Every edit compiles to the same deterministic blueprint.',
    highlights: [
      'Bidirectional Studio-to-Git workflow specifications',
      'Strict Zod / JSON Schema input and output contracts',
      'Zero translation loss between prototype and runtime',
    ],
    route: '/studio',
    codeLabel: 'blueprint.studio.ts',
    code: `import { defineAgent, z } from "@sopin/sdk";

export const triageAgent = defineAgent({
  name: "ops-triage",
  outputSchema: z.object({
    severity: z.enum(["low", "elevated", "critical"]),
    recommendedRunbook: z.string()
  })
});`,
    icon: Layers,
  },
  {
    id: 'orchestration',
    order: 'Layer 02',
    name: 'Orchestration, Decisions & Memory',
    modules: 'SOPIN Flow · Decisions · Context',
    status: 'Core Architecture',
    headline: 'Deterministic control flow, executable business rules, and scoped memory.',
    description:
      'Combine explicit conditional branching, deterministic SOPIN Decisions tables/rules, and human approval pauses with isolated ephemeral, episodic, and grounded knowledge indexes.',
    highlights: [
      'Three-tier context isolation with provenance checksums',
      'Durable step checkpoints across long-running pauses',
      'Bounded cyclic graph execution with step ceilings',
    ],
    route: '/workflow-automation',
    codeLabel: 'flow.context.ts',
    code: `import { defineWorkflow, step } from "@sopin/sdk";

export const flow = defineWorkflow({
  steps: [
    step.context("loadPolicy", { corpus: "runbooks", topK: 4 }),
    step.branch("routeRisk", {
      when: (s) => s.severity === "critical",
      then: step.humanGate("oncall-lead")
    })
  ]
});`,
    icon: Database,
  },
  {
    id: 'execution',
    order: 'Layer 03',
    name: 'Gateway & Runtime',
    modules: 'SOPIN Gateway · Runtime',
    status: 'Core Architecture',
    headline: 'Vendor-neutral model routing and sandboxed tool calls.',
    description:
      'Route prompts across configured model profiles with pre-inference sanitization, while executing MCP tools and A2A peer handoffs inside isolated sandboxes.',
    highlights: [
      'Native Model Context Protocol (MCP) & A2A interoperability',
      'Ephemeral execution containers with egress allowlists',
      'Idempotent retry policies and fallback model routing',
    ],
    route: '/platform',
    sectionId: 'runtime',
    codeLabel: 'gateway.runtime.ts',
    code: `export const runtimeConfig = {
  gateway: { route: "reasoning-structured", piiRedaction: true },
  sandbox: { networkEgress: "allowlist-only", timeoutMs: 20000 },
  protocols: ["MCP/stdio", "A2A/1.0"]
};`,
    icon: Cpu,
  },
  {
    id: 'governance',
    order: 'Layer 04',
    name: 'Verification & Governance',
    modules: 'Observe · Evaluate · Control',
    status: 'Roadmap · Planned',
    headline: 'Assertion harnesses, trace replay, and policy boundaries.',
    description:
      'Verify outputs against citation and schema assertions prior to promotion, inspect span-level execution traces, and enforce least-privilege RBAC boundaries.',
    highlights: [
      'Regression evaluation suites before workflow release (Planned)',
      'Span-level trace replay across prompts and tool calls (Planned)',
      'Role-based approval queues and audit lineage (Planned)',
    ],
    route: '/platform',
    sectionId: 'governance',
    codeLabel: 'control.policy.ts',
    code: `export const governancePolicy = {
  assertions: ["require_source_citations", "schema_strict"],
  approvals: { onToolScope: "write", requiredRole: "maintainer" },
  auditTrace: "immutable-span-log" // Planned
};`,
    icon: ShieldCheck,
  },
];

interface InteractiveAgentStackProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const InteractiveAgentStack: React.FC<InteractiveAgentStackProps> = ({ onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLayer = STACK_LAYERS[activeIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Left: Interactive 4-Layer Architectural Stack */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-3 relative">
        {STACK_LAYERS.map((layer, idx) => {
          const Icon = layer.icon;
          const isActive = idx === activeIndex;
          return (
            <div key={layer.id} className="relative">
              <button
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`relative w-full text-left rounded-2xl border p-5 transition-colors ${
                  isActive
                    ? 'border-[#2563EB] bg-white dark:bg-[#0A1226] shadow-lg'
                    : 'border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226]/45 hover:border-[#2563EB]/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sopin-stack-active-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-2xl ring-1 ring-[#2563EB]/60 pointer-events-none"
                  />
                )}

                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white dark:bg-[#05070E] border border-[#05070E]/10 dark:border-white/10 text-[#2563EB] dark:text-[#60A5FA]'
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
                        <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">
                          {layer.order}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{layer.status}</span>
                      </div>
                      <h3 className="mt-0.5 font-display text-lg font-semibold text-[#05070E] dark:text-white">
                        {layer.name}
                      </h3>
                      <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                        {layer.modules}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 mt-1 shrink-0 transition-transform ${
                      isActive
                        ? 'text-[#2563EB] dark:text-[#60A5FA] translate-x-0.5'
                        : 'text-[#5E5E6E]/60 dark:text-[#A4A4B5]/60'
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* Animated vertical signal link between layers */}
              {idx < STACK_LAYERS.length - 1 && (
                <div className="h-3 flex justify-center items-center" aria-hidden="true">
                  <div className="w-px h-full bg-[#05070E]/15 dark:bg-white/15 relative overflow-hidden">
                    {idx === activeIndex && (
                      <motion.div
                        initial={{ y: -12 }}
                        animate={{ y: 12 }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                        className="w-full h-3 bg-[#60A5FA]"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Synchronized Layer Inspector & Code Parity */}
      <div className="lg:col-span-7 flex">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLayer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#0A1226] p-7 sm:p-8 flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusText
                  items={[activeLayer.order, activeLayer.modules, activeLayer.status]}
                  accentLast={activeLayer.status.includes('Planned')}
                />
                <button
                  type="button"
                  onClick={() => onNavigate(activeLayer.route, activeLayer.sectionId)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>Explore Layer</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <h3 className="mt-3 font-display text-2xl font-semibold text-[#05070E] dark:text-white leading-snug">
                {activeLayer.headline}
              </h3>

              <p className="mt-3 text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                {activeLayer.description}
              </p>

              <ul className="mt-5 grid grid-cols-1 gap-2.5">
                {activeLayer.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[#05070E] dark:text-[#E8E8F2]"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <CodeBlock label={activeLayer.codeLabel} code={activeLayer.code} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
