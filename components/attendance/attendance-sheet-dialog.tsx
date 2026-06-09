"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ChucVuBadge } from "@/components/molecules/status-badge";
import { toast } from "sonner";
import {
  getAttendanceSheetForTask,
  saveAttendanceSheet,
} from "@/actions/attendance";
import type {
  AttendanceTask,
  AttendanceStatus,
  MilitiaAttendanceRow,
} from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, User, Save, EyeOff } from "lucide-react";

interface AttendanceSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: AttendanceTask | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  {
    value: "co_mat",
    label: "Có mặt",
    active: "bg-emerald-500 text-white border-emerald-500",
  },
  {
    value: "vang_mat",
    label: "Vắng",
    active: "bg-red-500 text-white border-red-500",
  },
  {
    value: "tre",
    label: "Trễ",
    active: "bg-amber-500 text-white border-amber-500",
  },
];

function formatDate(iso: string) {
  const d = iso.split("T")[0].split("-");
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export function AttendanceSheetDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
  readOnly = false,
}: AttendanceSheetDialogProps) {
  const [rows, setRows] = useState<MilitiaAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [squadFilter, setSquadFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSheet = useCallback(async () => {
    if (!task?._id) return;
    setLoading(true);
    const data = await getAttendanceSheetForTask(task._id);
    setRows(data);
    setLoading(false);
  }, [task?._id]);

  useEffect(() => {
    if (open && task?._id) {
      setSquadFilter("all");
      setStatusFilter("all");
      setSearchQuery("");
      void loadSheet();
    }
  }, [open, task?._id, loadSheet]);

  function toggleStatus(militiaId: string, status: AttendanceStatus) {
    setRows((prev) =>
      prev.map((r) =>
        r.militiaId === militiaId ? { ...r, trangThaiDiemDanh: status } : r
      )
    );
  }

  function updateNote(militiaId: string, ghiChu: string) {
    setRows((prev) =>
      prev.map((r) => (r.militiaId === militiaId ? { ...r, ghiChu } : r))
    );
  }

  function markAll(status: AttendanceStatus) {
    setRows((prev) => prev.map((r) => ({ ...r, trangThaiDiemDanh: status })));
  }

  async function handleSave() {
    if (!task?._id) return;
    setSaving(true);
    const result = await saveAttendanceSheet(task._id, rows);
    setSaving(false);
    if (result.success) {
      toast.success(result.message);
      onSuccess();
      onOpenChange(false);
    } else {
      toast.error(result.message);
    }
  }

  // Derived stats
  const presentCount = rows.filter((r) => r.trangThaiDiemDanh === "co_mat").length;
  const absentCount = rows.filter((r) => r.trangThaiDiemDanh === "vang_mat").length;
  const lateCount = rows.filter((r) => r.trangThaiDiemDanh === "tre").length;
  const rate = rows.length > 0 ? Math.round((presentCount / rows.length) * 100) : 0;

  // Available squads
  const squads = [...new Set(rows.map((r) => r.tieuDoi).filter(Boolean))].sort(
    (a, b) => (a ?? 0) - (b ?? 0)
  );

  // Filtered rows
  const filtered = rows.filter((r) => {
    if (squadFilter !== "all" && String(r.tieuDoi) !== squadFilter) return false;
    if (statusFilter !== "all" && r.trangThaiDiemDanh !== statusFilter) return false;
    if (searchQuery && !r.hoTen.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base">
            Điểm danh:{" "}
            <span className="text-primary">{task?.tenNhiemVu}</span>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {readOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                <EyeOff className="h-3 w-3" />
                Chỉ xem
              </span>
            )}
            {task?.ngayThucHien && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.ngayThucHien)}
              </span>
            )}
            {task?.diaDiem && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {task.diaDiem}
              </span>
            )}
            {task?.nguoiPhuTrach && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.nguoiPhuTrach}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Summary bar */}
        {!loading && rows.length > 0 && (
          <div className="shrink-0 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium text-emerald-600">
              ✓ {presentCount} có mặt
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium text-red-600">
              ✗ {absentCount} vắng
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium text-amber-600">
              ⏱ {lateCount} trễ
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold">{rate}% chuyên cần</span>
            {!readOnly && (
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => markAll("co_mat")}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                >
                  Tất cả có mặt
                </button>
                <button
                  type="button"
                  onClick={() => markAll("vang_mat")}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                >
                  Tất cả vắng
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Tìm theo họ tên..."
            className="h-8 max-w-[200px] text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={squadFilter} onValueChange={(v) => setSquadFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-[130px] text-sm">
              <SelectValue placeholder="Tiểu đội" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả TĐ</SelectItem>
              {squads.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Tiểu đội {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-[130px] text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="co_mat">Có mặt</SelectItem>
              <SelectItem value="vang_mat">Vắng mặt</SelectItem>
              <SelectItem value="tre">Trễ</SelectItem>
            </SelectContent>
          </Select>
          {(squadFilter !== "all" ||
            statusFilter !== "all" ||
            searchQuery) && (
            <span className="text-xs text-muted-foreground">
              {filtered.length}/{rows.length} quân nhân
            </span>
          )}
        </div>

        {/* Attendance table */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "Chưa có quân nhân nào trong hệ thống"
                : "Không tìm thấy kết quả"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10">
                    STT
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Họ tên
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-20">
                    TĐ
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-36">
                    Chức vụ
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr
                    key={row.militiaId}
                    className="border-t transition-colors hover:bg-accent/30"
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.hoTen}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.tieuDoi ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {row.chucVu ? (
                        <ChucVuBadge value={row.chucVu} />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={readOnly}
                            onClick={() =>
                              !readOnly && toggleStatus(row.militiaId, opt.value)
                            }
                            className={cn(
                              "h-7 rounded border px-2 text-xs font-medium transition-colors",
                              readOnly ? "cursor-default opacity-70" : "cursor-pointer",
                              row.trangThaiDiemDanh === opt.value
                                ? opt.active
                                : !readOnly && "border-input hover:bg-accent"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={row.ghiChu}
                        placeholder={readOnly ? "—" : "Ghi chú..."}
                        className="h-7 text-xs"
                        readOnly={readOnly}
                        disabled={readOnly}
                        onChange={(e) =>
                          !readOnly && updateNote(row.militiaId, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={saving || loading || rows.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu điểm danh"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
