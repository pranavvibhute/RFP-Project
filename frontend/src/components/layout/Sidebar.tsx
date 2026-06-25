import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h2 className="text-xl font-bold mb-6">
        Navigation
      </h2>

      <ul className="space-y-4">
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link href="/upload">Upload RFP</Link>
        </li>

        <li>
          <Link href="/login">Login</Link>
        </li>

        <li>
          <Link href="/register">Register</Link>
        </li>
      </ul>
    </aside>
  );
}