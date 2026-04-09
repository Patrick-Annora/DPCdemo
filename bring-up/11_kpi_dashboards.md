# Spec 11 — KPI Dashboards

**Status:** Draft
**Depends on:** Spec 01 (Project Setup), Spec 02 (Design System), Spec 03 (Type Definitions), Spec 04 (Mock Data — `dashboard-kpis.ts`), Spec 05 (Common Components — `SummaryCard`, `DataTable`, `PageHeader`, `FilterBar`), Spec 06 (Chart Components — `FillRateChart`, `StackedBarChart`, `BarChart`, `AreaChart`, `DonutChart`)
**Kernel refs:** §4.5 (KPI Dashboards), §5.8 (Dashboard KPIs), §6 (Routes), §7 (Design System)
**SRD refs:** §5.5 (Performance Dashboards)

---

## 1. Overview

This spec defines five KPI dashboard pages, each mounted as a sub-route under `/dashboard/`. Dashboards are read-only reporting views composed from reusable chart and common components (Specs 05 and 06). All data comes from the mock data layer (`dashboard-kpis.ts` and supporting files from Spec 04). No dashboard manages write state — they are purely presentational.

Each dashboard follows a consistent visual layout:

1. **Summary cards** across the top (2-4 per row in a responsive grid)
2. **Charts** in the middle section (1-2 per row)
3. **Tables** at the bottom for detailed drill-down data

All dashboards include a sub-navigation tab bar at the top for switching between the five views.

---

## 2. File Structure

```
frontend/src/
  pages/
    Dashboard/
      DashboardLayout.tsx          # Shared layout with tab navigation
      FillRateDashboard.tsx        # /dashboard/fill-rate
      InventoryHealthDashboard.tsx # /dashboard/inventory
      LeadTimeDashboard.tsx        # /dashboard/lead-time
      ReshoringDashboard.tsx       # /dashboard/reshoring
      ArbitrageSavingsDashboard.tsx # /dashboard/arbitrage
      index.ts                     # Barrel export
  data/
    dashboard-kpis.ts              # Already defined in Spec 04 §15
```

---

## 3. Shared Dashboard Layout

### 3.1 `DashboardLayout.tsx`

A wrapper component providing consistent tab navigation across all five dashboards. Renders as an `<Outlet>` layout route.

**Props:**

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Visual Description:**

```tsx
<div className="flex flex-col h-full">
  {/* Tab navigation */}
  <nav className="flex border-b border-slate-200 bg-white px-6">
    {DASHBOARD_TABS.map((tab) => (
      <NavLink
        key={tab.path}
        to={tab.path}
        className={({ isActive }) =>
          `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            isActive
              ? 'border-navy-500 text-navy-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`
        }
      >
        <tab.icon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        {tab.label}
      </NavLink>
    ))}
  </nav>

  {/* Dashboard content */}
  <div className="flex-1 overflow-auto p-6">
    {children}
  </div>
</div>
```

**Tab Definitions:**

```typescript
import { Target, Package, Clock, ArrowRightLeft, PiggyBank } from 'lucide-react';

const DASHBOARD_TABS = [
  { path: '/dashboard/fill-rate',  label: 'Fill Rate',   icon: Target },
  { path: '/dashboard/inventory',  label: 'Inventory',   icon: Package },
  { path: '/dashboard/lead-time',  label: 'Lead Time',   icon: Clock },
  { path: '/dashboard/reshoring',  label: 'Reshoring',   icon: ArrowRightLeft },
  { path: '/dashboard/arbitrage',  label: 'Arbitrage',   icon: PiggyBank },
] as const;
```

### 3.2 Route Configuration

Add to the router (Spec 01):

```tsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Navigate to="fill-rate" replace />} />
  <Route path="fill-rate" element={<FillRateDashboard />} />
  <Route path="inventory" element={<InventoryHealthDashboard />} />
  <Route path="lead-time" element={<LeadTimeDashboard />} />
  <Route path="reshoring" element={<ReshoringDashboard />} />
  <Route path="arbitrage" element={<ArbitrageSavingsDashboard />} />
</Route>
```

Navigating to `/dashboard` redirects to `/dashboard/fill-rate`.

---

## 4. Dashboard 1: Fill Rate Tracker

**Route:** `/dashboard/fill-rate`
**File:** `pages/Dashboard/FillRateDashboard.tsx`
**Kernel ref:** §4.5 row 1
**SRD ref:** §5.5.1

### 4.1 Summary Cards

A 4-column grid of `SummaryCard` components using data from `MOCK_DASHBOARD_KPIS` (Spec 04 §15.1):

| Card | label | value | trend | target |
|------|-------|-------|-------|--------|
| 1 | Current Fill Rate | 72.3% | { direction: 'up', delta: '+2.3%', favorable: true } | 85% |
| 2 | Lines Shipped Complete | 4,821 / 6,668 | { direction: 'up', delta: '+180', favorable: true } | -- |
| 3 | Critical Stockouts | 2 | { direction: 'down', delta: '-1', favorable: true } | 0 |
| 4 | Avg Days to Resolve | 4.2 days | { direction: 'down', delta: '-0.8', favorable: true } | < 3 days |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {fillRateKPIs.map((kpi) => (
    <SummaryCard
      key={kpi.label}
      {...kpi}
      onClick={() => handleFillRateCardClick(kpi.label)}
      className="cursor-pointer hover:shadow-md transition-shadow"
    />
  ))}
</div>
```

**Card click behavior (see Spec 16 §3.4.1):**

```typescript
const handleFillRateCardClick = (label: string) => {
  switch (label) {
    case 'Critical Stockouts':
      navigate('/alerts?severity=CRITICAL');
      break;
    case 'Avg Days to Resolve':
      navigate('/alerts');
      break;
    default:
      trendRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
};
```

### 4.2 Fill Rate 12-Month Trend (FillRateChart)

Uses the `FillRateChart` component from Spec 06 §4.4 with `MOCK_FILL_RATE_TREND` data (Spec 04 §15.6).

```tsx
<section ref={trendRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fill Rate Trend (12 Months)</h3>
  <FillRateChart
    data={MOCK_FILL_RATE_TREND}
    currentValue={72.3}
    targets={[85, 90, 98]}
    height={320}
  />
</section>
```

