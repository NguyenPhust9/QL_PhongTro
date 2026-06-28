// src/app/api/auth/khach-thue/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KhachThue from '@/models/KhachThue';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  cccd: z.string().regex(/^[0-9]{11,12}$/, 'CCCD không hợp lệ'),
  matKhau: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    await dbConnect();

    const khachThue = await KhachThue.findOne({
      cccd: validatedData.cccd
    }).select('+matKhau');

    if (!khachThue) {
      return NextResponse.json(
        { success: false, message: 'CCCD hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    if (!khachThue.matKhau) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản chưa được kích hoạt.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await khachThue.comparePassword(validatedData.matKhau);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'CCCD hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: khachThue._id,
        cccd: khachThue.cccd,
        hoTen: khachThue.hoTen,
        role: 'khachThue'
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        khachThue: {
          _id: khachThue._id,
          hoTen: khachThue.hoTen,
          cccd: khachThue.cccd,
          soDienThoai: khachThue.soDienThoai,
          email: khachThue.email,
          trangThai: khachThue.trangThai,
        },
        token
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}