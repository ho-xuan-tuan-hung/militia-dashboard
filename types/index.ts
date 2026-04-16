export interface MilitiaFormData {
  _id?: string;
  stt?: number;
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
