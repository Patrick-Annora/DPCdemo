# Spec 14 — Pipeline Status Page

**File:** `frontend/src/pages/Pipeline/PipelineStatusPage.tsx`
**Route:** `/pipeline`
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions — `PipelineStatus`, `PipelineState`), Spec 04 (Mock Data — `MOCK_PIPELINE_STATUS`), Spec 05 (Common Components — `SummaryCard`, `StatusBadge`, `DataTable`)
**Kernel ref:** 00_KERNEL.md §4.8 (Data Pipeline Status)
**SRD ref:** Module 4 — §4.1 (Epicor Integration), §4.2 (MDM Harmonization), §4.3 (Historical Data Ingestion)

---

## 1. Overview

The Pipeline Status page gives operations and data engineering users a single view into the health of every data feed powering the demand planning system. It surfaces pipeline health, data freshness, ingestion metrics, MDM entity resolution exceptions, and quarantined records — everything needed to trust that the system is operating on current, clean data.

This page is read-heavy with targeted actions: approving/rejecting MDM merge candidates and fixing/dismissing quarantined records.

---

## 2. Page Layout

```
+---------------------------------------------------------------------+
| PageHeader: "Data Pipeline Status"                                  |
| Breadcrumb: Home > Pipeline Status                                  |
+---------------------------------------------------------------------+
| [SummaryCard] [SummaryCard] [SummaryCard] [SummaryCard]             |
| Records 24h   Error Rate %   Data Quality   Active Feeds            |
+---------------------------------------------------------------------+
| Pipeline Health Cards (responsive grid)                             |
| [Card][Card][Card]                                                  |
| [Card][Card][Card]                                                  |
| [Card][Card][Card]                                                  |
+---------------------------------------------------------------------+
| Recent Ingestion Runs (DataTable)                                   |
| timestamp | feed | records | errors | duration | status             |
+---------------------------------------------------------------------+
| Tabs: [ MDM Exception Queue ] [ Quarantined Records ]              |
| ------------------------------------------------------------------- |
| (Active tab content — either MDM table or Quarantine table)         |
+---------------------------------------------------------------------+
```

**Responsive behavior:**
- Health card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `gap-4`
- Summary cards: `grid-cols-2 lg:grid-cols-4` with `gap-4`
- Tables span full width below the cards
- Tab section uses standard tab UI with underline active indicator

---

## 3. File Structure

```
frontend/src/pages/Pipeline/
  PipelineStatusPage.tsx       # Page shell: layout, state, tab management
  PipelineHealthCard.tsx       # Individual feed health card
  FreshnessIndicator.tsx       # Relative time display with color degradation
  IngestionMetrics.tsx         # Summary cards + recent runs table
  MdmExceptionQueue.tsx        # MDM candidate merge table with actions
  QuarantineTable.tsx          # Quarantined records table with actions
  index.ts                     # Barrel export
```

---

## 4. Extended Type Definitions

The following types extend the core `PipelineStatus` interface from Spec 03 and are defined in `frontend/src/lib/types.ts`. If they do not already exist there, they MUST be added.

### 4.1 Extended PipelineStatus

The existing `PipelineStatus` interface from Spec 03 §3.13 is sufficient for the health cards. No changes needed.

### 4.2 FreshnessThreshold

```typescript
/** Per-feed freshness threshold configuration. */
export interface FreshnessThreshold {
  /** Pipeline name — must match PipelineStatus.pipelineName */
  pipelineName: string;
  /** Expected update interval in minutes. Data older than this is STALE. */
  expectedIntervalMinutes: number;
  /** Warning threshold in minutes. Data older than this but within 2x is DEGRADED. */
  warningThresholdMinutes: number;
}
```

### 4.3 IngestionRun

```typescript
/** A single ingestion run record for the recent-runs table. */
export interface IngestionRun {
  /** Unique run identifier */
  runId: string;
  /** Pipeline/feed name */
  feedName: string;
  /** ISO 8601 timestamp when the run started */
  timestamp: string;
  /** Number of records ingested */
  recordsIngested: number;
  /** Number of errors encountered */
  errors: number;
  /** Run duration in seconds */
  durationSeconds: number;
  /** Run outcome status */
  status: PipelineState;
}
```

### 4.4 MdmCandidate

