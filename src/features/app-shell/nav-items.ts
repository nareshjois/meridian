import type { LucideIcon } from "lucide-react"
import {
  Building2Icon,
  CalendarDaysIcon,
  FileTextIcon,
  HomeIcon,
  CalculatorIcon,
  LayoutDashboardIcon,
  PackageIcon,
  UserCircleIcon,
  UserCogIcon,
  UsersRoundIcon,
} from "lucide-react"

export type AppNavItem = {
  label: string
  to: string
  icon: LucideIcon
  exact?: boolean
}

export type AppNavGroup = {
  label: string
  items: AppNavItem[]
}

export const appNavGroups: AppNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/app",
        icon: LayoutDashboardIcon,
        exact: true,
      },
    ],
  },
  {
    label: "Daily actions",
    items: [
      { label: "Quotes", to: "/app/quotes", icon: FileTextIcon },
      { label: "Bookings", to: "/app/bookings", icon: CalendarDaysIcon },
      { label: "Customers", to: "/app/customers", icon: UserCircleIcon },
      { label: "Families", to: "/app/customer-families", icon: HomeIcon },
      { label: "Groups", to: "/app/groups", icon: UsersRoundIcon },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Booking services",
        to: "/app/booking-services",
        icon: PackageIcon,
      },
      { label: "Vendors", to: "/app/vendors", icon: Building2Icon },
      { label: "Users", to: "/app/users", icon: UserCogIcon },
      { label: "Accounting", to: "/app/accounting", icon: CalculatorIcon },
    ],
  },
]

export const appNavItems = appNavGroups.flatMap((group) => group.items)

export const appRouteLabels: Record<string, string> = {
  app: "Dashboard",
  users: "Team members",
  customers: "Customers",
  new: "New",
  "customer-families": "Families",
  groups: "Groups",
  "booking-services": "Booking services",
  quotes: "Quotes",
  bookings: "Bookings",
  convert: "Convert to booking",
  vendors: "Vendors",
  bills: "Bills",
  profile: "Profile",
  password: "Change password",
  accounting: "Accounting",
  journal: "Journal",
  accounts: "Chart of accounts",
  reports: "Reports",
  "trial-balance": "Trial balance",
  ledger: "General ledger",
  ar: "Accounts receivable",
  ap: "Accounts payable",
}

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
