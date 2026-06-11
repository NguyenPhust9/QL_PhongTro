'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCache } from '@/hooks/use-cache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Building2, 
  MapPin,
  Users,
  Eye,
  RefreshCw,
  Copy
} from 'lucide-react';
import { ToaNha } from '@/types';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { toast } from 'sonner';
import { ToaNhaDataTable } from './table';

export default function ToaNhaPage() {
  const cache = useCache<{ toaNhaList: ToaNha[] }>({ key: 'toa-nha-data', duration: 300000 });
  const [toaNhaList, setToaNhaList] = useState<ToaNha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingToaNha, setEditingToaNha] = useState<ToaNha | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Tòa nhà';
  }, []);

  useEffect(() => {
    fetchToaNha();
  }, []);

  const fetchToaNha = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (!forceRefresh) {
        const cachedData = cache.getCache();
        if (cachedData) {
          setToaNhaList(cachedData.toaNhaList || []);
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch('/api/toa-nha');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const toaNhas = result.data;
          setToaNhaList(toaNhas);
          cache.setCache({ toaNhaList: toaNhas });
        }
      }
    } catch (error) {
      console.error('Error fetching toa nha:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    cache.setIsRefreshing(true);
    await fetchToaNha(true);
    cache.setIsRefreshing(false);
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredToaNha = toaNhaList.filter(toaNha =>
    toaNha.tenToaNha.toLowerCase().includes(searchTerm.toLowerCase()) ||
    toaNha.diaChi.duong.toLowerCase().includes(searchTerm.toLowerCase()) ||
    toaNha.diaChi.phuong.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (toaNha: ToaNha) => {
    setEditingToaNha(toaNha);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/toa-nha/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          cache.clearCache();
          setToaNhaList(prev => prev.filter(toaNha => toaNha._id !== id));
          toast.success('Xóa tòa nhà thành công!');
        } else {
          toast.error(result.message || 'Có lỗi xảy ra khi xóa tòa nhà');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi xóa tòa nhà');
      }
    } catch (error) {
      console.error('Error deleting toa nha:', error);
      toast.error('Có lỗi xảy ra khi xóa tòa nhà');
    }
  };

  const formatAddress = (diaChi: ToaNha['diaChi']) => {
    return `${diaChi.soNha} ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.thanhPho}`;
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Quản lý tòa nhà</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Danh sách tất cả tòa nhà trong hệ thống</p>
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
                onClick={() => setEditingToaNha(null)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Thêm tòa nhà</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingToaNha ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingToaNha ? 'Cập nhật thông tin tòa nhà' : 'Nhập thông tin tòa nhà mới'}
              </DialogDescription>
            </DialogHeader>

            <ToaNhaForm
              toaNha={editingToaNha}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => {
                cache.clearCache();
                setIsDialogOpen(false);
                fetchToaNha(true);
                toast.success(editingToaNha ? 'Cập nhật tòa nhà thành công!' : 'Thêm tòa nhà thành công!');
              }}
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
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tổng tòa nhà</p>
              <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-2">{toaNhaList.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Phòng trống</p>
              <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {toaNhaList.reduce((sum, toaNha) => sum + ((toaNha as any).phongTrong || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Đang thuê</p>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {toaNhaList.reduce((sum, toaNha) => sum + ((toaNha as any).phongDangThue || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tìm thấy</p>
              <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-2">{filteredToaNha.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Danh sách tòa nhà</CardTitle>
              <CardDescription>
                {filteredToaNha.length} tòa nhà được tìm thấy
              </CardDescription>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Tìm kiếm tòa nhà..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ToaNhaDataTable
            data={filteredToaNha}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Danh sách tòa nhà</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Tìm kiếm tòa nhà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {filteredToaNha.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit mx-auto mb-3">
              <Building2 className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Không tìm thấy tòa nhà nào</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Thử thay đổi tìm kiếm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredToaNha.map((toaNha) => {
              const phongTrong = (toaNha as any).phongTrong || 0;
              const phongDangThue = (toaNha as any).phongDangThue || 0;
              const tongPhong = toaNha.tongSoPhong;

              return (
                <div key={toaNha._id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/30">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex-shrink-0">
                        <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-zinc-900 dark:text-white">{toaNha.tenToaNha}</h3>
                        <div className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{formatAddress(toaNha.diaChi)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                      <div className="text-center">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Tổng</div>
                        <div className="text-lg font-bold text-zinc-900 dark:text-white">{tongPhong}</div>
                      </div>
                      <div className="text-center border-x border-orange-200 dark:border-orange-900/30">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Trống</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{phongTrong}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Thuê</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{phongDangThue}</div>
                      </div>
                    </div>

                    {toaNha.tienNghiChung && toaNha.tienNghiChung.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-2">Tiện nghi:</div>
                        <div className="flex flex-wrap gap-2">
                          {toaNha.tienNghiChung.slice(0, 3).map((tienNghi) => (
                            <Badge key={tienNghi} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 text-xs">
                              {tienNghi}
                            </Badge>
                          ))}
                          {toaNha.tienNghiChung.length > 3 && (
                            <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 text-xs">
                              +{toaNha.tienNghiChung.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const publicUrl = `${window.location.origin}/xem-phong`;
                          navigator.clipboard.writeText(publicUrl);
                          toast.success('Đã sao chép link trang xem phòng');
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(toaNha)}
                        className="flex-1 text-xs border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Sửa
                      </Button>
                      <DeleteConfirmPopover
                        onConfirm={() => handleDelete(toaNha._id!)}
                        title="Xóa tòa nhà"
                        description="Bạn có chắc chắn muốn xóa tòa nhà này?"
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Form component for adding/editing toa nha
function ToaNhaForm({ 
  toaNha, 
  onClose, 
  onSuccess 
}: { 
  toaNha: ToaNha | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    tenToaNha: toaNha?.tenToaNha || '',
    soNha: toaNha?.diaChi.soNha || '',
    duong: toaNha?.diaChi.duong || '',
    phuong: toaNha?.diaChi.phuong || '',
    quan: toaNha?.diaChi.quan || '',
    thanhPho: toaNha?.diaChi.thanhPho || '',
    moTa: toaNha?.moTa || '',
    tienNghiChung: toaNha?.tienNghiChung || [],
  });

  const tienNghiOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'camera', label: 'Camera an ninh' },
    { value: 'baoVe', label: 'Bảo vệ 24/7' },
    { value: 'giuXe', label: 'Giữ xe' },
    { value: 'thangMay', label: 'Thang máy' },
    { value: 'sanPhoi', label: 'Sân phơi' },
    { value: 'nhaVeSinhChung', label: 'Nhà vệ sinh chung' },
    { value: 'khuBepChung', label: 'Khu bếp chung' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        tenToaNha: formData.tenToaNha,
        diaChi: {
          soNha: formData.soNha,
          duong: formData.duong,
          phuong: formData.phuong,
          quan: formData.quan,
          thanhPho: formData.thanhPho,
        },
        moTa: formData.moTa,
        tienNghiChung: formData.tienNghiChung,
      };

      const url = toaNha ? `/api/toa-nha/${toaNha._id}` : '/api/toa-nha';
      const method = toaNha ? 'PUT' : 'POST';

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
          onSuccess();
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
    }
  };

  const handleTienNghiChange = (tienNghi: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tienNghiChung: checked 
        ? [...prev.tienNghiChung, tienNghi]
        : prev.tienNghiChung.filter(t => t !== tienNghi)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenToaNha" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên tòa nhà</Label>
        <Input
          id="tenToaNha"
          value={formData.tenToaNha}
          onChange={(e) => setFormData(prev => ({ ...prev, tenToaNha: e.target.value }))}
          required
          className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Tên tòa nhà"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="soNha" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Số nhà</Label>
          <Input
            id="soNha"
            value={formData.soNha}
            onChange={(e) => setFormData(prev => ({ ...prev, soNha: e.target.value }))}
            required
            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Số nhà"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duong" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên đường</Label>
          <Input
            id="duong"
            value={formData.duong}
            onChange={(e) => setFormData(prev => ({ ...prev, duong: e.target.value }))}
            required
            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Tên đường"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phuong" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Phường/Xã</Label>
          <Input
            id="phuong"
            value={formData.phuong}
            onChange={(e) => setFormData(prev => ({ ...prev, phuong: e.target.value }))}
            required
            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Phường/Xã"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quan" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quận/Huyện</Label>
          <Input
            id="quan"
            value={formData.quan}
            onChange={(e) => setFormData(prev => ({ ...prev, quan: e.target.value }))}
            required
            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Quận/Huyện"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thanhPho" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thành phố</Label>
        <Input
          id="thanhPho"
          value={formData.thanhPho}
          onChange={(e) => setFormData(prev => ({ ...prev, thanhPho: e.target.value }))}
          required
          className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Thành phố"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="moTa" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mô tả</Label>
        <Textarea
          id="moTa"
          value={formData.moTa}
          onChange={(e) => setFormData(prev => ({ ...prev, moTa: e.target.value }))}
          rows={3}
          className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Mô tả chi tiết về tòa nhà"
        />
      </div>

      <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tiện nghi chung</Label>
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <input
              type="checkbox"
              id="chon-tat-ca"
              checked={formData.tienNghiChung.length === tienNghiOptions.length}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  tienNghiChung: e.target.checked ? tienNghiOptions.map(o => o.value) : [],
                }))
              }
              className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <Label htmlFor="chon-tat-ca" className="text-sm font-medium cursor-pointer">
              Chọn tất cả
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {tienNghiOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option.value}
                  checked={formData.tienNghiChung.includes(option.value)}
                  onChange={(e) => handleTienNghiChange(option.value, e.target.checked)}
                  className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <Label htmlFor={option.value} className="text-sm cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
        >
          {toaNha ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogFooter>
    </form>
  );
}
