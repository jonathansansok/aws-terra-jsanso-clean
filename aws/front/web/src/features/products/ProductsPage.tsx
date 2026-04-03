// aws/front/web/src/features/products/ProductsPage.tsx
import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProducts, deleteProduct } from "./api"
import { toastErr, toastOk } from "../../shared/toast"
import ProductFormDialog from "./ProductFormDialog"
import { formatMoney } from "../../shared/money"
import { Package, Search, RefreshCcw, Trash2 } from "lucide-react"
import type { Product } from "./types"
import { useT } from "../../i18n/I18nContext"

const CARD = { background: "#181740", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px" }
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#E4E4F0",
  borderRadius: "8px",
  padding: "8px 14px 8px 34px",
  fontSize: "13px",
  width: "210px",
  outline: "none",
  transition: "border-color 0.15s",
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useT()
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 20, padding: "4px 12px",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...(active
          ? { background: "rgba(0,212,180,0.12)", color: "#00D4B4", border: "1px solid rgba(0,212,180,0.28)" }
          : { background: "rgba(107,107,143,0.1)", color: "#6B6B8F", border: "1px solid rgba(107,107,143,0.22)" }
        ),
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: active ? "#00D4B4" : "#6B6B8F",
        boxShadow: active ? "0 0 6px rgba(0,212,180,0.7)" : "none",
      }} />
      {active ? t("products_status_active") : t("products_status_inactive")}
    </span>
  )
}

function DeleteButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const qc = useQueryClient()
  const { t } = useT()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await deleteProduct(productId)
      if (!res.ok) throw new Error(res.error.message)
    },
    onSuccess: () => { toastOk(t("toast_product_deleted")); qc.invalidateQueries({ queryKey: ["products"] }) },
    onError: (e: unknown) => toastErr(e instanceof Error ? e.message : t("products_error_title")),
  })

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 2500)
    } else {
      clearTimeout(timerRef.current)
      setConfirming(false)
      mutation.mutate()
    }
  }

  React.useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      title={confirming ? "Click again to confirm" : "Delete"}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: confirming ? "6px 12px" : "6px 10px",
        borderRadius: 8, cursor: mutation.isPending ? "not-allowed" : "pointer",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        transition: "all 0.15s",
        ...(confirming
          ? {
              background: "rgba(255,69,96,0.18)",
              color: "#FF4560",
              border: "1px solid rgba(255,69,96,0.45)",
              boxShadow: "0 0 12px rgba(255,69,96,0.2)",
            }
          : {
              background: "rgba(255,255,255,0.04)",
              color: "#6B6B8F",
              border: "1px solid rgba(255,255,255,0.07)",
            }),
      }}
      onMouseEnter={(e) => {
        if (!confirming) {
          e.currentTarget.style.background = "rgba(255,69,96,0.12)"
          e.currentTarget.style.color = "#FF4560"
          e.currentTarget.style.borderColor = "rgba(255,69,96,0.3)"
        }
      }}
      onMouseLeave={(e) => {
        if (!confirming) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
          e.currentTarget.style.color = "#6B6B8F"
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
        }
      }}
    >
      <Trash2 style={{ width: 13, height: 13, flexShrink: 0 }} />
      {confirming && <span>Confirm?</span>}
    </button>
  )
}

function fmtDate(s: string, lang: "en" | "es") {
  try {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? s : d.toLocaleString(lang === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" })
  } catch { return s }
}

export default function ProductsPage() {
  const [query, setQuery] = React.useState("")
  const { t, lang } = useT()

  const q = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts()
      if (!res.ok) { toastErr(res.error.message, res.error); throw res.error }
      return res.data as Product[]
    },
  })

  const stats = React.useMemo(() => {
    const all = q.data ?? []
    const active = all.filter((p) => p.active).length
    return { total: all.length, active, inactive: all.length - active }
  }, [q.data])

  const filtered = React.useMemo(() => {
    const all = q.data ?? []
    const qq = query.trim().toLowerCase()
    return qq ? all.filter((p) => p.name.toLowerCase().includes(qq)) : all
  }, [q.data, query])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t("products_title")}</h2>
          <p className="text-xs" style={{ color: "#6B6B8F" }}>{t("products_desc")}</p>
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#6B6B8F" }}>
            <span><span className="font-bold text-white">{stats.total}</span> {t("products_total")}</span>
            <span className="opacity-30">·</span>
            <span><span className="font-bold" style={{ color: "#00D4B4" }}>{stats.active}</span> {t("products_active")}</span>
            <span className="opacity-30">·</span>
            <span><span className="font-bold">{stats.inactive}</span> {t("products_inactive")}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              color: "#9090B0", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            <RefreshCcw className={q.isFetching ? "animate-spin" : ""} style={{ width: 13, height: 13 }} />
            {t("products_refresh")}
          </button>
          <ProductFormDialog />
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl overflow-hidden" style={CARD}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span style={{ fontSize: 12, color: "#6B6B8F" }}>
            <strong style={{ color: "#9090B0" }}>{filtered.length}</strong>
            {" / "}
            <strong style={{ color: "#9090B0" }}>{stats.total}</strong>
            {" "}{t("products_of")}
          </span>
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                width: 13, height: 13, color: "#6B6B8F", pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("products_filter")}
              style={INPUT_STYLE}
              onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        </div>

        {/* Table */}
        {q.isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : q.isError ? (
          <div className="p-5">
            <div className="text-sm font-semibold" style={{ color: "#FF4560" }}>{t("products_error_title")}</div>
            <div className="text-xs mt-1" style={{ color: "#6B6B8F" }}>{t("products_error_desc")}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "80px 20px", textAlign: "center", minHeight: 360 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Package style={{ width: 26, height: 26, color: "#8B5CF6" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#E4E4F0" }}>
                {stats.total === 0 ? t("products_empty_title") : t("products_empty_filter_title")}
              </div>
              <div style={{ fontSize: 12, color: "#6B6B8F" }}>
                {stats.total === 0 ? t("products_empty_desc") : t("products_empty_filter_desc")}
              </div>
            </div>
            {stats.total === 0 && <ProductFormDialog />}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {[
                    { label: t("products_col_name"), align: "left" as const, padding: "0 20px 0 40px", width: undefined },
                    { label: t("products_col_price"), align: "right" as const, padding: "0 20px", width: 100 },
                    { label: t("products_col_date"), align: "right" as const, padding: "0 20px", width: 160 },
                    { label: t("products_col_status"), align: "left" as const, padding: "0 24px 0 20px", width: undefined },
                  ].map(({ label, align, padding, width }, i) => (
                    <th
                      key={i}
                      style={{
                        height: 36, padding, width,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                        color: "#4A4A6A", textTransform: "uppercase",
                        textAlign: align, whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 20px 12px 40px", fontSize: 13, fontWeight: 500, color: "#E4E4F0" }}>{p.name}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#C4B5FD" }}>
                      {formatMoney(p.price)}
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#6B6B8F", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {fmtDate(p.createdAt, lang)}
                    </td>
                    <td style={{ padding: "10px 24px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12 }}>
                        <StatusBadge active={p.active} />
                        <div className="flex items-center gap-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <ProductFormDialog product={p} />
                          <DeleteButton productId={p.id} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
