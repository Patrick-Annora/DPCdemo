# Spec 15 — Routing, Navigation & Global Chrome

**Status:** Draft
**Depends on:** Spec 01 (Project Setup), Spec 02 (Design System — AppShell, Sidebar, TopBar, Breadcrumbs, `lib/navigation.ts`), Spec 03 (Type Definitions — Alert, WorklistItem, SKU), Spec 04 (Mock Data — `alerts.ts`, `worklist.ts`, `skus.ts`), Spec 05 (Common Components — SearchInput)
**Page specs consumed:** Spec 07 (Action Center), Spec 08 (Alerts), Spec 09 (SKU Detail), Spec 10 (Forecast), Spec 11 (KPI Dashboards), Spec 12 (Inventory Parameters), Spec 13 (BOM Explorer), Spec 14 (Pipeline Status)
**Kernel refs:** §2.1 (React Router v7), §2.2 (Project Structure), §6 (Frontend Routes — all 12), §7 (Design System — sidebar, top bar, breadcrumbs)
**SRD refs:** §5.1 (execution-first navigation), §5.2 (buyer worklist as default), §5.3 (alert notifications)

---

## 1. Overview

This spec wires together every page from Specs 07-14 into a single navigable application. It defines the React Router v7 route tree, the AppShell layout route, sidebar active-state logic, breadcrumb generation, global search with grouped results, the notification bell dropdown, the 404 page, and page transition behavior. After this spec is implemented, a user can navigate to every route in the application and the chrome (sidebar, top bar, breadcrumbs) responds correctly at each location.

---

## 2. File Structure

```
frontend/src/
  router.tsx                    # createBrowserRouter route tree definition
  App.tsx                       # Root component: RouterProvider + QueryClientProvider + DemoStateProvider
  pages/
    NotFound/
      NotFoundPage.tsx          # 404 catch-all page
      index.ts                  # Barrel export
  components/
    layout/
      AppShell.tsx              # Layout route (already defined in Spec 02)
      Sidebar.tsx               # Extended: active-state highlighting for nested routes
      SidebarItem.tsx           # Extended: group-level active state awareness
      TopBar.tsx                # Extended: GlobalSearch dropdown + NotificationBell dropdown
      Breadcrumbs.tsx           # Extended: dynamic segment resolution (SKU part number)
    common/
      GlobalSearch.tsx          # Search input + grouped results dropdown
      NotificationBell.tsx      # Bell icon + badge + recent alerts dropdown
```

---

## 3. React Router v7 Setup

**File:** `frontend/src/router.tsx`

Use `createBrowserRouter` from `react-router-dom` v7. The route tree uses AppShell as a layout route so that sidebar, top bar, and breadcrumbs persist across all page navigations.

