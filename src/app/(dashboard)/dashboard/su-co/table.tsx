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
  Calendar,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Home,
  ImageOff,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { KhachThue, Phong, SuCo } from "@/types"

// Helper functions
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'moi':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Mới
        </Badge>
      )
    case 'dangXuLy':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Đang xử lý
        </Badge>
      )
    case 'daXong':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Đã xong
        </Badge>
      )
    case 'daHuy':
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3" />
          Đã hủy
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'dienNuoc':
      return <Badge variant="secondary">Điện nước</Badge>
    case 'noiThat':
      return <Badge variant="outline">Nội thất</Badge>
    case 'vesinh':
      return <Badge variant="outline">Vệ sinh</Badge>
    case 'anNinh':
      return <Badge variant="outline">An ninh</Badge>
    case 'khac':
      return <Badge variant="outline">Khác</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'thap':
      return <Badge variant="outline" className="border-gray-400 text-gray-700">Thấp</Badge>
    case 'trungBinh':
      return <Badge variant="secondary">Trung bình</Badge>
    case 'cao':
      return <Badge variant="destructive">Cao</Badge>
    case 'khancap':
      return (
        <Badge variant="destructive" className="bg-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Khẩn cấp
        </Badge>
      )
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

type PhongValue = string | Partial<Phong> | null | undefined
type KhachThueValue = string | Partial<KhachThue> | null | undefined

const getPhongName = (phong: PhongValue, phongList: Phong[]) => {
  if (!phong) return "N/A"

  if (typeof phong === "string") {
    const phongObj = phongList.find((p) => p._id === phong)
    return phongObj?.maPhong || "N/A"
  }

  return phong.maPhong || "N/A"
}

const getKhachThueName = (khachThue: KhachThueValue, khachThueList: KhachThue[]) => {
  if (!khachThue) return "N/A"

  if (typeof khachThue === "string") {
    const khachThueObj = khachThueList.find((k) => k._id === khachThue)
    return khachThueObj?.hoTen || "N/A"
  }

  return khachThue.hoTen || "N/A"
}

const getKhachThuePhone = (khachThue: KhachThueValue) => {
  if (!khachThue || typeof khachThue === "string") return null

  return "soDienThoai" in khachThue ? String(khachThue.soDienThoai || "") : null
}

