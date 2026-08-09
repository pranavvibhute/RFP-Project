import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RFPChatModal from "../chat/RFPChatModal";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="h-screen overflow-hidden bg-[#f4f5f8] flex font-sans relative">
      {/* Sticky sidebar — does not scroll with page content */}
      <div className="sticky top-0 h-screen overflow-y-auto shrink-0">
        <Sidebar />
      </div>

      {/* Scrollable main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating RAG AI Assistant Chat Modal */}
      <RFPChatModal />
    </div>
  );
}