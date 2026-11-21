import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  DecisionApprovalPurpose,
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionEnvironment,
  DecisionSettings,
} from '../types';
import {
  checkApprovalPermission,
  checkTestEvidenceFreshness,
  computeArtifactSpecHash,
  evaluatePublishGovernancePolicy,
  inspectApprovalFreshness,
} from '../evaluator';
import { ValidationCollections } from '../engine/validators';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StatusText } from '../../components/ui/EditorialPrimitives';

interface DecisionGovernanceStatusCardProps {
  artifactType: DecisionArtifactType;
  spec: DecisionArtifactSpec;
  workspaceRole: string;
  settings: DecisionSettings;
  targetEnvironment?: DecisionEnvironment;
  purpose?: DecisionApprovalPurpose;
  onRecordApproval: (params: {
    targetEnvironment: DecisionEnvironment;
    purpose: DecisionApprovalPurpose;
    decision: 'approved' | 'rejected';
    note: string;
  }) => void;
}

export const DecisionGovernanceStatusCard: React.FC<DecisionGovernanceStatusCardProps> = ({
  artifactType,
  spec,
  workspaceRole,
  settings,
  targetEnvironment = 'production',
  purpose = 'publication',
  onRecordApproval,
}) => {
  const [reviewEnv, setReviewEnv] = useState<DecisionEnvironment>(targetEnvironment);
  const [reviewPurpose, setReviewPurpose] = useState<DecisionApprovalPurpose>(purpose);
  const [reviewNote, setReviewNote] = useState('');

  const specHash = useMemo(
    () => computeArtifactSpecHash(artifactType, spec),
    [artifactType, spec]
  );
  const testEvidence = useMemo(
    () => checkTestEvidenceFreshness(artifactType, spec),
    [artifactType, spec]
  );
  const approvalReport = useMemo(
    () => inspectApprovalFreshness(artifactType, spec, reviewEnv, reviewPurpose),
    [artifactType, spec, reviewEnv, reviewPurpose]
  );
  const approvalPerm = useMemo(
    () => checkApprovalPermission(workspaceRole, settings),
    [workspaceRole, settings]
  );

  const history = Array.isArray(spec.approvalHistory) ? spec.approvalHistory : [];

  const testStatusText = !testEvidence.hasTests
    ? 'Tests Missing'
    : testEvidence.failedCaseCount > 0
    ? `Tests Failed (${testEvidence.failedCaseCount})`
    : testEvidence.unrunCaseCount > 0
    ? `Tests Unrun (${testEvidence.unrunCaseCount})`
    : testEvidence.allCurrentForSpec
    ? 'Tests Current'
    : `Tests Stale (${testEvidence.staleCaseCount})`;

  const approvalStatusText =
    approvalReport.status === 'valid'
      ? `Approved (${reviewPurpose})`
      : approvalReport.status === 'stale-spec' || approvalReport.status === 'stale-version'
      ? 'Approval Stale (Spec/Version Changed)'
      : approvalReport.status === 'wrong-purpose'
      ? 'Wrong Approval Purpose'
      : approvalReport.status === 'wrong-environment'
      ? 'Wrong Approval Environment'
      : approvalReport.status === 'rejected'
      ? 'Approval Rejected'
      : 'Approval Required for Prod';

  return (
    <section
      aria-label="Approval integrity and governance status"
      className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#05070E] dark:text-white">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
          <span>SOPIN Control · Approval Integrity &amp; Evidence Gate</span>
        </div>
        <span className="font-mono text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">
          Local Prototype · Simulated Identity
        </span>
      </div>

      <StatusText
        items={[
          `${spec.version}`,
          `Digest ${specHash.slice(0, 18)}…`,
          testStatusText,
          approvalStatusText,
        ]}
        accentLast
      />

      {!approvalReport.valid &&
        (approvalReport.status === 'stale-spec' ||
          approvalReport.status === 'stale-version' ||
          approvalReport.status === 'wrong-purpose' ||
          approvalReport.status === 'wrong-environment') && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-2.5 text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{approvalReport.reason}</span>
          </div>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-[#5E5E6E] dark:text-[#A4A4B5] mb-1">
            Approval Env
          </label>
          <select
            aria-label="Approval target environment"
            value={reviewEnv}
            onChange={(e) => setReviewEnv(e.target.value as DecisionEnvironment)}
            className="w-full min-h-[44px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
          >
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-[#5E5E6E] dark:text-[#A4A4B5] mb-1">
            Approval Purpose
          </label>
          <select
            aria-label="Approval purpose"
            value={reviewPurpose}
            onChange={(e) => setReviewPurpose(e.target.value as DecisionApprovalPurpose)}
            className="w-full min-h-[44px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
          >
            <option value="publication">publication</option>
            <option value="production-promotion">production-promotion</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-[#5E5E6E] dark:text-[#A4A4B5] mb-1">
            Review Note (Simulated)
          </label>
          <input
            type="text"
            aria-label="Approval review note"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Peer check summary"
            className="w-full min-h-[44px] px-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-xs"
          />
        </div>

        <div className="sm:col-span-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              onRecordApproval({
                targetEnvironment: reviewEnv,
                purpose: reviewPurpose,
                decision: 'approved',
                note: reviewNote,
              });
              setReviewNote('');
            }}
            className={`flex-1 min-h-[44px] px-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 ${
              approvalPerm.allowed
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                : 'border border-[#05070E]/15 dark:border-white/15 text-[#5E5E6E] dark:text-[#A4A4B5]'
            }`}
          >
            {approvalPerm.allowed ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>Approve</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onRecordApproval({
                targetEnvironment: reviewEnv,
                purpose: reviewPurpose,
                decision: 'rejected',
                note: reviewNote,
              });
              setReviewNote('');
            }}
            className="min-h-[44px] px-2.5 rounded-xl border border-red-500/35 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center justify-center"
            aria-label="Reject approval"
          >
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!approvalPerm.allowed && (
        <div className="text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
          {approvalPerm.reasons[0]}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-[#05070E]/10 dark:border-white/10 space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E5E6E] dark:text-[#9A9AB0]">
            Immutable Approval History ({history.length})
          </div>
          {history.slice(0, 3).map((rec, i) => {
            const isCurrent = rec.specHash === specHash && rec.artifactVersion === spec.version;
            return (
              <div
                key={rec.id ?? `apr-${i}`}
                className="rounded-lg bg-[#F7F7FA] dark:bg-[#05070E] px-2.5 py-1.5 font-mono text-[11px] flex flex-wrap items-center justify-between gap-2"
              >
                <span className="truncate">
                  {rec.decision?.toUpperCase() || (rec.approved ? 'APPROVED' : 'REJECTED')} ·{' '}
                  {rec.purpose ?? 'publication'} → {rec.targetEnvironment ?? 'production'} ·{' '}
                  {rec.artifactVersion ?? spec.version}
                </span>
                <span
                  className={
                    isCurrent && rec.approved && rec.decision !== 'rejected'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[#5E5E6E] dark:text-[#9A9AB0]'
                  }
                >
                  {isCurrent ? 'Current Hash' : 'Historical/Stale'} · {rec.reviewerLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

interface GovernedPublishSheetProps {
  open: boolean;
  onClose: () => void;
  artifactType: DecisionArtifactType;
  titleLabel: string;
  spec: DecisionArtifactSpec;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  publishEnv: DecisionEnvironment;
  onChangePublishEnv: (env: DecisionEnvironment) => void;
  publishSummary: string;
  onChangePublishSummary: (summary: string) => void;
  onRecordApproval: (params: {
    targetEnvironment: DecisionEnvironment;
    purpose: DecisionApprovalPurpose;
    decision: 'approved' | 'rejected';
    note: string;
  }) => void;
  onConfirmPublish: () => void;
}

export const GovernedPublishSheet: React.FC<GovernedPublishSheetProps> = ({
  open,
  onClose,
  artifactType,
  titleLabel,
  spec,
  workspaceRole,
  settings,
  collections = {},
  publishEnv,
  onChangePublishEnv,
  publishSummary,
  onChangePublishSummary,
  onRecordApproval,
  onConfirmPublish,
}) => {
  const specHash = useMemo(
    () => computeArtifactSpecHash(artifactType, spec),
    [artifactType, spec]
  );
  const approvalReport = useMemo(
    () => inspectApprovalFreshness(artifactType, spec, publishEnv, 'publication'),
    [artifactType, spec, publishEnv]
  );
  const policy = useMemo(
    () =>
      evaluatePublishGovernancePolicy(
        artifactType,
        spec,
        publishEnv,
        workspaceRole,
        settings,
        collections,
        { purpose: 'publication' }
      ),
    [artifactType, spec, publishEnv, workspaceRole, settings, collections]
  );
  const approvalPerm = useMemo(
    () => checkApprovalPermission(workspaceRole, settings),
    [workspaceRole, settings]
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Publish Immutable ${titleLabel}?`}
      subtitle="Publishes a verified canonical SHA-256 snapshot referenced by SOPIN Flow & Runtime. Local prototype enforcement."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] p-3 font-mono text-[11px] space-y-1">
          <div>Artifact: {spec.name} ({spec.id})</div>
          <div>Working Version: {spec.version} ({spec.status})</div>
          <div className="truncate">Canonical SHA-256: {specHash}</div>
          <div>Simulated Actor Role: {workspaceRole}</div>
        </div>

        {!policy.allowed && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/45 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200 space-y-1"
          >
            <div className="font-semibold">Publish Blocked by Governance &amp; Validation</div>
            {policy.reasons.map((r, i) => (
              <div key={i} className="font-mono text-[11px]">
                • {r}
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor={`pub-env-${artifactType}`} className="block text-xs font-semibold mb-1.5">
            Target Environment
          </label>
          <select
            id={`pub-env-${artifactType}`}
            value={publishEnv}
            onChange={(e) => onChangePublishEnv(e.target.value as DecisionEnvironment)}
            className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
          >
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>

        {publishEnv === 'production' && settings.requireControlApprovalForProd && (
          <div className="rounded-xl border border-[#2563EB]/35 bg-[#2563EB]/[0.06] p-3 space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">
                  SOPIN Control Publication Approval (Local Prototype Gate)
                </div>
                <div className="text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                  {approvalReport.valid
                    ? `Bound to ${spec.version} · ${specHash.slice(0, 18)}… · ${approvalReport.matchedApproval?.reviewerLabel}`
                    : approvalReport.reason}
                </div>
              </div>
              {approvalReport.valid && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              )}
            </div>

            {!approvalReport.valid && (
              <button
                type="button"
                onClick={() =>
                  onRecordApproval({
                    targetEnvironment: 'production',
                    purpose: 'publication',
                    decision: 'approved',
                    note: publishSummary.trim() || `Publication approval for ${spec.version}`,
                  })
                }
                className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                  approvalPerm.allowed
                    ? 'bg-[#05070E] dark:bg-white text-white dark:text-[#05070E]'
                    : 'border border-[#05070E]/15 dark:border-white/15 text-[#5E5E6E] dark:text-[#A4A4B5]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>
                  Record Bound Publication Approval as {workspaceRole} (Simulated)
                </span>
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`pub-note-${artifactType}`} className="block text-xs font-semibold mb-1.5">
            Release Notes / Change Summary
          </label>
          <input
            id={`pub-note-${artifactType}`}
            type="text"
            value={publishSummary}
            onChange={(e) => onChangePublishSummary(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmPublish}
            className={`min-h-[44px] rounded-xl text-xs font-semibold ${
              policy.allowed
                ? 'bg-[#2563EB] text-white'
                : 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200'
            }`}
          >
            {policy.allowed ? 'Confirm Publish' : 'Attempt Publish (Blocked)'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
