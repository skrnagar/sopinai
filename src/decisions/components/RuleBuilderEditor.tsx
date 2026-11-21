import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AiRuleDraftSynthesis,
  ConditionOperator,
  DecisionApprovalPurpose,
  DecisionConditionNode,
  DecisionEnvironment,
  DecisionExecutionSpec,
  DecisionFieldType,
  DecisionGroupNode,
  DecisionInputField,
  DecisionSettings,
  RuleSpec,
} from '../types';
import {
  applyGovernedDecisionOperationToSlice,
  canonicalSerialize,
  checkEditPermission,
  checkTestEvidenceFreshness,
  evaluateRuleSpec,
  extractVersionableSpecBody,
  GovernedDecisionRequest,
  performGovernedApprove,
  performGovernedPublish,
  performGovernedSave,
  performGovernedSubmitReview,
  synthesizeRuleDraftFromNL,
  validateRuleArtifact,
} from '../evaluator';
import { DecisionGovernanceStatusCard, GovernedPublishSheet } from './DecisionGovernancePanel';
import { StatusText } from '../../components/ui/EditorialPrimitives';
import { HighlightedCode } from '../../components/ui/HighlightedCode';

interface RuleBuilderEditorProps {
  workspaceId: string;
  workspaceRole?: string;
  rules: RuleSpec[];
  selectedRuleId?: string;
  requireTestPassBeforePublish: boolean;
  settings?: DecisionSettings;
  aiDrawerDefaultOpen?: boolean;
  onSaveRule: (rule: RuleSpec, summaryNote?: string) => void;
  onGovernedAction?: (
    req: GovernedDecisionRequest
  ) => ReturnType<typeof applyGovernedDecisionOperationToSlice>;
  onRecordExecution: (exec: DecisionExecutionSpec) => void;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: '==', label: 'equals (==)' },
  { value: '!=', label: 'not equals (!=)' },
  { value: '>', label: 'greater than (>)' },
  { value: '>=', label: 'greater or equal (>=)' },
  { value: '<', label: 'less than (<)' },
  { value: '<=', label: 'less or equal (<=)' },
  { value: 'between', label: 'between' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'in', label: 'in list [a, b]' },
  { value: 'not_in', label: 'not in list' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'exists', label: 'exists' },
  { value: 'not_exists', label: 'does not exist' },
  { value: 'matches_formula', label: 'formula / expression' },
];

function createEmptyRule(workspaceId: string): RuleSpec {
  return {
    id: `rule-${Date.now()}`,
    workspaceId,
    name: 'New Business Policy Rule',
    description: 'Deterministic IF / ELSE business decision rule.',
    isDemoData: false,
    tags: ['custom-rule'],
    inputSchema: [
      {
        name: 'amount',
        type: 'number',
        required: true,
        description: 'Transaction or request numeric value',
        sampleDefault: 25000,
      },
      {
        name: 'verified',
        type: 'boolean',
        required: true,
        description: 'Verification status boolean',
        sampleDefault: true,
      },
    ],
    conditionRoot: {
      kind: 'group',
      id: `grp-${Date.now()}`,
      logic: 'AND',
      children: [
        {
          kind: 'predicate',
          id: `pred-${Date.now()}-1`,
          field: 'amount',
          operator: '<',
          value: '50000',
        },
        {
          kind: 'predicate',
          id: `pred-${Date.now()}-2`,
          field: 'verified',
          operator: '==',
          value: 'true',
        },
      ],
    },
    thenOutputs: [
      { key: 'decision', valueExpression: 'approved', type: 'string' },
      { key: 'requiresHumanGate', valueExpression: 'false', type: 'boolean' },
    ],
    elseOutputs: [
      { key: 'decision', valueExpression: 'manual_review', type: 'string' },
      { key: 'requiresHumanGate', valueExpression: 'true', type: 'boolean' },
    ],
    priority: 10,
    executionConfig: {
      stopOnMatch: true,
      strictInputValidation: true,
      expressionMode: 'restricted-safe-evaluator',
    },
    version: 'v0.1',
    environment: 'development',
    status: 'Draft',
    testCases: [],
    versionHistory: [],
    updatedAt: 'Just now',
  };
}

