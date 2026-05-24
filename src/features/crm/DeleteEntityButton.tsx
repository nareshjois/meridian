import { useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type DeleteEntityButtonProps = {
  entityLabel: string
  confirmMessage: string
  disabled?: boolean
  onDelete: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>
  onSuccess: () => void | Promise<void>
}

export function DeleteEntityButton({
  entityLabel,
  confirmMessage,
  disabled = false,
  onDelete,
  onSuccess,
}: DeleteEntityButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    if (disabled || isDeleting) {
      return
    }

    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const result = await onDelete()
      if (!result.ok) {
        setError(result.error.message)
        return
      }

      await onSuccess()
      await router.invalidate()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-6">
      <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
      <p className="text-sm text-muted-foreground">
        Permanently delete this {entityLabel}. This cannot be undone.
      </p>
      <Button
        type="button"
        variant="destructive"
        disabled={disabled || isDeleting}
        onClick={() => void handleDelete()}
      >
        {isDeleting ? "Deleting..." : `Delete ${entityLabel}`}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  )
}
