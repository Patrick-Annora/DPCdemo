# Spec 16 — Cross-Page Interactivity & Unified Demo State

**Depends on:** Spec 03 (Type Definitions), Spec 04 (Mock Data), Spec 07 (Action Center), Spec 08 (Alerts Dashboard), Spec 09 (SKU Detail), Spec 10 (Forecast Overview), Spec 12 (Inventory Parameters), Spec 13 (BOM Explorer), Spec 14 (Pipeline Status)
**Kernel refs:** §2.1 (Stack — React Context for demo state), §2.2 (Project Structure — `hooks/`, `src/`), §6 (Routes), §8 (Placeholder Markers)
**SRD refs:** §5.1 (execution engine), §5.2 (worklist), §5.3 (alerts), §2.1 (parameters), §4.2 (MDM)

---

## 1. Overview

Individual page specs (07--14) define per-page behavior and local state. This spec defines how pages **connect to each other** and how **state flows across the app**. It covers:

- Cross-page navigation links (part-number clicks, action shortcuts, drill-downs)
- A unified `DemoStateProvider` React Context that holds all mutable demo state
- Custom hooks that expose domain-specific slices of that state
- A global toast notification system
- URL-based filter persistence across navigations

All state is in-memory, initialized from mock data, mutated via Context dispatch, and reset on full page reload.

---

## 2. File Structure

```
frontend/src/
  providers/
    DemoStateProvider.tsx        # Root context: initializes and holds all mutable state
    ToastProvider.tsx            # Global toast notification context + renderer
  hooks/
    useDemoState.ts             # Low-level hook: exposes raw DemoStateContext
    useWorklist.ts              # Worklist slice: items, approve, defer, escalate, modify, changeSource
    useAlerts.ts                # Alert slice: alerts, acknowledge, severityCounts
    useParameters.ts            # Parameter slice: parameters, update, toggleSource, bulkUpdate
    usePipeline.ts              # Pipeline slice: mdmCandidates, quarantine, approve/reject/fix/dismiss
    useToast.ts                 # Toast slice: addToast, dismissToast
    useUrlFilters.ts            # URL search-param sync for filter state
  lib/
    navigation.ts               # Helper constants and functions for cross-page links
```

---

## 3. Cross-Page Navigation Links

Every clickable part number, action shortcut, and drill-down in the app resolves to a React Router `useNavigate()` call or a `<Link>` component. No full-page reloads — all navigation is client-side via React Router v7.

### 3.1 Part Number Links to SKU Detail

Any surface that displays a part number as a clickable link navigates to `/sku/:id` where `:id` is the `skuId` (same as `partNumber`).

| Source Page | Source Component | Element | Target Route |
|---|---|---|---|
| Action Center (`/`) | `WorklistTable` | Part Number column cell | `/sku/${skuId}` |
| Alerts (`/alerts`) | `AlertCard` | Part number text in card header | `/sku/${alert.skuId}` |
| Forecast (`/forecast`) | Worst Performers `DataTable` | Part Number column cell | `/sku/${partNumber}` |
| Forecast (`/forecast`) | Ensemble Triggers `DataTable` | Part Number column cell | `/sku/${partNumber}` |
| Inventory Parameters (`/inventory/parameters`) | `ParameterTable` | Part Number column cell | `/sku/${skuId}` |

**Styling (consistent across all pages):**

```tsx
<Link
  to={`/sku/${id}`}
  className="text-navy-600 hover:text-navy-800 hover:underline font-mono text-sm font-medium"
>
  {partNumber}
</Link>
```

### 3.2 Worklist Action Shortcuts

Certain worklist action types have specialized navigation targets beyond the default SKU detail page.

| Action Type | Worklist Badge Label | Navigation Target | Behavior |
|---|---|---|---|
| `SET_PARAMETERS` | Set Params | `/inventory/parameters?sku=${skuId}` | Opens Inventory Parameters page with the search input pre-filled with the part number, effectively filtering the table to that SKU |
| `REVIEW_MIN_VIOLATION` | Min Violation | `/sku/${skuId}#inventory` | Opens SKU Detail page and scrolls to the inventory/parameters section via hash fragment |

**Implementation in `WorklistActionButtons.tsx`:**

When the user clicks the primary action button on a `SET_PARAMETERS` row, instead of the standard approval flow, navigate to the Inventory Parameters page:

