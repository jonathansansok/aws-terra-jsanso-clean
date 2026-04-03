// aws/front/web/src/features/orders/OrderFormDialog.tsx
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orderCreateSchema } from "./schema"
import type { OrderCreateFormValues, OrderCreateInput } from "./schema"
import { createOrder } from "./api"
import { getProducts } from "../products/api"
import { toastErr, toastOk } from "../../shared/toast"
import { formatMoney, toMoneyNumber } from "../../shared/money"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import type { Product } from "../products/types"
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

export default function OrderFormDialog() {
  const qc = useQueryClient()
  const { t } = useT()

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
    },
    onError: (e: unknown) => {
      toastErr(toErrMessage(e), e)
    },
  })

  const calc = useMemo(() => {
    const priceById = new Map<string, number>(products.map((p) => [p.id, toMoneyNumber(p.price)]))
    const lines = itemsSafe.map((it) => {
      const unit = priceById.get(it.productId ?? "") ?? 0
      const qty = Number(it.quantity ?? 0) || 0
      const line = unit * qty
      return { productId: String(it.productId ?? ""), qty, unit, line }
    })
    const total = lines.reduce((acc, l) => acc + l.line, 0)
    return { lines, total }
  }, [itemsSafe, products])

  const isBusy = mutation.isPending || pq.isFetching
  const canSubmit = form.formState.isValid && !isBusy

  function addLine() {
    form.setValue("items", [...itemsSafe, { productId: "", quantity: 1 }], { shouldValidate: true })
  }

  function removeLine(idx: number) {
    const next = itemsSafe.filter((_, i) => i !== idx)
    const safeNext: OrderCreateFormValues["items"] = next.length ? next : [{ productId: "", quantity: 1 }]
    form.setValue("items", safeNext, { shouldValidate: true })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          style={{
            background: "linear-gradient(135deg,#FF2D87,#8B5CF6)",
            border: "none",
            boxShadow: "0 0 16px rgba(139,92,246,0.4)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {t("orders_new")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{t("order_form_title")}</DialogTitle>
        </DialogHeader>

        {pq.isError ? (
          <div className="text-sm text-red-600">{t("products_error_title")}</div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              const parsed = orderCreateSchema.parse(values)
              mutation.mutate(parsed)
            })}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{t("order_form_items")}</div>
                <Button type="button" variant="outline" onClick={addLine} disabled={isBusy}>
                  {t("order_form_add")}
                </Button>
              </div>

              <div className="space-y-3">
                {itemsSafe.map((it, idx) => {
                  const unit = calc.lines[idx]?.unit ?? 0
                  const line = calc.lines[idx]?.line ?? 0

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_140px_140px_44px]"
                    >
                      <div className="space-y-2">
                        <Label>{t("order_form_product")}</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                          value={String(it.productId ?? "")}
                          onChange={(e) => {
                            const next: OrderCreateFormValues["items"] = [...itemsSafe]
                            next[idx] = { ...next[idx], productId: e.target.value }
                            form.setValue("items", next, { shouldValidate: true })
                          }}
                          disabled={isBusy}
                        >
                          <option value="">{t("order_form_select")}</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatMoney(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("order_form_qty")}</Label>
                        <Input
                          type="number"
                          value={String(it.quantity ?? 1)}
                          onChange={(e) => {
                            const qty = toQtyNumber(e.target.value)
                            const next: OrderCreateFormValues["items"] = [...itemsSafe]
                            next[idx] = { ...next[idx], quantity: qty }
                            form.setValue("items", next, { shouldValidate: true })
                          }}
                          min={1}
                          step={1}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("order_form_line")}</Label>
                        <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm">
                          {formatMoney(line)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("order_form_unit")} {formatMoney(unit)}</div>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeLine(idx)}
                          disabled={isBusy}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {form.formState.errors.items?.message ? (
                <p className="text-sm text-red-600">{String(form.formState.errors.items.message)}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="text-sm text-muted-foreground">{t("order_form_total")}</div>
              <div className="text-lg font-semibold">{formatMoney(calc.total)}</div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="submit" disabled={!canSubmit}>
                {mutation.isPending ? t("order_form_creating") : t("order_form_create")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
