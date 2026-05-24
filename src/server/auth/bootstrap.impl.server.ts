import { registerSessionResolver } from "@/server/auth/session"
import { ensureDatabaseMigrated } from "@/server/db/migrate.server"
import { getDb } from "@/server/db/client"
import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createMeridianServices, ensureDevSeed } from "@/server/services/users"
import type { UserService } from "@/server/services/users/user.service"

let bootstrapped = false

export async function ensureUserDomainReadyImpl() {
  if (bootstrapped) {
    return
  }

  await ensureDatabaseMigrated()
  const db = getDb()

  if (process.env.NODE_ENV !== "production") {
    await ensureDevSeed(db)
  }

  registerSessionResolver(async () => {
    const sessionId = readSessionIdFromCookie()
    if (!sessionId) {
      return null
    }

    const { auth } = createMeridianServices(db)
    const result = await auth.getSession(sessionId)
    return result.ok ? result.data : null
  })

  bootstrapped = true
}

export function getServicesImpl(): Pick<
  ReturnType<typeof createMeridianServices>,
  "auth" | "users"
> & { users: UserService } {
  return createMeridianServices(getDb())
}
