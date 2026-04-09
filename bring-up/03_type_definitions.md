# Spec 03 — Type Definitions

**File:** `frontend/src/lib/types.ts`
**Depends on:** Spec 01 (project setup — TypeScript strict config)
**Kernel ref:** 00_KERNEL.md Section 3 (Domain Model)

---

## Overview

This spec defines every TypeScript enum, interface, and utility type for the entire application, exported from a single barrel file `frontend/src/lib/types.ts`. All mock data, component props, and hook return types across the app reference these types exclusively. No module may define its own ad-hoc shape for a domain entity.

---

## 1. Utility / Branded Types

These types add semantic meaning to primitive types without runtime overhead.

```typescript
/**
 * ISO year-month string in YYYY-MM format.
 * Used for all period-level time-series data (demand history, forecasts).
 */
export type DateString = string & { readonly __brand: 'DateString' };

/**
 * Monetary value in US Dollars.
 * All cost, revenue, and price fields use this type.
 */
export type Currency = number;

/**
 * A percentage value expressed as 0–100 (not 0–1).
 * Used for fill rates, confidence scores, tariff rates, MAPE, etc.
 */
export type Percentage = number;

/**
 * A single data point in a time series, used for chart rendering.
 */
export interface TimeSeriesPoint {
  /** Period label in YYYY-MM format */
  period: DateString;
  /** Numeric value for this period */
  value: number;
}

/**
 * A KPI tile displayed on dashboard summary cards.
 */
export interface DashboardKPI {
  /** Human-readable KPI name (e.g., "Fill Rate") */
  label: string;
  /** Current formatted value (e.g., "85%", "$1.2M") */
  value: string;
  /** Trend direction and magnitude vs. prior period */
  trend: KPITrend;
  /** Target value for comparison (e.g., "98%") */
  target: string;
}

/**
 * Trend metadata for a DashboardKPI.
 */
export interface KPITrend {
  /** Direction of change */
  direction: 'up' | 'down' | 'flat';
  /** Magnitude of change as a display string (e.g., "+3.2%") */
  delta: string;
  /** Whether the direction is favorable (green) or unfavorable (red) */
  favorable: boolean;
}
```

---

## 2. Enum Types

Every enum uses `string` values (not numeric) for readability in mock data and JSON serialization. Values match Kernel Section 3.2 exactly.

### 2.1 DemandClass

```typescript
/** SKU demand profile classification. Kernel Section 3.2. */
export enum DemandClass {
  SMOOTH_FAST = 'SMOOTH_FAST',
  ERRATIC_HIGH_VARIANCE = 'ERRATIC_HIGH_VARIANCE',
  INTERMITTENT_LUMPY = 'INTERMITTENT_LUMPY',
  NEW_COLD_START = 'NEW_COLD_START',
  DEFENSE_CONTRACT = 'DEFENSE_CONTRACT',
}
```

### 2.2 AlertLevel

```typescript
/** Alert severity level. Drives color-coding per Kernel Section 7.2. */
export enum AlertLevel {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  WATCH = 'WATCH',
  EXCESS = 'EXCESS',
}
```

### 2.3 ActionType

```typescript
/** Worklist recommended action type. 7 values per Kernel Section 3.2. */
export enum ActionType {
  NEW_PO = 'NEW_PO',
  EXPEDITE_PO = 'EXPEDITE_PO',
  RESHORE = 'RESHORE',
  CANCEL_DEFER = 'CANCEL_DEFER',
  REVIEW_EXCESS = 'REVIEW_EXCESS',
  SET_PARAMETERS = 'SET_PARAMETERS',
  REVIEW_MIN_VIOLATION = 'REVIEW_MIN_VIOLATION',
}
```

### 2.4 WorklistStatus

```typescript
/** Current status of a worklist item. */
export enum WorklistStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DEFERRED = 'DEFERRED',
  ESCALATED = 'ESCALATED',
}
```

### 2.5 SourceNode

```typescript
/** Manufacturing / sourcing node. Color-coded per Kernel Section 7.3. */
export enum SourceNode {
  SCHECO_SHANGHAI = 'SCHECO_SHANGHAI',
  NIXA_MO = 'NIXA_MO',
  SHARK_NZ = 'SHARK_NZ',
}
```

### 2.6 ForecastAlgorithm

```typescript
/** Forecasting algorithm identifier. Maps to SRD Module 1 algorithm assignments. */
export enum ForecastAlgorithm {
  SARIMA = 'SARIMA',
  XGBOOST = 'XGBOOST',
  CROSTONS = 'CROSTONS',
  BSTS = 'BSTS',
  CONTRACT_BACKLOG = 'CONTRACT_BACKLOG',
  HOLT_WINTERS = 'HOLT_WINTERS',
  NAIVE_SEASONAL = 'NAIVE_SEASONAL',
  ENSEMBLE = 'ENSEMBLE',
}
```

