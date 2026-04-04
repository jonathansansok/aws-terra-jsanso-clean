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
import { generateDescription } from "../ai/chatApi"

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
  const [genLoading, setGenLoading] = useState(false)
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
    defaultValues: {
      name: product?.name ?? "",
      price: product?.price ?? 0,
      active: product?.active ?? true,
      description: product?.description ?? "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        price: product.price,
        active: product.active,
        description: product.description ?? "",
      })
    }
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
      if (!isEdit) form.reset({ name: "", price: 0, active: true, description: "" })
      close()
    },
    onError: (e: unknown) => toastErr(getErrMessage(e), e),
  })

  const handleGenerate = async () => {
    const name = form.getValues("name")
    const price = form.getValues("price")
    if (!name || name.length < 2) return
    setGenLoading(true)
    try {
      const res = await generateDescription(name, price || undefined)
      if (res.ok) form.setValue("description", res.data.description, { shouldValidate: true })
      else toastErr(res.error.message)
    } finally {
      setGenLoading(false)
    }
  }

  const isBusy = mutation.isPending
  const canSubmit = useMemo(() => form.formState.isValid && !isBusy, [form.formState.isValid, isBusy])
  const { register, handleSubmit, formState: { errors }, watch } = form
  const nameReg = register("name")
  const priceReg = register("price", { valueAsNumber: true })
  const descReg = register("description")
  const nameValue = watch("name")

  const backdropAnim = closing ? "backdropOut 0.2s ease forwards" : "backdropIn 0.2s ease forwards"
  const modalAnim = closing ? "modalOut 0.2s ease forwards" : "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards"

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setOpen(true)}
          title={t("product_form_edit_label")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 10px", borderRadius: 8, cursor: "pointer",
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)",
            color: "#A78BFA", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139,92,246,0.22)"
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"
            e.currentTarget.style.color = "#C4B5FD"
            e.currentTarget.style.boxShadow = "0 0 12px rgba(139,92,246,0.25)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139,92,246,0.1)"
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.22)"
            e.currentTarget.style.color = "#A78BFA"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <Pencil style={{ width: 13, height: 13, flexShrink: 0 }} />
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

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={{ ...LABEL, marginBottom: 0 }}>{t("product_form_description")}</label>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={genLoading || !nameValue || nameValue.length < 2}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                          background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                          color: "#A78BFA", fontSize: 11, fontWeight: 600,
                          opacity: (genLoading || !nameValue || nameValue.length < 2) ? 0.5 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {genLoading ? t("ai_generating") : "✨ Generate"}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder={t("product_form_description_placeholder")}
                      style={{ ...INPUT, resize: "vertical", minHeight: 72, fontFamily: "inherit" }}
                      {...descReg}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    {errors.description?.message && (
                      <p style={{ fontSize: 11, color: "#FF4560", marginTop: 5 }}>{String(errors.description.message)}</p>
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
