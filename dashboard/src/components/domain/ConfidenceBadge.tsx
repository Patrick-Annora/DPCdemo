import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: "very-high" | "high" | "medium" | "low";
}

const config = {
  "very-high": "bg-emerald-100 text-emerald-700",
  high: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  medium: "bg-amber-50 text-amber-600 border border-amber-200",
  low: "bg-red-50 text-red-600 border border-red-200",
};

const labels = {
  "very-high": "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config[confidence]
      )}
    >
      {labels[confidence]}
    </span>
  );
}
