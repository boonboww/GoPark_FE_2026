"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { API_BASE_URL } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "parking-list";
  data?: ParkingListData;
};
type Status = "unknown" | "connected" | "disconnected";
type VoiceState =
  | "idle"
  | "wake-listening"
  | "prompted"
  | "question-listening"
  | "speaking";
type ParkingLotSummary = {
  id: string | number;
  name?: string;
  address?: string;
  hourly_rate?: number;
  available_slots?: number;
  total_slots?: number;
  distance_km?: number;
  avgRating?: number;
  [key: string]: unknown;
};
type ParkingListData = {
  lots?: ParkingLotSummary[];
  best?: ParkingLotSummary;
  criteria?: "best" | "nearest" | "price_cheapest" | string;
  [key: string]: unknown;
};
type VehicleChip = {
  label: string;
  msg: string;
};
type ChatSession = {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
    type?: "text" | "parking-list";
    data?: ParkingListData;
  }>;
  [key: string]: unknown;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type SpeechRecognitionErrorLike = {
  error: string;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  const win = window as SpeechWindow;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
};

const normalizeSpeechText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isWakeWord = (text: string) => {
  const normalized = normalizeSpeechText(text);
  const compact = normalized.replace(/\s+/g, "");
  return (
    compact.includes("heygopark") ||
    compact.includes("heygopac") ||
    compact.includes("heygopack") ||
    compact.includes("heygopart") ||
    compact.includes("heigopark") ||
    compact.includes("egopark") ||
    compact.includes("naygopark") ||
    normalized.includes("hey go park") ||
    normalized.includes("hey go pak")
  );
};

const API_URL = `${API_BASE_URL}/chatbot/chat`;
const STATUS_URL = `${API_BASE_URL}/chatbot/status`;
const CHATBOT_REDIRECT_CONSENT_KEY = "gopark-chatbot-redirect-consent";

const QUICK_CHIPS = [
  "Tìm bãi gần tôi",
  "Bãi giá rẻ nhất",
  "Bãi phù hợp nhất",
  "Đặt bãi gần nhất",
  "Đặt bãi Mỹ Khê từ 8h đến 10h",
  "Lịch sử đặt chỗ của tôi",
  "Số dư ví GoPark",
  "Xe đã đăng ký",
  "Hướng dẫn thanh toán",
  "Cách hủy đặt chỗ",
  "Khuyến mãi hiện có",
  "Liên hệ hỗ trợ",
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý GoPark dành cho bạn.\n\nTôi có thể giúp:\n🔹 Tìm và đặt bãi đỗ xe\n🔹 Xem lịch sử đặt chỗ\n🔹 Kiểm tra số dư ví\n🔹 Xem danh sách xe đã đăng ký\n\nBạn cần gì hôm nay?",
};

function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  // Convert số tiền sang chữ tiếng Việt để đọc tự nhiên
  const convertMoney = (t: string) =>
    t.replace(/(\d[\d,.]*)đ/g, (_, num) => {
      const n = parseInt(num.replace(/[,.]/g, ""), 10);
      if (isNaN(n)) return num + " đồng";
      if (n >= 1_000_000_000)
        return (n / 1_000_000_000).toFixed(1).replace(".0", "") + " tỷ đồng";
      if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1).replace(".0", "") + " triệu đồng";
      if (n >= 1_000) return (n / 1_000).toFixed(0) + " nghìn đồng";
      return n + " đồng";
    });

  const clean = convertMoney(text)
    .replace(/[🔹🔸💰⭐📅📋💳🚗❓🔍✅❌⚠️💡📊📈🏆🎉👤🏢\*#\*\*]/gu, "")
    .replace(/\*\*/g, "")
    .trim();

  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = "vi-VN";
  utt.rate = 1.05;
  utt.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const googleVi =
    voices.find(
      (v) => v.lang === "vi-VN" && v.name.toLowerCase().includes("google"),
    ) || voices.find((v) => v.lang === "vi-VN");
  if (googleVi) utt.voice = googleVi;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

function canAutoRedirectFromChatbot() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(CHATBOT_REDIRECT_CONSENT_KEY) === "true") {
    return true;
  }

  const accepted = window.confirm(
    "GoPark muốn chuyển bạn sang trang đặt chỗ. Nhấn OK để đồng ý. Lần sau hệ thống sẽ tự chuyển trang.",
  );

  if (accepted) {
    localStorage.setItem(CHATBOT_REDIRECT_CONSENT_KEY, "true");
  }

  return accepted;
}

function redirectFromChatbot(redirectUrl?: string | null) {
  if (!redirectUrl || typeof window === "undefined") return false;
  if (!canAutoRedirectFromChatbot()) return false;

  window.location.href = redirectUrl;
  return true;
}

// Lấy GPS của user
function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000 },
    );
  });
}