const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// ── Chi tiết sự cố popup ─────────────────────────────────────────────────────
function SuCoDetailDialog({
  suCo,
  phongList,
  khachThueList,
  open,
  onClose,
}: {
  suCo: SuCo | null
  phongList: Phong[]
  khachThueList: KhachThue[]
  open: boolean
  onClose: () => void
}) {
  const [previewImg, setPreviewImg] = React.useState<string | null>(null)

  if (!suCo) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold leading-snug pr-6">
              {suCo.tieuDe}
            </DialogTitle>
            <DialogDescription className="sr-only">Chi tiết sự cố</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(suCo.trangThai)}
              {getTypeBadge(suCo.loaiSuCo)}
              {getPriorityBadge(suCo.mucDoUuTien)}
            </div>

            {/* Thông tin chính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Phòng
                </p>
                <div className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {getPhongName(suCo.phong as PhongValue, phongList)}
                  </p>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Khách thuê
                </p>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {getKhachThueName(suCo.khachThue as KhachThueValue, khachThueList)}
                  </p>
                </div>
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Ngày báo cáo
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {formatDateTime(suCo.ngayBaoCao)}
                  </p>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mô tả chi tiết
              </p>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {suCo.moTa}
              </p>
            </div>

            {/* Ghi chú xử lý */}
            {suCo.ghiChuXuLy && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Ghi chú xử lý
                </p>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {suCo.ghiChuXuLy}
                </p>
              </div>
            )}

            {/* Hình ảnh */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Hình ảnh sự cố
              </p>
              {suCo.anhSuCo && suCo.anhSuCo.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {suCo.anhSuCo.map((anh, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setPreviewImg(anh)}
                      className="group relative aspect-video overflow-hidden rounded-md border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <img
                        src={anh}
                        alt={`Hình ảnh ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                        <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic py-3">
                  <ImageOff className="h-4 w-4" />
                  Không có hình ảnh
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox preview */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Xem ảnh</DialogTitle>
          </DialogHeader>
          {previewImg && (
            <img
              src={previewImg}
              alt="Xem ảnh lớn"
              className="w-full max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Kéo để sắp xếp</span>
    </Button>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SuCoTableProps = {
  phongList: Phong[]
  khachThueList: KhachThue[]
  onView?: (suCo: SuCo) => void
  onEdit: (suCo: SuCo) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => void
}

// ── Columns ───────────────────────────────────────────────────────────────────
const createColumns = (props: SuCoTableProps): ColumnDef<SuCo>[] => [
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
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tieuDe",
    header: "Tiêu đề",
    cell: ({ row }) => (
      <div className="min-w-48">
        <div className="font-medium">{row.original.tieuDe}</div>
        <div className="text-sm text-muted-foreground truncate max-w-xs">
          {row.original.moTa}
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "phong",
    header: "Phòng",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {getPhongName(row.original.phong as PhongValue, props.phongList)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "khachThue",
    header: "Khách thuê",
    cell: ({ row }) => {
      const khachThue = row.original.khachThue as KhachThueValue
      const soDienThoai = getKhachThuePhone(khachThue)

      return (
        <div className="min-w-32">
          <div className="font-medium">
            {getKhachThueName(khachThue, props.khachThueList)}
          </div>
          {soDienThoai && (
            <div className="text-xs text-muted-foreground">{soDienThoai}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "loaiSuCo",
    header: "Loại",
    cell: ({ row }) => getTypeBadge(row.original.loaiSuCo),
  },
  {
    accessorKey: "mucDoUuTien",
    header: "Mức độ",
    cell: ({ row }) => getPriorityBadge(row.original.mucDoUuTien),
  },
  {
    accessorKey: "trangThai",
    header: "Trạng thái",
    cell: ({ row }) => {
      const suCo = row.original
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {getStatusBadge(suCo.trangThai)}
          {suCo.trangThai === 'moi' && (
            <Select
              value={suCo.trangThai}
              onValueChange={(value) => props.onStatusChange(suCo._id!, value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dangXuLy">Xử lý</SelectItem>
                <SelectItem value="daHuy">Hủy</SelectItem>
              </SelectContent>
            </Select>
          )}
          {suCo.trangThai === 'dangXuLy' && (
            <Select
              value={suCo.trangThai}
              onValueChange={(value) => props.onStatusChange(suCo._id!, value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daXong">Hoàn thành</SelectItem>
                <SelectItem value="daHuy">Hủy</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "ngayBaoCao",
    header: "Ngày báo cáo",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {new Date(row.original.ngayBaoCao).toLocaleDateString('vi-VN')}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">Mở menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {props.onView && (
              <DropdownMenuItem onClick={() => props.onView!(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => props.onEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => props.onDelete(row.original._id!)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableHiding: false,
  },
]

// ── DraggableRow ──────────────────────────────────────────────────────────────
function DraggableRow({
  row,
  onRowClick,
}: {
  row: Row<SuCo>
  onRowClick?: (suCo: SuCo) => void
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id!,
  })

  const handleClick = (e: React.MouseEvent) => {
    // Không mở popup khi click vào interactive elements
    const target = e.target as HTMLElement
    const isInteractive = target.closest(
      'button, input, [role="checkbox"], [role="combobox"], [data-radix-collection-item], a'
    )
    if (!isInteractive && !isDragging && onRowClick) {
      onRowClick(row.original)
    }
  }

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 cursor-pointer hover:bg-muted/50 transition-colors"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={handleClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// ── SuCoDataTable ─────────────────────────────────────────────────────────────
type SuCoDataTableProps = SuCoTableProps & {
  data: SuCo[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  statusFilter?: string
  onStatusFilterChange?: (value: string) => void
  typeFilter?: string
  onTypeChange?: (value: string) => void
  priorityFilter?: string
  onPriorityChange?: (value: string) => void
}

export function SuCoDataTable(props: SuCoDataTableProps) {
  const {
    data: initialData,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeChange,
    priorityFilter,
    onPriorityChange,
    ...tableProps
  } = props

  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  // State popup chi tiết
  const [viewingSuCo, setViewingSuCo] = React.useState<SuCo | null>(null)

  const handleView = React.useCallback((suCo: SuCo) => {
    setViewingSuCo(suCo)
    props.onView?.(suCo)
  }, [props.onView])

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Override onView để dùng internal handler
  const columns = React.useMemo(
    () => createColumns({ ...tableProps, onView: handleView }),
    [
      tableProps.phongList,
      tableProps.khachThueList,
      tableProps.onEdit,
      tableProps.onDelete,
      tableProps.onStatusChange,
      handleView,
    ]
  )

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ _id }) => _id!) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
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

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="flex-1 sm:max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm tiêu đề, mô tả..."
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="moi">Mới</SelectItem>
                <SelectItem value="dangXuLy">Đang xử lý</SelectItem>
                <SelectItem value="daXong">Đã xong</SelectItem>
                <SelectItem value="daHuy">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="dienNuoc">Điện nước</SelectItem>
                <SelectItem value="noiThat">Nội thất</SelectItem>
                <SelectItem value="vesinh">Vệ sinh</SelectItem>
                <SelectItem value="anNinh">An ninh</SelectItem>
                <SelectItem value="khac">Khác</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="thap">Thấp</SelectItem>
                <SelectItem value="trungBinh">Trung bình</SelectItem>
                <SelectItem value="cao">Cao</SelectItem>
                <SelectItem value="khancap">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
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
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} onRowClick={handleView} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {selectedCount > 0 ? (
              <>Đã chọn {selectedCount} trong {table.getFilteredRowModel().rows.length} hàng</>
            ) : (
              <>Hiển thị {table.getFilteredRowModel().rows.length} hàng</>
            )}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Số hàng mỗi trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Trang {table.getPageCount() === 0 ? 0 : table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang đầu</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang trước</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang sau</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang cuối</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup chi tiết sự cố */}
      <SuCoDetailDialog
        suCo={viewingSuCo}
        phongList={props.phongList}
        khachThueList={props.khachThueList}
        open={!!viewingSuCo}
        onClose={() => setViewingSuCo(null)}
      />
    </>
  )
}
