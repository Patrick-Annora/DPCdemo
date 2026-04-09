# 01_TASK_LIST_V2.md — V2 Rebuild Task List

> **Purpose:** Maximally parallelized execution plan for rebuilding Springfield Marine demand planning as V2.
> Designed for orchestrated multi-agent execution with the smallest reasonable task granularity.

---

## V2 Philosophy

V1 was a frontend-only demo with hand-written mock data. V2 is a **real-data rebuild**:

1. **Generation 0** — Python scripts parse the actual `.xls` files in `Data/` and produce JSON intermediates, then export TypeScript data constants.
2. **Generation 1** — Spec files define every frontend component, page, and system.
3. **Generation 2** — Code implementation against specs, with shadcn/ui design system replacing raw Tailwind.

The key insight: **V2 data is real**. The 2,102 SKUs with sales data, 55 inventory snapshots, and the Item Master all flow through the pipeline into the frontend. Forecasts, classifications, safety stock, alerts, and worklist items are *computed*, not invented.

### V2 vs V1 Differences

| Aspect | V1 | V2 |
|--------|----|----|
| Data | 50 hand-written mock SKUs | 2,102 real SKUs from `.xls` files |
| Design system | Raw Tailwind + custom components | shadcn/ui + Tailwind 4 |
| Pages | 12 pages (all 5 SRD modules) | 5 core pages (focused scope) |
| Pipeline | None | Python scripts produce TypeScript constants |
| Forecasts | Invented numbers | StatsForecast with conformal intervals |
| Sidebar | Custom sidebar | shadcn sidebar with `collapsible="icon"` |
| Command palette | Global search input | Cmd+K command palette (shadcn `command`) |
| BOM/Reshoring/Pipeline | Full pages | Roadmap stubs ("Coming Soon") |

### 5 Core Pages

1. **Executive Dashboard** — KPI cards, DOS distribution, demand fan chart, top exceptions
2. **Buyer Action Center** — Combined alerts + worklist, priority queue, inline actions
3. **SKU Detail** — Demand history, forecast fan chart, inventory timeline, parameters
4. **Inventory Parameters** — Coverage cards, violation filters, parameter table, inline editing
5. **Forecast Overview** — Classification donut, accuracy bars, algorithm comparison

---

## Execution Protocol

### Orchestrator Prompt

```
Execute the V2 rebuild of springfield-demand.

INSTRUCTIONS:
1. Read: CLAUDE.md, 00_KERNEL.md, 01_TASK_LIST_V2.md, DATA_ANALYSIS.md
2. Execute Generation 0 (Data Pipeline) — launch parallel tiers as marked.
3. Execute Generation 1 (Spec Generation) — launch parallel tiers as marked.
4. Execute Generation 2 (Code Implementation) — launch parallel tiers as marked.
5. Run the post-build quality gate.

PARALLELIZATION RULES:
- Within each generation, tasks are organized into TIERS.
- All tasks within a tier can run IN PARALLEL (spawn simultaneous sub-agents).
- A tier cannot start until ALL tasks in the previous tier have completed.
- Each sub-agent is a FRESH instance — zero carryover from previous agents.

CRITICAL:
- Never reuse a sub-agent session. Always spawn fresh.
- Each sub-agent handles exactly ONE task.
- Update status: [ ] → [~] (running) → [x] (done) → [!] (blocked).
- If a sub-agent fails, retry once. If it fails again, mark [!] and continue.
```

---

## Sub-Agent Prompt Templates

### Data Pipeline Sub-Agent (Generation 0)

```
You are the Data Engineer Agent for springfield-demand V2.
You are a FRESH instance with NO context from any previous sub-agent.

CONTEXT FILES TO READ FIRST:
1. CLAUDE.md — project commands and quality rules
2. 00_KERNEL.md — domain model, entities, enums
3. DATA_ANALYSIS.md — data quality findings, column names, known issues
4. {dependency_outputs} — JSON files from prior pipeline tasks (if any)

YOUR TASK:
{task_description}

ENVIRONMENT:
- Python 3.12 managed with uv (cd backend && uv run python ...)
- Input data lives in Data/ (raw .xls files — NEVER modify these)
- Output goes to data/parsed/ as JSON files
- Use pandas + openpyxl/xlrd for .xls parsing
- Use statsforecast for forecasting (Task 0.5 only)
- All output JSON must be valid and UTF-8 encoded

DATA QUALITY RULES (from DATA_ANALYSIS.md):
- Daily Sales: remove ~4,820 non-product rows, 1,677 dupes, handle 276 returns
- Inventory: fix 2022-10 header offset, 2024-02 extra column, flag partial exports
- Item Master: fix 18 placeholder descriptions, handle 1,707 zero-cost items

OUTPUT: {output_path}
VALIDATION: After writing output, print record count and sample records.
```

### Spec Generation Sub-Agent (Generation 1)

