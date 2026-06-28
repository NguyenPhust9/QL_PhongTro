import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import ThongBao from '@/models/ThongBao';

// GET - Lấy danh sách thông báo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Lấy 1 thông báo theo id
    if (id) {
      const thongBao = await ThongBao.findById(id)
        .populate('nguoiGui', 'ten email')
        .populate('nguoiNhan', 'hoTen soDienThoai')
        .populate('phong', 'maPhong')
        .populate('toaNha', 'tenToaNha')
        .lean();

      if (!thongBao) {
        return NextResponse.json({ message: 'Không tìm thấy thông báo' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: thongBao });
    }

    // Lấy danh sách
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const loai  = searchParams.get('loai') || '';
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (loai)   query.loai = loai;
    if (search) query.$or = [
      { tieuDe:  { $regex: search, $options: 'i' } },
      { noiDung: { $regex: search, $options: 'i' } },
    ];

    const [data, total] = await Promise.all([
      ThongBao.find(query)
        .populate('nguoiGui',  'ten email')
        .populate('nguoiNhan', 'hoTen soDienThoai')
        .populate('phong',  'maPhong')
        .populate('toaNha', 'tenToaNha')
        .sort({ ngayGui: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ThongBao.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching thong bao:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Tạo thông báo mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { tieuDe, noiDung, loai, nguoiNhan, phong, toaNha } = body;

    if (!tieuDe || !noiDung || !nguoiNhan?.length) {
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc (tieuDe, noiDung, nguoiNhan)' },
        { status: 400 }
      );
    }

    const thongBao = new ThongBao({
      tieuDe,
      noiDung,
      loai:      loai || 'chung',
      nguoiGui:  session.user.id,
      nguoiNhan,
      phong:     phong  || [],
      toaNha:    toaNha || undefined,
      daDoc:     [],
      ngayGui:   new Date(),
    });

    await thongBao.save();

    return NextResponse.json(
      { success: true, data: thongBao, message: 'Tạo thông báo thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating thong bao:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật thông báo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Thiếu ID thông báo' }, { status: 400 });
    }

    const body = await request.json();
    const { tieuDe, noiDung, loai, nguoiNhan, phong, toaNha } = body;

    const updated = await ThongBao.findByIdAndUpdate(
      id,
      { tieuDe, noiDung, loai, nguoiNhan, phong: phong || [], toaNha: toaNha || undefined },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Không tìm thấy thông báo' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Error updating thong bao:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa thông báo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Thiếu ID thông báo' }, { status: 400 });
    }

    const deleted = await ThongBao.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Không tìm thấy thông báo' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Xóa thông báo thành công' });
  } catch (error) {
    console.error('Error deleting thong bao:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
