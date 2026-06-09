"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Shield,
  LogOut,
  Sun,
  Moon,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/diem-danh", label: "Điểm danh", icon: ClipboardList },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const navItems = isAdmin
    ? [...BASE_NAV, { href: "/quan-ly-nguoi-dung", label: "Người dùng", icon: Users }]
    : BASE_NAV;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-semibold">DQTV Tây Lộc</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Dân quân tự vệ
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {session?.user?.name && (
            <span className="hidden md:block text-xs text-muted-foreground mr-2">
              {session.user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 cursor-pointer"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Chuyển chế độ sáng/tối"
          >
            <Sun className="h-4 w-4 scale-100 transition-transform dark:scale-0" />
            <Moon className="absolute h-4 w-4 scale-0 transition-transform dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
