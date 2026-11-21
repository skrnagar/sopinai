import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionFieldType,
  DecisionTraceStep,
  ScoreCriterionTrace,
  ScorecardSpec,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { compareValues, isIsoDateLike, resolveInputField } from './operators';
import { validateScorecardSpec } from './validators';

function inferFieldType(explicit: DecisionFieldType | undefined, expectedRaw: string): DecisionFieldType {
  if (explicit) return explicit;
  const t = expectedRaw.trim();
  if (t === 'true' || t === 'false') return 'boolean';
  if (t !== '' && !Number.isNaN(Number(t)) && Number.isFinite(Number(t))) return 'number';
  if (isIsoDateLike(t)) return 'date';
  return 'string';
}

function validateCriterionInput(
  field: string,
  expectedType: DecisionFieldType,
  exists: boolean,
  val: unknown,
  operator: string
): string | null {
  const allowsMissing =
    operator === 'exists' ||
    operator === 'not_exists' ||
    operator === 'is_empty' ||
    operator === 'is_not_empty';

  if (!allowsMissing && (!exists || val === undefined || val === null || val === '')) {
    return `Missing required scorecard input "${field}" (${expectedType}).`;
  }
  if (!exists || val === undefined || val === null) return null;

  if (expectedType === 'number' && (typeof val !== 'number' || !Number.isFinite(val))) {
    return `Scorecard input "${field}" expected finite number, received ${typeof val} (${String(val)}).`;
  }
  if (expectedType === 'boolean' && typeof val !== 'boolean') {
    return `Scorecard input "${field}" expected boolean, received ${typeof val} (${String(val)}).`;
  }
  if (expectedType === 'date' && !isIsoDateLike(val)) {
    return `Scorecard input "${field}" expected ISO date, received "${String(val)}".`;
  }
  return null;
}

