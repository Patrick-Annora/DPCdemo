# 00_KERNEL_V2.md — The Constitution

> **Immutable source of truth for springfield-demand-v2.** No AI agent may contradict this document.
> If a gap exists, the human must update this file — agents must stop and ask.
>
> This document replaces the v1 Kernel. Where v1 targeted a 12-page demo-breadth prototype
> with fabricated data, v2 is a focused 5-page application grounded in real Springfield Marine
> data parsed from actual .xls files.

---

## 1. Project Overview

**Name:** springfield-demand-v2
**Description:** AI-driven demand planning and inventory optimization system for Springfield Marine Company — a focused, real-data-grounded rebuild.

### Authoritative Documents

| Document | Purpose |
|----------|---------|
| [`SRD_AI_Demand_Planning_System.md`](SRD_AI_Demand_Planning_System.md) | **System Requirements Document** — full 5-module specification. All feature decisions trace to this SRD. |
| [`DATA_ANALYSIS.md`](DATA_ANALYSIS.md) | **Data Assessment** — real data inventory, gaps, quality findings, ML readiness. |

### What Changed from v1

| Dimension | v1 | v2 |
|-----------|----|----|
| Pages | 12 (every SRD module) | 5 core + 4 roadmap stubs |
| Data | Fabricated mock data for ~50 parts | Real data parsed from .xls files for all active parts |
| Forecasting | Hardcoded realistic-looking numbers | Pre-computed in Python using Nixtla StatsForecast with real demand history |
| Demand classification | Conceptual labels | Syntetos-Boylan classification (ADI/CV²) computed from actual sales data |
| Design system | Basic Tailwind + custom components | shadcn/ui component library with Tailwind CSS 4 |
| Navigation | Flat sidebar, all 12 pages | Collapsible sidebar (icon mode), Cmd+K palette, 5 core pages + "Potential Roadmap" section |
| Philosophy | Show breadth, impress with coverage | Show depth, impress with real data and real analysis |

### Build Scope

| Principle | Rule |
|-----------|------|
| **Frontend-first** | 5 core pages are fully built and interactive with real data |
| **Real data** | All data is parsed from actual Springfield Marine .xls files — Item Master, Daily Sales, Monthly Inventory Snapshots |
| **Pre-computed forecasts** | Python data pipeline runs offline: parses data, classifies demand, runs statistical forecasts, exports TypeScript constants |
| **No live backend** | The app runs as a standalone React app. No API server, no database, no auth at runtime |
| **Roadmap stubs** | 4 additional pages shown in a "Potential Roadmap" nav section as future-capability placeholders |
| **Fatigue-resistant design** | Every screen follows <7 KPIs, progressive disclosure, generous spacing, info tooltips on technical terms |

---

## 2. Architecture

### 2.1 Stack

| Layer | Technology | Manager |
|-------|------------|---------|
| Framework | React 19 | `npm` |
| Bundler | Vite 6 | `npm` |
| Language | TypeScript 5.9 (strict mode) | `npm` |
| Styling | Tailwind CSS 4 | `npm` |
| Components | shadcn/ui | `npm` |
| Routing | React Router v7 | `npm` |
| State | React Context for local demo state | `npm` |
| Charts | Recharts | `npm` |
| Tables | TanStack Table | `npm` |
| Icons | Lucide React | `npm` |
| Command Palette | cmdk | `npm` |

### 2.2 Data Pipeline (Offline, Python)

The data pipeline runs once (or on refresh) outside the React app. It is NOT part of the frontend build.

```
Data/*.xls  →  Python scripts  →  frontend/src/data/*.ts
```

| Step | Input | Process | Output |
|------|-------|---------|--------|
| 1. Parse | `ITEM MASTER.xls` | Extract all active parts (5,678), normalize fields, recalculate ABC codes | `itemMaster.ts` |
| 2. Parse | `Daily Sales by cust by part.xlsx` | Clean (remove non-product rows, dedup, handle returns), aggregate to monthly per SKU | `monthlySales.ts`, `customerSales.ts` |
| 3. Parse | `*_INVENTORY.xls` (55 files) | Aggregate bin-level to part-level per snapshot, build time series | `inventoryTimeline.ts` |
| 4. Classify | Monthly demand per SKU | Syntetos-Boylan classification (ADI/CV²) for parts with >=12 months history | `demandClassification.ts` |
| 5. Forecast | Classified SKUs | StatsForecast: AutoARIMA, AutoETS, CrostonSBA, TSB; conformal prediction intervals | `forecasts.ts` |
| 6. Compute | Forecasts + inventory + Item Master | Safety stock recommendations, min/max suggestions, violation detection | `inventoryParameters.ts` |
| 7. Generate | All above | Alerts from inventory violations; worklist items from alerts + forecast signals | `alerts.ts`, `worklist.ts` |

Pipeline tools: Python 3.12, pandas, openpyxl/xlrd, Nixtla StatsForecast, scikit-learn.

### 2.3 Project Structure

```
frontend/                       # React + Vite app
  src/
    pages/                      # Full-page views (one per route)
      Dashboard/                # Executive Dashboard (home page)
      ActionCenter/             # Buyer Action Center
      SkuDetail/                # Single-SKU deep dive
      InventoryParameters/      # Bulk min/max management
      ForecastOverview/         # Portfolio-level forecast performance
      roadmap/                  # Stub pages for future capabilities
        FillRateTracker/
        LeadTimeMonitor/
        BomExplorer/
        ReshoringArbitrage/
    components/
      ui/                       # shadcn/ui components (Button, Card, Table, Badge, etc.)
      layout/                   # Shell, Sidebar, TopBar, Breadcrumbs, CommandPalette
      charts/                   # FanChart, StackedBar, DonutChart, Gauge, Sparkline
      domain/                   # ActionCard, SkuHeader, KpiCard, SeverityBadge, etc.
    data/                       # Parsed real data as TypeScript constants
    lib/                        # Utilities, formatters, types, enums
    hooks/                      # Custom React hooks (useWorklist, useSkuDetail, etc.)
    styles/                     # Global CSS, Tailwind theme overrides
```

---

## 3. Domain Model

> These types define the shape of the real parsed data AND the TypeScript interfaces used throughout the app.

