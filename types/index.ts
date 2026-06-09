export interface MilitiaFormData {
  _id?: string;
  hoTen: string;
  cccd: string;
  sdt?: string;
  diaChi?: string;
  trinhDoVanHoa?: string;
  tieuDoi?: number;
  chucVu?: string;
  namVaoLucLuong?: number;
  thongTinNguoiThan?: {
    cha?: { ten?: string; sdt?: string };
    me?: { ten?: string; sdt?: string };
  };
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalMilitia: number;
  totalSquads: number;
  newRecruits: number;
  totalLeaders: number;
}

export interface TrinhDoStats {
  name: string;
  count: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: MilitiaFormData | MilitiaFormData[];
}

// ─── Attendance ───────────────────────────────────────────────────

export type AttendanceTaskStatus = "draft" | "active" | "completed";
export type AttendanceStatus = "co_mat" | "vang_mat" | "tre";

export interface AttendanceTask {
  _id?: string;
  tenNhiemVu: string;
  moTa?: string;
  ngayThucHien: string; // ISO date string
  diaDiem?: string;
  nguoiPhuTrach?: string;
  trangThai: AttendanceTaskStatus;
  tieuDoi?: number; // undefined = all squads, number = specific squad
  createdBy?: string;
  assignedMilitiaIds?: string[]; // if set, only these militia attend the task
  // Computed from aggregation (not stored)
  totalRecords?: number;
  presentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PickerMilitia {
  _id: string;
  hoTen: string;
  tieuDoi?: number;
  chucVu?: string;
}

// ─── Users / RBAC ─────────────────────────────────────────────────

export type UserRole = "admin" | "tieu_doi_truong";

export interface AppUser {
  _id?: string;
  username: string;
  hoTen: string;
  role: UserRole;
  tieuDoi?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserActionResult {
  success: boolean;
  message: string;
  data?: AppUser;
}

export interface AttendanceRecord {
  _id?: string;
  taskId: string;
  militiaId: string;
  hoTen: string;
  tieuDoi?: number;
  chucVu?: string;
  trangThaiDiemDanh: AttendanceStatus;
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MilitiaAttendanceRow {
  militiaId: string;
  hoTen: string;
  tieuDoi?: number;
  chucVu?: string;
  trangThaiDiemDanh: AttendanceStatus;
  ghiChu: string;
  recordId?: string;
}

export interface AttendanceStat {
  totalTasks: number;
  tasksThisMonth: number;
  avgAttendanceRate: number;
  totalRecords: number;
}

export interface AttendanceTaskActionResult {
  success: boolean;
  message: string;
  data?: AttendanceTask;
}
