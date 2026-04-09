# Spec 06 — Reusable Chart Components

**Status:** Draft
**Depends on:** Spec 01 (Project Setup), Spec 02 (Design System), Spec 03 (Type Definitions)
**Kernel refs:** §2.1 (Stack — Recharts), §4.3 (SKU Detail), §4.4 (Forecast Overview), §4.5 (KPI Dashboards), §4.6 (BOM Explorer), §4.7 (Inventory Parameters), §7 (Design System)
**SRD refs:** §1.1, §1.4, §2.1, §2.2, §3.2.5, §5.5

---

## 1. Overview

This spec defines all reusable chart wrapper components in `frontend/src/components/charts/`. Every chart is built on Recharts, uses a shared theming layer derived from the Tailwind design system (Spec 02), accepts strongly typed props, and renders responsively inside its parent container. No chart manages its own data fetching — all data arrives via props.

---

## 2. File Structure

```
frontend/src/
  components/
    charts/
      theme.ts                # Shared chart theming constants
      formatters.ts           # Numeric/date formatting utilities for axes and tooltips
      ChartTooltip.tsx        # Shared styled tooltip component
      ForecastChart.tsx        # Probabilistic forecast with prediction intervals
      DemandHistoryChart.tsx   # Trailing demand history with anomaly markers
      InventoryGauge.tsx       # Horizontal bar gauge for inventory levels
      FillRateChart.tsx        # Fill rate trend with target lines
      DonutChart.tsx           # Donut/ring chart with center label
      StackedBarChart.tsx      # Stacked bar chart (horizontal or vertical)
      BarChart.tsx             # Simple vertical bar chart
      AreaChart.tsx            # Filled area chart
      ScatterPlot.tsx          # X-Y scatter plot
      TariffRoadmapChart.tsx   # Stepped line chart for tariff escalation
      index.ts                # Barrel export
```

---

## 3. Shared Theming Layer

### 3.1 `theme.ts` — Chart Constants

All charts import colors, fonts, and grid styling from this single file. Values are derived from the Springfield Marine brand palette (Spec 02 §3–5) to ensure visual consistency with the rest of the UI. The brand navy and gold appear as the first two series colors, anchoring every chart to the Springfield identity.

```typescript
// frontend/src/components/charts/theme.ts

/**
 * Primary chart color palette — brand-derived, ordered for multi-series charts.
 * First two colors are Springfield brand colors (navy + gold).
 * Remaining colors chosen for maximum contrast and deuteranopia accessibility.
 */
export const CHART_COLORS = {
  primary:    '#084974', // navy-700 — brand primary
  secondary:  '#ffc10a', // gold-400 — brand accent
  tertiary:   '#10b981', // success/emerald
  quaternary: '#8b5cf6', // violet
  quinary:    '#f59e0b', // amber/warning
  senary:     '#06b6d4', // cyan
  septenary:  '#ec4899', // pink
  octonary:   '#64748b', // slate (neutral)
} as const;

/** Ordered array for indexed access when mapping series. */
export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
  CHART_COLORS.senary,
  CHART_COLORS.septenary,
  CHART_COLORS.octonary,
] as const;

/** Semantic colors for specific chart elements — brand navy for forecasts. */
export const SEMANTIC_COLORS = {
  forecast:       '#084974',                    // navy-700 — P50 line
  forecastFill80: 'rgba(8, 73, 116, 0.20)',     // navy @ 20% — P10/P90 shaded area
  forecastFill95: 'rgba(8, 73, 116, 0.08)',     // navy @ 8%  — P2.5/P97.5 shaded area
  forecastBg:     'rgba(8, 73, 116, 0.03)',     // navy @ 3%  — forecast region background wash
  historical:     '#10b981',                    // emerald/success — historical demand
  naiveLine:      '#94a3b8',                    // slate-400 — naive baseline (dashed)
  anomaly:        '#f59e0b',                    // amber/warning — anomalous periods
  pandemicBand:   '#fef3c7',                    // amber-100 — pandemic-era background band
  todayLine:      '#64748b',                    // slate-500 — "today" vertical divider
  target:         '#ef4444',                    // danger — target/threshold lines (85%)
  targetAlt:      '#f59e0b',                    // warning — secondary target line (90%)
  targetTertiary: '#10b981',                    // success — tertiary target line (98%)
} as const;

/** Inventory gauge zone colors — matches Spec 02 §5.5. */
export const GAUGE_COLORS = {
  belowMin:    '#ef4444', // danger-500
  belowRop:    '#f59e0b', // warning-500
  inRange:     '#10b981', // success-500
  aboveMax:    '#3b82f6', // info-500
  safetyStock: 'rgba(255, 193, 10, 0.30)', // gold-400 @ 30% overlay
} as const;

/** Source node chart colors — matches Spec 02 §4.4. */
export const SOURCE_NODE_COLORS = {
  SCHECO_SHANGHAI: '#084974', // navy-700 (brand)
  NIXA_MO:         '#10b981', // success/emerald
  SHARK_NZ:        '#8b5cf6', // violet
} as const;

/** Demand class chart colors — matches Spec 02 §4.6. */
export const DEMAND_CLASS_COLORS = {
  SMOOTH_FAST:           '#10b981', // success
  ERRATIC_HIGH_VARIANCE: '#f59e0b', // warning/amber
  INTERMITTENT_LUMPY:    '#8b5cf6', // violet
  NEW_COLD_START:        '#64748b', // slate (neutral)
  DEFENSE_CONTRACT:      '#084974', // navy (brand)
} as const;

/** Fill rate target band colors — matches Spec 02 §5.1. */
export const FILL_RATE_COLORS = {
  below85: '#ef4444', // danger
  at85:    '#f59e0b', // warning
  at90:    '#ffc10a', // gold
  at98:    '#10b981', // success
} as const;

/** Arbitrage / source comparison colors — matches Spec 02 §5.1. */
export const ARBITRAGE_COLORS = {
  chinaLanded:   '#ef4444', // danger
  nixaDomestic:  '#10b981', // success
  tariffPortion: '#f59e0b', // warning
} as const;

/** Heatmap gradient — navy brand ramp. */
export const HEATMAP_COLORS = {
  min:  '#f0f7fc', // navy-50
  mid:  '#4a9dd6', // navy-400
  max:  '#025482', // navy-900
  zero: '#f8fafc', // slate-50
} as const;

/** Grid and axis styling constants. */
export const CHART_THEME = {
  gridColor:      '#e2e8f0', // slate-200
  gridZeroColor:  '#cbd5e1', // slate-300 — zero line (solid)
  axisColor:      '#64748b', // slate-500
  axisTickColor:  '#94a3b8', // slate-400
  axisFontSize:   11,
  fontFamily:     "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontFamilyMono: "'JetBrains Mono', ui-monospace, monospace",
  tooltipBg:      '#ffffff',
  tooltipBorder:  '#e2e8f0', // slate-200
  tooltipRadius:  8,
  tooltipShadow:  '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  legendFontSize: 12,
  legendColor:    '#475569', // slate-600
} as const;
```

