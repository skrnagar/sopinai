import {
  ArtifactValidationIssue,
  ArtifactValidationResult,
  DecisionArtifactType,
  DecisionConditionNode,
  DecisionFieldType,
  DecisionInputField,
  DecisionTableSpec,
  DecisionsWorkspaceSlice,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
  ValidationLevel,
} from '../types';
import {
  assertSafeExpression,
  coerceScalar,
  doTableCellsOverlap,
  isIsoDateLike,
  isPlainObject,
  resolveInputField,
  validateOperatorForFieldType,
  validateRestrictedExpressionSyntax,
  validateTableCellSyntax,
} from './operators';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  structured?: ArtifactValidationResult;
}

export interface ValidationCollections {
  rules?: RuleSpec[];
  tables?: DecisionTableSpec[];
  rulesets?: RulesetSpec[];
  chains?: RuleChainSpec[];
  scorecards?: ScorecardSpec[];
}

function finalizeResult(
  level: ValidationLevel,
  issues: ArtifactValidationIssue[]
): ArtifactValidationResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const affectedArtifactIds = Array.from(new Set(issues.map((i) => i.artifactId)));
  const affectedFields = Array.from(
    new Set(issues.map((i) => i.field || i.columnField).filter((x): x is string => Boolean(x)))
  );
  const suggestedCorrections = Array.from(
    new Set(issues.map((i) => i.suggestedCorrection).filter((x): x is string => Boolean(x)))
  );

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    level,
    errors,
    warnings,
    affectedArtifactIds,
    affectedFields,
    suggestedCorrections,
  };
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
      if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
        errors.push(
          `Field "${field.name}" expected finite number, received ${
            Array.isArray(val) ? 'array' : `${typeof val} (${String(val)})`
          }.`
        );
      }
    } else if (field.type === 'string') {
      if (typeof val !== 'string') {
        errors.push(
          `Field "${field.name}" expected string, received ${Array.isArray(val) ? 'array' : typeof val}.`
        );
      }
    } else if (field.type === 'boolean') {
      if (typeof val !== 'boolean') {
        errors.push(`Field "${field.name}" expected boolean, received "${String(val)}" (${typeof val}).`);
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
        errors.push(
          `Field "${field.name}" expected object, received ${Array.isArray(val) ? 'array' : typeof val}.`
        );
      }
    }
  }
  return errors;
}

function lookupSchemaField(
  schema: DecisionInputField[],
  fieldPath: string
): DecisionInputField | undefined {
  const exact = schema.find((f) => f.name === fieldPath);
  if (exact) return exact;
  if (fieldPath.includes('.')) {
    const root = fieldPath.split('.')[0];
    return schema.find((f) => f.name === root);
  }
  return undefined;
}

