import { RoutePath } from '../types/navigation';

export interface DocSection {
  id: string;
  group: string;
  title: string;
  status: string;
  summary: string;
  body: string;
  parameters?: { name: string; type: string; required: string; description: string }[];
  codeLabel: string;
  code: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quickstart: Define & Run Your First Agent',
    status: 'Preview Specification',
    summary:
      'Initialize a SOPIN workspace, declare a typed output contract, and execute a deterministic workflow locally.',
    body: 'SOPIN specifications compile identically whether authored in SOPIN Studio or written directly in TypeScript using @sopin/sdk. Start by defining your output schema and binding scoped MCP tools.',
    parameters: [
      { name: 'name', type: 'string', required: 'Yes', description: 'Unique slug identifier for the agent blueprint.' },
      { name: 'context', type: 'ContextScopeConfig', required: 'No', description: 'Scoped corpus index and memory retention rules.' },
      { name: 'tools', type: 'McpToolBinding[]', required: 'No', description: 'Explicit list of least-privilege MCP tools bound to this node.' },
      { name: 'outputSchema', type: 'ZodSchema', required: 'Yes', description: 'Strict typed contract validated by SOPIN Gateway.' },
    ],
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
    body: 'Every node created in SOPIN Studio emits deterministic blueprint metadata. Engineers review diffs in pull requests while automation architects inspect the same graph visually without translation loss.',
    parameters: [
      { name: 'blueprintVersion', type: 'string', required: 'Yes', description: 'Semantic blueprint schema version ("1.0-preview").' },
      { name: 'workflow', type: 'string', required: 'Yes', description: 'Canonical flow or graph identifier synced with Git.' },
      { name: 'nodes', type: 'BlueprintNode[]', required: 'Yes', description: 'Typed trigger, transform, gateway, or approval gate definitions.' },
    ],
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
    parameters: [
      { name: 'transport', type: '"stdio" | "http"', required: 'Yes', description: 'MCP transport protocol used inside the Runtime sandbox.' },
      { name: 'allowedTools', type: 'string[]', required: 'Yes', description: 'Allowlisted tool operations permitted for this agent node.' },
      { name: 'deniedTools', type: 'string[]', required: 'No', description: 'Explicitly blocked mutating endpoints.' },
      { name: 'sandbox.networkEgress', type: '"disabled" | "allowlist"', required: 'Yes', description: 'Strict egress boundary enforced by SOPIN Runtime.' },
    ],
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
    parameters: [
      { name: 'peerId', type: 'string', required: 'Yes', description: 'Registered peer agent identifier.' },
      { name: 'payload', type: 'Record<string, unknown>', required: 'Yes', description: 'Typed task payload validated against peer input schema.' },
      { name: 'expectSchema', type: 'string', required: 'Yes', description: 'Contract schema verified before task acceptance.' },
      { name: 'maxHops', type: 'number', required: 'Yes', description: 'Upper recursion ceiling preventing circular delegation.' },
    ],
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
    parameters: [
      { name: 'assertions', type: 'Assertion[]', required: 'Yes', description: 'Deterministic schema and grounding assertions executed pre-commit.' },
      { name: 'onElevatedRisk', type: 'HumanGatePolicy', required: 'No', description: 'Suspends durable state until designated RBAC reviewer approves.' },
    ],
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
  {
    id: 'ml-gateway',
    group: 'Models & ML',
    title: 'Registering Custom ML Models in SOPIN Gateway',
    status: 'Preview Specification',
    summary: 'Invoke custom PyTorch, tabular, or fine-tuned open-weight models alongside frontier LLMs via one typed Gateway.',
    body: 'AI/ML engineers register validated model artifacts alongside dataset provenance and evaluation metrics, exposing them seamlessly to Studio agents and Flow pipelines.',
    parameters: [
      { name: 'target', type: 'string', required: 'Yes', description: 'Registry URI (e.g., registry://vendor-risk-classifier:v3).' },
      { name: 'fallback', type: 'string', required: 'No', description: 'Secondary inference route on timeout or health failure.' },
      { name: 'evalBaseline', type: 'EvalThreshold', required: 'No', description: 'Minimum validation score required before Production stage promotion.' },
    ],
    codeLabel: 'ml-gateway.ts',
    code: `import { gateway } from "@sopin/sdk";

const riskScore = await gateway.infer({
  route: "registry://vendor-risk-classifier:v3",
  fallbackRoute: "reasoning-structured",
  input: { contractClauses, supplierTier: "tier-1" }
});`,
  },
  {
    id: 'decisions-spec',
    group: 'Decision Automation',
    title: 'SOPIN Decisions Specification (RuleSpec, Tables, Chains & CEL)',
    status: 'Preview Specification',
    summary:
      'Canonical data contracts for RuleSpec, DecisionTableSpec, RulesetSpec, RuleChainSpec, and DecisionExecutionSpec with restricted safe expression evaluation.',
    body: 'SOPIN Decisions separates deterministic business logic from probabilistic LLM inference and SOPIN Control authorization. Production runtime architecture compiles rules into Pydantic/CEL evaluators inside FastAPI + PostgreSQL with Temporal workflow invocation and OpenTelemetry trace spans.',
    parameters: [
      { name: 'RuleSpec', type: 'ConditionGroup + Outputs', required: 'Yes', description: 'Typed input schema, nested AND/OR condition tree, THEN/ELSE outputs, and restricted formula expressions.' },
      { name: 'DecisionTableSpec', type: 'HitPolicy + Matrix', required: 'Yes', description: 'Multi-column table supporting first-match, priority, collect-all, and unique hit policies.' },
      { name: 'RulesetSpec / RuleChainSpec', type: 'Composition', required: 'No', description: 'Ordered rule groups with conflict resolution and sequential stage pipelines passing outputs forward.' },
      { name: 'DecisionExecutionSpec', type: 'Audit Trace', required: 'Yes', description: 'Immutable execution record storing version, matched rows/clauses, output payload, and trace ID.' },
    ],
    codeLabel: 'decisions-eval.http',
    code: `POST /v1/decisions/evaluate
{
  "targetType": "rule",
  "targetId": "rule-invoice-auto-approve",
  "environment": "production",
  "input": {
    "invoiceAmount": 32500,
    "vendorVerified": true,
    "duplicateFound": false
  }
}`,
  },
];