### 3.1 Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **SKU** | A unique part from the Item Master | `partNum`, `description`, `typeCode` (P/M), `classId` (FG/RM/CM), `productFamily`, `abcCode`, `stdCost`, `isActive`, `buyerId`, `htsCode`, `commercialBrand`, `commercialCategory`, `commercialSubCategory`, `minimumQty`, `maximumQty`, `safetyQty` |
| **Customer** | A customer from Daily Sales | `custId`, `name` (if available), `totalRevenue`, `orderCount`, `firstOrderDate`, `lastOrderDate`, `skuCount` |
| **MonthlyDemand** | Aggregated monthly demand per SKU | `partNum`, `period` (YYYY-MM), `quantity`, `revenue`, `cost`, `invoiceCount`, `customerCount` |
| **CustomerDemand** | Demand per customer per SKU per month | `custId`, `partNum`, `period`, `quantity`, `revenue` |
| **InventorySnapshot** | Monthly inventory position per SKU | `partNum`, `period` (YYYY-MM), `onHand` (aggregated across bins), `inventoryValue` |
| **DemandClassification** | Syntetos-Boylan classification result | `partNum`, `demandClass`, `adi` (average demand interval), `cvSquared` (CV² of demand sizes), `algorithmPrimary`, `algorithmFallback`, `monthsOfHistory`, `avgMonthlyDemand` |
| **Forecast** | Probabilistic forecast per SKU per period | `partNum`, `period`, `algorithm`, `p50`, `p10`, `p90`, `p2_5`, `p97_5` |
| **ForecastAccuracy** | Model performance per SKU | `partNum`, `algorithm`, `mase`, `smape`, `mape`, `fva` (vs. naive) |
| **InventoryParameters** | Min/max planning parameters per SKU | `partNum`, `currentMin`, `currentMax`, `currentSafety` (from Item Master, typically 0), `recommendedMin`, `recommendedMax`, `recommendedSafety`, `recommendedRop`, `targetCsl`, `leadTimeDays`, `parameterStatus`, `source`, `daysOfSupply` |
| **Alert** | Inventory/forecast alert | `alertId`, `partNum`, `severity`, `triggerCondition`, `triggerDetail`, `recommendedAction`, `daysToStockout`, `revenueImpact`, `createdAt` |
| **WorklistItem** | Buyer action item | `itemId`, `partNum`, `priorityRank`, `sortRationale`, `actionType`, `severity`, `recommendedQty`, `estimatedCost`, `status`, `confidenceScore`, `confidenceJustification`, `buyerId` |
| **SafetyStock** | Computed safety stock recommendation | `partNum`, `targetCsl`, `safetyStockQty`, `reorderPoint`, `zScore`, `sigmaD`, `sigmaLt`, `dAvg`, `ltAvg` |

### 3.2 Enums

| Enum | Values | Source |
|------|--------|--------|
| **DemandClass** | `SMOOTH`, `ERRATIC`, `INTERMITTENT`, `LUMPY`, `NEW` | Syntetos-Boylan classification from real data |
| **AlertSeverity** | `CRITICAL`, `WARNING`, `WATCH`, `EXCESS` | SRD §5.3.1 |
| **ActionType** | `NEW_PO`, `EXPEDITE_PO`, `CANCEL_DEFER`, `REVIEW_EXCESS`, `SET_PARAMETERS`, `REVIEW_MIN_VIOLATION` | SRD §5.2.1 |
| **WorklistStatus** | `PENDING`, `APPROVED`, `SNOOZED`, `ESCALATED` | SRD §5.4 |
| **ParameterStatus** | `NOT_SET`, `SYSTEM_CALCULATED`, `BUYER_OVERRIDE`, `NEEDS_REVIEW` | SRD §2.1 |
| **ParameterSource** | `NONE`, `SYSTEM_AUTO`, `BUYER_MANUAL`, `EPICOR_IMPORT` | SRD §2.1 |
| **TypeCode** | `P` (Purchased), `M` (Manufactured) | Item Master |
| **ClassID** | `FG` (Finished Goods), `RM` (Raw Materials), `CM` (Components) | Item Master |
| **ForecastAlgorithm** | `AutoARIMA`, `AutoETS`, `CrostonSBA`, `TSB`, `SeasonalNaive`, `Ensemble` | StatsForecast library |
| **ABCCode** | `A`, `B`, `C`, `D`, `Z` | Recalculated from revenue contribution |

### 3.3 Demand Classification: Syntetos-Boylan Method

Classification uses two dimensions computed from real monthly demand data:

| Metric | Formula | Cutoff |
|--------|---------|--------|
| **ADI** (Average Demand Interval) | Mean number of periods between non-zero demands | 1.32 |
| **CV²** (Squared Coefficient of Variation) | Variance of non-zero demand sizes / Mean² of non-zero demand sizes | 0.49 |

| Quadrant | ADI | CV² | Class | Algorithm |
|----------|-----|-----|-------|-----------|
| Low ADI, Low CV² | < 1.32 | < 0.49 | **SMOOTH** | AutoARIMA |
| Low ADI, High CV² | < 1.32 | >= 0.49 | **ERRATIC** | AutoETS |
| High ADI, Low CV² | >= 1.32 | < 0.49 | **INTERMITTENT** | CrostonSBA |
| High ADI, High CV² | >= 1.32 | >= 0.49 | **LUMPY** | CrostonSBA |
| Insufficient data | < 12 months history | — | **NEW** | TSB |

Algorithm selection rationale:
- **AutoARIMA** for smooth: handles seasonality and trend in regular demand series
- **AutoETS** for erratic: exponential smoothing adapts to level shifts in high-variance regular demand
- **CrostonSBA** for intermittent/lumpy: separates demand occurrence from demand size modeling
- **TSB** (Teunter-Syntetos-Babai) for new/obsolescence-risk: includes demand probability decay

### 3.4 Safety Stock Formula

For all SKUs with sufficient data:

```
Safety Stock = Z(CSL) × sqrt(LT_avg × sigma_d² + d_avg² × sigma_LT²)
```

Where:
- `Z(CSL)` = inverse normal CDF at target cycle service level (90% → 1.28, 95% → 1.645, 98% → 2.054)
- `LT_avg` = average lead time in periods (assumed by source: Purchased=60 days, Manufactured=10 days, until real PO data available)
- `sigma_d` = standard deviation of per-period demand (from real sales data)
- `d_avg` = average per-period demand (from real sales data)
- `sigma_LT` = standard deviation of lead time (assumed 20% of LT_avg until real PO data available)

