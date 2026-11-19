# SOPIN — Technical Architecture & Scalable Frontend Blueprint

**Inspected Stack:** React `19.0.1` · TypeScript `7.0.2` (`tsc --noEmit`) · Vite `8.3.0` · Tailwind CSS `v4.3.3` · Motion `12.23.24` · Lucide React `0.546.0`.

---

## 1. Audit of Actual Current Implementation

### Strengths
- Strict TypeScript compilation (`tsc --noEmit` passes with zero errors).
- Clean Vite + Tailwind v4 CSS-first `@theme` configuration with `@custom-variant dark`.
- Zero bloated state libraries or unnecessary UI frameworks.
- `MotionConfig reducedMotion="user"` properly wraps the entire application tree (`src/App.tsx`).

### Technical Findings & Bottlenecks

| ID | Priority | File(s) | Technical Finding | Recommended Fix |
|----|----------|---------|-------------------|-----------------|
| **T-01** | **P0** | `src/hooks/useRoute.ts`, `src/App.tsx` | Hand-rolled `window.history.pushState` router silently maps every unknown route to `/` (`normalizePath` fallback) — creating soft-404s, zero route params (`/docs/:slug`, `/resources/:slug`), and zero `<link rel="canonical">` management. | Adopt lightweight declarative route matching (or React Router v7 / TanStack Router when scaling into App Shell) with explicit `404` route, dynamic param parsing, and canonical/meta injection. |
| **T-02** | **P0** | `vite.config.ts`, `index.html` | Pure client-side SPA renders an empty `<div id="root"></div>` in initial HTML. Search crawlers, social preview scrapers (Slack/LinkedIn/X), and AI bots see homepage meta tags regardless of URL. | Implement static route pre-rendering (Vite SSG / prerender script generating `dist/*/index.html` with route-specific `<title>`, `<meta>`, `<link rel="canonical">`, and JSON-LD) or SSR for public marketing/docs routes. |
| **T-03** | **P1** | `src/App.tsx` | Eager static imports of all 12 page modules inflate the initial JS bundle as new product/doc/resource pages are added. | Wrap non-home route views in `React.lazy()` + `<Suspense>` with clean route-level error boundaries (`ErrorBoundary`). |
| **T-04** | **P1** | `src/components/interactive/ProductPreviews.tsx` | **1,066-line monolith** containing 8 UI tabs, fixture data, and window chrome in one component. Hard to test, maintain, or share with real Phase 3+ app views. | Split into `src/components/previews/` (`PreviewShell.tsx`, `StudioPreview.tsx`, `FlowPreview.tsx`, ..., `ControlPreview.tsx`, `previewFixtures.ts`). |
| **T-05** | **P1** | `src/data/sopinData.ts` | **944-line monolith** mixing SEO metadata, navigation trees, hero workflow fixtures, lifecycle copy, and resource catalog. | Split by domain into `src/data/routes.ts`, `src/data/navigation.ts`, `src/data/products.ts`, `src/data/resources.ts`, `src/data/solutions.ts`. |
| **T-06** | **P1** | `package.json` | `express`, `dotenv`, `@google/genai`, `@types/express` are installed in dependencies even though no `server.ts` or `/api/*` endpoints currently exist. | Keep runtime clean: either wire `server.ts` cleanly for contact intake + pre-rendered/SSR routing + API gateway proxy in Phase 2/3, or clearly separate marketing web vs. platform API client boundaries. |
| **T-07** | **P2** | `src/pages/HomePage.tsx`, `src/index.css` | Google Fonts stylesheet loaded externally; `/assets/aistudio/Sopin_Logo_46f7e074.png` is unoptimized PNG without explicit `width`/`height` attributes (minor CLS risk on `AboutPage.tsx`). | Self-host WOFF2 fonts; add explicit `width`/`height` and `loading="lazy"` on raster assets; inline SVG brand assets (`SopinLogo.tsx` already inline SVG). |
| **T-08** | **P2** | Global error handling | No React `ErrorBoundary` wrapping `<main>` or individual interactive canvases (`MultiAgentHeroCanvas`, `ProductPreviews`). | Add `<RouteErrorBoundary>` around `<main>` and `<WidgetErrorBoundary>` around interactive demos so a runtime error never blanks the site. |

