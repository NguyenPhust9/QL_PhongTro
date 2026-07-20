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
  Download,
  Eye,
  Calendar,
  CreditCard,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  Building2,
  Search,
  Users,
  Home,
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
import { toast } from "sonner"
import * as XLSX from "xlsx"


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
import type { HoaDon, ToaNha } from '@/types'
import type { ThanhToanPopulated } from './page'

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getMethodBadge = (method: string) => {
  switch (method) {
    case 'tienMat':
      return (
        <Badge variant="default" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Tiền mặt
        </Badge>
      )
    case 'chuyenKhoan':
      return (
        <Badge variant="secondary" className="gap-1">
          <Building2 className="h-3 w-3" />
          Chuyển khoản
        </Badge>
      )
    case 'viDienTu':
      return (
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Ví điện tử
        </Badge>
      )
    default:
      return <Badge variant="outline">{method}</Badge>
  }
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

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

type ThanhToanTableProps = {
  hoaDonList: HoaDon[]
  onView?: (thanhToan: ThanhToanPopulated) => void
  onEdit: (thanhToan: ThanhToanPopulated) => void
  onDelete: (id: string) => void
  onDownload?: (thanhToan: ThanhToanPopulated) => void
}

const getHoaDonInfo = (hoaDon: string | HoaDon | null, hoaDonList: HoaDon[]) => {
  if (!hoaDon) {
    return 'Hóa đơn đã bị xóa'
  }
  if (typeof hoaDon === 'object' && hoaDon?.maHoaDon) {
    return hoaDon.maHoaDon
  }
  if (typeof hoaDon === 'string') {
    const hoaDonItem = hoaDonList.find(h => h._id === hoaDon)
    return hoaDonItem?.maHoaDon || 'N/A'
  }
  return 'N/A'
}

// Lấy id tòa nhà từ một thanh toán (đi qua hoaDon -> phong -> toaNha)
const getToaNhaIdFromThanhToan = (thanhToan: ThanhToanPopulated): string | null => {
  const hoaDonInfo = thanhToan.hoaDon && typeof thanhToan.hoaDon === 'object' ? thanhToan.hoaDon : null
  const phongInfo = hoaDonInfo && typeof hoaDonInfo.phong === 'object' ? (hoaDonInfo.phong as any) : null
  if (!phongInfo) return null
  const toaNha = phongInfo.toaNha
  if (!toaNha) return null
  if (typeof toaNha === 'object') return toaNha._id || null
  return toaNha
}

const createColumns = (props: ThanhToanTableProps): ColumnDef<ThanhToanPopulated>[] => [
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
    accessorKey: "hoaDon",
    header: "Hóa đơn",
    cell: ({ row }) => {
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      return (
        <div className="min-w-32">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {getHoaDonInfo(row.original.hoaDon, props.hoaDonList)}
            </span>
          </div>
          {hoaDonInfo && (
            <div className="text-xs text-muted-foreground mt-1 ml-6">
              Tháng {hoaDonInfo.thang}/{hoaDonInfo.nam}
            </div>
          )}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "phong",
    header: "Phòng",
    cell: ({ row }) => {
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const phongInfo = hoaDonInfo && typeof hoaDonInfo.phong === 'object' ? (hoaDonInfo.phong as any) : null;
      return (
        <div className="flex items-center gap-2 min-w-24">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {phongInfo?.maPhong || 'N/A'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "khachThue",
    header: "Người đại diện",
    cell: ({ row }) => {
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const khachThueInfo = hoaDonInfo && typeof hoaDonInfo.khachThue === 'object' ? (hoaDonInfo.khachThue as any) : null;
      return (
        <div className="flex items-center gap-2 min-w-32">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {khachThueInfo?.hoTen || 'N/A'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "soTien",
    header: () => <div className="text-right">Số tiền</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.soTien)}
      </div>
    ),
  },
  {
    id: "tienCo",
    header: () => <div className="text-right">Tiền cò (80%)</div>,
    cell: ({ row }) => {
      // Tiền cọc lấy từ hopDong (mỗi hợp đồng có tienCoc riêng), KHÔNG lấy từ phong
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const hopDongInfo = hoaDonInfo && typeof (hoaDonInfo as any).hopDong === 'object' ? ((hoaDonInfo as any).hopDong as any) : null;
      const tienCoc = hopDongInfo?.tienCoc || 0;
      return (
        <div className="text-right text-sm">
          {formatCurrency(tienCoc * 0.8)}
        </div>
      );
    },
  },
  {
    id: "tienThucTe",
    header: () => <div className="text-right">Tiền thực tế (20%)</div>,
    cell: ({ row }) => {
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const hopDongInfo = hoaDonInfo && typeof (hoaDonInfo as any).hopDong === 'object' ? ((hoaDonInfo as any).hopDong as any) : null;
      const tienCoc = hopDongInfo?.tienCoc || 0;
      return (
        <div className="text-right text-sm">
          {formatCurrency(tienCoc * 0.2)}
        </div>
      );
    },
  },
  {
    accessorKey: "phuongThuc",
    header: "Phương thức",
    cell: ({ row }) => getMethodBadge(row.original.phuongThuc),
  },
  {
    id: "tienCoc",
    header: () => <div className="text-right">Tiền cọc</div>,
    cell: ({ row }) => {
      const hoaDonInfo = row.original.hoaDon && typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const hopDongInfo = hoaDonInfo && typeof (hoaDonInfo as any).hopDong === 'object' ? ((hoaDonInfo as any).hopDong as any) : null;
      const tienCoc = hopDongInfo?.tienCoc

      if (tienCoc === undefined || tienCoc === null) {
        return <div className="text-right text-muted-foreground">-</div>
      }

      return (
        <div className="text-right text-sm font-medium">
          {formatCurrency(tienCoc)}
        </div>
      )
    },
  },
  {
    accessorKey: "ngayThanhToan",
    header: "Ngày thanh toán",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {new Date(row.original.ngayThanhToan).toLocaleDateString('vi-VN')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "ghiChu",
    header: "Ghi chú",
    cell: ({ row }) => (
      <div className="max-w-xs truncate text-sm">
        {row.original.ghiChu || '-'}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
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
          {row.original.anhBienLai && props.onDownload && (
            <DropdownMenuItem onClick={() => props.onDownload!(row.original)}>
              <Download className="mr-2 h-4 w-4" />
              Tải biên lai
            </DropdownMenuItem>
          )}
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
    ),
    enableHiding: false,
  },
]

function DraggableRow({ row }: { row: Row<ThanhToanPopulated> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id!,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

type ThanhToanDataTableProps = ThanhToanTableProps & {
  data: ThanhToanPopulated[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  // Giữ lại để tương thích ngược với các nơi đang truyền props này (không còn dùng để lọc)
  methodFilter?: string
  onMethodChange?: (value: string) => void
  dateFilter?: string
  onDateChange?: (value: string) => void
  monthFilter?: string
  onMonthChange?: (value: string) => void
  yearFilter?: string
  onYearChange?: (value: string) => void
  // Bộ lọc tòa nhà
  toaNhaList?: ToaNha[]
  toaNhaFilter?: string
  onToaNhaChange?: (value: string) => void
}

// Helper tạo danh sách tháng/năm cho bộ lọc
const getMonthOptions = () => Array.from({ length: 12 }, (_, i) => i + 1)

const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
}

export function ThanhToanDataTable(props: ThanhToanDataTableProps) {
  const {
    data: initialData,
    searchTerm,
    onSearchChange,
    monthFilter,
    onMonthChange,
    yearFilter,
    onYearChange,
    toaNhaList,
    toaNhaFilter,
    onToaNhaChange,
    ...tableProps
  } = props
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Giá trị đang chọn trong Select (chưa áp dụng lọc)
  const [monthSelectValue, setMonthSelectValue] = React.useState(monthFilter || 'all')
  const [yearSelectValue, setYearSelectValue] = React.useState(yearFilter || 'all')
  const [toaNhaSelectValue, setToaNhaSelectValue] = React.useState(toaNhaFilter || 'all')
  // Giá trị đã được áp dụng (bấm OK) - dùng để lọc bảng thực sự
  const [appliedMonth, setAppliedMonth] = React.useState(monthFilter || 'all')
  const [appliedYear, setAppliedYear] = React.useState(yearFilter || 'all')
  const [appliedToaNha, setAppliedToaNha] = React.useState(toaNhaFilter || 'all')

  // Sync data when prop changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Lọc dữ liệu theo tháng/năm (dựa trên ngayThanhToan) và tòa nhà trước khi đưa vào bảng
  // Chỉ áp dụng giá trị đã bấm OK (applied...), không lọc theo giá trị đang chọn dở
  const filteredData = React.useMemo(() => {
    return data.filter((thanhToan) => {
      const ngay = new Date(thanhToan.ngayThanhToan)
      const matchesMonth =
        !appliedMonth || appliedMonth === 'all' || (ngay.getMonth() + 1).toString() === appliedMonth
      const matchesYear =
        !appliedYear || appliedYear === 'all' || ngay.getFullYear().toString() === appliedYear

      const toaNhaId = getToaNhaIdFromThanhToan(thanhToan)
      const matchesToaNha =
        !appliedToaNha || appliedToaNha === 'all' || toaNhaId === appliedToaNha

      return matchesMonth && matchesYear && matchesToaNha
    })
  }, [data, appliedMonth, appliedYear, appliedToaNha])

  const handleApplyFilter = () => {
    setAppliedMonth(monthSelectValue)
    setAppliedYear(yearSelectValue)
    setAppliedToaNha(toaNhaSelectValue)
    onMonthChange?.(monthSelectValue)
    onYearChange?.(yearSelectValue)
    onToaNhaChange?.(toaNhaSelectValue)
  }

  const columns = React.useMemo(() => createColumns(tableProps), [tableProps])
  
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ _id }) => _id!) || [],
    [filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
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
  const handleExportExcel = () => {
    const exportData = filteredData.map((t) => {
      const hoaDonInfo = t.hoaDon && typeof t.hoaDon === 'object' ? t.hoaDon : null
      const phongInfo = hoaDonInfo && typeof hoaDonInfo.phong === 'object' ? (hoaDonInfo.phong as any) : null
      const khachThueInfo = hoaDonInfo && typeof hoaDonInfo.khachThue === 'object' ? (hoaDonInfo.khachThue as any) : null
      // Tiền cọc lấy từ hopDong (mỗi hợp đồng có tienCoc riêng), KHÔNG lấy từ phong
      const hopDongInfo = hoaDonInfo && typeof (hoaDonInfo as any).hopDong === 'object' ? ((hoaDonInfo as any).hopDong as any) : null
      const tienCoc = hopDongInfo?.tienCoc || 0
      const phuongThucText =
        t.phuongThuc === 'tienMat' ? 'Tiền mặt' :
        t.phuongThuc === 'chuyenKhoan' ? 'Chuyển khoản' :
        t.phuongThuc === 'viDienTu' ? 'Ví điện tử' : t.phuongThuc

      return {
        'Hóa đơn': getHoaDonInfo(t.hoaDon, tableProps.hoaDonList),
        'Phòng': phongInfo?.maPhong || 'N/A',
        'Người đại diện': khachThueInfo?.hoTen || 'N/A',
        'Số tiền': t.soTien,
        'Tiền cò (80%)': tienCoc * 0.8,
        'Tiền thực tế (20%)': tienCoc * 0.2,
        'Phương thức': phuongThucText,
        'Tiền cọc': tienCoc,
        'Ngày thanh toán': new Date(t.ngayThanhToan).toLocaleDateString('vi-VN'),
        'Ghi chú': t.ghiChu || '-',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [
      { wch: 16 }, { wch: 10 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 24 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thanh toán')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `danh-sach-thanh-toan_${today}.xlsx`)

    toast.success(`Đã xuất ${exportData.length} giao dịch ra file Excel`)
  }
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tìm kiếm và Bộ lọc bên trái */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 w-full">
          <div className="flex-1 sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
                placeholder="Tìm kiếm theo phòng, ghi chú, giao dịch..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Bộ lọc tòa nhà */}
          <Select value={toaNhaSelectValue} onValueChange={setToaNhaSelectValue}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tòa nhà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tòa nhà</SelectItem>
              {toaNhaList?.map((toaNha) => (
                <SelectItem key={toaNha._id} value={toaNha._id!}>
                  {toaNha.tenToaNha}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthSelectValue} onValueChange={setMonthSelectValue}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cả năm</SelectItem>
              {getMonthOptions().map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  Tháng {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearSelectValue} onValueChange={setYearSelectValue}>
            <SelectTrigger className="w-full sm:w-[110px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm</SelectItem>
              {getYearOptions().map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            className="sm:w-auto"
            onClick={handleApplyFilter}
          >
            OK
          </Button>
        </div>

        {/* Tùy chỉnh cột bên phải */}
        <div className="flex items-center gap-2">
        <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-green-700 border-green-200 hover:bg-green-50"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Xuất Excel</span>
            <span className="lg:hidden">Excel</span>
          </Button>
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
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
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
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
            Trang {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
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
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang cuối</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}