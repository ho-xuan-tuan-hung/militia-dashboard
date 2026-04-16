import * as XLSX from "xlsx";
import type { MilitiaFormData } from "@/types";

// ─── Column mapping: Vietnamese headers → field keys ──────────────
const HEADER_MAP: Record<string, keyof MilitiaFormData | string> = {
  "Họ tên": "hoTen",
  "Họ và tên": "hoTen",
  "Ho ten": "hoTen",
  hoTen: "hoTen",
  CCCD: "cccd",
  cccd: "cccd",
  "Căn cước": "cccd",
  "Số CCCD": "cccd",
  "CCCD/CMT": "cccd",
  SĐT: "sdt",
  SDT: "sdt",
  sdt: "sdt",
  "Số điện thoại": "sdt",
  "Điện thoại": "sdt",
  "Địa chỉ": "diaChi",
  diaChi: "diaChi",
  "Trình độ văn hóa": "trinhDoVanHoa",
  "Trình độ văn hoá": "trinhDoVanHoa",
  "Trình độ VH": "trinhDoVanHoa",
  "Trình độ": "trinhDoVanHoa",
  trinhDoVanHoa: "trinhDoVanHoa",
  "Tiểu đội": "tieuDoi",
  tieuDoi: "tieuDoi",
  "Chức vụ": "chucVu",
  chucVu: "chucVu",
  "Năm vào lực lượng": "namVaoLucLuong",
  "Năm vào LL": "namVaoLucLuong",
  namVaoLucLuong: "namVaoLucLuong",
  "Họ tên cha": "cha_ten",
  "Tên cha": "cha_ten",
  "Cha": "cha_ten",
  "SĐT cha": "cha_sdt",
  "SDT cha": "cha_sdt",
  "Họ tên mẹ": "me_ten",
  "Tên mẹ": "me_ten",
  "Mẹ": "me_ten",
  "SĐT mẹ": "me_sdt",
  "SDT mẹ": "me_sdt",
  "Ghi chú": "ghiChu",
  ghiChu: "ghiChu",
  note: "ghiChu",
  "Ngày sinh": "__ngaySinh",
  "Năm sinh": "__namSinh",
};

