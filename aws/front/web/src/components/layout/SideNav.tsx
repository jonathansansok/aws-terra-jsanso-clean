// aws/front/web/src/components/layout/SideNav.tsx
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Package, ShoppingCart } from "lucide-react"

const items = [
  { to: "/products", label: "Products", Icon: Package },
  { to: "/orders", label: "Orders", Icon: ShoppingCart },
]

export default function SideNav() {
  console.log("[SideNav] render")

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50",
        "bg-card/60 backdrop-blur",
        "shadow-sm",
        "p-3"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="h-9 w-9 rounded-xl border border-border/50 bg-background/40" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">POS Admin</div>
          <div className="text-xs text-muted-foreground">Backoffice</div>
        </div>
      </div>

      <div className="my-3 h-px bg-border/50" />

      <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
        Navigation
      </div>

      <div className="space-y-1">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => console.log("[SideNav] click", to)}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "bg-primary/12 text-foreground ring-1 ring-border/50"
                  : "hover:bg-accent/60 hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Hint / status */}
      <div className="mt-4 rounded-xl border border-border/50 bg-background/30 px-3 py-2">
        <div className="text-xs text-muted-foreground">
          Tip: agregá “empty states” en cada page para que no quede el vacío negro.
        </div>
      </div>
    </div>
  )
}
