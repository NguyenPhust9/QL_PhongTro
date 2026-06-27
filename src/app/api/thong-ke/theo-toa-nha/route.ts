import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Phong from '@/models/Phong'
import HoaDon from '@/models/HoaDon'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const toaNhaId = searchParams.get('toaNhaId')
    const nam = parseInt(
      searchParams.get('nam') || new Date().getFullYear().toString()
    )

    if (!toaNhaId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu toaNhaId' },
        { status: 400 }
      )
    }

    // Lấy danh sách ID phòng thuộc tòa nhà này
    const phongIds = await Phong.find({ toaNha: toaNhaId }).distinct('_id')

    // --- Doanh thu theo từng tháng trong năm được chọn ---
    const theoThangRaw = await HoaDon.aggregate([
      { $match: { phong: { $in: phongIds }, nam } },
      {
        $group: {
          _id: '$thang',
          doanhThu: { $sum: '$daThanhToan' },
        },
      },
    ])

    // Điền đủ 12 tháng, tháng không có hóa đơn thì doanhThu = 0
    const theoThang = Array.from({ length: 12 }, (_, i) => {
      const thang = i + 1
      const found = theoThangRaw.find((t) => t._id === thang)
      return { thang, doanhThu: found ? found.doanhThu : 0 }
    })

    // --- Doanh thu theo từng năm (tất cả các năm có dữ liệu) cho tòa nhà này ---
    const theoNamRaw = await HoaDon.aggregate([
      { $match: { phong: { $in: phongIds } } },
      {
        $group: {
          _id: '$nam',
          doanhThu: { $sum: '$daThanhToan' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const theoNam = theoNamRaw.map((n) => ({
      nam: n._id,
      doanhThu: n.doanhThu,
    }))

    return NextResponse.json({
      success: true,
      toaNhaId,
      nam,
      theoThang,
      theoNam,
    })
  } catch (error) {
    console.error('Lỗi thống kê theo tòa nhà:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    )
  }
}