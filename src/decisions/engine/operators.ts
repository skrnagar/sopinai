import { ConditionOperator, DecisionFieldType } from '../types';

/**
 * Resolves either an exact top-level property or a dot-separated nested path
 * safely (blocking prototype pollution keys).
 */
export function resolveInputField(
  input: Record<string, unknown> | undefined | null,
  fieldPath: string
): { exists: boolean; value: unknown } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { exists: false, value: undefined };
  }
  if (fieldPath === '__proto__' || fieldPath === 'constructor' || fieldPath === 'prototype') {
    return { exists: false, value: undefined };
  }
  if (Object.prototype.hasOwnProperty.call(input, fieldPath)) {
    return { exists: true, value: input[fieldPath] };
  }
  if (!fieldPath.includes('.')) {
    return { exists: false, value: undefined };
  }
  const parts = fieldPath.split('.');
  let current: unknown = input;
  for (const part of parts) {
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      return { exists: false, value: undefined };
    }
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return { exists: false, value: undefined };
    }
    current = (current as Record<string, unknown>)[part];
  }
  return { exists: true, value: current };
}

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date);
}

export function isIsoDateLike(val: unknown): boolean {
  if (val instanceof Date) return !Number.isNaN(val.getTime());
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(
      trimmed
    )
  ) {
    return false;
  }
  return !Number.isNaN(Date.parse(trimmed));
}

