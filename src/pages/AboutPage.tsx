import React from 'react';
import { ArrowRight, Compass, Layers, Shield } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface AboutPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const principles = [
    {
      icon: Layers,
      number: '01',
      title: 'Execution Is the Hard Part',
      description:
        'Generating a convincing demo response is easy. Delivering reliable, repeatable work across external tools, permissions, and failure modes requires dedicated systems engineering.',
    },
    {
      icon: Compass,
      number: '02',
      title: 'Open Protocols Over Proprietary Glue',
      description:
        'SOPIN builds directly on open standards such as Model Context Protocol (MCP) and Agent-to-Agent (A2A) communication so organizations retain architectural portability.',
    },
    {
      icon: Shield,
      number: '03',
      title: 'Verification Before Autonomy',
      description:
        'Autonomy without schemas, grounding assertions, and human sign-off boundaries creates operational risk. Verification and governance belong inside the core runtime.',
    },
  ];

  return (
    <div>
      <section className="border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['About SOPIN', 'SONIL Group', 'sopin.ai']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#101014] dark:text-white text-balance">
              Engineering accountable AI infrastructure under the SONIL Group.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN is a global AI technology platform created under the SONIL Group with a singular objective: give engineering and operations teams a unified system to design, connect, execute, verify, and govern AI agents that deliver dependable work.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <SectionHeader
            kicker="Engineering Thesis"
            title="Three principles guiding the SOPIN platform."
            description="We are building SOPIN incrementally with clarity around what exists in preview today and what is scheduled on our architecture roadmap."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.number}
                  className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#6252E8] dark:text-[#965BFF]">
                      {p.number}
                    </span>
                    <Icon className="w-5 h-5 text-[#777786]" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-[#101014] dark:text-white">
                    {p.title}
                  </h2>
                  <p className="mt-2.5 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-[#101126] text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#965BFF]">SONIL Group Initiative</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                Collaborate with the SOPIN engineering team.
              </h3>
              <p className="mt-2 text-sm text-[#B5B5C5] leading-relaxed">
                We welcome technical conversations with engineering leaders, protocol contributors, and early design partners evaluating unified agent workflows.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>Connect With Us</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
