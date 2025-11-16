import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconChartBar,
  IconDashboard,
  IconSettings,
  IconMessage2,
  IconCar,
  IconMessages,
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
}

export function AdminSidebar({ user, onLogout, ...props }: AdminSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const data = {
    navMain: [
      {
        title: "Inicio",
        url: "/admin/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Insights",
        url: "/admin/insights",
        icon: IconChartBar,
      },
      {
        title: "Conversaciones",
        url: "/admin/conversations",
        icon: IconMessages,
      },
      {
        title: "Reglas",
        url: "/admin/rules",
        icon: IconMessage2,
      },
      {
        title: "Carros",
        url: "/admin/cars",
        icon: IconCar,
      },
    ],
    navSecondary: [
      {
        title: "Configuración",
        url: "#",
        icon: IconSettings,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/admin/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Kaviai Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}

