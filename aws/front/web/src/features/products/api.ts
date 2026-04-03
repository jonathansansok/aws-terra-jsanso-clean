// aws/front/web/src/features/products/api.ts
import { apiFetch } from "../../shared/http"
import type { Product } from "./types"
import type { ProductCreatePayload, ProductUpdatePayload } from "./schema"

export async function getProducts() {
  return apiFetch<Product[]>({ method: "GET", path: "/products" })
}

export async function createProduct(input: ProductCreatePayload) {
  return apiFetch<Product>({ method: "POST", path: "/products", body: input })
}

export async function updateProduct(id: string, input: ProductUpdatePayload) {
  return apiFetch<Product>({ method: "PATCH", path: `/products/${id}`, body: input })
}

export async function deleteProduct(id: string) {
  return apiFetch<{ ok: boolean }>({ method: "DELETE", path: `/products/${id}` })
}
