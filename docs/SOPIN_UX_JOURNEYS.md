# SOPIN — End-to-End Persona UX Journeys

**Objective:** Map complete end-to-end journeys across SOPIN's five core user personas—from public website discovery into interactive product workflows—explicitly defining screens, interactions, decision points, error states, empty states, and success states.

---

## Audit of Current Prototype Coverage by Persona

| Persona | Current Public Website Support | Primary UX Gaps Identified |
|---------|-------------------------------|----------------------------|
| **A. Non-technical business user** | Covered conceptually in *Natural Language* creation tab & *Business Automation* solution. | No interactive "Describe a task -> Preview generated agent" sandbox; technical jargon (`MCP`, `Zod`, `SHA-256`) dominates top-of-funnel copy. |
| **B. Automation builder** | Well supported by `/workflow-automation` (`SOPIN Flow` branch simulator). | Missing trigger/connector catalog, step-by-step test run log simulation, and template starter library. |
| **C. AI developer** | Strongly supported across Hero, Stack Explorer, `/studio`, `/developers`, and `/docs`. | Docs lack URL-addressable subpages (`/docs/:slug`), `Cmd+K` search, and live copyable template starters. |
| **D. AI/ML engineer** | **Critically underserved (P1).** Only one merged `#data-ml` solution card. | No screens or previews for dataset upload, exploratory validation, model training/fine-tuning orchestration, evaluation benchmarks, or model registry binding in Gateway. |
| **E. Enterprise administrator** | Partially shown via `Control` approval queue preview (`ProductPreviews`). | **P1 Gap:** Missing Trust & Security page (`/security`), organization/RBAC policy matrix demo, budget/quota controls, and audit export views. |

---

## Journey A: Non-Technical Business User
**Goal:** *Describe a task -> create an agent -> connect knowledge -> approve actions -> receive deliverables.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Discovery** | Homepage Hero / `/studio` | Reads plain-language value prop (`"Build AI agents that deliver work"`); clicks `"Natural Language"` authoring tab. | Choose starting from plain English vs. an existing Business Template. | Template filter shows 0 matches -> `"Reset filters or describe a custom task"`. | Network fail loading templates -> Retry prompt. | Understands Studio compiles plain English into an inspectable workflow. |
| **2. Describe Task** | Studio Prompt Composer (`/studio` & App Workspace) | Types task: *"Summarize weekly vendor contracts and flag renewal clauses."* | Confirm suggested output fields (e.g., vendor name, renewal date, risk flag). | Blank prompt box with 3 clickable starter examples. | Vague/underspecified prompt (<15 chars) -> Inline guidance suggesting what output & triggers to specify. | Structured blueprint graph + readable summary card generated. |
| **3. Connect Knowledge** | Context Connector Picker (`SOPIN Context`) | Selects folder/corpus (`Vendor Contracts`) via OAuth/file upload. | Choose read-only scope & whether external web search is disallowed. | `"No knowledge sources connected yet"` -> Upload PDF/DOCX or connect Drive/SharePoint. | Unsupported file type or oversized upload -> Clear format/size rule + skip option. | Corpus indexed; passage count & source preview shown. |
| **4. Approve Actions** | Approval Gate Setup & Inbox (`SOPIN Flow` + `Control`) | Toggles `"Require my approval before sending summary email"`. | Approve, Edit draft, or Reject proposed deliverable in review queue. | `"No pending approvals—all tasks are up to date."` | Expired approval session -> Offer safe re-evaluation without duplicate sends. | Action approved and recorded in activity timeline. |
| **5. Receive Deliverables** | Deliverable Output Panel | Downloads formatted Markdown/PDF/CSV brief with clickable source citations. | Export, schedule weekly recurrence, or share with team. | `"Run scheduled—first deliverable will appear here."` | Citation grounding check failed -> Highlights unverified line for manual review. | Verified brief delivered with full source links. |

---

