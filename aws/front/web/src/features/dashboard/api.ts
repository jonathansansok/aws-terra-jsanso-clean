// aws/front/web/src/features/dashboard/api.ts
import { apiFetch } from "../../shared/http"

export type DayStats = { date: string; orders: number; revenue: number }
export type TopProduct = { name: string; revenue: number; units: number }

export type DashboardStats = {
  totalRevenue: number
  totalOrders: number
  ordersToday: number
  revenueToday: number
  totalProducts: number
  activeProducts: number
  revenueByDay: DayStats[]
  topProducts: TopProduct[]
}

export async function getDashboardStats() {
  return apiFetch<DashboardStats>({ method: "GET", path: "/stats" })
}
