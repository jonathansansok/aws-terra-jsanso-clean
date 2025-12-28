import { apiFetch } from "../../shared/http"
import type { Order } from "./types"
import type { OrderCreateInput } from "./schema"

export async function getOrders() {
  console.log("[orders.api] getOrders")
  return apiFetch<Order[]>({ method: "GET", path: "/orders" })
}

export async function createOrder(input: OrderCreateInput) {
  console.log("[orders.api] createOrder", input)
  return apiFetch<Order>({ method: "POST", path: "/orders", body: input })
}
