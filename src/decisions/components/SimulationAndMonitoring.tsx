import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  GitCompare,
  History,
  Lock,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionEnvironment,
  DecisionExecutionSpec,
  DecisionSettings,
  DecisionTableSpec,
  DecisionTestCase,
  DecisionVersionSnapshot,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import {
  checkEditPermission,
  checkTestEvidenceFreshness,
  compareVersionSnapshots,
  computeArtifactSpecHash,
  evaluatePublishGovernancePolicy,
  isPublishedSnapshotStatus,
  rollbackArtifactToSnapshot,
  runBatchTestCases,
  runSingleTestCase,
  verifySnapshotIntegrity,
} from '../evaluator';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';
import { HighlightedCode } from '../../components/ui/HighlightedCode';

interface SimulationAndMonitoringProps {
  mode: 'testing' | 'executions' | 'versions' | 'settings';
  workspaceRole?: string;
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
  executions: DecisionExecutionSpec[];
  settings: DecisionSettings;
  onUpdateRule: (rule: RuleSpec, note?: string) => void;
  onUpdateTable: (table: DecisionTableSpec, note?: string) => void;
  onUpdateRuleset?: (rs: RulesetSpec, note?: string) => void;
  onUpdateChain?: (chain: RuleChainSpec, note?: string) => void;
  onUpdateScorecard?: (sc: ScorecardSpec, note?: string) => void;
  onUpdateSettings: (partial: Partial<DecisionSettings>) => void;
}

interface UnifiedArtifactEntry {
  type: DecisionArtifactType;
  label: string;
  spec: DecisionArtifactSpec;
}

