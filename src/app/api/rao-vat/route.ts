import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import RaoVat from '@/models/RaoVat';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'tat-ca';
    const sort = searchParams.get('sort') || 'moi-nhat';

    // Filter
    const filter: any = {};
    if (category && category !== 'tat-ca') {
      filter.danhMuc = category;
    }

    // Sort
    const sortOption: any =
      sort === 'gia-tang' ? { gia: 1 }
      : sort === 'gia-giam' ? { gia: -1 }
      : { createdAt: -1 };

    const items = await RaoVat.find(filter).sort(sortOption).lean();
    console.log('Items từ DB:', items.map(i => ({ id: i._id, nguoiDang: i.nguoiDang }))); // ← thêm dòng này

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('GET /api/rao-vat error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    console.log('Body nhận được:', body); // ← thêm dòng này

    // ✅ Thêm nguoiDang vào đây
    const { tieuDe, danhMuc, gia, diaChi, moTa, hinhAnh, nguoiDang } = body;
    console.log('nguoiDang:', nguoiDang); // ← và dòng này

    if (!tieuDe || !danhMuc || !moTa) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const item = await RaoVat.create({
      tieuDe,
      danhMuc,
      gia: gia || null,
      diaChi: diaChi || '',
      moTa,
      hinhAnh: hinhAnh || [],
      nguoiDang: nguoiDang || 'Ẩn danh', // ✅ Thêm dòng này
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('POST /api/rao-vat error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}