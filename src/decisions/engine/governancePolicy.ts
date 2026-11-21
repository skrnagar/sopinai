import {
  DecisionApprovalDecision,
  DecisionApprovalPurpose,
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionAuditRecord,
  DecisionEnvironment,
  DecisionLifecycleOperation,
  DecisionReviewApproval,
  DecisionSettings,
  DecisionsWorkspaceSlice,
  DecisionTableSpec,
  DecisionTestCase,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import { verifySnapshotIntegrity } from './executionTrace';
import { validateArtifact, ValidationCollections } from './validators';
import {
  buildPublishedArtifactVersion,
  computeArtifactSpecHash,
  isPublishedSnapshotStatus,
  rollbackArtifactToSnapshot,
} from './versioning';

export interface GovernancePolicyCheck {
  allowed: boolean;
  reasons: string[];
  warnings: string[];
  requiredAction?: string;
}

export type CanonicalWorkspaceRole =
  | 'owner'
  | 'admin'
  | 'maintainer'
  | 'architect'
  | 'builder'
  | 'member'
  | 'viewer';

export interface RoleCapabilities {
  rawRole: string;
  canonicalRole: CanonicalWorkspaceRole;
  canEdit: boolean;
  canPublish: boolean;
  canPromote: boolean;
  canRollback: boolean;
  canApprove: boolean;
}

export interface ApprovalFreshnessReport {
  valid: boolean;
  status:
    | 'valid'
    | 'missing'
    | 'rejected'
    | 'stale-spec'
    | 'stale-version'
    | 'wrong-purpose'
    | 'wrong-environment'
    | 'wrong-artifact';
  currentSpecHash: string;
  matchedApproval?: DecisionReviewApproval;
  reason?: string;
}

export interface TestEvidenceFreshnessReport {
  hasTests: boolean;
  allPassed: boolean;
  allCurrentForSpec: boolean;
  staleCaseCount: number;
  failedCaseCount: number;
  unrunCaseCount: number;
  mismatchedArtifactCount: number;
  currentSpecHash: string;
}

export interface GovernedOperationResult<T extends DecisionArtifactSpec = DecisionArtifactSpec> {
  allowed: boolean;
  updatedSpec?: T;
  reasons: string[];
  warnings: string[];
  auditEvent: DecisionAuditRecord;
}

/**
 * Frontend Prototype Governance Policy Layer.
 * Evaluates SOPIN Control rules locally against active workspace role & DecisionSettings.
 * Explicitly simulated local prototype state — not a production authentication or security boundary.
 */

let monotonicSeq = 0;
function nextLocalId(prefix: string): string {
  monotonicSeq = (monotonicSeq + 1) % 100000;
  return `${prefix}-${Date.now().toString(36)}-${monotonicSeq.toString(36)}`;
}

function simulatedTimestampNow(explicit?: string): string {
  if (explicit) return explicit;
  return `${new Date().toISOString()} (Simulated Local)`;
}

const EXACT_ROLE_MAP: Record<string, CanonicalWorkspaceRole> = {
  owner: 'owner',
  'workspace owner': 'owner',
  'org owner': 'owner',
  'organization owner': 'owner',
  admin: 'admin',
  'workspace admin': 'admin',
  administrator: 'admin',
  'org admin': 'admin',
  'organization admin': 'admin',
  'workspace maintainer': 'maintainer',
  maintainer: 'maintainer',
  'automation architect': 'architect',
  architect: 'architect',
  builder: 'builder',
  'workspace builder': 'builder',
  'decision author': 'builder',
  'rule author': 'builder',
  editor: 'builder',
  'workspace member': 'member',
  member: 'member',
  viewer: 'viewer',
  'read-only': 'viewer',
  readonly: 'viewer',
  'read only': 'viewer',
  guest: 'viewer',
  auditor: 'viewer',
};

export function normalizeWorkspaceRole(workspaceRole: string): CanonicalWorkspaceRole {
  const cleaned = workspaceRole.trim().toLowerCase().replace(/\s+/g, ' ');
  return EXACT_ROLE_MAP[cleaned] ?? 'viewer';
}

function isCanonicalEditAuthorized(
  canonical: CanonicalWorkspaceRole,
  policy: DecisionSettings['allowedEditorsRole']
): boolean {
  if (canonical === 'viewer') return false;
  if (policy === 'All Workspace Members') {
    return (
      canonical === 'owner' ||
      canonical === 'admin' ||
      canonical === 'maintainer' ||
      canonical === 'architect' ||
      canonical === 'builder' ||
      canonical === 'member'
    );
  }
  if (policy === 'Builders & Maintainers') {
    return (
      canonical === 'owner' ||
      canonical === 'admin' ||
      canonical === 'maintainer' ||
      canonical === 'architect' ||
      canonical === 'builder'
    );
  }
  return canonical === 'owner' || canonical === 'admin';
}

function isCanonicalPublishAuthorized(
  canonical: CanonicalWorkspaceRole,
  policy: DecisionSettings['allowedPublishersRole']
): boolean {
  if (policy === 'Workspace Maintainer') {
    return (
      canonical === 'owner' ||
      canonical === 'admin' ||
      canonical === 'maintainer' ||
      canonical === 'architect'
    );
  }
  return canonical === 'owner' || canonical === 'admin';
}

export function getRoleCapabilities(
  workspaceRole: string,
  settings: DecisionSettings
): RoleCapabilities {
  const canonicalRole = normalizeWorkspaceRole(workspaceRole);
  const canEdit = isCanonicalEditAuthorized(canonicalRole, settings.allowedEditorsRole);
  const canPublish = isCanonicalPublishAuthorized(canonicalRole, settings.allowedPublishersRole);
  return {
    rawRole: workspaceRole,
    canonicalRole,
    canEdit,
    canPublish,
    canPromote: canPublish,
    canRollback: canPublish,
    canApprove: canPublish,
  };
}

export function checkEditPermission(
  workspaceRole: string,
  settings: DecisionSettings
): GovernancePolicyCheck {
  const caps = getRoleCapabilities(workspaceRole, settings);
  if (caps.canEdit) {
    return { allowed: true, reasons: [], warnings: [] };
  }
  return {
    allowed: false,
    reasons: [
      `Role "${workspaceRole}" (normalized: ${caps.canonicalRole}) cannot modify Decisions artifacts while policy requires "${settings.allowedEditorsRole}".`,
    ],
    warnings: [],
    requiredAction:
      'Switch to an authorized role or adjust Editing Permissions under Decisions Settings.',
  };
}

export function checkPublishPermission(
  workspaceRole: string,
  settings: DecisionSettings,
  actionLabel = 'publish'
): GovernancePolicyCheck {
  const caps = getRoleCapabilities(workspaceRole, settings);
  if (caps.canPublish) {
    return { allowed: true, reasons: [], warnings: [] };
  }
  return {
    allowed: false,
    reasons: [
      `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} blocked: role "${workspaceRole}" (normalized: ${caps.canonicalRole}) does not satisfy Publish Authority policy ("${settings.allowedPublishersRole}").`,
    ],
    warnings: [],
    requiredAction: `Switch to an authorized publisher role (${settings.allowedPublishersRole}).`,
  };
}

export function checkApprovalPermission(
  workspaceRole: string,
  settings: DecisionSettings
): GovernancePolicyCheck {
  const caps = getRoleCapabilities(workspaceRole, settings);
  if (caps.canApprove) {
    return { allowed: true, reasons: [], warnings: [] };
  }
  return {
    allowed: false,
    reasons: [
      `Approval blocked: role "${workspaceRole}" (normalized: ${caps.canonicalRole}) cannot record Control approvals under Publish Authority policy ("${settings.allowedPublishersRole}").`,
    ],
    warnings: [],
    requiredAction: `An authorized reviewer (${settings.allowedPublishersRole}) must record approval.`,
  };
}

export function checkTestEvidenceFreshness(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec
): TestEvidenceFreshnessReport {
  const testCases: DecisionTestCase[] = Array.isArray(spec.testCases) ? spec.testCases : [];
  const currentSpecHash = computeArtifactSpecHash(type, spec);
  let failedCaseCount = 0;
  let unrunCaseCount = 0;
  let staleCaseCount = 0;
  let mismatchedArtifactCount = 0;

  for (const tc of testCases) {
    if (tc.lastPassed === undefined) {
      unrunCaseCount++;
      continue;
    }
    if (tc.lastPassed === false) {
      failedCaseCount++;
    }
    const artifactMismatch =
      tc.testedArtifactId !== spec.id || tc.testedArtifactType !== type;
    const versionMismatch = !tc.testedVersion || tc.testedVersion !== spec.version;
    const hashMismatch = !tc.testedSpecHash || tc.testedSpecHash !== currentSpecHash;

    if (artifactMismatch) {
      mismatchedArtifactCount++;
    }
    if (artifactMismatch || versionMismatch || hashMismatch) {
      staleCaseCount++;
    }
  }

  return {
    hasTests: testCases.length > 0,
    allPassed: testCases.length > 0 && failedCaseCount === 0 && unrunCaseCount === 0,
    allCurrentForSpec: testCases.length > 0 && staleCaseCount === 0 && mismatchedArtifactCount === 0,
    staleCaseCount,
    failedCaseCount,
    unrunCaseCount,
    mismatchedArtifactCount,
    currentSpecHash,
  };
}

/**
 * Independently verifies whether test evidence exists for an immutable snapshot in versionHistory,
 * even after later draft edits modify working test cases.
 */
export function checkPublishedSnapshotTestEvidence(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  targetVersion: string
): {
  verified: boolean;
  passedCount: number;
  failedCount: number;
  unverifiedCount: number;
  snapshotHash: string;
  reason?: string;
} {
  const snap = (spec.versionHistory ?? []).find((s) => s.version === targetVersion);
  if (!snap) {
    return {
      verified: false,
      passedCount: 0,
      failedCount: 0,
      unverifiedCount: 0,
      snapshotHash: '',
      reason: `Snapshot "${targetVersion}" not found.`,
    };
  }
  const integrity = verifySnapshotIntegrity(snap);
  if (!integrity.valid) {
    return {
      verified: false,
      passedCount: 0,
      failedCount: 0,
      unverifiedCount: 0,
      snapshotHash: snap.snapshotHash,
      reason: `Snapshot integrity failed: ${integrity.reason}`,
    };
  }

  const testCases = Array.isArray(spec.testCases) ? spec.testCases : [];
  if (testCases.length === 0) {
    return {
      verified: false,
      passedCount: 0,
      failedCount: 0,
      unverifiedCount: 0,
      snapshotHash: snap.snapshotHash,
      reason: 'No test cases exist on artifact.',
    };
  }

  let passedCount = 0;
  let failedCount = 0;
  let unverifiedCount = 0;

  for (const tc of testCases) {
    const matchingRun = (tc.runHistory ?? []).find(
      (rh) =>
        rh.testedVersion === snap.version &&
        rh.testedSpecHash === snap.snapshotHash &&
        (!rh.testedArtifactId || rh.testedArtifactId === spec.id) &&
        (!rh.testedArtifactType || rh.testedArtifactType === type)
    );
    if (matchingRun) {
      if (matchingRun.passed) passedCount++;
      else failedCount++;
      continue;
    }

    const topLevelMatches =
      tc.lastPassed !== undefined &&
      tc.testedVersion === snap.version &&
      tc.testedSpecHash === snap.snapshotHash &&
      tc.testedArtifactId === spec.id &&
      tc.testedArtifactType === type;
    if (topLevelMatches) {
      if (tc.lastPassed) passedCount++;
      else failedCount++;
    } else {
      unverifiedCount++;
    }
  }

  const verified = passedCount > 0 && failedCount === 0 && unverifiedCount === 0;
  return {
    verified,
    passedCount,
    failedCount,
    unverifiedCount,
    snapshotHash: snap.snapshotHash,
    reason: verified
      ? undefined
      : `Snapshot ${snap.version} (${snap.snapshotHash}) lacks complete passing test runs.`,
  };
}

export function createApprovalRecord(params: {
  type: DecisionArtifactType;
  spec: DecisionArtifactSpec;
  targetEnvironment: DecisionEnvironment;
  purpose: DecisionApprovalPurpose;
  decision?: DecisionApprovalDecision;
  workspaceRole: string;
  reviewerLabel?: string;
  note?: string;
  timestamp?: string;
  rollbackTargetVersion?: string;
}): DecisionReviewApproval {
  const decision = params.decision ?? 'approved';
  const specHash = computeArtifactSpecHash(params.type, params.spec);
  const actor =
    params.reviewerLabel?.trim() || `${params.workspaceRole} (Simulated Local Reviewer)`;

  return {
    id: nextLocalId('apr'),
    approved: decision === 'approved',
    decision,
    purpose: params.purpose,
    artifactType: params.type,
    artifactId: params.spec.id,
    artifactVersion: params.spec.version,
    specHash,
    targetEnvironment: params.targetEnvironment,
    reviewerLabel: actor,
    reviewerRole: params.workspaceRole,
    approvedAt: simulatedTimestampNow(params.timestamp),
    note: params.note?.trim() || `${params.purpose} ${decision} for ${params.targetEnvironment}`,
    controlRequired:
      params.targetEnvironment === 'production' || params.purpose === 'production-promotion',
    isSimulatedIdentity: true,
    prototypeNote:
      'Simulated local prototype approval record; does not provide production authentication or cryptographic server enforcement.',
    rollbackTargetVersion: params.rollbackTargetVersion,
  };
}

function isBoundApprovalComplete(candidate: DecisionReviewApproval | undefined): boolean {
  return Boolean(
    candidate &&
      candidate.artifactType &&
      candidate.artifactId &&
      candidate.artifactVersion &&
      candidate.specHash &&
      candidate.targetEnvironment &&
      candidate.purpose
  );
}

export function inspectApprovalFreshness(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  targetEnvironment: DecisionEnvironment,
  purpose: DecisionApprovalPurpose,
  explicitApproval?: DecisionReviewApproval
): ApprovalFreshnessReport {
  const currentSpecHash = computeArtifactSpecHash(type, spec);
  const history = Array.isArray(spec.approvalHistory) ? spec.approvalHistory : [];
  const candidates: DecisionReviewApproval[] = [];

  if (explicitApproval) candidates.push(explicitApproval);
  for (const h of history) {
    if (!candidates.some((c) => c === h || (c.id && h.id && c.id === h.id))) {
      candidates.push(h);
    }
  }
  if (
    spec.reviewApproval &&
    !candidates.some(
      (c) => c === spec.reviewApproval || (c.id && spec.reviewApproval?.id && c.id === spec.reviewApproval.id)
    )
  ) {
    candidates.push(spec.reviewApproval);
  }

  // Find the most recent fully-bound candidate matching the exact tuple
  const exactMatch = candidates.find(
    (c) =>
      isBoundApprovalComplete(c) &&
      c.artifactType === type &&
      c.artifactId === spec.id &&
      c.artifactVersion === spec.version &&
      c.specHash === currentSpecHash &&
      c.targetEnvironment === targetEnvironment &&
      c.purpose === purpose
  );

  if (exactMatch) {
    const isRejected = exactMatch.decision === 'rejected' || !exactMatch.approved;
    if (isRejected) {
      return {
        valid: false,
        status: 'rejected',
        currentSpecHash,
        matchedApproval: exactMatch,
        reason: `Approval record (${exactMatch.id ?? 'local'}) for ${spec.version} (${purpose} -> ${targetEnvironment}) was rejected by ${exactMatch.reviewerLabel}.`,
      };
    }
    return {
      valid: true,
      status: 'valid',
      currentSpecHash,
      matchedApproval: exactMatch,
    };
  }

  // Otherwise classify why prior approvals (if any) are invalid/stale
  if (candidates.length === 0) {
    return {
      valid: false,
      status: 'missing',
      currentSpecHash,
      reason: `No bound ${purpose} approval exists for ${type} "${spec.name}" ${spec.version} (${targetEnvironment}).`,
    };
  }

  const incomplete = candidates.find((c) => !isBoundApprovalComplete(c));
  const wrongArtifact = candidates.find(
    (c) =>
      (c.artifactId && c.artifactId !== spec.id) ||
      (c.artifactType && c.artifactType !== type)
  );
  if (wrongArtifact) {
    return {
      valid: false,
      status: 'wrong-artifact',
      currentSpecHash,
      reason: `Approval belongs to a different artifact (${wrongArtifact.artifactType}:${wrongArtifact.artifactId}) and cannot be reused.`,
    };
  }

  const sameHashSameVersion = candidates.filter(
    (c) =>
      c.artifactId === spec.id &&
      c.artifactType === type &&
      c.artifactVersion === spec.version &&
      c.specHash === currentSpecHash
  );
  const wrongPurpose = sameHashSameVersion.find(
    (c) => c.targetEnvironment === targetEnvironment && c.purpose !== purpose
  );
  if (wrongPurpose) {
    return {
      valid: false,
      status: 'wrong-purpose',
      currentSpecHash,
      reason: `Existing "${wrongPurpose.purpose}" approval does not authorize "${purpose}"; separate ${purpose} approval is required.`,
    };
  }

  const wrongEnv = sameHashSameVersion.find(
    (c) => c.purpose === purpose && c.targetEnvironment !== targetEnvironment
  );
  if (wrongEnv) {
    return {
      valid: false,
      status: 'wrong-environment',
      currentSpecHash,
      reason: `Approval for environment "${wrongEnv.targetEnvironment}" does not authorize "${targetEnvironment}".`,
    };
  }

  const staleSpec = candidates.find(
    (c) =>
      c.artifactId === spec.id &&
      c.artifactType === type &&
      c.specHash &&
      c.specHash !== currentSpecHash
  );
  if (staleSpec) {
    return {
      valid: false,
      status: 'stale-spec',
      currentSpecHash,
      reason: `Approval (${staleSpec.id ?? 'prior'}) is stale because the ${type} specification changed after approval (approved hash ${staleSpec.specHash}, live hash ${currentSpecHash}).`,
    };
  }

  const staleVersion = candidates.find(
    (c) =>
      c.artifactId === spec.id &&
      c.artifactType === type &&
      c.artifactVersion &&
      c.artifactVersion !== spec.version
  );
  if (staleVersion) {
    return {
      valid: false,
      status: 'stale-version',
      currentSpecHash,
      reason: `Approval for version ${staleVersion.artifactVersion} does not authorize version ${spec.version}.`,
    };
  }

  if (incomplete) {
    return {
      valid: false,
      status: 'missing',
      currentSpecHash,
      reason: `Legacy or unbound approval metadata lacks artifact/version/specHash/environment/purpose binding and is rejected.`,
    };
  }

  return {
    valid: false,
    status: 'missing',
    currentSpecHash,
    reason: `No valid ${purpose} approval bound to ${spec.version} (${currentSpecHash}) for ${targetEnvironment}.`,
  };
}

export function evaluatePublishGovernancePolicy(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  targetEnvironment: DecisionEnvironment,
  workspaceRole: string,
  settings: DecisionSettings,
  collections: ValidationCollections = {},
  approvalOrOptions?:
    | DecisionReviewApproval
    | {
        approval?: DecisionReviewApproval;
        purpose?: DecisionApprovalPurpose;
      }
): GovernancePolicyCheck {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const optionsObj =
    approvalOrOptions && ('purpose' in approvalOrOptions || 'approval' in approvalOrOptions) && !('approved' in approvalOrOptions)
      ? approvalOrOptions
      : { approval: approvalOrOptions as DecisionReviewApproval | undefined, purpose: undefined };
  const requiredPurpose: DecisionApprovalPurpose = optionsObj.purpose ?? 'publication';

  const pubPerm = checkPublishPermission(
    workspaceRole,
    settings,
    requiredPurpose === 'production-promotion' ? 'production promotion' : 'publishing'
  );
  if (!pubPerm.allowed) {
    reasons.push(...pubPerm.reasons);
  }

  const level = targetEnvironment === 'production' ? 'production-promotion' : 'publication';
  const validation = validateArtifact(type, spec, level, collections);
  if (!validation.isValid) {
    reasons.push(...validation.errors.map((e) => e.message));
  }
  warnings.push(...validation.warnings.map((w) => w.message));

  if (settings.requireTestPassBeforePublish) {
    const evidence = checkTestEvidenceFreshness(type, spec);
    if (!evidence.hasTests) {
      reasons.push(
        'Test gate enforced: at least one golden regression test case is required before publishing.'
      );
    } else {
      if (evidence.failedCaseCount > 0) {
        reasons.push(
          `Test gate enforced: ${evidence.failedCaseCount} regression test case(s) failed.`
        );
      }
      if (evidence.unrunCaseCount > 0) {
        reasons.push(
          `Test gate enforced: ${evidence.unrunCaseCount} regression test case(s) have not been executed.`
        );
      }
      if (evidence.mismatchedArtifactCount > 0) {
        reasons.push(
          `Test gate enforced: ${evidence.mismatchedArtifactCount} test result(s) belong to a different artifact ID/type and cannot authorize ${spec.id}.`
        );
      }
      if (evidence.staleCaseCount > evidence.mismatchedArtifactCount) {
        reasons.push(
          `Test gate enforced: ${evidence.staleCaseCount - evidence.mismatchedArtifactCount} test result(s) belong to a prior draft/version/spec hash and must be re-run against ${spec.version}.`
        );
      }
    }
  }

  if (targetEnvironment === 'production' && settings.requireControlApprovalForProd) {
    const freshness = inspectApprovalFreshness(
      type,
      spec,
      targetEnvironment,
      requiredPurpose,
      optionsObj.approval
    );
    if (!freshness.valid) {
      reasons.push(
        freshness.reason ||
          `Production gate enforced: explicit bound ${requiredPurpose} approval is required before ${targetEnvironment} release.`
      );
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    warnings,
    requiredAction: reasons.length > 0 ? reasons[0] : undefined,
  };
}

function buildAuditRecord(params: {
  workspaceId: string;
  actor: string;
  actorRole: string;
  operation: DecisionLifecycleOperation;
  action: string;
  artifactType: DecisionArtifactType;
  artifactId: string;
  artifactName: string;
  previousVersion?: string;
  resultingVersion?: string;
  specHash: string;
  targetEnvironment?: DecisionEnvironment;
  approvalId?: string;
  outcome: DecisionAuditRecord['outcome'];
  reason: string;
  timestamp?: string;
}): DecisionAuditRecord {
  return {
    id: nextLocalId('aud'),
    workspaceId: params.workspaceId,
    timestamp: simulatedTimestampNow(params.timestamp),
    actor: `${params.actor} (Simulated Local Actor)`,
    actorRole: params.actorRole,
    isSimulatedActor: true,
    action: params.action,
    operation: params.operation,
    artifactType: params.artifactType,
    artifactId: params.artifactId,
    artifactName: params.artifactName,
    previousVersion: params.previousVersion,
    resultingVersion: params.resultingVersion,
    specHash: params.specHash,
    targetEnvironment: params.targetEnvironment,
    approvalId: params.approvalId,
    outcome: params.outcome,
    reason: params.reason,
  };
}

export function performGovernedSave<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  previousSpec?: T;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  actorLabel?: string;
  targetStatus?: 'Draft' | 'Validated';
  note?: string;
  timestamp?: string;
}): GovernedOperationResult<T> {
  const { type, spec, previousSpec, workspaceRole, settings, collections = {} } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.actorLabel?.trim() || workspaceRole;
  const perm = checkEditPermission(workspaceRole, settings);

  if (!perm.allowed) {
    return {
      allowed: false,
      reasons: perm.reasons,
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'save',
        action: `Blocked save on ${type} "${spec.name}"`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: previousSpec?.version ?? spec.version,
        specHash,
        targetEnvironment: spec.environment,
        outcome: 'Blocked',
        reason: perm.reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const validation = validateArtifact(type, spec, 'draft', collections);
  if (!validation.isValid) {
    const reasons = validation.errors.map((e) => e.message);
    return {
      allowed: false,
      reasons,
      warnings: validation.warnings.map((w) => w.message),
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'save',
        action: `Blocked invalid save on ${type} "${spec.name}"`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: previousSpec?.version ?? spec.version,
        specHash,
        targetEnvironment: spec.environment,
        outcome: 'Blocked',
        reason: reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const prevHash = previousSpec ? computeArtifactSpecHash(type, previousSpec) : undefined;
  const specChanged = Boolean(
    previousSpec && (prevHash !== specHash || previousSpec.version !== spec.version)
  );
  const isLeavingPublished =
    (spec.status === 'Published' || spec.status === 'Promoted') &&
    !spec.version.includes('-draft') &&
    (!previousSpec || specChanged);

  const nextVersion = isLeavingPublished ? `${spec.version}-draft` : spec.version;
  const nextStatus = params.targetStatus ?? (isLeavingPublished ? 'Draft' : spec.status === 'Promoted' || spec.status === 'Published' ? 'Draft' : spec.status);

  // Invalidate any stale working reviewApproval if specHash or version no longer matches, preserving approvalHistory
  const existingApproval = spec.reviewApproval;
  const approvalStillMatches = Boolean(
    existingApproval &&
      existingApproval.approved &&
      existingApproval.decision !== 'rejected' &&
      existingApproval.artifactId === spec.id &&
      existingApproval.artifactType === type &&
      existingApproval.specHash === specHash &&
      existingApproval.artifactVersion === nextVersion
  );

  // Enforce immutable historical snapshots when previousSpec is present
  const preservedHistory = previousSpec
    ? [
        ...spec.versionHistory.filter(
          (nv) => !previousSpec.versionHistory.some((ev) => ev.version === nv.version)
        ),
        ...previousSpec.versionHistory,
      ]
    : spec.versionHistory;

  const updatedSpec: T = {
    ...spec,
    version: nextVersion,
    status: nextStatus,
    reviewApproval: approvalStillMatches ? existingApproval : undefined,
    approvalHistory: spec.approvalHistory ?? previousSpec?.approvalHistory ?? [],
    versionHistory: preservedHistory,
    updatedAt: 'Just now',
  };

  return {
    allowed: true,
    updatedSpec,
    reasons: [],
    warnings: validation.warnings.map((w) => w.message),
    auditEvent: buildAuditRecord({
      workspaceId: updatedSpec.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'save',
      action: params.note || `Saved ${type} "${updatedSpec.name}" (${updatedSpec.version})`,
      artifactType: type,
      artifactId: updatedSpec.id,
      artifactName: updatedSpec.name,
      previousVersion: previousSpec?.version ?? spec.version,
      resultingVersion: updatedSpec.version,
      specHash,
      targetEnvironment: updatedSpec.environment,
      outcome: 'Updated',
      reason:
        existingApproval && !approvalStillMatches
          ? 'Saved draft changes and invalidated prior stale approval.'
          : 'Saved draft specification cleanly.',
      timestamp: params.timestamp,
    }),
  };
}

export function performGovernedSubmitReview<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  previousSpec?: T;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  actorLabel?: string;
  timestamp?: string;
}): GovernedOperationResult<T> {
  const { type, spec, previousSpec, workspaceRole, settings, collections = {} } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.actorLabel?.trim() || workspaceRole;
  const perm = checkEditPermission(workspaceRole, settings);

  if (!perm.allowed) {
    return {
      allowed: false,
      reasons: perm.reasons,
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'submit-review',
        action: `Blocked review submission for ${type} "${spec.name}"`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment: spec.environment,
        outcome: 'Blocked',
        reason: perm.reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const validation = validateArtifact(type, spec, 'publication', collections);
  if (!validation.isValid) {
    const reasons = validation.errors.map((e) => e.message);
    return {
      allowed: false,
      reasons,
      warnings: validation.warnings.map((w) => w.message),
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'submit-review',
        action: `Blocked invalid review submission for ${type} "${spec.name}"`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment: spec.environment,
        outcome: 'Blocked',
        reason: reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const nextVersion =
    (spec.status === 'Published' || spec.status === 'Promoted') && !spec.version.includes('-draft')
      ? `${spec.version}-draft`
      : spec.version;

  const updatedSpec: T = {
    ...spec,
    version: nextVersion,
    status: 'Review',
    reviewApproval:
      spec.reviewApproval &&
      spec.reviewApproval.specHash === specHash &&
      spec.reviewApproval.artifactVersion === nextVersion &&
      spec.reviewApproval.artifactId === spec.id &&
      spec.reviewApproval.artifactType === type
        ? spec.reviewApproval
        : undefined,
    approvalHistory: spec.approvalHistory ?? previousSpec?.approvalHistory ?? [],
    updatedAt: 'Just now',
  };

  return {
    allowed: true,
    updatedSpec,
    reasons: [],
    warnings: validation.warnings.map((w) => w.message),
    auditEvent: buildAuditRecord({
      workspaceId: updatedSpec.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'submit-review',
      action: `Submitted ${type} "${updatedSpec.name}" (${updatedSpec.version}) for review`,
      artifactType: type,
      artifactId: updatedSpec.id,
      artifactName: updatedSpec.name,
      previousVersion: spec.version,
      resultingVersion: updatedSpec.version,
      specHash,
      targetEnvironment: updatedSpec.environment,
      outcome: 'Allowed',
      reason: 'Artifact passed publication validation and entered Review state.',
      timestamp: params.timestamp,
    }),
  };
}

export function performGovernedApprove<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  targetEnvironment: DecisionEnvironment;
  purpose: DecisionApprovalPurpose;
  decision?: DecisionApprovalDecision;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  reviewerLabel?: string;
  note?: string;
  timestamp?: string;
  rollbackTargetVersion?: string;
}): GovernedOperationResult<T> & { approvalRecord?: DecisionReviewApproval } {
  const {
    type,
    spec,
    targetEnvironment,
    purpose,
    decision = 'approved',
    workspaceRole,
    settings,
    collections = {},
  } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.reviewerLabel?.trim() || workspaceRole;
  const perm = checkApprovalPermission(workspaceRole, settings);

  if (!perm.allowed) {
    return {
      allowed: false,
      reasons: perm.reasons,
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'approve',
        action: `Blocked ${purpose} approval on ${type} "${spec.name}"`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment,
        outcome: 'Blocked',
        reason: perm.reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  if (decision === 'approved' && purpose !== 'rollback') {
    const level = targetEnvironment === 'production' ? 'production-promotion' : 'publication';
    const validation = validateArtifact(type, spec, level, collections);
    if (!validation.isValid) {
      const reasons = validation.errors.map((e) => e.message);
      return {
        allowed: false,
        reasons,
        warnings: validation.warnings.map((w) => w.message),
        auditEvent: buildAuditRecord({
          workspaceId: spec.workspaceId,
          actor,
          actorRole: workspaceRole,
          operation: 'approve',
          action: `Blocked ${purpose} approval for invalid ${type} "${spec.name}"`,
          artifactType: type,
          artifactId: spec.id,
          artifactName: spec.name,
          previousVersion: spec.version,
          specHash,
          targetEnvironment,
          outcome: 'Blocked',
          reason: reasons.join(' '),
          timestamp: params.timestamp,
        }),
      };
    }
  }

  const approvalRecord = createApprovalRecord({
    type,
    spec,
    targetEnvironment,
    purpose,
    decision,
    workspaceRole,
    reviewerLabel: actor,
    note: params.note,
    timestamp: params.timestamp,
    rollbackTargetVersion: params.rollbackTargetVersion,
  });

  const existingHistory = Array.isArray(spec.approvalHistory) ? spec.approvalHistory : [];
  const updatedSpec: T = {
    ...spec,
    reviewApproval: decision === 'approved' ? approvalRecord : undefined,
    approvalHistory: [approvalRecord, ...existingHistory],
    updatedAt: 'Just now',
  };

  return {
    allowed: true,
    updatedSpec,
    approvalRecord,
    reasons: [],
    warnings: [],
    auditEvent: buildAuditRecord({
      workspaceId: updatedSpec.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'approve',
      action: `${decision === 'approved' ? 'Approved' : 'Rejected'} ${purpose} for ${type} "${updatedSpec.name}" (${updatedSpec.version})`,
      artifactType: type,
      artifactId: updatedSpec.id,
      artifactName: updatedSpec.name,
      previousVersion: updatedSpec.version,
      resultingVersion: updatedSpec.version,
      specHash,
      targetEnvironment,
      approvalId: approvalRecord.id,
      outcome: decision === 'approved' ? 'Approved' : 'Rejected',
      reason: approvalRecord.note || `${purpose} ${decision} for ${targetEnvironment}`,
      timestamp: params.timestamp,
    }),
  };
}

export function performGovernedPublish<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  targetEnvironment: DecisionEnvironment;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  summary?: string;
  publishedBy?: string;
  explicitVersion?: string;
  approvalRecord?: DecisionReviewApproval;
  timestamp?: string;
}): GovernedOperationResult<T> {
  const {
    type,
    spec,
    targetEnvironment,
    workspaceRole,
    settings,
    collections = {},
    approvalRecord,
  } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.publishedBy?.trim() || workspaceRole;
  const policy = evaluatePublishGovernancePolicy(
    type,
    spec,
    targetEnvironment,
    workspaceRole,
    settings,
    collections,
    { approval: approvalRecord, purpose: 'publication' }
  );

  const freshness = inspectApprovalFreshness(
    type,
    spec,
    targetEnvironment,
    'publication',
    approvalRecord
  );

  if (!policy.allowed) {
    return {
      allowed: false,
      reasons: policy.reasons,
      warnings: policy.warnings,
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'publish',
        action: `Blocked publish of ${type} "${spec.name}" (${spec.version}) to ${targetEnvironment}`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment,
        approvalId: freshness.matchedApproval?.id,
        outcome: 'Blocked',
        reason: policy.reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const authorizingApproval = freshness.valid ? freshness.matchedApproval : undefined;
  const publishedSpec = buildPublishedArtifactVersion(
    type,
    spec,
    targetEnvironment,
    params.summary?.trim() || `Published immutable ${type} snapshot`,
    `${actor} (Local Prototype)`,
    params.explicitVersion,
    authorizingApproval
  );

  return {
    allowed: true,
    updatedSpec: publishedSpec,
    reasons: [],
    warnings: policy.warnings,
    auditEvent: buildAuditRecord({
      workspaceId: publishedSpec.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'publish',
      action: `Published ${type} "${publishedSpec.name}" ${publishedSpec.version} to ${targetEnvironment}`,
      artifactType: type,
      artifactId: publishedSpec.id,
      artifactName: publishedSpec.name,
      previousVersion: spec.version,
      resultingVersion: publishedSpec.version,
      specHash,
      targetEnvironment,
      approvalId: authorizingApproval?.id,
      outcome: 'Allowed',
      reason:
        params.summary?.trim() ||
        `Immutable snapshot ${publishedSpec.version} published to ${targetEnvironment}.`,
      timestamp: params.timestamp,
    }),
  };
}

export function performGovernedPromote<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  targetEnvironment: DecisionEnvironment;
  workspaceRole: string;
  settings: DecisionSettings;
  collections?: ValidationCollections;
  approvalRecord?: DecisionReviewApproval;
  note?: string;
  actorLabel?: string;
  timestamp?: string;
}): GovernedOperationResult<T> {
  const {
    type,
    spec,
    targetEnvironment,
    workspaceRole,
    settings,
    collections = {},
    approvalRecord,
  } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.actorLabel?.trim() || workspaceRole;
  const requiredPurpose: DecisionApprovalPurpose =
    targetEnvironment === 'production' ? 'production-promotion' : 'publication';

  const reasons: string[] = [];
  if (!isPublishedSnapshotStatus(spec.status)) {
    reasons.push(
      `Promotion blocked: ${type} "${spec.name}" is in "${spec.status}" state and must be published as an immutable version before environment promotion.`
    );
  }
  if (spec.environment === targetEnvironment) {
    reasons.push(
      `Promotion skipped: ${type} "${spec.name}" is already in "${targetEnvironment}".`
    );
  }

  const policy = evaluatePublishGovernancePolicy(
    type,
    spec,
    targetEnvironment,
    workspaceRole,
    settings,
    collections,
    { approval: approvalRecord, purpose: requiredPurpose }
  );
  reasons.push(...policy.reasons);

  const freshness = inspectApprovalFreshness(
    type,
    spec,
    targetEnvironment,
    requiredPurpose,
    approvalRecord
  );

  if (reasons.length > 0) {
    return {
      allowed: false,
      reasons,
      warnings: policy.warnings,
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'promote',
        action: `Blocked promotion of ${type} "${spec.name}" (${spec.version}) to ${targetEnvironment}`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment,
        approvalId: freshness.matchedApproval?.id,
        outcome: 'Blocked',
        reason: reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const authorizingApproval = freshness.valid ? freshness.matchedApproval : undefined;
  const existingApprovals = Array.isArray(spec.approvalHistory) ? spec.approvalHistory : [];
  const nextApprovals =
    authorizingApproval &&
    (!authorizingApproval.id || !existingApprovals.some((a) => a.id === authorizingApproval.id))
      ? [authorizingApproval, ...existingApprovals]
      : existingApprovals;

  const promotedSpec: T = {
    ...spec,
    environment: targetEnvironment,
    status: targetEnvironment === 'production' ? 'Promoted' : 'Published',
    // Clear working reviewApproval after promotion so a consumed promotion approval is never reused later
    reviewApproval: undefined,
    approvalHistory: nextApprovals,
    updatedAt: 'Just now',
  };

  return {
    allowed: true,
    updatedSpec: promotedSpec,
    reasons: [],
    warnings: policy.warnings,
    auditEvent: buildAuditRecord({
      workspaceId: promotedSpec.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'promote',
      action: `Promoted ${type} "${promotedSpec.name}" (${promotedSpec.version}) to ${targetEnvironment}`,
      artifactType: type,
      artifactId: promotedSpec.id,
      artifactName: promotedSpec.name,
      previousVersion: spec.version,
      resultingVersion: promotedSpec.version,
      specHash,
      targetEnvironment,
      approvalId: authorizingApproval?.id,
      outcome: 'Allowed',
      reason:
        params.note?.trim() ||
        `Promoted ${spec.version} from ${spec.environment} to ${targetEnvironment}.`,
      timestamp: params.timestamp,
    }),
  };
}

export function performGovernedRollback<T extends DecisionArtifactSpec>(params: {
  type: DecisionArtifactType;
  spec: T;
  targetVersion: string;
  workspaceRole: string;
  settings: DecisionSettings;
  approvalRecord?: DecisionReviewApproval;
  actorLabel?: string;
  note?: string;
  timestamp?: string;
}): GovernedOperationResult<T> {
  const { type, spec, targetVersion, workspaceRole, settings, approvalRecord } = params;
  const specHash = computeArtifactSpecHash(type, spec);
  const actor = params.actorLabel?.trim() || workspaceRole;
  const reasons: string[] = [];

  const perm = checkPublishPermission(workspaceRole, settings, 'rollback');
  if (!perm.allowed) {
    reasons.push(...perm.reasons);
  }

  const targetSnap = (spec.versionHistory ?? []).find((s) => s.version === targetVersion);
  if (!targetSnap) {
    reasons.push(`Snapshot "${targetVersion}" not found in immutable versionHistory.`);
  }

  const targetEnv: DecisionEnvironment = targetSnap?.environment ?? spec.environment;
  const requiresRollbackApproval =
    settings.requireControlApprovalForProd &&
    (spec.environment === 'production' || targetEnv === 'production');

  const freshness = inspectApprovalFreshness(
    type,
    spec,
    targetEnv,
    'rollback',
    approvalRecord
  );

  if (requiresRollbackApproval && !freshness.valid) {
    reasons.push(
      freshness.reason ||
        `Rollback touching production requires explicit bound rollback approval for ${spec.version}.`
    );
  }

  if (reasons.length > 0) {
    return {
      allowed: false,
      reasons,
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'rollback',
        action: `Blocked rollback of ${type} "${spec.name}" to ${targetVersion}`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment: targetEnv,
        approvalId: freshness.matchedApproval?.id,
        outcome: 'Blocked',
        reason: reasons.join(' '),
        timestamp: params.timestamp,
      }),
    };
  }

  const { rolledBack, error } = rollbackArtifactToSnapshot(
    type,
    spec,
    targetVersion,
    `${actor} (Local Rollback)`
  );

  if (!rolledBack) {
    const errReason = error || `Rollback failed for snapshot "${targetVersion}".`;
    return {
      allowed: false,
      reasons: [errReason],
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: spec.workspaceId,
        actor,
        actorRole: workspaceRole,
        operation: 'rollback',
        action: `Blocked corrupted rollback of ${type} "${spec.name}" to ${targetVersion}`,
        artifactType: type,
        artifactId: spec.id,
        artifactName: spec.name,
        previousVersion: spec.version,
        specHash,
        targetEnvironment: targetEnv,
        outcome: 'Blocked',
        reason: errReason,
        timestamp: params.timestamp,
      }),
    };
  }

  const authorizingApproval = freshness.valid ? freshness.matchedApproval : undefined;
  const existingApprovals = Array.isArray(rolledBack.approvalHistory)
    ? rolledBack.approvalHistory
    : [];
  const nextApprovals =
    authorizingApproval &&
    (!authorizingApproval.id || !existingApprovals.some((a) => a.id === authorizingApproval.id))
      ? [authorizingApproval, ...existingApprovals]
      : existingApprovals;

  const cleanRolledBack: T = {
    ...rolledBack,
    reviewApproval: undefined,
    approvalHistory: nextApprovals,
  };

  return {
    allowed: true,
    updatedSpec: cleanRolledBack,
    reasons: [],
    warnings: [],
    auditEvent: buildAuditRecord({
      workspaceId: cleanRolledBack.workspaceId,
      actor,
      actorRole: workspaceRole,
      operation: 'rollback',
      action: `Rolled back ${type} "${cleanRolledBack.name}" from ${spec.version} to ${cleanRolledBack.version}`,
      artifactType: type,
      artifactId: cleanRolledBack.id,
      artifactName: cleanRolledBack.name,
      previousVersion: spec.version,
      resultingVersion: cleanRolledBack.version,
      specHash: targetSnap?.snapshotHash ?? computeArtifactSpecHash(type, cleanRolledBack),
      targetEnvironment: cleanRolledBack.environment,
      approvalId: authorizingApproval?.id,
      outcome: 'Allowed',
      reason:
        params.note?.trim() ||
        `Restored full ${type} logic from immutable snapshot ${cleanRolledBack.version}; prior stale approvals cleared.`,
      timestamp: params.timestamp,
    }),
  };
}

export type GovernedDecisionRequest =
  | {
      operation: 'save';
      artifactType: DecisionArtifactType;
      spec: DecisionArtifactSpec;
      targetStatus?: 'Draft' | 'Validated';
      note?: string;
      actorLabel?: string;
    }
  | {
      operation: 'submit-review';
      artifactType: DecisionArtifactType;
      spec: DecisionArtifactSpec;
      actorLabel?: string;
    }
  | {
      operation: 'approve';
      artifactType: DecisionArtifactType;
      artifactId: string;
      targetEnvironment: DecisionEnvironment;
      purpose: DecisionApprovalPurpose;
      decision?: DecisionApprovalDecision;
      reviewerLabel?: string;
      note?: string;
      rollbackTargetVersion?: string;
      specOverride?: DecisionArtifactSpec;
    }
  | {
      operation: 'publish';
      artifactType: DecisionArtifactType;
      spec: DecisionArtifactSpec;
      targetEnvironment: DecisionEnvironment;
      summary?: string;
      publishedBy?: string;
      explicitVersion?: string;
      approvalRecord?: DecisionReviewApproval;
    }
  | {
      operation: 'promote';
      artifactType: DecisionArtifactType;
      artifactId: string;
      targetEnvironment: DecisionEnvironment;
      approvalRecord?: DecisionReviewApproval;
      note?: string;
      actorLabel?: string;
    }
  | {
      operation: 'rollback';
      artifactType: DecisionArtifactType;
      artifactId: string;
      targetVersion: string;
      approvalRecord?: DecisionReviewApproval;
      note?: string;
      actorLabel?: string;
    };

function findInSlice(
  slice: DecisionsWorkspaceSlice,
  type: DecisionArtifactType,
  id: string
): DecisionArtifactSpec | undefined {
  if (type === 'rule') return slice.rules.find((x) => x.id === id);
  if (type === 'table') return slice.tables.find((x) => x.id === id);
  if (type === 'ruleset') return slice.rulesets.find((x) => x.id === id);
  if (type === 'chain') return slice.chains.find((x) => x.id === id);
  return slice.scorecards.find((x) => x.id === id);
}

function upsertInSlice(
  slice: DecisionsWorkspaceSlice,
  type: DecisionArtifactType,
  updated: DecisionArtifactSpec
): DecisionsWorkspaceSlice {
  if (type === 'rule') {
    const exists = slice.rules.some((x) => x.id === updated.id);
    return {
      ...slice,
      rules: exists
        ? slice.rules.map((x) => (x.id === updated.id ? (updated as RuleSpec) : x))
        : [updated as RuleSpec, ...slice.rules],
    };
  }
  if (type === 'table') {
    const exists = slice.tables.some((x) => x.id === updated.id);
    return {
      ...slice,
      tables: exists
        ? slice.tables.map((x) => (x.id === updated.id ? (updated as DecisionTableSpec) : x))
        : [updated as DecisionTableSpec, ...slice.tables],
    };
  }
  if (type === 'ruleset') {
    const exists = slice.rulesets.some((x) => x.id === updated.id);
    return {
      ...slice,
      rulesets: exists
        ? slice.rulesets.map((x) => (x.id === updated.id ? (updated as RulesetSpec) : x))
        : [updated as RulesetSpec, ...slice.rulesets],
    };
  }
  if (type === 'chain') {
    const exists = slice.chains.some((x) => x.id === updated.id);
    return {
      ...slice,
      chains: exists
        ? slice.chains.map((x) => (x.id === updated.id ? (updated as RuleChainSpec) : x))
        : [updated as RuleChainSpec, ...slice.chains],
    };
  }
  const exists = slice.scorecards.some((x) => x.id === updated.id);
  return {
    ...slice,
    scorecards: exists
      ? slice.scorecards.map((x) => (x.id === updated.id ? (updated as ScorecardSpec) : x))
      : [updated as ScorecardSpec, ...slice.scorecards],
  };
}

/**
 * Single governed state-transition executor across all 5 artifact types and all 6 lifecycle operations.
 * On Blocked outcomes, returns the EXACT original slice reference with zero state mutation.
 */
export function applyGovernedDecisionOperationToSlice(
  slice: DecisionsWorkspaceSlice,
  workspaceRole: string,
  request: GovernedDecisionRequest
): {
  allowed: boolean;
  slice: DecisionsWorkspaceSlice;
  updatedSpec?: DecisionArtifactSpec;
  approvalRecord?: DecisionReviewApproval;
  reasons: string[];
  warnings: string[];
  auditEvent: DecisionAuditRecord;
} {
  const collections: ValidationCollections = {
    rules: slice.rules,
    tables: slice.tables,
    rulesets: slice.rulesets,
    chains: slice.chains,
    scorecards: slice.scorecards,
  };

  if (request.operation === 'save') {
    const prev = findInSlice(slice, request.artifactType, request.spec.id);
    const res = performGovernedSave({
      type: request.artifactType,
      spec: request.spec,
      previousSpec: prev,
      workspaceRole,
      settings: slice.settings,
      collections,
      actorLabel: request.actorLabel,
      targetStatus: request.targetStatus,
      note: request.note,
    });
    if (!res.allowed || !res.updatedSpec) {
      return {
        allowed: false,
        slice,
        reasons: res.reasons,
        warnings: res.warnings,
        auditEvent: res.auditEvent,
      };
    }
    return {
      allowed: true,
      slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
      updatedSpec: res.updatedSpec,
      reasons: [],
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }

  if (request.operation === 'submit-review') {
    const prev = findInSlice(slice, request.artifactType, request.spec.id);
    const res = performGovernedSubmitReview({
      type: request.artifactType,
      spec: request.spec,
      previousSpec: prev,
      workspaceRole,
      settings: slice.settings,
      collections,
      actorLabel: request.actorLabel,
    });
    if (!res.allowed || !res.updatedSpec) {
      return {
        allowed: false,
        slice,
        reasons: res.reasons,
        warnings: res.warnings,
        auditEvent: res.auditEvent,
      };
    }
    return {
      allowed: true,
      slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
      updatedSpec: res.updatedSpec,
      reasons: [],
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }

  if (request.operation === 'approve') {
    const targetSpec =
      request.specOverride ?? findInSlice(slice, request.artifactType, request.artifactId);
    if (!targetSpec) {
      const reason = `Artifact ${request.artifactType}:${request.artifactId} not found.`;
      return {
        allowed: false,
        slice,
        reasons: [reason],
        warnings: [],
        auditEvent: buildAuditRecord({
          workspaceId: 'ws-unknown',
          actor: request.reviewerLabel || workspaceRole,
          actorRole: workspaceRole,
          operation: 'approve',
          action: `Blocked approval on missing ${request.artifactType}`,
          artifactType: request.artifactType,
          artifactId: request.artifactId,
          artifactName: request.artifactId,
          specHash: '',
          targetEnvironment: request.targetEnvironment,
          outcome: 'Blocked',
          reason,
        }),
      };
    }
    const res = performGovernedApprove({
      type: request.artifactType,
      spec: targetSpec,
      targetEnvironment: request.targetEnvironment,
      purpose: request.purpose,
      decision: request.decision,
      workspaceRole,
      settings: slice.settings,
      collections,
      reviewerLabel: request.reviewerLabel,
      note: request.note,
      rollbackTargetVersion: request.rollbackTargetVersion,
    });
    if (!res.allowed || !res.updatedSpec) {
      return {
        allowed: false,
        slice,
        reasons: res.reasons,
        warnings: res.warnings,
        auditEvent: res.auditEvent,
      };
    }
    return {
      allowed: true,
      slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
      updatedSpec: res.updatedSpec,
      approvalRecord: res.approvalRecord,
      reasons: [],
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }

  if (request.operation === 'publish') {
    const storedSpec = findInSlice(slice, request.artifactType, request.spec.id);
    const mergedSpec: DecisionArtifactSpec = storedSpec
      ? {
          ...request.spec,
          approvalHistory:
            request.spec.approvalHistory && request.spec.approvalHistory.length >= (storedSpec.approvalHistory?.length ?? 0)
              ? request.spec.approvalHistory
              : storedSpec.approvalHistory,
          versionHistory: storedSpec.versionHistory,
        }
      : request.spec;

    const res = performGovernedPublish({
      type: request.artifactType,
      spec: mergedSpec,
      targetEnvironment: request.targetEnvironment,
      workspaceRole,
      settings: slice.settings,
      collections,
      summary: request.summary,
      publishedBy: request.publishedBy,
      explicitVersion: request.explicitVersion,
      approvalRecord: request.approvalRecord,
    });
    if (!res.allowed || !res.updatedSpec) {
      return {
        allowed: false,
        slice,
        reasons: res.reasons,
        warnings: res.warnings,
        auditEvent: res.auditEvent,
      };
    }
    return {
      allowed: true,
      slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
      updatedSpec: res.updatedSpec,
      reasons: [],
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }

  if (request.operation === 'promote') {
    const targetSpec = findInSlice(slice, request.artifactType, request.artifactId);
    if (!targetSpec) {
      const reason = `Artifact ${request.artifactType}:${request.artifactId} not found.`;
      return {
        allowed: false,
        slice,
        reasons: [reason],
        warnings: [],
        auditEvent: buildAuditRecord({
          workspaceId: 'ws-unknown',
          actor: request.actorLabel || workspaceRole,
          actorRole: workspaceRole,
          operation: 'promote',
          action: `Blocked promotion of missing ${request.artifactType}`,
          artifactType: request.artifactType,
          artifactId: request.artifactId,
          artifactName: request.artifactId,
          specHash: '',
          targetEnvironment: request.targetEnvironment,
          outcome: 'Blocked',
          reason,
        }),
      };
    }
    const res = performGovernedPromote({
      type: request.artifactType,
      spec: targetSpec,
      targetEnvironment: request.targetEnvironment,
      workspaceRole,
      settings: slice.settings,
      collections,
      approvalRecord: request.approvalRecord,
      note: request.note,
      actorLabel: request.actorLabel,
    });
    if (!res.allowed || !res.updatedSpec) {
      return {
        allowed: false,
        slice,
        reasons: res.reasons,
        warnings: res.warnings,
        auditEvent: res.auditEvent,
      };
    }
    return {
      allowed: true,
      slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
      updatedSpec: res.updatedSpec,
      reasons: [],
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }

  // rollback
  const targetSpec = findInSlice(slice, request.artifactType, request.artifactId);
  if (!targetSpec) {
    const reason = `Artifact ${request.artifactType}:${request.artifactId} not found.`;
    return {
      allowed: false,
      slice,
      reasons: [reason],
      warnings: [],
      auditEvent: buildAuditRecord({
        workspaceId: 'ws-unknown',
        actor: request.actorLabel || workspaceRole,
        actorRole: workspaceRole,
        operation: 'rollback',
        action: `Blocked rollback of missing ${request.artifactType}`,
        artifactType: request.artifactType,
        artifactId: request.artifactId,
        artifactName: request.artifactId,
        specHash: '',
        outcome: 'Blocked',
        reason,
      }),
    };
  }
  const res = performGovernedRollback({
    type: request.artifactType,
    spec: targetSpec,
    targetVersion: request.targetVersion,
    workspaceRole,
    settings: slice.settings,
    approvalRecord: request.approvalRecord,
    actorLabel: request.actorLabel,
    note: request.note,
  });
  if (!res.allowed || !res.updatedSpec) {
    return {
      allowed: false,
      slice,
      reasons: res.reasons,
      warnings: res.warnings,
      auditEvent: res.auditEvent,
    };
  }
  return {
    allowed: true,
    slice: upsertInSlice(slice, request.artifactType, res.updatedSpec),
    updatedSpec: res.updatedSpec,
    reasons: [],
    warnings: res.warnings,
    auditEvent: res.auditEvent,
  };
}