function normalizeHeader(input: string): string {
  return input
    .normalize("NFC")
    .replace(/\uFEFF/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const HEADER_MAP_NORMALIZED: Record<string, keyof MilitiaFormData | string> =
  Object.fromEntries(
    Object.entries(HEADER_MAP).map(([k, v]) => [normalizeHeader(k), v])
  );

function isTenToken(token: string) {
  const t = normalizeHeader(token);
  return t === "tên" || t === "ten" || t.includes("ten");
}

function isSdtToken(token: string) {
  const t = normalizeHeader(token);
  return t === "sđt" || t === "sdt" || t.includes("sđt") || t.includes("sdt");
}

// ─── EXPORT: MilitiaFormData[] → Excel download ───────────────────
export function exportToExcel(data: MilitiaFormData[], filename?: string) {
  const rows = data.map((item, index) => ({
    STT: index + 1,
    "Họ tên": item.hoTen,
    CCCD: item.cccd,
    SĐT: item.sdt ?? "",
    "Địa chỉ": item.diaChi ?? "",
    "Trình độ VH": item.trinhDoVanHoa ?? "",
    "Tiểu đội": item.tieuDoi ?? "",
    "Chức vụ": item.chucVu ?? "",
    "Năm vào LL": item.namVaoLucLuong ?? "",
    "Họ tên cha": item.thongTinNguoiThan?.cha?.ten ?? "",
    "SĐT cha": item.thongTinNguoiThan?.cha?.sdt ?? "",
    "Họ tên mẹ": item.thongTinNguoiThan?.me?.ten ?? "",
    "SĐT mẹ": item.thongTinNguoiThan?.me?.sdt ?? "",
    "Ghi chú": item.ghiChu ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 5 },  // STT
    { wch: 25 }, // Họ tên
    { wch: 15 }, // CCCD
    { wch: 14 }, // SĐT
    { wch: 30 }, // Địa chỉ
    { wch: 14 }, // Trình độ VH
    { wch: 10 }, // Tiểu đội
    { wch: 20 }, // Chức vụ
    { wch: 12 }, // Năm vào LL
    { wch: 25 }, // Họ tên cha
    { wch: 14 }, // SĐT cha
    { wch: 25 }, // Họ tên mẹ
    { wch: 14 }, // SĐT mẹ
    { wch: 25 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh sách DQTV");

  const exportName =
    filename ?? `DQTV_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, exportName);
}

// Known header keywords used to detect the header row
const HEADER_KEYWORDS = ["họ tên", "ho ten", "hoten", "cccd", "căn cước"];

/**
 * Find the header row index by scanning for known keywords.
 * Returns 0-based row index, defaults to 0 if not found.
 */
function findHeaderRow(ws: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string") {
        const lower = cell.v.trim().toLowerCase();
        if (HEADER_KEYWORDS.some((kw) => lower.includes(kw))) {
          return r;
        }
      }
    }
  }
  return 0;
}

// ─── IMPORT: File → MilitiaFormData[] ─────────────────────────────
export async function parseExcelFile(
  file: File
): Promise<{ data: MilitiaFormData[]; errors: string[] }> {
  const isCSV = file.name.toLowerCase().endsWith(".csv");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          reject(new Error("Không đọc được file"));
          return;
        }

        const wb = isCSV
          ? XLSX.read(result as string, { type: "string", raw: true })
          : XLSX.read(result, { type: "array", raw: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Auto-detect header row
        const headerRowIndex = findHeaderRow(ws);
        const secondaryHeaderRowIndex = headerRowIndex + 1;
        const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
        const headerColsPrimary: string[] = [];
        const headerColsSecondary: string[] = [];

        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellPrimary = ws[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
          const cellSecondary =
            ws[XLSX.utils.encode_cell({ r: secondaryHeaderRowIndex, c })];

          headerColsPrimary.push(
            cellPrimary ? String(cellPrimary.v).trim() : `__col${c}`
          );
          headerColsSecondary.push(
            cellSecondary ? String(cellSecondary.v).trim() : ""
          );
        }

        // Precompute which field each column maps to.
        // (Some CSV exports have "merged" headers → family columns are split into primary + secondary header rows.)
        const fieldKeyByCol: Array<keyof MilitiaFormData | string | undefined> = [];
        const numCols = headerColsPrimary.length;

        for (let i = 0; i < numCols; i++) {
          const primary = headerColsPrimary[i] ?? "";
          const secondary = headerColsSecondary[i] ?? "";

          const primaryNorm = normalizeHeader(primary);
          const secondaryNorm = normalizeHeader(secondary);

          // 1) Direct mapping from primary header (case-insensitive)
          const direct = HEADER_MAP_NORMALIZED[primaryNorm];
          if (direct) {
            fieldKeyByCol[i] = direct;
            continue;
          }

          // 2) Family split across primary + secondary header rows
          const primaryIsCha = primaryNorm === "cha";
          const primaryIsMe = primaryNorm === "mẹ";
          const prevPrimaryNorm =
            i > 0 ? normalizeHeader(headerColsPrimary[i - 1] ?? "") : "";

          if (isTenToken(secondaryNorm)) {
            if (primaryIsCha) fieldKeyByCol[i] = "cha_ten";
            else if (primaryIsMe) fieldKeyByCol[i] = "me_ten";
            else if (prevPrimaryNorm === "cha") fieldKeyByCol[i] = "cha_ten";
            else if (prevPrimaryNorm === "mẹ") fieldKeyByCol[i] = "me_ten";
            else fieldKeyByCol[i] = undefined;
            continue;
          }

          if (isSdtToken(secondaryNorm)) {
            if (primaryIsCha) fieldKeyByCol[i] = "cha_sdt";
            else if (primaryIsMe) fieldKeyByCol[i] = "me_sdt";
            else if (prevPrimaryNorm === "cha") fieldKeyByCol[i] = "cha_sdt";
            else if (prevPrimaryNorm === "mẹ") fieldKeyByCol[i] = "me_sdt";
            else fieldKeyByCol[i] = undefined;
            continue;
          }

          fieldKeyByCol[i] = undefined;
        }

        const errors: string[] = [];
        const data: MilitiaFormData[] = [];

        // Determine where actual data starts.
        // If the row after header contains sub-header tokens (like "Tên", "SDT") but no real data,
        // skip it as it's a secondary header row.
        let dataStartRow = headerRowIndex + 1;
        const firstDataRowCells: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: dataStartRow, c })];
          firstDataRowCells.push(cell ? String(cell.v).trim() : "");
        }
        const firstRowJoined = firstDataRowCells.join(" ").toLowerCase();
        const looksLikeSubHeader =
          (isTenToken(firstRowJoined) || isSdtToken(firstRowJoined)) &&
          !firstDataRowCells.some((v) => /^\d{9,12}$/.test(v)); // no CCCD-like number
        if (looksLikeSubHeader) {
          dataStartRow = headerRowIndex + 2;
        }

        // Read data rows starting after header (and secondary header if present)
        for (let r = dataStartRow; r <= range.e.r; r++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: Record<string, any> = {};
          let hasAnyValue = false;

          for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            const rawVal = cell ? cell.v : "";
            const fieldKey = fieldKeyByCol[c - range.s.c];
            if (fieldKey && rawVal !== "" && rawVal != null) {
              const isNumericField =
                fieldKey === "tieuDoi" ||
                fieldKey === "namVaoLucLuong";

              // Prefer formatted value to preserve leading zeros (e.g. CCCD/SDT exported as number).
              const cellText =
                cell && typeof cell.w === "string" && cell.w.trim() !== ""
                  ? cell.w
                  : undefined;

              const value =
                !isNumericField && cellText != null
                  ? cellText.trim()
                  : typeof rawVal === "string"
                    ? rawVal.trim()
                    : rawVal;

              mapped[fieldKey] = value;
              hasAnyValue = true;
            }
          }

          // Skip completely empty rows
          if (!hasAnyValue) continue;

          const rowNum = r + 1; // 1-based for user display

          // Validate required fields
          if (!mapped.hoTen) {
            errors.push(`Dòng ${rowNum}: Thiếu "Họ tên"`);
            continue;
          }
          if (!mapped.cccd) {
            errors.push(`Dòng ${rowNum}: Thiếu "CCCD"`);
            continue;
          }

          const record: MilitiaFormData = {
            hoTen: String(mapped.hoTen),
            cccd: String(mapped.cccd),
            sdt: mapped.sdt ? String(mapped.sdt) : "",
            diaChi: mapped.diaChi ? String(mapped.diaChi) : "",
            trinhDoVanHoa: mapped.trinhDoVanHoa
              ? String(mapped.trinhDoVanHoa)
              : "",
            tieuDoi: mapped.tieuDoi ? Number(mapped.tieuDoi) : undefined,
            chucVu: mapped.chucVu ? String(mapped.chucVu) : "Chiến sĩ dân quân",
            namVaoLucLuong: mapped.namVaoLucLuong
              ? Number(mapped.namVaoLucLuong)
              : undefined,
            thongTinNguoiThan: {
              cha: {
                ten: mapped.cha_ten ? String(mapped.cha_ten) : "",
                sdt: mapped.cha_sdt ? String(mapped.cha_sdt) : "",
              },
              me: {
                ten: mapped.me_ten ? String(mapped.me_ten) : "",
                sdt: mapped.me_sdt ? String(mapped.me_sdt) : "",
              },
            },
            ghiChu: mapped.ghiChu ? String(mapped.ghiChu) : "",
          };

          data.push(record);
        }

        resolve({ data, errors });
      } catch {
        reject(new Error("Lỗi xử lý file Excel"));
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file"));

    if (isCSV) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

// ─── Download template Excel ──────────────────────────────────────
export function downloadTemplate() {
  const sampleRows = [
    {
      STT: 1,
      "Họ tên": "Nguyễn Văn A",
      CCCD: "001234567890",
      SĐT: "0901234567",
      "Địa chỉ": "123 Đường ABC, Phường X",
      "Trình độ VH": "12/12",
      "Tiểu đội": 1,
      "Chức vụ": "Chiến sĩ dân quân",
      "Năm vào LL": 2024,
      "Họ tên cha": "Nguyễn Văn B",
      "SĐT cha": "0909876543",
      "Họ tên mẹ": "Trần Thị C",
      "SĐT mẹ": "0908765432",
      "Ghi chú": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 15 },
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 25 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mẫu nhập liệu");
  XLSX.writeFile(wb, "Mau_DQTV.xlsx");
}
