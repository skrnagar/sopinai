import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Lock,
  Network,
  Shield,
  Workflow,
} from 'lucide-react';
import { LIFECYCLE_5_STAGES, PRODUCT_SURFACES_10 } from '../data/sopinData';
import { RESOURCE_ARTICLES, ResearchCategory } from '../data/contentCatalog';
import { RoutePath } from '../types/navigation';
import { HeroComputationalVisual } from '../components/interactive/HeroComputationalVisual';
import { PlatformArchitectureDiagram } from '../components/interactive/PlatformArchitectureDiagram';
import { ProductSurfaceIllustration } from '../components/interactive/ProductSurfaceIllustrations';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface HomePageProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

const ENTERPRISE_SOLUTIONS: {
  id: string;
  title: string;
  category: string;
  summary: string;
  href: RoutePath;
  sectionId?: string;
  status: 'Reference Architecture' | 'Core Architecture' | 'Planned';
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}[] = [
  {
    id: 'enterprise-ai-automation',
    title: 'Enterprise AI Automation',
    category: 'Operations & Triage',
    summary:
      'Automate multi-step intake classification, exception routing, and system reconciliation inside durable checkpoints.',
    href: '/solutions',
    sectionId: 'business-automation',
    status: 'Reference Architecture',
    icon: Workflow,
  },
  {
    id: 'intelligent-knowledge-operations',
    title: 'Intelligent Knowledge Operations',
    category: 'Context & Retrieval',
    summary:
      'Extract structured schemas from PDFs and policies and answer domain queries backed by SHA-256 citation provenance.',
    href: '/solutions',
    sectionId: 'document-intelligence',
    status: 'Reference Architecture',
    icon: Database,
  },
  {
    id: 'multi-agent-workflows',
    title: 'Multi-Agent Workflows',
    category: 'Cyclic & A2A Graphs',
    summary:
      'Coordinate specialized planner, researcher, and verifier agents over shared typed state with hard superstep ceilings.',
    href: '/solutions',
    sectionId: 'multi-agent',
    status: 'Reference Architecture',
    icon: Network,
  },
  {
    id: 'business-decision-automation',
    title: 'Business Decision Automation',
    category: 'SOPIN Decisions',
    summary:
      'Author deterministic rules, hit-policy decision tables, rulesets, chains, and scorecards invoked natively in Flow.',
    href: '/decisions',
    status: 'Core Architecture',
    icon: Layers,
  },
  {
    id: 'developer-operations',
    title: 'AI-Powered Developer Operations',
    category: 'Software Engineering',
    summary:
      'Review pull requests against repository ADRs and run targeted verification suites inside ephemeral read-only sandboxes.',
    href: '/solutions',
    sectionId: 'software-engineering',
    status: 'Reference Architecture',
    icon: Cpu,
  },
  {
    id: 'governed-enterprise-execution',
    title: 'Governed Enterprise Execution',
    category: 'Control & Private VPC',
    summary:
      'Enforce out-of-band RBAC permissions, human approval matrices, and isolated deployment topologies under SONIL Group.',
    href: '/solutions',
    sectionId: 'enterprise-ai',
    status: 'Planned',
    icon: Shield,
  },
];

