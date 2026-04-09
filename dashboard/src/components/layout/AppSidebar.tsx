import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  Package,
  TrendingUp,
  ListChecks,
  FileWarning,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Order Book", path: "/orders", icon: ClipboardList },
  { label: "Risk Analysis", path: "/risk", icon: ShieldAlert },
  { label: "Materials & Inventory", path: "/materials", icon: Package },
  { label: "Market Outlook", path: "/market", icon: TrendingUp },
  { label: "Next Steps", path: "/next-steps", icon: ListChecks },
  { label: "Assumptions", path: "/disclaimers", icon: FileWarning },
  { label: "Support", path: "/support", icon: LifeBuoy },
];

export default function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4 pb-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <Link to="/" className="block group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <img
              src="/dpc-logo.png"
              alt="DPC — Diversified Plastics Corp."
              className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden"
            />
            <img
              src="/logosmall.png"
              alt="DPC"
              className="hidden h-9 w-9 object-contain group-data-[collapsible=icon]:block"
            />
          </Link>
          <button
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white transition-colors group-data-[collapsible=icon]:hidden"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="size-5" />
          </button>
        </div>
      </SidebarHeader>

      {/* Expand button when collapsed */}
      <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronsRight className="size-5" />
        </button>
      </div>

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

      <SidebarFooter className="border-t border-white/10 px-3 py-3">
        {/* User info */}
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-white truncate">Demo User</span>
            <span className="text-xs text-slate-400 truncate">demo@dpc.com</span>
          </div>
        </div>

        {/* Logout button */}
        <button className="flex items-center gap-3 w-full text-slate-400 hover:text-white transition-colors text-[13px] py-1.5 group-data-[collapsible=icon]:justify-center">
          <LogOut className="size-[18px] shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </button>

        {/* Powered by Annora */}
        <div className="pt-2 border-t border-white/10 group-data-[collapsible=icon]:hidden">
          <span className="text-[10px] text-slate-500">Powered by Annora</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
