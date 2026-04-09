import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/domain/KpiCard";
import { StatusIndicator } from "@/components/domain/StatusIndicator";
import { AssumptionBanner } from "@/components/domain/AssumptionBanner";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { materialRequirements } from "@/data";
import { cn } from "@/lib/utils";
import { Lightbulb, HelpCircle } from "lucide-react";

type Filter = "all" | "shortage" | "ok";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

const commonalityData = [
  { name: "BLACK STRAPPING", value: 295 },
  { name: "PRE EXPANDED EPS", value: 221 },
  { name: "VB2248 ROLLGUARD", value: 104 },
  { name: "STRETCH FILM", value: 83 },
  { name: "VB2240 EDGE PROT.", value: 65 },
];

const inventoryHealthData = [
  { name: "Negative on-hand", value: 32, color: "#ef4444" },
  { name: "Positive on-hand", value: 268, color: "#94a3b8" },
];

const assumptions = [
  "Material requirements are computed only for the 24.8% of parts with BOM matches",
  "Actual material needs are significantly higher than shown",
  "Inventory snapshot is point-in-time and acknowledged as inaccurate by DPC",
  "Negative balances are displayed as-is from the data provided",
  "We've framed inventory gaps as opportunities, not criticisms — DPC is aware of these challenges",
];

export default function MaterialsInventory() {
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = [...materialRequirements].sort((a, b) => {
    if (a.status === "shortage" && b.status !== "shortage") return -1;
    if (a.status !== "shortage" && b.status === "shortage") return 1;
    return a.gap - b.gap;
  });

  const filtered = sorted.filter((m) => {
    if (filter === "shortage") return m.status === "shortage";
    if (filter === "ok") return m.status === "ok";
    return true;
  });

  const shortageCount = materialRequirements.filter((m) => m.status === "shortage").length;
  const okCount = materialRequirements.filter((m) => m.status === "ok").length;

  const filterButtons: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${materialRequirements.length})` },
    { key: "shortage", label: `Shortages (${shortageCount})` },
    { key: "ok", label: `OK (${okCount})` },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Materials &amp; Inventory Analysis
        </h1>
        <p className="mt-1 text-muted-foreground">
          BOM explosion of current order book &middot; Inventory health assessment
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          value="24.8%"
          label="BOM Match Rate"
          subtitle="33 of 133 shipping parts matched to a BOM recipe"
        />
        <KpiCard
          value="22 Materials"
          label="In BOM Explosion"
          subtitle="across matched orders"
        />
        <KpiCard
          value="11 Shortages"
          label="Materials Below Required"
          subtitle="of 22 matched materials"
          variant="warning"
        />
        <KpiCard
          value="32 Items"
          label="Negative On-Hand"
          subtitle="10.7% of inventory items — a data reconciliation opportunity"
          variant="warning"
        />
      </div>

      {/* Material Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Requirements</CardTitle>
          <CardDescription>
            BOM-exploded material needs for matched orders, sorted by shortage severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter tabs */}
          <div className="mb-4 inline-flex overflow-hidden rounded-lg border border-border">
            {filterButtons.map((fb) => (
              <button
                key={fb.key}
                onClick={() => setFilter(fb.key)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium transition-colors border-r border-border last:border-r-0",
                  filter === fb.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {fb.label}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Material</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">On Hand</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Required</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Gap</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">UOM</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Used By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m, i) => (
                <TableRow
                  key={m.materialPart}
                  className={cn(
                    "hover:bg-slate-50/50",
                    i % 2 === 1 && "bg-muted/30"
                  )}
                >
                  <TableCell className="font-mono text-xs">
                    {m.materialPart}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {m.description}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums",
                      m.onHand < 0 && "bg-red-50 text-red-600 font-medium"
                    )}
                  >
                    {fmt(m.onHand)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {fmt(m.required)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums font-medium",
                      m.gap < 0 ? "text-red-600" : "bg-emerald-50 text-green-600"
                    )}
                  >
                    {fmt(m.gap)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.uom}
                  </TableCell>
                  <TableCell>
                    <StatusIndicator status={m.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {m.fromParts}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Material Commonality Insight */}
      <Card>
        <CardHeader>
          <CardTitle>Material Commonality</CardTitle>
          <CardDescription>
            Top 5 most-shared materials by number of products they appear in (full BOM)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={commonalityData}
            horizontal
            height={220}
            fill="#8B1A1A"
            formatValue={(v) => `${v} products`}
          />
          <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm leading-relaxed text-blue-900/80">
              High material commonality is your forecasting advantage. Even if individual
              part forecasts are noisy, the aggregate demand for shared materials like EPS
              and strapping will be much more stable. This is the{" "}
              <span className="font-semibold">&ldquo;portfolio effect&rdquo;</span> that
              makes material-level procurement forecasts significantly more accurate than
              part-level forecasts.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Health Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Data Quality</CardTitle>
          <CardDescription>Framing the opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left: Donut Chart */}
            <div>
              <DonutChart
                data={inventoryHealthData}
                height={260}
                innerRadius={65}
                outerRadius={95}
                centerLabel="300 items"
              />
              <p className="mt-2 text-center text-xs text-muted-foreground italic">
                Positive on-hand doesn&rsquo;t necessarily mean adequate stock levels.
              </p>
            </div>

            {/* Right: Explanation */}
            <div className="flex flex-col justify-center space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                32 items show negative on-hand quantities — a data impossibility that
                reflects transaction timing issues, BOM backflushing gaps, or
                reconciliation delays. This is consistent with the challenges your team
                has described.
              </p>
              <p>
                The good news: once we have historical consumption data and proper safety
                stock calculations, we can build a cycle counting program that replaces
                the monthly 45-minute plant shutdown with continuous, prioritized
                counting. This alone could save significant time and improve accuracy
                incrementally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOM Match Gap Explanation */}
      <Card className="border-amber-100 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            BOM Match Gap
          </CardTitle>
          <CardDescription>
            Why only 24.8% of parts matched
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              100 of 133 shipping parts couldn&rsquo;t be matched to BOM recipes. Likely
              causes:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                The BOM export may be a subset (not all active products)
              </li>
              <li>
                Part number format differences between shipping (PA prefix) and BOM
                systems
              </li>
              <li>
                Some parts may be purchased finished goods without BOM recipes
              </li>
            </ul>
            <p>
              This is easily resolved — Tiffany can confirm whether the BOM export was
              complete or filtered.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Banner */}
      <AssumptionBanner assumptions={assumptions} />
    </div>
  );
}