```tsx
// frontend/src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ActionCenterPage } from '@/pages/ActionCenter';
import { AlertsDashboardPage } from '@/pages/Alerts';
import { SkuDetailPage } from '@/pages/SkuDetail';
import { ForecastOverviewPage } from '@/pages/Forecast';
import { FillRateDashboard } from '@/pages/Dashboard/FillRateDashboard';
import { InventoryHealthDashboard } from '@/pages/Dashboard/InventoryHealthDashboard';
import { LeadTimeDashboard } from '@/pages/Dashboard/LeadTimeDashboard';
import { ReshoringDashboard } from '@/pages/Dashboard/ReshoringDashboard';
import { ArbitrageSavingsDashboard } from '@/pages/Dashboard/ArbitrageSavingsDashboard';
import { InventoryParametersPage } from '@/pages/InventoryParameters';
import { BomExplorerPage } from '@/pages/BomExplorer';
import { PipelineStatusPage } from '@/pages/Pipeline';
import { NotFoundPage } from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <ActionCenterPage /> },
      { path: '/alerts', element: <AlertsDashboardPage /> },
      { path: '/sku/:id', element: <SkuDetailPage /> },
      { path: '/forecast', element: <ForecastOverviewPage /> },
      { path: '/dashboard/fill-rate', element: <FillRateDashboard /> },
      { path: '/dashboard/inventory', element: <InventoryHealthDashboard /> },
      { path: '/dashboard/lead-time', element: <LeadTimeDashboard /> },
      { path: '/dashboard/reshoring', element: <ReshoringDashboard /> },
      { path: '/dashboard/arbitrage', element: <ArbitrageSavingsDashboard /> },
      { path: '/inventory/parameters', element: <InventoryParametersPage /> },
      { path: '/bom', element: <BomExplorerPage /> },
      { path: '/pipeline', element: <PipelineStatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

### Route table summary

| Route | Page Component | Nav Group |
|-------|---------------|-----------|
| `/` | `ActionCenterPage` | Execution |
| `/alerts` | `AlertsDashboardPage` | Execution |
| `/sku/:id` | `SkuDetailPage` | Analysis (search-triggered) |
| `/forecast` | `ForecastOverviewPage` | Analysis |
| `/dashboard/fill-rate` | `FillRateDashboard` | Dashboards |
| `/dashboard/inventory` | `InventoryHealthDashboard` | Dashboards |
| `/dashboard/lead-time` | `LeadTimeDashboard` | Dashboards |
| `/dashboard/reshoring` | `ReshoringDashboard` | Dashboards |
| `/dashboard/arbitrage` | `ArbitrageSavingsDashboard` | Dashboards |
| `/inventory/parameters` | `InventoryParametersPage` | Execution |
| `/bom` | `BomExplorerPage` | Operations |
| `/pipeline` | `PipelineStatusPage` | Operations |
| `*` | `NotFoundPage` | (none) |

---

## 4. App.tsx — Root Component

**File:** `frontend/src/App.tsx`

The root component wraps `RouterProvider` with the application's context providers. No routing logic lives here — it delegates entirely to `router.tsx`.

```tsx
// frontend/src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DemoStateProvider } from '@/context/DemoStateContext';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,       // MOCK: demo data never goes stale
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoStateProvider>
        <RouterProvider router={router} />
      </DemoStateProvider>
    </QueryClientProvider>
  );
}
```

**Notes:**
- `QueryClient` with `staleTime: Infinity` because all data is mock — no refetching needed.
- `DemoStateProvider` wraps the router so that all pages share mutable demo state (worklist approvals, parameter edits, alert acknowledgements).
- `// MOCK:` marker on `staleTime` — in production this would use real cache invalidation.

---

## 5. Layout Route — AppShell

The `AppShell` component (defined in Spec 02, `components/layout/AppShell.tsx`) serves as the React Router layout route. All 12 page routes plus the 404 route are children of this layout.

**Rendering chain:**
```
<App>
  <QueryClientProvider>
    <DemoStateProvider>
      <RouterProvider>
        <AppShell>              ← layout route
          <Sidebar />
          <TopBar />
          <ContentArea>
            <Outlet />          ← page content rendered here
          </ContentArea>
        </AppShell>
      </RouterProvider>
    </DemoStateProvider>
  </QueryClientProvider>
</App>
```

**Key behaviors (from Spec 02):**
- Sidebar state (`collapsed`) persisted to `localStorage` key `springfield:sidebar-collapsed`.
- AppShell uses `<Outlet />` from `react-router-dom` to render the matched child route.
- The shell never unmounts during navigation — only the `<Outlet />` content changes.

---

## 6. Sidebar Active-State Highlighting

### 6.1 Matching Rules

The sidebar uses the `NAV_GROUPS` config from `lib/navigation.ts` (Spec 02 section 6). Active-state logic in `SidebarItem.tsx` determines which item is highlighted based on the current `location.pathname`.

| Rule | Logic | Example |
|------|-------|---------|
| **Exact match** | `pathname === item.path` | `/` highlights "Action Center" |
| **Prefix match** | `pathname.startsWith(item.path + '/')` | `/dashboard/fill-rate` highlights the "Fill Rate" item |
| **Root special case** | `/` uses exact match only (not prefix) | `/alerts` does NOT highlight "/" |
| **Dynamic route** | `/sku/:id` matches the "SKU Detail" item (`path: '/sku'`) via prefix | `/sku/1100031-1` highlights "SKU Detail" |