## Journey B: Automation Builder
**Goal:** *Choose trigger -> design workflow -> connect integrations -> test -> publish -> monitor.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Choose Trigger** | `/flow` & Flow Canvas Trigger Drawer | Picks trigger type (`Webhook`, `Schedule/Cron`, `Queue Event`, `Email/Ticket`). | Define payload schema or sample JSON event. | `"Select a trigger to start this workflow."` | Invalid cron syntax or malformed webhook JSON -> Field-level validation message. | Trigger node locked with sample payload fixture. |
| **2. Design Workflow** | `SOPIN Flow` Visual DAG Canvas | Adds extraction, Gateway classifier, conditional branch (`risk == elevated`), and retry policy nodes. | Branching logic: Auto-route standard cases vs. pause elevated cases for human sign-off. | Empty canvas shows 3 starter DAG skeletons (`Triage`, `Doc Extract`, `Sync`). | Cyclic loop accidentally created inside strict DAG -> Suggest switching node/subgraph to `SOPIN Graph`. | Validated acyclic graph with green edge types. |
| **3. Connect Integrations** | Integration & MCP Binding Drawer | Selects MCP server / REST connector and scopes permissions (`read-only` vs. `write`). | Select scoped credential profile (never raw plaintext keys in flow JSON). | `"No connectors configured in this workspace"` -> Add MCP or REST connector. | Credential auth expired or permission scope denied -> Inline reconnect CTA. | Connector health check passes (`Scoped Read/Write Verified`). |
| **4. Test** | Flow Dry-Run & Step Simulator | Runs test fixture; inspects step-by-step inputs, outputs, and branch path taken. | Choose between `Standard Payload` vs. `Edge/Failure Payload`. | `"Run a test payload to inspect node outputs."` | Upstream timeout or schema validation failure -> Highlights failing node + retry behavior. | All test steps green; expected branch and outputs confirmed. |
| **5. Publish** | Release & Version Modal | Tags version (`v1.2`), reviews diff against previous active flow, clicks `Publish`. | Deploy to Staging vs. Production environment. | First publish shows `"Initial v1.0 release checklist"`. | Missing required approval policy on write tool -> Blocks publish until gate added. | Endpoint/schedule active and immutable version saved. |
| **6. Monitor** | `SOPIN Observe` Flow Runs Table | Filters runs by status (`Completed`, `Paused`, `Failed`), opens execution waterfall. | Replay failed step from last durable checkpoint vs. inspect DLQ payload. | `"Waiting for first live trigger event."` | Dead-letter item detected -> Clear `"Inspect & Replay"` button. | Healthy run throughput and zero unhandled DLQ items. |

---

## Journey C: AI Developer
**Goal:** *Create project -> select model -> configure tools -> build graph -> evaluate -> deploy.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Create Project** | `/docs/quickstart` & CLI (`npx @sopin/cli init`) | Initializes workspace; chooses TypeScript (`@sopin/sdk`) or Python (`sopin-sdk` planned); opens in Studio/IDE. | Code-first repo sync vs. Studio-created project exported to Git. | Empty repo scaffold includes sample `sopin.config.ts` and sample test. | Node/Python runtime version mismatch -> Clear version requirement error. | Local dev workspace boots with schema validation active. |
| **2. Select Model** | `SOPIN Gateway` Profile Config | Configures `reasoning-structured` primary route + `deterministic-fast` fallback + Zod output schema. | Managed Gateway route vs. BYOK / self-hosted endpoint. | `"No model routes configured—select a default profile."` | Provider rate limit or strict JSON schema violation -> Auto-triggers repair/fallback policy or surfaces exact Zod error path. | Model route returns schema-compliant structured JSON. |
| **3. Configure Tools** | MCP & A2A Manifest Editor | Registers `mcpTool("git.diff")` and `a2aPeer("citation-auditor")` with `networkEgress: "disabled"`. | Read-only vs. sandboxed mutating tool execution. | `"0 tools bound—agent operates in pure reasoning mode."` | MCP server handshake fail / tool schema mismatch -> Displays exact tool contract diff. | Tools discovered, typed, and sandboxed. |
| **4. Build Graph** | `SOPIN Graph` Editor / SDK | Defines shared typed state, cyclic edges (`planner -> researcher -> verifier`), and `maxSteps: 6`. | Cyclic `Graph` execution vs. linear `Flow` step. | Starter boilerplate graph with entry/exit nodes. | Unbounded cycle detected (no termination condition or missing `maxSteps`) -> Compiler error blocks unsafe deploy. | Graph compiles cleanly and renders 1:1 in Studio. |
| **5. Evaluate** | `SOPIN Evaluate` CLI / Dashboard | Runs golden dataset (`sopin eval run`); inspects assertion pass rates & latency/cost comparison. | Promote `v2` prompt/model route vs. hold for prompt/context fix. | `"No evaluation dataset linked—import 5 runs from Observe."` | Regression detected (`grounding_score` dropped or schema failed) -> CI exit code non-zero. | All assertions pass; regression diff approved. |
| **6. Deploy** | `SOPIN Runtime` Deploy | Runs `sopin deploy`; provisions isolated runtime workers + versioned endpoint. | Canary rollout (10%) vs. full promotion. | `"No active deployments."` | Missing environment secrets or failing health probe -> Automatic rollback to previous version. | Versioned endpoint live and emitting OpenTelemetry traces. |

---