export function evaluateScorecardSpec(
  scorecard: ScorecardSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});

  const specCheck = validateScorecardSpec(scorecard);
  if (!specCheck.valid) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: scorecard.workspaceId,
      artifactType: 'scorecard',
      artifactId: scorecard.id,
      artifactName: scorecard.name,
      versionUsed: scorecard.version,
      environment: scorecard.environment,
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
        label: 'Invalid Scorecard Configuration',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Scorecard configuration rejected: ${specCheck.errors.join(' ')}`,
      status: 'Error',
      errorCode: 'INVALID_SCORECARD_SPEC',
      validationErrors: specCheck.errors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  // Validate all criterion input values explicitly rather than treating missing/invalid inputs as missed points
  const inputErrors: string[] = [];
  for (const crit of scorecard.criteria) {
    const resolved = resolveInputField(input, crit.field);
    const inferred = inferFieldType(crit.fieldType, crit.value);
    const err = validateCriterionInput(
      crit.field,
      inferred,
      resolved.exists,
      resolved.value,
      crit.operator
    );
    if (err) inputErrors.push(err);
  }

  if (inputErrors.length > 0) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: scorecard.workspaceId,
      artifactType: 'scorecard',
      artifactId: scorecard.id,
      artifactName: scorecard.name,
      versionUsed: scorecard.version,
      environment: scorecard.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: inputErrors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'validation',
        label: 'Scorecard Input Validation Failed',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Scorecard input validation failed: ${inputErrors.join(' ')}`,
      status: 'Error',
      errorCode: 'INVALID_SCORECARD_INPUT',
      validationErrors: inputErrors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  let totalScore = scorecard.baseScore;
  const traces: ConditionEvalTrace[] = [];
  const traceSteps: DecisionTraceStep[] = [
    {
      stepIndex: 1,
      phase: 'validation',
      label: 'Scorecard Spec & Input Validation',
      detail: `Validated ${scorecard.criteria.length} criteria and ${scorecard.thresholds.length} threshold bands.`,
      passed: true,
    },
  ];
  const criteriaTraces: ScoreCriterionTrace[] = [];

  for (const crit of scorecard.criteria) {
    const resolved = resolveInputField(input, crit.field);
    const inferredType = inferFieldType(crit.fieldType, crit.value);
    const matched = compareValues(
      resolved.value,
      crit.operator,
      crit.value,
      crit.valueEnd,
      input,
      resolved.exists,
      { fieldType: inferredType }
    );
    const rawPts = matched ? crit.pointsIfMatched : crit.pointsIfMissed;
    const weightedPoints = Math.round(rawPts * crit.weight * 100) / 100;
    totalScore = Math.round((totalScore + weightedPoints) * 100) / 100;

    traces.push({
      nodeId: crit.id,
      label: crit.label,
      passed: matched,
      actualValue: resolved.exists ? JSON.stringify(resolved.value) : 'missing',
      expectedSpec: `${crit.operator} ${crit.value}`,
      explanation: `${crit.label} (${crit.field} ${crit.operator} ${crit.value}): actual=${JSON.stringify(
        resolved.value
      )} => ${matched ? 'TRUE' : 'FALSE'} (${weightedPoints >= 0 ? `+${weightedPoints}` : weightedPoints} pts)`,
    });

    criteriaTraces.push({
      criterionId: crit.id,
      label: crit.label,
      matched,
      weightedPoints,
      rationale: crit.rationale,
    });

    traceSteps.push({
      stepIndex: traceSteps.length + 1,
      phase: 'scorecard',
      label: crit.label,
      detail: `${crit.field} ${crit.operator} ${crit.value} => ${matched ? 'TRUE' : 'FALSE'} (${weightedPoints >= 0 ? `+${weightedPoints}` : weightedPoints} pts)`,
      passed: matched,
    });
  }

  const roundedTotal = Math.round(totalScore * 100) / 100;
  // Explicit interval lookup — NEVER silently fall back to thresholds[thresholds.length - 1]
  const band = scorecard.thresholds.find(
    (t) => roundedTotal >= t.minScore && roundedTotal <= t.maxScore
  );

  if (!band) {
    const errMsg = `Computed score ${roundedTotal} pts falls outside all configured threshold bands for scorecard "${scorecard.name}".`;
    traceSteps.push({
      stepIndex: traceSteps.length + 1,
      phase: 'error',
      label: 'Unmatched Score Threshold Band',
      detail: errMsg,
      passed: false,
    });

    return {
      id: nextExecutionId('exec'),
      workspaceId: scorecard.workspaceId,
      artifactType: 'scorecard',
      artifactId: scorecard.id,
      artifactName: scorecard.name,
      versionUsed: scorecard.version,
      environment: scorecard.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: traces,
      matchedConditions: traces.filter((t) => t.passed),
      matchedRules: criteriaTraces.filter((c) => c.matched).map((c) => c.label),
      matchedTableRows: [],
      executionTrace: traceSteps,
      scoreBreakdown: {
        baseScore: scorecard.baseScore,
        totalScore: roundedTotal,
        classification: 'Unmatched',
        criteriaTraces,
      },
      finalOutput: {
        score: roundedTotal,
        classification: 'Unmatched',
        decisionOutcome: 'error_unmatched_band',
      },
      explanation: errMsg,
      status: 'Error',
      errorCode: 'UNMATCHED_SCORE_BAND',
      validationErrors: [errMsg],
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  traceSteps.push({
    stepIndex: traceSteps.length + 1,
    phase: 'outcome',
    label: `Score Band: ${band.classification}`,
    detail: `Total ${roundedTotal} pts (Base ${scorecard.baseScore}) => ${band.decisionOutcome}`,
    passed: true,
  });

  return {
    id: nextExecutionId('exec'),
    workspaceId: scorecard.workspaceId,
    artifactType: 'scorecard',
    artifactId: scorecard.id,
    artifactName: scorecard.name,
    versionUsed: scorecard.version,
    environment: scorecard.environment,
    sourceTrigger,
    inputPayload: input,
    inputSummary,
    evaluatedConditions: traces,
    matchedConditions: traces.filter((t) => t.passed),
    matchedRules: criteriaTraces.filter((c) => c.matched).map((c) => c.label),
    matchedTableRows: [],
    executionTrace: traceSteps,
    scoreBreakdown: {
      baseScore: scorecard.baseScore,
      totalScore: roundedTotal,
      classification: band.classification,
      criteriaTraces,
    },
    finalOutput: {
      score: roundedTotal,
      classification: band.classification,
      decisionOutcome: band.decisionOutcome,
    },
    explanation: `Scorecard "${scorecard.name}" scored ${roundedTotal} pts (Base ${scorecard.baseScore}) -> Band: ${band.classification} (${band.decisionOutcome}).`,
    status: 'Matched',
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
