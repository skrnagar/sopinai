import {
  DecisionConditionNode,
  DecisionInputField,
  DecisionTableSpec,
  DecisionsWorkspaceSlice,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { assertSafeExpression, isIsoDateLike, isPlainObject, resolveInputField } from './operators';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateInputAgainstSchema(
  schema: DecisionInputField[],
  input: Record<string, unknown>
): string[] {
  const errors: string[] = [];
  if (!isPlainObject(input)) {
    return ['Input payload must be a plain JSON object.'];
  }

  for (const field of schema) {
    const resolved = resolveInputField(input, field.name);
    const val = resolved.value;

    if (field.required) {
      if (field.type === 'null') {
        if (!resolved.exists) {
          errors.push(`Missing required input field "${field.name}" (null).`);
          continue;
        }
      } else if (!resolved.exists || val === undefined || val === null || val === '') {
        errors.push(`Missing required input field "${field.name}" (${field.type}).`);
        continue;
      }
    }

    if (!resolved.exists || val === undefined) continue;

    if (field.type === 'null') {
      if (val !== null) {
        errors.push(`Field "${field.name}" expected null, received ${typeof val}.`);
      }
      continue;
    }

    if (val === null) continue;

    if (field.type === 'number') {
      if (typeof val === 'boolean' || typeof val === 'object') {
        errors.push(`Field "${field.name}" expected number, received ${Array.isArray(val) ? 'array' : typeof val}.`);
      } else {
        const num = typeof val === 'number' ? val : typeof val === 'string' && val.trim() !== '' ? Number(val) : NaN;
        if (Number.isNaN(num) || !Number.isFinite(num)) {
          errors.push(`Field "${field.name}" expected finite number, received "${String(val)}".`);
        }
      }
    } else if (field.type === 'string') {
      if (typeof val !== 'string') {
        errors.push(`Field "${field.name}" expected string, received ${Array.isArray(val) ? 'array' : typeof val}.`);
      }
    } else if (field.type === 'boolean') {
      if (typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
        errors.push(`Field "${field.name}" expected boolean, received "${String(val)}".`);
      }
    } else if (field.type === 'date') {
      if (!isIsoDateLike(val)) {
        errors.push(`Field "${field.name}" expected valid ISO date string, received "${String(val)}".`);
      }
    } else if (field.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`Field "${field.name}" expected array, received ${typeof val}.`);
      }
    } else if (field.type === 'object') {
      if (!isPlainObject(val)) {
        errors.push(`Field "${field.name}" expected object, received ${Array.isArray(val) ? 'array' : typeof val}.`);
      }
    }
  }
  return errors;
}

function validateConditionTree(node: DecisionConditionNode, errors: string[]): void {
  if (node.kind === 'predicate') {
    if (!node.field || !node.field.trim()) {
      errors.push(`Condition predicate "${node.id}" is missing an input field name.`);
    }
    if (node.operator === 'matches_formula') {
      const expr = node.expression || node.value || '';
      const check = assertSafeExpression(expr);
      if (!check.safe && check.reason) {
        errors.push(check.reason);
      }
    }
    if (node.operator === 'between' && (node.value === '' || (node.valueEnd ?? '') === '')) {
      errors.push(`Condition "${node.field}" with 'between' operator requires both lower and upper bounds.`);
    }
    return;
  }

  for (const child of node.children) {
    validateConditionTree(child, errors);
  }
}

