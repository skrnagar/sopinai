import {
  DecisionEnvironment,
  DecisionTableSpec,
  DecisionVersionSnapshot,
  RuleSpec,
  RulesetSpec,
} from '../types';
import { computeDeterministicHash } from './executionTrace';
import { isPlainObject, resolveInputField } from './operators';

export function buildPublishedRuleVersion(
  rule: RuleSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string
): RuleSpec {
  const numericCurrent = Number(rule.version.replace(/[^0-9.]/g, '')) || 0.0;
  const nextVer = explicitVersion || `v${(numericCurrent + 0.1).toFixed(1)}`;
  const specBody = {
    inputSchema: rule.inputSchema,
    conditionRoot: rule.conditionRoot,
    thenOutputs: rule.thenOutputs,
    elseOutputs: rule.elseOutputs,
    priority: rule.priority,
    executionConfig: rule.executionConfig,
  };
  const serializedSpec = JSON.stringify(specBody);
  const snapshot: DecisionVersionSnapshot = {
    version: nextVer,
    publishedAt: 'Just now',
    publishedBy,
    environment,
    summary: summary.trim() || `Published immutable snapshot ${nextVer}.`,
    status: 'Published',
    snapshotHash: computeDeterministicHash(serializedSpec),
    serializedSpec,
  };

  return {
    ...rule,
    version: nextVer,
    environment,
    status: 'Published',
    versionHistory: [snapshot, ...rule.versionHistory],
    updatedAt: 'Just now',
  };
}

export function buildPublishedTableVersion(
  table: DecisionTableSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string
): DecisionTableSpec {
  const numericCurrent = Number(table.version.replace(/[^0-9.]/g, '')) || 0.0;
  const nextVer = explicitVersion || `v${(numericCurrent + 0.1).toFixed(1)}`;
  const specBody = {
    hitPolicy: table.hitPolicy,
    inputColumns: table.inputColumns,
    outputColumns: table.outputColumns,
    rows: table.rows,
    defaultOutput: table.defaultOutput,
  };
  const serializedSpec = JSON.stringify(specBody);
  const snapshot: DecisionVersionSnapshot = {
    version: nextVer,
    publishedAt: 'Just now',
    publishedBy,
    environment,
    summary: summary.trim() || `Published immutable decision table snapshot ${nextVer}.`,
    status: 'Published',
    snapshotHash: computeDeterministicHash(serializedSpec),
    serializedSpec,
  };

  return {
    ...table,
    version: nextVer,
    environment,
    status: 'Published',
    versionHistory: [snapshot, ...table.versionHistory],
    updatedAt: 'Just now',
  };
}

export function buildPublishedRulesetVersion(
  ruleset: RulesetSpec,
  environment: DecisionEnvironment,
  summary: string,
  publishedBy = 'Workspace Maintainer',
  explicitVersion?: string
): RulesetSpec {
  const numericCurrent = Number(ruleset.version.replace(/[^0-9.]/g, '')) || 0.0;
  const nextVer = explicitVersion || `v${(numericCurrent + 0.1).toFixed(1)}`;
  const specBody = {
    executionOrder: ruleset.executionOrder,
    conflictResolution: ruleset.conflictResolution,
    stopOnMatch: ruleset.stopOnMatch,
    defaultOutput: ruleset.defaultOutput,
    members: ruleset.members,
  };
  const serializedSpec = JSON.stringify(specBody);
  const snapshot: DecisionVersionSnapshot = {
    version: nextVer,
    publishedAt: 'Just now',
    publishedBy,
    environment,
    summary: summary.trim() || `Published immutable ruleset snapshot ${nextVer}.`,
    status: 'Published',
    snapshotHash: computeDeterministicHash(serializedSpec),
    serializedSpec,
  };

  return {
    ...ruleset,
    version: nextVer,
    environment,
    status: 'Published',
    versionHistory: [snapshot, ...ruleset.versionHistory],
    updatedAt: 'Just now',
  };
}

/**
 * Resolves an immutable published RuleSpec snapshot when available so Draft edits
 * never silently alter production/workflow outcomes.
 */