### 3.2 `formatters.ts` — Number and Date Formatting

```typescript
// frontend/src/components/charts/formatters.ts

/** Format a number with comma separators: 1234567 -> "1,234,567" */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Format currency: 1234567.89 -> "$1,234,568" */
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format percentage: 85.3 -> "85.3%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format YYYY-MM to short month label: "2025-03" -> "Mar '25" */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}

/** Format YYYY-MM to full month label: "2025-03" -> "March 2025" */
export function formatPeriodFull(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/** Abbreviate large numbers: 1500000 -> "1.5M", 25000 -> "25K" */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}
```

### 3.3 `ChartTooltip.tsx` — Shared Tooltip Component

A custom Recharts tooltip with consistent styling applied to all charts.

```typescript
// frontend/src/components/charts/ChartTooltip.tsx

import { CHART_THEME } from './theme';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  /** Optional function to format the label (e.g., period -> "Mar '25") */
  labelFormatter?: (label: string) => string;
  /** Optional function to format each value */
  valueFormatter?: (value: number, name: string) => string;
}

/**
 * Styled tooltip shared by all chart components.
 * Renders: white background, subtle shadow, rounded corners, text-sm.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter ? labelFormatter(label ?? '') : label;

  return (
    <div
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        border: `1px solid ${CHART_THEME.tooltipBorder}`,
        borderRadius: CHART_THEME.tooltipRadius,
        boxShadow: CHART_THEME.tooltipShadow,
        padding: '8px 12px',
        fontSize: 13,
        fontFamily: CHART_THEME.fontFamily,
      }}
    >
      {formattedLabel && (
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a', fontSize: 13 }}>
          {formattedLabel}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '2px 0', fontSize: 12 }}>
          <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
          <span style={{ fontFamily: CHART_THEME.fontFamilyMono }}>
            {valueFormatter
              ? valueFormatter(entry.value, entry.name)
              : entry.value.toLocaleString('en-US')}
          </span>
        </p>
      ))}
    </div>
  );
}
```

---

## 4. Chart Component Specifications

All charts use `<ResponsiveContainer width="100%" height={...}>` as the outermost Recharts element. Heights are passed via props with sensible defaults. All charts accept an optional `className` prop for additional container styling.

### Shared Axis and Grid Configuration

Every chart that uses Cartesian axes applies:

```tsx
<CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
<XAxis
  dataKey="period"
  tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor, fontFamily: CHART_THEME.fontFamily }}
  tickLine={false}
  axisLine={{ stroke: CHART_THEME.gridColor }}
  tickFormatter={formatPeriod}
/>
<YAxis
  tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisTickColor, fontFamily: CHART_THEME.fontFamilyMono }}
  tickLine={false}
  axisLine={false}
  tickFormatter={formatNumber}
/>
<Tooltip content={<ChartTooltip labelFormatter={formatPeriod} valueFormatter={formatNumber} />} />
```

Y-axis tick values use `fontFamilyMono` for numeric alignment. X-axis labels use the sans-serif font.

---

### 4.1 ForecastChart

The most important chart in the application. Renders a probabilistic forecast with prediction intervals overlaid on historical demand.

**File:** `frontend/src/components/charts/ForecastChart.tsx`

**Used on:** SKU Detail page (Kernel §4.3)
**SRD ref:** §1.4.1

#### Props Interface

```typescript
import type { Forecast, DemandHistory, DateString } from '../../lib/types';

export interface ForecastChartProps {
  /** Historical demand data points (trailing 24+ months) */
  history: DemandHistory[];
  /** Forward forecast data points with prediction intervals */
  forecasts: Forecast[];
  /** Optional: pandemic-era periods to flag with background band [startPeriod, endPeriod] */
  pandemicRange?: [DateString, DateString];
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class for the container div */
  className?: string;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 400}>
  <ComposedChart data={mergedData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />

    {/* Pandemic-era background band (optional) */}
    {pandemicRange && (
      <ReferenceArea
        x1={pandemicRange[0]}
        x2={pandemicRange[1]}
        fill={SEMANTIC_COLORS.pandemicBand}
        fillOpacity={0.5}
        label={{ value: 'Pandemic Era', position: 'insideTop', fontSize: 11, fill: '#92400e' }}
      />
    )}

    <XAxis
      dataKey="period"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
      tickFormatter={formatPeriod}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={formatNumber}
      label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: CHART_THEME.axisColor } }}
    />

    {/* Forecast region background wash (subtle navy tint to visually separate from historical) */}
    {forecastStartPeriod && (
      <ReferenceArea
        x1={forecastStartPeriod}
        fill={SEMANTIC_COLORS.forecastBg}
        fillOpacity={1}
        label={{ value: '', position: 'insideTop' }}
      />
    )}

    {/* "Today" vertical divider line */}
    {forecastStartPeriod && (
      <ReferenceLine
        x={forecastStartPeriod}
        stroke={SEMANTIC_COLORS.todayLine}
        strokeDasharray="6 4"
        label={{ value: 'Today', position: 'top', fontSize: 11, fill: SEMANTIC_COLORS.todayLine }}
      />
    )}

    {/* 95% prediction interval (P2.5 to P97.5) — lighter shaded area, rendered first (bottom layer) */}
    <Area
      dataKey="p97_5"
      stroke="none"
      fill={SEMANTIC_COLORS.forecastFill95}
      fillOpacity={1}
      name="95% Interval Upper"
      legendType="none"
    />
    <Area
      dataKey="p2_5"
      stroke="none"
      fill="#ffffff"
      fillOpacity={1}
      name="95% Interval Lower"
      legendType="none"
    />

    {/* 80% prediction interval (P10 to P90) — medium shaded area */}
    <Area
      dataKey="p90"
      stroke="none"
      fill={SEMANTIC_COLORS.forecastFill80}
      fillOpacity={1}
      name="80% Interval Upper"
      legendType="none"
    />
    <Area
      dataKey="p10"
      stroke="none"
      fill="#ffffff"
      fillOpacity={1}
      name="80% Interval Lower"
      legendType="none"
    />

    {/* P50 forecast line */}
    <Line
      dataKey="p50"
      stroke={SEMANTIC_COLORS.forecast}
      strokeWidth={2.5}
      dot={false}
      name="Forecast (P50)"
    />

    {/* Historical demand as dots + line */}
    <Line
      dataKey="historicalQty"
      stroke={SEMANTIC_COLORS.historical}
      strokeWidth={2}
      dot={{ r: 3, fill: SEMANTIC_COLORS.historical, strokeWidth: 0 }}
      name="Historical Demand"
    />

    <Tooltip
      content={
        <ChartTooltip
          labelFormatter={formatPeriod}
          valueFormatter={(v) => formatNumber(v) + ' units'}
        />
      }
    />
    <Legend
      verticalAlign="top"
      height={36}
      iconType="line"
      wrapperStyle={{ fontSize: CHART_THEME.legendFontSize, fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.legendColor }}
    />
  </ComposedChart>
</ResponsiveContainer>
```

