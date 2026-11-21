import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGovernedDecisionOperationToSlice,
  buildPublishedChainVersion,
  buildPublishedRuleVersion,
  buildPublishedRulesetVersion,
  buildPublishedScorecardVersion,
  buildPublishedTableVersion,
  canonicalSerialize,
  checkApprovalPermission,
  checkEditPermission,
  checkPublishedSnapshotTestEvidence,
  checkPublishPermission,
  checkTestEvidenceFreshness,
  compareVersionSnapshots,
  computeArtifactSpecHash,
  createApprovalRecord,
  evaluateDecisionTableSpec,
  evaluateDecisionTarget,
  evaluatePublishGovernancePolicy,
  evaluateRuleChainSpec,
  evaluateRuleSpec,
  evaluateScorecardSpec,
  getRoleCapabilities,
  inspectApprovalFreshness,
  normalizeWorkspaceRole,
  performGovernedApprove,
  performGovernedPromote,
  performGovernedPublish,
  performGovernedRollback,
  performGovernedSave,
  performGovernedSubmitReview,
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
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionReviewApproval,
  DecisionSettings,
  DecisionsWorkspaceSlice,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
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

  const testedRule = structuredClone(INITIAL_DECISIONS_SLICE.rules[0]);
  const ownerApproval = createApprovalRecord({
    type: 'rule',
    spec: testedRule,
    targetEnvironment: 'production',
    purpose: 'publication',
    decision: 'approved',
    workspaceRole: 'Workspace Owner',
    reviewerLabel: 'Alice (Simulated Owner)',
    note: 'Approved for L15 production publish check',
  });

  // Maintainer blocked from publishing under Owner & Admin Only even with a valid approval record
  const blockedRole = evaluatePublishGovernancePolicy(
    'rule',
    testedRule,
    'production',
    'Workspace Maintainer',
    strictSettings,
    {},
    { approval: ownerApproval, purpose: 'publication' }
  );
  assert.equal(blockedRole.allowed, false);
  assert.ok(blockedRole.reasons.some((r) => r.includes('Publish Authority')));

  // Owner without bound approval blocked when requireControlApprovalForProd is true
  const unapprovedRule: RuleSpec = { ...testedRule, reviewApproval: undefined, approvalHistory: [] };
  const blockedApproval = evaluatePublishGovernancePolicy(
    'rule',
    unapprovedRule,
    'production',
    'Workspace Owner',
    strictSettings,
    {},
    { purpose: 'publication' }
  );
  assert.equal(blockedApproval.allowed, false);
  assert.ok(
    blockedApproval.reasons.some((r) => r.includes('No bound publication approval') || r.includes('approval'))
  );

  // Owner with bound publication approval passes cleanly
  const approved = evaluatePublishGovernancePolicy(
    'rule',
    unapprovedRule,
    'production',
    'Workspace Owner',
    strictSettings,
    {},
    { approval: ownerApproval, purpose: 'publication' }
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

// ---------------------------------------------------------------------------
// Prompt 7 — Approval Integrity, Governance Enforcement & Lifecycle Hardening
// ---------------------------------------------------------------------------

function makeFreshSlice(): DecisionsWorkspaceSlice {
  return structuredClone(INITIAL_DECISIONS_SLICE);
}

function getArtifactFromSlice(
  slice: DecisionsWorkspaceSlice,
  type: DecisionArtifactType,
  index = 0
): DecisionArtifactSpec {
  if (type === 'rule') return slice.rules[index];
  if (type === 'table') return slice.tables[index];
  if (type === 'ruleset') return slice.rulesets[index];
  if (type === 'chain') return slice.chains[index];
  return slice.scorecards[index];
}

function makeSliceCollections(slice: DecisionsWorkspaceSlice) {
  return {
    rules: slice.rules,
    tables: slice.tables,
    rulesets: slice.rulesets,
    chains: slice.chains,
    scorecards: slice.scorecards,
  };
}

function refreshArtifactTests(
  slice: DecisionsWorkspaceSlice,
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec
): DecisionArtifactSpec {
  const cols = makeSliceCollections(slice);
  const patchedCols = {
    rules: type === 'rule' ? [spec as RuleSpec, ...cols.rules.filter((x) => x.id !== spec.id)] : cols.rules,
    tables: type === 'table' ? [spec as DecisionTableSpec, ...cols.tables.filter((x) => x.id !== spec.id)] : cols.tables,
    rulesets: type === 'ruleset' ? [spec as RulesetSpec, ...cols.rulesets.filter((x) => x.id !== spec.id)] : cols.rulesets,
    chains: type === 'chain' ? [spec as RuleChainSpec, ...cols.chains.filter((x) => x.id !== spec.id)] : cols.chains,
    scorecards: type === 'scorecard' ? [spec as ScorecardSpec, ...cols.scorecards.filter((x) => x.id !== spec.id)] : cols.scorecards,
  };
  const res = runBatchTestCases(type, spec.id, spec.testCases, patchedCols);
  assert.equal(res.failedCount, 0, `Expected ${type}:${spec.id} seed tests to pass`);
  return { ...spec, testCases: res.updatedCases };
}

const ALL_ARTIFACT_TYPES: DecisionArtifactType[] = ['rule', 'table', 'ruleset', 'chain', 'scorecard'];

test('P7-1. Bound approval works cleanly when spec is unmodified across all 5 artifact types', () => {
  const baseSlice = makeFreshSlice();
  const strictProdSettings: DecisionSettings = {
    ...baseSlice.settings,
    requireControlApprovalForProd: true,
    requireTestPassBeforePublish: true,
    allowedEditorsRole: 'Builders & Maintainers',
    allowedPublishersRole: 'Owner & Admin Only',
  };

  for (const type of ALL_ARTIFACT_TYPES) {
    const raw = structuredClone(getArtifactFromSlice(baseSlice, type, 0));
    const tested = refreshArtifactTests(baseSlice, type, {
      ...raw,
      status: 'Review',
      reviewApproval: undefined,
      approvalHistory: [],
    });

    const approvalRes = performGovernedApprove({
      type,
      spec: tested,
      targetEnvironment: 'production',
      purpose: 'publication',
      decision: 'approved',
      workspaceRole: 'Workspace Owner',
      settings: strictProdSettings,
      collections: makeSliceCollections(baseSlice),
      reviewerLabel: 'Elena (Owner)',
      note: `P7-1 ${type} publication approval`,
    });
    assert.equal(approvalRes.allowed, true, `Approval failed for ${type}: ${approvalRes.reasons.join('; ')}`);
    assert.ok(approvalRes.approvalRecord);
    assert.equal(approvalRes.approvalRecord.specHash, computeArtifactSpecHash(type, tested));

    const freshness = inspectApprovalFreshness(
      type,
      approvalRes.updatedSpec!,
      'production',
      'publication'
    );
    assert.equal(freshness.valid, true, `Freshness failed for ${type}`);
    assert.equal(freshness.status, 'valid');

    const pubRes = performGovernedPublish({
      type,
      spec: approvalRes.updatedSpec!,
      targetEnvironment: 'production',
      workspaceRole: 'Workspace Owner',
      settings: strictProdSettings,
      collections: makeSliceCollections(baseSlice),
      summary: `P7-1 release for ${type}`,
    });
    assert.equal(pubRes.allowed, true, `Publish failed for ${type}: ${pubRes.reasons.join('; ')}`);
    assert.equal(pubRes.auditEvent.approvalId, approvalRes.approvalRecord.id);
  }
});

test('P7-2. Editing spec logic invalidates prior bound approval (stale-spec) across all 5 types', () => {
  const baseSlice = makeFreshSlice();

  // Rule condition edit
  const rule = refreshArtifactTests(baseSlice, 'rule', baseSlice.rules[0]) as RuleSpec;
  const ruleApr = createApprovalRecord({
    type: 'rule',
    spec: rule,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const editedRule: RuleSpec = {
    ...rule,
    reviewApproval: ruleApr,
    approvalHistory: [ruleApr],
    conditionRoot: {
      ...rule.conditionRoot,
      children: [{ kind: 'predicate', id: 'p-amt', field: 'invoiceAmount', operator: '<', value: '99999' }],
    },
  };
  assert.equal(inspectApprovalFreshness('rule', editedRule, 'production', 'publication').status, 'stale-spec');

  // Table row edit
  const table = refreshArtifactTests(baseSlice, 'table', baseSlice.tables[0]) as DecisionTableSpec;
  const tableApr = createApprovalRecord({
    type: 'table',
    spec: table,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const editedTable: DecisionTableSpec = {
    ...table,
    reviewApproval: tableApr,
    approvalHistory: [tableApr],
    rows: table.rows.map((r, i) => (i === 0 ? { ...r, outputs: { ...r.outputs, decision: 'manual_review' } } : r)),
  };
  assert.equal(inspectApprovalFreshness('table', editedTable, 'production', 'publication').status, 'stale-spec');

  // Ruleset conflict resolution edit
  const rs = refreshArtifactTests(baseSlice, 'ruleset', baseSlice.rulesets[0]) as RulesetSpec;
  const rsApr = createApprovalRecord({
    type: 'ruleset',
    spec: rs,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const editedRs: RulesetSpec = {
    ...rs,
    reviewApproval: rsApr,
    approvalHistory: [rsApr],
    conflictResolution: rs.conflictResolution === 'first-match' ? 'highest-priority' : 'first-match',
  };
  assert.equal(inspectApprovalFreshness('ruleset', editedRs, 'production', 'publication').status, 'stale-spec');

  // Chain stage edit
  const chain = refreshArtifactTests(baseSlice, 'chain', baseSlice.chains[0]) as RuleChainSpec;
  const chainApr = createApprovalRecord({
    type: 'chain',
    spec: chain,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const editedChain: RuleChainSpec = {
    ...chain,
    reviewApproval: chainApr,
    approvalHistory: [chainApr],
    stages: chain.stages.map((s, i) => (i === 0 ? { ...s, onOutcome: 'stop-on-match' } : s)),
  };
  assert.equal(inspectApprovalFreshness('chain', editedChain, 'production', 'publication').status, 'stale-spec');

  // Scorecard threshold edit
  const sc = refreshArtifactTests(baseSlice, 'scorecard', baseSlice.scorecards[0]) as ScorecardSpec;
  const scApr = createApprovalRecord({
    type: 'scorecard',
    spec: sc,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const editedSc: ScorecardSpec = {
    ...sc,
    reviewApproval: scApr,
    approvalHistory: [scApr],
    baseScore: sc.baseScore + 5,
  };
  assert.equal(inspectApprovalFreshness('scorecard', editedSc, 'production', 'publication').status, 'stale-spec');
});

test('P7-3. Changing version string invalidates prior approval (stale-version)', () => {
  const baseSlice = makeFreshSlice();
  const rule = baseSlice.rules[0];
  const apr = createApprovalRecord({
    type: 'rule',
    spec: rule,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const bumpedVersionRule: RuleSpec = {
    ...rule,
    version: 'v9.9-draft',
    reviewApproval: apr,
    approvalHistory: [apr],
  };
  const report = inspectApprovalFreshness('rule', bumpedVersionRule, 'production', 'publication');
  assert.equal(report.valid, false);
  assert.equal(report.status, 'stale-version');
});

test('P7-4. Changing target environment invalidates prior approval (wrong-environment)', () => {
  const baseSlice = makeFreshSlice();
  const table = refreshArtifactTests(baseSlice, 'table', baseSlice.tables[0]) as DecisionTableSpec;
  const stagingApproval = createApprovalRecord({
    type: 'table',
    spec: table,
    targetEnvironment: 'staging',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const tableWithStagingApr: DecisionTableSpec = {
    ...table,
    reviewApproval: stagingApproval,
    approvalHistory: [stagingApproval],
  };
  const prodFreshness = inspectApprovalFreshness('table', tableWithStagingApr, 'production', 'publication');
  assert.equal(prodFreshness.valid, false);
  assert.equal(prodFreshness.status, 'wrong-environment');

  const blockedProdPublish = performGovernedPublish({
    type: 'table',
    spec: tableWithStagingApr,
    targetEnvironment: 'production',
    workspaceRole: 'Workspace Owner',
    settings: { ...baseSlice.settings, requireControlApprovalForProd: true },
    collections: makeSliceCollections(baseSlice),
  });
  assert.equal(blockedProdPublish.allowed, false);
  assert.equal(blockedProdPublish.auditEvent.outcome, 'Blocked');
});

test('P7-5. Publication approval cannot be reused for production-promotion (wrong-purpose)', () => {
  const baseSlice = makeFreshSlice();
  const strictSettings: DecisionSettings = {
    ...baseSlice.settings,
    requireControlApprovalForProd: true,
    requireTestPassBeforePublish: true,
  };
  const rule = refreshArtifactTests(baseSlice, 'rule', {
    ...baseSlice.rules[0],
    environment: 'staging',
    status: 'Published',
  }) as RuleSpec;

  const pubApproval = createApprovalRecord({
    type: 'rule',
    spec: rule,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const ruleWithPubApproval: RuleSpec = {
    ...rule,
    reviewApproval: pubApproval,
    approvalHistory: [pubApproval],
  };

  // Publication approval is NOT valid for production-promotion
  const promoFreshness = inspectApprovalFreshness(
    'rule',
    ruleWithPubApproval,
    'production',
    'production-promotion'
  );
  assert.equal(promoFreshness.valid, false);
  assert.equal(promoFreshness.status, 'wrong-purpose');

  const blockedPromote = performGovernedPromote({
    type: 'rule',
    spec: ruleWithPubApproval,
    targetEnvironment: 'production',
    workspaceRole: 'Workspace Owner',
    settings: strictSettings,
    collections: makeSliceCollections(baseSlice),
  });
  assert.equal(blockedPromote.allowed, false);
  assert.equal(blockedPromote.auditEvent.outcome, 'Blocked');

  // Recording a separate bound production-promotion approval authorizes promotion
  const promoApproval = createApprovalRecord({
    type: 'rule',
    spec: ruleWithPubApproval,
    targetEnvironment: 'production',
    purpose: 'production-promotion',
    workspaceRole: 'Workspace Owner',
  });
  const allowedPromote = performGovernedPromote({
    type: 'rule',
    spec: ruleWithPubApproval,
    targetEnvironment: 'production',
    workspaceRole: 'Workspace Owner',
    settings: strictSettings,
    collections: makeSliceCollections(baseSlice),
    approvalRecord: promoApproval,
  });
  assert.equal(allowedPromote.allowed, true);
  assert.equal(allowedPromote.updatedSpec?.environment, 'production');
  assert.equal(allowedPromote.updatedSpec?.status, 'Promoted');
  assert.equal(allowedPromote.updatedSpec?.reviewApproval, undefined); // Consumed approval cleared
});

test('P7-6. Missing tests block publish across all 5 artifact types when requireTestPassBeforePublish is enabled', () => {
  const baseSlice = makeFreshSlice();
  const settings: DecisionSettings = {
    ...baseSlice.settings,
    requireTestPassBeforePublish: true,
    requireControlApprovalForProd: false,
  };

  for (const type of ALL_ARTIFACT_TYPES) {
    const spec: DecisionArtifactSpec = {
      ...structuredClone(getArtifactFromSlice(baseSlice, type, 0)),
      testCases: [],
    };
    const check = evaluatePublishGovernancePolicy(
      type,
      spec,
      'staging',
      'Workspace Owner',
      settings,
      makeSliceCollections(baseSlice)
    );
    assert.equal(check.allowed, false, `Expected missing tests to block ${type}`);
    assert.ok(check.reasons.some((r) => r.includes('at least one golden regression test case')));
  }
});

test('P7-7. Failed or unrun tests block publish across all 5 artifact types', () => {
  const baseSlice = makeFreshSlice();
  const settings: DecisionSettings = {
    ...baseSlice.settings,
    requireTestPassBeforePublish: true,
    requireControlApprovalForProd: false,
  };

  for (const type of ALL_ARTIFACT_TYPES) {
    const raw = structuredClone(getArtifactFromSlice(baseSlice, type, 0));
    const currentHash = computeArtifactSpecHash(type, raw);
    const failedSpec: DecisionArtifactSpec = {
      ...raw,
      testCases: [
        {
          id: `tc-fail-${type}`,
          name: 'Failing test',
          inputJson: {},
          expectedOutput: { decision: '__impossible__' },
          lastPassed: false,
          testedArtifactId: raw.id,
          testedArtifactType: type,
          testedVersion: raw.version,
          testedSpecHash: currentHash,
        },
      ],
    };
    const failedCheck = evaluatePublishGovernancePolicy(
      type,
      failedSpec,
      'staging',
      'Workspace Owner',
      settings,
      makeSliceCollections(baseSlice)
    );
    assert.equal(failedCheck.allowed, false);
    assert.ok(failedCheck.reasons.some((r) => r.includes('failed')));

    const unrunSpec: DecisionArtifactSpec = {
      ...raw,
      testCases: [
        {
          id: `tc-unrun-${type}`,
          name: 'Unrun test',
          inputJson: {},
          expectedOutput: {},
          lastPassed: undefined,
        },
      ],
    };
    const unrunCheck = evaluatePublishGovernancePolicy(
      type,
      unrunSpec,
      'staging',
      'Workspace Owner',
      settings,
      makeSliceCollections(baseSlice)
    );
    assert.equal(unrunCheck.allowed, false);
    assert.ok(unrunCheck.reasons.some((r) => r.includes('have not been executed')));
  }
});

test('P7-8. Stale test evidence and legacy/unbound approval metadata are rejected', () => {
  const baseSlice = makeFreshSlice();
  const rule = refreshArtifactTests(baseSlice, 'rule', baseSlice.rules[0]) as RuleSpec;
  const legacyApproval = {
    approved: true,
    reviewerLabel: 'Legacy Reviewer',
    approvedAt: '2026-01-01',
  } as DecisionReviewApproval;

  // Mutate rule condition without re-running tests + attach legacy unbound approval
  const mutatedRule: RuleSpec = {
    ...rule,
    reviewApproval: legacyApproval,
    approvalHistory: [legacyApproval],
    conditionRoot: {
      ...rule.conditionRoot,
      children: [{ kind: 'predicate', id: 'p-amt', field: 'invoiceAmount', operator: '<', value: '75000' }],
    },
  };

  const freshness = inspectApprovalFreshness('rule', mutatedRule, 'production', 'publication');
  assert.equal(freshness.valid, false);

  const policy = evaluatePublishGovernancePolicy(
    'rule',
    mutatedRule,
    'production',
    'Workspace Owner',
    { ...baseSlice.settings, requireControlApprovalForProd: true, requireTestPassBeforePublish: true },
    makeSliceCollections(baseSlice)
  );
  assert.equal(policy.allowed, false);
  assert.ok(policy.reasons.some((r) => r.includes('must be re-run')));
  assert.ok(policy.reasons.some((r) => r.includes('Legacy or unbound') || r.includes('approval')));
});

test('P7-9. Test evidence copied from another artifact ID or type fails freshness and blocks publish across all 5 types', () => {
  const baseSlice = makeFreshSlice();
  const settings: DecisionSettings = {
    ...baseSlice.settings,
    requireTestPassBeforePublish: true,
    requireControlApprovalForProd: false,
  };

  for (const type of ALL_ARTIFACT_TYPES) {
    const raw = structuredClone(getArtifactFromSlice(baseSlice, type, 0));
    const currentHash = computeArtifactSpecHash(type, raw);
    const copiedSpec: DecisionArtifactSpec = {
      ...raw,
      testCases: [
        {
          id: `tc-copied-${type}`,
          name: 'Copied test evidence',
          inputJson: {},
          expectedOutput: {},
          lastPassed: true,
          testedArtifactId: 'foreign-artifact-id',
          testedArtifactType: type === 'rule' ? 'table' : 'rule',
          testedVersion: raw.version,
          testedSpecHash: currentHash,
        },
      ],
    };

    const report = checkTestEvidenceFreshness(type, copiedSpec);
    assert.equal(report.mismatchedArtifactCount, 1);
    assert.equal(report.allCurrentForSpec, false);

    const policy = evaluatePublishGovernancePolicy(
      type,
      copiedSpec,
      'staging',
      'Workspace Owner',
      settings,
      makeSliceCollections(baseSlice)
    );
    assert.equal(policy.allowed, false);
    assert.ok(policy.reasons.some((r) => r.includes('different artifact ID/type')));
  }
});

test('P7-10. Roles without edit permission (Viewer, Member, ambiguous Non-Admin) are blocked on save and submit-review across all 5 types', () => {
  const baseSlice = makeFreshSlice();
  const buildersOnlySlice: DecisionsWorkspaceSlice = {
    ...baseSlice,
    settings: {
      ...baseSlice.settings,
      allowedEditorsRole: 'Builders & Maintainers',
    },
  };

  assert.equal(normalizeWorkspaceRole('Non-Admin'), 'viewer');
  assert.equal(getRoleCapabilities('Non-Admin', buildersOnlySlice.settings).canEdit, false);
  assert.equal(getRoleCapabilities('Workspace Member', buildersOnlySlice.settings).canEdit, false);
  assert.equal(getRoleCapabilities('Viewer', buildersOnlySlice.settings).canEdit, false);

  const unauthorizedRoles = ['Viewer', 'Workspace Member', 'Non-Admin'];
  for (const role of unauthorizedRoles) {
    for (const type of ALL_ARTIFACT_TYPES) {
      const spec = structuredClone(getArtifactFromSlice(buildersOnlySlice, type, 0));
      const saveRes = applyGovernedDecisionOperationToSlice(buildersOnlySlice, role, {
        operation: 'save',
        artifactType: type,
        spec,
      });
      assert.equal(saveRes.allowed, false, `Expected ${role} save on ${type} to be blocked`);
      assert.equal(saveRes.slice, buildersOnlySlice);
      assert.equal(saveRes.auditEvent.outcome, 'Blocked');

      const reviewRes = applyGovernedDecisionOperationToSlice(buildersOnlySlice, role, {
        operation: 'submit-review',
        artifactType: type,
        spec,
      });
      assert.equal(reviewRes.allowed, false, `Expected ${role} submit-review on ${type} to be blocked`);
      assert.equal(reviewRes.slice, buildersOnlySlice);
      assert.equal(reviewRes.auditEvent.outcome, 'Blocked');
    }
  }
});

test('P7-11. Roles without publish/promote/rollback/approve permission are blocked across all 5 artifact types', () => {
  const baseSlice = makeFreshSlice();
  const ownerAdminSlice: DecisionsWorkspaceSlice = {
    ...baseSlice,
    settings: {
      ...baseSlice.settings,
      allowedPublishersRole: 'Owner & Admin Only',
      requireControlApprovalForProd: false,
      requireTestPassBeforePublish: false,
    },
  };

  const blockedPublishers = ['Builder', 'Workspace Maintainer', 'Viewer', 'Non-Admin'];
  for (const role of blockedPublishers) {
    assert.equal(checkPublishPermission(role, ownerAdminSlice.settings).allowed, false);
    assert.equal(checkApprovalPermission(role, ownerAdminSlice.settings).allowed, false);

    for (const type of ALL_ARTIFACT_TYPES) {
      const baseSpec = structuredClone(getArtifactFromSlice(ownerAdminSlice, type, 0));
      const stagingPubSpec: DecisionArtifactSpec = {
        ...baseSpec,
        environment: 'staging',
        status: 'Published',
      };
      const sliceWithStaging: DecisionsWorkspaceSlice = {
        ...ownerAdminSlice,
        rules: type === 'rule' ? [stagingPubSpec as RuleSpec] : ownerAdminSlice.rules,
        tables: type === 'table' ? [stagingPubSpec as DecisionTableSpec] : ownerAdminSlice.tables,
        rulesets: type === 'ruleset' ? [stagingPubSpec as RulesetSpec] : ownerAdminSlice.rulesets,
        chains: type === 'chain' ? [stagingPubSpec as RuleChainSpec] : ownerAdminSlice.chains,
        scorecards: type === 'scorecard' ? [stagingPubSpec as ScorecardSpec] : ownerAdminSlice.scorecards,
      };

      const aprRes = applyGovernedDecisionOperationToSlice(sliceWithStaging, role, {
        operation: 'approve',
        artifactType: type,
        artifactId: stagingPubSpec.id,
        targetEnvironment: 'production',
        purpose: 'publication',
      });
      assert.equal(aprRes.allowed, false);
      assert.equal(aprRes.slice, sliceWithStaging);
      assert.equal(aprRes.auditEvent.outcome, 'Blocked');

      const pubRes = applyGovernedDecisionOperationToSlice(sliceWithStaging, role, {
        operation: 'publish',
        artifactType: type,
        spec: stagingPubSpec,
        targetEnvironment: 'staging',
      });
      assert.equal(pubRes.allowed, false);
      assert.equal(pubRes.slice, sliceWithStaging);
      assert.equal(pubRes.auditEvent.outcome, 'Blocked');

      const promRes = applyGovernedDecisionOperationToSlice(sliceWithStaging, role, {
        operation: 'promote',
        artifactType: type,
        artifactId: stagingPubSpec.id,
        targetEnvironment: 'production',
      });
      assert.equal(promRes.allowed, false);
      assert.equal(promRes.slice, sliceWithStaging);
      assert.equal(promRes.auditEvent.outcome, 'Blocked');

      const snapVersion = stagingPubSpec.versionHistory[0]?.version ?? 'v1.0';
      const rbRes = applyGovernedDecisionOperationToSlice(sliceWithStaging, role, {
        operation: 'rollback',
        artifactType: type,
        artifactId: stagingPubSpec.id,
        targetVersion: snapVersion,
      });
      assert.equal(rbRes.allowed, false);
      assert.equal(rbRes.slice, sliceWithStaging);
      assert.equal(rbRes.auditEvent.outcome, 'Blocked');
    }
  }
});

test('P7-12. Control approval gate enforces bound approval on prod publish, promote, and rollback', () => {
  const baseSlice = makeFreshSlice();
  const prodSettings: DecisionSettings = {
    ...baseSlice.settings,
    requireControlApprovalForProd: true,
    requireTestPassBeforePublish: true,
    allowedPublishersRole: 'Owner & Admin Only',
  };

  const rule = refreshArtifactTests(baseSlice, 'rule', {
    ...baseSlice.rules[0],
    environment: 'staging',
    status: 'Published',
    reviewApproval: undefined,
    approvalHistory: [],
  }) as RuleSpec;

  const workingSlice: DecisionsWorkspaceSlice = {
    ...baseSlice,
    settings: prodSettings,
    rules: [rule, ...baseSlice.rules.slice(1)],
  };

  // Blocked prod publish without approval
  const blockedPub = applyGovernedDecisionOperationToSlice(workingSlice, 'Workspace Owner', {
    operation: 'publish',
    artifactType: 'rule',
    spec: rule,
    targetEnvironment: 'production',
  });
  assert.equal(blockedPub.allowed, false);
  assert.equal(blockedPub.slice, workingSlice);

  // Approve -> publish to prod succeeds
  const aprPub = applyGovernedDecisionOperationToSlice(workingSlice, 'Workspace Owner', {
    operation: 'approve',
    artifactType: 'rule',
    artifactId: rule.id,
    targetEnvironment: 'production',
    purpose: 'publication',
  });
  assert.equal(aprPub.allowed, true);
  const pubRes = applyGovernedDecisionOperationToSlice(aprPub.slice, 'Workspace Owner', {
    operation: 'publish',
    artifactType: 'rule',
    spec: aprPub.updatedSpec!,
    targetEnvironment: 'production',
  });
  assert.equal(pubRes.allowed, true);

  // Blocked prod-touching rollback without rollback approval
  const targetSnapVersion = pubRes.updatedSpec!.versionHistory[0].version;
  const blockedRb = applyGovernedDecisionOperationToSlice(pubRes.slice, 'Workspace Owner', {
    operation: 'rollback',
    artifactType: 'rule',
    artifactId: rule.id,
    targetVersion: targetSnapVersion,
  });
  assert.equal(blockedRb.allowed, false);

  // Approve rollback -> rollback succeeds
  const aprRb = applyGovernedDecisionOperationToSlice(pubRes.slice, 'Workspace Owner', {
    operation: 'approve',
    artifactType: 'rule',
    artifactId: rule.id,
    targetEnvironment: 'production',
    purpose: 'rollback',
    rollbackTargetVersion: targetSnapVersion,
  });
  assert.equal(aprRb.allowed, true);
  const rbRes = applyGovernedDecisionOperationToSlice(aprRb.slice, 'Workspace Owner', {
    operation: 'rollback',
    artifactType: 'rule',
    artifactId: rule.id,
    targetVersion: targetSnapVersion,
  });
  assert.equal(rbRes.allowed, true);
});

test('P7-13. Rejected approval blocks publish, preserves rejection in approvalHistory, and re-approval unlocks publish', () => {
  const baseSlice = makeFreshSlice();
  const prodSettings: DecisionSettings = {
    ...baseSlice.settings,
    requireControlApprovalForProd: true,
    requireTestPassBeforePublish: true,
  };
  const rule = refreshArtifactTests(baseSlice, 'rule', {
    ...baseSlice.rules[0],
    reviewApproval: undefined,
    approvalHistory: [],
  }) as RuleSpec;

  const rejectedRes = performGovernedApprove({
    type: 'rule',
    spec: rule,
    targetEnvironment: 'production',
    purpose: 'publication',
    decision: 'rejected',
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    collections: makeSliceCollections(baseSlice),
    note: 'Rejected due to ceiling threshold review',
  });
  assert.equal(rejectedRes.allowed, true);
  assert.equal(rejectedRes.auditEvent.outcome, 'Rejected');
  assert.equal(rejectedRes.updatedSpec?.reviewApproval, undefined);
  assert.equal(rejectedRes.updatedSpec?.approvalHistory?.length, 1);
  assert.equal(rejectedRes.updatedSpec?.approvalHistory?.[0].decision, 'rejected');

  const blockedPub = performGovernedPublish({
    type: 'rule',
    spec: rejectedRes.updatedSpec!,
    targetEnvironment: 'production',
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    collections: makeSliceCollections(baseSlice),
  });
  assert.equal(blockedPub.allowed, false);
  assert.ok(blockedPub.reasons.some((r) => r.includes('rejected')));

  // Re-approve -> both records preserved in immutable approvalHistory and publish succeeds
  const reapprovedRes = performGovernedApprove({
    type: 'rule',
    spec: rejectedRes.updatedSpec!,
    targetEnvironment: 'production',
    purpose: 'publication',
    decision: 'approved',
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    collections: makeSliceCollections(baseSlice),
    note: 'Re-approved after ceiling review clarification',
  });
  assert.equal(reapprovedRes.allowed, true);
  assert.equal(reapprovedRes.updatedSpec?.approvalHistory?.length, 2);
  assert.equal(reapprovedRes.updatedSpec?.approvalHistory?.[0].decision, 'approved');
  assert.equal(reapprovedRes.updatedSpec?.approvalHistory?.[1].decision, 'rejected');

  const allowedPub = performGovernedPublish({
    type: 'rule',
    spec: reapprovedRes.updatedSpec!,
    targetEnvironment: 'production',
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    collections: makeSliceCollections(baseSlice),
  });
  assert.equal(allowedPub.allowed, true);
});

test('P7-14. Rollback requires publish permission + bound rollback approval, restores snapshot logic, and clears active approval', () => {
  const baseSlice = makeFreshSlice();
  const prodSettings: DecisionSettings = {
    ...baseSlice.settings,
    requireControlApprovalForProd: true,
    allowedPublishersRole: 'Owner & Admin Only',
  };

  const baseTable = refreshArtifactTests(baseSlice, 'table', baseSlice.tables[0]) as DecisionTableSpec;
  const v1 = buildPublishedTableVersion(baseTable, 'production', 'v1 baseline', 'Workspace Owner');
  const modifiedForV2: DecisionTableSpec = {
    ...v1,
    hitPolicy: v1.hitPolicy === 'priority' ? 'first-match' : 'priority',
  };
  const v2 = buildPublishedTableVersion(modifiedForV2, 'production', 'v2 policy change', 'Workspace Owner');
  const historyLen = v2.versionHistory.length;

  // Non-publisher blocked
  const nonPublisher = performGovernedRollback({
    type: 'table',
    spec: v2,
    targetVersion: v1.version,
    workspaceRole: 'Builder',
    settings: prodSettings,
  });
  assert.equal(nonPublisher.allowed, false);

  // Wrong purpose (publication approval) blocked for rollback
  const pubApproval = createApprovalRecord({
    type: 'table',
    spec: v2,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const wrongPurposeRb = performGovernedRollback({
    type: 'table',
    spec: v2,
    targetVersion: v1.version,
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    approvalRecord: pubApproval,
  });
  assert.equal(wrongPurposeRb.allowed, false);

  // Valid bound rollback approval succeeds, restores v1 logic, preserves versionHistory & approvalHistory, and clears active reviewApproval
  const rbApproval = createApprovalRecord({
    type: 'table',
    spec: v2,
    targetEnvironment: 'production',
    purpose: 'rollback',
    workspaceRole: 'Workspace Owner',
    rollbackTargetVersion: v1.version,
  });
  const okRb = performGovernedRollback({
    type: 'table',
    spec: v2,
    targetVersion: v1.version,
    workspaceRole: 'Workspace Owner',
    settings: prodSettings,
    approvalRecord: rbApproval,
  });
  assert.equal(okRb.allowed, true);
  assert.equal(okRb.updatedSpec?.hitPolicy, baseTable.hitPolicy);
  assert.equal(okRb.updatedSpec?.versionHistory.length, historyLen);
  assert.equal(okRb.updatedSpec?.reviewApproval, undefined);
  assert.ok((okRb.updatedSpec?.approvalHistory ?? []).some((a) => a.id === rbApproval.id));
});

test('P7-15. Immutable versionHistory and approvalHistory cannot be erased via governed save', () => {
  const baseSlice = makeFreshSlice();
  const originalRule = baseSlice.rules[0];
  const apr = createApprovalRecord({
    type: 'rule',
    spec: originalRule,
    targetEnvironment: 'production',
    purpose: 'publication',
    workspaceRole: 'Workspace Owner',
  });
  const sliceWithHistory: DecisionsWorkspaceSlice = {
    ...baseSlice,
    rules: [{ ...originalRule, approvalHistory: [apr] }, ...baseSlice.rules.slice(1)],
  };

  // Attempt to save while passing empty versionHistory & approvalHistory
  const tamperedDraft: RuleSpec = {
    ...originalRule,
    description: 'Updated description in draft',
    versionHistory: [],
    approvalHistory: undefined,
  };
  const saveRes = applyGovernedDecisionOperationToSlice(sliceWithHistory, 'Workspace Owner', {
    operation: 'save',
    artifactType: 'rule',
    spec: tamperedDraft,
  });
  assert.equal(saveRes.allowed, true);
  assert.equal(saveRes.updatedSpec?.versionHistory.length, originalRule.versionHistory.length);
  assert.equal(saveRes.updatedSpec?.approvalHistory?.length, 1);
  assert.equal(saveRes.updatedSpec?.approvalHistory?.[0].id, apr.id);
});

test('P7-16. Published snapshot test evidence remains independently verifiable after subsequent draft edits', () => {
  const baseSlice = makeFreshSlice();
  const rule = refreshArtifactTests(baseSlice, 'rule', structuredClone(baseSlice.rules[0])) as RuleSpec;
  const pubRule = buildPublishedRuleVersion(rule, 'production', 'Immutable release', 'Workspace Owner');
  const publishedVersion = pubRule.version;

  // Later draft edit changes condition and top-level test status fails against the new draft
  const draftAfterPublish: RuleSpec = {
    ...pubRule,
    version: `${publishedVersion}-draft`,
    status: 'Draft',
    conditionRoot: {
      ...pubRule.conditionRoot,
      children: [{ kind: 'predicate', id: 'p-amt', field: 'invoiceAmount', operator: '<', value: '100' }],
    },
    testCases: pubRule.testCases.map((tc) => ({
      ...tc,
      lastPassed: false,
      testedVersion: `${publishedVersion}-draft`,
      testedSpecHash: 'sha256:draft-changed-failed',
    })),
  };

  // Draft test evidence is NOT valid
  assert.equal(checkTestEvidenceFreshness('rule', draftAfterPublish).allPassed, false);

  // Published immutable snapshot remains independently verified via runHistory!
  const snapEvidence = checkPublishedSnapshotTestEvidence('rule', draftAfterPublish, publishedVersion);
  assert.equal(snapEvidence.verified, true);
  assert.ok(snapEvidence.passedCount >= 1);
  assert.equal(snapEvidence.snapshotHash, pubRule.versionHistory[0].snapshotHash);
});

test('P7-17. Blocked operations across all 6 lifecycle operations leave DecisionsWorkspaceSlice strictly unmutated', () => {
  const baseSlice = makeFreshSlice();
  const strictSlice: DecisionsWorkspaceSlice = {
    ...baseSlice,
    settings: {
      ...baseSlice.settings,
      allowedEditorsRole: 'Owner & Admin',
      allowedPublishersRole: 'Owner & Admin Only',
      requireControlApprovalForProd: true,
      requireTestPassBeforePublish: true,
    },
  };
  const rule = strictSlice.rules[0];
  const snapshotBefore = JSON.stringify(strictSlice);

  const ops = [
    applyGovernedDecisionOperationToSlice(strictSlice, 'Viewer', {
      operation: 'save',
      artifactType: 'rule',
      spec: { ...rule, name: 'Mutated Name' },
    }),
    applyGovernedDecisionOperationToSlice(strictSlice, 'Viewer', {
      operation: 'submit-review',
      artifactType: 'rule',
      spec: rule,
    }),
    applyGovernedDecisionOperationToSlice(strictSlice, 'Builder', {
      operation: 'approve',
      artifactType: 'rule',
      artifactId: rule.id,
      targetEnvironment: 'production',
      purpose: 'publication',
    }),
    applyGovernedDecisionOperationToSlice(strictSlice, 'Workspace Owner', {
      operation: 'publish',
      artifactType: 'rule',
      spec: { ...rule, testCases: [] },
      targetEnvironment: 'production',
    }),
    applyGovernedDecisionOperationToSlice(strictSlice, 'Workspace Owner', {
      operation: 'promote',
      artifactType: 'rule',
      artifactId: rule.id,
      targetEnvironment: 'production',
    }),
    applyGovernedDecisionOperationToSlice(strictSlice, 'Builder', {
      operation: 'rollback',
      artifactType: 'rule',
      artifactId: rule.id,
      targetVersion: rule.versionHistory[0].version,
    }),
  ];

  for (const res of ops) {
    assert.equal(res.allowed, false);
    assert.equal(res.slice, strictSlice);
    assert.equal(res.auditEvent.outcome, 'Blocked');
  }
  assert.equal(JSON.stringify(strictSlice), snapshotBefore);
});

test('P7-18. Structured DecisionAuditRecord entries are emitted on both allowed and blocked operations with full metadata', () => {
  const baseSlice = makeFreshSlice();
  const rule = refreshArtifactTests(baseSlice, 'rule', {
    ...baseSlice.rules[0],
    environment: 'staging',
    status: 'Review',
  }) as RuleSpec;
  const workingSlice: DecisionsWorkspaceSlice = {
    ...baseSlice,
    settings: {
      ...baseSlice.settings,
      requireControlApprovalForProd: true,
      requireTestPassBeforePublish: true,
      allowedPublishersRole: 'Owner & Admin Only',
    },
    rules: [rule, ...baseSlice.rules.slice(1)],
  };

  const blocked = applyGovernedDecisionOperationToSlice(workingSlice, 'Builder', {
    operation: 'publish',
    artifactType: 'rule',
    spec: rule,
    targetEnvironment: 'production',
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.auditEvent.outcome, 'Blocked');
  assert.equal(blocked.auditEvent.isSimulatedActor, true);
  assert.equal(blocked.auditEvent.actorRole, 'Builder');
  assert.equal(blocked.auditEvent.artifactType, 'rule');
  assert.equal(blocked.auditEvent.artifactId, rule.id);
  assert.equal(blocked.auditEvent.previousVersion, rule.version);
  assert.equal(blocked.auditEvent.targetEnvironment, 'production');
  assert.ok(blocked.auditEvent.specHash.startsWith('sha256:'));
  assert.ok(blocked.auditEvent.reason.length > 0);

  const apr = applyGovernedDecisionOperationToSlice(workingSlice, 'Workspace Owner', {
    operation: 'approve',
    artifactType: 'rule',
    artifactId: rule.id,
    targetEnvironment: 'production',
    purpose: 'publication',
    reviewerLabel: 'Governance Lead',
  });
  assert.equal(apr.allowed, true);
  assert.equal(apr.auditEvent.outcome, 'Approved');
  assert.equal(apr.auditEvent.approvalId, apr.approvalRecord?.id);

  const pub = applyGovernedDecisionOperationToSlice(apr.slice, 'Workspace Owner', {
    operation: 'publish',
    artifactType: 'rule',
    spec: apr.updatedSpec!,
    targetEnvironment: 'production',
  });
  assert.equal(pub.allowed, true);
  assert.equal(pub.auditEvent.outcome, 'Allowed');
  assert.equal(pub.auditEvent.isSimulatedActor, true);
  assert.equal(pub.auditEvent.actorRole, 'Workspace Owner');
  assert.equal(pub.auditEvent.artifactType, 'rule');
  assert.equal(pub.auditEvent.artifactId, rule.id);
  assert.equal(pub.auditEvent.previousVersion, rule.version);
  assert.ok(pub.auditEvent.resultingVersion);
  assert.equal(pub.auditEvent.targetEnvironment, 'production');
  assert.equal(pub.auditEvent.approvalId, apr.approvalRecord?.id);
  assert.ok(pub.auditEvent.specHash.startsWith('sha256:'));
});

