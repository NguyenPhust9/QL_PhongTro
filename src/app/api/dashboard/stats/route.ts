import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Phong from '@/models/Phong';
import HoaDon from '@/models/HoaDon';
import SuCo from '@/models/SuCo';
import HopDong from '@/models/HopDong';
import ThanhToan from '@/models/ThanhToan';
import ToaNha from '@/models/ToaNha';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filterType') || 'month';
    const filterDate = searchParams.get('filterDate') || new Date().toISOString().split('T')[0];
    const toaNhaId   = searchParams.get('toaNhaId') || 'all';

    const currentDate  = new Date(filterDate);
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear  = currentDate.getFullYear();
    const currentDay   = currentDate.getDate();

    // ── Khoảng thời gian ──────────────────────────────────────────────────────
    let startDate: Date;
    let endDate: Date;

    if (filterType === 'day') {
      startDate = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0);
      endDate   = new Date(currentYear, currentMonth - 1, currentDay, 23, 59, 59);
    } else if (filterType === 'month') {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate   = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    } else {
      startDate = new Date(currentYear, 0, 1);
      endDate   = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // ── Lấy danh sách tòa nhà ─────────────────────────────────────────────────
    const toaNhaList = await ToaNha.find({}, { _id: 1, tenToaNha: 1 }).lean();

    // ── Lọc phòng theo tòa nhà ────────────────────────────────────────────────
    const phongFilter: any = {};
    if (toaNhaId !== 'all') {
      phongFilter.toaNha = new mongoose.Types.ObjectId(toaNhaId);
    }

    const phongInScope = await Phong.find(phongFilter, { _id: 1 }).lean();
    const phongIds     = phongInScope.map((p: any) => p._id);

    // ── Stats phòng ───────────────────────────────────────────────────────────
    const [totalPhong, phongTrong, phongDangThue, phongBaoTri] = await Promise.all([
      Phong.countDocuments(phongFilter),
      Phong.countDocuments({ ...phongFilter, trangThai: 'trong' }),
      Phong.countDocuments({ ...phongFilter, trangThai: 'dangThue' }),
      Phong.countDocuments({ ...phongFilter, trangThai: 'baoTri' }),
    ]);

    // ── Lấy HopDong trong scope để join ThanhToan ─────────────────────────────
    const hopDongInScope = await HopDong.find(
      { phong: { $in: phongIds } },
      { _id: 1 }
    ).lean();
    const hopDongIds = hopDongInScope.map((h: any) => h._id);

    // ── Helper aggregate ThanhToan ─────────────────────────────────────────────
    const thanhToanMatch = (start: Date, end: Date) => ({
      ngayThanhToan: { $gte: start, $lte: end },
      ...(toaNhaId !== 'all' ? { hopDong: { $in: hopDongIds } } : {}),
    });

    // ── Doanh thu theo filter ─────────────────────────────────────────────────
    const [doanhThuFilterRes, doanhThuNamRes, doanhThuTheoNgay] = await Promise.all([
      ThanhToan.aggregate([
        { $match: thanhToanMatch(startDate, endDate) },
        { $group: { _id: null, total: { $sum: '$soTien' } } },
      ]),
      ThanhToan.aggregate([
        { $match: thanhToanMatch(new Date(currentYear, 0, 1), new Date(currentYear, 11, 31, 23, 59, 59)) },
        { $group: { _id: null, total: { $sum: '$soTien' } } },
      ]),
      ThanhToan.aggregate([
        { $match: thanhToanMatch(startDate, endDate) },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$ngayThanhToan' } },
            total: { $sum: '$soTien' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // ── Doanh thu theo từng tòa nhà (cho biểu đồ tròn) ───────────────────────
    const doanhThuTheoToaNha = await ThanhToan.aggregate([
      {
        $match: {
          ngayThanhToan: { $gte: startDate, $lte: endDate },
        },
      },
      // Join HopDong để lấy phong
      {
        $lookup: {
          from: 'hopdongs',
          localField: 'hopDong',
          foreignField: '_id',
          as: 'hopDongInfo',
        },
      },
{ $unwind: '$hopDongInfo' },
      // Join Phong để lấy toaNha
      {
        $lookup: {
          from: 'phongs',
          localField: 'hopDongInfo.phong',
          foreignField: '_id',
          as: 'phongInfo',
        },
      },
{ $unwind: '$phongInfo' },
      // Join ToaNha để lấy tên
      {
        $lookup: {
          from: 'toanhas',
          localField: 'phongInfo.toaNha',
          foreignField: '_id',
          as: 'toaNhaInfo',
        },
      },
  { $unwind: '$toaNhaInfo' },      {
        $group: {
          _id: '$toaNhaInfo._id',
          tenToaNha: { $first: '$toaNhaInfo.tenToaNha' },
          total: { $sum: '$soTien' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── Hóa đơn, sự cố, hợp đồng ─────────────────────────────────────────────
    const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(); nextMonth.setDate(nextMonth.getDate() + 30);

    const hoaDonFilter: any = {
      hanThanhToan: { $lte: nextWeek },
      trangThai: { $in: ['chuaThanhToan', 'daThanhToanMotPhan'] },
    };
    const hopDongHetHanFilter: any = {
      ngayKetThuc: { $lte: nextMonth },
      trangThai: 'hoatDong',
    };
    if (toaNhaId !== 'all') {
      hoaDonFilter.hopDong        = { $in: hopDongIds };
      hopDongHetHanFilter.phong   = { $in: phongIds };
    }

    const [hoaDonSapDenHan, suCoCanXuLy, hopDongSapHetHan] = await Promise.all([
      HoaDon.countDocuments(hoaDonFilter),
      SuCo.countDocuments({ trangThai: { $in: ['moi', 'dangXuLy'] } }),
      HopDong.countDocuments(hopDongHetHanFilter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tongSoPhong: totalPhong,
        phongTrong,
        phongDangThue,
        phongBaoTri,
        doanhThuFilter:     doanhThuFilterRes[0]?.total || 0,
        doanhThuNam:        doanhThuNamRes[0]?.total    || 0,
        doanhThuTheoNgay,
        doanhThuTheoToaNha,
        toaNhaList,
        hoaDonSapDenHan,
        suCoCanXuLy,
        hopDongSapHetHan,
        filterType,
        filterDate,
        toaNhaId,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
