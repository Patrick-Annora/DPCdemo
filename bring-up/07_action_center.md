# Spec 07 — Action Center Page

**Status:** Draft
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data — `worklist.ts`, `inventory.ts`, `skus.ts`), Spec 05 (Common Components — DataTable, SummaryCard, FilterBar, SearchInput, PageHeader, Modal, ConfidenceScore, DaysOfSupplyIndicator, SourceNodeBadge, StatusBadge, EmptyState)
**Kernel refs:** §4.1 (Action Center), §3 (Domain Model — WorklistItem, SKU, InventoryPosition), §7 (Design System)
**SRD refs:** §5.1 (Core Design Principle — execution engine), §5.2 (Daily Priority Worklist), §5.4 (PO Execution Workflow — one-click approval, bulk approval, confidence gating)

---

## 1. Overview

The Action Center is the **default landing page** of the application (route `/`). It is an **execution engine**, not a reporting dashboard (SRD §5.1). Every element on this page exists to drive a buyer toward a concrete action: approve a PO, modify a quantity, change a source, defer, or escalate.

The page presents a priority-ranked worklist of system-generated recommendations. Each row is an actionable work item with one-click buttons. Bulk approval, confidence-gating justification, and inline modification modals support the full PO execution workflow.

---

## 2. File Structure

```
frontend/src/
  pages/ActionCenter/
    ActionCenterPage.tsx          # Top-level page component (route: "/")
    WorklistTable.tsx             # Worklist DataTable with column definitions
    WorklistActionButtons.tsx     # Per-row action button group
    BulkApprovalModal.tsx         # Spend summary modal for bulk approve
    JustificationModal.tsx        # Low-confidence justification modal
    ModifyQtyModal.tsx            # Modify recommended quantity modal
    ChangeSourceModal.tsx         # Change source node modal
    index.ts                      # Barrel export
  hooks/
    useWorklist.ts                # State management hook for worklist mutations
```

---

## 3. Page Layout — ActionCenterPage

**File:** `pages/ActionCenter/ActionCenterPage.tsx`

**Route:** `/` (default landing page per Kernel §6)

### 3.1 Layout Structure

The page renders top-to-bottom in this order:

1. **PageHeader** — title "Action Center", subtitle showing pending item count (e.g., "15 items require attention"), with an optional bulk action button area on the right.
2. **Summary Cards Row** — four `SummaryCard` components in a `grid grid-cols-4 gap-4` layout.
3. **Filter / Search Bar** — `FilterBar` and `SearchInput` in a horizontal flex row.
4. **Worklist Table** — the `WorklistTable` component occupying the full remaining width.

**Visual Description:**

```
<div className="space-y-6">
  <PageHeader
    title="Action Center"
    subtitle={`${pendingCount} items require attention`}
    actions={
      selectedCount > 0 && (
        <button
          onClick={openBulkApprovalModal}
          className="
            inline-flex items-center gap-2
            px-4 py-2
            text-sm font-medium
            text-white bg-navy-700
            rounded-lg
            hover:bg-navy-600
            focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2
            transition-colors
          "
        >
          <CheckCheck className="h-4 w-4" />
          Approve Selected ({selectedCount})
        </button>
      )
    }
  />

  {/* Summary Cards — each card is clickable (see §3.3 Card Click Behavior) */}
  <div className="grid grid-cols-4 gap-4">
    <SummaryCard label="Items Pending" value={pendingCount}
      onClick={() => handleCardClick('pending')}
      className={activeCardFilter === 'pending' ? 'ring-2 ring-navy-300' : ''} ... />
    <SummaryCard label="Critical Alerts" value={criticalCount}
      onClick={() => handleCardClick('critical')}
      className={activeCardFilter === 'critical' ? 'ring-2 ring-navy-300' : ''} ... />
    <SummaryCard label="Total Recommended Spend" value={totalSpend}
      onClick={() => handleCardClick('spend')}
      className={activeCardFilter === 'spend' ? 'ring-2 ring-navy-300' : ''} ... />
    <SummaryCard label="Avg Confidence" value={avgConfidence}
      onClick={() => handleCardClick('confidence')}
      className={activeCardFilter === 'confidence' ? 'ring-2 ring-navy-300' : ''} ... />
  </div>

  {/* Filter Row */}
  <div className="flex items-center gap-4 flex-wrap">
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search part number or description..."
    />
    <FilterBar label="Action:" options={actionTypeOptions} ... />
    <FilterBar label="Status:" options={statusOptions} ... />
    <FilterBar label="Source:" options={sourceOptions} ... />
    <FilterBar label="Alert:" options={alertLevelOptions} ... />
  </div>

  {/* Worklist Table */}
  <WorklistTable ... />
</div>
```

### 3.2 Page State

The `ActionCenterPage` component manages the following local state for card-driven filtering/sorting:

```typescript
/** Active card filter — determines which subset/sort is applied to the worklist */
const [activeCardFilter, setActiveCardFilter] = useState<'pending' | 'critical' | 'spend' | 'confidence' | null>(null);
```

When `activeCardFilter` changes, the page applies the corresponding filter or sort to the worklist data before passing it to `WorklistTable`. When `activeCardFilter` is `null`, the default view is shown (no card-specific filter/sort applied).

### 3.3 Summary Cards

