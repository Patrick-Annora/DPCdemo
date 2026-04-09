# Spec 17 — Vitest Test Plan

**Status:** Draft
**Depends on:** Spec 01 (Project Setup — Vitest config), Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data), Spec 05 (Common Components), Spec 06 (Chart Components), Spec 07 (Action Center), Spec 08 (Alerts Dashboard), Spec 09 (SKU Detail), Spec 10 (Forecast Overview), Spec 11 (KPI Dashboards), Spec 12 (Inventory Parameters), Spec 13 (BOM Explorer), Spec 14 (Pipeline Status)
**Kernel refs:** §2.1 (Stack — Vitest), §3 (Domain Model — enums, entities), §5 (Demo Data Requirements — distributions, counts, constraints), §6 (Routes)
**CLAUDE.md ref:** §6 (Quality Enforcement Rules — `npm run test -- --run`)

---

## 1. Overview

This spec defines the complete Vitest test suite for the Springfield Marine demand planning frontend demo. Tests are organized into five tiers: mock data integrity, common component behavior, chart component rendering, page-level smoke tests, and interaction/navigation tests. Every test file mirrors the `src/` directory structure using colocated `__tests__/` directories.

On completion, `npm run test -- --run` passes with zero failures and covers all major interaction flows defined in Specs 07–14.

---

## 2. Test Infrastructure

### 2.1 Existing Vitest Config (from Spec 01)

The Vitest configuration established in Spec 01 §5.5 is used as-is:

- **Environment:** `jsdom`
- **Globals:** `true` (no need to import `describe`, `it`, `expect`)
- **Setup file:** `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- **CSS:** `true` (CSS imports do not throw)
- **Path alias:** `@/` resolves to `src/`

No changes to `vitest.config.ts` are required.

### 2.2 Additional Dev Dependency

Install `@testing-library/user-event` for interaction tests:

```bash
cd frontend && npm install -D @testing-library/user-event@^14.0.0
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@testing-library/user-event` | `^14.0.0` | Simulates real user interactions (click, type, keyboard) with proper event sequencing |

### 2.3 Custom Test Render Wrapper

**File:** `frontend/src/test/render.tsx`

A custom `render` function that wraps every component under test with the same provider stack the real app uses. This ensures tests exercise components in their actual runtime context.

```tsx
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route entries for MemoryRouter (default: ['/']) */
  initialEntries?: MemoryRouterProps['initialEntries'];
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function AllProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode;
  initialEntries?: MemoryRouterProps['initialEntries'];
}) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render that wraps the component in:
 * - QueryClientProvider (fresh client per test — no shared cache)
 * - MemoryRouter (in-memory routing — no browser history)
 *
 * Use this instead of the raw @testing-library/react render in every test.
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the default render with our custom one
export { customRender as render };
```

**Usage in tests:**

```tsx
// Import from test wrapper instead of @testing-library/react
import { render, screen } from '@/test/render';
```

### 2.4 Setup File Update

The existing `src/test/setup.ts` remains unchanged:

```ts
import '@testing-library/jest-dom/vitest';
```

No additional global setup is needed. The custom render wrapper handles provider injection per-test.

---

## 3. Test File Organization

All test files are colocated with their source files using `__tests__/` directories. This mirrors the `src/` structure and keeps tests discoverable next to the code they exercise.

```
frontend/src/
  data/
    __tests__/
      data-integrity.test.ts         # Mock data cross-reference and constraint tests
  components/
    common/
      __tests__/
        StatusBadge.test.tsx
        AlertSeverityBadge.test.tsx
        SourceNodeBadge.test.tsx
        ConfidenceScore.test.tsx
        DaysOfSupplyIndicator.test.tsx
        ParameterStatusBadge.test.tsx
        SearchInput.test.tsx
        FilterBar.test.tsx
        DataTable.test.tsx
        Modal.test.tsx
        SummaryCard.test.tsx
        PageHeader.test.tsx
        EmptyState.test.tsx
    charts/
      __tests__/
        ForecastChart.test.tsx
        DemandHistoryChart.test.tsx
        InventoryGauge.test.tsx
        FillRateChart.test.tsx
        DonutChart.test.tsx
        StackedBarChart.test.tsx
        BarChart.test.tsx
        AreaChart.test.tsx
        ScatterPlot.test.tsx
        TariffRoadmapChart.test.tsx
  pages/
    ActionCenter/
      __tests__/
        ActionCenterPage.test.tsx
    Alerts/
      __tests__/
        AlertsDashboardPage.test.tsx
    SkuDetail/
      __tests__/
        SkuDetailPage.test.tsx
    Forecast/
      __tests__/
        ForecastOverview.test.tsx
    InventoryParameters/
      __tests__/
        InventoryParametersPage.test.tsx
    BomExplorer/
      __tests__/
        BomExplorerPage.test.tsx
    Pipeline/
      __tests__/
        PipelineStatusPage.test.tsx
    Dashboard/
      __tests__/
        FillRateDashboard.test.tsx
        InventoryHealthDashboard.test.tsx
        LeadTimeDashboard.test.tsx
        ReshoringDashboard.test.tsx
        ArbitrageSavingsDashboard.test.tsx
  test/
    setup.ts                          # Already exists (Spec 01)
    render.tsx                        # Custom render wrapper (this spec)
    smoke.test.tsx                    # Already exists (Spec 01)
