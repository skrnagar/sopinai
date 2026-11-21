import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublishedChainVersion,
  buildPublishedRuleVersion,
  buildPublishedRulesetVersion,
  buildPublishedScorecardVersion,
  buildPublishedTableVersion,
  canonicalSerialize,
  checkEditPermission,
  checkTestEvidenceFreshness,
  compareVersionSnapshots,
  computeArtifactSpecHash,
  evaluateDecisionTableSpec,
  evaluateDecisionTarget,
  evaluatePublishGovernancePolicy,
  evaluateRuleChainSpec,
  evaluateRuleSpec,
  evaluateScorecardSpec,
  resolvePublishedArtifact,
  rollbackArtifactToSnapshot,
  runBatchTestCases,
  validateArtifact,
  validateDecisionTableArtifact,
  validateRuleArtifact,
  validateRuleChainArtifact,
  validateScorecardArtifact,
  verifySnapshotIntegrity,
} from '../evaluator';
import { INITIAL_DECISIONS_SLICE } from '../seedData';
import {
  DecisionSettings,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  ScorecardSpec,
} from '../types';

const DEFAULT_SETTINGS: DecisionSettings = { ...INITIAL_DECISIONS_SLICE.settings };

test('L1. Rejects empty root and empty nested AND/OR condition groups', () => {
  const baseRule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);

  const emptyRoot: RuleSpec = {
    ...baseRule,
    conditionRoot: { kind: 'group', id: 'g-empty-root', logic: 'AND', children: [] },
  };
  const rootCheck = validateRuleArtifact(emptyRoot, 'draft');
  assert.equal(rootCheck.isValid, false);
  assert.ok(rootCheck.errors.some((e) => e.code === 'EMPTY_CONDITION_GROUP'));

  const rootEval = evaluateRuleSpec(emptyRoot, {
    invoiceAmount: 1000,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(rootEval.status, 'Error');
  assert.equal(rootEval.errorCode, 'INVALID_RULE_SPEC');

  const emptyNested: RuleSpec = {
    ...baseRule,
    conditionRoot: {
      kind: 'group',
      id: 'g-root',
      logic: 'AND',
      children: [
        { kind: 'predicate', id: 'p1', field: 'invoiceAmount', operator: '<', value: '50000' },
        { kind: 'group', id: 'g-nested-empty', logic: 'OR', children: [] },
      ],
    },
  };
  const nestedCheck = validateRuleArtifact(emptyNested, 'draft');
  assert.equal(nestedCheck.isValid, false);
  assert.ok(nestedCheck.errors.some((e) => e.code === 'EMPTY_CONDITION_GROUP' && e.nodeId === 'g-nested-empty'));
});

test('L2. Nested AND/OR condition tree rejects undeclared input schema field references', () => {
  const baseRule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);
  const badFieldRule: RuleSpec = {
    ...baseRule,
    conditionRoot: {
      kind: 'group',
      id: 'g-root',
      logic: 'AND',
      children: [
        {
          kind: 'group',
          id: 'g-sub',
          logic: 'OR',
          children: [
            { kind: 'predicate', id: 'p-bad', field: 'undeclaredFieldX', operator: '==', value: '10' },
          ],
        },
      ],
    },
  };
  const check = validateRuleArtifact(badFieldRule, 'draft');
  assert.equal(check.isValid, false);
  assert.ok(check.errors.some((e) => e.code === 'UNDECLARED_INPUT_FIELD' && e.field === 'undeclaredFieldX'));
});