Reorder Point:
```
ROP = d_avg × LT_avg + Safety Stock
```

Min/Max:
```
Min = ROP
Max = ROP + EOQ (or 2 × d_avg × LT_avg as simplified proxy)
```

---

## 4. Pages and Features

### 4.1 Executive Dashboard — Control Tower (Route: `/`)

**SRD Ref:** §5.5 (Performance Dashboards)
**Purpose:** High-level operational health at a glance. This is the landing page — the first thing a buyer or manager sees.

#### KPI Cards (4-5 across the top)

| KPI | Source | Display |
|-----|--------|---------|
| Fill Rate | Derived: % of SKUs with on-hand >= recommended min | Gauge (radial), showing current % vs. 85%/90%/98% targets |
| Inventory Value | Latest inventory snapshot, sum of all part values | Dollar figure + sparkline trend (55 months) |
| SKUs at Risk | Count of SKUs with CRITICAL or WARNING alerts | Number badge with red accent, clickable → Action Center |
| Open Actions | Count of PENDING worklist items | Number badge, clickable → Action Center |
| Forecast Accuracy | Weighted mean MASE across all forecasted SKUs | Percentage with trend arrow (improving/declining) |

#### Inventory Health by Days-of-Supply

A horizontal stacked bar chart showing the distribution of all active SKUs across supply bands:

| Band | Color | Condition |
|------|-------|-----------|
| Stockout Risk (Red) | `red-500` | Days of supply < 14 |
| Low Stock (Amber) | `amber-500` | Days of supply 14–30 |
| Healthy (Green) | `green-500` | Days of supply 30–90 |
| Excess (Blue) | `blue-500` | Days of supply > 90 |

Each band shows SKU count and dollar value on hover. Clicking a band filters the Inventory Parameters page.

#### Demand Trend Fan Chart

Aggregate monthly demand (all SKUs summed) plotted over the full history window (Oct 2021 – Mar 2026), with:
- Solid line: actual monthly demand (historical)
- Forward projection: P50 line with shaded P10/P90 bands
- Lighter shaded P2.5/P97.5 outer band
- Vertical "now" line separating history from forecast

#### Top 5 Exceptions

A compact list showing the 5 highest-priority worklist items:
- Part number, description, severity badge, recommended action, days to stockout
- Each row clickable → navigates to Action Center with that item highlighted

#### Recent Activity Feed

Chronological list of the latest 8-10 system events:
- Alert generated, parameter changed, worklist item approved/snoozed, forecast updated
- Timestamp + description + relevant part number (clickable → SKU Detail)

---

### 4.2 Buyer Action Center — Prioritized Exception Worklist (Route: `/actions`)

**SRD Ref:** §5.1, §5.2, §5.3, §5.4
**Purpose:** The execution engine. Every item is an action the buyer needs to take. This page merges the v1 "Action Center" and "Alerts" pages into a single unified worklist.

#### Priority-Sorted Exception Queue

A TanStack Table showing all active worklist items, sorted by system-computed priority. Each row displays:

| Column | Description |
|--------|-------------|
| Priority | Rank number + severity badge (CRITICAL/WARNING/WATCH/EXCESS) |
| Part | Part number (clickable → SKU Detail) + truncated description |
| Action | Recommended action type (NEW_PO, EXPEDITE, SET_PARAMETERS, etc.) |
| On-Hand | Current quantity + days of supply |
| Recommended Qty | System-suggested order/action quantity |
| Est. Cost | Recommended qty × unit cost |
| Confidence | Score (0-100%) with color coding |
| Sort Rationale | Transparent explanation of why this item is ranked here (e.g., "7 days to stockout, $12K revenue/month, ABC-A") |
| Actions | Inline buttons |

#### Sort Rationale

The priority algorithm is transparent. Each item shows a brief rationale string explaining its rank, composed from:
- Days to stockout (inverse weight)
- Revenue impact (trailing 90-day contribution)
- ABC classification weight (A=3x, B=2x, C=1x, D=0.5x)
- Number of months below min (for SET_PARAMETERS items)

#### Inline Actions

Each row provides contextual action buttons:

| Action | When Shown | Behavior |
|--------|-----------|----------|
| Approve PO | NEW_PO, EXPEDITE items | Marks approved, updates local state, shows confirmation |
| Snooze | All items | Snoozes for 7 days, removes from active list |
| Override | Items with system recommendations | Opens inline editor to modify qty/parameters |
| Escalate | All items | Marks for management review, changes status |

#### Confidence Score Handling

- Scores >= 70%: Green badge, one-click approval enabled
- Scores < 70%: Amber badge, clicking Approve opens a justification modal requiring the buyer to acknowledge the low confidence and provide a reason code before proceeding

#### Bulk Actions

- Checkbox column for multi-select
- "Approve Selected" button with a spend summary popover (total units, total cost, breakdown by action type)
- "Snooze Selected" button

#### Filters

Filter bar at top with toggleable chips:
- **Severity:** CRITICAL | WARNING | WATCH | EXCESS
- **Action Type:** NEW_PO | EXPEDITE | SET_PARAMETERS | REVIEW_MIN_VIOLATION | REVIEW_EXCESS | CANCEL_DEFER
- **Buyer:** STEVES | MCLOYD | KFLOYD
- **Product Family:** Pedestal Systems | Seating | Components | Raw Materials | Accessories
- **Source:** All | System Generated | Manual

---

### 4.3 SKU Detail — Deep Dive (Route: `/sku/:id`)

**SRD Ref:** §1.1, §1.4, §2.1, §5.3
**Purpose:** Everything about one part on a single page. The page a buyer lands on when they click a part number from any other screen.

#### Header

| Element | Source |
|---------|--------|
| Part Number | Item Master `PartNum` |
| Description | Item Master `Description` |
| Demand Class Badge | Classification result (SMOOTH/ERRATIC/INTERMITTENT/LUMPY/NEW) with color |
| Type Badge | P (Purchased) or M (Manufactured) |
| Class Badge | FG / RM / CM |
| ABC Badge | A / B / C / D / Z with color |
| Product Family | Item Master `Product_Family_c` |
| Brand | Item Master `CommercialBrand` |
| Buyer | Item Master `Buyer_ID` |

Breadcrumbs: Dashboard > SKU Detail > {PartNum}
Back button: returns to previous page (Action Center, Inventory Parameters, etc.)

