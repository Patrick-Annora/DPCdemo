# DPC: What Your Data Already Tells Us
## Quick Analysis from the Shipping Line-Up, BOM, and Inventory Data

*This is what we can build with just the data you've sent us. With historical sales data and IHS forecasts, we can do significantly more -- see the end of this document.*

---

## 1. YOUR ORDER BOOK IS DOMINATED BY 5 CUSTOMERS

Your forward shipping schedule has 860 planned shipments across 33 customers. But the concentration is stark:

| Customer | Shipments | % of Total | Unique Parts |
|----------|-----------|-----------|-------------|
| GM/NAO (combined) | 283 | 32.9% | 31+ |
| Magna Seating | 96 | 11.2% | 2 |
| YFAI Frenchtown | 91 | 10.6% | 9 |
| Dexsys/Magna | 49 | 5.7% | 5 |
| Techniplas | 44 | 5.1% | 3 |
| **Top 5 Total** | **563** | **65.5%** | |
| Other 28 customers | 297 | 34.5% | |

Your **Herfindahl-Hirschman Index is 1,053** -- technically "unconcentrated" on paper, but that's misleading because GM shows up under two ship-to accounts (Disbursement Services + Enterprise Activities Group). Combined, GM is nearly a third of your shipments.

**Risk question:** If GM delays or cancels one platform family, how much of your order book is exposed?

---

## 2. YOUR HIGHEST-VOLUME PROGRAM ISN'T GM -- IT'S FORD TRANSIT

We decoded your part descriptions against known OEM platform codes. The surprise finding:

| Vehicle Program | Platform | Customer Path | Shipments | Units | % of Identified Volume |
|----------------|----------|--------------|-----------|-------|----------------------|
| **Ford Transit** | V363 | via Magna Seating | 96 | 431,420 | **61.2%** |
| VW Atlas | MQB | via YFAI Chattanooga | 43 | 128,800 | 18.3% |
| BMW X7 | CLAR | via Techniplas | 28 | 44,520 | 6.3% |
| Chevy Traverse | C1/Chi | Direct to GM | 43 | 29,585 | 4.2% |

**Ford Transit EPP seat bolster inserts via Magna Seating are your single largest program by volume** -- more units than all GM programs combined. If Ford changes the Transit seat design or Magna moves to a different foam supplier, the impact is enormous.

---

## 3. YOUR GM REVENUE IS CONCENTRATED ON ONE PLATFORM FAMILY

We decoded the GM codes in your part descriptions:

| Code | Vehicle | What DPC Makes | Shipments |
|------|---------|----------------|-----------|
| C1YX | Chevrolet Traverse | Tire support, jack stow | 43 |
| C1UG | GMC Acadia | Front bumper EA | 23 |
| C1TL | Cadillac XT6 | Bumper EA kitted | 21 |
| C1UL | Cadillac XT5 | MCM front EA | 16 |
| E2SC | Chevrolet Malibu | Front EA | 16 |
| E2UL | Cadillac XT4 | Front bumper EA, jack stow | 16 |
| BEV | GM Electric Truck (Hummer/Silverado/Sierra EV) | Cargo tub | 16 |
| A2LL | Cadillac CT5-V Blackwing | MCM bumper | 18 |
| 31XX | Colorado/Canyon | MCM ABS front EA | 12 |
| C1YB | Buick Enclave | Foam EA front | 5 |

**The C1/Chi platform family (Traverse, XT6, XT5, Acadia, Enclave) = 109 shipments (12.7% of total).** These vehicles all share a platform -- a single GM decision to refresh, consolidate, or transition the C1 to electric impacts five DPC programs simultaneously.

The **Cadillac CT5-V Blackwing (A2LL)** is notably low-volume (1,920 units) -- consistent with its ~$100K price point and limited production.

---

## 4. YOUR EDI VISIBILITY DROPS OFF A CLIFF AFTER 8 WEEKS

This chart shows the number of firm shipments you have by month:

