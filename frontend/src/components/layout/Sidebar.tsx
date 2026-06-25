import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">

      <div className="p-6 text-2xl font-bold">
        Menu
      </div>

      <nav className="px-4">

        <ul className="space-y-2">

          <li>
            <Link
              href="/dashboard"
              className="block rounded-lg px-4 py-3 hover:bg-slate-700"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              href="/upload"
              className="block rounded-lg px-4 py-3 hover:bg-slate-700"
            >
              Upload RFP
            </Link>
          </li>

          <li>
            <Link
              href="/login"
              className="block rounded-lg px-4 py-3 hover:bg-slate-700"
            >
              Login
            </Link>
          </li>

          <li>
            <Link
              href="/register"
              className="block rounded-lg px-4 py-3 hover:bg-slate-700"
            >
              Register
            </Link>
          </li>

        </ul>

      </nav>

    </aside>
  );
}