```
You are the Architect Agent for springfield-demand V2.
You are a FRESH instance with NO context from any previous sub-agent.

CONTEXT FILES TO READ FIRST:
1. 00_KERNEL.md — domain model, page map, design system, data requirements
2. SRD_AI_Demand_Planning_System.md — system requirements (trace features to REQ-x.x.x)
3. DATA_ANALYSIS.md — real data characteristics (2,102 SKUs, seasonal patterns, etc.)
4. Dependency specs: {dependency_list}

YOUR TASK:
Generate the spec file: specs/v2/{NN}_{name}.md

V2 SPEC REQUIREMENTS:
- This is a REAL-DATA frontend build — data comes from TypeScript constants generated
  by the Python pipeline (Generation 0), NOT hand-written mock data
- Design system is shadcn/ui — use shadcn components (Card, Table, Badge, Button,
  Dialog, Command, Sidebar, Tooltip) as the foundation, not raw Tailwind
- 5 core pages only: Dashboard, Action Center, SKU Detail, Inventory Parameters,
  Forecast Overview. All other SRD modules are roadmap stubs.
- Include component hierarchy, props, state, interactions, and acceptance criteria
- Reference specific shadcn components by name (e.g., "Use <Card> with <CardHeader>")
- Be specific enough that a Builder Agent can implement from this spec alone

DEPENDENCY SPECS TO READ: {list}
SPECIFIC INSTRUCTIONS: {task_details}

OUTPUT: Write the complete spec to specs/v2/{NN}_{name}.md
```

### Code Implementation Sub-Agent (Generation 2)

```
You are the Builder Agent for springfield-demand V2.
You are a FRESH instance with NO context from any previous sub-agent.

CONTEXT FILES TO READ FIRST:
1. CLAUDE.md — commands, quality rules, tooling
2. specs/v2/{NN}_{name}.md — the spec to implement
3. 00_KERNEL.md — domain model, design system
4. Existing source files in frontend/src/ that are relevant

YOUR TASK:
Implement all code described in specs/v2/{NN}_{name}.md

V2 IMPLEMENTATION RULES:
- TypeScript strict mode, React 19, Tailwind CSS 4, shadcn/ui
- Data imports from frontend/src/data/*.ts (generated by pipeline)
- shadcn components are in frontend/src/components/ui/ — use them
- Mark data imports with // DATA: comment for traceability
- All buttons, filters, sorts, and actions must work via React state
- After writing code, run: cd frontend && npm run lint && npm run type-check && npm run build
- Fix any issues found before completing

SPEC: specs/v2/{NN}_{name}.md
OUTPUT: Write/modify source files as described in the spec.
```

---

## Generation 0: Data Pipeline (Python)

> **Goal:** Parse real `.xls` files → compute derived data → export as TypeScript constants.
> **Runtime:** Python 3.12 via `uv`. Scripts live in `backend/scripts/`.
> **Input:** `Data/*.xls` (55 inventory snapshots + Item Master + Daily Sales)
> **Final Output:** `frontend/src/data/*.ts` (TypeScript constants for the frontend)

### Tier 0-A: Raw Parsing (ALL PARALLEL)

These three tasks have ZERO dependencies and can run simultaneously.

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.1 | `[ ]` | Parse Item Master | `Data/ITEM MASTER.xls` | `data/parsed/item-master.json` | Extract all active parts. Fields: partNumber, description, classID (FG/CM/RM), typeCode (P/M), productFamily, commercialBrand, commercialCategory, stdCost, uom, buyerID, htsCode, abcCode, isActive. Filter to active parts only. Clean 18 "PLEASE UPDATE DESCRIPTION" rows. Handle 1,707 zero-cost items (keep but flag). Output: array of part objects. |
| 0.2 | `[ ]` | Parse Daily Sales | `Data/Daily Sales by cust by part.xlsx` | `data/parsed/monthly-demand.json` | Parse 221K invoice lines. Clean: remove ~4,820 non-product rows (FREIGHT, MISC, SAMPLE, etc.), deduplicate 1,677 exact dupes, net 276 negative-qty returns against same-period sales, exclude 3,507 zero-price/positive-qty rows. Aggregate to monthly granularity per SKU: { skuId, period (YYYY-MM), quantity, revenue, customerCount, orderCount }. Also produce per-customer monthly breakdown. Output: { monthlySummary: [...], customerDetail: [...] }. |
| 0.3 | `[ ]` | Parse Inventory Snapshots | `Data/YYYY-MM_INVENTORY.xls` (55 files) | `data/parsed/inventory-timeline.json` | Parse all 55 monthly inventory files. Fix known issues: 2022-10 header offset (2 extra rows), 2024-02 extra column + padding rows. Flag 2022-09 and 2023-03 as partial exports. Aggregate bin-level rows to part-level: { skuId, period (YYYY-MM), onHand, totalCost, binCount }. Handle fractional quantities (round to 2 decimal places). Output: array of monthly inventory positions per SKU. |

**Parallelization:** 0.1, 0.2, 0.3 run simultaneously. Zero dependencies.