```typescript
if (item.actionType === ActionType.SET_PARAMETERS) {
  navigate(`/inventory/parameters?sku=${item.skuId}`);
  return;
}

if (item.actionType === ActionType.REVIEW_MIN_VIOLATION) {
  navigate(`/sku/${item.skuId}#inventory`);
  return;
}
```

The `InventoryParametersPage` reads the `sku` query parameter on mount and pre-fills the `SearchInput` value, which triggers the existing filter logic to show only that SKU.

The `SkuDetailPage` reads `location.hash` on mount. When `hash === '#inventory'`, it calls `inventoryRef.current?.scrollIntoView({ behavior: 'smooth' })` to scroll the `InventoryCard` and `ParameterEditPanel` sections into view.

### 3.3 SKU Detail Outbound Links

| Element | Location on SKU Detail | Target Route | Condition |
|---|---|---|---|
| "View in BOM Explorer" link | `InventoryCard` component, below the inventory position summary | `/bom?part=${skuId}` | Only rendered when the SKU's `partNumber` appears in `MOCK_BOMS` (as root or any descendant). Hidden otherwise. |
| Alert row "View Alert" link | `AlertHistoryTable` | `/alerts?severity=${alert.alertLevel}` | Always rendered on each alert row |

**"View in BOM Explorer" behavior:**

The `BomExplorerPage` reads the `part` query parameter on mount. If present, it finds the BOM tree containing that part number (scanning `MOCK_BOMS` recursively) and:

1. Sets `selectedBomIndex` to the index of the matching BOM.
2. Expands the tree path from root to the matching node.
3. Sets `selectedNode` to the matching node.

```tsx
// In InventoryCard.tsx
{bomContainsPart(skuId) && (
  <Link
    to={`/bom?part=${skuId}`}
    className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 hover:underline mt-3"
  >
    <Network className="h-4 w-4" />
    View in BOM Explorer
  </Link>
)}
```

### 3.4 Dashboard Drill-Downs

Every number, chart element, and table row on a KPI dashboard is a doorway to the underlying data. A CEO watching the demo should be able to see a headline number and immediately click through to understand *which SKUs* are driving it.

#### 3.4.1 Summary Card Click-Throughs

Summary cards across all dashboards are clickable. Clicking a card navigates to the most relevant detail view for that metric.

| Dashboard | Card Label | Target Route | Behavior |
|---|---|---|---|
| Fill Rate | Current Fill Rate | `/dashboard/fill-rate` (scroll to trend) | Scrolls to the 12-month trend chart |
| Fill Rate | Critical Stockouts | `/alerts?severity=CRITICAL` | Opens alerts filtered to CRITICAL only |
| Fill Rate | Avg Days to Resolve | `/alerts` | Opens full alerts view |
| Inventory Health | Total Inventory Value | `/dashboard/inventory` (scroll to working capital) | Scrolls to Working Capital Trend chart |
| Inventory Health | SKUs Below Min | `/inventory/parameters?violation=below-min` | Opens parameters filtered to below-min violations |
| Inventory Health | SKUs Above Max | `/inventory/parameters?violation=above-max` | Opens parameters filtered to above-max violations |
| Inventory Health | Parameters Not Set | `/inventory/parameters?violation=not-set` | Opens parameters filtered to not-set |
| Inventory Health | Excess Inventory | `/dashboard/inventory` (scroll to excess table) | Scrolls to Excess Inventory table |
| Inventory Health | Days of Supply (Avg) | `/dashboard/inventory` (scroll to days-of-supply chart) | Scrolls to Days of Supply chart |
| Lead Time | Avg Lead Time (SCHECO) | `/dashboard/lead-time` (scroll to segment chart) | Scrolls to segment breakdown |
| Lead Time | On-Time Delivery Rate | `/dashboard/lead-time` (scroll to carrier scorecard) | Scrolls to Carrier Scorecard table |
| Lead Time | In-Transit Shipments | `/alerts?severity=WARNING` | Opens alerts (in-transit delays surface as WARNING/CRITICAL) |
| Reshoring | China:US Sourcing Ratio | `/dashboard/reshoring` (scroll to gauge) | Scrolls to ratio gauge |
| Reshoring | SKUs Reshored (YTD) | `/dashboard/reshoring` (scroll to transition table) | Scrolls to SKUs Transitioned table |
| Reshoring | Tariff Exposure | `/dashboard/arbitrage` | Opens arbitrage dashboard |
| Reshoring | Projected Annual Savings | `/dashboard/arbitrage` | Opens arbitrage dashboard |
| Arbitrage | Cumulative Savings (YTD) | `/dashboard/arbitrage` (scroll to cumulative chart) | Scrolls to cumulative savings chart |

**Implementation:** Wrap each `SummaryCard` in a `<Link>` or add an `onClick` + `navigate()` handler. Add `cursor-pointer hover:shadow-md transition-shadow` to make clickability discoverable. For same-page scrolls, use `ref.current?.scrollIntoView({ behavior: 'smooth' })`.

#### 3.4.2 Chart Click-Throughs

Clicking interactive chart elements on KPI Dashboard pages navigates to the relevant detail page with a pre-applied filter.

| Dashboard | Clickable Element | Target Route | What the CEO Sees |
|---|---|---|---|
| Fill Rate | Bar in fill-rate-by-product-line chart | `/inventory/parameters?productLine=${clickedLine}` | All SKUs in that product line with their parameter status |
| Fill Rate | Bar in fill-rate-by-source-node chart | `/inventory/parameters?source=${sourceNode}` | All SKUs from that source node |
| Fill Rate | Point on 12-month trend line | (no navigation — tooltip shows period detail) | Tooltip: fill rate %, lines shipped, lines missed for that month |
| Inventory Health | Bar segment in days-of-supply-by-product-line chart | `/inventory/parameters?productLine=${clickedLine}` | SKUs in that product line |
| Inventory Health | Point on working capital trend chart | (no navigation — tooltip shows period detail) | Tooltip: total value, change from prior month |
| Inventory Health | "Below Min" violation summary card | `/inventory/parameters?violation=below-min` | Filtered parameter table |
| Inventory Health | "Above Max" violation summary card | `/inventory/parameters?violation=above-max` | Filtered parameter table |
| Inventory Health | "No Parameters" violation summary card | `/inventory/parameters?violation=not-set` | Filtered parameter table |
| Reshoring | Donut segment in revenue-by-source-node chart | `/inventory/parameters?source=${sourceNode}` | All SKUs from that source node with cost data |
| Reshoring | Point on domestic-sourcing-trajectory chart | (no navigation — tooltip shows month detail) | Tooltip: domestic %, SKUs transitioned that month |

#### 3.4.3 Table Row Drill-Downs

Every table on a KPI dashboard with a Part Number column makes that column a clickable link to SKU detail. Tables without part numbers get row-level click handlers where meaningful.

| Dashboard | Table | Clickable Element | Target Route |
|---|---|---|---|
| Inventory Health | Excess Inventory table | Part Number cell | `/sku/${partNumber}` |
| Inventory Health | Shortage Analysis table | Part Number cell | `/sku/${partNumber}` |
| Lead Time | Carrier Scorecard table | Carrier name cell | (no navigation — row expands to show affected in-transit shipments in a sub-row) |
| Lead Time | Segment Performance cards | Card itself | (no navigation — clicking toggles an expanded view showing recent variance history) |
| Reshoring | SKUs Transitioned table | Part Number cell | `/sku/${skuId}` |
| Arbitrage | Top Reshored SKUs table | Part Number cell | `/sku/${partNumber}` |
| Arbitrage | Top Reshored SKUs table | "View Cost Breakdown" link (new) | `/bom?part=${partNumber}` |

**Part Number link styling** follows the same convention as Section 3.1:

```tsx
<Link to={`/sku/${partNumber}`} className="text-navy-600 hover:text-navy-800 hover:underline font-mono text-sm font-medium">
  {partNumber}