export interface ResourceArticle {
  id: string;
  category: 'Blog' | 'Guides' | 'Tutorials' | 'Case Studies' | 'Academy';
  title: string;
  summary: string;
  readTime: string;
  status: 'Available' | 'Coming Soon' | 'Planned';
  dateLabel: string;
  pillar: string;
  author: string;
  sections: { heading: string; paragraphs: string[] }[];
  codeLabel?: string;
  codeSnippet?: string;
  relatedLinks: { label: string; href: RoutePath }[];
}

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    id: 'arch-unifying-studio-runtime',
    category: 'Blog',
    title: 'Why Agent Engineering Requires a Unified Runtime and Graph Spec',
    summary:
      'Exploring why separating prompt prototyping from workflow execution creates fragile systems, and how SOPIN unifies authoring with sandboxed execution.',
    readTime: '6 min read',
    status: 'Available',
    dateLabel: 'Engineering Note',
    pillar: '01 · Agent Engineering',
    author: 'SOPIN Platform Architecture Team',
    sections: [
      {
        heading: 'The Prototype-to-Production Translation Chasm',
        paragraphs: [
          'Most AI teams still maintain two disconnected worlds: visual prompt notebooks or no-code builders for fast experimentation, and custom backend glue code rewritten in Python or TypeScript before anything ships. Every rewrite drops edge-case assumptions, permission boundaries, and retrieval provenance.',
          'SOPIN eliminates that translation step by compiling natural-language task intents, visual SOPIN Flow DAGs, cyclic SOPIN Graph state machines, and @sopin/sdk definitions into a single typed blueprint executed identically inside SOPIN Runtime.',
        ],
      },
      {
        heading: 'Why Execution Guarantees Matter More Than Prompt Tuning',
        paragraphs: [
          'Reliability fails in production when external tools time out, model responses drift from JSON schemas, or agents invoke mutating APIs without human checkpoints. Putting durable checkpoints, pre-inference PII redaction, and sandboxed MCP execution directly into the runtime ensures every step is inspectable and recoverable.',
        ],
      },
    ],
    codeLabel: 'unified-blueprint.ts',
    codeSnippet: `export const triageBlueprint = defineWorkflow({
  id: "support-escalation-v2",
  gateway: "reasoning-structured",
  runtime: { sandbox: "ephemeral-readonly", maxRetries: 2 },
  humanGate: { when: (r) => r.severity === "elevated" }
});`,
    relatedLinks: [
      { label: 'Explore SOPIN Studio', href: '/studio' },
      { label: 'Explore SOPIN Runtime', href: '/runtime' },
      { label: 'Read Quickstart Docs', href: '/docs/quickstart' },
    ],
  },
  {
    id: 'guide-deterministic-gates',
    category: 'Guides',
    title: 'Designing Deterministic Verification Gates Around Probabilistic Models',
    summary:
      'Practical patterns for pairing typed JSON schemas, grounding assertions, and bounded retry policies in production-oriented agent workflows.',
    readTime: '8 min read',
    status: 'Available',
    dateLabel: 'Architecture Guide',
    pillar: '08 · AI Evaluation & Reliability',
    author: 'SOPIN Verification Engineering',
    sections: [
      {
        heading: 'Constrain Outputs Before Any Downstream Action Fires',
        paragraphs: [
          'Language models are probabilistic, but enterprise workflows cannot branch reliably on unstructured prose. At SOPIN Gateway, every inference profile enforces a strict Zod/JSON Schema contract with rejectExtraKeys enabled—repairing malformed payloads at most once before failing deterministically.',
        ],
      },
      {
        heading: 'Layered Assertions: Schema, Provenance, and Human Gates',
        paragraphs: [
          'Deterministic reliability requires three layers: structural validation at the Gateway, checksum grounding checks linking claims back to SOPIN Context snippets, and durable human approval pauses whenever an agent proposes a mutating external action.',
        ],
      },
    ],
    codeLabel: 'verification-gate.ts',
    codeSnippet: `const assertions = [
  verify.schemaStrict("InvoiceReconciliationResult"),
  verify.noUngroundedClaims(),
  verify.requireHumanApprovalWhen((out) => out.varianceUsd > 500)
];`,
    relatedLinks: [
      { label: 'Explore SOPIN Gateway', href: '/gateway' },
      { label: 'Explore SOPIN Evaluate', href: '/evaluate' },
      { label: 'Read Gate Policy Spec', href: '/docs/verification-gates' },
    ],
  },
  {
    id: 'guide-sopin-decisions',
    category: 'Guides',
    title: 'Separating Deterministic Business Rules from AI Reasoning with SOPIN Decisions',
    summary:
      'Architectural blueprint for combining deterministic rules, decision tables, and scorecards with SOPIN Flow workflows and human-reviewed Studio AI drafting.',
    readTime: '7 min read',
    status: 'Available',
    dateLabel: 'Architecture Guide',
    pillar: '03 · Workflow & Decision Automation',
    author: 'SOPIN Platform Architecture Team',
    sections: [
      {
        heading: 'Why LLMs Should Draft—Never Decide—Binding Business Thresholds',
        paragraphs: [
          'Asking a language model whether a ₹48,500 vendor invoice qualifies for straight-through approval introduces latency, prompt sensitivity, and audit ambiguity. Instead, SOPIN Decisions keeps financial thresholds, SLA matrices, and risk scorecards strictly deterministic.',
          'SOPIN Studio can translate plain-English policy notes into editable Draft RuleSpec definitions, while human maintainers test fixtures and promote versions explicitly through SOPIN Control.',
        ],
      },
      {
        heading: 'Clear Boundaries Across Decisions, Control, Flow, and Graph',
        paragraphs: [
          'SOPIN Decisions determines what business outcome applies; SOPIN Control enforces who is authorized to invoke or publish; SOPIN Flow routes workflow execution around Decision Nodes; and SOPIN Graph allows AI agents to query decisions strictly read-only.',
        ],
      },
    ],
    codeLabel: 'flow-decision-node.ts',
    codeSnippet: `step.decision("invoiceAutoApproval", {
  ruleId: "rule-invoice-auto-approve",
  input: { invoiceAmount: ctx.total, vendorVerified: ctx.kybPassed, duplicateFound: ctx.isDuplicate },
  onResult: (res) => res.requiresHumanGate ? humanGate("finance-controller") : step.mcp("erp.postInvoice")
});`,
    relatedLinks: [
      { label: 'Explore SOPIN Decisions', href: '/decisions' },
      { label: 'Read Decisions Spec', href: '/docs/decisions-spec' },
      { label: 'Try Decisions in App', href: '/app' },
    ],
  },
  {
    id: 'guide-context-scoping',
    category: 'Guides',
    title: 'Separating Working Memory, Episodic State, and Knowledge Indexes',
    summary:
      'How to prevent context bloat and cross-task leakage using SOPIN Context memory tiers.',
    readTime: '7 min read',
    status: 'Available',
    dateLabel: 'Architecture Guide',
    pillar: '04 · RAG & Context Engineering',
    author: 'SOPIN Context Systems Team',
    sections: [
      {
        heading: 'Why Monolithic Prompt Context Degrades',
        paragraphs: [
          'Packing raw files, conversation history, and tool logs into a single expanding context window causes reasoning dilution, token inflation, and accidental cross-tenant exposure.',
        ],
      },
      {
        heading: 'Three Isolated Tiers in SOPIN Context',
        paragraphs: [
          'Tier 01 (Ephemeral Working State) holds short-lived run artifacts purged upon completion. Tier 02 (Episodic Memory) preserves workspace-scoped operational learnings. Tier 03 (Grounded Knowledge Corpora) enforces pre-retrieval ACL filtering and attaches SHA-256 span checksums to every chunk returned to an agent.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Explore SOPIN Context', href: '/context' },
      { label: 'Explore Security Center', href: '/security' },
      { label: 'Try Knowledge Tab in App', href: '/app' },
    ],
  },
  {
    id: 'tutorial-mcp-tool-binding',
    category: 'Tutorials',
    title: 'Connecting Your First MCP Tool Server to SOPIN Flow',
    summary:
      'Walkthrough of declaring an MCP tool manifest, scoping read-only permissions, and testing tool execution locally.',
    readTime: '10 min walkthrough',
    status: 'Available',
    dateLabel: 'Tutorial',
    pillar: '06 · MCP & A2A Interoperability',
    author: 'SOPIN Developer Relations',
    sections: [
      {
        heading: 'Step 1: Declare Scoped Read & Deny Lists',
        paragraphs: [
          'Instead of exposing an entire external REST client to an agent, declare explicit allowedTools and deniedTools inside your MCP server manifest. SOPIN validates every tool invocation against this allowlist before booting the sandbox.',
        ],
      },
      {
        heading: 'Step 2: Lock Network Egress & Test Deterministically',
        paragraphs: [
          'Configure sandbox.networkEgress to "disabled" for local repository/document parsers or "allowlist" for approved internal APIs. Run dry-run payloads inside Studio or the /app Build tab to inspect exact inputs, outputs, and span durations.',
        ],
      },
    ],
    codeLabel: 'mcp-tutorial.ts',
    codeSnippet: `export const docsMcp = mcpServer("adr-reader", {
  transport: "stdio",
  allowedTools: ["adr.search", "adr.readByChecksum"],
  deniedTools: ["adr.write", "adr.delete"],
  sandbox: { networkEgress: "disabled", timeoutMs: 10000 }
});`,
    relatedLinks: [
      { label: 'Read MCP Bindings Spec', href: '/docs/mcp-bindings' },
      { label: 'Explore SOPIN Runtime', href: '/runtime' },
      { label: 'Developer Hub', href: '/developers' },
    ],
  },
  {
    id: 'tutorial-human-checkpoint',
    category: 'Tutorials',
    title: 'Implementing Pause-and-Resume Human Approval Checkpoints',
    summary:
      'Build a durable workflow that suspends cleanly prior to state mutation and resumes upon operator sign-off.',
    readTime: '9 min walkthrough',
    status: 'Available',
    dateLabel: 'Tutorial',
    pillar: '03 · Workflow Automation',
    author: 'SOPIN Runtime Team',
    sections: [
      {
        heading: 'Why Approval Gates Must Be Durable',
        paragraphs: [
          'Human review can take five minutes or two days. Holding open HTTP connections or worker threads fails under real operations. SOPIN Flow checkpoints workflow state into persistent storage when a humanGate node triggers.',
        ],
      },
      {
        heading: 'Try It Directly in the SOPIN Mobile Workspace',
        paragraphs: [
          'Open /app ("Try SOPIN"), launch a run in the Run tab, or open Pending Approvals on Home to inspect retrieved citations and tap Approve or Reject to observe how SOPIN Control logs audit lineage.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Explore SOPIN Flow', href: '/flow' },
      { label: 'Explore SOPIN Control', href: '/control' },
      { label: 'Test Approvals in App', href: '/app' },
    ],
  },
  {
    id: 'case-studies-cohort',
    category: 'Case Studies',
    title: 'Early Design Partner Architecture Publications',
    summary:
      'SOPIN is actively collaborating with engineering teams on initial deployments. Verified customer case studies will be published following production validation.',
    readTime: 'Upcoming',
    status: 'Coming Soon',
    dateLabel: 'Design Partner Program',
    pillar: '10 · Enterprise AI Architecture',
    author: 'SONIL Group Engineering',
    sections: [
      {
        heading: 'Transparent Publication Standards',
        paragraphs: [
          'We never publish synthetic customer logos or unverified benchmark numbers. Production case studies covering latency, cost reduction, and verification outcomes will be published only after verified partner production validation.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Apply as Design Partner', href: '/contact' },
      { label: 'Explore Enterprise Topology', href: '/enterprise' },
    ],
  },
  {
    id: 'academy-foundations',
    category: 'Academy',
    title: 'SOPIN Academy: Foundations of Accountable Agent Engineering',
    summary:
      'Structured curriculum covering state graphs, MCP/A2A protocols, context engineering, and verification harnesses.',
    readTime: 'Curriculum',
    status: 'Planned',
    dateLabel: 'Planned Release',
    pillar: '01 · Agent Engineering',
    author: 'SOPIN Education Initiative',
    sections: [
      {
        heading: 'Planned Learning Tracks',
        paragraphs: [
          'Planned modules cover: (1) Authoring Typed Agents & Workflows, (2) Context & Multimodal RAG Provenance, (3) MCP/A2A Protocol Security, (4) ML & Gateway Model Routing, and (5) Enterprise Control & Evaluation Harnesses.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Browse Current Docs', href: '/docs' },
      { label: 'Request Academy Updates', href: '/contact' },
    ],
  },
];