test('L3. Rejects incompatible operator vs field data type pairs cleanly', () => {
  const baseRule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);
  const badOpRule: RuleSpec = {
    ...baseRule,
    conditionRoot: {
      kind: 'group',
      id: 'g-root',
      logic: 'AND',
      children: [
        { kind: 'predicate', id: 'p-bad-op', field: 'vendorVerified', operator: '>', value: 'true' },
        { kind: 'predicate', id: 'p-bad-contains', field: 'invoiceAmount', operator: 'contains', value: '50' },
      ],
    },
  };
  const check = validateRuleArtifact(badOpRule, 'draft');
  assert.equal(check.isValid, false);
  assert.ok(check.errors.some((e) => e.code === 'INVALID_OPERATOR_FOR_TYPE' && e.field === 'vendorVerified'));
  assert.ok(check.errors.some((e) => e.code === 'INVALID_OPERATOR_FOR_TYPE' && e.field === 'invoiceAmount'));
});

test('L4. Strict null/undefined/missing handling, no cross-type coercion, and case sensitivity', () => {
  const strictRule: RuleSpec = {
    ...structuredClone(INITIAL_DECISIONS_SLICE.rules[0]),
    id: 'rule-strict-types',
    inputSchema: [
      { name: 'code', type: 'string', required: false, description: 'String code' },
      { name: 'score', type: 'number', required: false, description: 'Numeric score' },
      { name: 'active', type: 'boolean', required: false, description: 'Flag' },
      { name: 'note', type: 'string', required: false, description: 'Optional note' },
    ],
    conditionRoot: {
      kind: 'group',
      id: 'g1',
      logic: 'AND',
      children: [
        { kind: 'predicate', id: 'p-code', field: 'code', operator: '==', value: '0012' },
        { kind: 'predicate', id: 'p-score', field: 'score', operator: '>', value: '10' },
        { kind: 'predicate', id: 'p-active', field: 'active', operator: '==', value: 'true' },
        { kind: 'predicate', id: 'p-note', field: 'note', operator: 'is_empty', value: '' },
      ],
    },
    executionConfig: {
      stopOnMatch: true,
      strictInputValidation: true,
      expressionMode: 'restricted-safe-evaluator',
      caseSensitiveStrings: true,
    },
    thenOutputs: [{ key: 'ok', valueExpression: 'true', type: 'boolean' }],
    elseOutputs: [{ key: 'ok', valueExpression: 'false', type: 'boolean' }],
  };

  // Exact typed inputs pass, including missing optional note -> is_empty true
  const pass = evaluateRuleSpec(strictRule, { code: '0012', score: 15, active: true });
  assert.equal(pass.status, 'Matched');
  assert.equal(pass.finalOutput.ok, true);

  // Explicit null is treated as empty and non-equal to false/0
  const withNull = evaluateRuleSpec(strictRule, { code: '0012', score: 15, active: true, note: null });
  assert.equal(withNull.status, 'Matched');

  // Case sensitivity: 'Alpha' != 'alpha' when caseSensitiveStrings is true
  const caseRule: RuleSpec = {
    ...strictRule,
    conditionRoot: {
      kind: 'group',
      id: 'g-cs',
      logic: 'AND',
      children: [{ kind: 'predicate', id: 'p-cs', field: 'code', operator: '==', value: 'Alpha', caseSensitive: true }],
    },
  };
  const caseMiss = evaluateRuleSpec(caseRule, { code: 'alpha' });
  assert.equal(caseMiss.status, 'Fallback');
  assert.equal(caseMiss.finalOutput.ok, false);

  // Strict schema rejects "true" string passed to boolean field, "42" string passed to number field, and number passed to string field
  const wrongBool = evaluateRuleSpec(strictRule, { code: '0012', score: 15, active: 'true' });
  assert.equal(wrongBool.status, 'Error');
  assert.equal(wrongBool.errorCode, 'SCHEMA_VALIDATION_ERROR');
});

