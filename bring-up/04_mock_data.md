# Spec 04 — Mock Data

**Directory:** `frontend/src/data/`
**Depends on:** Spec 03 (type definitions — all interfaces and enums)
**Kernel ref:** 00_KERNEL.md Section 5 (Demo Data Requirements)

---

## Overview

This spec defines the complete demo dataset for the Springfield Marine demand planning system. Every file in `frontend/src/data/` exports typed constants that conform to the interfaces in `frontend/src/lib/types.ts`. The data uses **real Springfield Marine part numbers, descriptions, and customer IDs** from the Item Master and daily sales files, with constructed data only for features where real data does not exist (forecasts, alerts, BOMs, arbitrage).

All data is static — no randomization, no generators. Every value is a deterministic constant that produces the same demo experience on every load.

---

## 1. File Organization

```
frontend/src/data/
  skus.ts                  # 50 real part numbers spanning all demand classes
  demand-history.ts        # 24 months of monthly demand per SKU
  inventory.ts             # Current inventory positions
  forecasts.ts             # 26-week forward forecasts with prediction intervals
  classifications.ts       # Demand class assignments with CV calculations
  safety-stock.ts          # Safety stock and reorder points
  inventory-parameters.ts  # Min/max parameters with status distribution
  alerts.ts                # 10 active alerts across all severity levels
  worklist.ts              # 20 active worklist items
  bom.ts                   # 4 BOM trees
  arbitrage.ts             # 12 dual-source parts with CLC/NDC breakdowns
  lead-times.ts            # Transpacific segment breakdowns
  pipeline.ts              # Data pipeline health status
  dashboard-kpis.ts        # KPI data using real revenue/inventory figures
  forecast-accuracy.ts     # Model performance metrics by algorithm × demand class
  customers.ts             # Top customers with revenue and tier
  index.ts                 # Barrel export
```

Each file exports a single named constant array (or object where noted). The export name follows the pattern `MOCK_<DOMAIN>` (e.g., `MOCK_SKUS`, `MOCK_ALERTS`).

---

## 2. SKU Catalog — `skus.ts`

**Export:** `MOCK_SKUS: readonly SKU[]`
**Count:** 50 SKUs

### 2.1 Selection Criteria

Select 50 real part numbers from the Item Master that collectively satisfy:

| Dimension | Requirement | Target |
|-----------|-------------|--------|
| DemandClass | All 5 classes represented | SMOOTH_FAST: 20, ERRATIC: 10, INTERMITTENT: 10, NEW_COLD_START: 5, DEFENSE_CONTRACT: 5 |
| ClassID | FG, CM, RM all represented | FG: ~25, CM: ~15, RM: ~10 |
| TypeCode | Purchased and Manufactured | P: ~30 (60%), M: ~20 (40%) |
| SourceNode | All 3 nodes | SCHECO: ~30 (60%), NIXA: ~15 (30%), SHARK_NZ: ~5 (10%) |
| CommercialBrand | Both brands | Springfield Marine: ~45 (90%), Shark Seating: ~5 (10%) |
| Product families | All major families | Pedestal Systems, Seating, Components, Raw Materials, Accessories |
| Channel | Both prefixes | Retail (1xxxxxx) and OEM (3xxxxxx) |
| Tariff exposure | Some flagged | At least 8-10 parts with HTS 9903.88.15 |

### 2.2 Required Part Numbers

The following specific parts MUST be included (they are referenced by name in other data files and BOM trees):

#### High-Volume Finished Goods (SMOOTH_FAST, FG)

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `3100531-L1` | PLUG-IN PKG 2-3/8 LOCKING | Pedestal Systems | SCHECO_SHANGHAI | High-volume OEM pedestal package |
| `W1040623` | ECONOMY FOLDING SEAT - WHITE | Seating | SCHECO_SHANGHAI | Walmart SKU, top retail volume |
| `3300750-A1` | TAPER-LOCK PKG 2-3/8 ADJ 22-28 | Pedestal Systems | SCHECO_SHANGHAI | Top OEM Taper-Lock package |
| `1040620` | ECONOMY FOLDING SEAT - CHARCOAL | Seating | SCHECO_SHANGHAI | High-volume retail seat |
| `3100520-L1` | PLUG-IN PKG 2-7/8 LOCKING | Pedestal Systems | SCHECO_SHANGHAI | Large diameter Plug-In package |
| `1250100` | 2-3/8 PEDESTAL PKG STANDARD | Pedestal Systems | SCHECO_SHANGHAI | Entry-level pedestal package |
| `1061200` | SKIPPER DELUXE FOLDING SEAT | Seating | SCHECO_SHANGHAI | Mid-range folding seat |

#### Key Components (SMOOTH_FAST or ERRATIC, CM)

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `1100031-1` | TRAC-LOCK SWIVEL LOCKING | Components | NIXA_MO | Shared component across 4+ pedestal systems |
| `1641019` | SPRING-LOCK BASE - ROUND | Components | NIXA_MO | Frequently ordered component |
| `1100027` | TRAC-LOCK SWIVEL NON-LOCKING | Components | NIXA_MO | Non-locking variant |
| `1600113` | TAPER-LOCK BUSHING 2-3/8 | Components | NIXA_MO | Cross-system connector |
| `1560200` | ECONOMY POST 13 IN | Components | SCHECO_SHANGHAI | Budget pedestal post |

#### OEM / Retail Pairs

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `1041030` | FISH PRO 1 FOLDING SEAT | Seating | SCHECO_SHANGHAI | Retail premium folding seat |
| `3041030` | FISH PRO 1 FOLDING SEAT OEM | Seating | SCHECO_SHANGHAI | OEM variant of same product |

#### Erratic Demand

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `1042030` | WHEELHOUSE XL HELM SEAT | Seating | SCHECO_SHANGHAI | Premium helm seat, lumpy orders |
| `1270100` | 4 IN POWER-RISE PEDESTAL PKG | Pedestal Systems | SCHECO_SHANGHAI | Premium 4" electric pedestal |
| `1800210` | TELESCOPING LADDER 3-STEP SS316 | Accessories | SCHECO_SHANGHAI | Seasonal accessory |
| `1941010` | MARINE KETTLE GRILL ROUND | Accessories | SCHECO_SHANGHAI | Grill, weather-driven demand |

#### Intermittent / Lumpy

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `1081030` | BAR STOOL PADDED - WHITE | Seating | SCHECO_SHANGHAI | Specialty low-volume |
| `1780200` | MOTOR MOUNT BRACKET HEAVY DUTY | Accessories | NIXA_MO | Intermittent aftermarket |
| `5100031` | TRAC-LOCK SWIVEL REPAIR KIT | Components | NIXA_MO | Repair/service SKU |
| `1840010` | OARLOCK ZINC DIE-CAST | Accessories | NIXA_MO | Low-volume hardware |

#### New / Cold Start

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `1043080` | PRO FISHING SPEED SEAT 2025 | Seating | SCHECO_SHANGHAI | New 2025 launch |
| `1271001` | 4 IN ELECTRIC PEDESTAL 2025 | Pedestal Systems | NIXA_MO | New electric pedestal |
| `1660350` | TABLE PEDESTAL STOWABLE 30IN | Accessories | SCHECO_SHANGHAI | New table variant |

#### Defense / Contract (Shark Seating)

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `SH-FLEX-100` | SHARK FLEX SUSPENSION MODULE | Shark Seating | SHARK_NZ | Core Shark product |
| `SH-FLEXHD-200` | SHARK FLEX-HD HEAVY DUTY MODULE | Shark Seating | SHARK_NZ | Heavy-duty variant |
| `SH-FLEXPOD-300` | SHARK FLEXPOD COMPACT SUSPENSION | Shark Seating | SHARK_NZ | Compact variant |
| `SH-TRAX-400` | SHARK TRAX RAIL MOUNT SYSTEM | Shark Seating | SHARK_NZ | Rail mounting system |
| `SH-LUXE-500` | SHARK LUXE PREMIUM SEAT | Shark Seating | SHARK_NZ | Premium seat |