---

## 2. Target Scalable Frontend Architecture (Website -> Live Platform App)

The frontend architecture must transition smoothly from the **Public Website (`sopin.ai`)** into the **SOPIN Application Shell (`app.sopin.ai` or `/app/*`)** backed by:
- **Backend Core:** Python **FastAPI** (REST + OpenAPI typed schemas + SSE/WebSocket streaming)
- **State & Storage:** **PostgreSQL** (organizations, workspaces, blueprints, RBAC, audit logs, pgvector/metadata) + **Redis** (session cache, rate limits, pub/sub run streams)
- **Orchestration & Runtime:** **Temporal** (or durable execution engine) + isolated container/sandbox workers + **LangGraph / CrewAI / ADK framework adapters**
- **Protocols & Routing:** **SOPIN Gateway** (multi-model + multimodal + MCP proxy) + **A2A** peer endpoints + **SOPIN Context** retrieval service + **OpenTelemetry** (`Observe`) & evaluation runners (`Evaluate`)

### Recommended Modular Directory Architecture (No Unnecessary Microservices)

A single clean **feature-sliced React + TypeScript frontend** (or two cleanly separated entry targets—`web` static/SSG marketing + `app` workspace SPA—sharing one UI package) prevents premature micro-frontend fragmentation:

```text
src/
├── app/                     # App Shell, Auth Guard, Workspace Context, Router, ErrorBoundary
├── design-system/           # Shared UI primitives (Button, Tabs, Table, Dialog, CodeBlock, Form, GraphNode)
├── features/
│   ├── marketing/           # Public Home, Platform, 11 Product pages, Solutions, Pricing, Trust, About
│   ├── docs/                # MDX/structured Docs Engine, Cmd+K search, OpenAPI viewer
│   ├── studio/              # Real SOPIN Studio (NL composer + Graph/DAG canvas + Code sync)
│   ├── flow/                # Real SOPIN Flow designer, triggers, test runner
│   ├── context/             # Knowledge index manager, multimodal uploader, chunk/ACL inspector
│   ├── gateway/             # Model profile routing, schema validator, BYOK vault UI
│   ├── observe/             # SSE/WebSocket live span waterfall, state diff & replay UI
│   ├── evaluate/            # Golden dataset manager, assertion matrix & CI benchmark charts
│   └── control/             # Org/Workspace RBAC, approval inbox, budget caps, audit log table
├── services/
│   ├── apiClient.ts         # Typed fetch wrapper generated from FastAPI OpenAPI spec
│   ├── streamClient.ts      # SSE / WebSocket client for live agent execution & approval events
│   └── authClient.ts        # OIDC / SAML / session token lifecycle (HttpOnly cookie or PKCE)
└── types/                   # Canonical shared Blueprint, Graph, Trace, Policy & API contracts
```

### Real-Time Backend Integration Patterns
1. **Contract-First FastAPI Typing:** Auto-generate TypeScript client types directly from FastAPI's `/openapi.json` (`openapi-typescript`) so `Studio`, `Flow`, `Context`, `Observe`, and `Control` never drift from backend schemas.
2. **Bidirectional Blueprint Schema:** The exact JSON blueprint schema showcased on the public website (`defineAgent` / `defineWorkflow` / `defineGraph`) becomes the canonical payload submitted to FastAPI -> Temporal / LangGraph / SOPIN Runtime.
3. **Streaming Execution (`Observe` & `Control`):** Long-running agent steps emit typed Server-Sent Events (`step.started`, `context.retrieved`, `tool.invoked`, `gate.paused`, `run.completed`) via Redis pub/sub -> FastAPI SSE -> React stream hook.
4. **Clean Separation of Data Planes:** Frontend talks **only** to FastAPI control-plane endpoints; FastAPI coordinates PostgreSQL, Redis, Temporal, Context indexes, and Gateway—never exposing model API keys or vector DB credentials to the browser.