#### Demand History Chart

- **Source:** Real monthly demand aggregated from Daily Sales
- **Display:** Bar chart or line chart showing monthly demand quantity
- **Range:** Full history available (up to 54 months: Oct 2021 – Mar 2026)
- **Annotations:** Hover shows quantity, revenue, invoice count for each month
- **Seasonal highlight:** Optional toggle to show seasonal decomposition overlay

#### Forecast Chart (Fan Chart)

- **Source:** Pre-computed StatsForecast results
- **Display:** Fan chart with:
  - Solid line: P50 (median forecast)
  - Dark shaded band: P10–P90 (80% prediction interval)
  - Light shaded band: P2.5–P97.5 (95% prediction interval)
- **History overlay:** Actual demand shown as dots/bars to the left of the forecast start
- **Algorithm label:** Shows which algorithm was used (AutoARIMA, CrostonSBA, etc.)
- **Accuracy metrics:** MASE, sMAPE, FVA displayed below chart

#### Inventory Timeline

- **Source:** 55 monthly inventory snapshots, aggregated by PartNum across bins
- **Display:** Area chart or line chart showing on-hand quantity over time (Sep 2021 – Mar 2026)
- **Overlay:** Min and Max lines (from Item Master or recommended) as horizontal reference lines
- **Color coding:** Red zones where on-hand was below recommended min, blue zones where above max

#### Current Inventory Position Card

| Metric | Source |
|--------|--------|
| On-Hand | Latest inventory snapshot |
| Inventory Value | On-hand × Std Cost |
| Days of Supply | On-hand / avg monthly demand × 30 |
| Last Snapshot Date | Date of most recent inventory file |

#### Min/Max/Safety Stock Card

| Field | Current (Item Master) | Recommended (System) |
|-------|----------------------|---------------------|
| Minimum Qty | `MinimumQty` (typically 0) | Computed from ROP formula |
| Maximum Qty | `MaximumQty` (typically 0) | Computed from ROP + EOQ proxy |
| Safety Stock | `SafetyQty` (typically 0) | Computed from safety stock formula |
| Reorder Point | — | Computed ROP |
| Target CSL | — | Default 90%, editable |
| Lead Time (days) | — | Assumed by TypeCode, editable |

Toggle: "Use system recommendation" vs. "Manual override"
Inline editing: all fields are click-to-edit in demo mode (persists to local state)

#### Customer Breakdown

Table showing top customers for this part (from Daily Sales):

| Column | Description |
|--------|-------------|
| Customer ID | `CustID` from sales data |
| Total Revenue | Sum of `Sales $` for this part × customer |
| Total Qty | Sum of `Invoice Qty` |
| % of Part Revenue | This customer's share of total part revenue |
| Last Order | Most recent invoice date |

Sorted by revenue descending. Shows top 10, expandable to full list.

#### Alert History

Chronological list of alerts generated for this SKU:
- Severity badge, trigger condition, recommended action, date
- Shows both active and resolved alerts

---

### 4.4 Inventory Parameters — Bulk Min/Max Management (Route: `/inventory`)

**SRD Ref:** §2.1
**Purpose:** The primary interface for managing planning parameters across all SKUs. This is where Springfield Marine addresses its core problem: min/max/safety stock fields are virtually all zeros today.

#### Coverage Summary Cards (top of page)

| Card | Metric | Source |
|------|--------|--------|
| Total Active SKUs | Count of active parts in Item Master | 5,678 |
| % With Params Set | SKUs where min OR max > 0 | Computed from Item Master |
| % Below Min | SKUs where on-hand < recommended min | Inventory vs. recommendations |
| % Above Max | SKUs where on-hand > recommended max | Inventory vs. recommendations |
| $ At Risk | Sum of (recommended min - on-hand) × unit cost for under-min SKUs | Dollar figure |

#### Violation Filters

Quick-filter buttons across the top:

| Filter | Color | Condition |
|--------|-------|-----------|
| Below Min | Red | On-hand < recommended minimum |
| Above Max | Blue | On-hand > recommended maximum |
| No Parameters | Gray | Current min AND max are zero (NOT_SET) |
| Needs Review | Amber | System has a recommendation that differs significantly from current |
| All | Default | No filter |

#### Parameter Table

TanStack Table with all active SKUs. Columns:

| Column | Description | Editable |
|--------|-------------|----------|
| Part Number | Clickable → SKU Detail | No |
| Description | Truncated part description | No |
| Product Family | Product_Family_c | No |
| ABC | ABC classification badge | No |
| On-Hand | Current inventory level | No |
| Days of Supply | On-hand / avg demand × 30 | No |
| Current Min | From Item Master (typically 0) | Yes (inline) |
| Current Max | From Item Master (typically 0) | Yes (inline) |
| Current Safety | From Item Master (typically 0) | Yes (inline) |
| Recommended Min | System-computed | No |
| Recommended Max | System-computed | No |
| Recommended Safety | System-computed | No |
| Recommended ROP | System-computed | No |
| Status | ParameterStatus badge | No |
| Source | System vs. override indicator | Toggle |

Sortable by any column. Searchable by part number or description.

#### Inline Editing

- Click any editable cell to enter edit mode
- Shows system-recommended value as a ghost/hint
- Toggle per row: "Use system" (locks to computed values) vs. "Manual override" (buyer enters values)
- Changes persist to local demo state

#### URL Query Parameter Support

The page supports URL parameters for drill-downs from other pages:
- `/inventory?filter=below-min` — pre-selects the Below Min filter
- `/inventory?filter=above-max` — pre-selects the Above Max filter
- `/inventory?filter=no-params` — pre-selects No Parameters
- `/inventory?search=1100031` — pre-populates search field
- `/inventory?dos=red` — filters to stockout-risk SKUs (from Dashboard click)

#### CSV Export

"Export CSV" button generates a downloadable CSV of the current filtered view with all columns.

---

### 4.5 Forecast Overview — Portfolio-Level Performance (Route: `/forecast`)

**SRD Ref:** §1.1, §1.4
**Purpose:** How well are the forecasting models performing across the portfolio? Which SKUs need attention?

#### Summary Cards

| Card | Metric |
|------|--------|
| Overall Accuracy | Weighted mean MASE across all forecasted SKUs |
| SKUs Forecasted | Count of SKUs with active forecasts |
| SKUs by Class | Compact breakdown: Smooth / Erratic / Intermittent / Lumpy / New |
| Ensemble Count | Number of SKUs where ensemble was activated |

