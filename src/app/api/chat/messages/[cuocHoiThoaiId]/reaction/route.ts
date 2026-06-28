import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TinNhan from '@/models/TinNhan';

export async function POST(req: NextRequest, { params }: { params: { cuocHoiThoaiId: string } }) {
  try {
    await dbConnect();
    const { emoji, nguoiDungId, loaiNguoiDung, tinNhanId } = await req.json();

    const tinNhan = await TinNhan.findById(tinNhanId);
    if (!tinNhan) return NextResponse.json({ success: false }, { status: 404 });

    const idx = tinNhan.reactions.findIndex(
      (r: any) => r.nguoiDungId === nguoiDungId && r.emoji === emoji
    );
    if (idx !== -1) {
      tinNhan.reactions.splice(idx, 1);
    } else {
      tinNhan.reactions = tinNhan.reactions.filter(
        (r: any) => r.nguoiDungId !== nguoiDungId
      );
      tinNhan.reactions.push({ emoji, nguoiDungId, loaiNguoiDung });
    }

    await tinNhan.save();

    const io = (global as any).io;
    if (io) {
      io.to(tinNhan.cuocHoiThoaiId.toString()).emit('capNhatReaction', {
        tinNhanId,
        reactions: tinNhan.reactions,
      });
    }

    return NextResponse.json({ success: true, reactions: tinNhan.reactions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}