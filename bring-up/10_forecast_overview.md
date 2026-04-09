# Spec 10 — Forecast Overview Page

**File:** `frontend/src/pages/Forecast/ForecastOverview.tsx`
**Route:** `/forecast`
**Depends on:** Spec 03 (Type Definitions), Spec 04 (Mock Data — `MOCK_FORECAST_ACCURACY`, `MOCK_CLASSIFICATIONS`, `MOCK_SKUS`, `MOCK_FORECASTS`, `MOCK_DEMAND_HISTORY`), Spec 05 (Common Components — `SummaryCard`, `DataTable`, `PageHeader`, `StatusBadge`), Spec 06 (Chart Components — `SimpleBarChart`, `DonutChart`, `ScatterPlot`)
**Kernel refs:** §4.4 (Forecast Overview), §7 (Design System)
**SRD refs:** §1.1 (Classification), §1.1.3 (Ensemble), §1.4 (Forecast Output), §1.4.3 (FVA)

---

## 1. Overview

The Forecast Overview page is the primary dashboard for evaluating model performance across all SKUs. It presents forecast accuracy metrics, algorithm comparisons, ensemble activation records, demand class distribution, and a predicted-vs-actual scatter plot. The page is read-only — no edit actions — and is driven entirely by `MOCK_FORECAST_ACCURACY`, `MOCK_CLASSIFICATIONS`, `MOCK_SKUS`, `MOCK_FORECASTS`, and `MOCK_DEMAND_HISTORY`.

---

## 2. File Structure

```
frontend/src/pages/Forecast/
  ForecastOverview.tsx        # Page component (this spec)
  index.ts                    # Barrel export
```

The page imports reusable components from `@/components/common` and `@/components/charts`. All data transformations (aggregation, sorting, filtering) happen inline within the component or in local helper functions — no hooks or external utilities are required for this page.

---

## 3. Page Layout

The page uses a single-column layout with a full-width content area inside the app shell.

```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: "Forecast Overview"                                │
│  Subtitle: "Model accuracy, algorithm comparison, and FVA"      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Weighted     │ │ FVA vs.     │ │ Total SKUs  │ │ Ensemble  │ │
│  │ MAPE         │ │ Naive       │ │ Forecasted  │ │ Activations│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐ ┌───────────────────────────────┐ │
│  │ MAPE by Demand Class      │ │ Classification Distribution   │ │
│  │ (BarChart)                │ │ (DonutChart)                  │ │
│  └───────────────────────────┘ └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐ ┌───────────────────────────────┐ │
│  │ Algorithm Comparison       │ │ Forecast Accuracy Scatter     │ │
│  │ (Grouped BarChart)        │ │ (ScatterPlot)                 │ │
│  └───────────────────────────┘ └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  FVA Table (DataTable — full width)                             │
├─────────────────────────────────────────────────────────────────┤
│  Worst Performers Table (DataTable — full width)                │
├─────────────────────────────────────────────────────────────────┤
│  Ensemble Triggers Table (DataTable — full width)               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Grid Implementation

```tsx
<div className="space-y-6">
  {/* Page Header */}
  <PageHeader title="Forecast Overview" subtitle="Model accuracy, algorithm comparison, and FVA" />

  {/* Summary Cards — 4 columns */}
  <div className="grid grid-cols-4 gap-4">
    {/* 4 SummaryCard components */}
  </div>

  {/* Charts Row 1 — 2 columns */}
  <div className="grid grid-cols-2 gap-6">
    {/* MAPE by Demand Class BarChart (left) */}
    {/* Classification Distribution DonutChart (right) */}
  </div>

  {/* Charts Row 2 — 2 columns */}
  <div className="grid grid-cols-2 gap-6">
    {/* Algorithm Comparison Grouped BarChart (left) */}
    {/* Forecast Accuracy ScatterPlot (right) */}
  </div>

  {/* Tables — full width, stacked */}
  {/* FVA Table */}
  {/* Worst Performers Table */}
  {/* Ensemble Triggers Table */}
