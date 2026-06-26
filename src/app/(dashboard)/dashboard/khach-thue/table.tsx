"use client"

import * as React from "react"
import {
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  CreditCard,
  Calendar,
  Search,
  Home,
  Building2,
  Key,
  Check,
  X,
  FileText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { KhachThue } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'dangThue':
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <User className="h-3 w-3" />Đang thuê
        </Badge>
      )
    case 'daTraPhong':
      return <Badge variant="secondary" className="gap-1">Đã trả phòng</Badge>
    case 'chuaThue':
      return <Badge variant="outline" className="gap-1">Chưa thuê</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type KhachThueTableProps = {
  onView?: (khachThue: KhachThue) => void
  onEdit: (khachThue: KhachThue) => void
  onDelete: (id: string) => void
  actionLoading: string | null
}

type KhachThueDataTableProps = KhachThueTableProps & {
  data: KhachThue[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  selectedTrangThai?: string
  onTrangThaiChange?: (value: string) => void
}

// ─── Modal chi tiết ───────────────────────────────────────────────────────────

function KhachThueDetailModal({
  khachThue,
  open,
  onClose,
  onEdit,
  onDelete,
  actionLoading,
}: {
  khachThue: KhachThue | null
  open: boolean
  onClose: () => void
  onEdit: (k: KhachThue) => void
  onDelete: (id: string) => void
  actionLoading: string | null
}) {
  if (!khachThue) return null

  const kt = khachThue as any
  const hopDong = kt.hopDongHienTai
  const phong = hopDong?.phong
  const toaNha = phong?.toaNha
  const hasPassword = !!kt.matKhau

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
  }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Avatar + tên + trạng thái */}
          <div className="flex items-center gap-4 pb-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground uppercase">
              {khachThue.hoTen.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {khachThue.hoTen}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground capitalize">
                  {khachThue.gioiTinh}
                </span>
                {getStatusBadge(khachThue.trangThai)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Thông tin liên hệ */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Liên hệ
          </p>
          <InfoRow icon={Phone} label="Số điện thoại" value={khachThue.soDienThoai} />
          {khachThue.email && (
            <InfoRow icon={Mail} label="Email" value={khachThue.email} />
          )}
        </div>

        <Separator />

        {/* Thông tin cá nhân */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Thông tin cá nhân
          </p>
          <InfoRow icon={CreditCard} label="CCCD" value={
            <span className="font-mono">{khachThue.cccd}</span>
          } />
          <InfoRow icon={Calendar} label="Ngày sinh" value={
            new Date(khachThue.ngaySinh).toLocaleDateString('vi-VN')
          } />
          <InfoRow icon={MapPin} label="Quê quán" value={khachThue.queQuan} />
          {khachThue.ngheNghiep && (
            <InfoRow icon={User} label="Nghề nghiệp" value={khachThue.ngheNghiep} />
          )}
        </div>

        <Separator />

        {/* Phòng đang thuê */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Phòng đang thuê
          </p>
          {phong ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm font-semibold">
                  <Home className="h-3.5 w-3.5" />
                  {phong.maPhong}
                </div>
                {toaNha && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-medium">
                    <Building2 className="h-3.5 w-3.5" />
                    {toaNha.tenToaNha}
                  </div>
                )}
              </div>
              {hopDong && (
                <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                  {hopDong.ngayBatDau && (
                    <div className="flex justify-between">
                      <span>Ngày bắt đầu</span>
                      <span className="font-medium text-foreground">
                        {new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {hopDong.ngayKetThuc && (
                    <div className="flex justify-between">
                      <span>Ngày kết thúc</span>
                      <span className="font-medium text-foreground">
                        {new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {hopDong.giaThue && (
                    <div className="flex justify-between">
                      <span>Giá thuê</span>
                      <span className="font-medium text-foreground">
                        {Number(hopDong.giaThue).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
              <Home className="h-4 w-4" />
              Chưa thuê phòng nào
            </div>
          )}
        </div>

        <Separator />

        {/* Tài khoản */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Tài khoản
          </p>
          <div className="flex items-center gap-2 py-2">
            <Key className={`h-4 w-4 ${hasPassword ? 'text-green-600' : 'text-muted-foreground'}`} />
            {hasPassword ? (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />Đã tạo tài khoản
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <X className="h-3 w-3" />Chưa tạo tài khoản
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { onEdit(khachThue); onClose() }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => { onDelete(khachThue._id!); onClose() }}
            disabled={actionLoading === `delete-${khachThue._id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {actionLoading === `delete-${khachThue._id}` ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card đơn ─────────────────────────────────────────────────────────────────

function KhachThueCard({
  khachThue,
  onCardClick,
  onView,
  onEdit,
  onDelete,
  actionLoading,
}: {
  khachThue: KhachThue
  onCardClick: (k: KhachThue) => void
} & KhachThueTableProps) {
  const kt = khachThue as any
  const hopDong = kt.hopDongHienTai
  const phong = hopDong?.phong
  const toaNha = phong?.toaNha
  const hasPassword = !!kt.matKhau

  return (
    <div
      className="relative rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col overflow-hidden"
      onClick={() => onCardClick(khachThue)}
    >
      {/* Color strip */}
      <div className={`h-1.5 w-full shrink-0 ${
        khachThue.trangThai === 'dangThue' ? 'bg-green-500'
        : khachThue.trangThai === 'daTraPhong' ? 'bg-muted-foreground/40'
        : 'bg-border'
      }`} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm text-muted-foreground uppercase">
              {khachThue.hoTen.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">{khachThue.hoTen}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{khachThue.gioiTinh}</div>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {getStatusBadge(khachThue.trangThai)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(khachThue)}>
                    <Eye className="mr-2 h-4 w-4" />Xem chi tiết
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(khachThue)}>
                  <Edit className="mr-2 h-4 w-4" />Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(khachThue._id!)}
                  disabled={actionLoading === `delete-${khachThue._id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {actionLoading === `delete-${khachThue._id}` ? 'Đang xóa...' : 'Xóa'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="border-t" />

        {/* Thông tin liên hệ */}
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">{khachThue.soDienThoai}</span>
          </div>
          {khachThue.email && (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{khachThue.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono">{khachThue.cccd}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{khachThue.queQuan}</span>
          </div>
        </div>

        <div className="border-t" />

        {/* Phòng + tài khoản */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {phong ? (
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold w-fit">
                <Home className="h-3 w-3" />{phong.maPhong}
              </div>
              {toaNha && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium w-fit">
                  <Building2 className="h-3 w-3" />{toaNha.tenToaNha}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
              <Home className="h-3 w-3" />Chưa thuê
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Key className={`h-3.5 w-3.5 ${hasPassword ? 'text-green-600' : 'text-muted-foreground'}`} />
            {hasPassword ? (
              <Badge variant="default" className="gap-1 bg-green-600 text-xs px-1.5 py-0">
                <Check className="h-3 w-3" />Đã tạo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0">
                <X className="h-3 w-3" />Chưa tạo
              </Badge>
            )}
          </div>
        </div>

        {/* Hint click */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60 justify-center pt-1">
          <FileText className="h-3 w-3" />
          <span>Click để xem đầy đủ thông tin</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KhachThueDataTable(props: KhachThueDataTableProps) {
  const {
    data: initialData,
    searchTerm,
    onSearchChange,
    selectedTrangThai,
    onTrangThaiChange,
    onView,
    onEdit,
    onDelete,
    actionLoading,
  } = props

  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(12)
  const [selectedKhachThue, setSelectedKhachThue] = React.useState<KhachThue | null>(null)

  React.useEffect(() => {
    setPageIndex(0)
  }, [searchTerm, selectedTrangThai])

  const pageCount = Math.max(1, Math.ceil(initialData.length / pageSize))
  const paginatedData = initialData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT, CCCD..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedTrangThai} onValueChange={onTrangThaiChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="dangThue">Đang thuê</SelectItem>
              <SelectItem value="daTraPhong">Đã trả phòng</SelectItem>
              <SelectItem value="chuaThue">Chưa thuê</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((kt) => (
            <KhachThueCard
              key={kt._id}
              khachThue={kt}
              onCardClick={setSelectedKhachThue}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border text-muted-foreground text-sm">
          Không có dữ liệu
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground text-sm hidden lg:block">
          Hiển thị {paginatedData.length} / {initialData.length} khách thuê
        </div>
        <div className="flex items-center gap-6 ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">Mỗi trang</Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0) }}
            >
              <SelectTrigger size="sm" className="w-20" id="page-size">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[8, 12, 20, 40].map((s) => (
                  <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-medium">Trang {pageIndex + 1} / {pageCount}</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex" onClick={() => setPageIndex(0)} disabled={!canPrev}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageIndex(i => i - 1)} disabled={!canPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageIndex(i => i + 1)} disabled={!canNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex" onClick={() => setPageIndex(pageCount - 1)} disabled={!canNext}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      <KhachThueDetailModal
        khachThue={selectedKhachThue}
        open={!!selectedKhachThue}
        onClose={() => setSelectedKhachThue(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        actionLoading={actionLoading}
      />
    </div>
  )
}