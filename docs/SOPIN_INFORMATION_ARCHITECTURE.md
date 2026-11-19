# SOPIN — Information Architecture & Product Specifications

**Platform:** SOPIN (`sopin.ai`) — Unified AI Agent Engineering, Automation & Execution Platform  
**Parent Organization:** SONIL Group  

---

## 1. Architectural Taxonomy: Preventing Category Confusion

A critical weakness in the AI ecosystem—and a subtle risk in the existing SOPIN `/platform` anchors—is blurring distinct infrastructure layers. SOPIN must explicitly separate five categories so technical buyers and enterprise architects understand what each module is and how it compares to external tools:

| Layer | Definition | SOPIN Module(s) | Comparable External Category |
|-------|------------|-----------------|------------------------------|
| **1. Authoring IDE & Typed Framework** | Where humans and engineers define agent roles, schemas, graphs, and SDK code. | **SOPIN Studio**, **@sopin/sdk**, **SOPIN Graph** | LangGraph (graph DSL), CrewAI (role framework), IDE builders |
| **2. Workflow Automation Engine** | Deterministic DAG orchestration, triggers, schedules, branching, retries, and webhook glue. | **SOPIN Flow** | Temporal workflows, n8n/Zapier-class orchestration (upgraded with AI gates) |
| **3. Context & Memory Plane** | Structured working state, episodic memory, multimodal parsing, RAG indexes, and ACL provenance. | **SOPIN Context** | Vector DBs + custom RAG pipelines + Mem0/Zep-style memory |
| **4. Model, Tool & Protocol Gateway** | Vendor-neutral inference routing, schema locking, PII redaction, and MCP/API unification. | **SOPIN Gateway** | LiteLLM / OpenRouter + MCP tool proxy |
| **5. Secure Execution Runtime** | Isolated containers/sandboxes, durable state checkpointing, and bounded compute execution. | **SOPIN Runtime** | AWS Bedrock AgentCore Runtime, E2B sandboxes, Temporal workers |
| **6. Verification & Enterprise Control Plane** | Tracing, evaluation harnesses, RBAC, spend budgets, approval queues, and audit logs. | **SOPIN Observe**, **SOPIN Evaluate**, **SOPIN Control**, **SOPIN Enterprise** | LangSmith + enterprise IAM/policy plane |

---

## 2. Navigation Hierarchy & Governance

### Problem with Existing Navigation
The current navbar has 6 top-level items (`Platform`, `Solutions`, `Developers`, `Resources`, `Pricing`, `Company`), where `Platform` holds 8 links (4 of which point to `#anchors` on `/platform`) and `Company` is a single link to `/about` with no dropdown. Expanding to 40+ pages without structuring top-level triggers would overwhelm users.

### Recommended Top-Level Navbar (6 Clean Triggers)
Keep **6 top-level items** on desktop so the header remains spacious, scannable, and single-row at `1024px+`:

1. **Platform** *(Mega Menu — 3 grouped columns + Platform Overview rail)*
2. **Solutions** *(Mega Menu — 2 columns covering 8 domain blueprints)*
3. **Developers** *(Mega Menu — 2 columns covering Docs, APIs, SDKs, MCP/A2A, Templates, OSS)*
4. **Resources** *(Mega Menu — Blog, Research, Tutorials, Guides, Case Studies, Academy, Updates, Community)*
5. **Pricing** *(Direct Link -> `/pricing`)*
6. **Company** *(Compact Dropdown — About SOPIN, Vision & Mission, SONIL Group, Trust & Security, Careers, Partners, Contact)*

Primary header CTA remains **Start Building** (`/docs` -> interactive quickstart), paired with **Theme Toggle** (and optional secondary `Contact` inside Company/Hero/Footer rather than crowding the header).

---

## 3. Complete Proposed Sitemap & URL Taxonomy

