// aws/front/web/src/features/products/api.ts
import { apiFetch } from "../../shared/http"
import type { Product } from "./types"
import type { ProductCreatePayload } from "./schema"

export async function getProducts() {
  console.log("[products.api] getProducts")
  return apiFetch<Product[]>({ method: "GET", path: "/products" })
}

export async function createProduct(input: ProductCreatePayload) {
  console.log("[products.api] createProduct payload=", input)
  return apiFetch<Product>({ method: "POST", path: "/products", body: input })
}
