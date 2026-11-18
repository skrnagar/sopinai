import React from 'react';
import { ArrowRight } from 'lucide-react';
import { USE_CASE_DOMAINS } from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { StatusText } from '../components/ui/EditorialPrimitives';

interface SolutionsPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate }) => {
  const solutionBlocks = [
    {
      ...USE_CASE_DOMAINS[2],
      id: 'business-automation',
      category: 'Business Automation',
      status: 'Reference Architecture',
    },
    {
      ...USE_CASE_DOMAINS[0],
      id: 'ai-research',
      category: 'AI Research',
      status: 'Reference Architecture',
    },
    {
      ...USE_CASE_DOMAINS[3],
      id: 'software-engineering',
      category: 'Software Engineering',
      status: 'Reference Architecture',
    },
    {
      ...USE_CASE_DOMAINS[4],
      id: 'data-ml',
      category: 'Data and ML',
      status: 'Reference Architecture',
    },
    {
      id: 'enterprise-ai',
      category: 'Enterprise AI',
      status: 'Planned · SONIL Group',
      headline: 'Governed multi-team agent infrastructure with organizational boundaries.',
      description:
        'Designed for enterprise deployments requiring tenant isolation, centralized Model Gateway policies, human sign-off workflows, and structured auditability across departments.',
      topology: 'Identity Boundary -> Policy Gateway -> Scoped Context -> Runtime Sandbox -> Audit Log',
      tools: ['SSO / RBAC Policies (Planned)', 'Central Model Gateway', 'Compliance Audit Stream (Planned)'],
      verification: 'Department-level policy rules enforced before any external tool execution.',
      humanCheckpoint: 'Configurable approval matrices aligned to operational risk tiers.',
    },
  ];

  return (
    <div>
      <section className="border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Solutions', 'Domain Blueprints']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#101014] dark:text-white text-balance">
              Reference architectures engineered for domain rigor.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              Each solution blueprint illustrates how SOPIN combines grounded context, scoped tools, verification gates, and human checkpoints without relying on brittle custom scripts.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-6">
          {solutionBlocks.map((block) => (
            <article
              key={block.id}
              id={block.id}
              className="rounded-2xl border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-3">
                  <StatusText
                    items={[block.category, block.status]}
                    accentLast={block.status.includes('Planned')}
                  />
                  <h2 className="font-display text-2xl font-semibold text-[#101014] dark:text-white">
                    {block.headline}
                  </h2>
                  <p className="text-sm sm:text-base text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                    {block.description}
                  </p>
                  <div className="pt-2">
                    <div className="font-mono text-xs p-3 rounded-lg bg-[#F7F7FA] dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10 text-[#6252E8] dark:text-[#B894FF]">
                      {block.topology}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-1.5">
                      Bindings & Modules
                    </div>
                    <StatusText items={block.tools} />
                  </div>
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-[#101014] dark:text-white mb-1">
                      Verification Criteria
                    </div>
                    <p className="text-sm text-[#777786] dark:text-[#B5B5C5]">{block.verification}</p>
                  </div>
                  <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#101014] dark:text-white mb-1">
                        Human Oversight
                      </div>
                      <p className="text-sm text-[#777786] dark:text-[#B5B5C5]">
                        {block.humanCheckpoint}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('/contact')}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Discuss</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