</div>
```

---

## 4. Summary Cards

Four `SummaryCard` components across the top row. Each card is wrapped in the 4-column grid defined in Section 3.

### 4.1 Overall Weighted MAPE

Computed from `MOCK_FORECAST_ACCURACY` by weighting each record's MAPE by its `sampleSize`, excluding `NAIVE_SEASONAL` and `ENSEMBLE` rows (only primary algorithms contribute to the weighted average).

```typescript
// Computation
const primaryRecords = MOCK_FORECAST_ACCURACY.filter(
  (r) => r.algorithm !== ForecastAlgorithm.NAIVE_SEASONAL && r.algorithm !== ForecastAlgorithm.ENSEMBLE
);
const totalSamples = primaryRecords.reduce((sum, r) => sum + r.sampleSize, 0);
const weightedMape = primaryRecords.reduce((sum, r) => sum + r.mape * r.sampleSize, 0) / totalSamples;
```

```tsx
<SummaryCard
  label="Weighted MAPE"
  value={`${weightedMape.toFixed(1)}%`}
  trend={{ direction: 'down', delta: '-2.3%', favorable: true }}
  target="Target: ≤ 25%"
/>
```

### 4.2 FVA vs. Naive Baseline

The average FVA across all non-naive, non-ensemble algorithm records in `MOCK_FORECAST_ACCURACY`.

```typescript
const avgFva = primaryRecords.reduce((sum, r) => sum + r.fva, 0) / primaryRecords.length;
```

```tsx
<SummaryCard
  label="FVA vs. Naive"
  value={`+${avgFva.toFixed(1)}%`}
  trend={{ direction: 'up', delta: '+1.4%', favorable: true }}
  target="Positive = beats naive baseline"
/>
```

### 4.3 Total SKUs Forecasted

Count of unique SKUs in `MOCK_FORECASTS`.

```typescript
const totalForecasted = new Set(MOCK_FORECASTS.map((f) => f.skuId)).size;
```

```tsx
<SummaryCard
  label="SKUs Forecasted"
  value={String(totalForecasted)}
  trend={{ direction: 'flat', delta: '0', favorable: true }}
/>
```

### 4.4 Ensemble Activations

Count of unique SKUs where `algorithm === ForecastAlgorithm.ENSEMBLE` in `MOCK_FORECASTS`.

```typescript
const ensembleCount = new Set(
  MOCK_FORECASTS.filter((f) => f.algorithm === ForecastAlgorithm.ENSEMBLE).map((f) => f.skuId)
).size;
```

```tsx
<SummaryCard
  label="Ensemble Activations"
  value={String(ensembleCount)}
  trend={{ direction: 'up', delta: '+1', favorable: true }}
  target="Triggered when no model ≤ 20% MAPE"
/>
```

---

## 5. MAPE by Demand Class Chart

A `SimpleBarChart` showing the average MAPE for each of the 5 demand classes. One bar per class.

### 5.1 Data Derivation

For each demand class, compute the average MAPE across all algorithms in `MOCK_FORECAST_ACCURACY` (excluding `NAIVE_SEASONAL`):

```typescript
const mapeByClass = Object.values(DemandClass).map((dc) => {
  const records = MOCK_FORECAST_ACCURACY.filter(
    (r) => r.skuClass === dc && r.algorithm !== ForecastAlgorithm.NAIVE_SEASONAL
  );
  const avgMape = records.length > 0
    ? records.reduce((sum, r) => sum + r.mape, 0) / records.length
    : 0;
  return { class: DEMAND_CLASS_LABELS[dc], mape: parseFloat(avgMape.toFixed(1)) };
});
```

### 5.2 Label Mapping

```typescript
const DEMAND_CLASS_LABELS: Record<DemandClass, string> = {
  SMOOTH_FAST: 'Smooth / Fast',
  ERRATIC_HIGH_VARIANCE: 'Erratic',
  INTERMITTENT_LUMPY: 'Intermittent',
  NEW_COLD_START: 'Cold Start',
  DEFENSE_CONTRACT: 'Defense',
};
```

### 5.3 Component Usage

**Bars are clickable** — clicking a demand class bar scrolls to the Worst Performers table and filters it to show only SKUs in that class (see Spec 16 §3.4.4).

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">MAPE by Demand Class</h3>
  <SimpleBarChart
    data={mapeByClass}
    categoryKey="class"
    series={[{ dataKey: 'mape', name: 'Avg MAPE (%)', color: CHART_COLORS.primary }]}
    valueFormatter={formatPercent}
    onBarClick={(entry) => handleDemandClassClick(entry.class)}
    height={300}
  />
</div>
```

