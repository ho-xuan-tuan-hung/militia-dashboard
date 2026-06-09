"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/molecules/form-field";
import { createUser, updateUser } from "@/actions/users";
import { getAvailableTieuDoi } from "@/actions/militia";
import { toast } from "sonner";
import type { AppUser } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: AppUser | null;
  onSuccess: () => void;
}

interface FormState {
  username: string;
  password: string;
  hoTen: string;
  role: "admin" | "tieu_doi_truong" | "dan_quan";
  tieuDoi: string;
  active: boolean;
}

const defaultForm: FormState = {
  username: "",
  password: "",
  hoTen: "",
  role: "dan_quan",
  tieuDoi: "",
  active: true,
};

export function UserFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = !!editData;
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [availableTieuDoi, setAvailableTieuDoi] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          username: editData.username,
          password: "",
          hoTen: editData.hoTen,
          role: editData.role,
          tieuDoi: editData.tieuDoi ? String(editData.tieuDoi) : "",
          active: editData.active,
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
    }
  }, [open, editData]);

  useEffect(() => {
    getAvailableTieuDoi()
      .then(setAvailableTieuDoi)
      .catch(() => setAvailableTieuDoi([]));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.hoTen.trim()) errs.hoTen = "Họ tên là bắt buộc";
    if (!isEdit && !form.username.trim()) errs.username = "Tên đăng nhập là bắt buộc";
    if (!isEdit && !form.password) errs.password = "Mật khẩu là bắt buộc";
    if (form.password && form.password.length < 6)
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if ((form.role === "tieu_doi_truong" || form.role === "dan_quan") && !form.tieuDoi)
      errs.tieuDoi = "Phải chọn tiểu đội";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (isEdit && editData?._id) {
        const result = await updateUser(editData._id, {
          hoTen: form.hoTen.trim(),
          role: form.role,
          tieuDoi: form.tieuDoi ? Number(form.tieuDoi) : undefined,
          active: form.active,
          newPassword: form.password || undefined,
        });
        if (result.success) {
          toast.success(result.message);
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await createUser({
          username: form.username.trim(),
          password: form.password,
          hoTen: form.hoTen.trim(),
          role: form.role,
          tieuDoi: form.tieuDoi ? Number(form.tieuDoi) : undefined,
        });
        if (result.success) {
          toast.success(result.message);
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormField label="Họ và tên" required error={errors.hoTen}>
            <Input
              placeholder="Nguyễn Văn A"
              value={form.hoTen}
              onChange={(e) => update("hoTen", e.target.value)}
            />
          </FormField>

          {!isEdit && (
            <FormField label="Tên đăng nhập" required error={errors.username}>
              <Input
                placeholder="nguyen.van.a"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                autoComplete="off"
              />
            </FormField>
          )}

          <FormField
            label={isEdit ? "Mật khẩu mới (để trống = giữ nguyên)" : "Mật khẩu"}
            required={!isEdit}
            error={errors.password}
          >
            <Input
              type="password"
              placeholder={isEdit ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Vai trò" required>
            <Select
              value={form.role}
              onValueChange={(v) => update("role", (v ?? "tieu_doi_truong") as FormState["role"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="tieu_doi_truong">Tiểu đội trưởng</SelectItem>
                <SelectItem value="dan_quan">Dân quân</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {(form.role === "tieu_doi_truong" || form.role === "dan_quan") && (
            <FormField label="Tiểu đội" required error={errors.tieuDoi}>
              <Select
                value={form.tieuDoi}
                onValueChange={(v) => update("tieuDoi", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tiểu đội..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTieuDoi.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Tiểu đội {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {isEdit && (
            <FormField label="Trạng thái">
              <Select
                value={form.active ? "active" : "inactive"}
                onValueChange={(v) => update("active", v === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