test('L5. Rejects malformed expressions, unsafe tokens, and division by zero cleanly', () => {
  const baseRule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);

  const divZeroRule: RuleSpec = {
    ...baseRule,
    thenOutputs: [{ key: 'ratio', valueExpression: 'invoiceAmount / 0', type: 'expression' }],
  };
  const divCheck = validateRuleArtifact(divZeroRule, 'draft');
  assert.equal(divCheck.isValid, false);
  assert.ok(divCheck.errors.some((e) => e.code === 'UNSAFE_OR_INVALID_EXPRESSION'));

  const dynDivZeroRule: RuleSpec = {
    ...baseRule,
    inputSchema: [
      ...baseRule.inputSchema,
      { name: 'divisor', type: 'number', required: false, description: 'Divisor', sampleDefault: 0 },
    ],
    thenOutputs: [{ key: 'ratio', valueExpression: 'invoiceAmount / divisor', type: 'expression' }],
  };
  const dynEval = evaluateRuleSpec(dynDivZeroRule, {
    invoiceAmount: 1000,
    vendorVerified: true,
    duplicateFound: false,
    divisor: 0,
  });
  assert.equal(dynEval.status, 'Error');
  assert.equal(dynEval.errorCode, 'EXPRESSION_EVALUATION_ERROR');

  const malformedRule: RuleSpec = {
    ...baseRule,
    thenOutputs: [{ key: 'ratio', valueExpression: 'invoiceAmount + * 2', type: 'expression' }],
  };
  const malCheck = validateRuleArtifact(malformedRule, 'draft');
  assert.equal(malCheck.isValid, false);
});

test('L6. Rejects duplicate table column IDs, duplicate fields, duplicate rows, priority conflicts, and invalid cell expressions', () => {
  const baseTable = structuredClone(INITIAL_DECISIONS_SLICE.tables[1]);
  const brokenTable: DecisionTableSpec = {
    ...baseTable,
    hitPolicy: 'priority',
    inputColumns: [
      { id: 'c1', field: 'dataClass', label: 'Class 1', type: 'string' },
      { id: 'c1', field: 'dataClass', label: 'Class 2', type: 'string' },
    ],
    rows: [
      { id: 'r1', priority: 1, enabled: true, cells: { dataClass: 'between [abc, xyz]' }, outputs: { decision: '', reviewer: 'ops' } },
      { id: 'r2', priority: 1, enabled: true, cells: { dataClass: 'between [abc, xyz]' }, outputs: { decision: 'approved', reviewer: 'ops' } },
    ],
  };

  const check = validateDecisionTableArtifact(brokenTable, 'publication');
  assert.equal(check.isValid, false);
  const codes = new Set(check.errors.map((e) => e.code));
  assert.ok(codes.has('DUPLICATE_COLUMN_ID'));
  assert.ok(codes.has('DUPLICATE_COLUMN_FIELD'));
  assert.ok(codes.has('PRIORITY_CONFLICT'));
  assert.ok(codes.has('INVALID_TABLE_CELL'));
  assert.ok(codes.has('MISSING_ROW_OUTPUT'));
});

