"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "@/components/users/change-password-dialog";
import {
  Shield,
  LogOut,
  Sun,
  Moon,
  ClipboardList,
  LayoutDashboard,
  Users,
  Lock,
  User as UserIcon,
  IdCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/diem-danh", label: "Điểm danh", icon: ClipboardList },
  { href: "/quan-ly-nguoi-dung", label: "Người dùng", icon: Users },
];

const TIEU_DOI_TRUONG_NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/diem-danh", label: "Điểm danh", icon: ClipboardList },
];

const DAN_QUAN_NAV = [
  { href: "/ho-so", label: "Hồ sơ", icon: IdCard },
  { href: "/diem-danh", label: "Nhiệm vụ", icon: ClipboardList },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const role = session?.user?.role;

  const navItems =
    role === "admin"
      ? ADMIN_NAV
      : role === "dan_quan"
        ? DAN_QUAN_NAV
        : TIEU_DOI_TRUONG_NAV;

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

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">
                  {session?.user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {session?.user?.name && (
                <>
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {session.user.name}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setChangePasswordOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Đổi mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </header>
  );
}
