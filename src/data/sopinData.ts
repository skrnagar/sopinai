import { NavCategory, RouteMeta, RoutePath } from '../types/navigation';

export const ROUTE_META: Record<RoutePath, RouteMeta> = {
  '/': {
    title: 'SOPIN — Build AI agents that deliver work.',
    description:
      'Unified AI Agent Engineering and Execution Platform by SONIL Group. Design, connect, execute, verify, and govern intelligent agents and workflows.',
    canonicalPath: '/',
  },
  '/platform': {
    title: 'Platform Overview — SOPIN',
    description:
      'Explore the SOPIN architecture: Agent Studio, Workflow Automation, Context and Memory, Model Gateway, Runtime, Evaluations, and Governance.',
    canonicalPath: '/platform',
  },
  '/studio': {
    title: 'SOPIN Studio — Visual & Code-First Agent Engineering',
    description:
      'Author multi-agent systems using Natural Language, Visual Workflow Builder, Advanced Agent Graph, or the TypeScript Developer SDK.',
    canonicalPath: '/studio',
  },
  '/workflow-automation': {
    title: 'Workflow Automation — SOPIN Flow',
    description:
      'Deterministic workflow orchestration with conditional routing, bounded retries, tool execution, and human-in-the-loop checkpoints.',
    canonicalPath: '/workflow-automation',
  },
  '/context': {
    title: 'Context & Memory — SOPIN Context',
    description:
      'Structured working memory, episodic session state, and grounded knowledge retrieval built for accountable agent execution.',
    canonicalPath: '/context',
  },
  '/developers': {
    title: 'Developers — API, SDK, MCP & A2A — SOPIN',
    description:
      'Build with typed SDKs, Model Context Protocol (MCP) bindings, Agent-to-Agent (A2A) interoperability, and extensible integration adapters.',
    canonicalPath: '/developers',
  },
  '/solutions': {
    title: 'Solutions — Enterprise & Domain Agent Architectures — SOPIN',
    description:
      'Reference architectures for Business Automation, AI Research, Software Engineering, Data and ML, and Enterprise AI governance.',
    canonicalPath: '/solutions',
  },
  '/resources': {
    title: 'Resources — Guides, Tutorials & Architecture Notes — SOPIN',
    description:
      'Technical guides, implementation tutorials, architecture blueprints, and learning modules from the SOPIN engineering team.',
    canonicalPath: '/resources',
  },
  '/pricing': {
    title: 'Early Access & Licensing Model — SOPIN',
    description:
      'Review SOPIN preview access, planned workspace tiers, and SONIL Group enterprise deployment pathways.',
    canonicalPath: '/pricing',
  },
  '/about': {
    title: 'About SOPIN & SONIL Group',
    description:
      'Learn about SOPIN, our engineering principles, and our mission under the SONIL Group to build verifiable AI execution infrastructure.',
    canonicalPath: '/about',
  },
  '/contact': {
    title: 'Contact — SOPIN & SONIL Group',
    description:
      'Connect with the SOPIN engineering team for design partner access, technical inquiries, or SONIL Group enterprise discussions.',
    canonicalPath: '/contact',
  },
  '/docs': {
    title: 'Documentation — SOPIN Developer Hub',
    description:
      'Quickstart guides, SDK references, MCP tool bindings, A2A protocol specifications, and runtime configuration documentation.',
    canonicalPath: '/docs',
  },
};