#### Data Merging Logic

The component merges `history` and `forecasts` into a single `mergedData` array keyed by `period`. Each element has the shape:

```typescript
interface MergedForecastPoint {
  period: string;
  historicalQty: number | null;
  p50: number | null;
  p10: number | null;
  p90: number | null;
  p2_5: number | null;
  p97_5: number | null;
}
```

Historical periods have `p50/p10/p90/p2_5/p97_5` as `null`. Forecast periods have `historicalQty` as `null`. The last historical period and first forecast period should overlap (both values present) to produce a visually connected transition.

#### Prediction Interval Rendering Strategy

Recharts does not natively support "area between two lines." Use the stacked Area approach:

1. Compute derived fields on each forecast data point: `interval95 = p97_5 - p2_5` and `interval80 = p90 - p10`.
2. Use `<Area type="monotone" dataKey="p97_5" stackId="interval95" />` and `<Area type="monotone" dataKey="p2_5" stackId="interval95" fill="#fff" />` to produce the shaded band effect.

Alternative (recommended for clarity): use a single custom `<Area>` with a `baseLine` approach, or compute the data so that each point has `intervalUpper95`, `intervalLower95`, `intervalUpper80`, `intervalLower80` and render using Recharts `<Area>` with `baseValue` or by using a helper that renders a `<path>` for each band.

The implementer should use whichever Recharts pattern produces the cleanest visual. The key visual requirement: two nested shaded bands behind the P50 line, lighter band outside, darker band inside.

#### Usage Example

```tsx
// On SKU Detail page
<ForecastChart
  history={skuDemandHistory}
  forecasts={skuForecasts}
  pandemicRange={[toDateString('2020-01'), toDateString('2023-12')]}
  height={400}
  className="mt-4"
/>
```

---

### 4.2 DemandHistoryChart

A line chart showing trailing 24+ months of demand with markers for anomalous periods.

**File:** `frontend/src/components/charts/DemandHistoryChart.tsx`

**Used on:** SKU Detail page (Kernel §4.3)
**SRD ref:** §1.1

#### Props Interface

```typescript
import type { DemandHistory, DateString } from '../../lib/types';

export interface DemandHistoryChartProps {
  /** Monthly demand observations, sorted chronologically */
  data: DemandHistory[];
  /** Periods flagged as anomalous (pandemic-era or outlier). Rendered with distinct markers. */
  anomalyPeriods?: DateString[];
  /** Optional: pandemic-era range for subtle background band */
  pandemicRange?: [DateString, DateString];
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 300}>
  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />

    {pandemicRange && (
      <ReferenceArea
        x1={pandemicRange[0]}
        x2={pandemicRange[1]}
        fill={SEMANTIC_COLORS.pandemicBand}
        fillOpacity={0.5}
      />
    )}

    <XAxis
      dataKey="period"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
      tickFormatter={formatPeriod}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={formatNumber}
      label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: CHART_THEME.axisColor } }}
    />

    <Line
      type="monotone"
      dataKey="quantity"
      stroke={SEMANTIC_COLORS.historical}
      strokeWidth={2}
      dot={(props) => {
        const { cx, cy, payload } = props;
        const isAnomaly = anomalyPeriods?.includes(payload.period);
        return (
          <circle
            cx={cx}
            cy={cy}
            r={isAnomaly ? 5 : 3}
            fill={isAnomaly ? SEMANTIC_COLORS.anomaly : SEMANTIC_COLORS.historical}
            stroke={isAnomaly ? '#92400e' : 'none'}
            strokeWidth={isAnomaly ? 2 : 0}
          />
        );
      }}
      name="Demand"
    />

    <Tooltip
      content={
        <ChartTooltip
          labelFormatter={formatPeriod}
          valueFormatter={(v) => formatNumber(v) + ' units'}
        />
      }
    />
  </LineChart>
</ResponsiveContainer>
```

#### Behavior

- Anomalous periods render with larger amber-colored dots and a subtle border to distinguish them from normal data points.
- The pandemic background band provides contextual framing for the anomaly cluster.
- The component derives `chartData` directly from `data` — no transformation needed beyond sorting by period.

#### Usage Example

```tsx
<DemandHistoryChart
  data={skuDemandHistory}
  anomalyPeriods={[toDateString('2020-04'), toDateString('2020-05'), toDateString('2021-11')]}
  pandemicRange={[toDateString('2020-01'), toDateString('2023-12')]}
/>
```

---

### 4.3 InventoryGauge

A horizontal bar gauge showing current on-hand level relative to min, reorder point, safety stock, and max bands. Color zones indicate inventory health.

**File:** `frontend/src/components/charts/InventoryGauge.tsx`

**Used on:** SKU Detail page (Kernel §4.3), Inventory Parameters page (Kernel §4.7)
**SRD ref:** §2.1

#### Props Interface

```typescript
export interface InventoryGaugeProps {
  /** Current on-hand quantity */
  onHand: number;
  /** Minimum inventory level */
  min: number;
  /** Safety stock quantity (typically <= min) */
  safetyStock: number;
  /** Reorder point (between min and max) */
  reorderPoint: number;
  /** Maximum inventory level */
  max: number;
  /** Height of the gauge bar in pixels */
  barHeight?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Visual Design

This is a custom SVG/div-based gauge, not a Recharts chart. It renders as a horizontal stacked bar with color zones and a marker for the current on-hand position.

```
|-- RED --|-- AMBER --|--- GREEN ---|-- BLUE --|
0        min        ROP            max       scale-max
          ^safety                      
               stock                   
                            ^ on-hand marker
