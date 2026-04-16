import * as XLSX from "xlsx";
import type { MilitiaFormData } from "@/types";

// ─── Column mapping: Vietnamese headers → field keys ──────────────
const HEADER_MAP: Record<string, keyof MilitiaFormData | string> = {
  STT: "stt",
  stt: "stt",
  "Họ tên": "hoTen",
  "Họ và tên": "hoTen",
  "Ho ten": "hoTen",
  hoTen: "hoTen",
  CCCD: "cccd",
  cccd: "cccd",
  "Căn cước": "cccd",
  "Số CCCD": "cccd",
  SĐT: "sdt",
  sdt: "sdt",
  "Số điện thoại": "sdt",
  "Điện thoại": "sdt",
  "Địa chỉ": "diaChi",
  diaChi: "diaChi",
  "Trình độ văn hóa": "trinhDoVanHoa",
  "Trình độ VH": "trinhDoVanHoa",
  trinhDoVanHoa: "trinhDoVanHoa",
  "Tiểu đội": "tieuDoi",
  tieuDoi: "tieuDoi",
  "Chức vụ": "chucVu",
  chucVu: "chucVu",
  "Năm vào lực lượng": "namVaoLucLuong",
  "Năm vào LL": "namVaoLucLuong",
  namVaoLucLuong: "namVaoLucLuong",
  "Họ tên cha": "cha_ten",
  "SĐT cha": "cha_sdt",
  "Họ tên mẹ": "me_ten",
  "SĐT mẹ": "me_sdt",
  "Ghi chú": "ghiChu",
  ghiChu: "ghiChu",
};

// ─── EXPORT: MilitiaFormData[] → Excel download ───────────────────
export function exportToExcel(data: MilitiaFormData[], filename?: string) {
  const rows = data.map((item, index) => ({
    STT: item.stt ?? index + 1,
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

// ─── IMPORT: File → MilitiaFormData[] ─────────────────────────────
export async function parseExcelFile(
  file: File
): Promise<{ data: MilitiaFormData[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) {
          reject(new Error("Không đọc được file"));
          return;
        }

        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });

        const errors: string[] = [];
        const data: MilitiaFormData[] = [];

        rawRows.forEach((raw, rowIndex) => {
          // Map headers to known fields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: Record<string, any> = {};

          for (const [header, value] of Object.entries(raw)) {
            const trimmed = header.trim();
            const fieldKey = HEADER_MAP[trimmed];
            if (fieldKey) {
              mapped[fieldKey] = typeof value === "string" ? value.trim() : value;
            }
          }

          // Validate required fields
          if (!mapped.hoTen) {
            errors.push(`Dòng ${rowIndex + 2}: Thiếu "Họ tên"`);
            return;
          }
          if (!mapped.cccd) {
            errors.push(`Dòng ${rowIndex + 2}: Thiếu "CCCD"`);
            return;
          }

          // Build the record
          const record: MilitiaFormData = {
            hoTen: String(mapped.hoTen),
            cccd: String(mapped.cccd),
            stt: mapped.stt ? Number(mapped.stt) : undefined,
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
        });

        resolve({ data, errors });
      } catch {
        reject(new Error("Lỗi xử lý file Excel"));
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
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
