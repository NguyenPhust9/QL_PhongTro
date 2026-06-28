'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, FileText, AlertCircle, User, LogOut, Menu, X, Tag, Building2, MessageCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function KhachThueDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [khachThue, setKhachThue] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soTinChuaDoc, setSoTinChuaDoc] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('khachThueToken');
    const khachThueData = localStorage.getItem('khachThueData');
    if (!token || !khachThueData) {
      router.push('/khach-thue/dang-nhap');
      return;
    }
    setKhachThue(JSON.parse(khachThueData));
  }, [router]);

  // Fetch số tin chưa đọc
  useEffect(() => {
    if (!khachThue) return;
    const fetchChuaDoc = async () => {
      try {
        const token = localStorage.getItem('khachThueToken');
        const res = await fetch('/api/chat/khach-thue/chua-doc', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setSoTinChuaDoc(data.soTinChuaDoc);
      } catch {}
    };
    fetchChuaDoc();
    const interval = setInterval(fetchChuaDoc, 30000); // poll 30s
    return () => clearInterval(interval);
  }, [khachThue]);

  const handleLogout = () => {
    localStorage.removeItem('khachThueToken');
    localStorage.removeItem('khachThueData');
    toast.success('Đã đăng xuất');
    router.push('/khach-thue/dang-nhap');
  };

  if (!khachThue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const navigation = [
    { name: 'Sơ đồ phòng', href: '/khach-thue/dashboard/so-do-phong', icon: Building2 },
    { name: 'Tổng quan', href: '/khach-thue/dashboard', icon: Home },
    { name: 'Hóa đơn', href: '/khach-thue/dashboard/hoa-don', icon: FileText },
    { name: 'Sự cố', href: '/khach-thue/dashboard/su-co', icon: AlertCircle },
    { name: 'Rao vặt', href: '/khach-thue/dashboard/rao-vat', icon: Tag },
    { name: 'Nhắn tin', href: '/khach-thue/dashboard/chat', icon: MessageCircle },
    { name: 'Thông tin cá nhân', href: '/khach-thue/dashboard/thong-tin', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Header góc trên phải */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Nút chat */}
        <Link href="/khach-thue/dashboard/chat">
          <Button
            variant="outline"
            size="icon"
            className="relative bg-white shadow-lg hover:bg-blue-50"
          >
            <MessageCircle className="h-5 w-5 text-blue-600" />
            {soTinChuaDoc > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {soTinChuaDoc > 9 ? '9+' : soTinChuaDoc}
              </span>
            )}
          </Button>
        </Link>

        {/* Nút thông báo — placeholder, có thể mở rộng sau */}
        <Button
          variant="outline"
          size="icon"
          className="relative bg-white shadow-lg hover:bg-blue-50"
        >
          <Bell className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full px-4 py-6 overflow-y-auto flex flex-col">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-bold text-blue-900">Xin chào,</h2>
            <p className="text-sm text-blue-700 font-medium">{khachThue.hoTen}</p>
            <p className="text-xs text-blue-600 mt-1">{khachThue.soDienThoai}</p>
          </div>

          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isChat = item.href.includes('chat');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                  {isChat && soTinChuaDoc > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {soTinChuaDoc > 9 ? '9+' : soTinChuaDoc}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t mt-6">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}