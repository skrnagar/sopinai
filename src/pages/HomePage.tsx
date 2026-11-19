import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Lock,
  Shield,
  Smartphone,
  Terminal,
  Workflow,
} from 'lucide-react';
import {
  CREATION_EXPERIENCES,
  ECOSYSTEM_MODULES,
  LIFECYCLE_STAGES,
  USE_CASE_DOMAINS,
} from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { MultiAgentHeroCanvas } from '../components/interactive/MultiAgentHeroCanvas';
import { InteractiveAgentStack } from '../components/interactive/InteractiveAgentStack';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface HomePageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

const RADIAL_ANGLES = [0, 60, 120, 180, 240, 300];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [activeLifecycle, setActiveLifecycle] = useState(0);
  const [activeCreation, setActiveCreation] = useState(0);
  const [activeDomain, setActiveDomain] = useState(0);

  const selectedStage = LIFECYCLE_STAGES[activeLifecycle];
  const selectedCreation = CREATION_EXPERIENCES[activeCreation];
  const selectedDomain = USE_CASE_DOMAINS[activeDomain];

  return (
    <div className="overflow-x-clip">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] sopin-grid-light dark:sopin-grid-dark">
        {/* Subtle ambient geometric field echoing SOPIN's 6-prong radial emblem */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-52 -left-52 w-[680px] h-[680px] opacity-[0.045] dark:opacity-[0.085]"
        >
          <motion.svg
            viewBox="0 0 100 100"
            fill="none"
            className="w-full h-full text-[#6252E8]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 96, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="47.5"
              stroke="currentColor"
              strokeWidth="0.4"
              strokeDasharray="1.8 2.8"
            />
            {RADIAL_ANGLES.map((angle) => (
              <path
                key={angle}
                d="M 35.5 4 L 39.2 26 A 10.8 10.8 0 0 0 60.8 26 L 64.5 4 L 53.5 4 L 53.5 24.5 A 3.5 3.5 0 0 1 46.5 24.5 L 46.5 4 Z"
                stroke="currentColor"
                strokeWidth="0.6"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
          </motion.svg>
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-14 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col justify-center min-w-0"
            >
              <p className="text-sm font-semibold tracking-tight text-[#6252E8] dark:text-[#965BFF] mb-4">
                Design. Connect. Execute. Verify. Govern.
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold tracking-[-0.025em] leading-[1.06] text-[#101014] dark:text-[#FFFFFF] text-balance">
                Build AI agents that deliver work.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed max-w-xl">
                Design, connect, execute and govern intelligent agents and workflows from one unified platform.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/app')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  <span>Open Mobile Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/docs')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#101014] dark:bg-white text-white dark:text-[#101014] hover:opacity-90 text-sm font-semibold transition-opacity whitespace-nowrap shrink-0"
                >
                  <span>Start Building</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/platform')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101126] hover:bg-[#F7F7FA] dark:hover:bg-white/10 text-[#101014] dark:text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Platform</span>
                </button>
              </div>

              <div className="mt-10 pt-6 border-t border-[#101014]/[0.08] dark:border-white/10">
                <StatusText
                  items={[
                    'SOPIN · SONIL Group',
                    'Unified Agent Engineering & Execution',
                    'Early Preview Architecture',
                  ]}
                  accentLast
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex min-w-0"
            >
              <MultiAgentHeroCanvas />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. TECHNOLOGY FOUNDATION (Without Fabricated Customers) */}
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                idx: '01. Architectural Foundation',
                title: 'Studio-to-Runtime Continuity',
                desc: 'Every visual graph compiles to typed SDK blueprints executed in the same runtime spec.',
              },
              {
                idx: '02. Open Interoperability',
                title: 'Native MCP and A2A Support',
                desc: 'Bind tools via Model Context Protocol and coordinate peer agents with Agent-to-Agent interfaces.',
              },
              {
                idx: '03. Verifiable Execution',
                title: 'Typed Gates Around Models',
                desc: 'Wrap probabilistic reasoning with schema contracts, citation assertions, and bounded retries.',
              },
              {
                idx: '04. SONIL Group Platform',
                title: 'Built for Accountable Work',
                desc: 'Engineered as an evolving platform with human-in-the-loop checkpoints and clear roadmaps.',
              },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2 min-w-0"
              >
                <p className="text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]">
                  {pillar.idx}
                </p>
                <h2 className="font-display text-base font-semibold tracking-tight text-[#101014] dark:text-white">
                  {pillar.title}
                </h2>
                <p className="text-sm text-[#5E5E6E] dark:text-[#A4A4B5] leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PRODUCT INTERFACE PREVIEWS (All 8 SOPIN Modules) */}
      <section className="py-20 lg:py-24 bg-[#FFFFFF] dark:bg-[#101014] border-b border-[#101014]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Product Surfaces"
            title="Inspect every SOPIN workspace interface."
            description="Explore interactive software previews across all eight platform modules: Studio, Flow, Context, Runtime, Gateway, Observe, Evaluate, and Control."
          />

          <ProductPreviews initialTab="studio" />
        </div>
      </section>

      {/* 4. INTERACTIVE AGENT STACK EXPLORER */}
      <section className="py-20 lg:py-24 bg-[#F7F7FA] dark:bg-[#101126]/35 border-b border-[#101014]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <SectionHeader
            kicker="Interactive Agent Stack"
            title="See how every SOPIN layer connects in architecture and code."
            description="Select any layer from authoring down to governance to trace how blueprints, memory scopes, model routes, and policy checks fit together."
          />

          <InteractiveAgentStack onNavigate={onNavigate} />
        </div>
      </section>

      {/* 5. SIX-STAGE LIFECYCLE */}
      <section className="py-20 lg:py-24 bg-[#FFFFFF] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Agent Engineering Lifecycle"
            title="Six structured stages from intent to governed execution."
            description="Production agent systems fail when prompting, tooling, context, and verification live in disconnected scripts. SOPIN organizes the full lifecycle in one coherent model."
          />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 min-w-0">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isActive = idx === activeLifecycle;
                return (
                  <button
                    key={stage.number}
                    type="button"
                    onClick={() => setActiveLifecycle(idx)}
                    className={`relative text-left p-4 rounded-xl border transition-colors min-h-[44px] ${
                      isActive
                        ? 'border-[#6252E8] bg-[#F7F7FA] dark:bg-[#101126]'
                        : 'border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA]/60 dark:bg-[#101126]/50 hover:border-[#6252E8]/40'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="lifecycle-active-ring"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-xl ring-1 ring-[#6252E8] pointer-events-none"
                      />
                    )}
                    <span className="font-mono text-xs tabular-nums text-[#6252E8] dark:text-[#965BFF] relative z-10">
                      {stage.number}
                    </span>
                    <div className="mt-1 font-display text-lg font-semibold text-[#101014] dark:text-white relative z-10">
                      {stage.title}
                    </div>
                    <div className="mt-0.5 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] relative z-10">
                      {stage.verb}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStage.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
                >
                  <StatusText
                    items={[`Stage ${selectedStage.number}`, selectedStage.verb, 'SOPIN Architecture']}
                    accentLast
                  />
                  <h3 className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#101014] dark:text-white">
                    {selectedStage.number}. {selectedStage.title}
                  </h3>
                  <p className="mt-4 text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {selectedStage.summary}
                  </p>

                  <div className="mt-8 pt-6 border-t border-[#101014]/10 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-[#101014] dark:text-white mb-3">
                        Architectural Primitives
                      </h4>
                      <ul className="space-y-2">
                        {selectedStage.primitives.map((primitive) => (
                          <li
                            key={primitive}
                            className="flex items-center gap-2 text-sm text-[#101014] dark:text-[#E8E8F2]"
                          >
                            <CheckCircle2
                              className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] shrink-0"
                              aria-hidden="true"
                            />
                            <span>{primitive}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#101014] dark:text-white mb-3">
                        Engineering Outcome
                      </h4>
                      <p className="text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                        {selectedStage.outcome}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('/platform')}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline"
                      >
                        <span>Inspect platform architecture</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUR CREATION EXPERIENCES */}
      <section className="py-20 lg:py-24 border-y border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/35">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <SectionHeader
              kicker="Four Creation Experiences"
              title="One underlying specification, four ways to author."
              description="Move freely between plain-language intent, deterministic visual workflows, cyclic multi-agent graphs, and the TypeScript SDK."
            />

            <div
              role="tablist"
              aria-label="Creation experiences"
              className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10 max-w-full shrink-0"
            >
              {CREATION_EXPERIENCES.map((exp, idx) => {
                const active = idx === activeCreation;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCreation(idx)}
                    className={`relative min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-white'
                        : 'text-[#5E5E6E] dark:text-[#B5B5C5] hover:text-[#101014] dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="creation-active-tab"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-[#6252E8]"
                      />
                    )}
                    <span className="relative z-10">{exp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCreation.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              <div className="lg:col-span-5 rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-7 sm:p-8 flex flex-col justify-between min-w-0">
                <div>
                  <StatusText items={[selectedCreation.label, selectedCreation.audience]} accentLast />
                  <h3 className="mt-3 font-display text-2xl font-semibold text-[#101014] dark:text-white leading-snug">
                    {selectedCreation.headline}
                  </h3>
                  <p className="mt-4 text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {selectedCreation.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {selectedCreation.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-[#101014] dark:text-[#E8E8F2]"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#101014]/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => onNavigate('/studio')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline"
                  >
                    <span>Explore SOPIN Studio</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col min-w-0">
                <CodeBlock
                  code={selectedCreation.codeOrSpec}
                  label={selectedCreation.artifactType}
                  className="flex-1 flex flex-col justify-between"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 7. PRODUCT ECOSYSTEM (8 CORE MODULES) */}
      <section className="py-20 lg:py-24 bg-[#FFFFFF] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Product Ecosystem"
            title="Eight modular systems engineered to work as one."
            description="Adopt the complete stack or integrate individual runtime, context, and gateway layers into existing engineering infrastructure. Planned modules are labeled transparently."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ECOSYSTEM_MODULES.map((mod, idx) => {
              const isWide = idx === 0 || idx === 1;
              return (
                <motion.button
                  key={mod.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.25, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onNavigate(mod.href, mod.sectionId)}
                  className={`group text-left rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/80 hover:border-[#6252E8] hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(16,16,20,0.04)] hover:shadow-[0_8px_24px_rgba(16,16,20,0.06)] transition-all p-6 flex flex-col justify-between min-w-0 ${
                    isWide ? 'lg:col-span-2' : 'lg:col-span-1'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <StatusText
                        items={[mod.role, mod.status]}
                        accentLast={mod.status === 'Planned'}
                      />
                      <ArrowUpRight
                        className="w-4 h-4 text-[#777786] group-hover:text-[#6252E8] dark:group-hover:text-[#965BFF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold text-[#101014] dark:text-white group-hover:text-[#6252E8] dark:group-hover:text-[#965BFF] transition-colors">
                      {mod.name}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                      {mod.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#101014]/10 dark:border-white/10 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#101014] dark:text-[#D8D8E6]">
                    {mod.capabilities.map((cap, capIdx) => (
                      <React.Fragment key={cap}>
                        {capIdx > 0 && <span className="text-[#777786]" aria-hidden="true">/</span>}
                        <span>{cap}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. INTELLIGENCE & CONTEXT + AUTONOMOUS EXECUTION (DEEP NAVY SECTION) */}
      <section className="py-20 lg:py-24 bg-[#101126] text-white border-y border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-6 min-w-0">
              <SectionHeader
                dark
                kicker="Intelligence & Context"
                title="Grounded memory that respects task boundaries."
                description="SOPIN Context replaces monolithic prompt stuffing with scoped memory tiers and verifiable source lineage."
              />

              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-[#965BFF] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-base font-semibold">
                      Three-Tier Memory Isolation
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#B5B5C5] leading-relaxed">
                    Separate ephemeral working state, episodic workflow history, and versioned knowledge corpora so agents never leak context across tenants or unrelated tasks.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-[#6252E8] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-base font-semibold">
                      Hybrid Retrieval with Provenance
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#B5B5C5] leading-relaxed">
                    Combine semantic embeddings with lexical filters and preserve immutable document identifiers on every retrieved span for downstream citation checks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/context')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#B894FF] hover:text-white transition-colors"
              >
                <span>Read SOPIN Context architecture</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 min-w-0">
              <SectionHeader
                dark
                kicker="Autonomous Execution"
                title="Durable runtime for work that spans steps and approvals."
                description="SOPIN Runtime executes multi-step reasoning, isolated tool calls, and long-running pauses without brittle webhook glue."
              />

              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-[#965BFF] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-base font-semibold">
                      Sandboxed Tool Execution
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#B5B5C5] leading-relaxed">
                    Run code and MCP tool servers inside ephemeral sandboxes with explicit egress allowlists, resource ceilings, and idempotent retry semantics.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <Workflow className="w-5 h-5 text-[#6252E8] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-base font-semibold">
                      Checkpointed Human-in-the-Loop
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#B5B5C5] leading-relaxed">
                    Persist full execution state when an agent hits a sensitive boundary, letting an operator inspect proposed parameters before resuming.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/workflow-automation')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#B894FF] hover:text-white transition-colors"
              >
                <span>Explore SOPIN Flow &amp; Runtime</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ENTERPRISE TRUST & GOVERNANCE ARCHITECTURE */}
      <section className="py-20 lg:py-24 bg-[#FFFFFF] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 min-w-0">
              <SectionHeader
                kicker="Enterprise Trust"
                title="Governance designed into the execution layer."
                description="Rather than retrofitting compliance wrappers after deployment, SOPIN enforces structural boundaries directly inside Gateway, Runtime, and Control."
              />
              <p className="mt-6 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] leading-relaxed">
                Note: Formal third-party compliance certifications and enterprise audit ledger modules are part of the planned SONIL Group enterprise roadmap and are not claimed as active certifications today.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 min-w-0">
              <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                <Lock className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-semibold text-[#101014] dark:text-white">
                  Scoped Tool Credentials
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  Agents receive short-lived, least-privilege capabilities per node rather than ambient workspace API keys.
                </p>
              </div>

              <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                <Shield className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-semibold text-[#101014] dark:text-white">
                  Pre-Inference Redaction
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  Deterministic sanitization transforms strip restricted fields before payloads cross the Model Gateway.
                </p>
              </div>

              <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                <GitBranch className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-semibold text-[#101014] dark:text-white">
                  Deterministic Policy Gates · Planned
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  Declarative approval policies and role-based sign-off queues integrated with SOPIN Control.
                </p>
              </div>

              <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                <Terminal className="w-5 h-5 text-[#6252E8] dark:text-[#965BFF]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-semibold text-[#101014] dark:text-white">
                  Trace &amp; Audit Lineage · Planned
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  Immutable correlation across trigger events, retrieved documents, model outputs, and human approvals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. USE CASES ACROSS CORE DOMAINS */}
      <section className="py-20 lg:py-24 border-y border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Applied Architectures"
            title="Built for high-rigor domains where verification matters."
            description="Inspect how SOPIN topologies bind context, tools, and human checkpoints across five core operational domains."
          />

          <div
            role="tablist"
            aria-label="Use case domains"
            className="mt-10 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pb-1 sm:pb-0"
          >
            {USE_CASE_DOMAINS.map((domain, idx) => {
              const active = idx === activeDomain;
              return (
                <button
                  key={domain.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveDomain(idx)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[40px] ${
                    active
                      ? 'text-white'
                      : 'bg-white dark:bg-[#101126] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#101014]/10 dark:border-white/10 hover:text-[#101014] dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="domain-active-tab"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-[#101014] dark:bg-[#6252E8]"
                    />
                  )}
                  <span className="relative z-10">{domain.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDomain.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-7 sm:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6 space-y-4 min-w-0">
                  <StatusText items={[selectedDomain.label, 'Reference Topology']} accentLast />
                  <h3 className="font-display text-2xl font-semibold text-[#101014] dark:text-white">
                    {selectedDomain.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {selectedDomain.description}
                  </p>

                  <div className="pt-2">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-2">
                      Execution Topology
                    </div>
                    <div className="font-mono text-xs p-3 rounded-lg bg-[#F7F7FA] dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10 text-[#6252E8] dark:text-[#B894FF] break-words">
                      {selectedDomain.topology}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 gap-4 min-w-0">
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-2">
                      Primary Bindings
                    </div>
                    <StatusText items={selectedDomain.tools} />
                  </div>

                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                      Verification Gate
                    </div>
                    <p className="text-sm text-[#5E5E6E] dark:text-[#B5B5C5]">
                      {selectedDomain.verification}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                      Human Checkpoint
                    </div>
                    <p className="text-sm text-[#5E5E6E] dark:text-[#B5B5C5]">
                      {selectedDomain.humanCheckpoint}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 11. DEVELOPER ECOSYSTEM */}
      <section className="py-20 lg:py-24 bg-[#FFFFFF] dark:bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5 min-w-0">
              <SectionHeader
                kicker="Developer Ecosystem"
                title="Open protocols, typed SDKs, zero lock-in."
                description="Author agents in TypeScript or Python, connect external tools through MCP, and exchange structured tasks across agents via A2A."
              />
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/developers')}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#101014] dark:bg-white text-white dark:text-[#101014] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  <span>Developer Hub</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/docs')}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-semibold text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Read Documentation</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 min-w-0">
              <CodeBlock
                label="sopin.config.ts · MCP & A2A Binding"
                code={`import { defineWorkspace, mcpServer, a2aPeer } from "@sopin/sdk";

export default defineWorkspace({
  organization: "sonil-engineering",
  gateway: {
    defaultRoute: "structured-reasoning",
    enforceJsonSchema: true
  },
  mcpServers: [
    mcpServer("repo-index", { transport: "stdio", scope: "read-only" }),
    mcpServer("ticket-queue", { transport: "http", auth: "scoped-token" })
  ],
  peers: [
    a2aPeer("citation-auditor", { endpoint: "a2a://internal.sopin.ai/auditor" })
  ]
});`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="py-20 lg:py-24 bg-[#101126] text-white border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 text-center">
          <p className="text-sm font-medium text-[#965BFF] mb-3">
            SOPIN · A SONIL Group Platform
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-balance max-w-3xl mx-auto">
            Design, verify, and govern agents built for real work.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#B5B5C5] max-w-2xl mx-auto leading-relaxed">
            Review our technical specifications, inspect the SDK patterns, or connect with the SONIL Group team for early cohort access.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/docs')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>Start Building</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>Request Design Partner Access</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
