'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface ITinNhan {
  _id: string;
  nguoiGuiId: string;
  loaiNguoiGui: 'nhanVien' | 'khachThue';
  noiDung: string;
  ngayTao: string;
}

interface Props {
  cuocHoiThoaiId: string;
  tenNguoiChat: string; // Tên khách thuê hoặc admin
}

export default function ChatBox({ cuocHoiThoaiId, tenNguoiChat }: Props) {
  const { data: session } = useSession();
  const [danhSachTin, setDanhSachTin] = useState<ITinNhan[]>([]);
  const [noiDung, setNoiDung] = useState('');
  const [dangKetNoi, setDangKetNoi] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const cuoiRef = useRef<HTMLDivElement>(null);

  const loaiNguoiGui = session?.user?.role === 'khachThue' 
    ? 'khachThue' : 'nhanVien';

  useEffect(() => {
    if (!cuocHoiThoaiId || !session) return;

    // Lấy lịch sử tin nhắn
    fetch(`/api/chat/messages/${cuocHoiThoaiId}`)
      .then(r => r.json())
      .then(setDanhSachTin);

    // Kết nối socket
    const socket = io({ path: '/api/socket' });
    socketRef.current = socket;

    socket.on('connect', () => {
      setDangKetNoi(true);
      socket.emit('thamGiaPhong', cuocHoiThoaiId);
      // Đánh dấu đã đọc
      socket.emit('daDoc', { cuocHoiThoaiId, loaiNguoiDoc: loaiNguoiGui });
    });

    socket.on('tinNhanMoi', (tin: ITinNhan) => {
      setDanhSachTin(prev => [...prev, tin]);
    });

    socket.on('disconnect', () => setDangKetNoi(false));

    return () => { socket.disconnect(); };
  }, [cuocHoiThoaiId, session]);

  // Auto scroll xuống cuối
  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [danhSachTin]);

  const guiTin = () => {
    if (!noiDung.trim() || !socketRef.current || !session) return;

    socketRef.current.emit('guiTinNhan', {
      cuocHoiThoaiId,
      nguoiGuiId: session.user.id,
      loaiNguoiGui,
      noiDung: noiDung.trim(),
    });
    setNoiDung('');
  };

  const formatGio = (ngay: string) => {
    return new Date(ngay).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600">
          {tenNguoiChat.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm">{tenNguoiChat}</p>
          <p className={`text-xs ${dangKetNoi ? 'text-green-500' : 'text-gray-400'}`}>
            {dangKetNoi ? '● Đang trực tuyến' : '○ Đang kết nối...'}
          </p>
        </div>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {danhSachTin.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </p>
        )}
        {danhSachTin.map(tin => {
          const laToi = tin.nguoiGuiId === session?.user?.id;
          return (
            <div key={tin._id} className={`flex ${laToi ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${laToi ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${laToi 
                    ? 'bg-blue-500 text-white rounded-br-sm' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {tin.noiDung}
                </div>
                <span className="text-xs text-gray-400">{formatGio(tin.ngayTao)}</span>
              </div>
            </div>
          );
        })}
        <div ref={cuoiRef} />
      </div>

      {/* Ô nhập tin */}
      <div className="flex gap-2 p-3 border-t bg-gray-50">
        <input
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="Nhập tin nhắn..."
          value={noiDung}
          onChange={e => setNoiDung(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && guiTin()}
        />
        <button
          onClick={guiTin}
          disabled={!noiDung.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-4 py-2 rounded-full text-sm transition-colors">
          Gửi
        </button>
      </div>
    </div>
  );
}