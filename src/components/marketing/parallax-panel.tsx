import { useEffect, useRef } from "react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ParallaxPanelProps = {
  children: ReactNode
  className?: string
  speed?: number
}

export function ParallaxPanel({
  children,
  className,
  speed = 0.14,
}: ParallaxPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current

    if (!panel) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      panel.style.transform = "none"
      return
    }

    let frame = 0

    const updatePosition = () => {
      const rect = panel.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const panelCenter = rect.top + rect.height / 2
      const offset = (viewportCenter - panelCenter) * speed

      panel.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
    }

    const requestUpdate = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0
        updatePosition()
      })
    }

    updatePosition()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [speed])

  return (
    <div
      ref={panelRef}
      className={cn("transform-gpu will-change-transform", className)}
    >
      {children}
    </div>
  )
}
