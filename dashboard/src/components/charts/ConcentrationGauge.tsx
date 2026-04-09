import { cn } from "@/lib/utils";

interface ConcentrationGaugeProps {
  value: number;
  max: number;
  label: string;
  thresholds?: { low: number; mid: number; high: number };
  sublabel?: string;
}

export function ConcentrationGauge({
  value,
  max,
  label,
  thresholds = { low: 33, mid: 66, high: 100 },
  sublabel,
}: ConcentrationGaugeProps) {
  const pct = Math.min((value / max) * 100, 100);

  const getZoneColor = (pct: number) => {
    if (pct <= thresholds.low) return "text-green-600";
    if (pct <= thresholds.mid) return "text-amber-600";
    return "text-red-600";
  };

  const getMarkerColor = (pct: number) => {
    if (pct <= thresholds.low) return "bg-green-600";
    if (pct <= thresholds.mid) return "bg-amber-600";
    return "bg-red-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm font-bold tabular-nums", getZoneColor(pct))}>
          {value.toLocaleString()}
          <span className="text-muted-foreground font-normal"> / {max.toLocaleString()}</span>
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full">
        {/* Background zones */}
        <div className="absolute inset-0 flex">
          <div
            className="bg-green-200"
            style={{ width: `${thresholds.low}%` }}
          />
          <div
            className="bg-amber-200"
            style={{ width: `${thresholds.mid - thresholds.low}%` }}
          />
          <div
            className="bg-red-200"
            style={{ width: `${thresholds.high - thresholds.mid}%` }}
          />
        </div>

        {/* Marker — visually prominent */}
        <div
          className={cn(
            "absolute top-[-2px] h-[calc(100%+4px)] w-2 -translate-x-1/2 rounded-full shadow-md ring-2 ring-white transition-all duration-500",
            getMarkerColor(pct)
          )}
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>

      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}
