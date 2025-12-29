// aws/front/web/src/components/layout/AppShell.tsx
import { Outlet } from "react-router-dom"
import SideNav from "./SideNav"
import TopBar from "./TopBar"

export default function AppShell() {
  console.log("[AppShell] render")

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fondo con “depth” (no negro plano) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px circle at 10% 0%, rgba(99,102,241,0.16), transparent 55%)," +
            "radial-gradient(900px circle at 90% 100%, rgba(16,185,129,0.10), transparent 55%)," +
            "linear-gradient(to bottom, rgba(255,255,255,0.02), transparent 60%)",
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 md:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 md:block">
          <SideNav />
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Sticky top bar */}
          <div className="sticky top-4 z-20">
            <TopBar />
          </div>

          {/* Content shell */}
          <main
            className={[
              "min-h-[calc(100vh-7rem)]",
              "rounded-2xl border border-border/50",
              "bg-card/60 backdrop-blur",
              "shadow-sm",
              "p-4 md:p-6",
            ].join(" ")}
          >
            <div className="mb-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">env</span>: {import.meta.env.MODE}
              </div>
            </div>

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
