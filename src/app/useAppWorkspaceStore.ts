import { useCallback, useEffect, useState } from 'react';
import {
  AgentConfig,
  AppNotification,
  AppSettings,
  AuditEvent,
  ExecutionRun,
  KnowledgeDocument,
  McpToolRecord,
  WorkflowConfig,
  Workspace,
} from './types';

export interface AppWorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  agents: AgentConfig[];
  workflows: WorkflowConfig[];
  runs: ExecutionRun[];
  documents: KnowledgeDocument[];
  tools: McpToolRecord[];
  auditLog: AuditEvent[];
  notifications: AppNotification[];
  settings: AppSettings;
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
    },
    {
      id: 'agt-research-brief',
      workspaceId: 'ws-core',
      name: 'Citation Brief Synthesizer',
      summary: 'Compiles technical synthesis reports with mandatory source checksum citations.',
      objective: 'Summarize curated internal architecture briefs without ungrounded claims.',
      instructions:
        'Only cite indexed corpus documents. Route draft claims through citation-audit before producing Markdown output.',
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
      knowledgeIds: ['doc-sec-02'],
      memoryTier: 'corpus',
      permissionMode: 'gated-write',
      successCriteria: '100% policy clause linkage or explicit escalation flag.',
      status: 'Draft',
      version: 'v0.9',
      updatedAt: '2 days ago',
    },
  ],
  workflows: [
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
      updatedAt: 'Updated 2d ago',
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
      updatedAt: 'Updated 1w ago',
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
      timestamp: 'Today · 09:42',
      actor: 'PR Verification Agent',
      action: 'Paused for maintainer sign-off',
      target: 'run-481',
      outcome: 'Allowed',
    },
    {
      id: 'aud-2',
      timestamp: 'Today · 09:41',
      actor: 'SOPIN Gateway',
      action: 'Applied pre-inference PII redaction',
      target: 'reasoning-structured',
      outcome: 'Allowed',
    },
    {
      id: 'aud-3',
      timestamp: 'Yesterday · 17:12',
      actor: 'Policy Engine',
      action: 'Blocked unapproved outbound egress',
      target: 'sbx-ci-runner',
      outcome: 'Blocked',
    },
  ],
  notifications: [
    {
      id: 'ntf-1',
      title: 'Approval required · PR #481',
      detail: 'PR Verification Agent paused at Maintainer Approval Gate.',
      timeLabel: '12m ago',
      read: false,
      targetTab: 'run',
    },
    {
      id: 'ntf-2',
      title: 'Failed step · Billing Sync DLQ',
      detail: 'ticket.inspectMetadata exceeded 20s timeout. Ready to retry.',
      timeLabel: 'Yesterday',
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
};

function loadInitialState(): AppWorkspaceState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppWorkspaceState>;
    if (!parsed.workspaces || !parsed.agents || !parsed.runs) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...parsed };
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
    setState((prev) => ({ ...prev, activeWorkspaceId: workspaceId }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
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
    (payload: { title: string; prompt: string; targetName: string; targetType: 'Agent' | 'Workflow'; docId?: string }) => {
      const runId = `run-${Math.floor(500 + Math.random() * 499)}`;
      const matchedDoc = state.documents.find((d) => d.id === payload.docId) ?? state.documents[0];
      const newRun: ExecutionRun = {
        id: runId,
        workspaceId: state.activeWorkspaceId,
        title: payload.title,
        prompt: payload.prompt,
        targetName: payload.targetName,
        targetType: payload.targetType,
        status: 'running',
        startedAt: 'Just now',
        estimatedCostUsd: 0.06,
        activeSubAgents: ['Planner Agent', 'Context Agent', 'Execution Agent'],
        steps: [
          {
            id: `${runId}-1`,
            label: '01. Task Brief & Scope Check',
            agentRole: 'Planner Agent',
            module: 'SOPIN Flow',
            status: 'completed',
            detail: `Scoped local prototype prompt (${payload.prompt.slice(0, 64)}...)`,
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
          {
            id: `${runId}-3`,
            label: '03. Prototype Reasoning & Verification',
            agentRole: 'Execution Agent',
            module: 'SOPIN Runtime',
            status: 'running',
            toolUsed: 'ci.testRunner',
            detail: 'Simulating bounded tool execution in local workspace state.',
          },
          {
            id: `${runId}-4`,
            label: '04. Human Approval Checkpoint',
            agentRole: 'Governance Agent',
            module: 'SOPIN Control',
            status: 'pending',
            detail: 'Will pause for sign-off before emitting final artifact.',
          },
        ],
        sources: matchedDoc
          ? [
              {
                docId: matchedDoc.id,
                docTitle: matchedDoc.title,
                chunkId: 'chunk-01',
                excerpt: matchedDoc.excerpt,
              },
            ]
          : [],
        approvalGate: {
          actionLabel: `Finalize & Export Artifact for "${payload.title}"`,
          reason: 'Standard human-in-the-loop review checkpoint enabled in workspace.',
          requiredRole: activeWorkspace.role,
        },
        artifactTitle: `${runId}-output.md`,
        artifactMarkdown: `# ${payload.title}\n\n- **Target:** ${payload.targetName}\n- **Workspace:** ${activeWorkspace.name}\n- **Source:** ${matchedDoc?.title || 'None'}\n\n## Prototype Summary\n\nTask evaluated locally: "${payload.prompt}"`,
      };

      setState((prev) => ({
        ...prev,
        runs: [newRun, ...prev.runs],
        auditLog: [
          {
            id: `aud-${Date.now()}`,
            timestamp: 'Just now',
            actor: 'Workspace User',
            action: 'Started local prototype run',
            target: runId,
            outcome: 'Allowed',
          },
          ...prev.auditLog,
        ],
      }));

      return runId;
    },
    [state.activeWorkspaceId, state.documents, activeWorkspace.name, activeWorkspace.role]
  );

  const advanceRunToApprovalOrComplete = useCallback((runId: string) => {
    setState((prev) => ({
      ...prev,
      runs: prev.runs.map((run) => {
        if (run.id !== runId || run.status !== 'running') return run;
        return {
          ...run,
          status: 'awaiting-approval',
          steps: run.steps.map((s, idx) =>
            idx === 2
              ? { ...s, status: 'completed', detail: 'Prototype execution step finished cleanly.' }
              : idx === 3
              ? { ...s, status: 'awaiting-approval' }
              : s
          ),
        };
      }),
    }));
  }, []);

  const updateRunAction = useCallback(
    (runId: string, action: 'pause' | 'resume' | 'cancel' | 'retry' | 'approve' | 'reject') => {
      setState((prev) => {
        let auditAction = '';
        let auditOutcome: AuditEvent['outcome'] = 'Updated';

        const nextRuns = prev.runs.map((run) => {
          if (run.id !== runId) return run;

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
                  ? { ...s, status: 'completed' as const, detail: 'Retry succeeded in local prototype.' }
                  : s
              ),
              artifactTitle: `${run.id}-retry-summary.md`,
              artifactMarkdown: `# Retry Report (${run.id})\n\nFailed step retried cleanly in local prototype mode.`,
            };
          }
          if (action === 'approve') {
            auditAction = 'Approved human checkpoint';
            auditOutcome = 'Approved';
            return {
              ...run,
              status: 'completed' as const,
              approvalGate: run.approvalGate
                ? { ...run.approvalGate, decision: 'approved' as const }
                : undefined,
              steps: run.steps.map((s) =>
                s.status === 'awaiting-approval' || s.status === 'pending'
                  ? { ...s, status: 'completed' as const, detail: 'Approved by workspace operator.' }
                  : s
              ),
            };
          }
          if (action === 'reject') {
            auditAction = 'Rejected human checkpoint';
            auditOutcome = 'Rejected';
            return {
              ...run,
              status: 'cancelled' as const,
              approvalGate: run.approvalGate
                ? { ...run.approvalGate, decision: 'rejected' as const }
                : undefined,
              steps: run.steps.map((s) =>
                s.status === 'awaiting-approval'
                  ? { ...s, status: 'failed' as const, detail: 'Halted at human governance gate.' }
                  : s
              ),
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
                  timestamp: 'Just now',
                  actor: 'Workspace Maintainer',
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

  const addDocument = useCallback((doc: KnowledgeDocument) => {
    setState((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
      auditLog: [
        {
          id: `aud-${Date.now()}`,
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
    markAllNotificationsRead,
    saveAgent,
    saveWorkflow,
    startPrototypeRun,
    advanceRunToApprovalOrComplete,
    updateRunAction,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleTool,
    updateWorkspaceBudget,
    updateSettings,
    resetWorkspacePrototype,
  };
}
