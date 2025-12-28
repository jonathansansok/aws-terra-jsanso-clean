export type OrderItemInput = { productId: string; qty: number }

export type Order = {
  id: string
  total: unknown
  createdAt: string
}