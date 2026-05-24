import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", to: "/app" as const },
  { label: "Users", to: "/app/users" as const },
] as const

/** Planned nav targets for downstream route workstreams. */
export const plannedAppNavTargets = [
  "/app/users",
  "/app/customers",
  "/app/customer-families",
  "/app/groups",
  "/app/booking-services",
  "/app/quotes",
  "/app/bookings",
  "/app/vendors",
  "/app/accounting",
] as const

export function AppNav() {
  return (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-1 border-r border-border bg-muted/30 p-4"
    >
      <div className="mb-4 px-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Meridian
        </p>
        <p className="text-sm font-semibold">Operations</p>
      </div>
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                "hover:bg-background hover:text-foreground",
                "[&.active]:bg-background [&.active]:font-medium [&.active]:text-foreground",
              )}
              activeOptions={{ exact: item.to === "/app" }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