### 6.2 Dashboard Sub-Route Highlighting

Dashboard routes (`/dashboard/*`) must highlight **both** the specific dashboard item AND visually indicate the parent "Dashboards" group is active. Implementation:

1. **SidebarItem** uses prefix matching: `/dashboard/fill-rate` matches the "Fill Rate" item whose `path` is `/dashboard/fill-rate` (exact match).
2. **SidebarGroup** checks if ANY of its items are active. If so, the group label gets a brighter text color (`text-white/70` instead of `text-white/40`) and the group auto-expands if collapsed.

```tsx
// In SidebarGroup.tsx
const isGroupActive = items.some(item =>
  item.path === '/'
    ? location.pathname === '/'
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
);
```

When `isGroupActive` is true:
- Group label: `text-white/70` (elevated from `text-white/40`)
- Group remains expanded regardless of user toggle (auto-expand on active)

### 6.3 SKU Detail Highlighting

The SKU Detail item has `searchTriggered: true` in the nav config. When on any `/sku/*` route:
- The "SKU Detail" item in the "Analysis" group is highlighted with the active state (gold left border, `bg-white/15`)
- The "Analysis" group label shows the active-group brightness

### 6.4 Active State Visual Treatment

From Spec 02 section 7.4:

| State | Classes |
|-------|---------|
| Active (expanded sidebar) | `text-white bg-white/15 border-l-3 border-gold-400` |
| Active (collapsed sidebar) | `text-white bg-white/15` |
| Default (expanded) | `text-white/70 hover:bg-white/10 hover:text-white` |
| Default (collapsed) | `text-white/70 hover:bg-white/10 hover:text-white` |

---

## 7. Breadcrumb Generation

**File:** `components/layout/Breadcrumbs.tsx`

Breadcrumbs are auto-generated from the current route path using `ROUTE_LABELS` from `lib/navigation.ts` (Spec 02 section 6).

### 7.1 Generation Algorithm

```tsx
function generateBreadcrumbs(pathname: string, skuPartNumber?: string): Crumb[] {
  // 1. If at root ("/"), return no breadcrumbs (page title is sufficient)
  if (pathname === '/') return [];

  // 2. Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  // e.g., '/dashboard/fill-rate' → ['dashboard', 'fill-rate']

  // 3. Build cumulative paths
  const crumbs: Crumb[] = [{ label: 'Home', path: '/' }];

  let cumulativePath = '';
  for (const segment of segments) {
    cumulativePath += `/${segment}`;

    // 4. Look up label from ROUTE_LABELS
    const label = ROUTE_LABELS[cumulativePath];
    if (label) {
      crumbs.push({ label, path: cumulativePath });
    }
  }

  // 5. Handle dynamic SKU segment
  if (pathname.startsWith('/sku/') && skuPartNumber) {
    // Replace generic "SKU Detail" with part number
    crumbs.push({ label: skuPartNumber, path: pathname });
  }

  return crumbs;
}
```

### 7.2 Breadcrumb Examples

| Route | Breadcrumbs |
|-------|-------------|
| `/` | (none — home page, no breadcrumbs needed) |
| `/alerts` | Home > Alerts |
| `/sku/1100031-1` | Home > SKU Detail > 1100031-1 |
| `/forecast` | Home > Forecast Overview |
| `/dashboard/fill-rate` | Home > Dashboards > Fill Rate |
| `/dashboard/inventory` | Home > Dashboards > Inventory Health |
| `/dashboard/lead-time` | Home > Dashboards > Lead-Time |
| `/dashboard/reshoring` | Home > Dashboards > Reshoring |
| `/dashboard/arbitrage` | Home > Dashboards > Arbitrage |
| `/inventory/parameters` | Home > Inventory Parameters |
| `/bom` | Home > BOM Explorer |
| `/pipeline` | Home > Data Pipeline |

### 7.3 SKU Detail Breadcrumb Resolution

