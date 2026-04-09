# Spec 08 — Alerts Dashboard Page

**Status:** Draft
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data — `alerts.ts`), Spec 05 (Common Components — AlertSeverityBadge, FilterBar, SummaryCard, DaysOfSupplyIndicator, Modal, PageHeader)
**Kernel refs:** §4.2 (Alerts Dashboard feature map), §7 (Design System — colors, typography)
**SRD refs:** §5.3 (Predictive Stock-Out Alert System), §5.3.1 (threshold definitions), §5.3.2 (recalculation cadence), §5.3.3 (predictive delay detection)
**Route:** `/alerts`

---

## 1. Overview

The Alerts Dashboard is the system's early-warning surface. It displays all active inventory alerts — stock-out risks, reorder-point breaches, in-transit shipment delays, and excess inventory conditions — organized by severity and time-to-impact. Every alert terminates in an actionable workflow: acknowledge, expedite, reorder, or communicate.

This page consumes `MOCK_ALERTS` (10 alerts) from `frontend/src/data/alerts.ts` and enriches each alert with SKU details from `MOCK_SKUS` and inventory positions from `MOCK_INVENTORY`.

---

## 2. File Structure

```
frontend/src/
  pages/
    Alerts/
      AlertsDashboardPage.tsx    # Page-level orchestrator
      index.ts                   # Re-export
  components/
    alerts/
      AlertCard.tsx              # Individual alert card
      AlertSeveritySummary.tsx   # Row of 4 severity-count SummaryCards
      StockOutTimeline.tsx       # Per-alert stock-out timeline visualization
      AcknowledgeModal.tsx       # Acknowledge confirmation modal
      DelayActionPanel.tsx       # Predictive delay action buttons
      index.ts                   # Barrel export
  hooks/
    useAlerts.ts                 # Alert state management hook
```

---

## 3. Component Specifications

### 3.1 AlertsDashboardPage

The top-level page component. Owns all local state (severity filter, sort order, acknowledge state) and composes child components.

**File:** `pages/Alerts/AlertsDashboardPage.tsx`

**State:**

```typescript
// Read severity query param for drill-down from other pages (e.g., /alerts?severity=CRITICAL)
const [searchParams] = useSearchParams();
const initialSeverity = searchParams.get('severity') as AlertLevel | null;

// Severity filter — empty array means "All" (no filter applied)
const [selectedLevels, setSelectedLevels] = useState<AlertLevel[]>(
  initialSeverity ? [initialSeverity] : []
);

// Acknowledge modal state
const [acknowledgeTarget, setAcknowledgeTarget] = useState<Alert | null>(null);

// Alert data with local acknowledge state
const { alerts, acknowledgeAlert, severityCounts } = useAlerts();
```

**URL Query Parameter Support:**

The `severity` query parameter accepts a single `AlertLevel` value (e.g., `?severity=CRITICAL`). When present, the page initializes with that severity pre-selected in the filter, showing only alerts of that level. Multi-value filtering is done interactively via the FilterBar, not via URL. This supports drill-down from the Fill Rate dashboard's "Critical Stockouts" card, the Lead Time dashboard's "In-Transit Shipments" card, and the TopBar alert bell.

**Layout (top to bottom):**

1. `PageHeader` — title: "Alerts Dashboard", subtitle: "Predictive stock-out and inventory alerts"
2. `AlertSeveritySummary` — row of 4 severity-count cards
3. `FilterBar` — severity toggle buttons with counts
4. Alert card grid — responsive grid of `AlertCard` components
5. `AcknowledgeModal` — conditionally rendered when `acknowledgeTarget` is non-null

**Rendering Logic:**

```typescript
// Filter alerts by selected severity levels
const filteredAlerts = selectedLevels.length === 0
  ? alerts
  : alerts.filter(a => selectedLevels.includes(a.alertLevel));

// Sort: CRITICAL first, then WARNING, WATCH, EXCESS.
// Within same severity: ascending by daysToStockout (nulls last for EXCESS).
const SEVERITY_ORDER: Record<AlertLevel, number> = {
  [AlertLevel.CRITICAL]: 0,
  [AlertLevel.WARNING]: 1,
  [AlertLevel.WATCH]: 2,
  [AlertLevel.EXCESS]: 3,
};

const sortedAlerts = [...filteredAlerts].sort((a, b) => {
  const severityDiff = SEVERITY_ORDER[a.alertLevel] - SEVERITY_ORDER[b.alertLevel];
  if (severityDiff !== 0) return severityDiff;
  // Within same severity, sort by daysToStockout ascending (nulls last)
  if (a.daysToStockout === null && b.daysToStockout === null) return 0;
  if (a.daysToStockout === null) return 1;
  if (b.daysToStockout === null) return -1;
  return a.daysToStockout - b.daysToStockout;
});
```

