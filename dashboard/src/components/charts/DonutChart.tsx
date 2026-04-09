import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

function CustomTooltipWithPct({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutData }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="tabular-nums">
        {item.value.toLocaleString()}{" "}
        <span className="text-muted-foreground">({pct}%)</span>
      </p>
    </div>
  );
}

function CustomLegend({ data }: { data: DonutData[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  height = 280,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltipWithPct total={total} />}
          />
          {centerLabel && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground"
              style={{ fontSize: 24, fontWeight: 700 }}
            >
              {centerLabel}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
      {showLegend && <CustomLegend data={data} />}
    </div>
  );
}
