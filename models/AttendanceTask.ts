import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceTask {
  tenNhiemVu: string;
  moTa?: string;
  ngayThucHien: Date;
  diaDiem?: string;
  nguoiPhuTrach?: string;
  trangThai: "draft" | "active" | "completed";
  tieuDoi?: number;
  createdBy?: string;
  assignedMilitiaIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceTaskDocument extends IAttendanceTask, Document {}

const AttendanceTaskSchema = new Schema<IAttendanceTaskDocument>(
  {
    tenNhiemVu: {
      type: String,
      required: [true, "Tên nhiệm vụ là bắt buộc"],
    },
    moTa: { type: String, default: "" },
    ngayThucHien: {
      type: Date,
      required: [true, "Ngày thực hiện là bắt buộc"],
    },
    diaDiem: { type: String, default: "" },
    nguoiPhuTrach: { type: String, default: "" },
    trangThai: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
    tieuDoi: { type: Number },
    createdBy: { type: String, default: "" },
    assignedMilitiaIds: [{ type: Schema.Types.ObjectId, ref: "Militia" }],
  },
  { timestamps: true }
);

AttendanceTaskSchema.index({ ngayThucHien: -1 });
AttendanceTaskSchema.index({ trangThai: 1 });

const AttendanceTask: Model<IAttendanceTaskDocument> =
  mongoose.models.AttendanceTask ||
  mongoose.model<IAttendanceTaskDocument>("AttendanceTask", AttendanceTaskSchema);

export default AttendanceTask;
