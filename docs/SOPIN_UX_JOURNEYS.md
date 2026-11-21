# SOPIN — End-to-End Persona UX Journeys

**Objective:** Audit current UX coverage across SOPIN's five core user personas—across both the public website and the `/app` mobile-first workspace prototype—and specify complete end-to-end journeys covering screens, interactions, decision points, empty states, error states, and success states.

---

## Audit of Current Implementation Coverage by Persona

| Persona | Public Website Support | `/app` Interactive Prototype Coverage | Primary Remaining UX Gaps |
|---------|------------------------|---------------------------------------|---------------------------|
| **A. Non-technical business user** | Covered conceptually via Studio's *Natural Language* tab & *Business Automation* card. | **Well supported locally:** 5-step Agent Studio wizard & NL prompt-to-spec compiler (`AppBuildView`), local file/URL upload (`AppKnowledgeView`), 1-tap human approval queue (`AppHomeView` / `AppRunView`). | Public `/studio` page still lacks an inline NL prompt-to-agent quick-try box; all `/app` artifacts stay local (`localStorage`) with no real email/CRM export yet. |
| **B. Automation builder** | Supported via `/workflow-automation` (`SOPIN Flow` branch simulator). | **Well supported locally:** Vertical mobile Flow designer with trigger/step/branch/gate nodes (`AppBuildView`), live-style run dispatch & retry simulation (`AppRunView`). | Missing public trigger/integration directory; Flow vs. Graph decision guide absent on `/workflow-automation`. |
| **C. AI developer** | Strong across Hero canvas, Stack Explorer, `/studio`, `/developers`, and `/docs`. | **Partially supported:** TypeScript/JSON spec & graph topology inspection in `AppBuildView`, execution span trace details in `AppRunView`, MCP toggles in `AppMoreView`. | `/docs` lacks bookmarkable `/docs/:slug` URLs and `Cmd+K` search; `/app` lacks code-level TypeScript IDE editor and real Git/CLI sync. |
| **D. AI/ML engineer** | **Critically underserved (P1).** Only a single `#data-ml` summary card on `/solutions`. | **Unsupported (P1 Gap):** Zero screens in `/app` for dataset upload/profiling, feature transforms, training/fine-tuning runs, ML evaluation matrices, or model registry -> Gateway binding. | Complete end-to-end ML workflow (Journey D below) must be designed and added to both public previews (`/gateway`, `/solutions/machine-learning`) and `/app`. |
| **E. Enterprise administrator** | Partially shown via `Control` approval queue preview (`ProductPreviews`). | **Supported locally:** Isolated multi-workspace switcher (`SONIL Core Engineering` vs. `Operations Automation Lab` + create workspace), Governance approval inbox, MCP scope toggles, 30-day Recharts reliability telemetry. | **P1 Gap:** Missing `/security` Trust & Security Center on public site; `/app` has no real OIDC/SAML login, RBAC role matrix editor, spend cap enforcement, or SIEM export. |

---

## Journey A: Non-Technical Business User
**Goal:** *Describe a task -> create an agent -> connect knowledge -> approve actions -> receive deliverables.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Discovery** | Homepage Hero / `/studio` / `Try SOPIN` CTA | Reads plain-language promise (*"Build AI agents that deliver work"*); taps `Try SOPIN` (`/app`). | Start from plain-English prompt vs. starter workspace preset. | Filter shows 0 presets -> `"Describe a custom task or reset filter"`. | Connection drop while offline -> `OfflineBanner` clarifies local workspace remains usable. | Enters guided 5-step Agent Studio without encountering code walls. |
| **2. Describe Task** | `/app` `Build` -> NL Prompt Composer (`AppBuildView`) | Types task: *"Summarize weekly vendor contracts and flag renewal clauses."* | Choose output structure & whether actions require manual approval. | Blank prompt field shows 3 clickable example intents. | Underspecified input (`<15` chars) -> Inline validation explaining what output/scope to clarify. | Blueprint preview + permission summary compiled cleanly. |
| **3. Connect Knowledge** | `/app` `Knowledge` (`AppKnowledgeView`) | Uploads PDF/Markdown/image file or registers document URL; binds corpus to agent. | Read-only scope + external web access disabled/enabled. | `"No knowledge sources indexed yet"` -> Tap `+ Add Source`. | Unsupported file type or oversized payload -> Clear format hint + non-blocking skip. | Source chunked locally with checksum badge and searchable preview. |
| **4. Approve Actions** | `/app` `Home` / `Run` Approval Gate (`BottomSheet`) | Reviews flagged action in Pending Approvals inbox; taps `Approve` or `Reject`. | Approve as drafted, reject with note, or inspect retrieved citations first. | `"All clear — no pending human approvals."` | Expired approval session or missing rationale on reject -> Inline prompt requesting decision note. | Gate unlocked; step resumes and audit entry logged cleanly. |
| **5. Receive Deliverables** | `/app` `Run` Output Sheet (`AppRunView`) | Reads formatted Markdown deliverable with expandable cited sources; copies/exports output. | Export report, re-run with updated task, or refine agent steps. | `"Dispatch a task to view structured deliverables."` | Citation mismatch / grounding check warning -> Flags unverified section clearly. | Clean, cited deliverable produced and visible in Run History. |

