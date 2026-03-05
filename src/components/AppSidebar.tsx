import {
  LayoutDashboard,
  FileText,
  Users,
  Ticket,
  FolderOpen,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Cotizaciones", url: "/cotizaciones", icon: FileText },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Tickets", url: "/tickets", icon: Ticket },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-primary font-semibold text-lg tracking-tight">
              CotiSys
            </span>
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
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
