import React from 'react';
import { ArrowRight, Compass, Globe, Layers, Shield, ShieldCheck, Users } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { SopinLogo } from '../components/brand/SopinLogo';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface AboutPageProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
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
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/10 bg-[#FAF9F5] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['About SOPIN', 'SONIL Group', 'sopin.ai']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] text-balance">
              Engineering accountable AI infrastructure under the SONIL Group.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] leading-relaxed">
              SOPIN is a global AI technology platform created under the SONIL Group with a singular objective: give engineering and operations teams a unified system to design, connect, execute, verify, and govern AI agents that deliver dependable work.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#FAF9F5]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <div className="text-xs font-semibold text-[#8F00FF]">
                Our Vision
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#05070E]">
                One verifiable platform across models, tools, and organizations.
              </h2>
              <p className="mt-3 text-sm text-[#5E5E6E] leading-relaxed">
                AI systems should never force teams into choosing between non-technical usability, developer flexibility, or enterprise security. SOPIN bridges natural language, visual graphs, typed SDKs, and custom ML inside one governed runtime.
              </p>
            </div>

            <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
              <div className="text-xs font-semibold text-[#8F00FF]">
                SONIL Group Stewardship
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#05070E]">
                Built for long-horizon reliability and open standards.
              </h2>
              <p className="mt-3 text-sm text-[#5E5E6E] leading-relaxed">
                Developed within SONIL Group&apos;s global infrastructure engineering portfolio, SOPIN prioritizes durable execution, private VPC portability, and vendor-neutral AI model independence over short-term hype cycles.
              </p>
            </div>
          </div>

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
                  className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#8F00FF]">
                      {p.number}
                    </span>
                    <Icon className="w-5 h-5 text-[#5E5E6E]" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-[#05070E]">
                    {p.title}
                  </h2>
                  <p className="mt-2.5 text-sm text-[#5E5E6E] leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Ecosystem Links: Security, Partners, Careers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-5 h-5 text-[#8F00FF]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg font-semibold text-[#05070E]">
                  Trust &amp; Security Center
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E]">
                  Inspect SOPIN&apos;s sandboxing, KMS credential vaulting, PII redaction, and RBAC roadmap transparently.
                </p>
              </div>
              <a
                href="/security"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/security');
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F00FF] hover:underline"
              >
                <span>Open Trust Center</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 flex flex-col justify-between">
              <div>
                <Globe className="w-5 h-5 text-[#8F00FF]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg font-semibold text-[#05070E]">
                  Protocol &amp; Technology Partners
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E]">
                  Collaborate with SOPIN on MCP server integrations, A2A agents, cloud runtimes, or enterprise deployments.
                </p>
              </div>
              <a
                href="/contact?topic=Protocol+%26+Partnership"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contact', undefined, { topic: 'Protocol & Partnership' });
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F00FF] hover:underline"
              >
                <span>Partner With SOPIN</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 flex flex-col justify-between">
              <div>
                <Users className="w-5 h-5 text-[#8F00FF]" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg font-semibold text-[#05070E]">
                  Engineering Careers &amp; Cohort
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E]">
                  Distributed systems, compiler, and applied AI engineers building foundational runtime infrastructure under SONIL Group.
                </p>
              </div>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contact', undefined, { topic: 'Protocol & Partnership' });
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F00FF] hover:underline"
              >
                <span>Connect With Engineering</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#05070E]/10 bg-[#000000] text-white p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-medium text-[#8F00FF]">Official Brand Identity</p>
              <h3 className="font-display text-2xl font-semibold">
                The SOPIN Radial Emblem &amp; Wordmark
              </h3>
              <p className="text-sm text-[#B5B5C5] leading-relaxed">
                Six interlocking radial channels converge around an open core, paired with monoline geometric lettering. Across the digital platform, the #8F00FF purple accent highlights the dot over the &ldquo;i&rdquo;.
              </p>
            </div>
            <div className="lg:col-span-7 flex items-center justify-center rounded-xl border border-white/10 bg-[#000000] p-8">
              <SopinLogo size="lg" className="text-white [&>svg]:h-16 sm:[&>svg]:h-20" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#0A1226] text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#8F00FF]">SONIL Group Initiative</p>
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
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg bg-[#000000] hover:bg-[#1F2937] border border-white/15 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
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