---

## Journey B: Automation Builder
**Goal:** *Choose trigger -> design workflow -> connect integrations -> test -> publish -> monitor.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Choose Trigger** | `/flow` & `/app` `Build` Flow Designer | Selects workflow trigger (`Webhook`, `Schedule`, `Email/Ticket`, `File Upload`). | Define payload schema or sample test fixture. | `"Select a trigger to initialize this workflow."` | Malformed cron expression or invalid webhook JSON -> Field validation error. | Trigger node configured with sample input schema. |
| **2. Design Workflow** | Vertical Touch Flow Builder (`AppBuildView`) | Adds Classify/Extract, conditional Branch, Retry policy, and `humanGate` nodes. | Branching: auto-complete `standard` vs. pause `elevated` risk for human review. | Starter Flow presets provided (`Invoice Triage`, `Support Escalation`). | Circular edge attempted in linear DAG -> Suggests converting subgraph to `SOPIN Graph`. | Validated acyclic Flow topology saved cleanly. |
| **3. Connect Integrations** | `/app` `More` -> `Integrations` (MCP/API Drawer) | Enables scoped MCP server / connector and toggles `read` vs. `write` permissions. | Least-privilege tool allowlist; secrets isolated from flow config. | `"No MCP connectors bound in this workspace."` | Auth token expired or disallowed write scope -> Inline reconnect / scope fix CTA. | Connector status verified (`Scoped Access Active`). |
| **4. Test** | Flow Dry-Run & `AppRunView` Step Timeline | Dispatches test payload (`Standard` vs. `Elevated` path); steps through timeline nodes. | Inspect node inputs/outputs and retry recovery behavior. | `"Run a test payload to validate node branching."` | Simulated step failure -> Displays failing node, error message, and one-tap `Retry Step`. | Full branch execution and retry recovery confirmed. |
| **5. Publish** | Publish Confirmation `BottomSheet` | Reviews version badge, dependency checklist, and clicks `Publish`. | Publish to active workspace or keep in draft preview. | Initial release shows `"v1.0 readiness checklist"`. | Write tool present without `humanGate` policy -> Policy warning before publish. | Workflow marked Active and ready for triggers. |
| **6. Monitor** | `/app` `Home` & `More` -> `Monitoring` (`AgentPerformanceChart`) | Inspects **30-day Success Rate (%) & Avg Execution Time (s)** Recharts trend + run table. | Filter by `7D / 14D / 30D` window or inspect failed run trace. | `"No workflow runs recorded in this window."` | Success rate dip or latency spike -> Highlights degraded day tooltip & run logs. | Sustained SLA visibility across all workspace runs. |

---

