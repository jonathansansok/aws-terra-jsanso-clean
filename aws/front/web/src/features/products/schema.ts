// aws/front/web/src/features/products/schema.ts
import { z } from "zod"

export const productCreateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),

  // ✅ RHF asegura number con valueAsNumber
  // ✅ schema valida number real
  price: z.number().min(0, "Price must be >= 0"),

  // ✅ en el form puede venir undefined, pero parse() garantiza boolean final
  active: z.boolean().optional().default(true),
})

// Form: lo que RHF manipula (active puede venir undefined)
export type ProductCreateFormValues = z.input<typeof productCreateSchema>

// Payload: lo que sale de parse() (active siempre boolean)
export type ProductCreatePayload = z.output<typeof productCreateSchema>
