# Spec 09 — SKU Detail Page

**Status:** Draft
**Route:** `/sku/:id`
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data), Spec 05 (Common Components), Spec 06 (Chart Components)
**Kernel refs:** §4.3 (SKU Detail), §2.2 (Project Structure — `pages/SkuDetail/`, `components/sku/`)
**SRD refs:** §1.1 (demand classification), §1.1.2 (model registry), §1.3 (pandemic-era flagging), §1.4 (forecast output), §2.1 (safety stock, min/max), §2.2 (lead-time segments), §5.3 (alerts)

---

## 1. Overview

The SKU Detail page is the deep-dive view for a single part number. It consolidates every data dimension for a SKU into one screen: demand history, probabilistic forecast, classification metadata, inventory position, planning parameters, lead-time breakdown, alert history, and model registry. This is where a buyer goes from the Action Center or Alerts page to understand the full picture before making a decision.

---

## 2. File Structure

```
frontend/src/
  pages/
    SkuDetail/
      SkuDetailPage.tsx          # Top-level route component — data assembly + layout
      SkuHeader.tsx              # Part number, description, badges, back link
      DemandSection.tsx          # DemandHistoryChart wrapper with section title
      ForecastSection.tsx        # ForecastChart wrapper with section title
      ClassificationPanel.tsx    # Demand class metadata card
      InventoryCard.tsx          # Inventory position + InventoryGauge
      ParameterEditPanel.tsx     # Min/max inline editing + change history
      LeadTimeBreakdown.tsx      # StackedBarChart wrapper for 6 segments
      AlertHistoryTable.tsx      # Recent alerts table for this SKU
      ModelRegistryPanel.tsx     # Active model metadata card
      index.ts                   # Barrel re-export of SkuDetailPage
```

---

## 3. Route & Data Loading

**Route:** `/sku/:id` where `:id` is the `skuId` (same as `partNumber`).

**Data Assembly:** `SkuDetailPage` reads the `:id` param from the URL and looks up all related mock data:

```typescript
// MOCK: Replace with API calls in production
const sku = MOCK_SKUS.find(s => s.skuId === id);
const demandHistory = MOCK_DEMAND_HISTORY.filter(d => d.skuId === id);
const forecasts = MOCK_FORECASTS.filter(f => f.skuId === id);
const classification = MOCK_CLASSIFICATIONS.find(c => c.skuId === id);
const inventoryPosition = MOCK_INVENTORY.find(i => i.skuId === id);
const safetyStock = MOCK_SAFETY_STOCK.find(s => s.skuId === id);
const parameters = MOCK_INVENTORY_PARAMETERS.find(p => p.skuId === id);
const alerts = MOCK_ALERTS.filter(a => a.skuId === id);
const leadTimeSegments = MOCK_LEAD_TIMES[id] ?? [];
```

If no SKU is found for the given `:id`, render an `EmptyState` with message "SKU not found" and a link back to the Action Center.

**Hash Fragment: `#inventory`**

The page reads `location.hash` on mount via React Router's `useLocation()`. When the hash is `#inventory`, the page scrolls the Inventory Position and Parameter Edit Panel sections into view after the initial render.

**Implementation:**
- Create `const inventoryRef = useRef<HTMLDivElement>(null)` 
- Wrap the Inventory Position card and Parameter Edit Panel in a `<div ref={inventoryRef}>`
- Add a `useEffect` that fires on mount:
  ```typescript
  useEffect(() => {
    if (location.hash === '#inventory') {
      // Delay to allow DOM to render
      requestAnimationFrame(() => {
        inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash]);
  ```

This supports the `REVIEW_MIN_VIOLATION` action type navigation from the Action Center worklist (Spec 16 §3.2).

---

## 4. Page Layout

### 4.1 Wide Screens (>= 1280px / `xl` breakpoint)

Two-column grid layout. Charts occupy the left column (wider), data panels occupy the right column (narrower).

```
+-------------------------------------------------------+
| SkuHeader (full width)                                 |
+-------------------------------+-----------------------+
| DemandSection                 | ClassificationPanel   |
|                               +-----------------------+
|                               | InventoryCard         |
+-------------------------------+                       |
| ForecastSection               |                       |
|                               +-----------------------+
|                               | ParameterEditPanel    |
+-------------------------------+                       |
| LeadTimeBreakdown             |                       |
+-------------------------------+-----------------------+
| AlertHistoryTable (full width)                         |
+-------------------------------------------------------+
| ModelRegistryPanel (full width)                        |
+-------------------------------------------------------+
```

### 4.2 Narrow Screens (< 1280px)

Single-column stack. Order: Header, DemandSection, ClassificationPanel, ForecastSection, InventoryCard, ParameterEditPanel, LeadTimeBreakdown, AlertHistoryTable, ModelRegistryPanel.

### 4.3 Container Structure

