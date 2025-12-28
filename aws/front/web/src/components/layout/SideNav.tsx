import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"

const items = [
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Orders" },
]

export default function SideNav() {
  console.log("[SideNav] render")
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="px-2 py-2 text-sm font-semibold">Navigation</div>
      <div className="space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                "block rounded-xl px-3 py-2 text-sm transition",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )
            }
            onClick={() => console.log("[SideNav] click", it.to)}
          >
            {it.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
