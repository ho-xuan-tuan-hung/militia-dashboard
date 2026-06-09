"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/molecules/form-field";
import { MilitiaPicker } from "./militia-picker";
import { toast } from "sonner";
import { createAttendanceTask, updateAttendanceTask } from "@/actions/attendance";
import { getAvailableTieuDoi } from "@/actions/militia";
import type { AttendanceTask, AttendanceTaskStatus } from "@/types";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: AttendanceTask | null;
  initialDate?: Date | null;
  onSuccess: () => void;
}

type FormState = {
  tenNhiemVu: string;
  ngayThucHien: string;
  diaDiem: string;
  nguoiPhuTrach: string;
  moTa: string;
  trangThai: AttendanceTaskStatus;
  tieuDoi: string;
  assignedMilitiaIds: string[];
};

function toDateInput(iso?: string | null, date?: Date | null): string {
  if (date) return date.toISOString().slice(0, 10);
  if (iso) return iso.split("T")[0];
  return new Date().toISOString().slice(0, 10);
}

export function TaskFormDialog({
  open,
  onOpenChange,
  editData,
  initialDate,
  onSuccess,
}: TaskFormDialogProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const leaderTieuDoi = session?.user?.tieuDoi;

  const [form, setForm] = useState<FormState>({
    tenNhiemVu: "",
    ngayThucHien: toDateInput(null, initialDate),
    diaDiem: "",
    nguoiPhuTrach: "",
    moTa: "",
    trangThai: "draft",
    tieuDoi: !isAdmin && leaderTieuDoi ? String(leaderTieuDoi) : "",
    assignedMilitiaIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [availableTieuDoi, setAvailableTieuDoi] = useState<number[]>([]);
  const isEdit = !!editData?._id;

  useEffect(() => {
    if (isAdmin) {
      getAvailableTieuDoi()
        .then(setAvailableTieuDoi)
        .catch(() => setAvailableTieuDoi([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setForm({
        tenNhiemVu: editData.tenNhiemVu,
        ngayThucHien: toDateInput(editData.ngayThucHien),
        diaDiem: editData.diaDiem ?? "",
        nguoiPhuTrach: editData.nguoiPhuTrach ?? "",
        moTa: editData.moTa ?? "",
        trangThai: editData.trangThai,
        tieuDoi: editData.tieuDoi != null ? String(editData.tieuDoi) : "",
        assignedMilitiaIds: editData.assignedMilitiaIds ?? [],
      });
    } else {
      setForm({
        tenNhiemVu: "",
        ngayThucHien: toDateInput(null, initialDate),
        diaDiem: "",
        nguoiPhuTrach: "",
        moTa: "",
        trangThai: "draft",
        tieuDoi: !isAdmin && leaderTieuDoi ? String(leaderTieuDoi) : "",
        assignedMilitiaIds: [],
      });
    }
  }, [open, editData, initialDate, isAdmin, leaderTieuDoi]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tenNhiemVu.trim()) {
      toast.error("Vui lòng nhập tên nhiệm vụ");
      return;
    }
    setLoading(true);

    const payload: Partial<AttendanceTask> = {
      tenNhiemVu: form.tenNhiemVu.trim(),
      ngayThucHien: new Date(form.ngayThucHien).toISOString(),
      diaDiem: form.diaDiem,
      nguoiPhuTrach: form.nguoiPhuTrach,
      moTa: form.moTa,
      trangThai: form.trangThai,
      tieuDoi: isAdmin
        ? form.tieuDoi ? Number(form.tieuDoi) : undefined
        : undefined,
      assignedMilitiaIds: form.assignedMilitiaIds,
    };

    const result = isEdit
      ? await updateAttendanceTask(editData!._id!, payload)
      : await createAttendanceTask(payload);

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEdit ? "Chỉnh sửa nhiệm vụ" : "Thêm nhiệm vụ mới"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1"
        >
          {/* Basic info */}
          <FormField label="Tên nhiệm vụ" htmlFor="tenNhiemVu" required>
            <Input
              id="tenNhiemVu"
              required
              value={form.tenNhiemVu}
              placeholder="VD: Tập huấn tháng 6, Tuần tra đêm..."
              onChange={(e) => update("tenNhiemVu", e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ngày thực hiện" htmlFor="ngayThucHien" required>
              <Input
                id="ngayThucHien"
                type="date"
                required
                value={form.ngayThucHien}
                onChange={(e) => update("ngayThucHien", e.target.value)}
              />
            </FormField>
            <FormField label="Trạng thái" htmlFor="trangThai">
              <Select
                value={form.trangThai}
                onValueChange={(v) =>
                  update("trangThai", (v ?? "draft") as AttendanceTaskStatus)
                }
              >
                <SelectTrigger id="trangThai">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="active">Đang diễn ra</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Squad assignment */}
          {isAdmin ? (
            <FormField label="Áp dụng cho" htmlFor="tieuDoi">
              <Select
                value={form.tieuDoi || "all"}
                onValueChange={(v) =>
                  update("tieuDoi", v === "all" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger id="tieuDoi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tiểu đội</SelectItem>
                  {availableTieuDoi.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Tiểu đội {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : leaderTieuDoi != null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Áp dụng cho:</span>
              <Badge variant="outline" className="font-medium">
                Tiểu đội {leaderTieuDoi}
              </Badge>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Địa điểm" htmlFor="diaDiem">
              <Input
                id="diaDiem"
                value={form.diaDiem}
                placeholder="VD: Trụ sở UBND phường"
                onChange={(e) => update("diaDiem", e.target.value)}
              />
            </FormField>
            <FormField label="Người phụ trách" htmlFor="nguoiPhuTrach">
              <Input
                id="nguoiPhuTrach"
                value={form.nguoiPhuTrach}
                placeholder="Họ tên chỉ huy"
                onChange={(e) => update("nguoiPhuTrach", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Mô tả" htmlFor="moTa">
            <Textarea
              id="moTa"
              rows={2}
              value={form.moTa}
              placeholder="Nội dung, yêu cầu nhiệm vụ..."
              onChange={(e) => update("moTa", e.target.value)}
            />
          </FormField>

          {/* Divider */}
          <hr className="border-border" />

          {/* Militia picker */}
          <MilitiaPicker
            selectedIds={form.assignedMilitiaIds}
            onChange={(ids) => update("assignedMilitiaIds", ids)}
            leaderTieuDoi={!isAdmin ? leaderTieuDoi : undefined}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Đang lưu..."
                : isEdit
                ? "Cập nhật"
                : "Tạo nhiệm vụ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
