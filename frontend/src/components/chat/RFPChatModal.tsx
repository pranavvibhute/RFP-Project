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
  Database
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get<RFP[]>(`${API_BASE_URL}/api/v1/rfps`)
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

  const handleSend = async (customText?: string) => {
    const textToSend = customText || question;
    if (!textToSend.trim() || !selectedRfpId || loading) return;

    const userMsg: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/rfps/${selectedRfpId}/chat`, {
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

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#c8102e] hover:bg-[#a00c24] text-white px-5 py-3.5 rounded-full shadow-xl shadow-red-900/30 font-bold text-xs transition duration-200 hover:scale-105"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Ask RFP Assistant</span>
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
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 text-[#c8102e]" />
              <span>RFP:</span>
            </div>
            <select
              value={selectedRfpId || ""}
              onChange={(e) => setSelectedRfpId(Number(e.target.value))}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#c8102e]"
            >
              {rfps.map((rfp) => (
                <option key={rfp.id} value={rfp.id}>
                  {rfp.title}
                </option>
              ))}
            </select>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-[#c8102e] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#111625] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-none"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Sources List */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Retrieved Vector Sources:</span>
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 font-mono text-slate-600 truncate">
                          [Chunk {src.chunk_index} | Relevancy {src.score}%]: "{src.text.slice(0, 70)}..."
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
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
