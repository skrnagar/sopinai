# SOPIN — Design System Audit & Component Standards

**Reference Implementation Audited:** `src/index.css`, `src/components/brand/SopinLogo.tsx`, `src/components/ui/EditorialPrimitives.tsx`, `src/components/ui/BottomSheet.tsx`, `src/components/ui/OfflineBanner.tsx`, `src/components/ui/PageSkeleton.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/interactive/*`, `src/app/*`, and all `13` page modules.

---

## 1. Brand Identity Direction (Preserved)
- **Symbol:** Exact 6-prong radial U-architecture emblem (`PRONG_ANGLES = [0, 60, 120, 180, 240, 300]`).
- **Wordmark:** Lightweight monoline geometric `"Sopin"` SVG matching open `S`, elliptical `o`, tangent-stem `p`, straight `i` stem, and continuous-arch `n` (`h * 1.08` optical scaling).
- **Signature Accent:** `#965BFF` purple exclusively highlights the dot over the `"i"` (with `purpleDot={false}` monochrome option for single-ink surfaces).
- **Color Foundation:** Black (`#101014`), White (`#FFFFFF`), Deep Navy (`#101126`), Light Surface (`#F7F7FA`), Indigo primary interactive (`#6252E8`), Purple accent (`#965BFF`).
- **Typography:** Rounded geometric display (`Outfit`), technical body (`Plus Jakarta Sans`), and code/IDs (`JetBrains Mono`).

---

## 2. Element-by-Element Design System Audit