function summarizeGroup(group: DecisionGroupNode): string {
  const parts = group.children.map((child) => {
    if (child.kind === 'group') return `(${summarizeGroup(child)})`;
    if (child.operator === 'is_empty') return `${child.field} is empty`;
    if (child.operator === 'between') return `${child.field} between ${child.value} and ${child.valueEnd ?? ''}`;
    if (child.operator === 'matches_formula') return `formula(${child.expression || child.value})`;
    return `${child.field} ${child.operator} ${child.value}`;
  });
  return parts.join(` ${group.logic} `) || 'Always True';
}

export const RuleBuilderEditor: React.FC<RuleBuilderEditorProps> = ({
  workspaceId,
  workspaceRole = 'Workspace Maintainer',
  rules,
  selectedRuleId,
  requireTestPassBeforePublish,
  settings,
  aiDrawerDefaultOpen = false,
  onSaveRule,
  onGovernedAction,
  onRecordExecution,
}) => {
  const effectiveSettings: DecisionSettings = settings ?? {
    requireTestPassBeforePublish,
    requireControlApprovalForProd: true,
    strictInputSchemaValidation: true,
    restrictExpressionsToSafeSubset: true,
    allowedEditorsRole: 'Builders & Maintainers',
    allowedPublishersRole: 'Workspace Maintainer',
  };

  const [draft, setDraft] = useState<RuleSpec>(() => {
    const found = rules.find((r) => r.id === selectedRuleId) ?? rules[0];
    return found ? structuredClone(found) : createEmptyRule(workspaceId);
  });

  useEffect(() => {
    if (!selectedRuleId) return;
    const found = rules.find((r) => r.id === selectedRuleId);
    if (found) setDraft(structuredClone(found));
  }, [selectedRuleId, rules]);

  const [sampleInputText, setSampleInputText] = useState<string>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of draft.inputSchema) {
      initial[f.name] = f.sampleDefault ?? (f.type === 'number' ? 0 : f.type === 'boolean' ? false : '');
    }
    return JSON.stringify(initial, null, 2);
  });

  // Update sample JSON whenever switching selected rule
  const selectExistingRule = (r: RuleSpec) => {
    setDraft(structuredClone(r));
    const init: Record<string, unknown> = {};
    for (const f of r.inputSchema) {
      init[f.name] = f.sampleDefault ?? (f.type === 'number' ? 0 : f.type === 'boolean' ? false : '');
    }
    setSampleInputText(JSON.stringify(init, null, 2));
    setTestResult(null);
    setParseError('');
  };

  const [testResult, setTestResult] = useState<DecisionExecutionSpec | null>(null);
  const [parseError, setParseError] = useState('');
  const [notice, setNotice] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishEnv, setPublishEnv] = useState<DecisionEnvironment>('production');
  const [publishSummary, setPublishSummary] = useState('Verified deterministic policy thresholds and fallback lane.');

  // SOPIN Studio AI-Assisted Draft Synthesizer
  const [aiOpen, setAiOpen] = useState(aiDrawerDefaultOpen);
  const [aiPrompt, setAiPrompt] = useState(
    'Approve an invoice automatically when the amount is below ₹50,000, the vendor is verified, and no duplicate invoice exists. Otherwise, send it for manual approval.'
  );
  const [aiSynthesis, setAiSynthesis] = useState<AiRuleDraftSynthesis | null>(null);

  const editPermission = useMemo(
    () => checkEditPermission(workspaceRole, effectiveSettings),
    [workspaceRole, effectiveSettings]
  );

  const liveValidation = useMemo(
    () => validateRuleArtifact(draft, 'publication'),
    [draft]
  );

  const testEvidence = useMemo(
    () => checkTestEvidenceFreshness('rule', draft),
    [draft]
  );

  const isDirty = useMemo(() => {
    const saved = rules.find((r) => r.id === draft.id);
    if (!saved) return true;
    return (
      canonicalSerialize(extractVersionableSpecBody('rule', draft)) !==
        canonicalSerialize(extractVersionableSpecBody('rule', saved)) ||
      draft.name !== saved.name ||
      draft.description !== saved.description
    );
  }, [draft, rules]);

  const updateGroupRecursive = (
    node: DecisionGroupNode,
    targetId: string,
    updater: (g: DecisionGroupNode) => DecisionGroupNode
  ): DecisionGroupNode => {
    if (node.id === targetId) return updater(node);
    return {
      ...node,
      children: node.children.map((ch) =>
        ch.kind === 'group' ? updateGroupRecursive(ch, targetId, updater) : ch
      ),
    };
  };

  const handleAddPredicate = (groupId: string) => {
    const firstField = draft.inputSchema[0]?.name || 'amount';
    setDraft((prev) => ({
      ...prev,
      conditionRoot: updateGroupRecursive(prev.conditionRoot, groupId, (g) => ({
        ...g,
        children: [
          ...g.children,
          {
            kind: 'predicate',
            id: `pred-${Date.now()}-${Math.floor(Math.random() * 99)}`,
            field: firstField,
            operator: '==',
            value: 'true',
          },
        ],
      })),
    }));
  };

  const handleAddNestedGroup = (groupId: string) => {
    const firstField = draft.inputSchema[0]?.name || 'amount';
    setDraft((prev) => ({
      ...prev,
      conditionRoot: updateGroupRecursive(prev.conditionRoot, groupId, (g) => ({
        ...g,
        children: [
          ...g.children,
          {
            kind: 'group',
            id: `grp-${Date.now()}`,
            logic: g.logic === 'AND' ? 'OR' : 'AND',
            children: [
              {
                kind: 'predicate',
                id: `pred-${Date.now()}`,
                field: firstField,
                operator: '!=',
                value: '',
              },
            ],
          },
        ],
      })),
    }));
  };

  const handleRemoveChild = (parentGroupId: string, childId: string) => {
    setDraft((prev) => ({
      ...prev,
      conditionRoot: updateGroupRecursive(prev.conditionRoot, parentGroupId, (g) => ({
        ...g,
        children: g.children.filter((c) => c.id !== childId),
      })),
    }));
  };

  const handleUpdateChild = (
    parentGroupId: string,
    childId: string,
    nextChild: DecisionConditionNode
  ) => {
    setDraft((prev) => ({
      ...prev,
      conditionRoot: updateGroupRecursive(prev.conditionRoot, parentGroupId, (g) => ({
        ...g,
        children: g.children.map((c) => (c.id === childId ? nextChild : c)),
      })),
    }));
  };

  const handleRunTest = () => {
    setParseError('');
    try {
      const parsed = JSON.parse(sampleInputText) as Record<string, unknown>;
      const exec = evaluateRuleSpec(draft, parsed, 'Simulator');
      setTestResult(exec);
      onRecordExecution(exec);
    } catch {
      setParseError('Invalid JSON payload in test input.');
    }
  };

  const handleRecordApproval = (params: {
    targetEnvironment: DecisionEnvironment;
    purpose: DecisionApprovalPurpose;
    decision: 'approved' | 'rejected';
    note: string;
  }) => {
    if (onGovernedAction) {
      const res = onGovernedAction({
        operation: 'approve',
        artifactType: 'rule',
        artifactId: draft.id,
        targetEnvironment: params.targetEnvironment,
        purpose: params.purpose,
        decision: params.decision,
        note: params.note,
        specOverride: draft,
      });
      if (!res.allowed || !res.updatedSpec) {
        setNotice(`Approval blocked: ${res.reasons.join(' ')}`);
        return;
      }
      const next = res.updatedSpec as RuleSpec;
      setDraft(next);
      setNotice(
        `Recorded bound ${params.purpose} (${params.decision}) for ${next.version} (${params.targetEnvironment}).`
      );
      return;
    }

    const res = performGovernedApprove({
      type: 'rule',
      spec: draft,
      targetEnvironment: params.targetEnvironment,
      purpose: params.purpose,
      decision: params.decision,
      workspaceRole,
      settings: effectiveSettings,
      note: params.note,
    });
    if (!res.allowed || !res.updatedSpec) {
      setNotice(`Approval blocked: ${res.reasons.join(' ')}`);
      return;
    }
    setDraft(res.updatedSpec);
    onSaveRule(res.updatedSpec, res.auditEvent.action);
    setNotice(res.auditEvent.action);
  };

  const handleSaveDraft = (targetStatus: 'Draft' | 'Validated' | 'Review' = 'Draft') => {
    if (onGovernedAction) {
      const res =
        targetStatus === 'Review'
          ? onGovernedAction({
              operation: 'submit-review',
              artifactType: 'rule',
              spec: draft,
            })
          : onGovernedAction({
              operation: 'save',
              artifactType: 'rule',
              spec: draft,
              targetStatus: targetStatus === 'Validated' ? 'Validated' : 'Draft',
            });
      if (!res.allowed || !res.updatedSpec) {
        setNotice(`${targetStatus === 'Review' ? 'Submit review' : 'Save'} blocked: ${res.reasons.join(' ')}`);
        return;
      }
      const next = res.updatedSpec as RuleSpec;
      setDraft(next);
      setNotice(
        `Rule saved as ${next.status} (${next.version}) locally; published snapshots remain immutable.`
      );
      return;
    }

    const res =
      targetStatus === 'Review'
        ? performGovernedSubmitReview({
            type: 'rule',
            spec: draft,
            workspaceRole,
            settings: effectiveSettings,
          })
        : performGovernedSave({
            type: 'rule',
            spec: draft,
            workspaceRole,
            settings: effectiveSettings,
            targetStatus: targetStatus === 'Validated' ? 'Validated' : 'Draft',
          });
    if (!res.allowed || !res.updatedSpec) {
      setNotice(`Save blocked: ${res.reasons.join(' ')}`);
      return;
    }
    setDraft(res.updatedSpec);
    onSaveRule(res.updatedSpec, res.auditEvent.action);
    setNotice(
      `Rule saved as ${res.updatedSpec.status} (${res.updatedSpec.version}) locally; published snapshots remain immutable.`
    );
  };

  const handlePublishConfirm = () => {
    const summary = publishSummary.trim() || 'Published from SOPIN Rule Builder.';
    if (onGovernedAction) {
      const res = onGovernedAction({
        operation: 'publish',
        artifactType: 'rule',
        spec: draft,
        targetEnvironment: publishEnv,
        summary,
      });
      if (!res.allowed || !res.updatedSpec) {
        setNotice(`Publish blocked: ${res.reasons.join(' ')}`);
        return;
      }
      const next = res.updatedSpec as RuleSpec;
      setDraft(next);
      setPublishOpen(false);
      setNotice(`Published immutable version ${next.version} (${publishEnv}) cleanly.`);
      return;
    }

    const res = performGovernedPublish({
      type: 'rule',
      spec: draft,
      targetEnvironment: publishEnv,
      workspaceRole,
      settings: effectiveSettings,
      summary,
    });
    if (!res.allowed || !res.updatedSpec) {
      setNotice(`Publish blocked: ${res.reasons.join(' ')}`);
      return;
    }
    setDraft(res.updatedSpec);
    onSaveRule(res.updatedSpec, res.auditEvent.action);
    setPublishOpen(false);
    setNotice(`Published immutable version ${res.updatedSpec.version} (${publishEnv}) cleanly.`);
  };

  const renderConditionGroup = (group: DecisionGroupNode, depth = 0, parentId?: string) => {
    const fieldNames = draft.inputSchema.map((f) => f.name);
    const groupError = liveValidation.errors.find((e) => e.nodeId === group.id);
    return (
      <div
        key={group.id}
        className={`rounded-xl border p-3 space-y-2.5 ${
          groupError
            ? 'border-red-500/60 bg-red-500/[0.04]'
            : depth === 0
            ? 'border-[#2563EB]/35 bg-[#F7F7FA] dark:bg-[#05070E]'
            : 'border-[#60A5FA]/40 bg-white dark:bg-[#0A1226]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
              {depth === 0 ? 'IF ALL / ANY' : 'NESTED GROUP'}
            </span>
            <div className="inline-flex rounded-lg border border-[#05070E]/15 dark:border-white/15 overflow-hidden">
              {(['AND', 'OR'] as const).map((logic) => (
                <button
                  key={logic}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      conditionRoot: updateGroupRecursive(prev.conditionRoot, group.id, (g) => ({
                        ...g,
                        logic,
                      })),
                    }))
                  }
                  className={`min-h-[34px] px-3 text-[11px] font-mono font-semibold ${
                    group.logic === logic
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#A4A4B5]'
                  }`}
                >
                  {logic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddPredicate(group.id)}
              className="min-h-[36px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-[11px] font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Condition</span>
            </button>
            {depth < 2 && (
              <button
                type="button"
                onClick={() => handleAddNestedGroup(group.id)}
                className="min-h-[36px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
                <span>Group</span>
              </button>
            )}
            {depth > 0 && parentId && (
              <button
                type="button"
                onClick={() => handleRemoveChild(parentId, group.id)}
                aria-label="Remove nested condition group"
                className="w-9 h-9 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 inline-flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {groupError && (
          <div className="text-[11px] font-mono text-red-600 dark:text-red-400">
            • {groupError.message}
          </div>
        )}

        <div className="space-y-2">
          {group.children.map((child) => {
            if (child.kind === 'group') {
              return renderConditionGroup(child, depth + 1, group.id);
            }
            const nodeError = liveValidation.errors.find((e) => e.nodeId === child.id);
            return (
              <div
                key={child.id}
                className={`rounded-xl border p-2.5 space-y-1.5 ${
                  nodeError
                    ? 'border-red-500/60 bg-red-500/[0.04]'
                    : 'border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226]'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <select
                    aria-label="Condition field"
                    value={child.field}
                    onChange={(e) =>
                      handleUpdateChild(group.id, child.id, { ...child, field: e.target.value })
                    }
                    className="w-full min-h-[42px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs font-mono text-[#05070E] dark:text-white"
                  >
                    {fieldNames.map((fn) => (
                      <option key={fn} value={fn}>
                        {fn}
                      </option>
                    ))}
                    {!fieldNames.includes(child.field) && (
                      <option value={child.field}>{child.field}</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    aria-label="Condition operator"
                    value={child.operator}
                    onChange={(e) =>
                      handleUpdateChild(group.id, child.id, {
                        ...child,
                        operator: e.target.value as ConditionOperator,
                      })
                    }
                    className="w-full min-h-[42px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs text-[#05070E] dark:text-white"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={child.operator === 'between' ? 'sm:col-span-2' : 'sm:col-span-4'}>
                    <input
                    type="text"
                    aria-label="Condition comparison value"
                    disabled={
                      child.operator === 'is_empty' ||
                      child.operator === 'is_not_empty' ||
                      child.operator === 'exists' ||
                      child.operator === 'not_exists'
                    }
                    value={
                      child.operator === 'matches_formula'
                        ? child.expression ?? child.value
                        : child.value
                    }
                    onChange={(e) =>
                      handleUpdateChild(
                        group.id,
                        child.id,
                        child.operator === 'matches_formula'
                          ? { ...child, expression: e.target.value, value: e.target.value }
                          : { ...child, value: e.target.value }
                      )
                    }
                    placeholder={child.operator === 'matches_formula' ? 'amount < 50000' : 'Value'}
                    className="w-full min-h-[42px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs font-mono text-[#05070E] dark:text-white disabled:opacity-40"
                  />
                </div>

                {child.operator === 'between' && (
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      aria-label="Upper bound value"
                      value={child.valueEnd ?? ''}
                      onChange={(e) =>
                        handleUpdateChild(group.id, child.id, {
                          ...child,
                          valueEnd: e.target.value,
                        })
                      }
                      placeholder="Upper"
                      className="w-full min-h-[42px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs font-mono text-[#05070E] dark:text-white"
                    />
                  </div>
                )}

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveChild(group.id, child.id)}
                    aria-label={`Remove condition on ${child.field}`}
                    className="w-10 h-10 rounded-lg border border-[#05070E]/10 dark:border-white/15 text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                </div>
                {nodeError && (
                  <div className="text-[11px] font-mono text-red-600 dark:text-red-400">
                    • {nodeError.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Selector + New + AI Assistant Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex overflow-x-auto no-scrollbar gap-2 flex-1 min-w-0">
          {rules.map((r) => {
            const active = r.id === draft.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => selectExistingRule(r)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 transition-colors ${
                  active
                    ? 'border-[#2563EB] bg-[#2563EB]/10 dark:bg-[#2563EB]/25'
                    : 'border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226]'
                }`}
              >
                <div className="text-xs font-semibold text-[#05070E] dark:text-white truncate max-w-[180px]">
                  {r.name}
                </div>
                <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                  {r.version} · {r.status}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAiOpen((prev) => !prev)}
            className="min-h-[44px] px-3.5 rounded-xl border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#2563EB] dark:text-[#7EC8FF] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>AI Draft</span>
          </button>
          <button
            type="button"
            onClick={() => selectExistingRule(createEmptyRule(workspaceId))}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#05070E] dark:bg-white text-white dark:text-[#05070E] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-[#2563EB]/35 bg-[#2563EB]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-medium text-[#05070E] dark:text-white"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice('')} className="text-xs font-semibold text-[#2563EB]">
            Dismiss
          </button>
        </div>
      )}

      {/* SOPIN Studio AI-Assisted Decision Creation Panel */}
      {aiOpen && (
        <div className="rounded-2xl border border-[#60A5FA]/40 bg-[#0A1226] text-white p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7EC8FF]">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>SOPIN Studio · AI-Assisted Rule Draft Synthesizer</span>
            </div>
            <span className="font-mono text-[11px] text-[#A4A4B5]">
              Draft Only · Deterministic Evaluator Authority
            </span>
          </div>

          <textarea
            rows={2}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            aria-label="Describe business rule in plain language"
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#05070E] text-sm text-white"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiSynthesis(synthesizeRuleDraftFromNL(aiPrompt, workspaceId))}
              disabled={!aiPrompt.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Generate Structured Rule Draft</span>
            </button>
            <button
              type="button"
              onClick={() => setAiOpen(false)}
              className="min-h-[44px] px-3 rounded-xl border border-white/15 text-xs font-semibold text-[#C5C5D6]"
            >
              Close
            </button>
          </div>

          {aiSynthesis && (
            <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4 space-y-3 text-xs">
              <div className="font-semibold text-white">
                Generated Logic Explanation &amp; Missing Requirements Review
              </div>
              <ul className="space-y-1 text-[#D8D8E6]">
                {aiSynthesis.explanation.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#60A5FA] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 space-y-1 text-amber-100">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Ambiguities &amp; Human Verification Notes</span>
                </div>
                {aiSynthesis.missingRequirements.map((req) => (
                  <div key={req} className="text-[11px] leading-relaxed">
                    • {req}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  selectExistingRule(aiSynthesis.ruleDraft);
                  setAiOpen(false);
                  setNotice('Loaded Studio AI draft into Rule Builder. Review conditions & test before publishing.');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-white text-[#05070E] text-xs font-semibold"
              >
                Accept Draft Into Rule Builder ({aiSynthesis.generatedTestCases.length} Test Cases Included)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Rule Spec Configuration */}
        <div className="lg:col-span-8 space-y-4">
          {/* Validation & Lifecycle Banner */}
          {(!editPermission.allowed ||
            liveValidation.errors.length > 0 ||
            liveValidation.warnings.length > 0 ||
            isDirty) && (
            <div
              className={`rounded-2xl border p-3.5 text-xs space-y-1.5 ${
                !editPermission.allowed || liveValidation.errors.length > 0
                  ? 'border-red-500/40 bg-red-500/[0.06] text-red-800 dark:text-red-200'
                  : 'border-amber-500/35 bg-amber-500/[0.08] text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  {!editPermission.allowed ? (
                    <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {!editPermission.allowed
                      ? 'Read-Only Governance Policy'
                      : liveValidation.errors.length > 0
                      ? `${liveValidation.errors.length} Spec Validation Error(s) Block Publish`
                      : `${liveValidation.warnings.length} Spec Warning(s)`}
                  </span>
                </span>
                {isDirty && (
                  <span className="font-mono text-[11px] uppercase">Unsaved Draft Edits</span>
                )}
              </div>
              {!editPermission.allowed && (
                <div className="font-mono text-[11px]">• {editPermission.reasons[0]}</div>
              )}
              {liveValidation.errors.slice(0, 4).map((err, i) => (
                <div key={`err-${i}`} className="font-mono text-[11px]">
                  • {err.message}
                </div>
              ))}
              {liveValidation.warnings.slice(0, 2).map((w, i) => (
                <div key={`warn-${i}`} className="font-mono text-[11px] opacity-90">
                  • Warning: {w.message}
                </div>
              ))}
            </div>
          )}

          {/* Identity & Input Schema */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusText
                items={[
                  draft.version,
                  draft.status,
                  draft.environment,
                  isDirty ? 'Unsaved Edits' : 'Synced',
                ]}
                accentLast
              />
              <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
                Priority {draft.priority} ·{' '}
                {testEvidence.allPassed && testEvidence.allCurrentForSpec
                  ? 'Tests Current'
                  : testEvidence.staleCaseCount > 0
                  ? 'Tests Stale'
                  : 'Tests Pending'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label htmlFor="rule-name-input" className="block text-xs font-semibold mb-1">
                  Rule Name
                </label>
                <input
                  id="rule-name-input"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="rule-priority-input" className="block text-xs font-semibold mb-1">
                  Priority Order
                </label>
                <input
                  id="rule-priority-input"
                  type="number"
                  min={1}
                  max={999}
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 1 })}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rule-desc-input" className="block text-xs font-semibold mb-1">
                Business Policy Description
              </label>
              <textarea
                id="rule-desc-input"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs sm:text-sm"
              />
            </div>

            {/* Input Schema Fields */}
            <div className="pt-2 border-t border-[#05070E]/10 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Input Schema Contract</span>
                <button
                  type="button"
                  onClick={() => {
                    const newField: DecisionInputField = {
                      name: `field_${draft.inputSchema.length + 1}`,
                      type: 'string',
                      required: false,
                      description: 'Custom input variable',
                      sampleDefault: '',
                    };
                    setDraft({ ...draft, inputSchema: [...draft.inputSchema, newField] });
                  }}
                  className="min-h-[36px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                  <span>Add Input Field</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {draft.inputSchema.map((field, idx) => (
                  <div
                    key={`${field.name}-${idx}`}
                    className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-2.5 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      aria-label={`Input field ${idx + 1} name`}
                      value={field.name}
                      onChange={(e) => {
                        const updated = [...draft.inputSchema];
                        updated[idx] = { ...field, name: e.target.value };
                        setDraft({ ...draft, inputSchema: updated });
                      }}
                      className="min-w-0 flex-1 min-h-[38px] px-2 rounded border border-[#05070E]/10 dark:border-white/15 bg-white dark:bg-[#0A1226] font-mono text-xs"
                    />
                    <select
                      aria-label={`Input field ${field.name} type`}
                      value={field.type}
                      onChange={(e) => {
                        const updated = [...draft.inputSchema];
                        updated[idx] = { ...field, type: e.target.value as DecisionFieldType };
                        setDraft({ ...draft, inputSchema: updated });
                      }}
                      className="min-h-[38px] px-2 rounded border border-[#05070E]/10 dark:border-white/15 bg-white dark:bg-[#0A1226] text-xs"
                    >
                      {(['number', 'string', 'boolean', 'date', 'null', 'array', 'object'] as const).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          inputSchema: draft.inputSchema.filter((_, i) => i !== idx),
                        })
                      }
                      aria-label={`Remove input ${field.name}`}
                      className="w-9 h-9 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Visual Condition Group Tree */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold">Condition Builder</h3>
              <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
                Deterministic Evaluator
              </span>
            </div>
            {renderConditionGroup(draft.conditionRoot, 0)}

            {/* Live Rule Summary */}
            <div className="rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/[0.06] dark:bg-[#2563EB]/15 p-3 text-xs">
              <span className="font-mono font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
                LIVE RULE SUMMARY:{' '}
              </span>
              <span className="font-mono text-[#05070E] dark:text-white">
                IF ({summarizeGroup(draft.conditionRoot)}) THEN{' '}
                {draft.thenOutputs.map((o) => `${o.key}=${o.valueExpression}`).join(', ')} ELSE{' '}
                {draft.elseOutputs.map((o) => `${o.key}=${o.valueExpression}`).join(', ')}
              </span>
            </div>
          </section>

          {/* THEN / ELSE Action Outputs */}
          <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                { title: 'THEN Outputs (Condition Matched)', field: 'thenOutputs' as const },
                { title: 'ELSE Outputs (Fallback Path)', field: 'elseOutputs' as const },
              ] as const
            ).map((panel) => (
              <div key={panel.field} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{panel.title}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        [panel.field]: [
                          ...draft[panel.field],
                          { key: 'note', valueExpression: 'checked', type: 'string' },
                        ],
                      })
                    }
                    className="min-h-[34px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-[11px] font-semibold"
                  >
                    + Output
                  </button>
                </div>
                <div className="space-y-2">
                  {draft[panel.field].map((out, idx) => (
                    <div key={`${panel.field}-${idx}`} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        aria-label="Output key"
                        value={out.key}
                        onChange={(e) => {
                          const list = [...draft[panel.field]];
                          list[idx] = { ...out, key: e.target.value };
                          setDraft({ ...draft, [panel.field]: list });
                        }}
                        className="w-28 min-h-[40px] px-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] font-mono text-xs"
                      />
                      <select
                        aria-label="Output type"
                        value={out.type}
                        onChange={(e) => {
                          const list = [...draft[panel.field]];
                          list[idx] = {
                            ...out,
                            type: e.target.value as 'string' | 'number' | 'boolean' | 'expression',
                          };
                          setDraft({ ...draft, [panel.field]: list });
                        }}
                        className="min-h-[40px] px-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
                      >
                        <option value="string">str</option>
                        <option value="number">num</option>
                        <option value="boolean">bool</option>
                        <option value="expression">expr</option>
                      </select>
                      <input
                        type="text"
                        aria-label="Output value or expression"
                        value={out.valueExpression}
                        onChange={(e) => {
                          const list = [...draft[panel.field]];
                          list[idx] = { ...out, valueExpression: e.target.value };
                          setDraft({ ...draft, [panel.field]: list });
                        }}
                        className="flex-1 min-w-0 min-h-[40px] px-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            [panel.field]: draft[panel.field].filter((_, i) => i !== idx),
                          })
                        }
                        aria-label={`Remove output ${out.key}`}
                        className="w-9 h-9 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <DecisionGovernanceStatusCard
            artifactType="rule"
            spec={draft}
            workspaceRole={workspaceRole}
            settings={effectiveSettings}
            targetEnvironment={publishEnv}
            onRecordApproval={handleRecordApproval}
          />

          {/* Draft, Review & Publish Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <label className="inline-flex items-center gap-2 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              <input
                type="checkbox"
                checked={draft.executionConfig.caseSensitiveStrings ?? false}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    executionConfig: {
                      ...draft.executionConfig,
                      caseSensitiveStrings: e.target.checked,
                    },
                  })
                }
              />
              <span>Case-sensitive string comparisons</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveDraft('Draft')}
                className={`min-h-[44px] px-4 rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                  !editPermission.allowed ? 'opacity-60' : ''
                }`}
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveDraft('Review')}
                className={`min-h-[44px] px-4 rounded-xl border border-[#2563EB]/40 text-[#2563EB] dark:text-[#7EC8FF] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                  !editPermission.allowed || !liveValidation.isValid ? 'opacity-60' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Submit Review</span>
              </button>
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="min-h-[44px] px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Publish Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Deterministic Test & Explanation Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-[#05070E]/15 dark:border-white/15 bg-[#0A1226] text-white p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-sm font-semibold">Live Deterministic Test</span>
            <span className="font-mono text-[11px] text-[#7EC8FF]">{draft.version}</span>
          </div>

          <div>
            <label htmlFor="rule-test-json" className="block text-[11px] font-mono text-[#A4A4B5] mb-1">
              Sample Input JSON
            </label>
            <textarea
              id="rule-test-json"
              rows={7}
              value={sampleInputText}
              onChange={(e) => setSampleInputText(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/15 bg-[#05070E] font-mono text-xs text-white"
            />
          </div>

          {parseError && <p className="text-xs text-red-400">{parseError}</p>}

          <button
            type="button"
            onClick={handleRunTest}
            className="w-full min-h-[44px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Execute Rule</span>
          </button>

          {testResult && (
            <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono font-semibold ${
                    testResult.status === 'Error' ? 'text-red-400' : 'text-[#7EC8FF]'
                  }`}
                >
                  Status: {testResult.status}
                  {testResult.errorCode ? ` (${testResult.errorCode})` : ''}
                </span>
                <span className="font-mono text-[11px] text-[#A4A4B5]">
                  {testResult.durationMs} ms
                </span>
              </div>

              {testResult.validationErrors && testResult.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-2.5 space-y-1 text-[11px] text-red-200 font-mono">
                  {testResult.validationErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                {testResult.evaluatedConditions.map((tr) => (
                  <div
                    key={tr.nodeId}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-[11px] truncate">
                      {tr.label} {tr.expectedSpec}
                    </span>
                    <span
                      className={`font-mono text-[10px] shrink-0 ${
                        tr.passed ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tr.passed ? 'TRUE' : 'FALSE'} ({tr.actualValue})
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div className="font-mono text-[11px] text-[#A4A4B5] mb-1">Final Output</div>
                <pre className="p-2.5 rounded-lg bg-[#060B18] border border-white/10 font-mono text-[11px] overflow-x-auto">
                  <HighlightedCode
                    code={JSON.stringify(testResult.finalOutput, null, 2)}
                    language="json"
                    surface="dark"
                  />
                </pre>
              </div>
              <p className="text-[11px] text-[#C5C5D6] leading-relaxed">{testResult.explanation}</p>
            </div>
          )}
        </div>
      </div>

      <GovernedPublishSheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        artifactType="rule"
        titleLabel="Rule Version"
        spec={draft}
        workspaceRole={workspaceRole}
        settings={effectiveSettings}
        publishEnv={publishEnv}
        onChangePublishEnv={setPublishEnv}
        publishSummary={publishSummary}
        onChangePublishSummary={setPublishSummary}
        onRecordApproval={handleRecordApproval}
        onConfirmPublish={handlePublishConfirm}
      />
    </div>
  );
};