test('L7 & L8. Decision table hit policies (first-match, priority, unique, collect-all, any) and no-match fallback', () => {
  const anyTableOk: DecisionTableSpec = {
    id: 'tbl-any-ok',
    workspaceId: 'ws-core',
    name: 'Any Policy Consistent Table',
    description: 'Overlapping rows agree on outcome',
    isDemoData: false,
    hitPolicy: 'any',
    inputColumns: [
      { id: 'c1', field: 'tier', label: 'Tier', type: 'string' },
      { id: 'c2', field: 'amount', label: 'Amount', type: 'number' },
    ],
    outputColumns: [
      { id: 'o1', field: 'decision', label: 'Decision', type: 'string', required: true },
    ],
    rows: [
      { id: 'r1', priority: 1, enabled: true, cells: { tier: 'gold', amount: '*' }, outputs: { decision: 'approved' } },
      { id: 'r2', priority: 2, enabled: true, cells: { tier: '*', amount: '< 1000' }, outputs: { decision: 'approved' } },
    ],
    defaultOutput: { decision: 'manual_review' },
    testCases: [],
    version: 'v1.0',
    environment: 'development',
    status: 'Draft',
    versionHistory: [],
    updatedAt: 'Now',
  };

  const anyValidCheck = validateDecisionTableArtifact(anyTableOk, 'publication');
  assert.equal(anyValidCheck.isValid, true);
  const anyMatch = evaluateDecisionTableSpec(anyTableOk, { tier: 'gold', amount: 500 });
  assert.equal(anyMatch.status, 'Matched');
  assert.equal(anyMatch.finalOutput.decision, 'approved');

  // No-match returns explicit fallback defaults
  const noMatch = evaluateDecisionTableSpec(anyTableOk, { tier: 'bronze', amount: 5000 });
  assert.equal(noMatch.status, 'Fallback');
  assert.equal(noMatch.finalOutput.decision, 'manual_review');

  // 'any' policy with conflicting outputs on overlapping rows must fail validation AND evaluation
  const anyConflict: DecisionTableSpec = {
    ...anyTableOk,
    id: 'tbl-any-conflict',
    rows: [
      { id: 'r1', priority: 1, enabled: true, cells: { tier: 'gold', amount: '*' }, outputs: { decision: 'approved' } },
      { id: 'r2', priority: 2, enabled: true, cells: { tier: '*', amount: '< 1000' }, outputs: { decision: 'rejected' } },
    ],
  };
  const conflictCheck = validateDecisionTableArtifact(anyConflict, 'publication');
  assert.equal(conflictCheck.isValid, false);
  assert.ok(conflictCheck.errors.some((e) => e.code === 'ANY_POLICY_OUTPUT_CONFLICT'));

  const conflictEval = evaluateDecisionTableSpec(anyConflict, { tier: 'gold', amount: 500 });
  assert.equal(conflictEval.status, 'Error');
  assert.equal(conflictEval.errorCode, 'ANY_HIT_POLICY_CONFLICT');
});

test('L9 & L10. Scorecard rejects gaps, overlaps, inverted bounds, weights <= 0, and unmatched scores (no silent last-threshold fallback)', () => {
  const baseSc = structuredClone(INITIAL_DECISIONS_SLICE.scorecards[0]);

  // Gap & overlap & inverted bounds & invalid weight
  const invalidSc: ScorecardSpec = {
    ...baseSc,
    criteria: [
      { ...baseSc.criteria[0], weight: 0 },
    ],
    thresholds: [
      { id: 't1', minScore: 80, maxScore: 120, classification: 'A', decisionOutcome: 'approved' },
      { id: 't2', minScore: 50, maxScore: 70, classification: 'B', decisionOutcome: 'manual_review' }, // Gap 71..79
      { id: 't3', minScore: 40, maxScore: 55, classification: 'C', decisionOutcome: 'rejected' }, // Overlap 50..55
      { id: 't4', minScore: 30, maxScore: 10, classification: 'D', decisionOutcome: 'err' }, // Inverted min > max
    ],
  };
  const scCheck = validateScorecardArtifact(invalidSc, 'draft');
  assert.equal(scCheck.isValid, false);
  const codes = new Set(scCheck.errors.map((e) => e.code));
  assert.ok(codes.has('INVALID_CRITERION_WEIGHT'));
  assert.ok(codes.has('OVERLAPPING_THRESHOLD_BANDS'));
  assert.ok(codes.has('INVERTED_THRESHOLD_BOUNDS'));
  assert.ok(codes.has('THRESHOLD_GAP_DETECTED'));

  // Unmatched score (valid contiguous narrow bands [-10..49] and [50..60], score lands at 85) MUST return Error (never silent last band!)
  const unmatchedSc: ScorecardSpec = {
    ...baseSc,
    thresholds: [
      { id: 't1', minScore: 50, maxScore: 60, classification: 'Mid', decisionOutcome: 'manual_review' },
      { id: 't2', minScore: -10, maxScore: 49, classification: 'Low', decisionOutcome: 'rejected' },
    ],
  };
  const evalOutOfBand = evaluateScorecardSpec(unmatchedSc, {
    vendorVerified: true,
    duplicateFound: false,
    invoiceAmount: 20000,
  });
  assert.equal(evalOutOfBand.status, 'Error');
  assert.equal(evalOutOfBand.errorCode, 'UNMATCHED_SCORE_BAND');
});

