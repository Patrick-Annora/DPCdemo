import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { MonthlyVolume } from "@/lib/types";

interface VisibilityChartProps {
  data: MonthlyVolume[];
}

function getVisibilityColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#65a30d";
  if (pct >= 40) return "#ca8a04";
  if (pct >= 20) return "#ea580c";
  return "#dc2626";
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: MonthlyVolume }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="tabular-nums">
        {d.shipments.toLocaleString()} shipments
      </p>
      <p className="tabular-nums text-muted-foreground">
        {d.visibilityPct.toFixed(0)}% visibility
      </p>
    </div>
  );
}

export function VisibilityChart({ data }: VisibilityChartProps) {
  const maxShipments = Math.max(...data.map((d) => d.shipments));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="10%"
          barGap={2}
        >
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
          <ReferenceLine
            y={maxShipments}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{
              value: "Baseline (100%)",
              position: "insideTopRight",
              fontSize: 11,
              fill: "var(--color-muted-foreground)",
            }}
          />
          <Bar dataKey="shipments" radius={[4, 4, 0, 0]} barSize={60}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getVisibilityColor(entry.visibilityPct)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-muted-foreground italic">
        EDI visibility fades beyond 8 weeks — this is where forecasting fills
        the gap
      </p>
    </div>
  );
}
