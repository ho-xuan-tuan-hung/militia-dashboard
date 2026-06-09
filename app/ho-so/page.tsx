export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyMilitiaProfile } from "@/actions/profile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MyProfileCard } from "@/components/profile/my-profile-card";

export default async function HoSoPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "dan_quan") {
    redirect("/");
  }

  const profile = await getMyMilitiaProfile();

  if (!profile) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            Không tìm thấy thông tin hồ sơ. Vui lòng liên hệ quản trị viên.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <h2 className="mb-6 text-xl font-bold">Hồ sơ của tôi</h2>
        <MyProfileCard profile={profile} userName={session.user.email ?? ""} />
      </main>
    </>
  );
}