function validateConditionTree(
  ruleId: string,
  node: DecisionConditionNode,
  schema: DecisionInputField[],
  issues: ArtifactValidationIssue[]
): void {
  if (node.kind === 'predicate') {
    const fieldName = node.field?.trim() ?? '';
    if (!fieldName) {
      issues.push({
        code: 'MISSING_PREDICATE_FIELD',
        severity: 'error',
        message: `Condition predicate "${node.id}" is missing an input field name.`,
        artifactId: ruleId,
        nodeId: node.id,
        suggestedCorrection: 'Select or declare an input field from inputSchema.',
      });
      return;
    }

    const schemaEntry = lookupSchemaField(schema, fieldName);
    if (schema.length > 0 && !schemaEntry && node.operator !== 'matches_formula') {
      issues.push({
        code: 'UNDECLARED_INPUT_FIELD',
        severity: 'error',
        message: `Condition references undeclared field "${fieldName}" not present in inputSchema.`,
        artifactId: ruleId,
        field: fieldName,
        nodeId: node.id,
        suggestedCorrection: `Add "${fieldName}" to Input Schema or select a declared schema field.`,
      });
    } else if (schemaEntry && !(schemaEntry.type === 'object' && fieldName.includes('.'))) {
      const opCheck = validateOperatorForFieldType(node.operator, schemaEntry.type);
      if (!opCheck.valid && opCheck.reason) {
        issues.push({
          code: 'INVALID_OPERATOR_FOR_TYPE',
          severity: 'error',
          message: `Condition on "${fieldName}": ${opCheck.reason}`,
          artifactId: ruleId,
          field: fieldName,
          nodeId: node.id,
          suggestedCorrection: `Choose an operator compatible with type "${schemaEntry.type}".`,
        });
      }
    }

    if (node.operator === 'matches_formula') {
      const expr = node.expression || node.value || '';
      const allowed = new Set(schema.map((s) => s.name));
      const check = validateRestrictedExpressionSyntax(expr, allowed.size > 0 ? allowed : undefined);
      if (!check.valid && check.reason) {
        issues.push({
          code: 'INVALID_FORMULA_EXPRESSION',
          severity: 'error',
          message: check.reason,
          artifactId: ruleId,
          field: fieldName,
          nodeId: node.id,
          suggestedCorrection: 'Fix formula syntax and use only declared input fields and pure arithmetic/comparisons.',
        });
      }
      return;
    }

    const unaryOps = new Set(['is_empty', 'is_not_empty', 'exists', 'not_exists']);
    if (!unaryOps.has(node.operator)) {
      if (node.value === undefined || node.value.trim() === '') {
        issues.push({
          code: 'MISSING_CONDITION_VALUE',
          severity: 'error',
          message: `Condition "${fieldName} ${node.operator}" requires a comparison value.`,
          artifactId: ruleId,
          field: fieldName,
          nodeId: node.id,
          suggestedCorrection: 'Provide a comparison literal matching the field type.',
        });
      } else if (schemaEntry && !(schemaEntry.type === 'object' && fieldName.includes('.'))) {
        if (
          schemaEntry.type === 'number' &&
          node.operator !== 'in' &&
          node.operator !== 'not_in'
        ) {
          const num = Number(node.value);
          if (Number.isNaN(num) || !Number.isFinite(num)) {
            issues.push({
              code: 'TYPE_MISMATCH_OPERAND',
              severity: 'error',
              message: `Numeric field "${fieldName}" cannot compare against non-numeric value "${node.value}".`,
              artifactId: ruleId,
              field: fieldName,
              nodeId: node.id,
              suggestedCorrection: 'Enter a valid finite number.',
            });
          }
        } else if (schemaEntry.type === 'boolean') {
          const v = node.value.trim();
          if (v !== 'true' && v !== 'false') {
            issues.push({
              code: 'TYPE_MISMATCH_OPERAND',
              severity: 'error',
              message: `Boolean field "${fieldName}" must compare against "true" or "false" (got "${node.value}").`,
              artifactId: ruleId,
              field: fieldName,
              nodeId: node.id,
              suggestedCorrection: 'Use "true" or "false".',
            });
          }
        } else if (schemaEntry.type === 'date' && !isIsoDateLike(node.value)) {
          issues.push({
            code: 'TYPE_MISMATCH_OPERAND',
            severity: 'error',
            message: `Date field "${fieldName}" requires a valid ISO date (got "${node.value}").`,
            artifactId: ruleId,
            field: fieldName,
            nodeId: node.id,
            suggestedCorrection: 'Use YYYY-MM-DD or full ISO-8601 date string.',
          });
        }
      }
    }

    if (node.operator === 'between') {
      if (node.value.trim() === '' || (node.valueEnd ?? '').trim() === '') {
        issues.push({
          code: 'INCOMPLETE_BETWEEN_BOUNDS',
          severity: 'error',
          message: `Condition "${fieldName}" with 'between' operator requires both lower and upper bounds.`,
          artifactId: ruleId,
          field: fieldName,
          nodeId: node.id,
          suggestedCorrection: 'Provide both start and end values for the range.',
        });
      } else if (schemaEntry?.type === 'number') {
        const low = Number(node.value);
        const high = Number(node.valueEnd);
        if (Number.isNaN(high) || !Number.isFinite(high)) {
          issues.push({
            code: 'TYPE_MISMATCH_OPERAND',
            severity: 'error',
            message: `Upper bound "${node.valueEnd}" for numeric 'between' on "${fieldName}" must be numeric.`,
            artifactId: ruleId,
            field: fieldName,
            nodeId: node.id,
          });
        } else if (!Number.isNaN(low) && low > high) {
          issues.push({
            code: 'INVERTED_RANGE_BOUNDS',
            severity: 'error',
            message: `Condition "${fieldName}" has inverted 'between' bounds (${low} > ${high}).`,
            artifactId: ruleId,
            field: fieldName,
            nodeId: node.id,
            suggestedCorrection: `Set lower bound <= upper bound (e.g. ${high} to ${low}).`,
          });
        }
      } else if (schemaEntry?.type === 'date' && !isIsoDateLike(node.valueEnd)) {
        issues.push({
          code: 'TYPE_MISMATCH_OPERAND',
          severity: 'error',
          message: `Upper bound "${node.valueEnd}" for date 'between' on "${fieldName}" must be a valid ISO date.`,
          artifactId: ruleId,
          field: fieldName,
          nodeId: node.id,
        });
      }
    }
    return;
  }

  if (node.children.length === 0) {
    issues.push({
      code: 'EMPTY_CONDITION_GROUP',
      severity: 'error',
      message: `Condition group "${node.id}" (${node.logic}) cannot be empty.`,
      artifactId: ruleId,
      nodeId: node.id,
      suggestedCorrection: 'Add at least one predicate or remove the empty condition group.',
    });
    return;
  }

  for (const child of node.children) {
    validateConditionTree(ruleId, child, schema, issues);
  }
}

