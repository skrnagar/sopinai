# SOPIN — Trust, Security, Enterprise Readiness & Phased Implementation Roadmap

**Platform:** SOPIN (`sopin.ai`) · **Parent Group:** SONIL Group  
**Transparency Commitment:** All security, governance, and enterprise capabilities below distinguish clearly between **Already Implemented (UI/Local Prototype)**, **Architectural Design Principles (Preview)**, **Planned Build Phases**, and **Future Enterprise Verification**. Zero compliance certifications, customer logos, or active backend SLAs are fabricated or implied.

---

## 1. Trust, Security & Enterprise Readiness Requirements

A dedicated Trust & Security Center (`/security`) and corresponding backend controls must address 14 core domains:

| Domain | Public Website & Security Docs Requirement | Target Technical Architecture Control |
|--------|--------------------------------------------|---------------------------------------|
| **1. Authentication & Identity** | Document supported auth flows transparently (`Planned`). | OIDC / SAML 2.0 SSO, SCIM directory sync, short-lived signed session tokens, MFA enforcement. |
| **2. Organization & Workspace Isolation** | Explain logical multi-tenant boundaries vs. dedicated VPC options *(local workspace separation already previewed in `/app`)*. | Organization -> Workspace -> Project hierarchy; row-level tenant isolation in PostgreSQL + namespaced Redis & Context vector partitions. |
| **3. Role-Based Access Control (RBAC)** | Publish standard role taxonomy (*Owner, Admin, Builder, Operator, Reviewer, Viewer*). | Policy middleware enforced at FastAPI API layer and Runtime action dispatch. |
| **4. Fine-Grained Permissions** | Show how agents receive tool-level `read` vs. `write` scopes rather than blanket access. | Per-node capability manifests (`allowedTools`, `deniedTools`, resource scope filters) validated prior to execution. |
| **5. API Key & Credential Management** | Explain BYOK and MCP secret handling (never stored inside prompts, `localStorage`, or client browsers). | Server-side encrypted secret vault (envelope encryption / KMS); ephemeral short-lived tokens injected into runtime workers only at step invocation. |
| **6. Secure Tool Execution** | Detail how external APIs and MCP servers are constrained. | Strict schema validation on tool inputs/outputs; parameterized connectors; explicit timeouts & payload size caps. |
| **7. Sandboxing** | Explain code interpreter and local MCP execution boundaries. | Ephemeral containers / microVMs with read-only rootfs, zero host filesystem access, CPU/RAM limits, and `disabled` or `allowlist-only` network egress. |
| **8. Audit Trails** | Describe structured event capture (`Planned` immutable ledger). | Append-only audit table logging actor, workspace, blueprint version, retrieved document IDs, Gateway route, tool call params, and human approval sign-offs. |
| **9. Human Approvals** | Show durable pause-and-resume gates for high-impact mutations *(interactive queue previewed in `/app`)*. | `humanGate` checkpoints persist run state in durable storage and require RBAC-authorized operator approval before resuming mutating steps. |
| **10. Usage Limits & Cost Controls** | Explain loop prevention (`maxSteps`) and spend ceilings (`Planned`). | Hard cycle ceilings on `SOPIN Graph`, token/request rate quotas per workspace, and monthly budget thresholds at `SOPIN Gateway`. |
| **11. Data Privacy** | Clarify model training policy & pre-inference sanitization. | Explicit commitment that customer data is never used to train external foundation models; pre-inference PII redaction at Gateway; configurable trace TTLs. |
| **12. Deployment Choices** | Clearly distinguish **SOPIN Cloud** (Managed) vs. **SOPIN Enterprise** (Private VPC / Self-Hosted / Hybrid Data Plane). | Same declarative blueprint runs across SOPIN-hosted cloud workers or customer-hosted Runtime/Gateway inside private networks. |
| **13. Enterprise Administration** | Provide clear admin workflow expectations (`Control`). | Centralized org policy templates, SIEM audit log streaming, IdP group mapping, and workspace quota management. |
| **14. Security Documentation** | Launch `/security` with responsible disclosure contact (`security@sopin.ai` / SONIL Group intake), architecture docs, and honest status taxonomy. | Maintain living Security Architecture documentation linked from Header (`Company`), Footer, `/app`, and `/enterprise`. |

---

## 2. Eight-Phase Practical Implementation Roadmap

> **Baseline Already Completed in Current Repo (Pre-Phase 1):** Mobile-first `/app` PWA workspace prototype with workspace isolation + Recharts 30-day performance telemetry, client-side `404` (`NotFoundPage`), `React.lazy` code splitting (`PageSkeleton`), removal of the old `ResourcesPage` debug error button, Mega-Menu edge alignment (`Navbar.tsx`), and `--color-sopin-muted: #5E5E6E`.  
> **Planning Principle:** No unrealistic calendar dates. Phases are sequenced strictly by technical dependencies, risk reduction, and verifiable Definition of Done criteria.

