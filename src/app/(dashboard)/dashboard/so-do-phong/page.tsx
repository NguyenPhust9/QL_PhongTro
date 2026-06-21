'use client';

import { useState, useEffect } from 'react';
import {
  Building2, RefreshCw, User, Zap, Droplets, Banknote, Shield, Users,
  Home, CheckCircle2, Clock, Wrench, XCircle, DoorOpen, CalendarDays,
  Phone, Ruler, UserCheck, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Phong {
  _id: string;
  maPhong: string;
  tang: number;
  trangThai: 'trong' | 'daDat' | 'dangThue' | 'baoTri';
  giaThue: number;
  dienTich: number;
  soNguoiToiDa: number;
  toaNha: {
    _id: string;
    tenToaNha: string;
  };
}

interface KhachThue {
  _id: string;
  hoTen: string;
  soDienThoai: string;
}

interface HopDong {
  _id: string;
  maHopDong: string;
  giaThue: number;
  tienCoc: number;
  giaDien: number;
  giaNuoc: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  nguoiDaiDien: KhachThue;
  khachThueId: KhachThue[];
  phiDichVu: { ten: string; gia: number }[];
}

interface ToaNha {
  _id: string;
  tenToaNha: string;
}

const TRANG_THAI_CONFIG = {
  trong: {
    label: 'Trống',
    bg: 'bg-emerald-600',
    border: 'border-emerald-700',
    text: 'text-white',
    dot: 'bg-emerald-300',
    statBg: 'bg-emerald-700',
    statText: 'text-emerald-50',
    statBorder: 'border-emerald-600',
    icon: CheckCircle2,
    drawerBg: 'bg-emerald-700',
  },
  dangThue: {
    label: 'Đang thuê',
    bg: 'bg-blue-700',
    border: 'border-blue-800',
    text: 'text-white',
    dot: 'bg-blue-300',
    statBg: 'bg-blue-800',
    statText: 'text-blue-50',
    statBorder: 'border-blue-700',
    icon: Home,
    drawerBg: 'bg-blue-800',
  },
  daDat: {
    label: 'Đã đặt',
    bg: 'bg-amber-600',
    border: 'border-amber-700',
    text: 'text-white',
    dot: 'bg-amber-200',
    statBg: 'bg-amber-700',
    statText: 'text-amber-50',
    statBorder: 'border-amber-600',
    icon: Clock,
    drawerBg: 'bg-amber-700',
  },
  baoTri: {
    label: 'Bảo trì',
    bg: 'bg-red-700',
    border: 'border-red-800',
    text: 'text-white',
    dot: 'bg-red-300',
    statBg: 'bg-red-800',
    statText: 'text-red-50',
    statBorder: 'border-red-700',
    icon: Wrench,
    drawerBg: 'bg-red-800',
  },
};

export default function SoDoPhongPage() {
  const [phongList, setPhongList] = useState<Phong[]>([]);
  const [toaNhaList, setToaNhaList] = useState<ToaNha[]>([]);
  const [selectedToaNha, setSelectedToaNha] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPhong, setSelectedPhong] = useState<Phong | null>(null);
  const [hopDong, setHopDong] = useState<HopDong | null>(null);
  const [loadingHopDong, setLoadingHopDong] = useState(false);

  useEffect(() => {
    document.title = 'Sơ đồ phòng';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [phongRes, toaNhaRes] = await Promise.all([
        fetch('/api/phong?limit=500'),
        fetch('/api/toa-nha?limit=100'),
      ]);
      if (phongRes.ok) {
        const result = await phongRes.json();
        if (result.success) setPhongList(result.data);
      }
      if (toaNhaRes.ok) {
        const result = await toaNhaRes.json();
        if (result.success) setToaNhaList(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhong = async (phong: Phong) => {
    if (selectedPhong?._id === phong._id) {
      closeDrawer();
      return;
    }
    setSelectedPhong(phong);
    setHopDong(null);
    if (phong.trangThai === 'dangThue' || phong.trangThai === 'daDat') {
      try {
        setLoadingHopDong(true);
        const res = await fetch(`/api/hop-dong?phongId=${phong._id}&trangThai=hoatDong&limit=1`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.length > 0) setHopDong(result.data[0]);
        }
      } catch (error) {
        console.error('Error fetching hop dong:', error);
      } finally {
        setLoadingHopDong(false);
      }
    }
  };

  const closeDrawer = () => {
    setSelectedPhong(null);
    setHopDong(null);
  };

  const filteredPhong = phongList.filter((p) =>
    selectedToaNha === 'all' ? true : p.toaNha?._id === selectedToaNha
  );

  const phongTheoTang = filteredPhong.reduce((acc, phong) => {
    const tang = phong.tang;
    if (!acc[tang]) acc[tang] = [];
    acc[tang].push(phong);
    return acc;
  }, {} as Record<number, Phong[]>);

  const tangList = Object.keys(phongTheoTang).map(Number).sort((a, b) => b - a);

  const stats = {
    total: filteredPhong.length,
    trong: filteredPhong.filter((p) => p.trangThai === 'trong').length,
    dangThue: filteredPhong.filter((p) => p.trangThai === 'dangThue').length,
    daDat: filteredPhong.filter((p) => p.trangThai === 'daDat').length,
    baoTri: filteredPhong.filter((p) => p.trangThai === 'baoTri').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow">
            <Building2 className="h-5 w-5 text-white dark:text-zinc-900" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Sơ đồ phòng</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tổng quan trạng thái các phòng theo tầng
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-zinc-300 dark:border-zinc-700 font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải mới
          </Button>
          <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
            <SelectTrigger className="w-48 border-zinc-300 dark:border-zinc-700 font-medium">
              <Building2 className="h-4 w-4 mr-2 text-zinc-500" />
              <SelectValue placeholder="Chọn tòa nhà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tòa nhà</SelectItem>
              {toaNhaList.map((toa) => (
                <SelectItem key={toa._id} value={toa._id}>{toa.tenToaNha}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(TRANG_THAI_CONFIG) as [keyof typeof TRANG_THAI_CONFIG, typeof TRANG_THAI_CONFIG[keyof typeof TRANG_THAI_CONFIG]][]).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={key}
              className={`rounded-xl border-2 p-4 ${config.statBg} ${config.statBorder} shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${config.statText} opacity-80`}>
                  {config.label}
                </span>
                <Icon className={`h-4 w-4 ${config.statText} opacity-70`} />
              </div>
              <p className={`text-3xl font-black ${config.statText}`}>
                {stats[key as keyof typeof stats]}
              </p>
              <p className={`text-xs mt-1 ${config.statText} opacity-60`}>
                / {stats.total} phòng
              </p>
            </div>
          );
        })}
      </div>

      {/* Sơ đồ */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-md">
        {tangList.length === 0 ? (
          <div className="p-12 text-center">
            <DoorOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Không có phòng nào</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-zinc-100 dark:divide-zinc-800">
            {tangList.map((tang) => (
              <div key={tang} className="flex">
                <div className="w-16 shrink-0 flex items-center justify-center bg-zinc-900 dark:bg-zinc-800 border-r-2 border-zinc-700 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">T</p>
                    <p className="text-xl font-black text-white">{tang}</p>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-wrap gap-3 bg-zinc-50 dark:bg-zinc-900">
                  {phongTheoTang[tang]
                    .sort((a, b) => a.maPhong.localeCompare(b.maPhong))
                    .map((phong) => {
                      const config = TRANG_THAI_CONFIG[phong.trangThai];
                      const isSelected = selectedPhong?._id === phong._id;
                      const Icon = config.icon;
                      return (
                        <button
                          key={phong._id}
                          onClick={() => handleSelectPhong(phong)}
                          className={`
                            relative w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1
                            transition-all duration-150 cursor-pointer shadow-sm
                            ${config.bg} ${config.border} ${config.text}
                            ${isSelected
                              ? 'ring-4 ring-offset-2 ring-zinc-900 dark:ring-white scale-110 shadow-lg'
                              : 'hover:scale-105 hover:shadow-md opacity-90 hover:opacity-100'}
                          `}
                        >
                          <Icon className="h-4 w-4 opacity-80" />
                          <span className="text-sm font-black leading-none">{phong.maPhong}</span>
                          <span className="text-[9px] font-semibold opacity-80 leading-none">{config.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedPhong && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l-2 border-zinc-200 dark:border-zinc-700 ${
          selectedPhong ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPhong && (
          <>
            {/* Drawer Header */}
            <div className={`flex items-center justify-between px-5 py-4 ${TRANG_THAI_CONFIG[selectedPhong.trangThai].drawerBg}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/40">
                  <span className="text-white font-black text-base">{selectedPhong.maPhong}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Phòng {selectedPhong.maPhong}
                  </h3>
                  <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedPhong.toaNha?.tenToaNha} · Tầng {selectedPhong.tang}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all border border-white/30"
                aria-label="Đóng"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50 dark:bg-zinc-950">

              {/* Thông tin cơ bản */}
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Thông tin phòng</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${TRANG_THAI_CONFIG[selectedPhong.trangThai].dot}`} />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Trạng thái</p>
                    </div>
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      {TRANG_THAI_CONFIG[selectedPhong.trangThai].label}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Banknote className="h-3 w-3 text-green-600" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Giá niêm yết</p>
                    </div>
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      {selectedPhong.giaThue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Ruler className="h-3 w-3 text-zinc-500" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Diện tích</p>
                    </div>
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      {selectedPhong.dienTich} m²
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="h-3 w-3 text-zinc-500" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Sức chứa</p>
                    </div>
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      {selectedPhong.soNguoiToiDa} người
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin hợp đồng */}
              {(selectedPhong.trangThai === 'dangThue' || selectedPhong.trangThai === 'daDat') && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hợp đồng hiện tại</p>

                  {loadingHopDong ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : hopDong ? (
                    <div className="space-y-3">
                      {/* Người đại diện */}
                      <div className="bg-zinc-900 dark:bg-zinc-800 rounded-xl p-4 border-2 border-zinc-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-black text-white">Người đại diện</span>
                        </div>
                        <p className="text-base font-extrabold text-white">
                          {hopDong.nguoiDaiDien?.hoTen || 'Không có thông tin'}
                        </p>
                        {hopDong.nguoiDaiDien?.soDienThoai && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            <p className="text-sm text-zinc-300">{hopDong.nguoiDaiDien.soDienThoai}</p>
                          </div>
                        )}
                        {hopDong.khachThueId?.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-zinc-700">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Users className="h-3.5 w-3.5 text-blue-400" />
                              <span className="text-xs font-bold text-blue-400">
                                Thành viên khác ({hopDong.khachThueId.length - 1} người)
                              </span>
                            </div>
                            {hopDong.khachThueId
                              .filter((k) => k._id !== hopDong.nguoiDaiDien?._id)
                              .map((k) => (
                                <p key={k._id} className="text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                                  <User className="h-3 w-3 text-zinc-500" />
                                  {k.hoTen}
                                </p>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Tài chính */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Banknote className="h-3.5 w-3.5 text-green-600" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Giá thuê</p>
                          </div>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {hopDong.giaThue.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Shield className="h-3.5 w-3.5 text-purple-600" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tiền cọc</p>
                          </div>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {hopDong.tienCoc.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Giá điện</p>
                          </div>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {hopDong.giaDien.toLocaleString('vi-VN')}đ/kWh
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Droplets className="h-3.5 w-3.5 text-blue-500" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Giá nước</p>
                          </div>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {hopDong.giaNuoc.toLocaleString('vi-VN')}đ/m³
                          </p>
                        </div>
                      </div>

                      {/* Phí dịch vụ */}
                      {hopDong.phiDichVu?.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Phí dịch vụ</p>
                          <div className="flex flex-wrap gap-2">
                            {hopDong.phiDichVu.map((phi, i) => (
                              <span key={i} className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2.5 py-1 font-semibold text-zinc-800 dark:text-zinc-200">
                                {phi.ten}: {phi.gia.toLocaleString('vi-VN')}đ
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Thời hạn */}
                      <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border-2 border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-zinc-500 shrink-0" />
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}
                          {' → '}
                          {new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700">
                      <XCircle className="h-4 w-4 text-zinc-400" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Không tìm thấy hợp đồng đang hoạt động
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
