# DPC Dashboard — Kernel

> Presentation-quality analysis dashboard for DPC (Diversified Plastics Corporation).
> Shows what we learned from their data and positions the forecasting engagement.

---

## 1. Project Overview

**Name:** dpc-analysis-dashboard
**Purpose:** 6-page React dashboard presenting our pre-engagement analysis to DPC leadership (Earl, Tiffany). Designed to impress with depth of analysis from limited data, clearly communicate what we need, and position the value of the full engagement.

### Philosophy

| Principle | Rule |
|-----------|------|
| **Presentation-first** | This is a sales/analysis tool, not an operational system |
| **Real data** | All numbers come from the actual Excel files DPC sent us |
| **Honest about limits** | Every assumption is flagged. Every guess is labeled. |
| **Praise Tiffany** | Her 0.2% accuracy is highlighted. She's the expert we're augmenting. |
| **Gentle on Epicor** | They know inventory is bad. Don't pile on. Frame as "opportunity." |
| **No fabricated forecasts** | We don't have historical data — we show what we WOULD build, not fake results |

### Tone Guide

- Simple, clear language. No jargon without explanation.
- Lots of visuals — charts over tables, color over text.
- Positive framing: "opportunity" not "problem", "data gap" not "missing data"
- DPC is the hero of their own story. We're the supporting cast.

---

## 2. Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Bundler | Vite 6 |
| Language | TypeScript 5.9 (strict) |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (New York style) |
| Routing | React Router v7 |
| Charts | Recharts |
| Icons | Lucide React |

### Project Structure

```
dashboard/
  src/
    pages/
      Overview/           # Landing page — executive summary
      OrderBook/          # Forward order analysis + EDI visibility
      RiskAnalysis/       # Customer concentration + platform + market risks
      MaterialsInventory/ # BOM explosion + inventory health
      MarketOutlook/      # Tariffs, EV, data center ICF opportunity
      NextSteps/          # Data request + forecasting methodology roadmap
    components/
      ui/                 # shadcn/ui components
      layout/             # Shell, Sidebar, TopBar
      charts/             # Recharts wrappers (BarChart, DonutChart, FanChart, etc.)
      domain/             # KpiCard, RiskBadge, PlatformCard, etc.
    data/                 # Hardcoded TypeScript constants from our analysis
    lib/                  # Types, utilities, formatters
    styles/               # Global CSS, theme
```

---

## 3. Brand & Design

### Colors (from DPC branding image)

| Token | Hex | Usage |
|-------|-----|-------|
| `dpc-red` | `#8B1A1A` | Primary brand — headers, active nav, accent |
| `dpc-red-light` | `#A52A2A` | Hover states |
| `dpc-red-dark` | `#6B1414` | Pressed states |
| `dpc-gray` | `#4A4A4A` | Card backgrounds from their brand image |
| `slate-50` | `#f8fafc` | Page background |
| `slate-100` | `#f1f5f9` | Card background |
| `slate-900` | `#0f172a` | Primary text |

### Alert/Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| Critical/Risk | Red | `#ef4444` |
| Warning | Amber | `#f59e0b` |
| Healthy/OK | Green | `#22c55e` |
| Info/Neutral | Blue | `#3b82f6` |
| Muted | Gray | `#94a3b8` |

### Typography

- Font: Inter (system fallback: sans-serif)
- Page titles: text-2xl font-bold
- Section headers: text-lg font-semibold
- Body: text-sm
- Data values: tabular-nums font-mono

### Design Principles (Linear-inspired)

- Clean, minimal borders — use subtle shadows and background color shifts
- Generous whitespace — never crowd elements
- Cards with rounded-xl, subtle ring-1 ring-slate-200
- Sidebar: dark background (slate-900), white text, dpc-red accent for active item
- Data-dense but not cluttered — progressive disclosure via tabs/accordions
- Subtle animations on hover/transition
- Consistent 4px/8px spacing rhythm

---

## 4. Data Constants

All data is hardcoded in `src/data/` as TypeScript constants. No API, no pipeline.

### Files

| File | Contents | Source |
|------|----------|--------|
| `shipping.ts` | 860 shipping records (simplified) | Shipping Line Up xlsx |
| `bom.ts` | BOM summary data (material requirements, match rates) | BOM Epicor xlsx |
| `inventory.ts` | 300 inventory items with on-hand quantities | Inventory sheet |
| `customers.ts` | 33 customers with shipment counts, unit volumes | Computed from shipping |
| `platforms.ts` | Vehicle platform mapping with confidence levels | Our decoded analysis |
| `monthly.ts` | Monthly aggregated shipping data | Computed from shipping |
| `materials.ts` | Material requirements from BOM explosion | Computed from BOM x shipping |
| `market.ts` | Market risk data, tariff info, data center opportunity | Our research |
| `kpis.ts` | Pre-computed dashboard KPIs | Aggregated from all above |

