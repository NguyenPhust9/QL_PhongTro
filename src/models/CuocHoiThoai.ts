import mongoose, { Schema, Document } from 'mongoose';

export interface ICuocHoiThoai extends Document {
  khachThueId: mongoose.Types.ObjectId;
  tinNhanCuoi: string;
  chuaDocAdmin: number;
  chuaDocKhach: number;
  ngayTao: Date;
  ngayCapNhat: Date;
}

const CuocHoiThoaiSchema = new Schema<ICuocHoiThoai>({
  khachThueId:   { type: Schema.Types.ObjectId, ref: 'KhachThue', required: true, unique: true },
  tinNhanCuoi:   { type: String, default: '' },
  chuaDocAdmin:  { type: Number, default: 0 },
  chuaDocKhach:  { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'ngayTao', updatedAt: 'ngayCapNhat' }
});

export default mongoose.models.CuocHoiThoai ||
  mongoose.model<ICuocHoiThoai>('CuocHoiThoai', CuocHoiThoaiSchema);