/**
 * SOPIN Decisions — Modular Deterministic Decision Engine Facade.
 * Re-exports the modular evaluation engine under src/decisions/engine/* so UI components,
 * workflow nodes, and tests share a single source of truth with zero duplicate logic.
 */

export {
  assertSafeExpression,
  coerceScalar,
  compareValues,
  evaluateRestrictedExpression,
  evaluateTableCell,
  resolveInputField,
} from './engine/operators';

export {
  validateDecisionTableSpec,
  validateDecisionsSlice,
  validateInputAgainstSchema,
  validateRuleChainSpec,
  validateRuleSpec,
} from './engine/validators';
export type { ValidationReport } from './engine/validators';

export {
  buildConditionTraceSteps,
  buildInputSummary,
  computeDeterministicHash,
  nextExecutionId,
} from './engine/executionTrace';

export {
  buildPublishedRuleVersion,
  buildPublishedRulesetVersion,
  buildPublishedTableVersion,
  extractMappedInputs,
  resolvePublishedRuleSpec,
  resolvePublishedTableSpec,
} from './engine/versioning';

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
