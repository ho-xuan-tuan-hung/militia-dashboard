"use server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";
import type { AppUser, UserActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Không có quyền truy cập");
  }
  return session;
}

function toAppUser(doc: Record<string, unknown>): AppUser {
  return {
    _id: String(doc._id),
    username: doc.username as string,
    hoTen: doc.hoTen as string,
    role: doc.role as AppUser["role"],
    tieuDoi: doc.tieuDoi as number | undefined,
    active: doc.active as boolean,
    createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

export async function getUsers(): Promise<AppUser[]> {
  await requireAdmin();
  await connectDB();

  const docs = await User.find({})
    .select("-passwordHash")
    .sort({ role: 1, hoTen: 1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serialize(docs).map((d: any) => toAppUser(d as Record<string, unknown>));
}

export async function createUser(data: {
  username: string;
  password: string;
  hoTen: string;
  role: AppUser["role"];
  tieuDoi?: number;
}): Promise<UserActionResult> {
  try {
    await requireAdmin();
    await connectDB();

    const existing = await User.findOne({
      username: data.username.toLowerCase().trim(),
    });
    if (existing) {
      return { success: false, message: "Tên đăng nhập đã tồn tại" };
    }

    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      };
    }

    if (data.role === "tieu_doi_truong" && !data.tieuDoi) {
      return {
        success: false,
        message: "Tiểu đội trưởng phải được gán tiểu đội",
      };
    }

    const passwordHash = await hashPassword(data.password);
    const doc = await User.create({
      username: data.username.toLowerCase().trim(),
      passwordHash,
      hoTen: data.hoTen,
      role: data.role,
      tieuDoi: data.role === "tieu_doi_truong" ? data.tieuDoi : undefined,
      active: true,
    });

    revalidatePath("/quan-ly-nguoi-dung");
    return {
      success: true,
      message: "Tạo tài khoản thành công",
      data: toAppUser(serialize(doc.toObject()) as unknown as Record<string, unknown>),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi tạo tài khoản",
    };
  }
}

export async function updateUser(
  id: string,
  data: {
    hoTen?: string;
    role?: AppUser["role"];
    tieuDoi?: number;
    active?: boolean;
    newPassword?: string;
  }
): Promise<UserActionResult> {
  try {
    await requireAdmin();
    await connectDB();

    const updateData: Record<string, unknown> = {};
    if (data.hoTen) updateData.hoTen = data.hoTen;
    if (data.role) {
      updateData.role = data.role;
      updateData.tieuDoi =
        data.role === "tieu_doi_truong" ? data.tieuDoi : undefined;
    }
    if (data.active !== undefined) updateData.active = data.active;
    if (data.newPassword) {
      if (data.newPassword.length < 6) {
        return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" };
      }
      updateData.passwordHash = await hashPassword(data.newPassword);
    }

    const doc = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-passwordHash")
      .lean();

    if (!doc) return { success: false, message: "Không tìm thấy tài khoản" };

    revalidatePath("/quan-ly-nguoi-dung");
    return {
      success: true,
      message: "Cập nhật thành công",
      data: toAppUser(serialize(doc) as unknown as Record<string, unknown>),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi cập nhật tài khoản",
    };
  }
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await requireAdmin();

    // Prevent deleting self (DB user)
    if (session.user.id === id) {
      return { success: false, message: "Không thể xóa tài khoản đang đăng nhập" };
    }

    await connectDB();
    const doc = await User.findByIdAndDelete(id);
    if (!doc) return { success: false, message: "Không tìm thấy tài khoản" };

    revalidatePath("/quan-ly-nguoi-dung");
    return { success: true, message: "Đã xóa tài khoản" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xóa tài khoản",
    };
  }
}
