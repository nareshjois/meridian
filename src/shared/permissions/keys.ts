/**
 * Frozen permission key registry for RBAC enforcement.
 * Downstream teams must not rename keys without a coordinated migration.
 */
export const PERMISSION_KEYS = {
  // Users & auth
  "users.read": "users.read",
  "users.write": "users.write",
  "users.invite": "users.invite",
  "users.manage_roles": "users.manage_roles",

  // CRM
  "customers.read": "customers.read",
  "customers.write": "customers.write",
  "customer_families.read": "customer_families.read",
  "customer_families.write": "customer_families.write",
  "groups.read": "groups.read",
  "groups.write": "groups.write",

  // Commercial
  "booking_services.read": "booking_services.read",
  "booking_services.write": "booking_services.write",
  "quotes.read": "quotes.read",
  "quotes.write": "quotes.write",
  "quotes.send": "quotes.send",
  "quotes.convert": "quotes.convert",
  "bookings.read": "bookings.read",
  "bookings.write": "bookings.write",
  "bookings.confirm": "bookings.confirm",

  // Vendors
  "vendors.read": "vendors.read",
  "vendors.write": "vendors.write",
  "vendor_bills.read": "vendor_bills.read",
  "vendor_bills.write": "vendor_bills.write",
  "vendor_payments.write": "vendor_payments.write",

  // Forms
  "forms.templates.read": "forms.templates.read",
  "forms.templates.write": "forms.templates.write",
  "forms.requests.write": "forms.requests.write",
  "forms.submissions.review": "forms.submissions.review",

  // Accounting
  "accounting.accounts.read": "accounting.accounts.read",
  "accounting.accounts.write": "accounting.accounts.write",
  "accounting.journals.read": "accounting.journals.read",
  "accounting.journals.post": "accounting.journals.post",
  "accounting.journals.reverse": "accounting.journals.reverse",
  "accounting.reports.read": "accounting.reports.read",
} as const

export type PermissionKey =
  (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS]

export const PERMISSION_MODULES = {
  users: [
    PERMISSION_KEYS["users.read"],
    PERMISSION_KEYS["users.write"],
    PERMISSION_KEYS["users.invite"],
    PERMISSION_KEYS["users.manage_roles"],
  ],
  crm: [
    PERMISSION_KEYS["customers.read"],
    PERMISSION_KEYS["customers.write"],
    PERMISSION_KEYS["customer_families.read"],
    PERMISSION_KEYS["customer_families.write"],
    PERMISSION_KEYS["groups.read"],
    PERMISSION_KEYS["groups.write"],
  ],
  commercial: [
    PERMISSION_KEYS["booking_services.read"],
    PERMISSION_KEYS["booking_services.write"],
    PERMISSION_KEYS["quotes.read"],
    PERMISSION_KEYS["quotes.write"],
    PERMISSION_KEYS["quotes.send"],
    PERMISSION_KEYS["quotes.convert"],
    PERMISSION_KEYS["bookings.read"],
    PERMISSION_KEYS["bookings.write"],
    PERMISSION_KEYS["bookings.confirm"],
  ],
  vendors: [
    PERMISSION_KEYS["vendors.read"],
    PERMISSION_KEYS["vendors.write"],
    PERMISSION_KEYS["vendor_bills.read"],
    PERMISSION_KEYS["vendor_bills.write"],
    PERMISSION_KEYS["vendor_payments.write"],
  ],
  forms: [
    PERMISSION_KEYS["forms.templates.read"],
    PERMISSION_KEYS["forms.templates.write"],
    PERMISSION_KEYS["forms.requests.write"],
    PERMISSION_KEYS["forms.submissions.review"],
  ],
  accounting: [
    PERMISSION_KEYS["accounting.accounts.read"],
    PERMISSION_KEYS["accounting.accounts.write"],
    PERMISSION_KEYS["accounting.journals.read"],
    PERMISSION_KEYS["accounting.journals.post"],
    PERMISSION_KEYS["accounting.journals.reverse"],
    PERMISSION_KEYS["accounting.reports.read"],
  ],
} as const satisfies Record<string, readonly PermissionKey[]>

export const ALL_PERMISSION_KEYS = Object.values(PERMISSION_KEYS)