#### Demand Classification Distribution (Donut Chart)

A donut chart showing the count of SKUs in each demand class:

| Class | Color | Expected Distribution |
|-------|-------|-----------------------|
| SMOOTH | `green-500` | ~400 SKUs (fast-moving, regular demand) |
| ERRATIC | `amber-500` | ~150 SKUs (high-variance, regular occurrence) |
| INTERMITTENT | `blue-500` | ~300 SKUs (infrequent but consistent size) |
| LUMPY | `purple-500` | ~250 SKUs (infrequent and variable size) |
| NEW | `gray-400` | ~100 SKUs (< 12 months history) |

Center of donut shows total count. Hover shows count + % for each slice.

#### Accuracy by Demand Class (Grouped Bar Chart)

Bar chart comparing forecast accuracy (MASE) across demand classes:
- One group per demand class
- Bars: Algorithm MASE vs. Naive baseline MASE
- FVA (Forecast Value Added) annotated as % improvement over naive

#### Algorithm Comparison (Grouped Bars)

Bar chart comparing algorithm performance:
- One group per algorithm (AutoARIMA, AutoETS, CrostonSBA, TSB, Ensemble)
- Bars: Mean MASE, Mean sMAPE
- Sample size (n SKUs) annotated per bar

#### Worst Performers Table

Table of the 20 SKUs with worst forecast accuracy:

| Column | Description |
|--------|-------------|
| Part Number | Clickable → SKU Detail |
| Description | Part description |
| Demand Class | Classification badge |
| Algorithm | Current algorithm |
| MASE | Mean Absolute Scaled Error |
| sMAPE | Symmetric MAPE |
| FVA | vs. naive baseline (negative = worse than naive) |
| Avg Monthly Demand | Scale context |
| Action | "Review" button → SKU Detail |

Sorted by MASE descending (worst first).

#### Seasonal Pattern Visualization

Heatmap or small multiples showing average demand by month (Jan–Dec) for each demand class:
- Reveals the spring ramp-up (March/May peaks) and fall trough (September/December) patterns
- Helps buyers understand when to expect demand shifts

---

### 4.6 Roadmap Pages — Future Capability Stubs

These pages live in a "Potential Roadmap" section of the sidebar navigation. They are not functional — they show what the system could do with additional data and integrations.

Each stub page contains:
- A hero illustration or conceptual wireframe
- A brief description of the capability
- A "Data Requirements" card listing what Springfield Marine would need to provide
- A "SRD Reference" link to the relevant SRD module
- A CTA: "Contact us to discuss implementation"

#### 4.6.1 Fill Rate Tracker (Route: `/roadmap/fill-rate`)

**SRD Ref:** §5.5.1
**Shows:** Fill rate trends over time, current vs. target (85%/90%/98%), breakdown by product line and source node.
**Requires:** Sales order data (not just invoices), backorder log, on-order quantities.

#### 4.6.2 Lead-Time Monitor (Route: `/roadmap/lead-time`)

**SRD Ref:** §2.2
**Shows:** Transpacific supply chain segment analysis (6 segments: factory → drayage → port → ocean → US port → inland), actual vs. modeled, carrier scorecard.
**Requires:** Purchase order history with receipt dates, carrier tracking data, freight APIs.

#### 4.6.3 BOM Explorer (Route: `/roadmap/bom`)

**SRD Ref:** §3.1
**Shows:** Multi-level Bill of Materials tree view (6 levels), phantom assembly indicators, gross/net requirements, cost roll-up.
**Requires:** BOM structure from Epicor Engineering (PartMtl/PartRev tables).

#### 4.6.4 Reshoring and Arbitrage (Route: `/roadmap/reshoring`)

**SRD Ref:** §3.2
**Shows:** China Landed Cost vs. Nixa Domestic Cost comparison, arbitrage scores, 3-year tariff projection, reshoring roadmap by SKU.
**Requires:** Vendor master, dual-source cost breakdown (CLC vs. NDC), Nixa capacity data, tariff rate schedule.

---

## 5. Data Pipeline Specification

### 5.1 Source Files

| File | Records | Key Columns | Notes |
|------|---------|-------------|-------|
| `Data/ITEM MASTER.xls` | 7,480 rows | PartNum, Description, Std Cost, InActive, TypeCode (P/M), Product_Family_c, ClassID (FG/RM/CM), ABC Code, MinimumQty, MaximumQty, SafetyQty, Buyer_ID, HTS, CommercialBrand, CommercialCategory, CommercialSubCategory | Filter to active (InActive=false): 5,678 parts |
| `Data/Daily Sales by cust by part.xlsx` | 221,367 rows | CustID, PartNum, Invoice Qty, Extended_Price, Std_Cost, Cost $, InvoiceNum, InvoiceDate, Sales $ | Oct 2021 – Mar 2026; 2,102 unique parts; 422 customers |
| `Data/YYYY-MM_INVENTORY.xls` (×55) | ~3,000 rows each | PartNum, PartDescription, Bin, Bin\nQty (note: embedded newline in header), Bin\nCost | Sep 2021 – Mar 2026; bin-level granularity |

### 5.2 Data Cleaning Rules

#### Daily Sales
1. Remove non-product rows: filter out PartNum matching FREIGHT, MISC, SAMPLE, CHARGE, CUSTOM, and similar non-inventory items
2. Deduplicate: remove 1,677 exact duplicate rows (same CustID, PartNum, InvoiceNum, InvoiceDate, Qty)
3. Returns: rows with negative Invoice Qty are returns — net against same-period demand for the same SKU, or exclude if netting produces negative total
4. Zero-price rows: 3,507 rows with Sales $=0 but positive qty (samples, warranty) — exclude from demand aggregation
5. Corrections: 248 CORRECTION-flagged rows — apply corrections, then remove correction entries
6. Site filtering: include both SMC and BELCREST site rows (BELCREST is a real facility)

#### Inventory Snapshots
1. Fix 2022-10 file: header is offset by 2 rows — detect and correct
2. Fix 2024-02 file: extra column and padding rows — filter on non-null PartNum
3. Flag 2022-09 and 2023-03: partial exports with ~50% SKUs missing — mark as incomplete, use for available parts only
4. Aggregate bins: sum Bin Qty across all bins for each PartNum within each snapshot to get part-level on-hand
5. Fractional quantities: ~60 per file are legitimate (partial units), keep as-is

