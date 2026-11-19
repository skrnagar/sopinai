# SOPIN — Trust, Security, Enterprise Readiness & Phased Implementation Roadmap

**Platform:** SOPIN (`sopin.ai`) · **Parent Group:** SONIL Group  
**Transparency Commitment:** All security, governance, and enterprise capabilities below distinguish clearly between **Architectural Design Principles (Preview)**, **Planned Build Phases**, and **Future Enterprise Verification**. Zero compliance certifications, customer logos, or active SLAs are fabricated or implied.

---

## 1. Trust, Security & Enterprise Readiness Requirements

A dedicated Trust & Security Center (`/security`) and corresponding platform engineering controls must address 14 core domains:

| Domain | Public Website & Security Docs Requirement | Target Technical Architecture Control |
|--------|--------------------------------------------|---------------------------------------|
| **1. Authentication & Identity** | Document supported auth flows transparently (`Planned`). | OIDC / SAML 2.0 SSO, SCIM directory sync, short-lived signed session tokens, MFA enforcement. |
| **2. Organization & Workspace Isolation** | Explain strict logical multi-tenant boundaries vs. dedicated VPC options. | Organization -> Workspace -> Project hierarchy; row-level tenant isolation in PostgreSQL + namespaced Redis & Context vector partitions. |
| **3. Role-Based Access Control (RBAC)** | Publish standard role taxonomy (*Owner, Admin, Builder, Operator, Reviewer, Viewer*). | Policy middleware enforced at FastAPI API layer and Runtime action dispatch. |
| **4. Fine-Grained Permissions** | Show how agents receive tool-level read vs. write scopes rather than blanket permissions. | Per-node capability manifests (`allowedTools`, `deniedTools`, resource scope filters) validated prior to execution. |
| **5. API Key & Credential Management** | Explain BYOK and MCP tool secret handling (never stored inside prompt text or client browser). | Server-side encrypted secret vault (envelope encryption / KMS); ephemeral short-lived tokens injected into runtime workers only at step invocation. |
| **6. Secure Tool Execution** | Detail how external APIs and MCP servers are constrained. | Schema validation on all tool inputs/outputs; parameterized connectors; explicit timeout & payload size limits. |
| **7. Sandboxing** | Explain code interpreter and local MCP execution boundaries. | Ephemeral containers / microVMs with read-only rootfs, no host filesystem/metadata access, CPU/RAM caps, and `disabled` or `allowlist-only` network egress. |
| **8. Audit Trails** | Describe structured event capture (`Planned` immutable ledger). | Append-only audit events capturing actor, workspace, blueprint version, retrieved document IDs, Gateway route, tool call params, and human approval sign-off. |
| **9. Human Approvals** | Show durable pause-and-resume gates for high-impact mutations. | `humanGate` checkpoints persist run state in durable storage and require RBAC-authorized operator approval before resuming mutating steps. |
| **10. Usage Limits & Cost Controls** | Explain loop prevention (`maxSteps`) and spend ceilings (`Planned`). | Hard step/cycle limits on `SOPIN Graph`, token/request rate quotas per workspace, and monthly budget thresholds at `SOPIN Gateway`. |
| **11. Data Privacy** | Clarify training policy & pre-inference sanitization. | Explicit commitment that customer workflow data is never used to train third-party models; pre-inference PII redaction transforms at Gateway; configurable trace retention TTLs. |
| **12. Deployment Choices** | Clearly distinguish **SOPIN Cloud** (Managed) vs. **SOPIN Enterprise** (Private VPC / Self-Hosted / Hybrid Data Plane). | Same declarative blueprint runs across SOPIN-hosted cloud workers or customer-hosted Runtime/Gateway inside private networks. |
| **13. Enterprise Administration** | Provide clear admin workflow expectations (`Control`). | Centralized org policy templates, SIEM audit log streaming, IdP group mapping, and workspace quota management. |
| **14. Security Documentation** | Launch `/security` with responsible disclosure contact (`security@sopin.ai` / SONIL Group intake), architecture whitepaper, and status transparency. | Maintain living Security Architecture docs linked from Header (`Company`), Footer, and `/enterprise`. |

---

## 2. Eight-Phase Practical Implementation Roadmap

> **Planning Principle:** No unrealistic calendar promises or arbitrary dates. Phases are sequenced by strict engineering dependencies, risk reduction, and verifiable Definition of Done criteria.