```typescript
const [demandClassFilter, setDemandClassFilter] = useState<DemandClass | null>(null);
const worstPerformersRef = useRef<HTMLDivElement>(null);

const handleDemandClassClick = (className: string) => {
  const dc = Object.entries(DEMAND_CLASS_LABELS).find(([, v]) => v === className)?.[0] as DemandClass;
  setDemandClassFilter(dc);
  worstPerformersRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

### 5.4 Expected Values (from Spec 04 Section 16.1)

| Class | Avg MAPE (non-naive) |
|-------|---------------------|
| Smooth / Fast | ~12.9% (avg of 11.2, 12.8, 14.5, 13.1, 9.8) |
| Erratic | ~28.1% (avg of 28.4, 24.1, 35.2, 30.2, 22.5) |
| Intermittent | ~38.5% (only Croston's) |
| Cold Start | ~32.0% (only BSTS) |
| Defense | ~6.8% (only CONTRACT_BACKLOG) |

---

## 6. FVA Table

A `DataTable` showing per-algorithm FVA metrics. Each row represents one algorithm-class combination from `MOCK_FORECAST_ACCURACY`.

### 6.1 Columns

| Column | accessorKey / accessor | Header | Cell Renderer | Alignment |
|--------|----------------------|--------|--------------|-----------|
| Algorithm | `algorithm` | Algorithm | `StatusBadge` with algorithm-specific color | Left |
| Demand Class | `skuClass` | Demand Class | `StatusBadge` with demand class color | Left |
| MAPE | `mape` | MAPE (%) | `font-mono tabular-nums`; colored red if > 30%, amber if > 20%, green if <= 20% | Right |
| Naive MAPE | computed | Naive MAPE (%) | Look up NAIVE_SEASONAL MAPE for the same `skuClass` from `MOCK_FORECAST_ACCURACY`; `font-mono tabular-nums` | Right |
| FVA | `fva` | FVA (%) | `font-mono tabular-nums`; green if positive, red if negative, gray if zero | Right |
| Sample Size | `sampleSize` | Sample Size | `font-mono tabular-nums` | Right |

### 6.2 Data Source

All records from `MOCK_FORECAST_ACCURACY` (20 rows). Sorted by `fva` descending by default (best FVA first).

### 6.3 Naive MAPE Lookup

```typescript
const naiveMapeByClass: Record<string, number> = {};
MOCK_FORECAST_ACCURACY
  .filter((r) => r.algorithm === ForecastAlgorithm.NAIVE_SEASONAL)
  .forEach((r) => { naiveMapeByClass[r.skuClass] = r.mape; });
```

### 6.4 FVA Cell Coloring

```typescript
function fvaColor(fva: number): string {
  if (fva > 0) return 'text-success-500';
  if (fva < 0) return 'text-danger-500';
  return 'text-slate-400';
}
```

### 6.5 MAPE Cell Coloring

```typescript
function mapeColor(mape: number): string {
  if (mape <= 20) return 'text-success-500';
  if (mape <= 30) return 'text-amber-600';
  return 'text-danger-500';
}
```

### 6.6 Component Usage

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Forecast Value Added (FVA) by Algorithm</h3>
  <DataTable<ForecastAccuracy>
    columns={fvaColumns}
    data={MOCK_FORECAST_ACCURACY}
    pageSize={20}
    getRowId={(row) => `${row.algorithm}-${row.skuClass}`}
  />
</div>
```

---

