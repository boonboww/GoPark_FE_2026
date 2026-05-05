"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "parking-list";
  data?: any;
};
type Status = "unknown" | "connected" | "disconnected";
import { useAuthStore } from "@/stores/auth.store";

const API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API ||
  "http://localhost:8000/api/v1/chatbot/chat";
const STATUS_URL =
  process.env.NEXT_PUBLIC_CHATBOT_STATUS ||
  "http://localhost:8000/api/v1/chatbot/status";

const QUICK_CHIPS = [
  "Tìm bãi đỗ giá rẻ",
  "Tìm bãi đỗ ở Hải Châu",
  "Tìm bãi đỗ gần nhất",
  "Cách thanh toán",
  "Xem lịch sử đặt",
  "Số dư ví",
  "Liên hệ hỗ trợ",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý GoPark.\n\nTôi có thể giúp bạn:\n🔹 Tìm bãi đỗ giá rẻ, gần nhất\n🔹 Lọc bãi theo khu vực (Hải Châu, Thanh Khê...)\n🔹 Đặt chỗ và thanh toán\n\nBạn cần hỗ trợ gì hôm nay?",
};

// ========== MODAL COMPONENT ==========
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// ========== BOOKING FORM COMPONENT ==========
interface BookingFormData {
  parkingLotId: string;
  startTime: string;
  endTime: string;
  vehicleId: string;
  paymentMethod: string;
}

