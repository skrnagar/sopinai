# SOPIN — Complete Website, Product, UI/UX & Content Audit

**Audit Subject:** SOPIN Public Website & Mobile-First Interactive Platform Prototype (`sopin.ai` / SONIL Group)  
**Repository Inspected:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + Motion + Recharts + PWA (`src/`, `public/`, `index.html`)  
**Audit Posture:** Pre-edit baseline audit. Zero application source files (`src/`, `public/`, `index.html`) were modified during this audit.  
**Severity Classification:**
- **P0 (Critical):** SEO indexability blockers, missing real HTTP 404/noindex signals, missing core product routes, or critical backend/credibility blockers.
- **P1 (High Priority):** Major UX friction, missing dedicated product/enterprise/trust destinations, large monolith coupling, or accessibility gaps.
- **P2 (Medium Priority):** Content depth gaps, design system primitives missing for Phase 2–3 scale, or conversion optimization improvements.
- **P3 (Future Enhancement):** Roadmap capabilities tied to live cloud/enterprise backend phases.

---

## 1. Executive Summary

The existing SOPIN codebase goes substantially beyond a static brochure site: it delivers a **13-route React SPA** combining **12 public website/documentation views**, a client-side **`404` fallback (`NotFoundPage`)**, and **`/app` — a mobile-first, PWA-enabled interactive SOPIN Workspace prototype (`SopinAppShell`)** with multi-workspace isolation, a 5-step Agent Studio wizard, vertical Flow builder, Knowledge uploader, Execution timeline with human approval gates, Governance toggles, and a **30-day Recharts Agent Performance Chart**. Visually, it honors SOPIN's black/white/deep-navy/indigo/purple system (`#101014`, `#FFFFFF`, `#101126`, `#6252E8`, `#965BFF`), preserves the 6-prong radial emblem and monoline geometric `Sopin` wordmark, and refuses to fabricate customer logos, case-study metrics, or fake SOC2/ISO badges.

However, **significant structural, product-coverage, SEO, and architectural gaps remain between SOPIN's stated global platform ambition and the current implementation**:

1. **Product Depth vs. Navigation Promise:** Seven of SOPIN's 11 modular products (**SOPIN Graph**, **SOPIN Runtime**, **SOPIN Gateway**, **SOPIN Observe**, **SOPIN Evaluate**, **SOPIN Control**, **SOPIN Cloud**, **SOPIN Enterprise**) still have **no dedicated public product pages**—most resolve to hash anchors (`#gateway`, `#runtime`, `#evaluations`, `#governance`) inside `/platform`, while `Graph`, `Cloud`, and `Enterprise` lack dedicated product pages entirely.
2. **SEO & Crawlability Blockers (P0):** The site remains a **pure client-side SPA** with zero SSG/SSR pre-rendering, no dynamic `<link rel="canonical">`, no `robots.txt` or `sitemap.xml`, no `noindex` injection on `404` responses, and only a single static `SoftwareApplication` JSON-LD block in `index.html`.
3. **Audience & Persona Coverage Imbalance:** While developers, automation builders, and mobile prototype evaluators now have strong interactive paths via `/app` and `/developers`, **AI/ML Engineers** (dataset upload, profiling, preprocessing, training, benchmarking, model registry -> Gateway deployment) and **Enterprise Security/IT Admins** (no `/security` Trust & Security Center, SSO/RBAC docs, or VPC architecture) remain critically underserved.
4. **Local-Only Prototype Boundaries & Monolith Coupling:** `/app` (`useAppWorkspaceStore.ts`, `1,187` lines; `AppBuildView.tsx`, `1,320` lines) operates strictly on browser `localStorage` with synthetic telemetry, and `ContactPage.tsx` publicly states it is a local prototype validator without backend transmission. Meanwhile, `ProductPreviews.tsx` (`1,065` lines) and `sopinData.ts` (`949` lines) concentrate UI, schemas, and content into monolithic modules.
5. **Resources & Docs Dead Ends:** `/docs` stores 5 topics in local state without bookmarkable `/docs/:slug` URLs, and `/resources` cards route `"Read Spec"` clicks to `/docs` instead of opening dedicated, crawlable full-text `/resources/:slug` engineering guides.

---

## 2. Audit Scope & Limitations

