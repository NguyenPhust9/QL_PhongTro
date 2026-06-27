"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  AlertTriangle,
  BarChart3,
  Building,
  Map,
  MessageCircle,
  Newspaper,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type NavSubItem = {
  title: string
  url: string
  isActive?: boolean
}

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: NavSubItem[]
}

type SessionUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  avatar?: string | null
  role?: string | null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname() || "/dashboard"

  const user = session?.user as SessionUser | undefined

  const navMain = React.useMemo<NavItem[]>(() => {
    const isActiveUrl = (url: string) => {
      if (!url || url === "#") return false

      return pathname === url || pathname.startsWith(`${url}/`)
    }

    const markActive = (item: Omit<NavItem, "isActive">): NavItem => {
      const childItems = item.items?.map((subItem) => ({
        ...subItem,
        isActive: isActiveUrl(subItem.url),
      }))

      return {
        ...item,
        items: childItems,
        isActive:
          isActiveUrl(item.url) ||
          Boolean(childItems?.some((subItem) => subItem.isActive)),
      }
    }

    const baseItems: NavItem[] = [
      markActive({
        title: "Sơ đồ phòng",
        url: "#",
        icon: Map,
        items: [
          {
            title: "Xem sơ đồ",
            url: "/dashboard/so-do-phong",
          },
        ],
      }),
      markActive({
        title: "Rao vặt",
        url: "#",
        icon: Newspaper,
        items: [
          {
            title: "Xem rao vặt",
            url: "/dashboard/rao-vat",
          },
          {
            title: "Đăng bán",
            url: "/dashboard/rao-vat/dang-ban",
          },
        ],
      }),
      markActive({
        title: "Quản lý cơ bản",
        url: "#",
        icon: Building,
        items: [
          {
            title: "Tòa nhà",
            url: "/dashboard/toa-nha",
          },
          {
            title: "Phòng",
            url: "/dashboard/phong",
          },
          {
            title: "Khách thuê",
            url: "/dashboard/khach-thue",
          },
        ],
      }),
      markActive({
        title: "Thống kê",
        url: "/dashboard/thong-ke",
        icon: BarChart3,
      }),
      markActive({
        title: "Tài chính",
        url: "#",
        icon: Receipt,
        items: [
          {
            title: "Hợp đồng",
            url: "/dashboard/hop-dong",
          },
          {
            title: "Hóa đơn",
            url: "/dashboard/hoa-don",
          },
          {
            title: "Thanh toán",
            url: "/dashboard/thanh-toan",
          },
        ],
      }),
      markActive({
        title: "Chat",
        url: "#",
        icon: MessageCircle,
        items: [
          {
            title: "Tin nhắn",
            url: "/dashboard/chat",
          },
        ],
      }),
      markActive({
        title: "Vận hành",
        url: "#",
        icon: AlertTriangle,
        items: [
          {
            title: "Sự cố",
            url: "/dashboard/su-co",
          },
          {
            title: "Thông báo",
            url: "/dashboard/thong-bao",
          },
          {
            title: "Xem Web",
            url: "/dashboard/xem-web",
          },
        ],
      }),
      markActive({
        title: "Cài đặt",
        url: "#",
        icon: Settings,
        items: [
          {
            title: "Hồ sơ",
            url: "/dashboard/ho-so",
          },
          {
            title: "Cài đặt",
            url: "/dashboard/cai-dat",
          },
        ],
      }),
    ]

    if (user?.role === "admin") {
      baseItems.splice(
        4,
        0,
        markActive({
          title: "Quản trị",
          url: "#",
          icon: Shield,
          items: [
            {
              title: "Quản lý tài khoản",
              url: "/dashboard/quan-ly-tai-khoan",
            },
          ],
        })
      )
    }

    return baseItems
  }, [pathname, user?.role])

  const userData = React.useMemo(
    () => ({
      name: user?.name || "User",
      email: user?.email || "user@example.com",
      avatar: user?.avatar || user?.image || "/avatars/default.jpg",
    }),
    [user?.name, user?.email, user?.avatar, user?.image]
  )

  const isDashboardHome = pathname === "/dashboard"

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-amber-500/10 bg-white"
      {...props}
    >
     <SidebarHeader className="border-b border-amber-500/10 p-3">
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        asChild
        isActive={isDashboardHome}
        className="group/logo h-16 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-yellow-50 px-4 shadow-sm transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-50 data-[active=true]:border-amber-400/70 data-[active=true]:bg-amber-50"
      >
        <Link href="/dashboard" className="flex w-full items-center">
          <div className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate font-serif text-[16px] font-extrabold uppercase tracking-[0.24em]">
              <span className="bg-gradient-to-r from-yellow-700 via-amber-500 to-yellow-800 bg-clip-text text-transparent drop-shadow-sm">
                Oria Homes
              </span>
            </span>

            <span className="mt-2 flex items-center gap-1.5 truncate text-[10px] font-medium uppercase tracking-[0.2em] text-amber-700/75">
              <Sparkles className="size-3 text-amber-500" />
              Độc quyền @2026
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-amber-500/10 p-3">
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}