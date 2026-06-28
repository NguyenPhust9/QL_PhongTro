"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Bell, MessageCircle, User, LogIn, LogOut,
  UserCircle, ChevronDown, X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ThongBao {
  _id: string
  tieuDe: string
  noiDung: string
  loai: 'chung' | 'hoaDon' | 'suCo' | 'hopDong' | 'khac'
  ngayGui: string
  daDoc: string[]
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "tb_read_ids"

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Giữ tối đa 200 id
    const arr = Array.from(ids).slice(-200)
    localStorage.setItem(LS_KEY, JSON.stringify(arr))
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

const LOAI_CONFIG = {
  chung:   { dot: "bg-blue-500",   label: "Chung",     bg: "bg-blue-50",   text: "text-blue-700"   },
  hoaDon:  { dot: "bg-green-500",  label: "Hóa đơn",  bg: "bg-green-50",  text: "text-green-700"  },
  suCo:    { dot: "bg-red-500",    label: "Sự cố",    bg: "bg-red-50",    text: "text-red-700"    },
  hopDong: { dot: "bg-purple-500", label: "Hợp đồng", bg: "bg-purple-50", text: "text-purple-700" },
  khac:    { dot: "bg-gray-400",   label: "Khác",     bg: "bg-gray-50",   text: "text-gray-600"   },
}

// ─── Item thông báo ───────────────────────────────────────────────────────────
function TBItem({ item, isRead, onClick }: {
  item: ThongBao
  isRead: boolean
  onClick: (t: ThongBao) => void
}) {
  const cfg = LOAI_CONFIG[item.loai] || LOAI_CONFIG.khac
  return (
    <button
      onClick={() => onClick(item)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${isRead ? "opacity-50" : "bg-blue-50/30"}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Bell className={`w-4 h-4 ${cfg.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug text-gray-800 ${!isRead ? "font-semibold" : "font-normal"}`}>
          {item.tieuDe}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.noiDung}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo(item.ngayGui)}</span>
        </div>
      </div>
      {/* Chấm xanh = chưa đọc */}
      {!isRead && (
        <div className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 bg-blue-500" />
      )}
    </button>
  )
}

// ─── Bell thông báo ───────────────────────────────────────────────────────────
function ThongBaoBell() {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [list, setList]       = useState<ThongBao[]>([])
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  const unread = list.filter(t => !readIds.has(t._id)).length

  // Load readIds từ localStorage khi mount
  useEffect(() => {
    setReadIds(getReadIds())
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/thong-bao?limit=20")
      if (res.ok) {
        const r = await res.json()
        if (r.success) setList(r.data)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  // Load lần đầu + auto refresh 2 phút
  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 2 * 60 * 1000)
    return () => clearInterval(t)
  }, [fetchData])

  // Đóng khi click ra ngoài
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

  // Click vào 1 item → đánh dấu đã đọc → chuyển trang
  const handleClick = (item: ThongBao) => {
    const next = new Set(readIds)
    next.add(item._id)
    saveReadIds(next)
    setReadIds(next)
    setOpen(false)
    router.push("/dashboard/thong-bao")
  }

  // Đánh dấu tất cả đã đọc
  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(readIds)
    list.forEach(t => next.add(t._id))
    saveReadIds(next)
    setReadIds(next)
  }

  return (
    <div className="relative">
      {/* Nút chuông */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Thông báo"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[360px] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col"
          style={{ top: "100%" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Thông báo</h3>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Đánh dấu đã đọc
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Danh sách */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Không có thông báo nào</p>
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

          {/* Footer */}
          {list.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/thong-bao") }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HomeNav chính ────────────────────────────────────────────────────────────
export function HomeNav() {
  const { data: session } = useSession()
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="absolute right-6 top-5 z-20 flex items-center gap-2">

      {/* Chat */}
      <Link href="/dashboard/chat">
        <button
          title="Tin nhắn"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            5
          </span>
        </button>
      </Link>

      {/* Thông báo */}
      <ThongBaoBell />

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 text-white backdrop-blur-sm transition-all hover:bg-white/30"
        >
          <User className="h-4 w-4" />
          <span className="max-w-[100px] truncate text-sm font-medium">
            {session?.user?.name ?? "Tài khoản"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
            {session ? (
              <>
                <Link
                  href="/dashboard/ho-so"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  Hồ sơ
                </Link>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => { setOpen(false); signOut() }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                href="/dang-nhap"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4 text-slate-400" />
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
