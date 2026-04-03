// aws/front/web/src/components/layout/TopBar.tsx
import { useMemo, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Search, Bell } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH_NAMES_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const LANG_BTN: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  padding: "3px 8px",
  borderRadius: 6,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "all 0.15s",
}

export default function TopBar() {
  const loc = useLocation()
  const { lang, setLang, t } = useT()
  const now = useLiveClock()

  const meta = useMemo(() => {
    if (loc.pathname.startsWith("/dashboard")) return { title: t("topbar_dashboard_title"), desc: t("topbar_dashboard_desc") }
    if (loc.pathname.startsWith("/products")) return { title: t("topbar_products_title"), desc: t("topbar_products_desc") }
    if (loc.pathname.startsWith("/orders")) return { title: t("topbar_orders_title"), desc: t("topbar_orders_desc") }
    return { title: t("topbar_default_title"), desc: t("topbar_default_desc") }
  }, [loc.pathname, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const dayNames = lang === "es" ? DAY_NAMES_ES : DAY_NAMES_EN
  const monthNames = lang === "es" ? MONTH_NAMES_ES : MONTH_NAMES_EN
  const timeStr = now.toLocaleTimeString(lang === "es" ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = `${dayNames[now.getDay()]} ${now.getDate()} ${monthNames[now.getMonth()]}`

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-6 gap-4"
      style={{
        background: "#0F0E2A",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Left — page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-sm font-bold text-white">{meta.title}</h1>
          <p className="text-[11px]" style={{ color: "#6B6B8F" }}>{meta.desc}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        {/* EN / ES toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setLang("en")}
            style={{
              ...LANG_BTN,
              background: lang === "en" ? "linear-gradient(135deg,#FF2D87,#8B5CF6)" : "rgba(255,255,255,0.04)",
              color: lang === "en" ? "#fff" : "#6B6B8F",
              borderColor: lang === "en" ? "transparent" : "rgba(255,255,255,0.08)",
              boxShadow: lang === "en" ? "0 0 10px rgba(139,92,246,0.35)" : "none",
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLang("es")}
            style={{
              ...LANG_BTN,
              background: lang === "es" ? "linear-gradient(135deg,#FF2D87,#8B5CF6)" : "rgba(255,255,255,0.04)",
              color: lang === "es" ? "#fff" : "#6B6B8F",
              borderColor: lang === "es" ? "transparent" : "rgba(255,255,255,0.08)",
              boxShadow: lang === "es" ? "0 0 10px rgba(139,92,246,0.35)" : "none",
            }}
          >
            ES
          </button>
        </div>

        {/* Clock */}
        <div className="hidden items-center gap-2 md:flex">
          <div
            className="rounded-lg px-3 py-1.5 text-xs tabular-nums"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="font-semibold text-white">{timeStr}</span>
            <span className="mx-2 opacity-30">·</span>
            <span style={{ color: "#6B6B8F" }} className="capitalize">{dateStr}</span>
          </div>
        </div>

        {/* Search */}
        <div
          className="hidden items-center gap-2 rounded-lg px-3 py-1.5 sm:flex"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: "#6B6B8F" }} />
          <input
            className="w-36 bg-transparent text-xs outline-none"
            placeholder={t("topbar_search")}
            style={{ color: "#E4E4F0" }}
          />
          <kbd
            className="rounded px-1 py-0.5 text-[9px] font-semibold"
            style={{ background: "rgba(139,92,246,0.2)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Bell className="h-4 w-4" style={{ color: "#6B6B8F" }} />
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: "#FF2D87" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white cursor-pointer"
          style={{
            background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
            boxShadow: "0 0 10px rgba(139,92,246,0.4)",
          }}
        >
          A
        </div>
      </div>
    </header>
  )
}
