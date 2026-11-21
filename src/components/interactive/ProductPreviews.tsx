import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Database,
  Eye,
  FlaskConical,
  GitBranch,
  Layers,
  Lock,
  Network,
  PauseCircle,
  Scale,
  ShieldCheck,
  Sliders,
  Terminal,
  XCircle,
} from 'lucide-react';
import { StatusText } from '../ui/EditorialPrimitives';
import { HighlightedCode } from '../ui/HighlightedCode';

export type PreviewSurfaceId =
  | 'studio'
  | 'flow'
  | 'decisions'
  | 'context'
  | 'runtime'
  | 'gateway'
  | 'observe'
  | 'evaluate'
  | 'control';

interface ProductPreviewsProps {
  initialTab?: PreviewSurfaceId;
}

const STUDIO_NODES = [
  {
    id: 'intake',
    title: 'PR Intake Parser',
    kind: 'Trigger · Webhook',
    model: 'Deterministic Schema',
    memoryScope: 'ephemeral:run',
    tools: ['git.diff'],
    schema: 'PullRequestPayload',
  },
  {
    id: 'context',
    title: 'Architecture Retriever',
    kind: 'Context · SOPIN Context',
    model: 'Hybrid Index Lookup',
    memoryScope: 'corpus:adr-records',
    tools: ['context.query'],
    schema: 'CitationChunk[]',
  },
  {
    id: 'reviewer',
    title: 'Diff Auditor Agent',
    kind: 'Agent · SOPIN Gateway',
    model: 'reasoning-structured',
    memoryScope: 'ephemeral:run',
    tools: ['ci.testRunner'],
    schema: 'ReviewFindings',
  },
];

const CONTEXT_TIERS = [
  {
    id: 'ephemeral',
    label: 'Tier 01 · Ephemeral State',
    scope: 'run:pr-audit-481',
    retention: 'Auto-purged on run completion',
    records: [
      {
        key: 'diff.changedModules',
        source: 'git.diff',
        checksum: 'sha256:9f21...a8b',
        snippet: '["packages/runtime/sandbox.ts", "packages/gateway/redactor.ts"]',
      },
      {
        key: 'step.findingsDraft',
        source: 'gateway.structured',
        checksum: 'sha256:3c04...e12',
        snippet: '{ "severity": "elevated", "requiresTestRun": true }',
      },
    ],
  },
  {
    id: 'episodic',
    label: 'Tier 02 · Episodic Memory',
    scope: 'workspace:sonil-core',
    retention: 'Scoped by repository & branch policy',
    records: [
      {
        key: 'priorDecision.sandboxEgress',
        source: 'review-history',
        checksum: 'sha256:7d18...90f',
        snippet: 'Maintainers require networkEgress="disabled" for untrusted test runners.',
      },
    ],
  },
  {
    id: 'corpus',
    label: 'Tier 03 · Grounded Corpus',
    scope: 'index:architecture-adr',
    retention: 'Versioned document snapshots',
    records: [
      {
        key: 'ADR-014 §3.2',
        source: 'docs/adr/014-sandbox-isolation.md',
        checksum: 'sha256:81e9...c41',
        snippet: 'Every MCP tool server executing repository code must run with ephemeral filesystem mounts.',
      },
      {
        key: 'SECURITY-SPEC-02 §1.4',
        source: 'docs/security/spec-02.md',
        checksum: 'sha256:4a11...f09',
        snippet: 'Credential tokens issued to runtime nodes expire immediately upon step completion.',
      },
    ],
  },
];

const RUNTIME_SANDBOXES = [
  {
    id: 'sbx-ci-runner',
    tool: 'ci.testRunner',
    transport: 'MCP / stdio',
    egress: 'Disabled',
    filesystem: 'Ephemeral Read-Only',
    state: 'Active Step',
    command: 'vitest run executor.spec.ts --reporter=json',
  },
  {
    id: 'sbx-doc-parser',
    tool: 'doc.extractMarkdown',
    transport: 'MCP / stdio',
    egress: 'Disabled',
    filesystem: 'Isolated /tmp',
    state: 'Standby',
    command: 'parse-structured --strict-checksums',
  },
  {
    id: 'sbx-queue-read',
    tool: 'ticket.inspectMetadata',
    transport: 'MCP / HTTP',
    egress: 'Allowlist Only',
    filesystem: 'Stateless',
    state: 'Policy Scoped',
    command: 'GET /internal/ops-queue/dlq?limit=10',
  },
];

