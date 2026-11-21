import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionTableRow,
  DecisionTableSpec,
  DecisionTraceStep,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { coerceScalar, evaluateTableCell, resolveInputField } from './operators';
import { validateDecisionTableSpec } from './validators';

export function evaluateDecisionTableSpec(
  table: DecisionTableSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  const tableCheck = validateDecisionTableSpec(table);
  if (!tableCheck.valid) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: table.workspaceId,
      artifactType: 'table',
      artifactId: table.id,
      artifactName: table.name,
      versionUsed: table.version,
      environment: table.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: [],
      matchedConditions: [],
      matchedRules: [],
      matchedTableRows: [],
      executionTrace: tableCheck.errors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'error',
        label: 'Ambiguous / Invalid Table Config',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Decision Table configuration rejected: ${tableCheck.errors.join(' ')}`,
      status: 'Error',
      errorCode: 'AMBIGUOUS_TABLE_CONFIG',
      validationErrors: tableCheck.errors,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  const enabledRows = table.rows.filter((r) => r.enabled);
  const orderedRows =
    table.hitPolicy === 'priority'
      ? [...enabledRows].sort((a, b) => a.priority - b.priority)
      : enabledRows;

  const traces: ConditionEvalTrace[] = [];
  const traceSteps: DecisionTraceStep[] = [];
  const matchedRows: DecisionTableRow[] = [];

  for (const row of orderedRows) {
    let rowMatches = true;
    const rowTraces: ConditionEvalTrace[] = [];

    for (const col of table.inputColumns) {
      const cellSpec = row.cells[col.field] ?? '*';
      const resolved = resolveInputField(input, col.field);
      const cellPassed = evaluateTableCell(cellSpec, resolved.value, resolved.exists);
      const item: ConditionEvalTrace = {
        nodeId: `${row.id}:${col.field}`,
        label: `Row #${row.priority} · ${col.label}`,
        passed: cellPassed,
        actualValue: !resolved.exists ? 'missing' : JSON.stringify(resolved.value),
        expectedSpec: cellSpec,
      };
      traces.push(item);
      rowTraces.push(item);
      if (!cellPassed) rowMatches = false;
    }

    traceSteps.push({
      stepIndex: traceSteps.length + 1,
      phase: 'table-row',
      label: `Row #${row.priority}${row.note ? ` (${row.note})` : ''}`,
      detail: rowMatches
        ? `MATCHED (${rowTraces.map((c) => `${c.label}: ${c.expectedSpec}`).join('; ')})`
        : `MISSED (failed: ${rowTraces
            .filter((c) => !c.passed)
            .map((c) => `${c.label} expected ${c.expectedSpec}, got ${c.actualValue}`)
            .join('; ')})`,
      passed: rowMatches,
    });

    if (rowMatches) {
      matchedRows.push(row);
      if (table.hitPolicy === 'first-match' || table.hitPolicy === 'priority') {
        break;
      }
    }
  }

  if (table.hitPolicy === 'unique' && matchedRows.length > 1) {
    return {
      id: nextExecutionId('exec'),
      workspaceId: table.workspaceId,
      artifactType: 'table',
      artifactId: table.id,
      artifactName: table.name,
      versionUsed: table.version,
      environment: table.environment,
      sourceTrigger,
      inputPayload: input,
      inputSummary,
      evaluatedConditions: traces,
      matchedConditions: traces.filter((t) => t.passed),
      matchedRules: [],
      matchedTableRows: matchedRows.map((r) => `Row #${r.priority}`),
      executionTrace: [
        ...traceSteps,
        {
          stepIndex: traceSteps.length + 1,
          phase: 'error',
          label: 'Unique Hit Policy Violation',
          detail: `Rows ${matchedRows.map((r) => `#${r.priority}`).join(', ')} matched simultaneously.`,
          passed: false,
        },
      ],
      finalOutput: {},
      explanation: `Unique hit policy violation: ${matchedRows.length} rows (${matchedRows.map((r) => `#${r.priority}`).join(', ')}) matched simultaneously.`,
      status: 'Error',
      errorCode: 'UNIQUE_HIT_POLICY_VIOLATION',
      validationErrors: [
        `Unique hit-policy conflict: rows ${matchedRows.map((r) => `#${r.priority}`).join(', ')} overlapped.`,
      ],
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  let finalOutput: Record<string, unknown> = Object.fromEntries(
    Object.entries(table.defaultOutput).map(([k, v]) =>
      typeof v === 'string' ? [k, coerceScalar(v)] : [k, v]
    )
  );
  let status: DecisionExecutionSpec['status'] = 'Fallback';
  let explanation = `No row in "${table.name}" matched input; returned explicit default fallback output: ${JSON.stringify(finalOutput)}.`;

  if (matchedRows.length > 0) {
    status = 'Matched';
    if (table.hitPolicy === 'collect-all') {
      const outcomes = matchedRows.map((r) => ({
        rowPriority: r.priority,
        ...(r.note ? { rowNote: r.note } : {}),
        ...Object.fromEntries(Object.entries(r.outputs).map(([k, v]) => [k, coerceScalar(v)])),
      }));
      finalOutput = {
        matchedCount: matchedRows.length,
        outcomes,
      };
      explanation = `Decision Table "${table.name}" (collect-all) matched ${matchedRows.length} rows (${matchedRows.map((r) => `#${r.priority}`).join(', ')}).`;
    } else {
      const winner = matchedRows[0];
      finalOutput = Object.fromEntries(
        Object.entries(winner.outputs).map(([k, v]) => [k, coerceScalar(v)])
      );
      explanation = `Decision Table "${table.name}" (${table.hitPolicy}) selected Row #${winner.priority}${winner.note ? ` — ${winner.note}` : ''}.`;
    }
  }

  traceSteps.push({
    stepIndex: traceSteps.length + 1,
    phase: 'outcome',
    label: status === 'Matched' ? 'Selected Table Outcome' : 'No-Match Default Fallback',
    detail: `${explanation} Output=${JSON.stringify(finalOutput)}`,
    passed: status === 'Matched',
  });

  return {
    id: nextExecutionId('exec'),
    workspaceId: table.workspaceId,
    artifactType: 'table',
    artifactId: table.id,
    artifactName: table.name,
    versionUsed: table.version,
    environment: table.environment,
    sourceTrigger,
    inputPayload: input,
    inputSummary,
    evaluatedConditions: traces,
    matchedConditions: traces.filter((t) => t.passed),
    matchedRules: matchedRows.length > 0 ? [table.name] : [],
    matchedTableRows: matchedRows.map((r) => `Row #${r.priority}${r.note ? ` · ${r.note}` : ''}`),
    executionTrace: traceSteps,
    finalOutput,
    explanation,
    status,
    durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
    executedAt: 'Just now',
  };
}