**Grid Layout:**

```
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  {sortedAlerts.map(alert => (
    <AlertCard
      key={alert.alertId}
      alert={alert}
      sku={skuLookup[alert.skuId]}
      inventory={inventoryLookup[alert.skuId]}
      onAcknowledge={() => setAcknowledgeTarget(alert)}
    />
  ))}
</div>
```

Breakpoints follow Kernel §7.1 responsive rules:
- **Narrow** (< 768px / `md`): 1 column
- **Medium** (768px–1279px / `md` to `xl`): 2 columns
- **Wide** (>= 1280px / `xl`): 3 columns

**Empty State:** If `sortedAlerts` is empty after filtering, render the `EmptyState` component with icon `Bell`, title "No alerts match this filter", description "Try selecting different severity levels or view all alerts."

---

### 3.2 AlertSeveritySummary

A row of 4 `SummaryCard` components, one per severity level, showing the count of active alerts at each level. Color-matched to the Kernel §7.2 alert palette. **Cards are clickable** — clicking a severity card applies that severity as a filter on the alert grid below (see Spec 16 §3.4.6). Clicking the already-active card clears the filter (toggle behavior).

**File:** `components/alerts/AlertSeveritySummary.tsx`

**Props:**

```typescript
interface AlertSeveritySummaryProps {
  /** Count of alerts per severity level */
  counts: Record<AlertLevel, number>;
  /** Currently active severity filter (null = all) */
  activeLevel: AlertLevel | null;
  /** Callback when a severity card is clicked */
  onLevelClick: (level: AlertLevel) => void;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Layout:**

```tsx
<div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className ?? ''}`}>
  <SummaryCard
    label="Critical"
    value={String(counts.CRITICAL)}
    onClick={() => onLevelClick(AlertLevel.CRITICAL)}
    className={`border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow ${
      activeLevel === AlertLevel.CRITICAL ? 'ring-2 ring-red-400' : ''
    }`}
  />
  <SummaryCard
    label="Warning"
    value={String(counts.WARNING)}
    onClick={() => onLevelClick(AlertLevel.WARNING)}
    className={`border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow ${
      activeLevel === AlertLevel.WARNING ? 'ring-2 ring-amber-400' : ''
    }`}
  />
  <SummaryCard
    label="Watch"
    value={String(counts.WATCH)}
    onClick={() => onLevelClick(AlertLevel.WATCH)}
    className={`border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow ${
      activeLevel === AlertLevel.WATCH ? 'ring-2 ring-yellow-400' : ''
    }`}
  />
  <SummaryCard
    label="Excess"
    value={String(counts.EXCESS)}
    onClick={() => onLevelClick(AlertLevel.EXCESS)}
    className={`border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow ${
      activeLevel === AlertLevel.EXCESS ? 'ring-2 ring-blue-400' : ''
    }`}
  />
</div>
```

**Click behavior:**

```typescript
// In AlertsDashboardPage.tsx
const handleLevelClick = (level: AlertLevel) => {
  // Toggle: if clicking the already-active level, clear the filter
  if (selectedLevels.length === 1 && selectedLevels[0] === level) {
    setSelectedLevels([]);
  } else {
    setSelectedLevels([level]);
  }
};
```

The active card shows a `ring-2` highlight in the severity's color to indicate it's the active filter. This gives the CEO instant visual feedback about which severity they're drilling into.

**Color Matching:**

Each card gets a colored left border matching Kernel §7.2:

| Level | Left Border | Active Ring | Card Visual |
|---|---|---|---|
| CRITICAL | `border-l-red-500` | `ring-red-400` | White card with red left accent |
| WARNING | `border-l-amber-500` | `ring-amber-400` | White card with amber left accent |
| WATCH | `border-l-yellow-500` | `ring-yellow-400` | White card with yellow left accent |
| EXCESS | `border-l-blue-500` | `ring-blue-400` | White card with blue left accent |

No trend data is passed to these SummaryCards (the alert count is a snapshot, not a time-series metric). No target is shown.

---

### 3.3 AlertCard

