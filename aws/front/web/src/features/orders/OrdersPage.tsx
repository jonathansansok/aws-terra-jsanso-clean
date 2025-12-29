// aws/front/web/src/features/orders/OrdersPage.tsx
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { getOrders } from "./api"
import { toastErr } from "../../shared/toast"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Skeleton } from "../../components/ui/skeleton"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { formatMoney } from "../../shared/money"
import OrderFormDialog from "./OrderFormDialog"
import { ShoppingCart, Search, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type Order = {
  id: number | string
  total: number
  createdAt: string
}

function fmtDate(s: string) {
  try {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? s : d.toLocaleString()
  } catch {
    return s
  }
}

export default function OrdersPage() {
  const [query, setQuery] = React.useState("")

  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      console.log("[OrdersPage] query orders")
      const res = await getOrders()
      if (!res.ok) {
        console.log("[OrdersPage] query FAIL", res.error)
        toastErr(res.error.message, res.error)
        throw res.error
      }
      console.log("[OrdersPage] query OK", { count: res.data?.length ?? 0 })
      return res.data as Order[]
    },
  })

  const filtered = React.useMemo(() => {
    const all = q.data ?? []
    const qq = query.trim().toLowerCase()
    if (!qq) return all
    return all.filter((o) => String(o.id).toLowerCase().includes(qq))
  }, [q.data, query])

  console.log("[OrdersPage] render", {
    status: q.status,
    isFetching: q.isFetching,
    query,
    filtered: filtered.length,
  })

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/40">
              <ShoppingCart className="h-4 w-4 opacity-80" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create and list orders</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("[OrdersPage] refetch click")
              q.refetch()
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <OrderFormDialog />
        </div>
      </div>

      <Card className={cn("rounded-2xl border-border/50 bg-card/60 backdrop-blur")}>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Latest Orders</CardTitle>
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground/80">{filtered.length}</span>
              </div>
            </div>

            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input
                value={query}
                onChange={(e) => {
                  console.log("[OrdersPage] search change", e.target.value)
                  setQuery(e.target.value)
                }}
                placeholder="Search by order ID..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {q.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : q.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold">Failed to load orders</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Check API connectivity and try again.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/30 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/40">
                <ShoppingCart className="h-6 w-6 opacity-80" />
              </div>
              <div>
                <div className="text-sm font-semibold">No orders found</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Create one to validate the flow end-to-end.
                </div>
              </div>
              <OrderFormDialog />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/50">
              <div className="max-h-[65vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((o, idx) => (
                      <TableRow
                        key={o.id}
                        className={cn(
                          "transition-colors",
                          idx % 2 === 0 ? "bg-background/20" : "bg-transparent",
                          "hover:bg-accent/40"
                        )}
                      >
                        <TableCell className="font-medium">{o.id}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(o.total)}</TableCell>
                        <TableCell className="text-right">{fmtDate(o.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
