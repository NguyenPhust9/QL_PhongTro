'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCache } from '@/hooks/use-cache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  EyeIcon,
  Users, 
  Phone,
  Mail,
  Calendar,
  MapPin,
  Info,
  CreditCard,
  RefreshCw,
  Copy
} from 'lucide-react';
import { KhachThue } from '@/types';
import { KhachThueDataTable } from './table';
import { CCCDUpload } from '@/components/ui/cccd-upload';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function KhachThuePage() {
  const cache = useCache<{ khachThueList: KhachThue[] }>({ key: 'khach-thue-data', duration: 300000 });
  const [khachThueList, setKhachThueList] = useState<KhachThue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrangThai, setSelectedTrangThai] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKhachThue, setEditingKhachThue] = useState<KhachThue | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Khách thuê';
  }, []);

  useEffect(() => {
    fetchKhachThue();
  }, []);

  const fetchKhachThue = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Thử load từ cache trước
      if (!forceRefresh) {
        const cachedData = cache.getCache();
        if (cachedData) {
          setKhachThueList(cachedData.khachThueList || []);
          setLoading(false);
          return;
        }
      }
      
      const params = new URLSearchParams();
      if (selectedTrangThai && selectedTrangThai !== 'all') params.append('trangThai', selectedTrangThai);
      
      const response = await fetch(`/api/khach-thue?${params.toString()}&limit=100`);
      let khachThueData: KhachThue[] = [];
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          khachThueData = result.data;
          setKhachThueList(khachThueData);
        }
      }
      
      // Lưu cache với data mới
      if (khachThueData.length > 0) {
        cache.setCache({ khachThueList: khachThueData });
      }
    } catch (error) {
      console.error('Error fetching khach thue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    cache.setIsRefreshing(true);
    await fetchKhachThue(true);
    cache.setIsRefreshing(false);
    toast.success('Đã tải dữ liệu mới nhất');
  };

  useEffect(() => {
    // Khi filter thay đổi, cần force refresh để lấy data mới theo filter
    if (selectedTrangThai) {
      fetchKhachThue(true);
    }
  }, [selectedTrangThai]);

  const filteredKhachThue = khachThueList.filter(khachThue =>
    khachThue.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
   (khachThue.soDienThoai?.includes(searchTerm) ?? false) ||
    khachThue.cccd.includes(searchTerm) ||
    khachThue.queQuan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (khachThue: KhachThue) => {
    setEditingKhachThue(khachThue);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách thuê này?')) {
      setActionLoading(`delete-${id}`);
      try {
        const response = await fetch(`/api/khach-thue/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            cache.clearCache();
            setKhachThueList(prev => prev.filter(khachThue => khachThue._id !== id));
            toast.success('Xóa khách thuê thành công!');
          } else {
            toast.error(result.message || 'Có lỗi xảy ra');
          }
        } else {
          const error = await response.json();
          toast.error(error.message || 'Có lỗi xảy ra');
        }
      } catch (error) {
        console.error('Error deleting khach thue:', error);
        toast.error('Có lỗi xảy ra khi xóa khách thuê');
      } finally {
        setActionLoading(null);
      }
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-200 dark:bg-zinc-800 rounded-xl h-24 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-zinc-200 dark:bg-zinc-800 rounded-xl h-96 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Quản lý khách thuê</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Danh sách tất cả khách thuê trong hệ thống</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={cache.isRefreshing}
            className="flex-1 sm:flex-none border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <RefreshCw className={`h-4 w-4 ${cache.isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2 text-sm">{cache.isRefreshing ? 'Đang tải...' : 'Tải mới'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => setEditingKhachThue(null)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Thêm khách thuê</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingKhachThue ? 'Chỉnh sửa khách thuê' : 'Thêm khách thuê mới'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingKhachThue ? 'Cập nhật thông tin khách thuê' : 'Nhập thông tin khách thuê mới'}
              </DialogDescription>
            </DialogHeader>

            <KhachThueForm
              key={editingKhachThue?._id || 'new'}   // 👈 thêm dòng này
              khachThue={editingKhachThue}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={(newKhachThue) => {
                cache.clearCache();
                setIsDialogOpen(false);
                if (newKhachThue) {
                  if (editingKhachThue) {
                    setKhachThueList(prev => prev.map(kt =>
                      kt._id === editingKhachThue._id ? 
                      newKhachThue : kt
                    ));
                  } else {
                    setKhachThueList(prev => [newKhachThue, ...prev]);
                  }
                } else {
                  fetchKhachThue();
                }
                toast.success(editingKhachThue ? 'Cập nhật khách thuê thành công!' : 'Thêm khách thuê thành công!');
              }}
              isSubmitting={isFormSubmitting}
              setIsSubmitting={setIsFormSubmitting}
            />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tổng khách thuê</p>
              <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-2">{khachThueList.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Đang thuê</p>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {khachThueList.filter(k => k.trangThai === 'dangThue').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Đã trả phòng</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-600 dark:text-slate-400 mt-2">
                {khachThueList.filter(k => k.trangThai === 'daTraPhong').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/20">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Chưa thuê</p>
              <p className="text-2xl lg:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {khachThueList.filter(k => k.trangThai === 'chuaThue').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Danh sách khách thuê</CardTitle>
              <CardDescription>
                {filteredKhachThue.length} khách thuê được tìm thấy
              </CardDescription>
            </div>
            <div className="flex gap-3 flex-1 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Tìm kiếm khách thuê..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
                <SelectTrigger className="w-40 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="dangThue">Đang thuê</SelectItem>
                  <SelectItem value="daTraPhong">Đã trả phòng</SelectItem>
                  <SelectItem value="chuaThue">Chưa thuê</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <KhachThueDataTable
            data={filteredKhachThue}
            onEdit={handleEdit}
            onDelete={handleDelete}
            actionLoading={actionLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTrangThai={selectedTrangThai}
            onTrangThaiChange={setSelectedTrangThai}
          />
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Danh sách khách thuê</h2>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm kiếm khách thuê..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="dangThue">Đang thuê</SelectItem>
                <SelectItem value="daTraPhong">Đã trả phòng</SelectItem>
                <SelectItem value="chuaThue">Chưa thuê</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-4">
          {filteredKhachThue.map((khachThue) => {
            const getTrangThaiColor = (trangThai: string) => {
              switch (trangThai) {
                case 'dangThue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                case 'daTraPhong': return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
                case 'chuaThue': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
              }
            };

            const getTrangThaiText = (trangThai: string) => {
              switch (trangThai) {
                case 'dangThue': return 'Đang thuê';
                case 'daTraPhong': return 'Đã trả phòng';
                case 'chuaThue': return 'Chưa thuê';
                default: return trangThai;
              }
            };

            return (
              <div key={khachThue._id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/30">
                <div className="p-4">
                  {/* Header with name and status */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{khachThue.hoTen}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">{khachThue.gioiTinh}</p>
                    </div>
                    <Badge className={`${getTrangThaiColor(khachThue.trangThai)} text-xs font-medium`}>
                      {getTrangThaiText(khachThue.trangThai)}
                    </Badge>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2 mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-zinc-900 dark:text-white font-medium">{khachThue.soDienThoai}</span>
                    </div>
                    {khachThue.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        <span className="truncate text-zinc-900 dark:text-white">{khachThue.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="font-mono text-zinc-900 dark:text-white">{khachThue.cccd}</span>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="space-y-1 mb-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Ngày sinh: {new Date(khachThue.ngaySinh).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{khachThue.queQuan}</span>
                    </div>
                    {khachThue.ngheNghiep && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>{khachThue.ngheNghiep}</span>
                      </div>
                    )}
                  </div>

                  {/* Room info if available */}
                  {(khachThue as any).hopDongHienTai?.phong && (
                    <div className="mb-3 p-3 border-t border-zinc-200 dark:border-zinc-700 pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                          <Users className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">Phòng: {(khachThue as any).hopDongHienTai.phong.maPhong}</span>
                      </div>
                      {(khachThue as any).hopDongHienTai.phong.toaNha && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 ml-6 mt-1">
                          <span>{(khachThue as any).hopDongHienTai.phong.toaNha.tenToaNha}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const publicUrl = `${window.location.origin}/khach-thue/dang-nhap`;
                        navigator.clipboard.writeText(publicUrl);
                        toast.success('Đã sao chép link đăng nhập khách thuê');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 flex-1"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(khachThue)}
                      disabled={actionLoading === `edit-${khachThue._id}`}
                      className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(khachThue._id!)}
                      disabled={actionLoading === `delete-${khachThue._id}`}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredKhachThue.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit mx-auto mb-3">
              <Users className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Không có khách thuê nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Form component for adding/editing khach thue
function KhachThueForm({ 
  khachThue, 
  onClose, 
  onSuccess,
  isSubmitting,
  setIsSubmitting
}: { 
  khachThue: KhachThue | null;
  onClose: () => void;
  onSuccess: (newKhachThue?: KhachThue) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    hoTen: khachThue?.hoTen || '',
    soDienThoai: khachThue?.soDienThoai || '',
    email: khachThue?.email || '',
    cccd: khachThue?.cccd || '',
    ngaySinh: khachThue?.ngaySinh ? new Date(khachThue.ngaySinh).toISOString().split('T')[0] : '',
    gioiTinh: khachThue?.gioiTinh || 'nam',
    queQuan: khachThue?.queQuan || '',
    anhCCCD: {
      matTruoc: khachThue?.anhCCCD?.matTruoc || '',
      matSau: khachThue?.anhCCCD?.matSau || '',
    },
    ngheNghiep: khachThue?.ngheNghiep || '',
    matKhau: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Ngăn submit nhiều lần
    
    setIsSubmitting(true);
    
    try {
      const url = khachThue ? `/api/khach-thue/${khachThue._id}` : '/api/khach-thue';
      const method = khachThue ? 'PUT' : 'POST';

   const submitData = { ...formData };
if (!submitData.matKhau || submitData.matKhau.trim() === '') {
  delete (submitData as any).matKhau;
}
if (!submitData.email || submitData.email.trim() === '') {
  (submitData as any).email = undefined;
}
if (!submitData.soDienThoai || submitData.soDienThoai.trim() === '') {
  (submitData as any).soDienThoai = undefined;
}
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onSuccess(result.data);
        } else {
          toast.error(result.message || 'Có lỗi xảy ra');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi gửi form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="thong-tin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="thong-tin" className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
            <Info className="h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="anh-cccd" className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
            <CreditCard className="h-4 w-4" />
            Ảnh CCCD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thong-tin" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hoTen" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Họ tên</Label>
              <Input
                id="hoTen"
                value={formData.hoTen}
                onChange={(e) => setFormData(prev => ({ ...prev, hoTen: e.target.value }))}
                required
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập họ tên"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soDienThoai" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Số điện thoại</Label>
              <Input
                id="soDienThoai"
                value={formData.soDienThoai}
                onChange={(e) => setFormData(prev => ({ ...prev, soDienThoai: e.target.value }))}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cccd" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">CCCD</Label>
              <Input
                id="cccd"
                value={formData.cccd}
                onChange={(e) => setFormData(prev => ({ ...prev, cccd: e.target.value }))}
                required
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập CCCD"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ngaySinh" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ngày sinh</Label>
              <Input
                id="ngaySinh"
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData(prev => ({ ...prev, ngaySinh: e.target.value }))}
                required
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gioiTinh" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Giới tính</Label>
              <Select value={formData.gioiTinh} onValueChange={(value) => setFormData(prev => ({ ...prev, gioiTinh: value as 'nam' | 'nu' }))}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nam">Nam</SelectItem>
                  <SelectItem value="nu">Nữ</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queQuan" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quê quán</Label>
            <Input
              id="queQuan"
              value={formData.queQuan}
              onChange={(e) => setFormData(prev => ({ ...prev, queQuan: e.target.value }))}
              required
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập quê quán"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngheNghiep" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nghề nghiệp</Label>
            <Input
              id="ngheNghiep"
              value={formData.ngheNghiep}
              onChange={(e) => setFormData(prev => ({ ...prev, ngheNghiep: e.target.value }))}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập nghề nghiệp"
            />
          </div>

          <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <Label htmlFor="matKhau" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mật khẩu đăng nhập</Label>
            <Input
              id="matKhau"
              type="password"
              value={formData.matKhau}
              onChange={(e) => setFormData(prev => ({ ...prev, matKhau: e.target.value }))}
              placeholder={khachThue && khachThue.matKhau ? "Để trống nếu không muốn thay đổi" : "Nhập mật khẩu (tối thiểu 6 ký tự)"}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {khachThue && khachThue.matKhau
                ? "Khách thuê đã có tài khoản đăng nhập. Để trống nếu không muốn thay đổi mật khẩu."
                : "Tạo mật khẩu để khách thuê có thể đăng nhập vào hệ thống."
              }
            </p>
          </div>
        </TabsContent>

        <TabsContent value="anh-cccd" className="space-y-6 mt-6">
          <CCCDUpload
            anhCCCD={formData.anhCCCD}
            onCCCDChange={(anhCCCD) => setFormData(prev => ({ ...prev, anhCCCD }))}
            className="w-full"
          />
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>{khachThue ? 'Đang cập nhật...' : 'Đang thêm...'}</span>
            </>
          ) : (
            <span>{khachThue ? 'Cập nhật' : 'Thêm mới'}</span>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}