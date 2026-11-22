import React from 'react';
import { ArrowRight, CheckCircle2, KeyRound, Lock, ShieldCheck, Server } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { DataTable, DataTableColumn } from '../components/ui/DataTable';
import { SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface SecurityPageProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

interface SecurityControlRow {
  domain: string;
  control: string;
  enforcement: string;
  status: string;
}

const SECURITY_MATRIX: SecurityControlRow[] = [
  {
    domain: 'Identity & SSO',
    control: 'OIDC & SAML 2.0 authentication with SCIM group mapping',
    enforcement: 'API & Workspace Shell boundary',
    status: 'Planned',
  },
  {
    domain: 'Organization & Workspace Isolation',
    control: 'Logical tenant partitioning + optional Private VPC / BYOC data plane',
    enforcement: 'PostgreSQL RLS, Redis namespaces & Vector ACLs',
    status: 'Core Architecture',
  },
  {
    domain: 'RBAC & Tool Scopes',
    control: 'Owner, Admin, Builder, Operator, Reviewer, Viewer roles + read/write allowlists',
    enforcement: 'Evaluated out-of-band before Gateway or Runtime dispatch',
    status: 'Planned / Preview',
  },
  {
    domain: 'Secret & BYOK Vaulting',
    control: 'Server-side envelope encryption (KMS) with ephemeral per-step injection',
    enforcement: 'Zero provider keys in prompts or client browsers',
    status: 'Core Architecture',
  },
  {
    domain: 'Execution Sandboxing',
    control: 'Ephemeral read-only rootfs containers with networkEgress: disabled/allowlist',
    enforcement: 'SOPIN Runtime worker boundary',
    status: 'Core Architecture',
  },
  {
    domain: 'Pre-Inference Redaction',
    control: 'Deterministic PII scrubbing prior to external LLM Gateway calls',
    enforcement: 'SOPIN Gateway sanitization pipeline',
    status: 'Core Architecture',
  },
  {
    domain: 'Human Approval Checkpoints',
    control: 'Durable pause-and-resume humanGate before high-impact mutations',
    enforcement: 'SOPIN Flow & SOPIN Control approval inbox',
    status: 'Preview / Planned',
  },
  {
    domain: 'Spend Caps & Loop Breakers',
    control: 'Hard maxSteps limits in SOPIN Graph + monthly workspace spend ceilings',
    enforcement: 'Gateway & Graph runtime guardrails',
    status: 'Core / Planned',
  },
];

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  const columns: DataTableColumn<SecurityControlRow>[] = [
    {
      key: 'domain',
      header: 'Security Domain',
      render: (r) => <span className="font-semibold text-[#05070E] dark:text-white">{r.domain}</span>,
    },
    {
      key: 'control',
      header: 'Architectural Control',
      render: (r) => r.control,
    },
    {
      key: 'enforcement',
      header: 'Enforcement Layer',
      render: (r) => <span className="font-mono text-xs">{r.enforcement}</span>,
    },
    {
      key: 'status',
      header: 'Readiness Status',
      render: (r) => (
        <span className="text-xs font-semibold text-[#2563EB] dark:text-[#7EC8FF]">{r.status}</span>
      ),
    },
  ];

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/[0.08] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Trust & Security Center', 'SONIL Group', 'Architectural Transparency']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] dark:text-white text-balance">
              Security designed into the runtime, not added as a wrapper.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              SOPIN separates what exists as architectural specification today from planned enterprise control-plane modules—never claiming third-party compliance certifications prematurely.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/enterprise')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors"
              >
                <span>Explore Private VPC / Enterprise</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/contact', undefined, { topic: 'SONIL Group Enterprise' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-sm font-semibold text-[#05070E] dark:text-white hover:bg-[#FBF7F0] dark:hover:bg-white/10 transition-colors"
              >
                <span>Schedule Security Briefing</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Four Pillar Security Breakdown */}
      <section className="py-16 lg:py-20 bg-[#FBF7F0] dark:bg-[#0A1226]/40 border-b border-[#05070E]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Defense-in-Depth"
            title="Four non-negotiable boundaries across every agent run."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: KeyRound,
                title: 'Zero Ambient Secrets',
                body: 'Agents never see raw model or database API keys. Server-side vaults inject ephemeral scoped tokens solely at verified step execution.',
              },
              {
                icon: Lock,
                title: 'Isolated Code & MCP Sandboxes',
                body: 'Untrusted scripts and local MCP servers run inside ephemeral containers with read-only root filesystems and disabled or allowlisted network egress.',
              },
              {
                icon: ShieldCheck,
                title: 'Customer Data Privacy',
                body: 'Customer prompts, corpora, and tool outputs are never used to train third-party foundation models. Pre-inference PII redaction runs inside Gateway.',
              },
              {
                icon: Server,
                title: 'Cloud or Private VPC Parity',
                body: 'Run identical SOPIN blueprints in managed SOPIN Cloud workspaces or deploy Runtime & Gateway inside your private corporate VPC.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#FAF9F5] dark:bg-[#05070E] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
                >
                  <Icon className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-lg font-semibold text-[#05070E] dark:text-white">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Security Architecture Table */}
      <section className="py-16 lg:py-20 bg-[#FAF9F5] dark:bg-[#05070E]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-8">
          <SectionHeader
            kicker="Control Matrix"
            title="Enterprise security domains & readiness posture."
            description="Every capability below indicates whether it belongs to Core Architecture specifications or Planned control-plane delivery."
          />

          <DataTable
            caption="SOPIN Enterprise Security Architecture Matrix"
            columns={columns}
            rows={SECURITY_MATRIX}
            rowKey={(r) => r.domain}
          />

          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#0A1226] text-white p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#60A5FA]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Responsible Disclosure &amp; Security Contact</span>
              </div>
              <h3 className="font-display text-xl font-semibold">
                Questions regarding architecture isolation, data residency, or vulnerability disclosure?
              </h3>
              <p className="text-sm text-[#B5B5C5]">
                Reach SOPIN &amp; SONIL Group security architecture directly at security@sopin.ai or via our enterprise contact channel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/contact', undefined, { topic: 'SONIL Group Enterprise' })}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>Contact Security Team</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
