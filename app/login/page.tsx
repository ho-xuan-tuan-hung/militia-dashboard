"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Sai tên đăng nhập hoặc mật khẩu");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-primary-foreground">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20">
            <Shield className="h-14 w-14" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              DQTV Tây Lộc
            </h1>
            <p className="mt-2 text-base opacity-75">
              Dân quân tự vệ phường Tây Lộc
            </p>
          </div>
          <ul className="mt-2 space-y-3 text-left">
            {[
              "Quản lý danh sách quân nhân",
              "Điểm danh nhiệm vụ & chấm công",
              "Import/Export danh sách Excel",
              "Thống kê trình độ văn hóa",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm opacity-80">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-sm text-muted-foreground">
              Nhập thông tin đăng nhập để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="admin"
                  autoComplete="username"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
