interface EmptyStateProps {
  message: string;
}

export default function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
      {message}
    </div>
  );
}