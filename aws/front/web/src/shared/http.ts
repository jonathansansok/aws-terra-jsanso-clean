// aws/front/web/src/shared/http.ts
import { env } from "./env"
import type { ApiResponse } from "./types/api"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

type ReqCfg = {
  method: HttpMethod
  path: string
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

function safeJsonParse(text: string, ctx: { url: string }) : unknown | null {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    console.warn("[apiFetch] json parse failed", { url: ctx.url, text })
    return null
  }
}

function pickErrMessage(details: unknown, status: number): { code: string; message: string } {
  // Convenciones típicas: { error: { code, message } } o { message }
  if (typeof details === "object" && details !== null) {
    const rec = details as Record<string, unknown>

    const errorObj = rec.error
    if (typeof errorObj === "object" && errorObj !== null) {
      const errRec = errorObj as Record<string, unknown>
      const code = typeof errRec.code === "string" ? errRec.code : "HTTP_ERROR"
      const message =
        typeof errRec.message === "string" ? errRec.message :
        typeof rec.message === "string" ? rec.message :
        `HTTP ${status}`
      return { code, message }
    }

    if (typeof rec.message === "string") {
      return { code: "HTTP_ERROR", message: rec.message }
    }
  }

  return { code: "HTTP_ERROR", message: `HTTP ${status}` }
}

function getNetworkMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  return "Network error"
}

export async function apiFetch<T>(cfg: ReqCfg): Promise<ApiResponse<T>> {
  const url = `${env.apiBaseUrl}${cfg.path}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(cfg.headers || {}),
  }

  console.log("[apiFetch] request", {
    url,
    method: cfg.method,
    body: cfg.body,
  })

  try {
    const res = await fetch(url, {
      method: cfg.method,
      headers,
      body: cfg.body ? JSON.stringify(cfg.body) : undefined,
      signal: cfg.signal,
    })

    const text = await res.text()
    const json = safeJsonParse(text, { url })

    console.log("[apiFetch] response", {
      url,
      status: res.status,
      ok: res.ok,
      json,
    })

    if (!res.ok) {
      const { code, message } = pickErrMessage(json, res.status)
      return { ok: false, error: { code, message, details: json } }
    }

    return { ok: true, data: (json ?? null) as T }
  } catch (e: unknown) {
    console.error("[apiFetch] network error", { url, error: getNetworkMessage(e), raw: e })
    return {
      ok: false,
      error: { code: "NETWORK_ERROR", message: getNetworkMessage(e), details: e },
    }
  }
}
