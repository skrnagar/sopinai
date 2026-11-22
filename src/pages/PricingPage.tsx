import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { DataTable, DataTableColumn } from '../components/ui/DataTable';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface PricingPageProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

interface ComparisonRow {
  capability: string;
  preview: string;
  team: string;
  enterprise: string;
}

const CAPABILITY_MATRIX: ComparisonRow[] = [
  {
    capability: 'Studio, Flow & Graph Authoring',
    preview: 'Included (Preview)',
    team: 'Shared Workspaces + Git Sync',
    enterprise: 'Org-Wide Policy Templates',
  },
  {
    capability: 'SOPIN Gateway & BYOK Keys',
    preview: 'Local / Preview Profiles',
    team: 'BYOK Vault + Managed Failover',
    enterprise: 'Private VPC & Custom ML Registry',
  },
  {
    capability: 'SOPIN Runtime Isolation',
    preview: 'Local / Sandbox CLI',
    team: 'Managed Elastic Containers',
    enterprise: 'Dedicated VPC / Air-Gapped Pool',
  },
  {
    capability: 'Observe & Evaluate (Planned)',
    preview: '30-Day Local Telemetry Preview',
    team: 'Full Trace Store + CI Evals',
    enterprise: 'Custom Retention + SIEM Export',
  },
  {
    capability: 'Control, RBAC & Approvals (Planned)',
    preview: 'Single-Workspace Preview',
    team: 'Workspace RBAC & Approval Queue',
    enterprise: 'SAML 2.0 / OIDC + SCIM + SLAs',
  },
];

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
      topic: 'Developer Preview & SDK',
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
      topic: 'Design Partner Access',
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
      topic: 'SONIL Group Enterprise',
    },
  ];

  const matrixColumns: DataTableColumn<ComparisonRow>[] = [
    {
      key: 'capability',
      header: 'Platform Layer',
      render: (r) => <span className="font-semibold text-[#05070E]">{r.capability}</span>,
    },
    { key: 'preview', header: 'Developer Preview', render: (r) => r.preview },
    { key: 'team', header: 'Team Workspace (Planned)', render: (r) => r.team },
    { key: 'enterprise', header: 'SONIL Enterprise', render: (r) => r.enterprise },
  ];

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/10 bg-[#FAF9F5] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Pricing & Access', 'Transparent Pre-Release Model']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] text-balance">
              Transparent pathways while SOPIN evolves.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] leading-relaxed">
              SOPIN is under active engineering development within the SONIL Group. Rather than publishing placeholder dollar tiers before general availability, we structure access around transparent evaluation and deployment pathways.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Deployment topology model"
            className="mt-8 flex sm:inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#FBF7F0] border border-[#05070E]/10 max-w-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={deploymentModel === 'managed'}
              onClick={() => setDeploymentModel('managed')}
              className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                deploymentModel === 'managed'
                  ? 'bg-[#000000] text-white'
                  : 'text-[#5E5E6E]'
              }`}
            >
              Managed Cloud (Planned)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={deploymentModel === 'self-hosted'}
              onClick={() => setDeploymentModel('self-hosted')}
              className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                deploymentModel === 'self-hosted'
                  ? 'bg-[#000000] text-white'
                  : 'text-[#5E5E6E]'
              }`}
            >
              Self-Hosted Runtime (Planned)
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#FBF7F0]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 space-y-12">
          <div className="rounded-xl border border-[#05070E]/10 bg-[#FAF9F5] p-5 text-sm text-[#5E5E6E] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            {deploymentModel === 'managed' ? (
              <span>
                <strong className="text-[#05070E]">Managed Cloud Topology:</strong>{' '}
                Hosted SOPIN Studio, Flow orchestration, and Gateway routing operated by SOPIN under SONIL Group. General billing plans will be announced ahead of public launch.
              </span>
            ) : (
              <span>
                <strong className="text-[#05070E]">Self-Hosted Runtime Topology:</strong>{' '}
                Run SOPIN Runtime sandboxes and Model Gateway within your own VPC so sensitive data and internal MCP servers remain inside your network perimeter.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pathways.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 sm:p-8 flex flex-col justify-between shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
              >
                <div>
                  <StatusText items={[tier.stage, tier.licensing]} accentLast />
                  <h2 className="mt-3 font-display text-2xl font-semibold text-[#05070E]">
                    {tier.name}
                  </h2>
                  <p className="mt-3 text-sm text-[#5E5E6E] leading-relaxed">
                    {tier.description}
                  </p>

                  <ul className="mt-6 pt-6 border-t border-[#05070E]/10 space-y-3">
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-sm text-[#05070E]"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('/contact', undefined, { topic: tier.topic })}
                  className="mt-8 w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#000000] hover:bg-[#1F2937] text-white text-sm font-semibold transition-colors"
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <SectionHeader
              kicker="Pricing Principles & Capability Matrix"
              title="Predictable licensing aligned with execution boundaries."
              description="Final commercial metrics will be published prior to General Availability. Early design partners collaborate directly with SONIL Group engineering."
            />

            <DataTable
              caption="SOPIN Access Pathway Comparison"
              columns={matrixColumns}
              rows={CAPABILITY_MATRIX}
              rowKey={(r) => r.capability}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {[
                {
                  title: 'Bring Your Own Model Keys (BYOK)',
                  body: 'Never pay arbitrary seat markups on model tokens—bind your existing Anthropic, OpenAI, Gemini, or self-hosted vLLM endpoints inside encrypted Gateway vaults.',
                },
                {
                  title: 'Hard Token & Runtime Ceilings',
                  body: 'Every workspace enforces explicit maxSteps graph bounds and monthly token spend thresholds inside SOPIN Control so experimental loops never surprise budgets.',
                },
                {
                  title: 'Smooth Cloud-to-VPC Portability',
                  body: 'Start building in Managed Cloud and migrate identical Studio/Flow/Graph blueprints to Self-Hosted Enterprise VPC runtime without rewriting application code.',
                },
              ].map((faq) => (
                <div
                  key={faq.title}
                  className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6"
                >
                  <h3 className="font-display text-base font-semibold text-[#05070E]">
                    {faq.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#5E5E6E] leading-relaxed">
                    {faq.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
