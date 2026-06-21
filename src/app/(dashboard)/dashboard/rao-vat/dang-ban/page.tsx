'use client';
import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, Upload, X, Loader2, ImagePlus, 
  Tag, MapPin, AlignLeft, DollarSign, Grid2X2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'phong-tro', label: '🏠 Phòng trọ' },
  { value: 'do-dung', label: '📦 Đồ dùng / Nội thất' },
  { value: 'xe-co', label: '🛵 Xe cộ' },
  { value: 'khac', label: '🗂️ Khác' },
];

interface FormData {
  tieuDe: string;
  danhMuc: string;
  gia: string;
  diaChi: string;
  moTa: string;
}

export default function DangBanPage() {
  const router = useRouter();
  const { data: session } = useSession(); // ← thêm vào đây
  console.log('Session user:', session?.user); // ← thêm dòng này

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    tieuDe: '',
    danhMuc: '',
    gia: '',
    diaChi: '',
    moTa: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 6) {
      toast.error('Tối đa 6 ảnh');
      return;
    }

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

 const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!data.success) throw new Error('Upload thất bại');
  return data.data.url; // ← đổi từ data.url thành data.data.url
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Session:', session); // ← thêm dòng này
    console.log('nguoiDang sẽ gửi:', session?.user?.name); // ← và dòng này
    if (!formData.tieuDe.trim()) return toast.error('Vui lòng nhập tiêu đề');
    if (!formData.danhMuc) return toast.error('Vui lòng chọn danh mục');
    if (!formData.moTa.trim()) return toast.error('Vui lòng nhập mô tả');

    setIsSubmitting(true);

    try {
      // Upload ảnh lên Cloudinary
      let hinhAnh: string[] = [];
      if (images.length > 0) {
        setIsUploading(true);
        hinhAnh = await Promise.all(images.map(uploadToCloudinary));
        setIsUploading(false);
      }

      // Lưu vào MongoDB
      const res = await fetch('/api/rao-vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gia: formData.gia ? Number(formData.gia) : null,
          hinhAnh,
          nguoiDang: session?.user?.name || 'Ẩn danh',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success('Đăng tin thành công!');
      router.refresh(); // ← thêm dòng này
      router.push('/dashboard/rao-vat');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đăng tin rao vặt</h1>
          <p className="text-sm text-slate-500">Điền thông tin để đăng tin lên hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Ảnh */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <ImagePlus className="h-4 w-4" />
            Hình ảnh <span className="text-slate-400 font-normal text-sm">(tối đa 6 ảnh)</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                <Image src={src} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {previews.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500"
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs">Thêm ảnh</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Thông tin chính */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Tag className="h-4 w-4" />
            Thông tin tin đăng
          </div>

          {/* Tiêu đề */}
          <div className="space-y-2">
            <Label htmlFor="tieuDe">Tiêu đề <span className="text-red-500">*</span></Label>
            <Input
              id="tieuDe"
              placeholder="VD: Cho thuê phòng trọ 20m² quận Bình Thạnh"
              value={formData.tieuDe}
              onChange={e => handleChange('tieuDe', e.target.value)}
              className="h-11 rounded-xl"
              maxLength={100}
            />
            <p className="text-xs text-slate-400 text-right">{formData.tieuDe.length}/100</p>
          </div>

          {/* Danh mục */}
          <div className="space-y-2">
            <Label>Danh mục <span className="text-red-500">*</span></Label>
            <Select value={formData.danhMuc} onValueChange={v => handleChange('danhMuc', v)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Giá */}
          <div className="space-y-2">
            <Label htmlFor="gia">Giá</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="gia"
                type="number"
                placeholder="Để trống nếu thỏa thuận"
                value={formData.gia}
                onChange={e => handleChange('gia', e.target.value)}
                className="pl-10 h-11 rounded-xl"
                min={0}
              />
            </div>
            {formData.gia && (
              <p className="text-xs text-blue-600">
                ≈ {Number(formData.gia).toLocaleString('vi-VN')} đồng
              </p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="diaChi">Địa chỉ</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="diaChi"
                placeholder="VD: Quận Bình Thạnh, TP.HCM"
                value={formData.diaChi}
                onChange={e => handleChange('diaChi', e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="moTa">Mô tả <span className="text-red-500">*</span></Label>
            <Textarea
              id="moTa"
              placeholder="Mô tả chi tiết về sản phẩm/dịch vụ..."
              value={formData.moTa}
              onChange={e => handleChange('moTa', e.target.value)}
              className="rounded-xl min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-slate-400 text-right">{formData.moTa.length}/2000</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12 rounded-xl"
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isUploading ? 'Đang tải ảnh...' : 'Đang đăng...'}
              </>
            ) : (
              'Đăng tin'
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