### A. Platform (`/platform` + 11 Product Routes)
| Label | Target URL | Implementation Status | Notes |
|-------|------------|-----------------------|-------|
| **Platform Overview** | `/platform` | Existing (Needs Refactor) | Architecture hub + interactive layer diagram |
| **SOPIN Studio** | `/studio` | Existing (Needs Enhancement) | Multi-modal authoring IDE |
| **SOPIN Flow** | `/flow` *(redirect/alias `/workflow-automation`)* | Existing (Preserve alias) | Deterministic workflow automation |
| **SOPIN Context** | `/context` | Existing (Needs Multimodal/ACL) | Knowledge, RAG, memory, context engineering |
| **SOPIN Graph** | `/graph` | **NEW (P1)** | Cyclic state graphs & multi-agent A2A coordination |
| **SOPIN Runtime** | `/runtime` | **NEW (P1)** | Durable, sandboxed execution compute |
| **SOPIN Gateway** | `/gateway` | **NEW (P1)** | Model, multimodal, API, tool & MCP gateway |
| **SOPIN Observe** | `/observe` | **NEW (P1 · Planned)** | Execution tracing, span logs & live monitoring |
| **SOPIN Evaluate** | `/evaluate` | **NEW (P1 · Planned)** | Golden datasets, assertions & benchmarking |
| **SOPIN Control** | `/control` | **NEW (P1 · Planned)** | Policies, RBAC, human approvals, budgets & audit |
| **SOPIN Cloud** | `/cloud` | **NEW (P2 · Planned)** | Managed global control & serverless runtime |
| **SOPIN Enterprise** | `/enterprise` | **NEW (P1 · Roadmap)** | Private VPC, BYOC, air-gapped & governed deployments |

### B. Solutions (`/solutions/*`)
| Label | Target URL | Implementation Status |
|-------|------------|-----------------------|
| **Solutions Overview** | `/solutions` | Existing (Refactor to hub) |
| **Business Automation** | `/solutions/business-automation` | **NEW (P1)** (from `#business-automation`) |
| **AI Research** | `/solutions/ai-research` | **NEW (P1)** (from `#ai-research`) |
| **Software Engineering** | `/solutions/software-engineering` | **NEW (P1)** (from `#software-engineering`) |
| **Data Intelligence** | `/solutions/data-intelligence` | **NEW (P1)** (split from `#data-ml`) |
| **Machine Learning** | `/solutions/machine-learning` | **NEW (P1)** (dedicated ML/DL workflow solution) |
| **Enterprise AI** | `/solutions/enterprise-ai` | **NEW (P1)** (from `#enterprise-ai`) |
| **Document Intelligence** | `/solutions/document-intelligence` | **NEW (P1)** (PDF/OCR/multimodal extraction) |
| **Multi-Agent Applications** | `/solutions/multi-agent` | **NEW (P1)** (A2A supervisor/swarm systems) |

### C. Developers (`/developers/*` & `/docs/*`)
| Label | Target URL | Implementation Status |
|-------|------------|-----------------------|
| **Developer Overview** | `/developers` | Existing (Expand) |
| **Documentation** | `/docs` & `/docs/:slug` | Existing (Add nested routes) |
| **API Reference** | `/developers/api` | **NEW (P1)** |
| **SDKs (TS & Python)** | `/developers/sdks` | **NEW (P1)** |
| **MCP Integrations** | `/developers/mcp` | **NEW (P1)** |
| **A2A Interoperability** | `/developers/a2a` | **NEW (P1)** |
| **Agent Templates** | `/templates` | **NEW (P2)** |
| **Open Source** | `/developers/open-source` | **NEW (P2 · Coming Soon)** |
| **GitHub and Community** | `/community` | **NEW (P2)** |

### D. Resources (`/resources/*`)
- `/resources` (Unified filterable catalog), `/resources/:slug` (full article pages)
- Filtered views/tracks: **Engineering Blog** (`/resources/blog`), **AI Research** (`/resources/research`), **Tutorials** (`/resources/tutorials`), **Guides** (`/resources/guides`), **Case Studies** (`/resources/case-studies` · Coming Soon), **AI Academy** (`/academy` · Planned), **Product Updates** (`/changelog`), **Community** (`/community`).

### E. Company & Trust Destinations
- `/about` (About SOPIN + Vision & Mission + SONIL Group overview)
- `/sonil-group` (or dedicated section/page explaining SONIL Group backing)
- `/security` (Trust & Security Center — **Separate P1 destination**, essential for enterprise buyers)
- `/pricing` (Separate destination — **Keep separate**, critical commercial anchor)
- `/templates` (Marketplace / Agent & Connector Templates — **Separate P2/P3 destination** once templates scale; start under Developers/Templates)
- `/changelog` (Product Updates — **Separate P2 destination**, high developer trust signal)
- `/status` (Platform Status — **External/Separate P3 destination** once SOPIN Cloud enters live beta; do not deploy fake green uptime bars while in pre-release)
- `/careers`, `/partners`, `/contact`

---

## 4. Individual Product Page Specifications (All 11 Products)

