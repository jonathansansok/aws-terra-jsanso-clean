// aws/front/web/src/components/layout/TopBar.tsx
import { useMemo, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Search, Bell } from "lucide-react"

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/dashboard")) return { title: "Dashboard", desc: "Overview of POS operations" }
  if (pathname.startsWith("/products")) return { title: "Products", desc: "Manage catalog items" }
  if (pathname.startsWith("/orders")) return { title: "Orders", desc: "Sales order history" }
  return { title: "Dashboard", desc: "Overview" }
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function TopBar() {
  const loc = useLocation()
  const meta = useMemo(() => titleFromPath(loc.pathname), [loc.pathname])
  const now = useLiveClock()

  const timeStr = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`

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
            placeholder="Search..."
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
