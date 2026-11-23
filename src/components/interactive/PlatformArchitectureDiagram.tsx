import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Lock,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import {
  ArchitectureLayerId,
  ArchitectureNodeSpec,
  ArchitectureSignalKind,
  PLATFORM_ARCHITECTURE_EDGES,
  PLATFORM_ARCHITECTURE_LAYERS,
  PLATFORM_ARCHITECTURE_NODES,
  PLATFORM_GOVERNANCE_LAYER,
  ProductSurfaceSummary,
} from '../../data/sopinData';
import { RoutePath } from '../../types/navigation';

interface PlatformArchitectureDiagramProps {
  onNavigate?: (path: RoutePath) => void;
}

type ProductId = ProductSurfaceSummary['id'];

const PRODUCT_ICON_MAP: Record<
  ProductId,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  studio: Sparkles,
  flow: GitBranch,
  graph: Workflow,
  context: Database,
  decisions: Scale,
  runtime: Cpu,
  gateway: Network,
  observe: Activity,
  evaluate: FlaskConical,
  control: ShieldCheck,
};

const VALID_PRODUCT_ROUTES = new Set<RoutePath>([
  '/studio',
  '/flow',
  '/graph',
  '/context',
  '/decisions',
  '/runtime',
  '/gateway',
  '/observe',
  '/evaluate',
  '/control',
]);

// Column centers on a 1000-unit SVG coordinate space aligning with lg:grid-cols-4
const NODE_ANCHORS_X: Record<Exclude<ProductId, 'control'>, number> = {
  studio: 500,
  flow: 125,
  graph: 375,
  context: 625,
  decisions: 875,
  runtime: 125,
  gateway: 375,
  observe: 625,
  evaluate: 875,
};

function edgeStrokeProps(kind: ArchitectureSignalKind, highlighted: boolean, dimmed: boolean) {
  const baseOpacity = dimmed ? 0.14 : highlighted ? 1 : 0.34;
  const strokeWidth = highlighted ? 2 : 1.25;
  const stroke = highlighted
    ? kind === 'context'
      ? '#C084FC'
      : kind === 'feedback'
      ? '#D8B4FE'
      : '#8F00FF'
    : 'rgba(170, 184, 206, 0.7)';

  const strokeDasharray =
    kind === 'context' ? '2 4' : kind === 'feedback' ? '6 4' : undefined;

  return {
    stroke,
    strokeWidth,
    strokeOpacity: baseOpacity,
    strokeDasharray,
    className: 'transition-all duration-200',
  };
}

