import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  CheckCircle2,
  GitBranch,
  Layers,
  List,
  Play,
  Plus,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AgentConfig,
  KnowledgeDocument,
  McpToolRecord,
  MemoryTier,
  WorkflowConfig,
  WorkflowStep,
  WorkflowStepKind,
} from '../types';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface AppBuildViewProps {
  workspaceId: string;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  tools: McpToolRecord[];
  documents: KnowledgeDocument[];
  onSaveAgent: (agent: AgentConfig) => void;
  onSaveWorkflow: (wf: WorkflowConfig) => void;
  onTestRunTarget: (name: string, type: 'Agent' | 'Workflow', prompt: string) => void;
}

const AGENT_TEMPLATES: {
  label: string;
  name: string;
  objective: string;
  instructions: string;
  modelRoute: string;
  tools: string[];
  memoryTier: MemoryTier;
}[] = [
  {
    label: 'Code Diff Auditor',
    name: 'Release Diff Guard',
    objective: 'Inspect commit diffs against architectural decision records before merge.',
    instructions: 'Check security boundaries and require human sign-off on permission changes.',
    modelRoute: 'reasoning-structured',
    tools: ['git.diff', 'ci.testRunner', 'context.query'],
    memoryTier: 'episodic',
  },
  {
    label: 'Cited Research Brief',
    name: 'Policy Brief Synthesizer',
    objective: 'Compile concise technical briefs grounded strictly in approved documents.',
    instructions: 'Cite source checksums on every claim. Reject unsupported assumptions.',
    modelRoute: 'citation-audit',
    tools: ['context.query', 'doc.extractMarkdown'],
    memoryTier: 'corpus',
  },
  {
    label: 'Incident Triage',
    name: 'Queue Triage Assistant',
    objective: 'Classify operational alerts, inspect metadata read-only, and stage approval gates.',
    instructions: 'Redact PII fields pre-inference and enforce batch <= 10 constraint.',
    modelRoute: 'deterministic-fast',
    tools: ['ticket.inspectMetadata', 'context.query'],
    memoryTier: 'ephemeral',
  },
];

const MODEL_OPTIONS = [
  { id: 'reasoning-structured', label: 'reasoning-structured', note: 'Strict JSON & multi-step reasoning' },
  { id: 'citation-audit', label: 'citation-audit', note: 'Grounded source-link verification' },
  { id: 'deterministic-fast', label: 'deterministic-fast', note: 'Low-variance enum & triage routing' },
];