### Tier 0-B: Classification (Depends on 0.2)

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.4 | `[ ]` | Demand Classification | `data/parsed/monthly-demand.json` | `data/parsed/classifications.json` | For each SKU with 6+ months of data, compute: (1) ADI = average demand interval (months between non-zero demand), (2) CV² = squared coefficient of variation of non-zero demand sizes. Classify per Syntetos-Boylan framework: ADI < 1.32 AND CV² < 0.49 → SMOOTH; ADI < 1.32 AND CV² >= 0.49 → ERRATIC; ADI >= 1.32 AND CV² < 0.49 → INTERMITTENT; ADI >= 1.32 AND CV² >= 0.49 → LUMPY. SKUs with < 6 months → NEW_COLD_START. Assign primary algorithm per class: SMOOTH → SARIMA, ERRATIC → XGBOOST, INTERMITTENT → CROSTONS, LUMPY → CROSTONS, NEW_COLD_START → NAIVE_SEASONAL. Output per SKU: { skuId, demandClass, adi, cv2, avgMonthlyDemand, monthsActive, algorithmPrimary, algorithmFallback }. |

### Tier 0-C: Forecasting (Depends on 0.2, 0.4)

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.5 | `[ ]` | Run Forecasts | `data/parsed/monthly-demand.json`, `data/parsed/classifications.json` | `data/parsed/forecasts.json` | For each SKU with 12+ months of history (968 SKUs per DATA_ANALYSIS.md), run StatsForecast with the algorithm assigned by classification. Produce 12-month forward forecast with conformal prediction intervals: P50 (median), P10/P90 (80% interval), P2.5/P97.5 (95% interval). Compute MAPE on last 6 months holdout. For SKUs with < 12 months, use NAIVE_SEASONAL with wider intervals. Output per SKU per period: { skuId, period, algorithm, p50, p10, p90, p2_5, p97_5, mape }. Also compute FVA (Forecast Value Added) vs. naive seasonal baseline for each algorithm class. |

### Tier 0-D: Safety Stock (Depends on 0.4, 0.5)

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.6 | `[ ]` | Compute Safety Stock + Min/Max | `data/parsed/classifications.json`, `data/parsed/forecasts.json` | `data/parsed/safety-stock.json` | For each classified SKU, compute: (1) Safety stock = z_α × σ_demand × √(lead_time_months). Use z_α = 1.65 for 95% CSL. Assume lead time by source: SCHECO 2 months, Nixa 0.5 months, Shark NZ 1.5 months. Assign source based on typeCode (P → SCHECO for HTS 9903.88.15, else Nixa; M → Nixa). (2) Reorder point = forecast_P50 × lead_time + safety_stock. (3) Min = reorder_point. (4) Max = 2 × avg_monthly_demand × lead_time + safety_stock. Assign parameterStatus: 40% NOT_SET, 30% SYSTEM_CALCULATED, 20% BUYER_OVERRIDE, 10% NEEDS_REVIEW (per Kernel §5.4). Output: { skuId, safetyStockQty, reorderPoint, minQty, maxQty, targetCsl, leadTimeDays, parameterStatus, source }. |

### Tier 0-E: Alerts + Worklist (Depends on 0.1, 0.3, 0.5, 0.6)

These two tasks can run in PARALLEL once their dependencies are met.

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.7 | `[ ]` | Generate Alerts | `data/parsed/item-master.json`, `data/parsed/inventory-timeline.json`, `data/parsed/safety-stock.json`, `data/parsed/forecasts.json` | `data/parsed/alerts.json` | Using the most recent inventory snapshot (Mar 2026) and computed safety stock: (1) CRITICAL alerts: on-hand < safety stock AND projected stock-out within lead time (use forecast P50 to project depletion). (2) WARNING alerts: on-hand < min AND stock-out within 2× lead time. (3) WATCH alerts: on-hand < reorder point but above min. (4) EXCESS alerts: on-hand > max. Generate realistic alert objects: { alertId, skuId, alertLevel, triggerCondition, recommendedAction, daysToStockout, currentOnHand, safetyStock, minQty, maxQty, createdAt }. Target: 8-12 active alerts across severity levels (select the most impactful violations). |
| 0.8 | `[ ]` | Generate Worklist | `data/parsed/alerts.json`, `data/parsed/forecasts.json`, `data/parsed/safety-stock.json`, `data/parsed/item-master.json`, `data/parsed/monthly-demand.json` | `data/parsed/worklist.json` | Generate prioritized buyer action items from alerts + forecast signals: (1) NEW_PO for critical/warning stock-out alerts. (2) EXPEDITE_PO for items within lead time of stock-out. (3) SET_PARAMETERS for SKUs with NOT_SET status. (4) REVIEW_MIN_VIOLATION for SKUs below min. (5) REVIEW_EXCESS for excess alerts. (6) CANCEL_DEFER for items significantly above max. Priority scoring: days-to-stockout (40%), revenue impact from demand data (30%), customer concentration (20%), alert severity (10%). Output: { itemId, skuId, priorityRank, actionType, recommendedQty, recommendedSource, estimatedCost, status (all PENDING), confidenceScore (55-98%), daysToStockout, revenueImpact }. Target: 15-25 active worklist items. |

**Parallelization:** 0.7 and 0.8 can run in parallel IF 0.8 reads alerts from file rather than depending on 0.7's output. However, 0.8 uses alerts as input, so they run sequentially: 0.7 → 0.8.

### Tier 0-F: TypeScript Export (Depends on ALL above)