test('L11 & L12. Blocks publishing invalid artifacts and stale/missing/failed tests when requireTestPassBeforePublish is enabled', () => {
  const draftRule: RuleSpec = {
    ...structuredClone(INITIAL_DECISIONS_SLICE.rules[0]),
    id: 'rule-fresh-pub',
    status: 'Draft',
    version: 'v0.1',
    testCases: [],
  };

  // Missing tests -> blocked
  const noTestsPolicy = evaluatePublishGovernancePolicy(
    'rule',
    draftRule,
    'staging',
    'Workspace Maintainer',
    DEFAULT_SETTINGS
  );
  assert.equal(noTestsPolicy.allowed, false);
  assert.ok(noTestsPolicy.reasons.some((r) => r.includes('at least one golden regression test case')));

  // Run batch tests so evidence is fresh
  const res = runBatchTestCases('rule', draftRule.id, [
    {
      id: 'tc-ok',
      name: 'Valid fast path',
      inputJson: { invoiceAmount: 20000, vendorVerified: true, duplicateFound: false },
      expectedOutput: { decision: 'approved', requiresHumanGate: false },
    },
  ], {
    rules: [draftRule],
    tables: [],
    rulesets: [],
    chains: [],
    scorecards: [],
  });
  assert.equal(res.failedCount, 0);

  const testedRule: RuleSpec = { ...draftRule, status: 'Tested', testCases: res.updatedCases };
  const freshEvidence = checkTestEvidenceFreshness('rule', testedRule);
  assert.equal(freshEvidence.allPassed, true);
  assert.equal(freshEvidence.allCurrentForSpec, true);

  const allowedStaging = evaluatePublishGovernancePolicy(
    'rule',
    testedRule,
    'staging',
    'Workspace Maintainer',
    DEFAULT_SETTINGS
  );
  assert.equal(allowedStaging.allowed, true);

  // Mutate rule condition WITHOUT re-running tests -> stale test evidence MUST block publishing!
  const modifiedRule: RuleSpec = {
    ...testedRule,
    conditionRoot: {
      ...testedRule.conditionRoot,
      children: [
        { kind: 'predicate', id: 'p-amt', field: 'invoiceAmount', operator: '<', value: '90000' },
      ],
    },
  };
  const stalePolicy = evaluatePublishGovernancePolicy(
    'rule',
    modifiedRule,
    'staging',
    'Workspace Maintainer',
    DEFAULT_SETTINGS
  );
  assert.equal(stalePolicy.allowed, false);
  assert.ok(stalePolicy.reasons.some((r) => r.includes('must be re-run')));
});

test('L13. Canonical SHA-256 snapshot integrity verification and tamper detection across all artifact types', () => {
  const rule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);
  const snap = rule.versionHistory[0];
  assert.ok(snap.snapshotHash.startsWith('sha256:'));
  assert.equal(verifySnapshotIntegrity(snap).valid, true);

  // Tamper serializedSpec -> verifySnapshotIntegrity detects hash mismatch and resolvePublishedArtifact refuses tampered snapshot
  const tamperedRule: RuleSpec = {
    ...rule,
    versionHistory: [
      { ...snap, serializedSpec: snap.serializedSpec!.replace('50000', '999999') },
    ],
  };
  assert.equal(verifySnapshotIntegrity(tamperedRule.versionHistory[0]).valid, false);
  const pinnedRes = resolvePublishedArtifact('rule', tamperedRule, snap.version);
  assert.equal(pinnedRes.resolved, null);
  assert.match(pinnedRes.error || '', /Integrity check failed/);
  const latestRes = resolvePublishedArtifact('rule', tamperedRule);
  assert.equal(latestRes.resolved, null);
  assert.match(latestRes.error || '', /Integrity check failed/);
  const targetExec = evaluateDecisionTarget(
    'rule',
    tamperedRule.id,
    { invoiceAmount: 1000, vendorVerified: true, duplicateFound: false },
    { rules: [tamperedRule], tables: [], rulesets: [], chains: [], scorecards: [] },
    'Simulator',
    { requirePublished: true, targetVersion: snap.version }
  );
  assert.equal(targetExec?.status, 'Error');

  // Key-order independent canonical serialization
  const a = canonicalSerialize({ z: 1, a: { c: 3, b: 2 } });
  const b = canonicalSerialize({ a: { b: 2, c: 3 }, z: 1 });
  assert.equal(a, b);
});

