# Spec 12 — Inventory Parameters Page

**Route:** `/inventory/parameters`
**Directory:** `frontend/src/pages/InventoryParameters/`
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data — `inventory-parameters.ts`, `inventory.ts`, `skus.ts`), Spec 05 (Common Components — DataTable, FilterBar, SummaryCard, ParameterStatusBadge, Modal, SearchInput, PageHeader), Spec 06 (Chart Components — InventoryGauge)
**Kernel ref:** 00_KERNEL.md §4.7 (Inventory Parameters), §3.1 (InventoryParameters entity), §3.2 (ParameterStatus, ParameterSource enums)
**SRD ref:** §2.1 (Target Service Level Calculator)

---

## 1. Overview

This page is the **primary interface for managing min/max/safety stock levels** — the planning parameters that Springfield Marine currently has set to zero for virtually all parts. It exposes the full parameter table, violation indicators, inline editing, system-vs-override toggling, bulk import, change history, and CSV export. All mutations operate on local demo state via React Context and persist for the duration of the browser session.

---

## 2. File Structure

```
frontend/src/
  pages/
    InventoryParameters/
      InventoryParametersPage.tsx    # Page shell: summary cards, filter bar, table, modals
      ParameterTable.tsx             # DataTable wrapper with column definitions and inline editing
      InlineEditCell.tsx             # Click-to-edit cell with system-recommended hint
      SystemOverrideToggle.tsx       # Per-row toggle: System vs. Override
      InlineInventoryGauge.tsx       # Compact InventoryGauge sized for table rows
      BulkImportModal.tsx            # Paste-from-spreadsheet import modal
      ChangeHistoryPanel.tsx         # Expandable row panel showing parameter change log
      ExportButton.tsx               # CSV export button
      useParameterFilters.ts         # Hook: filter state, violation counts, filtered data
      index.ts                       # Barrel export
  context/
    ParameterContext.tsx             # React Context for parameter mutations
  lib/
    parameterValidation.ts          # Validation rules: min < ROP < max, SS <= min
    parameterCsvExport.ts           # CSV generation utility
```

---

## 3. State Management — ParameterContext

**File:** `frontend/src/context/ParameterContext.tsx`

A React Context that holds the mutable parameter state for the entire session. All parameter mutations (inline edits, toggle changes, bulk imports) flow through this context so that every consuming component sees a consistent snapshot.

### 3.1 Context Shape

```typescript
interface ParameterChangeEvent {
  /** ISO 8601 timestamp of the change */
  timestamp: string;
  /** Buyer identifier who made the change */
  changedBy: string;
  /** Field that was modified */
  field: 'minQty' | 'maxQty' | 'safetyStockQty' | 'reorderPoint' | 'targetCsl' | 'leadTimeDays' | 'parameterStatus';
  /** Previous value (as string for display) */
  oldValue: string;
  /** New value (as string for display) */
  newValue: string;
  /** Source of the change */
  source: ParameterSource;
}

interface ParameterContextValue {
  /** Current parameter records (mutable copy of MOCK_INVENTORY_PARAMETERS) */
  parameters: InventoryParameters[];
  /** Change history log keyed by skuId */
  changeHistory: Record<string, ParameterChangeEvent[]>;
  /** System-recommended values (read-only, from MOCK_SAFETY_STOCK + computed defaults) */
  systemRecommendations: Record<string, Partial<InventoryParameters>>;
  /** Update a single field on a parameter record */
  updateParameter: (skuId: string, field: string, value: number) => void;
  /** Toggle between SYSTEM_CALCULATED and BUYER_OVERRIDE for a SKU */
  toggleSource: (skuId: string, useSystem: boolean) => void;
  /** Bulk-update multiple parameter records (from import) */
  bulkUpdate: (updates: Partial<InventoryParameters>[]) => void;
}
```

### 3.2 Initialization

On mount, deep-clone `MOCK_INVENTORY_PARAMETERS` into local state. Seed `changeHistory` with 2-3 pre-existing change events per SKU that has `BUYER_OVERRIDE` or `NEEDS_REVIEW` status (from mock data, illustrating the history trail). Seed `systemRecommendations` from `MOCK_SAFETY_STOCK` data.

### 3.3 Mutation Behavior

**`updateParameter(skuId, field, value)`:**
1. Update the field value on the matching record.
2. Set `parameterStatus` to `BUYER_OVERRIDE`.
3. Set `source` to `ParameterSource.BUYER_MANUAL`.
4. Set `lastReviewedAt` to current ISO timestamp.
5. Set `reviewedBy` to `"DEMO_USER"`.
6. Push a new `ParameterChangeEvent` into `changeHistory[skuId]`.