// Hàm khôi phục các ký tự bị lỗi () do Backend/DB làm mất byte UTF-8
function fixVietnameseMojibake(text: string) {
  if (!text) return text;
  let fixed = text;
  // CHỈ thay thế các cụm từ dài và an toàn, KHÔNG thay thế ký tự đơn lẻ
  // để tránh làm hỏng cấu trúc JSON (như chữ 'n' trong 'null' hay 'action')
  const replacements: Record<string, string> = {
    // Cụm từ có chứa ký tự \ufffd ()
    "Nguy\ufffdn Hu\ufffd": "Nguyễn Huệ",
    "Nguy\ufffdn V\ufffdn Linh": "Nguyễn Văn Linh",
    "\ufffdi\ufffdn Bi\ufffdn Ph\ufffd": "Điện Biên Phủ",
    "Ph\ufffd\ufffdng H\ufffdi Ch\ufffdu": "Phường Hải Châu",
    "H\ufffda C\ufffd\ufffdng": "Hòa Cường",
    "Thanh Th\ufffdy": "Thanh Thủy",
    "Thanh B\ufffdnh": "Thanh Bình",
    "X\ufffda Kh\ufffdm \ufffd\ufffdc": "Xã Khâm Đức",
    "Th\ufffdnh ph\ufffd": "Thành phố",
    "H\ufffd Ch\ufffd Minh": "Hồ Chí Minh",
    "Th\ufffdc Gi\ufffdn": "Thạc Gián",
    "B\ufffdu H\ufffdc": "Bàu Hạc",
    "Thanh Kh\ufffd": "Thanh Khê",
    "\ufffd\ufffd N\ufffdng": "Đà Nẵng",
    "Vi\ufffdt Nam": "Việt Nam",
    "T\ufffd 4 \ufffd\ufffdn 10 ch\ufffd": "Từ 4 đến 10 chỗ",
    "Nguy\ufffdn": "Nguyễn",
    "Ph\ufffd\ufffdng": "Phường",
    "Kh\ufffdm \ufffd\ufffdc": "Khâm Đức",
    "Bi\ufffdn Ph\ufffd": "Biên Phủ",
    "Qu\ufffdn 1": "Quận 1",
    "B\ufffdi \ufffd\ufffd ": "Bãi đỗ ",
    "Qu\ufffdn": "Quận",
    "Ch\ufffd tr\ufffdng": "Chỗ trống",
    "Gi\ufffda": "Giá",
    "\ufffd/gi\ufffd": "đ/giờ",
    "\ufffd/gi": "đ/gi",
    "\ufffdnh gi\ufffda": "Đánh giá",

    // Cụm từ bị mất hẳn ký tự (khoảng trắng)
    "Nguyn Hu": "Nguyễn Huệ",
    "Nguyn Vn Linh": "Nguyễn Văn Linh",
    "in Bin Ph": "Điện Biên Phủ",
    "Phng Hi Chu": "Phường Hải Châu",
    "Ha Cng": "Hòa Cường",
    "Thanh Thy": "Thanh Thủy",
    "Thanh Bnh": "Thanh Bình",
    "X Khm c": "Xã Khâm Đức",
    "Thnh ph": "Thành phố",
    "H Ch Minh": "Hồ Chí Minh",
    "Thc Gin": "Thạc Gián",
    "Bu Hc": "Bàu Hạc",
    "Thanh Kh": "Thanh Khê",
    " Nng": "Đà Nẵng",
    "Vit Nam": "Việt Nam",
    "T 4 n 10 ch": "Từ 4 đến 10 chỗ",
    "Nguyn": "Nguyễn",
    "Phng": "Phường",
    "Khm c": "Khâm Đức",
    "Bin Ph": "Biên Phủ",
    "Qun 1": "Quận 1",
    "Bi  ": "Bãi đỗ ",
    "Qun": "Quận",
    "Ch tr ng": "Chỗ trống",
    " /giờ": "đ/giờ"
  };

  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    fixed = fixed.split(key).join(replacements[key]);
  }
  return fixed;
}

