'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';

const EMOJI_LIST = ['❤️', '😆', '😮', '😢', '😡', '👍'];

interface IReaction {
  emoji: string;
  nguoiDungId: string;
  loaiNguoiDung: 'nhanVien' | 'khachThue';
}

interface ITinNhan {
  _id: string;
  nguoiGuiId: string;
  loaiNguoiGui: 'nhanVien' | 'khachThue';
  noiDung: string;
  imageUrl?: string;    // ← THÊM
  ngayTao: string;
  reactions: IReaction[];
}

interface Props {
  cuocHoiThoaiId: string;
  tenNguoiChat: string;
  nguoiGuiIdOverride?: string;
  loaiNguoiGuiOverride?: 'nhanVien' | 'khachThue';
  session?: { user?: { id?: string; role?: string } } | null;
}

// ─── Upload thẳng lên Cloudinary (unsigned) ───────────────────────────────────
async function uploadLenCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_UPLOAD_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error('Upload thất bại');
  const data = await res.json();
  return data.secure_url as string;
}

// ─── Component tin nhắn ───────────────────────────────────────────────────────
function TinNhanItem({
  tin, laToi, nguoiGuiId, loaiNguoiGui, onReact, formatGio,
}: {
  tin: ITinNhan;
  laToi: boolean;
  nguoiGuiId: string;
  loaiNguoiGui: 'nhanVien' | 'khachThue';
  onReact: (tinNhanId: string, emoji: string) => void;
  formatGio: (ngay: string) => string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hover, setHover] = useState(false);
  const [xemAnh, setXemAnh] = useState(false);   // lightbox ảnh
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPicker]);

  const reactionGroups = tin.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const myReaction = tin.reactions.find(r => r.nguoiDungId === nguoiGuiId)?.emoji;

  return (
    <>
      {/* Lightbox xem ảnh full */}
      {xemAnh && tin.imageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setXemAnh(false)}
        >
          <img
            src={tin.imageUrl}
            alt="Ảnh"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}

      <div
        className={`flex ${laToi ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className={`relative max-w-[70%] flex flex-col gap-1 ${laToi ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-1.5 ${laToi ? 'flex-row-reverse' : 'flex-row'}`}>

            {/* Bubble tin nhắn */}
            <div className={`relative rounded-2xl text-sm leading-relaxed overflow-hidden
              ${laToi ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}
              ${tin.imageUrl ? 'p-1' : 'px-3 py-2'}`}
            >
              {/* Ảnh */}
              {tin.imageUrl && (
                <img
                  src={tin.imageUrl}
                  alt="Hình ảnh"
                  className="rounded-xl max-w-[240px] max-h-[320px] object-cover cursor-pointer block"
                  onClick={() => setXemAnh(true)}
                />
              )}
              {/* Text (nếu có kèm theo ảnh thì hiện bên dưới) */}
              {tin.noiDung && (
                <p className={tin.imageUrl ? 'px-2 py-1' : ''}>{tin.noiDung}</p>
              )}
            </div>

            {/* Nút reaction */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(p => !p)}
                className={`transition-all duration-150 text-base w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600
                  ${hover || showPicker ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                🙂
              </button>

              {showPicker && (
                <div
                  ref={pickerRef}
                  className={`absolute z-50 bottom-full mb-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1
                    ${laToi ? 'right-0' : 'left-0'}`}
                >
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { onReact(tin._id, emoji); setShowPicker(false); }}
                      className={`text-xl hover:scale-125 transition-transform rounded-full w-8 h-8 flex items-center justify-center
                        ${myReaction === emoji ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className={`flex gap-0.5 flex-wrap ${laToi ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(reactionGroups).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(tin._id, emoji)}
                  className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors
                    ${myReaction === emoji ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-gray-500">{count}</span>}
                </button>
              ))}
            </div>
          )}

          <span className="text-xs text-gray-400">{formatGio(tin.ngayTao)}</span>
        </div>
      </div>
    </>
  );
}