**`toggleSource(skuId, useSystem)`:**
- If `useSystem === true`: copy all values from `systemRecommendations[skuId]` into the record, set `parameterStatus` to `SYSTEM_CALCULATED`, `source` to `SYSTEM_AUTO`. Log the change.
- If `useSystem === false`: keep current values but set `parameterStatus` to `BUYER_OVERRIDE`, `source` to `BUYER_MANUAL`. Log the change.

**`bulkUpdate(updates)`:**
- For each update, merge fields into the matching record. Set `parameterStatus` to `BUYER_OVERRIDE`, `source` to `BUYER_MANUAL`. Log each field change.

### 3.4 Provider Placement

Wrap `ParameterContext.Provider` around the `InventoryParametersPage` route element in the app router. The context does **not** wrap the entire app — it is scoped to this page.

---

## 4. Coverage Summary Cards

**Location:** Top of page, below PageHeader. Rendered as a `grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4` row.

Six `SummaryCard` instances computed from the current parameter state and inventory positions:

| # | Label | Value Derivation | Trend | Color Hint |
|---|-------|-----------------|-------|------------|
| 1 | **Total Active Parts** | Count of parameters where corresponding SKU `isActive === true` | None | Default |
| 2 | **Parameters Set** | `((total - NOT_SET count) / total * 100).toFixed(0)%` | Direction: up. Favorable: true. Delta: vs. initial load (starts at "60%"). | Green |
| 3 | **Below Min** | Count of SKUs where `onHand < minQty` AND `minQty > 0` | Direction: down is favorable. Delta: count. | Red — use `className="border-l-4 border-red-500"` |
| 4 | **Above Max** | Count of SKUs where `onHand > maxQty` AND `maxQty > 0` | Direction: down is favorable. Delta: count. | Blue — use `className="border-l-4 border-blue-500"` |
| 5 | **No Parameters** | Count of `ParameterStatus.NOT_SET` records | Direction: down is favorable. Delta: count. | Gray — use `className="border-l-4 border-slate-400"` |
| 6 | **Dollar Value at Risk** | `sum(unitCost * (minQty - onHand))` for all SKUs where `onHand < minQty` AND `minQty > 0`. Format as `$XXX,XXX`. | Direction: down is favorable. | Red — use `className="border-l-4 border-red-500"` |

**Data sources:** Join `parameters` (from context) with `MOCK_INVENTORY` (for `onHand`) and `MOCK_SKUS` (for `unitCost`, `isActive`).

---

## 5. Violation Filter Bar

**Location:** Below summary cards, above the table.

Uses the `FilterBar<string>` component with these options:

```typescript
const VIOLATION_FILTER_OPTIONS: FilterOption<string>[] = [
  {
    value: 'below-min',
    label: 'Below Min',
    activeColorClass: 'bg-red-100 text-red-800',
    count: belowMinCount, // computed dynamically
  },
  {
    value: 'above-max',
    label: 'Above Max',
    activeColorClass: 'bg-blue-100 text-blue-800',
    count: aboveMaxCount,
  },
  {
    value: 'no-params',
    label: 'No Parameters',
    activeColorClass: 'bg-slate-200 text-slate-700',
    count: noParamsCount,
  },
  {
    value: 'needs-review',
    label: 'Needs Review',
    activeColorClass: 'bg-amber-100 text-amber-800',
    count: needsReviewCount,
  },
];
```

**Props:** `label="Filter:"`, `showAll={true}`, multi-select enabled.

**Filter logic** (in `useParameterFilters` hook):
- `below-min`: include SKU if `onHand < minQty` AND `minQty > 0`
- `above-max`: include SKU if `onHand > maxQty` AND `maxQty > 0`
- `no-params`: include SKU if `parameterStatus === ParameterStatus.NOT_SET`
- `needs-review`: include SKU if `parameterStatus === ParameterStatus.NEEDS_REVIEW`
- When multiple filters are selected, union the matching sets (OR logic).
- When no filters are selected ("All"), show all rows.

A `SearchInput` is rendered inline to the right of the FilterBar, filtering by part number or description substring match (case-insensitive).

---

## 6. Parameter Table

**File:** `ParameterTable.tsx`

Wraps `DataTable<ParameterTableRow>` with the full column set. The component joins data from `ParameterContext`, `MOCK_INVENTORY`, and `MOCK_SKUS` into a denormalized row type for table rendering.

### 6.1 Row Type

```typescript
interface ParameterTableRow {
  skuId: string;
  partNumber: string;
  description: string;
  productLine: string;
  onHand: number;
  minQty: number;
  maxQty: number;
  safetyStockQty: number;
  reorderPoint: number;
  targetCsl: number;
  leadTimeDays: number;
  parameterStatus: ParameterStatus;
  daysOfSupply: number;
  unitCost: number;
  /** Whether this row has a below-min violation */
  isBelowMin: boolean;
  /** Whether this row has an above-max violation */
  isAboveMax: boolean;
}
```

