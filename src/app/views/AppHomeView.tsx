import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AppTabId, AgentConfig, ExecutionRun, WorkflowConfig, Workspace } from '../types';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface AppHomeViewProps {
  workspace: Workspace;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  runs: ExecutionRun[];
  onSwitchTab: (tab: AppTabId) => void;
  onSelectRun: (runId: string) => void;
  onStartQuickTask: () => void;
  onStartNewAgent: () => void;
  onApproveRun: (runId: string) => void;
}

export const AppHomeView: React.FC<AppHomeViewProps> = ({
  workspace,
  agents,
  workflows,
  runs,
  onSwitchTab,
  onSelectRun,
  onStartQuickTask,
  onStartNewAgent,
  onApproveRun,
}) => {
  const [artifactSheetRun, setArtifactSheetRun] = useState<ExecutionRun | null>(null);

  const pendingApprovals = runs.filter((r) => r.status === 'awaiting-approval');
  const activeOrFailed = runs.filter(
    (r) => r.status === 'running' || r.status === 'awaiting-approval' || r.status === 'failed'
  );
  const completedWithArtifacts = runs.filter((r) => Boolean(r.artifactMarkdown));
  const latestRun = runs[0];

  const budgetPct = Math.min(
    100,
    Math.round((workspace.tokensUsed / workspace.tokenBudgetMonthly) * 100)
  );

  return (
    <div className="space-y-5">
      {/* Prototype Disclosure Banner */}
      <div className="rounded-xl border border-[#6252E8]/25 bg-[#6252E8]/[0.07] dark:bg-[#6252E8]/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#101014] dark:text-white">
            Interactive Workspace Prototype · Local Browser State
          </p>
          <p className="text-xs text-[#5E5E6E] dark:text-[#C5C5D6] mt-0.5">
            Create agents, edit vertical workflows, upload local files, and review simulated runs without a remote backend.
          </p>
        </div>
        <span className="font-mono text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF] shrink-0">
          {workspace.environment}
        </span>
      </div>

      {/* Primary Thumb-Zone Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onStartQuickTask}
          className="min-h-[52px] rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-sm"
        >
          <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>New Task</span>
        </button>
        <button
          type="button"
          onClick={onStartNewAgent}
          className="min-h-[52px] rounded-xl border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] hover:border-[#6252E8] text-[#101014] dark:text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] shrink-0" aria-hidden="true" />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Pending Human Approval Queue (Priority Actionable Card) */}
      {pendingApprovals.length > 0 && (
        <section aria-label="Pending approval requests" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#101014] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#965BFF]" aria-hidden="true" />
              <span>Pending Approval ({pendingApprovals.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => onSwitchTab('more')}
              className="min-h-[36px] text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]"
            >
              Governance
            </button>
          </div>

          {pendingApprovals.map((run) => (
            <div
              key={run.id}
              className="rounded-2xl border border-[#965BFF]/40 bg-white dark:bg-[#101126] p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <StatusText items={[run.id, run.targetName, 'Human Gate']} accentLast />
                  <h3 className="mt-1 font-display text-base font-semibold text-[#101014] dark:text-white truncate">
                    {run.approvalGate?.actionLabel || run.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {run.approvalGate?.reason}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectRun(run.id)}
                  className="min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/5"
                >
                  Inspect Trace
                </button>
                <button
                  type="button"
                  onClick={() => onApproveRun(run.id)}
                  className="min-h-[44px] px-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Approve Gate</span>
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Resume Previous Task + Token Usage Meter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {latestRun && (
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-[#6252E8] dark:text-[#965BFF]">
                Resume Previous Task
              </span>
              <h3 className="mt-1 font-display text-base font-semibold text-[#101014] dark:text-white truncate">
                {latestRun.title}
              </h3>
              <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] line-clamp-2">
                {latestRun.prompt}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRun(latestRun.id)}
              className="w-full min-h-[44px] rounded-lg bg-[#F7F7FA] dark:bg-white/5 hover:bg-[#EFEFF5] dark:hover:bg-white/10 border border-[#101014]/10 dark:border-white/10 px-3.5 text-xs font-semibold text-[#101014] dark:text-white flex items-center justify-between"
            >
              <span>Open Execution Timeline ({latestRun.status})</span>
              <ArrowRight className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#5E5E6E] dark:text-[#A4A4B5]">
                Prototype Token Ceiling
              </span>
              <span className="font-mono text-xs font-semibold text-[#101014] dark:text-white tabular-nums">
                {budgetPct}% used
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#101014]/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6252E8]"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] tabular-nums">
              {workspace.tokensUsed.toLocaleString()} / {workspace.tokenBudgetMonthly.toLocaleString()} tokens · Sample Workspace Budget
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('more')}
            className="min-h-[40px] text-left text-xs font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline"
          >
            Adjust budget ceiling &amp; policies →
          </button>
        </div>
      </div>

      {/* Recent / Running / Failed Executions */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[#101014] dark:text-white">
            Executions &amp; Status ({activeOrFailed.length} active attention)
          </h2>
          <button
            type="button"
            onClick={() => onSwitchTab('run')}
            className="min-h-[36px] text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]"
          >
            View All
          </button>
        </div>

        <div className="space-y-2.5">
          {runs.slice(0, 4).map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelectRun(run.id)}
              className="w-full text-left rounded-xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-3.5 hover:border-[#6252E8] transition-colors flex items-center justify-between gap-3 min-h-[64px]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {run.status === 'failed' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  ) : run.status === 'awaiting-approval' ? (
                    <ShieldAlert className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                  ) : run.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#6252E8] shrink-0" aria-hidden="true" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#6252E8] shrink-0" aria-hidden="true" />
                  )}
                  <span className="font-display text-sm font-semibold text-[#101014] dark:text-white truncate">
                    {run.title}
                  </span>
                </div>
                <div className="mt-1">
                  <StatusText
                    items={[run.targetName, run.startedAt, run.status]}
                    accentLast={run.status === 'awaiting-approval' || run.status === 'failed'}
                  />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5E5E6E] dark:text-[#A4A4B5] shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {/* Active Agents & Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#101014] dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
              <span>Agents ({agents.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => onSwitchTab('build')}
              className="min-h-[36px] text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]"
            >
              Open Studio
            </button>
          </div>
          <div className="space-y-2">
            {agents.slice(0, 3).map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSwitchTab('build')}
                className="w-full text-left rounded-xl bg-[#F7F7FA] dark:bg-[#101014]/70 p-3 border border-[#101014]/[0.06] dark:border-white/10 hover:border-[#6252E8]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#101014] dark:text-white truncate">
                    {agent.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] shrink-0">
                    {agent.status} · {agent.version}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] truncate">
                  {agent.summary}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#101014] dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
              <span>Workflows &amp; Artifacts</span>
            </h2>
            <button
              type="button"
              onClick={() => onSwitchTab('build')}
              className="min-h-[36px] text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]"
            >
              Designer
            </button>
          </div>

          <div className="space-y-2">
            {workflows.slice(0, 2).map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => onSwitchTab('build')}
                className="w-full text-left rounded-xl bg-[#F7F7FA] dark:bg-[#101014]/70 p-3 border border-[#101014]/[0.06] dark:border-white/10 hover:border-[#6252E8]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#101014] dark:text-white truncate">
                    {wf.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] shrink-0">
                    {wf.steps.length} steps
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] truncate">
                  Trigger: {wf.trigger} · {wf.triggerSpec}
                </p>
              </button>
            ))}

            {completedWithArtifacts.slice(0, 2).map((run) => (
              <button
                key={`art-${run.id}`}
                type="button"
                onClick={() => setArtifactSheetRun(run)}
                className="w-full text-left rounded-xl bg-[#F7F7FA] dark:bg-[#101014]/70 p-3 border border-[#101014]/[0.06] dark:border-white/10 hover:border-[#6252E8] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#101014] dark:text-white truncate">
                      {run.artifactTitle}
                    </div>
                    <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] truncate">
                      Generated by {run.targetName}
                    </div>
                  </div>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-[#6252E8] shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomSheet
        open={Boolean(artifactSheetRun)}
        onClose={() => setArtifactSheetRun(null)}
        title={artifactSheetRun?.artifactTitle || 'Generated Output'}
        subtitle={artifactSheetRun ? `Produced in ${artifactSheetRun.id} (Local Prototype)` : undefined}
      >
        {artifactSheetRun && (
          <pre className="whitespace-pre-wrap font-mono text-xs bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10 rounded-xl p-4 text-[#101014] dark:text-[#E8E8F2] leading-relaxed">
            {artifactSheetRun.artifactMarkdown}
          </pre>
        )}
      </BottomSheet>
    </div>
  );
};
