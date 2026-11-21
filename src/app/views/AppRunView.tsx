import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GitBranch,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  AgentConfig,
  ExecutionRun,
  KnowledgeDocument,
  MultiAgentGraphSpec,
  RetrievedSourceRef,
  UnifiedTraceSpan,
  WorkflowConfig,
} from '../types';
import { DecisionExecutionSpec } from '../../decisions/types';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StateDisplay, StatusText } from '../../components/ui/EditorialPrimitives';
import { HighlightedCode } from '../../components/ui/HighlightedCode';

interface AppRunViewProps {
  runs: ExecutionRun[];
  selectedRunId: string;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  multiAgentGraphs?: MultiAgentGraphSpec[];
  documents: KnowledgeDocument[];
  decisionExecutions?: DecisionExecutionSpec[];
  onSelectRun: (runId: string) => void;
  onStartRun: (payload: {
    title: string;
    prompt: string;
    targetName: string;
    targetType: 'Agent' | 'Workflow' | 'Graph';
    docId?: string;
    workflowInputPayload?: Record<string, unknown>;
  }) => void;
  onRunAction: (
    runId: string,
    action: 'pause' | 'resume' | 'cancel' | 'retry' | 'approve' | 'reject' | 'escalate',
    meta?: { reason?: string; reviewer?: string; escalateTo?: string }
  ) => void;
}

const DEFAULT_GRAPH_INPUT = JSON.stringify(
  { citationCount: 4, groundedScore: 0.92, contradictionCount: 0 },
  null,
  2
);