### 6.2 Column Definitions

| # | Column | Header | Width | Sortable | Cell Renderer | Notes |
|---|--------|--------|-------|----------|---------------|-------|
| 1 | `partNumber` | Part # | 120px | Yes | `<Link to={/sku/${skuId}} className="text-navy-600 hover:text-navy-800 font-medium">{partNumber}</Link>` | Clickable, navigates to SKU Detail page |
| 2 | `description` | Description | 200px | Yes | Truncated text with tooltip on overflow | `text-sm text-slate-700` |
| 3 | `productLine` | Product Line | 130px | Yes | Plain text | `text-sm text-slate-600` |
| 4 | `onHand` | On Hand | 80px | Yes | Numeric, right-aligned. Red text if `isBelowMin`, blue text if `isAboveMax`. | `font-mono tabular-nums text-right` |
| 5 | `gauge` | Position | 140px | No | `<InlineInventoryGauge>` | Compact gauge |
| 6 | `minQty` | Min | 70px | Yes | `<InlineEditCell>` | Editable |
| 7 | `maxQty` | Max | 70px | Yes | `<InlineEditCell>` | Editable |
| 8 | `safetyStockQty` | Safety Stock | 85px | Yes | `<InlineEditCell>` | Editable |
| 9 | `reorderPoint` | ROP | 70px | Yes | `<InlineEditCell>` | Editable |
| 10 | `targetCsl` | CSL% | 70px | Yes | `<InlineEditCell>` with `%` suffix | Editable |
| 11 | `leadTimeDays` | Lead Time | 80px | Yes | `<InlineEditCell>` with `days` suffix | Editable |
| 12 | `parameterStatus` | Status | 100px | Yes | `<ParameterStatusBadge>` | From Spec 05 |
| 13 | `toggle` | Source | 90px | No | `<SystemOverrideToggle>` | Per-row toggle |
| 14 | `daysOfSupply` | DOS | 60px | Yes | Numeric, right-aligned. Color-coded: red < 7, amber 7-14, green > 14. | `font-mono tabular-nums text-right` |
| 15 | `expand` | | 40px | No | Chevron icon to expand/collapse `ChangeHistoryPanel` | `ChevronRight` / `ChevronDown` from lucide-react |

### 6.3 Row Styling

- Rows where `isBelowMin === true`: left border `border-l-4 border-red-400` and faint red background `bg-red-50/30`.
- Rows where `isAboveMax === true`: left border `border-l-4 border-blue-400` and faint blue background `bg-blue-50/30`.
- Rows where `parameterStatus === NOT_SET`: left border `border-l-4 border-slate-300` and faint gray background `bg-slate-50/30`.
- Rows where `parameterStatus === NEEDS_REVIEW`: left border `border-l-4 border-amber-400` and faint amber background `bg-amber-50/30`.
- Normal rows: no left border.

### 6.4 Default Sort

Sort by `parameterStatus` priority (NEEDS_REVIEW first, then NOT_SET, then violations, then remainder), then by `daysOfSupply` ascending within each group.

### 6.5 Pagination

Use `DataTable` default pagination with `pageSize={20}`.

---

## 7. InlineEditCell

**File:** `InlineEditCell.tsx`

A table cell that displays a read-only value by default and transforms into an editable input on click.

### 7.1 Props

```typescript
interface InlineEditCellProps {
  /** Current value */
  value: number;
  /** System-recommended value (shown as placeholder hint) */
  systemValue: number | null;
  /** Callback when value is committed */
  onSave: (newValue: number) => void;
  /** Whether the cell is read-only (true when parameterStatus is SYSTEM_CALCULATED) */
  readOnly: boolean;
  /** Optional suffix displayed after the value (e.g., "%", "days") */
  suffix?: string;
  /** Validation error message, if any */
  validationError?: string;
}
```

### 7.2 Display Mode (Default)

```
<td className="px-4 py-3 text-sm font-mono tabular-nums text-right">
  <div className="flex items-center justify-end gap-1">
    <span className={readOnly ? 'text-blue-700' : 'text-slate-900'}>
      {value === 0 ? '—' : formatNumber(value)}{suffix}
    </span>
    {systemValue !== null && systemValue !== value && !readOnly && (
      <Tooltip content={`System recommends: ${formatNumber(systemValue)}${suffix ?? ''}`}>
        <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
      </Tooltip>
    )}
  </div>
</td>
```

- Read-only cells (SYSTEM_CALCULATED) show blue text, no hover cursor.
- Editable cells show `cursor-pointer` on hover and a subtle `hover:bg-navy-50` background.
- Zero values display as an em-dash `—` to visually indicate "not set".

### 7.3 Edit Mode (On Click)

When clicked (and `readOnly === false`):

