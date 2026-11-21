import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublishedRuleVersion,
  evaluateDecisionTableSpec,
  evaluateDecisionTarget,
  evaluateRuleChainSpec,
  evaluateRuleSpec,
  evaluateRulesetSpec,
  extractMappedInputs,
  resolvePublishedRuleSpec,
  runBatchTestCases,
  runSingleTestCase,
  synthesizeRuleDraftFromNL,
  validateDecisionsSlice,
  validateRuleSpec,
} from '../evaluator';
import { INITIAL_DECISIONS_SLICE } from '../seedData';
import {
  DecisionTableSpec,
  DecisionTestCase,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
} from '../types';

const collections = {
  rules: INITIAL_DECISIONS_SLICE.rules,
  tables: INITIAL_DECISIONS_SLICE.tables,
  rulesets: INITIAL_DECISIONS_SLICE.rulesets,
  chains: INITIAL_DECISIONS_SLICE.chains,
  scorecards: INITIAL_DECISIONS_SLICE.scorecards,
};

test('01. Simple IF/ELSE rule evaluation emits THEN and ELSE deterministically', () => {
  const simpleRule: RuleSpec = {
    ...INITIAL_DECISIONS_SLICE.rules[0],
    id: 'rule-simple-discount',
    name: 'VIP Order Discount',
    inputSchema: [
      { name: 'customerTier', type: 'string', required: true, description: 'Tier' },
    ],
    conditionRoot: {
      kind: 'group',
      id: 'g-1',
      logic: 'AND',
      children: [
        { kind: 'predicate', id: 'p-1', field: 'customerTier', operator: '==', value: 'vip' },
      ],
    },
    thenOutputs: [{ key: 'discountPct', valueExpression: '15', type: 'number' }],
    elseOutputs: [{ key: 'discountPct', valueExpression: '0', type: 'number' }],
  };

  const passRes = evaluateRuleSpec(simpleRule, { customerTier: 'vip' });
  assert.equal(passRes.status, 'Matched');
  assert.equal(passRes.finalOutput.discountPct, 15);
  assert.equal(passRes.evaluatedConditions[0].passed, true);

  const failRes = evaluateRuleSpec(simpleRule, { customerTier: 'standard' });
  assert.equal(failRes.status, 'Fallback');
  assert.equal(failRes.finalOutput.discountPct, 0);
  assert.equal(failRes.evaluatedConditions[0].passed, false);
});

