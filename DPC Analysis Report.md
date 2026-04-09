# DPC Forecasting Engagement: Pre-Analysis Assessment
## Prepared April 8, 2026

---

# EXECUTIVE SUMMARY

DPC (Diversified Plastics Corporation) is a tier 2 EPS/EPP foam manufacturer in Nixa, Missouri (~$16-17M revenue, ~300 employees, woman-owned, ISO-certified). They serve automotive (~82% of volume), ICF/building construction, medical cold-chain coolers, and packaging markets. Their primary automotive customers include GM/NAO (33% of shipments), Magna Seating, YFAI Frenchtown, Dexsys/Magna, and Techniplas.

**They want to extend their forecast horizon from 6 weeks to 16 weeks** to stabilize production planning and procurement -- particularly after losing a $4.2M GM program due to inability to anticipate EV market shifts.

**Our assessment: We are at approximately 10-15% of the data needed to build a credible forecasting system.** The two files received (a forward-looking shipping line-up and a BOM export) are useful structural assets, but the critical inputs -- historical sales data, IHS Global forecasts, and operational parameters -- have not yet arrived. Before proceeding with any modeling, we need to go back to DPC with a structured data request.

---

# 1. WHAT DPC TOLD US THEY WANTED

From the conversation and notes, DPC's needs break into five areas:

| Priority | Need | Who Owns It |
|----------|------|-------------|
| 1 | Extend forecast horizon from 6 to 16 weeks | Tiffany (forecaster) |
| 2 | Resolve "inventory hell" -- 100% inaccuracy, 20+ hrs/week manual data work | Tiffany + Operations |
| 3 | Integrate IHS Global automotive forecasts into demand planning | Tiffany + Sales |
| 4 | Set min-max inventory levels across 100% of stock (only 15.8% covered today) | Tiffany |
| 5 | Capacity planning for growth from $16M to $28-32M theoretical max | Leadership (Earl, Tiffany) |

**Key context:** Tiffany is a single forecaster who achieved 0.2% aggregate forecast bias last year using manual spreadsheet methods. She is highly competent. The goal is NOT to replace her judgment but to extend her reach and give her better tools.

---

# 2. WHAT THEY PROMISED TO SEND vs. WHAT WE RECEIVED

| # | Promised Item | Status | What We Got | Gap Severity |
|---|--------------|--------|-------------|-------------|
| 1 | Historical sales data | WRONG DATA TYPE | Forward-looking shipping line-up (860 scheduled shipments, Apr 2026 - Mar 2027). This is an order book, NOT historical actuals. Tiffany has ~5 years of manually extracted product-level sales data that was not sent. | **CRITICAL** |
| 2 | BOM data | RECEIVED | 1,567 BOM lines mapping 523 finished goods to 209 raw materials. Usable. | Low |
| 3 | IHS Global Forecast (next 6 months) | NOT RECEIVED | Tiffany said she'd message the IHS admin. Nothing arrived. | **CRITICAL** |
| 4 | EDI information & customer pool | PARTIALLY | Shipping line-up has some EDI-adjacent fields but not the actual 830 planning schedules or release history. | HIGH |

---

# 3. WHAT THE DATA WE HAVE TELLS US

## 3A. Shipping Line-Up (860 records, Sheet 1)

This is DPC's **forward order book** -- scheduled shipments from EDI customer releases.

- **33 customers, 133 unique parts** across the order book
- **Date range:** Jul 2025 - Mar 2027, bulk is Apr-Dec 2026
- **Volume taper is EDI visibility decay, not declining demand:** Apr 2026 peaks at 357K units / 231 shipments, tapering to Mar 2027 at 30K units / 6 shipments. Customers only release firm orders a few months ahead.
- **Heavy customer concentration:**
  - GM/NAO: 283 shipments (~33%)
  - Magna Seating: 96 (~11%)
  - YFAI Frenchtown: 91 (~11%)
  - Dexsys/Magna: 49 (~6%)
  - Top 5 customers = ~66% of shipments
- **Segment breakdown by volume:**
  - Automotive: 701 shipments, 1.1M units (~82%)
  - Packaging: 58 shipments, 209K units (~7%)
  - Medical/Specialty: 13 shipments, 90K units (~1.5%)
  - Building/ICF: 13 shipments, 1.2K units (~1.5%)
  - Other/Unclassified: remainder
- **Product mix is heavily automotive OEM foam:** bumper cores (GM C1UG, C1UL, C1YX, E2UL, Ford H567), jack stows, tire supports, EPP inserts (V363), VW brackets, quarter panel foams, kick plates, door energy absorbers

## 3B. BOM / Bill of Materials (1,567 lines, Sheet 1 of File 2)

This is a solid structural asset for MRP explosion.

- **523 parent parts (finished goods)** consume **209 unique raw materials**
- **Average ~3 material lines per finished good** (seems low for molded foam -- may warrant verification)
- **ClassIDs (product categories):**
  - ESPF: 1,002 BOM lines (EPS Packaging/Foam -- the catch-all)
  - ESIF: 461 lines (EPS ICF Foam)
  - ESAF: 68 lines (EPS Automotive Foam)
  - ESAS: 27 lines (EPS Automotive Structural)
  - ESPS: 9 lines (EPS Packaging/Specialty)
  - *Note: No ClassID legend was provided -- these are our best guesses*
