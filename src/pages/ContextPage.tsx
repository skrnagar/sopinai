import React from 'react';
import { ArrowRight, BookOpen, Database, History, Layers } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface ContextPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const ContextPage: React.FC<ContextPageProps> = ({ onNavigate }) => {
  const tiers = [
    {
      icon: Layers,
      tier: 'Tier 01 · Ephemeral',
      name: 'Working Execution State',
      description:
        'Scoped to a single workflow run. Holds intermediate tool outputs, scratchpad reasoning variables, and schema state without polluting long-term storage.',
    },
    {
      icon: History,
      tier: 'Tier 02 · Session',
      name: 'Episodic Memory',
      description:
        'Captures structured summaries of prior task outcomes and user preferences within explicit tenant and project boundaries.',
    },
    {
      icon: BookOpen,
      tier: 'Tier 03 · Grounded Corpus',
      name: 'Versioned Knowledge Indexes',
      description:
        'Hybrid semantic and lexical retrieval over curated documentation, architecture records, and operational runbooks with immutable source references.',
    },
  ];

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#E5E7EB] bg-[#FFFFFF] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Context', 'Memory & Retrieval Architecture']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#111827] text-balance">
              Structured context and memory with verifiable provenance.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#667085] leading-relaxed">
              Unbounded context stuffing degrades accuracy and creates data leakage risks. SOPIN Context organizes memory into explicit scopes so every agent receives exactly the facts it is authorized to inspect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/developers')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Inspect Context SDK</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#F7F8FA] border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Context Explorer Preview"
            title="Inspect scoped memory tiers and citation checksums."
            description="Switch between ephemeral run state, episodic history, and grounded knowledge indexes in the SOPIN Context console."
          />
          <ProductPreviews initialTab="context" />
        </div>
      </section>

      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <SectionHeader
            kicker="Memory Architecture"
            title="Three isolated tiers of agent memory."
            description="Clear retention rules and access filters prevent stale prompts and cross-tenant contamination."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#2563EB]">
                      {item.tier}
                    </span>
                    <Icon className="w-5 h-5 text-[#667085]" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-[#111827]">
                    {item.name}
                  </h2>
                  <p className="mt-2.5 text-sm text-[#667085] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
            <div className="lg:col-span-5 space-y-4 min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                <Database className="w-4 h-4" aria-hidden="true" />
                <span>Provenance Binding</span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#111827]">
                Every retrieved passage carries source lineage.
              </h3>
              <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                SOPIN Context attaches document checksums, version tags, and permission scopes to retrieved chunks so downstream verification gates can confirm claims against primary sources.
              </p>
            </div>
            <div className="lg:col-span-7 min-w-0">
              <CodeBlock
                label="context.retrieve.ts"
                code={`const chunks = await sopin.context.retrieve({
  corpus: "engineering-adr",
  query: "token rotation policy for MCP transports",
  filters: { tenantId: ctx.tenantId, classification: ["internal"] },
  topK: 5,
  includeProvenance: true
});

// Returns passages with immutable docChecksum, sectionId, and span offsets`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
