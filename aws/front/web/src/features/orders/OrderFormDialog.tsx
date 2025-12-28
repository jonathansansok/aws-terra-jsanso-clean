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

function toErrMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message?: unknown }).message ?? "Error")
  return "Error"
}

export default function OrderFormDialog() {
  const qc = useQueryClient()

  const pq = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      console.log("[OrderFormDialog] query products")
      const res = await getProducts()
      if (!res.ok) throw res.error
      return res.data
    },
  })

  const products = useMemo<Product[]>(() => {
    const list = pq.data ?? []
    console.log("[OrderFormDialog] products memo", { count: list.length })
    return list
  }, [pq.data])

  const form = useForm<OrderCreateFormValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: { items: [{ productId: "", qty: 1 }] },
    mode: "onChange",
  })

  const items = useWatch({ control: form.control, name: "items" })

  const itemsSafe = useMemo(() => {
    const out = items ?? []
    console.log("[OrderFormDialog] itemsSafe", { len: out.length })
    return out
  }, [items])

  const mutation = useMutation({
    mutationFn: async (input: OrderCreateInput) => {
      console.log("[OrderFormDialog] mutate", input)
      const res = await createOrder(input)
      if (!res.ok) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      console.log("[OrderFormDialog] success", data)
      toastOk("Order created")
      qc.invalidateQueries({ queryKey: ["orders"] })
      form.reset({ items: [{ productId: "", qty: 1 }] })
    },
    onError: (e: unknown) => {
      console.error("[OrderFormDialog] error", e)
      toastErr(toErrMessage(e), e)
    },
  })

  const calc = useMemo(() => {
    const priceById = new Map<string, number>(products.map((p) => [p.id, toMoneyNumber(p.price)]))

    const lines = itemsSafe.map((it) => {
      const unit = priceById.get(it.productId ?? "") ?? 0
      const qty = Number(it.qty ?? 0) || 0
      const line = unit * qty
      return { productId: String(it.productId ?? ""), qty, unit, line }
    })

    const total = lines.reduce((acc, l) => acc + l.line, 0)

    console.log("[OrderFormDialog] calc", { linesCount: lines.length, total })

    return { lines, total }
  }, [itemsSafe, products])

  const isBusy = mutation.isPending || pq.isFetching
  const canSubmit = form.formState.isValid && !isBusy

  function addLine() {
    console.log("[OrderFormDialog] addLine")
    const next = [...itemsSafe, { productId: "", qty: 1 }]
    form.setValue("items", next, { shouldValidate: true })
  }

  function removeLine(idx: number) {
    console.log("[OrderFormDialog] removeLine", idx)
    const next = itemsSafe.filter((_, i) => i !== idx)
    form.setValue("items", next.length ? next : [{ productId: "", qty: 1 }], { shouldValidate: true })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => console.log("[OrderFormDialog] open")}>New order</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
        </DialogHeader>

        {pq.isError ? (
          <div className="text-sm text-red-600">Failed to load products for order</div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              console.log("[OrderFormDialog] submit raw", values)
              const parsed = orderCreateSchema.parse(values)
              console.log("[OrderFormDialog] submit parsed", parsed)
              mutation.mutate(parsed)
            })}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Items</div>
                <Button type="button" variant="outline" onClick={addLine} disabled={isBusy}>
                  Add item
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
                        <Label>Product</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                          value={String(it.productId ?? "")}
                          onChange={(e) => {
                            console.log("[OrderFormDialog] product change", { idx, v: e.target.value })
                            const next = [...itemsSafe]
                            next[idx] = { ...next[idx], productId: e.target.value }
                            form.setValue("items", next, { shouldValidate: true })
                          }}
                          disabled={isBusy}
                        >
                          <option value="">Select…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatMoney(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          value={String(it.qty ?? 1)}
                          onChange={(e) => {
                            console.log("[OrderFormDialog] qty change", { idx, v: e.target.value })
                            const next = [...itemsSafe]
                            next[idx] = { ...next[idx], qty: e.target.value as unknown }
                            form.setValue("items", next, { shouldValidate: true })
                          }}
                          min={1}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Line</Label>
                        <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm">
                          {formatMoney(line)}
                        </div>
                        <div className="text-xs text-muted-foreground">unit: {formatMoney(unit)}</div>
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
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-lg font-semibold">{formatMoney(calc.total)}</div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="submit" disabled={!canSubmit} onClick={() => console.log("[OrderFormDialog] submit click")}>
                {mutation.isPending ? "Creating..." : "Create order"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