export function resolvePublishedRuleSpec(
  rule: RuleSpec,
  targetVersion?: string
): { resolved: RuleSpec | null; error?: string } {
  if (targetVersion) {
    const snap = rule.versionHistory.find((v) => v.version === targetVersion);
    if (snap) {
      try {
        const parsed = JSON.parse(snap.serializedSpec);
        if (isPlainObject(parsed) && parsed.conditionRoot && Array.isArray(parsed.thenOutputs)) {
          return {
            resolved: {
              ...rule,
              version: snap.version,
              environment: snap.environment,
              status: snap.status,
              inputSchema: Array.isArray(parsed.inputSchema) ? parsed.inputSchema : rule.inputSchema,
              conditionRoot: parsed.conditionRoot as RuleSpec['conditionRoot'],
              thenOutputs: parsed.thenOutputs as RuleSpec['thenOutputs'],
              elseOutputs: Array.isArray(parsed.elseOutputs) ? parsed.elseOutputs : rule.elseOutputs,
              priority: typeof parsed.priority === 'number' ? parsed.priority : rule.priority,
              executionConfig: isPlainObject(parsed.executionConfig)
                ? (parsed.executionConfig as RuleSpec['executionConfig'])
                : rule.executionConfig,
            },
          };
        }
      } catch {
        // Fallback to direct version check below
      }
      if (rule.version === targetVersion && rule.status === 'Published') {
        return { resolved: rule };
      }
      return {
        resolved: null,
        error: `Snapshot "${targetVersion}" for rule "${rule.name}" does not contain a full serialized rule body.`,
      };
    }
    if (rule.version === targetVersion && rule.status === 'Published') {
      return { resolved: rule };
    }
    return {
      resolved: null,
      error: `Published version "${targetVersion}" not found for rule "${rule.name}".`,
    };
  }

  const latestPublishedSnap = rule.versionHistory.find((v) => v.status === 'Published');
  if (latestPublishedSnap) {
    try {
      const parsed = JSON.parse(latestPublishedSnap.serializedSpec);
      if (isPlainObject(parsed) && parsed.conditionRoot && Array.isArray(parsed.thenOutputs)) {
        return resolvePublishedRuleSpec(rule, latestPublishedSnap.version);
      }
    } catch {
      // ignore partial seed summary snapshot
    }
  }

  if (rule.status === 'Published') {
    return { resolved: rule };
  }

  return {
    resolved: null,
    error: `Rule "${rule.name}" has no published immutable version (current status: ${rule.status}).`,
  };
}

export function resolvePublishedTableSpec(
  table: DecisionTableSpec,
  targetVersion?: string
): { resolved: DecisionTableSpec | null; error?: string } {
  if (targetVersion) {
    const snap = table.versionHistory.find((v) => v.version === targetVersion);
    if (snap) {
      try {
        const parsed = JSON.parse(snap.serializedSpec);
        if (isPlainObject(parsed) && Array.isArray(parsed.rows) && Array.isArray(parsed.inputColumns)) {
          return {
            resolved: {
              ...table,
              version: snap.version,
              environment: snap.environment,
              status: snap.status,
              hitPolicy: (parsed.hitPolicy as DecisionTableSpec['hitPolicy']) ?? table.hitPolicy,
              inputColumns: parsed.inputColumns as DecisionTableSpec['inputColumns'],
              outputColumns: Array.isArray(parsed.outputColumns)
                ? (parsed.outputColumns as DecisionTableSpec['outputColumns'])
                : table.outputColumns,
              rows: parsed.rows as DecisionTableSpec['rows'],
              defaultOutput: isPlainObject(parsed.defaultOutput) ? parsed.defaultOutput : table.defaultOutput,
            },
          };
        }
      } catch {
        // Fallback below
      }
      if (table.version === targetVersion && table.status === 'Published') {
        return { resolved: table };
      }
    }
    if (table.version === targetVersion && table.status === 'Published') {
      return { resolved: table };
    }
    return {
      resolved: null,
      error: `Published version "${targetVersion}" not found for decision table "${table.name}".`,
    };
  }

  const latestPublishedSnap = table.versionHistory.find((v) => v.status === 'Published');
  if (latestPublishedSnap) {
    try {
      const parsed = JSON.parse(latestPublishedSnap.serializedSpec);
      if (isPlainObject(parsed) && Array.isArray(parsed.rows)) {
        return resolvePublishedTableSpec(table, latestPublishedSnap.version);
      }
    } catch {
      // ignore partial summary
    }
  }

  if (table.status === 'Published') {
    return { resolved: table };
  }

  return {
    resolved: null,
    error: `Decision table "${table.name}" has no published immutable version (current status: ${table.status}).`,
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
