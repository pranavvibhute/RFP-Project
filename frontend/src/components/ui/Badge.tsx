interface BadgeProps {
  text: string;
  color?: "green" | "yellow" | "red" | "blue";
}

export default function Badge({
  text,
  color = "blue",
}: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${colors[color]}`}
    >
      {text}
    </span>
  );
}