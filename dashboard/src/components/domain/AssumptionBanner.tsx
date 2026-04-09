import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssumptionBannerProps {
  assumptions: string[];
  title?: string;
}

export function AssumptionBanner({
  assumptions,
  title = "Assumptions & Disclaimers",
}: AssumptionBannerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      "rounded-lg transition-colors",
      open ? "bg-blue-50/50 border border-blue-100" : ""
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm text-blue-600/70 hover:text-blue-700 transition-colors rounded-lg"
      >
        <span className="font-medium text-xs">
          {open ? title : "View assumptions"}
        </span>
        {open ? (
          <ChevronUp className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ul className="space-y-1.5 px-4 pb-3 pt-1 list-disc list-inside">
          {assumptions.map((a, i) => (
            <li
              key={i}
              className="text-xs text-blue-800/70"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
