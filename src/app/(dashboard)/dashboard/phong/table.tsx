"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Edit,
  Trash2,
  Eye,
  Home,
  Building2,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  AlertCircle,
  Image as ImageIcon,
  Ban,
  Search,
  User,
  Users,
  LayoutGrid,
  List,
  Phone,
  Ruler,
  Banknote,
  CalendarDays,
  X,
} from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Phong, ToaNha } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return (val % 1 === 0 ? val : val.toFixed(1).replace('.', ',')) + 'M'
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return (val % 1 === 0 ? val : val.toFixed(1).replace('.', ',')) + 'K'
  }
  return amount.toString()
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  trong:     { label: 'Trống',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: <CircleCheck className="h-3 w-3" /> },
  dangThue:  { label: 'Đang thuê', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: <Home className="h-3 w-3" /> },
  daDat:     { label: 'Đã đặt',    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <AlertCircle className="h-3 w-3" /> },
  baoTri:    { label: 'Bảo trì',   color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: <Ban className="h-3 w-3" /> },
}

const getStatusBadge = (status: string) => {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <Badge variant="outline">{status}</Badge>
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.color, cfg.bg)}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

const getToaNhaName = (toaNha: string | { tenToaNha: string }, toaNhaList: ToaNha[]) => {
  if (typeof toaNha === 'object' && toaNha?.tenToaNha) return toaNha.tenToaNha
  return toaNhaList.find(t => t._id === toaNha)?.tenToaNha || 'N/A'
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "card" | "table"

type PhongTableProps = {
  toaNhaList: ToaNha[]
  onView?: (phong: Phong) => void
  onEdit: (phong: Phong) => void
  onDelete: (id: string) => void
  onViewImages?: (phong: Phong) => void
  onViewTenants?: (phong: Phong) => void
}

// ─── Drag Handle ─────────────────────────────────────────────────────────────

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Kéo để sắp xếp</span>
    </Button>
  )
}

// ─── Columns (unchanged) ─────────────────────────────────────────────────────