Target lines at 85% (red dashed), 90% (amber dashed), and 98% (green dashed) per Spec 06 `SEMANTIC_COLORS.target/targetAlt/targetTertiary`.

### 4.3 Fill Rate by Product Line (SimpleBarChart)

A grouped bar chart comparing fill rate across product families. Data is constructed in-component from mock data. **Bars are clickable** — clicking a product line bar navigates to the Inventory Parameters page filtered to that product line (see Spec 16 §3.4.2).

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fill Rate by Product Line</h3>
  <SimpleBarChart
    data={[
      { productLine: 'Pedestal Systems', fillRate: 68.5 },
      { productLine: 'Seating',          fillRate: 75.2 },
      { productLine: 'Components',       fillRate: 82.1 },
      { productLine: 'Accessories',      fillRate: 60.3 },
      { productLine: 'Raw Materials',    fillRate: 88.0 },
      { productLine: 'Shark Seating',    fillRate: 94.5 },
    ]}
    categoryKey="productLine"
    series={[{ dataKey: 'fillRate', name: 'Fill Rate %', color: CHART_COLORS.primary }]}
    valueFormatter={(v) => `${v.toFixed(1)}%`}
    onBarClick={(entry) => navigate(`/inventory/parameters?productLine=${encodeURIComponent(entry.productLine)}`)}
    height={280}
  />
</section>
```

Product lines ordered by ascending fill rate to highlight problem areas. Pedestal Systems and Accessories are lowest (these are the most China-dependent), while Shark Seating is highest (defense contracts with guaranteed supply). **Clicking any bar navigates to the Inventory Parameters page filtered to that product line**, so the CEO can immediately see which SKUs are dragging the line down.

### 4.4 Fill Rate by Source Node (SimpleBarChart)

A bar chart comparing fill rate across the three source nodes. **Bars are clickable** — clicking a source node bar navigates to Inventory Parameters filtered by that source.

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fill Rate by Source Node</h3>
  <SimpleBarChart
    data={[
      { sourceNode: 'SCHECO Shanghai', fillRate: 65.8 },
      { sourceNode: 'Nixa MO',        fillRate: 85.3 },
      { sourceNode: 'Shark NZ',       fillRate: 94.5 },
    ]}
    categoryKey="sourceNode"
    series={[{ dataKey: 'fillRate', name: 'Fill Rate %', color: CHART_COLORS.secondary }]}
    valueFormatter={(v) => `${v.toFixed(1)}%`}
    onBarClick={(entry) => {
      const sourceMap: Record<string, string> = {
        'SCHECO Shanghai': 'SCHECO_SHANGHAI',
        'Nixa MO': 'NIXA_MO',
        'Shark NZ': 'SHARK_NZ',
      };
      navigate(`/inventory/parameters?source=${sourceMap[entry.sourceNode]}`);
    }}
    height={220}
  />
</section>
```

SCHECO is notably lowest (65.8%) due to transpacific lead-time variability and tariff disruptions. Nixa is mid-range (85.3%) as domestic manufacturing is more reliable. Shark NZ is highest (94.5%) due to contract-driven predictable demand. **Clicking any bar navigates to Inventory Parameters filtered by that source node.**

---

## 5. Dashboard 2: Inventory Health

**Route:** `/dashboard/inventory`
**File:** `pages/Dashboard/InventoryHealthDashboard.tsx`
**Kernel ref:** §4.5 row 2
**SRD ref:** §5.5.1

### 5.1 Summary Cards

A 3-column first row + 3-column second row grid using data from `MOCK_DASHBOARD_KPIS` (Spec 04 §15.2):

| Card | label | value | trend | target |
|------|-------|-------|-------|--------|
| 1 | Total Inventory Value | $6.5M | { direction: 'down', delta: '-$0.3M', favorable: true } | $5.5M |
| 2 | Days of Supply (Avg) | 45 days | { direction: 'down', delta: '-3', favorable: true } | 30 days |
| 3 | Excess Inventory | $820K | { direction: 'up', delta: '+$90K', favorable: false } | < $500K |
| 4 | SKUs Below Min | 18 | { direction: 'up', delta: '+3', favorable: false } | 0 |
| 5 | SKUs Above Max | 12 | { direction: 'flat', delta: '0', favorable: true } | 0 |
| 6 | Parameters Not Set | 40% | { direction: 'down', delta: '-5%', favorable: true } | 0% |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
  {inventoryHealthKPIs.map((kpi) => (
    <SummaryCard
      key={kpi.label}
      {...kpi}
      onClick={() => handleInventoryCardClick(kpi.label)}
      className="cursor-pointer hover:shadow-md transition-shadow"
    />
  ))}
