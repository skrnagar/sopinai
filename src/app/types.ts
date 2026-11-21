export type AppTabId = 'home' | 'build' | 'decisions' | 'run' | 'knowledge' | 'more';

export type MoreSectionId =
  | 'governance'
  | 'models'
  | 'integrations'
  | 'evaluations'
  | 'monitoring'
  | 'deployments'
  | 'settings';

export type MemoryTier = 'ephemeral' | 'episodic' | 'corpus';
export type AgentStatus = 'Draft' | 'Published';
export type ExecutionStatus =
  | 'running'
  | 'awaiting-approval'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Workspace {
  id: string;
  name: string;
  environment: string;
  role: string;
  tokenBudgetMonthly: number;
  tokensUsed: number;
}

export type DecisionTargetKind = 'rule' | 'table' | 'ruleset' | 'chain' | 'scorecard';
export type DecisionVersionPolicy = 'pinned' | 'latest-published';
export type VariableSourceKind = 'workflow_input' | 'previous_node' | 'context' | 'static';
export type DecisionErrorBehavior = 'fail-workflow' | 'fallback-branch' | 'retry-then-fallback';

export interface AgentDecisionCapability {
  id: string;
  targetType: DecisionTargetKind;
  targetId: string;
  targetName: string;
  versionPolicy: DecisionVersionPolicy;
  pinnedVersion?: string;
  allowedExecution: 'read-evaluate' | 'disabled';
  inputSchemaSummary: string;
  outputSchemaSummary: string;
  usageGuidance: string;
}

export interface AgentConfig {
  id: string;
  workspaceId: string;
  name: string;
  summary: string;
  objective: string;
  instructions: string;
  modelRoute: string;
  budgetCeilingUsd: number;
  tools: string[];
  knowledgeIds: string[];
  memoryTier: MemoryTier;
  permissionMode: 'read-only' | 'gated-write';
  successCriteria: string;
  status: AgentStatus;
  version: string;
  updatedAt: string;
  attachedDecisions?: AgentDecisionCapability[];
}

export type WorkflowStepKind = 'action' | 'condition' | 'decision' | 'integration' | 'approval';

export interface VariableMappingEntry {
  id: string;
  targetField: string;
  targetType?: 'string' | 'number' | 'boolean' | 'date' | 'null' | 'array' | 'object';
  required?: boolean;
  sourceKind: VariableSourceKind;
  sourceRef: string;
  contextDocId?: string;
  defaultValue?: string;
}

export interface DecisionBranchRule {
  id: string;
  label: string;
  matchField: string;
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'in';
  matchValue: string;
  nextStepId: string;
  isFallback?: boolean;
}

export interface WorkflowDecisionNodeConfig {
  targetType: DecisionTargetKind;
  targetId: string;
  targetName: string;
  targetVersion: string;
  versionPolicy?: DecisionVersionPolicy;
  inputMappings: Record<string, string>;
  inputBindings?: VariableMappingEntry[];
  outputMappings?: Record<string, string>;
  branchOutcomes: string[];
  branches?: DecisionBranchRule[];
  successNextStepId?: string;
  noMatchNextStepId?: string;
  failureNextStepId?: string;
  onErrorBehavior?: DecisionErrorBehavior;
  timeoutMs?: number;
}

export interface WorkflowStep {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  detail: string;
  retryMax: number;
  timeoutSec: number;
  requiresApproval: boolean;
  decisionConfig?: WorkflowDecisionNodeConfig;
  nextStepId?: string;
  isEndStep?: boolean;
  simulatedOutput?: Record<string, unknown>;
}

export interface WorkflowConfig {
  id: string;
  workspaceId: string;
  name: string;
  trigger: 'Webhook' | 'Schedule' | 'Manual' | 'Document Upload';
  triggerSpec: string;
  version: string;
  status: 'Draft' | 'Published';
  steps: WorkflowStep[];
  updatedAt: string;
  isDemoData?: boolean;
  sampleInputs?: {
    id: string;
    label: string;
    payload: Record<string, unknown>;
  }[];
}

export interface MultiAgentGraphNode {
  id: string;
  nodeType: 'agent' | 'decision' | 'approval';
  label: string;
  agentId?: string;
  decisionConfig?: WorkflowDecisionNodeConfig;
  requiredRole?: string;
  approvalActionLabel?: string;
  allowedContextDocIds?: string[];
}