export function validateRuleArtifact(
  rule: RuleSpec,
  level: ValidationLevel = 'draft'
): ArtifactValidationResult {
  const issues: ArtifactValidationIssue[] = [];

  if (!rule.id || !rule.name.trim()) {
    issues.push({
      code: 'MISSING_NAME',
      severity: 'error',
      message: 'Rule must have a valid id and non-empty name.',
      artifactId: rule.id || 'rule',
      field: 'name',
      suggestedCorrection: 'Enter a descriptive rule name.',
    });
  }

  const seenSchemaFields = new Set<string>();
  for (const f of rule.inputSchema) {
    const trimmed = f.name.trim();
    if (!trimmed) {
      issues.push({
        code: 'EMPTY_SCHEMA_FIELD',
        severity: 'error',
        message: 'Input schema contains a field with an empty name.',
        artifactId: rule.id,
        suggestedCorrection: 'Provide a valid identifier for every schema field.',
      });
    } else if (seenSchemaFields.has(trimmed)) {
      issues.push({
        code: 'DUPLICATE_SCHEMA_FIELD',
        severity: 'error',
        message: `Duplicate input schema field "${trimmed}".`,
        artifactId: rule.id,
        field: trimmed,
        suggestedCorrection: 'Remove or rename duplicate input schema field.',
      });
    } else {
      seenSchemaFields.add(trimmed);
    }
  }

  if (!rule.conditionRoot) {
    issues.push({
      code: 'MISSING_CONDITION_ROOT',
      severity: 'error',
      message: 'Rule is missing conditionRoot.',
      artifactId: rule.id,
    });
  } else {
    validateConditionTree(rule.id, rule.conditionRoot, rule.inputSchema, issues);
  }

  if (rule.thenOutputs.length === 0) {
    issues.push({
      code: 'MISSING_THEN_OUTPUT',
      severity: level === 'publication' || level === 'production-promotion' ? 'error' : 'warning',
      message: 'Rule has no THEN outputs configured.',
      artifactId: rule.id,
      suggestedCorrection: 'Add at least one THEN action output.',
    });
  }
  if (rule.elseOutputs.length === 0) {
    issues.push({
      code: 'MISSING_ELSE_OUTPUT',
      severity: 'warning',
      message: 'Rule has no ELSE fallback outputs configured.',
      artifactId: rule.id,
      suggestedCorrection: 'Define explicit ELSE fallback outputs for non-matching inputs.',
    });
  }

  const allowedFields = new Set(rule.inputSchema.map((s) => s.name));
  for (const out of [...rule.thenOutputs, ...rule.elseOutputs]) {
    if (!out.key.trim()) {
      issues.push({
        code: 'EMPTY_OUTPUT_KEY',
        severity: 'error',
        message: 'Action output key cannot be empty.',
        artifactId: rule.id,
        suggestedCorrection: 'Provide a valid output field name.',
      });
    }
    if (out.type === 'expression') {
      const check = validateRestrictedExpressionSyntax(
        out.valueExpression,
        allowedFields.size > 0 ? allowedFields : undefined
      );
      if (!check.valid && check.reason) {
        issues.push({
          code: 'UNSAFE_OR_INVALID_EXPRESSION',
          severity: 'error',
          message: `Output "${out.key}": ${check.reason}`,
          artifactId: rule.id,
          field: out.key,
        });
      }
    } else if (out.type === 'number') {
      const n = Number(out.valueExpression);
      if (out.valueExpression.trim() === '' || Number.isNaN(n) || !Number.isFinite(n)) {
        issues.push({
          code: 'INVALID_OUTPUT_NUMBER',
          severity: 'error',
          message: `Output "${out.key}" declared as number has non-numeric value "${out.valueExpression}".`,
          artifactId: rule.id,
          field: out.key,
        });
      }
    } else if (out.type === 'boolean') {
      const v = out.valueExpression.trim().toLowerCase();
      if (v !== 'true' && v !== 'false') {
        issues.push({
          code: 'INVALID_OUTPUT_BOOLEAN',
          severity: 'error',
          message: `Output "${out.key}" declared as boolean must be "true" or "false".`,
          artifactId: rule.id,
          field: out.key,
        });
      }
    }
  }

  if (level !== 'draft' && rule.testCases.length === 0) {
    issues.push({
      code: 'MISSING_TEST_CASES',
      severity: level === 'production-promotion' ? 'error' : 'warning',
      message: `Rule "${rule.name}" has no golden regression test cases.`,
      artifactId: rule.id,
      suggestedCorrection: 'Add positive and boundary/negative test fixtures in Test & Sim.',
    });
  }

  return finalizeResult(level, issues);
}

export function validateRuleSpec(rule: RuleSpec): ValidationReport {
  const structured = validateRuleArtifact(rule, 'draft');
  return {
    valid: structured.isValid,
    errors: structured.errors.map((e) => e.message),
    warnings: structured.warnings.map((w) => w.message),
    structured,
  };
}