---

### Phase 1 — SEO Foundations, Residual Contrast/UX Fixes & Design System Extraction
- **Deliverables:** Add `<link rel="canonical">` + `<meta name="robots" content="noindex">` on `NotFoundPage` and `/app`; add `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`; replace 4 remaining `#777786` glyphs (`HomePage.tsx`, `AgentPerformanceChart.tsx`) with `#5E5E6E`; wire real `POST /api/contact` intake & remove prototype text from `ContactPage.tsx`; extract shared UI primitives (`Button`, `Tabs` with ARIA tablist, `SurfaceCard`, `DataTable`, `Dialog`, `Tooltip`, `FormField`); add React `ErrorBoundary` around `<main>` and `/app`.
- **Dependencies:** Approved audit documents (`docs/SOPIN_*.md`); preserved SOPIN 6-prong emblem & `#101014`/`#FFFFFF`/`#101126`/`#6252E8`/`#965BFF` system.
- **Engineering Tasks:** Decompose `ProductPreviews.tsx` (`1,065` lines), `sopinData.ts` (`949` lines), `AppBuildView.tsx` (`1,320` lines), and `useAppWorkspaceStore.ts` (`1,187` lines); self-host geometric WOFF2 fonts; ensure semantic `<a href>` on navigation cards/mega-menu links.
- **Design Tasks:** Convert `<640px` `ProductPreviews` 8-tab matrix to a horizontal snap strip; standardize `<DataTable>` and `<TelemetryChart>` visual specs.
- **Testing Requirements:** `tsc --noEmit`, `npm run lint`, Vite production build, accessibility contrast & keyboard navigation scan, responsive zero-overflow check (`375px`, `768px`, `1024px`, `1440px`).
- **Acceptance Criteria:** Zero `#777786` leftovers; working `/api/contact` submission; canonical & `noindex` meta verified; zero uncaught crash boundaries.
- **Risks:** Breaking existing `#hash` anchor links (`/platform#gateway`) -> **Mitigation:** Maintain scroll-to-anchor compatibility in `useRoute.ts`.
- **Definition of Done:** Clean build, modular UI primitive library, live contact endpoint, and refactored codebase ready for multi-page scaling.

---

