import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { sendChatMessage } from "./chatApi"
import { useT } from "../../i18n/I18nContext"

type Message = { role: "user" | "assistant"; text: string }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { t } = useT()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setLoading(true)
    try {
      const res = await sendChatMessage(text)
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: "Error: " + res.error.message }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
      {open && (
        <div style={{
          position: "absolute", bottom: 64, right: 0,
          width: 360, height: 480,
          background: "#181740",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.12)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg,rgba(139,92,246,0.1) 0%,rgba(255,45,135,0.05) 100%)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle style={{ width: 14, height: 14, color: "#fff" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#E4E4F0" }}>{t("ai_chat_title")}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)", color: "#6B6B8F",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,69,96,0.15)"; e.currentTarget.style.color = "#FF4560" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6B6B8F" }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#6B6B8F", fontSize: 12, marginTop: 40 }}>
                {t("ai_chat_placeholder")}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg,#FF2D87,#8B5CF6)"
                    : "rgba(255,255,255,0.06)",
                  border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  fontSize: 13, color: "#E4E4F0", lineHeight: 1.5,
                  wordBreak: "break-word",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "8px 14px",
                  borderRadius: "12px 12px 12px 2px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 18, color: "#A78BFA",
                  letterSpacing: 3,
                }}>
                  •••
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 8, flexShrink: 0,
            background: "rgba(0,0,0,0.2)",
          }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t("ai_chat_placeholder")}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13, color: "#E4E4F0",
                outline: "none", resize: "none",
                fontFamily: "inherit", lineHeight: 1.4,
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: input.trim() && !loading
                  ? "linear-gradient(135deg,#FF2D87,#8B5CF6)"
                  : "rgba(139,92,246,0.2)",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Send style={{ width: 14, height: 14, color: "#fff" }} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(139,92,246,0.5)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(139,92,246,0.7)" }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.5)" }}
      >
        {open
          ? <X style={{ width: 20, height: 20, color: "#fff" }} />
          : <MessageCircle style={{ width: 22, height: 22, color: "#fff" }} />
        }
      </button>
    </div>
  )
}
