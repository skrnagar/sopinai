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
import { AuditEvent } from '../../app/types';
import {
  DecisionApprovalPurpose,
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
  applyGovernedDecisionOperationToSlice,
  checkApprovalPermission,
  checkEditPermission,
  checkPublishPermission,
  checkTestEvidenceFreshness,
  compareVersionSnapshots,
  computeArtifactSpecHash,
  evaluatePublishGovernancePolicy,
  GovernedDecisionRequest,
  inspectApprovalFreshness,
  performGovernedApprove,
  performGovernedPromote,
  performGovernedRollback,
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
  auditLog?: AuditEvent[];
  onUpdateRule: (rule: RuleSpec, note?: string) => void;
  onUpdateTable: (table: DecisionTableSpec, note?: string) => void;
  onUpdateRuleset?: (rs: RulesetSpec, note?: string) => void;
  onUpdateChain?: (chain: RuleChainSpec, note?: string) => void;
  onUpdateScorecard?: (sc: ScorecardSpec, note?: string) => void;
  onGovernedAction?: (
    req: GovernedDecisionRequest
  ) => ReturnType<typeof applyGovernedDecisionOperationToSlice>;
  onUpdateWorkspaceRole?: (role: string) => void;
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
  auditLog = [],
  onUpdateRule,
  onUpdateTable,
  onUpdateRuleset,
  onUpdateChain,
  onUpdateScorecard,
  onGovernedAction,
  onUpdateWorkspaceRole,
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
  const [governanceNote, setGovernanceNote] = useState('');

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

    const editPerm = checkEditPermission(workspaceRole, settings);

    const handleRunSingle = (tc: DecisionTestCase) => {
      if (!activeEntry) return;
      const { updatedCase } = runSingleTestCase(
        activeEntry.type,
        activeEntry.spec.id,
        tc,
        collections
      );
      if (!editPerm.allowed) {
        persistArtifactUpdate(
          activeEntry.type,
          activeEntry.spec,
          `Attempted test evidence update on "${activeEntry.spec.name}"`
        );
        setBatchSummary(
          `Preview only (${updatedCase.lastPassed ? 'PASSED' : 'FAILED'}): cannot persist test evidence because ${editPerm.reasons[0]}`
        );
        return;
      }
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
      if (!editPerm.allowed) {
        persistArtifactUpdate(
          activeEntry.type,
          activeEntry.spec,
          `Attempted batch test evidence update on "${activeEntry.spec.name}"`
        );
        setBatchSummary(
          `Preview only (${res.passedCount} pass, ${res.failedCount} fail): cannot persist suite evidence because ${editPerm.reasons[0]}`
        );
        return;
      }
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
      if (!editPerm.allowed) {
        persistArtifactUpdate(
          activeEntry.type,
          activeEntry.spec,
          `Attempted fixture creation on "${activeEntry.spec.name}"`
        );
        setFixtureErr(editPerm.reasons[0]);
        return;
      }
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
        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="min-h-[44px] px-3 rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm max-w-full"
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
              className="min-h-[44px] px-3.5 rounded-xl border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
              <span>Add Fixture</span>
            </button>
            <button
              type="button"
              onClick={handleRunSuite}
              disabled={activeCases.length === 0}
              className="min-h-[44px] px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>Run Batch Tests ({activeCases.length})</span>
            </button>
          </div>
        </div>

        {activeEntry && freshness && (
          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
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
          <div className="rounded-2xl border border-[#2563EB]/35 bg-white dark:bg-[#0A1226] p-4 space-y-3">
            <div className="text-xs font-semibold">Define Custom Input Fixture &amp; Expected Output</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                aria-label="Test fixture name"
                value={fixtureName}
                onChange={(e) => setFixtureName(e.target.value)}
                className="flex-1 min-w-[200px] min-h-[40px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
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
                className="w-full p-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] font-mono text-xs"
              />
              <textarea
                rows={4}
                aria-label="Fixture expected output JSON"
                value={fixtureExpectedJson}
                onChange={(e) => setFixtureExpectedJson(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] font-mono text-xs"
              />
            </div>
            {fixtureErr && <p className="text-xs text-red-500">{fixtureErr}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddFixtureOpen(false)}
                className="min-h-[38px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFixture}
                className="min-h-[38px] px-4 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
              >
                Save Fixture
              </button>
            </div>
          </div>
        )}

        {batchSummary && (
          <div
            role="status"
            className="rounded-xl border border-[#2563EB]/35 bg-[#2563EB]/10 px-4 py-2.5 text-xs font-semibold"
          >
            {batchSummary}
          </div>
        )}

        <div className="space-y-3">
          {activeCases.length === 0 ? (
            <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-6 text-center text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              No golden test cases registered for this asset yet. Add a fixture above to define regression tests.
            </div>
          ) : (
            activeCases.map((tc) => {
              const isWrongArtifact =
                tc.lastPassed !== undefined &&
                ((tc.testedArtifactId !== undefined && tc.testedArtifactId !== activeEntry?.spec.id) ||
                  (tc.testedArtifactType !== undefined && tc.testedArtifactType !== activeEntry?.type));
              const isStale =
                freshness &&
                tc.lastPassed !== undefined &&
                (isWrongArtifact ||
                  !tc.testedVersion ||
                  tc.testedVersion !== activeEntry?.spec.version ||
                  !tc.testedSpecHash ||
                  tc.testedSpecHash !== freshness.currentSpecHash);
              return (
                <div
                  key={tc.id}
                  className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-semibold">{tc.name}</span>
                      {tc.isBoundaryOrNegative && (
                        <span className="font-mono text-[10px] uppercase text-[#2563EB] dark:text-[#7EC8FF]">
                          · Boundary/Neg
                        </span>
                      )}
                      {isWrongArtifact ? (
                        <span className="font-mono text-[10px] uppercase text-red-600 dark:text-red-300">
                          · Mismatched Artifact ({tc.testedArtifactId ?? 'unknown'})
                        </span>
                      ) : isStale ? (
                        <span className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-300">
                          · Stale ({tc.testedVersion ?? 'unversioned'})
                        </span>
                      ) : null}
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
                        className="min-h-[34px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-[#2563EB]" aria-hidden="true" />
                        <span>Run Case</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] font-mono">
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#060B18] border border-[#05070E]/10 dark:border-white/10 p-2.5">
                      <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Input JSON</div>
                      <pre className="overflow-x-auto">
                        <HighlightedCode
                          code={JSON.stringify(tc.inputJson, null, 2)}
                          language="json"
                          surface="auto"
                        />
                      </pre>
                    </div>
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#060B18] border border-[#05070E]/10 dark:border-white/10 p-2.5">
                      <div className="text-[#5E5E6E] dark:text-[#9A9AB0] mb-1">Expected Output</div>
                      <pre className="overflow-x-auto">
                        <HighlightedCode
                          code={JSON.stringify(tc.expectedOutput, null, 2)}
                          language="json"
                          surface="auto"
                        />
                      </pre>
                    </div>
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#060B18] border border-[#05070E]/10 dark:border-white/10 p-2.5">
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
                    <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-2.5 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5] space-y-0.5">
                      <div className="font-semibold text-[#05070E] dark:text-white">
                        Conditions Evaluated FALSE / Diagnostics:
                      </div>
                      {tc.failedConditions.map((fc, idx) => (
                        <div key={idx}>• {fc}</div>
                      ))}
                    </div>
                  )}

                  {tc.runHistory && tc.runHistory.length > 0 && (
                    <div className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] px-3 py-2 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
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
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0A1226] border border-[#05070E]/10 dark:border-white/10 text-[#5E5E6E] dark:text-[#B5B5C5]'
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
                      ? 'border-[#2563EB] bg-[#2563EB]/10 dark:bg-[#2563EB]/20'
                      : 'border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{ex.artifactName}</span>
                    <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
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
              <div className="rounded-2xl border border-[#05070E]/15 dark:border-white/15 bg-[#0A1226] text-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-[#7EC8FF]">
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
                  <div className="rounded-xl border border-white/10 bg-[#060B18] p-3">
                    <div className="font-mono text-[11px] text-[#9A9AB0] mb-1">Input Payload</div>
                    <pre className="font-mono text-[11px] overflow-x-auto">
                      <HighlightedCode
                        code={JSON.stringify(activeExec.inputPayload, null, 2)}
                        language="json"
                        surface="dark"
                      />
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#060B18] p-3">
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
                    <span className="font-mono text-[#7EC8FF]">Selected Table Row(s): </span>
                    <span>{activeExec.matchedTableRows.join(' · ')}</span>
                  </div>
                )}

                {activeExec.executionTrace && activeExec.executionTrace.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-mono text-[11px] text-[#A4A4B5]">Deterministic Execution Trace</div>
                    {activeExec.executionTrace.map((st) => (
                      <div
                        key={st.stepIndex}
                        className="rounded-lg border border-white/10 bg-[#05070E] px-3 py-2 text-[11px] font-mono flex items-start justify-between gap-2"
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

                <div className="rounded-xl border border-white/10 bg-[#05070E] p-3 font-mono text-[11px] text-[#C5C5D6] overflow-x-auto">
                  Gateway API Invocation (Target): POST /v1/decisions/{activeExec.artifactId}/evaluate?version={activeExec.versionUsed}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-6 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
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
    const decisionAuditEvents = auditLog.filter(
      (ev) => Boolean(ev.operation || ev.artifactType)
    );
    const approvalPerm = checkApprovalPermission(workspaceRole, settings);

    const recordSheetApproval = (
      entry: UnifiedArtifactEntry,
      targetEnvironment: DecisionEnvironment,
      purpose: DecisionApprovalPurpose,
      rollbackTargetVersion?: string
    ) => {
      const note =
        governanceNote.trim() ||
        (purpose === 'rollback'
          ? `Rollback approval to ${rollbackTargetVersion ?? entry.spec.version}`
          : `${purpose} approval for ${entry.spec.version}`);

      if (onGovernedAction) {
        const res = onGovernedAction({
          operation: 'approve',
          artifactType: entry.type,
          artifactId: entry.spec.id,
          targetEnvironment,
          purpose,
          decision: 'approved',
          note,
          rollbackTargetVersion,
        });
        if (!res.allowed || !res.updatedSpec) {
          setVersionNotice({
            kind: 'err',
            text: `Approval blocked: ${res.reasons.join(' ')}`,
          });
          return;
        }
        if (promoteConfirm && promoteConfirm.entry.spec.id === entry.spec.id) {
          setPromoteConfirm({
            ...promoteConfirm,
            entry: { ...entry, spec: res.updatedSpec },
          });
        }
        if (rollbackConfirm && rollbackConfirm.entry.spec.id === entry.spec.id) {
          setRollbackConfirm({
            ...rollbackConfirm,
            entry: { ...entry, spec: res.updatedSpec },
          });
        }
        setVersionNotice({
          kind: 'ok',
          text: `Recorded bound ${purpose} approval (${res.approvalRecord?.id ?? 'local'}) for ${entry.spec.name} ${entry.spec.version}.`,
        });
        return;
      }

      const res = performGovernedApprove({
        type: entry.type,
        spec: entry.spec,
        targetEnvironment,
        purpose,
        decision: 'approved',
        workspaceRole,
        settings,
        collections,
        note,
        rollbackTargetVersion,
      });
      if (!res.allowed || !res.updatedSpec) {
        setVersionNotice({ kind: 'err', text: `Approval blocked: ${res.reasons.join(' ')}` });
        return;
      }
      persistArtifactUpdate(entry.type, res.updatedSpec, res.auditEvent.action);
      if (promoteConfirm && promoteConfirm.entry.spec.id === entry.spec.id) {
        setPromoteConfirm({ ...promoteConfirm, entry: { ...entry, spec: res.updatedSpec } });
      }
      if (rollbackConfirm && rollbackConfirm.entry.spec.id === entry.spec.id) {
        setRollbackConfirm({ ...rollbackConfirm, entry: { ...entry, spec: res.updatedSpec } });
      }
      setVersionNotice({ kind: 'ok', text: res.auditEvent.action });
    };

    const requestPromote = (entry: UnifiedArtifactEntry, targetEnv: DecisionEnvironment) => {
      if (targetEnv === entry.spec.environment) return;
      if (targetEnv === 'production') {
        setGovernanceNote('');
        setPromoteConfirm({ entry, targetEnv });
        return;
      }
      if (onGovernedAction) {
        const res = onGovernedAction({
          operation: 'promote',
          artifactType: entry.type,
          artifactId: entry.spec.id,
          targetEnvironment: targetEnv,
        });
        if (!res.allowed) {
          setVersionNotice({
            kind: 'err',
            text: `Cannot promote "${entry.spec.name}" to ${targetEnv}: ${res.reasons.join(' ')}`,
          });
          return;
        }
        setVersionNotice({
          kind: 'ok',
          text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to ${targetEnv}.`,
        });
        return;
      }

      const res = performGovernedPromote({
        type: entry.type,
        spec: entry.spec,
        targetEnvironment: targetEnv,
        workspaceRole,
        settings,
        collections,
      });
      if (!res.allowed || !res.updatedSpec) {
        setVersionNotice({
          kind: 'err',
          text: `Cannot promote "${entry.spec.name}" to ${targetEnv}: ${res.reasons.join(' ')}`,
        });
        return;
      }
      persistArtifactUpdate(entry.type, res.updatedSpec, res.auditEvent.action);
      setVersionNotice({
        kind: 'ok',
        text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to ${targetEnv}.`,
      });
    };

    const confirmProductionPromote = () => {
      if (!promoteConfirm) return;
      const { entry, targetEnv } = promoteConfirm;
      if (onGovernedAction) {
        const res = onGovernedAction({
          operation: 'promote',
          artifactType: entry.type,
          artifactId: entry.spec.id,
          targetEnvironment: targetEnv,
          note: governanceNote.trim() || undefined,
        });
        if (!res.allowed) {
          setVersionNotice({
            kind: 'err',
            text: `Production promotion blocked: ${res.reasons.join(' ')}`,
          });
          return;
        }
        setPromoteConfirm(null);
        setGovernanceNote('');
        setVersionNotice({
          kind: 'ok',
          text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to production cleanly.`,
        });
        return;
      }

      const res = performGovernedPromote({
        type: entry.type,
        spec: entry.spec,
        targetEnvironment: targetEnv,
        workspaceRole,
        settings,
        collections,
        note: governanceNote.trim() || undefined,
      });
      if (!res.allowed || !res.updatedSpec) {
        setVersionNotice({
          kind: 'err',
          text: `Production promotion blocked: ${res.reasons.join(' ')}`,
        });
        return;
      }
      persistArtifactUpdate(entry.type, res.updatedSpec, res.auditEvent.action);
      setPromoteConfirm(null);
      setGovernanceNote('');
      setVersionNotice({
        kind: 'ok',
        text: `Promoted "${entry.spec.name}" (${entry.spec.version}) to production cleanly.`,
      });
    };

    const confirmRollback = () => {
      if (!rollbackConfirm) return;
      const { entry, snapshot } = rollbackConfirm;
      if (onGovernedAction) {
        const res = onGovernedAction({
          operation: 'rollback',
          artifactType: entry.type,
          artifactId: entry.spec.id,
          targetVersion: snapshot.version,
          note: governanceNote.trim() || undefined,
        });
        if (!res.allowed) {
          setVersionNotice({
            kind: 'err',
            text: `Rollback blocked: ${res.reasons.join(' ')}`,
          });
          return;
        }
        setRollbackConfirm(null);
        setGovernanceNote('');
        setVersionNotice({
          kind: 'ok',
          text: `Restored full ${entry.label} specification from snapshot ${snapshot.version} while preserving immutable version history and clearing stale approvals.`,
        });
        return;
      }

      const res = performGovernedRollback({
        type: entry.type,
        spec: entry.spec,
        targetVersion: snapshot.version,
        workspaceRole,
        settings,
        note: governanceNote.trim() || undefined,
      });
      if (!res.allowed || !res.updatedSpec) {
        setVersionNotice({
          kind: 'err',
          text: `Rollback blocked: ${res.reasons.join(' ')}`,
        });
        return;
      }
      persistArtifactUpdate(entry.type, res.updatedSpec, res.auditEvent.action);
      setRollbackConfirm(null);
      setGovernanceNote('');
      setVersionNotice({
        kind: 'ok',
        text: `Restored full ${entry.label} specification from snapshot ${snapshot.version} while preserving immutable version history and clearing stale approvals.`,
      });
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
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
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E]'
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
                : 'border-[#2563EB]/35 bg-[#2563EB]/10'
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
          const prodApproval = inspectApprovalFreshness(
            entry.type,
            entry.spec,
            'production',
            'production-promotion'
          );
          const pubApproval = inspectApprovalFreshness(
            entry.type,
            entry.spec,
            'production',
            'publication'
          );
          const approvalSummary = prodApproval.valid
            ? `Prod Promotion Approved (${prodApproval.matchedApproval?.id ?? 'bound'})`
            : pubApproval.valid
            ? `Publication Approved (${entry.spec.version})`
            : prodApproval.status === 'stale-spec' || prodApproval.status === 'stale-version'
            ? 'Prior Approval Stale'
            : prodApproval.status === 'rejected'
            ? 'Approval Rejected'
            : 'No Prod Approval';
          return (
            <div
              key={entry.spec.id}
              className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3"
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
                      approvalSummary,
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
                          ? 'bg-[#2563EB] text-white'
                          : 'border border-[#05070E]/15 dark:border-white/15'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {entry.spec.versionHistory.length === 0 ? (
                <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] px-3 py-2 text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0] font-mono">
                  No immutable published snapshots recorded yet (Draft / pre-release).
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-[#05070E]/10 dark:border-white/10">
                  {entry.spec.versionHistory.map((snap, idx) => {
                    const integrity = verifySnapshotIntegrity(snap);
                    const nextOlder = entry.spec.versionHistory[idx + 1];
                    return (
                      <div
                        key={snap.version}
                        className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-mono font-semibold text-[#2563EB] dark:text-[#7EC8FF] flex flex-wrap items-center gap-2">
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
                                className="min-h-[36px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <GitCompare className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                                <span>Diff vs {nextOlder.version}</span>
                              </button>
                            )}
                            {snap.version !== entry.spec.version && snap.serializedSpec && (
                              <button
                                type="button"
                                onClick={() => setRollbackConfirm({ entry, snapshot: snap })}
                                className="min-h-[36px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1"
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
                              <div className="rounded-lg border border-[#2563EB]/35 bg-white dark:bg-[#0A1226] p-3 space-y-1.5 text-[11px] font-mono">
                                <div className="flex items-center justify-between font-semibold text-[#2563EB] dark:text-[#7EC8FF]">
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
                                    <div key={diff.key} className="space-y-0.5 pt-1 border-t border-[#05070E]/10 dark:border-white/10">
                                      <div className="font-semibold text-[#05070E] dark:text-white">
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

        <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
              <span>Recent Decisions Governance Audit Trail ({decisionAuditEvents.length})</span>
            </div>
            <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
              Simulated Local Audit Records
            </span>
          </div>
          {decisionAuditEvents.length === 0 ? (
            <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
              No lifecycle save, approval, publish, promotion, or rollback events recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {decisionAuditEvents.slice(0, 10).map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 text-xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#05070E] dark:text-white">{ev.action}</span>
                    <span
                      className={`font-mono text-[11px] font-semibold shrink-0 ${
                        ev.outcome === 'Blocked' || ev.outcome === 'Rejected'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#2563EB] dark:text-[#7EC8FF]'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </div>
                  <StatusText
                    items={[
                      ev.actor,
                      ev.target,
                      ...(ev.previousVersion && ev.resultingVersion
                        ? [`${ev.previousVersion} → ${ev.resultingVersion}`]
                        : ev.previousVersion
                        ? [ev.previousVersion]
                        : []),
                      ...(ev.targetEnvironment ? [ev.targetEnvironment] : []),
                      ev.timestamp,
                    ]}
                  />
                  {(ev.specHash || ev.approvalId || ev.reason) && (
                    <div className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] space-y-0.5">
                      {(ev.specHash || ev.approvalId) && (
                        <div className="truncate">
                          {ev.specHash ? `Digest ${ev.specHash.slice(0, 20)}…` : ''}
                          {ev.specHash && ev.approvalId ? ' · ' : ''}
                          {ev.approvalId ? `Approval ${ev.approvalId}` : ''}
                        </div>
                      )}
                      {ev.reason && <div>{ev.reason}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rollback Confirmation BottomSheet */}
        <BottomSheet
          open={Boolean(rollbackConfirm)}
          onClose={() => setRollbackConfirm(null)}
          title={
            rollbackConfirm
              ? `Rollback "${rollbackConfirm.entry.spec.name}" to ${rollbackConfirm.snapshot.version}?`
              : 'Confirm Rollback'
          }
          subtitle="Restores full serialized decision logic from immutable snapshot, preserves history, and clears stale approvals."
        >
          {rollbackConfirm && (() => {
            const { entry, snapshot } = rollbackConfirm;
            const rollbackPerm = checkPublishPermission(workspaceRole, settings, 'rollback');
            const prodTouching =
              entry.spec.environment === 'production' || snapshot.environment === 'production';
            const rollbackEnv: DecisionEnvironment = prodTouching
              ? 'production'
              : snapshot.environment;
            const rollbackApproval = inspectApprovalFreshness(
              entry.type,
              entry.spec,
              rollbackEnv,
              'rollback'
            );
            const needsProdRollbackApproval =
              prodTouching && settings.requireControlApprovalForProd && !rollbackApproval.valid;
            const rollbackBlocked = !rollbackPerm.allowed || needsProdRollbackApproval;

            return (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] p-3 font-mono space-y-1">
                  <div>
                    Transition: {entry.spec.version} ({entry.spec.environment}) → {snapshot.version} ({snapshot.environment})
                  </div>
                  <div className="truncate">Snapshot Hash: {snapshot.snapshotHash}</div>
                  <div>Published Summary: {snapshot.releaseNotes || snapshot.summary}</div>
                  <div>Simulated Actor Role: {workspaceRole}</div>
                </div>

                {rollbackBlocked && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/45 bg-red-500/10 p-3 text-red-700 dark:text-red-200 space-y-1"
                  >
                    <div className="font-semibold">Rollback Governance Gate</div>
                    {!rollbackPerm.allowed && (
                      <div className="font-mono text-[11px]">• {rollbackPerm.reasons[0]}</div>
                    )}
                    {needsProdRollbackApproval && (
                      <div className="font-mono text-[11px]">
                        • {rollbackApproval.reason || 'Bound rollback approval is required for production rollback.'}
                      </div>
                    )}
                  </div>
                )}

                {prodTouching && settings.requireControlApprovalForProd && (
                  <div className="rounded-xl border border-[#2563EB]/35 bg-[#2563EB]/[0.06] p-3 space-y-2">
                    <div className="font-semibold">
                      SOPIN Control Rollback Approval (Local Prototype Gate)
                    </div>
                    <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                      {rollbackApproval.valid
                        ? `Approved (${rollbackApproval.matchedApproval?.id}) by ${rollbackApproval.matchedApproval?.reviewerLabel}`
                        : rollbackApproval.reason}
                    </div>
                    {!rollbackApproval.valid && (
                      <button
                        type="button"
                        onClick={() =>
                          recordSheetApproval(entry, 'production', 'rollback', snapshot.version)
                        }
                        className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                          approvalPerm.allowed
                            ? 'bg-[#05070E] dark:bg-white text-white dark:text-[#05070E]'
                            : 'border border-[#05070E]/15 dark:border-white/15 text-[#5E5E6E] dark:text-[#A4A4B5]'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>
                          Record Bound Rollback Approval as {workspaceRole} (Simulated)
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="rb-note-input" className="block text-xs font-semibold mb-1">
                    Rollback Reason / Audit Note
                  </label>
                  <input
                    id="rb-note-input"
                    type="text"
                    value={governanceNote}
                    onChange={(e) => setGovernanceNote(e.target.value)}
                    placeholder={`Restore ${snapshot.version} baseline`}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRollbackConfirm(null)}
                    className="min-h-[44px] rounded-xl border border-[#05070E]/15 dark:border-white/15 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRollback}
                    className={`min-h-[44px] rounded-xl font-semibold ${
                      rollbackBlocked
                        ? 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200'
                        : 'bg-[#2563EB] text-white'
                    }`}
                  >
                    {rollbackBlocked ? 'Attempt Rollback (Blocked)' : 'Confirm Full Rollback'}
                  </button>
                </div>
              </div>
            );
          })()}
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
          subtitle="Requires bound production-promotion approval, fresh passing test evidence, and SOPIN Control publish authority."
        >
          {promoteConfirm && (() => {
            const { entry } = promoteConfirm;
            const currentHash = computeArtifactSpecHash(entry.type, entry.spec);
            const check = evaluatePublishGovernancePolicy(
              entry.type,
              entry.spec,
              'production',
              workspaceRole,
              settings,
              collections,
              { purpose: 'production-promotion' }
            );
            const promoApproval = inspectApprovalFreshness(
              entry.type,
              entry.spec,
              'production',
              'production-promotion'
            );

            return (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] p-3 font-mono space-y-1">
                  <div>
                    Promotion: {entry.spec.version} ({entry.spec.environment} → production)
                  </div>
                  <div className="truncate">Canonical SHA-256: {currentHash}</div>
                  <div>Simulated Actor Role: {workspaceRole}</div>
                </div>

                {!check.allowed ? (
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
                    All production validation, test freshness, bound approval, and RBAC checks passed cleanly.
                  </div>
                )}

                {settings.requireControlApprovalForProd && (
                  <div className="rounded-xl border border-[#2563EB]/35 bg-[#2563EB]/[0.06] p-3 space-y-2">
                    <div className="font-semibold">
                      SOPIN Control Production Promotion Approval (Separate from Publication Approval)
                    </div>
                    <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                      {promoApproval.valid
                        ? `Bound to ${entry.spec.version} · ${promoApproval.matchedApproval?.id} · ${promoApproval.matchedApproval?.reviewerLabel}`
                        : promoApproval.reason}
                    </div>
                    {!promoApproval.valid && (
                      <button
                        type="button"
                        onClick={() =>
                          recordSheetApproval(entry, 'production', 'production-promotion')
                        }
                        className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                          approvalPerm.allowed
                            ? 'bg-[#05070E] dark:bg-white text-white dark:text-[#05070E]'
                            : 'border border-[#05070E]/15 dark:border-white/15 text-[#5E5E6E] dark:text-[#A4A4B5]'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>
                          Record Bound Production Promotion Approval as {workspaceRole} (Simulated)
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="promo-note-input" className="block text-xs font-semibold mb-1">
                    Promotion Audit Note
                  </label>
                  <input
                    id="promo-note-input"
                    type="text"
                    value={governanceNote}
                    onChange={(e) => setGovernanceNote(e.target.value)}
                    placeholder={`Promote ${entry.spec.version} to production`}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPromoteConfirm(null)}
                    className="min-h-[44px] rounded-xl border border-[#05070E]/15 dark:border-white/15 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmProductionPromote}
                    className={`min-h-[44px] rounded-xl font-semibold ${
                      check.allowed
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200'
                    }`}
                  >
                    {check.allowed
                      ? 'Confirm Production Promotion'
                      : 'Attempt Promotion (Blocked)'}
                  </button>
                </div>
              </div>
            );
          })()}
        </BottomSheet>
      </div>
    );
  }

  // 10. SETTINGS & GOVERNANCE BOUNDARIES
  const currentEditPerm = checkEditPermission(workspaceRole, settings);
  const currentPubRolePerm = checkPublishPermission(workspaceRole, settings, 'publishing');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            <span>SOPIN Decisions Governance &amp; Safety Policies</span>
          </div>
          <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF]">
            Simulated Role: {workspaceRole} ({currentEditPerm.allowed ? 'Can Edit' : 'Read-Only'} ·{' '}
            {currentPubRolePerm.allowed ? 'Can Publish' : 'No Publish'})
          </span>
        </div>

        {onUpdateWorkspaceRole && (
          <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/[0.05] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div>
              <div className="font-semibold">
                Simulated Workspace Role (Local Prototype Preview)
              </div>
              <p className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                Switch simulated local role to verify edit, approval, publish, promote, and rollback gates. Not production authentication.
              </p>
            </div>
            <select
              aria-label="Simulated workspace role"
              value={workspaceRole}
              onChange={(e) => onUpdateWorkspaceRole(e.target.value)}
              className="min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#05070E] text-xs font-semibold shrink-0"
            >
              <option value="Workspace Owner">Workspace Owner</option>
              <option value="Workspace Admin">Workspace Admin</option>
              <option value="Workspace Maintainer">Workspace Maintainer</option>
              <option value="Automation Architect">Automation Architect</option>
              <option value="Builder">Builder</option>
              <option value="Workspace Member">Workspace Member</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        )}

        {(
          [
            {
              key: 'requireTestPassBeforePublish' as const,
              label: 'Require Fresh Regression Tests Before Publish Gate',
              desc: 'Blocks publishing if tests are missing, failing, or stale against edited draft specs.',
            },
            {
              key: 'requireControlApprovalForProd' as const,
              label: 'Require Bound SOPIN Control Approval for Production',
              desc: 'Requires hash-bound approval scoped separately to publication, production-promotion, or rollback.',
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
              className="rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] p-3 flex items-center justify-between gap-3"
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
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-[#05070E]/15 dark:border-white/15'
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
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
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
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
            >
              <option value="Owner & Admin Only">Owner &amp; Admin Only</option>
              <option value="Workspace Maintainer">Workspace Maintainer</option>
            </select>
          </div>
        </div>

        {!currentPubRolePerm.allowed && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 font-mono">
            {currentPubRolePerm.reasons[0]}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#05070E]/15 dark:border-white/15 bg-[#0A1226] text-white p-4 space-y-2 text-xs">
        <div className="font-mono text-[#7EC8FF] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Local Prototype Simulation vs Planned Backend Architecture</span>
        </div>
        <p className="text-[#C5C5D6] leading-relaxed">
          Running TypeScript deterministic local rule evaluation, synchronous canonical SHA-256 snapshot verification, local governance policy simulation, and browser workspace persistence. Simulated role switching and actor/timestamp labels represent local prototype UX only until server-side identity, RBAC, PostgreSQL immutable version storage, CEL sandbox, and Temporal workers are connected.
        </p>
      </div>
    </div>
  );
};