#### Raw Materials (RM)

| partNumber | description | productLine | sourceNode | Rationale |
|-----------|-------------|-------------|------------|-----------|
| `RM-AL6061-T6` | ALUMINUM EXTRUSION 6061-T6 | Raw Materials | NIXA_MO | Primary aluminum stock |
| `RM-SS316-ROD` | STAINLESS STEEL 316 ROD STOCK | Raw Materials | NIXA_MO | Ladder/hardware material |
| `RM-VINYL-BLK` | MARINE VINYL BLACK 54IN ROLL | Raw Materials | SCHECO_SHANGHAI | Upholstery material |
| `RM-FOAM-HD` | HIGH DENSITY FOAM BLOCK 4IN | Raw Materials | SCHECO_SHANGHAI | Seat cushion material |
| `RM-HDPE-SHEET` | HDPE BEARING SHEET 0.25IN | Raw Materials | NIXA_MO | Slide bearing material |
| `RM-BUSHING-NYL` | NYLON BUSHING BLANK 2-3/8 | Raw Materials | NIXA_MO | Taper-Lock bushing blank |

#### Additional Parts to Fill Target (selected for realism)

| partNumber | description | productLine | sourceNode | demandClass |
|-----------|-------------|-------------|------------|-------------|
| `1610100` | TAPER-LOCK POST 24IN ANODIZED | Pedestal Systems | SCHECO_SHANGHAI | SMOOTH_FAST |
| `1300520` | PLUG-IN POST 2-7/8 28IN | Pedestal Systems | SCHECO_SHANGHAI | SMOOTH_FAST |
| `3061200` | SKIPPER DELUXE FOLDING SEAT OEM | Seating | SCHECO_SHANGHAI | SMOOTH_FAST |
| `1250200` | 2-3/8 PEDESTAL PKG W/SLIDE | Pedestal Systems | SCHECO_SHANGHAI | SMOOTH_FAST |
| `1062010` | NEWPORT MOLDED SEAT SHELL | Seating | NIXA_MO | SMOOTH_FAST |
| `1100025` | SEAT SLIDE 13IN LOCKING | Components | NIXA_MO | ERRATIC_HIGH_VARIANCE |
| `1580100` | FOOTREST ALUMINUM ANODIZED | Accessories | NIXA_MO | ERRATIC_HIGH_VARIANCE |
| `1670200` | TABLE TOP OVAL 18X30 | Accessories | SCHECO_SHANGHAI | ERRATIC_HIGH_VARIANCE |
| `1690100` | TABLE PKG THREAD-LOCK ROUND | Accessories | SCHECO_SHANGHAI | ERRATIC_HIGH_VARIANCE |
| `1841050` | STERN HANDLE SS316 | Accessories | SCHECO_SHANGHAI | INTERMITTENT_LUMPY |
| `1790100` | THREAD-LOCK BASE SURFACE MNT | Components | NIXA_MO | INTERMITTENT_LUMPY |
| `7040620` | ECONOMY SEAT COVER - CHARCOAL | Accessories | SCHECO_SHANGHAI | INTERMITTENT_LUMPY |
| `1043050` | SPORT BUCKET FLIP-UP SEAT | Seating | SCHECO_SHANGHAI | NEW_COLD_START |

### 2.3 Field Mapping

| SKU Field | Source | Notes |
|-----------|--------|-------|
| `skuId` | Same as `partNumber` | Use part number as the unique ID |
| `partNumber` | Item Master `PartNum` | Exact part number from data |
| `description` | Item Master `PartDescription` | Real description, uppercase |
| `productLine` | Item Master `Product_Family_c` | One of: Pedestal Systems, Seating, Components, Raw Materials, Accessories, Shark Seating |
| `demandClass` | Assigned per selection table above | Must match the classification in `classifications.ts` |
| `sourceNode` | Assigned per rules | P + HTS 9903.88.15 = SCHECO; M = NIXA; Shark = SHARK_NZ |
| `unitCost` | Item Master `Std Cost` | Real cost or realistic estimate. Range: $0.50 (hardware) to $350 (helm seats) |
| `uom` | `"EA"` for most; `"FT"` or `"ROLL"` for raw materials | |
| `isActive` | `true` for all 50 | Demo catalog contains only active parts |

---

## 3. Demand History — `demand-history.ts`

**Export:** `MOCK_DEMAND_HISTORY: readonly DemandHistory[]`
**Count:** 50 SKUs x 24 months = 1,200 records

### 3.1 Time Range

Periods: `2024-04` through `2026-03` (24 months ending current month)

### 3.2 Seasonal Patterns

All SMOOTH_FAST and ERRATIC SKUs must exhibit:

| Month | Seasonal Index | Description |
|-------|---------------|-------------|
| January | 0.70 | Post-holiday trough |
| February | 0.85 | Early pre-season orders begin |
| March | 1.40 | **Peak** — OEM pre-season build |
| April | 1.25 | Strong spring demand |
| May | 1.45 | **Peak** — boat season launch |
| June | 1.15 | Steady summer |
| July | 1.05 | Summer leveling |
| August | 0.90 | Late summer decline |
| September | 0.65 | **Trough** — season wind-down |
| October | 0.75 | Modest fall orders |
| November | 0.80 | Some OEM pre-orders |
| December | 0.55 | **Trough** — holiday slowdown |

### 3.3 Demand Patterns by Class

| DemandClass | Pattern | Monthly Qty Range (typical) | CV Target |
|-------------|---------|---------------------------|-----------|
| SMOOTH_FAST | Consistent monthly demand with seasonal modulation. No zero months. | 50-2,000+ depending on SKU | < 0.50 |
| ERRATIC_HIGH_VARIANCE | Volatile month-to-month swings. Occasional 3x-5x spikes. No consistent trend. | 10-500 with large variance | 0.50-1.00 |
| INTERMITTENT_LUMPY | Many zero months (8-16 out of 24). When demand occurs, it comes in large lumps. | 0 or 20-200 | > 1.00 (magnitude); long gaps |
| NEW_COLD_START | Only 3-6 months of history (starts in late 2025 or early 2026). Ramp-up pattern. | 5-50 initial, growing | Insufficient data for CV |
| DEFENSE_CONTRACT | Quarterly lumps matching contract delivery schedules. 0 in non-delivery months. | 0 or 50-150 per quarter | N/A (contract-driven) |

### 3.4 Revenue Calculation

`revenue = quantity * unitPrice` where `unitPrice` is derived from `unitCost / (1 - 0.451)` to achieve the real 45.1% median gross margin. Revenue across all 50 SKUs over 12 months should approximate a **proportional share of $31.5M annual revenue** — the 50 demo SKUs should collectively represent roughly $8-12M/year (they are selected from high-volume parts).

### 3.5 Specific Data Points

The following demand history values are pinned for cross-reference consistency:

| SKU | 2026-03 Qty | Notes |
|-----|-------------|-------|
| `1100031-1` | 850 | High — shared component demand |
| `3100531-L1` | 420 | Strong OEM package |
| `W1040623` | 1,200 | Walmart high-volume |
| `SH-FLEX-100` | 0 | No March delivery (contract quarterly) |
| `1043080` | 35 | New product, 3rd month |

---

## 4. Inventory Positions — `inventory.ts`

**Export:** `MOCK_INVENTORY: readonly InventoryPosition[]`
**Count:** 50 records (one per SKU)

### 4.1 Snapshot Date

All records use `snapshotDate: "2026-04-01T06:00:00Z"` (beginning of current month).

### 4.2 Value Targets

Total `onHand * unitCost` across all 50 SKUs must approximate **$1.5-2.5M** (proportional share of the real $6.5M total across 2,700+ active parts).

### 4.3 Position Rules

| Field | Derivation |
|-------|------------|
| `onHand` | Set per SKU to create the desired alert conditions. Range: 0 to 5,000 |
| `onOrder` | Non-zero for ~60% of SKUs. Represents open POs. 0 for Nixa-manufactured parts without pending jobs |
| `allocated` | Non-zero for ~40% of SKUs. Represents committed orders. Always ≤ onHand |
| `available` | `onHand - allocated`. Can be negative if over-allocated |
| `daysOfSupply` | `available / avgDailyDemand`. Where `avgDailyDemand = avgMonthlyDemand / 30` |