interface BookingFormProps {
  parkingLot: {
    id: string;
    name: string;
    address: string;
    hourlyRate: number;
  };
  vehicles: Array<{ id: string; plate: string; type: string }>;
  walletBalance: number;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("gopark_chat_history")
          : null;
      return raw ? JSON.parse(raw) : [WELCOME_MSG];
    } catch {
      return [WELCOME_MSG];
    }
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [hasUnread, setHasUnread] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickChipsRef = useRef<HTMLDivElement>(null);
  const suggestionChipsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gopark_chat_history", JSON.stringify(messages));
    }
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    if (!open && messages[messages.length - 1]?.role === "assistant") {
      setHasUnread(true);
    }
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  // Speech recognition
  useEffect(() => {
    const win: any = typeof window !== "undefined" ? window : {};
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition || null;
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (ev: any) => {
      const t = Array.from(ev.results)
        .map((x: any) => x[0].transcript)
        .join("");
      setInput(t);
    };
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
  }, []);
  useEffect(() => {
    if (open) {
      fetch("http://localhost:8000/api/v1/chatbot/suggestions")
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions) setDynamicSuggestions(data.suggestions);
        })
        .catch(console.error);
    }
  }, [open]);

  // Status check
  const checkStatus = useCallback(async () => {
    const token = accessToken;
    if (!token) {
      setStatus("unknown");
      return;
    }
    try {
      const res = await fetch(STATUS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(
        data?.running || data?.models?.groq?.ok ? "connected" : "disconnected",
      );
    } catch {
      setStatus("disconnected");
    }
  }, [accessToken]);

  useEffect(() => {
    checkStatus();
    statusTimerRef.current = setInterval(checkStatus, 10 * 60 * 1000);
    return () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  }, [checkStatus]);

  // Send message
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setInput("");
    setLoading(true);

    try {
      const token = accessToken;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const userMessagesOnly = messagesRef.current.filter(
        (m) => m.role === "user",
      );

      const bookingContext =
        typeof window !== "undefined"
          ? (window as any).goparkBookingContext ?? null
          : null;

      const bodyPayload: any = { messages: userMessagesOnly };
      if (bookingContext) {
        bodyPayload.context = { pendingBooking: bookingContext };
      }

      const resp = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const response = await resp.json();

      // ========== XỬ LÝ CÁC ACTION ==========
      // 1. List parking (bảng)
      if (response?.data?.action === "list_parking" && response?.data?.lots) {
        const assistantMsg: Message = {
          role: "assistant",
          type: "parking-list",
          content: `📍 Tìm thấy ${response.data.lots.length} bãi đỗ. Vui lòng chọn bãi bên dưới để đặt chỗ.`,
          data: { lots: response.data.lots },
        };
        setMessages([...messagesRef.current, assistantMsg]);
        messagesRef.current = [...messagesRef.current, assistantMsg];
        setLoading(false);
        return;
      }

      // 3. Redirect (từ tool book_parking của AI)
      if (response?.action === "redirect" && response?.redirectUrl) {
        const redirectMsg: Message = {
          role: "assistant",
          content: response.message || "🔄 Đang chuyển sang trang đặt chỗ...",
        };
        setMessages([...messagesRef.current, redirectMsg]);
        messagesRef.current = [...messagesRef.current, redirectMsg];
        setTimeout(() => {
          window.location.href = response.redirectUrl;
        }, 1500);
        setLoading(false);
        return;
      }

      // 4. Redirect cũ (từ endpoint /book)
      if (response?.data?.action === "redirect" && response?.data?.data?.url) {
        const redirectMsg: Message = {
          role: "assistant",
          content: response.data.text || "🔄 Đang chuyển hướng...",
        };
        setMessages([...messagesRef.current, redirectMsg]);
        messagesRef.current = [...messagesRef.current, redirectMsg];
        setTimeout(() => {
          window.location.href = response.data.data.url;
        }, 1500);
        setLoading(false);
        return;
      }

      // 5. Text thông thường
      const assistantText =
        response?.data?.text ||
        response?.text ||
        response?.message ||
        "Không có phản hồi";
      const assistantMsg: Message = {
        role: "assistant",
        content: assistantText,
      };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
      setSuggestions([]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        role: "assistant",
        content: "❌ Lỗi kết nối. Vui lòng thử lại.",
      };
      setMessages([...messagesRef.current, errorMsg]);
      messagesRef.current = [...messagesRef.current, errorMsg];
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([WELCOME_MSG]);
    setSuggestions([]);
    if (typeof window !== "undefined")
      localStorage.removeItem("gopark_chat_history");
  }

  function toggleListen() {
    const r = recognitionRef.current;
    if (!r) return;
    listening ? r.stop() : r.start();
  }

  function handleViewDetail(lot: any) {
    window.location.href = `/users/detailParking/${lot.id}`;
  }

  const statusDot: Record<Status, string> = {
    connected: "#22c55e",
    disconnected: "#ef4444",
    unknown: "#f59e0b",
  };
  const statusLabel: Record<Status, string> = {
    connected: "Đã kết nối",
    disconnected: "Mất kết nối",
    unknown: "Đang kiểm tra",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .gp * { box-sizing: border-box; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .gp-panel {
          position: fixed; right: 24px; bottom: 24px; width: 420px; height: min(600px, calc(100dvh - 48px));
          background: #070f1c; border-radius: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.13);
          display: flex; flex-direction: column; overflow: hidden; z-index: 100010; animation: fadeIn 0.22s ease;
        }
        @media(max-width:480px){ .gp-panel{ right:0; left:0; bottom:0; width:100%; height:72dvh; border-radius:18px 18px 0 0; } }
        .gp-hdr { padding: 12px 14px; background: linear-gradient(160deg,#022c1a 0%,#053d28 100%); border-bottom: 1px solid rgba(34,197,94,0.14); flex-shrink: 0; }
        .gp-hdr-row { display:flex; align-items:center; justify-content:space-between; }
        .gp-brand { display:flex; align-items:center; gap:9px; }
        .gp-av { width:34px; height:34px; border-radius:10px; background: linear-gradient(135deg,#15803d,#22c55e); display:flex; align-items:center; justify-content:center; }
        .gp-bname { font-size:14px; font-weight:700; color:#f0fdf4; }
        .gp-bsub { font-size:11px; color:#86efac; margin-top:1px; }
        .gp-pill { display:flex; align-items:center; gap:5px; background:rgba(0,0,0,.3); border-radius:999px; padding:3px 8px; font-size:11px; color:#bbf7d0; border:1px solid rgba(34,197,94,.16); }
        .gp-dot-s { width:6px; height:6px; border-radius:50%; }
        .gp-ibtn { background:rgba(255,255,255,.06); border:none; width:28px; height:28px; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#86efac; }
        .gp-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
        .gp-msgs::-webkit-scrollbar { width:4px; }
        .gp-msgs::-webkit-scrollbar-thumb { background:rgba(34,197,94,.3); border-radius:4px; }
        .gp-row { display:flex; gap:8px; align-items:flex-start; }
        .gp-row.u { flex-direction:row-reverse; }
        .gp-mav { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#15803d,#22c55e); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .gp-bub { max-width:80%; padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.5; word-break:break-word; white-space:pre-wrap; }
        .gp-bub.b { background:rgba(255,255,255,.05); color:#dff5ea; border-bottom-left-radius:4px; border:1px solid rgba(34,197,94,.1); }
        .gp-bub.u { background:linear-gradient(135deg,#15803d,#22c55e); color:#fff; border-bottom-right-radius:4px; }
        .gp-tdots { display:flex; gap:4px; padding:6px 2px; }
        .gp-td { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:gpBounce 1.2s infinite; }
        .gp-td:nth-child(2){ animation-delay:.22s; }
        .gp-td:nth-child(3){ animation-delay:.44s; }
        @keyframes gpBounce { 0%,60%,100%{ transform:translateY(0); opacity:.35; } 30%{ transform:translateY(-5px); opacity:1; } }
        .gp-chips-wrap { flex-shrink:0; padding:6px 12px; border-top:1px solid rgba(34,197,94,.08); }
        .gp-clabel { font-size:10px; color:#3a6b4a; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .gp-chips { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width: thin; }
        .gp-chip { flex-shrink:0; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); color:#86efac; padding:5px 12px; border-radius:20px; font-size:12px; cursor:pointer; white-space:nowrap; }
        .gp-chip:hover { background:rgba(34,197,94,.15); border-color:rgba(34,197,94,.4); }
        .gp-parking-list { margin: 8px 0; background: rgba(255,255,255,0.03); border-radius: 12px; overflow-x: auto; }
        .gp-parking-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .gp-parking-table th, .gp-parking-table td { padding: 8px 6px; text-align: left; border-bottom: 1px solid rgba(34,197,94,0.1); }
        .gp-parking-table th { background: rgba(34,197,94,0.1); color: #86efac; font-weight: 600; }
        .gp-btn-detail, .gp-btn-book { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #bbf7d0; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-right: 4px; font-size: 10px; }
        .gp-inp-area { flex-shrink:0; padding: 8px 12px 12px; border-top:1px solid rgba(34,197,94,.08); }
        .gp-inp-box { display:flex; gap:8px; align-items:flex-end; background:rgba(255,255,255,.04); border:1px solid rgba(34,197,94,.15); border-radius:16px; padding:6px 8px 6px 14px; }
        .gp-ta { flex:1; background:transparent; border:none; outline:none; color:#e2f5ea; font-size:14px; resize:none; max-height:90px; line-height:1.4; }
        .gp-ta::placeholder{ color:#3a5c47; }
        .gp-mic { background:transparent; border:none; cursor:pointer; padding:4px; color:#3a6b4a; }
        .gp-mic.on { color:#ef4444; animation:gpPulse 1s infinite; }
        @keyframes gpPulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .gp-send { background:linear-gradient(135deg,#16a34a,#22c55e); border:none; width:34px; height:34px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .gp-send:disabled { opacity:0.4; cursor:not-allowed; }
        .gp-hint { font-size:9px; color:#243d2c; text-align:center; margin-top:6px; }
        .gp-fab { position:fixed; right:24px; bottom:24px; z-index:100011; width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#16a34a,#22c55e); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 20px rgba(34,197,94,.4); transition:all 0.2s; }
        .gp-fab:hover { transform:scale(1.08); }
        .gp-fab.hidden { opacity:0; visibility:hidden; transform:scale(0.8); pointer-events:none; }
        .gp-badge { position:absolute; top:-3px; right:-3px; width:16px; height:16px; border-radius:50%; background:#ef4444; border:2px solid #070f1c; font-size:9px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
        @media(max-width:480px){ .gp-fab{ right:16px; bottom:16px; } }
      `}</style>

      <div className="gp">
        {open && (
          <div className="gp-panel">
            <div className="gp-hdr">
              <div className="gp-hdr-row">
                <div className="gp-brand">
                  <div className="gp-av">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle
                        cx="12"
                        cy="16"
                        r="1.5"
                        fill="#fff"
                        stroke="none"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="gp-bname">GoPark Assistant</div>
                    <div className="gp-bsub">Hỗ trợ đặt bãi đỗ xe 24/7</div>
                  </div>
                </div>
                <div className="gp-acts">
                  <div className="gp-pill">
                    <div
                      className="gp-dot-s"
                      style={{ background: statusDot[status] }}
                    />
                    {statusLabel[status]}
                  </div>
                  <button
                    className="gp-ibtn"
                    onClick={clearHistory}
                    title="Xóa lịch sử"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                  <button
                    className="gp-ibtn"
                    onClick={() => setOpen(false)}
                    title="Đóng"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="gp-msgs">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`gp-row${m.role === "user" ? " u" : ""}`}
                >
                  {m.role === "assistant" && (
                    <div className="gp-mav">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )}

                  <div className={`gp-bub${m.role === "user" ? " u" : " b"}`}>
                    {m.type === "parking-list" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>{m.content}</div>
                        <div className="gp-parking-list">
                          <table className="gp-parking-table">
                            <thead>
                              <tr>
                                <th>Tên bãi</th>
                                <th>Địa chỉ</th>
                                <th>💰/h</th>
                                <th>🅿️</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.data?.lots?.map((lot: any) => (
                                <tr key={lot.id}>
                                  <td style={{ fontWeight: 500 }}>{lot.name}</td>
                                  <td
                                    style={{
                                      maxWidth: 120,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {lot.address}
                                  </td>
                                  <td>
                                    {(lot.hourly_rate || 20000).toLocaleString(
                                      "vi-VN",
                                    )}
                                    đ
                                  </td>
                                  <td>
                                    {lot.available_slots !== undefined
                                      ? `${lot.available_slots}/${lot.total_slots || "?"}`
                                      : "✅ Còn chỗ"}
                                  </td>
                                  <td>
                                    <button
                                      className="gp-btn-detail"
                                      onClick={() =>
                                        (window.location.href = `/users/detailParking/${lot.id}`)
                                      }
                                    >
                                      Chi tiết
                                    </button>
                                    <button
                                      className="gp-btn-book"
                                      onClick={() =>
                                        (window.location.href = `/users/myBooking/${lot.id}`)
                                      }
                                    >
                                      Đặt
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="gp-row">
                  <div className="gp-mav">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div className="gp-bub b">
                    <div className="gp-tdots">
                      <div className="gp-td" />
                      <div className="gp-td" />
                      <div className="gp-td" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}

            {/* Quick chips */}
            <div className="gp-chips-wrap">
              <div className="gp-clabel">💡 GỢI Ý NHANH</div>
              <div className="gp-chips" ref={quickChipsRef}>
                {(dynamicSuggestions.length > 0
                  ? dynamicSuggestions
                  : [
                      "Tìm bãi gần tôi",
                      "Bãi giá rẻ nhất",
                      "Bãi phù hợp nhất với tôi",
                      "Đặt bãi",
                      "Lịch sử đặt",
                      "Số dư ví",
                      "Hướng dẫn thanh toán",
                      "Liên hệ hỗ trợ",
                    ]
                ).map((label) => (
                  <button
                    key={label}
                    className="gp-chip"
                    onClick={() => sendMessage(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="gp-inp-area">
              <div className={`gp-inp-box${inputFocused ? " f" : ""}`}>
                <textarea
                  ref={inputRef}
                  className="gp-ta"
                  rows={1}
                  value={input}
                  placeholder="Nhập câu hỏi của bạn..."
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  className={`gp-mic${listening ? " on" : ""}`}
                  onClick={toggleListen}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
                <button
                  className="gp-send"
                  disabled={loading || !input.trim()}
                  onClick={() => sendMessage()}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.3"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="gp-hint">Enter gửi · Shift+Enter xuống dòng</div>
            </div>
          </div>
        )}

        <button
          className={`gp-fab${open ? " hidden" : ""}`}
          onClick={() => setOpen(true)}
        >
          {hasUnread && <span className="gp-badge">!</span>}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </>
  );
}
