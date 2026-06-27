import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import HoaDon from '@/models/HoaDon'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const thang = parseInt(
      searchParams.get('thang') || (new Date().getMonth() + 1).toString()
    )
    const nam = parseInt(
      searchParams.get('nam') || new Date().getFullYear().toString()
    )

    const ketQua = await HoaDon.aggregate([
      { $match: { thang, nam } },
      {
        // Join sang collection Phong để biết phòng này thuộc tòa nhà nào
        // ⚠️ 'phongs' là tên collection mặc định Mongoose sinh ra từ model 'Phong'.
        // Nếu bạn có set collection name riêng, sửa lại tên này cho đúng.
        $lookup: {
          from: 'phongs',
          localField: 'phong',
          foreignField: '_id',
          as: 'phongInfo',
        },
      },
      { $unwind: '$phongInfo' },
      {
        $group: {
          _id: '$phongInfo.toaNha',
          doanhThu: { $sum: '$daThanhToan' },
        },
      },
      {
        // Join sang collection ToaNha để lấy tên tòa nhà
        // ⚠️ 'toanhas' là tên collection mặc định từ model 'ToaNha'
        $lookup: {
          from: 'toanhas',
          localField: '_id',
          foreignField: '_id',
          as: 'toaNhaInfo',
        },
      },
      { $unwind: '$toaNhaInfo' },
      {
        $project: {
          _id: 0,
          toaNhaId: '$_id',
          tenToaNha: '$toaNhaInfo.tenToaNha',
          doanhThu: 1,
        },
      },
      { $sort: { doanhThu: -1 } },
    ])

    const tongDoanhThu = ketQua.reduce(
      (sum, item) => sum + item.doanhThu,
      0
    )

    return NextResponse.json({
      success: true,
      thang,
      nam,
      tongDoanhThu,
      theoToaNha: ketQua,
    })
  } catch (error) {
    console.error('Lỗi thống kê tổng hệ thống:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    )
  }
}