```typescript
/** MDM entity resolution candidate pair for the exception queue. */
export interface MdmCandidate {
  /** Unique candidate identifier */
  candidateId: string;
  /** Part A — part number from one namespace */
  partA: string;
  /** Part A description */
  partADescription: string;
  /** Part A source namespace (e.g., "Springfield Marine", "Shark Seating Ltd.") */
  partANamespace: string;
  /** Part B — part number from another namespace */
  partB: string;
  /** Part B description */
  partBDescription: string;
  /** Part B source namespace */
  partBNamespace: string;
  /** Overall match score from 0.0 to 1.0 */
  matchScore: number;
  /** Breakdown of matching criteria scores */
  criteriaBreakdown: MdmCriteriaBreakdown;
  /** Current resolution status */
  resolutionStatus: MdmResolutionStatus;
  /** ISO 8601 timestamp when this candidate was surfaced */
  createdAt: string;
}
```

### 4.5 MdmCriteriaBreakdown

```typescript
/** Breakdown of MDM matching criteria per SRD §4.2.2. */
export interface MdmCriteriaBreakdown {
  /** Material specification match score (0-1.0), weight 0.30 */
  materialMatch: number;
  /** Dimensional match score (0-1.0), weight 0.25 */
  dimensionalMatch: number;
  /** Supplier overlap score (0-1.0), weight 0.20 */
  supplierOverlap: number;
  /** Description similarity score (0-1.0), weight 0.15 */
  descriptionSimilarity: number;
  /** CAD/drawing cross-reference score (0-1.0), weight 0.10 */
  cadCrossReference: number;
}
```

### 4.6 MdmResolutionStatus