export const NAVIGATION_CATEGORIES: NavCategory[] = [
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        label: 'Overview',
        description: 'Unified agent engineering and execution architecture.',
        href: '/platform',
        sectionId: 'overview',
      },
      {
        label: 'Agent Studio',
        description: 'Natural language, visual canvas, and graph authoring.',
        href: '/studio',
      },
      {
        label: 'Workflow Automation',
        description: 'Deterministic DAG pipelines with SOPIN Flow.',
        href: '/workflow-automation',
      },
      {
        label: 'Context and Memory',
        description: 'Scoped working memory and grounded retrieval.',
        href: '/context',
      },
      {
        label: 'Model Gateway',
        description: 'Unified model routing, schemas, and fallback policy.',
        href: '/platform',
        sectionId: 'gateway',
      },
      {
        label: 'Runtime',
        description: 'Isolated execution engine for long-running work.',
        href: '/platform',
        sectionId: 'runtime',
      },
      {
        label: 'Evaluations',
        description: 'Regression suites and assertion harnesses.',
        href: '/platform',
        sectionId: 'evaluations',
        status: 'Planned',
      },
      {
        label: 'Governance',
        description: 'Policy boundaries, approvals, and audit trails.',
        href: '/platform',
        sectionId: 'governance',
        status: 'Planned',
      },
    ],
  },
  {
    id: 'solutions',
    label: 'Solutions',
    items: [
      {
        label: 'Business Automation',
        description: 'Structured operational triage and document routing.',
        href: '/solutions',
        sectionId: 'business-automation',
      },
      {
        label: 'AI Research',
        description: 'Multi-source synthesis with citation verification.',
        href: '/solutions',
        sectionId: 'ai-research',
      },
      {
        label: 'Software Engineering',
        description: 'Repository analysis, review, and test generation.',
        href: '/solutions',
        sectionId: 'software-engineering',
      },
      {
        label: 'Data and ML',
        description: 'Pipeline validation, SQL synthesis, and lineage checks.',
        href: '/solutions',
        sectionId: 'data-ml',
      },
      {
        label: 'Enterprise AI',
        description: 'Governed deployment topology for SONIL Group partners.',
        href: '/solutions',
        sectionId: 'enterprise-ai',
        status: 'Planned',
      },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    items: [
      {
        label: 'Documentation',
        description: 'Architecture specs, quickstarts, and schemas.',
        href: '/docs',
      },
      {
        label: 'API and SDK',
        description: 'Typed TypeScript and Python orchestration packages.',
        href: '/developers',
        sectionId: 'sdk',
      },
      {
        label: 'MCP and A2A',
        description: 'Native Model Context Protocol & Agent-to-Agent support.',
        href: '/developers',
        sectionId: 'protocols',
      },
      {
        label: 'Integrations',
        description: 'Structured connectors for repos, queues, and stores.',
        href: '/developers',
        sectionId: 'integrations',
      },
      {
        label: 'Open Source',
        description: 'Public protocol adapters and SDK roadmap.',
        href: '/developers',
        sectionId: 'open-source',
        status: 'Coming Soon',
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      {
        label: 'Blog',
        description: 'Engineering notes on agent reliability and runtime design.',
        href: '/resources',
        sectionId: 'blog',
      },
      {
        label: 'Guides',
        description: 'Architectural patterns for deterministic agent workflows.',
        href: '/resources',
        sectionId: 'guides',
      },
      {
        label: 'Tutorials',
        description: 'Step-by-step build walkthroughs using SOPIN Studio.',
        href: '/resources',
        sectionId: 'tutorials',
      },
      {
        label: 'Case Studies',
        description: 'Reference blueprints and upcoming cohort publications.',
        href: '/resources',
        sectionId: 'case-studies',
        status: 'Coming Soon',
      },
      {
        label: 'Academy',
        description: 'Structured curriculum for agent systems engineering.',
        href: '/resources',
        sectionId: 'academy',
        status: 'Planned',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    href: '/pricing',
  },
  {
    id: 'company',
    label: 'Company',
    href: '/about',
  },
];

export interface WorkflowNodeSpec {
  id: string;
  stage: string;
  title: string;
  module: string;
  protocol: string;
  summary: string;
  inputSample: string;
  outputSample: string;
  policyCheck: string;
}

export interface WorkflowScenario {
  id: string;
  name: string;
  domain: string;
  objective: string;
  sdkSnippet: string;
  nodes: WorkflowNodeSpec[];
}

export const WORKFLOW_SCENARIOS: WorkflowScenario[] = [
  {
    id: 'code-audit',
    name: 'Pull Request Verification',
    domain: 'Software Engineering',
    objective: 'Analyze diff scope, retrieve repository conventions, run static checks, and gate merge readiness.',
    sdkSnippet: `import { defineAgent, mcpTool, verify } from "@sopin/sdk";

export const prVerifier = defineAgent({
  name: "pr-verification-agent",
  context: { scope: "repository", index: "architecture-adr" },
  gateway: { route: "reasoning-structured", fallback: "deterministic-fast" },
  tools: [mcpTool("git.diff"), mcpTool("ci.testRunner")],
  verify: verify.schema("PullRequestReviewOutput"),
  govern: { requireApprovalOn: ["security-finding"] }
});`,
    nodes: [
      {
        id: 'trigger',
        stage: '01. Trigger',
        title: 'Diff Event Intake',
        module: 'SOPIN Flow',
        protocol: 'Webhook / Event Schema',
        summary: 'Normalizes repository diff payload and extracts changed module boundaries.',
        inputSample: '{ "repo": "core-runtime", "commit": "a84f2c", "files": 6 }',
        outputSample: '{ "scope": "sandbox-executor", "riskClass": "elevated" }',
        policyCheck: 'Payload signature verified · Tenant boundary enforced',
      },
      {
        id: 'context',
        stage: '02. Contextualize',
        title: 'ADR & Spec Retrieval',
        module: 'SOPIN Context',
        protocol: 'Vector + Graph Index',
        summary: 'Hydrates relevant architectural decision records and module invariants.',
        inputSample: '{ "query": "sandbox-executor invariants", "topK": 4 }',
        outputSample: '{ "citations": ["ADR-014", "SECURITY-SPEC-02"] }',
        policyCheck: 'Read-only repository context scope',
      },
      {
        id: 'gateway',
        stage: '03. Reason',
        title: 'Structured Code Review',
        module: 'SOPIN Gateway',
        protocol: 'Typed JSON Output',
        summary: 'Routes reasoning step to configured model profile with strict output schema.',
        inputSample: '{ "profile": "code-analysis", "schema": "ReviewFindings" }',
        outputSample: '{ "findings": 1, "severity": "medium", "line": 142 }',
        policyCheck: 'Token ceiling respected · Zero external prompt leakage',
      },
      {
        id: 'execute',
        stage: '04. Execute',
        title: 'Targeted Test Harness',
        module: 'SOPIN Runtime',
        protocol: 'MCP Tool Binding',
        summary: 'Executes scoped unit verification inside an isolated sandbox container.',
        inputSample: '{ "tool": "ci.runSuite", "target": "executor.spec.ts" }',
        outputSample: '{ "exitCode": 0, "assertions": "completed" }',
        policyCheck: 'Egress network disabled · Ephemeral filesystem',
      },
      {
        id: 'verify',
        stage: '05. Verify',
        title: 'Output Assertion Gate',
        module: 'SOPIN Evaluate',
        protocol: 'Deterministic Schema Check',
        summary: 'Validates that every finding cites an actual line range and test output.',
        inputSample: '{ "rule": "citations_must_resolve_to_diff" }',
        outputSample: '{ "verified": true, "schemaValid": true }',
        policyCheck: 'Grounded evidence assertion passed',
      },
      {
        id: 'govern',
        stage: '06. Govern',
        title: 'Checkpoint & Audit Record',
        module: 'SOPIN Control',
        protocol: 'Approval Policy',
        summary: 'Posts structured review artifact and pauses for maintainer sign-off if flagged.',
        inputSample: '{ "action": "publishReview", "requireHumanIf": "elevated" }',
        outputSample: '{ "state": "awaiting-maintainer-signoff" }',
        policyCheck: 'Immutable execution trace recorded (Planned)',
      },
    ],
  },
  {
    id: 'research-synthesis',
    name: 'Technical Research Synthesis',
    domain: 'AI Research',
    objective: 'Query approved literature indexes, cross-check claims, and compile a cited synthesis brief.',
    sdkSnippet: `import { defineWorkflow, step, a2aDelegate } from "@sopin/sdk";

export const researchBrief = defineWorkflow({
  name: "cited-research-brief",
  steps: [
    step.context("retrieveSources", { corpus: "technical-papers" }),
    a2aDelegate("crossVerifyClaims", { agent: "citation-auditor" }),
    step.verify("requireSourceGrounding", { minCitationsPerClaim: 1 })
  ]
});`,
    nodes: [
      {
        id: 'trigger',
        stage: '01. Trigger',
        title: 'Research Prompt Intake',
        module: 'SOPIN Studio',
        protocol: 'Typed Task Brief',
        summary: 'Parses research question into bounded sub-queries and source constraints.',
        inputSample: '{ "topic": "Deterministic tool retries in multi-agent graphs" }',
        outputSample: '{ "subQueries": 3, "allowedCorpora": ["arxiv-local", "internal-docs"] }',
        policyCheck: 'Allowed corpus whitelist enforced',
      },
      {
        id: 'context',
        stage: '02. Contextualize',
        title: 'Hybrid Corpus Retrieval',
        module: 'SOPIN Context',
        protocol: 'Semantic + Lexical',
        summary: 'Retrieves passage spans with immutable document identifiers and page offsets.',
        inputSample: '{ "queries": 3, "deduplicateBy": "docChecksum" }',
        outputSample: '{ "passages": 12, "uniqueDocuments": 5 }',
        policyCheck: 'Document classification filter applied',
      },
      {
        id: 'gateway',
        stage: '03. Reason',
        title: 'Comparative Synthesis',
        module: 'SOPIN Gateway',
        protocol: 'Multi-Model Route',
        summary: 'Synthesizes findings while preserving explicit claim-to-passage mapping.',
        inputSample: '{ "mode": "strict-citation", "temperature": 0.1 }',
        outputSample: '{ "sections": 4, "mappedClaims": 9 }',
        policyCheck: 'Low-variance synthesis profile active',
      },
      {
        id: 'execute',
        stage: '04. Execute',
        title: 'A2A Auditor Handoff',
        module: 'SOPIN Runtime',
        protocol: 'A2A Protocol',
        summary: 'Delegates claim-by-claim verification to a specialized citation-auditor agent.',
        inputSample: '{ "protocol": "A2A/1.0", "targetAgent": "citation-auditor" }',
        outputSample: '{ "unsupportedClaims": 0, "revisedSections": 1 }',
        policyCheck: 'Agent-to-agent capability token scoped',
      },
      {
        id: 'verify',
        stage: '05. Verify',
        title: 'Grounding Gate',
        module: 'SOPIN Evaluate',
        protocol: 'Factuality Check',
        summary: 'Rejects any summary paragraph lacking an indexed source span reference.',
        inputSample: '{ "assertion": "no_ungrounded_claims" }',
        outputSample: '{ "status": "verified", "coverage": "complete" }',
        policyCheck: 'Citation integrity check satisfied',
      },
      {
        id: 'govern',
        stage: '06. Govern',
        title: 'Export Brief Artifact',
        module: 'SOPIN Control',
        protocol: 'Artifact Registry',
        summary: 'Publishes Markdown and JSON brief with full source lineage.',
        inputSample: '{ "format": "markdown+json", "retainTrace": true }',
        outputSample: '{ "artifact": "brief-synthesis.md", "traceAttached": true }',
        policyCheck: 'Export policy compliant',
      },
    ],
  },
  {
    id: 'ops-triage',
    name: 'Operations Incident Triage',
    domain: 'Business Automation',
    objective: 'Classify incoming operational tickets, enrich with system state, and prepare gated remediation.',
    sdkSnippet: `import { defineGraph, humanGate, mcpTool } from "@sopin/sdk";

export const opsTriage = defineGraph({
  name: "ops-triage-graph",
  entry: "classifyTicket",
  tools: [mcpTool("ticket.read"), mcpTool("runbook.lookup")],
  gates: {
    remediate: humanGate({ role: "oncall-lead", timeoutMinutes: 15 })
  }
});`,
    nodes: [
      {
        id: 'trigger',
        stage: '01. Trigger',
        title: 'Queue Event Normalization',
        module: 'SOPIN Flow',
        protocol: 'Queue Listener',
        summary: 'Captures incoming operational report and strips sensitive PII fields before routing.',
        inputSample: '{ "source": "ops-queue", "category": "billing-sync" }',
        outputSample: '{ "ticketRef": "OPS-409", "redactedFields": ["email"] }',
        policyCheck: 'PII redaction rule executed pre-inference',
      },
      {
        id: 'context',
        stage: '02. Contextualize',
        title: 'Runbook & Prior State',
        module: 'SOPIN Context',
        protocol: 'Episodic + Knowledge',
        summary: 'Loads matching remediation runbooks and recent related service events.',
        inputSample: '{ "service": "ledger-worker", "window": "recent-events" }',
        outputSample: '{ "runbook": "RB-19-LEDGER-SYNC", "relatedEvents": 2 }',
        policyCheck: 'Read-only operational context',
      },
      {
        id: 'gateway',
        stage: '03. Reason',
        title: 'Root-Cause Classification',
        module: 'SOPIN Gateway',
        protocol: 'Constrained Enum Output',
        summary: 'Classifies incident domain and drafts parameterized remediation plan.',
        inputSample: '{ "allowedActions": ["retry-job", "escalate", "inspect-dlq"] }',
        outputSample: '{ "proposedAction": "inspect-dlq", "requiresApproval": true }',
        policyCheck: 'Action space constrained to approved runbook verbs',
      },
      {
        id: 'execute',
        stage: '04. Execute',
        title: 'Diagnostic Inspection',
        module: 'SOPIN Runtime',
        protocol: 'MCP Read Tool',
        summary: 'Queries dead-letter queue metadata without mutating production state.',
        inputSample: '{ "tool": "dlq.inspectMetadata", "batch": "ledger-sync" }',
        outputSample: '{ "stalledItems": 3, "errorCode": "TIMEOUT_UPSTREAM" }',
        policyCheck: 'Read-only tool permission enforced',
      },
      {
        id: 'verify',
        stage: '05. Verify',
        title: 'Runbook Compliance Check',
        module: 'SOPIN Evaluate',
        protocol: 'Policy Assertion',
        summary: 'Verifies proposed replay parameters fall inside safe batch limits.',
        inputSample: '{ "maxBatchSize": 10, "proposedBatchSize": 3 }',
        outputSample: '{ "withinBounds": true }',
        policyCheck: 'Parameter guardrails satisfied',
      },
      {
        id: 'govern',
        stage: '06. Govern',
        title: 'Human Sign-Off Gate',
        module: 'SOPIN Control',
        protocol: 'Human-in-the-Loop',
        summary: 'Suspends execution state until an authorized operator approves replay.',
        inputSample: '{ "approverRole": "oncall-lead", "action": "replay-3-items" }',
        outputSample: '{ "status": "paused-for-approval" }',
        policyCheck: 'State-changing action gated by RBAC',
      },
    ],
  },
];

export interface LifecycleStage {
  number: string;
  title: string;
  verb: string;
  summary: string;
  primitives: string[];
  outcome: string;
}

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    number: '01',
    title: 'Create',
    verb: 'Design',
    summary:
      'Author single agents or multi-agent graphs using natural language specifications, visual DAGs, cyclic state graphs, or typed code.',
    primitives: ['Natural Language Compiler', 'Visual Flow Canvas', 'Cyclic Agent Graph', 'TypeScript & Python SDK'],
    outcome: 'Versioned agent definitions stored as inspectable, diffable blueprints.',
  },
  {
    number: '02',
    title: 'Connect',
    verb: 'Connect',
    summary:
      'Bind agents to models, tools, data stores, and peer agents using open interoperability standards rather than brittle custom glue.',
    primitives: ['Model Context Protocol (MCP)', 'Agent-to-Agent (A2A)', 'Model Gateway Routing', 'Typed Webhook Triggers'],
    outcome: 'Portable tool and model interfaces that swap cleanly across providers.',
  },
  {
    number: '03',
    title: 'Contextualize',
    verb: 'Ground',
    summary:
      'Provide scoped working state, episodic session history, and versioned knowledge retrieval so agents operate on verified organizational context.',
    primitives: ['Scoped Working Memory', 'Episodic Session State', 'Hybrid Retrieval Pipelines', 'Citation Lineage'],
    outcome: 'Grounded reasoning steps with explicit provenance for every retrieved fact.',
  },
  {
    number: '04',
    title: 'Execute',
    verb: 'Execute',
    summary:
      'Run multi-step workflows and autonomous loops inside bounded runtime sandboxes with deterministic retries and checkpoint persistence.',
    primitives: ['Sandboxed Tool Execution', 'Durable Step Checkpoints', 'Idempotent Retry Policies', 'Parallel Fan-Out'],
    outcome: 'Long-running tasks that resume cleanly after interruptions or approvals.',
  },
  {
    number: '05',
    title: 'Verify',
    verb: 'Verify',
    summary:
      'Validate agent outputs against structural schemas, grounding assertions, and regression suites before results leave the workflow.',
    primitives: ['Typed Schema Enforcement', 'Grounding Assertions', 'Trace Replay (Planned)', 'Eval Harnesses (Planned)'],
    outcome: 'Confidence built on deterministic checks rather than prompt optimism.',
  },
  {
    number: '06',
    title: 'Govern',
    verb: 'Govern',
    summary:
      'Enforce least-privilege tool access, human approval gates for state-changing actions, and structured audit trails across teams.',
    primitives: ['Human-in-the-Loop Gates', 'Scoped Tool Permissions', 'RBAC Policy Engine (Planned)', 'Audit Ledger (Planned)'],
    outcome: 'Accountable autonomy aligned with enterprise security boundaries.',
  },
];

export interface CreationExperience {
  id: string;
  label: string;
  audience: string;
  headline: string;
  description: string;
  highlights: string[];
  codeOrSpec: string;
  artifactType: string;
}

export const CREATION_EXPERIENCES: CreationExperience[] = [
  {
    id: 'natural-language',
    label: 'Natural Language',
    audience: 'Product & Operations Builders',
    headline: 'Describe the work, compile a structured specification.',
    description:
      'Start from plain-language intent. SOPIN Studio translates goals, constraints, and approval rules into an inspectable agent graph that engineers can review and refine.',
    highlights: [
      'Compiles intent into typed input/output schemas',
      'Suggests least-privilege MCP tool bindings',
      'Produces editable workflow graphs, never opaque black boxes',
    ],
    artifactType: 'Compiled Intent Spec',
    codeOrSpec: `Goal: "Triage incoming vendor compliance questionnaires against our approved security policy index."
Constraints:
  - Cite exact policy section ID for every answer
  - Escalate unanswered questions to compliance-lead
  - Do not fabricate commitments outside approved corpus
Generated Graph:
  intake -> retrieve_policy_sections -> draft_responses -> verify_citations -> human_review_gate`,
  },
  {
    id: 'visual-builder',
    label: 'Visual Workflow Builder',
    audience: 'Automation Architects',
    headline: 'Deterministic control flow with visual clarity.',
    description:
      'Compose sequential pipelines, conditional branches, parallel fan-outs, and human approval checkpoints in SOPIN Flow with inspectable state transitions at every edge.',
    highlights: [
      'Explicit branching on structured model or tool outputs',
      'Per-node timeout, retry, and fallback configuration',
      'Built-in pause/resume gates for human review',
    ],
    artifactType: 'SOPIN Flow Blueprint',
    codeOrSpec: `flow: vendor-intake-pipeline
nodes:
  - id: parse_document      type: tool.extract
  - id: classify_scope      type: gateway.structured
  - id: route_high_risk     type: condition (risk == "high")
    -> true:  human_gate("legal-review")
    -> false: auto_summary("ops-archive")`,
  },
  {
    id: 'agent-graph',
    label: 'Advanced Agent Graph',
    audience: 'AI Systems Engineers',
    headline: 'Cyclic state machines and multi-agent coordination.',
    description:
      'Model iterative reasoning loops, planner-worker delegation, and A2A handoffs with explicit termination bounds, shared state schemas, and cycle limits.',
    highlights: [
      'Bounded cyclic execution with max-step guardrails',
      'Shared typed scratchpad across collaborating agents',
      'Native A2A protocol routing between specialized roles',
    ],
    artifactType: 'State Graph Topology',
    codeOrSpec: `graph: research-synthesis-loop
state: { query: string, drafts: Section[], citations: Citation[], verified: boolean }
edges:
  planner    -> researcher   [when: missing_evidence]
  researcher -> verifier     [always]
  verifier   -> planner      [when: !verified && step < 6]
  verifier   -> finalize     [when: verified]`,
  },
  {
    id: 'developer-sdk',
    label: 'Developer SDK',
    audience: 'Application & Platform Engineers',
    headline: 'Code-first orchestration with full type safety.',
    description:
      'Author, test, and version agents alongside application code in Git. Every visual graph exports cleanly to the SDK, and every SDK definition renders in Studio.',
    highlights: [
      'First-class TypeScript and Python SDK ergonomics',
      'Local CLI runner for deterministic unit testing',
      'Bidirectional sync between code and visual studio',
    ],
    artifactType: 'TypeScript SDK',
    codeOrSpec: `import { SopinClient, z } from "@sopin/sdk";

const client = new SopinClient();
const ContractSummary = z.object({
  counterparty: z.string(),
  obligations: z.array(z.string()),
  requiresEscalation: z.boolean()
});

export const agent = client.agent("contract-reviewer", {
  outputSchema: ContractSummary,
  maxSteps: 8,
  tools: ["context.searchPolicies", "mcp.docParser"]
});`,
  },
];

export interface EcosystemModule {
  id: string;
  name: string;
  role: string;
  summary: string;
  href: RoutePath;
  sectionId?: string;
  status: 'Core Architecture' | 'Planned';
  capabilities: string[];
}

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: 'studio',
    name: 'SOPIN Studio',
    role: 'Authoring Environment',
    summary: 'Unified workspace bridging natural language authoring, visual DAG editing, cyclic agent graphs, and code.',
    href: '/studio',
    status: 'Core Architecture',
    capabilities: ['Multi-mode editor', 'Schema inspector', 'Graph-to-SDK sync'],
  },
  {
    id: 'flow',
    name: 'SOPIN Flow',
    role: 'Workflow Engine',
    summary: 'Deterministic orchestration for branching pipelines, parallel execution, retries, and durable checkpoints.',
    href: '/workflow-automation',
    status: 'Core Architecture',
    capabilities: ['Conditional routing', 'Idempotent retries', 'Human-in-the-loop'],
  },
  {
    id: 'context',
    name: 'SOPIN Context',
    role: 'Memory & Retrieval',
    summary: 'Structured working memory, session state, and grounded document indexing with citation lineage.',
    href: '/context',
    status: 'Core Architecture',
    capabilities: ['Scoped memory tiers', 'Hybrid retrieval', 'Provenance tracking'],
  },
  {
    id: 'runtime',
    name: 'SOPIN Runtime',
    role: 'Execution Sandbox',
    summary: 'Isolated compute environment for executing tools, code interpreters, and long-running agent graphs safely.',
    href: '/platform',
    sectionId: 'runtime',
    status: 'Core Architecture',
    capabilities: ['Container isolation', 'Bounded egress', 'Durable state recovery'],
  },
  {
    id: 'gateway',
    name: 'SOPIN Gateway',
    role: 'Model Router',
    summary: 'Single control point for multi-provider model routing, structured output enforcement, and fallback policies.',
    href: '/platform',
    sectionId: 'gateway',
    status: 'Core Architecture',
    capabilities: ['Provider abstraction', 'Schema enforcement', 'Policy routing'],
  },
  {
    id: 'observe',
    name: 'SOPIN Observe',
    role: 'Execution Tracing',
    summary: 'Step-by-step trace inspection across prompts, tool calls, context chunks, and agent handoffs.',
    href: '/platform',
    sectionId: 'evaluations',
    status: 'Planned',
    capabilities: ['Span-level traces', 'State diffing', 'Deterministic replay'],
  },
  {
    id: 'evaluate',
    name: 'SOPIN Evaluate',
    role: 'Verification Harnesses',
    summary: 'Automated regression datasets, schema assertions, and grounding checks prior to workflow promotion.',
    href: '/platform',
    sectionId: 'evaluations',
    status: 'Planned',
    capabilities: ['Golden test sets', 'Assertion gates', 'Prompt diff comparisons'],
  },
  {
    id: 'control',
    name: 'SOPIN Control',
    role: 'Governance & Policy',
    summary: 'Role-based permissions, approval workflows, tool allowlists, and auditable execution policies.',
    href: '/platform',
    sectionId: 'governance',
    status: 'Planned',
    capabilities: ['RBAC & tool scopes', 'Approval queues', 'Compliance audit log'],
  },
];

