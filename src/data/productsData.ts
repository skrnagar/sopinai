import { PreviewSurfaceId } from '../components/interactive/ProductPreviews';
import { RoutePath } from '../types/navigation';

export interface ProductDetailSpec {
  id: string;
  route: RoutePath;
  name: string;
  tagline: string;
  layer: string;
  status: 'Core Architecture (Preview)' | 'Planned' | 'Roadmap';
  summary: string;
  problemItSolves: string;
  whoUsesIt: string[];
  capabilities: { title: string; detail: string }[];
  workflowSteps: string[];
  integrations: string[];
  useCases: string[];
  securityGuarantee: string;
  relatedProducts: { name: string; href: RoutePath }[];
  previewSurface?: PreviewSurfaceId;
  codeLabel: string;
  codeExample: string;
  primaryCta: { label: string; href: RoutePath; query?: Record<string, string> };
  secondaryCta: { label: string; href: RoutePath; query?: Record<string, string> };
}

export const PRODUCT_SPECS: ProductDetailSpec[] = [
  {
    id: 'graph',
    route: '/graph',
    name: 'SOPIN Graph',
    tagline: 'Bounded cyclic state machines & multi-agent collaboration',
    layer: '01 · Multi-Agent Orchestration',
    status: 'Core Architecture (Preview)',
    summary:
      'Model iterative reasoning, planner-researcher-verifier collaboration, reflection loops, and Agent-to-Agent (A2A) delegation inside strongly-typed cyclic graphs with deterministic superstep ceilings.',
    problemItSolves:
      'Linear DAG workflows break down when complex tasks require iterative tool feedback, self-correction, or peer agent verification, whereas unguarded autonomous loops risk infinite token burn.',
    whoUsesIt: ['AI Systems Engineers', 'Multi-Agent App Builders', 'Research Automation Teams'],
    capabilities: [
      {
        title: 'Shared Typed Graph State',
        detail:
          'Define strongly typed state schemas with deterministic field reducers across every agent superstep.',
      },
      {
        title: 'Bounded Cycle Guardrails',
        detail:
          'Enforce hard maxSteps, token budgets, and cycle depth ceilings at compile and runtime.',
      },
      {
        title: 'Native A2A Peer Handoffs',
        detail:
          'Delegate sub-tasks between specialized agents using signed Agent-to-Agent envelopes and output contracts.',
      },
      {
        title: 'Framework Adapter Compatibility',
        detail:
          'Planned compatibility adapters allow LangGraph, CrewAI, and ADK topologies to execute inside SOPIN Runtime.',
      },
    ],
    workflowSteps: [
      'Declare shared Zod / Pydantic state schema for the multi-agent graph',
      'Register specialized peer nodes (Planner, Retriever, Verifier)',
      'Configure conditional edge predicates and hard maxSteps termination limits',
      'Inspect step-by-step state mutations in Studio and Observe replay',
    ],
    integrations: ['@sopin/sdk Graph API', 'A2A Protocol Endpoints', 'SOPIN Runtime Checkpoints', 'LangGraph / ADK Adapters (Planned)'],
    useCases: [
      'Multi-agent research & citation auditing teams',
      'Iterative repository debugging with test-fix verification loops',
      'Multi-analyst financial and compliance synthesis',
    ],
    securityGuarantee:
      'Each peer node carries its own least-privilege MCP capability scope; hard loop breakers prevent unbounded recursion.',
    relatedProducts: [
      { name: 'SOPIN Studio', href: '/studio' },
      { name: 'SOPIN Flow', href: '/flow' },
      { name: 'SOPIN Runtime', href: '/runtime' },
    ],
    previewSurface: 'studio',
    codeLabel: 'research-graph.ts',
    codeExample: `import { defineGraph, a2aPeer, z } from "@sopin/sdk";

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
    primaryCta: { label: 'Try Graph Mode in App', href: '/app' },
    secondaryCta: { label: 'Read A2A Specification', href: '/docs/a2a-delegation' },
  },
  {
    id: 'decisions',
    route: '/decisions',
    name: 'SOPIN Decisions',
    tagline: 'Make business logic executable.',
    layer: '02 · Deterministic Decision Automation Engine',
    status: 'Core Architecture (Preview)',
    summary:
      'A visual business decision engine combining deterministic IF/ELSE rules, spreadsheet decision tables, ordered rulesets, sequential rule chains, and weighted scorecards with SOPIN workflows and AI agents.',
    problemItSolves:
      'Teams often bury critical pricing, eligibility, SLA, and compliance thresholds inside hardcoded backend conditionals or ask probabilistic LLMs to enforce policy—producing brittle deployments or unpredictable outcomes.',
    whoUsesIt: ['Business Operations Leads', 'Automation Architects', 'Enterprise Risk & Finance Teams', 'Backend Engineers'],
    capabilities: [
      {
        title: 'Visual Rule Builder & Decision Tables',
        detail:
          'Author nested AND/OR rules, restricted safe arithmetic expressions, and spreadsheet tables supporting first-match, priority, collect-all, and unique hit policies.',
      },
      {
        title: 'Rulesets, Rule Chains & Explainable Scorecards',
        detail:
          'Group modular policies with explicit conflict resolution, chain sequential multi-stage decisions, and compute weighted threshold bands with criterion-level rationale.',
      },
      {
        title: 'Studio AI-Assisted Rule Drafting (Human Reviewed)',
        detail:
          'SOPIN Studio translates natural-language policy descriptions into editable Draft rules—never bypassing human review or publishing automatically.',
      },
      {
        title: 'Simulation, Versioning & Flow Integration',
        detail:
          'Run batch Expected-vs-Actual test suites, inspect step-by-step execution traces, promote Draft -> Tested -> Published across Dev/Staging/Prod, and invoke Decision Nodes directly inside SOPIN Flow.',
      },
    ],
    workflowSteps: [
      'Define typed input schema and deterministic IF/ELSE rules or decision table rows',
      'Validate edge cases with JSON test fixtures and batch Expected-vs-Actual assertions',
      'Promote tested versions from Development to Staging and Production with rollback support',
      'Invoke deterministically via API, SOPIN Flow Decision Node, or read-only agent tool calls',
    ],
    integrations: [
      'SOPIN Flow Decision Nodes',
      'SOPIN Studio AI Draft Compiler',
      'SOPIN Control RBAC & Approvals',
      'REST Decision Evaluation API (/v1/decisions/evaluate)',
    ],
    useCases: [
      'Vendor invoice auto-approval thresholds and finance exception routing',
      'Customer support SLA tier escalation and operational dead-letter guardrails',
      'Explainable vendor risk scoring and dynamic eligibility matrices',
    ],
    securityGuarantee:
      'Evaluated strictly by deterministic expression logic without runtime LLM randomness. Separate from SOPIN Control (authorization & RBAC): agents may draft or query decisions read-only, never modify or publish rules.',
    relatedProducts: [
      { name: 'SOPIN Flow', href: '/flow' },
      { name: 'SOPIN Control', href: '/control' },
      { name: 'SOPIN Studio', href: '/studio' },
    ],
    previewSurface: 'decisions',
    codeLabel: 'invoice-approval.decision.ts',
    codeExample: `import { defineDecisionRule, z } from "@sopin/sdk";

export const invoiceAutoApproval = defineDecisionRule({
  id: "rule-invoice-auto-approve",
  inputSchema: z.object({
    invoiceAmount: z.number(),
    vendorVerified: z.boolean(),
    duplicateFound: z.boolean()
  }),
  when: (i) => i.invoiceAmount < 50000 && i.vendorVerified && !i.duplicateFound,
  then: { decision: "approved", requiresHumanGate: false, approvalLane: "straight-through" },
  else: { decision: "manual_review", requiresHumanGate: true, approvalLane: "finance-controller" }
});`,
    primaryCta: { label: 'Open Decisions Workspace', href: '/app' },
    secondaryCta: { label: 'Read Decisions Specification', href: '/docs/decisions-spec' },
  },
  {
    id: 'gateway',
    route: '/gateway',
    name: 'SOPIN Gateway',
    tagline: 'Model-independent inference, multimodal routing, ML serving & MCP proxy',
    layer: '02 · Model, Multimodal & Tool Routing',
    status: 'Core Architecture (Preview)',
    summary:
      'Decouple workflows from single model vendors. Route text, vision, document, audio, and custom ML inference through one policy plane enforcing strict schemas, automatic failover, and pre-inference PII redaction.',
    problemItSolves:
      'Hardcoding vendor SDKs scatters API keys across services, stalls production workflows on provider rate limits, and risks transmitting unredacted sensitive records externally.',
    whoUsesIt: ['AI Platform Engineers', 'AI/ML Engineers', 'Backend Developers', 'Security Architects'],
    capabilities: [
      {
        title: 'Multi-Provider & Open-Weight Routing',
        detail:
          'Route seamlessly across frontier LLMs, self-hosted vLLM/Ollama endpoints, and custom PyTorch/ML registry models.',
      },
      {
        title: 'Multimodal & Document Pipelines',
        detail:
          'Dispatch structured extraction tasks across PDFs, images, audio transcripts, video frames, and tabular datasets.',
      },
      {
        title: 'Strict JSON Schema Lock & Repair',
        detail:
          'Validate every structured response against Zod/JSON Schema contracts with bounded repair retries before downstream steps fire.',
      },
      {
        title: 'Pre-Inference PII Redaction & Failover',
        detail:
          'Scrub restricted tokens locally prior to external model dispatch and switch automatically to fallback routes on timeout.',
      },
    ],
    workflowSteps: [
      'Bind BYOK, managed provider, or registered custom ML inference profiles',
      'Attach pre-inference PII redaction transforms and rate limits',
      'Enforce strict typed output schemas and secondary route failover',
      'Monitor per-route latency, schema pass rate, and token spend',
    ],
    integrations: ['Commercial LLM Providers', 'Private vLLM / TGI Clusters', 'Custom ML Registry Endpoints', 'MCP Tool Servers'],
    useCases: [
      'Zero-downtime multi-vendor failover routing',
      'PII-safe legal & invoice document parsing',
      'Routing specialist classification steps to registered PyTorch/tabular ML models',
    ],
    securityGuarantee:
      'Provider credentials stay inside encrypted server-side vaults and are never exposed to client browsers or agent prompts.',
    relatedProducts: [
      { name: 'SOPIN Context', href: '/context' },
      { name: 'SOPIN Runtime', href: '/runtime' },
      { name: 'SOPIN Control', href: '/control' },
    ],
    previewSurface: 'gateway',
    codeLabel: 'gateway.profile.yaml',
    codeExample: `gateway:
  profile: "multimodal-invoice-extract"
  routes:
    primary: { target: "configured-vision-reasoning", timeoutMs: 22000 }
    fallback: { target: "self-hosted-open-weight", timeoutMs: 14000 }
    customMlClassifier: { target: "registry://vendor-risk-classifier:v3" }
  policy:
    piiRedaction: ["tax_id", "iban", "ssn"]
    enforceStrictSchema: true
    rejectExtraKeys: true`,
    primaryCta: { label: 'Inspect Gateway in App', href: '/app' },
    secondaryCta: { label: 'Read Quickstart Docs', href: '/docs/quickstart' },
  },
  {
    id: 'runtime',
    route: '/runtime',
    name: 'SOPIN Runtime',
    tagline: 'Isolated sandboxes & durable checkpointed agent execution',
    layer: '03 · Execution Compute Plane',
    status: 'Core Architecture (Preview)',
    summary:
      'Execute untrusted agent-generated scripts, local MCP tool servers, and long-lived stateful workflows inside ephemeral sandboxes backed by durable step checkpoints.',
    problemItSolves:
      'Running agent code interpreters or external API mutations inside standard web server processes introduces remote code execution hazards and drops multi-step work during pauses.',
    whoUsesIt: ['Platform Engineers', 'DevOps & SRE Teams', 'Backend Engineers'],
    capabilities: [
      {
        title: 'Ephemeral Container / MicroVM Sandboxes',
        detail:
          'Every tool or code execution step boots inside an isolated filesystem with zero ambient host secrets and strict CPU/RAM caps.',
      },
      {
        title: 'Explicit Network Egress Allowlists',
        detail:
          'Lock untrusted code steps to networkEgress: "disabled" or constrain API tools to explicit destination domains.',
      },
      {
        title: 'Durable Pause & Checkpoint Recovery',
        detail:
          'Persist state cleanly across worker restarts or multi-hour human approval pauses without holding compute open.',
      },
      {
        title: 'Idempotent Mutation Semantics',
        detail:
          'Prevent duplicate writes across network retries with deterministic idempotency keys per workflow step.',
      },
    ],
    workflowSteps: [
      'Select compute & egress security profile per tool node',
      'Orchestrator dispatches step into isolated ephemeral sandbox',
      'State checkpoint persists upon deterministic verification',
      'Suspend cleanly for human gates or resume from last checkpoint on failure',
    ],
    integrations: ['Temporal Durable Execution', 'Container / MicroVM Workers', 'MCP stdio & HTTP Transports', 'Python ML Worker Pools (Planned)'],
    useCases: [
      'Running untrusted repository unit tests during AI code review',
      'Executing Python data transforms and Pandas/PyTorch analytics safely',
      'Long-running enterprise approval workflows spanning days',
    ],
    securityGuarantee:
      'Read-only root filesystems, ephemeral scratch mounts destroyed post-step, and zero host network metadata exposure.',
    relatedProducts: [
      { name: 'SOPIN Flow', href: '/flow' },
      { name: 'Trust & Security Center', href: '/security' },
      { name: 'SOPIN Enterprise', href: '/enterprise' },
    ],
    previewSurface: 'runtime',
    codeLabel: 'runtime.sandbox.ts',
    codeExample: `import { mcpServer } from "@sopin/sdk";

export const pythonAnalyzer = mcpServer("sandbox-python-exec", {
  transport: "stdio",
  allowedTools: ["python.runAnalysis", "parquet.inspectSchema"],
  deniedTools: ["shell.rawNetwork", "fs.mountHost"],
  sandbox: {
    filesystem: "ephemeral-readonly-root",
    networkEgress: "disabled",
    cpuLimitCores: 2,
    memoryLimitMb: 2048,
    timeoutMs: 30000
  }
});`,
    primaryCta: { label: 'Review Security Architecture', href: '/security' },
    secondaryCta: { label: 'Read MCP Bindings', href: '/docs/mcp-bindings' },
  },
  {
    id: 'observe',
    route: '/observe',
    name: 'SOPIN Observe',
    tagline: 'End-to-end execution traces, state diffs & telemetry',
    layer: '04 · Verification & Observability (Planned)',
    status: 'Planned',
    summary:
      'Inspect every retrieval lookup, Gateway prompt, MCP tool payload, graph superstep diff, latency breakdown, and 30-day reliability trend in one unified trace waterfall.',
    problemItSolves:
      'Standard HTTP logs tell you an endpoint took 4 seconds, not why an agent looped, which Context chunk caused a bad deduction, or which tool failed silently.',
    whoUsesIt: ['AI Engineers', 'Site Reliability Engineers', 'Operations Operators'],
    capabilities: [
      {
        title: 'Span-Level Execution Waterfall',
        detail:
          'Correlate Flow triggers, Context queries, Gateway calls, MCP execution, and Control gates down to millisecond spans.',
      },
      {
        title: 'Graph Superstep State Diffs',
        detail:
          'Inspect exact JSON state mutations added or modified by each agent in cyclic multi-agent graphs.',
      },
      {
        title: '30-Day Execution & Success Rate Telemetry',
        detail:
          'Track success rate trends, failure spikes, and average latency across workspaces (interactive Recharts preview live in /app).',
      },
      {
        title: 'Deterministic Checkpoint Replay (Planned)',
        detail:
          'Re-run a historical trace from an exact checkpoint with a candidate prompt or Gateway profile without repeating side effects.',
      },
    ],
    workflowSteps: [
      'Open flagged or failed workflow run from monitoring chart',
      'Expand span waterfall to view retrieved chunk checksums and schema outputs',
      'Compare superstep state diffs across cyclic loops',
      'Promote trace directly into a SOPIN Evaluate regression test case',
    ],
    integrations: ['OpenTelemetry Collectors', 'SOPIN Runtime Spans', 'SOPIN Evaluate Datasets', 'Recharts Workspace Telemetry'],
    useCases: [
      'Root-causing RAG citation misses and prompt regressions',
      'Monitoring P95 agent completion times across teams',
      'Converting production edge cases into golden test fixtures',
    ],
    securityGuarantee:
      'Trace payload fields inherit workspace RBAC masking so unprivileged viewers cannot inspect redacted PII spans.',
    relatedProducts: [
      { name: 'SOPIN Evaluate', href: '/evaluate' },
      { name: 'SOPIN Runtime', href: '/runtime' },
      { name: 'SOPIN Graph', href: '/graph' },
    ],
    previewSurface: 'observe',
    codeLabel: 'observe.telemetry.ts',
    codeExample: `// Structured OpenTelemetry-compatible span schema emitted per node
{
  "traceId": "tr_91a84f2c",
  "workflow": "customer-triage",
  "spans": [
    { "node": "context.retrieve", "durationMs": 142, "chunks": ["ADR-014@sha256:81e9"] },
    { "node": "gateway.classify", "route": "reasoning-structured", "durationMs": 890 },
    { "node": "control.humanGate", "status": "approved", "reviewer": "ops-lead" }
  ]
}`,
    primaryCta: { label: 'View 30-Day Chart in App', href: '/app' },
    secondaryCta: { label: 'Request Preview Access', href: '/contact', query: { topic: 'Developer Preview & SDK' } },
  },
  {
    id: 'evaluate',
    route: '/evaluate',
    name: 'SOPIN Evaluate',
    tagline: 'Automated regression harnesses & model benchmarking',
    layer: '05 · Verification & Quality Gates (Planned)',
    status: 'Planned',
    summary:
      'Verify prompt edits, retrieval index updates, model migrations, and custom ML checkpoints against golden datasets combining deterministic assertions and grounding checks prior to release.',
    problemItSolves:
      'Teams hesitate to upgrade models or refine instructions because manual spot-checking fails to catch silent accuracy, citation, or schema regressions.',
    whoUsesIt: ['AI/ML Engineers', 'QA & Verification Leads', 'Application Developers'],
    capabilities: [
      {
        title: 'Golden Datasets from Real Traces',
        detail:
          'Curate anonymized production traces or uploaded CSV/Parquet suites into versioned regression datasets.',
      },
      {
        title: 'Deterministic & Grounding Assertions',
        detail:
          'Assert strict JSON schema validity, mandatory tool sequences, latency/cost caps, and checksum-backed source grounding.',
      },
      {
        title: 'Side-by-Side Model & ML Benchmarking',
        detail:
          'Compare candidate prompts, frontier vs. open-weight LLMs, or custom ML checkpoints on pass rate, F1/accuracy, and latency.',
      },
      {
        title: 'CI/CD Release Gates (Planned)',
        detail:
          'Run evaluation suites automatically in pull requests and block promotion if verification scores drop below baseline.',
      },
    ],
    workflowSteps: [
      'Select curated golden dataset or trace snapshot collection',
      'Attach deterministic schema, grounding, and rubric assertions',
      'Execute matrix across candidate model routes or prompt versions',
      'Inspect regression diffs and enforce release gate thresholds',
    ],
    integrations: ['GitHub Actions / CI CLI', 'SOPIN Observe Trace Store', 'SOPIN Gateway Routes', 'ML Model Registry (Planned)'],
    useCases: [
      'Validating prompt changes before merging into main',
      'Benchmarking open-weight vs. proprietary model cost/accuracy tradeoffs',
      'Scoring custom trained classifiers against production baselines',
    ],
    securityGuarantee:
      'Evaluation fixtures pass through pre-storage PII sanitization so sensitive production data does not enter CI logs.',
    relatedProducts: [
      { name: 'SOPIN Observe', href: '/observe' },
      { name: 'SOPIN Gateway', href: '/gateway' },
      { name: 'SOPIN Control', href: '/control' },
    ],
    previewSurface: 'evaluate',
    codeLabel: 'sopin.eval.ts',
    codeExample: `import { defineEvalSuite, verify } from "@sopin/sdk";

export default defineEvalSuite({
  name: "contract-triage-regression",
  dataset: "datasets/contracts-golden-v4.jsonl",
  candidates: ["route:reasoning-structured", "route:open-weight-70b"],
  assertions: [
    verify.schemaStrict("ContractRiskReport"),
    verify.noUngroundedClaims(),
    verify.maxLatencyMs(3200)
  ]
});`,
    primaryCta: { label: 'Preview Evaluations Tab', href: '/app' },
    secondaryCta: { label: 'Join Early Cohort', href: '/contact', query: { topic: 'Design Partner Access' } },
  },
  {
    id: 'control',
    route: '/control',
    name: 'SOPIN Control',
    tagline: 'Enterprise RBAC, approval queues, budgets & immutable audit logs',
    layer: '06 · Governance & Control Plane (Planned)',
    status: 'Planned',
    summary:
      'Enforce organization-wide policies across every workspace: role-based access control, granular tool allowlists, spend ceilings, human approval queues, and verifiable audit trails.',
    problemItSolves:
      'Agents connected to internal APIs create unacceptable security, compliance, and cost-overrun exposure if permissions live only in prompt instructions.',
    whoUsesIt: ['CISOs & Security Leads', 'IT & Workspace Administrators', 'Operations Approvers'],
    capabilities: [
      {
        title: 'Organization & Workspace RBAC',
        detail:
          'Scope access cleanly across Owner, Admin, Builder, Operator, Reviewer, and Viewer roles integrated with corporate SSO.',
      },
      {
        title: 'Per-Agent Read vs. Write Allowlists',
        detail:
          'Restrict agents strictly to declared read-only MCP scopes or require human approval prior to mutating external state.',
      },
      {
        title: 'Durable Human Approval Inbox',
        detail:
          'Route elevated-risk tool proposals to authorized reviewers with full citation context (interactive preview live in /app).',
      },
      {
        title: 'Token Budgets & SIEM Audit Export',
        detail:
          'Enforce monthly workspace spend caps and stream tamper-evident audit records to corporate SIEM pipelines.',
      },
    ],
    workflowSteps: [
      'Define workspace RBAC roles and approved model provider policies',
      'Set read/write MCP tool allowlists and token spend limits',
      'Escalate elevated-risk proposals into the Control approval inbox',
      'Audit every trigger, model inference, and reviewer sign-off end to end',
    ],
    integrations: ['OIDC / SAML 2.0 SSO (Planned)', 'SCIM Sync (Planned)', 'SIEM Webhooks (Planned)', 'SOPIN Gateway & Runtime'],
    useCases: [
      'Requiring finance sign-off prior to ERP payment or invoice updates',
      'Preventing unapproved external LLM usage across departments',
      'Demonstrating full AI action lineage during internal compliance reviews',
    ],
    securityGuarantee:
      'Policies evaluate out-of-band inside the Gateway and Runtime control plane—agents cannot prompt-inject around RBAC checks.',
    relatedProducts: [
      { name: 'Trust & Security Center', href: '/security' },
      { name: 'SOPIN Enterprise', href: '/enterprise' },
      { name: 'SOPIN Runtime', href: '/runtime' },
    ],
    previewSurface: 'control',
    codeLabel: 'control.policy.ts',
    codeExample: `import { humanGate, policy } from "@sopin/sdk";

export const financeOpsPolicy = policy.workspace("sonil-finance-ops", {
  allowedGatewayProfiles: ["reasoning-structured", "private-vpc-llama"],
  monthlyTokenBudgetCapUsd: 2500,
  toolGuardrails: {
    "erp.readInvoice": { mode: "allow" },
    "erp.postJournalEntry": humanGate({
      approverRole: "finance-controller",
      timeoutMinutes: 120
    })
  }
});`,
    primaryCta: { label: 'Try Approvals in App', href: '/app' },
    secondaryCta: { label: 'Read Security Architecture', href: '/security' },
  },
  {
    id: 'cloud',
    route: '/cloud',
    name: 'SOPIN Cloud',
    tagline: 'Managed multi-region platform control & serverless agent runtime',
    layer: '07 · Managed Infrastructure (Planned)',
    status: 'Planned',
    summary:
      'Run SOPIN Studio, Flow, Graph, Context, Gateway, Observe, and Control on managed global cloud infrastructure operated under SONIL Group—zero Kubernetes setup required.',
    problemItSolves:
      'Product and automation teams need elastic sandboxes, durable workflow queues, and managed RAG indexes immediately without maintaining distributed systems infrastructure.',
    whoUsesIt: ['Startups & Product Teams', 'Operations Innovation Labs', 'Mid-Market Engineering Orgs'],
    capabilities: [
      {
        title: 'Zero-Ops Workspace Provisioning',
        detail:
          'Spin up isolated team workspaces with versioned Studio projects, triggers, and knowledge corpora in minutes.',
      },
      {
        title: 'Elastic Sandboxed Execution Workers',
        detail:
          'Autoscaling ephemeral containers for code execution, document parsing, and multi-agent graphs.',
      },
      {
        title: 'BYOK or Managed Gateway Routing',
        detail:
          'Connect your own provider API keys in encrypted cloud vaults or route through metered SOPIN Gateway profiles.',
      },
      {
        title: 'Logical Tenant & Data Residency Isolation',
        detail:
          'Strict workspace-level database, vector, and queue partitioning backed by regional hosting options (Planned).',
      },
    ],
    workflowSteps: [
      'Provision workspace and invite builders via team RBAC',
      'Store encrypted BYOK provider keys or configure managed Gateway routes',
      'Publish Studio/Flow blueprints to managed Runtime triggers',
      'Track runs, traces, and workspace usage in real time',
    ],
    integrations: ['GitHub Sync', 'Webhook & Cron Triggers', 'Managed PostgreSQL / Vector Stores', 'Cloud OAuth Connectors'],
    useCases: [
      'Launching customer-facing or internal agent workflows rapidly',
      'Scaling multi-agent operations across distributed teams',
    ],
    securityGuarantee:
      'Strict multi-tenant logical isolation, encrypted secrets vaulting, and explicit zero-training commitment on customer payloads.',
    relatedProducts: [
      { name: 'SOPIN Enterprise', href: '/enterprise' },
      { name: 'Pricing & Access', href: '/pricing' },
      { name: 'Trust & Security Center', href: '/security' },
    ],
    previewSurface: 'flow',
    codeLabel: 'sopin.cloud.yaml',
    codeExample: `deployment:
  target: "sopin-cloud"
  region: "asia-southeast-1"
  workspace: "product-automation"
  gatewayMode: "byok-vault"
  runtime:
    concurrencyLimit: 25
    defaultEgress: "disabled"`,
    primaryCta: { label: 'View Cloud Access Options', href: '/pricing' },
    secondaryCta: { label: 'Join Cloud Preview List', href: '/contact', query: { topic: 'Design Partner Access' } },
  },
  {
    id: 'enterprise',
    route: '/enterprise',
    name: 'SOPIN Enterprise',
    tagline: 'Private VPC, BYOC & self-hosted AI agent infrastructure under SONIL Group',
    layer: '08 · Enterprise Deployment Topology (Roadmap)',
    status: 'Roadmap',
    summary:
      'Deploy SOPIN Runtime, Gateway, and Context inside your private cloud VPC, Kubernetes cluster, or air-gapped network perimeter with enterprise identity, governance, and dedicated SONIL Group engineering support.',
    problemItSolves:
      'Regulated organizations in finance, healthcare, defense, and R&D cannot transmit proprietary codebases, customer records, or credentials to multi-tenant public AI services.',
    whoUsesIt: ['Enterprise CTOs & VPs of Engineering', 'CISOs & Compliance Officers', 'Enterprise Platform Architects'],
    capabilities: [
      {
        title: 'Private VPC / BYOC / Self-Hosted Data Plane',
        detail:
          'Keep model inference, knowledge indexes, tool servers, and execution logs strictly inside your corporate network perimeter.',
      },
      {
        title: 'Private & Self-Hosted Model Binding',
        detail:
          'Bind internal vLLM clusters, private cloud endpoints (Bedrock/Vertex/Azure Private Link), and proprietary ML models natively.',
      },
      {
        title: 'Enterprise Identity & SIEM Integration (Planned)',
        detail:
          'Enforce SAML 2.0 / OIDC SSO, SCIM group-to-RBAC sync, and immutable audit log streaming to existing security tools.',
      },
      {
        title: 'Joint SONIL Group Architecture Onboarding',
        detail:
          'Collaborate directly with SONIL Group platform engineers on custom MCP adapters and governance rollouts.',
      },
    ],
    workflowSteps: [
      'Complete architectural scoping with SONIL Group engineering',
      'Deploy containerized SOPIN Data Plane in customer VPC / Kubernetes',
      'Bind corporate IdP (SSO/SCIM), private model endpoints, and internal MCP servers',
      'Roll out governed workspaces across engineering, data, and operations teams',
    ],
    integrations: ['Private VPC / Kubernetes / Helm', 'Corporate IdP (SAML/OIDC)', 'Private Model Clusters', 'Enterprise SIEM'],
    useCases: [
      'Firm-wide AI platform standardization under strict data residency rules',
      'Air-gapped software engineering & document intelligence automation',
    ],
    securityGuarantee:
      'Zero data egress outside your cloud perimeter in self-hosted mode; backed by SOPIN Control RBAC and Trust Center specs.',
    relatedProducts: [
      { name: 'Trust & Security Center', href: '/security' },
      { name: 'SOPIN Control', href: '/control' },
      { name: 'SOPIN Cloud', href: '/cloud' },
    ],
    previewSurface: 'control',
    codeLabel: 'enterprise.vpc.yaml',
    codeExample: `enterpriseDeployment:
  topology: "private-vpc-data-plane"
  controlPlane: "sonil-enterprise-dedicated"
  identity: { protocol: "saml2", scimSync: true }
  dataResidency: "strict-in-vpc"
  gatewayEndpoints:
    - "https://vllm-internal.corp.local/v1"
    - "vpc-endpoint://private-foundation-gateway"`,
    primaryCta: { label: 'Contact SONIL Group Enterprise', href: '/contact', query: { topic: 'SONIL Group Enterprise' } },
    secondaryCta: { label: 'Inspect Security Center', href: '/security' },
  },
];

export const PRODUCT_SPECS_BY_ROUTE: Partial<Record<RoutePath, ProductDetailSpec>> =
  Object.fromEntries(PRODUCT_SPECS.map((spec) => [spec.route, spec]));
