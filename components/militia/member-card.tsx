"use client";

import { Pencil, Trash2, Phone, GraduationCap, Calendar, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChucVuBadge } from "@/components/molecules/status-badge";
import type { MilitiaFormData } from "@/types";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
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

interface MemberCardProps {
  member: MilitiaFormData;
  isAdmin: boolean;
  onEdit?: (member: MilitiaFormData) => void;
  onDelete?: (member: MilitiaFormData) => void;
}

export function MemberCard({ member, isAdmin, onEdit, onDelete }: MemberCardProps) {
  return (
    <div className="group flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg select-none ${getAvatarColor(member.hoTen)}`}
        >
          {getInitials(member.hoTen)}
        </div>

        <div>
          <p className="font-semibold text-foreground leading-tight">{member.hoTen}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
            <ChucVuBadge value={member.chucVu ?? ""} />
            {member.tieuDoi != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                TĐ {member.tieuDoi}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{member.sdt || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
          <span>{member.trinhDoVanHoa || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Vào LL: {member.namVaoLucLuong ?? "—"}</span>
        </div>
        {member.diaChi && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{member.diaChi}</span>
          </div>
        )}
      </div>

      {/* Actions — only for admin */}
      {isAdmin && (
        <div className="mt-4 flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 cursor-pointer"
            onClick={() => onEdit?.(member)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Sửa
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete?.(member)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