// Markdown Renderer Component cho Chatbot
const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  const lines = content.split('\n');
  const blocks = [];
  let currentTable: string[] = [];
  let currentText: string[] = [];

  for (let line of lines) {
    if (line.trim().startsWith('|')) {
      if (currentText.length) {
        blocks.push({ type: 'text', content: currentText.join('\n') });
        currentText = [];
      }
      currentTable.push(line);
    } else {
      if (currentTable.length) {
        blocks.push({ type: 'table', content: currentTable });
        currentTable = [];
      }
      currentText.push(line);
    }
  }
  if (currentText.length) blocks.push({ type: 'text', content: currentText.join('\n') });
  if (currentTable.length) blocks.push({ type: 'table', content: currentTable });

  return (
    <div className="uc-markdown">
      {blocks.map((block, i) => {
        if (block.type === 'table') {
          const tlines = block.content as string[];
          const contentLines = tlines.filter((l: string) => l.replace(/[\s|:\-]/g, '') !== '');
          if(contentLines.length < 2) return <div key={i}>{tlines.join('\n')}</div>;

          const header = contentLines[0].split('|').filter((_, idx, arr) => (idx > 0 && idx < arr.length - 1) || _.trim() !== '').map(c => c.trim());
          const rows = contentLines.slice(1);
          
          return (
            <div key={i} className="uc-table-wrapper">
              <table className="uc-table">
                <thead>
                  <tr>
                    {header.map((col, j) => <th key={j} dangerouslySetInnerHTML={{ __html: col.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, j) => {
                    const cells = row.split('|').filter((_, idx, arr) => (idx > 0 && idx < arr.length - 1) || _.trim() !== '').map(c => c.trim());
                    return (
                      <tr key={j}>
                        {cells.map((cell, k) => <td key={k} dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        } else {
          let html = (block.content as string)
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <div key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ whiteSpace: "pre-wrap", marginBottom: "4px" }} />;
        }
      })}
    </div>
  );
};

export default function UserChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { accessToken, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [hasUnread, setHasUnread] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [wakeBanner, setWakeBanner] = useState(false);
  const [userVehicles, setUserVehicles] = useState<VehicleChip[]>([]);
  const [dynamicChips, setDynamicChips] = useState<string[]>(QUICK_CHIPS);

  // Session management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);

  // Draggable / resizable state
  const [panelPos, setPanelPos] = useState<{ right: number; bottom: number }>({
    right: 24,
    bottom: 24,
  });
  const [panelSize, setPanelSize] = useState<{ width: number; height: number }>(
    { width: 420, height: 600 },
  );
  const [isPanelLarge, setIsPanelLarge] = useState(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, right: 24, bottom: 24 });
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    width: 420,
    height: 600,
  });
  const panelRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const voiceModeRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>("idle");

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    window.requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
    if (!open && messages[messages.length - 1]?.role === "assistant")
      setHasUnread(true);
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  // Drag handlers
  const onDragMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, label"))
      return;
    draggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: panelPos.right,
      bottom: panelPos.bottom,
    };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        setPanelPos({
          right: Math.max(0, dragStartRef.current.right - dx),
          bottom: Math.max(0, dragStartRef.current.bottom - dy),
        });
      }
      if (resizingRef.current) {
        const dx = e.clientX - resizeStartRef.current.mouseX;
        const dy = e.clientY - resizeStartRef.current.mouseY;
        setPanelSize({
          width: Math.max(
            320,
            Math.min(700, resizeStartRef.current.width - dx),
          ),
          height: Math.max(
            400,
            Math.min(900, resizeStartRef.current.height - dy),
          ),
        });
      }
    };
    const onUp = () => {
      draggingRef.current = false;
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
          ? { width: Math.min(760, window.innerWidth - 48), height: Math.min(860, window.innerHeight - 48) }
          : { width: 420, height: 600 },
      );
      setPanelPos({ right: 24, bottom: 24 });
      return next;
    });
  };

  // Mic input setup
  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (ev) =>
      setInput(
        Array.from(ev.results)
          .map((x) => x[0]?.transcript ?? "")
          .join(""),
      );
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
  }, []);

  // Wake word listener
  const startWakeListener = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    // Dừng instance cũ nếu có
    try {
      if (wakeRecognitionRef.current) wakeRecognitionRef.current.onend = null;
      wakeRecognitionRef.current?.stop();
    } catch {}
    const r = new SR();
    r.lang = "vi-VN";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (ev) => {
      const transcript = Array.from(ev.results)
        .map((x) => x[0]?.transcript ?? "")
        .join(" ");
      if (isWakeWord(transcript)) {
        r.stop();
        setOpen(true);
        setVoiceMode(true);
        voiceModeRef.current = true;
        setWakeBanner(true);
        window.setTimeout(() => setWakeBanner(false), 2200);
        setVoiceState("prompted");
        voiceStateRef.current = "prompted";
        speakText("Xin chào! Bạn muốn hỏi gì?", () => {
          startQuestionListener();
        });
      }
    };
    r.onend = () => {
      if (voiceStateRef.current === "wake-listening") {
        setTimeout(() => {
          try {
            r.start();
          } catch {}
        }, 300);
      }
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (voiceStateRef.current === "wake-listening") {
        setTimeout(() => startWakeListener(), 1000);
      }
    };
    try {
      r.start();
    } catch {}
    wakeRecognitionRef.current = r;
    setVoiceState("wake-listening");
  }, []);

  const startQuestionListener = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    const r = new SR();
    r.lang = "vi-VN";
    r.interimResults = false;
    r.continuous = false;
    setVoiceState("question-listening");
    r.onresult = async (ev) => {
      const question = Array.from(ev.results)
        .map((x) => x[0]?.transcript ?? "")
        .join("")
        .trim();
      if (question) {
        setVoiceState("speaking");
        await sendMessageVoice(question);
      }
    };
    r.onend = () => {
      if (
        voiceModeRef.current &&
        voiceStateRef.current === "question-listening"
      ) {
        setVoiceState("wake-listening");
        startWakeListener();
      }
    };
    r.onerror = () => {
      if (voiceModeRef.current) {
        setVoiceState("wake-listening");
        startWakeListener();
      }
    };
    try {
      r.start();
    } catch {}
  }, [startWakeListener]);

  useEffect(() => {
    if (voiceMode) return;
    window.speechSynthesis?.cancel();
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, [voiceMode]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(STATUS_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(
        data?.data?.running || data?.data?.models?.groq?.ok
          ? "connected"
          : "disconnected",
      );
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const t = setInterval(checkStatus, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [checkStatus]);

  // Fetch danh sách xe của user
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_BASE_URL}/chatbot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "xe cua toi" }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text: string = data?.data?.text || "";
        const lines = text.split("\n").filter((l) => /^\d+\./.test(l.trim()));
        const vehicles = lines
          .map((l, i) => {
            const match = l.match(/\d+\.\s*(.+?)\s*\((.+?)\)/);
            return match
              ? { label: `🚗 Xe ${i + 1}: ${match[1]}`, msg: `xe ${i + 1}` }
              : null;
          })
          .filter((vehicle): vehicle is VehicleChip => vehicle !== null);
        setUserVehicles(vehicles);
      })
      .catch(() => {});
  }, [accessToken]);

  // Session functions
  const loadSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE_URL}/chatbot/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setSessions(data?.data || []);
    } catch {}
  }, [accessToken]);

  const createNewSession = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_BASE_URL}/chatbot/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: `Cuộc trò chuyện ${new Date().toLocaleString("vi-VN")}`,
        }),
      });
      const data = await r.json();
      const newSession = data?.data;
      if (newSession?.id) {
        setCurrentSessionId(newSession.id);
        setMessages([WELCOME_MSG]);
        messagesRef.current = [WELCOME_MSG];
        setSessions((prev) => [newSession, ...prev]);
        setShowSessions(false);
      }
    } catch {}
  }, [accessToken]);

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      if (!accessToken) return;
      try {
        const r = await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await r.json();
        const session = data?.data as ChatSession | undefined;
        if (session?.messages?.length) {
          const msgs: Message[] = [
            WELCOME_MSG,
            ...session.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              type: m.type,
              data: m.data,
            })),
          ];
          setMessages(msgs);
          messagesRef.current = msgs;
        } else {
          setMessages([WELCOME_MSG]);
          messagesRef.current = [WELCOME_MSG];
        }
        setCurrentSessionId(sessionId);
        setShowSessions(false);
      } catch {}
    },
    [accessToken],
  );

  const deleteSessionById = useCallback(
    async (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!accessToken) return;
      try {
        await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([WELCOME_MSG]);
          messagesRef.current = [WELCOME_MSG];
        }
      } catch {}
    },
    [accessToken, currentSessionId],
  );

  // Load sessions khi mở chatbot
  useEffect(() => {
    if (open && accessToken) {
      loadSessions();
      // Tạo session mới nếu chưa có
      if (!currentSessionId) createNewSession();
    }
  }, [open, accessToken]);

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
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept": "application/json; charset=utf-8"
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      let context: { userLat?: number; userLng?: number } = {};
      if (/gần|nearby|gan/i.test(content)) {
        const loc = await getUserLocation();
        if (loc) context = { userLat: loc.lat, userLng: loc.lng };
      }
      // Dùng session endpoint nếu có sessionId, ngược lại dùng chat thường
      const url = currentSessionId
        ? `${API_BASE_URL}/chatbot/sessions/${currentSessionId}/chat`
        : API_URL;
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          context,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const response = await resp.json();
      const responseData = response?.data || response;
      const parkingPayload =
        responseData?.action === "list_parking"
          ? responseData?.lots
            ? responseData
            : responseData?.data
          : responseData?.data?.action === "list_parking"
            ? responseData.data
            : null;
      if (parkingPayload?.lots) {
        const msg: Message = {
          role: "assistant",
          type: "parking-list",
          content:
            response?.data?.text || response?.text || "Tìm thấy các bãi sau:",
          data: { lots: parkingPayload.lots, criteria: parkingPayload.criteria },
        };
        setMessages([...messagesRef.current, msg]);
        messagesRef.current = [...messagesRef.current, msg];
        setLoading(false);
        return;
      }
      // Xử lý redirect - check cả data.action và action (BE có thể trả ở 2 chỗ)
      const redirectAction =
        responseData?.action === "redirect"
          ? responseData
          : responseData?.data?.action === "redirect"
            ? responseData.data
            : null;
      if (redirectAction) {
        const redirectUrl =
          redirectAction.redirectUrl || redirectAction.data?.url;
        const redirectMsg =
          redirectAction.text ||
          redirectAction.message ||
          "🔄 Đang chuyển sang trang đặt chỗ...";
        const msg: Message = { role: "assistant", content: redirectMsg };
        setMessages([...messagesRef.current, msg]);
        messagesRef.current = [...messagesRef.current, msg];
        let didRedirect = false;
        const runRedirect = () => {
          if (didRedirect) return;
          didRedirect = true;
          const redirected = redirectFromChatbot(redirectUrl);
          if (!redirected && redirectUrl) {
            const consentMsg: Message = {
              role: "assistant",
              content:
                "Bạn chưa đồng ý chuyển trang tự động. Khi cần đặt chỗ, hãy gửi lại yêu cầu và xác nhận chuyển trang.",
            };
            setMessages([...messagesRef.current, consentMsg]);
            messagesRef.current = [...messagesRef.current, consentMsg];
          }
        };
        if (voiceModeRef.current) speakText(redirectMsg, runRedirect);
        setTimeout(() => {
          runRedirect();
        }, 1800);
        setLoading(false);
        return;
      }
      const text2 =
        responseData?.text ||
        responseData?.message ||
        "Không có phản hồi";
      const assistantMsg: Message = { role: "assistant", content: text2 };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];

      // Cập nhật gợi ý nhanh nếu AI đang gom thông tin đặt chỗ
      if (responseData?.action === "collect_booking" && responseData.data?.suggestions) {
        const suggestions = responseData.data.suggestions;
        const missing = responseData.data.missing || [];
        let newChips: string[] = [];
        if (missing.includes('ten bai do') && suggestions.parkingLots?.length) {
          newChips.push(...suggestions.parkingLots.map((_: any, i: number) => `bãi ${i + 1}`));
        } else if (missing.includes('thoi gian vao/ra') && suggestions.timeExamples?.length) {
          newChips.push(...suggestions.timeExamples);
        } else if (missing.includes('xe hoac bien so') && suggestions.vehicles?.length) {
          newChips.push(...suggestions.vehicles.map((v: any) => v.label));
        } else if (missing.includes('phuong thuc thanh toan') && suggestions.payments?.length) {
          newChips.push(...suggestions.payments.map((p: any) => p.label));
        }
        setDynamicChips(newChips.length > 0 ? newChips : QUICK_CHIPS);
      } else {
        setDynamicChips(QUICK_CHIPS);
      }

      // Nếu voice mode đang bật → đọc câu trả lời
      if (voiceModeRef.current) {
        setVoiceState("speaking");
        speakText(text2, () => {
          setVoiceState("idle");
        });
      }
    } catch {
      const errMsg: Message = {
        role: "assistant",
        content: "❌ Lỗi kết nối. Vui lòng thử lại.",
      };
      setMessages([...messagesRef.current, errMsg]);
      messagesRef.current = [...messagesRef.current, errMsg];
    } finally {
      setLoading(false);
    }
  }

  async function sendMessageVoice(content: string) {
    if (!content || loading) return;
    const userMsg: Message = { role: "user", content };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setLoading(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept": "application/json; charset=utf-8"
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const url = currentSessionId
        ? `${API_BASE_URL}/chatbot/sessions/${currentSessionId}/chat`
        : API_URL;
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content }],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const response = await resp.json();
      const responseData = response?.data || response;
      const redirectAction =
        responseData?.action === "redirect"
          ? responseData
          : responseData?.data?.action === "redirect"
            ? responseData.data
            : null;
      if (redirectAction) {
        const redirectUrl =
          redirectAction.redirectUrl || redirectAction.data?.url;
        const redirectMsg =
          redirectAction.text ||
          redirectAction.message ||
          "Dang chuyen sang trang dat cho...";
        const assistantMsg: Message = { role: "assistant", content: redirectMsg };
        setMessages([...messagesRef.current, assistantMsg]);
        messagesRef.current = [...messagesRef.current, assistantMsg];
        setLoading(false);
        setVoiceState("speaking");
        let didRedirect = false;
        const runRedirect = () => {
          if (didRedirect) return;
          didRedirect = true;
          const redirected = redirectFromChatbot(redirectUrl);
          if (!redirected && redirectUrl) {
            const consentMsg: Message = {
              role: "assistant",
              content:
                "Bạn chưa đồng ý chuyển trang tự động. Khi cần đặt chỗ, hãy gửi lại yêu cầu và xác nhận chuyển trang.",
            };
            setMessages([...messagesRef.current, consentMsg]);
            messagesRef.current = [...messagesRef.current, consentMsg];
          }
          setVoiceState("idle");
        };
        speakText(redirectMsg, runRedirect);
        setTimeout(runRedirect, 2500);
        return;
      }
      const text2 =
        response?.data?.text ||
        response?.text ||
        response?.message ||
        "Không có phản hồi";
      const assistantMsg: Message = { role: "assistant", content: text2 };
      setMessages([...messagesRef.current, assistantMsg]);
      messagesRef.current = [...messagesRef.current, assistantMsg];
      
      // Cập nhật gợi ý nhanh nếu AI đang gom thông tin đặt chỗ

      if (responseData?.action === "collect_booking" && responseData.data?.suggestions) {
        const suggestions = responseData.data.suggestions;
        const missing = responseData.data.missing || [];
        let newChips: string[] = [];
        if (missing.includes('ten bai do') && suggestions.parkingLots?.length) {
          newChips.push(...suggestions.parkingLots.map((_: any, i: number) => `bãi ${i + 1}`));
        } else if (missing.includes('thoi gian vao/ra') && suggestions.timeExamples?.length) {
          newChips.push(...suggestions.timeExamples);
        } else if (missing.includes('xe hoac bien so') && suggestions.vehicles?.length) {
          newChips.push(...suggestions.vehicles.map((v: any) => v.label));
        } else if (missing.includes('phuong thuc thanh toan') && suggestions.payments?.length) {
          newChips.push(...suggestions.payments.map((p: any) => p.label));
        }
        setDynamicChips(newChips.length > 0 ? newChips : QUICK_CHIPS);
      } else {
        setDynamicChips(QUICK_CHIPS);
      }

      setLoading(false);
      setVoiceState("speaking");
      speakText(text2, () => {
        setVoiceState("idle");
      });
    } catch {
      const errMsg: Message = {
        role: "assistant",
        content: "❌ Lỗi kết nối. Vui lòng thử lại.",
      };
      setMessages([...messagesRef.current, errMsg]);
      messagesRef.current = [...messagesRef.current, errMsg];
      setLoading(false);
      if (voiceModeRef.current) setVoiceState("idle");
    }
  }

  function clearHistory() {
    setMessages([WELCOME_MSG]);
    messagesRef.current = [WELCOME_MSG];
    // Tạo session mới thay vì xóa
    if (accessToken) createNewSession();
  }
  function removeMessage(index: number) {
    setMessages((prev) => {
      const u = prev.filter((_, i) => i !== index);
      messagesRef.current = u;
      return u;
    });
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
  const voiceStateLabel: Record<VoiceState, string> = {
    idle: "",
    "wake-listening": "",
    prompted: "🤖 Bạn muốn hỏi gì?",
    "question-listening": "👂 Đang nghe câu hỏi...",
    speaking: "🔊 Đang trả lời...",
  };

  // Render parking list theo criteria
  function renderParkingList(m: Message, i: number) {
    const lots = m.data?.lots || [];
    const criteria = m.data?.criteria;
    if (!lots.length) return null;

    const isBest = criteria === "best";
    const isNearest = criteria === "nearest";
    const isCheapest = criteria === "price_cheapest";

    const criteriaLabel = isBest
      ? "⭐ Phù hợp nhất"
      : isNearest
        ? "📍 Gần nhất"
        : isCheapest
          ? "💰 Giá rẻ nhất"
          : "🔍 Kết quả tìm kiếm";
    const criteriaDesc = isBest
      ? "Điểm tổng hợp: đánh giá (40%) + chỗ trống (30%) + giá rẻ (30%)"
      : isNearest
        ? "Sắp xếp theo khoảng cách từ vị trí của bạn"
        : isCheapest
          ? "Sắp xếp theo giá/giờ tăng dần, ưu tiên còn chỗ"
          : "Danh sách bãi đỗ xe";

    const primary = lots[0];
    const others = isBest ? [] : lots.slice(1); // best chỉ hiện 1 card, không có bảng

    return (
      <div className="uc-parking-list">
        {/* Header criteria */}
        <div className="uc-criteria-header">
          <span className="uc-criteria-label">{criteriaLabel}</span>
          <span className="uc-criteria-desc">{criteriaDesc}</span>
          <button
            className="uc-parking-card-close"
            onClick={() => removeMessage(i)}
          >
            ✕
          </button>
        </div>

        {/* Primary card */}
        <div className="uc-parking-card">
          <div
            className="uc-parking-card-row"
            style={{ alignItems: "flex-start" }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#ecfccb", fontSize: 14 }}>
                {primary.name}
              </div>
              <div className="uc-parking-card-meta">{primary.address}</div>
            </div>
            {(primary.avgRating ?? 0) > 0 && (
              <div
                style={{
                  background: "rgba(34,197,94,0.15)",
                  borderRadius: 8,
                  padding: "3px 8px",
                  fontSize: 12,
                  color: "#86efac",
                  flexShrink: 0,
                }}
              >
                ⭐ {Number(primary.avgRating).toFixed(1)}
              </div>
            )}
          </div>
          <div className="uc-parking-card-row" style={{ marginTop: 8 }}>
            <div
              className="uc-parking-card-meta"
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              <span>
                💰 {(primary.hourly_rate || 20000).toLocaleString("vi-VN")}đ/giờ
              </span>
              <span>
                🅿️ {primary.available_slots ?? "?"}/{primary.total_slots ?? "?"}{" "}
                chỗ
              </span>
              {primary.distance_km != null && (
                <span>📍 {primary.distance_km} km</span>
              )}
            </div>
            <div className="uc-parking-card-actions">
              <button
                className="uc-btn-detail"
                onClick={() =>
                  (window.location.href = `/users/detailParking/${primary.id}`)
                }
              >
                Chi tiết
              </button>
              <button
                className="uc-btn-book"
                onClick={() =>
                  (window.location.href = `/users/myBooking/${primary.id}`)
                }
              >
                Đặt ngay
              </button>
            </div>
          </div>
          {isBest && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "#4ade80",
                background: "rgba(34,197,94,0.08)",
                borderRadius: 6,
                padding: "4px 8px",
              }}
            >
              💡 Được chọn dựa trên điểm tổng hợp cao nhất trong tất cả bãi đang
              hoạt động
            </div>
          )}
        </div>

        {/* Table các bãi còn lại */}
        {others.length > 0 && (
          <div className="uc-parking-secondary">
            <div className="uc-parking-secondary-title">
              Các bãi khác ({others.length})
            </div>
            <table className="uc-parking-table">
              <thead>
                <tr>
                  <th>Tên bãi</th>
                  <th>💰/h</th>
                  <th>🅿️</th>
                  {others[0]?.distance_km != null && <th>📍 km</th>}
                  <th>⭐</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {others.map((lot) => (
                  <tr key={lot.id}>
                    <td
                      style={{
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lot.name}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {(lot.hourly_rate || 20000).toLocaleString("vi-VN")}đ
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {lot.available_slots ?? "?"}/{lot.total_slots ?? "?"}
                    </td>
                    {lot.distance_km != null && (
                      <td style={{ whiteSpace: "nowrap" }}>
                        {lot.distance_km}km
                      </td>
                    )}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {(lot.avgRating ?? 0) > 0
                        ? Number(lot.avgRating).toFixed(1)
                        : "-"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="uc-btn-detail"
                        onClick={() =>
                          (window.location.href = `/users/detailParking/${lot.id}`)
                        }
                      >
                        Chi tiết
                      </button>
                      <button
                        className="uc-btn-book"
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
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .uc * { box-sizing: border-box; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes ucFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ucWakePop { 0%{opacity:0; transform:translate(-50%,-46%) scale(.92);} 15%,85%{opacity:1; transform:translate(-50%,-50%) scale(1);} 100%{opacity:0; transform:translate(-50%,-54%) scale(.98);} }
        .uc-wake-banner { position:fixed; left:50%; top:28%; z-index:100020; transform:translate(-50%,-50%); min-width:min(520px, calc(100vw - 32px)); padding:28px 32px; border-radius:28px; background:rgba(5,18,31,.92); border:1px solid rgba(34,197,94,.38); box-shadow:0 28px 80px rgba(0,0,0,.48), 0 0 0 10px rgba(34,197,94,.08); color:#f0fdf4; text-align:center; animation:ucWakePop 2.2s ease both; backdrop-filter:blur(14px); }
        .uc-wake-title { font-size:34px; line-height:1.05; font-weight:800; }
        .uc-wake-sub { margin-top:8px; font-size:14px; color:#86efac; }
        .uc-panel {
          position: fixed; background: #070f1c; border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.13);
          display: flex; flex-direction: column; overflow: hidden; z-index: 100010;
          animation: ucFadeIn 0.22s ease; user-select: none;
        }
        .uc-drag-handle { cursor: grab; }
        .uc-drag-handle:active { cursor: grabbing; }
        .uc-resize-handle {
          position: absolute; top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize;
          background: linear-gradient(135deg, rgba(34,197,94,0.3) 0%, transparent 60%);
          border-radius: 20px 0 0 0;
        }
        .uc-resize-handle::after {
          content: "⠿"; position: absolute; top: 2px; left: 3px; font-size: 10px; color: rgba(34,197,94,0.5);
        }
        @media(max-width:480px){ .uc-panel{ right:0!important; left:0!important; bottom:0!important; width:100%!important; height:72dvh!important; border-radius:18px 18px 0 0; } }
        .uc-hdr { padding: 10px 14px 8px; background: linear-gradient(160deg,#022c1a 0%,#053d28 100%); border-bottom: 1px solid rgba(34,197,94,0.14); flex-shrink: 0; }
        .uc-hdr-row { display:flex; align-items:center; justify-content:space-between; }
        .uc-brand { display:flex; align-items:center; gap:9px; }
        .uc-av { width:34px; height:34px; border-radius:10px; background: linear-gradient(135deg,#15803d,#22c55e); display:flex; align-items:center; justify-content:center; }
        .uc-bname { font-size:14px; font-weight:700; color:#f0fdf4; }
        .uc-bsub { font-size:11px; color:#86efac; margin-top:1px; }
        .uc-role-badge { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#86efac; font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; }
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
        .uc-bub { max-width:85%; padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.5; word-break:break-word; white-space:pre-wrap; }
        .uc-bub.b { background:rgba(255,255,255,.05); color:#dff5ea; border-bottom-left-radius:4px; border:1px solid rgba(34,197,94,.1); }
        .uc-bub.u { background:linear-gradient(135deg,#15803d,#22c55e); color:#fff; border-bottom-right-radius:4px; }
        .uc-tdots { display:flex; gap:4px; padding:6px 2px; }
        .uc-td { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:ucBounce 1.2s infinite; }
        .uc-td:nth-child(2){ animation-delay:.22s; } .uc-td:nth-child(3){ animation-delay:.44s; }
        @keyframes ucBounce { 0%,60%,100%{ transform:translateY(0); opacity:.35; } 30%{ transform:translateY(-5px); opacity:1; } }
        /* Markdown / Tables */
        .uc-markdown { display: flex; flex-direction: column; gap: 4px; }
        .uc-markdown h1, .uc-markdown h2, .uc-markdown h3 { font-weight: 700; color: #a7f3d0; margin-top: 8px; margin-bottom: 4px; }
        .uc-markdown strong { font-weight: 700; color: #a7f3d0; }
        .u .uc-markdown strong { color: #fff; text-shadow: 0 0 2px rgba(0,0,0,0.3); }
        .uc-table-wrapper { margin: 8px 0; overflow-x: auto; border-radius: 8px; border: 1px solid rgba(34,197,94,0.15); background: rgba(0,0,0,0.2); }
        .uc-table-wrapper::-webkit-scrollbar { height: 4px; }
        .uc-table-wrapper::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); border-radius: 4px; }
        .uc-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
        .uc-table th { background: rgba(34,197,94,0.15); color: #86efac; padding: 8px 12px; font-weight: 600; border-bottom: 1px solid rgba(34,197,94,0.2); white-space: nowrap; }
        .uc-table td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2f5ea; }
        .uc-table tr:last-child td { border-bottom: none; }
        .uc-table tr:hover td { background: rgba(34,197,94,0.05); }
        .u .uc-table-wrapper { border-color: rgba(255,255,255,0.2); }
        .u .uc-table th { background: rgba(255,255,255,0.15); color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .u .uc-table td { color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .u .uc-table tr:hover td { background: rgba(255,255,255,0.1); }
        
        .uc-chips-wrap { flex-shrink:0; padding:6px 12px; border-top:1px solid rgba(34,197,94,.08); }
        .uc-clabel { font-size:10px; color:#3a6b4a; letter-spacing:.6px; text-transform:uppercase; margin-bottom:5px; }
        .uc-chips { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; scrollbar-width:thin; }
        .uc-chip { flex-shrink:0; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); color:#86efac; padding:5px 12px; border-radius:20px; font-size:12px; cursor:pointer; white-space:nowrap; }
        .uc-chip:hover { background:rgba(34,197,94,.15); }
        /* Parking list */
        .uc-parking-list { margin:4px 0; background:rgba(255,255,255,0.02); border-radius:12px; overflow:hidden; }
        .uc-criteria-header { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(34,197,94,0.08); border-bottom:1px solid rgba(34,197,94,0.1); }
        .uc-criteria-label { font-size:12px; font-weight:700; color:#86efac; flex-shrink:0; }
        .uc-criteria-desc { font-size:10px; color:#3a6b4a; flex:1; }
        .uc-parking-card { background:rgba(16,46,28,0.85); border:1px solid rgba(34,197,94,0.2); border-radius:0; padding:12px; }
        .uc-parking-card-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between; }
        .uc-parking-card-meta { color:#c7f9cc; font-size:12px; line-height:1.5; }
        .uc-parking-card-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .uc-parking-card-close { border:none; background:transparent; color:#9ef08d; cursor:pointer; font-size:12px; padding:2px 6px; border-radius:6px; margin-left:auto; }
        .uc-parking-secondary { padding:10px 12px; }
        .uc-parking-secondary-title { font-size:11px; color:#a7f3d0; font-weight:700; margin-bottom:6px; }
        .uc-parking-table { width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed; }
        .uc-parking-table th, .uc-parking-table td { padding:6px 5px; text-align:left; border-bottom:1px solid rgba(34,197,94,0.08); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }
        .uc-parking-table th { background:rgba(34,197,94,0.08); color:#86efac; font-weight:600; white-space:nowrap; }
        .uc-parking-table th:first-child { width:35%; }
        .uc-parking-table td:last-child { white-space:nowrap; overflow:visible; }
        .uc-btn-detail, .uc-btn-book { background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); color:#bbf7d0; padding:3px 6px; border-radius:5px; cursor:pointer; margin-right:2px; font-size:10px; white-space:nowrap; display:inline-block; }
        /* Input */
        .uc-inp-area { flex-shrink:0; padding:8px 12px 10px; border-top:1px solid rgba(34,197,94,.08); }
        .uc-inp-box { display:flex; gap:8px; align-items:flex-end; background:rgba(255,255,255,.04); border:1px solid rgba(34,197,94,.15); border-radius:16px; padding:6px 8px 6px 14px; }
        .uc-ta { flex:1; background:transparent; border:none; outline:none; color:#e2f5ea; font-size:14px; resize:none; max-height:90px; line-height:1.4; }
        .uc-ta::placeholder{ color:#3a5c47; }
        .uc-mic { background:transparent; border:none; cursor:pointer; padding:4px; color:#3a6b4a; border-radius:6px; transition:all 0.2s; }
        .uc-mic:hover { color:#22c55e; background:rgba(34,197,94,0.1); }
        .uc-mic.on { color:#ef4444; background:rgba(239,68,68,0.1); animation:ucPulse 1s infinite; }
        @keyframes ucPulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .uc-send { background:linear-gradient(135deg,#16a34a,#22c55e); border:none; width:34px; height:34px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .uc-send:disabled { opacity:0.4; cursor:not-allowed; }
        .uc-hint { font-size:9px; color:#243d2c; text-align:center; margin-top:5px; }
        /* FAB */
        .uc-fab { position:fixed; right:24px; bottom:24px; z-index:100011; width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#16a34a,#22c55e); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 20px rgba(34,197,94,.4); transition:all 0.2s; border:none; }
        .uc-fab:hover { transform:scale(1.08); }
        .uc-fab.hidden { opacity:0; visibility:hidden; transform:scale(0.8); pointer-events:none; }
        .uc-badge { position:absolute; top:-3px; right:-3px; width:16px; height:16px; border-radius:50%; background:#ef4444; border:2px solid #070f1c; font-size:9px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
        /* Voice */
        .uc-voice-row { display:flex; align-items:center; justify-content:space-between; margin-top:8px; padding:5px 10px; background:rgba(34,197,94,0.06); border-radius:8px; border:1px solid rgba(34,197,94,0.12); }
        .uc-voice-label { font-size:11px; color:#86efac; display:flex; align-items:center; gap:5px; }
        .uc-toggle { position:relative; width:38px; height:20px; cursor:pointer; }
        .uc-toggle input { opacity:0; width:0; height:0; }
        .uc-toggle-slider { position:absolute; inset:0; background:#1a3a28; border-radius:20px; transition:.25s; border:1px solid rgba(34,197,94,.2); }
        .uc-toggle-slider:before { content:""; position:absolute; width:14px; height:14px; left:2px; top:2px; background:#4a7a5a; border-radius:50%; transition:.25s; }
        .uc-toggle input:checked + .uc-toggle-slider { background:#15803d; border-color:#22c55e; }
        .uc-toggle input:checked + .uc-toggle-slider:before { transform:translateX(18px); background:#fff; }
        .uc-voice-status { font-size:10px; color:#22c55e; text-align:center; padding:3px 0 1px; min-height:16px; }
        @keyframes ucWavePulse { 0%,100%{transform:scaleY(0.4);} 50%{transform:scaleY(1);} }
        .uc-wave { display:inline-flex; align-items:center; gap:2px; height:14px; }
        .uc-wave span { display:inline-block; width:3px; background:#22c55e; border-radius:2px; animation:ucWavePulse 0.8s infinite; }
        .uc-wave span:nth-child(2){animation-delay:.15s;height:10px;}
        .uc-wave span:nth-child(3){animation-delay:.3s;height:14px;}
        .uc-wave span:nth-child(4){animation-delay:.15s;height:10px;}
        .uc-wave span:nth-child(5){animation-delay:0s;height:6px;}
        /* Sessions panel */
        .uc-sessions-overlay { position:absolute; inset:0; background:#070f1c; z-index:10; display:flex; flex-direction:column; border-radius:20px; overflow:hidden; }
        .uc-sessions-hdr { padding:12px 14px; background:linear-gradient(160deg,#022c1a,#053d28); border-bottom:1px solid rgba(34,197,94,0.14); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .uc-sessions-title { font-size:14px; font-weight:700; color:#f0fdf4; }
        .uc-sessions-list { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px; }
        .uc-sessions-list::-webkit-scrollbar { width:4px; }
        .uc-sessions-list::-webkit-scrollbar-thumb { background:rgba(34,197,94,.3); border-radius:4px; }
        .uc-session-item { display:flex; align-items:center; gap:8px; padding:10px 12px; background:rgba(255,255,255,.04); border:1px solid rgba(34,197,94,.1); border-radius:10px; cursor:pointer; transition:all 0.15s; }
        .uc-session-item:hover { background:rgba(34,197,94,.08); border-color:rgba(34,197,94,.25); }
        .uc-session-item.active { background:rgba(34,197,94,.12); border-color:rgba(34,197,94,.4); }
        .uc-session-info { flex:1; min-width:0; }
        .uc-session-name { font-size:12px; font-weight:600; color:#dff5ea; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .uc-session-date { font-size:10px; color:#3a6b4a; margin-top:2px; }
        .uc-session-del { background:transparent; border:none; color:#3a6b4a; cursor:pointer; padding:3px; border-radius:4px; flex-shrink:0; }
        .uc-session-del:hover { color:#ef4444; background:rgba(239,68,68,.1); }
        .uc-new-session-btn { margin:10px; padding:10px; background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px; color:#fff; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; flex-shrink:0; }
      `}</style>

      <div className="uc">
        {open && (
          <div
            ref={panelRef}
            className="uc-panel"
            style={{
              right: panelPos.right,
              bottom: panelPos.bottom,
              width: panelSize.width,
              height: panelSize.height,
            }}
          >
            {/* Resize handle (góc trên trái) */}
            <div
              className="uc-resize-handle"
              onMouseDown={onResizeMouseDown}
              title="Kéo để thay đổi kích thước"
            />

            {/* Sessions overlay */}
            {showSessions && (
              <div className="uc-sessions-overlay">
                <div className="uc-sessions-hdr">
                  <span className="uc-sessions-title">
                    💬 Lịch sử trò chuyện
                  </span>
                  <button
                    className="uc-ibtn"
                    onClick={() => setShowSessions(false)}
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
                <div className="uc-sessions-list">
                  {sessions.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#3a6b4a",
                        fontSize: 12,
                        padding: 20,
                      }}
                    >
                      Chưa có cuộc trò chuyện nào
                    </div>
                  )}
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`uc-session-item${s.id === currentSessionId ? " active" : ""}`}
                      onClick={() => loadSessionMessages(s.id)}
                    >
                      <div style={{ fontSize: 16 }}>💬</div>
                      <div className="uc-session-info">
                        <div className="uc-session-name">
                          {s.title || "Cuộc trò chuyện"}
                        </div>
                        <div className="uc-session-date">
                          {s.updatedAt
                            ? new Date(s.updatedAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : ""}
                        </div>
                      </div>
                      <button
                        className="uc-session-del"
                        onClick={(e) => deleteSessionById(s.id, e)}
                        title="Xóa"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="uc-new-session-btn"
                  onClick={createNewSession}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Cuộc trò chuyện mới
                </button>
              </div>
            )}

            {/* Header - drag handle */}
            <div
              className="uc-hdr uc-drag-handle"
              onMouseDown={onDragMouseDown}
            >
              <div className="uc-hdr-row">
                <div className="uc-brand">
                  <div className="uc-av">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="uc-bname">GoPark Assistant</div>
                    <div className="uc-bsub">
                      {user?.profile?.name
                        ? `Xin chào, ${user.profile.name}`
                        : "Hỗ trợ người dùng 24/7"}
                    </div>
                  </div>
                </div>
                <div className="uc-acts">
                  <span className="uc-role-badge">👤 USER</span>
                  <div className="uc-pill">
                    <div
                      className="uc-dot"
                      style={{ background: statusDot[status] }}
                    />
                    {statusLabel[status]}
                  </div>
                  <button
                    className="uc-ibtn"
                    title="Lịch sử chat"
                    onClick={() => setShowSessions(true)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button
                    className="uc-ibtn"
                    onClick={clearHistory}
                    title="Cuộc trò chuyện mới"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button
                    className="uc-ibtn"
                    onClick={togglePanelSize}
                    title={isPanelLarge ? "Thu nho chatbot" : "Phong to chatbot"}
                  >
                    {isPanelLarge ? (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M8 3v5H3" />
                        <path d="M16 21v-5h5" />
                        <path d="M3 8l6-6" />
                        <path d="M21 16l-6 6" />
                      </svg>
                    ) : (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9V3h6" />
                        <path d="M21 15v6h-6" />
                        <path d="M3 3l7 7" />
                        <path d="M21 21l-7-7" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="uc-ibtn"
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
              {/* AI speech toggle */}
              <div className="uc-voice-row">
                <span className="uc-voice-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                  Đọc câu trả lời
                </span>
                <label className="uc-toggle">
                  <input
                    type="checkbox"
                    checked={voiceMode}
                    onChange={(e) => setVoiceMode(e.target.checked)}
                  />
                  <span className="uc-toggle-slider" />
                </label>
              </div>
              <div className="uc-voice-status">
                {(voiceState === "wake-listening" ||
                  voiceState === "question-listening") && (
                  <span className="uc-wave">
                    <span style={{ height: 6 }} />
                    <span />
                    <span />
                    <span />
                    <span style={{ height: 6 }} />
                  </span>
                )}{" "}
                {voiceStateLabel[voiceState]}
              </div>
            </div>

            {/* Messages */}
            <div className="uc-msgs">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`uc-row${m.role === "user" ? " u" : ""}`}
                >
                  {m.role === "assistant" && (
                    <div className="uc-mav">
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
                  <div className={`uc-bub${m.role === "user" ? " u" : " b"}`}>
                    {m.type === "parking-list" ? (
                      <div>
                        <MarkdownRenderer content={m.content} />
                        {renderParkingList(m, i)}
                      </div>
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="uc-row">
                  <div className="uc-mav">
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
                  <div className="uc-bub b">
                    <div className="uc-tdots">
                      <div className="uc-td" />
                      <div className="uc-td" />
                      <div className="uc-td" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            <div className="uc-chips-wrap">
              <div className="uc-clabel">💡 Gợi ý nhanh</div>
              <div className="uc-chips">
                {dynamicChips.map((label) => (
                  <button
                    key={label}
                    className="uc-chip"
                    onClick={() => sendMessage(label)}
                  >
                    {label}
                  </button>
                ))}
                {userVehicles.length > 0 &&
                  userVehicles.map((v) => (
                    <button
                      key={v.msg}
                      className="uc-chip"
                      style={{
                        borderColor: "rgba(34,197,94,0.4)",
                        background: "rgba(34,197,94,0.12)",
                      }}
                      onClick={() => sendMessage(`đặt bãi với ${v.msg}`)}
                    >
                      {v.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Input */}
            <div className="uc-inp-area">
              <div className="uc-inp-box">
                <textarea
                  className="uc-ta"
                  rows={1}
                  value={input}
                  placeholder={
                    voiceMode
                      ? "Nhập câu hỏi, hệ thống sẽ đọc câu trả lời..."
                      : "Hỏi về bãi đỗ, đặt chỗ, ví tiền..."
                  }
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  className={`uc-mic${listening ? " on" : ""}`}
                  title={listening ? "Đang nghe, nhấn để dừng" : "Nhấn để nói thành văn bản"}
                  onClick={() => {
                    const r = recognitionRef.current;
                    if (!r) return;
                    if (listening) {
                      r.stop();
                    } else {
                      try {
                        r.start();
                      } catch {
                        const SR = getSpeechRecognition();
                        if (SR) {
                          const nr = new SR();
                          nr.lang = "vi-VN";
                          nr.interimResults = true;
                          nr.onresult = (ev) =>
                            setInput(
                              Array.from(ev.results)
                                .map((x) => x[0]?.transcript ?? "")
                                .join(""),
                            );
                          nr.onstart = () => setListening(true);
                          nr.onend = () => setListening(false);
                          recognitionRef.current = nr;
                          nr.start();
                        }
                      }
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={listening ? "#ef4444" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
                <button
                  className="uc-send"
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
              <div className="uc-hint">
                Enter gửi · Shift+Enter xuống dòng · 🎙️ mic để nói
              </div>
            </div>
          </div>
        )}

        <button
          className={`uc-fab${open ? " hidden" : ""}`}
          onClick={() => setOpen(true)}
        >
          {hasUnread && <span className="uc-badge">!</span>}
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
