# SOPIN — Information Architecture & Product Specifications

**Platform:** SOPIN (`sopin.ai`) — Unified AI Agent Engineering, Automation & Execution Platform  
**Parent Organization:** SONIL Group  

---

## 1. Architectural Taxonomy: Preventing Category Confusion

A central source of buyer confusion in the AI ecosystem—and a structural ambiguity in `/platform`'s current hash anchors—is conflating distinct infrastructure layers. SOPIN must cleanly separate six architectural layers:

| Layer | Definition | SOPIN Module(s) | Comparable External Category |
|-------|------------|-----------------|------------------------------|
| **1. Authoring IDE & Typed Framework** | Where humans and engineers define agent roles, schemas, graphs, and SDK code. | **SOPIN Studio**, **@sopin/sdk**, **SOPIN Graph** | LangGraph (graph DSL), CrewAI (role framework), IDE builders |
| **2. Workflow Automation Engine** | Deterministic DAG orchestration, triggers, schedules, branching, retries, and webhook glue. | **SOPIN Flow** | Temporal workflows, n8n/Zapier-class orchestration (upgraded with AI gates) |
| **3. Context & Memory Plane** | Structured working state, episodic memory, multimodal parsing, RAG indexes, and ACL provenance. | **SOPIN Context** | Vector DBs + custom RAG pipelines + memory layers |
| **4. Model, Tool & Protocol Gateway** | Vendor-neutral inference routing, multimodal routing, schema locking, PII redaction, and MCP/API unification. | **SOPIN Gateway** | Model routers / LLM proxies + MCP tool proxy |
| **5. Secure Execution Runtime** | Isolated containers/microVMs, durable state checkpointing, and bounded compute execution. | **SOPIN Runtime** | AWS Bedrock AgentCore Runtime, E2B sandboxes, Temporal workers |
| **6. Verification & Enterprise Control Plane** | Tracing, evaluation harnesses, RBAC, spend budgets, approval queues, and audit logs. | **SOPIN Observe**, **SOPIN Evaluate**, **SOPIN Control**, **SOPIN Enterprise** | LangSmith + enterprise IAM/policy plane |

---

## 2. Navigation Hierarchy & Governance

### Audit of Existing Navigation (`Navbar.tsx`)
The current header cleanly implements 6 top-level triggers (`Platform`, `Solutions`, `Developers`, `Resources`, `Pricing`, `Company`), edge-clamped mega menus (`alignClass` using `left-0` / `right-0` + `max-w-[calc(100vw-2rem)]`), theme toggle, mobile drawer, and dual conversion CTAs (`Try SOPIN` -> `/app`, `Start Building` -> `/docs`).

**Remaining Structural Weaknesses in Navigation:**
1. **`Platform` Sub-Items Point to `#Hash` Anchors:** `Model Gateway`, `Runtime`, `Evaluations`, and `Governance` all route into sections of `/platform` instead of dedicated product URLs; `SOPIN Graph`, `SOPIN Cloud`, and `SOPIN Enterprise` are missing from the menu altogether.
2. **`Company` Dropdown Is Minimal:** Holds only `About SOPIN` and `Contact`; missing `Vision & Mission`, `SONIL Group`, `Trust & Security Center`, `Careers`, and `Partners`.
3. **`Solutions` & `Developers` Anchor Compression:** Sub-items route to vertical sections on `/solutions` and `/developers` rather than dedicated, bookmarkable capability pages.

### Target Top-Level Navbar (6 Primary Items + Dual Conversion Actions)
Keep the top bar clean, single-row, and uncrowded at `1024px+`:

1. **Platform** *(Mega Menu — Overview + 11 Modular Products grouped cleanly into **Build** [`Studio`, `Flow`, `Graph`, `Context`], **Run & Connect** [`Gateway`, `Runtime`], **Verify & Govern** [`Observe`, `Evaluate`, `Control`], and **Deploy** [`Cloud`, `Enterprise`])*
2. **Solutions** *(Mega Menu — 8 operational solution tracks including Document Intelligence, Machine Learning, and Multi-Agent Applications)*
3. **Developers** *(Mega Menu — Docs `/docs`, API Reference, SDKs, MCP Integrations, A2A Interoperability, Agent Templates, Open Source, Community)*
4. **Resources** *(Mega Menu — Blog, AI Research, Tutorials, Guides, Case Studies, AI Academy, Product Updates, Community)*
5. **Pricing** *(Direct Link -> `/pricing`)*
6. **Company** *(Dropdown — About SOPIN, Vision & Mission, SONIL Group, Trust & Security Center `/security`, Careers, Partners, Contact)*

