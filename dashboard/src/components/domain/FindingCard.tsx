import { Card, CardContent } from "@/components/ui/card";

interface FindingCardProps {
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  icon?: React.ReactNode;
}

export function FindingCard({
  title,
  description,
  metric,
  metricLabel,
  icon,
}: FindingCardProps) {
  return (
    <Card className="border-l-4 border-l-[#8B1A1A] transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-2 p-6">
        {icon && (
          <div className="text-muted-foreground/60">{icon}</div>
        )}
        {metric && (
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[#8B1A1A]">
              {metric}
            </p>
            {metricLabel && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{metricLabel}</p>
            )}
          </div>
        )}
        <p className="text-sm font-semibold leading-snug mt-3">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