const TraceSpanNode: React.FC<{
  span: UnifiedTraceSpan;
  depth?: number;
  decisionExecutions?: DecisionExecutionSpec[];
}> = ({ span, depth = 0, decisionExecutions }) => {
  const [expanded, setExpanded] = useState(true);
  const linkedExec = span.decisionRef
    ? decisionExecutions?.find((ex) => ex.id === span.decisionRef?.executionId)
    : undefined;

  const badgeTone =
    span.status === 'failed'
      ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10'
      : span.status === 'awaiting-approval'
      ? 'text-[#2563EB] dark:text-[#7EC8FF] border-[#60A5FA]/40 bg-[#60A5FA]/10'
      : 'text-[#2563EB] dark:text-[#7EC8FF] border-[#2563EB]/25 bg-[#2563EB]/10';

  return (
    <div className={depth > 0 ? 'pl-3 border-l-2 border-[#2563EB]/25 space-y-2' : 'space-y-2'}>
      <div className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2 py-0.5 rounded-md border font-mono text-[10px] uppercase shrink-0 ${badgeTone}`}>
              {span.kind}
            </span>
            <span className="text-xs font-semibold text-[#05070E] dark:text-white truncate">
              {span.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5] shrink-0">
            <span>{span.module}</span>
            <span>·</span>
            <span>{span.durationMs.toFixed(1)}ms</span>
            {span.children && span.children.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="min-h-[32px] px-2 rounded border border-[#05070E]/15 dark:border-white/15 text-[10px] font-semibold"
              >
                {expanded ? 'Hide' : `Spans (${span.children.length})`}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed break-words">
          {span.detail}
        </p>

        {span.decisionRef && (
          <div className="rounded-lg border border-[#2563EB]/25 bg-white dark:bg-[#0A1226] p-2.5 space-y-1.5 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                <Scale className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>
                  {span.decisionRef.artifactName} · {span.decisionRef.versionUsed}
                </span>
              </span>
              <span className="font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                Match: {span.decisionRef.matchedRuleOrRow}
                {span.decisionRef.retriesAttempted > 0
                  ? ` · Retries: ${span.decisionRef.retriesAttempted}`
                  : ''}
              </span>
            </div>
            {span.decisionRef.errorCode && (
              <div className="font-mono text-red-600 dark:text-red-400">
                Error Code: {span.decisionRef.errorCode}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="rounded bg-[#F7F7FA] dark:bg-[#05070E] p-2 min-w-0">
                <div className="font-mono text-[10px] uppercase text-[#5E5E6E] dark:text-[#9A9AB0]">
                  Redacted Input Summary
                </div>
                <div className="font-mono text-[11px] text-[#05070E] dark:text-[#E8E8F2] break-words mt-0.5">
                  {Object.keys(span.decisionRef.redactedInputSummary).length > 0
                    ? Object.entries(span.decisionRef.redactedInputSummary)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', ')
                    : '—'}
                </div>
              </div>
              <div className="rounded bg-[#F7F7FA] dark:bg-[#05070E] p-2 min-w-0">
                <div className="font-mono text-[10px] uppercase text-[#5E5E6E] dark:text-[#9A9AB0]">
                  Redacted Output Summary
                </div>
                <div className="font-mono text-[11px] text-[#05070E] dark:text-[#E8E8F2] break-words mt-0.5">
                  {Object.keys(span.decisionRef.redactedOutputSummary).length > 0
                    ? Object.entries(span.decisionRef.redactedOutputSummary)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', ')
                    : '—'}
                </div>
              </div>
            </div>
            {linkedExec && (
              <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                Observe Exec ID: <span className="font-mono">{linkedExec.id}</span> ·{' '}
                {linkedExec.explanation}
              </div>
            )}
          </div>
        )}

        {span.approvalRef && (
          <div className="rounded-lg border border-[#60A5FA]/30 bg-white dark:bg-[#0A1226] p-2.5 text-[11px] space-y-1">
            <div className="font-semibold text-[#05070E] dark:text-white">
              Gate: {span.approvalRef.actionLabel} ({span.approvalRef.status})
            </div>
            {span.approvalRef.reviewer && (
              <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">
                Reviewer: {span.approvalRef.reviewer}
                {span.approvalRef.escalatedTo ? ` · Escalated to: ${span.approvalRef.escalatedTo}` : ''}
              </div>
            )}
            {span.approvalRef.reason && (
              <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">{span.approvalRef.reason}</div>
            )}
          </div>
        )}
      </div>

      {expanded && span.children && span.children.length > 0 && (
        <div className="space-y-2">
          {span.children.map((child) => (
            <TraceSpanNode
              key={child.id}
              span={child}
              depth={depth + 1}
              decisionExecutions={decisionExecutions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AppRunView: React.FC<AppRunViewProps> = ({
  runs,
  selectedRunId,
  agents,
  workflows,
  multiAgentGraphs = [],
  documents,
  decisionExecutions = [],
  onSelectRun,
  onStartRun,
  onRunAction,
}) => {
  const defaultTargetValue = agents[0]
    ? `agent:${agents[0].name}`
    : workflows[0]
    ? `workflow:${workflows[0].name}`
    : multiAgentGraphs[0]
    ? `graph:${multiAgentGraphs[0].name}`
    : 'agent:Workspace Agent';

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [taskTargetKey, setTaskTargetKey] = useState<string>(defaultTargetValue);
  const [taskDocId, setTaskDocId] = useState<string>(documents[0]?.id || '');
  const [payloadJsonText, setPayloadJsonText] = useState<string>('{}');
  const [payloadError, setPayloadError] = useState<string>('');

  const [selectedSource, setSelectedSource] = useState<RetrievedSourceRef | null>(null);
  const [gateConfirm, setGateConfirm] = useState<'approve' | 'reject' | 'escalate' | null>(null);
  const [gateReviewer, setGateReviewer] = useState('Workspace Maintainer');
  const [gateReason, setGateReason] = useState('');
  const [gateEscalateTo, setGateEscalateTo] = useState('CFO / Chief Compliance Officer');
  const [shareFeedback, setShareFeedback] = useState('');

  const activeRun = runs.find((r) => r.id === selectedRunId) ?? runs[0];

  const selectedTargetInfo = useMemo(() => {
    if (taskTargetKey.startsWith('workflow:')) {
      const name = taskTargetKey.slice('workflow:'.length);
      return {
        type: 'Workflow' as const,
        name,
        workflow: workflows.find((w) => w.name === name),
      };
    }
    if (taskTargetKey.startsWith('graph:')) {
      const name = taskTargetKey.slice('graph:'.length);
      return {
        type: 'Graph' as const,
        name,
        graph: multiAgentGraphs.find((g) => g.name === name),
      };
    }
    const name = taskTargetKey.startsWith('agent:')
      ? taskTargetKey.slice('agent:'.length)
      : taskTargetKey;
    return {
      type: 'Agent' as const,
      name,
      agent: agents.find((a) => a.name === name),
    };
  }, [taskTargetKey, workflows, multiAgentGraphs, agents]);

  const handleTargetChange = (nextKey: string) => {
    setTaskTargetKey(nextKey);
    setPayloadError('');
    if (nextKey.startsWith('workflow:')) {
      const name = nextKey.slice('workflow:'.length);
      const wf = workflows.find((w) => w.name === name);
      if (wf?.sampleInputs && wf.sampleInputs.length > 0) {
        setPayloadJsonText(JSON.stringify(wf.sampleInputs[0].payload, null, 2));
        if (!taskPrompt.trim()) {
          setTaskPrompt(`Execute ${wf.name} with ${wf.sampleInputs[0].label}`);
        }
      } else {
        setPayloadJsonText('{}');
      }
    } else if (nextKey.startsWith('graph:')) {
      setPayloadJsonText(DEFAULT_GRAPH_INPUT);
      if (!taskPrompt.trim()) {
        setTaskPrompt('Execute Research -> Decision -> Verification -> Approval Multi-Agent Graph');
      }
    } else {
      setPayloadJsonText('{}');
    }
  };

  const handleDispatchTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim()) return;

    let parsedPayload: Record<string, unknown> | undefined;
    if (
      selectedTargetInfo.type === 'Workflow' ||
      selectedTargetInfo.type === 'Graph' ||
      payloadJsonText.trim() !== '{}'
    ) {
      try {
        const raw = JSON.parse(payloadJsonText || '{}');
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          setPayloadError('Input payload must be a valid JSON object.');
          return;
        }
        parsedPayload = raw as Record<string, unknown>;
      } catch {
        setPayloadError('Invalid JSON syntax in input payload.');
        return;
      }
    }

    onStartRun({
      title: taskTitle.trim() || `${selectedTargetInfo.name} · Task`,
      prompt: taskPrompt.trim(),
      targetName: selectedTargetInfo.name,
      targetType: selectedTargetInfo.type,
      docId: taskDocId || undefined,
      workflowInputPayload: parsedPayload,
    });
    setTaskTitle('');
    setTaskPrompt('');
    setPayloadError('');
    setNewTaskOpen(false);
  };

  const demoLaunchers = useMemo(() => {
    const items: {
      id: string;
      badge: string;
      label: string;
      targetName: string;
      targetType: 'Workflow' | 'Graph';
      prompt: string;
      payload: Record<string, unknown>;
    }[] = [];

    const wfA = workflows.find((w) => w.id === 'wf-invoice-decisions');
    if (wfA?.sampleInputs?.[0]) {
      items.push({
        id: 'demo-a-auto',
        badge: 'Scenario A',
        label: 'Invoice Auto-Approve (₹32.5k)',
        targetName: wfA.name,
        targetType: 'Workflow',
        prompt: `[Sample Demo Data] Run ${wfA.name}: ${wfA.sampleInputs[0].label}`,
        payload: wfA.sampleInputs[0].payload,
      });
    }
    if (wfA?.sampleInputs?.[1]) {
      items.push({
        id: 'demo-a-rev',
        badge: 'Scenario A Gate',
        label: 'Invoice Manual Review (₹78k)',
        targetName: wfA.name,
        targetType: 'Workflow',
        prompt: `[Sample Demo Data] Run ${wfA.name}: ${wfA.sampleInputs[1].label}`,
        payload: wfA.sampleInputs[1].payload,
      });
    }
    const wfB = workflows.find((w) => w.id === 'wf-customer-onboarding');
    if (wfB?.sampleInputs?.[1]) {
      items.push({
        id: 'demo-b',
        badge: 'Scenario B',
        label: 'Onboarding KYC Review Gate',
        targetName: wfB.name,
        targetType: 'Workflow',
        prompt: `[Sample Demo Data] Run ${wfB.name}: ${wfB.sampleInputs[1].label}`,
        payload: wfB.sampleInputs[1].payload,
      });
    }
    const wfC = workflows.find((w) => w.id === 'wf-procurement-flow');
    if (wfC?.sampleInputs?.[0]) {
      items.push({
        id: 'demo-c',
        badge: 'Scenario C',
        label: 'Procurement Context + PO Gate',
        targetName: wfC.name,
        targetType: 'Workflow',
        prompt: `[Sample Demo Data] Run ${wfC.name}: ${wfC.sampleInputs[0].label}`,
        payload: wfC.sampleInputs[0].payload,
      });
    }
    const graphD = multiAgentGraphs.find((g) => g.id === 'graph-research-compliance');
    if (graphD) {
      items.push({
        id: 'demo-d-graph',
        badge: 'Scenario D',
        label: 'Multi-Agent Research Graph',
        targetName: graphD.name,
        targetType: 'Graph',
        prompt: '[Sample Demo Data] Execute Research -> Quality Decision -> Verifier Agent -> Approval Graph',
        payload: { citationCount: 4, groundedScore: 0.92, contradictionCount: 0 },
      });
    }
    return items;
  }, [workflows, multiAgentGraphs]);

  const handleDownloadArtifact = (run: ExecutionRun) => {
    if (!run.artifactMarkdown) return;
    const blob = new Blob([run.artifactMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = run.artifactTitle || `${run.id}-artifact.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareArtifact = async (run: ExecutionRun) => {
    const text = run.artifactMarkdown || run.prompt;
    try {
      if (navigator.share) {
        await navigator.share({
          title: run.artifactTitle || run.title,
          text,
        });
        setShareFeedback('Shared artifact summary.');
      } else {
        await navigator.clipboard.writeText(text);
        setShareFeedback('Copied output brief to clipboard.');
      }
    } catch {
      setShareFeedback('Share cancelled.');
    }
    setTimeout(() => setShareFeedback(''), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-[#05070E] dark:text-white">
            Execution Timeline
          </h2>
          <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
            Inspect unified Workflow, Agent, Decision, Context, and Approval traces (Local Prototype).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewTaskOpen(true)}
          className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      {/* 1-Tap End-to-End Demo Scenarios */}
      {demoLaunchers.length > 0 && (
        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#05070E] dark:text-white">
              <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Integrated Scenarios · Decisions + Flow + Graph</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-[#2563EB] dark:text-[#7EC8FF]">
              [Sample Demo Data]
            </span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            {demoLaunchers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() =>
                  onStartRun({
                    title: `[Sample Demo Data] ${d.label}`,
                    prompt: d.prompt,
                    targetName: d.targetName,
                    targetType: d.targetType,
                    workflowInputPayload: d.payload,
                  })
                }
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#2563EB]/30 bg-[#F7F7FA] dark:bg-[#05070E] hover:border-[#2563EB] text-left shrink-0 space-y-0.5"
              >
                <div className="font-mono text-[10px] font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                  {d.badge} · {d.targetType}
                </div>
                <div className="text-xs font-semibold text-[#05070E] dark:text-white whitespace-nowrap">
                  {d.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Run History Selector Pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {runs.map((run) => {
          const isCurrent = run.id === activeRun?.id;
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelectRun(run.id)}
              className={`min-h-[52px] min-w-[205px] max-w-[245px] shrink-0 text-left rounded-xl border p-3 transition-colors ${
                isCurrent
                  ? 'border-[#2563EB] bg-white dark:bg-[#0A1226] shadow-sm'
                  : 'border-[#05070E]/10 dark:border-white/10 bg-white/70 dark:bg-[#0A1226]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                  {run.id} · {run.targetType}
                </span>
                <span className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] capitalize">
                  {run.status}
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold text-[#05070E] dark:text-white truncate">
                {run.title}
              </div>
            </button>
          );
        })}
      </div>

      {!activeRun ? (
        <StateDisplay
          mode="empty"
          title="No execution runs in this workspace yet"
          description="Dispatch a prototype task using an agent, workflow, or multi-agent graph to inspect unified execution traces and approval gates."
          actionLabel="Start First Task"
          onAction={() => setNewTaskOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Active Run Summary & Controls */}
          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <StatusText
                  items={[
                    activeRun.id,
                    activeRun.targetType,
                    activeRun.targetName,
                    activeRun.status.toUpperCase(),
                  ]}
                  accentLast
                />
                <h3 className="mt-1 font-display text-lg font-semibold text-[#05070E] dark:text-white break-words">
                  {activeRun.title}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#5E5E6E] dark:text-[#A4A4B5] shrink-0">
                Est. ${activeRun.estimatedCostUsd.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#5E5E6E] dark:text-[#C5C5D6] bg-[#F7F7FA] dark:bg-[#05070E] rounded-xl p-3 border border-[#05070E]/[0.06] dark:border-white/10 break-words">
              {activeRun.prompt}
            </p>

            {/* Collaborating Sub-agents */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#5E5E6E] dark:text-[#A4A4B5] font-medium mr-1">Actors:</span>
              {activeRun.activeSubAgents.map((sub, i) => (
                <React.Fragment key={sub}>
                  {i > 0 && <span className="text-[#5E5E6E]" aria-hidden="true">→</span>}
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#05070E] dark:text-[#E8E8F2]">
                    <Bot className="w-3 h-3 text-[#2563EB]" aria-hidden="true" />
                    {sub}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Execution Action Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeRun.status === 'running' && (
                <>
                  <button
                    type="button"
                    onClick={() => onRunAction(activeRun.id, 'pause')}
                    className="min-h-[44px] px-3.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRunAction(activeRun.id, 'cancel')}
                    className="min-h-[44px] px-3.5 rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {activeRun.status === 'paused' && (
                <button
                  type="button"
                  onClick={() => onRunAction(activeRun.id, 'resume')}
                  className="min-h-[44px] px-4 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resume Run</span>
                </button>
              )}

              {activeRun.status === 'failed' && (
                <button
                  type="button"
                  onClick={() => onRunAction(activeRun.id, 'retry')}
                  className="min-h-[44px] px-4 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Failed Step</span>
                </button>
              )}
            </div>

            {activeRun.failureReason && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-[#05070E] dark:text-white"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="break-words">{activeRun.failureReason}</span>
              </div>
            )}
          </div>

          {/* Human Approval Gate Card */}
          {activeRun.status === 'awaiting-approval' && activeRun.approvalGate && (
            <div className="rounded-2xl border-2 border-[#60A5FA] bg-white dark:bg-[#0A1226] p-4 space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Human Approval Gate · Role: {activeRun.approvalGate.requiredRole}</span>
                </span>
                {activeRun.approvalGate.escalatedTo && (
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                    Escalated → {activeRun.approvalGate.escalatedTo}
                  </span>
                )}
              </div>
              <h4 className="font-display text-base font-semibold text-[#05070E] dark:text-white">
                {activeRun.approvalGate.actionLabel}
              </h4>
              <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                {activeRun.approvalGate.reason}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setGateReason('');
                    setGateConfirm('approve');
                  }}
                  className="min-h-[44px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Approve &amp; Finish</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGateReason('');
                    setGateConfirm('escalate');
                  }}
                  className="min-h-[44px] rounded-xl border border-[#2563EB]/40 text-[#2563EB] dark:text-[#7EC8FF] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  <span>Escalate Gate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGateReason('');
                    setGateConfirm('reject');
                  }}
                  className="min-h-[44px] rounded-xl border border-[#05070E]/20 dark:border-white/20 text-xs font-semibold text-[#05070E] dark:text-white"
                >
                  Reject &amp; Halt
                </button>
              </div>
            </div>
          )}

          {/* Approval Audit History */}
          {activeRun.approvalHistory && activeRun.approvalHistory.length > 0 && (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2.5">
              <h4 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                SOPIN Control · Approval Audit History ({activeRun.approvalHistory.length})
              </h4>
              <div className="space-y-2">
                {activeRun.approvalHistory.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#05070E] dark:text-white capitalize">
                        {h.decision} · {h.actor} ({h.role})
                      </span>
                      <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
                        {h.timestamp}
                      </span>
                    </div>
                    <p className="text-[#5E5E6E] dark:text-[#B5B5C5]">{h.reason}</p>
                    {h.escalatedTo && (
                      <div className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                        Escalated to: {h.escalatedTo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unified Trace Waterfall (SOPIN Observe) */}
          {activeRun.unifiedTrace && (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-sm font-semibold text-[#05070E] dark:text-white inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                  <span>Unified Trace Waterfall (Workflow → Agent → Decision → Gate)</span>
                </h4>
                <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
                  Total: {activeRun.unifiedTrace.durationMs.toFixed(1)}ms
                </span>
              </div>
              <TraceSpanNode
                span={activeRun.unifiedTrace}
                decisionExecutions={decisionExecutions}
              />
            </div>
          )}

          {/* Redacted Workflow Variables State */}
          {activeRun.workflowVars && Object.keys(activeRun.workflowVars).length > 0 && (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                  Runtime Output Variables (PII-Redacted)
                </h4>
                <span className="font-mono text-[10px] uppercase text-[#5E5E6E] dark:text-[#9A9AB0]">
                  SOPIN Observe Filter
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(activeRun.workflowVars).map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-2.5 text-xs min-w-0"
                  >
                    <div className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] truncate">
                      {key}
                    </div>
                    <div className="font-mono text-xs text-[#05070E] dark:text-white break-words mt-0.5">
                      {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan & Execution Step Timeline */}
          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Plan &amp; Tool Activity
            </h4>
            <div className="space-y-2.5">
              {activeRun.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#05070E] dark:text-white break-words">
                      {step.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                      {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      {step.status === 'running' && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
                      {step.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />}
                      {step.status === 'awaiting-approval' && <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />}
                      <span>{step.status}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0] flex flex-wrap items-center gap-2">
                    <span>{step.agentRole} · {step.module}</span>
                    {step.durationMs !== undefined && (
                      <span className="font-mono">{step.durationMs.toFixed(1)}ms</span>
                    )}
                    {step.retriesAttempted !== undefined && step.retriesAttempted > 0 && (
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        {step.retriesAttempted} retry(s)
                      </span>
                    )}
                    {step.toolUsed && (
                      <span className="inline-flex items-center gap-1 font-mono text-[#05070E] dark:text-[#D8D8E6]">
                        <Wrench className="w-3 h-3 text-[#2563EB]" aria-hidden="true" />
                        {step.toolUsed}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed break-words">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Retrieved Context Citations */}
          {activeRun.sources.length > 0 && (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-2.5">
              <h4 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
                Retrieved Grounded Sources ({activeRun.sources.length})
              </h4>
              {activeRun.sources.map((src) => (
                <button
                  key={`${src.docId}-${src.chunkId}`}
                  type="button"
                  onClick={() => setSelectedSource(src)}
                  className="w-full min-h-[48px] text-left rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 hover:border-[#2563EB]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#05070E] dark:text-white truncate">
                      {src.docTitle}
                    </span>
                    <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                      {src.checksum ? `${src.chunkId} · ${src.checksum}` : src.chunkId}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] line-clamp-2">
                    {src.excerpt}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Final Output Artifact Viewer, Download & Share */}
          {activeRun.artifactMarkdown && (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold text-[#05070E] dark:text-white truncate">
                    {activeRun.artifactTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadArtifact(activeRun)}
                    className="min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareArtifact(activeRun)}
                    className="min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
              {shareFeedback && (
                <p className="text-xs font-medium text-[#2563EB] dark:text-[#7EC8FF]">
                  {shareFeedback}
                </p>
              )}
              <pre className="font-mono text-xs bg-[#060B18] rounded-xl p-3.5 overflow-x-auto leading-relaxed border border-white/10">
                <HighlightedCode
                  code={activeRun.artifactMarkdown}
                  language="markdown"
                  surface="dark"
                  wrap
                />
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Submit New Task Bottom Sheet */}
      <BottomSheet
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        title="Start New Prototype Task"
        subtitle="Runs Agents, Workflows with Decision Nodes, or Multi-Agent Graphs locally."
      >
        <form onSubmit={handleDispatchTask} className="space-y-4">
          <div>
            <label htmlFor="task-target" className="block text-xs font-semibold mb-1.5">
              Select Agent, Workflow, or Multi-Agent Graph
            </label>
            <select
              id="task-target"
              value={taskTargetKey}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            >
              {agents.length > 0 && (
                <optgroup label="Agents">
                  {agents.map((a) => (
                    <option key={a.id} value={`agent:${a.name}`}>
                      Agent · {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {workflows.length > 0 && (
                <optgroup label="SOPIN Flow Workflows">
                  {workflows.map((w) => (
                    <option key={w.id} value={`workflow:${w.name}`}>
                      Workflow · {w.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {multiAgentGraphs.length > 0 && (
                <optgroup label="SOPIN Multi-Agent Graphs">
                  {multiAgentGraphs.map((g) => (
                    <option key={g.id} value={`graph:${g.name}`}>
                      Graph · {g.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Sample Input Presets when Workflow has sampleInputs */}
          {selectedTargetInfo.type === 'Workflow' &&
            selectedTargetInfo.workflow?.sampleInputs &&
            selectedTargetInfo.workflow.sampleInputs.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold">
                  Sample Input Payloads [Sample Demo Data]
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTargetInfo.workflow.sampleInputs.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        setPayloadJsonText(JSON.stringify(sample.payload, null, 2));
                        setPayloadError('');
                        if (!taskPrompt.trim()) {
                          setTaskPrompt(`Execute ${selectedTargetInfo.name}: ${sample.label}`);
                        }
                      }}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#2563EB]/35 bg-[#2563EB]/10 text-xs font-medium text-[#05070E] dark:text-white"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {(selectedTargetInfo.type === 'Workflow' || selectedTargetInfo.type === 'Graph') && (
            <div>
              <label htmlFor="task-payload" className="block text-xs font-semibold mb-1.5">
                Runtime Input Payload (JSON)
              </label>
              <textarea
                id="task-payload"
                rows={4}
                value={payloadJsonText}
                onChange={(e) => {
                  setPayloadJsonText(e.target.value);
                  setPayloadError('');
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] font-mono text-xs"
              />
              {payloadError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{payloadError}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold mb-1.5">
              Task Title (Optional)
            </label>
            <input
              id="task-title"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Audit Invoice Threshold Routing"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="task-doc" className="block text-xs font-semibold mb-1.5">
              Attach Knowledge Source
            </label>
            <select
              id="task-doc"
              value={taskDocId}
              onChange={(e) => setTaskDocId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            >
              <option value="">None attached</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.sourceType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-prompt" className="block text-xs font-semibold mb-1.5">
              Task Objective Prompt
            </label>
            <textarea
              id="task-prompt"
              rows={3}
              required
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe the verification, decision routing, or workflow task to execute..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!taskPrompt.trim()}
            className="w-full min-h-[48px] rounded-xl bg-[#2563EB] disabled:opacity-40 text-white text-sm font-semibold"
          >
            Start Execution Trace
          </button>
        </form>
      </BottomSheet>

      {/* Retrieved Source Viewer Sheet */}
      <BottomSheet
        open={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        title={selectedSource?.docTitle || 'Source Chunk'}
        subtitle={
          selectedSource
            ? `Passage reference: ${selectedSource.chunkId}${
                selectedSource.checksum ? ` · ${selectedSource.checksum}` : ''
              }`
            : undefined
        }
      >
        {selectedSource && (
          <p className="text-sm text-[#05070E] dark:text-[#E8E8F2] leading-relaxed bg-[#F7F7FA] dark:bg-[#05070E] rounded-xl p-4 border border-[#05070E]/10 dark:border-white/10">
            {selectedSource.excerpt}
          </p>
        )}
      </BottomSheet>

      {/* Approval / Rejection / Escalation Confirmation Sheet */}
      <BottomSheet
        open={Boolean(gateConfirm)}
        onClose={() => setGateConfirm(null)}
        title={
          gateConfirm === 'approve'
            ? 'Confirm Gate Approval'
            : gateConfirm === 'escalate'
            ? 'Escalate Human Approval Gate'
            : 'Reject Execution Gate'
        }
        subtitle={activeRun?.approvalGate?.actionLabel}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
            {gateConfirm === 'approve'
              ? 'Approving this human checkpoint records your maintainer decision in SOPIN Control and finalizes the run.'
              : gateConfirm === 'escalate'
              ? 'Escalating reassigns this pending gate to a senior governance reviewer while preserving full audit history.'
              : 'Rejecting this checkpoint halts execution safely and records a rejection event in the audit log.'}
          </p>

          <div>
            <label htmlFor="gate-reviewer" className="block text-xs font-semibold mb-1">
              Reviewer Name
            </label>
            <input
              id="gate-reviewer"
              type="text"
              value={gateReviewer}
              onChange={(e) => setGateReviewer(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
            />
          </div>

          {gateConfirm === 'escalate' && (
            <div>
              <label htmlFor="gate-escalate-to" className="block text-xs font-semibold mb-1">
                Escalate Target Role / Owner
              </label>
              <input
                id="gate-escalate-to"
                type="text"
                value={gateEscalateTo}
                onChange={(e) => setGateEscalateTo(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="gate-reason" className="block text-xs font-semibold mb-1">
              Audit Reason / Rationale
            </label>
            <textarea
              id="gate-reason"
              rows={2}
              value={gateReason}
              onChange={(e) => setGateReason(e.target.value)}
              placeholder={
                gateConfirm === 'approve'
                  ? 'Verified deterministic decision output and budget alignment.'
                  : gateConfirm === 'escalate'
                  ? 'Requires secondary compliance or CFO sign-off.'
                  : 'Policy criteria not satisfied.'
              }
              className="w-full px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGateConfirm(null)}
              className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeRun && gateConfirm) {
                  onRunAction(activeRun.id, gateConfirm, {
                    reviewer: gateReviewer.trim() || 'Workspace Maintainer',
                    reason: gateReason.trim() || undefined,
                    escalateTo: gateConfirm === 'escalate' ? gateEscalateTo.trim() : undefined,
                  });
                }
                setGateConfirm(null);
              }}
              className={`min-h-[44px] rounded-lg text-white text-xs font-semibold ${
                gateConfirm === 'approve'
                  ? 'bg-[#2563EB]'
                  : gateConfirm === 'escalate'
                  ? 'bg-amber-600'
                  : 'bg-red-600'
              }`}
            >
              {gateConfirm === 'approve'
                ? 'Approve & Record'
                : gateConfirm === 'escalate'
                ? 'Escalate Gate'
                : 'Reject & Halt'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

