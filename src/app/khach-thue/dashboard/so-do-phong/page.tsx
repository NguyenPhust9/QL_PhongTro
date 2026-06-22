'use client';

import { useState, useEffect } from 'react';
import { Building2, RefreshCw, Home, CheckCircle2, Clock, Wrench, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Phong {
  _id: string;
  maPhong: string;
  tang: number;
  trangThai: 'trong' | 'daDat' | 'dangThue' | 'baoTri';
  toaNha: { _id: string; tenToaNha: string };
}

interface ToaNha {
  _id: string;
  tenToaNha: string;
}

const TRANG_THAI_CONFIG = {
  trong: {
    label: 'Trống',
    bg: 'bg-emerald-400',
    border: 'border-emerald-500',
    text: 'text-white',
    statBg: 'bg-emerald-100',
    statText: 'text-emerald-800',
    statBorder: 'border-emerald-300',
    icon: CheckCircle2,
  },
  dangThue: {
    label: 'Đang thuê',
    bg: 'bg-blue-400',
    border: 'border-blue-500',
    text: 'text-white',
    statBg: 'bg-blue-100',
    statText: 'text-blue-800',
    statBorder: 'border-blue-300',
    icon: Home,
  },
  daDat: {
    label: 'Đã đặt',
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    text: 'text-white',
    statBg: 'bg-amber-100',
    statText: 'text-amber-800',
    statBorder: 'border-amber-300',
    icon: Clock,
  },
  baoTri: {
    label: 'Bảo trì',
    bg: 'bg-rose-400',
    border: 'border-rose-500',
    text: 'text-white',
    statBg: 'bg-rose-100',
    statText: 'text-rose-800',
    statBorder: 'border-rose-300',
    icon: Wrench,
  },
};

export default function SoDoPhongKhachThuePage() {
  const [phongList, setPhongList] = useState<Phong[]>([]);
  const [toaNhaList, setToaNhaList] = useState<ToaNha[]>([]);
  const [selectedToaNha, setSelectedToaNha] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
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
        <div className="h-10 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Sơ đồ phòng</h1>
            <p className="text-xs text-slate-500 mt-0.5">Xem trạng thái các phòng theo tầng</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-slate-300 font-semibold">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải mới
          </Button>
          <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
            <SelectTrigger className="w-48 border-slate-300 font-medium">
              <Building2 className="h-4 w-4 mr-2 text-slate-500" />
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
            <div key={key} className={`rounded-xl border-2 p-4 ${config.statBg} ${config.statBorder} shadow-sm`}>
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
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {tangList.length === 0 ? (
          <div className="p-12 text-center">
            <DoorOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Không có phòng nào</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {tangList.map((tang) => (
              <div key={tang} className="flex">
                <div className="w-16 shrink-0 flex items-center justify-center bg-slate-200 border-r-2 border-slate-300 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">T</p>
                    <p className="text-xl font-black text-slate-700">{tang}</p>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-wrap gap-3 bg-slate-50">
                  {phongTheoTang[tang]
                    .sort((a, b) => a.maPhong.localeCompare(b.maPhong))
                    .map((phong) => {
                      const config = TRANG_THAI_CONFIG[phong.trangThai];
                      const Icon = config.icon;
                      return (
                        <div
                          key={phong._id}
                          className={`
                            w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1
                            shadow-sm ${config.bg} ${config.border} ${config.text}
                          `}
                        >
                          <Icon className="h-4 w-4 opacity-80" />
                          <span className="text-sm font-black leading-none">{phong.maPhong}</span>
                          <span className="text-[9px] font-semibold opacity-80 leading-none">{config.label}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}