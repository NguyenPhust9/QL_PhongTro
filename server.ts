 
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Kết nối MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ MongoDB đã kết nối');

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    path: '/api/socket',
  });

  // Lưu io vào global để dùng ở nơi khác nếu cần
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log('🔌 Kết nối:', socket.id);

    // Vào phòng chat
    socket.on('thamGiaPhong', (cuocHoiThoaiId: string) => {
      socket.join(cuocHoiThoaiId);
      console.log(`📥 ${socket.id} vào phòng ${cuocHoiThoaiId}`);
    });

    // Gửi tin nhắn
    socket.on('guiTinNhan', async (data: {
      cuocHoiThoaiId: string;
      nguoiGuiId: string;
      loaiNguoiGui: 'nhanVien' | 'khachThue';
      noiDung: string;
    }) => {
      try {
        const TinNhan = (await import('./src/models/TinNhan')).default;
        const CuocHoiThoai = (await import('./src/models/CuocHoiThoai')).default;

        // Lưu tin nhắn
        const tinMoi = await TinNhan.create({
          cuocHoiThoaiId: data.cuocHoiThoaiId,
          nguoiGuiId: data.nguoiGuiId,
          loaiNguoiGui: data.loaiNguoiGui,
          noiDung: data.noiDung,
        });

        // Cập nhật cuộc hội thoại
        const updateField = data.loaiNguoiGui === 'khachThue'
          ? { $inc: { chuaDocAdmin: 1 } }
          : { $inc: { chuaDocKhach: 1 } };

        await CuocHoiThoai.findByIdAndUpdate(data.cuocHoiThoaiId, {
          tinNhanCuoi: data.noiDung,
          ngayCapNhat: new Date(),
          ...updateField,
        });

        // Phát tới tất cả trong phòng
        io.to(data.cuocHoiThoaiId).emit('tinNhanMoi', tinMoi);

      } catch (err) {
        console.error('Lỗi gửi tin:', err);
        socket.emit('loi', 'Không thể gửi tin nhắn');
      }
    });

    // Đánh dấu đã đọc
    socket.on('daDoc', async (data: {
      cuocHoiThoaiId: string;
      loaiNguoiDoc: 'nhanVien' | 'khachThue';
    }) => {
      const CuocHoiThoai = (await import('./src/models/CuocHoiThoai')).default;
      const field = data.loaiNguoiDoc === 'nhanVien' ? 'chuaDocAdmin' : 'chuaDocKhach';
      await CuocHoiThoai.findByIdAndUpdate(data.cuocHoiThoaiId, { [field]: 0 });
    });

    socket.on('disconnect', () => {
      console.log('❌ Ngắt kết nối:', socket.id);
    });
  });

  httpServer.listen(3000, () => {
    console.log('🚀 Server chạy tại http://localhost:3000');
  });
});