export function validateDecisionTableArtifact(
  table: DecisionTableSpec,
  level: ValidationLevel = 'draft'
): ArtifactValidationResult {
  const issues: ArtifactValidationIssue[] = [];

  if (!table.name.trim()) {
    issues.push({
      code: 'MISSING_NAME',
      severity: 'error',
      message: 'Decision table must have a non-empty name.',
      artifactId: table.id,
      field: 'name',
    });
  }
  if (table.inputColumns.length === 0) {
    issues.push({
      code: 'MISSING_INPUT_COLUMNS',
      severity: 'error',
      message: 'Decision table requires at least one input column.',
      artifactId: table.id,
    });
  }
  if (table.outputColumns.length === 0) {
    issues.push({
      code: 'MISSING_OUTPUT_COLUMNS',
      severity: 'error',
      message: 'Decision table requires at least one output column.',
      artifactId: table.id,
    });
  }

  // Validate unique column IDs and field names
  const seenInIds = new Set<string>();
  const seenInFields = new Set<string>();
  for (const col of table.inputColumns) {
    if (!col.field.trim()) {
      issues.push({
        code: 'EMPTY_COLUMN_FIELD',
        severity: 'error',
        message: `Input column "${col.label || col.id}" is missing a field identifier.`,
        artifactId: table.id,
      });
    } else if (seenInFields.has(col.field)) {
      issues.push({
        code: 'DUPLICATE_COLUMN_FIELD',
        severity: 'error',
        message: `Duplicate input column field "${col.field}".`,
        artifactId: table.id,
        columnField: col.field,
        suggestedCorrection: 'Each input column must bind to a unique field name.',
      });
    } else {
      seenInFields.add(col.field);
    }
    if (seenInIds.has(col.id)) {
      issues.push({
        code: 'DUPLICATE_COLUMN_ID',
        severity: 'error',
        message: `Duplicate input column id "${col.id}".`,
        artifactId: table.id,
        columnField: col.field,
      });
    } else {
      seenInIds.add(col.id);
    }
  }

  const seenOutIds = new Set<string>();
  const seenOutFields = new Set<string>();
  for (const col of table.outputColumns) {
    if (!col.field.trim()) {
      issues.push({
        code: 'EMPTY_OUTPUT_COLUMN_FIELD',
        severity: 'error',
        message: `Output column "${col.label || col.id}" is missing a field identifier.`,
        artifactId: table.id,
      });
    } else if (seenOutFields.has(col.field)) {
      issues.push({
        code: 'DUPLICATE_OUTPUT_FIELD',
        severity: 'error',
        message: `Duplicate output column field "${col.field}".`,
        artifactId: table.id,
        columnField: col.field,
      });
    } else {
      seenOutFields.add(col.field);
    }
    if (seenOutIds.has(col.id)) {
      issues.push({
        code: 'DUPLICATE_OUTPUT_COLUMN_ID',
        severity: 'error',
        message: `Duplicate output column id "${col.id}".`,
        artifactId: table.id,
        columnField: col.field,
      });
    } else {
      seenOutIds.add(col.id);
    }
  }

  const enabledRows = table.rows.filter((r) => r.enabled);
  if (enabledRows.length === 0) {
    issues.push({
      code: 'NO_ENABLED_ROWS',
      severity: 'error',
      message: 'Decision table must contain at least one enabled rule row.',
      artifactId: table.id,
      suggestedCorrection: 'Add or enable at least one row.',
    });
  }

  // Cell expression validation + required outputs + priority conflict detection
  const priorityMap = new Map<number, string[]>();
  const signatureCounts = new Map<string, number[]>();

  for (const row of enabledRows) {
    const prioRows = priorityMap.get(row.priority) ?? [];
    prioRows.push(row.id);
    priorityMap.set(row.priority, prioRows);

    for (const col of table.inputColumns) {
      const cellSpec = row.cells[col.field] ?? '*';
      const cellCheck = validateTableCellSyntax(cellSpec, col.type);
      if (!cellCheck.valid && cellCheck.reason) {
        issues.push({
          code: 'INVALID_TABLE_CELL',
          severity: 'error',
          message: `Row #${row.priority}, column "${col.label}": ${cellCheck.reason}`,
          artifactId: table.id,
          rowId: row.id,
          columnField: col.field,
          suggestedCorrection: `Correct cell syntax to match column type "${col.type}".`,
        });
      }
    }

    const rowOutputValues = Object.values(row.outputs).filter((v) => String(v ?? '').trim() !== '');
    if (rowOutputValues.length === 0) {
      issues.push({
        code: 'EMPTY_ROW_OUTPUTS',
        severity: 'error',
        message: `Row #${row.priority} must define at least one non-empty output value.`,
        artifactId: table.id,
        rowId: row.id,
        suggestedCorrection: `Enter output values for Row #${row.priority}.`,
      });
    }

    for (const outCol of table.outputColumns) {
      const rawOut = row.outputs[outCol.field];
      const safeOutCheck = assertSafeExpression(String(rawOut ?? ''));
      if (!safeOutCheck.safe && safeOutCheck.reason) {
        issues.push({
          code: 'UNSAFE_OUTPUT_CELL',
          severity: 'error',
          message: `Row #${row.priority}, output "${outCol.label}": ${safeOutCheck.reason}`,
          artifactId: table.id,
          rowId: row.id,
          columnField: outCol.field,
        });
      }
      if (rawOut === undefined || String(rawOut).trim() === '') {
        const strictlyRequired =
          outCol.required === true || level === 'publication' || level === 'production-promotion';
        issues.push({
          code: 'MISSING_ROW_OUTPUT',
          severity: strictlyRequired ? 'error' : 'warning',
          message: `Row #${row.priority} is missing ${strictlyRequired ? 'required ' : ''}output value for "${outCol.label}".`,
          artifactId: table.id,
          rowId: row.id,
          columnField: outCol.field,
          suggestedCorrection: `Enter an output value for "${outCol.field}" in Row #${row.priority}.`,
        });
      } else if (outCol.type === 'number') {
        const n = Number(rawOut);
        if (Number.isNaN(n) || !Number.isFinite(n)) {
          issues.push({
            code: 'INVALID_OUTPUT_CELL_TYPE',
            severity: 'error',
            message: `Row #${row.priority}, output "${outCol.label}" expected finite number, got "${rawOut}".`,
            artifactId: table.id,
            rowId: row.id,
            columnField: outCol.field,
          });
        }
      } else if (outCol.type === 'boolean') {
        const b = String(rawOut).trim();
        if (b !== 'true' && b !== 'false') {
          issues.push({
            code: 'INVALID_OUTPUT_CELL_TYPE',
            severity: 'error',
            message: `Row #${row.priority}, output "${outCol.label}" expected boolean (true/false), got "${rawOut}".`,
            artifactId: table.id,
            rowId: row.id,
            columnField: outCol.field,
          });
        }
      }
    }

    const signature = table.inputColumns
      .map((col) => (row.cells[col.field] ?? '*').trim())
      .join('|');
    const existing = signatureCounts.get(signature) ?? [];
    existing.push(row.priority);
    signatureCounts.set(signature, existing);
  }

  // Priority conflicts under priority hit policy
  if (table.hitPolicy === 'priority') {
    for (const [prio, rowIds] of priorityMap.entries()) {
      if (rowIds.length > 1) {
        issues.push({
          code: 'PRIORITY_CONFLICT',
          severity: 'error',
          message: `Priority conflict: ${rowIds.length} enabled rows share priority #${prio}.`,
          artifactId: table.id,
          rowId: rowIds[1],
          suggestedCorrection: 'Assign distinct integer priorities to each enabled row under priority policy.',
        });
      }
    }
  }

  // Exact duplicate condition signatures
  for (const [, priorities] of signatureCounts.entries()) {
    if (priorities.length > 1) {
      const msg = `Ambiguous decision table configuration: rows ${priorities
        .map((p) => `#${p}`)
        .join(', ')} have identical input conditions.`;
      issues.push({
        code: 'DUPLICATE_TABLE_ROW',
        severity: table.hitPolicy === 'unique' ? 'error' : 'warning',
        message: msg,
        artifactId: table.id,
        suggestedCorrection: 'Differentiate row predicates or remove redundant rows.',
      });
    }
  }

  // Pairwise semantic overlap detection across all input columns
  for (let i = 0; i < enabledRows.length; i++) {
    for (let j = i + 1; j < enabledRows.length; j++) {
      const rowA = enabledRows[i];
      const rowB = enabledRows[j];
      const allColsOverlap = table.inputColumns.every((col) =>
        doTableCellsOverlap(rowA.cells[col.field] ?? '*', rowB.cells[col.field] ?? '*', col.type)
      );
      if (!allColsOverlap) continue;

      if (table.hitPolicy === 'unique') {
        issues.push({
          code: 'UNIQUE_OVERLAP_CONFLICT',
          severity: 'error',
          message: `Overlapping rows under 'unique' hit policy: Row #${rowA.priority} and Row #${rowB.priority} can both match simultaneously.`,
          artifactId: table.id,
          rowId: rowB.id,
          suggestedCorrection:
            'Make input intervals/values mutually exclusive or switch hit policy to priority / first-match.',
        });
      } else if (table.hitPolicy === 'any') {
        const sameOutputs = table.outputColumns.every(
          (col) =>
            String(coerceScalar(rowA.outputs[col.field] ?? '')) ===
            String(coerceScalar(rowB.outputs[col.field] ?? ''))
        );
        if (!sameOutputs) {
          issues.push({
            code: 'ANY_POLICY_OUTPUT_CONFLICT',
            severity: 'error',
            message: `Hit policy 'any' conflict: overlapping Row #${rowA.priority} and Row #${rowB.priority} produce different outputs.`,
            artifactId: table.id,
            rowId: rowB.id,
            suggestedCorrection:
              "Under 'any' hit policy, overlapping rows must emit identical outputs or be made mutually exclusive.",
          });
        }
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
      issues.push({
        code: 'UNIQUE_WILDCARD_OVERLAP',
        severity: 'error',
        message:
          'Ambiguous unique hit-policy table: wildcard catch-all row (*, *) overlaps with specific rows. Use priority or first-match instead.',
        artifactId: table.id,
      });
    }
  }

  if (!table.defaultOutput || Object.keys(table.defaultOutput).length === 0) {
    issues.push({
      code: 'MISSING_DEFAULT_FALLBACK',
      severity: 'warning',
      message: 'No default fallback output is configured for 0-match evaluations.',
      artifactId: table.id,
      suggestedCorrection: 'Configure defaultOutput values for deterministic no-match fallback.',
    });
  }

  if (level !== 'draft' && table.testCases.length === 0) {
    issues.push({
      code: 'MISSING_TEST_CASES',
      severity: level === 'production-promotion' ? 'error' : 'warning',
      message: `Decision table "${table.name}" has no regression test cases.`,
      artifactId: table.id,
      suggestedCorrection: 'Register regression fixtures in Test & Sim.',
    });
  }

  return finalizeResult(level, issues);
}

