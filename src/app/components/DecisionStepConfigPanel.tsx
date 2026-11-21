import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Play, Plus, Scale, Trash2 } from 'lucide-react';
import {
  DecisionBranchRule,
  DecisionErrorBehavior,
  DecisionTargetKind,
  KnowledgeDocument,
  VariableMappingEntry,
  VariableSourceKind,
  WorkflowDecisionNodeConfig,
  WorkflowStep,
} from '../types';
import { DecisionsWorkspaceSlice } from '../../decisions/types';
import {
  executeRuntimeDecision,
  getTargetInputSchema,
  resolveVariableBindings,
  validateDecisionNodeConfig,
} from '../../decisions/evaluator';

interface DecisionStepConfigPanelProps {
  decisionConfig: WorkflowDecisionNodeConfig;
  workflowSteps: WorkflowStep[];
  currentStepId: string;
  decisions: DecisionsWorkspaceSlice;
  documents: KnowledgeDocument[];
  sampleInputs?: { id: string; label: string; payload: Record<string, unknown> }[];
  onChange: (next: WorkflowDecisionNodeConfig) => void;
  onOpenDecisions?: () => void;
}

export const DecisionStepConfigPanel: React.FC<DecisionStepConfigPanelProps> = ({
  decisionConfig,
  workflowSteps,
  currentStepId,
  decisions,
  documents,
  sampleInputs,
  onChange,
  onOpenDecisions,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>(sampleInputs?.[0]?.id || '');
  const [previewTrace, setPreviewTrace] = useState<{
    provenance: { field: string; source: string; preview: string; checksum?: string }[];
    status: string;
    versionUsed: string;
    branchNote: string;
    outputJson: string;
    conditions: { label: string; passed: boolean; actual: string; expected: string }[];
    errors: string[];
  } | null>(null);

  const schemaFields = useMemo(
    () => getTargetInputSchema(decisionConfig.targetType, decisionConfig.targetId, decisions),
    [decisionConfig.targetType, decisionConfig.targetId, decisions]
  );

  const bindings: VariableMappingEntry[] = useMemo(() => {
    if (decisionConfig.inputBindings && decisionConfig.inputBindings.length > 0) {
      return decisionConfig.inputBindings;
    }
    return Object.entries(decisionConfig.inputMappings || {}).map(([targetField, sourceRef], idx) => ({
      id: `legacy-${idx}-${targetField}`,
      targetField,
      targetType: schemaFields.find((s) => s.name === targetField)?.type,
      required: schemaFields.find((s) => s.name === targetField)?.required,
      sourceKind: sourceRef.startsWith('context.')
        ? 'context'
        : sourceRef.startsWith('prev.')
        ? 'previous_node'
        : sourceRef.startsWith('static:')
        ? 'static'
        : 'workflow_input',
      sourceRef: sourceRef.startsWith('static:') ? sourceRef.slice('static:'.length) : sourceRef,
    }));
  }, [decisionConfig.inputBindings, decisionConfig.inputMappings, schemaFields]);

  const validation = useMemo(
    () =>
      validateDecisionNodeConfig(decisionConfig, decisions, workflowSteps, documents, {
        requirePublished: true,
        callerClearance: 'governance-authorized',
      }),
    [decisionConfig, decisions, workflowSteps, documents]
  );

  const syncLegacyMappings = (nextBindings: VariableMappingEntry[]): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const b of nextBindings) {
      if (!b.targetField.trim()) continue;
      if (b.sourceKind === 'static') out[b.targetField] = `static:${b.sourceRef}`;
      else if (b.sourceKind === 'context') out[b.targetField] = `context.${b.sourceRef}`;
      else if (b.sourceKind === 'previous_node') out[b.targetField] = `prev.${b.sourceRef}`;
      else out[b.targetField] = b.sourceRef.startsWith('payload.') ? b.sourceRef : `payload.${b.sourceRef}`;
    }
    return out;
  };

  const updateBindings = (nextBindings: VariableMappingEntry[]) => {
    onChange({
      ...decisionConfig,
      inputBindings: nextBindings,
      inputMappings: syncLegacyMappings(nextBindings),
    });
  };

  const handleTargetChange = (combined: string) => {
    const [tType, tId] = combined.split(':') as [DecisionTargetKind, string];
    const targetObj =
      tType === 'rule'
        ? decisions.rules.find((r) => r.id === tId)
        : tType === 'table'
        ? decisions.tables.find((t) => t.id === tId)
        : tType === 'ruleset'
        ? decisions.rulesets.find((rs) => rs.id === tId)
        : tType === 'chain'
        ? decisions.chains.find((c) => c.id === tId)
        : decisions.scorecards.find((sc) => sc.id === tId);
    if (!targetObj) return;

    const newSchema = getTargetInputSchema(tType, tId, decisions);
    const autoBindings: VariableMappingEntry[] = newSchema.map((f, idx) => ({
      id: `bind-${Date.now()}-${idx}`,
      targetField: f.name,
      targetType: f.type,
      required: f.required,
      sourceKind: 'workflow_input',
      sourceRef: f.name,
      defaultValue: f.sampleDefault !== undefined ? String(f.sampleDefault) : undefined,
    }));

    onChange({
      ...decisionConfig,
      targetType: tType,
      targetId: tId,
      targetName: targetObj.name,
      targetVersion: targetObj.version,
      inputBindings: autoBindings,
      inputMappings: syncLegacyMappings(autoBindings),
    });
  };

  const handleSyncSchemaFields = () => {
    const existingTargets = new Set(bindings.map((b) => b.targetField));
    const missing = schemaFields
      .filter((f) => !existingTargets.has(f.name))
      .map((f, idx) => ({
        id: `bind-${Date.now()}-${idx}`,
        targetField: f.name,
        targetType: f.type,
        required: f.required,
        sourceKind: 'workflow_input' as VariableSourceKind,
        sourceRef: f.name,
        defaultValue: f.sampleDefault !== undefined ? String(f.sampleDefault) : undefined,
      }));
    updateBindings([...bindings, ...missing]);
  };

  const handleAddBranch = () => {
    const fallbackTarget = workflowSteps.find((s) => s.id !== currentStepId)?.id || '';
    const nextBranches: DecisionBranchRule[] = [
      ...(decisionConfig.branches ?? []),
      {
        id: `br-${Date.now()}`,
        label: 'BRANCH_OUTCOME',
        matchField: 'decision',
        operator: '==',
        matchValue: 'approved',
        nextStepId: fallbackTarget,
      },
    ];
    onChange({
      ...decisionConfig,
      branches: nextBranches,
      branchOutcomes: nextBranches.map(
        (b) => `${b.label} -> ${workflowSteps.find((s) => s.id === b.nextStepId)?.title || b.nextStepId}`
      ),
    });
  };

  const handleUpdateBranch = (id: string, patch: Partial<DecisionBranchRule>) => {
    const nextBranches = (decisionConfig.branches ?? []).map((b) =>
      b.id === id ? { ...b, ...patch } : b
    );
    onChange({
      ...decisionConfig,
      branches: nextBranches,
      branchOutcomes: nextBranches.map(
        (b) => `${b.label} -> ${workflowSteps.find((s) => s.id === b.nextStepId)?.title || b.nextStepId}`
      ),
    });
  };

  const handleRemoveBranch = (id: string) => {
    const nextBranches = (decisionConfig.branches ?? []).filter((b) => b.id !== id);
    onChange({
      ...decisionConfig,
      branches: nextBranches,
      branchOutcomes: nextBranches.map(
        (b) => `${b.label} -> ${workflowSteps.find((s) => s.id === b.nextStepId)?.title || b.nextStepId}`
      ),
    });
  };

  const handleRunPreview = () => {
    const sampleObj =
      sampleInputs?.find((s) => s.id === selectedSampleId)?.payload ??
      Object.fromEntries(
        schemaFields.map((f) => [
          f.name,
          f.sampleDefault ?? (f.type === 'number' ? 32500 : f.type === 'boolean' ? true : 'low'),
        ])
      );

    const resolved = resolveVariableBindings(
      { ...decisionConfig, inputBindings: bindings },
      sampleObj,
      sampleObj,
      documents,
      'governance-authorized'
    );

    if (resolved.errors.length > 0) {
      setPreviewTrace({
        provenance: resolved.provenance.map((p) => ({
          field: p.targetField,
          source: p.sourceLabel,
          preview: p.resolvedValuePreview,
          checksum: p.docChecksum,
        })),
        status: 'Validation Error',
        versionUsed: decisionConfig.targetVersion,
        branchNote: 'Blocked prior to evaluation',
        outputJson: '{}',
        conditions: [],
        errors: resolved.errors,
      });
      return;
    }

    const res = executeRuntimeDecision(
      {
        workspaceId: decisions.rules[0]?.workspaceId || 'ws-core',
        targetType: decisionConfig.targetType,
        targetId: decisionConfig.targetId,
        targetVersion: decisionConfig.targetVersion,
        versionPolicy: decisionConfig.versionPolicy ?? 'pinned',
        requirePublished: true,
        inputPayload: resolved.resolvedInputs,
        sourceTrigger: 'SOPIN Flow',
        outputMappings: decisionConfig.outputMappings,
        branches: decisionConfig.branches,
        successNextStepId: decisionConfig.successNextStepId,
        noMatchNextStepId: decisionConfig.noMatchNextStepId,
        failureNextStepId: decisionConfig.failureNextStepId,
        onErrorBehavior: decisionConfig.onErrorBehavior ?? 'fail-workflow',
      },
      decisions
    );

    const targetStepTitle = workflowSteps.find((s) => s.id === res.nextStepId)?.title;
    setPreviewTrace({
      provenance: resolved.provenance.map((p) => ({
        field: p.targetField,
        source: p.sourceLabel,
        preview: p.resolvedValuePreview,
        checksum: p.docChecksum,
      })),
      status: res.execution.status,
      versionUsed: res.execution.versionUsed,
      branchNote: `${res.branchResolutionNote}${targetStepTitle ? ` -> "${targetStepTitle}"` : ''}`,
      outputJson: JSON.stringify(res.execution.finalOutput),
      conditions: res.execution.evaluatedConditions.map((c) => ({
        label: c.label,
        passed: c.passed,
        actual: c.actualValue,
        expected: c.expectedSpec,
      })),
      errors: res.execution.validationErrors ?? [],
    });
  };

  return (
    <div className="rounded-xl border border-[#6252E8]/30 bg-[#6252E8]/[0.05] dark:bg-[#6252E8]/15 p-3.5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF] flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>SOPIN DECISIONS NODE CONFIG</span>
        </span>
        {onOpenDecisions && (
          <button
            type="button"
            onClick={onOpenDecisions}
            className="text-xs font-semibold text-[#6252E8] dark:text-[#B894FF] underline"
          >
            Open Decisions Studio
          </button>
        )}
      </div>

      {/* Validation Status Pill */}
      <div
        className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 border ${
          validation.valid
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
        }`}
      >
        {validation.valid ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="space-y-0.5 min-w-0">
          <div className="font-semibold">
            {validation.valid
              ? 'Ready to publish: variable mappings, schema types, and branch routes verified.'
              : `Publish blocked (${validation.errors.length} validation issue${validation.errors.length > 1 ? 's' : ''})`}
          </div>
          {!validation.valid && (
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Target Artifact & Version Policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="dn-target" className="block text-xs font-semibold mb-1">
            Bound Decision Artifact
          </label>
          <select
            id="dn-target"
            value={`${decisionConfig.targetType}:${decisionConfig.targetId}`}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-xs"
          >
            <optgroup label="Rules">
              {decisions.rules.map((r) => (
                <option key={r.id} value={`rule:${r.id}`}>
                  Rule · {r.name} ({r.version} · {r.status})
                </option>
              ))}
            </optgroup>
            <optgroup label="Decision Tables">
              {decisions.tables.map((t) => (
                <option key={t.id} value={`table:${t.id}`}>
                  Table · {t.name} ({t.version} · {t.status})
                </option>
              ))}
            </optgroup>
            <optgroup label="Rulesets">
              {decisions.rulesets.map((rs) => (
                <option key={rs.id} value={`ruleset:${rs.id}`}>
                  Ruleset · {rs.name} ({rs.version} · {rs.status})
                </option>
              ))}
            </optgroup>
            <optgroup label="Rule Chains">
              {decisions.chains.map((c) => (
                <option key={c.id} value={`chain:${c.id}`}>
                  Chain · {c.name} ({c.version} · {c.status})
                </option>
              ))}
            </optgroup>
            <optgroup label="Scorecards">
              {decisions.scorecards.map((sc) => (
                <option key={sc.id} value={`scorecard:${sc.id}`}>
                  Scorecard · {sc.name} ({sc.version} · {sc.status})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label htmlFor="dn-ver-policy" className="block text-xs font-semibold mb-1">
            Version Resolution Policy
          </label>
          <select
            id="dn-ver-policy"
            value={decisionConfig.versionPolicy ?? 'pinned'}
            onChange={(e) =>
              onChange({
                ...decisionConfig,
                versionPolicy: e.target.value as 'pinned' | 'latest-published',
              })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-xs"
          >
            <option value="pinned">Pinned Immutable Version ({decisionConfig.targetVersion})</option>
            <option value="latest-published">Latest Published Version</option>
          </select>
        </div>
      </div>

      {/* Reusable Variable Mapping Interface */}
      <div className="space-y-2.5 pt-2 border-t border-[#101014]/10 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold">Variable Input Mappings ({bindings.length})</div>
            <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
              Origin provenance: Workflow Input, Previous Node, SOPIN Context, or Static.
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSyncSchemaFields}
              className="min-h-[36px] px-2.5 rounded-lg border border-[#6252E8]/40 text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF]"
            >
              Sync Schema
            </button>
            <button
              type="button"
              onClick={() =>
                updateBindings([
                  ...bindings,
                  {
                    id: `bind-${Date.now()}`,
                    targetField: '',
                    sourceKind: 'workflow_input',
                    sourceRef: '',
                  },
                ])
              }
              className="min-h-[36px] px-2.5 rounded-lg bg-[#6252E8] text-white text-[11px] font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {bindings.map((b) => (
            <div
              key={b.id}
              className="rounded-lg border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-2.5 space-y-2 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                    Target Input {b.required ? '(req)' : ''}
                  </label>
                  <input
                    type="text"
                    value={b.targetField}
                    onChange={(e) =>
                      updateBindings(
                        bindings.map((x) => (x.id === b.id ? { ...x, targetField: e.target.value } : x))
                      )
                    }
                    placeholder="field"
                    className="w-full min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                    Source Origin
                  </label>
                  <select
                    value={b.sourceKind}
                    onChange={(e) =>
                      updateBindings(
                        bindings.map((x) =>
                          x.id === b.id ? { ...x, sourceKind: e.target.value as VariableSourceKind } : x
                        )
                      )
                    }
                    className="w-full min-h-[40px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-xs"
                  >
                    <option value="workflow_input">Workflow Input</option>
                    <option value="previous_node">Previous Node Output</option>
                    <option value="context">SOPIN Context Doc</option>
                    <option value="static">Static Value</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                    Default Fallback
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={b.defaultValue ?? ''}
                      onChange={(e) =>
                        updateBindings(
                          bindings.map((x) =>
                            x.id === b.id ? { ...x, defaultValue: e.target.value } : x
                          )
                        )
                      }
                      placeholder="optional"
                      className="flex-1 min-w-0 min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateBindings(bindings.filter((x) => x.id !== b.id))}
                      aria-label={`Remove mapping ${b.targetField}`}
                      className="w-10 min-h-[40px] rounded border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {b.sourceKind === 'context' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={b.contextDocId ?? ''}
                    onChange={(e) =>
                      updateBindings(
                        bindings.map((x) => (x.id === b.id ? { ...x, contextDocId: e.target.value } : x))
                      )
                    }
                    className="w-full min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-xs"
                  >
                    <option value="">Select Context Document...</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.accessScope})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={b.sourceRef}
                    onChange={(e) =>
                      updateBindings(
                        bindings.map((x) => (x.id === b.id ? { ...x, sourceRef: e.target.value } : x))
                      )
                    }
                    placeholder="Attribute key (e.g. budgetRemaining)"
                    className="w-full min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={b.sourceRef}
                  onChange={(e) =>
                    updateBindings(
                      bindings.map((x) => (x.id === b.id ? { ...x, sourceRef: e.target.value } : x))
                    )
                  }
                  placeholder={
                    b.sourceKind === 'static'
                      ? 'Literal value (e.g. 50000 or true)'
                      : b.sourceKind === 'previous_node'
                      ? 'Dot path (e.g. st-inv-1.invoiceAmount)'
                      : 'Input field / dot path (e.g. invoiceAmount)'
                  }
                  className="w-full min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conditional Branching & Error Behavior */}
      <div className="space-y-2.5 pt-2 border-t border-[#101014]/10 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold">
              Conditional Branching ({decisionConfig.branches?.length ?? 0})
            </div>
            <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
              Route outcomes deterministically and define unhandled fallback.
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddBranch}
            className="min-h-[36px] px-2.5 rounded-lg bg-[#101126] text-white text-[11px] font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Branch</span>
          </button>
        </div>

        {(decisionConfig.branches ?? []).map((br) => (
          <div
            key={br.id}
            className="rounded-lg border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-2.5 space-y-2 text-xs"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={br.label}
                onChange={(e) => handleUpdateBranch(br.id, { label: e.target.value })}
                placeholder="Branch label"
                className="min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
              />
              {!br.isFallback ? (
                <>
                  <input
                    type="text"
                    value={br.matchField}
                    onChange={(e) => handleUpdateBranch(br.id, { matchField: e.target.value })}
                    placeholder="Output field"
                    className="min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={br.matchValue}
                    onChange={(e) => handleUpdateBranch(br.id, { matchValue: e.target.value })}
                    placeholder="Expected value"
                    className="min-h-[40px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] font-mono text-xs"
                  />
                </>
              ) : (
                <div className="col-span-2 flex items-center text-[11px] font-mono text-[#6252E8] dark:text-[#B894FF] px-2">
                  Unhandled-Outcome Fallback
                </div>
              )}
              <div className="flex gap-1">
                <select
                  value={br.nextStepId}
                  onChange={(e) => handleUpdateBranch(br.id, { nextStepId: e.target.value })}
                  className="flex-1 min-w-0 min-h-[40px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-xs"
                >
                  <option value="">Select next step...</option>
                  {workflowSteps
                    .filter((s) => s.id !== currentStepId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveBranch(br.id)}
                  aria-label={`Remove branch ${br.label}`}
                  className="w-10 min-h-[40px] rounded border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="dn-err-behavior" className="block text-[11px] font-semibold mb-1">
              Timeout / Error Behavior
            </label>
            <select
              id="dn-err-behavior"
              value={decisionConfig.onErrorBehavior ?? 'fail-workflow'}
              onChange={(e) =>
                onChange({
                  ...decisionConfig,
                  onErrorBehavior: e.target.value as DecisionErrorBehavior,
                })
              }
              className="w-full min-h-[44px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-xs"
            >
              <option value="fail-workflow">Fail Workflow Immediately</option>
              <option value="fallback-branch">Route to Failure Fallback Step</option>
              <option value="retry-then-fallback">Retry up to Max Retries, then Fallback</option>
            </select>
          </div>
          <div>
            <label htmlFor="dn-nomatch-step" className="block text-[11px] font-semibold mb-1">
              No-Match / Failure Fallback Step
            </label>
            <select
              id="dn-nomatch-step"
              value={decisionConfig.noMatchNextStepId ?? ''}
              onChange={(e) =>
                onChange({
                  ...decisionConfig,
                  noMatchNextStepId: e.target.value || undefined,
                  failureNextStepId: e.target.value || undefined,
                })
              }
              className="w-full min-h-[44px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-xs"
            >
              <option value="">Sequential / None</option>
              {workflowSteps
                .filter((s) => s.id !== currentStepId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inline Deterministic Trace Inspector */}
      <div className="space-y-2.5 pt-2 border-t border-[#101014]/10 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {sampleInputs && sampleInputs.length > 0 && (
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              aria-label="Select demo sample payload"
              className="flex-1 min-w-[180px] min-h-[40px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-xs"
            >
              {sampleInputs.map((si) => (
                <option key={si.id} value={si.id}>
                  Sample: {si.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleRunPreview}
            className="min-h-[40px] px-3.5 rounded-lg bg-[#101126] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Test Decision &amp; Inspect Trace</span>
          </button>
        </div>

        {previewTrace && (
          <div className="rounded-lg bg-[#101014] text-white p-3 space-y-2 text-[11px] font-mono">
            <div className="text-[#B894FF] font-semibold">
              {previewTrace.status} · Version {previewTrace.versionUsed} · {previewTrace.branchNote}
            </div>
            {previewTrace.errors.length > 0 && (
              <div className="text-red-400">Errors: {previewTrace.errors.join(' | ')}</div>
            )}
            <div className="text-[#D8D8E6]">
              <span className="text-[#965BFF]">Provenance:</span>{' '}
              {previewTrace.provenance
                .map((p) => `${p.field}=${p.preview} ← ${p.source}${p.checksum ? ` [${p.checksum}]` : ''}`)
                .join(' ; ')}
            </div>
            <div className="text-[#D8D8E6] break-all">
              <span className="text-[#965BFF]">Output:</span> {previewTrace.outputJson}
            </div>
            {previewTrace.conditions.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-white/10">
                {previewTrace.conditions.map((c, idx) => (
                  <div key={idx} className={c.passed ? 'text-emerald-400' : 'text-amber-300'}>
                    • {c.label} ({c.expected}) actual={c.actual} → {c.passed ? 'TRUE' : 'FALSE'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
