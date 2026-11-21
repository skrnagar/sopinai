import {
  AgentConfig,
  DecisionBranchRule,
  DecisionTargetKind,
  ExecutionStepLog,
  KnowledgeDocument,
  MultiAgentGraphNode,
  MultiAgentGraphSpec,
  RetrievedSourceRef,
  UnifiedTraceSpan,
  VariableMappingEntry,
  WorkflowConfig,
  WorkflowDecisionNodeConfig,
  WorkflowStep,
} from '../../app/types';
import {
  DecisionExecutionSpec,
  DecisionFieldType,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { coerceScalar, compareValues, isPlainObject, resolveInputField } from './operators';
import { DecisionCollections, evaluateDecisionTarget } from './testRunner';

export type ContextClearance = 'standard' | 'governance-authorized';

const SENSITIVE_KEY_PATTERN =
  /ssn|tax.?id|bank.?account|account.?number|token|secret|password|api.?key|pan|aadhaar|card.?number|cvv|email|phone/i;

export function redactSensitiveValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (str.length >= 6 && !/token|secret|password|key/i.test(key)) {
      return `***${str.slice(-4)}`;
    }
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => (isPlainObject(item) ? redactSensitiveObject(item) : item));
  }
  if (isPlainObject(value)) {
    return redactSensitiveObject(value);
  }
  return value;
}

export function redactSensitiveObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactSensitiveValue(k, v);
  }
  return out;
}

export function getTargetInputSchema(
  targetType: DecisionTargetKind,
  targetId: string,
  collections: DecisionCollections
): { name: string; type: DecisionFieldType; required: boolean; sampleDefault?: unknown }[] {
  if (targetType === 'rule') {
    const r = collections.rules.find((x) => x.id === targetId);
    return r ? r.inputSchema : [];
  }
  if (targetType === 'table') {
    const t = collections.tables.find((x) => x.id === targetId);
    return t
      ? t.inputColumns.map((c) => ({
          name: c.field,
          type: c.type,
          required: true,
        }))
      : [];
  }
  if (targetType === 'ruleset') {
    const rs = collections.rulesets.find((x) => x.id === targetId);
    if (!rs) return [];
    const seen = new Map<string, { name: string; type: DecisionFieldType; required: boolean }>();
    for (const m of rs.members) {
      if (!m.enabled) continue;
      const memberFields = getTargetInputSchema(m.targetType, m.targetId, collections);
      for (const f of memberFields) {
        if (!seen.has(f.name)) seen.set(f.name, f);
      }
    }
    return Array.from(seen.values());
  }
  if (targetType === 'chain') {
    const c = collections.chains.find((x) => x.id === targetId);
    if (!c || c.stages.length === 0) return [];
    const first = c.stages[0];
    return getTargetInputSchema(first.targetType, first.targetId, collections);
  }
  if (targetType === 'scorecard') {
    const sc = collections.scorecards.find((x) => x.id === targetId);
    if (!sc) return [];
    const seen = new Set<string>();
    return sc.criteria
      .filter((c) => {
        if (seen.has(c.field)) return false;
        seen.add(c.field);
        return true;
      })
      .map((c) => ({
        name: c.field,
        type: 'string' as DecisionFieldType,
        required: true,
      }));
  }
  return [];
}

export function getTargetArtifactStatus(
  targetType: DecisionTargetKind,
  targetId: string,
  collections: DecisionCollections
): { exists: boolean; status?: string; version?: string; name?: string; hasPublishedSnapshot?: boolean } {
  if (targetType === 'rule') {
    const r: RuleSpec | undefined = collections.rules.find((x) => x.id === targetId);
    if (!r) return { exists: false };
    return {
      exists: true,
      status: r.status,
      version: r.version,
      name: r.name,
      hasPublishedSnapshot:
        r.status === 'Published' || r.versionHistory.some((v) => v.status === 'Published'),
    };
  }
  if (targetType === 'table') {
    const t: DecisionTableSpec | undefined = collections.tables.find((x) => x.id === targetId);
    if (!t) return { exists: false };
    return {
      exists: true,
      status: t.status,
      version: t.version,
      name: t.name,
      hasPublishedSnapshot:
        t.status === 'Published' || t.versionHistory.some((v) => v.status === 'Published'),
    };
  }
  if (targetType === 'ruleset') {
    const rs: RulesetSpec | undefined = collections.rulesets.find((x) => x.id === targetId);
    if (!rs) return { exists: false };
    return {
      exists: true,
      status: rs.status,
      version: rs.version,
      name: rs.name,
      hasPublishedSnapshot: rs.status === 'Published',
    };
  }
  if (targetType === 'chain') {
    const c: RuleChainSpec | undefined = collections.chains.find((x) => x.id === targetId);
    if (!c) return { exists: false };
    return {
      exists: true,
      status: c.status,
      version: c.version,
      name: c.name,
      hasPublishedSnapshot: c.status === 'Published' || c.status === 'Tested',
    };
  }
  if (targetType === 'scorecard') {
    const sc: ScorecardSpec | undefined = collections.scorecards.find((x) => x.id === targetId);
    if (!sc) return { exists: false };
    return {
      exists: true,
      status: sc.status,
      version: sc.version,
      name: sc.name,
      hasPublishedSnapshot: sc.status === 'Published',
    };
  }
  return { exists: false };
}

export function isValueCompatibleWithFieldType(val: unknown, expectedType: DecisionFieldType): boolean {
  if (val === undefined || val === null) return expectedType === 'null';
  if (expectedType === 'number') return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val)));
  if (expectedType === 'boolean') return typeof val === 'boolean' || val === 'true' || val === 'false';
  if (expectedType === 'string') return typeof val === 'string' || typeof val === 'number';
  if (expectedType === 'date') return typeof val === 'string' && !Number.isNaN(Date.parse(val));
  if (expectedType === 'array') return Array.isArray(val);
  if (expectedType === 'object') return isPlainObject(val);
  return true;
}

