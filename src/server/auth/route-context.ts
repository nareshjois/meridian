import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import type { AppRouteContext } from "@/shared/routes/contracts"

import { createAppRouteContext } from "./guard"

const appRouteContextInputSchema = z.object({
  redirectSearch: z
    .record(z.string(), z.string().optional())
    .optional(),
})

export const getAppRouteContextFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    appRouteContextInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<AppRouteContext> => {
    const { ensureUserDomainReadyImpl } = await import(
      "@/server/auth/bootstrap.impl.server"
    )
    await ensureUserDomainReadyImpl()

    return createAppRouteContext({
      redirectSearch: data.redirectSearch,
    })
  })