```
<td className="px-1 py-1">
  <input
    type="number"
    autoFocus
    value={editValue}
    placeholder={systemValue?.toString() ?? ''}
    onChange={handleChange}
    onBlur={handleSave}
    onKeyDown={handleKeyDown}  // Enter → save, Escape → cancel, Tab → save and move
    className={`
      w-full px-2 py-1.5 text-sm font-mono text-right
      border rounded-md
      focus:ring-2 focus:ring-navy-500 focus:border-navy-500
      ${validationError ? 'border-red-500 bg-red-50' : 'border-slate-300'}
    `}
  />
  {validationError && (
    <p className="text-xs text-danger-500 mt-0.5">{validationError}</p>
  )}
</td>
```

**Placeholder:** Shows the system-recommended value in gray when the input is empty, giving the buyer a one-click way to see what the system suggests.

### 7.4 Keyboard Behavior

| Key | Action |
|-----|--------|
| `Enter` | Commit value, exit edit mode |
| `Escape` | Discard changes, exit edit mode |
| `Tab` | Commit value, move focus to next editable cell in the row |
| `Shift+Tab` | Commit value, move focus to previous editable cell in the row |

Tab navigation cycles through the editable cells within a row: Min -> Max -> Safety Stock -> ROP -> CSL% -> Lead Time.

---

## 8. SystemOverrideToggle

**File:** `SystemOverrideToggle.tsx`

A compact toggle switch that controls whether a SKU's parameters are system-managed or buyer-overridden.

### 8.1 Props

```typescript
interface SystemOverrideToggleProps {
  /** Current parameter status */
  status: ParameterStatus;
  /** Callback to toggle source */
  onToggle: (useSystem: boolean) => void;
  /** Whether the toggle is disabled (e.g., for NOT_SET rows) */
  disabled: boolean;
}
```

### 8.2 Visual Design

```
<div className="flex items-center gap-1.5">
  <button
    onClick={() => onToggle(!isSystem)}
    disabled={disabled}
    className={`
      relative inline-flex h-5 w-9 items-center rounded-full
      transition-colors duration-200
      ${disabled ? 'bg-slate-200 cursor-not-allowed' : isSystem ? 'bg-blue-500' : 'bg-green-500'}
    `}
    aria-label={isSystem ? 'Using system values' : 'Using manual override'}
  >
    <span className={`
      inline-block h-3.5 w-3.5 rounded-full bg-white shadow
      transition-transform duration-200
      ${isSystem ? 'translate-x-1' : 'translate-x-4'}
    `} />
  </button>
  <span className={`text-xs font-medium ${isSystem ? 'text-blue-700' : 'text-green-700'}`}>
    {isSystem ? 'Sys' : 'Ovr'}
  </span>
</div>
```

### 8.3 Behavior

- `isSystem` is derived: `status === ParameterStatus.SYSTEM_CALCULATED`.
- **Disabled** when `status === ParameterStatus.NOT_SET` (nothing to toggle — parameters must be set first). The toggle renders grayed-out.
- When toggling **to System**: all editable cells in the row become read-only and display system-calculated values (blue text). Context `toggleSource(skuId, true)` is called.
- When toggling **to Override**: cells become editable (green border ring). Context `toggleSource(skuId, false)` is called. Values remain at their current levels (buyer may then adjust).
- `NEEDS_REVIEW` status: toggle renders in the "System" position but with amber coloring (`bg-amber-500`). Toggling to Override acknowledges the review and sets status to `BUYER_OVERRIDE`.

---

## 9. InlineInventoryGauge

**File:** `InlineInventoryGauge.tsx`

A compact version of the `InventoryGauge` (Spec 06 §4.3) sized to fit within a table row.

### 9.1 Props

```typescript
interface InlineInventoryGaugeProps {
  onHand: number;
  min: number;
  safetyStock: number;
  reorderPoint: number;
  max: number;
}
```

### 9.2 Visual Design

- Fixed height: `h-6` (24px).
- No header text or threshold labels (those are in separate columns).
- Only renders the colored bar zones and the on-hand marker line.
- Wrapped in a `Tooltip` that shows: `"On Hand: {onHand} | Min: {min} | ROP: {reorderPoint} | Max: {max}"`.
- When all parameter values are zero (`min === 0 && max === 0`), renders a gray placeholder bar with text "No params" in `text-xs text-slate-400`.

### 9.3 Rendering

Delegates to `InventoryGauge` with `barHeight={20}` and hides the header and threshold labels via a wrapper:

