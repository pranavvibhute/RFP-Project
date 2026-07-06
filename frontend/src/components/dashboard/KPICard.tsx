import { Card } from "@/components/ui";

interface KPICardProps {
  title: string;
  value: number;
}

export default function KPICard({
  title,
  value,
}: KPICardProps) {
  return (
    <Card>
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-4xl font-bold">
        {value}
      </h2>
    </Card>
  );
}