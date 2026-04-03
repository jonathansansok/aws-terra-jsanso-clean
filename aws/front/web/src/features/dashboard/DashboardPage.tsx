// aws/front/web/src/features/dashboard/DashboardPage.tsx
import { useQuery } from "@tanstack/react-query"
import { getDashboardStats, type DayStats } from "./api"
import { formatMoney } from "../../shared/money"
import { TrendingUp, ShoppingCart, Package, DollarSign } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function fillWeek(data: DayStats[]): DayStats[] {
  const byDate = new Map(data.map((d) => [d.date, d]))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = localDateKey(d)
    const found = byDate.get(key)
    return found ? { ...found, date: DAY_SHORT[d.getDay()] } : { date: DAY_SHORT[d.getDay()], orders: 0, revenue: 0 }
  })
}

// Card container style
const card: React.CSSProperties = {
  background: "#181740",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "14px",
  padding: "20px",
}

const KPIS = [
  {
    label: "Revenue Today",
    subKey: (d: any) => `${d?.ordersToday ?? 0} orders today`,
    valKey: (d: any) => formatMoney(d?.revenueToday ?? 0),
    Icon: DollarSign,
    grad: "linear-gradient(135deg,#FF2D87 0%,#8B5CF6 100%)",
    glow: "rgba(255,45,135,0.45)",
    orb: "rgba(255,45,135,0.15)",
  },
  {
    label: "Total Revenue",
    subKey: (d: any) => `${d?.totalOrders ?? 0} orders total`,
    valKey: (d: any) => formatMoney(d?.totalRevenue ?? 0),
    Icon: TrendingUp,
    grad: "linear-gradient(135deg,#00D4B4 0%,#6B5CF6 100%)",
    glow: "rgba(0,212,180,0.45)",
    orb: "rgba(0,212,180,0.15)",
  },
  {
    label: "Orders Today",
    subKey: (d: any) => `of ${d?.totalOrders ?? 0} total`,
    valKey: (d: any) => String(d?.ordersToday ?? 0),
    Icon: ShoppingCart,
    grad: "linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)",
    glow: "rgba(245,158,11,0.45)",
    orb: "rgba(245,158,11,0.15)",
  },
  {
    label: "Products",
    subKey: (d: any) => `${d?.activeProducts ?? 0} active`,
    valKey: (d: any) => String(d?.totalProducts ?? 0),
    Icon: Package,
    grad: "linear-gradient(135deg,#38BDF8 0%,#6B5CF6 100%)",
    glow: "rgba(56,189,248,0.45)",
    orb: "rgba(56,189,248,0.15)",
  },
]

const TOP_GRADS = [
  "linear-gradient(90deg,#FF2D87,#8B5CF6)",
  "linear-gradient(90deg,#00D4B4,#6B5CF6)",
  "linear-gradient(90deg,#F59E0B,#EF4444)",
  "linear-gradient(90deg,#38BDF8,#6B5CF6)",
  "linear-gradient(90deg,#A78BFA,#EC4899)",
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#1E1D4A",
      border: "1px solid rgba(139,92,246,0.4)",
      borderRadius: "10px",
      padding: "10px 14px",
      boxShadow: "0 0 20px rgba(139,92,246,0.25)",
      fontSize: "12px",
    }}>
      <div style={{ color: "#E4E4F0", fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#C4B5FD", marginTop: 4 }}>{formatMoney(payload[0]?.value ?? 0)}</div>
      <div style={{ color: "#6B6B8F" }}>{payload[0]?.payload?.orders ?? 0} orders</div>
    </div>
  )
}

export default function DashboardPage() {
  const q = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await getDashboardStats()
      if (!res.ok) throw res.error
      return res.data
    },
    refetchInterval: 30_000,
  })

  const d = q.data
  const weekData = fillWeek(d?.revenueByDay ?? [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Section title */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E4E4F0", margin: 0 }}>Overview</h2>
        <p style={{ fontSize: "12px", color: "#6B6B8F", marginTop: "4px" }}>Your POS performance at a glance</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}
        className="lg:grid-cols-4">
        {KPIS.map(({ label, subKey, valKey, Icon, grad, glow, orb }) => (
          <div
            key={label}
            style={{
              background: "#181740",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Orb */}
            <div style={{
              position: "absolute", top: "-20px", right: "-20px",
              width: "80px", height: "80px", borderRadius: "50%",
              background: orb, filter: "blur(18px)", pointerEvents: "none",
            }} />
            {/* Icon */}
            <div style={{
              position: "absolute", top: "16px", right: "16px",
              width: "36px", height: "36px", borderRadius: "10px",
              background: grad, boxShadow: `0 4px 16px ${glow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon style={{ width: 16, height: 16, color: "#fff" }} />
            </div>
            {/* Content */}
            <div style={{ position: "relative" }}>
              <p style={{ fontSize: "11px", color: "#6B6B8F", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
              {q.isLoading
                ? <div style={{ height: 32, background: "rgba(255,255,255,0.06)", borderRadius: 8, marginTop: 12, width: "70%" }} />
                : <p style={{ fontSize: "26px", fontWeight: 800, color: "#E4E4F0", margin: "10px 0 4px" }}>{valKey(d)}</p>
              }
              <p style={{ fontSize: "11px", color: "#6B6B8F", margin: 0 }}>{subKey(d)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top products row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>

        {/* Area chart card */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#E4E4F0" }}>Revenue — last 7 days</div>
              <div style={{ fontSize: "11px", color: "#6B6B8F", marginTop: 3 }}>Daily sales performance</div>
            </div>
            <div style={{
              borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700,
              background: "rgba(139,92,246,0.15)", color: "#C4B5FD",
              border: "1px solid rgba(139,92,246,0.3)",
            }}>7D</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF2D87" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF2D87" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6B8F" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6B8F" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue"
                stroke="url(#lineGrad)" strokeWidth={2.5}
                fill="url(#areaFill)" dot={false}
                activeDot={{ r: 5, fill: "#FF2D87", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products card */}
        <div style={card}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#E4E4F0" }}>Top Products</div>
            <div style={{ fontSize: "11px", color: "#6B6B8F", marginTop: 3 }}>By total revenue</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {q.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: 36, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} />
                ))
              : (d?.topProducts ?? []).map((p, i) => {
                  const max = d?.topProducts?.[0]?.revenue ?? 1
                  const pct = Math.round((p.revenue / max) * 100)
                  return (
                    <div key={p.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "#4A4A6A", fontWeight: 700 }}>#{i + 1}</span>
                          <span style={{ color: "#E4E4F0", fontWeight: 600, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        </span>
                        <span style={{ color: "#C4B5FD", fontWeight: 700, tabularNums: true } as any}>{formatMoney(p.revenue)}</span>
                      </div>
                      <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                        <div style={{ width: `${pct}%`, height: "5px", borderRadius: "3px", background: TOP_GRADS[i] }} />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}
