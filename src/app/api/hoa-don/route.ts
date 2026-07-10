import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HoaDon from '@/models/HoaDon';
import HopDong from '@/models/HopDong';
import KhachThue from '@/models/KhachThue';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PhiDichVu } from '@/types';
import { DON_GIA_NUOC_THEO_NGUOI } from '@/lib/constants';
// GET - Lấy danh sách hóa đơn
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const hopDongId = searchParams.get('hopDongId');
    const trangThai = searchParams.get('trangThai');

    // Nếu có ID, lấy hóa đơn cụ thể
    if (id) {
      const hoaDon = await HoaDon.findById(id)
        .populate('hopDong', 'maHopDong')
        .populate('phong', 'maPhong')
        .populate('khachThue', 'hoTen soDienThoai')
        .lean();

      if (!hoaDon) {
        return NextResponse.json(
          { message: 'Hóa đơn không tồn tại' },
          { status: 404 }
        );
      }

      const hoaDonObj: any = hoaDon;

      // Xử lý dữ liệu cũ không có chỉ số điện nước
      if (hoaDonObj.chiSoDienBanDau === undefined) {
        hoaDonObj.chiSoDienBanDau = 0;
      }
      if (hoaDonObj.chiSoDienCuoiKy === undefined) {
        hoaDonObj.chiSoDienCuoiKy = hoaDonObj.chiSoDienBanDau;
      }
      if (hoaDonObj.chiSoNuocBanDau === undefined) {
        hoaDonObj.chiSoNuocBanDau = 0;
      }
      if (hoaDonObj.chiSoNuocCuoiKy === undefined) {
        hoaDonObj.chiSoNuocCuoiKy = hoaDonObj.chiSoNuocBanDau;
      }

      return NextResponse.json({
        success: true,
        data: hoaDonObj
      });
    }

    const query: Record<string, unknown> = {};
    if (hopDongId) {
      query.hopDong = hopDongId;
    }
    if (trangThai) {
      query.trangThai = trangThai;
    }

    const skip = (page - 1) * limit;

    // Chạy find() và countDocuments() song song thay vì tuần tự (trước đây mất thêm 1 round-trip DB)
    // .lean() bỏ overhead của Mongoose document -> nhanh hơn đáng kể, đặc biệt khi limit lớn
    const [hoaDons, total] = await Promise.all([
      HoaDon.find(query)
        .populate('hopDong', 'maHopDong')
        .populate('phong', 'maPhong')
        .populate('khachThue', 'hoTen soDienThoai')
        .sort({ nam: -1, thang: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HoaDon.countDocuments(query),
    ]);

    // Xử lý dữ liệu cũ không có chỉ số điện nước
    // (dùng lean() nên hoaDon đã là plain object, không cần .toObject() nữa)
    const processedHoaDons = hoaDons.map((hoaDonObj: any) => {
      if (hoaDonObj.chiSoDienBanDau === undefined) {
        hoaDonObj.chiSoDienBanDau = 0;
      }
      if (hoaDonObj.chiSoDienCuoiKy === undefined) {
        hoaDonObj.chiSoDienCuoiKy = hoaDonObj.chiSoDienBanDau;
      }
      if (hoaDonObj.chiSoNuocBanDau === undefined) {
        hoaDonObj.chiSoNuocBanDau = 0;
      }
      if (hoaDonObj.chiSoNuocCuoiKy === undefined) {
        hoaDonObj.chiSoNuocCuoiKy = hoaDonObj.chiSoNuocBanDau;
      }
      return hoaDonObj;
    });

    return NextResponse.json({
      success: true,
      data: processedHoaDons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo hóa đơn mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      maHoaDon,
      hopDong,
      thang,
      nam,
      tienPhong,
      chiSoDienBanDau,
      chiSoDienCuoiKy,
      chiSoNuocBanDau,
      chiSoNuocCuoiKy,
      phiDichVu,
      daThanhToan,
      ghiChu,
      // Cho phép frontend gửi lên số tiền điện/nước đã sửa tay (manual override).
      // Nếu không gửi (undefined) thì mới tự tính theo công thức mặc định.
      tienDien: tienDienFromBody,
      tienNuoc: tienNuocFromBody,
    } = body;

    if (!hopDong) {
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const hopDongData = await HopDong.findById(hopDong)
      .populate('phong')
      .populate('khachThueId');

    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    let finalMaHoaDon = maHoaDon;

    if (!finalMaHoaDon || finalMaHoaDon.trim() === '') {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

      finalMaHoaDon = `HD${year}${month}${day}${randomNum}`;
    }

    const existingHoaDon = await HoaDon.findOne({ maHoaDon: finalMaHoaDon });
    if (existingHoaDon) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

      finalMaHoaDon = `HD${year}${month}${day}${randomNum}`;
    }

    let hoaDonData: Record<string, unknown> = {
      maHoaDon: finalMaHoaDon,
      hopDong: hopDong,
      phong: hopDongData.phong,
      khachThue: hopDongData.nguoiDaiDien,
      ghiChu
    };

    if (!thang || !nam || tienPhong === undefined) {
      return NextResponse.json(
        { message: 'Thiếu thông tin cho hóa đơn hàng tháng' },
        { status: 400 }
      );
    }

    const existingMonthlyHoaDon = await HoaDon.findOne({
      hopDong: hopDong,
      thang,
      nam
    });

    if (existingMonthlyHoaDon) {
      return NextResponse.json(
        { message: `Hóa đơn tháng ${thang}/${nam} đã tồn tại` },
        { status: 400 }
      );
    }

    let chiSoDienBanDauValue = chiSoDienBanDau;
    let chiSoDienCuoiKyValue = chiSoDienCuoiKy;

    // Nước không còn tính theo chỉ số (đã chuyển sang tính theo số người ở),
    // nên chiSoNuocBanDau/chiSoNuocCuoiKy chỉ giữ lại cho tương thích dữ liệu cũ,
    // mặc định về 0 nếu frontend không gửi lên, KHÔNG bắt buộc và KHÔNG lấy từ lastHoaDon.
    let chiSoNuocBanDauValue = chiSoNuocBanDau ?? 0;
    let chiSoNuocCuoiKyValue = chiSoNuocCuoiKy ?? 0;

    // Chỉ điện mới cần fallback từ hóa đơn trước / hợp đồng vì vẫn tính tiền theo chỉ số
    if (chiSoDienBanDauValue === undefined || chiSoDienBanDauValue === null) {
      const lastHoaDon = await HoaDon.findOne({
        hopDong: hopDong,
        $or: [
          { nam: { $lt: nam } },
          { nam: nam, thang: { $lt: thang } }
        ]
      }).sort({ nam: -1, thang: -1 });

      chiSoDienBanDauValue = lastHoaDon
        ? lastHoaDon.chiSoDienCuoiKy
        : (hopDongData.chiSoDienBanDau ?? 0);
    }

    if (chiSoDienCuoiKyValue === undefined || chiSoDienCuoiKyValue === null) {
      chiSoDienCuoiKyValue = chiSoDienBanDauValue;
    }

    // Chỉ validate chỉ số ĐIỆN (bắt buộc dùng để tính tiền điện)
    const numericChecks: Record<string, unknown> = {
      chiSoDienBanDauValue,
      chiSoDienCuoiKyValue
    };
    for (const [key, value] of Object.entries(numericChecks)) {
      if (value === undefined || value === null || isNaN(Number(value))) {
        return NextResponse.json(
          { message: `Giá trị "${key}" không hợp lệ (thiếu hoặc không phải số). Vui lòng nhập đầy đủ chỉ số điện.` },
          { status: 400 }
        );
      }
    }

    const soDien = Number(chiSoDienCuoiKyValue) - Number(chiSoDienBanDauValue);
    const soNuoc = Number(chiSoNuocCuoiKyValue) - Number(chiSoNuocBanDauValue); // không dùng tính tiền, giữ 0 mặc định

    // Tiền điện: nếu frontend gửi tienDien (đã sửa tay) và là số hợp lệ -> dùng đúng giá trị đó.
    // Ngược lại tự tính theo chỉ số điện như cũ.
    const tienDienTinh = (tienDienFromBody !== undefined && tienDienFromBody !== null && !isNaN(Number(tienDienFromBody)))
      ? Number(tienDienFromBody)
      : soDien * hopDongData.giaDien;

    // Tính tiền nước theo số người ở (mặc định), nhưng ưu tiên giá trị sửa tay từ frontend nếu có
    const soNguoiO = hopDongData.khachThueId?.length || 0;
    const tienNuocTinh = (tienNuocFromBody !== undefined && tienNuocFromBody !== null && !isNaN(Number(tienNuocFromBody)))
      ? Number(tienNuocFromBody)
      : soNguoiO * DON_GIA_NUOC_THEO_NGUOI;

    const tongTien = tienPhong + tienDienTinh + tienNuocTinh + (phiDichVu?.reduce((sum: number, phi: PhiDichVu) => sum + phi.gia, 0) || 0);
    const daThanhToanValue = daThanhToan || 0;

    hoaDonData = {
      ...hoaDonData,
      thang,
      nam,
      tienPhong,
      tienDien: tienDienTinh,
      soDien,
      chiSoDienBanDau: chiSoDienBanDauValue,
      chiSoDienCuoiKy: chiSoDienCuoiKyValue,
      tienNuoc: tienNuocTinh,
      soNuoc,
      chiSoNuocBanDau: chiSoNuocBanDauValue,
      chiSoNuocCuoiKy: chiSoNuocCuoiKyValue,
      phiDichVu: phiDichVu || [],
      tongTien,
      daThanhToan: daThanhToanValue,
      conLai: tongTien - daThanhToanValue,
      trangThai: 'chuaThanhToan',
      hanThanhToan: new Date(nam, thang - 1, hopDongData.ngayThanhToan)
    };

    const hoaDon = new HoaDon(hoaDonData);
    await hoaDon.save();

    await hoaDon.populate([
      { path: 'hopDong', select: 'maHopDong' },
      { path: 'phong', select: 'maPhong' },
      { path: 'khachThue', select: 'hoTen soDienThoai' }
    ]);

    return NextResponse.json({
      success: true,
      data: hoaDon,
      message: 'Tạo hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error creating hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật hóa đơn
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      id,
      maHoaDon,
      hopDong,
      thang,
      nam,
      tienPhong,
      chiSoDienBanDau,
      chiSoDienCuoiKy,
      chiSoNuocBanDau,
      chiSoNuocCuoiKy,
      phiDichVu,
      daThanhToan,
      trangThai,
      hanThanhToan,
      ghiChu,
      // Cho phép frontend gửi lên số tiền điện/nước đã sửa tay (manual override).
      tienDien: tienDienFromBody,
      tienNuoc: tienNuocFromBody,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Thiếu ID hóa đơn' },
        { status: 400 }
      );
    }

    // Kiểm tra hóa đơn tồn tại + hợp đồng song song thay vì tuần tự
    const [existingHoaDon, hopDongData] = await Promise.all([
      HoaDon.findById(id),
      HopDong.findById(hopDong),
    ]);

    if (!existingHoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    // Chỉ validate chỉ số ĐIỆN (nước đã chuyển sang tính theo số người ở, không bắt buộc chỉ số)
    const numericChecks: Record<string, unknown> = {
      chiSoDienBanDau,
      chiSoDienCuoiKy
    };
    for (const [key, value] of Object.entries(numericChecks)) {
      if (value === undefined || value === null || isNaN(Number(value))) {
        return NextResponse.json(
          { message: `Giá trị "${key}" không hợp lệ (thiếu hoặc không phải số).` },
          { status: 400 }
        );
      }
    }

    const chiSoNuocBanDauValue = chiSoNuocBanDau ?? 0;
    const chiSoNuocCuoiKyValue = chiSoNuocCuoiKy ?? 0;

    const soDien = Number(chiSoDienCuoiKy) - Number(chiSoDienBanDau);
    const soNuoc = Number(chiSoNuocCuoiKyValue) - Number(chiSoNuocBanDauValue); // không dùng tính tiền

    // Tiền điện: ưu tiên giá trị sửa tay từ frontend nếu có, ngược lại tự tính theo chỉ số
    const tienDienTinh = (tienDienFromBody !== undefined && tienDienFromBody !== null && !isNaN(Number(tienDienFromBody)))
      ? Number(tienDienFromBody)
      : soDien * hopDongData.giaDien;

    // Tiền nước: ưu tiên giá trị sửa tay từ frontend nếu có, ngược lại tự tính theo số người ở
    const soNguoiO = hopDongData.khachThueId?.length || 0;
    const tienNuocTinh = (tienNuocFromBody !== undefined && tienNuocFromBody !== null && !isNaN(Number(tienNuocFromBody)))
      ? Number(tienNuocFromBody)
      : soNguoiO * DON_GIA_NUOC_THEO_NGUOI;

    const tongTien = tienPhong + tienDienTinh + tienNuocTinh + (phiDichVu?.reduce((sum: number, phi: PhiDichVu) => sum + phi.gia, 0) || 0);
    const conLai = tongTien - daThanhToan;

    const updatedHoaDon = await HoaDon.findByIdAndUpdate(
      id,
      {
        maHoaDon,
        hopDong,
        thang,
        nam,
        tienPhong,
        tienDien: tienDienTinh,
        soDien,
        chiSoDienBanDau,
        chiSoDienCuoiKy,
        tienNuoc: tienNuocTinh,
        soNuoc,
        chiSoNuocBanDau: chiSoNuocBanDauValue,
        chiSoNuocCuoiKy: chiSoNuocCuoiKyValue,
        phiDichVu: phiDichVu || [],
        tongTien,
        daThanhToan,
        conLai,
        trangThai,
        hanThanhToan: new Date(hanThanhToan),
        ghiChu
      },
      { new: true }
    ).populate([
      { path: 'hopDong', select: 'maHopDong' },
      { path: 'phong', select: 'maPhong' },
      { path: 'khachThue', select: 'hoTen soDienThoai' }
    ]);

    return NextResponse.json({
      success: true,
      data: updatedHoaDon,
      message: 'Cập nhật hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error updating hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa hóa đơn
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Thiếu ID hóa đơn' },
        { status: 400 }
      );
    }

    const deletedHoaDon = await HoaDon.findByIdAndDelete(id);
    if (!deletedHoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error deleting hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