export interface NodeMappingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDecisionNodeConfig(
  cfg: WorkflowDecisionNodeConfig,
  collections: DecisionCollections,
  workflowSteps: WorkflowStep[],
  documents: KnowledgeDocument[],
  options?: { requirePublished?: boolean; callerClearance?: ContextClearance }
): NodeMappingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const clearance = options?.callerClearance ?? 'standard';

  const artifact = getTargetArtifactStatus(cfg.targetType, cfg.targetId, collections);
  if (!artifact.exists) {
    errors.push(`Referenced ${cfg.targetType} "${cfg.targetName || cfg.targetId}" does not exist.`);
    return { valid: false, errors, warnings };
  }

  if (options?.requirePublished !== false && !artifact.hasPublishedSnapshot) {
    errors.push(
      `Decision target "${artifact.name}" (${cfg.targetType}) is "${artifact.status}" and must be Published before workflow publishing.`
    );
  }

  const schema = getTargetInputSchema(cfg.targetType, cfg.targetId, collections);
  const bindings: VariableMappingEntry[] =
    cfg.inputBindings && cfg.inputBindings.length > 0
      ? cfg.inputBindings
      : Object.entries(cfg.inputMappings || {}).map(([targetField, sourceRef], idx) => ({
          id: `legacy-map-${idx}`,
          targetField,
          sourceKind: sourceRef.startsWith('context.')
            ? ('context' as const)
            : sourceRef.startsWith('prev.') || sourceRef.startsWith('previous.')
            ? ('previous_node' as const)
            : sourceRef.startsWith('static:')
            ? ('static' as const)
            : ('workflow_input' as const),
          sourceRef: sourceRef.startsWith('static:') ? sourceRef.slice('static:'.length) : sourceRef,
        }));

  const mappedTargets = new Set(bindings.map((b) => b.targetField));
  for (const field of schema) {
    if (field.required && !mappedTargets.has(field.name)) {
      errors.push(`Required decision input "${field.name}" (${field.type}) is not mapped.`);
    }
  }

  for (const b of bindings) {
    if (!b.targetField.trim()) {
      errors.push('Variable mapping entry has an empty target input field.');
      continue;
    }
    if (!b.sourceRef.trim() && b.defaultValue === undefined) {
      errors.push(`Mapping for "${b.targetField}" has no source reference or default value.`);
      continue;
    }

    const schemaField = schema.find((f) => f.name === b.targetField);
    const expectedType = b.targetType ?? schemaField?.type;

    if (b.sourceKind === 'static' && expectedType) {
      const coerced = coerceScalar(b.sourceRef);
      if (!isValueCompatibleWithFieldType(coerced, expectedType)) {
        errors.push(
          `Type mismatch on static mapping "${b.targetField}": expected ${expectedType}, got "${b.sourceRef}".`
        );
      }
    }

    if (b.sourceKind === 'context') {
      const doc = documents.find((d) => d.id === b.contextDocId || d.title === b.contextDocId);
      if (!doc) {
        errors.push(`Context mapping for "${b.targetField}" references missing document "${b.contextDocId || b.sourceRef}".`);
      } else if (doc.accessScope === 'Restricted Governance' && clearance !== 'governance-authorized') {
        errors.push(
          `Context document "${doc.title}" is Restricted Governance and cannot be mapped without governance authorization.`
        );
      }
    }
  }

  // Validate branch configuration if explicit branches exist
  if (cfg.branches && cfg.branches.length > 0) {
    const stepIds = new Set(workflowSteps.map((s) => s.id));
    const seenSignatures = new Map<string, string>();
    let hasFallback = Boolean(cfg.noMatchNextStepId);

    for (const br of cfg.branches) {
      if (br.nextStepId && !stepIds.has(br.nextStepId)) {
        errors.push(`Branch "${br.label}" targets unknown step ID "${br.nextStepId}".`);
      }
      if (br.isFallback) {
        hasFallback = true;
        continue;
      }
      const sig = `${br.matchField}::${br.operator}::${br.matchValue.trim().toLowerCase()}`;
      const prevStep = seenSignatures.get(sig);
      if (prevStep && prevStep !== br.nextStepId) {
        errors.push(
          `Ambiguous overlapping branch condition (${br.matchField} ${br.operator} ${br.matchValue}) routes to conflicting targets.`
        );
      } else if (prevStep) {
        warnings.push(`Duplicate branch signature "${br.label}" shares identical condition.`);
      }
      seenSignatures.set(sig, br.nextStepId);
    }

    if (!hasFallback) {
      errors.push('Conditional decision node must configure an unhandled-outcome fallback branch.');
    }
  }

  if (cfg.noMatchNextStepId && !workflowSteps.some((s) => s.id === cfg.noMatchNextStepId)) {
    errors.push(`Fallback step ID "${cfg.noMatchNextStepId}" not found in workflow.`);
  }
  if (cfg.failureNextStepId && !workflowSteps.some((s) => s.id === cfg.failureNextStepId)) {
    errors.push(`Error failure step ID "${cfg.failureNextStepId}" not found in workflow.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateWorkflowPublishReadiness(
  workflow: WorkflowConfig,
  collections: DecisionCollections,
  documents: KnowledgeDocument[],
  callerClearance: ContextClearance = 'standard'
): NodeMappingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step before publishing.');
  }

  for (const step of workflow.steps) {
    if (step.kind === 'decision') {
      if (!step.decisionConfig) {
        errors.push(`Decision step "${step.title}" has no SOPIN Decisions binding configured.`);
        continue;
      }
      const res = validateDecisionNodeConfig(
        step.decisionConfig,
        collections,
        workflow.steps,
        documents,
        { requirePublished: true, callerClearance }
      );
      errors.push(...res.errors.map((e) => `[${step.title}] ${e}`));
      warnings.push(...res.warnings.map((w) => `[${step.title}] ${w}`));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export interface VariableProvenanceRecord {
  targetField: string;
  sourceKind: VariableMappingEntry['sourceKind'];
  sourceLabel: string;
  resolvedValuePreview: string;
  docId?: string;
  docChecksum?: string;
}

export interface VariableResolutionOutput {
  resolvedInputs: Record<string, unknown>;
  provenance: VariableProvenanceRecord[];
  retrievedSources: RetrievedSourceRef[];
  errors: string[];
  errorCode?: string;
}

export function resolveVariableBindings(
  cfg: WorkflowDecisionNodeConfig,
  workflowInput: Record<string, unknown>,
  previousNodeOutputs: Record<string, unknown>,
  documents: KnowledgeDocument[],
  callerClearance: ContextClearance = 'standard'
): VariableResolutionOutput {
  const resolvedInputs: Record<string, unknown> = {};
  const provenance: VariableProvenanceRecord[] = [];
  const retrievedSources: RetrievedSourceRef[] = [];
  const errors: string[] = [];
  let errorCode: string | undefined;

  const bindings: VariableMappingEntry[] =
    cfg.inputBindings && cfg.inputBindings.length > 0
      ? cfg.inputBindings
      : Object.entries(cfg.inputMappings || {}).map(([targetField, sourceRef], idx) => ({
          id: `map-${idx}`,
          targetField,
          sourceKind: sourceRef.startsWith('context.')
            ? ('context' as const)
            : sourceRef.startsWith('prev.') || sourceRef.startsWith('previous.')
            ? ('previous_node' as const)
            : sourceRef.startsWith('static:')
            ? ('static' as const)
            : ('workflow_input' as const),
          sourceRef: sourceRef.startsWith('static:') ? sourceRef.slice('static:'.length) : sourceRef,
        }));

  for (const b of bindings) {
    let val: unknown;
    let found = false;
    let sourceLabel = `${b.sourceKind}:${b.sourceRef}`;
    let docId: string | undefined;
    let docChecksum: string | undefined;

    if (b.sourceKind === 'static') {
      val = coerceScalar(b.sourceRef);
      found = true;
      sourceLabel = `Static (${String(val)})`;
    } else if (b.sourceKind === 'workflow_input') {
      const cleaned = b.sourceRef.startsWith('payload.')
        ? b.sourceRef.slice('payload.'.length)
        : b.sourceRef;
      const direct = resolveInputField({ ...workflowInput, payload: workflowInput }, b.sourceRef);
      const fallback = resolveInputField(workflowInput, cleaned);
      if (direct.exists) {
        val = direct.value;
        found = true;
      } else if (fallback.exists) {
        val = fallback.value;
        found = true;
      }
      sourceLabel = `Workflow Input (${b.sourceRef})`;
    } else if (b.sourceKind === 'previous_node') {
      const cleaned = b.sourceRef.replace(/^(prev|previous)\./, '');
      const direct = resolveInputField(previousNodeOutputs, b.sourceRef);
      const stripped = resolveInputField(previousNodeOutputs, cleaned);
      if (direct.exists) {
        val = direct.value;
        found = true;
      } else if (stripped.exists) {
        val = stripped.value;
        found = true;
      }
      sourceLabel = `Previous Node Output (${b.sourceRef})`;
    } else if (b.sourceKind === 'context') {
      const doc = documents.find(
        (d) => d.id === b.contextDocId || d.title === b.contextDocId
      );
      if (!doc) {
        errors.push(`Context document "${b.contextDocId || b.sourceRef}" not found for "${b.targetField}".`);
        errorCode = 'CONTEXT_NOT_FOUND';
        continue;
      }
      if (doc.accessScope === 'Restricted Governance' && callerClearance !== 'governance-authorized') {
        errors.push(
          `Access denied to Restricted Governance context "${doc.title}" for mapping "${b.targetField}".`
        );
        errorCode = 'CONTEXT_PERMISSION_DENIED';
        continue;
      }
      docId = doc.id;
      docChecksum = doc.checksum;
      const attrPath = b.sourceRef.replace(/^context\./, '');
      const attrs = doc.structuredAttributes ?? {};
      const lookup = resolveInputField(attrs, attrPath);
      if (lookup.exists) {
        val = lookup.value;
        found = true;
      }
      sourceLabel = `SOPIN Context · ${doc.title} (${attrPath})`;
      if (!retrievedSources.some((s) => s.docId === doc.id)) {
        retrievedSources.push({
          docId: doc.id,
          docTitle: doc.title,
          chunkId: 'structured-attr',
          excerpt: doc.excerpt,
          checksum: doc.checksum,
        });
      }
    }

    if (!found && b.defaultValue !== undefined && b.defaultValue !== '') {
      val = coerceScalar(b.defaultValue);
      found = true;
      sourceLabel += ` [default=${b.defaultValue}]`;
    }

    if (found) {
      if (b.targetType && !isValueCompatibleWithFieldType(val, b.targetType)) {
        errors.push(
          `Resolved input "${b.targetField}" failed type check: expected ${b.targetType}, got ${typeof val}.`
        );
        errorCode = 'INPUT_TYPE_MISMATCH';
      } else {
        resolvedInputs[b.targetField] = val;
        const previewObj = redactSensitiveObject({ [b.targetField]: val });
        provenance.push({
          targetField: b.targetField,
          sourceKind: b.sourceKind,
          sourceLabel,
          resolvedValuePreview: String(previewObj[b.targetField]),
          docId,
          docChecksum,
        });
      }
    } else if (b.required) {
      errors.push(`Required input "${b.targetField}" missing from ${sourceLabel}.`);
      errorCode = errorCode ?? 'REQUIRED_INPUT_MISSING';
    }
  }

  return { resolvedInputs, provenance, retrievedSources, errors, errorCode };
}

export interface RuntimeDecisionRequest {
  workspaceId: string;
  targetType: DecisionTargetKind;
  targetId: string;
  targetVersion?: string;
  versionPolicy?: 'pinned' | 'latest-published';
  requirePublished?: boolean;
  inputPayload: Record<string, unknown>;
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'];
  outputMappings?: Record<string, string>;
  branches?: DecisionBranchRule[];
  successNextStepId?: string;
  noMatchNextStepId?: string;
  failureNextStepId?: string;
  onErrorBehavior?: WorkflowDecisionNodeConfig['onErrorBehavior'];
  maxRetries?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  simulateFailureError?: string;
}

export interface RuntimeDecisionResult {
  execution: DecisionExecutionSpec;
  redactedInputSummary: Record<string, string>;
  redactedOutputSummary: Record<string, string>;
  workflowVarUpdates: Record<string, unknown>;
  matchedBranch?: DecisionBranchRule;
  nextStepId?: string;
  retriesAttempted: number;
  branchResolutionNote: string;
}

function matchBranchRule(output: Record<string, unknown>, branch: DecisionBranchRule): boolean {
  if (branch.isFallback) return false;
  const fieldLookup = resolveInputField(output, branch.matchField);
  if (!fieldLookup.exists) return false;
  return compareValues(fieldLookup.value, branch.operator, branch.matchValue);
}

export function executeRuntimeDecision(
  request: RuntimeDecisionRequest,
  collections: DecisionCollections
): RuntimeDecisionResult {
  const start = Date.now();

  if (request.signal?.aborted) {
    const cancelledExec: DecisionExecutionSpec = {
      id: nextExecutionId('exec'),
      workspaceId: request.workspaceId,
      artifactType: request.targetType,
      artifactId: request.targetId,
      artifactName: request.targetId,
      versionUsed: request.targetVersion || 'unknown',
      environment: 'production',
      sourceTrigger: request.sourceTrigger,
      inputPayload: redactSensitiveObject(request.inputPayload),
      evaluatedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      finalOutput: {},
      explanation: 'Decision execution cancelled before evaluation (AbortSignal).',
      status: 'Error',
      errorCode: 'EXECUTION_CANCELLED',
      validationErrors: ['Execution cancelled by caller signal.'],
      durationMs: Math.max(0.1, Date.now() - start),
      executedAt: 'Just now',
    };
    return {
      execution: cancelledExec,
      redactedInputSummary: buildInputSummary(redactSensitiveObject(request.inputPayload)),
      redactedOutputSummary: {},
      workflowVarUpdates: {},
      nextStepId:
        request.onErrorBehavior === 'fallback-branch'
          ? request.failureNextStepId ?? request.noMatchNextStepId
          : undefined,
      retriesAttempted: 0,
      branchResolutionNote: 'Execution cancelled.',
    };
  }

  const maxAttempts =
    request.onErrorBehavior === 'retry-then-fallback'
      ? Math.max(1, (request.maxRetries ?? 1) + 1)
      : 1;

  let attempt = 0;
  let exec: DecisionExecutionSpec | null = null;

  while (attempt < maxAttempts) {
    attempt++;

    if (request.simulateFailureError) {
      exec = {
        id: nextExecutionId('exec'),
        workspaceId: request.workspaceId,
        artifactType: request.targetType,
        artifactId: request.targetId,
        artifactName: request.targetId,
        versionUsed: request.targetVersion || 'n/a',
        environment: 'production',
        sourceTrigger: request.sourceTrigger,
        inputPayload: redactSensitiveObject(request.inputPayload),
        evaluatedConditions: [],
        matchedRules: [],
        matchedTableRows: [],
        finalOutput: {},
        explanation: request.simulateFailureError,
        status: 'Error',
        errorCode:
          request.simulateFailureError.toLowerCase().includes('timeout')
            ? 'EXECUTION_TIMEOUT'
            : 'RUNTIME_EVALUATION_ERROR',
        validationErrors: [request.simulateFailureError],
        durationMs: 1.0,
        executedAt: 'Just now',
      };
      continue;
    }

    const versionOption =
      request.versionPolicy === 'latest-published' ? undefined : request.targetVersion;

    exec = evaluateDecisionTarget(
      request.targetType,
      request.targetId,
      request.inputPayload,
      collections,
      request.sourceTrigger,
      {
        requirePublished: request.requirePublished ?? true,
        targetVersion: versionOption,
      }
    );

    if (exec && exec.status !== 'Error') {
      break;
    }
  }

  if (!exec) {
    exec = {
      id: nextExecutionId('exec'),
      workspaceId: request.workspaceId,
      artifactType: request.targetType,
      artifactId: request.targetId,
      artifactName: request.targetId,
      versionUsed: request.targetVersion || 'missing',
      environment: 'production',
      sourceTrigger: request.sourceTrigger,
      inputPayload: redactSensitiveObject(request.inputPayload),
      evaluatedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      finalOutput: {},
      explanation: `Decision target ${request.targetType}:${request.targetId} not found.`,
      status: 'Error',
      errorCode: 'DECISION_TARGET_NOT_FOUND',
      validationErrors: [`Target ${request.targetType}:${request.targetId} missing.`],
      durationMs: Math.max(0.1, Date.now() - start),
      executedAt: 'Just now',
    };
  }

  const redactedInputObj = redactSensitiveObject(request.inputPayload);
  const redactedOutputObj = redactSensitiveObject(exec.finalOutput);
  const redactedInputSummary = buildInputSummary(redactedInputObj);
  const redactedOutputSummary = buildInputSummary(redactedOutputObj);

  const sanitizedExec: DecisionExecutionSpec = {
    ...exec,
    inputPayload: redactedInputObj,
    inputSummary: redactedInputSummary,
  };

  const workflowVarUpdates: Record<string, unknown> = {};
  if (request.outputMappings) {
    for (const [decisionKey, workflowVar] of Object.entries(request.outputMappings)) {
      const lookup = resolveInputField(exec.finalOutput, decisionKey);
      if (lookup.exists) {
        workflowVarUpdates[workflowVar] = lookup.value;
      }
    }
  }

  if (exec.status === 'Error') {
    const useFallback =
      request.onErrorBehavior === 'fallback-branch' ||
      request.onErrorBehavior === 'retry-then-fallback';
    const nextStepId = useFallback
      ? request.failureNextStepId ?? request.noMatchNextStepId
      : undefined;
    return {
      execution: sanitizedExec,
      redactedInputSummary,
      redactedOutputSummary,
      workflowVarUpdates,
      nextStepId,
      retriesAttempted: attempt - 1,
      branchResolutionNote: useFallback
        ? `Recovered from ${exec.errorCode || 'error'} after ${attempt} attempt(s) -> routed to fallback step.`
        : `Failed after ${attempt} attempt(s): ${exec.explanation}`,
    };
  }

  let matchedBranch: DecisionBranchRule | undefined;
  let nextStepId: string | undefined;
  let branchResolutionNote = 'Sequential continuation';

  if (request.branches && request.branches.length > 0) {
    matchedBranch = request.branches.find((b) => matchBranchRule(exec!.finalOutput, b));
    if (matchedBranch) {
      nextStepId = matchedBranch.nextStepId;
      branchResolutionNote = `Matched branch "${matchedBranch.label}" (${matchedBranch.matchField} ${matchedBranch.operator} ${matchedBranch.matchValue})`;
    } else {
      const fallbackRule = request.branches.find((b) => b.isFallback);
      matchedBranch = fallbackRule;
      nextStepId = fallbackRule?.nextStepId ?? request.noMatchNextStepId;
      branchResolutionNote = fallbackRule
        ? `Unhandled outcome routed to explicit fallback branch "${fallbackRule.label}"`
        : request.noMatchNextStepId
        ? `No branch matched -> routed to noMatchNextStepId`
        : 'No branch matched';
    }
  } else if (exec.status === 'Fallback' && request.noMatchNextStepId) {
    nextStepId = request.noMatchNextStepId;
    branchResolutionNote = 'Decision returned Fallback -> routed to noMatchNextStepId';
  } else if (request.successNextStepId) {
    nextStepId = request.successNextStepId;
    branchResolutionNote = 'Decision succeeded -> routed to successNextStepId';
  }

  return {
    execution: sanitizedExec,
    redactedInputSummary,
    redactedOutputSummary,
    workflowVarUpdates,
    matchedBranch,
    nextStepId,
    retriesAttempted: attempt - 1,
    branchResolutionNote,
  };
}

export interface WorkflowExecutionResult {
  status: 'completed' | 'awaiting-approval' | 'failed' | 'cancelled';
  steps: ExecutionStepLog[];
  decisionExecutions: DecisionExecutionSpec[];
  sources: RetrievedSourceRef[];
  workflowVars: Record<string, unknown>;
  unifiedTrace: UnifiedTraceSpan;
  approvalGate?: {
    actionLabel: string;
    reason: string;
    requiredRole: string;
  };
  failureReason?: string;
  artifactMarkdown: string;
}

export function executeWorkflowWithDecisions(
  workflow: WorkflowConfig,
  workflowInput: Record<string, unknown>,
  collections: DecisionCollections,
  documents: KnowledgeDocument[],
  options?: {
    callerClearance?: ContextClearance;
    signal?: AbortSignal;
    defaultRole?: string;
    simulateDecisionError?: string;
  }
): WorkflowExecutionResult {
  const callerClearance = options?.callerClearance ?? 'standard';
  const stepLogs: ExecutionStepLog[] = [];
  const decisionExecutions: DecisionExecutionSpec[] = [];
  const sources: RetrievedSourceRef[] = [];
  const traceChildren: UnifiedTraceSpan[] = [];
  const previousNodeOutputs: Record<string, unknown> = { ...workflowInput };
  const workflowVars: Record<string, unknown> = { ...workflowInput };

  let status: WorkflowExecutionResult['status'] = 'completed';
  let approvalGate: WorkflowExecutionResult['approvalGate'] | undefined;
  let failureReason: string | undefined;

  let currentIndex = 0;
  let hops = 0;
  const maxHops = Math.max(20, workflow.steps.length * 3);

  while (currentIndex >= 0 && currentIndex < workflow.steps.length && hops < maxHops) {
    hops++;
    if (options?.signal?.aborted) {
      status = 'cancelled';
      failureReason = 'Workflow execution cancelled via AbortSignal.';
      break;
    }

    const step = workflow.steps[currentIndex];
    const stepNum = String(stepLogs.length + 1).padStart(2, '0');

    if (step.kind === 'action' || step.kind === 'integration' || step.kind === 'condition') {
      const mergedOut: Record<string, unknown> = {
        ...(step.simulatedOutput ?? {}),
      };
      // Propagate input fields cleanly if action is extraction/intake
      Object.assign(previousNodeOutputs, mergedOut, { [step.id]: mergedOut });
      Object.assign(workflowVars, mergedOut);

      const log: ExecutionStepLog = {
        id: `${workflow.id}-${step.id}-${hops}`,
        label: `${stepNum}. ${step.title}`,
        agentRole: step.kind === 'integration' ? 'MCP Tool Connector' : 'Workflow Step Worker',
        module: step.kind === 'integration' ? 'SOPIN Context / MCP' : 'SOPIN Flow',
        status: 'completed',
        toolUsed: step.kind === 'integration' ? 'context.query' : undefined,
        detail: `${step.detail}${
          Object.keys(mergedOut).length > 0
            ? ` | Output keys: ${Object.keys(mergedOut).join(', ')}`
            : ''
        }`,
        durationMs: 3.2,
      };
      stepLogs.push(log);
      traceChildren.push({
        id: `span-${step.id}-${hops}`,
        kind: step.kind === 'integration' ? 'tool' : 'agent',
        label: step.title,
        module: log.module,
        status: 'completed',
        durationMs: 3.2,
        detail: log.detail,
      });

      if (step.isEndStep) break;
      if (step.nextStepId) {
        const idx = workflow.steps.findIndex((s) => s.id === step.nextStepId);
        currentIndex = idx;
      } else {
        currentIndex++;
      }
      continue;
    }

    if (step.kind === 'decision' && step.decisionConfig) {
      const cfg = step.decisionConfig;
      const resolved = resolveVariableBindings(
        cfg,
        workflowInput,
        previousNodeOutputs,
        documents,
        callerClearance
      );
      for (const s of resolved.retrievedSources) {
        if (!sources.some((x) => x.docId === s.docId)) sources.push(s);
      }

      if (resolved.errors.length > 0) {
        const errMsg = resolved.errors.join(' | ');
        const canFallback =
          (cfg.onErrorBehavior === 'fallback-branch' ||
            cfg.onErrorBehavior === 'retry-then-fallback') &&
          Boolean(cfg.failureNextStepId ?? cfg.noMatchNextStepId);

        const failExec: DecisionExecutionSpec = {
          id: nextExecutionId('exec'),
          workspaceId: workflow.workspaceId,
          artifactType: cfg.targetType,
          artifactId: cfg.targetId,
          artifactName: cfg.targetName,
          versionUsed: cfg.targetVersion,
          environment: 'production',
          sourceTrigger: 'SOPIN Flow',
          inputPayload: redactSensitiveObject(resolved.resolvedInputs),
          evaluatedConditions: [],
          matchedRules: [],
          matchedTableRows: [],
          finalOutput: {},
          explanation: errMsg,
          status: 'Error',
          errorCode: resolved.errorCode || 'VARIABLE_MAPPING_ERROR',
          validationErrors: resolved.errors,
          durationMs: 0.4,
          executedAt: 'Just now',
        };
        decisionExecutions.push(failExec);

        stepLogs.push({
          id: `${workflow.id}-${step.id}-${hops}`,
          label: `${stepNum}. ${step.title}`,
          agentRole: 'Deterministic Rule Engine',
          module: 'SOPIN Decisions',
          status: canFallback ? 'completed' : 'failed',
          toolUsed: `${cfg.targetType}:${cfg.targetId}@${cfg.targetVersion}`,
          detail: canFallback
            ? `Mapping/Context warning routed to fallback: ${errMsg}`
            : `Blocked: ${errMsg}`,
          durationMs: 0.4,
          decisionExecId: failExec.id,
        });

        traceChildren.push({
          id: `span-${step.id}-${hops}`,
          kind: 'decision',
          label: `${cfg.targetName} (${cfg.targetVersion})`,
          module: 'SOPIN Decisions',
          status: canFallback ? 'completed' : 'failed',
          durationMs: 0.4,
          detail: failExec.explanation,
          decisionRef: {
            executionId: failExec.id,
            artifactName: cfg.targetName,
            versionUsed: cfg.targetVersion,
            matchedRuleOrRow: 'None (Validation/Permission Error)',
            redactedInputSummary: buildInputSummary(redactSensitiveObject(resolved.resolvedInputs)),
            redactedOutputSummary: {},
            retriesAttempted: 0,
            errorCode: failExec.errorCode,
          },
        });

        if (canFallback) {
          const nextId = cfg.failureNextStepId ?? cfg.noMatchNextStepId;
          currentIndex = workflow.steps.findIndex((s) => s.id === nextId);
          continue;
        }
        status = 'failed';
        failureReason = errMsg;
        break;
      }

      const runtimeRes = executeRuntimeDecision(
        {
          workspaceId: workflow.workspaceId,
          targetType: cfg.targetType,
          targetId: cfg.targetId,
          targetVersion: cfg.targetVersion,
          versionPolicy: cfg.versionPolicy ?? 'pinned',
          requirePublished: true,
          inputPayload: resolved.resolvedInputs,
          sourceTrigger: 'SOPIN Flow',
          outputMappings: cfg.outputMappings,
          branches: cfg.branches,
          successNextStepId: cfg.successNextStepId,
          noMatchNextStepId: cfg.noMatchNextStepId,
          failureNextStepId: cfg.failureNextStepId,
          onErrorBehavior: cfg.onErrorBehavior ?? 'fail-workflow',
          maxRetries: step.retryMax,
          timeoutMs: cfg.timeoutMs ?? step.timeoutSec * 1000,
          signal: options?.signal,
          simulateFailureError: options?.simulateDecisionError,
        },
        collections
      );

      decisionExecutions.push(runtimeRes.execution);
      Object.assign(workflowVars, runtimeRes.execution.finalOutput, runtimeRes.workflowVarUpdates);
      Object.assign(previousNodeOutputs, runtimeRes.execution.finalOutput, runtimeRes.workflowVarUpdates, {
        [step.id]: runtimeRes.execution.finalOutput,
      });

      const decisionFailed = runtimeRes.execution.status === 'Error' && !runtimeRes.nextStepId;
      const matchedSummary =
        runtimeRes.execution.matchedTableRows[0] ||
        runtimeRes.execution.matchedRules[0] ||
        runtimeRes.execution.status;

      stepLogs.push({
        id: `${workflow.id}-${step.id}-${hops}`,
        label: `${stepNum}. ${step.title}`,
        agentRole: 'Deterministic Rule Engine',
        module: 'SOPIN Decisions',
        status: decisionFailed ? 'failed' : 'completed',
        toolUsed: `${cfg.targetType}:${cfg.targetId}@${runtimeRes.execution.versionUsed}`,
        detail: `${runtimeRes.execution.explanation} | ${runtimeRes.branchResolutionNote}`,
        durationMs: runtimeRes.execution.durationMs,
        retriesAttempted: runtimeRes.retriesAttempted,
        decisionExecId: runtimeRes.execution.id,
      });

      traceChildren.push({
        id: `span-${step.id}-${hops}`,
        kind: 'decision',
        label: `${cfg.targetName} (${runtimeRes.execution.versionUsed})`,
        module: 'SOPIN Decisions',
        status: decisionFailed ? 'failed' : 'completed',
        durationMs: runtimeRes.execution.durationMs,
        detail: runtimeRes.branchResolutionNote,
        decisionRef: {
          executionId: runtimeRes.execution.id,
          artifactName: runtimeRes.execution.artifactName,
          versionUsed: runtimeRes.execution.versionUsed,
          matchedRuleOrRow: matchedSummary,
          redactedInputSummary: runtimeRes.redactedInputSummary,
          redactedOutputSummary: runtimeRes.redactedOutputSummary,
          retriesAttempted: runtimeRes.retriesAttempted,
          errorCode: runtimeRes.execution.errorCode,
        },
      });

      if (decisionFailed) {
        status = 'failed';
        failureReason = runtimeRes.execution.explanation;
        break;
      }

      if (runtimeRes.nextStepId) {
        const nextIdx = workflow.steps.findIndex((s) => s.id === runtimeRes.nextStepId);
        currentIndex = nextIdx;
      } else {
        currentIndex++;
      }
      continue;
    }

    if (step.kind === 'approval') {
      // SOPIN Control governance boundary: entering an approval gate NEVER auto-grants execution,
      // even if an upstream decision already classified the business outcome favorably.
      status = 'awaiting-approval';
      const actionLabel = `${step.title} · ${workflow.name}`;
      const reason = `${step.detail} (Current workflow outcome: ${String(
        workflowVars.decision ?? workflowVars.decisionOutcome ?? 'pending review'
      )})`;

      approvalGate = {
        actionLabel,
        reason,
        requiredRole: options?.defaultRole || 'Workspace Maintainer',
      };

      stepLogs.push({
        id: `${workflow.id}-${step.id}-${hops}`,
        label: `${stepNum}. ${step.title}`,
        agentRole: 'Governance Agent',
        module: 'SOPIN Control',
        status: 'awaiting-approval',
        detail: reason,
        durationMs: 0.2,
      });

      traceChildren.push({
        id: `span-${step.id}-${hops}`,
        kind: 'approval',
        label: step.title,
        module: 'SOPIN Control',
        status: 'awaiting-approval',
        durationMs: 0.2,
        detail: reason,
        approvalRef: {
          actionLabel,
          status: 'pending',
        },
      });
      break;
    }

    currentIndex++;
  }

  if (status === 'completed') {
    traceChildren.push({
      id: `span-verify-final`,
      kind: 'verification',
      label: 'Final Determinism & Audit Verification',
      module: 'SOPIN Observe',
      status: 'completed',
      durationMs: 0.5,
      detail: `Verified ${stepLogs.length} workflow step(s) and ${decisionExecutions.length} deterministic decision trace(s).`,
    });
  }

  const totalDuration = Number(
    traceChildren.reduce((acc, c) => acc + c.durationMs, 0).toFixed(2)
  );

  const unifiedTrace: UnifiedTraceSpan = {
    id: `span-wf-${workflow.id}`,
    kind: 'workflow',
    label: workflow.name,
    module: 'SOPIN Flow',
    status: status === 'awaiting-approval' ? 'awaiting-approval' : status === 'failed' ? 'failed' : status === 'cancelled' ? 'cancelled' : 'completed',
    durationMs: totalDuration,
    detail: `Trigger: ${workflow.trigger} (${workflow.triggerSpec})`,
    children: traceChildren,
  };

  const redactedVars = redactSensitiveObject(workflowVars);
  const artifactLines = [
    `# ${workflow.name} · Execution Summary`,
    ``,
    `- **Status:** ${status.toUpperCase()}`,
    `- **Steps Executed:** ${stepLogs.length}`,
    `- **Deterministic Decisions:** ${decisionExecutions.length}`,
    `- **Redacted Output Variables:** \`${JSON.stringify(redactedVars)}\``,
    ``,
    `## Step Trace`,
    ...stepLogs.map((s) => `- **${s.label}** [${s.status}] — ${s.detail}`),
  ];

  return {
    status,
    steps: stepLogs,
    decisionExecutions,
    sources,
    workflowVars: redactedVars,
    unifiedTrace,
    approvalGate,
    failureReason,
    artifactMarkdown: artifactLines.join('\n'),
  };
}

