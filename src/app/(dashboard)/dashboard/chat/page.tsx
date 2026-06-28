'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ChatBox from '@/components/chat/ChatBox';

// ============ INTERFACES ============
interface ICuocHoiThoai {
  _id: string;
  khachThueId: {
    _id: string;
    hoTen: string;
    soDienThoai: string;
    trangThai: string;
  };
  tinNhanCuoi: string;
  chuaDocAdmin: number;
  ngayCapNhat: string;
}

interface INguoiDung {
  _id: string;
  name?: string;
  ten?: string;
  email: string;
  phone?: string;
  soDienThoai?: string;
  avatar?: string;
  role?: string;
}

interface IKhachThue {
  _id: string;
  hoTen: string;
  soDienThoai?: string;
  email?: string;
  trangThai: string;
}

interface IChatActive {
  cuocHoiThoaiId: string;
  tenNguoiChat: string;
}

type TTab = 'hoithoai' | 'nguoidung' | 'khacthue';

// ============ HELPERS ============
const layTen = (u: INguoiDung) => u.name || u.ten || u.email;
const layPhone = (u: INguoiDung) => u.phone || u.soDienThoai || '';
const layAvatar = (ten: string) => ten.charAt(0).toUpperCase();

// ============ COMPONENT ============
export default function ChatPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<TTab>('hoithoai');

  // Dữ liệu
  const [danhSachCuoc, setDanhSachCuoc] = useState<ICuocHoiThoai[]>([]);
  const [danhSachND, setDanhSachND] = useState<INguoiDung[]>([]);
  const [danhSachKT, setDanhSachKT] = useState<IKhachThue[]>([]);

  // Search
  const [searchND, setSearchND] = useState('');
  const [searchKT, setSearchKT] = useState('');

  // Chat active
  const [chatActive, setChatActive] = useState<IChatActive | null>(null);
  const [dangTai, setDangTai] = useState(false);

  // ---- Fetch hội thoại ----
  const fetchCuocHoiThoai = useCallback(() => {
    fetch('/api/chat/conversations')
      .then(r => r.json())
      .then(setDanhSachCuoc);
  }, []);

  useEffect(() => { fetchCuocHoiThoai(); }, [fetchCuocHoiThoai]);

  // ---- Fetch người dùng ----
  useEffect(() => {
    if (tab !== 'nguoidung') return;
    if (danhSachND.length > 0) return;
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(setDanhSachND);
  }, [tab]);

  // ---- Fetch khách thuê ----
  useEffect(() => {
    if (tab !== 'khacthue') return;
    if (danhSachKT.length > 0) return;
    fetch('/api/khach-thue?limit=100')
      .then(r => r.json())
      .then(res => setDanhSachKT(res.data || []));
  }, [tab]);

  // ---- Search filter ----
  const ndDaLoc = danhSachND.filter(u => {
    const q = searchND.toLowerCase();
    return layTen(u).toLowerCase().includes(q) || layPhone(u).includes(q);
  });

  const ktDaLoc = danhSachKT.filter(k => {
    const q = searchKT.toLowerCase();
    return (
      k.hoTen.toLowerCase().includes(q) ||
      (k.soDienThoai || '').includes(q)
    );
  });

  // ---- Mở chat với NguoiDung ----
  const chonNguoiDung = async (user: INguoiDung) => {
    setDangTai(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ khachThueId: user._id }),
      });
      const cuoc = await res.json();
      setChatActive({ cuocHoiThoaiId: cuoc._id, tenNguoiChat: layTen(user) });
      fetchCuocHoiThoai();
    } finally {
      setDangTai(false);
    }
  };

  // ---- Mở chat với KhachThue ----
  const chonKhachThue = async (khach: IKhachThue) => {
    setDangTai(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ khachThueId: khach._id }),
      });
      const cuoc = await res.json();
      setChatActive({ cuocHoiThoaiId: cuoc._id, tenNguoiChat: khach.hoTen });
      fetchCuocHoiThoai();
    } finally {
      setDangTai(false);
    }
  };

  // ---- Mở hội thoại có sẵn ----
  const chonCuocHoiThoai = (cuoc: ICuocHoiThoai) => {
    setChatActive({
      cuocHoiThoaiId: cuoc._id,
      tenNguoiChat: cuoc.khachThueId?.hoTen,
    });
  };

  // ---- Tổng unread ----
  const tongChuaDoc = danhSachCuoc.reduce((t, c) => t + (c.chuaDocAdmin || 0), 0);

  // ============ RENDER ============
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ===== SIDEBAR ===== */}
      <div className="w-72 border-r bg-white flex flex-col">

        {/* Tab switcher */}
        <div className="flex border-b text-xs">
          {([
            { key: 'hoithoai', label: 'Hội thoại' },
            { key: 'nguoidung', label: 'Nhân viên' },
            { key: 'khacthue', label: 'Khách thuê' },
          ] as { key: TTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 font-medium transition-colors relative
                ${tab === t.key
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              {t.key === 'hoithoai' && tongChuaDoc > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {tongChuaDoc}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---- TAB: HỘI THOẠI ---- */}
        {tab === 'hoithoai' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 border-b">
              <p className="text-xs text-gray-400">{danhSachCuoc.length} cuộc hội thoại</p>
            </div>
            {danhSachCuoc.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">Chưa có cuộc hội thoại nào</p>
            )}
            {danhSachCuoc.map(cuoc => (
              <div
                key={cuoc._id}
                onClick={() => chonCuocHoiThoai(cuoc)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b
                  ${chatActive?.cuocHoiThoaiId === cuoc._id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 flex-shrink-0">
                  {layAvatar(cuoc.khachThueId?.hoTen || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm truncate">{cuoc.khachThueId?.hoTen}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(cuoc.ngayCapNhat).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate">{cuoc.tinNhanCuoi || 'Chưa có tin nhắn'}</p>
                    {cuoc.chuaDocAdmin > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1">
                        {cuoc.chuaDocAdmin}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---- TAB: NHÂN VIÊN (NguoiDung) ---- */}
        {tab === 'nguoidung' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:border-blue-400"
                  placeholder="Tìm tên hoặc số điện thoại..."
                  value={searchND}
                  onChange={e => setSearchND(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ndDaLoc.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">
                  {searchND ? 'Không tìm thấy kết quả' : 'Không có người dùng'}
                </p>
              )}
              {ndDaLoc.map(user => (
                <div
                  key={user._id}
                  onClick={() => !dangTai && chonNguoiDung(user)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b transition-colors
                    ${dangTai ? 'opacity-50 cursor-wait' : ''}
                    ${chatActive && danhSachCuoc.find(c => c.khachThueId?._id === user._id && c._id === chatActive.cuocHoiThoaiId)
                      ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-purple-600 flex-shrink-0 text-sm">
                    {user.avatar
                      ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                      : layAvatar(layTen(user))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{layTen(user)}</p>
                    <p className="text-xs text-gray-400 truncate">{layPhone(user) || user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- TAB: KHÁCH THUÊ ---- */}
        {tab === 'khacthue' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:border-blue-400"
                  placeholder="Tìm tên hoặc số điện thoại..."
                  value={searchKT}
                  onChange={e => setSearchKT(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ktDaLoc.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">
                  {searchKT ? 'Không tìm thấy kết quả' : 'Không có khách thuê'}
                </p>
              )}
              {ktDaLoc.map(khach => (
                <div
                  key={khach._id}
                  onClick={() => !dangTai && chonKhachThue(khach)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b transition-colors
                    ${dangTai ? 'opacity-50 cursor-wait' : ''}
                    ${chatActive && danhSachCuoc.find(c => c.khachThueId?._id === khach._id && c._id === chatActive.cuocHoiThoaiId)
                      ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-600 flex-shrink-0">
                    {layAvatar(khach.hoTen)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{khach.hoTen}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 truncate">{khach.soDienThoai || 'Chưa có SĐT'}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0
                        ${khach.trangThai === 'dangThue' ? 'bg-green-100 text-green-600'
                          : khach.trangThai === 'chuaThue' ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-100 text-red-500'}`}>
                        {khach.trangThai === 'dangThue' ? 'Đang thuê'
                          : khach.trangThai === 'chuaThue' ? 'Chưa thuê'
                          : 'Đã trả'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== CHAT AREA ===== */}
      <div className="flex-1">
        {dangTai ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Đang mở cuộc hội thoại...</p>
            </div>
          </div>
        ) : chatActive ? (
          <ChatBox
            cuocHoiThoaiId={chatActive.cuocHoiThoaiId}
            tenNguoiChat={chatActive.tenNguoiChat}
            session={session}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
              <p className="text-xs mt-1 text-gray-300">hoặc chọn nhân viên / khách thuê để nhắn tin mới</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}