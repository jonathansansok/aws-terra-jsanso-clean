import { createBrowserRouter, Navigate } from "react-router-dom"
import AppShell from "../components/layout/AppShell"
import DashboardPage from "../features/dashboard/DashboardPage"
import ProductsPage from "../features/products/ProductsPage"
import OrdersPage from "../features/orders/OrdersPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "orders", element: <OrdersPage /> },
    ],
  },
])
