import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import TinNhan from '@/models/TinNhan';

export async function GET(
  req: NextRequest,
  { params }: { params: { cuocHoiThoaiId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  await dbConnect();

  const tinNhans = await TinNhan
    .find({ cuocHoiThoaiId: params.cuocHoiThoaiId })
    .sort({ ngayTao: 1 })
    .limit(100);

  return NextResponse.json(tinNhans);
}