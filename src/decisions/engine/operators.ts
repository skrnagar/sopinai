import { ConditionOperator } from '../types';

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
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed)) {
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

  const check = assertSafeExpression(trimmed);
  if (!check.safe) {
    throw new Error(check.reason);
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
  const compMatch = trimmed.match(/^([a-zA-Z0-9_.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const [, fieldName, operator, rhsRaw] = compMatch;
    const lhs = resolveInputField(context, fieldName).value;
    return compareValues(lhs, operator as ConditionOperator, rhsRaw.trim(), undefined, context);
  }

  // Safe arithmetic binary ops respecting precedence (+ - lower than * /)
  for (const opPair of [
    ['+', '-'],
    ['*', '/'],
  ] as const) {
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const ch = trimmed[i];
      if (ch === ')') depth++;
      else if (ch === '(') depth--;
      if (depth !== 0) continue;
      if ((ch === opPair[0] || ch === opPair[1]) && trimmed[i - 1] === ' ' && trimmed[i + 1] === ' ') {
        const leftRaw = evaluateRestrictedExpression(trimmed.slice(0, i - 1), context);
        const rightRaw = evaluateRestrictedExpression(trimmed.slice(i + 2), context);
        const left = Number(leftRaw);
        const right = Number(rightRaw);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          if (ch === '+') return Number((left + right).toFixed(4));
          if (ch === '-') return Number((left - right).toFixed(4));
          if (ch === '*') return Number((left * right).toFixed(4));
          if (ch === '/') return right === 0 ? 0 : Number((left / right).toFixed(4));
        }
      }
    }
  }

  return coerceScalar(trimmed);
}

function parseListLiteral(raw: string): unknown[] {
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
    .map((s) => coerceScalar(s.trim()))
    .filter((v) => v !== '');
}

function isEmptyValue(actual: unknown): boolean {
  if (actual === undefined || actual === null || actual === '') return true;
  if (typeof actual === 'string' && actual.trim() === '') return true;
  if (Array.isArray(actual)) return actual.length === 0;
  if (isPlainObject(actual)) return Object.keys(actual).length === 0;
  return false;
}

export function compareValues(
  actual: unknown,
  operator: ConditionOperator,
  expectedRaw: string,
  expectedEndRaw?: string,
  context?: Record<string, unknown>,
  fieldExists?: boolean
): boolean {
  const existsFlag = fieldExists !== undefined ? fieldExists : actual !== undefined;

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
    return Boolean(res);
  }

  const expected = coerceScalar(expectedRaw);

  if (operator === '==') {
    if (actual === null || expected === null) {
      return actual === expected;
    }
    if (actual === undefined || expected === undefined) {
      return actual === expected;
    }
    const tsA = toDateTimestamp(actual);
    const tsE = toDateTimestamp(expected);
    if (tsA !== null && tsE !== null) return tsA === tsE;

    if (typeof actual === 'boolean' || typeof expected === 'boolean') {
      if (typeof actual === 'boolean' && typeof expected === 'boolean') return actual === expected;
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    }
    if (Array.isArray(actual) || isPlainObject(actual) || Array.isArray(expected) || isPlainObject(expected)) {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    return actual === expected || String(actual) === String(expected);
  }

  if (operator === '!=') {
    return !compareValues(actual, '==', expectedRaw, expectedEndRaw, context, fieldExists);
  }

  if (operator === '>' || operator === '>=' || operator === '<' || operator === '<=') {
    if (actual === undefined || actual === null || actual === '') return false;

    const tsA = toDateTimestamp(actual);
    const tsE = toDateTimestamp(expected);
    if (tsA !== null && tsE !== null) {
      if (operator === '>') return tsA > tsE;
      if (operator === '>=') return tsA >= tsE;
      if (operator === '<') return tsA < tsE;
      return tsA <= tsE;
    }

    const numA = typeof actual === 'number' ? actual : typeof actual === 'string' && actual.trim() !== '' ? Number(actual) : NaN;
    const numE = typeof expected === 'number' ? expected : Number(expected);
    if (!Number.isNaN(numA) && !Number.isNaN(numE) && typeof actual !== 'boolean') {
      if (operator === '>') return numA > numE;
      if (operator === '>=') return numA >= numE;
      if (operator === '<') return numA < numE;
      return numA <= numE;
    }

    const strA = String(actual);
    const strE = String(expected ?? '');
    if (operator === '>') return strA > strE;
    if (operator === '>=') return strA >= strE;
    if (operator === '<') return strA < strE;
    return strA <= strE;
  }

  if (operator === 'between') {
    if (actual === undefined || actual === null || actual === '') return false;

    const tsA = toDateTimestamp(actual);
    const tsLow = toDateTimestamp(expected);
    const tsHigh = toDateTimestamp(coerceScalar(expectedEndRaw ?? expectedRaw));
    if (tsA !== null && tsLow !== null && tsHigh !== null) {
      const min = Math.min(tsLow, tsHigh);
      const max = Math.max(tsLow, tsHigh);
      return tsA >= min && tsA <= max;
    }

    const numA = typeof actual === 'number' ? actual : Number(actual);
    const low = Number(expected);
    const high = Number(coerceScalar(expectedEndRaw ?? expectedRaw));
    if (Number.isNaN(numA) || Number.isNaN(low) || Number.isNaN(high) || typeof actual === 'boolean') {
      return false;
    }
    const min = Math.min(low, high);
    const max = Math.max(low, high);
    return numA >= min && numA <= max;
  }

  if (operator === 'contains' || operator === 'not_contains') {
    let contains = false;
    if (Array.isArray(actual)) {
      contains = actual.some((v) => String(v).toLowerCase() === String(expected ?? '').toLowerCase());
    } else if (isPlainObject(actual)) {
      const targetKey = String(expected ?? '');
      contains =
        Object.prototype.hasOwnProperty.call(actual, targetKey) ||
        JSON.stringify(actual).toLowerCase().includes(targetKey.toLowerCase());
    } else if (actual !== undefined && actual !== null) {
      contains = String(actual).toLowerCase().includes(String(expected ?? '').toLowerCase());
    }
    return operator === 'contains' ? contains : !contains;
  }

  if (operator === 'starts_with') {
    if (actual === undefined || actual === null) return false;
    return String(actual).toLowerCase().startsWith(String(expected ?? '').toLowerCase());
  }

  if (operator === 'ends_with') {
    if (actual === undefined || actual === null) return false;
    return String(actual).toLowerCase().endsWith(String(expected ?? '').toLowerCase());
  }

  if (operator === 'in' || operator === 'not_in') {
    if (actual === undefined || actual === null) {
      return operator === 'not_in';
    }
    const list = parseListLiteral(expectedRaw).map((item) => String(item).trim().toLowerCase());
    let matched = false;
    if (Array.isArray(actual)) {
      matched = actual.some((el) => list.includes(String(el).trim().toLowerCase()));
    } else {
      const actualNorm = String(actual).trim().toLowerCase();
      matched = list.includes(actualNorm);
    }
    return operator === 'in' ? matched : !matched;
  }

  return false;
}

/**
 * Parses spreadsheet cell expressions such as:
 * `*` (wildcard), `< 50000`, `>= 50000 && <= 250000`, `between 100..500`, `in [US, SG, IN]`,
 * `starts_with ACME`, `ends_with .com`, `is_empty`, `is_not_empty`, `exists`, `not_exists`, or scalar.
 */
export function evaluateTableCell(
  cellSpec: string,
  actualValue: unknown,
  fieldExists?: boolean
): boolean {
  const spec = cellSpec.trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'any') return true;

  if (spec.includes('&&')) {
    return spec.split('&&').every((part) => evaluateTableCell(part.trim(), actualValue, fieldExists));
  }

  if (spec.includes('||')) {
    return spec.split('||').some((part) => evaluateTableCell(part.trim(), actualValue, fieldExists));
  }

  const unaryNorm = spec.toLowerCase();
  if (unaryNorm === 'is_empty' || unaryNorm === 'is_not_empty' || unaryNorm === 'exists' || unaryNorm === 'not_exists') {
    return compareValues(actualValue, unaryNorm as ConditionOperator, '', undefined, undefined, fieldExists);
  }

  const betweenMatch = spec.match(/^between\s+(.+?)\s*(?:\.\.|,|and)\s*(.+)$/i);
  if (betweenMatch) {
    return compareValues(actualValue, 'between', betweenMatch[1].trim(), betweenMatch[2].trim(), undefined, fieldExists);
  }

  const inMatch = spec.match(/^(not_in|in)\s*(\[.*\])$/i);
  if (inMatch) {
    return compareValues(actualValue, inMatch[1].toLowerCase() as ConditionOperator, inMatch[2], undefined, undefined, fieldExists);
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
      fieldExists
    );
  }

  return compareValues(actualValue, '==', spec, undefined, undefined, fieldExists);
}
