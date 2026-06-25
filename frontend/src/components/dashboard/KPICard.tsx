type Props = {
  title: string;
  value: number;
};

export default function KPICard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="text-gray-500">
        {title}
      </h2>

      <p className="text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}