```tsx
<div className="space-y-6">
  {/* Header — full width */}
  <SkuHeader sku={sku} />

  {/* Two-column grid */}
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    {/* Left column — charts (2/3 width) */}
    <div className="xl:col-span-2 space-y-6">
      <DemandSection history={demandHistory} />
      <ForecastSection history={demandHistory} forecasts={forecasts} />
      <LeadTimeBreakdown segments={leadTimeSegments} sourceNode={sku.sourceNode} />
    </div>

    {/* Right column — data panels (1/3 width) */}
    <div className="space-y-6">
      <ClassificationPanel classification={classification} />
      <InventoryCard
        position={inventoryPosition}
        safetyStock={safetyStock}
        parameters={parameters}
      />
      <ParameterEditPanel
        parameters={parameters}
        skuId={sku.skuId}
      />
    </div>
  </div>

  {/* Full-width bottom sections */}
  <AlertHistoryTable alerts={alerts} />
  <ModelRegistryPanel classification={classification} skuId={sku.skuId} />
</div>
```

---

## 5. Component Specifications

### 5.1 SkuHeader

The top banner showing part identity and navigation.

**File:** `pages/SkuDetail/SkuHeader.tsx`

**Props:**

```typescript
import type { SKU } from '@/lib/types';

interface SkuHeaderProps {
  sku: SKU;
}
```

**Rendered Structure:**

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  {/* Left side */}
  <div className="space-y-1">
    {/* Back link */}
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to list
    </button>

    {/* Part number + description */}
    <h1 className="text-2xl font-semibold text-slate-900">
      {sku.partNumber}
    </h1>
    <p className="text-sm text-slate-600">{sku.description}</p>
  </div>

  {/* Right side — badges */}
  <div className="flex flex-wrap items-center gap-2">
    <StatusBadge label={sku.productLine} bgColor="bg-slate-100" textColor="text-slate-700" />
    <StatusBadge label={formatDemandClass(sku.demandClass)} {...demandClassColors(sku.demandClass)} />
    <SourceNodeBadge source={sku.sourceNode} />
    <StatusBadge
      label={sku.isActive ? 'Active' : 'Inactive'}
      bgColor={sku.isActive ? 'bg-green-100' : 'bg-slate-100'}
      textColor={sku.isActive ? 'text-green-800' : 'text-slate-500'}
    />
  </div>
</div>
```

**Demand Class Display Labels:**

```typescript
const DEMAND_CLASS_LABELS: Record<DemandClass, string> = {
  SMOOTH_FAST: 'Smooth / Fast',
  ERRATIC_HIGH_VARIANCE: 'Erratic / High Variance',
  INTERMITTENT_LUMPY: 'Intermittent / Lumpy',
  NEW_COLD_START: 'New / Cold Start',
  DEFENSE_CONTRACT: 'Defense / Contract',
};

const DEMAND_CLASS_BADGE_COLORS: Record<DemandClass, { bgColor: string; textColor: string }> = {
  SMOOTH_FAST:           { bgColor: 'bg-teal-100',   textColor: 'text-teal-800' },
  ERRATIC_HIGH_VARIANCE: { bgColor: 'bg-amber-100',  textColor: 'text-amber-800' },
  INTERMITTENT_LUMPY:    { bgColor: 'bg-red-100',    textColor: 'text-red-800' },
  NEW_COLD_START:        { bgColor: 'bg-violet-100', textColor: 'text-violet-800' },
  DEFENSE_CONTRACT:      { bgColor: 'bg-cyan-100',   textColor: 'text-cyan-800' },
};
```

**Icons:** `ArrowLeft` from `lucide-react`.

**Behavior:**
- "Back to list" navigates via `useNavigate()` from React Router. Calls `navigate(-1)` to go back to the previous page (typically Action Center or Alerts).
- All badges use the common `StatusBadge` and `SourceNodeBadge` from Spec 05.

---

### 5.2 DemandSection

A section card wrapping the `DemandHistoryChart` (Spec 06 Section 4.2).

**File:** `pages/SkuDetail/DemandSection.tsx`

**Props:**

```typescript
import type { DemandHistory, DateString } from '@/lib/types';