The SKU Detail breadcrumb must display the actual part number, not the raw URL parameter. The `Breadcrumbs` component:

1. Reads the `:id` param from the URL via `useParams()`.
2. Looks up the matching SKU from `MOCK_SKUS` to get the `partNumber` and `description`.
3. Renders the final crumb as the part number (e.g., "1100031-1"). Optionally truncate and show description in a title tooltip.

If the SKU ID is not found in mock data, display the raw URL param as the final crumb.

### 7.4 Breadcrumb Rendering

From Spec 02 section 7.6 — chevron-separated links where the last crumb is non-clickable bold text:

```
Home  >  Dashboards  >  Fill Rate
 link     link          current (bold, non-link)
```

- Separator: `ChevronRight` icon (Lucide), `h-4 w-4 text-slate-300`
- Link crumbs: `text-slate-500 hover:text-slate-700 transition-colors`
- Current crumb: `font-medium text-slate-900` (no link)

---

## 8. Global Search

**File:** `components/common/GlobalSearch.tsx`

The global search replaces the simpler "navigate to SKU on Enter" behavior from Spec 02 with a richer grouped-results dropdown. This is the primary way users discover and navigate to specific SKUs, alerts, and worklist items.

### 8.1 Placement

Rendered inside `TopBar.tsx` in the right zone, replacing the basic search input from Spec 02.

### 8.2 Search Input

- `Search` icon (Lucide) prefix.
- Classes: `w-72 pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-navy-500 focus:outline-none transition-colors`
- Placeholder: `"Search SKUs, alerts, actions..."`.
- Debounce: 150ms after keystroke before filtering (use a local `setTimeout` or `useDeferredValue`).
- Minimum query length: 2 characters before showing results.

### 8.3 Search Sources & Matching

The search filters across three data sources, all from mock data:

| Source | Searchable Fields | Match Logic |
|--------|-------------------|-------------|
| **SKUs** | `partNumber`, `description` | Case-insensitive substring match on either field |
| **Alerts** | Alert's `skuId` (resolved to `partNumber`), `triggerCondition` | Case-insensitive substring match |
| **Worklist** | Item's `skuId` (resolved to `partNumber`), `actionType` (human-readable label) | Case-insensitive substring match |

```tsx
// Pseudo-code for search filtering
function search(query: string): SearchResults {
  const q = query.toLowerCase();
  return {
    skus: MOCK_SKUS.filter(s =>
      s.partNumber.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    ).slice(0, 5),
    alerts: MOCK_ALERTS.filter(a => {
      const sku = findSku(a.skuId);
      return sku?.partNumber.toLowerCase().includes(q) ||
        a.triggerCondition.toLowerCase().includes(q);
    }).slice(0, 3),
    worklist: MOCK_WORKLIST.filter(w => {
      const sku = findSku(w.skuId);
      return sku?.partNumber.toLowerCase().includes(q) ||
        formatActionType(w.actionType).toLowerCase().includes(q);
    }).slice(0, 3),
  };
}
```

### 8.4 Results Dropdown

A positioned dropdown appears below the search input when results exist.

**Container:** `absolute top-full mt-1 left-0 w-96 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50`

**Structure:**

