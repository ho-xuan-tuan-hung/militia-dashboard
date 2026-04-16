"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "./stats-cards";
import { MilitiaTable } from "./militia-table";
import { PageTransition } from "./page-transition";
import { getDashboardStats } from "@/actions/militia";
import type { DashboardStats } from "@/types";

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const loadStats = useCallback(async () => {
    const s = await getDashboardStats();
    setStats(s);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsCards stats={stats} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Danh sách quân nhân</h2>
          <MilitiaTable />
        </div>
      </div>
    </PageTransition>
  );
}