## Journey C: AI Developer
**Goal:** *Create project -> select model -> configure tools -> build graph -> evaluate -> deploy.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Create Project** | `/docs/quickstart` & CLI (`npx @sopin/cli init`) | Scaffolds TypeScript (`@sopin/sdk`) or Python (`sopin-sdk` planned) workspace; opens in Studio. | Code-first Git workflow vs. Studio visual sync. | Boilerplate contains typed `sopin.config.ts` and smoke test. | Unsupported runtime version -> Clear prerequisite error. | Workspace boots with typechecking & blueprint validation. |
| **2. Select Model** | `SOPIN Gateway` Profile Config (`/gateway`, `/app` Models) | Binds `reasoning-structured` primary + `deterministic-fast` fallback + Zod output schema. | Managed Gateway profile vs. BYOK / self-hosted vLLM endpoint. | `"Select a default Gateway profile for this agent."` | Schema validation mismatch or provider throttle -> Auto-failover + exact Zod field path. | Gateway returns strictly schema-compliant JSON. |
| **3. Configure Tools** | MCP & A2A Configurator (`/developers/mcp`, `mcp.config.ts`) | Declares `mcpTool` with explicit `allowedTools`, `deniedTools`, and `networkEgress: "disabled"`. | Read-only tool scope vs. sandboxed write behind `humanGate`. | `"0 tools bound (pure reasoning mode)."` | MCP server handshake failure / timeout -> Displays transport & capability diff. | Tools registered cleanly inside sandbox manifest. |
| **4. Build Graph** | `SOPIN Graph` / Studio Graph Mode (`/graph`, `AppBuildView`) | Defines shared typed state, cyclic edges (`planner -> researcher -> verifier`), and `maxSteps: 6`. | Cyclic `Graph` execution vs. deterministic `Flow` DAG. | Starter supervisor-worker template provided. | Unbounded cycle or missing `maxSteps` -> Static compiler error blocks publish. | Graph validates and syncs 1:1 with Studio visual canvas. |
| **5. Evaluate** | `SOPIN Evaluate` CLI / `/evaluate` *(Planned)* | Runs golden assertion dataset (`sopin eval run`); compares grounding & latency diffs. | Promote candidate route vs. iterate prompt/retrieval config. | `"Link an evaluation suite or import traces from Observe."` | Grounding or schema regression detected -> CI exit code `1` with failing diff. | Candidate clears all regression thresholds cleanly. |
| **6. Deploy** | `SOPIN Runtime` Deploy (`/runtime`, `/app` Deployments) | Runs `sopin deploy`; isolates sandbox workers + binds OpenTelemetry traces (`Observe`). | Canary traffic split vs. full workspace rollout. | `"No active deployments in this workspace."` | Missing secret key or failed health check -> Automatic rollback to last healthy revision. | Versioned endpoint live and monitored via 30-day chart. |

---

## Journey D: AI/ML Engineer *(Currently Unsupported — Critical P1 Addition)*
**Goal:** *Upload data -> explore -> transform -> train model -> evaluate -> register -> deploy.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Upload Data** | `/solutions/machine-learning` & ML Data Workspace *(Planned)* | Uploads CSV/Parquet, image/audio corpus, or binds warehouse/object-store snapshot. | Fine-tuning/ML dataset vs. RAG evaluation benchmark corpus. | `"Drop datasets or connect S3/GCS/PostgreSQL read source."` | Corrupt encoding, schema mismatch, or sensitive PII columns -> Flags columns cleanly. | Immutable dataset snapshot hash created. |
| **2. Explore** | Dataset Profiler & Quality View | Reviews class balance, null rates, token distributions, and duplicate warnings. | Train/validation/test split & stratification strategy. | `"Select a dataset version to inspect statistics."` | Severe class imbalance or split data leakage -> Actionable pre-training warning. | Clean, validated dataset profile approved. |
| **3. Transform** | Feature & Preprocessing Pipeline (`Flow` ML Worker) | Chains Python transforms (normalization, tokenization, multimodal OCR/frame extraction). | CPU transform pool vs. GPU preprocessing workers. | `"Add preprocessing transforms or import recipe."` | Memory overflow or NaN propagation -> Pinpoints exact transform node & failing row. | Versioned feature artifact saved cleanly. |
| **4. Train Model** | Training / Fine-Tuning Job Console (`Runtime` Compute) | Selects base open-weight model or PyTorch/XGBoost script, hyperparameters, and GPU quota. | Full fine-tune vs. LoRA adapter vs. tabular ML training. | `"No training jobs queued."` | OOM crash or diverging loss -> Saves last valid checkpoint + surfaces hardware logs. | Training converges with persisted weights & metrics. |
| **5. Evaluate** | `SOPIN Evaluate` ML Benchmark Matrix | Inspects F1/RMSE/accuracy, confusion slices, latency, and inference cost vs. baseline. | Promote candidate model vs. tune hyperparameters. | `"Select 2+ experiments to compare metrics."` | Below minimum metric threshold or eval timeout -> Blocks Registry promotion. | Candidate outperforms baseline within latency budget. |
| **6. Register** | Model Registry & `Gateway` Binding | Registers versioned model (`domain-classifier:v3`) with dataset + eval lineage. | Assign stage (`Staging`, `Shadow`, `Production`). | `"Registry empty — register a passing training run."` | Missing model card or provenance metadata -> Blocks Production tag. | Model registered and selectable in `SOPIN Gateway`. |
| **7. Deploy** | `SOPIN Runtime` / `Gateway` Inference Endpoint | Publishes live inference profile so agents invoke `gateway.infer("domain-classifier:v3")` natively. | Autoscaling serverless replica vs. dedicated GPU pool. | `"0 active custom ML endpoints."` | Container cold-start fail or health check error -> Safe traffic rollback. | Agents & workflows invoke custom ML model beside LLMs. |

---