```
┌──────────────────────────────────────┐
│  SKUs (section header)               │
│  ┌──────────────────────────────────┐│
│  │ 🔍 1100031-1                     ││
│  │   TRAC-LOCK SWIVEL LOCKING      ││
│  ├──────────────────────────────────┤│
│  │ 🔍 1100035                       ││
│  │   TRAC-LOCK SWIVEL NON-LOCKING  ││
│  └──────────────────────────────────┘│
│                                      │
│  Alerts (section header)             │
│  ┌──────────────────────────────────┐│
│  │ ⚠ 1100031-1 — Below reorder pt  ││
│  └──────────────────────────────────┘│
│                                      │
│  Worklist (section header)           │
│  ┌──────────────────────────────────┐│
│  │ ✓ 1100031-1 — New PO            ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Section headers:**
- `text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 py-2 bg-slate-50`
- Labels: "SKUs", "Alerts", "Worklist"
- Sections with zero results are hidden entirely.

**Result items:**
- `px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors`
- Each item shows a contextual icon (Search for SKUs, AlertTriangle for Alerts, ClipboardList for Worklist) in `text-slate-400 h-4 w-4`.
- Primary text: part number in `text-sm font-medium text-slate-900`.
- Secondary text: description or trigger condition in `text-xs text-slate-500`.

### 8.5 Navigation on Click

| Result Type | Navigation Target |
|-------------|-------------------|
| SKU | `/sku/{skuId}` |
| Alert | `/alerts` (scrolls to or filters by the clicked alert if feasible; otherwise just navigates to `/alerts`) |
| Worklist | `/` (Action Center — the worklist lives there) |

After clicking a result:
- The dropdown closes.
- The search input clears.
- The page navigates via `useNavigate()`.

### 8.6 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `ArrowDown` | Move highlight to next result item |
| `ArrowUp` | Move highlight to previous result item |
| `Enter` | Navigate to highlighted result (or first result if none highlighted) |
| `Escape` | Close dropdown, clear search input |

Highlight state: `bg-navy-50 border-l-2 border-navy-500` on the currently focused item.

### 8.7 Empty State

When the query has 2+ characters but no results match:
- Show dropdown with: `"No results for '{query}'"` centered in `text-sm text-slate-500 py-6`.

### 8.8 Dismissal

The dropdown closes when:
- A result is clicked.
- `Escape` is pressed.
- The user clicks outside the search component (use a click-outside listener or `onBlur` with `relatedTarget` check).
- The input is cleared.

---

## 9. Notification Bell

**File:** `components/common/NotificationBell.tsx`

The notification bell in the TopBar shows unacknowledged alert count and provides a dropdown with recent alerts.

### 9.1 Bell Icon + Badge

- `Bell` icon (Lucide), `h-5 w-5 text-slate-500 hover:text-slate-700 cursor-pointer transition-colors`.
- Badge: positioned `absolute -top-1 -right-1`, circular, shows count of unacknowledged alerts.
  - Badge classes: `h-5 w-5 rounded-full bg-springfield-red text-white text-xs flex items-center justify-center font-medium`.
  - If count is 0, the badge is hidden.
  - If count > 9, display "9+".
- Alert count: `// MOCK:` — derived from `MOCK_ALERTS.filter(a => !a.acknowledgedAt).length`. In production this would come from a real-time API or WebSocket. Mark with `// WEBSOCKET_PLACEHOLDER:`.

### 9.2 Dropdown

Clicking the bell toggles a dropdown positioned below-right of the bell icon.

**Container:** `absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50`

**Structure:**

```
┌──────────────────────────────────────┐
│  Alerts                    View All →│  (header)
├──────────────────────────────────────┤
│  ● CRITICAL  1100031-1               │
│    Below reorder point — 3 days      │
│    2 hours ago                        │
├──────────────────────────────────────┤
│  ● WARNING   3100531-L1              │
│    Lead time variance +12 days       │
│    5 hours ago                        │
├──────────────────────────────────────┤
│  ... (up to 5 most recent)           │
└──────────────────────────────────────┘
```

**Header row:**
- Left: `text-sm font-semibold text-slate-900` — "Alerts"
- Right: `text-xs font-medium text-navy-600 hover:text-navy-800 cursor-pointer` — "View All" link, navigates to `/alerts`

**Alert items (up to 5 most recent unacknowledged):**
- Sorted by `createdAt` descending (newest first).
- Severity dot: small circle (`h-2 w-2 rounded-full`) using severity color (`bg-danger-500` for CRITICAL, `bg-warning-500` for WARNING, etc.).
- Severity label: `text-xs font-medium uppercase` in severity text color.
- Part number: `text-sm font-medium text-slate-900`.
- Trigger condition: `text-xs text-slate-500` (truncated to one line with `truncate`).
- Relative time: `text-xs text-slate-400` — e.g., "2 hours ago", "1 day ago". Computed from `createdAt` relative to demo "now".
- Hover: `bg-slate-50`
- Click: navigates to `/alerts`.