An individual alert card displaying all alert details with severity color-coding, actionable elements, and the stock-out timeline.

**File:** `components/alerts/AlertCard.tsx`

**Props:**

```typescript
import { Alert, SKU, InventoryPosition, AlertLevel } from '@/lib/types';

interface AlertCardProps {
  /** The alert to render */
  alert: Alert;
  /** The SKU this alert pertains to (enrichment data) */
  sku: SKU;
  /** Current inventory position for this SKU */
  inventory: InventoryPosition;
  /** Callback when the user clicks "Acknowledge" */
  onAcknowledge: () => void;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

The card is a bordered container with a colored top border matching the alert severity. Internal layout is vertical (stacked sections).

```
<div className={`
  bg-white rounded-xl border border-slate-200 overflow-hidden
  ${SEVERITY_TOP_BORDER[alert.alertLevel]}
  ${className ?? ''}
`}>
```

**Severity Top Border Classes:**

| Level | Class |
|---|---|
| CRITICAL | `border-t-4 border-t-red-500` |
| WARNING | `border-t-4 border-t-amber-500` |
| WATCH | `border-t-4 border-t-yellow-500` |
| EXCESS | `border-t-4 border-t-blue-500` |

**Card Sections (top to bottom):**

**Section 1 — Header Row:**

```
<div className="flex items-center justify-between px-5 pt-4 pb-2">
  <AlertSeverityBadge level={alert.alertLevel} />
  <span className="text-xs text-slate-400">
    {formatRelativeTime(alert.createdAt)}
  </span>
</div>
```

`formatRelativeTime` renders timestamps as relative strings: "2 hours ago", "3 days ago", etc. Implemented as a simple utility in `lib/formatters.ts`.

**Section 2 — SKU Identification:**

```
<div className="px-5 pb-3">
  <Link to={`/sku/${alert.skuId}`}
    className="text-sm font-semibold text-navy-600 hover:text-navy-800 hover:underline">
    {sku.partNumber}
  </Link>
  <p className="text-sm text-slate-600 mt-0.5">{sku.description}</p>
</div>
```

The part number is a clickable link that navigates to `/sku/:id` (SKU Detail page) via React Router `<Link>`.

**Section 3 — Trigger Condition:**

```
<div className="px-5 pb-3">
  <p className="text-sm text-slate-700">{alert.triggerCondition}</p>
</div>
```

**Section 4 — Days to Stockout (conditional):**

Rendered only when `alert.daysToStockout` is not null (i.e., not for EXCESS alerts).

```
<div className="px-5 pb-3">
  <DaysOfSupplyIndicator days={alert.daysToStockout} />
</div>
```

**Section 5 — Stock-Out Timeline (conditional):**

Rendered only when `alert.daysToStockout` is not null.

```
<div className="px-5 pb-3">
  <StockOutTimeline
    daysToStockout={alert.daysToStockout}
    leadTimeDays={getLeadTimeForSource(sku.sourceNode)}
    alertLevel={alert.alertLevel}
  />
</div>
```

**Section 6 — Recommended Action:**

```
<div className="px-5 pb-3">
  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
    Recommended Action
  </p>
  <p className="text-sm text-slate-800">{alert.recommendedAction}</p>
</div>
```

**Section 7 — Delay Action Panel (conditional):**

Rendered only for alerts that represent in-transit shipment delays (identified by `alert.triggerCondition` containing "In-transit shipment delayed" or equivalent pattern). In the mock data, this is `ALT-005`.

```
<DelayActionPanel
  alert={alert}
  sku={sku}
/>
```

**Section 8 — Footer (Acknowledge + Status):**

```
<div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
  {alert.acknowledgedAt ? (
    <span className="text-xs text-success-500 flex items-center gap-1">
      <Check className="h-3.5 w-3.5" />
      Acknowledged {formatRelativeTime(alert.acknowledgedAt)}
    </span>
  ) : (
    <button
      onClick={onAcknowledge}
      className="text-xs font-medium text-navy-600 hover:text-navy-800 flex items-center gap-1"
    >
      <CheckCircle className="h-3.5 w-3.5" />
      Acknowledge
    </button>
  )}
