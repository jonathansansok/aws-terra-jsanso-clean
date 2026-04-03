// aws/front/web/src/features/products/ProductFormDialog.tsx
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { productCreateSchema, type ProductCreateFormValues, type ProductCreatePayload } from "./schema"
import { createProduct, updateProduct } from "./api"
import { toastErr, toastOk } from "../../shared/toast"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import type { Product } from "./types"
import { Pencil, Plus } from "lucide-react"
import { useT } from "../../i18n/I18nContext"

type ApiErrorLike = unknown

function getErrMessage(e: ApiErrorLike): string {
  if (e instanceof Error) return e.message
  if (typeof e === "object" && e !== null) {
    const rec = e as Record<string, unknown>
    if (typeof rec.message === "string") return rec.message
  }
  return "Operation failed"
}

type Props = {
  product?: Product
}

export default function ProductFormDialog({ product }: Props) {
  const isEdit = !!product
  const qc = useQueryClient()
  const { t } = useT()

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: product?.name ?? "",
      price: product?.price ?? 0,
      active: product?.active ?? true,
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (product) {
      form.reset({ name: product.name, price: product.price, active: product.active })
    }
  }, [product?.id])

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
    },
    onError: (e: unknown) => {
      toastErr(getErrMessage(e), e)
    },
  })

  const isBusy = mutation.isPending
  const canSubmit = useMemo(() => form.formState.isValid && !isBusy, [form.formState.isValid, isBusy])
  const { register, handleSubmit, formState: { errors } } = form
  const nameReg = register("name")
  const priceReg = register("price", { valueAsNumber: true })

  return (
    <Dialog>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">{t("product_form_edit_label")}</span>
          </Button>
        ) : (
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t("products_new")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("product_form_edit_title") : t("product_form_new_title")}</DialogTitle>
        </DialogHeader>

        <form
          className="mt-2 space-y-4"
          onSubmit={handleSubmit((values) => {
            const payload = productCreateSchema.parse(values)
            mutation.mutate(payload)
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">{t("product_form_name")}</Label>
            <Input
              id="name"
              placeholder={t("product_form_name_placeholder")}
              className="h-9"
              {...nameReg}
              onChange={(e) => nameReg.onChange(e)}
            />
            {errors.name?.message && (
              <p className="text-xs text-destructive">{String(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs font-medium">{t("product_form_price")}</Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder={t("product_form_price_placeholder")}
              className="h-9"
              {...priceReg}
              onChange={(e) => priceReg.onChange(e)}
            />
            {errors.price?.message && (
              <p className="text-xs text-destructive">{String(errors.price.message)}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit} className="h-9">
              {isBusy
                ? (isEdit ? t("product_form_saving") : t("product_form_creating"))
                : (isEdit ? t("product_form_save") : t("product_form_create"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