```

---

## 4. Mock Data Integrity Tests

**File:** `frontend/src/data/__tests__/data-integrity.test.ts`

These tests validate that all mock data files are internally consistent and satisfy the constraints defined in Kernel §5. They import the mock data constants directly — no rendering, no DOM, pure data assertions.

### 4.1 Cross-Reference Consistency

```typescript
import { describe, it, expect } from 'vitest';
import { MOCK_SKUS } from '@/data/skus';
import { MOCK_ALERTS } from '@/data/alerts';
import { MOCK_WORKLIST } from '@/data/worklist';
import { MOCK_DEMAND_HISTORY } from '@/data/demand-history';
import { MOCK_FORECASTS } from '@/data/forecasts';
import { MOCK_CLASSIFICATIONS } from '@/data/classifications';
import { MOCK_INVENTORY } from '@/data/inventory';
import { MOCK_INVENTORY_PARAMETERS } from '@/data/inventory-parameters';
import { MOCK_SAFETY_STOCK } from '@/data/safety-stock';
```

**Tests:**

| # | Test Name | Assertion |
|---|-----------|-----------|
| 1 | Every alert references a valid SKU | Every `skuId` in `MOCK_ALERTS` exists in `MOCK_SKUS` |
| 2 | Every worklist item references a valid SKU | Every `skuId` in `MOCK_WORKLIST` exists in `MOCK_SKUS` |
| 3 | Every SKU has demand history | Every `skuId` in `MOCK_SKUS` appears at least once in `MOCK_DEMAND_HISTORY` |
| 4 | Every SKU has a forecast | Every `skuId` in `MOCK_SKUS` appears at least once in `MOCK_FORECASTS` |
| 5 | Every SKU has a classification | Every `skuId` in `MOCK_SKUS` appears in `MOCK_CLASSIFICATIONS` |
| 6 | Every SKU has an inventory position | Every `skuId` in `MOCK_SKUS` appears in `MOCK_INVENTORY` |
| 7 | Every SKU has inventory parameters | Every `skuId` in `MOCK_SKUS` appears in `MOCK_INVENTORY_PARAMETERS` |
| 8 | No orphan records | No `skuId` in demand history, forecasts, classifications, or inventory references a non-existent SKU |

**Implementation pattern:**

```typescript
describe('Cross-reference consistency', () => {
  const skuIds = new Set(MOCK_SKUS.map(s => s.skuId));

  it('every alert references a valid SKU', () => {
    for (const alert of MOCK_ALERTS) {
      expect(skuIds.has(alert.skuId)).toBe(true);
    }
  });

  it('every worklist item references a valid SKU', () => {
    for (const item of MOCK_WORKLIST) {
      expect(skuIds.has(item.skuId)).toBe(true);
    }
  });

  it('every SKU has demand history', () => {
    const historySkus = new Set(MOCK_DEMAND_HISTORY.map(d => d.skuId));
    for (const sku of MOCK_SKUS) {
      expect(historySkus.has(sku.skuId)).toBe(true);
    }
  });

  // ... same pattern for forecasts, classifications, inventory, parameters
});
```

### 4.2 Enum Validation

| # | Test Name | Assertion |
|---|-----------|-----------|
| 1 | All demand classes are valid enum values | Every `demandClass` in `MOCK_CLASSIFICATIONS` is a member of `DemandClass` |
| 2 | All alert levels are valid enum values | Every `alertLevel` in `MOCK_ALERTS` is a member of `AlertLevel` |
| 3 | All algorithms are valid enum values | Every `algorithm` in `MOCK_FORECASTS` is a member of `ForecastAlgorithm` |
| 4 | All action types are valid enum values | Every `actionType` in `MOCK_WORKLIST` is a member of `ActionType` |
| 5 | All worklist statuses are valid enum values | Every `status` in `MOCK_WORKLIST` is a member of `WorklistStatus` |
| 6 | All source nodes are valid enum values | Every `sourceNode` in `MOCK_SKUS` is a member of `SourceNode` |
| 7 | All parameter statuses are valid enum values | Every `parameterStatus` in `MOCK_INVENTORY_PARAMETERS` is a member of `ParameterStatus` |
| 8 | All parameter sources are valid enum values | Every `source` in `MOCK_INVENTORY_PARAMETERS` is a member of `ParameterSource` |

**Implementation pattern:**

```typescript
import {
  DemandClass, AlertLevel, ForecastAlgorithm, ActionType,
  WorklistStatus, SourceNode, ParameterStatus, ParameterSource,
} from '@/lib/types';

