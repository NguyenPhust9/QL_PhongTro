import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CuocHoiThoai from '@/models/CuocHoiThoai';
import KhachThue from '@/models/KhachThue';

// Lấy danh sách cuộc hội thoại (dành cho admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  await dbConnect();

  const danhSach = await CuocHoiThoai
    .find()
    .populate('khachThueId', 'hoTen soDienThoai email trangThai')
    .sort({ ngayCapNhat: -1 });

  return NextResponse.json(danhSach);
}

// Tạo hoặc lấy cuộc hội thoại với 1 khách thuê
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { khachThueId } = await req.json();
  await dbConnect();

  let cuocHoiThoai = await CuocHoiThoai.findOne({ khachThueId });

  if (!cuocHoiThoai) {
    cuocHoiThoai = await CuocHoiThoai.create({ khachThueId });
  }

  return NextResponse.json(cuocHoiThoai);
}