### 4.4 Alert-Driving Positions

These specific inventory positions MUST create the alert conditions defined in Section 8:

| SKU | onHand | Condition Created |
|-----|--------|-------------------|
| `1100031-1` | 120 | Below min (min=200) — CRITICAL, 4 days to stockout |
| `3100531-L1` | 45 | Below min (min=100) — CRITICAL, 3 days to stockout |
| `1041030` | 180 | Below reorder point — WARNING |
| `1610100` | 85 | Below reorder point — WARNING |
| `W1040623` | 350 | In transit delay — WARNING (predictive) |
| `1042030` | 520 | Above max (max=400) — EXCESS |
| `1270100` | 180 | Above max (max=120) — EXCESS |
| `1062010` | 200 | Approaching min — WATCH |
| `1250200` | 150 | Approaching min — WATCH |

---

## 5. Forecasts — `forecasts.ts`

**Export:** `MOCK_FORECASTS: readonly Forecast[]`
**Count:** 50 SKUs x 7 months (26 weeks ≈ 6.5 months, round to 7) = 350 records

### 5.1 Forecast Period Range

Periods: `2026-04` through `2026-10` (7 months forward from current date)

### 5.2 Algorithm Assignment

Each SKU's forecast uses the `algorithmPrimary` from its classification record:

| DemandClass | Algorithm | MAPE Range |
|-------------|-----------|------------|
| SMOOTH_FAST | SARIMA (15 SKUs), XGBOOST (3 SKUs), ENSEMBLE (2 SKUs) | 8-15% |
| ERRATIC_HIGH_VARIANCE | XGBOOST (7 SKUs), ENSEMBLE (3 SKUs) | 20-35% |
| INTERMITTENT_LUMPY | CROSTONS (10 SKUs) | 30-50% |
| NEW_COLD_START | BSTS (5 SKUs) | 25-40% |
| DEFENSE_CONTRACT | CONTRACT_BACKLOG (5 SKUs) | 5-10% |

### 5.3 Prediction Intervals

Intervals widen with MAPE and forecast horizon:

```
For each forecast period at horizon h (months from now, 1-7):
  width_factor = 1 + (h - 1) * 0.15
  
  p10 = p50 * (1 - 0.30 * mape/100 * width_factor)
  p90 = p50 * (1 + 0.30 * mape/100 * width_factor)
  p2_5 = p50 * (1 - 0.50 * mape/100 * width_factor)
  p97_5 = p50 * (1 + 0.50 * mape/100 * width_factor)
```

All values must be floored at 0 (no negative forecasts). Round to integers.

### 5.4 Ensemble Trigger SKUs

The following SKUs must use `ENSEMBLE` algorithm (where SARIMA and XGBOOST disagree by >15%):

- `1250100` — SMOOTH_FAST, ensemble triggered by post-pandemic demand shift
- `1040620` — SMOOTH_FAST, ensemble triggered by channel mix change
- `1100025` — ERRATIC_HIGH_VARIANCE, ensemble triggered by high variance
- `1670200` — ERRATIC_HIGH_VARIANCE, ensemble triggered by sporadic OEM orders
- `1690100` — ERRATIC_HIGH_VARIANCE, ensemble triggered by seasonal pattern shift

---

## 6. Classifications — `classifications.ts`

**Export:** `MOCK_CLASSIFICATIONS: readonly DemandClassification[]`
**Count:** 50 records (one per SKU)

### 6.1 Classification Mapping

Every SKU must have a classification record. The `demandClass` field must match the value in the SKU record.

| DemandClass | algorithmPrimary | algorithmFallback | cvDemand Range | cvInterval Range | avgMonthlyDemand Range |
|-------------|-----------------|-------------------|---------------|-----------------|----------------------|
| SMOOTH_FAST | SARIMA or XGBOOST or ENSEMBLE | HOLT_WINTERS | 0.15-0.45 | 0.05-0.20 | 50-2,000 |
| ERRATIC_HIGH_VARIANCE | XGBOOST or ENSEMBLE | SARIMA | 0.50-0.95 | 0.20-0.60 | 15-300 |
| INTERMITTENT_LUMPY | CROSTONS | NAIVE_SEASONAL | 1.10-2.50 | 1.50-3.00 | 5-80 |
| NEW_COLD_START | BSTS | NAIVE_SEASONAL | N/A (set to 0) | N/A (set to 0) | 10-40 |
| DEFENSE_CONTRACT | CONTRACT_BACKLOG | NAIVE_SEASONAL | 0.80-1.20 | 2.00-4.00 | 30-100 |

### 6.2 Timestamp

All records: `classifiedAt: "2026-03-15T08:00:00Z"` (most recent weekly classification run).

---

## 7. Safety Stock — `safety-stock.ts`

**Export:** `MOCK_SAFETY_STOCK: readonly SafetyStock[]`
**Count:** 50 records (one per SKU)

### 7.1 Target CSL by Demand Class

| DemandClass | targetCsl | Rationale |
|-------------|-----------|-----------|
| SMOOTH_FAST | 95 | Standard high-fill target |
| ERRATIC_HIGH_VARIANCE | 90 | Lower target due to forecast uncertainty |
| INTERMITTENT_LUMPY | 85 | Minimum viable service level |
| NEW_COLD_START | 90 | Moderate — uncertain demand |
| DEFENSE_CONTRACT | 98 | Contract compliance requirement |

### 7.2 Calculation Logic

```
safetyStockQty = z(targetCsl) * σ_demand * sqrt(leadTimeDays / 30)

where:
  z(95) = 1.645, z(90) = 1.282, z(85) = 1.036, z(98) = 2.054
  σ_demand = avgMonthlyDemand * cvDemand
  leadTimeDays: SCHECO = 60-75, NIXA = 7-12, SHARK_NZ = 45-55

reorderPoint = (avgMonthlyDemand / 30) * leadTimeDays + safetyStockQty
daysOfSupply = safetyStockQty / (avgMonthlyDemand / 30)
```

Values must be rounded to integers. All must satisfy: `safetyStockQty > 0` for non-NEW_COLD_START SKUs.

---

## 8. Inventory Parameters — `inventory-parameters.ts`

**Export:** `MOCK_INVENTORY_PARAMETERS: readonly InventoryParameters[]`
**Count:** 50 records (one per SKU)

### 8.1 Status Distribution

| ParameterStatus | Count | Percentage | Selection Logic |
|----------------|-------|------------|-----------------|
| NOT_SET | 20 | 40% | All NEW_COLD_START (5) + selected INTERMITTENT (5) + selected ERRATIC (5) + 5 misc | 
| SYSTEM_CALCULATED | 15 | 30% | Majority of SMOOTH_FAST SKUs |
| BUYER_OVERRIDE | 10 | 20% | High-volume FG and key components reviewed by buyers |
| NEEDS_REVIEW | 5 | 10% | SKUs where system recalculated values differ >20% from prior |

### 8.2 NOT_SET Records

For ParameterStatus.NOT_SET:

```typescript
{
  minQty: 0,
  maxQty: 0,
  safetyStockQty: 0,
  reorderPoint: 0,
  targetCsl: 0,
  leadTimeDays: 0,   // Or the known lead time if available
  parameterStatus: ParameterStatus.NOT_SET,
  lastReviewedAt: null,
  reviewedBy: null,
  source: ParameterSource.NONE,
}
```

### 8.3 SYSTEM_CALCULATED Records

Use the computed values from `safety-stock.ts`:

```typescript
{
  minQty: safetyStockQty,          // min = safety stock
  maxQty: reorderPoint * 2,        // max = 2x reorder point (simplified EOQ)
  safetyStockQty: <from safety-stock>,
  reorderPoint: <from safety-stock>,
  targetCsl: <from safety-stock>,
  leadTimeDays: <from source node>,
  parameterStatus: ParameterStatus.SYSTEM_CALCULATED,
  lastReviewedAt: null,
  reviewedBy: null,
  source: ParameterSource.SYSTEM_AUTO,
}
```

