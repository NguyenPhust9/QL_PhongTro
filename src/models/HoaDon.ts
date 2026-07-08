import mongoose, { Schema, Document } from 'mongoose';

export interface IHoaDon extends Document {
  maHoaDon: string;
  hopDong: mongoose.Types.ObjectId;
  phong: mongoose.Types.ObjectId;
  khachThue: mongoose.Types.ObjectId;
  thang: number;
  nam: number;
  tienPhong: number;
  tienDien: number;
  soDien: number;
  chiSoDienBanDau: number;
  chiSoDienCuoiKy: number;
  tienNuoc: number;
  soNguoiO: number;
  soNuoc?: number;
  chiSoNuocBanDau?: number;
  chiSoNuocCuoiKy?: number;
  phiDichVu: Array<{
    ten: string;
    gia: number;
  }>;
  tongTien: number;
  daThanhToan: number;
  conLai: number;
  trangThai: 'chuaThanhToan' | 'daThanhToanMotPhan' | 'daThanhToan' | 'quaHan';
  hanThanhToan: Date;
  ghiChu?: string;
  ngayTao: Date;
  ngayCapNhat: Date;
}

const PhiDichVuSchema = new Schema({
  ten: {
    type: String,
    required: [true, 'Tên dịch vụ là bắt buộc'],
    trim: true
  },
  gia: {
    type: Number,
    required: [true, 'Giá dịch vụ là bắt buộc'],
    min: [0, 'Giá dịch vụ phải lớn hơn hoặc bằng 0']
  }
}, { _id: false });