export function validateDecisionTableSpec(table: DecisionTableSpec): ValidationReport {
  const structured = validateDecisionTableArtifact(table, 'draft');
  return {
    valid: structured.isValid,
    errors: structured.errors.map((e) => e.message),
    warnings: structured.warnings.map((w) => w.message),
    structured,
  };
}

export function validateRulesetArtifact(
  ruleset: RulesetSpec,
  collections: ValidationCollections = {},
  level: ValidationLevel = 'draft'
): ArtifactValidationResult {
  const issues: ArtifactValidationIssue[] = [];

  if (!ruleset.name.trim()) {
    issues.push({
      code: 'MISSING_NAME',
      severity: 'error',
      message: 'Ruleset must have a non-empty name.',
      artifactId: ruleset.id,
      field: 'name',
    });
  }

  const enabledMembers = ruleset.members.filter((m) => m.enabled);
  if (enabledMembers.length === 0) {
    issues.push({
      code: 'EMPTY_RULESET',
      severity: 'error',
      message: `Ruleset "${ruleset.name}" must contain at least one enabled rule or table member.`,
      artifactId: ruleset.id,
      suggestedCorrection: 'Add or enable at least one rule or decision table.',
    });
  }

  const seenTargets = new Set<string>();
  const seenPriorities = new Map<number, string>();
  for (const m of enabledMembers) {
    const key = `${m.targetType}:${m.targetId}`;
    if (seenTargets.has(key)) {
      issues.push({
        code: 'DUPLICATE_RULESET_MEMBER',
        severity: 'warning',
        message: `Ruleset member ${key} is listed more than once.`,
        artifactId: ruleset.id,
      });
    }
    seenTargets.add(key);

    if (ruleset.executionOrder !== 'sequential') {
      const conflictId = seenPriorities.get(m.priority);
      if (conflictId) {
        issues.push({
          code: 'RULESET_PRIORITY_COLLISION',
          severity: 'warning',
          message: `Ruleset members share priority P${m.priority}; execution tie-break falls back to array order.`,
          artifactId: ruleset.id,
          suggestedCorrection: 'Assign distinct priority numbers to each member.',
        });
      } else {
        seenPriorities.set(m.priority, m.id);
      }
    }

    if (m.targetType === 'rule' && collections.rules) {
      const target = collections.rules.find((r) => r.id === m.targetId);
      if (!target) {
        issues.push({
          code: 'MISSING_MEMBER_TARGET',
          severity: 'error',
          message: `Ruleset references missing rule "${m.targetId}".`,
          artifactId: ruleset.id,
        });
      } else if (
        (level === 'publication' || level === 'production-promotion') &&
        target.status === 'Draft'
      ) {
        issues.push({
          code: 'UNPUBLISHED_MEMBER',
          severity: 'warning',
          message: `Member rule "${target.name}" is still in Draft status.`,
          artifactId: target.id,
        });
      }
    } else if (m.targetType === 'table' && collections.tables) {
      const target = collections.tables.find((t) => t.id === m.targetId);
      if (!target) {
        issues.push({
          code: 'MISSING_MEMBER_TARGET',
          severity: 'error',
          message: `Ruleset references missing decision table "${m.targetId}".`,
          artifactId: ruleset.id,
        });
      } else if (
        (level === 'publication' || level === 'production-promotion') &&
        target.status === 'Draft'
      ) {
        issues.push({
          code: 'UNPUBLISHED_MEMBER',
          severity: 'warning',
          message: `Member table "${target.name}" is still in Draft status.`,
          artifactId: target.id,
        });
      }
    }
  }

  if (level !== 'draft' && (!ruleset.testCases || ruleset.testCases.length === 0)) {
    issues.push({
      code: 'MISSING_TEST_CASES',
      severity: level === 'production-promotion' ? 'error' : 'warning',
      message: `Ruleset "${ruleset.name}" has no regression test cases.`,
      artifactId: ruleset.id,
    });
  }

  return finalizeResult(level, issues);
}