</Link>
```

#### 3.4.4 Forecast Overview Drill-Downs

The Forecast Overview page (`/forecast`) is read-only but should still let a CEO drill into specific data points.

| Element | Clickable Target | Target Route / Behavior |
|---|---|---|
| MAPE by Demand Class bar chart | Individual bar | Scrolls to Worst Performers table and applies a demand-class filter showing only SKUs in that class |
| Classification Distribution donut | Donut segment | Scrolls to Worst Performers table and applies a demand-class filter for that class |
| Forecast Accuracy scatter plot | Individual dot | `/sku/${partNumber}` — navigates to SKU detail for that part |
| FVA table | Part Number column (where applicable) | (FVA table has no part numbers — it's algorithm-level. No drill-down.) |
| Worst Performers table | Part Number cell | `/sku/${partNumber}` (already specified in Spec 10 §8.3) |
| Ensemble Triggers table | Part Number cell | `/sku/${partNumber}` (already specified in Spec 10 §9.3) |

**Scatter plot click implementation:**

```tsx
// In ForecastOverview.tsx
<ScatterPlot
  data={scatterData}
  onDotClick={(point) => navigate(`/sku/${point.label}`)}
  // ... other props
/>
```

The `ScatterPlot` component (Spec 06) accepts an optional `onDotClick` callback. When provided, dots render with `cursor-pointer` and a hover ring effect.

**MAPE bar / donut segment click implementation:**

Both charts use `onSegmentClick` to set a local `demandClassFilter` state variable. The Worst Performers table reads this filter and shows only matching rows. A "Clear filter" chip appears above the table when a filter is active.

```tsx
const [demandClassFilter, setDemandClassFilter] = useState<DemandClass | null>(null);

// On bar/donut click
const handleClassClick = (className: string) => {
  const dc = Object.entries(DEMAND_CLASS_LABELS).find(([, v]) => v === className)?.[0] as DemandClass;
  setDemandClassFilter(dc);
  worstPerformersRef.current?.scrollIntoView({ behavior: 'smooth' });
};

// Filter worst performers
const filteredWorstPerformers = demandClassFilter
  ? worstPerformers.filter(wp => wp.demandClass === demandClassFilter)
  : worstPerformers;
```

#### 3.4.5 Action Center Summary Card Drill-Downs

The Action Center summary cards (Spec 07 §3.2) are clickable, applying filters to the worklist table below.

| Card | Click Behavior |
|---|---|
| Items Pending | Clears all filters, resets to default view (all pending items) |
| Critical Alerts | Applies alert-level filter to `CRITICAL` on the worklist table |
| Total Recommended Spend | Sorts worklist by `estimatedCost` descending |
| Avg Confidence | Sorts worklist by `confidenceScore` ascending (worst confidence first) |

**Implementation:** Each card's `onClick` calls the filter/sort state setters exposed by the `useWorklist` hook. Add `cursor-pointer hover:shadow-md transition-shadow` styling.

#### 3.4.6 Alerts Dashboard Severity Card Drill-Downs

The severity summary cards on the Alerts page (Spec 08 §3.2) are clickable, applying severity filters to the alert grid below.

| Card | Click Behavior |
|---|---|
| Critical (count) | Sets severity filter to `[CRITICAL]` — shows only critical alerts |
| Warning (count) | Sets severity filter to `[WARNING]` |
| Watch (count) | Sets severity filter to `[WATCH]` |
| Excess (count) | Sets severity filter to `[EXCESS]` |

Clicking the already-active card clears the filter (toggles back to "All"). Add `cursor-pointer` and a ring highlight on the active card: `ring-2 ring-{severity-color}-400`.

**Implementation pattern for all drill-downs:**

Each chart component accepts an optional `onSegmentClick` callback. The dashboard page passes a handler that calls `navigate()` with the appropriate route and query parameters. For same-page interactions (filter/scroll), use React state + refs.

### 3.5 TopBar Alert Bell

The notification bell icon in the `TopBar` component (from Spec 02) displays a badge with the count of unacknowledged alerts. Clicking the bell navigates to `/alerts`.

```tsx
// In TopBar.tsx
const { alerts } = useAlerts();
const unacknowledgedCount = alerts.filter(a => !a.acknowledgedAt).length;

<button
  onClick={() => navigate('/alerts')}
  className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
  aria-label={`${unacknowledgedCount} unacknowledged alerts`}
>
  <Bell className="h-5 w-5" />
  {unacknowledgedCount > 0 && (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {unacknowledgedCount}
    </span>
  )}
</button>
```

The badge count is **live** — when the user acknowledges an alert on the Alerts Dashboard, the count decrements immediately because both the TopBar and AlertsDashboardPage consume the same `useAlerts()` hook backed by the shared DemoStateProvider.

---

## 4. Unified Demo State Provider

### 4.1 Architecture

A single React Context wraps the entire app at the router level. It holds all mutable state as a unified object, initialized from mock data constants. Individual hooks (`useWorklist`, `useAlerts`, etc.) are thin selectors over this context — they do not own independent state.

```
<BrowserRouter>
  <DemoStateProvider>       ← holds ALL mutable state
    <ToastProvider>         ← global toast stack
      <AppShell>
        <Outlet />          ← page routes
      </AppShell>
    </ToastProvider>
  </DemoStateProvider>
</BrowserRouter>
```

### 4.2 DemoStateProvider

**File:** `frontend/src/providers/DemoStateProvider.tsx`

**Context shape:**

```typescript
interface DemoState {
  /** Mutable copy of MOCK_WORKLIST — mutated by Action Center actions */
  worklist: WorklistItem[];
  /** Mutable copy of MOCK_ALERTS — mutated by acknowledge actions */
  alerts: Alert[];
  /** Mutable copy of MOCK_INVENTORY_PARAMETERS — mutated by parameter edits */
  parameters: InventoryParameters[];
  /** Parameter change history log, keyed by skuId */
  parameterHistory: Record<string, ParameterChangeEvent[]>;
  /** Mutable copy of MOCK_MDM_CANDIDATES — mutated by approve/reject */
  mdmCandidates: MdmCandidate[];
  /** Mutable copy of MOCK_QUARANTINED_RECORDS — mutated by fix/dismiss */
  quarantinedRecords: QuarantinedRecord[];
}

