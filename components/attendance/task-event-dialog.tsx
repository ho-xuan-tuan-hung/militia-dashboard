"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/molecules/status-badge";
import {
  Calendar,
  MapPin,
  User,
  ClipboardList,
  Pencil,
  Trash2,
  Users,
  Shield,
} from "lucide-react";
import type { AttendanceTask } from "@/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} · ${WEEKDAYS[d.getDay()]}`;
}

interface TaskEventDialogProps {
  task: AttendanceTask | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onAttendance: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskEventDialog({
  task,
  open,
  onClose,
  canEdit,
  onAttendance,
  onEdit,
  onDelete,
}: TaskEventDialogProps) {
  if (!task) return null;

  const assignedCount = task.assignedMilitiaIds?.length ?? 0;
  const totalRecords = task.totalRecords ?? 0;
  const presentCount = task.presentCount ?? 0;
  const rate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-base leading-snug pr-2">
              {task.tenNhiemVu}
            </DialogTitle>
            <TaskStatusBadge value={task.trangThai} />
          </div>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(task.ngayThucHien)}</span>
          </div>
          {task.diaDiem && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{task.diaDiem}</span>
            </div>
          )}
          {task.nguoiPhuTrach && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span>{task.nguoiPhuTrach}</span>
            </div>
          )}
          {task.tieuDoi != null && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Tiểu đội {task.tieuDoi}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {assignedCount > 0
                ? `${assignedCount} quân nhân được phân công`
                : "Tất cả quân nhân"}
            </span>
          </div>
          {task.moTa && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{task.moTa}</p>
          )}
        </div>

        {/* Attendance rate */}
        {totalRecords > 0 && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center justify-between text-sm mb-1.5">
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
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full ${rate! >= 90 ? "bg-emerald-500" : rate! >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 cursor-pointer"
            variant={canEdit && task.trangThai !== "completed" ? "default" : "outline"}
            onClick={() => { onClose(); onAttendance(); }}
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            {canEdit && task.trangThai !== "completed" ? "Điểm danh" : "Xem"}
          </Button>

          {canEdit && (
            <>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => { onClose(); onEdit(); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { onClose(); onDelete(); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
