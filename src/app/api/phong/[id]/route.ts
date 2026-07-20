import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Phong from '@/models/Phong';
import ToaNha from '@/models/ToaNha';
import { updatePhongStatus } from '@/lib/status-utils';
import { z } from 'zod';

const phongSchema = z.object({
  maPhong: z.string().min(1, 'Mã phòng là bắt buộc'),
  toaNha: z.string().min(1, 'Tòa nhà là bắt buộc'),
  tang: z.string().min(1, 'Tầng là bắt buộc'),
  dienTich: z.number().min(1, 'Diện tích phải lớn hơn 0'),
  giaThue: z.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  tienCoc: z.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0'),
  moTa: z.string().optional(),
  videoPhong: z.array(z.string()).optional(),
  anhPhong: z.array(z.string()).optional(),
  tienNghi: z.array(z.string()).optional(),
  soNguoiToiDa: z.number().min(1, 'Số người tối đa phải lớn hơn 0').max(10, 'Số người tối đa không được quá 10'),
  // Cho phép admin chọn tay trạng thái phòng khi sửa
  trangThai: z.enum(['trong', 'daDat', 'dangThue', 'baoTri']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    // Lưu ý: KHÔNG gọi updatePhongStatus(id) ở đây nữa.
    // Nếu tự động tính lại mỗi lần tải trang, trạng thái admin chọn tay
    // (VD: "Đang thuê", "Bảo trì") sẽ bị ghi đè ngay khi F5 nếu phòng
    // chưa có hợp đồng hoạt động khớp với lựa chọn đó.

    const phong = await Phong.findById(id)
      .populate('toaNha', 'tenToaNha diaChi');

    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: phong,
    });

  } catch (error) {
    console.error('Error fetching phong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = phongSchema.parse(body);

    await dbConnect();
    const { id } = await params;

    // Check if toa nha exists
    const toaNha = await ToaNha.findById(validatedData.toaNha);
    if (!toaNha) {
      return NextResponse.json(
        { message: 'Tòa nhà không tồn tại' },
        { status: 400 }
      );
    }

    const phong = await Phong.findByIdAndUpdate(
      id,
      {
        ...validatedData,
        anhPhong: validatedData.anhPhong || [],
        videoPhong: validatedData.videoPhong || [],
        tienNghi: validatedData.tienNghi || [],
        // trangThai lấy trực tiếp từ validatedData (admin sửa tay ở đây được tôn trọng,
        // KHÔNG bị ghi đè tự động sau khi lưu)
      },
      { new: true, runValidators: true }
    ).populate('toaNha', 'tenToaNha diaChi');

    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    // Lưu ý: KHÔNG gọi updatePhongStatus(id) ở đây nữa.
    // Trạng thái phòng khi admin sửa tay trong form sẽ được giữ nguyên theo lựa chọn.
    // Việc tự động cập nhật trạng thái theo hợp đồng (tạo/hủy/gia hạn hợp đồng)
    // vẫn diễn ra bình thường ở các route liên quan đến hợp đồng.

    return NextResponse.json({
      success: true,
      data: phong,
      message: 'Phòng đã được cập nhật thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating phong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const phong = await Phong.findById(id);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    await Phong.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Phòng đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting phong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