```

**Zone definitions:**

| Zone | Range | Color | Tailwind Hex |
|------|-------|-------|-------------|
| Below Min | 0 to `min` | Red | `#ef4444` (red-500) |
| Below ROP | `min` to `reorderPoint` | Amber | `#f59e0b` (amber-500) |
| In Range | `reorderPoint` to `max` | Green | `#10b981` (emerald-500) |
| Above Max | `max` to `scaleMax` | Blue | `#3b82f6` (blue-500) |

Where `scaleMax = Math.max(max * 1.3, onHand * 1.1)` to ensure the marker is always visible.

**On-hand marker:** A vertical line with a downward-pointing triangle and the numeric value displayed above. The marker color matches the zone it falls in.

**Threshold labels:** Small labels below the bar at each threshold position showing the numeric value (safety stock, min, ROP, max).

#### Rendered Structure

```tsx
<div className={className}>
  {/* Header with current value */}
  <div className="flex items-center justify-between mb-1">
    <span className="text-sm font-medium text-slate-700">Inventory Position</span>
    <span className={`text-sm font-mono font-semibold ${zoneTextColor}`}>
      {formatNumber(onHand)} units
    </span>
  </div>

  {/* Gauge bar (SVG) */}
  <svg width="100%" height={barHeight ?? 32} viewBox={`0 0 ${scaleMax} ${barHeight ?? 32}`} preserveAspectRatio="none">
    {/* Color zone rectangles */}
    <rect x={0} width={min} height="100%" fill={GAUGE_COLORS.belowMin} opacity={0.3} />
    <rect x={min} width={reorderPoint - min} height="100%" fill={GAUGE_COLORS.belowRop} opacity={0.3} />
    <rect x={reorderPoint} width={max - reorderPoint} height="100%" fill={GAUGE_COLORS.inRange} opacity={0.3} />
    <rect x={max} width={scaleMax - max} height="100%" fill={GAUGE_COLORS.aboveMax} opacity={0.3} />

    {/* On-hand marker */}
    <line x1={onHand} y1={0} x2={onHand} y2="100%" stroke={markerColor} strokeWidth={3} />
    <polygon points={trianglePoints} fill={markerColor} />
  </svg>

  {/* Threshold labels below the bar */}
  <div className="relative h-5 text-xs text-slate-500 font-mono mt-1">
    <span style={{ left: `${(safetyStock/scaleMax)*100}%` }} className="absolute">SS:{safetyStock}</span>
    <span style={{ left: `${(min/scaleMax)*100}%` }} className="absolute">Min:{min}</span>
    <span style={{ left: `${(reorderPoint/scaleMax)*100}%` }} className="absolute">ROP:{reorderPoint}</span>
    <span style={{ left: `${(max/scaleMax)*100}%` }} className="absolute">Max:{max}</span>
  </div>
</div>
```

#### Usage Example

```tsx
<InventoryGauge
  onHand={245}
  min={100}
  safetyStock={75}
  reorderPoint={200}
  max={500}
  className="mt-4"
/>
```

---

### 4.4 FillRateChart

A line chart showing fill rate trend over 12 months with horizontal target lines at 85%, 90%, and 98%.

**File:** `frontend/src/components/charts/FillRateChart.tsx`

**Used on:** Fill Rate dashboard (Kernel §4.5)
**SRD ref:** §5.5.1

#### Props Interface

```typescript
import type { TimeSeriesPoint, Percentage } from '../../lib/types';

export interface FillRateChartProps {
  /** Monthly fill rate values (0-100 scale) */
  data: TimeSeriesPoint[];
  /** Current fill rate value to display prominently */
  currentValue: Percentage;
  /** Target lines to draw. Defaults to [85, 90, 98]. */
  targets?: Percentage[];
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 320}>
  <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey="period"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
      tickFormatter={formatPeriod}
    />
    <YAxis
      domain={[0, 100]}
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v) => `${v}%`}
    />

    {/* Target reference lines */}
    <ReferenceLine y={85} stroke={SEMANTIC_COLORS.target} strokeDasharray="6 4" label={{ value: '85%', position: 'right', fontSize: 11, fill: SEMANTIC_COLORS.target }} />
    <ReferenceLine y={90} stroke={SEMANTIC_COLORS.targetAlt} strokeDasharray="6 4" label={{ value: '90%', position: 'right', fontSize: 11, fill: SEMANTIC_COLORS.targetAlt }} />
    <ReferenceLine y={98} stroke={SEMANTIC_COLORS.targetTertiary} strokeDasharray="6 4" label={{ value: '98%', position: 'right', fontSize: 11, fill: SEMANTIC_COLORS.targetTertiary }} />

    {/* Fill rate trend line — brand navy */}
    <Line
      type="monotone"
      dataKey="value"
      stroke={CHART_COLORS.primary}
      strokeWidth={2.5}
      dot={{ r: 4, fill: CHART_COLORS.primary, strokeWidth: 0 }}
      activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2, fill: '#fff' }}
      name="Fill Rate"
    />

    <Tooltip
      content={
        <ChartTooltip
          labelFormatter={formatPeriod}
          valueFormatter={(v) => formatPercent(v)}
        />
      }
    />
  </LineChart>
</ResponsiveContainer>
```

#### Current Value Display

Above the chart, render the current fill rate prominently using the KPI typography from Spec 02 §4.7:

```tsx
<div className="flex items-baseline gap-2 mb-2">
  <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
    {formatPercent(currentValue)}
  </span>
  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">current fill rate</span>
</div>
```

#### Usage Example

```tsx
<FillRateChart
  data={fillRateTrend}
  currentValue={70.2}
  targets={[85, 90, 98]}
  height={320}
/>
```

---

### 4.5 DonutChart

A donut/ring chart with a configurable center label. Used for categorical distributions.

**File:** `frontend/src/components/charts/DonutChart.tsx`

**Used on:** Forecast Overview — demand class distribution (Kernel §4.4), source node distribution
**SRD ref:** §1.1

#### Props Interface