describe('Enum validation', () => {
  const demandClasses = Object.values(DemandClass);

  it('all demand classes are valid enum values', () => {
    for (const c of MOCK_CLASSIFICATIONS) {
      expect(demandClasses).toContain(c.demandClass);
    }
  });

  // ... same pattern for all enums
});
```

### 4.3 Inventory Parameter Constraints

Per Kernel §5.4: `safetyStock <= min < ROP < max` for all SKUs that have parameters set (status is not `NOT_SET`).

| # | Test Name | Assertion |
|---|-----------|-----------|
| 1 | Safety stock does not exceed min | For every parameter record where `parameterStatus !== 'NOT_SET'`: `safetyStockQty <= minQty` |
| 2 | Min is less than reorder point | For every parameter record where `parameterStatus !== 'NOT_SET'`: `minQty < reorderPoint` |
| 3 | Reorder point is less than max | For every parameter record where `parameterStatus !== 'NOT_SET'`: `reorderPoint < maxQty` |
| 4 | Safety stock is non-negative | For every parameter record: `safetyStockQty >= 0` |

**Implementation:**

```typescript
describe('Inventory parameter constraints', () => {
  const activeParams = MOCK_INVENTORY_PARAMETERS.filter(
    p => p.parameterStatus !== ParameterStatus.NOT_SET
  );

  it('safety stock does not exceed min for active parameters', () => {
    for (const p of activeParams) {
      expect(p.safetyStockQty).toBeLessThanOrEqual(p.minQty);
    }
  });

  it('min < reorder point for active parameters', () => {
    for (const p of activeParams) {
      expect(p.minQty).toBeLessThan(p.reorderPoint);
    }
  });

  it('reorder point < max for active parameters', () => {
    for (const p of activeParams) {
      expect(p.reorderPoint).toBeLessThan(p.maxQty);
    }
  });
});
```

### 4.4 BOM Tree Validation

| # | Test Name | Assertion |
|---|-----------|-----------|
| 1 | BOM children reference valid part numbers | Every `partNumber` in any BOM tree child node exists either in `MOCK_SKUS` or within the BOM tree itself (sub-assemblies may not be in the SKU catalog) |
| 2 | No circular BOM references | A recursive walk of each BOM tree terminates (no node appears as its own descendant) |
| 3 | BOM levels are sequential | Each child node's `level` is exactly `parent.level + 1` |

**Implementation pattern:**

```typescript
import { MOCK_BOMS } from '@/data/bom';
import type { BomNode } from '@/lib/types';

