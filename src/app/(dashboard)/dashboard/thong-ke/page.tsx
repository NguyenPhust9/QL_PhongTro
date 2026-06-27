"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ToaNha {
  _id: string
  tenToaNha: string
}

interface DoanhThuThangItem {
  thang: number
  doanhThu: number
}

interface DoanhThuNamItem {
  nam: number
  doanhThu: number
}

interface DoanhThuToaNhaItem {
  toaNhaId: string
  tenToaNha: string
  doanhThu: number
}

type KieuBieuDo = "cot" | "tron"

const formatTien = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

const namHienTai = new Date().getFullYear()
const thangHienTai = new Date().getMonth() + 1

const danhSachNamLuaChon = Array.from({ length: 5 }, (_, i) => namHienTai - i)

const mauBieuDo = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
]

export default function ThongKePage() {
  const [danhSachToaNha, setDanhSachToaNha] = React.useState<ToaNha[]>([])
  const [toaNhaId, setToaNhaId] = React.useState<string>("")
  const [namChon, setNamChon] = React.useState<number>(namHienTai)

  const [theoThang, setTheoThang] = React.useState<DoanhThuThangItem[]>([])
  const [theoNam, setTheoNam] = React.useState<DoanhThuNamItem[]>([])
  const [dangTaiToaNha, setDangTaiToaNha] = React.useState(true)
  const [dangTaiDoanhThu, setDangTaiDoanhThu] = React.useState(false)

  const [thangTong, setThangTong] = React.useState<number>(thangHienTai)
  const [namTong, setNamTong] = React.useState<number>(namHienTai)
  const [tongDoanhThu, setTongDoanhThu] = React.useState<number>(0)
  const [chiTietTheoToaNha, setChiTietTheoToaNha] = React.useState<
    DoanhThuToaNhaItem[]
  >([])
  const [dangTaiTong, setDangTaiTong] = React.useState(false)

  // Thêm state chọn kiểu biểu đồ
  const [kieuBieuDoTong, setKieuBieuDoTong] =
    React.useState<KieuBieuDo>("cot")

  React.useEffect(() => {
    const layDanhSachToaNha = async () => {
      try {
        setDangTaiToaNha(true)
        const res = await fetch("/api/toa-nha?limit=100")
        const json = await res.json()

        if (json.success && Array.isArray(json.data)) {
          setDanhSachToaNha(json.data)

          if (json.data.length > 0) {
            setToaNhaId(json.data[0]._id)
          }
        }
      } catch (error) {
        console.error("Lỗi tải danh sách tòa nhà:", error)
      } finally {
        setDangTaiToaNha(false)
      }
    }

    layDanhSachToaNha()
  }, [])

  React.useEffect(() => {
    if (!toaNhaId) return

    const layDoanhThu = async () => {
      try {
        setDangTaiDoanhThu(true)

        const res = await fetch(
          `/api/thong-ke/theo-toa-nha?toaNhaId=${toaNhaId}&nam=${namChon}`
        )
        const json = await res.json()

        if (json.success) {
          setTheoThang(json.theoThang)
          setTheoNam(json.theoNam)
        }
      } catch (error) {
        console.error("Lỗi tải doanh thu theo tòa nhà:", error)
      } finally {
        setDangTaiDoanhThu(false)
      }
    }

    layDoanhThu()
  }, [toaNhaId, namChon])

  React.useEffect(() => {
    const layTong = async () => {
      try {
        setDangTaiTong(true)

        const res = await fetch(
          `/api/thong-ke/tong-he-thong?thang=${thangTong}&nam=${namTong}`
        )
        const json = await res.json()

        if (json.success) {
          setTongDoanhThu(json.tongDoanhThu)
          setChiTietTheoToaNha(json.theoToaNha)
        }
      } catch (error) {
        console.error("Lỗi tải tổng doanh thu hệ thống:", error)
      } finally {
        setDangTaiTong(false)
      }
    }

    layTong()
  }, [thangTong, namTong])

  const tenToaNhaDangChon = danhSachToaNha.find(
    (t) => t._id === toaNhaId
  )?.tenToaNha

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Thống kê doanh thu</h1>
        <p className="text-muted-foreground text-sm">
          Doanh thu được tính theo số tiền đã thanh toán thực tế
        </p>
      </div>

      {/* ===== PHẦN 1: DOANH THU THEO TÒA NHÀ ===== */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Doanh thu theo tòa nhà</CardTitle>
            <CardDescription>
              Xem doanh thu theo tháng và theo năm của từng tòa nhà riêng
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={toaNhaId}
              onValueChange={setToaNhaId}
              disabled={dangTaiToaNha || danhSachToaNha.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn tòa nhà" />
              </SelectTrigger>
              <SelectContent>
                {danhSachToaNha.map((toaNha) => (
                  <SelectItem key={toaNha._id} value={toaNha._id}>
                    {toaNha.tenToaNha}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(namChon)}
              onValueChange={(v) => setNamChon(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {danhSachNamLuaChon.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Năm {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">
                Doanh thu theo tháng — {tenToaNhaDangChon || "..."} (Năm{" "}
                {namChon})
              </h3>

              {dangTaiDoanhThu ? (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
                  Đang tải...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={theoThang}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="thang" tickFormatter={(t) => `Th${t}`} />
                    <YAxis
                      tickFormatter={(v) =>
                        v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => formatTien(Number(value))}
                      labelFormatter={(t) => `Tháng ${t}`}
                    />
                    <Bar
                      dataKey="doanhThu"
                      name="Doanh thu"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">
                Doanh thu theo năm — {tenToaNhaDangChon || "..."}
              </h3>

              {dangTaiDoanhThu ? (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
                  Đang tải...
                </div>
              ) : theoNam.length === 0 ? (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
                  Chưa có dữ liệu
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={theoNam}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nam" />
                    <YAxis
                      tickFormatter={(v) =>
                        v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => formatTien(Number(value))}
                      labelFormatter={(n) => `Năm ${n}`}
                    />
                    <Bar
                      dataKey="doanhThu"
                      name="Doanh thu"
                      fill="#16a34a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== PHẦN 2: TỔNG DOANH THU TOÀN HỆ THỐNG THEO THÁNG ===== */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Tổng doanh thu toàn hệ thống</CardTitle>
            <CardDescription>
              Tổng doanh thu của tất cả tòa nhà trong 1 tháng
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Chọn kiểu biểu đồ */}
            <Select
              value={kieuBieuDoTong}
              onValueChange={(v) => setKieuBieuDoTong(v as KieuBieuDo)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kiểu biểu đồ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cot">Biểu đồ cột</SelectItem>
                <SelectItem value="tron">Biểu đồ tròn</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(thangTong)}
              onValueChange={(v) => setThangTong(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    Tháng {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(namTong)}
              onValueChange={(v) => setNamTong(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {danhSachNamLuaChon.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Năm {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {dangTaiTong ? (
            <div className="text-muted-foreground flex h-[120px] items-center justify-center text-sm">
              Đang tải...
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
                <p className="text-muted-foreground text-sm">
                  Tổng doanh thu Tháng {thangTong}/{namTong}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatTien(tongDoanhThu)}
                </p>
              </div>

              {chiTietTheoToaNha.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium">
                      Chi tiết theo từng tòa nhà
                    </h3>

                    <p className="text-muted-foreground text-xs">
                      Đang xem:{" "}
                      {kieuBieuDoTong === "cot"
                        ? "Biểu đồ cột"
                        : "Biểu đồ tròn"}
                    </p>
                  </div>

                  <ResponsiveContainer width="100%" height={340}>
                    {kieuBieuDoTong === "cot" ? (
                      <BarChart data={chiTietTheoToaNha} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(v) =>
                            v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v}`
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="tenToaNha"
                          width={130}
                        />
                        <Tooltip
                          formatter={(value) => formatTien(Number(value))}
                        />
                        <Legend />
                        <Bar
                          dataKey="doanhThu"
                          name="Doanh thu"
                          fill="#f59e0b"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chiTietTheoToaNha}
                          dataKey="doanhThu"
                          nameKey="tenToaNha"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={55}
                          paddingAngle={3}
                          label={(props) => {
                            const percent = props.percent
                              ? `${(props.percent * 100).toFixed(0)}%`
                              : "0%"

                            return percent
                          }}
                        >
                          {chiTietTheoToaNha.map((entry, index) => (
                            <Cell
                              key={entry.toaNhaId || entry.tenToaNha}
                              fill={mauBieuDo[index % mauBieuDo.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => formatTien(Number(value))}
                        />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}