import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconDashboard,
  IconShoppingCart,
  IconPackage,
  IconChartBar,
  IconSettings,
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

interface UserSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
}

export function UserSidebar({ user, onLogout, ...props }: UserSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/user/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Ventas",
        url: "#",
        icon: IconShoppingCart,
      },
      {
        title: "Inventario",
        url: "#",
        icon: IconPackage,
      },
      {
        title: "Estadísticas",
        url: "#",
        icon: IconChartBar,
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
              <Link to="/user/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Kaviai Vendedor</span>
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

