// aws/front/web/src/shared/env.ts
function normalizeApiBaseUrl(raw: string): string {
  const v = raw.trim()

  // Si viene vacío, default contractual.
  if (!v) return "/api"

  // Si viene "http://..." o "https://..." lo usamos tal cual (modo absoluto).
  if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, "")

  // Si viene "/api" o "api" o "api/" lo normalizamos a "/api"
  const withSlash = v.startsWith("/") ? v : `/${v}`
  return withSlash.replace(/\/+$/, "")
}

const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(raw),
}

console.log("[env] VITE_API_BASE_URL raw =", raw)
console.log("[env] apiBaseUrl normalized =", env.apiBaseUrl)
