"use client"

import { Link, useRouterState } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { appRouteLabels } from "./nav-items"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function labelForSegment(segment: string, index: number, segments: string[]) {
  if (UUID_PATTERN.test(segment)) {
    return "Details"
  }

  if (segment in appRouteLabels) {
    return appRouteLabels[segment]!
  }

  if (index === segments.length - 1 && segments[0] === "app" && segments.length === 1) {
    return "Dashboard"
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0 || segments[0] !== "app") {
    return null
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const label = labelForSegment(segment, index, segments)
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="contents">
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link to={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