## 7. Algorithm Comparison Chart

A grouped `SimpleBarChart` comparing MAPE across algorithms. Each algorithm is a category on the X axis; each demand class is a separate bar series (color-coded).

### 7.1 Data Derivation

Pivot `MOCK_FORECAST_ACCURACY` (excluding `NAIVE_SEASONAL`) so each row is an algorithm and each demand class is a column:

```typescript
const algorithms = [
  ForecastAlgorithm.SARIMA,
  ForecastAlgorithm.XGBOOST,
  ForecastAlgorithm.CROSTONS,
  ForecastAlgorithm.BSTS,
  ForecastAlgorithm.HOLT_WINTERS,
  ForecastAlgorithm.CONTRACT_BACKLOG,
  ForecastAlgorithm.ENSEMBLE,
];

const ALGORITHM_LABELS: Record<string, string> = {
  SARIMA: 'SARIMA',
  XGBOOST: 'XGBoost',
  CROSTONS: "Croston's",
  BSTS: 'BSTS',
  HOLT_WINTERS: 'Holt-Winters',
  CONTRACT_BACKLOG: 'Contract',
  ENSEMBLE: 'Ensemble',
};

const algoComparisonData = algorithms.map((algo) => {
  const row: Record<string, string | number> = { algorithm: ALGORITHM_LABELS[algo] };
  MOCK_FORECAST_ACCURACY
    .filter((r) => r.algorithm === algo)
    .forEach((r) => { row[r.skuClass] = r.mape; });
  return row;
});
```

### 7.2 Series Definition

```typescript
const algoSeries: BarChartSeries[] = [
  { dataKey: DemandClass.SMOOTH_FAST, name: 'Smooth / Fast', color: DEMAND_CLASS_COLORS.SMOOTH_FAST },
  { dataKey: DemandClass.ERRATIC_HIGH_VARIANCE, name: 'Erratic', color: DEMAND_CLASS_COLORS.ERRATIC_HIGH_VARIANCE },
  { dataKey: DemandClass.INTERMITTENT_LUMPY, name: 'Intermittent', color: DEMAND_CLASS_COLORS.INTERMITTENT_LUMPY },
  { dataKey: DemandClass.NEW_COLD_START, name: 'Cold Start', color: DEMAND_CLASS_COLORS.NEW_COLD_START },
  { dataKey: DemandClass.DEFENSE_CONTRACT, name: 'Defense', color: DEMAND_CLASS_COLORS.DEFENSE_CONTRACT },
];
```

### 7.3 Component Usage

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Algorithm Comparison — MAPE by Demand Class</h3>
  <SimpleBarChart
    data={algoComparisonData}
    categoryKey="algorithm"
    series={algoSeries}
    valueFormatter={formatPercent}
    height={350}
  />
