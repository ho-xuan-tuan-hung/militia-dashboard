"use server";

import { connectDB } from "@/lib/mongodb";
import AttendanceTask from "@/models/AttendanceTask";
import AttendanceRecord from "@/models/AttendanceRecord";
import Militia from "@/models/Militia";
import type {
  AttendanceTask as IAttendanceTask,
  AttendanceStat,
  AttendanceTaskActionResult,
  MilitiaAttendanceRow,
} from "@/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

async function getSession() {
  return getServerSession(authOptions);
}

// ─── TASK CRUD ────────────────────────────────────────────────────

export async function getAttendanceTasksByMonth(
  year: number,
  month: number // 1-12
): Promise<IAttendanceTask[]> {
  await connectDB();
  const session = await getSession();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const matchFilter: Record<string, unknown> = {
    ngayThucHien: { $gte: start, $lt: end },
  };

  // Squad leaders see only tasks for their squad OR tasks for all squads (tieuDoi undefined/null)
  if (
    session?.user?.role === "tieu_doi_truong" &&
    session.user.tieuDoi != null
  ) {
    matchFilter.$or = [
      { tieuDoi: session.user.tieuDoi },
      { tieuDoi: { $exists: false } },
      { tieuDoi: null },
    ];
  }

  const pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: "attendancerecords",
        localField: "_id",
        foreignField: "taskId",
        as: "records",
      },
    },
    {
      $addFields: {
        totalRecords: { $size: "$records" },
        presentCount: {
          $size: {
            $filter: {
              input: "$records",
              as: "r",
              cond: { $eq: ["$$r.trangThaiDiemDanh", "co_mat"] },
            },
          },
        },
      },
    },
    { $project: { records: 0 } },
    { $sort: { ngayThucHien: 1 } },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await AttendanceTask.aggregate(pipeline as any);
  return serialize(data) as unknown as IAttendanceTask[];
}

