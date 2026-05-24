import { createFileRoute } from "@tanstack/react-router"

import { AppLayout } from "@/features/app-shell/AppLayout"
import { getAppRouteContextFn } from "@/server/auth/route-context"
import { getRedirectSearch } from "@/server/auth/guard"
import type { AppRouteContext } from "@/shared/routes/contracts"

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }): Promise<AppRouteContext> => {
    return getAppRouteContextFn({
      data: { redirectSearch: getRedirectSearch(location.href) },
    })
  },
  component: AppRouteComponent,
})

function AppRouteComponent() {
  const { session } = Route.useRouteContext()

  return <AppLayout session={session} />
}