type DemoAction =
  | { type: 'WORKLIST_APPROVE'; itemId: string }
  | { type: 'WORKLIST_APPROVE_WITH_JUSTIFICATION'; itemId: string; justification: { reasonCode: string; freeText: string } }
  | { type: 'WORKLIST_BULK_APPROVE'; itemIds: string[] }
  | { type: 'WORKLIST_DEFER'; itemId: string }
  | { type: 'WORKLIST_ESCALATE'; itemId: string }
  | { type: 'WORKLIST_MODIFY_QTY'; itemId: string; newQty: number }
  | { type: 'WORKLIST_CHANGE_SOURCE'; itemId: string; newSource: SourceNode; newCost: Currency }
  | { type: 'ALERT_ACKNOWLEDGE'; alertId: string; note?: string }
  | { type: 'PARAMETER_UPDATE'; skuId: string; field: string; value: number }
  | { type: 'PARAMETER_TOGGLE_SOURCE'; skuId: string; useSystem: boolean }
  | { type: 'PARAMETER_BULK_UPDATE'; updates: Partial<InventoryParameters>[] }
  | { type: 'MDM_APPROVE'; candidateId: string }
  | { type: 'MDM_REJECT'; candidateId: string }
  | { type: 'QUARANTINE_FIX'; recordId: string }
  | { type: 'QUARANTINE_DISMISS'; recordId: string };