```typescript
export interface DonutSegment {
  /** Segment label (e.g., demand class name) */
  name: string;
  /** Numeric value (count or amount) */
  value: number;
  /** Hex color for this segment */
  color: string;
}

export interface DonutChartProps {
  /** Data segments */
  data: DonutSegment[];
  /** Text displayed in the center of the donut — line 1 (large, e.g., "42") */
  centerValue: string;
  /** Text displayed in the center of the donut — line 2 (small, e.g., "Total SKUs") */
  centerLabel: string;
  /** Outer radius in pixels. Inner radius computed as outerRadius * 0.65. */
  outerRadius?: number;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
  /** Optional click handler for donut segments. When provided, segments render with cursor-pointer. */
  onSegmentClick?: (segment: DonutSegment) => void;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 300}>
  <PieChart>
    <Pie
      data={data}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={outerRadius ?? 110}
      innerRadius={(outerRadius ?? 110) * 0.65}
      paddingAngle={2}
      stroke="none"
      style={onSegmentClick ? { cursor: 'pointer' } : undefined}
      onClick={(_, index) => onSegmentClick?.(data[index])}
    >
      {data.map((entry, i) => (
        <Cell key={i} fill={entry.color} />
      ))}
    </Pie>

    <Tooltip
      content={
        <ChartTooltip
          valueFormatter={(v, name) => `${formatNumber(v)} (${((v / total) * 100).toFixed(1)}%)`}
        />
      }
    />

    {/* Center label rendered as custom SVG text */}
    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 28, fontWeight: 700, fill: '#0f172a', fontFamily: CHART_THEME.fontFamilyMono }}>
      {centerValue}
    </text>
    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 11, fontWeight: 500, fill: '#64748b', fontFamily: CHART_THEME.fontFamily, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {centerLabel}
    </text>
  </PieChart>
</ResponsiveContainer>
```

#### Legend

Render a custom legend below the chart as a horizontal flex-wrap list:

```tsx
<div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
  {data.map((segment) => (
    <div key={segment.name} className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
      {segment.name} ({formatNumber(segment.value)})
    </div>
  ))}
</div>
```

#### Usage Example

```tsx
<DonutChart
  data={[
    { name: 'Smooth / Fast', value: 22, color: DEMAND_CLASS_COLORS.SMOOTH_FAST },
    { name: 'Erratic', value: 8, color: DEMAND_CLASS_COLORS.ERRATIC_HIGH_VARIANCE },
    { name: 'Intermittent', value: 12, color: DEMAND_CLASS_COLORS.INTERMITTENT_LUMPY },
    { name: 'New / Cold Start', value: 5, color: DEMAND_CLASS_COLORS.NEW_COLD_START },
    { name: 'Defense Contract', value: 3, color: DEMAND_CLASS_COLORS.DEFENSE_CONTRACT },
  ]}
  centerValue="50"
  centerLabel="Total SKUs"
/>
```

---

### 4.6 StackedBarChart

Stacked bar chart supporting both horizontal and vertical orientations.

**File:** `frontend/src/components/charts/StackedBarChart.tsx`

**Used on:** SKU Detail — lead-time segment breakdown (Kernel §4.3, 6 segments per SRD §2.2.1), Dashboard — days-of-supply by product line (Kernel §4.5)
**SRD ref:** §2.2.1

#### Props Interface

```typescript
export interface StackedBarSeries {
  /** Data key matching the field name in each data element */
  dataKey: string;
  /** Display name for the legend */
  name: string;
  /** Hex color for this series */
  color: string;
}

export interface StackedBarChartProps {
  /** Data array. Each element has a category key and numeric keys matching series dataKeys. */
  data: Record<string, string | number>[];
  /** The data key used for the category axis (e.g., "segmentName", "productLine") */
  categoryKey: string;
  /** Series definitions (one per stack segment) */
  series: StackedBarSeries[];
  /** Orientation of the bars */
  layout?: 'horizontal' | 'vertical';
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Recharts Composition (vertical layout — default)

```tsx
<ResponsiveContainer width="100%" height={height ?? 300}>
  <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey={categoryKey}
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={formatNumber}
    />

    {series.map((s) => (
      <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} stackId="stack" fill={s.color} />
    ))}

    <Tooltip content={<ChartTooltip valueFormatter={(v) => formatNumber(v)} />} />
    <Legend
      verticalAlign="top"
      height={36}
      wrapperStyle={{ fontSize: CHART_THEME.legendFontSize, fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.legendColor }}
    />
  </BarChart>
</ResponsiveContainer>
```

#### Horizontal Layout

When `layout="horizontal"`, swap XAxis and YAxis roles:

```tsx
<BarChart data={data} layout="vertical" margin={...}>
  <XAxis type="number" ... />
  <YAxis type="category" dataKey={categoryKey} width={120} ... />
  ...
</BarChart>
```

#### Lead-Time Segment Usage Example

The 6 transpacific lead-time segments (SRD §2.2.1):

```tsx
<StackedBarChart
  data={[{
    sku: 'Total Lead Time',
    'Factory Production': 28,
    'Inland Drayage (CN)': 5,
    'Port Dwell (Origin)': 8,
    'Ocean Transit': 18,
    'US Port Dwell': 4,
    'Inland Transit (US)': 7,
  }]}
  categoryKey="sku"
  series={[
    { dataKey: 'Factory Production', name: 'Factory Production', color: SERIES_COLORS[0] },
    { dataKey: 'Inland Drayage (CN)', name: 'Inland Drayage (CN)', color: SERIES_COLORS[1] },
    { dataKey: 'Port Dwell (Origin)', name: 'Port Dwell (Origin)', color: SERIES_COLORS[2] },
    { dataKey: 'Ocean Transit', name: 'Ocean Transit', color: SERIES_COLORS[3] },
    { dataKey: 'US Port Dwell', name: 'US Port Dwell', color: SERIES_COLORS[4] },
    { dataKey: 'Inland Transit (US)', name: 'Inland Transit (US)', color: SERIES_COLORS[5] },
  ]}
  layout="horizontal"
  height={120}
/>
```

---

### 4.7 BarChart

Simple vertical bar chart for single-series or grouped comparisons.

**File:** `frontend/src/components/charts/BarChart.tsx`

**Used on:** Forecast Overview — MAPE by demand class, algorithm comparison (Kernel §4.4), Dashboards — monthly revenue (Kernel §4.5)
**SRD ref:** §1.4.3, §1.1.3

#### Props Interface

```typescript
export interface BarChartSeries {
  /** Data key for this series */
  dataKey: string;
  /** Display name */
  name: string;
  /** Hex color */
  color: string;
}