**Header Right Actions (Preserved & Verified):** Theme Toggle + **`Try SOPIN`** (`/app` interactive mobile-first workspace) + **`Start Building`** (`/docs` developer quickstart).

---

## 3. Complete Sitemap & URL Taxonomy (Current vs. Target)

### A. Public Platform (`/platform` + 11 Product Modules = 12 Platform Pages)
| Label | Target URL | Current Status in Repo | Notes |
|-------|------------|------------------------|-------|
| **Platform Overview** | `/platform` | **Existing** (Refactor) | System architecture hub linking all 11 modules |
| **SOPIN Studio** | `/studio` | **Existing** (Enhance) | Multi-modal authoring IDE + `/app` Build preview |
| **SOPIN Flow** | `/flow` *(alias `/workflow-automation`)* | **Existing** (`/workflow-automation`) | Deterministic workflow automation + `/app` Flow designer |
| **SOPIN Context** | `/context` | **Existing** (Enhance) | Knowledge, RAG, memory + `/app` Knowledge inspector |
| **SOPIN Graph** | `/graph` | **MISSING (P1)** | Cyclic state graphs & multi-agent A2A coordination |
| **SOPIN Runtime** | `/runtime` | **MISSING (P1)** | Resolves to `/platform#runtime`; needs dedicated page |
| **SOPIN Gateway** | `/gateway` | **MISSING (P1)** | Resolves to `/platform#gateway`; needs dedicated page |
| **SOPIN Observe** | `/observe` | **MISSING (P1 · Planned)** | Resolves to `/platform#evaluations`; needs dedicated page |
| **SOPIN Evaluate** | `/evaluate` | **MISSING (P1 · Planned)** | Resolves to `/platform#evaluations`; needs dedicated page |
| **SOPIN Control** | `/control` | **MISSING (P1 · Planned)** | Resolves to `/platform#governance`; needs dedicated page |
| **SOPIN Cloud** | `/cloud` | **MISSING (P2 · Planned)** | Managed cloud deployment architecture |
| **SOPIN Enterprise** | `/enterprise` | **MISSING (P1 · Roadmap)** | Private VPC, BYOC, air-gapped & governed deployments |

### B. Interactive Workspace App (`/app`)
| Label | Target URL | Current Status in Repo | Notes |
|-------|------------|------------------------|-------|
| **SOPIN Workspace Shell** | `/app` *(future `/app/:workspace/:module`)* | **Existing (Local Prototype)** | 5-tab mobile-first PWA (`Home`, `Build`, `Run`, `Knowledge`, `More`) with Recharts chart & `localStorage` state; migrate to FastAPI in Phase 3+. |

### C. Solutions (`/solutions/*`)
| Label | Target URL | Current Status in Repo |
|-------|------------|------------------------|
| **Solutions Overview** | `/solutions` | **Existing** (Refactor to hub) |
| **Business Automation** | `/solutions/business-automation` | Anchor `#business-automation` only |
| **AI Research** | `/solutions/ai-research` | Anchor `#ai-research` only |
| **Software Engineering** | `/solutions/software-engineering` | Anchor `#software-engineering` only |
| **Data Intelligence** | `/solutions/data-intelligence` | Merged in `#data-ml` (split needed) |
| **Machine Learning** | `/solutions/machine-learning` | **MISSING (P1)** (split & expand ML pipeline) |
| **Enterprise AI** | `/solutions/enterprise-ai` | Anchor `#enterprise-ai` only |
| **Document Intelligence** | `/solutions/document-intelligence` | **MISSING (P1)** |
| **Multi-Agent Applications** | `/solutions/multi-agent` | **MISSING (P1)** |

