import DashboardLayout from "@/components/layout/DashboardLayout";
import RFPOverviewSection from "@/components/dashboard/RFPOverviewSection";
import ComplianceSessionsSection from "@/components/dashboard/ComplianceSessionsSection";
import RecentExtractionsSection from "@/components/dashboard/RecentExtractionsSection";
import RevenueBookingsSection from "@/components/dashboard/RevenueBookingsSection";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Section 1: RFPs & Submissions */}
      <RFPOverviewSection />

      {/* Section 2: Sessions */}
      <ComplianceSessionsSection />

      {/* Section 3: Check-ins */}
      <RecentExtractionsSection />

      {/* Section 4: Revenue & Bookings */}
      <RevenueBookingsSection />
    </DashboardLayout>
  );
}