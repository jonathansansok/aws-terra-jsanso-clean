import { useQuery } from "@tanstack/react-query"
import { getProducts } from "./api"
import { toastErr } from "../../shared/toast"
import ProductFormDialog from "./ProductFormDialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Skeleton } from "../../components/ui/skeleton"
import { formatMoney } from "../../shared/money"
export default function ProductsPage() {
  const q = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      console.log("[ProductsPage] query products")
      const res = await getProducts()
      if (!res.ok) {
        toastErr(res.error.message, res.error)
        throw res.error
      }
      return res.data
    },
  })

  console.log("[ProductsPage] render", { status: q.status, isFetching: q.isFetching })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage catalog items for the POS flow</p>
        </div>
        <ProductFormDialog />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">List</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : q.isError ? (
            <div className="text-sm text-red-600">Failed to load products</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
