// aws/front/web/src/features/products/ProductFormDialog.tsx
import { useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { productCreateSchema, type ProductCreateFormValues, type ProductCreatePayload } from "./schema"
import { createProduct, updateProduct } from "./api"
import { toastErr, toastOk } from "../../shared/toast"
import type { Product } from "./types"
import { Pencil, Plus, X } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

function getErrMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "object" && e !== null) {
    const rec = e as Record<string, unknown>
    if (typeof rec.message === "string") return rec.message
  }
  return "Operation failed"
}

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "#E4E4F0",
  outline: "none",
  transition: "border-color 0.15s",
}

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#6B6B8F",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
  display: "block",
}

type Props = { product?: Product }

export default function ProductFormDialog({ product }: Props) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const isEdit = !!product
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

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: { name: product?.name ?? "", price: product?.price ?? 0, active: product?.active ?? true },
    mode: "onChange",
  })

  useEffect(() => {
    if (product && open) form.reset({ name: product.name, price: product.price, active: product.active })
  }, [product?.id, open])

  const mutation = useMutation({
    mutationFn: async (payload: ProductCreatePayload) => {
      if (isEdit && product) {
        const res = await updateProduct(product.id as string, payload)
        if (!res.ok) throw res.error
        return res.data
      }
      const res = await createProduct(payload)
      if (!res.ok) throw res.error
      return res.data
    },
    onSuccess: () => {
      toastOk(isEdit ? t("toast_product_updated") : t("toast_product_created"))
      qc.invalidateQueries({ queryKey: ["products"] })
      if (!isEdit) form.reset({ name: "", price: 0, active: true })
      close()
    },
    onError: (e: unknown) => toastErr(getErrMessage(e), e),
  })

  const isBusy = mutation.isPending
  const canSubmit = useMemo(() => form.formState.isValid && !isBusy, [form.formState.isValid, isBusy])
  const { register, handleSubmit, formState: { errors } } = form
  const nameReg = register("name")
  const priceReg = register("price", { valueAsNumber: true })

  const backdropAnim = closing ? "backdropOut 0.2s ease forwards" : "backdropIn 0.2s ease forwards"
  const modalAnim = closing ? "modalOut 0.2s ease forwards" : "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards"

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 28, height: 28, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
            cursor: "pointer", transition: "all 0.15s", color: "#8B5CF6",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.22)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)" }}
        >
          <Pencil style={{ width: 13, height: 13 }} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
            boxShadow: "0 0 16px rgba(139,92,246,0.4)",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          {t("products_new")}
        </button>
      )}

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
                width: "100%", maxWidth: 440,
                background: "#181740",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 18,
                boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.12)",
                animation: modalAnim,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(255,45,135,0.04) 100%)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#E4E4F0" }}>
                  {isEdit ? t("product_form_edit_title") : t("product_form_new_title")}
                </div>
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

              {/* Form */}
              <form
                style={{ padding: "24px" }}
                onSubmit={handleSubmit((values) => mutation.mutate(productCreateSchema.parse(values)))}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={LABEL}>{t("product_form_name")}</label>
                    <input
                      style={INPUT}
                      placeholder={t("product_form_name_placeholder")}
                      {...nameReg}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    {errors.name?.message && (
                      <p style={{ fontSize: 11, color: "#FF4560", marginTop: 5 }}>{String(errors.name.message)}</p>
                    )}
                  </div>

                  <div>
                    <label style={LABEL}>{t("product_form_price")}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder={t("product_form_price_placeholder")}
                      style={INPUT}
                      {...priceReg}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    {errors.price?.message && (
                      <p style={{ fontSize: 11, color: "#FF4560", marginTop: 5 }}>{String(errors.price.message)}</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
                    disabled={!canSubmit}
                    style={{
                      padding: "9px 22px", borderRadius: 8, cursor: canSubmit ? "pointer" : "not-allowed",
                      background: canSubmit ? "linear-gradient(135deg,#FF2D87,#8B5CF6)" : "rgba(139,92,246,0.3)",
                      border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                      boxShadow: canSubmit ? "0 0 16px rgba(139,92,246,0.4)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {isBusy
                      ? (isEdit ? t("product_form_saving") : t("product_form_creating"))
                      : (isEdit ? t("product_form_save") : t("product_form_create"))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