</div>
```

**Card click behavior (see Spec 16 §3.4.1):**

```typescript
const handleInventoryCardClick = (label: string) => {
  switch (label) {
    case 'SKUs Below Min':
      navigate('/inventory/parameters?violation=below-min');
      break;
    case 'SKUs Above Max':
      navigate('/inventory/parameters?violation=above-max');
      break;
    case 'Parameters Not Set':
      navigate('/inventory/parameters?violation=not-set');
      break;
    case 'Excess Inventory':
      excessRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'Days of Supply (Avg)':
      dosRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'Total Inventory Value':
      wcRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
  }
};
```

### 5.2 Days of Supply by Product Line (StackedBarChart)

A stacked horizontal bar chart showing average days of supply broken down by inventory zone (below min, in range, above max). **Bars are clickable** — clicking a product line navigates to Inventory Parameters filtered to that product line.

```tsx
<section ref={dosRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Days of Supply by Product Line</h3>
  <StackedBarChart
    data={[
      { productLine: 'Pedestal Systems', belowMin: 8,  inRange: 25, aboveMax: 5  },
      { productLine: 'Seating',          belowMin: 5,  inRange: 35, aboveMax: 10 },
      { productLine: 'Components',       belowMin: 3,  inRange: 42, aboveMax: 8  },
      { productLine: 'Accessories',      belowMin: 12, inRange: 18, aboveMax: 15 },
      { productLine: 'Raw Materials',    belowMin: 2,  inRange: 55, aboveMax: 3  },
      { productLine: 'Shark Seating',    belowMin: 0,  inRange: 48, aboveMax: 0  },
    ]}
    categoryKey="productLine"
    series={[
      { dataKey: 'belowMin', name: 'Below Min',  color: '#ef4444' },
      { dataKey: 'inRange',  name: 'In Range',   color: '#10b981' },
      { dataKey: 'aboveMax', name: 'Above Max',  color: '#3b82f6' },
    ]}
    onBarClick={(entry) => navigate(`/inventory/parameters?productLine=${encodeURIComponent(entry.productLine)}`)}
    layout="horizontal"
    height={280}
  />
</section>
```

### 5.3 Working Capital Trend (SimpleAreaChart)

Area chart showing inventory value over 12 months, from the $9M peak in 2022 down to the current $6.5M. Uses `MOCK_INVENTORY_VALUE_TREND` from Spec 04 §15.6.

```tsx
<section ref={wcRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Working Capital Trend</h3>
  <p className="text-sm text-slate-500 mb-3">Total inventory value over 12 months ($M)</p>
  <SimpleAreaChart
    data={MOCK_INVENTORY_VALUE_TREND.map((p) => ({
      period: p.period,
      value: p.value,
    }))}
    xKey="period"
    series={[{ dataKey: 'value', name: 'Inventory Value ($M)', color: CHART_COLORS.primary }]}
    yFormatter={(v) => `$${v.toFixed(1)}M`}
    height={280}
  />
</section>
```

### 5.4 Excess Inventory Table (DataTable)

A table listing parts above their max inventory level with value and recommended action. **Part numbers are clickable links** to SKU Detail (see Spec 16 §3.4.3).

**Columns:**

| Column | Data Key | Width | Format |
|--------|----------|-------|--------|
| Part Number | `partNumber` | 120px | Clickable `<Link to={/sku/${partNumber}}>` styled `text-navy-600 hover:underline font-mono text-sm` |
| Description | `description` | flex | text |
| Product Line | `productLine` | 140px | text |
| On Hand | `onHand` | 80px | number, right-aligned |
| Max | `maxQty` | 80px | number, right-aligned |
| Excess Qty | `excessQty` | 90px | number, right-aligned, red text |
| Excess Value | `excessValue` | 100px | currency, right-aligned, red text |
| Recommended Action | `action` | 200px | text |

**Data:** Derived in-component by joining `MOCK_INVENTORY` with `MOCK_INVENTORY_PARAMETERS` and `MOCK_SKUS`, filtering to `onHand > maxQty` where `maxQty > 0`. At least 3 rows per Spec 04 §8.6:

| partNumber | description | onHand | maxQty | excessQty | excessValue | action |
|-----------|-------------|--------|--------|-----------|-------------|--------|
| `1042030` | WHEELHOUSE XL HELM SEAT | 520 | 400 | 120 | $18,000 | Defer PO #4505, offer promo pricing |
| `1270100` | 4 IN POWER-RISE PEDESTAL PKG | 180 | 120 | 60 | $10,500 | Cancel pending PO, reallocate capital |
| `1670200` | TABLE TOP OVAL 18X30 | 95 | 60 | 35 | $1,750 | Review demand forecast, consolidate |

```tsx
<section ref={excessRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Excess Inventory</h3>
  <p className="text-sm text-slate-500 mb-3">Parts with on-hand quantity above maximum level</p>
  <DataTable columns={excessColumns} data={excessInventoryData} />
</section>
```

### 5.5 Shortage Analysis Table (DataTable)

A table listing parts below their minimum inventory level or approaching stockout. **Part numbers are clickable links** to SKU Detail (see Spec 16 §3.4.3).

**Columns:**

| Column | Data Key | Width | Format |
|--------|----------|-------|--------|
| Part Number | `partNumber` | 120px | Clickable `<Link to={/sku/${partNumber}}>` styled `text-navy-600 hover:underline font-mono text-sm` |
| Description | `description` | flex | text |
| Source | `sourceNode` | 100px | `SourceNodeBadge` |
| On Hand | `onHand` | 80px | number, right-aligned |
| Min | `minQty` | 80px | number, right-aligned |
| Shortage | `shortageQty` | 90px | number, right-aligned, red text |
| Days of Supply | `daysOfSupply` | 100px | `DaysOfSupplyIndicator` |
| Severity | `alertLevel` | 100px | `AlertSeverityBadge` |

**Data:** Derived by filtering `onHand < minQty` where `minQty > 0`. At least 5 rows per Spec 04 §8.6:

| partNumber | onHand | minQty | shortageQty | daysOfSupply | alertLevel |
|-----------|--------|--------|-------------|-------------|------------|
| `3100531-L1` | 45 | 100 | 55 | 3 | CRITICAL |
| `1100031-1` | 120 | 200 | 80 | 4 | CRITICAL |
| `1041030` | 180 | 250 | 70 | 18 | WARNING |
| `1610100` | 85 | 120 | 35 | 12 | WARNING |
| `1061200` | 90 | 150 | 60 | 8 | WARNING |

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Shortage Analysis</h3>
  <p className="text-sm text-slate-500 mb-3">Parts below minimum inventory level or approaching stockout</p>
  <DataTable columns={shortageColumns} data={shortageData} />
</section>
```

### 5.6 Min/Max Violation Summary

A compact 3-cell summary row showing violation counts, rendered as styled **clickable** cards below the tables. Each card navigates to the Inventory Parameters page with the corresponding violation filter pre-applied (see Spec 16 §3.4.2).

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <button
    onClick={() => navigate('/inventory/parameters?violation=below-min')}
    className="bg-red-50 border border-red-200 rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
  >
    <p className="text-2xl font-semibold text-red-800 font-mono">18</p>
    <p className="text-sm text-danger-500 mt-1">Below Min</p>
  </button>
  <button
    onClick={() => navigate('/inventory/parameters?violation=above-max')}
    className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
  >
    <p className="text-2xl font-semibold text-blue-800 font-mono">12</p>
    <p className="text-sm text-blue-600 mt-1">Above Max</p>
  </button>
  <button
    onClick={() => navigate('/inventory/parameters?violation=not-set')}
    className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
  >
    <p className="text-2xl font-semibold text-slate-800 font-mono">40%</p>
    <p className="text-sm text-slate-500 mt-1">No Parameters Set</p>
  </button>
</div>
```

---

## 6. Dashboard 3: Lead-Time Monitor

**Route:** `/dashboard/lead-time`
**File:** `pages/Dashboard/LeadTimeDashboard.tsx`
**Kernel ref:** §4.5 row 3
**SRD ref:** §5.5.1

### 6.1 Summary Cards

A 4-column grid using data from `MOCK_DASHBOARD_KPIS` (Spec 04 §15.3):

| Card | label | value | trend | target |
|------|-------|-------|-------|--------|
| 1 | Avg Lead Time (SCHECO) | 59 days | { direction: 'up', delta: '+4 days', favorable: false } | 50 days |
| 2 | Avg Lead Time (Nixa) | 10 days | { direction: 'flat', delta: '0', favorable: true } | 9 days |
| 3 | On-Time Delivery Rate | 78% | { direction: 'down', delta: '-3%', favorable: false } | 95% |
| 4 | In-Transit Shipments | 14 | { direction: 'flat', delta: '0', favorable: true } | -- |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {leadTimeKPIs.map((kpi) => (
    <SummaryCard
      key={kpi.label}
      {...kpi}
      onClick={() => handleLeadTimeCardClick(kpi.label)}
      className="cursor-pointer hover:shadow-md transition-shadow"
    />
  ))}
</div>
```

**Card click behavior (see Spec 16 §3.4.1):**

```typescript
const handleLeadTimeCardClick = (label: string) => {
  switch (label) {
    case 'Avg Lead Time (SCHECO)':
      segmentRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'On-Time Delivery Rate':
      carrierRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'In-Transit Shipments':
      navigate('/alerts?severity=WARNING');
      break;
    default:
      break;
  }
};
```

### 6.2 Actual vs. Modeled Lead Time by Segment (StackedBarChart)

A stacked horizontal bar chart showing the 6 transpacific segments with baseline vs. actual side-by-side. Uses `MOCK_LEAD_TIME_SEGMENTS` from Spec 04 §13.

```tsx
<section ref={segmentRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">
    SCHECO Lead Time: Actual vs. Baseline by Segment
  </h3>
  <SimpleBarChart
    data={MOCK_LEAD_TIME_SEGMENTS.map((seg) => ({
      segment: seg.segmentName,
      baseline: seg.baselineDays,
      actual: seg.actualDays,
    }))}
    categoryKey="segment"
    series={[
      { dataKey: 'baseline', name: 'Baseline (days)', color: CHART_COLORS.secondary },
      { dataKey: 'actual',   name: 'Actual (days)',   color: CHART_COLORS.primary },
    ]}
    valueFormatter={(v) => `${v} days`}
    height={300}
  />
</section>
```

The 6 segments from Spec 04 §13.1: Factory Production (14 baseline / 16 actual), Inland Transport Shanghai (3/3), Ocean Transit (18/22), Port Clearance & Customs (5/7), Rail/Truck to Springfield (7/8), Receiving & QC (3/3). Total: 50 baseline / 59 actual (+9 day variance).

### 6.3 Segment Performance Cards

A 6-card grid showing each transpacific segment with its baseline, actual, and variance. Color-coded by status.

```tsx
<section className="mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Segment Performance</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {MOCK_LEAD_TIME_SEGMENTS.map((seg) => (
      <div
        key={seg.segmentName}
        className={`
          rounded-xl border p-4
          ${seg.status === 'HEALTHY' ? 'bg-green-50 border-green-200' : ''}
          ${seg.status === 'DEGRADED' ? 'bg-amber-50 border-amber-200' : ''}
          ${seg.status === 'STALE' ? 'bg-yellow-50 border-yellow-200' : ''}
          ${seg.status === 'ERROR' ? 'bg-red-50 border-red-200' : ''}
        `}
      >
        <p className="text-sm font-medium text-slate-700">{seg.segmentName}</p>
        <div className="mt-2 flex items-baseline gap-4">
          <div>
            <p className="text-xs text-slate-500">Baseline</p>
            <p className="text-lg font-semibold font-mono">{seg.baselineDays}d</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Actual</p>
            <p className="text-lg font-semibold font-mono">{seg.actualDays}d</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Variance</p>
            <p className={`text-lg font-semibold font-mono ${seg.variance > 0 ? 'text-danger-500' : 'text-success-500'}`}>
              {seg.variance > 0 ? '+' : ''}{seg.variance}d
            </p>
          </div>
        </div>
        <StatusBadge
          label={seg.status}
          bgColor={seg.status === 'HEALTHY' ? 'bg-green-100' : 'bg-amber-100'}
          textColor={seg.status === 'HEALTHY' ? 'text-green-800' : 'text-amber-800'}
          className="mt-2"
        />
      </div>
    ))}
  </div>
</section>
```

### 6.4 Carrier Scorecard (DataTable)

A table showing carrier performance metrics. Data constructed in-component.

**Columns:**

| Column | Data Key | Width | Format |
|--------|----------|-------|--------|
| Carrier | `carrier` | 180px | text |
| Route | `route` | 180px | text |
| On-Time % | `onTimeRate` | 100px | percentage, right-aligned |
| Avg Delay (days) | `avgDelay` | 120px | number, right-aligned |
| Shipments (90d) | `shipmentCount` | 120px | number, right-aligned |
| Status | `status` | 100px | `StatusBadge` |

**Data:**

| carrier | route | onTimeRate | avgDelay | shipmentCount | status |
|---------|-------|-----------|----------|---------------|--------|
| COSCO Shipping | Shanghai - Long Beach | 72% | 4.2 | 8 | DEGRADED |
| Evergreen Marine | Shanghai - Long Beach | 81% | 2.8 | 6 | HEALTHY |
| Maersk | Shanghai - Los Angeles | 68% | 5.1 | 4 | DEGRADED |
| FedEx Freight | Long Beach - Springfield MO | 92% | 0.5 | 14 | HEALTHY |
| XPO Logistics | Long Beach - Springfield MO | 88% | 1.2 | 10 | HEALTHY |

```tsx
<section ref={carrierRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Carrier Scorecard</h3>
  <DataTable columns={carrierColumns} data={carrierScorecardData} />
</section>
```

### 6.5 Lead-Time Trend (SimpleAreaChart)

12-month trend showing average end-to-end lead time for SCHECO shipments. Data constructed in-component.

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Lead-Time Trend (SCHECO, 12 Months)</h3>
  <SimpleAreaChart
    data={[
      { period: '2025-04', value: 52 },
      { period: '2025-05', value: 53 },
      { period: '2025-06', value: 55 },
      { period: '2025-07', value: 54 },
      { period: '2025-08', value: 56 },
      { period: '2025-09', value: 58 },
      { period: '2025-10', value: 55 },
      { period: '2025-11', value: 54 },
      { period: '2025-12', value: 56 },
      { period: '2026-01', value: 57 },
      { period: '2026-02', value: 58 },
      { period: '2026-03', value: 59 },
    ]}
    xKey="period"
    series={[{ dataKey: 'value', name: 'Avg Lead Time (days)', color: CHART_COLORS.quinary }]}
    yFormatter={(v) => `${v}d`}
    height={260}
  />
</section>
```

Trend shows gradual increase from 52 days to 59 days, reflecting port congestion and tariff-related customs delays.

---

## 7. Dashboard 4: Reshoring Progress

**Route:** `/dashboard/reshoring`
**File:** `pages/Dashboard/ReshoringDashboard.tsx`
**Kernel ref:** §4.5 row 4
**SRD ref:** §5.5.1

### 7.1 Summary Cards

A 4-column grid using data from `MOCK_DASHBOARD_KPIS` (Spec 04 §15.4). **All cards are clickable** (see Spec 16 §3.4.1).

| Card | label | value | trend | target | Click Target |
|------|-------|-------|-------|--------|-------------|
| 1 | China:US Sourcing Ratio | 60:40 | { direction: 'flat', delta: '0', favorable: true } | 40:60 | Scroll to ratio gauge |
| 2 | SKUs Reshored (YTD) | 3 | { direction: 'up', delta: '+1', favorable: true } | 12 by EOY | Scroll to transition table |
| 3 | Tariff Exposure | $1.8M/yr | { direction: 'down', delta: '-$120K', favorable: true } | < $800K | Navigate to `/dashboard/arbitrage` |
| 4 | Projected Annual Savings | $125K | { direction: 'up', delta: '+$45K', favorable: true } | $500K | Navigate to `/dashboard/arbitrage` |

```typescript
const handleReshoringCardClick = (label: string) => {
  switch (label) {
    case 'China:US Sourcing Ratio':
      gaugeRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'SKUs Reshored (YTD)':
      transitionRef.current?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'Tariff Exposure':
    case 'Projected Annual Savings':
      navigate('/dashboard/arbitrage');
      break;
  }
};
```

### 7.2 China:US Ratio Gauge

A custom visual gauge showing the current 60:40 ratio vs. the 40:60 target. Rendered as a horizontal stacked bar with two segments.

```tsx
<section ref={gaugeRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Sourcing Ratio: China vs. US</h3>

  {/* Current ratio */}
  <div className="mb-4">
    <p className="text-sm text-slate-500 mb-2">Current (60:40)</p>
    <div className="flex h-10 rounded-lg overflow-hidden border border-slate-200">
      <div className="bg-navy-700 flex items-center justify-center text-white text-sm font-semibold"
           style={{ width: '60%' }}>
        China 60%
      </div>
      <div className="bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold"
           style={{ width: '40%' }}>
        US 40%
      </div>
    </div>
  </div>

  {/* Target ratio */}
  <div>
    <p className="text-sm text-slate-500 mb-2">Target (40:60)</p>
    <div className="flex h-10 rounded-lg overflow-hidden border border-slate-200 opacity-60">
      <div className="bg-navy-700 flex items-center justify-center text-white text-sm font-semibold"
           style={{ width: '40%' }}>
        China 40%
      </div>
      <div className="bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold"
           style={{ width: '60%' }}>
        US 60%
      </div>
    </div>
  </div>
</section>
```

Uses navy-700 for SCHECO/China (per Kernel §7.3) and success (#10b981) for Nixa/US.

### 7.3 Projected Ratio at Current Trajectory (FillRateChart used as line chart)

A line chart showing the domestic sourcing percentage over 12 months, with a target reference line at 60%. Uses `MOCK_RESHORING_RATIO_TREND` from Spec 04 §15.6.

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Domestic Sourcing % Trajectory</h3>
  <p className="text-sm text-slate-500 mb-3">
    Domestic share trending from 37% to 40% over 12 months. Target: 60%.
  </p>
  <FillRateChart
    data={MOCK_RESHORING_RATIO_TREND}
    currentValue={40}
    targets={[60]}
    height={280}
  />
</section>
```

The chart shows a slow upward trend from 37% to 40%, with the 60% target line clearly illustrating the gap remaining.

### 7.4 Revenue by Source Node (DonutChart)

A donut chart showing revenue distribution across source nodes. Revenue data derived from Kernel §5.8 ($31.5M total). **Donut segments are clickable** — clicking a source node segment navigates to the Inventory Parameters page filtered by that source (see Spec 16 §3.4.2).

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Source Node</h3>
  <DonutChart
    data={[
      { name: 'SCHECO Shanghai', value: 18.9, color: SOURCE_NODE_COLORS.SCHECO_SHANGHAI },
      { name: 'Nixa MO',        value: 9.5,  color: SOURCE_NODE_COLORS.NIXA_MO },
      { name: 'Shark NZ',       value: 3.1,  color: SOURCE_NODE_COLORS.SHARK_NZ },
    ]}
    centerValue="$31.5M"
    centerLabel="TTM Revenue"
    onSegmentClick={(segment) => {
      const sourceMap: Record<string, string> = {
        'SCHECO Shanghai': 'SCHECO_SHANGHAI',
        'Nixa MO': 'NIXA_MO',
        'Shark NZ': 'SHARK_NZ',
      };
      navigate(`/inventory/parameters?source=${sourceMap[segment.name]}`);
    }}
    height={300}
  />
</section>
```

Revenue split: SCHECO $18.9M (60%), Nixa $9.5M (30%), Shark NZ $3.1M (10%) -- consistent with the 60:30:10 source node distribution from Kernel §5.1.

### 7.5 SKUs Transitioned This Quarter (DataTable)

A table listing SKUs that have been reshored in the current quarter. **Part numbers are clickable links** to SKU Detail (see Spec 16 §3.4.3).

**Columns:**

| Column | Data Key | Width | Format |
|--------|----------|-------|--------|
| Part Number | `partNumber` | 120px | Clickable `<Link to={/sku/${partNumber}}>` styled `text-navy-600 hover:underline font-mono text-sm` |
| Description | `description` | flex | text |
| Product Line | `productLine` | 140px | text |
| Previous Source | `previousSource` | 120px | `SourceNodeBadge` |
| New Source | `newSource` | 120px | `SourceNodeBadge` |
| Transition Date | `transitionDate` | 120px | date |
| Annual Savings | `annualSavings` | 120px | currency, right-aligned, green text |

**Data:** 3 SKUs reshored YTD (per Spec 04 §15.4):

| partNumber | description | previousSource | newSource | transitionDate | annualSavings |
|-----------|-------------|----------------|-----------|----------------|---------------|
| `1100031-1` | TRAC-LOCK SWIVEL LOCKING | SCHECO_SHANGHAI | NIXA_MO | 2026-01-15 | $52,000 |
| `1641019` | SPRING-LOCK BASE - ROUND | SCHECO_SHANGHAI | NIXA_MO | 2026-02-20 | $38,000 |
| `1600113` | TAPER-LOCK BUSHING 2-3/8 | SCHECO_SHANGHAI | NIXA_MO | 2026-03-10 | $35,000 |

```tsx
<section ref={transitionRef} className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">SKUs Transitioned (Q1 2026)</h3>
  <DataTable columns={transitionColumns} data={transitionedSkusData} />
</section>
```

---

## 8. Dashboard 5: Arbitrage Savings

**Route:** `/dashboard/arbitrage`
**File:** `pages/Dashboard/ArbitrageSavingsDashboard.tsx`
**Kernel ref:** §4.5 row 5
**SRD ref:** §5.5.1

### 8.1 Summary Cards

A 4-column grid. Data derived from Spec 04 §12 (arbitrage data) and §15.4 (reshoring KPIs):

| Card | label | value | trend | target |
|------|-------|-------|-------|--------|
| 1 | Cumulative Savings (YTD) | $125K | { direction: 'up', delta: '+$45K', favorable: true } | $500K EOY |
| 2 | Tariff Avoided (YTD) | $82K | { direction: 'up', delta: '+$28K', favorable: true } | -- |
| 3 | Freight Saved (YTD) | $31K | { direction: 'up', delta: '+$12K', favorable: true } | -- |
| 4 | Other Savings (YTD) | $12K | { direction: 'up', delta: '+$5K', favorable: true } | -- |

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {arbitrageKPIs.map((kpi) => (
    <SummaryCard
      key={kpi.label}
      {...kpi}
      onClick={() => cumulativeRef.current?.scrollIntoView({ behavior: 'smooth' })}
      className="cursor-pointer hover:shadow-md transition-shadow"
    />
  ))}
</div>
```

All arbitrage summary cards scroll to the cumulative savings chart on click (see Spec 16 §3.4.1).

### 8.2 Cumulative Savings (SimpleAreaChart)

An area chart showing cumulative savings from reshored SKUs over 12 months.

```tsx
<section ref={cumulativeRef} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Cumulative Savings from Reshored SKUs</h3>
  <SimpleAreaChart
    data={[
      { period: '2025-04', value: 0 },
      { period: '2025-05', value: 0 },
      { period: '2025-06', value: 0 },
      { period: '2025-07', value: 0 },
      { period: '2025-08', value: 0 },
      { period: '2025-09', value: 0 },
      { period: '2025-10', value: 0 },
      { period: '2025-11', value: 0 },
      { period: '2025-12', value: 0 },
      { period: '2026-01', value: 35000 },
      { period: '2026-02', value: 72000 },
      { period: '2026-03', value: 125000 },
    ]}
    xKey="period"
    series={[{ dataKey: 'value', name: 'Cumulative Savings', color: CHART_COLORS.secondary }]}
    yFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
    height={300}
  />
</section>
```

Savings ramp up starting Q1 2026 when the first 3 SKUs were reshored (per Dashboard 4 transition table).

### 8.3 Savings Breakdown (StackedBarChart)

A stacked bar chart showing monthly savings split by tariff avoided, freight avoided, and other savings.

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Savings Breakdown</h3>
  <StackedBarChart
    data={[
      { month: 'Jan 26', tariff: 22000, freight: 9000,  other: 4000  },
      { month: 'Feb 26', tariff: 28000, freight: 10000, other: 4000  },
      { month: 'Mar 26', tariff: 32000, freight: 12000, other: 4000  },
    ]}
    categoryKey="month"
    series={[
      { dataKey: 'tariff',  name: 'Tariff Avoided',  color: CHART_COLORS.primary },
      { dataKey: 'freight', name: 'Freight Avoided',  color: CHART_COLORS.secondary },
      { dataKey: 'other',   name: 'Other Savings',    color: CHART_COLORS.tertiary },
    ]}
    height={280}
  />
</section>
```

Tariff avoidance is the largest component (~65% of savings), consistent with the 95% Section 301 tariff rate on flagged HTS codes (Spec 04 §12).

### 8.4 Monthly Savings Trend (SimpleAreaChart)

A stacked area chart showing the same breakdown over time, providing a trend view.

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Savings Trend</h3>
  <SimpleAreaChart
    data={[
      { period: '2025-10', tariff: 0,     freight: 0,     other: 0 },
      { period: '2025-11', tariff: 0,     freight: 0,     other: 0 },
      { period: '2025-12', tariff: 0,     freight: 0,     other: 0 },
      { period: '2026-01', tariff: 22000, freight: 9000,  other: 4000 },
      { period: '2026-02', tariff: 28000, freight: 10000, other: 4000 },
      { period: '2026-03', tariff: 32000, freight: 12000, other: 4000 },
    ]}
    xKey="period"
    series={[
      { dataKey: 'tariff',  name: 'Tariff Avoided',  color: CHART_COLORS.primary },
      { dataKey: 'freight', name: 'Freight Avoided',  color: CHART_COLORS.secondary },
      { dataKey: 'other',   name: 'Other Savings',    color: CHART_COLORS.tertiary },
    ]}
    yFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
    height={260}
  />
</section>
```

### 8.5 Top Reshored SKUs by Savings (DataTable)

A table ranking SKUs by their annualized savings from reshoring. **Part numbers are clickable links** to SKU Detail, and each row includes a "View Cost Breakdown" link to the BOM Explorer (see Spec 16 §3.4.3).

**Columns:**

| Column | Data Key | Width | Format |
|--------|----------|-------|--------|
| Rank | `rank` | 50px | number, center-aligned |
| Part Number | `partNumber` | 120px | Clickable `<Link to={/sku/${partNumber}}>` styled `text-navy-600 hover:underline font-mono text-sm` |
| Description | `description` | flex | text |
| Previous CLC | `chinaLandedCost` | 110px | currency, right-aligned |
| Current NDC | `nixaDomesticCost` | 110px | currency, right-aligned |
| Savings/Unit | `savingsPerUnit` | 110px | currency, right-aligned, green text |
| Annual Volume | `annualVolume` | 100px | number, right-aligned |
| Annual Savings | `annualSavings` | 120px | currency, right-aligned, green text, bold |
| Actions | — | 140px | `<Link to={/bom?part=${partNumber}}>` styled as text link: "Cost Breakdown →" |

**Data:** Top reshored SKUs, matching the transition table from Dashboard 4:

| rank | partNumber | chinaLandedCost | nixaDomesticCost | savingsPerUnit | annualVolume | annualSavings |
|------|-----------|-----------------|------------------|----------------|-------------|---------------|
| 1 | `1100031-1` | $14.80 | $9.60 | $5.20 | 10,000 | $52,000 |
| 2 | `1641019` | $11.50 | $7.85 | $3.65 | 10,400 | $38,000 |
| 3 | `1600113` | $8.20 | $5.30 | $2.90 | 12,000 | $35,000 |

```tsx
<section className="bg-white rounded-xl border border-slate-200 p-5">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Reshored SKUs by Savings</h3>
  <DataTable columns={topSavingsColumns} data={topReshoredSkusData} />
</section>
```

---

## 9. Component Composition Summary

All five dashboards compose from reusable components. No new chart or table primitives are introduced in this spec.

### Components Used from Spec 05 (Common)

| Component | Used In |
|-----------|---------|
| `SummaryCard` | All 5 dashboards — summary card grids |
| `DataTable` | Inventory Health (excess, shortage), Lead Time (carrier), Reshoring (transitions), Arbitrage (top SKUs) |
| `PageHeader` | Not used directly — `DashboardLayout` provides header via tab navigation |
| `StatusBadge` | Lead Time (segment status, carrier status) |
| `AlertSeverityBadge` | Inventory Health (shortage table severity column) |
| `SourceNodeBadge` | Inventory Health (shortage table), Reshoring (transition table source columns) |
| `DaysOfSupplyIndicator` | Inventory Health (shortage table) |
| `FilterBar` | Not used in initial spec — dashboards are read-only views |

### Components Used from Spec 06 (Charts)

| Component | Used In |
|-----------|---------|
| `FillRateChart` | Fill Rate (12-month trend), Reshoring (ratio trajectory) |
| `SimpleBarChart` | Fill Rate (by product line, by source node), Lead Time (actual vs. baseline) |
| `StackedBarChart` | Inventory Health (days of supply), Arbitrage (savings breakdown) |
| `SimpleAreaChart` | Inventory Health (working capital), Lead Time (trend), Arbitrage (cumulative savings, monthly trend) |
| `DonutChart` | Reshoring (revenue by source node) |

### Theme Constants Used from Spec 06 `theme.ts`

| Constant | Usage |
|----------|-------|
| `CHART_COLORS.primary` | Primary chart series (navy-700) |
| `CHART_COLORS.secondary` | Secondary chart series (emerald-500) |
| `CHART_COLORS.tertiary` | Tertiary chart series (amber-500) |
| `CHART_COLORS.quinary` | Lead-time trend line (red-500) |
| `SOURCE_NODE_COLORS` | Reshoring donut chart segments |

---

## 10. Data Flow

All data originates from `frontend/src/data/dashboard-kpis.ts` and supporting mock data files. Each dashboard component imports data at the module level:

```typescript
// MOCK: Replace with API call to /api/dashboards/fill-rate
import {
  MOCK_DASHBOARD_KPIS,
  MOCK_FILL_RATE_TREND,
  MOCK_INVENTORY_VALUE_TREND,
  MOCK_RESHORING_RATIO_TREND,
} from '@/data';

// MOCK: Replace with API call to /api/inventory/positions
import { MOCK_INVENTORY } from '@/data';

// MOCK: Replace with API call to /api/inventory/parameters
import { MOCK_INVENTORY_PARAMETERS } from '@/data';

// MOCK: Replace with API call to /api/lead-times
import { MOCK_LEAD_TIME_SEGMENTS } from '@/data';

// MOCK: Replace with API call to /api/skus
import { MOCK_SKUS } from '@/data';
```

Derived data (e.g., excess inventory rows, shortage rows, carrier scorecard) is computed in-component using `useMemo` hooks that join and filter mock data arrays.

```typescript
const excessInventoryData = useMemo(() => {
  // API_PLACEHOLDER: /api/inventory/excess
  return MOCK_INVENTORY
    .filter((inv) => {
      const params = MOCK_INVENTORY_PARAMETERS.find((p) => p.skuId === inv.skuId);
      return params && params.maxQty > 0 && inv.onHand > params.maxQty;
    })
    .map((inv) => {
      const sku = MOCK_SKUS.find((s) => s.skuId === inv.skuId)!;
      const params = MOCK_INVENTORY_PARAMETERS.find((p) => p.skuId === inv.skuId)!;
      const excessQty = inv.onHand - params.maxQty;
      return {
        partNumber: sku.partNumber,
        description: sku.description,
        productLine: sku.productLine,
        onHand: inv.onHand,
        maxQty: params.maxQty,
        excessQty,
        excessValue: excessQty * sku.unitCost,
        action: '...', // Hardcoded recommendation
      };
    });
}, []);
```

---

## 11. Placeholder Markers

Each dashboard file includes the following markers per Kernel §8:

| Location | Marker |
|----------|--------|
| Each mock data import | `// MOCK: Replace with API call to /api/dashboards/{dashboard-name}` |
| Derived data computations | `// API_PLACEHOLDER: /api/inventory/excess` etc. |
| All 5 dashboard components | `// WEBSOCKET_PLACEHOLDER: Real-time KPI refresh via WebSocket subscription` |

---

## 12. Responsive Layout

All dashboards follow these responsive breakpoints:

| Breakpoint | Summary Card Grid | Chart Layout | Table Layout |
|------------|-------------------|--------------|--------------|
| `< 640px` (sm) | 1 column | Full-width, stacked | Full-width, horizontal scroll |
| `640px - 1023px` (md) | 2 columns | Full-width, stacked | Full-width |
| `>= 1024px` (lg) | 3-4 columns (per dashboard) | Side-by-side where specified | Full-width |

Each chart section uses `bg-white rounded-xl border border-slate-200 p-5 mb-6` for consistent card styling. Section titles use `text-lg font-semibold text-slate-900 mb-4` per Kernel §7.4.

---

## 13. Barrel Export

**File:** `pages/Dashboard/index.ts`

```typescript
export { DashboardLayout } from './DashboardLayout';
export { FillRateDashboard } from './FillRateDashboard';
export { InventoryHealthDashboard } from './InventoryHealthDashboard';
export { LeadTimeDashboard } from './LeadTimeDashboard';
export { ReshoringDashboard } from './ReshoringDashboard';
export { ArbitrageSavingsDashboard } from './ArbitrageSavingsDashboard';
```

---

## 14. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | All 5 dashboard pages render without errors at their respective routes | Navigate to each `/dashboard/*` route |
| 2 | `/dashboard` redirects to `/dashboard/fill-rate` | Navigate to `/dashboard`, confirm redirect |
| 3 | Tab navigation bar appears on all 5 dashboards and highlights the active tab | Click through all tabs |
| 4 | Fill Rate dashboard shows 4 summary cards with correct values from Spec 04 §15.1 | Compare card values to spec |
| 5 | Fill Rate 12-month trend chart renders with target lines at 85%, 90%, 98% | Visual check for 3 dashed reference lines |
| 6 | Fill rate by product line bar chart shows 6 product lines | Count bars |
| 7 | Fill rate by source node bar chart shows 3 source nodes with SCHECO lowest | Visual check ordering |
| 8 | Inventory Health dashboard shows 6 summary cards with correct values from Spec 04 §15.2 | Compare card values to spec |
| 9 | Days of supply stacked bar chart renders with 3 color-coded segments (red/green/blue) per product line | Visual check |
| 10 | Working capital area chart shows 12-month trend from $7.2M to $6.5M | Verify first and last data points |
| 11 | Excess inventory table shows at least 3 rows with correct part numbers (1042030, 1270100, 1670200) | Row count and part number check |
| 12 | Shortage analysis table shows at least 5 rows with severity badges | Row count and badge check |
| 13 | Lead Time dashboard shows actual vs. baseline grouped bars for 6 segments totaling 50 baseline / 59 actual | Sum verification |
| 14 | Segment performance cards show 6 cards color-coded by health status (4 green, 2 amber) | Count and color check |
| 15 | Carrier scorecard table shows 5 rows with on-time percentages | Row count |
| 16 | Reshoring dashboard shows China:US ratio gauge with current 60:40 and target 40:60 | Visual check of two horizontal bars |
| 17 | Revenue donut chart shows 3 segments summing to $31.5M | Sum verification |
| 18 | SKUs transitioned table shows 3 rows with source node badges (SCHECO -> NIXA) | Row count and badge check |
| 19 | Arbitrage cumulative savings area chart ramps from $0 to $125K | Verify endpoint value |
| 20 | Arbitrage savings breakdown stacked bar shows 3 categories (tariff, freight, other) | Legend check |
| 21 | Top reshored SKUs table shows 3 rows with per-unit and annual savings | Row and column check |
| 22 | All summary cards display trend arrows with correct color (green=favorable, red=unfavorable) | Spot-check across dashboards |
| 23 | All charts render responsively at 1024px minimum width without horizontal overflow | Resize browser window |
| 24 | All currency values use Kernel-consistent figures ($6.5M inventory, $31.5M revenue, 70% fill rate baseline) | Cross-reference with Kernel §5.8 |
| 25 | `// MOCK:` placeholder comments appear on all mock data imports | Grep for `MOCK:` in all 6 files |
| 26 | All summary cards show `cursor-pointer` on hover and navigate or scroll on click | Click each card; verify per Spec 16 §3.4.1 |
| 27 | Fill Rate "Critical Stockouts" card navigates to `/alerts?severity=CRITICAL` | Click card; verify URL |
| 28 | Inventory Health "SKUs Below Min" card navigates to `/inventory/parameters?violation=below-min` | Click card; verify filter state |
| 29 | Clicking a bar in fill-rate-by-product-line chart navigates to `/inventory/parameters?productLine=${line}` | Click bar; verify URL |
| 30 | Clicking a bar in fill-rate-by-source-node chart navigates to `/inventory/parameters?source=${node}` | Click bar; verify URL |
| 31 | Revenue donut segment click navigates to `/inventory/parameters?source=${node}` | Click segment; verify URL |
| 32 | Part numbers in Excess, Shortage, Transitioned, and Top Reshored tables are clickable links to `/sku/${partNumber}` | Click; verify navigation |
| 33 | Violation summary cards navigate to `/inventory/parameters` with correct filter | Click each; verify URL |
| 34 | "Cost Breakdown" link on Top Reshored table navigates to `/bom?part=${partNumber}` | Click; verify BOM Explorer |
| 35 | Reshoring "Tariff Exposure" and "Savings" cards navigate to `/dashboard/arbitrage` | Click; verify navigation |