export interface SimpleBarChartProps {
  /** Data array. Each element has a category key and one or more numeric keys. */
  data: Record<string, string | number>[];
  /** The data key for the category axis */
  categoryKey: string;
  /** One or more bar series. Multiple series render as grouped (side-by-side) bars. */
  series: BarChartSeries[];
  /** Optional formatter for the value axis */
  valueFormatter?: (value: number) => string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
  /** Optional click handler for individual bars. Receives the data entry for the clicked bar. */
  onBarClick?: (entry: Record<string, string | number>) => void;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 300}>
  <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey={categoryKey}
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={valueFormatter ?? formatNumber}
    />

    {series.map((s) => (
      <Bar
        key={s.dataKey}
        dataKey={s.dataKey}
        name={s.name}
        fill={s.color}
        radius={[4, 4, 0, 0]}
        maxBarSize={48}
        onClick={(data) => onBarClick?.(data)}
        cursor={onBarClick ? 'pointer' : undefined}
      />
    ))}

    <Tooltip content={<ChartTooltip valueFormatter={(v) => (valueFormatter ?? formatNumber)(v)} />} />
    {series.length > 1 && (
      <Legend
        verticalAlign="top"
        height={36}
        wrapperStyle={{ fontSize: CHART_THEME.legendFontSize, fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.legendColor }}
      />
    )}
  </BarChart>
</ResponsiveContainer>
```

#### Usage Examples

**MAPE by demand class:**

```tsx
<SimpleBarChart
  data={[
    { class: 'Smooth', mape: 12.3 },
    { class: 'Erratic', mape: 28.7 },
    { class: 'Intermittent', mape: 41.2 },
    { class: 'Cold Start', mape: 35.0 },
    { class: 'Defense', mape: 8.5 },
  ]}
  categoryKey="class"
  series={[{ dataKey: 'mape', name: 'MAPE', color: CHART_COLORS.primary }]}
  valueFormatter={formatPercent}
/>
```

**Algorithm comparison (grouped bars):**

```tsx
<SimpleBarChart
  data={[
    { algorithm: 'SARIMA', smooth: 11.2, erratic: 31.5 },
    { algorithm: 'XGBoost', smooth: 14.1, erratic: 22.8 },
    { algorithm: 'Croston\'s', smooth: 18.3, erratic: 45.2 },
    { algorithm: 'Ensemble', smooth: 10.5, erratic: 21.1 },
  ]}
  categoryKey="algorithm"
  series={[
    { dataKey: 'smooth', name: 'Smooth', color: DEMAND_CLASS_COLORS.SMOOTH_FAST },
    { dataKey: 'erratic', name: 'Erratic', color: DEMAND_CLASS_COLORS.ERRATIC_HIGH_VARIANCE },
  ]}
  valueFormatter={formatPercent}
/>
```

---

### 4.8 AreaChart

Filled area chart for time-series metrics.

**File:** `frontend/src/components/charts/AreaChart.tsx`

**Used on:** Dashboard — working capital trend, inventory value over time (Kernel §4.5)
**SRD ref:** §5.5.1

#### Props Interface

```typescript
export interface AreaChartSeries {
  /** Data key matching the field in each data element */
  dataKey: string;
  /** Display name */
  name: string;
  /** Hex color for stroke and fill */
  color: string;
  /** Fill opacity (default 0.15) */
  fillOpacity?: number;
}

export interface SimpleAreaChartProps {
  /** Data array with a period key and one or more numeric keys */
  data: Record<string, string | number>[];
  /** Data key for the X axis (typically "period") */
  xKey: string;
  /** One or more area series */
  series: AreaChartSeries[];
  /** Optional X axis tick formatter (defaults to formatPeriod) */
  xFormatter?: (value: string) => string;
  /** Optional Y axis tick formatter (defaults to formatNumber) */
  yFormatter?: (value: number) => string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 300}>
  <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
    <defs>
      {series.map((s) => (
        <linearGradient key={s.dataKey} id={`gradient-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.color} stopOpacity={s.fillOpacity ?? 0.15} />
          <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>

    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey={xKey}
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
      tickFormatter={xFormatter ?? formatPeriod}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={yFormatter ?? formatNumber}
    />

    {series.map((s) => (
      <Area
        key={s.dataKey}
        type="monotone"
        dataKey={s.dataKey}
        name={s.name}
        stroke={s.color}
        strokeWidth={2}
        fill={`url(#gradient-${s.dataKey})`}
      />
    ))}

    <Tooltip
      content={
        <ChartTooltip
          labelFormatter={xFormatter ?? formatPeriod}
          valueFormatter={(v) => (yFormatter ?? formatNumber)(v)}
        />
      }
    />
    {series.length > 1 && (
      <Legend
        verticalAlign="top"
        height={36}
        wrapperStyle={{ fontSize: CHART_THEME.legendFontSize, fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.legendColor }}
      />
    )}
  </AreaChart>
</ResponsiveContainer>
```

#### Usage Example

```tsx
<SimpleAreaChart
  data={workingCapitalTrend}
  xKey="period"
  series={[
    { dataKey: 'inventoryValue', name: 'Inventory Value', color: CHART_COLORS.primary },
  ]}
  yFormatter={formatCurrency}
/>
```

---

### 4.9 ScatterPlot

X-Y scatter chart for comparing two numeric dimensions.

**File:** `frontend/src/components/charts/ScatterPlot.tsx`

**Used on:** Forecast Overview — forecast accuracy: predicted vs. actual (Kernel §4.4)
**SRD ref:** §1.4.3

#### Props Interface

```typescript
export interface ScatterDataPoint {
  /** X-axis value */
  x: number;
  /** Y-axis value */
  y: number;
  /** Optional label for tooltip (e.g., SKU ID) */
  label?: string;
  /** Optional color override for this point */
  color?: string;
}

export interface ScatterPlotProps {
  /** Data points */
  data: ScatterDataPoint[];
  /** X-axis label */
  xLabel: string;
  /** Y-axis label */
  yLabel: string;
  /** Optional X axis formatter */
  xFormatter?: (value: number) => string;
  /** Optional Y axis formatter */
  yFormatter?: (value: number) => string;
  /** Whether to draw a 45-degree reference line (predicted = actual) */
  showDiagonal?: boolean;
  /** Default dot color (used when individual point has no color override) */
  dotColor?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
  /** Optional click handler for individual data points. When provided, dots render with cursor-pointer. */
  onDotClick?: (point: ScatterDataPoint) => void;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 350}>
  <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey="x"
      type="number"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
      tickFormatter={xFormatter ?? formatNumber}
      label={{ value: xLabel, position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: CHART_THEME.axisColor } }}
    />
    <YAxis
      dataKey="y"
      type="number"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={yFormatter ?? formatNumber}
      label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: CHART_THEME.axisColor } }}
    />

    {/* Optional 45-degree reference line */}
    {showDiagonal && (
      <ReferenceLine
        segment={[{ x: 0, y: 0 }, { x: maxVal, y: maxVal }]}
        stroke="#cbd5e1"
        strokeDasharray="6 4"
        strokeWidth={1}
      />
    )}

    <Scatter
      data={data}
      fill={dotColor ?? CHART_COLORS.primary}
      style={onDotClick ? { cursor: 'pointer' } : undefined}
      onClick={(_, index) => onDotClick?.(data[index])}
    >
      {data.map((point, i) => (
        <Cell key={i} fill={point.color ?? dotColor ?? CHART_COLORS.primary} />
      ))}
    </Scatter>

    <Tooltip
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const point = payload[0].payload as ScatterDataPoint;
        return (
          <div style={{
            backgroundColor: CHART_THEME.tooltipBg,
            border: `1px solid ${CHART_THEME.tooltipBorder}`,
            borderRadius: CHART_THEME.tooltipRadius,
            boxShadow: CHART_THEME.tooltipShadow,
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: CHART_THEME.fontFamily,
          }}>
            {point.label && <p style={{ fontWeight: 600, marginBottom: 4 }}>{point.label}</p>}
            <p>{xLabel}: {(xFormatter ?? formatNumber)(point.x)}</p>
            <p>{yLabel}: {(yFormatter ?? formatNumber)(point.y)}</p>
          </div>
        );
      }}
    />
  </ScatterChart>