export const SimulationAndMonitoring: React.FC<SimulationAndMonitoringProps> = ({
  mode,
  workspaceRole = 'Workspace Maintainer',
  rules,
  tables,
  rulesets,
  chains,
  scorecards,
  executions,
  settings,
  onUpdateRule,
  onUpdateTable,
  onUpdateRuleset,
  onUpdateChain,
  onUpdateScorecard,
  onUpdateSettings,
}) => {
  const allArtifacts: UnifiedArtifactEntry[] = useMemo(
    () => [
      ...rules.map((spec) => ({ type: 'rule' as const, label: 'Rule', spec })),
      ...tables.map((spec) => ({ type: 'table' as const, label: 'Table', spec })),
      ...rulesets.map((spec) => ({ type: 'ruleset' as const, label: 'Ruleset', spec })),
      ...chains.map((spec) => ({ type: 'chain' as const, label: 'Chain', spec })),
      ...scorecards.map((spec) => ({ type: 'scorecard' as const, label: 'Scorecard', spec })),
    ],
    [rules, tables, rulesets, chains, scorecards]
  );

  const [selectedTestTargetId, setSelectedTestTargetId] = useState<string>(
    () => rules[0]?.id ?? tables[0]?.id ?? rulesets[0]?.id ?? chains[0]?.id ?? scorecards[0]?.id ?? ''
  );
  const [batchSummary, setBatchSummary] = useState<string>('');
  const [execFilter, setExecFilter] = useState<'All' | 'Matched' | 'Fallback' | 'Error'>('All');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>(
    () => executions[0]?.id ?? ''
  );

  const [addFixtureOpen, setAddFixtureOpen] = useState(false);
  const [fixtureName, setFixtureName] = useState('Custom Boundary Fixture');
  const [fixtureBoundary, setFixtureBoundary] = useState(true);
  const [fixtureInputJson, setFixtureInputJson] = useState(
    '{\n  "invoiceAmount": 50000,\n  "vendorVerified": true,\n  "duplicateFound": false\n}'
  );
  const [fixtureExpectedJson, setFixtureExpectedJson] = useState(
    '{\n  "decision": "manual_review",\n  "requiresHumanGate": true\n}'
  );
  const [fixtureErr, setFixtureErr] = useState('');

  // Versions & Environments state
  const [versionTypeFilter, setVersionTypeFilter] = useState<'all' | DecisionArtifactType>('all');
  const [versionNotice, setVersionNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [diffSelection, setDiffSelection] = useState<{
    artifactId: string;
    snapA: DecisionVersionSnapshot;
    snapB: DecisionVersionSnapshot;
  } | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState<{
    entry: UnifiedArtifactEntry;
    snapshot: DecisionVersionSnapshot;
  } | null>(null);
  const [promoteConfirm, setPromoteConfirm] = useState<{
    entry: UnifiedArtifactEntry;
    targetEnv: DecisionEnvironment;
  } | null>(null);
  const [promoteApprovalChecked, setPromoteApprovalChecked] = useState(false);

  const collections = useMemo(
    () => ({ rules, tables, rulesets, chains, scorecards }),
    [rules, tables, rulesets, chains, scorecards]
  );

  const persistArtifactUpdate = (type: DecisionArtifactType, nextSpec: DecisionArtifactSpec, note?: string) => {
    if (type === 'rule') onUpdateRule(nextSpec as RuleSpec, note);
    else if (type === 'table') onUpdateTable(nextSpec as DecisionTableSpec, note);
    else if (type === 'ruleset') onUpdateRuleset?.(nextSpec as RulesetSpec, note);
    else if (type === 'chain') onUpdateChain?.(nextSpec as RuleChainSpec, note);
    else if (type === 'scorecard') onUpdateScorecard?.(nextSpec as ScorecardSpec, note);
  };

  // 7. TEST & SIMULATION
  if (mode === 'testing') {
    const activeEntry =
      allArtifacts.find((a) => a.spec.id === selectedTestTargetId) ?? allArtifacts[0];
    const activeCases: DecisionTestCase[] = activeEntry?.spec.testCases ?? [];
    const freshness = activeEntry
      ? checkTestEvidenceFreshness(activeEntry.type, activeEntry.spec)
      : null;
    const passedCount = activeCases.filter((tc) => tc.lastPassed === true).length;
    const boundaryCount = activeCases.filter((tc) => tc.isBoundaryOrNegative).length;

    const handleRunSingle = (tc: DecisionTestCase) => {
      if (!activeEntry) return;
      const { updatedCase } = runSingleTestCase(
        activeEntry.type,
        activeEntry.spec.id,
        tc,
        collections
      );
      const nextCases = activeCases.map((c) => (c.id === tc.id ? updatedCase : c));
      persistArtifactUpdate(
        activeEntry.type,
        { ...activeEntry.spec, testCases: nextCases, updatedAt: 'Just now' } as DecisionArtifactSpec,
        `Ran ${activeEntry.label} test case "${tc.name}" (${updatedCase.lastPassed ? 'PASS' : 'FAIL'})`
      );
      setBatchSummary(
        `Single test "${tc.name}": ${updatedCase.lastPassed ? 'PASSED' : 'FAILED'} (${activeEntry.spec.version}).`
      );
    };

    const handleRunSuite = () => {
      if (!activeEntry) return;
      const res = runBatchTestCases(
        activeEntry.type,
        activeEntry.spec.id,
        activeCases,
        collections
      );
      const shouldPromoteToTested =
        res.failedCount === 0 &&
        res.updatedCases.length > 0 &&
        (activeEntry.spec.status === 'Draft' || activeEntry.spec.status === 'Validated');
      persistArtifactUpdate(
        activeEntry.type,
        {
          ...activeEntry.spec,
          testCases: res.updatedCases,
          status: shouldPromoteToTested ? 'Tested' : activeEntry.spec.status,
          updatedAt: 'Just now',
        } as DecisionArtifactSpec,
        `Ran ${activeEntry.label} regression suite (${res.passedCount}/${res.updatedCases.length} pass)`
      );
      setBatchSummary(
        `Batch suite complete for "${activeEntry.spec.name}": ${res.passedCount} passed, ${res.failedCount} failed (against ${activeEntry.spec.version}).`
      );
    };

    const handleAddFixture = () => {
      if (!activeEntry) return;
      setFixtureErr('');
      try {
        const inputJson = JSON.parse(fixtureInputJson) as Record<string, unknown>;
        const expectedOutput = JSON.parse(fixtureExpectedJson) as Record<string, unknown>;
        const newCase: DecisionTestCase = {
          id: `tc-${Date.now()}`,
          name: fixtureName.trim() || 'Custom Regression Case',
          inputJson,
          expectedOutput,
          isBoundaryOrNegative: fixtureBoundary,
        };
        persistArtifactUpdate(
          activeEntry.type,
          {
            ...activeEntry.spec,
            testCases: [newCase, ...activeCases],
            updatedAt: 'Just now',
          } as DecisionArtifactSpec,
          `Added ${fixtureBoundary ? 'boundary ' : ''}test fixture "${newCase.name}"`
        );
        setAddFixtureOpen(false);
        setBatchSummary(`Added test fixture "${newCase.name}". Run suite to record evidence against ${activeEntry.spec.version}.`);
      } catch {
        setFixtureErr('Input and Expected Output must be valid JSON objects.');
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label htmlFor="test-suite-target" className="block text-xs font-semibold">
              Select Decision Artifact Regression Suite (All 5 Types)
            </label>
            <select
              id="test-suite-target"
              value={activeEntry?.spec.id ?? ''}
              onChange={(e) => {
                setSelectedTestTargetId(e.target.value);
                setBatchSummary('');
              }}
              className="min-h-[44px] px-3 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm max-w-full"
            >
              {allArtifacts.map((entry) => (
                <option key={entry.spec.id} value={entry.spec.id}>
                  {entry.label} · {entry.spec.name} ({entry.spec.testCases.length} cases · {entry.spec.version})
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

        {activeEntry && freshness && (
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <StatusText
              items={[
                `${activeEntry.label}: ${activeEntry.spec.version}`,
                `Status: ${activeEntry.spec.status}`,
                `Passing: ${passedCount}/${activeCases.length}`,
                `Boundary/Neg: ${boundaryCount}`,
              ]}
              accentLast
            />
            <span
              className={`font-mono text-[11px] font-semibold ${
                freshness.allPassed && freshness.allCurrentForSpec
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : freshness.staleCaseCount > 0 || freshness.failedCaseCount > 0
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
              }`}
            >
              {freshness.allPassed && freshness.allCurrentForSpec
                ? `Evidence Current (${freshness.currentSpecHash.slice(0, 18)}...)`
                : freshness.staleCaseCount > 0
                ? `${freshness.staleCaseCount} Stale Case(s) — Re-run Required`
                : freshness.failedCaseCount > 0
                ? `${freshness.failedCaseCount} Failing Case(s)`
                : 'Unrun / Pending Evidence'}
            </span>
          </div>
        )}

        {addFixtureOpen && (
          <div className="rounded-2xl border border-[#6252E8]/35 bg-white dark:bg-[#101126] p-4 space-y-3">
            <div className="text-xs font-semibold">Define Custom Input Fixture &amp; Expected Output</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                aria-label="Test fixture name"
                value={fixtureName}
                onChange={(e) => setFixtureName(e.target.value)}
                className="flex-1 min-w-[200px] min-h-[40px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
              />
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={fixtureBoundary}
                  onChange={(e) => setFixtureBoundary(e.target.checked)}
                />
                <span>Boundary / Negative Fixture</span>
              </label>
            </div>
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
            activeCases.map((tc) => {
              const isStale =
                freshness &&
                tc.lastPassed !== undefined &&
                ((tc.testedVersion !== undefined && tc.testedVersion !== activeEntry?.spec.version) ||
                  (tc.testedSpecHash !== undefined && tc.testedSpecHash !== freshness.currentSpecHash));
              return (
                <div
                  key={tc.id}
                  className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-semibold">{tc.name}</span>
                      {tc.isBoundaryOrNegative && (
                        <span className="font-mono text-[10px] uppercase text-[#6252E8] dark:text-[#B894FF]">
                          · Boundary/Neg
                        </span>
                      )}
                      {isStale && (
                        <span className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-300">
                          · Stale ({tc.testedVersion})
                        </span>
                      )}
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
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#0D1021] border border-[#101014]/10 dark:border-white/10 p-2.5">
                      <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Input JSON</div>
                      <pre className="overflow-x-auto">
                        <HighlightedCode
                          code={JSON.stringify(tc.inputJson, null, 2)}
                          language="json"
                          surface="auto"
                        />
                      </pre>
                    </div>
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#0D1021] border border-[#101014]/10 dark:border-white/10 p-2.5">
                      <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Expected Output</div>
                      <pre className="overflow-x-auto">
                        <HighlightedCode
                          code={JSON.stringify(tc.expectedOutput, null, 2)}
                          language="json"
                          surface="auto"
                        />
                      </pre>
                    </div>
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#0D1021] border border-[#101014]/10 dark:border-white/10 p-2.5">
                      <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Actual Output</div>
                      <pre className="overflow-x-auto">
                        {tc.lastActualOutput ? (
                          <HighlightedCode
                            code={JSON.stringify(tc.lastActualOutput, null, 2)}
                            language="json"
                            surface="auto"
                          />
                        ) : (
                          <span className="text-[#5E5E6E] dark:text-[#9A9AB0]">Not run in session</span>
                        )}
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

                  {tc.runHistory && tc.runHistory.length > 0 && (
                    <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] px-3 py-2 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                      Run History: {tc.runHistory.slice(0, 3).map((rh) => `${rh.passed ? 'PASS' : 'FAIL'}@${rh.testedVersion} (${rh.actualStatus})`).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })
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
                    items={[ex.artifactType, ex.sourceTrigger, ex.versionUsed, ex.environment, ex.executedAt]}
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
                      {activeExec.errorCode ? ` · ${activeExec.errorCode}` : ''}
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
                  <div className="rounded-xl border border-white/10 bg-[#0D1021] p-3">
                    <div className="font-mono text-[11px] text-[#9A9AB0] mb-1">Input Payload</div>
                    <pre className="font-mono text-[11px] overflow-x-auto">
                      <HighlightedCode
                        code={JSON.stringify(activeExec.inputPayload, null, 2)}
                        language="json"
                        surface="dark"
                      />
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0D1021] p-3">
                    <div className="font-mono text-[11px] text-[#9A9AB0] mb-1">Final Decision Output</div>
                    <pre className="font-mono text-[11px] overflow-x-auto">
                      <HighlightedCode
                        code={JSON.stringify(activeExec.finalOutput, null, 2)}
                        language="json"
                        surface="dark"
                      />
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
    const visibleArtifacts = allArtifacts.filter(
      (entry) => versionTypeFilter === 'all' || entry.type === versionTypeFilter
    );

    const requestPromote = (entry: UnifiedArtifactEntry, targetEnv: DecisionEnvironment) => {
      if (targetEnv === entry.spec.environment) return;
      if (targetEnv === 'production') {
        setPromoteApprovalChecked(false);
        setPromoteConfirm({ entry, targetEnv });
        return;
      }
      const check = evaluatePublishGovernancePolicy(
        entry.type,
        entry.spec,
        targetEnv,
        workspaceRole,
        settings,
        collections
      );
      if (!check.allowed) {
        setVersionNotice({
          kind: 'err',
          text: `Cannot promote "${entry.spec.name}" to ${targetEnv}: ${check.reasons.join(' ')}`,
        });
        return;
      }
      persistArtifactUpdate(
        entry.type,
        {
          ...entry.spec,
          environment: targetEnv,
          updatedAt: 'Just now',
        } as DecisionArtifactSpec,
        `Promoted ${entry.label} "${entry.spec.name}" (${entry.spec.version}) to ${targetEnv}`
      );
      setVersionNotice({
        kind: 'ok',
        text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to ${targetEnv}.`,
      });
    };

    const confirmProductionPromote = () => {
      if (!promoteConfirm) return;
      const { entry, targetEnv } = promoteConfirm;
      const check = evaluatePublishGovernancePolicy(
        entry.type,
        entry.spec,
        targetEnv,
        workspaceRole,
        settings,
        collections,
        promoteApprovalChecked
      );
      if (!check.allowed) {
        setVersionNotice({
          kind: 'err',
          text: `Production promotion blocked: ${check.reasons.join(' ')}`,
        });
        return;
      }
      const nextStatus = isPublishedSnapshotStatus(entry.spec.status) ? 'Promoted' : 'Published';
      persistArtifactUpdate(
        entry.type,
        {
          ...entry.spec,
          environment: targetEnv,
          status: nextStatus,
          reviewApproval: settings.requireControlApprovalForProd
            ? {
                approved: promoteApprovalChecked,
                reviewerLabel: `${workspaceRole} (Local Gate)`,
                approvedAt: 'Just now',
                note: `Promoted ${entry.spec.version} to production`,
                controlRequired: true,
              }
            : entry.spec.reviewApproval,
          updatedAt: 'Just now',
        } as DecisionArtifactSpec,
        `Promoted ${entry.label} "${entry.spec.name}" (${entry.spec.version}) to production`
      );
      setPromoteConfirm(null);
      setVersionNotice({
        kind: 'ok',
        text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to production cleanly.`,
      });
    };

    const confirmRollback = () => {
      if (!rollbackConfirm) return;
      const { entry, snapshot } = rollbackConfirm;
      const { rolledBack, error } = rollbackArtifactToSnapshot(
        entry.type,
        entry.spec,
        snapshot.version,
        `${workspaceRole} (Local Rollback)`
      );
      if (!rolledBack) {
        setRollbackConfirm(null);
        setVersionNotice({
          kind: 'err',
          text: error || 'Rollback failed snapshot verification.',
        });
        return;
      }
      persistArtifactUpdate(
        entry.type,
        rolledBack,
        `Rolled back ${entry.label} "${entry.spec.name}" to ${snapshot.version}`
      );
      setRollbackConfirm(null);
      setVersionNotice({
        kind: 'ok',
        text: `Restored full ${entry.label} specification from snapshot ${snapshot.version} while preserving immutable version history.`,
      });
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div>
            <h3 className="font-display text-sm font-semibold">
              Immutable Versions, SHA-256 Verification, Diff &amp; Rollback (All 5 Artifact Types)
            </h3>
            <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              Published snapshots store canonical SHA-256 hashes and serialized specs in local browser storage. Rollback restores full logic &amp; preserves history; promotions obey local governance gates.
            </p>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-1.5">
            {(
              [
                { id: 'all', label: `All (${allArtifacts.length})` },
                { id: 'rule', label: `Rules (${rules.length})` },
                { id: 'table', label: `Tables (${tables.length})` },
                { id: 'ruleset', label: `Rulesets (${rulesets.length})` },
                { id: 'chain', label: `Chains (${chains.length})` },
                { id: 'scorecard', label: `Scorecards (${scorecards.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setVersionTypeFilter(f.id)}
                className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
                  versionTypeFilter === f.id
                    ? 'bg-[#6252E8] text-white'
                    : 'border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {versionNotice && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold ${
              versionNotice.kind === 'err'
                ? 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-200'
                : 'border-[#6252E8]/35 bg-[#6252E8]/10'
            }`}
          >
            <span>{versionNotice.text}</span>
            <button type="button" onClick={() => setVersionNotice(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {visibleArtifacts.map((entry) => {
          const currentHash = computeArtifactSpecHash(entry.type, entry.spec);
          return (
            <div
              key={entry.spec.id}
              className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{entry.spec.name}</div>
                  <StatusText
                    items={[
                      entry.label,
                      entry.spec.version,
                      entry.spec.status,
                      `Env: ${entry.spec.environment}`,
                    ]}
                    accentLast
                  />
                  <div className="mt-1 font-mono text-[10px] text-[#5E5E6E] dark:text-[#9A9AB0] truncate">
                    Live Spec Digest: {currentHash}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['development', 'staging', 'production'] as DecisionEnvironment[]).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => requestPromote(entry, env)}
                      className={`min-h-[36px] px-3 rounded-lg text-[11px] font-semibold capitalize ${
                        entry.spec.environment === env
                          ? 'bg-[#6252E8] text-white'
                          : 'border border-[#101014]/15 dark:border-white/15'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {entry.spec.versionHistory.length === 0 ? (
                <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] px-3 py-2 text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0] font-mono">
                  No immutable published snapshots recorded yet (Draft / pre-release).
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-[#101014]/10 dark:border-white/10">
                  {entry.spec.versionHistory.map((snap, idx) => {
                    const integrity = verifySnapshotIntegrity(snap);
                    const nextOlder = entry.spec.versionHistory[idx + 1];
                    return (
                      <div
                        key={snap.version}
                        className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] p-3 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-mono font-semibold text-[#6252E8] dark:text-[#B894FF] flex flex-wrap items-center gap-2">
                              <span>
                                {snap.version} · {snap.environment} · {snap.status}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  integrity.valid
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-500'
                                }`}
                              >
                                [{integrity.valid ? `Hash OK (${integrity.algorithm})` : integrity.reason}]
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-[#5E5E6E] dark:text-[#9A9AB0] truncate">
                              {snap.snapshotHash}
                            </div>
                            <div className="text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                              {snap.releaseNotes || snap.summary} ({snap.publishedBy}, {snap.publishedAt})
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {nextOlder && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDiffSelection({
                                    artifactId: entry.spec.id,
                                    snapA: nextOlder,
                                    snapB: snap,
                                  })
                                }
                                className="min-h-[36px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <GitCompare className="w-3.5 h-3.5 text-[#6252E8]" aria-hidden="true" />
                                <span>Diff vs {nextOlder.version}</span>
                              </button>
                            )}
                            {snap.version !== entry.spec.version && snap.serializedSpec && (
                              <button
                                type="button"
                                onClick={() => setRollbackConfirm({ entry, snapshot: snap })}
                                className="min-h-[36px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Rollback</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {diffSelection?.artifactId === entry.spec.id &&
                          diffSelection.snapB.version === snap.version && (() => {
                            const diffReport = compareVersionSnapshots(
                              diffSelection.snapA,
                              diffSelection.snapB
                            );
                            return (
                              <div className="rounded-lg border border-[#6252E8]/35 bg-white dark:bg-[#101126] p-3 space-y-1.5 text-[11px] font-mono">
                                <div className="flex items-center justify-between font-semibold text-[#6252E8] dark:text-[#B894FF]">
                                  <span>
                                    Canonical Diff: {diffSelection.snapA.version} → {diffSelection.snapB.version}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setDiffSelection(null)}
                                    className="underline"
                                  >
                                    Close Diff
                                  </button>
                                </div>
                                {diffReport.changes.length === 0 ? (
                                  <div className="text-[#5E5E6E] dark:text-[#9A9AB0]">
                                    No structural spec body differences (metadata/environment change only).
                                  </div>
                                ) : (
                                  diffReport.changes.map((diff) => (
                                    <div key={diff.key} className="space-y-0.5 pt-1 border-t border-[#101014]/10 dark:border-white/10">
                                      <div className="font-semibold text-[#101014] dark:text-white">
                                        {diff.key}:
                                      </div>
                                      <div className="text-red-600 dark:text-red-300 truncate">
                                        - {diff.before}
                                      </div>
                                      <div className="text-emerald-600 dark:text-emerald-300 truncate">
                                        + {diff.after}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Rollback Confirmation BottomSheet */}
        <BottomSheet
          open={Boolean(rollbackConfirm)}
          onClose={() => setRollbackConfirm(null)}
          title={
            rollbackConfirm
              ? `Rollback "${rollbackConfirm.entry.spec.name}" to ${rollbackConfirm.snapshot.version}?`
              : 'Confirm Rollback'
          }
          subtitle="Restores full serialized decision logic from immutable snapshot while keeping version history intact."
        >
          {rollbackConfirm && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] p-3 font-mono space-y-1">
                <div>Snapshot Hash: {rollbackConfirm.snapshot.snapshotHash}</div>
                <div>Target Environment: {rollbackConfirm.snapshot.environment}</div>
                <div>Published Summary: {rollbackConfirm.snapshot.summary}</div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRollbackConfirm(null)}
                  className="min-h-[44px] rounded-xl border border-[#101014]/15 dark:border-white/15 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRollback}
                  className="min-h-[44px] rounded-xl bg-[#6252E8] text-white font-semibold"
                >
                  Confirm Full Rollback
                </button>
              </div>
            </div>
          )}
        </BottomSheet>

        {/* Production Promotion Governance Confirmation BottomSheet */}
        <BottomSheet
          open={Boolean(promoteConfirm)}
          onClose={() => setPromoteConfirm(null)}
          title={
            promoteConfirm
              ? `Promote "${promoteConfirm.entry.spec.name}" to Production?`
              : 'Confirm Production Promotion'
          }
          subtitle="Runs full production validation, test-evidence freshness, and SOPIN Control checks."
        >
          {promoteConfirm && (
            <div className="space-y-4 text-xs">
              {(() => {
                const check = evaluatePublishGovernancePolicy(
                  promoteConfirm.entry.type,
                  promoteConfirm.entry.spec,
                  'production',
                  workspaceRole,
                  settings,
                  collections,
                  promoteApprovalChecked
                );
                return !check.allowed ? (
                  <div className="rounded-xl border border-red-500/45 bg-red-500/10 p-3 text-red-700 dark:text-red-200 space-y-1">
                    <div className="font-semibold inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                      <span>Promotion Blocked</span>
                    </div>
                    {check.reasons.map((r, i) => (
                      <div key={i} className="font-mono text-[11px]">
                        • {r}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-200 font-semibold">
                    All production validation, test freshness, and RBAC checks passed cleanly.
                  </div>
                );
              })()}

              {settings.requireControlApprovalForProd && (
                <label className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/[0.06] p-3 flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteApprovalChecked}
                    onChange={(e) => setPromoteApprovalChecked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>SOPIN Control Approval (Local Gate):</strong> Confirm production release review as{' '}
                    <span className="font-mono">{workspaceRole}</span>.
                  </span>
                </label>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPromoteConfirm(null)}
                  className="min-h-[44px] rounded-xl border border-[#101014]/15 dark:border-white/15 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmProductionPromote}
                  className="min-h-[44px] rounded-xl bg-[#6252E8] text-white font-semibold"
                >
                  Confirm Production Promotion
                </button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    );
  }

  // 10. SETTINGS & GOVERNANCE BOUNDARIES
  const currentEditPerm = checkEditPermission(workspaceRole, settings);
  const currentPubRoleOk = evaluatePublishGovernancePolicy(
    'rule',
    rules[0] ?? ({ id: 'tmp', name: 'tmp', testCases: [], versionHistory: [] } as unknown as RuleSpec),
    'staging',
    workspaceRole,
    settings
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
            <span>SOPIN Decisions Governance &amp; Safety Policies</span>
          </div>
          <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF]">
            Active Role: {workspaceRole} ({currentEditPerm.allowed ? 'Can Edit' : 'Read-Only'})
          </span>
        </div>

        {(
          [
            {
              key: 'requireTestPassBeforePublish' as const,
              label: 'Require Fresh Regression Tests Before Publish Gate',
              desc: 'Blocks publishing if tests are missing, failing, or stale against edited draft specs.',
            },
            {
              key: 'requireControlApprovalForProd' as const,
              label: 'Require SOPIN Control Approval for Production Promotion',
              desc: 'Requires explicit local Control review sign-off checkbox before production publish/promote.',
            },
            {
              key: 'strictInputSchemaValidation' as const,
              label: 'Strict Input Schema Validation',
              desc: 'Rejects malformed or missing required payloads cleanly with deterministic diagnostics.',
            },
            {
              key: 'restrictExpressionsToSafeSubset' as const,
              label: 'Restricted Expression Sandbox Mode',
              desc: 'Allows only pure deterministic arithmetic/comparison ASTs (zero eval/Function).',
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

        {currentPubRoleOk.reasons.some((r) => r.includes('Publish Authority')) && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 font-mono">
            Active role "{workspaceRole}" currently cannot publish under "{settings.allowedPublishersRole}" policy.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-2 text-xs">
        <div className="font-mono text-[#B894FF] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Local Prototype Simulation vs Planned Backend Architecture</span>
        </div>
        <p className="text-[#C5C5D6] leading-relaxed">
          Running TypeScript deterministic local rule evaluation, synchronous canonical SHA-256 snapshot verification, local governance policy simulation, and browser workspace persistence. Attribution labels (publishedBy / approvedBy) represent local prototype placeholders until server-side identity, RBAC, PostgreSQL immutable version storage, CEL sandbox, and Temporal workers are connected.
        </p>
      </div>
    </div>
  );
};
