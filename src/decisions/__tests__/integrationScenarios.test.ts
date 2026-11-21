import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeMultiAgentGraph,
  executeRuntimeDecision,
  executeWorkflowWithDecisions,
  invokeAgentDecision,
  redactSensitiveObject,
  resolveVariableBindings,
  validateDecisionNodeConfig,
  validateWorkflowPublishReadiness,
} from '../evaluator';
import { INITIAL_DECISIONS_SLICE } from '../seedData';
import {
  AgentConfig,
  KnowledgeDocument,
  MultiAgentGraphSpec,
  WorkflowConfig,
} from '../../app/types';

const collections = {
  rules: INITIAL_DECISIONS_SLICE.rules,
  tables: INITIAL_DECISIONS_SLICE.tables,
  rulesets: INITIAL_DECISIONS_SLICE.rulesets,
  chains: INITIAL_DECISIONS_SLICE.chains,
  scorecards: INITIAL_DECISIONS_SLICE.scorecards,
};

const sampleDocs: KnowledgeDocument[] = [
  {
    id: 'doc-adr-014',
    workspaceId: 'ws-core',
    title: 'ADR-014: Sandbox Isolation Policy',
    sourceType: 'MD',
    sizeLabel: '18 KB',
    status: 'Indexed',
    memoryTier: 'corpus',
    accessScope: 'Workspace Read-Only',
    checksum: 'sha256:81e9...c41',
    chunksCount: 14,
    excerpt: 'MCP tools run inside isolated ephemeral sandboxes.',
    structuredAttributes: { sandboxRequired: true, minCitationBenchmark: 3 },
    updatedAt: 'Today',
  },
  {
    id: 'doc-procurement-policy',
    workspaceId: 'ws-core',
    title: 'Q4-PROCUREMENT-BUDGET-LEDGER.xlsx',
    sourceType: 'XLSX',
    sizeLabel: '36 KB',
    status: 'Indexed',
    memoryTier: 'corpus',
    accessScope: 'Workspace Read-Only',
    checksum: 'sha256:7c42...a18',
    chunksCount: 11,
    excerpt: 'Q4 Engineering & Ops Procurement Budget Cap: ₹2,00,000 remaining.',
    structuredAttributes: { budgetRemaining: 200000, requiresHumanPoSignoff: true },
    updatedAt: 'Today',
  },
  {
    id: 'doc-sec-02',
    workspaceId: 'ws-core',
    title: 'SECURITY-SPEC-02: Scoped Credentials',
    sourceType: 'PDF',
    sizeLabel: '240 KB',
    status: 'Indexed',
    memoryTier: 'corpus',
    accessScope: 'Restricted Governance',
    checksum: 'sha256:4a11...f09',
    chunksCount: 28,
    excerpt: 'Scoped tokens expire per step.',
    structuredAttributes: { credentialTtlSeconds: 60 },
    updatedAt: 'Today',
  },
];