### 8.4 BUYER_OVERRIDE Records

Buyer-adjusted values that differ from system calculation by 10-30%:

```typescript
{
  minQty: <system min * 0.8-1.2>,   // Buyer adjusted
  maxQty: <system max * 0.9-1.3>,
  safetyStockQty: <adjusted>,
  reorderPoint: <adjusted>,
  targetCsl: <same or adjusted>,
  leadTimeDays: <same>,
  parameterStatus: ParameterStatus.BUYER_OVERRIDE,
  lastReviewedAt: "2026-03-20T14:30:00Z",  // Within last 2 weeks
  reviewedBy: "STEVES" | "MCLOYD" | "KFLOYD",
  source: ParameterSource.BUYER_MANUAL,
}
```

Buyer assignment: STEVES (82% of overrides), MCLOYD and KFLOYD share the rest.

### 8.5 NEEDS_REVIEW Records

System recalculated, awaiting confirmation. Show `lastReviewedAt` from the prior review and `source: ParameterSource.SYSTEM_AUTO`:

```typescript
{
  // New system-calculated values (differ >20% from prior)
  parameterStatus: ParameterStatus.NEEDS_REVIEW,
  lastReviewedAt: "2026-02-10T09:00:00Z",  // Prior review date (stale)
  reviewedBy: "STEVES",                      // Last reviewer
  source: ParameterSource.SYSTEM_AUTO,
}
```

### 8.6 Violation Constraints

These constraints must hold across `inventory.ts` and `inventory-parameters.ts`:

| Condition | Required Count | SKUs |
|-----------|---------------|------|
| `onHand < minQty` (below min) | At least 5 | `1100031-1`, `3100531-L1`, `1041030`, `1610100`, `1061200` |
| `onHand > maxQty` (above max) | At least 3 | `1042030`, `1270100`, `1670200` |
| Internal consistency: `safetyStockQty ≤ minQty < reorderPoint < maxQty` | All SYSTEM_CALCULATED and BUYER_OVERRIDE records | — |
| `leadTimeDays` matches source node | All records with non-zero lead time | SCHECO: 45-90, NIXA: 5-15, SHARK_NZ: 30-60 |

---

## 9. Alerts — `alerts.ts`

**Export:** `MOCK_ALERTS: readonly Alert[]`
**Count:** 10 alerts

### 9.1 Alert Inventory

| alertId | skuId | alertLevel | triggerCondition | recommendedAction | daysToStockout |
|---------|-------|------------|------------------|-------------------|----------------|
| `ALT-001` | `1100031-1` | CRITICAL | On-hand (120) below min (200). Demand rate 28/day depletes stock in 4 days. | Expedite PO #4521 from Nixa. Expected receipt in 5 days. | 4 |
| `ALT-002` | `3100531-L1` | CRITICAL | On-hand (45) below min (100). Demand rate 14/day depletes stock in 3 days. | Place emergency PO with SCHECO Shanghai. Air freight option: +$2.40/unit. | 3 |
| `ALT-003` | `1041030` | WARNING | On-hand (180) below reorder point (250). Lead time 65 days from SCHECO. | Place standard PO for 500 units. Estimated landed cost $8,750. | 18 |
| `ALT-004` | `1610100` | WARNING | On-hand (85) below reorder point (120). 12 days of supply remaining. | Place PO for 300 units from SCHECO. Combine with pending shipment. | 12 |
| `ALT-005` | `W1040623` | WARNING | In-transit shipment delayed. Container SCHECO-2026-0389 ETA slipped 12 days (port congestion Ningbo). | Options: (1) Air freight 500 units, (2) Partial fill from safety stock, (3) Notify Walmart of delay. | 22 |
| `ALT-006` | `1062010` | WATCH | On-hand (200) approaching min (180). 15 days of supply at current rate. | Monitor. PO #4498 arriving in 8 days (250 units). | 15 |
| `ALT-007` | `1250200` | WATCH | On-hand (150) at 1.1x min (135). Seasonal demand increase expected in May. | Review forecast. Consider advancing PO by 2 weeks. | 25 |
| `ALT-008` | `SH-FLEX-100` | WATCH | Contract delivery Q2-2026 (75 units) due in 45 days. On-hand (30) plus on-order (60) may be tight. | Confirm Shark NZ shipment status. Buffer = 15 units. | 45 |
| `ALT-009` | `1042030` | EXCESS | On-hand (520) exceeds max (400) by 30%. $39,000 in excess inventory. | Review demand forecast. Consider deferring next PO or offering promo pricing. | null |
| `ALT-010` | `1270100` | EXCESS | On-hand (180) exceeds max (120) by 50%. $31,500 in excess inventory. Slow-moving premium product. | Cancel or defer PO #4505 (100 units). Reallocate working capital. | null |

### 9.2 Timestamps

- `createdAt`: Staggered over the past 7 days. CRITICAL alerts are newest (within 24 hours). EXCESS alerts are oldest (5-7 days ago).
- `acknowledgedAt`: `null` for all (unacknowledged — drives notification badge count).

---

## 10. Worklist — `worklist.ts`

**Export:** `MOCK_WORKLIST: readonly WorklistItem[]`
**Count:** 20 items

### 10.1 Action Type Distribution

| ActionType | Count | Description |
|------------|-------|-------------|
| NEW_PO | 6 | Standard purchase order recommendations |
| EXPEDITE_PO | 3 | Rush existing POs |
| RESHORE | 3 | Shift sourcing from China to Nixa |
| CANCEL_DEFER | 2 | Cancel or defer POs for excess inventory |
| REVIEW_EXCESS | 2 | Investigate excess inventory positions |
| SET_PARAMETERS | 2 | Configure min/max for NOT_SET SKUs |
| REVIEW_MIN_VIOLATION | 2 | Address inventory below minimum |

### 10.2 Worklist Items

Priority rank 1 = most urgent. All items `status: WorklistStatus.PENDING`.

| itemId | skuId | priorityRank | actionType | recommendedQty | recommendedSource | estimatedCost | confidenceScore |
|--------|-------|-------------|------------|----------------|-------------------|---------------|-----------------|
| `WL-001` | `1100031-1` | 1 | EXPEDITE_PO | 500 | NIXA_MO | $4,250 | 95 |
| `WL-002` | `3100531-L1` | 2 | NEW_PO | 800 | SCHECO_SHANGHAI | $14,400 | 92 |
| `WL-003` | `W1040623` | 3 | EXPEDITE_PO | 500 | SCHECO_SHANGHAI | $6,500 | 88 |
| `WL-004` | `1041030` | 4 | NEW_PO | 500 | SCHECO_SHANGHAI | $8,750 | 91 |
| `WL-005` | `1610100` | 5 | NEW_PO | 300 | SCHECO_SHANGHAI | $3,600 | 87 |
| `WL-006` | `3300750-A1` | 6 | RESHORE | 200 | NIXA_MO | $5,800 | 78 |
| `WL-007` | `1560200` | 7 | NEW_PO | 1,000 | SCHECO_SHANGHAI | $4,500 | 93 |
| `WL-008` | `1250100` | 8 | RESHORE | 400 | NIXA_MO | $7,200 | 72 |
| `WL-009` | `1061200` | 9 | REVIEW_MIN_VIOLATION | 0 | NIXA_MO | $0 | 85 |
| `WL-010` | `1100027` | 10 | NEW_PO | 300 | NIXA_MO | $2,550 | 90 |
| `WL-011` | `SH-FLEX-100` | 11 | EXPEDITE_PO | 75 | SHARK_NZ | $18,750 | 96 |
| `WL-012` | `1042030` | 12 | CANCEL_DEFER | 100 | SCHECO_SHANGHAI | $0 | 82 |
| `WL-013` | `1270100` | 13 | REVIEW_EXCESS | 0 | SCHECO_SHANGHAI | $0 | 76 |
| `WL-014` | `1300520` | 14 | NEW_PO | 250 | SCHECO_SHANGHAI | $4,750 | 89 |
| `WL-015` | `1600113` | 15 | RESHORE | 600 | NIXA_MO | $3,000 | 68 |
| `WL-016` | `1043080` | 16 | SET_PARAMETERS | 0 | SCHECO_SHANGHAI | $0 | 62 |
| `WL-017` | `1271001` | 17 | SET_PARAMETERS | 0 | NIXA_MO | $0 | 58 |
| `WL-018` | `1670200` | 18 | CANCEL_DEFER | 50 | SCHECO_SHANGHAI | $0 | 80 |
| `WL-019` | `1100031-1` | 19 | REVIEW_MIN_VIOLATION | 0 | NIXA_MO | $0 | 88 |
| `WL-020` | `1840010` | 20 | NEW_PO | 200 | NIXA_MO | $1,200 | 55 |

