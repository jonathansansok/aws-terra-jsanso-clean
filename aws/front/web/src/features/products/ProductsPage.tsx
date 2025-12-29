// aws/front/web/src/features/products/ProductsPage.tsx
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "./api"
import { toastErr } from "../../shared/toast"
import ProductFormDialog from "./ProductFormDialog"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Skeleton } from "../../components/ui/skeleton"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

import { formatMoney } from "../../shared/money"
import { Package, Search, RefreshCcw, Dot } from "lucide-react"
import { cn } from "@/lib/utils"

type Product = {
  id: number | string
  name: string
  price: number
  active: boolean
}

function EmptyState({
  title,
  desc,
  action,
}: {
  title: string
  desc: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/30 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/40">
        <Package className="h-6 w-6 opacity-80" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      </div>
      {action}
    </div>
  )
}

export default function ProductsPage() {
  const [query, setQuery] = React.useState("")

  const q = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      console.log("[ProductsPage] query products")
      const res = await getProducts()
      if (!res.ok) {
        console.log("[ProductsPage] query FAIL", res.error)
        toastErr(res.error.message, res.error)
        throw res.error
      }
      console.log("[ProductsPage] query OK", { count: res.data?.length ?? 0 })
      return res.data as Product[]
    },
  })

  const stats = React.useMemo(() => {
    const all = q.data ?? []
    const active = all.filter((p) => p.active).length
    const inactive = all.length - active
    return { total: all.length, active, inactive }
  }, [q.data])

  const filtered = React.useMemo(() => {
    const all = q.data ?? []
    const qq = query.trim().toLowerCase()
    if (!qq) return all
    return all.filter((p) => p.name.toLowerCase().includes(qq))
  }, [q.data, query])

  console.log("[ProductsPage] render", {
    status: q.status,
    isFetching: q.isFetching,
    total: stats.total,
    query,
    filtered: filtered.length,
  })

  return (
    <div className="space-y-5">
      {/* Page Header (dashboard) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/40">
              <Package className="h-4 w-4 opacity-80" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage catalog items for the POS flow
          </p>

          {/* quick stats */}
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Active:</span>{" "}
              <span className="font-semibold">{stats.active}</span>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Inactive:</span>{" "}
              <span className="font-semibold">{stats.inactive}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("[ProductsPage] refetch click")
              q.refetch()
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <ProductFormDialog />
        </div>
      </div>

      {/* Main card */}
      <Card className={cn("rounded-2xl border-border/50 bg-card/60 backdrop-blur")}>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Catalog</CardTitle>
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground/80">{filtered.length}</span>{" "}
                of <span className="font-semibold text-foreground/80">{stats.total}</span>
              </div>
            </div>

            {/* toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  value={query}
                  onChange={(e) => {
                    console.log("[ProductsPage] search change", e.target.value)
                    setQuery(e.target.value)
                  }}
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>
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
              <div className="font-semibold">Failed to load products</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Check API connectivity and try again.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={stats.total === 0 ? "No products yet" : "No matches"}
              desc={
                stats.total === 0
                  ? "Create your first product to start building the catalog."
                  : "Try a different search query."
              }
              action={<ProductFormDialog />}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/50">
              {/* scroll interno para que no quede “alargo” */}
              <div className="max-h-[65vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[55%]">Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        className={cn(
                          "transition-colors",
                          idx % 2 === 0 ? "bg-background/20" : "bg-transparent",
                          "hover:bg-accent/40"
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{p.name}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatMoney(p.price)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            variant={p.active ? "default" : "secondary"}
                            className={cn("inline-flex items-center gap-1")}
                          >
                            <Dot className={cn("h-4 w-4", p.active ? "opacity-90" : "opacity-60")} />
                            {p.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
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
