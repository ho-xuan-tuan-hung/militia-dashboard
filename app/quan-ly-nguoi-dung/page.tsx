import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PageTransition } from "@/components/dashboard/page-transition";
import { UserBoard } from "@/components/users/user-board";
import { Users } from "lucide-react";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 px-4 py-6 md:px-8">
        <PageTransition>
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Quản lý người dùng</h1>
                <p className="text-sm text-muted-foreground">
                  Tạo và quản lý tài khoản cho tiểu đội trưởng
                </p>
              </div>
            </div>
            <UserBoard />
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
