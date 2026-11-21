import { ConditionEvalTrace, DecisionTraceStep } from '../types';

let executionSequence = 0;

export function nextExecutionId(prefix = 'exec'): string {
  executionSequence = (executionSequence + 1) % 100000;
  return `${prefix}-${Date.now()}-${String(executionSequence).padStart(4, '0')}`;
}

/**
 * Deterministic FNV-1a hex digest used for immutable version snapshots.
 * Pure, dependency-free, and identical across browsers and Node.
 */
export function computeDeterministicHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c + i) & 0xff;
    h2 = Math.imul(h2, 0x01000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `fnv1a:${hex1}${hex2}`;
}

export function buildInputSummary(input: Record<string, unknown>): Record<string, string> {
  const summary: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) summary[k] = 'undefined';
    else if (v === null) summary[k] = 'null';
    else if (typeof v === 'object') summary[k] = JSON.stringify(v);
    else summary[k] = String(v);
  }
  return summary;
}

export function buildConditionTraceSteps(
  conditions: ConditionEvalTrace[],
  phase: DecisionTraceStep['phase'] = 'condition',
  startIndex = 1
): DecisionTraceStep[] {
  return conditions.map((c, idx) => ({
    stepIndex: startIndex + idx,
    phase,
    label: c.label,
    detail: `${c.label} (${c.expectedSpec}) -> actual=${c.actualValue} => ${c.passed ? 'TRUE' : 'FALSE'}`,
    passed: c.passed,
  }));
}