#### Item Master
1. Fix descriptions: replace 18 "PLEASE UPDATE DESCRIPTION" entries with PartNum as fallback
2. Zero-cost items: 1,707 items with Std Cost=0 — flag but include (many are raw materials or legacy parts)
3. ABC recalculation: current ABC is stale (59% Z-class). Recalculate dynamically based on trailing 12-month revenue contribution:
   - A: top 80% of cumulative revenue
   - B: next 15%
   - C: next 4%
   - D: next 1%
   - Z: zero revenue in trailing 12 months

### 5.3 Demand Classification

For each SKU with >= 12 months of non-zero monthly demand data:

1. Compute **ADI** = (number of months in observation window) / (number of months with demand > 0)
2. Compute **CV²** = Var(non-zero monthly demand) / Mean(non-zero monthly demand)²
3. Classify per the Syntetos-Boylan grid (Section 3.3)
4. For SKUs with < 12 months history: assign class `NEW`

Expected distribution (from DATA_ANALYSIS.md):
- 406 fast-moving SKUs (>=75% months active) → mostly SMOOTH
- 515 slow-moving SKUs (25-75% months active) → mix of ERRATIC and INTERMITTENT
- 1,181 intermittent SKUs (<25% months active) → mostly LUMPY or INTERMITTENT

### 5.4 Forecasting

Using **Nixtla StatsForecast** library:

| Algorithm | StatsForecast Class | Applied To | Forecast Horizon |
|-----------|-------------------|------------|-----------------|
| AutoARIMA | `AutoARIMA` | SMOOTH class | 12 months |
| AutoETS | `AutoETS` | ERRATIC class | 12 months |
| CrostonSBA | `CrostonSBA` | INTERMITTENT, LUMPY classes | 12 months |
| TSB | `TSB` | NEW class | 6 months |
| Seasonal Naive | `SeasonalNaive` | All (as baseline) | 12 months |

**Conformal Prediction Intervals:**
- Use StatsForecast's built-in conformal prediction
- Generate intervals at 80% level (P10/P90) and 95% level (P2.5/P97.5)
- These are distribution-free intervals calibrated on holdout residuals

**Accuracy Metrics (computed on holdout):**
- MASE (Mean Absolute Scaled Error) — primary metric, scale-independent
- sMAPE (Symmetric Mean Absolute Percentage Error) — secondary
- FVA = (Naive_MASE - Algorithm_MASE) / Naive_MASE — positive means algorithm beats naive

**Ensemble:**
For SKUs where no single algorithm achieves MASE < 1.5 (worse than naive), create a weighted ensemble of the top 2 models with weights proportional to inverse MASE.

### 5.5 Safety Stock and Parameter Computation

For each forecasted SKU:

1. Compute demand statistics: `d_avg` (mean monthly demand), `sigma_d` (std dev of monthly demand)
2. Assign lead time assumptions:
   - TypeCode P (Purchased): `LT_avg` = 60 days, `sigma_LT` = 12 days
   - TypeCode M (Manufactured): `LT_avg` = 10 days, `sigma_LT` = 2 days
3. Default target CSL: 90% (Z = 1.28)
4. Compute safety stock, ROP, min, max per Section 3.4 formulas
5. Compare current Item Master values (MinimumQty, MaximumQty, SafetyQty) against recommendations
6. Assign ParameterStatus:
   - `NOT_SET`: current min AND max are 0
   - `SYSTEM_CALCULATED`: no current values, system has recommendation
   - `BUYER_OVERRIDE`: current values differ from system (implies buyer has set them)
   - `NEEDS_REVIEW`: current values exist but differ >25% from system recommendation

### 5.6 Alert Generation

Alerts are generated from real data conditions:

| Severity | Trigger | Source |
|----------|---------|--------|
| CRITICAL | On-hand < safety stock AND days-of-supply < lead time | Inventory + demand + lead time |
| WARNING | On-hand < recommended min AND days-of-supply < 1.5× lead time | Inventory + parameters |
| WATCH | On-hand approaching recommended min (within 20%) OR safety stock projected to be breached in forecast horizon | Inventory + forecast |
| EXCESS | On-hand > recommended max OR days-of-supply > 180 | Inventory + parameters |

### 5.7 Worklist Generation

Worklist items are generated from:

1. **CRITICAL/WARNING alerts** → action type: NEW_PO (if purchased) or EXPEDITE_PO
2. **EXCESS alerts** → action type: REVIEW_EXCESS or CANCEL_DEFER
3. **NOT_SET parameter status** for high-revenue SKUs → action type: SET_PARAMETERS
4. **Below-min violations** → action type: REVIEW_MIN_VIOLATION
5. **Forecast signals**: SKUs where forecast shows demand will exceed available inventory within lead time

Priority ranking factors (weighted):
- Days to stockout: 40% weight (inverse — fewer days = higher priority)
- Revenue impact: 30% weight (trailing 90-day revenue for this SKU)
- ABC class: 20% weight (A=3, B=2, C=1, D=0.5, Z=0.25)
- Months below min: 10% weight (longer = higher priority)

Confidence score (0-100%) based on:
- Forecast accuracy for this SKU (MASE-based)
- Data history depth (more months = higher confidence)
- Demand stability (lower CV = higher confidence)
- Recency of last sale (stale demand = lower confidence)

### 5.8 Export Format

All pipeline outputs are exported as TypeScript constant files in `frontend/src/data/`:

```typescript
// Example: frontend/src/data/itemMaster.ts
export const ITEMS: SKU[] = [
  { partNum: "1100031-1", description: "TRAC-LOCK SWIVEL LOCKING", ... },
  ...
];

// Example: frontend/src/data/forecasts.ts
export const FORECASTS: Forecast[] = [
  { partNum: "1100031-1", period: "2026-04", algorithm: "AutoARIMA", p50: 142, p10: 98, p90: 186, ... },
  ...
];
```

Files are plain TypeScript with typed arrays. No JSON imports, no dynamic loading. Tree-shaking friendly.

---

## 6. Routes

