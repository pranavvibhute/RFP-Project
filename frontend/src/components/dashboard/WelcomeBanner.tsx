import Button from "@/components/ui/Button";

export default function WelcomeBanner() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white border p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back 👋
        </h2>

        <p className="mt-2 text-gray-500">
          Manage, analyze and monitor your RFPs from one place.
        </p>
      </div>

      <Button>
        Upload RFP
      </Button>
    </div>
  );
}