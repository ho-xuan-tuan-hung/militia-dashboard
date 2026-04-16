"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "./stats-cards";
import { TrinhDoChart } from "./trinh-do-chart";
import { MilitiaTable } from "./militia-table";
import { PageTransition } from "./page-transition";
import { getDashboardStats, getTrinhDoStats } from "@/actions/militia";
import type { DashboardStats, TrinhDoStats } from "@/types";

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trinhDoData, setTrinhDoData] = useState<TrinhDoStats[] | null>(null);

  const loadStats = useCallback(async () => {
    const [s, t] = await Promise.all([getDashboardStats(), getTrinhDoStats()]);
    setStats(s);
    setTrinhDoData(t);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsCards stats={stats} />
        <TrinhDoChart data={trinhDoData} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Danh sách quân nhân</h2>
          <MilitiaTable />
        </div>
      </div>
    </PageTransition>
  );
}
