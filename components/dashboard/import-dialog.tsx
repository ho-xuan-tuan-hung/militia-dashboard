"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { parseExcelFile, downloadTemplate } from "@/lib/excel";
import { bulkUpsertMilitia } from "@/actions/militia";
import type { MilitiaFormData } from "@/types";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MilitiaFormData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [parsed, setParsed] = useState(false);

  function reset() {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setParsed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = selected.name.substring(selected.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(selected.type) && !validExtensions.includes(ext)) {
      toast.error("Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)");
      return;
    }

    setFile(selected);
    setErrors([]);
    setParsed(false);

    try {
      const result = await parseExcelFile(selected);
      setPreview(result.data);
      setErrors(result.errors);
      setParsed(true);

      if (result.data.length === 0 && result.errors.length === 0) {
        toast.warning("File không có dữ liệu");
      }
    } catch {
      toast.error("Không thể đọc file. Vui lòng kiểm tra định dạng.");
      reset();
    }
  }

  async function handleImport() {
    if (preview.length === 0) return;

    setImporting(true);
    const result = await bulkUpsertMilitia(preview);
    setImporting(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      reset();
      onSuccess();
    } else {
      toast.error(result.message);
    }
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import danh sách từ Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Chưa có mẫu? Tải file mẫu</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Tải mẫu
            </Button>
          </div>

          {/* File upload area */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium">
                  Nhấn để chọn file Excel/CSV
                </p>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ .xlsx, .xls, .csv
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
          </div>

          {/* Parse results */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {preview.length} bản ghi hợp lệ
                </Badge>
                {errors.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errors.length} lỗi
                  </Badge>
                )}
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Họ tên
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          CCCD
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Chức vụ
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Tiểu đội
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{row.hoTen}</td>
                          <td className="px-3 py-1.5">{row.cccd}</td>
                          <td className="px-3 py-1.5">{row.chucVu}</td>
                          <td className="px-3 py-1.5">
                            {row.tieuDoi ?? "-"}
                          </td>
                        </tr>
                      ))}
                      {preview.length > 10 && (
                        <tr className="border-t">
                          <td
                            colSpan={4}
                            className="px-3 py-1.5 text-center text-muted-foreground"
                          >
                            ... và {preview.length - 10} bản ghi nữa
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Các dòng bị bỏ qua:
                  </div>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Import sẽ tự động cập nhật nếu CCCD đã tồn tại (upsert).
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
            >
              {importing
                ? "Đang import..."
                : `Import ${preview.length} bản ghi`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