## Journey D: AI/ML Engineer *(Currently Underserved — P1 Addition)*
**Goal:** *Upload data -> explore -> transform -> train model -> evaluate -> register -> deploy.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Upload Data** | `/solutions/machine-learning` & Data Workspace | Uploads structured CSV/Parquet, image/audio corpus, or connects warehouse/object store. | Training/fine-tuning dataset vs. RAG evaluation corpus. | `"Drop datasets or connect S3/GCS/PostgreSQL read view."` | Schema drift, corrupted encoding, or PII violation detected -> Flags columns for redaction/repair. | Dataset ingested with immutable snapshot hash. |
| **2. Explore** | Dataset Profiler & Quality Inspector | Inspects class distributions, missing values, token lengths, and duplicate records. | Split ratio (train/val/test) & stratification rule. | `"Select a dataset version to inspect profile metrics."` | Severe class imbalance or data leakage warning between splits -> Surfaces actionable warning. | Clean, profiled dataset ready for transformation. |
| **3. Transform** | Feature / Preprocessing Pipeline (`Flow` ML Worker) | Chains deterministic Python transforms (normalization, tokenization, multimodal frame/audio extraction). | CPU transform pool vs. GPU preprocessing worker. | `"No preprocessing steps added."` | Memory overflow or NaN propagation in transform -> Pinpoints exact transform step & sample row. | Versioned feature artifact stored cleanly. |
| **4. Train Model** | Training / Fine-Tuning Job Console (`Runtime` Compute) | Selects base open-weight model / PyTorch/XGBoost script, hyperparameters, and compute profile. | Full fine-tune vs. LoRA adapter vs. classical ML pipeline. | `"No training runs launched."` | OOM or divergence/NaN loss -> Saves last valid checkpoint + logs GPU telemetry. | Training converges; artifact checkpoints persisted. |
| **5. Evaluate** | `SOPIN Evaluate` ML Benchmark Matrix | Compares validation metrics (F1/RMSE/BLEU/task accuracy) + latency/cost against baseline model. | Promote candidate model vs. iterate hyperparameters. | `"Select 2+ runs to view side-by-side benchmark."` | Validation metric below threshold or eval timeout -> Blocks promotion automatically. | Candidate beats baseline on accuracy & latency budget. |
| **6. Register** | Model Registry & `Gateway` Binding | Registers model (`custom-classifier:v3`) with lineage metadata (dataset hash + eval report). | Assign stage (`Staging`, `Shadow`, `Production`). | `"Registry empty—register a validated run."` | Missing model card / provenance link -> Blocks Production tag. | Model registered and immediately selectable as a `SOPIN Gateway` route. |
| **7. Deploy** | `SOPIN Runtime` / `Gateway` Inference Endpoint | Exposes model behind unified Gateway API so agents & workflows invoke it seamlessly via `gateway.infer(...)`. | Autoscaling serverless inference vs. dedicated GPU replica. | `"0 active endpoints."` | Container cold-start timeout or health failure -> Rolls back cleanly. | Agents call custom ML model natively alongside LLMs. |

---

## Journey E: Enterprise Administrator *(Currently Underserved — P1 Addition)*
**Goal:** *Create organization -> manage identity -> set policies -> assign permissions -> monitor agents -> audit activity.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Create Organization** | `/enterprise` & Org Onboarding Console | Provisions organization under SONIL Group / Private VPC; sets residency region & workspaces (`Eng`, `Ops`, `Finance`). | SOPIN Cloud (isolated org) vs. Self-Hosted / BYOC Data Plane. | `"Create your first workspace to isolate teams and corpora."` | Domain verification failure or VPC peering timeout -> Step-by-step DNS/network diagnostic. | Organization & isolated workspaces active. |
| **2. Manage Identity** | `SOPIN Control` Identity & SSO | Configures SAML 2.0 / OIDC SSO and SCIM group sync; maps IdP groups to workspace roles. | Enforce SSO-only login & session TTL limits. | `"Local owner account only—connect IdP for team SSO."` | Invalid IdP metadata XML or clock skew -> Clear SAML assertion diagnostic. | Users authenticate seamlessly via corporate IdP. |
| **3. Set Policies** | `SOPIN Control` Policy Engine | Enables pre-inference PII redaction, blocks unapproved external model providers, sets monthly token/compute spend caps. | Hard-block vs. alert-only enforcement mode per workspace. | `"Default baseline safety policy active—customize rules."` | Conflicting policy rules (e.g., workspace requests blocked provider) -> Highlights rule conflict before save. | Organization-wide guardrails enforced across Gateway & Runtime. |
| **4. Assign Permissions** | RBAC & Tool Allowlist Matrix | Assigns least-privilege scopes: *Finance Ops* gets `read` on ERP & `write` only behind `humanGate`; *Interns* restricted to sandboxed read-only tools. | Per-role vs. per-agent service credential binding. | `"No custom tool policies—default read-only posture active."` | Over-privileged wildcard (`*` write) attempt -> Requires explicit admin confirmation warning. | Every agent & user bounded by explicit least-privilege RBAC. |
| **5. Monitor Agents** | `SOPIN Observe` + `Control` Fleet View | Reviews active agents, pending human approval queues, spend burn against budget caps, and flagged policy blocks. | Throttle noisy workflow, rotate compromised credential, or approve escalated action. | `"No active agent runs in selected time window."` | Budget threshold (90%/100%) or anomaly spike -> Triggers webhook/PagerDuty/Slack alert & optional auto-pause. | Real-time visibility across all organizational agents. |
| **6. Audit Activity** | Immutable Audit Ledger (`Control`) | Filters audit trail by actor, workspace, tool call, data classification, and approval sign-off; exports JSON/CSV to SIEM. | Time-window & compliance export format selection. | `"No audit events match filter criteria."` | SIEM webhook delivery failure -> Queues retry with dead-letter alert. | Complete, verifiable chain of custody from prompt to human approval to tool action. |
