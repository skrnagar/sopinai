import {
  DecisionArtifactSpec,
  DecisionArtifactType,
  DecisionEnvironment,
  DecisionSettings,
  DecisionTestCase,
} from '../types';
import { validateArtifact, ValidationCollections } from './validators';
import { computeArtifactSpecHash } from './versioning';

export interface GovernancePolicyCheck {
  allowed: boolean;
  reasons: string[];
  warnings: string[];
  requiredAction?: string;
}

/**
 * Frontend Prototype Governance Policy Layer.
 * Evaluates SOPIN Control rules locally against active workspace role & DecisionSettings.
 * Structured as a clean pure service ready to swap with server-side RBAC & approvals later.
 */

function isRoleAuthorizedToEdit(
  workspaceRole: string,
  policy: DecisionSettings['allowedEditorsRole']
): boolean {
  const norm = workspaceRole.toLowerCase();
  if (policy === 'All Workspace Members') return true;
  if (policy === 'Builders & Maintainers') {
    return (
      norm.includes('owner') ||
      norm.includes('admin') ||
      norm.includes('maintainer') ||
      norm.includes('architect') ||
      norm.includes('builder')
    );
  }
  // 'Owner & Admin'
  return norm.includes('owner') || norm.includes('admin');
}

function isRoleAuthorizedToPublish(
  workspaceRole: string,
  policy: DecisionSettings['allowedPublishersRole']
): boolean {
  const norm = workspaceRole.toLowerCase();
  if (policy === 'Workspace Maintainer') {
    return (
      norm.includes('owner') ||
      norm.includes('admin') ||
      norm.includes('maintainer') ||
      norm.includes('architect')
    );
  }
  // 'Owner & Admin Only'
  return norm.includes('owner') || norm.includes('admin');
}

export function checkEditPermission(
  workspaceRole: string,
  settings: DecisionSettings
): GovernancePolicyCheck {
  if (isRoleAuthorizedToEdit(workspaceRole, settings.allowedEditorsRole)) {
    return { allowed: true, reasons: [], warnings: [] };
  }
  return {
    allowed: false,
    reasons: [
      `Role "${workspaceRole}" cannot modify Decisions artifacts while policy requires "${settings.allowedEditorsRole}".`,
    ],
    warnings: [],
    requiredAction: `Switch to an authorized role or adjust Editing Permissions under Decisions Settings.`,
  };
}

export function checkTestEvidenceFreshness(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec
): {
  hasTests: boolean;
  allPassed: boolean;
  allCurrentForSpec: boolean;
  staleCaseCount: number;
  failedCaseCount: number;
  unrunCaseCount: number;
  currentSpecHash: string;
} {
  const testCases: DecisionTestCase[] = Array.isArray(spec.testCases) ? spec.testCases : [];
  const currentSpecHash = computeArtifactSpecHash(type, spec);
  let failedCaseCount = 0;
  let unrunCaseCount = 0;
  let staleCaseCount = 0;

  for (const tc of testCases) {
    if (tc.lastPassed === undefined) {
      unrunCaseCount++;
      continue;
    }
    if (tc.lastPassed === false) {
      failedCaseCount++;
    }
    const versionMismatch = tc.testedVersion !== undefined && tc.testedVersion !== spec.version;
    const hashMismatch = tc.testedSpecHash !== undefined && tc.testedSpecHash !== currentSpecHash;
    // If case was run with version/hash tracking and the spec/version changed since, mark stale
    if (versionMismatch || hashMismatch) {
      staleCaseCount++;
    } else if (tc.testedVersion === undefined && tc.testedSpecHash === undefined) {
      // Seeded pre-run tests matching initial version remain valid if lastPassed === true, unless draft edited
      if (spec.status === 'Draft' || spec.version.includes('-draft')) {
        staleCaseCount++;
      }
    }
  }

  return {
    hasTests: testCases.length > 0,
    allPassed: testCases.length > 0 && failedCaseCount === 0 && unrunCaseCount === 0,
    allCurrentForSpec: testCases.length > 0 && staleCaseCount === 0,
    staleCaseCount,
    failedCaseCount,
    unrunCaseCount,
    currentSpecHash,
  };
}

export function evaluatePublishGovernancePolicy(
  type: DecisionArtifactType,
  spec: DecisionArtifactSpec,
  targetEnvironment: DecisionEnvironment,
  workspaceRole: string,
  settings: DecisionSettings,
  collections: ValidationCollections = {},
  controlApprovalGranted?: boolean
): GovernancePolicyCheck {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!isRoleAuthorizedToPublish(workspaceRole, settings.allowedPublishersRole)) {
    reasons.push(
      `Publishing blocked: role "${workspaceRole}" does not satisfy Publish Authority policy ("${settings.allowedPublishersRole}").`
    );
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
      if (evidence.staleCaseCount > 0) {
        reasons.push(
          `Test gate enforced: ${evidence.staleCaseCount} test result(s) belong to a prior draft/version and must be re-run against ${spec.version}.`
        );
      }
    }
  }

  if (targetEnvironment === 'production' && settings.requireControlApprovalForProd) {
    const approved = Boolean(controlApprovalGranted || spec.reviewApproval?.approved);
    if (!approved) {
      reasons.push(
        'Production promotion requires explicit SOPIN Control Review Approval before publishing to production.'
      );
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    warnings,
    requiredAction:
      reasons.length > 0
        ? reasons[0]
        : undefined,
  };
}
