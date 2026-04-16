"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              Quản lý DQTV
            </h1>
            <p className="text-xs text-muted-foreground">
              Dân quân tự vệ
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
