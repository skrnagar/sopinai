import {
  AiRuleDraftSynthesis,
  DecisionConditionNode,
  DecisionGroupNode,
  DecisionInputField,
  DecisionTestCase,
  RuleSpec,
} from '../types';
import { validateRuleSpec } from './validators';

/**
 * SOPIN Studio AI-Assisted Rule Draft Synthesizer (Local Prototype).
 * Converts natural language policies into a validated DRAFT RuleSpec for mandatory human review.
 * Enforces architectural boundaries:
 * - Always creates status: 'Draft' (never 'Published')
 * - Never writes to versionHistory or bypasses authorization
 * - Always validates output through validateRuleSpec()
 */
export function synthesizeRuleDraftFromNL(
  prompt: string,
  workspaceId: string
): AiRuleDraftSynthesis {
  const lower = prompt.toLowerCase();
  const numericMatch = prompt.match(/([0-9][0-9,]{2,})/);
  const threshold = numericMatch ? Number(numericMatch[1].replace(/,/g, '')) : 50000;

  const isInvoice = lower.includes('invoice') || lower.includes('vendor') || lower.includes('payout');
  const checksDuplicate = lower.includes('duplicate');
  const checksVerified = lower.includes('verified') || lower.includes('kyc');
  const hasLessThan =
    lower.includes('below') ||
    lower.includes('under') ||
    lower.includes('less than') ||
    lower.includes('<');

  const inputSchema: DecisionInputField[] = [];
  const predicates: DecisionConditionNode[] = [];

  if (isInvoice || numericMatch) {
    inputSchema.push({
      name: 'invoiceAmount',
      type: 'number',
      required: true,
      description: 'Total invoice amount in normalized workspace currency.',
      sampleDefault: Math.max(1000, Math.round(threshold * 0.5)),
    });
    predicates.push({
      kind: 'predicate',
      id: `pred-${Date.now()}-1`,
      field: 'invoiceAmount',
      operator: hasLessThan ? '<' : '>=',
      value: String(threshold),
    });
  }

  if (checksVerified || isInvoice) {
    inputSchema.push({
      name: 'vendorVerified',
      type: 'boolean',
      required: true,
      description: 'Whether the vendor KYC/verification record is active.',
      sampleDefault: true,
    });
    predicates.push({
      kind: 'predicate',
      id: `pred-${Date.now()}-2`,
      field: 'vendorVerified',
      operator: '==',
      value: 'true',
    });
  }

  if (checksDuplicate) {
    inputSchema.push({
      name: 'duplicateFound',
      type: 'boolean',
      required: true,
      description: 'Result from upstream duplicate invoice check.',
      sampleDefault: false,
    });
    predicates.push({
      kind: 'predicate',
      id: `pred-${Date.now()}-3`,
      field: 'duplicateFound',
      operator: '==',
      value: 'false',
    });
  }

  if (predicates.length === 0) {
    inputSchema.push(
      {
        name: 'riskScore',
        type: 'number',
        required: true,
        description: 'Normalized deterministic score (0-100).',
        sampleDefault: 25,
      },
      {
        name: 'policyVerified',
        type: 'boolean',
        required: true,
        description: 'Pre-check verification status.',
        sampleDefault: true,
      }
    );
    predicates.push(
      {
        kind: 'predicate',
        id: `pred-${Date.now()}-a`,
        field: 'riskScore',
        operator: '<',
        value: '40',
      },
      {
        kind: 'predicate',
        id: `pred-${Date.now()}-b`,
        field: 'policyVerified',
        operator: '==',
        value: 'true',
      }
    );
  }

  const conditionRoot: DecisionGroupNode = {
    kind: 'group',
    id: `grp-${Date.now()}`,
    logic: lower.includes(' or ') ? 'OR' : 'AND',
    children: predicates,
  };

  const positiveOutcome = isInvoice ? 'auto_approve' : 'approved';
  const fallbackOutcome = lower.includes('reject') ? 'rejected' : 'manual_approval';

  const samplePass: Record<string, unknown> = {};
  const sampleFail: Record<string, unknown> = {};
  for (const f of inputSchema) {
    samplePass[f.name] = f.sampleDefault;
    if (f.name === 'invoiceAmount') sampleFail[f.name] = threshold + 15000;
    else if (f.name === 'duplicateFound') sampleFail[f.name] = true;
    else if (f.type === 'boolean') sampleFail[f.name] = false;
    else sampleFail[f.name] = 85;
  }

  const generatedTestCases: DecisionTestCase[] = [
    {
      id: `tc-ai-${Date.now()}-1`,
      name: 'Within policy threshold (auto pass)',
      inputJson: samplePass,
      expectedOutput: { decision: positiveOutcome, requiresHumanGate: false },
    },
    {
      id: `tc-ai-${Date.now()}-2`,
      name: 'Exceeds policy boundary (fallback escalation)',
      inputJson: sampleFail,
      expectedOutput: { decision: fallbackOutcome, requiresHumanGate: true },
    },
  ];

  const ruleDraft: RuleSpec = {
    id: `rule-${Date.now()}`,
    workspaceId,
    name: isInvoice ? 'AI Draft · Invoice Auto-Approval Rule' : 'AI Draft · Compiled Policy Rule',
    description: `Drafted from natural language policy via SOPIN Studio assistant: "${prompt.trim()}"`,
    isDemoData: false,
    tags: ['studio-ai-draft', 'human-review-required'],
    inputSchema,
    conditionRoot,
    thenOutputs: [
      { key: 'decision', valueExpression: positiveOutcome, type: 'string' },
      { key: 'requiresHumanGate', valueExpression: 'false', type: 'boolean' },
      { key: 'policyReason', valueExpression: 'All deterministic conditions satisfied', type: 'string' },
    ],
    elseOutputs: [
      { key: 'decision', valueExpression: fallbackOutcome, type: 'string' },
      { key: 'requiresHumanGate', valueExpression: 'true', type: 'boolean' },
      { key: 'policyReason', valueExpression: 'Escalated per deterministic threshold fallback', type: 'string' },
    ],
    priority: 10,
    executionConfig: {
      stopOnMatch: true,
      strictInputValidation: true,
      expressionMode: 'restricted-safe-evaluator',
    },
    version: 'v0.1-draft',
    environment: 'development',
    status: 'Draft',
    testCases: generatedTestCases,
    versionHistory: [],
    updatedAt: 'Just now',
  };

  const validation = validateRuleSpec(ruleDraft);

  const missingRequirements: string[] = [];
  if (!validation.valid) {
    missingRequirements.push(...validation.errors.map((e) => `Validation issue: ${e}`));
  }
  if (lower.includes('₹') || lower.includes('usd') || lower.includes('$') || isInvoice) {
    missingRequirements.push(
      'Currency normalization not specified: confirm whether non-INR/multi-currency invoices convert upstream in SOPIN Flow.'
    );
  }
  if (isInvoice && !lower.includes('tax') && !lower.includes('gst')) {
    missingRequirements.push(
      `Boundary clarity: specify whether the ${threshold.toLocaleString()} ceiling applies pre-tax or total invoice gross.`
    );
  }
  missingRequirements.push(
    'Governance check: Studio AI outputs are Draft only (validated locally) and must pass batch tests + human confirmation before Staging/Production publishing.'
  );

  return {
    ruleDraft,
    explanation: [
      `Identified ${inputSchema.length} typed input fields (${inputSchema.map((f) => f.name).join(', ')}).`,
      `Compiled ${predicates.length} deterministic ${conditionRoot.logic} predicates targeting "${positiveOutcome}".`,
      `Configured deterministic ELSE fallback emitting "${fallbackOutcome}" with requiresHumanGate=true.`,
      `Validated draft schema & expressions via validateRuleSpec: ${validation.valid ? 'VALID' : 'NEEDS FIX'}.`,
    ],
    missingRequirements,
    generatedTestCases,
  };
}
