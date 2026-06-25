import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import KPICard from "../../components/KPICard";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">
            Dashboard
          </h1>

          <div className="grid grid-cols-3 gap-6">
            <KPICard title="Total RFPs" value={0} />
            <KPICard title="Pending" value={0} />
            <KPICard title="Analyzed" value={0} />
          </div>
        </main>
      </div>
    </div>
  );
}