import {
  DecisionArtifactType,
  DecisionExecutionSpec,
  DecisionTableSpec,
  DecisionTestCase,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { nextExecutionId } from './executionTrace';
import { evaluateDecisionTableSpec } from './decisionTableEvaluator';
import { evaluateRuleChainSpec } from './ruleChainEvaluator';
import { evaluateRuleSpec } from './ruleEvaluator';
import { evaluateRulesetSpec } from './rulesetEvaluator';
import { evaluateScorecardSpec } from './scorecardEvaluator';
import { resolvePublishedRuleSpec, resolvePublishedTableSpec } from './versioning';

export interface DecisionCollections {
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
}

export interface EvaluateTargetOptions {
  requirePublished?: boolean;
  targetVersion?: string;
}

export function evaluateDecisionTarget(
  targetType: DecisionArtifactType,
  targetId: string,
  input: Record<string, unknown>,
  collections: DecisionCollections,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator',
  options?: EvaluateTargetOptions
): DecisionExecutionSpec | null {
  if (targetType === 'rule') {
    const r = collections.rules.find((x) => x.id === targetId);
    if (!r) return null;
    if (options?.requirePublished || options?.targetVersion) {
      const { resolved, error } = resolvePublishedRuleSpec(r, options?.targetVersion);
      if (!resolved) {
        return {
          id: nextExecutionId('exec'),
          workspaceId: r.workspaceId,
          artifactType: 'rule',
          artifactId: r.id,
          artifactName: r.name,
          versionUsed: options?.targetVersion ?? r.version,
          environment: r.environment,
          sourceTrigger,
          inputPayload: input,
          evaluatedConditions: [],
          matchedConditions: [],
          matchedRules: [],
          matchedTableRows: [],
          finalOutput: {},
          explanation: error || 'Published version unavailable.',
          status: 'Error',
          errorCode: 'PUBLISHED_VERSION_REQUIRED',
          validationErrors: [error || 'Published version unavailable.'],
          durationMs: 0.1,
          executedAt: 'Just now',
        };
      }
      return evaluateRuleSpec(resolved, input, sourceTrigger);
    }
    return evaluateRuleSpec(r, input, sourceTrigger);
  }

  if (targetType === 'table') {
    const t = collections.tables.find((x) => x.id === targetId);
    if (!t) return null;
    if (options?.requirePublished || options?.targetVersion) {
      const { resolved, error } = resolvePublishedTableSpec(t, options?.targetVersion);
      if (!resolved) {
        return {
          id: nextExecutionId('exec'),
          workspaceId: t.workspaceId,
          artifactType: 'table',
          artifactId: t.id,
          artifactName: t.name,
          versionUsed: options?.targetVersion ?? t.version,
          environment: t.environment,
          sourceTrigger,
          inputPayload: input,
          evaluatedConditions: [],
          matchedConditions: [],
          matchedRules: [],
          matchedTableRows: [],
          finalOutput: {},
          explanation: error || 'Published version unavailable.',
          status: 'Error',
          errorCode: 'PUBLISHED_VERSION_REQUIRED',
          validationErrors: [error || 'Published version unavailable.'],
          durationMs: 0.1,
          executedAt: 'Just now',
        };
      }
      return evaluateDecisionTableSpec(resolved, input, sourceTrigger);
    }
    return evaluateDecisionTableSpec(t, input, sourceTrigger);
  }

  if (targetType === 'ruleset') {
    const rs = collections.rulesets.find((x) => x.id === targetId);
    return rs
      ? evaluateRulesetSpec(rs, input, collections.rules, collections.tables, sourceTrigger)
      : null;
  }

  if (targetType === 'chain') {
    const c = collections.chains.find((x) => x.id === targetId);
    return c
      ? evaluateRuleChainSpec(
          c,
          input,
          collections.rules,
          collections.tables,
          collections.rulesets,
          sourceTrigger,
          collections.chains
        )
      : null;
  }

  if (targetType === 'scorecard') {
    const sc = collections.scorecards.find((x) => x.id === targetId);
    return sc ? evaluateScorecardSpec(sc, input, sourceTrigger) : null;
  }

  return null;
}

export function runSingleTestCase(
  artifactType: DecisionArtifactType,
  targetId: string,
  testCase: DecisionTestCase,
  collections: DecisionCollections,
  options?: EvaluateTargetOptions
): { updatedCase: DecisionTestCase; execution: DecisionExecutionSpec | null } {
  const exec = evaluateDecisionTarget(
    artifactType,
    targetId,
    testCase.inputJson,
    collections,
    'Test Suite',
    options
  );

  const actual = exec?.finalOutput ?? {};
  const actualStatus = exec?.status ?? 'Error';
  const expectedEntries = Object.entries(testCase.expectedOutput);
  const diffNotes: string[] = [];

  if (!exec) {
    diffNotes.push(`Target ${artifactType}:${targetId} not found.`);
  }

  if (testCase.expectedStatus) {
    if (actualStatus !== testCase.expectedStatus) {
      diffNotes.push(`Status mismatch: expected "${testCase.expectedStatus}", got "${actualStatus}".`);
    }
  } else if (actualStatus === 'Error') {
    diffNotes.push(`Unexpected Error status: ${exec?.explanation ?? 'Unknown error'}`);
  }

  for (const [key, expectedVal] of expectedEntries) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(expectedVal)) {
      diffNotes.push(
        `Output "${key}": expected ${JSON.stringify(expectedVal)}, got ${JSON.stringify(actual[key])}`
      );
    }
  }

  const failedConditions = (exec?.evaluatedConditions ?? [])
    .filter((c) => !c.passed)
    .map((c) => `${c.label} (${c.expectedSpec}) -> actual=${c.actualValue}`);

  if (exec?.validationErrors && exec.validationErrors.length > 0) {
    failedConditions.push(...exec.validationErrors);
  }

  const passed = Boolean(exec) && diffNotes.length === 0;

  return {
    execution: exec,
    updatedCase: {
      ...testCase,
      lastActualOutput: actual,
      lastActualStatus: actualStatus,
      lastPassed: passed,
      failedConditions,
      diffNotes,
      lastRunAt: 'Just now',
    },
  };
}

export function runBatchTestCases(
  artifactType: DecisionArtifactType,
  targetId: string,
  testCases: DecisionTestCase[],
  collections: DecisionCollections,
  options?: EvaluateTargetOptions
): {
  updatedCases: DecisionTestCase[];
  passedCount: number;
  failedCount: number;
  executions: DecisionExecutionSpec[];
} {
  let passedCount = 0;
  let failedCount = 0;
  const executions: DecisionExecutionSpec[] = [];

  const updatedCases = testCases.map((tc) => {
    const { updatedCase, execution } = runSingleTestCase(
      artifactType,
      targetId,
      tc,
      collections,
      options
    );
    if (execution) executions.push(execution);
    if (updatedCase.lastPassed) passedCount++;
    else failedCount++;
    return updatedCase;
  });

  return { updatedCases, passedCount, failedCount, executions };
}
