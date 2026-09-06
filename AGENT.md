# AGENT.md — Smart IoT Poultry Dashboard: UI/UX Refactor & Architecture Spec

This file is the single source of truth for the AI agent (Antigravity) performing a full
UI redesign and file-architecture refactor of this Next.js project. Read this entire
document before writing any code. When in doubt, this file wins over guesses.

---

## 1. Role & Context

You are acting as a **Senior Frontend Engineer + Product Designer** embedded in this
codebase. You are not a chatbot generating a demo — you are refactoring a real,
already-functioning IoT dashboard (Next.js 15, React 19, Firebase Realtime Database,
Tailwind CSS, shadcn/ui, Recharts/Chart.js) that controls and monitors a physical
poultry farm system (temperature, humidity, food level, water level, camera feed,
automation controls).

Two constraints govern everything you do:

1. **Do not break functionality.** All Firebase reads/writes, realtime listeners,
   camera proxy routes, auth flows, and scheduling logic must keep working exactly as
   they do today. This is a **visual and structural refactor**, not a feature rewrite.
2. **Do not ship another generic AI-looking dashboard.** The current UI (gradient icon
   tiles, glass cards, glowing shadows, staggered fade-up animations) reads as
   templated AI output. Your job is to replace it with the restrained, modern,
   product-grade look defined in Section 3, based on two reference designs
   (Davbank and Quixotic finance dashboards) supplied by the project owner.

---

## 2. Objective

Two parallel workstreams, done together, page by page:

- **A. Visual redesign** — rebuild every screen using the design system in Section 3.
- **B. File architecture refactor** — reorganize the codebase into a feature-based
  Next.js structure (Section 5) so the project is easy to navigate, easy to extend,
  and demonstrable as clean, professional code — not a flat pile of `components/`.

Do not treat these as sequential phases where design happens first and structure later
("big bang rewrite"). Refactor structure and redesign UI **per feature/page**, verify
it still works, then move to the next page.

---

## 3. Design System (derived from reference screenshots)

The two references (Davbank, Quixotic) share a consistent visual language. Extract the
*pattern*, not the literal brand colors — this system replaces the finance-specific
colors with a palette appropriate for a farm/IoT product, while keeping the structure,
spacing, and restraint identical.

### 3.1 Core visual principles

- **Flat, not glassy.** No `backdrop-blur`, no translucent glass cards, no glowing
  drop-shadows. Cards are solid white (or solid dark surface in dark mode) with a
  hairline border or a very soft, single-layer shadow (`shadow-sm`).
- **One accent color, used sparingly.** The reference dashboards use a single green
  accent for primary actions, active nav state, and positive data — everything else is
  neutral gray/white/black. Do the same: pick **one** accent (see 3.2) and stop
  reaching for a different gradient per card. Status color (red/amber) is reserved
  only for genuine alerts, never for decoration.
- **No per-icon gradient tiles.** Current code wraps every icon in a colored gradient
  box (`bg-gradient-warm`, `bg-gradient-water`, `bg-gradient-sage`). Replace with
  neutral, flat icon containers (light gray or tinted-at-10%-opacity of the single
  accent), consistent across all cards.
- **Big number, small label — not decorated.** Follow the reference: large bold
  figure, small muted caption above/below it, optional small percentage/status pill
  next to it. No large decorative icons competing with the number.
- **Whitespace over ornamentation.** Generous padding (24–32px card padding), clear
  vertical rhythm, no dense borders separating every sub-element.
- **No staggered entrance animation choreography.** Drop the
  `animate-fade-in-up` + per-card `animationDelay` cascade pattern — it's a strong
  "AI slop" signal. A single, subtle fade/opacity transition on route load (if any) is
  enough. Data updates (new sensor values) should update in place, not re-animate the
  whole card.
- **Sidebar, not top-heavy chrome.** Follow both references: a persistent left
  sidebar with icon + label nav items, a pill/rounded highlight on the active item,
  and a lightweight top bar (search or page title + date range + primary action button
  + avatar/notification icons) — not a heavy hero header with badges stacked
  horizontally.
