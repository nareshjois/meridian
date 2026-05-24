import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Compass } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"

import type { LoginSearchParams, RouteActionResult } from "@/shared/routes/contracts"
import type { SessionDto } from "@/shared/validation/dtos/auth"
import type { LoginFormErrors } from "@/lib/auth-form"

import { ShaderAurora } from "@/components/marketing/shader-aurora"
import { buttonVariants } from "@/components/ui/button-variants"
import { getLoginFormPayload, validateLoginForm } from "@/lib/auth-form"
import { loginFn } from "@/server/services/users/actions"
import { getDevLoginPrefill } from "@/shared/dev/credentials"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const devPrefill = getDevLoginPrefill()
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [statusMessage, setStatusMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = getLoginFormPayload(formData)
    const validationErrors = validateLoginForm(payload)

    setErrors(validationErrors)
    setStatusMessage("")

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = (await loginFn({
        data: { email: payload.email, password: payload.password },
      })) as RouteActionResult<SessionDto>

      if (!result.ok) {
        setStatusMessage(result.error.message)
        return
      }

      const destination =
        redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/app"

      await navigate({ to: destination })
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Sign in failed. Try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-svh bg-[#031111] text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative isolate hidden overflow-hidden lg:block">
        <ShaderAurora className="absolute inset-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(3,17,17,0.1),#031111_95%)]" />
        <div className="relative flex min-h-svh flex-col justify-between p-10">
          <Link
            to="/"
            className="flex w-fit items-center gap-2 rounded-full text-sm font-semibold tracking-tight text-white outline-none focus-visible:ring-3 focus-visible:ring-teal-200/70"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur">
              <Compass className="size-4 text-teal-100" aria-hidden="true" />
            </span>
            Meridian
          </Link>

          <div className="max-w-2xl pb-12">
            <p className="text-sm font-semibold tracking-[0.28em] text-teal-200/70 uppercase">
              Agency desk
            </p>
            <h1 className="mt-5 font-heading text-6xl leading-[0.95] font-semibold tracking-[-0.06em] text-balance">
              Pick up every trip exactly where your team left it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50/76">
              Sign back into the workspace for travelers, family records, group
              departures, quote versions, bookings, vendors, and the accounting
              trail behind each journey.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-teal-50/78 transition outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-teal-200/70"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Link>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-teal-100/68 uppercase">
              Staff access
            </span>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-white/[0.08] p-2 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#071817]/92 p-6 sm:p-8">
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-teal-200/70 uppercase">
                  Meridian login
                </p>
                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.035em] text-white">
                  Return to your travel operations desk.
                </h2>
                <p className="mt-3 text-sm leading-6 text-teal-50/68">
                  Use your agency identity to continue managing customers,
                  quotes, bookings, supplier bills, and follow-ups.
                </p>
              </div>

              <form
                className="mt-8 space-y-5"
                noValidate
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-teal-50/86"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={devPrefill.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-base text-white transition outline-none placeholder:text-teal-50/34 focus:border-teal-200/70 focus:ring-3 focus:ring-teal-200/20"
                    placeholder="agent@agency.com"
                  />
                  {errors.email ? (
                    <p id="email-error" className="mt-2 text-sm text-teal-100">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-teal-50/86"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    defaultValue={devPrefill.password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-base text-white transition outline-none placeholder:text-teal-50/34 focus:border-teal-200/70 focus:ring-3 focus:ring-teal-200/20"
                    placeholder="Enter your password"
                  />
                  {errors.password ? (
                    <p
                      id="password-error"
                      className="mt-2 text-sm text-teal-100"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm text-teal-50/76">
                    <input
                      name="remember"
                      type="checkbox"
                      className="size-4 rounded border-white/20 bg-white/10 accent-teal-200"
                    />
                    Keep this desk signed in
                  </label>
                  <a
                    href="mailto:support@meridian.example"
                    className="text-sm font-medium text-teal-100 underline-offset-4 transition hover:text-white hover:underline focus-visible:ring-3 focus-visible:ring-teal-200/70 focus-visible:outline-none"
                  >
                    Need access?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 w-full rounded-full bg-teal-200 text-base text-[#05221d] shadow-xl shadow-teal-950/30 hover:bg-teal-100"
                  )}
                >
                  {isSubmitting ? "Checking..." : "Continue to bookings"}
                </button>

                <p
                  className="min-h-6 text-center text-sm text-teal-50/68"
                  aria-live="polite"
                >
                  {statusMessage ||
                    (import.meta.env.DEV
                      ? "Dev admin credentials are prefilled. Submit to sign in."
                      : "Login stays compatible with the frozen auth service contract.")}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
