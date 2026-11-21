import {
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionExecutionSpec,
  DecisionTableSpec,
  DecisionTestCase,
  DecisionTestRunRecord,
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
import { computeArtifactSpecHash, resolvePublishedArtifact } from './versioning';

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

function publishedErrorExecution(
  targetType: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'],
  targetVersion: string | undefined,
  error: string | undefined
): DecisionExecutionSpec {
  return {
    id: nextExecutionId('exec'),
    workspaceId: spec.workspaceId,
    artifactType: targetType,
    artifactId: spec.id,
    artifactName: spec.name,
    versionUsed: targetVersion ?? spec.version,
    environment: spec.environment,
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

function findTargetSpec(
  targetType: DecisionArtifactType,
  targetId: string,
  collections: DecisionCollections
): DecisionArtifactSpec | undefined {
  if (targetType === 'rule') return collections.rules.find((x) => x.id === targetId);
  if (targetType === 'table') return collections.tables.find((x) => x.id === targetId);
  if (targetType === 'ruleset') return collections.rulesets.find((x) => x.id === targetId);
  if (targetType === 'chain') return collections.chains.find((x) => x.id === targetId);
  if (targetType === 'scorecard') return collections.scorecards.find((x) => x.id === targetId);
  return undefined;
}

export function evaluateDecisionTarget(
  targetType: DecisionArtifactType,
  targetId: string,
  input: Record<string, unknown>,
  collections: DecisionCollections,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator',
  options?: EvaluateTargetOptions
): DecisionExecutionSpec | null {
  const target = findTargetSpec(targetType, targetId, collections);
  if (!target) return null;

  let activeSpec: DecisionArtifactSpec = target;
  if (options?.requirePublished || options?.targetVersion) {
    const { resolved, error } = resolvePublishedArtifact(
      targetType,
      target,
      options?.targetVersion
    );
    if (!resolved) {
      return publishedErrorExecution(
        targetType,
        target,
        input,
        sourceTrigger,
        options?.targetVersion,
        error
      );
    }
    activeSpec = resolved;
  }

  if (targetType === 'rule') {
    return evaluateRuleSpec(activeSpec as RuleSpec, input, sourceTrigger);
  }
  if (targetType === 'table') {
    return evaluateDecisionTableSpec(activeSpec as DecisionTableSpec, input, sourceTrigger);
  }
  if (targetType === 'ruleset') {
    return evaluateRulesetSpec(
      activeSpec as RulesetSpec,
      input,
      collections.rules,
      collections.tables,
      sourceTrigger
    );
  }
  if (targetType === 'chain') {
    return evaluateRuleChainSpec(
      activeSpec as RuleChainSpec,
      input,
      collections.rules,
      collections.tables,
      collections.rulesets,
      sourceTrigger,
      collections.chains
    );
  }
  if (targetType === 'scorecard') {
    return evaluateScorecardSpec(activeSpec as ScorecardSpec, input, sourceTrigger);
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
  const target = findTargetSpec(artifactType, targetId, collections);
  const testedVersion = options?.targetVersion ?? target?.version ?? 'unknown';
  const testedSpecHash = target ? computeArtifactSpecHash(artifactType, target) : '';

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
  const runAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const runRecord: DecisionTestRunRecord = {
    runId: exec?.id ?? nextExecutionId('trun'),
    runAt,
    passed,
    actualStatus,
    actualOutput: actual,
    testedVersion: exec?.versionUsed ?? testedVersion,
    testedSpecHash,
    diffNotes,
  };

  return {
    execution: exec,
    updatedCase: {
      ...testCase,
      lastActualOutput: actual,
      lastActualStatus: actualStatus,
      lastPassed: passed,
      failedConditions,
      diffNotes,
      lastRunAt: runAt,
      testedVersion: exec?.versionUsed ?? testedVersion,
      testedSpecHash,
      runHistory: [runRecord, ...(testCase.runHistory ?? [])].slice(0, 15),
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
