import { Outlet } from "@tanstack/react-router"

import type { SessionDto } from "@/shared/validation/dtos/auth"

import { AppNav } from "./AppNav"

type AppLayoutProps = {
  session: SessionDto
}

export function AppLayout({ session }: AppLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[240px_1fr]">
      <AppNav />
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="font-medium">{session.user.displayName}</p>
          </div>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
