import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { AgentConfig, ExecutionRun } from '../types';
import { build30DayPerformanceSeries, DailyPerformancePoint } from '../performanceData';

interface AgentPerformanceChartProps {
  workspaceId: string;
  agents: AgentConfig[];
  runs: ExecutionRun[];
}

type DayWindow = 7 | 14 | 30;
type MetricFocus = 'both' | 'success' | 'latency';

interface CustomTooltipPayloadItem {
  payload?: DailyPerformancePoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<CustomTooltipPayloadItem>;
}

const PerformanceTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-white/15 bg-[#0A1226] text-white px-3.5 py-2.5 shadow-lg text-xs space-y-1.5 min-w-[190px]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
        <span className="font-display font-semibold">{point.fullDate}</span>
        <span className="font-mono text-[10px] text-[#7EC8FF]">{point.totalRuns} runs</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 text-[#D8D8E6]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" aria-hidden="true" />
          Success Rate
        </span>
        <span className="font-mono font-semibold tabular-nums">{point.successRatePct}%</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 text-[#D8D8E6]">
          <span className="w-2 h-2 rounded-full bg-[#60A5FA]" aria-hidden="true" />
          Avg Exec Time
        </span>
        <span className="font-mono font-semibold tabular-nums">{point.avgExecutionSec}s</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px] text-[#A4A4B5] pt-0.5">
        <span>P95 Latency: {point.p95ExecutionSec}s</span>
        <span>{point.failedRuns} failed</span>
      </div>
    </div>
  );
};

export const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({
  workspaceId,
  agents,
  runs,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [windowDays, setWindowDays] = useState<DayWindow>(30);
  const [metricFocus, setMetricFocus] = useState<MetricFocus>('both');

  const workspaceAgents = useMemo(
    () => agents.filter((a) => a.workspaceId === workspaceId),
    [agents, workspaceId]
  );

  // Reset to 'all' if workspace switched and selected agent isn't in the new workspace
  const effectiveAgentId =
    selectedAgentId === 'all' || workspaceAgents.some((a) => a.id === selectedAgentId)
      ? selectedAgentId
      : 'all';

  const full30DaySeries = useMemo(
    () => build30DayPerformanceSeries(workspaceId, workspaceAgents, runs, effectiveAgentId),
    [workspaceId, workspaceAgents, runs, effectiveAgentId]
  );

  const visibleSeries = useMemo(
    () => full30DaySeries.slice(-windowDays),
    [full30DaySeries, windowDays]
  );

  const summary = useMemo(() => {
    const count = visibleSeries.length || 1;
    const avgSuccess =
      visibleSeries.reduce((acc, p) => acc + p.successRatePct, 0) / count;
    const avgLatency =
      visibleSeries.reduce((acc, p) => acc + p.avgExecutionSec, 0) / count;
    const maxP95 = visibleSeries.reduce((max, p) => Math.max(max, p.p95ExecutionSec), 0);
    const totalRuns = visibleSeries.reduce((acc, p) => acc + p.totalRuns, 0);
    const failedRuns = visibleSeries.reduce((acc, p) => acc + p.failedRuns, 0);

    // Compare recent half vs prior half for directional delta
    const mid = Math.floor(count / 2);
    const prior = visibleSeries.slice(0, Math.max(1, mid));
    const recent = visibleSeries.slice(Math.max(1, mid));
    const priorSuccess =
      prior.reduce((acc, p) => acc + p.successRatePct, 0) / prior.length;
    const recentSuccess =
      recent.reduce((acc, p) => acc + p.successRatePct, 0) / recent.length;
    const deltaSuccess = Number((recentSuccess - priorSuccess).toFixed(1));

    return {
      avgSuccess: avgSuccess.toFixed(1),
      avgLatency: avgLatency.toFixed(2),
      maxP95: maxP95.toFixed(2),
      totalRuns,
      failedRuns,
      deltaSuccess,
    };
  }, [visibleSeries]);

  const showSuccess = metricFocus === 'both' || metricFocus === 'success';
  const showLatency = metricFocus === 'both' || metricFocus === 'latency';

  return (
    <section
      aria-label="30-day agent performance chart"
      className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 sm:p-5 space-y-4 min-w-0"
    >
      {/* Header & Window Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-sm sm:text-base font-semibold text-[#05070E] dark:text-white truncate">
              Agent Performance · Last {windowDays} Days
            </h2>
          </div>
          <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
            Execution time (seconds) and task success rate (%) · Sample Telemetry &amp; Local Runs
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          {([7, 14, 30] as const).map((days) => {
            const active = windowDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setWindowDays(days)}
                aria-pressed={active}
                className={`min-h-[38px] sm:min-h-[34px] px-3 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F7F7FA] dark:bg-[#05070E] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10 hover:border-[#2563EB]'
                }`}
              >
                {days}D
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent Scope & Metric Focus Filters (Horizontal Scroll on Narrow Mobile) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div
          role="tablist"
          aria-label="Filter performance by agent"
          className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 min-w-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={effectiveAgentId === 'all'}
            onClick={() => setSelectedAgentId('all')}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              effectiveAgentId === 'all'
                ? 'bg-[#05070E] dark:bg-white text-white dark:text-[#05070E]'
                : 'bg-[#F7F7FA] dark:bg-[#05070E] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
            }`}
          >
            All Agents ({workspaceAgents.length})
          </button>
          {workspaceAgents.map((agent) => {
            const active = effectiveAgentId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#05070E] dark:bg-white text-white dark:text-[#05070E]'
                    : 'bg-[#F7F7FA] dark:bg-[#05070E] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
                }`}
              >
                {agent.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] p-1 border border-[#05070E]/10 dark:border-white/10 self-start md:self-auto shrink-0">
          {([
            { id: 'both', label: 'Combined' },
            { id: 'success', label: 'Success %' },
            { id: 'latency', label: 'Time (s)' },
          ] as const).map((mode) => {
            const active = metricFocus === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setMetricFocus(mode.id)}
                aria-pressed={active}
                className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-white dark:bg-[#0A1226] text-[#05070E] dark:text-white shadow-xs border border-[#05070E]/10 dark:border-white/15'
                    : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-2.5 sm:p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" aria-hidden="true" />
            <span className="truncate">Success Rate</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-display text-base sm:text-xl font-bold text-[#05070E] dark:text-white tabular-nums">
              {summary.avgSuccess}%
            </span>
            <span
              className={`font-mono text-[10px] font-semibold ${
                summary.deltaSuccess >= 0
                  ? 'text-[#2563EB] dark:text-[#7EC8FF]'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {summary.deltaSuccess >= 0 ? `+${summary.deltaSuccess}%` : `${summary.deltaSuccess}%`}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-2.5 sm:p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            <Clock className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" aria-hidden="true" />
            <span className="truncate">Avg Exec Time</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-display text-base sm:text-xl font-bold text-[#05070E] dark:text-white tabular-nums">
              {summary.avgLatency}s
            </span>
            <span className="font-mono text-[10px] text-[#5E5E6E] dark:text-[#A4A4B5]">
              P95 {summary.maxP95}s
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/[0.06] dark:border-white/10 p-2.5 sm:p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5E5E6E] dark:text-[#A4A4B5]">
            <TrendingUp className="w-3.5 h-3.5 text-[#2563EB] shrink-0" aria-hidden="true" />
            <span className="truncate">Runs ({windowDays}d)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-display text-base sm:text-xl font-bold text-[#05070E] dark:text-white tabular-nums">
              {summary.totalRuns.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] text-[#5E5E6E] dark:text-[#A4A4B5]">
              {summary.failedRuns} failed
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Dual-Axis Performance Visualization */}
      <div className="w-full h-[230px] sm:h-[260px] min-w-0 pt-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            data={visibleSeries}
            margin={{ top: 8, right: showLatency ? 4 : 8, left: showSuccess ? -14 : 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sopinSuccessArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#5E5E6E"
              strokeOpacity={0.18}
            />

            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 11, fill: '#5E5E6E' }}
              tickLine={false}
              axisLine={false}
              minTickGap={26}
              interval="preserveStartEnd"
            />

            {showSuccess && (
              <YAxis
                yAxisId="success"
                orientation="left"
                domain={[75, 100]}
                tick={{ fontSize: 11, fill: '#2563EB' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}%`}
                width={46}
              />
            )}

            {showLatency && (
              <YAxis
                yAxisId="latency"
                orientation="right"
                domain={[0, 'dataMax + 1.5']}
                tick={{ fontSize: 11, fill: '#60A5FA' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${Number(value).toFixed(1)}s`}
                width={42}
              />
            )}

            <Tooltip
              content={<PerformanceTooltip />}
              cursor={{ stroke: '#60A5FA', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            {showSuccess && (
              <ReferenceLine
                yAxisId="success"
                y={95}
                stroke="#2563EB"
                strokeDasharray="4 4"
                strokeOpacity={0.35}
              />
            )}

            {showSuccess && (
              <Area
                yAxisId="success"
                type="monotone"
                dataKey="successRatePct"
                name="Success Rate (%)"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sopinSuccessArea)"
                activeDot={{ r: 4, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}

            {showLatency && (
              <Line
                yAxisId="latency"
                type="monotone"
                dataKey="avgExecutionSec"
                name="Avg Execution Time (s)"
                stroke="#60A5FA"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4.5, fill: '#60A5FA', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#05070E]/[0.06] dark:border-white/10 text-[11px] text-[#5E5E6E] dark:text-[#A4A4B5]">
        <div className="flex flex-wrap items-center gap-4">
          {showSuccess && (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#05070E] dark:text-[#E8E8F2]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" aria-hidden="true" />
              <span>Success Rate (%) · 95% SLO line</span>
            </span>
          )}
          {showLatency && (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#05070E] dark:text-[#E8E8F2]">
              <span className="w-3 h-0.5 rounded-full bg-[#60A5FA]" aria-hidden="true" />
              <span>Avg Execution Time (s)</span>
            </span>
          )}
        </div>
        <span className="font-mono text-[10px]">
          Today includes live local runs
        </span>
      </div>
    </section>
  );
};
