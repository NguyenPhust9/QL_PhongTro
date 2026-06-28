import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CuocHoiThoai from '@/models/CuocHoiThoai';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false }, { status: 401 });

    await dbConnect();
    const result = await CuocHoiThoai.aggregate([
      { $group: { _id: null, total: { $sum: '$chuaDocAdmin' } } }
    ]);
    const soTinChuaDoc = result[0]?.total || 0;

    return NextResponse.json({ success: true, soTinChuaDoc });
  } catch {
    return NextResponse.json({ success: false, soTinChuaDoc: 0 });
  }
}