const HoaDonSchema = new Schema<IHoaDon>({
  maHoaDon: {
    type: String,
    required: [true, 'Mã hóa đơn là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true
  },
  hopDong: {
    type: Schema.Types.ObjectId,
    ref: 'HopDong',
    required: [true, 'Hợp đồng là bắt buộc']
  },
  phong: {
    type: Schema.Types.ObjectId,
    ref: 'Phong',
    required: [true, 'Phòng là bắt buộc']
  },
  khachThue: {
    type: Schema.Types.ObjectId,
    ref: 'KhachThue',
    required: [true, 'Khách thuê là bắt buộc']
  },
  thang: {
    type: Number,
    required: [true, 'Tháng là bắt buộc'],
    min: [1, 'Tháng phải từ 1-12'],
    max: [12, 'Tháng phải từ 1-12']
  },
  nam: {
    type: Number,
    required: [true, 'Năm là bắt buộc'],
    min: [2020, 'Năm phải từ 2020 trở lên']
  },
  tienPhong: {
    type: Number,
    required: [true, 'Tiền phòng là bắt buộc'],
    min: [0, 'Tiền phòng phải lớn hơn hoặc bằng 0']
  },
  tienDien: {
    type: Number,
    required: [true, 'Tiền điện là bắt buộc'],
    min: [0, 'Tiền điện phải lớn hơn hoặc bằng 0']
  },
  soDien: {
    type: Number,
    required: [true, 'Số điện là bắt buộc'],
    min: [0, 'Số điện phải lớn hơn hoặc bằng 0']
  },
  chiSoDienBanDau: {
    type: Number,
    required: [true, 'Chỉ số điện ban đầu là bắt buộc'],
    min: [0, 'Chỉ số điện ban đầu phải lớn hơn hoặc bằng 0']
  },
  chiSoDienCuoiKy: {
    type: Number,
    required: [true, 'Chỉ số điện cuối kỳ là bắt buộc'],
    min: [0, 'Chỉ số điện cuối kỳ phải lớn hơn hoặc bằng 0']
  },
  tienNuoc: {
    type: Number,
    required: [true, 'Tiền nước là bắt buộc'],
    min: [0, 'Tiền nước phải lớn hơn hoặc bằng 0']
  },
  // Số người tính tiền nước (cách tính hiện tại: tienNuoc = soNguoiO * đơn giá/người)
  soNguoiO: {
    type: Number,
    default: 0,
    min: [0, 'Số người tính tiền nước phải lớn hơn hoặc bằng 0']
  },
  // Các trường chỉ số nước theo đồng hồ - giữ lại để tương thích dữ liệu cũ,
  // không còn bắt buộc vì cách tính tiền nước hiện tại dựa theo số người ở
  soNuoc: {
    type: Number,
    default: 0,
    min: [0, 'Số nước phải lớn hơn hoặc bằng 0']
  },
  chiSoNuocBanDau: {
    type: Number,
    default: 0,
    min: [0, 'Chỉ số nước ban đầu phải lớn hơn hoặc bằng 0']
  },
  chiSoNuocCuoiKy: {
    type: Number,
    default: 0,
    min: [0, 'Chỉ số nước cuối kỳ phải lớn hơn hoặc bằng 0']
  },
  phiDichVu: [PhiDichVuSchema],
  tongTien: {
    type: Number,
    required: [true, 'Tổng tiền là bắt buộc'],
    min: [0, 'Tổng tiền phải lớn hơn hoặc bằng 0']
  },
  daThanhToan: {
    type: Number,
    required: [true, 'Đã thanh toán là bắt buộc'],
    min: [0, 'Đã thanh toán phải lớn hơn hoặc bằng 0'],
    default: 0
  },
  conLai: {
    type: Number,
    required: [true, 'Còn lại là bắt buộc'],
    min: [0, 'Còn lại phải lớn hơn hoặc bằng 0']
  },
  trangThai: {
    type: String,
    enum: ['chuaThanhToan', 'daThanhToanMotPhan', 'daThanhToan', 'quaHan'],
    default: 'chuaThanhToan'
  },
  hanThanhToan: {
    type: Date,
    required: [true, 'Hạn thanh toán là bắt buộc']
  },
  ghiChu: {
    type: String,
    trim: true,
    maxlength: [500, 'Ghi chú không được quá 500 ký tự']
  }
}, {
  timestamps: { createdAt: 'ngayTao', updatedAt: 'ngayCapNhat' }
});

// Index cho tìm kiếm
// maHoaDon đã có unique: true nên không cần index thủ công
HoaDonSchema.index({ hopDong: 1 });
HoaDonSchema.index({ phong: 1 });
HoaDonSchema.index({ khachThue: 1 });
HoaDonSchema.index({ thang: 1, nam: 1 });
HoaDonSchema.index({ trangThai: 1 });
HoaDonSchema.index({ hanThanhToan: 1 });

// Pre-save middleware để tính conLai, cập nhật trangThai và tính số điện (nước không còn tính theo chỉ số)
HoaDonSchema.pre('save', function(next) {
  // Tính số điện từ chỉ số
  this.soDien = this.chiSoDienCuoiKy - this.chiSoDienBanDau;
  if (this.soDien < 0) this.soDien = 0;

  // Số nước theo chỉ số đồng hồ chỉ còn mang tính tương thích ngược,
  // không dùng để tính tienNuoc nữa (tienNuoc hiện tính theo soNguoiO ở phía form/API)
  if (this.chiSoNuocCuoiKy !== undefined && this.chiSoNuocBanDau !== undefined) {
    const soNuocTinh = this.chiSoNuocCuoiKy - this.chiSoNuocBanDau;
    this.soNuoc = soNuocTinh < 0 ? 0 : soNuocTinh;
  }
  
  this.conLai = this.tongTien - this.daThanhToan;
  
  if (this.conLai <= 0) {
    this.trangThai = 'daThanhToan';
  } else if (this.daThanhToan > 0) {
    this.trangThai = 'daThanhToanMotPhan';
  } else {
    this.trangThai = 'chuaThanhToan';
  }
  
  // Kiểm tra quá hạn
  if (this.hanThanhToan < new Date() && this.conLai > 0) {
    this.trangThai = 'quaHan';
  }
  
  next();
});

export default mongoose.models.HoaDon || mongoose.model<IHoaDon>('HoaDon', HoaDonSchema);