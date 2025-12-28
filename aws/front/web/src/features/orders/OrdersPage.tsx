import { useQuery } from "@tanstack/react-query"
import { getOrders } from "./api"
import { toastErr } from "../../shared/toast"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { formatMoney } from "../../shared/money"
import OrderFormDialog from "./OrderFormDialog"

export default function OrdersPage() {
  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      console.log("[OrdersPage] query orders")
      const res = await getOrders()
      if (!res.ok) {
        toastErr(res.error.message, res.error)
        throw res.error
      }
      return res.data
    },
  })

  console.log("[OrdersPage] render", { status: q.status, isFetching: q.isFetching })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">Create and list orders</p>
        </div>
        <OrderFormDialog />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Latest</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isError ? (
            <div className="text-sm text-red-600">Failed to load orders</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell className="text-right">{formatMoney(o.total)}</TableCell>
                    <TableCell className="text-right">{new Date(o.createdAt).toLocaleString()}</TableCell>
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
