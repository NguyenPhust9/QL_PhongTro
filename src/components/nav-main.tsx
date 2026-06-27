"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavSubItem = {
  title: string
  url: string
  isActive?: boolean
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavSubItem[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const { isMobile, state } = useSidebar()
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)

  const isActiveUrl = React.useCallback(
    (url: string) => {
      if (!url || url === "#") return false

      return pathname === url || pathname.startsWith(`${url}/`)
    },
    [pathname]
  )

  const getActiveSubUrl = React.useCallback(
    (subItems?: NavSubItem[]) => {
      if (!subItems?.length) return null

      return (
        subItems
          .filter((subItem) => isActiveUrl(subItem.url))
          .sort((a, b) => b.url.length - a.url.length)[0]?.url || null
      )
    },
    [isActiveUrl]
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700/70">
        Menu
      </SidebarGroupLabel>

      <SidebarMenu className="gap-1.5">
        {items.map((item) => {
          const hasSubItems = Boolean(item.items?.length)
          const activeSubUrl = getActiveSubUrl(item.items)

          const itemActive =
            item.isActive || isActiveUrl(item.url) || Boolean(activeSubUrl)

          // Menu không có submenu
          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={itemActive}
                  className="rounded-xl transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-500/20 data-[active=true]:to-yellow-500/10 data-[active=true]:text-amber-700 data-[active=true]:font-semibold data-[active=true]:shadow-[inset_3px_0_0_rgba(245,158,11,1)]"
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Sidebar thu gọn: hiển thị dropdown
          if (state === "collapsed" && !isMobile) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu
                  open={openDropdown === item.title}
                  onOpenChange={(open) => {
                    setOpenDropdown(open ? item.title : null)
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={itemActive}
                      className="rounded-xl transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-500/20 data-[active=true]:to-yellow-500/10 data-[active=true]:text-amber-700 data-[active=true]:font-semibold data-[state=open]:bg-amber-500/10 data-[state=open]:text-amber-700"
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="min-w-52 rounded-xl border-amber-500/20 bg-white/95 p-2 shadow-xl backdrop-blur"
                    side="right"
                    align="start"
                    sideOffset={8}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DropdownMenuLabel className="flex items-center gap-2 rounded-lg px-2 py-2 text-amber-700">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.title}
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    {item.items?.map((subItem) => {
                      const subActive =
                        subItem.isActive || activeSubUrl === subItem.url

                      return (
                        <DropdownMenuItem
                          key={subItem.title}
                          asChild
                          onSelect={() => setOpenDropdown(null)}
                          className={
                            subActive
                              ? "rounded-lg bg-amber-500/15 font-semibold text-amber-700"
                              : "rounded-lg"
                          }
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          }

          // Sidebar mở rộng hoặc mobile: hiển thị collapsible
          return (
            <Collapsible
              key={`${item.title}-${itemActive}`}
              asChild
              defaultOpen={itemActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={itemActive}
                    className="rounded-xl transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-500/20 data-[active=true]:to-yellow-500/10 data-[active=true]:text-amber-700 data-[active=true]:font-semibold data-[active=true]:shadow-[inset_3px_0_0_rgba(245,158,11,1)]"
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="mt-1 border-l border-amber-500/20 pl-3">
                    {item.items?.map((subItem) => {
                      const subActive =
                        subItem.isActive || activeSubUrl === subItem.url

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subActive}
                            className="rounded-lg transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-700 data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-700 data-[active=true]:font-semibold data-[active=true]:shadow-[inset_3px_0_0_rgba(245,158,11,1)]"
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}