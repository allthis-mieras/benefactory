import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  LineChartIcon,
  PiggyBankIcon,
  SettingsIcon,
  SparklesIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
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

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
}

const data = {
  user: {
    name: "Alex Benefactor",
    email: "alex@benefactory.app",
    avatar: "",
  },
  navMain: [
    {
      title: "Overzicht",
      url: "#overview",
      icon: SparklesIcon,
    },
    {
      title: "Donaties",
      url: "#donations",
      icon: PiggyBankIcon,
    },
    {
      title: "Impactanalyse",
      url: "#impact",
      icon: LineChartIcon,
    },
    {
      title: "Vergelijking 1%",
      url: "#comparison",
      icon: TargetIcon,
    },
    {
      title: "Methodiek",
      url: "#methodiek",
      icon: UsersIcon,
    },
  ] satisfies NavItem[],
  navSecondary: [
    {
      title: "Documentatie",
      url: "https://ui.shadcn.com/blocks",
      icon: SettingsIcon,
    },
  ] satisfies NavItem[],
  documents: [
    {
      name: "Impactrapport 2024",
      url: "#",
      icon: LineChartIcon,
    },
    {
      name: "Belastingvoordeel gids",
      url: "#",
      icon: PiggyBankIcon,
    },
    {
      name: "Favoriete doelen",
      url: "#",
      icon: SparklesIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <SparklesIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Benefactory</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments label="Snelle links" items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
