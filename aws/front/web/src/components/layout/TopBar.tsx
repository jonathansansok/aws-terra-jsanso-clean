import { Separator } from "../ui/separator"
import ModeToggle from "../mode-toggle"

export default function TopBar() {
  console.log("[TopBar] render")
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">POS Admin</div>
          <div className="text-xs text-muted-foreground">React + TS + shadcn + Tailwind</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-xs text-muted-foreground sm:block">env: {import.meta.env.MODE}</div>
          <ModeToggle />
        </div>
      </div>
      <Separator className="mt-3" />
    </div>
  )
}
