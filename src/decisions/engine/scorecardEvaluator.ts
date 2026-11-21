import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionTraceStep,
  ScoreCriterionTrace,
  ScorecardSpec,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { compareValues, resolveInputField } from './operators';

export function evaluateScorecardSpec(
  scorecard: ScorecardSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  let totalScore = scorecard.baseScore;
  const traces: ConditionEvalTrace[] = [];
  const traceSteps: DecisionTraceStep[] = [];
  const criteriaTraces: ScoreCriterionTrace[] = [];

  for (const crit of scorecard.criteria) {
    const resolved = resolveInputField(input, crit.field);
    const matched = compareValues(
      resolved.value,
      crit.operator,
      crit.value,
      undefined,
      input,
      resolved.exists
    );
    const rawPts = matched ? crit.pointsIfMatched : crit.pointsIfMissed;
    const weightedPoints = Math.round(rawPts * crit.weight * 100) / 100;
    totalScore += weightedPoints;

    traces.push({
      nodeId: crit.id,
      label: crit.label,
      passed: matched,
      actualValue: resolved.exists ? JSON.stringify(resolved.value) : 'missing',
      expectedSpec: `${crit.operator} ${crit.value}`,
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
  const band =
    scorecard.thresholds.find((t) => roundedTotal >= t.minScore && roundedTotal <= t.maxScore) ??
    scorecard.thresholds[scorecard.thresholds.length - 1];

  traceSteps.push({
    stepIndex: traceSteps.length + 1,
    phase: 'outcome',
    label: `Score Band: ${band?.classification ?? 'Unclassified'}`,
    detail: `Total ${roundedTotal} pts (Base ${scorecard.baseScore}) => ${band?.decisionOutcome ?? 'manual_review'}`,
    passed: Boolean(band),
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
      classification: band?.classification ?? 'Unclassified',
      criteriaTraces,
    },
    finalOutput: {
      score: roundedTotal,
      classification: band?.classification ?? 'Unclassified',
      decisionOutcome: band?.decisionOutcome ?? 'manual_review',
    },
    explanation: `Scorecard "${scorecard.name}" scored ${roundedTotal} pts (Base ${scorecard.baseScore}) -> Band: ${band?.classification ?? 'Unclassified'} (${band?.decisionOutcome ?? 'manual_review'}).`,
    status: band ? 'Matched' : 'Fallback',
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