```typescript
/** Resolution status for an MDM candidate pair. */
export enum MdmResolutionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

### 4.7 QuarantinedRecord

```typescript
/** A record that failed validation and was quarantined. */
export interface QuarantinedRecord {
  /** Unique quarantine record identifier */
  recordId: string;
  /** Source feed that produced this record */
  source: string;
  /** Field name that failed validation */
  field: string;
  /** The problematic value (as string for display) */
  value: string;
  /** Human-readable reason for quarantine */
  reason: string;
  /** ISO 8601 timestamp when the record was quarantined */
  quarantinedAt: string;
  /** Current resolution status */
  resolution: QuarantineResolution;
}
```

### 4.8 QuarantineResolution

```typescript
/** Resolution status for a quarantined record. */
export enum QuarantineResolution {
  PENDING = 'PENDING',
  FIXED = 'FIXED',
  DISMISSED = 'DISMISSED',
}
```

---

## 5. Extended Mock Data

The following mock data constants MUST be added to `frontend/src/data/pipeline.ts` (extending the existing `MOCK_PIPELINE_STATUS`).

### 5.1 MOCK_PIPELINE_STATUS (extended)

Add one additional feed to the existing 8 pipelines to reach the 9 feeds listed in the task:

| pipelineName | lastRun | recordsProcessed | errors | status |
|---|---|---|---|---|
| Epicor CDC -- Sales Orders | 2026-04-03T05:30:00Z | 1,247 | 0 | HEALTHY |
| Epicor CDC -- Inventory | 2026-04-03T06:00:00Z | 2,718 | 3 | HEALTHY |
| Epicor CDC -- PO | 2026-04-02T18:00:00Z | 89 | 0 | HEALTHY |
| FRED API (Economic Indicators) | 2026-04-01T08:00:00Z | 14 | 0 | HEALTHY |
| NMMA (Industry Data) | 2026-03-15T12:00:00Z | 0 | 0 | STALE |
| SCFI/Drewry (Freight Indices) | 2026-04-02T00:00:00Z | 52 | 1 | DEGRADED |
| LME (Metal Prices) | 2026-04-03T04:15:00Z | 6 | 0 | HEALTHY |
| NOAA (Weather) | 2026-04-02T22:00:00Z | 128 | 0 | HEALTHY |
| Carrier Tracking APIs | 2026-04-03T03:45:00Z | 347 | 8 | DEGRADED |

### 5.2 MOCK_FRESHNESS_THRESHOLDS

**Export:** `MOCK_FRESHNESS_THRESHOLDS: readonly FreshnessThreshold[]`

| pipelineName | expectedIntervalMinutes | warningThresholdMinutes |
|---|---|---|
| Epicor CDC -- Sales Orders | 5 | 15 |
| Epicor CDC -- Inventory | 240 | 480 |
| Epicor CDC -- PO | 5 | 15 |
| FRED API (Economic Indicators) | 1440 (daily) | 4320 (3 days) |
| NMMA (Industry Data) | 43200 (30 days) | 64800 (45 days) |
| SCFI/Drewry (Freight Indices) | 10080 (weekly) | 20160 (2 weeks) |
| LME (Metal Prices) | 1440 (daily) | 2880 (2 days) |
| NOAA (Weather) | 10080 (weekly) | 20160 (2 weeks) |
| Carrier Tracking APIs | 60 | 180 |

### 5.3 MOCK_INGESTION_RUNS

**Export:** `MOCK_INGESTION_RUNS: readonly IngestionRun[]`
**Count:** 15 recent runs (most recent first)

| runId | feedName | timestamp | recordsIngested | errors | durationSeconds | status |
|---|---|---|---|---|---|---|
| RUN-001 | Epicor CDC -- Sales Orders | 2026-04-03T05:30:00Z | 1,247 | 0 | 12 | HEALTHY |
| RUN-002 | Epicor CDC -- Inventory | 2026-04-03T06:00:00Z | 2,718 | 3 | 45 | HEALTHY |
| RUN-003 | Carrier Tracking APIs | 2026-04-03T03:45:00Z | 347 | 8 | 23 | DEGRADED |
| RUN-004 | LME (Metal Prices) | 2026-04-03T04:15:00Z | 6 | 0 | 3 | HEALTHY |
| RUN-005 | NOAA (Weather) | 2026-04-02T22:00:00Z | 128 | 0 | 8 | HEALTHY |
| RUN-006 | Epicor CDC -- PO | 2026-04-02T18:00:00Z | 89 | 0 | 5 | HEALTHY |
| RUN-007 | SCFI/Drewry (Freight Indices) | 2026-04-02T00:00:00Z | 52 | 1 | 14 | DEGRADED |
| RUN-008 | FRED API (Economic Indicators) | 2026-04-01T08:00:00Z | 14 | 0 | 7 | HEALTHY |
| RUN-009 | Epicor CDC -- Sales Orders | 2026-04-02T05:30:00Z | 1,183 | 0 | 11 | HEALTHY |
| RUN-010 | Epicor CDC -- Inventory | 2026-04-02T06:00:00Z | 2,690 | 0 | 42 | HEALTHY |
| RUN-011 | Carrier Tracking APIs | 2026-04-02T03:50:00Z | 312 | 2 | 19 | HEALTHY |
| RUN-012 | LME (Metal Prices) | 2026-04-02T04:15:00Z | 6 | 0 | 3 | HEALTHY |
| RUN-013 | Epicor CDC -- PO | 2026-04-01T18:00:00Z | 105 | 1 | 6 | HEALTHY |
| RUN-014 | NMMA (Industry Data) | 2026-03-15T12:00:00Z | 0 | 0 | 120 | STALE |
| RUN-015 | Epicor CDC -- Sales Orders | 2026-04-01T05:30:00Z | 1,198 | 0 | 10 | HEALTHY |

### 5.4 MOCK_MDM_CANDIDATES

**Export:** `MOCK_MDM_CANDIDATES: readonly MdmCandidate[]`
**Count:** 6 candidates

| candidateId | partA | partANamespace | partB | partBNamespace | matchScore | resolutionStatus |
|---|---|---|---|---|---|---|
| MDM-001 | 1100031-1 (TRAC-LOCK SWIVEL LOCKING) | Springfield Marine | SH-SWV-LK-01 (Locking Swivel Assembly 60mm) | Shark Seating Ltd. | 0.91 | PENDING |
| MDM-002 | 1600113 (TAPER-LOCK BUSHING 2-3/8) | Springfield Marine | AFT-BUS-238 (Bushing Taper 2.375in) | Advanced Fabrication | 0.87 | PENDING |
| MDM-003 | 1641019 (SPRING-LOCK BASE - ROUND) | Springfield Marine | SH-BASE-RND-01 (Round Pedestal Base 316SS) | Shark Seating Ltd. | 0.82 | PENDING |
| MDM-004 | 1560200 (ECONOMY POST 13 IN) | Springfield Marine | AFT-POST-13 (Pedestal Post 330mm Economy) | Advanced Fabrication | 0.78 | PENDING |
| MDM-005 | 1100027 (TRAC-LOCK SWIVEL NON-LOCKING) | Springfield Marine | SH-SWV-NL-01 (Non-Locking Swivel Assembly 60mm) | Shark Seating Ltd. | 0.93 | APPROVED |
| MDM-006 | RAW-AL-6061 (ALUMINUM EXTRUSION 6061-T6) | Springfield Marine | SH-AL-6061 (6061 T6 Aluminium Bar Stock) | Shark Seating Ltd. | 0.85 | REJECTED |

**Criteria breakdown examples (MDM-001):**

```typescript
{
  materialMatch: 0.95,       // Both 316 SS, exact alloy match
  dimensionalMatch: 0.88,    // 60mm ≈ 2.362in, within 2% of 2-3/8
  supplierOverlap: 0.90,     // Same fastener vendor (shared DUNS)
  descriptionSimilarity: 0.87, // TF-IDF cosine similarity
  cadCrossReference: 0.70,   // Partial — drawing cross-ref pending
}
```

### 5.5 MOCK_QUARANTINED_RECORDS

**Export:** `MOCK_QUARANTINED_RECORDS: readonly QuarantinedRecord[]`
**Count:** 8 records

| recordId | source | field | value | reason | quarantinedAt | resolution |
|---|---|---|---|---|---|---|
| QR-001 | Shark Seating Ltd. | weight | 2540 | Out-of-range: expected 20-200g for this component; likely unconverted imperial value (5.6 lbs) | 2026-04-02T14:30:00Z | PENDING |
| QR-002 | Epicor CDC -- PO | uom | BOX | Ambiguous UOM: "BOX" not in canonical UOM registry; cannot determine EA conversion | 2026-04-01T09:15:00Z | PENDING |
| QR-003 | Epicor CDC -- Sales Orders | quantity | -12 | Negative quantity on sales order line; possible return not flagged as RMA | 2026-04-02T06:00:00Z | PENDING |
| QR-004 | SCFI/Drewry | freight_rate | 0.00 | Zero freight rate for Shanghai-LA route; likely missing data from API response | 2026-04-01T00:00:00Z | PENDING |
| QR-005 | Shark Seating Ltd. | linear_dimension | 2540 | Out-of-range: expected 20-200mm for bushing OD; likely unconverted inches (100in) | 2026-03-28T10:00:00Z | FIXED |
| QR-006 | Epicor CDC -- Inventory | on_hand | 999999 | Unrealistic on-hand quantity for SKU 1040620; exceeds 3-sigma of historical max | 2026-03-30T06:00:00Z | PENDING |
| QR-007 | FRED API | interest_rate | null | Missing value for FEDFUNDS series March 2026; API returned null | 2026-04-01T08:00:00Z | DISMISSED |
| QR-008 | Advanced Fabrication | part_number | (empty) | Missing part number field on BOM line import row 247 | 2026-03-29T15:00:00Z | PENDING |

---

## 6. Component Specifications

### 6.1 PipelineStatusPage

**File:** `frontend/src/pages/Pipeline/PipelineStatusPage.tsx`

**Responsibilities:**
- Page shell with `PageHeader` ("Data Pipeline Status", breadcrumb: Home > Pipeline Status)
- Renders `IngestionMetrics` summary cards at top
- Renders a responsive grid of `PipelineHealthCard` components, one per feed
- Renders the recent ingestion runs `DataTable`
- Manages tab state for the bottom section (MDM Exception Queue | Quarantined Records)
- Renders the active tab's content component

**State:**

```typescript
const [activeTab, setActiveTab] = useState<'mdm' | 'quarantine'>('mdm');
const [mdmCandidates, setMdmCandidates] = useState<MdmCandidate[]>(MOCK_MDM_CANDIDATES);
const [quarantinedRecords, setQuarantinedRecords] = useState<QuarantinedRecord[]>(MOCK_QUARANTINED_RECORDS);
```

**Tab UI:**

```
<div className="border-b border-slate-200">
  <nav className="flex gap-6 px-1" aria-label="Pipeline data quality tabs">
    <button
      className={`py-3 text-sm font-medium border-b-2 transition-colors
        ${activeTab === 'mdm'
          ? 'border-navy-500 text-navy-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
      onClick={() => setActiveTab('mdm')}
    >
      MDM Exception Queue
      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        {mdmCandidates.filter(c => c.resolutionStatus === MdmResolutionStatus.PENDING).length}
      </span>
    </button>
    <button
      className={`py-3 text-sm font-medium border-b-2 transition-colors
        ${activeTab === 'quarantine'
          ? 'border-navy-500 text-navy-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
      onClick={() => setActiveTab('quarantine')}
    >
      Quarantined Records
      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        {quarantinedRecords.filter(r => r.resolution === QuarantineResolution.PENDING).length}
      </span>
    </button>
  </nav>
</div>
```

**Placeholder markers:**
- `// WEBSOCKET_PLACEHOLDER: Subscribe to real-time pipeline health events`
- `// API_PLACEHOLDER: Fetch pipeline status from /api/pipeline/status`
- `// API_PLACEHOLDER: Fetch MDM candidates from /api/mdm/candidates`
- `// API_PLACEHOLDER: Fetch quarantined records from /api/quarantine`

---

### 6.2 PipelineHealthCard

**File:** `frontend/src/pages/Pipeline/PipelineHealthCard.tsx`

**Props:**

```typescript
interface PipelineHealthCardProps {
  /** Pipeline status data */
  pipeline: PipelineStatus;
  /** Freshness threshold configuration for this feed */
  threshold: FreshnessThreshold;
}
```

**Visual Description:**

```
+------------------------------------------+
| [StatusBadge: HEALTHY/DEGRADED/STALE/ERROR] |
| Feed Name                                 |
|                                           |
| Last sync: [FreshnessIndicator]           |
| Records:   1,247                          |
| Errors:    0                              |
+------------------------------------------+
```

Outer container:
```
<div className={`
  bg-white rounded-xl border p-5
  ${borderColorByStatus}
`}>
```

**Border color by status:**

| PipelineState | Border Class | Left Border Accent |
|---|---|---|
| HEALTHY | `border-slate-200` | `border-l-4 border-l-green-500` |
| DEGRADED | `border-amber-200` | `border-l-4 border-l-amber-500` |
| STALE | `border-yellow-200` | `border-l-4 border-l-yellow-500` |
| ERROR | `border-red-200` | `border-l-4 border-l-red-500` |

**Feed name styling:** `text-lg font-semibold text-slate-900` per Kernel §7.4 card titles.

**StatusBadge mapping:**

| PipelineState | label | bgColor | textColor |
|---|---|---|---|
| HEALTHY | "Healthy" | `bg-green-100` | `text-green-800` |
| DEGRADED | "Degraded" | `bg-amber-100` | `text-amber-800` |
| STALE | "Stale" | `bg-yellow-100` | `text-yellow-800` |
| ERROR | "Error" | `bg-red-100` | `text-red-800` |

**Metrics section:** Uses `text-sm text-slate-600` for labels, `text-sm font-mono text-slate-900` for values. Error count is styled `text-danger-500 font-medium` when > 0.

**Icons:** Use Lucide icons per feed type:
- Epicor CDC feeds: `Database`
- FRED API: `TrendingUp`
- NMMA: `Ship`
- SCFI/Drewry: `Container` (fallback: `Truck`)
- LME: `CircleDollarSign`
- NOAA: `CloudSun`
- Carrier Tracking: `PackageCheck`

---

### 6.3 FreshnessIndicator

**File:** `frontend/src/pages/Pipeline/FreshnessIndicator.tsx`

**Props:**

```typescript
interface FreshnessIndicatorProps {
  /** ISO 8601 timestamp of last sync */
  lastSync: string;
  /** Expected update interval in minutes */
  expectedIntervalMinutes: number;
  /** Warning threshold in minutes */
  warningThresholdMinutes: number;
}
```

**Behavior:**

1. Compute elapsed time from `lastSync` to now (use `Date.now()` — in production this would use server time).
2. Display as relative time string:
   - < 60 seconds: "just now"
   - < 60 minutes: "X min ago"
   - < 24 hours: "X hours ago"
   - < 7 days: "X days ago"
   - >= 7 days: "X weeks ago"
3. Color based on staleness:
   - elapsed <= expectedIntervalMinutes: `text-success-500` (fresh)
   - elapsed <= warningThresholdMinutes: `text-amber-600` (warning)
   - elapsed > warningThresholdMinutes: `text-danger-500` (stale)

**Visual Description:**

```
<span className={`inline-flex items-center gap-1 text-sm font-medium ${colorClass}`}>
  <Clock className="h-3.5 w-3.5" />
  {relativeTimeString}
</span>
```

Icon: `Clock` from `lucide-react`.

**Note:** For the demo, the relative time is computed against a fixed "now" of `2026-04-03T06:00:00Z` (stored as a constant `DEMO_NOW` in the component or a shared utility) so that the display is deterministic across demo runs.

---

### 6.4 IngestionMetrics

**File:** `frontend/src/pages/Pipeline/IngestionMetrics.tsx`

**Props:**

```typescript
interface IngestionMetricsProps {
  /** All pipeline status records */
  pipelines: PipelineStatus[];
  /** Recent ingestion run records */
  runs: IngestionRun[];
}
```

**Summary Cards (top row):**

Uses four `SummaryCard` components in a `grid-cols-2 lg:grid-cols-4 gap-4` grid:

| label | value (derived) | trend | target |
|---|---|---|---|
| Records Ingested (24h) | Sum of `recordsIngested` from runs with timestamp within last 24h. Mock value: **4,651** | `{ direction: 'up', delta: '+312', favorable: true }` | -- |
| Error Rate | `(total errors / total records) * 100` across last 24h runs. Mock value: **0.26%** | `{ direction: 'down', delta: '-0.1%', favorable: true }` | < 0.1% |
| Data Quality Score | Composite score 0-100 based on: (100 - error_rate_pct) * feed_freshness_factor. Mock value: **94** | `{ direction: 'up', delta: '+2', favorable: true }` | 99 |
| Active Feeds | Count of pipelines with status != ERROR. Mock value: **9 / 9** | `{ direction: 'flat', delta: '0', favorable: true }` | 9 / 9 |

**Recent Ingestion Runs table:**

Section title: `text-xl font-semibold text-slate-900` — "Recent Ingestion Runs"

Uses `DataTable` with the following columns:

| Column | Field | Width | Format | Sortable |
|---|---|---|---|---|
| Timestamp | `timestamp` | auto | ISO -> formatted date/time (e.g., "Apr 3, 2026 5:30 AM") | Yes (default desc) |
| Feed | `feedName` | auto | Plain text | Yes |
| Records | `recordsIngested` | 100px | Number with comma formatting, `font-mono` | Yes |
| Errors | `errors` | 80px | Number; red text when > 0 | Yes |
| Duration | `durationSeconds` | 100px | Formatted as "Xs" or "Xm Ys" | Yes |
| Status | `status` | 100px | `StatusBadge` using PipelineState color mapping | No |

**Default sort:** `timestamp` descending (most recent first).
**Page size:** 10 rows.

---

### 6.5 MdmExceptionQueue

**File:** `frontend/src/pages/Pipeline/MdmExceptionQueue.tsx`

**Props:**

```typescript
interface MdmExceptionQueueProps {
  /** MDM candidate pairs */
  candidates: MdmCandidate[];
  /** Callback when a candidate is approved */
  onApprove: (candidateId: string) => void;
  /** Callback when a candidate is rejected */
  onReject: (candidateId: string) => void;
}
```

**Section header:** "Entity Resolution Candidates" with a subheading: "Review potential part matches across Springfield Marine, Shark Seating, and AFT namespaces."

**Table columns (DataTable):**

| Column | Field | Width | Format | Sortable |
|---|---|---|---|---|
| Part A | `partA` + `partADescription` + `partANamespace` | 200px | Part number bold, description below in `text-xs text-slate-500`, namespace as a small `StatusBadge` | No |
| Part B | `partB` + `partBDescription` + `partBNamespace` | 200px | Same layout as Part A | No |
| Match Score | `matchScore` | 100px | Rendered as a horizontal bar + percentage. Bar fill color: >= 0.85 green, >= 0.70 amber, < 0.70 red. `font-mono` | Yes |
| Material | `criteriaBreakdown.materialMatch` | 70px | Percentage, `font-mono text-xs` | No |
| Dimensional | `criteriaBreakdown.dimensionalMatch` | 70px | Percentage, `font-mono text-xs` | No |
| Supplier | `criteriaBreakdown.supplierOverlap` | 70px | Percentage, `font-mono text-xs` | No |
| Description | `criteriaBreakdown.descriptionSimilarity` | 70px | Percentage, `font-mono text-xs` | No |
| Status | `resolutionStatus` | 100px | `StatusBadge`: PENDING amber, APPROVED green, REJECTED gray | No |
| Actions | -- | 180px | Two buttons (visible only when PENDING) | No |

**Action buttons:**

```
<button className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
  Approve Merge
</button>
<button className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 transition-colors">
  Reject
</button>
```

**Behavior:**
- Clicking "Approve Merge" calls `onApprove(candidateId)`, which updates local state to set `resolutionStatus` to `APPROVED`.
- Clicking "Reject" calls `onReject(candidateId)`, which updates local state to set `resolutionStatus` to `REJECTED`.
- Once resolved, action buttons are hidden and the status badge shows the outcome.
- `// EPICOR_PLACEHOLDER: POST approved merge to Epicor MDM service`

**Match score bar visual:**

```
<div className="flex items-center gap-2">
  <div className="h-2 w-16 rounded-full bg-slate-200 overflow-hidden">
    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score * 100}%` }} />
  </div>
  <span className="text-sm font-mono">{(score * 100).toFixed(0)}%</span>
