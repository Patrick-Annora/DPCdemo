# Spec 02 — App Shell Layout & Design System

**Status:** Draft
**Depends on:** Spec 01 (Project Setup — Vite/React/Tailwind scaffold)
**Kernel refs:** §2.2 (Project Structure), §6 (Frontend Routes), §7 (Design System)
**SRD refs:** §5.1, §5.2

---

## 1. Overview

This spec defines the visual foundation of springfield-demand: the persistent app shell (sidebar + top bar + content area), the Tailwind theme tokens, and the reusable layout components that every page composes into. Nothing in this spec renders page-specific content — it provides the chrome and design vocabulary.

The design system is derived from **Springfield Marine's brand identity** — extracted from the company logo (`Logo-Springfield-Marine-Color-wWhite-8-25.svg`), the corporate website ([springfieldgrp.com](https://www.springfieldgrp.com/)), and the 2025 product catalog. The goal is an enterprise-grade demand planning application that feels like a natural extension of the Springfield Marine brand.

---

## 2. File Structure

All layout components live under `frontend/src/components/layout/`:

```
frontend/src/
  components/
    layout/
      AppShell.tsx            # Root layout wrapper
      Sidebar.tsx             # Left sidebar container
      SidebarGroup.tsx        # Collapsible nav group
      SidebarItem.tsx         # Single nav link
      TopBar.tsx              # Top bar with breadcrumbs, search, notifications
      Breadcrumbs.tsx         # Auto-generated breadcrumb trail
      ContentArea.tsx         # Scrollable content wrapper
  lib/
    navigation.ts            # Navigation config (groups, items, routes, icons)
    routes.ts                # Route path constants (if not already in Spec 01)
    design-tokens.ts         # Exported color constants for charts & programmatic use
  index.css                  # Tailwind theme extensions via @theme directive
```

---

## 3. Brand Foundation

### 3.1 Brand Color Sources

Colors were extracted from three authoritative sources:

| Source | Colors Extracted |
|--------|-----------------|
| **Logo SVG** | Navy `#084974`, Deep Blue `#025482`, Red `#ea2829`, White `#ffffff` |
| **Website** | Navy `#0b4874`, Gold `#ffc10a`, Dark Gray `#32373c`, Cyan Blue `#0693e3` |
| **Catalog** | Navy header bars, gold accent rules, white product photography backgrounds |

### 3.2 Brand Typography

The corporate website uses `helvetica-neue-lt-pro` as the primary typeface. For the web application, use `Inter` (open-source, optimized for UI) as the primary font with a system sans-serif fallback stack. Inter provides excellent numeric readability — critical for a data-heavy demand planning interface.

```
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

For monospace data (table numerics, KPIs): `'JetBrains Mono', ui-monospace, monospace`

---

## 4. Tailwind Theme Tokens

Defined in `frontend/src/index.css` using Tailwind CSS 4's `@theme` directive. This is the **single source of truth** for all design tokens.

### 4.1 CSS Theme Definition

```css
/* frontend/src/index.css */
@import 'tailwindcss';

