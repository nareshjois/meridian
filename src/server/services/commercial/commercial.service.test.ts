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
      phoneCountryCode: "+91",
      phone: null,
      address: null,
      city: null,
      state: null,
      countryCode: "IN",
      dateOfBirth: null,
      passportNumber: null,
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
      currency: "INR",
      items: [
        {
          bookingServiceId: flight!.id,
          description: "Round trip",
          quantity: 2,
          unitPriceCents: 50_000,
          fields: {
            start_datetime: "2026-07-01T09:00",
            end_datetime: "2026-07-08T18:00",
          },
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
      currency: "INR",
      totalReceivableCents: 100_000,
    })
    expect(event.eventType).toBe("commercial.booking.confirmed")
  })

  it("validates quote item fields and copies them on conversion", async () => {
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
      displayName: "Field Test Traveler",
      email: "fields@example.com",
      phoneCountryCode: "+91",
      phone: null,
      address: null,
      city: null,
      state: null,
      countryCode: "IN",
      dateOfBirth: null,
      passportNumber: null,
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

    const fieldsUpdated = await services.bookingServices.updateServiceFields(
      ctx,
      {
        serviceId: flight!.id,
        quoteFields: [
          {
            key: "pnr",
            label: "PNR",
            type: "text",
            required: false,
          },
        ],
        bookingFields: [
          {
            key: "pnr",
            label: "PNR",
            type: "text",
            required: false,
          },
        ],
      },
    )
    expect(fieldsUpdated.ok).toBe(true)

    const missingFields = await services.quotes.createQuote(ctx, {
      customerId,
      currency: "INR",
      items: [
        {
          bookingServiceId: flight!.id,
          description: "One way",
          quantity: 1,
          unitPriceCents: 25_000,
          fields: {},
        },
      ],
    })
    expect(missingFields.ok).toBe(false)

    const created = await services.quotes.createQuote(ctx, {
      customerId,
      currency: "INR",
      items: [
        {
          bookingServiceId: flight!.id,
          description: "One way",
          quantity: 1,
          unitPriceCents: 25_000,
          fields: {
            start_datetime: "2026-06-01T08:00",
            end_datetime: "2026-06-01T20:00",
          },
        },
      ],
    })
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    await services.quotes.transitionQuoteStatus(ctx, {
      quoteId: created.data.id,
      status: "sent",
    })
    await services.quotes.transitionQuoteStatus(ctx, {
      quoteId: created.data.id,
      status: "accepted",
    })

    const converted = await services.quotes.convertToBooking(ctx, {
      quoteId: created.data.id,
    })
    expect(converted.ok).toBe(true)
    if (!converted.ok) {
      return
    }

    const booking = await services.bookings.getBookingById(
      ctx,
      converted.data.id,
    )
    expect(booking.ok).toBe(true)
    if (!booking.ok) {
      return
    }

    expect(booking.data.items).toHaveLength(1)
    expect(booking.data.items[0]?.fieldsJson).toContain("start_datetime")
    expect(booking.data.items[0]?.fieldsJson).toContain("2026-06-01")
    expect(booking.data.items[0]?.fieldsJson).toContain("pnr")
  })
})
