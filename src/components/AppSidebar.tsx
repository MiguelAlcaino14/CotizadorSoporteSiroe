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
        <div className={`py-5 flex items-center ${collapsed ? "justify-center px-2" : "px-4"}`}>
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
              className="h-12 w-auto object-contain"
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
