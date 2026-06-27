'use client';
import { useEffect, useState } from 'react';
import ChatBox from '@/components/chat/ChatBox';

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

export default function ChatPage() {
  const [danhSach, setDanhSach] = useState<ICuocHoiThoai[]>([]);
  const [chonCuoc, setChonCuoc] = useState<ICuocHoiThoai | null>(null);

  useEffect(() => {
    fetch('/api/chat/conversations')
      .then(r => r.json())
      .then(setDanhSach);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-72 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Tin nhắn</h2>
          <p className="text-xs text-gray-400 mt-1">{danhSach.length} cuộc hội thoại</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {danhSach.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">Chưa có cuộc hội thoại nào</p>
          )}
          {danhSach.map(cuoc => (
            <div
              key={cuoc._id}
              onClick={() => setChonCuoc(cuoc)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b
                ${chonCuoc?._id === cuoc._id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 flex-shrink-0">
                {cuoc.khachThueId?.hoTen?.charAt(0).toUpperCase()}
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
      </div>
      <div className="flex-1">
        {chonCuoc ? (
          <ChatBox
            cuocHoiThoaiId={chonCuoc._id}
            tenNguoiChat={chonCuoc.khachThueId?.hoTen}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p>Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}