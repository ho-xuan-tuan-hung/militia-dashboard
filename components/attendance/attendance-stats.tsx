"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Calendar, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceStat } from "@/types";

interface AttendanceStatsProps {
  stat: AttendanceStat | null;
}

const cards = [
  {
    key: "totalTasks" as const,
    label: "Tổng nhiệm vụ",
    icon: ClipboardList,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    gradient: "from-primary/5 to-transparent",
    border: "border-primary/20",
    format: (v: number) => String(v),
  },
  {
    key: "tasksThisMonth" as const,
    label: "Nhiệm vụ tháng này",
    icon: Calendar,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    gradient: "from-blue-500/5 to-transparent",
    border: "border-blue-500/20",
    format: (v: number) => String(v),
  },
  {
    key: "avgAttendanceRate" as const,
    label: "Tỷ lệ chuyên cần",
    icon: TrendingUp,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    gradient: "from-emerald-500/5 to-transparent",
    border: "border-emerald-500/20",
    format: (v: number) => `${v}%`,
  },
  {
    key: "totalRecords" as const,
    label: "Tổng lượt điểm danh",
    icon: Users,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    gradient: "from-amber-500/5 to-transparent",
    border: "border-amber-500/20",
    format: (v: number) => String(v),
  },
];

export function AttendanceStats({ stat }: AttendanceStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className={cn(
            "border bg-gradient-to-br",
            card.gradient,
            card.border
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={cn("rounded-lg p-2", card.iconBg)}>
              <card.icon className={cn("h-4 w-4", card.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            {stat ? (
              <p className="text-3xl font-bold tracking-tight">
                {card.format(stat[card.key])}
              </p>
            ) : (
              <Skeleton className="h-9 w-20" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
