import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Lightbulb,
  BarChart3,
  Server,
  Shield,
  Layers,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/domain/KpiCard";
import { dataCenterProjects, tariffData } from "@/data";

/* ------------------------------------------------------------------ */
/*  Timeline data                                                      */
/* ------------------------------------------------------------------ */

const evTimeline: {
  date: string;
  event: string;
  detail: string;
  isImpact?: boolean;
  sentiment: "negative" | "neutral" | "positive";
}[] = [
  {
    date: "Sep 2025",
    event: "Federal EV tax credit ended",
    detail: "GM EV sales dropped 43% in Q4",
    sentiment: "negative",
  },
  {
    date: "Q4 2025",
    event: "GM took $6\u20137.1B in EV writedowns",
    detail: "",
    sentiment: "negative",
  },
  {
    date: "Jan 2026",
    event: "GM layoffs: 1,200 permanent EV job cuts",
    detail: "3,300 total affected",
    sentiment: "negative",
  },
  {
    date: "Mar\u2013Apr 2026",
    event: "Factory Zero idled",
    detail: "Hummer EV, Escalade IQ, Silverado EV",
    sentiment: "neutral",
  },
  {
    date: "DPC Impact",
    event: "$4.2M GM EV program already lost",
    detail: "",
    isImpact: true,
    sentiment: "negative",
  },
];

/* ------------------------------------------------------------------ */
/*  ICF Fit Assessment data                                            */
/* ------------------------------------------------------------------ */

interface FitItem {
  attribute: string;
  detail: string;
  rating: "strong" | "weak";
}

