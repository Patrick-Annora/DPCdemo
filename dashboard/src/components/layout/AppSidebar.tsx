import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  Package,
  TrendingUp,
  ListChecks,
  FileWarning,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Order Book", path: "/orders", icon: ClipboardList },
  { label: "Risk Analysis", path: "/risk", icon: ShieldAlert },
  { label: "Materials & Inventory", path: "/materials", icon: Package },
  { label: "Market Outlook", path: "/market", icon: TrendingUp },
  { label: "Next Steps", path: "/next-steps", icon: ListChecks },
  { label: "Assumptions", path: "/disclaimers", icon: FileWarning },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4 pb-5 border-b border-white/10">
        <Link to="/" className="block group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <img
            src="/dpc-logo.png"
            alt="DPC — Diversified Plastics Corp."
            className="h-14 w-auto object-contain group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:object-cover group-data-[collapsible=icon]:rounded"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link to={item.path} />}
                      className={
                        isActive
                          ? "border-l-3 border-dpc-red bg-red-50/10 text-white rounded-none py-2.5 text-[13px]"
                          : "text-slate-400 hover:text-white hover:bg-white/5 rounded-none py-2.5 text-[13px]"
                      }
                    >
                      <item.icon className="size-[18px]" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
