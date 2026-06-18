'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const LOAI_SU_CO: Record<string, string> = {
  dienNuoc: 'Điện nước',
  noiThat: 'Nội thất',
  vesinh: 'Vệ sinh',
  anNinh: 'An ninh',
  khac: 'Khác',
};

const MUC_DO: Record<string, string> = {
  thap: 'Thấp',
  trungBinh: 'Trung bình',
  cao: 'Cao',
  khancap: 'Khẩn cấp',
};

const TRANG_THAI_COLOR: Record<string, string> = {
  moi: 'bg-blue-600',
  dangXuLy: 'bg-yellow-500',
  daXong: 'bg-green-600',
  daHuy: 'bg-gray-400',
};

const TRANG_THAI_LABEL: Record<string, string> = {
  moi: 'Mới',
  dangXuLy: 'Đang xử lý',
  daXong: 'Đã xong',
  daHuy: 'Đã hủy',
};

export default function KhachThueSuCoPage() {
  const [suCos, setSuCos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [khachThueData, setKhachThueData] = useState<any>(null);
  const [formData, setFormData] = useState({
    tieuDe: '',
    moTa: '',
    loaiSuCo: '',
    mucDoUuTien: 'trungBinh',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('khachThueToken');
      if (!token) return;

      // Lấy thông tin khách thuê
      const meRes = await fetch('/api/auth/khach-thue/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meResult = await meRes.json();
      if (meResult.success) {
        setKhachThueData(meResult.data);
      }

      // Lấy danh sách sự cố
      const suCoRes = await fetch('/api/khach-thue/su-co', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const suCoResult = await suCoRes.json();
      if (suCoResult.success) {
        setSuCos(suCoResult.data);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loaiSuCo) {
      toast.error('Vui lòng chọn loại sự cố');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('khachThueToken');
      const response = await fetch('/api/khach-thue/su-co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Báo cáo sự cố thành công!');
        setShowForm(false);
        setFormData({ tieuDe: '', moTa: '', loaiSuCo: '', mucDoUuTien: 'trungBinh' });
        fetchData();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sự cố</h1>
          <p className="text-gray-600">Báo cáo và theo dõi sự cố phòng trọ</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Báo cáo sự cố
        </Button>
      </div>

      {/* Danh sách sự cố */}
      {suCos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-gray-500">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>Chưa có sự cố nào</p>
          </CardContent>
        </Card>
      ) : (
        suCos.map((sc: any, idx: number) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">{sc.tieuDe}</span>
                <Badge className={TRANG_THAI_COLOR[sc.trangThai]}>
                  {TRANG_THAI_LABEL[sc.trangThai]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{sc.moTa}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Loại sự cố</p>
                  <p className="font-medium">{LOAI_SU_CO[sc.loaiSuCo]}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mức độ</p>
                  <p className="font-medium">{MUC_DO[sc.mucDoUuTien]}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày báo cáo</p>
                  <p className="font-medium">{formatDate(sc.ngayBaoCao)}</p>
                </div>
              </div>
              {sc.ghiChuXuLy && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="text-gray-500">Ghi chú xử lý</p>
                  <p>{sc.ghiChuXuLy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal báo cáo sự cố */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Báo cáo sự cố</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    placeholder="VD: Vòi nước bị rò rỉ"
                    value={formData.tieuDe}
                    onChange={(e) => setFormData(p => ({ ...p, tieuDe: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Loại sự cố</Label>
                  <Select onValueChange={(v) => setFormData(p => ({ ...p, loaiSuCo: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự cố" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOAI_SU_CO).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mức độ ưu tiên</Label>
                  <Select
                    defaultValue="trungBinh"
                    onValueChange={(v) => setFormData(p => ({ ...p, mucDoUuTien: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MUC_DO).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả chi tiết</Label>
                  <Textarea
                    placeholder="Mô tả chi tiết sự cố..."
                    value={formData.moTa}
                    onChange={(e) => setFormData(p => ({ ...p, moTa: e.target.value }))}
                    required
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}