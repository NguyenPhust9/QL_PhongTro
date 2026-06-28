import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import CuocHoiThoai from '@/models/CuocHoiThoai';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return NextResponse.json({ success: false }, { status: 401 });

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;

    await dbConnect();
    const cuoc = await CuocHoiThoai.findOne({ khachThueId: decoded.id });
    const soTinChuaDoc = cuoc?.chuaDocKhach || 0;

    return NextResponse.json({ success: true, soTinChuaDoc });
  } catch {
    return NextResponse.json({ success: false, soTinChuaDoc: 0 });
  }
}