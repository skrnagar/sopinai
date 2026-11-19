export type AppTabId = 'home' | 'build' | 'run' | 'knowledge' | 'more';

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
}

export type WorkflowStepKind = 'action' | 'condition' | 'integration' | 'approval';

export interface WorkflowStep {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  detail: string;
  retryMax: number;
  timeoutSec: number;
  requiresApproval: boolean;
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
}

export interface ExecutionStepLog {
  id: string;
  label: string;
  agentRole: string;
  module: string;
  status: 'completed' | 'running' | 'pending' | 'failed' | 'awaiting-approval';
  toolUsed?: string;
  detail: string;
}

export interface RetrievedSourceRef {
  docId: string;
  docTitle: string;
  chunkId: string;
  excerpt: string;
}

export interface ExecutionRun {
  id: string;
  workspaceId: string;
  title: string;
  prompt: string;
  targetName: string;
  targetType: 'Agent' | 'Workflow';
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
  };
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
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  outcome: 'Allowed' | 'Blocked' | 'Approved' | 'Rejected' | 'Updated';
}

export interface AppNotification {
  id: string;
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
