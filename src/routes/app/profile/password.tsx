import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changeOwnPasswordFn } from "@/server/services/users/actions"

export const Route = createFileRoute("/app/profile/password")({
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await changeOwnPasswordFn({
        data: { currentPassword, newPassword },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMessage("Password updated.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Change password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password with at least 8 characters.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Enter your current password, then your new password twice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {message ? (
              <p className="text-sm text-muted-foreground" role="status">
                {message}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-3 border-t border-border">
            <Button type="button" variant="outline" render={<Link to="/app/profile" />}>
              Back to profile
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