```tsx
<div className="w-full min-w-[100px]">
  {max > 0 ? (
    <Tooltip content={`On Hand: ${onHand} | Min: ${min} | ROP: ${reorderPoint} | Max: ${max}`}>
      <InventoryGauge
        onHand={onHand}
        min={min}
        safetyStock={safetyStock}
        reorderPoint={reorderPoint}
        max={max}
        barHeight={20}
        className="[&>div:first-child]:hidden [&>div:last-child]:hidden"
      />
    </Tooltip>
  ) : (
    <div className="h-5 bg-slate-100 rounded flex items-center justify-center">
      <span className="text-xs text-slate-400">No params</span>
    </div>
  )}
</div>
```

---

## 10. BulkImportModal

**File:** `BulkImportModal.tsx`

A modal for pasting tab-separated parameter data from a spreadsheet. This is a demo-only illustration of the bulk import workflow.

### 10.1 Props

```typescript
interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}
```

### 10.2 Layout

Uses the `Modal` component (Spec 05 §3.13) with `size="lg"`.

**Header:** "Import Parameters from Spreadsheet"

**Body — Step 1: Paste Data**

```
<div className="space-y-4">
  <p className="text-sm text-slate-600">
    Paste tab-separated values from Excel or Google Sheets. Expected columns:
  </p>
  <div className="flex gap-2 flex-wrap">
    {['Part Number', 'Min Qty', 'Max Qty', 'Safety Stock', 'Reorder Point', 'Target CSL%', 'Lead Time Days'].map(col => (
      <span key={col} className="px-2 py-0.5 text-xs font-mono bg-slate-100 rounded">{col}</span>
    ))}
  </div>
  <textarea
    value={pasteContent}
    onChange={handlePaste}
    placeholder="Paste tab-separated values here..."
    className="w-full h-40 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg
               focus:ring-2 focus:ring-navy-500 focus:border-navy-500
               placeholder:text-slate-400"
  />
</div>
```

**Body — Step 2: Preview Table (shown after paste)**

A compact read-only table showing the parsed data:

| Part # | Min | Max | Safety Stock | ROP | CSL% | Lead Time | Status |
|--------|-----|-----|-------------|-----|------|-----------|--------|
| Parsed values... | | | | | | | Valid / Error icon |

- Each row is validated: part number must exist in `MOCK_SKUS`, numeric fields must be positive integers, constraint `safetyStock <= min < reorderPoint < max` must hold.
- Valid rows show a green checkmark. Invalid rows show a red X with a tooltip explaining the error.
- Summary line: `"X of Y rows valid. Z errors."`

**Footer:**

```
<div className="flex items-center justify-between">
  <span className="text-sm text-slate-500">{validCount} of {totalCount} rows valid</span>
  <div className="flex gap-3">
    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
      Cancel
    </button>
    <button
      onClick={handleApply}
      disabled={validCount === 0}
      className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Apply {validCount} Rows
    </button>
  </div>
</div>
```

### 10.3 Parsing Logic

1. Split paste content by newlines.
2. Split each line by tabs.
3. Map columns positionally: `[partNumber, minQty, maxQty, safetyStockQty, reorderPoint, targetCsl, leadTimeDays]`.
4. Parse numeric values with `parseInt`. Non-numeric values are flagged as errors.
5. Validate constraints per row (see Section 14).
6. On "Apply", call `bulkUpdate()` from ParameterContext with valid rows only.
7. Close modal after apply.

### 10.4 Demo Pre-fill

Include a "Load Example" link button below the textarea that populates it with 5 sample rows of realistic tab-separated data for demonstration purposes.

---

## 11. ChangeHistoryPanel

**File:** `ChangeHistoryPanel.tsx`

An expandable panel that appears below a table row when the row's expand chevron is clicked. Shows the parameter change history log for that SKU.

### 11.1 Props

```typescript
interface ChangeHistoryPanelProps {
  skuId: string;
  history: ParameterChangeEvent[];
}
```

### 11.2 Layout

Renders as a full-width row spanning all columns, with a light gray background:

```
<tr>
  <td colSpan={15} className="bg-slate-50 px-6 py-4 border-b border-slate-200">
    <div className="max-w-3xl">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">Parameter Change History</h4>
      {history.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No changes recorded.</p>
      ) : (
        <div className="space-y-2">
          {history.map((event, i) => (
            <div key={i} className="flex items-start gap-4 text-sm">
              <span className="text-slate-400 font-mono text-xs whitespace-nowrap w-36">
                {formatDateTime(event.timestamp)}
              </span>
              <SourceBadge source={event.source} />
              <span className="text-slate-600">
                <span className="font-medium">{event.changedBy}</span>
                {' changed '}
                <span className="font-mono text-slate-800">{event.field}</span>
                {' from '}
                <span className="font-mono line-through text-danger-500">{event.oldValue}</span>
                {' to '}
                <span className="font-mono font-semibold text-green-700">{event.newValue}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </td>
</tr>
```

### 11.3 SourceBadge (inline)

A micro-badge showing the change source:

| ParameterSource | Label | Color |
|----------------|-------|-------|
| `SYSTEM_AUTO` | `SYS` | `bg-blue-100 text-blue-700` |
| `BUYER_MANUAL` | `BYR` | `bg-green-100 text-green-700` |
| `EPICOR_IMPORT` | `EPC` | `bg-violet-100 text-violet-700` |
| `NONE` | `—` | `bg-slate-100 text-slate-400` |

### 11.4 Pre-seeded History

For demo richness, the mock data seeds 2-3 `ParameterChangeEvent` entries per BUYER_OVERRIDE and NEEDS_REVIEW SKU. Example events:

- `2026-01-15T10:00:00Z` — SYSTEM_AUTO set `minQty` from `0` to `150`
- `2026-02-20T14:30:00Z` — STEVES (BUYER_MANUAL) changed `minQty` from `150` to `180`
- `2026-03-25T09:15:00Z` — SYSTEM_AUTO recalculated `reorderPoint` from `300` to `420` (triggers NEEDS_REVIEW)

---

## 12. ExportButton

**File:** `ExportButton.tsx`

### 12.1 Props

```typescript
interface ExportButtonProps {
  /** Current (filtered) parameter data to export */
  data: ParameterTableRow[];
}
```

### 12.2 Visual

```
<button
  onClick={handleExport}
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
             text-slate-700 bg-white border border-slate-300 rounded-lg
             hover:bg-slate-50 transition-colors"
>
  <Download className="h-4 w-4" />
  Export CSV
</button>
```

Icon: `Download` from lucide-react.

### 12.3 Export Logic (`parameterCsvExport.ts`)

```typescript
function generateParameterCsv(data: ParameterTableRow[]): string {
  const headers = [
    'Part Number', 'Description', 'Product Line', 'On Hand',
    'Min Qty', 'Max Qty', 'Safety Stock', 'Reorder Point',
    'Target CSL%', 'Lead Time Days', 'Status', 'Days of Supply',
  ];
  const rows = data.map(row => [
    row.partNumber, row.description, row.productLine, row.onHand,
    row.minQty, row.maxQty, row.safetyStockQty, row.reorderPoint,
    row.targetCsl, row.leadTimeDays, row.parameterStatus, row.daysOfSupply,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
```

Trigger download via `Blob` + `URL.createObjectURL` + temporary `<a>` element with `download="inventory_parameters.csv"`.

---

## 13. useParameterFilters Hook

**File:** `useParameterFilters.ts`

Encapsulates all filter, search, and count logic for the page.

### 13.1 Interface

```typescript
interface UseParameterFiltersReturn {
  /** Currently selected violation filters */
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
  /** Current search query */
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Filtered and searchable data rows */
  filteredData: ParameterTableRow[];
  /** Violation counts for filter badges */
  counts: {
    belowMin: number;
    aboveMax: number;
    noParams: number;
    needsReview: number;
    total: number;
  };
  /** Dollar value at risk */
  dollarValueAtRisk: number;
  /** Percentage of parts with parameters set */
  parametersSetPct: number;
}
```

### 13.2 Logic

1. Join `parameters` (from context) with `MOCK_INVENTORY` on `skuId` and `MOCK_SKUS` on `skuId` to produce `ParameterTableRow[]`.
2. Compute violation flags: `isBelowMin = onHand < minQty && minQty > 0`, `isAboveMax = onHand > maxQty && maxQty > 0`.
3. Compute counts for each violation category.
4. Apply filter: if `selectedFilters` is empty, return all rows. Otherwise, union rows matching any selected filter.
5. Apply search: filter by `partNumber` or `description` containing `searchQuery` (case-insensitive).
6. Return filtered data and counts.

---

## 14. Validation Rules (`parameterValidation.ts`)

**File:** `frontend/src/lib/parameterValidation.ts`

### 14.1 Constraint Rules

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;  // field name → error message
}