| Route | Page | Nav Section | Description |
|-------|------|-------------|-------------|
| `/` | Executive Dashboard | Core | Control tower — KPIs, health, trends, top exceptions |
| `/actions` | Buyer Action Center | Core | Prioritized exception worklist with inline actions |
| `/sku/:id` | SKU Detail | (no nav link — accessed via click) | Deep dive on any part |
| `/inventory` | Inventory Parameters | Core | Bulk min/max/safety stock management |
| `/forecast` | Forecast Overview | Core | Portfolio-level forecast accuracy and model performance |
| `/roadmap/fill-rate` | Fill Rate Tracker | Potential Roadmap | Stub — fill rate trends and targets |
| `/roadmap/lead-time` | Lead-Time Monitor | Potential Roadmap | Stub — supply chain segment analysis |
| `/roadmap/bom` | BOM Explorer | Potential Roadmap | Stub — bill of materials tree view |
| `/roadmap/reshoring` | Reshoring and Arbitrage | Potential Roadmap | Stub — tariff analysis, reshoring recommendations |

SKU Detail (`/sku/:id`) is not shown in the sidebar — it is accessed by clicking any part number anywhere in the app. All part number displays throughout the app are clickable links to `/sku/{partNum}`.

---

## 7. Design System

### 7.1 Component Library: shadcn/ui

All UI components are sourced from shadcn/ui, installed into `frontend/src/components/ui/`. Core components used:

| Component | Usage |
|-----------|-------|
| **Sidebar** | Main navigation, `collapsible="icon"` mode for compact view |
| **Command** | Cmd+K command palette for quick navigation and search |
| **Card** | KPI cards, summary cards, detail cards |
| **Table** | Data tables throughout (backed by TanStack Table for sorting/filtering) |
| **Badge** | Severity levels, demand classes, ABC codes, status indicators |
| **Button** | Actions (Approve, Snooze, Override, Escalate, Export) |
| **Tooltip** | Info tooltips on technical terms, hover details on charts |
| **Dialog** | Confirmation modals, justification modals, bulk action summaries |
| **Input** | Inline editing fields, search bars |
| **Select** | Filter dropdowns, parameter selection |
| **Tabs** | Section switching within pages |
| **Sheet** | Mobile sidebar drawer |
| **Popover** | Contextual info panels |
| **Separator** | Section dividers |
| **Skeleton** | Loading states |

### 7.2 Branding: Springfield Marine

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#025482` | Sidebar background, primary buttons, headings |
| Gold | `#ffc10a` | Accent highlights, active indicators, selected states |
| Red | `#ea2829` | Logo red, CRITICAL severity, destructive actions |
| White | `#ffffff` | Content background, sidebar text |
| Slate-50 | `#f8fafc` | Page background |
| Slate-900 | `#0f172a` | Primary text |

Logo: Springfield Marine logo in sidebar header, collapsing to icon mark in compact mode.

### 7.3 Alert Severity Colors

| Severity | Background | Border | Text | Badge |
|----------|-----------|--------|------|-------|
| CRITICAL | `bg-red-50` | `border-red-500` | `text-red-800` | `bg-red-500 text-white` |
| WARNING | `bg-amber-50` | `border-amber-500` | `text-amber-800` | `bg-amber-500 text-white` |
| WATCH | `bg-yellow-50` | `border-yellow-500` | `text-yellow-800` | `bg-yellow-500 text-white` |
| EXCESS | `bg-blue-50` | `border-blue-500` | `text-blue-800` | `bg-blue-500 text-white` |

### 7.4 Demand Class Colors

| Class | Color | Badge |
|-------|-------|-------|
| SMOOTH | Green | `bg-green-100 text-green-800` |
| ERRATIC | Amber | `bg-amber-100 text-amber-800` |
| INTERMITTENT | Blue | `bg-blue-100 text-blue-800` |
| LUMPY | Purple | `bg-purple-100 text-purple-800` |
| NEW | Gray | `bg-gray-100 text-gray-800` |

### 7.5 Typography

| Context | Font | Style |
|---------|------|-------|
| UI text (labels, buttons, body) | Inter | Variable weight, system stack fallback |
| Data (numbers, part numbers, costs) | JetBrains Mono | Monospaced, `tabular-nums` for column alignment |
| Page titles | Inter | `text-2xl font-semibold` |
| Section titles | Inter | `text-xl font-semibold` |
| Card titles | Inter | `text-lg font-medium` |
| Badge/pill text | Inter | `text-xs font-medium uppercase tracking-wide` |
| Table data | JetBrains Mono | `text-sm` |

### 7.6 Layout

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────────────────────────────────────────────┐ │
│ │      │ │  Top Bar: Breadcrumbs │ Search │ Cmd+K hint  │ │
│ │ Side │ ├──────────────────────────────────────────────┤ │
│ │ bar  │ │                                              │ │
│ │      │ │           Content Area                       │ │
│ │ Nav  │ │           max-w-[1440px]                     │ │
│ │ items│ │           mx-auto                            │ │
│ │      │ │           px-6 py-6                           │ │
│ │      │ │                                              │ │
│ └──────┘ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- **Sidebar:** Collapsible. Desktop: full width (240px) with labels. Tablet: icon-only (48px). Mobile: hidden, opens as Sheet drawer.
- **Top Bar:** Fixed height. Contains breadcrumbs (left), global search input (center), Cmd+K keyboard shortcut hint (right).
- **Content Area:** Max width 1440px, centered. Consistent padding `px-6 py-6`. Responsive grid within.
- **Cmd+K Palette:** Opens as a centered Dialog with Command component. Searches across: pages, parts (by number or description), actions, filters.

### 7.7 Fatigue-Resistant Design Principles

These are non-negotiable UX rules for every page:

| Principle | Rule |
|-----------|------|
| **KPI Limit** | No more than 7 KPI cards on any single screen |
| **Progressive Disclosure** | Complex details hidden behind expand/collapse, tooltips, or drill-down navigation — never shown upfront |
| **Info Tooltips** | Every technical term (MASE, ADI, CV², ROP, CSL, Safety Stock, FVA, etc.) has an (i) icon that shows a plain-English explanation on hover |
| **Generous Spacing** | Minimum `gap-4` between cards, `gap-6` between page sections. No cramped layouts |
| **Visual Over Text** | Use gauges, sparklines, progress bars, color-coded indicators, and traffic-light badges instead of raw numbers wherever possible |
| **Muted Defaults** | Use `text-muted-foreground` for secondary information. Only primary data gets full contrast |
| **Consistent Actions** | Every clickable part number navigates to SKU Detail. Every severity badge uses the same color scheme. Every action button has the same interaction pattern |
| **Responsive** | Three breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px). Content reflows, tables become cards on mobile |

