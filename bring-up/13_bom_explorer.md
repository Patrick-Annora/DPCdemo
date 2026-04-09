# Spec 13 — BOM Explorer Page

**File:** `frontend/src/pages/BomExplorer/BomExplorerPage.tsx`
**Route:** `/bom`
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions — `BomNode`, `ArbitrageResult`, `SourceNode`), Spec 04 (Mock Data — `MOCK_BOMS`, `MOCK_ARBITRAGE`, `MOCK_TARIFF_PROJECTION`), Spec 05 (Common Components — `SourceNodeBadge`, `DataTable`, `StatusBadge`), Spec 06 (Chart Components — `TariffRoadmapChart`, `BarChart`)
**Kernel refs:** §4.6 (BOM Explorer), §2.2 (Project Structure — `pages/BomExplorer/`, `components/bom/`), §7.3 (Source Node Colors)
**SRD refs:** §3.1 (Multi-Level BOM Explosion), §3.2 (Reshoring Arbitrage Engine), §3.2.5 (Tariff Roadmap)

---

## 1. Overview

The BOM Explorer page provides a visual, interactive Bill of Materials exploration tool. Buyers and planners select a finished goods item, drill into its multi-level component tree, view gross/net requirements for any node, compare China landed cost vs. Nixa domestic cost, and see a 3-year tariff roadmap showing when SKUs flip to reshore-favorable. This is the primary interface for understanding dependent demand relationships and reshoring economics.

---

## 2. File Structure

```
frontend/src/
  pages/
    BomExplorer/
      BomExplorerPage.tsx       # Top-level page component, layout orchestrator
      index.ts                  # Re-export of BomExplorerPage
  components/
    bom/
      BomSelector.tsx           # Finished goods dropdown/card selector
      BomTree.tsx               # Recursive tree container with expand/collapse state
      BomTreeNode.tsx           # Single node row in the tree
      PhantomIndicator.tsx      # Visual marker for phantom assemblies
      RequirementsTable.tsx     # Gross/net requirements period-by-period table
      CostComparisonPanel.tsx   # CLC vs. NDC side-by-side breakdown
      TariffRoadmap.tsx         # Wrapper around TariffRoadmapChart with BOM-page data
      SharedComponentBadge.tsx  # "Used in X products" badge
      index.ts                 # Barrel export
```

---

## 3. Data Dependencies

### 3.1 Imports from Mock Data

```typescript
import { MOCK_BOMS } from '@/data/bom';
import { MOCK_ARBITRAGE, MOCK_TARIFF_PROJECTION } from '@/data/arbitrage';
import { MOCK_SKUS } from '@/data/skus';
import { MOCK_INVENTORY } from '@/data/inventory';
import { MOCK_FORECASTS } from '@/data/forecasts';
```

### 3.2 Derived Data — Requirements Computation

The page computes gross/net requirements locally from mock data. For the demo, requirements are derived as follows:

```typescript
// MOCK: Replace with API call to BOM explosion service
interface RequirementRow {
  period: DateString;
  grossRequirement: number;
  onHand: number;
  scheduledReceipts: number;
  netRequirement: number;
}
```

**Gross requirement** for a selected BOM node is computed by multiplying the finished good's P50 forecast by the cumulative `qtyPer` path from root to the selected node, inflated by scrap rates at each level:

```
grossRequirement(node, period) =
    forecast(root, period) * qtyPer(node) * (1 + scrapRate(node))
    * product of (qtyPer(ancestor) * (1 + scrapRate(ancestor))) for each ancestor
```

**Net requirement** follows SRD REQ-3.1.4:

```
netRequirement(node, period) =
    grossRequirement(node, period)
    - onHand(node)
    - scheduledReceipts(node, period)
```

