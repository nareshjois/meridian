import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"
import { parseServiceFieldsJson } from "@/shared/commercial/service-fields"

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

const loadBookingServiceDetailInputSchema = z.object({
  serviceId: idSchema,
})

export const loadBookingServiceDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadBookingServiceDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["booking_services.read"])

    const result = await services.bookingServices.getServiceById(
      ctx,
      data.serviceId,
    )
    if (!result.ok) {
      throw new Error(result.error.message)
    }

  return {
      data: {
        service: result.data,
        quoteFields: parseServiceFieldsJson(result.data.quoteFieldsSchemaJson),
        bookingFields: parseServiceFieldsJson(
          result.data.bookingFieldsSchemaJson,
        ),
      },
    } satisfies AppLoaderResult<{
      service: (typeof result)["data"]
      quoteFields: ReturnType<typeof parseServiceFieldsJson>
      bookingFields: ReturnType<typeof parseServiceFieldsJson>
    }>
  })
