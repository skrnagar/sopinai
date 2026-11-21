import { useCallback, useEffect, useState } from 'react';
import {
  AgentConfig,
  AppNotification,
  AppSettings,
  ApprovalHistoryRecord,
  AuditEvent,
  ExecutionRun,
  KnowledgeDocument,
  McpToolRecord,
  MultiAgentGraphSpec,
  WorkflowConfig,
  Workspace,
} from './types';
import {
  DecisionExecutionSpec,
  DecisionSettings,
  DecisionsWorkspaceSlice,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../decisions/types';
import { INITIAL_DECISIONS_SLICE } from '../decisions/seedData';
import {
  executeMultiAgentGraph,
  executeWorkflowWithDecisions,
  invokeAgentDecision,
  validateDecisionsSlice,
  validateWorkflowPublishReadiness,
} from '../decisions/evaluator';

export interface AppWorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  multiAgentGraphs: MultiAgentGraphSpec[];
  runs: ExecutionRun[];
  documents: KnowledgeDocument[];
  tools: McpToolRecord[];
  auditLog: AuditEvent[];
  notifications: AppNotification[];
  settings: AppSettings;
  decisions: DecisionsWorkspaceSlice;
}

const STORAGE_KEY = 'sopin-mobile-workspace-v1';

const INITIAL_STATE: AppWorkspaceState = {
  workspaces: [
    {
      id: 'ws-core',
      name: 'SONIL Core Engineering',
      environment: 'Local Prototype',
      role: 'Workspace Maintainer',
      tokenBudgetMonthly: 500000,
      tokensUsed: 142800,
    },
    {
      id: 'ws-ops',
      name: 'Operations Automation Lab',
      environment: 'Local Prototype',
      role: 'Automation Architect',
      tokenBudgetMonthly: 250000,
      tokensUsed: 68400,
    },
  ],
  activeWorkspaceId: 'ws-core',
  agents: [
    {
      id: 'agt-pr-verifier',
      workspaceId: 'ws-core',
      name: 'PR Verification Agent',
      summary: 'Reviews repository diffs against ADR invariants and runs isolated test checks.',
      objective: 'Verify pull request safety, test coverage, and architectural alignment before merge.',
      instructions:
        'Retrieve relevant ADR entries from SOPIN Context. Cite exact file lines for every finding. Trigger a human approval gate when runtime or security scopes change.',
      modelRoute: 'reasoning-structured',
      budgetCeilingUsd: 2.5,
      tools: ['git.diff', 'ci.testRunner', 'context.query'],
      knowledgeIds: ['doc-adr-014', 'doc-sec-02'],
      memoryTier: 'episodic',
      permissionMode: 'gated-write',
      successCriteria: 'All findings resolve to diff lines and strict JSON schema validates.',
      status: 'Published',
      version: 'v1.4',
      updatedAt: 'Today, 09:40',
      attachedDecisions: [
        {
          id: 'adc-pr-inv',
          targetType: 'rule',
          targetId: 'rule-invoice-auto-approve',
          targetName: 'Invoice Auto-Approval Threshold',
          versionPolicy: 'pinned',
          pinnedVersion: 'v1.2',
          allowedExecution: 'read-evaluate',
          inputSchemaSummary: 'invoiceAmount (number), vendorVerified (boolean), duplicateFound (boolean)',
          outputSchemaSummary: 'decision, requiresHumanGate, approvalLane',
          usageGuidance: 'Evaluate payment policy deterministically; never auto-grant human approval gates.',
        },
      ],
    },
    {
      id: 'agt-research-brief',
      workspaceId: 'ws-core',
      name: 'Citation Brief Synthesizer',
      summary: 'Compiles technical synthesis reports with mandatory source checksum citations.',
      objective: 'Summarize curated internal architecture briefs without ungrounded claims.',
      instructions:
        'Only cite indexed corpus documents. Invoke Research Evidence Quality Gate to verify citation sufficiency before completion.',
      modelRoute: 'citation-audit',
      budgetCeilingUsd: 1.8,
      tools: ['context.query', 'doc.extractMarkdown'],
      knowledgeIds: ['doc-adr-014'],
      memoryTier: 'corpus',
      permissionMode: 'read-only',
      successCriteria: 'Zero ungrounded paragraphs; every assertion references a chunk checksum.',
      status: 'Published',
      version: 'v1.1',
      updatedAt: 'Yesterday',
      attachedDecisions: [
        {
          id: 'adc-res-qual',
          targetType: 'rule',
          targetId: 'rule-research-quality',
          targetName: 'Research Evidence Quality Gate',
          versionPolicy: 'pinned',
          pinnedVersion: 'v1.0',
          allowedExecution: 'read-evaluate',
          inputSchemaSummary: 'citationCount (number), groundedScore (number), contradictionCount (number)',
          outputSchemaSummary: 'decision (sufficient_evidence | needs_more_research), qualityBand',
          usageGuidance: 'Run read-only quality verification after draft synthesis.',
        },
      ],
    },
    {
      id: 'agt-vendor-triage',
      workspaceId: 'ws-ops',
      name: 'Vendor Security Triage',
      summary: 'Maps security questionnaire items against approved policy clauses.',
      objective: 'Draft questionnaire responses and escalate unmapped exceptions to compliance lead.',
      instructions:
        'Redact PII fields pre-inference. Never commit external SLA guarantees without approval gate sign-off.',
      modelRoute: 'deterministic-fast',
      budgetCeilingUsd: 1.2,
      tools: ['context.query', 'ticket.inspectMetadata'],
      knowledgeIds: ['doc-vendor-rubric', 'doc-sla-matrix'],
      memoryTier: 'corpus',
      permissionMode: 'gated-write',
      successCriteria: '100% policy clause linkage or explicit escalation flag.',
      status: 'Published',
      version: 'v1.0',
      updatedAt: 'Today, 07:30',
    },
    {
      id: 'agt-sla-escalator',
      workspaceId: 'ws-ops',
      name: 'SLA Breach Escalator',
      summary: 'Monitors support queue thresholds and drafts escalation briefs for operations leads.',
      objective: 'Classify severity tiers from CSV matrices and stage human-approved escalation tickets.',
      instructions:
        'Compare breach window against SLA-TIER-MATRIX. Require operator sign-off before paging external channels.',
      modelRoute: 'deterministic-fast',
      budgetCeilingUsd: 0.9,
      tools: ['ticket.inspectMetadata', 'context.query'],
      knowledgeIds: ['doc-sla-matrix'],
      memoryTier: 'ephemeral',
      permissionMode: 'gated-write',
      successCriteria: 'Deterministic tier classification with zero missed P1 breaches.',
      status: 'Draft',
      version: 'v0.8',
      updatedAt: 'Yesterday',
    },
  ],
  workflows: [
    {
      id: 'wf-invoice-decisions',
      workspaceId: 'ws-core',
      name: 'Scenario A · Invoice Approval Decision Flow',
      trigger: 'Webhook',
      triggerSpec: 'POST /hooks/ap-invoice-intake',
      version: 'v1.4',
      status: 'Published',
      isDemoData: true,
      updatedAt: 'Today, 10:05',
      sampleInputs: [
        {
          id: 'inv-approve',
          label: 'Auto-Approve (₹32,500 verified)',
          payload: { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' },
        },
        {
          id: 'inv-review',
          label: 'Manual Review (₹78,000 threshold)',
          payload: { invoiceAmount: 78000, vendorVerified: true, duplicateFound: false, region: 'IN' },
        },
        {
          id: 'inv-reject',
          label: 'Reject Duplicate Invoice',
          payload: { invoiceAmount: 18000, vendorVerified: true, duplicateFound: true, region: 'IN' },
        },
      ],
      steps: [
        {
          id: 'st-inv-1',
          title: 'Invoice Intake & Schema Extraction',
          kind: 'action',
          detail: 'Extract invoiceAmount, vendorVerified, and region from invoice payload.',
          retryMax: 2,
          timeoutSec: 20,
          requiresApproval: false,
        },
        {
          id: 'st-inv-2',
          title: 'Ledger Duplicate Check',
          kind: 'integration',
          detail: 'Verify checksum uniqueness via ticket.inspectMetadata (read-only).',
          retryMax: 2,
          timeoutSec: 15,
          requiresApproval: false,
        },
        {
          id: 'st-inv-3',
          title: 'Decision Node: Invoice Approval Matrix',
          kind: 'decision',
          detail: 'Evaluate SOPIN Decisions tbl-invoice-routing deterministically and branch on outcome.',
          retryMax: 1,
          timeoutSec: 5,
          requiresApproval: false,
          decisionConfig: {
            targetType: 'table',
            targetId: 'tbl-invoice-routing',
            targetName: 'Vendor Invoice Approval Matrix',
            targetVersion: 'v1.4',
            versionPolicy: 'pinned',
            inputMappings: {
              invoiceAmount: 'payload.invoiceAmount',
              vendorVerified: 'payload.vendorVerified',
              duplicateFound: 'payload.duplicateFound',
              region: 'payload.region',
            },
            inputBindings: [
              { id: 'ib-1', targetField: 'invoiceAmount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'invoiceAmount', defaultValue: '32500' },
              { id: 'ib-2', targetField: 'vendorVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'vendorVerified', defaultValue: 'true' },
              { id: 'ib-3', targetField: 'duplicateFound', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'duplicateFound', defaultValue: 'false' },
              { id: 'ib-4', targetField: 'region', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'region', defaultValue: 'IN' },
            ],
            outputMappings: {
              decision: 'decisionOutcome',
              approverRole: 'assignedApproverRole',
            },
            branchOutcomes: [
              'approved -> Straight-Through ERP Ledger Sync',
              'manual_review -> Finance Controller Approval Gate',
              'rejected -> Invoice Rejection Notice',
            ],
            branches: [
              { id: 'br-inv-app', label: 'AUTO_APPROVE', matchField: 'decision', operator: '==', matchValue: 'approved', nextStepId: 'st-inv-erp' },
              { id: 'br-inv-rev', label: 'MANUAL_REVIEW', matchField: 'decision', operator: '==', matchValue: 'manual_review', nextStepId: 'st-inv-4' },
              { id: 'br-inv-rej', label: 'REJECT', matchField: 'decision', operator: '==', matchValue: 'rejected', nextStepId: 'st-inv-reject' },
              { id: 'br-inv-fb', label: 'UNHANDLED_FALLBACK', matchField: 'decision', operator: '!=', matchValue: '', nextStepId: 'st-inv-4', isFallback: true },
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
          detail: 'Post verified invoice to ERP payment ledger without human intervention.',
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
          detail: 'Halt payment disbursement and notify AP fraud queue with audit trace.',
          retryMax: 0,
          timeoutSec: 15,
          requiresApproval: false,
          isEndStep: true,
        },
      ],
    },
    {
      id: 'wf-customer-onboarding',
      workspaceId: 'ws-core',
      name: 'Scenario B · Customer Onboarding & KYC Risk Flow',
      trigger: 'Webhook',
      triggerSpec: 'POST /hooks/customer-onboarding',
      version: 'v1.0',
      status: 'Published',
      isDemoData: true,
      updatedAt: 'Today, 10:15',
      sampleInputs: [
        {
          id: 'ob-pass',
          label: 'Prime Verified Applicant (Auto-Onboard)',
          payload: { kycVerified: true, creditScore: 765, countryRisk: 'low', applicantEmail: 'alex@acme.io' },
        },
        {
          id: 'ob-review',
          label: 'Unverified KYC (Manual KYC Review)',
          payload: { kycVerified: false, creditScore: 740, countryRisk: 'medium', applicantEmail: 'ops@acme.io' },
        },
        {
          id: 'ob-reject',
          label: 'High Jurisdiction Risk (Rejected)',
          payload: { kycVerified: false, creditScore: 490, countryRisk: 'high', applicantEmail: 'flagged@example.com' },
        },
      ],
      steps: [
        {
          id: 'st-ob-1',
          title: 'Customer Intake & PII Masking',
          kind: 'action',
          detail: 'Ingest KYC status, credit score, and jurisdiction classification with Observe PII redaction.',
          retryMax: 1,
          timeoutSec: 15,
          requiresApproval: false,
        },
        {
          id: 'st-ob-2',
          title: 'Decision Node: Eligibility Matrix',
          kind: 'decision',
          detail: 'Evaluate Customer Onboarding Eligibility Matrix (tbl-customer-onboarding).',
          retryMax: 1,
          timeoutSec: 5,
          requiresApproval: false,
          decisionConfig: {
            targetType: 'table',
            targetId: 'tbl-customer-onboarding',
            targetName: 'Customer Onboarding Eligibility Matrix',
            targetVersion: 'v1.0',
            versionPolicy: 'pinned',
            inputMappings: {
              kycVerified: 'payload.kycVerified',
              creditScore: 'payload.creditScore',
              countryRisk: 'payload.countryRisk',
            },
            inputBindings: [
              { id: 'ob-b1', targetField: 'kycVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'kycVerified', defaultValue: 'true' },
              { id: 'ob-b2', targetField: 'creditScore', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'creditScore', defaultValue: '765' },
              { id: 'ob-b3', targetField: 'countryRisk', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'countryRisk', defaultValue: 'low' },
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
          detail: 'Compute deterministic weighted risk score and route onboarding decision.',
          retryMax: 0,
          timeoutSec: 5,
          requiresApproval: false,
          decisionConfig: {
            targetType: 'scorecard',
            targetId: 'sc-customer-risk',
            targetName: 'Customer Onboarding Risk Scorecard',
            targetVersion: 'v1.0',
            versionPolicy: 'pinned',
            inputMappings: {
              kycVerified: 'payload.kycVerified',
              creditScore: 'payload.creditScore',
            },
            inputBindings: [
              { id: 'sc-b1', targetField: 'kycVerified', targetType: 'boolean', required: true, sourceKind: 'workflow_input', sourceRef: 'kycVerified', defaultValue: 'true' },
              { id: 'sc-b2', targetField: 'creditScore', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'creditScore', defaultValue: '765' },
            ],
            outputMappings: { decisionOutcome: 'decisionOutcome', classification: 'riskClassification' },
            branchOutcomes: ['approved -> Provision Account', 'manual_review -> KYC Review Gate', 'rejected -> Decline Account'],
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
          detail: 'Issue sandbox workspace credentials and archive onboarding trace.',
          retryMax: 1,
          timeoutSec: 15,
          requiresApproval: false,
          isEndStep: true,
        },
        {
          id: 'st-ob-kyc',
          title: 'KYC Compliance Manual Review Gate',
          kind: 'approval',
          detail: 'Requires Compliance Analyst review of KYC identity proofs.',
          retryMax: 0,
          timeoutSec: 900,
          requiresApproval: true,
        },
        {
          id: 'st-ob-reject',
          title: 'Record Onboarding Decline Notice',
          kind: 'action',
          detail: 'Reject application deterministically due to high-risk threshold.',
          retryMax: 0,
          timeoutSec: 15,
          requiresApproval: false,
          isEndStep: true,
        },
      ],
    },
    {
      id: 'wf-procurement-flow',
      workspaceId: 'ws-core',
      name: 'Scenario C · Procurement Budget & PO Gate',
      trigger: 'Manual',
      triggerSpec: 'Procurement Portal Dispatch',
      version: 'v1.0',
      status: 'Published',
      isDemoData: true,
      updatedAt: 'Today, 10:18',
      sampleInputs: [
        {
          id: 'proc-std',
          label: 'Within Budget (₹45,000 + Context Lookup)',
          payload: { requestAmount: 45000, vendorRiskTier: 'low' },
        },
        {
          id: 'proc-over',
          label: 'Over ₹1,00,000 Ceiling (Board Escalation)',
          payload: { requestAmount: 145000, vendorRiskTier: 'medium' },
        },
      ],
      steps: [
        {
          id: 'st-proc-1',
          title: 'Purchase Request & Context Budget Lookup',
          kind: 'integration',
          detail: 'Fetch department budgetRemaining from SOPIN Context procurement ledger.',
          retryMax: 1,
          timeoutSec: 15,
          requiresApproval: false,
        },
        {
          id: 'st-proc-2',
          title: 'Decision Node: Procurement Budget Policy',
          kind: 'decision',
          detail: 'Bind workflow requestAmount + SOPIN Context budgetRemaining into rule-procurement-budget.',
          retryMax: 1,
          timeoutSec: 5,
          requiresApproval: false,
          decisionConfig: {
            targetType: 'rule',
            targetId: 'rule-procurement-budget',
            targetName: 'Procurement Budget & Vendor Gate',
            targetVersion: 'v1.0',
            versionPolicy: 'pinned',
            inputMappings: {
              requestAmount: 'payload.requestAmount',
              budgetRemaining: 'context.budgetRemaining',
              vendorRiskTier: 'payload.vendorRiskTier',
            },
            inputBindings: [
              { id: 'pr-b1', targetField: 'requestAmount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'requestAmount', defaultValue: '45000' },
              { id: 'pr-b2', targetField: 'budgetRemaining', targetType: 'number', required: true, sourceKind: 'context', sourceRef: 'budgetRemaining', contextDocId: 'doc-procurement-policy' },
              { id: 'pr-b3', targetField: 'vendorRiskTier', targetType: 'string', required: true, sourceKind: 'workflow_input', sourceRef: 'vendorRiskTier', defaultValue: 'low' },
            ],
            outputMappings: { decision: 'budgetDecision', poLane: 'poLane' },
            branchOutcomes: ['All budget outcomes route to explicit PO Authorization Gate'],
            branches: [
              { id: 'br-pr-app', label: 'STANDARD_PO_GATE', matchField: 'decision', operator: '==', matchValue: 'approved', nextStepId: 'st-proc-3' },
              { id: 'br-pr-rev', label: 'CFO_BOARD_GATE', matchField: 'decision', operator: '==', matchValue: 'manual_review', nextStepId: 'st-proc-3' },
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
          detail: 'SOPIN Control requires explicit Procurement Sign-Off even when budget rule passes.',
          retryMax: 0,
          timeoutSec: 900,
          requiresApproval: true,
        },
      ],
    },
    {
      id: 'wf-ai-research-flow',
      workspaceId: 'ws-core',
      name: 'Scenario D · AI Research Evidence Quality Flow',
      trigger: 'Manual',
      triggerSpec: 'Research Synthesis Request',
      version: 'v1.0',
      status: 'Published',
      isDemoData: true,
      updatedAt: 'Today, 10:22',
      sampleInputs: [
        {
          id: 'res-pass',
          label: 'High Grounded Citations (4 refs, 0.92 score)',
          payload: { citationCount: 4, groundedScore: 0.92, contradictionCount: 0 },
        },
        {
          id: 'res-loop',
          label: 'Low Grounding (Triggers Supplemental Research Gate)',
          payload: { citationCount: 1, groundedScore: 0.58, contradictionCount: 1 },
        },
      ],
      steps: [
        {
          id: 'st-res-1',
          title: 'Research Agent Evidence Extraction',
          kind: 'action',
          detail: 'Citation Brief Synthesizer gathers checksum-verified passages from SOPIN Context.',
          retryMax: 1,
          timeoutSec: 20,
          requiresApproval: false,
        },
        {
          id: 'st-res-2',
          title: 'Decision Node: Evidence Quality Gate',
          kind: 'decision',
          detail: 'Deterministically validate citationCount, groundedScore, and contradictionCount.',
          retryMax: 0,
          timeoutSec: 5,
          requiresApproval: false,
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
            inputBindings: [
              { id: 'rs-b1', targetField: 'citationCount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'citationCount', defaultValue: '4' },
              { id: 'rs-b2', targetField: 'groundedScore', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'groundedScore', defaultValue: '0.92' },
              { id: 'rs-b3', targetField: 'contradictionCount', targetType: 'number', required: true, sourceKind: 'workflow_input', sourceRef: 'contradictionCount', defaultValue: '0' },
            ],
            outputMappings: { decision: 'qualityDecision', qualityBand: 'qualityBand' },
            branchOutcomes: ['sufficient_evidence -> Publish Brief', 'needs_more_research -> Supplemental Research Loop'],
            branches: [
              { id: 'br-res-ok', label: 'SUFFICIENT_EVIDENCE', matchField: 'decision', operator: '==', matchValue: 'sufficient_evidence', nextStepId: 'st-res-complete' },
              { id: 'br-res-loop', label: 'SUPPLEMENTAL_LOOP', matchField: 'decision', operator: '==', matchValue: 'needs_more_research', nextStepId: 'st-res-fallback' },
              { id: 'br-res-fb', label: 'FALLBACK_RESEARCH', matchField: 'decision', operator: '!=', matchValue: '', nextStepId: 'st-res-fallback', isFallback: true },
            ],
            noMatchNextStepId: 'st-res-fallback',
            failureNextStepId: 'st-res-fallback',
            onErrorBehavior: 'fallback-branch',
          },
        },
        {
          id: 'st-res-complete',
          title: 'Finalize Grounded Research Artifact',
          kind: 'action',
          detail: 'Publish verified citation brief with deterministic quality trace.',
          retryMax: 0,
          timeoutSec: 15,
          requiresApproval: false,
          isEndStep: true,
        },
        {
          id: 'st-res-fallback',
          title: 'Supplemental Research & Human Review Gate',
          kind: 'approval',
          detail: 'Insufficient citation coverage; pause for researcher to supply additional grounded sources.',
          retryMax: 0,
          timeoutSec: 600,
          requiresApproval: true,
        },
      ],
    },
    {
      id: 'wf-incident-triage',
      workspaceId: 'ws-core',
      name: 'Incident Triage & Gated Replay',
      trigger: 'Webhook',
      triggerSpec: 'POST /hooks/ops-queue-intake',
      version: 'v2.1',
      status: 'Published',
      updatedAt: 'Today, 08:15',
      steps: [
        {
          id: 'st-1',
          title: 'Normalize & PII Redact',
          kind: 'action',
          detail: 'Strip email/token identifiers before gateway inference.',
          retryMax: 2,
          timeoutSec: 15,
          requiresApproval: false,
        },
        {
          id: 'st-2',
          title: 'Runbook Context Lookup',
          kind: 'integration',
          detail: 'Query RB-19 runbook and recent queue failures via MCP.',
          retryMax: 2,
          timeoutSec: 20,
          requiresApproval: false,
        },
        {
          id: 'st-3',
          title: 'Risk Classification Branch',
          kind: 'condition',
          detail: 'If batchSize > 0 or elevated risk -> route to Human Sign-Off.',
          retryMax: 1,
          timeoutSec: 10,
          requiresApproval: false,
        },
        {
          id: 'st-4',
          title: 'Maintainer Sign-Off Gate',
          kind: 'approval',
          detail: 'Pause durable runtime until oncall-lead approves DLQ replay.',
          retryMax: 0,
          timeoutSec: 900,
          requiresApproval: true,
        },
      ],
    },
    {
      id: 'wf-vendor-intake',
      workspaceId: 'ws-ops',
      name: 'Vendor Questionnaire & SLA Triage',
      trigger: 'Document Upload',
      triggerSpec: 'On XLSX / PDF intake in Operations Corpus',
      version: 'v1.3',
      status: 'Published',
      updatedAt: 'Today, 07:10',
      steps: [
        {
          id: 'ops-st-1',
          title: 'Extract Questionnaire Rows',
          kind: 'integration',
          detail: 'Parse uploaded CSV/XLSX security controls using doc.extractMarkdown.',
          retryMax: 2,
          timeoutSec: 20,
          requiresApproval: false,
        },
        {
          id: 'ops-st-2',
          title: 'Match Approved Policy Clauses',
          kind: 'action',
          detail: 'Compare extracted clauses against VENDOR-RISK-RUBRIC & SLA-TIER-MATRIX.',
          retryMax: 2,
          timeoutSec: 25,
          requiresApproval: false,
        },
        {
          id: 'ops-st-3',
          title: 'Compliance Lead Approval',
          kind: 'approval',
          detail: 'Require human sign-off before exporting vendor risk rating packet.',
          retryMax: 0,
          timeoutSec: 600,
          requiresApproval: true,
        },
      ],
    },
  ],
  multiAgentGraphs: [
    {
      id: 'graph-research-compliance',
      workspaceId: 'ws-core',
      name: 'Research -> Decision -> Verification -> Approval Graph',
      description:
        '[Sample Demo Data] Multi-agent orchestration routing outputs from Citation Brief Synthesizer through deterministic Research Evidence Quality Gate to PR Verification Agent and SOPIN Control approval.',
      isDemoData: true,
      entryNodeId: 'gn-research',
      version: 'v1.0',
      status: 'Published',
      updatedAt: 'Today, 10:25',
      nodes: [
        {
          id: 'gn-research',
          nodeType: 'agent',
          label: 'Citation Brief Synthesizer',
          agentId: 'agt-research-brief',
          allowedContextDocIds: ['doc-adr-014'],
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
            branchOutcomes: ['sufficient_evidence -> Compliance Verifier', 'needs_more_research -> Governance Gate'],
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
          approvalActionLabel: 'Approve Multi-Agent Research & Compliance Packet',
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
          handoffMappings: {
            decision: 'decision',
            qualityBand: 'qualityBand',
          },
        },
        {
          id: 'ge-3',
          fromNodeId: 'gn-decision',
          toNodeId: 'gn-approval',
          label: 'Needs More Research Fallback',
          isFallback: true,
          handoffMappings: {
            decision: 'decision',
            qualityBand: 'qualityBand',
          },
        },
        {
          id: 'ge-4',
          fromNodeId: 'gn-verifier',
          toNodeId: 'gn-approval',
          label: 'Require Human Approval',
          handoffMappings: {
            lastAgent: 'lastAgent',
          },
        },
      ],
    },
  ],
  runs: [
    {
      id: 'run-481',
      workspaceId: 'ws-core',
      title: 'PR #481 · Sandbox Egress Hardening',
      prompt: 'Audit sandbox executor diff against ADR-014 and verify unit test assertions.',
      targetName: 'PR Verification Agent',
      targetType: 'Agent',
      status: 'awaiting-approval',
      startedAt: '12 mins ago',
      estimatedCostUsd: 0.14,
      activeSubAgents: ['Planner Agent', 'Context Agent', 'Execution Agent', 'Governance Agent'],
      steps: [
        {
          id: 's1',
          label: '01. Diff Event Intake',
          agentRole: 'Planner Agent',
          module: 'SOPIN Flow',
          status: 'completed',
          toolUsed: 'git.diff',
          detail: 'Extracted 6 changed files across packages/runtime and packages/gateway.',
        },
        {
          id: 's2',
          label: '02. ADR Context Retrieval',
          agentRole: 'Context Agent',
          module: 'SOPIN Context',
          status: 'completed',
          toolUsed: 'context.query',
          detail: 'Matched 2 policy invariants in ADR-014 and SECURITY-SPEC-02.',
        },
        {
          id: 's3',
          label: '03. Isolated Test Verification',
          agentRole: 'Execution Agent',
          module: 'SOPIN Runtime',
          status: 'completed',
          toolUsed: 'ci.testRunner',
          detail: 'Executed executor.spec.ts inside egress-disabled container (exit 0).',
        },
        {
          id: 's4',
          label: '04. Maintainer Approval Gate',
          agentRole: 'Governance Agent',
          module: 'SOPIN Control',
          status: 'awaiting-approval',
          detail: 'Paused before publishing Elevated Risk review comment to repository.',
        },
      ],
      sources: [
        {
          docId: 'doc-adr-014',
          docTitle: 'ADR-014: Sandbox Isolation Policy',
          chunkId: 'chunk-03',
          excerpt:
            'Every MCP tool server executing repository code must run with ephemeral filesystem mounts and disabled outbound egress.',
        },
        {
          docId: 'doc-sec-02',
          docTitle: 'SECURITY-SPEC-02: Credential Scoping',
          chunkId: 'chunk-01',
          excerpt:
            'Credential tokens issued to runtime nodes expire immediately upon step completion.',
        },
      ],
      approvalGate: {
        actionLabel: 'Publish Elevated Risk Review & Flag PR #481',
        reason: 'Sandbox egress configuration modified in packages/runtime/sandbox.ts.',
        requiredRole: 'Workspace Maintainer',
      },
      artifactTitle: 'pr-481-verification-report.md',
      artifactMarkdown: `# PR #481 Verification Brief (Prototype Sample)\n\n- **Target:** \`packages/runtime/sandbox.ts\`\n- **Policy Check:** ADR-014 §3.2 verified\n- **Isolated Tests:** 14/14 assertions completed in sandbox\n- **Action:** Pending maintainer approval gate`,
    },
    {
      id: 'run-479',
      workspaceId: 'ws-core',
      title: 'Weekly Architecture Brief Synthesis',
      prompt: 'Compile summary of ADR updates and MCP binding rules for engineering team.',
      targetName: 'Citation Brief Synthesizer',
      targetType: 'Agent',
      status: 'completed',
      startedAt: '2 hours ago',
      estimatedCostUsd: 0.09,
      activeSubAgents: ['Context Agent', 'Citation Auditor'],
      steps: [
        {
          id: 's1',
          label: '01. Corpus Index Query',
          agentRole: 'Context Agent',
          module: 'SOPIN Context',
          status: 'completed',
          toolUsed: 'context.query',
          detail: 'Retrieved 5 verified document spans.',
        },
        {
          id: 's2',
          label: '02. Claim Audit & Export',
          agentRole: 'Citation Auditor',
          module: 'SOPIN Evaluate',
          status: 'completed',
          detail: '100% claim-to-checksum linkage verified.',
        },
      ],
      sources: [
        {
          docId: 'doc-adr-014',
          docTitle: 'ADR-014: Sandbox Isolation Policy',
          chunkId: 'chunk-03',
          excerpt: 'Every MCP tool server executing repository code must run with ephemeral filesystem mounts.',
        },
      ],
      artifactTitle: 'architecture-synthesis-brief.md',
      artifactMarkdown: `# Architecture Brief\n\nAll runtime sandboxes isolate MCP tools under ephemeral mounts with strict token expiration.\n\n**Citations:** \`ADR-014\`, \`SECURITY-SPEC-02\``,
    },
    {
      id: 'run-476',
      workspaceId: 'ws-core',
      title: 'Billing Sync DLQ Inspection',
      prompt: 'Inspect failed webhook payloads in dead-letter queue for timeout pattern.',
      targetName: 'Incident Triage & Gated Replay',
      targetType: 'Workflow',
      status: 'failed',
      startedAt: 'Yesterday',
      estimatedCostUsd: 0.04,
      activeSubAgents: ['Planner Agent', 'Execution Agent'],
      failureReason: 'MCP connector ticket.inspectMetadata timed out after 20s upstream stall.',
      steps: [
        {
          id: 's1',
          label: '01. Payload PII Filter',
          agentRole: 'Planner Agent',
          module: 'SOPIN Flow',
          status: 'completed',
          detail: 'Redacted email identifiers pre-inference.',
        },
        {
          id: 's2',
          label: '02. Query DLQ Metadata',
          agentRole: 'Execution Agent',
          module: 'SOPIN Runtime',
          status: 'failed',
          toolUsed: 'ticket.inspectMetadata',
          detail: 'Upstream connector exceeded 20s timeout limit.',
        },
      ],
      sources: [],
    },
    {
      id: 'run-512',
      workspaceId: 'ws-ops',
      title: 'Vendor Risk Packet · CloudScale EU',
      prompt: 'Map 34 vendor security controls against VENDOR-RISK-RUBRIC and flag SLA gaps.',
      targetName: 'Vendor Security Triage',
      targetType: 'Agent',
      status: 'awaiting-approval',
      startedAt: '25 mins ago',
      estimatedCostUsd: 0.08,
      activeSubAgents: ['Planner Agent', 'Context Agent', 'Governance Agent'],
      steps: [
        {
          id: 'ops-s1',
          label: '01. Clause Extraction',
          agentRole: 'Planner Agent',
          module: 'SOPIN Flow',
          status: 'completed',
          toolUsed: 'doc.extractMarkdown',
          detail: 'Parsed 34 vendor questionnaire assertions with PII redaction enabled.',
        },
        {
          id: 'ops-s2',
          label: '02. Rubric & SLA Lookup',
          agentRole: 'Context Agent',
          module: 'SOPIN Context',
          status: 'completed',
          toolUsed: 'context.query',
          detail: 'Matched 32/34 clauses cleanly; flagged 2 regional data retention exceptions.',
        },
        {
          id: 'ops-s3',
          label: '03. Compliance Gate',
          agentRole: 'Governance Agent',
          module: 'SOPIN Control',
          status: 'awaiting-approval',
          detail: 'Waiting on Automation Architect approval to finalize exception report.',
        },
      ],
      sources: [
        {
          docId: 'doc-vendor-rubric',
          docTitle: 'VENDOR-RISK-RUBRIC.md',
          chunkId: 'chunk-02',
          excerpt:
            'Regional sub-processor exceptions require explicit Architect sign-off before SLA onboarding.',
        },
      ],
      approvalGate: {
        actionLabel: 'Sign Off 2 Regional Retention Exceptions (CloudScale EU)',
        reason: 'Vendor audit identified 2 exceptions requiring Automation Architect review.',
        requiredRole: 'Automation Architect',
      },
      artifactTitle: 'vendor-cloudscale-triage.md',
      artifactMarkdown: `# Vendor Security Triage · CloudScale EU\n\n- **Matched Clauses:** 32 / 34\n- **Open Exceptions:** 2 regional retention flags\n- **Status:** Pending Automation Architect approval`,
    },
    {
      id: 'run-509',
      workspaceId: 'ws-ops',
      title: 'Daily Queue SLA Sweep',
      prompt: 'Evaluate overnight ticket latencies against SLA-TIER-MATRIX thresholds.',
      targetName: 'Vendor Questionnaire & SLA Triage',
      targetType: 'Workflow',
      status: 'completed',
      startedAt: '4 hours ago',
      estimatedCostUsd: 0.05,
      activeSubAgents: ['Context Agent', 'Execution Agent'],
      steps: [
        {
          id: 'ops-s4',
          label: '01. Queue Metadata Scan',
          agentRole: 'Execution Agent',
          module: 'SOPIN Runtime',
          status: 'completed',
          toolUsed: 'ticket.inspectMetadata',
          detail: 'Inspected 48 overnight ops tickets (read-only).',
        },
        {
          id: 'ops-s5',
          label: '02. SLA Matrix Verification',
          agentRole: 'Context Agent',
          module: 'SOPIN Evaluate',
          status: 'completed',
          detail: '47/48 tickets within Tier-1 SLA target; 1 escalated cleanly.',
        },
      ],
      sources: [
        {
          docId: 'doc-sla-matrix',
          docTitle: 'SLA-TIER-MATRIX.csv',
          chunkId: 'chunk-01',
          excerpt: 'P1_RESPONSE_MINS=15, P2_RESPONSE_MINS=60, ESCALATE_ON_BREACH=true',
        },
      ],
      artifactTitle: 'sla-sweep-summary.md',
      artifactMarkdown: `# Daily SLA Sweep\n\n- **Tickets Evaluated:** 48\n- **Within Target:** 47 (97.9%)\n- **Escalated:** 1 Tier-2 ticket`,
    },
  ],
  documents: [
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
      excerpt:
        'Every MCP tool server executing repository code must run with ephemeral filesystem mounts and disabled outbound egress unless explicitly whitelisted by SOPIN Control.',
      structuredAttributes: {
        sandboxRequired: true,
        outboundEgressAllowed: false,
        minCitationBenchmark: 3,
      },
      updatedAt: 'Updated 2d ago',
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
      excerpt:
        '[Sample Demo Data] Q4 Engineering & Ops Procurement Budget Cap: ₹2,00,000 remaining; auto-PO limit ₹1,00,000; all PO disbursements still require explicit SOPIN Control human approval.',
      structuredAttributes: {
        budgetRemaining: 200000,
        quarterCeiling: 500000,
        defaultVendorRiskTier: 'low',
        requiresHumanPoSignoff: true,
      },
      updatedAt: 'Updated Today',
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
      excerpt:
        'Credential tokens issued to runtime nodes are scoped to a single workflow step and expire immediately upon completion. Ambient organization keys are prohibited.',
      structuredAttributes: {
        credentialTtlSeconds: 60,
        ambientKeysProhibited: true,
      },
      updatedAt: 'Updated 5d ago',
    },
    {
      id: 'doc-rb-19',
      workspaceId: 'ws-core',
      title: 'RB-19: Ledger Sync Remediation Runbook',
      sourceType: 'CSV',
      sizeLabel: '42 KB',
      status: 'Indexed',
      memoryTier: 'episodic',
      accessScope: 'Workspace Read-Only',
      checksum: 'sha256:7d18...90f',
      chunksCount: 9,
      excerpt:
        'ERROR_CODE,REMEDIATION_VERB,APPROVAL_REQUIRED\nTIMEOUT_UPSTREAM,inspect-dlq,true\nBATCH_OVERFLOW,split-batch-10,true',
      structuredAttributes: {
        maxReplayBatchSize: 10,
        approvalRequired: true,
      },
      updatedAt: 'Updated 1w ago',
    },
    {
      id: 'doc-vendor-rubric',
      workspaceId: 'ws-ops',
      title: 'VENDOR-RISK-RUBRIC.md',
      sourceType: 'MD',
      sizeLabel: '24 KB',
      status: 'Indexed',
      memoryTier: 'corpus',
      accessScope: 'Restricted Governance',
      checksum: 'sha256:93b2...e14',
      chunksCount: 12,
      excerpt:
        'Regional sub-processor exceptions require explicit Automation Architect sign-off before SLA onboarding or production connector activation.',
      structuredAttributes: {
        restrictedJurisdictionThreshold: 'high',
        requireArchitectSignoff: true,
      },
      updatedAt: 'Updated 1d ago',
    },
    {
      id: 'doc-sla-matrix',
      workspaceId: 'ws-ops',
      title: 'SLA-TIER-MATRIX.csv',
      sourceType: 'CSV',
      sizeLabel: '14 KB',
      status: 'Indexed',
      memoryTier: 'corpus',
      accessScope: 'Workspace Read-Only',
      checksum: 'sha256:2f7c...81a',
      chunksCount: 6,
      excerpt:
        'TIER,P1_RESPONSE_MINS,P2_RESPONSE_MINS,ESCALATE_ON_BREACH\nENTERPRISE,15,60,true\nSTANDARD,30,120,true',
      structuredAttributes: {
        p1ResponseMins: 15,
        p2ResponseMins: 60,
        escalateOnBreach: true,
      },
      updatedAt: 'Updated 3d ago',
    },
  ],
  tools: [
    {
      id: 'tool-git-diff',
      name: 'git.diff',
      transport: 'MCP / stdio',
      scope: 'read-only',
      enabled: true,
      description: 'Read repository commit diffs and file boundaries.',
    },
    {
      id: 'tool-ci-runner',
      name: 'ci.testRunner',
      transport: 'MCP / Isolated Container',
      scope: 'read-only',
      enabled: true,
      description: 'Run scoped unit verification inside egress-disabled container.',
    },
    {
      id: 'tool-context-query',
      name: 'context.query',
      transport: 'Native SOPIN Context',
      scope: 'read-only',
      enabled: true,
      description: 'Hybrid semantic and lexical lookup with source checksum provenance.',
    },
    {
      id: 'tool-ticket-dlq',
      name: 'ticket.inspectMetadata',
      transport: 'MCP / HTTP Allowlist',
      scope: 'gated-write',
      enabled: true,
      description: 'Inspect and replay dead-letter queue entries behind human approval.',
    },
    {
      id: 'tool-doc-extract',
      name: 'doc.extractMarkdown',
      transport: 'MCP / stdio',
      scope: 'read-only',
      enabled: true,
      description: 'Parse uploaded PDF, DOCX, CSV, and Markdown files into grounded chunks.',
    },
  ],
  auditLog: [
    {
      id: 'aud-1',
      workspaceId: 'ws-core',
      timestamp: 'Today · 09:42',
      actor: 'PR Verification Agent',
      action: 'Paused for maintainer sign-off',
      target: 'run-481',
      outcome: 'Allowed',
    },
    {
      id: 'aud-2',
      workspaceId: 'ws-core',
      timestamp: 'Today · 09:41',
      actor: 'SOPIN Gateway',
      action: 'Applied pre-inference PII redaction',
      target: 'reasoning-structured',
      outcome: 'Allowed',
    },
    {
      id: 'aud-3',
      workspaceId: 'ws-core',
      timestamp: 'Yesterday · 17:12',
      actor: 'Policy Engine',
      action: 'Blocked unapproved outbound egress',
      target: 'sbx-ci-runner',
      outcome: 'Blocked',
    },
    {
      id: 'aud-ops-1',
      workspaceId: 'ws-ops',
      timestamp: 'Today · 07:35',
      actor: 'Vendor Security Triage',
      action: 'Staged compliance gate for CloudScale EU',
      target: 'run-512',
      outcome: 'Allowed',
    },
  ],
  notifications: [
    {
      id: 'ntf-1',
      workspaceId: 'ws-core',
      title: 'Approval required · PR #481',
      detail: 'PR Verification Agent paused at Maintainer Approval Gate.',
      timeLabel: '12m ago',
      read: false,
      targetTab: 'run',
    },
    {
      id: 'ntf-2',
      workspaceId: 'ws-core',
      title: 'Failed step · Billing Sync DLQ',
      detail: 'ticket.inspectMetadata exceeded 20s timeout. Ready to retry.',
      timeLabel: 'Yesterday',
      read: false,
      targetTab: 'run',
    },
    {
      id: 'ntf-ops-1',
      workspaceId: 'ws-ops',
      title: 'Compliance sign-off · CloudScale EU',
      detail: '2 regional data retention exceptions staged for Automation Architect review.',
      timeLabel: '25m ago',
      read: false,
      targetTab: 'run',
    },
  ],
  settings: {
    approvalAlerts: true,
    failureAlerts: true,
    budgetAlertPct: 80,
    strictSchemaDefault: true,
  },
  decisions: INITIAL_DECISIONS_SLICE,
};

function mergeMissingById<T extends { id: string }>(existing: T[] | undefined, defaults: T[]): T[] {
  const safeExisting = Array.isArray(existing) ? existing : [];
  const seen = new Set(safeExisting.map((item) => item.id));
  const missing = defaults.filter((item) => !seen.has(item.id));
  return [...safeExisting, ...missing];
}

function mergeMissingWorkspaceDefaults(parsed: Partial<AppWorkspaceState>): AppWorkspaceState {
  const base: AppWorkspaceState = { ...INITIAL_STATE, ...parsed };

  const existingWorkflowIds = new Set(base.workflows.map((w) => w.id));
  const missingWorkflows = INITIAL_STATE.workflows.filter((w) => !existingWorkflowIds.has(w.id));

  const existingRunIds = new Set(base.runs.map((r) => r.id));
  const missingRuns = INITIAL_STATE.runs.filter((r) => !existingRunIds.has(r.id));

  const existingDocIds = new Set(base.documents.map((d) => d.id));
  const missingDocs = INITIAL_STATE.documents.filter((d) => !existingDocIds.has(d.id));

  const existingAgentIds = new Set(base.agents.map((a) => a.id));
  const missingAgents = INITIAL_STATE.agents.filter((a) => !existingAgentIds.has(a.id));

  const mergedGraphs = mergeMissingById(base.multiAgentGraphs, INITIAL_STATE.multiAgentGraphs);

  // Enrich existing default docs with structuredAttributes if missing
  const defaultDocMap = new Map(INITIAL_STATE.documents.map((d) => [d.id, d]));
  const enrichedDocs = [...base.documents, ...missingDocs].map((d) => {
    const def = defaultDocMap.get(d.id);
    if (def?.structuredAttributes && !d.structuredAttributes) {
      return { ...d, structuredAttributes: def.structuredAttributes };
    }
    return d;
  });

  // Enrich existing default agents with attachedDecisions if missing
  const defaultAgentMap = new Map(INITIAL_STATE.agents.map((a) => [a.id, a]));
  const enrichedAgents = [...base.agents, ...missingAgents].map((a) => {
    const def = defaultAgentMap.get(a.id);
    if (def?.attachedDecisions && !a.attachedDecisions) {
      return { ...a, attachedDecisions: def.attachedDecisions };
    }
    return a;
  });

  // Ensure Scenario A workflow has full Prompt 3 branch/binding config if unedited
  const defaultWfMap = new Map(INITIAL_STATE.workflows.map((w) => [w.id, w]));
  const enrichedWorkflows = [...base.workflows, ...missingWorkflows].map((w) => {
    const def = defaultWfMap.get(w.id);
    if (def?.sampleInputs && !w.sampleInputs) {
      return def;
    }
    return w;
  });

  const { slice: sanitizedDecisions } = validateDecisionsSlice(
    parsed.decisions,
    INITIAL_DECISIONS_SLICE
  );
  const mergedDecisions: DecisionsWorkspaceSlice = {
    rules: mergeMissingById(sanitizedDecisions.rules, INITIAL_DECISIONS_SLICE.rules),
    tables: mergeMissingById(sanitizedDecisions.tables, INITIAL_DECISIONS_SLICE.tables),
    rulesets: mergeMissingById(sanitizedDecisions.rulesets, INITIAL_DECISIONS_SLICE.rulesets),
    chains: mergeMissingById(sanitizedDecisions.chains, INITIAL_DECISIONS_SLICE.chains),
    scorecards: mergeMissingById(sanitizedDecisions.scorecards, INITIAL_DECISIONS_SLICE.scorecards),
    executions: mergeMissingById(sanitizedDecisions.executions, INITIAL_DECISIONS_SLICE.executions),
    settings: {
      ...INITIAL_DECISIONS_SLICE.settings,
      ...sanitizedDecisions.settings,
    },
  };

  return {
    ...base,
    agents: enrichedAgents,
    workflows: enrichedWorkflows,
    multiAgentGraphs: mergedGraphs,
    runs: [...base.runs, ...missingRuns],
    documents: enrichedDocs,
    decisions: mergedDecisions,
  };
}

function loadInitialState(): AppWorkspaceState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppWorkspaceState>;
    if (!parsed.workspaces || !parsed.agents || !parsed.runs) return INITIAL_STATE;
    return mergeMissingWorkspaceDefaults(parsed);
  } catch {
    return INITIAL_STATE;
  }
}

export function useAppWorkspaceStore() {
  const [state, setState] = useState<AppWorkspaceState>(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota overflow if user previews large local images
    }
  }, [state]);

  const activeWorkspace =
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? state.workspaces[0];

  const switchWorkspace = useCallback((workspaceId: string) => {
    setState((prev) => {
      if (!prev.workspaces.some((w) => w.id === workspaceId)) return prev;
      return { ...prev, activeWorkspaceId: workspaceId };
    });
  }, []);

  const createWorkspace = useCallback((name: string, role = 'Workspace Maintainer') => {
    const cleanName = name.trim();
    if (!cleanName) return null;
    const wsId = `ws-${Date.now()}`;
    const starterAgentId = `agt-${Date.now()}`;
    const starterWfId = `wf-${Date.now()}`;

    const newWorkspace: Workspace = {
      id: wsId,
      name: cleanName,
      environment: 'Local Prototype',
      role,
      tokenBudgetMonthly: 250000,
      tokensUsed: 12400,
    };

    const starterAgent: AgentConfig = {
      id: starterAgentId,
      workspaceId: wsId,
      name: `${cleanName} Assistant`,
      summary: 'Starter scoped agent initialized for this workspace.',
      objective: `Execute verified tasks inside ${cleanName}.`,
      instructions: 'Require citations and enforce human approval on write actions.',
      modelRoute: 'reasoning-structured',
      budgetCeilingUsd: 1.5,
      tools: ['context.query'],
      knowledgeIds: [],
      memoryTier: 'episodic',
      permissionMode: 'gated-write',
      successCriteria: 'Strict output schema compliance.',
      status: 'Draft',
      version: 'v0.1',
      updatedAt: 'Just now',
    };

    const starterWorkflow: WorkflowConfig = {
      id: starterWfId,
      workspaceId: wsId,
      name: `${cleanName} Verification Flow`,
      trigger: 'Manual',
      triggerSpec: 'On-Demand Operator Dispatch',
      version: 'v1.0',
      status: 'Draft',
      updatedAt: 'Just now',
      steps: [
        {
          id: `st-${Date.now()}-1`,
          title: 'Context Retrieval & Scope Check',
          kind: 'action',
          detail: 'Validate input schema and retrieve workspace documents.',
          retryMax: 2,
          timeoutSec: 20,
          requiresApproval: false,
        },
        {
          id: `st-${Date.now()}-2`,
          title: 'Operator Sign-Off Gate',
          kind: 'approval',
          detail: 'Pause prior to exporting final summary.',
          retryMax: 0,
          timeoutSec: 600,
          requiresApproval: true,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, newWorkspace],
      activeWorkspaceId: wsId,
      agents: [starterAgent, ...prev.agents],
      workflows: [starterWorkflow, ...prev.workflows],
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          workspaceId: wsId,
          timestamp: 'Just now',
          actor: 'Workspace User',
          action: 'Created workspace sandbox',
          target: cleanName,
          outcome: 'Updated',
        },
        ...prev.auditLog,
      ],
    }));

    return wsId;
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        !n.workspaceId || n.workspaceId === prev.activeWorkspaceId ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const saveAgent = useCallback((agent: AgentConfig) => {
    setState((prev) => {
      const exists = prev.agents.some((a) => a.id === agent.id);
      const nextAgents = exists
        ? prev.agents.map((a) => (a.id === agent.id ? agent : a))
        : [agent, ...prev.agents];
      return {
        ...prev,
        agents: nextAgents,
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: agent.workspaceId,
            timestamp: 'Just now',
            actor: 'Workspace User',
            action: `${exists ? 'Updated' : 'Created'} agent (${agent.status})`,
            target: agent.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const saveWorkflow = useCallback((workflow: WorkflowConfig) => {
    setState((prev) => {
      const exists = prev.workflows.some((w) => w.id === workflow.id);
      const nextWorkflows = exists
        ? prev.workflows.map((w) => (w.id === workflow.id ? workflow : w))
        : [workflow, ...prev.workflows];
      return {
        ...prev,
        workflows: nextWorkflows,
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: workflow.workspaceId,
            timestamp: 'Just now',
            actor: 'Workspace User',
            action: `Saved workflow ${workflow.version} (${workflow.status})`,
            target: workflow.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const startPrototypeRun = useCallback(
    (payload: {
      title: string;
      prompt: string;
      targetName: string;
      targetType: 'Agent' | 'Workflow' | 'Graph';
      docId?: string;
      workflowInputPayload?: Record<string, unknown>;
    }) => {
      const runId = `run-${Math.floor(500 + Math.random() * 499)}`;
      const wsDocs = state.documents.filter((d) => d.workspaceId === state.activeWorkspaceId);
      const matchedDoc = wsDocs.find((d) => d.id === payload.docId) ?? wsDocs[0];
      const collections = {
        rules: state.decisions.rules,
        tables: state.decisions.tables,
        rulesets: state.decisions.rulesets,
        chains: state.decisions.chains,
        scorecards: state.decisions.scorecards,
      };
      const clearance =
        activeWorkspace.role.includes('Maintainer') || activeWorkspace.role.includes('Architect')
          ? ('governance-authorized' as const)
          : ('standard' as const);

      const matchedWorkflow =
        payload.targetType === 'Workflow'
          ? state.workflows.find(
              (w) => w.workspaceId === state.activeWorkspaceId && w.name === payload.targetName
            )
          : undefined;

      if (matchedWorkflow) {
        const inputPayload =
          payload.workflowInputPayload ??
          matchedWorkflow.sampleInputs?.[0]?.payload ??
          { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false, region: 'IN' };

        const wfResult = executeWorkflowWithDecisions(
          matchedWorkflow,
          inputPayload,
          collections,
          wsDocs,
          { callerClearance: clearance, defaultRole: activeWorkspace.role }
        );

        const newRun: ExecutionRun = {
          id: runId,
          workspaceId: state.activeWorkspaceId,
          title: payload.title,
          prompt: payload.prompt,
          targetName: payload.targetName,
          targetType: 'Workflow',
          status: wfResult.status,
          startedAt: 'Just now',
          estimatedCostUsd: 0.05,
          activeSubAgents: ['Planner Agent', 'SOPIN Flow Engine', 'SOPIN Decisions', 'SOPIN Control'],
          steps: wfResult.steps,
          sources:
            wfResult.sources.length > 0
              ? wfResult.sources
              : matchedDoc
              ? [
                  {
                    docId: matchedDoc.id,
                    docTitle: matchedDoc.title,
                    chunkId: 'chunk-01',
                    excerpt: matchedDoc.excerpt,
                    checksum: matchedDoc.checksum,
                  },
                ]
              : [],
          approvalGate: wfResult.approvalGate,
          approvalHistory: [],
          decisionExecutionIds: wfResult.decisionExecutions.map((d) => d.id),
          workflowVars: wfResult.workflowVars,
          unifiedTrace: wfResult.unifiedTrace,
          failureReason: wfResult.failureReason,
          artifactTitle: `${runId}-workflow-trace.md`,
          artifactMarkdown: wfResult.artifactMarkdown,
        };

        setState((prev) => ({
          ...prev,
          runs: [newRun, ...prev.runs],
          decisions: {
            ...prev.decisions,
            executions: [...wfResult.decisionExecutions, ...prev.decisions.executions].slice(0, 60),
          },
          auditLog: [
            {
              id: `aud-${Date.now()}`,
              workspaceId: prev.activeWorkspaceId,
              timestamp: 'Just now',
              actor: 'SOPIN Flow + Decisions',
              action: `Executed workflow "${matchedWorkflow.name}" (${wfResult.status}, ${wfResult.decisionExecutions.length} decision evals)`,
              target: runId,
              outcome: wfResult.status === 'failed' ? 'Blocked' : 'Allowed',
            },
            ...prev.auditLog,
          ],
        }));

        return runId;
      }

      const matchedGraph =
        payload.targetType === 'Graph'
          ? state.multiAgentGraphs.find(
              (g) => g.workspaceId === state.activeWorkspaceId && g.name === payload.targetName
            )
          : undefined;

      if (matchedGraph) {
        const graphInput = payload.workflowInputPayload ?? {
          citationCount: 4,
          groundedScore: 0.92,
          contradictionCount: 0,
        };
        const gRes = executeMultiAgentGraph(
          matchedGraph,
          graphInput,
          state.agents,
          collections,
          wsDocs,
          { callerClearance: clearance }
        );
        const newRun: ExecutionRun = {
          id: runId,
          workspaceId: state.activeWorkspaceId,
          title: payload.title,
          prompt: payload.prompt,
          targetName: payload.targetName,
          targetType: 'Graph',
          status: gRes.status,
          startedAt: 'Just now',
          estimatedCostUsd: 0.11,
          activeSubAgents: gRes.activeSubAgents,
          steps: gRes.steps,
          sources: gRes.sources,
          approvalGate: gRes.approvalGate,
          approvalHistory: [],
          decisionExecutionIds: gRes.decisionExecutions.map((d) => d.id),
          workflowVars: gRes.finalContext,
          unifiedTrace: gRes.unifiedTrace,
          failureReason: gRes.failureReason,
          artifactTitle: `${runId}-graph-trace.md`,
          artifactMarkdown: gRes.artifactMarkdown,
        };
        setState((prev) => ({
          ...prev,
          runs: [newRun, ...prev.runs],
          decisions: {
            ...prev.decisions,
            executions: [...gRes.decisionExecutions, ...prev.decisions.executions].slice(0, 60),
          },
          auditLog: [
            {
              id: `aud-${Date.now()}`,
              workspaceId: prev.activeWorkspaceId,
              timestamp: 'Just now',
              actor: 'SOPIN Graph Runtime',
              action: `Executed Multi-Agent Graph "${matchedGraph.name}" (${gRes.status})`,
              target: runId,
              outcome: gRes.status === 'failed' ? 'Blocked' : 'Allowed',
            },
            ...prev.auditLog,
          ],
        }));
        return runId;
      }

      // Agent run (may invoke attached authorized Decisions)
      const matchedAgent = state.agents.find(
        (a) => a.workspaceId === state.activeWorkspaceId && a.name === payload.targetName
      );
      const agentExecutions: DecisionExecutionSpec[] = [];
      let agentDecisionSummary = '';
      if (matchedAgent?.attachedDecisions && matchedAgent.attachedDecisions.length > 0) {
        const cap = matchedAgent.attachedDecisions.find((d) => d.allowedExecution === 'read-evaluate');
        if (cap) {
          const defaultAgentInput =
            payload.workflowInputPayload ??
            (cap.targetId === 'rule-research-quality'
              ? { citationCount: 4, groundedScore: 0.92, contradictionCount: 0 }
              : { invoiceAmount: 32500, vendorVerified: true, duplicateFound: false });
          const inv = invokeAgentDecision(matchedAgent, cap.targetId, defaultAgentInput, collections);
          if (inv.execution) agentExecutions.push(inv.execution);
          agentDecisionSummary = inv.recommendedAction;
        }
      }

      const newRun: ExecutionRun = {
        id: runId,
        workspaceId: state.activeWorkspaceId,
        title: payload.title,
        prompt: payload.prompt,
        targetName: payload.targetName,
        targetType: 'Agent',
        status: 'running',
        startedAt: 'Just now',
        estimatedCostUsd: 0.06,
        activeSubAgents:
          agentExecutions.length > 0
            ? ['Planner Agent', 'Context Agent', 'Decision Engine', 'Execution Agent']
            : ['Planner Agent', 'Context Agent', 'Execution Agent'],
        steps: [
          {
            id: `${runId}-1`,
            label: '01. Task Brief & Scope Check',
            agentRole: 'Planner Agent',
            module: 'SOPIN Flow',
            status: 'completed',
            detail: `Scoped local browser-simulated prompt (${payload.prompt.slice(0, 64)}...)`,
          },
          {
            id: `${runId}-2`,
            label: '02. Context Hydration',
            agentRole: 'Context Agent',
            module: 'SOPIN Context',
            status: 'completed',
            toolUsed: 'context.query',
            detail: matchedDoc
              ? `Attached source: ${matchedDoc.title}`
              : 'No external corpus attached; using workspace instructions.',
          },
          ...(agentExecutions[0]
            ? [
                {
                  id: `${runId}-3`,
                  label: `03. Attached Decision · ${agentExecutions[0].artifactName} (${agentExecutions[0].versionUsed})`,
                  agentRole: 'Deterministic Rule Engine',
                  module: 'SOPIN Decisions',
                  status: 'completed' as const,
                  toolUsed: `${agentExecutions[0].artifactType}:${agentExecutions[0].artifactId}`,
                  detail: agentDecisionSummary,
                  decisionExecId: agentExecutions[0].id,
                },
              ]
            : [
                {
                  id: `${runId}-3`,
                  label: '03. Prototype Reasoning & Verification',
                  agentRole: 'Execution Agent',
                  module: 'SOPIN Runtime',
                  status: 'running' as const,
                  toolUsed: 'ci.testRunner',
                  detail: 'Simulating bounded tool execution in local workspace state.',
                },
              ]),
          {
            id: `${runId}-4`,
            label: '04. Human Approval Checkpoint',
            agentRole: 'Governance Agent',
            module: 'SOPIN Control',
            status: 'pending',
            detail: 'SOPIN Control checkpoint requires explicit human sign-off before write export.',
          },
        ],
        sources: matchedDoc
          ? [
              {
                docId: matchedDoc.id,
                docTitle: matchedDoc.title,
                chunkId: 'chunk-01',
                excerpt: matchedDoc.excerpt,
                checksum: matchedDoc.checksum,
              },
            ]
          : [],
        decisionExecutionIds: agentExecutions.map((e) => e.id),
        approvalGate: {
          actionLabel: `Finalize & Export Artifact for "${payload.title}"`,
          reason:
            agentDecisionSummary ||
            'Standard human-in-the-loop review checkpoint enabled in workspace.',
          requiredRole: activeWorkspace.role,
        },
        approvalHistory: [],
        artifactTitle: `${runId}-output.md`,
        artifactMarkdown: `# ${payload.title}\n\n- **Target:** ${payload.targetName}\n- **Workspace:** ${activeWorkspace.name} (Local Browser Prototype)\n- **Source:** ${matchedDoc?.title || 'None'}${
          agentDecisionSummary ? `\n- **Attached Decision Evaluation:** ${agentDecisionSummary}` : ''
        }\n\n## Prototype Summary\n\nTask evaluated locally in browser state: "${payload.prompt}"`,
      };

      setState((prev) => ({
        ...prev,
        runs: [newRun, ...prev.runs],
        decisions:
          agentExecutions.length > 0
            ? {
                ...prev.decisions,
                executions: [...agentExecutions, ...prev.decisions.executions].slice(0, 60),
              }
            : prev.decisions,
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: prev.activeWorkspaceId,
            timestamp: 'Just now',
            actor: matchedAgent ? matchedAgent.name : 'Workspace User',
            action:
              agentExecutions.length > 0
                ? `Agent invoked attached Decision (${agentExecutions[0].artifactName}@${agentExecutions[0].versionUsed})`
                : 'Started local prototype run',
            target: runId,
            outcome: 'Allowed',
          },
          ...prev.auditLog,
        ],
      }));

      return runId;
    },
    [
      state.activeWorkspaceId,
      state.documents,
      state.workflows,
      state.multiAgentGraphs,
      state.agents,
      state.decisions,
      activeWorkspace.name,
      activeWorkspace.role,
    ]
  );

  const advanceRunToApprovalOrComplete = useCallback((runId: string) => {
    setState((prev) => ({
      ...prev,
      runs: prev.runs.map((run) => {
        if (run.id !== runId || run.status !== 'running') return run;
        if (!run.approvalGate) {
          return {
            ...run,
            status: 'completed',
            steps: run.steps.map((s) => ({ ...s, status: 'completed' })),
          };
        }
        return {
          ...run,
          status: 'awaiting-approval',
          steps: run.steps.map((s, idx) =>
            idx === 2
              ? { ...s, status: 'completed', detail: s.detail || 'Prototype execution step finished cleanly.' }
              : idx === 3
              ? { ...s, status: 'awaiting-approval' }
              : s
          ),
        };
      }),
    }));
  }, []);

  const updateRunAction = useCallback(
    (
      runId: string,
      action: 'pause' | 'resume' | 'cancel' | 'retry' | 'approve' | 'reject' | 'escalate',
      meta?: { reason?: string; reviewer?: string; escalateTo?: string }
    ) => {
      setState((prev) => {
        let auditAction = '';
        let auditOutcome: AuditEvent['outcome'] = 'Updated';
        let targetWorkspaceId = prev.activeWorkspaceId;
        const actorName = meta?.reviewer || 'Workspace Maintainer';

        const nextRuns = prev.runs.map((run) => {
          if (run.id !== runId) return run;
          targetWorkspaceId = run.workspaceId;

          if (action === 'pause') {
            auditAction = 'Paused execution run';
            return { ...run, status: 'paused' as const };
          }
          if (action === 'resume') {
            auditAction = 'Resumed execution run';
            return { ...run, status: 'running' as const };
          }
          if (action === 'cancel') {
            auditAction = 'Cancelled execution run';
            return { ...run, status: 'cancelled' as const };
          }
          if (action === 'retry') {
            auditAction = 'Retried failed execution step';
            return {
              ...run,
              status: 'completed' as const,
              failureReason: undefined,
              steps: run.steps.map((s) =>
                s.status === 'failed'
                  ? {
                      ...s,
                      status: 'completed' as const,
                      retriesAttempted: (s.retriesAttempted ?? 0) + 1,
                      detail: 'Retry succeeded in local prototype.',
                    }
                  : s
              ),
              artifactTitle: `${run.id}-retry-summary.md`,
              artifactMarkdown: `# Retry Report (${run.id})\n\nFailed step retried cleanly in local prototype mode.`,
            };
          }
          if (action === 'approve') {
            const reason = meta?.reason?.trim() || 'Verified policy compliance and signed off.';
            auditAction = `Approved human checkpoint (${reason})`;
            auditOutcome = 'Approved';
            const histEntry: ApprovalHistoryRecord = {
              id: `aph-${Date.now()}`,
              timestamp: 'Just now',
              actor: actorName,
              role: run.approvalGate?.requiredRole || 'Workspace Maintainer',
              decision: 'approved',
              reason,
            };
            return {
              ...run,
              status: 'completed' as const,
              approvalGate: run.approvalGate
                ? {
                    ...run.approvalGate,
                    decision: 'approved' as const,
                    assignedReviewer: actorName,
                    decisionReason: reason,
                  }
                : undefined,
              approvalHistory: [histEntry, ...(run.approvalHistory ?? [])],
              steps: run.steps.map((s) =>
                s.status === 'awaiting-approval' || s.status === 'pending'
                  ? { ...s, status: 'completed' as const, detail: `Approved by ${actorName}: ${reason}` }
                  : s
              ),
            };
          }
          if (action === 'reject') {
            const reason = meta?.reason?.trim() || 'Rejected at SOPIN Control governance gate.';
            auditAction = `Rejected human checkpoint (${reason})`;
            auditOutcome = 'Rejected';
            const histEntry: ApprovalHistoryRecord = {
              id: `aph-${Date.now()}`,
              timestamp: 'Just now',
              actor: actorName,
              role: run.approvalGate?.requiredRole || 'Workspace Maintainer',
              decision: 'rejected',
              reason,
            };
            return {
              ...run,
              status: 'cancelled' as const,
              approvalGate: run.approvalGate
                ? {
                    ...run.approvalGate,
                    decision: 'rejected' as const,
                    assignedReviewer: actorName,
                    decisionReason: reason,
                  }
                : undefined,
              approvalHistory: [histEntry, ...(run.approvalHistory ?? [])],
              steps: run.steps.map((s) =>
                s.status === 'awaiting-approval'
                  ? { ...s, status: 'failed' as const, detail: `Rejected by ${actorName}: ${reason}` }
                  : s
              ),
            };
          }
          if (action === 'escalate') {
            const targetEscalate = meta?.escalateTo?.trim() || 'CFO / Chief Compliance Officer';
            const reason = meta?.reason?.trim() || `Escalated to ${targetEscalate} for secondary review.`;
            auditAction = `Escalated approval gate to ${targetEscalate}`;
            auditOutcome = 'Updated';
            const histEntry: ApprovalHistoryRecord = {
              id: `aph-${Date.now()}`,
              timestamp: 'Just now',
              actor: actorName,
              role: run.approvalGate?.requiredRole || 'Workspace Maintainer',
              decision: 'escalated',
              reason,
              escalatedTo: targetEscalate,
            };
            return {
              ...run,
              approvalGate: run.approvalGate
                ? {
                    ...run.approvalGate,
                    requiredRole: targetEscalate,
                    escalatedTo: targetEscalate,
                    decisionReason: reason,
                  }
                : undefined,
              approvalHistory: [histEntry, ...(run.approvalHistory ?? [])],
            };
          }
          return run;
        });

        return {
          ...prev,
          runs: nextRuns,
          auditLog: auditAction
            ? [
                {
                  id: `aud-${Date.now()}`,
                  workspaceId: targetWorkspaceId,
                  timestamp: 'Just now',
                  actor: actorName,
                  action: auditAction,
                  target: runId,
                  outcome: auditOutcome,
                },
                ...prev.auditLog,
              ]
            : prev.auditLog,
        };
      });
    },
    []
  );

  const saveMultiAgentGraph = useCallback((graph: MultiAgentGraphSpec) => {
    setState((prev) => {
      const exists = prev.multiAgentGraphs.some((g) => g.id === graph.id);
      const nextGraphs = exists
        ? prev.multiAgentGraphs.map((g) => (g.id === graph.id ? graph : g))
        : [graph, ...prev.multiAgentGraphs];
      return {
        ...prev,
        multiAgentGraphs: nextGraphs,
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: graph.workspaceId,
            timestamp: 'Just now',
            actor: 'Workflow Architect',
            action: `${exists ? 'Updated' : 'Created'} multi-agent graph ${graph.version}`,
            target: graph.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const validateWorkflowForPublish = useCallback(
    (workflow: WorkflowConfig) => {
      const wsDocs = state.documents.filter((d) => d.workspaceId === workflow.workspaceId);
      const clearance =
        activeWorkspace.role.includes('Maintainer') || activeWorkspace.role.includes('Architect')
          ? ('governance-authorized' as const)
          : ('standard' as const);
      return validateWorkflowPublishReadiness(
        workflow,
        {
          rules: state.decisions.rules,
          tables: state.decisions.tables,
          rulesets: state.decisions.rulesets,
          chains: state.decisions.chains,
          scorecards: state.decisions.scorecards,
        },
        wsDocs,
        clearance
      );
    },
    [state.documents, state.decisions, activeWorkspace.role]
  );

  const addDocument = useCallback((doc: KnowledgeDocument) => {
    setState((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          workspaceId: doc.workspaceId,
          timestamp: 'Just now',
          actor: 'Workspace User',
          action: `Added knowledge source (${doc.sourceType})`,
          target: doc.title,
          outcome: 'Updated',
        },
        ...prev.auditLog,
      ],
    }));
  }, []);

  const updateDocument = useCallback((doc: KnowledgeDocument) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === doc.id ? doc : d)),
    }));
  }, []);

  const deleteDocument = useCallback((docId: string) => {
    setState((prev) => {
      const target = prev.documents.find((d) => d.id === docId);
      return {
        ...prev,
        documents: prev.documents.filter((d) => d.id !== docId),
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: target?.workspaceId || prev.activeWorkspaceId,
            timestamp: 'Just now',
            actor: 'Workspace Maintainer',
            action: 'Removed knowledge source',
            target: target?.title || docId,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const toggleTool = useCallback((toolId: string) => {
    setState((prev) => {
      const target = prev.tools.find((t) => t.id === toolId);
      const nextEnabled = !target?.enabled;
      return {
        ...prev,
        tools: prev.tools.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t)),
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: prev.activeWorkspaceId,
            timestamp: 'Just now',
            actor: 'Workspace Maintainer',
            action: `${nextEnabled ? 'Enabled' : 'Disabled'} MCP tool`,
            target: target?.name || toolId,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const updateWorkspaceBudget = useCallback((tokensBudget: number) => {
    setState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) =>
        w.id === prev.activeWorkspaceId ? { ...w, tokenBudgetMonthly: tokensBudget } : w
      ),
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  }, []);

  const saveDecisionRule = useCallback((rule: RuleSpec, note?: string) => {
    setState((prev) => {
      const existing = prev.decisions.rules.find((r) => r.id === rule.id);
      // Enforce immutable historical snapshots: never mutate prior published version entries
      const preservedHistory = existing
        ? [
            ...rule.versionHistory.filter(
              (nv) => !existing.versionHistory.some((ev) => ev.version === nv.version)
            ),
            ...existing.versionHistory,
          ]
        : rule.versionHistory;

      const safeRule: RuleSpec = {
        ...rule,
        versionHistory: preservedHistory,
      };

      const nextRules = existing
        ? prev.decisions.rules.map((r) => (r.id === rule.id ? safeRule : r))
        : [safeRule, ...prev.decisions.rules];
      return {
        ...prev,
        decisions: { ...prev.decisions, rules: nextRules },
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: safeRule.workspaceId,
            timestamp: 'Just now',
            actor: 'Decision Author',
            action: note || `${existing ? 'Updated' : 'Created'} rule ${safeRule.version} (${safeRule.status})`,
            target: safeRule.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const saveDecisionTable = useCallback((table: DecisionTableSpec, note?: string) => {
    setState((prev) => {
      const existing = prev.decisions.tables.find((t) => t.id === table.id);
      const preservedHistory = existing
        ? [
            ...table.versionHistory.filter(
              (nv) => !existing.versionHistory.some((ev) => ev.version === nv.version)
            ),
            ...existing.versionHistory,
          ]
        : table.versionHistory;

      const safeTable: DecisionTableSpec = {
        ...table,
        versionHistory: preservedHistory,
      };

      const nextTables = existing
        ? prev.decisions.tables.map((t) => (t.id === table.id ? safeTable : t))
        : [safeTable, ...prev.decisions.tables];
      return {
        ...prev,
        decisions: { ...prev.decisions, tables: nextTables },
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: safeTable.workspaceId,
            timestamp: 'Just now',
            actor: 'Decision Author',
            action: note || `${existing ? 'Updated' : 'Created'} decision table ${safeTable.version} (${safeTable.status})`,
            target: safeTable.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const saveRuleset = useCallback((rs: RulesetSpec) => {
    setState((prev) => {
      const exists = prev.decisions.rulesets.some((r) => r.id === rs.id);
      const nextRulesets = exists
        ? prev.decisions.rulesets.map((r) => (r.id === rs.id ? rs : r))
        : [rs, ...prev.decisions.rulesets];
      return {
        ...prev,
        decisions: { ...prev.decisions, rulesets: nextRulesets },
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: rs.workspaceId,
            timestamp: 'Just now',
            actor: 'Decision Author',
            action: `${exists ? 'Updated' : 'Created'} ruleset ${rs.version} (${rs.status})`,
            target: rs.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const saveRuleChain = useCallback((chain: RuleChainSpec) => {
    setState((prev) => {
      const exists = prev.decisions.chains.some((c) => c.id === chain.id);
      const nextChains = exists
        ? prev.decisions.chains.map((c) => (c.id === chain.id ? chain : c))
        : [chain, ...prev.decisions.chains];
      return {
        ...prev,
        decisions: { ...prev.decisions, chains: nextChains },
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: chain.workspaceId,
            timestamp: 'Just now',
            actor: 'Decision Author',
            action: `${exists ? 'Updated' : 'Created'} rule chain ${chain.version}`,
            target: chain.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const saveScorecard = useCallback((sc: ScorecardSpec) => {
    setState((prev) => {
      const exists = prev.decisions.scorecards.some((s) => s.id === sc.id);
      const nextScorecards = exists
        ? prev.decisions.scorecards.map((s) => (s.id === sc.id ? sc : s))
        : [sc, ...prev.decisions.scorecards];
      return {
        ...prev,
        decisions: { ...prev.decisions, scorecards: nextScorecards },
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            workspaceId: sc.workspaceId,
            timestamp: 'Just now',
            actor: 'Decision Author',
            action: `${exists ? 'Updated' : 'Created'} scorecard ${sc.version}`,
            target: sc.name,
            outcome: 'Updated',
          },
          ...prev.auditLog,
        ],
      };
    });
  }, []);

  const recordDecisionExecution = useCallback((exec: DecisionExecutionSpec) => {
    setState((prev) => ({
      ...prev,
      decisions: {
        ...prev.decisions,
        executions: [exec, ...prev.decisions.executions].slice(0, 60),
      },
    }));
  }, []);

  const updateDecisionSettings = useCallback((partial: Partial<DecisionSettings>) => {
    setState((prev) => ({
      ...prev,
      decisions: {
        ...prev.decisions,
        settings: { ...prev.decisions.settings, ...partial },
      },
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          workspaceId: prev.activeWorkspaceId,
          timestamp: 'Just now',
          actor: 'Workspace Maintainer',
          action: 'Updated SOPIN Decisions governance settings',
          target: 'SOPIN Control · Decisions Policy',
          outcome: 'Updated',
        },
        ...prev.auditLog,
      ],
    }));
  }, []);

  const resetWorkspacePrototype = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    markAllNotificationsRead,
    saveAgent,
    saveWorkflow,
    saveMultiAgentGraph,
    validateWorkflowForPublish,
    startPrototypeRun,
    advanceRunToApprovalOrComplete,
    updateRunAction,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleTool,
    updateWorkspaceBudget,
    updateSettings,
    saveDecisionRule,
    saveDecisionTable,
    saveRuleset,
    saveRuleChain,
    saveScorecard,
    recordDecisionExecution,
    updateDecisionSettings,
    resetWorkspacePrototype,
  };
}
