"use client";

import React, { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant" | "system"; content: string };

const API_URL = process.env.NEXT_PUBLIC_CHATBOT_API || "http://localhost:8080/api/v1/chatbot/chat";
const STATUS_URL = process.env.NEXT_PUBLIC_CHATBOT_STATUS || "http://localhost:8080/api/v1/chatbot/status";

export default function Chatbot() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>(() => {
		try {
			const raw = localStorage.getItem("gopark_chat_history");
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	});
	const [loading, setLoading] = useState(false);
	const [listening, setListening] = useState(false);
	const [status, setStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
	const recognitionRef = useRef<any>(null);
	const messagesRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		localStorage.setItem("gopark_chat_history", JSON.stringify(messages));
		messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		// Setup SpeechRecognition if available
		const win: any = typeof window !== "undefined" ? window : {};
		const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition || null;
		if (SpeechRecognition) {
			const r = new SpeechRecognition();
			r.lang = "vi-VN";
			r.interimResults = true;
			r.continuous = false;
			r.onresult = (ev: any) => {
				const transcript = Array.from(ev.results)
					.map((r: any) => r[0].transcript)
					.join("");
				setInput(transcript);
			};
			r.onstart = () => setListening(true);
			r.onend = () => setListening(false);
			recognitionRef.current = r;
		}
	}, []);

	useEffect(() => {
		let mounted = true;
		async function check() {
			try {
				const res = await fetch(STATUS_URL);
				if (!res.ok) throw new Error('status fetch failed');
				const data = await res.json();
				const running = data?.running ?? false;
				const groqOk = data?.models?.groq?.ok ?? false;
				if (mounted) setStatus(running || groqOk ? 'connected' : 'disconnected');
			} catch (e) {
				if (mounted) setStatus('disconnected');
			}
		}
		check();
		const id = setInterval(check, 20000);
		return () => {
			mounted = false;
			clearInterval(id);
		};
	}, []);

	const suggestions = [
		"Tôi muốn đặt chỗ ở gần trung tâm thành phố",
		"Bãi đỗ rẻ nhất xung quanh khu A",
		"Mở rộng giờ hoạt động của bãi đỗ B",
	];

	async function sendMessage(autoclear = true) {
		if (!input.trim()) return;
		const userMsg: Message = { role: "user", content: input.trim() };
		setMessages((m) => [...m, userMsg]);
		if (autoclear) setInput("");
		setLoading(true);

		try {
			const body = JSON.stringify([userMsg]);
			const resp = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
			});
			const data = await resp.json();
			const text = (data?.message || data?.data?.text || "") as string;
			const assistantMsg: Message = { role: "assistant", content: String(text || "Rất tiếc, không nhận được phản hồi.") };
			setMessages((m) => [...m, assistantMsg]);
		} catch (e) {
			setMessages((m) => [...m, { role: "assistant", content: "Lỗi khi kết nối tới server chatbot." }]);
		} finally {
			setLoading(false);
		}
	}

	function toggleOpen() {
		setOpen((s) => !s);
	}

	function startStopListening() {
		const r = recognitionRef.current;
		if (!r) return alert("Trình duyệt không hỗ trợ SpeechRecognition.");
		if (listening) {
			r.stop();
		} else {
			r.start();
		}
	}

	return (
		<>
			{/* Floating button */}
			<div style={styles.wrapper}>
				{open && (
					<div style={styles.panel}>
						<div style={styles.header}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div style={{ fontWeight: 700 }}>GoPark Chatbot</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<div style={{ width: 10, height: 10, borderRadius: 10, background: status === 'connected' ? '#10b981' : status === 'disconnected' ? '#ef4444' : '#f59e0b' }} />
									<div style={{ fontSize: 12, color: '#666' }}>{status === 'connected' ? 'Đã kết nối' : status === 'disconnected' ? 'Không kết nối' : 'Đang kiểm tra'}</div>
								</div>
							</div>
							<div style={{ fontSize: 12, color: "#666" }}>Trợ lý hỗ trợ đặt bãi đỗ — tiếng Việt</div>
						</div>

						<div style={styles.suggestions}>
							{suggestions.map((s) => (
								<button
									key={s}
									style={styles.suggBtn}
									onClick={() => {
										setInput(s);
										// send immediately
										setTimeout(() => sendMessage(true), 120);
									}}
								>
									{s}
								</button>
							))}
						</div>

						<div style={styles.messages} ref={messagesRef}>
							{messages.map((m, i) => (
								<div key={i} style={m.role === "user" ? styles.userBubble : styles.botBubble}>
									{m.content}
								</div>
							))}
							{loading && <div style={styles.typing}>Đang xử lý...</div>}
						</div>

						<div style={styles.inputRow}>
							<button aria-label="microphone" onClick={startStopListening} style={styles.iconBtn}>
								{listening ? (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v11"/><path d="M19 11a7 7 0 0 1-14 0"/></svg>
								) : (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v11"/><path d="M19 11a7 7 0 0 1-14 0"/></svg>
								)}
							</button>

							<input
								aria-label="chat-input"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") sendMessage();
								}}
								placeholder="Viết tin nhắn hoặc chọn gợi ý..."
								style={styles.input}
							/>

							<button onClick={() => sendMessage()} style={styles.sendBtn} aria-label="send">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20 1-7 7-13z"/></svg>
							</button>
						</div>
					</div>
				)}

				<button onClick={toggleOpen} title={open ? "Đóng chatbot" : "Mở chatbot"} style={{ ...styles.fab, background: "#0ea5a3" }}>
					{open ? (
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					) : (
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
					)}
				</button>
			</div>
		</>
	);
}

const styles: Record<string, React.CSSProperties> = {
	wrapper: {
		position: "fixed",
		right: 20,
		bottom: 20,
		zIndex: 9999,
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-end",
	},
	fab: {
		width: 56,
		height: 56,
		borderRadius: "50%",
		border: "none",
		boxShadow: "0 6px 18px rgba(13, 31, 33, 0.18)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
	},
	panel: {
		width: 340,
		maxHeight: 520,
		marginBottom: 12,
		background: "#fff",
		borderRadius: 12,
		boxShadow: "0 10px 30px rgba(2,6,23,0.2)",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
	},
	header: { padding: 12, borderBottom: "1px solid #eee" },
	suggestions: { padding: 8, display: "flex", gap: 8, flexWrap: "wrap" },
	suggBtn: { background: "#f1f5f4", border: "none", padding: "6px 8px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
	messages: { padding: 12, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 },
	userBubble: { alignSelf: "flex-end", background: "#0ea5a3", color: "#fff", padding: "8px 12px", borderRadius: 12, maxWidth: "80%" },
	botBubble: { alignSelf: "flex-start", background: "#f3f4f6", color: "#111827", padding: "8px 12px", borderRadius: 12, maxWidth: "80%" },
	typing: { fontStyle: "italic", color: "#666", fontSize: 13 },
	inputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee", alignItems: "center" },
	input: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" },
	sendBtn: { background: "#0ea5a3", border: "none", color: "#fff", padding: "8px 10px", borderRadius: 8, cursor: "pointer" },
	iconBtn: { background: "transparent", border: "none", padding: 6, cursor: "pointer" },
};

