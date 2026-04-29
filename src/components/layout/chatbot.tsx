"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { chatService } from "@/services/chat.service";
import Link from "next/link";

type Message = { role: "user" | "assistant" | "system"; content: string };
type Status = "unknown" | "connected" | "disconnected";

const API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API ||
  "http://localhost:8080/api/v1/chatbot/chat";
const STATUS_URL =
  process.env.NEXT_PUBLIC_CHATBOT_STATUS ||
  "http://localhost:8080/api/v1/chatbot/status";

const QUICK_CHIPS = [
  "Tìm bãi gần tôi",
  "Cách thanh toán",
  "Giờ mở cửa",
  "Hủy đặt chỗ",
  "Khiếu nại hóa đơn",
  "Tính năng chủ bãi",
  "Khuyến mãi",
  "Liên hệ hỗ trợ",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý GoPark.\nTôi có thể giúp bạn tìm bãi đỗ, đặt chỗ, thanh toán và nhiều hơn nữa. Bạn cần hỗ trợ gì hôm nay?",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
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
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [hasUnread, setHasUnread] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const user = useAuthStore((s) => s.user);
  const [ownerUnreadCount, setOwnerUnreadCount] = useState(0);

  // ─── Fetch Owner Chat Unread Count ─────────────────────────────────────────
  useEffect(() => {
    if (user?.role === "OWNER" || user?.role === "STAFF") {
      const fetchUnread = async () => {
        try {
          const convs = await chatService.getConversations();
          const total = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setOwnerUnreadCount(total);
        } catch (e) {
          // Fail silently
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Persist & scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gopark_chat_history", JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!open && messages[messages.length - 1]?.role === "assistant") {
      setHasUnread(true);
    }
  }, [messages]);

  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  // ─── Speech recognition ───────────────────────────────────────────────────
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

  // ─── Status polling — 10 min, only when token present ─────────────────────
  const checkStatus = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { setStatus("unknown"); return; }
    try {
      const res = await fetch(STATUS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data?.running || data?.models?.groq?.ok ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
    statusTimerRef.current = setInterval(checkStatus, 10 * 60 * 1000);
    return () => { if (statusTimerRef.current) clearInterval(statusTimerRef.current); };
  }, [checkStatus]);

  // ─── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg: Message = { role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([userMsg]),
      });
      const data = await resp.json();
      const reply = (data?.message || data?.data?.text || "") as string;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply || "Rất tiếc, không nhận được phản hồi." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Lỗi khi kết nối tới server chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([WELCOME_MSG]);
    if (typeof window !== "undefined") localStorage.removeItem("gopark_chat_history");
  }

  function toggleListen() {
    const r = recognitionRef.current;
    if (!r) return;
    listening ? r.stop() : r.start();
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
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        .gp * { box-sizing: border-box; font-family: 'Be Vietnam Pro', sans-serif; }

        /* ── Panel — thấp hơn so với trước (~520px thay vì 620px) ── */
        .gp-panel {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 380px;
          height: min(520px, calc(100dvh - 48px));
          background: #070f1c;
          border-radius: 20px;
          box-shadow:
            0 24px 60px rgba(0,0,0,0.6),
            0 0 0 1px rgba(34,197,94,0.13),
            inset 0 1px 0 rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 100010;
          transform-origin: bottom right;
          animation: gpIn .22s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes gpIn {
          from { opacity:0; transform:scale(.85) translateY(16px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }

        /* Mobile: chiếm toàn màn hình từ dưới lên */
        @media(max-width:480px){
          .gp-panel{
            right:0; left:0; bottom:0;
            width:100%;
            height:72dvh;
            border-radius:18px 18px 0 0;
            animation: gpInMob .22s ease-out;
          }
          @keyframes gpInMob{
            from{opacity:0;transform:translateY(20px);}
            to{opacity:1;transform:translateY(0);}
          }
        }

        /* ── Header ── */
        .gp-hdr {
          padding: 12px 14px 10px;
          background: linear-gradient(160deg,#022c1a 0%,#053d28 100%);
          border-bottom: 1px solid rgba(34,197,94,0.14);
          flex-shrink: 0;
        }
        .gp-hdr-row { display:flex; align-items:center; justify-content:space-between; }
        .gp-brand  { display:flex; align-items:center; gap:9px; }
        .gp-av {
          width:34px; height:34px; border-radius:10px;
          background: linear-gradient(135deg,#15803d,#22c55e);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .gp-bname { font-size:14px; font-weight:700; color:#f0fdf4; letter-spacing:-.2px; }
        .gp-bsub  { font-size:11px; color:#86efac; margin-top:1px; }
        .gp-acts  { display:flex; align-items:center; gap:5px; }
        .gp-pill  {
          display:flex; align-items:center; gap:5px;
          background:rgba(0,0,0,.3); border-radius:999px;
          padding:3px 8px; font-size:11px; color:#bbf7d0;
          border:1px solid rgba(34,197,94,.16);
        }
        .gp-dot-s { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .gp-ibtn {
          background:rgba(255,255,255,.06); border:none;
          width:28px; height:28px; border-radius:7px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:#86efac; transition:background .15s;
        }
        .gp-ibtn:hover { background:rgba(34,197,94,.2); }

        /* ── Messages ── */
        .gp-msgs {
          flex:1; overflow-y:auto; padding:12px 12px 4px;
          display:flex; flex-direction:column; gap:10px;
          scroll-behavior:smooth;
        }
        .gp-msgs::-webkit-scrollbar{ width:3px; }
        .gp-msgs::-webkit-scrollbar-track{ background:transparent; }
        .gp-msgs::-webkit-scrollbar-thumb{ background:rgba(34,197,94,.18); border-radius:4px; }

        .gp-row { display:flex; gap:7px; align-items:flex-end; }
        .gp-row.u { flex-direction:row-reverse; }

        /* Bot avatar — simple colored square, no emoji */
        .gp-mav {
          width:26px; height:26px; border-radius:8px; flex-shrink:0;
          background:linear-gradient(135deg,#15803d,#22c55e);
          display:flex; align-items:center; justify-content:center;
        }

        .gp-bub {
          max-width:78%; padding:9px 12px; border-radius:13px;
          font-size:13.5px; line-height:1.58; word-break:break-word;
          white-space:pre-wrap;
        }
        .gp-bub.b {
          background:rgba(255,255,255,.045);
          color:#dff5ea;
          border-bottom-left-radius:3px;
          border:1px solid rgba(34,197,94,.09);
        }
        .gp-bub.u {
          background:linear-gradient(135deg,#15803d,#22c55e);
          color:#fff;
          border-bottom-right-radius:3px;
        }

        /* typing dots */
        .gp-tdots { display:flex; gap:4px; align-items:center; padding:6px 2px; }
        .gp-td {
          width:6px; height:6px; border-radius:50%;
          background:#22c55e; opacity:.4;
          animation:gpBounce 1.2s ease-in-out infinite;
        }
        .gp-td:nth-child(2){ animation-delay:.22s; }
        .gp-td:nth-child(3){ animation-delay:.44s; }
        @keyframes gpBounce{
          0%,60%,100%{ transform:translateY(0); opacity:.35; }
          30%{ transform:translateY(-5px); opacity:1; }
        }

        /* ── Chips ── */
        .gp-chips-wrap { flex-shrink:0; padding:6px 12px 7px; }
        .gp-clabel { font-size:10px; color:#3a6b4a; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .gp-chips { display:flex; gap:5px; overflow-x:auto; padding-bottom:1px; }
        .gp-chips::-webkit-scrollbar{ display:none; }
        .gp-chip {
          flex-shrink:0;
          background:rgba(34,197,94,.07);
          border:1px solid rgba(34,197,94,.17);
          color:#86efac; padding:4px 10px;
          border-radius:999px; font-size:12px;
          cursor:pointer; transition:all .15s;
          white-space:nowrap;
        }
        .gp-chip:hover { background:rgba(34,197,94,.17); border-color:rgba(34,197,94,.38); color:#bbf7d0; }

        /* ── Input area ── */
        .gp-inp-area {
          flex-shrink:0; padding:7px 12px 10px;
          border-top:1px solid rgba(34,197,94,.08);
          background:rgba(255,255,255,.01);
        }
        .gp-inp-box {
          display:flex; gap:7px; align-items:flex-end;
          background:rgba(255,255,255,.035);
          border:1px solid rgba(34,197,94,.14);
          border-radius:13px; padding:7px 7px 7px 11px;
          transition:border-color .18s;
        }
        .gp-inp-box.f { border-color:rgba(34,197,94,.46); }
        .gp-ta {
          flex:1; background:transparent; border:none; outline:none;
          color:#e2f5ea; font-size:14px; resize:none;
          max-height:90px; min-height:20px; line-height:1.5;
        }
        .gp-ta::placeholder{ color:#3a5c47; }
        .gp-mic {
          background:transparent; border:none; cursor:pointer;
          padding:3px; color:#3a6b4a; transition:color .15s; flex-shrink:0;
        }
        .gp-mic.on { color:#ef4444; animation:gpPulse 1s infinite; }
        @keyframes gpPulse{ 0%,100%{opacity:1;} 50%{opacity:.4;} }
        .gp-send {
          background:linear-gradient(135deg,#16a34a,#22c55e);
          border:none; width:32px; height:32px; border-radius:9px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; transition:transform .15s,box-shadow .15s;
          box-shadow:0 2px 8px rgba(34,197,94,.28);
        }
        .gp-send:hover:not(:disabled){ transform:scale(1.08); box-shadow:0 4px 14px rgba(34,197,94,.42); }
        .gp-send:disabled{ opacity:.32; cursor:not-allowed; }
        .gp-hint{ font-size:10px; color:#243d2c; text-align:center; margin-top:5px; }

        /* ── FAB — ẩn khi panel mở, hiện lại khi đóng ── */
        .gp-fab {
          position:fixed; right:24px; bottom:24px; z-index:100011;
          width:52px; height:52px; border-radius:50%; border:none;
          background:linear-gradient(135deg,#16a34a,#22c55e);
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 5px 20px rgba(34,197,94,.4);
          transition:transform .2s, box-shadow .2s, opacity .18s, visibility .18s;
        }
        .gp-fab:hover{ transform:scale(1.09); box-shadow:0 7px 26px rgba(34,197,94,.55); }

        /* Ẩn FAB khi chat đang mở */
        .gp-fab.hidden {
          opacity: 0;
          visibility: hidden;
          transform: scale(0.8);
          pointer-events: none;
        }

        @media(max-width:480px){ .gp-fab{ right:16px; bottom:16px; } }

        .gp-badge {
          position:absolute; top:-3px; right:-3px;
          width:15px; height:15px; border-radius:50%;
          background:#ef4444; border:2px solid #070f1c;
          font-size:9px; color:#fff; display:flex;
          align-items:center; justify-content:center; font-weight:700;
        }
      `}</style>

      <div className="gp">
        {/* ── Panel ── */}
        {open && (
          <div className="gp-panel">

            {/* Header */}
            <div className="gp-hdr">
              <div className="gp-hdr-row">
                <div className="gp-brand">
                  <div className="gp-av">
                    {/* Simple GP logo mark, no emoji */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none"/>
                    </svg>
                  </div>
                  <div>
                    <div className="gp-bname">GoPark Assistant</div>
                    <div className="gp-bsub">Hỗ trợ đặt bãi đỗ xe 24/7</div>
                  </div>
                </div>
                <div className="gp-acts">
                  <div className="gp-pill">
                    <div className="gp-dot-s" style={{ background: statusDot[status] }} />
                    {statusLabel[status]}
                  </div>
                  <button className="gp-ibtn" title="Xóa lịch sử chat" onClick={clearHistory}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                  <button className="gp-ibtn" title="Đóng" onClick={() => setOpen(false)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="gp-msgs">
              {messages.map((m, i) => (
                <div key={i} className={`gp-row${m.role === "user" ? " u" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="gp-mav">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                    </div>
                  )}
                  <div className={`gp-bub${m.role === "user" ? " u" : " b"}`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="gp-row">
                  <div className="gp-mav">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
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

            {/* Quick chips */}
            <div className="gp-chips-wrap">
              <div className="gp-clabel">Câu hỏi thường gặp</div>
              <div className="gp-chips">
                {QUICK_CHIPS.map((label) => (
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
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
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
                  title={listening ? "Dừng ghi âm" : "Nhận dạng giọng nói"}
                  onClick={toggleListen}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3"/>
                    <path d="M5 10a7 7 0 0 0 14 0"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="8" y1="22" x2="16" y2="22"/>
                  </svg>
                </button>
                <button
                  className="gp-send"
                  disabled={loading || !input.trim()}
                  onClick={() => sendMessage()}
                  title="Gửi (Enter)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div className="gp-hint">Enter để gửi · Shift+Enter xuống dòng</div>
            </div>
          </div>
        )}

        {/* ── FAB — ẩn khi panel mở ── */}
        <button
          className={`gp-fab${open ? " hidden" : ""}`}
          title="Mở chatbot GoPark"
          onClick={() => setOpen(true)}
          aria-hidden={open}
        >
          {hasUnread && <span className="gp-badge">!</span>}
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </>
  );
}