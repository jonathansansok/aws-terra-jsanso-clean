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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={
        active
          ? { background: "rgba(0,212,180,0.12)", color: "#00D4B4", border: "1px solid rgba(0,212,180,0.25)" }
          : { background: "rgba(107,107,143,0.12)", color: "#6B6B8F", border: "1px solid rgba(107,107,143,0.2)" }
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? "#00D4B4" : "#6B6B8F" }} />
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
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => { toastOk(t("toast_product_deleted")); qc.invalidateQueries({ queryKey: ["products"] }) },
    onError: () => toastErr(t("products_error_title")),
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
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
      style={
        confirming
          ? { background: "rgba(255,69,96,0.2)", color: "#FF4560", border: "1px solid rgba(255,69,96,0.4)" }
          : { background: "transparent", color: "#6B6B8F", border: "1px solid transparent" }
      }
    >
      {confirming ? "Confirm?" : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function ProductsPage() {
  const [query, setQuery] = React.useState("")
  const { t } = useT()

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
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Package className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {stats.total === 0 ? t("products_empty_title") : t("products_empty_filter_title")}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "#6B6B8F" }}>
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
                  {[t("products_col_name"), t("products_col_price"), t("products_col_status"), ""].map((h, i) => (
                    <th
                      key={i}
                      className={`h-9 px-5 text-[10px] font-bold uppercase tracking-widest text-left ${i === 1 || i === 2 ? "text-right" : ""}`}
                      style={{ color: "#4A4A6A" }}
                    >
                      {h}
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-2.5 text-sm font-semibold text-white">{p.name}</td>
                    <td className="px-5 py-2.5 text-right text-sm tabular-nums" style={{ color: "#C4B5FD" }}>
                      {formatMoney(p.price)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <StatusBadge active={p.active} />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ProductFormDialog product={p} />
                        <DeleteButton productId={p.id} />
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
