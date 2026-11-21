# SOPIN — Technical Architecture & Scalable Frontend Blueprint

**Inspected Stack:** React `19.0.1` · TypeScript `7.0.2` (`tsc --noEmit`) · Vite `8.3.0` · Tailwind CSS `v4.3.3` · Motion `12.23.24` · Recharts `3.8.1` · Lucide React `0.546.0` · PWA (`public/manifest.webmanifest` + `public/sw.js`).

---

## 1. Audit of Actual Current Implementation

### Verified Strengths
- **Clean TypeScript & Vite Setup:** Strict TypeScript passes cleanly; Tailwind CSS v4 CSS-first `@theme` configuration with `@custom-variant dark`.
- **Route Code Splitting Implemented:** `src/App.tsx` (`158` lines) now wraps all page routes and `SopinAppShell` inside `React.lazy()` + `<Suspense fallback={<PageSkeleton />}>`.
- **Client-Side 404 Handling Implemented:** `src/hooks/useRoute.ts` (`95` lines) parses `VALID_ROUTES` (`13` active routes) and resolves unknown paths to `isNotFound: true`, rendering `NotFoundPage.tsx`.
- **Motion Accessibility:** `MotionConfig reducedMotion="user"` wraps the root tree in `src/App.tsx`.
- **Mobile-First PWA Prototype Shell (`/app`):** Standalone workspace experience under `src/app/` featuring bottom-tab/rail navigation, offline detection (`OfflineBanner.tsx`), bottom sheets (`BottomSheet.tsx`), `localStorage` persistence (`useAppWorkspaceStore.ts`), and 30-day Recharts performance telemetry (`AgentPerformanceChart.tsx`).

### Technical Findings & Bottlenecks

| ID | Priority | File(s) | Technical Finding | Recommended Fix |
|----|----------|---------|-------------------|-----------------|
| **T-01** | **P0** | `vite.config.ts`, `index.html`, `src/hooks/useRoute.ts` | Pure client-side SPA renders an empty `<div id="root"></div>` in initial HTML. Crawlers and social/AI link scrapers only read homepage `<head>` tags. Also, `useRoute.ts` lacks route params (`/docs/:slug`, `/resources/:slug`), dynamic `<link rel="canonical">`, and `<meta name="robots" content="noindex">` on `NotFoundPage` and `/app`. | Add Vite SSG/static pre-rendering for public routes + real HTTP `404` status handling on hosting; upgrade `useRoute.ts` (or adopt React Router v7 / TanStack Router) with URL params, canonical links, and `noindex` support. |
| **T-02** | **P1** | `src/app/views/AppBuildView.tsx`, `src/app/useAppWorkspaceStore.ts` | New workspace monoliths: `AppBuildView.tsx` (`1,320` lines) and `useAppWorkspaceStore.ts` (`1,187` lines) bundle 5-step studio wizard, Flow editor, workspace persistence, and fixture generators in single files. | Decompose `AppBuildView.tsx` into `AgentWizard/`, `NaturalLanguageComposer/`, `FlowBuilder/`, and `TopologyInspector/`; split `useAppWorkspaceStore.ts` into domain slices ahead of FastAPI API hydration. |
| **T-03** | **P1** | `src/components/interactive/ProductPreviews.tsx`, `src/data/sopinData.ts` | Existing marketing monoliths: `ProductPreviews.tsx` (`1,065` lines) and `sopinData.ts` (`949` lines) mix UI chrome, interactive state, fixtures, navigation schemas, and SEO metadata. | Split into `src/components/previews/` (`PreviewShell.tsx` + 8 focused preview tabs) and `src/data/` (`routes.ts`, `navigation.ts`, `products.ts`, `solutions.ts`, `resources.ts`). |
| **T-04** | **P1** | `src/App.tsx`, `src/app/SopinAppShell.tsx` | Zero React `ErrorBoundary` wrapping `<main>`, `SopinAppShell`, or interactive visualizations (`MultiAgentHeroCanvas`, `AgentPerformanceChart`). Any uncaught exception blanks the app. | Add `<RouteErrorBoundary>` around `<main>` and `<WidgetErrorBoundary>` around `/app` charts and canvases. |
| **T-05** | **P1** | `package.json`, `src/pages/ContactPage.tsx` | `express`, `dotenv`, `@google/genai`, and `@types/express` exist in `package.json`, yet no `server.ts` or `/api/*` endpoints exist; `ContactPage.tsx` validates purely client-side and `/app` relies purely on `localStorage`. | Wire `server.ts` for `/api/contact` intake in Phase 1/2, or route `/api/*` cleanly into the Python FastAPI control plane in Phase 3+. |
| **T-06** | **P2** | `index.html`, `src/pages/AboutPage.tsx`, `public/sw.js` | External Google Fonts CDN slows offline/constrained FCP; `/assets/aistudio/Sopin_Logo_46f7e074.png` lacks explicit `width`/`height`; `sw.js` precaches only `['/', '/manifest.webmanifest', '/icon.svg']` rather than offline fallback for deep `/app` navigation. | Self-host WOFF2 fonts; set explicit dimensions on raster assets; enhance Vite PWA asset precaching cleanly while keeping `/api/*` uncached (`NetworkOnly`). |

---

## 2. Target Scalable Architecture (Website -> Live Backend Platform)