export function validateRulesetSpec(
  ruleset: RulesetSpec,
  collections: ValidationCollections = {}
): ValidationReport {
  const structured = validateRulesetArtifact(ruleset, collections, 'draft');
  return {
    valid: structured.isValid,
    errors: structured.errors.map((e) => e.message),
    warnings: structured.warnings.map((w) => w.message),
    structured,
  };
}

export function validateRuleChainArtifact(
  chain: RuleChainSpec,
  collections: {
    rules: RuleSpec[];
    tables: DecisionTableSpec[];
    rulesets: RulesetSpec[];
    chains?: RuleChainSpec[];
  },
  visitedChainIds: Set<string> = new Set(),
  level: ValidationLevel = 'draft'
): ArtifactValidationResult {
  const issues: ArtifactValidationIssue[] = [];

  if (!chain.name.trim()) {
    issues.push({
      code: 'MISSING_NAME',
      severity: 'error',
      message: 'Rule chain must have a non-empty name.',
      artifactId: chain.id,
      field: 'name',
    });
  }

  if (visitedChainIds.has(chain.id)) {
    issues.push({
      code: 'CIRCULAR_CHAIN_DETECTED',
      severity: 'error',
      message: `Circular chain detected: chain "${chain.id}" (${chain.name}) references itself transitively.`,
      artifactId: chain.id,
      suggestedCorrection: 'Remove the recursive chain stage reference.',
    });
    return finalizeResult(level, issues);
  }

  const nextVisited = new Set(visitedChainIds);
  nextVisited.add(chain.id);

  if (chain.stages.length === 0) {
    issues.push({
      code: 'EMPTY_CHAIN',
      severity: 'error',
      message: `Rule chain "${chain.name}" has no executable stages.`,
      artifactId: chain.id,
    });
  }

  const seenStageOrder = new Set<number>();
  for (const stage of chain.stages) {
    if (seenStageOrder.has(stage.stepOrder)) {
      issues.push({
        code: 'DUPLICATE_STAGE_ORDER',
        severity: 'warning',
        message: `Duplicate stage stepOrder ${stage.stepOrder} in chain "${chain.name}".`,
        artifactId: chain.id,
      });
    }
    seenStageOrder.add(stage.stepOrder);

    if (stage.targetType === 'chain') {
      if (stage.targetId === chain.id || nextVisited.has(stage.targetId)) {
        issues.push({
          code: 'CIRCULAR_CHAIN_DETECTED',
          severity: 'error',
          message: `Circular chain rejected: stage "${stage.label}" references cyclic chain "${stage.targetId}".`,
          artifactId: chain.id,
        });
      } else {
        const subChain = collections.chains?.find((c) => c.id === stage.targetId);
        if (!subChain) {
          issues.push({
            code: 'MISSING_CHAIN_TARGET',
            severity: 'error',
            message: `Stage "${stage.label}" references missing chain "${stage.targetId}".`,
            artifactId: chain.id,
          });
        } else {
          const subReport = validateRuleChainArtifact(subChain, collections, nextVisited, level);
          issues.push(...subReport.errors, ...subReport.warnings);
        }
      }
    } else if (stage.targetType === 'rule') {
      if (!collections.rules.some((r) => r.id === stage.targetId)) {
        issues.push({
          code: 'MISSING_STAGE_RULE',
          severity: 'error',
          message: `Stage "${stage.label}" references missing rule "${stage.targetId}".`,
          artifactId: chain.id,
        });
      }
    } else if (stage.targetType === 'table') {
      if (!collections.tables.some((t) => t.id === stage.targetId)) {
        issues.push({
          code: 'MISSING_STAGE_TABLE',
          severity: 'error',
          message: `Stage "${stage.label}" references missing table "${stage.targetId}".`,
          artifactId: chain.id,
        });
      }
    } else if (stage.targetType === 'ruleset') {
      if (!collections.rulesets.some((rs) => rs.id === stage.targetId)) {
        issues.push({
          code: 'MISSING_STAGE_RULESET',
          severity: 'error',
          message: `Stage "${stage.label}" references missing ruleset "${stage.targetId}".`,
          artifactId: chain.id,
        });
      }
    }

    if (stage.fallbackTargetId && stage.fallbackTargetId === stage.targetId) {
      issues.push({
        code: 'CIRCULAR_FALLBACK',
        severity: 'error',
        message: `Circular fallback rejected in stage "${stage.label}": fallbackTargetId cannot match targetId "${stage.targetId}".`,
        artifactId: chain.id,
      });
    }
  }

  if (level !== 'draft' && (!chain.testCases || chain.testCases.length === 0)) {
    issues.push({
      code: 'MISSING_TEST_CASES',
      severity: level === 'production-promotion' ? 'error' : 'warning',
      message: `Rule chain "${chain.name}" has no regression test cases.`,
      artifactId: chain.id,
    });
  }

  return finalizeResult(level, issues);
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
  const structured = validateRuleChainArtifact(chain, collections, visitedChainIds, 'draft');
  return {
    valid: structured.isValid,
    errors: structured.errors.map((e) => e.message),
    warnings: structured.warnings.map((w) => w.message),
    structured,
  };
}

