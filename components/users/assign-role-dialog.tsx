"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUser } from "@/actions/users";
import type { AppUser } from "@/types";

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  onSuccess?: () => void;
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: AssignRoleDialogProps) {
  const [role, setRole] = useState<"admin" | "tieu_doi_truong" | "dan_quan">(
    user?.role || "dan_quan"
  );
  const [tieuDoi, setTieuDoi] = useState<string>(
    user?.tieuDoi?.toString() || ""
  );
  const [loading, setLoading] = useState(false);

  // Update when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setTieuDoi(user.tieuDoi?.toString() || "");
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (role === "tieu_doi_truong" && !tieuDoi) {
      toast.error("Tiểu đội trưởng phải được gán tiểu đội");
      return;
    }

    setLoading(true);
    const result = await updateUser(user._id!, {
      role,
      tieuDoi: role === "tieu_doi_truong" ? parseInt(tieuDoi) : undefined,
    });
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Phân quyền
          </DialogTitle>
          <DialogDescription>
            Thay đổi quyền hạn cho <span className="font-semibold text-foreground">{user?.hoTen}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Quyền hạn</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger id="role" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên (Toàn quyền)</SelectItem>
                <SelectItem value="tieu_doi_truong">Tiểu đội trưởng (Quản lý tiểu đội)</SelectItem>
                <SelectItem value="dan_quan">Dân quân (Xem hồ sơ + điểm danh)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(role === "tieu_doi_truong" || role === "dan_quan") && (
            <div className="space-y-2">
              <Label htmlFor="tieu-doi">Tiểu đội</Label>
              <Select
                value={tieuDoi}
                onValueChange={(v) => setTieuDoi(v ?? "")}
              >
                <SelectTrigger id="tieu-doi" disabled={loading}>
                  <SelectValue placeholder="Chọn tiểu đội" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tiểu đội 1</SelectItem>
                  <SelectItem value="2">Tiểu đội 2</SelectItem>
                  <SelectItem value="3">Tiểu đội 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Đang xử lý..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