Four cards computed from the current (filtered) worklist state. **All cards are clickable** — each card applies a filter or sort to the worklist table below (see Spec 16 §3.4.5).

| Card | Label | Value | Trend | Notes | Click Behavior |
|------|-------|-------|-------|-------|---------------|
| Items Pending | `"Items Pending"` | Count of items where `status === PENDING` | `direction: 'down'` if fewer than yesterday (mock: use static trend) | `favorable: true` when count goes down | Clears all filters, resets to default view |
| Critical Alerts | `"Critical Alerts"` | Count of items linked to a CRITICAL-level alert (items with `daysOfSupply < 7` in their inventory position) | Static mock trend | Text color red when count > 0 | Applies alert-level filter to `CRITICAL` |
| Total Recommended Spend | `"Total Recommended Spend"` | Sum of `estimatedCost` for all PENDING items, formatted as `$XXX,XXX` | Static mock trend | Gives buyer a sense of total commitment | Sorts worklist by `estimatedCost` descending |
| Avg Confidence | `"Avg Confidence"` | Mean `confidenceScore` across all PENDING items, formatted as `XX%` | Static mock trend | Amber if < 70%, green if >= 70% | Sorts worklist by `confidenceScore` ascending (lowest first) |

**Card Click Behavior (Spec 16 §3.4.5):**

Each SummaryCard accepts an `onClick` handler that applies a filter or sort to the worklist table below. The active card receives a visual highlight (`ring-2 ring-navy-300`). Clicking the already-active card clears the filter (toggles back to default).

| Card | `onClick` Action | Worklist Effect |
|------|-----------------|-----------------|
| Items Pending | `setActiveCardFilter('pending')` | Clears all filters, shows only PENDING items (default view) |
| Critical Alerts | `setActiveCardFilter('critical')` | Filters to worklist items whose associated alert has `alertLevel === CRITICAL` |
| Total Recommended Spend | `setActiveCardFilter('spend')` | Sorts by `estimatedCost` descending (highest spend first) |
| Avg Confidence | `setActiveCardFilter('confidence')` | Sorts by `confidenceScore` ascending (lowest confidence first) |

Clicking the already-active card resets: `setActiveCardFilter(null)` returns to the default worklist view.

All cards render with `cursor-pointer hover:shadow-card-hover transition-shadow` styling via the SummaryCard `onClick` prop.

**Implementation:**

```typescript
const handleCardClick = (card: 'pending' | 'critical' | 'spend' | 'confidence') => {
  // Toggle off if already active
  if (activeCardFilter === card) {
    setActiveCardFilter(null);
    clearAllFilters();
    return;
  }

  setActiveCardFilter(card);

  switch (card) {
    case 'pending':
      clearAllFilters();
      break;
    case 'critical':
      setAlertLevelFilter([AlertLevel.CRITICAL]);
      break;
    case 'spend':
      setSortState([{ id: 'estimatedCost', desc: true }]);
      break;
    case 'confidence':
      setSortState([{ id: 'confidenceScore', desc: false }]);
      break;
  }
};
```

---

## 4. Worklist Table — WorklistTable

**File:** `pages/ActionCenter/WorklistTable.tsx`

Uses the `DataTable` common component (Spec 05 §3.12) with `enableSelection={true}` for bulk approval.

### 4.1 Data Source

The table consumes an enriched worklist array. Each row joins `WorklistItem` with its associated `SKU` and `InventoryPosition` to produce a flat row object:

```typescript
interface WorklistRow {
  /** From WorklistItem */
  itemId: string;
  priorityRank: number;
  actionType: ActionType;
  recommendedQty: number;
  recommendedSource: SourceNode;
  estimatedCost: Currency;
  status: WorklistStatus;
  confidenceScore: Percentage;
  /** From SKU (joined via skuId) */
  skuId: string;
  partNumber: string;
  description: string;
  /** From InventoryPosition (joined via skuId) */
  onHand: number;
  daysOfSupply: number;
  /** Computed from forecast/lead-time mock data */
  projectedStockoutDate: string;
}
```

This join is performed in the `useWorklist` hook (Section 9).

### 4.2 Column Definitions

Columns are defined as TanStack Table `ColumnDef<WorklistRow>[]`. Default sort: `priorityRank` ascending.

