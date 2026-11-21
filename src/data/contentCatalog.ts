import { RoutePath } from '../types/navigation';

export interface DocSubSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface DocSection {
  id: string;
  group: string;
  title: string;
  status: string;
  summary: string;
  body: string;
  sections: DocSubSection[];
  parameters?: { name: string; type: string; required: string; description: string }[];
  codeLabel: string;
  code: string;
  secondaryCode?: { label: string; code: string };
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quickstart: Define & Run Your First Agent',
    status: 'Preview Specification',
    summary:
      'Initialize a SOPIN workspace, declare a typed output contract, and execute a deterministic workflow locally.',
    body: 'SOPIN specifications compile identically whether authored in SOPIN Studio or written directly in TypeScript or Python using the official SDKs. Start by defining your typed output schema, binding read-only MCP tools, and assigning a Gateway inference profile.',
    sections: [
      {
        id: 'overview',
        heading: 'Architecture Overview',
        paragraphs: [
          'Every SOPIN agent separates probabilistic reasoning from execution mechanics. Rather than embedding API credentials or unvalidated prompts directly inside application routes, you declare a blueprint that binds a Gateway route, Context scope, least-privilege MCP tools, and strict output validation.',
        ],
      },
      {
        id: 'install-configure',
        heading: 'Initialize Workspace & Output Contract',
        paragraphs: [
          'Define a strict Zod or Pydantic contract on every agent node. SOPIN Gateway validates payloads against this contract before downstream Flow steps or tool invocations execute, repairing malformed JSON at most once inside bounded retry policies.',
        ],
      },
    ],
    parameters: [
      { name: 'name', type: 'string', required: 'Yes', description: 'Unique slug identifier for the agent blueprint.' },
      { name: 'context', type: 'ContextScopeConfig', required: 'No', description: 'Scoped corpus index and memory retention rules.' },
      { name: 'tools', type: 'McpToolBinding[]', required: 'No', description: 'Explicit list of least-privilege MCP tools bound to this node.' },
      { name: 'outputSchema', type: 'ZodSchema | BaseModel', required: 'Yes', description: 'Strict typed contract validated by SOPIN Gateway.' },
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
    secondaryCode: {
      label: 'quickstart.py',
      code: `from pydantic import BaseModel
from sopin_sdk import define_agent, mcp_tool

class ReleaseNotesOutput(BaseModel):
    summary: str
    breaking_changes: list[str]
    requires_security_review: bool

release_notes_agent = define_agent(
    name="release-notes-synthesizer",
    context={"scope": "repository", "index": "changelog-history"},
    tools=[mcp_tool("git.commits", permission="read-only")],
    output_schema=ReleaseNotesOutput,
)`,
    },
  },
  {
    id: 'studio-sync',
    group: 'Authoring',
    title: 'Bidirectional Studio & SDK Sync',
    status: 'Core Architecture',
    summary: 'How visual DAG nodes and cyclic graphs map 1:1 to version-controlled TypeScript and JSON blueprints.',
    body: 'Every node created in SOPIN Studio emits deterministic blueprint metadata. Software engineers review diffs in pull requests while automation architects inspect and refine the exact same topology visually without translation loss.',
    sections: [
      {
        id: 'blueprint-format',
        heading: 'Canonical Blueprint Representation',
        paragraphs: [
          'Unlike proprietary drag-and-drop tools that trap workflow state inside opaque database blobs, SOPIN serializes Studio graphs into deterministic JSON and TypeScript definitions.',
          'Changes edited in Git automatically reflect in SOPIN Studio upon sync, preserving node coordinates, schema contracts, and Gateway route bindings.',
        ],
      },
      {
        id: 'review-workflow',
        heading: 'Pull Request Diffing & Environment Promotion',
        paragraphs: [
          'Because blueprints are deterministic files, teams can pair visual authoring with standard branch protection, automated Evaluate assertions, and staged promotion across Development, Staging, and Production.',
        ],
      },
    ],
    parameters: [
      { name: 'blueprintVersion', type: 'string', required: 'Yes', description: 'Semantic blueprint schema version ("1.0-preview").' },
      { name: 'workflow', type: 'string', required: 'Yes', description: 'Canonical flow or graph identifier synced with Git.' },
      { name: 'nodes', type: 'BlueprintNode[]', required: 'Yes', description: 'Typed trigger, transform, decision, gateway, or approval gate definitions.' },
    ],
    codeLabel: 'sopin.blueprint.json',
    code: `{
  "blueprintVersion": "1.0-preview",
  "workflow": "customer-triage",
  "nodes": [
    { "id": "intake", "kind": "trigger.webhook" },
    { "id": "redact", "kind": "transform.piiFilter" },
    { "id": "policy", "kind": "decision.ruleTable", "ref": "sla-routing-table" },
    { "id": "classify", "kind": "gateway.structured" },
    { "id": "approve", "kind": "gate.humanApproval" }
  ]
}`,
  },
  {
    id: 'graph-orchestration',
    group: 'Orchestration & Graphs',
    title: 'Cyclic Multi-Agent Graphs (SOPIN Graph)',
    status: 'Core Architecture',
    summary: 'Model planner-researcher-verifier loops and bounded state transitions with compile-time step ceilings.',
    body: 'Complex engineering and research tasks often require iterative tool execution, reflection, and peer verification. SOPIN Graph lets you model cyclic state machines with typed reducers and hard maxSteps termination limits.',
    sections: [
      {
        id: 'shared-state',
        heading: 'Typed State Reducers',
        paragraphs: [
          'Every node in a SOPIN Graph reads from and emits partial updates to a strongly typed shared state object. Reducers guarantee predictable state merging across concurrent fan-outs and supersteps.',
        ],
      },
      {
        id: 'loop-guardrails',
        heading: 'Bounded Recursion & Termination Guardrails',
        paragraphs: [
          'Autonomous loops cannot run unbounded in production. SOPIN Graph enforces mandatory maxSteps ceilings and token budgets directly inside the Runtime supervisor—halting and escalating cleanly if convergence is not reached.',
        ],
      },
    ],
    parameters: [
      { name: 'maxSteps', type: 'number', required: 'Yes', description: 'Hard upper superstep ceiling enforced by SOPIN Runtime.' },
      { name: 'stateSchema', type: 'ZodObject', required: 'Yes', description: 'Shared graph state contract validated across every superstep.' },
      { name: 'edges', type: 'EdgeSpec[]', required: 'Yes', description: 'Deterministic or predicate-guarded transitions between nodes.' },
    ],
    codeLabel: 'research-graph.ts',
    code: `import { defineGraph, a2aPeer, z } from "@sopin/sdk";

export const verificationGraph = defineGraph({
  name: "multi-agent-research",
  maxSteps: 6,
  stateSchema: z.object({
    topic: z.string(),
    draft: z.string().optional(),
    verifiedCitations: z.array(z.string()).default([])
  }),
  nodes: {
    planner: { gateway: "reasoning-structured" },
    researcher: { context: "policy-corpus" },
    auditor: a2aPeer("citation-auditor", { timeoutMs: 20000 })
  },
  edges: [
    ["planner", "researcher"],
    ["researcher", "auditor"],
    { from: "auditor", when: (s) => s.verifiedCitations.length === 0, to: "researcher" }
  ]
});`,
  },
  {
    id: 'mcp-bindings',
    group: 'Protocols',
    title: 'Model Context Protocol (MCP) Bindings',
    status: 'Core Architecture',
    summary: 'Attach external tools with explicit read/write scopes, timeouts, and sandbox isolation.',
    body: 'SOPIN treats MCP as a first-class tool transport. Each tool declaration binds an explicit capability scope so an agent running a research step cannot invoke mutating endpoints or bypass network egress controls.',
    sections: [
      {
        id: 'capability-scoping',
        heading: 'Read vs. Write Allowlists',
        paragraphs: [
          'Rather than exposing full REST clients to a language model, MCP server declarations enumerate allowedTools and deniedTools explicitly. SOPIN Control verifies these scopes out-of-band before the Runtime boots a tool sandbox.',
        ],
      },
      {
        id: 'sandbox-egress',
        heading: 'Ephemeral Sandboxes & Network Egress',
        paragraphs: [
          'Code analyzers, repository readers, and document parsers run inside isolated containers with networkEgress: "disabled". Networked connectors require an explicit destination allowlist.',
        ],
      },
    ],
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
    sections: [
      {
        id: 'typed-envelopes',
        heading: 'Signed Task Envelopes',
        paragraphs: [
          'Every A2A delegation transmits a schema-validated task envelope containing scoped input payloads, a hop counter, and the caller trace ID so SOPIN Observe correlates multi-agent execution seamlessly.',
        ],
      },
      {
        id: 'recursion-limits',
        heading: 'Preventing Circular Peer Delegation',
        paragraphs: [
          'Enforcing maxHops guarantees bounded peer communication even when multiple specialized agents collaborate across workspaces.',
        ],
      },
    ],
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
    id: 'decisions-spec',
    group: 'Decision Automation',
    title: 'SOPIN Decisions Specification (RuleSpec, Tables, Chains & CEL)',
    status: 'Core Architecture',
    summary:
      'Canonical data contracts for RuleSpec, DecisionTableSpec, RulesetSpec, RuleChainSpec, and ScorecardSpec with deterministic evaluation.',
    body: 'SOPIN Decisions separates deterministic business logic from probabilistic LLM inference and SOPIN Control authorization. Rules evaluate deterministically with restricted safe expressions, version promotion (Draft -> Tested -> Published), and step-by-step audit traces.',
    sections: [
      {
        id: 'five-artifacts',
        heading: 'Five Unified Decision Artifact Types',
        paragraphs: [
          'SOPIN Decisions supports IF/ELSE RuleSpecs, spreadsheet Decision Tables (first-match, priority, collect-all, unique), ordered Rulesets with conflict resolution, sequential Rule Chains, and weighted Scorecards.',
          'All five artifact types obey identical lifecycle validation, approval-hash binding, simulation batch testing, and Flow Decision Node invocation.',
        ],
      },
      {
        id: 'flow-integration',
        heading: 'Deterministic Flow & Agent Interoperability',
        paragraphs: [
          'SOPIN Flow workflows invoke Decision Nodes directly using pinned version policies, mapping workflow variables in and out while branching cleanly on matched, no-match, or error outcomes. Agents in Graph/Studio can query decisions strictly read-only.',
        ],
      },
    ],
    parameters: [
      { name: 'RuleSpec', type: 'ConditionGroup + Outputs', required: 'Yes', description: 'Typed input schema, nested AND/OR condition tree, THEN/ELSE outputs, and restricted formula expressions.' },
      { name: 'DecisionTableSpec', type: 'HitPolicy + Matrix', required: 'Yes', description: 'Multi-column table supporting first-match, priority, collect-all, and unique hit policies.' },
      { name: 'RulesetSpec / RuleChainSpec', type: 'Composition', required: 'No', description: 'Ordered rule groups with conflict resolution and sequential stage pipelines passing outputs forward.' },
      { name: 'DecisionExecutionSpec', type: 'Audit Trace', required: 'Yes', description: 'Immutable execution record storing version, matched rows/clauses, output payload, and trace ID.' },
    ],
    codeLabel: 'decisions-eval.http',
    code: `POST /v1/decisions/evaluate HTTP/1.1
Content-Type: application/json

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
    secondaryCode: {
      label: 'flow-decision-node.ts',
      code: `step.decision("invoiceAutoApproval", {
  artifactId: "rule-invoice-auto-approve",
  versionPolicy: "pinned:1.2.0",
  inputMap: { invoiceAmount: "ctx.amount", vendorVerified: "ctx.kybOk" },
  onMatched: "routePayment",
  onNoMatch: "escalateController"
});`,
    },
  },
  {
    id: 'ml-gateway',
    group: 'Models & ML',
    title: 'Registering Custom ML & Multimodal Routes in SOPIN Gateway',
    status: 'Preview Specification',
    summary: 'Invoke custom PyTorch, tabular, or fine-tuned open-weight models alongside frontier LLMs via one typed Gateway.',
    body: 'AI/ML engineers register validated model artifacts alongside dataset provenance and evaluation metrics, exposing them seamlessly to Studio agents, Flow pipelines, and pre-inference PII redaction transforms.',
    sections: [
      {
        id: 'unified-routing',
        heading: 'Vendor-Neutral Multimodal & ML Routing',
        paragraphs: [
          'SOPIN Gateway abstracts provider APIs behind logical profile names. Workflows never hardcode vendor keys or SDK quirks, enabling automatic failover between commercial models, self-hosted vLLM clusters, and tabular ML classifiers.',
        ],
      },
      {
        id: 'pii-sanitization',
        heading: 'Pre-Inference PII Redaction',
        paragraphs: [
          'Configure deterministic sanitization rules on any Gateway profile to mask restricted identifiers locally before payloads leave your network perimeter.',
        ],
      },
    ],
    parameters: [
      { name: 'route', type: 'string', required: 'Yes', description: 'Registry URI or Gateway profile (e.g., registry://vendor-risk-classifier:v3).' },
      { name: 'fallbackRoute', type: 'string', required: 'No', description: 'Secondary inference route triggered on timeout or health failure.' },
      { name: 'piiRedaction', type: 'string[]', required: 'No', description: 'Field patterns scrubbed locally prior to external model dispatch.' },
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
    id: 'verification-gates',
    group: 'Verification & Governance',
    title: 'Verification Gates & Human Checkpoints',
    status: 'Planned / Preview',
    summary: 'Combine deterministic schema checks with durable pause-and-resume approval gates.',
    body: 'Before an agent emits an external action or commits a high-impact state mutation, SOPIN evaluates deterministic assertions and suspends execution into an approval queue routed to an authorized reviewer.',
    sections: [
      {
        id: 'deterministic-assertions',
        heading: 'Schema & Provenance Verification',
        paragraphs: [
          'Pair SOPIN Evaluate grounding assertions with Gateway schema locks so ungrounded claims or missing source checksums fail cleanly before an approval request is even raised.',
        ],
      },
      {
        id: 'durable-human-gates',
        heading: 'Durable Pause-and-Resume Checkpoints',
        paragraphs: [
          'Because SOPIN Flow persists execution state in durable checkpoints, human reviewers can take minutes or days to inspect citations and approve or reject proposed tool mutations without holding compute workers open.',
        ],
      },
    ],
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
];

export type ResearchCategory = 'Research' | 'Engineering' | 'Case Studies';

export interface ResourceArticle {
  id: string;
  category: 'Blog' | 'Guides' | 'Tutorials' | 'Case Studies' | 'Academy';
  researchCategory: ResearchCategory;
  title: string;
  summary: string;
  readTime: string;
  status: 'Available' | 'Coming Soon' | 'Planned';
  dateLabel: string;
  publishedDate: string;
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
    researchCategory: 'Research',
    title: 'Why Agent Engineering Requires a Unified Runtime and Graph Spec',
    summary:
      'Exploring why separating prompt prototyping from workflow execution creates fragile systems, and how SOPIN unifies authoring with sandboxed execution.',
    readTime: '6 min read',
    status: 'Available',
    dateLabel: 'AI Architecture Research',
    publishedDate: 'May 2026',
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
    researchCategory: 'Research',
    title: 'Designing Deterministic Verification Gates Around Probabilistic Models',
    summary:
      'Architectural patterns for pairing typed JSON schemas, source checksum grounding assertions, and bounded retry policies in enterprise AI systems.',
    readTime: '8 min read',
    status: 'Available',
    dateLabel: 'Systems & Reliability Research',
    publishedDate: 'May 2026',
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
    researchCategory: 'Engineering',
    title: 'Separating Deterministic Business Rules from AI Reasoning with SOPIN Decisions',
    summary:
      'Engineering blueprint for combining deterministic rules, decision tables, and scorecards with SOPIN Flow workflows and human-reviewed Studio drafting.',
    readTime: '7 min read',
    status: 'Available',
    dateLabel: 'Architecture Guide',
    publishedDate: 'Apr 2026',
    pillar: '03 · Decision Automation',
    author: 'SOPIN Platform Architecture Team',
    sections: [
      {
        heading: 'Why LLMs Should Draft—Never Decide—Binding Business Thresholds',
        paragraphs: [
          'Asking a language model whether an enterprise invoice qualifies for straight-through approval introduces latency, prompt sensitivity, and audit ambiguity. Instead, SOPIN Decisions keeps financial thresholds, SLA matrices, and risk scorecards strictly deterministic.',
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
      { label: 'Explore SOPIN Flow', href: '/flow' },
    ],
  },
  {
    id: 'guide-context-scoping',
    category: 'Guides',
    researchCategory: 'Engineering',
    title: 'Separating Working Memory, Episodic State, and Knowledge Indexes',
    summary:
      'Implementation patterns for preventing context bloat and cross-tenant leakage using SOPIN Context memory tiers.',
    readTime: '7 min read',
    status: 'Available',
    dateLabel: 'Engineering Guide',
    publishedDate: 'Apr 2026',
    pillar: '04 · Context Engineering',
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
      { label: 'Read Graph Spec', href: '/docs/graph-orchestration' },
    ],
  },
  {
    id: 'tutorial-mcp-tool-binding',
    category: 'Tutorials',
    researchCategory: 'Engineering',
    title: 'Connecting Your First MCP Tool Server to SOPIN Flow',
    summary:
      'Step-by-step tutorial on declaring an MCP tool manifest, scoping read-only permissions, and locking sandbox network egress.',
    readTime: '10 min guide',
    status: 'Available',
    dateLabel: 'Developer Tutorial',
    publishedDate: 'Mar 2026',
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
          'Configure sandbox.networkEgress to "disabled" for local repository/document parsers or "allowlist" for approved internal APIs. Run dry-run payloads inside Studio to inspect exact inputs, outputs, and span durations.',
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
    researchCategory: 'Engineering',
    title: 'Implementing Pause-and-Resume Human Approval Checkpoints',
    summary:
      'Build a durable workflow that suspends cleanly prior to state mutation and resumes upon authorized operator sign-off.',
    readTime: '9 min guide',
    status: 'Available',
    dateLabel: 'Developer Tutorial',
    publishedDate: 'Mar 2026',
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
        heading: 'Correlating Citations With Reviewer Decisions',
        paragraphs: [
          'Every suspended checkpoint captures the exact Context chunk checksums, Decision Node outputs, and proposed MCP mutation payload so reviewers inspect verified evidence prior to sign-off.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Explore SOPIN Flow', href: '/flow' },
      { label: 'Explore SOPIN Control', href: '/control' },
      { label: 'Read Gate Policy Spec', href: '/docs/verification-gates' },
    ],
  },
  {
    id: 'case-studies-cohort',
    category: 'Case Studies',
    researchCategory: 'Case Studies',
    title: 'Enterprise Design Partner Architecture Program — SONIL Group',
    summary:
      'Transparent architectural case studies covering production multi-agent workflows, deterministic decisions, and private VPC deployments will be published after partner validation.',
    readTime: 'Program Note',
    status: 'Coming Soon',
    dateLabel: 'Case Studies · Cohort Preview',
    publishedDate: 'Upcoming',
    pillar: '10 · Enterprise AI Architecture',
    author: 'SONIL Group Engineering',
    sections: [
      {
        heading: 'Transparent Publication Standards',
        paragraphs: [
          'SOPIN and SONIL Group never publish synthetic customer logos or unverified benchmark numbers. Detailed case studies covering end-to-end execution lineage, verification pass rates, and operational reliability are published exclusively following verified partner production validation.',
        ],
      },
      {
        heading: 'Focus Domains in the Initial Cohort',
        paragraphs: [
          'Active architectural collaborations span regulated invoice and policy triage (combining SOPIN Flow + Decisions), repository verification pipelines (SOPIN Graph + Runtime), and grounded enterprise knowledge indexing (SOPIN Context).',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Apply as Design Partner', href: '/contact' },
      { label: 'Explore Enterprise Topology', href: '/enterprise' },
      { label: 'Inspect Solutions', href: '/solutions' },
    ],
  },
  {
    id: 'academy-foundations',
    category: 'Academy',
    researchCategory: 'Research',
    title: 'Foundations of Accountable Multi-Agent Systems Engineering',
    summary:
      'Curriculum and systems thesis covering cyclic state graphs, MCP/A2A protocol safety, scoped memory tiers, and regression harnesses.',
    readTime: 'Curriculum',
    status: 'Planned',
    dateLabel: 'Research Curriculum',
    publishedDate: 'Planned',
    pillar: '01 · Agent Engineering',
    author: 'SOPIN Education Initiative',
    sections: [
      {
        heading: 'Structured Engineering Tracks',
        paragraphs: [
          'Modules cover: (1) Authoring Typed Agents & Workflows, (2) Context & Multimodal RAG Provenance, (3) MCP/A2A Protocol Security, (4) ML & Gateway Model Routing, and (5) Enterprise Control & Evaluation Harnesses.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Browse Documentation', href: '/docs' },
      { label: 'Contact SOPIN Team', href: '/contact' },
    ],
  },
];
