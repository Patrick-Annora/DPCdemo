import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  variant?: "default" | "highlight" | "warning" | "danger";
}

const borderVariants = {
  default: "border-l-transparent",
  highlight: "border-l-[#8B1A1A]",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
};

const trendConfig = {
  up: { icon: TrendingUp, color: "text-green-600" },
  down: { icon: TrendingDown, color: "text-red-600" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

export function KpiCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  variant = "default",
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow border-l-4",
        borderVariants[variant]
      )}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-muted-foreground shrink-0">
              {icon}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
          </div>
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 pt-1">
            {trend && (
              <span className={cn("flex items-center gap-0.5 text-xs", trendConfig[trend].color)}>
                {(() => {
                  const TrendIcon = trendConfig[trend].icon;
                  return <TrendIcon className="h-3 w-3" />;
                })()}
                {trendLabel}
              </span>
            )}
            {subtitle && !trend && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