// ─── ChatBox chính ────────────────────────────────────────────────────────────
export default function ChatBox({
  cuocHoiThoaiId, tenNguoiChat, nguoiGuiIdOverride, loaiNguoiGuiOverride, session,
}: Props) {
  const [danhSachTin, setDanhSachTin] = useState<ITinNhan[]>([]);
  const [noiDung, setNoiDung] = useState('');
  const [dangKetNoi, setDangKetNoi] = useState(false);

  // State ảnh
  const [fileAnh, setFileAnh] = useState<File | null>(null);
  const [anhPreview, setAnhPreview] = useState<string | null>(null);
  const [dangUpload, setDangUpload] = useState(false);

  const socketRef    = useRef<Socket | null>(null);
  const cuoiRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);   // chọn từ thư viện
  const cameraInputRef = useRef<HTMLInputElement>(null); // chụp ảnh (mobile)

  const nguoiGuiId = nguoiGuiIdOverride ?? session?.user?.id ?? '';
  const loaiNguoiGui: 'nhanVien' | 'khachThue' = loaiNguoiGuiOverride ??
    (session?.user?.role === 'khachThue' ? 'khachThue' : 'nhanVien');
  const sanSang = !!cuocHoiThoaiId && !!nguoiGuiId;

  // Kết nối socket
  useEffect(() => {
    if (!sanSang) return;

    fetch(`/api/chat/messages/${cuocHoiThoaiId}`)
      .then(r => r.json())
      .then(setDanhSachTin);

    const socket = io({ path: '/api/socket' });
    socketRef.current = socket;

    socket.on('connect', () => {
      setDangKetNoi(true);
      socket.emit('thamGiaPhong', cuocHoiThoaiId);
      socket.emit('daDoc', { cuocHoiThoaiId, loaiNguoiDoc: loaiNguoiGui });
    });

    socket.on('tinNhanMoi', (tin: ITinNhan) => {
      setDanhSachTin(prev => [...prev, { ...tin, reactions: tin.reactions || [] }]);
    });

    socket.on('capNhatReaction', ({ tinNhanId, reactions }: { tinNhanId: string; reactions: IReaction[] }) => {
      setDanhSachTin(prev =>
        prev.map(t => t._id === tinNhanId ? { ...t, reactions } : t)
      );
    });

    socket.on('disconnect', () => setDangKetNoi(false));

    return () => { socket.disconnect(); };
  }, [cuocHoiThoaiId, sanSang]);

  // Auto scroll
  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [danhSachTin]);

  // Xử lý chọn ảnh
  const handleChonAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Chỉ hỗ trợ file ảnh');
    if (file.size > 10 * 1024 * 1024) return alert('Ảnh tối đa 10MB');

    if (anhPreview) URL.revokeObjectURL(anhPreview); // giải phóng URL cũ
    setFileAnh(file);
    setAnhPreview(URL.createObjectURL(file));
    e.target.value = ''; // reset để chọn lại cùng file được
  };

  const huyAnh = () => {
    if (anhPreview) URL.revokeObjectURL(anhPreview);
    setFileAnh(null);
    setAnhPreview(null);
  };

  // Gửi tin nhắn (có thể kèm ảnh)
  const guiTin = async () => {
    if (!socketRef.current || !nguoiGuiId) return;
    if (!noiDung.trim() && !fileAnh) return;

    let imageUrl: string | undefined;

    if (fileAnh) {
      try {
        setDangUpload(true);
        imageUrl = await uploadLenCloudinary(fileAnh);
        huyAnh();
      } catch {
        alert('Gửi ảnh thất bại, vui lòng thử lại');
        setDangUpload(false);
        return;
      } finally {
        setDangUpload(false);
      }
    }

    socketRef.current.emit('guiTinNhan', {
      cuocHoiThoaiId,
      nguoiGuiId,
      loaiNguoiGui,
      noiDung: noiDung.trim(),
      imageUrl,
    });

    setNoiDung('');
  };

  const handleReact = useCallback(async (tinNhanId: string, emoji: string) => {
    setDanhSachTin(prev => prev.map(t => {
      if (t._id !== tinNhanId) return t;
      const reactions = [...(t.reactions ?? [])];
      const idx = reactions.findIndex(r => r.nguoiDungId === nguoiGuiId && r.emoji === emoji);
      if (idx !== -1) {
        reactions.splice(idx, 1);
      } else {
        const filtered = reactions.filter(r => r.nguoiDungId !== nguoiGuiId);
        filtered.push({ emoji, nguoiDungId: nguoiGuiId, loaiNguoiDung: loaiNguoiGui });
        return { ...t, reactions: filtered };
      }
      return { ...t, reactions };
    }));

    await fetch(`/api/chat/messages/${cuocHoiThoaiId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tinNhanId, emoji, nguoiDungId: nguoiGuiId, loaiNguoiDung: loaiNguoiGui }),
    });
  }, [cuocHoiThoaiId, nguoiGuiId, loaiNguoiGui]);

  const formatGio = (ngay: string) =>
    new Date(ngay).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

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
        {danhSachTin.map(tin => (
          <TinNhanItem
            key={tin._id}
            tin={{ ...tin, reactions: tin.reactions || [] }}
            laToi={tin.nguoiGuiId === nguoiGuiId}
            nguoiGuiId={nguoiGuiId}
            loaiNguoiGui={loaiNguoiGui}
            onReact={handleReact}
            formatGio={formatGio}
          />
        ))}
        <div ref={cuoiRef} />
      </div>

      {/* Preview ảnh trước khi gửi */}
      {anhPreview && (
        <div className="px-3 pt-2 border-t bg-gray-50 flex items-center gap-2">
          <div className="relative inline-block">
            <img
              src={anhPreview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-xl border border-gray-200"
            />
            <button
              onClick={huyAnh}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
          {dangUpload && (
            <span className="text-xs text-gray-400 animate-pulse">Đang tải ảnh lên...</span>
          )}
        </div>
      )}

      {/* Input gửi tin */}
      <div className="flex items-center gap-2 p-3 border-t bg-gray-50">
        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleChonAnh}
          className="hidden"
        />
        {/* capture="environment" → mở camera sau trên mobile */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleChonAnh}
          className="hidden"
        />

        {/* Nút thư viện ảnh */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={dangUpload}
          title="Chọn ảnh từ thư viện"
          className="text-gray-400 hover:text-blue-500 disabled:opacity-40 transition-colors p-1 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Nút chụp ảnh (chủ yếu dùng trên mobile) */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={dangUpload}
          title="Chụp ảnh"
          className="text-gray-400 hover:text-blue-500 disabled:opacity-40 transition-colors p-1 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <input
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="Nhập tin nhắn..."
          value={noiDung}
          onChange={e => setNoiDung(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && guiTin()}
          disabled={dangUpload}
        />

        <button
          onClick={guiTin}
          disabled={(!noiDung.trim() && !fileAnh) || dangUpload}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-4 py-2 rounded-full text-sm transition-colors flex-shrink-0"
        >
          {dangUpload ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Gửi
            </span>
          ) : 'Gửi'}
        </button>
      </div>
    </div>
  );
}