For the demo, `onHand` is sourced from `MOCK_INVENTORY` (matched by `partNumber` if the node's part exists in `MOCK_SKUS`; otherwise use a hardcoded default of 0). Scheduled receipts are hardcoded at 0 for BOM-only parts and pulled from a small constructed dataset for parts that exist in `MOCK_SKUS`.

### 3.3 Derived Data — Shared Component Detection

Build a lookup map at page init time that scans all `MOCK_BOMS` trees recursively and counts how many distinct top-level (Level 0) BOMs each `partNumber` appears in:

```typescript
// MOCK: Replace with server-side where-used query
function buildSharedComponentMap(boms: BomNode[]): Map<string, string[]> {
  // Returns Map<partNumber, rootPartNumber[]>
  // e.g., "1100031-1" => ["3100531-L1", "3300750-A1"]
}
```

A component is "shared" when it appears in 2 or more top-level BOMs.

### 3.4 Derived Data — CLC/NDC Breakdown

For the cost comparison panel, the CLC and NDC are broken into line-item detail. Since `ArbitrageResult` stores only totals, the breakdown is constructed using the percentage splits from Spec 04 Section 12.2:

```typescript
interface CostBreakdownLine {
  label: string;
  amount: Currency;
}

interface CostBreakdown {
  clcLines: CostBreakdownLine[];   // 6 line items
  clcTotal: Currency;
  ndcLines: CostBreakdownLine[];   // 5 line items
  ndcTotal: Currency;
}
```

**CLC breakdown** (derived from `chinaLandedCost`):

| Line Item | % of CLC |
|-----------|----------|
| Factory Production | 35% |
| Ocean Freight | 12% |
| Section 301 Tariff | 25% |
| Insurance + Customs | 3% |
| Drayage + Last Mile | 5% |
| Carrying Cost (Transit) | 20% |

**NDC breakdown** (derived from `nixaDomesticCost`):

| Line Item | % of NDC |
|-----------|----------|
| Raw Material | 40% |
| Direct Labor | 25% |
| Machine Overhead | 15% |
| Facility Overhead | 12% |
| QC / Inspection | 8% |

---

## 4. Component Specifications

### 4.1 BomExplorerPage

The top-level page component. Manages all state and orchestrates layout.

**File:** `frontend/src/pages/BomExplorer/BomExplorerPage.tsx`

**State:**

```typescript
const [selectedBomIndex, setSelectedBomIndex] = useState<number>(0);
const [selectedNode, setSelectedNode] = useState<BomNode | null>(null);
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
```

`selectedBomIndex` indexes into `MOCK_BOMS`. When the user selects a new BOM, `selectedNode` resets to `null` and `expandedNodes` resets to a Set containing only the root node's `partNumber` (root starts expanded).

**URL Parameter: `?part=`**

The page reads the `part` query parameter on mount via `useSearchParams()`. When present, it locates the matching part across all BOM trees and auto-selects it:

1. Read `searchParams.get('part')` on mount.
2. If a `part` value is present, search `MOCK_BOMS` recursively (each BOM tree and all descendants) to find the `BomNode` whose `partNumber` matches.
3. If found:
   - Set `selectedBomIndex` to the index of the BOM containing that part.
   - Build the full ancestor path from root to the matching node and add all ancestor `partNumber` values to `expandedNodes`.
   - Set `selectedNode` to the matching `BomNode`.
4. If not found, ignore the parameter and load with default state (first BOM, no selection).

This supports the "View in BOM Explorer" link from SKU Detail (Spec 16 §3.3).

**Layout:**

```
+-----------------------------------------------------------+
| PageHeader: "BOM Explorer"                                |
+-----------------------------------------------------------+
| BomSelector (full width)                                  |
+-----------------------------------------------------------+
| Left (40%)              | Right (60%)                     |
| +---------------------+ | +-----------------------------+ |
| | BomTree             | | | Cost Comparison Panel       | |
| |                     | | | (or empty state if no       | |
| |                     | | |  arbitrage data)             | |
| |                     | | +-----------------------------+ |
| |                     | | | Tariff Roadmap               | |
| +---------------------+ | +-----------------------------+ |
+-----------------------------------------------------------+
| Requirements Table (full width, below split)              |
| (shown only when a node is selected)                      |
+-----------------------------------------------------------+
```

The two-column split uses Tailwind grid: `grid grid-cols-[2fr_3fr] gap-6`. Below the split, the requirements table spans full width.

**Rendering Rules:**

- If no node is selected, the right panel shows the cost comparison for the root finished good (if arbitrage data exists) and the tariff roadmap.
- When a non-root node is selected, the cost comparison panel is hidden (arbitrage data is only at FG level) and the right panel shows only the tariff roadmap. The requirements table below shows data for the selected node.
- If the selected BOM's root `partNumber` has no entry in `MOCK_ARBITRAGE`, the cost comparison panel shows an `EmptyState` with text "No arbitrage data available for this item."

---

### 4.2 BomSelector

A selector for choosing which finished goods BOM to explore. Renders as a row of selectable cards (not a dropdown) to give the demo a more visual feel.

**File:** `frontend/src/components/bom/BomSelector.tsx`

**Props:**

```typescript
interface BomSelectorProps {
  /** All available BOM trees (Level 0 nodes) */
  boms: BomNode[];
  /** Index of currently selected BOM */
  selectedIndex: number;
  /** Callback when a BOM card is clicked */
  onSelect: (index: number) => void;
}
```

**Visual Description:**

Horizontal row of cards, scrollable if needed (`flex gap-4 overflow-x-auto pb-2`).

Each card:

```
<button
  className={`
    flex-shrink-0 w-56 p-4 rounded-xl border-2 text-left transition-all
    ${isSelected
      ? 'border-navy-500 bg-navy-50 shadow-md'
      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}
  `}
>
  <p className="text-xs font-mono text-slate-500">{bom.partNumber}</p>
  <p className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2">{bom.description}</p>
  <div className="mt-2 flex items-center gap-2">
    <SourceNodeBadge source={bom.sourceNode} />
    <span className="text-xs text-slate-500">{countChildren(bom)} parts</span>
  </div>
</button>
```

`countChildren` recursively counts all descendants in the BOM tree.

---

### 4.3 BomTree

Container component that renders the recursive BOM tree with expand/collapse behavior.

**File:** `frontend/src/components/bom/BomTree.tsx`

**Props:**

```typescript
interface BomTreeProps {
  /** Root BOM node */
  root: BomNode;
  /** Currently selected node (highlighted), or null */
  selectedNode: BomNode | null;
  /** Set of part numbers that are currently expanded */
  expandedNodes: Set<string>;
  /** Map of partNumber => root partNumbers[] for shared component detection */
  sharedComponentMap: Map<string, string[]>;
  /** Callback when a node is clicked (selects it) */
  onNodeSelect: (node: BomNode) => void;
  /** Callback to toggle expand/collapse of a node */
  onToggleExpand: (partNumber: string) => void;
}
```

**Visual Description:**

Outer container with a card wrapper:

```
<div className="bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto max-h-[600px]">
  <BomTreeNode node={root} ... depth={0} />
</div>
```

The tree supports keyboard navigation: pressing `Enter` or `Space` on a focused node selects it; pressing `ArrowRight` expands, `ArrowLeft` collapses.

---

### 4.4 BomTreeNode

A single row in the BOM tree. Renders recursively for each child.

**File:** `frontend/src/components/bom/BomTreeNode.tsx`

**Props:**

```typescript
interface BomTreeNodeProps {
  /** The BOM node to render */
  node: BomNode;
  /** Indentation depth (0 = root) */
  depth: number;
  /** Whether this node is the currently selected node */
  isSelected: boolean;
  /** Whether this node is expanded (children visible) */
  isExpanded: boolean;
  /** Part numbers of the root BOMs this node appears in (for shared badge) */
  appearsIn: string[];
  /** Callback when this node row is clicked */
  onSelect: () => void;
  /** Callback to toggle expand/collapse */
  onToggle: () => void;
  /** Recursive children rendering — passed down from BomTree */
  children?: React.ReactNode;
}
```

**Visual Description:**

Each node row is a clickable `<div>` with left padding proportional to depth:

```
<div
  role="treeitem"
  tabIndex={0}
  aria-expanded={hasChildren ? isExpanded : undefined}
  aria-level={depth + 1}
  className={`
    flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
    ${isSelected ? 'bg-navy-50 ring-1 ring-navy-300' : 'hover:bg-slate-50'}
  `}
  style={{ paddingLeft: `${depth * 24 + 12}px` }}
  onClick={onSelect}
>
  {/* Expand/collapse chevron (only if node has children) */}
  {hasChildren ? (
    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5">
      {isExpanded
        ? <ChevronDown className="h-4 w-4 text-slate-400" />
        : <ChevronRight className="h-4 w-4 text-slate-400" />}
    </button>
  ) : (
    <span className="w-5" /> {/* spacer for leaf alignment */}
  )}

  {/* Phantom indicator (if applicable) */}
  {node.isPhantom && <PhantomIndicator />}

  {/* Part number */}
  <span className="text-sm font-mono text-slate-600 min-w-[140px]">{node.partNumber}</span>

  {/* Description */}
  <span className="text-sm text-slate-900 flex-1 truncate">{node.description}</span>

  {/* Qty per */}
  <span className="text-xs font-mono text-slate-500 min-w-[60px] text-right">
    x{node.qtyPer}
  </span>

  {/* Scrap rate */}
  <span className="text-xs font-mono text-slate-400 min-w-[50px] text-right">
    {(node.scrapRate * 100).toFixed(1)}%
  </span>

  {/* Source badge */}
  <SourceNodeBadge source={node.sourceNode} />

  {/* Shared component badge (if appears in 2+ BOMs) */}
  {appearsIn.length > 1 && (
    <SharedComponentBadge count={appearsIn.length} partNumbers={appearsIn} />
  )}
</div>
```

When `isExpanded` is true and the node has children, render each child as a `<BomTreeNode>` below with `depth + 1`.

---

### 4.5 PhantomIndicator

A small visual marker that distinguishes phantom (non-stocked) assemblies from regular components.

**File:** `frontend/src/components/bom/PhantomIndicator.tsx`

**Props:**

```typescript
interface PhantomIndicatorProps {
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

```
<span
  className={`
    inline-flex items-center gap-1
    px-1.5 py-0.5
    rounded
    border border-dashed border-slate-400
    bg-slate-50
    text-[10px] font-medium uppercase tracking-wider text-slate-500
    ${className ?? ''}
  `}
>
  <Ghost className="h-3 w-3" /> {/* Lucide Ghost icon */}
  Phantom
</span>
```

**Tooltip:** On hover, show a `Tooltip` (from Spec 05) with text: "Phantom assembly -- not stocked independently. Requirements pass through to child components."

---

### 4.6 SharedComponentBadge

A badge indicating that a component is used across multiple finished goods BOMs.

**File:** `frontend/src/components/bom/SharedComponentBadge.tsx`

**Props:**

```typescript
interface SharedComponentBadgeProps {
  /** Number of distinct BOMs this component appears in */
  count: number;
  /** Root part numbers of the BOMs this component appears in (for tooltip) */
  partNumbers: string[];
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

```
<span
  className={`
    inline-flex items-center gap-1
    px-2 py-0.5
    rounded-full
    bg-amber-100 text-amber-800
    text-[10px] font-semibold uppercase tracking-wide
    ${className ?? ''}
  `}
>
  <Link2 className="h-3 w-3" /> {/* Lucide Link2 icon */}
  Used in {count} products
</span>
```

**Tooltip:** On hover, show a `Tooltip` listing the root part numbers: "Shared across: 3100531-L1, 3300750-A1".

---

### 4.7 RequirementsTable

A period-by-period gross/net requirements table for the selected BOM node. Displays 6 months of forward-looking data.

**File:** `frontend/src/components/bom/RequirementsTable.tsx`

**Props:**

```typescript
interface RequirementsTableProps {
  /** The BOM node for which requirements are displayed */
  node: BomNode;
  /** Computed requirements data rows (6 monthly periods) */
  requirements: RequirementRow[];
  /** Optional additional CSS classes */
  className?: string;
}
```

**`RequirementRow` interface** (defined in `frontend/src/components/bom/types.ts`):

```typescript
interface RequirementRow {
  /** Period label in YYYY-MM format */
  period: DateString;
  /** Gross requirement (forecast * qty-per * scrap, exploded from root) */
  grossRequirement: number;
  /** Current on-hand inventory for this component */
  onHand: number;
  /** Scheduled receipts expected in this period */
  scheduledReceipts: number;
  /** Net requirement = gross - on-hand - scheduled receipts (floored at 0) */
  netRequirement: number;
}
```

**Visual Description:**

Card wrapper with a header:

```
<div className="bg-white rounded-xl border border-slate-200">
  <div className="px-6 py-4 border-b border-slate-100">
    <h3 className="text-lg font-semibold text-slate-900">
      Requirements: {node.partNumber} — {node.description}
    </h3>
    <p className="text-sm text-slate-500 mt-1">
      6-month forward requirements based on forecast explosion
    </p>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Period</th>
          <th className="px-4 py-3 text-right ...">Gross Req.</th>
          <th className="px-4 py-3 text-right ...">On-Hand</th>
          <th className="px-4 py-3 text-right ...">Sched. Receipts</th>
          <th className="px-4 py-3 text-right ...">Net Req.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {requirements.map(row => (
          <tr>
            <td className="px-4 py-3 text-sm font-mono text-slate-700">{formatPeriod(row.period)}</td>
            <td className="px-4 py-3 text-sm font-mono text-right text-slate-900">{row.grossRequirement}</td>
            <td className="px-4 py-3 text-sm font-mono text-right text-slate-600">{row.onHand}</td>
            <td className="px-4 py-3 text-sm font-mono text-right text-slate-600">{row.scheduledReceipts}</td>
            <td className={`px-4 py-3 text-sm font-mono text-right font-semibold
              ${row.netRequirement > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {row.netRequirement}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Behavior:**

- Net requirements > 0 are rendered in red (material needed), net requirements of 0 are green (covered).
- On-hand value is static across periods in the demo (same snapshot value repeated); in production this would be a projected running balance.
- The 6 periods span from the current month forward: 2026-04 through 2026-09.

---

### 4.8 CostComparisonPanel

Side-by-side comparison of China Landed Cost (CLC) vs. Nixa Domestic Cost (NDC) for the selected finished good, with line-item breakdown and arbitrage recommendation.

**File:** `frontend/src/components/bom/CostComparisonPanel.tsx`

**Props:**

```typescript
interface CostComparisonPanelProps {
  /** Arbitrage result for this finished good */
  arbitrage: ArbitrageResult;
  /** CLC line-item breakdown */
  clcBreakdown: CostBreakdownLine[];
  /** NDC line-item breakdown */
  ndcBreakdown: CostBreakdownLine[];
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

Card wrapper:

```
<div className="bg-white rounded-xl border border-slate-200">
  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
    <h3 className="text-lg font-semibold text-slate-900">Cost Comparison</h3>
    {/* Arbitrage recommendation badge */}
    <ArbitrageRecommendationBadge recommendation={arbitrage.recommendation} score={arbitrage.arbitrageScore} />
  </div>

  <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
    {/* Left column: CLC */}
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <SourceNodeBadge source={SourceNode.SCHECO_SHANGHAI} />
        <span className="text-sm font-semibold text-slate-700">China Landed Cost</span>
      </div>
      {clcBreakdown.map(line => (
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-slate-600">{line.label}</span>
          <span className="font-mono text-slate-900">${line.amount.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between pt-3 mt-3 border-t border-slate-200 font-semibold text-sm">
        <span className="text-slate-900">Total CLC</span>
        <span className="font-mono text-slate-900">${arbitrage.chinaLandedCost.toFixed(2)}</span>
      </div>
    </div>

    {/* Right column: NDC */}
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <SourceNodeBadge source={SourceNode.NIXA_MO} />
        <span className="text-sm font-semibold text-slate-700">Nixa Domestic Cost</span>
      </div>
      {ndcBreakdown.map(line => (
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-slate-600">{line.label}</span>
          <span className="font-mono text-slate-900">${line.amount.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between pt-3 mt-3 border-t border-slate-200 font-semibold text-sm">
        <span className="text-slate-900">Total NDC</span>
        <span className="font-mono text-slate-900">${arbitrage.nixaDomesticCost.toFixed(2)}</span>
      </div>
    </div>
  </div>
</div>
```

**Arbitrage Recommendation Badge** (inline helper, not a separate file):

| Recommendation | Background | Text | Border |
|---|---|---|---|
| `RESHORE` | `bg-emerald-100` | `text-emerald-800` | `border-emerald-300` |
| `DUAL_SOURCE` | `bg-amber-100` | `text-amber-800` | `border-amber-300` |
| `MAINTAIN_CHINA` | `bg-red-100` | `text-red-800` | `border-red-300` |

Badge text format: `"RESHORE +15.0%"` / `"DUAL SOURCE +2.0%"` / `"MAINTAIN CHINA -15.0%"` — the recommendation label followed by the arbitrage score with sign.

---

### 4.9 TariffRoadmap

A wrapper component that prepares the BOM-page-specific data and renders `TariffRoadmapChart` from Spec 06.

**File:** `frontend/src/components/bom/TariffRoadmap.tsx`

**Props:**

```typescript
interface TariffRoadmapProps {
  /** Optional additional CSS classes */
  className?: string;
}
```

**Data Preparation:**

The component constructs `tariffSteps` and `skuThresholds` from `MOCK_TARIFF_PROJECTION` and `MOCK_ARBITRAGE`:

```typescript
// Tariff escalation steps ($50 -> $95 -> $110 -> $140 per net-ton)
const tariffSteps: TariffStep[] = [
  { period: '2025-Q1', rate: 50 },
  { period: '2026-Q1', rate: 95 },
  { period: '2027-Q1', rate: 110 },
  { period: '2028-Q1', rate: 140 },
];

// SKU thresholds: for each RESHORE and DUAL_SOURCE arbitrage result,
// compute the tariff rate at which CLC exceeds NDC.
// For RESHORE SKUs, they've already flipped — show threshold below current rate.
// For DUAL_SOURCE, show threshold near current rate.
// For MAINTAIN_CHINA, show threshold above projected max.
const skuThresholds: SkuThreshold[] = [
  { label: '3100531-L1 Plug-In Pkg', thresholdRate: 72, color: '#10b981' },   // emerald — already reshored
  { label: '3300750-A1 Taper-Lock', thresholdRate: 78, color: '#10b981' },     // emerald — already reshored
  { label: '3100520-L1 Plug-In OEM', thresholdRate: 70, color: '#10b981' },    // emerald — already reshored
  { label: '1041030 Fish Pro Seat', thresholdRate: 92, color: '#f59e0b' },     // amber — flips near current
  { label: '1042030 Skipper Seat', thresholdRate: 125, color: '#ef4444' },     // red — flips at 2027 rate
  { label: '1270100 Pedestal Pkg', thresholdRate: 155, color: '#6b7280' },     // gray — never flips in range
];
```

**Visual Description:**

Card wrapper:

```
<div className="bg-white rounded-xl border border-slate-200">
  <div className="px-6 py-4 border-b border-slate-100">
    <h3 className="text-lg font-semibold text-slate-900">Tariff Escalation Roadmap</h3>
    <p className="text-sm text-slate-500 mt-1">
      3-year projection: dashed lines show when each SKU becomes reshore-favorable
    </p>
  </div>
  <div className="p-6">
    <TariffRoadmapChart
      tariffSteps={tariffSteps}
      skuThresholds={skuThresholds}
      yLabel="$/net-ton"
      height={320}
    />
  </div>
</div>
```

---

## 5. Page Behavior

### 5.1 Initial Load

1. Page renders with the first BOM (`MOCK_BOMS[0]`, Plug-In 2-3/8 Locking Package) selected.
2. Root node is expanded; all other nodes are collapsed.
3. No node is selected unless a `?part=` query parameter is present (see URL Parameter section above).
4. Right panel shows cost comparison for the root FG (if arbitrage data exists) and tariff roadmap.
5. Requirements table is hidden (no node selected).

### 5.2 BOM Selection

When the user clicks a different BOM card in the selector:

1. `selectedBomIndex` updates to the new index.
2. `selectedNode` resets to `null`.
3. `expandedNodes` resets to contain only the new root's `partNumber`.
4. Right panel updates to show the new FG's arbitrage data (or empty state).
5. Requirements table hides.

### 5.3 Node Selection

When the user clicks a node in the tree:

1. `selectedNode` updates to the clicked `BomNode`.
2. The node row highlights with `bg-navy-50 ring-1 ring-navy-300`.
3. The requirements table appears below the split layout, showing 6 months of gross/net data for the selected node.
4. If the selected node is the root (Level 0) and arbitrage data exists, the cost comparison panel remains visible.
5. If the selected node is a non-root node, the cost comparison panel hides (or remains showing the root FG data with a subtle "Showing FG-level costs" note).

### 5.4 Expand / Collapse

- Clicking the chevron on a node toggles its children visibility.
- Clicking the node row itself selects the node (does not toggle expand).
- The chevron button has `stopPropagation` to prevent selection when toggling.

### 5.5 Phantom Node Behavior

Phantom nodes display normally in the tree but have:
- A dashed border indicator (`PhantomIndicator` badge).
- Their children are always visible (auto-expanded) because phantom assemblies are "seen through" per SRD REQ-3.1.5.
- When selected, the requirements table shows a note: "Phantom assembly -- requirements pass through to stocked children."

---

## 6. Responsive Behavior

- Below 1280px viewport width, the tree/detail split switches from side-by-side to stacked (tree on top, detail panels below): `grid grid-cols-1 xl:grid-cols-[2fr_3fr]`.
- The BOM selector cards scroll horizontally on narrow viewports.
- The requirements table scrolls horizontally if columns overflow.
- The tree container has a max-height of 600px with vertical scroll to prevent the tree from pushing the page layout.

---

## 7. Accessibility

| Requirement | Implementation |
|---|---|
| Tree semantics | BomTree uses `role="tree"`, each BomTreeNode uses `role="treeitem"` with `aria-expanded` and `aria-level` |
| Keyboard navigation | Arrow keys navigate between nodes; Enter/Space selects; Right expands, Left collapses |
| Focus management | Selected node receives focus ring via `focus-visible:ring-2 focus-visible:ring-navy-500` |
| Screen reader labels | Phantom indicator includes `aria-label="Phantom assembly, not stocked"` |
| Color contrast | All text meets WCAG AA contrast ratios; red/green in requirements table is supplemented with font-weight (semibold for net requirement) |

---

## 8. Placeholder Markers

```typescript
// MOCK: BOM trees loaded from static MOCK_BOMS — replace with Epicor BOM API
// MOCK: Requirements computed client-side — replace with server-side BOM explosion service
// MOCK: Arbitrage data from MOCK_ARBITRAGE — replace with live CLC/NDC computation
// MOCK: Tariff steps hardcoded — replace with USTR tariff schedule API
// MOCK: Shared component detection via client scan — replace with server-side where-used query
// EPICOR_PLACEHOLDER: BOM revision sync from PartRev / PartMtl
// API_PLACEHOLDER: Real-time inventory position for net requirements
```

---

## 9. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | Page renders at `/bom` route with the BomSelector showing all 4 BOMs from `MOCK_BOMS` | Route navigation; visual inspection |
| 2 | Clicking a BOM card switches the tree view to that BOM's structure; tree resets to root-expanded state | Click each card; verify tree updates |
| 3 | BOM tree renders all levels (up to 4 deep per mock data) with correct indentation proportional to depth | Visual inspection; verify Level 2/3 nodes are indented further than Level 1 |
| 4 | Each tree node displays: part number, description, qty-per, scrap rate %, SourceNodeBadge | Visual inspection of any node row |
| 5 | Phantom assemblies (`PHANTOM-HW-KIT-01`, `CUSH-FP1-SET`) display the PhantomIndicator with dashed border and ghost icon | Visual inspection of BOM 1 and BOM 4 |
| 6 | Clicking a tree node highlights it and shows the RequirementsTable below the split layout with 6 monthly periods | Click a node; verify table appears with correct headers (Period, Gross Req., On-Hand, Sched. Receipts, Net Req.) |
| 7 | Gross requirements in the table reflect the forecast multiplied by the cumulative qty-per path from root to selected node | Manual calculation check: root forecast * qtyPer chain * (1+scrapRate) matches displayed gross |
| 8 | Net requirements > 0 are displayed in red; net requirements of 0 are displayed in green | Visual inspection of color-coding |
| 9 | CostComparisonPanel displays CLC and NDC side-by-side with 6 CLC line items and 5 NDC line items that sum to their respective totals | For BOM 1 (`3100531-L1`): CLC=$18.00, NDC=$15.30; verify line items sum correctly |
| 10 | Arbitrage recommendation badge shows correct color: RESHORE (green), DUAL_SOURCE (amber), MAINTAIN_CHINA (red) with signed score | Check `3100531-L1` shows green "RESHORE +15.0%"; check `1041030` shows amber |
| 11 | TariffRoadmap chart renders a stepped line from $50 to $140 over 4 data points with at least 5 horizontal SKU threshold reference lines | Visual inspection |
| 12 | SharedComponentBadge appears on `1100031-1` (Trac-Lock swivel) showing "Used in 2 products" and on `1641019` (Spring-Lock base) showing "Used in 2 products" | Navigate to BOM 1 or BOM 2; verify badge present on shared nodes |
| 13 | SharedComponentBadge tooltip lists the root part numbers of the BOMs the component appears in | Hover over badge on `1100031-1`; verify tooltip shows "3100531-L1, 3300750-A1" |
| 14 | `RM-AL6061-T6` (Aluminum Extrusion) shows SharedComponentBadge with "Used in 3 products" since it appears in BOMs 1, 2, and 3 | Navigate to any BOM containing this part; verify badge |
| 15 | Layout switches from side-by-side (tree left 40%, detail right 60%) to stacked below `xl` breakpoint (1280px) | Resize browser below 1280px; verify layout stacks |
| 16 | Tree container scrolls vertically when content exceeds 600px max-height | Expand all nodes in BOM 1; verify scroll appears |
| 17 | Selecting a BOM with no arbitrage data (none in current mock data, but verify graceful handling) shows EmptyState in cost comparison area | Verify the code path handles a missing arbitrage record |
| 18 | Expand/collapse chevron toggles child visibility without selecting the node | Click chevron on a parent node; verify children toggle but selectedNode does not change |
| 19 | All BOM component files exist at specified paths under `components/bom/` | File system check |
| 20 | No TypeScript errors: all props interfaces match the types from `lib/types.ts` and Spec 03 | `tsc --noEmit` passes |
| 21 | Navigating to `/bom?part=1100031-1` auto-selects that part, expands the tree path to it, and switches to the BOM containing it | Navigate with query param; verify node is selected and tree is expanded |
