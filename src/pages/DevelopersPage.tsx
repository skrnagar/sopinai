import React, { useState } from 'react';
import { ArrowRight, Code2, Globe, Plug, Terminal } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface DevelopersPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const DevelopersPage: React.FC<DevelopersPageProps> = ({ onNavigate }) => {
  const [sdkLang, setSdkLang] = useState<'typescript' | 'python'>('typescript');

  const sdkCode = {
    typescript: `import { SopinClient, mcpTool, z } from "@sopin/sdk";

const sopin = new SopinClient();

export const auditAgent = sopin.agent("dependency-auditor", {
  gateway: { route: "reasoning-structured" },
  tools: [mcpTool("package.inspectManifest")],
  outputSchema: z.object({
    outdatedPackages: z.array(z.string()),
    requiresUpgradeReview: z.boolean()
  })
});`,
    python: `from sopin_sdk import SopinClient, mcp_tool
from pydantic import BaseModel

class AuditResult(BaseModel):
    outdated_packages: list[str]
    requires_upgrade_review: bool

client = SopinClient()

audit_agent = client.agent(
    name="dependency-auditor",
    gateway={"route": "reasoning-structured"},
    tools=[mcp_tool("package.inspectManifest")],
    output_schema=AuditResult
)`,
  };

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#05070E]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#05070E] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Developers', 'SDK · MCP · A2A · Integrations']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] dark:text-white text-balance">
              Built for software engineers, not prompt-only toys.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Version agent specifications in Git, enforce typed input/output contracts, and integrate external tools using open standards including Model Context Protocol (MCP) and Agent-to-Agent (A2A).
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/docs')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Documentation</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* API and SDK */}
      <section id="sdk" className="py-20 border-b border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226]/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-5 min-w-0">
            <SectionHeader
              kicker="API and SDK"
              title="Typed TypeScript and Python SDKs."
              description="Define schemas, tool scopes, retry rules, and approval gates directly in code with bidirectional Studio synchronization."
            />
            <div role="tablist" aria-label="SDK language" className="flex flex-wrap gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={sdkLang === 'typescript'}
                onClick={() => setSdkLang('typescript')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[40px] ${
                  sdkLang === 'typescript'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
                }`}
              >
                TypeScript (@sopin/sdk)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sdkLang === 'python'}
                onClick={() => setSdkLang('python')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[40px] ${
                  sdkLang === 'python'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
                }`}
              >
                Python (sopin-sdk · Planned)
              </button>
            </div>
          </div>
          <div className="lg:col-span-7 min-w-0">
            <CodeBlock
              label={sdkLang === 'typescript' ? 'agent.ts' : 'agent.py (planned syntax)'}
              code={sdkCode[sdkLang]}
            />
          </div>
        </div>
      </section>

      {/* MCP & A2A, Integrations, Open Source */}
      <section id="protocols" className="py-20 bg-[#FFFFFF] dark:bg-[#05070E]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
            <Plug className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold text-[#05070E] dark:text-white">
              MCP and A2A Protocols
            </h2>
            <p className="mt-2.5 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Standardized tool discovery via Model Context Protocol and structured inter-agent task delegation via Agent-to-Agent contracts.
            </p>
          </div>

          <div id="integrations" className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
            <Terminal className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold text-[#05070E] dark:text-white">
              Structured Integrations
            </h2>
            <p className="mt-2.5 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Typed connector manifests for source repositories, document stores, relational read views, and webhook triggers with per-node permission scopes.
            </p>
          </div>

          <div id="open-source" className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
            <div className="flex items-center justify-between">
              <Globe className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#2563EB] dark:text-[#7EC8FF]">Coming Soon</span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-[#05070E] dark:text-white">
              Open Source Adapters
            </h2>
            <p className="mt-2.5 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Public protocol schemas, MCP starter adapters, and local verification CLI utilities planned for release under SONIL Group open engineering initiatives.
            </p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 mt-10">
          <div className="rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-[#0A1226] text-white p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Code2 className="w-6 h-6 text-[#60A5FA] mt-1 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Explore the SOPIN Developer Quickstart
                </h3>
                <p className="text-sm text-[#B5B5C5] mt-1">
                  Read schema specifications, CLI usage patterns, and MCP configuration guides.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/docs')}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Read Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
