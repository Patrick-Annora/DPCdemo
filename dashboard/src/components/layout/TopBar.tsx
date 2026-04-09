import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const breadcrumbMap: Record<string, string> = {
  "/": "Overview",
  "/orders": "Order Book",
  "/risk": "Risk Analysis",
  "/materials": "Materials & Inventory",
  "/market": "Market Outlook",
  "/next-steps": "Next Steps",
};

export default function TopBar() {
  const location = useLocation();
  const currentPage = breadcrumbMap[location.pathname] ?? "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-white px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
        <Separator orientation="vertical" className="h-5" />
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400">Dashboard</span>
          <ChevronRight className="size-3.5 text-slate-300" />
          <span className="font-medium text-slate-700">{currentPage}</span>
        </nav>
      </div>

      <div className="text-xs font-semibold text-muted-foreground tracking-wide">
        Pre-Engagement Analysis — April 2026
      </div>
    </header>
  );
}
