import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Download,
  FlaskConical,
  Lock,
  Network,
  Plug,
  RotateCcw,
  Scale,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import {
  AgentConfig,
  AppSettings,
  AuditEvent,
  ExecutionRun,
  McpToolRecord,
  MoreSectionId,
  Workspace,
} from '../types';
import { DecisionExecutionSpec } from '../../decisions/types';
import { ThemeMode } from '../../hooks/useTheme';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';
import { AgentPerformanceChart } from '../components/AgentPerformanceChart';

interface AppMoreViewProps {
  workspace: Workspace;
  agents: AgentConfig[];
  runs: ExecutionRun[];
  tools: McpToolRecord[];
  auditLog: AuditEvent[];
  decisionExecutions?: DecisionExecutionSpec[];
  settings: AppSettings;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToggleTool: (toolId: string) => void;
  onUpdateBudget: (tokens: number) => void;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onRunAction: (
    runId: string,
    action: 'pause' | 'cancel' | 'approve' | 'reject' | 'escalate',
    meta?: { reason?: string; reviewer?: string; escalateTo?: string }
  ) => void;
  onResetPrototype: () => void;
}

const SECTIONS: {
  id: MoreSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'governance', label: 'Governance', icon: ShieldCheck },
  { id: 'models', label: 'Models', icon: Network },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'evaluations', label: 'Evaluations', icon: FlaskConical },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'deployments', label: 'Deployments', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppMoreView: React.FC<AppMoreViewProps> = ({
  workspace,
  agents,
  runs,
  tools,
  auditLog,
  decisionExecutions = [],
  settings,
  theme,
  onToggleTheme,
  onToggleTool,
  onUpdateBudget,
  onUpdateSettings,
  onRunAction,
  onResetPrototype,
}) => {
  const [section, setSection] = useState<MoreSectionId>('governance');
  const [confirmTool, setConfirmTool] = useState<McpToolRecord | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [approvalReasons, setApprovalReasons] = useState<Record<string, string>>({});
  const [escalateTargets, setEscalateTargets] = useState<Record<string, string>>({});
  const { canPromptInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const pendingApprovals = runs.filter((r) => r.status === 'awaiting-approval');
  const activeRuns = runs.filter((r) => r.status === 'running' || r.status === 'awaiting-approval');

  const recentApprovalHistory = useMemo(
    () =>
      runs.flatMap((run) =>
        (run.approvalHistory ?? []).map((entry) => ({
          ...entry,
          runId: run.id,
          runTitle: run.title,
        }))
      ),
    [runs]
  );

  return (
    <div className="space-y-4">
      {/* Horizontal Sub-Navigation for All 7 Admin / Platform Surfaces */}
      <div
        role="tablist"
        aria-label="Additional SOPIN platform sections"
        className="flex overflow-x-auto no-scrollbar gap-2 pb-1"
      >
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(item.id)}
              className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'border-[#2563EB] bg-[#2563EB] text-white'
                  : 'border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#B5B5C5]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GOVERNANCE & ADMIN */}
      {section === 'governance' && (
        <div className="space-y-4">
          {/* Approvals Queue */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Approval Requests ({pendingApprovals.length})
            </h3>
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                No pending human gates right now.
              </p>
            ) : (
              pendingApprovals.map((run) => {
                const reasonVal = approvalReasons[run.id] ?? '';
                const escalateVal = escalateTargets[run.id] ?? 'CFO / Chief Compliance Officer';
                return (
                  <div
                    key={run.id}
                    className="rounded-xl border border-[#60A5FA]/40 bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-[#05070E] dark:text-white">
                        {run.approvalGate?.actionLabel || run.title}
                      </div>
                      <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                        {run.approvalGate?.requiredRole || 'Workspace Maintainer'}
                      </span>
                    </div>
                    {run.approvalGate?.reason && (
                      <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                        {run.approvalGate.reason}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={reasonVal}
                        onChange={(e) =>
                          setApprovalReasons((prev) => ({ ...prev, [run.id]: e.target.value }))
                        }
                        placeholder="Decision reason / compliance note..."
                        aria-label={`Audit reason for ${run.id}`}
                        className="min-h-[44px] px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-xs"
                      />
                      <input
                        type="text"
                        value={escalateVal}
                        onChange={(e) =>
                          setEscalateTargets((prev) => ({ ...prev, [run.id]: e.target.value }))
                        }
                        placeholder="Escalate target role..."
                        aria-label={`Escalate role for ${run.id}`}
                        className="min-h-[44px] px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onRunAction(run.id, 'approve', {
                            reviewer: workspace.role,
                            reason: reasonVal.trim() || undefined,
                          })
                        }
                        className="min-h-[44px] rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRunAction(run.id, 'escalate', {
                            reviewer: workspace.role,
                            reason: reasonVal.trim() || undefined,
                            escalateTo: escalateVal.trim() || 'CFO / Chief Compliance Officer',
                          })
                        }
                        className="min-h-[44px] rounded-lg border border-[#2563EB]/40 text-[#2563EB] dark:text-[#7EC8FF] text-xs font-semibold inline-flex items-center justify-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Escalate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRunAction(run.id, 'reject', {
                            reviewer: workspace.role,
                            reason: reasonVal.trim() || undefined,
                          })
                        }
                        className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Approval History */}
          {recentApprovalHistory.length > 0 && (
            <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                Approval &amp; Escalation History ({recentApprovalHistory.length})
              </h3>
              <div className="space-y-2">
                {recentApprovalHistory.slice(0, 6).map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#05070E] dark:text-white capitalize">
                        {h.decision} · {h.runTitle}
                      </span>
                      <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                        {h.timestamp}
                      </span>
                    </div>
                    <p className="text-[#5E5E6E] dark:text-[#B5B5C5]">{h.reason}</p>
                    <StatusText
                      items={[
                        h.actor,
                        h.role,
                        h.escalatedTo ? `Escalated → ${h.escalatedTo}` : h.runId,
                      ]}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tool Permissions with Confirmation Sheet */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              MCP Tool Allowlist &amp; Toggles
            </h3>
            <div className="space-y-2">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#05070E] dark:text-white">
                      {tool.name}
                    </div>
                    <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                      {tool.scope} · {tool.transport}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmTool(tool)}
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold shrink-0 ${
                      tool.enabled
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-[#05070E]/20 dark:border-white/20 text-[#5E5E6E] dark:text-[#A4A4B5]'
                    }`}
                  >
                    {tool.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Pause / Revoke Running Tasks */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Active Runs &amp; Revocation ({activeRuns.length})
            </h3>
            {activeRuns.length === 0 ? (
              <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                No running or paused tasks active.
              </p>
            ) : (
              activeRuns.map((run) => (
                <div
                  key={`gov-${run.id}`}
                  className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{run.title}</div>
                    <div className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                      {run.id} · {run.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunAction(run.id, 'cancel')}
                    className="min-h-[44px] px-3 rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold shrink-0"
                  >
                    Revoke Run
                  </button>
                </div>
              ))
            )}
          </section>

          {/* Budget Limit Control + Members */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                Monthly Token Budget Cap
              </h3>
              <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                {workspace.tokenBudgetMonthly.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={1000000}
              step={50000}
              value={workspace.tokenBudgetMonthly}
              onChange={(e) => onUpdateBudget(Number(e.target.value))}
              aria-label="Monthly token budget limit"
              className="w-full accent-[#2563EB] h-10"
            />
            <div className="pt-2 border-t border-[#05070E]/10 dark:border-white/10 space-y-2">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                <span>Workspace Roles (Sample Membership)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#F7F7FA] dark:bg-[#05070E] p-2.5 flex justify-between">
                  <span className="font-medium">Alex Rivera (You)</span>
                  <span className="font-mono text-[#2563EB] dark:text-[#7EC8FF]">{workspace.role}</span>
                </div>
                <div className="rounded-lg bg-[#F7F7FA] dark:bg-[#05070E] p-2.5 flex justify-between">
                  <span className="font-medium">SONIL SecOps</span>
                  <span className="font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">Gate Reviewer</span>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile-Friendly Audit Events (Stacked Cards instead of Wide Tables) */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Recent Audit Events ({auditLog.length})
            </h3>
            <div className="space-y-2">
              {auditLog.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#05070E] dark:text-white">{ev.action}</span>
                    <span
                      className={`font-mono text-[11px] shrink-0 ${
                        ev.outcome === 'Blocked' || ev.outcome === 'Rejected'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#2563EB] dark:text-[#7EC8FF]'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </div>
                  <StatusText
                    items={[
                      ev.actor,
                      ev.target,
                      ...(ev.previousVersion && ev.resultingVersion
                        ? [`${ev.previousVersion} → ${ev.resultingVersion}`]
                        : ev.previousVersion
                        ? [ev.previousVersion]
                        : []),
                      ...(ev.targetEnvironment ? [ev.targetEnvironment] : []),
                      ev.timestamp,
                    ]}
                  />
                  {(ev.specHash || ev.approvalId || ev.reason) && (
                    <div className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] space-y-0.5 pt-0.5">
                      {(ev.specHash || ev.approvalId) && (
                        <div className="truncate">
                          {ev.specHash ? `Hash ${ev.specHash.slice(0, 20)}…` : ''}
                          {ev.specHash && ev.approvalId ? ' · ' : ''}
                          {ev.approvalId ? `Approval ${ev.approvalId}` : ''}
                        </div>
                      )}
                      {ev.reason && <div>{ev.reason}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 2. MODELS & ML REGISTRY (SOPIN GATEWAY) */}
      {section === 'models' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              {
                name: 'reasoning-structured',
                fallback: 'deterministic-fast',
                redaction: 'PII Pre-Inference Redaction',
                schema: 'Strict JSON Enforcement',
              },
              {
                name: 'citation-audit',
                fallback: 'reject-ungrounded',
                redaction: 'Corpus Classification Filter',
                schema: 'CitationAuditResult',
              },
              {
                name: 'deterministic-fast',
                fallback: 'escalate-human-gate',
                redaction: 'PII Pre-Inference Redaction',
                schema: 'Constrained Enum Output',
              },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-1.5"
              >
                <div className="font-mono text-sm font-semibold text-[#05070E] dark:text-white">
                  {m.name}
                </div>
                <StatusText items={[m.schema, `Fallback: ${m.fallback}`]} accentLast />
                <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">{m.redaction}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                ML Lifecycle &amp; Model Registry (Preview)
              </h3>
              <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                SOPIN Gateway · ML
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center">
              {['Dataset', 'Prep', 'Train', 'Eval F1', 'Gateway'].map((stepLabel, idx) => (
                <div
                  key={stepLabel}
                  className="rounded-lg border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] py-2 px-1"
                >
                  <div className="font-mono text-[10px] text-[#2563EB] dark:text-[#60A5FA]">
                    0{idx + 1}
                  </div>
                  <div className="text-[11px] font-semibold text-[#05070E] dark:text-white truncate">
                    {stepLabel}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {[
                {
                  modelId: 'domain-classifier:v3',
                  artifact: 'tabular-gradient-boost · validation F1 0.94',
                  route: 'gateway.route("ml/domain-classifier")',
                },
                {
                  modelId: 'anomaly-scorer:v1',
                  artifact: 'pytorch-encoder · calibration verified',
                  route: 'gateway.route("ml/anomaly-scorer")',
                },
              ].map((ml) => (
                <div
                  key={ml.modelId}
                  className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#05070E] dark:text-white">
                      {ml.modelId}
                    </span>
                    <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                      Registered
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">{ml.artifact}</p>
                  <div className="font-mono text-[11px] text-[#05070E] dark:text-[#D8D8E6]">
                    {ml.route}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 3. INTEGRATIONS */}
      {section === 'integrations' && (
        <div className="space-y-3">
          {tools.map((t) => (
            <div
              key={`int-${t.id}`}
              className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-mono text-xs font-semibold">{t.name}</div>
                <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">{t.description}</p>
              </div>
              <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                {t.transport}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 4. EVALUATIONS */}
      {section === 'evaluations' && (
        <div className="space-y-3">
          {[
            { suite: 'PR Review Golden Dataset', rule: 'ADR-014 citation & schema validity', status: 'Sample Suite · 3/3 Pass' },
            { suite: 'Citation Integrity Suite', rule: 'Reject ungrounded synthesis paragraphs', status: 'Planned Harness' },
            { suite: 'Ops Runbook Guardrails', rule: 'Enforce max batch <= 10 + human gate', status: 'Sample Suite · 3/3 Pass' },
          ].map((ev) => (
            <div
              key={ev.suite}
              className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold">{ev.suite}</span>
                <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">{ev.status}</span>
              </div>
              <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">{ev.rule}</p>
            </div>
          ))}
        </div>
      )}

      {/* 5. MONITORING (SOPIN OBSERVE) */}
      {section === 'monitoring' && (
        <div className="space-y-4">
          <AgentPerformanceChart
            workspaceId={workspace.id}
            agents={agents}
            runs={runs}
          />
          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2">
            <h3 className="font-display text-sm font-semibold">Workspace Status Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3">
                <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">Registered Agents</div>
                <div className="mt-1 font-display text-xl font-bold">{agents.length}</div>
              </div>
              <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3">
                <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">Trace Runs Stored</div>
                <div className="mt-1 font-display text-xl font-bold">{runs.length}</div>
              </div>
              <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 col-span-2 sm:col-span-1">
                <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">Decision Traces</div>
                <div className="mt-1 font-display text-xl font-bold">{decisionExecutions.length}</div>
              </div>
            </div>
          </div>

          {/* Unified SOPIN Observe · Deterministic Decision Executions */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold inline-flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                <span>SOPIN Observe · Decision Telemetry (PII-Redacted)</span>
              </h3>
              <span className="font-mono text-[10px] uppercase text-[#2563EB] dark:text-[#7EC8FF]">
                {decisionExecutions.length} Recorded
              </span>
            </div>
            {decisionExecutions.length === 0 ? (
              <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                No deterministic decision executions recorded in this workspace yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {decisionExecutions.slice(0, 8).map((ex) => {
                  const matchedLabel =
                    ex.matchedTableRows[0] || ex.matchedRules[0] || ex.status;
                  return (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 text-xs space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#05070E] dark:text-white">
                          {ex.artifactName} ({ex.versionUsed})
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold shrink-0 ${
                            ex.status === 'Error'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-[#2563EB] dark:text-[#7EC8FF]'
                          }`}
                        >
                          {ex.status} · {ex.durationMs.toFixed(1)}ms
                        </span>
                      </div>
                      <StatusText
                        items={[
                          ex.id,
                          ex.sourceTrigger,
                          `Match: ${matchedLabel}`,
                          ex.executedAt,
                        ]}
                      />
                      <p className="text-[#5E5E6E] dark:text-[#B5B5C5] break-words">
                        {ex.explanation}
                      </p>
                      <div className="font-mono text-[11px] text-[#05070E] dark:text-[#D8D8E6] break-words">
                        Input: {JSON.stringify(ex.inputPayload)} → Output: {JSON.stringify(ex.finalOutput)}
                      </div>
                      {ex.errorCode && (
                        <div className="font-mono text-[11px] text-red-600 dark:text-red-400">
                          Error Code: {ex.errorCode}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] px-1">
            Unified workflow/graph/decision span waterfalls and PII-redacted decision telemetry persist locally in browser state; remote OpenTelemetry collector streaming requires a production backend.
          </p>
        </div>
      )}

      {/* 6. DEPLOYMENTS */}
      {section === 'deployments' && (
        <div className="space-y-3">
          {agents.map((ag) => (
            <div
              key={`dep-${ag.id}`}
              className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{ag.name}</div>
                <StatusText items={[ag.version, ag.status, 'Ephemeral Sandbox']} />
              </div>
              <Lock className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}

      {/* 7. SETTINGS + PWA INSTALL */}
      {section === 'settings' && (
        <div className="space-y-4">
          {/* Installable PWA Control */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                  <span>Install SOPIN Mobile App (PWA)</span>
                </h3>
                <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-1">
                  Add SOPIN Workspace to your home screen for standalone app navigation and offline shell support.
                </p>
              </div>
            </div>

            {isInstalled ? (
              <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 text-xs font-medium flex items-center gap-2 text-[#2563EB] dark:text-[#7EC8FF]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Running as installed standalone PWA.</span>
              </div>
            ) : canPromptInstall ? (
              <button
                type="button"
                onClick={() => {
                  void promptInstall();
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Install SOPIN App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIosGuideOpen(true)}
                className="w-full min-h-[44px] rounded-xl border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                <span>
                  {isIOS ? 'View iOS Add to Home Screen Guide' : 'View Browser Install Guide'}
                </span>
              </button>
            )}
          </section>

          {/* Preferences */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold">Workspace Preferences</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3 py-1">
                <span>Appearance Theme</span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="min-h-[40px] px-3.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 font-semibold capitalize"
                >
                  {theme} Mode
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span>Approval Gate Alerts</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ approvalAlerts: !settings.approvalAlerts })}
                  className={`min-h-[40px] px-3.5 rounded-lg font-semibold ${
                    settings.approvalAlerts
                      ? 'bg-[#2563EB] text-white'
                      : 'border border-[#05070E]/15 dark:border-white/15'
                  }`}
                >
                  {settings.approvalAlerts ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span>Strict Schema Enforcement Default</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ strictSchemaDefault: !settings.strictSchemaDefault })
                  }
                  className={`min-h-[40px] px-3.5 rounded-lg font-semibold ${
                    settings.strictSchemaDefault
                      ? 'bg-[#2563EB] text-white'
                      : 'border border-[#05070E]/15 dark:border-white/15'
                  }`}
                >
                  {settings.strictSchemaDefault ? 'Strict' : 'Advisory'}
                </button>
              </div>
            </div>
          </section>

          {/* Reset Prototype */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2">
            <h3 className="font-display text-sm font-semibold">Local Prototype Storage</h3>
            <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              All edits, agents, runs, and uploaded file previews live locally in this browser.
            </p>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="min-h-[44px] w-full rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Local Prototype Data</span>
            </button>
          </section>
        </div>
      )}

      {/* Tool Toggle Confirmation Bottom Sheet */}
      <BottomSheet
        open={Boolean(confirmTool)}
        onClose={() => setConfirmTool(null)}
        title={confirmTool?.enabled ? `Disable ${confirmTool.name}?` : `Enable ${confirmTool?.name}?`}
        subtitle="Tool availability changes take effect across workspace agents and log an audit event."
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5]">
            {confirmTool?.description}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmTool(null)}
              className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmTool) onToggleTool(confirmTool.id);
                setConfirmTool(null);
              }}
              className="min-h-[44px] rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Confirm Change
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* PWA Install Instructions Sheet */}
      <BottomSheet
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
        title="Install SOPIN Workspace"
      >
        <div className="space-y-3 text-xs text-[#5E5E6E] dark:text-[#C5C5D6] leading-relaxed">
          <p>
            <strong>iOS Safari:</strong> Tap the Share button in Safari, scroll down, and tap{' '}
            <strong>Add to Home Screen</strong>.
          </p>
          <p>
            <strong>Desktop / Android Chromium:</strong> Click the install icon in the browser address bar or menu to launch SOPIN as a standalone application.
          </p>
        </div>
      </BottomSheet>

      {/* Confirm Reset Prototype Sheet */}
      <BottomSheet
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Reset Workspace Prototype?"
        subtitle="Restores default sample agents, workflows, and documents in local storage."
      >
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(false)}
            className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onResetPrototype();
              setConfirmResetOpen(false);
            }}
            className="min-h-[44px] rounded-lg bg-red-600 text-white text-xs font-semibold"
          >
            Reset Now
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