### 2.7 ArbitrageRecommendation

```typescript
/** Reshoring arbitrage recommendation outcome. */
export enum ArbitrageRecommendation {
  RESHORE = 'RESHORE',
  DUAL_SOURCE = 'DUAL_SOURCE',
  MAINTAIN_CHINA = 'MAINTAIN_CHINA',
}
```

### 2.8 PipelineState

```typescript
/** Data pipeline health status. */
export enum PipelineState {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  STALE = 'STALE',
  ERROR = 'ERROR',
}
```

### 2.9 ParameterStatus

```typescript
/** Status of inventory parameters for a SKU. Drives badge color per Kernel Section 4.7. */
export enum ParameterStatus {
  /** Parameters have not been configured (gray badge). Springfield's current default. */
  NOT_SET = 'NOT_SET',
  /** Parameters computed by AI system (blue badge). */
  SYSTEM_CALCULATED = 'SYSTEM_CALCULATED',
  /** Buyer has manually overridden system values (green badge). */
  BUYER_OVERRIDE = 'BUYER_OVERRIDE',
  /** System recalculated values; awaiting buyer confirmation (amber badge). */
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}
```

### 2.10 ParameterSource

```typescript
/** Origin of current inventory parameter values. */
export enum ParameterSource {
  NONE = 'NONE',
  SYSTEM_AUTO = 'SYSTEM_AUTO',
  BUYER_MANUAL = 'BUYER_MANUAL',
  EPICOR_IMPORT = 'EPICOR_IMPORT',
}
```

---

## 3. Entity Interfaces

Every interface maps 1:1 to a Kernel Section 3.1 entity. Fields use the enum types defined above (never raw strings). All fields are required unless explicitly marked optional with `?`.

### 3.1 SKU

```typescript
/** A unique part/product in the Springfield Marine catalog. */
export interface SKU {
  /** Unique SKU identifier (primary key) */
  skuId: string;
  /** Springfield part number (e.g., "1100031-1") */
  partNumber: string;
  /** Human-readable part description */
  description: string;
  /** Product family grouping (e.g., "Pedestal Systems", "Seating") */
  productLine: string;
  /** Demand classification assigned by the classification engine */
  demandClass: DemandClass;
  /** Primary sourcing / manufacturing node */
  sourceNode: SourceNode;
  /** Standard unit cost in USD */
  unitCost: Currency;
  /** Unit of measure (e.g., "EA", "PKG") */
  uom: string;
  /** Whether this SKU is currently active in the catalog */
  isActive: boolean;
}
```

### 3.2 DemandHistory

```typescript
/** A single monthly demand observation for a SKU. */
export interface DemandHistory {
  /** FK to SKU */
  skuId: string;
  /** Month of the observation in YYYY-MM format */
  period: DateString;
  /** Units demanded in this period */
  quantity: number;
  /** Revenue generated in this period (USD) */
  revenue: Currency;
}
```

### 3.3 InventoryPosition

```typescript
/** Current point-in-time inventory state for a SKU. */
export interface InventoryPosition {
  /** FK to SKU */
  skuId: string;
  /** Quantity physically on hand in warehouse */
  onHand: number;
  /** Quantity on open purchase orders not yet received */
  onOrder: number;
  /** Quantity allocated to open sales orders */
  allocated: number;
  /** Net available = onHand - allocated */
  available: number;
  /** Estimated days of supply at current demand rate */
  daysOfSupply: number;
  /** Date/time this snapshot was taken (ISO 8601) */
  snapshotDate: string;
}
```

### 3.4 Forecast

```typescript
/** Probabilistic forecast for a SKU in a given future period. */
export interface Forecast {
  /** FK to SKU */
  skuId: string;
  /** Forecast period in YYYY-MM format */
  period: DateString;
  /** Algorithm used to generate this forecast */
  algorithm: ForecastAlgorithm;
  /** Median forecast (50th percentile) */
  p50: number;
  /** 10th percentile — lower bound of 80% prediction interval */
  p10: number;
  /** 90th percentile — upper bound of 80% prediction interval */
  p90: number;
  /** 2.5th percentile — lower bound of 95% prediction interval */
  p2_5: number;
  /** 97.5th percentile — upper bound of 95% prediction interval */
  p97_5: number;
  /** Mean Absolute Percentage Error for this algorithm on this SKU */
  mape: Percentage;
}
```

### 3.5 DemandClassification

