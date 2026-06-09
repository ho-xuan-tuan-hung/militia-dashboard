"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, User, Plus, MoreHorizontal, Pencil, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { getUsers, deleteUser } from "@/actions/users";
import { toast } from "sonner";
import type { AppUser } from "@/types";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-purple-500", "bg-rose-500", "bg-cyan-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + (hash << 5) - hash;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserBoard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleDelete() {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    const result = await deleteUser(deleteTarget._id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (result.success) {
      toast.success(result.message);
      loadUsers();
    } else {
      toast.error(result.message);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{users.length} tài khoản</p>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex flex-col rounded-xl border bg-card p-4 shadow-sm"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-bold shrink-0 ${getAvatarColor(user.hoTen)}`}
              >
                {getInitials(user.hoTen)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-tight truncate">{user.hoTen}</p>
                <p className="text-sm text-muted-foreground truncate">{user.username}</p>
              </div>
            </div>

            {/* Role + squad */}
            <div className="mt-3 flex flex-wrap gap-2">
              {user.role === "admin" ? (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Quản trị viên
                </Badge>
              ) : (
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 gap-1">
                  <User className="h-3 w-3" />
                  Tiểu đội trưởng
                </Badge>
              )}
              {user.tieuDoi != null && (
                <Badge variant="outline" className="text-xs">
                  Tiểu đội {user.tieuDoi}
                </Badge>
              )}
              {!user.active && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Đã khóa
                </Badge>
              )}
            </div>

            {/* Active indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <div
                className={`h-2 w-2 rounded-full ${user.active ? "bg-emerald-500" : "bg-gray-400"}`}
              />
              <span className="text-muted-foreground">
                {user.active ? "Đang hoạt động" : "Tạm khóa"}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={() => setEditTarget(user)}
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Chỉnh sửa
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent transition-colors cursor-pointer">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setEditTarget(user)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(user)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            Chưa có tài khoản nào. Nhấn &quot;Thêm tài khoản&quot; để bắt đầu.
          </div>
        )}
      </div>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        editData={null}
        onSuccess={loadUsers}
      />

      <UserFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        editData={editTarget}
        onSuccess={loadUsers}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa tài khoản"
        description={
          <>
            Bạn có chắc muốn xóa tài khoản{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.hoTen}
            </span>{" "}
            ({deleteTarget?.username})? Hành động này không thể hoàn tác.
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
