import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
}

export default function Table({
  children,
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-full">
        {children}
      </table>
    </div>
  );
}