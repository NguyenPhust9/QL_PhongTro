"use client"

import * as React from "react"
import {
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  FileText,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  Search,
  Building2,
  User,
  Clock,
  BadgeAlert,
  CreditCard,
  X,
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
import type { HopDong, Phong, KhachThue, ToaNha } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'hoatDong':
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100 border-0 font-medium">
          <CircleCheck className="h-3 w-3" />Hoạt động
        </Badge>
      )
    case 'hetHan':
      return (
        <Badge className="gap-1 bg-red-100 text-red-800 hover:bg-red-100 border-0 font-medium">
          <Calendar className="h-3 w-3" />Hết hạn
        </Badge>
      )
    case 'daHuy':
      return <Badge className="gap-1 bg-gray-100 text-gray-700 border-0 font-medium">Đã hủy</Badge>
    default:
      return <Badge className="gap-1 bg-gray-100 text-gray-700 border-0">{status}</Badge>
  }
}

const getPhongName = (phong: string | { maPhong: string }, phongList: Phong[]) => {
  if (typeof phong === 'object' && phong?.maPhong) return phong.maPhong
  return phongList.find(p => p._id === phong)?.maPhong || 'N/A'
}

const getKhachThueName = (khachThue: string | { hoTen: string }, khachThueList: KhachThue[]) => {
  if (typeof khachThue === 'object' && khachThue?.hoTen) return khachThue.hoTen
  return khachThueList.find(k => k._id === khachThue)?.hoTen || 'N/A'
}