---

## 5. Pages

### 5.1 Overview (Route: `/`)

The landing page. First impression. Clean, authoritative, warm.

**Header:** DPC logo area + "Pre-Engagement Analysis" + date
**KPI Cards (4 across):**
- Total Customers: 33
- Active Parts: 133
- Forward Order Book: 1.5M units
- Vehicle Platforms Identified: 13+

**Key Findings (3 highlight cards):**
1. "Ford Transit is your largest program by volume" — 431K units, 61% of identified volume
2. "EDI visibility drops to 16% by week 16" — the case for forecasting
3. "11 of 22 matched materials show shortages" — inventory opportunity

**What Tiffany Built section:** Praise box highlighting her 0.2% accuracy, manual IHS integration, 5-year data collection effort. "Our goal: extend her reach, not replace her judgment."

**Bottom:** "This analysis was built from just 3 files. Here's what we found →" with page navigation cards.

### 5.2 Order Book (Route: `/orders`)

**EDI Visibility Decay Chart:** Bar chart showing shipments by month with the decay curve. April=100%, fading to March 2027=3%. Clear annotation: "This isn't declining demand — it's the EDI release horizon fading."

**Monthly Volume Table:** Month, shipments, units, unique customers, unique parts

**Customer Breakdown:** Horizontal bar chart of top 15 customers by shipment count

**Segment Donut:** Automotive 82% / Packaging 7% / Medical 1.5% / ICF 1.5% / Other

### 5.3 Risk Analysis (Route: `/risk`)

**Customer Concentration:**
- HHI gauge (1,053 — technically unconcentrated but misleading)
- Top 5 = 65.5% of shipments visual
- GM single-customer risk callout (32.9%)

**Vehicle Platform Map:** Card grid showing each decoded platform with vehicle image placeholder, code, vehicle name, customer path, shipments, confidence badge

**Platform Concentration:** C1/Chi family risk callout (12.7%), Ford Transit volume risk (61% of identified units)

**Market Risk Cards:**
- YFAI shrinking US footprint (elevated risk)
- Hanwha EPP resin 15% tariff (margin risk)
- GM EV pullback (already realized)
- Slate Automotive (high risk / high reward)

### 5.4 Materials & Inventory (Route: `/materials`)

**BOM Match Rate:** Big number (24.8%) with explanation — "100 of 133 shipping parts couldn't be matched to a BOM recipe"

**Material Requirements Table:** Top materials from BOM explosion with on-hand vs required vs gap, color-coded status

**Inventory Health:**
- 32 items with negative on-hand (10.7%)
- Worst offenders list with quantities
- Framed gently: "These gaps represent an opportunity to build accurate baselines"

**Material Commonality Chart:** Showing how key materials (EPS, strapping, stretch film) are shared across many products — the aggregation benefit for forecasting

### 5.5 Market Outlook (Route: `/market`)

**Tariff Environment:** Summary cards showing Section 232 (25%), Korea reciprocal (15% on Hanwha EPP resin), net impact assessment

**EV Trajectory:** Timeline visualization showing GM EV pullback, tax credit end, Factory Zero status

**Data Center Opportunity (ICF):**
- Missouri data center projects map/list (Google, Nebius, Meta, Metrobloks — all within 180mi)
- ICF technical fit assessment (strong for edge/disaster-resilient, weak for hyperscale)
- Revenue sizing ($13M-$75M over 5 years across niches)
- "The Real Play: EPS insulation board for tilt-up data center walls"

**S&P Global Mobility Context:** 2026 NA forecast range (14.2-15.08M units), key uncertainties

### 5.6 Next Steps (Route: `/next-steps`)

**Data Request Checklist:**
- Must-have (3 items with descriptions): Historical sales, IHS forecast, platform mapping confirmation
- Should-have (4 items): EDI 830, lead times, cycle times, ClassID legend
- Nice-to-have (5 items): Min-max settings, scrap rates, open POs, pricing, maintenance

**What Each Dataset Unlocks:** Visual showing data → capability mapping

**Forecasting Methodology Preview:**
- Three-layer architecture diagram (EDI → Statistical → IHS/Judgment)
- "How the experts do it" section with named researchers
- Realistic accuracy targets by horizon (4/8/16 week)

**Questions for DPC:** The 8 confirmation questions we need answered

**Timeline:** Phased approach — Quick wins (months 1-3) → Structured improvement (3-6) → Operationalization (6-12)

---

## 6. Assumptions & Disclaimers

Every page should have an accessible "Assumptions" section (collapsible) listing:
- What data this analysis is based on
- What assumptions were made
- What could change with more data
- Confidence level of any estimates

These should be in a subtle, non-alarming style — info-blue background, small text, expandable.