</div>
```

---

### 6.6 QuarantineTable

**File:** `frontend/src/pages/Pipeline/QuarantineTable.tsx`

**Props:**

```typescript
interface QuarantineTableProps {
  /** Quarantined records */
  records: QuarantinedRecord[];
  /** Callback when a record is fixed */
  onFix: (recordId: string) => void;
  /** Callback when a record is dismissed */
  onDismiss: (recordId: string) => void;
}
```

**Section header:** "Quarantined Records" with subheading: "Records that failed validation rules during ingestion. Review and resolve before they can enter the system."

**Table columns (DataTable):**

| Column | Field | Width | Format | Sortable |
|---|---|---|---|---|
| Record ID | `recordId` | 100px | `font-mono text-sm` | No |
| Source | `source` | 150px | Plain text | Yes |
| Field | `field` | 120px | `font-mono text-sm text-navy-600` (code-like styling) | Yes |
| Value | `value` | 120px | `font-mono text-sm`; displayed in a `bg-red-50 px-2 py-0.5 rounded` inline container to highlight the problem | No |
| Reason | `reason` | auto (remaining) | `text-sm text-slate-600`, may wrap | No |
| Quarantined | `quarantinedAt` | 130px | Relative time via `FreshnessIndicator` logic (but no threshold coloring — just gray) | Yes |
| Status | `resolution` | 100px | `StatusBadge`: PENDING amber, FIXED green, DISMISSED gray | No |
| Actions | -- | 150px | Two buttons (visible only when PENDING) | No |

**Action buttons:**

```
<button className="rounded-md bg-navy-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-600 transition-colors">
  Fix
