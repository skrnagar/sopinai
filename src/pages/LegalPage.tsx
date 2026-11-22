import React from 'react';
import { ArrowRight, Lock, Scale, ShieldCheck } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { StatusText } from '../components/ui/EditorialPrimitives';

interface LegalPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="overflow-x-clip bg-[#FFFFFF]">
      <section className="border-b border-[#E5E7EB] py-16 lg:py-24">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10 space-y-5">
          <StatusText items={['SOPIN · SONIL Group', 'Legal & Governance']} accentLast />
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#111827] text-balance">
            Privacy, preview terms, and responsible AI commitments.
          </h1>
          <p className="text-base sm:text-lg text-[#667085] leading-relaxed">
            Clear legal, privacy, and data boundary notices governing the SOPIN public website, developer preview documentation, and design-partner engagements under SONIL Group.
          </p>

          <div className="pt-3 flex flex-wrap gap-2">
            {[
              { id: 'privacy', label: 'Privacy Policy' },
              { id: 'terms', label: 'Terms of Service' },
              { id: 'responsible-ai', label: 'Responsible AI Governance' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="min-h-[40px] inline-flex items-center px-4 py-2 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] text-xs font-semibold text-[#111827] hover:border-[#2563EB] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-[#F7F8FA]">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10 space-y-8">
          <article
            id="privacy"
            className="scroll-mt-24 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-7 sm:p-9 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-[#2563EB]">
              <Lock className="w-5 h-5" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Section 01 · Privacy Policy
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#111827]">
              Privacy &amp; Data Handling Commitments
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              SOPIN collects only information you voluntarily submit through direct inquiry forms (such as design partner requests or engineering contact correspondence). The interactive public workspace preview stores draft artifacts strictly in your local browser storage and does not transmit local rules or test fixtures to external servers.
            </p>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Customer prompts, Context knowledge corpora, Decision specifications, and Gateway payloads processed inside SONIL Group enterprise architectures are strictly isolated per workspace and are never used to train third-party foundation models.
            </p>
          </article>

          <article
            id="terms"
            className="scroll-mt-24 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-7 sm:p-9 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-[#2563EB]">
              <Scale className="w-5 h-5" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Section 02 · Terms of Service
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#111827]">
              Preview Platform &amp; Documentation Terms
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              SOPIN is currently offered as an architectural preview platform under SONIL Group. Modules marked &ldquo;Planned&rdquo; or &ldquo;Roadmap&rdquo; represent active engineering specifications and staged architectural designs rather than completed general-availability certifications.
            </p>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Organizations deploying private VPC, BYOC, or commercial SLA agreements operate under dedicated enterprise agreements executed directly with SONIL Group.
            </p>
          </article>

          <article
            id="responsible-ai"
            className="scroll-mt-24 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-7 sm:p-9 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Section 03 · Responsible AI Governance
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#111827]">
              Accountable Autonomy &amp; Human Oversight
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              SOPIN enforces structural separation between probabilistic reasoning and deterministic policy enforcement. Binding financial, access, and operational thresholds belong in SOPIN Decisions and SOPIN Control—with durable human-in-the-loop checkpoints prior to external state mutations.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href="/security"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/security');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline"
              >
                <span>Inspect Trust &amp; Security Center</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contact');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline"
              >
                <span>Contact Legal &amp; Compliance</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
