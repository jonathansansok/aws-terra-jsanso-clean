import { toast } from "sonner"

export function toastOk(message: string, meta?: unknown) {
  console.log("[toastOk]", message, meta)
  toast.success(message)
}

export function toastErr(message: string, meta?: unknown) {
  console.error("[toastErr]", message, meta)
  toast.error(message)
}
