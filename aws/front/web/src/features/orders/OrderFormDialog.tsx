// aws/front/web/src/features/orders/OrderFormDialog.tsx
import { useMemo, useState, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orderCreateSchema } from "./schema"
import type { OrderCreateFormValues, OrderCreateInput } from "./schema"
import { createOrder } from "./api"
import { getProducts } from "../products/api"
import { toastErr, toastOk } from "../../shared/toast"
import { formatMoney, toMoneyNumber } from "../../shared/money"
import type { Product } from "../products/types"
import { X, Plus, Trash2 } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

function toErrMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message?: unknown }).message ?? "Error")
  return "Error"
}

function toQtyNumber(raw: string): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 1
  const int = Math.trunc(n)
  return int < 1 ? 1 : int
}

const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#6B6B8F",
  textTransform: "uppercase", letterSpacing: "0.08em",
  marginBottom: 5, display: "block",
}

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "8px 10px",
  fontSize: 13, color: "#E4E4F0", outline: "none",
}

const INPUT_NUM: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "8px 10px",
  fontSize: 13, color: "#E4E4F0", outline: "none",
  textAlign: "right",
}

export default function OrderFormDialog() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const qc = useQueryClient()
  const { t } = useT()

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, 200)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [open])

  const pq = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts()
      if (!res.ok) throw res.error
      return res.data
    },
  })

  const products = useMemo<Product[]>(() => pq.data ?? [], [pq.data])

  const form = useForm<OrderCreateFormValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: { items: [{ productId: "", quantity: 1 }] },
    mode: "onChange",
  })

  const items = useWatch({ control: form.control, name: "items" })
  const itemsSafe = useMemo<OrderCreateFormValues["items"]>(() => items ?? [], [items])

  const mutation = useMutation({
    mutationFn: async (input: OrderCreateInput) => {
      const res = await createOrder(input)
      if (!res.ok) throw res.error
      return res.data
    },
    onSuccess: () => {
      toastOk(t("toast_order_created"))
      qc.invalidateQueries({ queryKey: ["orders"] })
      form.reset({ items: [{ productId: "", quantity: 1 }] })
      close()
    },
    onError: (e: unknown) => toastErr(toErrMessage(e), e),
  })

  const calc = useMemo(() => {
    const priceById = new Map<string, number>(products.map((p) => [p.id, toMoneyNumber(p.price)]))
    const lines = itemsSafe.map((it) => {
      const unit = priceById.get(it.productId ?? "") ?? 0
      const qty = Number(it.quantity ?? 0) || 0
      return { unit, qty, line: unit * qty }
    })
    return { lines, total: lines.reduce((acc, l) => acc + l.line, 0) }
  }, [itemsSafe, products])

  const isBusy = mutation.isPending || pq.isFetching
  const canSubmit = form.formState.isValid && !isBusy

  function addLine() {
    form.setValue("items", [...itemsSafe, { productId: "", quantity: 1 }], { shouldValidate: true })
  }

  function removeLine(idx: number) {
    const next = itemsSafe.filter((_, i) => i !== idx)
    form.setValue("items", next.length ? next : [{ productId: "", quantity: 1 }], { shouldValidate: true })
  }

  const backdropAnim = closing ? "backdropOut 0.2s ease forwards" : "backdropIn 0.2s ease forwards"
  const modalAnim = closing ? "modalOut 0.2s ease forwards" : "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8, cursor: "pointer",
          background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
          boxShadow: "0 0 16px rgba(139,92,246,0.4)",
          transition: "box-shadow 0.15s",
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        {t("orders_new")}
      </button>

      {open && createPortal(
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
          <div style={{
            position: "fixed", inset: 0, zIndex: 51,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, pointerEvents: "none",
          }}>
            <div
              style={{
                pointerEvents: "auto",
                width: "100%", maxWidth: 680,
                background: "#181740",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 18,
                boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.12)",
                animation: modalAnim,
                overflow: "hidden",
                maxHeight: "90vh",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(255,45,135,0.04) 100%)",
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#E4E4F0" }}>{t("order_form_title")}</div>
                <button
                  onClick={close}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)", color: "#6B6B8F",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,69,96,0.15)"; e.currentTarget.style.color = "#FF4560"; e.currentTarget.style.borderColor = "rgba(255,69,96,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6B6B8F"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {pq.isError ? (
                  <div style={{ color: "#FF4560", fontSize: 13 }}>{t("products_error_title")}</div>
                ) : (
                  <form
                    id="order-form"
                    onSubmit={form.handleSubmit((values) => mutation.mutate(orderCreateSchema.parse(values)))}
                  >
                    {/* Items header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#9090B0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {t("order_form_items")}
                      </span>
                      <button
                        type="button"
                        onClick={addLine}
                        disabled={isBusy}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", borderRadius: 7, cursor: "pointer",
                          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                          color: "#C4B5FD", fontSize: 12, fontWeight: 600,
                        }}
                      >
                        <Plus style={{ width: 12, height: 12 }} />
                        {t("order_form_add")}
                      </button>
                    </div>

                    {/* Column headers */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 90px 110px 36px",
                      gap: 10, marginBottom: 8, padding: "0 2px",
                    }}>
                      {[t("order_form_product"), t("order_form_qty"), t("order_form_line"), ""].map((h, i) => (
                        <div key={i} style={LABEL}>{h}</div>
                      ))}
                    </div>

                    {/* Item rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {itemsSafe.map((it, idx) => {
                        const { unit, line } = calc.lines[idx] ?? { unit: 0, line: 0 }
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "grid", gridTemplateColumns: "1fr 90px 110px 36px",
                              gap: 10, alignItems: "center",
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 10, padding: "10px 12px",
                            }}
                          >
                            <select
                              style={SELECT_STYLE}
                              value={String(it.productId ?? "")}
                              onChange={(e) => {
                                const next = [...itemsSafe]
                                next[idx] = { ...next[idx], productId: e.target.value }
                                form.setValue("items", next, { shouldValidate: true })
                              }}
                              disabled={isBusy}
                            >
                              <option value="">{t("order_form_select")}</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — {formatMoney(p.price)}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              style={INPUT_NUM}
                              value={String(it.quantity ?? 1)}
                              onChange={(e) => {
                                const qty = toQtyNumber(e.target.value)
                                const next = [...itemsSafe]
                                next[idx] = { ...next[idx], quantity: qty }
                                form.setValue("items", next, { shouldValidate: true })
                              }}
                              min={1}
                              step={1}
                              disabled={isBusy}
                            />

                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#E4E4F0" }}>{formatMoney(line)}</div>
                              <div style={{ fontSize: 10, color: "#4A4A6A", marginTop: 2 }}>
                                {t("order_form_unit")} {formatMoney(unit)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              disabled={isBusy}
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.15)",
                                color: "#FF4560", cursor: "pointer", transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,69,96,0.2)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,69,96,0.08)")}
                            >
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {form.formState.errors.items?.message && (
                      <p style={{ fontSize: 11, color: "#FF4560", marginTop: 10 }}>
                        {String(form.formState.errors.items.message)}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Footer */}
              <div style={{
                flexShrink: 0,
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(139,92,246,0.04)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#6B6B8F" }}>{t("order_form_total")}</span>
                  <span style={{
                    fontSize: 22, fontWeight: 800,
                    background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {formatMoney(calc.total)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={close}
                    style={{
                      padding: "9px 18px", borderRadius: 8, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                      color: "#9090B0", fontSize: 13, fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="order-form"
                    disabled={!canSubmit}
                    style={{
                      padding: "9px 22px", borderRadius: 8,
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      background: canSubmit ? "linear-gradient(135deg,#FF2D87,#8B5CF6)" : "rgba(139,92,246,0.3)",
                      border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                      boxShadow: canSubmit ? "0 0 16px rgba(139,92,246,0.4)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {mutation.isPending ? t("order_form_creating") : t("order_form_create")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