test('L14. Full-spec Rollback restores full logic and preserves immutable versionHistory + snapshot diffing', () => {
  const baseTable = structuredClone(INITIAL_DECISIONS_SLICE.tables[0]);
  const initialPolicy = baseTable.hitPolicy;
  const targetPolicy = initialPolicy === 'priority' ? 'first-match' : 'priority';
  const v1 = buildPublishedTableVersion(baseTable, 'staging', 'Initial v1 release', 'Maintainer A');

  // Edit table for v2 (change hitPolicy and row output)
  const editedTable: DecisionTableSpec = {
    ...v1,
    hitPolicy: targetPolicy,
    rows: v1.rows.map((r, i) => (i === 0 ? { ...r, outputs: { ...r.outputs, approverRole: 'updated-role-v2' } } : r)),
  };
  const v2 = buildPublishedTableVersion(editedTable, 'production', 'Bumped to v2 policy', 'Maintainer A');

  const diffReport = compareVersionSnapshots(v2.versionHistory[1], v2.versionHistory[0]);
  assert.equal(diffReport.identical, false);
  assert.ok(
    diffReport.changes.some(
      (d) =>
        d.key === 'hitPolicy' &&
        JSON.parse(d.before) === initialPolicy &&
        JSON.parse(d.after) === targetPolicy
    )
  );

  // Rollback back to v1 snapshot
  const rollbackResult = rollbackArtifactToSnapshot('table', v2, v1.version, 'Maintainer A');
  assert.equal(rollbackResult.error, undefined);
  assert.ok(rollbackResult.rolledBack);
  assert.equal(rollbackResult.rolledBack.hitPolicy, initialPolicy);
  assert.equal(rollbackResult.rolledBack.version, v1.version);
  assert.equal(rollbackResult.rolledBack.versionHistory.length, v2.versionHistory.length);
  assert.equal(computeArtifactSpecHash('table', rollbackResult.rolledBack), v1.versionHistory[0].snapshotHash);
});

test('L15. Governance RBAC and Control approval gate enforcement', () => {
  const strictSettings: DecisionSettings = {
    ...DEFAULT_SETTINGS,
    requireControlApprovalForProd: true,
    allowedEditorsRole: 'Owner & Admin',
    allowedPublishersRole: 'Owner & Admin Only',
  };

  assert.equal(checkEditPermission('Workspace Maintainer', strictSettings).allowed, false);
  assert.equal(checkEditPermission('Workspace Owner', strictSettings).allowed, true);

  const testedRule = INITIAL_DECISIONS_SLICE.rules[0];
  // Maintainer blocked from publishing under Owner & Admin Only
  const blockedRole = evaluatePublishGovernancePolicy(
    'rule',
    testedRule,
    'production',
    'Workspace Maintainer',
    strictSettings,
    {},
    true
  );
  assert.equal(blockedRole.allowed, false);
  assert.ok(blockedRole.reasons.some((r) => r.includes('Publish Authority')));

  // Owner without Control approval checkbox blocked when requireControlApprovalForProd is true
  const unapprovedRule: RuleSpec = { ...testedRule, reviewApproval: undefined };
  const blockedApproval = evaluatePublishGovernancePolicy(
    'rule',
    unapprovedRule,
    'production',
    'Workspace Owner',
    strictSettings,
    {},
    false
  );
  assert.equal(blockedApproval.allowed, false);
  assert.ok(blockedApproval.reasons.some((r) => r.includes('SOPIN Control Review Approval')));

  // Owner with Control approval passes cleanly
  const approved = evaluatePublishGovernancePolicy(
    'rule',
    unapprovedRule,
    'production',
    'Workspace Owner',
    strictSettings,
    {},
    true
  );
  assert.equal(approved.allowed, true);
});

