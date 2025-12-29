// aws/front/web/src/components/layout/TopBar.tsx
import { useEffect, useMemo } from "react"
import { useLocation } from "react-router-dom"
import ModeToggle from "../mode-toggle"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/products")) return { title: "Products", desc: "Manage catalog items for the POS flow" }
  if (pathname.startsWith("/orders")) return { title: "Orders", desc: "Review and manage sales orders" }
  return { title: "Dashboard", desc: "Overview" }
}

export default function TopBar() {
  const loc = useLocation()

  const meta = useMemo(() => titleFromPath(loc.pathname), [loc.pathname])

  useEffect(() => {
    console.log("[TopBar] location", loc.pathname)
  }, [loc.pathname])

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50",
        "bg-card/60 backdrop-blur",
        "shadow-sm",
        "px-4 py-3"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{meta.title}</div>
          <div className="text-xs text-muted-foreground">{meta.desc}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search UI (placeholder, no lógica todavía) */}
          <div className="hidden items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2 sm:flex">
            <Search className="h-4 w-4 opacity-70" />
            <input
              className="w-64 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              onChange={(e) => console.log("[TopBar] search change", e.target.value)}
            />
          </div>

          <ModeToggle />
        </div>
      </div>

      {/* Divider suave */}
      <div className="mt-3 h-px bg-border/50" />
    </div>
  )
}