interface DemoStateContextValue {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
}
```

### 4.3 Reducer

The provider uses `useReducer` with a pure reducer function. Each action type maps to an immutable state update.

```typescript
function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'WORKLIST_APPROVE':
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, status: WorklistStatus.APPROVED }
            : item
        ),
      };

    case 'WORKLIST_APPROVE_WITH_JUSTIFICATION':
      // Same as APPROVE — justification logged to console for demo
      console.log(`[DEMO] Justification for ${action.itemId}:`, action.justification);
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, status: WorklistStatus.APPROVED }
            : item
        ),
      };

    case 'WORKLIST_BULK_APPROVE':
      return {
        ...state,
        worklist: state.worklist.map(item =>
          action.itemIds.includes(item.itemId)
            ? { ...item, status: WorklistStatus.APPROVED }
            : item
        ),
      };

    case 'WORKLIST_DEFER':
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, status: WorklistStatus.DEFERRED }
            : item
        ),
      };

    case 'WORKLIST_ESCALATE':
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, status: WorklistStatus.ESCALATED }
            : item
        ),
      };

    case 'WORKLIST_MODIFY_QTY': {
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, recommendedQty: action.newQty }
            : item
        ),
      };
    }

    case 'WORKLIST_CHANGE_SOURCE':
      return {
        ...state,
        worklist: state.worklist.map(item =>
          item.itemId === action.itemId
            ? { ...item, recommendedSource: action.newSource, estimatedCost: action.newCost }
            : item
        ),
      };

    case 'ALERT_ACKNOWLEDGE':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.alertId === action.alertId
            ? { ...alert, acknowledgedAt: new Date().toISOString() }
            : alert
        ),
      };

    case 'PARAMETER_UPDATE': {
      const now = new Date().toISOString();
      const existing = state.parameters.find(p => p.skuId === action.skuId);
      const oldValue = existing ? String((existing as Record<string, unknown>)[action.field] ?? '') : '';
      return {
        ...state,
        parameters: state.parameters.map(p =>
          p.skuId === action.skuId
            ? { ...p, [action.field]: action.value, parameterStatus: ParameterStatus.BUYER_OVERRIDE, lastReviewedAt: now, reviewedBy: 'Demo Buyer' }
            : p
        ),
        parameterHistory: {
          ...state.parameterHistory,
          [action.skuId]: [
            ...(state.parameterHistory[action.skuId] ?? []),
            {
              timestamp: now,
              changedBy: 'Demo Buyer',
              field: action.field as ParameterChangeEvent['field'],
              oldValue,
              newValue: String(action.value),
              source: ParameterSource.BUYER_MANUAL,
            },
          ],
        },
      };
    }

    case 'PARAMETER_TOGGLE_SOURCE': {
      const now = new Date().toISOString();
      const newStatus = action.useSystem ? ParameterStatus.SYSTEM_CALCULATED : ParameterStatus.BUYER_OVERRIDE;
      return {
        ...state,
        parameters: state.parameters.map(p =>
          p.skuId === action.skuId
            ? { ...p, parameterStatus: newStatus, source: action.useSystem ? ParameterSource.SYSTEM_AUTO : ParameterSource.BUYER_MANUAL, lastReviewedAt: now }
            : p
        ),
      };
    }

    case 'PARAMETER_BULK_UPDATE':
      return {
        ...state,
        parameters: state.parameters.map(p => {
          const update = action.updates.find(u => u.skuId === p.skuId);
          return update ? { ...p, ...update, parameterStatus: ParameterStatus.BUYER_OVERRIDE, lastReviewedAt: new Date().toISOString() } : p;
        }),
      };

    case 'MDM_APPROVE':
      return {
        ...state,
        mdmCandidates: state.mdmCandidates.map(c =>
          c.candidateId === action.candidateId
            ? { ...c, resolutionStatus: MdmResolutionStatus.APPROVED }
            : c
        ),
      };

    case 'MDM_REJECT':
      return {
        ...state,
        mdmCandidates: state.mdmCandidates.map(c =>
          c.candidateId === action.candidateId
            ? { ...c, resolutionStatus: MdmResolutionStatus.REJECTED }
            : c
        ),
      };

    case 'QUARANTINE_FIX':
      return {
        ...state,
        quarantinedRecords: state.quarantinedRecords.map(r =>
          r.recordId === action.recordId
            ? { ...r, resolution: QuarantineResolution.FIXED }
            : r
        ),
      };

    case 'QUARANTINE_DISMISS':
      return {
        ...state,
        quarantinedRecords: state.quarantinedRecords.map(r =>
          r.recordId === action.recordId
            ? { ...r, resolution: QuarantineResolution.DISMISSED }
            : r
        ),
      };

    default:
      return state;
  }
}
```

### 4.4 Initial State

```typescript
const initialState: DemoState = {
  worklist: structuredClone(MOCK_WORKLIST),
  alerts: structuredClone(MOCK_ALERTS),
  parameters: structuredClone(MOCK_INVENTORY_PARAMETERS),
  parameterHistory: structuredClone(MOCK_PARAMETER_HISTORY),
  mdmCandidates: structuredClone(MOCK_MDM_CANDIDATES),
  quarantinedRecords: structuredClone(MOCK_QUARANTINED_RECORDS),
};
```

`structuredClone` ensures a deep copy so that mutations never alter the original mock data constants. On full page reload, `useState`/`useReducer` re-initializes from the mock data, resetting all demo state.

### 4.5 Provider Component

```tsx
const DemoStateContext = createContext<DemoStateContextValue | null>(null);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}
```

---

## 5. Custom Hooks

Each hook reads from the shared `DemoStateContext` and exposes a domain-specific API. Hooks call `dispatch` for mutations and `addToast` (from `useToast`) for user feedback.

### 5.1 useDemoState

**File:** `frontend/src/hooks/useDemoState.ts`

The low-level hook. All other hooks build on this.

```typescript
export function useDemoState(): DemoStateContextValue {
  const context = useContext(DemoStateContext);
  if (!context) {
    throw new Error('useDemoState must be used within a DemoStateProvider');
  }
  return context;
}
```

### 5.2 useWorklist

**File:** `frontend/src/hooks/useWorklist.ts`

```typescript
interface UseWorklistReturn {
  /** Enriched worklist rows (joined with SKU + InventoryPosition) */
  items: WorklistRow[];
  /** Count of PENDING items */
  pendingCount: number;
  /** Sum of estimatedCost for PENDING items */
  totalPendingSpend: Currency;
  /** Approve a single item */
  approveItem: (itemId: string) => void;
  /** Approve with justification (low-confidence items) */
  approveWithJustification: (itemId: string, justification: { reasonCode: string; freeText: string }) => void;
  /** Approve multiple items */
  bulkApprove: (itemIds: string[]) => void;
  /** Defer an item */
  deferItem: (itemId: string) => void;
  /** Escalate an item */
  escalateItem: (itemId: string) => void;
  /** Modify recommended quantity */
  modifyQty: (itemId: string, newQty: number) => void;
  /** Change recommended source and cost */
  changeSource: (itemId: string, newSource: SourceNode, newCost: Currency) => void;
}
```

**Implementation notes:**

- `items` is derived via `useMemo`: joins `state.worklist` with `MOCK_SKUS` and `MOCK_INVENTORY` (read-only mock data for SKU/inventory details that do not mutate).
- Each mutation function dispatches the corresponding `DemoAction` and calls `addToast()` with a success message. Example:

```typescript
const approveItem = useCallback((itemId: string) => {
  dispatch({ type: 'WORKLIST_APPROVE', itemId });
  const item = state.worklist.find(w => w.itemId === itemId);
  const sku = MOCK_SKUS.find(s => s.skuId === item?.skuId);
  addToast({ type: 'success', message: `PO approved for ${sku?.partNumber ?? itemId}` });
}, [dispatch, state.worklist, addToast]);
```

### 5.3 useAlerts

**File:** `frontend/src/hooks/useAlerts.ts`

```typescript
interface UseAlertsReturn {
  /** All alerts (mutable state) */
  alerts: Alert[];
  /** Count of unacknowledged alerts */
  unacknowledgedCount: number;
  /** Counts by severity level */
  severityCounts: Record<AlertLevel, number>;
  /** Acknowledge an alert */
  acknowledgeAlert: (alertId: string, note?: string) => void;
}
```

**Implementation notes:**

- `severityCounts` is a `useMemo` that groups `state.alerts` by `alertLevel` and counts unacknowledged alerts per level.
- `acknowledgeAlert` dispatches `ALERT_ACKNOWLEDGE` and calls `addToast({ type: 'success', message: 'Alert acknowledged' })`.
- The `unacknowledgedCount` is consumed by the TopBar's notification bell (Section 3.5).

### 5.4 useParameters

**File:** `frontend/src/hooks/useParameters.ts`

```typescript
interface UseParametersReturn {
  /** All inventory parameter records (mutable state) */
  parameters: InventoryParameters[];
  /** Parameter change history keyed by skuId */
  changeHistory: Record<string, ParameterChangeEvent[]>;
  /** System-recommended values (read-only, from MOCK_SAFETY_STOCK) */
  systemRecommendations: Record<string, Partial<InventoryParameters>>;
  /** Update a single field on a parameter record */
  updateParameter: (skuId: string, field: string, value: number) => void;
  /** Toggle between system-calculated and buyer-override */
  toggleSource: (skuId: string, useSystem: boolean) => void;
  /** Bulk-update multiple parameter records */
  bulkUpdate: (updates: Partial<InventoryParameters>[]) => void;
}
```

**Implementation notes:**

- `systemRecommendations` is derived from `MOCK_SAFETY_STOCK` (read-only) and provides the "system suggests X" hint shown in inline edit cells.
- `updateParameter` dispatches `PARAMETER_UPDATE`, which both updates the parameter value and appends to the change history.
- `toggleSource` dispatches `PARAMETER_TOGGLE_SOURCE`. When toggling to system-calculated, the reducer copies recommended values from `MOCK_SAFETY_STOCK` into the parameter record.
- `bulkUpdate` dispatches `PARAMETER_BULK_UPDATE` and calls `addToast({ type: 'success', message: '${updates.length} parameters updated' })`.

### 5.5 usePipeline

**File:** `frontend/src/hooks/usePipeline.ts`

```typescript
interface UsePipelineReturn {
  /** MDM entity resolution candidates */
  mdmCandidates: MdmCandidate[];
  /** Count of pending MDM candidates */
  pendingMdmCount: number;
  /** Quarantined records */
  quarantinedRecords: QuarantinedRecord[];
  /** Count of pending quarantined records */
  pendingQuarantineCount: number;
  /** Approve an MDM merge candidate */
  approveMdm: (candidateId: string) => void;
  /** Reject an MDM merge candidate */
  rejectMdm: (candidateId: string) => void;
  /** Mark a quarantined record as fixed */
  fixQuarantine: (recordId: string) => void;
  /** Dismiss a quarantined record */
  dismissQuarantine: (recordId: string) => void;
}
```

**Implementation notes:**

- `pendingMdmCount` counts candidates where `resolutionStatus === MdmResolutionStatus.PENDING`.
- `pendingQuarantineCount` counts records where `resolution === QuarantineResolution.PENDING`.
- Each mutation dispatches the corresponding action and fires a toast.

### 5.6 useToast

**File:** `frontend/src/hooks/useToast.ts`

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  createdAt: number;
}

interface UseToastReturn {
  /** Current toast stack (newest last) */
  toasts: Toast[];
  /** Add a toast to the stack */
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  /** Manually dismiss a toast */
  dismissToast: (id: string) => void;
}
```

