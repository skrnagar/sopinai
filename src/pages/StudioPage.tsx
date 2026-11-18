import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CREATION_EXPERIENCES } from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface StudioPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onNavigate }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = CREATION_EXPERIENCES[selectedIndex];

  return (
    <div>
      <section className="border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Studio', 'Multi-Modal Agent Authoring']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#101014] dark:text-white text-balance">
              Author agents in natural language, visual graphs, or typed code.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN Studio removes the false choice between visual accessibility and software engineering rigor. Every canvas artifact compiles to versionable specifications compatible with Git and the SOPIN SDK.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/docs')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Studio Quickstart</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/workflow-automation')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-semibold text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>See SOPIN Flow</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            kicker="Interactive Authoring Modes"
            title="Inspect the four creation surfaces inside SOPIN Studio."
            description="Select any authoring mode to review how SOPIN structures specifications, constraints, and typed bindings."
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {CREATION_EXPERIENCES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedIndex === idx
                    ? 'bg-[#6252E8] text-white'
                    : 'bg-white dark:bg-[#101126] text-[#777786] dark:text-[#B5B5C5] border border-[#101014]/10 dark:border-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-8 flex flex-col justify-between">
              <div>
                <StatusText items={[current.audience, current.artifactType]} accentLast />
                <h2 className="mt-3 font-display text-2xl font-semibold text-[#101014] dark:text-white">
                  {current.headline}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                  {current.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {current.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm text-[#101014] dark:text-[#E8E8F2]">
                      <CheckCircle2 className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7">
              <CodeBlock label={current.artifactType} code={current.codeOrSpec} className="h-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