@theme {
  /* ── Brand: Springfield Navy ── */
  --color-navy-50:  #f0f7fc;
  --color-navy-100: #dcedf8;
  --color-navy-200: #b8daf1;
  --color-navy-300: #84bfe6;
  --color-navy-400: #4a9dd6;
  --color-navy-500: #2a7db8;
  --color-navy-600: #0b4874;   /* Website primary — headers, nav, buttons */
  --color-navy-700: #084974;   /* Logo primary — sidebar, dark UI */
  --color-navy-800: #063d62;
  --color-navy-900: #025482;   /* Logo deep blue — darkest brand surface */
  --color-navy-950: #021e30;

  /* ── Brand: Springfield Gold ── */
  --color-gold-50:  #fffbeb;
  --color-gold-100: #fff3c4;
  --color-gold-200: #ffe588;
  --color-gold-300: #ffd54f;
  --color-gold-400: #ffc10a;   /* Website accent — CTAs, highlights */
  --color-gold-500: #e6a800;
  --color-gold-600: #cc9200;
  --color-gold-700: #a37300;
  --color-gold-800: #7a5600;
  --color-gold-900: #523a00;

  /* ── Brand: Springfield Red (from logo flag) ── */
  --color-springfield-red: #ea2829;

  /* ── Semantic: Status & KPI ── */
  --color-success-50:  #ecfdf5;
  --color-success-100: #d1fae5;
  --color-success-500: #10b981;
  --color-success-700: #047857;

  --color-warning-50:  #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;

  --color-danger-50:  #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-500: #ef4444;
  --color-danger-700: #b91c1c;

  --color-info-50:  #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-500: #3b82f6;
  --color-info-700: #1d4ed8;

  /* ── Surface & Background ── */
  --color-surface-primary:   #ffffff;
  --color-surface-secondary: #f8fafc;   /* slate-50 — page background */
  --color-surface-tertiary:  #f1f5f9;   /* slate-100 — card hover, input bg */
  --color-surface-sidebar:   #025482;   /* Navy-900 — branded sidebar */
  --color-surface-topbar:    #ffffff;

  /* ── Typography ── */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;

  /* ── Spacing: Content Areas ── */
  --spacing-page: 1.5rem;     /* px-6 py-6 */
  --spacing-card: 1.25rem;    /* p-5 */
  --spacing-card-gap: 1rem;   /* gap-4 between cards */

  /* ── Border Radius ── */
  --radius-card: 0.5rem;      /* rounded-lg */
  --radius-badge: 9999px;     /* rounded-full for pills */
  --radius-button: 0.375rem;  /* rounded-md */

  /* ── Shadows ── */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

### 4.2 Sidebar — Navy-Branded

The sidebar uses the deep navy brand color as its background, creating a strong brand anchor. This is the single most recognizable brand element in the app.

| Element | Color | Classes |
|---------|-------|---------|
| Sidebar background | `#025482` (navy-900) | `bg-navy-900` |
| Sidebar border | `#063d62` (navy-800) | `border-navy-800` |
| Nav item text (default) | White @ 70% | `text-white/70` |
| Nav item text (hover) | White @ 100% | `text-white` |
| Nav item text (active) | White @ 100% | `text-white` |
| Nav item bg (hover) | White @ 10% | `bg-white/10` |
| Nav item bg (active) | White @ 15% | `bg-white/15` |
| Active indicator | Gold-400 | 3px left border `border-l-3 border-gold-400` |
| Group label | White @ 40% | `text-white/40 text-xs uppercase tracking-wider` |
| Logo area | White text / logo on navy | `text-white font-bold` |
| Collapse toggle | White @ 50% | `text-white/50 hover:text-white` |

### 4.3 Alert Severity Colors

| Token Prefix | Level | Background | Border | Text | Icon |
|---|---|---|---|---|---|
| `severity-critical` | CRITICAL | `bg-danger-50` | `border-danger-500` | `text-danger-700` | `text-danger-500` |
| `severity-warning` | WARNING | `bg-warning-50` | `border-warning-500` | `text-warning-700` | `text-warning-500` |
| `severity-watch` | WATCH | `bg-gold-50` | `border-gold-400` | `text-gold-700` | `text-gold-500` |
| `severity-excess` | EXCESS | `bg-info-50` | `border-info-500` | `text-info-700` | `text-info-500` |

Implementation — lookup object in `lib/design-tokens.ts`:

```ts
export const SEVERITY_STYLES: Record<AlertLevel, { bg: string; border: string; text: string; icon: string }> = {
  CRITICAL: { bg: 'bg-danger-50',  border: 'border-danger-500',  text: 'text-danger-700',  icon: 'text-danger-500' },
  WARNING:  { bg: 'bg-warning-50', border: 'border-warning-500', text: 'text-warning-700', icon: 'text-warning-500' },
  WATCH:    { bg: 'bg-gold-50',    border: 'border-gold-400',    text: 'text-gold-700',    icon: 'text-gold-500' },
  EXCESS:   { bg: 'bg-info-50',    border: 'border-info-500',    text: 'text-info-700',    icon: 'text-info-500' },
};
```

### 4.4 Source Node Colors

| Source | Badge Classes | Chart Hex |
|---|---|---|
| SCHECO_SHANGHAI | `bg-navy-100 text-navy-800 border-navy-300` | `#084974` |
| NIXA_MO | `bg-success-100 text-success-700 border-success-500` | `#10b981` |
| SHARK_NZ | `bg-violet-100 text-violet-800 border-violet-300` | `#8b5cf6` |

```ts
export const SOURCE_STYLES: Record<SourceNode, { bg: string; text: string; border: string; hex: string }> = {
  SCHECO_SHANGHAI: { bg: 'bg-navy-100',    text: 'text-navy-800',    border: 'border-navy-300',    hex: '#084974' },
  NIXA_MO:         { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500', hex: '#10b981' },
  SHARK_NZ:        { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300',  hex: '#8b5cf6' },
};
```

### 4.5 Parameter Status Colors

| Status | Badge Classes | Dot Color |
|---|---|---|
| NOT_SET | `bg-slate-100 text-slate-600` | `bg-slate-400` |
| SYSTEM_CALCULATED | `bg-navy-100 text-navy-700` | `bg-navy-500` |
| BUYER_OVERRIDE | `bg-success-100 text-success-700` | `bg-success-500` |
| NEEDS_REVIEW | `bg-warning-100 text-warning-700` | `bg-warning-500` |

### 4.6 Demand Class Colors

| Class | Badge Classes | Chart Hex |
|---|---|---|
| SMOOTH_FAST | `bg-success-100 text-success-700` | `#10b981` |
| ERRATIC_HIGH_VARIANCE | `bg-warning-100 text-warning-700` | `#f59e0b` |
| INTERMITTENT_LUMPY | `bg-violet-100 text-violet-700` | `#8b5cf6` |
| NEW_COLD_START | `bg-slate-100 text-slate-600` | `#64748b` |
| DEFENSE_CONTRACT | `bg-navy-100 text-navy-700` | `#084974` |

### 4.7 Typography Scale

| Element | Classes |
|---|---|
| Page title | `text-2xl font-semibold text-slate-900` |
| Section title | `text-xl font-semibold text-slate-900` |
| Card title | `text-lg font-semibold text-slate-900` |
| Body text | `text-sm text-slate-600` |
| Numeric / data table cells | `text-sm font-mono text-slate-900 tabular-nums` |
| KPI large number | `text-3xl font-bold font-mono tabular-nums text-slate-900` |
| KPI label | `text-xs font-medium uppercase tracking-wider text-slate-500` |
| Status badge / pill | `text-xs font-medium uppercase tracking-wide` |
| Sidebar nav item | `text-sm font-medium text-white/70` |
| Sidebar group label | `text-xs font-semibold uppercase tracking-wider text-white/40` |

### 4.8 Card & Container Patterns

```
Card:           bg-white rounded-lg shadow-card border border-slate-200 p-5
Card (hover):   hover:shadow-card-hover transition-shadow
Card header:    flex items-center justify-between pb-4 border-b border-slate-100
KPI Card:       bg-white rounded-lg shadow-card border border-slate-200 p-5
                  → number: text-3xl font-bold font-mono tabular-nums
                  → label:  text-xs font-medium uppercase tracking-wider text-slate-500
                  → trend:  text-sm font-medium (text-success-500 ↑ / text-danger-500 ↓)
```

### 4.9 Button Styles

| Variant | Classes |
|---|---|
| Primary | `bg-navy-700 text-white hover:bg-navy-600 active:bg-navy-800 rounded-md px-4 py-2 text-sm font-medium transition-colors` |
| Primary Gold | `bg-gold-400 text-navy-900 hover:bg-gold-300 active:bg-gold-500 rounded-md px-4 py-2 text-sm font-semibold transition-colors` |
| Secondary | `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-md px-4 py-2 text-sm font-medium transition-colors` |
| Danger | `bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 rounded-md px-4 py-2 text-sm font-medium transition-colors` |
| Ghost | `text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md px-3 py-2 text-sm font-medium transition-colors` |
| Icon | `text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors` |

---

## 5. Chart Design System

### 5.1 Chart Color Palette

An 8-color palette for multi-series charts. The first two colors are brand-derived; the rest are chosen for maximum contrast and colorblind accessibility (deuteranopia-safe):

```ts
// lib/design-tokens.ts
export const CHART_COLORS = {
  series: [
    '#084974',  // navy-700 (brand primary)
    '#ffc10a',  // gold-400 (brand accent)
    '#10b981',  // emerald/success
    '#8b5cf6',  // violet
    '#f59e0b',  // amber/warning
    '#06b6d4',  // cyan
    '#ec4899',  // pink
    '#64748b',  // slate (neutral)
  ],
  forecast: {
    p50Line:       '#084974',  // navy — primary forecast line
    p10p90Fill:    'rgba(8, 73, 116, 0.20)',   // navy @ 20%
    p2_5p97_5Fill: 'rgba(8, 73, 116, 0.08)',   // navy @ 8%
    actualLine:    '#10b981',  // green — actual demand overlay
    naiveLine:     '#94a3b8',  // slate-400 — naive baseline (dashed)
  },
  heatmap: {
    min:  '#f0f7fc',  // navy-50
    mid:  '#4a9dd6',  // navy-400
    max:  '#025482',  // navy-900
    zero: '#f8fafc',  // slate-50
  },
  gauge: {
    danger:  '#ef4444',
    warning: '#f59e0b',
    target:  '#10b981',
    exceeds: '#084974',
  },
  fillRate: {
    below85: '#ef4444',
    at85:    '#f59e0b',
    at90:    '#ffc10a',
    at98:    '#10b981',
  },
  arbitrage: {
    chinaLanded:   '#ef4444',
    nixaDomestic:  '#10b981',
    tariffPortion: '#f59e0b',
  },
} as const;
```

### 5.2 Chart Typography & Layout Standards

| Element | Style |
|---|---|
| Chart title | `text-base font-semibold text-slate-900` (rendered in card header, not inside chart) |
| Axis labels | `fontSize: 11, fill: '#64748b'` (slate-500) |
| Axis tick values | `fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono'` (mono) |
| Tooltip header | `fontSize: 13, fontWeight: 600, color: '#0f172a'` (slate-900) |
| Tooltip values | `fontSize: 12, fontFamily: 'JetBrains Mono', color: '#334155'` (mono) |
| Legend items | `fontSize: 12, fill: '#475569'` (slate-600) |
| Grid lines | `stroke: '#e2e8f0'` (slate-200), `strokeDasharray: '3 3'` |
| Zero line | `stroke: '#cbd5e1'` (slate-300), solid |

### 5.3 Chart Container Pattern

All charts are wrapped in a consistent card container:

```
<div className="bg-white rounded-lg shadow-card border border-slate-200 p-5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
  </div>
  <div className="h-[300px]">
    {/* ResponsiveContainer or chart component */}
  </div>
</div>
```

Standard chart heights:
- KPI sparkline: `h-[80px]`
- Standard chart: `h-[300px]`
- Detailed chart (SKU detail, forecast): `h-[400px]`
- Full-width dashboard chart: `h-[500px]`

### 5.4 Forecast Chart Rendering Pattern

The most important chart in the app — time-series forecast with confidence intervals:

```
Visual structure (from back to front):
┌──────────────────────────────────────────┐
│  ░░░░░░ P2.5/P97.5 band (navy @ 8%)     │
│  ▒▒▒▒▒▒ P10/P90 band (navy @ 20%)       │
│  ━━━━━━ P50 line (navy solid, 2px)       │
│  ── ── Naive baseline (slate dashed)     │
│  ●━━━━● Actual demand (green, dots)      │
│  │←─── Historical ───→│←── Forecast ──→│ │
│  │                     │ (shaded bg)     │ │
└──────────────────────────────────────────┘
```

- The forecast region (right of "today" line) gets a subtle `rgba(8, 73, 116, 0.03)` navy background wash.
- A vertical dashed line marks "today" with a label.
- Tooltip shows: date, P50, P10, P90, actual (if available), and naive baseline.

### 5.5 Min/Max Inventory Gauge Pattern

Horizontal bar gauge showing on-hand level relative to planning parameters:

```
┌──────────────────────────────────────────┐
│  0 ├──┤ Min ├────┤ ROP ├─────────┤ Max  │
│     RED   AMBER      GREEN         BLUE  │
│                  ▲ on-hand marker         │
└──────────────────────────────────────────┘
```

| Zone | Color | Meaning |
|------|-------|---------|
| Below Min | `danger-500` | Stockout risk — CRITICAL alert |
| Min → Reorder Point | `warning-500` | Below reorder — WARNING alert |
| Reorder Point → Max | `success-500` | Healthy range |
| Above Max | `info-500` | Excess inventory — EXCESS alert |
| Safety Stock band | `gold-400` @ 30% overlay | Within the green/amber zone |

---

## 6. Navigation Configuration

Define the sidebar navigation structure in `lib/navigation.ts`. This is the single source of truth for sidebar rendering.

```ts
// lib/navigation.ts
import {
  ClipboardList, AlertTriangle, SlidersHorizontal,
  TrendingUp, Search,
  BarChart3, Package, Clock, Globe, DollarSign,
  GitBranch, Database,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** If true, item only appears when navigated to (not in sidebar list) */
  searchTriggered?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Execution',
    items: [
      { label: 'Action Center', path: '/', icon: ClipboardList },
      { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
      { label: 'Inventory Parameters', path: '/inventory/parameters', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { label: 'Forecast Overview', path: '/forecast', icon: TrendingUp },
      { label: 'SKU Detail', path: '/sku', icon: Search, searchTriggered: true },
    ],
  },
  {
    label: 'Dashboards',
    items: [
      { label: 'Fill Rate', path: '/dashboard/fill-rate', icon: BarChart3 },
      { label: 'Inventory Health', path: '/dashboard/inventory', icon: Package },
      { label: 'Lead-Time', path: '/dashboard/lead-time', icon: Clock },
      { label: 'Reshoring', path: '/dashboard/reshoring', icon: Globe },
      { label: 'Arbitrage', path: '/dashboard/arbitrage', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'BOM Explorer', path: '/bom', icon: GitBranch },
      { label: 'Data Pipeline', path: '/pipeline', icon: Database },
    ],
  },
];
```

### Route-to-breadcrumb mapping

Define in `lib/navigation.ts` alongside the nav groups:

```ts
export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Action Center',
  '/alerts': 'Alerts',
  '/forecast': 'Forecast Overview',
  '/sku': 'SKU Detail',
  '/inventory/parameters': 'Inventory Parameters',
  '/dashboard': 'Dashboards',
  '/dashboard/fill-rate': 'Fill Rate',
  '/dashboard/inventory': 'Inventory Health',
  '/dashboard/lead-time': 'Lead-Time',
  '/dashboard/reshoring': 'Reshoring',
  '/dashboard/arbitrage': 'Arbitrage',
  '/bom': 'BOM Explorer',
  '/pipeline': 'Data Pipeline',
};
```

---

## 7. Component Specifications

### 7.1 AppShell

The root layout component. Rendered once, wraps all routes via React Router's `<Outlet />`.

**File:** `components/layout/AppShell.tsx`

**Props:** None (uses context and router hooks internally).

**State:**
| State | Type | Default | Purpose |
|---|---|---|---|
| `sidebarCollapsed` | `boolean` | `false` | Toggles sidebar between full (256px) and icon-only (64px) mode |

**Rendered structure:**

```
<div className="flex h-screen overflow-hidden bg-surface-secondary">
  <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
  <div className="flex flex-1 flex-col overflow-hidden">
    <TopBar onToggleSidebar={toggleSidebar} />
    <ContentArea>
      <Outlet />
    </ContentArea>
  </div>
</div>
```

**Behavior:**
- Full-height flex container, no page-level scroll (scroll is within ContentArea).
- Sidebar state persisted to `localStorage` key `springfield:sidebar-collapsed`.

---

### 7.2 Sidebar

Persistent left navigation panel with **branded navy background** (the strongest brand element in the app).

**File:** `components/layout/Sidebar.tsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `collapsed` | `boolean` | Whether sidebar is in collapsed (icon-only) mode |
| `onToggle` | `() => void` | Callback to toggle collapsed state |

**Layout:**
| Zone | Content | Classes |
|---|---|---|
| Header | Springfield Marine logo/wordmark (or "SM" icon when collapsed) | `h-16 flex items-center px-4 border-b border-navy-800` |
| Nav body | Scrollable list of `SidebarGroup` components | `flex-1 overflow-y-auto py-4` |
| Footer | Collapse/expand toggle button (ChevronLeft / ChevronRight icon) | `h-12 flex items-center justify-center border-t border-navy-800` |

**Container classes:**
- Expanded: `w-64 bg-navy-900 flex flex-col transition-all duration-200`
- Collapsed: `w-16 bg-navy-900 flex flex-col transition-all duration-200`

**Branding:**
- Expanded: Display "Springfield Marine" text in `text-lg font-bold text-white`. Optionally render the SVG logo mark inline (white variant).
- Collapsed: Display "SM" monogram in `text-sm font-bold text-white` centered.

---

### 7.3 SidebarGroup

A collapsible group of navigation items with a section label.

**File:** `components/layout/SidebarGroup.tsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Group heading text (e.g., "Execution") |
| `items` | `NavItem[]` | Navigation items in this group |
| `collapsed` | `boolean` | Sidebar collapsed state (hides labels, shows only icons) |

**State:**
| State | Type | Default | Purpose |
|---|---|---|---|
| `expanded` | `boolean` | `true` | Whether the group's items are visible (only applies in non-collapsed sidebar) |

**Behavior:**
- When sidebar is expanded: group label is displayed as uppercase section heading; clicking the label toggles `expanded` to show/hide items.
- When sidebar is collapsed: group label is hidden; all items show as icon-only regardless of `expanded` state.
- Group label classes: `text-xs font-semibold uppercase tracking-wider text-white/40 px-4 py-2 cursor-pointer hover:text-white/60` with a chevron icon indicating expanded/collapsed state.

---

### 7.4 SidebarItem

A single navigation link within a group.

**File:** `components/layout/SidebarItem.tsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `item` | `NavItem` | The navigation item definition |
| `collapsed` | `boolean` | Sidebar collapsed state |

**Active state detection:**
- Use `useLocation()` from React Router.
- An item is "active" when `location.pathname === item.path` OR `location.pathname.startsWith(item.path + '/')` (for nested routes like `/sku/:id` matching `/sku`).
- Special case: `/` (Action Center) must use exact match only to avoid matching every route.

**Classes:**
| State | Classes |
|---|---|
| Default | `flex items-center gap-3 px-4 py-2 text-sm font-medium text-white/70 rounded-md hover:bg-white/10 hover:text-white transition-colors` |
| Active | `flex items-center gap-3 px-4 py-2 text-sm font-medium text-white bg-white/15 rounded-md border-l-3 border-gold-400` |
| Collapsed default | `flex items-center justify-center p-2 text-white/70 rounded-md hover:bg-white/10 hover:text-white transition-colors` |
| Collapsed active | `flex items-center justify-center p-2 text-white bg-white/15 rounded-md` |

**Behavior:**
- Wraps a React Router `<NavLink>` or `<Link>`.
- When `item.searchTriggered` is true, the item still appears in the sidebar but navigating to it opens a search prompt (or simply navigates to `/sku` which shows a search-first view). Active highlighting activates when on any `/sku/*` route.
- Collapsed mode: show icon only; render a tooltip on hover with `item.label` using `title` attribute or a positioned tooltip div.

---

### 7.5 TopBar

Horizontal bar at the top of the content column.

**File:** `components/layout/TopBar.tsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `onToggleSidebar` | `() => void` | Callback to toggle sidebar (hamburger icon on smaller screens) |

**Layout (left to right):**

| Zone | Content | Classes |
|---|---|---|
| Left | Hamburger menu button (visible only when sidebar is collapsed or on smaller screens) + `<Breadcrumbs />` | `flex items-center gap-4` |
| Right | Global search input + Notification bell with badge | `flex items-center gap-4` |

**Container classes:** `h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0`

**Global search:**
- Input element with `Search` (Lucide) icon prefix.
- Classes: `w-64 pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-navy-500 focus:outline-none transition-colors`
- Placeholder text: `"Search SKUs..."`.
- On submit (Enter key), navigate to `/sku/:searchTerm` using React Router's `useNavigate`.
- This is a demo — no autocomplete or live search needed in this spec. Future specs may add it.

**Notification bell:**
- `Bell` icon (Lucide) with a positioned badge showing unacknowledged alert count.
- Badge: `absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium`.
- Alert count is **live** — sourced from the `useAlerts()` hook (Spec 16 §3.5) which reads from the shared `DemoStateProvider` context. When a user acknowledges an alert on the Alerts Dashboard, the badge count decrements immediately.
- Clicking the bell navigates to `/alerts`.

---

### 7.6 Breadcrumbs

Auto-generated breadcrumb trail based on the current route.

**File:** `components/layout/Breadcrumbs.tsx`

**Props:** None (reads route from `useLocation()`).

**Logic:**
1. Split `location.pathname` by `/` to get path segments.
2. Build cumulative paths: e.g., `/dashboard/fill-rate` yields `['/', '/dashboard', '/dashboard/fill-rate']`.
3. Map each cumulative path to a label using `ROUTE_LABELS`.
4. For dynamic segments like `/sku/:id`, display the SKU ID from the URL param as the final breadcrumb.
5. Always include "Home" (mapped to `/`) as the first crumb only if the current route is not `/`.

**Rendered structure:**
```
<nav className="flex items-center gap-1 text-sm text-slate-500">
  {crumbs.map((crumb, i) => (
    <Fragment key={crumb.path}>
      {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
      {i === crumbs.length - 1 ? (
        <span className="font-medium text-slate-900">{crumb.label}</span>
      ) : (
        <Link to={crumb.path} className="hover:text-slate-700 transition-colors">
          {crumb.label}
        </Link>
      )}
    </Fragment>
  ))}
</nav>
```

---

### 7.7 ContentArea

Scrollable wrapper for page content.

**File:** `components/layout/ContentArea.tsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Page content (from `<Outlet />`) |

**Classes:** `flex-1 overflow-y-auto`

**Inner wrapper:** `max-w-[1440px] mx-auto px-6 py-6`

**Behavior:**
- Scroll is confined to this element (not the page body).
- `max-w-[1440px]` prevents content from stretching excessively on ultra-wide monitors. Content centers within the available space.
- Consistent horizontal padding (`px-6`) and vertical padding (`py-6`) on all pages.

---

## 8. Responsive Behavior

**Target minimum viewport:** 1024px wide.

| Breakpoint | Sidebar behavior | Top bar behavior |
|---|---|---|
| >= 1280px | Expanded (256px) by default | Full layout |
| 1024px - 1279px | Collapsed to icon-only (64px) by default | Full layout |
| < 1024px | Hidden off-screen; toggled via hamburger button in TopBar | Hamburger button visible |

**Implementation:**
- Use a `useMediaQuery` hook (or `window.matchMedia`) to detect viewport width.
- On mount and resize, set `sidebarCollapsed` based on breakpoint:
  - `>= 1280`: respect user preference from `localStorage` (default expanded).
  - `1024-1279`: auto-collapse.
  - `< 1024`: hide sidebar entirely; show hamburger in TopBar; clicking hamburger opens sidebar as an overlay with a backdrop.
- Sidebar overlay (< 1024px): sidebar slides in from left over content, with a semi-transparent backdrop (`bg-black/30`). Clicking backdrop closes sidebar.

---

## 9. Router Integration

The `AppShell` is used as a layout route in the React Router configuration:

```tsx
// In router config (e.g., frontend/src/App.tsx or frontend/src/router.tsx)
<Route element={<AppShell />}>
  <Route path="/" element={<ActionCenter />} />
  <Route path="/alerts" element={<Alerts />} />
  <Route path="/sku/:id" element={<SkuDetail />} />
  <Route path="/forecast" element={<Forecast />} />
  <Route path="/dashboard/fill-rate" element={<FillRate />} />
  <Route path="/dashboard/inventory" element={<InventoryHealth />} />
  <Route path="/dashboard/lead-time" element={<LeadTime />} />
  <Route path="/dashboard/reshoring" element={<Reshoring />} />
  <Route path="/dashboard/arbitrage" element={<Arbitrage />} />
  <Route path="/inventory/parameters" element={<InventoryParameters />} />
  <Route path="/bom" element={<BomExplorer />} />
  <Route path="/pipeline" element={<Pipeline />} />
</Route>
```

Page components are not built in this spec. Stub placeholder components (just rendering the page title) are sufficient for testing the shell.

---

## 10. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| AC-1 | App shell renders with navy-branded sidebar (256px) and white top bar (64px height) flanking a content area | Visual inspection |
| AC-2 | Sidebar displays all four nav groups (Execution, Analysis, Dashboards, Operations) with correct items and Lucide icons in white | Visual inspection against nav config |
| AC-3 | Clicking a sidebar item navigates to the correct route and shows gold left-border active state | Click each item; verify URL and highlight |
| AC-4 | Breadcrumbs auto-update on route change; nested routes show full trail (e.g., Home > Dashboards > Fill Rate) | Navigate to `/dashboard/fill-rate` and verify |
| AC-5 | SKU Detail breadcrumb shows the SKU ID from the URL param | Navigate to `/sku/1100031-1` and verify |
| AC-6 | Sidebar collapse toggle works: clicking the toggle switches between 256px and 64px modes; icons remain visible in collapsed mode | Click toggle; verify widths and icon visibility |
| AC-7 | Sidebar collapse state persists across page reloads via localStorage | Toggle, reload, verify state |
| AC-8 | Global search input in top bar navigates to `/sku/:searchTerm` on Enter | Type a part number, press Enter, verify URL |
| AC-9 | Notification bell displays alert count badge and navigates to `/alerts` on click | Visual inspection + click test |
| AC-10 | At viewport 1024-1279px, sidebar auto-collapses to icon-only mode | Resize browser window and verify |
| AC-11 | At viewport < 1024px, sidebar is hidden; hamburger button appears; clicking it opens sidebar as overlay with backdrop | Resize and test overlay behavior |
| AC-12 | Content area scrolls independently; max-width of 1440px is enforced with centered layout | Add tall stub content; verify scroll containment and max-width |
| AC-13 | Severity color classes render correctly for all four AlertLevel values using semantic tokens | Render test badges with each level |
| AC-14 | Source node color classes render correctly for all three SourceNode values using brand-derived colors | Render test badges with each source |
| AC-15 | Sidebar groups are collapsible: clicking a group label hides/shows its items | Click group labels and verify |
| AC-16 | Custom `@theme` tokens (navy-*, gold-*, success-*, etc.) resolve correctly in Tailwind classes | Inspect computed styles |
| AC-17 | Chart colors from `CHART_COLORS` render correctly in at least one test chart | Render a multi-series chart and verify colors |
| AC-18 | KPI cards use `font-mono tabular-nums` for numeric values and show trend arrows in correct colors | Visual inspection |
| AC-19 | Buttons render correctly in all variants (Primary, Gold, Secondary, Danger, Ghost, Icon) | Render button showcase |

---

## 11. Out of Scope

- Page-specific content (each page gets its own spec)
- Dark mode / theme switching
- Authentication / user avatar
- Animations beyond sidebar transition (`transition-all duration-200`)
- Mobile-first design (min target is 1024px; sub-1024 is a graceful fallback, not a primary target)

---

## 12. Library Recommendations

> **Note:** The Kernel (§2.1) specifies Recharts for charts and TanStack Table for tables.
> The following recommendations are additional libraries researched for this design system.
> Any changes to the Kernel's stack require user approval.

### 12.1 UI Components: shadcn/ui

**Recommendation:** Add [shadcn/ui](https://ui.shadcn.com/) as the component library.

- Native Tailwind CSS 4 support (CLI updated for v4, OKLCH colors, `@theme` directive)
- Full React 19 compatibility
- MIT license, copy-paste model (components are source code, not npm dependencies)
- Built on Radix UI primitives for accessibility
- Ships pre-built DataTable component wrapping TanStack Table (aligns with Kernel stack)
- 0kB runtime dependency — no bundle cost

### 12.2 Advanced Charts: Apache ECharts

**Recommendation:** Add [echarts-for-react](https://www.npmjs.com/package/echarts-for-react) alongside Recharts for advanced visualizations.

Recharts is appropriate for standard line/bar/pie charts, but the app requires chart types Recharts does not support natively:

| Feature | Recharts | ECharts |
|---------|----------|---------|
| Confidence band areas (P10/P50/P90) | Stacked area workaround | Native `areaStyle` bands |
| Heatmaps | Not supported | Native heatmap series |
| Gauges | Not supported | Native gauge series |
| Canvas rendering (large datasets) | SVG (slower at 10k+ points) | Canvas (handles 100k+) |
| React 19 | Known rendering issues (#4558, #6857) | Confirmed compatible |

**Usage split:**
- **Recharts** for simple bar/line/pie charts (lightweight, already in Kernel)
- **ECharts** for forecast charts, heatmaps, gauges, and any chart with >1k data points

**Bundle impact:** ~200-300kB gzipped (tree-shaken via `echarts/core` imports)
**License:** Apache 2.0
