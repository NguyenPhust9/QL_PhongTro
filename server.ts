import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
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

  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log('🔌 Kết nối:', socket.id);

    socket.on('thamGiaPhong', (cuocHoiThoaiId: string) => {
      socket.join(cuocHoiThoaiId);
      console.log(`📥 ${socket.id} vào phòng ${cuocHoiThoaiId}`);
    });

    socket.on('guiTinNhan', async (data: {
      cuocHoiThoaiId: string;
      nguoiGuiId: string;
      loaiNguoiGui: 'nhanVien' | 'khachThue';
      noiDung: string;
      imageUrl?: string;
    }) => {
      try {
        const TinNhan = require('./src/models/TinNhan').default;
        const CuocHoiThoai = require('./src/models/CuocHoiThoai').default;

        const tinMoi = await TinNhan.create({
          cuocHoiThoaiId: data.cuocHoiThoaiId,
          nguoiGuiId:     data.nguoiGuiId,
          loaiNguoiGui:   data.loaiNguoiGui,
          noiDung:        data.noiDung || '',
          imageUrl:       data.imageUrl,
        });

        const tinNhanCuoi = data.imageUrl
          ? (data.noiDung ? `📷 ${data.noiDung}` : '📷 Hình ảnh')
          : data.noiDung;

        const updateField = data.loaiNguoiGui === 'khachThue'
          ? { $inc: { chuaDocAdmin: 1 } }
          : { $inc: { chuaDocKhach: 1 } };

        await CuocHoiThoai.findByIdAndUpdate(data.cuocHoiThoaiId, {
          tinNhanCuoi,
          ngayCapNhat: new Date(),
          ...updateField,
        });

        io.to(data.cuocHoiThoaiId).emit('tinNhanMoi', tinMoi);

      } catch (err) {
        console.error('Lỗi gửi tin:', err);
        socket.emit('loi', 'Không thể gửi tin nhắn');
      }
    });

    socket.on('daDoc', async (data: {
      cuocHoiThoaiId: string;
      loaiNguoiDoc: 'nhanVien' | 'khachThue';
    }) => {
      try {
        const CuocHoiThoai = require('./src/models/CuocHoiThoai').default;
        const field = data.loaiNguoiDoc === 'nhanVien' ? 'chuaDocAdmin' : 'chuaDocKhach';
        await CuocHoiThoai.findByIdAndUpdate(data.cuocHoiThoaiId, { [field]: 0 });
      } catch (err) {
        console.error('Lỗi đánh dấu đã đọc:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Ngắt kết nối:', socket.id);
    });
  });

  httpServer.listen(3000, () => {
    console.log('🚀 Server chạy tại http://localhost:3000');
  });
});