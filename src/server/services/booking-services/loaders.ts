import { createServerFn } from "@tanstack/react-start"

import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"

import { requireCommercialContext } from "../commercial/auth-context"

export const loadBookingServicesIndexFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["booking_services.read"])

    const result = await services.bookingServices.listServices(ctx, {
      includeInactive: true,
    })
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: { services: result.data },
    } satisfies AppLoaderResult<{ services: (typeof result)["data"] }>
  },
)