</div>
```

Icons: `Check`, `CheckCircle` from `lucide-react`.

When the alert has already been acknowledged, the button is replaced with a confirmation message showing the acknowledge timestamp. The acknowledge button calls `onAcknowledge` which opens the `AcknowledgeModal` in the parent page.

---

### 3.4 StockOutTimeline

A horizontal timeline visualization showing the time relationship between today, the projected stock-out date, and the lead time required to receive new inventory. This makes it visually obvious whether there is still time to place an order.

**File:** `components/alerts/StockOutTimeline.tsx`

**Props:**

```typescript
import { AlertLevel } from '@/lib/types';

interface StockOutTimelineProps {
  /** Days until projected stock-out */
  daysToStockout: number;
  /** Lead time in days for the primary source of this SKU */
  leadTimeDays: number;
  /** Alert level — drives color of the timeline bar */
  alertLevel: AlertLevel;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Lead Time Lookup:**

The lead time per source node is derived from the Kernel §5.4 ranges:

```typescript
function getLeadTimeForSource(source: SourceNode): number {
  switch (source) {
    case SourceNode.SCHECO_SHANGHAI: return 65; // midpoint of 45-90
    case SourceNode.NIXA_MO: return 10;         // midpoint of 5-15
    case SourceNode.SHARK_NZ: return 45;         // midpoint of 30-60
  }
}
```

This helper lives in `hooks/useAlerts.ts` and is passed as a prop to each `AlertCard` -> `StockOutTimeline`.

**Visual Layout:**

The timeline is a horizontal bar chart showing two overlapping segments on a single axis. The total axis length represents `max(daysToStockout, leadTimeDays) * 1.2` (padded 20% beyond the larger value) to keep both markers visible.

```
<div className={`${className ?? ''}`}>
  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
    Stock-Out Timeline
  </p>

  {/* Timeline bar */}
  <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
    {/* Stock-out marker: filled bar from left to the stock-out point */}
    <div
      className={`absolute inset-y-0 left-0 rounded-full ${stockoutBarColor}`}
      style={{ width: `${stockoutPercent}%` }}
    />
    {/* Lead time marker: vertical dashed line */}
    <div
      className="absolute inset-y-0 w-0.5 border-l-2 border-dashed border-slate-600"
      style={{ left: `${leadTimePercent}%` }}
    />
  </div>

  {/* Labels below the bar */}
  <div className="flex justify-between mt-1.5">
    <span className="text-xs text-slate-500">Today</span>
    <div className="flex gap-4 text-xs">
      <span className={stockoutTextColor}>
        Stock-out: {daysToStockout}d
      </span>
      <span className="text-slate-500">
        Lead time: {leadTimeDays}d
      </span>
    </div>
  </div>

  {/* Verdict label */}
  <p className={`text-xs font-medium mt-1 ${verdictColor}`}>
    {verdict}
  </p>
</div>
```

**Verdict Logic:**

| Condition | Verdict Text | Color |
|---|---|---|
| `daysToStockout < leadTimeDays` | "Too late to order — stock-out before delivery" | `text-danger-500` |
| `daysToStockout >= leadTimeDays && daysToStockout < leadTimeDays * 1.5` | "Order now — tight window" | `text-amber-600` |
| `daysToStockout >= leadTimeDays * 1.5` | "Time to order — lead time covered" | `text-success-500` |

**Bar Color:**

| Alert Level | Bar Color |
|---|---|
| CRITICAL | `bg-red-400` |
| WARNING | `bg-amber-400` |
| WATCH | `bg-yellow-300` |
| EXCESS | (not rendered — timeline is hidden for EXCESS) |

---

### 3.5 AcknowledgeModal

A small modal that appears when a buyer clicks "Acknowledge" on an alert card. Contains an optional note field and confirms the acknowledgment.

**File:** `components/alerts/AcknowledgeModal.tsx`

**Props:**

```typescript
import { Alert, SKU } from '@/lib/types';

interface AcknowledgeModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The alert being acknowledged. Null when modal is closed. */
  alert: Alert | null;
  /** The SKU associated with the alert. Null when modal is closed. */
  sku: SKU | null;
  /** Callback when the user confirms acknowledgment */
  onConfirm: (alertId: string, note: string) => void;
}
```

**Internal State:**

```typescript
const [note, setNote] = useState('');
```

The note is reset to empty string whenever the modal opens (via `useEffect` on `open`).

**Visual Layout:**

Uses the `Modal` common component (Spec 05 §3.13) with `size="sm"`:

```tsx
<Modal
  open={open}
  onClose={onClose}
  title="Acknowledge Alert"
  size="sm"
  footer={
    <>
      <button onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button onClick={handleConfirm}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600">
        Acknowledge
      </button>
    </>
  }
>
  {alert && sku && (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertSeverityBadge level={alert.alertLevel} />
        <span className="text-sm font-medium text-slate-900">{sku.partNumber}</span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{alert.triggerCondition}</p>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Note (optional)
      </label>
      <textarea
        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
        rows={3}
        placeholder="Add a note about actions taken or rationale..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  )}
</Modal>
```

**Behavior:**

- Clicking "Acknowledge" calls `onConfirm(alert.alertId, note)`.
- The parent page (`AlertsDashboardPage`) handles updating the alert's `acknowledgedAt` field to the current ISO timestamp via the `useAlerts` hook.
- After confirmation, the modal closes and the alert card updates to show the acknowledged state.
- The note is stored in local demo state only (no persistence across page reloads).

---

### 3.6 DelayActionPanel

A specialized action panel rendered inside alert cards for in-transit shipment delay alerts (SRD §5.3.3). Displays three action buttons with contextual details.

**File:** `components/alerts/DelayActionPanel.tsx`

**Props:**

```typescript
import { Alert, SKU } from '@/lib/types';

interface DelayActionPanelProps {
  /** The delay alert */
  alert: Alert;
  /** The affected SKU */
  sku: SKU;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Layout:**

```
<div className={`px-5 pb-4 ${className ?? ''}`}>
  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
    Delay Response Options
  </p>
  <div className="flex flex-col gap-2">

