import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Phong from '@/models/Phong';
import HoaDon from '@/models/HoaDon';
import SuCo from '@/models/SuCo';
import HopDong from '@/models/HopDong';
import ThanhToan from '@/models/ThanhToan';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filterType') || 'month'; // 'day' | 'month' | 'year'
    const filterDate = searchParams.get('filterDate') || new Date().toISOString().split('T')[0];

    const currentDate = new Date(filterDate);
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

    // Tính khoảng thời gian filter
    let startDate: Date;
    let endDate: Date;

    if (filterType === 'day') {
      startDate = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth - 1, currentDay, 23, 59, 59);
    } else if (filterType === 'month') {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    } else {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // Room stats
    const totalPhong = await Phong.countDocuments();
    const phongTrong = await Phong.countDocuments({ trangThai: 'trong' });
    const phongDangThue = await Phong.countDocuments({ trangThai: 'dangThue' });
    const phongBaoTri = await Phong.countDocuments({ trangThai: 'baoTri' });

    // Doanh thu theo filter
    const doanhThuFilter = await ThanhToan.aggregate([
      { $match: { ngayThanhToan: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$soTien' } } }
    ]);

    // Doanh thu năm (luôn cố định)
    const doanhThuNam = await ThanhToan.aggregate([
      {
        $match: {
          ngayThanhToan: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$soTien' } } }
    ]);

    // Doanh thu theo từng ngày trong tháng (cho chart)
    const doanhThuTheoNgay = await ThanhToan.aggregate([
      { $match: { ngayThanhToan: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ngayThanhToan' } },
          total: { $sum: '$soTien' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const hoaDonSapDenHan = await HoaDon.countDocuments({
      hanThanhToan: { $lte: nextWeek },
      trangThai: { $in: ['chuaThanhToan', 'daThanhToanMotPhan'] }
    });

    const suCoCanXuLy = await SuCo.countDocuments({
      trangThai: { $in: ['moi', 'dangXuLy'] }
    });

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const hopDongSapHetHan = await HopDong.countDocuments({
      ngayKetThuc: { $lte: nextMonth },
      trangThai: 'hoatDong'
    });

    return NextResponse.json({
      success: true,
      data: {
        tongSoPhong: totalPhong,
        phongTrong,
        phongDangThue,
        phongBaoTri,
        doanhThuFilter: doanhThuFilter[0]?.total || 0,
        doanhThuNam: doanhThuNam[0]?.total || 0,
        doanhThuTheoNgay,
        hoaDonSapDenHan,
        suCoCanXuLy,
        hopDongSapHetHan,
        filterType,
        filterDate,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}