</button>
<button className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 transition-colors">
  Dismiss
</button>
```

**Behavior:**
- Clicking "Fix" opens a placeholder modal (simple confirmation: "Mark record QR-XXX as fixed?") then calls `onFix(recordId)`, updating local state to `FIXED`.
- Clicking "Dismiss" calls `onDismiss(recordId)`, updating local state to `DISMISSED`.
- Once resolved, action buttons are hidden and the status badge shows the outcome.
- `// API_PLACEHOLDER: POST resolution to /api/quarantine/{recordId}/resolve`

**Default sort:** `quarantinedAt` descending.
**Page size:** 10 rows.

---

## 7. Interaction Flows

### 7.1 MDM Approve Flow

1. User views MDM Exception Queue tab (default active tab).
2. User reviews a PENDING candidate row — inspects match score and criteria breakdown.
3. User clicks [Approve Merge].
4. Row's status badge changes from amber PENDING to green APPROVED.
5. Action buttons disappear for that row.
6. Tab badge count decrements by 1.
7. `// EPICOR_PLACEHOLDER: In production, this writes the canonical Part Number mapping to Epicor.`

### 7.2 MDM Reject Flow

1. User clicks [Reject] on a PENDING candidate.
2. Row's status badge changes to gray REJECTED.
3. Action buttons disappear.
4. Tab badge count decrements by 1.

