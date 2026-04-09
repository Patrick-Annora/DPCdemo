import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DataRequestCard } from "@/components/domain/DataRequestCard";
import { dataRequestItems } from "@/data/kpis";
import {
  CheckCircle,
  ArrowRight,
  ArrowDown,
  Target,
  Zap,
  BarChart3,
  Brain,
  Database,
  TrendingUp,
  Settings,
  Wrench,
  CircleAlert,
  Rocket,
  Check,
  X,
  CheckCircle2,
  CircleDot,
  CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Group data request items by priority ────────────────────────────────────
const mustHave = dataRequestItems.filter((d) => d.priority === "must-have");
const shouldHave = dataRequestItems.filter((d) => d.priority === "should-have");
const niceToHave = dataRequestItems.filter((d) => d.priority === "nice-to-have");

// ── Data-to-value mapping rows ──────────────────────────────────────────────
const dataValueChain = [
  {
    data: "Historical Sales Data",
    capability: "Statistical Demand Forecasts",
    value: "Extend forecast accuracy further into the future",
    icon: BarChart3,
  },
  {
    data: "IHS Global Forecast",
    capability: "Market-Driven Predictions",
    value: "Early warning for program changes (prevent another $4.2M loss)",
    icon: TrendingUp,
  },
  {
    data: "Material Lead Times",
    capability: "Time-Phased MRP",
    value: "Right materials, right time, less manual work",
    icon: Settings,
  },
  {
    data: "Production Parameters",
    capability: "Capacity Utilization Model",
    value: "Know when you'll hit constraints before it happens",
    icon: Wrench,
  },
];

// ── Accuracy targets ────────────────────────────────────────────────────────
const accuracyTargets = [
  { horizon: "Near-term", plant: "97-99%", customer: "95-98%", part: "90-95%", note: "EDI releases are near-firm" },
  { horizon: "Mid-range", plant: "92-96%", customer: "88-94%", part: "80-90%", note: "IHS data starts adding signal" },
  { horizon: "Long-range", plant: "88-94%", customer: "82-90%", part: "72-85%", note: "IHS-linked parts at high end" },
];

// Helper to determine accuracy cell color
function accuracyCellClass(value: string): string {
  const num = parseInt(value.split("-")[0], 10);
  if (num >= 90) return "bg-emerald-50";
  if (num >= 75) return "bg-amber-50";
  return "bg-red-50";
}

// ── Action Items from Wednesday Meeting ────────────────────────────────────
const actionItems = [
  { owner: "Patrick", task: "Host the application and set up user accounts" },
  { owner: "Patrick", task: "Send the application access link" },
  { owner: "Patrick", task: "Integrate the feedback system into the app" },
  { owner: "Tiffany", task: "Provide the AS400 hardware model and version number" },
  { owner: "Tiffany & Frank", task: "Review the app and provide feedback" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function NextSteps() {
  return (
    <div className="space-y-12">
      {/* ── 1. Page Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Next Steps</h1>
        <p className="mt-1 text-muted-foreground">
          What we need from DPC, what each dataset unlocks, and how we'll build
          the forecast
        </p>
      </div>

      {/* ── 2. Current Status Overview ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* What We Have */}
          <Card className="min-h-[200px] border-t-4 border-t-emerald-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                What We Have
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "BOM data (1,567 lines, 523 FGs \u2192 209 materials)",
                  "Forward shipping schedule (860 records)",
                  "Inventory snapshot (300 items)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What We're Missing */}
          <Card className="min-h-[200px] border-t-4 border-t-amber-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleAlert className="h-5 w-5 text-amber-500" />
                What We're Missing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Historical sales data (5 years)",
                  "IHS Global production forecast",
                  "EDI 830 planning schedules",
                  "Raw material lead times",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What We Can Build */}
          <Card className="min-h-[200px] border-t-4 border-t-blue-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5 text-blue-500" />
                What We Can Build
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  With current data
                </p>
                <ul className="space-y-2">
                  {[
                    "Order book analysis",
                    "Risk assessment",
                    "BOM explosion (what you see in this dashboard)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  With requested data
                </p>
                <ul className="space-y-2">
                  {[
                    "Extended statistical demand forecast",
                    "Material requirements planning",
                    "Early warning system",
                    "Capacity utilization model",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── 3. Data Request Section ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Data Request — Prioritized
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organized by impact on forecasting capability
          </p>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Dataset</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">What It Unlocks</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...mustHave, ...shouldHave, ...niceToHave].map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      item.priority === "must-have" && "bg-red-100 text-red-700",
                      item.priority === "should-have" && "bg-amber-100 text-amber-700",
                      item.priority === "nice-to-have" && "bg-slate-100 text-slate-500",
                    )}>
                      {item.priority === "must-have" ? "Must" : item.priority === "should-have" ? "Should" : "Nice"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{item.unlocks}</td>
                  <td className="px-4 py-3 text-center">
                    {item.status === "received" && <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Yes</span>}
                    {item.status === "partial" && <span className="inline-flex items-center gap-1 text-xs text-amber-500"><CircleDot className="h-3.5 w-3.5" /> Partial</span>}
                    {item.status === "not-received" && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><CircleDashed className="h-3.5 w-3.5" /> No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl bg-slate-50 py-4">
        <Separator />
      </div>

      {/* ── 4. What Each Dataset Unlocks ─────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            What Each Dataset Unlocks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Data &rarr; Capability &rarr; Business Value
          </p>
        </div>

        <div className="space-y-4">
          {dataValueChain.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.data}
                className="rounded-xl border bg-white p-4"
              >
                {/* Desktop: horizontal 3-column layout */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-3">
                  {/* Data */}
                  <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3">
                    <Database className="h-5 w-5 shrink-0 text-slate-600" />
                    <span className="text-sm font-medium">{row.data}</span>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground/50" />

                  {/* Capability */}
                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                    <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                    <span className="text-sm font-medium">{row.capability}</span>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground/50" />

                  {/* Business Value */}
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3">
                    <Target className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">
                      {row.value}
                    </span>
                  </div>
                </div>

                {/* Mobile: vertical stacked layout */}
                <div className="flex flex-col items-center gap-2 sm:hidden">
                  <div className="flex w-full items-center gap-3 rounded-lg bg-slate-100 p-3">
                    <Database className="h-5 w-5 shrink-0 text-slate-600" />
                    <span className="text-sm font-medium">{row.data}</span>
                  </div>

                  <ArrowDown className="h-5 w-5 text-muted-foreground/50" />

                  <div className="flex w-full items-center gap-3 rounded-lg bg-blue-50 p-3">
                    <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                    <span className="text-sm font-medium">{row.capability}</span>
                  </div>

                  <ArrowDown className="h-5 w-5 text-muted-foreground/50" />

                  <div className="flex w-full items-center gap-3 rounded-lg bg-emerald-50 p-3">
                    <Target className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">
                      {row.value}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ── 5. Forecasting Methodology Preview ───────────────────────────── */}
      <section className="space-y-6 rounded-2xl bg-slate-50/60 p-6 -mx-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            How We'd Build the Forecast
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three-layer architecture adapted to DPC's actual capabilities
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {/* Layer 1 */}
          <Card className="border-t-4 border-t-emerald-400 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-sm">
                  1
                </span>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  EDI Demand Sensing
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Phase 1
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use existing firm customer orders from EDI releases
              </p>
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Enhancement:</span> Track release
                revision patterns per customer to detect systematic
                over/under-ordering
              </p>
              <div className="rounded-md bg-emerald-50 px-3 py-2 mt-auto">
                <p className="text-xs font-medium text-emerald-700">
                  Current capability — extend and refine
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Layer 2 */}
          <Card className="border-t-4 border-t-blue-400 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-sm">
                  2
                </span>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Statistical + IHS
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Phase 2
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Combine time series models with S&P Global Mobility vehicle
                production forecasts
              </p>
              <p className="text-sm leading-relaxed">
                IHS platform forecast x Content-Per-Vehicle = DPC part demand
              </p>
              <div className="rounded-md bg-blue-50 px-3 py-2 mt-auto">
                <p className="text-xs font-medium text-blue-700">
                  Requires historical data + IHS
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Layer 3 */}
          <Card className="border-t-4 border-t-amber-400 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-sm">
                  3
                </span>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-amber-500" />
                  Expert Judgment
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Phase 3
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tiffany's domain expertise formally structured against
                statistical baseline
              </p>
              <p className="text-sm leading-relaxed">
                Program lifecycle overlays, customer intelligence, market signals
                — tracked and measured
              </p>
              <div className="rounded-md bg-amber-50 px-3 py-2 mt-auto">
                <p className="text-xs font-medium text-amber-700">
                  Augments Tiffany's process
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </section>

      <Separator />

      {/* ── 7. Implementation Timeline ───────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Implementation Phases
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Once we receive the remaining data, we'll provide the full roadmap
            with timeline estimates and pricing for the initial valuable product
            delivery.
          </p>
        </div>

        <div className="relative space-y-0">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-10 bottom-10 w-px bg-border" />

          {/* Phase 1 */}
          <div className="relative flex gap-6 pb-8">
            <div className="flex flex-col items-center z-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-lg shadow-md">
                1
              </span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold">Quick Wins</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Phase 1
                </span>
              </div>
              <Card className="border-l-4 border-l-emerald-400">
                <CardContent className="p-4 space-y-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Structure existing spreadsheets with Power Query
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Add statistical baselines (Excel FORECAST.ETS) for top 20 SKUs
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Formalize IHS-to-DPC part mapping
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Start measuring WAPE at product family level
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Secure cloud hosting with authenticated pilot environment
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Identify AS/400 hardware model and begin legacy data extraction planning
                    </li>
                  </ul>
                  <div className="rounded-md bg-emerald-50 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-700">
                      Cost: ~$0 in tools
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="relative flex gap-6 pb-8">
            <div className="flex flex-col items-center z-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-lg shadow-md">
                2
              </span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold">Structured Improvement</h3>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Phase 2
                </span>
              </div>
              <Card className="border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      Epicor API integration for automated data exchange
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      Automated quoting via decision trees (target: 5 days → 5 minutes)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      AS/400 legacy data extraction (480K+ pages from physical tapes)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      Financial data remediation — resolve COGS/Excel workarounds in CMS
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      IHS variance monitoring (automated alerts)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      Formal S&OP process (monthly 1-hour meeting)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="relative flex gap-6">
            <div className="flex flex-col items-center z-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dpc-red text-white font-bold text-lg shadow-md">
                3
              </span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold">Operationalization</h3>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  Phase 3
                </span>
              </div>
              <Card className="border-l-4 border-l-blue-400">
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      Statistical model selection by demand pattern
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      Formalized EDI-to-forecast blending
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      Capacity model integration (16 presses, 60% break-even target)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      Edge data center market opportunity modeling (ICF foam)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      Program lifecycle tracking dashboard
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── 8. Action Items from Wednesday Meeting ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Action Items from Wednesday Meeting
          </h2>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground w-40">Owner</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Action Item</th>
              </tr>
            </thead>
            <tbody>
              {actionItems.map((item, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {item.owner}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.task}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
