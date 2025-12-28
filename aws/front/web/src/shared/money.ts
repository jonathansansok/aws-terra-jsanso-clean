function hasToString(v: unknown): v is { toString: () => string } {
  return !!v && typeof v === "object" && typeof (v as { toString?: unknown }).toString === "function"
}

export function toMoneyNumber(v: unknown): number {
  console.log("[toMoneyNumber] in", v, typeof v)

  if (typeof v === "number") {
    if (Number.isFinite(v)) return v
    return 0
  }

  if (typeof v === "string") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
    return 0
  }

  if (hasToString(v)) {
    const s = v.toString()
    console.log("[toMoneyNumber] object toString", s)
    const n = Number(s)
    if (Number.isFinite(n)) return n
    return 0
  }

  return 0
}

export function formatMoney(v: unknown, currency = "USD") {
  const n = toMoneyNumber(v)
  const out = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n)
  console.log("[formatMoney]", { v, n, out })
  return out
}
