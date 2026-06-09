"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "./stats-cards";
import { TrinhDoChart } from "./trinh-do-chart";
import { MilitiaView } from "@/components/militia/militia-view";
import { PageTransition } from "./page-transition";
import { getDashboardStats, getTrinhDoStats } from "@/actions/militia";
import type { DashboardStats, TrinhDoStats } from "@/types";

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trinhDoStats, setTrinhDoStats] = useState<TrinhDoStats[] | null>(null);

  const loadStats = useCallback(async () => {
    const [s, t] = await Promise.all([getDashboardStats(), getTrinhDoStats()]);
    setStats(s);
    setTrinhDoStats(t);
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsCards stats={stats} />
        <TrinhDoChart data={trinhDoStats} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Danh sách quân nhân</h2>
          <MilitiaView onStatsChange={loadStats} />
        </div>
      </div>
    </PageTransition>
  );
}
