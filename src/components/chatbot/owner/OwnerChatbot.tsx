"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { API_BASE_URL } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "revenue-chart";
  data?: any;
};
type Status = "unknown" | "connected" | "disconnected";
type VoiceState = "idle" | "wake-listening" | "prompted" | "question-listening" | "speaking";

const OWNER_API_URL =
  process.env.NEXT_PUBLIC_OWNER_CHATBOT_API ||
  `${API_BASE_URL}/chatbot/owner/chat`;

const QUICK_CHIPS = [
  "📊 Doanh thu tuần này",
  "📈 So sánh tháng này vs tháng trước",
  "🏆 Bãi doanh thu cao nhất",
  "💡 Gợi ý tăng doanh thu",
  "📅 Doanh thu theo quý",
  "🔍 Phân tích xu hướng",
  "⚠️ Bãi hoạt động kém",
  "📋 Báo cáo tổng quan",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý phân tích GoPark dành cho chủ bãi.\n\nTôi có thể giúp bạn:\n📊 Phân tích doanh thu theo tuần/tháng/quý\n📈 So sánh hiệu suất giữa các kỳ\n💡 Gợi ý biện pháp tăng doanh thu\n⚠️ Phát hiện bãi hoạt động kém\n\nBạn muốn xem báo cáo gì?",
};

function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const convertMoney = (t: string) =>
    t.replace(/(\d[\d,.]*)đ/g, (_, num) => {
      const n = parseInt(num.replace(/[,.]/g, ""), 10);
      if (isNaN(n)) return num + " đồng";
      if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".0","") + " tỷ đồng";
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0","") + " triệu đồng";
      if (n >= 1_000) return (n / 1_000).toFixed(0) + " nghìn đồng";
      return n + " đồng";
    });
  const clean = convertMoney(text)
    .replace(/[🔹🔸💰⭐📅📋💳🚗❓🔍✅❌⚠️💡📊📈🏆🎉👤🏢]/gu, "")
    .replace(/\*\*/g, "").trim();
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = "vi-VN"; utt.rate = 1.05; utt.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const googleVi = voices.find(v => v.lang === "vi-VN" && v.name.toLowerCase().includes("google")) || voices.find(v => v.lang === "vi-VN");
  if (googleVi) utt.voice = googleVi;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

