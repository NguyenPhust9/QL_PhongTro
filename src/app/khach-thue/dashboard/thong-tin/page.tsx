'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, CreditCard, MapPin, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function KhachThueThongTinPage() {
  const [khachThue, setKhachThue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    queQuan: '',
    ngheNghiep: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('khachThueToken');
      if (!token) return;

      const response = await fetch('/api/auth/khach-thue/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const kt = result.data.khachThue;
        setKhachThue(kt);
        setFormData({
          email: kt.email || '',
          queQuan: kt.queQuan || '',
          ngheNghiep: kt.ngheNghiep || '',
        });
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('khachThueToken');
      const response = await fetch('/api/khach-thue/thong-tin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Cập nhật thành công!');
        setEditing(false);
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

  const formatDate = (date: string) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-8 shadow-xl">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
              <User className="h-8 w-8" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Thông tin cá nhân</h1>
              <p className="mt-1 text-blue-100">Xem và cập nhật thông tin của bạn</p>
            </div>
          </div>
        </div>

        {/* Thông tin cơ bản - chỉ xem */}
        <Card className="overflow-hidden rounded-[28px] border-0 bg-white/95 shadow-xl shadow-slate-200/70">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
              <span className="rounded-2xl bg-blue-100 p-2">
                <User className="h-5 w-5 text-blue-600" />
              </span>
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem
                icon={<User className="h-5 w-5 text-blue-600" />}
                label="Họ tên"
                value={khachThue?.hoTen || '---'}
                color="bg-blue-50"
              />

              <InfoItem
                icon={<Phone className="h-5 w-5 text-emerald-600" />}
                label="Số điện thoại"
                value={khachThue?.soDienThoai || '---'}
                color="bg-emerald-50"
              />

              <InfoItem
                icon={<CreditCard className="h-5 w-5 text-orange-600" />}
                label="CCCD"
                value={khachThue?.cccd || '---'}
                color="bg-orange-50"
              />

              <InfoItem
                icon={<Calendar className="h-5 w-5 text-violet-600" />}
                label="Ngày sinh"
                value={formatDate(khachThue?.ngaySinh)}
                color="bg-violet-50"
              />

              <InfoItem
                icon={<User className="h-5 w-5 text-pink-600" />}
                label="Giới tính"
                value={khachThue?.gioiTinh === 'nam' ? 'Nam' : khachThue?.gioiTinh === 'nu' ? 'Nữ' : '---'}
                color="bg-pink-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Thông tin có thể chỉnh sửa */}
        <Card className="overflow-hidden rounded-[28px] border-0 bg-white/95 shadow-xl shadow-slate-200/70">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white">
            <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
              <span className="rounded-2xl bg-indigo-100 p-2">
                <Mail className="h-5 w-5 text-indigo-600" />
              </span>
              Thông tin liên hệ
            </CardTitle>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-full border-blue-200 bg-blue-50 px-5 font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800"
              >
                Chỉnh sửa
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6">
            {!editing ? (
              <div className="space-y-4">
                <InfoItem
                  icon={<Mail className="h-5 w-5 text-indigo-600" />}
                  label="Email"
                  value={khachThue?.email || '---'}
                  color="bg-indigo-50"
                />

                <InfoItem
                  icon={<MapPin className="h-5 w-5 text-rose-600" />}
                  label="Quê quán"
                  value={khachThue?.queQuan || '---'}
                  color="bg-rose-50"
                />

                <InfoItem
                  icon={<Briefcase className="h-5 w-5 text-amber-600" />}
                  label="Nghề nghiệp"
                  value={khachThue?.ngheNghiep || '---'}
                  color="bg-amber-50"
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Quê quán</Label>
                  <Input
                    value={formData.queQuan}
                    onChange={(e) => setFormData(p => ({ ...p, queQuan: e.target.value }))}
                    placeholder="VD: Hà Nội"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Nghề nghiệp</Label>
                  <Input
                    value={formData.ngheNghiep}
                    onChange={(e) => setFormData(p => ({ ...p, ngheNghiep: e.target.value }))}
                    placeholder="VD: Sinh viên"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-7 font-semibold text-white shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="h-11 rounded-full border-slate-200 bg-white px-7 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl ${color} p-4`}>
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}