### 7.3 Quarantine Fix Flow

1. User switches to Quarantined Records tab.
2. User reviews a PENDING record — reads the reason and problematic value.
3. User clicks [Fix].
4. Confirmation modal appears: "Mark record QR-XXX as fixed? In production, this would route to the data correction workflow."
5. User confirms.
6. Row's status badge changes to green FIXED.
7. Tab badge count decrements by 1.

### 7.4 Quarantine Dismiss Flow

1. User clicks [Dismiss] on a PENDING quarantined record.
2. Row's status badge changes to gray DISMISSED.
3. Tab badge count decrements by 1.

---

## 8. Accessibility

| Requirement | Implementation |
|---|---|
| Tab navigation | Tab buttons use `role="tab"`, tab panels use `role="tabpanel"`, container uses `role="tablist"` |
| Keyboard nav | Arrow keys switch between tabs; Enter/Space activates a tab |
| Status badge | Include `aria-label` with full status text (e.g., `aria-label="Pipeline status: Healthy"`) |
| Action buttons | Include `aria-label` with context (e.g., `aria-label="Approve merge of 1100031-1 and SH-SWV-LK-01"`) |
| Color contrast | All status colors meet WCAG AA contrast ratio (4.5:1 for text on badge backgrounds) |
| Tables | Use `<th scope="col">` for column headers |
| Freshness indicator | `aria-label` includes absolute timestamp alongside relative text |