export const AppBuildView: React.FC<AppBuildViewProps> = ({
  workspaceId,
  agents,
  workflows,
  tools,
  documents,
  onSaveAgent,
  onSaveWorkflow,
  onTestRunTarget,
}) => {
  const [studioMode, setStudioMode] = useState<'agent' | 'workflow'>('agent');

  // --- Agent Studio Mobile Sequential State ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [agentViewFormat, setAgentViewFormat] = useState<'list' | 'graph'>('list');
  const [graphZoom, setGraphZoom] = useState(1);
  const [nlPrompt, setNlPrompt] = useState('');
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [draftSavedNotice, setDraftSavedNotice] = useState('');

  const initialAgent = agents[0];
  const [agentDraft, setAgentDraft] = useState<AgentConfig>(() => ({
    ...initialAgent,
    workspaceId,
  }));

  // --- Workflow Designer Vertical Editor State ---
  const [wfViewFormat, setWfViewFormat] = useState<'steps' | 'graph'>('steps');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowConfig>(() => ({
    ...workflows[0],
  }));
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [triggerSheetOpen, setTriggerSheetOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepKind, setNewStepKind] = useState<WorkflowStepKind>('action');
  const [newStepDetail, setNewStepDetail] = useState('');

  const handleCompileFromNL = () => {
    const clean = nlPrompt.trim();
    if (!clean) return;
    const isResearch = /research|doc|cite|brief|pdf|report/i.test(clean);
    const isOps = /ticket|triage|ops|alert|queue/i.test(clean);

    setAgentDraft({
      id: `agt-${Date.now()}`,
      workspaceId,
      name: clean.length > 34 ? `${clean.slice(0, 32)}...` : clean,
      summary: `Compiled from mobile NL spec: ${clean}`,
      objective: clean,
      instructions: `Follow scoped workspace instructions for "${clean}". Validate structured output schema and enforce human checkpoint prior to state-changing actions.`,
      modelRoute: isResearch ? 'citation-audit' : isOps ? 'deterministic-fast' : 'reasoning-structured',
      budgetCeilingUsd: 1.5,
      tools: isResearch
        ? ['context.query', 'doc.extractMarkdown']
        : isOps
        ? ['context.query', 'ticket.inspectMetadata']
        : ['git.diff', 'context.query'],
      knowledgeIds: documents.slice(0, 1).map((d) => d.id),
      memoryTier: isResearch ? 'corpus' : 'episodic',
      permissionMode: 'gated-write',
      successCriteria: 'Schema validates strictly and every external call respects least privilege.',
      status: 'Draft',
      version: 'v0.1',
      updatedAt: 'Just now',
    });
    setNlPrompt('');
    setWizardStep(1);
    setDraftSavedNotice('Compiled natural language intent into an editable agent blueprint.');
  };

  const applyTemplate = (tpl: (typeof AGENT_TEMPLATES)[number]) => {
    setAgentDraft({
      id: `agt-${Date.now()}`,
      workspaceId,
      name: tpl.name,
      summary: tpl.objective,
      objective: tpl.objective,
      instructions: tpl.instructions,
      modelRoute: tpl.modelRoute,
      budgetCeilingUsd: 2.0,
      tools: tpl.tools,
      knowledgeIds: documents.slice(0, 1).map((d) => d.id),
      memoryTier: tpl.memoryTier,
      permissionMode: 'gated-write',
      successCriteria: 'Output conforms to typed JSON schema and passes verification gate.',
      status: 'Draft',
      version: 'v0.1',
      updatedAt: 'Just now',
    });
    setDraftSavedNotice(`Loaded "${tpl.label}" template into draft.`);
  };

  const toggleAgentTool = (toolName: string) => {
    setAgentDraft((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolName)
        ? prev.tools.filter((t) => t !== toolName)
        : [...prev.tools, toolName],
    }));
  };

  const toggleAgentDoc = (docId: string) => {
    setAgentDraft((prev) => ({
      ...prev,
      knowledgeIds: prev.knowledgeIds.includes(docId)
        ? prev.knowledgeIds.filter((id) => id !== docId)
        : [...prev.knowledgeIds, docId],
    }));
  };

  const commitAgent = (status: 'Draft' | 'Published') => {
    const next: AgentConfig = {
      ...agentDraft,
      status,
      updatedAt: 'Just now',
      version: status === 'Published' ? 'v1.0' : agentDraft.version,
    };
    onSaveAgent(next);
    setAgentDraft(next);
    setPublishConfirmOpen(false);
    setDraftSavedNotice(
      status === 'Published'
        ? `Published ${next.name} to local workspace registry.`
        : `Saved ${next.name} draft locally.`
    );
  };

  const moveWorkflowStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= activeWorkflow.steps.length) return;
    setActiveWorkflow((prev) => {
      const copy = [...prev.steps];
      const [removed] = copy.splice(index, 1);
      copy.splice(target, 0, removed);
      return { ...prev, steps: copy, updatedAt: 'Just now' };
    });
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    const step: WorkflowStep = {
      id: `st-${Date.now()}`,
      title: newStepTitle.trim(),
      kind: newStepKind,
      detail: newStepDetail.trim() || 'Configured in mobile vertical workflow designer.',
      retryMax: newStepKind === 'approval' ? 0 : 2,
      timeoutSec: newStepKind === 'approval' ? 600 : 30,
      requiresApproval: newStepKind === 'approval',
    };
    const nextWf: WorkflowConfig = {
      ...activeWorkflow,
      steps: [...activeWorkflow.steps, step],
      updatedAt: 'Just now',
    };
    setActiveWorkflow(nextWf);
    onSaveWorkflow(nextWf);
    setNewStepTitle('');
    setNewStepDetail('');
    setAddStepOpen(false);
  };

  const bumpWorkflowVersion = (publish: boolean) => {
    const num = parseFloat(activeWorkflow.version.replace('v', '')) || 1.0;
    const nextVer = `v${(num + 0.1).toFixed(1)}`;
    const nextWf: WorkflowConfig = {
      ...activeWorkflow,
      version: nextVer,
      status: publish ? 'Published' : 'Draft',
      updatedAt: 'Just now',
    };
    setActiveWorkflow(nextWf);
    onSaveWorkflow(nextWf);
    setDraftSavedNotice(`Workflow saved as ${nextVer} (${nextWf.status}).`);
  };

  const filteredModels = MODEL_OPTIONS.filter(
    (m) =>
      m.label.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.note.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Mode Switcher: Mobile Agent Studio vs Mobile Workflow Designer */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => setStudioMode('agent')}
          className={`min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            studioMode === 'agent'
              ? 'bg-[#6252E8] text-white'
              : 'text-[#5E5E6E] dark:text-[#B5B5C5]'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Agent Studio</span>
        </button>
        <button
          type="button"
          onClick={() => setStudioMode('workflow')}
          className={`min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            studioMode === 'workflow'
              ? 'bg-[#6252E8] text-white'
              : 'text-[#5E5E6E] dark:text-[#B5B5C5]'
          }`}
        >
          <GitBranch className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Workflow Designer</span>
        </button>
      </div>

      {draftSavedNotice && (
        <div
          role="status"
          className="rounded-xl border border-[#6252E8]/30 bg-[#6252E8]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-[#101014] dark:text-white"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#6252E8] shrink-0" aria-hidden="true" />
            <span>{draftSavedNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setDraftSavedNotice('')}
            className="text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== AGENT STUDIO MOBILE FLOW ==================== */}
      {studioMode === 'agent' && (
        <div className="space-y-4">
          {/* Natural Language Quick-Create + Templates */}
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#6252E8] dark:text-[#965BFF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Compile from Natural Language</span>
              </span>
              <span className="text-[11px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
                Local Blueprint Compiler
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="e.g., Audit vendor security questionnaire with citations"
                aria-label="Describe agent goal"
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
              />
              <button
                type="button"
                onClick={handleCompileFromNL}
                disabled={!nlPrompt.trim()}
                className="min-h-[44px] px-4 rounded-lg bg-[#101014] dark:bg-white text-white dark:text-[#101014] disabled:opacity-40 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Compile Spec
              </button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 pt-1">
              {AGENT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="min-h-[38px] px-3 rounded-lg border border-[#101014]/10 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014]/70 text-xs font-medium text-[#101014] dark:text-white whitespace-nowrap shrink-0 hover:border-[#6252E8]"
                >
                  Template: {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Workspace Agents Selector Strip */}
          <div className="flex overflow-x-auto no-scrollbar gap-2">
            {agents.map((ag) => {
              const selected = ag.id === agentDraft.id;
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setAgentDraft(ag)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 transition-colors ${
                    selected
                      ? 'border-[#6252E8] bg-[#6252E8]/10 dark:bg-[#6252E8]/25'
                      : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                  }`}
                >
                  <div className="text-xs font-semibold text-[#101014] dark:text-white truncate max-w-[160px]">
                    {ag.name}
                  </div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                    {ag.status} · {ag.modelRoute}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 5-Step Sequential Mobile Wizard Progress */}
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-4">
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
              {[
                { step: 1, label: '1. Identity' },
                { step: 2, label: '2. Model & Budget' },
                { step: 3, label: '3. Tools & Docs' },
                { step: 4, label: '4. Guardrails' },
                { step: 5, label: '5. Graph & Test' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setWizardStep(s.step as 1 | 2 | 3 | 4 | 5)}
                  className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    wizardStep === s.step
                      ? 'bg-[#6252E8] text-white'
                      : 'bg-[#F7F7FA] dark:bg-[#101014] text-[#5E5E6E] dark:text-[#B5B5C5]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {wizardStep === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="agent-name" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1">
                    Agent Name
                  </label>
                  <input
                    id="agent-name"
                    type="text"
                    value={agentDraft.name}
                    onChange={(e) => setAgentDraft({ ...agentDraft, name: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="agent-objective" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1">
                    Objective
                  </label>
                  <input
                    id="agent-objective"
                    type="text"
                    value={agentDraft.objective}
                    onChange={(e) => setAgentDraft({ ...agentDraft, objective: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="agent-instructions" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1">
                    System Instructions
                  </label>
                  <textarea
                    id="agent-instructions"
                    rows={3}
                    value={agentDraft.instructions}
                    onChange={(e) => setAgentDraft({ ...agentDraft, instructions: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
                  />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                    SOPIN Gateway Route Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => setModelSheetOpen(true)}
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="font-mono text-sm font-semibold text-[#101014] dark:text-white">
                        {agentDraft.modelRoute}
                      </div>
                      <div className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                        Tap to search Gateway model profiles
                      </div>
                    </div>
                    <Search className="w-4 h-4 text-[#6252E8] shrink-0" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                    <span>Per-Run Prototype Budget Ceiling</span>
                    <span className="font-mono text-[#6252E8] dark:text-[#B894FF]">
                      ${agentDraft.budgetCeilingUsd.toFixed(2)} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.25"
                    value={agentDraft.budgetCeilingUsd}
                    onChange={(e) =>
                      setAgentDraft({ ...agentDraft, budgetCeilingUsd: Number(e.target.value) })
                    }
                    className="w-full accent-[#6252E8] h-10"
                    aria-label="Budget ceiling in USD"
                  />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#101014] dark:text-white mb-2">
                    Bind Scoped MCP Tools
                  </span>
                  <div className="space-y-2">
                    {tools.map((tool) => {
                      const active = agentDraft.tools.includes(tool.name);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => toggleAgentTool(tool.name)}
                          className={`w-full min-h-[48px] text-left rounded-xl border p-3 flex items-center justify-between gap-3 ${
                            active
                              ? 'border-[#6252E8] bg-[#6252E8]/10 dark:bg-[#6252E8]/20'
                              : 'border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-semibold text-[#101014] dark:text-white">
                              {tool.name} · {tool.scope}
                            </div>
                            <div className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] truncate">
                              {tool.description}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] shrink-0">
                            {active ? 'Attached' : 'Attach'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#101014] dark:text-white mb-2">
                    Attach Knowledge Sources
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {documents.map((doc) => {
                      const attached = agentDraft.knowledgeIds.includes(doc.id);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => toggleAgentDoc(doc.id)}
                          className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-medium text-left ${
                            attached
                              ? 'border-[#6252E8] bg-[#6252E8] text-white'
                              : 'border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white'
                          }`}
                        >
                          {doc.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#101014] dark:text-white mb-2">
                    SOPIN Context Memory Tier
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ephemeral', 'episodic', 'corpus'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setAgentDraft({ ...agentDraft, memoryTier: tier })}
                        className={`min-h-[44px] rounded-lg border text-xs font-semibold capitalize ${
                          agentDraft.memoryTier === tier
                            ? 'border-[#6252E8] bg-[#6252E8] text-white'
                            : 'border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#101014] dark:text-white mb-2">
                    Tool Permission Boundary
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAgentDraft({ ...agentDraft, permissionMode: 'read-only' })}
                      className={`min-h-[44px] rounded-lg border text-xs font-semibold ${
                        agentDraft.permissionMode === 'read-only'
                          ? 'border-[#6252E8] bg-[#6252E8] text-white'
                          : 'border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white'
                      }`}
                    >
                      Read-Only Strict
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentDraft({ ...agentDraft, permissionMode: 'gated-write' })}
                      className={`min-h-[44px] rounded-lg border text-xs font-semibold ${
                        agentDraft.permissionMode === 'gated-write'
                          ? 'border-[#6252E8] bg-[#6252E8] text-white'
                          : 'border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white'
                      }`}
                    >
                      Human-Gated Write
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="agent-criteria" className="block text-xs font-semibold text-[#101014] dark:text-white mb-1">
                    Success &amp; Verification Criteria
                  </label>
                  <input
                    id="agent-criteria"
                    type="text"
                    value={agentDraft.successCriteria}
                    onChange={(e) => setAgentDraft({ ...agentDraft, successCriteria: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
                  />
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#101014] dark:text-white">
                    Topology View
                  </span>
                  <div className="inline-flex p-1 rounded-lg bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setAgentViewFormat('list')}
                      className={`min-h-[36px] px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${
                        agentViewFormat === 'list' ? 'bg-[#6252E8] text-white' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentViewFormat('graph')}
                      className={`min-h-[36px] px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${
                        agentViewFormat === 'graph' ? 'bg-[#6252E8] text-white' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Graph</span>
                    </button>
                  </div>
                </div>

                {agentViewFormat === 'list' ? (
                  <div className="space-y-2 text-xs">
                    {[
                      { stage: '01. Gateway Profile', val: `${agentDraft.modelRoute} · $${agentDraft.budgetCeilingUsd.toFixed(2)} cap` },
                      { stage: '02. Context Scope', val: `${agentDraft.memoryTier} memory · ${agentDraft.knowledgeIds.length} docs` },
                      { stage: '03. MCP Tools', val: agentDraft.tools.join(', ') || 'None attached' },
                      { stage: '04. Governance', val: `${agentDraft.permissionMode} · ${agentDraft.successCriteria}` },
                    ].map((row) => (
                      <div
                        key={row.stage}
                        className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3"
                      >
                        <div className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF]">
                          {row.stage}
                        </div>
                        <div className="mt-0.5 text-[#101014] dark:text-white break-words">{row.val}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#B894FF]">Simplified Mobile Graph</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setGraphZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(1))))}
                          aria-label="Zoom out graph"
                          className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center"
                        >
                          <ZoomOut className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGraphZoom((z) => Math.min(1.2, Number((z + 0.1).toFixed(1))))}
                          aria-label="Zoom in graph"
                          className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center"
                        >
                          <ZoomIn className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-auto py-2">
                      <div
                        style={{ transform: `scale(${graphZoom})`, transformOrigin: 'top center' }}
                        className="space-y-2 transition-transform"
                      >
                        {[
                          { label: 'Intake & Objective', sub: agentDraft.name },
                          { label: 'SOPIN Context', sub: `${agentDraft.memoryTier} · ${agentDraft.knowledgeIds.length} sources` },
                          { label: 'SOPIN Gateway', sub: agentDraft.modelRoute },
                          { label: 'Runtime MCP Tools', sub: agentDraft.tools.join(', ') || 'None' },
                          { label: 'SOPIN Control', sub: agentDraft.permissionMode },
                        ].map((node, i, arr) => (
                          <React.Fragment key={node.label}>
                            <div className="rounded-xl border border-white/15 bg-[#101014] px-3.5 py-2.5">
                              <div className="font-mono text-[10px] text-[#965BFF]">{node.label}</div>
                              <div className="text-xs font-semibold truncate">{node.sub}</div>
                            </div>
                            {i < arr.length - 1 && (
                              <div className="h-3 flex justify-center" aria-hidden="true">
                                <div className="w-px h-full bg-[#6252E8]" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wizard Sticky Action Controls */}
            <div className="pt-3 border-t border-[#101014]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5)}
                    className="min-h-[44px] px-3.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold text-[#101014] dark:text-white"
                  >
                    Back
                  </button>
                )}
                {wizardStep < 5 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5)}
                    className="min-h-[44px] px-4 rounded-lg bg-[#101014] dark:bg-white text-white dark:text-[#101014] text-xs font-semibold"
                  >
                    Next Step
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onTestRunTarget(
                      agentDraft.name,
                      'Agent',
                      `Dry-run test for objective: ${agentDraft.objective}`
                    )
                  }
                  className="min-h-[44px] px-3.5 rounded-lg border border-[#6252E8]/40 text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Test</span>
                </button>
                <button
                  type="button"
                  onClick={() => commitAgent('Draft')}
                  className="min-h-[44px] px-3.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold text-[#101014] dark:text-white"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setPublishConfirmOpen(true)}
                  className="min-h-[44px] px-4 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== WORKFLOW DESIGNER (VERTICAL STEP EDITOR) ==================== */}
      {studioMode === 'workflow' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <StatusText
                  items={[activeWorkflow.version, activeWorkflow.status, `${activeWorkflow.steps.length} Steps`]}
                  accentLast
                />
                <h2 className="mt-1 font-display text-lg font-semibold text-[#101014] dark:text-white truncate">
                  {activeWorkflow.name}
                </h2>
              </div>

              <div className="inline-flex p-1 rounded-lg bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setWfViewFormat('steps')}
                  className={`min-h-[38px] px-3 rounded-md text-xs font-semibold ${
                    wfViewFormat === 'steps' ? 'bg-[#6252E8] text-white' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                  }`}
                >
                  Vertical Steps
                </button>
                <button
                  type="button"
                  onClick={() => setWfViewFormat('graph')}
                  className={`min-h-[38px] px-3 rounded-md text-xs font-semibold ${
                    wfViewFormat === 'graph' ? 'bg-[#6252E8] text-white' : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                  }`}
                >
                  Visual Flow
                </button>
              </div>
            </div>

            {/* Trigger Card */}
            <button
              type="button"
              onClick={() => setTriggerSheetOpen(true)}
              className="w-full min-h-[48px] rounded-xl border border-[#6252E8]/30 bg-[#6252E8]/[0.06] dark:bg-[#6252E8]/15 p-3 text-left flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF]">
                  TRIGGER · {activeWorkflow.trigger}
                </div>
                <div className="text-xs text-[#101014] dark:text-white truncate">
                  {activeWorkflow.triggerSpec}
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] shrink-0">
                Change
              </span>
            </button>
          </div>

          {wfViewFormat === 'steps' ? (
            <div className="space-y-2.5">
              {activeWorkflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingStep(step)}
                      className="text-left flex-1 min-w-0 min-h-[44px]"
                    >
                      <div className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] uppercase">
                        0{index + 1} · {step.kind} {step.requiresApproval ? '· Approval Gate' : ''}
                      </div>
                      <div className="mt-0.5 font-display text-sm font-semibold text-[#101014] dark:text-white">
                        {step.title}
                      </div>
                      <p className="mt-0.5 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                        {step.detail}
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveWorkflowStep(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${step.title} up`}
                        className="w-10 h-10 rounded-lg border border-[#101014]/10 dark:border-white/15 flex items-center justify-center disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWorkflowStep(index, 1)}
                        disabled={index === activeWorkflow.steps.length - 1}
                        aria-label={`Move ${step.title} down`}
                        className="w-10 h-10 rounded-lg border border-[#101014]/10 dark:border-white/15 flex items-center justify-center disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#101014]/[0.06] dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
                    <span>Retries: max {step.retryMax} · Timeout: {step.timeoutSec}s</span>
                    <button
                      type="button"
                      onClick={() => setEditingStep(step)}
                      className="font-sans font-semibold text-[#6252E8] dark:text-[#B894FF] px-2 py-1"
                    >
                      Configure Step
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-5 space-y-2">
              <div className="font-mono text-xs text-[#B894FF] mb-3">
                DAG Overview · {activeWorkflow.name}
              </div>
              {activeWorkflow.steps.map((step, i) => (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => setEditingStep(step)}
                    className="w-full text-left rounded-xl border border-white/15 bg-[#101014] p-3.5 hover:border-[#965BFF]"
                  >
                    <div className="font-mono text-[11px] text-[#965BFF]">
                      0{i + 1} · {step.kind}
                    </div>
                    <div className="text-sm font-semibold">{step.title}</div>
                  </button>
                  {i < activeWorkflow.steps.length - 1 && (
                    <div className="h-4 flex justify-center" aria-hidden="true">
                      <div className="w-px h-full bg-[#6252E8]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setAddStepOpen(true)}
              className="min-h-[44px] px-3 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs font-semibold text-[#101014] dark:text-white inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
              <span>Add Step</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onTestRunTarget(
                  activeWorkflow.name,
                  'Workflow',
                  `Dry-run trigger (${activeWorkflow.trigger}): ${activeWorkflow.triggerSpec}`
                )
              }
              className="min-h-[44px] px-3 rounded-xl border border-[#6252E8]/40 bg-white dark:bg-[#101126] text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] inline-flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Test Flow</span>
            </button>
            <button
              type="button"
              onClick={() => bumpWorkflowVersion(false)}
              className="min-h-[44px] px-3 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs font-semibold text-[#101014] dark:text-white"
            >
              Save Version
            </button>
            <button
              type="button"
              onClick={() => bumpWorkflowVersion(true)}
              className="min-h-[44px] px-3 rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold"
            >
              Publish Flow
            </button>
          </div>
        </div>
      )}

      {/* Model Selector Bottom Sheet */}
      <BottomSheet
        open={modelSheetOpen}
        onClose={() => setModelSheetOpen(false)}
        title="Select Model Route Profile"
        subtitle="SOPIN Gateway abstracts providers behind policy-enforced profiles."
      >
        <div className="space-y-3">
          <input
            type="search"
            inputMode="search"
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            placeholder="Search route profiles..."
            aria-label="Search model profiles"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
          />
          <div className="space-y-2">
            {filteredModels.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setAgentDraft({ ...agentDraft, modelRoute: m.id });
                  setModelSheetOpen(false);
                }}
                className={`w-full min-h-[52px] text-left rounded-xl border p-3.5 ${
                  agentDraft.modelRoute === m.id
                    ? 'border-[#6252E8] bg-[#6252E8]/10'
                    : 'border-[#101014]/10 dark:border-white/10'
                }`}
              >
                <div className="font-mono text-sm font-semibold">{m.label}</div>
                <div className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">{m.note}</div>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Publish Agent Confirmation Sheet */}
      <BottomSheet
        open={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        title="Publish Agent Blueprint?"
        subtitle="Publishes this configuration to your local workspace prototype registry."
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10 p-3.5 text-xs space-y-1">
            <div><strong>Agent:</strong> {agentDraft.name}</div>
            <div><strong>Model Route:</strong> {agentDraft.modelRoute}</div>
            <div><strong>Permissions:</strong> {agentDraft.permissionMode}</div>
            <div><strong>Bound Tools:</strong> {agentDraft.tools.join(', ') || 'None'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPublishConfirmOpen(false)}
              className="min-h-[44px] rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => commitAgent('Published')}
              className="min-h-[44px] rounded-lg bg-[#6252E8] text-white text-sm font-semibold"
            >
              Confirm Publish
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Trigger Picker Bottom Sheet */}
      <BottomSheet
        open={triggerSheetOpen}
        onClose={() => setTriggerSheetOpen(false)}
        title="Select Workflow Trigger"
      >
        <div className="space-y-2">
          {(
            [
              { t: 'Webhook', spec: 'POST /hooks/ops-queue-intake' },
              { t: 'Schedule', spec: 'Cron · Daily 08:00 UTC' },
              { t: 'Document Upload', spec: 'SOPIN Context Ingestion Event' },
              { t: 'Manual', spec: 'On-Demand Operator Dispatch' },
            ] as const
          ).map((item) => (
            <button
              key={item.t}
              type="button"
              onClick={() => {
                const next = { ...activeWorkflow, trigger: item.t, triggerSpec: item.spec };
                setActiveWorkflow(next);
                onSaveWorkflow(next);
                setTriggerSheetOpen(false);
              }}
              className={`w-full min-h-[52px] text-left rounded-xl border p-3.5 ${
                activeWorkflow.trigger === item.t
                  ? 'border-[#6252E8] bg-[#6252E8]/10'
                  : 'border-[#101014]/10 dark:border-white/10'
              }`}
            >
              <div className="text-sm font-semibold">{item.t}</div>
              <div className="font-mono text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                {item.spec}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Add Step Bottom Sheet */}
      <BottomSheet
        open={addStepOpen}
        onClose={() => setAddStepOpen(false)}
        title="Add Workflow Step"
      >
        <div className="space-y-3.5">
          <div>
            <label htmlFor="wf-step-kind" className="block text-xs font-semibold mb-1.5">
              Step Type
            </label>
            <div id="wf-step-kind" className="grid grid-cols-2 gap-2">
              {(['action', 'condition', 'integration', 'approval'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNewStepKind(k)}
                  className={`min-h-[44px] rounded-lg border text-xs font-semibold capitalize ${
                    newStepKind === k
                      ? 'border-[#6252E8] bg-[#6252E8] text-white'
                      : 'border-[#101014]/15 dark:border-white/15'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="wf-step-title" className="block text-xs font-semibold mb-1">
              Step Name
            </label>
            <input
              id="wf-step-title"
              type="text"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="e.g., Verify Compliance Citations"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="wf-step-detail" className="block text-xs font-semibold mb-1">
              Behavior / Retry Policy Note
            </label>
            <textarea
              id="wf-step-detail"
              rows={2}
              value={newStepDetail}
              onChange={(e) => setNewStepDetail(e.target.value)}
              placeholder="Describe schema check or integration action..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            disabled={!newStepTitle.trim()}
            className="w-full min-h-[48px] rounded-lg bg-[#6252E8] disabled:opacity-40 text-white text-sm font-semibold"
          >
            Insert Step
          </button>
        </div>
      </BottomSheet>

      {/* Edit Step Bottom Sheet */}
      <BottomSheet
        open={Boolean(editingStep)}
        onClose={() => setEditingStep(null)}
        title={editingStep ? `Configure: ${editingStep.title}` : 'Step Settings'}
      >
        {editingStep && (
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-step-detail" className="block text-xs font-semibold mb-1">
                Step Detail
              </label>
              <textarea
                id="edit-step-detail"
                rows={3}
                value={editingStep.detail}
                onChange={(e) => setEditingStep({ ...editingStep, detail: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-step-retry" className="block text-xs font-semibold mb-1">
                  Max Retries
                </label>
                <input
                  id="edit-step-retry"
                  type="number"
                  min={0}
                  max={5}
                  value={editingStep.retryMax}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, retryMax: Number(e.target.value) })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-step-timeout" className="block text-xs font-semibold mb-1">
                  Timeout (sec)
                </label>
                <input
                  id="edit-step-timeout"
                  type="number"
                  min={5}
                  max={3600}
                  value={editingStep.timeoutSec}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, timeoutSec: Number(e.target.value) })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const next = {
                    ...activeWorkflow,
                    steps: activeWorkflow.steps.filter((s) => s.id !== editingStep.id),
                  };
                  setActiveWorkflow(next);
                  onSaveWorkflow(next);
                  setEditingStep(null);
                }}
                className="min-h-[44px] px-3.5 rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold"
              >
                Delete Step
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = {
                    ...activeWorkflow,
                    steps: activeWorkflow.steps.map((s) =>
                      s.id === editingStep.id ? editingStep : s
                    ),
                  };
                  setActiveWorkflow(next);
                  onSaveWorkflow(next);
                  setEditingStep(null);
                }}
                className="min-h-[44px] px-5 rounded-lg bg-[#6252E8] text-white text-xs font-semibold"
              >
                Save Step
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