export function toDateTimestamp(val: unknown): number | null {
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val.getTime();
  }
  if (typeof val === 'string' && isIsoDateLike(val)) {
    const ms = Date.parse(val.trim());
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

export function coerceScalar(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) {
    return Number(trimmed);
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Parses an expected literal while respecting declared schema/column type to avoid
 * accidental cross-type coercion (e.g. string "0012" becoming number 12).
 */
export function parseTypedExpectedValue(raw: string, expectedType?: DecisionFieldType): unknown {
  const trimmed = raw.trim();
  if (!expectedType) return coerceScalar(raw);
  if (trimmed === 'null') return null;
  if (expectedType === 'string') {
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }
  if (expectedType === 'number') {
    if (trimmed === '' || Number.isNaN(Number(trimmed)) || !Number.isFinite(Number(trimmed))) {
      return NaN;
    }
    return Number(trimmed);
  }
  if (expectedType === 'boolean') {
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    return trimmed;
  }
  if (expectedType === 'date') {
    return trimmed;
  }
  if (expectedType === 'null') {
    return trimmed === 'null' || trimmed === '' ? null : trimmed;
  }
  return coerceScalar(raw);
}

const FORBIDDEN_EXPR_PATTERN =
  /(?:__proto__|constructor|prototype|\beval\b|\bFunction\b|\bwindow\b|\bglobalThis\b|\bprocess\b|\brequire\b|\bimport\b|;|`|\$\{)/i;

export function assertSafeExpression(expr: string): { safe: boolean; reason?: string } {
  const trimmed = expr.trim();
  if (!trimmed) return { safe: true };
  if (FORBIDDEN_EXPR_PATTERN.test(trimmed)) {
    return {
      safe: false,
      reason: `Unsafe or disallowed token detected in expression "${trimmed}".`,
    };
  }
  return { safe: true };
}

export function validateRestrictedExpressionSyntax(
  expr: string,
  allowedFieldPaths?: Set<string>
): { valid: boolean; reason?: string } {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Expression cannot be empty.' };
  }
  const safeCheck = assertSafeExpression(trimmed);
  if (!safeCheck.safe) {
    return { valid: false, reason: safeCheck.reason };
  }

  let depth = 0;
  let inQuote: '"' | "'" | null = null;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth < 0) {
        return { valid: false, reason: `Unbalanced closing parenthesis in expression "${trimmed}".` };
      }
    }
  }
  if (inQuote) {
    return { valid: false, reason: `Unterminated string literal in expression "${trimmed}".` };
  }
  if (depth !== 0) {
    return { valid: false, reason: `Unclosed parenthesis in expression "${trimmed}".` };
  }

  // Reject trailing or leading binary arithmetic operators
  if (/^[+\-*/%]|[+\-*/%]$/.test(trimmed) && !/^-\d+(\.\d+)?$/.test(trimmed)) {
    return { valid: false, reason: `Malformed operator placement in expression "${trimmed}".` };
  }

  // Reject consecutive arithmetic operators like "a + * b" or "a / 0"
  if (/[+\-*/]\s*[+*/]/.test(trimmed)) {
    return { valid: false, reason: `Consecutive binary operators in expression "${trimmed}".` };
  }
  if (/\/\s*0(?:\.0+)?(?:\s|$|\))/.test(trimmed)) {
    return { valid: false, reason: `Explicit division by zero detected in expression "${trimmed}".` };
  }

  // Check allowed characters (identifiers, numbers, string literals, parens, arithmetic & comparison ops)
  const strippedStrings = trimmed.replace(/"[^"]*"|'[^']*'/g, ' "" ');
  if (/[^a-zA-Z0-9_.\s+\-*/%()=!<>&|]/.test(strippedStrings)) {
    return {
      valid: false,
      reason: `Unsupported syntax or operator in restricted expression "${trimmed}".`,
    };
  }

  if (allowedFieldPaths && allowedFieldPaths.size > 0) {
    const tokens = strippedStrings.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g) ?? [];
    for (const tok of tokens) {
      if (tok === 'true' || tok === 'false' || tok === 'null') continue;
      if (!allowedFieldPaths.has(tok)) {
        const rootField = tok.split('.')[0];
        if (!allowedFieldPaths.has(rootField)) {
          return {
            valid: false,
            reason: `Expression references undeclared input field "${tok}".`,
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Restricted safe expression evaluator for deterministic outputs and formula predicates.
 * Supports field paths, numbers, strings, booleans, null, arithmetic (+ - * /),
 * and simple comparisons without Function() or eval().
 */
export function evaluateRestrictedExpression(
  expr: string,
  context: Record<string, unknown>
): unknown {
  const trimmed = expr.trim();
  if (!trimmed) return '';

  const syntax = validateRestrictedExpressionSyntax(trimmed);
  if (!syntax.valid) {
    throw new Error(syntax.reason);
  }

  // Strip outer matching parentheses if whole expression is parenthesized
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    let depth = 0;
    let wrapsAll = true;
    for (let i = 0; i < trimmed.length - 1; i++) {
      if (trimmed[i] === '(') depth++;
      else if (trimmed[i] === ')') depth--;
      if (depth === 0) {
        wrapsAll = false;
        break;
      }
    }
    if (wrapsAll) {
      return evaluateRestrictedExpression(trimmed.slice(1, -1), context);
    }
  }

  const fieldLookup = resolveInputField(context, trimmed);
  if (fieldLookup.exists) {
    return fieldLookup.value;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) {
    return Number(trimmed);
  }

  // Boolean comparison inside expression, e.g. "amount < 50000" or "vendor.tier == 'gold'"
  const compMatch = trimmed.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const [, lhsExpr, operator, rhsExpr] = compMatch;
    const lhsVal = evaluateRestrictedExpression(lhsExpr, context);
    const rhsTrimmed = rhsExpr.trim();
    const rhsResolved = resolveInputField(context, rhsTrimmed);
    if (rhsResolved.exists) {
      return compareValues(lhsVal, operator as ConditionOperator, JSON.stringify(rhsResolved.value), undefined, context, lhsVal !== undefined);
    }
    return compareValues(lhsVal, operator as ConditionOperator, rhsTrimmed, undefined, context, lhsVal !== undefined);
  }

  // Safe arithmetic binary ops respecting precedence (+ - lower than * /)
  for (const opPair of [
    ['+', '-'],
    ['*', '/'],
  ] as const) {
    let depth = 0;
    let inQuote: '"' | "'" | null = null;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const ch = trimmed[i];
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inQuote = ch;
        continue;
      }
      if (ch === ')') depth++;
      else if (ch === '(') depth--;
      if (depth !== 0) continue;
      if ((ch === opPair[0] || ch === opPair[1]) && i > 0) {
        // Unary minus check: skip '-' at index 0 or after another operator
        if (ch === '-' && /^[+\-*/(]$/.test(trimmed.slice(0, i).trim().slice(-1))) {
          continue;
        }
        const leftRaw = evaluateRestrictedExpression(trimmed.slice(0, i).trim(), context);
        const rightRaw = evaluateRestrictedExpression(trimmed.slice(i + 1).trim(), context);
        if (typeof leftRaw !== 'number' || typeof rightRaw !== 'number') {
          throw new Error(
            `Arithmetic operator "${ch}" requires numeric operands, received ${typeof leftRaw} and ${typeof rightRaw}.`
          );
        }
        if (!Number.isFinite(leftRaw) || !Number.isFinite(rightRaw)) {
          throw new Error(`Non-finite operand in arithmetic expression "${trimmed}".`);
        }
        if (ch === '+') return Number((leftRaw + rightRaw).toFixed(4));
        if (ch === '-') return Number((leftRaw - rightRaw).toFixed(4));
        if (ch === '*') return Number((leftRaw * rightRaw).toFixed(4));
        if (ch === '/') {
          if (rightRaw === 0) {
            throw new Error(`Division by zero in deterministic expression "${trimmed}".`);
          }
          return Number((leftRaw / rightRaw).toFixed(4));
        }
      }
    }
  }

  throw new Error(`Unresolved identifier or invalid expression "${trimmed}".`);
}

function parseListLiteral(raw: string, expectedType?: DecisionFieldType): unknown[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to comma split for unquoted tokens like "[IN, SG, AE]"
    }
  }
  return trimmed
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => parseTypedExpectedValue(s.trim(), expectedType))
    .filter((v) => v !== '');
}

function isEmptyValue(actual: unknown): boolean {
  if (actual === undefined || actual === null || actual === '') return true;
  if (typeof actual === 'string' && actual.trim() === '') return true;
  if (Array.isArray(actual)) return actual.length === 0;
  if (isPlainObject(actual)) return Object.keys(actual).length === 0;
  return false;
}

export const SUPPORTED_OPERATORS_BY_TYPE: Record<DecisionFieldType, ConditionOperator[]> = {
  number: ['==', '!=', '>', '>=', '<', '<=', 'between', 'in', 'not_in', 'exists', 'not_exists', 'is_empty', 'is_not_empty', 'matches_formula'],
  string: ['==', '!=', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists', 'matches_formula'],
  boolean: ['==', '!=', 'exists', 'not_exists', 'is_empty', 'is_not_empty', 'matches_formula'],
  date: ['==', '!=', '>', '>=', '<', '<=', 'between', 'exists', 'not_exists', 'is_empty', 'is_not_empty', 'matches_formula'],
  null: ['==', '!=', 'is_empty', 'is_not_empty', 'exists', 'not_exists'],
  array: ['==', '!=', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty', 'exists', 'not_exists', 'matches_formula'],
  object: ['==', '!=', 'contains', 'not_contains', 'is_empty', 'is_not_empty', 'exists', 'not_exists', 'matches_formula'],
};

export function validateOperatorForFieldType(
  operator: ConditionOperator,
  fieldType: DecisionFieldType
): { valid: boolean; reason?: string } {
  const allowed = SUPPORTED_OPERATORS_BY_TYPE[fieldType];
  if (!allowed || !allowed.includes(operator)) {
    return {
      valid: false,
      reason: `Operator "${operator}" is not supported for field type "${fieldType}".`,
    };
  }
  return { valid: true };
}

export interface CompareOptions {
  fieldType?: DecisionFieldType;
  caseSensitive?: boolean;
}

/**
 * Deterministic comparison with strict type safety (no cross-type coercion),
 * explicit null/undefined/missing handling, and explicit string case sensitivity.
 */
export function compareValues(
  actual: unknown,
  operator: ConditionOperator,
  expectedRaw: string,
  expectedEndRaw?: string,
  context?: Record<string, unknown>,
  fieldExists?: boolean,
  options?: CompareOptions
): boolean {
  const existsFlag = fieldExists !== undefined ? fieldExists : actual !== undefined;
  const caseSensitive = options?.caseSensitive;

  if (operator === 'exists') {
    return existsFlag && actual !== undefined;
  }
  if (operator === 'not_exists') {
    return !existsFlag || actual === undefined;
  }

  if (operator === 'is_empty') {
    return isEmptyValue(actual);
  }
  if (operator === 'is_not_empty') {
    return !isEmptyValue(actual);
  }

  if (operator === 'matches_formula') {
    const res = evaluateRestrictedExpression(expectedRaw, context ?? {});
    return typeof res === 'boolean' ? res : false;
  }

  // Missing or undefined fields never satisfy value comparisons
  if (!existsFlag || actual === undefined) {
    return false;
  }

  const expected = parseTypedExpectedValue(expectedRaw, options?.fieldType);

  if (operator === '==' || operator === '!=') {
    let equals = false;

    if (actual === null || expected === null) {
      equals = actual === expected;
    } else if (typeof actual === 'boolean' || typeof expected === 'boolean') {
      equals = typeof actual === 'boolean' && typeof expected === 'boolean' && actual === expected;
    } else if (
      toDateTimestamp(actual) !== null &&
      toDateTimestamp(expected) !== null
    ) {
      equals = toDateTimestamp(actual) === toDateTimestamp(expected);
    } else if (typeof actual === 'number' || typeof expected === 'number') {
      equals =
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        Number.isFinite(actual) &&
        Number.isFinite(expected) &&
        actual === expected;
    } else if (typeof actual === 'string' && typeof expected === 'string') {
      // Exact equality is case-sensitive unless caseSensitive === false is explicitly set
      equals = caseSensitive === false
        ? actual.toLowerCase() === expected.toLowerCase()
        : actual === expected;
    } else if (Array.isArray(actual) || isPlainObject(actual) || Array.isArray(expected) || isPlainObject(expected)) {
      equals = JSON.stringify(actual) === JSON.stringify(expected);
    }

    return operator === '==' ? equals : !equals;
  }

  if (operator === '>' || operator === '>=' || operator === '<' || operator === '<=') {
    if (actual === null || actual === '') return false;

    const tsA = toDateTimestamp(actual);
    const tsE = toDateTimestamp(expected);
    if (tsA !== null && tsE !== null) {
      if (operator === '>') return tsA > tsE;
      if (operator === '>=') return tsA >= tsE;
      if (operator === '<') return tsA < tsE;
      return tsA <= tsE;
    }

    if (typeof actual !== 'number' || typeof expected !== 'number') {
      return false;
    }
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
      return false;
    }
    if (operator === '>') return actual > expected;
    if (operator === '>=') return actual >= expected;
    if (operator === '<') return actual < expected;
    return actual <= expected;
  }

  if (operator === 'between') {
    if (actual === null || actual === '') return false;

    const tsA = toDateTimestamp(actual);
    const tsLow = toDateTimestamp(expected);
    const tsHigh = toDateTimestamp(parseTypedExpectedValue(expectedEndRaw ?? expectedRaw, options?.fieldType));
    if (tsA !== null && tsLow !== null && tsHigh !== null) {
      const min = Math.min(tsLow, tsHigh);
      const max = Math.max(tsLow, tsHigh);
      return tsA >= min && tsA <= max;
    }

    const high = parseTypedExpectedValue(expectedEndRaw ?? expectedRaw, options?.fieldType);
    if (
      typeof actual !== 'number' ||
      typeof expected !== 'number' ||
      typeof high !== 'number' ||
      !Number.isFinite(actual) ||
      !Number.isFinite(expected) ||
      !Number.isFinite(high)
    ) {
      return false;
    }
    const min = Math.min(expected, high);
    const max = Math.max(expected, high);
    return actual >= min && actual <= max;
  }

  if (operator === 'contains' || operator === 'not_contains') {
    if (actual === null) return operator === 'not_contains';
    let contains = false;
    const norm = (v: unknown) =>
      caseSensitive === true ? String(v ?? '') : String(v ?? '').toLowerCase();

    if (Array.isArray(actual)) {
      contains = actual.some((v) =>
        typeof v === typeof expected && (typeof v === 'number' || typeof v === 'boolean')
          ? v === expected
          : norm(v) === norm(expected)
      );
    } else if (isPlainObject(actual)) {
      const targetKey = String(expected ?? '');
      contains =
        Object.prototype.hasOwnProperty.call(actual, targetKey) ||
        norm(JSON.stringify(actual)).includes(norm(targetKey));
    } else if (typeof actual === 'string') {
      contains = norm(actual).includes(norm(expected));
    } else {
      return false;
    }
    return operator === 'contains' ? contains : !contains;
  }

  if (operator === 'starts_with') {
    if (typeof actual !== 'string') return false;
    const expStr = String(expected ?? '');
    return caseSensitive === true
      ? actual.startsWith(expStr)
      : actual.toLowerCase().startsWith(expStr.toLowerCase());
  }

  if (operator === 'ends_with') {
    if (typeof actual !== 'string') return false;
    const expStr = String(expected ?? '');
    return caseSensitive === true
      ? actual.endsWith(expStr)
      : actual.toLowerCase().endsWith(expStr.toLowerCase());
  }

  if (operator === 'in' || operator === 'not_in') {
    if (actual === null) return false;
    const list = parseListLiteral(expectedRaw, options?.fieldType);
    const matchItem = (candidate: unknown, item: unknown): boolean => {
      if (typeof candidate === 'number' && typeof item === 'number') {
        return candidate === item;
      }
      if (typeof candidate === 'string' && typeof item === 'string') {
        return caseSensitive === true
          ? candidate.trim() === item.trim()
          : candidate.trim().toLowerCase() === item.trim().toLowerCase();
      }
      return false;
    };

    let matched = false;
    if (Array.isArray(actual)) {
      matched = actual.some((el) => list.some((item) => matchItem(el, item)));
    } else {
      matched = list.some((item) => matchItem(actual, item));
    }
    return operator === 'in' ? matched : !matched;
  }

  return false;
}

export function validateTableCellSyntax(
  cellSpec: string,
  columnType: DecisionFieldType
): { valid: boolean; reason?: string } {
  const spec = cellSpec.trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'any') {
    return { valid: true };
  }
  if (spec.includes('&&')) {
    const parts = spec.split('&&').map((p) => p.trim());
    if (parts.some((p) => p === '')) {
      return { valid: false, reason: `Malformed '&&' compound cell expression "${cellSpec}".` };
    }
    for (const part of parts) {
      const check = validateTableCellSyntax(part, columnType);
      if (!check.valid) return check;
    }
    return { valid: true };
  }
  if (spec.includes('||')) {
    const parts = spec.split('||').map((p) => p.trim());
    if (parts.some((p) => p === '')) {
      return { valid: false, reason: `Malformed '||' compound cell expression "${cellSpec}".` };
    }
    for (const part of parts) {
      const check = validateTableCellSyntax(part, columnType);
      if (!check.valid) return check;
    }
    return { valid: true };
  }

  const safeCheck = assertSafeExpression(spec);
  if (!safeCheck.safe) {
    return { valid: false, reason: safeCheck.reason };
  }

  const unaryNorm = spec.toLowerCase();
  if (unaryNorm === 'is_empty' || unaryNorm === 'is_not_empty' || unaryNorm === 'exists' || unaryNorm === 'not_exists') {
    return { valid: true };
  }

  const betweenMatch = spec.match(/^between\s+(.+?)\s*(?:\.\.|,|and)\s*(.+)$/i);
  if (betweenMatch) {
    const opCheck = validateOperatorForFieldType('between', columnType);
    if (!opCheck.valid) return opCheck;
    const low = parseTypedExpectedValue(betweenMatch[1], columnType);
    const high = parseTypedExpectedValue(betweenMatch[2], columnType);
    if (columnType === 'number' && (typeof low !== 'number' || typeof high !== 'number' || Number.isNaN(low) || Number.isNaN(high))) {
      return { valid: false, reason: `Invalid numeric range "${cellSpec}".` };
    }
    if (columnType === 'date' && (!isIsoDateLike(low) || !isIsoDateLike(high))) {
      return { valid: false, reason: `Invalid ISO date range "${cellSpec}".` };
    }
    return { valid: true };
  }

  const inMatch = spec.match(/^(not_in|in)\s*(\[.*\])$/i);
  if (inMatch) {
    const op = inMatch[1].toLowerCase() as ConditionOperator;
    const opCheck = validateOperatorForFieldType(op, columnType);
    if (!opCheck.valid) return opCheck;
    const items = parseListLiteral(inMatch[2], columnType);
    if (items.length === 0) {
      return { valid: false, reason: `Empty list in cell expression "${cellSpec}".` };
    }
    if (columnType === 'number' && items.some((x) => typeof x !== 'number' || Number.isNaN(x))) {
      return { valid: false, reason: `Non-numeric list item in numeric column cell "${cellSpec}".` };
    }
    return { valid: true };
  }

  const opMatch = spec.match(
    /^(>=|<=|!=|==|>|<|not_contains|contains|starts_with|ends_with)\s+(.+)$/i
  );
  if (opMatch) {
    const op = opMatch[1].toLowerCase() as ConditionOperator;
    const rhsRaw = opMatch[2].trim();
    const opCheck = validateOperatorForFieldType(op, columnType);
    if (!opCheck.valid) return opCheck;
    if (columnType === 'number') {
      const n = Number(rhsRaw);
      if (rhsRaw === '' || Number.isNaN(n) || !Number.isFinite(n)) {
        return { valid: false, reason: `Cell "${cellSpec}" requires a finite number operand.` };
      }
    } else if (columnType === 'boolean') {
      if (rhsRaw !== 'true' && rhsRaw !== 'false') {
        return { valid: false, reason: `Boolean column cell "${cellSpec}" must compare against true or false.` };
      }
    } else if (columnType === 'date' && !isIsoDateLike(rhsRaw)) {
      return { valid: false, reason: `Date column cell "${cellSpec}" requires a valid ISO date.` };
    }
    return { valid: true };
  }

  // Bare operator without operand e.g. "<" or ">=" or "in ["
  if (/^(>=|<=|!=|==|>|<|between|in|not_in|contains|not_contains|starts_with|ends_with)\b/i.test(spec)) {
    return { valid: false, reason: `Incomplete table cell expression "${cellSpec}".` };
  }

  // Bare literal
  if (columnType === 'number') {
    const n = Number(spec);
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      return { valid: false, reason: `Numeric column cell "${cellSpec}" must be a valid number or operator expression.` };
    }
  } else if (columnType === 'boolean') {
    if (spec !== 'true' && spec !== 'false') {
      return { valid: false, reason: `Boolean column cell "${cellSpec}" must be true, false, or *.` };
    }
  } else if (columnType === 'date' && !isIsoDateLike(spec)) {
    return { valid: false, reason: `Date column cell "${cellSpec}" requires a valid ISO date.` };
  }

  return { valid: true };
}

interface NumericInterval {
  min: number;
  minInc: boolean;
  max: number;
  maxInc: boolean;
}

function cellToInterval(cellSpec: string, columnType: DecisionFieldType): NumericInterval | null {
  const spec = cellSpec.trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'any') {
    return { min: -Infinity, minInc: true, max: Infinity, maxInc: true };
  }
  const toVal = (raw: string): number | null => {
    if (columnType === 'date') return toDateTimestamp(raw);
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  if (spec.includes('&&')) {
    let min = -Infinity;
    let minInc = true;
    let max = Infinity;
    let maxInc = true;
    for (const part of spec.split('&&')) {
      const sub = cellToInterval(part.trim(), columnType);
      if (!sub) return null;
      if (sub.min > min) {
        min = sub.min;
        minInc = sub.minInc;
      } else if (sub.min === min) {
        minInc = minInc && sub.minInc;
      }
      if (sub.max < max) {
        max = sub.max;
        maxInc = sub.maxInc;
      } else if (sub.max === max) {
        maxInc = maxInc && sub.maxInc;
      }
    }
    return { min, minInc, max, maxInc };
  }

  const betweenMatch = spec.match(/^between\s+(.+?)\s*(?:\.\.|,|and)\s*(.+)$/i);
  if (betweenMatch) {
    const a = toVal(betweenMatch[1].trim());
    const b = toVal(betweenMatch[2].trim());
    if (a === null || b === null) return null;
    return { min: Math.min(a, b), minInc: true, max: Math.max(a, b), maxInc: true };
  }

  const m = spec.match(/^(>=|<=|==|>|<)\s*(.+)$/);
  if (m) {
    const val = toVal(m[2].trim());
    if (val === null) return null;
    if (m[1] === '>') return { min: val, minInc: false, max: Infinity, maxInc: true };
    if (m[1] === '>=') return { min: val, minInc: true, max: Infinity, maxInc: true };
    if (m[1] === '<') return { min: -Infinity, minInc: true, max: val, maxInc: false };
    if (m[1] === '<=') return { min: -Infinity, minInc: true, max: val, maxInc: true };
    return { min: val, minInc: true, max: val, maxInc: true };
  }

  const exact = toVal(spec);
  if (exact !== null) {
    return { min: exact, minInc: true, max: exact, maxInc: true };
  }
  return null;
}

function intervalsOverlap(a: NumericInterval, b: NumericInterval): boolean {
  if (a.max < b.min || b.max < a.min) return false;
  if (a.max === b.min) return a.maxInc && b.minInc;
  if (b.max === a.min) return b.maxInc && a.minInc;
  return true;
}

function cellToDiscreteValues(cellSpec: string): Set<string> | 'wildcard' | null {
  const spec = cellSpec.trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'any') return 'wildcard';
  const inMatch = spec.match(/^in\s*(\[.*\])$/i);
  if (inMatch) {
    return new Set(parseListLiteral(inMatch[1]).map((v) => String(v).toLowerCase()));
  }
  const eqMatch = spec.match(/^==\s*(.+)$/);
  if (eqMatch) {
    return new Set([String(coerceScalar(eqMatch[1])).toLowerCase()]);
  }
  if (!/^(>=|<=|!=|>|<|not_in|not_contains|contains|starts_with|ends_with|is_|exists|not_exists)/i.test(spec)) {
    return new Set([String(coerceScalar(spec)).toLowerCase()]);
  }
  return null;
}

/**
 * Checks whether two table cell predicates in the same column can simultaneously match
 * at least one runtime input value (used to detect overlapping rows).
 */
export function doTableCellsOverlap(
  cellA: string,
  cellB: string,
  columnType: DecisionFieldType
): boolean {
  const normA = (cellA || '*').trim();
  const normB = (cellB || '*').trim();
  if (normA === '*' || normA.toLowerCase() === 'any' || normB === '*' || normB.toLowerCase() === 'any') {
    return true;
  }
  if (normA === normB) return true;

  if (columnType === 'number' || columnType === 'date') {
    const intA = cellToInterval(normA, columnType);
    const intB = cellToInterval(normB, columnType);
    if (intA && intB) {
      return intervalsOverlap(intA, intB);
    }
  }

  const setA = cellToDiscreteValues(normA);
  const setB = cellToDiscreteValues(normB);
  if (setA === 'wildcard' || setB === 'wildcard') return true;
  if (setA && setB) {
    for (const val of setA) {
      if (setB.has(val)) return true;
    }
    return false;
  }

  // Handle simple `!= X` vs `== Y`
  const neqA = normA.match(/^!=\s*(.+)$/);
  const neqB = normB.match(/^!=\s*(.+)$/);
  if (neqA && setB) {
    const excluded = String(coerceScalar(neqA[1])).toLowerCase();
    return Array.from(setB).some((v) => v !== excluded);
  }
  if (neqB && setA) {
    const excluded = String(coerceScalar(neqB[1])).toLowerCase();
    return Array.from(setA).some((v) => v !== excluded);
  }

  return true;
}

/**
 * Parses spreadsheet cell expressions such as:
 * `*` (wildcard), `< 50000`, `>= 50000 && <= 250000`, `between 100..500`, `in [US, SG, IN]`,
 * `starts_with ACME`, `ends_with .com`, `is_empty`, `is_not_empty`, `exists`, `not_exists`, or scalar.
 */
export function evaluateTableCell(
  cellSpec: string,
  actualValue: unknown,
  fieldExists?: boolean,
  columnType?: DecisionFieldType
): boolean {
  const spec = cellSpec.trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'any') return true;

  if (spec.includes('&&')) {
    return spec
      .split('&&')
      .every((part) => evaluateTableCell(part.trim(), actualValue, fieldExists, columnType));
  }

  if (spec.includes('||')) {
    return spec
      .split('||')
      .some((part) => evaluateTableCell(part.trim(), actualValue, fieldExists, columnType));
  }

  const unaryNorm = spec.toLowerCase();
  if (unaryNorm === 'is_empty' || unaryNorm === 'is_not_empty' || unaryNorm === 'exists' || unaryNorm === 'not_exists') {
    return compareValues(actualValue, unaryNorm as ConditionOperator, '', undefined, undefined, fieldExists, {
      fieldType: columnType,
    });
  }

  const betweenMatch = spec.match(/^between\s+(.+?)\s*(?:\.\.|,|and)\s*(.+)$/i);
  if (betweenMatch) {
    return compareValues(
      actualValue,
      'between',
      betweenMatch[1].trim(),
      betweenMatch[2].trim(),
      undefined,
      fieldExists,
      { fieldType: columnType }
    );
  }

  const inMatch = spec.match(/^(not_in|in)\s*(\[.*\])$/i);
  if (inMatch) {
    return compareValues(
      actualValue,
      inMatch[1].toLowerCase() as ConditionOperator,
      inMatch[2],
      undefined,
      undefined,
      fieldExists,
      { fieldType: columnType }
    );
  }

  const opMatch = spec.match(
    /^(>=|<=|!=|==|>|<|not_contains|contains|starts_with|ends_with)\s+(.+)$/i
  );
  if (opMatch) {
    return compareValues(
      actualValue,
      opMatch[1].toLowerCase() as ConditionOperator,
      opMatch[2],
      undefined,
      undefined,
      fieldExists,
      { fieldType: columnType }
    );
  }

  return compareValues(actualValue, '==', spec, undefined, undefined, fieldExists, {
    fieldType: columnType,
  });
}
