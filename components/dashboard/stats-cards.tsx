"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, UserPlus, Star } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats | null;
}

const cards = [
  {
    key: "totalMilitia" as const,
    label: "Tổng quân số",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "totalSquads" as const,
    label: "Số tiểu đội",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "newRecruits" as const,
    label: "Tân binh năm nay",
    icon: UserPlus,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    key: "totalLeaders" as const,
    label: "Tiểu đội trưởng",
    icon: Star,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <p className="text-3xl font-bold">{stats[card.key]}</p>
            ) : (
              <Skeleton className="h-9 w-20" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