</div>
```

Note: Not every algorithm has data for every demand class. Recharts gracefully handles missing keys by rendering no bar for that series, which is the desired behavior (e.g., CONTRACT_BACKLOG only has a Defense bar).

---

## 8. Worst Performers Table

A `DataTable` of the SKUs with the worst forecast accuracy, sorted by MAPE descending.

### 8.1 Data Derivation

Derive per-SKU accuracy by computing MAPE from `MOCK_FORECASTS` and `MOCK_DEMAND_HISTORY`. For each SKU, compare the most recent forecast P50 against the actual demand for the same period. Join with `MOCK_SKUS` for description and `MOCK_CLASSIFICATIONS` for demand class and algorithm.

```typescript
interface WorstPerformerRow {
  partNumber: string;
  description: string;
  demandClass: DemandClass;
  algorithm: ForecastAlgorithm;
  mape: number;
  fva: number;
}
```

Construct the top 10 worst performers from mock data. The following are pinned for demo consistency:

| partNumber | description | demandClass | algorithm | mape | fva |
|-----------|-------------|-------------|-----------|------|-----|
| `1081030` | BAR STOOL PADDED - WHITE | INTERMITTENT_LUMPY | CROSTONS | 62.4 | +3.1 |
| `5100031` | TRAC-LOCK SWIVEL REPAIR KIT | INTERMITTENT_LUMPY | CROSTONS | 55.8 | +5.2 |
| `1840010` | OARLOCK ZINC DIE-CAST | INTERMITTENT_LUMPY | CROSTONS | 51.3 | +1.9 |
| `1780200` | MOTOR MOUNT BRACKET HEAVY DUTY | INTERMITTENT_LUMPY | CROSTONS | 48.7 | +4.8 |
| `1043080` | PRO FISHING SPEED SEAT 2025 | NEW_COLD_START | BSTS | 45.2 | +8.1 |
| `1271001` | 4 IN ELECTRIC PEDESTAL 2025 | NEW_COLD_START | BSTS | 42.6 | +6.3 |
| `1042030` | WHEELHOUSE XL HELM SEAT | ERRATIC_HIGH_VARIANCE | XGBOOST | 38.9 | +7.4 |
| `1941010` | MARINE KETTLE GRILL ROUND | ERRATIC_HIGH_VARIANCE | XGBOOST | 36.2 | +5.8 |
| `1800210` | TELESCOPING LADDER 3-STEP SS316 | ERRATIC_HIGH_VARIANCE | XGBOOST | 33.5 | +4.1 |
| `1670200` | TABLE TOP OVAL 18X30 | ERRATIC_HIGH_VARIANCE | HOLT_WINTERS | 31.8 | +2.9 |

### 8.2 Columns

| Column | Header | Cell Renderer | Alignment |
|--------|--------|--------------|-----------|
| `partNumber` | Part Number | Clickable link (`text-navy-600 hover:underline cursor-pointer`), navigates to `/sku/${partNumber}` | Left |
| `description` | Description | Plain text, `text-sm text-slate-700` | Left |
| `demandClass` | Demand Class | `StatusBadge` with demand class color | Left |
| `algorithm` | Algorithm | Plain text, `text-sm` | Left |
| `mape` | MAPE (%) | `font-mono tabular-nums`; colored per `mapeColor()` from Section 6.5 | Right |
| `fva` | FVA (%) | `font-mono tabular-nums`; colored per `fvaColor()` from Section 6.4 | Right |

### 8.3 Row Click

Clicking the part number navigates to `/sku/${partNumber}` via React Router's `useNavigate`. The entire row does NOT navigate — only the part number cell is clickable.

### 8.4 Component Usage

The Worst Performers table supports **demand class filtering** from chart clicks. When `demandClassFilter` is non-null, a filter chip appears above the table showing the active class, with an "x" to clear it.

```tsx
<div ref={worstPerformersRef} className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Worst Forecast Performers</h3>
  <p className="text-sm text-slate-500 mb-2">SKUs with highest MAPE, sorted descending. Click part number for detail.</p>

  {/* Active filter chip */}
  {demandClassFilter && (
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        {DEMAND_CLASS_LABELS[demandClassFilter]}
        <button onClick={() => setDemandClassFilter(null)} className="ml-1 hover:text-indigo-600">×</button>
      </span>
    </div>
  )}

  <DataTable<WorstPerformerRow>
    columns={worstPerformerColumns}
    data={demandClassFilter
      ? worstPerformers.filter(wp => wp.demandClass === demandClassFilter)
      : worstPerformers}
    pageSize={10}
    getRowId={(row) => row.partNumber}
  />