function validateParameters(params: {
  minQty: number;
  maxQty: number;
  safetyStockQty: number;
  reorderPoint: number;
  targetCsl: number;
  leadTimeDays: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (params.minQty < 0) errors.minQty = 'Min must be >= 0';
  if (params.maxQty < 0) errors.maxQty = 'Max must be >= 0';
  if (params.safetyStockQty < 0) errors.safetyStockQty = 'Safety stock must be >= 0';
  if (params.reorderPoint < 0) errors.reorderPoint = 'ROP must be >= 0';

  // Only validate relationships when values are non-zero (non-zero means "set")
  if (params.minQty > 0 && params.maxQty > 0) {
    if (params.safetyStockQty > params.minQty) {
      errors.safetyStockQty = `Safety stock (${params.safetyStockQty}) must be <= min (${params.minQty})`;
    }
    if (params.minQty >= params.reorderPoint && params.reorderPoint > 0) {
      errors.minQty = `Min (${params.minQty}) must be < ROP (${params.reorderPoint})`;
    }
    if (params.reorderPoint >= params.maxQty) {
      errors.reorderPoint = `ROP (${params.reorderPoint}) must be < max (${params.maxQty})`;
    }
  }

  if (params.targetCsl < 0 || params.targetCsl > 100) {
    errors.targetCsl = 'CSL must be between 0 and 100';
  }
  if (params.leadTimeDays < 0) {
    errors.leadTimeDays = 'Lead time must be >= 0';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

### 14.2 Integration with InlineEditCell

When the user saves a value via `InlineEditCell`, the page runs `validateParameters` on the full row and passes any relevant error message to the cell's `validationError` prop. The error message renders below the input (or below the displayed value if not in edit mode) in `text-xs text-danger-500`.

Validation is also run on each row in the `BulkImportModal` preview table.

---

## 15. Page Composition — InventoryParametersPage

**File:** `InventoryParametersPage.tsx`

### 15.1 Layout

```tsx
export function InventoryParametersPage() {
  return (
    <ParameterProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Inventory Parameters"
          description="Manage min/max, safety stock, and reorder points for all active parts."
        />

        {/* Summary Cards */}
        <CoverageSummaryCards />

        {/* Filter Bar + Search + Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <ViolationFilterBar />
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by part number or description..."
              className="w-72"
            />
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={filteredData} />
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                         text-white bg-navy-700 rounded-lg hover:bg-navy-600 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import Parameters
            </button>
          </div>
        </div>

        {/* Parameter Table */}
        <ParameterTable data={filteredData} />

        {/* Bulk Import Modal */}
        <BulkImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
        />
      </div>
    </ParameterProvider>
  );
}
```

Icons: `Upload` from lucide-react.

### 15.2 Data Flow

```
MOCK_INVENTORY_PARAMETERS ──→ ParameterContext (mutable state)
MOCK_INVENTORY ──────────────→ useParameterFilters (join for onHand, daysOfSupply)
MOCK_SKUS ───────────────────→ useParameterFilters (join for unitCost, productLine, description)
MOCK_SAFETY_STOCK ───────────→ ParameterContext.systemRecommendations (read-only hints)

ParameterContext ──→ CoverageSummaryCards (computed KPIs)
                  ──→ ViolationFilterBar (counts)
                  ──→ ParameterTable (row data)
                  ──→ InlineEditCell (onSave → context.updateParameter)
                  ──→ SystemOverrideToggle (onToggle → context.toggleSource)
                  ──→ BulkImportModal (onApply → context.bulkUpdate)
                  ──→ ChangeHistoryPanel (changeHistory)
                  ──→ ExportButton (current filtered data)
```

### 15.3 URL Query Parameters

The page reads URL search parameters on mount via `useSearchParams()` to support drill-down navigation from other pages (see Spec 16 §3.2, §3.4.2).

| Parameter | Values | Behavior |
|-----------|--------|----------|
| `sku` | Part number string (e.g., `1100031-1`) | Pre-fills the `SearchInput` value, filtering the table to show only that SKU |
| `violation` | `below-min`, `above-max`, `not-set` | Pre-selects the corresponding violation filter button in the FilterBar |
| `productLine` | Product line name (e.g., `Pedestal Systems`) | Filters the table to show only SKUs in that product line |
| `source` | Source node enum value (e.g., `SCHECO_SHANGHAI`) | Filters the table to show only SKUs from that source node |

**Implementation:**

```typescript
const [searchParams] = useSearchParams();

// On mount, initialize filters from URL params
useEffect(() => {
  const sku = searchParams.get('sku');
  const violation = searchParams.get('violation');
  const productLine = searchParams.get('productLine');
  const source = searchParams.get('source');

  if (sku) setSearchValue(sku);
  if (violation) setSelectedViolation(violation);
  if (productLine) setProductLineFilter(productLine);
  if (source) setSourceFilter(source as SourceNode);
}, [searchParams]);
```

When multiple parameters are provided, all filters apply simultaneously (AND logic). The `sku` search input takes precedence over other filters if it narrows to a single result.

---

## 16. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `xl` (1280px+) | 6 summary cards in a single row. Full table with all columns visible. |
| `lg` (1024px–1279px) | 3 summary cards per row (2 rows). Table hides Description and Product Line columns. |
| `md` (768px–1023px) | 2 summary cards per row (3 rows). Table enters horizontal scroll mode. Filter bar wraps. |
| Below 768px | Not a target — Kernel §7.1 specifies min 1024px. |

---

## 17. Placeholder Markers

| Location | Marker | Note |
|----------|--------|------|
| `ParameterContext.tsx` — `updateParameter` | `// API_PLACEHOLDER: POST /api/inventory-parameters/:skuId` | Real mutation endpoint |
| `ParameterContext.tsx` — `bulkUpdate` | `// API_PLACEHOLDER: POST /api/inventory-parameters/bulk` | Bulk update endpoint |
| `ParameterContext.tsx` — initialization | `// MOCK: Replace with useQuery fetch from /api/inventory-parameters` | Data loading |
| `BulkImportModal.tsx` — apply | `// EPICOR_PLACEHOLDER: Integration with Epicor 10 PartPlant import` | Epicor MRP import |
| `ExportButton.tsx` — export | `// API_PLACEHOLDER: GET /api/inventory-parameters/export?format=csv` | Server-side export |
| `ChangeHistoryPanel.tsx` — history | `// API_PLACEHOLDER: GET /api/inventory-parameters/:skuId/history` | Audit log endpoint |

---

## 18. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Page renders at `/inventory/parameters` with PageHeader, 6 summary cards, filter bar, search input, and parameter table | Navigate to route; visual inspection |
| 2 | Summary cards display correct computed values: total parts, % parameters set, below-min count, above-max count, no-params count, dollar value at risk | Cross-reference with mock data; verify math |
| 3 | FilterBar renders 4 violation buttons with dynamic counts. Clicking "Below Min" shows only rows where `onHand < minQty`. Multi-select unions results. "All" clears filters. | Click each filter; verify row counts match badge counts |
| 4 | SearchInput filters table rows by part number or description substring (case-insensitive). Clearing search restores full filtered set. | Type partial part number; verify table updates |
| 5 | ParameterTable renders all 15 columns with correct formatting: part number as clickable link, numeric columns right-aligned with `font-mono`, ParameterStatusBadge with correct colors, InlineInventoryGauge per row | Visual inspection of rendered table |
| 6 | Clicking a part number navigates to `/sku/:id` via React Router | Click part number; verify URL change |
| 7 | Clicking an editable cell (min, max, safety stock, ROP, CSL, lead time) transforms it into a focused number input with system-recommended value as placeholder. Enter commits value. Escape cancels. Tab advances to next editable cell in the row. | Click cell; type value; press Enter; verify update persists in table |
| 8 | After inline edit: ParameterStatusBadge updates to "Override" (green), SystemOverrideToggle flips to "Ovr", ChangeHistoryPanel gains a new entry with timestamp, field, old/new values | Edit a cell; expand history; verify new event |
| 9 | SystemOverrideToggle: toggling to "Sys" replaces editable values with system-recommended values (blue text, read-only). Toggling to "Ovr" makes cells editable again. Toggle is disabled for NOT_SET rows. | Toggle switch on a BUYER_OVERRIDE row; verify values change to system recommendations |
| 10 | InlineInventoryGauge renders colored bar zones (red/amber/green/blue) with on-hand marker. For NOT_SET rows, shows "No params" placeholder. | Visual inspection across row types |
| 11 | Validation: setting `min > reorderPoint` or `safetyStock > min` or `reorderPoint >= max` shows inline red error text below the cell. Invalid values are not committed via context. | Enter invalid value (e.g., min=500, max=100); verify error message appears |
| 12 | BulkImportModal opens on "Import Parameters" button click. Pasting tab-separated data populates preview table. Invalid rows show red X with error tooltip. "Apply" button updates only valid rows and closes modal. | Open modal; paste data; verify preview; click Apply; verify table updates |
| 13 | "Load Example" link in BulkImportModal pre-fills textarea with 5 sample rows | Click link; verify textarea populated |
| 14 | ChangeHistoryPanel expands on chevron click, showing chronological change events with timestamp, user, field, old/new values, and source badge. Collapses on second click. | Click expand chevron on BUYER_OVERRIDE row; verify history entries; click again to collapse |
| 15 | Export CSV button generates and downloads a file named `inventory_parameters.csv` containing headers and all currently visible (filtered) rows | Click Export; verify file download with correct content |
| 16 | Row styling: below-min rows have red left border + faint red background. Above-max rows have blue left border. NOT_SET rows have gray left border. NEEDS_REVIEW rows have amber left border. | Visual inspection of rows matching each condition |
| 17 | All parameter mutations (inline edit, toggle, bulk import) persist during the browser session via ParameterContext. Navigating away and back to the page retains changes. | Edit a value; navigate to another page; return; verify edit persists |
| 18 | Default sort: NEEDS_REVIEW rows appear first, then NOT_SET, then violation rows, then normal rows. Within each group, sorted by days-of-supply ascending. | Verify initial table sort order |
| 19 | Navigating to `/inventory/parameters?violation=below-min` pre-applies the "Below Min" filter on page load | Navigate with query param; verify filter is active and table shows only below-min SKUs |
| 20 | Navigating to `/inventory/parameters?sku=1100031-1` pre-fills the search input and filters to that SKU | Navigate with query param; verify search input has value and table shows only that SKU |
