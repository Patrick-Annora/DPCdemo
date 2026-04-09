import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "critical" | "elevated" | "moderate" | "low";
}

const config = {
  critical: "bg-red-100 text-red-700",
  elevated: "bg-amber-100 text-amber-700",
  moderate: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  low: "bg-green-50 text-green-700 border border-green-200",
};

const labels = {
  critical: "Critical",
  elevated: "Elevated",
  moderate: "Moderate",
  low: "Low",
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config[level]
      )}
    >
      {labels[level]}
    </span>
  );
}
