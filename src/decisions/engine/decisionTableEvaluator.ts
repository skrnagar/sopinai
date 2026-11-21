import {
  ConditionEvalTrace,
  DecisionExecutionSpec,
  DecisionTableRow,
  DecisionTableSpec,
  DecisionTraceStep,
} from '../types';
import { buildInputSummary, nextExecutionId } from './executionTrace';
import { coerceScalar, evaluateTableCell, parseTypedExpectedValue, resolveInputField } from './operators';
import { validateDecisionTableSpec, validateInputAgainstSchema } from './validators';

function buildTypedRowOutput(
  table: DecisionTableSpec,
  row: DecisionTableRow
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(row.outputs)) {
    const col = table.outputColumns.find((c) => c.field === k);
    out[k] = col ? parseTypedExpectedValue(raw, col.type) : coerceScalar(raw);
  }
  return out;
}

export function evaluateDecisionTableSpec(
  table: DecisionTableSpec,
  input: Record<string, unknown>,
  sourceTrigger: DecisionExecutionSpec['sourceTrigger'] = 'Simulator'
): DecisionExecutionSpec {
  const started = performance.now();
  const inputSummary = buildInputSummary(input && typeof input === 'object' ? input : {});
  const tableCheck = validateDecisionTableSpec(table);
  const nonOverlapStructuralErrors = (tableCheck.structured?.errors ?? []).filter(
    (e) =>
      e.code !== 'UNIQUE_OVERLAP_CONFLICT' &&
      e.code !== 'UNIQUE_WILDCARD_OVERLAP' &&
      e.code !== 'ANY_POLICY_OUTPUT_CONFLICT'
  );
  if (nonOverlapStructuralErrors.length > 0) {
    const messages = nonOverlapStructuralErrors.map((e) => e.message);
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
      executionTrace: messages.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'error',
        label: 'Ambiguous / Invalid Table Config',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Decision Table configuration rejected: ${messages.join(' ')}`,
      status: 'Error',
      errorCode: 'AMBIGUOUS_TABLE_CONFIG',
      validationErrors: messages,
      durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
      executedAt: 'Just now',
    };
  }

  // Validate present input values (and explicitly required columns) against table column types
  const columnSchemaErrors = validateInputAgainstSchema(
    table.inputColumns.map((col) => ({
      name: col.field,
      type: col.type,
      required: Boolean(col.required),
      description: col.label,
    })),
    input
  );
  if (columnSchemaErrors.length > 0) {
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
      executionTrace: columnSchemaErrors.map((err, i) => ({
        stepIndex: i + 1,
        phase: 'validation',
        label: 'Table Input Type Validation',
        detail: err,
        passed: false,
      })),
      finalOutput: {},
      explanation: `Decision Table input validation failed: ${columnSchemaErrors.join(' ')}`,
      status: 'Error',
      errorCode: 'SCHEMA_VALIDATION_ERROR',
      validationErrors: columnSchemaErrors,
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
      const cellPassed = evaluateTableCell(cellSpec, resolved.value, resolved.exists, col.type);
      const actualLabel = !resolved.exists ? 'missing' : JSON.stringify(resolved.value);
      const item: ConditionEvalTrace = {
        nodeId: `${row.id}:${col.field}`,
        label: `Row #${row.priority} · ${col.label}`,
        passed: cellPassed,
        actualValue: actualLabel,
        expectedSpec: cellSpec,
        explanation: `Row #${row.priority} (${col.field}): actual=${actualLabel} vs "${cellSpec}" => ${
          cellPassed ? 'MATCH' : 'MISS'
        }`,
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

  if (table.hitPolicy === 'any' && matchedRows.length > 1) {
    const firstOut = JSON.stringify(buildTypedRowOutput(table, matchedRows[0]));
    const conflict = matchedRows.some(
      (r) => JSON.stringify(buildTypedRowOutput(table, r)) !== firstOut
    );
    if (conflict) {
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
            label: 'Any Hit Policy Output Conflict',
            detail: `Rows ${matchedRows.map((r) => `#${r.priority}`).join(', ')} matched with conflicting outputs.`,
            passed: false,
          },
        ],
        finalOutput: {},
        explanation: `Any hit policy violation: matching rows ${matchedRows.map((r) => `#${r.priority}`).join(', ')} produced differing outputs.`,
        status: 'Error',
        errorCode: 'ANY_HIT_POLICY_CONFLICT',
        validationErrors: [
          `Any hit-policy violation: overlapping rows ${matchedRows.map((r) => `#${r.priority}`).join(', ')} produced conflicting outputs.`,
        ],
        durationMs: Math.max(0.1, Math.round((performance.now() - started) * 100) / 100),
        executedAt: 'Just now',
      };
    }
  }

  let finalOutput: Record<string, unknown> = Object.fromEntries(
    Object.entries(table.defaultOutput).map(([k, v]) => {
      const col = table.outputColumns.find((c) => c.field === k);
      if (typeof v === 'string') {
        return [k, col ? parseTypedExpectedValue(v, col.type) : coerceScalar(v)];
      }
      return [k, v];
    })
  );
  let status: DecisionExecutionSpec['status'] = 'Fallback';
  let explanation = `No row in "${table.name}" matched input; returned explicit default fallback output: ${JSON.stringify(finalOutput)}.`;

  if (matchedRows.length > 0) {
    status = 'Matched';
    if (table.hitPolicy === 'collect-all') {
      const outcomes = matchedRows.map((r) => ({
        rowPriority: r.priority,
        ...(r.note ? { rowNote: r.note } : {}),
        ...buildTypedRowOutput(table, r),
      }));
      finalOutput = {
        matchedCount: matchedRows.length,
        outcomes,
      };
      explanation = `Decision Table "${table.name}" (collect-all) matched ${matchedRows.length} rows (${matchedRows.map((r) => `#${r.priority}`).join(', ')}).`;
    } else {
      const winner = matchedRows[0];
      finalOutput = buildTypedRowOutput(table, winner);
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
