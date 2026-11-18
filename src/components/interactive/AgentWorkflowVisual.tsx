import React, { useState } from 'react';
import { Play, RotateCcw, Code2, GitBranch, ShieldCheck, ArrowRight } from 'lucide-react';
import { WORKFLOW_SCENARIOS } from '../../data/sopinData';
import { CodeBlock, StatusText } from '../ui/EditorialPrimitives';

export const AgentWorkflowVisual: React.FC = () => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'graph' | 'sdk'>('graph');

  const scenario = WORKFLOW_SCENARIOS[scenarioIdx];
  const activeNode = scenario.nodes[activeNodeIdx] || scenario.nodes[0];

  const handleSelectScenario = (index: number) => {
    setScenarioIdx(index);
    setActiveNodeIdx(0);
  };

  const handleStepNext = () => {
    setActiveNodeIdx((prev) => (prev + 1) % scenario.nodes.length);
  };

  return (
    <div className="h-full rounded-2xl border border-[#101014]/12 dark:border-white/12 bg-[#101126] text-white flex flex-col overflow-hidden shadow-xl">
      {/* Top Toolbar */}
      <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        <div className="flex flex-wrap items-center gap-1.5">
          {WORKFLOW_SCENARIOS.map((item, idx) => {
            const active = idx === scenarioIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectScenario(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#6252E8] text-white'
                    : 'text-[#B5B5C5] hover:text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.06]">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'graph' ? 'bg-white text-[#101014]' : 'text-[#B5B5C5] hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sdk')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'sdk' ? 'bg-white text-[#101014]' : 'text-[#B5B5C5] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SDK</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-5 sopin-grid-dark">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <StatusText items={[scenario.domain, 'Deterministic Blueprint']} dark accentLast />
            <p className="text-sm text-[#D8D8E6] leading-relaxed max-w-xl">
              {scenario.objective}
            </p>
          </div>
          {viewMode === 'graph' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleStepNext}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#101014] hover:bg-[#F7F7FA] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 text-[#6252E8]" aria-hidden="true" />
                <span>Step Stage ({activeNodeIdx + 1}/{scenario.nodes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNodeIdx(0)}
                aria-label="Reset workflow step"
                className="p-1.5 rounded-lg border border-white/15 text-[#C5C5D6] hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {viewMode === 'graph' ? (
          <>
            {/* 6-Node Interactive Architecture Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {scenario.nodes.map((node, idx) => {
                const isSelected = idx === activeNodeIdx;
                const isCompleted = idx < activeNodeIdx;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveNodeIdx(idx)}
                    className={`text-left rounded-xl p-3 border transition-all ${
                      isSelected
                        ? 'border-[#965BFF] bg-[#6252E8]/20'
                        : isCompleted
                        ? 'border-[#6252E8]/50 bg-white/[0.05]'
                        : 'border-white/10 bg-[#101014]/70 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] tabular-nums text-[#B894FF]">
                        {node.stage}
                      </span>
                      {idx < scenario.nodes.length - 1 && (
                        <ArrowRight
                          className={`w-3 h-3 ${
                            isSelected || isCompleted ? 'text-[#965BFF]' : 'text-white/25'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">
                      {node.title}
                    </p>
                    <p className="text-[11px] text-[#9A9AB0] mt-1 truncate">
                      {node.module}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Node Inspector */}
            <div className="rounded-xl border border-white/12 bg-[#101014]/85 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-[#965BFF]">
                    {activeNode.stage} · {activeNode.module}
                  </span>
                  <h3 className="font-display text-base font-semibold text-white mt-0.5">
                    {activeNode.title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#B5B5C5]">
                  {activeNode.protocol}
                </span>
              </div>

              <p className="text-xs text-[#C5C5D6] leading-relaxed">
                {activeNode.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                  <div className="text-[11px] font-medium text-[#9A9AB0] mb-1">
                    Input Contract
                  </div>
                  <code className="block font-mono text-[11px] text-[#E8E8F2] break-words">
                    {activeNode.inputSample}
                  </code>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                  <div className="text-[11px] font-medium text-[#9A9AB0] mb-1">
                    Output Artifact
                  </div>
                  <code className="block font-mono text-[11px] text-[#E8E8F2] break-words">
                    {activeNode.outputSample}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-[#C5C5D6]">
                <ShieldCheck className="w-4 h-4 text-[#965BFF] shrink-0" aria-hidden="true" />
                <span>{activeNode.policyCheck}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <CodeBlock
              code={scenario.sdkSnippet}
              label={`@sopin/sdk · ${scenario.id}.ts`}
            />
            <p className="mt-3 text-xs text-[#A4A4B5]">
              Visual workflows compile directly to typed SDK definitions—allowing teams to switch seamlessly between studio inspection and Git-versioned code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
