import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FlaskConical,
  History,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Plus } from 'lucide-react';
import {
  DecisionEnvironment,
  DecisionExecutionSpec,
  DecisionSettings,
  DecisionTableSpec,
  DecisionTestCase,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { runBatchTestCases, runSingleTestCase } from '../evaluator';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface SimulationAndMonitoringProps {
  mode: 'testing' | 'executions' | 'versions' | 'settings';
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
  executions: DecisionExecutionSpec[];
  settings: DecisionSettings;
  onUpdateRule: (rule: RuleSpec, note?: string) => void;
  onUpdateTable: (table: DecisionTableSpec, note?: string) => void;
  onUpdateSettings: (partial: Partial<DecisionSettings>) => void;
}

export const SimulationAndMonitoring: React.FC<SimulationAndMonitoringProps> = ({
  mode,
  rules,
  tables,
  rulesets,
  chains,
  scorecards,
  executions,
  settings,
  onUpdateRule,
  onUpdateTable,
  onUpdateSettings,
}) => {
  const [selectedTestTargetId, setSelectedTestTargetId] = useState<string>(
    () => rules[0]?.id ?? tables[0]?.id ?? ''
  );
  const [batchSummary, setBatchSummary] = useState<string>('');
  const [execFilter, setExecFilter] = useState<'All' | 'Matched' | 'Fallback' | 'Error'>('All');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>(
    () => executions[0]?.id ?? ''
  );

  const [addFixtureOpen, setAddFixtureOpen] = useState(false);
  const [fixtureName, setFixtureName] = useState('Custom Boundary Fixture');
  const [fixtureInputJson, setFixtureInputJson] = useState(
    '{\n  "invoiceAmount": 50000,\n  "vendorVerified": true,\n  "duplicateFound": false\n}'
  );
  const [fixtureExpectedJson, setFixtureExpectedJson] = useState(
    '{\n  "decision": "manual_review",\n  "requiresHumanGate": true\n}'
  );
  const [fixtureErr, setFixtureErr] = useState('');

  // 7. TEST & SIMULATION
  if (mode === 'testing') {
    const targetRule = rules.find((r) => r.id === selectedTestTargetId);
    const targetTable = tables.find((t) => t.id === selectedTestTargetId);
    const activeCases = targetRule?.testCases ?? targetTable?.testCases ?? [];
    const collections = { rules, tables, rulesets, chains, scorecards };

    const handleRunSingle = (tc: DecisionTestCase) => {
      if (targetRule) {
        const { updatedCase } = runSingleTestCase('rule', targetRule.id, tc, collections);
        const nextCases = targetRule.testCases.map((c) => (c.id === tc.id ? updatedCase : c));
        onUpdateRule(
          { ...targetRule, testCases: nextCases, updatedAt: 'Just now' },
          `Ran single test case "${tc.name}" (${updatedCase.lastPassed ? 'PASS' : 'FAIL'})`
        );
        setBatchSummary(
          `Single test "${tc.name}": ${updatedCase.lastPassed ? 'PASSED' : 'FAILED'}.`
        );
      } else if (targetTable) {
        const { updatedCase } = runSingleTestCase('table', targetTable.id, tc, collections);
        const nextCases = targetTable.testCases.map((c) => (c.id === tc.id ? updatedCase : c));
        onUpdateTable(
          { ...targetTable, testCases: nextCases, updatedAt: 'Just now' },
          `Ran single table test "${tc.name}" (${updatedCase.lastPassed ? 'PASS' : 'FAIL'})`
        );
        setBatchSummary(
          `Single test "${tc.name}": ${updatedCase.lastPassed ? 'PASSED' : 'FAILED'}.`
        );
      }
    };

    const handleRunSuite = () => {
      if (targetRule) {
        const res = runBatchTestCases('rule', targetRule.id, targetRule.testCases, collections);
        onUpdateRule(
          {
            ...targetRule,
            testCases: res.updatedCases,
            status:
              res.failedCount === 0 && targetRule.status === 'Draft' ? 'Tested' : targetRule.status,
            updatedAt: 'Just now',
          },
          `Ran regression suite (${res.passedCount}/${res.updatedCases.length} pass)`
        );
        setBatchSummary(
          `Batch suite complete for "${targetRule.name}": ${res.passedCount} passed, ${res.failedCount} failed.`
        );
      } else if (targetTable) {
        const res = runBatchTestCases('table', targetTable.id, targetTable.testCases, collections);
        onUpdateTable(
          {
            ...targetTable,
            testCases: res.updatedCases,
            status:
              res.failedCount === 0 && targetTable.status === 'Draft' ? 'Tested' : targetTable.status,
            updatedAt: 'Just now',
          },
          `Ran table regression suite (${res.passedCount}/${res.updatedCases.length} pass)`
        );
        setBatchSummary(
          `Batch suite complete for "${targetTable.name}": ${res.passedCount} passed, ${res.failedCount} failed.`
        );
      }
    };

    const handleAddFixture = () => {
      setFixtureErr('');
      try {
        const inputJson = JSON.parse(fixtureInputJson) as Record<string, unknown>;
        const expectedOutput = JSON.parse(fixtureExpectedJson) as Record<string, unknown>;
        const newCase: DecisionTestCase = {
          id: `tc-${Date.now()}`,
          name: fixtureName.trim() || 'Custom Regression Case',
          inputJson,
          expectedOutput,
        };
        if (targetRule) {
          onUpdateRule(
            { ...targetRule, testCases: [newCase, ...targetRule.testCases], updatedAt: 'Just now' },
            `Added test fixture "${newCase.name}"`
          );
        } else if (targetTable) {
          onUpdateTable(
            { ...targetTable, testCases: [newCase, ...targetTable.testCases], updatedAt: 'Just now' },
            `Added table fixture "${newCase.name}"`
          );
        }
        setAddFixtureOpen(false);
        setBatchSummary(`Added test fixture "${newCase.name}". Run case or batch suite to verify.`);
      } catch {
        setFixtureErr('Input and Expected Output must be valid JSON objects.');
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label htmlFor="test-suite-target" className="block text-xs font-semibold">
              Select Rule or Decision Table Regression Suite
            </label>
            <select
              id="test-suite-target"
              value={selectedTestTargetId}
              onChange={(e) => {
                setSelectedTestTargetId(e.target.value);
                setBatchSummary('');
              }}
              className="min-h-[44px] px-3 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
            >
              {rules.map((r) => (
                <option key={r.id} value={r.id}>
                  Rule · {r.name} ({r.testCases.length} cases)
                </option>
              ))}
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table · {t.name} ({t.testCases.length} cases)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAddFixtureOpen((v) => !v)}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#101014]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
              <span>Add Fixture</span>
            </button>
            <button
              type="button"
              onClick={handleRunSuite}
              disabled={activeCases.length === 0}
              className="min-h-[44px] px-5 rounded-xl bg-[#6252E8] hover:bg-[#5243d6] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>Run Batch Tests ({activeCases.length})</span>
            </button>
          </div>
        </div>

        {addFixtureOpen && (
          <div className="rounded-2xl border border-[#6252E8]/35 bg-white dark:bg-[#101126] p-4 space-y-3">
            <div className="text-xs font-semibold">Define Custom Input Fixture &amp; Expected Output</div>
            <input
              type="text"
              aria-label="Test fixture name"
              value={fixtureName}
              onChange={(e) => setFixtureName(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <textarea
                rows={4}
                aria-label="Fixture input JSON"
                value={fixtureInputJson}
                onChange={(e) => setFixtureInputJson(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-xs"
              />
              <textarea
                rows={4}
                aria-label="Fixture expected output JSON"
                value={fixtureExpectedJson}
                onChange={(e) => setFixtureExpectedJson(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-xs"
              />
            </div>
            {fixtureErr && <p className="text-xs text-red-500">{fixtureErr}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddFixtureOpen(false)}
                className="min-h-[38px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFixture}
                className="min-h-[38px] px-4 rounded-lg bg-[#6252E8] text-white text-xs font-semibold"
              >
                Save Fixture
              </button>
            </div>
          </div>
        )}

        {batchSummary && (
          <div
            role="status"
            className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-4 py-2.5 text-xs font-semibold"
          >
            {batchSummary}
          </div>
        )}

        <div className="space-y-3">
          {activeCases.length === 0 ? (
            <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-6 text-center text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              No golden test cases registered for this asset yet. Add a fixture above to define regression tests.
            </div>
          ) : (
            activeCases.map((tc) => (
              <div
                key={tc.id}
                className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-semibold">{tc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tc.lastPassed !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                          tc.lastPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {tc.lastPassed ? (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{tc.lastPassed ? 'PASS' : 'FAIL'}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRunSingle(tc)}
                      className="min-h-[34px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-[#6252E8]" aria-hidden="true" />
                      <span>Run Case</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] font-mono">
                  <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-2.5">
                    <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Input JSON</div>
                    <pre className="overflow-x-auto">{JSON.stringify(tc.inputJson, null, 2)}</pre>
                  </div>
                  <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-2.5">
                    <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Expected Output</div>
                    <pre className="overflow-x-auto">{JSON.stringify(tc.expectedOutput, null, 2)}</pre>
                  </div>
                  <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-2.5">
                    <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Actual Output</div>
                    <pre className="overflow-x-auto">
                      {tc.lastActualOutput
                        ? JSON.stringify(tc.lastActualOutput, null, 2)
                        : 'Not run in session'}
                    </pre>
                  </div>
                </div>

                {tc.diffNotes && tc.diffNotes.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] font-mono text-red-700 dark:text-red-300 space-y-1">
                    {tc.diffNotes.map((note, idx) => (
                      <div key={idx}>Diff: {note}</div>
                    ))}
                  </div>
                )}

                {tc.failedConditions && tc.failedConditions.length > 0 && (
                  <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-2.5 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5] space-y-0.5">
                    <div className="font-semibold text-[#101014] dark:text-white">
                      Conditions Evaluated FALSE / Diagnostics:
                    </div>
                    {tc.failedConditions.map((fc, idx) => (
                      <div key={idx}>• {fc}</div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 8. EXECUTIONS & EXPLANATION INSPECTOR
  if (mode === 'executions') {
    const filtered = executions.filter(
      (ex) => execFilter === 'All' || ex.status === execFilter
    );
    const activeExec = filtered.find((e) => e.id === selectedExecutionId) ?? filtered[0] ?? null;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex overflow-x-auto no-scrollbar gap-1.5">
            {(['All', 'Matched', 'Fallback', 'Error'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setExecFilter(f)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold ${
                  execFilter === f
                    ? 'bg-[#6252E8] text-white'
                    : 'bg-white dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10 text-[#5E5E6E] dark:text-[#B5B5C5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-[#5E5E6E] dark:text-[#9A9AB0]">
            {filtered.length} traces recorded
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5 space-y-2">
            {filtered.map((ex) => {
              const selected = activeExec?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExecutionId(ex.id)}
                  className={`w-full text-left rounded-2xl border p-3.5 space-y-1 transition-colors ${
                    selected
                      ? 'border-[#6252E8] bg-[#6252E8]/10 dark:bg-[#6252E8]/20'
                      : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{ex.artifactName}</span>
                    <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] shrink-0">
                      {ex.status} · {ex.durationMs}ms
                    </span>
                  </div>
                  <StatusText
                    items={[ex.sourceTrigger, ex.versionUsed, ex.environment, ex.executedAt]}
                  />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            {activeExec ? (
              <div className="rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-[#B894FF]">
                      EXECUTION INSPECTOR · {activeExec.id}
                    </div>
                    <h3 className="font-display text-base font-semibold mt-0.5">
                      {activeExec.artifactName}
                    </h3>
                  </div>
                  <StatusText
                    items={[activeExec.versionUsed, `${activeExec.durationMs} ms`, activeExec.status]}
                    dark
                    accentLast
                  />
                </div>

                <p className="text-xs text-[#D8D8E6] leading-relaxed">{activeExec.explanation}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-white/10 bg-[#101014] p-3">
                    <div className="font-mono text-[11px] text-[#9A9AB0] mb-1">Input Payload</div>
                    <pre className="font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(activeExec.inputPayload, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#101014] p-3">
                    <div className="font-mono text-[11px] text-[#9A9AB0] mb-1">Final Decision Output</div>
                    <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {JSON.stringify(activeExec.finalOutput, null, 2)}
                    </pre>
                  </div>
                </div>

                {activeExec.validationErrors && activeExec.validationErrors.length > 0 && (
                  <div className="rounded-xl border border-red-400/35 bg-red-500/10 p-3 text-xs font-mono text-red-200 space-y-1">
                    {activeExec.validationErrors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}

                {activeExec.matchedTableRows.length > 0 && (
                  <div className="text-xs">
                    <span className="font-mono text-[#B894FF]">Selected Table Row(s): </span>
                    <span>{activeExec.matchedTableRows.join(' · ')}</span>
                  </div>
                )}

                {activeExec.executionTrace && activeExec.executionTrace.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-mono text-[11px] text-[#A4A4B5]">Deterministic Execution Trace</div>
                    {activeExec.executionTrace.map((st) => (
                      <div
                        key={st.stepIndex}
                        className="rounded-lg border border-white/10 bg-[#101014] px-3 py-2 text-[11px] font-mono flex items-start justify-between gap-2"
                      >
                        <span className="text-[#D8D8E6]">
                          {st.stepIndex}. [{st.phase}] {st.label}: {st.detail}
                        </span>
                        {st.passed !== undefined && (
                          <span className={st.passed ? 'text-emerald-400 shrink-0' : 'text-amber-300 shrink-0'}>
                            {st.passed ? 'TRUE' : 'FALSE'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] text-[#A4A4B5]">Evaluated Conditions</div>
                  {activeExec.evaluatedConditions.map((cond, i) => (
                    <div
                      key={`${cond.nodeId}-${i}`}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-mono"
                    >
                      <span className="truncate">
                        {cond.label} ({cond.expectedSpec})
                      </span>
                      <span className={cond.passed ? 'text-emerald-400 shrink-0' : 'text-amber-300 shrink-0'}>
                        {cond.passed ? 'PASS' : 'FAIL'} · {cond.actualValue}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#101014] p-3 font-mono text-[11px] text-[#C5C5D6] overflow-x-auto">
                  Gateway API Invocation (Target): POST /v1/decisions/{activeExec.artifactId}/evaluate?version={activeExec.versionUsed}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-6 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
                Select an execution trace to inspect inputs, matched rules, and final outcomes.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 9. VERSIONS & ENVIRONMENTS
  if (mode === 'versions') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4">
          <h3 className="font-display text-sm font-semibold">
            Immutable Versions, Promotion &amp; Rollback
          </h3>
          <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
            Published versions are immutable serialized snapshots stored in local browser prototype persistence (not server-side enterprise database persistence). Production workflows execute pinned immutable published snapshots.
          </p>
        </div>

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{rule.name}</div>
                <StatusText items={[rule.version, rule.status, `Env: ${rule.environment}`]} accentLast />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['development', 'staging', 'production'] as DecisionEnvironment[]).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() =>
                      onUpdateRule({ ...rule, environment: env, updatedAt: 'Just now' }, `Promoted to ${env}`)
                    }
                    className={`min-h-[36px] px-3 rounded-lg text-[11px] font-semibold capitalize ${
                      rule.environment === env
                        ? 'bg-[#6252E8] text-white'
                        : 'border border-[#101014]/15 dark:border-white/15'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {rule.versionHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#101014]/10 dark:border-white/10">
                {rule.versionHistory.map((snap) => (
                  <div
                    key={snap.version}
                    className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-[#6252E8] dark:text-[#B894FF]">
                        {snap.version} · {snap.environment} · {snap.snapshotHash}
                      </div>
                      <div className="text-[#5E5E6E] dark:text-[#A4A4B5]">
                        {snap.summary} ({snap.publishedBy}, {snap.publishedAt})
                      </div>
                    </div>
                    {snap.version !== rule.version && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateRule(
                            {
                              ...rule,
                              version: snap.version,
                              environment: snap.environment,
                              status: 'Published',
                              updatedAt: 'Just now',
                            },
                            `Rolled back to ${snap.version}`
                          )
                        }
                        className="min-h-[36px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 10. SETTINGS & GOVERNANCE BOUNDARIES
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
          <span>SOPIN Decisions Governance &amp; Safety Policies</span>
        </div>

        {(
          [
            {
              key: 'requireTestPassBeforePublish' as const,
              label: 'Require Regression Tests Before Publish Gate',
              desc: 'Warn/block promoting a rule to Production when golden test assertions fail.',
            },
            {
              key: 'requireControlApprovalForProd' as const,
              label: 'Require SOPIN Control Approval for Production Promotion',
              desc: 'Separate author role from publisher role; AI agents cannot bypass Control.',
            },
            {
              key: 'strictInputSchemaValidation' as const,
              label: 'Strict Input Schema Validation',
              desc: 'Reject malformed payloads cleanly with deterministic validation diagnostics.',
            },
            {
              key: 'restrictExpressionsToSafeSubset' as const,
              label: 'Restricted Expression Sandbox Mode',
              desc: 'Allow only pure deterministic arithmetic/comparison ASTs (future backend: CEL).',
            },
          ] as const
        ).map((item) => {
          const enabled = settings[item.key];
          return (
            <div
              key={item.key}
              className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold">{item.label}</div>
                <p className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ [item.key]: !enabled })}
                className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold shrink-0 ${
                  enabled
                    ? 'bg-[#6252E8] text-white'
                    : 'border border-[#101014]/15 dark:border-white/15'
                }`}
              >
                {enabled ? 'Enforced' : 'Optional'}
              </button>
            </div>
          );
        })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label htmlFor="dec-editor-role" className="block text-xs font-semibold mb-1">
              Rule Editing Permissions (SOPIN Control RBAC)
            </label>
            <select
              id="dec-editor-role"
              value={settings.allowedEditorsRole}
              onChange={(e) =>
                onUpdateSettings({
                  allowedEditorsRole: e.target.value as DecisionSettings['allowedEditorsRole'],
                })
              }
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
            >
              <option value="Owner & Admin">Owner &amp; Admin</option>
              <option value="Builders & Maintainers">Builders &amp; Maintainers</option>
              <option value="All Workspace Members">All Workspace Members</option>
            </select>
          </div>
          <div>
            <label htmlFor="dec-pub-role" className="block text-xs font-semibold mb-1">
              Production Publish Authority
            </label>
            <select
              id="dec-pub-role"
              value={settings.allowedPublishersRole}
              onChange={(e) =>
                onUpdateSettings({
                  allowedPublishersRole: e.target.value as DecisionSettings['allowedPublishersRole'],
                })
              }
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
            >
              <option value="Owner & Admin Only">Owner &amp; Admin Only</option>
              <option value="Workspace Maintainer">Workspace Maintainer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-2 text-xs">
        <div className="font-mono text-[#B894FF] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Prototype Runtime vs Planned Backend Architecture</span>
        </div>
        <p className="text-[#C5C5D6] leading-relaxed">
          Currently running with TypeScript deterministic local rule evaluation and persisted browser workspace state. Target production backend architecture: Python FastAPI + Pydantic v2 validation + PostgreSQL immutable version store + CEL restricted evaluator + Temporal workflow workers + OpenTelemetry traces.
        </p>
      </div>
    </div>
  );
};
