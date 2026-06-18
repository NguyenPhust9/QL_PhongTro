'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, DoorOpen, AlertTriangle, TrendingUp, Calendar, Clock } from 'lucide-react';

// ─── Hằng số ────────────────────────────────────────────────────────────────
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const YEARS  = Array.from({ length: 6 },  (_, i) => new Date().getFullYear() - i);

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

// ─── Component Filter ────────────────────────────────────────────────────────
function FilterDropdown({
  filterType,
  onFilterTypeChange,
  selectedDay, setSelectedDay,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  onApply,
}: {
  filterType: 'day' | 'month' | 'year';
  onFilterTypeChange: (t: 'day' | 'month' | 'year') => void;
  selectedDay: number; setSelectedDay: (v: number) => void;
  selectedMonth: number; setSelectedMonth: (v: number) => void;
  selectedYear: number; setSelectedYear: (v: number) => void;
  onApply: () => void;
}) {
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectClass =
    'px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Chọn chế độ */}
      <select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value as 'day' | 'month' | 'year')}
        className={selectClass}
      >
        <option value="day">Theo ngày</option>
        <option value="month">Theo tháng</option>
        <option value="year">Theo năm</option>
      </select>

      {/* Ngày — chỉ khi 'day' */}
      {filterType === 'day' && (
        <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))} className={selectClass}>
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* Tháng — khi 'day' hoặc 'month' */}
      {(filterType === 'day' || filterType === 'month') && (
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className={selectClass}>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      )}

      {/* Năm — luôn hiện */}
      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={selectClass}>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Nút OK */}
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

  const [selectedDay,   setSelectedDay]   = useState(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  useEffect(() => {
    document.title = 'Dashboard';
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ ngày nếu tháng/năm đổi làm ngày vượt quá
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
      const res = await fetch(`/api/dashboard/stats?filterType=${filterType}&filterDate=${filterDate}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) setStats(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

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
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Bảng điều khiển</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống quản lý phòng trọ</p>
        </div>
      </div>

      {/* Filter doanh thu */}
      <Card className="p-4 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-1">Doanh thu</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.doanhThuFilter)}</p>
            <p className="text-xs text-gray-500 mt-1">{filterLabel()}</p>
          </div>

          <FilterDropdown
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            selectedDay={selectedDay}     setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}   setSelectedYear={setSelectedYear}
            onApply={fetchStats}
          />
        </div>

        {/* Mini chart doanh thu theo ngày */}
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
              <p className="text-xs text-gray-500 mt-1">{((stats.phongTrong / stats.tongSoPhong) * 100).toFixed(1)}% tổng</p>
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

      {/* Recent Activities + Thống kê phòng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Hoạt động gần đây</CardTitle>
            <CardDescription className="text-sm text-gray-500">Các hoạt động mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Khách thuê mới đăng ký</p>
                <p className="text-xs text-gray-500 truncate">Nguyễn Văn A - Phòng P101</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Mới</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Thanh toán thành công</p>
                <p className="text-xs text-gray-500 truncate">Phòng P102 - 2,500,000 VNĐ</p>
              </div>
              <Badge className="bg-green-50 text-green-700 border-0">Hoàn thành</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Báo cáo sự cố</p>
                <p className="text-xs text-gray-500 truncate">Phòng P105 - Hỏng điều hòa</p>
              </div>
              <Badge className="bg-red-50 text-red-700">Cần xử lý</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Thống kê phòng</CardTitle>
            <CardDescription className="text-xs md:text-sm">Tình trạng sử dụng phòng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Phòng trống</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongTrong}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Đang thuê</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongDangThue}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Bảo trì</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongBaoTri}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">Tổng cộng</span>
                  <span className="text-xs md:text-sm font-medium">{stats.tongSoPhong}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
