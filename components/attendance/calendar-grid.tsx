"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceTask } from "@/types";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const STATUS_CHIP: Record<string, string> = {
  draft: "bg-slate-400 text-white",
  active: "bg-blue-500 text-white",
  completed: "bg-emerald-500 text-white",
};

function getDaysGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Convert to Mon-first: 0=Mon…6=Sun
  let startDow = firstDay.getDay(); // JS: 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDow; i > 0; i--) {
    days.push({ date: new Date(year, month - 1, 1 - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
  }
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: false });
  }

  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface CalendarGridProps {
  year: number;
  month: number;
  tasks: AttendanceTask[];
  canCreate: boolean;
  onTaskClick: (task: AttendanceTask) => void;
  onDayClick: (date: Date) => void;
}

export function CalendarGrid({
  year,
  month,
  tasks,
  canCreate,
  onTaskClick,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date();
  const weeks = getDaysGrid(year, month);

  function getTasksForDay(date: Date) {
    return tasks.filter((t) => isSameDay(new Date(t.ngayThucHien), date));
  }

  return (
    <div className="rounded-xl border overflow-hidden select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-xs font-semibold text-muted-foreground tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map(({ date, isCurrentMonth }, di) => {
            const dayTasks = getTasksForDay(date);
            const isToday = isSameDay(date, today);
            const isWeekend = di >= 5; // T7, CN
            const canAdd = canCreate && isCurrentMonth;

            return (
              <div
                key={di}
                onClick={() => canAdd && onDayClick(date)}
                className={cn(
                  "group relative min-h-[110px] p-1.5",
                  "border-b border-r last:border-r-0",
                  wi === weeks.length - 1 && "border-b-0",
                  !isCurrentMonth && "bg-muted/20",
                  isToday && "bg-primary/5",
                  isWeekend && isCurrentMonth && "bg-slate-50 dark:bg-slate-900/30",
                  canAdd && "cursor-pointer hover:bg-accent/30 transition-colors"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : !isCurrentMonth
                        ? "text-muted-foreground/50"
                        : isWeekend
                        ? "text-slate-500 dark:text-slate-400"
                        : "text-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>

                  {/* Add button on hover */}
                  {canAdd && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(date);
                      }}
                      className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      title="Thêm nhiệm vụ"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task._id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      title={task.tenNhiemVu}
                      className={cn(
                        "w-full text-left rounded px-1.5 py-0.5 truncate text-xs font-medium",
                        "transition-opacity hover:opacity-75 cursor-pointer",
                        STATUS_CHIP[task.trangThai] ?? "bg-slate-400 text-white"
                      )}
                    >
                      {/* Desktop: text, Mobile: dot only */}
                      <span className="hidden sm:inline">{task.tenNhiemVu}</span>
                      <span className="sm:hidden">●</span>
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p
                      className="text-xs text-muted-foreground px-1 cursor-pointer hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(dayTasks[3]);
                      }}
                    >
                      +{dayTasks.length - 3} nhiệm vụ
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
