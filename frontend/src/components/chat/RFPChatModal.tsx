"use client";

import { useEffect, useState, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  Loader2, 
  FileText,
  Database,
  ChevronDown,
  Search,
  Check
} from "lucide-react";
import { api, getActiveToken } from "@/lib/api";

interface RFP {
  id: number;
  title: string;
  customer_name: string;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  sources?: Array<{ chunk_index: number; score: number; text: string }>;
}

export default function RFPChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I'm your BidWise AI assistant. Select an RFP document above and ask me any question about SLAs, requirements, deadlines, or risks.",
    },
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getActiveToken()) return;

    api
      .get<RFP[]>("/api/v1/rfps")
      .then((res) => {
        setRfps(res.data);
        if (res.data.length > 0) {
          setSelectedRfpId(res.data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load RFPs for chat:", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRfps = rfps.filter(rfp =>
    rfp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfp.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (customText?: string) => {
    const textToSend = customText || question;
    if (!textToSend.trim() || !selectedRfpId || loading) return;

    const userMsg: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post(`/api/v1/rfps/${selectedRfpId}/chat`, {
        question: textToSend,
      });

      const aiMsg: Message = {
        sender: "ai",
        text: res.data.answer || "No response generated.",
        sources: res.data.sources || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an issue querying the vector index. Ensure the FastAPI backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (qText: string) => {
    handleSend(qText);
  };

  const selectedRfp = rfps.find(r => r.id === selectedRfpId);

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ask RFP Assistant"
          title="Ask RFP Assistant"
          className="fixed bottom-6 right-6 z-50 w-11 h-11 flex items-center justify-center bg-[#c8102e] hover:bg-[#a00c24] text-white rounded-full shadow-lg shadow-red-900/25 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
        </button>
      )}

      {/* Slide-over Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[580px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#111625] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#c8102e] flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">BidWise RAG Assistant</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <Database className="w-3 h-3" />
                  <span>Qdrant Vector RAG Enabled</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* RFP Selector Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-[#c8102e]" />
                <span>RFP Document</span>
              </div>
              {selectedRfp && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 font-medium">
                  Vector indexed
                </span>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-left focus:outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex flex-col">
                      {selectedRfp ? (
                        <>
                          <span className="text-sm font-semibold text-slate-800 truncate block">{selectedRfp.title}</span>
                          <span className="text-[11px] text-slate-500 truncate block">{selectedRfp.customer_name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">Select an RFP document...</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition ${isDropdownOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search RFPs..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c8102e]"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredRfps.length === 0 ? (
                      <div className="px-3 py-4 text-center text-slate-400 text-xs">
                        {rfps.length === 0 ? "No RFP documents available" : "No matching RFPs found"}
                      </div>
                    ) : (
                      <div>
                        {filteredRfps.map((rfp) => (
                          <button
                            key={rfp.id}
                            onClick={() => {
                              setSelectedRfpId(rfp.id);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                              selectedRfpId === rfp.id
                                ? "bg-[#c8102e] text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedRfpId === rfp.id ? "bg-white/20" : "bg-slate-100"
                            }`}>
                              <FileText className={`w-4 h-4 ${
                                selectedRfpId === rfp.id ? "text-white" : "text-[#c8102e]"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className={`text-sm font-medium truncate ${
                                selectedRfpId === rfp.id ? "text-white" : "text-slate-800"
                              }`}>
                                {rfp.title}
                              </span>
                              <span className={`text-[11px] truncate ${
                                selectedRfpId === rfp.id ? "text-white/80" : "text-slate-500"
                              }`}>
                                {rfp.customer_name}
                              </span>
                            </div>
                            {selectedRfpId === rfp.id && (
                              <Check className="w-4 h-4 text-white shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-[#c8102e] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#111625] text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Sources
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-slate-50 border border-slate-200/60 rounded p-1.5 text-[10px] text-slate-600 font-mono"
                        >
                          Chunk #{src.chunk_index} (Score: {(src.score * 100).toFixed(0)}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    KR
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium p-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
                <span>Searching Qdrant vectors & generating response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            {[
              "Submission deadline?",
              "Security compliance?",
              "Overall risk assessment?",
            ].map((qText, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(qText)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-[#c8102e] text-slate-600 rounded-lg text-[10px] font-bold whitespace-nowrap transition"
              >
                {qText}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question about this RFP..."
              className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#c8102e]"
            />
            <button
              onClick={() => handleSend()}
              disabled={!question.trim() || loading}
              className={`p-2.5 rounded-xl text-white font-bold transition ${
                !question.trim() || loading ? "bg-slate-300 cursor-not-allowed" : "bg-[#c8102e] hover:bg-[#a00c24]"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}