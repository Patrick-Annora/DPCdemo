import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "ok" | "shortage";
  label?: string;
}

const config = {
  ok: { dot: "bg-green-500", text: "text-green-700", defaultLabel: "OK" },
  shortage: { dot: "bg-red-500", text: "text-red-700", defaultLabel: "Shortage" },
};

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const c = config[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", c.dot)} />
      <span className={cn("text-xs font-medium", c.text)}>
        {label ?? c.defaultLabel}
      </span>
    </span>
  );
}
