// aws/front/web/src/components/layout/AppShell.tsx
import { useState } from "react"
import { Outlet } from "react-router-dom"
import SideNav from "./SideNav"
import TopBar from "./TopBar"

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#0B0B22", fontFamily: "'Open Sans', sans-serif",
    }}>
      {/* Sidebar wrapper — overflow: visible so the toggle button can stick out */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          width: collapsed ? 60 : 224,
          minWidth: collapsed ? 60 : 224,
          height: "100vh",
          flexShrink: 0,
          background: "#0F0E2C",
          borderRight: "1px solid rgba(139,92,246,0.3)",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)",
          overflow: "visible",
          zIndex: 10,
        }}
      >
        {/* Inner scroll container */}
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <SideNav collapsed={collapsed} />
        </div>

        {/* Collapse toggle button — appears on hover */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: -11,
            top: "50%",
            width: 22, height: 22,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
            border: "2px solid #0B0B22",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 20,
            opacity: hovered ? 1 : 0,
            transform: `translateY(-50%) ${hovered ? "scale(1)" : "scale(0.7)"}`,
            transition: "opacity 0.2s ease, transform 0.2s ease",
            boxShadow: "0 0 12px rgba(139,92,246,0.55)",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <span style={{
            display: "inline-block",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            marginLeft: collapsed ? 1 : -1,
          }}>‹</span>
        </button>
      </aside>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
