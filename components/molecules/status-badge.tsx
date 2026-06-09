import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, AttendanceTaskStatus } from "@/types";

// ─── Chức vụ ─────────────────────────────────────────────────────

const CHUC_VU_STYLES: Record<string, string> = {
  "Tiểu đội trưởng":
    "bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/25",
  "Chiến sĩ dân quân":
    "bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/25",
};

// ─── Attendance status ────────────────────────────────────────────

const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  { label: string; style: string }
> = {
  co_mat: {
    label: "Có mặt",
    style: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  },
  vang_mat: {
    label: "Vắng mặt",
    style: "bg-red-500/15 text-red-700 border-red-500/30",
  },
  tre: {
    label: "Trễ",
    style: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  },
};

// ─── Task status ──────────────────────────────────────────────────

const TASK_STATUS_CONFIG: Record<
  AttendanceTaskStatus,
  { label: string; style: string }
> = {
  draft: {
    label: "Nháp",
    style: "bg-gray-500/15 text-gray-600 border-gray-500/30",
  },
  active: {
    label: "Đang diễn ra",
    style: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  },
  completed: {
    label: "Hoàn thành",
    style: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  },
};

interface ChucVuBadgeProps {
  value: string;
  className?: string;
}

export function ChucVuBadge({ value, className }: ChucVuBadgeProps) {
  const style =
    CHUC_VU_STYLES[value] ??
    "bg-gray-500/15 text-gray-600 border-gray-500/30";
  return <Badge className={cn(style, className)}>{value}</Badge>;
}

interface AttendanceStatusBadgeProps {
  value: AttendanceStatus;
  className?: string;
}

export function AttendanceStatusBadge({
  value,
  className,
}: AttendanceStatusBadgeProps) {
  const config = ATTENDANCE_CONFIG[value];
  return (
    <Badge className={cn(config.style, className)}>{config.label}</Badge>
  );
}

interface TaskStatusBadgeProps {
  value: AttendanceTaskStatus;
  className?: string;
}

export function TaskStatusBadge({ value, className }: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[value];
  return (
    <Badge className={cn(config.style, className)}>{config.label}</Badge>
  );
}