| # | Column Header | Field | Width | Cell Renderer | Sortable | Notes |
|---|---|---|---|---|---|---|
| 1 | (checkbox) | — | `w-12` | Checkbox (from DataTable `enableSelection`) | No | Bulk selection |
| 2 | `#` | `priorityRank` | `w-12` | `<span className="text-sm font-mono tabular-nums text-slate-900 font-semibold">{value}</span>` | Yes | Default sort ASC |
| 3 | `Part Number` | `partNumber` | `w-32` | `<Link to={/sku/${skuId}} className="text-navy-600 hover:text-navy-800 font-mono text-sm font-medium">{value}</Link>` | Yes | Clickable, navigates to SKU Detail page |
| 4 | `Description` | `description` | `min-w-[200px]` | `<span className="text-sm text-slate-700 truncate">{value}</span>` | Yes | Truncated with title tooltip |
| 5 | `On Hand` | `onHand` | `w-20` | `<span className="text-sm font-mono tabular-nums text-right">{value.toLocaleString()}</span>` | Yes | Right-aligned numeric |
| 6 | `Days of Supply` | `daysOfSupply` | `w-36` | `<DaysOfSupplyIndicator days={value} />` | Yes | Color-graded bar from Spec 05 §3.5 |
| 7 | `Stock-Out Date` | `projectedStockoutDate` | `w-28` | `<span className="text-sm font-mono">{formatDate(value)}</span>` — red text if within 14 days | Yes | ISO date formatted as MMM DD |
| 8 | `Action` | `actionType` | `w-28` | `<ActionTypeBadge type={value} />` (see §4.3) | Yes | Color-coded badge |
| 9 | `Rec. Qty` | `recommendedQty` | `w-20` | `<span className="text-sm font-mono tabular-nums text-right">{value.toLocaleString()}</span>` | Yes | Right-aligned |
| 10 | `Source` | `recommendedSource` | `w-24` | `<SourceNodeBadge source={value} />` | Yes | Spec 05 §3.3 |
| 11 | `Est. Cost` | `estimatedCost` | `w-28` | `<span className="text-sm font-mono tabular-nums text-right">${value.toLocaleString()}</span>` | Yes | Right-aligned, USD formatted |
| 12 | `Confidence` | `confidenceScore` | `w-16` | `<ConfidenceScore value={value} variant="ring" size="sm" />` | Yes | Spec 05 §3.4 — amber/red below thresholds |
| 13 | `Status` | `status` | `w-24` | `<WorklistStatusBadge status={value} />` (see §4.4) | Yes | Color-coded pill |
| 14 | `Actions` | — | `w-48` | `<WorklistActionButtons item={row} />` | No | Per-row action buttons (see §5) |

### 4.3 ActionTypeBadge

A local helper component (can be defined inline in `WorklistTable.tsx` or extracted to a small file).

**Color mapping:**

| ActionType | Background | Text | Display Label |
|---|---|---|---|
| `NEW_PO` | `bg-green-100` | `text-green-800` | `New PO` |
| `EXPEDITE_PO` | `bg-amber-100` | `text-amber-800` | `Expedite` |
| `RESHORE` | `bg-violet-100` | `text-violet-800` | `Reshore` |
| `CANCEL_DEFER` | `bg-slate-100` | `text-slate-600` | `Cancel/Defer` |
| `REVIEW_EXCESS` | `bg-blue-100` | `text-blue-800` | `Review Excess` |
| `SET_PARAMETERS` | `bg-cyan-100` | `text-cyan-800` | `Set Params` |
| `REVIEW_MIN_VIOLATION` | `bg-red-100` | `text-red-800` | `Min Violation` |

Renders using the `StatusBadge` common component.

### 4.4 WorklistStatusBadge

A local helper mapping `WorklistStatus` to badge colors.

| WorklistStatus | Background | Text | Display Label |
|---|---|---|---|
| `PENDING` | `bg-yellow-100` | `text-yellow-800` | `Pending` |
| `APPROVED` | `bg-green-100` | `text-green-800` | `Approved` |
| `DEFERRED` | `bg-slate-100` | `text-slate-600` | `Deferred` |
| `ESCALATED` | `bg-red-100` | `text-red-800` | `Escalated` |

Renders using the `StatusBadge` common component.

### 4.5 Sorting

- All sortable columns support ascending and descending sort via TanStack Table's built-in sorting.
- Default sort state: `[{ id: 'priorityRank', desc: false }]`.
- Clicking a column header cycles: unsorted -> ascending -> descending -> unsorted.
- Sort indicators: `ChevronUp` / `ChevronDown` icons from `lucide-react` per DataTable spec.

### 4.6 Filtering

Four filter dimensions, each using `FilterBar` (Spec 05 §3.8):

| Filter | Options | Active Color Classes |
|---|---|---|
| Action Type | All 7 `ActionType` values | Use ActionTypeBadge color mapping |
| Status | All 4 `WorklistStatus` values | Use WorklistStatusBadge color mapping |
| Source Node | All 3 `SourceNode` values | Use SourceNodeBadge color mapping (Kernel §7.3) |
| Alert Level | `CRITICAL`, `WARNING`, `WATCH`, `EXCESS` — derived from `daysOfSupply` thresholds | Use Kernel §7.2 severity colors |

The `SearchInput` filters across `partNumber` and `description` fields using case-insensitive substring matching. Debounce: 250ms.

All filters are AND-combined: a row must match ALL active filter groups. Within a single filter group, values are OR-combined (e.g., selecting both `NEW_PO` and `EXPEDITE_PO` shows items matching either).

### 4.7 Pagination

- Default page size: 20 rows.
- Uses DataTable's built-in pagination controls.
- If the filtered worklist has <= 20 items, pagination controls are hidden.

### 4.8 Empty State

When all items are filtered out or the worklist is empty, display:

```tsx
<EmptyState
  icon={Inbox}
  title="All caught up"
  description="No pending actions match your current filters."
  actionLabel="Clear Filters"
  onAction={handleClearAllFilters}
/>
```

---

## 5. Per-Row Actions — WorklistActionButtons

**File:** `pages/ActionCenter/WorklistActionButtons.tsx`

**Props:**

```typescript
interface WorklistActionButtonsProps {
  /** The enriched worklist row this button group acts on */
  item: WorklistRow;
  /** Callback to approve (may trigger justification modal if low confidence) */
  onApprove: (itemId: string) => void;
  /** Callback to open Modify Qty modal */
  onModifyQty: (itemId: string) => void;
  /** Callback to open Change Source modal */
  onChangeSource: (itemId: string) => void;
  /** Callback to defer item by 1 week */
  onDefer: (itemId: string) => void;
  /** Callback to escalate item */
  onEscalate: (itemId: string) => void;
}
```

