import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "chat-history-v1";

// A stylized durian: round husk body with radiating spikes — Davao's signature fruit.
function DurianMark({ size = 34, style = {} }) {
  const spikes = 12;
  const cx = 50, cy = 54, rInner = 26, rOuter = 44;
  const points = Array.from({ length: spikes }, (_, i) => {
    const angle = (i / spikes) * Math.PI * 2 - Math.PI / 2;
    const baseAngle = angle - Math.PI / spikes;
    const tipAngle = angle;
    const nextBaseAngle = angle + Math.PI / spikes;
    const bx = cx + rInner * Math.cos(baseAngle);
    const by = cy + rInner * Math.sin(baseAngle);
    const tx = cx + rOuter * Math.cos(tipAngle);
    const ty = cy + rOuter * Math.sin(tipAngle);
    const nx = cx + rInner * Math.cos(nextBaseAngle);
    const ny = cy + rInner * Math.sin(nextBaseAngle);
    return `${bx},${by} ${tx},${ty} ${nx},${ny}`;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {points.map((p, i) => (
        <polygon key={i} points={p} fill="#3E8FE0" />
      ))}
      <circle cx={cx} cy={cy} r={rInner} fill="#EAF2FB" />
      <circle cx={cx - 8} cy={cy - 4} r={3} fill="#3E8FE0" opacity="0.5" />
      <circle cx={cx + 9} cy={cy + 3} r={3} fill="#3E8FE0" opacity="0.5" />
      <circle cx={cx + 1} cy={cy + 10} r={3} fill="#3E8FE0" opacity="0.5" />
    </svg>
  );
}

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  // Load saved history on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch (e) {
      // no history yet — that's fine
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save history whenever messages change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, loaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.reply || "Sorry, I didn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong reaching the AI. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <DurianMark size={34} />
          <div>
            <div style={styles.title}>De Venom</div>
            <div style={styles.subtitle}>an AI you can talk to</div>
          </div>
        </div>
        <button style={styles.clearBtn} onClick={clearChat} aria-label="Clear conversation">
          Clear
        </button>
      </header>

      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <DurianMark size={40} style={{ margin: "0 auto 10px" }} />
            <div style={styles.emptyTitle}>Say something to begin</div>
            <div style={styles.emptyText}>
              Your conversation stays saved on this device between visits.
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.row,
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.userBubble : styles.aiBubble),
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.row, justifyContent: "flex-start" }}>
            <div style={{ ...styles.bubble, ...styles.aiBubble, ...styles.thinking }}>
              <span style={styles.dot}></span>
              <span style={{ ...styles.dot, animationDelay: "0.15s" }}></span>
              <span style={{ ...styles.dot, animationDelay: "0.3s" }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputBar}>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
        textarea::placeholder { color: #7C93B3; }
        textarea:focus, button:focus-visible {
          outline: 2px solid #3E8FE0;
          outline-offset: 2px;
        }
        * { box-sizing: border-box; }
        @media (prefers-reduced-motion: reduce) {
          span[style] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    background: "#0A1930",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#EAF2FB",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px",
    borderBottom: "1px solid #1E3A5F",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#3E8FE0",
    color: "#0A1930",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
  },
  title: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  subtitle: { fontSize: 12, color: "#7C93B3", marginTop: 2 },
  clearBtn: {
    background: "transparent",
    border: "1px solid #1E3A5F",
    color: "#7C93B3",
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 260,
    color: "#7C93B3",
  },
  emptyMark: { fontSize: 28, color: "#3E8FE0", marginBottom: 10 },
  emptyTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 17,
    color: "#EAF2FB",
    marginBottom: 6,
  },
  emptyText: { fontSize: 13, lineHeight: 1.5 },
  row: { display: "flex", width: "100%" },
  bubble: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14.5,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    background: "#3E8FE0",
    color: "#0A1930",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    background: "#12294D",
    color: "#EAF2FB",
    borderBottomLeftRadius: 4,
  },
  thinking: { display: "flex", gap: 4, padding: "14px 16px" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7C93B3",
    display: "inline-block",
    animation: "pulse 1.2s infinite ease-in-out",
  },
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #1E3A5F",
  },
  textarea: {
    flex: 1,
    resize: "none",
    background: "#12294D",
    border: "1px solid #1E3A5F",
    borderRadius: 14,
    padding: "10px 14px",
    color: "#EAF2FB",
    fontSize: 14.5,
    fontFamily: "inherit",
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#3E8FE0",
    color: "#0A1930",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
};