### 10.3 Confidence Score Rules

- Scores range 55-96
- At least 2 items below 70% (items `WL-016` at 62, `WL-017` at 58, `WL-020` at 55) — these trigger the justification modal per Kernel Section 4.1
- EXPEDITE and RESHORE actions tend toward 70-96 range
- SET_PARAMETERS actions are lower confidence (58-68) because they are new recommendations without historical validation

---

## 11. BOM Trees — `bom.ts`

**Export:** `MOCK_BOMS: readonly BomNode[]`
**Count:** 4 top-level BOM trees

### 11.1 BOM 1: Plug-In 2-3/8 Locking Package

```
3100531-L1  PLUG-IN PKG 2-3/8 LOCKING (FG, L0)
├── 1100031-1  TRAC-LOCK SWIVEL LOCKING (CM, L1) qty:1 scrap:0.01 NIXA_MO
├── 1300520-POST  PLUG-IN POST 2-3/8 24IN (CM, L1) qty:1 scrap:0.02 SCHECO_SHANGHAI
│   ├── RM-AL6061-T6  ALUMINUM EXTRUSION 6061-T6 (RM, L2) qty:2.2ft scrap:0.05 NIXA_MO
│   └── RM-BUSHING-NYL  NYLON BUSHING BLANK 2-3/8 (RM, L2) qty:2 scrap:0.03 NIXA_MO
├── 1641019  SPRING-LOCK BASE - ROUND (CM, L1) qty:1 scrap:0.01 NIXA_MO
│   ├── RM-AL6061-T6  ALUMINUM EXTRUSION 6061-T6 (RM, L2) qty:1.5ft scrap:0.04 NIXA_MO
│   └── RM-SS316-ROD  STAINLESS STEEL 316 ROD STOCK (RM, L2) qty:0.3ft scrap:0.02 NIXA_MO
└── PHANTOM-HW-KIT-01  HARDWARE KIT SS (phantom, CM, L1) qty:1 scrap:0.00 NIXA_MO [isPhantom=true]
    ├── HW-BOLT-SS-025  SS BOLT 1/4-20 X 1IN (RM, L2) qty:4 scrap:0.05 SCHECO_SHANGHAI
    └── HW-NUT-SS-025  SS NYLOCK NUT 1/4-20 (RM, L2) qty:4 scrap:0.05 SCHECO_SHANGHAI
```

### 11.2 BOM 2: Taper-Lock 2-3/8 Adjustable Package

```
3300750-A1  TAPER-LOCK PKG 2-3/8 ADJ 22-28 (FG, L0)
├── 1100031-1  TRAC-LOCK SWIVEL LOCKING (CM, L1) qty:1 scrap:0.01 NIXA_MO  [shared with BOM 1]
├── 1610100  TAPER-LOCK POST 24IN ANODIZED (CM, L1) qty:1 scrap:0.02 SCHECO_SHANGHAI
│   ├── RM-AL6061-T6  ALUMINUM EXTRUSION 6061-T6 (RM, L2) qty:2.5ft scrap:0.05 NIXA_MO
│   └── 1600113  TAPER-LOCK BUSHING 2-3/8 (CM, L2) qty:1 scrap:0.02 NIXA_MO
│       └── RM-BUSHING-NYL  NYLON BUSHING BLANK 2-3/8 (RM, L3) qty:1 scrap:0.08 NIXA_MO
└── 1641019  SPRING-LOCK BASE - ROUND (CM, L1) qty:1 scrap:0.01 NIXA_MO  [shared with BOM 1]
    ├── RM-AL6061-T6  ALUMINUM EXTRUSION 6061-T6 (RM, L2) qty:1.5ft scrap:0.04 NIXA_MO
    └── RM-SS316-ROD  STAINLESS STEEL 316 ROD STOCK (RM, L2) qty:0.3ft scrap:0.02 NIXA_MO
```

### 11.3 BOM 3: Economy Pedestal Package

```
1250100  2-3/8 PEDESTAL PKG STANDARD (FG, L0)
├── 1100027  TRAC-LOCK SWIVEL NON-LOCKING (CM, L1) qty:1 scrap:0.01 NIXA_MO
├── 1560200  ECONOMY POST 13 IN (CM, L1) qty:1 scrap:0.03 SCHECO_SHANGHAI
│   └── RM-AL6061-T6  ALUMINUM EXTRUSION 6061-T6 (RM, L2) qty:1.4ft scrap:0.05 NIXA_MO
└── ECO-BASE-RND  ECONOMY BASE ROUND PLASTIC (CM, L1) qty:1 scrap:0.02 SCHECO_SHANGHAI
    └── RM-HDPE-SHEET  HDPE BEARING SHEET 0.25IN (RM, L2) qty:0.5sqft scrap:0.10 NIXA_MO
```

### 11.4 BOM 4: Fish Pro 1 Folding Seat

```
1041030  FISH PRO 1 FOLDING SEAT (FG, L0)
├── FRAME-FP1  INJECTION MOLDED FRAME FISH PRO 1 (CM, L1) qty:1 scrap:0.01 SCHECO_SHANGHAI
├── CUSH-FP1-SET  CUSHION SET FISH PRO 1 (phantom, CM, L1) qty:1 scrap:0.00 SCHECO_SHANGHAI [isPhantom=true]
│   ├── RM-VINYL-BLK  MARINE VINYL BLACK 54IN ROLL (RM, L2) qty:3.5sqft scrap:0.08 SCHECO_SHANGHAI
│   └── RM-FOAM-HD  HIGH DENSITY FOAM BLOCK 4IN (RM, L2) qty:1 scrap:0.05 SCHECO_SHANGHAI
└── HW-PIVOT-SET  PIVOT HINGE SET SS (CM, L1) qty:1 scrap:0.02 SCHECO_SHANGHAI
```

### 11.5 BOM Notes

- `1100031-1` (Trac-Lock swivel) appears in BOM 1 and BOM 2 as a shared component — this demonstrates dependent demand aggregation
- `1641019` (Spring-Lock base) also shared between BOM 1 and BOM 2
- `RM-AL6061-T6` (aluminum extrusion) appears in BOMs 1, 2, and 3 — the highest-commonality raw material
- `PHANTOM-HW-KIT-01` and `CUSH-FP1-SET` are phantom assemblies (`isPhantom: true`) — not stocked independently
- BOM-only part numbers (`PHANTOM-HW-KIT-01`, `ECO-BASE-RND`, `FRAME-FP1`, `CUSH-FP1-SET`, `HW-PIVOT-SET`, `HW-BOLT-SS-025`, `HW-NUT-SS-025`, `1300520-POST`) do NOT need to exist in `MOCK_SKUS` — they are BOM-internal parts. The BomNode interface is self-contained with its own `partNumber` and `description`.
- All parts that DO appear in `MOCK_SKUS` (`1100031-1`, `1641019`, `1600113`, `1560200`, `1100027`, `RM-AL6061-T6`, `RM-SS316-ROD`, `RM-BUSHING-NYL`, `RM-HDPE-SHEET`, `RM-VINYL-BLK`, `RM-FOAM-HD`, `1610100`, `3100531-L1`, `3300750-A1`, `1250100`, `1041030`) must use the same `partNumber` and `description` as their SKU record.

