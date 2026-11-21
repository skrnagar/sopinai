import React from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Table2,
} from 'lucide-react';
import {
  DecisionExecutionSpec,
  DecisionSectionId,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { isPublishedSnapshotStatus } from '../evaluator';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface DecisionsOverviewProps {
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains?: RuleChainSpec[];
  scorecards?: ScorecardSpec[];
  executions: DecisionExecutionSpec[];
  onSwitchSection: (section: DecisionSectionId) => void;
  onSelectRule: (ruleId: string) => void;
  onSelectTable: (tableId: string) => void;
  onOpenAiAssist: () => void;
}

export const DecisionsOverview: React.FC<DecisionsOverviewProps> = ({
  rules,
  tables,
  rulesets,
  chains = [],
  scorecards = [],
  executions,
  onSwitchSection,
  onSelectRule,
  onSelectTable,
  onOpenAiAssist,
}) => {
  const allArtifacts = [...rules, ...tables, ...rulesets, ...chains, ...scorecards];
  const totalArtifacts = allArtifacts.length;
  const publishedCount = allArtifacts.filter((a) => isPublishedSnapshotStatus(a.status)).length;
  const draftOrTestedCount = allArtifacts.filter(
    (a) => a.status === 'Draft' || a.status === 'Validated' || a.status === 'Tested' || a.status === 'Review'
  ).length;

  const successCount = executions.filter((e) => e.status === 'Matched' || e.status === 'Fallback').length;
  const errorCount = executions.filter((e) => e.status === 'Error').length;

  const recentArtifacts = [
    ...rules.map((r) => ({
      id: r.id,
      kind: 'Rule' as const,
      section: 'rules' as DecisionSectionId,
      name: r.name,
      status: r.status,
      version: r.version,
      env: r.environment,
      updatedAt: r.updatedAt,
      isDemoData: r.isDemoData,
    })),
    ...tables.map((t) => ({
      id: t.id,
      kind: 'Table' as const,
      section: 'tables' as DecisionSectionId,
      name: t.name,
      status: t.status,
      version: t.version,
      env: t.environment,
      updatedAt: t.updatedAt,
      isDemoData: t.isDemoData,
    })),
    ...chains.map((c) => ({
      id: c.id,
      kind: 'Chain' as const,
      section: 'chains' as DecisionSectionId,
      name: c.name,
      status: c.status,
      version: c.version,
      env: c.environment,
      updatedAt: c.updatedAt,
      isDemoData: c.isDemoData,
    })),
    ...scorecards.map((s) => ({
      id: s.id,
      kind: 'Scorecard' as const,
      section: 'scorecards' as DecisionSectionId,
      name: s.name,
      status: s.status,
      version: s.version,
      env: s.environment,
      updatedAt: s.updatedAt,
      isDemoData: s.isDemoData,
    })),
  ].slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Positioning Header Banner */}
      <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#0A1226] text-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusText
            items={['SOPIN Decisions', 'Make business logic executable.', 'Local Deterministic Evaluator']}
            dark
            accentLast
          />
        </div>
        <p className="text-xs sm:text-sm text-[#C5C5D6] leading-relaxed max-w-3xl">
          Define deterministic rules, decision tables, rulesets, chains, and scorecards. Test inputs locally, publish immutable versions, and wire Decision Nodes directly into SOPIN Flow without relying on an LLM for deterministic policy outcomes.
        </p>

        {/* Quick Creation & AI Assist Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSwitchSection('rules')}
            className="min-h-[44px] px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>New Rule</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchSection('tables')}
            className="min-h-[44px] px-3 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Table2 className="w-4 h-4 text-[#7EC8FF] shrink-0" aria-hidden="true" />
            <span>New Table</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchSection('rulesets')}
            className="min-h-[44px] px-3 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#7EC8FF] shrink-0" aria-hidden="true" />
            <span>Rulesets</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiAssist}
            className="min-h-[44px] px-3 rounded-xl border border-[#60A5FA]/50 bg-[#60A5FA]/20 hover:bg-[#60A5FA]/30 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#7EC8FF] shrink-0" aria-hidden="true" />
            <span>AI Draft Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4">
          <div className="text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            Total Decision Assets
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#05070E] dark:text-white">
            {totalArtifacts}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#2563EB] dark:text-[#7EC8FF]">
            {rules.length}R · {tables.length}T · {rulesets.length}RS · {chains.length}C · {scorecards.length}SC
          </div>
        </div>

        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4">
          <div className="text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            Published Decisions
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#05070E] dark:text-white">
            {publishedCount}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
            Immutable SHA-256 specs
          </div>
        </div>

        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4">
          <div className="text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            Draft / Validated / Tested
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#05070E] dark:text-white">
            {draftOrTestedCount}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
            Pending governance gate
          </div>
        </div>

        <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4">
          <div className="text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            Recorded Executions
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums text-[#05070E] dark:text-white">
            {executions.length}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#2563EB] dark:text-[#7EC8FF]">
            {successCount} ok · {errorCount} errors
          </div>
        </div>
      </div>

      {/* Recently Modified + Recent Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Recently Modified Decisions
            </h3>
            <span className="text-[11px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
              Sample Demo + Local Edits
            </span>
          </div>
          <div className="space-y-2">
            {recentArtifacts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.kind === 'Rule') onSelectRule(item.id);
                  else if (item.kind === 'Table') onSelectTable(item.id);
                  else onSwitchSection(item.section);
                }}
                className="w-full min-h-[52px] text-left rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] hover:border-[#2563EB] p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-[#2563EB] dark:text-[#7EC8FF]">
                      {item.kind} · {item.version}
                    </span>
                    {item.isDemoData && (
                      <span className="text-[10px] font-mono text-[#5E5E6E] dark:text-[#9A9AB0]">
                        · Demo
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#05070E] dark:text-white truncate">
                    {item.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] font-semibold text-[#05070E] dark:text-white">
                    {item.status}
                  </div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
                    {item.env}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[#05070E] dark:text-white">
              Recent Deterministic Executions
            </h3>
            <button
              type="button"
              onClick={() => onSwitchSection('executions')}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#7EC8FF] inline-flex items-center gap-1"
            >
              <span>Inspect All</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-2">
            {executions.slice(0, 4).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSwitchSection('executions')}
                className="w-full min-h-[52px] text-left rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E] hover:border-[#2563EB] p-3 space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#05070E] dark:text-white truncate">
                    {ex.artifactName}
                  </span>
                  <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                    {ex.status} · {ex.durationMs}ms
                  </span>
                </div>
                <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] truncate">
                  {ex.sourceTrigger} · {ex.versionUsed} · Output: {JSON.stringify(ex.finalOutput)}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Ecosystem Separation Map */}
      <section className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3">
        <div className="text-xs font-semibold text-[#05070E] dark:text-white">
          Strict Separation Across the SOPIN Ecosystem
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#2563EB] dark:text-[#7EC8FF]">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>SOPIN Decisions</span>
            </div>
            <p className="text-[#5E5E6E] dark:text-[#A4A4B5]">
              Computes deterministic business outcomes via explicit rules, tables & scorecards.
            </p>
          </div>
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#05070E] dark:text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>SOPIN Control</span>
            </div>
            <p className="text-[#5E5E6E] dark:text-[#A4A4B5]">
              Governs RBAC permissions & approvals. AI agents cannot bypass Control to edit rules.
            </p>
          </div>
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#05070E] dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>SOPIN Studio / Graph</span>
            </div>
            <p className="text-[#5E5E6E] dark:text-[#A4A4B5]">
              Synthesizes rule drafts & coordinates multi-agent handoffs—never final rule authority.
            </p>
          </div>
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-3 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#05070E] dark:text-white">
              <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>SOPIN Flow / Observe</span>
            </div>
            <p className="text-[#5E5E6E] dark:text-[#A4A4B5]">
              Invokes Decision Nodes inside DAG workflows and records OTel-style traces cleanly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