- **Most-used raw materials:**
  - Black strapping: used in 295 products
  - Pre-expanded EPS for Packaging: 221 products
  - VBoard Rollguard Black: 104 products
  - Pre-expanded EPS for ICF: 93 products
  - Stretch Film: 83 products
- **Key insight:** High commonality of base materials means material-level demand forecasts will be much more accurate than part-level forecasts due to aggregation (portfolio effect). This is the mathematical foundation for procurement planning.

## 3C. Inventory Snapshot (300 items, Sheet 2)

Confirms DPC's self-described "inventory hell."

- **32 out of 300 items (10.7%) have NEGATIVE on-hand quantities** -- impossible in reality, confirming system data is unreliable
- **Two warehouses:** LOWER (200 items -- likely finished goods), MATERIAL (100 items -- raw materials)
- **Notable negative balances include critical raw materials:**
  - Pre-expanded EPS (Epsilyte): -33,053 LB
  - Hanwha EPP resin (HB38): -1,206 LB
  - Black strapping: -7,023 FT
  - Stretch film: -3,950 FT
  - Multiple ICF web components: -48,208 to -16,038 EA
- **Root causes (from conversation):** Shipments recorded without matching production receipts, BOM backflushing errors, "fake jobs" for month-end reconciliation, manual journal entries

---

# 4. CURRENT MARKET RISKS AFFECTING DPC

## 4A. Tariff Environment (as of April 2026)

| Factor | Impact on DPC |
|--------|--------------|
| 25% Section 232 tariff on imported auto parts | **Positive** -- DPC manufactures domestically, competing against Mexican/Chinese foam molders who now face this tariff |
| 15% reciprocal tariff on South Korean imports | **Negative** -- DPC sources EPP resin from Hanwha (Korea). This is a direct raw material cost increase on their highest-value input |
| NA production volume decline (4.5-7% for 2026) | **Negative** -- Reduces total foam part demand across all programs |
| $30B total tariff cost added to auto industry | **Mixed** -- Suppresses production but drives reshoring, which benefits domestic suppliers |

**Net assessment:** Tariffs are a competitive positioning advantage but a margin compression risk. The critical question is whether DPC has contractual raw material cost adjustment clauses that allow passing the 15% Hanwha resin tariff through to customers.

## 4B. EV Market Trajectory

- GM took $6-7.1B in EV writedowns in Q4 2025/Jan 2026
- GM Factory Zero idled March 16 - April 13, 2026 (RIGHT NOW)
- Federal EV tax credit ended Sept 30, 2025; GM EV sales dropped 43% in Q4
- **Net for DPC:** EV slowdown is actually short-term positive -- preserves ICE production volumes where DPC has established programs. Long-term, EVs still need bumper foam, but battery thermal management uses different materials (polyurethane, silicone foam, PCMs) that are outside DPC's current capabilities.

## 4C. Key Customer Risks

| Customer | % of DPC | Risk Level | Status |
|----------|----------|------------|--------|
| GM/NAO | ~33% | MODERATE | ICE programs strong; reshoring crossover production from Mexico = potential new opportunity. $4.2M EV loss already realized. |
| Magna Seating | ~11% | LOW-MODERATE | S&P revised credit outlook to NEGATIVE. Not in distress, but under margin pressure. |
| YFAI Frenchtown | ~11% | ELEVATED | Chinese-owned, actively shrinking US footprint. Romulus MI: 192 layoffs Jan 2026. Riverside KS: closed, 444 jobs lost. Programs through consolidating plants are at risk. |
| Techniplas | ~5% | LOW | Operational, divesting non-core assets (sold Brazil unit). |
| Slate Automotive | New prospect | HIGH risk / HIGH reward | Bezos-backed EV startup, 150K+ reservations, targeting late 2026 production in Warsaw, IN. No EV startup has hit initial timelines. Don't invest capacity ahead of confirmed orders. |

---

# 5. WHAT METRICS SHOULD THE FORECASTING TARGET?

Before going deeper into analysis, we need DPC to confirm which metrics matter most to them. Based on the conversation, we believe the primary forecasting outputs should be:

## Tier 1: Core Deliverables (what they explicitly asked for)

| Metric | Stakeholder | Granularity | Horizon |
|--------|-------------|-------------|---------|
| **Unit Demand Forecast by Part Family** | Tiffany / Plant Mgr | Weekly (wks 1-6), Monthly (wks 7-16) | 16 weeks rolling |
| **Raw Material Consumption Forecast** | Procurement | Weekly | 16 weeks, derived from demand x BOM |
| **Min/Max Safety Stock Levels** for all 209 raw materials | Procurement / Tiffany | Updated monthly | Based on demand patterns + lead times |
| **Capacity Utilization Forecast** by machine/press | Plant Mgr | Weekly | 16 weeks |

## Tier 2: Strategic Metrics (implied by conversation pain points)

