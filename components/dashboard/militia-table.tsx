"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMilitiaList,
  deleteMilitia,
  getAllMilitiaForExport,
  getAvailableYears,
  getAvailableTieuDoi,
} from "@/actions/militia";
import { MilitiaFormDialog } from "./militia-form-dialog";
import { ImportDialog } from "./import-dialog";
import { exportToExcel } from "@/lib/excel";
import type { MilitiaFormData } from "@/types";
import { cn } from "@/lib/utils";

interface MilitiaTableProps {
  onStatsChange?: () => void;
}

export function MilitiaTable({ onStatsChange }: MilitiaTableProps) {
  const [data, setData] = useState<MilitiaFormData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [chucVuFilter, setChucVuFilter] = useState("");
  const [tieuDoiFilter, setTieuDoiFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTieuDoi, setAvailableTieuDoi] = useState<number[]>([]);
  const [loading, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<MilitiaFormData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MilitiaFormData | null>(
    null
  );
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
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleAdd() {
    setEditData(null);
    setDialogOpen(true);
  }

  function handleEdit(row: MilitiaFormData) {
    setEditData(row);
    setDialogOpen(true);
  }

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

  const columns: ColumnDef<MilitiaFormData>[] = [
    {
      id: "stt",
      header: "STT",
      size: 60,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "hoTen",
      header: "Họ tên",
      size: 180,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.hoTen}</span>
      ),
    },
    {
      accessorKey: "cccd",
      header: "CCCD",
      size: 140,
    },
    {
      accessorKey: "sdt",
      header: "SĐT",
      size: 120,
    },
    {
      accessorKey: "tieuDoi",
      header: "Tiểu đội",
      size: 90,
      cell: ({ row }) => row.original.tieuDoi ?? "-",
    },
    {
      accessorKey: "chucVu",
      header: "Chức vụ",
      size: 160,
      cell: ({ row }) => {
        const cv = row.original.chucVu;
        if (cv === "Tiểu đội trưởng") {
          return (
            <Badge className="bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/30">
              Tiểu đội trưởng
            </Badge>
          );
        }
        return (
          <Badge className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/30">
            Chiến sĩ dân quân
          </Badge>
        );
      },
    },
    {
      accessorKey: "trinhDoVanHoa",
      header: "Trình độ VH",
      size: 110,
    },
    {
      accessorKey: "namVaoLucLuong",
      header: "Năm vào LL",
      size: 100,
      cell: ({ row }) => row.original.namVaoLucLuong ?? "-",
    },
    {
      id: "actions",
      header: "",
      size: 50,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const totalPages = Math.ceil(total / pageSize);

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
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Chức vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chức vụ</SelectItem>
              <SelectItem value="Tiểu đội trưởng">Tiểu đội trưởng</SelectItem>
              <SelectItem value="Chiến sĩ dân quân">
                Chiến sĩ dân quân
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={tieuDoiFilter}
            onValueChange={(v) => {
              setTieuDoiFilter(v === "all" ? "" : (v ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tiểu đội" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả TĐ</SelectItem>
              {availableTieuDoi.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Tiểu đội {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={yearFilter}
            onValueChange={(v) => {
              setYearFilter(v === "all" ? "" : (v ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Năm vào lực lượng" />
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

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Đang xuất..." : "Export"}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Table — dimmed while a non-initial transition runs */}
      <div
        className={cn(
          "relative rounded-lg border transition-opacity duration-150",
          loading && !initialLoad && "opacity-60 pointer-events-none"
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {initialLoad ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search || chucVuFilter || tieuDoiFilter || yearFilter
                    ? "Không tìm thấy kết quả phù hợp"
                    : "Chưa có dữ liệu. Nhấn \"Thêm mới\" để bắt đầu."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} / ${total} bản ghi`
            : "Không có bản ghi"}
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
            Trang {page} / {totalPages || 1}
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.hoTen}
            </span>{" "}
            khỏi danh sách? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <MilitiaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
        onSuccess={() => {
          fetchData();
          onStatsChange?.();
        }}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          fetchData();
          onStatsChange?.();
        }}
      />
    </div>
  );
}