export const PlatformArchitectureDiagram: React.FC<PlatformArchitectureDiagramProps> = ({
  onNavigate,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<ProductId | null>('studio');
  const [selectedLayerId, setSelectedLayerId] = useState<ArchitectureLayerId | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<ProductId | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<ArchitectureLayerId | null>(null);
  const [expandedMobileLayers, setExpandedMobileLayers] = useState<Record<string, boolean>>({
    authoring: true,
    orchestration: true,
    execution: true,
  });

  // Determine the active highlight target (hover takes visual precedence over click selection)
  const activeProductFocus = hoveredProductId ?? (selectedLayerId ? null : selectedProductId);
  const activeLayerFocus = hoveredLayerId ?? selectedLayerId;

  const isGovernanceActive =
    activeProductFocus === 'control' || activeLayerFocus === 'governance';

  const highlightedProductSet = useMemo(() => {
    const set = new Set<ProductId>();
    if (activeLayerFocus) {
      const layer =
        activeLayerFocus === 'governance'
          ? PLATFORM_GOVERNANCE_LAYER
          : PLATFORM_ARCHITECTURE_LAYERS.find((l) => l.id === activeLayerFocus);
      if (layer) {
        layer.nodeIds.forEach((id) => set.add(id));
        if (activeLayerFocus === 'governance') {
          Object.keys(PLATFORM_ARCHITECTURE_NODES).forEach((id) =>
            set.add(id as ProductId)
          );
        }
      }
      return set;
    }

    if (activeProductFocus) {
      set.add(activeProductFocus);
      const spec = PLATFORM_ARCHITECTURE_NODES[activeProductFocus];
      spec.connectsTo.forEach((id) => set.add(id));
      spec.receivesFrom.forEach((id) => set.add(id));
    }
    return set;
  }, [activeProductFocus, activeLayerFocus]);

  const hasAnyFocus = Boolean(activeProductFocus || activeLayerFocus);

  const isEdgeHighlighted = (from: ProductId, to: ProductId) => {
    if (!hasAnyFocus) return false;
    if (isGovernanceActive) return true;
    if (activeLayerFocus) {
      const layer = PLATFORM_ARCHITECTURE_LAYERS.find((l) => l.id === activeLayerFocus);
      if (!layer) return false;
      return layer.nodeIds.includes(from) || layer.nodeIds.includes(to);
    }
    if (activeProductFocus) {
      return from === activeProductFocus || to === activeProductFocus;
    }
    return false;
  };

  const selectProduct = (id: ProductId) => {
    setSelectedLayerId(null);
    setSelectedProductId(id);
  };

  const selectLayer = (layerId: ArchitectureLayerId) => {
    if (layerId === 'governance') {
      setSelectedLayerId('governance');
      setSelectedProductId('control');
      return;
    }
    setSelectedLayerId((prev) => (prev === layerId ? null : layerId));
    const layer = PLATFORM_ARCHITECTURE_LAYERS.find((l) => l.id === layerId);
    if (layer && layer.nodeIds.length > 0) {
      setSelectedProductId(layer.nodeIds[0]);
    }
  };

  const toggleMobileLayer = (layerId: string) => {
    setExpandedMobileLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const inspectedProduct: ArchitectureNodeSpec =
    PLATFORM_ARCHITECTURE_NODES[selectedProductId ?? 'studio'];

  const inspectedLayer = selectedLayerId
    ? selectedLayerId === 'governance'
      ? PLATFORM_GOVERNANCE_LAYER
      : PLATFORM_ARCHITECTURE_LAYERS.find((l) => l.id === selectedLayerId) ?? null
    : null;

  const hoverTooltipNode = hoveredProductId
    ? PLATFORM_ARCHITECTURE_NODES[hoveredProductId]
    : null;

  const controlSpec = PLATFORM_ARCHITECTURE_NODES.control;

  const renderDesktopNode = (nodeId: Exclude<ProductId, 'control'>, compactCenter = false) => {
    const spec = PLATFORM_ARCHITECTURE_NODES[nodeId];
    const Icon = PRODUCT_ICON_MAP[nodeId];
    const isSelected = selectedProductId === nodeId && !selectedLayerId;
    const isHovered = hoveredProductId === nodeId;
    const isRelated = hasAnyFocus && highlightedProductSet.has(nodeId);
    const isDimmed = hasAnyFocus && !isRelated && !isGovernanceActive;

    return (
      <div
        key={nodeId}
        className={`relative group ${compactCenter ? 'w-full max-w-[360px] mx-auto' : 'w-full'}`}
      >
        {/* Non-shifting hover tooltip on desktop */}
        <div
          role="tooltip"
          className={`hidden lg:block pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 -translate-y-full z-20 w-64 rounded-lg border border-[#8F00FF]/45 bg-[#0B1324] px-3 py-2 text-[11px] leading-snug text-[#FFFFFF] shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="block font-mono text-[10px] text-[#D8B4FE] mb-0.5">
            {spec.name}
          </span>
          <span className="text-[#AAB8CE]">{spec.tooltipPurpose}</span>
        </div>

        <button
          type="button"
          onClick={() => selectProduct(nodeId)}
          onMouseEnter={() => setHoveredProductId(nodeId)}
          onMouseLeave={() => setHoveredProductId(null)}
          onFocus={() => setHoveredProductId(nodeId)}
          onBlur={() => setHoveredProductId(null)}
          aria-pressed={isSelected}
          aria-label={`${spec.name}: ${spec.responsibility}`}
          className={`w-full h-full text-left rounded-xl border p-4 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C084FC] ${
            isSelected || isHovered
              ? 'border-[#8F00FF] bg-[#14233B] shadow-[0_0_0_1px_rgba(143,0,255,0.55),0_12px_28px_-12px_rgba(143,0,255,0.45)]'
              : isRelated
              ? 'border-[#8F00FF]/55 bg-[#14233B]/90'
              : isDimmed
              ? 'border-[#AAB8CE]/10 bg-[#101D35]/60 opacity-60'
              : 'border-[#AAB8CE]/15 bg-[#14233B]/85 hover:border-[#8F00FF]/70 hover:bg-[#14233B]'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected || isHovered || isRelated
                    ? 'border-[#8F00FF]/60 bg-[#8F00FF]/20 text-[#D8B4FE]'
                    : 'border-[#AAB8CE]/15 bg-[#080D18]/70 text-[#C084FC]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden={true} />
              </span>
              <div className="min-w-0">
                <span className="block font-display text-sm font-semibold text-[#FFFFFF] truncate">
                  {spec.name}
                </span>
                <span className="block font-mono text-[10px] text-[#AAB8CE] truncate">
                  {spec.category}
                </span>
              </div>
            </div>

            <span
              className={`mt-0.5 font-mono text-[10px] shrink-0 transition-colors ${
                isSelected || isHovered
                  ? 'text-[#D8B4FE]'
                  : isRelated
                  ? 'text-[#C084FC]'
                  : 'text-[#AAB8CE]/45'
              }`}
              aria-hidden="true"
            >
              {isSelected ? 'ACTIVE' : '↗'}
            </span>
          </div>

          <p className="mt-3 text-xs text-[#AAB8CE] leading-relaxed">
            {spec.responsibility}
          </p>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* DESKTOP & TABLET ARCHITECTURAL CANVAS (md+)                           */}
      {/* ===================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block relative rounded-2xl border border-[#AAB8CE]/15 bg-[#080D18] overflow-hidden shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]"
      >
        {/* Subtle radial glow & architectural grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 sopin-arch-grid sopin-arch-glow"
        />

        {/* OUTER GOVERNANCE BOUNDARY — SOPIN CONTROL */}
        <div className="relative p-5 lg:p-7">
          <div
            className={`relative rounded-xl border transition-all duration-300 ${
              isGovernanceActive
                ? 'border-[#8F00FF] bg-[#101D35]/55 shadow-[0_0_0_1px_rgba(143,0,255,0.45),0_0_48px_-16px_rgba(143,0,255,0.45)]'
                : 'border-[#8F00FF]/35 bg-[#0B1324]/70'
            }`}
          >
            {/* Top Cross-Cutting Governance Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 border-b border-[#8F00FF]/25 bg-[#101D35]/75 rounded-t-xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => selectProduct('control')}
                  onMouseEnter={() => {
                    setHoveredProductId('control');
                    setHoveredLayerId('governance');
                  }}
                  onMouseLeave={() => {
                    setHoveredProductId(null);
                    setHoveredLayerId(null);
                  }}
                  onFocus={() => {
                    setHoveredProductId('control');
                    setHoveredLayerId('governance');
                  }}
                  onBlur={() => {
                    setHoveredProductId(null);
                    setHoveredLayerId(null);
                  }}
                  aria-pressed={selectedProductId === 'control' || selectedLayerId === 'governance'}
                  className={`inline-flex items-center gap-3 rounded-lg border px-3.5 py-2 text-left transition-all min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C084FC] ${
                    selectedProductId === 'control' || isGovernanceActive
                      ? 'border-[#8F00FF] bg-[#14233B] text-[#FFFFFF]'
                      : 'border-[#8F00FF]/40 bg-[#14233B]/75 text-[#FFFFFF] hover:border-[#8F00FF]'
                  }`}
                >
                  <span className="w-7 h-7 rounded-md bg-[#8F00FF]/20 border border-[#8F00FF]/50 flex items-center justify-center text-[#D8B4FE] shrink-0">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-semibold text-[#FFFFFF]">
                      {controlSpec.name}
                    </span>
                    <span className="block font-mono text-[10px] text-[#D8B4FE] tracking-wider">
                      {PLATFORM_GOVERNANCE_LAYER.visualLabel}
                    </span>
                  </span>
                </button>

                <p className="hidden xl:block text-xs text-[#AAB8CE] max-w-md leading-relaxed">
                  {controlSpec.responsibility}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#AAB8CE]">
                <Lock className="w-3.5 h-3.5 text-[#C084FC]" aria-hidden="true" />
                <span>Cross-cutting policy boundary across all 3 layers</span>
              </div>
            </div>

            {/* Governance Lateral Enforcement Rails + Inner Architecture Stack */}
            <div className="relative px-4 sm:px-6 lg:px-8 py-6">
              {/* Left & Right continuous perimeter lines signifying non-bypassable Control */}
              <div
                aria-hidden="true"
                className={`hidden lg:flex flex-col justify-around items-center absolute left-2 top-8 bottom-8 w-3 transition-opacity duration-200 ${
                  isGovernanceActive ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <span className="w-px flex-1 bg-gradient-to-b from-[#8F00FF]/60 via-[#C084FC]/60 to-[#8F00FF]/60" />
              </div>
              <div
                aria-hidden="true"
                className={`hidden lg:flex flex-col justify-around items-center absolute right-2 top-8 bottom-8 w-3 transition-opacity duration-200 ${
                  isGovernanceActive ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <span className="w-px flex-1 bg-gradient-to-b from-[#8F00FF]/60 via-[#C084FC]/60 to-[#8F00FF]/60" />
              </div>

              {/* Subtle central platform identity anchor */}
              <div className="flex items-center justify-center gap-3 pb-5">
                <span className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-[#8F00FF]/50" />
                <div className="text-center">
                  <span className="block font-display text-xs font-semibold tracking-[0.22em] text-[#FFFFFF]">
                    SOPIN
                  </span>
                  <span className="block font-mono text-[10px] tracking-[0.16em] text-[#AAB8CE]">
                    UNIFIED INTELLIGENCE PLATFORM
                  </span>
                </div>
                <span className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-[#8F00FF]/50" />
              </div>

              {/* LAYER 1: EXPERIENCE & AUTHORING */}
              <div
                className={`relative rounded-xl border p-4 sm:p-5 transition-colors duration-200 ${
                  activeLayerFocus === 'authoring' || isGovernanceActive
                    ? 'border-[#8F00FF]/55 bg-[#101D35]/90'
                    : 'border-[#AAB8CE]/12 bg-[#101D35]/65'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => selectLayer('authoring')}
                    onMouseEnter={() => setHoveredLayerId('authoring')}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    className="inline-flex items-center gap-2.5 text-left group min-h-[36px] rounded px-1 -ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C084FC]"
                  >
                    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#D8B4FE] group-hover:text-[#FFFFFF] transition-colors">
                      LAYER 01 · {PLATFORM_ARCHITECTURE_LAYERS[0].visualLabel}
                    </span>
                    <span className="text-xs text-[#AAB8CE]">
                      — {PLATFORM_ARCHITECTURE_LAYERS[0].heading}
                    </span>
                  </button>

                  <span className="font-mono text-[10px] text-[#AAB8CE]">
                    Governed by Control
                  </span>
                </div>

                {renderDesktopNode('studio', true)}
              </div>

              {/* INTER-LAYER SVG CONNECTOR 1 (Authoring -> Intelligence & Orchestration + Evaluate feedback) */}
              <div className="hidden lg:block relative h-14 w-full" aria-hidden="true">
                <svg
                  viewBox="0 0 1000 56"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                >
                  {/* Studio -> Flow / Graph / Context / Decisions */}
                  {(['flow', 'graph', 'context', 'decisions'] as const).map((targetId) => {
                    const edgeSpec = PLATFORM_ARCHITECTURE_EDGES.find(
                      (e) => e.from === 'studio' && e.to === targetId
                    )!;
                    const highlighted = isEdgeHighlighted('studio', targetId);
                    const dimmed = hasAnyFocus && !highlighted;
                    const style = edgeStrokeProps(edgeSpec.kind, highlighted, dimmed);
                    const tx = NODE_ANCHORS_X[targetId];
                    const path =
                      tx === 500
                        ? `M 500 0 L 500 56`
                        : `M 500 0 L 500 22 L ${tx} 22 L ${tx} 56`;
                    return (
                      <g key={edgeSpec.id}>
                        <path d={path} fill="none" {...style} />
                        <circle
                          cx={tx}
                          cy={52}
                          r={highlighted ? 3.5 : 2.25}
                          fill={highlighted ? '#C084FC' : 'rgba(170, 184, 206, 0.5)'}
                          opacity={dimmed ? 0.15 : 1}
                        />
                      </g>
                    );
                  })}
                  {/* Central junction dot */}
                  <circle
                    cx={500}
                    cy={22}
                    r={isEdgeHighlighted('studio', 'flow') ? 4 : 2.75}
                    className="transition-all duration-200 motion-safe:animate-pulse"
                    fill={
                      isEdgeHighlighted('studio', 'flow')
                        ? '#8F00FF'
                        : 'rgba(192, 132, 252, 0.7)'
                    }
                  />
                  {/* Evaluate -> Studio continuous feedback line */}
                  {(() => {
                    const hFb = isEdgeHighlighted('evaluate', 'studio');
                    const dFb = hasAnyFocus && !hFb;
                    return (
                      <g>
                        <path
                          d="M 915 56 L 915 12 L 525 12 L 525 0"
                          fill="none"
                          {...edgeStrokeProps('feedback', hFb, dFb)}
                        />
                        <circle
                          cx={525}
                          cy={4}
                          r={hFb ? 3.5 : 2}
                          fill={hFb ? '#D8B4FE' : 'rgba(170,184,206,0.45)'}
                          opacity={dFb ? 0.15 : 1}
                        />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Tablet vertical flow spacer */}
              <div
                className="lg:hidden flex justify-center py-2 text-[#C084FC]/70"
                aria-hidden="true"
              >
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* LAYER 2: ORCHESTRATION & INTELLIGENCE */}
              <div
                className={`relative rounded-xl border p-4 sm:p-5 transition-colors duration-200 ${
                  activeLayerFocus === 'orchestration' || isGovernanceActive
                    ? 'border-[#8F00FF]/55 bg-[#101D35]/90'
                    : 'border-[#AAB8CE]/12 bg-[#101D35]/65'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => selectLayer('orchestration')}
                    onMouseEnter={() => setHoveredLayerId('orchestration')}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    className="inline-flex items-center gap-2.5 text-left group min-h-[36px] rounded px-1 -ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C084FC]"
                  >
                    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#D8B4FE] group-hover:text-[#FFFFFF] transition-colors">
                      LAYER 02 · {PLATFORM_ARCHITECTURE_LAYERS[1].visualLabel}
                    </span>
                    <span className="text-xs text-[#AAB8CE]">
                      — {PLATFORM_ARCHITECTURE_LAYERS[1].heading}
                    </span>
                  </button>

                  <span className="font-mono text-[10px] text-[#AAB8CE]">
                    Configurable execution paths
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {(['flow', 'graph', 'context', 'decisions'] as const).map((nodeId) =>
                    renderDesktopNode(nodeId)
                  )}
                </div>
              </div>

              {/* INTER-LAYER SVG CONNECTOR 2 (Orchestration/Context/Decisions -> Runtime/Gateway/Observe/Evaluate) */}
              <div className="hidden lg:block relative h-20 w-full" aria-hidden="true">
                <svg
                  viewBox="0 0 1000 80"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                >
                  {/* 1. Flow (125) -> Runtime (125) [execution solid] */}
                  {(() => {
                    const h = isEdgeHighlighted('flow', 'runtime');
                    const d = hasAnyFocus && !h;
                    return (
                      <g>
                        <path
                          d="M 125 0 L 125 80"
                          fill="none"
                          {...edgeStrokeProps('execution', h, d)}
                        />
                        <circle
                          cx={125}
                          cy={76}
                          r={h ? 3.5 : 2.25}
                          fill={h ? '#C084FC' : 'rgba(170,184,206,0.5)'}
                          opacity={d ? 0.15 : 1}
                        />
                      </g>
                    );
                  })()}

                  {/* 2. Graph (375) -> Runtime (125) [execution solid] */}
                  {(() => {
                    const h = isEdgeHighlighted('graph', 'runtime');
                    const d = hasAnyFocus && !h;
                    return (
                      <path
                        d="M 365 0 L 365 20 L 140 20 L 140 80"
                        fill="none"
                        {...edgeStrokeProps('execution', h, d)}
                      />
                    );
                  })()}

                  {/* 3. Decisions (875) -> Runtime (125) [execution solid] */}
                  {(() => {
                    const h = isEdgeHighlighted('decisions', 'runtime');
                    const d = hasAnyFocus && !h;
                    return (
                      <path
                        d="M 860 0 L 860 32 L 155 32 L 155 80"
                        fill="none"
                        {...edgeStrokeProps('execution', h, d)}
                      />
                    );
                  })()}

                  {/* 4. Context (625) -> Gateway (375) [context dotted] */}
                  {(() => {
                    const h = isEdgeHighlighted('context', 'gateway');
                    const d = hasAnyFocus && !h;
                    return (
                      <g>
                        <path
                          d="M 615 0 L 615 44 L 385 44 L 385 80"
                          fill="none"
                          {...edgeStrokeProps('context', h, d)}
                        />
                        <circle
                          cx={385}
                          cy={76}
                          r={h ? 3.5 : 2.25}
                          fill={h ? '#C084FC' : 'rgba(170,184,206,0.5)'}
                          opacity={d ? 0.15 : 1}
                        />
                      </g>
                    );
                  })()}

                  {/* 5. Gateway (375) <-> Flow (125) & Graph (375) [context dotted] */}
                  {(() => {
                    const hFlow = isEdgeHighlighted('gateway', 'flow');
                    const dFlow = hasAnyFocus && !hFlow;
                    const hGraph = isEdgeHighlighted('gateway', 'graph');
                    const dGraph = hasAnyFocus && !hGraph;
                    return (
                      <>
                        <path
                          d="M 360 80 L 360 56 L 110 56 L 110 0"
                          fill="none"
                          {...edgeStrokeProps('context', hFlow, dFlow)}
                        />
                        <path
                          d="M 375 80 L 375 0"
                          fill="none"
                          {...edgeStrokeProps('context', hGraph, dGraph)}
                        />
                      </>
                    );
                  })()}

                  {/* 6. Runtime (125) & Gateway (375) -> Observe (625) [feedback dashed] */}
                  {(() => {
                    const hRunObs = isEdgeHighlighted('runtime', 'observe');
                    const dRunObs = hasAnyFocus && !hRunObs;
                    const hGwObs = isEdgeHighlighted('gateway', 'observe');
                    const dGwObs = hasAnyFocus && !hGwObs;
                    return (
                      <>
                        <path
                          d="M 170 80 L 170 66 L 625 66 L 625 80"
                          fill="none"
                          {...edgeStrokeProps('feedback', hRunObs, dRunObs)}
                        />
                        <path
                          d="M 400 80 L 400 66 L 625 66"
                          fill="none"
                          {...edgeStrokeProps('feedback', hGwObs, dGwObs)}
                        />
                        <circle
                          cx={625}
                          cy={76}
                          r={hRunObs || hGwObs ? 3.5 : 2.25}
                          fill={hRunObs || hGwObs ? '#D8B4FE' : 'rgba(170,184,206,0.5)'}
                          opacity={dRunObs && dGwObs ? 0.15 : 1}
                        />
                      </>
                    );
                  })()}

                  {/* 7. Context (625) & Decisions (875) -> Evaluate (875) [feedback dashed] */}
                  {(() => {
                    const hEvalCtx = isEdgeHighlighted('evaluate', 'context');
                    const dEvalCtx = hasAnyFocus && !hEvalCtx;
                    const hEvalDec = isEdgeHighlighted('evaluate', 'decisions');
                    const dEvalDec = hasAnyFocus && !hEvalDec;
                    return (
                      <>
                        <path
                          d="M 635 0 L 635 54 L 875 54 L 875 80"
                          fill="none"
                          {...edgeStrokeProps('feedback', hEvalCtx, dEvalCtx)}
                        />
                        <path
                          d="M 890 0 L 890 80"
                          fill="none"
                          {...edgeStrokeProps('feedback', hEvalDec, dEvalDec)}
                        />
                        <circle
                          cx={875}
                          cy={76}
                          r={hEvalCtx || hEvalDec ? 3.5 : 2.25}
                          fill={hEvalCtx || hEvalDec ? '#D8B4FE' : 'rgba(170,184,206,0.5)'}
                          opacity={dEvalCtx && dEvalDec ? 0.15 : 1}
                        />
                      </>
                    );
                  })()}

                  {/* 8. Evaluate -> Studio continuous upward feedback bus */}
                  {(() => {
                    const hFb = isEdgeHighlighted('evaluate', 'studio');
                    const dFb = hasAnyFocus && !hFb;
                    return (
                      <path
                        d="M 905 80 L 905 16 L 915 16 L 915 0"
                        fill="none"
                        {...edgeStrokeProps('feedback', hFb, dFb)}
                      />
                    );
                  })()}

                  {/* 9. Gateway <-> Runtime & Observe -> Evaluate layer handoffs */}
                  {(() => {
                    const hGwRun = isEdgeHighlighted('gateway', 'runtime');
                    const dGwRun = hasAnyFocus && !hGwRun;
                    const hObsEval = isEdgeHighlighted('observe', 'evaluate');
                    const dObsEval = hasAnyFocus && !hObsEval;
                    return (
                      <>
                        <path
                          d="M 350 80 L 350 72 L 158 72 L 158 80"
                          fill="none"
                          {...edgeStrokeProps('execution', hGwRun, dGwRun)}
                        />
                        <path
                          d="M 642 80 L 642 72 L 858 72 L 858 80"
                          fill="none"
                          {...edgeStrokeProps('feedback', hObsEval, dObsEval)}
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div
                className="lg:hidden flex justify-center py-2 text-[#C084FC]/70"
                aria-hidden="true"
              >
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* LAYER 3: EXECUTION & OPERATIONS */}
              <div
                className={`relative rounded-xl border p-4 sm:p-5 transition-colors duration-200 ${
                  activeLayerFocus === 'execution' || isGovernanceActive
                    ? 'border-[#8F00FF]/55 bg-[#101D35]/90'
                    : 'border-[#AAB8CE]/12 bg-[#101D35]/65'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => selectLayer('execution')}
                    onMouseEnter={() => setHoveredLayerId('execution')}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    className="inline-flex items-center gap-2.5 text-left group min-h-[36px] rounded px-1 -ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C084FC]"
                  >
                    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#D8B4FE] group-hover:text-[#FFFFFF] transition-colors">
                      LAYER 03 · {PLATFORM_ARCHITECTURE_LAYERS[2].visualLabel}
                    </span>
                    <span className="text-xs text-[#AAB8CE]">
                      — {PLATFORM_ARCHITECTURE_LAYERS[2].heading}
                    </span>
                  </button>

                  <span className="font-mono text-[10px] text-[#AAB8CE]">
                    Sandboxed & observable
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {(['runtime', 'gateway', 'observe', 'evaluate'] as const).map((nodeId) =>
                    renderDesktopNode(nodeId)
                  )}
                </div>
              </div>

              {/* Signal Legend + Live Hover Status Strip */}
              <div className="mt-5 pt-4 border-t border-[#AAB8CE]/10 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#AAB8CE]">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-[#8F00FF] inline-block" aria-hidden="true" />
                    <span>Execution & orchestration</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-5 border-b-2 border-dotted border-[#C084FC] inline-block"
                      aria-hidden="true"
                    />
                    <span>Context & data flow</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-5 border-b-2 border-dashed border-[#D8B4FE] inline-block"
                      aria-hidden="true"
                    />
                    <span>Evaluation & verification</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm border border-[#8F00FF] inline-block"
                      aria-hidden="true"
                    />
                    <span>Governance boundary</span>
                  </span>
                </div>

                <span className="text-[#D8B4FE] min-h-[16px]">
                  {hoverTooltipNode
                    ? `Inspecting signal path: ${hoverTooltipNode.name}`
                    : 'Hover or select any product node or layer'}
                </span>
              </div>
            </div>

            {/* Bottom Perimeter Strip reinforcing Control spans all layers */}
            <div className="px-5 py-2.5 border-t border-[#8F00FF]/25 bg-[#101D35]/70 rounded-b-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#AAB8CE]">
              <span className="text-[#D8B4FE]">
                SOPIN Control · Enforced independently of agent reasoning
              </span>
              <span>RBAC · Tool Allowlists · Budgets · Human Sign-Off · Audit Trails</span>
            </div>
          </div>
        </div>

        {/* INTEGRATED PRODUCT / LAYER INSPECTOR BAR (Desktop & Tablet) */}
        <div
          aria-live="polite"
          className="relative px-6 lg:px-8 py-6 border-t border-[#AAB8CE]/15 bg-[#0C1425]"
        >
          {inspectedLayer && !hoveredProductId ? (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#D8B4FE]">
                  <span>{inspectedLayer.visualLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedLayer.heading}</span>
                </div>
                <p className="text-sm sm:text-base text-[#FFFFFF] leading-relaxed">
                  {inspectedLayer.summary}
                </p>
                {inspectedLayer.id === 'governance' && (
                  <p className="text-xs text-[#AAB8CE] leading-relaxed">
                    Governance is enforced out-of-band across authoring, orchestration, and execution—agents cannot prompt-inject or reason past organization RBAC, spend caps, or mandatory approval gates.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {inspectedLayer.nodeIds.map((nid) => {
                  const n = PLATFORM_ARCHITECTURE_NODES[nid];
                  return (
                    <button
                      key={nid}
                      type="button"
                      onClick={() => selectProduct(nid)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#8F00FF]/45 bg-[#14233B] hover:border-[#8F00FF] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap"
                    >
                      Inspect {n.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                  <span className="text-[#D8B4FE] font-semibold">
                    {inspectedProduct.name}
                  </span>
                  <span className="text-[#AAB8CE]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#AAB8CE]">{inspectedProduct.category}</span>
                  <span className="text-[#AAB8CE]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#AAB8CE]">{inspectedProduct.status}</span>
                </div>

                <p className="text-sm sm:text-base font-medium text-[#FFFFFF] leading-relaxed">
                  {inspectedProduct.responsibility}
                </p>

                <p className="text-xs sm:text-sm text-[#AAB8CE] leading-relaxed">
                  {inspectedProduct.architecturalRole}
                </p>

                {inspectedProduct.id === 'control' && (
                  <p className="text-xs text-[#D8B4FE] leading-relaxed pt-1">
                    Governance is enforced independently of agent reasoning across Experience & Authoring, Orchestration & Intelligence, and Execution & Operations.
                  </p>
                )}

                <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#AAB8CE]">
                  <span className="font-mono text-[11px] text-[#AAB8CE]">Connected nodes:</span>
                  {Array.from(
                    new Set([...inspectedProduct.receivesFrom, ...inspectedProduct.connectsTo])
                  )
                    .slice(0, 5)
                    .map((neighborId) => {
                      const neighbor = PLATFORM_ARCHITECTURE_NODES[neighborId];
                      return (
                        <button
                          key={neighborId}
                          type="button"
                          onClick={() => selectProduct(neighborId)}
                          className="text-xs font-medium text-[#D8B4FE] hover:text-[#FFFFFF] hover:underline transition-colors"
                        >
                          {neighbor.shortName}
                        </button>
                      );
                    })}
                </div>
              </div>

              {onNavigate && VALID_PRODUCT_ROUTES.has(inspectedProduct.href) && (
                <a
                  href={inspectedProduct.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(inspectedProduct.href);
                  }}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#8F00FF] hover:bg-[#7A00DB] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap self-start lg:self-center shrink-0"
                >
                  <span>Explore product</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ===================================================================== */}
      {/* MOBILE VERTICAL CONNECTED SYSTEM (< md)                              */}
      {/* ===================================================================== */}
      <div className="md:hidden rounded-2xl border border-[#8F00FF]/45 bg-[#0B1324] overflow-hidden">
        {/* Continuous Governance Top Bar */}
        <div className="p-4 border-b border-[#8F00FF]/30 bg-[#101D35]">
          <button
            type="button"
            onClick={() =>
              setSelectedProductId((prev) => (prev === 'control' ? null : 'control'))
            }
            aria-expanded={selectedProductId === 'control'}
            className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-[#8F00FF]/20 border border-[#8F00FF]/50 flex items-center justify-center text-[#D8B4FE] shrink-0">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] text-[#D8B4FE] tracking-wider">
                  TRUST · SECURITY · GOVERNANCE
                </span>
                <span className="block font-display text-sm font-semibold text-[#FFFFFF]">
                  {controlSpec.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#D8B4FE] transition-transform shrink-0 ${
                selectedProductId === 'control' ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {selectedProductId === 'control' && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3 text-xs">
              <p className="text-[#FFFFFF] leading-relaxed">{controlSpec.responsibility}</p>
              <p className="text-[#AAB8CE] leading-relaxed">
                Governance applies across every stage independently of agent reasoning—policies, RBAC, spend caps, and human approvals bind Studio, Flow, Graph, Context, Decisions, Runtime, and Gateway.
              </p>
              {onNavigate && VALID_PRODUCT_ROUTES.has(controlSpec.href) && (
                <a
                  href={controlSpec.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(controlSpec.href);
                  }}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-lg bg-[#8F00FF] text-white text-xs font-semibold"
                >
                  <span>Explore product</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Vertical Architecture Stack with Left Governance Boundary Rail */}
        <div className="relative pl-5 pr-4 py-5 space-y-4">
          {/* Continuous left governance boundary rail showing Control spans all stages */}
          <div
            aria-hidden="true"
            className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-[#8F00FF] via-[#C084FC] to-[#8F00FF]"
          />

          {PLATFORM_ARCHITECTURE_LAYERS.map((layer, layerIdx) => {
            const isExpanded = expandedMobileLayers[layer.id] ?? true;
            return (
              <div key={layer.id} className="space-y-3">
                <div className="rounded-xl border border-[#AAB8CE]/15 bg-[#101D35]/85 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleMobileLayer(layer.id)}
                    aria-expanded={isExpanded}
                    className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
                      <span className="block font-mono text-[10px] font-semibold tracking-[0.12em] text-[#D8B4FE]">
                        {layer.order} · {layer.visualLabel}
                      </span>
                      <span className="block font-display text-sm font-semibold text-[#FFFFFF]">
                        {layer.heading}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#AAB8CE] transition-transform shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-white/10 pt-3">
                      {layer.nodeIds.map((nodeId) => {
                        const spec = PLATFORM_ARCHITECTURE_NODES[nodeId];
                        const Icon = PRODUCT_ICON_MAP[nodeId];
                        const open = selectedProductId === nodeId;
                        return (
                          <div
                            key={nodeId}
                            className={`rounded-lg border transition-colors ${
                              open
                                ? 'border-[#8F00FF] bg-[#14233B]'
                                : 'border-[#AAB8CE]/15 bg-[#14233B]/75'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProductId((prev) => (prev === nodeId ? null : nodeId))
                              }
                              aria-expanded={open}
                              className="w-full min-h-[48px] p-3 flex items-center justify-between gap-3 text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-md bg-[#8F00FF]/20 border border-[#8F00FF]/40 flex items-center justify-center text-[#D8B4FE] shrink-0">
                                  <Icon className="w-4 h-4" aria-hidden={true} />
                                </span>
                                <div className="min-w-0">
                                  <span className="block font-display text-sm font-semibold text-[#FFFFFF]">
                                    {spec.name}
                                  </span>
                                  <span className="block text-[11px] text-[#AAB8CE] line-clamp-1">
                                    {spec.responsibility}
                                  </span>
                                </div>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-[#AAB8CE] transition-transform shrink-0 ${
                                  open ? 'rotate-180' : ''
                                }`}
                                aria-hidden="true"
                              />
                            </button>

                            {open && (
                              <div className="px-3 pb-3 pt-2 border-t border-white/10 space-y-2.5 text-xs">
                                <p className="text-[#FFFFFF] leading-relaxed">
                                  {spec.responsibility}
                                </p>
                                <p className="text-[#AAB8CE] leading-relaxed">
                                  {spec.architecturalRole}
                                </p>
                                {onNavigate && VALID_PRODUCT_ROUTES.has(spec.href) && (
                                  <a
                                    href={spec.href}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onNavigate(spec.href);
                                    }}
                                    className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2 rounded-lg bg-[#8F00FF] text-white text-xs font-semibold"
                                  >
                                    <span>Explore product</span>
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {layerIdx < PLATFORM_ARCHITECTURE_LAYERS.length - 1 && (
                  <div className="flex items-center gap-2 pl-3 text-[10px] font-mono text-[#D8B4FE]">
                    <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Typed runtime & context signal path</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