| Element | Current State in Repo | Audit Finding | Priority | Recommended Standard |
|---------|-----------------------|---------------|----------|----------------------|
| **Logo & Wordmark** | `SopinLogo.tsx` custom inline SVG (`sm: 24px`, `md: 32px`, `lg: 42px`), `/assets/aistudio/Sopin_Logo_46f7e074.png` in `AboutPage.tsx`, and hero rotating radial emblem backdrop. | Clean, crisp, accurate to brand reference. Minor: `Navbar` logo uses `<a href="/">` while `Footer` logo still renders a `<button>`. | **P2** | Standardize logo links to `<a href="/">` everywhere; enforce `24px` minimum clearspace; add explicit `width`/`height` attributes on the About PNG asset. |
| **Typography** | Google Fonts (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`) in `index.html`; CSS tokens in `src/index.css`. | Strong hierarchy (`clamp(2.25rem, 4vw, 3.75rem)` hero H1, `text-balance`, `.tabular-nums`). Minor: external Google Fonts CDN adds network latency / FOUT risk in constrained environments. | **P2** | Self-host WOFF2 font subsets (`@fontsource` or `/public/fonts`) with `font-display: swap`; enforce `tabular-nums` on all metrics, timers, and chart axes. |
| **Colours & Contrast** | `--color-sopin-muted` in `src/index.css` IS updated to `#5E5E6E` (~`5.9:1` on `#F7F7FA`). Dual-theme via `@custom-variant dark`. | **Residual P1 Cleanup:** Four legacy `#777786` values remain (`HomePage.tsx` lines 471 & 486; `AgentPerformanceChart.tsx` lines 310 & 316). Also, `#965BFF` on `#FFFFFF` is ~`3.8:1`—below AA `4.5:1` for `<18px` body text when used directly on light cards. | **P1** | Replace all 4 remaining `#777786` tokens with `#5E5E6E`. Use `#6252E8` (`~5.1:1`) for interactive/small purple-family text on light backgrounds, reserving `#965BFF` on light grounds for the `i` dot, non-text accents, or dark `#101014`/`#101126` surfaces (`>6.5:1`). |
| **Grid & Spacing** | `max-w-[1280px] mx-auto px-6 lg:px-10`, 12-col grid, `py-16 lg:py-24` rhythm, `pt-safe`/`pb-safe` iOS notch utilities, `.no-scrollbar` utility. | Strong discipline across both marketing site and `/app` mobile shell. | **P2** | Formalize `--container-max: 1280px` token and verify `min-w-0` on every nested grid child. |
| **Buttons** | Inline utility classes repeated across 13 pages and `/app` views (`min-h-[44px]` mostly applied). | **Missing Shared Primitive:** 40+ buttons duplicate Tailwind strings, leading to minor height drift (`min-h-[40px]` vs `min-h-[44px]`). | **P1** | Extract `<Button variant="primary|secondary|ghost|dark" size="sm|md|lg" as="button|a">` enforcing `>=44px` touch targets on mobile/primary actions. |
| **Navigation & Mobile Drawers** | `Navbar.tsx` (`alignClass` edge-clamping with `left-0` / `right-0` + `max-w-[calc(100vw-2rem)]`), full mobile drawer with expandable categories, `Try SOPIN` + `Start Building` CTAs; `/app` has mobile bottom nav + tablet/desktop left rail + `BottomSheet`. | Edge-clamping and mobile drawer behavior are cleanly fixed. Minor: mega-menu sub-items render `<button role="menuitem">` without native `<a href>` (preventing middle-click open-in-new-tab), and `Platform` links point to `#hash` anchors. | **P1** | Render mega-menu destinations as semantic `<a href>` links with `aria-current="page"` on active items, pointing to dedicated routes as Phase 2 pages roll out. |
| **Mobile Surfaces (`BottomSheet`, `OfflineBanner`)** | `src/components/ui/BottomSheet.tsx` & `src/components/ui/OfflineBanner.tsx`. | Thoughtful mobile-first ergonomics (drag handle, backdrop dismissal, safe-area inset padding, `min-h-[44px]` controls, offline warning). | **P2** | Audit keyboard `Escape` key closing, focus trapping, and `aria-modal="true"` on `BottomSheet` so desktop/keyboard users match mobile touch quality. |
| **Cards** | Hairline `border-[#101014]/[0.08] dark:border-white/10`, `rounded-2xl`, subtle `0 1px 2px` shadow. | Crisp editorial restraint; zero glowing neon cards. Ecosystem cards on `HomePage` still use `<button>` rather than `<a>`. | **P2** | Extract `<SurfaceCard>` primitive and convert navigating cards to `<a>` anchors. |
| **Forms** | Standard `<input>`, `<select>`, `<textarea>` in `ContactPage.tsx`, search inputs in `DocsPage` / `ResourcesPage`, and local inputs in `/app`. | Native `<select>` styling inconsistencies; no unified `<FormField>`, `<TextInput>`, `<SelectInput>`, or `<FieldError>` components shared across site and `/app`. | **P2** | Create shared accessible form primitives in `src/components/ui/`. |
| **Tables** | **MISSING.** No reusable accessible `<table>` component yet (only list/grid rows in previews and `/app`). | Needed for Pricing comparison matrices, Docs API/SDK parameter tables, `Observe` run logs, and `Control` audit tables. | **P1** | Build `<DataTable>` with semantic `<table>`, sticky header, horizontal scroll wrapper, `tabular-nums`, and empty/loading states. |
| **Tabs** | WAI-ARIA `role="tablist"` implemented cleanly in `HomePage`, `ResourcesPage`, and `ProductPreviews`, but **omitted** in `StudioPage`, `DevelopersPage`, `PlatformPage`, and `PricingPage`. | Inconsistent accessibility semantics and arrow-key navigation across public pages. | **P1** | Extract shared `<Tabs>` primitive enforcing `role="tablist"`, `role="tab"`, `aria-selected`, and `ArrowLeft`/`ArrowRight` keyboard navigation. |
| **Dialogs / Modals** | `BottomSheet.tsx` handles slide-up mobile sheets, but no centered desktop `<Dialog>` modal primitive exists yet. | Needed for `Cmd+K` docs/app search, API key creation, and confirmation modals on large viewports. | **P2** | Build `<Dialog>` primitive pairing responsive centered desktop modal with bottom-sheet behavior on `<640px`. |
| **Tooltips** | **MISSING.** | Needed for graph node constraints, evaluation assertion descriptions, and permission hints. | **P2** | Build lightweight accessible `<Tooltip>` triggered on hover & keyboard focus (`aria-describedby`). |
| **Code Blocks & Graph Nodes** | `CodeBlock` (`EditorialPrimitives.tsx`) works well cleanly; custom node cards in `MultiAgentHeroCanvas`, `ProductPreviews`, and `AppBuildView`. | `CodeBlock` lacks lightweight syntax token colors and multi-file tabs; graph nodes are duplicated between `ProductPreviews` (`1,065` lines) and `AppBuildView` (`1,320` lines). | **P2** | Enhance `CodeBlock` and extract a shared `<GraphNode>` + edge component usable by both marketing previews and `/app` canvas. |
| **Charts & Telemetry** | **IMPLEMENTED in `/app`:** `AgentPerformanceChart.tsx` (`recharts ^3.8.1`, `416` lines) plots 30-day `Success Rate (%)` and `Avg Execution Time (s)`. Waterfall bars exist in `ProductPreviews` `Observe` tab. | Strong telemetry card using `#6252E8` and dark `#101126` framing, with `7D / 14D / 30D` range selector. Two minor issues: hardcoded `#777786` tick stroke/fill (lines 310 & 316) and Recharts isn't wrapped in a reusable `<TelemetryChart>` design-system primitive for public `Observe`/`Evaluate` previews yet. | **P1** | Replace `#777786` in `AgentPerformanceChart.tsx` with `#5E5E6E` (dark: `#9A9AB0`) and extract reusable `<TelemetryChart>` palette tokens for Phase 2–7 Observe/Evaluate views. |
| **Product Mockups (`ProductPreviews`)** | `ProductPreviews.tsx` (`1,065` lines) renders 8 tabs inside dark window chrome. | High visual quality, but on `<640px` mobile the 8-tab button matrix (`grid-cols-2`) pushes the interactive software preview far below the fold. | **P1** | Decompose into 8 modular components and convert `<640px` switcher into a single-row horizontal snap-scroll strip (`overflow-x-auto snap-x`). |

---

## 3. Standardized Design Tokens Specification (`src/index.css` Target)

```css
/* Color Semantics (Synchronized with src/index.css) */
--sopin-bg-primary: #FFFFFF;                  /* Dark: #101014 */
--sopin-bg-subtle: #F7F7FA;                   /* Dark: #101126 */
--sopin-bg-elevated: #FFFFFF;                 /* Dark: #15162E */
--sopin-text-primary: #101014;                /* Dark: #FFFFFF */
--sopin-text-muted: #5E5E6E;                  /* Dark: #A4A4B5 (~5.9:1 AA on #F7F7FA) */
--sopin-accent-primary: #6252E8;              /* Primary interactive indigo (~5.1:1 on white) */
--sopin-accent-primary-hover: #5243D6;
--sopin-accent-brand: #965BFF;                /* Selective purple: i-dot, dark-bg accents */
--sopin-border-hairline: rgba(16, 16, 20, 0.08);

/* Elevation & Radii */
--sopin-radius-sm: 0.5rem;
--sopin-radius-md: 0.75rem;
--sopin-radius-lg: 1rem;
--sopin-shadow-card: 0 1px 2px rgba(16, 16, 20, 0.04);
--sopin-shadow-card-hover: 0 8px 24px rgba(16, 16, 20, 0.06);
```

---

## 4. Breakpoint Audit Matrix (Desktop / Tablet / Mobile)

| Viewport | Layout Rules | Current Risks | Verification Checklist |
|----------|--------------|---------------|------------------------|
| **Desktop (`1280px–1536px`)** | `max-w-[1280px]`, 12-col grid, 6-item nav + Theme + `Try SOPIN` + `Start Building`; `/app` renders left rail + wide cards. | Mega-menu items rendered as `<button>` prevent native right-click "Open in new tab". | Verify `scrollWidth <= innerWidth` across all 13 routes + `NotFoundPage`. |
| **Small Desktop / Tablet Landscape (`1024px–1279px`)** | `lg:` active; `Navbar` uses `alignClass` (`left-0` / `right-0`) + `max-w-[calc(100vw-2rem)]`. | Header right cluster (`Theme` + `Try SOPIN` + `Start Building` + `6` links) sits tightly around `1024px`. | Audit header spacing at exact `1024px` viewport width so zero wrapping or horizontal crowding occurs. |
| **Tablet Portrait (`768px–1023px`)** | Hamburger drawer active (`lg:hidden`); `Try SOPIN` remains visible in header; 2–3 col grids; `/app` switches cleanly to responsive workspace view. | 3-col grids (`ContextPage`, `DevelopersPage`) can pinch card padding around `768px`. | Verify `gap-5`/`gap-6` and `min-w-0` wrapping at `768px`. |
| **Mobile (`375px–639px`)** | Single-column stack, expandable category drawer, `BottomSheet` modals, bottom 5-tab `/app` nav bar with `pb-safe`. | `ProductPreviews` `grid-cols-2` 8-tab block pushes window ~260px down on homepage/studio; Recharts chart tooltip/ticks use `#777786`. | Switch `<640px` `ProductPreviews` tabs to horizontal snap strip; audit touch targets (`>=44px`) on `375px` viewport. |
