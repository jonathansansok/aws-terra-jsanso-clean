// aws/front/web/src/features/products/ProductFormDialog.tsx
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { productCreateSchema, type ProductCreateFormValues, type ProductCreatePayload } from "./schema"
import { createProduct } from "./api"
import { toastErr, toastOk } from "../../shared/toast"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

type ApiErrorLike = unknown

function getErrMessage(e: ApiErrorLike): string {
  if (e instanceof Error) return e.message
  if (typeof e === "object" && e !== null) {
    const rec = e as Record<string, unknown>
    if (typeof rec.message === "string") return rec.message
  }
  return "Failed to create product"
}

export default function ProductFormDialog() {
  const qc = useQueryClient()

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: { name: "", price: 0, active: true },
    mode: "onChange",
  })

  console.log("[ProductFormDialog] init defaultValues=", form.getValues())

  const mutation = useMutation({
    mutationFn: async (payload: ProductCreatePayload) => {
      console.log("[ProductFormDialog] mutate payload=", payload, "typeof price=", typeof payload.price)
      const res = await createProduct(payload)
      console.log("[ProductFormDialog] mutate res=", res)
      if (!res.ok) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      console.log("[ProductFormDialog] success data=", data)
      toastOk("Product created")
      qc.invalidateQueries({ queryKey: ["products"] })
      form.reset({ name: "", price: 0, active: true })
      console.log("[ProductFormDialog] reset done values=", form.getValues())
    },
    onError: (e: unknown) => {
      console.error("[ProductFormDialog] error e=", e)
      toastErr(getErrMessage(e), e)
    },
  })

  const isBusy = mutation.isPending
  const canSubmit = useMemo(() => form.formState.isValid && !isBusy, [form.formState.isValid, isBusy])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  // ✅ registrás una vez (no dentro del onChange)
  const nameReg = register("name")
  const priceReg = register("price", { valueAsNumber: true })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => console.log("[ProductFormDialog] open")}>New product</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            console.log("[ProductFormDialog] submit raw values=", values, "typeof price=", typeof values.price)

            // ✅ Contrato: parseamos y mandamos payload tipado (default aplicado)
            const payload = productCreateSchema.parse(values)

            console.log("[ProductFormDialog] submit payload parsed=", payload, "typeof price=", typeof payload.price)
            mutation.mutate(payload)
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Coca Cola 500ml"
              {...nameReg}
              onChange={(e) => {
                console.log("[ProductFormDialog] name change raw=", e.target.value)
                nameReg.onChange(e)
              }}
            />
            {errors.name?.message ? <p className="text-sm text-red-600">{String(errors.name.message)}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="1200"
              {...priceReg}
              onChange={(e) => {
                console.log("[ProductFormDialog] price raw change=", e.target.value)
                priceReg.onChange(e)
              }}
            />
            {errors.price?.message ? <p className="text-sm text-red-600">{String(errors.price.message)}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button type="submit" disabled={!canSubmit} onClick={() => console.log("[ProductFormDialog] submit click")}>
              {isBusy ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