const createColumns = (props: PhongTableProps): ColumnDef<Phong>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id!} />,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Chọn hàng" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "maPhong",
    header: "Mã phòng",
    cell: ({ row }) => <div className="min-w-24 font-medium">{row.original.maPhong}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "toaNha",
    header: "Tòa nhà",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{getToaNhaName(row.original.toaNha, props.toaNhaList)}</span>
      </div>
    ),
  },
  {
    accessorKey: "tang",
    header: "Tầng",
    cell: ({ row }) => <span className="text-sm">Tầng {row.original.tang}</span>,
  },
  {
    accessorKey: "dienTich",
    header: () => <div className="text-right">Diện tích</div>,
    cell: ({ row }) => <div className="text-right text-sm">{row.original.dienTich} m²</div>,
  },
  {
    accessorKey: "giaThue",
    header: () => <div className="text-right">Giá thuê</div>,
    cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.giaThue)}</div>,
  },
  {
    accessorKey: "tienCoc",
    header: () => <div className="text-right">Tiền cọc</div>,
    cell: ({ row }) => <div className="text-right text-sm">{formatCurrency(row.original.tienCoc)}</div>,
  },
  {
    accessorKey: "trangThai",
    header: "Trạng thái",
    cell: ({ row }) => getStatusBadge(row.original.trangThai),
  },
  {
    accessorKey: "nguoiThue",
    header: "Người thuê",
    cell: ({ row }) => {
      const phong = row.original as any
      const hopDong = phong.hopDongHienTai
      if (!hopDong || !hopDong.khachThueId || hopDong.khachThueId.length === 0) {
        return <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span className="text-sm">Chưa cho thuê</span></div>
      }
      const nguoiDaiDien = hopDong.nguoiDaiDien
      const soLuong = hopDong.khachThueId.length
      return (
        <div className="min-w-40">
          <div className="flex items-center gap-2 mb-1">
            {soLuong > 1 ? <Users className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-blue-600" />}
            <div>
              <div className="text-sm font-medium">{nguoiDaiDien?.hoTen || 'N/A'}</div>
              {nguoiDaiDien?.soDienThoai && <div className="text-xs text-muted-foreground">{nguoiDaiDien.soDienThoai}</div>}
            </div>
          </div>
          {soLuong > 1 && (
            <Button variant="link" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0 pl-6" onClick={() => props.onViewTenants?.(row.original)}>
              +{soLuong - 1} người ở cùng
            </Button>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "anhPhong",
    header: "Ảnh",
    cell: ({ row }) => {
      const count = row.original.anhPhong?.length || 0
      return count > 0
        ? <Button variant="outline" size="sm" onClick={() => props.onViewImages?.(row.original)}><ImageIcon className="h-4 w-4 mr-1" />{count}</Button>
        : <span className="text-muted-foreground text-sm">-</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
            <MoreVertical className="size-4" /><span className="sr-only">Mở menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {props.onView && (
            <DropdownMenuItem onClick={() => props.onView!(row.original)}><Eye className="mr-2 h-4 w-4" />Xem chi tiết</DropdownMenuItem>
          )}
          {row.original.anhPhong && row.original.anhPhong.length > 0 && (
            <DropdownMenuItem onClick={() => props.onViewImages?.(row.original)}><ImageIcon className="mr-2 h-4 w-4" />Xem ảnh ({row.original.anhPhong.length})</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => props.onEdit(row.original)}><Edit className="mr-2 h-4 w-4" />Chỉnh sửa</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => props.onDelete(row.original._id!)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
]

// ─── Draggable Table Row ──────────────────────────────────────────────────────

function DraggableRow({ row }: { row: Row<Phong> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original._id! })
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 w-32">
        {icon && <span className="shrink-0">{icon}</span>}
        {label}
      </div>
      <div className="text-sm font-medium text-right flex-1">{value}</div>
    </div>
  )
}

function PhongDetailModal({
  phong,
  open,
  onClose,
  toaNhaList,
  onEdit,
  onViewImages,
  onViewTenants,
}: {
  phong: Phong | null
  open: boolean
  onClose: () => void
  toaNhaList: ToaNha[]
  onEdit: (p: Phong) => void
  onViewImages?: (p: Phong) => void
  onViewTenants?: (p: Phong) => void
}) {
  if (!phong) return null

  const item = phong as any
  const hopDong = item.hopDongHienTai
  const hasNguoiThue = hopDong?.khachThueId?.length > 0
  const nguoiDaiDien = hopDong?.nguoiDaiDien
  const soLuong = hopDong?.khachThueId?.length || 0
  const imageCount = phong.anhPhong?.length || 0
  const cfg = STATUS_CONFIG[phong.trangThai]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header stripe */}
        <div className={cn("h-1.5 w-full", {
          'bg-green-500': phong.trangThai === 'trong',
          'bg-blue-500': phong.trangThai === 'dangThue',
          'bg-orange-400': phong.trangThai === 'daDat',
          'bg-red-500': phong.trangThai === 'baoTri',
        })} />

        {/* Modal header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold tracking-tight">{phong.maPhong}</span>
              {getStatusBadge(phong.trangThai)}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {getToaNhaName(phong.toaNha, toaNhaList)} · Tầng {phong.tang}
            </p>
          </div>
        </div>

        <Separator />

        {/* Body */}
        <div className="px-6 py-1 max-h-[60vh] overflow-y-auto">
          {/* Thông tin phòng */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-1">Thông tin phòng</p>
          <InfoRow label="Diện tích" icon={<Ruler className="h-3.5 w-3.5" />} value={`${phong.dienTich} m²`} />
          <Separator className="opacity-50" />
          <InfoRow label="Giá thuê" icon={<Banknote className="h-3.5 w-3.5" />} value={
            <span className="text-blue-600 font-semibold">{formatCurrency(phong.giaThue)}</span>
          } />
          <Separator className="opacity-50" />
          <InfoRow label="Tiền cọc" icon={<Banknote className="h-3.5 w-3.5" />} value={formatCurrency(phong.tienCoc)} />
          {phong.moTa && (
            <>
              <Separator className="opacity-50" />
              <InfoRow label="Mô tả" value={<span className="text-muted-foreground font-normal">{phong.moTa}</span>} />
            </>
          )}

          {/* Tiện nghi */}
          {(phong as any).tienNghi?.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-5 pb-2">Tiện nghi</p>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {(phong as any).tienNghi.map((t: string) => (
                  <span key={t} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-muted/50">{t}</span>
                ))}
              </div>
            </>
          )}

          {/* Người thuê */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-5 pb-1">Người thuê</p>
          {hasNguoiThue ? (
            <div className="rounded-xl border bg-muted/20 p-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {soLuong > 1 ? <Users className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{nguoiDaiDien?.hoTen || 'N/A'}</p>
                  {nguoiDaiDien?.soDienThoai && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{nguoiDaiDien.soDienThoai}
                    </p>
                  )}
                </div>
                {soLuong > 1 && (
                  <Button variant="outline" size="sm" className="text-xs h-7 shrink-0" onClick={() => { onClose(); onViewTenants?.(phong) }}>
                    +{soLuong - 1} người
                  </Button>
                )}
              </div>
              {hopDong?.ngayBatDau && (
                <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Từ {new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}
                  {hopDong?.ngayKetThuc && <> đến {new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}</>}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/10 p-4 text-center mb-2">
              <User className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
              <p className="text-xs text-muted-foreground">Chưa có người thuê</p>
            </div>
          )}

          <div className="pb-4" />
        </div>

        <Separator />

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center justify-between gap-2 bg-muted/20">
          <div className="flex gap-2">
            {imageCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => { onClose(); onViewImages?.(phong) }}>
                <ImageIcon className="h-4 w-4 mr-1.5" />{imageCount} ảnh
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
            <Button size="sm" onClick={() => { onClose(); onEdit(phong) }}>
              <Edit className="h-4 w-4 mr-1.5" />Chỉnh sửa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card View ───────────────────────────────────────────────────────────────

function PhongCard({ row, tableProps, onCardClick }: { row: Row<Phong>; tableProps: PhongTableProps; onCardClick: (p: Phong) => void }) {
  const item = row.original
  const phong = item as any
  const hopDong = phong.hopDongHienTai
  const hasNguoiThue = hopDong?.khachThueId?.length > 0
  const nguoiDaiDien = hopDong?.nguoiDaiDien
  const soLuong = hopDong?.khachThueId?.length || 0
  const imageCount = item.anhPhong?.length || 0
  const cfg = STATUS_CONFIG[item.trangThai]

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md flex flex-col overflow-hidden cursor-pointer",
        row.getIsSelected() && "ring-2 ring-primary"
      )}
      onClick={() => onCardClick(item)}
    >
      {/* Status stripe */}
      <div className={cn("h-1 w-full", {
        'bg-green-500': item.trangThai === 'trong',
        'bg-blue-500': item.trangThai === 'dangThue',
        'bg-orange-400': item.trangThai === 'daDat',
        'bg-red-500': item.trangThai === 'baoTri',
      })} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Chọn"
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="min-w-0">
              <p className="font-bold text-sm">{item.maPhong}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                {getToaNhaName(item.toaNha, tableProps.toaNhaList)} · Tầng {item.tang}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {getStatusBadge(item.trangThai)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {tableProps.onView && (
                  <DropdownMenuItem onClick={() => tableProps.onView!(item)}><Eye className="mr-2 h-4 w-4" />Xem chi tiết</DropdownMenuItem>
                )}
                {imageCount > 0 && (
                  <DropdownMenuItem onClick={() => tableProps.onViewImages?.(item)}><ImageIcon className="mr-2 h-4 w-4" />Xem ảnh ({imageCount})</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => tableProps.onEdit(item)}><Edit className="mr-2 h-4 w-4" />Chỉnh sửa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => tableProps.onDelete(item._id!)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-xs text-muted-foreground">Diện tích</p>
            <p className="text-sm font-semibold">{item.dienTich} m²</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-xs text-muted-foreground">Giá thuê</p>
            <p className="text-sm font-semibold text-blue-600 leading-tight">
              {formatCompact(item.giaThue)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-xs text-muted-foreground">Tiền cọc</p>
            <p className="text-sm font-semibold leading-tight">
              {formatCompact(item.tienCoc)}
            </p>
          </div>
        </div>

        {/* Tenant */}
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20 min-h-[44px]">
          {hasNguoiThue ? (
            <>
              {soLuong > 1 ? <Users className="h-4 w-4 text-blue-500 shrink-0" /> : <User className="h-4 w-4 text-blue-500 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{nguoiDaiDien?.hoTen || 'N/A'}</p>
                {nguoiDaiDien?.soDienThoai && <p className="text-xs text-muted-foreground">{nguoiDaiDien.soDienThoai}</p>}
              </div>
              {soLuong > 1 && (
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-auto px-1 py-0 shrink-0" onClick={(e) => { e.stopPropagation(); tableProps.onViewTenants?.(item) }}>
                  +{soLuong - 1}
                </Button>
              )}
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Chưa có người thuê</span>
            </>
          )}
        </div>

        {/* Footer actions */}
        {imageCount > 0 && (
          <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={(e) => { e.stopPropagation(); tableProps.onViewImages?.(item) }}>
            <ImageIcon className="h-3 w-3 mr-1.5" />{imageCount} ảnh
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PhongDataTableProps = PhongTableProps & {
  data: Phong[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  selectedToaNha?: string
  onToaNhaChange?: (value: string) => void
  selectedTrangThai?: string
  onTrangThaiChange?: (value: string) => void
  allToaNhaList?: ToaNha[]
}

export function PhongDataTable(props: PhongDataTableProps) {
  const {
    data: initialData, searchTerm, onSearchChange,
    selectedToaNha, onToaNhaChange,
    selectedTrangThai, onTrangThaiChange,
    allToaNhaList, ...tableProps
  } = props

  const [data, setData] = React.useState(() => initialData)
  const [viewMode, setViewMode] = React.useState<ViewMode>("card")
  const [selectedPhong, setSelectedPhong] = React.useState<Phong | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 12 })

  React.useEffect(() => { setData(initialData) }, [initialData])

  const columns = React.useMemo(() => createColumns(tableProps), [tableProps])
  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ _id }) => _id!) || [], [data])

  const table = useReactTable({
    data, columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row._id!,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const currentRows = table.getRowModel().rows

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="flex-1 sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm theo mã phòng, mô tả..." value={searchTerm || ''} onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Select value={selectedToaNha} onValueChange={onToaNhaChange}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Chọn tòa nhà" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tòa nhà</SelectItem>
              {allToaNhaList?.map((t) => <SelectItem key={t._id} value={t._id!}>{t.tenToaNha}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedTrangThai} onValueChange={onTrangThaiChange}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="trong">Trống</SelectItem>
              <SelectItem value="daDat">Đã đặt</SelectItem>
              <SelectItem value="dangThue">Đang thuê</SelectItem>
              <SelectItem value="baoTri">Bảo trì</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5 bg-muted/50">
            <Button variant={viewMode === "card" ? "default" : "ghost"} size="icon" className="size-7" onClick={() => setViewMode("card")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="icon" className="size-7" onClick={() => setViewMode("table")}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Column visibility — table only */}
          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Tùy chỉnh cột</span>
                  <span className="lg:hidden">Cột</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table.getAllColumns().filter(c => typeof c.accessorFn !== "undefined" && c.getCanHide()).map(c => (
                  <DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>
                    {c.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd} sensors={sensors} id={sortableId}>
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {viewMode === "table" ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {currentRows.length ? (
                    currentRows.map((row) => <DraggableRow key={row.id} row={row} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">Không có dữ liệu</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : currentRows.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {currentRows.map((row) => (
                <PhongCard
                  key={row.id}
                  row={row}
                  tableProps={tableProps}
                  onCardClick={(p) => { setSelectedPhong(p); setModalOpen(true) }}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-lg border text-muted-foreground text-sm">
              Không có dữ liệu
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedCount > 0
            ? <>Đã chọn {selectedCount} / {table.getFilteredRowModel().rows.length} phòng</>
            : <>Hiển thị {table.getFilteredRowModel().rows.length} phòng</>}
        </div>
        <div className="flex w-full items-center gap-6 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium whitespace-nowrap">
              {viewMode === "card" ? "Thẻ mỗi trang" : "Hàng mỗi trang"}
            </Label>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {(viewMode === "card" ? [8, 12, 20, 40] : [10, 20, 30, 40, 50]).map((s) => (
                  <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Trang đầu</span><ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Trang trước</span><ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Trang sau</span><ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Trang cuối</span><ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <PhongDetailModal
        phong={selectedPhong}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toaNhaList={tableProps.toaNhaList}
        onEdit={tableProps.onEdit}
        onViewImages={tableProps.onViewImages}
        onViewTenants={tableProps.onViewTenants}
      />
    </div>
  )
}