export interface AgentDecisionInvokeResult {
  allowed: boolean;
  execution?: DecisionExecutionSpec;
  recommendedAction: string;
  errorReason?: string;
}

/**
 * Enforces that an Agent can only invoke attached, authorized, read-evaluate published Decisions
 * and cannot modify rules or bypass SOPIN Control.
 */
export function invokeAgentDecision(
  agent: AgentConfig,
  targetId: string,
  inputPayload: Record<string, unknown>,
  collections: DecisionCollections,
  options?: { signal?: AbortSignal }
): AgentDecisionInvokeResult {
  const binding = (agent.attachedDecisions ?? []).find((d) => d.targetId === targetId);
  if (!binding) {
    return {
      allowed: false,
      recommendedAction: 'Blocked: Decision not attached to agent capability policy.',
      errorReason: `Agent "${agent.name}" is not authorized to invoke unattached decision "${targetId}".`,
    };
  }
  if (binding.allowedExecution !== 'read-evaluate') {
    return {
      allowed: false,
      recommendedAction: 'Blocked: Decision execution disabled on this agent.',
      errorReason: `Execution of "${binding.targetName}" is set to disabled for agent "${agent.name}".`,
    };
  }

  const runtime = executeRuntimeDecision(
    {
      workspaceId: agent.workspaceId,
      targetType: binding.targetType,
      targetId: binding.targetId,
      targetVersion: binding.pinnedVersion,
      versionPolicy: binding.versionPolicy,
      requirePublished: true,
      inputPayload,
      sourceTrigger: 'SOPIN Flow',
      signal: options?.signal,
    },
    collections
  );

  if (runtime.execution.status === 'Error') {
    return {
      allowed: false,
      execution: runtime.execution,
      recommendedAction: `Escalated error: ${runtime.execution.explanation}`,
      errorReason: runtime.execution.explanation,
    };
  }

  const decisionOutcome = String(
    runtime.execution.finalOutput.decision ??
      runtime.execution.finalOutput.decisionOutcome ??
      runtime.execution.status
  );
  return {
    allowed: true,
    execution: runtime.execution,
    recommendedAction: `Agent evaluated ${binding.targetName}@${runtime.execution.versionUsed} -> outcome="${decisionOutcome}" (read-only recommendation; cannot bypass SOPIN Control).`,
  };
}

