"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Shield, Check, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getMilitiaForPicker } from "@/actions/militia";
import type { PickerMilitia } from "@/types";

interface MilitiaPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  leaderTieuDoi?: number;
}

export function MilitiaPicker({ selectedIds, onChange, leaderTieuDoi }: MilitiaPickerProps) {
  const [militia, setMilitia] = useState<PickerMilitia[]>([]);
  const [search, setSearch] = useState("");
  const [squadFilter, setSquadFilter] = useState<number | null>(leaderTieuDoi ?? null);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    getMilitiaForPicker()
      .then(setMilitia)
      .catch(() => setMilitia([]))
      .finally(() => setLoadingList(false));
  }, []);

  const squads = useMemo(() => {
    const s = [...new Set(militia.map((m) => m.tieuDoi).filter(Boolean))].sort();
    return s as number[];
  }, [militia]);

  const filtered = useMemo(() => {
    return militia.filter((m) => {
      if (squadFilter !== null && m.tieuDoi !== squadFilter) return false;
      if (search && !m.hoTen.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [militia, search, squadFilter]);

  const selectedSet = new Set(selectedIds);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectAllFiltered() {
    const filteredIds = filtered.map((m) => m._id);
    onChange([...new Set([...selectedIds, ...filteredIds])]);
  }

  function deselectAllFiltered() {
    const filteredIds = new Set(filtered.map((m) => m._id));
    onChange(selectedIds.filter((id) => !filteredIds.has(id)));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>Quân nhân tham gia</span>
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground font-bold">
              {selectedIds.length}
            </span>
          )}
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="hover:text-foreground cursor-pointer underline-offset-2 hover:underline"
          >
            Chọn tất cả
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={deselectAllFiltered}
            className="hover:text-foreground cursor-pointer underline-offset-2 hover:underline"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo họ tên..."
          className="pl-8 h-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Squad filter pills — only admin (no leaderTieuDoi restriction) */}
      {!leaderTieuDoi && squads.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSquadFilter(null)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer",
              squadFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent"
            )}
          >
            Tất cả
          </button>
          {squads.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSquadFilter(s === squadFilter ? null : s)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer",
                squadFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent"
              )}
            >
              <Shield className="h-3 w-3" />
              TĐ {s}
            </button>
          ))}
        </div>
      )}

      {/* Militia list */}
      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
        {loadingList ? (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            Không tìm thấy kết quả
          </div>
        ) : (
          filtered.map((m) => {
            const isSelected = selectedSet.has(m._id);
            const isLeader = m.chucVu === "Tiểu đội trưởng";
            return (
              <button
                key={m._id}
                type="button"
                onClick={() => toggle(m._id)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer text-left",
                  isSelected && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-input bg-background"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="flex-1 font-medium leading-none">{m.hoTen}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.tieuDoi != null && (
                    <span className="text-xs text-muted-foreground">TĐ {m.tieuDoi}</span>
                  )}
                  {m.chucVu && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-medium",
                        isLeader
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      {isLeader ? "TĐT" : "CS"}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} quân nhân · {selectedIds.length} đã chọn
        {selectedIds.length === 0 && (
          <span className="text-amber-600"> · (Chưa chọn = tất cả thành viên tham gia)</span>
        )}
      </p>
    </div>
  );
}
