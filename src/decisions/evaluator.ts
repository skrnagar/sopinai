/**
 * SOPIN Decisions — Modular Deterministic Decision Engine Facade.
 * Re-exports the modular evaluation engine under src/decisions/engine/* so UI components,
 * workflow nodes, and tests share a single source of truth with zero duplicate logic.
 */

export {
  assertSafeExpression,
  coerceScalar,
  compareValues,
  doTableCellsOverlap,
  evaluateRestrictedExpression,
  evaluateTableCell,
  parseTypedExpectedValue,
  resolveInputField,
  SUPPORTED_OPERATORS_BY_TYPE,
  validateOperatorForFieldType,
  validateRestrictedExpressionSyntax,
  validateTableCellSyntax,
} from './engine/operators';

export {
  validateArtifact,
  validateDecisionTableArtifact,
  validateDecisionTableSpec,
  validateDecisionsSlice,
  validateInputAgainstSchema,
  validateRuleArtifact,
  validateRuleChainArtifact,
  validateRuleChainSpec,
  validateRuleSpec,
  validateRulesetArtifact,
  validateRulesetSpec,
  validateScorecardArtifact,
  validateScorecardSpec,
} from './engine/validators';
export type { ValidationCollections, ValidationReport } from './engine/validators';

export {
  buildConditionTraceSteps,
  buildInputSummary,
  canonicalSerialize,
  computeCanonicalSpecHash,
  computeDeterministicHash,
  computeSha256Hash,
  nextExecutionId,
  sha256Hex,
  verifySnapshotIntegrity,
} from './engine/executionTrace';

export {
  buildPublishedArtifactVersion,
  buildPublishedChainVersion,
  buildPublishedRuleVersion,
  buildPublishedRulesetVersion,
  buildPublishedScorecardVersion,
  buildPublishedTableVersion,
  compareVersionSnapshots,
  computeArtifactSpecHash,
  extractMappedInputs,
  extractVersionableSpecBody,
  isPublishedSnapshotStatus,
  resolvePublishedArtifact,
  resolvePublishedRuleSpec,
  resolvePublishedTableSpec,
  rollbackArtifactToSnapshot,
} from './engine/versioning';
export type { SnapshotDiffEntry } from './engine/versioning';

export {
  checkEditPermission,
  checkTestEvidenceFreshness,
  evaluatePublishGovernancePolicy,
} from './engine/governancePolicy';
export type { GovernancePolicyCheck } from './engine/governancePolicy';

export { evaluateRuleSpec } from './engine/ruleEvaluator';
export { evaluateDecisionTableSpec } from './engine/decisionTableEvaluator';
export { evaluateRulesetSpec } from './engine/rulesetEvaluator';
export { evaluateRuleChainSpec } from './engine/ruleChainEvaluator';
export { evaluateScorecardSpec } from './engine/scorecardEvaluator';
export {
  evaluateDecisionTarget,
  runBatchTestCases,
  runSingleTestCase,
} from './engine/testRunner';
export type { DecisionCollections, EvaluateTargetOptions } from './engine/testRunner';
export { synthesizeRuleDraftFromNL } from './engine/aiDraftSynthesizer';

export {
  executeMultiAgentGraph,
  executeRuntimeDecision,
  executeWorkflowWithDecisions,
  getTargetArtifactStatus,
  getTargetInputSchema,
  invokeAgentDecision,
  isValueCompatibleWithFieldType,
  redactSensitiveObject,
  redactSensitiveValue,
  resolveVariableBindings,
  validateDecisionNodeConfig,
  validateWorkflowPublishReadiness,
} from './engine/integrationRuntime';
export type {
  AgentDecisionInvokeResult,
  ContextClearance,
  MultiAgentGraphResult,
  NodeMappingValidationResult,
  RuntimeDecisionRequest,
  RuntimeDecisionResult,
  VariableProvenanceRecord,
  VariableResolutionOutput,
  WorkflowExecutionResult,
} from './engine/integrationRuntime';
