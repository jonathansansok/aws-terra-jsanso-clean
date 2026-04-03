// aws/front/web/src/features/orders/OrdersPage.tsx
import * as React from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { getOrders } from "./api"
import { toastErr } from "../../shared/toast"
import { formatMoney } from "../../shared/money"
import OrderFormDialog from "./OrderFormDialog"
import { ShoppingCart, Search, RefreshCcw, X } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

type OrderItem = {
  productId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  product?: { name: string }
}
type Order = {
  id: string
  total: number
  createdAt: string
  items?: OrderItem[]
}

const CARD: React.CSSProperties = {
  background: "#181740",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "14px",
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#E4E4F0",
  borderRadius: "8px",
  padding: "6px 12px 6px 32px",
  fontSize: "12px",
  width: "180px",
  outline: "none",
}

function fmtDate(s: string, lang: "en" | "es") {
  try {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? s : d.toLocaleString(lang === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" })
  } catch { return s }
}

// ── Order Detail Modal ──────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [closing, setClosing] = React.useState(false)
  const { t, lang } = useT()

  const close = React.useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 200)
  }, [onClose])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [close])

  React.useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const backdropAnim = closing ? "backdropOut 0.2s ease forwards" : "backdropIn 0.2s ease forwards"
  const modalAnim   = closing ? "modalOut 0.2s ease forwards"    : "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards"

  return createPortal(
    <>
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(5,4,20,0.75)",
          backdropFilter: "blur(4px)",
          animation: backdropAnim,
        }}
      />

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 51,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "100%", maxWidth: "600px",
            background: "#181740",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "18px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.12)",
            animation: modalAnim,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(255,45,135,0.04) 100%)",
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E4E4F0" }}>{t("order_detail_title")}</div>
              <div style={{ fontSize: 11, color: "#6B6B8F", marginTop: 3, fontFamily: "monospace" }}>
                #{order.id}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#E4E4F0" }}>
                  {formatMoney(order.total)}
                </div>
                <div style={{ fontSize: 11, color: "#6B6B8F" }}>{fmtDate(order.createdAt, lang)}</div>
              </div>
              <button
                onClick={close}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)", color: "#6B6B8F", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,69,96,0.15)"
                  e.currentTarget.style.color = "#FF4560"
                  e.currentTarget.style.borderColor = "rgba(255,69,96,0.3)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                  e.currentTarget.style.color = "#6B6B8F"
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: "8px 0", maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 60px 90px 90px",
              padding: "8px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {[t("order_detail_col_product"), t("order_detail_col_qty"), t("order_detail_col_unit"), t("order_detail_col_total")].map((h, i) => (
                <div key={h} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  color: "#3A3A5C", textTransform: "uppercase",
                  textAlign: i > 0 ? "right" : "left",
                }}>{h}</div>
              ))}
            </div>

            {(order.items ?? []).map((item, i) => (
              <div
                key={i}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 60px 90px 90px",
                  padding: "12px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E4E4F0" }}>
                  {item.product?.name ?? item.productId.slice(0, 12) + "…"}
                </div>
                <div style={{ fontSize: 13, color: "#C4B5FD", textAlign: "right", fontWeight: 700 }}>
                  ×{item.quantity}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B8F", textAlign: "right" }}>
                  {formatMoney(item.unitPrice)}
                </div>
                <div style={{ fontSize: 13, color: "#E4E4F0", textAlign: "right", fontWeight: 700 }}>
                  {formatMoney(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer total */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(139,92,246,0.04)",
          }}>
            <span style={{ fontSize: 12, color: "#6B6B8F" }}>
              {order.items?.length ?? 0} {t("order_detail_items")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#6B6B8F" }}>{t("order_detail_total")}</span>
              <span style={{
                fontSize: 20, fontWeight: 800,
                background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {formatMoney(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Orders Page ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Order | null>(null)
  const { t, lang } = useT()

  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await getOrders()
      if (!res.ok) { toastErr(res.error.message, res.error); throw res.error }
      return res.data as Order[]
    },
  })

  const filtered = React.useMemo(() => {
    const all = q.data ?? []
    const qq = query.trim().toLowerCase()
    return qq ? all.filter((o) => o.id.toLowerCase().includes(qq)) : all
  }, [q.data, query])

  const totalRevenue = q.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E4E4F0", margin: 0 }}>{t("orders_title")}</h2>
          <p style={{ fontSize: 12, color: "#6B6B8F", marginTop: 4 }}>{t("orders_desc")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 12, color: "#6B6B8F" }}>
            <span><strong style={{ color: "#E4E4F0" }}>{q.data?.length ?? 0}</strong> {t("orders_count_label")}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>
              <strong style={{ color: "#00D4B4" }}>{formatMoney(totalRevenue)}</strong> {t("orders_revenue_label")}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              color: "#9090B0", fontSize: 13, fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            <RefreshCcw style={{ width: 13, height: 13 }} className={q.isFetching ? "animate-spin" : ""} />
            {t("orders_refresh")}
          </button>

          <OrderFormDialog />
        </div>
      </div>

      {/* Table card */}
      <div style={CARD}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: 12, color: "#6B6B8F" }}>
            <strong style={{ color: "#9090B0" }}>{filtered.length}</strong> / <strong style={{ color: "#9090B0" }}>{q.data?.length ?? 0}</strong> {t("orders_of")}
          </span>
          <div style={{ position: "relative" }}>
            <Search style={{
              position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              width: 13, height: 13, color: "#6B6B8F", pointerEvents: "none",
            }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("orders_filter")}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Content */}
        {q.isLoading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 40, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} className="animate-pulse" />
            ))}
          </div>
        ) : q.isError ? (
          <div style={{ padding: 20 }}>
            <div style={{ color: "#FF4560", fontWeight: 600 }}>{t("orders_error")}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 20px", textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
            }}>
              <ShoppingCart style={{ width: 22, height: 22, color: "#8B5CF6" }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#E4E4F0" }}>{t("orders_empty_title")}</div>
              <div style={{ fontSize: 12, color: "#6B6B8F", marginTop: 4 }}>{t("orders_empty_desc")}</div>
            </div>
            <OrderFormDialog />
          </div>
        ) : (
          <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {[[t("orders_col_id"), "left"], [t("orders_col_total"), "right"], [t("orders_col_items"), "right"], [t("orders_col_date"), "right"]].map(([h, align]) => (
                    <th key={h} style={{
                      padding: "10px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      color: "#3A3A5C", textTransform: "uppercase", textAlign: align as any,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 20px", fontFamily: "monospace", fontSize: 12, color: "#6B6B8F" }}>
                      {o.id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#C4B5FD" }}>
                      {formatMoney(o.total)}
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#6B6B8F" }}>
                      {o.items?.length ?? "—"}
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#6B6B8F" }}>
                      {fmtDate(o.createdAt, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
