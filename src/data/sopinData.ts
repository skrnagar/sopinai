import { NavCategory, RouteMeta, RoutePath, StaticRoutePath } from '../types/navigation';

export const ROUTE_META: Record<StaticRoutePath, RouteMeta> = {
  '/': {
    title: 'SOPIN — Build AI agents that deliver work.',
    description:
      'Unified AI Agent Engineering and Execution Platform by SONIL Group. Design, connect, execute, verify, and govern intelligent agents and workflows.',
    canonicalPath: '/',
  },
  '/platform': {
    title: 'Platform Overview — SOPIN',
    description:
      'Explore the SOPIN architecture: Studio, Flow, Context, Graph, Gateway, Runtime, Observe, Evaluate, Control, Cloud, and Enterprise.',
    canonicalPath: '/platform',
  },
  '/studio': {
    title: 'SOPIN Studio — Visual & Code-First Agent Engineering',
    description:
      'Author multi-agent systems using Natural Language, Visual Workflow Builder, Advanced Agent Graph, or the TypeScript Developer SDK.',
    canonicalPath: '/studio',
  },
  '/flow': {
    title: 'SOPIN Flow — Deterministic AI Workflow Automation',
    description:
      'Deterministic workflow orchestration with conditional routing, bounded retries, tool execution, and human-in-the-loop checkpoints.',
    canonicalPath: '/flow',
  },
  '/workflow-automation': {
    title: 'Workflow Automation — SOPIN Flow',
    description:
      'Deterministic workflow orchestration with conditional routing, bounded retries, tool execution, and human-in-the-loop checkpoints.',
    canonicalPath: '/workflow-automation',
  },
  '/decisions': {
    title: 'SOPIN Decisions — Make Business Logic Executable | SOPIN',
    description:
      'Deterministic business rules, decision tables, rulesets, scorecards, and rule chains integrated with SOPIN Flow, Studio, Graph, and Control.',
    canonicalPath: '/decisions',
  },
  '/context': {
    title: 'Context & Memory — SOPIN Context',
    description:
      'Structured working memory, episodic session state, and grounded knowledge retrieval built for accountable agent execution.',
    canonicalPath: '/context',
  },
  '/graph': {
    title: 'SOPIN Graph — Cyclic Multi-Agent & A2A Orchestration',
    description:
      'Stateful cyclic graphs with shared state schemas, bounded superstep limits, and Agent-to-Agent (A2A) delegation.',
    canonicalPath: '/graph',
  },
  '/runtime': {
    title: 'SOPIN Runtime — Sandboxed & Durable Execution',
    description:
      'Isolated ephemeral sandboxes with explicit network egress allowlists and durable checkpoint persistence.',
    canonicalPath: '/runtime',
  },
  '/gateway': {
    title: 'SOPIN Gateway — Unified Model, Multimodal & MCP Router',
    description:
      'Vendor-neutral model discovery, multimodal routing, custom ML serving, schema enforcement, and pre-inference PII redaction.',
    canonicalPath: '/gateway',
  },
  '/observe': {
    title: 'SOPIN Observe — Execution Tracing & Telemetry (Planned)',
    description:
      'OpenTelemetry span waterfalls, graph state diffs, 30-day reliability charts, and deterministic replay.',
    canonicalPath: '/observe',
  },
  '/evaluate': {
    title: 'SOPIN Evaluate — Automated Verification Harnesses (Planned)',
    description:
      'Golden datasets, deterministic assertions, grounding checks, and side-by-side model & ML benchmarks.',
    canonicalPath: '/evaluate',
  },
  '/control': {
    title: 'SOPIN Control — Enterprise Governance & RBAC (Planned)',
    description:
      'Organization RBAC, tool capability allowlists, human approval queues, spend ceilings, and audit logs.',
    canonicalPath: '/control',
  },
  '/cloud': {
    title: 'SOPIN Cloud — Managed Agent Infrastructure (Planned)',
    description:
      'Zero-ops managed workspaces, elastic runtime sandboxes, and BYOK or managed Gateway routing.',
    canonicalPath: '/cloud',
  },
  '/enterprise': {
    title: 'SOPIN Enterprise — Private VPC & Self-Hosted Infrastructure',
    description:
      'Private VPC, BYOC, and air-gapped enterprise AI deployments with SSO and SONIL Group engineering onboarding.',
    canonicalPath: '/enterprise',
  },
  '/security': {
    title: 'Trust & Security Center — SOPIN & SONIL Group',
    description:
      'Architectural security posture covering sandboxing, RBAC, KMS secrets vaulting, PII redaction, tenant isolation, and privacy.',
    canonicalPath: '/security',
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
      'Reference architectures for Enterprise AI Automation, Intelligent Knowledge Operations, Multi-Agent Workflows, Business Decision Automation, Developer Operations, and Governed Execution.',
    canonicalPath: '/solutions',
  },
  '/research': {
    title: 'Research & Insights — AI Research, Engineering & Case Studies — SOPIN',
    description:
      'Original AI systems research, engineering guides, and transparent implementation notes from SOPIN and SONIL Group.',
    canonicalPath: '/research',
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
      'Learn about SOPIN, our vision and mission, engineering principles, and SONIL Group stewardship.',
    canonicalPath: '/about',
  },
  '/contact': {
    title: 'Contact — SOPIN & SONIL Group',
    description:
      'Connect with the SOPIN engineering team for design partner access, technical inquiries, or SONIL Group enterprise discussions.',
    canonicalPath: '/contact',
  },
  '/legal': {
    title: 'Legal, Privacy & Governance Policies — SOPIN · SONIL Group',
    description:
      'Privacy notice, terms of platform preview use, data residency commitments, and responsible AI execution principles for SOPIN under SONIL Group.',
    canonicalPath: '/legal',
  },
  '/docs': {
    title: 'Documentation — SOPIN Developer Hub',
    description:
      'Quickstart guides, SDK references, MCP tool bindings, A2A protocol specifications, Decisions contracts, and runtime configuration documentation.',
    canonicalPath: '/docs',
  },
  '/app': {
    title: 'SOPIN Workspace — Mobile-First AI Agent Studio & Execution',
    description:
      'Interactive mobile-first SOPIN workspace prototype: build agents, design workflows, inspect execution timelines, manage knowledge, and govern permissions.',
    canonicalPath: '/app',
    robots: 'noindex, nofollow',
  },
};

