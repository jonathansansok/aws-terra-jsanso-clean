import { z } from "zod"

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.coerce.number().int().min(1).max(100),
      })
    )
    .min(1, "Add at least one item"),
})

export type OrderCreateInput = z.output<typeof orderCreateSchema>
export type OrderCreateFormValues = z.input<typeof orderCreateSchema>
