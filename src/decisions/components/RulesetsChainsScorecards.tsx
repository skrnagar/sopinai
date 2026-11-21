import React, { useState } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  GitBranch,
  Layers,
  Play,
  Plus,
  Scale,
} from 'lucide-react';
import {
  DecisionExecutionSpec,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import {
  evaluateRuleChainSpec,
  evaluateRulesetSpec,
  evaluateScorecardSpec,
} from '../evaluator';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface RulesetsChainsScorecardsProps {
  mode: 'rulesets' | 'chains' | 'scorecards';
  workspaceId: string;
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
  onSaveRuleset: (rs: RulesetSpec) => void;
  onSaveChain: (chain: RuleChainSpec) => void;
  onSaveScorecard: (sc: ScorecardSpec) => void;
  onRecordExecution: (exec: DecisionExecutionSpec) => void;
}

export const RulesetsChainsScorecards: React.FC<RulesetsChainsScorecardsProps> = ({
  mode,
  workspaceId,
  rules,
  tables,
  rulesets,
  chains,
  scorecards,
  onSaveRuleset,
  onSaveChain,
  onSaveScorecard,
  onRecordExecution,
}) => {
  const [selectedRs, setSelectedRs] = useState<RulesetSpec>(
    () =>
      rulesets[0] ?? {
        id: `rs-${Date.now()}`,
        workspaceId,
        name: 'Default Policy Ruleset',
        description: 'Ordered execution bundle.',
        isDemoData: false,
        executionOrder: 'priority-asc',
        conflictResolution: 'first-match',
        members: rules.slice(0, 1).map((r, i) => ({
          id: `m-${i}`,
          targetType: 'rule',
          targetId: r.id,
          priority: i + 1,
          enabled: true,
        })),
        version: 'v0.1',
        environment: 'development',
        status: 'Draft',
        testCases: [],
        versionHistory: [],
        updatedAt: 'Just now',
      }
  );

  const [selectedChain, setSelectedChain] = useState<RuleChainSpec>(
    () =>
      chains[0] ?? {
        id: `chain-${Date.now()}`,
        workspaceId,
        name: 'Sequential Decision Chain',
        description: 'Passes earlier decision outputs into subsequent stage inputs.',
        isDemoData: false,
        stages: rules.slice(0, 1).map((r, i) => ({
          id: `st-${i}`,
          stepOrder: i + 1,
          label: `Stage 0${i + 1} · ${r.name}`,
          targetType: 'rule',
          targetId: r.id,
          onOutcome: 'continue',
        })),
        version: 'v0.1',
        environment: 'development',
        status: 'Draft',
        updatedAt: 'Just now',
      }
  );

  const [selectedScorecard, setSelectedScorecard] = useState<ScorecardSpec>(
    () =>
      scorecards[0] ?? {
        id: `sc-${Date.now()}`,
        workspaceId,
        name: 'Eligibility Scorecard',
        description: 'Weighted deterministic scorecard.',
        isDemoData: false,
        baseScore: 50,
        criteria: [],
        thresholds: [
          {
            id: 't1',
            minScore: 70,
            maxScore: 200,
            classification: 'Low Risk',
            decisionOutcome: 'approved',
          },
          {
            id: 't2',
            minScore: -100,
            maxScore: 69,
            classification: 'Review Required',
            decisionOutcome: 'manual_review',
          },
        ],
        version: 'v0.1',
        environment: 'development',
        status: 'Draft',
        updatedAt: 'Just now',
      }
  );

  const [sampleJson, setSampleJson] = useState(
    JSON.stringify(
      {
        invoiceAmount: 36000,
        vendorVerified: true,
        duplicateFound: false,
        region: 'IN',
      },
      null,
      2
    )
  );
  const [execResult, setExecResult] = useState<DecisionExecutionSpec | null>(null);
  const [parseErr, setParseErr] = useState('');
  const [notice, setNotice] = useState('');

  const runSimulation = () => {
    setParseErr('');
    try {
      const payload = JSON.parse(sampleJson) as Record<string, unknown>;
      let res: DecisionExecutionSpec | null = null;
      if (mode === 'rulesets') {
        res = evaluateRulesetSpec(selectedRs, payload, rules, tables, 'Simulator');
      } else if (mode === 'chains') {
        res = evaluateRuleChainSpec(
          selectedChain,
          payload,
          rules,
          tables,
          rulesets,
          'Simulator',
          chains
        );
      } else {
        res = evaluateScorecardSpec(selectedScorecard, payload, 'Simulator');
      }
      if (res) {
        setExecResult(res);
        onRecordExecution(res);
      }
    } catch {
      setParseErr('Invalid JSON payload.');
    }
  };

  if (mode === 'rulesets') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex overflow-x-auto no-scrollbar gap-2">
              {rulesets.map((rs) => (
                <button
                  key={rs.id}
                  type="button"
                  onClick={() => setSelectedRs(structuredClone(rs))}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 ${
                    rs.id === selectedRs.id
                      ? 'border-[#6252E8] bg-[#6252E8]/10'
                      : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                  }`}
                >
                  <div className="text-xs font-semibold">{rs.name}</div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                    {rs.members.length} members · {rs.status}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedRs({
                  id: `rs-${Date.now()}`,
                  workspaceId,
                  name: 'New Governance Ruleset',
                  description: 'Ordered execution bundle.',
                  isDemoData: false,
                  executionOrder: 'priority-asc',
                  conflictResolution: 'first-match',
                  members: [],
                  version: 'v0.1',
                  environment: 'development',
                  status: 'Draft',
                  testCases: [],
                  versionHistory: [],
                  updatedAt: 'Just now',
                })
              }
              className="min-h-[44px] px-3.5 rounded-xl bg-[#101014] dark:bg-white text-white dark:text-[#101014] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Ruleset</span>
            </button>
          </div>

          {notice && (
            <div className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-3.5 py-2 text-xs font-medium">
              {notice}
            </div>
          )}

          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3.5">
            <StatusText items={[selectedRs.version, selectedRs.status, selectedRs.isDemoData ? 'Demo Seed' : 'Custom']} accentLast />
            <input
              type="text"
              aria-label="Ruleset name"
              value={selectedRs.name}
              onChange={(e) => setSelectedRs({ ...selectedRs, name: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm font-semibold"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rs-order" className="block text-xs font-semibold mb-1">
                  Execution Order
                </label>
                <select
                  id="rs-order"
                  value={selectedRs.executionOrder}
                  onChange={(e) =>
                    setSelectedRs({
                      ...selectedRs,
                      executionOrder: e.target.value as RulesetSpec['executionOrder'],
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
                >
                  <option value="priority-asc">priority-asc (1 first)</option>
                  <option value="priority-desc">priority-desc (highest first)</option>
                  <option value="sequential">sequential (member order)</option>
                </select>
              </div>
              <div>
                <label htmlFor="rs-conflict" className="block text-xs font-semibold mb-1">
                  Conflict Resolution
                </label>
                <select
                  id="rs-conflict"
                  value={selectedRs.conflictResolution}
                  onChange={(e) =>
                    setSelectedRs({
                      ...selectedRs,
                      conflictResolution: e.target.value as RulesetSpec['conflictResolution'],
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-xs"
                >
                  <option value="first-match">first-match</option>
                  <option value="merge-overrides">merge-overrides</option>
                  <option value="highest-priority">highest-priority</option>
                  <option value="collect-matches">collect-matches</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#101014]/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Ruleset Members</span>
                <div className="flex gap-1.5">
                  {rules[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRs({
                          ...selectedRs,
                          members: [
                            ...selectedRs.members,
                            {
                              id: `m-${Date.now()}`,
                              targetType: 'rule',
                              targetId: rules[0].id,
                              priority: selectedRs.members.length + 1,
                              enabled: true,
                            },
                          ],
                        })
                      }
                      className="min-h-[34px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
                    >
                      + Add Rule
                    </button>
                  )}
                  {tables[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRs({
                          ...selectedRs,
                          members: [
                            ...selectedRs.members,
                            {
                              id: `m-${Date.now()}`,
                              targetType: 'table',
                              targetId: tables[0].id,
                              priority: selectedRs.members.length + 1,
                              enabled: true,
                            },
                          ],
                        })
                      }
                      className="min-h-[34px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
                    >
                      + Add Table
                    </button>
                  )}
                </div>
              </div>

              {selectedRs.members.map((m, idx) => {
                const label =
                  m.targetType === 'rule'
                    ? rules.find((r) => r.id === m.targetId)?.name ?? m.targetId
                    : tables.find((t) => t.id === m.targetId)?.name ?? m.targetId;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] uppercase text-[#6252E8] dark:text-[#B894FF]">
                        P{m.priority} · {m.targetType}
                      </span>
                      <div className="font-semibold truncate">{label}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...selectedRs.members];
                        next[idx] = { ...m, enabled: !m.enabled };
                        setSelectedRs({ ...selectedRs, members: next });
                      }}
                      className={`min-h-[36px] px-3 rounded-lg text-[11px] font-semibold shrink-0 ${
                        m.enabled ? 'bg-[#6252E8] text-white' : 'border border-[#101014]/15 dark:border-white/15'
                      }`}
                    >
                      {m.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSaveRuleset({ ...selectedRs, status: 'Published', updatedAt: 'Just now' });
                  setNotice('Ruleset saved & published to workspace.');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" aria-hidden="true" />
                <span>Save &amp; Publish Ruleset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Simulator */}
        <div className="lg:col-span-5 rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3">
          <div className="font-display text-sm font-semibold">Simulate Ruleset Execution</div>
          <textarea
            rows={5}
            value={sampleJson}
            onChange={(e) => setSampleJson(e.target.value)}
            aria-label="Ruleset simulation input JSON"
            className="w-full p-2.5 rounded-xl border border-white/15 bg-[#101014] font-mono text-xs text-white"
          />
          {parseErr && <p className="text-xs text-red-400">{parseErr}</p>}
          <button
            type="button"
            onClick={runSimulation}
            className="w-full min-h-[44px] rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Execute Ruleset</span>
          </button>
          {execResult && (
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              <div className="font-mono text-[#B894FF]">
                {execResult.status} · Matched: {execResult.matchedRules.join(', ') || 'None'}
              </div>
              <pre className="p-2.5 rounded-lg bg-[#101014] border border-white/10 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(execResult.finalOutput, null, 2)}
              </pre>
              <p className="text-[11px] text-[#C5C5D6]">{execResult.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'chains') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
            <StatusText items={['Rule Chain', selectedChain.version, selectedChain.status]} accentLast />
            <h3 className="font-display text-base font-semibold">{selectedChain.name}</h3>
            <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">{selectedChain.description}</p>

            <div className="space-y-2 pt-2">
              {selectedChain.stages.map((st, idx) => (
                <React.Fragment key={st.id}>
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{st.label}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
                        {st.targetType}
                      </span>
                    </div>
                    {st.conditionField && (
                      <div className="font-mono text-[11px] text-[#101014] dark:text-[#D8D8E6]">
                        Guard: {st.conditionField} {st.conditionOperator} {st.conditionValue}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">On match:</span>
                      <select
                        aria-label={`Stage ${st.stepOrder} outcome policy`}
                        value={st.onOutcome}
                        onChange={(e) => {
                          const next = [...selectedChain.stages];
                          next[idx] = {
                            ...st,
                            onOutcome: e.target.value as typeof st.onOutcome,
                          };
                          setSelectedChain({ ...selectedChain, stages: next });
                        }}
                        className="min-h-[36px] px-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs"
                      >
                        <option value="continue">continue → pass output to next stage</option>
                        <option value="stop-on-match">stop-on-match → return early</option>
                        <option value="branch-to-fallback">branch-to-fallback</option>
                      </select>
                    </div>
                  </div>
                  {idx < selectedChain.stages.length - 1 && (
                    <div className="flex justify-center text-[#6252E8]" aria-hidden="true">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  onSaveChain({ ...selectedChain, updatedAt: 'Just now' });
                  setNotice('Saved Rule Chain sequence.');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] text-white text-xs font-semibold"
              >
                Save Rule Chain
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3">
          <div className="font-display text-sm font-semibold">Execute Sequential Rule Chain</div>
          <textarea
            rows={5}
            value={sampleJson}
            onChange={(e) => setSampleJson(e.target.value)}
            aria-label="Rule chain input JSON"
            className="w-full p-2.5 rounded-xl border border-white/15 bg-[#101014] font-mono text-xs text-white"
          />
          {parseErr && <p className="text-xs text-red-400">{parseErr}</p>}
          <button
            type="button"
            onClick={runSimulation}
            className="w-full min-h-[44px] rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Run Chain</span>
          </button>
          {execResult && (
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              <div
                className={`font-mono ${
                  execResult.status === 'Error' ? 'text-red-400' : 'text-[#B894FF]'
                }`}
              >
                {execResult.status} · {execResult.matchedRules.join(' -> ') || execResult.errorCode || 'Completed'}
              </div>
              {execResult.validationErrors && execResult.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-2 text-[11px] font-mono text-red-200">
                  {execResult.validationErrors.join(' ')}
                </div>
              )}
              {execResult.executionPath && execResult.executionPath.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1 text-[11px] font-mono text-[#D8D8E6]">
                  {execResult.executionPath.map((step, idx) => (
                    <div key={idx}>• {step}</div>
                  ))}
                </div>
              )}
              <pre className="p-2.5 rounded-lg bg-[#101014] border border-white/10 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(execResult.finalOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // mode === 'scorecards'
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <StatusText items={['Weighted Scorecard', selectedScorecard.version, selectedScorecard.status]} accentLast />
            <Scale className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-semibold">{selectedScorecard.name}</h3>
          <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
            Base Score: <strong className="font-mono">{selectedScorecard.baseScore}</strong> · Deterministic weighted factor aggregation
          </p>

          <div className="space-y-2">
            {selectedScorecard.criteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{crit.label}</span>
                  <span className="font-mono text-[#6252E8] dark:text-[#B894FF]">
                    +{crit.pointsIfMatched} / {crit.pointsIfMissed} (w={crit.weight})
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                  <span className="font-mono">
                    {crit.field} {crit.operator} {crit.value}
                  </span>
                  <label className="inline-flex items-center gap-1.5">
                    <span>Weight:</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="5"
                      value={crit.weight}
                      onChange={(e) => {
                        const list = [...selectedScorecard.criteria];
                        list[idx] = { ...crit, weight: Number(e.target.value) || 1 };
                        setSelectedScorecard({ ...selectedScorecard, criteria: list });
                      }}
                      className="w-16 min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] font-mono text-xs"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#101014]/10 dark:border-white/10 space-y-1.5">
            <div className="text-xs font-semibold">Threshold Classification Bands</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {selectedScorecard.thresholds.map((band) => (
                <div
                  key={band.id}
                  className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-2.5"
                >
                  <div className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF]">
                    {band.minScore} – {band.maxScore} pts
                  </div>
                  <div className="font-semibold mt-0.5">{band.classification}</div>
                  <div className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                    {band.decisionOutcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                onSaveScorecard({ ...selectedScorecard, updatedAt: 'Just now' });
                setNotice('Saved Scorecard weights & bands.');
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Save Scorecard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3">
        <div className="font-display text-sm font-semibold">Compute Explainable Scorecard</div>
        <textarea
          rows={5}
          value={sampleJson}
          onChange={(e) => setSampleJson(e.target.value)}
          aria-label="Scorecard evaluation JSON input"
          className="w-full p-2.5 rounded-xl border border-white/15 bg-[#101014] font-mono text-xs text-white"
        />
        <button
          type="button"
          onClick={runSimulation}
          className="w-full min-h-[44px] rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>Score Input</span>
        </button>

        {execResult?.scoreBreakdown && (
          <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white">
                {execResult.scoreBreakdown.totalScore} pts
              </span>
              <span className="font-mono text-xs text-[#B894FF]">
                {execResult.scoreBreakdown.classification}
              </span>
            </div>
            <div className="space-y-1.5">
              {execResult.scoreBreakdown.criteriaTraces.map((ct) => (
                <div
                  key={ct.criterionId}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{ct.label}</div>
                    <div className="text-[11px] text-[#A4A4B5] truncate">{ct.rationale}</div>
                  </div>
                  <span
                    className={`font-mono font-semibold shrink-0 ${
                      ct.weightedPoints >= 0 ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {ct.weightedPoints >= 0 ? `+${ct.weightedPoints}` : ct.weightedPoints}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