### 5.1 Button Layout

Renders as a horizontal flex row of small icon+text buttons. Only the primary action (`Approve PO`) is always visible. Secondary actions are in a dropdown menu triggered by a `MoreHorizontal` icon button to keep the row compact.

```
<div className="flex items-center gap-1">
  {/* Primary action — always visible */}
  <button
    onClick={() => onApprove(item.itemId)}
    disabled={item.status !== WorklistStatus.PENDING}
    className="
      inline-flex items-center gap-1
      px-2 py-1
      text-xs font-medium
      text-white bg-green-600
      rounded-md
      hover:bg-green-700
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors
    "
  >
    <Check className="h-3 w-3" />
    Approve
  </button>

  {/* Secondary actions dropdown */}
  <div className="relative">
    <button
      onClick={toggleDropdown}
      disabled={item.status !== WorklistStatus.PENDING}
      className="
        p-1 rounded-md
        text-slate-400 hover:text-slate-600 hover:bg-slate-100
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>

    {/* Dropdown menu */}
    {isOpen && (
      <div className="
        absolute right-0 top-full mt-1 z-20
        w-44
        bg-white rounded-lg border border-slate-200 shadow-lg
        py-1
      ">
        <DropdownItem icon={Edit3} label="Modify Qty" onClick={() => onModifyQty(item.itemId)} />
        <DropdownItem icon={RefreshCw} label="Change Source" onClick={() => onChangeSource(item.itemId)} />
        <DropdownItem icon={Clock} label="Defer 1 Week" onClick={() => onDefer(item.itemId)} />
        <DropdownItem icon={AlertTriangle} label="Escalate" onClick={() => onEscalate(item.itemId)} />
      </div>
    )}
  </div>
</div>
```

Icons: `Check`, `MoreHorizontal`, `Edit3`, `RefreshCw`, `Clock`, `AlertTriangle` from `lucide-react`.

### 5.2 Disabled State

All buttons are disabled when `item.status !== WorklistStatus.PENDING`. Approved, deferred, and escalated items show their status badge but no active action buttons.

### 5.3 Dropdown Behavior

- Clicking the `MoreHorizontal` button toggles the dropdown.
- Clicking outside the dropdown closes it.
- Clicking any dropdown item closes the dropdown and fires the corresponding callback.
- Dropdown is positioned `absolute right-0` to prevent overflow off the right edge of the table.

---

## 6. Confidence Score Gating — JustificationModal

**File:** `pages/ActionCenter/JustificationModal.tsx`

Per SRD §5.4.3, items with `confidenceScore < 70` require buyer justification before approval.

### 6.1 Trigger

When a buyer clicks [Approve] on a row where `confidenceScore < 70`, the `ActionCenterPage` intercepts the approval and opens the `JustificationModal` instead of immediately approving.

### 6.2 Props

```typescript
interface JustificationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close without approving */
  onClose: () => void;
  /** The worklist row being justified */
  item: WorklistRow;
  /** Callback when justification is submitted — approves the item */
  onSubmit: (itemId: string, justification: { reasonCode: string; freeText: string }) => void;
}
```

### 6.3 Visual Description

Uses the `Modal` common component (Spec 05).

```
<Modal isOpen={isOpen} onClose={onClose} title="Low Confidence — Justification Required">
  <div className="space-y-4">
    {/* Warning banner */}
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          This recommendation has a confidence score of {item.confidenceScore}%.
        </p>
        <p className="text-sm text-amber-700 mt-1">
          Approving low-confidence recommendations requires a justification for audit purposes.
        </p>
      </div>
    </div>

    {/* Item summary */}
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div><span className="text-slate-500">Part:</span> <span className="font-mono font-medium">{item.partNumber}</span></div>
      <div><span className="text-slate-500">Action:</span> <ActionTypeBadge type={item.actionType} /></div>
      <div><span className="text-slate-500">Qty:</span> <span className="font-mono">{item.recommendedQty}</span></div>
      <div><span className="text-slate-500">Cost:</span> <span className="font-mono">${item.estimatedCost.toLocaleString()}</span></div>
    </div>

    {/* Reason code dropdown */}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Reason Code</label>
      <select className="w-full rounded-lg border-slate-300 text-sm focus:ring-navy-500 focus:border-navy-500">
        <option value="">Select a reason...</option>
        <option value="CUSTOMER_COMMITMENT">Customer commitment / confirmed order</option>
        <option value="SEASONAL_BUILDUP">Seasonal pre-build</option>
        <option value="HISTORICAL_KNOWLEDGE">Buyer historical knowledge</option>
        <option value="MANAGEMENT_DIRECTIVE">Management directive</option>
        <option value="SAFETY_STOCK_REBUILD">Safety stock rebuild</option>
        <option value="OTHER">Other (see notes)</option>
      </select>
    </div>

    {/* Free-text justification */}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Justification Notes</label>
      <textarea
        rows={3}
        className="w-full rounded-lg border-slate-300 text-sm focus:ring-navy-500 focus:border-navy-500"
        placeholder="Explain why you are approving this low-confidence recommendation..."
      />
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!reasonCode}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Approve with Justification
      </button>
    </div>
  </div>
</Modal>
```