    {/* Option 1: Expedite via Air Freight */}
    <button className="
      flex items-center justify-between
      w-full px-3 py-2.5
      text-sm text-left
      bg-amber-50 border border-amber-200 rounded-lg
      hover:bg-amber-100 transition-colors
    ">
      <span className="flex items-center gap-2">
        <Plane className="h-4 w-4 text-amber-600" />
        <span className="font-medium text-amber-800">Expedite via Air Freight</span>
      </span>
      <span className="text-xs text-amber-600">+$2.40/unit est.</span>
    </button>

    {/* Option 2: Emergency Domestic PO (shown only if SKU is dual-source eligible) */}
    <button className="
      flex items-center justify-between
      w-full px-3 py-2.5
      text-sm text-left
      bg-emerald-50 border border-emerald-200 rounded-lg
      hover:bg-emerald-100 transition-colors
    ">
      <span className="flex items-center gap-2">
        <Factory className="h-4 w-4 text-emerald-600" />
        <span className="font-medium text-emerald-800">Place Emergency Domestic PO</span>
      </span>
      <span className="text-xs text-emerald-600">Nixa MO — 10 day lead</span>
    </button>

    {/* Option 3: Communicate Delay to Customer */}
    <button className="
      flex items-center justify-between
      w-full px-3 py-2.5
      text-sm text-left
      bg-blue-50 border border-blue-200 rounded-lg
      hover:bg-blue-100 transition-colors
    ">
      <span className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-800">Communicate Delay to Customer</span>
      </span>
      <span className="text-xs text-blue-600">3 affected orders</span>
    </button>

