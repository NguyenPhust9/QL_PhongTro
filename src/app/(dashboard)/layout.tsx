'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Bell, MessageCircle, X, AlertTriangle, FileText, FileX } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { DynamicBreadcrumb } from '@/components/ui/dynamic-breadcrumb';
import { PageProgress } from '@/components/ui/page-progress';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type LoaiTB = 'hoaDonQuaHan' | 'hopDongSapHetHan' | 'hopDongDaHetHan'

interface ThongBaoHT {
  _id: string
  loai: LoaiTB
  tieuDe: string
  noiDung: string
  thoiGian: string
  duongDan: string
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "tbht_read_ids"

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids).slice(-500)))
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "Vừa xong"
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} ngày trước`
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

const LOAI_CONFIG: Record<LoaiTB, { icon: any; bg: string; text: string; label: string }> = {
  hoaDonQuaHan:      { icon: FileX,         bg: "bg-red-50",    text: "text-red-600",    label: "HĐ quá hạn"       },
  hopDongSapHetHan:  { icon: AlertTriangle, bg: "bg-yellow-50", text: "text-yellow-600", label: "Sắp hết hạn"      },
  hopDongDaHetHan:   { icon: AlertTriangle, bg: "bg-red-50",    text: "text-red-700",    label: "Đã hết hạn"       },
}

// ─── Item thông báo ───────────────────────────────────────────────────────────
function TBItem({ item, isRead, onClick }: {
  item: ThongBaoHT
  isRead: boolean
  onClick: (t: ThongBaoHT) => void
}) {
  const cfg = LOAI_CONFIG[item.loai]
  const Icon = cfg.icon
  return (
    <button
      onClick={() => onClick(item)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isRead ? "opacity-50" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug text-gray-800 ${!isRead ? "font-semibold" : "font-normal"}`}>
          {item.tieuDe}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.noiDung}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo(item.thoiGian)}</span>
        </div>
      </div>
      {!isRead && (
        <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${
          item.loai === 'hoaDonQuaHan' || item.loai === 'hopDongDaHetHan' ? 'bg-red-500' :
          item.loai === 'hopDongSapHetHan' ? 'bg-yellow-500' : 'bg-blue-500'
        }`} />
      )}
    </button>
  )
}

// ─── Bell thông báo hệ thống ──────────────────────────────────────────────────
function ThongBaoBell() {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [list, setList]       = useState<ThongBaoHT[]>([])
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  const unread = list.filter(t => !readIds.has(t._id)).length

  useEffect(() => { setReadIds(getReadIds()) }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/stats?includeAlerts=true")
      if (res.ok) {
        const r = await res.json()
        if (r.success) setList(r.data.alerts || [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [fetchData])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])

  const handleToggle = () => {
    if (!open) fetchData()
    setOpen(p => !p)
  }

  const handleClick = (item: ThongBaoHT) => {
    const next = new Set(readIds)
    next.add(item._id)
    saveReadIds(next)
    setReadIds(next)
    setOpen(false)
    router.push(item.duongDan)
  }

  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(readIds)
    list.forEach(t => next.add(t._id))
    saveReadIds(next)
    setReadIds(next)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[340px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col"
          style={{ top: "100%" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Cảnh báo hệ thống</h3>
              {unread > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAll} className="text-[11px] text-blue-600 hover:underline font-medium">
                  Đã đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Không có cảnh báo nào</p>
              </div>
            ) : (
              list.map(item => (
                <TBItem
                  key={item._id}
                  item={item}
                  isRead={readIds.has(item._id)}
                  onClick={handleClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [soTinChuaDoc, setSoTinChuaDoc] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/dang-nhap');
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;
    const fetchChuaDoc = async () => {
      try {
        const res = await fetch('/api/chat/chua-doc-admin');
        const data = await res.json();
        if (data.success) setSoTinChuaDoc(data.soTinChuaDoc);
      } catch {}
    };
    fetchChuaDoc();
    const interval = setInterval(fetchChuaDoc, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
          <PageProgress />
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <DynamicBreadcrumb />

          <div className="ml-auto flex items-center gap-1">
            <ThongBaoBell />
            <Link href="/dashboard/chat">
              <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                <MessageCircle className="h-4 w-4" />
                {soTinChuaDoc > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {soTinChuaDoc > 9 ? '9+' : soTinChuaDoc}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SessionProvider>
  );
}