- **Tables for lists, not cards.** "Recent Alerts" / "Feeding History" style data
  should render as a clean row-based table (see Quixotic's Payment History) — icon +
  name, date/time, status pill, value — not a stack of bordered boxes.
- **Charts are quiet.** Soft single or dual-tone bar/line charts, muted gridlines,
  no neon colors, tooltips minimal. Follow the "Engagement Rate" / "Payment
  Statistics" chart style: rounded bar tops, one highlighted bar/segment for emphasis
  when relevant (e.g., current reading), muted axis labels.

### 3.2 Color tokens

Define these as CSS variables in `app/globals.css` (extend, don't replace, the
existing shadcn variable names so `ui/` primitives keep working) and reference them in
`tailwind.config.ts`.

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--background` | `0 0% 98%` (near-white, slightly gray) | `0 0% 7%` | Page background |
| `--surface` (card bg) | `0 0% 100%` | `0 0% 10%` | Cards, sidebar, table rows |
| `--surface-muted` | `0 0% 96%` | `0 0% 14%` | Nested panels, hover rows |
| `--accent` | `142 45% 33%` (farm green) | `142 45% 45%` | Active nav, primary buttons, positive values |
| `--accent-foreground` | `0 0% 100%` | `0 0% 100%` | Text/icons on accent |
| `--foreground` | `0 0% 9%` | `0 0% 96%` | Primary text |
| `--muted-foreground` | `0 0% 45%` | `0 0% 65%` | Captions, labels |
| `--border` | `0 0% 91%` | `0 0% 18%` | Hairlines only |
| `--destructive` | `0 72% 51%` | `0 62% 55%` | Alerts only |
| `--warning` | `38 92% 50%` | `38 80% 55%` | Secondary alerts (e.g. medium food level) |

Do not introduce more accent hues. Every existing `bg-gradient-warm` /
`bg-gradient-water` / `bg-gradient-sage` / `text-brick` / `text-pond` / `text-sage`
usage must be migrated to this table (see Section 6).

### 3.3 Typography

- One heading font, one body font (current `font-heading` + system sans is fine —
  keep it, don't add a third font).
- Numbers (sensor readings, balances) use **tabular-nums** and a bold weight (600–700),
  sized 28–32px in cards, up to 40px for a single hero metric.
- Labels/captions are 12–13px, `muted-foreground`, medium weight, often uppercase or
  small-caps is optional — reference designs use plain sentence case, prefer that.

### 3.4 Spacing & shape

- Card radius: `rounded-2xl` (16px) consistently — not a mix of `rounded-lg`/`rounded-xl`.
- Card padding: `p-6` standard, `p-4` for compact list rows.
- Shadow: `shadow-sm` only, on `surface` cards against `background`. No colored
  shadows (`shadow-copper/20` etc.) — remove all of these.
- Grid gaps: `gap-6` between cards, `gap-4` within a card's internal stat rows.

### 3.5 Components implied by the references (map to this project's domain)

| Reference component | This project's equivalent |
|---|---|
| Total Balance card | Farm status summary card (connection state, active alerts count, last sync) |
| Payment Statistics bar chart w/ tabs (Today/Week/Month/Year) | Historical sensor chart w/ range tabs (Today/Week/Month) |
| Your Cards (card visual) | Camera feed preview card |
| Payment History table | Recent Alerts / Feeding & Watering event log table |
| Planning progress bars | Feed/water level progress bars, schedule progress |
| Sidebar nav w/ active pill | Existing NavigationMenu, restyled |
| Top bar search + notification bell | Page title + connection/alert badges + refresh action, restyled flat (no gradient button) |

### 3.6 Explicit anti-patterns (do NOT do these — they exist in the current code and must be removed)

- ❌ `bg-gradient-warm`, `bg-gradient-water`, `bg-gradient-sage`, or any new gradient
  utility for icon backgrounds or buttons.
- ❌ `glass-card`, `glass-card-elevated`, or any `backdrop-blur` card treatment.
- ❌ Per-card `animationDelay` staggering (`"100ms"`, `"150ms"`, `"200ms"`...).
- ❌ Colored glow shadows (`shadow-copper/20`, `shadow-lg shadow-*`).
- ❌ Icon-in-colored-circle where every card gets a different hue.
- ❌ Overloading a single card with border + shadow + gradient + colored icon +
  colored badge all at once — pick restraint.

---

## 4. Interaction with existing logic (do not touch)

These are business logic / data layers, not UI. Preserve behavior exactly, only move
file locations and update imports:

- Firebase Realtime Database paths (`/sensors`, `/alerts`, `/controls`) and all
  `onValue`/`get` listener logic.
- Alert threshold logic (temperature >32 / <24, food <20/<50, water <20/<30 etc.).
- Auth context gating (`isAuthenticated`, `authLoading`).
- Camera proxy and camera-control API routes.
- Feeding/watering scheduling algorithms in `lib/feeding-sched.ts`, `feeding-utils.ts`,
  `water-utils.ts`.

Where reasonable, extract inline data-fetching `useEffect` blocks (like the ones in
`dashboard.tsx`) into custom hooks (Section 5) — this is a structural improvement, not
a logic change. The Firebase calls themselves must remain functionally identical.

---

## 5. New File Architecture

Reorganize into a **feature-based** structure. Keep the Next.js `app/` directory as
thin route entry points only — no business logic or heavy JSX in `page.tsx` files
beyond composing feature components.

Ignore the existing `SKILLS/` folder entirely — it produced the old design and is not
part of this refactor (do not read from it, do not delete it either unless asked).

```
poultry-dashboard/
├── app/                              # Routing ONLY — thin pages, no logic
│   ├── layout.tsx
│   ├── page.tsx                      # imports <DashboardPage /> from features/dashboard
│   ├── loading.tsx
│   ├── globals.css
│   ├── about/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── feeding-schedule/
│   │   └── page.tsx
│   ├── feeding-analytics/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── water-schedule/
│   │   └── page.tsx
│   ├── water-analytics/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── manual-controls/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── api/
│       ├── camera-control/route.ts
│       ├── camera-proxy/route.ts
│       └── placeholder/[width]/[height]/route.ts
│
├── features/                         # NEW — all domain logic lives here, grouped by feature
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── dashboard-page.tsx        # top-level composed view, rendered by app/page.tsx
│   │   │   ├── sensor-card.tsx           # generic stat card (temp/humidity/food/water use this)
│   │   │   ├── farm-status-card.tsx      # connection + alert-count summary card
│   │   │   ├── camera-feed-card.tsx
│   │   │   ├── historical-chart.tsx
│   │   │   └── recent-alerts-table.tsx
│   │   ├── hooks/
│   │   │   ├── use-sensor-data.ts        # extracted from dashboard.tsx's sensors listener
│   │   │   ├── use-alerts.ts             # extracted alerts listener + alert-derivation logic
│   │   │   └── use-automation-state.ts
│   │   └── types.ts                      # SensorData, AlertsState, etc.
│   │
│   ├── feeding/
│   │   ├── components/
│   │   │   ├── feeding-control.tsx
│   │   │   ├── feeding-analytics-charts.tsx
│   │   │   └── feeding-schedule-form.tsx
│   │   ├── hooks/
│   │   │   └── use-feeding-schedule.ts
│   │   └── types.ts
│   │
│   ├── water/
│   │   ├── components/
│   │   │   ├── hydration-monitor.tsx
│   │   │   ├── water-usage-analytics.tsx
│   │   │   └── water-schedule-form.tsx
│   │   ├── hooks/
│   │   │   └── use-water-schedule.ts
│   │   └── types.ts
│   │
│   ├── manual-controls/
│   │   └── components/
│   │       └── manual-controls-panel.tsx
│   │
│   └── auth/
│       ├── components/
│       │   └── login-form.tsx
│       └── hooks/
│           └── use-login.ts
│
├── components/
│   ├── ui/                           # shadcn primitives — UNTOUCHED, no domain logic ever
│   └── common/                       # cross-feature, reusable, no domain logic
│       ├── navigation-menu.tsx
│       ├── clock-display.tsx
│       ├── logout-button.tsx
│       ├── theme-toggle.tsx
│       └── loading-animation.tsx
│
├── contexts/
│   ├── auth-context.tsx
│   └── theme-context.tsx
│
├── hooks/                            # truly global, non-feature hooks only
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── services/                         # NEW — external system integration layer
│   ├── firebase/
│   │   ├── client.ts                 # was lib/firebase.ts
│   │   ├── helpers.ts                # was lib/firebase-helpers.tsx
│   │   └── debug.ts                  # was lib/firebase-debug.ts
│   └── microcontroller/
│       └── integration.ts            # was lib/microcontroller-integration.ts
│
├── lib/                              # generic, framework-level utilities only (no domain logic)
│   ├── utils.ts                      # cn() helper, stays here
│   ├── feeding-sched.ts              # pure scheduling math — could also move to features/feeding/lib
│   ├── feeding-utils.ts
│   └── water-utils.ts
│
├── types/                            # NEW — shared/global TS types only (feature-specific types live in feature/types.ts)
│   └── index.ts
│
├── config/                           # NEW — constants pulled out of components
│   ├── alert-thresholds.ts           # e.g. TEMP_HIGH = 32, TEMP_LOW = 24, FOOD_LOW = 20 ...
│   └── nav-items.ts                  # sidebar nav config (icon, label, href) — makes navigation-menu.tsx data-driven
│
├── public/
├── styles/
│   └── globals.css                   # keep if still referenced; otherwise consolidate into app/globals.css
├── SKILLS/                           # DO NOT TOUCH — excluded from this refactor
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── AGENT.md                          # this file
```

### 5.1 Rules for the above

- **`app/*/page.tsx` files should be ~5–20 lines**: auth/loading guard (if needed) +
  render the feature's top-level component. All markup and state lives in `features/`.
- **One feature = one folder** containing its own `components/`, `hooks/`, and
  `types.ts`. If a feature grows a services need beyond Firebase reuse, add a
  `services.ts` inside that feature folder — don't put feature-specific fetch logic in
  the global `services/`.
- **`components/ui/`** stays exactly as-is (shadcn primitives) — never add
  business/domain logic there.
- **`components/common/`** is for components used by 2+ features with zero domain
  logic (nav, clock, theme toggle). If something is dashboard-only, it belongs in
  `features/dashboard/components/`, not here.
- **Hardcoded thresholds move to `config/`.** E.g. today `temperature > 32` is
  inline in `dashboard.tsx` — extract to `config/alert-thresholds.ts` and import.
  This alone is a strong "well-architected" signal for anyone reviewing the code.
- **Types**: feature-scoped types (`SensorData`, `AlertsState`) live in that feature's
  `types.ts`. Only truly cross-feature types (e.g. a shared `User` type) go in
  `types/index.ts`.
- Update all import paths (and `tsconfig.json` path aliases if you add new top-level
  folders) after moving files. Run the build after each feature migration to confirm
  nothing broke.

---

## 6. Migration Checklist (per page/feature)

For each feature (dashboard → feeding → water → manual-controls → auth/login → about):

1. Move logic-bearing code into `hooks/` under that feature; move presentational JSX
   into `components/`.
2. Replace all anti-pattern classes (Section 3.6) with the new design tokens
   (Section 3.2) and component patterns (Section 3.5).
3. Extract magic-number thresholds into `config/alert-thresholds.ts`.
4. Confirm the feature's `app/**/page.tsx` is now a thin composition file.
5. Run `pnpm build` (or `npm run build`) and fix type errors before moving to the next
   feature.
6. Visually compare against the reference screenshots' spacing/density — not pixel
   matching, but the same restrained, flat, single-accent feel.

---

## 7. Definition of Done

- No `gradient-warm` / `gradient-water` / `gradient-sage` / `glass-card*` classes
  remain anywhere in the codebase.
- No per-card animation-delay staggering remains.
- Every card uses the same radius, padding, shadow, and single-accent-color system.
- `app/` contains only routing + thin composition; all domain logic lives under
  `features/`.
- All Firebase realtime behavior, camera streaming, auth gating, and scheduling logic
  work identically to before the refactor.
- `pnpm build` passes with no type errors.