</div>
```

---

## 9. Ensemble Triggers Table

A `DataTable` showing SKUs where the ensemble model was activated because no single algorithm achieved MAPE <= 20% (per SRD REQ-1.1.3).

### 9.1 Data Structure

```typescript
interface EnsembleTriggerRow {
  partNumber: string;
  description: string;
  componentModels: string;   // Comma-separated list of top-3 algorithms
  weights: string;            // Comma-separated weights (e.g., "0.45, 0.35, 0.20")
  ensembleMape: number;       // Resulting ensemble MAPE
}
```

### 9.2 Pinned Data

From Spec 04, `ENSEMBLE` appears for `SMOOTH_FAST` (2 SKUs) and `ERRATIC_HIGH_VARIANCE` (3 SKUs). The following rows are pinned:

| partNumber | description | componentModels | weights | ensembleMape |
|-----------|-------------|-----------------|---------|-------------|
| `1690100` | TABLE PKG THREAD-LOCK ROUND | SARIMA, XGBoost, Holt-Winters | 0.42, 0.35, 0.23 | 18.4 |
| `1580100` | FOOTREST ALUMINUM ANODIZED | XGBoost, SARIMA, Holt-Winters | 0.48, 0.30, 0.22 | 17.9 |
| `1270100` | 4 IN POWER-RISE PEDESTAL PKG | XGBoost, SARIMA, BSTS | 0.40, 0.38, 0.22 | 19.6 |
| `1800210` | TELESCOPING LADDER 3-STEP SS316 | XGBoost, Holt-Winters, SARIMA | 0.44, 0.32, 0.24 | 18.1 |
| `1100025` | SEAT SLIDE 13IN LOCKING | SARIMA, XGBoost, BSTS | 0.39, 0.36, 0.25 | 19.2 |

### 9.3 Columns

| Column | Header | Cell Renderer | Alignment |
|--------|--------|--------------|-----------|
| `partNumber` | Part Number | Clickable link to `/sku/${partNumber}` (same styling as Section 8.2) | Left |
| `description` | Description | Plain text, `text-sm text-slate-700` | Left |
| `componentModels` | Component Models | Plain text, `text-sm` | Left |
| `weights` | Weights | `font-mono tabular-nums text-sm` | Left |
| `ensembleMape` | Ensemble MAPE (%) | `font-mono tabular-nums`; colored per `mapeColor()` | Right |

### 9.4 Component Usage

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Ensemble Triggers</h3>
  <p className="text-sm text-slate-500 mb-4">
    SKUs where no single model achieved MAPE ≤ 20%. Ensemble uses inverse-MAPE weighted average of top-3 models.
  </p>
  <DataTable<EnsembleTriggerRow>
    columns={ensembleColumns}
    data={ensembleTriggers}
    pageSize={10}
    getRowId={(row) => row.partNumber}
  />
</div>
```

---

## 10. Classification Distribution Chart

A `DonutChart` showing SKU count by demand class (5 segments).

### 10.1 Data Derivation

Count unique SKUs per demand class from `MOCK_CLASSIFICATIONS`:

```typescript
const classDistribution: DonutSegment[] = Object.values(DemandClass).map((dc) => ({
  name: DEMAND_CLASS_LABELS[dc],
  value: MOCK_CLASSIFICATIONS.filter((c) => c.demandClass === dc).length,
  color: DEMAND_CLASS_COLORS[dc],
}));
```

### 10.2 Expected Values (from Spec 04 Section 2.1)

| Segment | Count | Color |
|---------|-------|-------|
| Smooth / Fast | 20 | navy-700 (`#084974`) |
| Erratic | 10 | amber-500 (`#f59e0b`) |
| Intermittent | 10 | red-500 (`#ef4444`) |
| Cold Start | 5 | violet-500 (`#8b5cf6`) |
| Defense | 5 | cyan-500 (`#06b6d4`) |

### 10.3 Component Usage

**Donut segments are clickable** — clicking a segment scrolls to the Worst Performers table and filters by that demand class, same as the MAPE bar chart (see Spec 16 §3.4.4).

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Classification Distribution</h3>
  <DonutChart
    data={classDistribution}
    centerValue="50"
    centerLabel="Total SKUs"
    onSegmentClick={(segment) => handleDemandClassClick(segment.name)}
    height={300}
  />
