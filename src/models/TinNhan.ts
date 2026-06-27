import mongoose, { Schema, Document } from 'mongoose';

export interface ITinNhan extends Document {
  cuocHoiThoaiId: mongoose.Types.ObjectId;
  nguoiGuiId: string;
  loaiNguoiGui: 'nhanVien' | 'khachThue';
  noiDung: string;
  daDoc: boolean;
  ngayTao: Date;
}

const TinNhanSchema = new Schema<ITinNhan>({
  cuocHoiThoaiId: { type: Schema.Types.ObjectId, ref: 'CuocHoiThoai', required: true, index: true },
  nguoiGuiId:     { type: String, required: true },
  loaiNguoiGui:   { type: String, enum: ['nhanVien', 'khachThue'], required: true },
  noiDung:        { type: String, required: true, trim: true },
  daDoc:          { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'ngayTao', updatedAt: false }
});

export default mongoose.models.TinNhan ||
  mongoose.model<ITinNhan>('TinNhan', TinNhanSchema);