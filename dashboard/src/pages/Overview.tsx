import { Link } from "react-router-dom";
import {
  ClipboardList,
  ShieldAlert,
  Package,
  TrendingUp,
  ListChecks,
  Users,
  Boxes,
  Truck,
  Car,
  ArrowRight,
  Star,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/domain/KpiCard";
import { FindingCard } from "@/components/domain/FindingCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { Separator } from "@/components/ui/separator";

const segmentData = [
  { name: "Automotive", value: 701, color: "#3b82f6" },
  { name: "Packaging", value: 58, color: "#8b5cf6" },
  { name: "Medical", value: 13, color: "#22c55e" },
  { name: "ICF/Building", value: 13, color: "#f59e0b" },
  { name: "Other", value: 75, color: "#94a3b8" },
];

const navCards = [
  {
    to: "/orders",
    icon: ClipboardList,
    title: "Order Book",
    description: "Forward demand by customer, part, and month",
  },
  {
    to: "/risk",
    icon: ShieldAlert,
    title: "Risk Analysis",
    description: "Customer concentration, platform mapping, market risks",
  },
  {
    to: "/materials",
    icon: Package,
    title: "Materials & Inventory",
    description: "BOM explosion, inventory health, material gaps",
  },
  {
    to: "/market",
    icon: TrendingUp,
    title: "Market Outlook",
    description: "Tariffs, EV trends, data center ICF opportunity",
  },
  {
    to: "/next-steps",
    icon: ListChecks,
    title: "Next Steps",
    description: "What data we need and what we'll build with it",
  },
];

export default function Overview() {
  return (
    <div className="space-y-12 pb-16">
      {/* 1. Header Section */}
      <header className="space-y-2 pt-2">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-[#8B1A1A]">DPC</span>
          <span className="text-sm text-muted-foreground">
            Diversified Plastics Corp.
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pre-Engagement Analysis
        </h1>
        <p className="text-sm text-muted-foreground">
          April 2026 &middot; Based on 3 data files provided
        </p>
      </header>

      {/* 1b. How to Use + Data Caveat */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-white p-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            How to Use This Dashboard
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use the sidebar to navigate between sections. Each page analyzes a different aspect of DPC's data — from the forward order book and customer concentration to material requirements and market risks. The <span className="font-medium text-foreground">Next Steps</span> page outlines exactly what additional data we need and what we'll build with it. The <span className="font-medium text-foreground">Assumptions</span> page documents every estimation and gap.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Important Data Limitations
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This analysis is based on <span className="font-medium text-foreground">3 files only</span> — a forward shipping schedule, a BOM export, and an inventory snapshot. We do not have historical sales data, IHS Global forecasts, pricing, lead times, or production parameters. All findings should be treated as directional insights, not definitive conclusions. Vehicle platform identifications are best-effort from public sources and need confirmation. See the Assumptions page for full details.
          </p>
        </div>
      </div>

      <Separator />

      {/* 2. KPI Cards Row */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Customers"
          value="33"
          subtitle="across 4 market segments"
          icon={<Users className="h-4 w-4" />}
          variant="highlight"
        />
        <KpiCard
          label="Active Parts"
          value="133"
          subtitle="in forward order book"
          icon={<Boxes className="h-4 w-4" />}
        />
        <KpiCard
          label="Units"
          value="1.5M"
          subtitle="committed in order book"
          icon={<Truck className="h-4 w-4" />}
        />
        <KpiCard
          label="Platforms"
          value="16"
          subtitle="vehicle programs identified"
          icon={<Car className="h-4 w-4" />}
        />
      </section>

      <Separator />

      {/* 3. Key Findings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Key Findings</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FindingCard
            metric="61.2%"
            metricLabel="of identified unit volume"
            title="Ford Transit Is Your Largest Program"
            description="431,420 EPP seat bolster inserts via Magna Seating — more units than all GM programs combined. A single program change at Ford or Magna would have massive impact."
          />
          <FindingCard
            metric="16%"
            metricLabel="order visibility at 16 weeks"
            title="EDI Visibility Drops to 16% by Week 16"
            description="Your firm orders taper rapidly beyond 8 weeks. By week 16, you have visibility on only 16% of what you'll actually ship. This is exactly where forecasting needs to fill the gap."
          />
          <FindingCard
            metric="32"
            metricLabel="items with negative on-hand"
            title="Inventory Data Needs Attention"
            description="10.7% of inventory items show impossible negative balances — confirming the reconciliation challenges. The BOM matched only 24.8% of shipping parts. Both are fixable with the right data foundation."
          />
        </div>
      </section>

      <Separator />

      {/* 4. Segment Breakdown */}
      <section className="bg-white rounded-xl p-8 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Market Segment Breakdown
        </h2>
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-5">
              <div className="md:col-span-3">
                <DonutChart
                  data={segmentData}
                  height={280}
                  innerRadius={60}
                  outerRadius={95}
                  centerLabel="860"
                  showLegend
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <p className="text-sm leading-loose text-muted-foreground">
                  DPC's revenue is heavily automotive-concentrated at{" "}
                  <span className="font-semibold text-foreground">
                    82% of forward shipments
                  </span>
                  . While this reflects strong OEM relationships, it also means
                  automotive market shifts (tariffs, EV transition, program
                  cancellations) have outsized impact.
                </p>
                <div className="space-y-2 pt-2">
                  {segmentData.map((seg) => {
                    const total = segmentData.reduce(
                      (s, d) => s + d.value,
                      0
                    );
                    const pct = ((seg.value / total) * 100).toFixed(
                      seg.value >= 100 ? 0 : 1
                    );
                    return (
                      <div
                        key={seg.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span>{seg.name}</span>
                        </div>
                        <span className="tabular-nums text-muted-foreground">
                          {seg.value} shipments ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* 5. Tiffany Highlight Section */}
      <section>
        <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/30 border-l-4 border-amber-400 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-semibold tracking-tight">
              Building on a Strong Foundation
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tiffany's manual forecasting process achieved{" "}
            <span className="font-bold text-foreground bg-amber-100/60 px-1.5 py-0.5 rounded">
              0.2% aggregate forecast bias
            </span>{" "}
            last year — an extraordinary result that reflects deep domain
            knowledge built over years. Our goal isn't to replace that
            expertise — it's to extend her reach from 6 weeks to 16 weeks,
            automate the 20+ hours of weekly data work, and provide better
            tools for the judgment calls only she can make.
          </p>
        </div>
      </section>

      <Separator />

      {/* 6. Navigation Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Explore the Analysis
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {navCards.map((card) => (
            <Link key={card.to} to={card.to} className="group">
              <Card className="h-full min-h-[140px] transition-all hover:shadow-md hover:border-[#8B1A1A]/20 group-hover:-translate-y-0.5">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-[#8B1A1A]/5 p-2.5 text-[#8B1A1A] group-hover:bg-[#8B1A1A]/10 transition-colors">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-[#8B1A1A] transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-base leading-snug group-hover:text-[#8B1A1A] transition-colors">
                      {card.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
