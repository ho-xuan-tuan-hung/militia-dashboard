"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrinhDoStats } from "@/types";

interface TrinhDoChartProps {
  data: TrinhDoStats[] | null;
}

const COLORS = [
  "hsl(210, 80%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 90%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(190, 70%, 50%)",
];

export function TrinhDoChart({ data }: TrinhDoChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">
          Thống kê trình độ văn hóa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu
            </p>
          )
        ) : (
          <Skeleton className="h-[280px] w-full" />
        )}
      </CardContent>
    </Card>
  );
}
