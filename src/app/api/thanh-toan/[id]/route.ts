import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ThanhToan from '@/models/ThanhToan';
import HoaDon from '@/models/HoaDon';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Hàm helper: tính lại daThanhToan/conLai/trangThai của một hóa đơn
// dựa trên TỔNG THỰC TẾ các thanh toán hiện có trong DB (tránh cộng/trừ
// tích lũy dễ bị lệch qua nhiều lần sửa/xóa)
async function recalculateHoaDon(hoaDonId: any) {
  const hoaDon = await HoaDon.findById(hoaDonId);
  if (!hoaDon) return null;

  const payments = await ThanhToan.find({ hoaDon: hoaDonId });
  const tongDaThanhToan = payments.reduce((sum, tt) => sum + tt.soTien, 0);

  hoaDon.daThanhToan = tongDaThanhToan;
  hoaDon.conLai = hoaDon.tongTien - tongDaThanhToan;

  if (hoaDon.conLai <= 0) {
    hoaDon.trangThai = 'daThanhToan';
  } else if (hoaDon.daThanhToan > 0) {
    hoaDon.trangThai = 'daThanhToanMotPhan';
  } else {
    hoaDon.trangThai = 'chuaThanhToan';
  }

  await hoaDon.save();
  return hoaDon;
}

// PUT - Cập nhật thanh toán
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();
    const {
      hoaDonId,
      soTien,
      phuongThuc,
      thongTinChuyenKhoan,
      ngayThanhToan,
      ghiChu,
      anhBienLai
    } = body;

    // Validate required fields
    if (!hoaDonId || !soTien || !phuongThuc) {
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Tìm thanh toán hiện tại
    const thanhToanHienTai = await ThanhToan.findById(id);
    if (!thanhToanHienTai) {
      return NextResponse.json(
        { message: 'Thanh toán không tồn tại' },
        { status: 404 }
      );
    }

    const hoaDonCuId = thanhToanHienTai.hoaDon;

    // Kiểm tra hóa đơn mới tồn tại
    const hoaDonMoiTonTai = await HoaDon.findById(hoaDonId);
    if (!hoaDonMoiTonTai) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    // Tính trước "số tiền còn lại thực tế" của hóa đơn mới để validate,
    // loại trừ chính khoản thanh toán đang sửa nếu nó thuộc cùng hóa đơn này
    const paymentsCuaHoaDonMoi = await ThanhToan.find({
      hoaDon: hoaDonId,
      _id: { $ne: id }
    });
    const tongDaThanhToanHoaDonMoi = paymentsCuaHoaDonMoi.reduce(
      (sum, tt) => sum + tt.soTien,
      0
    );
    const conLaiThucTe = hoaDonMoiTonTai.tongTien - tongDaThanhToanHoaDonMoi;

    // Kiểm tra số tiền thanh toán mới không vượt quá số tiền còn lại thực tế
    if (soTien > conLaiThucTe) {
      return NextResponse.json(
        { message: 'Số tiền thanh toán không được vượt quá số tiền còn lại' },
        { status: 400 }
      );
    }

    // Validate thông tin chuyển khoản nếu phương thức là chuyển khoản
    if (phuongThuc === 'chuyenKhoan' && !thongTinChuyenKhoan) {
      return NextResponse.json(
        { message: 'Thông tin chuyển khoản là bắt buộc' },
        { status: 400 }
      );
    }

    // Cập nhật thanh toán
    thanhToanHienTai.hoaDon = hoaDonId;
    thanhToanHienTai.soTien = soTien;
    thanhToanHienTai.phuongThuc = phuongThuc;
    thanhToanHienTai.thongTinChuyenKhoan = phuongThuc === 'chuyenKhoan' ? thongTinChuyenKhoan : undefined;
    thanhToanHienTai.ngayThanhToan = ngayThanhToan ? new Date(ngayThanhToan) : new Date();
    thanhToanHienTai.ghiChu = ghiChu;
    thanhToanHienTai.anhBienLai = anhBienLai;

    await thanhToanHienTai.save();

    // Tính lại hóa đơn CŨ (nếu khác hóa đơn mới) dựa trên tổng thực tế còn lại
    if (hoaDonCuId && hoaDonCuId.toString() !== hoaDonId.toString()) {
      await recalculateHoaDon(hoaDonCuId);
    }

    // Tính lại hóa đơn MỚI dựa trên tổng thực tế (đã bao gồm thanh toán vừa cập nhật)
    const hoaDon = await recalculateHoaDon(hoaDonId);

    // Populate để trả về dữ liệu đầy đủ
    await thanhToanHienTai.populate([
      { path: 'hoaDon', select: 'maHoaDon thang nam tongTien' },
      { path: 'nguoiNhan', select: 'hoTen email' }
    ]);

    return NextResponse.json({
      success: true,
      data: thanhToanHienTai,
      message: 'Cập nhật thanh toán thành công'
    });
  } catch (error) {
    console.error('Error updating thanh toan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa thanh toán
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;

    // Tìm thanh toán
    const thanhToan = await ThanhToan.findById(id);
    if (!thanhToan) {
      return NextResponse.json(
        { message: 'Thanh toán không tồn tại' },
        { status: 404 }
      );
    }

    const hoaDonId = thanhToan.hoaDon;

    // Xóa thanh toán trước
    await ThanhToan.findByIdAndDelete(id);

    // Sau đó tính lại hóa đơn dựa trên tổng thực tế các thanh toán còn lại
    if (hoaDonId) {
      await recalculateHoaDon(hoaDonId);
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa thanh toán thành công'
    });
  } catch (error) {
    console.error('Error deleting thanh toan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
