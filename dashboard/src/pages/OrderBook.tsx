import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisibilityChart } from "@/components/charts/VisibilityChart";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { KpiCard } from "@/components/domain/KpiCard";
import { AssumptionBanner } from "@/components/domain/AssumptionBanner";
import { monthlyVolumes, customers } from "@/data";
import { cn } from "@/lib/utils";
import { Truck, Box, Users, Puzzle, Crosshair } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Derived data                                                       */
/* ------------------------------------------------------------------ */

const segmentColors: Record<string, string> = {
  automotive: "#3b82f6",
  packaging: "#8b5cf6",
  medical: "#22c55e",
  icf: "#f97316",
  other: "#94a3b8",
};

const top15Customers = customers
  .slice()
  .sort((a, b) => b.shipments - a.shipments)
  .slice(0, 15);

const maxShipments = top15Customers[0]?.shipments ?? 1;

const segmentData = [
  { name: "Automotive", value: 701, color: "#3b82f6" },
  { name: "Packaging", value: 58, color: "#8b5cf6" },
  { name: "Medical", value: 13, color: "#22c55e" },
  { name: "ICF", value: 13, color: "#f97316" },
  { name: "Other", value: 75, color: "#94a3b8" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function visibilityBadge(pct: number) {
  if (pct > 50) return "bg-emerald-100 text-emerald-700";
  if (pct >= 20) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrderBook() {
  return (
    <div className="space-y-12 pb-16">
      {/* 1 -- Page Header */}
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Forward Order Book
        </h1>
        <p className="text-lg text-muted-foreground">
          860 scheduled shipments &middot; April 2026 &ndash; March 2027
          &middot; Based on EDI release data
        </p>
      </header>

      {/* 2 -- KPI Row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="in forward schedule"
          value="860 Shipments"
          icon={<Truck className="h-4 w-4" />}
          variant="highlight"
        />
        <KpiCard
          label="total committed volume"
          value="1.5M Units"
          icon={<Box className="h-4 w-4" />}
        />
        <KpiCard
          label="active in order book"
          value="33 Customers"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="unique part numbers"
          value="133 Parts"
          icon={<Puzzle className="h-4 w-4" />}
        />
      </section>

      {/* 3 -- EDI Visibility Decay (hero chart) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            EDI Visibility Decay
          </h2>
          <p className="text-sm text-muted-foreground">
            How far ahead your EDI releases provide reliable volume data
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 space-y-5">
          <VisibilityChart data={monthlyVolumes} />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            This isn't declining demand — it's the EDI release horizon
            fading. By August 2026 (16 weeks out), you have visibility on
            only 16% of what you'll actually ship.
          </p>
          <div className="rounded-lg bg-[#8B1A1A] px-5 py-4 flex items-start gap-3">
            <Crosshair className="h-5 w-5 text-white/90 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-white leading-relaxed">
              This is exactly the gap the 16-week forecast needs to fill.
            </p>
          </div>
        </div>
      </section>

      {/* 4 -- Monthly Volume Table */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Monthly Volume Breakdown
          </h2>
          <p className="text-sm text-muted-foreground">
            Shipments, units, and EDI visibility by month
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Active Customers</TableHead>
                <TableHead className="text-right">Unique Parts</TableHead>
                <TableHead className="text-right">Visibility %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyVolumes.map((row) => {
                const isBaseline = row.month === "2026-04";
                return (
                  <TableRow
                    key={row.month}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      isBaseline && "bg-amber-50/50 font-medium"
                    )}
                  >
                    <TableCell>
                      {formatMonth(row.month)}
                      {isBaseline && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-[#8B1A1A]/10 px-2 py-0.5 text-[10px] font-medium text-[#8B1A1A]">
                          Baseline
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.shipments.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.customers}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {row.parts}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium font-mono tabular-nums",
                          visibilityBadge(row.visibilityPct)
                        )}
                      >
                        {row.visibilityPct.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 5 -- Customer Breakdown (two columns) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Customer Breakdown
          </h2>
          <p className="text-sm text-muted-foreground">
            Top customers and segment distribution across the order book
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Top 15 Customers — Custom ranked list */}
          <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Top 15 Customers by Shipments
              </h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries({
                  Auto: "#3b82f6",
                  Pkg: "#8b5cf6",
                  Med: "#22c55e",
                  ICF: "#f97316",
                }).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-1 text-[10px]">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {top15Customers.map((c, i) => {
                const barColor = segmentColors[c.segment] ?? segmentColors.other;
                const pct = (c.shipments / maxShipments) * 100;
                const displayName = c.name.length > 30
                  ? c.name.slice(0, 28) + "…"
                  : c.name;
                return (
                  <div key={c.custId} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                    <span className="w-5 text-xs font-medium text-muted-foreground/60 tabular-nums text-right shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-foreground truncate">
                          {displayName}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-muted-foreground ml-2 shrink-0">
                          {c.shipments}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: barColor,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Segment Distribution */}
          <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Segment Distribution
            </h3>
            <DonutChart
              data={segmentData}
              height={300}
              innerRadius={70}
              outerRadius={110}
              centerLabel="860"
              showLegend
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automotive dominates at 82% of shipments. GM/NAO alone
              represents 33% of the order book across two ship-to accounts.
            </p>
          </div>
        </div>
      </section>

      {/* 6 -- Assumptions */}
      <AssumptionBanner
        assumptions={[
          "This is a forward-looking order book, not historical sales data",
          "Volume taper after April 2026 reflects EDI release horizons, not demand decline",
          "Customer segments are estimated based on company names",
          "Some customers (e.g., Nascote, Kendrick) could serve multiple segments",
        ]}
      />
    </div>
  );
}