export function validateRuleSpec(rule: RuleSpec): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule.id || !rule.name.trim()) {
    errors.push('Rule must have a valid id and non-empty name.');
  }
  if (!rule.conditionRoot) {
    errors.push('Rule is missing conditionRoot.');
  } else {
    validateConditionTree(rule.conditionRoot, errors);
  }

  if (rule.thenOutputs.length === 0) {
    warnings.push('Rule has no THEN outputs configured.');
  }
  if (rule.elseOutputs.length === 0) {
    warnings.push('Rule has no ELSE fallback outputs configured.');
  }

  for (const out of [...rule.thenOutputs, ...rule.elseOutputs]) {
    if (!out.key.trim()) {
      errors.push('Action output key cannot be empty.');
    }
    if (out.type === 'expression') {
      const check = assertSafeExpression(out.valueExpression);
      if (!check.safe && check.reason) errors.push(check.reason);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateDecisionTableSpec(table: DecisionTableSpec): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!table.name.trim()) errors.push('Decision table must have a non-empty name.');
  if (table.inputColumns.length === 0) errors.push('Decision table requires at least one input column.');
  if (table.outputColumns.length === 0) errors.push('Decision table requires at least one output column.');

  const enabledRows = table.rows.filter((r) => r.enabled);
  const signatureCounts = new Map<string, number[]>();

  for (const row of enabledRows) {
    const signature = table.inputColumns.map((col) => (row.cells[col.field] ?? '*').trim()).join('|');
    const existing = signatureCounts.get(signature) ?? [];
    existing.push(row.priority);
    signatureCounts.set(signature, existing);
  }

  for (const [, priorities] of signatureCounts.entries()) {
    if (priorities.length > 1) {
      const msg = `Ambiguous decision table configuration: rows ${priorities.map((p) => `#${p}`).join(', ')} have identical input conditions.`;
      if (table.hitPolicy === 'unique') {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  if (table.hitPolicy === 'unique') {
    const hasCatchAllWildcard = enabledRows.some((row) =>
      table.inputColumns.every((col) => {
        const val = (row.cells[col.field] ?? '*').trim();
        return val === '*' || val.toLowerCase() === 'any';
      })
    );
    if (hasCatchAllWildcard && enabledRows.length > 1) {
      errors.push(
        'Ambiguous unique hit-policy table: wildcard catch-all row (*, *) overlaps with specific rows. Use priority or first-match instead.'
      );
    }
  }

  if (!table.defaultOutput || Object.keys(table.defaultOutput).length === 0) {
    warnings.push('No default fallback output is configured for 0-match evaluations.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateRuleChainSpec(
  chain: RuleChainSpec,
  collections: {
    rules: RuleSpec[];
    tables: DecisionTableSpec[];
    rulesets: RulesetSpec[];
    chains?: RuleChainSpec[];
  },
  visitedChainIds: Set<string> = new Set()
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (visitedChainIds.has(chain.id)) {
    return {
      valid: false,
      errors: [`Circular chain detected: chain "${chain.id}" (${chain.name}) references itself transitively.`],
      warnings,
    };
  }

  const nextVisited = new Set(visitedChainIds);
  nextVisited.add(chain.id);

  if (chain.stages.length === 0) {
    errors.push(`Rule chain "${chain.name}" has no executable stages.`);
  }

  const seenStageOrder = new Set<number>();
  for (const stage of chain.stages) {
    if (seenStageOrder.has(stage.stepOrder)) {
      warnings.push(`Duplicate stage stepOrder ${stage.stepOrder} in chain "${chain.name}".`);
    }
    seenStageOrder.add(stage.stepOrder);

    if (stage.targetType === 'chain') {
      if (stage.targetId === chain.id || nextVisited.has(stage.targetId)) {
        errors.push(
          `Circular chain rejected: stage "${stage.label}" references cyclic chain "${stage.targetId}".`
        );
      } else {
        const subChain = collections.chains?.find((c) => c.id === stage.targetId);
        if (!subChain) {
          errors.push(`Stage "${stage.label}" references missing chain "${stage.targetId}".`);
        } else {
          const subReport = validateRuleChainSpec(subChain, collections, nextVisited);
          errors.push(...subReport.errors);
          warnings.push(...subReport.warnings);
        }
      }
    } else if (stage.targetType === 'rule') {
      if (!collections.rules.some((r) => r.id === stage.targetId)) {
        errors.push(`Stage "${stage.label}" references missing rule "${stage.targetId}".`);
      }
    } else if (stage.targetType === 'table') {
      if (!collections.tables.some((t) => t.id === stage.targetId)) {
        errors.push(`Stage "${stage.label}" references missing table "${stage.targetId}".`);
      }
    } else if (stage.targetType === 'ruleset') {
      if (!collections.rulesets.some((rs) => rs.id === stage.targetId)) {
        errors.push(`Stage "${stage.label}" references missing ruleset "${stage.targetId}".`);
      }
    }

    if (stage.fallbackTargetId && stage.fallbackTargetId === stage.targetId) {
      errors.push(
        `Circular fallback rejected in stage "${stage.label}": fallbackTargetId cannot match targetId "${stage.targetId}".`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateDecisionsSlice(
  raw: unknown,
  fallback: DecisionsWorkspaceSlice
): { slice: DecisionsWorkspaceSlice; recoveredIssues: string[] } {
  const recoveredIssues: string[] = [];
  if (!isPlainObject(raw)) {
    recoveredIssues.push('Corrupted Decisions slice payload; restored baseline defaults.');
    return { slice: fallback, recoveredIssues };
  }

  const safeArray = <T extends { id?: unknown }>(
    val: unknown,
    label: string,
    defaultArr: T[]
  ): T[] => {
    if (!Array.isArray(val)) {
      if (val !== undefined) recoveredIssues.push(`Invalid ${label} list in storage; restored defaults.`);
      return defaultArr;
    }
    const validItems = val.filter((item): item is T => isPlainObject(item) && typeof item.id === 'string');
    if (validItems.length !== val.length) {
      recoveredIssues.push(`Skipped ${val.length - validItems.length} corrupted item(s) in ${label}.`);
    }
    return validItems;
  };

  const rules = safeArray<RuleSpec>(raw.rules, 'rules', fallback.rules).filter(
    (r) => typeof r.name === 'string' && isPlainObject(r.conditionRoot)
  );
  const tables = safeArray<DecisionTableSpec>(raw.tables, 'tables', fallback.tables).filter(
    (t) => typeof t.name === 'string' && Array.isArray(t.rows) && Array.isArray(t.inputColumns)
  );
  const rulesets = safeArray<RulesetSpec>(raw.rulesets, 'rulesets', fallback.rulesets).filter(
    (rs) => typeof rs.name === 'string' && Array.isArray(rs.members)
  );
  const chains = safeArray<RuleChainSpec>(raw.chains, 'chains', fallback.chains).filter(
    (c) => typeof c.name === 'string' && Array.isArray(c.stages)
  );
  const scorecards = safeArray<ScorecardSpec>(raw.scorecards, 'scorecards', fallback.scorecards).filter(
    (sc) => typeof sc.name === 'string' && Array.isArray(sc.criteria)
  );
  const executions = safeArray(raw.executions, 'executions', fallback.executions);

  const settings = isPlainObject(raw.settings)
    ? { ...fallback.settings, ...raw.settings }
    : fallback.settings;

  return {
    slice: {
      rules: rules.length > 0 ? rules : fallback.rules,
      tables: tables.length > 0 ? tables : fallback.tables,
      rulesets: rulesets.length > 0 ? rulesets : fallback.rulesets,
      chains: chains.length > 0 ? chains : fallback.chains,
      scorecards: scorecards.length > 0 ? scorecards : fallback.scorecards,
      executions,
      settings,
    },
    recoveredIssues,
  };
}
