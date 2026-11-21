import {
  ConditionEvalTrace,
  DecisionActionOutput,
  DecisionConditionNode,
  DecisionExecutionSpec,
  DecisionTraceStep,
  RuleSpec,
} from '../types';
import {
  buildConditionTraceSteps,
  buildInputSummary,
  nextExecutionId,
} from './executionTrace';
import {
  coerceScalar,
  compareValues,
  evaluateRestrictedExpression,
  resolveInputField,
} from './operators';
import { validateInputAgainstSchema, validateRuleSpec } from './validators';

function evaluateConditionNode(
  node: DecisionConditionNode,
  input: Record<string, unknown>,
  traces: ConditionEvalTrace[]
): boolean {
  if (node.kind === 'predicate') {
    const resolved = resolveInputField(input, node.field);
    const actual = resolved.value;
    const targetExpr =
      node.operator === 'matches_formula' ? node.expression || node.value : node.value;
    const passed = compareValues(
      actual,
      node.operator,
      targetExpr,
      node.valueEnd,
      input,
      resolved.exists
    );
    traces.push({
      nodeId: node.id,
      label: node.reusableLabel ? `${node.field} (${node.reusableLabel})` : node.field,
      passed,
      actualValue: !resolved.exists ? 'missing' : actual === undefined ? 'undefined' : JSON.stringify(actual),
      expectedSpec:
        node.operator === 'between'
          ? `${node.value} .. ${node.valueEnd ?? ''}`
          : node.operator === 'is_empty' ||
            node.operator === 'is_not_empty' ||
            node.operator === 'exists' ||
            node.operator === 'not_exists'
          ? node.operator
          : `${node.operator} ${targetExpr}`,
    });
    return passed;
  }

  if (node.children.length === 0) return true;
  if (node.logic === 'AND') {
    let allPassed = true;
    for (const child of node.children) {
      if (!evaluateConditionNode(child, input, traces)) {
        allPassed = false;
      }
    }
    return allPassed;
  } else {
    let anyPassed = false;
    for (const child of node.children) {
      if (evaluateConditionNode(child, input, traces)) {
        anyPassed = true;
      }
    }
    return anyPassed;
  }
}

function resolveOutputs(
  actions: DecisionActionOutput[],
  input: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const act of actions) {
    if (act.type === 'expression') {
      out[act.key] = evaluateRestrictedExpression(act.valueExpression, input);
    } else if (act.type === 'number') {
      out[act.key] = Number(coerceScalar(act.valueExpression));
    } else if (act.type === 'boolean') {
      const coerced = coerceScalar(act.valueExpression);
      out[act.key] = typeof coerced === 'boolean' ? coerced : String(coerced).toLowerCase() === 'true';
    } else {
      out[act.key] = coerceScalar(act.valueExpression);
    }
  }
  return out;
}

export function evaluateRuleSpec(
  rule: RuleSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  const specValidation = validateRuleSpec(rule);
  if (!specValidation.valid) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: rule.workspaceId,
      artifactType: 'rule',
      artifactId: rule.id,
      artifactName: rule.name,
      versionUsed: rule.version,
      environment: rule.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: specValidation.errors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'error',
        label: 'Rule Spec Validation',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Rule specification error: ${specValidation.errors.join(' ')}`,
      status: 'Error',
      errorCode: 'INVALID_RULE_SPEC',
      validationErrors: specValidation.errors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const validationErrors = rule.executionConfig.strictInputValidation
    ? validateInputAgainstSchema(rule.inputSchema, input)
    : [];

  if (validationErrors.length > 0) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: rule.workspaceId,
      artifactType: 'rule',
      artifactId: rule.id,
      artifactName: rule.name,
      versionUsed: rule.version,
      environment: rule.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: validationErrors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'validation',
        label: 'Schema Validation Failed',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Schema validation failed: ${validationErrors.join(' ')}`,
      status: 'Error',
      errorCode: 'SCHEMA_VALIDATION_ERROR',
      validationErrors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const traces: ConditionEvalTrace[] = [];
  let matched = false;
  let finalOutput: Record<string, unknown> = {};
  try {
    matched = evaluateConditionNode(rule.conditionRoot, input, traces);
    finalOutput = matched
      ? resolveOutputs(rule.thenOutputs, input)
      : resolveOutputs(rule.elseOutputs, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deterministic expression evaluation failed.';
    return {
      id: nextExecutionId('exec'),
      workspaceId: rule.workspaceId,
      artifactType: 'rule',
      artifactId: rule.id,
      artifactName: rule.name,
      versionUsed: rule.version,
      environment: rule.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: traces,
      matchedConditions: traces.filter((t) => t.passed),
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: [
        ...buildConditionTraceSteps(traces, 'condition', 1),
        {
          stepIndex: traces.length + 1,
          phase: 'error',
          label: 'Expression Evaluation Error',
          detail: message,
          passed: false,
        },
      ],
      finalOutput: {},
      explanation: `Rule evaluation aborted: ${message}`,
      status: 'Error',
      errorCode: 'EXPRESSION_EVALUATION_ERROR',
      validationErrors: [message],
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const matchedConditions = traces.filter((t) => t.passed);
  const traceSteps: DecisionTraceStep[] = [
    {
      stepIndex: 1,
      phase: 'validation',
      label: 'Schema Validation',
      detail: `Validated ${rule.inputSchema.length} schema field(s) for ${rule.name} (${rule.version}).`,
      passed: true,
    },
    ...buildConditionTraceSteps(traces, 'condition', 2),
    {
      stepIndex: traces.length + 2,
      phase: 'outcome',
      label: matched ? 'Selected Outcome (THEN)' : 'Selected Outcome (ELSE Fallback)',
      detail: `Outcome emitted: ${JSON.stringify(finalOutput)}`,
      passed: matched,
    },
  ];

  return {
    id: nextExecutionId('exec'),
    workspaceId: rule.workspaceId,
    artifactType: 'rule',
    artifactId: rule.id,
    artifactName: rule.name,
    versionUsed: rule.version,
    environment: rule.environment,
    sourceTrigger,
    inputPayload: input,
    inputSummary,
    evaluatedConditions: traces,
    matchedConditions,
    matchedRules: matched ? [rule.name] : [],
    matchedTableRows: [],
    executionTrace: traceSteps,
    finalOutput,
    explanation: matched
      ? `Rule "${rule.name}" (${rule.version}) satisfied ${rule.conditionRoot.logic} group (${matchedConditions.length}/${traces.length} predicates TRUE) -> outcome: ${JSON.stringify(finalOutput)}.`
      : `Rule "${rule.name}" (${rule.version}) evaluated false (${matchedConditions.length}/${traces.length} predicates TRUE) -> deterministic ELSE fallback: ${JSON.stringify(finalOutput)}.`,
    status: matched ? 'Matched' : 'Fallback',
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
