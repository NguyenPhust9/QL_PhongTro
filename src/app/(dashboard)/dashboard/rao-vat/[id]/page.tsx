'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, PackageOpen, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'phong-tro', label: 'Phòng trọ' },
  { value: 'do-dung', label: 'Đồ dùng / Nội thất' },
  { value: 'xe-co', label: 'Xe cộ' },
  { value: 'khac', label: 'Khác' },
];

function formatPrice(price: number) {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace('.0', '')} triệu`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}k`;
  return `${price}đ`;
}

export default function ChiTietRaoVatPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    fetchItem();
  }, []);

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/rao-vat/${params.id}`);
      const data = await res.json();
      if (data.success) setItem(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <PackageOpen className="h-12 w-12 mb-3" />
        <p className="font-medium">Không tìm thấy tin đăng</p>
        <Button onClick={() => router.back()} className="mt-4">Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ảnh + Thông tin */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ảnh chính */}
          <div className="relative bg-slate-100 rounded-2xl overflow-hidden">
            {item.hinhAnh?.[selectedImg] ? (
              <img
                src={item.hinhAnh[selectedImg]}
                alt={item.tieuDe}
                className="w-full object-contain max-h-[500px]"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                <PackageOpen className="h-16 w-16" />
              </div>
            )}
            <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 backdrop-blur border-0">
              {CATEGORIES.find(c => c.value === item.danhMuc)?.label || item.danhMuc}
            </Badge>
          </div>

          {/* Thumbnail */}
          {item.hinhAnh?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.hinhAnh.map((src: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImg === idx ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Tiêu đề + mô tả */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h1 className="text-xl font-bold text-slate-800">{item.tieuDe}</h1>
            <p className="text-2xl font-bold text-blue-600">
              {item.gia ? formatPrice(item.gia) : 'Thỏa thuận'}
            </p>
            {item.diaChi && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {item.diaChi}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(item.createdAt), { locale: vi, addSuffix: true })}
            </div>
            <hr className="border-slate-100" />
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.moTa}</p>
          </div>
        </div>

        {/* Sidebar - Người đăng */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-700">Thông tin người đăng</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{item.nguoiDang || 'Ẩn danh'}</p>
                <p className="text-xs text-slate-400">Người bán</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}