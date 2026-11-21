import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionTableSpec,
  DecisionTraceStep,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { evaluateDecisionTableSpec } from './decisionTableEvaluator';
import { compareValues, resolveInputField } from './operators';
import { evaluateRuleSpec } from './ruleEvaluator';
import { evaluateRulesetSpec } from './rulesetEvaluator';
import { validateRuleChainSpec } from './validators';

export function evaluateRuleChainSpec(
  chain: RuleChainSpec,
  input: Record<string, unknown>,
  rules: RuleSpec[],
  tables: DecisionTableSpec[],
  rulesets: RulesetSpec[],
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator',
  allChains: RuleChainSpec[] = [],
  visitedChainIds: Set<string> = new Set()
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  const validation = validateRuleChainSpec(
    chain,
    { rules, tables, rulesets, chains: allChains },
    visitedChainIds
  );

  if (!validation.valid) {
    const isCircular = validation.errors.some((e) => e.toLowerCase().includes('circular'));
    return {
      id: nextExecutionId('exec'),
      workspaceId: chain.workspaceId,
      artifactType: 'chain',
      artifactId: chain.id,
      artifactName: chain.name,
      versionUsed: chain.version,
      environment: chain.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionPath: [],
      executionTrace: validation.errors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'error',
        label: isCircular ? 'Circular Chain Rejected' : 'Chain Validation Error',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Rule Chain "${chain.name}" rejected: ${validation.errors.join(' ')}`,
      status: 'Error',
      errorCode: isCircular ? 'CIRCULAR_CHAIN_DETECTED' : 'INVALID_CHAIN_SPEC',
      validationErrors: validation.errors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const workingState: Record<string, unknown> = { ...input };
  const orderedStages = [...chain.stages].sort((a, b) => a.stepOrder - b.stepOrder);
  const traces: ConditionEvalTrace[] = [];
  const traceSteps: DecisionTraceStep[] = [];
  const matchedRules: string[] = [];
  const matchedRows: string[] = [];
  const executionPath: string[] = [];
  let lastStageOutput: Record<string, unknown> = {};
  const nextVisited = new Set(visitedChainIds);
  nextVisited.add(chain.id);

  for (const stage of orderedStages) {
    if (stage.conditionField && stage.conditionOperator && stage.conditionValue !== undefined) {
      const resolvedGate = resolveInputField(workingState, stage.conditionField);
      const gatePass = compareValues(
        resolvedGate.value,
        stage.conditionOperator,
        stage.conditionValue,
        undefined,
        workingState,
        resolvedGate.exists
      );
      const gateTrace: ConditionEvalTrace = {
        nodeId: `chain-gate-${stage.id}`,
        label: `Stage ${stage.stepOrder} Transition Gate (${stage.conditionField})`,
        passed: gatePass,
        actualValue: resolvedGate.exists ? JSON.stringify(resolvedGate.value) : 'missing',
        expectedSpec: `${stage.conditionOperator} ${stage.conditionValue}`,
      };
      traces.push(gateTrace);
      traceSteps.push({
        stepIndex: traceSteps.length + 1,
        phase: 'chain-stage',
        label: `Stage ${stage.stepOrder} Guard`,
        detail: `${stage.conditionField} ${stage.conditionOperator} ${stage.conditionValue} (actual=${gateTrace.actualValue}) => ${gatePass ? 'OPEN' : 'SKIPPED'}`,
        passed: gatePass,
      });

      if (!gatePass) {
        executionPath.push(`Stage ${stage.stepOrder}: ${stage.label} [Gate Skipped]`);
        if (stage.onOutcome === 'branch-to-fallback' && stage.fallbackTargetId) {
          const fallbackRule = rules.find((r) => r.id === stage.fallbackTargetId);
          if (fallbackRule) {
            const fbExec = evaluateRuleSpec(fallbackRule, workingState, sourceTrigger);
            Object.assign(workingState, fbExec.finalOutput);
            lastStageOutput = fbExec.finalOutput;
            matchedRules.push(`Fallback -> ${fallbackRule.name}`);
            executionPath.push(`Fallback: ${fallbackRule.name}`);
            traceSteps.push({
              stepIndex: traceSteps.length + 1,
              phase: 'chain-stage',
              label: `Fallback Transition -> ${fallbackRule.name}`,
              detail: `Output merged: ${JSON.stringify(fbExec.finalOutput)}`,
              passed: fbExec.status === 'Matched',
            });
          }
        }
        continue;
      }
    }

    let stageExec: DecisionExecutionSpec | null = null;
    if (stage.targetType === 'rule') {
      const r = rules.find((item) => item.id === stage.targetId);
      if (r) stageExec = evaluateRuleSpec(r, workingState, sourceTrigger);
    } else if (stage.targetType === 'table') {
      const t = tables.find((item) => item.id === stage.targetId);
      if (t) stageExec = evaluateDecisionTableSpec(t, workingState, sourceTrigger);
    } else if (stage.targetType === 'ruleset') {
      const rs = rulesets.find((item) => item.id === stage.targetId);
      if (rs) stageExec = evaluateRulesetSpec(rs, workingState, rules, tables, sourceTrigger);
    } else if (stage.targetType === 'chain') {
      const subChain = allChains.find((c) => c.id === stage.targetId);
      if (subChain) {
        stageExec = evaluateRuleChainSpec(
          subChain,
          workingState,
          rules,
          tables,
          rulesets,
          sourceTrigger,
          allChains,
          nextVisited
        );
      }
    }

    if (!stageExec) {
      const errMsg = `Stage ${stage.stepOrder} target "${stage.targetId}" (${stage.targetType}) could not be resolved.`;
      return {
        id: nextExecutionId('exec'),
        workspaceId: chain.workspaceId,
        artifactType: 'chain',
        artifactId: chain.id,
        artifactName: chain.name,
        versionUsed: chain.version,
        environment: chain.environment,
        sourceTrigger,
        inputPayload: input,
        inputSummary,
        evaluatedConditions: traces,
        matchedConditions: traces.filter((t) => t.passed),
        matchedRules,
        matchedTableRows: matchedRows,
        executionPath,
        executionTrace: [
          ...traceSteps,
          {
            stepIndex: traceSteps.length + 1,
            phase: 'error',
            label: `Stage ${stage.stepOrder} Missing Target`,
            detail: errMsg,
            passed: false,
          },
        ],
        finalOutput: {},
        explanation: errMsg,
        status: 'Error',
        errorCode: 'MISSING_CHAIN_STAGE_TARGET',
        validationErrors: [errMsg],
        durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
        executedAt: 'Just now',
      };
    }

    traces.push(...stageExec.evaluatedConditions);
    matchedRules.push(...stageExec.matchedRules.map((m) => `Stage ${stage.stepOrder}: ${m}`));
    matchedRows.push(...stageExec.matchedTableRows);

    if (stageExec.status === 'Error') {
      executionPath.push(`Stage ${stage.stepOrder}: ${stage.label} [Error]`);
      traceSteps.push({
        stepIndex: traceSteps.length + 1,
        phase: 'error',
        label: `Stage ${stage.stepOrder} Error`,
        detail: stageExec.explanation,
        passed: false,
      });
      return {
        ...stageExec,
        id: nextExecutionId('exec'),
        artifactType: 'chain',
        artifactId: chain.id,
        artifactName: chain.name,
        versionUsed: chain.version,
        evaluatedConditions: traces,
        matchedConditions: traces.filter((t) => t.passed),
        executionPath,
        executionTrace: traceSteps,
        durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      };
    }

    const forwardedOutputs: Record<string, unknown> =
      stage.passOutputKeys && stage.passOutputKeys.length > 0
        ? Object.fromEntries(
            stage.passOutputKeys
              .filter((k) => Object.prototype.hasOwnProperty.call(stageExec!.finalOutput, k))
              .map((k) => [k, stageExec!.finalOutput[k]])
          )
        : stageExec.finalOutput;

    Object.assign(workingState, forwardedOutputs);
    lastStageOutput = stageExec.finalOutput;
    executionPath.push(
      `Stage ${stage.stepOrder}: ${stage.label} (${stageExec.status}: ${JSON.stringify(forwardedOutputs)})`
    );
    traceSteps.push({
      stepIndex: traceSteps.length + 1,
      phase: 'chain-stage',
      label: `Stage ${stage.stepOrder} · ${stageExec.artifactName}`,
      detail: `Forwarded ${Object.keys(forwardedOutputs).join(', ') || 'none'} => ${JSON.stringify(forwardedOutputs)}`,
      passed: stageExec.status === 'Matched',
    });

    const outcomeVal = String(stageExec.finalOutput.decision ?? '');
    const terminalList = [
      ...(chain.terminalOutcomes ?? []),
      ...(stage.terminalOutcomes ?? []),
    ].map((x) => x.toLowerCase());

    if (terminalList.length > 0 && terminalList.includes(outcomeVal.toLowerCase())) {
      executionPath.push(`Terminal Stop: outcome "${outcomeVal}" halted remaining stages`);
      traceSteps.push({
        stepIndex: traceSteps.length + 1,
        phase: 'outcome',
        label: `Terminal Outcome Reached (${outcomeVal})`,
        detail: `Chain stopped at Stage ${stage.stepOrder} per terminal outcome rule.`,
        passed: true,
      });
      break;
    }

    if (stage.onOutcome === 'stop-on-match' && stageExec.status === 'Matched') {
      executionPath.push(`Early Stop: Stage ${stage.stepOrder} stop-on-match`);
      break;
    }
  }

  return {
    id: nextExecutionId('exec'),
    workspaceId: chain.workspaceId,
    artifactType: 'chain',
    artifactId: chain.id,
    artifactName: chain.name,
    versionUsed: chain.version,
    environment: chain.environment,
    sourceTrigger,
    inputPayload: input,
    inputSummary,
    evaluatedConditions: traces,
    matchedConditions: traces.filter((t) => t.passed),
    matchedRules,
    matchedTableRows: matchedRows,
    executionPath,
    executionTrace: traceSteps,
    finalOutput: {
      ...lastStageOutput,
      ...Object.fromEntries(
        Object.entries(workingState).filter(([k]) => !Object.prototype.hasOwnProperty.call(input, k))
      ),
    },
    explanation: `Executed ${executionPath.length}-step chain "${chain.name}" deterministically: ${executionPath.join(' -> ')}.`,
    status: matchedRules.length > 0 ? 'Matched' : 'Fallback',
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
