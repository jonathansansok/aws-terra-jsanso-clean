import type { PropsWithChildren } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "../components/ui/sonner"
import { queryClient } from "../shared/queryClient"

export default function Providers({ children }: PropsWithChildren) {
  console.log("[Providers] render")
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  )
}
