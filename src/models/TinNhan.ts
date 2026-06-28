// src/models/TinNhan.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  emoji: string;
  nguoiDungId: string;
  loaiNguoiDung: 'nhanVien' | 'khachThue';
}

export interface ITinNhan extends Document {
  cuocHoiThoaiId: mongoose.Types.ObjectId;
  nguoiGuiId: string;
  loaiNguoiGui: 'nhanVien' | 'khachThue';
  noiDung: string;
  imageUrl?: string;        // ← THÊM MỚI
  daDoc: boolean;
  ngayTao: Date;
  reactions: IReaction[];
}

const ReactionSchema = new Schema<IReaction>({
  emoji:         { type: String, required: true },
  nguoiDungId:   { type: String, required: true },
  loaiNguoiDung: { type: String, enum: ['nhanVien', 'khachThue'], required: true },
}, { _id: false });

const TinNhanSchema = new Schema<ITinNhan>({
  cuocHoiThoaiId: { type: Schema.Types.ObjectId, ref: 'CuocHoiThoai', required: true, index: true },
  nguoiGuiId:     { type: String, required: true },
  loaiNguoiGui:   { type: String, enum: ['nhanVien', 'khachThue'], required: true },
  noiDung:        { type: String, default: '', trim: true }, // ← bỏ required, thêm default ''
  imageUrl:       { type: String },                          // ← THÊM MỚI
  daDoc:          { type: Boolean, default: false },
  reactions:      { type: [ReactionSchema], default: [] },
}, {
  timestamps: { createdAt: 'ngayTao', updatedAt: false }
});

export default mongoose.models.TinNhan ||
  mongoose.model<ITinNhan>('TinNhan', TinNhanSchema);