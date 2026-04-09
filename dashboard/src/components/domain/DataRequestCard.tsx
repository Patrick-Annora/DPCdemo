import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDashed, CircleDot, KeyRound } from "lucide-react";
import type { DataRequest } from "@/lib/types";

interface DataRequestCardProps {
  item: DataRequest;
  variant?: "must-have" | "default";
}

const priorityBorder = {
  "must-have": "border-l-4 border-l-red-400 shadow-md",
  "should-have": "border-l-4 border-l-amber-400",
  "nice-to-have": "border-l-4 border-l-slate-300",
};

const priorityBadge = {
  "must-have": "bg-red-100 text-red-700",
  "should-have": "bg-amber-100 text-amber-700",
  "nice-to-have": "bg-slate-100 text-slate-600",
};

const priorityLabels = {
  "must-have": "Must Have",
  "should-have": "Should Have",
  "nice-to-have": "Nice to Have",
};

function StatusIcon({ status }: { status: DataRequest["status"] }) {
  switch (status) {
    case "received":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
          <CircleDot className="h-3.5 w-3.5 text-amber-500" />
        </span>
      );
    case "not-received":
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
          <CircleDashed className="h-3.5 w-3.5 text-slate-400" />
        </span>
      );
  }
}

const statusLabels = {
  received: "Received",
  partial: "Partial",
  "not-received": "Not Received",
};

export function DataRequestCard({ item, variant = "default" }: DataRequestCardProps) {
  const isMustHave = variant === "must-have";
  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      priorityBorder[item.priority]
    )}>
      <CardContent className={cn(
        "flex flex-col gap-3",
        isMustHave ? "p-6" : undefined
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusIcon status={item.status} />
            <span className="text-xs text-muted-foreground">
              {statusLabels[item.status]}
            </span>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              priorityBadge[item.priority]
            )}
          >
            {priorityLabels[item.priority]}
          </span>
        </div>

        <div>
          <p className={cn(
            "font-semibold leading-snug",
            isMustHave && "text-lg"
          )}>{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <KeyRound className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Unlocks:</p>
          </div>
          <p className="text-sm mt-0.5">{item.unlocks}</p>
        </div>
      </CardContent>
    </Card>
  );
}
