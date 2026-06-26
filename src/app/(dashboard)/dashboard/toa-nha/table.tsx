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
  MapPin,
  Building2,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LayoutGrid,
  List,
  Users,
  DoorOpen,
  DoorClosed,
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
import { cn } from "@/lib/utils"
import type { ToaNha } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatAddress = (diaChi: ToaNha['diaChi']) =>
  `${diaChi.soNha} ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.thanhPho}`

// ─── Drag Handle ────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

type ToaNhaTableProps = {
  onView?: (toaNha: ToaNha) => void
  onEdit: (toaNha: ToaNha) => void
  onDelete: (id: string) => void
}

type ViewMode = "table" | "card"

// ─── Columns (unchanged) ─────────────────────────────────────────────────────

const createColumns = (props: ToaNhaTableProps): ColumnDef<ToaNha>[] => [
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
    accessorKey: "tenToaNha",
    header: "Tên tòa nhà",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-40">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.tenToaNha}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "diaChi",
    header: "Địa chỉ",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-64">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatAddress(row.original.diaChi)}</span>
      </div>
    ),
  },
  {
    accessorKey: "tongSoPhong",
    header: () => <div className="text-center">Tổng phòng</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.tongSoPhong}</div>
    ),
  },
  {
    id: "phongTrong",
    header: () => <div className="text-center">Phòng trống</div>,
    cell: ({ row }) => {
      const phongTrong = (row.original as any).phongTrong || 0
      const total = row.original.tongSoPhong
      const percentage = total > 0 ? Math.round((phongTrong / total) * 100) : 0
      return (
        <div className="text-center">
          <div className="font-medium text-green-600">{phongTrong}</div>
          <div className="text-xs text-muted-foreground">({percentage}%)</div>
        </div>
      )
    },
  },
  {
    id: "phongDangThue",
    header: () => <div className="text-center">Đang thuê</div>,
    cell: ({ row }) => {
      const phongDangThue = (row.original as any).phongDangThue || 0
      const total = row.original.tongSoPhong
      const percentage = total > 0 ? Math.round((phongDangThue / total) * 100) : 0
      return (
        <div className="text-center">
          <div className="font-medium text-blue-600">{phongDangThue}</div>
          <div className="text-xs text-muted-foreground">({percentage}%)</div>
        </div>
      )
    },
  },
  {
    accessorKey: "tienNghiChung",
    header: "Tiện nghi",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-48">
        {row.original.tienNghiChung.slice(0, 2).map((tienNghi) => (
          <Badge key={tienNghi} variant="secondary" className="text-xs">
            {tienNghi}
          </Badge>
        ))}
        {row.original.tienNghiChung.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{row.original.tienNghiChung.length - 2}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "ngayTao",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-sm">
        {new Date(row.original.ngayTao).toLocaleDateString('vi-VN')}
      </span>
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

// ─── Draggable Table Row (unchanged) ─────────────────────────────────────────

function DraggableRow({ row }: { row: Row<ToaNha> }) {
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

// ─── Card View ───────────────────────────────────────────────────────────────

function OccupancyBar({ total, occupied }: { total: number; occupied: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Lấp đầy</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-amber-400" : "bg-green-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ToaNhaCard({
  row,
  onView,
  onEdit,
  onDelete,
}: {
  row: Row<ToaNha>
  onView?: (t: ToaNha) => void
  onEdit: (t: ToaNha) => void
  onDelete: (id: string) => void
}) {
  const item = row.original
  const phongTrong = (item as any).phongTrong || 0
  const phongDangThue = (item as any).phongDangThue || 0

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md",
        row.getIsSelected() && "ring-2 ring-primary"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Chọn"
            className="shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{item.tenToaNha}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {formatAddress(item.diaChi)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item._id!)}>
              <Trash2 className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/40 text-center text-xs">
        <div className="py-2 px-1">
          <p className="font-bold text-base leading-none">{item.tongSoPhong}</p>
          <p className="text-muted-foreground mt-0.5">Tổng phòng</p>
        </div>
        <div className="py-2 px-1">
          <p className="font-bold text-base leading-none text-green-600">{phongTrong}</p>
          <p className="text-muted-foreground mt-0.5">Trống</p>
        </div>
        <div className="py-2 px-1">
          <p className="font-bold text-base leading-none text-blue-600">{phongDangThue}</p>
          <p className="text-muted-foreground mt-0.5">Đang thuê</p>
        </div>
      </div>

      {/* Occupancy bar */}
      <OccupancyBar total={item.tongSoPhong} occupied={phongDangThue} />

      {/* Amenities */}
      {item.tienNghiChung.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tienNghiChung.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">
              {t}
            </Badge>
          ))}
          {item.tienNghiChung.length > 3 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{item.tienNghiChung.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-muted-foreground border-t pt-2">
        Tạo lúc {new Date(item.ngayTao).toLocaleDateString('vi-VN')}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ToaNhaDataTableProps = ToaNhaTableProps & {
  data: ToaNha[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

export function ToaNhaDataTable(props: ToaNhaDataTableProps) {
  const { data: initialData, searchTerm, onSearchChange, ...tableProps } = props
  const [data, setData] = React.useState(() => initialData)
  const [viewMode, setViewMode] = React.useState<ViewMode>("card")
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  React.useEffect(() => { setData(initialData) }, [initialData])

  const columns = React.useMemo(() => createColumns(tableProps), [tableProps])
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
  const currentRows = table.getRowModel().rows

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border p-0.5 bg-muted/50">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Column visibility (table only) */}
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
                {table
                  .getAllColumns()
                  .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {viewMode === "table" ? (
            /* ── Table view (original) ── */
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(h.column.columnDef.header, h.getContext())}
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* ── Card view ── */
            currentRows.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {currentRows.map((row) => (
                  <ToaNhaCard
                    key={row.id}
                    row={row}
                    onView={tableProps.onView}
                    onEdit={tableProps.onEdit}
                    onDelete={tableProps.onDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 rounded-lg border text-muted-foreground text-sm">
                Không có dữ liệu
              </div>
            )
          )}
        </SortableContext>
      </DndContext>

      {/* Pagination (same for both modes) */}
      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedCount > 0 ? (
            <>Đã chọn {selectedCount} / {table.getFilteredRowModel().rows.length} hàng</>
          ) : (
            <>Hiển thị {table.getFilteredRowModel().rows.length} mục</>
          )}
        </div>
        <div className="flex w-full items-center gap-6 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium whitespace-nowrap">
              {viewMode === "card" ? "Thẻ mỗi trang" : "Hàng mỗi trang"}
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[8, 12, 20, 40].map((s) => (
                  <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
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