### 6.4 Validation

- The `reasonCode` dropdown is required — the "Approve with Justification" button is disabled until a reason code is selected.
- Free-text is optional but recommended.
- On submit: calls `onSubmit` with the itemId and justification data, which triggers the normal approval flow (status -> `APPROVED`).

---

## 7. Bulk Approval — BulkApprovalModal

**File:** `pages/ActionCenter/BulkApprovalModal.tsx`

Per SRD §5.4.2, buyers can select multiple worklist items and approve them in a single action.

### 7.1 Trigger

The "Approve Selected" button in the `PageHeader` actions slot is visible only when `selectedCount > 0`. Clicking it opens the `BulkApprovalModal`.

### 7.2 Props

```typescript
interface BulkApprovalModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close without approving */
  onClose: () => void;
  /** The selected worklist rows to approve */
  items: WorklistRow[];
  /** Callback when bulk approval is confirmed */
  onConfirm: (itemIds: string[]) => void;
}
```

### 7.3 Visual Description

```
<Modal isOpen={isOpen} onClose={onClose} title="Bulk Approval — Spend Summary">
  <div className="space-y-4">
    {/* Summary stats */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <p className="text-sm text-slate-500">Total Items</p>
        <p className="text-2xl font-semibold font-mono text-slate-900">{items.length}</p>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <p className="text-sm text-slate-500">Total Quantity</p>
        <p className="text-2xl font-semibold font-mono text-slate-900">{totalQty.toLocaleString()}</p>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <p className="text-sm text-slate-500">Total Cost</p>
        <p className="text-2xl font-semibold font-mono text-slate-900">${totalCost.toLocaleString()}</p>
      </div>
    </div>

    {/* Breakdown by source */}
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">Breakdown by Source</h4>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {sourceBreakdown.map(({ source, itemCount, qty, cost }) => (
          <div key={source} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <SourceNodeBadge source={source} />
              <span className="text-sm text-slate-600">{itemCount} items</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-mono">
              <span className="text-slate-500">{qty.toLocaleString()} units</span>
              <span className="text-slate-900 font-medium">${cost.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Low-confidence warning (if any selected items have confidence < 70) */}
    {lowConfidenceCount > 0 && (
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>{lowConfidenceCount}</strong> of the selected items have confidence below 70%.
          Bulk approval will proceed without individual justification.
        </p>
      </div>
    )}

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button
        onClick={() => onConfirm(items.map(i => i.itemId))}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
      >
        Confirm Approval ({items.length} items)
      </button>
    </div>
  </div>
</Modal>
```

### 7.4 Source Breakdown Computation

Group selected items by `recommendedSource`. For each source, compute:
- `itemCount`: number of items
- `qty`: sum of `recommendedQty`
- `cost`: sum of `estimatedCost`

Display each group as a row with the `SourceNodeBadge`, item count, total qty, and total cost.

### 7.5 Low-Confidence Warning

If any selected items have `confidenceScore < 70`, display the amber warning banner. Bulk approval bypasses individual justification (per SRD §5.4.2 — bulk approval is a summary-level action). The warning ensures the buyer is aware.

---

## 8. Modify Qty Modal — ModifyQtyModal

**File:** `pages/ActionCenter/ModifyQtyModal.tsx`

### 8.1 Props

```typescript
interface ModifyQtyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close without saving */
  onClose: () => void;
  /** The worklist row being modified */
  item: WorklistRow;
  /** Callback when the new quantity is applied */
  onApply: (itemId: string, newQty: number) => void;
}
```

### 8.2 Visual Description

```
<Modal isOpen={isOpen} onClose={onClose} title="Modify Recommended Quantity">
  <div className="space-y-4">
    {/* Item context */}
    <div className="text-sm">
      <p className="text-slate-500">
        <span className="font-mono font-medium text-slate-900">{item.partNumber}</span>
        {' — '}{item.description}
      </p>
    </div>

    {/* Current recommendation */}
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span>System recommended:</span>
      <span className="font-mono font-medium text-slate-900">{item.recommendedQty.toLocaleString()}</span>
      <span>units</span>
    </div>

    {/* Qty input with +/- buttons */}
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={decrement}
        className="
          p-2 rounded-lg
          border border-slate-300
          text-slate-600 hover:bg-slate-100
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
        disabled={qty <= 1}
      >
        <Minus className="h-5 w-5" />
      </button>
      <input
        type="number"
        value={qty}
        onChange={handleInputChange}
        min={1}
        className="
          w-32 text-center
          text-2xl font-mono font-semibold
          border border-slate-300 rounded-lg
          focus:ring-2 focus:ring-navy-500 focus:border-navy-500
          py-2
        "
      />
      <button
        onClick={increment}
        className="
          p-2 rounded-lg
          border border-slate-300
          text-slate-600 hover:bg-slate-100
          transition-colors
        "
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>

    {/* Updated cost estimate */}
    <p className="text-center text-sm text-slate-500">
      Estimated cost: <span className="font-mono font-medium text-slate-900">
        ${(unitCost * qty).toLocaleString()}
      </span>
    </p>

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button
        onClick={() => onApply(item.itemId, qty)}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600"
      >
        Apply
      </button>
    </div>
  </div>
</Modal>
```