---

## 12. Arbitrage — `arbitrage.ts`

**Export:** `MOCK_ARBITRAGE: readonly ArbitrageResult[]`
**Count:** 12 records

### 12.1 Selection

Select 12 purchased parts (TypeCode P) with HTS 9903.88.15 tariff exposure. These are parts currently sourced from SCHECO Shanghai that could potentially be reshored to Nixa.

### 12.2 Cost Breakdown Construction

Starting from the real `Std Cost` (which is the China landed cost), construct:

```
chinaLandedCost (CLC) = unitCost  (the current Std Cost IS the landed cost)

CLC breakdown (for reference, not stored):
  - Factory cost: 35% of CLC
  - Ocean freight: 12% of CLC
  - Section 301 tariff: 25% of CLC  (HTS 9903.88.15 rate)
  - Insurance + customs: 3% of CLC
  - Drayage + last mile: 5% of CLC
  - Overhead/margin: 20% of CLC

nixaDomesticCost (NDC) varies by recommendation:
  - RESHORE:         NDC = CLC * 0.75-0.90  (domestic is cheaper)
  - DUAL_SOURCE:     NDC = CLC * 0.95-1.05  (roughly equivalent)
  - MAINTAIN_CHINA:  NDC = CLC * 1.10-1.30  (domestic is more expensive)

tariffRate = 95  (current Section 301 + base rate for HTS 9903.88.15)

arbitrageScore = ((CLC - NDC) / CLC) * 100
  - Positive = reshoring favorable
  - Negative = China still cheaper
```

### 12.3 Arbitrage Records

| skuId | unitCost (CLC) | NDC (approx) | arbitrageScore | recommendation |
|-------|---------------|--------------|----------------|----------------|
| `3100531-L1` | $18.00 | $15.30 | +15% | RESHORE |
| `3300750-A1` | $22.50 | $19.58 | +13% | RESHORE |
| `3100520-L1` | $25.00 | $21.25 | +15% | RESHORE |
| `W1040623` | $13.00 | $12.48 | +4% | DUAL_SOURCE |
| `1040620` | $12.50 | $12.25 | +2% | DUAL_SOURCE |
| `1041030` | $17.50 | $17.15 | +2% | DUAL_SOURCE |
| `1560200` | $4.50 | $4.59 | -2% | DUAL_SOURCE |
| `1061200` | $16.00 | $16.80 | -5% | MAINTAIN_CHINA |
| `1042030` | $75.00 | $86.25 | -15% | MAINTAIN_CHINA |
| `1270100` | $175.00 | $210.00 | -20% | MAINTAIN_CHINA |
| `1800210` | $32.00 | $38.40 | -20% | MAINTAIN_CHINA |
| `1941010` | $28.00 | $30.80 | -10% | MAINTAIN_CHINA |

### 12.4 Tariff Projection Data

**Additional export:** `MOCK_TARIFF_PROJECTION: readonly TariffProjectionPoint[]`

Define a supplementary type (or use a simple object array) for the 3-year tariff roadmap:

```typescript
export interface TariffProjectionPoint {
  year: number;
  tariffRate: Percentage;
  reshoreCount: number;      // Cumulative SKUs reshored
  projectedSavings: Currency; // Cumulative avoided tariff + freight
}
```

| year | tariffRate | reshoreCount | projectedSavings |
|------|-----------|-------------|-----------------|
| 2026 | 95 | 3 | $125,000 |
| 2027 | 110 | 7 | $420,000 |
| 2028 | 140 | 12 | $890,000 |

`computedAt` for all records: `"2026-04-01T00:00:00Z"`

---

## 13. Lead Times — `lead-times.ts`

**Export:** `MOCK_LEAD_TIME_SEGMENTS: readonly LeadTimeSegment[]`
**Count:** 6 segments (transpacific route from SCHECO Shanghai to Springfield MO)

### 13.1 Segment Breakdown

| segmentName | baselineDays | actualDays | variance | status |
|-------------|-------------|------------|----------|--------|
| Factory Production | 14 | 16 | +2 | HEALTHY |
| Inland Transport (Shanghai) | 3 | 3 | 0 | HEALTHY |
| Ocean Transit (Shanghai → Long Beach) | 18 | 22 | +4 | DEGRADED |
| Port Clearance & Customs | 5 | 7 | +2 | DEGRADED |
| Rail/Truck (Long Beach → Springfield MO) | 7 | 8 | +1 | HEALTHY |
| Receiving & QC | 3 | 3 | 0 | HEALTHY |
| **Total** | **50** | **59** | **+9** | — |

### 13.2 Additional Exports

**`MOCK_NIXA_LEAD_TIME: readonly LeadTimeSegment[]`** — Domestic route (3 segments):

| segmentName | baselineDays | actualDays | variance | status |
|-------------|-------------|------------|----------|--------|
| Production Queue | 3 | 4 | +1 | HEALTHY |
| Manufacturing | 5 | 5 | 0 | HEALTHY |
| Internal Transfer | 1 | 1 | 0 | HEALTHY |
| **Total** | **9** | **10** | **+1** | — |

**`MOCK_SHARK_LEAD_TIME: readonly LeadTimeSegment[]`** — NZ route (4 segments):

| segmentName | baselineDays | actualDays | variance | status |
|-------------|-------------|------------|----------|--------|
| Factory Production (NZ) | 10 | 10 | 0 | HEALTHY |
| Ocean Transit (Auckland → Long Beach) | 22 | 24 | +2 | HEALTHY |
| Customs & Inland | 8 | 10 | +2 | DEGRADED |
| Receiving & QC | 3 | 3 | 0 | HEALTHY |
| **Total** | **43** | **47** | **+4** | — |

---

## 14. Pipeline Status — `pipeline.ts`

**Export:** `MOCK_PIPELINE_STATUS: readonly PipelineStatus[]`
**Count:** 8 pipelines

| pipelineName | lastRun | recordsProcessed | errors | status |
|-------------|---------|-------------------|--------|--------|
| Epicor CDC — Sales Orders | 2026-04-03T05:30:00Z | 1,247 | 0 | HEALTHY |
| Epicor CDC — Inventory Snapshot | 2026-04-01T06:00:00Z | 2,718 | 3 | HEALTHY |
| Epicor CDC — Item Master Sync | 2026-03-31T22:00:00Z | 5,678 | 12 | HEALTHY |
| Epicor CDC — PO Receipts | 2026-04-02T18:00:00Z | 89 | 0 | HEALTHY |
| FRED Economic Indicators | 2026-04-01T08:00:00Z | 14 | 0 | HEALTHY |
| NMMA Boat Registration Feed | 2026-03-15T12:00:00Z | 0 | 0 | STALE |
| SCFI Freight Index | 2026-04-02T00:00:00Z | 52 | 1 | DEGRADED |
| Demand Classification Engine | 2026-03-15T08:00:00Z | 2,102 | 0 | HEALTHY |