- **Directly Inspected:** Every route, page module (`13` pages + `NotFoundPage`), interactive demo (`MultiAgentHeroCanvas`, `InteractiveAgentStack`, `ProductPreviews`), workspace module (`SopinAppShell`, `useAppWorkspaceStore`, `performanceData`, `AgentPerformanceChart`, all 5 workspace views), layout/UI primitives (`Navbar`, `Footer`, `BottomSheet`, `OfflineBanner`, `EditorialPrimitives`, `PageSkeleton`, `SopinLogo`), hooks (`useRoute`, `useTheme`, `usePWAInstall`), and root configuration (`index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `public/manifest.webmanifest`, `public/sw.js`).
- **Inspection Limitations:** Live network/headless-browser telemetry against `https://sopin-studio.ai.studio/` (runtime Core Web Vitals, real HTTP `404` server headers for deep links, and automated browser axe-core DOM scans) was not executed externally from this environment. Static codebase checks (`tsc --noEmit`, Vite build, line/pattern audits) were verified directly against repository files.

---

## 3. Existing Strengths & Recent Improvements Verified in Code

1. **Coherent Category Positioning:** Avoids reducing SOPIN to a prompt wrapper or generic automation tool; consistently articulates *"Build AI agents that deliver work."* and *"Design. Connect. Execute. Verify. Govern."*
2. **Genuine Pre-GA Honesty:** Explicitly distinguishes `Core Architecture`, `Planned`, and `Local Prototype` states rather than fabricating compliance badges, customer logos, or fake uptime stats.
3. **Mobile-First `/app` PWA Workspace Prototype:** Supports small/large phones and tablets with bottom tab navigation (mobile) + left rail (tablet/desktop), `BottomSheet` drawers, isolated multi-workspace switcher (`SONIL Core Engineering`, `Operations Automation Lab`, plus custom workspaces), offline detection, PWA manifest + service worker, and a **30-day Recharts performance visualization** (`Success Rate %` + `Avg Execution Time`).
4. **Engineering & Performance Improvements Already Completed:** Route-level `React.lazy()` + `<Suspense fallback={<PageSkeleton />}>` code splitting (`src/App.tsx`), client-side `404` `NotFoundPage`, removal of the earlier `"Test Error State"` debug button from `ResourcesPage.tsx`, Mega-Menu edge alignment (`left-0` / `right-0` + `max-w-[calc(100vw-2rem)]` in `Navbar.tsx`), and `--color-sopin-muted` upgraded to `#5E5E6E` in `src/index.css`.
5. **Preserved Custom Brand Precision:** `SopinLogo.tsx` preserves the 6-prong radial U-architecture emblem, monoline `Sopin` wordmark (`#965BFF` `i` dot), and rotating hero radial emblem without distortion.

---

## 4. Critical Weaknesses Summary (Classified P0–P3)

| ID | Priority | Category | Verified Finding in Current Codebase |
|----|----------|----------|--------------------------------------|
| **W-01** | **P0** | SEO / Pre-Rendering / 404 HTTP | Pure client-side SPA renders empty `<div id="root"></div>` without SSG/SSR; `useRoute.ts` omits `<link rel="canonical">` and omits `<meta name="robots" content="noindex">` on `NotFoundPage` (and static hosting still needs real HTTP `404` status + `sitemap.xml` / `robots.txt`). |
| **W-02** | **P0** | Product Architecture | 8 SOPIN product modules (`Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, `Enterprise`) lack dedicated public product routes (`/graph`, `/runtime`, `/gateway`, `/observe`, `/evaluate`, `/control`, `/cloud`, `/enterprise`). |
| **W-03** | **P0** | Docs & Content Depth | `/docs` uses component state (`selectedId`) instead of nested URLs (`/docs/:slug`); `/resources` cards link `"Read Spec"` back to `/docs` instead of full-text `/resources/:slug` articles. |
| **W-04** | **P1** | Public Lead Intake | `ContactPage.tsx` (lines 83 & 98) displays prototype-only validation disclaimers with no backend `POST /api/contact` integration yet. |
| **W-05** | **P1** | Persona Coverage | **AI/ML Engineers** lack dataset upload, profiling, feature transforms, training/fine-tuning, eval matrix, and model registry -> Gateway deployment flows across both public site and `/app`; **Enterprise Admins** lack a dedicated `/security` Trust & Security Center. |
| **W-06** | **P1** | Frontend Monoliths & Error Isolation | `AppBuildView.tsx` (`1,320` lines), `useAppWorkspaceStore.ts` (`1,187` lines), `ProductPreviews.tsx` (`1,065` lines), and `sopinData.ts` (`949` lines) are oversized monoliths; `App.tsx` lacks React `ErrorBoundary` wrappers around `<main>` and `/app`. |
| **W-07** | **P1** | Contrast Cleanup & ARIA Tabs | While `--color-sopin-muted` is `#5E5E6E`, `#777786` still appears in `HomePage.tsx` (lines 471, 486) and `AgentPerformanceChart.tsx` (lines 310, 316); `StudioPage`, `DevelopersPage`, `PlatformPage`, and `PricingPage` tabs lack `role="tablist"` / `aria-selected`. |
| **W-08** | **P1** | Navigation Depth | `Company` navbar menu holds only `About SOPIN` and `Contact` (`Vision & Mission`, `SONIL Group`, `Trust & Security`, `Careers`, `Partners` missing); `Platform` mega menu leans heavily on `#anchor` links into `/platform`. |
| **W-09** | **P2** | Homepage Narrative | Missing dedicated homepage showcase sections for **Models & Multimodal Intelligence** (discovery, multimodal parsing, ML/DL readiness), standalone **Evaluations & Observability**, and **Documentation & Learning**. |
| **W-10** | **P2** | Design System & Semantic Links | Shared UI primitives (`<Button>`, `<Tabs>`, `<DataTable>`, `<Dialog>`, `<Tooltip>`, `<FormField>`) do not yet exist in `src/components/ui/`; several route cards use `<button>` rather than `<a href>` (breaking middle-click / open-in-new-tab). |
| **W-11** | **P2** | Backend Dependency Drift | `package.json` declares `express`, `dotenv`, `@google/genai`, and `@types/express`, but no `server.ts` backend, FastAPI service, or real persistence layer is wired yet (`localStorage` only in `/app`). |
| **W-12** | **P3** | Platform Ecosystem Routes | Missing **Agent Templates / Marketplace** (`/templates`), **Changelog** (`/changelog`), **Community / GitHub** (`/community`), and **Platform Status** (`/status` when live Cloud launches). |

---

## 5. Complete Existing Route Inventory (13 Active Routes + 404)

### Route 1: Homepage (`/` — `HomePage.tsx`)
1. **Page Name:** Home (`HomePage.tsx`)
2. **URL:** `/`
3. **Business Purpose:** Position SOPIN as a unified, model-independent AI agent engineering & execution platform under SONIL Group and convert visitors to `/app`, `/docs`, and `/platform`.
4. **Target Audience:** All 5 personas (Business builders, Automation builders, AI developers, ML engineers, Enterprise architects).
5. **Primary User Action:** Interact with `MultiAgentHeroCanvas` and 8-tab `ProductPreviews`, click `"Try SOPIN"` (`/app`), `"Start Building"` (`/docs`), or `"Explore Platform"` (`/platform`).
6. **Existing Content:** 12 sections: Hero + `MultiAgentHeroCanvas`, 4-pillar Foundation, 8-tab `ProductPreviews`, `InteractiveAgentStack`, 6-stage Lifecycle, 4 Creation Experiences, 8 Ecosystem Module cards, Intelligence & Autonomous Execution, Enterprise Trust (4 cards), 5 Use Case Domains, Developer Ecosystem (`sopin.config.ts`), Final CTA.
7. **Existing UI Components:** `SopinLogo`, `MultiAgentHeroCanvas`, `ProductPreviews`, `InteractiveAgentStack`, `SectionHeader`, `StatusText`, `CodeBlock`, Framer Motion (`motion`).
8. **Missing Sections:** Dedicated **Models & Multimodal Intelligence** section; separate **Evaluations & Observability** visual section; **Documentation & Learning** launchpad; quick **Natural Language Intent-to-Agent** sandbox linking directly into `/app`.
9. **UX Problems:** Very tall vertical scroll across 12 dense blocks without section jump markers; two leftover `#777786` glyphs on lines 471 & 486; navigation cards use `<button>` rather than semantic `<a>` links; 8-tab grid in `ProductPreviews` takes large vertical height on mobile (`375px`).
10. **Content Problems:** Technical code/PR-review scenarios dominate over business automation, multimodal document/audio/video processing, and ML engineering workflows.
11. **SEO Requirements:** Keep single primary `<h1>` (`Build AI agents that deliver work.`), add `Organization` (`parentOrganization: SONIL Group`) + `WebSite` JSON-LD, inject `<link rel="canonical">`, and pre-render HTML.
12. **Recommended Improvements (P1/P2):** Expand narrative cleanly to the 18-section blueprint, extract `ProductPreviews` horizontal mobile tabs, fix `#777786` tokens, and convert route cards to `<a>` links.

### Route 2: Platform Overview (`/platform` — `PlatformPage.tsx`)
1. **Page Name:** Platform Overview
2. **URL:** `/platform` (`#overview`, `#gateway`, `#runtime`, `#evaluations`, `#governance`)
3. **Business Purpose:** Present SOPIN's unified architectural layers across Gateway, Runtime, Evaluations, and Governance.
4. **Target Audience:** AI Engineers, Solution Architects, Enterprise CTOs.
5. **Primary User Action:** Toggle Gateway YAML configs (`routing`/`schema`/`fallback`), inspect Runtime isolation guarantees, and launch `/studio`, `/app`, or `/docs`.
6. **Existing Content:** Hero overview, interactive Model Gateway YAML switcher, Runtime 3-card isolation strip, dark Evaluations/Governance planned blocks, `ProductPreviews` (`observe` default tab).
7. **Existing UI Components:** `StatusText`, `SectionHeader`, `CodeBlock`, `ProductPreviews`.
8. **Missing Sections:** Interactive layer-topology architecture diagram connecting all 11 modules; links to dedicated pages for `Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, and `Enterprise`.
9. **UX Problems:** Single page acts as stand-in `#hash` target for 6 distinct products without sticky sub-navigation; tab toggle buttons lack `role="tablist"` / `aria-selected`.
10. **Content Problems:** Doesn't showcase multimodal media pipelines or ML compute pools under Runtime/Gateway; needs crisp boundary clarity vs. raw frameworks vs. foundation model vendors.
11. **SEO Requirements:** Target *"AI agent engineering platform"*, *"AI model gateway"*, *"sandboxed AI agent runtime"*; split products into standalone canonical URLs.
12. **Recommended Improvements (P0/P1):** Refactor `/platform` into an architectural overview linking to dedicated product routes while preserving `#gateway`, `#runtime`, `#evaluations`, `#governance` anchors.

### Route 3: SOPIN Studio (`/studio` — `StudioPage.tsx`)
1. **Page Name:** SOPIN Studio
2. **URL:** `/studio`
3. **Business Purpose:** Showcase unified authoring across Natural Language, Visual Builder, Cyclic Agent Graph, and Typed SDK with 1:1 blueprint sync.
4. **Target Audience:** Business Builders, Automation Designers, AI Engineers.
5. **Primary User Action:** Explore `ProductPreviews` (`studio`), toggle the 4 authoring modes, or open `/app` / `/docs`.
6. **Existing Content:** Hero, `ProductPreviews` (`studio`), 4-mode `CREATION_EXPERIENCES` switcher + `CodeBlock`.
7. **Existing UI Components:** `StatusText`, `SectionHeader`, `ProductPreviews`, `CodeBlock`.
8. **Missing Sections:** Interactive inline "Describe a task -> preview blueprint" box linking straight into `/app` Studio wizard; Git diff/versioning walkthrough; cross-links to `SOPIN Graph` & `SOPIN Flow`.
9. **UX Problems:** Switching to `"Natural Language"` shows static explanatory copy + YAML instead of a live composer; tabs lack `role="tablist"` / `aria-selected`.
10. **Content Problems:** Closely mirrors `HomePage` Section 6 without deeper IDE workflow details (schema debugging, dry-run diffing, team co-authoring).
11. **SEO Requirements:** Target *"AI agent studio"*, *"visual AI agent builder"*, *"no-code to code AI agent platform"*.
12. **Recommended Improvements (P1/P2):** Add ARIA tablist semantics, interactive NL prompt starter linked to `/app`, and deeper SDK/blueprint sync examples.

### Route 4: Workflow Automation (`/workflow-automation` — `WorkflowPage.tsx`)
1. **Page Name:** Workflow Automation (SOPIN Flow)
2. **URL:** `/workflow-automation`
3. **Business Purpose:** Explain deterministic workflow orchestration, branching, bounded retries, dead-letter handling, and human checkpoints.
4. **Target Audience:** Automation Builders, Operations Engineers, Backend Developers.
5. **Primary User Action:** Simulate `Elevated Risk` vs. `Standard Risk` paths in `ProductPreviews` (`flow`), or test vertical workflows inside `/app`.
6. **Existing Content:** Hero, `ProductPreviews` (`flow`), 4 execution control cards, `invoice-reconciliation.ts` SDK example.
7. **Existing UI Components:** `StatusText`, `SectionHeader`, `ProductPreviews`, `CodeBlock`.
8. **Missing Sections:** Trigger catalog (`Webhook`, `Schedule`, `Queue`, `File Upload`); explicit **Flow (DAG) vs. Graph (Cyclic Multi-Agent)** comparison matrix; connector/integration directory.
9. **UX Problems:** Route path `/workflow-automation` diverges from product name `SOPIN Flow` (`/flow` alias recommended); lacks a direct `"Open Flow Designer in App"` CTA.
10. **Content Problems:** Single finance example omits document intelligence, customer ops, and engineering CI triggers.
11. **SEO Requirements:** Target *"AI workflow automation"*, *"deterministic AI orchestration"*, *"human-in-the-loop AI workflows"*.
12. **Recommended Improvements (P1/P2):** Add `/flow` canonical/alias alignment, trigger catalog, and Flow vs. Graph decision table.

### Route 5: Context & Memory (`/context` — `ContextPage.tsx`)
1. **Page Name:** Context & Memory (SOPIN Context)
2. **URL:** `/context`
3. **Business Purpose:** Detail 3-tier memory isolation (ephemeral state, episodic memory, grounded corpora) and source-checksum provenance.
4. **Target Audience:** AI Engineers, RAG Architects, Enterprise Data Leads.
5. **Primary User Action:** Inspect memory tiers in `ProductPreviews` (`context`) and navigate to `/developers` or `/app`.
6. **Existing Content:** Hero, `ProductPreviews` (`context`), 3-tier memory grid, Provenance Binding + `context.retrieve.ts` code snippet.
7. **Existing UI Components:** `StatusText`, `SectionHeader`, `ProductPreviews`, `CodeBlock`.
8. **Missing Sections:** Multimodal parsing pipeline (PDFs, scans, images, audio transcripts, video frames, structured CSV/SQL); ACL/tenant-filtering architecture diagram; vector + lexical hybrid search benchmarks.
9. **UX Problems:** Single hero CTA (`Explore Developer SDK`); lacks interactive retrieval/ACL simulation preview on the marketing page.
10. **Content Problems:** Text-only ADR example under-represents SOPIN's multimodal document, image, audio, video, and structured data scope.
11. **SEO Requirements:** Target *"context engineering"*, *"enterprise RAG memory architecture"*, *"AI agent provenance retrieval"*.
12. **Recommended Improvements (P1):** Add multimodal ingestion diagram, ACL isolation section, and cross-link to `/app` Knowledge workspace.

### Route 6: Developers (`/developers` — `DevelopersPage.tsx`)
1. **Page Name:** Developers
2. **URL:** `/developers` (`#sdk`, `#protocols`, `#integrations`, `#open-source`)
3. **Business Purpose:** Serve as engineering hub for TS/Python SDKs, MCP/A2A protocols, integrations, and open-source plans.
4. **Target Audience:** Application Developers, AI Systems Engineers, SDK Contributors.
5. **Primary User Action:** Toggle TypeScript vs. Python SDK preview and jump to `/docs` or `/app`.
6. **Existing Content:** Hero, TS/Python SDK toggle with `CodeBlock`, 3 cards (MCP & A2A, Integrations, Open Source Coming Soon), Docs quickstart CTA banner.
7. **Existing UI Components:** `StatusText`, `SectionHeader`, `CodeBlock`.
8. **Missing Sections:** Copyable CLI quickstart (`npx @sopin/cli init`), Framework Adapter matrix (LangGraph, CrewAI, ADK, OpenAI SDK adapters), browsable Agent Templates, API Reference summary, GitHub/Community hub.
9. **UX Problems:** TS/Python buttons lack `role="tablist"` / `aria-selected`; `#protocols`, `#integrations`, `#open-source` are squeezed onto a single 3-card row.
10. **Content Problems:** No concrete list of supported MCP servers, model providers, or SDK method signatures.
11. **SEO Requirements:** Target *"AI agent TypeScript SDK"*, *"MCP A2A agent framework"*, *"AI developer platform"*.
12. **Recommended Improvements (P1):** Break out `/developers/api`, `/developers/sdks`, `/developers/mcp`, `/developers/a2a`, `/templates`, and `/community`.

### Route 7: Documentation (`/docs` — `DocsPage.tsx`)
1. **Page Name:** Documentation
2. **URL:** `/docs`
3. **Business Purpose:** Provide searchable preview specifications for `@sopin/sdk`, Studio blueprint schemas, MCP bindings, A2A delegation, and verification gates.
4. **Target Audience:** Developers, AI Engineers.
5. **Primary User Action:** Search or click a topic on the left sidebar (or horizontal strip on mobile), inspect `CodeBlock`, or request SDK access (`/contact`).
6. **Existing Content:** Search input, 5 specification topics (`quickstart`, `studio-sync`, `mcp-bindings`, `a2a-delegation`, `verification-gates`), responsive mobile snap strip, empty search `StateDisplay`, bottom access CTA.
7. **Existing UI Components:** `StatusText`, `CodeBlock`, `StateDisplay`.
8. **Missing Sections:** URL-addressable nested pages (`/docs/:slug`), grouped category sidebar (`Getting Started`, `Platform Guides`, `SDKs`, `Protocols`, `API`), right-rail TOC, Prev/Next footers, `Cmd+K` search modal, parameter tables.
9. **UX Problems:** Topic selection updates React state (`selectedId`) rather than the URL—users cannot copy/share direct links to a specific doc spec.
10. **Content Problems:** Only 5 concise overview pages (~80 words each); lacks CLI reference, error taxonomy, and ML/Enterprise operational docs.
11. **SEO Requirements:** Individual crawlable `/docs/:slug` routes with `TechArticle` structured data and canonical links.
12. **Recommended Improvements (P0/P1):** Add nested `/docs/:slug` routing, grouped navigation, parameter tables, and `Cmd+K` search dialog.

### Route 8: Solutions (`/solutions` — `SolutionsPage.tsx`)
1. **Page Name:** Solutions
2. **URL:** `/solutions` (`#business-automation`, `#ai-research`, `#software-engineering`, `#data-ml`, `#enterprise-ai`)
3. **Business Purpose:** Detail how SOPIN modules compose into applied topologies across key enterprise & engineering domains.
4. **Target Audience:** Engineering VPs, Operations Leads, Enterprise Architects, Data/ML Leaders.
5. **Primary User Action:** Read domain topology/bindings/verification criteria and click `"Discuss"` (`/contact`).
6. **Existing Content:** Hero + 5 vertical domain sections reusing `USE_CASE_DOMAINS` fixtures.
7. **Existing UI Components:** `StatusText`.
8. **Missing Sections:** Dedicated **Document Intelligence** and **Multi-Agent Applications** solutions; separated **Data Intelligence** and **Machine Learning** pages with real ML lifecycle details; solution templates linking into `/app`.
9. **UX Problems:** Long vertical stack without sticky anchor pills or role filter; `"Discuss"` links open `/contact` without pre-selecting `?topic=`.
10. **Content Problems:** Duplicates `HomePage` data verbatim without deeper architectural diagrams or sample outputs.
11. **SEO Requirements:** Separate canonical routes (`/solutions/business-automation`, `/solutions/document-intelligence`, `/solutions/machine-learning`, etc.).
12. **Recommended Improvements (P1):** Split into dedicated routes covering all 8 solution areas with tailored blueprints and `?topic=` pre-fill links.

### Route 9: Resources (`/resources` — `ResourcesPage.tsx`)
1. **Page Name:** Resources
2. **URL:** `/resources` (`#blog`, `#guides`, `#tutorials`, `#case-studies`, `#academy`)
3. **Business Purpose:** Serve engineering blogs, architecture guides, hands-on tutorials, and upcoming case study / Academy announcements.
4. **Target Audience:** AI Engineers, Builders, Technical Evaluators.
5. **Primary User Action:** Filter by category (`All`, `Blog`, `Guides`, `Tutorials`, `Case Studies`, `Academy`) or search, then open article/spec.
6. **Existing Content:** Clean category tablist (`role="tablist"`, `aria-selected`), instant search input, `StateDisplay` empty state, 7 resource cards (`5` Available, `2` Coming Soon/Planned). *(Note: Previously flagged `"Test Error State"` debug button and `180ms` spinner flash were cleanly removed!)*
7. **Existing UI Components:** `StatusText`, `StateDisplay`.
8. **Missing Sections:** Actual full-text `/resources/:slug` article pages (currently `"Read Spec"` sends visitors to `/docs` instead of reading the article); **AI Research**, **Product Updates / Changelog**, and **Community** tracks.
9. **UX Problems:** Clicking `"Read Spec"` on a Blog/Guide/Tutorial jumps out to generic `/docs` instead of opening that piece's content.
10. **Content Problems:** Cards act as summaries without long-form engineering prose, architecture diagrams, or author attribution.
11. **SEO Requirements:** Long-form `/resources/:slug` pages are the primary organic search & GEO growth lever; require `Article` / `TechArticle` JSON-LD and canonicals.
12. **Recommended Improvements (P0/P1):** Create dedicated `/resources/:slug` article renderer seeded with the 16-article technical calendar.

### Route 10: Pricing & Access (`/pricing` — `PricingPage.tsx`)
1. **Page Name:** Early Access & Licensing Model
2. **URL:** `/pricing`
3. **Business Purpose:** Explain SOPIN's pre-GA access pathways and Managed Cloud vs. Self-Hosted Runtime deployment models honestly.
4. **Target Audience:** Developers, Team Leads, Enterprise Procurement & Architects.
5. **Primary User Action:** Switch `Managed Cloud (Planned)` vs. `Self-Hosted Runtime (Planned)` and click CTA (`/contact`).
6. **Existing Content:** Hero + topology toggle, 3 access cards (`Developer Preview`, `Team Workspace`, `SONIL Enterprise`), `Pricing Principles` header.
7. **Existing UI Components:** `StatusText`, `SectionHeader`.
8. **Missing Sections:** Structured feature comparison table; explicit BYOK (bring your own keys) vs. Managed Gateway metering model; FAQ accordion; details underneath `Pricing Principles` header.
9. **UX Problems:** `Pricing Principles` `SectionHeader` still ends abruptly with no cards/body below it; toggle buttons lack `role="tablist"`.
10. **Content Problems:** Strong honesty avoiding fake prices, but needs concrete scope limits/support boundaries per tier.
11. **SEO Requirements:** Target *"SOPIN pricing"*, *"enterprise AI agent platform pricing"*, *"self-hosted AI agent runtime"*; add `FAQPage` JSON-LD.
12. **Recommended Improvements (P2):** Populate `Pricing Principles` body, add comparison `<DataTable>`, add FAQ, and pass `?plan=` into `/contact`.

### Route 11: About SOPIN (`/about` — `AboutPage.tsx`)
1. **Page Name:** About SOPIN & SONIL Group
2. **URL:** `/about`
3. **Business Purpose:** Communicate SOPIN's founding engineering thesis, official brand mark, and SONIL Group stewardship.
4. **Target Audience:** Enterprise Buyers, Partners, Prospective Hires, Press.
5. **Primary User Action:** Read engineering thesis and click `"Connect With Us"` (`/contact`).
6. **Existing Content:** Hero, 3 thesis cards, Official Brand Identity block displaying `/assets/aistudio/Sopin_Logo_46f7e074.png`, SONIL Group CTA banner.
7. **Existing UI Components:** `StatusText`, `SectionHeader`.
8. **Missing Sections:** Clear **Vision and Mission**, dedicated **SONIL Group** context, **Careers**, **Partners**, **Trust & Security Center** link, and explicit `width`/`height` on PNG asset.
9. **UX Problems:** Solid `#000000` brand container in light mode lacks caption metadata/brand download kit; no secondary links into Careers/Partners/Security.
10. **Content Problems:** Lacks narrative explaining why SONIL Group builds foundational AI systems and global enterprise ambition.
11. **SEO Requirements:** Target *"SOPIN AI"*, *"SONIL Group AI"*; add `Organization` JSON-LD linking `parentOrganization`.
12. **Recommended Improvements (P2):** Expand with Vision/Mission, SONIL Group profile, and navigation to Careers, Partners, and `/security`.

### Route 12: Contact (`/contact` — `ContactPage.tsx`)
1. **Page Name:** Contact
2. **URL:** `/contact`
3. **Business Purpose:** Capture Developer Preview, Design Partner, Enterprise Architecture, and Partnership inquiries.
4. **Target Audience:** Prospective users, engineering leaders, enterprise buyers.
5. **Primary User Action:** Complete 5-field form (`name`, `email`, `organization`, `topic`, `message`) and submit.
6. **Existing Content:** Direct channel card (`hello@sopin.ai`, SONIL Group), 5-field form with client validation and confirmation alert.
7. **Existing UI Components:** `StatusText`, accessible labels + error summaries.
8. **Missing Sections:** Live server submission (`POST /api/contact`), URL `?topic=` pre-selection from product/solution pages, expected response SLA, links to Docs/Pricing.
9. **UX Problems:** **P1 Credibility Risk:** Line 83 tells visitors *"This prototype validates form inputs locally without transmitting data to a backend server"* and line 98 confirms *"passed validation in this prototype preview"*. Native `<select>` arrow styling varies by OS.
10. **Content Problems:** Only lists `hello@sopin.ai`; enterprise security/partner channels should be routed cleanly.
11. **SEO Requirements:** Clean `ContactPage` schema; accurate title/description.
12. **Recommended Improvements (P1):** Connect real backend intake endpoint (`express`/FastAPI) and remove prototype disclaimers upon activation.

### Route 13: Interactive Mobile-First Workspace Prototype (`/app` — `SopinAppShell.tsx`)
1. **Page Name:** SOPIN Interactive Workspace Prototype (`SopinAppShell`)
2. **URL:** `/app`
3. **Business Purpose:** Allow visitors and mobile users to experience SOPIN hands-on across workspace management, agent creation, flow design, knowledge indexing, live-style local run timelines, Recharts performance monitoring, and governance controls.
4. **Target Audience:** All visitors exploring SOPIN on mobile, tablet, or desktop (`Try SOPIN`).
5. **Primary User Action:** Switch tabs (`Home`, `Build`, `Run`, `Knowledge`, `More`), switch/create workspaces, build an agent/flow, dispatch a simulated run, approve/reject a pending gate, toggle MCP tools/policies, and inspect the 30-day Recharts chart.
6. **Existing Content & Capabilities:**
   - **Navigation Shell (`SopinAppShell.tsx`, `597` lines):** Mobile bottom nav (`5` primary tabs), tablet/desktop left rail, workspace switcher `BottomSheet`, `OfflineBanner`, PWA install trigger (`usePWAInstall`).
   - **Home (`AppHomeView.tsx`, `379` lines):** Workspace metrics, pending approvals inbox with one-tap approve/reject, **Recharts 30-day Agent Performance Chart (`AgentPerformanceChart.tsx`, `416` lines)** plotting Success Rate (%) and Avg Execution Time (s), recent runs list.
   - **Build (`AppBuildView.tsx`, `1,320` lines):** 5-step Agent Studio wizard, NL prompt-to-agent spec compiler, visual/graph topology inspector, vertical Workflow (`Flow`) builder, agent publish sheet.
   - **Run (`AppRunView.tsx`, `562` lines):** Task dispatch sheet, step-by-step execution timeline, retrieved citation preview, retry simulation, human approval gate resolution, markdown deliverable view.
   - **Knowledge (`AppKnowledgeView.tsx`, `499` lines):** Local file/image upload, URL scope registration, indexed chunk & checksum inspector, source removal audit entry.
   - **More (`AppMoreView.tsx`, `605` lines):** 7 operational sub-views (`governance`, `models`, `integrations`, `evaluations`, `monitoring` [with Recharts chart], `deployments`, `settings`) + reset demo state action.
7. **Existing UI Components:** `SopinLogo`, `BottomSheet`, `OfflineBanner`, `AgentPerformanceChart` (`recharts`), custom store (`useAppWorkspaceStore.ts`, `1,187` lines).
8. **Missing Capabilities (vs. Production Target):**
   - **Zero Backend Sync:** State lives solely in browser `localStorage` under `sopin-app-workspace-v1` (cannot collaborate across devices or run real LLMs/MCP servers).
   - **No Authentication / Multi-User RBAC:** No real OIDC/SAML login or user session enforcement.
   - **No ML/DL Pipeline:** Persona D's dataset profiler, transforms, training jobs, eval matrix, and model registry do not exist in `/app`.
   - **Contrast Minor Issue:** `AgentPerformanceChart.tsx` lines 310 & 316 use `#777786` axis tick fills.
9. **UX Problems:** `AppBuildView.tsx` (`1,320` lines) and `useAppWorkspaceStore.ts` (`1,187` lines) bundle large amounts of state and UI in single files; deep sub-states inside `/app` (e.g. `More -> Governance`) don't sync to URL paths (`/app/governance`).
10. **Content Problems:** Clearly labeled `"local prototype"`, which is appropriately transparent for preview—must transition cleanly when FastAPI endpoints connect.
11. **SEO Requirements:** Mark `/app` with `<meta name="robots" content="noindex, nofollow">` once authenticated/app-shell state rolls out so search engines index marketing/product pages instead of empty/local app state.
12. **Recommended Improvements (P1/P2):** Decompose `useAppWorkspaceStore.ts` + `AppBuildView.tsx`, fix `#777786` chart stroke/ticks, add sub-route URL support (`/app/:tab`), and wire progressively to FastAPI + PostgreSQL + Redis in Phase 3–7.

### System Route: 404 Not Found (`*` — `NotFoundPage.tsx`)
- **Current Behavior (`useRoute.ts` + `NotFoundPage.tsx`):** Unknown URLs now correctly resolve `isNotFound: true`, set `document.title = 'Page Not Found — SOPIN'`, and render `NotFoundPage` with quick navigation to Homepage, Platform, Docs, and Try SOPIN (`/app`).
- **Remaining Gaps (P0):** `useRoute.ts` does not inject `<meta name="robots" content="noindex">` on `isNotFound`, and static SPA hosting still returns HTTP `200` on unknown URLs unless edge/SSR routing returns a true HTTP `404` status code.

---

## 6. Missing Pages & Routes Inventory (Explicit Audit)

Every destination requested in the target platform scope that does **not** yet exist as a dedicated route is marked **MISSING**:

| Category | Requested Page / Destination | Current Status in Repo | Gap / Impact |
|----------|------------------------------|------------------------|--------------|
| **Platform** | **SOPIN Graph** (`/graph`) | **MISSING** | Only a Studio tab snippet and `/app` node toggle; no dedicated product page. |
| **Platform** | **SOPIN Runtime** (`/runtime`) | **MISSING** | Resolves only to `#runtime` on `/platform`; needs dedicated product page. |
| **Platform** | **SOPIN Gateway** (`/gateway`) | **MISSING** | Resolves only to `#gateway` on `/platform`; needs dedicated product page for model discovery, multimodal routing & MCP gateway. |
| **Platform** | **SOPIN Observe** (`/observe`) | **MISSING** | Resolves only to `#evaluations` on `/platform`; needs dedicated page (`Planned`). |
| **Platform** | **SOPIN Evaluate** (`/evaluate`) | **MISSING** | Resolves only to `#evaluations` on `/platform`; needs dedicated page (`Planned`). |
| **Platform** | **SOPIN Control** (`/control`) | **MISSING** | Resolves only to `#governance` on `/platform`; needs dedicated page (`Planned`). |
| **Platform** | **SOPIN Cloud** (`/cloud`) | **MISSING** | Only a toggle option on `/pricing`; needs dedicated architecture page. |
| **Platform** | **SOPIN Enterprise** (`/enterprise`) | **MISSING** | Only a summary card on `/solutions` & `/pricing`; needs dedicated enterprise architecture page. |
| **Solutions** | **Document Intelligence** (`/solutions/document-intelligence`) | **MISSING** | Not represented as a dedicated solution block or route. |
| **Solutions** | **Multi-Agent Applications** (`/solutions/multi-agent`) | **MISSING** | Not represented as a standalone solution route. |
| **Solutions** | **Data Intelligence** & **Machine Learning** (separate) | **PARTIAL / MERGED** | Merged into `#data-ml` card; lacks ML training, evaluation & registry flows. |
| **Developers** | **API Reference** (`/developers/api`) | **MISSING** | Not implemented. |
| **Developers** | **SDKs** (`/developers/sdks`) | **MISSING** | Only a TS/Python toggle on `/developers#sdk`. |
| **Developers** | **MCP Integrations** & **A2A Interoperability** | **PARTIAL / MERGED** | Combined into `/developers#protocols`. |
| **Developers** | **Agent Templates** (`/templates`) | **MISSING** | Public template gallery not implemented (only 3 starter presets inside `/app`). |
| **Developers** | **GitHub and Community** (`/community`) | **MISSING** | Not implemented. |
| **Resources** | **Article Detail Pages** (`/resources/:slug`) | **MISSING** | Resource cards redirect to `/docs` instead of full articles. |
| **Resources** | **AI Research** (`/resources/research`) | **MISSING** | Not implemented as a resource category. |
| **Resources** | **Product Updates / Changelog** (`/changelog`) | **MISSING** | Not implemented. |
| **Company** | **Vision & Mission**, **SONIL Group**, **Careers**, **Partners** | **MISSING** | Only a single `/about` page exists. |
| **Trust / Ops** | **Trust & Security Center** (`/security` / `/trust`) | **MISSING** | Critical P1 gap for enterprise AI buyers. |
| **Trust / Ops** | **Platform Status** (`/status`) | **MISSING** | Needed once Cloud/Runtime preview launches (`Planned`). |

---

## 7. Prioritized Implementation Plan (P0–P3)

### Phase A — Immediate Technical & SEO Fixes (P0)
1. **Complete SEO & Routing Foundations:** Inject `<link rel="canonical">` for all public routes and `<meta name="robots" content="noindex">` on `NotFoundPage` and `/app`; add `public/robots.txt`, `public/sitemap.xml`, and `public/llms.txt`; add Vite SSG/pre-rendering for public routes with real HTTP `404` responses.
2. **Wire Contact Intake (`ContactPage.tsx`):** Connect a lightweight `POST /api/contact` endpoint (matching `express` already in `package.json` or FastAPI later) and replace prototype disclaimer copy.
3. **Deepen `/docs/:slug` & `/resources/:slug`:** Convert `/docs` topics to bookmarkable URLs and create real full-text article views for `/resources/:slug`.

### Phase B — Information Architecture, Security & Persona Expansion (P1)
4. **Launch 8 Missing Platform Product Pages:** Build dedicated pages for `SOPIN Graph`, `SOPIN Runtime`, `SOPIN Gateway`, `SOPIN Observe` (`Planned`), `SOPIN Evaluate` (`Planned`), `SOPIN Control` (`Planned`), `SOPIN Cloud`, and `SOPIN Enterprise`, plus `/solutions/*` and `/developers/*` sub-routes.
5. **Launch Trust & Security Center (`/security`):** Publish transparent isolation, RBAC, BYOK vault, sandbox, and privacy architecture under SONIL Group without fabricated certifications.
6. **Add AI/ML Engineer & Enterprise Admin Journeys:** Introduce ML dataset-to-Gateway workflows (`Data` -> `Explore` -> `Train` -> `Evaluate` -> `Register` -> `Deploy`) and Enterprise RBAC/policy previews.
7. **Eliminate Residual Contrast & ARIA Gaps:** Replace the 4 leftover `#777786` values (`HomePage.tsx`, `AgentPerformanceChart.tsx`) with `#5E5E6E`, and apply full WAI-ARIA `tablist`/`tab`/`tabpanel` attributes on all public tab widgets.

### Phase C — Design System & Monolith Refactoring (P2)
8. **Decompose Monolithic Files:** Modularize `AppBuildView.tsx` (`1,320` lines), `useAppWorkspaceStore.ts` (`1,187` lines), `ProductPreviews.tsx` (`1,065` lines), and `sopinData.ts` (`949` lines) into clean feature slices; add `<ErrorBoundary>` around `<main>` and `/app`.
9. **Extract Shared Design System Primitives:** Standardize `<Button>`, `<Tabs>`, `<DataTable>`, `<Dialog>`, `<Tooltip>`, `<FormField>`, and `<TelemetryChart>` in `src/components/ui/`.
10. **Refine Homepage 18-Section Narrative:** Add standalone *Models & Multimodal Intelligence*, *Evaluations & Observability*, and *Documentation & Learning* sections.

### Phase D — Live Backend Platform & Ecosystem Scale (P3)
11. **Connect `/app` to FastAPI + PostgreSQL + Redis + Temporal + Gateway + OpenTelemetry:** Transition `/app` from `localStorage` simulation into multi-tenant authenticated SaaS/Enterprise execution, and launch `/templates`, `/changelog`, `/community`, and `/status`.

---

## 8. Acceptance Criteria

- **Crawlability & Indexing:** Every public route emits pre-rendered HTML with unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and appropriate JSON-LD; undefined URLs return `NotFoundPage` with `noindex` (and HTTP `404` on server).
- **Zero Public Prototype Disclaimers on Marketing Forms:** `ContactPage.tsx` submits through a live server endpoint with validation, error handling, and rate limiting.
- **100% Product Ecosystem Coverage:** All 12 Platform entries (Overview + 11 product modules: `Studio`, `Flow`, `Context`, `Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, `Enterprise`) have dedicated crawlable routes and honest status badges.
- **Accessibility & Performance Gates:** `tsc --noEmit` and `npm run build` succeed cleanly; zero `#777786` WCAG AA violations remain; `375px`, `768px`, `1024px`, and `1440px` layouts pass zero-horizontal-overflow checks across both light and dark modes.

---

## 9. Addendum — SOPIN Decisions Ecosystem Expansion (12 Product Modules)

- Added **SOPIN Decisions** (`/decisions`, `ProductDetailPage`, `ProductPreviews` 9th interactive tab, `DocsPage` `/docs/decisions-spec`, and `ResourcesPage` `/resources/guide-sopin-decisions`), expanding the Platform Ecosystem grid to 12 balanced modules (`Studio`, `Flow`, `Decisions`, `Context`, `Graph`, `Runtime`, `Gateway`, `Observe`, `Evaluate`, `Control`, `Cloud`, `Enterprise`).
- Added the 10-section mobile-first **Decisions** workspace tab inside `/app` and integrated **Decision Nodes** directly into `SOPIN Flow` (`AppBuildView.tsx` + `useAppWorkspaceStore.ts`).

