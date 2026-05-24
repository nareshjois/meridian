import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"

async function requireAuthenticatedContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, groups, customers } = getServicesImpl()
  const sessionId = readSessionIdFromCookie()
  if (!sessionId) {
    throw redirect({ to: "/auth/login" })
  }

  const session = await auth.getSession(sessionId)
  if (!session.ok || !session.data) {
    throw redirect({ to: "/auth/login" })
  }

  return {
    ctx: createServiceContext(session.data),
    groups,
    customers,
  }
}

const groupListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["planning", "active", "completed"]).optional(),
})

export const loadGroupsIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => groupListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, groups } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["groups.read"])

    const result = await groups.listGroups(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        groups: result.data,
      },
    } satisfies AppLoaderResult<{
      groups: (typeof result)["data"]
    }>
  })

const loadGroupDetailInputSchema = z.object({
  groupId: idSchema,
})

export const loadGroupDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => loadGroupDetailInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { ctx, groups, customers } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["groups.read"])

    const groupResult = await groups.getGroupDetail(ctx, data.groupId)
    if (!groupResult.ok) {
      throw new Error(groupResult.error.message)
    }

    const membersResult = await groups.listMembers(ctx, data.groupId)
    if (!membersResult.ok) {
      throw new Error(membersResult.error.message)
    }

    const picker = await customers.listCustomers(ctx, {
      page: 1,
      pageSize: 50,
      sortDirection: "asc",
      status: "active",
    })
    const customerPicker =
      picker.ok && picker.data.items.length > 0
        ? picker.data.items.map((item) => ({
            id: item.id,
            displayName: item.displayName,
          }))
        : []

    return {
      data: {
        group: groupResult.data,
        members: membersResult.data,
        customerPicker,
      },
    } satisfies AppLoaderResult<{
      group: (typeof groupResult)["data"]
      members: (typeof membersResult)["data"]
      customerPicker: { id: string; displayName: string }[]
    }>
  })