function inferCriterionFieldType(fieldType: DecisionFieldType | undefined, value: string): DecisionFieldType {
  if (fieldType) return fieldType;
  const trimmed = value.trim();
  if (trimmed === 'true' || trimmed === 'false') return 'boolean';
  if (trimmed !== '' && !Number.isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) return 'number';
  if (isIsoDateLike(trimmed)) return 'date';
  return 'string';
}

export function validateScorecardArtifact(
  scorecard: ScorecardSpec,
  level: ValidationLevel = 'draft'
): ArtifactValidationResult {
  const issues: ArtifactValidationIssue[] = [];

  if (!scorecard.name.trim()) {
    issues.push({
      code: 'MISSING_NAME',
      severity: 'error',
      message: 'Scorecard must have a non-empty name.',
      artifactId: scorecard.id,
      field: 'name',
    });
  }
  if (typeof scorecard.baseScore !== 'number' || !Number.isFinite(scorecard.baseScore)) {
    issues.push({
      code: 'INVALID_BASE_SCORE',
      severity: 'error',
      message: 'Scorecard baseScore must be a finite number.',
      artifactId: scorecard.id,
      field: 'baseScore',
    });
  }
  if (scorecard.criteria.length === 0) {
    issues.push({
      code: 'EMPTY_CRITERIA',
      severity: 'error',
      message: 'Scorecard requires at least one scoring criterion.',
      artifactId: scorecard.id,
    });
  }
  if (scorecard.thresholds.length === 0) {
    issues.push({
      code: 'EMPTY_THRESHOLDS',
      severity: 'error',
      message: 'Scorecard requires at least one threshold classification band.',
      artifactId: scorecard.id,
    });
  }

  let minAchievable = scorecard.baseScore;
  let maxAchievable = scorecard.baseScore;

  for (const crit of scorecard.criteria) {
    if (!crit.field.trim()) {
      issues.push({
        code: 'MISSING_CRITERION_FIELD',
        severity: 'error',
        message: `Criterion "${crit.label || crit.id}" is missing an input field name.`,
        artifactId: scorecard.id,
      });
    }
    if (typeof crit.weight !== 'number' || !Number.isFinite(crit.weight) || crit.weight <= 0) {
      issues.push({
        code: 'INVALID_CRITERION_WEIGHT',
        severity: 'error',
        message: `Criterion "${crit.label}" must have a finite positive weight (> 0), got ${crit.weight}.`,
        artifactId: scorecard.id,
        field: crit.field,
        suggestedCorrection: 'Set weight to a positive number such as 1 or 0.5.',
      });
    }
    if (!Number.isFinite(crit.pointsIfMatched) || !Number.isFinite(crit.pointsIfMissed)) {
      issues.push({
        code: 'INVALID_CRITERION_POINTS',
        severity: 'error',
        message: `Criterion "${crit.label}" pointsIfMatched and pointsIfMissed must be finite numbers.`,
        artifactId: scorecard.id,
        field: crit.field,
      });
    } else if (Number.isFinite(crit.weight) && crit.weight > 0) {
      const pMatch = crit.pointsIfMatched * crit.weight;
      const pMiss = crit.pointsIfMissed * crit.weight;
      minAchievable += Math.min(pMatch, pMiss);
      maxAchievable += Math.max(pMatch, pMiss);
    }

    const inferredType = inferCriterionFieldType(crit.fieldType, crit.value);
    const opCheck = validateOperatorForFieldType(crit.operator, inferredType);
    if (!opCheck.valid && opCheck.reason) {
      issues.push({
        code: 'INVALID_CRITERION_OPERATOR',
        severity: 'error',
        message: `Criterion "${crit.label}": ${opCheck.reason}`,
        artifactId: scorecard.id,
        field: crit.field,
      });
    }
  }

  // Validate threshold bands: bounds, overlaps, and gaps
  for (const band of scorecard.thresholds) {
    if (!Number.isFinite(band.minScore) || !Number.isFinite(band.maxScore)) {
      issues.push({
        code: 'INVALID_THRESHOLD_BOUNDS',
        severity: 'error',
        message: `Threshold band "${band.classification}" has non-finite score bounds.`,
        artifactId: scorecard.id,
      });
      continue;
    }
    if (band.minScore > band.maxScore) {
      issues.push({
        code: 'INVERTED_THRESHOLD_BOUNDS',
        severity: 'error',
        message: `Threshold band "${band.classification}" has inverted bounds (${band.minScore} > ${band.maxScore}).`,
        artifactId: scorecard.id,
        suggestedCorrection: 'Ensure minScore <= maxScore for every threshold band.',
      });
    }
    if (!band.classification.trim() || !band.decisionOutcome.trim()) {
      issues.push({
        code: 'INCOMPLETE_THRESHOLD_LABEL',
        severity: 'error',
        message: `Threshold band [${band.minScore}, ${band.maxScore}] requires both classification and decisionOutcome.`,
        artifactId: scorecard.id,
      });
    }
  }

  const validBands = scorecard.thresholds
    .filter((b) => Number.isFinite(b.minScore) && Number.isFinite(b.maxScore) && b.minScore <= b.maxScore)
    .sort((a, b) => a.minScore - b.minScore);

  for (let i = 0; i < validBands.length - 1; i++) {
    const curr = validBands[i];
    const next = validBands[i + 1];
    if (next.minScore <= curr.maxScore) {
      issues.push({
        code: 'OVERLAPPING_THRESHOLD_BANDS',
        severity: 'error',
        message: `Threshold overlap between "${curr.classification}" [${curr.minScore}..${curr.maxScore}] and "${next.classification}" [${next.minScore}..${next.maxScore}].`,
        artifactId: scorecard.id,
        suggestedCorrection: 'Make threshold score ranges non-overlapping.',
      });
    } else {
      const gap = next.minScore - curr.maxScore;
      if (gap > 1) {
        issues.push({
          code: 'THRESHOLD_GAP_DETECTED',
          severity: 'error',
          message: `Threshold gap detected between "${curr.classification}" (max ${curr.maxScore}) and "${next.classification}" (min ${next.minScore}). Scores in (${curr.maxScore}, ${next.minScore}) have no classification band.`,
          artifactId: scorecard.id,
          suggestedCorrection: `Close the score gap between ${curr.maxScore} and ${next.minScore}.`,
        });
      } else if (gap > 0) {
        issues.push({
          code: 'FRACTIONAL_THRESHOLD_GAP_WARNING',
          severity: 'warning',
          message: `Fractional gap between ${curr.maxScore} ("${curr.classification}") and ${next.minScore} ("${next.classification}") if decimal weights produce non-integer totals.`,
          artifactId: scorecard.id,
          suggestedCorrection: 'Ensure weighted scores stay integer or widen band bounds if fractional weights are used.',
        });
      }
    }
  }

  if (validBands.length > 0 && Number.isFinite(minAchievable) && Number.isFinite(maxAchievable)) {
    const minBand = validBands[0].minScore;
    const maxBand = validBands[validBands.length - 1].maxScore;
    if (minAchievable < minBand || maxAchievable > maxBand) {
      issues.push({
        code: 'ACHIEVABLE_SCORE_OUTSIDE_BANDS',
        severity: 'warning',
        message: `Achievable score range [${Math.round(minAchievable * 100) / 100}..${Math.round(maxAchievable * 100) / 100}] extends outside configured bands [${minBand}..${maxBand}].`,
        artifactId: scorecard.id,
        suggestedCorrection: 'Widen outer threshold bands so every achievable score classifies deterministically.',
      });
    }
  }

  if (level !== 'draft' && (!scorecard.testCases || scorecard.testCases.length === 0)) {
    issues.push({
      code: 'MISSING_TEST_CASES',
      severity: level === 'production-promotion' ? 'error' : 'warning',
      message: `Scorecard "${scorecard.name}" has no regression test cases.`,
      artifactId: scorecard.id,
    });
  }

  return finalizeResult(level, issues);
}