See Section 7 for the full toast system specification.

---

## 6. State Consistency Across Pages

### 6.1 Worklist State Consistency

When a worklist item is approved, deferred, or escalated on the Action Center:

1. The item's `status` changes in the shared `DemoState.worklist`.
2. If the user navigates away and returns to `/`, the `useWorklist` hook reads the same Context state. The item still shows its updated status.
3. Summary card counts (Items Pending, Total Recommended Spend, etc.) recompute from the live Context state on every render.
4. Worklist mutations do NOT affect alerts. Alerts are a separate domain slice. Approving a PO does not acknowledge the associated alert — these are independent workflows per SRD.

### 6.2 Alert State Consistency

When an alert is acknowledged on the Alerts Dashboard:

1. The alert's `acknowledgedAt` is set in `DemoState.alerts`.
2. The TopBar notification bell count decrements immediately (both consume `useAlerts()`).
3. If the user navigates to `/sku/:id` for the same SKU, the `AlertHistoryTable` shows the alert with its acknowledged timestamp.
4. Alert severity summary cards on the Alerts Dashboard recompute counts from Context state.

### 6.3 Parameter State Consistency

When a parameter is edited on the Inventory Parameters page or the SKU Detail `ParameterEditPanel`:

1. The parameter record updates in `DemoState.parameters`.
2. A change event appends to `DemoState.parameterHistory[skuId]`.
3. Both pages consume `useParameters()`, so edits made on one page are visible on the other without additional synchronization.
4. The Inventory Health dashboard (`/dashboard/inventory`) derives violation counts from `DemoState.parameters`, so counts update after parameter edits.

### 6.4 Pipeline State Consistency

When an MDM candidate is approved/rejected or a quarantined record is fixed/dismissed on the Pipeline Status page:

1. The record's status updates in `DemoState.mdmCandidates` or `DemoState.quarantinedRecords`.
2. The Pipeline Status page summary cards recompute pending counts from Context state.
3. If the user navigates away and returns, the resolved records retain their status.

### 6.5 Reset Behavior

All state resets to the original mock data on a full browser page reload (`window.location.reload()` or F5). This is by design per Kernel Section 1 — the demo is a stateless frontend prototype. The `useReducer` re-initializes from `initialState`, which deep-clones the mock data constants.

---

## 7. Toast Notification System

### 7.1 ToastProvider

**File:** `frontend/src/providers/ToastProvider.tsx`

A React Context that manages a stack of toast notifications. Wraps the app inside `DemoStateProvider` so that hooks can call `addToast` from mutation functions.

```typescript
const ToastContext = createContext<UseToastReturn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newToast: Toast = { ...toast, id, createdAt: Date.now() };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const elapsed = Date.now() - oldest.createdAt;
    const remaining = Math.max(0, 3000 - elapsed);
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, remaining);
    return () => clearTimeout(timer);
  }, [toasts]);

  const value = useMemo(() => ({ toasts, addToast, dismissToast }), [toasts, addToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
```

### 7.2 ToastRenderer

A fixed-position container that renders the toast stack in the bottom-right corner of the viewport.

```tsx
function ToastRenderer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3
            px-4 py-3
            rounded-lg shadow-lg border
            text-sm font-medium
            animate-slide-in-right
            ${TOAST_STYLES[toast.type]}
          `}
        >
          <ToastIcon type={toast.type} />
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 p-0.5 rounded hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 7.3 Toast Styles

```typescript
const TOAST_STYLES: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};
```

### 7.4 Toast Icons

| Type | Lucide Icon | Color Class |
|---|---|---|
| `success` | `CheckCircle2` | `text-green-500` |
| `error` | `XCircle` | `text-red-500` |
| `warning` | `AlertTriangle` | `text-amber-500` |
| `info` | `Info` | `text-blue-500` |

### 7.5 Animation

Add the following to `tailwind.config.ts` (or the CSS layer):

```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.2s ease-out;
}
```

### 7.6 Behavior

- **Auto-dismiss:** Each toast auto-dismisses after 3 seconds from creation.
- **Stacking:** Multiple toasts stack vertically. Newest toast appears at the bottom of the stack (closest to the corner). Column uses `flex-col-reverse` so the newest visually appears at the bottom.
- **Manual dismiss:** Each toast has an X button for immediate dismissal.
- **Max stack:** No explicit limit, but in practice the demo rarely triggers more than 2-3 toasts in rapid succession.

### 7.7 Toast Triggers

Every mutation across the app triggers a toast. The following table lists all toast messages:

| Action | Toast Type | Message |
|---|---|---|
| Approve worklist item | `success` | `PO approved for {partNumber}` |
| Approve with justification | `success` | `PO approved for {partNumber} (with justification)` |
| Bulk approve | `success` | `{count} items approved` |
| Defer worklist item | `info` | `{partNumber} deferred by 1 week` |
| Escalate worklist item | `warning` | `{partNumber} escalated to manager` |
| Modify quantity | `success` | `Quantity updated for {partNumber}` |
| Change source | `success` | `Source changed for {partNumber}` |
| Acknowledge alert | `success` | `Alert acknowledged` |
| Update parameter | `success` | `{field} updated for {partNumber}` |
| Toggle parameter source | `info` | `{partNumber} set to {system-calculated/manual override}` |
| Bulk parameter update | `success` | `{count} parameters updated` |
| Approve MDM candidate | `success` | `MDM merge approved: {partA} + {partB}` |
| Reject MDM candidate | `info` | `MDM merge rejected: {partA} + {partB}` |
| Fix quarantined record | `success` | `Quarantine record fixed` |
| Dismiss quarantined record | `info` | `Quarantine record dismissed` |

---

## 8. URL State for Filters

### 8.1 useUrlFilters Hook

