import type { PropsWithChildren } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "../components/ui/sonner"
import { queryClient } from "../shared/queryClient"
import { I18nProvider } from "../i18n/I18nContext"

export default function Providers({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </I18nProvider>
  )
}