| # | Status | Task | Input | Output | Description |
|---|--------|------|-------|--------|-------------|
| 0.9 | `[ ]` | Export to TypeScript | All `data/parsed/*.json` files | `frontend/src/data/*.ts` | Read every JSON file from data/parsed/ and generate typed TypeScript constant files. Each file exports a named constant array with full type annotations. Generate: `skus.ts`, `monthly-demand.ts`, `inventory-timeline.ts`, `classifications.ts`, `forecasts.ts`, `safety-stock.ts`, `alerts.ts`, `worklist.ts`, `index.ts` (barrel export). Also generate `dashboard-kpis.ts` with aggregated metrics computed from the data: total active SKUs, % with parameters, fill rate estimate, total inventory value, revenue run rate, DOS distribution, top exceptions. TypeScript arrays must be `as const` for type inference. |

### Generation 0 Dependency Graph

```
Tier 0-A:  [0.1]  [0.2]  [0.3]     ← ALL PARALLEL
              │      │      │
              │      ▼      │
Tier 0-B:     │    [0.4]    │        ← needs 0.2
              │      │      │
              │      ▼      │
Tier 0-C:     │    [0.5]    │        ← needs 0.2, 0.4
              │      │      │
              │      ▼      │
Tier 0-D:     │    [0.6]    │        ← needs 0.4, 0.5
              │      │      │
              ▼      ▼      ▼
Tier 0-E:   [0.7]─────────────       ← needs 0.1, 0.3, 0.5, 0.6
                    │
                    ▼
             [0.8]                    ← needs 0.7
                    │
                    ▼
Tier 0-F:   [0.9]                    ← needs ALL
```

**Max parallelism in Gen 0:** 3 agents (Tier 0-A). Remaining tiers are sequential chains.

---

## Generation 1: Spec Generation

> **Goal:** Write specs for every V2 frontend component, page, and system.
> **Output:** `specs/v2/*.md` — one file per spec task.

### Tier 1-A: Foundation (Sequential — these define the base everything else builds on)