### D. Developers (`/developers/*` & `/docs/*`)
| Label | Target URL | Current Status in Repo |
|-------|------------|------------------------|
| **Developer Overview** | `/developers` | **Existing** (Expand) |
| **Documentation** | `/docs` & `/docs/:slug` | **Existing** (`/docs` only — add `:slug` URLs) |
| **API Reference** | `/developers/api` | **MISSING (P1)** |
| **SDKs (TS & Python)** | `/developers/sdks` | Anchor `#sdk` only |
| **MCP Integrations** | `/developers/mcp` | Merged in `#protocols` |
| **A2A Interoperability** | `/developers/a2a` | Merged in `#protocols` |
| **Agent Templates** | `/templates` | **MISSING (P2)** |
| **Open Source** | `/developers/open-source` | Anchor `#open-source` (`Coming Soon`) |
| **GitHub and Community** | `/community` | **MISSING (P2)** |

### E. Resources, Company, Trust & System Routes
- **Resources:** `/resources` (existing catalog) + `/resources/:slug` (**MISSING P0/P1** full-text articles) + tracks for `/resources/blog`, `/resources/research` (**MISSING**), `/resources/tutorials`, `/resources/guides`, `/resources/case-studies` (*Coming Soon*), `/academy` (*Planned*), `/changelog` (**MISSING P2**), `/community`.
- **Company & Trust:** `/about` (existing), `/sonil-group` (**MISSING**), `/careers` (**MISSING**), `/partners` (**MISSING**), `/contact` (existing), `/security` (**MISSING P1 — Essential standalone Trust & Security Center**).
- **Commercial / Ops:** `/pricing` (existing — keep standalone), `/templates` (Marketplace — standalone P2/P3), `/status` (Platform Status — **MISSING P3**, launch only once live Cloud beta operates; never show synthetic green status bars prematurely).
- **System:** `NotFoundPage` (`*`) — **Existing client-side** (`isNotFound: true`); add `noindex` meta & real HTTP `404` status on static/SSR host.

---

## 4. Individual Product Page Specifications (All 11 Products)

> **Transparency Standard:** Every product spec distinguishes **Core Architecture (Preview)**, **Workspace Prototype (`/app`)**, and **Planned / Roadmap Backend** status—never presenting unbuilt live cloud infrastructure as active today.

### 4.1 SOPIN Studio (`/studio`) — *Core Architecture (Preview) · In `/app` Prototype*
- **What it is:** Multi-modal authoring workbench uniting natural language task synthesis, visual node inspection, cyclic graph editing, and 1:1 TypeScript/Python SDK parity.
- **Problem it solves:** Eliminates translation loss between non-technical prototypes and production code repositories.
- **Who uses it:** Business builders, automation architects, AI developers.
- **Main capabilities:** 5-step Agent Studio wizard (live in `/app`), natural language-to-spec compiler, Graph/DAG topology preview, typed Zod/JSON Schema contracts, bidirectional Git/SDK export.
- **How it works:** Authors describe intent or edit visual nodes; Studio emits a deterministic declarative blueprint executed identically across Flow, Graph, and Runtime.
- **Typical workflow:** Enter goal -> Confirm permissions & model profile -> Attach Context & MCP tools -> Inspect blueprint & code -> Publish to workspace or export to Git.
- **Integrations:** `@sopin/sdk`, Git repositories, SOPIN Context corpora, MCP tool servers, SOPIN Gateway profiles.
- **Example use cases:** Compliance intake triage agent, PR release auditor, executive briefing synthesizer.
- **Security & governance:** Zero raw secrets in prompt specs; output schemas and tool scopes validated at design time.
- **Related products:** SOPIN Flow, SOPIN Graph, SOPIN Context.
- **Primary CTA:** `Try Studio in App` (`/app`) · `Explore Quickstart` (`/docs/quickstart`).

