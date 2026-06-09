export const dynamic = "force-dynamic";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AttendanceContent } from "@/components/attendance/attendance-content";

export const metadata = {
  title: "Điểm danh nhiệm vụ | DQTV Tây Lộc",
};

export default function DiemDanhPage() {
  return (
    <>
      <DashboardHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <AttendanceContent />
      </main>
    </>
  );
}