export async function getAttendanceTasks(params?: {
  search?: string;
  trangThai?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: IAttendanceTask[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await connectDB();
  const session = await getSession();
  const {
    search = "",
    trangThai = "",
    page = 1,
    pageSize = 20,
  } = params ?? {};

  const filter: Record<string, unknown> = {};
  if (search) filter.tenNhiemVu = { $regex: search, $options: "i" };
  if (trangThai) filter.trangThai = trangThai;

  if (
    session?.user?.role === "tieu_doi_truong" &&
    session.user.tieuDoi != null
  ) {
    filter.$or = [
      { tieuDoi: session.user.tieuDoi },
      { tieuDoi: { $exists: false } },
      { tieuDoi: null },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    AttendanceTask.find(filter)
      .sort({ ngayThucHien: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    AttendanceTask.countDocuments(filter),
  ]);

  return {
    data: serialize(data) as unknown as IAttendanceTask[],
    total,
    page,
    pageSize,
  };
}

export async function createAttendanceTask(
  formData: Partial<IAttendanceTask>
): Promise<AttendanceTaskActionResult> {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return { success: false, message: "Chưa đăng nhập" };

    const payload = { ...formData };

    // Squad leaders can only create tasks for their own squad
    if (
      session.user.role === "tieu_doi_truong" &&
      session.user.tieuDoi != null
    ) {
      payload.tieuDoi = session.user.tieuDoi;
    }
    payload.createdBy = session.user.id;

    const doc = await AttendanceTask.create(payload);
    revalidatePath("/diem-danh");
    return {
      success: true,
      message: "Tạo nhiệm vụ thành công",
      data: serialize(doc.toObject()) as unknown as IAttendanceTask,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi tạo nhiệm vụ",
    };
  }
}

export async function updateAttendanceTask(
  id: string,
  formData: Partial<IAttendanceTask>
): Promise<AttendanceTaskActionResult> {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return { success: false, message: "Chưa đăng nhập" };

    const existing = await AttendanceTask.findById(id).lean();
    if (!existing) return { success: false, message: "Không tìm thấy nhiệm vụ" };

    // Squad leaders can only edit tasks for their squad
    if (
      session.user.role === "tieu_doi_truong" &&
      existing.tieuDoi != null &&
      existing.tieuDoi !== session.user.tieuDoi
    ) {
      return { success: false, message: "Không có quyền chỉnh sửa nhiệm vụ này" };
    }

    const doc = await AttendanceTask.findByIdAndUpdate(id, formData, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) return { success: false, message: "Không tìm thấy nhiệm vụ" };
    revalidatePath("/diem-danh");
    return {
      success: true,
      message: "Cập nhật thành công",
      data: serialize(doc) as unknown as IAttendanceTask,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi cập nhật nhiệm vụ",
    };
  }
}

export async function deleteAttendanceTask(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return { success: false, message: "Chưa đăng nhập" };

    const existing = await AttendanceTask.findById(id).lean();
    if (!existing) return { success: false, message: "Không tìm thấy nhiệm vụ" };

    if (
      session.user.role === "tieu_doi_truong" &&
      existing.tieuDoi != null &&
      existing.tieuDoi !== session.user.tieuDoi
    ) {
      return { success: false, message: "Không có quyền xóa nhiệm vụ này" };
    }

    await AttendanceTask.findByIdAndDelete(id);
    await AttendanceRecord.deleteMany({ taskId: id });
    revalidatePath("/diem-danh");
    return { success: true, message: "Đã xóa nhiệm vụ" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xóa nhiệm vụ",
    };
  }
}

// ─── ATTENDANCE SHEET ─────────────────────────────────────────────

export async function getAttendanceSheetForTask(
  taskId: string
): Promise<MilitiaAttendanceRow[]> {
  await connectDB();
  const session = await getSession();

  // Get the task to check assignedMilitiaIds
  const task = await AttendanceTask.findById(taskId).lean();

  const hasAssigned = task?.assignedMilitiaIds && task.assignedMilitiaIds.length > 0;

  // Base filter: squad scope for leaders
  const squadFilter =
    session?.user?.role === "tieu_doi_truong" && session.user.tieuDoi != null
      ? { tieuDoi: session.user.tieuDoi }
      : {};

  // If task has specific assigned members, only show those
  const militiaFilter: Record<string, unknown> = { ...squadFilter };
  if (hasAssigned) {
    militiaFilter._id = { $in: task!.assignedMilitiaIds };
  }

  const [allMilitia, existing] = await Promise.all([
    Militia.aggregate([
      { $match: militiaFilter },
      {
        $addFields: {
          _chucVuOrder: {
            $cond: [{ $eq: ["$chucVu", "Tiểu đội trưởng"] }, 0, 1],
          },
        },
      },
      { $sort: { tieuDoi: 1, _chucVuOrder: 1, hoTen: 1 } },
      { $project: { _chucVuOrder: 0 } },
    ]),
    AttendanceRecord.find({ taskId }).lean(),
  ]);

  const recordMap = new Map(
    existing.map((r) => [r.militiaId.toString(), r])
  );

  return serialize(
    allMilitia.map((m) => {
      const record = recordMap.get(m._id.toString());
      return {
        militiaId: m._id.toString(),
        hoTen: m.hoTen,
        tieuDoi: m.tieuDoi,
        chucVu: m.chucVu,
        trangThaiDiemDanh: record?.trangThaiDiemDanh ?? "co_mat",
        ghiChu: record?.ghiChu ?? "",
        recordId: record?._id?.toString(),
      } as MilitiaAttendanceRow;
    })
  );
}

export async function saveAttendanceSheet(
  taskId: string,
  rows: MilitiaAttendanceRow[]
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return { success: false, message: "Chưa đăng nhập" };

    if (rows.length === 0) {
      return { success: false, message: "Không có dữ liệu để lưu" };
    }

    const operations = rows.map((row) => ({
      updateOne: {
        filter: { taskId, militiaId: row.militiaId },
        update: {
          $set: {
            taskId,
            militiaId: row.militiaId,
            hoTen: row.hoTen,
            tieuDoi: row.tieuDoi,
            chucVu: row.chucVu,
            trangThaiDiemDanh: row.trangThaiDiemDanh,
            ghiChu: row.ghiChu,
          },
        },
        upsert: true,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await AttendanceRecord.bulkWrite(operations as any, { ordered: false });

    await AttendanceTask.updateOne(
      { _id: taskId, trangThai: "draft" },
      { $set: { trangThai: "active" } }
    );

    revalidatePath("/diem-danh");

    const presentCount = rows.filter((r) => r.trangThaiDiemDanh === "co_mat").length;
    const rate = Math.round((presentCount / rows.length) * 100);

    return {
      success: true,
      message: `Đã lưu: ${presentCount}/${rows.length} có mặt (${rate}%)`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi lưu điểm danh",
    };
  }
}

// ─── STATS ────────────────────────────────────────────────────────

export async function getAttendanceStat(): Promise<AttendanceStat> {
  await connectDB();
  const session = await getSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const taskFilter: Record<string, unknown> = {};
  if (
    session?.user?.role === "tieu_doi_truong" &&
    session.user.tieuDoi != null
  ) {
    taskFilter.$or = [
      { tieuDoi: session.user.tieuDoi },
      { tieuDoi: { $exists: false } },
      { tieuDoi: null },
    ];
  }

  const [totalTasks, tasksThisMonth, totalRecords, presentRecords] =
    await Promise.all([
      AttendanceTask.countDocuments(taskFilter),
      AttendanceTask.countDocuments({
        ...taskFilter,
        ngayThucHien: { $gte: startOfMonth },
      }),
      AttendanceRecord.countDocuments(),
      AttendanceRecord.countDocuments({ trangThaiDiemDanh: "co_mat" }),
    ]);

  return {
    totalTasks,
    tasksThisMonth,
    avgAttendanceRate:
      totalRecords > 0
        ? Math.round((presentRecords / totalRecords) * 100)
        : 0,
    totalRecords,
  };
}