SOPIN's frontend is designed to evolve smoothly from the **Public Website + `/app` Local Prototype (`sopin.ai`)** into a **Production Multi-Tenant Application (`app.sopin.ai` / `/app/*`)** backed by:

- **Backend Control Plane:** **Python FastAPI** (REST JSON APIs, OpenAPI schema codegen, SSE/WebSocket execution streaming)
- **Primary State & Vectors:** **PostgreSQL** (organizations, workspaces, RBAC roles, versioned blueprints, durable state pointers, immutable audit logs, `pgvector` knowledge chunks) + **Redis** (session/rate-limit state, pub/sub live execution events)
- **Orchestration & Execution:** **Temporal** (or durable workflow engine) + isolated container/microVM worker pool (`SOPIN Runtime`) + framework adapters (**LangGraph**, **CrewAI**, **Google ADK**, custom Python ML workers)
- **Gateways & Protocols:** **SOPIN Gateway** (multi-provider LLM, multimodal parsing, custom registered ML inference, PII redaction, schema validation) + **MCP** tool proxy (`stdio`/`HTTP`) + **A2A** peer task router + **OpenTelemetry** (`SOPIN Observe`) & async assertion runners (`SOPIN Evaluate`)

### Recommended Modular Directory Architecture (Avoid Unnecessary Micro-Frontends)

Maintain a single strongly-typed **feature-sliced React + TypeScript codebase** (cleanly separating public static/SSG marketing pages from authenticated `/app/*` workspace modules while sharing one design system):

```text
src/
├── app/                     # App Shell, Auth Guard, Workspace Context, Router, ErrorBoundary
├── design-system/           # Shared UI primitives (Button, Tabs, DataTable, Dialog, BottomSheet, TelemetryChart, GraphNode)
├── features/
│   ├── marketing/           # Public Home, Platform, 11 Product pages, Solutions, Pricing, Trust, About
│   ├── docs/                # Searchable /docs/:slug engine, Cmd+K palette, parameter tables
│   ├── studio/              # Live SOPIN Studio (NL composer + Graph/Flow canvas + Git/SDK sync)
│   ├── context/             # Knowledge index manager, multimodal uploader, chunk & ACL inspector
│   ├── gateway/             # Model profile routing, schema validator, ML registry binding, BYOK vault
│   ├── observe/             # SSE/WebSocket live span waterfall, state diff & 30-day Recharts telemetry
│   ├── evaluate/            # Golden dataset manager, assertion matrix & CI benchmark views
│   ├── ml/                  # Dataset uploader, profiler, transform pipeline, training jobs & benchmarks
│   └── control/             # Org/Workspace RBAC, human approval inbox, budget caps & SIEM audit log
├── services/
│   ├── apiClient.ts         # Auto-generated typed client from FastAPI /openapi.json
│   ├── streamClient.ts      # SSE / WebSocket client subscribing to Redis pub/sub agent events
│   └── authClient.ts        # OIDC / SAML 2.0 session & token lifecycle (HttpOnly cookie / PKCE)
└── types/                   # Canonical shared Blueprint, Graph, Trace, Policy & API types
```

### Key Integration Contracts (Local `/app` -> Real FastAPI Stack)
1. **Replace `localStorage` Store Incrementally:** Keep `useAppWorkspaceStore` interfaces clean so React views talk to repository hooks (`useWorkspaces`, `useBlueprints`, `useRuns`, `useApprovals`) backed locally today and swapped transparently to FastAPI + TanStack Query in Phase 3+.
2. **Contract-First OpenAPI Sync:** Generate TypeScript types directly from FastAPI `/openapi.json` (`openapi-typescript`) so `Studio`, `Flow`, `Context`, `Observe`, and `Control` never drift from backend schemas.
3. **Real-Time Streaming (`Run` & `Observe`):** Replace synthetic timer ticks in `useAppWorkspaceStore.ts` with FastAPI SSE (`EventSource`) streams consuming Redis pub/sub run spans (`step.started`, `context.retrieved`, `tool.invoked`, `gate.paused`, `run.completed`).
4. **Zero Browser Secrets:** Provider keys, BYOK secrets, and MCP credentials live exclusively inside FastAPI's KMS-encrypted vault—never stored in `localStorage` or browser memory.

---

## 3. SOPIN Decisions Modular Architecture (`src/decisions/`)

- **Domain & Types (`src/decisions/types.ts`):** Canonical TypeScript contracts for `RuleSpec`, `DecisionTableSpec`, `RulesetSpec`, `RuleChainSpec`, `ScorecardSpec`, `DecisionExecutionSpec`, and `DecisionSettings`.
- **Pure Deterministic Evaluator (`src/decisions/evaluator.ts`):** Evaluates nested AND/OR predicates, restricted safe expressions (no `eval`/`Function`), spreadsheet hit policies (`first-match`, `priority`, `collect-all`, `unique`), sequential rule chains, weighted scorecards, and batch regression fixtures deterministically, alongside human-reviewed `synthesizeRuleDraftFromNL`.
- **10-Section Workspace Shell (`src/app/views/AppDecisionsView.tsx` + `src/decisions/components/*`):** Mobile-first workspace (`Overview`, `Rules`, `Decision Tables`, `Rulesets`, `Rule Chains`, `Scorecards`, `Test & Sim`, `Executions`, `Versions & Env`, `Settings`) integrated with `useAppWorkspaceStore.ts` and `AppBuildView.tsx` Flow Decision Nodes.

