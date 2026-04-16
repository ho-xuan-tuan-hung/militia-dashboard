import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function Home() {
  return (
    <>
      <DashboardHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <DashboardContent />
      </main>
    </>
  );
}