> **Transparency Rule:** Every product page must display a status indicator: `Core Architecture (Preview)`, `Planned`, or `Future Vision`—never implying unbuilt services are live in production today.

---

### 4.1 SOPIN Studio (`/studio`) — *Core Architecture (Preview)*
- **What it is:** A unified authoring workbench uniting natural-language task specification, visual workflow editing, cyclic graph design, and bidirectional TypeScript/Python SDK code parity.
- **Problem it solves:** Eliminates the handoff chasm where non-technical builders prototype in disconnected no-code tools that engineers must rewrite from scratch in code.
- **Who uses it:** Business builders, automation architects, AI engineers.
- **Main capabilities:** Natural language-to-spec compiler, visual node inspector, typed JSON Schema/Zod contract editor, prompt & variable versioning, bidirectional Git/SDK sync.
- **How it works:** Users describe intent or drag nodes; Studio compiles everything into a canonical declarative JSON/TS blueprint executed identically by Runtime.
- **Typical workflow:** Describe goal -> Review generated blueprint -> Bind context & MCP tools -> Inspect input/output schemas -> Export to Git or deploy to Flow/Runtime.
- **Integrations:** `@sopin/sdk`, Git repositories, SOPIN Context indexes, MCP tool manifests, SOPIN Gateway profiles.
- **Example use cases:** Authoring a compliance intake triage agent; drafting an engineering PR auditor; rapid prototyping of research teams.
- **Security & governance:** Zero ambient workspace secrets inside prompts; schema constraints validated at design time.
- **Related products:** SOPIN Flow, SOPIN Graph, SOPIN Context.
- **Primary CTA:** `Explore Studio Quickstart` (`/docs/quickstart`).

---

### 4.2 SOPIN Flow (`/flow`, alias `/workflow-automation`) — *Core Architecture (Preview)*
- **What it is:** Deterministic workflow automation and DAG orchestration engine for repeatable, event-driven pipelines combining code, APIs, multimodal parsing, and LLM steps.
- **Problem it solves:** Purely autonomous agent loops are unpredictable and expensive for structured business processes that require explicit branches, retries, and SLA checkpoints.
- **Who uses it:** Automation builders, operations engineers, backend developers.
- **Main capabilities:** Webhook/cron/queue triggers, typed conditional branching, parallel fan-out/fan-in, bounded exponential retries, dead-letter routing, durable pause/resume human gates.
- **How it works:** Executes each node as an idempotent step persisted to durable state, passing typed artifacts along directed edges.
- **Typical workflow:** Select trigger -> Extract document/payload -> Branch on schema condition -> Call MCP tool -> Pause for human sign-off -> Emit deliverable.
- **Integrations:** Webhooks, message queues, relational databases, REST/GraphQL APIs via Gateway, MCP tool servers.
- **Example use cases:** Invoice exception reconciliation, customer onboarding document verification, scheduled executive reporting.
- **Security & governance:** Per-step credential scoping, deterministic retry limits, mandatory human gate nodes on mutating actions.
- **Related products:** SOPIN Studio, SOPIN Runtime, SOPIN Control.
- **Primary CTA:** `View Flow Specification` (`/docs`).

---

### 4.3 SOPIN Context (`/context`) — *Core Architecture (Preview)*
- **What it is:** Structured knowledge, multimodal RAG, episodic session state, and working memory plane with verifiable provenance.
- **Problem it solves:** Dumping raw files into model prompts causes context rot, hallucinations, cost spikes, and cross-tenant data leakage.
- **Who uses it:** AI engineers, data engineers, enterprise knowledge architects.
- **Main capabilities:** 3-tier memory isolation (ephemeral run state, episodic session history, versioned knowledge corpora); hybrid vector + lexical + metadata retrieval; multimodal ingestion (PDF, images, audio transcripts, structured tables — *ingestion pipelines partially planned*); document checksum & span-offset provenance.
- **How it works:** Ingests and chunks approved sources with classification tags, filters queries by tenant/role ACL before retrieval, and binds immutable citation checksums to every chunk returned to an agent.
- **Typical workflow:** Connect document/data source -> Configure chunking & classification ACL -> Bind index to agent node -> Enforce citation grounding assertions.
- **Integrations:** Object stores, Git/docs repositories, SQL/warehouse read views, vector indexes, document parsers.
- **Example use cases:** Policy-grounded compliance Q&A, codebase ADR lookup, clinical/legal literature synthesis.
- **Security & governance:** Pre-retrieval tenant and classification filtering; automatic expiration of ephemeral run state.
- **Related products:** SOPIN Gateway, SOPIN Evaluate, SOPIN Control.
- **Primary CTA:** `Inspect Context SDK` (`/developers/sdks`).

