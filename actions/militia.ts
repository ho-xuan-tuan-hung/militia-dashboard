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
  namVaoLucLuong?: string;
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
    namVaoLucLuong = "",
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

  if (namVaoLucLuong) {
    filter.namVaoLucLuong = Number(namVaoLucLuong);
  }

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    Militia.aggregate([
      { $match: filter },
      {
        $addFields: {
          _chucVuOrder: { $cond: [{ $eq: ["$chucVu", "Tiểu đội trưởng"] }, 0, 1] },
        },
      },
      { $sort: { tieuDoi: 1, _chucVuOrder: 1, hoTen: 1 } },
      { $skip: skip },
      { $limit: pageSize },
      { $project: { _chucVuOrder: 0 } },
    ]),
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

    // Deduplicate by CCCD (within the same import file)
    const seen = new Set<string>();
    const dedupedRecords: MilitiaFormData[] = [];
    for (const r of records) {
      if (!r.cccd) continue;
      if (seen.has(r.cccd)) continue;
      seen.add(r.cccd);
      dedupedRecords.push(r);
    }

    if (dedupedRecords.length === 0) {
      return { success: true, message: "Không có dữ liệu để import" };
    }

    const operations = dedupedRecords.map((record) => {
      // Strip client-only fields before upsert
      const data = { ...record } as unknown as Record<string, unknown>;
      delete (data as { _id?: unknown })._id;
      delete (data as { createdAt?: unknown }).createdAt;
      delete (data as { updatedAt?: unknown }).updatedAt;
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

// ─── FILTER HELPERS ───────────────────────────────────────────────
export async function getAvailableYears(): Promise<number[]> {
  await connectDB();

  const years = await Militia.distinct("namVaoLucLuong");
  const numericYears = years
    .filter((y) => typeof y === "number" && Number.isFinite(y))
    .sort((a, b) => a - b) as number[];

  return numericYears;
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
  const data = await Militia.aggregate([
    {
      $addFields: {
        _chucVuOrder: { $cond: [{ $eq: ["$chucVu", "Tiểu đội trưởng"] }, 0, 1] },
      },
    },
    { $sort: { tieuDoi: 1, _chucVuOrder: 1, hoTen: 1 } },
    { $project: { _chucVuOrder: 0 } },
  ]);
  return serialize(data) as unknown as MilitiaFormData[];
}
