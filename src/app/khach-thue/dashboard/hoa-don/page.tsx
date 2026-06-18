'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const BANK_INFO = {
  tenNganHang: 'MB Bank',
  soTaiKhoan: '0902966704',
  tenChuTaiKhoan: 'NGUYEN VAN PHU',
};

export default function KhachThueHoaDonPage() {
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHoaDon, setSelectedHoaDon] = useState<any>(null);

  useEffect(() => {
    fetchHoaDons();
  }, []);

  const fetchHoaDons = async () => {
    try {
      const token = localStorage.getItem('khachThueToken');
      if (!token) return;

      const response = await fetch('/api/auth/khach-thue/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setHoaDons(result.data.hoaDonGanNhat ? [result.data.hoaDonGanNhat] : []);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getQRUrl = (hoaDon: any) => {
    const noiDung = `Thanh toan hoa don ${hoaDon.maHoaDon}`;
    return `https://img.vietqr.io/image/MB-${BANK_INFO.soTaiKhoan}-compact2.png?amount=${hoaDon.tongTien}&addInfo=${encodeURIComponent(noiDung)}&accountName=${encodeURIComponent(BANK_INFO.tenChuTaiKhoan)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hóa đơn</h1>
        <p className="text-gray-600">Danh sách hóa đơn của bạn</p>
      </div>

      {hoaDons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-gray-500">
            <FileText className="h-10 w-10 mb-2" />
            <p>Chưa có hóa đơn nào</p>
          </CardContent>
        </Card>
      ) : (
        hoaDons.map((hd: any, idx: number) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Hóa đơn {hd.maHoaDon}</span>
                {hd.trangThai === 'daThanhToan' ? (
                  <Badge className="bg-green-600">Đã thanh toán</Badge>
                ) : hd.trangThai === 'quaHan' ? (
                  <Badge variant="destructive">Quá hạn</Badge>
                ) : (
                  <Badge variant="outline">Chưa thanh toán</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tháng</p>
                  <p className="font-medium">{hd.thang}/{hd.nam}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phòng</p>
                  <p className="font-medium">{hd.phong?.maPhong || '---'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-medium text-green-600">{formatCurrency(hd.tongTien)}</p>
                </div>
              </div>

              {hd.trangThai !== 'daThanhToan' && (
                <Button
                  className="w-full"
                  onClick={() => setSelectedHoaDon(hd)}
                >
                  Thanh toán ngay
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal QR */}
      {selectedHoaDon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quét QR để thanh toán</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedHoaDon(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <img
                src={getQRUrl(selectedHoaDon)}
                alt="QR thanh toán"
                className="w-64 h-64 mx-auto rounded-lg"
              />
              <div className="text-sm space-y-1 text-left bg-gray-50 p-3 rounded-lg">
                <p><span className="text-gray-500">Ngân hàng:</span> <span className="font-medium">{BANK_INFO.tenNganHang}</span></p>
                <p><span className="text-gray-500">Số TK:</span> <span className="font-medium">{BANK_INFO.soTaiKhoan}</span></p>
                <p><span className="text-gray-500">Chủ TK:</span> <span className="font-medium">{BANK_INFO.tenChuTaiKhoan}</span></p>
                <p><span className="text-gray-500">Số tiền:</span> <span className="font-medium text-green-600">{formatCurrency(selectedHoaDon.tongTien)}</span></p>
                <p><span className="text-gray-500">Nội dung:</span> <span className="font-medium">Thanh toan hoa don {selectedHoaDon.maHoaDon}</span></p>
              </div>
              <p className="text-xs text-gray-500">Sau khi chuyển khoản, vui lòng chờ quản lý xác nhận.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}