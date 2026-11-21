export type DecisionArtifactStatus =
  | 'Draft'
  | 'Validated'
  | 'Tested'
  | 'Review'
  | 'Published'
  | 'Promoted'
  | 'Archived';

export type DecisionEnvironment = 'development' | 'staging' | 'production';
export type DecisionArtifactType = 'rule' | 'table' | 'ruleset' | 'chain' | 'scorecard';
export type ValidationLevel = 'draft' | 'test-readiness' | 'publication' | 'production-promotion';

export type DecisionSectionId =
  | 'overview'
  | 'rules'
  | 'tables'
  | 'rulesets'
  | 'chains'
  | 'scorecards'
  | 'testing'
  | 'executions'
  | 'versions'
  | 'settings';

export type DecisionFieldType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'date'
  | 'null'
  | 'array'
  | 'object';

export type ConditionOperator =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'between'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'exists'
  | 'not_exists'
  | 'matches_formula';

export interface DecisionInputField {
  name: string;
  type: DecisionFieldType;
  required: boolean;
  description: string;
  sampleDefault?: string | number | boolean | string[];
}

export interface DecisionPredicateNode {
  kind: 'predicate';
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  valueEnd?: string;
  expression?: string;
  reusableLabel?: string;
  caseSensitive?: boolean;
}

export interface DecisionGroupNode {
  kind: 'group';
  id: string;
  logic: 'AND' | 'OR';
  children: DecisionConditionNode[];
}

export type DecisionConditionNode = DecisionPredicateNode | DecisionGroupNode;

export interface DecisionActionOutput {
  key: string;
  valueExpression: string;
  type: 'string' | 'number' | 'boolean' | 'expression';
}

export interface DecisionTestRunRecord {
  runId: string;
  runAt: string;
  passed: boolean;
  actualStatus: 'Matched' | 'Fallback' | 'Error';
  actualOutput: Record<string, unknown>;
  testedVersion: string;
  testedSpecHash: string;
  diffNotes: string[];
}

export interface DecisionTestCase {
  id: string;
  name: string;
  inputJson: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  expectedStatus?: 'Matched' | 'Fallback' | 'Error';
  isBoundaryOrNegative?: boolean;
  lastActualOutput?: Record<string, unknown>;
  lastActualStatus?: 'Matched' | 'Fallback' | 'Error';
  lastPassed?: boolean;
  failedConditions?: string[];
  diffNotes?: string[];
  lastRunAt?: string;
  testedVersion?: string;
  testedSpecHash?: string;
  runHistory?: DecisionTestRunRecord[];
}

export interface DecisionReviewApproval {
  approved: boolean;
  reviewerLabel: string;
  approvedAt: string;
  note?: string;
  controlRequired?: boolean;
}

export interface DecisionVersionSnapshot {
  version: string;
  publishedAt: string;
  publishedBy: string;
  environment: DecisionEnvironment;
  summary: string;
  releaseNotes?: string;
  status: DecisionArtifactStatus;
  lifecycleState?: DecisionArtifactStatus;
  snapshotHash: string;
  canonicalAlgorithm?: 'canonical-json-sha256' | 'legacy-seed';
  serializedSpec: string;
  reviewApproval?: DecisionReviewApproval;
  attributionPlaceholder?: {
    authorLabel: string;
    publisherLabel: string;
    reviewerLabel?: string;
    prototypeNote: string;
  };
}

/**
 * Canonical SOPIN RuleSpec — deterministic IF/ELSE condition tree with input schema,
 * action outputs, restricted expressions, versioning, and regression tests.
 */
export interface RuleSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  tags: string[];
  inputSchema: DecisionInputField[];
  conditionRoot: DecisionGroupNode;
  formulaNote?: string;
  thenOutputs: DecisionActionOutput[];
  elseOutputs: DecisionActionOutput[];
  priority: number;
  executionConfig: {
    stopOnMatch: boolean;
    strictInputValidation: boolean;
    expressionMode: 'restricted-safe-evaluator';
    caseSensitiveStrings?: boolean;
  };
  version: string;
  environment: DecisionEnvironment;
  status: DecisionArtifactStatus;
  reviewApproval?: DecisionReviewApproval;
  testCases: DecisionTestCase[];
  versionHistory: DecisionVersionSnapshot[];
  updatedAt: string;
}

export type HitPolicy = 'first-match' | 'priority' | 'collect-all' | 'unique' | 'any';

export interface DecisionTableColumn {
  id: string;
  field: string;
  label: string;
  type: DecisionFieldType;
  required?: boolean;
}

export interface DecisionTableRow {
  id: string;
  priority: number;
  enabled: boolean;
  cells: Record<string, string>;
  outputs: Record<string, string>;
  note?: string;
}

/**
 * Canonical SOPIN DecisionTableSpec — spreadsheet-style rules with explicit hit policies.
 */
export interface DecisionTableSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  hitPolicy: HitPolicy;
  inputColumns: DecisionTableColumn[];
  outputColumns: DecisionTableColumn[];
  rows: DecisionTableRow[];
  defaultOutput: Record<string, unknown>;
  testCases: DecisionTestCase[];
  version: string;
  environment: DecisionEnvironment;
  status: DecisionArtifactStatus;
  reviewApproval?: DecisionReviewApproval;
  versionHistory: DecisionVersionSnapshot[];
  updatedAt: string;
}

export interface RulesetMember {
  id: string;
  targetType: 'rule' | 'table';
  targetId: string;
  priority: number;
  enabled: boolean;
  stopOnMatch?: boolean;
}

/**
 * Canonical SOPIN RulesetSpec — ordered execution group across rules and decision tables.
 */