---

### Phase 1 — Brand, Website Audit Fixes & Design System Foundation
- **Deliverables:** Fix P0 routing (`404` page, canonical tags, remove debug error toggles); extract reusable Design System primitives (`Button`, `Tabs`, `SurfaceCard`, `DataTable`, `Dialog`, `Tooltip`, `FormField`); fix WCAG AA light-mode contrast tokens (`#5B5B6B`); decompose `ProductPreviews.tsx` & `sopinData.ts`; self-host geometric fonts.
- **Dependencies:** Approved audit documents (`docs/SOPIN_*.md`); preserved SOPIN radial logo & color tokens.
- **Engineering Tasks:** Modularize components under `src/design-system/`; implement `React.lazy` + `ErrorBoundary`; fix navbar mega-menu edge clamping at `1024px–1279px`; add `robots.txt`, `sitemap.xml`, and `llms.txt`.
- **Design Tasks:** Finalize token spec (`index.css`), button/tab/table specs, and responsive `<640px` horizontal preview tab strip.
- **Testing Requirements:** `tsc --noEmit`, Vite production build check, automated axe-core accessibility audit across light/dark modes, breakpoint inspection (`375px`, `768px`, `1024px`, `1440px`).
- **Acceptance Criteria:** Zero soft-404s; zero debug controls in public UI; WCAG AA `>= 4.5:1` contrast verified; zero horizontal overflow on all routes.
- **Risks:** Breaking existing deep-link anchors (`/platform#gateway`) -> **Mitigation:** Preserve anchor aliases during route refactor.
- **Definition of Done:** Clean build, documented UI primitive library, and passing accessibility/responsive audit on existing 12 routes.

---