export default function OwnerChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { accessToken, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("gopark_owner_chat") : null;
      return raw ? JSON.parse(raw) : [WELCOME_MSG];
    } catch { return [WELCOME_MSG]; }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [hasUnread, setHasUnread] = useState(false);
  // Voice AI mode
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const wakeRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const voiceModeRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>("idle");

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("gopark_owner_chat", JSON.stringify(messages));
    window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    if (!open && messages[messages.length - 1]?.role === "assistant") setHasUnread(true);
  }, [messages]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { if (open) setHasUnread(false); }, [open]);

  const startQuestionListener = useCallback(() => {
    const win: any = typeof window !== "undefined" ? window : {};
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition || null;
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN"; r.interimResults = false; r.continuous = false;
    setVoiceState("question-listening");
    r.onresult = async (ev: any) => {
      const question = Array.from(ev.results).map((x: any) => x[0].transcript).join("").trim();
      if (question) {
        setVoiceState("speaking");
        await sendMessageVoice(question);
      }
    };
    r.onend = () => {
      if (voiceModeRef.current && voiceStateRef.current === "question-listening") {
        setVoiceState("wake-listening");
        startWakeListener();
      }
    };
    r.start();
  }, []);

  const startWakeListener = useCallback(() => {
    const win: any = typeof window !== "undefined" ? window : {};
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition || null;
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN"; r.interimResults = false; r.continuous = true;
    r.onresult = (ev: any) => {
      const transcript = Array.from(ev.results)
        .map((x: any) => x[0].transcript).join(" ").toLowerCase();
      if (transcript.includes("hey gopark") || transcript.includes("hey go park") || transcript.includes("hê gopark")) {
        r.stop();
        setVoiceState("prompted");
        voiceStateRef.current = "prompted";
        speakText("Xin chào! Bạn muốn hỏi gì?", () => {
          if (voiceModeRef.current) startQuestionListener();
        });
      }
    };
    r.onend = () => {
      if (voiceModeRef.current && voiceStateRef.current === "wake-listening") {
        try { r.start(); } catch {}
      }
    };
    r.start();
    wakeRecognitionRef.current = r;
    setVoiceState("wake-listening");
  }, [startQuestionListener]);

  useEffect(() => {
    if (voiceMode) {
      setOpen(true);
      startWakeListener();
    } else {
      window.speechSynthesis?.cancel();
      try { wakeRecognitionRef.current?.stop(); } catch {}
      setVoiceState("idle");
    }
  }, [voiceMode, startWakeListener]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/status`);
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
      const resp = await fetch(OWNER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesRef.current.filter(m => m.role === "user") }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const response = await resp.json();

      // Revenue chart data
      if (response?.data?.action === "revenue_chart" && response?.data?.chartData) {
        const msg: Message = {
          role: "assistant",
          type: "revenue-chart",
          content: response?.text || "Đây là dữ liệu doanh thu của bạn:",
          data: response.data,
        };
        setMessages([...messagesRef.current, msg]);
        messagesRef.current = [...messagesRef.current, msg];
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

  async function sendMessageVoice(content: string) {
    if (!content || loading) return;
    const userMsg: Message = { role: "user", content };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const resp = await fetch(OWNER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesRef.current.filter(m => m.role === "user") }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const response = await resp.json();
      const text2 = response?.data?.text || response?.text || response?.message || "Không có phản hồi";
      const assistantMsg: Message = { role: "assistant", content: text2 };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
      setLoading(false);
      setVoiceState("speaking");
      speakText(text2, () => {
        if (voiceModeRef.current) {
          setVoiceState("wake-listening");
          startWakeListener();
        } else {
          setVoiceState("idle");
        }
      });
    } catch {
      const errMsg: Message = { role: "assistant", content: "❌ Lỗi kết nối. Vui lòng thử lại." };
      setMessages([...messagesRef.current, errMsg]);
      messagesRef.current = [...messagesRef.current, errMsg];
      setLoading(false);
      if (voiceModeRef.current) { setVoiceState("wake-listening"); startWakeListener(); }
    }
  }

  function clearHistory() {
    setMessages([WELCOME_MSG]);
    if (typeof window !== "undefined") localStorage.removeItem("gopark_owner_chat");
  }

  const statusDot: Record<Status, string> = { connected: "#f59e0b", disconnected: "#ef4444", unknown: "#94a3b8" };
  const statusLabel: Record<Status, string> = { connected: "Đã kết nối", disconnected: "Mất kết nối", unknown: "Đang kiểm tra" };

  const voiceStateLabel: Record<VoiceState, string> = {
    idle: "",
    "wake-listening": "🎙️ Đang chờ \"Hey GoPark\"...",
    prompted: "🤖 Bạn muốn hỏi gì?",
    "question-listening": "👂 Đang nghe câu hỏi...",
    speaking: "🔊 Đang trả lời...",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .ow * { box-sizing: border-box; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes owFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ow-panel {
          position: fixed; right: 24px; bottom: 24px; width: 440px; height: min(640px, calc(100dvh - 48px));
          background: #0d0d1a; border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.2);
          display: flex; flex-direction: column; overflow: hidden; z-index: 100010; animation: owFadeIn 0.22s ease;
        }
        @media(max-width:480px){ .ow-panel{ right:0; left:0; bottom:0; width:100%; height:75dvh; border-radius:18px 18px 0 0; } }
        .ow-hdr { padding: 12px 14px; background: linear-gradient(160deg,#1a1000 0%,#2d1f00 100%); border-bottom: 1px solid rgba(245,158,11,0.2); flex-shrink: 0; }
        .ow-hdr-row { display:flex; align-items:center; justify-content:space-between; }
        .ow-brand { display:flex; align-items:center; gap:9px; }
        .ow-av { width:34px; height:34px; border-radius:10px; background: linear-gradient(135deg,#b45309,#f59e0b); display:flex; align-items:center; justify-content:center; }
        .ow-bname { font-size:14px; font-weight:700; color:#fef3c7; }
        .ow-bsub { font-size:11px; color:#fcd34d; margin-top:1px; }
        .ow-role-badge { background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.4); color:#fcd34d; font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; letter-spacing:.5px; }
        .ow-pill { display:flex; align-items:center; gap:5px; background:rgba(0,0,0,.3); border-radius:999px; padding:3px 8px; font-size:11px; color:#fde68a; border:1px solid rgba(245,158,11,.2); }
        .ow-dot { width:6px; height:6px; border-radius:50%; }
        .ow-acts { display:flex; align-items:center; gap:6px; }
        .ow-ibtn { background:rgba(255,255,255,.06); border:none; width:28px; height:28px; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fcd34d; }
        .ow-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
        .ow-msgs::-webkit-scrollbar { width:4px; }
        .ow-msgs::-webkit-scrollbar-thumb { background:rgba(245,158,11,.3); border-radius:4px; }
        .ow-row { display:flex; gap:8px; align-items:flex-start; }
        .ow-row.u { flex-direction:row-reverse; }
        .ow-mav { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#b45309,#f59e0b); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ow-bub { max-width:82%; padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.6; word-break:break-word; white-space:pre-wrap; }
        .ow-bub.b { background:rgba(255,255,255,.05); color:#fef9e7; border-bottom-left-radius:4px; border:1px solid rgba(245,158,11,.15); }
        .ow-bub.u { background:linear-gradient(135deg,#b45309,#f59e0b); color:#fff; border-bottom-right-radius:4px; }
        .ow-tdots { display:flex; gap:4px; padding:6px 2px; }
        .ow-td { width:6px; height:6px; border-radius:50%; background:#f59e0b; animation:owBounce 1.2s infinite; }
        .ow-td:nth-child(2){ animation-delay:.22s; } .ow-td:nth-child(3){ animation-delay:.44s; }
        @keyframes owBounce { 0%,60%,100%{ transform:translateY(0); opacity:.35; } 30%{ transform:translateY(-5px); opacity:1; } }
        .ow-chips-wrap { flex-shrink:0; padding:6px 12px; border-top:1px solid rgba(245,158,11,.1); }
        .ow-clabel { font-size:10px; color:#78350f; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .ow-chips { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:thin; }
        .ow-chip { flex-shrink:0; background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.25); color:#fcd34d; padding:5px 12px; border-radius:20px; font-size:12px; cursor:pointer; white-space:nowrap; }
        .ow-chip:hover { background:rgba(245,158,11,.15); }
        .ow-revenue-card { background:rgba(30,20,0,0.9); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:14px; margin-top:8px; }
        .ow-revenue-title { font-weight:700; color:#fde68a; margin-bottom:10px; font-size:13px; }
        .ow-revenue-table { width:100%; border-collapse:collapse; font-size:12px; }
        .ow-revenue-table th { background:rgba(245,158,11,0.12); color:#fcd34d; padding:7px 8px; text-align:left; font-weight:600; }
        .ow-revenue-table td { padding:7px 8px; border-bottom:1px solid rgba(245,158,11,0.08); color:#fef3c7; }
        .ow-revenue-table tr:last-child td { border-bottom:none; }
        .ow-revenue-highlight { color:#fbbf24; font-weight:700; }
        .ow-inp-area { flex-shrink:0; padding:8px 12px 12px; border-top:1px solid rgba(245,158,11,.1); }
        .ow-inp-box { display:flex; gap:8px; align-items:flex-end; background:rgba(255,255,255,.04); border:1px solid rgba(245,158,11,.2); border-radius:16px; padding:6px 8px 6px 14px; }
        .ow-ta { flex:1; background:transparent; border:none; outline:none; color:#fef3c7; font-size:14px; resize:none; max-height:90px; line-height:1.4; }
        .ow-ta::placeholder{ color:#5c4a1a; }
        .ow-send { background:linear-gradient(135deg,#b45309,#f59e0b); border:none; width:34px; height:34px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ow-send:disabled { opacity:0.4; cursor:not-allowed; }
        .ow-hint { font-size:9px; color:#3d2e0a; text-align:center; margin-top:6px; }
        .ow-fab { position:fixed; right:24px; bottom:24px; z-index:100011; width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#b45309,#f59e0b); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 20px rgba(245,158,11,.4); transition:all 0.2s; }
        .ow-fab:hover { transform:scale(1.08); }
        .ow-fab.hidden { opacity:0; visibility:hidden; transform:scale(0.8); pointer-events:none; }
        .ow-badge { position:absolute; top:-3px; right:-3px; width:16px; height:16px; border-radius:50%; background:#ef4444; border:2px solid #0d0d1a; font-size:9px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
        /* Voice toggle */
        .ow-voice-row { display:flex; align-items:center; justify-content:space-between; margin-top:8px; padding:6px 10px; background:rgba(245,158,11,0.06); border-radius:10px; border:1px solid rgba(245,158,11,0.12); }
        .ow-voice-label { font-size:11px; color:#fcd34d; display:flex; align-items:center; gap:5px; }
        .ow-toggle { position:relative; width:38px; height:20px; cursor:pointer; }
        .ow-toggle input { opacity:0; width:0; height:0; }
        .ow-toggle-slider { position:absolute; inset:0; background:#2d1f00; border-radius:20px; transition:.25s; border:1px solid rgba(245,158,11,.2); }
        .ow-toggle-slider:before { content:""; position:absolute; width:14px; height:14px; left:2px; top:2px; background:#7a5a1a; border-radius:50%; transition:.25s; }
        .ow-toggle input:checked + .ow-toggle-slider { background:#b45309; border-color:#f59e0b; }
        .ow-toggle input:checked + .ow-toggle-slider:before { transform:translateX(18px); background:#fff; }
        .ow-voice-status { font-size:10px; color:#f59e0b; text-align:center; padding:4px 0 2px; min-height:18px; }
        @keyframes owWavePulse { 0%,100%{transform:scaleY(0.4);} 50%{transform:scaleY(1);} }
        .ow-wave { display:inline-flex; align-items:center; gap:2px; height:14px; }
        .ow-wave span { display:inline-block; width:3px; background:#f59e0b; border-radius:2px; animation:owWavePulse 0.8s infinite; }
        .ow-wave span:nth-child(2){animation-delay:.15s;height:10px;}
        .ow-wave span:nth-child(3){animation-delay:.3s;height:14px;}
        .ow-wave span:nth-child(4){animation-delay:.15s;height:10px;}
        .ow-wave span:nth-child(5){animation-delay:0s;height:6px;}
      `}</style>

      <div className="ow">
        {open && (
          <div className="ow-panel">
            {/* Header */}
            <div className="ow-hdr">
              <div className="ow-hdr-row">
                <div className="ow-brand">
                  <div className="ow-av">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                  </div>
                  <div>
                    <div className="ow-bname">GoPark Analytics</div>
                    <div className="ow-bsub">
                      {user?.profile?.name ? `Chào, ${user.profile.name}` : "Phân tích doanh thu chủ bãi"}
                    </div>
                  </div>
                </div>
                <div className="ow-acts">
                  <span className="ow-role-badge">🏢 OWNER</span>
                  <div className="ow-pill">
                    <div className="ow-dot" style={{ background: statusDot[status] }} />
                    {statusLabel[status]}
                  </div>
                  <button className="ow-ibtn" onClick={clearHistory} title="Xóa lịch sử">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                  <button className="ow-ibtn" onClick={() => setOpen(false)} title="Đóng">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Voice AI toggle */}
              <div className="ow-voice-row">
                <span className="ow-voice-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                  </svg>
                  Chế độ giọng nói AI
                </span>
                <label className="ow-toggle">
                  <input type="checkbox" checked={voiceMode} onChange={e => setVoiceMode(e.target.checked)} />
                  <span className="ow-toggle-slider" />
                </label>
              </div>
              {voiceMode && (
                <div className="ow-voice-status">
                  {(voiceState === "wake-listening" || voiceState === "question-listening") && (
                    <span className="ow-wave">
                      <span style={{height:6}} /><span /><span /><span /><span style={{height:6}} />
                    </span>
                  )}{" "}
                  {voiceStateLabel[voiceState]}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="ow-msgs">
              {messages.map((m, i) => (
                <div key={i} className={`ow-row${m.role === "user" ? " u" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="ow-mav">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                      </svg>
                    </div>
                  )}
                  <div className={`ow-bub${m.role === "user" ? " u" : " b"}`}>
                    {m.type === "revenue-chart" && m.data?.chartData ? (
                      <div>
                        <div>{m.content}</div>
                        <div className="ow-revenue-card">
                          <div className="ow-revenue-title">📊 {m.data.title || "Báo cáo doanh thu"}</div>
                          <table className="ow-revenue-table">
                            <thead>
                              <tr>
                                {m.data.chartData.headers?.map((h: string) => <th key={h}>{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {m.data.chartData.rows?.map((row: any[], idx: number) => (
                                <tr key={idx}>
                                  {row.map((cell: any, ci: number) => (
                                    <td key={ci} className={ci === row.length - 1 ? "ow-revenue-highlight" : ""}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {m.data.suggestion && (
                            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 8, fontSize: 12, color: "#fde68a" }}>
                              💡 {m.data.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ow-row">
                  <div className="ow-mav">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                  </div>
                  <div className="ow-bub b">
                    <div className="ow-tdots"><div className="ow-td"/><div className="ow-td"/><div className="ow-td"/></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            <div className="ow-chips-wrap">
              <div className="ow-clabel">📊 Phân tích nhanh</div>
              <div className="ow-chips">
                {QUICK_CHIPS.map(label => (
                  <button key={label} className="ow-chip" onClick={() => sendMessage(label)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="ow-inp-area">
              <div className="ow-inp-box">
                <textarea
                  className="ow-ta" rows={1} value={input}
                  placeholder="Hỏi về doanh thu, so sánh, gợi ý tăng trưởng..."
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button className="ow-send" disabled={loading || !input.trim()} onClick={() => sendMessage()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div className="ow-hint">Enter gửi · Shift+Enter xuống dòng</div>
            </div>
          </div>
        )}

        <button className={`ow-fab${open ? " hidden" : ""}`} onClick={() => setOpen(true)}>
          {hasUnread && <span className="ow-badge">!</span>}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
        </button>
      </div>
    </>
  );
}
