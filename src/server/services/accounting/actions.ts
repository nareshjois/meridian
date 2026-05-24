import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  accountCreateInputSchema,
  postJournalEntryInputSchema,
  reverseJournalEntryInputSchema,
} from "@/shared/validation/dtos/accounting"

function toActionError(error: ServiceError): RouteServiceError {
  return {
    code: error.code,
    message: error.message,
  }
}

async function requireAccountingContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, accounting } = getServicesImpl()
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
    accounting,
  }
}

export const createAccountFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    accountCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, accounting } = await requireAccountingContext()
    const result = await accounting.createAccount(ctx, data)
    if (!result.ok) {
      return { ok: false, error: toActionError(result.error) }
    }
    return { ok: true, data: result.data } satisfies RouteActionResult<
      typeof result.data
    >
  })

export const postJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    postJournalEntryInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, accounting } = await requireAccountingContext()
    const result = await accounting.postEntry(ctx, data)
    if (!result.ok) {
      return { ok: false, error: toActionError(result.error) }
    }
    return { ok: true, data: result.data }
  })

export const reverseJournalEntryFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    reverseJournalEntryInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, accounting } = await requireAccountingContext()
    const result = await accounting.reverseEntry(ctx, data)
    if (!result.ok) {
      return { ok: false, error: toActionError(result.error) }
    }
    return { ok: true, data: result.data }
  })