| # | Status | Spec File | Depends On | Description |
|---|--------|-----------|------------|-------------|
| 1.1 | `[ ]` | `specs/v2/01_project_setup.md` | Kernel | Fresh Vite + React 19 + TypeScript 5.9 strict + Tailwind CSS 4 scaffold. **shadcn/ui init** with New York style. Install components: `sidebar`, `command`, `card`, `table`, `badge`, `button`, `tooltip`, `dialog`, `input`, `select`, `dropdown-menu`, `sheet`, `separator`, `scroll-area`, `tabs`, `checkbox`, `popover`, `calendar`, `toast`, `sonner`. Springfield Marine brand theme: navy primary (#025482), gold accent (#ffc10a), white/slate backgrounds. Font: Inter. Directory structure. ESLint + Vitest config. |
| 1.2 | `[ ]` | `specs/v2/02_design_system.md` | 1.1 | **shadcn Sidebar** with `collapsible="icon"`, Springfield Marine wordmark/logo in collapsed and expanded states. Nav groups: "Core" (Dashboard, Action Center, Inventory Parameters, Forecast Overview) + "Roadmap" (Fill Rate, Lead Time, BOM, Reshoring — grayed with lock icon). **TopBar** with Cmd+K trigger button, breadcrumbs with back button, notification bell (alert count). **AppShell** component composing Sidebar + TopBar + content area. Theme tokens for alert severity colors, source node colors, demand class colors. Dark mode preparation (CSS variables). |
| 1.3 | `[ ]` | `specs/v2/03_types.md` | 1.1 | TypeScript interfaces for all Kernel §3 entities. V2 additions: `MonthlyDemand` (period, qty, revenue, customerCount), `InventorySnapshot` (period, onHand, totalCost), `CustomerDemand` (customerId, skuId, period, qty, revenue), `DashboardKpis` (totalSkus, parametersSetPct, fillRate, inventoryValue, revenueRunRate). Enums as const objects (not TS enums) for better tree-shaking. Export everything from `src/lib/types.ts`. |

**Parallelization:** 1.1 → 1.2 → 1.3 are sequential (each depends on the prior).

### Tier 1-B: Core Systems (PARALLEL after 1.3)

| # | Status | Spec File | Depends On | Description |
|---|--------|-----------|------------|-------------|
| 1.4 | `[ ]` | `specs/v2/04_data_layer.md` | 1.3, Gen 0 | Data layer that imports TypeScript constants from `src/data/*.ts` (generated by Gen 0 Task 0.9). Build lookup maps: `skuById`, `demandBySku`, `inventoryBySku`, `forecastBySku`, `classificationBySku`, `safetyStockBySku`. Filter helpers: `getSkusByClass()`, `getSkusByStatus()`, `getActiveAlerts()`, `getWorklist()`. Computed aggregates: DOS computation, revenue rankings, coverage statistics. All exported from `src/lib/data-helpers.ts`. |
| 1.5 | `[ ]` | `specs/v2/05_command_palette.md` | 1.2 | **Cmd+K command palette** using shadcn `<Command>` component. Search across: all 2,102 SKUs (part number + description), 5 pages (by name), common actions (e.g., "View critical alerts", "Export parameters"). Debounced client-side filtering (300ms). Category groups: "SKUs", "Pages", "Actions". Keyboard navigation (arrow keys, Enter to select). Selection navigates to the appropriate page (SKU → `/sku/:id`, Page → route, Action → route + filter). Show recent searches. Limit results to 10 per category. |
| 1.6 | `[ ]` | `specs/v2/06_common_components.md` | 1.2, 1.3 | Shared UI primitives built ON TOP OF shadcn components. **KpiCard** — shadcn `<Card>` with icon, value, label, trend arrow, and optional sparkline. **StatusBadge** — shadcn `<Badge>` with ParameterStatus color mapping. **DemandClassBadge** — colored badge for SMOOTH/ERRATIC/INTERMITTENT/LUMPY/NEW. **SourceBadge** — SCHECO (indigo), Nixa (emerald), Shark (violet). **AlertSeverityBadge** — CRITICAL (red), WARNING (amber), WATCH (yellow), EXCESS (blue). **ConfidenceRing** — circular progress indicator for confidence scores. **DaysOfSupplyBar** — horizontal bar showing current DOS vs. target, color-coded. **InfoTooltip** — shadcn `<Tooltip>` with (i) icon trigger for contextual help. **BackButton** — breadcrumb-style back navigation. |
| 1.7 | `[ ]` | `specs/v2/07_chart_components.md` | 1.2, 1.3 | Recharts wrapper components with Springfield Marine brand styling. **FanChart** — line chart with shaded P10/P50/P90 + P2.5/P97.5 prediction intervals. Actual history as solid line, forecast as dashed. Configurable time range. **DemandHistoryChart** — bar chart of monthly demand with optional trend line. **InventoryTimelineChart** — line chart of on-hand over time with min/max/reorder bands. **FillRateGauge** — radial gauge (0-100%) with target markers at 85/90/98%. **DonutChart** — demand class distribution or parameter status distribution. **BarChart** — horizontal/vertical for MAPE by class, FVA comparison. **StackedBarChart** — for algorithm comparison or category breakdown. All charts: consistent color palette, responsive, tooltip on hover, legend. |

**Parallelization:** 1.4, 1.5, 1.6, 1.7 ALL run in parallel. Max fan-out: 4 agents.

### Tier 1-C: Pages (ALL PARALLEL — maximum fan-out)

| # | Status | Spec File | Depends On | Description |
|---|--------|-----------|------------|-------------|
| 1.8 | `[ ]` | `specs/v2/08_executive_dashboard.md` | 1.4, 1.6, 1.7 | **Executive Dashboard** (`/`). Top row: 4-6 KPI cards (fill rate, total SKUs, inventory value, revenue run rate, critical alerts count, parameters coverage %). Second row: DOS distribution chart (donut or histogram showing how many SKUs fall into each DOS bucket: <7d, 7-14d, 14-30d, 30-60d, 60-90d, >90d) + demand fan chart showing aggregate demand forecast. Third row: top 5 exceptions table (highest priority worklist items) + activity feed (recent alert/action events). All data from the data layer, all computed from real pipeline output. |
| 1.9 | `[ ]` | `specs/v2/09_action_center.md` | 1.4, 1.6 | **Buyer Action Center** (`/actions`). The single most important page. Combined view of alerts + worklist as a unified priority queue. Severity filter tabs (ALL / CRITICAL / WARNING / WATCH / EXCESS). Sortable table columns: priority rank, part number (linked to SKU detail), description, on-hand, DOS, alert level, action type, recommended qty, source, confidence score, estimated cost. **Inline actions**: [Approve] [Modify] [Defer] [Escalate] per row — update local state via DemoStateProvider. **Bulk approval**: checkbox selection + "Approve Selected" button with spend summary dialog (shadcn `<Dialog>`). Confidence scores < 70% show amber badge + require justification click-through. |
| 1.10 | `[ ]` | `specs/v2/10_sku_detail.md` | 1.4, 1.6, 1.7 | **SKU Detail** (`/sku/:partNumber`). Header: part number, description, demand class badge, source badge, product family. **Section 1 — Demand**: DemandHistoryChart (trailing 24+ months) + FanChart (12-month forecast with intervals). **Section 2 — Inventory**: current on-hand card, inventory timeline chart (55 months of data), min/max/reorder/safety visual gauge. **Section 3 — Parameters**: editable card for min, max, safety stock, reorder point, target CSL, lead time. Shows system-calculated alongside current. Toggle system vs. override. **Section 4 — Customers**: top customers by revenue for this SKU (from customerDetail data). **Section 5 — Alerts**: recent alerts for this SKU, with severity badges. Tabbed or scrollable layout. |
| 1.11 | `[ ]` | `specs/v2/11_inventory_params.md` | 1.4, 1.6 | **Inventory Parameters** (`/inventory`). **Coverage cards** (top): total active SKUs, % with parameters set, % below min (red), % above max (blue), % NOT_SET (gray), dollar value at risk. **Violation filter buttons**: "All", "Below Min" (red), "Above Max" (blue), "No Parameters" (gray), "Needs Review" (amber). **Parameter table**: shadcn `<Table>` with columns: part number (linked), description, product line, on-hand, min, max, safety stock, reorder point, CSL, lead time, status badge, DOS. **Inline editing**: click-to-edit on min, max, safety stock, reorder point, CSL, lead time — shows system recommendation alongside. **CSV export button**. URL params for filter state (`?filter=below-min`). |
| 1.12 | `[ ]` | `specs/v2/12_forecast_overview.md` | 1.4, 1.6, 1.7 | **Forecast Overview** (`/forecast`). **Classification distribution**: DonutChart showing SKU count by demand class (SMOOTH, ERRATIC, INTERMITTENT, LUMPY, NEW_COLD_START). **Accuracy by class**: BarChart showing average MAPE per demand class. **Algorithm comparison**: grouped BarChart showing MAPE for each algorithm (SARIMA, XGBOOST, CROSTONS, NAIVE_SEASONAL). **FVA table**: Forecast Value Added — each algorithm's MAPE vs. naive baseline, showing which add value. **Worst performers**: table of 10 SKUs with highest MAPE, linked to SKU detail. **Seasonal patterns**: aggregate demand visualization showing March/May peaks and Sept/Dec troughs. |
| 1.13 | `[ ]` | `specs/v2/13_roadmap_stubs.md` | 1.2 | **Roadmap stub pages** for future modules. 4 pages: Fill Rate Tracker (`/roadmap/fill-rate`), Lead Time Monitor (`/roadmap/lead-time`), BOM Explorer (`/roadmap/bom`), Reshoring Tracker (`/roadmap/reshoring`). Each page: shadcn `<Card>` centered on page with: module icon (Lucide), module name, 2-3 sentence feature description from the SRD, "Coming in Phase 2" label, grayed-out mockup image or placeholder illustration. Sidebar nav shows these under "Roadmap" group with a lock icon and muted text. |

**Parallelization:** 1.8, 1.9, 1.10, 1.11, 1.12, 1.13 ALL run in parallel. Max fan-out: 6 agents.

### Tier 1-D: Integration (Depends on pages)

| # | Status | Spec File | Depends On | Description |
|---|--------|-----------|------------|-------------|
| 1.14 | `[ ]` | `specs/v2/14_state_management.md` | 1.9, 1.10, 1.11 | **DemoStateProvider** — React Context that wraps the app and manages mutable demo state. **Hooks**: `useWorklist()` — read/update worklist items (approve, defer, escalate, modify qty). `useAlerts()` — read/acknowledge alerts. `useParameters()` — read/update inventory parameters (inline edit, toggle system/override). `useToast()` — shadcn/sonner toast notifications for action confirmations. State persists within session (not across reloads). Actions dispatch to reducer pattern. Optimistic updates. |
| 1.15 | `[ ]` | `specs/v2/15_routing.md` | 1.8-1.13 | React Router v7 setup. Routes: `/` → Executive Dashboard, `/actions` → Buyer Action Center, `/sku/:id` → SKU Detail, `/inventory` → Inventory Parameters, `/forecast` → Forecast Overview, `/roadmap/fill-rate`, `/roadmap/lead-time`, `/roadmap/bom`, `/roadmap/reshoring` → stub pages, `*` → 404 page. Breadcrumb generation from route config. Active sidebar highlighting. Page titles via document.title. |
| 1.16 | `[ ]` | `specs/v2/16_testing.md` | All | Test plan: (1) **Data integrity tests** — verify all generated TypeScript data files parse correctly, cross-references are valid (e.g., alert.skuId exists in SKUs), enums are consistent. (2) **Component render tests** — each shared component renders without crashing with sample props. (3) **Page smoke tests** — each page renders without errors. (4) **Interaction tests** — worklist approve/defer, alert acknowledge, parameter edit, filter toggle. Use Vitest + React Testing Library. |

**Parallelization:** 1.14 and 1.15 can run in parallel (both depend on pages but not each other). 1.16 depends on everything.

### Generation 1 Dependency Graph

```
Tier 1-A:  [1.1] → [1.2] → [1.3]                    ← SEQUENTIAL

Tier 1-B:  [1.4]  [1.5]  [1.6]  [1.7]               ← ALL PARALLEL (4 agents)

Tier 1-C:  [1.8] [1.9] [1.10] [1.11] [1.12] [1.13]  ← ALL PARALLEL (6 agents)

Tier 1-D:  [1.14]  [1.15]                             ← PARALLEL (2 agents)
                  \   /
                 [1.16]                                ← SEQUENTIAL (needs all)
```

**Max parallelism in Gen 1:** 6 agents (Tier 1-C).

---

## Generation 2: Code Implementation

> **Goal:** Implement every spec as working code.
> **Design System:** shadcn/ui — components installed in `frontend/src/components/ui/`.
> **Data:** TypeScript constants in `frontend/src/data/*.ts` (from Gen 0).
> **Quality Gate:** Every sub-agent runs `npm run lint && npm run type-check && npm run build` before completing.

### Tier 2-0: Scaffold (Single agent)

| # | Status | Spec | Key Actions | Notes |
|---|--------|------|-------------|-------|
| 2.1 | `[ ]` | `01_project_setup` | Fresh Vite scaffold (or reconfigure existing). `npx shadcn@latest init`. Install all shadcn components listed in spec. Configure Tailwind 4 theme with Springfield Marine brand colors. Set up ESLint, Vitest, tsconfig strict. Create directory structure. | This MUST complete before any other Gen 2 task. |

### Tier 2-1: Foundation (PARALLEL — 2 agents)

| # | Status | Spec | Key Actions | Can Parallel With |
|---|--------|------|-------------|-------------------|
| 2.2 | `[ ]` | `02_design_system` | `AppShell.tsx`, `AppSidebar.tsx` (shadcn sidebar), `TopBar.tsx`, `Breadcrumbs.tsx`, theme CSS variables, layout composition. | 2.3 |
| 2.3 | `[ ]` | `03_types` | `src/lib/types.ts` — all interfaces and const enum objects. No runtime dependencies. | 2.2 |

### Tier 2-2: Core Systems (PARALLEL — 3 agents)

| # | Status | Spec | Key Actions | Depends On |
|---|--------|------|-------------|------------|
| 2.4 | `[ ]` | `04_data_layer` | `src/lib/data-helpers.ts` — import generated data, build lookup Maps, filter functions, computed aggregates. | 2.3, Gen 0 (0.9) |
| 2.6 | `[ ]` | `06_common_components` | `src/components/` — KpiCard, StatusBadge, DemandClassBadge, SourceBadge, AlertSeverityBadge, ConfidenceRing, DaysOfSupplyBar, InfoTooltip, BackButton. All composing shadcn primitives. | 2.2, 2.3 |
| 2.7 | `[ ]` | `07_chart_components` | `src/components/charts/` — FanChart, DemandHistoryChart, InventoryTimelineChart, FillRateGauge, DonutChart, BarChart, StackedBarChart. All Recharts wrappers with brand colors. | 2.2, 2.3 |

**Note:** 2.4 needs Gen 0 output (the TypeScript data files). 2.6 and 2.7 only need the design system and types.

### Tier 2-3: Pages + Systems (PARALLEL — maximum fan-out: 8 agents)

This is the **peak parallelism tier**. All 8 tasks can run simultaneously.

| # | Status | Spec | Key Actions | Depends On |
|---|--------|------|-------------|------------|
| 2.5 | `[ ]` | `05_command_palette` | `src/components/CommandPalette.tsx` — Cmd+K dialog using shadcn `<Command>`, search across SKUs/pages/actions, keyboard nav, route navigation on select. | 2.2, 2.4 |
| 2.8 | `[ ]` | `08_executive_dashboard` | `src/pages/Dashboard/index.tsx` — KPI cards row, DOS distribution chart, demand fan chart, top exceptions table, activity feed. | 2.4, 2.6, 2.7 |
| 2.9 | `[ ]` | `09_action_center` | `src/pages/ActionCenter/index.tsx` — unified priority queue table, severity filter tabs, inline action buttons, bulk approval dialog, confidence badges. | 2.4, 2.6 |
| 2.10 | `[ ]` | `10_sku_detail` | `src/pages/SkuDetail/index.tsx` — demand history, forecast fan chart, inventory timeline, parameters card, customer breakdown, alert history. | 2.4, 2.6, 2.7 |
| 2.11 | `[ ]` | `11_inventory_params` | `src/pages/InventoryParameters/index.tsx` — coverage cards, violation filters, parameter table with inline editing, CSV export. | 2.4, 2.6 |
| 2.12 | `[ ]` | `12_forecast_overview` | `src/pages/Forecast/index.tsx` — classification donut, accuracy bars, algorithm comparison, worst performers, seasonal viz. | 2.4, 2.6, 2.7 |
| 2.13 | `[ ]` | `13_roadmap_stubs` | `src/pages/Roadmap/*.tsx` — 4 stub pages with "Coming Soon" cards. | 2.2 |
| 2.14 | `[ ]` | `14_state_management` | `src/providers/DemoStateProvider.tsx` + `src/hooks/useWorklist.ts`, `useAlerts.ts`, `useParameters.ts`, `useToast.ts`. | 2.3, 2.4 |

### Tier 2-4: Integration (PARALLEL — 2 agents, then 1)

| # | Status | Spec | Key Actions | Depends On |
|---|--------|------|-------------|------------|
| 2.15 | `[ ]` | `15_routing` | `src/router.tsx` — React Router v7 config, all routes, breadcrumb generation, 404 page, document titles. Wire AppShell + all pages. | 2.8-2.13 (all pages) |
| 2.16 | `[ ]` | `16_testing` | `src/test/*.test.ts` — data integrity tests, component render tests, page smoke tests, interaction tests. | ALL |

### Generation 2 Dependency Graph

```
Tier 2-0:  [2.1]                                          ← SCAFFOLD (solo)

Tier 2-1:  [2.2]  [2.3]                                   ← PARALLEL (2 agents)

Tier 2-2:  [2.4]  [2.6]  [2.7]                            ← PARALLEL (3 agents)

Tier 2-3:  [2.5] [2.8] [2.9] [2.10] [2.11] [2.12] [2.13] [2.14]  ← ALL PARALLEL (8 agents)

Tier 2-4:  [2.15]                                          ← needs all pages
           [2.16]                                          ← needs everything
```

**Max parallelism in Gen 2:** 8 agents (Tier 2-3).

---

## Combined Execution Timeline

```
GENERATION 0 — DATA PIPELINE
═══════════════════════════════════════════════════════════
Tier 0-A │ [0.1 Item Master] [0.2 Daily Sales] [0.3 Inventory]  ← 3 parallel
Tier 0-B │                   [0.4 Classification]
Tier 0-C │                   [0.5 Forecasts]
Tier 0-D │                   [0.6 Safety Stock]
Tier 0-E │ [0.7 Alerts] → [0.8 Worklist]
Tier 0-F │ [0.9 TS Export]
═══════════════════════════════════════════════════════════

GENERATION 1 — SPEC GENERATION (can start after Gen 0 for data-dependent specs)
═══════════════════════════════════════════════════════════
Tier 1-A │ [1.1] → [1.2] → [1.3]                          ← sequential
Tier 1-B │ [1.4] [1.5] [1.6] [1.7]                        ← 4 parallel
Tier 1-C │ [1.8] [1.9] [1.10] [1.11] [1.12] [1.13]       ← 6 parallel (MAX)
Tier 1-D │ [1.14] [1.15] → [1.16]
═══════════════════════════════════════════════════════════

GENERATION 2 — CODE IMPLEMENTATION
═══════════════════════════════════════════════════════════
Tier 2-0 │ [2.1 Scaffold]
Tier 2-1 │ [2.2] [2.3]                                     ← 2 parallel
Tier 2-2 │ [2.4] [2.6] [2.7]                               ← 3 parallel
Tier 2-3 │ [2.5] [2.8] [2.9] [2.10] [2.11] [2.12] [2.13] [2.14]  ← 8 parallel (MAX)
Tier 2-4 │ [2.15] → [2.16]
═══════════════════════════════════════════════════════════
```

### Cross-Generation Parallelism

Not everything is strictly sequential across generations:

| Opportunity | Condition |
|-------------|-----------|
| Gen 1 Tier 1-A (1.1, 1.2, 1.3) can start **during** Gen 0 | These specs don't need pipeline output |
| Gen 1 Tasks 1.5, 1.6, 1.7, 1.13 can start **during** Gen 0 | These specs don't reference specific data shapes |
| Gen 1 Task 1.4 (data layer spec) must wait for Gen 0 Task 0.9 | Spec needs to know the exact TypeScript export shapes |
| Gen 2 Task 2.1 (scaffold) can start **during** Gen 1 Tier 1-C | Just needs spec 1.1 |
| Gen 2 Tasks 2.2, 2.3 can start **during** Gen 1 Tier 1-C | Just need specs 1.2, 1.3 |

Aggressive scheduling:

```
TIME →→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→

Gen 0:  [0.1][0.2][0.3] → [0.4] → [0.5] → [0.6] → [0.7] → [0.8] → [0.9]
Gen 1:  [1.1] → [1.2] → [1.3] → [1.5][1.6][1.7] → [1.8-1.13] → [1.14][1.15] → [1.16]
                                   [1.4 waits for 0.9]───────────↗
Gen 2:                    [2.1] → [2.2][2.3] → [2.4][2.6][2.7] → [2.5][2.8-2.14] → [2.15] → [2.16]
```

---

## Post-Build Quality Gate

After ALL Generation 2 tasks complete:

```bash
# Frontend quality suite
cd frontend && npm run lint && npm run type-check && npm run test -- --run && npm run build
```

If any check fails:
1. Read the error output
2. Fix the root cause
3. Re-run the full suite
4. Repeat until all green

**This gate is non-negotiable.** The build is not complete until the quality suite passes with zero errors.

---

## Rules

1. **Parallelization is mandatory.** The orchestrator MUST launch all tasks within a tier simultaneously. Sequential execution of parallelizable tasks is a violation.
2. **Tier ordering is strict.** No task in Tier N+1 may start until ALL tasks in Tier N have completed.
3. **Fresh agents only.** Each sub-agent is a new Opus 4.6 instance with zero carryover. Never reuse or continue a session.
4. **One task per agent.** Each sub-agent handles exactly one task. No combining.
5. **The Kernel is immutable.** No agent may contradict `00_KERNEL.md`.
6. **Real data, not mock.** V2 data comes from the Python pipeline parsing real `.xls` files. The only "constructed" data is forecasts, safety stock, alerts, and worklist — and even those are computed from real demand/inventory data.
7. **shadcn/ui is the design system.** Every component must build on shadcn primitives. Do not reinvent Card, Button, Badge, Table, Dialog, etc.
8. **Quality gate is non-negotiable.** Every code implementation sub-agent runs `lint + type-check + build` before reporting completion.
9. **Data pipeline never modifies source files.** All `.xls` files in `Data/` are read-only. Output goes to `data/parsed/`.
10. **Status tracking.** Update status as tasks execute: `[ ]` → `[~]` → `[x]` or `[!]`.
11. **Retry once on failure.** If a sub-agent fails, retry with a fresh agent once. If it fails again, mark `[!]` and document the blocker.
12. **SRD traceability.** Specs should reference SRD requirements (REQ-x.x.x) where applicable, but V2 scope is limited to the 5 core pages.
13. **Cross-generation overlap is encouraged.** Specs that don't depend on pipeline output can be written while the pipeline runs. Scaffold code can start as soon as the setup spec exists.