**File:** `frontend/src/hooks/useUrlFilters.ts`

A generic hook that synchronizes filter state with URL search parameters. This ensures that filter selections survive client-side navigation (e.g., drilling down from a dashboard to a filtered table view, then pressing the browser back button).

```typescript
interface UseUrlFiltersOptions<T extends Record<string, string | string[] | undefined>> {
  /** Default values when no URL params are present */
  defaults: T;
  /** Optional prefix for param names to avoid collisions */
  prefix?: string;
}

interface UseUrlFiltersReturn<T extends Record<string, string | string[] | undefined>> {
  /** Current filter values (merged: URL params override defaults) */
  filters: T;
  /** Update one or more filter values (updates URL) */
  setFilters: (updates: Partial<T>) => void;
  /** Reset all filters to defaults (clears URL params) */
  resetFilters: () => void;
}
```

### 8.2 Implementation Pattern

```typescript
export function useUrlFilters<T extends Record<string, string | string[] | undefined>>(
  options: UseUrlFiltersOptions<T>
): UseUrlFiltersReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...options.defaults };
    for (const key of Object.keys(options.defaults)) {
      const paramKey = options.prefix ? `${options.prefix}.${key}` : key;
      const paramValue = searchParams.get(paramKey);
      if (paramValue !== null) {
        // If default is an array type, split on comma
        if (Array.isArray(options.defaults[key])) {
          (result as Record<string, unknown>)[key] = paramValue.split(',').filter(Boolean);
        } else {
          (result as Record<string, unknown>)[key] = paramValue;
        }
      }
    }
    return result;
  }, [searchParams, options.defaults, options.prefix]);

  const setFilters = useCallback((updates: Partial<T>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        const paramKey = options.prefix ? `${options.prefix}.${key}` : key;
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          next.delete(paramKey);
        } else if (Array.isArray(value)) {
          next.set(paramKey, value.join(','));
        } else {
          next.set(paramKey, String(value));
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, options.prefix]);

  const resetFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const key of Object.keys(options.defaults)) {
        const paramKey = options.prefix ? `${options.prefix}.${key}` : key;
        next.delete(paramKey);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, options.defaults, options.prefix]);

  return { filters, setFilters, resetFilters };
}
```

### 8.3 URL Filter Usage per Page

| Page | URL Parameters | Example URL |
|---|---|---|
| Alerts Dashboard | `severity` (comma-separated AlertLevel values) | `/alerts?severity=CRITICAL,WARNING` |
| Inventory Parameters | `violation` (filter preset), `sku` (search), `productLine` (filter) | `/inventory/parameters?violation=below-min` |
| Action Center | `status` (WorklistStatus), `action` (ActionType), `source` (SourceNode) | `/?status=PENDING&action=NEW_PO` |
| Forecast Overview | (none currently — read-only page) | `/forecast` |
| BOM Explorer | `part` (pre-select a part in the tree) | `/bom?part=1100031-1` |

### 8.4 Page-Level Integration

Each page that supports URL filters calls `useUrlFilters` at the page component level and passes the `filters` object to its filter bar and table components.

**Example — Alerts Dashboard:**

```typescript
const { filters, setFilters, resetFilters } = useUrlFilters({
  defaults: {
    severity: [] as string[],
  },
});

// Map URL filter to component state
const selectedLevels = filters.severity as AlertLevel[];
```

**Example — Inventory Parameters:**

```typescript
const { filters, setFilters } = useUrlFilters({
  defaults: {
    violation: '',
    sku: '',
    productLine: '',
  },
});

// Pre-fill search input from URL
const searchQuery = filters.sku ?? '';

// Pre-select violation filter from URL
const activeViolationFilter = filters.violation ?? 'all';
```

### 8.5 Navigation with replace

All `setFilters` calls use `{ replace: true }` to avoid polluting the browser history stack with filter changes. The user can still press Back to return to the previous page, not to the previous filter state.

---

## 9. Navigation Helper — `lib/navigation.ts`

**File:** `frontend/src/lib/navigation.ts`

Centralizes route construction to avoid magic strings scattered across components.

```typescript
export const routes = {
  actionCenter: '/',
  alerts: '/alerts',
  skuDetail: (skuId: string) => `/sku/${skuId}`,
  skuDetailInventory: (skuId: string) => `/sku/${skuId}#inventory`,
  forecast: '/forecast',
  inventoryParameters: '/inventory/parameters',
  inventoryParametersForSku: (skuId: string) => `/inventory/parameters?sku=${skuId}`,
  inventoryParametersViolation: (violation: string) => `/inventory/parameters?violation=${violation}`,
  inventoryParametersProductLine: (line: string) => `/inventory/parameters?productLine=${line}`,
  bom: '/bom',
  bomForPart: (partNumber: string) => `/bom?part=${partNumber}`,
  pipeline: '/pipeline',
  dashboard: {
    fillRate: '/dashboard/fill-rate',
    inventory: '/dashboard/inventory',
    leadTime: '/dashboard/lead-time',
    reshoring: '/dashboard/reshoring',
    arbitrage: '/dashboard/arbitrage',
  },
} as const;
```

All cross-page `<Link>` components and `navigate()` calls MUST use these route builders instead of inline string interpolation.

---

## 10. Provider Mounting Order

The providers must be mounted in the correct order in the app's entry point (`main.tsx` or `App.tsx`):

```tsx
import { BrowserRouter } from 'react-router-dom';
import { DemoStateProvider } from '@/providers/DemoStateProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { AppShell } from '@/components/layout/AppShell';

