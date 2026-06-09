"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "./calendar-grid";
import { TaskEventDialog } from "./task-event-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { AttendanceSheetDialog } from "./attendance-sheet-dialog";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { toast } from "sonner";
import { getAttendanceTasksByMonth, deleteAttendanceTask } from "@/actions/attendance";
import type { AttendanceTask } from "@/types";

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

interface TaskBoardProps {
  onStatsChange?: () => void;
}

export function TaskBoard({ onStatsChange }: TaskBoardProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const myTieuDoi = session?.user?.tieuDoi;

  const canCreate = role === "admin" || role === "tieu_doi_truong";

  function canEditTask(task: AttendanceTask): boolean {
    if (role === "admin") return true;
    if (role === "tieu_doi_truong") {
      return task.tieuDoi == null || task.tieuDoi === myTieuDoi;
    }
    return false;
  }

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [tasks, setTasks] = useState<AttendanceTask[]>([]);
  const [loading, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  // Dialog states
  const [eventTask, setEventTask] = useState<AttendanceTask | null>(null);
  const [attendanceTask, setAttendanceTask] = useState<AttendanceTask | null>(null);
  const [attendanceReadOnly, setAttendanceReadOnly] = useState(false);
  const [editTask, setEditTask] = useState<AttendanceTask | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [deleteTask, setDeleteTask] = useState<AttendanceTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(() => {
    startTransition(async () => {
      const data = await getAttendanceTasksByMonth(year, month);
      setTasks(data);
      setInitialLoad(false);
    });
  }, [year, month]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function goPrev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function goNext() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const totalThisMonth = tasks.length;
  const completed = tasks.filter((t) => t.trangThai === "completed").length;
  const active = tasks.filter((t) => t.trangThai === "active").length;
  const draft = tasks.filter((t) => t.trangThai === "draft").length;

  function handleTaskClick(task: AttendanceTask) {
    setEventTask(task);
  }

  function handleDayClick(date: Date) {
    setCreateDate(date);
  }

  function handleAttendance(task: AttendanceTask) {
    setAttendanceTask(task);
    setAttendanceReadOnly(!canEditTask(task));
  }

  function handleEdit(task: AttendanceTask) {
    setEditTask(task);
  }

  function handleDelete(task: AttendanceTask) {
    setDeleteTask(task);
  }

  async function confirmDelete() {
    if (!deleteTask?._id) return;
    setDeleting(true);
    const result = await deleteAttendanceTask(deleteTask._id);
    setDeleting(false);
    setDeleteTask(null);
    if (result.success) {
      toast.success(result.message);
      fetchTasks();
      onStatsChange?.();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Month navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goPrev} className="cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-[160px] text-center">
            <p className="text-lg font-bold tracking-tight">{MONTH_NAMES[month - 1]}</p>
            <p className="text-sm text-muted-foreground">{year}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            className="cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
            >
              Hôm nay
            </Button>
          )}

          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {canCreate && (
          <Button onClick={() => setCreateDate(new Date(year, month - 1, now.getDate()))} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhiệm vụ
          </Button>
        )}
      </div>

      {/* Month summary chips */}
      {!initialLoad && totalThisMonth > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">
            {totalThisMonth} nhiệm vụ
          </span>
          {completed > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 font-medium">
              {completed} hoàn thành
            </span>
          )}
          {active > 0 && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-blue-600 font-medium">
              {active} đang diễn ra
            </span>
          )}
          {draft > 0 && (
            <span className="rounded-full bg-gray-500/10 px-3 py-1 text-muted-foreground font-medium">
              {draft} nháp
            </span>
          )}
        </div>
      )}

      {/* Calendar */}
      {initialLoad ? (
        <div className="rounded-xl border overflow-hidden animate-pulse">
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="py-3 flex justify-center">
                <div className="h-3 w-6 bg-muted-foreground/20 rounded" />
              </div>
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {Array.from({ length: 7 }).map((_, di) => (
                <div key={di} className="min-h-[110px] border-b border-r last:border-r-0 p-1.5 space-y-1.5">
                  <div className="h-5 w-5 rounded-full bg-muted-foreground/10" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          tasks={tasks}
          canCreate={canCreate}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
        />
      )}

      {/* Task event popup (clicking a chip) */}
      <TaskEventDialog
        task={eventTask}
        open={!!eventTask}
        onClose={() => setEventTask(null)}
        canEdit={eventTask ? canEditTask(eventTask) : false}
        onAttendance={() => eventTask && handleAttendance(eventTask)}
        onEdit={() => eventTask && handleEdit(eventTask)}
        onDelete={() => eventTask && handleDelete(eventTask)}
      />

      {/* Attendance sheet dialog */}
      <AttendanceSheetDialog
        task={attendanceTask}
        open={!!attendanceTask}
        readOnly={attendanceReadOnly}
        onOpenChange={(o) => { if (!o) setAttendanceTask(null); }}
        onSuccess={() => { fetchTasks(); onStatsChange?.(); }}
      />

      {/* Create task dialog */}
      {canCreate && (
        <TaskFormDialog
          open={!!createDate}
          onOpenChange={(o) => { if (!o) setCreateDate(null); }}
          editData={null}
          initialDate={createDate}
          onSuccess={() => { fetchTasks(); onStatsChange?.(); setCreateDate(null); }}
        />
      )}

      {/* Edit task dialog */}
      {editTask && (
        <TaskFormDialog
          open={!!editTask}
          onOpenChange={(o) => { if (!o) setEditTask(null); }}
          editData={editTask}
          onSuccess={() => { fetchTasks(); onStatsChange?.(); setEditTask(null); }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTask}
        onOpenChange={(o) => { if (!o) setDeleteTask(null); }}
        title="Xóa nhiệm vụ?"
        description={`Bạn có chắc muốn xóa nhiệm vụ "${deleteTask?.tenNhiemVu}"? Toàn bộ dữ liệu điểm danh liên quan sẽ bị xóa.`}
        confirmLabel="Xóa"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