export interface MultiAgentGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  conditionField?: string;
  conditionOperator?: '==' | '!=' | 'contains' | 'in';
  conditionValue?: string;
  isFallback?: boolean;
  handoffMappings: Record<string, string>;
}

export interface MultiAgentGraphSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  entryNodeId: string;
  nodes: MultiAgentGraphNode[];
  edges: MultiAgentGraphEdge[];
  version: string;
  status: 'Draft' | 'Published';
  updatedAt: string;
}

export interface ExecutionStepLog {
  id: string;
  label: string;
  agentRole: string;
  module: string;
  status: 'completed' | 'running' | 'pending' | 'failed' | 'awaiting-approval';
  toolUsed?: string;
  detail: string;
  durationMs?: number;
  retriesAttempted?: number;
  decisionExecId?: string;
}

export interface UnifiedTraceSpan {
  id: string;
  kind: 'workflow' | 'agent' | 'decision' | 'tool' | 'approval' | 'verification';
  label: string;
  module: string;
  status: 'completed' | 'awaiting-approval' | 'failed' | 'cancelled' | 'skipped';
  durationMs: number;
  detail: string;
  decisionRef?: {
    executionId: string;
    artifactName: string;
    versionUsed: string;
    matchedRuleOrRow: string;
    redactedInputSummary: Record<string, string>;
    redactedOutputSummary: Record<string, string>;
    retriesAttempted: number;
    errorCode?: string;
  };
  approvalRef?: {
    actionLabel: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    reviewer?: string;
    reason?: string;
    escalatedTo?: string;
  };
  children?: UnifiedTraceSpan[];
}

export interface ApprovalHistoryRecord {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  decision: 'approved' | 'rejected' | 'escalated';
  reason: string;
  escalatedTo?: string;
}

export interface RetrievedSourceRef {
  docId: string;
  docTitle: string;
  chunkId: string;
  excerpt: string;
  checksum?: string;
}

export interface ExecutionRun {
  id: string;
  workspaceId: string;
  title: string;
  prompt: string;
  targetName: string;
  targetType: 'Agent' | 'Workflow' | 'Graph';
  status: ExecutionStatus;
  startedAt: string;
  estimatedCostUsd: number;
  activeSubAgents: string[];
  steps: ExecutionStepLog[];
  sources: RetrievedSourceRef[];
  approvalGate?: {
    actionLabel: string;
    reason: string;
    requiredRole: string;
    decision?: 'approved' | 'rejected';
    assignedReviewer?: string;
    decisionReason?: string;
    escalatedTo?: string;
  };
  approvalHistory?: ApprovalHistoryRecord[];
  decisionExecutionIds?: string[];
  workflowVars?: Record<string, unknown>;
  unifiedTrace?: UnifiedTraceSpan;
  artifactTitle?: string;
  artifactMarkdown?: string;
  failureReason?: string;
}

export interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  title: string;
  sourceType: 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'MD' | 'TXT' | 'Image' | 'URL';
  sizeLabel: string;
  status: 'Indexed' | 'Local Preview';
  memoryTier: MemoryTier;
  accessScope: 'Workspace Read-Only' | 'Restricted Governance';
  checksum: string;
  chunksCount: number;
  excerpt: string;
  structuredAttributes?: Record<string, unknown>;
  imagePreviewUrl?: string;
  sourceUrl?: string;
  updatedAt: string;
}

export interface McpToolRecord {
  id: string;
  name: string;
  transport: string;
  scope: 'read-only' | 'gated-write';
  enabled: boolean;
  description: string;
}

export interface AuditEvent {
  id: string;
  workspaceId?: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  outcome: 'Allowed' | 'Blocked' | 'Approved' | 'Rejected' | 'Updated';
}

export interface AppNotification {
  id: string;
  workspaceId?: string;
  title: string;
  detail: string;
  timeLabel: string;
  read: boolean;
  targetTab: AppTabId;
}

export interface AppSettings {
  approvalAlerts: boolean;
  failureAlerts: boolean;
  budgetAlertPct: number;
  strictSchemaDefault: boolean;
}
