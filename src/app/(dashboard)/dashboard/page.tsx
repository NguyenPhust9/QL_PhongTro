'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DoorOpen, AlertTriangle, TrendingUp, Calendar, Clock } from 'lucide-react';

// ─── Hằng số ────────────────────────────────────────────────────────────────
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const YEARS  = Array.from({ length: 6 },  (_, i) => new Date().getFullYear() - i);

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ─── Pie Chart SVG ───────────────────────────────────────────────────────────
function PieChart({ data }: { data: { tenToaNha: string; total: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }

  // Tính các slice
  type Slice = {
    label: string; value: number; percent: number; color: string;
    startAngle: number; endAngle: number;
  };
  const slices: Slice[] = [];
  let cumulative = 0;
  data.forEach((d, i) => {
    const percent = d.total / total;
    const startAngle = cumulative * 2 * Math.PI;
    const endAngle   = (cumulative + percent) * 2 * Math.PI;
    slices.push({
      label: d.tenToaNha,
      value: d.total,
      percent,
      color: PIE_COLORS[i % PIE_COLORS.length],
      startAngle,
      endAngle,
    });
    cumulative += percent;
  });

  const cx = 100, cy = 100, r = 80, rInner = 48;

  const arc = (start: number, end: number, outerR: number, innerR: number) => {
    const x1 = cx + outerR * Math.sin(start);
    const y1 = cy - outerR * Math.cos(start);
    const x2 = cx + outerR * Math.sin(end);
    const y2 = cy - outerR * Math.cos(end);
    const ix1 = cx + innerR * Math.sin(end);
    const iy1 = cy - innerR * Math.cos(end);
    const ix2 = cx + innerR * Math.sin(start);
    const iy2 = cy - innerR * Math.cos(start);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* SVG */}
      <div className="relative flex-shrink-0">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-48 h-48"
          onMouseLeave={() => setTooltip(null)}
        >
          {slices.map((s, i) => (
            <path
              key={i}
              d={arc(s.startAngle, s.endAngle, r, rInner)}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onMouseMove={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  label: s.label,
                  value: s.value,
                });
              }}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fontSize="9" fill="#6b7280">
            Tổng
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#111827" fontWeight="bold">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(total)}
          </text>
        </svg>
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-800 text-white text-xs px-2 py-1.5 rounded shadow-lg z-10 whitespace-nowrap"
            style={{ left: tooltip.x + 8, top: tooltip.y - 30 }}
          >
            <div className="font-medium">{tooltip.label}</div>
            <div>{formatCurrency(tooltip.value)}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="truncate text-gray-700">{s.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-gray-900">{(s.percent * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Filter Dropdown ─────────────────────────────────────────────────────────
function FilterBar({
  filterType, onFilterTypeChange,
  selectedDay, setSelectedDay,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  toaNhaId, setToaNhaId,
  toaNhaList,
  onApply,
}: {
  filterType: 'day' | 'month' | 'year';
  onFilterTypeChange: (t: 'day' | 'month' | 'year') => void;
  selectedDay: number; setSelectedDay: (v: number) => void;
  selectedMonth: number; setSelectedMonth: (v: number) => void;
  selectedYear: number; setSelectedYear: (v: number) => void;
  toaNhaId: string; setToaNhaId: (v: string) => void;
  toaNhaList: { _id: string; tenToaNha: string }[];
  onApply: () => void;
}) {
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const cls = 'px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tòa nhà */}
      <select value={toaNhaId} onChange={e => setToaNhaId(e.target.value)} className={cls}>
        <option value="all">Tất cả tòa nhà</option>
        {toaNhaList.map(t => (
          <option key={t._id} value={t._id}>{t.tenToaNha}</option>
        ))}
      </select>

      {/* Chế độ lọc */}
      <select value={filterType} onChange={e => onFilterTypeChange(e.target.value as any)} className={cls}>
        <option value="day">Theo ngày</option>
        <option value="month">Theo tháng</option>
        <option value="year">Theo năm</option>
      </select>

      {filterType === 'day' && (
        <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))} className={cls}>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {(filterType === 'day' || filterType === 'month') && (
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={cls}>
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      )}
      <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={cls}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <button
        onClick={onApply}
        className="px-4 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
      >
        OK
      </button>
    </div>
  );
}

// ─── Page chính ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const now = new Date();

  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [toaNhaId, setToaNhaId]     = useState('all');
  const [toaNhaList, setToaNhaList] = useState<{ _id: string; tenToaNha: string }[]>([]);

  const [selectedDay,   setSelectedDay]   = useState(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  useEffect(() => {
    document.title = 'Dashboard';
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const max = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > max) setSelectedDay(max);
  }, [selectedMonth, selectedYear]);

  const buildFilterDate = () => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const filterDate = buildFilterDate();
      const res = await fetch(
        `/api/dashboard/stats?filterType=${filterType}&filterDate=${filterDate}&toaNhaId=${toaNhaId}`
      );
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setStats(result.data);
          if (result.data.toaNhaList?.length) setToaNhaList(result.data.toaNhaList);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLabel = () => {
    if (filterType === 'day')   return `Ngày ${selectedDay}/${selectedMonth}/${selectedYear}`;
    if (filterType === 'month') return `Tháng ${selectedMonth}/${selectedYear}`;
    return `Năm ${selectedYear}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
     <div className="relative inline-flex flex-col">
  {/* Ánh sáng nền nhẹ */}
  <div className="absolute -left-4 -top-3 h-16 w-16 rounded-full bg-amber-400/20 blur-2xl" />

  <div className="relative">
    <div className="flex items-center gap-3">
      {/* Gạch nhấn bên trái */}
      <span className="h-10 w-1 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-700 shadow-[0_0_18px_rgba(245,158,11,0.45)]" />

      <div>
        <h1 className="font-serif text-3xl md:text-5xl font-extrabold tracking-[0.18em] uppercase leading-none">
          <span className="bg-gradient-to-r from-yellow-200 via-amber-500 to-yellow-700 bg-clip-text text-transparent drop-shadow-sm">
            Oria Homes
          </span>
        </h1>

        <div className="mt-3 flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500" />

          <p className="text-xs md:text-sm uppercase tracking-[0.28em] text-gray-500">
            Nơi nghệ thuật kiến tạo tổ ấm
          </p>

          <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500" />
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Filter + Doanh thu */}
      <Card className="p-4 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-1">Doanh thu</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.doanhThuFilter)}</p>
            <p className="text-xs text-gray-500 mt-1">{filterLabel()}</p>
          </div>
          <FilterBar
            filterType={filterType}       onFilterTypeChange={setFilterType}
            selectedDay={selectedDay}     setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}   setSelectedYear={setSelectedYear}
            toaNhaId={toaNhaId}           setToaNhaId={setToaNhaId}
            toaNhaList={toaNhaList}
            onApply={fetchStats}
          />
        </div>

        {/* Bar chart theo ngày */}
        {stats.doanhThuTheoNgay?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-100">
            <p className="text-xs text-gray-500 mb-2">Chi tiết theo ngày</p>
            <div className="flex items-end gap-1 h-16">
              {stats.doanhThuTheoNgay.map((item: any, idx: number) => {
                const max = Math.max(...stats.doanhThuTheoNgay.map((d: any) => d.total));
                const height = max > 0 ? (item.total / max) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-emerald-400 rounded-t hover:bg-emerald-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600">Tổng phòng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tongSoPhong}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.phongDangThue} đang thuê</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-600">Phòng trống</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.phongTrong}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.tongSoPhong > 0
                  ? ((stats.phongTrong / stats.tongSoPhong) * 100).toFixed(1)
                  : 0}% tổng
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <DoorOpen className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-600">Sự cố</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.suCoCanXuLy}</p>
              <p className="text-xs text-gray-500 mt-1">Cần xử lý</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-50 to-white border border-teal-100 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-teal-600">Doanh thu năm</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.doanhThuNam)}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng doanh thu</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-600">Hóa đơn sắp đến hạn</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{stats.hoaDonSapDenHan}</p>
              <p className="text-xs text-gray-500 mt-1">Cần theo dõi</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600">Hợp đồng sắp hết hạn</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">{stats.hopDongSapHetHan}</p>
              <p className="text-xs text-gray-500 mt-1">Cần gia hạn</p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Biểu đồ tròn + Thống kê phòng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pie chart doanh thu theo tòa nhà */}
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 px-0 pt-0">
            <CardTitle className="text-base md:text-lg">Doanh thu theo tòa nhà</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {filterLabel()} · {toaNhaId === 'all' ? 'Tất cả tòa nhà' : toaNhaList.find(t => t._id === toaNhaId)?.tenToaNha}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <PieChart data={stats.doanhThuTheoToaNha || []} />
          </CardContent>
        </Card>

        {/* Thống kê phòng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Thống kê phòng</CardTitle>
            <CardDescription className="text-xs md:text-sm">Tình trạng sử dụng phòng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Phòng trống',  value: stats.phongTrong,    color: 'bg-green-500' },
                { label: 'Đang thuê',    value: stats.phongDangThue, color: 'bg-blue-500'  },
                { label: 'Bảo trì',      value: stats.phongBaoTri,   color: 'bg-yellow-500'},
              ].map(item => {
                const pct = stats.tongSoPhong > 0
                  ? Math.round((item.value / stats.tongSoPhong) * 100)
                  : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-xs md:text-sm">{item.label}</span>
                      </div>
                      <span className="text-xs md:text-sm font-medium">{item.value} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium">Tổng cộng</span>
                <span className="text-xs md:text-sm font-bold">{stats.tongSoPhong}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hoạt động gần đây */}
      <Card className="p-4 bg-white border border-gray-100 shadow-sm">
        <CardHeader className="pb-2 px-0 pt-0">
          <CardTitle className="text-base md:text-lg">Hoạt động gần đây</CardTitle>
          <CardDescription className="text-sm text-gray-500">Các hoạt động mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Khách thuê mới đăng ký</p>
              <p className="text-xs text-gray-500 truncate">Nguyễn Văn A - Phòng P101</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700">Mới</Badge>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Thanh toán thành công</p>
              <p className="text-xs text-gray-500 truncate">Phòng P102 - 2,500,000 VNĐ</p>
            </div>
            <Badge className="bg-green-50 text-green-700 border-0">Hoàn thành</Badge>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Báo cáo sự cố</p>
              <p className="text-xs text-gray-500 truncate">Phòng P105 - Hỏng điều hòa</p>
            </div>
            <Badge className="bg-red-50 text-red-700">Cần xử lý</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}