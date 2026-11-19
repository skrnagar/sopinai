import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Share2,
  ShieldAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  AgentConfig,
  ExecutionRun,
  KnowledgeDocument,
  RetrievedSourceRef,
  WorkflowConfig,
} from '../types';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface AppRunViewProps {
  runs: ExecutionRun[];
  selectedRunId: string;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  documents: KnowledgeDocument[];
  onSelectRun: (runId: string) => void;
  onStartRun: (payload: {
    title: string;
    prompt: string;
    targetName: string;
    targetType: 'Agent' | 'Workflow';
    docId?: string;
  }) => void;
  onRunAction: (
    runId: string,
    action: 'pause' | 'resume' | 'cancel' | 'retry' | 'approve' | 'reject'
  ) => void;
}

export const AppRunView: React.FC<AppRunViewProps> = ({
  runs,
  selectedRunId,
  agents,
  workflows,
  documents,
  onSelectRun,
  onStartRun,
  onRunAction,
}) => {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [taskTarget, setTaskTarget] = useState<string>(agents[0]?.name || 'PR Verification Agent');
  const [taskDocId, setTaskDocId] = useState<string>(documents[0]?.id || '');

  const [selectedSource, setSelectedSource] = useState<RetrievedSourceRef | null>(null);
  const [gateConfirm, setGateConfirm] = useState<'approve' | 'reject' | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const activeRun = runs.find((r) => r.id === selectedRunId) ?? runs[0];

  const handleDispatchTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim()) return;
    const isWorkflow = workflows.some((w) => w.name === taskTarget);
    onStartRun({
      title: taskTitle.trim() || `${taskTarget} · Task`,
      prompt: taskPrompt.trim(),
      targetName: taskTarget,
      targetType: isWorkflow ? 'Workflow' : 'Agent',
      docId: taskDocId || undefined,
    });
    setTaskTitle('');
    setTaskPrompt('');
    setNewTaskOpen(false);
  };

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
      {/* Top Action Strip + Horizontal Run Switcher */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#101014] dark:text-white">
            Execution Timeline
          </h2>
          <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
            Inspect plans, tool calls, citations, and approval gates (Local Prototype).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewTaskOpen(true)}
          className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      {/* Run History Selector Pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {runs.map((run) => {
          const isCurrent = run.id === activeRun?.id;
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelectRun(run.id)}
              className={`min-h-[52px] min-w-[205px] max-w-[235px] shrink-0 text-left rounded-xl border p-3 transition-colors ${
                isCurrent
                  ? 'border-[#6252E8] bg-white dark:bg-[#101126] shadow-sm'
                  : 'border-[#101014]/10 dark:border-white/10 bg-white/70 dark:bg-[#101126]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF]">
                  {run.id}
                </span>
                <span className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] capitalize">
                  {run.status}
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold text-[#101014] dark:text-white truncate">
                {run.title}
              </div>
            </button>
          );
        })}
      </div>

      {activeRun && (
        <div className="space-y-4">
          {/* Active Run Summary & Controls */}
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <StatusText
                  items={[
                    activeRun.id,
                    activeRun.targetName,
                    activeRun.status.toUpperCase(),
                  ]}
                  accentLast
                />
                <h3 className="mt-1 font-display text-lg font-semibold text-[#101014] dark:text-white">
                  {activeRun.title}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#5E5E6E] dark:text-[#A4A4B5] shrink-0">
                Est. ${activeRun.estimatedCostUsd.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#5E5E6E] dark:text-[#C5C5D6] bg-[#F7F7FA] dark:bg-[#101014] rounded-xl p-3 border border-[#101014]/[0.06] dark:border-white/10">
              {activeRun.prompt}
            </p>

            {/* Collaborating Sub-agents */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#5E5E6E] dark:text-[#A4A4B5] font-medium mr-1">Agents:</span>
              {activeRun.activeSubAgents.map((sub, i) => (
                <React.Fragment key={sub}>
                  {i > 0 && <span className="text-[#5E5E6E]" aria-hidden="true">→</span>}
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#101014] dark:text-[#E8E8F2]">
                    <Bot className="w-3 h-3 text-[#6252E8]" aria-hidden="true" />
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
                    className="min-h-[44px] px-3.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
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
                  className="min-h-[44px] px-4 rounded-lg bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resume Run</span>
                </button>
              )}

              {activeRun.status === 'failed' && (
                <button
                  type="button"
                  onClick={() => onRunAction(activeRun.id, 'retry')}
                  className="min-h-[44px] px-4 rounded-lg bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Failed Step</span>
                </button>
              )}
            </div>

            {activeRun.failureReason && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-[#101014] dark:text-white"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{activeRun.failureReason}</span>
              </div>
            )}
          </div>

          {/* Human Approval Gate Card */}
          {activeRun.status === 'awaiting-approval' && activeRun.approvalGate && (
            <div className="rounded-2xl border-2 border-[#965BFF] bg-white dark:bg-[#101126] p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6252E8] dark:text-[#B894FF]">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>Human Approval Gate · Role: {activeRun.approvalGate.requiredRole}</span>
              </div>
              <h4 className="font-display text-base font-semibold text-[#101014] dark:text-white">
                {activeRun.approvalGate.actionLabel}
              </h4>
              <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                {activeRun.approvalGate.reason}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setGateConfirm('reject')}
                  className="min-h-[44px] rounded-xl border border-[#101014]/20 dark:border-white/20 text-xs font-semibold text-[#101014] dark:text-white"
                >
                  Reject &amp; Halt
                </button>
                <button
                  type="button"
                  onClick={() => setGateConfirm('approve')}
                  className="min-h-[44px] rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Approve &amp; Finish</span>
                </button>
              </div>
            </div>
          )}

          {/* Plan & Execution Step Timeline */}
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#101014] dark:text-white">
              Plan &amp; Tool Activity
            </h4>
            <div className="space-y-2.5">
              {activeRun.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#101014] dark:text-white">
                      {step.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6252E8] dark:text-[#B894FF] shrink-0">
                      {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      {step.status === 'running' && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
                      {step.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />}
                      {step.status === 'awaiting-approval' && <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />}
                      <span>{step.status}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0] flex flex-wrap items-center gap-2">
                    <span>{step.agentRole} · {step.module}</span>
                    {step.toolUsed && (
                      <span className="inline-flex items-center gap-1 font-mono text-[#101014] dark:text-[#D8D8E6]">
                        <Wrench className="w-3 h-3 text-[#6252E8]" aria-hidden="true" />
                        {step.toolUsed}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Retrieved Context Citations */}
          {activeRun.sources.length > 0 && (
            <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-2.5">
              <h4 className="font-display text-sm font-semibold text-[#101014] dark:text-white">
                Retrieved Grounded Sources ({activeRun.sources.length})
              </h4>
              {activeRun.sources.map((src) => (
                <button
                  key={`${src.docId}-${src.chunkId}`}
                  type="button"
                  onClick={() => setSelectedSource(src)}
                  className="w-full min-h-[48px] text-left rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 hover:border-[#6252E8]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#101014] dark:text-white truncate">
                      {src.docTitle}
                    </span>
                    <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] shrink-0">
                      {src.chunkId}
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
            <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#6252E8] shrink-0" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold text-[#101014] dark:text-white truncate">
                    {activeRun.artifactTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadArtifact(activeRun)}
                    className="min-h-[40px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareArtifact(activeRun)}
                    className="min-h-[40px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
              {shareFeedback && (
                <p className="text-xs font-medium text-[#6252E8] dark:text-[#B894FF]">
                  {shareFeedback}
                </p>
              )}
              <pre className="whitespace-pre-wrap font-mono text-xs bg-[#101014] text-[#E8E8F2] rounded-xl p-3.5 overflow-x-auto leading-relaxed">
                {activeRun.artifactMarkdown}
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
        subtitle="Simulates plan, context lookup, and human checkpoint locally."
      >
        <form onSubmit={handleDispatchTask} className="space-y-4">
          <div>
            <label htmlFor="task-target" className="block text-xs font-semibold mb-1.5">
              Select Agent or Workflow
            </label>
            <select
              id="task-target"
              value={taskTarget}
              onChange={(e) => setTaskTarget(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  Agent · {a.name}
                </option>
              ))}
              {workflows.map((w) => (
                <option key={w.id} value={w.name}>
                  Workflow · {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold mb-1.5">
              Task Title (Optional)
            </label>
            <input
              id="task-title"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Audit ADR Sandbox Rules"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
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
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
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
              placeholder="Describe the verification, research, or workflow task to simulate..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!taskPrompt.trim()}
            className="w-full min-h-[48px] rounded-xl bg-[#6252E8] disabled:opacity-40 text-white text-sm font-semibold"
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
        subtitle={selectedSource ? `Passage reference: ${selectedSource.chunkId}` : undefined}
      >
        {selectedSource && (
          <p className="text-sm text-[#101014] dark:text-[#E8E8F2] leading-relaxed bg-[#F7F7FA] dark:bg-[#101014] rounded-xl p-4 border border-[#101014]/10 dark:border-white/10">
            {selectedSource.excerpt}
          </p>
        )}
      </BottomSheet>

      {/* Approval / Rejection Confirmation Sheet */}
      <BottomSheet
        open={Boolean(gateConfirm)}
        onClose={() => setGateConfirm(null)}
        title={gateConfirm === 'approve' ? 'Confirm Gate Approval' : 'Reject Execution Gate'}
        subtitle={activeRun?.approvalGate?.actionLabel}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
            {gateConfirm === 'approve'
              ? 'Approving this human checkpoint records your maintainer decision in the local audit ledger and finalizes the run artifact.'
              : 'Rejecting this checkpoint halts execution safely and records a rejection event in the audit log.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGateConfirm(null)}
              className="min-h-[44px] rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeRun && gateConfirm) {
                  onRunAction(activeRun.id, gateConfirm);
                }
                setGateConfirm(null);
              }}
              className={`min-h-[44px] rounded-lg text-white text-xs font-semibold ${
                gateConfirm === 'approve' ? 'bg-[#6252E8]' : 'bg-red-600'
              }`}
            >
              {gateConfirm === 'approve' ? 'Approve & Record' : 'Reject & Halt'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
