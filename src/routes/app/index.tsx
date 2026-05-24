import { createFileRoute } from "@tanstack/react-router"

import type { AppLoaderResult } from "@/shared/routes/contracts"

type DashboardLoaderData = AppLoaderResult<{
  headline: string
}>

export const Route = createFileRoute("/app/")({
  loader: async (): Promise<DashboardLoaderData> => {
    return {
      data: {
        headline: "Meridian operations dashboard",
      },
    }
  },
  component: AppDashboardPage,
})

function AppDashboardPage() {
  const { data } = Route.useLoaderData()

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{data.headline}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Foundation shell is active. Domain modules mount under this layout as
        downstream workstreams land their routes.
      </p>
    </section>
  )
}
