import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "tieu_doi_truong";

export interface IUser {
  username: string;
  passwordHash: string;
  hoTen: string;
  role: UserRole;
  tieuDoi?: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    hoTen: { type: String, required: [true, "Họ tên là bắt buộc"] },
    role: {
      type: String,
      enum: ["admin", "tieu_doi_truong"],
      required: true,
    },
    tieuDoi: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 });
UserSchema.index({ role: 1, tieuDoi: 1 });

const User: Model<IUserDocument> =
  mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;
