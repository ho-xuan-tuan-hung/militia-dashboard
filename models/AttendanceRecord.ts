import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceRecord {
  taskId: mongoose.Types.ObjectId;
  militiaId: mongoose.Types.ObjectId;
  hoTen: string;
  tieuDoi?: number;
  chucVu?: string;
  trangThaiDiemDanh: "co_mat" | "vang_mat" | "tre";
  ghiChu?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceRecordDocument extends IAttendanceRecord, Document {}

const AttendanceRecordSchema = new Schema<IAttendanceRecordDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceTask",
      required: true,
    },
    militiaId: {
      type: Schema.Types.ObjectId,
      ref: "Militia",
      required: true,
    },
    hoTen: { type: String, required: true },
    tieuDoi: { type: Number },
    chucVu: { type: String },
    trangThaiDiemDanh: {
      type: String,
      enum: ["co_mat", "vang_mat", "tre"],
      required: true,
      default: "co_mat",
    },
    ghiChu: { type: String, default: "" },
  },
  { timestamps: true }
);

// One record per militia per task
AttendanceRecordSchema.index({ taskId: 1, militiaId: 1 }, { unique: true });
AttendanceRecordSchema.index({ taskId: 1, trangThaiDiemDanh: 1 });

const AttendanceRecord: Model<IAttendanceRecordDocument> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecordDocument>(
    "AttendanceRecord",
    AttendanceRecordSchema
  );

export default AttendanceRecord;