---

### 4.4 SOPIN Graph (`/graph`) — *Core Architecture (Preview) · Dedicated Page MISSING*
- **What it is:** Cyclic state-machine and multi-agent collaboration engine for supervisor-worker, debate, reflection, and A2A peer handoff topologies.
- **Problem it solves:** Linear DAG workflows break down when complex tasks require iterative planning, tool feedback loops, self-correction, or specialized agent handoffs.
- **Who uses it:** AI systems engineers, multi-agent application developers, researchers.
- **Main capabilities:** Shared typed graph state, bounded cycle/step ceilings (`maxSteps`), conditional edge reducers, sub-graph composition, native Agent-to-Agent (A2A) protocol delegation, framework adapter compatibility (LangGraph-style state graph patterns).
- **How it works:** Agents read/update a strongly-typed shared state object across bounded supersteps; transitions fire deterministically based on state predicates or structured router decisions.
- **Typical workflow:** Define shared state schema -> Register specialized peer nodes (Planner, Researcher, Verifier) -> Set cycle guardrails -> Run & inspect state diffs.
- **Integrations:** A2A protocol endpoints, `@sopin/sdk` state graph API, LangGraph/CrewAI adapter layers *(planned)*, SOPIN Runtime.
- **Example use cases:** Multi-agent competitive research, autonomous repository debugging with test-fix loops, multi-step financial due diligence.
- **Security & governance:** Hard `maxSteps` and token budget breakers to prevent infinite agent loops; scoped A2A capability tokens per peer.
- **Related products:** SOPIN Studio, SOPIN Flow, SOPIN Runtime, SOPIN Observe.
- **Primary CTA:** `Explore Multi-Agent Topologies` (`/solutions/multi-agent`).

---

### 4.5 SOPIN Runtime (`/runtime`) — *Core Architecture (Preview) · Dedicated Page MISSING*
- **What it is:** Secure, durable execution environment for running agents, code interpreters, MCP servers, and long-lived stateful workflows.
- **Problem it solves:** Running LLM-generated code or external tool calls directly inside application web servers introduces RCE risks, timeout failures, and lost progress during human approvals.
- **Who uses it:** Platform engineers, DevOps/infrastructure leads, AI engineers.
- **Main capabilities:** Ephemeral container/microVM sandboxes, configurable network egress allowlists (`disabled` or `allowlist-only`), durable checkpoint persistence across hours/days of pause, idempotent tool execution, multimodal/ML compute worker pools *(planned)*.
- **How it works:** Orchestrator dispatches tool and inference steps to isolated worker sandboxes; every completed node checkpoints state cleanly so workflows survive restarts and pause for human input without holding compute open.
- **Typical workflow:** Configure runtime profile (CPU/RAM/egress) -> Bind MCP servers -> Execute long-running workflow -> Pause/resume across checkpoints.
- **Integrations:** Temporal/durable execution backends, container/sandbox engines, MCP `stdio`/`HTTP` transports, Python ML workers.
- **Example use cases:** Untrusted unit test execution, sandboxed Python data analysis, multi-day procurement approval workflows.
- **Security & governance:** Zero ambient host credentials, ephemeral filesystems purged post-step, strict resource quotas.
- **Related products:** SOPIN Flow, SOPIN Graph, SOPIN Gateway, SOPIN Enterprise.
- **Primary CTA:** `Inspect Runtime Isolation Spec` (`/security`).

---