### 4.2 SOPIN Flow (`/flow`, alias `/workflow-automation`) — *Core Architecture (Preview) · In `/app` Prototype*
- **What it is:** Deterministic workflow automation and DAG orchestration engine combining triggers, structured branches, retries, and human approval checkpoints.
- **Problem it solves:** Purely autonomous agent loops are unreliable and costly for deterministic business pipelines requiring strict SLAs and conditional controls.
- **Who uses it:** Automation builders, operations engineers, backend developers.
- **Main capabilities:** Webhook/cron/queue triggers, conditional branches, parallel fan-out, bounded exponential retries, dead-letter routing, durable pause/resume `humanGate` checkpoints, vertical mobile Flow builder (`/app`).
- **How it works:** Executes each step idempotently along directed edges while persisting checkpoints so workflows survive restarts and pause safely for human review.
- **Typical workflow:** Choose trigger -> Extract/redact payload -> Classify via Gateway -> Branch on risk threshold -> Pause for human sign-off -> Emit output.
- **Integrations:** Webhooks, queues, REST/GraphQL APIs via Gateway, MCP tool servers, SOPIN Context.
- **Example use cases:** Invoice reconciliation, contract renewal alerts, onboarding document verification.
- **Security & governance:** Step-scoped credentials, deterministic retry ceilings, mandatory approval gates before external writes.
- **Related products:** SOPIN Studio, SOPIN Runtime, SOPIN Control.
- **Primary CTA:** `Try Flow in App` (`/app`) · `View Flow Specification` (`/docs`).

### 4.3 SOPIN Context (`/context`) — *Core Architecture (Preview) · In `/app` Prototype*
- **What it is:** Structured knowledge, multimodal RAG, episodic session memory, and working state plane with immutable source provenance.
- **Problem it solves:** Unstructured context stuffing causes context rot, hallucinations, token waste, and cross-tenant data leakage.
- **Who uses it:** AI engineers, data engineers, knowledge architects.
- **Main capabilities:** 3-tier memory isolation (ephemeral run state, episodic session memory, versioned knowledge corpora); hybrid semantic + lexical retrieval; local file/image/URL ingestion preview (`/app`); checksum & span-offset provenance; pre-retrieval ACL filtering *(backend planned)*.
- **How it works:** Ingests approved documents/media/tables with classification metadata, enforces workspace/role ACLs prior to retrieval, and attaches verifiable checksums to every chunk passed into agent prompts.
- **Typical workflow:** Upload document/URL -> Configure classification scope -> Bind corpus to agent -> Require cited passages in outputs.
- **Integrations:** Object storage, docs/Git repos, relational/vector indexes, multimodal document parsers.
- **Example use cases:** Policy-grounded compliance Q&A, codebase ADR lookup, technical literature synthesis.
- **Security & governance:** Strict tenant/workspace isolation; configurable TTL on ephemeral working memory.
- **Related products:** SOPIN Gateway, SOPIN Evaluate, SOPIN Control.
- **Primary CTA:** `Inspect Context in App` (`/app`) · `Context SDK Spec` (`/developers/sdks`).

### 4.4 SOPIN Graph (`/graph`) — *Core Architecture (Preview) · Dedicated Public Page MISSING*
- **What it is:** Cyclic state-machine and multi-agent collaboration engine for supervisor-worker loops, reflection, critique, and A2A peer handoffs.
- **Problem it solves:** Linear DAGs cannot model iterative research, test-fix software debugging, or multi-specialist agent collaboration cleanly.
- **Who uses it:** AI systems engineers, multi-agent developers, AI researchers.
- **Main capabilities:** Shared typed graph state, bounded cycle ceilings (`maxSteps`), conditional state reducers, sub-graphs, native Agent-to-Agent (A2A) delegation, framework adapter compatibility (LangGraph/CrewAI/ADK patterns).
- **How it works:** Nodes read and patch a shared typed state across bounded supersteps; transitions fire deterministically via state predicates or schema-locked routers.
- **Typical workflow:** Declare typed state -> Define specialist agent nodes -> Set `maxSteps` & token limits -> Step through state diffs in Observe/Run.
- **Integrations:** A2A endpoints, `@sopin/sdk`, external graph adapters *(planned)*, SOPIN Runtime.
- **Example use cases:** Multi-agent competitive synthesis, repository patch-and-test loops, due diligence teams.
- **Security & governance:** Hard `maxSteps` loop breakers and per-peer capability scopes preventing runaway execution.
- **Related products:** SOPIN Studio, SOPIN Flow, SOPIN Runtime, SOPIN Observe.
- **Primary CTA:** `Explore Multi-Agent Solutions` (`/solutions/multi-agent`).

