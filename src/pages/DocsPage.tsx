import React, { useMemo, useState } from 'react';
import { Book, Search, ArrowRight } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { CodeBlock, StateDisplay, StatusText } from '../components/ui/EditorialPrimitives';

interface DocsPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

interface DocSection {
  id: string;
  group: string;
  title: string;
  status: string;
  summary: string;
  body: string;
  codeLabel: string;
  code: string;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quickstart: Define & Run Your First Agent',
    status: 'Preview Specification',
    summary: 'Initialize a SOPIN workspace, declare a typed output contract, and execute a deterministic workflow locally.',
    body: 'SOPIN specifications compile identically whether authored in SOPIN Studio or written directly in TypeScript using @sopin/sdk. Start by defining your output schema and binding scoped MCP tools.',
    codeLabel: 'quickstart.ts',
    code: `import { defineAgent, mcpTool, z } from "@sopin/sdk";

export const releaseNotesAgent = defineAgent({
  name: "release-notes-synthesizer",
  context: { scope: "repository", index: "changelog-history" },
  tools: [mcpTool("git.commits", { permission: "read-only" })],
  outputSchema: z.object({
    summary: z.string(),
    breakingChanges: z.array(z.string()),
    requiresSecurityReview: z.boolean()
  })
});`,
  },
  {
    id: 'studio-sync',
    group: 'Authoring',
    title: 'Bidirectional Studio & SDK Sync',
    status: 'Core Architecture',
    summary: 'How visual DAG nodes and cyclic graphs map 1:1 to version-controlled TypeScript definitions.',
    body: 'Every node created in SOPIN Studio emits deterministic blueprint metadata. Engineers can review diffs in pull requests while automation architects inspect the same graph visually.',
    codeLabel: 'sopin.blueprint.json',
    code: `{
  "blueprintVersion": "1.0-preview",
  "workflow": "customer-triage",
  "nodes": [
    { "id": "intake", "kind": "trigger.webhook" },
    { "id": "redact", "kind": "transform.piiFilter" },
    { "id": "classify", "kind": "gateway.structured" },
    { "id": "approve", "kind": "gate.humanApproval" }
  ]
}`,
  },
  {
    id: 'mcp-bindings',
    group: 'Protocols',
    title: 'Model Context Protocol (MCP) Bindings',
    status: 'Core Architecture',
    summary: 'Attach external tools with explicit read/write scopes, timeouts, and sandbox isolation.',
    body: 'SOPIN treats MCP as a first-class tool transport. Each tool declaration binds an explicit capability scope so an agent running a research step cannot invoke mutating endpoints.',
    codeLabel: 'mcp.config.ts',
    code: `import { mcpServer } from "@sopin/sdk";

export const repoTools = mcpServer("git-repository", {
  transport: "stdio",
  allowedTools: ["git.diff", "git.log"],
  deniedTools: ["git.push", "git.forceDelete"],
  sandbox: { networkEgress: "disabled", timeoutMs: 15000 }
});`,
  },
  {
    id: 'a2a-delegation',
    group: 'Protocols',
    title: 'Agent-to-Agent (A2A) Delegation',
    status: 'Preview Specification',
    summary: 'Coordinate specialized peer agents using typed task envelopes and verifiable completion artifacts.',
    body: 'Instead of packing every domain instruction into one monolithic prompt, SOPIN enables bounded A2A handoffs where each peer agent declares its input schema, capability scope, and verification contract.',
    codeLabel: 'a2a-handoff.ts',
    code: `import { a2aDelegate } from "@sopin/sdk";

const verification = await a2aDelegate("citation-auditor", {
  payload: { draftMarkdown, sourceIds },
  expectSchema: "CitationAuditResult",
  maxHops: 2
});`,
  },
  {
    id: 'verification-gates',
    group: 'Verification & Governance',
    title: 'Verification Gates & Human Checkpoints',
    status: 'Planned / Preview',
    summary: 'Combine deterministic schema checks with durable pause-and-resume approval gates.',
    body: 'Before an agent emits an external action, SOPIN evaluates deterministic assertions and routes high-impact proposals to an authorized reviewer.',
    codeLabel: 'gate.policy.ts',
    code: `import { humanGate, verify } from "@sopin/sdk";

export const reviewPolicy = {
  assertions: [verify.noUngroundedClaims(), verify.schemaStrict()],
  onElevatedRisk: humanGate({
    approverRole: "platform-maintainer",
    timeoutMinutes: 60
  })
};`,
  },
];

export const DocsPage: React.FC<DocsPageProps> = ({ onNavigate }) => {
  const [selectedId, setSelectedId] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DOC_SECTIONS;
    return DOC_SECTIONS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.group.toLowerCase().includes(q) ||
        doc.body.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeDoc =
    filteredDocs.find((d) => d.id === selectedId) ?? filteredDocs[0] ?? null;

  return (
    <div className="overflow-x-clip bg-[#FFFFFF] dark:bg-[#101014] min-h-[75vh]">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <StatusText items={['SOPIN Documentation', 'Developer Hub', 'Specification Preview']} accentLast />
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white">
              SOPIN Engineering Documentation
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              Explore reference specifications for @sopin/sdk, Studio blueprint schemas, MCP tool scopes, and A2A handoffs.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="w-4 h-4 text-[#777786] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation topics..."
              aria-label="Search documentation"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-sm text-[#101014] dark:text-white placeholder:text-[#777786]"
            />
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12">
        {filteredDocs.length === 0 ? (
          <StateDisplay
            mode="empty"
            title="No matching documentation sections"
            description={`No specification pages matched "${searchQuery}". Reset search to view all SOPIN documentation modules.`}
            actionLabel="Show All Docs"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 space-y-2 min-w-0">
              <div className="text-xs font-semibold text-[#777786] dark:text-[#9A9AB0] px-3 pb-1">
                Specification Sections
              </div>
              {filteredDocs.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={`w-full min-h-[44px] text-left rounded-xl p-3.5 border transition-colors ${
                      isSelected
                        ? 'border-[#6252E8] bg-[#6252E8]/[0.06] dark:bg-[#6252E8]/15'
                        : 'border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/60 hover:border-[#6252E8]/40'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-[#6252E8] dark:text-[#965BFF]">
                      {doc.group}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#101014] dark:text-white">
                      {doc.title}
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Active Documentation Content */}
            {activeDoc && (
              <div className="lg:col-span-8 space-y-6 min-w-0">
                <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/50 p-7 sm:p-8 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#6252E8] dark:text-[#965BFF] mb-2">
                    <Book className="w-4 h-4" aria-hidden="true" />
                    <span>{activeDoc.group} · {activeDoc.status}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#101014] dark:text-white">
                    {activeDoc.title}
                  </h2>
                  <p className="mt-3 text-base text-[#101014] dark:text-[#E8E8F2] leading-relaxed">
                    {activeDoc.summary}
                  </p>
                  <p className="mt-4 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                    {activeDoc.body}
                  </p>
                </div>

                <CodeBlock label={activeDoc.codeLabel} code={activeDoc.code} />

                <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#101014] dark:text-white">
                      Need early cohort SDK credentials?
                    </h3>
                    <p className="text-sm text-[#777786] dark:text-[#A4A4B5]">
                      Request Developer Preview access through the SOPIN engineering intake form.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/contact')}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Request Access</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
