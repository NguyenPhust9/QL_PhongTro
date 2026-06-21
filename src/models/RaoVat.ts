import mongoose, { Schema, Document } from 'mongoose';

export interface IRaoVat extends Document {
  tieuDe: string;
  danhMuc: string;
  gia: number | null;
  diaChi: string;
  moTa: string;
  hinhAnh: string[];
  nguoiDang: string;  // ← thêm dòng này
  createdAt: Date;
  updatedAt: Date;
}

const RaoVatSchema = new Schema<IRaoVat>(
  {
    nguoiDang: { type: String, default: 'Ẩn danh' },
    tieuDe: { type: String, required: true, trim: true },
    danhMuc: { type: String, required: true },
    gia: { type: Number, default: null },
    diaChi: { type: String, default: '' },
    moTa: { type: String, required: true },
    hinhAnh: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.RaoVat || mongoose.model<IRaoVat>('RaoVat', RaoVatSchema);
