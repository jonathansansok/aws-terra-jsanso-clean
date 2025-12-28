import { Outlet } from "react-router-dom"
import SideNav from "./SideNav"
import TopBar from "./TopBar"

export default function AppShell() {
  console.log("[AppShell] render")
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <SideNav />
        </aside>

        <main className="space-y-6">
          <TopBar />
          <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