const scenarioAWorkflow: WorkflowConfig = {
  id: 'wf-invoice-decisions',
  workspaceId: 'ws-core',
  name: 'Scenario A · Invoice Approval Decision Flow',
  trigger: 'Webhook',
  triggerSpec: 'POST /hooks/ap-invoice-intake',
  version: 'v1.4',
  status: 'Published',
  isDemoData: true,
  updatedAt: 'Today',
  steps: [
    {
      id: 'st-inv-1',
      title: 'Invoice Intake & Schema Extraction',
      kind: 'action',
      detail: 'Extract invoiceAmount, vendorVerified, and region.',
      retryMax: 2,
      timeoutSec: 20,
      requiresApproval: false,
    },
    {
      id: 'st-inv-3',
      title: 'Decision Node: Invoice Approval Matrix',
      kind: 'decision',
      detail: 'Evaluate tbl-invoice-routing.',
      retryMax: 1,
      timeoutSec: 5,
      requiresApproval: false,
      decisionConfig: {
        targetType: 'table',
        targetId: 'tbl-invoice-routing',
        targetName: 'Vendor Invoice Approval Matrix',
        targetVersion: 'v1.4',
        versionPolicy: 'pinned',
        inputMappings: {},
        inputBindings: [
          { id: 'ib-1', targetField: 'invoiceAmount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'invoiceAmount' },
          { id: 'ib-2', targetField: 'vendorVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'vendorVerified' },
          { id: 'ib-3', targetField: 'duplicateFound', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'duplicateFound' },
          { id: 'ib-4', targetField: 'region', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'region' },
        ],
        outputMappings: { decision: 'decisionOutcome', approverRole: 'assignedApproverRole' },
        branchOutcomes: ['approved', 'manual_review', 'rejected'],
        branches: [
          { id: 'br-app', label: 'AUTO_APPROVE', matchField: 'decision', operator: '==', matchValue: 'approved', nextStepId: 'st-inv-erp' },
          { id: 'br-rev', label: 'MANUAL_REVIEW', matchField: 'decision', operator: '==', matchValue: 'manual_review', nextStepId: 'st-inv-4' },
          { id: 'br-rej', label: 'REJECT', matchField: 'decision', operator: '==', matchValue: 'rejected', nextStepId: 'st-inv-reject' },
          { id: 'br-fb', label: 'UNHANDLED_FALLBACK', matchField: 'decision', operator: '!=', matchValue: '', nextStepId: 'st-inv-4', isFallback: true },
        ],
        noMatchNextStepId: 'st-inv-4',
        failureNextStepId: 'st-inv-4',
        onErrorBehavior: 'retry-then-fallback',
      },
    },
    {
      id: 'st-inv-erp',
      title: 'Execute Straight-Through ERP Sync',
      kind: 'action',
      detail: 'Post verified invoice to ERP ledger.',
      retryMax: 1,
      timeoutSec: 20,
      requiresApproval: false,
      isEndStep: true,
    },
    {
      id: 'st-inv-4',
      title: 'Finance Controller Approval Gate',
      kind: 'approval',
      detail: 'SOPIN Control pauses execution for Finance Controller sign-off.',
      retryMax: 0,
      timeoutSec: 900,
      requiresApproval: true,
    },
    {
      id: 'st-inv-reject',
      title: 'Emit Duplicate / Policy Rejection Notice',
      kind: 'action',
      detail: 'Halt payment disbursement and notify AP fraud queue.',
      retryMax: 0,
      timeoutSec: 15,
      requiresApproval: false,
      isEndStep: true,
    },
  ],
};

const scenarioBWorkflow: WorkflowConfig = {
  id: 'wf-customer-onboarding',
  workspaceId: 'ws-core',
  name: 'Scenario B · Customer Onboarding & KYC Risk Flow',
  trigger: 'Webhook',
  triggerSpec: 'POST /hooks/customer-onboarding',
  version: 'v1.0',
  status: 'Published',
  isDemoData: true,
  updatedAt: 'Today',
  steps: [
    {
      id: 'st-ob-2',
      title: 'Decision Node: Eligibility Matrix',
      kind: 'decision',
      detail: 'Evaluate tbl-customer-onboarding.',
      retryMax: 1,
      timeoutSec: 5,
      requiresApproval: false,
      decisionConfig: {
        targetType: 'table',
        targetId: 'tbl-customer-onboarding',
        targetName: 'Customer Onboarding Eligibility Matrix',
        targetVersion: 'v1.0',
        versionPolicy: 'pinned',
        inputMappings: {},
        inputBindings: [
          { id: 'ob-b1', targetField: 'kycVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'kycVerified' },
          { id: 'ob-b2', targetField: 'creditScore', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'creditScore' },
          { id: 'ob-b3', targetField: 'countryRisk', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'countryRisk' },
        ],
        outputMappings: { decision: 'eligibilityDecision', riskClass: 'eligibilityRiskClass' },
        branchOutcomes: ['Continue to Risk Scorecard'],
        successNextStepId: 'st-ob-3',
        noMatchNextStepId: 'st-ob-3',
        failureNextStepId: 'st-ob-kyc',
        onErrorBehavior: 'fallback-branch',
      },
    },
    {
      id: 'st-ob-3',
      title: 'Decision Node: Risk Classification Scorecard',
      kind: 'decision',
      detail: 'Evaluate sc-customer-risk.',
      retryMax: 0,
      timeoutSec: 5,
      requiresApproval: false,
      decisionConfig: {
        targetType: 'scorecard',
        targetId: 'sc-customer-risk',
        targetName: 'Customer Onboarding Risk Scorecard',
        targetVersion: 'v1.0',
        versionPolicy: 'pinned',
        inputMappings: {},
        inputBindings: [
          { id: 'sc-b1', targetField: 'kycVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'kycVerified' },
          { id: 'sc-b2', targetField: 'creditScore', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'creditScore' },
        ],
        outputMappings: { decisionOutcome: 'decisionOutcome', classification: 'riskClassification' },
        branchOutcomes: ['approved', 'manual_review', 'rejected'],
        branches: [
          { id: 'br-ob-app', label: 'ONBOARD_APPROVED', matchField: 'decisionOutcome', operator: '==', matchValue: 'approved', nextStepId: 'st-ob-complete' },
          { id: 'br-ob-rev', label: 'KYC_MANUAL_REVIEW', matchField: 'decisionOutcome', operator: '==', matchValue: 'manual_review', nextStepId: 'st-ob-kyc' },
          { id: 'br-ob-rej', label: 'REJECT_HIGH_RISK', matchField: 'decisionOutcome', operator: '==', matchValue: 'rejected', nextStepId: 'st-ob-reject' },
          { id: 'br-ob-fb', label: 'FALLBACK_KYC', matchField: 'decisionOutcome', operator: '!=', matchValue: '', nextStepId: 'st-ob-kyc', isFallback: true },
        ],
        noMatchNextStepId: 'st-ob-kyc',
        failureNextStepId: 'st-ob-kyc',
        onErrorBehavior: 'fallback-branch',
      },
    },
    {
      id: 'st-ob-complete',
      title: 'Activate Customer Account',
      kind: 'action',
      detail: 'Provision workspace credentials.',
      retryMax: 1,
      timeoutSec: 15,
      requiresApproval: false,
      isEndStep: true,
    },
    {
      id: 'st-ob-kyc',
      title: 'KYC Compliance Manual Review Gate',
      kind: 'approval',
      detail: 'Compliance Analyst review.',
      retryMax: 0,
      timeoutSec: 900,
      requiresApproval: true,
    },
    {
      id: 'st-ob-reject',
      title: 'Record Onboarding Decline Notice',
      kind: 'action',
      detail: 'Decline due to high risk.',
      retryMax: 0,
      timeoutSec: 15,
      requiresApproval: false,
      isEndStep: true,
    },
  ],
};

const scenarioCWorkflow: WorkflowConfig = {
  id: 'wf-procurement-flow',
  workspaceId: 'ws-core',
  name: 'Scenario C · Procurement Budget & PO Gate',
  trigger: 'Manual',
  triggerSpec: 'Procurement Portal',
  version: 'v1.0',
  status: 'Published',
  isDemoData: true,
  updatedAt: 'Today',
  steps: [
    {
      id: 'st-proc-2',
      title: 'Decision Node: Procurement Budget Policy',
      kind: 'decision',
      detail: 'Bind SOPIN Context budgetRemaining + requestAmount.',
      retryMax: 1,
      timeoutSec: 5,
      requiresApproval: false,
      decisionConfig: {
        targetType: 'rule',
        targetId: 'rule-procurement-budget',
        targetName: 'Procurement Budget & Vendor Gate',
        targetVersion: 'v1.0',
        versionPolicy: 'pinned',
        inputMappings: {},
        inputBindings: [
          { id: 'pr-b1', targetField: 'requestAmount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'requestAmount' },
          { id: 'pr-b2', targetField: 'budgetRemaining', targetType: 'number', required: true, sourceKind: 'context', sourceRef: 'budgetRemaining', contextDocId: 'doc-procurement-policy' },
          { id: 'pr-b3', targetField: 'vendorRiskTier', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'vendorRiskTier' },
        ],
        outputMappings: { decision: 'budgetDecision', poLane: 'poLane' },
        branchOutcomes: ['All outcomes route to PO Gate'],
        branches: [
          { id: 'br-pr-app', label: 'STANDARD_PO_GATE', matchField: 'decision', operator: '==', matchValue: 'approved', nextStepId: 'st-proc-3' },
          { id: 'br-pr-fb', label: 'FALLBACK_PO_GATE', matchField: 'decision', operator: '!=', matchValue: '', nextStepId: 'st-proc-3', isFallback: true },
        ],
        noMatchNextStepId: 'st-proc-3',
        failureNextStepId: 'st-proc-3',
        onErrorBehavior: 'fallback-branch',
      },
    },
    {
      id: 'st-proc-3',
      title: 'Purchase Order Human Authorization Gate',
      kind: 'approval',
      detail: 'SOPIN Control requires explicit PO sign-off.',
      retryMax: 0,
      timeoutSec: 900,
      requiresApproval: true,
    },
  ],
};

const sampleAgents: AgentConfig[] = [
  {
    id: 'agt-pr-verifier',
    workspaceId: 'ws-core',
    name: 'PR Verification Agent',
    summary: 'Audits diffs and policies.',
    objective: 'Verify PR safety.',
    instructions: 'Cite ADR-014.',
    modelRoute: 'reasoning-structured',
    budgetCeilingUsd: 2.5,
    tools: ['git.diff', 'context.query'],
    knowledgeIds: ['doc-adr-014'],
    memoryTier: 'episodic',
    permissionMode: 'gated-write',
    successCriteria: 'Validated diff.',
    status: 'Published',
    version: 'v1.4',
    updatedAt: 'Today',
    attachedDecisions: [
      {
        id: 'adc-1',
        targetType: 'rule',
        targetId: 'rule-invoice-auto-approve',
        targetName: 'Invoice Auto-Approval Threshold',
        versionPolicy: 'pinned',
        pinnedVersion: 'v1.2',
        allowedExecution: 'read-evaluate',
        inputSchemaSummary: 'invoiceAmount, vendorVerified, duplicateFound',
        outputSchemaSummary: 'decision, requiresHumanGate',
        usageGuidance: 'Read-evaluate only.',
      },
      {
        id: 'adc-disabled',
        targetType: 'rule',
        targetId: 'rule-procurement-budget',
        targetName: 'Procurement Budget & Vendor Gate',
        versionPolicy: 'latest-published',
        allowedExecution: 'disabled',
        inputSchemaSummary: 'requestAmount, budgetRemaining, vendorRiskTier',
        outputSchemaSummary: 'decision, poLane',
        usageGuidance: 'Disabled policy.',
      },
    ],
  },
  {
    id: 'agt-research-brief',
    workspaceId: 'ws-core',
    name: 'Citation Brief Synthesizer',
    summary: 'Synthesizes grounded briefs.',
    objective: 'Compile research.',
    instructions: 'Only cite indexed corpus.',
    modelRoute: 'citation-audit',
    budgetCeilingUsd: 1.8,
    tools: ['context.query'],
    knowledgeIds: ['doc-adr-014'],
    memoryTier: 'corpus',
    permissionMode: 'read-only',
    successCriteria: 'Zero ungrounded claims.',
    status: 'Published',
    version: 'v1.1',
    updatedAt: 'Today',
  },
];

const scenarioDGraph: MultiAgentGraphSpec = {
  id: 'graph-research-compliance',
  workspaceId: 'ws-core',
  name: 'Research -> Decision -> Verification -> Approval Graph',
  description: '[Sample Demo Data] Isolated handoff multi-agent graph.',
  isDemoData: true,
  entryNodeId: 'gn-research',
  version: 'v1.0',
  status: 'Published',
  updatedAt: 'Today',
  nodes: [
    {
      id: 'gn-research',
      nodeType: 'agent',
      label: 'Citation Brief Synthesizer',
      agentId: 'agt-research-brief',
      allowedContextDocIds: ['doc-adr-014', 'doc-sec-02'], // doc-sec-02 is Restricted Governance
    },
    {
      id: 'gn-decision',
      nodeType: 'decision',
      label: 'Research Evidence Quality Decision',
      decisionConfig: {
        targetType: 'rule',
        targetId: 'rule-research-quality',
        targetName: 'Research Evidence Quality Gate',
        targetVersion: 'v1.0',
        versionPolicy: 'pinned',
        inputMappings: {
          citationCount: 'payload.citationCount',
          groundedScore: 'payload.groundedScore',
          contradictionCount: 'payload.contradictionCount',
        },
        branchOutcomes: ['sufficient_evidence -> Verifier'],
      },
    },
    {
      id: 'gn-verifier',
      nodeType: 'agent',
      label: 'PR Verification Agent',
      agentId: 'agt-pr-verifier',
      allowedContextDocIds: ['doc-adr-014'],
    },
    {
      id: 'gn-approval',
      nodeType: 'approval',
      label: 'Governance Release Approval Gate',
      requiredRole: 'Workspace Maintainer',
      approvalActionLabel: 'Approve Multi-Agent Packet',
    },
  ],
  edges: [
    {
      id: 'ge-1',
      fromNodeId: 'gn-research',
      toNodeId: 'gn-decision',
      label: 'Handoff Evidence Metrics',
      handoffMappings: {
        citationCount: 'citationCount',
        groundedScore: 'groundedScore',
        contradictionCount: 'contradictionCount',
      },
    },
    {
      id: 'ge-2',
      fromNodeId: 'gn-decision',
      toNodeId: 'gn-verifier',
      label: 'Pass Quality Gate',
      conditionField: 'decision',
      conditionOperator: '==',
      conditionValue: 'sufficient_evidence',
      handoffMappings: { decision: 'decision', qualityBand: 'qualityBand' },
    },
    {
      id: 'ge-3',
      fromNodeId: 'gn-decision',
      toNodeId: 'gn-approval',
      label: 'Fallback Loop',
      isFallback: true,
      handoffMappings: { decision: 'decision' },
    },
    {
      id: 'ge-4',
      fromNodeId: 'gn-verifier',
      toNodeId: 'gn-approval',
      label: 'Require Approval',
      handoffMappings: { lastAgent: 'lastAgent' },
    },
  ],
};

test('P3-01: Scenario A executes auto-approve, manual_review gate, and duplicate reject branches', () => {
  const autoRes = executeWorkflowWithDecisions(
    scenarioAWorkflow,
    { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections,
    sampleDocs
  );
  assert.equal(autoRes.status, 'completed');
  assert.equal(autoRes.workflowVars.decisionOutcome, 'approved');
  assert.equal(autoRes.decisionExecutions.length, 1);
  assert.ok(autoRes.steps.some((s) => s.label.includes('Straight-Through ERP Sync')));
  assert.ok(autoRes.unifiedTrace.children?.some((c) => c.kind === 'decision'));

  const reviewRes = executeWorkflowWithDecisions(
    scenarioAWorkflow,
    { invoiceAmount: 78000, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections,
    sampleDocs
  );
  assert.equal(reviewRes.status, 'awaiting-approval');
  assert.equal(reviewRes.workflowVars.decisionOutcome, 'manual_review');
  assert.ok(reviewRes.approvalGate?.actionLabel.includes('Finance Controller'));

  const rejectRes = executeWorkflowWithDecisions(
    scenarioAWorkflow,
    { invoiceAmount: 18000, vendorVerified: true, duplicateFound: true, region: 'IN' },
    collections,
    sampleDocs
  );
  assert.equal(rejectRes.status, 'completed');
  assert.equal(rejectRes.workflowVars.decisionOutcome, 'rejected');
  assert.ok(rejectRes.steps.some((s) => s.label.includes('Rejection Notice')));
});

test('P3-02: Publish validation blocks missing mappings, type mismatch, draft targets, and ambiguous/missing fallback branches', () => {
  const brokenWorkflow: WorkflowConfig = {
    ...scenarioAWorkflow,
    steps: [
      {
        id: 'st-bad',
        title: 'Broken Decision Step',
        kind: 'decision',
        detail: 'Invalid config',
        retryMax: 0,
        timeoutSec: 5,
        requiresApproval: false,
        decisionConfig: {
          targetType: 'rule',
          targetId: 'rule-batch-replay-limit', // status: 'Tested' (not Published)
          targetName: 'DLQ Batch Replay Guardrail',
          targetVersion: 'v0.9',
          inputMappings: {},
          inputBindings: [
            // Missing queueSeverity; batchSize gets string instead of number
            { id: 'b-bad', targetField: 'batchSize', targetType: 'number', required: true, sourceKind: 'static', sourceRef: 'not-a-number' },
          ],
          branchOutcomes: [],
          branches: [
            { id: 'c1', label: 'A', matchField: 'decision', operator: '==', matchValue: 'allow', nextStepId: 'st-bad' },
            { id: 'c2', label: 'B', matchField: 'decision', operator: '==', matchValue: 'allow', nextStepId: 'missing-step' },
          ],
        },
      },
    ],
  };

  const readiness = validateWorkflowPublishReadiness(brokenWorkflow, collections, sampleDocs);
  assert.equal(readiness.valid, false);
  assert.ok(readiness.errors.some((e) => e.includes('must be Published')));
  assert.ok(readiness.errors.some((e) => e.includes('Required decision input "queueSeverity"')));
  assert.ok(readiness.errors.some((e) => e.includes('Type mismatch')));
  assert.ok(readiness.errors.some((e) => e.includes('Ambiguous overlapping branch')));
  assert.ok(readiness.errors.some((e) => e.includes('unhandled-outcome fallback branch')));
});

test('P3-03: Scenario B chains Table + Scorecard deterministically and redacts applicantEmail', () => {
  const passRes = executeWorkflowWithDecisions(
    scenarioBWorkflow,
    { kycVerified: true, creditScore: 765, countryRisk: 'low', applicantEmail: 'alex@acme.io' },
    collections,
    sampleDocs
  );
  assert.equal(passRes.status, 'completed');
  assert.equal(passRes.decisionExecutions.length, 2);
  assert.equal(passRes.workflowVars.decisionOutcome, 'approved');
  assert.equal(passRes.workflowVars.riskClassification, 'LOW_RISK');
  assert.equal(passRes.workflowVars.applicantEmail, '***e.io');

  const kycGateRes = executeWorkflowWithDecisions(
    scenarioBWorkflow,
    { kycVerified: false, creditScore: 740, countryRisk: 'medium', applicantEmail: 'ops@acme.io' },
    collections,
    sampleDocs
  );
  assert.equal(kycGateRes.status, 'awaiting-approval');
  assert.equal(kycGateRes.workflowVars.decisionOutcome, 'manual_review');

  const declineRes = executeWorkflowWithDecisions(
    scenarioBWorkflow,
    { kycVerified: false, creditScore: 490, countryRisk: 'high', applicantEmail: 'flagged@example.com' },
    collections,
    sampleDocs
  );
  assert.equal(declineRes.status, 'completed');
  assert.equal(declineRes.workflowVars.decisionOutcome, 'rejected');
});

test('P3-04: Scenario C binds SOPIN Context with checksum provenance & NEVER bypasses human approval gate', () => {
  const procRes = executeWorkflowWithDecisions(
    scenarioCWorkflow,
    { requestAmount: 45000, vendorRiskTier: 'low' },
    collections,
    sampleDocs
  );
  assert.equal(procRes.workflowVars.budgetDecision, 'approved');
  assert.equal(procRes.status, 'awaiting-approval');
  assert.ok(procRes.sources.some((s) => s.docId === 'doc-procurement-policy' && s.checksum === 'sha256:7c42...a18'));
  assert.ok(procRes.approvalGate?.actionLabel.includes('Purchase Order Human Authorization Gate'));
});

test('P3-05: Restricted Governance Context document access is blocked for standard clearance and allowed for authorized clearance', () => {
  const cfg = {
    targetType: 'rule' as const,
    targetId: 'rule-procurement-budget',
    targetName: 'Procurement Budget & Vendor Gate',
    targetVersion: 'v1.0',
    inputMappings: {},
    inputBindings: [
      { id: 'r1', targetField: 'requestAmount', targetType: 'number' as const, required: true, sourceKind: 'context' as const, sourceRef: 'credentialTtlSeconds', contextDocId: 'doc-sec-02' },
    ],
    branchOutcomes: [],
  };

  const standardValidation = validateDecisionNodeConfig(cfg, collections, [], sampleDocs, {
    requirePublished: true,
    callerClearance: 'standard',
  });
  assert.equal(standardValidation.valid, false);
  assert.ok(standardValidation.errors.some((e) => e.includes('Restricted Governance')));

  const resolvedDenied = resolveVariableBindings(cfg, {}, {}, sampleDocs, 'standard');
  assert.equal(resolvedDenied.errorCode, 'CONTEXT_PERMISSION_DENIED');
  assert.equal(resolvedDenied.resolvedInputs.requestAmount, undefined);

  const resolvedAllowed = resolveVariableBindings(cfg, {}, {}, sampleDocs, 'governance-authorized');
  assert.equal(resolvedAllowed.errors.length, 0);
  assert.equal(resolvedAllowed.resolvedInputs.requestAmount, 60);
});

test('P3-06: Scenario D Multi-Agent Graph enforces isolated context handoffs and routes via deterministic Decision node', () => {
  const passGraph = executeMultiAgentGraph(
    scenarioDGraph,
    { citationCount: 4, groundedScore: 0.92, contradictionCount: 0, applicantSecret: 'tok-xyz-1234' },
    sampleAgents,
    collections,
    sampleDocs,
    { callerClearance: 'standard' }
  );
  assert.equal(passGraph.status, 'awaiting-approval');
  assert.deepEqual(passGraph.activeSubAgents, [
    'Citation Brief Synthesizer',
    'SOPIN Decisions',
    'PR Verification Agent',
  ]);
  // doc-sec-02 is Restricted Governance and caller is 'standard', so only doc-adr-014 may appear
  assert.ok(passGraph.sources.some((s) => s.docId === 'doc-adr-014'));
  assert.ok(!passGraph.sources.some((s) => s.docId === 'doc-sec-02'));
  assert.equal(passGraph.decisionExecutions[0].finalOutput.decision, 'sufficient_evidence');
  assert.equal(passGraph.unifiedTrace.children?.length, 4);

  // When insufficient evidence -> bypasses verifier agent and goes directly to approval loop
  const loopGraph = executeMultiAgentGraph(
    scenarioDGraph,
    { citationCount: 1, groundedScore: 0.52, contradictionCount: 1 },
    sampleAgents,
    collections,
    sampleDocs
  );
  assert.equal(loopGraph.status, 'awaiting-approval');
  assert.ok(!loopGraph.activeSubAgents.includes('PR Verification Agent'));
});

test('P3-07: Agent Studio integration enforces read-evaluate allowlist & blocks disabled or unattached rules', () => {
  const prAgent = sampleAgents[0];
  const allowed = invokeAgentDecision(
    prAgent,
    'rule-invoice-auto-approve',
    { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false },
    collections
  );
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.execution?.finalOutput.decision, 'approved');
  assert.match(allowed.recommendedAction, /cannot bypass SOPIN Control/);

  const disabledRes = invokeAgentDecision(
    prAgent,
    'rule-procurement-budget',
    { requestAmount: 1000, budgetRemaining: 200000, vendorRiskTier: 'low' },
    collections
  );
  assert.equal(disabledRes.allowed, false);
  assert.match(disabledRes.errorReason || '', /disabled/i);

  const unattachedRes = invokeAgentDecision(
    prAgent,
    'rule-research-quality',
    { citationCount: 4, groundedScore: 0.9, contradictionCount: 0 },
    collections
  );
  assert.equal(unattachedRes.allowed, false);
  assert.match(unattachedRes.errorReason || '', /not authorized/i);
});

test('P3-08: AbortSignal cancellation, retry-then-fallback, and fail-workflow error handling', () => {
  const controller = new AbortController();
  controller.abort();

  const cancelledWorkflow = executeWorkflowWithDecisions(
    scenarioAWorkflow,
    { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections,
    sampleDocs,
    { signal: controller.signal }
  );
  assert.equal(cancelledWorkflow.status, 'cancelled');

  const retryWorkflow = executeWorkflowWithDecisions(
    scenarioAWorkflow,
    { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections,
    sampleDocs,
    { simulateDecisionError: 'Simulated engine timeout after 5000ms' }
  );
  // Scenario A has retryMax=1 and onErrorBehavior='retry-then-fallback' -> routes to st-inv-4 (approval gate)
  assert.equal(retryWorkflow.status, 'awaiting-approval');
  const decisionStep = retryWorkflow.steps.find((s) => s.retriesAttempted !== undefined);
  assert.equal(decisionStep?.retriesAttempted, 1);

  const failFastWorkflow: WorkflowConfig = {
    ...scenarioAWorkflow,
    steps: scenarioAWorkflow.steps.map((s) =>
      s.kind === 'decision' && s.decisionConfig
        ? { ...s, decisionConfig: { ...s.decisionConfig, onErrorBehavior: 'fail-workflow' } }
        : s
    ),
  };
  const failedRes = executeWorkflowWithDecisions(
    failFastWorkflow,
    { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' },
    collections,
    sampleDocs,
    { simulateDecisionError: 'Simulated upstream schema panic' }
  );
  assert.equal(failedRes.status, 'failed');
  assert.match(failedRes.failureReason || '', /panic/i);
});

test('P3-09: Sensitive fields are redacted in Observe telemetry & variable resolution handles nested/previous/static/default values', () => {
  const redacted = redactSensitiveObject({
    ssn: '123-45-6789',
    taxId: 'ABCTY1234K',
    bankAccount: '998877665544',
    apiKey: 'sk-live-secret-token',
    email: 'founder@sopin.ai',
    amount: 42000,
    nested: { customerPhone: '+919876543210', region: 'IN' },
  });
  assert.equal(redacted.ssn, '***6789');
  assert.equal(redacted.taxId, '***234K');
  assert.equal(redacted.bankAccount, '***5544');
  assert.equal(redacted.apiKey, '[REDACTED]');
  assert.equal(redacted.email, '***n.ai');
  assert.equal(redacted.amount, 42000);
  assert.equal((redacted.nested as Record<string, unknown>).customerPhone, '***3210');

  const runtimeRes = executeRuntimeDecision(
    {
      workspaceId: 'ws-core',
      targetType: 'rule',
      targetId: 'rule-invoice-auto-approve',
      inputPayload: {
        invoiceAmount: 25000,
        vendorVerified: true,
        duplicateFound: false,
        taxId: 'GSTIN998877',
      },
      sourceTrigger: 'SOPIN Flow',
    },
    collections
  );
  assert.equal(runtimeRes.execution.inputPayload.taxId, '***8877');
  assert.equal(runtimeRes.redactedInputSummary.taxId, '***8877');

  const resolvedBindings = resolveVariableBindings(
    {
      targetType: 'rule',
      targetId: 'rule-invoice-auto-approve',
      targetName: 'Test',
      targetVersion: 'v1.2',
      inputMappings: {},
      inputBindings: [
        { id: '1', targetField: 'invoiceAmount', sourceKind: 'workflow_input', sourceRef: 'invoice.total' },
        { id: '2', targetField: 'vendorVerified', sourceKind: 'previous_node', sourceRef: 'kyb.verified' },
        { id: '3', targetField: 'duplicateFound', sourceKind: 'static', sourceRef: 'false' },
        { id: '4', targetField: 'fallbackNote', sourceKind: 'workflow_input', sourceRef: 'missingKey', defaultValue: 'default-ok' },
      ],
      branchOutcomes: [],
    },
    { invoice: { total: 19500 } },
    { kyb: { verified: true } },
    sampleDocs
  );
  assert.equal(resolvedBindings.errors.length, 0);
  assert.equal(resolvedBindings.resolvedInputs.invoiceAmount, 19500);
  assert.equal(resolvedBindings.resolvedInputs.vendorVerified, true);
  assert.equal(resolvedBindings.resolvedInputs.duplicateFound, false);
  assert.equal(resolvedBindings.resolvedInputs.fallbackNote, 'default-ok');
});