```typescript
/** Result of the demand classification engine for a SKU. */
export interface DemandClassification {
  /** FK to SKU */
  skuId: string;
  /** Assigned demand class */
  demandClass: DemandClass;
  /** Primary forecasting algorithm assigned based on demand class */
  algorithmPrimary: ForecastAlgorithm;
  /** Fallback algorithm if primary fails validation */
  algorithmFallback: ForecastAlgorithm;
  /** Coefficient of variation of demand magnitude */
  cvDemand: number;
  /** Coefficient of variation of inter-demand intervals */
  cvInterval: number;
  /** Average monthly demand in units */
  avgMonthlyDemand: number;
  /** ISO 8601 timestamp when classification was last computed */
  classifiedAt: string;
}
```

### 3.6 SafetyStock

```typescript
/** Computed safety stock parameters for a SKU. */
export interface SafetyStock {
  /** FK to SKU */
  skuId: string;
  /** Target cycle service level (e.g., 95 for 95%) */
  targetCsl: Percentage;
  /** Calculated safety stock quantity in units */
  safetyStockQty: number;
  /** Reorder point in units (demand during lead time + safety stock) */
  reorderPoint: number;
  /** Safety stock expressed as days of supply */
  daysOfSupply: number;
}
```

### 3.7 InventoryParameters

```typescript
/** Min/max planning parameters for a SKU. Central to the parameter management page. */
export interface InventoryParameters {
  /** FK to SKU */
  skuId: string;
  /** Minimum inventory level in units. Orders trigger when available < minQty. */
  minQty: number;
  /** Maximum inventory level in units. Excess alerts trigger when onHand > maxQty. */
  maxQty: number;
  /** Safety stock quantity in units */
  safetyStockQty: number;
  /** Reorder point in units */
  reorderPoint: number;
  /** Target cycle service level as percentage (e.g., 95) */
  targetCsl: Percentage;
  /** Total lead time in calendar days for the primary source */
  leadTimeDays: number;
  /** Current status of these parameters */
  parameterStatus: ParameterStatus;
  /** ISO 8601 timestamp of last review/approval. Null if never reviewed. */
  lastReviewedAt: string | null;
  /** Username or identifier of the last reviewer. Null if never reviewed. */
  reviewedBy: string | null;
  /** Origin of current parameter values */
  source: ParameterSource;
}
```

### 3.8 Alert

```typescript
/** An inventory alert raised by the system. */
export interface Alert {
  /** Unique alert identifier */
  alertId: string;
  /** FK to the SKU this alert pertains to */
  skuId: string;
  /** Severity level — drives color-coding and sort priority */
  alertLevel: AlertLevel;
  /** Human-readable description of the condition that triggered this alert */
  triggerCondition: string;
  /** System-generated recommended action text */
  recommendedAction: string;
  /** Estimated calendar days until stock-out at current demand rate. Null for EXCESS alerts. */
  daysToStockout: number | null;
  /** ISO 8601 timestamp when the alert was created */
  createdAt: string;
  /** ISO 8601 timestamp when a buyer acknowledged this alert. Null if unacknowledged. */
  acknowledgedAt: string | null;
}
```

### 3.9 WorklistItem

```typescript
/** A buyer action item in the priority worklist (Action Center). */
export interface WorklistItem {
  /** Unique worklist item identifier */
  itemId: string;
  /** FK to the SKU this action pertains to */
  skuId: string;
  /** Priority rank (1 = highest). Driven by days-to-stockout, revenue impact, BOM criticality. */
  priorityRank: number;
  /** Type of action recommended by the system */
  actionType: ActionType;
  /** Recommended order or adjustment quantity in units */
  recommendedQty: number;
  /** Recommended sourcing node for this action */
  recommendedSource: SourceNode;
  /** Estimated total landed cost for this action in USD */
  estimatedCost: Currency;
  /** Current workflow status */
  status: WorklistStatus;
  /** Model confidence in this recommendation (0-100). Below 70 requires justification modal. */
  confidenceScore: Percentage;
}
```

### 3.10 BomNode

```typescript
/** A node in a Bill of Materials tree. Recursive via children. */
export interface BomNode {
  /** Part number for this BOM component */
  partNumber: string;
  /** Human-readable description */
  description: string;
  /** BOM level depth (0 = finished good, 1 = first-level component, etc.) */
  level: number;
  /** Quantity of this component required per unit of parent */
  qtyPer: number;
  /** Scrap/waste rate as a decimal (e.g., 0.02 for 2%) */
  scrapRate: number;
  /** Manufacturing / sourcing node for this component */
  sourceNode: SourceNode;
  /** Child components. Empty array for leaf nodes (raw materials). */
  children: BomNode[];
  /** Whether this is a phantom/non-stocked sub-assembly */
  isPhantom: boolean;
}
```