### 4.5 SOPIN Runtime (`/runtime`) — *Core Architecture (Preview) · Dedicated Public Page MISSING*
- **What it is:** Isolated, durable execution compute layer for agents, code execution, MCP servers, and long-running workflows.
- **Problem it solves:** Executing untrusted agent-generated scripts or long-lived workflows inside standard web API servers introduces RCE risks and state loss on timeout.
- **Who uses it:** Platform engineers, DevOps/SREs, AI engineers.
- **Main capabilities:** Ephemeral microVM/container sandboxes, explicit network egress policies (`disabled` or `allowlist-only`), durable checkpointing across hours/days, idempotent retries, specialized Python/ML compute workers *(planned)*.
- **How it works:** Orchestrators dispatch step workloads into isolated sandboxes with injected ephemeral credentials, checkpointing every state boundary before returning artifacts.
- **Typical workflow:** Select sandbox resource/egress profile -> Bind MCP servers -> Run stateful graph or workflow -> Resume cleanly after pause or failure.
- **Integrations:** Temporal durable execution, sandboxed container runtimes, MCP `stdio`/`HTTP`, Python ML workers.
- **Example use cases:** Untrusted unit test suites, Python/tabular data processing, multi-day approval flows.
- **Security & governance:** Read-only rootfs, zero ambient host secrets, strict CPU/memory/time ceilings.
- **Related products:** SOPIN Flow, SOPIN Graph, SOPIN Gateway, SOPIN Enterprise.
- **Primary CTA:** `Inspect Security Architecture` (`/security`).

### 4.6 SOPIN Gateway (`/gateway`) — *Core Architecture (Preview) · Dedicated Public Page MISSING*
- **What it is:** Unified, model-independent Model, Multimodal, API, and MCP Gateway for single-point routing, schema enforcement, and redaction.
- **Problem it solves:** Hardcoding vendor SDKs scatters provider keys, creates single-vendor lock-in, leaks PII to external APIs, and breaks on provider rate limits.
- **Who uses it:** AI platform engineers, backend developers, security leads.
- **Main capabilities:** Cross-provider routing (Frontier LLMs, open-weight vLLM/Ollama, multimodal vision/audio/doc parsers, custom ML models), JSON Schema enforcement & repair, pre-inference PII redaction, automatic failover, unified MCP/API proxy, spend caps *(planned)*.
- **How it works:** Workloads target named route profiles (`reasoning-structured`, `deterministic-fast`, `vision-extract`); Gateway sanitizes inputs, dispatches to primary/fallback models, and validates typed outputs before returning.
- **Typical workflow:** Configure BYOK or managed provider route -> Attach PII redaction & JSON schema -> Set failover priority -> Track latency/cost in Observe.
- **Integrations:** Commercial LLM APIs, private vLLM/TGI clusters, custom registered ML endpoints, MCP servers.
- **Example use cases:** Zero-downtime vendor failover, PII-redacted triage, structured multimodal extraction.
- **Security & governance:** Centralized KMS secret vaulting; zero provider keys exposed to agents or client browsers.
- **Related products:** SOPIN Context, SOPIN Runtime, SOPIN Control.
- **Primary CTA:** `Inspect Gateway Config` (`/platform#gateway`).

### 4.7 SOPIN Observe (`/observe`) — *Planned Roadmap Module · Dedicated Public Page MISSING*
- **What it is:** Execution observability and trace replay plane offering OpenTelemetry-aligned span waterfalls, state diffs, and 30-day performance telemetry.
- **Problem it solves:** Conventional HTTP monitoring fails to reveal why an agent triggered a loop, which RAG chunk polluted an answer, or where token spend spiked.
- **Who uses it:** AI engineers, SREs, automation operators.
- **Main capabilities:** End-to-end span waterfalls (`Flow` -> `Context` -> `Gateway` -> `MCP`), superstep state diffs, **30-day Success Rate & Execution Time charts** (previewed in `/app` via Recharts), time-travel replay from checkpoints *(Planned)*.
- **How it works:** Streams structured step events via Redis pub/sub and OpenTelemetry collectors into indexed trace storage for real-time inspection and offline evaluation curation.
- **Typical workflow:** Inspect flagged run -> Expand Context/Gateway spans -> Pinpoint failing step -> Replay against updated prompt or route.
- **Integrations:** OpenTelemetry, SOPIN Evaluate datasets, SOPIN Runtime checkpoints.
- **Example use cases:** Debugging multi-agent regressions, diagnosing retrieval precision drops, monitoring SLA compliance.
- **Security & governance:** Role-scoped trace masking so sensitive payloads stay hidden from unauthorized viewers.
- **Related products:** SOPIN Evaluate, SOPIN Graph, SOPIN Runtime.
- **Primary CTA:** `Try Telemetry in App` (`/app`).

