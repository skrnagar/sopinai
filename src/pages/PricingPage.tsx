import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface PricingPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [deploymentModel, setDeploymentModel] = useState<'managed' | 'self-hosted'>('managed');

  const pathways = [
    {
      name: 'Developer Preview',
      stage: 'Early Cohort · Open',
      licensing: 'Access via Waitlist / Preview',
      description:
        'For individual engineers and research teams evaluating SOPIN Studio, Flow, and the TypeScript SDK.',
      features: [
        'SOPIN Studio & SDK specification authoring',
        'Local CLI workflow testing & schema validation',
        'MCP & A2A protocol connector templates',
        'Direct engineering feedback channel',
      ],
      cta: 'Request Preview Access',
    },
    {
      name: 'Team Workspace',
      stage: 'Planned',
      licensing: 'Commercial Pricing Pending Release',
      description:
        'Designed for product and automation teams operating shared agent graphs, context stores, and approval queues.',
      features: [
        'Shared Studio workspaces & Git sync',
        'Managed SOPIN Flow durable execution',
        'SOPIN Observe trace inspection (Planned)',
        'SOPIN Evaluate regression suites (Planned)',
      ],
      cta: 'Join Cohort Interest List',
    },
    {
      name: 'SONIL Enterprise',
      stage: 'Custom Architecture Engagement',
      licensing: 'Scoped via SONIL Group',
      description:
        'For organizations requiring dedicated runtime isolation, private Model Gateway routing, and governance alignment.',
      features: [
        'Dedicated VPC or isolated deployment topology',
        'Custom MCP connector & internal system integration',
        'SOPIN Control policy & approval architecture (Planned)',
        'Joint engineering onboarding with SONIL Group',
      ],
      cta: 'Contact SONIL Group',
    },
  ];

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Pricing & Access', 'Transparent Pre-Release Model']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white text-balance">
              Transparent pathways while SOPIN evolves.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN is under active engineering development within the SONIL Group. Rather than publishing placeholder dollar tiers before general availability, we structure access around transparent evaluation and deployment pathways.
            </p>
          </div>

          <div className="mt-8 inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#F7F7FA] dark:bg-[#101126] border border-[#101014]/10 dark:border-white/10 max-w-full">
            <button
              type="button"
              onClick={() => setDeploymentModel('managed')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                deploymentModel === 'managed'
                  ? 'bg-[#6252E8] text-white'
                  : 'text-[#777786] dark:text-[#B5B5C5]'
              }`}
            >
              Managed Cloud (Planned)
            </button>
            <button
              type="button"
              onClick={() => setDeploymentModel('self-hosted')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                deploymentModel === 'self-hosted'
                  ? 'bg-[#6252E8] text-white'
                  : 'text-[#777786] dark:text-[#B5B5C5]'
              }`}
            >
              Self-Hosted Runtime (Planned)
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F7FA] dark:bg-[#101126]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="mb-8 rounded-xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] p-5 text-sm text-[#777786] dark:text-[#B5B5C5] shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
            {deploymentModel === 'managed' ? (
              <span>
                <strong className="text-[#101014] dark:text-white">Managed Cloud Topology:</strong>{' '}
                Hosted SOPIN Studio, Flow orchestration, and Gateway routing operated by SOPIN under SONIL Group. General billing plans will be announced ahead of public launch.
              </span>
            ) : (
              <span>
                <strong className="text-[#101014] dark:text-white">Self-Hosted Runtime Topology:</strong>{' '}
                Run SOPIN Runtime sandboxes and Model Gateway within your own VPC so sensitive data and internal MCP servers remain inside your network perimeter.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pathways.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] p-7 sm:p-8 flex flex-col justify-between shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
              >
                <div>
                  <StatusText items={[tier.stage, tier.licensing]} accentLast />
                  <h2 className="mt-3 font-display text-2xl font-semibold text-[#101014] dark:text-white">
                    {tier.name}
                  </h2>
                  <p className="mt-3 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                    {tier.description}
                  </p>

                  <ul className="mt-6 pt-6 border-t border-[#101014]/10 dark:border-white/10 space-y-3">
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-sm text-[#101014] dark:text-[#E8E8F2]"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="mt-8 w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors"
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <SectionHeader
              kicker="Pricing Principles"
              title="Predictable licensing aligned with execution boundaries."
              description="Final commercial metrics will be published prior to General Availability. Early design partners collaborate directly with SONIL Group engineering."
            />
          </div>
        </div>
      </section>
    </div>
  );
};