### Phase 2 — Public Website Expansion, Content Engine & SSG/GEO Rollout
- **Deliverables:** Expand `HomePage` to the 18-section narrative (adding *Models & Multimodal Intelligence*, *Evaluations & Observability*, and *Documentation & Learning*); launch dedicated pages for all 11 product modules (`Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, `Enterprise`), 8 Solution pages (`Document Intelligence`, `Machine Learning`, `Multi-Agent`, etc.), `/security` Trust Center, bookmarkable `/docs/:slug` + `Cmd+K` search, full-text `/resources/:slug` hosting the 16-article calendar, and Company sub-pages (`Vision & Mission`, `SONIL Group`, `Careers`, `Partners`).
- **Dependencies:** Phase 1 Design System primitives, decomposed data modules, and contact intake.
- **Engineering Tasks:** Implement Vite SSG/pre-rendering generating crawlable HTML per route with HTTP `404` support; inject route-specific JSON-LD (`SoftwareApplication`, `TechArticle`, `FAQPage`, `Organization`); render Markdown/MDX docs & resource guides.
- **Design Tasks:** Author interactive architectural visuals for *Models & Multimodal Gateway*, *Flow (DAG) vs. Graph (Cyclic)*, *ML Engineer Preview*, and *Security/Control Architecture*.
- **Testing Requirements:** Per-route SEO metadata/canonical audit; internal broken-link check (`0` unexpected 404s); mobile Lighthouse performance & accessibility audit.
- **Acceptance Criteria:** Every Navbar mega-menu link resolves to a dedicated, crawlable page cleanly labeled `Core Architecture (Preview)` or `Planned`.
- **Risks:** Shallow placeholder pages -> **Mitigation:** Ship deep technical architecture diagrams and real documentation/16 core guides first.
- **Definition of Done:** Full 35+ route public platform architecture pre-rendered, crawlable, and verified end-to-end.

---

### Phase 3 — FastAPI Backend Core, Auth & `/app` Workspace Persistence
- **Deliverables:** Stand up Python **FastAPI + PostgreSQL + Redis** control plane; migrate existing `/app` `SopinAppShell` & `useAppWorkspaceStore` from `localStorage` onto authenticated multi-tenant APIs; implement OIDC/SAML login, workspace RBAC (`Owner`/`Admin`/`Builder`/`Reviewer`/`Viewer`), and server-side KMS secret/BYOK credential vault.
- **Dependencies:** Phase 1 decomposed `/app` state hooks; provisioned PostgreSQL & Redis infrastructure.
- **Engineering Tasks:** Define FastAPI org/workspace/project/secret schemas; auto-generate TypeScript client from `/openapi.json`; replace synthetic store mutations with authenticated REST + optimistic updates; ensure zero credentials ever serialize to the browser.
- **Design Tasks:** Design sign-in/SSO flows, masked secret creation UI, member role invite views, and loading/error skeleton states for real API latency.
- **Testing Requirements:** Cross-tenant isolation integration tests (`403` strictly enforced across workspaces); CSRF/session security tests; E2E onboarding test.
- **Acceptance Criteria:** Users authenticate, switch real isolated workspaces across devices, and store encrypted BYOK credentials cleanly.
- **Risks:** Cross-workspace data leaks -> **Mitigation:** Enforce org/workspace authorization dependencies centrally at FastAPI query boundaries.
- **Definition of Done:** Multi-tenant FastAPI + `/app` workspace shell deployed to staging with passing isolation tests.

---

### Phase 4 — Live SOPIN Studio, Flow & Graph Authoring Parity
- **Deliverables:** Upgrade `/app` Build tab into persistent, versioned **SOPIN Studio** (NL prompt-to-blueprint backend service, visual **Flow** DAG designer, **Graph** cyclic state editor with `maxSteps` validation, and Git/CLI `@sopin/sdk` bidirectional sync) plus browsable starter templates.
- **Dependencies:** Phase 3 workspace & blueprint persistence in PostgreSQL.
- **Engineering Tasks:** Lock canonical versioned Blueprint JSON schema (`v1`); build deterministic cycle/schema validator; implement bidirectional TS `@sopin/sdk` <-> Blueprint parser/generator.
- **Design Tasks:** Interactive node property drawer, typed Zod/JSON schema builder, blueprint diff modal, and undo/redo history controls.
- **Testing Requirements:** Round-trip fidelity tests (NL -> Blueprint -> SDK -> Visual Canvas); compiler rejection tests on unbounded loops or invalid schemas.
- **Acceptance Criteria:** Non-technical users compile validated flows from English prompts while engineers inspect and sync identical specs via Git/CLI.
- **Risks:** Visual graph divergence from code representation -> **Mitigation:** Treat canonical Blueprint JSON as single source of truth rendered identically in Studio and SDK.
- **Definition of Done:** Versioned Studio/Flow/Graph blueprints persisted, validated, and synced across UI and SDK.

---

### Phase 5 — Live SOPIN Gateway, Context RAG & MCP/A2A Protocols
- **Deliverables:** Production **SOPIN Gateway** (multi-provider LLM + multimodal parsing + failover + strict JSON schema enforcement + pre-inference PII redaction), live **SOPIN Context** (document/image/structured ingestion, `pgvector`/hybrid retrieval, immutable span checksums, ACL filters), and **MCP / A2A** tool & peer registry.
- **Dependencies:** Phase 4 blueprints & Phase 3 encrypted secret vault.
- **Engineering Tasks:** Build FastAPI Gateway inference router; wire PII redaction pipeline; build async Context chunking/indexing workers storing provenance hashes; implement live MCP client transport (`stdio`/`HTTP`) and A2A peer envelope routing.
- **Design Tasks:** Real Context corpus inspector (chunk previews, checksums, ACL tags), Gateway failover profile editor, MCP scope confirmation matrix.
- **Testing Requirements:** Provider failover tests, schema repair/rejection tests, ACL cross-tenant retrieval isolation tests (`0` unauthorized chunks leaked), MCP capability boundary tests.
- **Acceptance Criteria:** Agents execute grounded retrieval with verifiable citations and call scoped MCP tools & A2A peers safely without exposing raw keys.
- **Risks:** Retrieval + redaction tail latency -> **Mitigation:** Cache schema validators in Redis and parallelize pre-inference redaction & retrieval lookups.
- **Definition of Done:** Live Gateway, provenance-backed Context RAG, and MCP/A2A protocols operating reliably in staging.

---

### Phase 6 — Durable SOPIN Runtime, Human-in-the-Loop & Live Observe
- **Deliverables:** Live **SOPIN Runtime** (Temporal-backed durable execution + isolated sandboxed containers/microVMs with egress allowlists), real pause/resume **human approval gates**, framework adapters (**LangGraph / CrewAI / Google ADK**), and real-time **SOPIN Observe** streaming spans + Recharts telemetry powered by real execution logs.
- **Dependencies:** Phase 4 workflows/graphs + Phase 5 Gateway/Context/MCP layers.
- **Engineering Tasks:** Wire FastAPI dispatch into Temporal workers; provision isolated sandbox compute for code/MCP steps; emit OpenTelemetry spans & Redis pub/sub SSE events (`AppRunView` / `Observe`); persist durable human-approval signals.
- **Design Tasks:** Real-time SSE span waterfall, graph superstep state-diff viewer, sandbox egress indicator badges, checkpoint replay trigger.
- **Testing Requirements:** Worker crash-and-resume recovery tests; sandbox egress block tests; SSE reconnect resilience; load tests under long human pauses.
- **Acceptance Criteria:** Multi-step runs survive worker crashes, pause cleanly for human review, run code without unauthorized egress, and stream live telemetry into the 30-day chart.
- **Risks:** Sandbox cold-start latency -> **Mitigation:** Maintain warm pre-initialized sandbox pools with strict post-step filesystem wipe.
- **Definition of Done:** Durable sandboxed execution and live Observe tracing validated under failure-injection & concurrency tests.

---

### Phase 7 — SOPIN Evaluate, SOPIN Control & Security Hardening
- **Deliverables:** Live **SOPIN Evaluate** (golden datasets curated from Observe runs, deterministic + grounding + rubric assertions, CI release CLI gate) and live **SOPIN Control** (strict RBAC enforcement, fine-grained MCP write gates, SLA approval inbox, token/compute budget caps, immutable audit ledger + SIEM export).
- **Dependencies:** Phase 6 Observe telemetry & Runtime checkpoints.
- **Engineering Tasks:** Build async evaluation runner & baseline diff engine; enforce RBAC & budget limits inline at Gateway & Runtime; add append-only audit log table + SIEM export workers; complete external security/penetration testing before public GA.
- **Design Tasks:** Benchmark comparison tables/charts, enterprise approval escalation inbox, budget alert configuration, audit filter & export UI.
- **Testing Requirements:** CI eval regression blocking tests, RBAC privilege-escalation negative tests, budget hard-stop tests, audit completeness validation.
- **Acceptance Criteria:** Teams block prompt/model regressions via CI; admins enforce least-privilege tool access, spend ceilings, and auditable approvals.
- **Risks:** Slow evaluation suites -> **Mitigation:** Run fast deterministic assertions first and cache baseline benchmark outputs.
- **Definition of Done:** Evaluate and Control production-hardened, security-audited, and documented transparently in `/security`.

---

### Phase 8 — Enterprise VPC, ML/DL Lifecycle & Ecosystem Expansion
- **Deliverables:** **SOPIN Enterprise** private VPC / BYOC / self-hosted Helm data plane; full **AI/ML Engineer Lifecycle** (`/solutions/machine-learning` + `/app` ML views: dataset upload, profiler, feature transforms, PyTorch/fine-tune jobs, benchmark matrix, Model Registry -> Gateway inference); multimodal batch media pipelines; public `/templates` Marketplace, `/changelog`, `/community`, and live `/status` telemetry.
- **Dependencies:** Phase 7 security hardening & Phase 6 durable runtime stability.
- **Engineering Tasks:** Package containerized Enterprise Data Plane; build Python GPU/CPU ML compute worker pool + Model Registry feeding Gateway profiles; implement batch OCR/audio/video pipelines; launch curated template publishing & automated `/status` health probes.
- **Design Tasks:** Dataset quality profiler UI, training experiment metrics/loss charts, Enterprise cluster topology viewer, public Template Marketplace cards.
- **Testing Requirements:** Private VPC/air-gapped smoke tests; GPU ML checkpoint recovery tests; multi-region soak testing.
- **Acceptance Criteria:** Enterprises operate SOPIN cleanly inside private infrastructure; ML engineers train, evaluate, register, and invoke custom models alongside LLMs under unified governance.
- **Risks:** Scope sprawl across ML + Infra -> **Mitigation:** Anchor ML workflows tightly onto SOPIN Runtime compute, Evaluate harnesses, and Gateway routing rather than cloning full notebook IDEs.
- **Definition of Done:** SOPIN delivers a complete, model-independent, enterprise-grade AI engineering and execution platform under SONIL Group.

---

## 3. SOPIN Decisions Integration & Security Separation

- **Implemented in Prototype (`/decisions`, `/app` Decisions tab & Flow Decision Node):**
  - Pure deterministic evaluator (`src/decisions/evaluator.ts`) without `eval`/`Function`.
  - Visual nested AND/OR Rule Builder, spreadsheet Decision Table editor, Rulesets, Rule Chains, Scorecards, Expected-vs-Actual batch tests, Execution Inspector, Environment Promotion (`Draft -> Tested -> Published -> Archived`), and SOPIN Flow Decision Node binding.
  - SOPIN Studio natural-language rule drafting creates `Draft` specs only and flags ambiguous phrases for mandatory human review.
- **Planned Production Architecture:** Migrate local workspace state to Python **FastAPI + Pydantic + PostgreSQL** versioned snapshots evaluated via **CEL** inside isolated **SOPIN Runtime** / **Temporal** Decision Nodes with **OpenTelemetry** span export and **SOPIN Control** RBAC enforcement.

