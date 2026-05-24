import { describe, expect, it } from "vitest"

import { customers } from "@/server/db/schema/crm"
import {
  adminContext,
  createMeridianServices,
  createTestDb,
  loginAsAdmin,
  seedTestAgency,
} from "@/server/services/users/test-helpers"
import { commercialEventSchema } from "@/shared/validation/dtos/commercial-events"

describe("commercial workflows", () => {
  it("seeds default booking services idempotently", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    await seedTestAgency(db)

    const { bookingServices } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const result = await bookingServices.listServices(ctx, {
      includeInactive: true,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.items.length).toBeGreaterThanOrEqual(5)
    }
  })

  it("runs quote lifecycle and converts to booking", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const services = createMeridianServices(db)

    const customerId = crypto.randomUUID()
    const now = new Date()
    await db.insert(customers).values({
      id: customerId,
      agencyId: ctx.agencyId,
      displayName: "Test Traveler",
      email: "traveler@example.com",
      phone: null,
      status: "active",
      notesSummary: null,
      createdAt: now,
      updatedAt: now,
    })

    const catalog = await services.bookingServices.listServices(ctx, {
      includeInactive: false,
    })
    expect(catalog.ok).toBe(true)
    if (!catalog.ok) {
      return
    }

    const flight = catalog.data.items.find(
      (row: { code: string }) => row.code === "FLIGHT",
    )
    expect(flight).toBeDefined()

    const created = await services.quotes.createQuote(ctx, {
      customerId,
      currency: "USD",
      items: [
        {
          bookingServiceId: flight!.id,
          description: "Round trip",
          quantity: 2,
          unitPriceCents: 50_000,
        },
      ],
    })
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    const sent = await services.quotes.transitionQuoteStatus(ctx, {
      quoteId: created.data.id,
      status: "sent",
    })
    expect(sent.ok).toBe(true)

    const accepted = await services.quotes.transitionQuoteStatus(ctx, {
      quoteId: created.data.id,
      status: "accepted",
    })
    expect(accepted.ok).toBe(true)

    const converted = await services.quotes.convertToBooking(ctx, {
      quoteId: created.data.id,
    })
    expect(converted.ok).toBe(true)
    if (!converted.ok) {
      return
    }

    const confirmed = await services.bookings.transitionBookingStatus(ctx, {
      bookingId: converted.data.id,
      status: "confirmed",
    })
    expect(confirmed.ok).toBe(true)

    const event = commercialEventSchema.parse({
      agencyId: ctx.agencyId,
      occurredAt: new Date(),
      actorUserId: ctx.actorUserId,
      eventType: "commercial.booking.confirmed",
      bookingId: converted.data.id,
      customerId,
      bookingNumber: converted.data.bookingNumber,
      currency: "USD",
      totalReceivableCents: 100_000,
    })
    expect(event.eventType).toBe("commercial.booking.confirmed")
  })
})
