import {
  ConditionEvalTrace,
  DecisionActionOutput,
  DecisionConditionNode,
  DecisionExecutionSpec,
  DecisionInputField,
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

function lookupSchemaField(
  schema: DecisionInputField[],
  fieldPath: string
): DecisionInputField | undefined {
  const exact = schema.find((f) => f.name === fieldPath);
  if (exact) return exact;
  if (fieldPath.includes('.')) {
    const root = fieldPath.split('.')[0];
    return schema.find((f) => f.name === root);
  }
  return undefined;
}

function evaluateConditionNode(
  node: DecisionConditionNode,
  rule: RuleSpec,
  input: Record<string, unknown>,
  traces: ConditionEvalTrace[]
): boolean {
  if (node.kind === 'predicate') {
    const resolved = resolveInputField(input, node.field);
    const actual = resolved.value;
    const schemaEntry = lookupSchemaField(rule.inputSchema, node.field);
    const effectiveType =
      schemaEntry && !(schemaEntry.type === 'object' && node.field.includes('.'))
        ? schemaEntry.type
        : undefined;
    const targetExpr =
      node.operator === 'matches_formula' ? node.expression || node.value : node.value;

    const passed = compareValues(
      actual,
      node.operator,
      targetExpr,
      node.valueEnd,
      input,
      resolved.exists,
      {
        fieldType: effectiveType,
        caseSensitive: node.caseSensitive ?? rule.executionConfig.caseSensitiveStrings,
      }
    );

    const actualLabel = !resolved.exists
      ? 'missing'
      : actual === undefined
      ? 'undefined'
      : JSON.stringify(actual);
    const expectedLabel =
      node.operator === 'between'
        ? `${node.value} .. ${node.valueEnd ?? ''}`
        : node.operator === 'is_empty' ||
          node.operator === 'is_not_empty' ||
          node.operator === 'exists' ||
          node.operator === 'not_exists'
        ? node.operator
        : `${node.operator} ${targetExpr}`;

    const label = node.reusableLabel ? `${node.field} (${node.reusableLabel})` : node.field;
    traces.push({
      nodeId: node.id,
      label,
      passed,
      actualValue: actualLabel,
      expectedSpec: expectedLabel,
      explanation: `${label}: actual=${actualLabel} vs (${expectedLabel}) => ${passed ? 'TRUE' : 'FALSE'}`,
    });
    return passed;
  }

  if (node.children.length === 0) {
    throw new Error(`Empty condition group "${node.id}" cannot be evaluated.`);
  }

  if (node.logic === 'AND') {
    let allPassed = true;
    for (const child of node.children) {
      if (!evaluateConditionNode(child, rule, input, traces)) {
        allPassed = false;
      }
    }
    return allPassed;
  } else {
    let anyPassed = false;
    for (const child of node.children) {
      if (evaluateConditionNode(child, rule, input, traces)) {
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
      const n = Number(coerceScalar(act.valueExpression));
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        throw new Error(`Action output "${act.key}" produced non-finite number.`);
      }
      out[act.key] = n;
    } else if (act.type === 'boolean') {
      const coerced = coerceScalar(act.valueExpression);
      out[act.key] =
        typeof coerced === 'boolean' ? coerced : String(coerced).toLowerCase() === 'true';
    } else {
      out[act.key] = act.valueExpression;
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
    matched = evaluateConditionNode(rule.conditionRoot, rule, input, traces);
    finalOutput = matched
      ? resolveOutputs(rule.thenOutputs, input)
      : resolveOutputs(rule.elseOutputs, input);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Deterministic expression evaluation failed.';
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
      label: 'Schema & AST Validation',
      detail: `Validated ${rule.inputSchema.length} schema field(s) and condition tree for ${rule.name} (${rule.version}).`,
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
