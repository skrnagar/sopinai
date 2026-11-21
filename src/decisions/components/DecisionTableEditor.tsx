import React, { useEffect, useState } from 'react';
import { CheckCircle2, Play, Plus, Save, Trash2 } from 'lucide-react';
import {
  DecisionExecutionSpec,
  DecisionTableRow,
  DecisionTableSpec,
  HitPolicy,
} from '../types';
import {
  buildPublishedTableVersion,
  evaluateDecisionTableSpec,
  validateDecisionTableSpec,
} from '../evaluator';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface DecisionTableEditorProps {
  workspaceId: string;
  tables: DecisionTableSpec[];
  selectedTableId?: string;
  onSaveTable: (table: DecisionTableSpec, note?: string) => void;
  onRecordExecution: (exec: DecisionExecutionSpec) => void;
}

function createEmptyTable(workspaceId: string): DecisionTableSpec {
  return {
    id: `tbl-${Date.now()}`,
    workspaceId,
    name: 'New Policy Decision Table',
    description: 'Spreadsheet-style deterministic mapping table.',
    isDemoData: false,
    hitPolicy: 'first-match',
    inputColumns: [
      { id: 'c1', field: 'amount', label: 'Amount', type: 'number' },
      { id: 'c2', field: 'tier', label: 'Tier', type: 'string' },
    ],
    outputColumns: [
      { id: 'o1', field: 'decision', label: 'Decision', type: 'string' },
      { id: 'o2', field: 'route', label: 'Route', type: 'string' },
    ],
    rows: [
      {
        id: `row-${Date.now()}-1`,
        priority: 1,
        enabled: true,
        note: 'Standard fast path',
        cells: { amount: '< 50000', tier: 'in [gold, verified]' },
        outputs: { decision: 'approved', route: 'auto-lane' },
      },
      {
        id: `row-${Date.now()}-2`,
        priority: 2,
        enabled: true,
        note: 'High exposure review',
        cells: { amount: '>= 50000', tier: '*' },
        outputs: { decision: 'manual_review', route: 'finance-gate' },
      },
    ],
    defaultOutput: { decision: 'manual_review', route: 'fallback-ops' },
    testCases: [],
    version: 'v0.1',
    environment: 'development',
    status: 'Draft',
    versionHistory: [],
    updatedAt: 'Just now',
  };
}

