'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, MapPin, Clock, Tag, 
  Eye, Heart, ChevronDown, Loader2, PackageOpen,Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'tat-ca', label: 'Tất cả' },
  { value: 'phong-tro', label: 'Phòng trọ' },
  { value: 'do-dung', label: 'Đồ dùng / Nội thất' },
  { value: 'xe-co', label: 'Xe cộ' },
  { value: 'khac', label: 'Khác' },
];

const SORT_OPTIONS = [
  { value: 'moi-nhat', label: 'Mới nhất' },
  { value: 'gia-tang', label: 'Giá tăng dần' },
  { value: 'gia-giam', label: 'Giá giảm dần' },
];

function formatPrice(price: number) {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace('.0', '')} triệu`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}k`;
  return `${price}đ`;
}

export default function RaoVatPage() {
  const router = useRouter();
  const { data: session } = useSession(); // ← thêm dòng này
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('tat-ca');
  const [sort, setSort] = useState('moi-nhat');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchItems();
  }, [category, sort]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ category, sort });
      const res = await fetch(`/api/rao-vat?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = items.filter(item =>
    item.tieuDe?.toLowerCase().includes(search.toLowerCase()) ||
    item.moTa?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
const handleDelete = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation();
  if (!confirm('Bạn có chắc muốn xóa tin này?')) return;
  try {
    await fetch(`/api/rao-vat/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(item => item._id !== id));
  } catch (err) {
    console.error(err);
  }
};
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rao vặt</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} tin đăng
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/rao-vat/dang-ban')}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Plus className="h-4 w-4" />
          Đăng tin
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm tin đăng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-10 rounded-xl whitespace-nowrap">
              <Filter className="h-4 w-4" />
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map(opt => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={sort === opt.value}
                onCheckedChange={() => setSort(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <PackageOpen className="h-12 w-12 mb-3" />
          <p className="font-medium">Chưa có tin đăng nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đăng tin!</p>
          <Button
            onClick={() => router.push('/dashboard/rao-vat/dang-ban')}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Đăng tin ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item._id}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
              onClick={() => router.push(`/dashboard/rao-vat/${item._id}`)}
            >
         {/* Image */}
<div className="relative h-48 bg-slate-100 overflow-hidden">
  {item.hinhAnh?.[0] ? (
    <img
      src={item.hinhAnh[0]}
      alt={item.tieuDe}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  ) : (
    <div className="flex items-center justify-center h-full text-slate-300">
      <PackageOpen className="h-10 w-10" />
    </div>
  )}

  {/* Save button */}
  <button
    onClick={e => { e.stopPropagation(); toggleSave(item._id); }}
    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
  >
    <Heart
      className={`h-4 w-4 transition-colors ${
        savedIds.has(item._id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
      }`}
    />
  </button>

  {/* Category badge */}
  <Badge className="absolute top-2 left-2 bg-white/90 text-slate-700 text-xs backdrop-blur border-0">
    {CATEGORIES.find(c => c.value === item.danhMuc)?.label || item.danhMuc}
  </Badge>
</div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                  {item.tieuDe}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-bold text-base">
                    {item.gia ? formatPrice(item.gia) : 'Thỏa thuận'}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-50 space-y-1">
            <div className="flex items-center gap-3 text-xs text-slate-400">
                {item.diaChi && (
                <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {item.diaChi}
                </span>
                )}
                <span className="flex items-center gap-1 ml-auto shrink-0">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(item.createdAt), { locale: vi, addSuffix: true })}
                </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>👤</span>
                <span>{item.nguoiDang || 'Ẩn danh'}</span>
            </div>
            {session?.user?.name === item.nguoiDang && (
  <button
    onClick={e => handleDelete(e, item._id)}
    className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
  >
    <Trash2 className="h-3.5 w-3.5" />
    Xóa tin
  </button>
)}
            </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