function App() {
  return (
    <BrowserRouter>
      <DemoStateProvider>
        <ToastProvider>
          <AppShell>
            {/* React Router <Routes> / <Outlet> here */}
          </AppShell>
        </ToastProvider>
      </DemoStateProvider>
    </BrowserRouter>
  );
}
```

**Ordering rationale:**

1. `BrowserRouter` is outermost because all hooks (`useNavigate`, `useSearchParams`) depend on the router context.
2. `DemoStateProvider` is next because domain hooks (`useWorklist`, `useAlerts`, etc.) need the demo state context.
3. `ToastProvider` is inside `DemoStateProvider` because domain hooks call `addToast` — but `ToastProvider` does not depend on demo state. It could technically be a sibling, but nesting it inside simplifies the hook dependency chain.

---

## 11. Migration Notes for Existing Page Specs

Several page specs (07, 08, 09, 12, 14) define their own local state management (e.g., `useState` for worklist items, a `ParameterContext`). This spec **supersedes** those local state patterns. The migration path is:

| Page Spec | Local State Pattern | Replacement |
|---|---|---|
| Spec 07 (Action Center) | `useWorklist` hook with internal `useState` (Spec 07 Section 11) | `useWorklist` hook backed by `DemoStateProvider` (this spec Section 5.2) |
| Spec 08 (Alerts Dashboard) | `useAlerts` hook with internal `useState` (Spec 08 Section 2) | `useAlerts` hook backed by `DemoStateProvider` (this spec Section 5.3) |
| Spec 09 (SKU Detail) | Direct reads from mock data constants for parameters | `useParameters` hook backed by `DemoStateProvider` (this spec Section 5.4) |
| Spec 12 (Inventory Parameters) | `ParameterContext` with its own provider (Spec 12 Section 3) | `useParameters` hook backed by `DemoStateProvider` (this spec Section 5.4). The `ParameterContext` from Spec 12 is **removed** — its shape is absorbed into `DemoState`. |
| Spec 14 (Pipeline Status) | Local `useState` for MDM and quarantine actions | `usePipeline` hook backed by `DemoStateProvider` (this spec Section 5.5) |

The individual page components remain responsible for their own UI state (modals open/closed, selected rows, expanded nodes, etc.). Only **domain data mutations** move to the shared provider.

---

## 12. Placeholder Markers

```typescript
// MOCK: DemoStateProvider initializes from static mock data — replace with API hydration
// API_PLACEHOLDER: All dispatch actions would become API calls in production
// WEBSOCKET_PLACEHOLDER: Real-time state sync (worklist updates, alert triggers) via WebSocket
// AUTH_PLACEHOLDER: User identity for changeHistory.changedBy — currently hardcoded "Demo Buyer"
```

---

## 13. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | `DemoStateProvider` wraps the entire app. Removing it causes `useDemoState` to throw "must be used within a DemoStateProvider". | Comment out provider in App.tsx; verify error in console. |
| 2 | Clicking a part number in the Action Center worklist table navigates to `/sku/{skuId}` via client-side routing (no full page reload). | Click part number; verify URL updates and page renders without reload. |
| 3 | Clicking a part number in an Alert card on the Alerts Dashboard navigates to `/sku/{skuId}`. | Click part number on any alert card; verify SKU Detail page loads with correct data. |
| 4 | Clicking a part number in the Forecast Overview worst-performers table navigates to `/sku/{partNumber}`. | Click first row part number; verify navigation to correct SKU Detail. |
| 5 | Clicking a part number in the Inventory Parameters table navigates to `/sku/{skuId}`. | Click any part number; verify navigation. |
| 6 | A `SET_PARAMETERS` worklist item's primary action navigates to `/inventory/parameters?sku={skuId}`, and the Inventory Parameters page pre-fills the search input with that SKU, filtering the table. | Find a SET_PARAMETERS row on Action Center; click primary action; verify navigation and filter. |
| 7 | A `REVIEW_MIN_VIOLATION` worklist item's primary action navigates to `/sku/{skuId}#inventory`, and the SKU Detail page scrolls to the inventory section. | Find a REVIEW_MIN_VIOLATION row; click primary action; verify scroll position. |
| 8 | The "View in BOM Explorer" link on SKU Detail (when the SKU exists in a BOM) navigates to `/bom?part={skuId}`, and the BOM Explorer pre-selects and expands to the correct node. | Navigate to a SKU that appears in MOCK_BOMS; click the BOM link; verify tree selection. |
| 9 | The TopBar notification bell shows the count of unacknowledged alerts. Acknowledging an alert on the Alerts Dashboard decrements the bell count immediately. | Note bell count; acknowledge an alert; verify count decreases without page reload. |
| 10 | Approving a worklist item on the Action Center persists when navigating away and back: the item still shows APPROVED status and the "Items Pending" summary card count decreases. | Approve an item; navigate to /alerts; navigate back to /; verify item shows APPROVED. |
| 11 | Editing a parameter value on the Inventory Parameters page is reflected on the SKU Detail page's ParameterEditPanel for the same SKU. | Edit minQty on /inventory/parameters; navigate to /sku/{id}; verify minQty shows new value. |
| 12 | Approving an MDM candidate on the Pipeline Status page persists: navigating away and back shows the candidate as APPROVED. | Approve an MDM candidate; navigate to /alerts; navigate back to /pipeline; verify APPROVED status. |
| 13 | Toast notifications appear in the bottom-right corner when any mutation action fires. Toasts auto-dismiss after 3 seconds. | Approve a worklist item; verify toast appears; wait 3 seconds; verify toast disappears. |
| 14 | Multiple toasts stack vertically. Triggering 3 rapid actions shows 3 stacked toasts. | Bulk-approve 3 items; verify multiple toasts render simultaneously. |
| 15 | Toast can be manually dismissed by clicking the X button before the 3-second auto-dismiss. | Trigger a toast; click X immediately; verify toast disappears. |
| 16 | URL filter parameters persist across navigation. Setting `?severity=CRITICAL` on `/alerts`, navigating to `/sku/...`, then pressing browser Back restores the `/alerts?severity=CRITICAL` filter. | Apply severity filter; navigate away; press Back; verify filter is restored. |
| 17 | Dashboard drill-down: clicking "Below Min" violation count on Inventory Health dashboard navigates to `/inventory/parameters?violation=below-min` and the table filters to below-min violations. | Click violation count card; verify navigation and filtered table. |
| 18 | All route construction uses `routes` helpers from `lib/navigation.ts` — no inline string interpolation for cross-page links. | Code review: grep for `/sku/` outside of `navigation.ts`; should find none. |
| 19 | Full page reload (F5) resets all demo state to original mock data values. Previously approved items return to PENDING, acknowledged alerts return to unacknowledged. | Make mutations; reload page; verify all state is reset. |
| 20 | No TypeScript compilation errors across all provider, hook, and page files. | Run `tsc --noEmit`; verify zero errors. |