export const DecisionTableEditor: React.FC<DecisionTableEditorProps> = ({
  workspaceId,
  tables,
  selectedTableId,
  onSaveTable,
  onRecordExecution,
}) => {
  const [table, setTable] = useState<DecisionTableSpec>(() => {
    const found = tables.find((t) => t.id === selectedTableId) ?? tables[0];
    return found ? structuredClone(found) : createEmptyTable(workspaceId);
  });

  const buildSampleJson = (spec: DecisionTableSpec) => {
    const obj: Record<string, unknown> = {};
    for (const col of spec.inputColumns) {
      if (col.field === 'invoiceAmount') obj[col.field] = 38000;
      else if (col.field === 'vendorVerified') obj[col.field] = true;
      else if (col.field === 'duplicateFound') obj[col.field] = false;
      else if (col.field === 'region') obj[col.field] = 'IN';
      else obj[col.field] = col.type === 'number' ? 25000 : col.type === 'boolean' ? true : 'verified';
    }
    return JSON.stringify(obj, null, 2);
  };

  const [sampleInput, setSampleInput] = useState<string>(() => buildSampleJson(table));
  const [execResult, setExecResult] = useState<DecisionExecutionSpec | null>(null);
  const [parseErr, setParseErr] = useState('');
  const [notice, setNotice] = useState('');
  const [editingRow, setEditingRow] = useState<DecisionTableRow | null>(null);

  useEffect(() => {
    if (!selectedTableId) return;
    const found = tables.find((t) => t.id === selectedTableId);
    if (found) {
      const cloned = structuredClone(found);
      setTable(cloned);
      setSampleInput(buildSampleJson(cloned));
      setExecResult(null);
    }
  }, [selectedTableId, tables]);

  const handleSelectTable = (t: DecisionTableSpec) => {
    const cloned = structuredClone(t);
    setTable(cloned);
    setSampleInput(buildSampleJson(cloned));
    setExecResult(null);
    setParseErr('');
  };

  const handleAddRow = () => {
    const cells: Record<string, string> = {};
    table.inputColumns.forEach((c) => (cells[c.field] = '*'));
    const outputs: Record<string, string> = {};
    table.outputColumns.forEach((c) => (outputs[c.field] = 'manual_review'));

    setTable((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: `row-${Date.now()}`,
          priority: prev.rows.length + 1,
          enabled: true,
          note: `Rule row ${prev.rows.length + 1}`,
          cells,
          outputs,
        },
      ],
    }));
  };

  const handleAddColumn = (kind: 'input' | 'output') => {
    if (kind === 'input') {
      const field = `input_${table.inputColumns.length + 1}`;
      setTable((prev) => ({
        ...prev,
        inputColumns: [
          ...prev.inputColumns,
          { id: `col-${Date.now()}`, field, label: field, type: 'string' },
        ],
        rows: prev.rows.map((r) => ({ ...r, cells: { ...r.cells, [field]: '*' } })),
      }));
    } else {
      const field = `output_${table.outputColumns.length + 1}`;
      setTable((prev) => ({
        ...prev,
        outputColumns: [
          ...prev.outputColumns,
          { id: `out-${Date.now()}`, field, label: field, type: 'string' },
        ],
        rows: prev.rows.map((r) => ({ ...r, outputs: { ...r.outputs, [field]: 'true' } })),
      }));
    }
  };

  const handleRunSample = () => {
    setParseErr('');
    try {
      const payload = JSON.parse(sampleInput) as Record<string, unknown>;
      const exec = evaluateDecisionTableSpec(table, payload, 'Simulator');
      setExecResult(exec);
      onRecordExecution(exec);
    } catch {
      setParseErr('Invalid JSON in sample input.');
    }
  };

  const handleSave = (publish: boolean) => {
    const check = validateDecisionTableSpec(table);
    if (!check.valid) {
      setNotice(`Cannot ${publish ? 'publish' : 'save'} ambiguous table: ${check.errors.join(' ')}`);
      return;
    }
    const next = publish
      ? buildPublishedTableVersion(table, 'production', `Published Decision Table snapshot`)
      : {
          ...table,
          version:
            table.status === 'Published' && !table.version.includes('-draft')
              ? `${table.version}-draft`
              : table.version,
          status: 'Draft' as const,
          updatedAt: 'Just now',
        };
    setTable(next);
    onSaveTable(next, publish ? `Published Table ${next.version}` : `Saved Table Draft ${next.version}`);
    setNotice(
      publish
        ? `Published immutable Decision Table ${next.version}.`
        : `Saved Decision Table Draft (${next.version}) locally.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Selector + New */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex overflow-x-auto no-scrollbar gap-2 flex-1 min-w-0">
          {tables.map((t) => {
            const active = t.id === table.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTable(t)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 transition-colors ${
                  active
                    ? 'border-[#6252E8] bg-[#6252E8]/10 dark:bg-[#6252E8]/25'
                    : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                }`}
              >
                <div className="text-xs font-semibold text-[#101014] dark:text-white truncate max-w-[180px]">
                  {t.name}
                </div>
                <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                  {t.hitPolicy} · {t.version} · {t.status}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleSelectTable(createEmptyTable(workspaceId))}
          className="min-h-[44px] px-3.5 rounded-xl bg-[#101014] dark:bg-white text-white dark:text-[#101014] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Decision Table</span>
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-medium"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice('')} className="text-xs font-semibold text-[#6252E8]">
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Hit Policy Configuration */}
      <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusText
            items={[table.version, table.status, `Hit Policy: ${table.hitPolicy}`, table.isDemoData ? 'Demo Seed' : 'Custom']}
            accentLast
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddColumn('input')}
              className="min-h-[38px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
            >
              + Input Col
            </button>
            <button
              type="button"
              onClick={() => handleAddColumn('output')}
              className="min-h-[38px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
            >
              + Output Col
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="min-h-[38px] px-3 rounded-lg bg-[#6252E8] text-white text-xs font-semibold"
            >
              + Add Row
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label htmlFor="dt-name" className="block text-xs font-semibold mb-1">
              Table Name
            </label>
            <input
              id="dt-name"
              type="text"
              value={table.name}
              onChange={(e) => setTable({ ...table, name: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
            />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="dt-hit-policy" className="block text-xs font-semibold mb-1">
              Matching Hit Policy
            </label>
            <select
              id="dt-hit-policy"
              value={table.hitPolicy}
              onChange={(e) => setTable({ ...table, hitPolicy: e.target.value as HitPolicy })}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
            >
              <option value="first-match">first-match (Row declaration order)</option>
              <option value="priority">priority (Explicit priority column asc)</option>
              <option value="collect-all">collect-all (Return array of all matches)</option>
              <option value="unique">unique (Error on overlapping rows)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid (Horizontal Scroll Safe on Mobile + Row Sheet Button) */}
      <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014]">
                <th className="px-3 py-3 font-mono font-semibold text-[#5E5E6E] dark:text-[#A4A4B5]">
                  Prio
                </th>
                {table.inputColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-3 py-3 font-mono font-semibold text-[#6252E8] dark:text-[#B894FF] whitespace-nowrap"
                  >
                    IF {col.label} ({col.field})
                  </th>
                ))}
                {table.outputColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-3 py-3 font-mono font-semibold text-[#101014] dark:text-white whitespace-nowrap border-l border-[#101014]/10 dark:border-white/10"
                  >
                    THEN {col.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101014]/[0.08] dark:divide-white/10">
              {table.rows.map((row) => {
                const isMatched = execResult?.matchedTableRows.some((m) =>
                  m.startsWith(`Row #${row.priority}`)
                );
                return (
                  <tr
                    key={row.id}
                    className={
                      isMatched
                        ? 'bg-[#6252E8]/12 dark:bg-[#6252E8]/25'
                        : !row.enabled
                        ? 'opacity-50'
                        : 'hover:bg-[#F7F7FA]/60 dark:hover:bg-white/[0.03]'
                    }
                  >
                    <td className="px-3 py-2 font-mono">
                      <input
                        type="number"
                        aria-label={`Row ${row.priority} priority`}
                        value={row.priority}
                        onChange={(e) =>
                          setTable({
                            ...table,
                            rows: table.rows.map((r) =>
                              r.id === row.id ? { ...r, priority: Number(e.target.value) || 1 } : r
                            ),
                          })
                        }
                        className="w-14 min-h-[38px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-transparent font-mono text-xs"
                      />
                    </td>
                    {table.inputColumns.map((col) => (
                      <td key={`${row.id}-${col.id}`} className="px-2 py-2 min-w-[140px]">
                        <input
                          type="text"
                          aria-label={`Row ${row.priority} ${col.label}`}
                          value={row.cells[col.field] ?? '*'}
                          onChange={(e) =>
                            setTable({
                              ...table,
                              rows: table.rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, cells: { ...r.cells, [col.field]: e.target.value } }
                                  : r
                              ),
                            })
                          }
                          className="w-full min-h-[38px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-xs"
                        />
                      </td>
                    ))}
                    {table.outputColumns.map((col) => (
                      <td
                        key={`${row.id}-${col.id}`}
                        className="px-2 py-2 min-w-[130px] border-l border-[#101014]/10 dark:border-white/10"
                      >
                        <input
                          type="text"
                          aria-label={`Row ${row.priority} output ${col.label}`}
                          value={row.outputs[col.field] ?? ''}
                          onChange={(e) =>
                            setTable({
                              ...table,
                              rows: table.rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, outputs: { ...r.outputs, [col.field]: e.target.value } }
                                  : r
                              ),
                            })
                          }
                          className="w-full min-h-[38px] px-2.5 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] font-mono text-xs"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="min-h-[38px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTable({
                              ...table,
                              rows: table.rows.filter((r) => r.id !== row.id),
                            })
                          }
                          aria-label={`Delete row ${row.priority}`}
                          className="w-9 h-9 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default Fallback & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Default / Fallback Output</span>
            <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
              When 0 rows match
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10 font-mono text-xs overflow-x-auto">
            {JSON.stringify(table.defaultOutput, null, 2)}
          </pre>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="min-h-[44px] px-4 rounded-xl border border-[#101014]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Publish Table</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold">Test Decision Table Input</span>
            <span className="font-mono text-[11px] text-[#B894FF]">{table.hitPolicy}</span>
          </div>
          <textarea
            rows={4}
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            aria-label="Sample JSON input for decision table"
            className="w-full p-2.5 rounded-xl border border-white/15 bg-[#101014] font-mono text-xs text-white"
          />
          {parseErr && <p className="text-xs text-red-400">{parseErr}</p>}
          <button
            type="button"
            onClick={handleRunSample}
            className="w-full min-h-[44px] rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Evaluate Table Rows</span>
          </button>

          {execResult && (
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              <div
                className={`font-mono ${
                  execResult.status === 'Error' ? 'text-red-400' : 'text-[#B894FF]'
                }`}
              >
                {execResult.status} · Matched: {execResult.matchedTableRows.join(', ') || 'Default Fallback'}
              </div>
              {execResult.validationErrors && execResult.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-2 text-[11px] font-mono text-red-200">
                  {execResult.validationErrors.join(' ')}
                </div>
              )}
              <pre className="p-2.5 rounded-lg bg-[#101014] border border-white/10 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(execResult.finalOutput, null, 2)}
              </pre>
              <p className="text-[11px] text-[#C5C5D6]">{execResult.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Friendly Row Detail Editor Bottom Sheet */}
      <BottomSheet
        open={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        title={editingRow ? `Edit Table Row #${editingRow.priority}` : 'Edit Row'}
      >
        {editingRow && (
          <div className="space-y-3">
            <div>
              <label htmlFor="row-note-edit" className="block text-xs font-semibold mb-1">
                Row Rationale Note
              </label>
              <input
                id="row-note-edit"
                type="text"
                value={editingRow.note ?? ''}
                onChange={(e) => setEditingRow({ ...editingRow, note: e.target.value })}
                className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
              />
            </div>

            {table.inputColumns.map((col) => (
              <div key={`sheet-in-${col.id}`}>
                <label className="block text-xs font-mono font-semibold mb-1">
                  IF {col.label} ({col.field})
                </label>
                <input
                  type="text"
                  value={editingRow.cells[col.field] ?? '*'}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      cells: { ...editingRow.cells, [col.field]: e.target.value },
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-sm"
                />
              </div>
            ))}

            {table.outputColumns.map((col) => (
              <div key={`sheet-out-${col.id}`}>
                <label className="block text-xs font-mono font-semibold mb-1">
                  THEN {col.label} ({col.field})
                </label>
                <input
                  type="text"
                  value={editingRow.outputs[col.field] ?? ''}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      outputs: { ...editingRow.outputs, [col.field]: e.target.value },
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-sm"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setTable({
                  ...table,
                  rows: table.rows.map((r) => (r.id === editingRow.id ? editingRow : r)),
                });
                setEditingRow(null);
              }}
              className="w-full min-h-[44px] rounded-xl bg-[#6252E8] text-white text-xs font-semibold"
            >
              Apply Row Changes
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
