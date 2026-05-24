import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import type { RouteActionResult } from "@/shared/routes/contracts"
import type { SessionDto } from "@/shared/validation/dtos/auth"
import { activateInviteFn } from "@/server/services/users/actions"
import { activateSearchSchema } from "@/shared/validation/dtos/auth"

export const Route = createFileRoute("/auth/activate")({
  validateSearch: (search: Record<string, unknown>) =>
    activateSearchSchema.parse(search),
  component: ActivatePage,
})

function ActivatePage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setMessage("Activation token is missing from the invite link.")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = (await activateInviteFn({
        data: { token, displayName, password },
      })) as RouteActionResult<SessionDto>

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      await navigate({ to: "/app" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          Meridian invite
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Activate your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a display name and password to join your agency workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1 text-sm">
          <span>Display name</span>
          <input
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          {isSubmitting ? "Activating..." : "Activate and sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {message}
      </p>

      <Link to="/auth/login" className="mt-8 text-sm text-muted-foreground hover:text-foreground">
        Already activated? Sign in
      </Link>
    </main>
  )
}