</ResponsiveContainer>
```

#### Behavior

- When `onDotClick` is provided, all dots render with `cursor: pointer` to indicate interactivity. Clicking a dot invokes the callback with the corresponding `ScatterDataPoint`.
- The 45-degree diagonal reference line (when `showDiagonal` is true) spans from the origin to `maxVal` (the maximum of all x and y values).

#### Usage Example

```tsx
<ScatterPlot
  data={skuAccuracyPoints.map((s) => ({
    x: s.actual,
    y: s.predicted,
    label: s.partNumber,
    color: DEMAND_CLASS_COLORS[s.demandClass],
  }))}
  xLabel="Actual Demand"
  yLabel="Predicted Demand"
  showDiagonal
/>
```

---

### 4.10 TariffRoadmapChart

A specialized stepped line chart showing tariff escalation over 3 years with horizontal SKU threshold lines indicating when each SKU flips to reshore-favorable.

**File:** `frontend/src/components/charts/TariffRoadmapChart.tsx`

**Used on:** BOM Explorer (Kernel §4.6)
**SRD ref:** §3.2.5

#### Props Interface

```typescript
export interface TariffStep {
  /** Date or label for this tariff step (e.g., "2026-Q1") */
  period: string;
  /** Tariff rate as $/net-ton or percentage */
  rate: number;
}

export interface SkuThreshold {
  /** SKU part number or label */
  label: string;
  /** Tariff rate at which this SKU becomes reshore-favorable */
  thresholdRate: number;
  /** Color for the threshold line */
  color: string;
}

export interface TariffRoadmapChartProps {
  /** Tariff escalation steps over the projection period */
  tariffSteps: TariffStep[];
  /** SKU-level threshold lines showing when each SKU flips */
  skuThresholds: SkuThreshold[];
  /** Y-axis label (e.g., "$/net-ton" or "Tariff Rate %") */
  yLabel: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS class */
  className?: string;
}
```

#### Recharts Composition

```tsx
<ResponsiveContainer width="100%" height={height ?? 350}>
  <ComposedChart data={tariffSteps} margin={{ top: 8, right: 120, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      dataKey="period"
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={{ stroke: CHART_THEME.gridColor }}
    />
    <YAxis
      tick={{ fontSize: CHART_THEME.axisFontSize, fill: CHART_THEME.axisColor }}
      tickLine={false}
      axisLine={false}
      tickFormatter={formatNumber}
      label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: CHART_THEME.axisColor } }}
    />

    {/* Tariff escalation as stepped line */}
    <Line
      type="stepAfter"
      dataKey="rate"
      stroke="#0f172a"
      strokeWidth={2.5}
      dot={{ r: 4, fill: '#0f172a' }}
      name="Tariff Rate"
    />

    {/* SKU threshold reference lines */}
    {skuThresholds.map((sku) => (
      <ReferenceLine
        key={sku.label}
        y={sku.thresholdRate}
        stroke={sku.color}
        strokeDasharray="8 4"
        strokeWidth={1.5}
        label={{
          value: sku.label,
          position: 'right',
          fontSize: 11,
          fill: sku.color,
        }}
      />
    ))}

    <Tooltip
      content={
        <ChartTooltip
          valueFormatter={(v) => formatNumber(v) + ` ${yLabel}`}
        />
      }
    />
    <Legend
      verticalAlign="top"
      height={36}
      wrapperStyle={{ fontSize: CHART_THEME.legendFontSize, fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.legendColor }}
    />
  </ComposedChart>
</ResponsiveContainer>
```

#### Stepped Line Behavior

The `type="stepAfter"` attribute on the `<Line>` causes the line to hold each value horizontally until the next data point, creating a staircase pattern that accurately represents tariff rate changes (which are discrete policy events, not continuous trends).

Right margin is widened (`right: 120`) to accommodate SKU threshold labels positioned to the right of the chart area.

#### Usage Example

```tsx
<TariffRoadmapChart
  tariffSteps={[
    { period: '2026-Q1', rate: 50 },
    { period: '2026-Q3', rate: 70 },
    { period: '2027-Q1', rate: 95 },
    { period: '2027-Q3', rate: 110 },
    { period: '2028-Q1', rate: 125 },
    { period: '2028-Q3', rate: 140 },
  ]}
  skuThresholds={[
    { label: '1100031-1 Trac-Lock', thresholdRate: 65, color: SERIES_COLORS[0] },
    { label: '3100531-L1 Plug-In', thresholdRate: 85, color: SERIES_COLORS[1] },
    { label: '1060750 KingPin', thresholdRate: 120, color: SERIES_COLORS[2] },
  ]}
  yLabel="$/net-ton"
/>
```

---

## 5. Barrel Export

**File:** `frontend/src/components/charts/index.ts`

```typescript
export { ForecastChart } from './ForecastChart';
export type { ForecastChartProps } from './ForecastChart';

export { DemandHistoryChart } from './DemandHistoryChart';
export type { DemandHistoryChartProps } from './DemandHistoryChart';