Icons: `Minus`, `Plus` from `lucide-react`.

### 8.3 Internal State

| State | Type | Initial Value | Purpose |
|---|---|---|---|
| `qty` | `number` | `item.recommendedQty` | The adjusted quantity |

### 8.4 Behavior

- Input is pre-populated with `item.recommendedQty`.
- `+` button increments by 1 (or 10 if shift-held — optional enhancement).
- `-` button decrements by 1, minimum value of 1.
- Direct numeric input is also supported.
- Updated estimated cost is computed as `(item.estimatedCost / item.recommendedQty) * qty` (unit cost derived from the original recommendation).
- Clicking "Apply" calls `onApply(itemId, qty)` which updates the worklist item's `recommendedQty` and `estimatedCost` in state.

---

## 9. Change Source Modal — ChangeSourceModal

**File:** `pages/ActionCenter/ChangeSourceModal.tsx`

### 9.1 Props

```typescript
interface ChangeSourceModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close without saving */
  onClose: () => void;
  /** The worklist row being modified */
  item: WorklistRow;
  /** Callback when the new source is applied */
  onApply: (itemId: string, newSource: SourceNode) => void;
}
```

### 9.2 Visual Description

```
<Modal isOpen={isOpen} onClose={onClose} title="Change Source Node">
  <div className="space-y-4">
    {/* Item context */}
    <div className="text-sm">
      <p className="text-slate-500">
        <span className="font-mono font-medium text-slate-900">{item.partNumber}</span>
        {' — '}{item.description}
      </p>
    </div>

    {/* Current source */}
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Current source:</span>
      <SourceNodeBadge source={item.recommendedSource} />
    </div>

    {/* Source options with cost comparison */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Select new source:</label>
      {sourceOptions.map(({ source, estimatedCost, leadTimeDays }) => (
        <button
          key={source}
          onClick={() => setSelectedSource(source)}
          className={`
            w-full flex items-center justify-between
            px-4 py-3 rounded-lg border
            text-sm
            transition-colors
            ${selectedSource === source
              ? 'border-navy-500 bg-navy-50 ring-2 ring-navy-200'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <SourceNodeBadge source={source} />
            <span className="text-slate-500">{leadTimeDays} day lead time</span>
          </div>
          <span className="font-mono font-medium text-slate-900">
            ${estimatedCost.toLocaleString()}
          </span>
        </button>
      ))}
    </div>

    {/* Cost delta */}
    {selectedSource !== item.recommendedSource && (
      <div className={`text-sm text-center ${costDelta > 0 ? 'text-danger-500' : 'text-success-500'}`}>
        {costDelta > 0 ? '+' : ''}${costDelta.toLocaleString()} vs. current source
      </div>
    )}

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button
        onClick={() => onApply(item.itemId, selectedSource)}
        disabled={selectedSource === item.recommendedSource}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Apply
      </button>
    </div>
  </div>
</Modal>
```

### 9.3 Source Options Data

All three `SourceNode` values are shown. The cost comparison data is derived from mock arbitrage data:

| SourceNode | Lead Time (days) | Cost Derivation |
|---|---|---|
| `SCHECO_SHANGHAI` | 60 | Base cost from mock (item's original if SCHECO, or CLC from arbitrage data) |
| `NIXA_MO` | 10 | NDC from arbitrage data |
| `SHARK_NZ` | 45 | Base cost + 15% premium (mock heuristic) |

The current source is pre-selected. "Apply" is disabled if the selected source matches the current source.

### 9.4 Behavior

- On apply: updates `recommendedSource` and recalculates `estimatedCost` based on the selected source's cost.
- Displays a cost delta (green if cheaper, red if more expensive) to help the buyer make an informed decision.

---

## 10. Action Confirmation — Toast Notifications

After every successful action (approve, defer, escalate, modify qty, change source), display a brief toast notification.

### 10.1 Toast Behavior

- Appears in the bottom-right corner of the viewport.
- Auto-dismisses after 3 seconds.
- Shows a success icon (green `CheckCircle2`) and a short message.
- Multiple toasts stack vertically.

### 10.2 Toast Messages

| Action | Message |
|---|---|
| Approve (single) | `"PO approved for {partNumber}"` |
| Approve (bulk) | `"{count} POs approved — ${totalCost} committed"` |
| Modify Qty | `"Qty updated to {newQty} for {partNumber}"` |
| Change Source | `"Source changed to {sourceLabel} for {partNumber}"` |
| Defer | `"{partNumber} deferred 1 week"` |
| Escalate | `"{partNumber} escalated to management"` |

### 10.3 Implementation

Use a simple toast state array managed in `ActionCenterPage` or a lightweight toast context. Each toast is an object `{ id: string; message: string }`. Render as a fixed-position stack:

```
<div className="fixed bottom-4 right-4 z-50 space-y-2">
  {toasts.map(toast => (
    <div key={toast.id} className="
      flex items-center gap-2
      px-4 py-3
      bg-white border border-slate-200 rounded-lg shadow-lg
      text-sm text-slate-900
      animate-slide-in
    ">
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      {toast.message}
    </div>
  ))}
