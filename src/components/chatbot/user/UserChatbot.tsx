"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "parking-list";
  data?: any;
};
type Status = "unknown" | "connected" | "disconnected";

const API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API ||
  "http://localhost:8000/api/v1/chatbot/chat";
const STATUS_URL =
  process.env.NEXT_PUBLIC_CHATBOT_STATUS ||
  "http://localhost:8000/api/v1/chatbot/status";

const QUICK_CHIPS = [
  "🔍 Tìm bãi gần tôi",
  "💰 Bãi giá rẻ nhất",
  "⭐ Bãi phù hợp nhất",
  "📅 Đặt bãi",
  "📋 Lịch sử đặt của tôi",
  "💳 Số dư ví GoPark",
  "🚗 Xe đã đăng ký",
  "❓ Hướng dẫn thanh toán",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý GoPark dành cho bạn.\n\nTôi có thể giúp:\n🔹 Tìm và đặt bãi đỗ xe\n🔹 Xem lịch sử đặt chỗ\n🔹 Kiểm tra số dư ví\n🔹 Xem danh sách xe đã đăng ký\n\nBạn cần gì hôm nay?",
};

export default function UserChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { accessToken, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("gopark_user_chat") : null;
      return raw ? JSON.parse(raw) : [WELCOME_MSG];
    } catch { return [WELCOME_MSG]; }
  });
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [hasUnread, setHasUnread] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("gopark_user_chat", JSON.stringify(messages));
    window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    if (!open && messages[messages.length - 1]?.role === "assistant") setHasUnread(true);
  }, [messages]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { if (open) setHasUnread(false); }, [open]);

  useEffect(() => {
    const win: any = typeof window !== "undefined" ? window : {};
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition || null;
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN"; r.interimResults = true; r.continuous = false;
    r.onresult = (ev: any) => setInput(Array.from(ev.results).map((x: any) => x[0].transcript).join(""));
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/chatbot/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data?.data?.running || data?.data?.models?.groq?.ok ? "connected" : "disconnected");
    } catch { setStatus("disconnected"); }
  }, []);

  useEffect(() => {
    checkStatus();
    const t = setInterval(checkStatus, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [checkStatus]);

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
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const resp = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesRef.current.filter(m => m.role === "user") }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const response = await resp.json();

      if (response?.data?.action === "list_parking" && response?.data?.lots) {
        const msg: Message = { role: "assistant", type: "parking-list", content: response?.text || "Tìm thấy các bãi sau:", data: { lots: response.data.lots } };
        setMessages([...messagesRef.current, msg]);
        messagesRef.current = [...messagesRef.current, msg];
        setLoading(false); return;
      }
      if (response?.action === "redirect" && response?.redirectUrl) {
        const msg: Message = { role: "assistant", content: response.message || "🔄 Đang chuyển sang trang đặt chỗ..." };
        setMessages([...messagesRef.current, msg]);
        messagesRef.current = [...messagesRef.current, msg];
        setTimeout(() => { window.location.href = response.redirectUrl; }, 1500);
        setLoading(false); return;
      }
      const text2 = response?.data?.text || response?.text || response?.message || "Không có phản hồi";
      const assistantMsg: Message = { role: "assistant", content: text2 };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
    } catch {
      const errMsg: Message = { role: "assistant", content: "❌ Lỗi kết nối. Vui lòng thử lại." };
      setMessages([...messagesRef.current, errMsg]);
      messagesRef.current = [...messagesRef.current, errMsg];
    } finally { setLoading(false); }
  }

  function clearHistory() {
    setMessages([WELCOME_MSG]);
    if (typeof window !== "undefined") localStorage.removeItem("gopark_user_chat");
  }

  function removeMessage(index: number) {
    setMessages(prev => { const u = prev.filter((_, i) => i !== index); messagesRef.current = u; return u; });
  }

  const statusDot: Record<Status, string> = { connected: "#22c55e", disconnected: "#ef4444", unknown: "#f59e0b" };
  const statusLabel: Record<Status, string> = { connected: "Đã kết nối", disconnected: "Mất kết nối", unknown: "Đang kiểm tra" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .uc * { box-sizing: border-box; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes ucFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .uc-panel {
          position: fixed; right: 24px; bottom: 24px; width: 420px; height: min(600px, calc(100dvh - 48px));
          background: #070f1c; border-radius: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.13);
          display: flex; flex-direction: column; overflow: hidden; z-index: 100010; animation: ucFadeIn 0.22s ease;
        }
        @media(max-width:480px){ .uc-panel{ right:0; left:0; bottom:0; width:100%; height:72dvh; border-radius:18px 18px 0 0; } }
        .uc-hdr { padding: 12px 14px; background: linear-gradient(160deg,#022c1a 0%,#053d28 100%); border-bottom: 1px solid rgba(34,197,94,0.14); flex-shrink: 0; }
        .uc-hdr-row { display:flex; align-items:center; justify-content:space-between; }
        .uc-brand { display:flex; align-items:center; gap:9px; }
        .uc-av { width:34px; height:34px; border-radius:10px; background: linear-gradient(135deg,#15803d,#22c55e); display:flex; align-items:center; justify-content:center; }
        .uc-bname { font-size:14px; font-weight:700; color:#f0fdf4; }
        .uc-bsub { font-size:11px; color:#86efac; margin-top:1px; }
        .uc-role-badge { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#86efac; font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; letter-spacing:.5px; }
        .uc-pill { display:flex; align-items:center; gap:5px; background:rgba(0,0,0,.3); border-radius:999px; padding:3px 8px; font-size:11px; color:#bbf7d0; border:1px solid rgba(34,197,94,.16); }
        .uc-dot { width:6px; height:6px; border-radius:50%; }
        .uc-acts { display:flex; align-items:center; gap:6px; }
        .uc-ibtn { background:rgba(255,255,255,.06); border:none; width:28px; height:28px; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#86efac; }
        .uc-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
        .uc-msgs::-webkit-scrollbar { width:4px; }
        .uc-msgs::-webkit-scrollbar-thumb { background:rgba(34,197,94,.3); border-radius:4px; }
        .uc-row { display:flex; gap:8px; align-items:flex-start; }
        .uc-row.u { flex-direction:row-reverse; }
        .uc-mav { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#15803d,#22c55e); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .uc-bub { max-width:80%; padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.5; word-break:break-word; white-space:pre-wrap; }
        .uc-bub.b { background:rgba(255,255,255,.05); color:#dff5ea; border-bottom-left-radius:4px; border:1px solid rgba(34,197,94,.1); }
        .uc-bub.u { background:linear-gradient(135deg,#15803d,#22c55e); color:#fff; border-bottom-right-radius:4px; }
        .uc-tdots { display:flex; gap:4px; padding:6px 2px; }
        .uc-td { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:ucBounce 1.2s infinite; }
        .uc-td:nth-child(2){ animation-delay:.22s; } .uc-td:nth-child(3){ animation-delay:.44s; }
        @keyframes ucBounce { 0%,60%,100%{ transform:translateY(0); opacity:.35; } 30%{ transform:translateY(-5px); opacity:1; } }
        .uc-chips-wrap { flex-shrink:0; padding:6px 12px; border-top:1px solid rgba(34,197,94,.08); }
        .uc-clabel { font-size:10px; color:#3a6b4a; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .uc-chips { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:thin; }
        .uc-chip { flex-shrink:0; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); color:#86efac; padding:5px 12px; border-radius:20px; font-size:12px; cursor:pointer; white-space:nowrap; }
        .uc-chip:hover { background:rgba(34,197,94,.15); }
        .uc-parking-list { margin:8px 0; background:rgba(255,255,255,0.03); border-radius:12px; overflow-x:auto; padding:12px; }
        .uc-parking-card { background:rgba(16,46,28,0.85); border:1px solid rgba(34,197,94,0.24); border-radius:16px; padding:14px; display:grid; gap:12px; }
        .uc-parking-card-header { font-weight:700; color:#d9ffde; margin-bottom:6px; }
        .uc-parking-card-row { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; }
        .uc-parking-card-meta { color:#c7f9cc; font-size:12px; line-height:1.5; }
        .uc-parking-card-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .uc-parking-card-close { border:none; background:transparent; color:#9ef08d; cursor:pointer; font-size:12px; padding:4px 6px; border-radius:8px; }
        .uc-parking-secondary { margin-top:12px; border-top:1px solid rgba(34,197,94,0.12); padding-top:12px; }
        .uc-parking-secondary-title { font-size:12px; color:#a7f3d0; font-weight:700; margin-bottom:8px; }
        .uc-parking-table { width:100%; border-collapse:collapse; font-size:11px; }
        .uc-parking-table th, .uc-parking-table td { padding:8px 6px; text-align:left; border-bottom:1px solid rgba(34,197,94,0.1); }
        .uc-parking-table th { background:rgba(34,197,94,0.1); color:#86efac; font-weight:600; }
        .uc-btn-detail, .uc-btn-book { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#bbf7d0; padding:4px 8px; border-radius:6px; cursor:pointer; margin-right:4px; font-size:10px; }
        .uc-inp-area { flex-shrink:0; padding:8px 12px 12px; border-top:1px solid rgba(34,197,94,.08); }
        .uc-inp-box { display:flex; gap:8px; align-items:flex-end; background:rgba(255,255,255,.04); border:1px solid rgba(34,197,94,.15); border-radius:16px; padding:6px 8px 6px 14px; }
        .uc-ta { flex:1; background:transparent; border:none; outline:none; color:#e2f5ea; font-size:14px; resize:none; max-height:90px; line-height:1.4; }
        .uc-ta::placeholder{ color:#3a5c47; }
        .uc-mic { background:transparent; border:none; cursor:pointer; padding:4px; color:#3a6b4a; }
        .uc-mic.on { color:#ef4444; animation:ucPulse 1s infinite; }
        @keyframes ucPulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .uc-send { background:linear-gradient(135deg,#16a34a,#22c55e); border:none; width:34px; height:34px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .uc-send:disabled { opacity:0.4; cursor:not-allowed; }
        .uc-hint { font-size:9px; color:#243d2c; text-align:center; margin-top:6px; }
        .uc-fab { position:fixed; right:24px; bottom:24px; z-index:100011; width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#16a34a,#22c55e); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 20px rgba(34,197,94,.4); transition:all 0.2s; }
        .uc-fab:hover { transform:scale(1.08); }
        .uc-fab.hidden { opacity:0; visibility:hidden; transform:scale(0.8); pointer-events:none; }
        .uc-badge { position:absolute; top:-3px; right:-3px; width:16px; height:16px; border-radius:50%; background:#ef4444; border:2px solid #070f1c; font-size:9px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
      `}</style>

      <div className="uc">
        {open && (
          <div className="uc-panel">
            {/* Header */}
            <div className="uc-hdr">
              <div className="uc-hdr-row">
                <div className="uc-brand">
                  <div className="uc-av">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="uc-bname">GoPark Assistant</div>
                    <div className="uc-bsub">
                      {user?.profile?.name ? `Xin chào, ${user.profile.name}` : "Hỗ trợ người dùng 24/7"}
                    </div>
                  </div>
                </div>
                <div className="uc-acts">
                  <span className="uc-role-badge">👤 USER</span>
                  <div className="uc-pill">
                    <div className="uc-dot" style={{ background: statusDot[status] }} />
                    {statusLabel[status]}
                  </div>
                  <button className="uc-ibtn" onClick={clearHistory} title="Xóa lịch sử">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                  <button className="uc-ibtn" onClick={() => setOpen(false)} title="Đóng">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="uc-msgs">
              {messages.map((m, i) => (
                <div key={i} className={`uc-row${m.role === "user" ? " u" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="uc-mav">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                    </div>
                  )}
                  <div className={`uc-bub${m.role === "user" ? " u" : " b"}`}>
                    {m.type === "parking-list" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>{m.content}</div>
                        {m.data?.lots?.length > 0 && (() => {
                          const primary = m.data.lots[0];
                          const others = m.data.lots.slice(1);
                          return (
                            <div className="uc-parking-list">
                              <div className="uc-parking-card">
                                <div className="uc-parking-card-row" style={{ alignItems: "flex-start" }}>
                                  <div>
                                    <div className="uc-parking-card-header">Bãi phù hợp nhất</div>
                                    <div className="uc-parking-card-meta">Ưu tiên dựa trên giá, chỗ trống và đánh giá.</div>
                                  </div>
                                  <button className="uc-parking-card-close" onClick={() => removeMessage(i)}>✕</button>
                                </div>
                                <div className="uc-parking-card-row">
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#ecfccb" }}>{primary.name}</div>
                                    <div className="uc-parking-card-meta">{primary.address}</div>
                                    <div className="uc-parking-card-meta" style={{ marginTop: 8 }}>
                                      Giá: {(primary.hourly_rate || 20000).toLocaleString("vi-VN")}đ/giờ ·{" "}
                                      {primary.available_slots !== undefined ? `${primary.available_slots}/${primary.total_slots || "?"} chỗ trống` : "Còn chỗ"}
                                    </div>
                                  </div>
                                  <div className="uc-parking-card-actions">
                                    <button className="uc-btn-detail" onClick={() => (window.location.href = `/users/detailParking/${primary.id}`)}>Chi tiết</button>
                                    <button className="uc-btn-book" onClick={() => (window.location.href = `/users/myBooking/${primary.id}`)}>Đặt ngay</button>
                                  </div>
                                </div>
                              </div>
                              {others.length > 0 && (
                                <div className="uc-parking-secondary">
                                  <div className="uc-parking-secondary-title">Các bãi khác</div>
                                  <table className="uc-parking-table">
                                    <thead><tr><th>Tên bãi</th><th>Địa chỉ</th><th>💰/h</th><th>🅿️</th><th></th></tr></thead>
                                    <tbody>
                                      {others.map((lot: any) => (
                                        <tr key={lot.id}>
                                          <td style={{ fontWeight: 500 }}>{lot.name}</td>
                                          <td style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>{lot.address}</td>
                                          <td>{(lot.hourly_rate || 20000).toLocaleString("vi-VN")}đ</td>
                                          <td>{lot.available_slots !== undefined ? `${lot.available_slots}/${lot.total_slots || "?"}` : "✅"}</td>
                                          <td>
                                            <button className="uc-btn-detail" onClick={() => (window.location.href = `/users/detailParking/${lot.id}`)}>Chi tiết</button>
                                            <button className="uc-btn-book" onClick={() => (window.location.href = `/users/myBooking/${lot.id}`)}>Đặt</button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="uc-row">
                  <div className="uc-mav">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div className="uc-bub b">
                    <div className="uc-tdots"><div className="uc-td"/><div className="uc-td"/><div className="uc-td"/></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            <div className="uc-chips-wrap">
              <div className="uc-clabel">💡 Gợi ý nhanh</div>
              <div className="uc-chips">
                {QUICK_CHIPS.map(label => (
                  <button key={label} className="uc-chip" onClick={() => sendMessage(label)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="uc-inp-area">
              <div className="uc-inp-box">
                <textarea
                  className="uc-ta" rows={1} value={input}
                  placeholder="Hỏi về bãi đỗ, đặt chỗ, ví tiền..."
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button className={`uc-mic${listening ? " on" : ""}`} onClick={() => { const r = recognitionRef.current; if (!r) return; listening ? r.stop() : r.start(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                </button>
                <button className="uc-send" disabled={loading || !input.trim()} onClick={() => sendMessage()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div className="uc-hint">Enter gửi · Shift+Enter xuống dòng</div>
            </div>
          </div>
        )}

        <button className={`uc-fab${open ? " hidden" : ""}`} onClick={() => setOpen(true)}>
          {hasUnread && <span className="uc-badge">!</span>}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </>
  );
}
