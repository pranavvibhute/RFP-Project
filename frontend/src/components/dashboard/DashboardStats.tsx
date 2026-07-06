import KPICard from "./KPICard";

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-4 gap-6">

      <KPICard
        title="Total RFPs"
        value={0}
      />

      <KPICard
        title="Pending"
        value={0}
      />

      <KPICard
        title="Analyzed"
        value={0}
      />

      <KPICard
        title="High Risk"
        value={0}
      />

    </div>
  );
}