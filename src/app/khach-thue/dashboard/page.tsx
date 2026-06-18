'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, FileText, AlertCircle, MapPin, Calendar, DollarSign, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function KhachThueDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('khachThueToken');
      if (!token) return;

      const response = await fetch('/api/auth/khach-thue/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        toast.error('Không thể tải thông tin');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-slate-500">Không có dữ liệu</p>
      </div>
    );
  }

  const { khachThue, hopDongHienTai, soHoaDonChuaThanhToan, hoaDonGanNhat } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-100">Bảng điều khiển khách thuê</p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tổng quan</h1>
              <p className="mt-2 text-blue-100">
                Xin chào {khachThue.hoTen}, đây là thông tin của bạn
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-blue-100">Trạng thái hiện tại</p>
              <div className="mt-2">
                {khachThue.trangThai === 'dangThue' ? (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Đang thuê</Badge>
                ) : khachThue.trangThai === 'daTraPhong' ? (
                  <Badge variant="secondary">Đã trả phòng</Badge>
                ) : (
                  <Badge variant="outline" className="border-white text-white">Chưa thuê</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="border-0 bg-white/90 shadow-lg shadow-blue-100/60 transition hover:-translate-y-1 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600">Phòng đang thuê</CardTitle>
              <div className="rounded-2xl bg-blue-100 p-3">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {hopDongHienTai?.phong?.maPhong || 'Chưa thuê'}
              </div>
              {hopDongHienTai?.phong?.toaNha && (
                <p className="mt-2 text-sm text-slate-500">
                  {hopDongHienTai.phong.toaNha.tenToaNha}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-lg shadow-orange-100/60 transition hover:-translate-y-1 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600">Hóa đơn chưa thanh toán</CardTitle>
              <div className="rounded-2xl bg-orange-100 p-3">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{soHoaDonChuaThanhToan}</div>
              <p className="mt-2 text-sm text-slate-500">
                {soHoaDonChuaThanhToan > 0 ? 'Cần thanh toán' : 'Đã thanh toán hết'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-lg shadow-emerald-100/60 transition hover:-translate-y-1 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600">Trạng thái</CardTitle>
              <div className="rounded-2xl bg-emerald-100 p-3">
                <AlertCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div>
                {khachThue.trangThai === 'dangThue' ? (
                  <Badge className="bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">Đang thuê</Badge>
                ) : khachThue.trangThai === 'daTraPhong' ? (
                  <Badge variant="secondary" className="px-3 py-1">Đã trả phòng</Badge>
                ) : (
                  <Badge variant="outline" className="px-3 py-1">Chưa thuê</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thông tin phòng */}
        {hopDongHienTai && (
          <Card className="border-0 bg-white/95 shadow-xl shadow-slate-200/70">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                <span className="rounded-2xl bg-blue-100 p-2">
                  <Home className="h-5 w-5 text-blue-600" />
                </span>
                Thông tin phòng đang thuê
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <h3 className="mb-5 text-base font-bold text-slate-800">Thông tin phòng</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <Home className="mt-1 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Mã phòng</p>
                      <p className="font-semibold text-slate-900">{hopDongHienTai.phong.maPhong}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <MapPin className="mt-1 h-5 w-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-slate-500">Tòa nhà</p>
                      <p className="font-semibold text-slate-900">{hopDongHienTai.phong.toaNha.tenToaNha}</p>
                      <p className="text-sm text-slate-500">
                        {hopDongHienTai.phong.toaNha.diaChi?.duong}, {hopDongHienTai.phong.toaNha.diaChi?.phuong}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <DollarSign className="mt-1 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-500">Giá thuê/tháng</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(hopDongHienTai.phong.giaThue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <h3 className="mb-5 text-base font-bold text-slate-800">Thông tin hợp đồng</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <FileText className="mt-1 h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-slate-500">Mã hợp đồng</p>
                      <p className="font-semibold text-slate-900">{hopDongHienTai.maHopDong}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <Calendar className="mt-1 h-5 w-5 text-violet-600" />
                    <div>
                      <p className="text-sm text-slate-500">Thời gian thuê</p>
                      <p className="font-semibold text-slate-900">
                        {formatDate(hopDongHienTai.ngayBatDau)} - {formatDate(hopDongHienTai.ngayKetThuc)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <DollarSign className="mt-1 h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-slate-500">Tiền cọc</p>
                      <p className="font-bold text-orange-600">{formatCurrency(hopDongHienTai.tienCoc)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hóa đơn gần nhất */}
        {hoaDonGanNhat && (
          <Card className="border-0 bg-white/95 shadow-xl shadow-slate-200/70">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                <span className="rounded-2xl bg-orange-100 p-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                </span>
                Hóa đơn gần nhất
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Mã hóa đơn</p>
                  <p className="mt-1 font-semibold text-slate-900">{hoaDonGanNhat.maHoaDon}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Tháng</p>
                  <p className="mt-1 font-semibold text-slate-900">{hoaDonGanNhat.thang}/{hoaDonGanNhat.nam}</p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-slate-500">Tổng tiền</p>
                  <p className="mt-1 font-bold text-emerald-600">{formatCurrency(hoaDonGanNhat.tongTien)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 text-sm text-slate-500">Trạng thái</p>
                  {hoaDonGanNhat.trangThai === 'daThanhToan' ? (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Đã thanh toán</Badge>
                  ) : hoaDonGanNhat.trangThai === 'chuaThanhToan' ? (
                    <Badge variant="outline">Chưa thanh toán</Badge>
                  ) : hoaDonGanNhat.trangThai === 'quaHan' ? (
                    <Badge variant="destructive">Quá hạn</Badge>
                  ) : (
                    <Badge variant="secondary">Thanh toán một phần</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thông tin liên hệ */}
        <Card className="border-0 bg-white/95 shadow-xl shadow-slate-200/70">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Thông tin liên hệ</CardTitle>
            <CardDescription>Vui lòng liên hệ quản lý nếu có thắc mắc</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4">
              <span className="rounded-xl bg-blue-100 p-2">
                <Phone className="h-5 w-5 text-blue-600" />
              </span>
              <span className="text-sm font-medium text-slate-700">Hotline: 0902966704</span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4">
              <span className="rounded-xl bg-indigo-100 p-2">
                <Mail className="h-5 w-5 text-indigo-600" />
              </span>
              <span className="text-sm font-medium text-slate-700">Email: 1150080030@sv.hcmunre.edu.vn</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}