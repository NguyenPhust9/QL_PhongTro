'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  DoorOpen, 
  Users, 
  Receipt, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
        <div className="hidden sm:flex items-center gap-3">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white transition-shadow">Tạo mới</Button>
          <Button variant="outline" size="sm" className="border-gray-200">Báo cáo</Button>
        </div>
      </div>

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

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600">Doanh thu</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.doanhThuThang)}</p>
              <p className="text-xs text-gray-500 mt-1">+12% tháng trước</p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
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
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Hoạt động gần đây</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Các hoạt động mới nhất trong hệ thống
            </CardDescription>
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
            <CardDescription className="text-xs md:text-sm">
              Tình trạng sử dụng phòng
            </CardDescription>
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
