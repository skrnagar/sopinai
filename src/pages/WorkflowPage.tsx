import React from 'react';
import { ArrowRight, GitBranch, PauseCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface WorkflowPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const WorkflowPage: React.FC<WorkflowPageProps> = ({ onNavigate }) => {
  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#E5E7EB] bg-[#FFFFFF] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Flow', 'Deterministic Workflow Automation']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#111827] text-balance">
              Orchestrate deterministic pipelines around intelligent steps.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#667085] leading-relaxed">
              Not every step should be left to open-ended reasoning. SOPIN Flow pairs explicit DAG control flow, deterministic SOPIN Decisions nodes, bounded retries, and human approval checkpoints with LLM and MCP steps.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/docs')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>View Flow Specification</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/decisions')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#111827] hover:bg-[#F7F8FA] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore SOPIN Decisions</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/context')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#111827] hover:bg-[#F7F8FA] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Context &amp; Memory</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#F7F8FA] border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Workflow Designer Preview"
            title="Simulate conditional routing and checkpoint gates."
            description="Test elevated vs. standard risk branches inside the SOPIN Flow designer, or switch across all nine SOPIN workspace interfaces."
          />
          <ProductPreviews initialTab="flow" />
        </div>
      </section>

      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-6 space-y-6 min-w-0">
            <SectionHeader
              kicker="Execution Control"
              title="Predictable control primitives at every node."
              description="Explicit orchestration removes hidden failure modes from multi-step automation."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <GitBranch className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-base font-semibold text-[#111827]">
                  Typed Branching
                </h3>
                <p className="mt-1.5 text-sm text-[#667085]">
                  Route edges based on validated schema fields rather than brittle string matching.
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <RefreshCw className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-base font-semibold text-[#111827]">
                  Bounded Retries
                </h3>
                <p className="mt-1.5 text-sm text-[#667085]">
                  Configure backoff, circuit breakers, and fallback model routes per step.
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <PauseCircle className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-base font-semibold text-[#111827]">
                  Pause &amp; Resume Gates
                </h3>
                <p className="mt-1.5 text-sm text-[#667085]">
                  Checkpoint execution state while waiting on human review or external webhook signals.
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <ShieldAlert className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-base font-semibold text-[#111827]">
                  Dead-Letter Routing
                </h3>
                <p className="mt-1.5 text-sm text-[#667085]">
                  Capture unrecoverable payloads cleanly with full execution context for inspection.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 min-w-0">
            <CodeBlock
              label="workflows/invoice-reconciliation.ts"
              code={`import { defineWorkflow, step, humanGate } from "@sopin/sdk";

export const invoiceFlow = defineWorkflow({
  name: "invoice-exception-flow",
  retryPolicy: { maxAttempts: 3, backoff: "exponential" },
  steps: [
    step.mcp("extractFields", { server: "doc-parser" }),
    step.context("matchPurchaseOrder", { index: "erp-po-records" }),
    step.branch("checkVariance", {
      when: (ctx) => ctx.varianceAmount > 0,
      then: humanGate("finance-approver", { timeoutHours: 24 }),
      else: step.mcp("markReconciled", { server: "ledger-write" })
    })
  ]
});`}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
