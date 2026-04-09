import { cn } from "@/lib/utils";

interface SegmentBadgeProps {
  segment: "automotive" | "packaging" | "medical" | "icf" | "other";
}

const config = {
  automotive: "bg-blue-100 text-blue-800 border-blue-200",
  packaging: "bg-purple-100 text-purple-800 border-purple-200",
  medical: "bg-green-100 text-green-800 border-green-200",
  icf: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const labels = {
  automotive: "Automotive",
  packaging: "Packaging",
  medical: "Medical",
  icf: "ICF",
  other: "Other",
};

export function SegmentBadge({ segment }: SegmentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
        config[segment]
      )}
    >
      {labels[segment]}
    </span>
  );
}