export const NAVIGATION_CATEGORIES: NavCategory[] = [
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        label: 'Platform Overview',
        description: 'Unified architecture connecting Studio through Control.',
        href: '/platform',
      },
      {
        label: 'SOPIN Studio',
        description: 'Visual, natural-language, and SDK authoring workspace.',
        href: '/studio',
      },
      {
        label: 'SOPIN Flow',
        description: 'Deterministic DAG workflows, retries & human gates.',
        href: '/flow',
      },
      {
        label: 'SOPIN Context',
        description: 'Three-tier memory & grounded knowledge retrieval.',
        href: '/context',
      },
      {
        label: 'SOPIN Graph',
        description: 'Bounded cyclic multi-agent & A2A state machines.',
        href: '/graph',
      },
      {
        label: 'SOPIN Runtime',
        description: 'Isolated ephemeral sandboxes & durable checkpoints.',
        href: '/runtime',
      },
      {
        label: 'SOPIN Gateway',
        description: 'Model, multimodal, ML registry & MCP router.',
        href: '/gateway',
      },
      {
        label: 'SOPIN Observe',
        description: 'Span waterfalls, state diffs & telemetry.',
        href: '/observe',
        status: 'Planned',
      },
      {
        label: 'SOPIN Evaluate',
        description: 'Regression datasets & grounding assertions.',
        href: '/evaluate',
        status: 'Planned',
      },
      {
        label: 'SOPIN Control',
        description: 'RBAC policies, spend caps & approval queues.',
        href: '/control',
        status: 'Planned',
      },
      {
        label: 'SOPIN Decisions',
        description: 'Deterministic business rules, tables, scoring & chains.',
        href: '/decisions',
      },
      {
        label: 'SOPIN Enterprise',
        description: 'Private VPC, BYOC & SONIL Group deployments.',
        href: '/enterprise',
        status: 'Roadmap',
      },
    ],
  },
  {
    id: 'solutions',
    label: 'Solutions',
    items: [
      {
        label: 'Enterprise AI Automation',
        description: 'Structured operational triage and end-to-end routing.',
        href: '/solutions',
        sectionId: 'business-automation',
      },
      {
        label: 'Intelligent Knowledge Operations',
        description: 'OCR, schema extraction & checksum-backed RAG synthesis.',
        href: '/solutions',
        sectionId: 'document-intelligence',
      },
      {
        label: 'Multi-Agent Workflows',
        description: 'Bounded supervisor-worker & A2A topologies.',
        href: '/solutions',
        sectionId: 'multi-agent',
      },
      {
        label: 'Business Decision Automation',
        description: 'Deterministic rule tables, chains, and explainable scorecards.',
        href: '/decisions',
      },
      {
        label: 'AI-Powered Developer Operations',
        description: 'Repository analysis, review, and sandboxed CI verification.',
        href: '/solutions',
        sectionId: 'software-engineering',
      },
      {
        label: 'Governed Enterprise Execution',
        description: 'RBAC policies, human gates & private VPC topology.',
        href: '/solutions',
        sectionId: 'enterprise-ai',
        status: 'Planned',
      },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    items: [
      {
        label: 'All Research & Insights',
        description: 'Explore SOPIN publications across research and engineering.',
        href: '/research',
      },
      {
        label: 'Research',
        description: 'Agent architecture, emerging AI systems, and verification theory.',
        href: '/research',
        sectionId: 'research',
      },
      {
        label: 'Engineering',
        description: 'Implementation tutorials, deterministic patterns, and guides.',
        href: '/research',
        sectionId: 'engineering',
      },
      {
        label: 'Case Studies',
        description: 'Transparent architecture publications and cohort notes.',
        href: '/research',
        sectionId: 'case-studies',
        status: 'Coming Soon',
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      {
        label: 'Resource Library',
        description: 'Architecture notes, guides, and step-by-step tutorials.',
        href: '/resources',
      },
      {
        label: 'API & SDK Hub',
        description: 'Typed TypeScript & Python SDKs, MCP, and A2A specs.',
        href: '/developers',
      },
      {
        label: 'SOPIN Cloud & Access',
        description: 'Preview pathways and deployment architecture.',
        href: '/pricing',
      },
      {
        label: 'Trust & Security Center',
        description: 'Sandboxing, RBAC, PII redaction, and data isolation.',
        href: '/security',
      },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    items: [
      {
        label: 'About SOPIN',
        description: 'Vision, engineering thesis, and SONIL Group stewardship.',
        href: '/about',
      },
      {
        label: 'Trust & Security Center',
        description: 'Sandboxing, RBAC, credential vaulting, and data privacy.',
        href: '/security',
      },
      {
        label: 'SOPIN Enterprise',
        description: 'Private VPC, BYOC, and self-hosted architecture.',
        href: '/enterprise',
        status: 'Roadmap',
      },
      {
        label: 'Contact SONIL Group',
        description: 'Design partner intake, SDK access, and enterprise inquiries.',
        href: '/contact',
      },
    ],
  },
  {
    id: 'docs',
    label: 'Docs',
    href: '/docs',
  },
];

export interface ProductSurfaceSummary {
  id: 'studio' | 'flow' | 'context' | 'graph' | 'runtime' | 'gateway' | 'observe' | 'evaluate' | 'control' | 'decisions';
  index: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  purpose: string;
  href: RoutePath;
  status: 'Core Architecture' | 'Planned';
  highlights: string[];
}

export const PRODUCT_SURFACES_10: ProductSurfaceSummary[] = [
  {
    id: 'studio',
    index: '01',
    name: 'SOPIN Studio',
    category: 'Authoring Workspace',
    tagline: 'Bridge natural language, visual graphs, and typed code in one workbench.',
    description:
      'Design agents and multi-step systems visually or in TypeScript without translation loss between prototyping and production engineering.',
    purpose: 'Turns plain-language intent, visual graphs, and SDK code into one version-controlled blueprint.',
    href: '/studio',
    status: 'Core Architecture',
    highlights: ['Visual & code-first parity', 'Schema & tool inspector', 'AI-assisted draft specs'],
  },
  {
    id: 'flow',
    index: '02',
    name: 'SOPIN Flow',
    category: 'Workflow Orchestration',
    tagline: 'Deterministic DAG pipelines with branching, retries, and human checkpoints.',
    description:
      'Orchestrate structured pipelines combining model inference, Decision Nodes, MCP tools, dead-letter paths, and pause-and-resume human approvals.',
    purpose: 'Eliminates fragile webhook glue by making branching, retries, and pauses explicit.',
    href: '/flow',
    status: 'Core Architecture',
    highlights: ['Conditional typed routing', 'Native Decision Nodes', 'Durable human checkpoints'],
  },
  {
    id: 'context',
    index: '03',
    name: 'SOPIN Context',
    category: 'Memory & Retrieval',
    tagline: 'Three-tier memory isolation and grounded retrieval with citation lineage.',
    description:
      'Separate ephemeral run scratchpads, episodic workspace history, and versioned knowledge corpora with immutable chunk checksums.',
    purpose: 'Ensures every agent operates on scoped, verifiable facts rather than stuffed prompts.',
    href: '/context',
    status: 'Core Architecture',
    highlights: ['Working / episodic / corpus tiers', 'Pre-retrieval ACL filters', 'SHA-256 citation provenance'],
  },
  {
    id: 'graph',
    index: '04',
    name: 'SOPIN Graph',
    category: 'Multi-Agent State',
    tagline: 'Bounded cyclic state machines and Agent-to-Agent (A2A) peer collaboration.',
    description:
      'Coordinate planner, researcher, and verifier agents over shared typed state with hard superstep ceilings and signed A2A handoffs.',
    purpose: 'Enables iterative reasoning and peer delegation without unbounded autonomous loops.',
    href: '/graph',
    status: 'Core Architecture',
    highlights: ['Shared typed graph reducers', 'Hard maxSteps loop guardrails', 'Signed A2A envelopes'],
  },
  {
    id: 'runtime',
    index: '05',
    name: 'SOPIN Runtime',
    category: 'Sandboxed Execution',
    tagline: 'Isolated ephemeral sandboxes and durable step checkpoints.',
    description:
      'Execute untrusted scripts, Python ML transforms, and MCP tool servers inside read-only containers with strict egress allowlists.',
    purpose: 'Protects host infrastructure and persists execution state across long-running pauses.',
    href: '/runtime',
    status: 'Core Architecture',
    highlights: ['Ephemeral micro-sandboxes', 'Egress disabled by default', 'Idempotent checkpoint recovery'],
  },
  {
    id: 'gateway',
    index: '06',
    name: 'SOPIN Gateway',
    category: 'Model & Tool Routing',
    tagline: 'Unified control plane for frontier LLMs, open-weight models, ML & MCP.',
    description:
      'Route text, vision, document, audio, and custom ML inference through strict JSON schema validation, failover, and pre-inference PII redaction.',
    purpose: 'Prevents single-vendor lock-in and enforces data sanitization before external inference.',
    href: '/gateway',
    status: 'Core Architecture',
    highlights: ['Pre-inference PII redaction', 'Strict schema enforcement', 'Custom ML registry serving'],
  },
  {
    id: 'observe',
    index: '07',
    name: 'SOPIN Observe',
    category: 'Observability',
    tagline: 'End-to-end execution traces, superstep diffs, and reliability telemetry.',
    description:
      'Inspect span waterfalls across Flow triggers, Context lookups, Gateway calls, Decision evaluations, and MCP outputs in one unified timeline.',
    purpose: 'Makes multi-step agent failures and latency bottlenecks immediately diagnosable.',
    href: '/observe',
    status: 'Planned',
    highlights: ['OpenTelemetry span waterfalls', 'Graph superstep state diffs', '30-day execution telemetry'],
  },
  {
    id: 'evaluate',
    index: '08',
    name: 'SOPIN Evaluate',
    category: 'Quality & Regression',
    tagline: 'Automated regression harnesses and side-by-side model benchmarking.',
    description:
      'Test prompt edits, retrieval indexes, and candidate model routes against curated golden datasets using deterministic and grounding assertions.',
    purpose: 'Replaces manual spot-checking with repeatable verification before production promotion.',
    href: '/evaluate',
    status: 'Planned',
    highlights: ['Golden trace datasets', 'Grounding & schema checks', 'Model & ML benchmarking'],
  },
  {
    id: 'control',
    index: '09',
    name: 'SOPIN Control',
    category: 'Governance & RBAC',
    tagline: 'Organization RBAC, tool allowlists, spend ceilings, and approval queues.',
    description:
      'Enforce out-of-band permissions, workspace budgets, and human sign-off queues across every agent, workflow, and external integration.',
    purpose: 'Ensures agents cannot prompt-inject around enterprise access or spend boundaries.',
    href: '/control',
    status: 'Planned',
    highlights: ['Out-of-band RBAC policy', 'Read/write MCP allowlists', 'Immutable audit exports'],
  },
  {
    id: 'decisions',
    index: '10',
    name: 'SOPIN Decisions',
    category: 'Decision Automation',
    tagline: 'Make business logic executable with deterministic rules, tables & scorecards.',
    description:
      'Author IF/ELSE rules, multi-hit decision tables, ordered rulesets, sequential rule chains, and weighted scorecards invoked natively in Flow and APIs.',
    purpose: 'Keeps binding pricing, eligibility, and SLA logic 100% deterministic—never left to LLM guesswork.',
    href: '/decisions',
    status: 'Core Architecture',
    highlights: ['Rule Builder & Decision Tables', 'Chains, Rulesets & Scorecards', 'Versioned simulation & traces'],
  },
];

export const LIFECYCLE_5_STAGES = [
  {
    step: '01',
    title: 'Design',
    headline: 'Author blueprints visually or in code',
    description:
      'Define agents, workflows, decision tables, and typed schemas in SOPIN Studio, Flow, and Decisions.',
    surfaces: ['Studio', 'Flow', 'Decisions'],
  },
  {
    step: '02',
    title: 'Connect',
    headline: 'Bind models, context & MCP tools',
    description:
      'Wire frontier or self-hosted models via Gateway, scoped corpora via Context, and least-privilege MCP servers.',
    surfaces: ['Gateway', 'Context', 'Graph'],
  },
  {
    step: '03',
    title: 'Execute',
    headline: 'Run inside sandboxed checkpoints',
    description:
      'Execute multi-step graphs and deterministic rules inside isolated sandboxes with durable state recovery.',
    surfaces: ['Runtime', 'Flow', 'Graph'],
  },
  {
    step: '04',
    title: 'Verify',
    headline: 'Inspect traces & run regressions',
    description:
      'Validate structured outputs against schemas, source checksums, and golden evaluation suites.',
    surfaces: ['Observe', 'Evaluate', 'Decisions'],
  },
  {
    step: '05',
    title: 'Govern',
    headline: 'Enforce RBAC, budgets & sign-off',
    description:
      'Gate elevated actions behind human approvals, workspace spend caps, and auditable policy rules.',
    surfaces: ['Control', 'Enterprise'],
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
    href: '/flow',
    status: 'Core Architecture',
    capabilities: ['Conditional routing', 'Decision Nodes', 'Human-in-the-loop'],
  },
  {
    id: 'decisions',
    name: 'SOPIN Decisions',
    role: 'Decision Automation',
    summary: 'Executable business rules, decision tables, rulesets, scorecards, and rule chains with full execution traces.',
    href: '/decisions',
    status: 'Core Architecture',
    capabilities: ['Rule Builder & Tables', 'Scoring & Chains', 'Versioned Simulation'],
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
    id: 'graph',
    name: 'SOPIN Graph',
    role: 'Cyclic State Engine',
    summary: 'Bounded cyclic multi-agent graphs supporting planner-verifier loops and A2A peer handoffs.',
    href: '/graph',
    status: 'Core Architecture',
    capabilities: ['Shared state schema', 'maxSteps loop caps', 'A2A handoffs'],
  },
  {
    id: 'runtime',
    name: 'SOPIN Runtime',
    role: 'Execution Sandbox',
    summary: 'Isolated compute environment for executing tools, code interpreters, and long-running agent graphs safely.',
    href: '/runtime',
    status: 'Core Architecture',
    capabilities: ['Container isolation', 'Bounded egress', 'Durable state recovery'],
  },
  {
    id: 'gateway',
    name: 'SOPIN Gateway',
    role: 'Model & ML Router',
    summary: 'Single control point for multi-provider LLMs, multimodal parsing, custom ML models, and schema enforcement.',
    href: '/gateway',
    status: 'Core Architecture',
    capabilities: ['Provider abstraction', 'Schema enforcement', 'ML registry routing'],
  },
  {
    id: 'observe',
    name: 'SOPIN Observe',
    role: 'Execution Tracing',
    summary: 'Step-by-step trace inspection across prompts, tool calls, context chunks, and 30-day performance trends.',
    href: '/observe',
    status: 'Planned',
    capabilities: ['Span-level traces', 'State diffing', 'Deterministic replay'],
  },
  {
    id: 'evaluate',
    name: 'SOPIN Evaluate',
    role: 'Verification Harnesses',
    summary: 'Automated regression datasets, schema assertions, and ML/LLM benchmarks prior to workflow promotion.',
    href: '/evaluate',
    status: 'Planned',
    capabilities: ['Golden test sets', 'Assertion gates', 'Model benchmarking'],
  },
  {
    id: 'control',
    name: 'SOPIN Control',
    role: 'Governance & Policy',
    summary: 'Role-based permissions, approval workflows, tool allowlists, spend budgets, and auditable execution policies.',
    href: '/control',
    status: 'Planned',
    capabilities: ['RBAC & tool scopes', 'Approval queues', 'Compliance audit log'],
  },
  {
    id: 'cloud',
    name: 'SOPIN Cloud',
    role: 'Managed Infrastructure',
    summary: 'Zero-ops multi-region cloud hosting for Studio workspaces, Context indexes, and elastic Runtime sandboxes.',
    href: '/cloud',
    status: 'Planned',
    capabilities: ['Serverless sandboxes', 'BYOK vaulting', 'Workspace isolation'],
  },
  {
    id: 'enterprise',
    name: 'SOPIN Enterprise',
    role: 'Private VPC & BYOC',
    summary: 'Self-hosted or private VPC deployment topology with SSO, SAML, and SONIL Group engineering partnership.',
    href: '/enterprise',
    status: 'Planned',
    capabilities: ['Private VPC / BYOC', 'SAML 2.0 & SCIM', 'Custom MCP adapters'],
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
