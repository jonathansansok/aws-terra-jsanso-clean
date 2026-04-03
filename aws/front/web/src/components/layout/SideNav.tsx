// aws/front/web/src/components/layout/SideNav.tsx
import { NavLink } from "react-router-dom"
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Zap } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

type NavItem = { to: string; labelKey: string; Icon: React.ElementType; disabled?: boolean }

const sections: { labelKey: string; items: NavItem[] }[] = [
  { labelKey: "sidebar_general",  items: [{ to: "/dashboard", labelKey: "nav_dashboard", Icon: LayoutDashboard }] },
  { labelKey: "sidebar_catalog",  items: [{ to: "/products",  labelKey: "nav_products",  Icon: Package }] },
  { labelKey: "sidebar_sales",    items: [{ to: "/orders",    labelKey: "nav_orders",    Icon: ShoppingCart }] },
  { labelKey: "sidebar_reports",  items: [{ to: "/reports",   labelKey: "nav_analytics", Icon: BarChart3, disabled: true }] },
]

const ICON_COLOR: Record<string, string> = {
  "/dashboard": "#C4B5FD",
  "/products":  "#67E8F9",
  "/orders":    "#6EE7B7",
  "/reports":   "#4A4A6A",
}
const ICON_BG: Record<string, string> = {
  "/dashboard": "rgba(196,181,253,0.14)",
  "/products":  "rgba(103,232,249,0.14)",
  "/orders":    "rgba(110,231,183,0.14)",
  "/reports":   "rgba(74,74,106,0.10)",
}
const ICON_BORDER: Record<string, string> = {
  "/dashboard": "rgba(196,181,253,0.25)",
  "/products":  "rgba(103,232,249,0.25)",
  "/orders":    "rgba(110,231,183,0.25)",
  "/reports":   "rgba(74,74,106,0.15)",
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useT()
  const label = t(item.labelKey as Parameters<typeof t>[0])
  const isDisabled = item.disabled
  const iconColor   = ICON_COLOR[item.to]  ?? "#4A4A6A"
  const iconBg      = ICON_BG[item.to]     ?? "rgba(255,255,255,0.04)"
  const iconBorder  = ICON_BORDER[item.to] ?? "rgba(255,255,255,0.06)"
  const { t: tFn } = useT()

  if (isDisabled) {
    return (
      <div title={collapsed ? label : undefined} style={{
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 10,
        padding: collapsed ? "8px 0" : "8px 10px",
        borderRadius: 10,
        justifyContent: collapsed ? "center" : "flex-start",
        opacity: 0.3, cursor: "not-allowed",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <item.Icon style={{ width: 14, height: 14, color: "#4A4A6A" }} />
        </div>
        {!collapsed && (
          <>
            <span style={{ fontSize: 13, color: "#6B6B8F", flex: 1 }}>{label}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 20, textTransform: "uppercase",
              background: "rgba(107,107,143,0.12)", color: "#6B6B8F",
              border: "1px solid rgba(107,107,143,0.18)",
            }}>{tFn("nav_coming_soon")}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <NavLink to={item.to} end={item.to === "/dashboard"} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div
          title={collapsed ? label : undefined}
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "8px 0" : "8px 10px",
            borderRadius: 10, cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "background 0.15s, border-color 0.15s",
            border: "1px solid",
            ...(isActive ? {
              background: "linear-gradient(135deg,rgba(139,92,246,0.20) 0%,rgba(255,45,135,0.08) 100%)",
              borderColor: "rgba(139,92,246,0.28)",
              boxShadow: "0 2px 14px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            } : {
              background: "transparent", borderColor: "transparent",
            }),
          }}
          onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)" }}}
          onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" }}}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isActive ? iconBg : "rgba(255,255,255,0.04)",
            border: `1px solid ${isActive ? iconBorder : "rgba(255,255,255,0.06)"}`,
            boxShadow: isActive ? `0 0 8px ${iconBorder}` : "none",
            transition: "all 0.15s",
          }}>
            <item.Icon style={{ width: 14, height: 14, color: isActive ? iconColor : "#4A4A6A" }} />
          </div>

          {!collapsed && (
            <>
              <span style={{
                fontSize: 13, flex: 1,
                color: isActive ? "#E4E4F0" : "#7A7A9F",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap", overflow: "hidden",
                transition: "color 0.15s",
              }}>{label}</span>
              {isActive && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
                }} />
              )}
            </>
          )}
        </div>
      )}
    </NavLink>
  )
}

export default function SideNav({ collapsed }: { collapsed: boolean }) {
  const { t } = useT()

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Brand */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        minHeight: 60,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg,#FF2D87 0%,#8B5CF6 100%)",
          boxShadow: "0 0 16px rgba(139,92,246,0.5), 0 4px 12px rgba(255,45,135,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap style={{ width: 18, height: 18, color: "#fff" }} />
        </div>

        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4F0", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              POS Admin
            </div>
            <div style={{ fontSize: 10, color: "#6B6B8F", marginTop: 1 }}>{t("brand_subtitle")}</div>
          </div>
        )}

        {!collapsed && (
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
            padding: "3px 8px", borderRadius: 20,
            background: "rgba(0,212,180,0.10)", border: "1px solid rgba(0,212,180,0.28)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#00D4B4",
              boxShadow: "0 0 6px rgba(0,212,180,0.8)",
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#00D4B4", letterSpacing: "0.08em" }}>{t("brand_status")}</span>
          </div>
        )}
      </div>

      {/* Gradient divider */}
      {!collapsed && (
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.35),transparent)" }} />
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "12px 6px" : "12px 10px" }}>
        {sections.map((section, si) => (
          <div key={section.labelKey} style={{ marginBottom: si < sections.length - 1 ? 6 : 0 }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 4px" }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#3A3A5C", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {t(section.labelKey as Parameters<typeof t>[0])}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
              </div>
            )}
            {collapsed && si > 0 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "6px 4px" }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => (
                <NavItemLink key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Gradient divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.25),transparent)" }} />

      {/* User footer */}
      <div style={{ padding: collapsed ? "10px 6px" : "10px 12px" }}>
        <div style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "8px 0" : "8px 10px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer", transition: "background 0.15s",
        }}
          title={collapsed ? "Admin" : undefined}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
            boxShadow: "0 0 10px rgba(139,92,246,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
          }}>A</div>

          {!collapsed && (
            <>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#E4E4F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Admin</div>
                <div style={{ fontSize: 10, color: "#6B6B8F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>admin@pos.app</div>
              </div>
              <Settings style={{ width: 13, height: 13, color: "#4A4A6A", flexShrink: 0 }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
