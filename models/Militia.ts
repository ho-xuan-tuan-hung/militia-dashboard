import mongoose, { Schema, Document, Model } from "mongoose";

export interface INguoiThan {
  ten?: string;
  sdt?: string;
}

export interface IMilitia {
  hoTen: string;
  cccd: string;
  sdt?: string;
  diaChi?: string;
  trinhDoVanHoa?: string;
  tieuDoi?: number;
  chucVu?: string;
  namVaoLucLuong?: number;
  thongTinNguoiThan?: {
    cha?: INguoiThan;
    me?: INguoiThan;
  };
  ghiChu?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMilitiaDocument extends IMilitia, Document {}

const NguoiThanSchema = new Schema<INguoiThan>(
  {
    ten: { type: String, default: "" },
    sdt: { type: String, default: "" },
  },
  { _id: false }
);

const MilitiaSchema = new Schema<IMilitiaDocument>(
  {
    hoTen: { type: String, required: [true, "Họ tên là bắt buộc"] },
    cccd: {
      type: String,
      required: [true, "CCCD là bắt buộc"],
      unique: true,
    },
    sdt: { type: String, default: "" },
    diaChi: { type: String, default: "" },
    trinhDoVanHoa: { type: String, default: "" },
    tieuDoi: { type: Number },
    chucVu: {
      type: String,
      enum: ["Tiểu đội trưởng", "Chiến sĩ dân quân"],
      default: "Chiến sĩ dân quân",
    },
    namVaoLucLuong: { type: Number },
    thongTinNguoiThan: {
      cha: { type: NguoiThanSchema, default: () => ({}) },
      me: { type: NguoiThanSchema, default: () => ({}) },
    },
    ghiChu: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Militia: Model<IMilitiaDocument> =
  mongoose.models.Militia ||
  mongoose.model<IMilitiaDocument>("Militia", MilitiaSchema);

export default Militia;
