import React from 'react';
import { ArrowRight } from 'lucide-react';
import { USE_CASE_DOMAINS } from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { StatusText } from '../components/ui/EditorialPrimitives';

interface SolutionsPageProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate }) => {
  const solutionBlocks = [
    {
      ...USE_CASE_DOMAINS[2],
      id: 'business-automation',
      category: 'Business Automation',
      status: 'Reference Architecture',
      topic: 'Design Partner Access',
    },
    {
      id: 'document-intelligence',
      category: 'Document Intelligence',
      status: 'Reference Architecture',
      headline: 'Structured parsing across PDFs, scans, images, and multi-table contracts.',
      description:
        'Extract typed records from messy enterprise documents via SOPIN Gateway multimodal parsers, apply pre-inference PII redaction, validate schema constraints, and trace every extracted field back to source page coordinates.',
      topology: 'Upload / Bucket Trigger -> OCR & Multimodal Extract -> PII Redact -> Schema Validate -> Context Provenance',
      tools: ['Multimodal Gateway Route', 'Document Parser MCP', 'SHA-256 Checksum Index'],
      verification: 'Extracted JSON objects strictly validated against contract schema with source span pointers.',
      humanCheckpoint: 'Reviewer confirmation on low-confidence line items or policy anomalies.',
      topic: 'Design Partner Access',
    },
    {
      ...USE_CASE_DOMAINS[0],
      id: 'ai-research',
      category: 'AI Research',
      status: 'Reference Architecture',
      topic: 'Developer Preview & SDK',
    },
    {
      ...USE_CASE_DOMAINS[3],
      id: 'software-engineering',
      category: 'Software Engineering',
      status: 'Reference Architecture',
      topic: 'Developer Preview & SDK',
    },
    {
      ...USE_CASE_DOMAINS[4],
      id: 'data-intelligence',
      category: 'Data Intelligence',
      status: 'Reference Architecture',
      topic: 'Design Partner Access',
    },
    {
      id: 'machine-learning',
      category: 'Machine Learning',
      status: 'Core + Planned Compute',
      headline: 'End-to-end dataset profiling, training, evaluation, and Gateway model serving.',
      description:
        'Unite ML engineering with production agent workflows: ingest structured CSV/Parquet or multimodal corpora, run deterministic preprocessing transforms in SOPIN Flow, execute training/fine-tuning in isolated Runtime pools, score F1/RMSE/latency in Evaluate, and register validated models straight into SOPIN Gateway.',
      topology: 'Upload Data -> Explore & Profile -> Feature Transform -> Train / Fine-Tune -> Evaluate -> Register -> Serve in Gateway',
      tools: ['Dataset Snapshot Store', 'Python ML Sandbox (Planned)', 'SOPIN Evaluate Matrix', 'Gateway Model Registry'],
      verification: 'Candidate checkpoints must surpass baseline validation accuracy and latency gates before registry promotion.',
      humanCheckpoint: 'ML Engineer sign-off before promoting candidate checkpoint to Production stage.',
      topic: 'Developer Preview & SDK',
    },
    {
      id: 'multi-agent',
      category: 'Multi-Agent Applications',
      status: 'Reference Architecture',
      headline: 'Bounded supervisor-worker teams and verifiable A2A handoffs.',
      description:
        'Coordinate specialized agents across SOPIN Graph using shared typed state, explicit maxSteps loop ceilings, isolated tool capabilities per peer, and Agent-to-Agent (A2A) completion contracts.',
      topology: 'Supervisor Router -> Specialist Peers (A2A) -> Reflection Critic -> Cycle Gate -> Final Artifact',
      tools: ['SOPIN Graph State Machine', 'A2A Peer Protocol', 'Per-Node MCP Scopes'],
      verification: 'Cycle depth and schema invariants enforced deterministically across every superstep.',
      humanCheckpoint: 'Escalate unresolved peer conflicts or high-impact side effects to human operators.',
      topic: 'Developer Preview & SDK',
    },
    {
      id: 'enterprise-ai',
      category: 'Enterprise AI',
      status: 'Planned · SONIL Group',
      headline: 'Governed multi-team agent infrastructure with organizational boundaries.',
      description:
        'Designed for enterprise deployments requiring private VPC isolation, SAML/OIDC identity, centralized Model Gateway policies, human sign-off workflows, and structured auditability across departments.',
      topology: 'Identity Boundary -> Policy Gateway -> Scoped Context -> Runtime Sandbox -> Audit Log',
      tools: ['SSO / RBAC Policies (Planned)', 'Private VPC Model Gateway', 'Audit Stream (Planned)'],
      verification: 'Department-level policy rules enforced out-of-band before any external tool execution.',
      humanCheckpoint: 'Configurable approval matrices aligned to operational risk tiers.',
      topic: 'SONIL Group Enterprise',
    },
  ];

  const scrollToDomain = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/10 bg-[#FAF9F5] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Solutions', 'Eight Domain Blueprints']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] text-balance">
              Reference architectures engineered for domain rigor.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] leading-relaxed">
              Each blueprint demonstrates how SOPIN combines grounded context, multimodal models, ML pipelines, scoped tools, verification gates, and human oversight.
            </p>
          </div>

          {/* Quick Jump Strip */}
          <div className="mt-8 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pb-1">
            {solutionBlocks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => scrollToDomain(b.id)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#05070E]/10 bg-[#FAF9F5] text-xs font-semibold text-[#05070E] hover:border-[#2563EB] transition-colors whitespace-nowrap shrink-0"
              >
                {b.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#FAF9F5]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-6">
          {solutionBlocks.map((block) => (
            <article
              key={block.id}
              id={block.id}
              className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-7 sm:p-8 shadow-[0_1px_2px_rgba(17,24,39,0.04)] scroll-mt-20"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-3 min-w-0">
                  <StatusText
                    items={[block.category, block.status]}
                    accentLast={block.status.includes('Planned') || block.status.includes('Core')}
                  />
                  <h2 className="font-display text-2xl font-semibold text-[#05070E]">
                    {block.headline}
                  </h2>
                  <p className="text-sm sm:text-base text-[#5E5E6E] leading-relaxed">
                    {block.description}
                  </p>
                  <div className="pt-2">
                    <div className="font-mono text-xs p-3 rounded-lg bg-[#FAF9F5] border border-[#05070E]/10 text-[#8F00FF] break-words">
                      {block.topology}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4 min-w-0">
                  <div className="rounded-xl border border-[#05070E]/10 p-4">
                    <div className="text-xs font-semibold text-[#05070E] mb-1.5">
                      Bindings &amp; Modules
                    </div>
                    <StatusText items={block.tools} />
                  </div>
                  <div className="rounded-xl border border-[#05070E]/10 p-4">
                    <div className="text-xs font-semibold text-[#05070E] mb-1">
                      Verification Criteria
                    </div>
                    <p className="text-sm text-[#5E5E6E]">{block.verification}</p>
                  </div>
                  <div className="rounded-xl border border-[#05070E]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#05070E] mb-1">
                        Human Oversight
                      </div>
                      <p className="text-sm text-[#5E5E6E]">
                        {block.humanCheckpoint}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('/contact', undefined, { topic: block.topic })}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-semibold text-[#8F00FF] hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
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