const icfFitData: FitItem[] = [
  {
    attribute: "Fire Rating (2\u20134 hr)",
    detail: "4-hour rating \u2014 EXCEEDS requirements",
    rating: "strong",
  },
  {
    attribute: "Physical Security",
    detail: '6" reinforced concrete, ballistic resistant',
    rating: "strong",
  },
  {
    attribute: "Disaster Resistance",
    detail: "Tornado / hurricane / fire proof",
    rating: "strong",
  },
  {
    attribute: "Moisture Control",
    detail: "Continuous insulation, no thermal bridging",
    rating: "strong",
  },
  {
    attribute: "Construction Speed",
    detail: "8\u201316 weeks vs 2\u20134 for tilt-up",
    rating: "weak",
  },
  {
    attribute: "Cost at Scale",
    detail: "$25\u201340/sf vs $20\u201335 tilt-up",
    rating: "weak",
  },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function MarketOutlook() {
  return (
    <div className="space-y-16 pb-20">
      {/* ---------------------------------------------------------- */}
      {/*  1. Page Header                                            */}
      {/* ---------------------------------------------------------- */}
      <header className="space-y-2 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Market Outlook</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tariff environment, EV trajectory, and data center opportunity &middot;
          As of April 2026
        </p>
      </header>

      {/* ---------------------------------------------------------- */}
      {/*  2. Tariff Environment                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Tariff Impact Assessment
          </h2>
          <Separator className="mt-3" />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Section 232 Auto Parts Tariff"
            value={`${tariffData.section232Auto}%`}
            icon={<ArrowUpRight className="h-4 w-4" />}
            trend="up"
            trendLabel="Positive for domestic mfg"
            variant="highlight"
          />
          <KpiCard
            label="Korea Reciprocal Tariff"
            value={`${tariffData.koreaReciprocal}%`}
            icon={<AlertTriangle className="h-4 w-4" />}
            trend="down"
            trendLabel="Hits Hanwha EPP resin directly"
            variant="warning"
          />
          <KpiCard
            label="NA Production Decline (2026)"
            value={tariffData.naProductionDecline}
            icon={<TrendingDown className="h-4 w-4" />}
            trend="down"
            trendLabel="Industry-wide volume reduction"
            variant="danger"
          />
          <KpiCard
            label="DPC Revenue at Risk"
            value={tariffData.dpcRevenueAtRisk}
            icon={<ShieldAlert className="h-4 w-4" />}
            subtitle="Based on volume erosion forecast"
            variant="warning"
          />
        </div>

        {/* Two-column positive / negative cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Positive */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Domestic Manufacturing Advantage
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-green-600">
                Positive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                DPC manufactures in Nixa, Missouri. Competing foam molders in
                Mexico and China now face 25% tariffs. This is a meaningful
                competitive advantage. Only 36% of manufacturers are actively
                reshoring &mdash; DPC&rsquo;s existing domestic footprint is a
                differentiator.
              </p>
            </CardContent>
          </Card>

          {/* Negative */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Raw Material Cost Pressure
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-amber-600">
                Negative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Hanwha EPP resin from South Korea now faces 15% reciprocal
                tariff. Under KORUS FTA, this resin had been duty-free. Given
                raw materials account for ~70% of EPP part value, this directly
                compresses margins.{" "}
                <span className="font-semibold text-foreground">
                  Critical question: Does DPC have contractual cost
                  pass-through clauses?
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  3. EV Market Trajectory                                   */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            EV Transition Impact
          </h2>
          <Separator className="mt-3" />
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="py-6">
            <ol className="relative ml-4 border-l-2 border-muted-foreground/20">
              {evTimeline.map((item, i) => {
                const isImpact = item.isImpact;
                const markerColor =
                  item.sentiment === "negative"
                    ? "bg-red-500"
                    : item.sentiment === "positive"
                    ? "bg-green-500"
                    : "bg-amber-400";
                const markerSize = isImpact
                  ? "h-6 w-6 -left-[13px]"
                  : "h-4 w-4 -left-[9px]";
                return (
                  <li key={i} className="mb-8 ml-8 last:mb-0">
                    <span
                      className={`absolute flex items-center justify-center rounded-full ring-4 ring-card ${markerColor} ${markerSize}`}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          isImpact
                            ? "text-red-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.date}
                      </span>
                      <span
                        className={`text-sm ${
                          isImpact
                            ? "text-lg font-bold text-red-700"
                            : "font-medium text-foreground"
                        }`}
                      >
                        {item.event}
                      </span>
                      {item.detail && (
                        <span className="text-sm text-muted-foreground">
                          {item.detail}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Insight */}
        <Card className="border-blue-200/60 bg-blue-50/40">
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-semibold">Insight</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The EV slowdown is paradoxically short-term positive for DPC
              &mdash; it preserves ICE production volumes where DPC has
              established programs. Long-term, EVs still need bumper energy
              absorbers (crash standards are identical), but battery thermal
              management increasingly uses different materials (polyurethane,
              silicone foam) outside DPC&rsquo;s current capabilities.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  4. Data Center Opportunity (ICF)                          */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            ICF for Data Centers: A Niche Opportunity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Data center construction is booming in DPC&rsquo;s backyard
          </p>
          <Separator className="mt-3" />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="In near-term data center starts"
            value="$88B+"
            icon={<Building2 className="h-4 w-4" />}
            variant="highlight"
          />
          <KpiCard
            label="Of H1 2025 GDP growth from data centers"
            value="92%"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <KpiCard
            label="YoY Midwest DC construction increase"
            value="69%"
            icon={<TrendingUp className="h-4 w-4" />}
            trend="up"
            trendLabel="Accelerating"
          />
        </div>

        {/* Missouri Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Missouri Data Center Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Name</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Investment</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Size / Capacity</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Distance from Nixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataCenterProjects.map((project) => (
                  <TableRow key={project.name} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>{project.location}</TableCell>
                    <TableCell>{project.investment}</TableCell>
                    <TableCell>{project.size}</TableCell>
                    <TableCell>{project.distance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Proximity insight */}
        <div className="rounded-lg border border-dashed border-muted-foreground/30 px-5 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              All 5 major Missouri data center projects are within 180&ndash;220
              miles of DPC&rsquo;s Nixa facility
            </span>{" "}
            &mdash; well within the 300&ndash;500 mile economical EPS shipping
            radius.
          </p>
        </div>

        {/* ICF Technical Fit Assessment */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold tracking-tight">
            ICF Technical Fit Assessment
          </h3>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead className="text-right">Fit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {icfFitData.map((item) => (
                    <TableRow key={item.attribute}>
                      <TableCell className="font-medium">
                        {item.attribute}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.detail}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.rating === "strong" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Strong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            <XCircle className="h-3 w-3" />
                            Weak
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Three opportunity cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-green-600">
                Highest Potential
              </CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                Edge Data Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Small facilities (1,000&ndash;10,000 sq ft) where tilt-up is
                uneconomical. Being built by the hundreds for 5G and IoT. ICF is
                cost-competitive at this scale.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Differentiated
              </CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Disaster-Resilient Facilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                DPC is in Tornado Alley. Marketing ICF data centers as
                tornado-proof business continuity facilities is a credible,
                differentiated value proposition.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Fastest Path
              </CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                EPS Insulation Board
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The most realistic near-term play may not be ICF at all &mdash;
                but supplying EPS rigid insulation board to tilt-up/precast data
                center walls. Lower barrier to entry.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue sizing note */}
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="flex gap-3">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                Estimated addressable: $13M&ndash;$75M over 5 years
              </span>{" "}
              across all sub-segments. Meaningful for a $16M company, but requires
              deliberate product development and sales effort.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  5. S&P Global Mobility Context                            */}
      {/* ---------------------------------------------------------- */}
      <section>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="flex items-center gap-4">
            <BarChart3 className="h-6 w-6 shrink-0 text-slate-400" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              S&amp;P Global Mobility forecasts{" "}
              <span className="font-semibold text-foreground">
                14.2&ndash;15.08M NA light vehicles
              </span>{" "}
              for 2026. Combined with DPC&rsquo;s part-to-platform mapping, this
              enables 16-week demand forecast visibility.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
