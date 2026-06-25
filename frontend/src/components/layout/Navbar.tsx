export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold text-slate-800">
        RFP Analyzer
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          Platform Lead
        </span>

        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          T
        </div>
      </div>
    </header>
  );
}