interface DemandSectionProps {
  history: DemandHistory[];
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-4">Demand History</h2>
  <p className="text-sm text-slate-500 mb-4">
    Trailing 24 months of monthly demand. Amber dots indicate pandemic-era flagged periods.
  </p>
  <DemandHistoryChart
    data={history}
    anomalyPeriods={computeAnomalyPeriods(history)}
    pandemicRange={[toDateString('2024-04'), toDateString('2024-06')]}
    height={300}
  />
</div>
```

**Anomaly Detection Logic:**

The component computes anomaly periods from the demand history. For the demo, flag periods where the quantity deviates by more than 2 standard deviations from the trailing 6-month average:

```typescript
function computeAnomalyPeriods(history: DemandHistory[]): DateString[] {
  // Simplified anomaly detection for demo
  // In production, these come from the pandemic_anomaly_registry (SRD §1.3.1)
  const quantities = history.map(h => h.quantity);
  const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
  const std = Math.sqrt(quantities.reduce((a, b) => a + (b - mean) ** 2, 0) / quantities.length);
  return history
    .filter(h => Math.abs(h.quantity - mean) > 2 * std)
    .map(h => h.period);
}
```

**Pandemic Range:** For the demo's 24-month window (2024-04 through 2026-03), pandemic-era data is not present. The `pandemicRange` prop should only be set if the history data actually spans those dates. The component conditionally passes it:

```typescript
const hasPandemicData = history.some(h => h.period < toDateString('2024-01'));
// Only pass pandemicRange if data reaches back far enough
```

---

### 5.3 ForecastSection

A section card wrapping the `ForecastChart` (Spec 06 Section 4.1).

**File:** `pages/SkuDetail/ForecastSection.tsx`

**Props:**

```typescript
import type { DemandHistory, Forecast } from '@/lib/types';

interface ForecastSectionProps {
  history: DemandHistory[];
  forecasts: Forecast[];
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-slate-900">Forecast</h2>
    {forecasts.length > 0 && (
      <StatusBadge
        label={forecasts[0].algorithm}
        bgColor="bg-navy-100"
        textColor="text-navy-800"
      />
    )}
  </div>
  <p className="text-sm text-slate-500 mb-4">
    P50 median forecast with 80% (P10/P90) and 95% (P2.5/P97.5) prediction intervals.
    Historical demand overlaid in green.
  </p>
  <ForecastChart
    history={history}
    forecasts={forecasts}
    height={400}
  />
</div>
```

**Behavior:**
- Displays the active algorithm name as a badge in the section header (read from the first forecast record).
- The ForecastChart handles data merging, prediction interval rendering, and historical overlay per Spec 06 Section 4.1.
- If no forecasts exist for this SKU (e.g., NEW_COLD_START with insufficient data), render a note: "Insufficient history for forecast generation. BSTS cold-start model will activate after 6 months of data."

---

### 5.4 ClassificationPanel

A card displaying the demand classification metadata from the `DemandClassification` entity.

**File:** `pages/SkuDetail/ClassificationPanel.tsx`

**Props:**

```typescript
import type { DemandClassification } from '@/lib/types';

interface ClassificationPanelProps {
  classification: DemandClassification | undefined;
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Classification</h3>