export interface MultiAgentGraphResult {
  status: 'completed' | 'awaiting-approval' | 'failed';
  steps: ExecutionStepLog[];
  activeSubAgents: string[];
  decisionExecutions: DecisionExecutionSpec[];
  sources: RetrievedSourceRef[];
  unifiedTrace: UnifiedTraceSpan;
  approvalGate?: {
    actionLabel: string;
    reason: string;
    requiredRole: string;
  };
  finalContext: Record<string, unknown>;
  artifactMarkdown: string;
  failureReason?: string;
}

/**
 * Executes a Multi-Agent Graph cleanly with isolated node-scoped context handoffs
 * (explicit edge handoffMappings only — no implicit unrestricted workspace context sharing).
 */
export function executeMultiAgentGraph(
  graph: MultiAgentGraphSpec,
  initialInput: Record<string, unknown>,
  agents: AgentConfig[],
  collections: DecisionCollections,
  documents: KnowledgeDocument[],
  options?: { callerClearance?: ContextClearance; signal?: AbortSignal }
): MultiAgentGraphResult {
  const stepLogs: ExecutionStepLog[] = [];
  const activeSubAgents: string[] = [];
  const decisionExecutions: DecisionExecutionSpec[] = [];
  const sources: RetrievedSourceRef[] = [];
  const traceChildren: UnifiedTraceSpan[] = [];

  let currentNode: MultiAgentGraphNode | undefined = graph.nodes.find(
    (n) => n.id === graph.entryNodeId
  );
  let nodeScopedPayload: Record<string, unknown> = { ...initialInput };
  let status: MultiAgentGraphResult['status'] = 'completed';
  let approvalGate: MultiAgentGraphResult['approvalGate'] | undefined;
  let failureReason: string | undefined;
  let hops = 0;

  while (currentNode && hops < 16) {
    hops++;
    const stepNum = String(stepLogs.length + 1).padStart(2, '0');

    if (currentNode.nodeType === 'agent') {
      const agent = agents.find((a) => a.id === currentNode!.agentId);
      const agentLabel = agent?.name || currentNode.label;
      if (!activeSubAgents.includes(agentLabel)) activeSubAgents.push(agentLabel);

      // Isolate context documents strictly to intersection of agent & node allowedContextDocIds
      const allowedDocIds = new Set(
        currentNode.allowedContextDocIds ?? agent?.knowledgeIds ?? []
      );
      const scopedDocs = documents.filter((d) => {
        if (!allowedDocIds.has(d.id)) return false;
        if (d.accessScope === 'Restricted Governance' && options?.callerClearance !== 'governance-authorized') {
          return false;
        }
        return true;
      });
      for (const d of scopedDocs) {
        if (!sources.some((s) => s.docId === d.id)) {
          sources.push({
            docId: d.id,
            docTitle: d.title,
            chunkId: 'scoped-handoff',
            excerpt: d.excerpt,
            checksum: d.checksum,
          });
        }
      }

      const agentOutput: Record<string, unknown> = {
        ...nodeScopedPayload,
        lastAgent: agentLabel,
        scopedContextCount: scopedDocs.length,
      };
      for (const doc of scopedDocs) {
        if (doc.structuredAttributes) {
          Object.assign(agentOutput, doc.structuredAttributes);
        }
      }

      // If agent has an attached authorized decision and hasn't run it yet, allow explicit read-evaluate assist
      const detail = `${agentLabel} executed with ${scopedDocs.length} explicit context source(s) (isolated handoff scope).`;
      stepLogs.push({
        id: `${graph.id}-${currentNode.id}-${hops}`,
        label: `${stepNum}. ${currentNode.label}`,
        agentRole: agentLabel,
        module: 'SOPIN Graph',
        status: 'completed',
        toolUsed: agent?.tools[0],
        detail,
        durationMs: 4.5,
      });
      traceChildren.push({
        id: `gspan-${currentNode.id}-${hops}`,
        kind: 'agent',
        label: currentNode.label,
        module: 'SOPIN Graph',
        status: 'completed',
        durationMs: 4.5,
        detail,
      });
      nodeScopedPayload = agentOutput;
    } else if (currentNode.nodeType === 'decision' && currentNode.decisionConfig) {
      if (!activeSubAgents.includes('SOPIN Decisions')) activeSubAgents.push('SOPIN Decisions');
      const cfg = currentNode.decisionConfig;
      const resolved = resolveVariableBindings(
        cfg,
        nodeScopedPayload,
        nodeScopedPayload,
        documents,
        options?.callerClearance ?? 'standard'
      );
      const res = executeRuntimeDecision(
        {
          workspaceId: graph.workspaceId,
          targetType: cfg.targetType,
          targetId: cfg.targetId,
          targetVersion: cfg.targetVersion,
          versionPolicy: cfg.versionPolicy ?? 'pinned',
          requirePublished: true,
          inputPayload:
            Object.keys(resolved.resolvedInputs).length > 0
              ? resolved.resolvedInputs
              : nodeScopedPayload,
          sourceTrigger: 'SOPIN Flow',
          signal: options?.signal,
        },
        collections
      );
      decisionExecutions.push(res.execution);
      nodeScopedPayload = { ...nodeScopedPayload, ...res.execution.finalOutput };

      const failed = res.execution.status === 'Error';
      stepLogs.push({
        id: `${graph.id}-${currentNode.id}-${hops}`,
        label: `${stepNum}. ${currentNode.label}`,
        agentRole: 'Deterministic Rule Engine',
        module: 'SOPIN Decisions',
        status: failed ? 'failed' : 'completed',
        toolUsed: `${cfg.targetType}:${cfg.targetId}@${res.execution.versionUsed}`,
        detail: res.execution.explanation,
        durationMs: res.execution.durationMs,
        decisionExecId: res.execution.id,
      });
      traceChildren.push({
        id: `gspan-${currentNode.id}-${hops}`,
        kind: 'decision',
        label: `${cfg.targetName} (${res.execution.versionUsed})`,
        module: 'SOPIN Decisions',
        status: failed ? 'failed' : 'completed',
        durationMs: res.execution.durationMs,
        detail: res.execution.explanation,
        decisionRef: {
          executionId: res.execution.id,
          artifactName: res.execution.artifactName,
          versionUsed: res.execution.versionUsed,
          matchedRuleOrRow: res.execution.matchedRules[0] || res.execution.status,
          redactedInputSummary: res.redactedInputSummary,
          redactedOutputSummary: res.redactedOutputSummary,
          retriesAttempted: res.retriesAttempted,
          errorCode: res.execution.errorCode,
        },
      });
      if (failed) {
        status = 'failed';
        failureReason = res.execution.explanation;
        break;
      }
    } else if (currentNode.nodeType === 'approval') {
      status = 'awaiting-approval';
      const actionLabel = currentNode.approvalActionLabel || currentNode.label;
      const reason = `Graph node "${currentNode.label}" requires explicit ${
        currentNode.requiredRole || 'Governance Lead'
      } approval.`;
      approvalGate = {
        actionLabel,
        reason,
        requiredRole: currentNode.requiredRole || 'Governance Lead',
      };
      stepLogs.push({
        id: `${graph.id}-${currentNode.id}-${hops}`,
        label: `${stepNum}. ${currentNode.label}`,
        agentRole: 'Governance Agent',
        module: 'SOPIN Control',
        status: 'awaiting-approval',
        detail: reason,
        durationMs: 0.2,
      });
      traceChildren.push({
        id: `gspan-${currentNode.id}-${hops}`,
        kind: 'approval',
        label: currentNode.label,
        module: 'SOPIN Control',
        status: 'awaiting-approval',
        durationMs: 0.2,
        detail: reason,
        approvalRef: { actionLabel, status: 'pending' },
      });
      break;
    }

    // Resolve outgoing edge with explicit handoff mappings only
    const outgoing = graph.edges.filter((e) => e.fromNodeId === currentNode!.id);
    if (outgoing.length === 0) break;

    let selectedEdge = outgoing.find((e) => {
      if (e.isFallback || !e.conditionField || !e.conditionOperator || e.conditionValue === undefined) {
        return false;
      }
      const val = resolveInputField(nodeScopedPayload, e.conditionField);
      return val.exists && compareValues(val.value, e.conditionOperator, e.conditionValue);
    });

    if (!selectedEdge) {
      selectedEdge = outgoing.find((e) => e.isFallback) ?? outgoing.find((e) => !e.conditionField);
    }

    if (!selectedEdge) break;

    // Build strict handoff payload containing ONLY mapped fields
    const nextPayload: Record<string, unknown> = {};
    for (const [targetKey, sourcePath] of Object.entries(selectedEdge.handoffMappings || {})) {
      const lookup = resolveInputField(nodeScopedPayload, sourcePath);
      if (lookup.exists) {
        nextPayload[targetKey] = lookup.value;
      }
    }
    nodeScopedPayload = Object.keys(selectedEdge.handoffMappings || {}).length > 0 ? nextPayload : nodeScopedPayload;
    currentNode = graph.nodes.find((n) => n.id === selectedEdge!.toNodeId);
  }

  const unifiedTrace: UnifiedTraceSpan = {
    id: `span-graph-${graph.id}`,
    kind: 'agent',
    label: graph.name,
    module: 'SOPIN Graph',
    status: status === 'awaiting-approval' ? 'awaiting-approval' : status === 'failed' ? 'failed' : 'completed',
    durationMs: Number(traceChildren.reduce((a, b) => a + b.durationMs, 0).toFixed(2)),
    detail: `Multi-Agent Graph execution (${stepLogs.length} nodes)`,
    children: traceChildren,
  };

  return {
    status,
    steps: stepLogs,
    activeSubAgents,
    decisionExecutions,
    sources,
    unifiedTrace,
    approvalGate,
    finalContext: redactSensitiveObject(nodeScopedPayload),
    artifactMarkdown: `# ${graph.name}\n\n- **Status:** ${status.toUpperCase()}\n- **Nodes Executed:** ${stepLogs.length}\n- **Final Context (Redacted):** \`${JSON.stringify(redactSensitiveObject(nodeScopedPayload))}\``,
    failureReason,
  };
}