```
2026-04  231 shipments  ██████████████████████████████████████████████████ 100%
2026-05  148 shipments  ████████████████████████████████                   64%
2026-06   85 shipments  ██████████████████                                 37%
2026-07   70 shipments  ███████████████                                    30%
2026-08   38 shipments  ████████                                           16%
2026-09   47 shipments  ██████████                                         20%
2026-10   49 shipments  ██████████                                         21%
2026-11   30 shipments  ██████                                             13%
2026-12   30 shipments  ██████                                             13%
2027-01   26 shipments  █████                                              11%
2027-02   15 shipments  ███                                                 6%
2027-03    6 shipments  █                                                   3%
```

**This isn't declining demand -- it's the EDI release horizon fading.** By August (16 weeks out), you have visibility on only 16% of what you'll actually ship. The rest is a black box until customer releases come in.

This is exactly the gap the 16-week forecast needs to fill: the space between where your firm orders end and where you need to be planning production and purchasing materials.

---

## 5. YOUR INVENTORY DATA CONFIRMS THE "INVENTORY HELL"

We ran the BOM explosion against your current inventory. Of the materials we could match:

**11 out of 22 materials show shortages against committed orders:**

| Material | Description | On Hand | Required | Gap |
|----------|-----------|---------|----------|-----|
| Black strapping | Packaging material | -7,023 FT | 71,649 FT | **-78,672 FT** |
| Stretch film | Packaging material | -3,950 FT | 34,020 FT | **-37,970 FT** |
| Pre-expanded EPS (pkg) | Core foam resin | 0 LB | 32,865 LB | **-32,865 LB** |
| ICF 6" web BuildBlock | ICF component | -11,778 EA | 5,376 EA | **-17,154 EA** |
| BL Panel insert | ICF component | -48,208 EA | 2,784 EA | **-50,992 EA** |
| VB2240 Edge protector | Packaging | -44 EA | 996 EA | **-1,040 EA** |

**32 out of 300 inventory items have NEGATIVE on-hand quantities.** This means the system thinks you have less than zero of these items -- a data integrity impossibility that confirms the reconciliation issues discussed in our meeting. Notable negatives include:

- BL Panel Insert: **-48,208 EA**
- ICF 6" Web BuildBlock: **-42,864 EA**
- Epsilyte (EPS resin): **-33,053 LB**
- ICF 8" Web BuildBlock: **-32,664 EA**
- ICF 7" Web: **-16,038 EA**
- Black Strapping: **-7,023 FT**

The ICF components in particular show massive negative balances, suggesting production is being recorded but receipts/production completions are not being properly transacted.

---

## 6. BOM MATCH RATE REVEALS A DATA GAP

We attempted to match every part in your shipping line-up to a BOM recipe. **Only 24.8% matched** (33 of 133 parts). This means:

- 100 parts in your active shipping schedule have no BOM in the file you sent, OR
- The part numbers between the shipping system and BOM system don't align (PA prefix issue, case sensitivity, etc.)

This is a problem for MRP: if we can't connect a sales order to a bill of materials, we can't calculate what raw materials are needed to fulfill that order. The 24.8% match rate suggests either the BOM export is incomplete, or there's a naming convention disconnect between your shipping/EDI system and your BOM system.

**This is something Tiffany could clarify quickly -- is the BOM export a complete extract, or just a subset?**

---

## WHAT WE COULD DO WITH MORE DATA

Everything above was built from just the three files you sent. Here's what opens up with additional data:

| If you send us... | We can build... |
|-------------------|----------------|
| **Tiffany's 5-year historical sales data** | Statistical demand forecasts by part family, seasonal pattern detection, demand classification (smooth/erratic/lumpy), accuracy baselines |
| **IHS Global production forecast** | 16-week demand forecast tied to actual OEM production plans, early warning system for program changes, Ford Transit / GM C1 volume projections |
| **Part-to-platform confirmation** (we've decoded most -- just need ~6 clarifications) | Complete IHS-to-DPC translation layer, platform concentration risk model |
| **Raw material lead times** | Time-phased material requirements, optimal order timing, safety stock calculations |
| **Cycle times + machine assignments** | Capacity utilization forecast, shift planning, bottleneck identification |

The difference: right now we can tell you **what your order book looks like**. With the additional data, we can tell you **what's coming that isn't in the order book yet** -- and that's the whole point of extending from a 6-week to 16-week horizon.

---

*Analysis prepared April 8, 2026*
*Data sources: Shipping Line Up & Inventory.xlsx, BOM Epicor Download 3.xlsx*
