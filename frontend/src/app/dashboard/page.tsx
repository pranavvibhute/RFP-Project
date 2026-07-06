import DashboardLayout from "@/components/layout/DashboardLayout";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentRFPTable from "@/components/dashboard/RecentRFPTable";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <WelcomeBanner />

      <div className="mt-8">
        <DashboardStats />
      </div>

      <RecentRFPTable />
    </DashboardLayout>
  );
}