import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarChartData {
  name: string;
  value: number;
  [key: string]: unknown;
}

interface BarChartProps {
  data: BarChartData[];
  dataKey?: string;
  fill?: string;
  horizontal?: boolean;
  height?: number;
  formatValue?: (v: number) => string;
  showGrid?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">
        {formatValue ? formatValue(value) : value.toLocaleString()}
      </p>
    </div>
  );
}

export function BarChart({
  data,
  dataKey = "value",
  fill = "#8B1A1A",
  horizontal = false,
  height = 300,
  formatValue,
  showGrid = false,
}: BarChartProps) {
  const layout = horizontal ? "vertical" : "horizontal";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 8, left: horizontal ? 8 : 0, bottom: 0 }}
        barCategoryGap="15%"
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={!horizontal}
            horizontal={horizontal || true}
          />
        )}
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={140} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} barSize={60}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={(entry as Record<string, unknown>).fill as string ?? fill}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
