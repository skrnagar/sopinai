import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CREATION_EXPERIENCES } from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface StudioPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onNavigate }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = CREATION_EXPERIENCES[selectedIndex];

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/10 dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Studio', 'Multi-Modal Agent Authoring']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] dark:text-white text-balance">
              Author agents in natural language, visual graphs, or typed code.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN Studio removes the false choice between visual accessibility and software engineering rigor. Every canvas artifact compiles to versionable specifications compatible with Git and the SOPIN SDK.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/app')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Try Mobile Agent Studio</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/docs')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-sm font-semibold text-[#05070E] dark:text-white hover:bg-[#FBF7F0] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Studio Quickstart</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/workflow-automation')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-sm font-semibold text-[#05070E] dark:text-white hover:bg-[#FBF7F0] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>See SOPIN Flow</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#FBF7F0] dark:bg-[#0A1226]/40 border-b border-[#05070E]/10 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Studio Interface Preview"
            title="Inspect the live Agent Studio canvas and property inspector."
            description="Select graph nodes, verify memory scopes, and review bound MCP tools directly inside the Studio interface."
          />
          <ProductPreviews initialTab="studio" />
        </div>
      </section>

      <section className="py-20 bg-[#FAF9F5] dark:bg-[#05070E]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Interactive Authoring Modes"
            title="Inspect the four creation surfaces inside SOPIN Studio."
            description="Select any authoring mode to review how SOPIN structures specifications, constraints, and typed bindings."
          />

          <div
            role="tablist"
            aria-label="SOPIN Studio authoring modes"
            className="mt-8 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pb-1 sm:pb-0"
          >
            {CREATION_EXPERIENCES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selectedIndex === idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[40px] ${
                  selectedIndex === idx
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#FBF7F0] dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#FBF7F0] dark:bg-[#0A1226]/60 p-6 sm:p-8 flex flex-col justify-between min-w-0">
              <div>
                <StatusText items={[current.audience, current.artifactType]} accentLast />
                <h2 className="mt-3 font-display text-2xl font-semibold text-[#05070E] dark:text-white">
                  {current.headline}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  {current.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {current.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm text-[#05070E] dark:text-[#E8E8F2]">
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7 min-w-0">
              <CodeBlock label={current.artifactType} code={current.codeOrSpec} className="h-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