const GATEWAY_PROFILES = [
  {
    id: 'reasoning-structured',
    name: 'reasoning-structured',
    role: 'Complex synthesis & schema-locked outputs',
    fallback: 'deterministic-fast',
    piiMode: 'Pre-Inference Redaction Active',
    schema: 'ReviewFindings (Strict JSON)',
    samplePayload: '{ "piiRedactedFields": ["authorEmail", "apiToken"], "schemaEnforced": true }',
  },
  {
    id: 'deterministic-fast',
    name: 'deterministic-fast',
    role: 'Low-variance classification & enum routing',
    fallback: 'escalate-human-gate',
    piiMode: 'Pre-Inference Redaction Active',
    schema: 'RiskEnum ("low" | "elevated" | "critical")',
    samplePayload: '{ "temperature": 0.0, "allowedValues": ["low", "elevated", "critical"] }',
  },
  {
    id: 'citation-audit',
    name: 'citation-audit',
    role: 'Cross-verifying claims against source passages',
    fallback: 'reject-ungrounded',
    piiMode: 'Corpus Classification Filter',
    schema: 'CitationAuditResult',
    samplePayload: '{ "requireChecksumMatch": true, "rejectUngroundedParagraphs": true }',
  },
];

const TIMELINE_SPANS = [
  {
    id: 'span-1',
    name: 'flow.trigger.intake',
    module: 'SOPIN Flow',
    offsetPct: 0,
    widthPct: 16,
    durationLabel: 'Step 01 · Normalize',
    status: 'Completed',
    payload: '{ "event": "pull_request.synchronize", "changedFiles": 6, "tenant": "sonil-eng" }',
  },
  {
    id: 'span-2',
    name: 'context.retrieve(adr-records)',
    module: 'SOPIN Context',
    offsetPct: 14,
    widthPct: 26,
    durationLabel: 'Step 02 · Grounding',
    status: 'Completed',
    payload: '{ "corpus": "architecture-adr", "matched": 4, "checksum": "sha256:81e9...c4" }',
  },
  {
    id: 'span-3',
    name: 'gateway.infer(reasoning-structured)',
    module: 'SOPIN Gateway',
    offsetPct: 38,
    widthPct: 32,
    durationLabel: 'Step 03 · Inference',
    status: 'Completed',
    payload: '{ "schema": "ReviewFindings", "piiRedacted": true, "findings": 1 }',
  },
  {
    id: 'span-4',
    name: 'runtime.mcp(ci.testRunner)',
    module: 'SOPIN Runtime',
    offsetPct: 54,
    widthPct: 28,
    durationLabel: 'Step 04 · Sandbox',
    status: 'Completed',
    payload: '{ "sandbox": "egress-disabled", "target": "executor.spec.ts", "exitCode": 0 }',
  },
  {
    id: 'span-5',
    name: 'control.humanGate(maintainer)',
    module: 'SOPIN Control (Planned)',
    offsetPct: 80,
    widthPct: 20,
    durationLabel: 'Step 05 · Approval',
    status: 'Awaiting Review',
    payload: '{ "gate": "elevated-risk-diff", "requiredRole": "maintainer" }',
  },
];

const EVAL_CASES = [
  {
    id: 'eval-01',
    suite: 'PR Review Golden Dataset',
    caseName: 'sandbox-egress-regression',
    assertions: ['Schema Strict: Valid', 'ADR-014 Cited: Valid', 'Risk Classified: Elevated'],
    status: 'Pass',
  },
  {
    id: 'eval-02',
    suite: 'Citation Integrity Suite',
    caseName: 'ungrounded-claim-rejection',
    assertions: ['Schema Strict: Valid', 'Ungrounded Claim Blocked: Valid', 'Fallback Triggered: Valid'],
    status: 'Pass',
  },
  {
    id: 'eval-03',
    suite: 'Ops Runbook Guardrails',
    caseName: 'batch-limit-boundary',
    assertions: ['Max Batch <= 10: Valid', 'Human Gate Enforced: Valid', 'No Direct Write: Valid'],
    status: 'Pass',
  },
];