</div>
```

Icon: `CheckCircle2` from `lucide-react`.

---

## 11. State Management — useWorklist Hook

**File:** `hooks/useWorklist.ts`

### 11.1 Purpose

Manages all mutable worklist state for the Action Center. Provides the enriched worklist data (joined with SKU and inventory position) and mutation functions.

### 11.2 Interface

```typescript
interface UseWorklistReturn {
  /** Enriched worklist rows (joined WorklistItem + SKU + InventoryPosition) */
  items: WorklistRow[];
  /** Approve a single item. If confidence < 70, caller must handle justification first. */
  approveItem: (itemId: string) => void;
  /** Approve with justification (for low-confidence items) */
  approveWithJustification: (itemId: string, justification: { reasonCode: string; freeText: string }) => void;
  /** Approve multiple items at once */
  bulkApprove: (itemIds: string[]) => void;
  /** Defer an item — sets status to DEFERRED */
  deferItem: (itemId: string) => void;
  /** Escalate an item — sets status to ESCALATED */
  escalateItem: (itemId: string) => void;
  /** Modify the recommended quantity for an item */
  modifyQty: (itemId: string, newQty: number) => void;
  /** Change the recommended source for an item */
  changeSource: (itemId: string, newSource: SourceNode, newCost: Currency) => void;
}
```

### 11.3 Internal State

```typescript
const [worklistState, setWorklistState] = useState<WorklistItem[]>(
  () => [...MOCK_WORKLIST]  // Deep copy of mock data
);
```

### 11.4 Data Enrichment

On every render (memoized with `useMemo`), join `worklistState` with `MOCK_SKUS` and `MOCK_INVENTORY` to produce `WorklistRow[]`:

```typescript
const items = useMemo(() => {
  return worklistState.map(item => {
    const sku = MOCK_SKUS.find(s => s.skuId === item.skuId)!;
    const inv = MOCK_INVENTORY.find(i => i.skuId === item.skuId)!;
    return {
      ...item,
      partNumber: sku.partNumber,
      description: sku.description,
      onHand: inv.onHand,
      daysOfSupply: inv.daysOfSupply,
      projectedStockoutDate: computeStockoutDate(inv.daysOfSupply), // helper: today + daysOfSupply
    };
  });
}, [worklistState]);
```

### 11.5 Mutation Functions

All mutations update `worklistState` via `setWorklistState` using immutable updates:

| Mutation | State Change |
|---|---|
| `approveItem(id)` | Set `status` to `APPROVED` |
| `approveWithJustification(id, justification)` | Set `status` to `APPROVED` (justification logged to console for demo) |
| `bulkApprove(ids)` | Set `status` to `APPROVED` for all matching IDs |
| `deferItem(id)` | Set `status` to `DEFERRED` |
| `escalateItem(id)` | Set `status` to `ESCALATED` |
| `modifyQty(id, qty)` | Update `recommendedQty` and recalculate `estimatedCost` (unit cost * new qty) |
| `changeSource(id, source, cost)` | Update `recommendedSource` and `estimatedCost` |

### 11.6 Persistence

Changes persist for the duration of the browser session via React state. On page reload, state resets to the original mock data. This is intentional per Kernel §1 (frontend-first demo, no backend).

---

## 12. Component Interaction Flow

### 12.1 Single Approval (High Confidence)

```
User clicks [Approve] on row with confidence >= 70
  → WorklistActionButtons.onApprove(itemId)
  → ActionCenterPage checks confidenceScore
  → confidenceScore >= 70: call useWorklist.approveItem(itemId)
  → WorklistItem.status → APPROVED
  → Toast: "PO approved for {partNumber}"
  → Row re-renders with APPROVED badge, action buttons disabled
```

### 12.2 Single Approval (Low Confidence)

```
User clicks [Approve] on row with confidence < 70
  → WorklistActionButtons.onApprove(itemId)
  → ActionCenterPage checks confidenceScore
  → confidenceScore < 70: open JustificationModal
  → User selects reason code + optional notes
  → User clicks [Approve with Justification]
  → JustificationModal.onSubmit(itemId, justification)
  → ActionCenterPage calls useWorklist.approveWithJustification(itemId, justification)
  → WorklistItem.status → APPROVED
  → Toast: "PO approved for {partNumber}"
  → Modal closes, row re-renders
```

### 12.3 Bulk Approval

```
User checks multiple rows via checkbox column
  → "Approve Selected (N)" button appears in PageHeader
  → User clicks [Approve Selected]
  → BulkApprovalModal opens with spend summary
  → User reviews total items, qty, cost, source breakdown
  → User clicks [Confirm Approval]
  → BulkApprovalModal.onConfirm(itemIds)
  → ActionCenterPage calls useWorklist.bulkApprove(itemIds)
  → All selected items: status → APPROVED
  → Toast: "{N} POs approved — ${total} committed"
  → Modal closes, checkboxes clear, rows re-render
```

### 12.4 Modify Qty

```
User clicks [Modify Qty] from dropdown
  → ModifyQtyModal opens, pre-populated with recommendedQty
  → User adjusts quantity via +/- buttons or direct input
  → User clicks [Apply]
  → ModifyQtyModal.onApply(itemId, newQty)
  → ActionCenterPage calls useWorklist.modifyQty(itemId, newQty)
  → WorklistItem.recommendedQty and estimatedCost updated
  → Toast: "Qty updated to {newQty} for {partNumber}"
  → Modal closes, row re-renders with new values