### 4.6 SOPIN Gateway (`/gateway`) — *Core Architecture (Preview) · Dedicated Page MISSING*
- **What it is:** Unified, model-independent Model, Multimodal, API, and MCP Gateway providing single-point routing, schema enforcement, and policy sanitization.
- **Problem it solves:** Hardcoding vendor SDKs scatters API keys across services, causes outages when providers throttle, and leaks sensitive PII prior to inference.
- **Who uses it:** AI platform engineers, backend developers, security architects.
- **Main capabilities:** Multi-provider routing across Frontier/Open-Weight/Self-Hosted models (text, vision, audio, embeddings), strict JSON Schema output enforcement & repair, pre-inference PII redaction, automatic fallback/timeout failover, unified API/MCP tool proxy, per-workspace rate/cost limits *(planned)*.
- **How it works:** Applications call a single typed Gateway route profile (`reasoning-structured`, `deterministic-fast`, `vision-extract`); Gateway sanitizes inputs, selects the optimal model/tool endpoint, validates response schemas, and falls back cleanly on error.
- **Typical workflow:** Register provider keys or BYOK endpoints -> Define routing & fallback YAML -> Enforce output schema -> Monitor route health.
- **Integrations:** Commercial LLM providers, self-hosted vLLM/Ollama endpoints, embedding/reranker models, external REST/MCP servers.
- **Example use cases:** Vendor-failover routing, PII-safe document extraction, switching seamlessly between reasoning and low-latency models.
- **Security & governance:** Centralized secret vaulting, pre-inference redaction filters, spend caps *(planned)*.
- **Related products:** SOPIN Context, SOPIN Runtime, SOPIN Control.
- **Primary CTA:** `View Gateway Policy Reference` (`/docs`).

---

### 4.7 SOPIN Observe (`/observe`) — *Planned Roadmap Module · Dedicated Page MISSING*
- **What it is:** End-to-end execution observability platform providing span waterfalls, state diffs, prompt/context lineage, and replay debugging.
- **Problem it solves:** Standard APM tools show HTTP latency but cannot explain *why* an agent chose a wrong tool, which retrieved chunk misled it, or how graph state mutated across cycles.
- **Who uses it:** AI engineers, SREs, automation operators.
- **Main capabilities:** Waterfall span traces (Flow -> Context -> Gateway -> MCP -> Control), graph state diff viewer per superstep, cost/token/latency attribution per node, time-travel replay from checkpoint *(planned)*.
- **How it works:** Emits structured OpenTelemetry-compatible agent spans from Flow, Graph, Gateway, and Runtime into an indexed trace store.
- **Typical workflow:** Inspect failed/flagged run -> Expand span payload & retrieved chunks -> Compare state diff -> Re-run modified prompt against exact snapshot.
- **Integrations:** OpenTelemetry collectors, SOPIN Evaluate datasets, SOPIN Runtime checkpoints.
- **Example use cases:** Debugging multi-agent loop regressions, diagnosing retrieval misses, tracking per-workflow token consumption.
- **Security & governance:** Sensitive payload masking inside trace logs based on user RBAC clearance.
- **Related products:** SOPIN Evaluate, SOPIN Graph, SOPIN Runtime.
- **Primary CTA:** `Preview Observe Interface` (`/platform` / `#preview`) or `Request Preview Updates` (`/contact`).

---

### 4.8 SOPIN Evaluate (`/evaluate`) — *Planned Roadmap Module · Dedicated Page MISSING*
- **What it is:** Automated testing, evaluation, regression gating, and model benchmarking harness for agents, workflows, and ML pipelines.
- **Problem it solves:** Teams hesitate to update prompts, models, or retrieval indexes because they have no repeatable way to prove changes didn't break production behavior.
- **Who uses it:** AI/ML engineers, QA leads, product engineers.
- **Main capabilities:** Golden test datasets (curated from Observe traces), deterministic assertions (JSON schema, regex, tool-call order, cost/latency caps), citation/grounding checks, LLM-as-judge rubrics, side-by-side model route & prompt benchmarking, CI/CD release gates *(planned)*.
- **How it works:** Executes candidate agent/workflow versions over curated input suites and compares assertions against baseline runs before promoting to production.
- **Typical workflow:** Curate dataset from production traces -> Define deterministic + rubric assertions -> Run matrix across 2 model profiles -> Block merge if grounding score drops.
- **Integrations:** GitHub Actions / CI pipelines, SOPIN Observe traces, SOPIN Gateway profiles.
- **Example use cases:** Benchmarking open-weight vs. frontier models on internal tasks, preventing hallucinated citations in CI, ML model validation.
- **Security & governance:** Ensures eval datasets respect PII sanitization rules; blocks unverified workflow promotions.
- **Related products:** SOPIN Observe, SOPIN Studio, SOPIN Gateway.
- **Primary CTA:** `Explore Verification Patterns` (`/resources`).

---