| Metric | Stakeholder | Why |
|--------|-------------|-----|
| **Revenue Forecast by Segment** (Auto / ICF / Packaging / Medical) | CEO/CFO | Customer concentration risk visibility; currently 82% automotive |
| **IHS Variance Monitor** -- flag when S&P Global revises any DPC-relevant platform by >10% | Sales / Tiffany | Early warning system to prevent another $4.2M loss |
| **Customer Order Rate Anomaly Detection** -- flag when any customer's order rate drops >15% for 3 consecutive weeks | Sales / Tiffany | Pattern recognition that Tiffany can't manually watch for 33 customers |
| **Program Lifecycle Dashboard** -- SOP/EOP dates, replacement program status | Sales | Every automotive program has a death date; track them proactively |
| **Booking-to-Forecast Ratio** by customer | Sales Director | Accountability metric: is the forecast aligned with actual orders? |

## Tier 3: Operational Improvement Metrics (from "inventory hell" pain point)

| Metric | Stakeholder | Why |
|--------|-------------|-----|
| **Forecast Accuracy (WAPE)** at product family level, measured monthly | Tiffany | You can't improve what you don't measure. The 0.2% bias number is aggregate; we need to see accuracy at the level where decisions are made. |
| **Inventory Days-on-Hand** by material class | Procurement | Currently meaningless due to data inaccuracy. The forecast creates the target; cycle counting validates it. |
| **ABC-Classified Cycle Count Program** | Operations | Replace the monthly 45-minute plant shutdown / 1,400-page manual snapshot with continuous counting |

---

# 6. HOW THE ANALYSIS WOULD BE DONE: METHODOLOGY

## 6A. Who Are the Experts?

The most respected voices in automotive demand forecasting and the methods they've developed:

### Industry Forecasting Authorities
- **Jeff Schuster** -- President, Americas Operations, LMC Automotive. 20+ years, widely quoted in media. One of the most recognized voices in automotive forecasting.
- **Sam Fiorani** -- VP, Global Vehicle Forecasting, AutoForecast Solutions. Detailed model-level production forecasts and supply chain disruption analysis.
- **Mark Fulthorpe** -- Executive Director, Global Production Forecasting, S&P Global Mobility. DPC's own data source.

### Academic Methodologists
- **Rob Hyndman** (Monash University) -- Developed ETS state-space framework and **optimal reconciliation for hierarchical forecasting** (Hyndman et al., 2011). Directly relevant because DPC needs to reconcile forecasts across Customer > Program > Part > Material levels. His free textbook *Forecasting: Principles and Practice* is the standard reference.
- **Aris Syntetos** (Cardiff) & **John Boylan** (Lancaster) -- The authorities on **intermittent/lumpy demand** classification. Their SBC matrix (smooth, erratic, intermittent, lumpy) is essentially what DPC already uses for their four min-max algorithms. Their Syntetos-Boylan Approximation (SBA) is the gold standard for lumpy demand.
- **Nikolaos Kourentzes** (University of Skovde) -- **Temporal hierarchies**: reconciling weekly operational forecasts with monthly/quarterly strategic forecasts. Exactly DPC's problem.
- **Spyros Makridakis** (University of Nicosia) -- Led the M-Competition series (M1-M6). M5 showed gradient boosted trees outperform statistical methods at item level, but statistical methods remain competitive at aggregate levels.

### Institutions
- **Center for Automotive Research (CAR)** -- Ann Arbor, MI. Industry outlook reports.
- **S&P Global Mobility** -- The undisputed benchmark for vehicle production forecasting.
- **Lancaster Centre for Forecasting** -- Most practical guidance on mixed-demand-pattern manufacturing environments.

## 6B. The Honest Reality Check

**What companies at DPC's scale ($15-30M, one forecaster) actually use:**
- ~60-75% use spreadsheets with judgment overlays (exactly what Tiffany does today)
- ~14% use automated forecasting tools exclusively
- The E2open Benchmark Study shows average demand planning MAPE across industries is ~48% at the weekly item-location level
- Tiffany's 0.2% number is **aggregate bias, not accuracy** -- bias measures systematic over/under-forecasting; you can have 0% bias and 50% MAPE if errors cancel out. We need to measure WAPE at the product family level to know the real picture.

**Realistic accuracy benchmarks for DPC's tier:**

| Level | Poor (25th pct) | Typical (50th pct) | Good (75th pct) |
|-------|---------|---------|---------|
| Monthly, product family | 35-45% MAPE | 25-35% MAPE | 15-25% MAPE |
| Monthly, aggregate | 15-25% MAPE | 10-15% MAPE | 5-10% MAPE |
| Bias (aggregate) | >10% | 3-8% | <3% |

## 6C. Recommended Forecasting Architecture

A **three-layer architecture** adapted to DPC's actual capabilities:

### Layer 1: "Demand Sensing" -- Weeks 1-6 (EDI-Driven)
- **What it is:** Direct consumption of EDI customer releases from CMS
- **Enhancement:** Track release revision patterns per customer. GM initial releases are typically X% higher/lower than final ship quantities. Apply bias correction.
- **Tool:** Existing Epicor CMS + structured Excel tracking

### Layer 2: "Statistical Forecast" -- Weeks 4-12 (Time Series + IHS)
- **For Automotive (82% of volume):** Dynamic regression with S&P Global Mobility vehicle production forecasts as external regressor
  - Logic: IHS platform production forecast x Content-Per-Vehicle (CPV) take rate = DPC part demand
  - Example: If IHS says Ford H567 will produce 50K units in Month X, and DPC supplies 1 foam block per vehicle, forecast = 50K units
