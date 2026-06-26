'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCache } from '@/hooks/use-cache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhongVideoUpload } from '@/components/ui/phong-video-upload';
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
  Home, 
  MapPin,
  Users,
  Eye,
  ExternalLink,
  Copy,
  Info,
  Image,
  RefreshCw,
  Video,
  Building2,
  Ruler,
  Banknote,
  Phone,
  CalendarDays,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Phong, ToaNha } from '@/types';
import { PhongDataTable } from './table';
import { PhongImageUpload } from '@/components/ui/phong-image-upload';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function PhongPage() {
  const cache = useCache<{
    phongList: Phong[];
    toaNhaList: ToaNha[];
  }>({ key: 'phong-data', duration: 300000 });
  
  const [phongList, setPhongList] = useState<Phong[]>([]);
  const [toaNhaList, setToaNhaList] = useState<ToaNha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToaNha, setSelectedToaNha] = useState('');
  const [selectedTrangThai, setSelectedTrangThai] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhong, setEditingPhong] = useState<Phong | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [viewingPhongName, setViewingPhongName] = useState('');
  const [isTenantsViewerOpen, setIsTenantsViewerOpen] = useState(false);
  const [viewingTenants, setViewingTenants] = useState<any[]>([]);
  const [viewingTenantsPhongName, setViewingTenantsPhongName] = useState('');
  // ── Thêm: state cho mobile detail modal ──
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [mobileDetailPhong, setMobileDetailPhong] = useState<Phong | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Phòng';
  }, []);

  useEffect(() => {
    fetchPhong();
    fetchToaNha();
  }, []);

  const fetchPhong = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!forceRefresh) {
        const cachedData = cache.getCache();
        if (cachedData) {
          setPhongList(cachedData.phongList || []);
          setToaNhaList(cachedData.toaNhaList || []);
          setLoading(false);
          return;
        }
      }
      const params = new URLSearchParams();
      if (selectedToaNha && selectedToaNha !== 'all') params.append('toaNha', selectedToaNha);
      if (selectedTrangThai && selectedTrangThai !== 'all') params.append('trangThai', selectedTrangThai);
      const response = await fetch(`/api/phong?${params.toString()}&limit=100`);
      let phongData: Phong[] = [];
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          phongData = result.data;
          setPhongList(phongData);
        }
      }
      const toaNhaResponse = await fetch('/api/toa-nha');
      let toaNhaData: ToaNha[] = [];
      if (toaNhaResponse.ok) {
        const toaNhaResult = await toaNhaResponse.json();
        if (toaNhaResult.success) {
          toaNhaData = toaNhaResult.data;
          setToaNhaList(toaNhaData);
        }
      }
      if (phongData.length > 0 || toaNhaData.length > 0) {
        cache.setCache({ phongList: phongData, toaNhaList: toaNhaData });
      }
    } catch (error) {
      console.error('Error fetching phong:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToaNha = async () => {
    try {
      const response = await fetch('/api/toa-nha');
      if (response.ok) {
        const result = await response.json();
        if (result.success) setToaNhaList(result.data);
      }
    } catch (error) {
      console.error('Error fetching toa nha:', error);
    }
  };

  const handleRefresh = async () => {
    cache.setIsRefreshing(true);
    await fetchPhong(true);
    cache.setIsRefreshing(false);
    toast.success('Đã tải dữ liệu mới nhất');
  };

  useEffect(() => {
    if (selectedToaNha || selectedTrangThai) fetchPhong(true);
  }, [selectedToaNha, selectedTrangThai]);

  const filteredPhong = phongList.filter(phong =>
    phong.maPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phong.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (phong: Phong) => {
    setEditingPhong(phong);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/phong/${id}`, { method: 'DELETE' });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          cache.clearCache();
          setPhongList(prev => prev.filter(phong => phong._id !== id));
          toast.success('Xóa phòng thành công!');
        } else {
          toast.error(result.message || 'Có lỗi xảy ra khi xóa phòng');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi xóa phòng');
      }
    } catch (error) {
      console.error('Error deleting phong:', error);
      toast.error('Có lỗi xảy ra khi xóa phòng');
    }
  };

  const handleViewImages = (phong: Phong) => {
    if (phong.anhPhong && phong.anhPhong.length > 0) {
      setViewingImages(phong.anhPhong);
      setViewingPhongName(phong.maPhong);
      setIsImageViewerOpen(true);
    } else {
      toast.info('Phòng này chưa có ảnh nào');
    }
  };

  const handleViewTenants = (phong: Phong) => {
    const phongData = phong as any;
    const hopDong = phongData.hopDongHienTai;
    if (hopDong && hopDong.khachThueId && hopDong.khachThueId.length > 0) {
      setViewingTenants(hopDong.khachThueId);
      setViewingTenantsPhongName(phong.maPhong);
      setIsTenantsViewerOpen(true);
    } else {
      toast.info('Phòng này chưa có người thuê');
    }
  };

  // ── Thêm: mở mobile detail modal ──
  const handleMobileCardClick = (phong: Phong) => {
    setMobileDetailPhong(phong);
    setIsMobileDetailOpen(true);
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Quản lý phòng</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Danh sách tất cả phòng trong hệ thống</p>
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
                onClick={() => setEditingPhong(null)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Thêm phòng</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingPhong ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingPhong ? 'Cập nhật thông tin phòng' : 'Nhập thông tin phòng mới'}
                </DialogDescription>
              </DialogHeader>
              <PhongForm
                phong={editingPhong}
                toaNhaList={toaNhaList}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                  cache.clearCache();
                  setIsDialogOpen(false);
                  fetchPhong(true);
                  toast.success(editingPhong ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
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
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tổng số phòng</p>
              <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-2">{phongList.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Home className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Phòng trống</p>
              <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {phongList.filter(p => p.trangThai === 'trong').length}
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
                {phongList.filter(p => p.trangThai === 'dangThue').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-all hover:shadow-md hover:border-red-200 dark:hover:border-red-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Bảo trì</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {phongList.filter(p => p.trangThai === 'baoTri').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Danh sách phòng</CardTitle>
              <CardDescription>{filteredPhong.length} phòng được tìm thấy</CardDescription>
            </div>
            <div className="flex gap-3 flex-1 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Tìm kiếm phòng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
                <SelectTrigger className="w-40 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tòa nhà</SelectItem>
                  {toaNhaList.map((toaNha) => (
                    <SelectItem key={toaNha._id} value={toaNha._id!}>{toaNha.tenToaNha}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
                <SelectTrigger className="w-32 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="trong">Trống</SelectItem>
                  <SelectItem value="daDat">Đã đặt</SelectItem>
                  <SelectItem value="dangThue">Đang thuê</SelectItem>
                  <SelectItem value="baoTri">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PhongDataTable
            data={filteredPhong}
            toaNhaList={toaNhaList}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewImages={handleViewImages}
            onViewTenants={handleViewTenants}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedToaNha={selectedToaNha}
            onToaNhaChange={setSelectedToaNha}
            selectedTrangThai={selectedTrangThai}
            onTrangThaiChange={setSelectedTrangThai}
            allToaNhaList={toaNhaList}
          />
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Danh sách phòng</h2>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm kiếm phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tòa nhà</SelectItem>
                  {toaNhaList.map((toaNha) => (
                    <SelectItem key={toaNha._id} value={toaNha._id!}>{toaNha.tenToaNha}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="trong">Trống</SelectItem>
                  <SelectItem value="daDat">Đã đặt</SelectItem>
                  <SelectItem value="dangThue">Đang thuê</SelectItem>
                  <SelectItem value="baoTri">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredPhong.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit mx-auto mb-3">
              <Home className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Không tìm thấy phòng nào</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPhong.map((phong) => {
              const getTrangThaiColor = (trangThai: string) => {
                switch (trangThai) {
                  case 'trong': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                  case 'daDat': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                  case 'dangThue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                  case 'baoTri': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                  default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
                }
              };
              const getTrangThaiText = (trangThai: string) => {
                switch (trangThai) {
                  case 'trong': return 'Trống';
                  case 'daDat': return 'Đã đặt';
                  case 'dangThue': return 'Đang thuê';
                  case 'baoTri': return 'Bảo trì';
                  default: return trangThai;
                }
              };

              return (
                // ── Thêm onClick để mở detail modal ──
                <div
                  key={phong._id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/30 cursor-pointer"
                  onClick={() => handleMobileCardClick(phong)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{phong.maPhong}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Tầng {phong.tang} • {phong.dienTich}m²</p>
                      </div>
                      <Badge className={`${getTrangThaiColor(phong.trangThai)} text-xs font-medium`}>
                        {getTrangThaiText(phong.trangThai)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                      <div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Giá thuê</div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(phong.giaThue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Tiền cọc</div>
                        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(phong.tienCoc)}
                        </div>
                      </div>
                    </div>

                    {/* Thông tin người thuê */}
                    {(() => {
                      const phongData = phong as any;
                      const hopDong = phongData.hopDongHienTai;
                      if (hopDong && hopDong.khachThueId && hopDong.khachThueId.length > 0) {
                        const nguoiDaiDien = hopDong.nguoiDaiDien;
                        const soLuongKhachThue = hopDong.khachThueId.length;
                        return (
                          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Người thuê</span>
                            </div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {nguoiDaiDien?.hoTen || 'N/A'}
                            </div>
                            {nguoiDaiDien?.soDienThoai && (
                              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                {nguoiDaiDien.soDienThoai}
                              </div>
                            )}
                            {soLuongKhachThue > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewTenants(phong); }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2"
                              >
                                +{soLuongKhachThue - 1} người khác
                              </button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {phong.anhPhong && phong.anhPhong.length > 0 && (
                      <div className="mb-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewImages(phong); }}>
                        <img
                          src={phong.anhPhong[0]}
                          alt={phong.maPhong}
                          className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                        {phong.anhPhong.length > 1 && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5">
                            +{phong.anhPhong.length - 1} ảnh khác
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                      {phong.anhPhong && phong.anhPhong.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewImages(phong)}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-900/30"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const publicUrl = `${window.location.origin}/xem-phong`;
                          navigator.clipboard.writeText(publicUrl);
                          toast.success('Đã sao chép link trang xem phòng');
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(phong)}
                        className="flex-1 text-xs border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Sửa
                      </Button>
                      <DeleteConfirmPopover
                        onConfirm={() => handleDelete(phong._id!)}
                        title="Xóa phòng"
                        description="Bạn có chắc chắn muốn xóa phòng này?"
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

      {/* ── Thêm: Mobile Detail Dialog ── */}
      <Dialog open={isMobileDetailOpen} onOpenChange={setIsMobileDetailOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-0 overflow-hidden gap-0">
          {mobileDetailPhong && (() => {
            const p = mobileDetailPhong as any;
            const hopDong = p.hopDongHienTai;
            const hasNguoiThue = hopDong?.khachThueId?.length > 0;
            const nguoiDaiDien = hopDong?.nguoiDaiDien;
            const soLuong = hopDong?.khachThueId?.length || 0;
            const imageCount = mobileDetailPhong.anhPhong?.length || 0;
            const getTrangThaiColor = (tt: string) => ({
              trong: 'bg-green-500', dangThue: 'bg-blue-500',
              daDat: 'bg-orange-400', baoTri: 'bg-red-500',
            }[tt] || 'bg-zinc-400');
            const getTrangThaiText = (tt: string) => ({
              trong: 'Trống', dangThue: 'Đang thuê', daDat: 'Đã đặt', baoTri: 'Bảo trì',
            }[tt] || tt);
            const getToaNhaName = () => {
              const tn = mobileDetailPhong.toaNha;
              if (typeof tn === 'object' && tn && 'tenToaNha' in tn) return (tn as any).tenToaNha;
              return toaNhaList.find(t => t._id === tn)?.tenToaNha || 'N/A';
            };
            return (
              <>
                {/* Stripe */}
                <div className={`h-1.5 w-full ${getTrangThaiColor(mobileDetailPhong.trangThai)}`} />
                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold">{mobileDetailPhong.maPhong}</span>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-white ${getTrangThaiColor(mobileDetailPhong.trangThai)}`}>
                        {getTrangThaiText(mobileDetailPhong.trangThai)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {getToaNhaName()} · Tầng {mobileDetailPhong.tang}
                    </p>
                  </div>
                </div>
                <Separator />
                {/* Body */}
                <div className="px-5 py-2 max-h-[55vh] overflow-y-auto space-y-3">
                  {/* Thông tin */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">Diện tích</p>
                      <p className="text-sm font-bold">{mobileDetailPhong.dienTich} m²</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">Giá thuê</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(mobileDetailPhong.giaThue)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">Tiền cọc</p>
                      <p className="text-sm font-bold text-orange-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(mobileDetailPhong.tienCoc)}
                      </p>
                    </div>
                  </div>
                  {/* Tiện nghi */}
                  {p.tienNghi?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tiện nghi</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.tienNghi.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full border bg-zinc-50 dark:bg-zinc-800">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Người thuê */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Người thuê</p>
                    {hasNguoiThue ? (
                      <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-800 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{nguoiDaiDien?.hoTen || 'N/A'}</p>
                            {nguoiDaiDien?.soDienThoai && (
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />{nguoiDaiDien.soDienThoai}
                              </p>
                            )}
                          </div>
                          {soLuong > 1 && (
                            <button
                              onClick={() => { setIsMobileDetailOpen(false); handleViewTenants(mobileDetailPhong); }}
                              className="text-xs text-blue-600 font-medium shrink-0"
                            >
                              +{soLuong - 1} người
                            </button>
                          )}
                        </div>
                        {hopDong?.ngayBatDau && (
                          <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-xs text-zinc-500">
                            <CalendarDays className="h-3 w-3" />
                            Từ {new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}
                            {hopDong?.ngayKetThuc && <> đến {new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}</>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-4 text-center">
                        <p className="text-xs text-zinc-500">Chưa có người thuê</p>
                      </div>
                    )}
                  </div>
                  <div className="pb-2" />
                </div>
                <Separator />
                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900">
                  <div className="flex gap-2">
                    {imageCount > 0 && (
                      <Button variant="outline" size="sm" onClick={() => { setIsMobileDetailOpen(false); handleViewImages(mobileDetailPhong); }}>
                        <Eye className="h-4 w-4 mr-1.5" />{imageCount} ảnh
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsMobileDetailOpen(false)}>Đóng</Button>
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0"
                      onClick={() => { setIsMobileDetailOpen(false); handleEdit(mobileDetailPhong); }}>
                      <Edit className="h-4 w-4 mr-1.5" />Sửa
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] md:w-full bg-zinc-900 dark:bg-zinc-950 border-zinc-800">
          <DialogHeader className="border-b border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Image className="h-5 w-5" />
              Ảnh phòng {viewingPhongName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingImages.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                  {viewingImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="flex items-center justify-center p-2">
                        <img
                          src={image}
                          alt={`Ảnh ${index + 1} của phòng ${viewingPhongName}`}
                          className="max-h-[60vh] w-auto object-contain rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {viewingImages.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                  </>
                )}
              </Carousel>
            )}
          </div>
          <DialogFooter className="border-t border-zinc-800">
            <div className="text-sm text-zinc-400">
              {viewingImages.length} ảnh {viewingImages.length > 1 && '- Vuốt để xem thêm'}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenants Viewer Dialog */}
      <Dialog open={isTenantsViewerOpen} onOpenChange={setIsTenantsViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto w-[95vw] md:w-full">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Danh sách người thuê - Phòng {viewingTenantsPhongName}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Tổng cộng {viewingTenants.length} người đang thuê phòng này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingTenants.map((tenant, index) => (
              <div key={tenant._id || index} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/30 dark:to-rose-900/30 flex items-center justify-center">
                        <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{tenant.hoTen}</h3>
                        <Badge className="ml-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">SĐT:</span>
                        <span className="text-zinc-900 dark:text-white">{tenant.soDienThoai}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setIsTenantsViewerOpen(false)}
              className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for adding/editing phong
function PhongForm({ 
  phong, 
  toaNhaList,
  onClose, 
  onSuccess 
}: { 
  phong: Phong | null;
  toaNhaList: ToaNha[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const getToaNhaId = (toaNha: string | { _id: string }) => {
    if (typeof toaNha === 'object' && toaNha !== null) return toaNha._id || '';
    if (typeof toaNha === 'string') return toaNha;
    return '';
  };

  const [formData, setFormData] = useState({
    maPhong: phong?.maPhong || '',
    toaNha: phong?.toaNha ? getToaNhaId(phong.toaNha) : '',
    tang: phong?.tang || 1,
    dienTich: phong?.dienTich || 0,
    giaThue: phong?.giaThue || 0,
    tienCoc: phong?.tienCoc || 0,
    moTa: phong?.moTa || '',
    anhPhong: phong?.anhPhong || [],
    videoPhong: phong?.videoPhong || [],
    tienNghi: phong?.tienNghi || [],
    soNguoiToiDa: phong?.soNguoiToiDa || 1,
    trangThai: phong?.trangThai || 'trong',
  });
  const [activeTab, setActiveTab] = useState('thong-tin');

  useEffect(() => {
    if (phong) {
      const toaNhaId = getToaNhaId(phong.toaNha);
      console.log('Editing phong:', phong);
      console.log('toaNha object:', phong.toaNha);
      console.log('toaNha ID:', toaNhaId);
      setFormData({
        maPhong: phong.maPhong || '',
        toaNha: toaNhaId,
        tang: phong.tang || 1,
        dienTich: phong.dienTich || 0,
        giaThue: phong.giaThue || 0,
        tienCoc: phong.tienCoc || 0,
        moTa: phong.moTa || '',
        anhPhong: phong.anhPhong || [],
        videoPhong: phong.videoPhong || [],
        tienNghi: phong.tienNghi || [],
        soNguoiToiDa: phong.soNguoiToiDa || 1,
        trangThai: phong.trangThai || 'trong',
      });
    } else {
      setFormData({
        maPhong: '',
        toaNha: '',
        tang: 1,
        dienTich: 0,
        giaThue: 0,
        tienCoc: 0,
        moTa: '',
        anhPhong: [],
        videoPhong: [],
        tienNghi: [],
        soNguoiToiDa: 1,
        trangThai: 'trong',
      });
    }
  }, [phong]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const tienNghiOptions = [
    { value: 'dieuhoa', label: 'Điều hòa' },
    { value: 'nonglanh', label: 'Nóng lạnh' },
    { value: 'tulanh', label: 'Tủ lạnh' },
    { value: 'giuong', label: 'Giường' },
    { value: 'tuquanao', label: 'Tủ quần áo' },
    { value: 'banlamviec', label: 'Bàn làm việc' },
    { value: 'ghe', label: 'Ghế' },
    { value: 'tivi', label: 'TV' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'maygiat', label: 'Máy giặt' },
    { value: 'bep', label: 'Bếp' },
    { value: 'noi', label: 'Nồi' },
    { value: 'chen', label: 'Chén' },
    { value: 'bat', label: 'Bát' },
  ];

  const allSelected = formData.tienNghi.length === tienNghiOptions.length;

  const handleToggleAllTienNghi = () => {
    setFormData(prev => ({
      ...prev,
      tienNghi: allSelected ? [] : tienNghiOptions.map(item => item.value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maPhong.trim()) {
      setActiveTab('thong-tin');
      toast.error('Mã phòng là bắt buộc');
      return;
    }
    try {
      const url = phong ? `/api/phong/${phong._id}` : '/api/phong';
      const method = phong ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) onSuccess();
        else toast.error(result.message || 'Có lỗi xảy ra');
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
      tienNghi: checked ? [...prev.tienNghi, tienNghi] : prev.tienNghi.filter(t => t !== tienNghi)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="thong-tin" className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
            <Info className="h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="anh-phong" className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
            <Image className="h-4 w-4" />
            Ảnh phòng
          </TabsTrigger>
          <TabsTrigger value="video-phong">
            <Video className="h-4 w-4" />
            Video phòng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thong-tin" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maPhong" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mã phòng</Label>
              <Input
                id="maPhong"
                value={formData.maPhong}
                onChange={(e) => setFormData(prev => ({ ...prev, maPhong: e.target.value.toUpperCase() }))}
                required
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
                placeholder="VD: A101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toaNha" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tòa nhà</Label>
              <Select value={formData.toaNha} onValueChange={(value) => setFormData(prev => ({ ...prev, toaNha: value }))}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Chọn tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  {toaNhaList.map((toaNha) => (
                    <SelectItem key={toaNha._id} value={toaNha._id!}>{toaNha.tenToaNha}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trangThai" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Trạng thái</Label>
              <Select value={formData.trangThai} onValueChange={(value) => setFormData(prev => ({ ...prev, trangThai: value as 'trong' | 'daDat' | 'dangThue' | 'baoTri' }))}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trong">Trống</SelectItem>
                  <SelectItem value="daDat">Đã đặt</SelectItem>
                  <SelectItem value="dangThue">Đang thuê</SelectItem>
                  <SelectItem value="baoTri">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tang" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tầng</Label>
              <Input id="tang" type="number" min="0" value={formData.tang}
                onChange={(e) => setFormData(prev => ({ ...prev, tang: parseInt(e.target.value) || 0 }))}
                required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dienTich" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Diện tích (m²)</Label>
              <Input id="dienTich" type="number" min="1" value={formData.dienTich}
                onChange={(e) => setFormData(prev => ({ ...prev, dienTich: parseInt(e.target.value) || 0 }))}
                required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soNguoiToiDa" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Số người tối đa</Label>
              <Input id="soNguoiToiDa" type="number" min="1" max="10" value={formData.soNguoiToiDa}
                onChange={(e) => setFormData(prev => ({ ...prev, soNguoiToiDa: parseInt(e.target.value) || 1 }))}
                required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Preview</Label>
              <div className="h-10 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Phòng {formData.maPhong || 'XXX'} - Tầng {formData.tang}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="giaThue" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Giá thuê (VNĐ)</Label>
              <Input id="giaThue" type="number" min="0" value={formData.giaThue}
                onChange={(e) => setFormData(prev => ({ ...prev, giaThue: parseInt(e.target.value) || 0 }))}
                required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500" />
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(formData.giaThue)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tienCoc" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tiền cọc (VNĐ)</Label>
              <Input id="tienCoc" type="number" min="0" value={formData.tienCoc}
                onChange={(e) => setFormData(prev => ({ ...prev, tienCoc: parseInt(e.target.value) || 0 }))}
                required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500" />
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">{formatCurrency(formData.tienCoc)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moTa" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mô tả</Label>
            <Textarea id="moTa" value={formData.moTa}
              onChange={(e) => setFormData(prev => ({ ...prev, moTa: e.target.value }))}
              rows={3}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả chi tiết về phòng..." />
          </div>

          <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tiện nghi ({formData.tienNghi.length}/{tienNghiOptions.length})
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handleToggleAllTienNghi}
                className="text-xs border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tienNghiOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input type="checkbox" id={option.value}
                      checked={formData.tienNghi.includes(option.value)}
                      onChange={(e) => handleTienNghiChange(option.value, e.target.checked)}
                      className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
                    <Label htmlFor={option.value} className="text-sm cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="anh-phong" className="space-y-6 mt-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Quản lý ảnh phòng</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Tải lên tối đa 10 ảnh để khách hàng có thể xem chi tiết phòng</p>
            </div>
            <PhongImageUpload
              images={formData.anhPhong}
              onImagesChange={(images: string[]) => setFormData(prev => ({ ...prev, anhPhong: images }))}
              maxImages={10}
              className="w-full"
            />
          </div>
        </TabsContent>

        <TabsContent value="video-phong" className="space-y-6 mt-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Quản lý video phòng</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Tải lên video giới thiệu phòng</p>
            </div>
            <PhongVideoUpload
              videos={formData.videoPhong}
              onVideosChange={(videos: string[]) => setFormData(prev => ({ ...prev, videoPhong: videos }))}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <Button type="button" variant="outline" onClick={onClose}
          className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          Hủy
        </Button>
        <Button type="submit"
          className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0">
          {phong ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogFooter>
    </form>
  );
}