### 9.3 Empty State

If all alerts are acknowledged (count = 0):
- No badge on the bell icon.
- Dropdown shows: "No new alerts" centered in `text-sm text-slate-500 py-6`.

### 9.4 Dismissal

Same pattern as GlobalSearch: closes on click outside, Escape key, or clicking a result / "View All".

---

## 10. Page Transitions

Page transitions are kept minimal for demo snappiness. No heavy animation libraries.

**Implementation:** Optional CSS transition on the `<Outlet />` content area.

```css
/* Applied to ContentArea's inner wrapper */
.page-enter {
  opacity: 0;
}
.page-enter-active {
  opacity: 1;
  transition: opacity 150ms ease-in;
}
```

**Alternatively:** skip transitions entirely and rely on instant rendering. The sidebar and top bar persist, so the user already has visual continuity during navigation. If transitions feel sluggish in the demo, remove them.

**Rule:** No transition should exceed 200ms. If it feels slow, delete it.

---

## 11. Not Found Page (404)

**File:** `frontend/src/pages/NotFound/NotFoundPage.tsx`

A simple, on-brand 404 page rendered by the `*` catch-all route.

### 11.1 Layout

Centered vertically and horizontally within the ContentArea.

```
┌───────────────────────────────────────┐
│                                       │
│              404                      │  (text-6xl font-bold text-navy-200)
│                                       │
│       Page not found                  │  (text-xl font-semibold text-slate-900)
│                                       │
│  The page you're looking for          │  (text-sm text-slate-500)
│  doesn't exist or has been moved.     │
│                                       │
│    [Back to Action Center]            │  (Primary button — navigates to "/")
│                                       │
└───────────────────────────────────────┘
```

### 11.2 Component

```tsx
// frontend/src/pages/NotFound/NotFoundPage.tsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-navy-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-navy-700 text-white hover:bg-navy-600 active:bg-navy-800 rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
      >
        Back to Action Center
      </Link>
    </div>
  );
}
```

### 11.3 Barrel Export

```tsx
// frontend/src/pages/NotFound/index.ts
export { NotFoundPage } from './NotFoundPage';
```

---

## 12. Integration Notes

### 12.1 Sidebar Updates

`SidebarItem.tsx` (Spec 02) needs no structural changes, but the active-state matching logic described in section 6 must be verified against all 12 routes. The prefix-match approach from Spec 02 section 7.4 already handles dashboard sub-routes and SKU dynamic routes correctly.

**Addition to SidebarGroup.tsx:** Add the `isGroupActive` check (section 6.2) to elevate the group label brightness when any child route is active.

### 12.2 TopBar Updates

`TopBar.tsx` (Spec 02) is updated to replace the basic search input with `<GlobalSearch />` and to replace the simple bell-click-navigates-to-alerts with `<NotificationBell />`. Both components manage their own dropdown state internally.

```tsx
// Updated TopBar right zone
<div className="flex items-center gap-4">
  <GlobalSearch />
  <NotificationBell />
</div>
```

### 12.3 Breadcrumbs Updates

`Breadcrumbs.tsx` (Spec 02) is extended to handle the SKU dynamic segment. The core algorithm from Spec 02 section 7.6 remains; the addition is:

- Import `useParams` to detect `:id` on SKU detail routes.
- Look up `MOCK_SKUS` to resolve the `skuId` to a display-friendly `partNumber`.
- The "Home" crumb uses the `Home` icon (Lucide, `h-4 w-4`) instead of the text "Home" for compactness.

### 12.4 ROUTE_LABELS Extension

The `ROUTE_LABELS` map from Spec 02 section 6 already covers all routes. Add `'/inventory'` as a parent segment label for the inventory parameters breadcrumb trail:

