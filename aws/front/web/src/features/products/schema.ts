// aws/front/web/src/features/products/schema.ts
import { z } from "zod"

export const productCreateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  price: z.number().min(0, "Price must be >= 0"),
  active: z.boolean().optional().default(true),
  description: z.string().max(300).optional(),
})

export const productUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  price: z.number().min(0).optional(),
  active: z.boolean().optional(),
  description: z.string().max(300).optional(),
})

export type ProductCreateFormValues = z.input<typeof productCreateSchema>
export type ProductCreatePayload = z.output<typeof productCreateSchema>
export type ProductUpdatePayload = z.output<typeof productUpdateSchema>