const getToaNhaName = (
  phong: string | { toaNha?: { tenToaNha: string } | string },
  phongList: Phong[],
  toaNhaList: ToaNha[]
) => {
  if (typeof phong === 'object' && phong?.toaNha) {
    if (typeof phong.toaNha === 'object') return phong.toaNha.tenToaNha
    return toaNhaList.find(t => t._id === phong.toaNha)?.tenToaNha || 'N/A'
  }
  const phongObj = phongList.find(p => p._id === phong)
  if (!phongObj) return 'N/A'
  return toaNhaList.find(t => t._id === phongObj.toaNha)?.tenToaNha || 'N/A'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type HopDongTableProps = {
  phongList: Phong[]
  khachThueList: KhachThue[]
  toaNhaList: ToaNha[]
  onView: (hopDong: HopDong) => void
  onEdit: (hopDong: HopDong) => void
  onDelete: (id: string) => void
  onDownload: (hopDong: HopDong) => void
  onGiaHan: (hopDong: HopDong) => void
  onHuy: (hopDong: HopDong) => void
  actionLoading: string | null
}

type HopDongDataTableProps = HopDongTableProps & {
  data: HopDong[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  statusFilter?: string
  onStatusChange?: (value: string) => void
  toaNhaFilter?: string
  onToaNhaChange?: (value: string) => void
  allToaNhaList?: ToaNha[]
}

// ─── Modal chi tiết ───────────────────────────────────────────────────────────

function HopDongDetailModal({
  hopDong,
  open,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  onGiaHan,
  onHuy,
  actionLoading,
  phongList,
  khachThueList,
  toaNhaList,
}: {
  hopDong: HopDong | null
  open: boolean
  onClose: () => void
} & HopDongTableProps) {
  if (!hopDong) return null

  const today = new Date()
  const endDate = new Date(hopDong.ngayKetThuc)
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const expiring = daysRemaining > 0 && daysRemaining <= 60

  const phongName = getPhongName(hopDong.phong, phongList)
  const toaNhaName = getToaNhaName(hopDong.phong, phongList, toaNhaList)

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    highlight,
  }: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
    highlight?: boolean
  }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className={`text-sm font-medium break-words ${highlight ? 'text-red-500' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 pb-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{hopDong.maHopDong}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getStatusBadge(hopDong.trangThai)}
                {expiring && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <BadgeAlert className="h-3 w-3" />Sắp hết hạn
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Phòng & tòa nhà */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Phòng & Tòa nhà
          </p>
          <InfoRow icon={Building2} label="Phòng" value={phongName} />
          <InfoRow icon={Building2} label="Tòa nhà" value={toaNhaName} />
        </div>

        <Separator />

        {/* Khách thuê */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Khách thuê
          </p>
          {hopDong.khachThueId.map((kt, idx) => (
            <InfoRow
              key={idx}
              icon={User}
              label={idx === 0 ? 'Người đại diện' : `Người thuê ${idx + 1}`}
              value={getKhachThueName(kt, khachThueList)}
            />
          ))}
        </div>

        <Separator />

        {/* Thời hạn */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Thời hạn hợp đồng
          </p>
          <InfoRow
            icon={Clock}
            label="Ngày bắt đầu"
            value={new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}
          />
          <InfoRow
            icon={Clock}
            label="Ngày kết thúc"
            value={new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}
            highlight={expiring}
          />
        </div>

        <Separator />

        {/* Tài chính */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Tài chính
          </p>
          <InfoRow
            icon={CreditCard}
            label="Giá thuê / tháng"
            value={
              <span className="text-blue-600 font-bold text-base">
                {formatCurrency(hopDong.giaThue)}
              </span>
            }
          />
          {(hopDong as any).tienCoc && (
            <InfoRow
              icon={CreditCard}
              label="Tiền cọc"
              value={formatCurrency((hopDong as any).tienCoc)}
            />
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { onEdit(hopDong); onClose() }}
          >
            <Edit className="mr-2 h-4 w-4" />Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onDownload(hopDong)}
          >
            <Download className="mr-2 h-4 w-4" />Tải xuống
          </Button>
          {hopDong.trangThai === 'hoatDong' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { onGiaHan(hopDong); onClose() }}
              >
                <Calendar className="mr-2 h-4 w-4" />Gia hạn
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => { onHuy(hopDong); onClose() }}
              >
                <X className="mr-2 h-4 w-4" />Hủy HĐ
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => { onDelete(hopDong._id!); onClose() }}
            disabled={actionLoading === `delete-${hopDong._id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {actionLoading === `delete-${hopDong._id}` ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card đơn ─────────────────────────────────────────────────────────────────

function HopDongCard({
  hopDong,
  onCardClick,
  phongList,
  khachThueList,
  toaNhaList,
  onEdit,
  onDelete,
  onDownload,
  onGiaHan,
  onHuy,
  onView,
  actionLoading,
}: { hopDong: HopDong; onCardClick: (h: HopDong) => void } & HopDongTableProps) {
  const today = new Date()
  const endDate = new Date(hopDong.ngayKetThuc)
  const startDate = new Date(hopDong.ngayBatDau)
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiredNow = daysRemaining <= 0
  const isWarning = daysRemaining > 0 && daysRemaining <= 60
  const barPercent = isExpiredNow ? 0 : Math.min(100, Math.round((daysRemaining / totalDays) * 100))

  const phongName = getPhongName(hopDong.phong, phongList)
  const toaNhaName = getToaNhaName(hopDong.phong, phongList, toaNhaList)
  const khachThueName = getKhachThueName(hopDong.khachThueId[0], khachThueList)
  const extraCount = hopDong.khachThueId.length - 1

  const stripColor =
    hopDong.trangThai === 'hoatDong'
      ? isWarning ? 'bg-red-400' : 'bg-green-500'
      : hopDong.trangThai === 'hetHan' ? 'bg-red-400' : 'bg-gray-300'

  return (
    <div
      className="relative rounded-xl border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col overflow-hidden cursor-pointer"
      onClick={() => onCardClick(hopDong)}
    >
      <div className={`h-1.5 w-full shrink-0 ${stripColor}`} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-sm text-blue-600 leading-tight">
              {hopDong.maHopDong}
            </div>
            {isWarning && (
              <div className="flex items-center gap-1 text-xs text-red-500 font-medium mt-0.5">
                <BadgeAlert className="h-3 w-3" />Sắp hết hạn
              </div>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {getStatusBadge(hopDong.trangThai)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onView(hopDong)}>
                  <Eye className="mr-2 h-4 w-4" />Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(hopDong)}>
                  <Edit className="mr-2 h-4 w-4" />Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(hopDong)}>
                  <Download className="mr-2 h-4 w-4" />Tải xuống
                </DropdownMenuItem>
                {hopDong.trangThai === 'hoatDong' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onGiaHan(hopDong)}>
                      <Calendar className="mr-2 h-4 w-4" />Gia hạn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onHuy(hopDong)}>
                      <FileText className="mr-2 h-4 w-4" />Hủy hợp đồng
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(hopDong._id!)}
                  disabled={actionLoading === `delete-${hopDong._id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {actionLoading === `delete-${hopDong._id}` ? 'Đang xóa...' : 'Xóa'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="border-t" />

        {/* Phòng & khách thuê */}
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">{phongName}</span>
            <span>·</span>
            <span className="truncate">{toaNhaName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">{khachThueName}</span>
            {extraCount > 0 && <span>+{extraCount} người</span>}
          </div>
        </div>

        <div className="border-t" />

        {/* Số ngày còn lại */}
        <div className={`rounded-lg px-3 py-2 text-xs space-y-1.5 ${
          isExpiredNow
            ? 'bg-gray-100'
            : isWarning
            ? 'bg-red-50 border border-red-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 font-medium ${
              isExpiredNow ? 'text-gray-500' : isWarning ? 'text-red-600' : 'text-green-700'
            }`}>
              <Clock className="h-3.5 w-3.5" />
              {isExpiredNow
                ? `Hết hạn ${Math.abs(daysRemaining)} ngày trước`
                : 'Còn lại'}
            </span>
            {!isExpiredNow && (
              <span className={`font-bold text-sm ${isWarning ? 'text-red-700' : 'text-green-700'}`}>
                {daysRemaining}{' '}
                <span className="font-normal text-xs text-muted-foreground">/ {totalDays} ngày</span>
              </span>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isExpiredNow ? 'w-0' : isWarning ? 'bg-red-400' : 'bg-green-400'
              }`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>

        <div className="border-t" />

        {/* Giá thuê */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Giá thuê / tháng</span>
          <span className="text-sm font-bold text-blue-600">{formatCurrency(hopDong.giaThue)}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground/60 justify-center pt-1">
          <FileText className="h-3 w-3" />
          <span>Click để xem đầy đủ thông tin</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HopDongDataTable(props: HopDongDataTableProps) {
  const {
    data: initialData,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    toaNhaFilter,
    onToaNhaChange,
    allToaNhaList,
    ...tableProps
  } = props

  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(12)
  const [selectedHopDong, setSelectedHopDong] = React.useState<HopDong | null>(null)

  React.useEffect(() => {
    setPageIndex(0)
  }, [searchTerm, statusFilter, toaNhaFilter])

  const pageCount = Math.max(1, Math.ceil(initialData.length / pageSize))
  const paginatedData = initialData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <div className="w-full space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="flex-1 sm:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã hợp đồng, số phòng"
                value={searchTerm || ''}
                onChange={e => onSearchChange?.(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-300"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-300">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="hoatDong">Hoạt động</SelectItem>
              <SelectItem value="hetHan">Hết hạn</SelectItem>
              <SelectItem value="daHuy">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={toaNhaFilter} onValueChange={onToaNhaChange}>
            <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-300">
              <SelectValue placeholder="Tòa nhà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {allToaNhaList?.map(t => (
                <SelectItem key={t._id} value={t._id!}>{t.tenToaNha}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map(hd => (
            <HopDongCard
              key={hd._id}
              hopDong={hd}
              onCardClick={setSelectedHopDong}
              {...tableProps}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-40 items-center justify-center rounded-lg border text-muted-foreground text-sm gap-2">
          <FileText className="h-8 w-8 text-gray-300" />
          Không có dữ liệu
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 py-2 bg-white border-t rounded-b-lg">
        <div className="text-muted-foreground text-sm hidden lg:block">
          Hiển thị {paginatedData.length} / {initialData.length} hợp đồng
        </div>
        <div className="flex items-center gap-6 ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">Mỗi trang</Label>
            <Select value={`${pageSize}`} onValueChange={v => { setPageSize(Number(v)); setPageIndex(0) }}>
              <SelectTrigger size="sm" className="w-20" id="page-size">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[8, 12, 20, 40].map(s => (
                  <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-bold text-gray-700">Trang {pageIndex + 1} / {pageCount}</div>
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
      <HopDongDetailModal
        hopDong={selectedHopDong}
        open={!!selectedHopDong}
        onClose={() => setSelectedHopDong(null)}
        {...tableProps}
      />
    </div>
  )
}