---

## 8. Demo Data Requirements

### 8.1 Scope

| Data Set | Target Volume | Source |
|----------|---------------|--------|
| Item Master (active parts) | 5,678 SKUs | Real — parsed from ITEM MASTER.xls (InActive=false) |
| Monthly demand | 2,102 unique parts × up to 54 months | Real — aggregated from Daily Sales |
| Inventory timeline | ~2,700 parts × 55 snapshots | Real — aggregated from monthly .xls files |
| Customer data | 422 customers | Real — extracted from Daily Sales |
| Demand classifications | ~1,200 SKUs (those with >=12 months history) | Computed — Syntetos-Boylan from real demand |
| Forecasts | ~1,000 SKUs (classified + sufficient data) | Computed — StatsForecast on real demand |
| Safety stock recommendations | ~1,000 SKUs | Computed — from forecasts + assumed lead times |
| Inventory parameters | 5,678 SKUs | Computed — current (from Item Master) vs. recommended |
| Alerts | ~50-100 (from real violations) | Computed — from inventory vs. parameters |
| Worklist items | ~20-40 prioritized actions | Computed — from alerts + forecast signals |

### 8.2 Key Real-Data Facts to Surface

These numbers come from the actual data and should appear throughout the app:

| Fact | Value | Where It Appears |
|------|-------|-----------------|
| Total active parts | 5,678 | Dashboard, Inventory Parameters |
| Parts with demand signal | 2,102 | Forecast Overview |
| Parts covering 96% of revenue | 968 (those with 12+ months history) | Forecast Overview |
| Top 59 parts = 50% of revenue | 59 parts | Dashboard, Action Center prioritization |
| Annual revenue | ~$31.5M | Dashboard KPI |
| Inventory value | ~$6.5M (current), peak $9M (2022) | Dashboard KPI + trend |
| Median gross margin | 45.1% | Reference for cost calculations |
| Top customer (TRA100/Tracker) | 19.6% of revenue | Customer breakdown in SKU Detail |
| Seasonal peaks | March and May (pre-season OEM build) | Demand charts, seasonal visualization |
| Seasonal troughs | September and December | Demand charts |
| Purchased:Manufactured split | 60:40 | Reference stat |
| Section 301 tariff-exposed parts | 1,198 (with HTS 9903.88.15) | Reshoring roadmap stub |
| Buyers | STEVES (82%), MCLOYD (10%), KFLOYD (8%) | Action Center filter |
| Min/Max fields = zero | ~95%+ of all parts | The core problem — Inventory Parameters page |

### 8.3 What Is Real vs. Assumed

| Data Element | Source | Notes |
|-------------|--------|-------|
| Part numbers, descriptions, costs, taxonomy | **REAL** — Item Master | Actual Springfield Marine data |
| Monthly demand quantities and revenue | **REAL** — Daily Sales aggregated | Actual historical transactions |
| Inventory positions over time | **REAL** — Monthly snapshots | Actual on-hand quantities |
| Customer IDs and revenue | **REAL** — Daily Sales | Actual customer transactions |
| ABC classification | **RE-COMPUTED** — from real revenue data | Original ABC is stale (59% Z-class) |
| Demand classification (Syntetos-Boylan) | **COMPUTED** — from real demand patterns | Using standard statistical method on real data |
| Forecasts | **COMPUTED** — StatsForecast on real demand | Real algorithms on real data, genuine prediction intervals |
| Lead times | **ASSUMED** — Purchased=60d, Manufactured=10d | No PO history available; these are reasonable defaults |
| Safety stock / ROP / min / max | **COMPUTED** — from real demand + assumed lead times | Formula-based, real demand variance, assumed lead time variance |
| Alerts | **COMPUTED** — from real inventory vs. computed parameters | Generated from real conditions |
| Worklist priority | **COMPUTED** — from real revenue + real inventory + computed alerts | Algorithm uses real data inputs |

---

## 9. Placeholder Markers

Use these comment markers in code to tag where backend integration will connect later:

| Marker | Meaning |
|--------|---------|
| `// MOCK:` | Static data being used — replace with API call when backend exists |
| `// API_PLACEHOLDER:` | Where a real API call will go |
| `// EPICOR_PLACEHOLDER:` | Epicor 10 integration point |
| `// WEBSOCKET_PLACEHOLDER:` | Real-time update integration point (e.g., live inventory, live alerts) |

Do NOT use `// AUTH_PLACEHOLDER:` — authentication is not part of v2 scope.

---

## 10. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_TITLE` | `Springfield Marine — Demand Planning` | App title shown in browser tab and top bar |

No other environment variables are needed. All data is baked into the build as TypeScript constants. There is no API server, no database connection, no auth provider.

---

## 11. Out of Scope

The following features from the SRD are explicitly NOT included in v2. They are referenced only as roadmap stubs (Section 4.6) or omitted entirely:

| Feature | SRD Module | Reason for Exclusion |
|---------|-----------|---------------------|
| Epicor 10 live integration | Module 4 | No Epicor environment available |
| Real-time CDC (Change Data Capture) | §4.1.2 | Requires live Epicor connection |
| Monte Carlo ROP simulation | §2.3 | Requires PO history for lead-time distributions |
| BOM explosion / dependent demand | §3.1 | No BOM data available |
| Reshoring arbitrage scoring | §3.2 | No vendor/source-node/dual-cost data |
| Exogenous regressors (FRED, NMMA, SCFI) | §1.2 | Would add complexity without ability to validate |
| Pandemic anomaly correction (full) | §1.3 | Data starts Oct 2021, missing pre-2020 baseline |
| MDM entity resolution | §4.2 | No multi-namespace data to reconcile |
| PO write-back to Epicor | §5.4.1 | No Epicor environment |
| Approval authority limits | §5.4.4 | No auth system |
| Buyer override feedback loop | §5.6 | Requires persistent backend |
| Defense/contract demand class | §1.1 | Insufficient contract data to differentiate |
| Fill rate computation (true) | §5.5 | Requires order-level data (we only have invoices) |
| Predictive delay detection | §5.3.3 | Requires carrier tracking data |

These exclusions are not limitations of the architecture — they are data availability constraints. When the data becomes available, the architecture supports adding every one of these features.
