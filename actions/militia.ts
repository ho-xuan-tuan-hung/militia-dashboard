"use server";

import { connectDB } from "@/lib/mongodb";
import Militia from "@/models/Militia";
import type {
  MilitiaFormData,
  ActionResult,
  DashboardStats,
  TrinhDoStats,
} from "@/types";
import { revalidatePath } from "next/cache";

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

// ─── READ: Fetch all militia ───────────────────────────────────────
export async function getMilitiaList(params?: {
  search?: string;
  chucVu?: string;
  tieuDoi?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: MilitiaFormData[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await connectDB();

  const {
    search = "",
    chucVu = "",
    tieuDoi = "",
    page = 1,
    pageSize = 20,
  } = params ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (search) {
    filter.$or = [
      { hoTen: { $regex: search, $options: "i" } },
      { cccd: { $regex: search, $options: "i" } },
    ];
  }

  if (chucVu) {
    filter.chucVu = chucVu;
  }

  if (tieuDoi) {
    filter.tieuDoi = Number(tieuDoi);
  }

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    Militia.find(filter)
      .sort({ stt: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Militia.countDocuments(filter),
  ]);

  return {
    data: serialize(data) as unknown as MilitiaFormData[],
    total,
    page,
    pageSize,
  };
}

// ─── READ: Single militia by ID ───────────────────────────────────
export async function getMilitiaById(
  id: string
): Promise<MilitiaFormData | null> {
  await connectDB();
  const doc = await Militia.findById(id).lean();
  return doc ? (serialize(doc) as unknown as MilitiaFormData) : null;
}

// ─── CREATE ────────────────────────────────────────────────────────
export async function createMilitia(
  formData: MilitiaFormData
): Promise<ActionResult> {
  try {
    await connectDB();

    const existing = await Militia.findOne({ cccd: formData.cccd });
    if (existing) {
      return { success: false, message: "CCCD đã tồn tại trong hệ thống" };
    }

    const doc = await Militia.create(formData);
    revalidatePath("/");

    return {
      success: true,
      message: "Thêm mới thành công",
      data: serialize(doc.toObject()) as unknown as MilitiaFormData,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi thêm dữ liệu";
    return { success: false, message: msg };
  }
}

// ─── UPDATE ────────────────────────────────────────────────────────
export async function updateMilitia(
  id: string,
  formData: Partial<MilitiaFormData>
): Promise<ActionResult> {
  try {
    await connectDB();

    // Check CCCD uniqueness if changed
    if (formData.cccd) {
      const existing = await Militia.findOne({
        cccd: formData.cccd,
        _id: { $ne: id },
      });
      if (existing) {
        return { success: false, message: "CCCD đã tồn tại trong hệ thống" };
      }
    }

    const doc = await Militia.findByIdAndUpdate(id, formData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) {
      return { success: false, message: "Không tìm thấy bản ghi" };
    }

    revalidatePath("/");

    return {
      success: true,
      message: "Cập nhật thành công",
      data: serialize(doc) as unknown as MilitiaFormData,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi cập nhật dữ liệu";
    return { success: false, message: msg };
  }
}

// ─── DELETE ────────────────────────────────────────────────────────
export async function deleteMilitia(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    const doc = await Militia.findByIdAndDelete(id);

    if (!doc) {
      return { success: false, message: "Không tìm thấy bản ghi" };
    }

    revalidatePath("/");
    return { success: true, message: "Xóa thành công" };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi xóa dữ liệu";
    return { success: false, message: msg };
  }
}

// ─── BULK UPSERT (for Excel import) ───────────────────────────────
export async function bulkUpsertMilitia(
  records: MilitiaFormData[]
): Promise<ActionResult> {
  try {
    await connectDB();

    const operations = records.map((record) => {
      // Strip client-only fields before upsert
      const { _id, createdAt, updatedAt, ...data } = record;
      return {
        updateOne: {
          filter: { cccd: record.cccd },
          update: { $set: data },
          upsert: true,
        },
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await Militia.bulkWrite(operations as any, { ordered: false });

    revalidatePath("/");

    return {
      success: true,
      message: `Import thành công: ${result.upsertedCount} mới, ${result.modifiedCount} cập nhật`,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi import dữ liệu";
    return { success: false, message: msg };
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  const currentYear = new Date().getFullYear();

  const [totalMilitia, totalLeaders, newRecruits, squads] = await Promise.all([
    Militia.countDocuments(),
    Militia.countDocuments({ chucVu: "Tiểu đội trưởng" }),
    Militia.countDocuments({ namVaoLucLuong: currentYear }),
    Militia.distinct("tieuDoi"),
  ]);

  return {
    totalMilitia,
    totalSquads: squads.filter((s) => s != null).length,
    newRecruits,
    totalLeaders,
  };
}

// ─── TRÌNH ĐỘ VĂN HÓA STATS (for chart) ─────────────────────────
export async function getTrinhDoStats(): Promise<TrinhDoStats[]> {
  await connectDB();

  const stats = await Militia.aggregate([
    {
      $group: {
        _id: { $ifNull: ["$trinhDoVanHoa", "Chưa rõ"] },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return stats.map((s) => ({
    name: s._id || "Chưa rõ",
    count: s.count,
  }));
}

// ─── EXPORT: Get all militia (no pagination) ──────────────────────
export async function getAllMilitiaForExport(): Promise<MilitiaFormData[]> {
  await connectDB();
  const data = await Militia.find().sort({ stt: 1, createdAt: -1 }).lean();
  return serialize(data) as unknown as MilitiaFormData[];
}
