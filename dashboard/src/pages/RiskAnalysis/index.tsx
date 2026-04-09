import { KpiCard } from "@/components/domain/KpiCard";
import { RiskBadge } from "@/components/domain/RiskBadge";
import { ConfidenceBadge } from "@/components/domain/ConfidenceBadge";
import { AssumptionBanner } from "@/components/domain/AssumptionBanner";
import { customers } from "@/data/customers";
import { platforms } from "@/data/platforms";
import { marketRisks } from "@/data/market";
import { dashboardKpis } from "@/data/kpis";
import {
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  DollarSign,
  Building2,
  Zap,
  Rocket,
  Factory,
  CreditCard,
} from "lucide-react";

// ── Segment colors ──────────────────────────────────────────────────────────
const segmentColors: Record<string, string> = {
  automotive: "#3b82f6",
  packaging: "#8b5cf6",
  medical: "#06b6d4",
  icf: "#f59e0b",
  other: "#94a3b8",
};

// ── Prepare customer concentration data ─────────────────────────────────────
const sortedCustomers = [...customers].sort(
  (a, b) => b.shipments - a.shipments
);
const top5 = sortedCustomers.slice(0, 5);
const totalShipments = customers.reduce((s, c) => s + c.shipments, 0);

// ── Sorted platforms by shipments ───────────────────────────────────────────
const sortedPlatforms = [...platforms].sort(
  (a, b) => b.shipments - a.shipments
);

// ── OEM border colors for platform cards ────────────────────────────────────
const oemBorderColors: Record<string, string> = {
  GM: "#3b82f6",
  Ford: "#22c55e",
  BMW: "#8b5cf6",
  VW: "#f97316",
};

function getOemFromPlatform(platform: string): string {
  if (platform.startsWith("GM") || platform === "GM Legacy") return "GM";
  if (platform.startsWith("Ford")) return "Ford";
  if (platform.startsWith("BMW")) return "BMW";
  if (platform.startsWith("VW")) return "VW";
  return "GM";
}

