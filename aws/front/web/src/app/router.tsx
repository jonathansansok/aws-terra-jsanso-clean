import { createBrowserRouter, Navigate } from "react-router-dom"
import AppShell from "../components/layout/AppShell"
import ProductsPage from "../features/products/ProductsPage"
import OrdersPage from "../features/orders/OrdersPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: "products", element: <ProductsPage /> },
      { path: "orders", element: <OrdersPage /> },
    ],
  },
])
