import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  GitBranch,
  Layers,
  Lock,
  Play,
  Plus,
  Save,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ConditionOperator,
  DecisionEnvironment,
  DecisionExecutionSpec,
  DecisionSettings,
  DecisionTableSpec,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import {
  buildPublishedChainVersion,
  buildPublishedRulesetVersion,
  buildPublishedScorecardVersion,
  canonicalSerialize,
  checkEditPermission,
  checkTestEvidenceFreshness,
  evaluatePublishGovernancePolicy,
  evaluateRuleChainSpec,
  evaluateRulesetSpec,
  evaluateScorecardSpec,
  extractVersionableSpecBody,
  validateRuleChainArtifact,
  validateRuleChainSpec,
  validateRulesetArtifact,
  validateRulesetSpec,
  validateScorecardArtifact,
  validateScorecardSpec,
} from '../evaluator';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';
import { HighlightedCode } from '../../components/ui/HighlightedCode';

interface RulesetsChainsScorecardsProps {
  mode: 'rulesets' | 'chains' | 'scorecards';
  workspaceId: string;
  workspaceRole?: string;
  rules: RuleSpec[];
  tables: DecisionTableSpec[];
  rulesets: RulesetSpec[];
  chains: RuleChainSpec[];
  scorecards: ScorecardSpec[];
  settings?: DecisionSettings;
  onSaveRuleset: (rs: RulesetSpec, note?: string) => void;
  onSaveChain: (chain: RuleChainSpec, note?: string) => void;
  onSaveScorecard: (sc: ScorecardSpec, note?: string) => void;
  onRecordExecution: (exec: DecisionExecutionSpec) => void;
}