test('02. Multiple AND conditions require all predicates true', () => {
  const invoiceRule = INITIAL_DECISIONS_SLICE.rules[0];
  const approved = evaluateRuleSpec(invoiceRule, {
    invoiceAmount: 35000,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(approved.status, 'Matched');
  assert.equal(approved.finalOutput.decision, 'approved');
  assert.equal(approved.finalOutput.requiresHumanGate, false);
  assert.equal(approved.evaluatedConditions.length, 3);
  assert.ok(approved.evaluatedConditions.every((c) => c.passed));
  assert.ok((approved.executionTrace?.length ?? 0) >= 4);

  const failedDup = evaluateRuleSpec(invoiceRule, {
    invoiceAmount: 35000,
    vendorVerified: true,
    duplicateFound: true,
  });
  assert.equal(failedDup.status, 'Fallback');
  assert.equal(failedDup.finalOutput.decision, 'manual_review');
  assert.equal(failedDup.finalOutput.requiresHumanGate, true);
});

test('03. Multiple OR conditions match when any single predicate passes', () => {
  const orRule: RuleSpec = {
    ...INITIAL_DECISIONS_SLICE.rules[0],
    id: 'rule-or-escalation',
    name: 'Urgent Escalation Trigger',
    inputSchema: [
      { name: 'country', type: 'string', required: true, description: 'Country code' },
      { name: 'isSanctioned', type: 'boolean', required: true, description: 'Flag' },
      { name: 'tags', type: 'array', required: false, description: 'Tags' },
    ],
    conditionRoot: {
      kind: 'group',
      id: 'g-or',
      logic: 'OR',
      children: [
        { kind: 'predicate', id: 'p-sanct', field: 'isSanctioned', operator: '==', value: 'true' },
        { kind: 'predicate', id: 'p-country', field: 'country', operator: 'in', value: '[KP, IR]' },
        { kind: 'predicate', id: 'p-tag', field: 'tags', operator: 'contains', value: 'fraud-hold' },
      ],
    },
    thenOutputs: [{ key: 'decision', valueExpression: 'escalate_compliance', type: 'string' }],
    elseOutputs: [{ key: 'decision', valueExpression: 'clear', type: 'string' }],
  };

  const matchedByTag = evaluateRuleSpec(orRule, {
    country: 'IN',
    isSanctioned: false,
    tags: ['priority', 'fraud-hold'],
  });
  assert.equal(matchedByTag.status, 'Matched');
  assert.equal(matchedByTag.finalOutput.decision, 'escalate_compliance');

  const missedAll = evaluateRuleSpec(orRule, {
    country: 'IN',
    isSanctioned: false,
    tags: ['priority'],
  });
  assert.equal(missedAll.status, 'Fallback');
  assert.equal(missedAll.finalOutput.decision, 'clear');
});

test('04. Nested AND / OR condition groups evaluate hierarchically', () => {
  const nestedRule: RuleSpec = {
    ...INITIAL_DECISIONS_SLICE.rules[0],
    id: 'rule-nested-credit',
    name: 'Nested Credit Approval',
    inputSchema: [
      { name: 'kycVerified', type: 'boolean', required: true, description: 'KYC' },
      { name: 'annualRevenue', type: 'number', required: true, description: 'Revenue' },
      { name: 'creditScore', type: 'number', required: true, description: 'Score' },
      { name: 'meta', type: 'object', required: true, description: 'Metadata object' },
    ],
    conditionRoot: {
      kind: 'group',
      id: 'g-root',
      logic: 'AND',
      children: [
        { kind: 'predicate', id: 'p-kyc', field: 'kycVerified', operator: '==', value: 'true' },
        { kind: 'predicate', id: 'p-meta', field: 'meta.domain', operator: 'ends_with', value: '.com' },
        {
          kind: 'group',
          id: 'g-sub-or',
          logic: 'OR',
          children: [
            { kind: 'predicate', id: 'p-rev', field: 'annualRevenue', operator: '>=', value: '1000000' },
            { kind: 'predicate', id: 'p-cred', field: 'creditScore', operator: 'between', value: '750', valueEnd: '900' },
          ],
        },
      ],
    },
    thenOutputs: [{ key: 'decision', valueExpression: 'approved', type: 'string' }],
    elseOutputs: [{ key: 'decision', valueExpression: 'declined', type: 'string' }],
  };

  const passNested = evaluateRuleSpec(nestedRule, {
    kycVerified: true,
    annualRevenue: 250000,
    creditScore: 780,
    meta: { domain: 'acme.com' },
  });
  assert.equal(passNested.status, 'Matched');
  assert.equal(passNested.finalOutput.decision, 'approved');

  const failNested = evaluateRuleSpec(nestedRule, {
    kycVerified: true,
    annualRevenue: 250000,
    creditScore: 680,
    meta: { domain: 'acme.com' },
  });
  assert.equal(failNested.status, 'Fallback');
  assert.equal(failNested.finalOutput.decision, 'declined');
});

test('05. Numeric & date boundary conditions behave strictly at thresholds', () => {
  const invoiceRule = INITIAL_DECISIONS_SLICE.rules[0];
  // Ceiling is strictly < 50000: 49999.99 matches, 50000 falls back to manual_review
  const justBelow = evaluateRuleSpec(invoiceRule, {
    invoiceAmount: 49999.99,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(justBelow.status, 'Matched');
  assert.equal(justBelow.finalOutput.decision, 'approved');

  const exactCeiling = evaluateRuleSpec(invoiceRule, {
    invoiceAmount: 50000,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(exactCeiling.status, 'Fallback');
  assert.equal(exactCeiling.finalOutput.decision, 'manual_review');

  // Also verify Date + Null + Exists operators
  const dateRule: RuleSpec = {
    ...invoiceRule,
    id: 'rule-date-boundary',
    inputSchema: [
      { name: 'contractDate', type: 'date', required: true, description: 'Contract ISO date' },
      { name: 'overrideNote', type: 'null', required: false, description: 'Nullable note' },
    ],
    conditionRoot: {
      kind: 'group',
      id: 'g-dt',
      logic: 'AND',
      children: [
        {
          kind: 'predicate',
          id: 'p-dt',
          field: 'contractDate',
          operator: 'between',
          value: '2026-01-01',
          valueEnd: '2026-12-31',
        },
        { kind: 'predicate', id: 'p-null', field: 'overrideNote', operator: 'is_empty', value: '' },
        { kind: 'predicate', id: 'p-ex', field: 'contractDate', operator: 'exists', value: '' },
      ],
    },
    thenOutputs: [{ key: 'validTerm', valueExpression: 'true', type: 'boolean' }],
    elseOutputs: [{ key: 'validTerm', valueExpression: 'false', type: 'boolean' }],
  };
  const dtRes = evaluateRuleSpec(dateRule, { contractDate: '2026-06-15', overrideNote: null });
  assert.equal(dtRes.status, 'Matched');
  assert.equal(dtRes.finalOutput.validTerm, true);
});

test('06. Missing required input validation returns Error with SCHEMA_VALIDATION_ERROR', () => {
  const invoiceRule = INITIAL_DECISIONS_SLICE.rules[0];
  const res = evaluateRuleSpec(invoiceRule, { invoiceAmount: 15000 });
  assert.equal(res.status, 'Error');
  assert.equal(res.errorCode, 'SCHEMA_VALIDATION_ERROR');
  assert.ok(res.validationErrors && res.validationErrors.length >= 2);
});

test('07. Invalid input types are rejected deterministically', () => {
  const invoiceRule = INITIAL_DECISIONS_SLICE.rules[0];
  const badTypes = evaluateRuleSpec(invoiceRule, {
    invoiceAmount: 'not-a-number',
    vendorVerified: 'yes-maybe',
    duplicateFound: false,
  });
  assert.equal(badTypes.status, 'Error');
  assert.equal(badTypes.errorCode, 'SCHEMA_VALIDATION_ERROR');
  assert.ok(badTypes.validationErrors?.some((e) => e.includes('invoiceAmount')));
  assert.ok(badTypes.validationErrors?.some((e) => e.includes('vendorVerified')));
});

test('08. Decision table first-match and priority execution', () => {
  const tbl = INITIAL_DECISIONS_SLICE.tables[0];
  const dupRes = evaluateDecisionTableSpec(tbl, {
    invoiceAmount: 15000,
    vendorVerified: true,
    duplicateFound: true,
    region: 'IN',
  });
  assert.equal(dupRes.status, 'Matched');
  assert.equal(dupRes.finalOutput.decision, 'rejected');
  assert.equal(dupRes.finalOutput.approverRole, 'ap-fraud-review');
  assert.match(dupRes.explanation, /Row #1/);

  const secTbl = INITIAL_DECISIONS_SLICE.tables[1]; // first-match policy
  const secRes = evaluateDecisionTableSpec(secTbl, { dataClass: 'public', processesPii: false });
  assert.equal(secRes.status, 'Matched');
  assert.equal(secRes.finalOutput.decision, 'approved');
});

test('09. Decision table multiple-match handling (collect-all vs unique conflict rejection)', () => {
  const baseTable = INITIAL_DECISIONS_SLICE.tables[1];
  const collectTable: DecisionTableSpec = {
    ...baseTable,
    id: 'tbl-collect',
    hitPolicy: 'collect-all',
    rows: [
      { id: 'r1', priority: 1, enabled: true, cells: { dataClass: 'restricted', processesPii: '*' }, outputs: { tag: 'ciso-review' } },
      { id: 'r2', priority: 2, enabled: true, cells: { dataClass: '*', processesPii: '== true' }, outputs: { tag: 'dpo-log' } },
    ],
  };

  const collectRes = evaluateDecisionTableSpec(collectTable, {
    dataClass: 'restricted',
    processesPii: true,
  });
  assert.equal(collectRes.status, 'Matched');
  assert.equal(collectRes.finalOutput.matchedCount, 2);
  assert.equal((collectRes.finalOutput.outcomes as unknown[]).length, 2);

  // Unique policy must reject simultaneous row overlaps
  const uniqueTable: DecisionTableSpec = { ...collectTable, id: 'tbl-unique', hitPolicy: 'unique' };
  const uniqueRes = evaluateDecisionTableSpec(uniqueTable, {
    dataClass: 'restricted',
    processesPii: true,
  });
  assert.equal(uniqueRes.status, 'Error');
  assert.equal(uniqueRes.errorCode, 'UNIQUE_HIT_POLICY_VIOLATION');
});

test('10. Decision table & Ruleset no-match fallback returns configured defaults', () => {
  const tbl = INITIAL_DECISIONS_SLICE.tables[1]; // public/false & restricted/true
  const noMatchTbl = evaluateDecisionTableSpec(tbl, {
    dataClass: 'internal',
    processesPii: false,
  });
  assert.equal(noMatchTbl.status, 'Fallback');
  assert.equal(noMatchTbl.finalOutput.decision, 'manual_review');
  assert.equal(noMatchTbl.finalOutput.reviewer, 'compliance-lead');

  const rs = INITIAL_DECISIONS_SLICE.rulesets[0];
  const noMatchRs = evaluateRulesetSpec(
    rs,
    { invoiceAmount: 65000, vendorVerified: false, duplicateFound: false, region: 'EU' },
    collections.rules,
    collections.tables
  );
  assert.equal(noMatchRs.status, 'Fallback');
  assert.equal(noMatchRs.finalOutput.decision, 'manual_review');
});

test('11. Ruleset execution honors priority order, conflict resolution, and stopOnMatch', () => {
  const rs = INITIAL_DECISIONS_SLICE.rulesets[0];
  const merged = evaluateRulesetSpec(
    rs,
    { invoiceAmount: 29000, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections.rules,
    collections.tables
  );
  assert.equal(merged.status, 'Matched');
  assert.equal(merged.finalOutput.decision, 'approved');
  assert.equal(merged.finalOutput.requiresHumanGate, false);
  assert.equal(merged.matchedRules.length, 2);

  const firstMatchRs: RulesetSpec = { ...rs, conflictResolution: 'first-match', stopOnMatch: true };
  const stoppedEarly = evaluateRulesetSpec(
    firstMatchRs,
    { invoiceAmount: 29000, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections.rules,
    collections.tables
  );
  assert.equal(stoppedEarly.matchedRules.length, 1);
  assert.equal(stoppedEarly.finalOutput.approverRole, 'none-auto');
});

test('12. Rule-chain execution passes selected outputs forward and stops on terminal outcomes', () => {
  const chain = INITIAL_DECISIONS_SLICE.chains[0];
  // Clean invoice: Stage 1 passes decision='approved' -> Stage 2 condition (!= 'rejected') opens -> Stage 2 matches
  const chainApproved = evaluateRuleChainSpec(
    chain,
    { invoiceAmount: 31000, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections.rules,
    collections.tables,
    collections.rulesets,
    'Simulator',
    collections.chains
  );
  assert.equal(chainApproved.status, 'Matched');
  assert.ok((chainApproved.executionPath?.length ?? 0) >= 2);
  assert.equal(chainApproved.finalOutput.decision, 'approved');

  // Duplicate invoice: Stage 2 matrix produces decision='rejected' -> terminal stop
  const chainRejected = evaluateRuleChainSpec(
    chain,
    { invoiceAmount: 18000, vendorVerified: true, duplicateFound: true, region: 'IN' },
    collections.rules,
    collections.tables,
    collections.rulesets,
    'Simulator',
    collections.chains
  );
  assert.equal(chainRejected.finalOutput.decision, 'rejected');
  assert.ok(chainRejected.executionPath?.some((p) => p.includes('Terminal Stop')));
});

test('13. Circular-chain rejection prevents infinite loops deterministically', () => {
  const chainA: RuleChainSpec = {
    id: 'chain-a',
    workspaceId: 'ws-core',
    name: 'Chain A',
    description: 'Cyclic A',
    isDemoData: false,
    stages: [
      { id: 's1', stepOrder: 1, label: 'Call Chain B', targetType: 'chain', targetId: 'chain-b', onOutcome: 'continue' },
    ],
    testCases: [],
    version: 'v0.1',
    environment: 'development',
    status: 'Draft',
    versionHistory: [],
    updatedAt: 'Now',
  };
  const chainB: RuleChainSpec = {
    id: 'chain-b',
    workspaceId: 'ws-core',
    name: 'Chain B',
    description: 'Cyclic B',
    isDemoData: false,
    stages: [
      { id: 's2', stepOrder: 1, label: 'Call Chain A', targetType: 'chain', targetId: 'chain-a', onOutcome: 'continue' },
    ],
    testCases: [],
    version: 'v0.1',
    environment: 'development',
    status: 'Draft',
    versionHistory: [],
    updatedAt: 'Now',
  };

  const cyclicRes = evaluateRuleChainSpec(
    chainA,
    { invoiceAmount: 1000 },
    collections.rules,
    collections.tables,
    collections.rulesets,
    'Simulator',
    [chainA, chainB]
  );
  assert.equal(cyclicRes.status, 'Error');
  assert.equal(cyclicRes.errorCode, 'CIRCULAR_CHAIN_DETECTED');
  assert.ok(cyclicRes.validationErrors?.[0].toLowerCase().includes('circular'));
});

test('14. Published-version consistency: Draft edits do not mutate immutable published v1.2 execution', () => {
  const basePublished = INITIAL_DECISIONS_SLICE.rules[0]; // v1.2 published (< 50000)
  // Publish an initial immutable snapshot then edit working copy as Draft (< 5000)
  const publishedV2 = buildPublishedRuleVersion(
    basePublished,
    'production',
    'Immutable v1.3 snapshot',
    'Release Bot',
    'v1.3'
  );
  const draftEdited: RuleSpec = {
    ...publishedV2,
    status: 'Draft',
    version: 'v1.4-draft',
    conditionRoot: {
      ...publishedV2.conditionRoot,
      children: [
        { kind: 'predicate', id: 'p-amt', field: 'invoiceAmount', operator: '<', value: '5000' },
        { kind: 'predicate', id: 'p-ver', field: 'vendorVerified', operator: '==', value: 'true' },
        { kind: 'predicate', id: 'p-dup', field: 'duplicateFound', operator: '==', value: 'false' },
      ],
    },
  };

  // Draft fails ₹35,000 because draft ceiling was lowered to ₹5,000
  const draftEval = evaluateRuleSpec(draftEdited, {
    invoiceAmount: 35000,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(draftEval.finalOutput.decision, 'manual_review');

  // Resolving & executing immutable published v1.3 still evaluates ₹50,000 ceiling identically
  const { resolved } = resolvePublishedRuleSpec(draftEdited, 'v1.3');
  assert.ok(resolved);
  const pinnedExec = evaluateDecisionTarget(
    'rule',
    draftEdited.id,
    { invoiceAmount: 35000, vendorVerified: true, duplicateFound: false },
    { ...collections, rules: [draftEdited] },
    'SOPIN Flow',
    { requirePublished: true, targetVersion: 'v1.3' }
  );
  assert.equal(pinnedExec?.versionUsed, 'v1.3');
  assert.equal(pinnedExec?.finalOutput.decision, 'approved');
});

test('15. Regression test runner executes single & batch suites and exposes diffs on failure', () => {
  const rule = INITIAL_DECISIONS_SLICE.rules[0];
  const passingBatch = runBatchTestCases('rule', rule.id, rule.testCases, collections);
  assert.equal(passingBatch.passedCount, 3);
  assert.equal(passingBatch.failedCount, 0);

  const failingCase: DecisionTestCase = {
    id: 'tc-fail-check',
    name: 'Intentional expectation mismatch',
    inputJson: { invoiceAmount: 78000, vendorVerified: true, duplicateFound: false },
    expectedOutput: { decision: 'approved' },
  };
  const { updatedCase } = runSingleTestCase('rule', rule.id, failingCase, collections);
  assert.equal(updatedCase.lastPassed, false);
  assert.ok((updatedCase.diffNotes?.length ?? 0) > 0);
  assert.ok((updatedCase.failedConditions?.length ?? 0) > 0);
});

test('16. Security: unsafe expressions are blocked and eval/Function are never used', () => {
  const unsafeRule: RuleSpec = {
    ...INITIAL_DECISIONS_SLICE.rules[0],
    thenOutputs: [{ key: 'hack', valueExpression: 'eval("1+1")', type: 'expression' }],
  };
  const validation = validateRuleSpec(unsafeRule);
  assert.equal(validation.valid, false);
  const exec = evaluateRuleSpec(unsafeRule, {
    invoiceAmount: 1000,
    vendorVerified: true,
    duplicateFound: false,
  });
  assert.equal(exec.status, 'Error');
  assert.equal(exec.errorCode, 'INVALID_RULE_SPEC');
});

test('17. AI Draft Synthesizer produces Draft-only validated specs and never auto-publishes', () => {
  const synthesis = synthesizeRuleDraftFromNL(
    'Approve an invoice automatically when amount is below 50000 and vendor is verified and no duplicate exists.',
    'ws-core'
  );
  assert.equal(synthesis.ruleDraft.status, 'Draft');
  assert.equal(synthesis.ruleDraft.versionHistory.length, 0);
  assert.equal(validateRuleSpec(synthesis.ruleDraft).valid, true);
});

test('18. Corrupted storage recovery and SOPIN Flow input mapping work deterministically', () => {
  const { slice, recoveredIssues } = validateDecisionsSlice(
    { rules: ['corrupted', { id: 'bad' }], tables: 'invalid' },
    INITIAL_DECISIONS_SLICE
  );
  assert.ok(recoveredIssues.length >= 2);
  assert.equal(slice.rules.length, INITIAL_DECISIONS_SLICE.rules.length);

  const mapped = extractMappedInputs(
    { payload: { invoiceAmount: 35000, vendorVerified: true, duplicateFound: false } },
    {
      invoiceAmount: 'payload.invoiceAmount',
      vendorVerified: 'payload.vendorVerified',
      duplicateFound: 'payload.duplicateFound',
    }
  );
  assert.deepEqual(mapped, { invoiceAmount: 35000, vendorVerified: true, duplicateFound: false });
});
