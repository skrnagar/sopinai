import {
  DecisionArtifactSpec,
  DecisionArtifactStatus,
  DecisionArtifactType,
  DecisionEnvironment,
  DecisionReviewApproval,
  DecisionTableSpec,
  DecisionTestRunRecord,
  DecisionVersionSnapshot,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../types';
import {
  canonicalSerialize,
  computeCanonicalSpecHash,
  verifySnapshotIntegrity,
} from './executionTrace';
import { isPlainObject, resolveInputField } from './operators';

export function extractVersionableSpecBody(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec
): Record<string, unknown> {
  if (type === 'rule') {
    const r = spec as RuleSpec;
    return {
      inputSchema: r.inputSchema,
      conditionRoot: r.conditionRoot,
      thenOutputs: r.thenOutputs,
      elseOutputs: r.elseOutputs,
      priority: r.priority,
      executionConfig: r.executionConfig,
    };
  }
  if (type === 'table') {
    const t = spec as DecisionTableSpec;
    return {
      hitPolicy: t.hitPolicy,
      inputColumns: t.inputColumns,
      outputColumns: t.outputColumns,
      rows: t.rows,
      defaultOutput: t.defaultOutput,
    };
  }
  if (type === 'ruleset') {
    const rs = spec as RulesetSpec;
    return {
      executionOrder: rs.executionOrder,
      conflictResolution: rs.conflictResolution,
      stopOnMatch: rs.stopOnMatch ?? false,
      defaultOutput: rs.defaultOutput ?? {},
      members: rs.members,
    };
  }
  if (type === 'chain') {
    const c = spec as RuleChainSpec;
    return {
      stages: c.stages,
      terminalOutcomes: c.terminalOutcomes ?? [],
    };
  }
  const sc = spec as ScorecardSpec;
  return {
    baseScore: sc.baseScore,
    criteria: sc.criteria,
    thresholds: sc.thresholds,
  };
}

export function computeArtifactSpecHash(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec
): string {
  return computeCanonicalSpecHash(extractVersionableSpecBody(type, spec));
}

function nextSemanticVersion(currentVersion: string, explicitVersion?: string): string {
  if (explicitVersion) return explicitVersion;
  const numericCurrent = Number(currentVersion.replace(/[^0-9.]/g, '')) || 0.0;
  return `v${(numericCurrent + 0.1).toFixed(1)}`;
}

function buildSnapshotObject(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy: string,
  nextVer: string,
  targetStatus: DecisionArtifactStatus,
  reviewApproval?: DecisionReviewApproval
): DecisionVersionSnapshot {
  const specBody = extractVersionableSpecBody(type, spec);
  const serializedSpec = canonicalSerialize(specBody);
  const snapshotHash = computeCanonicalSpecHash(specBody);
  const cleanSummary = summary.trim() || `Published immutable ${type} snapshot ${nextVer}.`;
  return {
    version: nextVer,
    publishedAt: 'Just now',
    publishedBy,
    environment,
    summary: cleanSummary,
    releaseNotes: cleanSummary,
    status: targetStatus,
    lifecycleState: targetStatus,
    snapshotHash,
    canonicalAlgorithm: 'canonical-json-sha256',
    serializedSpec,
    reviewApproval,
    approvalHistory: spec.approvalHistory ? [...spec.approvalHistory] : undefined,
    attributionPlaceholder: {
      authorLabel: `${publishedBy} (Local Prototype Author)`,
      publisherLabel: `${publishedBy} (Local Policy Actor)`,
      reviewerLabel: reviewApproval?.reviewerLabel,
      prototypeNote: 'Local prototype attribution placeholder (no server identity backend).',
    },
  };
}

export function buildPublishedArtifactVersion<T extends DecisionArtifactSpec>(
  type: DecisionArtifactType,
  spec: T,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): T {
  const nextVer = nextSemanticVersion(spec.version, explicitVersion);
  const currentSpecHash = computeArtifactSpecHash(type, spec);

  const isValidBoundApproval = Boolean(
    reviewApproval &&
      reviewApproval.approved &&
      reviewApproval.decision !== 'rejected' &&
      (!reviewApproval.artifactId || reviewApproval.artifactId === spec.id) &&
      (!reviewApproval.artifactType || reviewApproval.artifactType === type) &&
      (!reviewApproval.artifactVersion || reviewApproval.artifactVersion === spec.version) &&
      (!reviewApproval.specHash || reviewApproval.specHash === currentSpecHash) &&
      (!reviewApproval.targetEnvironment || reviewApproval.targetEnvironment === environment)
  );
  const verifiedApproval = isValidBoundApproval ? reviewApproval : undefined;

  const targetStatus: DecisionArtifactStatus =
    environment === 'production' && spec.status === 'Published' ? 'Promoted' : 'Published';
  const snapshot = buildSnapshotObject(
    type,
    spec,
    environment,
    summary,
    publishedBy,
    nextVer,
    environment === 'production' && verifiedApproval?.approved ? 'Promoted' : targetStatus,
    verifiedApproval
  );

  // Preserve prior immutable snapshots untouched; deduplicate version tag only if exact same version doesn't exist
  const existingHistory = Array.isArray(spec.versionHistory) ? spec.versionHistory : [];
  const nextHistory = existingHistory.some((h) => h.version === nextVer)
    ? existingHistory
    : [snapshot, ...existingHistory];

  const existingApprovals = Array.isArray(spec.approvalHistory) ? spec.approvalHistory : [];
  const nextApprovals =
    verifiedApproval &&
    (!verifiedApproval.id || !existingApprovals.some((a) => a.id === verifiedApproval.id))
      ? [verifiedApproval, ...existingApprovals]
      : existingApprovals;

  // Carry forward test pass version ONLY for tests verified against the exact immutable specHash & artifact
  // and bind a runHistory entry to (nextVer, currentSpecHash) so subsequent draft edits cannot erase snapshot evidence.
  const nextTestCases = Array.isArray(spec.testCases)
    ? spec.testCases.map((tc) => {
        const verifiedForPrePublish =
          tc.lastPassed === true &&
          tc.testedVersion === spec.version &&
          tc.testedSpecHash === currentSpecHash &&
          tc.testedArtifactId === spec.id &&
          tc.testedArtifactType === type;
        if (!verifiedForPrePublish) return tc;

        const existingRuns = Array.isArray(tc.runHistory) ? tc.runHistory : [];
        const hasSnapshotRun = existingRuns.some(
          (rh) =>
            rh.testedVersion === nextVer &&
            rh.testedSpecHash === currentSpecHash &&
            rh.testedArtifactId === spec.id &&
            rh.testedArtifactType === type
        );
        const publishedRunRecord: DecisionTestRunRecord = {
          runId: `${existingRuns[0]?.runId ?? 'pubrun'}-${nextVer}`,
          runAt: existingRuns[0]?.runAt ?? tc.lastRunAt ?? 'At publish',
          passed: true,
          actualStatus: existingRuns[0]?.actualStatus ?? tc.lastActualStatus ?? 'Matched',
          actualOutput: existingRuns[0]?.actualOutput ?? tc.lastActualOutput ?? {},
          testedVersion: nextVer,
          testedSpecHash: currentSpecHash,
          testedArtifactId: spec.id,
          testedArtifactType: type,
          diffNotes: existingRuns[0]?.diffNotes ?? tc.diffNotes ?? [],
        };
        return {
          ...tc,
          testedVersion: nextVer,
          runHistory: hasSnapshotRun
            ? existingRuns
            : [publishedRunRecord, ...existingRuns].slice(0, 15),
        };
      })
    : [];

  return {
    ...spec,
    version: nextVer,
    environment,
    status: snapshot.status ?? targetStatus,
    // Never carry prior-version reviewApproval onto the newly published version as an active approval
    reviewApproval: undefined,
    approvalHistory: nextApprovals,
    testCases: nextTestCases,
    versionHistory: nextHistory,
    updatedAt: 'Just now',
  };
}

export function buildPublishedRuleVersion(
  rule: RuleSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): RuleSpec {
  return buildPublishedArtifactVersion(
    'rule',
    rule,
    environment,
    summary,
    publishedBy,
    explicitVersion,
    reviewApproval
  );
}

export function buildPublishedTableVersion(
  table: DecisionTableSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): DecisionTableSpec {
  return buildPublishedArtifactVersion(
    'table',
    table,
    environment,
    summary,
    publishedBy,
    explicitVersion,
    reviewApproval
  );
}

export function buildPublishedRulesetVersion(
  ruleset: RulesetSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): RulesetSpec {
  return buildPublishedArtifactVersion(
    'ruleset',
    ruleset,
    environment,
    summary,
    publishedBy,
    explicitVersion,
    reviewApproval
  );
}

export function buildPublishedChainVersion(
  chain: RuleChainSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): RuleChainSpec {
  return buildPublishedArtifactVersion(
    'chain',
    chain,
    environment,
    summary,
    publishedBy,
    explicitVersion,
    reviewApproval
  );
}

export function buildPublishedScorecardVersion(
  scorecard: ScorecardSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string,
  reviewApproval?: DecisionReviewApproval
): ScorecardSpec {
  return buildPublishedArtifactVersion(
    'scorecard',
    scorecard,
    environment,
    summary,
    publishedBy,
    explicitVersion,
    reviewApproval
  );
}

const PUBLISHED_LIFECYCLE_SET = new Set<DecisionArtifactStatus>(['Published', 'Promoted']);

export function isPublishedSnapshotStatus(status: DecisionArtifactStatus): boolean {
  return PUBLISHED_LIFECYCLE_SET.has(status);
}

function hydrateFromSnapshot<T extends DecisionArtifactSpec>(
  type: DecisionArtifactType,
  base: T,
  snap: DecisionVersionSnapshot
): T | null {
  try {
    const parsed = JSON.parse(snap.serializedSpec);
    if (!isPlainObject(parsed)) return null;

    if (type === 'rule' && parsed.conditionRoot && Array.isArray(parsed.thenOutputs)) {
      const r = base as RuleSpec;
      return {
        ...r,
        version: snap.version,
        environment: snap.environment,
        status: snap.status,
        inputSchema: Array.isArray(parsed.inputSchema) ? parsed.inputSchema : r.inputSchema,
        conditionRoot: parsed.conditionRoot as RuleSpec['conditionRoot'],
        thenOutputs: parsed.thenOutputs as RuleSpec['thenOutputs'],
        elseOutputs: Array.isArray(parsed.elseOutputs) ? parsed.elseOutputs : r.elseOutputs,
        priority: typeof parsed.priority === 'number' ? parsed.priority : r.priority,
        executionConfig: isPlainObject(parsed.executionConfig)
          ? (parsed.executionConfig as RuleSpec['executionConfig'])
          : r.executionConfig,
      } as T;
    }

    if (type === 'table' && Array.isArray(parsed.rows) && Array.isArray(parsed.inputColumns)) {
      const t = base as DecisionTableSpec;
      return {
        ...t,
        version: snap.version,
        environment: snap.environment,
        status: snap.status,
        hitPolicy: (parsed.hitPolicy as DecisionTableSpec['hitPolicy']) ?? t.hitPolicy,
        inputColumns: parsed.inputColumns as DecisionTableSpec['inputColumns'],
        outputColumns: Array.isArray(parsed.outputColumns)
          ? (parsed.outputColumns as DecisionTableSpec['outputColumns'])
          : t.outputColumns,
        rows: parsed.rows as DecisionTableSpec['rows'],
        defaultOutput: isPlainObject(parsed.defaultOutput) ? parsed.defaultOutput : t.defaultOutput,
      } as T;
    }

    if (type === 'ruleset' && Array.isArray(parsed.members)) {
      const rs = base as RulesetSpec;
      return {
        ...rs,
        version: snap.version,
        environment: snap.environment,
        status: snap.status,
        executionOrder: (parsed.executionOrder as RulesetSpec['executionOrder']) ?? rs.executionOrder,
        conflictResolution:
          (parsed.conflictResolution as RulesetSpec['conflictResolution']) ?? rs.conflictResolution,
        stopOnMatch: typeof parsed.stopOnMatch === 'boolean' ? parsed.stopOnMatch : rs.stopOnMatch,
        defaultOutput: isPlainObject(parsed.defaultOutput) ? parsed.defaultOutput : rs.defaultOutput,
        members: parsed.members as RulesetSpec['members'],
      } as T;
    }

    if (type === 'chain' && Array.isArray(parsed.stages)) {
      const c = base as RuleChainSpec;
      return {
        ...c,
        version: snap.version,
        environment: snap.environment,
        status: snap.status,
        stages: parsed.stages as RuleChainSpec['stages'],
        terminalOutcomes: Array.isArray(parsed.terminalOutcomes)
          ? (parsed.terminalOutcomes as string[])
          : c.terminalOutcomes,
      } as T;
    }

    if (type === 'scorecard' && Array.isArray(parsed.criteria) && Array.isArray(parsed.thresholds)) {
      const sc = base as ScorecardSpec;
      return {
        ...sc,
        version: snap.version,
        environment: snap.environment,
        status: snap.status,
        baseScore: typeof parsed.baseScore === 'number' ? parsed.baseScore : sc.baseScore,
        criteria: parsed.criteria as ScorecardSpec['criteria'],
        thresholds: parsed.thresholds as ScorecardSpec['thresholds'],
      } as T;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Unified immutable snapshot resolver across all 5 SOPIN Decisions artifact types.
 * Draft edits on the working copy never alter execution when resolving a published/pinned version.
 */
export function resolvePublishedArtifact<T extends DecisionArtifactSpec>(
  type: DecisionArtifactType,
  spec: T,
  targetVersion?: string
): { resolved: T | null; error?: string } {
  const history = Array.isArray(spec.versionHistory) ? spec.versionHistory : [];

  if (targetVersion) {
    const snap = history.find((v) => v.version === targetVersion);
    if (snap) {
      const integrity = verifySnapshotIntegrity(snap);
      if (!integrity.valid) {
        return {
          resolved: null,
          error: `Integrity check failed for ${type} "${spec.name}" ${targetVersion}: ${integrity.reason}`,
        };
      }
      const hydrated = hydrateFromSnapshot(type, spec, snap);
      if (hydrated) return { resolved: hydrated };
      if (spec.version === targetVersion && isPublishedSnapshotStatus(spec.status)) {
        return { resolved: spec };
      }
      return {
        resolved: null,
        error: `Snapshot "${targetVersion}" for ${type} "${spec.name}" does not contain a full serialized body.`,
      };
    }
    if (spec.version === targetVersion && isPublishedSnapshotStatus(spec.status)) {
      return { resolved: spec };
    }
    return {
      resolved: null,
      error: `Published version "${targetVersion}" not found for ${type} "${spec.name}".`,
    };
  }

  const latestPublishedSnap = history.find((v) => isPublishedSnapshotStatus(v.status));
  if (latestPublishedSnap) {
    const integrity = verifySnapshotIntegrity(latestPublishedSnap);
    if (!integrity.valid) {
      return {
        resolved: null,
        error: `Integrity check failed for ${type} "${spec.name}" ${latestPublishedSnap.version}: ${integrity.reason}`,
      };
    }
    const hydrated = hydrateFromSnapshot(type, spec, latestPublishedSnap);
    if (hydrated) return { resolved: hydrated };
  }

  if (isPublishedSnapshotStatus(spec.status)) {
    return { resolved: spec };
  }

  return {
    resolved: null,
    error: `${type} "${spec.name}" has no published immutable version (current status: ${spec.status}).`,
  };
}

export function resolvePublishedRuleSpec(
  rule: RuleSpec,
  targetVersion?: string
): { resolved: RuleSpec | null; error?: string } {
  return resolvePublishedArtifact('rule', rule, targetVersion);
}

export function resolvePublishedTableSpec(
  table: DecisionTableSpec,
  targetVersion?: string
): { resolved: DecisionTableSpec | null; error?: string } {
  return resolvePublishedArtifact('table', table, targetVersion);
}

/**
 * Restores full serialized specification fields from an immutable snapshot rather than
 * merely overwriting version metadata. Preserves full versionHistory immutability.
 */
export function rollbackArtifactToSnapshot<T extends DecisionArtifactSpec>(
  type: DecisionArtifactType,
  currentSpec: T,
  targetVersion: string,
  actorLabel = 'Workspace Maintainer'
): { rolledBack: T | null; error?: string } {
  const history = Array.isArray(currentSpec.versionHistory) ? currentSpec.versionHistory : [];
  const snap = history.find((s) => s.version === targetVersion);
  if (!snap) {
    return { rolledBack: null, error: `Snapshot "${targetVersion}" not found.` };
  }
  const integrity = verifySnapshotIntegrity(snap);
  if (!integrity.valid) {
    return { rolledBack: null, error: `Cannot rollback to corrupted snapshot ${targetVersion}: ${integrity.reason}` };
  }
  const hydrated = hydrateFromSnapshot(type, currentSpec, snap);
  if (!hydrated) {
    return {
      rolledBack: null,
      error: `Snapshot "${targetVersion}" is a partial seed metadata record without a full serialized spec body.`,
    };
  }

  return {
    rolledBack: {
      ...hydrated,
      version: snap.version,
      environment: snap.environment,
      status: snap.status === 'Archived' ? 'Published' : snap.status,
      // Never reuse stale approvals from before rollback or old snapshot metadata for future operations
      reviewApproval: undefined,
      approvalHistory: currentSpec.approvalHistory ?? [],
      updatedAt: `Restored from ${snap.version} by ${actorLabel}`,
      versionHistory: currentSpec.versionHistory,
    },
  };
}

export interface SnapshotDiffEntry {
  key: string;
  before: string;
  after: string;
}

export function compareVersionSnapshots(
  older: DecisionVersionSnapshot,
  newer: DecisionVersionSnapshot
): {
  identical: boolean;
  olderHash: string;
  newerHash: string;
  changes: SnapshotDiffEntry[];
} {
  let objA: Record<string, unknown> = {};
  let objB: Record<string, unknown> = {};
  try {
    objA = JSON.parse(older.serializedSpec) as Record<string, unknown>;
  } catch {
    objA = { raw: older.serializedSpec };
  }
  try {
    objB = JSON.parse(newer.serializedSpec) as Record<string, unknown>;
  } catch {
    objB = { raw: newer.serializedSpec };
  }

  const allKeys = Array.from(new Set([...Object.keys(objA), ...Object.keys(objB)])).sort();
  const changes: SnapshotDiffEntry[] = [];
  for (const key of allKeys) {
    const serA = canonicalSerialize(objA[key]);
    const serB = canonicalSerialize(objB[key]);
    if (serA !== serB) {
      changes.push({
        key,
        before: JSON.stringify(objA[key], null, 2) ?? 'undefined',
        after: JSON.stringify(objB[key], null, 2) ?? 'undefined',
      });
    }
  }

  return {
    identical: changes.length === 0,
    olderHash: older.snapshotHash,
    newerHash: newer.snapshotHash,
    changes,
  };
}

/**
 * Resolves workflow payload mappings such as `{ invoiceAmount: "payload.invoiceAmount" }`
 * into typed rule input fields.
 */
export function extractMappedInputs(
  workflowContext: Record<string, unknown>,
  inputMappings: Record<string, string>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [targetField, sourceExpr] of Object.entries(inputMappings)) {
    const direct = resolveInputField(workflowContext, sourceExpr);
    if (direct.exists) {
      mapped[targetField] = direct.value;
      continue;
    }
    const stripped = sourceExpr.startsWith('payload.') ? sourceExpr.slice('payload.'.length) : sourceExpr;
    const strippedLookup = resolveInputField(workflowContext, stripped);
    if (strippedLookup.exists) {
      mapped[targetField] = strippedLookup.value;
      continue;
    }
    const sameNameLookup = resolveInputField(workflowContext, targetField);
    if (sameNameLookup.exists) {
      mapped[targetField] = sameNameLookup.value;
    }
  }
  return mapped;
}