## Journey E: Enterprise Administrator *(Partially Prototyped Locally — `/security` & Backend Auth Missing P1)*
**Goal:** *Create organization -> manage identity -> set policies -> assign permissions -> monitor agents -> audit activity.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Create Organization** | `/enterprise` & `/app` Workspace Switcher | Creates org & isolated team workspaces (`SONIL Core Engineering`, `Operations Automation Lab`). | Managed `SOPIN Cloud` org vs. Private VPC `SOPIN Enterprise` data plane. | `"Create a workspace to isolate agents, knowledge, and logs."` | Duplicate org slug or VPC network handshake timeout -> Guided diagnostic message. | Isolated organization & workspaces provisioned. |
| **2. Manage Identity** | `SOPIN Control` Identity & SSO *(Planned)* | Configures OIDC / SAML 2.0 SSO and SCIM group sync to workspace roles. | Enforce SSO-only login & session timeout policy. | `"Single admin owner active — connect corporate IdP."` | Invalid SAML XML / clock skew -> Clear assertion validation feedback. | Corporate members sign in via enterprise IdP. |
| **3. Set Policies** | `SOPIN Control` Policy Engine (`/app` Governance + Planned) | Enables PII redaction, external provider allowlists, and monthly token/compute spend limits. | Hard-block vs. alert-only enforcement per workspace. | `"Default safety policy active — customize thresholds."` | Conflicting policy rule (active agent uses blocked model) -> Highlights impact before saving. | Guardrails enforced uniformly at Gateway & Runtime. |
| **4. Assign Permissions** | RBAC & MCP Tool Allowlist Matrix (`/app` Governance) | Assigns least-privilege scopes (`read-only` vs. `humanGate`-protected `write`). | Role-level defaults vs. per-agent service credential limits. | `"No custom tool overrides — default read-only posture."` | Wildcard write permission attempted -> Requires explicit security confirmation. | Every user & agent constrained to explicit tool scopes. |
| **5. Monitor Agents** | `SOPIN Observe` + `Control` Fleet Dashboard (`/app` `Home` & `Monitoring`) | Inspects active runs, pending human approval inbox, budget utilization, and 30-day trends. | Approve escalated action, pause noisy flow, or revoke token. | `"No active runs across this workspace."` | Budget limit reached (`90%`/`100%`) or high failure rate -> Sends alert & optional throttle. | Organization maintains full real-time operational oversight. |
| **6. Audit Activity** | Immutable Audit Ledger (`Control`) | Filters governance audit events by actor, workspace, tool scope, and sign-off; exports SIEM payload. | Compliance export window & destination (`CSV`/`JSON`/webhook). | `"No audit events match current filter."` | SIEM export webhook failure -> Queues dead-letter retry + admin warning. | Complete tamper-evident chain of custody verified. |

---

## Journey F: Business Rule & Decision Automation (SOPIN Decisions)
**Goal:** *Define deterministic rule/table -> test batch cases -> promote version -> bind Flow Decision Node -> inspect execution traces.*

| Stage | Screen / Surface | User Interaction | Decision Point | Empty State | Error State | Success State |
|-------|------------------|------------------|----------------|-------------|-------------|---------------|
| **1. Author Policy** | `/app` `Decisions` -> `Rules` / `Decision Tables` | Builds nested AND/OR rules, spreadsheet rows, or uses Studio AI Draft composer (`Draft` only). | `IF/ELSE Rule` vs. `Decision Table` hit policy vs. `Scorecard`. | `"No rules in workspace — create from blank or AI Draft."` | Missing required schema input or formula syntax error -> Inline field guidance. | Deterministic spec saved in `Draft` status. |
| **2. Test & Simulate** | `/app` `Decisions` -> `Test & Sim` | Runs JSON fixtures and batch `Expected vs Actual` regression suite. | Auto-promote `Draft` -> `Tested` on 100% pass. | `"Add at least 1 test fixture before production promotion."` | Assertion diff mismatch -> Highlights expected vs actual key diffs cleanly. | Verified green regression badge attached to version. |
| **3. Govern & Promote** | `Versions & Env` + `Settings` | Promotes verified version from `Development` -> `Staging` -> `Production` behind SOPIN Control RBAC. | Immediate promote vs. rollback to prior snapshot hash. | `"No prior snapshots available for rollback."` | Restricted RBAC or unreviewed AI draft -> Blocks Production publish. | Version immutable & active for API / Flow callers. |
| **4. Bind in Flow** | `/app` `Build` -> Flow Designer (`Decision Node`) | Inserts `Decision Node` step, selects Rule/Table/Ruleset, previews deterministic output, and runs Flow. | Approved straight-through branch vs. Human Approval Gate. | `"Bind a SOPIN Decisions rule or table to this node."` | Missing payload mapping -> Flags unmapped input field before run. | Flow executes deterministically and logs trace in `Executions`. |