### 4.8 SOPIN Evaluate (`/evaluate`) — *Planned Roadmap Module · Dedicated Public Page MISSING*
- **What it is:** Automated evaluation, regression testing, and model benchmarking harness for agents, workflows, and custom ML pipelines.
- **Problem it solves:** Without repeatable evaluation gates, any prompt tweak, RAG re-index, or model upgrade risks silent production regressions.
- **Who uses it:** AI/ML engineers, QA leads, software engineers.
- **Main capabilities:** Golden datasets curated from Observe traces, deterministic assertions (JSON schema, regex, tool-call constraints), citation grounding checks, rubric scorers, side-by-side model/prompt benchmarking, CI/CD merge gates *(Planned)*.
- **How it works:** Replays candidate agent/workflow versions or ML models over benchmark suites and compares assertion pass rates, accuracy, cost, and latency against baselines.
- **Typical workflow:** Import traces to dataset -> Define deterministic + grounding rules -> Benchmark 2 model profiles -> Block release on regression.
- **Integrations:** GitHub Actions CI, SOPIN Observe, SOPIN Gateway profiles, ML Model Registry *(planned)*.
- **Example use cases:** Comparing open-weight vs. frontier accuracy/cost, validating citation strictness, scoring ML classification candidates.
- **Security & governance:** Ensures eval datasets scrub sensitive PII before CI storage.
- **Related products:** SOPIN Observe, SOPIN Studio, SOPIN Gateway.
- **Primary CTA:** `Request Preview Access` (`/contact`).

### 4.9 SOPIN Control (`/control`) — *Planned Roadmap Module · Dedicated Public Page MISSING*
- **What it is:** Centralized enterprise governance plane enforcing RBAC, tool capability allowlists, human approval queues, budget caps, and immutable audit trails.
- **Problem it solves:** Autonomous agents holding write privileges across enterprise systems pose severe security, compliance, and runaway-spend hazards without centralized policy controls.
- **Who uses it:** Enterprise Security Officers (CISOs), IT Admins, Operations Approvers.
- **Main capabilities:** Org/workspace RBAC, read/write MCP tool allowlists, SLA-backed human approval inbox (interactive in `/app` prototype), token/compute spend ceilings, immutable append-only audit log *(Planned)*.
- **How it works:** Intercepts every agent action prior to Gateway dispatch and Runtime tool execution; routes high-risk mutations into the human approval queue and logs signed audit records.
- **Typical workflow:** Configure workspace roles & spend budgets -> Restrict write tools -> Review escalated approval requests -> Export SIEM audit trail.
- **Integrations:** OIDC/SAML SSO, SCIM directory sync, secret vaults, SIEM webhooks *(Planned)*.
- **Example use cases:** Dual sign-off on financial/database writes, enforcing departmental AI budgets, compliance auditing.
- **Security & governance:** Core policy enforcement engine of the SOPIN stack.
- **Related products:** SOPIN Enterprise, SOPIN Gateway, SOPIN Runtime.
- **Primary CTA:** `Try Approval Queue in App` (`/app`) · `Security Architecture` (`/security`).

