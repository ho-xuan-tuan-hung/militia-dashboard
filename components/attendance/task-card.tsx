"use client";

import { useState } from "react";
import { MapPin, User, MoreHorizontal, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/molecules/status-badge";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { AttendanceSheetDialog } from "./attendance-sheet-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { deleteAttendanceTask } from "@/actions/attendance";
import { toast } from "sonner";
import type { AttendanceTask } from "@/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function formatTaskDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const weekday = WEEKDAYS[d.getDay()];
  return `${day}/${month}/${year} · ${weekday}`;
}

interface TaskCardProps {
  task: AttendanceTask;
  canEdit: boolean;
  onChanged: () => void;
}

export function TaskCard({ task, canEdit, onChanged }: TaskCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalRecords = task.totalRecords ?? 0;
  const presentCount = task.presentCount ?? 0;
  const rate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : null;

  async function handleDelete() {
    if (!task._id) return;
    setDeleteLoading(true);
    const result = await deleteAttendanceTask(task._id);
    setDeleteLoading(false);
    setDeleteOpen(false);
    if (result.success) {
      toast.success(result.message);
      onChanged();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <div className="group flex flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 pb-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {formatTaskDate(task.ngayThucHien)}
            </p>
            <h3 className="mt-0.5 font-semibold text-foreground leading-snug line-clamp-2">
              {task.tenNhiemVu}
            </h3>
          </div>
          <TaskStatusBadge value={task.trangThai} />
        </div>

        {/* Details */}
        <div className="space-y-1.5 px-4 py-2 text-sm text-muted-foreground">
          {task.diaDiem && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{task.diaDiem}</span>
            </div>
          )}
          {task.nguoiPhuTrach && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{task.nguoiPhuTrach}</span>
            </div>
          )}
        </div>

        {/* Attendance summary */}
        {totalRecords > 0 ? (
          <div className="mx-4 mb-2 rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {presentCount}/{totalRecords} có mặt
              </span>
              <span
                className={
                  rate! >= 90
                    ? "font-semibold text-emerald-600"
                    : rate! >= 70
                    ? "font-semibold text-amber-600"
                    : "font-semibold text-red-600"
                }
              >
                {rate}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  rate! >= 90
                    ? "bg-emerald-500"
                    : rate! >= 70
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mx-4 mb-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Chưa có dữ liệu điểm danh
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t p-3">
          <Button
            size="sm"
            variant={!canEdit || task.trangThai === "completed" ? "outline" : "default"}
            className="flex-1 cursor-pointer"
            onClick={() => setSheetOpen(true)}
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            {!canEdit
              ? "Xem"
              : task.trangThai === "completed"
              ? "Xem lại"
              : "Điểm danh"}
          </Button>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent transition-colors cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AttendanceSheetDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={task}
        onSuccess={onChanged}
        readOnly={!canEdit}
      />

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={task}
        onSuccess={onChanged}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa nhiệm vụ"
        description={
          <>
            Bạn có chắc muốn xóa nhiệm vụ{" "}
            <span className="font-semibold text-foreground">
              {task.tenNhiemVu}
            </span>
            ? Toàn bộ dữ liệu điểm danh liên quan cũng sẽ bị xóa.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