export function validateScorecardSpec(scorecard: ScorecardSpec): ValidationReport {
  const structured = validateScorecardArtifact(scorecard, 'draft');
  return {
    valid: structured.isValid,
    errors: structured.errors.map((e) => e.message),
    warnings: structured.warnings.map((w) => w.message),
    structured,
  };
}

/**
 * Unified 4-level validation entry point for all 5 SOPIN Decisions artifact types.
 */
export function validateArtifact(
  type: DecisionArtifactType,
  spec: RuleSpec | DecisionTableSpec | RulesetSpec | RuleChainSpec | ScorecardSpec,
  level: ValidationLevel = 'draft',
  collections: ValidationCollections = {}
): ArtifactValidationResult {
  if (type === 'rule') return validateRuleArtifact(spec as RuleSpec, level);
  if (type === 'table') return validateDecisionTableArtifact(spec as DecisionTableSpec, level);
  if (type === 'ruleset') return validateRulesetArtifact(spec as RulesetSpec, collections, level);
  if (type === 'chain') {
    return validateRuleChainArtifact(
      spec as RuleChainSpec,
      {
        rules: collections.rules ?? [],
        tables: collections.tables ?? [],
        rulesets: collections.rulesets ?? [],
        chains: collections.chains ?? [],
      },
      new Set(),
      level
    );
  }
  return validateScorecardArtifact(spec as ScorecardSpec, level);
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
  const rulesets = safeArray<RulesetSpec>(raw.rulesets, 'rulesets', fallback.rulesets)
    .filter((rs) => typeof rs.name === 'string' && Array.isArray(rs.members))
    .map((rs) => ({
      ...rs,
      testCases: Array.isArray(rs.testCases) ? rs.testCases : [],
      versionHistory: Array.isArray(rs.versionHistory) ? rs.versionHistory : [],
    }));
  const chains = safeArray<RuleChainSpec>(raw.chains, 'chains', fallback.chains)
    .filter((c) => typeof c.name === 'string' && Array.isArray(c.stages))
    .map((c) => ({
      ...c,
      testCases: Array.isArray(c.testCases) ? c.testCases : [],
      versionHistory: Array.isArray(c.versionHistory) ? c.versionHistory : [],
    }));
  const scorecards = safeArray<ScorecardSpec>(raw.scorecards, 'scorecards', fallback.scorecards)
    .filter((sc) => typeof sc.name === 'string' && Array.isArray(sc.criteria))
    .map((sc) => ({
      ...sc,
      testCases: Array.isArray(sc.testCases) ? sc.testCases : [],
      versionHistory: Array.isArray(sc.versionHistory) ? sc.versionHistory : [],
    }));
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
