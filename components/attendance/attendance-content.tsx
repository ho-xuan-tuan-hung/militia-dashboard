"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/molecules/page-header";
import { AttendanceStats } from "./attendance-stats";
import { TaskBoard } from "./task-board";
import { PageTransition } from "@/components/dashboard/page-transition";
import { getAttendanceStat } from "@/actions/attendance";
import type { AttendanceStat } from "@/types";
import { ClipboardList } from "lucide-react";

export function AttendanceContent() {
  const [stat, setStat] = useState<AttendanceStat | null>(null);

  const loadStat = useCallback(async () => {
    const s = await getAttendanceStat();
    setStat(s);
  }, []);

  useEffect(() => {
    void loadStat();
  }, [loadStat]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          icon={<ClipboardList className="h-5 w-5" />}
          title="Điểm danh nhiệm vụ"
          subtitle="Quản lý nhiệm vụ và điểm danh quân nhân"
        />

        <AttendanceStats stat={stat} />

        <TaskBoard onStatsChange={loadStat} />
      </div>
    </PageTransition>
  );
}
