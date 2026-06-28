'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, LogIn, Home, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function KhachThueDangNhapPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    cccd: '',
    matKhau: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/khach-thue/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('khachThueToken', result.data.token);
        localStorage.setItem('khachThueData', JSON.stringify(result.data.khachThue));
        toast.success('Đăng nhập thành công!');
        router.push('/khach-thue/dashboard');
      } else {
        toast.error(result.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl grid lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Side */}
        <div className="hidden lg:block relative h-full min-h-[700px]">
          <img
            src="/images/login-banner.jfif"
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right Side */}
        <div className="p-8 lg:p-12 flex items-center">
          <div className="w-full">

            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center">
                <Home className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-800">
                Đăng nhập khách thuê
              </h2>
              <p className="text-slate-500 mt-2">
                Nhập thông tin để truy cập tài khoản của bạn
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <Label htmlFor="cccd">Số CCCD</Label>
                <div className="relative mt-2">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="cccd"
                    type="text"
                    placeholder="Nhập số CCCD (11 hoặc 12 số)"
                    value={formData.cccd}
                    onChange={(e) => setFormData(prev => ({ ...prev, cccd: e.target.value }))}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="matKhau">Mật khẩu</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="matKhau"
                    type="password"
                    placeholder="Mật khẩu mặc định: ngày sinh (ddmmyyyy)"
                    value={formData.matKhau}
                    onChange={(e) => setFormData(prev => ({ ...prev, matKhau: e.target.value }))}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Mật khẩu mặc định là ngày sinh, ví dụ: <span className="font-mono font-medium">01011990</span>
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Đăng nhập
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-slate-500">
                Chưa có mật khẩu?
                <br />
                Liên hệ quản lý để được cấp tài khoản.
              </div>

              <Link
                href="khach-thue/dang-nhap"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <Key className="h-4 w-4" />
                Đăng nhập Admin
              </Link>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}