### Phase 2 — Public Website Expansion, Content & SEO/GEO Rollout
- **Deliverables:** Expand `HomePage` to the 18-section narrative; launch dedicated pages for all 11 products (`Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, `Enterprise`), 8 Solution pages, `/security` Trust Center, `/docs/:slug`, `/resources/:slug` full articles, Company subpages (`Careers`, `Partners`, `SONIL Group`), and wire real `POST /api/contact` intake + static SSG pre-rendering.
- **Dependencies:** Phase 1 Design System primitives & modular router.
- **Engineering Tasks:** Implement SSG/pre-rendering pipeline for crawlable HTML snapshots; add per-route JSON-LD (`SoftwareApplication`, `TechArticle`, `FAQPage`, `Organization`); build searchable `/docs/:slug` & `/resources/:slug` markdown/structured renderer; wire Express/FastAPI contact submission with validation & rate limiting.
- **Design Tasks:** Author interactive diagrams for *Models & Multimodal Gateway*, *Flow vs. Graph comparison*, *ML Engineer preview*, and *Security/Control architecture*.
- **Testing Requirements:** SEO metadata/canonical verification per route; broken-link crawl check (`0` 404 internal links); real contact form submission + error state verification; mobile Lighthouse performance check.
- **Acceptance Criteria:** Every item in Platform, Solutions, Developers, Resources, and Company mega menus resolves to a dedicated, crawlable, rich page with accurate `Core Architecture` vs. `Planned` labeling.
- **Risks:** Content bloat or uneven quality across 30+ pages -> **Mitigation:** Ship high-rigor specs for the initial 16 editorial articles first rather than shallow placeholder stubs.
- **Definition of Done:** Full target IA live, crawlable, mobile-verified, and backed by real lead/waitlist intake.

---

### Phase 3 — SOPIN Application Shell & Workspaces
- **Deliverables:** Authenticated web application shell (`app.sopin.ai` / `/app/*`), organization/workspace switcher, user identity (OIDC/SAML/session), project dashboard, encrypted secret/BYOK credential manager, and FastAPI + PostgreSQL + Redis backend core.
- **Dependencies:** Phase 1 Design System + provisioned PostgreSQL/Redis + FastAPI API foundation.
- **Engineering Tasks:** Build FastAPI auth/session + org/workspace RBAC schema; auto-generate TypeScript OpenAPI client; implement React Query/API client layer, project CRUD, secret vault UI (write-only masked inputs), and empty/loading/error shells.
- **Design Tasks:** Design dense application shell (left sidebar rail, top workspace switcher, `Cmd+K` palette, notification/toast system, keyboard shortcuts).
- **Testing Requirements:** Multi-tenant isolation integration tests (cross-workspace access strictly `403`); auth/CSRF/session expiry tests; UI E2E onboarding test.
- **Acceptance Criteria:** Users sign in, create an isolated workspace, store a scoped credential safely (never returned in plaintext to browser), and create/open a blueprint project.
- **Risks:** Tenant isolation bugs -> **Mitigation:** Enforce workspace ID scoping at every DB query/policy dependency in FastAPI.
- **Definition of Done:** Authenticated, multi-tenant workspace shell deployed in staging with passing tenant-isolation security tests.

---

### Phase 4 — SOPIN Studio, Flow & Graph Authoring
- **Deliverables:** Live interactive **SOPIN Studio** (Natural Language intent compiler, visual DAG builder for **Flow**, cyclic state-graph editor for **Graph**, and 1:1 bidirectional `@sopin/sdk` JSON/TS blueprint serialization + Git sync) and starter **Agent Templates**.
- **Dependencies:** Phase 3 App Shell & project blueprint persistence in PostgreSQL.
- **Engineering Tasks:** Define canonical versioned Blueprint JSON schema (`Studio`/`Flow`/`Graph`); build interactive graph canvas (zoom/pan, typed node ports, cycle validation); implement `@sopin/sdk` parser/serializer and dry-run validator.
- **Design Tasks:** Node inspector drawer, schema builder UI, Flow vs. Graph mode affordances, natural-language-to-graph diff review UI.
- **Testing Requirements:** Schema round-trip tests (NL -> Blueprint -> SDK -> Canvas with zero data loss); compiler cycle-guard tests (`maxSteps` validation).
- **Acceptance Criteria:** Non-technical users compile a working blueprint from text; developers edit and export valid TypeScript `@sopin/sdk` definitions from the same project.
- **Risks:** Canvas state complexity & undo/redo bugs -> **Mitigation:** Use immutable blueprint state snapshots with deterministic validation before save.
- **Definition of Done:** Bidirectional Studio/Flow/Graph authoring persisted, versioned, and validated end-to-end.

---

### Phase 5 — SOPIN Context, Model Gateway & Protocol Integrations (MCP & A2A)
- **Deliverables:** Live **SOPIN Gateway** (multi-provider LLM + multimodal routing, strict JSON schema enforcement, fallback rules, PII redaction filter), **SOPIN Context** (document/image/structured ingestion, chunking, hybrid retrieval, provenance checksums, ACL filters), and **MCP / A2A** connector registry.
- **Dependencies:** Phase 4 Blueprint schema & Phase 3 secret vault.
- **Engineering Tasks:** Build FastAPI Gateway proxy supporting commercial, open-weight, and custom endpoints; implement pre-inference PII redactor & JSON schema validator; build Context ingestion workers (PDF/Markdown/tabular -> embeddings + pgvector/index + checksums); implement MCP client handshake (`stdio`/`HTTP`) and A2A task envelope router.
- **Design Tasks:** Context corpus explorer UI (chunk preview, checksums, ACL tags), Gateway route configurator, MCP tool permission matrix UI.
- **Testing Requirements:** Fallback failover tests, schema repair/rejection tests, cross-tenant retrieval isolation tests (must return 0 unauthorized chunks), MCP capability boundary tests.
- **Acceptance Criteria:** Agents retrieve citation-backed passages respecting ACL tags and invoke external tools via MCP and peer agents via A2A through Gateway without exposing provider keys.
- **Risks:** Latency spikes on hybrid retrieval + redaction -> **Mitigation:** Streamline Gateway pipeline with Redis caching for schema validators and parallelized retrieval.
- **Definition of Done:** Live Gateway, Context RAG with provenance, and MCP/A2A bindings operating reliably in staging.

---

### Phase 6 — SOPIN Runtime, Durable Execution & Live Observability
- **Deliverables:** Live **SOPIN Runtime** (isolated container/microVM sandboxes with configurable egress allowlists), durable workflow engine (**Temporal** or equivalent checkpointed execution), **human-in-the-loop pause/resume** execution, and live **SOPIN Observe** span waterfall & state-diff viewer.
- **Dependencies:** Phase 4 Flow/Graph specs + Phase 5 Gateway/Context/MCP layers.
- **Engineering Tasks:** Wire FastAPI dispatch into durable workflow workers; provision isolated sandbox worker pool for code/MCP execution; stream execution spans via Redis pub/sub -> FastAPI SSE -> Observe UI; implement durable `humanGate` suspend/resume signal API; build LangGraph/CrewAI/ADK adapter wrappers.
- **Design Tasks:** Real-time Observe waterfall timeline, node state-diff inspector, sandbox security status badge, interactive checkpoint replay trigger.
- **Testing Requirements:** Worker crash recovery / checkpoint resume tests; sandbox escape & blocked egress network tests; SSE stream resilience under reconnects.
- **Acceptance Criteria:** Long-running multi-step workflows survive worker restarts, pause cleanly for human approval, run untrusted tools without network egress, and stream complete span traces to Observe.
- **Risks:** Sandbox provisioning cold-start latency -> **Mitigation:** Warm standby worker pools with strict per-run reset.
- **Definition of Done:** Durable, sandboxed execution + live Observe tracing validated under load and failure-injection tests.

---

### Phase 7 — Evaluation, Governance & Enterprise Security Hardening
- **Deliverables:** Live **SOPIN Evaluate** (golden datasets, deterministic & grounding assertions, model/prompt benchmarking, CI CLI gate) and **SOPIN Control** (organization RBAC enforcement, fine-grained tool allowlists, human approval inbox, token/compute budget caps, immutable audit log + SIEM export).
- **Dependencies:** Phase 6 Observe span store & checkpointed runtime.
- **Engineering Tasks:** Build dataset curation from Observe traces; implement async eval runner & regression diff engine; enforce RBAC & budget middleware across Gateway and Runtime; implement immutable append-only audit table + CSV/JSON/webhook SIEM export; conduct external penetration test & dependency/container security audits.
- **Design Tasks:** Evaluate comparison matrix & charts, Control approval queue inbox, RBAC policy matrix editor, budget threshold alert configuration.
- **Testing Requirements:** Regression gate CI tests, RBAC privilege-escalation negative tests, budget hard-cap enforcement tests, audit completeness verification.
- **Acceptance Criteria:** Teams block bad prompt/model changes in CI via Evaluate; admins enforce tool scopes, spend ceilings, and approval workflows via Control with full auditability.
- **Risks:** Eval runner cost/time bottlenecks -> **Mitigation:** Parallelize deterministic checks before LLM-judge assertions and cache baseline dataset runs.
- **Definition of Done:** Evaluate and Control operational, hardened against abuse/runaway spend, and documented cleanly in `/security`.

---

### Phase 8 — Enterprise Scale & Advanced Intelligence Capabilities
- **Deliverables:** **SOPIN Enterprise** private VPC / BYOC / self-hosted deployment topology, **ML/DL Lifecycle Workflows** (dataset profiler, distributed training/fine-tuning orchestration, model registry linked into Gateway), **Multimodal Processing Pipelines** (native audio/video/OCR batch flows), and public **Agent Marketplace / Community Templates** + **Changelog** + **Live Status**.
- **Dependencies:** Phase 7 security hardening & Phase 6 durable runtime stability.
- **Engineering Tasks:** Package Helm/Terraform/containerized Enterprise Data Plane connecting securely to Control Plane or running self-contained; add Python ML worker pools & Model Registry service feeding Gateway routes; implement multimodal pipeline nodes; launch curated template publishing pipeline.
- **Design Tasks:** ML experiment comparison & loss curve charts, Enterprise cluster/region topology UI, public Agent Template directory & Changelog experience.
- **Testing Requirements:** Air-gapped / private VPC installation smoke tests; GPU/ML worker fault tolerance tests; high-concurrency soak testing.
- **Acceptance Criteria:** Enterprise customers deploy SOPIN Runtime + Gateway inside their own VPC; ML engineers train, evaluate, register, and serve custom models directly inside SOPIN workflows.
- **Risks:** Scope sprawl across ML + Enterprise infra -> **Mitigation:** Anchor ML workflows strictly around SOPIN Runtime compute, Evaluate benchmarks, and Gateway registration rather than building a redundant notebook IDE clone.
- **Definition of Done:** SOPIN operates as a complete, model-independent, enterprise-ready AI engineering and execution platform under SONIL Group.
