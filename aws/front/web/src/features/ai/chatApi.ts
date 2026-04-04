import { apiFetch } from "../../shared/http"

export async function generateDescription(name: string, price?: number) {
  return apiFetch<{ description: string }>({
    method: "POST",
    path: "/ai/describe",
    body: { name, price },
  })
}

export async function sendChatMessage(message: string) {
  return apiFetch<{ reply: string }>({
    method: "POST",
    path: "/ai/chat",
    body: { message },
  })
}