  {classification ? (
    <div className="space-y-4">
      {/* Demand class badge — prominent */}
      <div>
        <span className="text-xs text-slate-500 uppercase tracking-wide">Demand Class</span>
        <div className="mt-1">
          <StatusBadge
            label={DEMAND_CLASS_LABELS[classification.demandClass]}
            {...DEMAND_CLASS_BADGE_COLORS[classification.demandClass]}
          />
        </div>
      </div>

      {/* Algorithm assignments */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-slate-500">Primary Algorithm</span>
          <p className="text-sm font-medium text-slate-900 mt-0.5">
            {classification.algorithmPrimary}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Fallback Algorithm</span>
          <p className="text-sm font-medium text-slate-900 mt-0.5">
            {classification.algorithmFallback}
          </p>
        </div>
      </div>

      {/* Statistical metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-slate-500">CV of Demand</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {classification.cvDemand.toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">CV of Interval</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {classification.cvInterval.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Average demand + last classified */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-slate-500">Avg Monthly Demand</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {formatNumber(classification.avgMonthlyDemand)} units
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Last Classified</span>
          <p className="text-sm text-slate-900 mt-0.5">
            {formatDate(classification.classifiedAt)}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-slate-500">No classification data available.</p>
  )}
</div>
```

**Helpers:**
- `formatDate(iso: string)` renders ISO 8601 timestamps as "MMM DD, YYYY" (e.g., "Mar 28, 2026").
- `formatNumber` from `charts/formatters.ts`.

---

### 5.5 InventoryCard

A card showing the current inventory position with an `InventoryGauge`.

**File:** `pages/SkuDetail/InventoryCard.tsx`

**Props:**

```typescript
import type { InventoryPosition, SafetyStock, InventoryParameters } from '@/lib/types';

interface InventoryCardProps {
  position: InventoryPosition | undefined;
  safetyStock: SafetyStock | undefined;
  parameters: InventoryParameters | undefined;
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Inventory Position</h3>

  {position ? (
    <div className="space-y-4">
      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricRow label="On Hand" value={formatNumber(position.onHand)} />
        <MetricRow label="On Order" value={formatNumber(position.onOrder)} />
        <MetricRow label="Allocated" value={formatNumber(position.allocated)} />
        <MetricRow label="Available" value={formatNumber(position.available)} />
        <MetricRow label="Safety Stock" value={formatNumber(safetyStock?.safetyStockQty ?? 0)} />
        <MetricRow label="Reorder Point" value={formatNumber(safetyStock?.reorderPoint ?? 0)} />
        <MetricRow label="Days of Supply" value={`${position.daysOfSupply}`} highlight />
      </div>

      {/* Inventory Gauge */}
      <InventoryGauge
        onHand={position.onHand}
        min={parameters?.minQty ?? 0}
        safetyStock={safetyStock?.safetyStockQty ?? 0}
        reorderPoint={safetyStock?.reorderPoint ?? 0}
        max={parameters?.maxQty ?? 0}
        className="mt-2"
      />

      {/* Snapshot date */}
      <p className="text-xs text-slate-400 mt-2">
        Snapshot: {formatDate(position.snapshotDate)}
      </p>
    </div>
  ) : (
    <p className="text-sm text-slate-500">No inventory data available.</p>
  )}
</div>
```

**MetricRow Helper:**

```tsx
function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <p className={`text-sm font-mono mt-0.5 ${highlight ? 'font-semibold text-slate-900' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}
```

**Behavior:**
- The InventoryGauge renders per Spec 06 Section 4.3 with color zones (red below min, amber below ROP, green in range, blue above max).
- If parameters are `NOT_SET` (min/max are 0), the gauge still renders but shows no meaningful zones. A note appears: "Min/max parameters not configured for this SKU."
- Days of supply uses `DaysOfSupplyIndicator` color logic (< 7 red, 7-13 amber, 14-29 yellow, 30+ green) for the highlight styling.

---

### 5.6 ParameterEditPanel

Inline editable fields for min/max planning parameters with system-calculated vs. buyer-override toggle and change history.

**File:** `pages/SkuDetail/ParameterEditPanel.tsx`

**Props:**

```typescript
import type { InventoryParameters, ParameterStatus, ParameterSource } from '@/lib/types';

interface ParameterEditPanelProps {
  parameters: InventoryParameters | undefined;
  skuId: string;
}
```

**Internal State:**

```typescript
const [editState, setEditState] = useState<{
  minQty: number;
  maxQty: number;
  safetyStockQty: number;
  reorderPoint: number;
  targetCsl: number;
  leadTimeDays: number;
  source: ParameterSource;
}>({
  /* initialized from parameters prop */
});
const [isEditing, setIsEditing] = useState(false);
const [showHistory, setShowHistory] = useState(false);
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-slate-900">Planning Parameters</h3>
    <div className="flex items-center gap-2">
      <ParameterStatusBadge status={parameters?.parameterStatus ?? ParameterStatus.NOT_SET} />
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-navy-600 hover:text-navy-800 font-medium"
        >
          Edit
        </button>
      )}
    </div>
  </div>

  {/* System vs. Override toggle */}
  <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
    <span className="text-sm text-slate-600">Source:</span>
    <button
      onClick={() => handleSourceToggle('SYSTEM_AUTO')}
      className={`px-3 py-1 text-sm rounded-md ${
        editState.source === ParameterSource.SYSTEM_AUTO
          ? 'bg-blue-100 text-blue-800 font-medium'
          : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      System Calculated
    </button>
    <button
      onClick={() => handleSourceToggle('BUYER_MANUAL')}
      className={`px-3 py-1 text-sm rounded-md ${
        editState.source === ParameterSource.BUYER_MANUAL
          ? 'bg-green-100 text-green-800 font-medium'
          : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      Buyer Override
    </button>
  </div>

  {/* Editable parameter fields */}
  <div className="grid grid-cols-2 gap-4">
    <ParameterField label="Min Qty" field="minQty" value={editState.minQty} unit="units" />
    <ParameterField label="Max Qty" field="maxQty" value={editState.maxQty} unit="units" />
    <ParameterField label="Safety Stock" field="safetyStockQty" value={editState.safetyStockQty} unit="units" />
    <ParameterField label="Reorder Point" field="reorderPoint" value={editState.reorderPoint} unit="units" />
    <ParameterField label="Target CSL" field="targetCsl" value={editState.targetCsl} unit="%" />
    <ParameterField label="Lead Time" field="leadTimeDays" value={editState.leadTimeDays} unit="days" />
  </div>

  {/* Save / Cancel buttons (visible when editing) */}
  {isEditing && (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
      <button
        onClick={handleSave}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600"
      >
        Save Changes
      </button>
      <button
        onClick={handleCancel}
        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  )}

  {/* Last reviewed info */}
  {parameters?.lastReviewedAt && (
    <p className="text-xs text-slate-400 mt-3">
      Last reviewed by {parameters.reviewedBy} on {formatDate(parameters.lastReviewedAt)}
    </p>
  )}

  {/* Change history (expandable) */}
  <div className="mt-4 pt-4 border-t border-slate-200">
    <button
      onClick={() => setShowHistory(!showHistory)}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
    >
      {showHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      Change History
    </button>
    {showHistory && (
      <div className="mt-3 space-y-2">
        {/* MOCK: Static change history entries */}
        {MOCK_PARAMETER_HISTORY
          .filter(h => h.skuId === skuId)
          .map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                {formatDate(entry.changedAt)}
              </span>
              <div>
                <span className="text-slate-700">{entry.changedBy}</span>
                <span className="text-slate-500"> changed </span>
                <span className="font-medium text-slate-900">{entry.field}</span>
                <span className="text-slate-500"> from </span>
                <span className="font-mono text-danger-500">{entry.oldValue}</span>
                <span className="text-slate-500"> to </span>
                <span className="font-mono text-success-500">{entry.newValue}</span>
                <span className="text-slate-400 text-xs ml-1">({entry.source})</span>
              </div>
            </div>
          ))
        }
      </div>
    )}
  </div>
</div>
```

**ParameterField Helper:**

```tsx
function ParameterField({
  label, field, value, unit, isEditing, onChange,
}: {
  label: string;
  field: string;
  value: number;
  unit: string;
  isEditing?: boolean;
  onChange?: (field: string, value: number) => void;
}) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-1 mt-0.5">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange?.(field, Number(e.target.value))}
            className="w-full px-2 py-1 text-sm font-mono border border-slate-300 rounded-md
                       focus:ring-2 focus:ring-navy-500 focus:border-navy-500 focus:outline-none"
          />
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      ) : (
        <p className="text-sm font-mono text-slate-900 mt-0.5">
          {formatNumber(value)} <span className="text-xs text-slate-400">{unit}</span>
        </p>
      )}
    </div>
  );
}
```

**Mock Change History Shape:**

The change history is stored in mock data as:

```typescript
interface ParameterChangeRecord {
  skuId: string;
  field: string;       // e.g., "minQty", "maxQty", "targetCsl"
  oldValue: string;    // formatted display value
  newValue: string;    // formatted display value
  changedBy: string;   // e.g., "System", "jthompson"
  changedAt: string;   // ISO 8601
  source: string;      // e.g., "SYSTEM_AUTO", "BUYER_MANUAL"
}
```

**Behavior:**
- Fields are read-only by default. Clicking "Edit" enables all input fields.
- "Save Changes" updates local React state (demo mode — no persistence). The `ParameterStatus` badge updates to `BUYER_OVERRIDE` on save.
- "Cancel" reverts to the original `parameters` prop values.
- The system-calculated vs. buyer-override toggle updates the `source` field. When toggled to "System Calculated," fields show system-recommended values (from `SafetyStock` entity). When toggled to "Buyer Override," fields are editable.
- Change history is expandable/collapsible via chevron toggle. Shows 2-3 entries per SKU from mock data.

**Icons:** `ChevronDown`, `ChevronRight` from `lucide-react`.

---

### 5.7 LeadTimeBreakdown

A section card wrapping the `StackedBarChart` (Spec 06 Section 4.6) showing the 6 transpacific lead-time segments.

**File:** `pages/SkuDetail/LeadTimeBreakdown.tsx`

**Props:**

```typescript
import type { LeadTimeSegment, SourceNode } from '@/lib/types';

interface LeadTimeBreakdownProps {
  segments: LeadTimeSegment[];
  sourceNode: SourceNode;
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-2">Lead-Time Breakdown</h2>
  <p className="text-sm text-slate-500 mb-4">
    {sourceNode === SourceNode.NIXA_MO
      ? 'Domestic production lead-time segments.'
      : sourceNode === SourceNode.SHARK_NZ
        ? 'New Zealand sourcing lead-time segments.'
        : 'Transpacific lead-time: 6 segments from Shanghai to Nixa, MO.'}
  </p>

  {/* Stacked bar: Actual vs. Baseline comparison */}
  <StackedBarChart
    data={[
      {
        label: 'Baseline',
        ...Object.fromEntries(segments.map(s => [s.segmentName, s.baselineDays])),
      },
      {
        label: 'Actual',
        ...Object.fromEntries(segments.map(s => [s.segmentName, s.actualDays])),
      },
    ]}
    categoryKey="label"
    series={segments.map((s, i) => ({
      dataKey: s.segmentName,
      name: s.segmentName,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }))}
    layout="horizontal"
    height={160}
  />

  {/* Segment detail table */}
  <div className="mt-4 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wide">
          <th className="py-2 pr-4">Segment</th>
          <th className="py-2 pr-4 text-right font-mono">Baseline</th>
          <th className="py-2 pr-4 text-right font-mono">Actual</th>
          <th className="py-2 pr-4 text-right font-mono">Variance</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((seg, i) => (
          <tr key={i} className="border-b border-slate-100">
            <td className="py-2 pr-4 text-slate-900">{seg.segmentName}</td>
            <td className="py-2 pr-4 text-right font-mono text-slate-600">{seg.baselineDays}d</td>
            <td className="py-2 pr-4 text-right font-mono text-slate-900">{seg.actualDays}d</td>
            <td className={`py-2 pr-4 text-right font-mono ${
              seg.variance > 0 ? 'text-danger-500' : seg.variance < 0 ? 'text-success-500' : 'text-slate-400'
            }`}>
              {seg.variance > 0 ? '+' : ''}{seg.variance}d
            </td>
            <td className="py-2">
              <StatusBadge
                label={seg.status}
                {...pipelineStateColors(seg.status)}
              />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-slate-300 font-semibold">
          <td className="py-2 pr-4 text-slate-900">Total</td>
          <td className="py-2 pr-4 text-right font-mono text-slate-600">
            {segments.reduce((sum, s) => sum + s.baselineDays, 0)}d
          </td>
          <td className="py-2 pr-4 text-right font-mono text-slate-900">
            {segments.reduce((sum, s) => sum + s.actualDays, 0)}d
          </td>
          <td className={`py-2 pr-4 text-right font-mono ${
            totalVariance > 0 ? 'text-danger-500' : totalVariance < 0 ? 'text-success-500' : 'text-slate-400'
          }`}>
            {totalVariance > 0 ? '+' : ''}{totalVariance}d
          </td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
```

**Six Segments (SRD §2.2.1):**

| Segment Name | Description |
|---|---|
| Factory Production | SCHECO manufacturing queue + QC |
| Inland Drayage (CN) | Factory to Shanghai/Ningbo port |
| Port Dwell (Origin) | Container acceptance to vessel loading |
| Ocean Transit | Shanghai to US West Coast |
| US Port Dwell | Vessel arrival to container release |
| Inland Transit (US) | Port to Nixa, MO warehouse |

**Pipeline State Colors for Segment Status:**

```typescript
const PIPELINE_STATE_COLORS: Record<PipelineState, { bgColor: string; textColor: string }> = {
  HEALTHY:  { bgColor: 'bg-green-100',  textColor: 'text-green-800' },
  DEGRADED: { bgColor: 'bg-amber-100',  textColor: 'text-amber-800' },
  STALE:    { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  ERROR:    { bgColor: 'bg-red-100',    textColor: 'text-red-800' },
};
```

**Behavior:**
- For NIXA_MO-sourced SKUs, the transpacific segments do not apply. Show a simplified breakdown with 2-3 domestic segments (Production Queue, QC/Pack, Warehouse Transfer) or a note that the lead-time profile is domestic.
- For SHARK_NZ-sourced SKUs, show NZ-specific segments (Factory Production NZ, NZ Port Dwell, Ocean Transit NZ-US, US Port Dwell, Inland Transit US).
- Positive variance (actual > baseline) renders in red. Negative variance (actual < baseline) renders in green.

---

### 5.8 AlertHistoryTable

A table of recent alerts for this SKU using TanStack Table patterns.

**File:** `pages/SkuDetail/AlertHistoryTable.tsx`

**Props:**

```typescript
import type { Alert } from '@/lib/types';

interface AlertHistoryTableProps {
  alerts: Alert[];
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-4">Alert History</h2>

  {alerts.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wide">
            <th className="py-2 pr-4">Severity</th>
            <th className="py-2 pr-4">Trigger</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-4">Days to Stockout</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((alert) => (
              <tr key={alert.alertId} className="border-b border-slate-100">
                <td className="py-2 pr-4">
                  <AlertSeverityBadge level={alert.alertLevel} />
                </td>
                <td className="py-2 pr-4 text-slate-900 max-w-xs truncate">
                  {alert.triggerCondition}
                </td>
                <td className="py-2 pr-4 text-slate-600 font-mono text-xs">
                  {formatDate(alert.createdAt)}
                </td>
                <td className="py-2 pr-4">
                  {alert.daysToStockout !== null ? (
                    <DaysOfSupplyIndicator days={alert.daysToStockout} />
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </td>
                <td className="py-2">
                  <StatusBadge
                    label={alert.acknowledgedAt ? 'Acknowledged' : 'Open'}
                    bgColor={alert.acknowledgedAt ? 'bg-green-100' : 'bg-amber-100'}
                    textColor={alert.acknowledgedAt ? 'text-green-800' : 'text-amber-800'}
                  />
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyState
      icon="Bell"
      title="No alerts"
      description="No alerts have been generated for this SKU."
    />
  )}
</div>
```

**Columns:**

| Column | Data Source | Renderer |
|---|---|---|
| Severity | `alert.alertLevel` | `AlertSeverityBadge` (Spec 05 §3.2) |
| Trigger | `alert.triggerCondition` | Plain text, truncated at 40ch with tooltip |
| Created | `alert.createdAt` | Formatted date |
| Days to Stockout | `alert.daysToStockout` | `DaysOfSupplyIndicator` (Spec 05 §3.5); N/A for EXCESS |
| Status | `alert.acknowledgedAt` | "Acknowledged" (green) or "Open" (amber) badge |

**Behavior:**
- Alerts sorted by `createdAt` descending (most recent first).
- If no alerts exist for this SKU, render an `EmptyState` component.
- Uses `AlertSeverityBadge` and `DaysOfSupplyIndicator` from Spec 05.

---

### 5.9 ModelRegistryPanel

A card displaying the model registry metadata for this SKU (SRD REQ-1.1.2).

**File:** `pages/SkuDetail/ModelRegistryPanel.tsx`

**Props:**

```typescript
import type { DemandClassification } from '@/lib/types';

interface ModelRegistryPanelProps {
  classification: DemandClassification | undefined;
  skuId: string;
}
```

The model registry data is derived from a combination of the `DemandClassification` entity and a supplemental mock model registry object.

**Mock Model Registry Shape:**

```typescript
interface ModelRegistryEntry {
  skuId: string;
  /** Active algorithm name */
  algorithm: ForecastAlgorithm;
  /** Hyperparameters as key-value display pairs */
  hyperparameters: Record<string, string | number>;
  /** In-sample MAPE (training set) */
  inSampleMape: Percentage;
  /** Out-of-sample MAPE (rolling 8-week holdout) */
  outOfSampleMape: Percentage;
  /** AIC or equivalent information criterion score */
  aicScore: number;
  /** ISO 8601 timestamp of last model training */
  lastTrainedAt: string;
}
```

**Rendered Structure:**

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-4">Model Registry</h2>

  {registryEntry ? (
    <div className="space-y-4">
      {/* Algorithm name */}
      <div>
        <span className="text-xs text-slate-500">Active Algorithm</span>
        <p className="text-sm font-semibold text-slate-900 mt-0.5">
          {registryEntry.algorithm}
        </p>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className="text-xs text-slate-500">In-Sample MAPE</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {formatPercent(registryEntry.inSampleMape)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Out-of-Sample MAPE</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {formatPercent(registryEntry.outOfSampleMape)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">AIC Score</span>
          <p className="text-sm font-mono text-slate-900 mt-0.5">
            {registryEntry.aicScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Hyperparameters */}
      <div>
        <span className="text-xs text-slate-500">Hyperparameters</span>
        <div className="mt-1 p-3 bg-slate-50 rounded-md font-mono text-xs text-slate-700 space-y-1">
          {Object.entries(registryEntry.hyperparameters).map(([key, val]) => (
            <div key={key}>
              <span className="text-slate-500">{key}:</span>{' '}
              <span className="text-slate-900">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last trained */}
      <p className="text-xs text-slate-400">
        Last trained: {formatDate(registryEntry.lastTrainedAt)}
      </p>
    </div>
  ) : (
    <p className="text-sm text-slate-500">No model registry data available.</p>
  )}
</div>
```

**Example Hyperparameters by Algorithm:**

| Algorithm | Example Hyperparameters |
|---|---|
| SARIMA | `{ order: "(1,1,1)", seasonal_order: "(1,1,1,12)", aic: 1245.3 }` |
| XGBOOST | `{ n_estimators: 200, max_depth: 6, learning_rate: 0.1, subsample: 0.8 }` |
| CROSTONS | `{ alpha: 0.15, variant: "SBA" }` |
| BSTS | `{ niter: 1000, prior_df: 5, seed: 42 }` |
| ENSEMBLE | `{ models: "SARIMA,XGBOOST,HOLT_WINTERS", weights: "0.45,0.35,0.20" }` |

---

## 6. Data Wiring Summary

| Component | Mock Data Source | Data File (Spec 04) |
|---|---|---|
| SkuHeader | `MOCK_SKUS` | `data/skus.ts` |
| DemandSection | `MOCK_DEMAND_HISTORY` | `data/demand-history.ts` |
| ForecastSection | `MOCK_DEMAND_HISTORY` + `MOCK_FORECASTS` | `data/demand-history.ts`, `data/forecasts.ts` |
| ClassificationPanel | `MOCK_CLASSIFICATIONS` | `data/classifications.ts` |
| InventoryCard | `MOCK_INVENTORY` + `MOCK_SAFETY_STOCK` + `MOCK_INVENTORY_PARAMETERS` | `data/inventory.ts`, `data/safety-stock.ts`, `data/inventory-parameters.ts` |
| ParameterEditPanel | `MOCK_INVENTORY_PARAMETERS` + `MOCK_PARAMETER_HISTORY` | `data/inventory-parameters.ts` |
| LeadTimeBreakdown | `MOCK_LEAD_TIMES` | `data/lead-times.ts` |
| AlertHistoryTable | `MOCK_ALERTS` | `data/alerts.ts` |
| ModelRegistryPanel | `MOCK_MODEL_REGISTRY` | `data/forecast-accuracy.ts` (or new `data/model-registry.ts`) |

---

## 7. Mock Data Requirements for This Page

The following mock data must exist to fully render the SKU Detail page. All are defined in Spec 04; additions noted here:

### 7.1 Model Registry Data (New)

Spec 04 does not define per-SKU model registry entries. Add to `data/forecast-accuracy.ts` (or create `data/model-registry.ts`):

**Export:** `MOCK_MODEL_REGISTRY: readonly ModelRegistryEntry[]`

Provide one entry per SKU with:
- Algorithm matching `DemandClassification.algorithmPrimary`
- Realistic hyperparameters per algorithm type (see table in Section 5.9)
- In-sample MAPE 2-5% lower than out-of-sample MAPE
- AIC scores in range 800-2500
- `lastTrainedAt` within the last 7 days

### 7.2 Parameter Change History (New)

**Export:** `MOCK_PARAMETER_HISTORY: readonly ParameterChangeRecord[]`

Provide 2-3 entries per SKU showing:
- Initial system calculation (source: `SYSTEM_AUTO`)
- A system recalculation with changed values
- A buyer override for ~20% of SKUs (source: `BUYER_MANUAL`)

---

## 8. Placeholder Markers

| Marker | Location | Description |
|---|---|---|
| `// MOCK: Replace MOCK_SKUS lookup with API call` | `SkuDetailPage.tsx` | SKU data fetch |
| `// MOCK: Replace MOCK_DEMAND_HISTORY filter with API call` | `SkuDetailPage.tsx` | Demand history fetch |
| `// MOCK: Replace MOCK_FORECASTS filter with API call` | `SkuDetailPage.tsx` | Forecast fetch |
| `// API_PLACEHOLDER: POST parameter changes to backend` | `ParameterEditPanel.tsx` | Save handler |
| `// EPICOR_PLACEHOLDER: Read inventory position from Epicor CDC` | `SkuDetailPage.tsx` | Live inventory |
| `// WEBSOCKET_PLACEHOLDER: Subscribe to real-time alert updates` | `AlertHistoryTable.tsx` | Live alerts |

---

## 9. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Route `/sku/:id` resolves to `SkuDetailPage` and renders without errors for any valid `skuId` from `MOCK_SKUS` | Navigate to `/sku/1100031-1`, `/sku/3100531-L1`, `/sku/SH-FLEX-100` — all render |
| 2 | Invalid `:id` param shows "SKU not found" empty state with a back link | Navigate to `/sku/INVALID-999` |
| 3 | SkuHeader displays part number, description, product line badge, demand class badge, source node badge, and active status badge | Visual inspection |
| 4 | "Back to list" button navigates to the previous page | Click from Action Center -> SKU Detail -> "Back to list" returns to Action Center |
| 5 | DemandHistoryChart renders 24 months of data with anomalous periods marked in amber | Inspect chart dots — at least 1-2 amber markers visible on high-variance SKUs |
| 6 | ForecastChart renders P50 line with two nested shaded prediction interval bands (P10/P90 inner, P2.5/P97.5 outer) and historical demand overlaid in green | Visual inspection — two bands visible, historical data connects to forecast |
| 7 | ClassificationPanel displays demand class badge, primary algorithm, fallback algorithm, CV of demand, CV of interval, average monthly demand, and last classified date | All 7 fields populated for any classified SKU |
| 8 | InventoryCard displays on-hand, on-order, allocated, available, safety stock, reorder point, and days of supply. InventoryGauge renders with correct color zones. | Check that gauge marker position corresponds to on-hand value relative to min/ROP/max |
| 9 | ParameterEditPanel fields are read-only by default. Clicking "Edit" enables inline editing. "Save" updates local state. "Cancel" reverts changes. | Click Edit, modify minQty, click Save — value persists. Click Edit, modify, click Cancel — reverts. |
| 10 | System-calculated vs. buyer-override toggle switches the source and updates the ParameterStatusBadge accordingly | Toggle to "System Calculated" — badge shows "System" (blue). Toggle to "Buyer Override" — badge shows "Override" (green). |
| 11 | Change history expands/collapses and shows 2-3 mock entries with field, old value, new value, changed-by, and source | Click "Change History" — entries appear. Click again — entries collapse. |
| 12 | LeadTimeBreakdown renders a StackedBarChart with baseline and actual rows for SCHECO-sourced SKUs showing 6 segments | Inspect chart for `/sku/3100531-L1` (SCHECO sourced) — 6 colored segments visible in both bars |
| 13 | LeadTimeBreakdown detail table shows segment name, baseline days, actual days, variance (red if positive, green if negative), and status badge | Inspect table below chart — all columns populated, variance colored |
| 14 | AlertHistoryTable lists alerts sorted by date descending with severity badge, trigger text, creation date, days-to-stockout indicator, and open/acknowledged status | Navigate to a SKU with active alerts — table populated |
| 15 | AlertHistoryTable shows EmptyState when no alerts exist for the SKU | Navigate to a SKU with no alerts — "No alerts" empty state displayed |
| 16 | ModelRegistryPanel displays algorithm name, in-sample MAPE, out-of-sample MAPE, AIC score, hyperparameters, and last trained date | All 5 fields populated |
| 17 | Page layout uses a 3-column grid (`xl:grid-cols-3`) on wide screens with charts spanning 2 columns and panels spanning 1 column. Stacks to single column below `xl` breakpoint. | Resize browser: wide = two-column; narrow = single column |
| 18 | All numeric values use `font-mono` per Kernel §7.4 | Inspect rendered text in DevTools — all quantities, costs, percentages use monospace font |
| 19 | Navigating to `/sku/1100031-1#inventory` scrolls the inventory/parameters section into view | Navigate with hash fragment; verify smooth scroll to inventory section |