- **For ICF (seasonal):** Holt-Winters seasonal decomposition with housing starts as leading indicator
- **For Packaging:** Simple exponential smoothing or Croston's method depending on demand regularity
- **For Medical coolers (lumpy):** Syntetos-Boylan Approximation (SBA)
- **Tool:** Excel FORECAST.ETS for baselines, structured IHS integration template

### Layer 3: "Strategic Forecast" -- Weeks 8-16+ (IHS + Judgment)
- **What it is:** Tiffany's expert judgment formally structured against IHS baseline
- **Enhancement:** Rather than ad hoc spreadsheet adjustments, encode judgment as:
  - Directional adjustments (up/down/no change) with magnitude and reason code
  - Program lifecycle overlays (ramp-up, peak, ramp-down, end-of-life)
  - Accuracy tracking on adjustments -- learn which types of judgment calls consistently add value
- **Tool:** Structured Excel template with tracked adjustments

### Blending the Layers

As the EDI signal decays outward in time, the forecast takes over:

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16
       |--- Firm EDI Orders ----|---- Blend Zone ----|--- Forecast/IHS ----|
       |   95%+ order-based     | 50-70% orders      | 80%+ forecast       |
       |                        | 30-50% forecast     |                     |
```

### The BOM Explosion Layer (Material Forecasting)

This is where the BOM data becomes the critical bridge:

```
Material Demand(week) = SUM over all parts [ Part Forecast(week) x Qty_Per_Parent from BOM ]
```

The high commonality of base materials (EPS used in 221 products, strapping in 295) means the **material-level forecast will be significantly more accurate than any individual part forecast** due to aggregation. Procurement decisions should be driven by the reconciled material-level forecast.

## 6D. Demand Pattern Classification

DPC already uses four algorithms (smooth, erratic, inverted, lumpy). Here's how these map to their product mix and what forecasting/inventory approach each requires:

| Pattern | DPC Products | Forecast Method | Inventory Policy |
|---------|-------------|----------------|-----------------|
| **Smooth** | High-volume automotive (GM bumper cores, jack stows, Ford H567 blocks) | ETS/ARIMA + IHS regressor | Make-to-Stock, low safety stock, reorder point system |
| **Erratic** | Medical coolers, custom packaging | Weighted moving average, wide confidence intervals | Make-to-Stock, HIGH safety stock, periodic review |
| **Inverted/Seasonal** | ICF building blocks | Seasonal decomposition (Holt-Winters) | Seasonal build strategy -- build in Q1 for Q2/Q3 construction season |
| **Lumpy** | Low-volume automotive structural (ESAS), specialty one-offs | Croston's method or SBA | Make-to-Order with raw material buffer; hold EPP resin, not finished goods |

## 6E. Realistic Implementation Path

**Phase 0 -- Current State (already functional):**
Tiffany maintains Excel spreadsheets with 5 years of sales data, manually integrates IHS forecasts, uses EDI releases for near-term. This produced 0.2% aggregate bias. It is not broken.

**Phase 1 -- Months 1-3 (Quick wins, ~$0 cost):**
- Structure Tiffany's spreadsheets into proper data model (Excel + Power Query)
- Add FORECAST.ETS baselines for top 20 SKUs/product families
- Formalize IHS-to-DPC part mapping template
- Start measuring WAPE at product family level monthly (not just aggregate bias)
- Build ABC classification for all 209 raw materials
- Calculate min/max safety stock for all materials (replacing 15.8% coverage)

**Phase 2 -- Months 3-6 (Structured improvement):**
- Power BI dashboard connecting to CMS data for forecast vs. actual tracking
- Formal S&OP process (monthly 1-hour meeting: Tiffany + Earl + Sales)
- IHS variance monitoring (automated alert when relevant platforms shift >10%)
- Customer order anomaly detection (flag 3-week declining trends)
- Evaluate Netstock ($5M-$50M sweet spot, integrates with 60+ ERPs) or DemandCaster as purpose-built tool

**Phase 3 -- Months 6-12 (Only if Phase 1-2 prove value):**
- Statistical model selection by demand pattern (smooth/erratic/seasonal/lumpy)
- Formalized EDI-to-forecast blending with customer-specific transition points
- Capacity model integration for 16-week machine loading forecast
- Program lifecycle tracking dashboard

**What NOT to do:**
- Do NOT implement hierarchical Bayesian models or custom ML pipelines. Nobody at DPC will maintain them.
- Do NOT try to replace Tiffany's judgment with algorithms. Her institutional knowledge IS the forecasting system.
- Do NOT build anything that requires a data scientist to operate. If Tiffany can't modify it, it's worse than her current process.

---

# 7. CRITICAL DATA REQUEST FOR DPC

Before we can proceed with any meaningful analysis, we need the following from DPC. This is organized by priority:

## MUST-HAVE (Blocking -- cannot do forecasting without these)

### Request 1: Tiffany's 5-Year Historical Sales Data
- **What:** The product-level sales data Tiffany manually extracted during the Epicor implementation
- **Format:** CSV or Excel
- **Fields needed:** Date (month or week), Part Number, Quantity Shipped, Revenue (if available), Customer (if available even partially)
- **Why:** This is THE foundation. Without historical demand patterns, every forecasting method -- from simple moving averages to regression -- is impossible. There is no substitute.
- **Suggested framing:** "Tiffany mentioned she manually extracted approximately 5 years of product-level sales data. This is the single most important dataset for everything we want to build. Any format is fine."

### Request 2: IHS Global Automotive Production Forecast
- **What:** S&P Global Mobility light vehicle production forecast for North America
- **Format:** CSV, Excel, or even PDF
- **Fields needed:** Vehicle platform/nameplate, monthly production volumes, 6-12 month horizon minimum
- **Why:** This is the external market signal that makes the 16-week forecast possible. Without it, we're limited to whatever is in the EDI order book.
- **Suggested framing:** "This is what makes the 16-week horizon work. Tiffany said she'd have the sales engineer pull it."

### Request 3: Part-to-Vehicle-Platform Mapping
- **What:** Which DPC parts go onto which vehicle programs
- **Format:** Simple spreadsheet
- **Fields needed:** DPC Part Number, Vehicle Platform/Program, OEM Customer, Tier 1 Customer, estimated annual volume
- **Why:** This is the bridge that connects IHS vehicle production forecasts to DPC's specific part demand. Without it, IHS data is directionally useful but not actionable.
- **Suggested framing:** "Some of this is in your part descriptions (e.g., 'FORD H567'). If there's a master list of which parts go on which vehicles, that's what we need."

## SHOULD-HAVE (Significantly improves accuracy)

### Request 4: EDI 830 Planning Schedule Export
- Sample of 3-6 months of 830 data for top 5 automotive customers
- Shows firm vs. planning release quantities by week
- This IS the demand signal for weeks 7-16

### Request 5: Raw Material Lead Times
- For each of the 209 raw materials: supplier, typical lead time (days/weeks), minimum order quantity
- Critical for converting demand forecasts into procurement timing

### Request 6: Production Parameters
- Machine/press list with capabilities
- Approximate cycle times per part or product family
- Shift schedule (shifts/day, hours/shift, days/week)

### Request 7: ClassID Legend
- Simple lookup: ClassID (ESPF, ESIF, ESAF, ESAS, ESPS) to business segment name
- Needed to segment analysis properly

## NICE-TO-HAVE (Incremental improvement)

| # | Data | Why |
|---|------|-----|
| 8 | Current min-max settings for the 15.8% of items that have them | Calibration baseline |
| 9 | Scrap/yield rates by product family | Gross-up MRP requirements |
| 10 | Open raw material purchase orders | Supply pipeline visibility |
| 11 | Unit pricing by part | Revenue-weighted forecast prioritization |
| 12 | Machine maintenance/downtime history | Realistic capacity adjustment |

---

# 8. QUESTIONS TO CONFIRM WITH DPC BEFORE PROCEEDING

1. **Are the metrics in Section 5 the right targets?** Which matter most to Earl, Tiffany, and the board?

2. **What is the primary forecasting use case -- procurement (buying resin) or capacity (scheduling machines)?** This determines whether we optimize at the material level or the machine-hour level.

3. **Does DPC have raw material cost adjustment clauses in their automotive contracts?** The 15% tariff on Hanwha EPP resin from Korea is a direct margin compression risk. If they can't pass it through, forecasting material costs becomes as important as forecasting volumes.

4. **Which of the 523 finished goods are the "vital few"?** Pareto analysis suggests ~20% of parts drive ~80% of revenue. We should focus forecasting effort there first.

5. **What is Tiffany's 0.2% number actually measuring?** Is it annual revenue bias? Monthly product-family WAPE? The answer determines our baseline and how much improvement is possible.

6. **Is the YFAI relationship stable?** YFAI is 11% of shipments and actively shrinking its US footprint (192 layoffs Romulus MI, 444 jobs lost Riverside KS). Which DPC programs flow through consolidating YFAI plants?

7. **What is the status of the Slate Automotive opportunity?** Timeline, expected part content, volume assumptions?

8. **What does "inverted" mean in their four-algorithm framework?** The academic literature uses smooth/erratic/intermittent/lumpy (Syntetos-Boylan). DPC uses smooth/erratic/inverted/lumpy. "Inverted" is non-standard -- we need to understand what they mean by it.

---

# 9. RISK-ADJUSTED OPPORTUNITY SUMMARY

## What We Can Realistically Deliver

| Deliverable | Feasible Today | With Requested Data | Timeline |
|-------------|---------------|-------------------|----------|
| Forward order book analysis (current commitments by customer/part/month) | YES | -- | Immediate |
| Customer concentration risk assessment | YES | -- | Immediate |
| BOM explosion of current orders into material requirements | YES (gross) | Needs lead times for timing | 1 week |
| Statistical demand forecast (16-week horizon) | NO | Needs historical data + IHS | 4-8 weeks after data |
| Min-max safety stock for all materials | NO | Needs historical consumption + lead times | 4-6 weeks after data |
| Capacity utilization forecast | NO | Needs cycle times + machine data | 6-8 weeks after data |
| IHS-driven early warning system | NO | Needs IHS data + part-platform mapping | 4-6 weeks after data |
| Formal S&OP process design | Partially | Needs all above | 8-12 weeks |

## Expected Value

At DPC's scale ($16-17M revenue):
- **A 5% improvement in forecast accuracy** at the material level could reduce safety stock by 10-15%, freeing $100-200K in working capital
- **Preventing one program loss** (like the $4.2M GM situation) through early warning monitoring pays for the entire engagement
- **Eliminating 20+ hours/week of manual data work** frees Tiffany to focus on strategic forecasting rather than data cleanup
- **Setting min-max levels for 100% of materials** (up from 15.8%) directly reduces both stockouts and excess inventory

---

# 10. VEHICLE PLATFORM MAPPING (Decoded from Part Descriptions)

We decoded DPC's part descriptions against known OEM platform codes. This mapping is what connects DPC's parts to IHS/S&P Global Mobility vehicle production forecasts.

## Confirmed Mappings (High/Very High Confidence)

| Code | Vehicle | Platform | Tier 1 Customer | DPC Parts | Shipments | Volume |
|------|---------|----------|-----------------|-----------|-----------|--------|
| **C1YX** | Chevrolet Traverse (2018+) | GM C1/Chi | Direct to GM/NAO | Tire support, jack stow | 43 | 29,585 |
| **C1TL** | Cadillac XT6 (2020+) | GM C1/Chi | Direct to GM/NAO | Bumper EA kitted | 21 | 2,968 |
| **C1UL** | Cadillac XT5 (2017+) | GM C1/Chi | Direct to GM/NAO | MCM front EA | 16 | 2,170 |
| **C1UG** | GMC Acadia (2017+) | GM C1/Chi | Direct to GM/NAO | MCM ABS front bumper, bumper | 23 | 4,270 |
| **C1YB** | Buick Enclave (2018+) | GM C1/Chi | Dexsys/Magna | Foam EA front | 5 | 560 |
| **E2SC** | Chevrolet Malibu (2016+) | GM E2/Epsilon II | Direct to GM/NAO | Front EA | 16 | 1,840 |
| **E2UL** | Cadillac XT4 (2019+) | GM E2/Epsilon II | Direct to GM/NAO | Front bumper EA, jack stow | 16 | 1,169 |
| **A2LL** | Cadillac CT5-V Blackwing | GM Alpha 2 | Dexsys/Magna | MCM Blackwing bumper | 18 | 1,920 |
| **31XX** | Chevy Colorado / GMC Canyon | GM 31XX | Nascote Industries | MCM ABS front EA | 14 | 2,006 |
| **V363** | Ford Transit (2013+) | Ford Transit | Magna Seating | EPP seat bolster inserts | 96 | 431,420 |
| **G07** | BMW X7 (2019+) | BMW CLAR | Techniplas | EPP block | 28 | 44,520 |
| **VW 416** | Volkswagen Atlas (2018+) | VW MQB | YFAI Chattanooga | Bracket | 43 | 128,800 |
| **BEV** | GM Electric Truck (Hummer EV / Silverado EV / Sierra EV) | GM BT1/Ultium | Techniplas | Cargo tub | 16 | 6,160 |

## Partially Decoded (Need Tiffany Confirmation)

| Code | Best Guess | Confidence | DPC Parts | Customer |
|------|-----------|------------|-----------|----------|
| **DD** | "Dual Density" foam type, not a platform code | LOW | DD front EA, DD front bumper fascia EA | Ventra Kansas, GM/NAO, Dexsys |
| **H567** | Ford platform (model unconfirmed) | LOW-MED | Foam block | ALT Industrial Parts Mexico |
| **H61B** | Ford platform (model unconfirmed) | LOW | LH/RH kick plate | Woodbridge |
| **GMX351MCE** | Likely Chevy Equinox/Terrain MCE (mid-cycle enhancement) | MEDIUM | Front EA | GM/NAO |
| **L246** | Unknown GM program | LOW | Door EA front lower | GM/NAO |
| **DA/DB** | Likely Japanese OEM (Honda/Toyota) | LOW-MED | Spacer | UGN Inc. |
| **HP 18MY** | Unknown, possibly Hyundai/Kia (Hanwha is Korean) | LOW | LH/RH parts | Hanwha Advanced Materials |
| **BEE/BEI** | YFAI internal part numbers (vehicle unknown) | LOW | Various LH/RH components | YFAI Frenchtown |

## GM Code Structure Key
- **Position 1:** Platform (C=C1/Chi crossover, E=Epsilon, A=Alpha, D=Delta)
- **Position 2:** Generation number
- **Position 3:** Body type (U=Crossover/CUV, S=Sedan, T=Three-row, Y=Long-wheelbase SUV)
- **Position 4:** Brand (B=Buick, C=Chevrolet, G=GMC, H=Holden, L=Cadillac)

## Key Insight: DPC's GM Revenue Is Heavily C1-Platform Dependent

The C1/Chi platform (Traverse, XT6, XT5, Acadia, Enclave) accounts for the majority of DPC's direct-to-GM shipments. This is a **single-platform concentration risk** -- any GM decision to refresh, consolidate, or discontinue C1 vehicles would hit DPC hard. The IHS forecast for C1 platform production is the single most important external data point for DPC's demand planning.

---

# 11. ICF FOR DATA CENTERS: STRATEGIC MARKET OPPORTUNITY ASSESSMENT

## 11.1 Context

During our meeting, the conversation touched on DPC's ICF (Insulated Concrete Forms) product line and the data center construction boom. Earl noted ICF's extreme energy efficiency, fire/tornado resistance, and structural properties. The question: **Is data center construction a viable growth market for DPC's ICF products?**

We deployed three specialist analysts to research this from market, economic, and technical engineering perspectives.

## 11.2 The Data Center Boom Is Real and In DPC's Backyard

The numbers are staggering:

| Metric | Value |
|--------|-------|
| Near-term US construction pipeline | **$88B+** in projects starting within 6 months (Jan 2026: $25.2B in one month alone) |
| Total global project pipeline | **$2.3 trillion** |
| North America pipeline | **$1.29 trillion** ($263B in active execution) |
| Hyperscaler 2026 capex (AWS, Google, Microsoft, Meta, Oracle) | **$660-690 billion** |
| Data center insulation market | **$464M (2024) growing to $1.125B by 2030** |
| GDP impact | Data center investment accounted for **92% of US GDP growth in H1 2025** |

**Missouri specifically is a hotspot:**

| Project | Location | Investment | Distance from Nixa |
|---------|----------|------------|-------------------|
| Google "Project Mica" (2nd campus) | KC Northland | Part of $100B commitment, 1.56M sq ft, 700MW | ~180 mi |
| Nebius AI Campus | Independence, MO | Massive -- 2.5M sq ft, 800MW-1.1GW | ~185 mi |
| Metrobloks | Liberty, MO | $1.4 billion, 568K sq ft | ~180 mi |
| Meta | Kansas City | Undisclosed, LEED Gold | ~180 mi |
| Cloverleaf Infrastructure | Troy, MO (St. Louis area) | Undisclosed, 1M+ sq ft, 500MW | ~220 mi |

The broader Midwest saw data center construction increase **69% year-over-year** from 2023-2024. Kansas, Iowa, Indiana, Nebraska, Illinois, Wisconsin all have major projects. All within DPC's ~300-500 mile economical EPS shipping radius.

## 11.3 Honest Technical Assessment

Our structural engineering analyst evaluated ICF against data center requirements:

| Requirement | ICF Capability | Fit |
|-------------|---------------|-----|
| **Fire rating (2-4 hour)** | 6" ICF = 4-hour rating. Exceeds requirements. | STRONG |
| **Structural (single-story)** | Fully adequate for enclosure walls | STRONG |
| **Physical security / blast resistance** | 6" reinforced concrete stops all small arms fire, excellent forced entry resistance | STRONG |
| **Moisture/humidity control** | Continuous insulation eliminates thermal bridging condensation. Excellent. | STRONG |
| **Disaster resistance (tornado/hurricane)** | Proven -- tornado/fire/hurricane proof | STRONG |
| **Thermal performance** | R-22 to R-26 continuous insulation | MIXED -- helps in hot climates, nearly irrelevant in temperate (data centers generate internal heat, need to reject it, not retain it) |
| **Construction speed** | 8-16 weeks for walls vs. 2-4 weeks for tilt-up | WEAK -- this is the killer |
| **Cost at scale (100K+ sq ft)** | $25-40/sq ft wall vs. $20-35 tilt-up | WEAK at hyperscale |
| **EMI shielding** | EPS is RF-transparent; concrete/rebar provide moderate shielding only | NOT A DIFFERENTIATOR |

### The Core Problem: Speed

Data center developers are trying to compress construction from 24 months to 4 months. Tilt-up concrete (cast panels on the slab, crane them up in days) is the dominant method precisely because it's the fastest way to enclose a large building. ICF requires stacking blocks, bracing, and pouring in 4-foot lifts -- fundamentally slower for a 100,000+ sq ft building with 20-30 foot walls.

**No ICF data center has ever been built anywhere.** Zero completed projects. Zero under construction. One small company (The Perfect Block) is marketing a modified product for it, but no takers yet.

### The Thermal Paradox

The $40/month heating claim for a 20,000 sq ft ICF house **does not translate** to data centers. Residential buildings need to retain heat; data centers generate 100-500+ watts per square foot of internal heat and need to **reject** it. Wall R-value is a rounding error compared to the mechanical cooling system's capacity. Citing residential energy savings to a data center operator would damage credibility.

## 11.4 Where the Opportunity Actually Exists

Despite the hyperscale mismatch, three viable niches emerged:

### Niche 1: Edge Data Centers (HIGHEST POTENTIAL)
- **What:** Small facilities (1,000-10,000 sq ft) being built by the hundreds for 5G, IoT, autonomous vehicles, content delivery
- **Why ICF works:** Tilt-up is uneconomical below ~30,000 sq ft (fixed crane/setup costs). ICF is cost-competitive at this scale. Edge sites are geographically dispersed, often where tilt-up contractors aren't available. They need robust, secure, weather-resistant enclosures.
- **DPC advantage:** Nixa is centrally located to serve edge deployments across the Midwest

### Niche 2: Disaster-Resilient Data Centers (STRONG FIT FOR DPC'S GEOGRAPHY)
- **What:** Facilities in Tornado Alley and hurricane zones that market business continuity
- **Why ICF works:** Tornado-proof, hurricane-proof, fire-proof. Concrete cures harder in ICF forms (2x+ hardness). This is a genuine, defensible selling point.
- **DPC advantage:** Missouri IS Tornado Alley. The Joplin tornado (2011) is 70 miles from Nixa. Marketing ICF data centers as disaster-resistant in this geography is credible and differentiated.
- **Potential customers:** Regional colocation providers, healthcare systems, financial institutions, government agencies in tornado/hurricane zones

### Niche 3: Government/Secure Facilities
- **What:** DoD, federal civilian, financial data centers with physical security requirements
- **Why ICF works:** 6" reinforced concrete meets ballistic resistance standards (UL 752 Level 8). Excellent forced entry resistance. Can be engineered for blast resistance (UFC 4-010-01).
- **DPC advantage:** Could be combined with the disaster resilience angle for government continuity-of-operations (COOP) facilities

### Adjacent Opportunity: Data Center Support Buildings
- Administrative offices, security buildings, NOCs, generator enclosures on data center campuses
- Smaller, conventional buildings where ICF is well-proven
- Gets DPC onto data center construction sites and into contractor relationships

## 11.5 Revenue Sizing

| Scenario | Assumption | Potential Revenue |
|----------|-----------|------------------|
| **ICF for edge data centers** | 100-200 edge builds in Midwest over 5 years, $50-150K ICF material per site | $5M-$30M over 5 years |
| **ICF for disaster-resilient colo** | 10-20 mid-size facilities in tornado/hurricane zones, $200-500K per site | $2M-$10M over 5 years |
| **Support buildings on DC campuses** | 20-50 small buildings, $50-100K each | $1M-$5M over 5 years |
| **EPS rigid board insulation** (not ICF -- supplying foam board to tilt-up/precast DC walls) | 50-100 projects, $100-300K insulation per project | $5M-$30M over 5 years |

**Total addressable:** Potentially **$13M-$75M over 5 years** across all sub-segments -- meaningful for a $16M company, but requiring deliberate product development and sales effort.

**Note on EPS board insulation:** The most realistic near-term play may not be ICF at all, but rather supplying **EPS rigid insulation board** to data center general contractors using tilt-up or precast. Data centers need wall and roof insulation regardless of structural system, and DPC already manufactures EPS. This doesn't require changing the construction method -- just selling into it.

## 11.6 What DPC Should Do (and Not Do)

### Do:
1. **Talk to BuildBlock and Fox Blocks** about whether they've received data center inquiries
2. **Develop a standardized ICF design package** for edge data centers (2,000-10,000 sq ft)
3. **Explore EPS rigid board insulation** as a product for tilt-up/precast data center walls and roofs -- lower barrier to entry than full ICF
4. **Attend the "Advancing Data Center Construction Mid West" conference** to understand buyer needs
5. **Commission a thermal modeling study** comparing ICF vs. tilt-up envelope under data center heat loads
6. **Target the disaster resilience angle** in Tornado Alley marketing
7. **Get UL 752 ballistic testing** on their ICF wall assembly for the government/secure market

### Don't:
- Don't pitch ICF to hyperscale operators (AWS, Google, Meta, Microsoft). They won't change their standardized tilt-up construction playbooks for a $600M facility.
- Don't lead with residential energy efficiency claims. Data center operators will dismiss them.
- Don't invest significant capacity ahead of confirmed demand. This is exploratory.
- Don't compare ICF to steel frame -- the competitor is tilt-up concrete, and tilt-up wins on speed at scale.

## 11.7 Bottom Line

The data center opportunity for DPC is **real but niche**. It won't replace the $4.2M GM program loss overnight. But the Midwest data center boom is happening literally in DPC's backyard, ICF has genuine advantages for edge/small/secure/disaster-resilient facilities, and no ICF manufacturer is pursuing this market yet. The EPS insulation board angle may actually be the faster path to revenue. This deserves a watching brief and targeted exploration, not a strategic bet.

---

# APPENDIX A: ABOUT DPC

**Diversified Plastics Corporation** (dpcap.com)
- Founded 1969, Nixa, Missouri
- ~300 employees, woman-owned
- ISO-certified, UL-recognized
- Manufacturing: EPS molding, EPP molding, injection molding (Accurate Mold & Plastics division)
- ERP: Epicor CMS (automotive-specific), failed $2M Kinetic migration
- EDI: GM 830/862 via Autocore/AIM ($500K secondary implementation)
- Market: $2.5B global automotive EPP market (5.5% CAGR to $4.0B by 2033)
- Competitors: JSP Corporation (~50% global EPP share), Knauf Industries, BASF, Hanwha Advanced Materials

# APPENDIX B: KEY REFERENCES

**Industry Forecasting:**
- S&P Global Mobility Light Vehicle Production Forecast (monthly, 7-year horizon, 8,000+ models)
- LMC Automotive (Jeff Schuster) -- industry-leading analyst
- AutoForecast Solutions (Sam Fiorani) -- model-level production forecasts

**Academic Methodology:**
- Hyndman & Athanasopoulos, *Forecasting: Principles and Practice*, 3rd ed. (2021) -- free at otexts.com/fpp3
- Syntetos & Boylan (2005), "The accuracy of intermittent demand estimates" -- SBC classification framework
- Wickramasuriya, Athanasopoulos, & Hyndman (2019), "Optimal forecast reconciliation" -- MinT method
- Fildes, Goodwin, Lawrence, & Nikolopoulos (2009), "Effective forecasting and judgmental adjustments"
- Scott & Varian (2014), "Predicting the present with Bayesian structural time series"

**Benchmarking:**
- E2open Forecasting and Inventory Benchmark Study (avg MAPE ~48% at item-location level)
- IBF (Institute of Business Forecasting) industry surveys
- APQC supply chain planning benchmarks