</div>
```

---

## 11. Forecast Accuracy Scatter Plot

A `ScatterPlot` of predicted vs. actual demand with a 45-degree reference line. Points near the diagonal indicate accurate forecasts; points far from it indicate poor accuracy. **Individual dots are clickable** — clicking a dot navigates to the SKU Detail page for that part (see Spec 16 §3.4.4).

### 11.1 Data Derivation

For each SKU, take the most recent period where both a forecast and actual demand exist (the last month in `MOCK_DEMAND_HISTORY` that also has a forecast entry in `MOCK_FORECASTS`). Plot `actual` (X) vs. `predicted` (Y) where `predicted = p50`.

```typescript
const scatterData: ScatterDataPoint[] = MOCK_SKUS.map((sku) => {
  const lastHistory = MOCK_DEMAND_HISTORY
    .filter((d) => d.skuId === sku.skuId)
    .sort((a, b) => b.period.localeCompare(a.period))[0];

  const matchingForecast = MOCK_FORECASTS.find(
    (f) => f.skuId === sku.skuId && f.period === lastHistory?.period
  );

  return {
    x: lastHistory?.quantity ?? 0,
    y: matchingForecast?.p50 ?? 0,
    label: sku.partNumber,
    color: DEMAND_CLASS_COLORS[sku.demandClass],
  };
}).filter((p) => p.x > 0 || p.y > 0);
```

### 11.2 Component Usage

```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Forecast Accuracy — Predicted vs. Actual</h3>
  <p className="text-sm text-slate-500 mb-4">Points near the diagonal indicate accurate forecasts.</p>
  <ScatterPlot
    data={scatterData}
    xLabel="Actual Demand"
    yLabel="Predicted Demand (P50)"
    xFormatter={formatNumber}
    yFormatter={formatNumber}
    showDiagonal={true}
    onDotClick={(point) => navigate(`/sku/${point.label}`)}
    height={350}
  />
</div>
```

### 11.3 Color Coding

Each dot is colored by its demand class using `DEMAND_CLASS_COLORS` from `theme.ts`. This provides visual correlation with the donut chart and bar charts on the same page.

---

## 12. Data Imports

```typescript
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  MOCK_FORECAST_ACCURACY,
  MOCK_CLASSIFICATIONS,
  MOCK_SKUS,
  MOCK_FORECASTS,
  MOCK_DEMAND_HISTORY,
} from '@/data';
import {
  ForecastAccuracy,
  ForecastAlgorithm,
  DemandClass,
} from '@/lib/types';
import { PageHeader, SummaryCard, DataTable, StatusBadge } from '@/components/common';
import { SimpleBarChart, DonutChart, ScatterPlot } from '@/components/charts';
import type { BarChartSeries, DonutSegment, ScatterDataPoint } from '@/components/charts';
import { CHART_COLORS, DEMAND_CLASS_COLORS } from '@/components/charts/theme';
import { formatPercent, formatNumber } from '@/components/charts/formatters';
```

---

## 13. Local Types

These types are defined locally within the page file (not exported to `lib/types.ts`) because they are page-specific view models:

```typescript
interface WorstPerformerRow {
  partNumber: string;
  description: string;
  demandClass: DemandClass;
  algorithm: ForecastAlgorithm;
  mape: number;
  fva: number;
}