---

## 9. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| < 640px (mobile) | Health cards stack single column. Summary cards stack 2-col. Tables scroll horizontally. MDM criteria columns hidden — expand on row click. |
| 640-1023px (tablet) | Health cards 2-col grid. Summary cards 2-col. Full table visible with horizontal scroll if needed. |
| >= 1024px (desktop) | Health cards 3-col grid. Summary cards 4-col. All table columns visible. |

---

## 10. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | Page renders at route `/pipeline` with correct `PageHeader` and breadcrumb | Navigate to `/pipeline`; visual check |
| 2 | All 9 pipeline feeds render as individual `PipelineHealthCard` components in a responsive grid | Count cards; resize viewport to verify grid reflow |
| 3 | Each health card displays: feed name, `StatusBadge` (correct color per `PipelineState`), last sync time, records processed, error count | Visual inspection of all 9 cards |
| 4 | `FreshnessIndicator` shows relative time string ("2 min ago", "18 days ago", etc.) that matches the `lastRun` timestamp relative to demo time | Compare displayed text against computed delta from DEMO_NOW |
| 5 | Freshness text color degrades green -> amber -> red based on per-feed threshold configuration | NMMA card shows red (stale past warning threshold); Epicor CDC Sales shows green (within expected interval) |
| 6 | Four summary cards display: total records ingested (24h), error rate %, data quality score, active feeds count — all with trend indicators | Visual check of values matching mock data derivations |
| 7 | Recent Ingestion Runs table displays 15 rows with correct columns, sortable by timestamp (default desc), feed, records, errors, duration | Click column headers to verify sort; check formatting |
| 8 | MDM Exception Queue tab shows pending count badge; table displays all 6 candidates with match scores and criteria breakdown | Visual check; verify badge count matches PENDING count |
| 9 | Clicking [Approve Merge] on a PENDING MDM candidate changes its status to APPROVED, hides action buttons, and decrements the tab badge count | Click approve on MDM-001; verify state change |
| 10 | Clicking [Reject] on a PENDING MDM candidate changes its status to REJECTED, hides action buttons, and decrements the tab badge count | Click reject on MDM-002; verify state change |
| 11 | Quarantined Records tab shows pending count badge; table displays all 8 records with field, value, reason, and resolution status | Switch to tab; verify badge and table content |
| 12 | Clicking [Fix] on a PENDING quarantined record shows confirmation modal; confirming changes status to FIXED | Click fix on QR-001; confirm modal; verify state change |
| 13 | Clicking [Dismiss] on a PENDING quarantined record changes status to DISMISSED | Click dismiss on QR-003; verify state change |
| 14 | Tab switching between MDM and Quarantine preserves state (approved/rejected/fixed items remain in their resolved state) | Approve an MDM item, switch tabs, switch back; verify still APPROVED |
| 15 | All tables use the shared `DataTable` component from Spec 05 | Code review: imports from `components/common/DataTable` |
| 16 | All status badges use the shared `StatusBadge` component from Spec 05 | Code review: imports from `components/common/StatusBadge` |
| 17 | All summary cards use the shared `SummaryCard` component from Spec 05 | Code review: imports from `components/common/SummaryCard` |
| 18 | Page compiles with zero TypeScript errors under strict mode | `tsc --noEmit` |
| 19 | Health card grid is responsive: 1-col on mobile, 2-col on tablet, 3-col on desktop | Resize browser; verify breakpoints |
| 20 | Placeholder markers present for API/WebSocket/Epicor integration points | Code review: grep for `API_PLACEHOLDER`, `WEBSOCKET_PLACEHOLDER`, `EPICOR_PLACEHOLDER` |
