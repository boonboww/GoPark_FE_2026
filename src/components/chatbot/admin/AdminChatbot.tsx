"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import {
  ChatMessageContent,
  CHAT_MESSAGE_CONTENT_STYLES,
} from "../shared/ChatMessageContent";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: Message[];
};

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào Admin. Tôi có thể tra nhanh dữ liệu hệ thống:\n- tổng quan hệ thống\n- tìm user theo email\n- tìm bãi đỗ\n- top 5 bãi nhiều chỗ trống\n- doanh thu hôm nay/tháng này\n- yêu cầu chờ duyệt\n- hóa đơn chưa thanh toán",
};

export default function AdminChatbot() {
  const { accessToken, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 460, height: 660 });
  const [isPanelLarge, setIsPanelLarge] = useState(false);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 460, height: 660 });
  const messagesRef = useRef<Message[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
    window.requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
    if (!open && messages[messages.length - 1]?.role === "assistant") {
      setHasUnread(true);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      setPanelSize({
        width: Math.max(360, Math.min(820, resizeStartRef.current.width - dx)),
        height: Math.max(460, Math.min(920, resizeStartRef.current.height - dy)),
      });
    };
    const onUp = () => {
      resizingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onResizeMouseDown = (e: React.MouseEvent) => {
    resizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  const togglePanelSize = () => {
    setIsPanelLarge((current) => {
      const next = !current;
      setPanelSize(
        next
          ? { width: Math.min(820, window.innerWidth - 48), height: Math.min(880, window.innerHeight - 48) }
          : { width: 460, height: 660 },
      );
      return next;
    });
  };

  const loadSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/admin/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setSessions(data?.data || []);
    } catch {}
  }, [accessToken]);

  const createNewSession = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/admin/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: `Tra cuu ${new Date().toLocaleString("vi-VN")}` }),
      });
      const data = await res.json();
      const session = data?.data;
      if (session?.id) {
        setCurrentSessionId(session.id);
        setMessages([WELCOME_MSG]);
        messagesRef.current = [WELCOME_MSG];
        setSessions((prev) => [session, ...prev]);
        setShowSessions(false);
      }
    } catch {}
  }, [accessToken]);

  useEffect(() => {
    if (open && accessToken) {
      loadSessions();
      if (!currentSessionId) createNewSession();
    }
  }, [open, accessToken, currentSessionId, loadSessions, createNewSession]);

  const loadSessionMessages = async (sessionId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      const session = data?.data as ChatSession | undefined;
      const nextMessages = session?.messages?.length
        ? [WELCOME_MSG, ...session.messages]
        : [WELCOME_MSG];
      setMessages(nextMessages);
      messagesRef.current = nextMessages;
      setCurrentSessionId(sessionId);
      setShowSessions(false);
    } catch {}
  };

  const deleteSessionById = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken) return;
    try {
      await fetch(`${API_BASE_URL}/chatbot/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([WELCOME_MSG]);
        messagesRef.current = [WELCOME_MSG];
      }
    } catch {}
  };

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);
    messagesRef.current = nextMessages;
    setInput("");
    setLoading(true);
    try {
      const url = currentSessionId
        ? `${API_BASE_URL}/chatbot/admin/sessions/${currentSessionId}/chat`
        : `${API_BASE_URL}/chatbot/admin/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ messages: [{ role: "user", content }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const payload = data?.data || data;
      const assistantMsg: Message = {
        role: "assistant",
        content: payload?.text || payload?.message || "Khong co phan hoi",
      };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
    } catch {
      const err: Message = {
        role: "assistant",
        content: "Khong ket noi duoc Admin chatbot. Vui long thu lai.",
      };
      setMessages([...messagesRef.current, err]);
      messagesRef.current = [...messagesRef.current, err];
    } finally {
      setLoading(false);
    }
  }

  const quick = [
    "cảnh báo hệ thống",
    "hóa đơn chưa thanh toán",
    "tổng quan hệ thống",
    "doanh thu hôm nay",
    "doanh thu tháng này",
    "yêu cầu chờ duyệt",
    "hóa đơn chưa thanh toán",
    "top 5 bãi giá rẻ nhất",
    "top 5 bãi nhiều chỗ trống",
    "top 5 bãi đánh giá cao nhất",
    "tim user nguyendung",
    "tìm bãi Mỹ Khê",
  ];

  return (
    <>
      <style>{`
        .ac * { box-sizing:border-box; font-family:Inter, Arial, sans-serif; }
        .ac-panel { position:fixed; right:24px; bottom:24px; width:460px; height:660px; background:#08111f; color:#e5f0ff; border:1px solid rgba(96,165,250,.25); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,.55); z-index:100010; display:flex; flex-direction:column; overflow:hidden; }
        .ac-resize { position:absolute; top:0; left:0; width:18px; height:18px; cursor:nw-resize; z-index:2; }
        .ac-resize:after { content:""; position:absolute; top:5px; left:5px; width:8px; height:8px; border-top:2px solid rgba(147,197,253,.65); border-left:2px solid rgba(147,197,253,.65); border-radius:2px; }
        .ac-hdr { padding:12px 14px; background:#0f1d33; border-bottom:1px solid rgba(96,165,250,.18); }
        .ac-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .ac-brand { min-width:0; }
        .ac-name { font-size:14px; font-weight:800; color:#bfdbfe; }
        .ac-sub { font-size:11px; color:#93c5fd; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ac-actions { display:flex; gap:6px; align-items:center; }
        .ac-badge { font-size:10px; font-weight:700; color:#bfdbfe; border:1px solid rgba(96,165,250,.35); border-radius:999px; padding:3px 8px; background:rgba(37,99,235,.12); }
        .ac-btn { width:28px; height:28px; border:0; border-radius:7px; background:rgba(255,255,255,.07); color:#bfdbfe; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .ac-msgs { flex:1; overflow:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
        .ac-msg { max-width:96%; padding:10px 12px; border-radius:14px; white-space:pre-wrap; font-size:13px; line-height:1.55; }
        .ac-msg.a { align-self:flex-start; background:rgba(255,255,255,.06); border:1px solid rgba(96,165,250,.16); }
        .ac-msg.u { align-self:flex-end; background:#2563eb; color:#fff; }
        ${CHAT_MESSAGE_CONTENT_STYLES}
        .ac-chips { border-top:1px solid rgba(96,165,250,.13); padding:8px 10px; display:flex; gap:6px; overflow-x:auto; }
        .ac-chip { flex-shrink:0; border:1px solid rgba(96,165,250,.28); background:rgba(37,99,235,.1); color:#bfdbfe; border-radius:999px; padding:6px 10px; font-size:12px; cursor:pointer; }
        .ac-input { border-top:1px solid rgba(96,165,250,.13); padding:10px; display:flex; gap:8px; }
        .ac-ta { flex:1; min-height:38px; max-height:90px; resize:none; border:0; outline:0; border-radius:10px; background:rgba(255,255,255,.07); color:#e5f0ff; padding:10px; font-size:13px; }
        .ac-send { width:42px; border:0; border-radius:10px; background:#2563eb; color:#fff; cursor:pointer; font-weight:800; }
        .ac-fab { position:fixed; right:24px; bottom:24px; z-index:100011; width:54px; height:54px; border-radius:50%; border:0; background:#2563eb; color:#fff; box-shadow:0 12px 35px rgba(37,99,235,.45); cursor:pointer; }
        .ac-fab.hidden { display:none; }
        .ac-unread { position:absolute; top:-2px; right:-2px; width:16px; height:16px; border-radius:50%; background:#ef4444; color:#fff; font-size:10px; display:flex; align-items:center; justify-content:center; }
        .ac-sessions { position:absolute; inset:0; background:#08111f; z-index:5; display:flex; flex-direction:column; }
        .ac-session { padding:10px 12px; border-bottom:1px solid rgba(96,165,250,.12); cursor:pointer; font-size:13px; display:flex; gap:8px; justify-content:space-between; }
        .ac-session:hover { background:rgba(37,99,235,.1); }
        @media(max-width:480px){ .ac-panel{ right:0!important; left:0!important; bottom:0!important; width:100%!important; height:75dvh!important; border-radius:18px 18px 0 0; } }
      `}</style>
      <div className="ac">
        {open && (
          <div className="ac-panel" style={{ width: panelSize.width, height: panelSize.height }}>
            <div className="ac-resize" onMouseDown={onResizeMouseDown} title="Keo de resize" />
            {showSessions && (
              <div className="ac-sessions">
                <div className="ac-hdr">
                  <div className="ac-row">
                    <div className="ac-name">Lich su Admin chatbot</div>
                    <button className="ac-btn" onClick={() => setShowSessions(false)}>x</button>
                  </div>
                </div>
                <button className="ac-chip" style={{ margin: 10 }} onClick={createNewSession}>Cuoc tro chuyen moi</button>
                {sessions.map((session) => (
                  <div className="ac-session" key={session.id} onClick={() => loadSessionMessages(session.id)}>
                    <span>{session.title || "Tra cuu"}</span>
                    <button className="ac-btn" onClick={(e) => deleteSessionById(session.id, e)}>x</button>
                  </div>
                ))}
              </div>
            )}
            <div className="ac-hdr">
              <div className="ac-row">
                <div className="ac-brand">
                  <div className="ac-name">GoPark Admin AI</div>
                  <div className="ac-sub">{user?.email || "Tra cuu du lieu he thong"}</div>
                </div>
                <div className="ac-actions">
                  <span className="ac-badge">ADMIN</span>
                  <button className="ac-btn" onClick={() => setShowSessions(true)} title="Lich su">□</button>
                  <button className="ac-btn" onClick={createNewSession} title="Moi">+</button>
                  <button className="ac-btn" onClick={togglePanelSize} title={isPanelLarge ? "Thu nho" : "Phong to"}>
                    {isPanelLarge ? "−" : "□"}
                  </button>
                  <button className="ac-btn" onClick={() => setOpen(false)} title="Dong">×</button>
                </div>
              </div>
            </div>
            <div className="ac-msgs">
              {messages.map((message, index) => (
                <div key={index} className={`ac-msg ${message.role === "user" ? "u" : "a"}`}>
                  <ChatMessageContent content={message.content} />
                </div>
              ))}
              {loading && <div className="ac-msg a">Dang tra cuu...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="ac-chips">
              {quick.map((item) => (
                <button key={item} className="ac-chip" onClick={() => sendMessage(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="ac-input">
              <textarea
                className="ac-ta"
                value={input}
                placeholder="Hoi nhanh: tim user, tim bai, doanh thu hom nay..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button className="ac-send" disabled={loading || !input.trim()} onClick={() => sendMessage()}>
                ↑
              </button>
            </div>
          </div>
        )}
        <button className={`ac-fab${open ? " hidden" : ""}`} onClick={() => setOpen(true)}>
          {hasUnread && <span className="ac-unread">!</span>}
          AI
        </button>
      </div>
    </>
  );
}