// ── Sorted market risks ─────────────────────────────────────────────────────
const riskOrder: Record<string, number> = {
  critical: 0,
  elevated: 1,
  moderate: 2,
  low: 3,
};
const sortedRisks = [...marketRisks].sort(
  (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
);

const riskBorderColors: Record<string, string> = {
  critical: "border-l-red-500",
  elevated: "border-l-amber-500",
  moderate: "border-l-amber-300",
  low: "border-l-green-400",
};

// ── Market risk icons ───────────────────────────────────────────────────────
const riskIcons: Record<string, React.ReactNode> = {
  "hanwha-tariff": <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />,
  yfai: <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />,
  "gm-ev": <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />,
  slate: <Rocket className="h-4 w-4 shrink-0 text-muted-foreground" />,
  "na-production": <Factory className="h-4 w-4 shrink-0 text-muted-foreground" />,
  "magna-credit": <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />,
};

// ── Unresolved platform codes ───────────────────────────────────────────────
const unresolvedCodes = [
  {
    code: "DD",
    note: 'Likely "Dual Density" foam type, not a platform — pending confirmation',
  },
  { code: "H567", note: "Ford platform, model unconfirmed" },
  {
    code: "H61B",
    note: "Ford platform via Woodbridge, model unconfirmed",
  },
  { code: "L246", note: "GM door EA, vehicle unconfirmed" },
  { code: "DA/DB", note: "Likely Japanese OEM for UGN" },
  {
    code: "BEE/BEI",
    note: "YFAI internal part numbers, vehicle unknown",
  },
];

// ── Max shipments for horizontal bar scaling ────────────────────────────────
const maxTop5Shipments = top5[0]?.shipments ?? 1;

// ─────────────────────────────────────────────────────────────────────────────
export default function RiskAnalysis() {
  return (
    <div className="space-y-12">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Risk Analysis
        </h1>
        <p className="mt-1 text-muted-foreground">
          Customer concentration, vehicle platform mapping, and market risk
          assessment
        </p>
      </div>

      {/* ── Customer Concentration KPIs ─────────────────────────────────── */}
      <section className="space-y-6 rounded-xl border border-border/40 bg-card/50 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="HHI Index"
            value={dashboardKpis.hhi.toLocaleString()}
            subtitle="Technically unconcentrated — but misleading when GM appears under 2 ship-to accounts"
            variant="warning"
          />
          <KpiCard
            label="Top 5 Concentration"
            value={`${dashboardKpis.top5ConcentrationPct}%`}
            subtitle="of all shipments from 5 customers"
          />
          <KpiCard
            label="GM Single-Customer Risk"
            value={`${dashboardKpis.gmConcentrationPct}%`}
            subtitle="of shipments to GM/NAO (combined)"
            variant="danger"
          />
        </div>

        {/* ── Top 5 customer proportion cards + horizontal bars ─────── */}
        <div>
          <h3 className="text-base font-semibold mb-4">
            Customer Concentration by Shipments
          </h3>

          <div className="grid gap-3 sm:grid-cols-5">
            {top5.map((c) => {
              const pct = ((c.shipments / totalShipments) * 100).toFixed(1);
              const barWidth = (c.shipments / maxTop5Shipments) * 100;
              return (
                <div
                  key={c.custId}
                  className="rounded-xl border border-border/50 bg-card p-4 flex flex-col"
                >
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {pct}%
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 truncate" title={c.name}>
                    {c.name.length > 24 ? c.name.slice(0, 22) + "..." : c.name}
                  </span>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor:
                          segmentColors[c.segment] ?? segmentColors.other,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {c.shipments} shipments
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Top 5 customers account for{" "}
            <span className="font-semibold text-foreground">
              {dashboardKpis.top5ConcentrationPct}%
            </span>{" "}
            of all shipments
          </p>
        </div>
      </section>

      {/* ── Vehicle Platform Mapping ────────────────────────────────────── */}
      <section className="space-y-6 rounded-xl border border-border/40 bg-card/50 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Vehicle Platform Identification
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Best-effort decoding based on publicly available OEM platform databases and automotive industry sources. These identifications have not been confirmed by DPC and may contain errors — please verify before relying on them.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Platform</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer Path</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipments</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Units</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlatforms.map((p) => {
                const oem = getOemFromPlatform(p.platform);
                const borderColor = oemBorderColors[oem] ?? "#94a3b8";
                return (
                  <tr key={p.code} className="border-b border-border/30 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: borderColor }} />
                        <span className="font-mono font-semibold text-foreground">{p.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.vehicle}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.platform}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.customerPath}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">{p.shipments}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground hidden sm:table-cell">{p.units.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><ConfidenceBadge confidence={p.confidence} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Platform callout cards ───────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* C1 Platform Risk */}
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/50 p-6 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <h3 className="font-semibold">C1 Platform Risk</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The GM C1/Chi platform family (Traverse, XT6, XT5, Acadia,
              Enclave) accounts for{" "}
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {dashboardKpis.c1PlatformPct}%
              </span>{" "}
              of all shipments across 5 vehicles sharing one platform. A single
              GM decision to refresh, consolidate, or transition the C1 could
              impact all five programs simultaneously.
            </p>
          </div>

          {/* Ford Transit Volume */}
          <div className="rounded-xl border-l-4 border-blue-400 bg-blue-50/50 p-6 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-blue-500" />
              <h3 className="font-semibold">Ford Transit Volume</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ford Transit (V363) via Magna Seating represents{" "}
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dashboardKpis.transitVolumePct}%
              </span>{" "}
              of identified unit volume — 431,420 EPP seat bolster inserts. This
              is the single largest program by far. Monitor the Ford Transit
              production schedule and Magna Seating relationship closely.
            </p>
          </div>
        </div>
      </section>

      {/* ── Market Risk Assessment ──────────────────────────────────────── */}
      <section className="space-y-6 rounded-xl border border-border/40 bg-card/50 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Current Market Risks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As of April 2026
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {sortedRisks.map((risk) => (
            <div
              key={risk.id}
              className={`rounded-xl border border-border/50 border-l-4 p-5 ${riskBorderColors[risk.riskLevel]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {riskIcons[risk.id]}
                <RiskBadge level={risk.riskLevel} />
                <h3 className="text-sm font-semibold">{risk.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{risk.entity}</p>
              <p className="text-sm leading-relaxed mt-1">{risk.impact}</p>
              <p className="text-xs leading-relaxed text-muted-foreground mt-2">
                {risk.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Unresolved Platform Codes ───────────────────────────────────── */}
      <section>
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">
              Platform Codes Pending Confirmation
            </h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {unresolvedCodes.map((item) => (
              <div key={item.code} className="text-sm">
                <span className="font-mono text-xs font-medium text-foreground">
                  {item.code}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5">
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assumptions ─────────────────────────────────────────────────── */}
      <AssumptionBanner
        assumptions={[
          "Vehicle platform codes decoded from part descriptions — some identifications are educated guesses",
          "Customer concentration calculated from forward shipping line-up, not historical revenue",
          "Market risks reflect conditions as of April 2026 and may change rapidly",
          "HHI calculated on shipment count — revenue-weighted HHI would differ (requires pricing data)",
        ]}
      />
    </div>
  );
}