export const ProductPreviews: React.FC<ProductPreviewsProps> = ({ initialTab = 'studio' }) => {
  const [activeTab, setActiveTab] = useState<PreviewSurfaceId>(initialTab);
  const [selectedStudioNode, setSelectedStudioNode] = useState(0);
  const [workflowBranch, setWorkflowBranch] = useState<'high-risk' | 'standard'>('high-risk');
  const [selectedContextTier, setSelectedContextTier] = useState(0);
  const [selectedSandbox, setSelectedSandbox] = useState(0);
  const [selectedGateway, setSelectedGateway] = useState(0);
  const [strictSchema, setStrictSchema] = useState(true);
  const [selectedSpan, setSelectedSpan] = useState(0);
  const [selectedEval, setSelectedEval] = useState(0);
  const [approvalState, setApprovalState] = useState<'pending' | 'approved' | 'held'>('pending');
  const [decisionViewMode, setDecisionViewMode] = useState<'rule' | 'table'>('rule');
  const [decisionScenario, setDecisionScenario] = useState<'under50k' | 'over50k'>('under50k');

  const tabs: {
    id: PreviewSurfaceId;
    label: string;
    subtitle: string;
    planned?: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'studio', label: 'SOPIN Studio', subtitle: 'Graph & Inspector', icon: Layers },
    { id: 'flow', label: 'SOPIN Flow', subtitle: 'Workflow DAG', icon: GitBranch },
    { id: 'decisions', label: 'SOPIN Decisions', subtitle: 'Rules & Tables', icon: Scale },
    { id: 'context', label: 'SOPIN Context', subtitle: 'Scoped Memory', icon: Database },
    { id: 'runtime', label: 'SOPIN Runtime', subtitle: 'Sandboxed Exec', icon: Cpu },
    { id: 'gateway', label: 'SOPIN Gateway', subtitle: 'Model Routing', icon: Network },
    { id: 'observe', label: 'SOPIN Observe', subtitle: 'Traces · Planned', planned: true, icon: Eye },
    { id: 'evaluate', label: 'SOPIN Evaluate', subtitle: 'Evals · Planned', planned: true, icon: FlaskConical },
    { id: 'control', label: 'SOPIN Control', subtitle: 'Policy · Planned', planned: true, icon: ShieldCheck },
  ];

  const currentNode = STUDIO_NODES[selectedStudioNode] ?? STUDIO_NODES[0];
  const currentContextTier = CONTEXT_TIERS[selectedContextTier] ?? CONTEXT_TIERS[0];
  const currentSandbox = RUNTIME_SANDBOXES[selectedSandbox] ?? RUNTIME_SANDBOXES[0];
  const currentGateway = GATEWAY_PROFILES[selectedGateway] ?? GATEWAY_PROFILES[0];
  const currentSpan = TIMELINE_SPANS[selectedSpan] ?? TIMELINE_SPANS[0];
  const currentEval = EVAL_CASES[selectedEval] ?? EVAL_CASES[0];
  const currentTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      {/* 9-Module Product Surface Switcher (Horizontal snap scroll on mobile, balanced 3x3 grid on sm+) */}
      <div
        role="tablist"
        aria-label="SOPIN product interface previews"
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-2.5 pb-1 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative snap-start shrink-0 w-[180px] sm:w-auto text-left rounded-xl border p-3.5 min-h-[56px] transition-colors min-w-0 ${
                active
                  ? 'border-[#2563EB] bg-white dark:bg-[#0A1226] shadow-sm'
                  : 'border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226]/50 hover:border-[#2563EB]/40'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="product-preview-tab-ring"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl ring-1 ring-[#2563EB] pointer-events-none"
                />
              )}
              <div className="flex items-center gap-2 relative z-10 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-display text-sm font-semibold text-[#05070E] dark:text-white truncate">
                  {tab.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] truncate relative z-10">
                {tab.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Realistic Software Application Window */}
      <div className="rounded-2xl border border-[#05070E]/15 dark:border-white/15 bg-[#0A1226] text-white overflow-hidden shadow-2xl">
        {/* Desktop App Window Chrome */}
        <div className="px-5 py-3 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <span className="font-mono text-xs text-[#C5C5D6] truncate">
              sopin.ai / workspace / {activeTab}
            </span>
          </div>

          <StatusText
            items={[
              'Interactive Software Preview',
              currentTabMeta.planned ? 'Planned Roadmap Module' : 'Core Architecture',
            ]}
            dark
            accentLast
          />
        </div>

        <AnimatePresence mode="wait">
          {/* 1. SOPIN STUDIO */}
          {activeTab === 'studio' && (
            <motion.div
              key="studio-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]"
            >
              <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 p-4 space-y-4 bg-white/[0.015]">
                <div className="text-xs font-semibold text-[#A4A4B5]">Graph Nodes</div>
                <div className="space-y-2">
                  {STUDIO_NODES.map((node, idx) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedStudioNode(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedStudioNode === idx
                          ? 'border-[#2563EB] bg-[#2563EB]/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="font-mono text-[11px] text-[#7EC8FF]">{node.kind}</div>
                      <div className="text-sm font-medium text-white mt-0.5">{node.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sopin-grid-dark flex flex-col justify-center gap-4 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="text-xs font-mono text-[#A4A4B5]">Canvas · pr-verifier.graph</div>
                <div className="space-y-3">
                  {STUDIO_NODES.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudioNode(idx)}
                        className={`w-full text-left rounded-xl p-4 border transition-all ${
                          selectedStudioNode === idx
                            ? 'border-[#60A5FA] bg-[#05070E] shadow-lg'
                            : 'border-white/12 bg-[#05070E]/70 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-[#60A5FA]">{node.kind}</span>
                          <span className="font-mono text-[11px] text-[#9A9AB0]">{node.schema}</span>
                        </div>
                        <div className="mt-1 font-display text-sm font-semibold text-white">
                          {node.title}
                        </div>
                      </button>
                      {idx < STUDIO_NODES.length - 1 && (
                        <div className="h-4 flex justify-center" aria-hidden="true">
                          <div className="w-px h-full bg-[#2563EB]/60" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 p-5 space-y-4 bg-[#05070E]/50">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" aria-hidden="true" />
                    <span>Node Inspector</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#9A9AB0]">{currentNode.id}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Execution Profile</div>
                    <div className="mt-1 font-mono text-white">{currentNode.model}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Context Memory Scope</div>
                    <div className="mt-1 font-mono text-[#7EC8FF]">{currentNode.memoryScope}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Bound MCP Tools</div>
                    <div className="mt-1 font-mono text-white">{currentNode.tools.join(', ')}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Output Contract</div>
                    <div className="mt-1 font-mono text-white">{currentNode.schema}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. SOPIN FLOW */}
          {activeTab === 'flow' && (
            <motion.div
              key="flow-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 sopin-grid-dark min-h-[420px] flex flex-col justify-between gap-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-[#60A5FA]">
                    SOPIN Flow · Deterministic Branching
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                    Conditional Risk Routing &amp; Checkpoint Gate
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-white/[0.06] w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setWorkflowBranch('high-risk')}
                    className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      workflowBranch === 'high-risk'
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#B5B5C5] hover:text-white'
                    }`}
                  >
                    Simulate: Elevated Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkflowBranch('standard')}
                    className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      workflowBranch === 'standard'
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#B5B5C5] hover:text-white'
                    }`}
                  >
                    Simulate: Standard
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="rounded-xl border border-white/15 bg-[#05070E] p-4 space-y-1.5">
                  <span className="font-mono text-[11px] text-[#7EC8FF]">01. Classify</span>
                  <div className="font-display text-sm font-semibold">Evaluate Change Scope</div>
                  <p className="text-xs text-[#9A9AB0]">
                    Retries: max 2 · Schema: RiskAssessment
                  </p>
                </div>

                <div className="space-y-3">
                  <div
                    className={`rounded-xl border p-4 transition-colors ${
                      workflowBranch === 'high-risk'
                        ? 'border-[#60A5FA] bg-[#2563EB]/20'
                        : 'border-white/10 bg-[#05070E]/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#7EC8FF]">
                      <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Branch A · risk == &quot;elevated&quot;</span>
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-white">
                      Human Approval Checkpoint
                    </div>
                    <p className="text-xs text-[#C5C5D6] mt-1">
                      Suspends execution until maintainer signs off.
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-4 transition-colors ${
                      workflowBranch === 'standard'
                        ? 'border-[#2563EB] bg-[#2563EB]/20'
                        : 'border-white/10 bg-[#05070E]/60 opacity-60'
                    }`}
                  >
                    <div className="font-mono text-[11px] text-[#7EC8FF]">
                      Branch B · risk == &quot;standard&quot;
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-white">
                      Automated Verification Pass
                    </div>
                    <p className="text-xs text-[#C5C5D6] mt-1">
                      Runs sandbox assertions and records output artifact.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/15 bg-[#05070E] p-4 space-y-1.5">
                  <span className="font-mono text-[11px] text-[#7EC8FF]">03. Finalize</span>
                  <div className="font-display text-sm font-semibold">Publish Trace &amp; Output</div>
                  <p className="text-xs text-[#9A9AB0]">
                    Active path:{' '}
                    <span className="text-white">
                      {workflowBranch === 'high-risk' ? 'Gated Approval' : 'Direct Verify'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05070E]/80 p-3.5 flex items-center justify-between text-xs text-[#B5B5C5] overflow-x-auto">
                <span className="inline-flex items-center gap-2 font-mono whitespace-nowrap">
                  <Code2 className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
                  <span>step.branch(&quot;risk&quot;, &#123; when: &quot;elevated&quot;, then: humanGate(&quot;maintainer&quot;) &#125;)</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* 3. SOPIN DECISIONS */}
          {activeTab === 'decisions' && (
            <motion.div
              key="decisions-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-[#60A5FA]">
                      SOPIN Decisions · Deterministic Rule &amp; Table Engine
                    </div>
                    <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                      Invoice Auto-Approval Policy (v1.2 · Published)
                    </h3>
                  </div>

                  <div className="inline-flex p-1 rounded-lg bg-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setDecisionViewMode('rule')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        decisionViewMode === 'rule'
                          ? 'bg-[#2563EB] text-white'
                          : 'text-[#B5B5C5] hover:text-white'
                      }`}
                    >
                      IF/ELSE Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionViewMode('table')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        decisionViewMode === 'table'
                          ? 'bg-[#2563EB] text-white'
                          : 'text-[#B5B5C5] hover:text-white'
                      }`}
                    >
                      Decision Table
                    </button>
                  </div>
                </div>

                {decisionViewMode === 'rule' ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="rounded-xl border border-[#2563EB]/40 bg-[#05070E] p-4 space-y-2">
                      <div className="font-mono text-[11px] text-[#7EC8FF]">IF (ALL CONDITIONS · AND)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                        <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                          invoiceAmount &lt; 50000
                        </div>
                        <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                          vendorVerified == true
                        </div>
                        <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                          duplicateFound == false
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                      <div
                        className={`rounded-xl border p-3.5 ${
                          decisionScenario === 'under50k'
                            ? 'border-[#2563EB] bg-[#2563EB]/20 text-white'
                            : 'border-white/10 bg-[#05070E]/70 text-[#A4A4B5]'
                        }`}
                      >
                        <div className="text-[#7EC8FF] mb-1">THEN</div>
                        <div>decision = &quot;approved&quot;</div>
                        <div>requiresHumanGate = false</div>
                      </div>
                      <div
                        className={`rounded-xl border p-3.5 ${
                          decisionScenario === 'over50k'
                            ? 'border-[#60A5FA] bg-[#60A5FA]/20 text-white'
                            : 'border-white/10 bg-[#05070E]/70 text-[#A4A4B5]'
                        }`}
                      >
                        <div className="text-[#7EC8FF] mb-1">ELSE</div>
                        <div>decision = &quot;manual_review&quot;</div>
                        <div>requiresHumanGate = true</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/12 bg-[#05070E] overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="border-b border-white/10 text-[#9A9AB0]">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">invoiceAmount</th>
                          <th className="p-2.5">vendorVerified</th>
                          <th className="p-2.5">decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        <tr className={decisionScenario === 'under50k' ? 'bg-[#2563EB]/20 text-white' : 'text-[#A4A4B5]'}>
                          <td className="p-2.5">#1</td>
                          <td className="p-2.5">&lt; 50000</td>
                          <td className="p-2.5">true</td>
                          <td className="p-2.5 text-[#7EC8FF]">approved</td>
                        </tr>
                        <tr className={decisionScenario === 'over50k' ? 'bg-[#60A5FA]/20 text-white' : 'text-[#A4A4B5]'}>
                          <td className="p-2.5">#2</td>
                          <td className="p-2.5">&gt;= 50000</td>
                          <td className="p-2.5">*</td>
                          <td className="p-2.5 text-[#7EC8FF]">manual_review</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 rounded-xl border border-white/12 bg-[#05070E] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#7EC8FF]">Deterministic Test Input</span>
                    <span className="font-mono text-[11px] text-[#9A9AB0]">Zero LLM Variance</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionScenario('under50k')}
                      className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-semibold ${
                        decisionScenario === 'under50k'
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-white/15 text-[#B5B5C5]'
                      }`}
                    >
                      ₹32,500 · Verified
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionScenario('over50k')}
                      className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-semibold ${
                        decisionScenario === 'over50k'
                          ? 'border-[#60A5FA] bg-[#2563EB] text-white'
                          : 'border-white/15 text-[#B5B5C5]'
                      }`}
                    >
                      ₹68,000 · Exceeds Cap
                    </button>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 font-mono text-[11px] text-[#E8E8F2]">
                    {decisionScenario === 'under50k'
                      ? '{ "invoiceAmount": 32500, "vendorVerified": true, "duplicateFound": false }'
                      : '{ "invoiceAmount": 68000, "vendorVerified": true, "duplicateFound": false }'}
                  </div>

                  <div className="rounded-lg border border-[#2563EB]/40 bg-[#2563EB]/15 p-3 font-mono text-[11px] text-white">
                    <div className="text-[#7EC8FF] mb-1">Evaluated Output (1ms · v1.2)</div>
                    {decisionScenario === 'under50k'
                      ? '{ "decision": "approved", "requiresHumanGate": false, "netPayablePreview": 31850 }'
                      : '{ "decision": "manual_review", "requiresHumanGate": true, "approvalLane": "finance-controller" }'}
                  </div>
                </div>
                <div className="text-[11px] text-[#9A9AB0]">
                  Invoked natively by SOPIN Flow Decision Nodes &amp; REST API.
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. SOPIN CONTEXT */}
          {activeTab === 'context' && (
            <motion.div
              key="context-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]"
            >
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 p-5 space-y-3 bg-white/[0.015]">
                <div className="text-xs font-semibold text-[#A4A4B5]">Memory Tiers</div>
                {CONTEXT_TIERS.map((tier, idx) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedContextTier(idx)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      selectedContextTier === idx
                        ? 'border-[#2563EB] bg-[#2563EB]/20'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    }`}
                  >
                    <div className="font-mono text-[11px] text-[#7EC8FF]">{tier.label}</div>
                    <div className="text-xs text-[#C5C5D6] mt-1 font-mono">{tier.scope}</div>
                    <div className="text-[11px] text-[#9A9AB0] mt-1">{tier.retention}</div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-[#60A5FA]">
                      {currentContextTier.label}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                      Scoped Context Entries &amp; Provenance Checksums
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#9A9AB0]">{currentContextTier.scope}</span>
                </div>

                <div className="space-y-3">
                  {currentContextTier.records.map((rec) => (
                    <div
                      key={rec.key}
                      className="rounded-xl border border-white/12 bg-[#05070E] p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-white">
                          {rec.key}
                        </span>
                        <span className="font-mono text-[11px] text-[#7EC8FF]">
                          {rec.checksum}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-[#C5C5D6] break-words">
                        {rec.snippet}
                      </p>
                      <div className="text-[11px] text-[#9A9AB0]">
                        Source: <span className="font-mono">{rec.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. SOPIN RUNTIME */}
          {activeTab === 'runtime' && (
            <motion.div
              key="runtime-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-6 space-y-3">
                <div className="font-mono text-xs text-[#60A5FA]">
                  SOPIN Runtime · Isolated Tool Sandboxes
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Active Execution Boundaries
                </h3>
                <div className="space-y-2.5 pt-1">
                  {RUNTIME_SANDBOXES.map((sbx, idx) => (
                    <button
                      key={sbx.id}
                      type="button"
                      onClick={() => setSelectedSandbox(idx)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        selectedSandbox === idx
                          ? 'border-[#60A5FA] bg-[#2563EB]/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-white">{sbx.tool}</span>
                        <span className="font-mono text-[11px] text-[#7EC8FF]">{sbx.state}</span>
                      </div>
                      <div className="mt-1 text-xs text-[#9A9AB0]">
                        {sbx.transport} · Egress: {sbx.egress}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl border border-white/12 bg-[#05070E] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#7EC8FF]">Sandbox Manifest</span>
                    <span className="font-mono text-xs text-[#9A9AB0]">{currentSandbox.id}</span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    {currentSandbox.tool}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[#9A9AB0]">Network Egress</div>
                      <div className="mt-1 font-mono text-white">{currentSandbox.egress}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[#9A9AB0]">Filesystem</div>
                      <div className="mt-1 font-mono text-white">{currentSandbox.filesystem}</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#060B18] p-3">
                    <div className="text-[11px] text-[#9A9AB0] mb-1">Scoped Command</div>
                    <HighlightedCode
                      code={currentSandbox.command}
                      language="bash"
                      surface="dark"
                      wrap
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#C5C5D6]">
                  <Lock className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
                  <span>Idempotent retry policy &amp; ephemeral token scope active.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. SOPIN GATEWAY */}
          {activeTab === 'gateway' && (
            <motion.div
              key="gateway-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-5 space-y-3">
                <div className="font-mono text-xs text-[#60A5FA]">
                  SOPIN Gateway · Model Route Profiles
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Vendor-Neutral Routing &amp; Redaction
                </h3>
                <div className="space-y-2.5 pt-1">
                  {GATEWAY_PROFILES.map((profile, idx) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setSelectedGateway(idx)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                        selectedGateway === idx
                          ? 'border-[#2563EB] bg-[#2563EB]/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold text-white">
                        {profile.name}
                      </div>
                      <div className="text-xs text-[#9A9AB0] mt-1">{profile.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl border border-white/12 bg-[#05070E] p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-[#7EC8FF]">Active Route Policy</div>
                    <h4 className="font-display text-base font-semibold text-white mt-0.5">
                      {currentGateway.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStrictSchema((s) => !s)}
                    className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      strictSchema
                        ? 'border-[#60A5FA] bg-[#2563EB]/25 text-white'
                        : 'border-white/15 text-[#9A9AB0]'
                    }`}
                  >
                    Strict Schema: {strictSchema ? 'Enabled' : 'Advisory'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Sanitization Transform</div>
                    <div className="mt-1 font-mono text-white">{currentGateway.piiMode}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[#9A9AB0]">Fallback Route</div>
                    <div className="mt-1 font-mono text-[#7EC8FF]">{currentGateway.fallback}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#060B18] p-3.5 space-y-1.5">
                  <div className="text-[11px] text-[#9A9AB0]">
                    Contract: <span className="font-mono text-[#4EC9B0]">{currentGateway.schema}</span>
                  </div>
                  <HighlightedCode
                    code={currentGateway.samplePayload}
                    language="json"
                    surface="dark"
                    wrap
                    className="text-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. SOPIN OBSERVE */}
          {activeTab === 'observe' && (
            <motion.div
              key="observe-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] flex flex-col justify-between gap-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-[#60A5FA]">
                    SOPIN Observe · Execution Span Waterfall (Planned)
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                    Click any execution span to inspect its structured payload
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#9A9AB0]">Trace ID: sample-pr-run</span>
              </div>

              <div className="space-y-2.5">
                {TIMELINE_SPANS.map((span, idx) => {
                  const isSelected = idx === selectedSpan;
                  return (
                    <button
                      key={span.id}
                      type="button"
                      onClick={() => setSelectedSpan(idx)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center ${
                        isSelected
                          ? 'border-[#60A5FA] bg-[#2563EB]/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="md:col-span-4 min-w-0">
                        <div className="font-mono text-xs text-white truncate">{span.name}</div>
                        <div className="text-[11px] text-[#9A9AB0]">{span.module}</div>
                      </div>
                      <div className="md:col-span-6 h-3 rounded-full bg-white/5 relative overflow-hidden">
                        <div
                          className={`absolute top-0 bottom-0 rounded-full ${
                            span.status === 'Awaiting Review' ? 'bg-[#60A5FA]' : 'bg-[#2563EB]'
                          }`}
                          style={{ left: `${span.offsetPct}%`, width: `${span.widthPct}%` }}
                        />
                      </div>
                      <div className="md:col-span-2 text-left md:text-right font-mono text-[11px] text-[#C5C5D6]">
                        {span.status}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-white/12 bg-[#060B18] p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 font-mono text-xs text-[#7EC8FF]">
                    <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{currentSpan.name}</span>
                  </span>
                  <span className="text-xs text-[#9A9AB0]">{currentSpan.durationLabel}</span>
                </div>
                <HighlightedCode
                  code={currentSpan.payload}
                  language="json"
                  surface="dark"
                  wrap
                  className="text-xs"
                />
              </div>
            </motion.div>
          )}

          {/* 7. SOPIN EVALUATE */}
          {activeTab === 'evaluate' && (
            <motion.div
              key="evaluate-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-6 space-y-3">
                <div className="font-mono text-xs text-[#60A5FA]">
                  SOPIN Evaluate · Regression Harnesses (Planned)
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Golden Test Cases &amp; Assertion Gates
                </h3>
                <div className="space-y-2.5 pt-1">
                  {EVAL_CASES.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedEval(idx)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        selectedEval === idx
                          ? 'border-[#60A5FA] bg-[#2563EB]/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-white">
                          {item.caseName}
                        </span>
                        <span className="font-mono text-[11px] text-[#7EC8FF]">
                          Assertion: {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#9A9AB0] mt-1">{item.suite}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl border border-white/12 bg-[#05070E] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#7EC8FF]">Assertion Breakdown</span>
                    <span className="font-mono text-xs text-[#9A9AB0]">{currentEval.id}</span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    {currentEval.caseName}
                  </h4>
                  <ul className="space-y-2.5">
                    {currentEval.assertions.map((assertion) => (
                      <li
                        key={assertion}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#E8E8F2]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0" aria-hidden="true" />
                        <span className="font-mono">{assertion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-[#9A9AB0]">
                  Promotion gate blocks workflow deployment if any deterministic schema or citation assertion fails.
                </p>
              </div>
            </motion.div>
          )}

          {/* 8. SOPIN CONTROL */}
          {activeTab === 'control' && (
            <motion.div
              key="control-ui"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-6 min-h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="font-mono text-xs text-[#60A5FA]">
                    SOPIN Control · Scoped Permissions (Planned)
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                    Tool &amp; Data Access Boundaries
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      scope: 'git.diff / git.log',
                      policy: 'Read-Only Allowed',
                      rule: 'No force-push or branch mutation tokens issued',
                    },
                    {
                      scope: 'gateway.piiSanitizer',
                      policy: 'Enforced Pre-Inference',
                      rule: 'Redacts credentials & personal identifiers before model routing',
                    },
                    {
                      scope: 'runtime.networkEgress',
                      policy: 'Allowlist Only',
                      rule: 'Sandbox blocks unapproved outbound endpoints',
                    },
                  ].map((item) => (
                    <div
                      key={item.scope}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-mono text-xs text-white">{item.scope}</div>
                        <p className="text-xs text-[#9A9AB0] mt-1">{item.rule}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7EC8FF] shrink-0">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{item.policy}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-white/12 bg-[#05070E] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#7EC8FF]">Human Approval Gate</span>
                    <span className="text-xs font-medium text-[#C5C5D6]">
                      Status:{' '}
                      {approvalState === 'pending'
                        ? 'Awaiting Sign-Off'
                        : approvalState === 'approved'
                        ? 'Approved'
                        : 'Held for Review'}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Action: Replay 3 Stalled Ledger Events
                  </h4>
                  <p className="text-xs text-[#A4A4B5] leading-relaxed">
                    Agent proposed bounded batch replay inside runbook RB-19. Operator confirmation is required before mutating production queue state.
                  </p>
                  <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 font-mono text-[11px] text-[#E8E8F2]">
                    &#123; &quot;batchSize&quot;: 3, &quot;maxAllowed&quot;: 10, &quot;role&quot;: &quot;oncall-lead&quot; &#125;
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovalState('approved')}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalState('held')}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Hold</span>
                  </button>
                  {approvalState !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => setApprovalState('pending')}
                      className="min-h-[44px] text-xs text-[#9A9AB0] hover:text-white underline px-3"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
