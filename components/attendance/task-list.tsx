"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/molecules/status-badge";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { AttendanceSheetDialog } from "./attendance-sheet-dialog";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAttendanceTasks,
  deleteAttendanceTask,
} from "@/actions/attendance";
import type { AttendanceTask } from "@/types";
import { cn } from "@/lib/utils";

interface TaskListProps {
  onStatsChange: () => void;
}

function formatDate(iso: string) {
  const d = iso.split("T")[0].split("-");
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export function TaskList({ onStatsChange }: TaskListProps) {
  const [data, setData] = useState<AttendanceTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<AttendanceTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceTask | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sheetTask, setSheetTask] = useState<AttendanceTask | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const result = await getAttendanceTasks({
        search,
        trangThai: statusFilter,
        page,
        pageSize,
      });
      setData(result.data);
      setTotal(result.total);
      setInitialLoad(false);
    });
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    const result = await deleteAttendanceTask(deleteTarget._id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (result.success) {
      toast.success(result.message);
      fetchData();
      onStatsChange();
    } else {
      toast.error(result.message);
    }
  }

  function openSheet(task: AttendanceTask) {
    setSheetTask(task);
    setSheetOpen(true);
  }

  const totalPages = Math.ceil(total / pageSize);
  const columns = 7;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm nhiệm vụ..."
              className="w-[220px] pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : (v ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="active">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setEditData(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhiệm vụ
        </Button>
      </div>

      {/* Table */}
      <div
        className={cn(
          "relative rounded-lg border transition-opacity duration-150",
          loading && !initialLoad && "opacity-60 pointer-events-none"
        )}
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
                STT
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Tên nhiệm vụ
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Ngày thực hiện
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Địa điểm
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Người phụ trách
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12" />
            </tr>
          </thead>
          <tbody>
            {initialLoad ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: columns }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {search || statusFilter
                    ? "Không tìm thấy nhiệm vụ phù hợp"
                    : "Chưa có nhiệm vụ nào. Nhấn \"Thêm nhiệm vụ\" để bắt đầu."}
                </td>
              </tr>
            ) : (
              data.map((task, idx) => (
                <tr
                  key={task._id}
                  className="border-t transition-colors hover:bg-accent/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{task.tenNhiemVu}</div>
                    {task.moTa && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground max-w-[260px]">
                        {task.moTa}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.ngayThucHien ? formatDate(task.ngayThucHien) : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.diaDiem || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.nguoiPhuTrach || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge value={task.trangThai} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => openSheet(task)}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Điểm danh
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditData(task);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(task)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} / ${total} nhiệm vụ`
            : "Không có nhiệm vụ"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task form dialog */}
      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editData}
        onSuccess={() => {
          fetchData();
          onStatsChange();
        }}
      />

      {/* Attendance sheet dialog */}
      <AttendanceSheetDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={sheetTask}
        onSuccess={() => {
          fetchData();
          onStatsChange();
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Xóa nhiệm vụ"
        description={
          <>
            Bạn có chắc muốn xóa nhiệm vụ{" "}
            <strong>&ldquo;{deleteTarget?.tenNhiemVu}&rdquo;</strong>? Toàn bộ
            dữ liệu điểm danh của nhiệm vụ này cũng sẽ bị xóa. Hành động này
            không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa nhiệm vụ"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