```tsx
export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/alerts': 'Alerts',
  '/forecast': 'Forecast Overview',
  '/sku': 'SKU Detail',
  '/inventory': 'Inventory',
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

Note: The `/inventory` intermediate segment label ("Inventory") enables the breadcrumb trail `Home > Inventory > Inventory Parameters`. If this feels redundant, the breadcrumb generator can skip intermediate segments that are not routable (i.e., no route matches `/inventory` alone) and render `Home > Inventory Parameters` directly. Implementation choice left to the builder, but the label must be present in the map for either approach.

---

## 13. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | `createBrowserRouter` in `router.tsx` defines all 13 routes (12 pages + 404 catch-all) as children of the AppShell layout route | Code inspection |
| AC-2 | `App.tsx` wraps `RouterProvider` inside `QueryClientProvider` and `DemoStateProvider` | Code inspection |
| AC-3 | Navigating to `/` renders ActionCenterPage inside the AppShell chrome (sidebar + top bar visible) | Navigate to root; verify page content and chrome |
| AC-4 | Every route in the route table (section 3) renders the correct page component | Navigate to each of the 12 routes; verify correct content |
| AC-5 | Navigating to a non-existent path (e.g., `/xyz`) renders the NotFoundPage with "404", explanatory text, and a "Back to Action Center" link that navigates to `/` | Navigate to `/xyz`; verify 404 content; click link; verify navigation |
| AC-6 | Sidebar highlights the correct item for each route: exact match for static routes, prefix match for `/sku/:id` and dashboard sub-routes | Navigate to each route; verify gold left-border active state on correct item |
| AC-7 | When on a `/dashboard/*` route, the "Dashboards" group label shows elevated brightness (`text-white/70`) and the group is auto-expanded | Navigate to `/dashboard/fill-rate`; verify group label brightness and expansion |
| AC-8 | When on `/sku/1100031-1`, the "SKU Detail" item in the "Analysis" group is highlighted | Navigate to a SKU detail route; verify sidebar highlighting |
| AC-9 | Breadcrumbs display correctly for all routes per the table in section 7.2 | Navigate to each route; verify breadcrumb trail |
| AC-10 | SKU Detail breadcrumb resolves the dynamic `:id` param to the part number from mock data (e.g., "1100031-1") | Navigate to `/sku/1100031-1`; verify final breadcrumb shows "1100031-1" |
| AC-11 | Global search input in TopBar filters across SKUs (part number + description), alerts (part number + trigger), and worklist items (part number + action type) with grouped results in a dropdown | Type "1100" in search; verify grouped results appear |
| AC-12 | Clicking a SKU result in the search dropdown navigates to `/sku/{skuId}`, closes the dropdown, and clears the input | Click a SKU result; verify navigation, dropdown close, and input clear |
| AC-13 | Clicking an alert result navigates to `/alerts`; clicking a worklist result navigates to `/` | Click each result type; verify navigation |
| AC-14 | Search dropdown supports keyboard navigation: ArrowUp/Down to move highlight, Enter to select, Escape to dismiss | Use keyboard in search; verify behavior |
| AC-15 | Notification bell displays a badge with the count of unacknowledged alerts from mock data; badge hidden when count is 0 | Verify badge count matches `MOCK_ALERTS.filter(a => !a.acknowledgedAt).length` |
| AC-16 | Clicking the notification bell opens a dropdown showing up to 5 most recent unacknowledged alerts with severity dot, part number, trigger condition, and relative time | Click bell; verify dropdown content |
| AC-17 | Clicking "View All" in the notification dropdown navigates to `/alerts` | Click "View All"; verify navigation |
| AC-18 | Both search and notification dropdowns close on click outside, Escape key, or result selection | Test all three dismissal methods for both dropdowns |
| AC-19 | The AppShell (sidebar, top bar) persists across all navigations — no flicker or remount | Navigate rapidly between routes; verify chrome stability |

---

## 14. Out of Scope

- Page-specific content rendering (covered by Specs 07-14)
- Authentication, user session, or user avatar
- Deep-linking to specific alerts from the notification dropdown (navigates to `/alerts` page only)
- Server-side rendering or route-based code splitting (demo runs as a single SPA bundle)
- URL query parameter handling (filters, sorts) — individual page specs own their query param behavior if any
- Browser back/forward button behavior is handled natively by React Router; no custom logic needed