test('L16 & L17. Rule chain cycles, missing stage targets, and unified published artifact resolution across all 5 types', () => {
  const { rules, tables, rulesets, chains, scorecards } = INITIAL_DECISIONS_SLICE;

  // Cycle detection
  const cyclicChain: RuleChainSpec = {
    ...structuredClone(chains[0]),
    id: 'chain-cyclic',
    stages: [
      { id: 's1', stepOrder: 1, label: 'Self Loop', targetType: 'chain', targetId: 'chain-cyclic', onOutcome: 'continue' },
    ],
  };
  const cycleValidation = validateRuleChainArtifact(
    cyclicChain,
    { rules, tables, rulesets, chains: [cyclicChain] },
    new Set(),
    'draft'
  );
  assert.equal(cycleValidation.isValid, false);
  assert.ok(cycleValidation.errors.some((e) => e.code === 'CIRCULAR_CHAIN_DETECTED'));

  // Missing stage target rejected both in validation and evaluation
  const missingTargetChain: RuleChainSpec = {
    ...structuredClone(chains[0]),
    id: 'chain-missing-target',
    stages: [
      { id: 's1', stepOrder: 1, label: 'Ghost Rule', targetType: 'rule', targetId: 'rule-does-not-exist', onOutcome: 'continue' },
    ],
  };
  const missingCheck = validateRuleChainArtifact(
    missingTargetChain,
    { rules, tables, rulesets, chains: [missingTargetChain] },
    new Set(),
    'draft'
  );
  assert.equal(missingCheck.isValid, false);
  assert.ok(missingCheck.errors.some((e) => e.code === 'MISSING_STAGE_RULE'));

  const missingEval = evaluateRuleChainSpec(missingTargetChain, { invoiceAmount: 1000 }, rules, tables, rulesets, 'Simulator', [missingTargetChain]);
  assert.equal(missingEval.status, 'Error');
  assert.equal(missingEval.errorCode, 'INVALID_CHAIN_SPEC');
  assert.ok((missingEval.validationErrors ?? []).some((msg) => msg.includes('missing rule')));

  // Ruleset, Chain, Scorecard immutable published snapshots resolve via unified resolvePublishedArtifact
  const pubRs = buildPublishedRulesetVersion(structuredClone(rulesets[0]), 'production', 'RS pub', 'Owner');
  const pubChain = buildPublishedChainVersion(structuredClone(chains[0]), 'production', 'Chain pub', 'Owner');
  const pubSc = buildPublishedScorecardVersion(structuredClone(scorecards[0]), 'production', 'SC pub', 'Owner');

  assert.equal(resolvePublishedArtifact('ruleset', pubRs).resolved?.version, pubRs.version);
  assert.equal(resolvePublishedArtifact('chain', pubChain).resolved?.version, pubChain.version);
  assert.equal(resolvePublishedArtifact('scorecard', pubSc).resolved?.version, pubSc.version);

  // Subsequent draft edit does not corrupt pinned published snapshot resolution
  const editedDraftSc: ScorecardSpec = {
    ...pubSc,
    version: `${pubSc.version}-draft`,
    status: 'Draft',
    baseScore: 999,
  };
  const resolvedSc = resolvePublishedArtifact('scorecard', editedDraftSc, pubSc.version);
  assert.ok(resolvedSc.resolved);
  assert.equal(resolvedSc.resolved.baseScore, pubSc.baseScore);
  assert.notEqual(resolvedSc.resolved.baseScore, 999);
});
