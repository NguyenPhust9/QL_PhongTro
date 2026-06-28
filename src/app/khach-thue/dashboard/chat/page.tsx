'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBox from '@/components/chat/ChatBox';

export default function KhachThueChatPage() {
  const router = useRouter();
  const [cuocHoiThoaiId, setCuocHoiThoaiId] = useState<string | null>(null);
  const [khachThue, setKhachThue] = useState<any>(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('khachThueToken');
    const data = localStorage.getItem('khachThueData');
    if (!token || !data) {
      router.push('/khach-thue/dang-nhap');
      return;
    }
    const kt = JSON.parse(data);
    setKhachThue(kt);
    khoiTaoCuocHoiThoai(kt._id, token);
  }, []);

  const khoiTaoCuocHoiThoai = async (khachThueId: string, token: string) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ khachThueId }),
      });
      const data = await res.json();
      if (data._id) setCuocHoiThoaiId(data._id);
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  };

  if (dangTai) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang kết nối...</p>
        </div>
      </div>
    );
  }

  if (!cuocHoiThoaiId || !khachThue) return null;

  return (
    <div className="h-[calc(100vh-120px)]">
     <ChatBox
  cuocHoiThoaiId={cuocHoiThoaiId}
  tenNguoiChat="Ban quản lý"
  nguoiGuiIdOverride={khachThue._id}
  loaiNguoiGuiOverride="khachThue"
/>
    </div>
  );
}