### 4.9 SOPIN Control (`/control`) — *Planned Roadmap Module · Dedicated Page MISSING*
- **What it is:** Enterprise governance, policy enforcement, RBAC, human-in-the-loop approval queue, budget cap, and immutable audit control plane.
- **Problem it solves:** Autonomous agents holding write access to internal APIs create unacceptable security, compliance, and runaway-spend risks without centralized policy enforcement.
- **Who uses it:** Enterprise Security Leads, IT Administrators, Compliance Officers, Operations Managers.
- **Main capabilities:** Organization/workspace RBAC, fine-grained per-agent tool allowlists (`read` vs. `write`), human approval queues with SLAs/escalation, token & compute budget ceilings, immutable audit trails *(all explicitly labeled Planned)*.
- **How it works:** Evaluates declarative policies prior to Gateway inference and Runtime tool invocation; suspends execution into the Control approval queue whenever an action crosses a configured risk threshold.
- **Typical workflow:** Define workspace roles & budgets -> Restrict mutating MCP tools -> Route flagged runs to human queue -> Export audit records.
- **Integrations:** Enterprise SSO/OIDC/SAML *(planned)*, secret vaults, SIEM/audit exporters *(planned)*.
- **Example use cases:** Requiring finance sign-off before invoice writes, capping departmental AI spend, auditing every tool mutation.
- **Security & governance:** This *is* the governance core of SOPIN.
- **Related products:** SOPIN Enterprise, SOPIN Gateway, SOPIN Runtime.
- **Primary CTA:** `Review Governance Architecture` (`/security`).

---

### 4.10 SOPIN Cloud (`/cloud`) — *Planned Managed Infrastructure · Dedicated Page MISSING*
- **What it is:** Fully managed, multi-region cloud hosting for SOPIN Studio, Flow, Context, Gateway, Runtime, Observe, Evaluate, and Control.
- **Problem it solves:** Teams want to build and ship reliable AI agents immediately without provisioning Kubernetes clusters, vector stores, sandbox workers, and durable queues themselves.
- **Who uses it:** Startups, product teams, innovation labs, mid-market engineering orgs.
- **Main capabilities:** Zero-ops Studio & Flow hosting, elastic sandbox workers, managed Context indexes, pay-as-you-go or BYOK Gateway routing, workspace isolation *(Planned)*.
- **How it works:** Managed control plane and isolated execution workers hosted under SOPIN / SONIL Group cloud infrastructure.
- **Typical workflow:** Sign up -> Connect model keys or managed Gateway -> Deploy Studio blueprint -> Monitor runs in Cloud.
- **Integrations:** Cloud OAuth connectors, GitHub sync, external webhooks, managed vector/object stores.
- **Example use cases:** Launching customer-facing AI workflows or internal team automations in minutes.
- **Security & governance:** Tenant isolation, encrypted secret storage, regional deployment choices *(Planned)*.
- **Related products:** SOPIN Enterprise, SOPIN Pricing.
- **Primary CTA:** `Join Cloud Preview Waitlist` (`/contact?topic=cloud-preview`).

---

### 4.11 SOPIN Enterprise (`/enterprise`) — *Roadmap Architecture · Dedicated Page MISSING*
- **What it is:** Private, dedicated, or hybrid (BYOC / VPC / air-gapped) deployment topology with full organizational governance and SONIL Group engineering partnership.
- **Problem it solves:** Regulated enterprises cannot send proprietary data, source code, or operational credentials to multi-tenant public SaaS AI tools.
- **Who uses it:** Enterprise CTOs, CISOs, Platform Architecture Teams.
- **Main capabilities:** Dedicated VPC / self-hosted Runtime & Gateway, private model endpoint binding, SSO/SAML & custom RBAC *(planned)*, custom MCP adapter engineering, dedicated SLA & architecture onboarding via SONIL Group.
- **How it works:** Deploys SOPIN Runtime, Gateway, and Context data planes inside the customer's private network perimeter while keeping governance policies centralized.
- **Typical workflow:** Architecture scoping with SONIL Group -> Deploy data plane in private VPC -> Connect internal IdP & MCP servers -> Roll out governed workspaces.
- **Integrations:** Private VPC endpoints, internal Kubernetes/cloud infrastructure, enterprise identity providers, private model deployments.
- **Example use cases:** Enterprise-wide AI platform standardization across finance, R&D, software engineering, and operations.
- **Security & governance:** Zero data egress outside customer boundary when self-hosted; full RBAC & audit trail alignment *(Planned)*.
- **Related products:** SOPIN Control, SOPIN Runtime, Security & Trust Center.
- **Primary CTA:** `Engage SONIL Group Architecture Team` (`/contact?topic=enterprise`).
