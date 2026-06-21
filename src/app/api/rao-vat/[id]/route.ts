import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RaoVat from '@/models/RaoVat';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await RaoVat.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}