describe('BOM tree validation', () => {
  function collectPartNumbers(node: BomNode): string[] {
    const parts = [node.partNumber];
    for (const child of node.children ?? []) {
      parts.push(...collectPartNumbers(child));
    }
    return parts;
  }

  function assertNoCircularRefs(node: BomNode, ancestors: Set<string> = new Set()) {
    expect(ancestors.has(node.partNumber)).toBe(false);
    ancestors.add(node.partNumber);
    for (const child of node.children ?? []) {
      assertNoCircularRefs(child, new Set(ancestors));
    }
  }

  it('no circular BOM references', () => {
    for (const bom of MOCK_BOMS) {
      assertNoCircularRefs(bom);
    }
  });

  function assertLevels(node: BomNode, expectedLevel: number) {
    expect(node.level).toBe(expectedLevel);
    for (const child of node.children ?? []) {
      assertLevels(child, expectedLevel + 1);
    }
  }

  it('BOM levels are sequential', () => {
    for (const bom of MOCK_BOMS) {
      assertLevels(bom, 0);
    }
  });
});
```

### 4.5 Distribution Checks (Kernel §5.4 and §5.5)

| # | Test Name | Assertion |
|---|-----------|-----------|
| 1 | Parameter status distribution: ~40% NOT_SET | Count of `NOT_SET` records is between 35% and 45% of total |
| 2 | Parameter status distribution: ~30% SYSTEM_CALCULATED | Count is between 25% and 35% |
| 3 | Parameter status distribution: ~20% BUYER_OVERRIDE | Count is between 15% and 25% |
| 4 | Parameter status distribution: ~10% NEEDS_REVIEW | Count is between 5% and 15% |
| 5 | Worklist count is 15–25 items | `MOCK_WORKLIST.length` is between 15 and 25 |
| 6 | Alert count is 8–12 items | `MOCK_ALERTS.length` is between 8 and 12 |
| 7 | At least 2 CRITICAL alerts | Count of CRITICAL alerts >= 2 |
| 8 | At least 1 EXCESS alert | Count of EXCESS alerts >= 1 |
| 9 | At least 2 SET_PARAMETERS worklist items | Count of `SET_PARAMETERS` action type >= 2 |
| 10 | At least 2 REVIEW_MIN_VIOLATION worklist items | Count of `REVIEW_MIN_VIOLATION` action type >= 2 |

**Implementation:**

```typescript
describe('Distribution checks per Kernel §5.4 and §5.5', () => {
  const total = MOCK_INVENTORY_PARAMETERS.length;

  it('~40% of parameters are NOT_SET', () => {
    const count = MOCK_INVENTORY_PARAMETERS.filter(
      p => p.parameterStatus === ParameterStatus.NOT_SET
    ).length;
    const pct = (count / total) * 100;
    expect(pct).toBeGreaterThanOrEqual(35);
    expect(pct).toBeLessThanOrEqual(45);
  });

  it('worklist has 15–25 items', () => {
    expect(MOCK_WORKLIST.length).toBeGreaterThanOrEqual(15);
    expect(MOCK_WORKLIST.length).toBeLessThanOrEqual(25);
  });

  it('alerts have 8–12 items', () => {
    expect(MOCK_ALERTS.length).toBeGreaterThanOrEqual(8);
    expect(MOCK_ALERTS.length).toBeLessThanOrEqual(12);
  });

  it('at least 2 CRITICAL alerts', () => {
    const count = MOCK_ALERTS.filter(a => a.alertLevel === AlertLevel.CRITICAL).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('at least 1 EXCESS alert', () => {
    const count = MOCK_ALERTS.filter(a => a.alertLevel === AlertLevel.EXCESS).length;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('at least 2 SET_PARAMETERS worklist items', () => {
    const count = MOCK_WORKLIST.filter(w => w.actionType === ActionType.SET_PARAMETERS).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('at least 2 REVIEW_MIN_VIOLATION worklist items', () => {
    const count = MOCK_WORKLIST.filter(w => w.actionType === ActionType.REVIEW_MIN_VIOLATION).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
```

---

## 5. Common Component Tests

**Directory:** `frontend/src/components/common/__tests__/`

Every common component defined in Spec 05 has a corresponding test file. All tests use the custom render wrapper from `@/test/render`.

### 5.1 StatusBadge.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Component mounts and renders the label text |
| 2 | Displays the label prop | `screen.getByText(label)` is in the document |
| 3 | Applies background and text color classes | The rendered `<span>` element has the `bgColor` and `textColor` classes |
| 4 | Applies border class when borderColor is provided | When `borderColor="border-green-500"` is passed, the element has both `border` and `border-green-500` classes |
| 5 | Does not render border when borderColor is omitted | The element does not have the `border` class |

### 5.2 AlertSeverityBadge.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing for each AlertLevel | Mount with each of `CRITICAL`, `WARNING`, `WATCH`, `EXCESS` — no throw |
| 2 | CRITICAL renders red styling | Element contains `bg-red-50` or equivalent Kernel §7.2 red classes |
| 3 | WARNING renders amber styling | Element contains amber classes per Kernel §7.2 |
| 4 | WATCH renders yellow styling | Element contains yellow classes per Kernel §7.2 |
| 5 | EXCESS renders blue styling | Element contains blue classes per Kernel §7.2 |
| 6 | Displays the level as text | `screen.getByText(/critical/i)` is in the document when level is CRITICAL |

### 5.3 SourceNodeBadge.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing for each SourceNode | Mount with `SCHECO_SHANGHAI`, `NIXA_MO`, `SHARK_NZ` — no throw |
| 2 | SCHECO_SHANGHAI renders navy styling | Element has navy class per Spec 02 §4.4 |
| 3 | NIXA_MO renders success styling | Element has success class per Spec 02 §4.4 |
| 4 | SHARK_NZ renders violet styling | Element has violet class per Kernel §7.3 |

### 5.4 ConfidenceScore.test.tsx

Tests color grading at the exact threshold boundaries defined in the UI specification.

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Component mounts with a numeric score |
| 2 | Score of 59 renders red/danger color | Below 60% threshold — danger styling applied |
| 3 | Score of 60 renders amber/warning color | At 60% threshold — transitions to warning |
| 4 | Score of 79 renders amber/warning color | Still in warning band (60–79%) |
| 5 | Score of 80 renders green/success color | At 80% threshold — transitions to success |
| 6 | Score of 98 renders green/success color | Well above threshold — success styling |
| 7 | Displays the score value as text | `screen.getByText(/98/)` is present |

### 5.5 DaysOfSupplyIndicator.test.tsx

Tests color grading at the boundary values for days-of-supply severity.

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Component mounts with a numeric days value |
| 2 | 6 days renders red/critical color | Below 7-day threshold — critical styling |
| 3 | 7 days renders amber/warning color | At 7-day threshold — transitions to warning |
| 4 | 14 days renders amber/warning color | Still in warning band (7–29 days) |
| 5 | 30 days renders green/healthy color | At 30-day threshold — transitions to healthy |
| 6 | 60 days renders green/healthy color | Comfortable supply level |
| 7 | Displays the days value as text | The number is visible in the rendered output |

### 5.6 ParameterStatusBadge.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders correct color for NOT_SET | Gray styling per Kernel §4.7 |
| 2 | Renders correct color for SYSTEM_CALCULATED | Blue styling |
| 3 | Renders correct color for BUYER_OVERRIDE | Green styling |
| 4 | Renders correct color for NEEDS_REVIEW | Amber styling |

### 5.7 SearchInput.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Input element is in the document |
| 2 | Fires onChange after debounce delay | Type "test" into the input, use `vi.advanceTimersByTime()` to advance past the debounce, assert the `onChange` callback was called with "test" |
| 3 | Does not fire onChange before debounce completes | Type "te", advance time less than debounce, assert callback was NOT called |
| 4 | Resets debounce on continued typing | Type "te", wait half the debounce, type "st", advance full debounce — callback called once with "test" |

**Implementation note:** Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.

### 5.8 FilterBar.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Filter buttons are visible |
| 2 | Clicking a filter button calls onFilterChange | Click "CRITICAL" button — callback invoked with the selected value |
| 3 | Clicking a selected filter deselects it | Click "CRITICAL" (select), click again (deselect) — callback reflects empty selection |
| 4 | "All" button clears all selections | Select "CRITICAL" and "WARNING", click "All" — callback invoked with empty array (all shown) |
| 5 | Selected filters show active visual state | Selected button has a distinguishable class (e.g., `bg-*-100` or equivalent active indicator) |

### 5.9 DataTable.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Table element is in the document |
| 2 | Renders correct number of columns | Column headers match provided column definitions |
| 3 | Renders correct number of rows | Row count matches provided data length (for first page) |
| 4 | Sorts ascending on header click | Click a sortable column header — first row changes to the expected ascending-sort value |
| 5 | Sorts descending on second header click | Click same header again — order reverses |
| 6 | Paginates when data exceeds page size | Provide 25 rows with page size 10 — only 10 rows visible, pagination controls present |
| 7 | Clicking "Next" shows next page | Click next — rows 11–20 are now visible |
| 8 | Empty state renders when no data | Provide empty array — empty state component or message is shown |

### 5.10 Modal.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing when open | Modal content is visible when `isOpen={true}` |
| 2 | Does not render content when closed | Modal content is not in the document when `isOpen={false}` |
| 3 | Closes on backdrop click | Click the backdrop overlay — `onClose` callback is invoked |
| 4 | Closes on Escape key | Press Escape — `onClose` callback is invoked |
| 5 | Does not close on content click | Click inside the modal content area — `onClose` is NOT invoked |

### 5.11 SummaryCard.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Card is in the document |
| 2 | Displays label and value | Both the label text and value text are visible |
| 3 | Shows trend indicator | Trend direction and delta text are rendered |

### 5.12 PageHeader.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Header is in the document |
| 2 | Displays title and subtitle | Both strings are visible |
| 3 | Renders action slot when provided | Custom action button passed as `actions` prop is rendered |

### 5.13 EmptyState.test.tsx

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without crashing | Empty state message is in the document |
| 2 | Displays the message prop | The provided text is visible |

---

## 6. Chart Component Tests

**Directory:** `frontend/src/components/charts/__tests__/`

Chart tests focus on render-without-crash and structural assertions. Recharts renders SVG elements, so assertions check for SVG structure rather than pixel-level rendering.

**Note:** Recharts requires `ResizeObserver` in jsdom. Add a global mock in each chart test file (or in setup) if needed:

```typescript
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
```

### 6.1 Test Matrix

| File | Tests |
|------|-------|
| **ForecastChart.test.tsx** | (1) Renders without crashing with sample forecast data. (2) Renders correct number of Line/Area elements: 1 history series, 1 P50 line, 2 shaded interval areas (P10/P90, P2.5/P97.5). (3) Renders with empty data without crashing. |
| **DemandHistoryChart.test.tsx** | (1) Renders without crashing with 24 months of sample data. (2) Renders with empty data without crashing. |
| **InventoryGauge.test.tsx** | (1) Renders without crashing with sample inventory data. (2) Renders red zone when on-hand is below min. (3) Renders green zone when on-hand is between reorder point and max. (4) Renders blue zone when on-hand exceeds max. |
| **FillRateChart.test.tsx** | (1) Renders without crashing. (2) Renders with empty data without crashing. |
| **DonutChart.test.tsx** | (1) Renders without crashing. (2) Displays center label text when provided. |
| **StackedBarChart.test.tsx** | (1) Renders without crashing. (2) Renders with empty data without crashing. |
| **BarChart.test.tsx** | (1) Renders without crashing. (2) Renders with empty data without crashing. |
| **AreaChart.test.tsx** | (1) Renders without crashing. (2) Renders with empty data without crashing. |
| **ScatterPlot.test.tsx** | (1) Renders without crashing. (2) Renders with empty data without crashing. |
| **TariffRoadmapChart.test.tsx** | (1) Renders without crashing with tariff projection data. (2) Renders with empty data without crashing. |

### 6.2 Sample Data Pattern

Each chart test defines minimal inline sample data rather than importing the full mock datasets. This keeps chart tests isolated from data layer changes.

```typescript
const sampleForecastData = [
  { period: '2026-01' as DateString, p50: 100, p10: 80, p90: 120, p2_5: 60, p97_5: 140 },
  { period: '2026-02' as DateString, p50: 110, p10: 88, p90: 132, p2_5: 66, p97_5: 154 },
  // ... minimal set to exercise rendering
];
```

---

## 7. Page-Level Smoke Tests

**Directory:** `frontend/src/pages/<Page>/__tests__/`

Every page has a smoke test that verifies it mounts without crashing when wrapped in the custom test providers. Pages that consume route params use the custom render's `initialEntries` option to provide a valid route.

### 7.1 Smoke Test Matrix

| Page File | Test File | initialEntries | Key Assertions |
|-----------|-----------|----------------|----------------|
| `ActionCenterPage` | `ActionCenterPage.test.tsx` | `['/']` | (1) Renders without crashing. (2) Renders the worklist table. (3) Table shows correct row count matching `MOCK_WORKLIST` items with `PENDING` status. (4) Summary cards are visible. |
| `AlertsDashboardPage` | `AlertsDashboardPage.test.tsx` | `['/alerts']` | (1) Renders without crashing. (2) Alert cards are rendered. (3) Severity filter toggle buttons are visible. (4) Severity summary cards show correct counts. |
| `SkuDetailPage` | `SkuDetailPage.test.tsx` | `['/sku/<first-mock-sku-id>']` | (1) Renders without crashing with a valid SKU ID from `MOCK_SKUS[0].skuId`. (2) Displays the part number and description. (3) Inventory position section is visible. (4) Renders the demand history chart section. |
| `ForecastOverview` | `ForecastOverview.test.tsx` | `['/forecast']` | (1) Renders without crashing. (2) Summary cards are visible (Weighted MAPE, FVA, Total SKUs, Ensemble Activations). (3) At least one chart container is rendered. |
| `InventoryParametersPage` | `InventoryParametersPage.test.tsx` | `['/inventory/parameters']` | (1) Renders without crashing. (2) Parameter table is rendered. (3) Coverage summary cards are visible. (4) Filter buttons are present (Below Min, Above Max, No Parameters, Needs Review, All). |
| `BomExplorerPage` | `BomExplorerPage.test.tsx` | `['/bom']` | (1) Renders without crashing. (2) BOM selector/dropdown is visible. (3) Selecting a BOM renders a tree view. |
| `PipelineStatusPage` | `PipelineStatusPage.test.tsx` | `['/pipeline']` | (1) Renders without crashing. (2) Pipeline health cards are visible. (3) Summary cards (Records 24h, Error Rate, etc.) are rendered. |
| `FillRateDashboard` | `FillRateDashboard.test.tsx` | `['/dashboard/fill-rate']` | (1) Renders without crashing. |
| `InventoryHealthDashboard` | `InventoryHealthDashboard.test.tsx` | `['/dashboard/inventory']` | (1) Renders without crashing. |
| `LeadTimeDashboard` | `LeadTimeDashboard.test.tsx` | `['/dashboard/lead-time']` | (1) Renders without crashing. |
| `ReshoringDashboard` | `ReshoringDashboard.test.tsx` | `['/dashboard/reshoring']` | (1) Renders without crashing. |
| `ArbitrageSavingsDashboard` | `ArbitrageSavingsDashboard.test.tsx` | `['/dashboard/arbitrage']` | (1) Renders without crashing. |

### 7.2 Route Param Injection for SkuDetailPage

The SKU Detail page reads `:id` from the URL. The test must render inside a route that provides this param:

```typescript
import { render, screen } from '@/test/render';
import { Routes, Route } from 'react-router';
import SkuDetailPage from '../SkuDetailPage';
import { MOCK_SKUS } from '@/data/skus';

describe('SkuDetailPage', () => {
  const testSkuId = MOCK_SKUS[0]!.skuId;

  it('renders without crashing with a valid SKU', () => {
    render(
      <Routes>
        <Route path="/sku/:id" element={<SkuDetailPage />} />
      </Routes>,
      { initialEntries: [`/sku/${testSkuId}`] },
    );
    expect(screen.getByText(testSkuId)).toBeInTheDocument();
  });
});
```

---

## 8. Interaction Tests

These tests simulate real user actions using `@testing-library/user-event` and assert that local state mutations are reflected in the DOM.

### 8.1 Action Center Interactions

**File:** `frontend/src/pages/ActionCenter/__tests__/ActionCenterPage.test.tsx` (appended to the smoke test file)

| # | Test | Steps | Assertion |
|---|------|-------|-----------|
| 1 | Approve a worklist item | (1) Render ActionCenterPage. (2) Find a PENDING worklist row. (3) Click its "Approve" button. | The row's status badge changes to "APPROVED". |
| 2 | Approve with low confidence triggers justification modal | (1) Find a row with confidence < 70%. (2) Click "Approve". | Justification modal appears (modal heading visible). |
| 3 | Bulk select and approve | (1) Check 3 row checkboxes. (2) Click "Approve Selected" button. (3) Confirm in the bulk approval modal. | All 3 rows show "APPROVED" status. The "Approve Selected" button disappears (no selection). |
| 4 | Defer a worklist item | (1) Find a PENDING row. (2) Click "Defer". | Row status changes to "DEFERRED". |

**Implementation pattern:**

```typescript
import { render, screen, within } from '@/test/render';
import userEvent from '@testing-library/user-event';
import ActionCenterPage from '../ActionCenterPage';

describe('Action Center interactions', () => {
  it('approve a worklist item updates status to APPROVED', async () => {
    const user = userEvent.setup();
    render(<ActionCenterPage />);

    // Find a pending row and its approve button
    const rows = screen.getAllByRole('row');
    const pendingRow = rows.find(row =>
      within(row).queryByText(/pending/i)
    );
    expect(pendingRow).toBeDefined();

    const approveButton = within(pendingRow!).getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    // Status should now show APPROVED
    expect(within(pendingRow!).getByText(/approved/i)).toBeInTheDocument();
  });
});
```

### 8.2 Alerts Dashboard Interactions

**File:** `frontend/src/pages/Alerts/__tests__/AlertsDashboardPage.test.tsx`

| # | Test | Steps | Assertion |
|---|------|-------|-----------|
| 1 | Acknowledge an alert | (1) Render AlertsDashboardPage. (2) Find an unacknowledged alert card. (3) Click "Acknowledge". (4) Confirm in modal if required. | The alert card shows an acknowledged state (timestamp or "Acknowledged" badge visible). |
| 2 | Filter by severity | (1) Render page. (2) Click "CRITICAL" filter button. | Only CRITICAL alert cards are visible. Other severity cards are hidden. |
| 3 | "All" filter clears selection | (1) Click "CRITICAL" filter. (2) Click "All" button. | All alert cards are visible again. |

### 8.3 Inventory Parameters Interactions

**File:** `frontend/src/pages/InventoryParameters/__tests__/InventoryParametersPage.test.tsx`

| # | Test | Steps | Assertion |
|---|------|-------|-----------|
| 1 | Edit a min value | (1) Render InventoryParametersPage. (2) Find a row with an editable min cell. (3) Click to edit. (4) Clear and type a new value. (5) Press Enter or blur. | The cell displays the new value. |
| 2 | Toggle system/override changes status badge | (1) Find a row with `SYSTEM_CALCULATED` status. (2) Click the override toggle. | Status badge changes to `BUYER_OVERRIDE`. |
| 3 | Filter by violation | (1) Click "Below Min" filter button. | Only rows where on-hand < min are shown. Row count decreases. |

### 8.4 Implementation Notes for Interaction Tests

- Always create `userEvent.setup()` at the top of each test — this gives proper event sequencing.
- Use `within()` to scope queries to a specific row or card.
- Use `waitFor()` or `findBy*` queries when state updates are asynchronous.
- For inline edit cells, the pattern is: click to enter edit mode, clear the input, type the new value, blur or press Enter to commit.

---

## 9. Navigation Tests

**File:** `frontend/src/test/navigation.test.tsx`

These tests verify that in-app links navigate to the correct routes. They render the full app router (or relevant page with routes) inside a `MemoryRouter`.

| # | Test | Steps | Assertion |
|---|------|-------|-----------|
| 1 | Worklist part number links to SKU detail | (1) Render ActionCenterPage with routes. (2) Click a part number link in the worklist. | URL changes to `/sku/<partNumber>`. SKU detail page content is visible. |
| 2 | Alert part number links to SKU detail | (1) Render AlertsDashboardPage with routes. (2) Click a part number link in an alert card. | URL changes to `/sku/<partNumber>`. SKU detail page content is visible. |
| 3 | Sidebar "Action Center" navigates to / | (1) Render app with sidebar. (2) Click "Action Center" in sidebar. | Action Center page content is visible. |
| 4 | Sidebar "Alerts" navigates to /alerts | (1) Click "Alerts" in sidebar. | Alerts page content is visible. |
| 5 | Sidebar "Forecast" navigates to /forecast | (1) Click "Forecast" in sidebar. | Forecast page content is visible. |
| 6 | Sidebar "Inventory Parameters" navigates to /inventory/parameters | (1) Click "Inventory Parameters" in sidebar. | Inventory Parameters page content is visible. |
| 7 | Sidebar "BOM Explorer" navigates to /bom | (1) Click "BOM Explorer" in sidebar. | BOM Explorer page content is visible. |
| 8 | Sidebar "Pipeline" navigates to /pipeline | (1) Click "Pipeline Status" in sidebar. | Pipeline Status page content is visible. |

**Implementation pattern:**

```typescript
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import App from '@/App';

describe('Navigation', () => {
  it('sidebar "Alerts" navigates to /alerts', async () => {
    const user = userEvent.setup();
    render(<App />, { initialEntries: ['/'] });

    const alertsLink = screen.getByRole('link', { name: /alerts/i });
    await user.click(alertsLink);

    // Verify alerts page content loaded
    expect(screen.getByText(/alerts dashboard/i)).toBeInTheDocument();
  });
});
```

---

## 10. Recharts Test Utilities

Recharts uses `ResponsiveContainer` which relies on `ResizeObserver` and `getBoundingClientRect`. Both need mocking in jsdom.

**Add to `frontend/src/test/setup.ts`:**

```typescript
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Recharts ResponsiveContainer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock getBoundingClientRect for Recharts dimension calculations
Element.prototype.getBoundingClientRect = () => ({
  x: 0,
  y: 0,
  width: 800,
  height: 400,
  top: 0,
  right: 800,
  bottom: 400,
  left: 0,
  toJSON: () => {},
});
```

This ensures all chart components can render in the jsdom environment without dimension-related errors.

---

## 11. Test Count Summary

| Category | Files | Approx. Tests |
|----------|-------|---------------|
| Mock data integrity | 1 | ~25 |
| Common components | 13 | ~45 |
| Chart components | 10 | ~25 |
| Page smoke tests | 12 | ~30 |
| Interaction tests | 3 | ~12 |
| Navigation tests | 1 | ~8 |
| **Total** | **40** | **~145** |

---

## 12. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | `@testing-library/user-event` is installed | `npm ls @testing-library/user-event` shows the package |
| 2 | Custom render wrapper exists at `src/test/render.tsx` | File exists and exports `render`, `screen`, etc. |
| 3 | All test files follow the `__tests__/` directory convention | `find src -name '*.test.tsx' -o -name '*.test.ts'` shows files in `__tests__/` dirs |
| 4 | All data integrity tests pass | `npm run test -- --run src/data/__tests__/` exits 0 |
| 5 | All common component tests pass | `npm run test -- --run src/components/common/__tests__/` exits 0 |
| 6 | All chart component tests pass | `npm run test -- --run src/components/charts/__tests__/` exits 0 |
| 7 | All page smoke tests pass | `npm run test -- --run src/pages/` exits 0 |
| 8 | All interaction tests pass | Interaction tests within page `__tests__/` dirs pass |
| 9 | All navigation tests pass | `npm run test -- --run src/test/navigation.test.tsx` exits 0 |
| 10 | Full suite passes | `npm run test -- --run` exits 0 with zero failures |
| 11 | No test imports from `@testing-library/react` directly | All test files import from `@/test/render` instead (except `setup.ts` and `render.tsx` themselves) |
| 12 | Lint passes with test files included | `npm run lint` exits 0 |
| 13 | Type check passes with test files included | `npm run type-check` exits 0 |

---

## 13. Implementation Notes

- **No snapshot tests.** Snapshots are fragile and provide low signal for a rapidly evolving demo UI. All assertions are behavioral (text presence, class presence, interaction outcomes).
- **No coverage thresholds.** The goal is zero failing tests with meaningful coverage of all major flows, not a numeric coverage percentage. Coverage thresholds can be added later once the codebase stabilizes.
- **Test isolation.** Each test file creates a fresh render (fresh QueryClient, fresh MemoryRouter). No shared mutable state between tests. The `beforeEach`/`afterEach` pattern is used for timer mocks only.
- **Recharts mocking.** The global `ResizeObserver` and `getBoundingClientRect` mocks in `setup.ts` are sufficient for render-without-crash tests. Deep SVG assertions (e.g., counting `<path>` elements) are fragile and should be avoided — instead test for the presence of chart container elements or accessible labels.
- **ParameterContext in tests.** The InventoryParametersPage wraps itself in `ParameterProvider` (per Spec 12 §3.4). Tests render the page component directly — the provider is included automatically. No extra wrapping needed in the test render.
- **Mock data imports are real.** Tests import from `@/data/*` directly. No additional test fixtures are needed for page-level and integration tests — the mock data layer IS the fixture.
- **user-event over fireEvent.** All interaction tests use `@testing-library/user-event` (which simulates full browser event sequences) rather than the lower-level `fireEvent` from `@testing-library/react`. This catches more real-world bugs.
