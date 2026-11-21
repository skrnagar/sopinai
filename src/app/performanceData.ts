import { AgentConfig, ExecutionRun } from './types';

export interface DailyPerformancePoint {
  dateIso: string;
  shortDate: string;
  fullDate: string;
  avgExecutionSec: number;
  p95ExecutionSec: number;
  successRatePct: number;
  totalRuns: number;
  failedRuns: number;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise(seed: number, dayIndex: number): number {
  const x = Math.sin(seed * 0.00017 + dayIndex * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function build30DayPerformanceSeries(
  workspaceId: string,
  agents: AgentConfig[],
  runs: ExecutionRun[],
  selectedAgentId: string | 'all'
): DailyPerformancePoint[] {
  const activeAgent =
    selectedAgentId === 'all' ? undefined : agents.find((a) => a.id === selectedAgentId);

  const seed = hashSeed(`${workspaceId}:${activeAgent ? activeAgent.id : 'all'}`);

  // Baseline latency & reliability profile tailored to selected scope
  const baseLatencySec = activeAgent
    ? activeAgent.modelRoute === 'citation-audit'
      ? 2.7
      : activeAgent.modelRoute === 'deterministic-fast'
      ? 1.9
      : 3.9
    : workspaceId === 'ws-ops'
    ? 2.4
    : 3.4;

  const baseSuccessPct = activeAgent
    ? activeAgent.permissionMode === 'read-only'
      ? 97.6
      : 95.1
    : workspaceId === 'ws-ops'
    ? 95.8
    : 96.1;

  const baseVolume = activeAgent ? 18 : 46;

  // Compute local prototype runs for Today (Day 30) so user actions in /app reflect live
  const scopedRuns = runs.filter((r) => {
    if (r.workspaceId !== workspaceId) return false;
    if (activeAgent && r.targetName !== activeAgent.name) return false;
    return true;
  });

  const todayReference = new Date();
  const points: DailyPerformancePoint[] = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const dayIndex = 29 - offset;
    const d = new Date(todayReference);
    d.setDate(todayReference.getDate() - offset);

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const n1 = seededNoise(seed, dayIndex);
    const n2 = seededNoise(seed + 97, dayIndex);
    const n3 = seededNoise(seed + 313, dayIndex);

    // Slight latency improvement trend over the 30-day window + occasional realistic spike
    const trendLatencyShift = -0.35 * (dayIndex / 29);
    const spikeLatency = n1 > 0.88 ? 1.45 : n1 < 0.1 ? -0.35 : 0;
    const avgExecutionSec = Number(
      Math.max(0.9, baseLatencySec + trendLatencyShift + (n1 - 0.5) * 0.9 + spikeLatency).toFixed(2)
    );
    const p95ExecutionSec = Number(
      (avgExecutionSec * (1.42 + n2 * 0.38)).toFixed(2)
    );

    // Occasional reliability dip aligned with latency spikes
    const dipPenalty = n1 > 0.88 ? -5.8 : n2 < 0.14 ? -3.2 : 0;
    const rawSuccess = baseSuccessPct + (n3 - 0.45) * 3.4 + dipPenalty;
    let successRatePct = Number(Math.min(100, Math.max(82, rawSuccess)).toFixed(1));

    const dayVolumeFactor = isWeekend ? 0.58 : 1.05;
    let totalRuns = Math.max(
      4,
      Math.round(baseVolume * dayVolumeFactor * (0.8 + n2 * 0.45))
    );
    let failedRuns = Math.max(0, Math.round(totalRuns * ((100 - successRatePct) / 100)));

    // Fold live local workspace runs into Day 30 (Today)
    if (offset === 0 && scopedRuns.length > 0) {
      const completedCount = scopedRuns.filter((r) => r.status === 'completed').length;
      const failedOrCancelledCount = scopedRuns.filter(
        (r) => r.status === 'failed' || r.status === 'cancelled'
      ).length;
      const resolvedLocal = completedCount + failedOrCancelledCount;
      totalRuns += scopedRuns.length;
      failedRuns += failedOrCancelledCount;
      if (resolvedLocal > 0) {
        const recalculated = ((totalRuns - failedRuns) / totalRuns) * 100;
        successRatePct = Number(Math.min(100, Math.max(75, recalculated)).toFixed(1));
      }
    }

    const monthLabel = SHORT_MONTHS[d.getMonth()];
    const dayNum = d.getDate();
    const shortDate = `${monthLabel} ${dayNum}`;
    const fullDate = `${monthLabel} ${dayNum}, ${d.getFullYear()}`;
    const dateIso = d.toISOString().slice(0, 10);

    points.push({
      dateIso,
      shortDate,
      fullDate,
      avgExecutionSec,
      p95ExecutionSec,
      successRatePct,
      totalRuns,
      failedRuns,
    });
  }

  return points;
}