export interface RulesetSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  executionOrder: 'priority-asc' | 'priority-desc' | 'sequential';
  conflictResolution: 'first-match' | 'merge-overrides' | 'collect-matches' | 'highest-priority';
  stopOnMatch?: boolean;
  defaultOutput?: Record<string, unknown>;
  members: RulesetMember[];
  version: string;
  environment: DecisionEnvironment;
  status: DecisionArtifactStatus;
  reviewApproval?: DecisionReviewApproval;
  testCases: DecisionTestCase[];
  versionHistory: DecisionVersionSnapshot[];
  updatedAt: string;
}

export interface RuleChainStage {
  id: string;
  stepOrder: number;
  label: string;
  targetType: 'rule' | 'table' | 'ruleset' | 'chain';
  targetId: string;
  passOutputKeys?: string[];
  conditionField?: string;
  conditionOperator?: ConditionOperator;
  conditionValue?: string;
  onOutcome: 'continue' | 'stop-on-match' | 'branch-to-fallback';
  fallbackTargetId?: string;
  terminalOutcomes?: string[];
}

/**
 * Canonical SOPIN RuleChainSpec — sequential decision pipeline passing stage outputs forward.
 */
export interface RuleChainSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  stages: RuleChainStage[];
  terminalOutcomes?: string[];
  version: string;
  environment: DecisionEnvironment;
  status: DecisionArtifactStatus;
  reviewApproval?: DecisionReviewApproval;
  testCases: DecisionTestCase[];
  versionHistory: DecisionVersionSnapshot[];
  updatedAt: string;
}

export interface ScorecardCriterion {
  id: string;
  label: string;
  field: string;
  fieldType?: DecisionFieldType;
  operator: ConditionOperator;
  value: string;
  valueEnd?: string;
  weight: number;
  pointsIfMatched: number;
  pointsIfMissed: number;
  rationale: string;
}

export interface ScorecardThresholdBand {
  id: string;
  minScore: number;
  maxScore: number;
  classification: string;
  decisionOutcome: string;
}

/**
 * Canonical SOPIN ScorecardSpec — deterministic weighted scoring & threshold classification.
 */
export interface ScorecardSpec {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDemoData: boolean;
  baseScore: number;
  criteria: ScorecardCriterion[];
  thresholds: ScorecardThresholdBand[];
  version: string;
  environment: DecisionEnvironment;
  status: DecisionArtifactStatus;
  reviewApproval?: DecisionReviewApproval;
  testCases: DecisionTestCase[];
  versionHistory: DecisionVersionSnapshot[];
  updatedAt: string;
}

export type DecisionArtifactSpec =
  | RuleSpec
  | DecisionTableSpec
  | RulesetSpec
  | RuleChainSpec
  | ScorecardSpec;

export interface ArtifactValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  artifactId: string;
  field?: string;
  rowId?: string;
  columnField?: string;
  nodeId?: string;
  suggestedCorrection?: string;
}

export interface ArtifactValidationResult {
  isValid: boolean;
  valid: boolean;
  level: ValidationLevel;
  errors: ArtifactValidationIssue[];
  warnings: ArtifactValidationIssue[];
  affectedArtifactIds: string[];
  affectedFields: string[];
  suggestedCorrections: string[];
}

export interface ConditionEvalTrace {
  nodeId: string;
  label: string;
  passed: boolean;
  actualValue: string;
  expectedSpec: string;
  explanation?: string;
}

export interface ScoreCriterionTrace {
  criterionId: string;
  label: string;
  matched: boolean;
  weightedPoints: number;
  rationale: string;
}

export interface DecisionTraceStep {
  stepIndex: number;
  phase:
    | 'validation'
    | 'condition'
    | 'table-row'
    | 'ruleset-member'
    | 'chain-stage'
    | 'scorecard'
    | 'outcome'
    | 'error';
  label: string;
  detail: string;
  passed?: boolean;
}

/**
 * Canonical SOPIN DecisionExecutionSpec — deterministic execution record & audit explanation.
 */
export interface DecisionExecutionSpec {
  id: string;
  workspaceId: string;
  artifactType: DecisionArtifactType;
  artifactId: string;
  artifactName: string;
  versionUsed: string;
  environment: DecisionEnvironment;
  sourceTrigger: 'Simulator' | 'SOPIN Flow' | 'Gateway API' | 'Test Suite';
  inputPayload: Record<string, unknown>;
  inputSummary?: Record<string, string>;
  evaluatedConditions: ConditionEvalTrace[];
  matchedConditions?: ConditionEvalTrace[];
  matchedRules: string[];
  matchedTableRows: string[];
  executionTrace?: DecisionTraceStep[];
  executionPath?: string[];
  scoreBreakdown?: {
    baseScore: number;
    totalScore: number;
    classification: string;
    criteriaTraces: ScoreCriterionTrace[];
  };
  finalOutput: Record<string, unknown>;
  explanation: string;
  status: 'Matched' | 'Fallback' | 'Error';
  errorCode?: string;
  validationErrors?: string[];
  durationMs: number;
  executedAt: string;
}

export interface DecisionSettings {
  requireTestPassBeforePublish: boolean;
  requireControlApprovalForProd: boolean;
  strictInputSchemaValidation: boolean;
  restrictExpressionsToSafeSubset: boolean;
  allowedEditorsRole: 'Owner & Admin' | 'Builders & Maintainers' | 'All Workspace Members';
  allowedPublishersRole: 'Owner & Admin Only' | 'Workspace Maintainer';
}

export interface DecisionsWorkspaceSlice {
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
  executions: DecisionExecutionSpec[];
  settings: DecisionSettings;
}

export interface AiRuleDraftSynthesis {
  ruleDraft: RuleSpec;
  explanation: string[];
  missingRequirements: string[];
  generatedTestCases: DecisionTestCase[];
}