```

### 12.5 Change Source

```
User clicks [Change Source] from dropdown
  → ChangeSourceModal opens showing all 3 source options
  → User selects a different source, reviews cost delta
  → User clicks [Apply]
  → ChangeSourceModal.onApply(itemId, newSource)
  → ActionCenterPage calls useWorklist.changeSource(itemId, newSource, newCost)
  → WorklistItem.recommendedSource and estimatedCost updated
  → Toast: "Source changed to {sourceLabel} for {partNumber}"
  → Modal closes, row re-renders
```

### 12.6 Defer / Escalate

```
User clicks [Defer 1 Week] or [Escalate] from dropdown
  → Immediate state update (no modal)
  → useWorklist.deferItem(itemId) or .escalateItem(itemId)
  → WorklistItem.status → DEFERRED or ESCALATED
  → Toast: "{partNumber} deferred 1 week" or "{partNumber} escalated to management"
  → Row re-renders with new status badge, actions disabled
```

---

## 13. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | Action Center renders at route `/` as the default landing page | Navigate to app root; Action Center is displayed |
| 2 | PageHeader shows "Action Center" title and dynamic pending-item count subtitle | Visual check; subtitle updates when items are approved/deferred |
| 3 | Four summary cards display: Items Pending, Critical Alerts, Total Recommended Spend, Avg Confidence with correct computed values | Values match filtered worklist data |
| 4 | Worklist table displays all columns per §4.2: priority rank, part number, description, on-hand, days of supply, stock-out date, action type, recommended qty, source, estimated cost, confidence, status, actions | Visual check against column spec |
| 5 | Part number column links to `/sku/:id` route (SKU Detail page) | Click part number; React Router navigates to correct SKU detail |
| 6 | Table is sortable by all specified columns; default sort is priority rank ascending | Click column headers; sort indicators appear; rows reorder correctly |
| 7 | FilterBar filters work for action type, status, source node, and alert level; SearchInput filters across part number and description | Apply each filter; verify table contents update. Apply search; verify substring match |
| 8 | [Approve PO] button on a PENDING row with confidence >= 70% changes status to APPROVED and shows toast | Click Approve; row shows green APPROVED badge; toast appears and auto-dismisses |
| 9 | [Approve PO] on a row with confidence < 70% opens the JustificationModal; submission with reason code approves the item | Click Approve on low-confidence row; modal appears; select reason; click Approve with Justification; item approved |
| 10 | Checkbox column enables bulk selection; "Approve Selected" button appears with count; clicking opens BulkApprovalModal with correct spend summary and source breakdown | Select 3+ items; button shows count; modal shows correct totals per source |
| 11 | BulkApprovalModal [Confirm Approval] approves all selected items, clears selection, and shows toast | Confirm; all selected rows change to APPROVED; checkboxes clear; toast shows count and total cost |
| 12 | [Modify Qty] opens ModifyQtyModal pre-populated with recommended qty; +/- buttons and direct input work; Apply updates the row | Open modal; adjust qty; Apply; row shows new qty and recalculated cost |
| 13 | [Change Source] opens ChangeSourceModal with all 3 source options and cost comparison; Apply updates the row | Open modal; select different source; Apply; row shows new source badge and cost |
| 14 | [Defer 1 Week] immediately changes status to DEFERRED; [Escalate] changes to ESCALATED; toast shown for each | Click Defer; row shows gray DEFERRED badge. Click Escalate; row shows red ESCALATED badge |
| 15 | All action buttons are disabled on non-PENDING rows (APPROVED, DEFERRED, ESCALATED) | Approve a row; verify Approve button and dropdown are disabled/grayed |
| 16 | Confidence scores below 70% render with amber color; below 60% render with red color per ConfidenceScore component spec | Visual check across rows with varying confidence values |
| 17 | DaysOfSupplyIndicator shows correct color grading: red < 7, amber 7-13, yellow 14-29, green 30+ | Visual check across rows |
| 18 | EmptyState displays when all items are filtered out; "Clear Filters" button resets all filters | Apply restrictive filter combination; empty state appears; click Clear Filters; all items return |
| 19 | State changes persist during browser session but reset on page reload | Make changes; navigate away and back; changes persist. Reload page; original mock data restored |
| 20 | Summary cards update in real-time as items are approved, deferred, or escalated | Approve an item; Items Pending count decreases; Total Recommended Spend recalculates |
| 21 | Summary cards are clickable with `cursor-pointer` and hover shadow effect | Hover over each card; verify cursor and shadow |
| 22 | Clicking "Critical Alerts" card applies CRITICAL alert-level filter to the worklist table | Click card; verify only critical items shown |
| 23 | Clicking "Total Recommended Spend" card sorts worklist by estimated cost descending | Click card; verify highest-cost items at top |
| 24 | Clicking "Avg Confidence" card sorts worklist by confidence ascending (lowest first) | Click card; verify lowest-confidence items at top |
| 25 | Clicking "Items Pending" card clears all active filters and sorts, restoring default view | Apply filters first; click card; verify all filters cleared |
| 26 | Clicking the already-active summary card toggles the filter off and returns to the default worklist view | Click "Critical Alerts" card; verify filter applied and card highlighted; click same card again; verify filter cleared and highlight removed |
| 27 | The active summary card displays a visual highlight (`ring-2 ring-navy-300`) to indicate which filter/sort is currently applied | Click each card in turn; verify ring highlight appears on active card only |
