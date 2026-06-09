"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createMilitia, updateMilitia } from "@/actions/militia";
import type { MilitiaFormData } from "@/types";

interface MilitiaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: MilitiaFormData | null;
  onSuccess: () => void;
}

const emptyForm: MilitiaFormData = {
  hoTen: "",
  cccd: "",
  sdt: "",
  diaChi: "",
  trinhDoVanHoa: "",
  tieuDoi: undefined,
  chucVu: "Chiến sĩ dân quân",
  namVaoLucLuong: undefined,
  thongTinNguoiThan: {
    cha: { ten: "", sdt: "" },
    me: { ten: "", sdt: "" },
  },
  ghiChu: "",
};

const CCCD_REGEX = /^\d{12}$/;
const SDT_REGEX = /^0[0-9]{9}$/;
const CURRENT_YEAR = new Date().getFullYear();

type FormErrors = Partial<Record<keyof MilitiaFormData, string>>;

export function MilitiaFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: MilitiaFormDialogProps) {
  const [form, setForm] = useState<MilitiaFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData?._id;

  // Reset/populate form whenever the dialog opens or editData changes.
  // No setTimeout — sync state update is correct here.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editData) {
      setForm({
        ...emptyForm,
        ...editData,
        thongTinNguoiThan: {
          cha: {
            ten: editData.thongTinNguoiThan?.cha?.ten ?? "",
            sdt: editData.thongTinNguoiThan?.cha?.sdt ?? "",
          },
          me: {
            ten: editData.thongTinNguoiThan?.me?.ten ?? "",
            sdt: editData.thongTinNguoiThan?.me?.sdt ?? "",
          },
        },
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editData]);

  function clearError(field: keyof MilitiaFormData) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function updateField(
    field: keyof MilitiaFormData,
    value: string | number | null | undefined
  ) {
    setForm((prev) => ({ ...prev, [field]: value ?? undefined }));
    clearError(field);
  }

  function updateNguoiThan(
    parent: "cha" | "me",
    field: "ten" | "sdt",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      thongTinNguoiThan: {
        ...prev.thongTinNguoiThan,
        [parent]: {
          ...prev.thongTinNguoiThan?.[parent],
          [field]: value,
        },
      },
    }));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!CCCD_REGEX.test(form.cccd)) {
      newErrors.cccd = "CCCD phải có đúng 12 chữ số";
    }

    if (form.sdt && !SDT_REGEX.test(form.sdt)) {
      newErrors.sdt = "SĐT không hợp lệ (10 chữ số, bắt đầu bằng 0)";
    }

    if (
      form.namVaoLucLuong !== undefined &&
      (form.namVaoLucLuong < 1945 || form.namVaoLucLuong > CURRENT_YEAR)
    ) {
      newErrors.namVaoLucLuong = `Năm vào phải từ 1945 đến ${CURRENT_YEAR}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const result = isEdit
      ? await updateMilitia(editData!._id!, form)
      : await createMilitia(form);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa thông tin" : "Thêm quân nhân mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div className="space-y-2">
            <Label htmlFor="hoTen">
              Họ tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hoTen"
              required
              value={form.hoTen}
              onChange={(e) => updateField("hoTen", e.target.value)}
            />
          </div>

          {/* CCCD + SĐT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cccd">
                CCCD <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cccd"
                required
                maxLength={12}
                value={form.cccd}
                onChange={(e) => updateField("cccd", e.target.value)}
              />
              {errors.cccd && (
                <p className="text-xs text-destructive">{errors.cccd}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input
                id="sdt"
                value={form.sdt ?? ""}
                onChange={(e) => updateField("sdt", e.target.value)}
              />
              {errors.sdt && (
                <p className="text-xs text-destructive">{errors.sdt}</p>
              )}
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="diaChi">Địa chỉ</Label>
            <Input
              id="diaChi"
              value={form.diaChi ?? ""}
              onChange={(e) => updateField("diaChi", e.target.value)}
            />
          </div>

          {/* Trình độ + Tiểu đội */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trinhDoVanHoa">Trình độ văn hóa</Label>
              <Input
                id="trinhDoVanHoa"
                value={form.trinhDoVanHoa ?? ""}
                placeholder="VD: 12/12, Đại học..."
                onChange={(e) => updateField("trinhDoVanHoa", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tieuDoi">Tiểu đội</Label>
              <Input
                id="tieuDoi"
                type="number"
                min={1}
                value={form.tieuDoi ?? ""}
                onChange={(e) =>
                  updateField(
                    "tieuDoi",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>

          {/* Chức vụ + Năm vào */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chức vụ</Label>
              <Select
                value={form.chucVu ?? "Chiến sĩ dân quân"}
                onValueChange={(v) => updateField("chucVu", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tiểu đội trưởng">
                    Tiểu đội trưởng
                  </SelectItem>
                  <SelectItem value="Chiến sĩ dân quân">
                    Chiến sĩ dân quân
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="namVaoLucLuong">Năm vào lực lượng</Label>
              <Input
                id="namVaoLucLuong"
                type="number"
                min={1945}
                max={CURRENT_YEAR}
                value={form.namVaoLucLuong ?? ""}
                onChange={(e) =>
                  updateField(
                    "namVaoLucLuong",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
              {errors.namVaoLucLuong && (
                <p className="text-xs text-destructive">
                  {errors.namVaoLucLuong}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <p className="text-sm font-medium text-muted-foreground">
            Thông tin người thân
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Họ tên cha</Label>
              <Input
                value={form.thongTinNguoiThan?.cha?.ten ?? ""}
                onChange={(e) => updateNguoiThan("cha", "ten", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SĐT cha</Label>
              <Input
                value={form.thongTinNguoiThan?.cha?.sdt ?? ""}
                onChange={(e) => updateNguoiThan("cha", "sdt", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Họ tên mẹ</Label>
              <Input
                value={form.thongTinNguoiThan?.me?.ten ?? ""}
                onChange={(e) => updateNguoiThan("me", "ten", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SĐT mẹ</Label>
              <Input
                value={form.thongTinNguoiThan?.me?.sdt ?? ""}
                onChange={(e) => updateNguoiThan("me", "sdt", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Ghi chú — textarea for multi-line notes */}
          <div className="space-y-2">
            <Label htmlFor="ghiChu">Ghi chú</Label>
            <Textarea
              id="ghiChu"
              rows={3}
              value={form.ghiChu ?? ""}
              onChange={(e) => updateField("ghiChu", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