  </div>
</div>
```

Icons: `Plane`, `Factory`, `Mail` from `lucide-react`.

**Behavior:**

- All three buttons are interactive in the demo. Clicking any button shows a brief toast-style confirmation (e.g., "Air freight expedite requested" rendered as a temporary `<div>` that auto-dismisses after 2 seconds) or toggles the button to a "Requested" disabled state with a checkmark icon.
- **Option 2 (Emergency Domestic PO)** is only rendered when the SKU has a dual-source or reshoring recommendation. For the demo, show it for any SCHECO-sourced SKU (these could theoretically be produced at Nixa).
- **Option 3 (Communicate Delay)** shows the count of affected orders. In the demo, this is a hardcoded value from the alert's context (e.g., "3 affected orders" for ALT-005).
- The cost estimate on Option 1 is derived from the alert's recommended action text. For ALT-005, this is "+$2.40/unit".

**Delay Alert Identification:**

A helper function determines whether an alert is a delay alert:

```typescript
function isDelayAlert(alert: Alert): boolean {
  return alert.triggerCondition.toLowerCase().includes('in-transit shipment delayed');
}
```

This is used by `AlertCard` to conditionally render the `DelayActionPanel`.

---

### 3.7 useAlerts Hook

Manages alert data, filtering, counting, and local acknowledge state.

**File:** `hooks/useAlerts.ts`

**Return Type:**

```typescript
interface UseAlertsReturn {
  /** All alerts with local acknowledge state applied */
  alerts: Alert[];
  /** Count of alerts per severity level */
  severityCounts: Record<AlertLevel, number>;
  /** Total unacknowledged alert count (for notification badge) */
  unacknowledgedCount: number;
  /** Acknowledge an alert by ID with optional note */
  acknowledgeAlert: (alertId: string, note: string) => void;
  /** Look up a SKU by skuId */
  skuLookup: Record<string, SKU>;
  /** Look up an inventory position by skuId */
  inventoryLookup: Record<string, InventoryPosition>;
}
```

**Implementation:**

```typescript
export function useAlerts(): UseAlertsReturn {
  // MOCK: Replace with API call
  const [alerts, setAlerts] = useState<Alert[]>([...MOCK_ALERTS]);

  const skuLookup = useMemo(() =>
    Object.fromEntries(MOCK_SKUS.map(s => [s.skuId, s])),
    []
  );

  const inventoryLookup = useMemo(() =>
    Object.fromEntries(MOCK_INVENTORY.map(i => [i.skuId, i])),
    []
  );

  const severityCounts = useMemo(() => {
    const counts: Record<AlertLevel, number> = {
      [AlertLevel.CRITICAL]: 0,
      [AlertLevel.WARNING]: 0,
      [AlertLevel.WATCH]: 0,
      [AlertLevel.EXCESS]: 0,
    };
    alerts.forEach(a => counts[a.alertLevel]++);
    return counts;
  }, [alerts]);

  const unacknowledgedCount = useMemo(() =>
    alerts.filter(a => a.acknowledgedAt === null).length,
    [alerts]
  );

  const acknowledgeAlert = useCallback((alertId: string, _note: string) => {
    setAlerts(prev => prev.map(a =>
      a.alertId === alertId
        ? { ...a, acknowledgedAt: new Date().toISOString() }
        : a
    ));
  }, []);

  return { alerts, severityCounts, unacknowledgedCount, acknowledgeAlert, skuLookup, inventoryLookup };
}
```

Placeholder markers:
- `// MOCK:` on the initial data load — replace with API call in production.
- `// API_PLACEHOLDER:` on `acknowledgeAlert` — replace with backend mutation.

---

## 4. Severity Filter Bar Configuration

The `FilterBar` (Spec 05 §3.8) is configured with alert severity options and counts:

```tsx
<FilterBar<AlertLevel>
  label="Severity"
  showAll={true}
  options={[
    {
      value: AlertLevel.CRITICAL,
      label: 'Critical',
      activeColorClass: 'bg-red-100 text-red-800 border-red-300',
      count: severityCounts.CRITICAL,
    },
    {
      value: AlertLevel.WARNING,
      label: 'Warning',
      activeColorClass: 'bg-amber-100 text-amber-800 border-amber-300',
      count: severityCounts.WARNING,
    },
    {
      value: AlertLevel.WATCH,
      label: 'Watch',
      activeColorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      count: severityCounts.WATCH,
    },
    {
      value: AlertLevel.EXCESS,
      label: 'Excess',
      activeColorClass: 'bg-blue-100 text-blue-800 border-blue-300',
      count: severityCounts.EXCESS,
    },
  ]}
  selected={selectedLevels}
  onChange={setSelectedLevels}
/>
```

Multi-select behavior per Spec 05: clicking a severity toggles it. Clicking "All" clears the selection, showing all alerts. The count badge on each button reflects the total alerts at that severity level (not the currently visible count after filtering).

---

## 5. Sorting Specification

Default sort order is applied automatically — no user-interactive sort controls are exposed on this page (sorting is implicit, driven by urgency).

**Primary sort:** Alert severity, in order: CRITICAL (0) > WARNING (1) > WATCH (2) > EXCESS (3).

**Secondary sort (within same severity):** `daysToStockout` ascending. Alerts with fewer days remaining appear first. EXCESS alerts (`daysToStockout: null`) sort last.

**Tertiary sort (tiebreaker):** `createdAt` descending. Newer alerts appear first when severity and days-to-stockout are equal.

---

## 6. Data Wiring

### 6.1 Mock Data Consumed

| Import | Source File | Purpose |
|--------|------------|---------|
| `MOCK_ALERTS` | `data/alerts.ts` | 10 alert records |
| `MOCK_SKUS` | `data/skus.ts` | SKU enrichment (partNumber, description, sourceNode) |
| `MOCK_INVENTORY` | `data/inventory.ts` | Inventory positions (onHand, daysOfSupply) |

### 6.2 Alert-to-SKU Enrichment

Each `Alert` contains only a `skuId`. The page enriches each alert card with:

- **Part number and description** from the matching `SKU` record.
- **Source node** from the matching `SKU` record (used to derive lead time for the `StockOutTimeline`).
- **Inventory position** from the matching `InventoryPosition` record.

The lookups are built as `Record<string, T>` maps in the `useAlerts` hook for O(1) access.

### 6.3 Expected Alert Distribution (from Spec 04 §9)

| Severity | Count | Alert IDs |
|----------|-------|-----------|
| CRITICAL | 2 | ALT-001, ALT-002 |
| WARNING | 3 | ALT-003, ALT-004, ALT-005 |
| WATCH | 3 | ALT-006, ALT-007, ALT-008 |
| EXCESS | 2 | ALT-009, ALT-010 |

ALT-005 is the predictive delay alert (in-transit shipment delay for `W1040623`).

---

## 7. Placeholder Markers

The following markers must appear in the source code at the indicated locations:

| Marker | File | Location |
|--------|------|----------|
| `// MOCK: Replace with real-time alert API` | `useAlerts.ts` | Initial data load |
| `// API_PLACEHOLDER: POST /api/alerts/:id/acknowledge` | `useAlerts.ts` | `acknowledgeAlert` function |
| `// WEBSOCKET_PLACEHOLDER: Subscribe to real-time alert stream` | `useAlerts.ts` | After initial load |
| `// API_PLACEHOLDER: POST /api/alerts/:id/expedite` | `DelayActionPanel.tsx` | Air freight button handler |
| `// API_PLACEHOLDER: POST /api/purchase-orders/emergency` | `DelayActionPanel.tsx` | Emergency PO button handler |
| `// API_PLACEHOLDER: POST /api/notifications/delay` | `DelayActionPanel.tsx` | Customer communication handler |

---

## 8. Barrel Exports

### 8.1 `components/alerts/index.ts`

```typescript
export { AlertCard } from './AlertCard';
export { AlertSeveritySummary } from './AlertSeveritySummary';
export { StockOutTimeline } from './StockOutTimeline';
export { AcknowledgeModal } from './AcknowledgeModal';
export { DelayActionPanel } from './DelayActionPanel';
```

### 8.2 `pages/Alerts/index.ts`

```typescript
export { AlertsDashboardPage } from './AlertsDashboardPage';
```

---

## 9. Utility: `formatRelativeTime`

**File:** `lib/formatters.ts` (add to existing file or create if not present)

```typescript
/**
 * Formats an ISO 8601 timestamp as a human-readable relative time string.
 * Examples: "2 hours ago", "3 days ago", "Just now"
 */
export function formatRelativeTime(isoTimestamp: string): string {
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

---

## 10. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | Page renders at route `/alerts` with the title "Alerts Dashboard" in the PageHeader | Navigate to `/alerts`; verify title |
| AC-2 | Four SummaryCards display at the top showing counts: Critical (2), Warning (3), Watch (3), Excess (2) — matching MOCK_ALERTS distribution | Visual inspection of summary row |
| AC-3 | Each SummaryCard has a colored left border matching Kernel §7.2 severity colors (red, amber, yellow, blue) | Visual color comparison |
| AC-4 | FilterBar renders 5 toggle buttons: All, Critical, Warning, Watch, Excess. "All" is active by default. Each severity button shows a count badge | Visual inspection |
| AC-5 | Clicking a severity filter button shows only alerts of that level. Clicking "All" restores full list. Multi-select works: clicking Critical + Warning shows 5 alerts | Click each filter combination; verify visible cards |
| AC-6 | Alert cards display in a responsive grid: 3 columns at >= 1280px, 2 columns at 768-1279px, 1 column below 768px | Resize browser; verify column count at each breakpoint |
| AC-7 | Default sort order is CRITICAL first (ALT-001 at 4d, ALT-002 at 3d — ALT-002 appears before ALT-001), then WARNING, then WATCH, then EXCESS last | Verify card order without any filter applied |
| AC-8 | Each AlertCard shows: severity badge, clickable part number (navy link), description, trigger condition text, days-of-supply indicator (colored bar), recommended action, and relative created date | Inspect any alert card for all elements |
| AC-9 | Clicking a part number link on any AlertCard navigates to `/sku/:id` | Click part number on ALT-001; verify navigation to `/sku/1100031-1` |
| AC-10 | StockOutTimeline renders on non-EXCESS alerts showing a horizontal bar with stock-out marker and lead-time dashed line. Verdict text reads "Too late to order" for CRITICAL alerts where daysToStockout < leadTimeDays | Inspect ALT-001 (4 days to stockout, Nixa lead time 10 days): should show "Too late" |
| AC-11 | StockOutTimeline is NOT rendered on EXCESS alerts (ALT-009, ALT-010) | Verify EXCESS cards have no timeline |
| AC-12 | Clicking "Acknowledge" on an unacknowledged alert opens the AcknowledgeModal with the alert's severity badge, part number, and trigger condition | Click Acknowledge on ALT-001; verify modal contents |
| AC-13 | AcknowledgeModal contains a textarea for optional note entry and Cancel/Acknowledge buttons | Visual inspection of modal |
| AC-14 | Clicking "Acknowledge" in the modal updates the alert card to show "Acknowledged" with a checkmark icon and timestamp. The Acknowledge button is replaced with acknowledged state text | Acknowledge ALT-001; verify card footer updates |
| AC-15 | Acknowledged alerts remain visible (not removed from the grid) but show their acknowledged state | Acknowledge an alert; verify it remains in the grid |
| AC-16 | ALT-005 (in-transit delay for W1040623) renders the DelayActionPanel with three action buttons: "Expedite via Air Freight" (+$2.40/unit), "Place Emergency Domestic PO" (Nixa MO), "Communicate Delay to Customer" (3 affected orders) | Inspect ALT-005 card for all three buttons |
| AC-17 | Clicking a delay action button toggles it to a "Requested" disabled state with a checkmark | Click "Expedite via Air Freight" on ALT-005; verify button state change |
| AC-18 | Non-delay alerts (all alerts except ALT-005) do NOT render the DelayActionPanel | Inspect ALT-001, ALT-003, ALT-009; verify no delay action buttons |
| AC-19 | EmptyState renders when all alerts are filtered out (e.g., if a severity level with zero alerts existed or if all are acknowledged and a hypothetical "unacknowledged only" filter were applied). In current mock data, this can be verified by future-proofing: the component handles empty arrays gracefully | Filter to a combination yielding zero results (not possible with current data — verify component code handles `sortedAlerts.length === 0`) |
| AC-20 | Severity count badges on FilterBar buttons match the total alert count per level, not the filtered count | Filter to CRITICAL only; verify WARNING button still shows count "3" |
| AC-21 | All source code files include the required placeholder markers from Section 7 | Grep for `// MOCK:`, `// API_PLACEHOLDER:`, `// WEBSOCKET_PLACEHOLDER:` |
| AC-22 | All components compile cleanly under `tsc --strict --noEmit` with no `any` types | TypeScript compilation check |
| AC-23 | Severity summary cards are clickable with `cursor-pointer` and hover shadow effect | Hover over each card; verify cursor and shadow |
| AC-24 | Clicking a severity summary card (e.g., "Critical") filters the alert grid to show only that severity level | Click "Critical" card; verify only CRITICAL alerts shown |
| AC-25 | Clicking the already-active severity card clears the filter (toggle behavior), restoring all alerts | Click "Critical" again; verify all alerts return |
| AC-26 | The active severity card shows a `ring-2` highlight in its severity color | Click "Warning" card; verify amber ring appears |
| AC-27 | URL query parameter `?severity=CRITICAL` pre-applies the severity filter on page load (supports drill-down from other pages) | Navigate to `/alerts?severity=CRITICAL`; verify only CRITICAL alerts shown and Critical card highlighted |

---

## 11. Out of Scope

- **Real-time alert streaming** — the demo uses static mock data. WebSocket integration is marked with `// WEBSOCKET_PLACEHOLDER:`.
- **Alert creation/deletion** — alerts are read-only (acknowledge is the only mutation).
- **Sound/desktop notifications** — the notification bell badge in the top bar (Kernel §7.1) shows the unacknowledged count but no audio or browser notifications.
- **Alert history/archive** — no paginated history view. Only the current 10 active alerts are shown.
- **Email/SMS notification delivery** — the "Communicate Delay to Customer" action is simulated locally.
- **Bulk acknowledge** — only individual alert acknowledgment is supported.
- **Dark mode** — per Spec 05 §7 exclusion list.