export { InventoryGauge } from './InventoryGauge';
export type { InventoryGaugeProps } from './InventoryGauge';

export { FillRateChart } from './FillRateChart';
export type { FillRateChartProps } from './FillRateChart';

export { DonutChart } from './DonutChart';
export type { DonutChartProps, DonutSegment } from './DonutChart';

export { StackedBarChart } from './StackedBarChart';
export type { StackedBarChartProps, StackedBarSeries } from './StackedBarChart';

export { SimpleBarChart } from './BarChart';
export type { SimpleBarChartProps, BarChartSeries } from './BarChart';

export { SimpleAreaChart } from './AreaChart';
export type { SimpleAreaChartProps, AreaChartSeries } from './AreaChart';

export { ScatterPlot } from './ScatterPlot';
export type { ScatterPlotProps, ScatterDataPoint } from './ScatterPlot';

export { TariffRoadmapChart } from './TariffRoadmapChart';
export type { TariffRoadmapChartProps, TariffStep, SkuThreshold } from './TariffRoadmapChart';

export { ChartTooltip } from './ChartTooltip';
export { CHART_COLORS, SERIES_COLORS, SEMANTIC_COLORS, GAUGE_COLORS, SOURCE_NODE_COLORS, DEMAND_CLASS_COLORS, FILL_RATE_COLORS, ARBITRAGE_COLORS, HEATMAP_COLORS, CHART_THEME } from './theme';
export { formatNumber, formatCurrency, formatPercent, formatPeriod, formatPeriodFull, formatCompact } from './formatters';
```

---

## 6. Responsive Behavior

All charts follow these responsive rules:

| Concern | Rule |
|---------|------|
| Container sizing | Every chart uses `<ResponsiveContainer width="100%" height={props.height}>`. The chart fills the width of its parent container and responds to resize events. |
| Minimum width | Charts degrade gracefully at 320px container width. Below that, axis labels may overlap (acceptable for this demo — min target viewport is 1024px per Kernel §7). |
| Aspect ratio | Not enforced. Height is fixed via props with sensible defaults (300-400px). Parent pages control layout via grid/flex. |
| Label density | X-axis tick count is managed by Recharts' default `interval="preserveStartEnd"`. For charts with many periods (24+ months), consider setting `interval={Math.ceil(data.length / 8)}` to avoid label crowding. |
| Touch targets | Active dots on Line/Area charts have `r={6}` for adequate tap targets. |

---

## 7. Accessibility Notes

| Concern | Approach |
|---------|----------|
| Color alone | Color is supplemented by shape (dots vs. lines), patterns (dashed reference lines vs. solid data lines), and labels. |
| Screen readers | Each chart component wraps in a `<div role="img" aria-label="...">` with a descriptive label summarizing what the chart shows. |
| Keyboard | Recharts does not natively support keyboard navigation of data points. This is acceptable for the demo build. Production would add a data table fallback. |

---

## 8. Page-to-Chart Matrix

Cross-reference showing which charts appear on which pages:

| Chart Component | SKU Detail | Forecast Overview | Fill Rate | Inventory Health | Lead-Time | Reshoring | Arbitrage | BOM Explorer | Inventory Params |
|-----------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ForecastChart | X | | | | | | | | |
| DemandHistoryChart | X | | | | | | | | |
| InventoryGauge | X | | | | | | | | X |
| FillRateChart | | | X | | | | | | |
| DonutChart | | X | | | | X | | | |
| StackedBarChart | X | | | X | X | | | | |
| SimpleBarChart | | X | | | | | X | | |
| SimpleAreaChart | | | | X | | | X | | |
| ScatterPlot | | X | | | | | | | |
| TariffRoadmapChart | | | | | | | | X | |

---

## 9. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | All 10 chart components exist in `frontend/src/components/charts/` and compile without TypeScript errors | `tsc --noEmit` passes |
| AC-2 | Every chart renders with sample/mock data and is visually correct | Visual inspection with storybook-style harness or test page |
| AC-3 | All charts use `<ResponsiveContainer>` and resize when their parent container changes width | Resize browser, verify charts reflow |
| AC-4 | ForecastChart renders P50 line, 80% shaded interval, 95% shaded interval, historical demand line, and optional pandemic band | Visual inspection with sample data |
| AC-5 | InventoryGauge renders four color zones (red, amber, green, blue) with correct threshold positions and on-hand marker | Test with on-hand values in each zone |
| AC-6 | FillRateChart renders three dashed target reference lines at 85%, 90%, 98% with current value displayed prominently | Visual inspection |
| AC-7 | DonutChart renders center label text (value + description) and a custom legend | Visual inspection |
| AC-8 | TariffRoadmapChart renders stepped line with SKU threshold reference lines labeled to the right | Visual inspection |
| AC-9 | All tooltips follow the shared ChartTooltip style: white background, shadow, rounded, text-sm, formatted values with commas | Hover over data points on each chart |
| AC-10 | Axis labels use 11px slate-500 (`#64748b`) sans-serif; Y-axis tick values use JetBrains Mono | Visual inspection |
| AC-11 | Grid lines use slate-200 (`#e2e8f0`) with dashed pattern `3 3` | Visual inspection |
| AC-12 | Numeric values in tooltips use JetBrains Mono font and are formatted with commas and appropriate units (%, $, units) | Hover and inspect |
| AC-13 | Color palette is brand-consistent: first series is navy `#084974`, second is gold `#ffc10a`; all charts draw from `theme.ts` constants matching Spec 02 §5 | Code review + visual inspection |
| AC-14 | Barrel export in `index.ts` re-exports all components, props types, theme constants, and formatters | Import from `components/charts` in a test file |
| AC-15 | ScatterPlot renders 45-degree diagonal reference line when `showDiagonal` is true | Visual inspection |
| AC-16 | ScatterPlot fires `onDotClick` with the clicked data point when a dot is clicked, and renders dots with `cursor-pointer` when the prop is provided | Click a dot; verify callback fires with correct data |
| AC-17 | DonutChart fires `onSegmentClick` with the clicked segment data when a segment is clicked | Click a segment; verify callback fires |
| AC-18 | SimpleBarChart fires `onBarClick` with the clicked bar's data entry when a bar is clicked | Click a bar; verify callback fires |

---

## 10. Out of Scope

- Data fetching or mock data generation (covered in mock data specs)
- Chart animations beyond Recharts defaults
- Print/export-to-image functionality
- Dark mode variants
- Drill-down interactions (e.g., clicking a bar to navigate) — handled by page-level specs
- Storybook or isolated component testing harness setup