interface EnsembleTriggerRow {
  partNumber: string;
  description: string;
  componentModels: string;
  weights: string;
  ensembleMape: number;
}
```

---

## 14. Placeholder Markers

```typescript
// MOCK: All data from @/data — replace with API calls to forecast accuracy endpoints
// API_PLACEHOLDER: GET /api/forecast/accuracy — returns ForecastAccuracy[]
// API_PLACEHOLDER: GET /api/forecast/worst-performers — returns paginated worst performers
// API_PLACEHOLDER: GET /api/forecast/ensemble-triggers — returns ensemble activation records
// API_PLACEHOLDER: GET /api/forecast/scatter — returns predicted vs actual pairs
```

---

## 15. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Page renders at route `/forecast` without console errors | Navigate to route; check browser console |
| 2 | Four `SummaryCard` components display in a 4-column grid at the top of the page: Weighted MAPE, FVA vs. Naive, Total SKUs Forecasted, Ensemble Activations | Visual inspection |
| 3 | Weighted MAPE card shows a value derived from `MOCK_FORECAST_ACCURACY` (excluding NAIVE_SEASONAL and ENSEMBLE), weighted by `sampleSize`; value is between 15% and 30% | Compute expected value manually from mock data; compare |
| 4 | MAPE by Demand Class `SimpleBarChart` renders 5 bars (one per demand class) with correct average MAPE values computed from `MOCK_FORECAST_ACCURACY`; value axis formatted as percentage | Visual inspection; cross-check with Section 5.4 expected values |
| 5 | Classification Distribution `DonutChart` renders 5 colored segments totaling 50 SKUs, with center label "50 / Total SKUs" and a legend showing class names with counts | Visual inspection; verify segment count matches Spec 04 Section 2.1 distribution |
| 6 | Algorithm Comparison grouped `SimpleBarChart` renders one group per algorithm (7 algorithms) with demand-class-colored bars; algorithms with only one applicable class show a single bar in that group | Visual inspection; verify SARIMA shows 2 bars (Smooth, Erratic), CONTRACT_BACKLOG shows 1 bar (Defense) |
| 7 | FVA `DataTable` displays 20 rows (all `MOCK_FORECAST_ACCURACY` records) with columns: Algorithm, Demand Class, MAPE (%), Naive MAPE (%), FVA (%), Sample Size; default sorted by FVA descending | Inspect table; verify row count and sort order |
| 8 | FVA values in the FVA table are color-coded: positive values green, zero values gray, negative values red; NAIVE_SEASONAL rows show FVA as `0.0` in gray | Visual inspection of cell colors |
| 9 | MAPE values in all tables are color-coded: green for MAPE <= 20%, amber for 20-30%, red for > 30% | Visual inspection |
| 10 | Worst Performers `DataTable` shows 10 rows sorted by MAPE descending; the first row has the highest MAPE; part numbers are clickable links styled with `text-navy-600` | Visual inspection; click first part number and verify navigation to `/sku/{partNumber}` |
| 11 | Ensemble Triggers `DataTable` shows 5 rows with columns: Part Number, Description, Component Models, Weights, Ensemble MAPE; weights in each row sum to 1.00 (within rounding) | Inspect table; verify weight sums |
| 12 | Forecast Accuracy `ScatterPlot` renders data points with a dashed 45-degree reference line; dots are color-coded by demand class; tooltip shows part number, actual, and predicted values | Hover over points; verify tooltip content |
| 13 | Charts row 1 (MAPE by Class + Classification Distribution) renders in a 2-column grid; charts row 2 (Algorithm Comparison + Scatter) renders in a 2-column grid | Resize browser; verify grid layout at 1024px+ |
| 14 | All three `DataTable` instances render at full width below the charts with proper section headings | Visual inspection of page flow |
| 15 | Clicking a part number in the Worst Performers or Ensemble Triggers table navigates to `/sku/${partNumber}` without full page reload (client-side routing) | Click link; verify URL change and no reload |
| 16 | All numeric columns in all tables use `font-mono tabular-nums` for aligned digits per Kernel Section 7.4 | Inspect element; verify CSS classes |
| 17 | Page uses `PageHeader` component with title "Forecast Overview" and subtitle text | Visual inspection |
| 18 | No TypeScript compilation errors (`tsc --noEmit`) | Run type check |
| 19 | Clicking a bar in the MAPE by Demand Class chart scrolls to Worst Performers table and filters it to that demand class | Click "Smooth / Fast" bar; verify table filters to only smooth/fast SKUs |
| 20 | Clicking a donut segment in Classification Distribution scrolls to Worst Performers table and filters to that class | Click "Erratic" segment; verify filter |
| 21 | When a demand class filter is active, a filter chip appears above the Worst Performers table with an "x" to clear it | Apply filter via chart click; verify chip; click "x"; verify all rows return |
| 22 | Clicking a dot in the Forecast Accuracy scatter plot navigates to `/sku/${partNumber}` | Click a dot; verify navigation to correct SKU |
| 23 | Scatter plot dots show `cursor-pointer` on hover | Hover over dot; verify cursor style |
