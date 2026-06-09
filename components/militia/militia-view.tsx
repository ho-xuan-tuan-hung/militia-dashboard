"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Users,
  Shield,
} from "lucide-react";
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
import { toast } from "sonner";
import {
  getMilitiaList,
  deleteMilitia,
  getAllMilitiaForExport,
  getAvailableYears,
  getAvailableTieuDoi,
} from "@/actions/militia";
import { MilitiaFormDialog } from "@/components/dashboard/militia-form-dialog";
import { ImportDialog } from "@/components/dashboard/import-dialog";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { MemberCard } from "./member-card";
import { exportToExcel } from "@/lib/excel";
import type { MilitiaFormData } from "@/types";
import { cn } from "@/lib/utils";

interface MilitiaViewProps {
  onStatsChange?: () => void;
}

export function MilitiaView({ onStatsChange }: MilitiaViewProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const isLeader = session?.user?.role === "tieu_doi_truong";

  const [data, setData] = useState<MilitiaFormData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 24; // cards: multiple of 4 looks nicer
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [chucVuFilter, setChucVuFilter] = useState("");
  const [tieuDoiFilter, setTieuDoiFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTieuDoi, setAvailableTieuDoi] = useState<number[]>([]);
  const [loading, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<MilitiaFormData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MilitiaFormData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const result = await getMilitiaList({
        search,
        chucVu: chucVuFilter,
        tieuDoi: tieuDoiFilter,
        namVaoLucLuong: yearFilter,
        page,
        pageSize,
      });
      setData(result.data);
      setTotal(result.total);
      setInitialLoad(false);
    });
  }, [search, chucVuFilter, tieuDoiFilter, yearFilter, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([getAvailableYears(), getAvailableTieuDoi()])
      .then(([years, squads]) => {
        setAvailableYears(years);
        setAvailableTieuDoi(squads);
      })
      .catch(() => {
        setAvailableYears([]);
        setAvailableTieuDoi([]);
      });
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    const result = await deleteMilitia(deleteTarget._id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (result.success) {
      toast.success(result.message);
      fetchData();
      onStatsChange?.();
    } else {
      toast.error(result.message);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const allData = await getAllMilitiaForExport();
      if (allData.length === 0) {
        toast.warning("Không có dữ liệu để xuất");
        return;
      }
      exportToExcel(allData);
      toast.success(`Đã xuất ${allData.length} bản ghi`);
    } catch {
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const squadLabel = isLeader && session?.user?.tieuDoi
    ? `Tiểu đội ${session.user.tieuDoi}`
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-xs sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo họ tên, CCCD..."
              className="pl-9 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={chucVuFilter}
            onValueChange={(v) => {
              setChucVuFilter(v === "all" ? "" : (v ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chức vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chức vụ</SelectItem>
              <SelectItem value="Tiểu đội trưởng">Tiểu đội trưởng</SelectItem>
              <SelectItem value="Chiến sĩ dân quân">Chiến sĩ dân quân</SelectItem>
            </SelectContent>
          </Select>

          {/* Squad filter for admin — pill buttons (not dropdown) */}
          {isAdmin && availableTieuDoi.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setTieuDoiFilter(""); setPage(1); }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  !tieuDoiFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                )}
              >
                Tất cả TĐ
              </button>
              {availableTieuDoi.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setTieuDoiFilter(tieuDoiFilter === String(n) ? "" : String(n)); setPage(1); }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    tieuDoiFilter === String(n)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  <Shield className="h-3 w-3" />
                  TĐ {n}
                </button>
              ))}
            </div>
          )}

          <Select
            value={yearFilter}
            onValueChange={(v) => {
              setYearFilter(v === "all" ? "" : (v ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Năm vào LL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Đang xuất..." : "Export"}
            </Button>
            <Button onClick={() => { setEditData(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </div>
        )}
      </div>

      {/* Header summary */}
      {!initialLoad && (
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          {squadLabel ? (
            <span>
              <span className="font-semibold text-foreground">{squadLabel}</span>
              <span className="text-muted-foreground"> · {total} quân nhân</span>
            </span>
          ) : tieuDoiFilter ? (
            <span>
              <span className="font-semibold text-foreground">Tiểu đội {tieuDoiFilter}</span>
              <span className="text-muted-foreground"> · {total} quân nhân</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{total} quân nhân</span>
          )}
        </div>
      )}

      {/* Card grid */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-150",
          loading && !initialLoad && "opacity-60 pointer-events-none"
        )}
      >
        {initialLoad ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((member) => (
            <MemberCard
              key={member._id ?? member.cccd}
              member={member}
              isAdmin={isAdmin}
              onEdit={(m) => { setEditData(m); setDialogOpen(true); }}
              onDelete={(m) => setDeleteTarget(m)}
            />
          ))
        ) : (
          <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            {search || chucVuFilter || tieuDoiFilter || yearFilter
              ? "Không tìm thấy kết quả phù hợp"
              : isAdmin
              ? "Chưa có dữ liệu. Nhấn \"Thêm mới\" để bắt đầu."
              : "Chưa có dữ liệu trong tiểu đội."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!initialLoad && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {`Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} / ${total} bản ghi`}
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
              {page} / {totalPages}
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
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.hoTen}
            </span>{" "}
            khỏi danh sách? Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />

      {/* Form Dialog */}
      {isAdmin && (
        <>
          <MilitiaFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editData={editData}
            onSuccess={() => {
              fetchData();
              onStatsChange?.();
            }}
          />
          <ImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            onSuccess={() => {
              fetchData();
              onStatsChange?.();
            }}
          />
        </>
      )}
    </div>
  );
}