export const RulesetsChainsScorecards: React.FC<RulesetsChainsScorecardsProps> = ({
  mode,
  workspaceId,
  workspaceRole = 'Workspace Maintainer',
  rules,
  tables,
  rulesets,
  chains,
  scorecards,
  settings,
  onSaveRuleset,
  onSaveChain,
  onSaveScorecard,
  onRecordExecution,
}) => {
  const effectiveSettings: DecisionSettings = settings ?? {
    requireTestPassBeforePublish: true,
    requireControlApprovalForProd: true,
    strictInputSchemaValidation: true,
    restrictExpressionsToSafeSubset: true,
    allowedEditorsRole: 'Builders & Maintainers',
    allowedPublishersRole: 'Workspace Maintainer',
  };

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
        testCases: [],
        versionHistory: [],
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
        testCases: [],
        versionHistory: [],
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
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishEnv, setPublishEnv] = useState<DecisionEnvironment>('production');
  const [publishSummary, setPublishSummary] = useState('Verified composite decision policy and executed regression checks.');
  const [controlApprovalChecked, setControlApprovalChecked] = useState(false);

  const collections = useMemo(
    () => ({ rules, tables, rulesets, chains, scorecards }),
    [rules, tables, rulesets, chains, scorecards]
  );

  const editPermission = useMemo(
    () => checkEditPermission(workspaceRole, effectiveSettings),
    [workspaceRole, effectiveSettings]
  );

  const activeType = mode === 'rulesets' ? 'ruleset' : mode === 'chains' ? 'chain' : 'scorecard';
  const activeSpec =
    mode === 'rulesets' ? selectedRs : mode === 'chains' ? selectedChain : selectedScorecard;

  const liveValidation = useMemo(() => {
    if (mode === 'rulesets') return validateRulesetArtifact(selectedRs, collections, 'publication');
    if (mode === 'chains') return validateRuleChainArtifact(selectedChain, collections, new Set(), 'publication');
    return validateScorecardArtifact(selectedScorecard, 'publication');
  }, [mode, selectedRs, selectedChain, selectedScorecard, collections]);

  const testEvidence = useMemo(
    () => checkTestEvidenceFreshness(activeType, activeSpec),
    [activeType, activeSpec]
  );

  const publishPolicy = useMemo(
    () =>
      evaluatePublishGovernancePolicy(
        activeType,
        activeSpec,
        publishEnv,
        workspaceRole,
        effectiveSettings,
        collections,
        controlApprovalChecked
      ),
    [activeType, activeSpec, publishEnv, workspaceRole, effectiveSettings, collections, controlApprovalChecked]
  );

  const isDirty = useMemo(() => {
    if (mode === 'rulesets') {
      const saved = rulesets.find((r) => r.id === selectedRs.id);
      return (
        !saved ||
        canonicalSerialize(extractVersionableSpecBody('ruleset', selectedRs)) !==
          canonicalSerialize(extractVersionableSpecBody('ruleset', saved)) ||
        selectedRs.name !== saved.name
      );
    }
    if (mode === 'chains') {
      const saved = chains.find((c) => c.id === selectedChain.id);
      return (
        !saved ||
        canonicalSerialize(extractVersionableSpecBody('chain', selectedChain)) !==
          canonicalSerialize(extractVersionableSpecBody('chain', saved)) ||
        selectedChain.name !== saved.name
      );
    }
    const saved = scorecards.find((s) => s.id === selectedScorecard.id);
    return (
      !saved ||
      canonicalSerialize(extractVersionableSpecBody('scorecard', selectedScorecard)) !==
        canonicalSerialize(extractVersionableSpecBody('scorecard', saved)) ||
      selectedScorecard.name !== saved.name
    );
  }, [mode, selectedRs, selectedChain, selectedScorecard, rulesets, chains, scorecards]);

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

  const handleSaveDraft = (targetStatus: 'Draft' | 'Review' = 'Draft') => {
    if (!editPermission.allowed) {
      setNotice(editPermission.reasons[0] || 'Role cannot edit artifacts under current governance policy.');
      return;
    }
    if (mode === 'rulesets') {
      const check = validateRulesetSpec(selectedRs, collections);
      if (!check.valid) {
        setNotice(`Cannot save invalid ruleset: ${check.errors.join(' ')}`);
        return;
      }
      const nextVer =
        (selectedRs.status === 'Published' || selectedRs.status === 'Promoted') &&
        !selectedRs.version.includes('-draft')
          ? `${selectedRs.version}-draft`
          : selectedRs.version;
      const next: RulesetSpec = { ...selectedRs, version: nextVer, status: targetStatus, updatedAt: 'Just now' };
      setSelectedRs(next);
      onSaveRuleset(next, `Saved Ruleset ${targetStatus} (${nextVer})`);
      setNotice(`Saved Ruleset ${targetStatus} (${nextVer}) locally.`);
    } else if (mode === 'chains') {
      const check = validateRuleChainSpec(selectedChain, collections);
      if (!check.valid) {
        setNotice(`Cannot save invalid rule chain: ${check.errors.join(' ')}`);
        return;
      }
      const nextVer =
        (selectedChain.status === 'Published' || selectedChain.status === 'Promoted') &&
        !selectedChain.version.includes('-draft')
          ? `${selectedChain.version}-draft`
          : selectedChain.version;
      const next: RuleChainSpec = { ...selectedChain, version: nextVer, status: targetStatus, updatedAt: 'Just now' };
      setSelectedChain(next);
      onSaveChain(next, `Saved Rule Chain ${targetStatus} (${nextVer})`);
      setNotice(`Saved Rule Chain ${targetStatus} (${nextVer}) locally.`);
    } else {
      const check = validateScorecardSpec(selectedScorecard);
      if (!check.valid) {
        setNotice(`Cannot save invalid scorecard: ${check.errors.join(' ')}`);
        return;
      }
      const nextVer =
        (selectedScorecard.status === 'Published' || selectedScorecard.status === 'Promoted') &&
        !selectedScorecard.version.includes('-draft')
          ? `${selectedScorecard.version}-draft`
          : selectedScorecard.version;
      const next: ScorecardSpec = {
        ...selectedScorecard,
        version: nextVer,
        status: targetStatus,
        updatedAt: 'Just now',
      };
      setSelectedScorecard(next);
      onSaveScorecard(next, `Saved Scorecard ${targetStatus} (${nextVer})`);
      setNotice(`Saved Scorecard ${targetStatus} (${nextVer}) locally.`);
    }
  };

  const handlePublishConfirm = () => {
    if (!publishPolicy.allowed) {
      setNotice(`Publish blocked: ${publishPolicy.reasons.join(' ')}`);
      return;
    }
    const approvalMeta =
      publishEnv === 'production' && effectiveSettings.requireControlApprovalForProd
        ? {
            approved: controlApprovalChecked,
            reviewerLabel: `${workspaceRole} (Local Gate)`,
            approvedAt: 'Just now',
            note: publishSummary.trim(),
            controlRequired: true,
          }
        : undefined;

    if (mode === 'rulesets') {
      const next = buildPublishedRulesetVersion(
        selectedRs,
        publishEnv,
        publishSummary.trim() || 'Published Ruleset snapshot',
        `${workspaceRole} (Local Prototype)`,
        undefined,
        approvalMeta
      );
      setSelectedRs(next);
      onSaveRuleset(next, `Published Ruleset ${next.version} to ${publishEnv}`);
      setNotice(`Published immutable Ruleset ${next.version} (${publishEnv}).`);
    } else if (mode === 'chains') {
      const next = buildPublishedChainVersion(
        selectedChain,
        publishEnv,
        publishSummary.trim() || 'Published Rule Chain snapshot',
        `${workspaceRole} (Local Prototype)`,
        undefined,
        approvalMeta
      );
      setSelectedChain(next);
      onSaveChain(next, `Published Rule Chain ${next.version} to ${publishEnv}`);
      setNotice(`Published immutable Rule Chain ${next.version} (${publishEnv}).`);
    } else {
      const next = buildPublishedScorecardVersion(
        selectedScorecard,
        publishEnv,
        publishSummary.trim() || 'Published Scorecard snapshot',
        `${workspaceRole} (Local Prototype)`,
        undefined,
        approvalMeta
      );
      setSelectedScorecard(next);
      onSaveScorecard(next, `Published Scorecard ${next.version} to ${publishEnv}`);
      setNotice(`Published immutable Scorecard ${next.version} (${publishEnv}).`);
    }
    setPublishOpen(false);
    setControlApprovalChecked(false);
  };

  const renderValidationBanner = () =>
    (!editPermission.allowed ||
      liveValidation.errors.length > 0 ||
      liveValidation.warnings.length > 0 ||
      isDirty) && (
      <div
        className={`rounded-2xl border p-3.5 text-xs space-y-1.5 ${
          !editPermission.allowed || liveValidation.errors.length > 0
            ? 'border-red-500/40 bg-red-500/[0.06] text-red-800 dark:text-red-200'
            : 'border-amber-500/35 bg-amber-500/[0.08] text-amber-900 dark:text-amber-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
          <span className="inline-flex items-center gap-1.5">
            {!editPermission.allowed ? (
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {!editPermission.allowed
                ? 'Read-Only Governance Policy'
                : liveValidation.errors.length > 0
                ? `${liveValidation.errors.length} Validation Error(s) Block Publish`
                : `${liveValidation.warnings.length} Advisory Warning(s)`}
            </span>
          </span>
          {isDirty && (
            <span className="font-mono text-[11px] uppercase">Unsaved Draft Edits</span>
          )}
        </div>
        {!editPermission.allowed && (
          <div className="font-mono text-[11px]">• {editPermission.reasons[0]}</div>
        )}
        {liveValidation.errors.slice(0, 4).map((err, i) => (
          <div key={`cerr-${i}`} className="font-mono text-[11px]">
            • {err.message}
          </div>
        ))}
        {liveValidation.warnings.slice(0, 2).map((w, i) => (
          <div key={`cwarn-${i}`} className="font-mono text-[11px] opacity-90">
            • Warning: {w.message}
          </div>
        ))}
      </div>
    );

  const renderPublishSheet = (titleLabel: string) => (
    <BottomSheet
      open={publishOpen}
      onClose={() => setPublishOpen(false)}
      title={`Publish Immutable ${titleLabel}?`}
      subtitle="Publishes a verified canonical SHA-256 snapshot for SOPIN Flow & Runtime."
    >
      <div className="space-y-4">
        {!publishPolicy.allowed && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/45 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200 space-y-1"
          >
            <div className="font-semibold">Publish Blocked by Governance &amp; Validation</div>
            {publishPolicy.reasons.map((r, i) => (
              <div key={i} className="font-mono text-[11px]">
                • {r}
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="comp-pub-env" className="block text-xs font-semibold mb-1.5">
            Target Environment
          </label>
          <select
            id="comp-pub-env"
            value={publishEnv}
            onChange={(e) => setPublishEnv(e.target.value as DecisionEnvironment)}
            className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
          >
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>

        {publishEnv === 'production' && effectiveSettings.requireControlApprovalForProd && (
          <label className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/[0.06] p-3 flex items-start gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={controlApprovalChecked}
              onChange={(e) => setControlApprovalChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>SOPIN Control Review Approval (Local Prototype Gate):</strong> Confirm peer review sign-off for production deployment as{' '}
              <span className="font-mono">{workspaceRole}</span>.
            </span>
          </label>
        )}

        <div>
          <label htmlFor="comp-pub-note" className="block text-xs font-semibold mb-1.5">
            Release Notes / Change Summary
          </label>
          <input
            id="comp-pub-note"
            type="text"
            value={publishSummary}
            onChange={(e) => setPublishSummary(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPublishOpen(false)}
            className="min-h-[44px] rounded-xl border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!publishPolicy.allowed}
            onClick={handlePublishConfirm}
            className="min-h-[44px] rounded-xl bg-[#6252E8] disabled:opacity-40 text-white text-xs font-semibold"
          >
            Confirm Publish
          </button>
        </div>
      </div>
    </BottomSheet>
  );

  const renderActionButtons = (label: string) => (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      <button
        type="button"
        disabled={!editPermission.allowed}
        onClick={() => handleSaveDraft('Draft')}
        className="min-h-[44px] px-4 rounded-xl border border-[#101014]/15 dark:border-white/15 disabled:opacity-40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        <Save className="w-4 h-4" aria-hidden="true" />
        <span>Save Draft</span>
      </button>
      <button
        type="button"
        disabled={!editPermission.allowed || !liveValidation.isValid}
        onClick={() => handleSaveDraft('Review')}
        className="min-h-[44px] px-4 rounded-xl border border-[#6252E8]/40 text-[#6252E8] dark:text-[#B894FF] disabled:opacity-40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        <span>Submit Review</span>
      </button>
      <button
        type="button"
        onClick={() => setPublishOpen(true)}
        className="min-h-[44px] px-4 rounded-xl bg-[#6252E8] hover:bg-[#5243d6] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        <span>Publish {label}</span>
      </button>
    </div>
  );

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
                  onClick={() => {
                    setSelectedRs(structuredClone(rs));
                    setExecResult(null);
                  }}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 ${
                    rs.id === selectedRs.id
                      ? 'border-[#6252E8] bg-[#6252E8]/10'
                      : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                  }`}
                >
                  <div className="text-xs font-semibold">{rs.name}</div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                    {rs.members.length} members · {rs.version} · {rs.status}
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
            <div className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-3.5 py-2 text-xs font-medium flex items-center justify-between gap-2">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice('')} className="text-xs font-semibold text-[#6252E8]">
                Dismiss
              </button>
            </div>
          )}

          {renderValidationBanner()}

          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3.5">
            <StatusText
              items={[
                selectedRs.version,
                selectedRs.status,
                selectedRs.environment,
                testEvidence.allPassed && testEvidence.allCurrentForSpec ? 'Tests Current' : 'Tests Pending',
              ]}
              accentLast
            />
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
                const targetOptions = m.targetType === 'rule' ? rules : tables;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span className="font-mono text-[10px] text-[#6252E8]">P</span>
                      <input
                        type="number"
                        aria-label={`Member ${idx + 1} priority`}
                        value={m.priority}
                        onChange={(e) => {
                          const next = [...selectedRs.members];
                          next[idx] = { ...m, priority: Number(e.target.value) || 1 };
                          setSelectedRs({ ...selectedRs, members: next });
                        }}
                        className="w-full min-h-[36px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <select
                        aria-label={`Member ${idx + 1} target`}
                        value={m.targetId}
                        onChange={(e) => {
                          const next = [...selectedRs.members];
                          next[idx] = { ...m, targetId: e.target.value };
                          setSelectedRs({ ...selectedRs, members: next });
                        }}
                        className="w-full min-h-[36px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs"
                      >
                        {targetOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {m.targetType}: {opt.name} ({opt.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4 flex items-center justify-end gap-1.5">
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
                      <button
                        type="button"
                        aria-label="Remove ruleset member"
                        onClick={() =>
                          setSelectedRs({
                            ...selectedRs,
                            members: selectedRs.members.filter((_, i) => i !== idx),
                          })
                        }
                        className="w-9 h-9 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {renderActionButtons('Ruleset')}
          </div>
        </div>

        {/* Right Simulator */}
        <div className="lg:col-span-5 rounded-2xl border border-[#101014]/15 dark:border-white/15 bg-[#101126] text-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold">Simulate Ruleset Execution</span>
            <Layers className="w-4 h-4 text-[#B894FF]" aria-hidden="true" />
          </div>
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
              <div className={`font-mono ${execResult.status === 'Error' ? 'text-red-400' : 'text-[#B894FF]'}`}>
                {execResult.status} · Matched: {execResult.matchedRules.join(', ') || execResult.errorCode || 'None'}
              </div>
              {execResult.validationErrors && execResult.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-2 text-[11px] font-mono text-red-200">
                  {execResult.validationErrors.join(' ')}
                </div>
              )}
              <pre className="p-2.5 rounded-lg bg-[#0D1021] border border-white/10 font-mono text-[11px] overflow-x-auto">
                <HighlightedCode
                  code={JSON.stringify(execResult.finalOutput, null, 2)}
                  language="json"
                  surface="dark"
                />
              </pre>
              <p className="text-[11px] text-[#C5C5D6]">{execResult.explanation}</p>
            </div>
          )}
        </div>

        {renderPublishSheet('Ruleset')}
      </div>
    );
  }

  if (mode === 'chains') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex overflow-x-auto no-scrollbar gap-2">
              {chains.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setSelectedChain(structuredClone(ch));
                    setExecResult(null);
                  }}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 ${
                    ch.id === selectedChain.id
                      ? 'border-[#6252E8] bg-[#6252E8]/10'
                      : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                  }`}
                >
                  <div className="text-xs font-semibold">{ch.name}</div>
                  <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                    {ch.stages.length} stages · {ch.version} · {ch.status}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedChain({
                  id: `chain-${Date.now()}`,
                  workspaceId,
                  name: 'New Sequential Rule Chain',
                  description: 'Passes earlier decision outputs into subsequent stages.',
                  isDemoData: false,
                  stages: rules[0]
                    ? [
                        {
                          id: `st-${Date.now()}`,
                          stepOrder: 1,
                          label: `Stage 01 · ${rules[0].name}`,
                          targetType: 'rule',
                          targetId: rules[0].id,
                          onOutcome: 'continue',
                        },
                      ]
                    : [],
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
              <span>New Chain</span>
            </button>
          </div>

          {notice && (
            <div className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-3.5 py-2 text-xs font-medium flex items-center justify-between gap-2">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice('')} className="text-xs font-semibold text-[#6252E8]">
                Dismiss
              </button>
            </div>
          )}

          {renderValidationBanner()}

          <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
            <StatusText
              items={[
                'Rule Chain',
                selectedChain.version,
                selectedChain.status,
                selectedChain.environment,
                testEvidence.allPassed && testEvidence.allCurrentForSpec ? 'Tests Current' : 'Tests Pending',
              ]}
              accentLast
            />
            <input
              type="text"
              aria-label="Rule chain name"
              value={selectedChain.name}
              onChange={(e) => setSelectedChain({ ...selectedChain, name: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm font-semibold"
            />
            <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">{selectedChain.description}</p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold">Chain Execution Stages</span>
              <button
                type="button"
                onClick={() => {
                  const defaultTarget = rules[0]?.id ?? tables[0]?.id ?? '';
                  const defaultType = rules[0] ? 'rule' : 'table';
                  setSelectedChain({
                    ...selectedChain,
                    stages: [
                      ...selectedChain.stages,
                      {
                        id: `st-${Date.now()}`,
                        stepOrder: selectedChain.stages.length + 1,
                        label: `Stage 0${selectedChain.stages.length + 1}`,
                        targetType: defaultType,
                        targetId: defaultTarget,
                        onOutcome: 'continue',
                      },
                    ],
                  });
                }}
                className="min-h-[34px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
              >
                + Add Stage
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {selectedChain.stages.map((st, idx) => (
                <React.Fragment key={st.id}>
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[#6252E8] dark:text-[#B894FF] flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{st.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Stage ${st.stepOrder} target type`}
                          value={st.targetType}
                          onChange={(e) => {
                            const nextType = e.target.value as 'rule' | 'table' | 'ruleset';
                            const nextTarget =
                              nextType === 'rule'
                                ? rules[0]?.id ?? ''
                                : nextType === 'table'
                                ? tables[0]?.id ?? ''
                                : rulesets[0]?.id ?? '';
                            const next = [...selectedChain.stages];
                            next[idx] = { ...st, targetType: nextType, targetId: nextTarget };
                            setSelectedChain({ ...selectedChain, stages: next });
                          }}
                          className="min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-[11px]"
                        >
                          <option value="rule">rule</option>
                          <option value="table">table</option>
                          <option value="ruleset">ruleset</option>
                        </select>
                        <button
                          type="button"
                          aria-label={`Remove stage ${st.stepOrder}`}
                          onClick={() =>
                            setSelectedChain({
                              ...selectedChain,
                              stages: selectedChain.stages.filter((_, i) => i !== idx),
                            })
                          }
                          className="w-8 h-8 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <select
                      aria-label={`Stage ${st.stepOrder} target artifact`}
                      value={st.targetId}
                      onChange={(e) => {
                        const next = [...selectedChain.stages];
                        next[idx] = { ...st, targetId: e.target.value };
                        setSelectedChain({ ...selectedChain, stages: next });
                      }}
                      className="w-full min-h-[38px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs"
                    >
                      {(st.targetType === 'rule'
                        ? rules
                        : st.targetType === 'table'
                        ? tables
                        : rulesets
                      ).map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} ({opt.version} · {opt.status})
                        </option>
                      ))}
                    </select>

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

            {renderActionButtons('Chain')}
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
              <pre className="p-2.5 rounded-lg bg-[#0D1021] border border-white/10 font-mono text-[11px] overflow-x-auto">
                <HighlightedCode
                  code={JSON.stringify(execResult.finalOutput, null, 2)}
                  language="json"
                  surface="dark"
                />
              </pre>
            </div>
          )}
        </div>

        {renderPublishSheet('Rule Chain')}
      </div>
    );
  }

  // mode === 'scorecards'
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex overflow-x-auto no-scrollbar gap-2">
            {scorecards.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setSelectedScorecard(structuredClone(sc));
                  setExecResult(null);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 ${
                  sc.id === selectedScorecard.id
                    ? 'border-[#6252E8] bg-[#6252E8]/10'
                    : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]'
                }`}
              >
                <div className="text-xs font-semibold">{sc.name}</div>
                <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
                  {sc.criteria.length} criteria · {sc.version} · {sc.status}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setSelectedScorecard({
                id: `sc-${Date.now()}`,
                workspaceId,
                name: 'New Weighted Scorecard',
                description: 'Weighted deterministic scoring model.',
                isDemoData: false,
                baseScore: 50,
                criteria: [
                  {
                    id: `crit-${Date.now()}`,
                    label: 'Verified Entity',
                    field: 'vendorVerified',
                    fieldType: 'boolean',
                    operator: '==',
                    value: 'true',
                    weight: 1,
                    pointsIfMatched: 25,
                    pointsIfMissed: -15,
                    rationale: 'Verified entity baseline',
                  },
                ],
                thresholds: [
                  { id: 't1', minScore: 70, maxScore: 150, classification: 'Low Risk', decisionOutcome: 'approved' },
                  { id: 't2', minScore: -100, maxScore: 69, classification: 'Review Required', decisionOutcome: 'manual_review' },
                ],
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
            <span>New Scorecard</span>
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-[#6252E8]/35 bg-[#6252E8]/10 px-3.5 py-2 text-xs font-medium flex items-center justify-between gap-2">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} className="text-xs font-semibold text-[#6252E8]">
              Dismiss
            </button>
          </div>
        )}

        {renderValidationBanner()}

        <div className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <StatusText
              items={[
                'Weighted Scorecard',
                selectedScorecard.version,
                selectedScorecard.status,
                selectedScorecard.environment,
                testEvidence.allPassed && testEvidence.allCurrentForSpec ? 'Tests Current' : 'Tests Pending',
              ]}
              accentLast
            />
            <Scale className="w-4 h-4 text-[#6252E8]" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label htmlFor="sc-name-input" className="block text-xs font-semibold mb-1">
                Scorecard Name
              </label>
              <input
                id="sc-name-input"
                type="text"
                value={selectedScorecard.name}
                onChange={(e) => setSelectedScorecard({ ...selectedScorecard, name: e.target.value })}
                className="w-full min-h-[42px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-sm font-semibold"
              />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="sc-base-input" className="block text-xs font-semibold mb-1">
                Base Score
              </label>
              <input
                id="sc-base-input"
                type="number"
                value={selectedScorecard.baseScore}
                onChange={(e) =>
                  setSelectedScorecard({
                    ...selectedScorecard,
                    baseScore: Number(e.target.value) || 0,
                  })
                }
                className="w-full min-h-[42px] px-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold">Weighted Criteria</span>
            <button
              type="button"
              onClick={() =>
                setSelectedScorecard({
                  ...selectedScorecard,
                  criteria: [
                    ...selectedScorecard.criteria,
                    {
                      id: `crit-${Date.now()}`,
                      label: 'New Factor',
                      field: 'vendorVerified',
                      operator: '==',
                      value: 'true',
                      weight: 1,
                      pointsIfMatched: 15,
                      pointsIfMissed: -10,
                      rationale: 'Custom factor check',
                    },
                  ],
                })
              }
              className="min-h-[34px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
            >
              + Criterion
            </button>
          </div>

          <div className="space-y-2">
            {selectedScorecard.criteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    aria-label={`Criterion ${idx + 1} label`}
                    value={crit.label}
                    onChange={(e) => {
                      const list = [...selectedScorecard.criteria];
                      list[idx] = { ...crit, label: e.target.value };
                      setSelectedScorecard({ ...selectedScorecard, criteria: list });
                    }}
                    className="flex-1 min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] font-semibold text-xs"
                  />
                  <button
                    type="button"
                    aria-label={`Remove criterion ${crit.label}`}
                    onClick={() =>
                      setSelectedScorecard({
                        ...selectedScorecard,
                        criteria: selectedScorecard.criteria.filter((_, i) => i !== idx),
                      })
                    }
                    className="w-8 h-8 rounded-lg text-[#5E5E6E] hover:text-red-500 inline-flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center text-[11px] font-mono">
                  <input
                    type="text"
                    aria-label="Criterion field"
                    value={crit.field}
                    onChange={(e) => {
                      const list = [...selectedScorecard.criteria];
                      list[idx] = { ...crit, field: e.target.value };
                      setSelectedScorecard({ ...selectedScorecard, criteria: list });
                    }}
                    className="sm:col-span-2 min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                  />
                  <select
                    aria-label="Criterion operator"
                    value={crit.operator}
                    onChange={(e) => {
                      const list = [...selectedScorecard.criteria];
                      list[idx] = { ...crit, operator: e.target.value as ConditionOperator };
                      setSelectedScorecard({ ...selectedScorecard, criteria: list });
                    }}
                    className="min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                  >
                    {(['==', '!=', '>', '>=', '<', '<=', 'in', 'contains'] as ConditionOperator[]).map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label="Criterion target value"
                    value={crit.value}
                    onChange={(e) => {
                      const list = [...selectedScorecard.criteria];
                      list[idx] = { ...crit, value: e.target.value };
                      setSelectedScorecard({ ...selectedScorecard, criteria: list });
                    }}
                    className="min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                  />
                  <label className="inline-flex items-center gap-1">
                    <span>w:</span>
                    <input
                      type="number"
                      step="0.25"
                      value={crit.weight}
                      onChange={(e) => {
                        const list = [...selectedScorecard.criteria];
                        list[idx] = { ...crit, weight: Number(e.target.value) };
                        setSelectedScorecard({ ...selectedScorecard, criteria: list });
                      }}
                      className="w-full min-h-[34px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                    />
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      aria-label="Points if matched"
                      value={crit.pointsIfMatched}
                      onChange={(e) => {
                        const list = [...selectedScorecard.criteria];
                        list[idx] = { ...crit, pointsIfMatched: Number(e.target.value) || 0 };
                        setSelectedScorecard({ ...selectedScorecard, criteria: list });
                      }}
                      className="w-1/2 min-h-[34px] px-1.5 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                    />
                    <input
                      type="number"
                      aria-label="Points if missed"
                      value={crit.pointsIfMissed}
                      onChange={(e) => {
                        const list = [...selectedScorecard.criteria];
                        list[idx] = { ...crit, pointsIfMissed: Number(e.target.value) || 0 };
                        setSelectedScorecard({ ...selectedScorecard, criteria: list });
                      }}
                      className="w-1/2 min-h-[34px] px-1.5 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#101014]/10 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Threshold Classification Bands (Inclusive Ranges)</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedScorecard({
                    ...selectedScorecard,
                    thresholds: [
                      ...selectedScorecard.thresholds,
                      {
                        id: `th-${Date.now()}`,
                        minScore: 121,
                        maxScore: 200,
                        classification: 'New Band',
                        decisionOutcome: 'approved',
                      },
                    ],
                  })
                }
                className="min-h-[32px] px-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-[11px] font-semibold"
              >
                + Band
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {selectedScorecard.thresholds.map((band, bIdx) => (
                <div
                  key={band.id}
                  className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-2.5 space-y-1.5"
                >
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <input
                      type="number"
                      aria-label={`Band ${bIdx + 1} min score`}
                      value={band.minScore}
                      onChange={(e) => {
                        const next = [...selectedScorecard.thresholds];
                        next[bIdx] = { ...band, minScore: Number(e.target.value) };
                        setSelectedScorecard({ ...selectedScorecard, thresholds: next });
                      }}
                      className="w-16 min-h-[30px] px-1.5 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                    />
                    <span>–</span>
                    <input
                      type="number"
                      aria-label={`Band ${bIdx + 1} max score`}
                      value={band.maxScore}
                      onChange={(e) => {
                        const next = [...selectedScorecard.thresholds];
                        next[bIdx] = { ...band, maxScore: Number(e.target.value) };
                        setSelectedScorecard({ ...selectedScorecard, thresholds: next });
                      }}
                      className="w-16 min-h-[30px] px-1.5 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126]"
                    />
                  </div>
                  <input
                    type="text"
                    aria-label={`Band ${bIdx + 1} classification`}
                    value={band.classification}
                    onChange={(e) => {
                      const next = [...selectedScorecard.thresholds];
                      next[bIdx] = { ...band, classification: e.target.value };
                      setSelectedScorecard({ ...selectedScorecard, thresholds: next });
                    }}
                    className="w-full min-h-[30px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] text-xs font-semibold"
                  />
                  <input
                    type="text"
                    aria-label={`Band ${bIdx + 1} decision outcome`}
                    value={band.decisionOutcome}
                    onChange={(e) => {
                      const next = [...selectedScorecard.thresholds];
                      next[bIdx] = { ...band, decisionOutcome: e.target.value };
                      setSelectedScorecard({ ...selectedScorecard, thresholds: next });
                    }}
                    className="w-full min-h-[30px] px-2 rounded border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] font-mono text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {renderActionButtons('Scorecard')}
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
        {parseErr && <p className="text-xs text-red-400">{parseErr}</p>}
        <button
          type="button"
          onClick={runSimulation}
          className="w-full min-h-[44px] rounded-xl bg-[#6252E8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>Score Input</span>
        </button>

        {execResult && execResult.status === 'Error' && (
          <div className="rounded-xl border border-red-400/40 bg-red-500/15 p-3 space-y-1 text-xs text-red-200 font-mono">
            <div className="font-semibold">Error: {execResult.errorCode || 'SCORECARD_ERROR'}</div>
            <div>{execResult.explanation}</div>
          </div>
        )}

        {execResult?.scoreBreakdown && (
          <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white tabular-nums">
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
                    className={`font-mono font-semibold shrink-0 tabular-nums ${
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

      {renderPublishSheet('Scorecard')}
    </div>
  );
};
