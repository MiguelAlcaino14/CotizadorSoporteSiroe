import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  User,
  Users,
  Package,
  Ticket,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const allItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: false },
  { title: "Cotizaciones", url: "/cotizaciones", icon: FileText, adminOnly: false },
  // { title: "Tickets", url: "/tickets", icon: Ticket, adminOnly: false },
  { title: "Clientes", url: "/clientes", icon: Users, adminOnly: false },
  { title: "Productos", url: "/productos", icon: Package, adminOnly: false },
  { title: "Configuración", url: "/configuracion", icon: Settings, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === "admin";
  const items = allItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`py-3 flex items-center ${collapsed ? "justify-center px-2" : "px-1"}`}>
          {collapsed ? (
            <img
              src="/Logo_Siroe_opc_3_B.png"
              alt="Siroe"
              className="w-10 h-10 object-contain"
            />
          ) : (
            <img
              src="/Logo_Siroe_opc_2_B.png"
              alt="Siroe"
              className="w-44 h-auto object-contain"
            />
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 flex items-center justify-start w-full"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className={`border-t border-sidebar-border pt-3 pb-2 ${collapsed ? "px-2" : "px-3"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <User className="w-4 h-4 text-sidebar-foreground" />
              <button
                onClick={signOut}
                className="flex items-center justify-center text-sidebar-foreground hover:text-sidebar-foreground/70 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-sidebar-foreground shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-sidebar-foreground truncate leading-tight">
                    {profile?.full_name || "Usuario"}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/60 truncate leading-tight">
                    {user?.email || ""}
                  </span>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 py-1.5 rounded-md text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors w-full"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
