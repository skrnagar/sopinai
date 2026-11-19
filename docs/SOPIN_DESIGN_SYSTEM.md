# SOPIN — Design System Audit & Component Standards

**Reference Implementation Audited:** `src/index.css`, `src/components/brand/SopinLogo.tsx`, `src/components/ui/EditorialPrimitives.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/interactive/*`, and all 12 page modules.

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
| **Logo & Wordmark** | `SopinLogo.tsx` custom inline SVG (`sm: 24px`, `md: 32px`, `lg: 42px`), paired with `/assets/aistudio/Sopin_Logo_46f7e074.png` in `AboutPage.tsx`. | Clean, crisp, accurate to reference. Minor: `Navbar` logo link uses `<a>` while `Footer` logo uses `<button>`. | **P2** | Standardize logo link to `<a href="/">` everywhere; enforce minimum `24px` clearspace around emblem; provide downloadable brand kit assets on `/about`. |
| **Typography** | Google Fonts (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`) loaded in `index.html`; `--font-display`, `--font-sans`, `--font-mono` in `src/index.css`. | Strong hierarchy (`clamp(2.25rem, 4vw, 3.75rem)` hero H1, `text-balance`). Minor: reliance on external Google Fonts CDN without local WOFF2 self-hosting slows FCP/LCP and causes FOUT in restricted networks. | **P2** | Self-host `Outfit`, `Plus Jakarta Sans`, and `JetBrains Mono` WOFF2 subsets via `@fontsource` or `/public/fonts` with `font-display: swap`; enforce `tabular-nums` on all metrics/step counters. |
| **Colours & Contrast** | `#101014`, `#FFFFFF`, `#101126`, `#6252E8`, `#965BFF`, `#F7F7FA`, `#777786`. Dual-theme via `@custom-variant dark`. | **Accessibility Issue:** `#777786` muted text on `#F7F7FA` light surface is ~`4.17:1` contrast (below WCAG AA `4.5:1` for small `12–14px` body copy). `#965BFF` on `#FFFFFF` is ~`3.8:1` (fails AA for `12px–14px` text when used on light cards!). | **P1** | Darken light-mode muted text token from `#777786` to **`#5B5B6B`** (`~6.0:1` on `#F7F7FA`). Use **`#6252E8`** (`~5.1:1`) for small purple-family text/links on light backgrounds, reserving `#965BFF` on light backgrounds strictly for the `i` dot, `>= 18px` bold UI accents, or on `#101126`/`#101014` dark surfaces where it exceeds `6.5:1`. |
| **Grid & Spacing** | `max-w-[1280px] mx-auto px-6 lg:px-10`, 12-col CSS grid, `py-16 lg:py-24` section cadence, `32px` architectural grid backgrounds. | Very disciplined vertical rhythm. Minor: missing `min-w-0` on one or two nested grids could risk overflow if long unbroken tokens appear. | **P2** | Standardize `max-w-[1280px]` container token (`--container-max`), `min-w-0` on every CSS grid child, and consistent `py-16 lg:py-24` section padding. |
| **Buttons** | Inline Tailwind button classes repeated across 12 pages (`bg-[#6252E8] hover:bg-[#5243d6]`, `min-h-[44px]` mostly applied). | **No shared `<Button>` primitive!** Repeated utility strings across 30+ buttons cause minor height/padding drift (`min-h-[40px]` vs `min-h-[44px]` vs default). | **P1** | Create reusable `<Button variant="primary|secondary|ghost|dark" size="sm|md|lg" as="button|a">` enforcing `min-h-[44px]` touch target on primary/mobile controls and consistent focus rings. |
| **Navigation** | `Navbar.tsx` with 6 top-level triggers, mega menus (`w-[720px]` / `w-[540px]`), `layoutId` active underline, mobile drawer. | Mega menus use `left-1/2 -translate-x-1/2`; at `1024px–1160px`, right-side items (`Resources` / `Developers`) risk overflowing or hugging the viewport edge. | **P1** | Anchor right-half dropdowns (`Developers`, `Resources`) with `right-0` or viewport-clamped CSS (`max-w-[calc(100vw-2rem)]`) and test at `1024px`. Add `aria-current` inside sub-items. |
| **Cards** | Hairline `border-[#101014]/[0.08] dark:border-white/10`, `rounded-2xl`, `shadow-[0_1px_2px_rgba(16,16,20,0.04)]`. | Consistent visual polish, zero heavy drop shadows or neon glow. Ecosystem cards on `HomePage` use `<button>` instead of `<a>`. | **P2** | Extract `<SurfaceCard>` primitive with `interactive` variant; render route-navigating cards as `<a>` links with accessible focus styles. |
| **Forms** | Standard `<input>`, `<select>`, `<textarea>` in `ContactPage.tsx`, search inputs in `DocsPage.tsx` and `ResourcesPage.tsx`. | Native `<select>` arrow inconsistency across OS/dark mode; no reusable `<Input>`, `<Select>`, `<Textarea>`, or `<FieldError>` components. | **P2** | Create `<FormField>`, `<TextInput>`, `<SelectInput>`, and `<TextArea>` primitives in `src/components/ui/` ahead of Phase 3 app forms. |
| **Tables** | **MISSING.** No reusable data table component exists (only ad-hoc `div` rows in `ProductPreviews`). | Needed for Pricing comparison matrix, API parameter tables, Observe run tables, Evaluate benchmarks, and Control RBAC/audit logs. | **P1** | Build accessible `<DataTable>` component (`<table>`, sticky header, horizontal scroll wrapper, `tabular-nums`, empty/loading states). |
| **Tabs** | Implemented ad-hoc in `HomePage`, `StudioPage`, `PlatformPage`, `DevelopersPage`, `PricingPage`, `ProductPreviews`. | `StudioPage`, `DevelopersPage`, `PlatformPage`, and `PricingPage` tabs lack `role="tablist"`, `role="tab"`, `aria-selected`, and arrow-key keyboard navigation. | **P1** | Extract shared `<Tabs>` primitive with full WAI-ARIA `tablist`/`tab`/`tabpanel` keyboard support (`ArrowLeft`/`ArrowRight`). |
| **Dialogs / Modals** | **MISSING.** | Required for `Cmd+K` global docs/workspace search, confirmation gates (`Control`), and SDK modal previews. | **P2** | Build accessible `<Dialog>` primitive with focus trap, `Escape` close, backdrop click close, and `aria-modal="true"`. |
| **Tooltips** | **MISSING.** | Needed for graph node specs, eval metric definitions, and RBAC permission hints. | **P2** | Build lightweight `<Tooltip>` with `aria-describedby` and keyboard focus support. |
| **Dropdowns** | Custom hover/click mega menus in `Navbar.tsx`; native `<select>` in `ContactPage`. | No reusable `<DropdownMenu>` primitive for filters, workspace switchers, or user menus. | **P2** | Build `<DropdownMenu>` with keyboard arrow navigation and `Escape` dismissal. |
| **Code Blocks** | `CodeBlock` in `EditorialPrimitives.tsx` (`bg-[#101126]`, copy button, label bar, `overflow-x-auto`). | Works well across desktop & mobile (`min-w-0` enforced). Missing syntax highlighting tokens (plain monochrome text) and line numbers / multi-file tab strip. | **P2** | Enhance `CodeBlock` with lightweight token coloring (`#B894FF` keywords, `#E8E8F2` identifiers, `#9A9AB0` comments) and optional file switcher tabs. |
| **Graph Nodes** | Custom node cards in `MultiAgentHeroCanvas` and `ProductPreviews` (`studio`, `flow`). | Clean, legible, interactive. Currently hardcoded SVG/grid layouts rather than a reusable `<GraphNode>` + edge connector system. | **P2** | Extract `<GraphNode>` (status, protocol tag, port anchors, selection ring) to prepare for Phase 4 real Studio/Flow canvas. |
| **Charts** | **MISSING.** (Waterfall timeline in `ProductPreviews` `observe` tab uses percentage-positioned bars). | Needed for `Evaluate` benchmark comparisons, `Observe` latency/token charts, and ML training loss curves. | **P2** | Standardize clean minimal SVG/chart tokens (`#6252E8` primary series, `#965BFF` comparison series, muted gridlines, `tabular-nums` axes). |
| **Product Mockups** | `ProductPreviews.tsx` (8 tabs inside dark window chrome) + `MultiAgentHeroCanvas`. | Realistic software aesthetic; avoids decorative blobs. `ProductPreviews` file is `1,066` lines and mixes all 8 tabs inline. | **P1** | Decompose into 8 modular preview components sharing a `<WorkspaceWindowChrome>` shell. |
| **Mobile Components** | Full-screen mobile drawer in `Navbar.tsx`, responsive grids (`grid-cols-1`, `sm:grid-cols-2`, `lg:grid-cols-12`). | `ProductPreviews` 8-tab grid (`grid-cols-2`) takes substantial vertical height on `375px` screens before the preview window appears. | **P1** | On `<640px` mobile, render `ProductPreviews` switcher as a sleek horizontal scroll strip (`overflow-x-auto snap-x`) or compact dropdown + pill-free tabs so the preview window stays above the fold. |

---

## 3. Standardized Design Tokens Specification (`src/index.css` Target)

```css
/* Color Semantics */
--sopin-bg-primary: #FFFFFF;           /* Dark: #101014 */
--sopin-bg-subtle: #F7F7FA;            /* Dark: #101126 */
--sopin-bg-elevated: #FFFFFF;          /* Dark: #15162E */
--sopin-text-primary: #101014;         /* Dark: #FFFFFF */
--sopin-text-secondary: #5B5B6B;       /* Dark: #B5B5C5 (AA >= 5.7:1 on #F7F7FA) */
--sopin-text-muted: #666677;           /* Dark: #9A9AB0 (AA >= 4.7:1 on #F7F7FA) */
--sopin-accent-primary: #6252E8;       /* Primary interactive indigo */
--sopin-accent-primary-hover: #5243D6;
--sopin-accent-brand: #965BFF;         /* Selective purple: i-dot, dark-bg kickers, active highlights */
--sopin-border-hairline: rgba(16, 16, 20, 0.08); /* Dark: rgba(255, 255, 255, 0.10) */

/* Elevation & Radii */
--sopin-radius-sm: 0.5rem;             /* 8px — buttons, inputs */
--sopin-radius-md: 0.75rem;            /* 12px — inner cards, tabs */
--sopin-radius-lg: 1rem;               /* 16px — primary feature cards, app windows */
--sopin-shadow-card: 0 1px 2px rgba(16, 16, 20, 0.04);
--sopin-shadow-card-hover: 0 8px 24px rgba(16, 16, 20, 0.06);
```

---

## 4. Breakpoint Audit Matrix (Desktop / Tablet / Mobile)

| Viewport | Layout Rules | Current Risks | Verification Checklist |
|----------|--------------|---------------|------------------------|
| **Desktop (`1280px–1536px`)** | `max-w-[1280px]`, 12-col grid, 6-item navbar + Start Building CTA, full mega menus. | Minimal risk; verify mega-menu `720px` width remains centered cleanly. | All 12 pages checked with zero horizontal scroll (`scrollWidth <= innerWidth`). |
| **Small Desktop / Tablet Landscape (`1024px–1279px`)** | `lg:` breakpoint active; navbar mega menus active. | `Resources` (`left-1/2 -translate-x-1/2 w-[540px]`) and `Developers` (`w-[720px]`) may clip near right viewport edge at `1024px`. | Clamp dropdown alignment to container edges; verify hero 5/7 split fits cleanly at `1024px`. |
| **Tablet Portrait (`768px–1023px`)** | Mobile hamburger drawer active (`lg:hidden`); 2-col card grids (`md:grid-cols-2` / `md:grid-cols-3`). | Long ecosystem titles or 3-col cards at `768px` can feel tight in `ContextPage` / `DevelopersPage`. | Ensure generous `gap-6` and readable `min-w-0` wrapping across `768px`. |
| **Mobile (`375px–639px`)** | Single-column stack, full-screen drawer, `min-h-[44px]` touch targets. | 8-tab preview grid pushes software window down ~260px; hero radial SVG backdrop must stay `overflow-hidden`. | Horizontal tab strip on `<640px` for `ProductPreviews`; verify zero `overflow-x` clipping on all code blocks. |
