import {
  Database,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Data Sources                                                       */
/* ------------------------------------------------------------------ */

const dataSources = [
  {
    source: "Forward Shipping Schedule",
    file: "Shipping Line Up & Inventory.xlsx (Sheet 1)",
    records: "860 shipment records",
    status:
      "This is a forward order book (EDI releases), NOT historical sales data. Dates range Jul 2025 \u2013 Mar 2027.",
  },
  {
    source: "Bill of Materials",
    file: "BOM Epicor Download 3.xlsx",
    records: "1,567 BOM lines (523 FGs \u2192 209 materials)",
    status:
      "Complete for the parts included, but only matched 24.8% of shipping parts \u2014 the export may be a subset.",
  },
  {
    source: "Inventory Snapshot",
    file: "Shipping Line Up & Inventory.xlsx (Sheet 2)",
    records: "300 inventory items",
    status:
      "Point-in-time snapshot with known accuracy issues. 32 items (10.7%) show negative on-hand quantities.",
  },
];

/* ------------------------------------------------------------------ */
/*  Assumptions                                                        */
/* ------------------------------------------------------------------ */

const assumptions = [
  {
    title: "Shipping data represents future demand",
    assumption:
      "The shipping line-up is treated as a proxy for demand patterns, even though it\u2019s a forward order book, not historical actuals.",
    ifWrong:
      "Customer ordering patterns, seasonal trends, and demand variability cannot be derived from this data. Any patterns we describe reflect EDI release schedules, not true demand.",
    fix: "Tiffany\u2019s 5-year historical sales data would provide actual demand patterns.",
  },
  {
    title: "Volume taper = EDI visibility decay, not declining demand",
    assumption:
      "The dramatic drop from 231 shipments in April to 6 in March 2027 is because customers only release firm orders a few months ahead, not because demand is actually falling.",
    ifWrong:
      "If demand truly is declining, the risk profile changes significantly.",
    fix: "Historical data would confirm seasonal patterns and true demand trajectory.",
  },
  {
    title: "Customer segments based on company names",
    assumption:
      'We classified customers as automotive, packaging, medical, or ICF based on their company names (e.g., "GM Disbursement Services" = automotive).',
    ifWrong:
      "Some customers may serve multiple segments. Revenue mix by segment could differ from shipment count mix.",
    fix: "DPC\u2019s internal customer classification or the ClassID legend would confirm.",
  },
  {
    title: "Vehicle platform codes decoded from part descriptions",
    assumption:
      "We identified 13+ vehicle programs by matching codes in part descriptions (C1YX, V363, G07, etc.) against known OEM platform databases.",
    ifWrong:
      "Some decodings may be incorrect, especially lower-confidence ones (DD, H567, H61B, L246, DA/DB). Platform concentration percentages would shift.",
    fix: "Tiffany can confirm the ~6 unresolved codes in minutes.",
  },
  {
    title: "BOM explosion is representative",
    assumption:
      "The 24.8% of parts that matched BOM recipes are representative of the full product mix.",
    ifWrong:
      "Material requirements shown are a significant undercount. The actual raw material needs for all 133 active parts would be 3\u20134x what we\u2019ve calculated.",
    fix: "A complete BOM export from Epicor CMS, or confirmation that the current export is filtered.",
  },
  {
    title: "Inventory negatives reflect data issues, not physical reality",
    assumption:
      "The 32 items with negative on-hand are transaction timing/backflushing issues, not actual negative physical stock.",
    ifWrong:
      "This assumption is almost certainly correct \u2014 you can\u2019t have negative physical inventory.",
    fix: "Cycle counting and transaction reconciliation would establish accurate baselines.",
  },
  {
    title: "GM appears under two ship-to accounts",
    assumption:
      '\u201CNAO - GM Disbursement Services\u201D (209 shipments) and \u201CNAO North Dist. Cntr Enterprise Activities Group\u201D (74 shipments) are both GM, giving GM a combined 32.9% of shipments.',
    ifWrong:
      "If these are distinct entities with independent purchasing decisions, the concentration risk is lower than stated.",
    fix: "Tiffany can confirm whether these are functionally one customer or two.",
  },
  {
    title: "Market risk data reflects April 2026 conditions",
    assumption:
      "Tariff rates, EV trajectory, customer financial status, and S&P Global forecasts are current as of our research date.",
    ifWrong:
      "Tariff policy, OEM production plans, and customer situations can change rapidly. The 15% Hanwha tariff, YFAI consolidation, and GM EV pullback are snapshots, not guarantees.",
    fix: "Ongoing monitoring \u2014 this is inherently time-sensitive information.",
  },
  {
    title: "Data center opportunity sizing is speculative",
    assumption:
      "The $13M\u2013$75M ICF revenue estimate for data centers is based on market research and extrapolation, not on any customer conversations, RFQs, or pilot projects.",
    ifWrong:
      "The actual opportunity could be zero (if ICF never gains traction in DC construction) or higher (if a proof-of-concept succeeds). No ICF data center has ever been built.",
    fix: "Conversations with BuildBlock/Fox Blocks about DC inquiries, and attendance at DC construction conferences.",
  },
  {
    title:
      "Tiffany\u2019s 0.2% is aggregate bias, not SKU-level accuracy",
    assumption:
      "We interpret the 0.2% accuracy figure as aggregate revenue or volume bias, meaning over/under-forecasts cancelled out across the portfolio.",
    ifWrong:
      "If this is actually product-family-level WAPE, it would be extraordinary and our accuracy improvement targets would need adjustment.",
    fix: "Ask Tiffany what exactly the 0.2% measures.",
  },
];

/* ------------------------------------------------------------------ */
/*  Not-in-scope items                                                 */
/* ------------------------------------------------------------------ */

const notIncluded = [
  {
    title: "No demand forecasting",
    detail:
      "We have no historical data to build statistical forecasts. All forward-looking numbers are from the existing order book, not predictions.",
  },
  {
    title: "No pricing or revenue analysis",
    detail:
      "We don\u2019t have unit prices. All analysis is in units, not dollars. Revenue estimates use DPC\u2019s stated ~$16\u201317M figure.",
  },
  {
    title: "No safety stock calculations",
    detail:
      "Without lead times, demand variability data, and service level targets, we cannot calculate proper safety stock or min/max levels.",
  },
  {
    title: "No capacity modeling",
    detail:
      "Without cycle times, machine assignments, or shift data, we cannot project capacity utilization or identify bottlenecks.",
  },
  {
    title: "No supplier risk analysis",
    detail:
      "Beyond the Hanwha tariff observation, we have no supplier data, lead time history, or quality metrics.",
  },
  {
    title: "No financial modeling",
    detail:
      "No margin analysis, cash flow projections, or working capital optimization. Requires cost and pricing data.",
  },
];

/* ------------------------------------------------------------------ */
/*  Confidence ratings                                                 */
/* ------------------------------------------------------------------ */

type ConfidenceLevel = "HIGH" | "MEDIUM-HIGH" | "MEDIUM" | "LOW-MEDIUM";

const confidenceFindings: {
  finding: string;
  confidence: ConfidenceLevel;
  why: string;
}[] = [
  {
    finding: "Customer concentration (top 5 = 65.5%)",
    confidence: "HIGH",
    why: "Directly computed from shipping data",
  },
  {
    finding: "Ford Transit = largest program by units",
    confidence: "HIGH",
    why: "Clear from part descriptions + Magna Seating volumes",
  },
  {
    finding: "EDI visibility decay pattern",
    confidence: "HIGH",
    why: "Directly observable in the date distribution",
  },
  {
    finding:
      "Vehicle platform identifications (GM C1, V363, G07, etc.)",
    confidence: "MEDIUM-HIGH",
    why: "Decoded from known OEM codes; ~6 remain unconfirmed",
  },
  {
    finding: "Material shortages (11 of 22)",
    confidence: "MEDIUM",
    why: "Limited by 24.8% BOM match rate \u2014 actual picture likely worse",
  },
  {
    finding: "Inventory negative balances (32 items)",
    confidence: "HIGH",
    why: "Directly from data; root cause assumed (not verified)",
  },
  {
    finding: "Market risk assessments",
    confidence: "MEDIUM",
    why: "Based on public information as of April 2026; conditions change",
  },
  {
    finding: "Data center ICF opportunity",
    confidence: "LOW-MEDIUM",
    why: "Speculative market sizing; no proof-of-concept exists",
  },
  {
    finding: "Tariff net impact (mixed)",
    confidence: "MEDIUM",
    why: "Directionally correct but magnitude depends on contract terms we don\u2019t have",
  },
];

const confidenceColors: Record<ConfidenceLevel, string> = {
  HIGH: "bg-green-100 text-green-800",
  "MEDIUM-HIGH": "bg-blue-100 text-blue-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  "LOW-MEDIUM": "bg-slate-200 text-slate-700",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function Disclaimers() {
  return (
    <div className="space-y-12 pb-16">
      {/* -------- 1. Header -------- */}
      <header className="space-y-2 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Assumptions &amp; Data Limitations
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Transparency about what we know, what we&rsquo;ve estimated, and where
          more data would change the picture
        </p>
      </header>

      <Separator />

      {/* -------- 2. Data Sources -------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#8B1A1A]" />
          <h2 className="text-lg font-semibold tracking-tight">
            What This Analysis Is Built On
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {dataSources.map((ds) => (
            <Card key={ds.source}>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr] lg:grid-cols-[200px_260px_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Source
                  </p>
                  <p className="text-sm font-semibold">{ds.source}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {ds.file}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Records
                  </p>
                  <p className="text-sm">{ds.records}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ds.status}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-5 py-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900 leading-relaxed">
              No historical sales data, IHS Global forecasts, EDI 830 planning
              schedules, pricing data, lead times, cycle times, or production
              parameters were available for this analysis.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* -------- 3. Assumptions -------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[#8B1A1A]" />
          <h2 className="text-lg font-semibold tracking-tight">
            Assumptions Made in This Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {assumptions.map((a, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-baseline gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B1A1A] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{a.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    Assumption
                  </p>
                  <p className="text-sm leading-relaxed">{a.assumption}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-700 mb-1.5">
                    If wrong
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {a.ifWrong}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-green-700 mb-1.5">
                    What would fix it
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {a.fix}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* -------- 4. Not Included -------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <X className="h-5 w-5 text-[#8B1A1A]" />
          <h2 className="text-lg font-semibold tracking-tight">
            What Is NOT in This Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notIncluded.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-semibold">{item.title}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* -------- 5. Confidence Levels -------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#8B1A1A]" />
          <h2 className="text-lg font-semibold tracking-tight">
            Confidence in Our Findings
          </h2>
        </div>

        <Card>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-semibold">Finding</th>
                  <th className="pb-3 pr-4 font-semibold w-36">Confidence</th>
                  <th className="pb-3 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {confidenceFindings.map((cf) => (
                  <tr key={cf.finding}>
                    <td className="py-3 pr-4 align-top">{cf.finding}</td>
                    <td className="py-3 pr-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          confidenceColors[cf.confidence]
                        }`}
                      >
                        {cf.confidence}
                      </span>
                    </td>
                    <td className="py-3 align-top text-muted-foreground">
                      {cf.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* -------- 6. Footer -------- */}
      <section>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-6 py-5">
          <div className="flex gap-3">
            <Wrench className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              This analysis is designed to demonstrate what&rsquo;s possible with
              limited data and to identify where additional information would
              materially improve accuracy. Every assumption listed above
              represents an opportunity &mdash; once resolved, it either confirms
              our finding or reveals something we need to adjust. That&rsquo;s
              the process working as intended.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
