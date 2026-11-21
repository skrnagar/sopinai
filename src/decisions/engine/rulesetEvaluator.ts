import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionTableSpec,
  DecisionTraceStep,
  RuleSpec,
  RulesetSpec,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { evaluateDecisionTableSpec } from './decisionTableEvaluator';
import { evaluateRuleSpec } from './ruleEvaluator';
import { validateRulesetSpec } from './validators';

export function evaluateRulesetSpec(
  ruleset: RulesetSpec,
  input: Record<string, unknown>,
  rules: RuleSpec[],
  tables: DecisionTableSpec[],
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  const specCheck = validateRulesetSpec(ruleset, { rules, tables });
  if (!specCheck.valid) {
    const isEmpty = ruleset.members.filter((m) => m.enabled).length === 0;
    return {
      id: nextExecutionId('exec'),
      workspaceId: ruleset.workspaceId,
      artifactType: 'ruleset',
      artifactId: ruleset.id,
      artifactName: ruleset.name,
      versionUsed: ruleset.version,
      environment: ruleset.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: specCheck.errors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'error',
        label: isEmpty ? 'Empty Ruleset' : 'Invalid Ruleset Config',
        detail: err,
        passed: false,
      })),
      finalOutput: ruleset.defaultOutput ?? {},
      explanation: `Ruleset "${ruleset.name}" rejected: ${specCheck.errors.join(' ')}`,
      status: 'Error',
      errorCode: isEmpty ? 'EMPTY_RULESET' : 'INVALID_RULESET_SPEC',
      validationErrors: specCheck.errors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const enabledMembers = ruleset.members.filter((m) => m.enabled);
  const ordered =
    ruleset.executionOrder === 'priority-asc'
      ? [...enabledMembers].sort((a, b) => a.priority - b.priority)
      : ruleset.executionOrder === 'priority-desc'
      ? [...enabledMembers].sort((a, b) => b.priority - a.priority)
      : enabledMembers;

  const traces: ConditionEvalTrace[] = [];
  const traceSteps: DecisionTraceStep[] = [];
  const matchedRules: string[] = [];
  const matchedRows: string[] = [];
  let mergedOutput: Record<string, unknown> = {};
  let firstFallbackOutput: Record<string, unknown> | null = null;
  const collectedOutputs: Array<{ member: string; priority: number; output: Record<string, unknown> }> = [];

  for (const member of ordered) {
    let subExec: DecisionExecutionSpec | null = null;
    if (member.targetType === 'rule') {
      const targetRule = rules.find((r) => r.id === member.targetId);
      if (targetRule) subExec = evaluateRuleSpec(targetRule, input, sourceTrigger);
    } else {
      const targetTable = tables.find((t) => t.id === member.targetId);
      if (targetTable) subExec = evaluateDecisionTableSpec(targetTable, input, sourceTrigger);
    }

    if (!subExec) {
      const missingErr = `Referenced member ${member.targetType}:${member.targetId} not found.`;
      return {
        id: nextExecutionId('exec'),
        workspaceId: ruleset.workspaceId,
        artifactType: 'ruleset',
        artifactId: ruleset.id,
        artifactName: ruleset.name,
        versionUsed: ruleset.version,
        environment: ruleset.environment,
        sourceTrigger,
        inputPayload: input,
        inputSummary,
        evaluatedConditions: traces,
        matchedConditions: traces.filter((t) => t.passed),
        matchedRules,
        matchedTableRows: matchedRows,
        executionTrace: [
          ...traceSteps,
          {
            stepIndex: traceSteps.length + 1,
            phase: 'error',
            label: `Missing member ${member.targetType}:${member.targetId}`,
            detail: missingErr,
            passed: false,
          },
        ],
        finalOutput: {},
        explanation: missingErr,
        status: 'Error',
        errorCode: 'MISSING_RULESET_MEMBER',
        validationErrors: [missingErr],
        durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
        executedAt: 'Just now',
      };
    }

    traces.push(...subExec.evaluatedConditions);
    matchedRows.push(...subExec.matchedTableRows);

    if (subExec.status === 'Error') {
      traceSteps.push({
        stepIndex: traceSteps.length + 1,
        phase: 'error',
        label: `Member P${member.priority} Error · ${subExec.artifactName}`,
        detail: subExec.explanation,
        passed: false,
      });
      return {
        ...subExec,
        id: nextExecutionId('exec'),
        artifactType: 'ruleset',
        artifactId: ruleset.id,
        artifactName: ruleset.name,
        versionUsed: ruleset.version,
        evaluatedConditions: traces,
        matchedConditions: traces.filter((t) => t.passed),
        executionTrace: traceSteps,
        durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      };
    }

    const matched = subExec.status === 'Matched';
    traceSteps.push({
      stepIndex: traceSteps.length + 1,
      phase: 'ruleset-member',
      label: `P${member.priority} · ${subExec.artifactName} (${member.targetType})`,
      detail: `${subExec.status} -> ${JSON.stringify(subExec.finalOutput)}`,
      passed: matched,
    });

    if (matched) {
      matchedRules.push(`${subExec.artifactName} (p${member.priority})`);
      collectedOutputs.push({
        member: subExec.artifactName,
        priority: member.priority,
        output: subExec.finalOutput,
      });
      mergedOutput = { ...mergedOutput, ...subExec.finalOutput };

      const shouldStopOnMatch =
        member.stopOnMatch === true ||
        ruleset.stopOnMatch === true ||
        ruleset.conflictResolution === 'first-match' ||
        ruleset.conflictResolution === 'highest-priority';
      if (shouldStopOnMatch) {
        break;
      }
    } else if (firstFallbackOutput === null && Object.keys(subExec.finalOutput).length > 0) {
      firstFallbackOutput = subExec.finalOutput;
    }
  }

  let finalOutput: Record<string, unknown>;
  if (matchedRules.length === 0) {
    finalOutput =
      ruleset.defaultOutput && Object.keys(ruleset.defaultOutput).length > 0
        ? { ...ruleset.defaultOutput }
        : firstFallbackOutput ?? {};
  } else if (ruleset.conflictResolution === 'collect-matches') {
    finalOutput = {
      matchedCount: collectedOutputs.length,
      results: collectedOutputs.map((c) => c.output),
      matchedMembers: collectedOutputs,
    };
  } else {
    finalOutput = mergedOutput;
  }

  const status: DecisionExecutionSpec['status'] = matchedRules.length > 0 ? 'Matched' : 'Fallback';
  traceSteps.push({
    stepIndex: traceSteps.length + 1,
    phase: 'outcome',
    label: status === 'Matched' ? `Ruleset Outcome (${ruleset.conflictResolution})` : 'Ruleset Fallback',
    detail: `Final output: ${JSON.stringify(finalOutput)}`,
    passed: status === 'Matched',
  });

  return {
    id: nextExecutionId('exec'),
    workspaceId: ruleset.workspaceId,
    artifactType: 'ruleset',
    artifactId: ruleset.id,
    artifactName: ruleset.name,
    versionUsed: ruleset.version,
    environment: ruleset.environment,
    sourceTrigger,
    inputPayload: input,
    inputSummary,
    evaluatedConditions: traces,
    matchedConditions: traces.filter((t) => t.passed),
    matchedRules,
    matchedTableRows: matchedRows,
    executionTrace: traceSteps,
    finalOutput,
    explanation:
      matchedRules.length > 0
        ? `Ruleset "${ruleset.name}" (${ruleset.executionOrder}, ${ruleset.conflictResolution}) matched ${matchedRules.join(', ')}.`
        : `Ruleset "${ruleset.name}" evaluated ${ordered.length} member(s); no member matched—explicit fallback output returned.`,
    status,
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