const RADIAL_ANGLES = [0, 60, 120, 180, 240, 300];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [researchFilter, setResearchFilter] = useState<'All' | ResearchCategory>('All');

  const featuredPublications = useMemo(() => {
    const matches =
      researchFilter === 'All'
        ? RESOURCE_ARTICLES
        : RESOURCE_ARTICLES.filter((item) => item.researchCategory === researchFilter);
    return matches.slice(0, 3);
  }, [researchFilter]);

  const scrollToSurface = (id: string) => {
    const el = document.getElementById(`surface-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="overflow-x-clip bg-[#FAF9F5] dark:bg-[#080D18]">
      {/* B. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18]">
        {/* Subtle ambient geometric field echoing SOPIN's 6-prong radial emblem */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-52 -left-52 w-[680px] h-[680px] opacity-[0.05] dark:opacity-[0.1]"
        >
          <motion.svg
            viewBox="0 0 100 100"
            fill="none"
            className="w-full h-full text-[#2563EB] dark:text-[#3B82F6]"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center min-w-0"
            >
              <StatusText
                items={['SOPIN · SONIL Group', 'Unified AI Agent Engineering & Execution Platform']}
                accentLast
              />

              <h1 className="mt-4 font-display text-[clamp(2.25rem,4.1vw,3.65rem)] font-bold tracking-[-0.025em] leading-[1.06] text-[#111827] dark:text-[#FFFFFF] text-balance">
                Build AI agents that deliver work.
              </h1>

              <p className="mt-4 font-display text-sm sm:text-base font-semibold tracking-tight text-[#2563EB] dark:text-[#60A5FA]">
                Design. Connect. Execute. Verify. Govern.
              </p>

              <p className="mt-4 text-base sm:text-[17px] text-[#667085] dark:text-[#CBD5E1] leading-relaxed max-w-xl">
                Unify agent authoring, scoped context, deterministic business decisions, multi-agent graphs, and governed runtime execution in one engineering platform.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/docs');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors shadow-[0_8px_24px_-6px_rgba(37,99,235,0.45)] whitespace-nowrap shrink-0"
                >
                  <span>Start Building</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/platform"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/platform');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg border border-[#E5E7EB] dark:border-white/15 bg-[#FBF7F0] dark:bg-[#101D35] hover:bg-[#F3EDE2] dark:hover:bg-[#162746] text-[#111827] dark:text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore the Platform</span>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex items-center justify-center min-w-0"
            >
              <HeroComputationalVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* C. PLATFORM OVERVIEW */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FBF7F0] dark:bg-[#0B1221] border-b border-[#E5E7EB] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <SectionHeader
              kicker="Platform Overview"
              title="One unified architecture from authoring to governance."
              description="SOPIN brings visual and SDK authoring, scoped memory, deterministic decisions, model routing, sandboxed execution, and human governance into a single coherent system."
            />
            <a
              href="/platform"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/platform');
              }}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/15 bg-[#FAF9F5] dark:bg-[#101D35] text-sm font-semibold text-[#111827] dark:text-white hover:border-[#2563EB] transition-colors whitespace-nowrap self-start lg:self-end shrink-0"
            >
              <span>Inspect Full Platform</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <PlatformArchitectureDiagram onNavigate={(path) => onNavigate(path)} />
        </div>
      </section>

      {/* D. PRODUCT SURFACES (ALL 10 SURFACES SHOWCASE) */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F5] dark:bg-[#080D18] border-b border-[#E5E7EB] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Product Surfaces"
            title="Ten modular systems engineered to work together."
            description="Every SOPIN module solves a distinct layer of the agent engineering lifecycle while sharing typed schemas, traces, and governance boundaries."
          />

          {/* Quick Jump Strip */}
          <div
            aria-label="Jump to SOPIN product surface"
            className="mt-8 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pb-2 sm:pb-0"
          >
            {PRODUCT_SURFACES_10.map((surface) => (
              <button
                key={surface.id}
                type="button"
                onClick={() => scrollToSurface(surface.id)}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/12 bg-[#FBF7F0] dark:bg-[#101D35]/70 hover:border-[#2563EB] text-xs font-semibold text-[#111827] dark:text-[#E2E8F0] transition-colors whitespace-nowrap shrink-0"
              >
                <span className="font-mono text-[#2563EB] dark:text-[#60A5FA] mr-1.5">
                  {surface.index}
                </span>
                {surface.name.replace('SOPIN ', '')}
              </button>
            ))}
          </div>

          {/* Alternating Visual + Content Rows for All 10 Surfaces */}
          <div className="mt-12 divide-y divide-[#E5E7EB] dark:divide-white/10">
            {PRODUCT_SURFACES_10.map((surface, idx) => {
              const reverse = idx % 2 === 1;
              return (
                <article
                  key={surface.id}
                  id={`surface-${surface.id}`}
                  className="py-12 first:pt-2 last:pb-2 scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
                  <div className={`lg:col-span-6 min-w-0 ${reverse ? 'lg:order-2' : 'lg:order-1'}`}>
                    <ProductSurfaceIllustration surfaceId={surface.id} />
                  </div>

                  <div
                    className={`lg:col-span-6 space-y-4 min-w-0 ${
                      reverse ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <StatusText
                      items={[`${surface.index} · ${surface.category}`, surface.status]}
                      accentLast={surface.status === 'Planned'}
                    />
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] dark:text-white">
                      {surface.name}
                    </h3>
                    <p className="text-sm sm:text-base font-medium text-[#111827] dark:text-[#E2E8F0] leading-snug">
                      {surface.tagline}
                    </p>
                    <p className="text-sm sm:text-base text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                      {surface.description}
                    </p>

                    <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FBF7F0] dark:bg-[#101D35]/60 px-4 py-3 text-xs sm:text-sm text-[#111827] dark:text-[#CBD5E1]">
                      <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                        Role in platform:{' '}
                      </span>
                      {surface.purpose}
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {surface.highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-[#111827] dark:text-[#CBD5E1]"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <a
                        href={surface.href}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(surface.href);
                        }}
                        className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                      >
                        <span>Explore {surface.name}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* E. HOW SOPIN WORKS (5-STAGE LIFECYCLE) */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FBF7F0] dark:bg-[#0B1221] border-b border-[#E5E7EB] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <SectionHeader
            kicker="How SOPIN Works"
            title="Design. Connect. Execute. Verify. Govern."
            description="Five connected engineering stages that take intelligent systems from initial blueprint through durable execution and accountable oversight."
          />

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {LIFECYCLE_5_STAGES.map((stage, idx) => (
              <li
                key={stage.step}
                className="relative rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18] p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                      Stage {stage.step}
                    </span>
                    {idx < LIFECYCLE_5_STAGES.length - 1 && (
                      <ArrowRight
                        className="hidden lg:block w-4 h-4 text-[#667085] dark:text-[#64748B]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#111827] dark:text-white">
                    {stage.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#111827] dark:text-[#CBD5E1]">
                    {stage.headline}
                  </p>
                  <p className="text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-white/10">
                  <StatusText items={stage.surfaces} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* F. SOLUTIONS (6 ENTERPRISE USE CASES) */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F5] dark:bg-[#080D18] border-b border-[#E5E7EB] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <SectionHeader
              kicker="Solutions"
              title="Structured for enterprise operations and engineering teams."
              description="Deploy SOPIN across operational automation, document knowledge pipelines, multi-agent systems, deterministic rules, developer tooling, and governed execution."
            />
            <a
              href="/solutions"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/solutions');
              }}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/15 bg-[#FBF7F0] dark:bg-[#101D35] text-sm font-semibold text-[#111827] dark:text-white hover:border-[#2563EB] transition-colors whitespace-nowrap self-start lg:self-end shrink-0"
            >
              <span>View All Solutions</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ENTERPRISE_SOLUTIONS.map((sol) => {
              const Icon = sol.icon;
              const targetHref = sol.sectionId ? `${sol.href}#${sol.sectionId}` : sol.href;
              return (
                <a
                  key={sol.id}
                  href={targetHref}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(sol.href, sol.sectionId);
                  }}
                  className="group rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[#FBF7F0] dark:bg-[#101D35]/50 hover:border-[#2563EB] hover:-translate-y-0.5 transition-all p-6 sm:p-7 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18] flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA]">
                        <Icon className="w-5 h-5" aria-hidden={true} />
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#667085] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors"
                        aria-hidden="true"
                      />
                    </div>

                    <StatusText
                      items={[sol.category, sol.status]}
                      accentLast={sol.status === 'Planned'}
                    />

                    <h3 className="font-display text-xl font-semibold text-[#111827] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                      {sol.title}
                    </h3>

                    <p className="text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                      {sol.summary}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                    <span>Inspect architecture</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* G. RESEARCH & INSIGHTS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FBF7F0] dark:bg-[#0B1221]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <SectionHeader
              kicker="Research & Insights"
              title="Architectural research, engineering guides, and field notes."
              description="Transparent technical writing from the SOPIN and SONIL Group engineering teams—covering agent theory, deterministic reliability, and planned cohort studies."
            />

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
              <div
                role="tablist"
                aria-label="Filter research publications"
                className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18]"
              >
                {(['All', 'Research', 'Engineering', 'Case Studies'] as const).map((cat) => {
                  const active = researchFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setResearchFilter(cat)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#2563EB] text-white'
                          : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <a
                href="/research"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/research');
                }}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPublications.map((entry) => {
              const articleHref = `/research/${entry.id}` as RoutePath;
              return (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#080D18] p-6 sm:p-7 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <StatusText
                      items={[entry.researchCategory, entry.publishedDate, entry.status]}
                      accentLast={entry.status !== 'Available'}
                    />
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-[#111827] dark:text-white leading-snug">
                      <a
                        href={articleHref}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(articleHref);
                        }}
                        className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                      >
                        {entry.title}
                      </a>
                    </h3>
                    <p className="text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] dark:border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">
                      {entry.readTime}
                    </span>
                    <a
                      href={articleHref}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(articleHref);
                      }}
                      className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap"
                    >
                      <span>Read more</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* H. FINAL CALL TO ACTION (BLACK-BLUE NEO DIGITAL STYLE) */}
      <section className="relative overflow-hidden bg-[#080D18] text-white border-t border-white/10 sopin-neo-dark-glow">
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl space-y-5">
            <StatusText
              items={['SOPIN · SONIL Group', 'Intelligence beyond limits.']}
              dark
              accentLast
            />
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.08] text-white text-balance">
              Build what comes next.
            </h2>
            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-2xl">
              Bring your agents, workflows, deterministic decisions, and enterprise intelligence together with SOPIN.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/docs');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] whitespace-nowrap"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contact');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-lg border border-white/20 bg-[#101D35]/70 hover:bg-[#101D35] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <GitBranch className="w-4 h-4 text-[#60A5FA]" aria-hidden="true" />
                <span>Contact SONIL Group</span>
              </a>
              <a
                href="/security"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/security');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-lg text-sm font-semibold text-[#93C5FD] hover:text-white transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Security Architecture</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
