"use client";

import { Shield, Phone, MapPin, Calendar, User, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MilitiaFormData } from "@/types";

interface MyProfileCardProps {
  profile: MilitiaFormData;
  userName: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export function MyProfileCard({ profile, userName }: MyProfileCardProps) {
  const initials = profile.hoTen
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {initials}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{profile.hoTen}</h1>
        <p className="text-sm text-muted-foreground">@{userName}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {profile.chucVu && (
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Shield className="mr-1 h-3 w-3" />
              {profile.chucVu}
            </Badge>
          )}
          {profile.tieuDoi != null && (
            <Badge variant="outline">Tiểu đội {profile.tieuDoi}</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Thông tin cá nhân</h2>
        <InfoRow icon={FileText} label="Số CCCD" value={profile.cccd} />
        <InfoRow icon={Phone} label="Số điện thoại" value={profile.sdt} />
        <InfoRow icon={MapPin} label="Địa chỉ" value={profile.diaChi} />
        <InfoRow icon={Calendar} label="Năm vào lực lượng" value={profile.namVaoLucLuong} />
        <InfoRow icon={User} label="Trình độ văn hóa" value={profile.trinhDoVanHoa} />
        {profile.ghiChu && (
          <InfoRow icon={FileText} label="Ghi chú" value={profile.ghiChu} />
        )}
      </div>

      {/* Nguoi than */}
      {(profile.thongTinNguoiThan?.cha?.ten || profile.thongTinNguoiThan?.me?.ten) && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            <Users className="inline mr-1.5 h-3.5 w-3.5" />
            Thông tin người thân
          </h2>
          {profile.thongTinNguoiThan?.cha?.ten && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cha</p>
              <p className="font-medium">{profile.thongTinNguoiThan.cha.ten}</p>
              {profile.thongTinNguoiThan.cha.sdt && (
                <p className="text-sm text-muted-foreground">{profile.thongTinNguoiThan.cha.sdt}</p>
              )}
            </div>
          )}
          {profile.thongTinNguoiThan?.me?.ten && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mẹ</p>
              <p className="font-medium">{profile.thongTinNguoiThan.me.ten}</p>
              {profile.thongTinNguoiThan.me.sdt && (
                <p className="text-sm text-muted-foreground">{profile.thongTinNguoiThan.me.sdt}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