### 4.10 SOPIN Cloud (`/cloud`) — *Planned Managed Infrastructure · Dedicated Public Page MISSING*
- **What it is:** Managed, multi-tenant control and execution cloud under SOPIN / SONIL Group for rapid team onboarding without Kubernetes infrastructure setup.
- **Problem it solves:** Builders and agile product teams want immediate zero-ops deployment of Studio blueprints, Runtime sandboxes, and Context indexes.
- **Who uses it:** Startups, product engineering teams, innovation labs, business builders.
- **Main capabilities:** Managed Studio/Flow/Observe workspace, elastic sandbox workers, managed Context indexing, BYOK or metered Gateway routing, isolated workspaces *(Planned)*.
- **How it works:** Runs multi-tenant control plane and logically isolated Runtime sandboxes managed by SOPIN reliability engineering.
- **Typical workflow:** Create workspace -> Configure keys -> Publish blueprint -> Monitor usage & runs cleanly.
- **Integrations:** OAuth connectors, webhooks, GitHub sync, managed Gateway providers.
- **Example use cases:** Rapid internal ops automation, production customer-facing agent workflows without DevOps overhead.
- **Security & governance:** Row-level tenant isolation, encrypted secret vaults, regional data residency *(Planned)*.
- **Related products:** SOPIN Enterprise, Pricing & Access.
- **Primary CTA:** `View Access Options` (`/pricing`).

### 4.11 SOPIN Enterprise (`/enterprise`) — *Roadmap Architecture · Dedicated Public Page MISSING*
- **What it is:** Dedicated, private VPC, BYOC (Bring Your Own Cloud), or air-gapped deployment topology with enterprise identity and SONIL Group engineering support.
- **Problem it solves:** Regulated enterprises cannot route proprietary source code, financial data, or operational secrets through shared multi-tenant cloud environments.
- **Who uses it:** Enterprise CTOs, CISOs, Platform Architecture Leaders.
- **Main capabilities:** Private VPC / Kubernetes / Helm data-plane deployment, private self-hosted model binding, SAML/OIDC SSO & SCIM, custom MCP/ERP connectors, dedicated SLA & architecture onboarding *(Roadmap)*.
- **How it works:** Deploys SOPIN Runtime, Gateway, and Context entirely inside customer cloud/on-prem boundaries while honoring uniform SOPIN blueprint and Control policies.
- **Typical workflow:** Architecture workshop -> Deploy VPC data plane -> Connect corporate IdP & internal models -> Govern workspace rollout.
- **Integrations:** Private cloud VPCs, internal IdPs, private vLLM/Bedrock/Vertex endpoints, corporate SIEM.
- **Example use cases:** Firm-wide AI standardization across engineering, legal, finance, and R&D operations.
- **Security & governance:** Zero customer data leaves private perimeter; full auditability & RBAC control *(Roadmap)*.
- **Related products:** SOPIN Control, SOPIN Runtime, Security & Trust Center.
- **Primary CTA:** `Contact Enterprise Team` (`/contact?topic=enterprise`).

---

## 4.12 SOPIN Decisions (`/decisions`) — *Core Architecture (Preview) · Live in `/app` Prototype*

- **Tagline:** *Make business logic executable.*
- **What it is:** A deterministic business rules and decision automation engine uniting visual IF/ELSE rules, spreadsheet decision tables (with `first-match`, `priority`, `collect-all`, and `unique` hit policies), ordered rulesets, sequential rule chains, and explainable weighted scorecards.
- **Architectural Boundaries (Non-Negotiable):**
  - **SOPIN Decisions vs. SOPIN Control:** `Decisions` evaluates deterministic business outcomes (thresholds, pricing, eligibility, SLAs). `Control` enforces RBAC permissions, human approval policies, and spend limits.
  - **SOPIN Decisions vs. SOPIN Studio / Graph:** `Studio` AI-assisted drafting translates natural language into editable `Draft` rule specs only—agents cannot bypass review or publish rules, and runtime evaluation never relies on LLM guessing.
  - **SOPIN Decisions vs. SOPIN Flow:** `Flow` executes dedicated `Decision Node` steps deterministically and branches on returned structured outputs.
- **Canonical Schemas (`src/decisions/types.ts`):** `RuleSpec`, `DecisionTableSpec`, `RulesetSpec`, `RuleChainSpec`, `ScorecardSpec`, `DecisionExecutionSpec`.
- **Planned Production Runtime:** Python **FastAPI** + **Pydantic** contract validation, **PostgreSQL** versioned rule storage, **CEL** (Common Expression Language) restricted evaluator, **Temporal** Flow Decision Nodes, and **OpenTelemetry** execution spans.

