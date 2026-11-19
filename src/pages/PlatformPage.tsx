import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, Eye, Layers, Lock, Network, ShieldCheck } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface PlatformPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const PlatformPage: React.FC<PlatformPageProps> = ({ onNavigate }) => {
  const [gatewayMode, setGatewayMode] = useState<'routing' | 'schema' | 'fallback'>('routing');

  const gatewaySnippets = {
    routing: `gateway:
  profile: "reasoning-structured"
  routes:
    primary: { provider: "configured-reasoning-model", timeoutMs: 25000 }
    secondary: { provider: "configured-fast-model", timeoutMs: 12000 }
  policy:
    piiRedaction: "pre-inference"`,
    schema: `schema:
  name: "VerificationReport"
  strict: true
  rejectOnExtraKeys: true
  properties:
    verified: { type: "boolean" }
    citations: { type: "array", minItems: 1 }`,
    fallback: `fallbackPolicy:
  onTimeout: "route_to_secondary"
  onSchemaMismatch: "repair_attempt_max_1"
  onPolicyViolation: "abort_and_escalate"`,
  };

  return (
    <div className="overflow-x-clip">
      {/* Platform Header */}
      <section id="overview" className="border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Platform', 'Architecture Overview', 'SONIL Group']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white text-balance">
              One architectural stack from authoring to governance.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN eliminates the gap between experimental notebooks and accountable production systems. Every module shares a single typed specification for graphs, context scopes, tool permissions, and verification gates.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/studio')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Studio Overview</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/docs')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-semibold text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Read Architecture Docs</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Model Gateway */}
      <section id="gateway" className="py-20 border-b border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-5 min-w-0">
              <SectionHeader
                kicker="SOPIN Gateway"
                title="Unified Model Gateway with structural output guarantees."
                description="Decouple agent logic from individual model vendors. Route by task profile, enforce typed JSON schemas, and apply pre-inference sanitization in one place."
              />

              <div className="flex flex-wrap gap-2 pt-2">
                {(['routing', 'schema', 'fallback'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setGatewayMode(tab)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                      gatewayMode === tab
                        ? 'bg-[#6252E8] text-white'
                        : 'bg-white dark:bg-[#101126] text-[#777786] dark:text-[#B5B5C5] border border-[#101014]/10 dark:border-white/10'
                    }`}
                  >
                    {tab === 'routing' ? 'Task Routing' : tab === 'schema' ? 'Schema Enforcement' : 'Fallback Policy'}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 min-w-0">
              <CodeBlock
                label={`gateway.${gatewayMode}.yaml`}
                code={gatewaySnippets[gatewayMode]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Runtime */}
      <section id="runtime" className="py-20 border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="SOPIN Runtime"
            title="Isolated, checkpointed execution for real operational work."
            description="Agents do more than stream text—they invoke tools, run code, and wait for human approvals. SOPIN Runtime isolates every tool boundary and persists state across steps."
          />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <Cpu className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-[#101014] dark:text-white">
                Ephemeral Sandboxes
              </h3>
              <p className="mt-2 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                Code interpreters and local MCP servers run inside scoped containers with strict CPU, memory, and network egress limits.
              </p>
            </div>
            <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <Layers className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-[#101014] dark:text-white">
                Durable Checkpoints
              </h3>
              <p className="mt-2 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                Each completed node persists an immutable state snapshot so long-running workflows pause for human sign-off or recover without restarting from scratch.
              </p>
            </div>
            <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <Network className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-[#101014] dark:text-white">
                Idempotent Tool Retries
              </h3>
              <p className="mt-2 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                Configure deterministic retry backoffs and idempotency keys for external API mutations to prevent duplicate side effects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluations & Governance (Planned) */}
      <section id="evaluations" className="py-20 bg-[#101126] text-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5">
            <StatusText items={['SOPIN Evaluate & Observe', 'Roadmap Status: Planned']} dark accentLast />
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#965BFF]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold">
                Evaluations & Trace Replay
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#B5B5C5] leading-relaxed">
              Planned verification harnesses let teams test prompt, model, and graph revisions against curated regression datasets before promoting changes.
            </p>
            <ul className="space-y-2.5 text-sm text-[#D8D8E6]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Span-level inspection across retrieval, model inference, and MCP calls</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Deterministic schema and citation grounding assertions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Side-by-side comparison of candidate model routes</span>
              </li>
            </ul>
          </div>

          <div id="governance" className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5">
            <StatusText items={['SOPIN Control', 'Roadmap Status: Planned']} dark accentLast />
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#6252E8]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold">
                Governance & Policy Enforcement
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#B5B5C5] leading-relaxed">
              Designed for organizations requiring strict control over which agents may read sensitive corpora or invoke state-changing tools.
            </p>
            <ul className="space-y-2.5 text-sm text-[#D8D8E6]">
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Role-based tool allowlists and per-workflow credential scoping</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Mandatory human-in-the-loop sign-off gates on high-impact actions</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>Structured execution audit records under SONIL Group enterprise architecture</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Execution & Governance Preview */}
      <section className="py-20 bg-[#F7F7FA] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Execution & Control Surfaces"
            title="Inspect execution spans, evaluations, and governance controls."
            description="Switch across all eight realistic product previews—Studio, Flow, Context, Runtime, Gateway, Observe, Evaluate, and Control."
          />
          <ProductPreviews initialTab="observe" />
        </div>
      </section>
    </div>
  );
};