Notes:
- NMMA feed is STALE (18 days since last update — monthly feed that didn't arrive)
- SCFI is DEGRADED (1 error in latest pull — partial data)
- All Epicor feeds are HEALTHY

---

## 15. Dashboard KPIs — `dashboard-kpis.ts`

**Export:** `MOCK_DASHBOARD_KPIS: readonly DashboardKPI[]`

### 15.1 Fill Rate Dashboard

| label | value | trend | target |
|-------|-------|-------|--------|
| Current Fill Rate | 72.3% | { direction: 'up', delta: '+2.3%', favorable: true } | 85% |
| Lines Shipped Complete | 4,821 / 6,668 | { direction: 'up', delta: '+180', favorable: true } | — |
| Critical Stockouts | 2 | { direction: 'down', delta: '-1', favorable: true } | 0 |
| Avg Days to Resolve | 4.2 days | { direction: 'down', delta: '-0.8', favorable: true } | < 3 days |

### 15.2 Inventory Health Dashboard

| label | value | trend | target |
|-------|-------|-------|--------|
| Total Inventory Value | $6.5M | { direction: 'down', delta: '-$0.3M', favorable: true } | $5.5M |
| Days of Supply (Avg) | 45 days | { direction: 'down', delta: '-3', favorable: true } | 30 days |
| Excess Inventory | $820K | { direction: 'up', delta: '+$90K', favorable: false } | < $500K |
| SKUs Below Min | 18 | { direction: 'up', delta: '+3', favorable: false } | 0 |
| SKUs Above Max | 12 | { direction: 'flat', delta: '0', favorable: true } | 0 |
| Parameters Not Set | 40% | { direction: 'down', delta: '-5%', favorable: true } | 0% |

### 15.3 Lead Time Dashboard

| label | value | trend | target |
|-------|-------|-------|--------|
| Avg Lead Time (SCHECO) | 59 days | { direction: 'up', delta: '+4 days', favorable: false } | 50 days |
| Avg Lead Time (Nixa) | 10 days | { direction: 'flat', delta: '0', favorable: true } | 9 days |
| On-Time Delivery Rate | 78% | { direction: 'down', delta: '-3%', favorable: false } | 95% |
| In-Transit Shipments | 14 | { direction: 'flat', delta: '0', favorable: true } | — |

### 15.4 Reshoring Dashboard

| label | value | trend | target |
|-------|-------|-------|--------|
| China:US Sourcing Ratio | 60:40 | { direction: 'flat', delta: '0', favorable: true } | 40:60 |
| SKUs Reshored (YTD) | 3 | { direction: 'up', delta: '+1', favorable: true } | 12 by EOY |
| Tariff Exposure | $1.8M/yr | { direction: 'down', delta: '-$120K', favorable: true } | < $800K |
| Projected Annual Savings | $125K | { direction: 'up', delta: '+$45K', favorable: true } | $500K |

### 15.5 Revenue & Margin

| label | value | trend | target |
|-------|-------|-------|--------|
| Revenue (TTM) | $31.5M | { direction: 'up', delta: '+$1.2M', favorable: true } | $35M |
| Gross Margin | 45.1% | { direction: 'flat', delta: '+0.2%', favorable: true } | 48% |
| Inventory Turnover | 2.0x | { direction: 'up', delta: '+0.1x', favorable: true } | 3.5x |

### 15.6 Time-Series KPI Exports

**Additional export:** `MOCK_FILL_RATE_TREND: readonly TimeSeriesPoint[]` — 12 months of fill rate

| period | value |
|--------|-------|
| 2025-04 | 68.0 |
| 2025-05 | 67.5 |
| 2025-06 | 69.2 |
| 2025-07 | 70.0 |
| 2025-08 | 69.8 |
| 2025-09 | 68.5 |
| 2025-10 | 69.0 |
| 2025-11 | 70.5 |
| 2025-12 | 69.0 |
| 2026-01 | 70.8 |
| 2026-02 | 71.5 |
| 2026-03 | 72.3 |

**Additional export:** `MOCK_INVENTORY_VALUE_TREND: readonly TimeSeriesPoint[]` — 12 months

| period | value (millions) |
|--------|-----------------|
| 2025-04 | 7.2 |
| 2025-05 | 7.0 |
| 2025-06 | 6.9 |
| 2025-07 | 6.8 |
| 2025-08 | 7.1 |
| 2025-09 | 7.0 |
| 2025-10 | 6.8 |
| 2025-11 | 6.6 |
| 2025-12 | 6.9 |
| 2026-01 | 6.7 |
| 2026-02 | 6.6 |
| 2026-03 | 6.5 |

**Additional export:** `MOCK_RESHORING_RATIO_TREND: readonly TimeSeriesPoint[]` — 12 months (value = domestic %)

| period | value |
|--------|-------|
| 2025-04 | 37 |
| 2025-05 | 37 |
| 2025-06 | 38 |
| 2025-07 | 38 |
| 2025-08 | 38 |
| 2025-09 | 39 |
| 2025-10 | 39 |
| 2025-11 | 39 |
| 2025-12 | 40 |
| 2026-01 | 40 |
| 2026-02 | 40 |
| 2026-03 | 40 |

---

## 16. Forecast Accuracy — `forecast-accuracy.ts`

**Export:** `MOCK_FORECAST_ACCURACY: readonly ForecastAccuracy[]`
**Count:** 20 records (5 algorithms x 4 applicable demand classes, not all combos exist)

### 16.1 Accuracy Matrix

| algorithm | skuClass | mape | fva | sampleSize |
|-----------|----------|------|-----|------------|
| SARIMA | SMOOTH_FAST | 11.2 | +8.5 | 15 |
| SARIMA | ERRATIC_HIGH_VARIANCE | 28.4 | +4.2 | 5 |
| XGBOOST | SMOOTH_FAST | 12.8 | +6.9 | 15 |
| XGBOOST | ERRATIC_HIGH_VARIANCE | 24.1 | +9.6 | 8 |
| CROSTONS | INTERMITTENT_LUMPY | 38.5 | +12.3 | 10 |
| CROSTONS | ERRATIC_HIGH_VARIANCE | 35.2 | +3.8 | 3 |
| BSTS | NEW_COLD_START | 32.0 | +15.1 | 5 |
| BSTS | SMOOTH_FAST | 14.5 | +5.2 | 8 |
| CONTRACT_BACKLOG | DEFENSE_CONTRACT | 6.8 | +22.4 | 5 |
| HOLT_WINTERS | SMOOTH_FAST | 13.1 | +6.6 | 12 |
| HOLT_WINTERS | ERRATIC_HIGH_VARIANCE | 30.2 | +2.1 | 6 |
| NAIVE_SEASONAL | SMOOTH_FAST | 19.7 | 0.0 | 20 |
| NAIVE_SEASONAL | ERRATIC_HIGH_VARIANCE | 33.7 | 0.0 | 10 |
| NAIVE_SEASONAL | INTERMITTENT_LUMPY | 50.8 | 0.0 | 10 |
| NAIVE_SEASONAL | NEW_COLD_START | 47.1 | 0.0 | 5 |
| NAIVE_SEASONAL | DEFENSE_CONTRACT | 29.2 | 0.0 | 5 |
| ENSEMBLE | SMOOTH_FAST | 9.8 | +9.9 | 2 |
| ENSEMBLE | ERRATIC_HIGH_VARIANCE | 22.5 | +11.2 | 3 |

Notes:
- `NAIVE_SEASONAL` always has `fva: 0` — it IS the baseline
- `ENSEMBLE` has the best MAPE in each class where it is used
- FVA is always positive for non-naive algorithms (all beat the baseline)
- `CONTRACT_BACKLOG` has the lowest MAPE (6.8%) — contract data provides high certainty

---

## 17. Customers — `customers.ts`

**Export:** `MOCK_CUSTOMERS: readonly Customer[]`

Define a supplementary interface:

```typescript
export interface Customer {
  customerId: string;
  name: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  annualRevenue: Currency;
  revenueShare: Percentage;
  segment: 'OEM' | 'DISTRIBUTOR' | 'AFTERMARKET' | 'DEFENSE';
}
```

**Count:** 10 customers

| customerId | name | tier | annualRevenue | revenueShare | segment |
|-----------|------|------|---------------|-------------|---------|
| TRA100 | Tracker Marine (Bass Pro) | PLATINUM | $6,174,000 | 19.6 | OEM |
| WAL001 | Walmart | PLATINUM | $3,150,000 | 10.0 | DISTRIBUTOR |
| LAN110 | Lund Boats | GOLD | $2,205,000 | 7.0 | OEM |
| YAM100 | Yamaha Marine | GOLD | $1,890,000 | 6.0 | OEM |
| RAN100 | Ranger Boats | GOLD | $1,575,000 | 5.0 | OEM |
| MAV100 | Maverick Boat Group | SILVER | $945,000 | 3.0 | OEM |
| WM200 | West Marine | SILVER | $787,500 | 2.5 | DISTRIBUTOR |
| CDN100 | Canadian Tire Marine | SILVER | $630,000 | 2.0 | DISTRIBUTOR |
| NZN100 | NZ Navy / Coastguard | BRONZE | $472,500 | 1.5 | DEFENSE |
| AFT100 | Aftermarket Direct | BRONZE | $315,000 | 1.0 | AFTERMARKET |

Note: Top 10 customers represent ~57.6% of revenue. Remaining 412 customers share the other 42.4% (long tail of small dealers, boat builders, and service shops).

---

## 18. Barrel Export — `index.ts`

**Export:** Re-exports everything from all data files.

```typescript
// frontend/src/data/index.ts

export { MOCK_SKUS } from './skus';
export { MOCK_DEMAND_HISTORY } from './demand-history';
export { MOCK_INVENTORY } from './inventory';
export { MOCK_FORECASTS } from './forecasts';
export { MOCK_CLASSIFICATIONS } from './classifications';
export { MOCK_SAFETY_STOCK } from './safety-stock';
export { MOCK_INVENTORY_PARAMETERS } from './inventory-parameters';
export { MOCK_ALERTS } from './alerts';
export { MOCK_WORKLIST } from './worklist';
export { MOCK_BOMS } from './bom';
export { MOCK_ARBITRAGE, MOCK_TARIFF_PROJECTION } from './arbitrage';
export { MOCK_LEAD_TIME_SEGMENTS, MOCK_NIXA_LEAD_TIME, MOCK_SHARK_LEAD_TIME } from './lead-times';
export { MOCK_PIPELINE_STATUS } from './pipeline';
export {
  MOCK_DASHBOARD_KPIS,
  MOCK_FILL_RATE_TREND,
  MOCK_INVENTORY_VALUE_TREND,
  MOCK_RESHORING_RATIO_TREND,
} from './dashboard-kpis';
export { MOCK_FORECAST_ACCURACY } from './forecast-accuracy';
export { MOCK_CUSTOMERS } from './customers';
```

---

## 19. Cross-Reference Consistency Rules

These invariants MUST hold across all data files. Violation of any rule is a build-blocking defect.

| # | Rule | Verification |
|---|------|-------------|
| 1 | Every `skuId` in `MOCK_DEMAND_HISTORY`, `MOCK_INVENTORY`, `MOCK_FORECASTS`, `MOCK_CLASSIFICATIONS`, `MOCK_SAFETY_STOCK`, `MOCK_INVENTORY_PARAMETERS` exists in `MOCK_SKUS` | Set comparison |
| 2 | Every `skuId` in `MOCK_ALERTS` exists in `MOCK_SKUS` | Set comparison |
| 3 | Every `skuId` in `MOCK_WORKLIST` exists in `MOCK_SKUS` | Set comparison |
| 4 | Every `skuId` in `MOCK_ARBITRAGE` exists in `MOCK_SKUS` | Set comparison |
| 5 | `DemandClass` in each SKU record matches the `demandClass` in the corresponding `MOCK_CLASSIFICATIONS` record | Field comparison |
| 6 | `algorithmPrimary` in `MOCK_CLASSIFICATIONS` matches the `algorithm` in corresponding `MOCK_FORECASTS` records | Field comparison |
| 7 | BOM nodes that reference parts in `MOCK_SKUS` use identical `partNumber` and `description` | String match |
| 8 | Alert-driving inventory positions (Section 4.4) are consistent with alert trigger conditions (Section 9) | Manual cross-check |
| 9 | `available = onHand - allocated` for every `MOCK_INVENTORY` record | Arithmetic check |
| 10 | For SYSTEM_CALCULATED and BUYER_OVERRIDE parameters: `safetyStockQty ≤ minQty < reorderPoint < maxQty` | Inequality check |
| 11 | `MOCK_DEMAND_HISTORY` has exactly 24 records per SKU (one per month) except NEW_COLD_START (3-6 records) | Count check |
| 12 | `MOCK_FORECASTS` has exactly 7 records per SKU (one per month, Apr-Oct 2026) | Count check |
| 13 | Every `MOCK_WORKLIST` item with non-zero `recommendedQty` has a positive `estimatedCost` | Field check |
| 14 | Worklist items with `actionType` of SET_PARAMETERS or REVIEW_MIN_VIOLATION or REVIEW_EXCESS have `recommendedQty: 0` and `estimatedCost: 0` | Field check |
| 15 | All `sourceNode` values in SKU records are consistent with assigned lead time ranges | Range check |

---

## 20. Supplementary Types

These types are needed for data files but are not in the Kernel domain model. Define them in the respective data files (not in `types.ts`):

### 20.1 TariffProjectionPoint (in `arbitrage.ts`)

```typescript
export interface TariffProjectionPoint {
  year: number;
  tariffRate: Percentage;
  reshoreCount: number;
  projectedSavings: Currency;
}
```

### 20.2 Customer (in `customers.ts`)

```typescript
export interface Customer {
  customerId: string;
  name: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  annualRevenue: Currency;
  revenueShare: Percentage;
  segment: 'OEM' | 'DISTRIBUTOR' | 'AFTERMARKET' | 'DEFENSE';
}
```

---

## 21. Implementation Notes

### 21.1 `as const` and `readonly`

All exported arrays should use `as const satisfies readonly T[]` pattern for maximum type safety:

```typescript
import type { SKU } from '../lib/types';

export const MOCK_SKUS = [
  {
    skuId: '1100031-1',
    partNumber: '1100031-1',
    // ...
  },
  // ...
] as const satisfies readonly SKU[];
```

### 21.2 DateString Construction

Use the `toDateString` helper from `types.ts` for all period fields:

```typescript
import { toDateString } from '../lib/types';

// In demand history:
{ skuId: '1100031-1', period: toDateString('2024-04'), quantity: 780, revenue: 11115.60 },
```

### 21.3 No Randomization

Every value is a literal constant. No `Math.random()`, no date-based calculations, no generators. The data must be identical on every import.

### 21.4 File Size Guidance

The largest files will be `demand-history.ts` (~1,200 records) and `forecasts.ts` (~350 records). Keep individual record objects compact (single-line where possible) to manage file length. Use comments only for section headers, not per-record.

---

## 22. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | All 17 files exist in `frontend/src/data/` | `ls` check |
| 2 | All files compile with `tsc --strict --noEmit` | Zero errors |
| 3 | `MOCK_SKUS` contains exactly 50 records | Array length check |
| 4 | All 5 `DemandClass` values are represented in SKU catalog | Set check |
| 5 | All 3 `SourceNode` values are represented | Set check |
| 6 | TypeCode split is approximately 60:40 P:M (via sourceNode proxy) | Count check |
| 7 | `MOCK_DEMAND_HISTORY` contains 1,170-1,200 records (50 SKUs x ~24 months, NEW_COLD_START has fewer) | Count range check |
| 8 | `MOCK_FORECASTS` contains exactly 350 records | Count check |
| 9 | `MOCK_ALERTS` contains exactly 10 records with distribution: 2 CRITICAL, 3 WARNING, 3 WATCH, 2 EXCESS | Count + level check |
| 10 | `MOCK_WORKLIST` contains exactly 20 records, all PENDING status | Count + status check |
| 11 | `MOCK_BOMS` contains exactly 4 top-level trees | Array length check |
| 12 | `MOCK_ARBITRAGE` contains exactly 12 records | Count check |
| 13 | All 19 cross-reference rules (Section 19) pass | Automated validation |
| 14 | `ParameterStatus` distribution: ~40% NOT_SET, ~30% SYSTEM_CALCULATED, ~20% BUYER_OVERRIDE, ~10% NEEDS_REVIEW | Count check |
| 15 | At least 5 SKUs below min, at least 3 above max | Inventory vs. parameters comparison |
| 16 | Total inventory value is in $1.5-2.5M range | Sum(onHand * unitCost) |
| 17 | Seasonal demand patterns visible (March/May peaks, Sep/Dec troughs) | Chart visual inspection |
| 18 | Barrel export (`index.ts`) re-exports all named exports | Import check |
| 19 | No `any` types, no `Math.random()`, no dynamic values | grep check |
| 20 | All supplementary types (`TariffProjectionPoint`, `Customer`) are defined and exported from their respective data files | Import check |