### 3.11 ArbitrageResult

```typescript
/** Reshoring cost comparison for a dual-source SKU. */
export interface ArbitrageResult {
  /** FK to SKU */
  skuId: string;
  /** Total landed cost from China source (unit cost + freight + tariff) in USD */
  chinaLandedCost: Currency;
  /** Total domestic cost from Nixa MO (unit cost + overhead) in USD */
  nixaDomesticCost: Currency;
  /** Arbitrage score: (CLC - NDC) / CLC as a percentage. Positive = reshoring favorable. */
  arbitrageScore: Percentage;
  /** System recommendation based on arbitrage score and strategic factors */
  recommendation: ArbitrageRecommendation;
  /** Applicable Section 301 tariff rate as percentage */
  tariffRate: Percentage;
  /** ISO 8601 timestamp when this comparison was last computed */
  computedAt: string;
}
```

### 3.12 LeadTimeSegment

```typescript
/** A single segment in the transpacific lead-time breakdown. */
export interface LeadTimeSegment {
  /** Segment name (e.g., "Factory Production", "Ocean Transit") */
  segmentName: string;
  /** Baseline/expected duration in calendar days */
  baselineDays: number;
  /** Actual measured duration in calendar days */
  actualDays: number;
  /** Variance from baseline in days (positive = longer than expected) */
  variance: number;
  /** Health status of this segment */
  status: PipelineState;
}
```

### 3.13 PipelineStatus

```typescript
/** Health and metrics for a data ingestion pipeline. */
export interface PipelineStatus {
  /** Pipeline name (e.g., "Epicor CDC", "FRED API", "NMMA Feed") */
  pipelineName: string;
  /** ISO 8601 timestamp of the last successful run */
  lastRun: string;
  /** Number of records processed in the last run */
  recordsProcessed: number;
  /** Number of errors encountered in the last run */
  errors: number;
  /** Current health status */
  status: PipelineState;
}
```

### 3.14 ForecastAccuracy

```typescript
/** Model performance metrics for a forecasting algorithm by demand class. */
export interface ForecastAccuracy {
  /** Algorithm being evaluated */
  algorithm: ForecastAlgorithm;
  /** Demand class this metric applies to */
  skuClass: DemandClass;
  /** Mean Absolute Percentage Error */
  mape: Percentage;
  /** Forecast Value Added vs. naive seasonal baseline. Positive = better than naive. */
  fva: Percentage;
  /** Number of SKUs in this evaluation cohort */
  sampleSize: number;
}
```

---

## 4. Implementation Notes

### 4.1 File Location

All types are defined in and exported from a single file:

```
frontend/src/lib/types.ts
```

No other file in the project may define domain entity shapes. Components and hooks import from this file.

### 4.2 DateString Helper

Provide a helper function to construct branded `DateString` values from raw strings:

```typescript
/** Creates a branded DateString. Use for constructing mock data. */
export function toDateString(value: string): DateString {
  return value as DateString;
}
```

### 4.3 Strict Mode Compliance

The file must compile cleanly under TypeScript strict mode (`"strict": true` in `tsconfig.json`). Specifically:

- No `any` types anywhere
- No implicit `any` from missing annotations
- All union members exhaustively handled where applicable
- `null` explicitly annotated on nullable fields (not `undefined`)

### 4.4 No Runtime Dependencies

This file imports nothing. It is pure type definitions and enums (enums compile to JS objects but have no external dependencies). No third-party library types are referenced.

### 4.5 Export Convention

Every enum, interface, utility type, and helper function is individually `export`-ed at declaration site (not via a barrel `export { ... }` block at the bottom). This enables tree-shaking and clear import paths.

---

## 5. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | File exists at `frontend/src/lib/types.ts` | Path check |
| 2 | All 10 enums from Kernel Section 3.2 are exported with exact values | `tsc --noEmit` passes; grep for all enum names |
| 3 | All 14 entity interfaces from Kernel Section 3.1 are exported | grep for all interface names |
| 4 | All 4 utility types (`DateString`, `Currency`, `Percentage`, `TimeSeriesPoint`) plus `DashboardKPI` and `KPITrend` are exported | grep for type/interface names |
| 5 | `toDateString` helper function is exported | grep |
| 6 | No `any` type appears anywhere in the file | `grep 'any' types.ts` returns zero matches |
| 7 | File compiles with `tsc --strict --noEmit` | Zero errors |
| 8 | Every field on every interface has a JSDoc comment | Manual review |
| 9 | Nullable fields use `T \| null` (not optional `?` for fields that can be absent vs. null) | Manual review |
| 10 | Enum-typed fields reference the enum (e.g., `DemandClass`), never `string` | Manual review |