export interface UseCaseDomain {
  id: string;
  label: string;
  headline: string;
  description: string;
  topology: string;
  tools: string[];
  verification: string;
  humanCheckpoint: string;
}

export const USE_CASE_DOMAINS: UseCaseDomain[] = [
  {
    id: 'research',
    label: 'Research',
    headline: 'Multi-source synthesis with strict citation provenance.',
    description:
      'Coordinate planner and researcher agents over curated document repositories to produce structured technical or market briefs where every claim maps to source passages.',
    topology: 'Planner -> Parallel Retrieval -> Claim Auditor (A2A) -> Synthesis',
    tools: ['SOPIN Context Hybrid Index', 'Document Parser (MCP)', 'Citation Verifier'],
    verification: 'Every generated assertion must resolve to a valid document checksum and span.',
    humanCheckpoint: 'Editorial review of final brief prior to distribution.',
  },
  {
    id: 'reporting',
    label: 'Reporting',
    headline: 'Repeatable, schema-verified operational and executive briefs.',
    description:
      'Automate recurring structured reporting by pulling from approved warehouse views, validating anomalies, and formatting consistent narrative summaries.',
    topology: 'Schedule Trigger -> SQL Query (Read-Only) -> Variance Check -> Brief Composer',
    tools: ['Warehouse Read Connector', 'Schema Validator', 'Document Formatter'],
    verification: 'Numeric figures in narrative prose are cross-checked against raw query outputs.',
    humanCheckpoint: 'Optional sign-off gate before publishing to stakeholder channels.',
  },
  {
    id: 'operations',
    label: 'Operations',
    headline: 'Gated ticket triage and runbook-backed remediation.',
    description:
      'Classify incoming operational requests, redact sensitive fields pre-inference, match against approved runbooks, and prepare safe remediation actions.',
    topology: 'Queue Intake -> PII Filter -> Runbook Lookup -> Diagnostic Read -> Approval Gate',
    tools: ['Ticket Queue MCP', 'Runbook Context Store', 'Human Approval Hook'],
    verification: 'Proposed actions constrained strictly to pre-approved runbook enumerations.',
    humanCheckpoint: 'Mandatory operator confirmation before any state-mutating tool executes.',
  },
  {
    id: 'software-engineering',
    label: 'Software Engineering',
    headline: 'Repository-aware analysis, review, and test scaffolding.',
    description:
      'Equip engineering workflows with architectural context, isolated test execution sandboxes, and structured diff analysis without granting unrestricted write access.',
    topology: 'PR Webhook -> Architecture Context -> Static Analysis -> Sandbox Test -> Review',
    tools: ['Git Diff MCP', 'Isolated Test Runner', 'ADR Knowledge Index'],
    verification: 'Findings validated against exact file paths, line ranges, and test exit codes.',
    humanCheckpoint: 'Maintainer owns final merge decision and code acceptance.',
  },
  {
    id: 'data-intelligence',
    label: 'Data Intelligence',
    headline: 'Schema-grounded querying, lineage checks, and anomaly triage.',
    description:
      'Translate natural language analytical questions into inspected, read-only queries bounded by catalog metadata and row-level governance rules.',
    topology: 'Catalog Schema Load -> Query Synthesis -> Dry-Run Explain -> Execution -> Summary',
    tools: ['Schema Registry MCP', 'Read-Only Query Engine', 'Explain-Plan Gate'],
    verification: 'Dry-run cost and table access check must pass before query execution.',
    humanCheckpoint: 'Data steward approval for newly discovered cross-domain joins.',
  },
];

export interface ResourceEntry {
  id: string;
  category: 'Blog' | 'Guides' | 'Tutorials' | 'Case Studies' | 'Academy';
  title: string;
  summary: string;
  readTime: string;
  status: 'Available' | 'Coming Soon' | 'Planned';
  dateLabel: string;
}

export const RESOURCE_ENTRIES: ResourceEntry[] = [
  {
    id: 'arch-unifying-studio-runtime',
    category: 'Blog',
    title: 'Why Agent Engineering Requires a Unified Runtime and Graph Spec',
    summary:
      'Exploring why separating prompt prototyping from workflow execution creates fragile systems, and how SOPIN unifies authoring with sandboxed execution.',
    readTime: '6 min read',
    status: 'Available',
    dateLabel: 'Engineering Note',
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
  },
];
